import * as THREE from 'three';
import {InstancedTile} from "./InstancedTile.js"

/**
 * Similarly to {@link OGC3DTile}, this class that extends THREE.Object3D loads a tiled and multileveled OGC3DTiles 1.0 or 1.1 dataset.
 * The difference is that tiles are instanced. This is useful when one wants to load the same tileset hundreds or even thousands of times.
 * Imagine rendering hundreds of very high detail cars driving in a city.
 * Each tile content is instanced but each {@link InstancedOGC3DTile} object also has it's own LOD tree making this scenario very efficient.
 * @class
 */
class InstancedOGC3DTile extends THREE.Object3D {

    /**
     * 
     * @param {Object} [properties] - the properties for this tileset
     * @param {Object} [properties.url] - the url to the parent tileset.json
     * @param {Object} [properties.pathParams] - optional, path params to add to individual tile urls (starts with "?").
     * @param {Object} [properties.geometricErrorMultiplier] - the geometric error of the parent. 1.0 by default corresponds to a maxScreenSpaceError of 16
     * @param {Object} [properties.loadOutsideView] - if truthy, tiles otside the camera frustum will be loaded with the least possible amount of detail
     * @param {Object} [properties.tileLoader] - A tile loader that can be shared among tilesets in order to share a common cache.
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
     * @param {Number} [properties.domWidth = 1000] - optional the canvas width (used to calculate geometric error). If a renderer is provided, it'll be used instead, else a default value is used.  
     * @param {Number} [properties.domHeight = 1000] - optional the canvas height (used to calculate geometric error). If a renderer is provided, it'll be used instead, else a default value is used.  
     * @param {Object} [properties.renderer = undefined] - optional the renderer is used to infer the canvas size and compute tiles geometric error.
     */
    constructor(properties) {
        super();
        properties.master = this;
        
        if(!!properties.domWidth && !!properties.domHeight){
            this.rendererSize = new THREE.Vector2(properties.domWidth, properties.domHeight);
        }else{
            this.rendererSize = new THREE.Vector2(1000, 1000);
        }
        this.renderer = properties.renderer;

        this.geometricErrorMultiplier = properties.geometricErrorMultiplier? properties.geometricErrorMultiplier:1.0;
        this.tileset = new InstancedTile(properties);
        if (properties.static) {
            this.matrixAutoUpdate = false;
        }
        this.tileLoader = properties.tileLoader;
    }

    _renderSize(size){
        if(!!this.renderer){
            this.renderer.getDrawingBufferSize(size);
        }else{
            size.copy(this.rendererSize);
        }
        
    }

    /**
     * Call this to specify the canvas width/height when it changes (used to compute tiles geometric error that controls tile refinement).
     * It's unnecessary to call this when the {@link OGC3DTile} is instantiated with the renderer.
     * 
     * @param {Number} width 
     * @param {Number} height 
     */
     setCanvasSize(width, height){
        this.rendererSize.set(width, height);
    }
    /**
     * To be called in the render loop.
     * @param {Three.Camera} camera a camera that the tileset will be rendered with.
     */
    update(camera, frustum){
        if(!!frustum){
            this.tileset._update(camera, frustum);
        }else{
            const frustum = new THREE.Frustum();
            frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
            this.tileset._update(camera, frustum);
        }
        
    }
    
    /** 
     * Set the Geometric Error Multiplier for the tileset.
     * the {@param geometricErrorMultiplier} can be a number between 1 and infinity.
     * A {@param geometricErrorMultiplier} of 1 (default) corresponds to a max ScreenSpace error (MSE) of 16.  
     * A lower {@param geometricErrorMultiplier} loads less detail (higher MSE) and a higher {@param geometricErrorMultiplier} loads more detail (lower MSE)
     * 
     * @param {Number} geometricErrorMultiplier set the LOD multiplier for the entire tileset
     */
    setGeometricErrorMultiplier(geometricErrorMultiplier) {
        this.geometricErrorMultiplier = geometricErrorMultiplier?geometricErrorMultiplier:1.0;
    }
}
export { InstancedOGC3DTile };