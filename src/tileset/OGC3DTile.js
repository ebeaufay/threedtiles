import * as THREE from 'three';
import { OBB } from "../geometry/obb";
import { TileLoader } from "./TileLoader";
import { v4 as uuidv4 } from "uuid";
import * as path from "path-browserify"
import { resolveImplicite } from './implicit/ImplicitTileResolver.js';
import { SplatsMesh } from '../splats/SplatsMesh';
import { SplatsMeshWebGPU } from '../splats/SplatsMeshWebGPU';
import {ColliderShape} from '../simulation/ColliderShape';
var averageTime = 0;


var copyrightDiv;
const tempSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
const tempOBB = new OBB([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]);
const tempBox3 = new THREE.Box3();
const tempVec1 = new THREE.Vector3(0, 0, 0);
const tempVec2 = new THREE.Vector3(0, 0, 0);

const upVector = new THREE.Vector3(0, 1, 0);
const tempRay = new THREE.Ray();
const inverseWorld = new THREE.Matrix4();
const transformedProjection = new THREE.Matrix4();
const frustum = new THREE.Frustum();
const transformedCameraPosition = new THREE.Vector3();
const tempIntersects = [];

const tempQuaternion = new THREE.Quaternion();
const copyright = {};

/**
 * @returns a list of vendors that are required by copyright to be displayed in the app.
 */
function getOGC3DTilesCopyrightInfo() {
    var list = [];
    for (let key in copyright) {
        if (copyright.hasOwnProperty(key) && copyright[key] > 0) { // This checks if the key is actually part of the object and not its prototype.
            list.push(key);
        }
    }
    return list;

}


/**
 * class representing a tiled and multileveled mesh or point-cloud according to the OGC3DTiles 1.1 spec
 * @class
 * @extends {THREE.Object3D}
 */
class OGC3DTile extends THREE.Object3D {

    /**
     * @param {Object} [properties] - the properties for this tileset
     * @param {String} [properties.url] - the url to the parent tileset.json
     * @param {Object} [properties.queryParams = undefined] - optional, path params to add to individual tile urls
     * @param {Number} [properties.geometricErrorMultiplier = 1] - the geometric error of the parent. 1.0 by default corresponds to a maxScreenSpaceError of 16
     * @param {Boolean} [properties.loadOutsideView = false] - if truthy, tiles otside the camera frustum will be loaded with the least possible amount of detail
     * @param {TileLoader} [properties.tileLoader = undefined] - A tile loader that can be shared among tilesets in order to share a common cache.
     * @param {Function} [properties.meshCallback = undefined] - A callback function that will be called on every mesh (if TileLoader is provided, this function will be overridden by the tileLoader's own callback)
     * @param {Function} [properties.pointsCallback = undefined] - A callback function that will be called on every points (if TileLoader is provided, this function will be overridden by the tileLoader's own callback)
     * @param {Function} [properties.onLoadCallback = undefined] - A callback function that will be called when the root tile has been loaded
     * @param {OcclusionCullingService} [properties.occlusionCullingService = undefined] - A service that handles occlusion culling
     * @param {Boolean} [properties.centerModel = false] - If true, the tileset will be centered on 0,0,0 and in the case of georeferenced tilesets that use the "region" bounding volume, it will also be rotated so that the up axis matched the world y axis.
     * @param {Boolean} [properties.static = false] - If true, the tileset is considered static which improves performance but the matrices aren't automatically updated
     * @param {String} [properties.rootPath = undefined] - optional the root path for fetching children
     * @param {String} [properties.json = undefined] - optional json object representing the tileset sub-tree
     * @param {Number} [properties.parentGeometricError = undefined] - optional geometric error of the parent
     * @param {Object} [properties.parentBoundingVolume = undefined] - optional bounding volume of the parent
     * @param {String} [properties.parentRefine = undefined] - optional refine strategy of the parent of the parent
     * @param {THREE.Camera} [properties.cameraOnLoad = undefined] - optional the camera used when loading this particular sub-tile
     * @param {THREE.Box3|THREE.Sphere|OBB} [properties.clipShape = undefined] - optional, specify a clip shape object in world space and tiles outside of the shape will not be loaded. The shape is either a THREE.Box3, THREE.Sphere or OBB (import {OBB} from "threedtiles")
     * @param {OGC3DTile} [properties.parentTile = undefined] - optional the OGC3DTile object that loaded this tile as a child
     * @param {String} [properties.proxy = undefined] - optional the url to a proxy service. Instead of fetching tiles via a GET request, a POST will be sent to the proxy url with the real tile address in the body of the request.
     * @param {Boolean} [properties.displayErrors = false] - optional value indicating that errors should be shown on screen.
     * @param {THREE.Renderer} [properties.renderer = undefined] - optional the renderer used to display the tileset. Used to infer render resolution at runtime and to instantiate a ktx2loader on the fly if not provided. 
     * @param {Number} [properties.domWidth = undefined] - optional the canvas width (used to calculate geometric error). If a renderer is provided, it'll be used instead, else a default value is used.  
     * @param {Number} [properties.domHeight = undefined] - optional the canvas height (used to calculate geometric error). If a renderer is provided, it'll be used instead, else a default value is used.  
     * @param {DracoLoader} [properties.dracoLoader = undefined] - optional a draco loader (three/addons).
     * @param {KTX2Loader} [properties.ktx2Loader = undefined] - optional a ktx2 loader (three/addons).
     * @param {Number} [properties.distanceBias = 1] - optional a bias that allows loading more or less detail closer to the camera relative to far away. The value should be a positive number. A value below 1 loads less detail near the camera and a value above 1 loads more detail near the camera. This needs to be compensated by the geometricErrorMultiplier in order to load a reasonable number of tiles.
     * @param {String} [properties.loadingStrategy = "INCREMENTAL"] - optional a strategy for loading tiles 
     *      -  "INCREMENTAL" loads intermediate LODs and will load nearer tiles first
     *      -  "PERLEVEL" loads intermediate LODs and loads nearer tiles first but waits for all tiles of the lowest level to be loaded before loading higher detail tiles
     *      -  "IMMEDIATE" skips intermediate LODs. tiles are missing until loaded when moving to a new area
     * @param {String} [properties.drawBoundingVolume = false] - optional draws the bounding volume (may cause flickering)
     * @param {String} [properties.splatsFragmentShader = undefined] - optional pass a custom fragment shader for rendering splats
     * @param {number} [properties.splatsQuality = 0.75] - optional pass a visual quality for splats between 0 and 1. Lower quality improves performance at the cost of visual approximations.
     * @param {boolean} [properties.splatsCPUCulling = false] - optional if true, splats are culled on CPU asynchronously. Better frame-rate and faster sorting but splats are absent when camera moves quickly until sort finishes.
     *
     * @param {number} [properties.splatsExposureEV = 0.0] - optional exposure compensation in EV (stops). Typical useful range: -6 → +6. Positive brightens, negative darkens.
     * @param {number} [properties.splatsSaturation = 1.0] - optional saturation multiplier. Typical useful range: 0.0 → 2.0 (1.0 = unchanged).
     * @param {number} [properties.splatsContrast = 1.0] - optional contrast multiplier. Typical useful range: 0.0 → 2.0 (1.0 = unchanged).
     * @param {Array|Object} [properties.splatsTempTint = [0.0, 0.0]] - optional temperature and tint pair for simple white-balance adjustment. Values: temperature ∈ [-100,100], tint ∈ [-100,100]. Default [0,0].
     * @param {Object} [properties.physics.sim = undefined] - physics sim helper {@link physics.js}
     * @param {String} [properties.physics.type = fixed] - type: 'dynamic' | 'kinematic' | 'fixed' (default 'fixed')
     * @param {String} [properties.physics.shape = none] - LEGACY single collider shape: 'none' | 'mesh' | 'bounds' | 'hull'. Used only when no advanced collider rules are provided.
     * @param {number} [properties.physics.mass = 1] - mass
     * @param {number} [properties.physics.maxLOD = infinity] - LEGACY global max LOD for constructing colliders. Higher is more accurate and more costly. Only the currently loaded LODs are used.
     * @param {Array|Vector3} [properties.physics.velocity = [0,0,0]] - velocity vector
     * @param {Array|Vector3} [properties.physics.angularVelocity = [0,0,0]] - angular velocity
     *
     * @param {Object} [properties.physics.colliders] - ADVANCED rules to mix different collider types by geometricError or by level (LOD).
     * @param {number} [properties.physics.colliders.maxLOD] - Global LOD cap for colliders. If omitted, falls back to properties.physics.maxLOD, else Infinity.
     * @param {string[]} [properties.physics.colliders.priority=["mesh","hull","bounds"]] - Priority when multiple rules match the same tile. First entry wins.
     * @param {Object[]} [properties.physics.colliders.byGeometricError] - Preferred criterion when provided. Inclusive ranges on geometricError.
     * @param {("mesh"|"hull"|"bounds")} properties.physics.colliders.byGeometricError[].shape - Collider type to use in this range.
     * @param {number} properties.physics.colliders.byGeometricError[].min - Inclusive minimum geometricError for the rule (defaults to -Infinity if omitted).
     * @param {number} properties.physics.colliders.byGeometricError[].max - Exclusive maximum geometricError for the rule (defaults to +Infinity if omitted).
     * @param {Object[]} [properties.physics.colliders.byLevel] - Fallback criterion when byGeometricError is absent/empty. Inclusive ranges on integer level (LOD).
     * @param {("mesh"|"hull"|"bounds")} properties.physics.colliders.byLevel[].shape - Collider type to use in this LOD interval.
     * @param {number} properties.physics.colliders.byLevel[].min - Inclusive minimum LOD (integer).
     * @param {number} properties.physics.colliders.byLevel[].max - Inclusive maximum LOD (integer).
     * @param {("mesh"|"hull"|"bounds")} [properties.physics.colliders.defaultShape] - Optional fallback shape when no rule matches. If omitted, legacy properties.physics.shape is used. If neither present, no collider is created.
     *
     * Selection rules:
     *  - If colliders.byGeometricError has entries, it is used exclusively. Otherwise, byLevel is used when present.
     *  - If multiple rules match, the first in colliders.priority is chosen (default priority is ["mesh","hull","bounds"]).
     *  - If no rule matches, defaultShape is used; if absent, falls back to legacy properties.physics.shape; otherwise no collider is created.
     *  - The colliders.maxLOD (or legacy maxLOD) acts as a global cap. Tiles with level > maxLOD never get colliders.
     *  - When a tile becomes invisible, existing colliders at level === maxLOD are retained if the tile has children (as a fallback for deeper LODs), identical to legacy behavior.
     * e.g. (physics.colliders):
     * {
     *   "maxLOD": 4,
     *   "priority": ["mesh", "hull", "bounds"],
     *   "byLevel": [
     *     { "shape": "mesh",   "min": 4, "max": 4 },
     *     { "shape": "hull",   "min": 3,  "max": 3 },
     *     { "shape": "bounds", "min": 0,  "max": 2  }
     *   ],
     *   "defaultShape": "bounds"
     * }
     */
    constructor(properties) {
        super();
        const self = this;
        self.physics = properties.physics || {};
        const p = self.physics;
        if (p && typeof p === 'object') {
            if (!p.type) p.type = 'fixed';
            if (p.shape == null) p.shape = 'none';
            if (p.mass == null) p.mass = 1;
            if (!Array.isArray(p.velocity) && !(p.velocity && p.velocity.isVector3)) p.velocity = [0, 0, 0];
            if (!Array.isArray(p.angularVelocity) && !(p.angularVelocity && p.angularVelocity.isVector3)) p.angularVelocity = [0, 0, 0];
            if (p.maxLOD == null) p.maxLOD = Infinity;

            // Normalize advanced colliders API if provided
            if (p.colliders && typeof p.colliders === 'object') {
                const c = p.colliders;
                if (c.maxLOD == null) c.maxLOD = (Number.isFinite(p.maxLOD) ? p.maxLOD : Infinity);
                if (!Array.isArray(c.priority)) c.priority = ["mesh", "hull", "bounds"];
                else {
                    c.priority = c.priority.filter(x => x === "mesh" || x === "hull" || x === "bounds");
                    if (c.priority.length === 0) c.priority = ["mesh", "hull", "bounds"];
                }
                if (!Array.isArray(c.byGeometricError)) c.byGeometricError = [];
                if (!Array.isArray(c.byLevel)) c.byLevel = [];
            }
        }


        self.splatsMesh = properties.splatsMesh;
        self.oldUltraMeshSplats = properties.oldUltraMeshSplats;
        self.iosCompatibility = properties.iosCompatibility
        self.splatsQuality = properties.splatsQuality != undefined ? properties.splatsQuality : 0.75;
        self.splatsCPUCulling = properties.splatsCPUCulling != undefined ? properties.splatsCPUCulling : false;
        this.contentURL = [];
        if (!!properties.domWidth && !!properties.domHeight) {
            this.rendererSize = new THREE.Vector2(properties.domWidth, properties.domHeight);
        } else {
            this.rendererSize = new THREE.Vector2(1000, 1000);
        }
        this.setClipShape(properties.clipShape);
        this.loadingStrategy = properties.loadingStrategy ? properties.loadingStrategy.toUpperCase() : "INCREMENTAL";
        this.distanceBias = Math.max(0.0001, properties.distanceBias ? properties.distanceBias : 1);
        this.proxy = properties.proxy;
        this.drawBoundingVolume = properties.drawBoundingVolume ? properties.drawBoundingVolume : false;
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
            self.tileLoader = new TileLoader(tileLoaderOptions);
            const update = this.update
            this.update = (camera) => {
                update.call(self, camera);
                self.tileLoader.update();
            }
        }
        this.displayCopyright = !!properties.displayCopyright;
        // set properties general to the entire tileset
        this.geometricErrorMultiplier = !!properties.geometricErrorMultiplier ? properties.geometricErrorMultiplier : 1.0;
        this.splatsCropRadius = Number.MAX_VALUE;
        this.splatsSizeMultiplier = 1;

