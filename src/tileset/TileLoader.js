import * as THREE from 'three';
import { LinkedHashMap } from 'js-utils-z';
import { B3DMDecoder } from "../decoder/B3DMDecoder";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from "three/addons/loaders/KTX2Loader";
import { resolveImplicite } from './implicit/ImplicitTileResolver.js';
import { MeshoptDecoder } from 'meshoptimizer';

let concurrentDownloads = 0;


/**
 * A Tile loader that manages caching and load order.
 * The cache is an LRU cache and is defined by the number of items it can hold.
 * The actual number of cached items might grow beyond max if all items are in use.
 * 
 * The load order is designed for optimal perceived loading speed (nearby tiles are refined first).
 * @class
 */
class TileLoader {
    /**
     * Creates a tile loader with a maximum number of cached items and callbacks.
     * The only required property is a renderer that will be used to visualize the tiles.
     * The maxCachedItems property is the size of the cache in number of objects, mesh tile and tileset.json files.
     * The mesh and point callbacks will be called for every incoming mesh or points.
     * 
     *
     * 
     * @param {Object} [options] - Optional configuration object.
     * @param {number} [options.maxCachedItems=100] - the cache size.
     * @param {function} [options.meshCallback = undefined] - A callback to call on newly decoded meshes.
     * @param {function} [options.pointsCallback = undefined] - A callback to call on newly decoded points.
     * @param {sring} [options.proxy = undefined] - An optional proxy that tile requests will be directed too as POST requests with the actual tile url in the body of the request.
     * @param {KTX2Loader} [options.ktx2Loader = undefined] - A KTX2Loader (three/addons)
     * @param {DRACOLoader} [options.dracoLoader = undefined] - A DRACOLoader (three/addons)
     * @param {renderer} [options.renderer = undefined] - optional the renderer, this is required only for on the fly ktx2 support. not needed if you pass a ktx2Loader manually
     */
    constructor(options) {
        this.zUpToYUpMatrix = new THREE.Matrix4();
        this.zUpToYUpMatrix.set(1, 0, 0, 0,
            0, 0, -1, 0,
            0, 1, 0, 0,
            0, 0, 0, 1);
        this.maxCachedItems = 100;
        this.proxy = options.proxy;
        if (!!options) {
            this.meshCallback = options.meshCallback;
            this.pointsCallback = options.pointsCallback;
            if (options.maxCachedItems) this.maxCachedItems = options.maxCachedItems;
        }

        this.gltfLoader = new GLTFLoader();
        if (!!options && !!options.dracoLoader) {
            this.gltfLoader.setDRACOLoader(options.dracoLoader);
            this.hasDracoLoader = true;
        } else {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('draco-decoders/');
            this.gltfLoader.setDRACOLoader(dracoLoader);
            this.gltfLoader.hasDracoLoader = true;
        }

        if (!!options && !!options.ktx2Loader) {
            this.gltfLoader.setKTX2Loader(options.ktx2Loader);
            this.hasKTX2Loader = true;
        } else if (!!options && !!options.renderer) {
            const ktx2Loader = new KTX2Loader();
            ktx2Loader.setTranscoderPath('ktx2-decoders/').detectSupport(options.renderer);
            this.gltfLoader.setKTX2Loader(ktx2Loader);
            this.gltfLoader.hasKTX2Loader = true;
        }

        this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
        this.hasMeshOptDecoder = true;

        this.b3dmDecoder = new B3DMDecoder(this.gltfLoader);

        this.cache = new LinkedHashMap();
        this.register = {};


        this.ready = [];
        this.downloads = [];
        this.nextReady = [];
        this.nextDownloads = [];

    }


    /**
     * To be called in the render loop or at regular intervals.
     * launches tile downloading and loading in an orderly fashion.
     */
    update() {
        
        const self = this;
        if (concurrentDownloads < 8) {
            self._download();
        }
        
        self._loadBatch();
        
    }


