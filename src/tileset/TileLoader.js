import { LinkedHashMap } from 'js-utils-z';
import { B3DMDecoder } from "../decoder/B3DMDecoder";
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { initial } from 'lodash';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

let concurentDownloads = 0;
const zUpToYUpMatrix = new THREE.Matrix4();
zUpToYUpMatrix.set(1, 0, 0, 0,
    0, 0, -1, 0,
    0, 1, 0, 0,
    0, 0, 0, 1);
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
gltfLoader.setDRACOLoader(dracoLoader);

class TileLoader {
    constructor(maxCachedItems, meshCallback, pointsCallback) {
        this.meshCallback = meshCallback;
        this.pointsCallback = pointsCallback;
        this.cache = new LinkedHashMap();
        this.maxCachedItems = !!maxCachedItems ? maxCachedItems : 100;
        this.register = {};


        this.ready = [];
        this.downloads = [];
        this.nextReady = [];
        this.nextDownloads = [];
        this.init();
    }

    init() {

        const self = this;
        setIntervalAsync(() => {
            self.download();
        }, 10);
        setIntervalAsync(() => {
            const start = Date.now();
            let loaded = 0;
            do {
                loaded = self.loadBatch();
            } while (loaded > 0 && (Date.now() - start) <= 0)

        }, 10);
    }

    scheduleDownload(f) {
        this.downloads.unshift(f);
    }
    download() {
        if (this.nextDownloads.length == 0) {
            this.getNextDownloads();
            if (this.nextDownloads.length == 0) return;
        }
        while (this.nextDownloads.length > 0 && concurentDownloads < 500) {
            const nextDownload = this.nextDownloads.shift();
            if (!!nextDownload && nextDownload.shouldDoDownload()) {
                nextDownload.doDownload();
            }
        }
        return;
    }
    meshReceived(cache, register, key, distanceFunction, getSiblings, level, uuid) {
        this.ready.unshift([cache, register, key, distanceFunction, getSiblings, level, uuid]);
    }
    loadBatch() {
        if (this.nextReady.length == 0) {
            this.getNextReady();
            if (this.nextReady.length == 0) return 0;
        }
        const data = this.nextReady.shift();
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
        return 1;
    }

    getNextDownloads() {
        let smallestDistance = Number.MAX_VALUE;
        let closest = -1;
        for (let i = this.downloads.length - 1; i >= 0; i--) {
            if (!this.downloads[i].shouldDoDownload()) {
                this.downloads.splice(i, 1);
                continue;
            }
            if (!this.downloads[i].distanceFunction) { // if no distance function, must be a json, give absolute priority!
                this.nextDownloads.push(this.downloads.splice(i, 1)[0]);
            }
        }
        if (this.nextDownloads.length > 0) return;
        for (let i = this.downloads.length - 1; i >= 0; i--) {
            const dist = this.downloads[i].distanceFunction() * this.downloads[i].level;
            if (dist < smallestDistance) {
                smallestDistance = dist;
                closest = i;
            }
        }
        if (closest >= 0) {
            const closestItem = this.downloads.splice(closest, 1).pop();
            this.nextDownloads.push(closestItem);
            const siblings = closestItem.getSiblings();
            for (let i = this.downloads.length - 1; i >= 0; i--) {
                if (siblings.includes(this.downloads[i].uuid)) {
                    this.nextDownloads.push(this.downloads.splice(i, 1).pop());
                }
            }
        }
    }

    getNextReady() {
        let smallestDistance = Number.MAX_VALUE;
        let closest = -1;
        for (let i = this.ready.length - 1; i >= 0; i--) {

            if (!this.ready[i][3]) {// if no distance function, must be a json, give absolute priority!
                this.nextReady.push(this.ready.splice(i, 1)[0]);
            }
        }
        if (this.nextReady.length > 0) return;
        for (let i = this.ready.length - 1; i >= 0; i--) {
            const dist = this.ready[i][3]() * this.ready[i][5];
            if (dist < smallestDistance) {
                smallestDistance = dist;
                closest = i
            }
        }
        if (closest >= 0) {
            const closestItem = this.ready.splice(closest, 1).pop();
            this.nextReady.push(closestItem);
            const siblings = closestItem[4]();
            for (let i = this.ready.length - 1; i >= 0; i--) {
                if (siblings.includes(this.ready[i][6])) {
                    this.nextready.push(this.ready.splice(i, 1).pop());
                }
            }
        }
    }


    get(abortController, tileIdentifier, path, callback, distanceFunction, getSiblings, level, zUpToYUp, geometricError) {
        const self = this;
        const key = simplifyPath(path);

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
            this.meshReceived(self.cache, self.register, key, distanceFunction, getSiblings, level, tileIdentifier);
        } else if (Object.keys(self.register[key]).length == 1) {
            let downloadFunction;
            if (path.includes(".b3dm")) {
                downloadFunction = () => {
                    concurentDownloads++;
                    fetch(path, { signal: realAbortController.signal }).then(result => {
                        concurentDownloads--;
                        if (!result.ok) {
                            console.error("could not load tile with path : " + path)
                            throw new Error(`couldn't load "${path}". Request failed with status ${result.status} : ${result.statusText}`);
                        }
                        return result.arrayBuffer();

                    })
                        .then(resultArrayBuffer => {
                            return B3DMDecoder.parseB3DM(resultArrayBuffer, self.meshCallback, geometricError, zUpToYUp);
                        })
                        .then(mesh => {
                            self.cache.put(key, mesh);
                            self.checkSize();
                            this.meshReceived(self.cache, self.register, key, distanceFunction, getSiblings, level, tileIdentifier);
                        })
                        .catch(() => { });;
                }
            } else if (path.includes(".glb") || path.includes(".gltf")) {
                downloadFunction = () => {
                    concurentDownloads++;
                    gltfLoader.load(path, gltf => {
                        gltf.scene.traverse((o) => {
                            o.geometricError = geometricError;
                            if (o.isMesh) {
                                if (zUpToYUp) {
                                    o.applyMatrix4(zUpToYUpMatrix);
                                }
                                if (!!self.meshCallback) {
                                    self.meshCallback(o);
                                }
                            }
                            if (o.isPoints) {
                                if (zUpToYUp) {
                                    o.applyMatrix4(zUpToYUpMatrix);
                                }
                                if (!!self.pointsCallback) {
                                    self.pointsCallback(o);
                                }
                            }
                        });
                        self.cache.put(key, gltf.scene);
                        self.checkSize();
                        self.meshReceived(self.cache, self.register, key, distanceFunction, getSiblings, level, tileIdentifier);
                    });

                }
            } else if (path.includes(".json")) {
                downloadFunction = () => {
                    concurentDownloads++;
                    fetch(path, { signal: realAbortController.signal }).then(result => {
                        concurentDownloads--;
                        if (!result.ok) {
                            console.error("could not load tile with path : " + path)
                            throw new Error(`couldn't load "${path}". Request failed with status ${result.status} : ${result.statusText}`);
                        }
                        return result.json();

                    }).then(json => {
                        self.cache.put(key, json);
                        self.checkSize();
                        self.meshReceived(self.cache, self.register, key);
                    })
                        .catch(e => console.error("tile download aborted"));
                }
            }
            this.scheduleDownload({
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



    invalidate(path, tileIdentifier) {
        const key = simplifyPath(path);
        if (!!this.register[key]) {
            delete this.register[key][tileIdentifier];
        }
    }

    checkSize() {
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

function simplifyPath(main_path) {

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