        // Visual tuning defaults for splats (may be overridden by constructor properties)
        /** @type {number} */ this.splatsExposureEV = (properties && typeof properties.splatsExposureEV !== "undefined") ? properties.splatsExposureEV : 0.0;
        /** @type {number} */ this.splatsSaturation = (properties && typeof properties.splatsSaturation !== "undefined") ? properties.splatsSaturation : 1.0;
        /** @type {number} */ this.splatsContrast = (properties && typeof properties.splatsContrast !== "undefined") ? properties.splatsContrast : 1.0;
        // allow passing an array [temp,tint] or an object; normalize to [temp, tint]
        const _tt = (properties && typeof properties.splatsTempTint !== "undefined") ? properties.splatsTempTint : [0.0, 0.0];
        this.splatsTempTint = Array.isArray(_tt) ? [Number(_tt[0] || 0.0), Number(_tt[1] || 0.0)] : [Number(_tt.temp || 0.0), Number(_tt.tint || 0.0)];

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
            this.colorID = THREE.MathUtils.clamp(self.color.r * 255, 0, 255) << 16 ^ THREE.MathUtils.clamp(self.color.g * 255, 0, 255) << 8 ^ THREE.MathUtils.clamp(self.color.b * 255, 0, 255) << 0;
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
        this.level = properties.level ? properties.level : 0;
        this.hasMeshContent = 0; // true when the provided json has a content field pointing to a B3DM file
        this.hasUnloadedJSONContent = 0; // true when the provided json has a content field pointing to a JSON file that is not yet loaded
        this.centerModel = properties.centerModel;
        this.abortController = new AbortController();