    _scheduleDownload(f) {
        this.downloads.unshift(f);
    }
    _download() {

        if (this.nextDownloads.length == 0) {
            this._getNextDownloads();
            if (this.nextDownloads.length == 0) return;
        }
        while (this.nextDownloads.length > 0) {
            const nextDownload = this.nextDownloads.shift();
            if (!!nextDownload && nextDownload.shouldDoDownload()) {
                nextDownload.doDownload();
            }
        }
        return;
    }
    _meshReceived(cache, register, key, distanceFunction, getSiblings, level, uuid) {
        this.ready.unshift([cache, register, key, distanceFunction, getSiblings, level, uuid]);
    }
    
    _loadBatch() {
        if (this.nextReady.length == 0) {
            this._getNextReady();
        }
        while(this.nextReady.length > 0){
            const data = this.nextReady.shift();
            if (!data) return;
            const cache = data[0];
            const register = data[1];
            const key = data[2];
            const mesh = cache.get(key);
    
            if (!!mesh && !!register[key]) {
                Object.keys(register[key]).forEach(tile => {
                    const callback = register[key][tile];
                    if (!!callback) {
                        callback(mesh);
                        register[key][tile] = null;
                    }
                });
            }
            if (this.nextReady.length == 0) {
                this._getNextReady();
            }
        }
        
        return;

        /* while (this.ready.length > 0) {
            const data = this.ready.shift();
            if (!data) return 0;
            const cache = data[0];
            const register = data[1];
            const key = data[2];
            const mesh = cache.get(key);

            if (!!mesh && !!register[key]) {
                Object.keys(register[key]).forEach(tile => {
                    const callback = register[key][tile];
                    if (!!callback) {
                        callback(mesh);
                        register[key][tile] = null;
                    }
                });
            }
            return;
        } */
    }

    _getNextDownloads() {
        let smallestDistance = Number.POSITIVE_INFINITY;
        let closest = -1;
        for (let i = this.downloads.length - 1; i >= 0; i--) {
            /* if (!this.downloads[i].shouldDoDownload()) {
                this.downloads.splice(i, 1);
                continue;
            } */
            if (!this.downloads[i].distanceFunction) { // if no distance function, must be a json, give absolute priority!
                this.nextDownloads.push(this.downloads.splice(i, 1)[0]);
            }
        }
        if (this.nextDownloads.length > 0) return;
        for (let i = this.downloads.length - 1; i >= 0; i--) {
            const dist = this.downloads[i].distanceFunction();
            if (dist <= smallestDistance) {
                smallestDistance = dist;
                closest = i;
            }
        }
        if (closest >= 0) {
            const closestItem = this.downloads.splice(closest, 1).pop();
            this.nextDownloads.push(closestItem);
            const siblings = closestItem.getSiblings();
            for (let i = this.downloads.length - 1; i >= 0; i--) {
                if (siblings.map(s => s.uuid).includes(this.downloads[i].uuid)) {
                    this.nextDownloads.push(this.downloads.splice(i, 1).pop());
                }
            }
        }
    }

