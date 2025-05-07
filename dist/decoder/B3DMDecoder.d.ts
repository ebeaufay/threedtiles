export class B3DMDecoder {
    constructor(aGltfLoader: any);
    gltfLoader: any;
    tempMatrix: THREE.Matrix4;
    zUpToYUpMatrix: THREE.Matrix4;
    parseB3DM(arrayBuffer: any, meshCallback: any, sceneZupToYUp: any, meshZUpToYUp: any): Promise<any>;
    checkLoaderInitialized: () => Promise<any>;
    parseB3DMInstanced(arrayBuffer: any, meshCallback: any, maxCount: any, sceneZupToYUp: any, meshZupToYup: any): Promise<THREE.InstancedMesh<any, any[], THREE.InstancedMeshEventMap>>;
}
import * as THREE from 'three';
