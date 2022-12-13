import * as THREE from 'three';
import { OBB } from "../../geometry/obb";
import { v4 as uuidv4 } from "uuid";
import * as path from "path-browserify";
import * as _ from "lodash";

const tempSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0, 1));


class InstancedTile extends THREE.Object3D {

    /**
     * 
     * @param {
     *   json: optional,
     *   url: optional,
     *   rootPath: optional,
     *   parentGeometricError: optional,
     *   parentBoundingVolume: optional,
     *   parentRefinement: optional,
     *   loadOutsideView: Boolean,
     *   tileLoader : InstancedTileLoader,
     *   meshCallback: function,
     *   cameraOnLoad: camera,
     *   parentTile: OGC3DTile,
     *   onLoadCallback: function,
     *   static: Boolean
     * } properties 
     */
    constructor(properties) {
        super();
        const self = this;

        this.uuid = uuidv4();
        if (!!properties.tileLoader) {
            this.tileLoader = properties.tileLoader;
        } else {
            console.error("an instanced tileset must be provided an InstancedTilesetLoader");
        }
        // set properties general to the entire tileset
        this.master = properties.master;
        this.meshCallback = properties.meshCallback;
        this.loadOutsideView = properties.loadOutsideView;
        this.cameraOnLoad = properties.cameraOnLoad;
        this.parentTile = properties.parentTile;
        
        // declare properties specific to the tile for clarity
        this.childrenTiles = [];
        this.jsonChildren = [];
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

        this.deleted = false;
        this.abortController = new AbortController();

        if (!!properties.json) { // If this tile is created as a child of another tile, properties.json is not null
            this.rootPath = !!properties.json.rootPath ? properties.json.rootPath : properties.rootPath;
            if(properties.json.children) this.jsonChildren = properties.json.children;
            self.setup(properties);
            if (properties.onLoadCallback) properties.onLoadCallback(self);
        } else if (properties.url) { // If only the url to the tileset.json is provided
            
            
            this.loadJson = (json, url)=>{
                //json = _.cloneDeep(json)
                //json = JSON.parse(JSON.stringify(json))
                const p = path.dirname(url);
                self.setup({ rootPath: p, json: json });
                if (properties.onLoadCallback) properties.onLoadCallback(self);
            }
            self.tileLoader.get(self.abortController, properties.url, self.uuid, self);

            /* fetch(properties.url, { signal: self.abortController.signal }).then(result => {
                if (!result.ok) {
                    throw new Error(`couldn't load "${properties.url}". Request failed with status ${result.status} : ${result.statusText}`);
                }
                result.json().then(json => {
                    const p = path.dirname(properties.url);
                    self.setup({ rootPath: p, json: json });
                    if (properties.onLoadCallback) properties.onLoadCallback(self);
                });
            }); */
        }
    }

