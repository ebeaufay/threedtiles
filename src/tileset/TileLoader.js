import { LinkedHashMap } from 'js-utils-z';
import { B3DMDecoder } from "../decoder/B3DMDecoder";
import { setIntervalAsync } from 'set-interval-async/dynamic';

const ready = [];
const downloads = [];
function scheduleDownload(f) {
    downloads.unshift(f);
}
function download() {
    if(downloads.length <=0) return;
    const nextDownload = downloads.shift();
    if (!!nextDownload && nextDownload.shouldDoDownload()) {
        nextDownload.doDownload();
    }
}
function meshReceived(cache, register, key) {
    ready.unshift([cache, register, key]);
}
function loadBatch() {
    for (let i = 0; i < 1; i++) {
        const data = ready.shift();
        if (!data) return;
        const cache = data[0];
        const register = data[1];
        const key = data[2];
        const mesh = cache.get(key);
        if (!!mesh) {
            Object.keys(register[key]).forEach(tile => {
                const callback = register[key][tile];
                if (!!callback) {
                    callback(mesh);
                    register[key][tile] = null;
                }
            });
        }
    }
}
setIntervalAsync(() => {
    loadBatch();
}, 10)
setIntervalAsync(() => {
    download();
}, 10)

class TileLoader {
    constructor(meshCallback, stats) {
        this.meshCallback = meshCallback;
        this.cache = new LinkedHashMap();
        this.maxSize = 1000;
        this.stats = stats;
        this.register = {};
    }

    get(tileIdentifier, path, callback) {
        const self = this;
        const key = simplifyPath(path);


        if (!path.includes(".b3dm")) {
            console.error("the 3DTiles cache can only be used to load B3DM data");
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
            meshReceived(self.cache, self.register, key);
        } else if (Object.keys(self.register[key]).length == 1) {
            scheduleDownload({
                "shouldDoDownload":()=>{
                    return Object.keys(self.register[key]).length > 0;
                },
                "doDownload": () => {
                    fetch(path).then(result => {
                        if (!result.ok) {
                            console.error("could not load tile with path : " + path)
                            throw new Error(`couldn't load "${path}". Request failed with status ${result.status} : ${result.statusText}`);
                        }
                        result.arrayBuffer().then(buffer => B3DMDecoder.parseB3DM(buffer, self.meshCallback)).then(mesh => {
                            self.cache.put(key, mesh);
                            self.checkSize();
                            meshReceived(self.cache, self.register, key);
                        });

                    });
                }
            })
        }
    }

    meshReceived(key, mesh) {
        const self = this;
        Object.keys(self.register[key]).forEach(tile => {
            const callback = self.register[key][tile];
            if (!!callback) {
                callback(mesh);
                self.register[key][tile] = null;
            }
        });
    }

    invalidate(path, tileIdentifier) {
        const key = simplifyPath(path);
        delete this.register[key][tileIdentifier];
    }

    checkSize() {
        const self = this;
        
        let i = 0;
        function memOverflowCheck(){
            if(!!self.stats && self.stats.memory()>0){
                if(self.stats.memory()/self.stats.maxMemory()<0.25){
                    return false;
                }
                return true;
            }
            return self.cache.size() > self.maxSize;
        }
        while (memOverflowCheck() && i < self.cache.size()) {
            i++;
            const entry = self.cache.head();
            if (Object.keys(self.register[entry.key]).length > 0) {
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