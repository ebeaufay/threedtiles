export class MeshTile {
    constructor(scene: any);
    scene: any;
    instancedTiles: any[];
    reuseableMatrix: THREE.Matrix4;
    addInstance(instancedTile: any): void;
    addToScene(): void;
    setObject(instancedMesh: any): void;
    instancedMesh: any;
    update(): void;
    getCount(): number;
    dispose(): boolean;
}
import * as THREE from 'three';
