import * as THREE from 'three';
import { OBB } from "../geometry/obb";
import { TileLoader } from "./TileLoader";
import { v4 as uuidv4 } from "uuid";
import * as path from "path-browserify"
import { clamp } from "three/src/math/MathUtils";
import {resolveImplicite} from './implicit/ImplicitTileResolver.js';
//import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
var averageTime = 0;
var numTiles = 0;
var copyrightDiv;
const tempSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
const tempBox3 = new THREE.Box3();
const tempVec1 = new THREE.Vector3(0, 0, 0);
const tempVec2 = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);

const tempQuaternion = new THREE.Quaternion();
const copyright = {};

/**
 * class representing a tiled and multileveled mesh or point-cloud according to the OGC3DTiles 1.1 spec
 * @class
 * @extends {THREE.Object3D}
 */
class OGC3DTile extends THREE.Object3D {

    /**
     * @param {Object} [properties] - the properties for this tileset
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
     * @param {THREE.Renderer} [properties.renderer] - optional the renderer used to display the tileset. Used to infer render resolution at runtime and to instantiate a ktx2loader on the fly if not provided. 
     * @param {Number} [properties.domWidth] - optional the canvas width (used to calculate geometric error). If a renderer is provided, it'll be used instead, else a default value is used.  
     * @param {Number} [properties.domHeight] - optional the canvas height (used to calculate geometric error). If a renderer is provided, it'll be used instead, else a default value is used.  
     * @param {DracoLoader} [properties.dracoLoader] - optional a draco loader (three/addons).
     * @param {KTX2Loader} [properties.ktx2Loader] - optional a ktx2 loader (three/addons).
     */
    constructor(properties) {
        super();
        const self = this;

        if(!!properties.domWidth && !!properties.domHeight){
            this.rendererSize = new THREE.Vector2(properties.domWidth, properties.domHeight);
        }else{
            this.rendererSize = new THREE.Vector2(1000, 1000);
        }
        this.proxy = properties.proxy;
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
                points.material.size = Math.pow(geometricError, 0.33);
                points.material.sizeAttenuation = true;
            } : properties.pointsCallback;
            tileLoaderOptions.proxy = this.proxy;
            tileLoaderOptions.renderer = properties.renderer;
            tileLoaderOptions.dracoLoader = properties.dracoLoader;
            tileLoaderOptions.ktx2Loader = properties.ktx2Loader;
            this.tileLoader = new TileLoader(tileLoaderOptions);
            this.update = (camera)=>{
                this.update(camera);
                this.tileLoader.update();
            }
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
            this.matrixWorldAutoUpdate = false;
        }

        // declare properties specific to the tile for clarity
        this.childrenTiles = [];
        this.meshContent = [];
        this.tileContent;
        this.refine; // defaults to "REPLACE"
        this.rootPath;
        this.geometricError;
        this.boundingVolume;
        this.json; // the json corresponding to this tile
        this.materialVisibility = false;
        this.inFrustum = true;
        this.level = properties.level ? properties.level : 0;
        this.hasMeshContent = 0; // true when the provided json has a content field pointing to a B3DM file
        this.hasUnloadedJSONContent = 0; // true when the provided json has a content field pointing to a JSON file that is not yet loaded
        this.centerModel = properties.centerModel;
        this.abortController = new AbortController();
        //this.layers.disable(0);
        //this.octree = new Octree();

        if (!!properties.json) { // If this tile is created as a child of another tile, properties.json is not null

            self._setup(properties);
            

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
                result.json().then(json=>{return resolveImplicite(json, url)}).then(json => {
                    self._setup({ rootPath: path.dirname(properties.url), json: json, onLoadCallback: properties.onLoadCallback });
                });
            }).catch(e => { if (self.displayErrors) _showError(e) });
        }
    }

    /**
     * Call this to specify the canvas width/height when it changes (used to compute tiles geometric error that controls tile refinement).
     * It's unnecessary to call this when the {@link OGC3DTile} is instantiated with the renderer.
     * 
     * @param {Number} width 
     * @param {Number} height 
     */
    setCanvasSize(width, height){
        this.rendererSize.set(width, height);
    }

    async _setup(properties) {
        const self = this;
        if (!!properties.json.root) {
            self.json = properties.json.root;
            if (!self.json.refine) self.json.refine = properties.json.refine;
            if (!self.json.geometricError) self.json.geometricError = properties.json.geometricError;
            if (!self.json.transform) self.json.transform = properties.json.transform;
            if (!self.json.boundingVolume) self.json.boundingVolume = properties.json.boundingVolume;
        } else {
            self.json = properties.json;
        }

        if (!self.json.children) {
            if (self.json.getChildren) {
                self.json.children = await self.json.getChildren();
            } else {
                self.json.children = [];
            }
        }
        self.rootPath = !!properties.json.rootPath ? properties.json.rootPath : properties.rootPath;

        // decode refine
        if (!!self.json.refine) {
            self.refine = self.json.refine;
        } else {
            self.refine = properties.parentRefine;
        }
        // decode geometric error
        if (!!self.json.geometricError) {
            self.geometricError = self.json.geometricError;
        } else {
            self.geometricError = properties.parentGeometricError;
        }


        // decode transform
        if (!!self.json.transform) {
            let mat = new THREE.Matrix4();
            mat.elements = self.json.transform;
            self.applyMatrix4(mat);
            
        }

        // decode volume
        if (!!self.json.boundingVolume) {
            if (!!self.json.boundingVolume.box) {
                self.boundingVolume = new OBB(self.json.boundingVolume.box);
            } else if (!!self.json.boundingVolume.region) {
                const region = self.json.boundingVolume.region;
                self._transformWGS84ToCartesian(region[0], region[1], region[4], tempVec1);
                self._transformWGS84ToCartesian(region[2], region[3], region[5], tempVec2);
                tempVec1.lerp(tempVec2, 0.5);
                self.boundingVolume = new THREE.Sphere(new THREE.Vector3(tempVec1.x, tempVec1.y, tempVec1.z), tempVec1.distanceTo(tempVec2));
            } else if (!!self.json.boundingVolume.sphere) {
                const sphere = self.json.boundingVolume.sphere;
                self.boundingVolume = new THREE.Sphere(new THREE.Vector3(sphere[0], sphere[1], sphere[2]), sphere[3]);
            } else {
                self.boundingVolume = properties.parentBoundingVolume;
            }
        } else {
            self.boundingVolume = properties.parentBoundingVolume;
        }



        function _checkContent(e) {
            if (!!e.uri && e.uri.includes("json")) {
                self.hasUnloadedJSONContent++;
            } else if (!!e.url && e.url.includes("json")) {
                self.hasUnloadedJSONContent++;
            } else {
                self.hasMeshContent++;
            }
        }
        if (!!self.json.content) { //if there is a content, json or otherwise, schedule it to be loaded 
            _checkContent(self.json.content);

            self._load();
        } else if (!!self.json.contents) { //if there is a content, json or otherwise, schedule it to be loaded 
            self.json.contents.forEach(e => _checkContent(e))

            self._load();
            //scheduleLoadTile(this);
        }

        
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
                this._transformWGS84ToCartesian(
                    (this.json.boundingVolume.region[0] + this.json.boundingVolume.region[2]) * 0.5,
                    (this.json.boundingVolume.region[1] + this.json.boundingVolume.region[3]) * 0.5,
                    (this.json.boundingVolume.region[4] + this.json.boundingVolume.region[5]) * 0.5,
                    tempVec1);

                tempQuaternion.setFromUnitVectors(tempVec1.normalize(), upVector.normalize());
                self.applyQuaternion(tempQuaternion);
            }
            tempSphere.center.applyMatrix4(self.matrix);
            self.translateX(-tempSphere.center.x);
            self.translateY(-tempSphere.center.y);
            self.translateZ(-tempSphere.center.z);

        }
        if (properties.onLoadCallback) properties.onLoadCallback(self);
        self.isSetup = true;
    }
    _assembleURL(root, relative) {
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

    _extractQueryParams(url, params) {
        const urlObj = new URL(url);

        // Iterate over all the search parameters
        for (let [key, value] of urlObj.searchParams) {
            params[key] = value;
        }

        // Remove the query string
        urlObj.search = '';
        return urlObj.toString();
    }
    async _load() {
        var self = this;
        if (self.deleted) return;
        if (!!self.json.content) {
            await loadContent(self.json.content, null);
        } else if (!!self.json.contents) {
            let promises = self.json.contents.map((content, index) => loadContent(content, index));

            Promise.all(promises)
            //self.json.contents.forEach(content=> loadContent(content, i))
        }

        async function loadContent(content, contentIndex) {
            let url;
            if (!!content.uri) {
                url = content.uri;
            } else if (!!content.url) {
                url = content.url;
            }
            const urlRegex = /^(?:http|https|ftp|tcp|udp):\/\/\S+/;

            if (urlRegex.test(self.rootPath)) { // url

                if (!urlRegex.test(url)) {
                    url = self._assembleURL(self.rootPath, url);
                }
            } else { //path
                if (path.isAbsolute(self.rootPath)) {
                    url = self.rootPath + path.sep + url;
                }
            }
            url = self._extractQueryParams(url, self.queryParams);
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

                    try {
                        self.tileLoader.get(self.abortController, self.uuid, url, mesh => {
                            if (!!self.deleted) return;

                            if (mesh.asset && mesh.asset.copyright) {
                                mesh.asset.copyright.split(';').forEach(s => {
                                    if (!!copyright[s]) {
                                        copyright[s]++;
                                    } else {
                                        copyright[s] = 1;
                                    }
                                });
                                if (self.displayCopyright) {
                                    _updateCopyrightLabel();
                                }
                            }
                            mesh.traverse((o) => {
                                if (o.isMesh || o.isPoints) {
                                    o.layers.disable(0);
                                    
                                    //if(o.material.transparent) o.layers.enable(31);
                                }
                                if (o.isMesh) {
                                    
                                    if (self.occlusionCullingService) {
                                        const position = o.geometry.attributes.position;
                                        const colors = [];
                                        for (let i = 0; i < position.count; i++) {
                                            colors.push(self.color.r, self.color.g, self.color.b);
                                        }
                                        o.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                                    }

                                    //o.material.visible = false;
                                }
                            });
                            
                            //self.octree.fromGraphNode( mesh );
                            /*averageTime*=numTiles;
                            averageTime+=Date.now()-s;
                            numTiles++;
                            averageTime/=numTiles;
                            console.log(averageTime);*/
                            self.add(mesh);
                            mesh.matrixWorldNeedsUpdate = true;
                            if(self.static){
                                self.matrixWorldNeedsUpdate = true;
                                //self.updateMatrix();
                                if(self.parentTile){
                                    self.parentTile.updateMatrixWorld(true);
                                    //self.parentTile.updateWorldMatrix(true, true);
                                }
                            }
                            
                            
                            
                            // mesh.layers.disable(0);
                            self.meshContent.push(mesh);
                        }, !self.cameraOnLoad ? () => 0 : () => {
                            return self._calculateDistanceToCamera(self.cameraOnLoad);
                        }, () => self._getSiblings(),
                            self.level,
                            !!self.json.boundingVolume.region ? false : true,
                            !!self.json.boundingVolume.region,
                            self.geometricError
                        );
                    } catch (e) {
                        if (self.displayErrors) _showError(e)
                    }

                } else if (url.includes(".json")) {
                    self.tileLoader.get(self.abortController, self.uuid, url, async json => {
                        if (!!self.deleted) return;

                        json.rootPath = path.dirname(url);
                        self.json.children.push(json);
                        if (contentIndex == null) {
                            delete self.json.content;
                        } else {
                            delete self.json.contents.splice(contentIndex, 1);
                        }

                        self.hasUnloadedJSONContent--;
                    });

                }

            }
        }
    }

    /**
     * Disposes of all the resources used by the tileset.
     */
    dispose() {

        const self = this;
        self.meshContent.forEach(mc => {
            if (!!mc && !!mc.asset && mc.asset.copyright) {
                mc.asset.copyright.split(';').forEach(s => {
                    if (!!copyright[s]) {
                        copyright[s]--;
                    }
                });
                if (self.displayCopyright) {
                    _updateCopyrightLabel();
                }
            }
        })



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
    _disposeChildren() {
        var self = this;

        self.childrenTiles.forEach(tile => tile.dispose());
        self.childrenTiles = [];
        self.children = [];
        if (self.meshContent.length > 0) {
            self.meshContent.forEach(mc => {
                self.children.push(mc);
            });
        }
    }

    /**
     * To be called in the render loop.
     * @param {Three.Camera} camera a camera that the tileset will be rendered with.
     */
    update(camera) {
    
        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        this._update(camera, frustum);
    }
    _update(camera, frustum) {
        const self = this;
        if(!self.isSetup) return;
        // let dist = self.boundingVolume.distanceToPoint(new THREE.Vector3(3980, 4980.416656099139, 3.2851604304346775));
        // if (dist< 1) {
        //     self._changeContentVisibility(false);
        //     console.log(dist+" "+self.level)
        // }
        const visibilityBeforeUpdate = self.materialVisibility;

        if (!!self.boundingVolume && !!self.geometricError) {
            self.metric = self._calculateUpdateMetric(camera, frustum);
        }
        self.childrenTiles.forEach(child => child._update(camera, frustum));

        _updateNodeVisibility(self.metric);
        updateTree(self.metric);
        _trimTree(self.metric, visibilityBeforeUpdate);


        function updateTree(metric) {
            // If this tile does not have mesh content but it has children
            if (metric < 0 && self.hasMeshContent) return;
            if (self.occlusionCullingService && self.hasMeshContent && !self.occlusionCullingService.hasID(self.colorID)) {
                return;
            }
            if (!self.hasMeshContent || (metric < self.geometricErrorMultiplier * self.geometricError && self.meshContent.length > 0)) {
                if (!!self.json && !!self.json.children && self.childrenTiles.length != self.json.children.length) {
                    _loadJsonChildren();
                    return;
                }
            }
        }

        function _updateNodeVisibility(metric) {

            //doesn't have a mesh content
            if (!self.hasMeshContent) return;

            // mesh content not yet loaded
            if (self.meshContent < self.hasMeshContent) {
                return;
            }

            // outside frustum
            if (metric < 0) {
                self.inFrustum = false;
                self._changeContentVisibility(!!self.loadOutsideView);
                return;
            } else {
                self.inFrustum = true;
            }

            // has no children
            if (self.childrenTiles.length == 0) {
                self._changeContentVisibility(true);
                return;
            }

            // has children
            if (metric >= self.geometricErrorMultiplier * self.geometricError) { // Ideal LOD or before ideal lod

                self._changeContentVisibility(true);
            } else if (metric < self.geometricErrorMultiplier * self.geometricError) { // Ideal LOD is past this one
                // if children are visible and have been displayed, can be hidden
                if (self.refine == "REPLACE") {
                    let allChildrenReady = true;
                    self.childrenTiles.every(child => {

                        if (!child._isReady()) {
                            allChildrenReady = false;
                            return false;
                        }
                        return true;
                    });
                    if (allChildrenReady) {
                        self._changeContentVisibility(false);
                    }
                }


            }
        }

        function _trimTree(metric, visibilityBeforeUpdate) {
            if (!self.hasMeshContent) return;
            if (!self.inFrustum) { // outside frustum
                self._disposeChildren();
                _updateNodeVisibility(metric);
                return;
            }
            if (self.occlusionCullingService &&
                !visibilityBeforeUpdate &&
                self.hasMeshContent &&
                self.meshContent.length > 0 &&
                self.meshDisplayed &&
                self._areAllChildrenLoadedAndHidden()) {

                self._disposeChildren();
                _updateNodeVisibility(metric);
                return;
            }
            if (metric >= self.geometricErrorMultiplier * self.geometricError) {
                self._disposeChildren();
                _updateNodeVisibility(metric);
                return;
            }

        }

        function _loadJsonChildren() {
            for (let i = self.json.children.length - 1; i >= 0; i--) {
                if (!self.json.children[i].root && !self.json.children[i].children && !self.json.children[i].getChildren && !self.json.children[i].content && !self.json.children[i].contents) {
                    self.json.children.splice(i, 1);
                }
            }
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
                    displayErrors: self.displayErrors,
                    displayCopyright: self.displayCopyright
                });
                self.childrenTiles.push(childTile);
                self.add(childTile);
            });
        }

    }

    _areAllChildrenLoadedAndHidden() {
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
                if (!child._areAllChildrenLoadedAndHidden()) {
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
    _isReady() {
        // if outside frustum
        if (!this.inFrustum) {
            return true;
        }
        // if json is not done loading
        if (this.hasUnloadedJSONContent) {
            return false;
        }
        // if this tile has no mesh content or if it's marked as visible false, look at children
        if ((!this.hasMeshContent || this.meshContent.length == 0 || !this.materialVisibility)) {
            if (this.children.length > 0) {
                var allChildrenReady = true;
                this.childrenTiles.every(child => {
                    if (!child._isReady()) {
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
        if (this.meshContent.length < this.hasMeshContent) {
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




    _changeContentVisibility(visibility) {
        const self = this;
        if (self.hasMeshContent && self.meshContent.length > 0) {
            if (visibility) {
                self.meshContent.forEach(mc => {
                    mc.traverse((o) => {
                        if (o.isMesh || o.isPoints) {
                            o.layers.enable(0);
                        }
                    });
                })

            } else {
                self.meshContent.forEach(mc => {
                    mc.traverse((o) => {
                        if (o.isMesh || o.isPoints) {
                            o.layers.disable(0);
                        }
                    });
                })

            }
        }

        if (self.materialVisibility == visibility) {
            return;
        }
        self.materialVisibility = visibility

        self.meshDisplayed = true;



    }
    _calculateUpdateMetric(camera, frustum) {
        ////// return -1 if not in frustum
        let distance = 0;
        if (this.boundingVolume instanceof OBB) {
            // box
            tempBox3.copy(this.boundingVolume.aabb);
            tempBox3.applyMatrix4(this.matrixWorld);
            if (!frustum.intersectsBox(tempBox3)) return -1;
            distance = Math.max(0, tempBox3.distanceToPoint(camera.position) - camera.near);

            /* tempSphere.copy(this.boundingVolume.sphere);
            tempSphere.applyMatrix4(this.matrixWorld);
            if (!frustum.intersectsSphere(tempSphere)) return -1;
            distance = Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius); */
        } else if (this.boundingVolume instanceof THREE.Sphere) {
            //sphere
            tempSphere.copy(this.boundingVolume);
            tempSphere.applyMatrix4(this.matrixWorld);
            if (!frustum.intersectsSphere(tempSphere)) return -1;
            distance = Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius - camera.near);
        } else {
            console.error("unsupported shape");
            return -1

        }

        /////// return metric based on geometric error and distance

        
        if (distance == 0) {
            return 0;
        }
        const scale = this.matrixWorld.getMaxScaleOnAxis();
        if (!!this.renderer) {
            this.renderer.getDrawingBufferSize(this.rendererSize);
        }
        let s = this.rendererSize.y;
        let fov = camera.fov;
        if (camera.aspect < 1) {
            fov *= camera.aspect;
            s = this.rendererSize.x;
        }

        let lambda = 2.0 * Math.tan(0.5 * fov * 0.01745329251994329576923690768489) * distance;

        return (window.devicePixelRatio * 16 * lambda) / (s * scale);
    }

    _getSiblings() {
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
    _calculateDistanceToCamera(camera) {
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

    /**
     * Set the Geometric Error Multiplier for the tileset.
     * the {@param geometricErrorMultiplier} can be a number between 1 and infinity.
     * A {@param geometricErrorMultiplier} of 1 (default) corresponds to a max ScreenSpace error (MSE) of 16.  
     * A lower {@param geometricErrorMultiplier} loads less detail (higher MSE) and a higher {@param geometricErrorMultiplier} loads more detail (lower MSE)
     * 
     * @param {Number} geometricErrorMultiplier set the LOD multiplier for the entire tileset
     */
    setGeometricErrorMultiplier(geometricErrorMultiplier) {
        this.geometricErrorMultiplier = geometricErrorMultiplier;
        this.childrenTiles.forEach(child => child.setGeometricErrorMultiplier(geometricErrorMultiplier));
    }

    _transformWGS84ToCartesian(lon, lat, h, sfct) {
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

function _showError(error) {
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
    setTimeout(function () {
        errorDiv.remove();
    }, 8000);
}

function _updateCopyrightLabel() {
    // Create a new div
    if (!copyrightDiv) {
        copyrightDiv = document.createElement('div');
    }

    // Join the array elements with a comma and a space
    var list = "";
    for (let key in copyright) {
        if (copyright.hasOwnProperty(key) && copyright[key] > 0) { // This checks if the key is actually part of the object and not its prototype.
            list += key + ", ";
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