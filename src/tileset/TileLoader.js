import { LinkedHashMap } from 'js-utils-z';
import { B3DMDecoder } from "../decoder/B3DMDecoder";

const ready = [];
const downloads = [];
const nextReady = [];
const nextDownloads = [];

function scheduleDownload(f) {
    downloads.unshift(f);
    //setTimeout(()=>download(),0);
}
function download() {
    if (nextDownloads.length == 0) {
        getNextDownloads();
        if (nextDownloads.length == 0) return;
    }
    const nextDownload = nextDownloads.shift();
    if (!!nextDownload && nextDownload.shouldDoDownload()) {
        nextDownload.doDownload();
    }
}
function meshReceived(cache, register, key, distanceFunction, getSiblings, level, uuid) {
    ready.unshift([cache, register, key, distanceFunction, getSiblings, level, uuid]);
    //setTimeout(()=>loadBatch(),1);
}
function loadBatch() {
    if (nextReady.length == 0) {
        getNextReady();
        if (nextReady.length == 0) return;
    }
    const data = nextReady.shift();
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
}

function getNextDownloads() {
    let smallestLevel = Number.MAX_VALUE;
    let smallestDistance = Number.MAX_VALUE;
    let closest = -1;
    for (let i = downloads.length - 1; i >= 0; i--) {
        if (!downloads[i].shouldDoDownload()) {
            downloads.splice(i, 1);
            continue;
        }
        if(!downloads[i].distanceFunction){ // if no distance function, must be a json, give absolute priority!
            nextDownloads.push(downloads.splice(i, 1)[0]);
        }
    }
    if(nextDownloads.length>0) return;
    for (let i = downloads.length - 1; i >= 0; i--) {
        const dist = downloads[i].distanceFunction();
        if (dist < smallestDistance) {
            smallestDistance = dist;
            closest = i;
        } else if (dist == smallestDistance && downloads[i].level < smallestLevel) {
            smallestLevel = downloads[i].level;
            closest = i
        }
    }
    if (closest >= 0) {
        const closestItem = downloads.splice(closest, 1).pop();
        nextDownloads.push(closestItem);
        const siblings = closestItem.getSiblings();
        for (let i = downloads.length - 1; i >= 0; i--) {
            if (siblings.includes(downloads[i].uuid)) {
                nextDownloads.push(downloads.splice(i, 1).pop());
            }
        }
    }
}

function getNextReady() {
    let smallestLevel = Number.MAX_VALUE;
    let smallestDistance = Number.MAX_VALUE;
    let closest = -1;
    for (let i = ready.length - 1; i >= 0; i--) {
        
        if(!ready[i][3]){// if no distance function, must be a json, give absolute priority!
            nextReady.push(ready.splice(i,1)[0]);
        }
    }
    if(nextReady.length>0) return;
    for (let i = ready.length - 1; i >= 0; i--) {
        const dist = ready[i][3]();
        if (dist < smallestDistance) {
            smallestDistance = dist;
            smallestLevel = ready[i][5]
            closest = i
        } else if (dist == smallestDistance && ready[i][5] < smallestLevel) {
            smallestLevel = ready[i][5]
            closest = i
        }
    }
    if (closest >= 0) {
        const closestItem = ready.splice(closest, 1).pop();
        nextReady.push(closestItem);
        const siblings = closestItem[4]();
        for (let i = ready.length - 1; i >= 0; i--) {
            if (siblings.includes(ready[i][6])) {
                nextready.push(ready.splice(i, 1).pop());
            }
        }
    }
}
setInterval(() => {
    download()
}, 1)
setInterval(() => {
    loadBatch()
}, 1)

class TileLoader {
    constructor(meshCallback, maxCachedItems) {
        this.meshCallback = meshCallback;
        this.cache = new LinkedHashMap();
        this.maxCachedItems = !!maxCachedItems ? maxCachedItems : 1000;
        this.register = {};
    }

    get(tileIdentifier, path, callback, distanceFunction, getSiblings, level, uuid) {
        const self = this;
        const key = simplifyPath(path);


        if (!path.includes(".b3dm") && !path.includes(".json")) {
            console.error("the 3DTiles cache can only be used to load B3DM and json data");
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
            meshReceived(self.cache, self.register, key, distanceFunction, getSiblings, level, uuid);
        } else if (Object.keys(self.register[key]).length == 1) {
            let downloadFunction;
            if (path.includes(".b3dm")) {
                downloadFunction = () => {
                    fetch(path).then(result => {
                        if (!result.ok) {
                            console.error("could not load tile with path : " + path)
                            throw new Error(`couldn't load "${path}". Request failed with status ${result.status} : ${result.statusText}`);
                        }
                        result.arrayBuffer().then(buffer => B3DMDecoder.parseB3DM(buffer, self.meshCallback)).then(mesh => {
                            self.cache.put(key, mesh);
                            self.checkSize();
                            meshReceived(self.cache, self.register, key, distanceFunction, getSiblings, level, uuid);
                        });

                    });
                }
            }else if (path.includes(".json")) {
                downloadFunction = () => {
                    fetch(path).then(result => {
                        if (!result.ok) {
                            console.error("could not load tile with path : " + path)
                            throw new Error(`couldn't load "${path}". Request failed with status ${result.status} : ${result.statusText}`);
                        }
                        result.json().then(json => {
                            self.cache.put(key, json);
                            self.checkSize();
                            meshReceived(self.cache, self.register, key);
                        });
                    });
                }
            }
            scheduleDownload({
                "shouldDoDownload": () => {
                    return !!self.register[key] && Object.keys(self.register[key]).length > 0;
                },
                "doDownload": downloadFunction,
                "distanceFunction": distanceFunction,
                "getSiblings": getSiblings,
                "level": level,
                "uuid": uuid
            })
        }
    }



    invalidate(path, tileIdentifier) {
        const key = simplifyPath(path);
        delete this.register[key][tileIdentifier];
    }

    checkSize() {
        const self = this;

        let i = 0;

        while (self.cache.size() > self.maxCachedItems && i < self.cache.size()) {
            console.log(self.cache.size())
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