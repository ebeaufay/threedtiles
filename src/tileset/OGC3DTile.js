import * as THREE from 'three';
import { OBB } from "../geometry/obb";
import { TileLoader } from "./TileLoader";
import { v4 as uuidv4 } from "uuid";
import { setIntervalAsync } from 'set-interval-async/dynamic';
// import { clearIntervalAsync } from 'set-interval-async';
const path = require('path');

const tempSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0, 1));


class OGC3DTile extends THREE.Object3D {

    /**
     * 
     * @param {
     *   json: optional,
     *   url: optional,
     *   rootPath: optional,
     *   parentGeometricError: optional,
     *   parentBoundingVolume: optional,
     *   parentRefinement: optional,
     *   geometricErrorMultiplier: Double,
     *   loadOutsideView: Boolean,
     *   tileLoader : TileLoader,
     *   stats: TilesetStats
     * } properties 
     */
    constructor(properties) {
        super();
        const self = this;
        this.uuid = uuidv4();
        if(!!properties.tileLoader){
            this.tileLoader = properties.tileLoader;
        }else{
            this.tileLoader = new TileLoader(mesh=>{
                mesh.material.wireframe = false;
                mesh.material.side = THREE.DoubleSide;
            });
        }
        // set properties general to the entire tileset
        this.geometricErrorMultiplier = !!properties.geometricErrorMultiplier ? properties.geometricErrorMultiplier : 1.0;
        if(properties.stats){
            // Automatic geometric error multiplier
            this.stats = properties.stats;
            setIntervalAsync(()=>{
                const framerate = self.stats.fps();
                if(framerate<0) return;
                if(framerate<58){
                    self.setGeometricErrorMultiplier(Math.max(0.05, self.geometricErrorMultiplier - 0.05));
                }else if(framerate>58){
                    self.setGeometricErrorMultiplier(self.geometricErrorMultiplier + 0.05);
                }
                self.setGeometricErrorMultiplier(self.geometricErrorMultiplier * (self.stats.fps()/60));
            }, 1000);
        }

        this.meshCallback = properties.meshCallback;
        this.loadOutsideView = properties.loadOutsideView;

        // declare properties specific to the tile for clarity
        this.childrenTiles = [];
        this.meshContent;
        this.tileContent;
        this.refinement; // defaults to "REPLACE"
        this.rootPath;
        this.geometricError;
        this.boundingVolume;
        this.json; // the json corresponding to this tile
        this.materialVisibility = false;
        this.inFrustum = true;
        this.level = properties.level ? properties.level : 0;
        this.hasMeshContent = false; // true when the provided json has a content field pointing to a B3DM file
        this.hasUnloadedJSONContent = false; // true when the provided json has a content field pointing to a JSON file that is not yet loaded

        if (!!properties.json) { // If this tile is created as a child of another tile, properties.json is not null
            self.setup(properties);
        } else if (properties.url) { // If only the url to the tileset.json is provided
            self.controller = new AbortController();
            fetch(properties.url, { signal: self.controller.signal }).then(result => {
                if (!result.ok) {
                    throw new Error(`couldn't load "${properties.url}". Request failed with status ${result.status} : ${result.statusText}`);
                }
                result.json().then(json => self.setup({ rootPath: path.dirname(properties.url), json: json }))
            });
        }
    }

