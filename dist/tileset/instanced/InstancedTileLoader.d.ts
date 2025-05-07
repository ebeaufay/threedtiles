/**
 * A Tile loader that manages caching and load order for instanced tiles.
 * The cache is an LRU cache and is defined by the number of items it can hold.
 * The actual number of cached items might grow beyond max if all items are in use.
 *
 * The load order is designed for optimal perceived loading speed (nearby tiles are refined first).
 *
 */
export class InstancedTileLoader {
    /**
     * Creates a tile loader with a maximum number of cached items and callbacks.
     * The only required property is a renderer that will be used to visualize the tiles.
     * The maxCachedItems property is the size of the cache in number of objects, mesh tile and tileset.json files.
     * The mesh and point callbacks will be called for every incoming mesh or points.
     *
     * @param {scene} [scene] - a threejs scene.
     * @param {Object} [options] - Optional configuration object.
     * @param {number} [options.maxCachedItems=100] - the cache size.
     * @param {number} [options.maxInstances=1] - the cache size.
     * @param {function} [options.meshCallback] - A callback to call on newly decoded meshes.
     * @param {function} [options.pointsCallback] - A callback to call on newly decoded points.
     * @param {sring} [options.proxy] - An optional proxy that tile requests will be directed too as POST requests with the actual tile url in the body of the request.
     * @param {KTX2Loader} [options.ktx2Loader = undefined] - A KTX2Loader (three/addons)
     * @param {DRACOLoader} [options.dracoLoader = undefined] - A DRACOLoader (three/addons)
     * @param {renderer} [options.renderer = undefined] - optional the renderer, this is required only for on the fly ktx2 support. not needed if you pass a ktx2Loader manually
     
     */
    constructor(scene?: scene, options?: {
        maxCachedItems?: number | undefined;
        maxInstances?: number | undefined;
        meshCallback?: Function | undefined;
        pointsCallback?: Function | undefined;
        proxy?: any;
        ktx2Loader?: any;
        dracoLoader?: any;
        renderer?: any;
    });
    zUpToYUpMatrix: THREE.Matrix4;
    maxCachedItems: number;
    maxInstances: number;
    proxy: any;
    meshCallback: Function | undefined;
    pointsCallback: Function | undefined;
    gltfLoader: any;
    hasDracoLoader: boolean | undefined;
    hasKTX2Loader: boolean | undefined;
    hasMeshOptDecoder: boolean;
    b3dmDecoder: B3DMDecoder;
    cache: LinkedHashMap;
    scene: any;
    ready: any[];
    downloads: any[];
    nextReady: any[];
    nextDownloads: any[];
    /**
     * To be called in the render loop or at regular intervals.
     * launches tile downloading and loading in an orderly fashion.
     */
    update(): void;
    _download(): void;
    _loadBatch(): 0 | 1;
    _getNextReady(): void;
    /**
     * Schedules a tile content to be downloaded
     *
     * @param {AbortController} abortController
     * @param {string} path path or url to tile content
     * @param {string|Number} uuid tile id
     * @param {InstancedOGC3DTile} instancedOGC3DTile
     * @param {Function} distanceFunction
     * @param {Function} getSiblings
     * @param {Number} level
     * @param {Boolean} sceneZupToYup
     * @param {Boolean} meshZupToYup
     * @param {Number} geometricError
     */
    get(abortController: AbortController, path: string, uuid: string | number, instancedOGC3DTile: InstancedOGC3DTile, distanceFunction: Function, getSiblings: Function, level: number, sceneZupToYup: boolean, meshZupToYup: boolean, geometricError: number): void;
    _getNextDownloads(): void;
    _checkSize(): void;
}
import * as THREE from 'three';
import { B3DMDecoder } from "../../decoder/B3DMDecoder";
import { LinkedHashMap } from '../../utils/LinkedHashMap';
import { InstancedOGC3DTile } from './InstancedOGC3DTile';
