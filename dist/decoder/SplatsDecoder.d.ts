export class SplatsDecoder {
    constructor(gltfLoader: any, renderer: any);
    renderer: any;
    gltfLoader: any;
    parseSplats(arrayBuffer: any, sceneZupToYUp: any, meshZUpToYUp: any, splatsMesh: any): Promise<any>;
    checkLoaderInitialized: () => Promise<any>;
}
