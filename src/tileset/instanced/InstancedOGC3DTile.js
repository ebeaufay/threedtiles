import * as THREE from 'three';
import {InstancedTile} from "./InstancedTile.js"

class InstancedOGC3DTile extends THREE.Object3D {

    /**
     * 
     * @param {Object} [properties] - the properties for this tileset
     * @param {Object} [properties.renderer] - the renderer used to display the tileset
     * @param {Object} [properties.url] - the url to the parent tileset.json
     * @param {Object} [properties.pathParams] - optional, path params to add to individual tile urls (starts with "?").
     * @param {Object} [properties.geometricErrorMultiplier] - the geometric error of the parent. 1.0 by default corresponds to a maxScreenSpaceError of 16
     * @param {Object} [properties.loadOutsideView] - if truthy, tiles otside the camera frustum will be loaded with the least possible amount of detail
     * @param {Object} [properties.tileLoader] - A tile loader that can be shared among tilesets in order to share a common cache.
     * @param {Object} [properties.meshCallback] - A callback function that will be called on every mesh
     * @param {Object} [properties.pointsCallback] - A callback function that will be called on every points
     * @param {Object} [properties.onLoadCallback] - A callback function that will be called when the root tile has been loaded
     * @param {Object} [properties.occlusionCullingService] - A service that handles occlusion culling
     * @param {Object} [properties.centerModel] - If true, the tileset will be centered on 0,0,0 and in the case of georeferenced tilesets that use the "region" bounding volume, it will also be rotated so that the up axis matched the world y axis.
     * @param {Object} [properties.static] - If true, the tileset is considered static which improves performance but the tileset cannot be moved
     * @param {Object} [properties.rootPath] - optional the root path for fetching children
     * @param {Object} [properties.json] - optional json object representing the tileset sub-tree
     * @param {Object} [properties.parentGeometricError] - optional geometric error of the parent
     * @param {Object} [properties.parentBoundingVolume] - optional bounding volume of the parent
     * @param {Object} [properties.parentRefinement] - optional refinement strategy of the parent of the parent
     * @param {Object} [properties.cameraOnLoad] - optional the camera used when loading this particular sub-tile
     * @param {Object} [properties.parentTile] - optional the OGC3DTile object that loaded this tile as a child
     */
    constructor(properties) {
        super();
        properties.master = this;
        this.renderer = properties.renderer;
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