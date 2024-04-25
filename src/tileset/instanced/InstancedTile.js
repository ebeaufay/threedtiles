import * as THREE from 'three';
import { OBB } from "../../geometry/obb";
import { v4 as uuidv4 } from "uuid";
import * as path from "path-browserify";

const tempSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
const tempVec1 = new THREE.Vector3(0, 0, 0);
const tempVec2 = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);
const rendererSize = new THREE.Vector2();
const tempQuaternion = new THREE.Quaternion();
const tempMatrix = new THREE.Matrix4();

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
     *   centerModel: Boolean,
     *   queryParams: String
     * } properties 
     */
    constructor(properties) {
        super();
        const self = this;
        if(properties.queryParams){
            this.queryParams =  { ...properties.queryParams };
        }
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
        this.meshContent = new Set();

        this.static = properties.static;
        if (this.static) {
            this.matrixAutoUpdate = false;
            this.matrixWorldAutoUpdate = false;
        }
        this.tileContent;
        this.refinement; // defaults to "REPLACE"
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

        this.deleted = false;
        this.abortController = new AbortController();

        if (!!properties.json) { // If this tile is created as a child of another tile, properties.json is not null
            this.rootPath = !!properties.json.rootPath ? properties.json.rootPath : properties.rootPath;
            if (properties.json.children) this.jsonChildren = properties.json.children;
            self.setup(properties);
        } else if (properties.url) { // If only the url to the tileset.json is provided


            this.loadJson = (json, url) => {
                //json = JSON.parse(JSON.stringify(json))
                const p = path.dirname(url);
                self.setup({ rootPath: p, json: json, onLoadCallback: properties.onLoadCallback });
                
                

            }
            var url = properties.url;
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
            self.tileLoader.get(self.abortController, url, self.uuid, self);
        }
    }

    async setup(properties) {
        const self = this;
        
        if (!!properties.json.root) {
            self.json = properties.json.root;
            if(!self.json.children && self.json.getChildren){
                self.json.children = await self.json.getChildren();
            }
            self.jsonChildren = self.json.children;
            if (!self.json.refinement) self.json.refinement = properties.json.refinement;
            if (!self.json.geometricError) self.json.geometricError = properties.json.geometricError;
            if (!self.json.transform) self.json.transform = properties.json.transform;
            if (!self.json.boundingVolume) self.json.boundingVolume = properties.json.boundingVolume;
        } else {
            self.json = properties.json;
            if(!self.json.children && self.json.getChildren){
                self.json.children = await self.json.getChildren();
                self.jsonChildren = self.json.children;
            }
        }
        
        self.rootPath = !!properties.json.rootPath ? properties.json.rootPath : properties.rootPath;

        // decode refinement
        if (!!self.json.refinement) {
            self.refinement = self.json.refinement;
        } else {
            self.refinement = properties.parentRefinement;
        }
        // decode geometric error
        if (!!self.json.geometricError) {
            self.geometricError = self.json.geometricError;
        } else {
            self.geometricError = properties.parentGeometricError;
        }
        // decode transform
        if (!!self.json.transform && !self.centerModel) {
            let mat = new THREE.Matrix4();
            mat.elements = self.json.transform;
            self.master.applyMatrix4(mat);
        }
        // decode volume
        if (!!self.json.boundingVolume) {
            if (!!self.json.boundingVolume.box) {
                self.boundingVolume = new OBB(self.json.boundingVolume.box);
            } else if (!!self.json.boundingVolume.region) {
                const region = self.json.boundingVolume.region;
                self.transformWGS84ToCartesian(region[0], region[1], region[4], tempVec1);
                self.transformWGS84ToCartesian(region[2], region[3], region[5], tempVec2);
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

        function checkContent(e) {
            if (!!e.uri && e.uri.includes("json")) {
                self.hasUnloadedJSONContent++;
            } else if (!!e.url && e.url.includes("json")) {
                self.hasUnloadedJSONContent++;
            } else {
                self.hasMeshContent++;
            }
        }
        if (!!self.json.content) { //if there is a content, json or otherwise, schedule it to be loaded 
            checkContent(self.json.content);
            
            self.load();
        } else if (!!self.json.contents) { //if there is a content, json or otherwise, schedule it to be loaded 
            self.json.contents.forEach(e => checkContent(e))

            self.load();
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
                self.transformWGS84ToCartesian(
                    (self.json.boundingVolume.region[0] + self.json.boundingVolume.region[2]) * 0.5,
                    (self.json.boundingVolume.region[1] + self.json.boundingVolume.region[3]) * 0.5,
                    (self.json.boundingVolume.region[4] + self.json.boundingVolume.region[5]) * 0.5,
                    tempVec1);

                tempQuaternion.setFromUnitVectors(tempVec1.normalize(), upVector.normalize());
                self.master.applyQuaternion(tempQuaternion);
                self.master.updateWorldMatrix(false, false)
            }
            tempMatrix.makeTranslation(-tempSphere.center.x * self.scale.x, -tempSphere.center.y * self.scale.y, -tempSphere.center.z * self.scale.z);
            //self.master.applyMatrix4(tempMatrix);
            self.master.matrix.multiply(tempMatrix);
            self.master.matrix.decompose(self.master.position, self.master.quaternion, self.master.scale);
        }

        self.isSetup = true;
        if (properties.onLoadCallback) properties.onLoadCallback(self);
    }

    isAbsolutePathOrURL(input) {
        // Check if it's an absolute URL with various protocols
        const urlRegex = /^(?:http|https|ftp|tcp|udp):\/\/\S+/;
        const absoluteURL = urlRegex.test(input);

        // Check if it's an absolute path
        const absolutePath = input.startsWith('/') && !input.startsWith('//');

        return absoluteURL || absolutePath;
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
            
            loadContent(self.json.content);
        }else if(!!self.json.contents){
            self.json.contents.forEach(content=>loadContent(content))
        }
        function loadContent(content){
            let url;
            if (!!content.uri) {
                url = content.uri;
            } else if (!!content.url) {
                url = content.url;
            }
            const urlRegex = /^(?:http|https|ftp|tcp|udp):\/\/\S+/;

            if (urlRegex.test(self.rootPath)) { // url
                if (!urlRegex.test(url)) {
                    url = self.assembleURL(self.rootPath, url)
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

                    
                    self.tileLoader.get(self.abortController, url, self.uuid, self, !self.cameraOnLoad ? () => 0 : () => {
                        return self.calculateDistanceToCamera(self.cameraOnLoad);
                    }, () => self.getSiblings(),
                        self.level,
                        !!self.json.boundingVolume.region?false : true,
                        !!self.json.boundingVolume.region,
                        self.geometricError);
                } else if (url.includes(".json")) {
                    self.tileLoader.get(self.abortController, url, self.uuid, self);
                }
            }
        }
        self.matrixWorldNeedsUpdate = true;
        self.updateWorldMatrix(true, true)
    }

    loadMesh(mesh) {
        const self = this;
        if (self.deleted) {
            return;
        }
        //self.updateWorldMatrix(false, true);
        self.meshContent.add(mesh);

    }

    loadJson(json, url) {
        if (this.deleted) {
            return;
        }
        if (!!this.json.children) {
            this.jsonChildren = this.json.children;
        }

        json.rootPath = path.dirname(url);
        this.jsonChildren.push(json);
        this.hasUnloadedJSONContent--;
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
        if(!self.isSetup) return;
        
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

            if ((!self.hasMeshContent && self.rootPath) || (metric < self.master.geometricErrorMultiplier * self.geometricError && self.meshContent.size>0)) {
                if (!!self.json && !!self.jsonChildren && self.childrenTiles.length != self.jsonChildren.length) {
                    loadJsonChildren();
                    return;
                }
            }
        }

        function updateNodeVisibility(metric) {

            //doesn't have a mesh content
            if (!self.hasMeshContent) {
                return;
            }
            // mesh content not yet loaded
            if (self.meshContent.size<self.hasMeshContent) {
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
            if (metric >= self.master.geometricErrorMultiplier * self.geometricError) { // Ideal LOD or before ideal lod

                self.changeContentVisibility(true);
            } else if (metric < self.master.geometricErrorMultiplier * self.geometricError) { // Ideal LOD is past this one
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
            if (metric >= self.master.geometricErrorMultiplier * self.geometricError) {
                self.disposeChildren();
                updateNodeVisibility(metric);
                return;
            }

        } 
         

        function loadJsonChildren() {
            self.jsonChildren.forEach(childJSON => {
                if(!childJSON.root && !childJSON.children && !childJSON.getChildren && !childJSON.content && !childJSON.contents ){
                    return;
                }
                let childTile = new InstancedTile({
                    parentTile: self,
                    queryParams: self.queryParams,
                    parentGeometricError: self.geometricError,
                    parentBoundingVolume: self.boundingVolume,
                    parentRefinement: self.refinement,
                    json: childJSON,
                    rootPath: self.rootPath,
                    loadOutsideView: self.loadOutsideView,
                    level: self.level + 1,
                    tileLoader: self.tileLoader,
                    cameraOnLoad: camera,
                    master: self.master,
                    centerModel: false,
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
        if (this.hasUnloadedJSONContent) {
            return false;
        }
        if ((!this.hasMeshContent || this.meshContent.size == 0|| !this.materialVisibility)) {
            if(this.childrenTiles.length>0){
                var allChildrenReady = true;
                this.childrenTiles.every(child => {
                    if (!child.isReady()) {
                        allChildrenReady = false;
                        return false;
                    }
                    return true;
                });
                return allChildrenReady;
            }else{
                return false;
            }
            
        }
        // if this tile has no mesh content
        if (!this.hasMeshContent) {
            return true;
        }
        // if mesh content not yet loaded
        if (this.meshContent.size<this.hasMeshContent) {
            return false;
        }

        // if this tile has been marked to hide it's content
        if (!this.materialVisibility) {
            return false;
        }

        
        return true;

    }


    changeContentVisibility(visibility) {
        const self = this;
        self.materialVisibility = visibility;
        
        

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
        } else {
            console.error("unsupported shape");
            return -1
        }

        /////// return metric based on geometric error and distance

        const distance = Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius);
        if (distance == 0) {
            return 0;
        }
        const scale = this.master.matrixWorld.getMaxScaleOnAxis();
        this.master._renderSize(rendererSize);
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
            tempSphere.applyMatrix4(this.master.matrixWorld);
            //if (!frustum.intersectsSphere(tempSphere)) return -1;
        } else if (this.boundingVolume instanceof THREE.Sphere) {
            //sphere
            tempSphere.copy(this.boundingVolume);
            tempSphere.applyMatrix4(this.master.matrixWorld);
            //if (!frustum.intersectsSphere(tempSphere)) return -1;
        }
        else {
            console.error("unsupported shape")
        }
        return Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius);
    }

    getWorldMatrix() {
        const self = this;
        return self.master.matrixWorld;
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
export { InstancedTile };