    setup(properties) {
        if (!!properties.json.root) {
            this.json = properties.json.root;
            if (!this.json.refinement) this.json.refinement = properties.json.refinement;
            if (!this.json.geometricError) this.json.geometricError = properties.json.geometricError;
            if (!this.json.transform) this.json.transform = properties.json.transform;
            if (!this.json.boundingVolume) this.json.boundingVolume = properties.json.boundingVolume;
        } else {
            this.json = properties.json;
        }
        this.rootPath = !!properties.json.rootPath ? properties.json.rootPath : properties.rootPath;

        // decode refinement
        if (!!this.json.refinement) {
            this.refinement = this.json.refinement;
        } else {
            this.refinement = properties.parentRefinement;
        }
        // decode geometric error
        if (!!this.json.geometricError) {
            this.geometricError = this.json.geometricError;
        } else {
            this.geometricError = properties.parentGeometricError;
        }
        // decode transform
        if (!!this.json.transform) {
            let mat = new THREE.Matrix4();
            mat.elements = this.json.transform;
            this.applyMatrix4(mat);
        }
        // decode volume
        if (!!this.json.boundingVolume) {
            if (!!this.json.boundingVolume.box) {
                this.boundingVolume = new OBB(this.json.boundingVolume.box);
            } else if (!!this.json.boundingVolume.region) {
                const region = this.json.boundingVolume.region;
                this.boundingVolume = new THREE.Box3(new THREE.Vector3(region[0], region[2], region[4]), new THREE.Vector3(region[1], region[3], region[5]));
            } else if (!!this.json.boundingVolume.sphere) {
                const sphere = this.json.boundingVolume.sphere;
                this.boundingVolume = new THREE.Sphere(new THREE.Vector3(sphere[0], sphere[2], -sphere[1]), sphere[3]);
            } else {
                this.boundingVolume = properties.parentBoundingVolume;
            }
        } else {
            this.boundingVolume = properties.parentBoundingVolume;
        }

        if (!!this.json.content) { //if there is a content, json or otherwise, schedule it to be loaded 
            if (!!this.json.content.uri && this.json.content.uri.includes("json")) {
                this.hasUnloadedJSONContent = true;
            } else if (!!this.json.content.url && this.json.content.url.includes("json")) {
                this.hasUnloadedJSONContent = true;
            } else {
                this.hasMeshContent = true;
            }
            this.load();
            //scheduleLoadTile(this);
        }
    }
    load() {
        var self = this;
        if(self.deleted) return;
        if (!!self.json.content) {
            let url;
            if (!!self.json.content.uri) {
                if (path.isAbsolute(self.json.content.uri)) {
                    url = self.json.content.uri;
                } else {
                    url = self.rootPath + path.sep + self.json.content.uri;
                }
            } else if (!!self.json.content.url) {
                if (path.isAbsolute(self.json.content.url)) {
                    url = self.json.content.url;
                } else {
                    url = self.rootPath + path.sep + self.json.content.url;
                }
            }

            if (!!url) {
                if(url.includes(".b3dm")){
                    self.contentURL = url;
                    self.tileLoader.get(this.uuid, url, mesh=>{
                        if(!!self.deleted) return;
                        mesh.traverse((o) => {
                            if (o.isMesh) {
                                o.material.visible = false;
                            }
                        });
                        self.add(mesh);
                        self.meshContent = mesh;
                    })
                }else if(url.includes(".json")){
                    self.controller = new AbortController();
                    fetch(url, { signal: self.controller.signal }).then(result => {
                        if (!result.ok) {
                            throw new Error(`couldn't load "${properties.url}". Request failed with status ${result.status} : ${result.statusText}`);
                        }
                        result.json().then(json => {
                            // when json content is downloaded, it is inserted into this tile's original JSON as a child
                            // and the content object is deleted from the original JSON
                            if (!self.json.children) self.json.children = [];
                            json.rootPath = path.dirname(url);
                            self.json.children.push(json);
                            delete self.json.content;
                            self.hasUnloadedJSONContent = false;
                        }).catch(error => { });
                    }).catch(error => {});
                }
                
            }
        }
    }

    dispose(){
        
        const self = this;
        self.deleted = true;
        this.traverse(function (element) {
            if(!!element.contentURL){
                self.tileLoader.invalidate(element.contentURL, element.uuid);
            }
            if (!!element.controller) { // abort tile request
                element.controller.abort();
            }
            
        });
        this.parent = null;
        this.dispatchEvent({ type: 'removed' });
    }
    disposeChildren() {
        var self = this;

        self.childrenTiles.forEach(tile => tile.dispose());
        self.childrenTiles = [];
        self.children = [];
        if (!!self.meshContent) self.children.push(self.meshContent);
    }


    update(camera) {
        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        this._update(camera, frustum);
    }
    _update(camera, frustum) {
        const self = this;

        self.childrenTiles.forEach(child => child._update(camera, frustum));
        if (!!self.boundingVolume && !!self.geometricError) {
            self.metric = self.calculateUpdateMetric(camera, frustum);
        }

        updateNodeVisibility(self.metric);
        updateTree(self.metric);
        trimTree(self.metric);


        function updateTree(metric) {
            // If this tile does not have mesh content but it has children
            if (metric < 0 && self.hasMeshContent) return;
            if (!self.hasMeshContent || (metric < self.geometricError && !!self.meshContent)) {
                if (!!self.json && !!self.json.children && self.childrenTiles.length != self.json.children.length) {
                    loadJsonChildren();
                    return;
                }
            }
        }

        function updateNodeVisibility(metric) {

            //doesn't have a mesh content
            if (!self.hasMeshContent) return;

            // mesh content not yet loaded
            if (!self.meshContent) {
                return;
            }

            // outside frustum
            if (metric < 0) {
                self.inFrustum = false;
                self.changeContentVisibility(!!self.loadOutsideView);
                return;
            } else {
                self.inFrustum = true;
            }

            // has no children
            if (self.childrenTiles.length == 0) {
                self.changeContentVisibility(true);
                return;
            }

            // has children
            if (metric >= self.geometricError) { // Ideal LOD or before ideal lod

                self.changeContentVisibility(true);
            } else if (metric < self.geometricError) { // Ideal LOD is past this one
                // if children are visible and have been displayed, can be hidden
                var allChildrenReady = true;
                self.childrenTiles.every(child => {

                    if (!child.isReady()) {
                        allChildrenReady = false;
                        return false;
                    }
                    return true;
                });
                if (allChildrenReady) {
                    self.changeContentVisibility(false);
                } else {
                    //self.changeContentVisibility(true);
                    
                }
            }
        }

        function trimTree(metric) {
            if (!self.hasMeshContent) return;
            if (metric < 0) { // outside frustum
                self.disposeChildren();
                return;
            }
            if (metric >= self.geometricError) {
                if (self.isReady()) {
                    self.disposeChildren();
                    return;
                }
            }

        }

        function loadJsonChildren() {
            self.json.children.forEach(childJSON => {
                let childTile = new OGC3DTile({
                    parentGeometricError: self.geometricError,
                    parentBoundingVolume: self.boundingVolume,
                    parentRefinement: self.refinement,
                    json: childJSON,
                    rootPath: self.rootPath,
                    geometricErrorMultiplier: self.geometricErrorMultiplier,
                    loadOutsideView: self.loadOutsideView,
                    level: self.level + 1,
                    tileLoader: self.tileLoader
                });
                self.childrenTiles.push(childTile);
                self.add(childTile);
            });
        }

    }

