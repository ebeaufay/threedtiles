/**
 * A Tile loader that manages caching and load order.
 * The cache is an LRU cache and is defined by the number of items it can hold.
 * The actual number of cached items might grow beyond max if all items are in use.
 *
 * The load order is designed for optimal perceived loading speed (nearby tiles are refined first).
 * @class
 */
export class TileLoader {
    /**
     * Creates a tile loader with a maximum number of cached items and callbacks.
     * The only required property is a renderer that will be used to visualize the tiles.
     * The maxCachedItems property is the size of the cache in number of objects, mesh tile and tileset.json files.
     * The mesh and point callbacks will be called for every incoming mesh or points.
     *
     *
     *
     * @param {Object} [options] - Optional configuration object.
     * @param {renderer} [options.renderer] - the WebGL renderer
     * @param {number} [options.maxCachedItems=100] - the cache size.
     * @param {function} [options.meshCallback = undefined] - A callback to call on newly decoded meshes.
     * @param {function} [options.pointsCallback = undefined] - A callback to call on newly decoded points.
     * @param {sring} [options.proxy = undefined] - An optional proxy that tile requests will be directed too as POST requests with the actual tile url in the body of the request.
     * @param {KTX2Loader} [options.ktx2Loader = undefined] - A KTX2Loader (three/addons)
     * @param {DRACOLoader} [options.dracoLoader = undefined] - A DRACOLoader (three/addons)
     * @param {number} [options.downloadParallelism = 8] - Maximum number of parallel downloads
     * @param {number} [options.timeout = 5000] - number of milliseconds to keep tiles in cache before clearing
     */
    constructor(options?: {
        renderer?: any;
        maxCachedItems?: number | undefined;
        meshCallback?: Function | undefined;
        pointsCallback?: Function | undefined;
        proxy?: any;
        ktx2Loader?: any;
        dracoLoader?: any;
        downloadParallelism?: number | undefined;
        timeout?: number | undefined;
    });
    downloadParallelism: number;
    timeout: number;
    renderer: any;
    zUpToYUpMatrix: THREE.Matrix4;
    maxCachedItems: number;
    proxy: any;
    meshCallback: Function | undefined;
    pointsCallback: Function | undefined;
    gltfLoader: any;
    hasDracoLoader: boolean | undefined;
    dracoLoader: any;
    hasKTX2Loader: boolean | undefined;
    ktx2loader: any;
    hasMeshOptDecoder: boolean;
    b3dmDecoder: B3DMDecoder;
    splatsDecoder: SplatsDecoder;
    cache: LinkedHashMap;
    register: {};
    ready: any[];
    downloads: any[];
    nextReady: any[];
    nextDownloads: any[];
    /**
     * To be called in the render loop or at regular intervals.
     * launches tile downloading and loading in an orderly fashion.
     */
    update(): void;
    _scheduleDownload(f: any): void;
    _download(): void;
    _meshReceived(cache: any, register: any, key: any, distanceFunction: any, getSiblings: any, level: any, uuid: any): void;
    _loadBatch(): void;
    _getNextDownloads(): void;
    _getNextReady(): void;
    /**
     * Schedules a tile content to be downloaded
     *
     * @param {AbortController} abortController
     * @param {string|Number} tileIdentifier
     * @param {string} path
     * @param {Function} callback
     * @param {Function} distanceFunction
     * @param {Function} getSiblings
     * @param {Number} level
     * @param {Boolean} sceneZupToYup
     * @param {Boolean} meshZupToYup
     * @param {Number} geometricError
     */
    get(abortController: AbortController, tileIdentifier: string | number, path: string, callback: Function, distanceFunction: Function, getSiblings: Function, level: number, loadingStrategy: any, sceneZupToYup: boolean, meshZupToYup: boolean, geometricError: number, splatsMesh: any): void;
    /**
     * Invalidates all the unused cached tiles.
     */
    clear(): void;
    /**
     *  unregisters a tile content for a specific tile, removing it from the cache if no other tile is using the same content.
     * @param {string} path the content path/url
     * @param {string|Number} tileIdentifier the tile ID
     */
    invalidate(path: string, tileIdentifier: string | number): void;
    dispose(): void;
    _checkSize(): void;
    _disposeEntryContent(entry: any): void;
}
import * as THREE from 'three';
import { B3DMDecoder } from "../decoder/B3DMDecoder";
import { SplatsDecoder } from "../decoder/SplatsDecoder";
import { LinkedHashMap } from '../utils/LinkedHashMap';
