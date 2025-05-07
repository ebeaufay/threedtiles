export function splatsVertexShader(): string;
export function splatsFragmentShader(): string;
export class SplatsMesh extends Mesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap> {
    constructor(renderer: any, isStatic: any, fragShader: any);
    numBatches: number;
    numVisibleBatches: number;
    orderAttribute: InstancedBufferAttribute;
    textureSize: number;
    numTextures: number;
    batchSize: number;
    maxSplats: number;
    numSplatsRendered: number;
    colorRenderTarget: WebGL3DRenderTarget;
    positionRenderTarget: WebGL3DRenderTarget;
    cov1RenderTarget: WebGL3DRenderTarget;
    cov2RenderTarget: WebGL3DRenderTarget;
    renderer: any;
    sortID: number;
    freeAddresses: MinPriorityQueue<any, any>;
    worker: any;
    sortListeners: any[];
    cameraPosition: Vector3;
    copyMaterial2D: ShaderMaterial;
    copyMaterial3D: ShaderMaterial;
    copyCamera: OrthographicCamera;
    copyScene: Scene;
    copyQuad: Mesh<PlaneGeometry, ShaderMaterial, import("three").Object3DEventMap>;
    dispose(): void;
    copyTex2D(src: any, dst: any, scissorBox: any, layer: any): void;
    copyTex3D(src: any, dst: any, numLayers: any): void;
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
    sort(cameraPosition: any): void;
    raycast(raycaster: any, intersects: any): void;
    addSplatsTile(positions: any, colors: any, cov1: any, cov2: any): {
        hide: () => void;
        show: (callback: any) => void;
        remove: () => void;
        sort: (cameraPosition: any) => void;
        raycast: () => void;
        isSplatsBatch: boolean;
    } | undefined;
    addSplatsBatch(positionsStartIndex: any, address: any, positions: any, colors: any, cov1: any, cov2: any): void;
    growTextures(): void;
}
import { Mesh } from "three";
import { InstancedBufferAttribute } from "three";
import { WebGL3DRenderTarget } from "three";
import { MinPriorityQueue } from 'data-structure-typed';
import { Vector3 } from "three";
import { ShaderMaterial } from "three";
import { OrthographicCamera } from "three";
import { Scene } from "three";
import { PlaneGeometry } from "three";