    setup(properties) {
        this.isSetup = true;
        if (!!properties.json.root) {
            this.json = properties.json.root;
            this.jsonChildren = this.json.children;
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
            this.master.applyMatrix4(mat);
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
        if (self.deleted) return;
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
                if (url.includes(".b3dm")) {
                    self.contentURL = url;
                    
                    self.tileLoader.get(self.abortController, url, self.uuid, self, !self.cameraOnLoad ? () => 0 : () => {
                        return self.calculateDistanceToCamera(self.cameraOnLoad);
                    }, () => self.getSiblings(), self.level);
                } else if (url.includes(".json")) {
                    self.tileLoader.get(self.abortController, url, self.uuid, self);

                }

            }
        }
    }

    loadMesh(mesh) {
        const self = this;
        if (self.deleted) {
            return;
        }
        
        //self.updateWorldMatrix(false, true);
        self.meshContent = mesh;
        
    }

    loadJson(json, url) {
        if (this.deleted) {
            return;
        }
        if(!!this.json.children){
            this.jsonChildren = this.json.children;
        }
        
        json.rootPath = path.dirname(url);
        this.jsonChildren.push(json);
        this.hasUnloadedJSONContent = false;
    }

    dispose() {

        const self = this;
        self.childrenTiles.forEach(tile => tile.dispose());
        self.deleted = true;
        if (self.abortController) self.abortController.abort();
        this.parent = null;
        this.parentTile = null;
        this.dispatchEvent({ type: 'removed' });
    }
    disposeChildren() {
        var self = this;

        self.childrenTiles.forEach(tile => tile.dispose());
        self.childrenTiles = [];
    }

    
    _update(camera, frustum) {
        const self = this;
        const visibilityBeforeUpdate = self.materialVisibility;

        if (!!self.boundingVolume && !!self.geometricError) {
            self.metric = self.calculateUpdateMetric(camera, frustum);
        }
        self.childrenTiles.forEach(child => child._update(camera, frustum));

        updateNodeVisibility(self.metric);
        updateTree(self.metric);
        trimTree(self.metric, visibilityBeforeUpdate);


        function updateTree(metric) {
            // If this tile does not have mesh content but it has children
            if (metric < 0 && self.hasMeshContent) return;
            
            if ((!self.hasMeshContent && self.rootPath) || (metric < self.geometricError && !!self.meshContent)) {
                if (!!self.json && !!self.jsonChildren && self.childrenTiles.length != self.jsonChildren.length) {
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
                let allChildrenReady = true;
                self.childrenTiles.every(child => {

                    if (!child.isReady()) {
                        allChildrenReady = false;
                        return false;
                    }
                    return true;
                });
                if (allChildrenReady) {
                    self.changeContentVisibility(false);
                }
            }
        }

        function trimTree(metric, visibilityBeforeUpdate) {
            if (!self.hasMeshContent) return;
            if (!self.inFrustum) { // outside frustum
                self.disposeChildren();
                updateNodeVisibility(metric);
                return;
            }
            if (metric >= self.geometricError) {
                self.disposeChildren();
                updateNodeVisibility();
                return;
            }

        }

        function loadJsonChildren() {
            self.jsonChildren.forEach(childJSON => {
                let childTile = new InstancedTile({
                    parentTile: self,
                    parentGeometricError: self.geometricError,
                    parentBoundingVolume: self.boundingVolume,
                    parentRefinement: self.refinement,
                    json: childJSON,
                    rootPath: self.rootPath,
                    loadOutsideView: self.loadOutsideView,
                    level: self.level + 1,
                    tileLoader: self.tileLoader,
                    cameraOnLoad: camera,
                    static: self.static,
                    master: self.master
                });
                self.childrenTiles.push(childTile);
                //self.add(childTile);
            });
        }

    }

    areAllChildrenLoadedAndHidden() {
        let allLoadedAndHidden = true;
        const self = this;
        this.childrenTiles.every(child => {
            if (child.hasMeshContent) {
                if (child.childrenTiles.length > 0) {
                    allLoadedAndHidden = false;
                    return false;
                }
                if (!child.inFrustum) {
                    return true;
                };
                if (!child.materialVisibility || child.meshesToDisplay != child.meshesDisplayed) {
                    allLoadedAndHidden = false;
                    return false;
                }
            } else {
                if (!child.areAllChildrenLoadedAndHidden()) {
                    allLoadedAndHidden = false;
                    return false;
                }
            }
            return true;
        });
        return allLoadedAndHidden;
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
        if (!this.meshContent.displayedOnce) {
            return false;
        }
        return true;

    }


    changeContentVisibility(visibility) {
        const self = this;
        self.materialVisibility = visibility;

        /* self.meshContent.displayedOnce = false;
        if(visibility){
            self.meshContent.onAfterRender = () => {
                delete self.meshContent.onAfterRender;
                self.meshContent.displayedOnce = true;
            };
        } */

    }
    calculateUpdateMetric(camera, frustum) {
        ////// return -1 if not in frustum
        if (this.boundingVolume instanceof OBB) {
            // box
            tempSphere.copy(this.boundingVolume.sphere);
            tempSphere.applyMatrix4(this.master.matrixWorld);
            if (!frustum.intersectsSphere(tempSphere)) return -1;
        } else if (this.boundingVolume instanceof THREE.Sphere) {
            //sphere
            tempSphere.copy(this.boundingVolume);
            tempSphere.applyMatrix4(this.master.matrixWorld);
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
            const scale = this.master.matrixWorld.getMaxScaleOnAxis();
            //return (((distance / Math.pow(scale, 2)) / 100) / this.master.geometricErrorMultiplier);
            return Math.pow(distance, 2) /(this.master.geometricErrorMultiplier*this.geometricError*Math.pow(scale,2.0)*35);
        } else if (this.boundingVolume instanceof THREE.Box3) {
            // Region
            // Region not supported
            //throw Error("Region bounding volume not supported");
            return -1;
        }
    }

    getSiblings() {
        const self = this;
        const tiles = [];
        if (!self.parentTile) return tiles;
        let p = self.parentTile;
        while (!p.hasMeshContent && !!p.parentTile) {
            p = p.parentTile;
        }
        p.childrenTiles.forEach(child => {
            if (!!child && child != self) {
                while (!child.hasMeshContent && !!child.childrenTiles[0]) {
                    child = child.childrenTiles[0];
                }
                tiles.push(child);
            }
        });
        return tiles;
    }
    calculateDistanceToCamera(camera) {
        if (this.boundingVolume instanceof OBB) {
            // box
            tempSphere.copy(this.boundingVolume.sphere);
            tempSphere.applyMatrix4(this.master.matrixWorld);
            //if (!frustum.intersectsSphere(tempSphere)) return -1;
        } else if (this.boundingVolume instanceof THREE.Sphere) {
            //sphere
            tempSphere.copy(this.boundingVolume);
            tempSphere.applyMatrix4(this.master.matrixWorld);
            //if (!frustum.intersectsSphere(tempSphere)) return -1;
        }
        if (this.boundingVolume instanceof THREE.Box3) {
            return -1; // region not supported
        }
        return Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius);
    }
    
    getWorldMatrix(){
        const self = this;
        return self.master.matrixWorld;
    }
}
export { InstancedTile };