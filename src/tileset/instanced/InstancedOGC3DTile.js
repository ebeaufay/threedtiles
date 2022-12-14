import * as THREE from 'three';
import {InstancedTile} from "./InstancedTile.js"

class InstancedOGC3DTile extends THREE.Object3D {

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
     *   tileLoader : InstancedTileLoader,
     *   meshCallback: function,
     *   cameraOnLoad: camera,
     *   parentTile: OGC3DTile,
     *   onLoadCallback: function,
     *   static: Boolean
     * } properties 
     */
    constructor(properties) {
        super();
        properties.master = this;
        this.geometricErrorMultiplier = properties.geometricErrorMultiplier? properties.geometricErrorMultiplier:1.0;
        this.tileset = new InstancedTile(properties);
        if (properties.static) {
            this.matrixAutoUpdate = false;
        }
    }

    update(camera, frustum){
        if(!!frustum){
            this.tileset._update(camera, frustum);
        }else{
            const frustum = new THREE.Frustum();
            frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
            this.tileset._update(camera, frustum);
        }
        
    }
    updateWithFrustum(camera, frustum){
        this.tileset._update(camera, frustum);
    }

    setGeometricErrorMultiplier(geometricErrorMultiplier) {
        this.geometricErrorMultiplier = geometricErrorMultiplier?geometricErrorMultiplier:1.0;
    }
}
export { InstancedOGC3DTile };