    /**
     * Node is ready if it is outside frustum, if it was drawn at least once or if all it's children are ready
     * @returns true if ready
     */
    isReady() {
        // if outside frustum
        if (!this.inFrustum) return true;

        // if json is not done loading
        if (this.hasUnloadedJSONContent) return false;

        // if this tile has no mesh content or if it's marked as visible false, look at children
        if ((!this.hasMeshContent || !this.meshContent || !this.materialVisibility) && this.childrenTiles.length > 0) {
            var allChildrenReady = true;
            this.childrenTiles.every(child => {
                if (!child.isReady()) {
                    allChildrenReady = false;
                    return false;
                }
                return true;
            });
            return allChildrenReady;
        }

        // if this tile has no mesh content
        if (!this.hasMeshContent) {
            return true;
        }
        // if mesh content not yet loaded
        if (!this.meshContent) {
            return false;
        }

        // if this tile has been marked to hide it's content
        if (!this.materialVisibility) {
            return false;
        }

        // if all meshes have been displayed once
        if (this.meshesDisplayed == this.meshesToDisplay) {
            return true;
        }

        return true;

    }




    changeContentVisibility(visibility) {
        const self = this;
        if (self.materialVisibility == visibility) {
            return;
        }
        self.materialVisibility = visibility
        self.meshesToDisplay = 0;
        self.meshesDisplayed = 0;
        if (!!self.meshContent.traverse) {
            self.meshContent.traverse(function (element) {
                if (element.material) setMeshVisibility(element, visibility);
            });
        } else if (!!self.meshContent.scenes) {
            self.meshContent.scenes.forEach(scene => scene.traverse(function (element) {
                if (element.material) setMeshVisibility(element, visibility);
            }));
        }

        function setMeshVisibility(mesh, visibility) {
            mesh.material.visible = visibility;
            if (!!visibility) {
                self.meshesToDisplay++;
                mesh.onAfterRender = () => {
                    delete mesh.onAfterRender;
                    self.meshesDisplayed++;
                };
            }

        }
    }
    calculateUpdateMetric(camera, frustum) {
        ////// return -1 if not in frustum
        if (this.boundingVolume instanceof OBB) {
            // box
            tempSphere.copy(this.boundingVolume.sphere);
            tempSphere.applyMatrix4(this.matrixWorld);
            if (!frustum.intersectsSphere(tempSphere)) return -1;
        } else if (this.boundingVolume instanceof THREE.Sphere) {
            //sphere
            tempSphere.copy(this.boundingVolume);
            tempSphere.applyMatrix4(this.matrixWorld);
            if (!frustum.intersectsSphere(tempSphere)) return -1;
        } else if (this.boundingVolume instanceof THREE.Box3) {
            // Region
            // Region not supported
            //throw Error("Region bounding volume not supported");
            return -1;
        }

        /////// return metric based on geometric error and distance
        if (this.boundingVolume instanceof OBB || this.boundingVolume instanceof THREE.Sphere) {
            // box
            const distance = Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius);
            if (distance == 0) {
                return 0;
            }
            const scale = this.matrixWorld.getMaxScaleOnAxis();
            return ((distance / 100) / this.geometricErrorMultiplier) / scale;
        } else if (this.boundingVolume instanceof THREE.Box3) {
            // Region
            // Region not supported
            //throw Error("Region bounding volume not supported");
            return -1;
        }

    }

    setGeometricErrorMultiplier(geometricErrorMultiplier) {
        this.geometricErrorMultiplier = geometricErrorMultiplier;
        this.childrenTiles.forEach(child => child.setGeometricErrorMultiplier(geometricErrorMultiplier));
    }
}
export { OGC3DTile };