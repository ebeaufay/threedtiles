import * as THREE from 'three';
import { OBB } from "../geometry/obb";
import { TileLoader } from "./TileLoader";
import { v4 as uuidv4 } from "uuid";
import * as path from "path-browserify"
import { clamp } from "three/src/math/MathUtils";
import { Octree } from 'three/addons/math/Octree.js';
//import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
var averageTime = 0;
var numTiles = 0;
var copyrightDiv;
const tempSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
const tempVec1 = new THREE.Vector3(0, 0, 0);
const tempVec2 = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);
const rendererSize = new THREE.Vector2(1000, 1000);
const tempQuaternion = new THREE.Quaternion();
const copyright = {};


class OGC3DTile extends THREE.Object3D {

    /**
     * @param {Object} [properties] - the properties for this tileset
     * @param {THREE.Renderer} [properties.renderer] - the renderer used to display the tileset
     * @param {String} [properties.url] - the url to the parent tileset.json
     * @param {String} [properties.queryParams] - optional, path params to add to individual tile urls (starts with "?").
     * @param {Number} [properties.geometricErrorMultiplier] - the geometric error of the parent. 1.0 by default corresponds to a maxScreenSpaceError of 16
     * @param {Boolean} [properties.loadOutsideView] - if truthy, tiles otside the camera frustum will be loaded with the least possible amount of detail
     * @param {TileLoader} [properties.tileLoader] - A tile loader that can be shared among tilesets in order to share a common cache.
     * @param {Function} [properties.meshCallback] - A callback function that will be called on every mesh
     * @param {Function} [properties.pointsCallback] - A callback function that will be called on every points
     * @param {Function} [properties.onLoadCallback] - A callback function that will be called when the root tile has been loaded
     * @param {OcclusionCullingService} [properties.occlusionCullingService] - A service that handles occlusion culling
     * @param {Boolean} [properties.centerModel] - If true, the tileset will be centered on 0,0,0 and in the case of georeferenced tilesets that use the "region" bounding volume, it will also be rotated so that the up axis matched the world y axis.
     * @param {Boolean} [properties.static] - If true, the tileset is considered static which improves performance but the matrices aren't automatically updated
     * @param {String} [properties.rootPath] - optional the root path for fetching children
     * @param {String} [properties.json] - optional json object representing the tileset sub-tree
     * @param {Number} [properties.parentGeometricError] - optional geometric error of the parent
     * @param {Object} [properties.parentBoundingVolume] - optional bounding volume of the parent
     * @param {String} [properties.parentRefine] - optional refine strategy of the parent of the parent
     * @param {THREE.Camera} [properties.cameraOnLoad] - optional the camera used when loading this particular sub-tile
     * @param {OGC3DTile} [properties.parentTile] - optional the OGC3DTile object that loaded this tile as a child
     * @param {String} [properties.proxy] - optional the url to a proxy service. Instead of fetching tiles via a GET request, a POST will be sent to the proxy url with the real tile address in the body of the request.
     * @param {Boolean} [properties.displayErrors] - optional value indicating that errors should be shown on screen.
     */
    constructor(properties) {
        super();
        const self = this;
        
        this.proxy = properties.proxy;
        this.yUp = properties.yUp;
        this.displayErrors = properties.displayErrors;
        this.displayCopyright = properties.displayCopyright;
        if (properties.queryParams) {
            this.queryParams = { ...properties.queryParams };
        }
        this.uuid = uuidv4();
        if (!!properties.tileLoader) {
            this.tileLoader = properties.tileLoader;
        } else {
            const tileLoaderOptions = {};
            tileLoaderOptions.meshCallback = !properties.meshCallback ? (mesh, geometricError) => {
                mesh.material.wireframe = false;
                mesh.material.side = THREE.DoubleSide;
            } : properties.meshCallback;
            tileLoaderOptions.pointsCallback = !properties.pointsCallback ? (points, geometricError) => {
                points.material.size = Math.min(1.0, 0.5 * Math.sqrt(geometricError));
                points.material.sizeAttenuation = true;
            } : properties.pointsCallback;
            tileLoaderOptions.proxy = this.proxy;
            tileLoaderOptions.renderer = properties.renderer;
            this.tileLoader = new TileLoader(tileLoaderOptions);
        }
        this.displayCopyright = !!properties.displayCopyright;
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
        this.refine; // defaults to "REPLACE"
        this.rootPath;
        this.geometricError;
        this.boundingVolume;
        this.json; // the json corresponding to this tile
        this.materialVisibility = false;
        this.inFrustum = true;
        this.level = properties.level ? properties.level : 0;
        this.hasMeshContent = false; // true when the provided json has a content field pointing to a B3DM file
        this.hasUnloadedJSONContent = false; // true when the provided json has a content field pointing to a JSON file that is not yet loaded
        this.centerModel = properties.centerModel;
        this.abortController = new AbortController();
        //this.layers.disable(0);
        //this.octree = new Octree();

        if (!!properties.json) { // If this tile is created as a child of another tile, properties.json is not null
            self.setup(properties);
            if (properties.onLoadCallback) properties.onLoadCallback(self);

        } else if (properties.url) { // If only the url to the tileset.json is provided
            var url = properties.url;
            if (self.queryParams) {
                var props = "";
                for (let key in self.queryParams) {
                    if (self.queryParams.hasOwnProperty(key)) { 
                        props += "&" + key + "=" + self.queryParams[key];
                    }
                }
                if (url.includes("?")) {
                    url += props;
                } else {
                    url += "?" + props.substring(1);
                }
            }


            var fetchFunction;
            if (self.proxy) {
                fetchFunction = () => {
                    return fetch(self.proxy,
                        {
                            method: 'POST',
                            body: url,
                            signal: self.abortController.signal
                        }
                    );
                }
            } else {
                fetchFunction = () => {
                    return fetch(url, { signal: self.abortController.signal });
                }
            }
            fetchFunction().then(result => {
                if (!result.ok) {
                    throw new Error(`couldn't load "${properties.url}". Request failed with status ${result.status} : ${result.statusText}`);
                }
                result.json().then(json => {
                    self.setup({ rootPath: path.dirname(properties.url), json: json });
                    if (properties.onLoadCallback) properties.onLoadCallback(self);
                    if (!!self.centerModel) {
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
            }).catch(e => {if(self.displayErrors) showError(e)});
        }
    }

    setup(properties) {
        if (!!properties.json.root) {
            this.json = properties.json.root;
            if (!this.json.refine) this.json.refine = properties.json.refine;
            if (!this.json.geometricError) this.json.geometricError = properties.json.geometricError;
            if (!this.json.transform) this.json.transform = properties.json.transform;
            if (!this.json.boundingVolume) this.json.boundingVolume = properties.json.boundingVolume;
        } else {
            this.json = properties.json;
        }
        this.rootPath = !!properties.json.rootPath ? properties.json.rootPath : properties.rootPath;

        // decode refine
        if (!!this.json.refine) {
            this.refine = this.json.refine;
        } else {
            this.refine = properties.parentRefine;
        }
        // decode geometric error
        if (!!this.json.geometricError) {
            this.geometricError = this.json.geometricError;
        } else {
            this.geometricError = properties.parentGeometricError;
        }


        // decode transform
        if (!!this.json.transform && !this.centerModel) {
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
                this.boundingVolume = new THREE.Sphere(new THREE.Vector3(sphere[0], sphere[1], sphere[2]), sphere[3]);
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
    assembleURL(root, relative) {
        // Append a slash to the root URL if it doesn't already have one
        if (!root.endsWith('/')) {
            root += '/';
        }

        const rootUrl = new URL(root);
        let rootParts = rootUrl.pathname.split('/').filter(p => p !== '');
        let relativeParts = relative.split('/').filter(p => p !== '');

        for (let i = 1; i <= rootParts.length; i++) {
            if (i >= relativeParts.length) break;
            const rootToken = rootParts.slice(rootParts.length - i, rootParts.length).join('/');
            const relativeToken = relativeParts.slice(0, i).join('/');
            if (rootToken === relativeToken) {
                for (let j = 0; j < i; j++) {
                    rootParts.pop();
                }
                break;
            }
        }


        while (relativeParts.length > 0 && relativeParts[0] === '..') {
            rootParts.pop();
            relativeParts.shift();
        }

        return `${rootUrl.protocol}//${rootUrl.host}/${[...rootParts, ...relativeParts].join('/')}`;
    }

    extractQueryParams(url, params) {
        const urlObj = new URL(url);

        // Iterate over all the search parameters
        for (let [key, value] of urlObj.searchParams) {
            params[key] = value;
        }

        // Remove the query string
        urlObj.search = '';
        return urlObj.toString();
    }
    load() {
        var self = this;
        if (self.deleted) return;
        if (!!self.json.content) {
            let url;
            if (!!self.json.content.uri) {
                url = self.json.content.uri;
            } else if (!!self.json.content.url) {
                url = self.json.content.url;
            }
            const urlRegex = /^(?:http|https|ftp|tcp|udp):\/\/\S+/;

            if (urlRegex.test(self.rootPath)) { // url

                if (!urlRegex.test(url)) {
                    url = self.assembleURL(self.rootPath, url);
                }
            } else { //path
                if (path.isAbsolute(self.rootPath)) {
                    url = self.rootPath + path.sep + url;
                }
            }
            url = self.extractQueryParams(url, self.queryParams);
            if (self.queryParams) {
                var props = "";
                for (let key in self.queryParams) {
                    if (self.queryParams.hasOwnProperty(key)) { // This check is necessary to skip properties from the object's prototype chain
                        props += "&" + key + "=" + self.queryParams[key];
                    }
                }
                if (url.includes("?")) {
                    url += props;
                } else {
                    url += "?" + props.substring(1);
                }
            }

            if (!!url) {
                if (url.includes(".b3dm") || url.includes(".glb") || url.includes(".gltf")) {
                    self.contentURL = url;

                    try{
                        self.tileLoader.get(self.abortController, this.uuid, url, mesh => {
                            if (!!self.deleted) return;
                            
                            if(mesh.asset && mesh.asset.copyright){
                                mesh.asset.copyright.split(';').forEach(s=>{
                                    if(!!copyright[s]){
                                        copyright[s]++;
                                    }else{
                                        copyright[s] = 1;
                                    }
                                });
                                if(self.displayCopyright){
                                    updateCopyrightLabel();
                                } 
                            }
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
                            let s = Date.now();
                            //self.octree.fromGraphNode( mesh );
                            /*averageTime*=numTiles;
                            averageTime+=Date.now()-s;
                            numTiles++;
                            averageTime/=numTiles;
                            console.log(averageTime);*/
                            self.add(mesh);
                            self.updateWorldMatrix(false, true);
                            // mesh.layers.disable(0);
                            self.meshContent = mesh;
                        }, !self.cameraOnLoad ? () => 0 : () => {
                            return self.calculateDistanceToCamera(self.cameraOnLoad);
                        }, () => self.getSiblings(),
                            self.level,
                            !!self.json.boundingVolume.region?false : self.yUp === undefined || self.yUp,
                            !!self.json.boundingVolume.region,
                            self.geometricError
                        );
                    }catch(e){
                        if(self.displayErrors) showError(e)
                    }
                    
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
        if(!!self.meshContent && !!self.meshContent.asset && self.meshContent.asset.copyright){
            self.meshContent.asset.copyright.split(';').forEach(s=>{
                if(!!copyright[s]){
                    copyright[s]--;
                }
            });
            if(self.displayCopyright){
                updateCopyrightLabel();
            }
        }
        

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

        // let dist = self.boundingVolume.distanceToPoint(new THREE.Vector3(3980, 4980.416656099139, 3.2851604304346775));
        // if (dist< 1) {
        //     self.changeContentVisibility(false);
        //     console.log(dist+" "+self.level)
        // }
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
                if(self.refine == "REPLACE"){
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
                self.meshDisplayed &&
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
                    queryParams: self.queryParams,
                    parentGeometricError: self.geometricError,
                    parentBoundingVolume: self.boundingVolume,
                    parentRefine: self.refine,
                    json: childJSON,
                    rootPath: self.rootPath,
                    geometricErrorMultiplier: self.geometricErrorMultiplier,
                    loadOutsideView: self.loadOutsideView,
                    level: self.level + 1,
                    tileLoader: self.tileLoader,
                    cameraOnLoad: camera,
                    occlusionCullingService: self.occlusionCullingService,
                    renderer: self.renderer,
                    static: self.static,
                    centerModel: false,
                    yUp: self.yUp,
                    displayErrors: self.displayErrors,
                    displayCopyright: self.displayCopyright
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
                if (!child.materialVisibility || child.meshDisplayed) {
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
        if (!this.inFrustum) {
            return true;
        }
        // if json is not done loading
        if (this.hasUnloadedJSONContent) {
            return false;
        }
        // if this tile has no mesh content or if it's marked as visible false, look at children
        if ((!this.hasMeshContent || !this.meshContent || !this.materialVisibility)) {
            if (this.children.length > 0) {
                var allChildrenReady = true;
                this.childrenTiles.every(child => {
                    if (!child.isReady()) {
                        allChildrenReady = false;
                        return false;
                    }
                    return true;
                });
                return allChildrenReady;
            } else {
                return false
            }

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
        if (this.meshDisplayed) {
            return true;
        }

        return false;

    }




    changeContentVisibility(visibility) {
        const self = this;
        if (self.hasMeshContent && self.meshContent) {
            if (visibility) {
                self.layers.enable(0);
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

        self.meshDisplayed = true;
        /* if (!!self.meshContent && !!self.meshContent.traverse) {
            self.meshContent.traverse((element) => {
                if (element.material) firstRenderCalback(element, visibility);
            });
        } else if (!!self.meshContent && !!self.meshContent.scenes) {
            self.meshContent.scenes.forEach(scene => scene.traverse(function (element) {
                if (element.material) firstRenderCalback(element, visibility);
            }));
        }

        function firstRenderCalback(mesh, visibility) {
            if (!!visibility) {
                mesh.onAfterRender = () => {
                    delete mesh.onAfterRender;
                    self.meshDisplayed = true;
                };
            }

        } */

        
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
        if (!!this.renderer) {
            this.renderer.getDrawingBufferSize(rendererSize);
        }
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

function showError(error) {
    // Create a new div element
    var errorDiv = document.createElement("div");

    // Set its text content
    errorDiv.textContent = error;

    // Set styles
    errorDiv.style.position = 'fixed'; // Fix position to the viewport
    errorDiv.style.top = '10px'; // Set top position
    errorDiv.style.left = '50%'; // Center horizontally
    errorDiv.style.transform = 'translateX(-50%)'; // Make sure it's centered accurately
    errorDiv.style.padding = '10px'; // Add some padding
    errorDiv.style.backgroundColor = '#ff8800'; // Set a background color
    errorDiv.style.color = '#ffffff'; // Set a text color
    errorDiv.style.zIndex = '9999'; // Make sure it's on top of other elements

    // Append the new div to the body
    document.body.appendChild(errorDiv);

    // After 3 seconds, remove the error message
    setTimeout(function() {
        errorDiv.remove();
    }, 8000);
}

function updateCopyrightLabel(){
    // Create a new div
    if(!copyrightDiv){
        copyrightDiv = document.createElement('div');
    }

    // Join the array elements with a comma and a space
    var list = "";
    for(let key in copyright) {
        if(copyright.hasOwnProperty(key) && copyright[key] > 0) { // This checks if the key is actually part of the object and not its prototype.
            list+= key+", ";
        }
    }
    
    // Set the text content of the div
    copyrightDiv.textContent = list;

    // Style the div
    copyrightDiv.style.position = 'fixed';
    copyrightDiv.style.bottom = '20px';
    copyrightDiv.style.left = '20px';
    copyrightDiv.style.color = 'white';
    copyrightDiv.style.textShadow = '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';
    copyrightDiv.style.padding = '10px';
    copyrightDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'; // semi-transparent black background
    
    // Append the div to the body of the document
    document.body.appendChild(copyrightDiv);
}