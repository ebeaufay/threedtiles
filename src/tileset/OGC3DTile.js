import * as THREE from 'three';
import { OBB } from "../geometry/obb";
import { TileLoader } from "./TileLoader";
import { v4 as uuidv4 } from "uuid";
import * as path from "path-browserify"
import { clamp } from "three/src/math/MathUtils";

const tempSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
const tempVec1 = new THREE.Vector3(0, 0, 0);
const tempVec2 = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);
const rendererSize = new THREE.Vector2();
const tempQuaternion = new THREE.Quaternion();


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
     *   meshCallback: function,
     *   pointsCallback: function,
     *   cameraOnLoad: camera,
     *   parentTile: OGC3DTile,
     *   onLoadCallback: function,
     *   occlusionCullingService: OcclusionCullingService,
     *   static: Boolean,
     *   centerModel: Boolean
     *   renderer: Renderer
     * } properties 
     */
    constructor(properties) {
        super();
        const self = this;

        this.uuid = uuidv4();
        if (!!properties.tileLoader) {
            this.tileLoader = properties.tileLoader;
        } else {
            this.tileLoader = new TileLoader(
                200,
                !properties.meshCallback ? mesh => {
                    mesh.material.wireframe = false;
                    mesh.material.side = THREE.DoubleSide;
                } : properties.meshCallback,
                !properties.pointsCallback ? points => {
                    points.material.size = 0.1;
                    points.material.sizeAttenuation = true;
                } : properties.pointsCallback);
        }
        // set properties general to the entire tileset
        this.geometricErrorMultiplier = !!properties.geometricErrorMultiplier ? properties.geometricErrorMultiplier : 1.0;

        this.renderer = properties.renderer;
        this.meshCallback = properties.meshCallback;
        this.loadOutsideView = properties.loadOutsideView;
        this.cameraOnLoad = properties.cameraOnLoad;
        this.parentTile = properties.parentTile;
        this.occlusionCullingService = properties.occlusionCullingService;
        this.static = properties.static;
        if (this.occlusionCullingService) {
            this.color = new THREE.Color();
            this.color.setHex(Math.random() * 0xffffff);
            this.colorID = clamp(self.color.r * 255, 0, 255) << 16 ^ clamp(self.color.g * 255, 0, 255) << 8 ^ clamp(self.color.b * 255, 0, 255) << 0;
        }
        if (this.static) {
            this.matrixAutoUpdate = false;
        }

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

        this.abortController = new AbortController();
        this.layers.disable(0);

        if (!!properties.json) { // If this tile is created as a child of another tile, properties.json is not null
            self.setup(properties);
            if (properties.onLoadCallback) properties.onLoadCallback(self);

        } else if (properties.url) { // If only the url to the tileset.json is provided
            fetch(properties.url, { signal: self.abortController.signal }).then(result => {
                if (!result.ok) {
                    throw new Error(`couldn't load "${properties.url}". Request failed with status ${result.status} : ${result.statusText}`);
                }
                result.json().then(json => {
                    self.setup({ rootPath: path.dirname(properties.url), json: json });
                    if (properties.onLoadCallback) properties.onLoadCallback(self);
                    if (!!properties.centerModel) {
                        const tempSphere = new THREE.Sphere();
                        if (self.boundingVolume instanceof OBB) {
                            // box
                            tempSphere.copy(self.boundingVolume.sphere);
                        } else if (self.boundingVolume instanceof THREE.Sphere) {
                            //sphere
                            tempSphere.copy(self.boundingVolume);
                        }

                        //tempSphere.applyMatrix4(self.matrixWorld);
                        if (!!this.json.boundingVolume.region) {
                            this.transformWGS84ToCartesian(
                                (this.json.boundingVolume.region[0] + this.json.boundingVolume.region[2]) * 0.5,
                                (this.json.boundingVolume.region[1] + this.json.boundingVolume.region[3]) * 0.5,
                                (this.json.boundingVolume.region[4] + this.json.boundingVolume.region[5]) * 0.5,
                                tempVec1);
                            
                            tempQuaternion.setFromUnitVectors(tempVec1.normalize(), upVector.normalize());
                            self.applyQuaternion(tempQuaternion);
                        }
                        
                        self.translateX(-tempSphere.center.x * self.scale.x);
                        self.translateY(-tempSphere.center.y * self.scale.y);
                        self.translateZ(-tempSphere.center.z * self.scale.z);

                    }
                });
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
                this.transformWGS84ToCartesian(region[0], region[1], region[4], tempVec1);
                this.transformWGS84ToCartesian(region[2], region[3], region[5], tempVec2);
                tempVec1.lerp(tempVec2, 0.5);
                this.boundingVolume = new THREE.Sphere(new THREE.Vector3(tempVec1.x, tempVec1.y, tempVec1.z), tempVec1.distanceTo(tempVec2));
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
                if (url.includes(".b3dm") || url.includes(".glb") || url.includes(".gltf")) {
                    self.contentURL = url;
                    if(!!self.json.boundingVolume.region){
                        //self.applyMatrix4(zUpToYUp);
                    }
                    self.tileLoader.get(self.abortController, this.uuid, url, mesh => {
                        if (!!self.deleted) return;
                        mesh.traverse((o) => {
                            if (o.isMesh) {
                                
                                o.layers.disable(0);
                                if (self.occlusionCullingService) {
                                    const position = o.geometry.attributes.position;
                                    const colors = [];
                                    for (let i = 0; i < position.count; i++) {
                                        colors.push(self.color.r, self.color.g, self.color.b);
                                    }
                                    o.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                                }
                                if (self.static) {
                                    o.matrixAutoUpdate = false;
                                }
                                //o.material.visible = false;
                            }
                        });

                        self.add(mesh);
                        self.updateWorldMatrix(false, true);
                        // mesh.layers.disable(0);
                        self.meshContent = mesh;
                    }, !self.cameraOnLoad ? () => 0 : () => {
                        return self.calculateDistanceToCamera(self.cameraOnLoad);
                    }, () => self.getSiblings(), 
                    self.level,
                    !!self.json.boundingVolume.region,
                    self.geometricError
                    );
                } else if (url.includes(".json")) {
                    self.tileLoader.get(self.abortController, this.uuid, url, json => {
                        if (!!self.deleted) return;
                        if (!self.json.children) self.json.children = [];
                        json.rootPath = path.dirname(url);
                        self.json.children.push(json);
                        delete self.json.content;
                        self.hasUnloadedJSONContent = false;
                    });

                }

            }
        }
    }

    dispose() {

        const self = this;
        self.childrenTiles.forEach(tile => tile.dispose());
        self.deleted = true;
        this.traverse(function (element) {
            if (!!element.contentURL) {
                self.tileLoader.invalidate(element.contentURL, element.uuid);
            }
            if (!!element.abortController) { // abort tile request
                element.abortController.abort();
            }

        });
        this.parent = null;
        this.parentTile = null;
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
            if (self.occlusionCullingService && self.hasMeshContent && !self.occlusionCullingService.hasID(self.colorID)) {
                return;
            }
            if (!self.hasMeshContent || (metric < self.geometricErrorMultiplier * self.geometricError && !!self.meshContent)) {
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
            if (metric >= self.geometricErrorMultiplier * self.geometricError) { // Ideal LOD or before ideal lod

                self.changeContentVisibility(true);
            } else if (metric < self.geometricErrorMultiplier * self.geometricError) { // Ideal LOD is past this one
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
            if (self.occlusionCullingService &&
                !visibilityBeforeUpdate &&
                self.hasMeshContent &&
                self.meshContent &&
                self.meshesToDisplay == self.meshesDisplayed &&
                self.areAllChildrenLoadedAndHidden()) {

                self.disposeChildren();
                updateNodeVisibility(metric);
                return;
            }
            if (metric >= self.geometricErrorMultiplier * self.geometricError) {
                self.disposeChildren();
                updateNodeVisibility();
                return;
            }

        }

        function loadJsonChildren() {
            self.json.children.forEach(childJSON => {
                let childTile = new OGC3DTile({
                    parentTile: self,
                    parentGeometricError: self.geometricError,
                    parentBoundingVolume: self.boundingVolume,
                    parentRefinement: self.refinement,
                    json: childJSON,
                    rootPath: self.rootPath,
                    geometricErrorMultiplier: self.geometricErrorMultiplier,
                    loadOutsideView: self.loadOutsideView,
                    level: self.level + 1,
                    tileLoader: self.tileLoader,
                    cameraOnLoad: camera,
                    occlusionCullingService: self.occlusionCullingService,
                    renderer: self.renderer,
                    static: self.static
                });
                self.childrenTiles.push(childTile);
                self.add(childTile);
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
                } else if (self.occlusionCullingService.hasID(child.colorID)) {
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
        if (this.meshesDisplayed == this.meshesToDisplay) {
            return true;
        }

        return false;

    }




    changeContentVisibility(visibility) {
        const self = this;
        if (self.hasMeshContent && self.meshContent) {
            if (visibility) {

                self.meshContent.traverse((o) => {
                    if (o.isMesh) {
                        o.layers.enable(0);
                    }
                });
            } else {
                self.meshContent.traverse((o) => {
                    if (o.isMesh) {
                        o.layers.disable(0);
                    }
                });
            }
        }
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
                self.meshesToDisplay=1;
                mesh.onAfterRender = () => {
                    delete mesh.onAfterRender;
                    self.meshesDisplayed=1;
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
        } else {
            console.error("unsupported shape");
            return -1

        }

        /////// return metric based on geometric error and distance

        const distance = Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius);
        if (distance == 0) {
            return 0;
        }
        const scale = this.matrixWorld.getMaxScaleOnAxis();
        this.renderer.getDrawingBufferSize(rendererSize);
        let s = rendererSize.y;
        let fov = camera.fov;
        if (camera.aspect < 1) {
            fov *= camera.aspect;
            s = rendererSize.x;
        }

        let lambda = 2.0 * Math.tan(0.5 * fov * 0.01745329251994329576923690768489) * distance;

        return (window.devicePixelRatio * 16 * lambda) / (s * scale);
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
            tempSphere.applyMatrix4(this.matrixWorld);
            //if (!frustum.intersectsSphere(tempSphere)) return -1;
        } else if (this.boundingVolume instanceof THREE.Sphere) {
            //sphere
            tempSphere.copy(this.boundingVolume);
            tempSphere.applyMatrix4(this.matrixWorld);
            //if (!frustum.intersectsSphere(tempSphere)) return -1;
        }
        else {
            console.error("unsupported shape")
        }
        return Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius);
    }
    setGeometricErrorMultiplier(geometricErrorMultiplier) {
        this.geometricErrorMultiplier = geometricErrorMultiplier;
        this.childrenTiles.forEach(child => child.setGeometricErrorMultiplier(geometricErrorMultiplier));
    }

    transformWGS84ToCartesian(lon, lat, h, sfct) {
        const a = 6378137.0;
        const e = 0.006694384442042;
        const N = a / (Math.sqrt(1.0 - (e * Math.pow(Math.sin(lat), 2))));
        const cosLat = Math.cos(lat);
        const cosLon = Math.cos(lon);
        const sinLat = Math.sin(lat);
        const sinLon = Math.sin(lon);
        const nPh = (N + h);
        const x = nPh * cosLat * cosLon;
        const y = nPh * cosLat * sinLon;
        const z = (0.993305615557957 * N + h) * sinLat;

        sfct.set(x, y, z);
    }
}
export { OGC3DTile };