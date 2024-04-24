import * as THREE from 'three';
import { clamp } from "three/src/math/MathUtils";


/**
 * An occlusion culling service that helps to only refine tiles that are visible.
 * This occlusion culling has a cost but allows downloading much less data.
 * For models that have a lot of geometry that is often hidden from the camera by walls, this can greatly improve the frame-rate.
 * @class
 */
class OcclusionCullingService {

    /**
     * Creates an Occlusion Culling service to be passed to {@link OGC3DTile} Tilesets
     */
    constructor() {
        this.cullMap = [];
        this.cullMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
        this.cullMaterial.side = THREE.FrontSide;
        this.cullTarget = this._createCullTarget();
        this.cullPixels = new Uint8Array(4 * this.cullTarget.width * this.cullTarget.height);
    }

    /**
     * 
     * @param {Integer} side use THREE.FrontSide, THREE.BackSide or THREE.DoubleSide (FrontSide default)
     */
    setSide(side){
        this.cullMaterial.side = side;
    }

    _createCullTarget() {
        const target = new THREE.WebGLRenderTarget(Math.floor(window.innerWidth * 0.05), Math.floor(window.innerHeight * 0.05));
        target.texture.format = THREE.RGBAFormat;
        target.texture.colorSpace = THREE.LinearSRGBColorSpace;
        target.texture.minFilter = THREE.NearestFilter;
        target.texture.magFilter = THREE.NearestFilter;
        target.texture.generateMipmaps = false;
        target.stencilBuffer = false;
        target.depthBuffer = true;
        target.depthTexture = new THREE.DepthTexture();
        target.depthTexture.format = THREE.DepthFormat;
        target.depthTexture.type = THREE.UnsignedShortType;
        return target;
    }

    /**
     * Update function to be called on every frame in the render loop.
     * @param {THREE.scene} scene 
     * @param {THREE.Renderer} renderer 
     * @param {THREE.camera} camera 
     */
    update(scene, renderer, camera) {
        let tempRenderTarget = renderer.getRenderTarget();
        let tempOverrideMaterial = scene.overrideMaterial;

        scene.overrideMaterial = this.cullMaterial;
        renderer.setRenderTarget(this.cullTarget);
        renderer.render(scene, camera);

        scene.overrideMaterial = tempOverrideMaterial;
        renderer.setRenderTarget(tempRenderTarget);

        renderer.readRenderTargetPixels(this.cullTarget, 0, 0, this.cullTarget.width, this.cullTarget.height, this.cullPixels);
        this.cullMap = [];
        
        for (let i = 0; i < this.cullPixels.length; i += 4) {
            const c = clamp(this.cullPixels[i], 0, 255) << 16 ^ clamp(this.cullPixels[i + 1], 0, 255) << 8 ^ clamp(this.cullPixels[i + 2], 0, 255) << 0;
            this.cullMap[c] = true;
        }

    }

    /**
     * check if the given tile ID was visible in the last rendered frame.
     * @param {string|Number} id 
     * @returns true if tile is visible
     */
    hasID(id) {
        return this.cullMap[id];
    }
}
export { OcclusionCullingService };