    _getNextReady() {
        let smallestDistance = Number.POSITIVE_INFINITY;
        let closest = -1;
        for (let i = this.ready.length - 1; i >= 0; i--) {

            if (!this.ready[i][3]) {// if no distance function, must be a json, give absolute priority!
                this.nextReady.push(this.ready.splice(i, 1)[0]);
            }
        }
        if (this.nextReady.length > 0) return;
        for (let i = this.ready.length - 1; i >= 0; i--) {
            const dist = this.ready[i][3]() * this.ready[i][5];
            if (dist <= smallestDistance) {
                smallestDistance = dist;
                closest = i
            }
        }
        if (closest >= 0) {
            const closestItem = this.ready.splice(closest, 1).pop();
            this.nextReady.push(closestItem);
            /*  const siblings = closestItem[4]();
             for (let i = this.ready.length - 1; i >= 0; i--) {
                 if (siblings.map(s=>s.uuid).includes(this.ready[i][6])) {
                     this.nextReady.push(this.ready.splice(i, 1).pop());
                 }
             } */
        }
    }


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
    get(abortController, tileIdentifier, path, callback, distanceFunction, getSiblings, level, sceneZupToYup, meshZupToYup, geometricError) {
        const self = this;
        const key = _simplifyPath(path);

        const realAbortController = new AbortController();
        abortController.signal.addEventListener("abort", () => {
            if (!self.register[key] || Object.keys(self.register[key]).length == 0) {
                realAbortController.abort();
            }
        })

        if (!path.includes(".b3dm") && !path.includes(".json") && !path.includes(".gltf") && !path.includes(".glb")) {
            console.error("the 3DTiles cache can only be used to load B3DM, gltf and json data");
            return;
        }
        if (!self.register[key]) {
            self.register[key] = {};
        }
        if (!!self.register[key][tileIdentifier]) {
            console.error(" a tile should only be loaded once");
        }
        self.register[key][tileIdentifier] = callback;

        const cachedObject = self.cache.get(key);
        if (!!cachedObject) {
            this._meshReceived(self.cache, self.register, key, distanceFunction, getSiblings, level, tileIdentifier);
        } else if (Object.keys(self.register[key]).length == 1) {
            let downloadFunction;
            if (path.includes(".b3dm")) {
                downloadFunction = () => {
                    
        
                    var fetchFunction;
                    if (!self.proxy) {
                        fetchFunction = () => {
                            return fetch(path, { signal: realAbortController.signal });
                        }
                    } else {
                        fetchFunction = () => {
                            return fetch(self.proxy,
                                {
                                    method: 'POST',
                                    body: path,
                                    signal: realAbortController.signal
                                }
                            );
                        }
                    }
                    concurrentDownloads++;
                    fetchFunction().then(result => {
                        if (!result.ok) {
                            console.error("could not load tile with path : " + path)
                            throw new Error(`couldn't load "${path}". Request failed with status ${result.status} : ${result.statusText}`);
                        }
                        return result.arrayBuffer();

                    }).then(resultArrayBuffer => {

                        return this.b3dmDecoder.parseB3DM(resultArrayBuffer, (mesh) => { self.meshCallback(mesh, geometricError) }, sceneZupToYup, meshZupToYup);
                    }).then(mesh => {
                        self.cache.put(key, mesh);
                        self._checkSize();
                        this._meshReceived(self.cache, self.register, key, distanceFunction, getSiblings, level, tileIdentifier);
                    }).catch((e) => {
                        console.error(e)
                    }).finally(() => {
                        concurrentDownloads--;
                    });

                }
            } else if (path.includes(".glb") || path.includes(".gltf")) {
                downloadFunction = () => {
                    var fetchFunction;
                    if (!self.proxy) {
                        fetchFunction = () => {
                            return fetch(path, { signal: realAbortController.signal });
                        }
                    } else {
                        fetchFunction = () => {
                            return fetch(self.proxy,
                                {
                                    method: 'POST',
                                    body: path,
                                    signal: realAbortController.signal
                                }
                            );
                        }
                    }
                    concurrentDownloads++;
                    fetchFunction().then(result => {
                        if (!result.ok) {
                            console.error("could not load tile with path : " + path)
                            throw new Error(`couldn't load "${path}". Request failed with status ${result.status} : ${result.statusText}`);
                        }
                        return result.arrayBuffer();
                    }).then(async arrayBuffer => {
                        await _checkLoaderInitialized(this.gltfLoader);
                        this.gltfLoader.parse(arrayBuffer, null, gltf => {
                            gltf.scene.asset = gltf.asset;
                            if (sceneZupToYup) {
                                gltf.scene.applyMatrix4(this.zUpToYUpMatrix);
                            }
                            gltf.scene.traverse((o) => {

                                if (o.isMesh) {
                                    if (meshZupToYup) {
                                        o.applyMatrix4(this.zUpToYUpMatrix);
                                    }
                                    if (!!self.meshCallback) {
                                        self.meshCallback(o, geometricError);
                                    }
                                }
                                if (o.isPoints) {

                                    if (!!self.pointsCallback) {
                                        self.pointsCallback(o, geometricError);
                                    }
                                }
                            });

                            self.cache.put(key, gltf.scene);
                            self._checkSize();
                            self._meshReceived(self.cache, self.register, key, distanceFunction, getSiblings, level, tileIdentifier);
                        });
                    }).catch((e) => {
                        console.error(e)
                    }).finally(() => {
                        concurrentDownloads--;
                    });


                }
            } else if (path.includes(".json")) {
                downloadFunction = () => {
                    var fetchFunction;
                    if (!self.proxy) {
                        fetchFunction = () => {
                            return fetch(path, { signal: realAbortController.signal });
                        }
                    } else {
                        fetchFunction = () => {
                            return fetch(self.proxy,
                                {
                                    method: 'POST',
                                    body: path,
                                    signal: realAbortController.signal
                                }
                            );
                        }
                    }
                    concurrentDownloads++;
                    fetchFunction().then(result => {
                        if (!result.ok) {
                            console.error("could not load tile with path : " + path)
                            throw new Error(`couldn't load "${path}". Request failed with status ${result.status} : ${result.statusText}`);
                        }
                        return result.json();

                    }).then(json => {
                        return resolveImplicite(json, path)
                    }).then(json => {
                        self.cache.put(key, json);
                        self._checkSize();
                        self._meshReceived(self.cache, self.register, key);
                    }).catch((e) => {
                        console.error(e)
                    }).finally(() => {
                        concurrentDownloads--;
                    });
                }
            }
            this._scheduleDownload({
                "shouldDoDownload": () => {
                    return !abortController.signal.aborted && !!self.register[key] && Object.keys(self.register[key]).length > 0;
                },
                "doDownload": downloadFunction,
                "distanceFunction": distanceFunction,
                "getSiblings": getSiblings,
                "level": level,
                "uuid": tileIdentifier
            })
        }
    }


