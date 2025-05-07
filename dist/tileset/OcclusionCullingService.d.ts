/**
 * An occlusion culling service that helps to only refine tiles that are visible.
 * This occlusion culling has a cost but allows downloading much less data.
 * For models that have a lot of geometry that is often hidden from the camera by walls, this can improve the frame-rate.
 * @class
 */
export class OcclusionCullingService {
    cullMap: any[];
    cullMaterial: THREE.MeshBasicMaterial;
    cullTarget: THREE.WebGLRenderTarget<THREE.Texture>;
    cullPixels: Uint8Array<ArrayBuffer>;
    /**
     *
     * @param {Integer} side use THREE.FrontSide, THREE.BackSide or THREE.DoubleSide (FrontSide default)
     */
    setSide(side: Integer): void;
    _createCullTarget(): THREE.WebGLRenderTarget<THREE.Texture>;
    /**
     * Update function to be called on every frame in the render loop.
     * @param {THREE.scene} scene
     * @param {THREE.Renderer} renderer
     * @param {THREE.camera} camera
     */
    update(scene: THREE.scene, renderer: THREE.Renderer, camera: THREE.camera): void;
    /**
     * check if the given tile ID was visible in the last rendered frame.
     * @param {string|Number} id
     * @returns true if tile is visible
     */
    hasID(id: string | number): any;
}
import * as THREE from 'three';