        this.onLoadCallback = properties.onLoadCallback;
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
                result.json().then(json => { return resolveImplicite(json, url) }).then(json => {
                    self._setup({ rootPath: path.dirname(properties.url), json: json });
                });
            }).catch(e => { if (self.displayErrors) _showError(e) });
        }
    }


    /**
     * specify a clip shape object in world space and tiles outside of the shape will not be loaded.
     * @param {THREE.Box3|THREE.Sphere|OBB} [clipShape = undefined] The shape is either a THREE.Box3, THREE.Sphere or OBB (import {OBB} from "threedtiles")
     */
    setClipShape(clipShape) {
        if (clipShape instanceof OBB || clipShape instanceof THREE.Sphere) {
            this.clipShape = clipShape;
        }
        else if (clipShape instanceof THREE.Box3) {
            const center = new THREE.Vector3();
            const halfSize = new THREE.Vector3();

            clipShape.getCenter(center);
            clipShape.getSize(halfSize).multiplyScalar(0.5);

            // rotation is identity by default, so we omit the third argument
            this.clipShape = new OBB([
                center.x, center.y, center.z,
                halfSize.x, 0, 0,
                0, halfSize.y, 0,
                0, 0, halfSize.z
            ]);
        }
        else {
            clipShape = undefined;
        }
        if (this.childrenTiles) {
            this.childrenTiles.forEach(ct => {
                ct._setClipShape(this.clipShape);
            })
        }

    }

    _setClipShape(clipShape) {
        this.clipShape = clipShape;
        if (this.childrenTiles) {
            this.childrenTiles.forEach(ct => {
                ct._setClipShape(this.clipShape);
            })
        }
    }
    /**
     * Specify a size multiplier for splats
     * @param {number} sizeMultiplier 
     */
    setSplatsSizeMultiplier(sizeMultiplier) {
        this.splatsSizeMultiplier = sizeMultiplier;
        if (this.splatsMesh) {
            this.splatsMesh.setSplatsSizeMultiplier(this.splatsSizeMultiplier)
        }
    }
    /**
     * specify a crop radius for splats
     * @param {number} cropRadius 
     */
    setSplatsCropRadius(cropRadius) {
        this.splatsCropRadius = cropRadius;
        if (this.splatsMesh) {
            this.splatsMesh.setSplatsCropRadius(this.splatsCropRadius)
        }
    }

    /**
     * set a depth bias to render splats in front of other objects even when they are marginally behind. (avoids overlap issues when overlaying on mesh)
     * @param {number} depthBias 
     */
    setSplatsDepthBias(depthBias) {
        this.splatsDepthBias = depthBias;
        if (this.splatsMesh) {
            this.splatsMesh.setDepthBias(this.splatsDepthBias)
        }
    }

    /**
     * Set the splats to use CPU culling. Faster sort and better frame rate at the cost of splats being absent when camera moves quickly.
     * @param {boolean} splatsCPUCulling 
     */
    setSplatsCPUCulling(splatsCPUCulling) {
        this.splatsCPUCulling = splatsCPUCulling;
        if (this.splatsMesh) this.splatsMesh.setSplatsCPUCulling(splatsCPUCulling)
    }

    setSplatsQuality(splatsQuality) {
        this.splatsQuality = splatsQuality;
        if (this.splatsMesh) this.splatsMesh.setQuality(splatsQuality)
    }

    /**
     * Set exposure compensation (EV stops) for splats in this tile.
     * @param {number} splatsExposureEV exposure in EV (stops). Useful range: -6 → +6. Positive brightens, negative darkens.
     */
    setSplatsExposureEV(splatsExposureEV) {
        this.splatsExposureEV = splatsExposureEV;
        if (this.splatsMesh && typeof this.splatsMesh.setExposureEV === "function") {
            this.splatsMesh.setExposureEV(splatsExposureEV);
        }
    }

    /**
     * Set saturation multiplier for splats in this tile.
     * @param {number} splatsSaturation saturation multiplier. Useful range: 0.0 → 2.0 (1.0 = unchanged).
     */
    setSplatsSaturation(splatsSaturation) {
        this.splatsSaturation = splatsSaturation;
        if (this.splatsMesh && typeof this.splatsMesh.setSaturation === "function") {
            this.splatsMesh.setSaturation(splatsSaturation);
        }
    }

    /**
     * Set contrast multiplier for splats in this tile.
     * @param {number} splatsContrast contrast multiplier. Useful range: 0.0 → 2.0 (1.0 = unchanged).
     */
    setSplatsContrast(splatsContrast) {
        this.splatsContrast = splatsContrast;
        if (this.splatsMesh && typeof this.splatsMesh.setContrast === "function") {
            this.splatsMesh.setContrast(splatsContrast);
        }
    }

    /**
     * Set temperature and tint for splats in this tile.
     * @param {number} splatsTemperature temperature adjustment in range [-100,100] (warm/cool).
     * @param {number} splatsTint tint adjustment in range [-100,100] (green/magenta).
     */
    setSplatsTempTint(splatsTemperature, splatsTint) {
        this.splatsTempTint = [splatsTemperature, splatsTint];
        if (this.splatsMesh && typeof this.splatsMesh.setTempTint === "function") {
            this.splatsMesh.setTempTint(splatsTemperature, splatsTint);
        }
    }

    /**
     * Manually updates all the matrices of the tileset. 
     * To be called after transforming a {@link OGC3DTile tileset} instantiated with the "static" option
     */
    updateMatrices() {
        this.updateMatrix();
        if (this.splatsMesh) this.splatsMesh.updateMatrix();
        if (this.static) {
            this.traverse(o => {
                if (o.isObject3D) {
                    o.matrixWorldAutoUpdate = true;
                }
            });
            if (this.splatsMesh) this.splatsMesh.matrixWorldAutoUpdate = true;
        }
        this.updateMatrixWorld(true);

        if (this.static) {
            this.traverse(o => {
                if (o.isObject3D) o.matrixWorldAutoUpdate = false;
            });
            if (this.splatsMesh) this.splatsMesh.matrixWorldAutoUpdate = false;
        }
    }
    /**
     * Call this to specify the canvas width/height when it changes (used to compute tiles geometric error that controls tile refinement).
     * It's unnecessary to call this when the {@link OGC3DTile} is instantiated with the renderer.
     * 
     * @param {Number} width 
     * @param {Number} height 
     */
    setCanvasSize(width, height) {
        this.rendererSize.set(width, height);
    }

    async _setup(properties) {
        const self = this;


        if (properties.json.extensionsRequired) {
            if (properties.json.extensionsRequired.includes("JDULTRA_gaussian_splats") || properties.json.extensionsRequired.includes("JDULTRA_gaussian_splats_V2")) {
                self.oldUltraMeshSplats = true;
            }
        }
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

        /* self.matrixWorldNeedsUpdate = true;
        //self.updateMatrix();
        if (self.parentTile) {
            self.parentTile.updateMatrixWorld(true);
            //self.parentTile.updateWorldMatrix(true, true);
        } */

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
            if (self.hasMeshContent == 0) {
                self.level = Math.max(0, self.parentTile ? self.parentTile.level + 0.01 : 0.0);
            }
            self._load();

        } else if (!!self.json.contents) { //if there is a content, json or otherwise, schedule it to be loaded 
            self.json.contents.forEach(e => _checkContent(e))
            if (self.hasMeshContent == 0) {
                self.level = Math.max(0, self.parentTile ? self.parentTile.level + 0.01 : 0.0);
            }

            //scheduleLoadTile(this);
        }


        if (!!self.centerModel) {
            tempVec2.copy(self.boundingVolume.center);

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
            tempVec2.applyMatrix4(self.matrix);
            self.position.sub(tempVec2);

            self.updateMatrices();
            //self.updateMatrixWorld(true);
        }
        if (self.onLoadCallback) {
            self.onLoadCallback(self);
        }
        if (!self.parentTile && self.physics && self.physics.sim) {
            self.physics.rigidBodyID = self.physics.sim.addObject({
                object: self,
                type: self.physics.type,
                mass: self.physics.mass,
                position: self.position,
                rotation: self.quaternion,
                velocity: self.physics.velocity,
                angularVelocity: self.physics.angularVelocity
            });



        }
        self.isSetup = true;


        if (self.level > 0 && self.drawBoundingVolume) {
            if (self.bbox) {
                console.log("double setup")
            }
            if (this.boundingVolume.aabb) {
                let box = this.boundingVolume.aabb.clone();
                box.applyMatrix4(this.matrixWorld);
                self.bbox = new THREE.Box3Helper(box, new THREE.Color(Math.random(), Math.random(), Math.random()));
                //self.bbox.renderOrder = -1;
                self.add(self.bbox);
                self.bbox.material.visible = false;
            } else if (self.boundingVolume instanceof OBB) {
                self.bbox = self.boundingVolume.helper();
                self.add(self.bbox);
                self.bbox.material.visible = false;
            }
        }

    }
    _assembleURL(root, relative) {
        // Append a slash to the root URL if it doesn't already have one
        if (!root.endsWith('/')) {
            root += '/';
        }

        try {
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
        } catch (e) {
            // If URL construction fails (likely a local path), fall back to simple concatenation.
            // Ensure we don't accidentally produce double slashes.
            if (!root.endsWith('/') && !relative.startsWith('/')) {
                return root + '/' + relative;
            } else {
                return root + relative;
            }
        }
    }

    _extractQueryParams(url, params) {
        try {
            const urlObj = new URL(url);

            // Iterate over all the search parameters
            for (let [key, value] of urlObj.searchParams) {
                params[key] = value;
            }

            // Remove the query string
            urlObj.search = '';
            return urlObj.toString();
        } catch (e) {
            // If URL construction fails (e.g. local file paths), return the original input URL unchanged.
            return url;
        }
    }
    async _load(loadJson = true, loadMesh = true) {

        var self = this;
        if (self.deleted && loadMesh) return;
        if (!!self.json.content) {
            await loadContent(self.json.content, null, loadJson, loadMesh);
        } else if (!!self.json.contents) {
            let promises = self.json.contents.map((content, index) => loadContent(content, index, loadJson, loadMesh));

            Promise.all(promises)
            //self.json.contents.forEach(content=> loadContent(content, i))
        }

        async function loadContent(content, contentIndex, loadJson, loadMesh) {
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
                url = self.rootPath + path.sep + url;
            }
            if (!url.startsWith("/local-tiles")) {
                url = self._extractQueryParams(url, self.queryParams);
            }
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
                self.contentURL.push(url);
                if (loadMesh && (url.includes(".b3dm") || url.includes(".glb") || url.includes(".gltf"))) {

                    try {

                        self.tileLoader.get(self.abortController, self.uuid, url, mesh => {

                            if (!!self.deleted) {
                                return;
                            }


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

                            if (mesh.isSplatsData) {
                                if (!self.splatsMesh) {

                                    //self.splatsMesh = self.tileLoader.renderer.isWebGPURenderer? new SplatsMeshWebGPU(self.tileLoader.renderer): new SplatsMesh(self.tileLoader.renderer, undefined, undefined, self.oldUltraMeshSplats?0.25:1);
                                    self.splatsMesh = new SplatsMesh(self.tileLoader.renderer, undefined, undefined, self.oldUltraMeshSplats ? 0.25 : 1);
                                    self.splatsMesh.setQuality(self.splatsQuality);
                                    self.splatsMesh.setSplatsCPUCulling(self.splatsCPUCulling)
                                    self.splatsMesh.setSplatsCropRadius(self.splatsCropRadius)
                                    self.splatsMesh.setSplatsSizeMultiplier(self.splatsSizeMultiplier)

                                    // Apply any visual tuning parameters that might have been set on the OGC3DTile
                                    if (typeof self.splatsExposureEV !== "undefined" && typeof self.splatsMesh.setExposureEV === "function") {
                                        self.splatsMesh.setExposureEV(self.splatsExposureEV);
                                    }
                                    if (typeof self.splatsSaturation !== "undefined" && typeof self.splatsMesh.setSaturation === "function") {
                                        self.splatsMesh.setSaturation(self.splatsSaturation);
                                    }
                                    if (typeof self.splatsContrast !== "undefined" && typeof self.splatsMesh.setContrast === "function") {
                                        self.splatsMesh.setContrast(self.splatsContrast);
                                    }
                                    if (typeof self.splatsTempTint !== "undefined" && typeof self.splatsMesh.setTempTint === "function") {
                                        const tt = self.splatsTempTint || [0.0, 0.0];
                                        self.splatsMesh.setTempTint(tt[0], tt[1]);
                                    }

                                    if (self.static) {
                                        self.splatsMesh.matrixAutoUpdate = false;
                                        self.splatsMesh.matrixWorldAutoUpdate = false;
                                    }
                                    self.add(self.splatsMesh);
                                    self.updateMatrices();
                                }
                                mesh = self.splatsMesh.addSplatsTile(mesh.positions, mesh.colors, mesh.cov0, mesh.cov1)


                            }

                            if (!mesh.isSplatsBatch) {


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
                                self.add(mesh);
                                self.updateMatrices();

                            }

                            self.meshContent.push(mesh);
                            return mesh;

                        }, !self.cameraOnLoad ? () => 0 : () => {
                            /* if (self.parentTile && (self.parentTile.metric != undefined && self.parentTile.metric < 0) || self.parentTile.deleted) {
                                return Number.MAX_VALUE;
                            }  */

                            if (self.loadingStrategy == "IMMEDIATE") {
                                return self._calculateDistanceToCamera(self.cameraOnLoad);
                            }
                            if (self.loadingStrategy == "INCREMENTAL") {

                                if (self.parentTile) {
                                    return self.parentTile._calculateDistanceToCamera(self.cameraOnLoad) / Math.max(1, self.parentTile.level);
                                } else {
                                    return self._calculateDistanceToCamera(self.cameraOnLoad) / Math.max(1, self.level);
                                }
                                /* if (self.parentTile) {
                                    if(self.parentTile.materialVisibility) return 0;
                                    return 1/self.parentTile._calculateDistanceToCamera(self.cameraOnLoad);
                                } else {
                                    return 0;
                                } */
                            }
                            if (self.loadingStrategy == "PERLEVEL") {
                                if (self.parentTile) {
                                    return self.level + self.parentTile._calculateDistanceToCamera(self.cameraOnLoad);
                                } else {
                                    return self.level + self._calculateDistanceToCamera(self.cameraOnLoad);
                                }
                            }
                            return 0;

                            /* let multiplier = 1;
                            if ((self.metric!=undefined && self.metric < 0) || self.deleted) multiplier = 2;
                            if (self.parentTile) {
                                return self.parentTile._calculateDistanceToCamera(self.cameraOnLoad) * multiplier * self.level;
                            } else {
                                return self._calculateDistanceToCamera(self.cameraOnLoad) * multiplier * self.level;
                            } */
                        }, () => self._getSiblings(),
                            self.level,
                            self.loadingStrategy,
                            !!self.json.boundingVolume.region ? false : true,
                            !!self.json.boundingVolume.region,
                            self.geometricError,
                            self.oldUltraMeshSplats
                        );
                    } catch (e) {
                        if (self.displayErrors) _showError(e)
                    }


                } else if (loadJson && url.includes(".json")) {
                    self.jsonRequested = url;
                    self.tileLoader.get(self.abortController, self.uuid, url, async json => {
                        self.jsonReceived = true;
                        //if (!!self.deleted) return;

                        json.rootPath = path.dirname(url);
                        self.json.children.push(json);
                        if (contentIndex == null) {
                            delete self.json.content;
                        } else {
                            delete self.json.contents.splice(contentIndex, 1);
                        }

                        self.hasUnloadedJSONContent--;
                        /* self.matrixWorldNeedsUpdate = true;
                        self.updateMatrix();
                        if (self.parentTile) {
                            self.parentTile.updateMatrixWorld(true);
                            //self.parentTile.updateWorldMatrix(true, true);
                        } */
                        //return json;
                    });

                }


                /* self.matrixWorldNeedsUpdate = true;
                self.updateMatrix();
                if (self.parentTile) {
                    self.parentTile.updateMatrixWorld(true);
                    //self.parentTile.updateWorldMatrix(true, true);
                } */
            }
        }
    }

    /**
     * Disposes of all the resources used by the tileset.
     */
    dispose() {
        const self = this;

        if (self.physics && self.physics.sim) {
            if (self.colliderUUID) {
                self.physics.sim.detachCollider({ colliderId: self.colliderUUID });
                self.colliderUUID = undefined;
            }
            if (Array.isArray(self.colliderUUIDs) && self.colliderUUIDs.length) {
                for (const colId of self.colliderUUIDs) {
                    self.physics.sim.detachCollider({ colliderId: colId });
                }
                self.colliderUUIDs = [];
            }
        }

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

        if (self.splatsMesh) {

            self.meshContent.forEach(splat => splat.hide());
            if (!self.parentTile) {
                self.splatsMesh.dispose();
                self.splatsMesh = undefined;
            }
        }
        if (!!self.contentURL) {
            self.contentURL.forEach(url => {
                self.tileLoader.invalidate(url, self.uuid);
            })
            self.contentURL = [];
        }

        if (!!self.abortController && !self.jsonRequested) { // abort tile request
            self.abortController.abort("tile not needed");
        }
        this.parent = null;
        self.meshContent = [];
        if (self.bbox) self.bbox.dispose();
        //this.parentTile = null;
        this.dispatchEvent({ type: 'removed' });
    }
    _disposeMeshContent() {
        const self = this;
        if (!!self.deleted) return;
        self.deleted = true;
        if (!!self.abortController) { // abort tile request
            self.abortController.abort("tile not needed");
            self.abortController = new AbortController();
        }
        for (let i = self.meshContent.length - 1; i >= 0; i--) {
            const mc = self.meshContent[i];
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

            self.remove(mc);
        }
        if (self.splatsMesh) {
            self.meshContent.forEach(splat => splat.hide());
        }
        self.meshContent = [];
        self.contentURL.forEach(url => {
            //console.log(url)
            self.tileLoader.invalidate(url, self.uuid);
        })
        self.contentURL = [];

    }
    _disposeChildren() {
        var self = this;

        self.childrenTiles.forEach(tile => {
            tile.dispose();
            self.remove(tile)
        });
        self.childrenTiles = [];
        /* self.children = [];
        if (self.meshContent.length > 0) {
            self.meshContent.forEach(mc => {
                self.children.push(mc);
            });
        } */
    }

    raycast(raycaster, intersects) {
        //console.log("raycast")
        if (!this.splatsMesh) {
            return super.raycast(raycaster, intersects);
        } else {
            tempRay.copy(raycaster.ray);
            inverseWorld.copy(this.matrixWorld).invert();
            tempRay.applyMatrix4(inverseWorld);
            let intersection = false;
            if (this.boundingVolume instanceof OBB) {
                intersection = this.boundingVolume.intersectsRay(tempRay);
            } else if (this.boundingVolume instanceof THREE.Sphere) {
                //sphere
                intersection = ray.intersectsSphere(this.boundingVolume);
            } else {
                return false;

            }
            if (intersection && this.materialVisibility && !!this.splatsReady) {
                tempIntersects.length = 0;
                this.meshContent.forEach(mc => {
                    if (mc.isSplatsBatch) {
                        mc.raycast(tempRay, tempIntersects, raycaster.params.Points.threshold);
                        tempIntersects.forEach(t => {
                            t.point.applyMatrix4(this.matrixWorld);
                        }),
                            intersects.push(...tempIntersects);
                    }
                })
            }

            return intersection;
        }
    }

    /**
     * To be called in the render loop.
     * @param {THREE.Camera} camera a camera that the tileset will be rendered with.
     * @returns {{numTilesLoaded: number, numTilesRendered: number, maxLOD: number, percentageLoaded: number}} An object containing describing the current state of the loaded tileset.
     */
    update(camera) {
        if (this.splatsMesh) {
            this.splatsMesh.updateShaderParams(camera, this.renderer);
        }
        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));



        let numTiles = [0];
        let numTilesRendered = [0];
        let maxLOD = [0];
        let percentageLoaded = [0];
        if (this.refine == "REPLACE") {
            switch (this.loadingStrategy) {
                case "IMMEDIATE": this._updateImmediate(camera, frustum); this._statsImmediate(maxLOD, numTiles, percentageLoaded, numTilesRendered); break;
                default: this._update(camera, frustum); this._stats(maxLOD, numTiles, percentageLoaded, numTilesRendered);
            }
        } else {
            this._update(camera, frustum);
            this._stats(maxLOD, numTiles, percentageLoaded, numTilesRendered);
        }

        if (numTiles > 0) {
            percentageLoaded[0] /= numTiles[0];
        }

        //// sort ////
        if (this.splatsMesh) {
            transformedCameraPosition.copy(camera.position);
            inverseWorld.copy(this.matrixWorld).invert();
            transformedCameraPosition.applyMatrix4(inverseWorld);

            if (this.splatsCPUCulling) {
                const viewProjModel = new THREE.Matrix4()
                    .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse) //  P·V
                    .multiply(this.matrixWorld);
                this.splatsMesh.sort(transformedCameraPosition, viewProjModel);
            } else {
                this.splatsMesh.sort(transformedCameraPosition);
            }


        }

        if (this.splatsMesh) {
            this.splatsMesh.update();
        }

        return { numTilesLoaded: numTiles[0], numTilesRendered: numTilesRendered[0], maxLOD: maxLOD[0], percentageLoaded: percentageLoaded[0] }
    }

    _updateImmediate(camera, frustum) {
        this._computeMetricRecursive(camera, frustum);
        this._updateNodeVisibilityImmediate();
        this._expandTreeImmediate(camera);
        this.shouldBeVisible = this.metric > 0 ? true : !!this.loadOutsideView;
        this._shouldBeVisibleUpdateImmediate();
        this._trimTreeImmediate();
        this._loadMeshImmediate();


    }


    _statsImmediate(maxLOD, numTiles, percentageLoaded, numTilesRendered) {
        maxLOD[0] = Math.max(maxLOD[0], this.level);
        if (this.shouldBeVisible || !!this.materialVisibility) {
            numTiles[0]++;
            if (!!this.materialVisibility) percentageLoaded[0]++;
        }
        if (!!this.materialVisibility) numTilesRendered[0]++;


        this.childrenTiles.forEach(child => {
            child._statsImmediate(maxLOD, numTiles, percentageLoaded, numTilesRendered);
        })
    }
    _stats(maxLOD, numTiles, percentageLoaded, numTilesRendered) {
        maxLOD[0] = Math.max(maxLOD[0], this.level);
        if (this.hasMeshContent) {
            numTiles[0]++;
            if (this.meshContent.length == this.hasMeshContent) percentageLoaded[0]++;
            if (!!this.materialVisibility) numTilesRendered[0]++;
        }


        this.childrenTiles.forEach(child => {
            child._stats(maxLOD, numTiles, percentageLoaded, numTilesRendered);
        })
    }



    _trimTreeImmediate() {
        const self = this;
        if (self.metric == undefined) return;

        if (self.hasMeshContent && ((self.shouldBeVisible && self.materialVisibility))) {
            if (self.splatsMesh && !self.splatsReady) {
                return;
            }
            self._disposeChildren();
        } else {
            self.childrenTiles.forEach(child => {
                child._trimTreeImmediate();
            })
        }

    }
    _updateNodeVisibilityImmediate(parentDisplaysMesh = false) {
        //updateNodeVisibilityCount++;

        const self = this;
        if (!self.hasMeshContent) {
            self.childrenTiles.forEach(child => {
                child._updateNodeVisibilityImmediate(parentDisplaysMesh);
            })
            return;
        }

        if (self.shouldBeVisible) {
            if (self.meshContent.length == self.hasMeshContent) {
                if (!self.materialVisibility) {
                    //console.log(!!self.splatsReady)
                    self._changeContentVisibility(true);
                    self.childrenTiles.forEach(child => {
                        child._updateNodeVisibilityImmediate(parentDisplaysMesh);
                    })
                } else {
                    self.childrenTiles.forEach(child => {
                        child._updateNodeVisibilityImmediate(true);
                    })
                }

            } else {
                self.childrenTiles.forEach(child => {
                    child._updateNodeVisibilityImmediate(parentDisplaysMesh);
                })
            }
        } else {
            if (!self.loadOutsideView && self.metric < 0) {
                self._changeContentVisibility(false);
                if (self.meshContent.length > 0) self._disposeMeshContent();
                self.childrenTiles.forEach(child => {
                    child._updateNodeVisibilityImmediate(true);
                })
                return;
            }

            if (self.materialVisibility && (!self.splatsMesh || !!self.splatsReady)) {

                if (parentDisplaysMesh) {
                    self._changeContentVisibility(false);
                    if (self.meshContent.length > 0) self._disposeMeshContent();
                    self.childrenTiles.forEach(child => {
                        child._updateNodeVisibilityImmediate(parentDisplaysMesh);
                    })
                } else {
                    let allChildrenReady = true;
                    self.childrenTiles.every(child => {

                        if (!child._isReadyImmediate()) {
                            allChildrenReady = false;
                            return false;
                        }
                        return true;
                    });
                    if (allChildrenReady && self.childrenTiles.length > 0) {
                        self._changeContentVisibility(false);
                        if (self.meshContent.length > 0) self._disposeMeshContent();
                        self.childrenTiles.forEach(child => {
                            child._updateNodeVisibilityImmediate(parentDisplaysMesh);
                        })
                    } else {

                        self.childrenTiles.forEach(child => {
                            child._updateNodeVisibilityImmediate((!self.splatsMesh || !!self.splatsReady));
                        })
                    }
                }

            } else {

                self.childrenTiles.forEach(child => {
                    child._updateNodeVisibilityImmediate(parentDisplaysMesh);
                })
            }
        }



    }
    _shouldBeVisibleUpdateImmediate() {
        const self = this;
        if (!self.hasMeshContent) {

            self.childrenTiles.forEach(child => {
                child.shouldBeVisible = true;
                child._shouldBeVisibleUpdateImmediate();
            })
            self.shouldBeVisible = false;

        }
        else if (self.metric == undefined) {
            self.shouldBeVisible = false;
        }
        else if (self.metric < 0) {
            self.shouldBeVisible = !!self.loadOutsideView;
            self.childrenTiles.forEach(child => {
                child._setShouldNotBeVisibleRecursive();
            });
        }
        else if (self.metric < self.geometricErrorMultiplier * self.geometricError) {
            if (self.hasUnloadedJSONContent) {
                //self.shouldBeVisible = true;

            } else {
                if (!!self.json && !!self.json.children && self.json.children.length > 0) {
                    self.shouldBeVisible = false;
                    self.childrenTiles.forEach(child => {
                        child.shouldBeVisible = true;
                        child._shouldBeVisibleUpdateImmediate();
                    })

                } else {
                    self.shouldBeVisible = true;

                }
            }

        } else {

            self.childrenTiles.forEach(child => {
                child._setShouldNotBeVisibleRecursive();
            });
        }
    }

    _setShouldNotBeVisibleRecursive() {
        const self = this;
        self.shouldBeVisible = false;
        self.childrenTiles.forEach(child => {
            child._setShouldNotBeVisibleRecursive();
        })
    }
    _loadMeshImmediate() {
        const self = this;
        if (!self.hasMeshContent) {
            self.childrenTiles.forEach(child => {
                child._loadMeshImmediate();
            });
            return;
        }
        if (self.shouldBeVisible) {
            if (self.meshContent.length < self.hasMeshContent &&
                self.contentURL.length == 0) {

                self.deleted = false;

                self._load(false, true);
            }
        } else {
            self.childrenTiles.forEach(child => {
                child._loadMeshImmediate();
            })
        }

    }

    _computeMetricRecursive(camera, frustum) {
        const self = this;
        self.metric = -1;
        if (!self.isSetup) return;

        if (!!self.boundingVolume && !!self.geometricError) {
            self.metric = self._calculateUpdateMetric(camera, frustum);
        }
        self.childrenTiles.forEach(child => child._computeMetricRecursive(camera, frustum));


    }


    _expandTreeImmediate(camera) {
        const self = this;

        if (!self.hasUnloadedJSONContent) {
            if (!self.hasMeshContent) {
                if (!!self.json && !!self.json.children && self.childrenTiles.length < self.json.children.length) {
                    self._loadJsonChildren(camera);

                }
            } else {
                if (self.occlusionCullingService && self.hasMeshContent && !self.occlusionCullingService.hasID(self.colorID)) {
                    // don't load children
                } else {
                    if (self.metric >= 0 && self.metric < self.geometricErrorMultiplier * self.geometricError &&
                        !!self.json && !!self.json.children && self.childrenTiles.length < self.json.children.length
                    ) {
                        self._loadJsonChildren(camera);
                    }
                }
            }

        }

        self.childrenTiles.forEach(child => child._expandTreeImmediate(camera));
    }


    _update(camera, frustum) {
        const self = this;

        if (!self.isSetup) return;
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
        _updateTree(self.metric);
        _trimTree(self.metric, visibilityBeforeUpdate);



        function _updateTree(metric) {
            // If this tile does not have mesh content but it has children
            if (metric < 0 && self.hasMeshContent) return;
            if (self.occlusionCullingService && self.hasMeshContent && !self.occlusionCullingService.hasID(self.colorID)) {
                return;
            }
            if (!self.hasMeshContent || (metric <= self.geometricErrorMultiplier * self.geometricError && (self.meshContent.length > 0 || self.splatsMesh))) {
                if (!!self.json && !!self.json.children && self.childrenTiles.length != self.json.children.length) {
                    self._loadJsonChildren(camera);
                    return;
                }
            }
        }


        function _updateNodeVisibility(metric) {

            // outside frustum
            if (metric < 0) {
                self.inFrustum = false;
                self._changeContentVisibility(!!self.loadOutsideView);
                return;
            } else {
                self.inFrustum = true;
            }
            //doesn't have a mesh content
            if (!self.hasMeshContent) return;

            // mesh content not yet loaded
            if (self.meshContent.length < self.hasMeshContent) {
                return;
            }




            // has no children
            if (self.childrenTiles.length == 0) {
                self._changeContentVisibility(true);
                return;
            }

            // has children
            if (metric >= self.geometricErrorMultiplier * self.geometricError) { // Ideal LOD or before this lod

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
                    else {
                        self._changeContentVisibility(true);
                    }
                }


            }
        }



        function _trimTree(metric, visibilityBeforeUpdate) {
            if (!self.hasMeshContent) return;
            if (!self.inFrustum) { // outside frustum
                self._disposeChildren();
                //_updateNodeVisibility(metric);
                return;
            }
            if (self.occlusionCullingService &&
                !visibilityBeforeUpdate &&
                self.hasMeshContent &&
                self.meshContent.length > 0 &&
                self.materialVisibility &&
                self._areAllChildrenLoadedAndHidden()) {

                if (self.splatsMesh && self.materialVisibility && !self.splatsReady) {
                    return;
                }
                self._disposeChildren();
                //_updateNodeVisibility(metric);
                return;
            }
            if (metric >= self.geometricErrorMultiplier * self.geometricError) {
                if (self.splatsMesh && self.materialVisibility && !self.splatsReady) {
                    return;
                }
                self._disposeChildren();
                //_updateNodeVisibility(metric);
                return;
            }

        }



    }

    _loadJsonChildren(camera) {
        const self = this;
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
                level: Math.floor(self.level) + 1,
                tileLoader: self.tileLoader,
                cameraOnLoad: camera,
                occlusionCullingService: self.occlusionCullingService,
                renderer: self.renderer,
                static: self.static,
                centerModel: false,
                displayErrors: self.displayErrors,
                displayCopyright: self.displayCopyright,
                distanceBias: self.distanceBias,
                loadingStrategy: self.loadingStrategy,
                drawBoundingVolume: self.drawBoundingVolume,
                splatsMesh: self.splatsMesh,
                clipShape: self.clipShape,
                oldUltraMeshSplats: self.oldUltraMeshSplats,
                physics: self.physics,
            });
            self.childrenTiles.push(childTile);
            self.add(childTile);
        });

        self.updateMatrices(true);
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
                if (child.metric < 0) {
                    return true;
                }
                if (child.materialVisibility && (!self.splatsMesh || !!self.splatsReady)) {
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
        if (this.metric == undefined) {
            return false;
        }
        if (this.metric < 0) {
            return true;
        }
        // if json is not done loading
        if (this.hasUnloadedJSONContent) {
            return false;
        }
        // if empty tile
        if (!this.hasMeshContent && this.json.children.length == 0 && !this.hasUnloadedJSONContent) {
            return true;
        }
        // if this tile has no mesh content or if it's marked as visible false, look at children
        if ((!this.hasMeshContent || this.meshContent.length == 0 || (!this.materialVisibility))) {
            if (this.children.length > 0) {
                var allChildrenReady = true;
                this.childrenTiles.every(child => {
                    if (!child._isReady()) {
                        allChildrenReady = false;
                        //console.log(child.level)
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


        if (this.materialVisibility) {
            return true;
        }



        return false;

    }

    _isReadyImmediate() {

        if (!!this.materialVisibility || (!this.loadOutsideView && this.metric < 0)) {
            return true;
        } else {
            /* if (this.splatsMesh) {
                if (this.splatsReady) {
                    return true
                } else {
                    return false;
                }
            } else {
                return false;
            } */
            //return false;
            if (this.childrenTiles.length > 0) {
                var allChildrenReady = true;
                this.childrenTiles.every(child => {
                    if (!child._isReadyImmediate()) {
                        allChildrenReady = false;
                        return false;
                    }
                    return true;
                });
                return allChildrenReady;
            } else {
                return false;
                /* if (this.splatsMesh) {
                    if (this.splatsReady) {
                        return true
                    } else {
                        return false;
                    }
                } else {
                    return false;
                } */
            }
        }


    }


    _changeContentVisibility(visibility) {
        const self = this;
        if (self.materialVisibility == visibility) return;
        if (self.bbox) {

            self.bbox.material.visible = visibility;
        }
        if (self.splatsMesh) {
            if (visibility != self.materialVisibility) {
                let splatsCount = 0;
                self.meshContent.forEach(mc => {
                    if (visibility && mc.isSplatsBatch) {
                        //self.splatsReady = true;
                        splatsCount++;

                        mc.show(() => {
                            if (self.materialVisibility) {
                                self.splatsReady = true;
                            }

                        });

                    }
                    else {
                        mc.hide();
                        self.splatsReady = false;
                    }
                });

                self.materialVisibility = visibility;
            }
        } else {
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
        }

        self._updateCollider();
        



    }

    /**
     * Set the world-space pose of this tileset.
     *
     * IMPORTANT: When a physics simulation is attached (this.physics && this.physics.sim && this.physics.rigidBodyID),
     * you MUST use this method to transform the object. Do NOT modify transforms using THREE.Object3D core methods
     * (e.g. position.set, quaternion.set, applyQuaternion, setRotationFromEuler, etc.) because the physics engine
     * is authoritative for the object's transform. This method keeps the physics rigid body in sync and updates colliders.
     *
     * @param {THREE.Vector3} position - New world-space position. Must be an instance of THREE.Vector3.
     * @param {THREE.Euler|THREE.Quaternion} rotation - Rotation can be either a THREE.Euler or a THREE.Quaternion.
     * @param {THREE.Vector3} scale - New scale. Must be an instance of THREE.Vector3.
     * @throws {TypeError} If position or scale are not THREE.Vector3, or if rotation is not THREE.Euler/THREE.Quaternion.
     */
    setPose(position, rotation, scale) {
        // Validate required argument types
        if (!(position.isVector3)) {
            throw new TypeError("OGC3DTile.setPose: 'position' must be an instance of THREE.Vector3");
        }
        if (!(scale.isVector3)) {
            throw new TypeError("OGC3DTile.setPose: 'scale' must be an instance of THREE.Vector3");
        }
        if (!(rotation.isEuler) && !(rotation.isQuaternion)) {
            throw new TypeError("OGC3DTile.setPose: 'rotation' must be a THREE.Euler or THREE.Quaternion");
        }
        if (this.physics && this.physics.sim && this.physics.rigidBodyID) {
            

            // Sync pose with physics simulation (position and rotation)
            this.physics.sim.setPose({
                bodyId: this.physics.rigidBodyID,
                position: position,
                rotation: rotation
            });

            // If scale changed, update local scale and colliders
            if (scale && !scale.equals(this.scale)) {
                this.scale.copy(scale);
                this.updateMatrices();
                this.traverse(child => {
                    if (child._updateCollider) child._updateCollider();
                });
            }
        } else {
            // No physics -> directly update the THREE.Object3D transform.
            this.scale.copy(scale);

            if (rotation.isQuaternion) {
                this.setRotationFromQuaternion(rotation);
            } else { // instance of THREE.Euler (validated above)
                this.setRotationFromEuler(rotation);
            }

            this.position.copy(position);
            this.updateMatrices();
        }
    }
    _updateCollider() {
        const self = this;
        if (!self.physics || !self.physics.sim) return;
    
        const rbId = self.physics.rigidBodyID;
        const level = Math.floor(self.level || 0);
        const isVisible = !!self.materialVisibility;
        const hasChildrenTiles = Array.isArray(self.childrenTiles) && self.childrenTiles.length > 0;

        // Advanced colliders configuration (optional)
        const coll = (self.physics && self.physics.colliders && typeof self.physics.colliders === 'object') ? self.physics.colliders : null;

        // Global LOD cap: colliders.maxLOD > legacy physics.maxLOD > Infinity
        const maxLOD = Number.isFinite(coll?.maxLOD) ? coll.maxLOD
            : (Number.isFinite(self.physics.maxLOD) ? self.physics.maxLOD : Infinity);

        // Selection helpers
        const pickByPriority = (candidates, priority) => {
            const list = Array.isArray(priority) && priority.length ? priority : ["mesh", "hull", "bounds"];
            for (const s of list) if (candidates.includes(s)) return s;
            return null;
        };
        const chooseColliderShape = () => {
            // If advanced rules present, use them
            const priority = coll?.priority || ["mesh", "hull", "bounds"];
            if (coll && (Array.isArray(coll.byGeometricError) && coll.byGeometricError.length)) {
                const ge = self.geometricError;
                if (typeof ge === "number") {
                    const candidates = [];
                    for (const r of coll.byGeometricError) {
                        if (!r || !r.shape) continue;
                        const min = (typeof r.min === "number") ? r.min : -Infinity;
                        const max = (typeof r.max === "number") ? r.max : Infinity;
                        if (ge >= min && ge < max) candidates.push(r.shape);
                    }
                    const picked = pickByPriority(candidates, priority);
                    if (picked) return picked;
                }
                // No match on geometricError -> fallback default
                if (coll.defaultShape) return coll.defaultShape;
                if (self.physics.shape) return self.physics.shape;
                return "none";
            } else if (coll && (Array.isArray(coll.byLevel) && coll.byLevel.length)) {
                const lvl = Math.floor(self.level || 0);
                const candidates = [];
                for (const r of coll.byLevel) {
                    if (!r || !r.shape) continue;
                    const min = (typeof r.min === "number") ? r.min : -Infinity;
                    const max = (typeof r.max === "number") ? r.max : Infinity;
                    if (lvl >= min && lvl <= max) candidates.push(r.shape);
                }
                const picked = pickByPriority(candidates, priority);
                if (picked) return picked;
                if (coll.defaultShape) return coll.defaultShape;
                if (self.physics.shape) return self.physics.shape;
                return "none";
            } else {
                // Legacy behavior: use top-level shape
                return self.physics.shape || "none";
            }
        };
        const effectiveShape = chooseColliderShape();

        // helpers
        const detachBoundsCollider = () => {
            if (self.colliderUUID) {
                self.physics.sim.detachCollider({ colliderId: self.colliderUUID });
                self.colliderUUID = undefined;
            }
        };
        const detachMeshColliders = () => {
            if (Array.isArray(self.colliderUUIDs) && self.colliderUUIDs.length) {
                for (const colId of self.colliderUUIDs) {
                    self.physics.sim.detachCollider({ colliderId: colId });
                }
                self.colliderUUIDs = [];
            }
        };
        const detachAll = () => {
            detachBoundsCollider();
            detachMeshColliders();
            self._activeColliderShape = undefined;
        };

        // If no body or shape is "none", clear any existing colliders and abort
        if (!rbId || !effectiveShape || effectiveShape === "none") {
            detachAll();
            self._activeColliderShape = undefined;
            return;
        }

        // Tiles strictly above maxLOD must never have colliders
        if (level > maxLOD) {
            detachAll();
            self._activeColliderShape = undefined;
            return;
        }

        // Desired creation state for this frame
        const wantsColliderNow = isVisible && level <= maxLOD;

        // Handle shape switching (detach previous type when rules change),
        // except when we retain at maxLOD while invisible.
        const prevShape = self._activeColliderShape || "none";
        const atRetention = (!isVisible && level === maxLOD && hasChildrenTiles);
        if (prevShape !== effectiveShape && !atRetention) {
            if ((prevShape === "mesh" || prevShape === "hull") && effectiveShape === "bounds") {
                detachMeshColliders();
            } else if (prevShape === "bounds" && (effectiveShape === "mesh" || effectiveShape === "hull")) {
                detachBoundsCollider();
            } else if ((prevShape === "mesh" && effectiveShape === "hull") || (prevShape === "hull" && effectiveShape === "mesh")) {
                // switching between mesh and hull -> rebuild
                detachMeshColliders();
            } else {
                // any other change -> remove all
                detachAll();
            }
            self._activeColliderShape = (effectiveShape && effectiveShape !== "none") ? effectiveShape : undefined;
        }
    
        // Common root transforms (RB owner with RT only - ignore root scale)
        let rbOwner = self;
        while (rbOwner && rbOwner.parentTile) rbOwner = rbOwner.parentTile;
        const rootP = new THREE.Vector3(), rootQ = new THREE.Quaternion(), rootS = new THREE.Vector3();
        if (rbOwner && rbOwner.matrixWorld) rbOwner.matrixWorld.decompose(rootP, rootQ, rootS);
        const rootRT = new THREE.Matrix4().compose(rootP, rootQ, new THREE.Vector3(1, 1, 1));
        const invRootRT = new THREE.Matrix4().copy(rootRT).invert();
    
        // Shape-specific handling
        if (effectiveShape === "bounds") {
            
            // Make sure no stray mesh colliders remain if shape switched
            detachMeshColliders();
    
            if (wantsColliderNow) {
                // Create only if not already present
                if (!self.colliderUUID) {
                    if (self.boundingVolume instanceof OBB || self.boundingVolume?.isOBB) {
                        // Center (tile-local) -> world -> body-local
                        const centerWorld = self.localToWorld(self.boundingVolume.center.clone());
                        const centerInBody = centerWorld.clone().applyMatrix4(invRootRT);
    
                        // Origin (tile-local 0,0,0) in world/body
                        const originWorld = self.localToWorld(new THREE.Vector3(0, 0, 0));
                        const originBody = originWorld.clone().applyMatrix4(invRootRT);
    
                        // Half-axis vectors in tile-local
                        const a1Local = self.boundingVolume.e1.clone().multiplyScalar(self.boundingVolume.halfSize.x);
                        const a2Local = self.boundingVolume.e2.clone().multiplyScalar(self.boundingVolume.halfSize.y);
                        const a3Local = self.boundingVolume.e3.clone().multiplyScalar(self.boundingVolume.halfSize.z);
    
                        // Map to body space
                        const a1BodyEnd = self.localToWorld(a1Local.clone()).applyMatrix4(invRootRT);
                        const a2BodyEnd = self.localToWorld(a2Local.clone()).applyMatrix4(invRootRT);
                        const a3BodyEnd = self.localToWorld(a3Local.clone()).applyMatrix4(invRootRT);
    
                        const v1Body = a1BodyEnd.clone().sub(originBody);
                        const v2Body = a2BodyEnd.clone().sub(originBody);
                        const v3Body = a3BodyEnd.clone().sub(originBody);
    
                        const hx = v1Body.length();
                        const hy = v2Body.length();
                        const hz = v3Body.length();
    
                        const v1n = hx > 0 ? v1Body.clone().multiplyScalar(1 / hx) : new THREE.Vector3(1, 0, 0);
                        const v2n = hy > 0 ? v2Body.clone().multiplyScalar(1 / hy) : new THREE.Vector3(0, 1, 0);
                        const v3n = hz > 0 ? v3Body.clone().multiplyScalar(1 / hz) : new THREE.Vector3(0, 0, 1);
    
                        const basisMat = new THREE.Matrix4().makeBasis(v1n, v2n, v3n);
                        const localQuat = new THREE.Quaternion().setFromRotationMatrix(basisMat);
    
                        self.colliderUUID = self.physics.sim.attachShapeCollider({
                            bodyId: rbId,
                            shape: ColliderShape.createBox(hx, hy, hz),
                            localPosition: [centerInBody.x, centerInBody.y, centerInBody.z],
                            localRotation: localQuat
                        });
                        self._activeColliderShape = "bounds";
                    } else if (self.boundingVolume instanceof THREE.Sphere || self.boundingVolume?.isSphere) {
                        const centerWorld = self.localToWorld(self.boundingVolume.center.clone());
                        const centerInBody = centerWorld.clone().applyMatrix4(invRootRT);
    
                        const originWorld = self.localToWorld(new THREE.Vector3(0, 0, 0));
                        const originBody = originWorld.clone().applyMatrix4(invRootRT);
    
                        // Axis unit lengths in body space
                        const exBody = self.localToWorld(new THREE.Vector3(1, 0, 0)).applyMatrix4(invRootRT).sub(originBody).length();
                        const eyBody = self.localToWorld(new THREE.Vector3(0, 1, 0)).applyMatrix4(invRootRT).sub(originBody).length();
                        const ezBody = self.localToWorld(new THREE.Vector3(0, 0, 1)).applyMatrix4(invRootRT).sub(originBody).length();
    
                        const sMax = Math.max(exBody, eyBody, ezBody);
                        const radiusScaled = self.boundingVolume.radius * sMax;
    
                        self.colliderUUID = self.physics.sim.attachShapeCollider({
                            bodyId: rbId,
                            shape: ColliderShape.createBall(radiusScaled),
                            localPosition: [centerInBody.x, centerInBody.y, centerInBody.z],
                        });
                        self._activeColliderShape = "bounds";
                    }
                }
            } else {
                // Invisible: apply maxLOD retention rule
                if (level === maxLOD && hasChildrenTiles) {
                    // keep any existing collider as fallback for deeper LODs
                } else {
                    // detach if exists
                    detachBoundsCollider();
                    self._activeColliderShape = undefined;
                }
            }
            return;
        }
    
        if (effectiveShape === "mesh" || effectiveShape === "hull") {
            console.log(effectiveShape+"  "+this.level)
            // Make sure no stray bounds collider remains if shape switched
            detachBoundsCollider();
    
            if (wantsColliderNow) {
                // Only create when tile mesh is fully loaded
                if (!(self.hasMeshContent && self.meshContent.length === self.hasMeshContent)) return;
    
                // Avoid duplicate creation
                if (!Array.isArray(self.colliderUUIDs) || self.colliderUUIDs.length === 0) {
                    self.colliderUUIDs = [];
                    const attachMethod = (effectiveShape === "hull") ? "addConvexHullCollider" : "attachTrimeshCollider";

                    const addMeshCollider = (meshObj) => {
                        if (!meshObj || !meshObj.isMesh || !meshObj.geometry || !meshObj.geometry.isBufferGeometry) return;
    
                        // Transform from RB local (root RT) to mesh's world transform
                        const m = new THREE.Matrix4().multiplyMatrices(invRootRT, meshObj.matrixWorld);
                        const lp = new THREE.Vector3();
                        const lq = new THREE.Quaternion();
                        const lsTmp = new THREE.Vector3();
                        m.decompose(lp, lq, lsTmp);
    
                        // Use true world scale for baking (positive, includes root scale)
                        const worldS = new THREE.Vector3();
                        meshObj.getWorldScale(worldS);
                        worldS.set(Math.abs(worldS.x), Math.abs(worldS.y), Math.abs(worldS.z));
    
                        self.physics.sim[attachMethod]({
                            bodyId: rbId,
                            geometry: meshObj.geometry,
                            localPosition: [lp.x, lp.y, lp.z],
                            localRotation: lq,
                            localScale: [worldS.x, worldS.y, worldS.z]
                        }).then((colId) => {
                            // If this tile ceases to be eligible, drop the collider immediately
                            const currentShape = chooseColliderShape();
                            const stillEligible = !self.deleted && (currentShape === "mesh" || currentShape === "hull");
                            const stillWithinLOD = Math.floor(self.level || 0) <= maxLOD;
                            const stillKeepWhenInvisible = (Math.floor(self.level || 0) === maxLOD && (Array.isArray(self.childrenTiles) && self.childrenTiles.length > 0));
                            const shouldKeep = stillEligible && (self.materialVisibility ? stillWithinLOD : stillWithinLOD && stillKeepWhenInvisible);

                            if (!shouldKeep) {
                                if (colId) self.physics.sim.detachCollider({ colliderId: colId });
                                return;
                            }
                            if (colId) self.colliderUUIDs.push(colId);
                            self._activeColliderShape = effectiveShape;
                        }).catch(() => { /* worker may have been disposed */ });
                    };
    
                    // Iterate over all mesh contents and their children
                    for (const mc of self.meshContent) {
                        if (!mc || mc.isSplatsBatch) continue;
                        if (mc.isMesh) addMeshCollider(mc);
                        if (mc.traverse) mc.traverse(o => { if (o.isMesh) addMeshCollider(o); });
                    }
                }
            } else {
                // Invisible: apply maxLOD retention rule
                if (level === maxLOD && hasChildrenTiles) {
                    // keep existing colliders as fallback for deeper LODs
                } else {
                    detachMeshColliders();
                    self._activeColliderShape = undefined;
                }
            }
        }
    }
    _calculateUpdateMetric(camera, frustum) {
        ////// return -1 if not in frustum
        let distance = 0;
        if (this.boundingVolume instanceof OBB) {
            // box
            tempOBB.copy(this.boundingVolume);
            tempOBB.applyMatrix4(this.matrixWorld);
            if (!tempOBB.inFrustum(frustum)) return -1;
            if (this.clipShape != undefined) {
                if ((this.clipShape.isSphere && !tempOBB.intersectsSphere(this.clipShape)) ||
                    (this.clipShape.isOBB && !tempOBB.intersectsOBB(this.clipShape))
                ) {
                    return Number.MAX_VALUE;
                }
            }


            distance = Math.max(0, tempOBB.distanceToPoint(camera.position) - camera.near);

            /* tempSphere.center.copy(this.boundingVolume.center);
            tempSphere.radius = Math.sqrt(this.boundingVolume.halfSize.x*this.boundingVolume.halfSize.x+ this.boundingVolume.halfSize.y*this.boundingVolume.halfSize.y+ this.boundingVolume.halfSize.z*this.boundingVolume.halfSize.z)
            tempSphere.applyMatrix4(this.matrixWorld);
            if (!frustum.intersectsSphere(tempSphere)) return -1;
            distance = Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius - camera.near); */
            //console.log("distSphere " + distance)
        } else if (this.boundingVolume instanceof THREE.Sphere) {
            //sphere
            tempSphere.copy(this.boundingVolume);
            tempSphere.applyMatrix4(this.matrixWorld);
            if (this.clipShape != undefined) {
                if ((this.clipShape.isOBB && !this.clipShape.intersectsSphere(tempSphere)) ||
                    (this.clipShape.isSphere && !this.clipShape.intersectsSphere(tempSphere))
                ) {
                    return Number.MAX_VALUE;
                }
            }

            if (!frustum.intersectsSphere(tempSphere)) return -1;
            distance = Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius - camera.near);
        } else {
            console.error("unsupported shape");
            return -1

        }
        /////// Apply the bias factor to the distance
        distance = Math.pow(distance, this.distanceBias);
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
        return (16 * lambda) / (s * scale);
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
            tempOBB.copy(this.boundingVolume);
            tempOBB.applyMatrix4(this.matrixWorld);
            return Math.max(0, tempOBB.distanceToPoint(camera.position));
            //if (!frustum.intersectsSphere(tempSphere)) return -1;
        } else if (this.boundingVolume instanceof THREE.Sphere) {
            //sphere
            tempSphere.copy(this.boundingVolume);
            tempSphere.applyMatrix4(this.matrixWorld);
            return Math.max(0, camera.position.distanceTo(tempSphere.center) - tempSphere.radius);
        }
        else {
            console.error("unsupported shape");
            return -1;
        }

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
        //this.splatsReady = true;
        this.childrenTiles.forEach(child => child.setGeometricErrorMultiplier(geometricErrorMultiplier));
    }

    /**
     * Set the Distance Bias for the tileset.
     * the {@param distanceBias} can be a number between 0 and infinity.
     * A {@param distanceBias} is applied as an exponent to camera-to-tile distance.  
     * the {@link geometricErrorMultiplier} should be used to balance out the amount of detail loaded
     * 
     * @param {Number} distanceBias set the distance bias for the entire tileset
     */
    setDistanceBias(distanceBias) {
        this.distanceBias = distanceBias;
        this.childrenTiles.forEach(child => child.setDistanceBias(distanceBias));
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


    hideCopyright() {
        _hideCopyright();
    }
    showCopyright() {
        _showCopyright();
    }
}
export { OGC3DTile, getOGC3DTilesCopyrightInfo };

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

function _hideCopyright() {
    if (!copyrightDiv) {
        copyrightDiv = document.createElement('div');
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
    copyrightDiv.style.opacity = 0;
}
function _showCopyright() {
    if (!copyrightDiv) {
        copyrightDiv = document.createElement('div');
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
    copyrightDiv.style.opacity = 1;
}
function _updateCopyrightLabel() {
    // Create a new div
    if (!copyrightDiv) {
        copyrightDiv = document.createElement('div');
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

    // Set the text content of the div
    const list = getOGC3DTilesCopyrightInfo();
    let listString = "";
    list.forEach(item => {
        listString += item + ", ";
    });
    listString = listString.slice(0, -2);

    copyrightDiv.textContent = listString
    // Style the div

}

