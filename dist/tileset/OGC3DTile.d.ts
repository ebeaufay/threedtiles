/**
 * class representing a tiled and multileveled mesh or point-cloud according to the OGC3DTiles 1.1 spec
 * @class
 * @extends {THREE.Object3D}
 */
export class OGC3DTile extends THREE.Object3D<THREE.Object3DEventMap> {
    /**
     * @param {Object} [properties] - the properties for this tileset
     * @param {String} [properties.url] - the url to the parent tileset.json
     * @param {Object} [properties.queryParams = undefined] - optional, path params to add to individual tile urls
     * @param {Number} [properties.geometricErrorMultiplier = 1] - the geometric error of the parent. 1.0 by default corresponds to a maxScreenSpaceError of 16
     * @param {Boolean} [properties.loadOutsideView = false] - if truthy, tiles otside the camera frustum will be loaded with the least possible amount of detail
     * @param {TileLoader} [properties.tileLoader = undefined] - A tile loader that can be shared among tilesets in order to share a common cache.
     * @param {Function} [properties.meshCallback = undefined] - A callback function that will be called on every mesh
     * @param {Function} [properties.pointsCallback = undefined] - A callback function that will be called on every points
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
     */
    constructor(properties?: {
        url?: string | undefined;
        queryParams?: Object | undefined;
        geometricErrorMultiplier?: number | undefined;
        loadOutsideView?: boolean | undefined;
        tileLoader?: TileLoader | undefined;
        meshCallback?: Function | undefined;
        pointsCallback?: Function | undefined;
        onLoadCallback?: Function | undefined;
        occlusionCullingService?: any;
        centerModel?: boolean | undefined;
        static?: boolean | undefined;
        rootPath?: string | undefined;
        json?: string | undefined;
        parentGeometricError?: number | undefined;
        parentBoundingVolume?: Object | undefined;
        parentRefine?: string | undefined;
        cameraOnLoad?: THREE.Camera | undefined;
        parentTile?: OGC3DTile | undefined;
        proxy?: string | undefined;
        displayErrors?: boolean | undefined;
        renderer?: any;
        domWidth?: number | undefined;
        domHeight?: number | undefined;
        dracoLoader?: any;
        ktx2Loader?: any;
        distanceBias?: number | undefined;
        loadingStrategy?: string | undefined;
        drawBoundingVolume?: string | undefined;
        splatsFragmentShader?: string | undefined;
    });
    splatsMesh: any;
    contentURL: any[];
    rendererSize: THREE.Vector2;
    loadingStrategy: string;
    distanceBias: number;
    proxy: string | undefined;
    drawBoundingVolume: string | boolean;
    displayErrors: boolean | undefined;
    displayCopyright: boolean;
    queryParams: {
        constructor: Function;
        toString(): string;
        toLocaleString(): string;
        valueOf(): Object;
        hasOwnProperty(v: PropertyKey): boolean;
        isPrototypeOf(v: Object): boolean;
        propertyIsEnumerable(v: PropertyKey): boolean;
    } | undefined;
    tileLoader: TileLoader | undefined;
    /**
     * To be called in the render loop.
     * @param {THREE.Camera} camera a camera that the tileset will be rendered with.
     * @returns {{numTilesLoaded: number, numTilesRendered: number, maxLOD: number, percentageLoaded: number}} An object containing describing the current state of the loaded tileset.
     */
    update(camera: THREE.Camera): {
        numTilesLoaded: number;
        numTilesRendered: number;
        maxLOD: number;
        percentageLoaded: number;
    };
    geometricErrorMultiplier: number;
    splatsCropRadius: number;
    splatsSizeMultiplier: number;
    renderer: any;
    meshCallback: Function | undefined;
    loadOutsideView: boolean | undefined;
    cameraOnLoad: THREE.Camera | undefined;
    parentTile: OGC3DTile | undefined;
    occlusionCullingService: any;
    static: boolean | undefined;
    color: THREE.Color | undefined;
    colorID: number | undefined;
    childrenTiles: any[];
    meshContent: any[];
    materialVisibility: boolean;
    level: any;
    hasMeshContent: number;
    hasUnloadedJSONContent: number;
    centerModel: boolean | undefined;
    abortController: AbortController;
    onLoadCallback: Function | undefined;
    /**
     * Specify a size multiplier for splats
     * @param {number} sizeMultiplier
     */
    setSplatsSizeMultiplier(sizeMultiplier: number): void;
    /**
     * specify a crop radius for splats
     * @param {number} cropRadius
     */
    setSplatsCropRadius(cropRadius: number): void;
    /**
     * Manually updates all the matrices of the tileset.
     * To be called after transforming a {@link OGC3DTile tileset} instantiated with the "static" option
     */
    updateMatrices(): void;
    /**
     * Call this to specify the canvas width/height when it changes (used to compute tiles geometric error that controls tile refinement).
     * It's unnecessary to call this when the {@link OGC3DTile} is instantiated with the renderer.
     *
     * @param {Number} width
     * @param {Number} height
     */
    setCanvasSize(width: number, height: number): void;
    _setup(properties: any): Promise<void>;
    rootPath: any;
    isSetup: boolean | undefined;
    _assembleURL(root: any, relative: any): string;
    _extractQueryParams(url: any, params: any): string;
    _load(loadJson?: boolean, loadMesh?: boolean): Promise<void>;
    /**
     * Disposes of all the resources used by the tileset.
     */
    dispose(): void;
    deleted: boolean | undefined;
    _disposeMeshContent(): void;
    _disposeChildren(): void;
    raycast(raycaster: any, intersects: any): boolean | void;
    _updateImmediate(camera: any, frustum: any): void;
    shouldBeVisible: boolean | undefined;
    _statsImmediate(maxLOD: any, numTiles: any, percentageLoaded: any, numTilesRendered: any): void;
    _stats(maxLOD: any, numTiles: any, percentageLoaded: any, numTilesRendered: any): void;
    _trimTreeImmediate(): void;
    _updateNodeVisibilityImmediate(parentDisplaysMesh?: boolean): void;
    _shouldBeVisibleUpdateImmediate(): void;
    _setShouldNotBeVisibleRecursive(): void;
    _loadMeshImmediate(): void;
    _computeMetricRecursive(camera: any, frustum: any): void;
    metric: number | undefined;
    _expandTreeImmediate(camera: any): void;
    _update(camera: any, frustum: any): void;
    _loadJsonChildren(camera: any): void;
    _areAllChildrenLoadedAndHidden(): boolean;
    /**
     * Node is ready if it is outside frustum, if it was drawn at least once or if all it's children are ready
     * @returns true if ready
     */
    _isReady(): boolean;
    _isReadyImmediate(): boolean;
    _changeContentVisibility(visibility: any): void;
    _calculateUpdateMetric(camera: any, frustum: any): number;
    _getSiblings(): any[];
    _calculateDistanceToCamera(camera: any): number;
    /**
     * Set the Geometric Error Multiplier for the tileset.
     * the {@param geometricErrorMultiplier} can be a number between 1 and infinity.
     * A {@param geometricErrorMultiplier} of 1 (default) corresponds to a max ScreenSpace error (MSE) of 16.
     * A lower {@param geometricErrorMultiplier} loads less detail (higher MSE) and a higher {@param geometricErrorMultiplier} loads more detail (lower MSE)
     *
     * @param {Number} geometricErrorMultiplier set the LOD multiplier for the entire tileset
     */
    setGeometricErrorMultiplier(geometricErrorMultiplier: number): void;
    /**
     * Set the Distance Bias for the tileset.
     * the {@param distanceBias} can be a number between 0 and infinity.
     * A {@param distanceBias} is applied as an exponent to camera-to-tile distance.
     * the {@link geometricErrorMultiplier} should be used to balance out the amount of detail loaded
     *
     * @param {Number} distanceBias set the distance bias for the entire tileset
     */
    setDistanceBias(distanceBias: number): void;
    _transformWGS84ToCartesian(lon: any, lat: any, h: any, sfct: any): void;
}
/**
 * @returns a list of vendors that are required by copyright to be displayed in the app.
 */
export function getOGC3DTilesCopyrightInfo(): string[];
import * as THREE from 'three';
import { TileLoader } from "./TileLoader";
