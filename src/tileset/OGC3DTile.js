import * as THREE from 'three';
import { OBB } from "../geometry/obb";
import { B3DMDecoder } from "../decoder/B3DMDecoder";
const path = require('path');

const tilesToLoad = [];
function scheduleLoadTile(tile) {
    tilesToLoad.push(tile);
}

setInterval(() => {
    const tile = tilesToLoad.shift();
    if (!!tile) tile.load();
}, 0)

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
     *   loadOutsideView: Boolean
     * } properties 
     */
    constructor(properties) {
        super();
        // set properties general to the entire tileset
        this.geometricErrorMultiplier = !!properties.geometricErrorMultiplier?properties.geometricErrorMultiplier:1.0;
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

        this.hasMeshContent = false; // true when the provided json has a content field pointing to a B3DM file
        this.hasUnloadedJSONContent = false; // true when the provided json has a content field pointing to a JSON file that is not yet loaded

        const self = this;
        if (!!properties.json) { // If this tile is created as a child of another tile, properties.json is not null
            self.setup(properties);
        } else if (properties.url) { // If only the url to the tileset.json is provided
            self.controller = new AbortController();
            fetch(properties.url, { signal: self.controller.signal }).then(result => {
                if (!result.ok) {
                    throw new Error(`couldn't load "${url}". Request failed with status ${result.status} : ${result.statusText}`);
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
            //this.matrix = new THREE.Matrix4();
            this.matrix.elements = this.json.transform;
            this.updateWorldMatrix(false, false);
        }
        // decode volume
        if (!!this.json.boundingVolume) {
            if (!!this.json.boundingVolume.box) {
                this.boundingVolume = new OBB(this.json.boundingVolume.box);
            } else if (!!this.json.boundingVolume.region) {
                const region = this.json.boundingVolume.region;
                this.boundingVolume = new THREE.Box3(new Vector3(region[0], region[2], region[4]), new Vector3(region[1], region[3], region[5]));
            } else if (!!this.json.boundingVolume.sphere) {
                const sphere = this.json.boundingVolume.sphere;
                this.boundingVolume = new THREE.Sphere(new Vector3(sphere[0], sphere[1], sphere[2]), sphere[3]);
            } else {
                this.boundingVolume = properties.parentBoundingVolume;
            }
        } else {
            this.boundingVolume = properties.parentBoundingVolume;
        }

        if (!!this.json.content) { //if there is a content, json or otherwise, schedule it to be loaded 
            if (!!this.json.content.uri && this.json.content.uri.endsWith("json")) {
                this.hasUnloadedJSONContent = true;
            } else if (!!this.json.content.url && this.json.content.url.endsWith("json")) {
                this.hasUnloadedJSONContent = true;
            } else {
                this.hasMeshContent = true;
            }
            scheduleLoadTile(this);
        }
    }
    load() {
        var self = this;
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
                self.controller = new AbortController();
                fetch(url, { signal: self.controller.signal }).then(result => {
                    if (!result.ok) {
                        throw new Error(`couldn't load "${url}". Request failed with status ${result.status} : ${result.statusText}`);
                    }
                    if (url.endsWith("b3dm")) {// if the content is B3DM
                        result.arrayBuffer().then(buffer => B3DMDecoder.parseB3DM(buffer, self.meshCallback)).then(mesh => {
                            mesh.traverse((o) => {
                                if (o.isMesh) {
                                    o.material.visible = true;
                                }
                            });
                            self.add(mesh);
                            self.meshContent = mesh;
                            
                            
                        }).catch(error => { });
                    } else if (url.endsWith("json")) {// if the content is json
                        result.json().then(json => {
                            // when json content is downloaded, it is inserted into this tile's original JSON as a child
                            // and the content object is deleted from the original JSON
                            if (!self.json.children) self.json.children = [];
                            json.rootPath = path.dirname(url);
                            self.json.children.push(json);
                            delete self.json.content;
                            self.hasUnloadedJSONContent = false;
                        }).catch(error => { });
                    }
                }).catch(error => {
                });
            }
        }
    }

    disposeChildren() {
        var self = this;

        self.childrenTiles.forEach(tile => tile.traverse(function (element) {
            if (!!element.controller) { // abort tile request
                element.controller.abort();
            }
            if (element.material) {
                // dispose materials
                if (element.material.length) {
                    for (let i = 0; i < element.material.length; ++i) {
                        element.material[i].dispose();
                    }
                }
                else {
                    element.material.dispose()
                }

            }
            if (element.geometry) {
                // dispose geometry
                element.geometry.dispose();

            }
        }));
        for (let i = 0; i < this.childrenTiles.length; i++) {

            const object = this.childrenTiles[i];

            object.parent = null;

            object.dispatchEvent({ type: 'removed' });

        }
        this.childrenTiles = [];
        this.children = [];
        if (!!this.meshContent) this.children.push(this.meshContent);
    }



    update(camera, frustum) {
        const self = this;
        if (!self.hasMeshContent) {
            if (!!self.json && !!self.json.children) {
                if(self.childrenTiles.length != self.json.children.length){
                    loadJsonChildren();
                    return false;
                }else{
                    const childrenReadyCounter = countChildrenReady();
                    if (self.json.children.length == childrenReadyCounter) return true;
                    else return false;
                }
            }
        }

        
        if (!!self.boundingVolume && !!self.geometricError) {
            var metric = self.calculateUpdateMetric(camera, frustum);
        }

        if (isNaN(metric)) {
            throw ("calculation of metric for planet LOD calculation failed");
        }

        if (metric < 0) { // outside frustum
            if (!!self.meshContent) {
                self.changeContentVisibility(!!self.loadOutsideView);
            }
            self.disposeChildren();
            return true;
        }

        if (metric >= self.geometricError) { // if self is ideal LOD

            //self.disposeChildren(); // remove all children 
            if (self.hasMeshContent) { // has a mesh content
                self.disposeChildren();
                if (self.meshContent) { // mesh content is loaded
                    self.changeContentVisibility(true); // show content
                    return true; // is ready
                } else {
                    return false; // not ready
                }
            } else {
                if (self.hasUnloadedJSONContent) { //has a json content that's not yet loaded
                    return false;
                } else if (!!self.json && !!self.json.children && self.childrenTiles.length != self.json.children.length) {
                    loadJsonChildren();
                    return false;
                } else if (!!self.json && !!self.json.children) {
                    const childrenReadyCounter = countChildrenReady();
                    if (self.json.children.length == childrenReadyCounter) return true;
                    else return false;
                }
                else {
                    return true; //no mesh content and no children
                }
            }

        }

        else { // if ideal LOD is past self tile
            if (self.hasUnloadedJSONContent) {
                return false;
            }
            if (!!self.json && !!self.json.children) {
                if (self.childrenTiles.length == self.json.children.length) {
                    return recurse();
                } else {
                    loadJsonChildren();
                    return recurse();
                }
            } else {
                if (self.hasMeshContent) {
                    if (self.meshContent) {
                        self.changeContentVisibility(true);
                        return true;
                    }
                    if (!self.meshContent) {
                        return false;
                    }
                } else {
                    return true;
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
                    meshCallback: self.meshCallback,
                    loadOutsideView: self.loadOutsideView
                });
                self.childrenTiles.push(childTile);
                self.add(childTile);
            });
        }
        function recurse() {
            const childrenReadyCounter = countChildrenReady();
            if (childrenReadyCounter == self.childrenTiles.length) { //all children loaded
                if (self.hasMeshContent) {
                    if (self.refinement === "ADD") { // if content is loaded
                        if (self.meshContent) {
                            self.changeContentVisibility(true);
                            return true;
                        }
                        if (!self.meshContent) {
                            return false;
                        }
                    } else {
                        if (!!self.meshContent) {
                            self.changeContentVisibility(false);
                            return true;
                        }else{
                            false
                        }
                    }
                } else {
                    return true;
                }
            } else { //NOT all children loaded
                if (self.hasMeshContent) {
                    if (self.meshContent) {
                        self.changeContentVisibility(true);
                        return true;
                    }
                    if (!self.meshContent) {
                        return false;
                    }
                } else {
                    return true;
                }
            }
        }
        function countChildrenReady() {
            let count = 0;
            self.childrenTiles.every(child => {
                let childReady = child.update(camera, frustum);
                if (childReady) {
                    count++;
                } else {
                    return false; // break out of loop
                }
                return true; // continue
            });
            return count;
        }
    }

    changeContentVisibility(visibility) {
        if (!!this.meshContent.traverse) {
            this.meshContent.traverse(function (element) {
                if (element.material) element.material.visible = visibility;
            });
        } else if (!!this.meshContent.scenes) {
            this.meshContent.scenes.forEach(scene => scene.traverse(function (element) {
                if (element.material) element.material.visible = visibility;
            }));
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

            return (distance / 100) / this.geometricErrorMultiplier;
        } else if (this.boundingVolume instanceof THREE.Box3) {
            // Region
            // Region not supported
            //throw Error("Region bounding volume not supported");
            return -1;
        }

    }

    setGeometricErrorMultiplier(geometricErrorMultiplier){
        this.geometricErrorMultiplier = geometricErrorMultiplier;
        this.childrenTiles.forEach(child=>child.setGeometricErrorMultiplier(geometricErrorMultiplier));
    }
}
export { OGC3DTile };