    /**
     * Invalidates all the unused cached tiles.
     */
    clear(){
        const temp = this.maxCachedItems;
        this.maxCachedItems = 0;
        this._checkSize();
        this.maxCachedItems = temp;
    }

    /**
     *  unregisters a tile content for a specific tile, removing it from the cache if no other tile is using the same content.
     * @param {string} path the content path/url
     * @param {string|Number} tileIdentifier the tile ID
     */
    invalidate(path, tileIdentifier) {
        const key = _simplifyPath(path);
        if (!!this.register[key]) {
            delete this.register[key][tileIdentifier];

            //this.register[key][tileIdentifier] = undefined;
            //this._checkSize();
        }
    }

    _checkSize() {
        const self = this;

        let i = 0;

        while (self.cache.size() > self.maxCachedItems && i < self.cache.size()) {
            i++;
            const entry = self.cache.head();
            const reg = self.register[entry.key];
            if (!!reg) {
                if (Object.keys(reg).length > 0) {
                    self.cache.remove(entry.key);
                    self.cache.put(entry.key, entry.value);
                } else {
                    self.cache.remove(entry.key);
                    delete self.register[entry.key];
                    //self.register[entry.key] = undefined;
                    entry.value.traverse((o) => {

                        if (o.material) {
                            // dispose materials
                            if (o.material.length) {
                                for (let i = 0; i < o.material.length; ++i) {
                                    o.material[i].dispose();
                                }
                            }
                            else {
                                o.material.dispose()
                            }
                        }
                        if (o.geometry) {
                            // dispose geometry
                            o.geometry.dispose();

                        }
                    });
                }
            }

        }
    }
}



async function _checkLoaderInitialized(loader) {
    const self = this;
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if ((!loader.hasDracoLoader || loader.dracoLoader) && (!loader.hasKTX2Loader || loader.ktx2Loader)) {
                clearInterval(interval);
                resolve();
            }
        }, 10); // check every 100ms
    });
};

function _simplifyPath(main_path) {

    var parts = main_path.split('/'),
        new_path = [],
        length = 0;
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part === '.' || part === '' || part === '..') {
            if (part === '..' && length > 0) {
                length--;
            }
            continue;
        }
        new_path[length++] = part;
    }

    if (length === 0) {
        return '/';
    }

    var result = '';
    for (var i = 0; i < length; i++) {
        result += '/' + new_path[i];
    }

    return result;
}

export { TileLoader };