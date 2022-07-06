import * as THREE from 'three';
import { clamp } from "three/src/math/MathUtils";



class OcclusionCullingService {

    /**
     * 
     * @param {
     *   json: optional,
     *   url: optional,
     *   rootPath: optional,
     *   parentGeometricError: optional,
     *   parentBoundingVolume: optional,
     *   parentRefinement: optional,
     *   geometricErrorMultiplier: Double,
     *   loadOutsideView: Boolean,
     *   tileLoader : TileLoader,
     *   meshCallback: function,
     *   cameraOnLoad: camera,
     *   parentTile: OGC3DTile,
     *   onLoadCallback: function,
     *   occlusionCullingService: OcclusionCullingService
     * } properties 
     */
    constructor() {
        this.cullMap = [];
        this.cullMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
        this.cullMaterial.side = THREE.DoubleSide;
        this.cullTarget = this.createCullTarget();
        this.cullPixels = new Uint8Array(4 * this.cullTarget.width * this.cullTarget.height);
    }

    setSide(side){
        this.cullMaterial.side = side;
    }

    createCullTarget() {
        const target = new THREE.WebGLRenderTarget(Math.floor(window.innerWidth * 0.05), Math.floor(window.innerHeight * 0.05));
        target.texture.format = THREE.RGBAFormat;
        target.texture.encoding = THREE.LinearEncoding;
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

    hasID(id) {
        return this.cullMap[id];
    }
}
export { OcclusionCullingService };