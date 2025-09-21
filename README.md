[![Version](https://img.shields.io/npm/v/@jdultra/threedtiles?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/@jdultra/threedtiles)
[![Downloads](https://img.shields.io/npm/dt/@jdultra/threedtiles.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/@jdultra/threedtiles)

# T H R E E D T I L E S : http://www.jdultra.com/


A faster 3DTiles viewer for three.js, now with OGC3DTiles 1.1 support. 

Oh, also it supports gaussian splats! ( currently via KHR_gaussian_splatting_compression_spz )

[contextsplat.xyz](https://contextsplat.xyz) is a web tool that let's you convert 3dgs to OGC3DTILES directly in the browser, view them in a geospatial context and download them or a starter three.js app.

## sample getting started projects
Getting started vanilla js:    
[app](https://www.jdultra.com/threedtiles/demos/gettingStarted)    
[code](https://www.jdultra.com/threedtiles/demos/gettingStarted/threedtiles-gettingStarted.zip)

GettingStarted RTF:    
[app](https://www.jdultra.com/threedtiles/demos/gettingStartedRTF)    
[code](https://www.jdultra.com/threedtiles/demos/gettingStartedRTF/threedtiles-gettingStarted-rtf.zip)    

## Demos temporarily down because of digital vandalism

[Google Tiles overlay](https://www.jdultra.com/overlay/index.html)
overlay high quality meshes over google tiles with some shader magic to avoid overlap

[Windows desktop viewer](https://github.com/ebeaufay/desktop-3dtiles-viewer)
A viewer for windows based on flutter and this library

[Google Map Tile API](https://www.jdultra.com/google-tiles/index.html) 
google tiles in a geospatial framework [ULTRAGLOBE](https://github.com/ebeaufay/UltraGlobe)

[Photogrametry](https://ebeaufay.github.io/ThreedTilesViewer.github.io/)
Some tiles converted from OBJ via proprietary ULTRAMESH tool

[Point cloud vs Mesh](https://www.jdultra.com/pointmeshing/index.html)

[PBR material (GlTF conversion)](https://www.jdultra.com/pbr/)

[Occlusion culling (IFC conversion)](https://www.jdultra.com/occlusion/index.html)
Occlusion culling applied at the tile-loading level. This isn't just GPU occlusion culling, hidden tiles aren't even downloaded.

[Instanced Tileset](https://www.jdultra.com/instanced/index.html)
A multitude of identical meshes, each with its own LOD hiearchy but duplicate tiles are instanced

## Getting started

### DOC
[JSDOC](https://www.jdultra.com/threedtiles/docs/)

install the library:

```
npm install three @jdultra/threedtiles
```

Adding a tileset to a scene is as easy as :

```
import { OGC3DTile } from '@jdultra/threedtiles';

...

const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer
});

scene.add(ogc3DTile);
```

It's up to the user to call updates on the tileset. 
```
function animate() {
    requestAnimationFrame(animate);
    
    ogc3DTile.update(camera); // computes what tiles need to be refined and what tiles can be disposed.
    ogc3DTile.tileLoader.update(); // downloads, loads and caches tiles in optimal order.
    
    ...

}
```

It is discouraged to call the update functions outside the render loop in a setInterval for example.
While that may work fine on desktop, mobile browsers tend to block an entire frame when a timeout triggers in it.


## Mesh, Point-cloud and 3DGS to 3DTiles Converter

If you need to convert meshes to 3DTiles, from small assets to gigabytes of data, contact me for a trial on UltraMesh tool.
It works for all types of meshes: photogrametry, BIM, colored or textured meshes with a single texture atlas or many individual textures.
There's support for OBJ, IFC, Collada and glTF meshes and las/laz point clouds.
I aim for optimal quality in terms of mesh, texture and tileset structure and for optimal streaming speed, with no limit to the size of the input data.
Contact: emeric.beaufays@jdultra.com


## Features

- Handles nested tileset.json files which are loaded on the fly (a tileset.json may point to another tileset.json file as its child).
- Allows tilesets transformations. Translate, scale and rotate a tilesets in real-time.
- callback on loaded geometry to assign a custom material or use the meshes for computations.
- Optionally load low detail tiles outside of view frustum for correct shadows and basic mesh present when the camera moves quickly.
- Share a cache between tileset instances
- Optimal tile load order
- Occlusion culling
- Instanced tilesets
- Center tileset and re-orient geolocated data
- quantization, draco, mshopt and ktx2 compression support
- point clouds (only through gltf/glb tiles)
- loading strategy options ("incremental" or "immediate")
- Gaussian splats (unofficial gltf extension for now)


OGC3DTiles 1.1 are supported.
There is no plan to support .pnts, .i3dm or .cmpt  tiles as these formats are deprecated in favor of glb/gltf tiles.

### geometric Error Multiplier
The geometric error multiplier allows you to multiply the geometric error by a factor.
```
tileset.setGeometricErrorMultiplier(1.5);
```
you may also set this value at initialization:

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    geometricErrorMultiplier: 2.0
});
```
A lower value will result in lower detail tiles being loaded and a higher value results in higher detail tiles being loaded.
A value of 1.0 is the default.

#### geometricErrorMultiplier vs maxScreenSpaceError
Many viewers use the maxScreenSpaceError instead of a geometric error multiplier and there is a direct correspondance.
A geometricErrorMultiplier of 1 corresponds to a maxScreenSpaceError of 16.
A geometricErrorMultiplier of 0.5 corresponds to a maxScreenSpaceError of 32.

#### distance bias
The distance bias allows loading more or less detail close to the camera relative to further away.
The distance bias simply applies an exponent on tile distance to the camera so you have to balance it out manually with the geometricErrorMultiplier.

For example, if you want to load more detail close to the camera, you might do something like this:
```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    geometricErrorMultiplier: 10.0,
    distanceBias: 1.5
});
```
In this case the higher distance bias will cause less detail to be loaded overall since all calculated distances get raised to the power 1.5.
To compensate, the geometricErrorMultiplier is set at a higher value.

These values need to be adjusted manually based on what is considered relatively close or far from the camera and truly depends on your scene and the relative distance of the camera to the tiles during normal navigation. In other words, it's impossible to have magic bullet values the LOD switch distance can be fine-tuned through those parameters.

You can change the distance bias for a tileset at any time:

```
tileset.setDistanceBias(1.5);
```
### loading strategy

#### Incremental
Incremental loading is the default and loads all intermediate levels incrementally and keeps them in memory. While this gives a direct feedback on loading progress, the CPU memory footprint is large and overall loading speed is slower than with "immediate" mode.

To explicitely set the incremental loading strategy:
```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    loadingStrategy: "INTERMEDIATE"
});
```

#### Immediate

Immediate loading skips intermediate LODs and immediately loads the ideal LOD. Less data is downloaded (faster load time) and less data is kept in CPU memory but holes will appear until the tiles are loaded.

To set the immediate loading strategy:
```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    loadingStrategy: "IMMEDIATE"
});
```

#### PERLEVEL

PERLEVEL loading loads all required tiles of a given level before moving to the higher level of detail tiles.

To set the PERLEVEL loading strategy:
```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    loadingStrategy: "PERLEVEL"
});
```

### load tiles outside of view
By default, only the tiles that intersect the view frustum are loaded. When the camera moves, the scene will have to load the missing tiles and the user might see some holes in the model.
Instead of this behaviour, you can force the lowest possible LODs to be loaded for tiles outside the view so that there are no gaps in the mesh when the camera moves. This also allows displaying shadows from parts of the scene that are not in the view.

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    loadOutsideView: true
});
```
### draw bounding volume

Draw bounding volumes around visible tiles
```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    drawBoundingVolume: true
});
```

### Google Maps 3D Tiles
Google maps 3DTiles can be loaded similarly.
The API key mechanism requires that a token be passed as a query param to all fetched tiles.

```
const ogc3DTile = new OGC3DTile({
    url: "https://tile.googleapis.com/v1/3dtiles/root.json",
    queryParams: { key: "Insert your own google maps API key here" },
    yUp: false, // this value is normally true by default
    renderer: renderer,
    loadOutsideView: true
});
```

#### Copyright info

This is mostly specific to google tiles but may be used by other vendors.

Google requires that, copyright info for producers of the 3D data be displayed.
A global function #getOGC3DTilesCopyrightInfo returns the list of vendors that need to be displayed.

```
import { OGC3DTile, getOGC3DTilesCopyrightInfo } from "@jdultra/threedtiles';

...

animate(){
    requestAnimationFrame( animate );
    googleTiles.update(camera);
    tileLoader.update();
    ...
    console.log(getOGC3DTilesCopyrightInfo());
}

```

### Callback

#### onLoadCallback
Add a callback that is called once when the first tile is loaded and geometry is available.
This can be useful to position the tileset at a specific location when it is not centered on origin for example.

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    onLoadCallback: tileset => {
            console.log(tileset.json.boundingVolume);
        }
});
```
Note that the callback is called with the OGC3DTile object as parameter and that this object has a "json" property giving you access to the original tileset.json with it's transform, geometric error, bounding volume, etc...

#### Mesh callback
Add a callback on loaded tiles in order to set a material or do some logic on the meshes.

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    meshCallback: mesh => {
            mesh.material.wireframe = true;
            mesh.material.side = THREE.DoubleSide;
        }
});
```

#### Update

Calling OGC3DTile#update gives a direct feedback on the state of the tileset:
```
function animate() {
    requestAnimationFrame(animate);
    
    ogc3DTile.update(camera); // computes what tiles need to be refined and what tiles can be disposed.
    const state = ogc3DTile.tileLoader.update(); // downloads, loads and caches tiles in optimal order.
}
```

In the example above, the "state" object may look like this:

```
{
    numTilesLoaded: 82, 
    numTilesRendered: 82, 
    maxLOD: 9, 
    percentageLoaded: 1
}
```

- "numTilesLoaded" gives the number of tiles in the tileset that are loaded and should be visible (including intermediate LODs for the "incremental" loading strategy).
- "numTilesRendered gives the number of tiles currently rendered.
- "maxLOD" highest LOD currently rendered
- "percentageLoaded" property gives an indication of the loading progress. Note that the loading progress may go back and forth a bit while the tree is being expanded but a value of 1 means the tileset is loaded.



#### Points callback
Add a callback on loaded point tiles in order to set a material or do some logic on the points.

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    pointsCallback: points => {
            points.material.size = 0.1;
            points.material.sizeAttenuation = true;
        }
});
```
If using a shared cache between tilesets, check out the next section.

### Cache and TileLoader
The Tile loader handles the loading strategy, managing a cache and the order for tile downloads and loads.

You may re-use the Tile loader for several or all your tilesets. 
The limitation is that all the tilesets using the same TileLoader will have the same mesh/points callback.

The TileLoader takes an optional object as argument:
@param {Object} [options] - Optional configuration object.
@param {number} [options.maxCachedItems=100] - the cache size.
@param {function} [options.meshCallback] - A callback to call on newly decoded meshes.
@param {function} [options.pointsCallback] - A callback to call on newly decoded points.
@param {renderer} [options.renderer] - The renderer, this is required for KTX2 support.

```
import { TileLoader } from '@jdultra/threedtiles';

const tileLoader = new TileLoader({
        renderer: renderer,
        maxCachedItems: 100,
        meshCallback: (mesh, geometricError) => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            mesh.material.wireframe = false;
            mesh.material.side = THREE.DoubleSide;
            //mesh.material.metalness = 0.0
        },
        pointsCallback: (points, geometricError) => {
            points.material.size = Math.min(1.0, 0.5 * Math.sqrt(geometricError));
            points.material.sizeAttenuation = true;
        }
    });
const ogc3DTile1 = new OGC3DTile({
        url: "...",
        renderer: renderer,
        tileLoader: tileLoader,
        meshCallback: mesh => { mesh.material.wireframe = true;} // This callback will not be used as the callback provided to the TileLoader takes priority
    });

const ogc3DTile2 = new OGC3DTile({
        url: "...",
        renderer: renderer,
        tileLoader: tileLoader
    });    
```

If you use the same tile loader for several tilesets, you can call update on it just once per frame:

```
function animate() {
    requestAnimationFrame(animate);
    
    ogc3DTile1.update(camera);
    ogc3DTile2.update(camera);
    tileLoader.update(); // important! since v10
    
    ...

}
```

### Transformations
The OGC 3DTile object is a regular three.js Object3D so it can be transformed via the standard three.js API:

```
const ogc3DTile = new OGC3DTile({
    url: "https://ebeaufay.github.io/ThreedTilesViewer.github.io/momoyama/tileset.json"
    renderer: renderer,
});

ogc3DTile.translateOnAxis(new THREE.Vector3(0,1,0), -450);
ogc3DTile.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI*0.5);
```


### Occlusion culling
Occlusion culling prevents the refinment of data that is hidden by other data, like a wall. It can have a big impact on frame-rate and loading speed for interior scenes.

A word of warning: activating occlusion culling has an impact on frame-rate. 
It will be most beneficial on interior scenes where most of the data is occluded by walls. All the tiles that don't need to be downloaded or drawn will balance out the cost of the occlusion logic.


First, instantiate an OcclusionCullingService:
```
import { OcclusionCullingService } from '@jdultra/threedtiles';

const occlusionCullingService = new OcclusionCullingService();
```

This service must be passed to every OGC3DTiles object like so:
```
const ogc3DTile = new OGC3DTile({
        url: "path/to/tileset.json",
        renderer: renderer,
        occlusionCullingService: occlusionCullingService
    });
```

Then, you must update the occlusionCullingService within your render loop:
```
function animate() {
    ogc3DTile.update(camera);
    ogc3DTile.tileLoader.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    occlusionCullingService.update(scene, renderer, camera)
}
```

Finally, if you are drawing the back-side of faces or both-sides (see Callback section), you'll need to specify it for the occlusion pass too. By default, THREE.FrontSide is used:

```
const occlusionCullingService = new OcclusionCullingService();
occlusionCullingService.setSide(THREE.DoubleSide);
```

### Instanced Tilesets

<p align="center">
  <img src="https://storage.googleapis.com/jdultra-website/assets/instancedPic.png" width="800" style="display: block; margin: 0 auto"/>
</p>

Using InstancedTileLoader and InstancedOGC3DTile allows displaying the same Tileset at many different places with little impact on performance.
Each Tileset is independent in terms of it's position, orientation and level of detail but each tile is created as an "InstancedMesh" giving much 
higher performance when displaying the same Tileset many times.

```
import { InstancedOGC3DTile, InstancedTileLoader } from '@jdultra/threedtiles';

// First create the InstancedTileLoader that will manage caching
const instancedTileLoader = new InstancedTileLoader(
    scene, 
    {
        renderer: renderer,
        maxCachedItems : 100,
        maxInstances : 1,
        meshCallback: mesh => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            mesh.material.wireframe = false;
            mesh.material.side = THREE.DoubleSide;
        },
        pointsCallback: points => {
            points.material.size = Math.min(1.0, 0.5 * Math.sqrt(points.geometricError));
            points.material.sizeAttenuation = true;
        }
    }
);

// then create some tilesets
const instancedTilesets = [];
for (let i = 0; i < 100; i++) {
    const tileset = new InstancedOGC3DTile({
        url: "https://storage.googleapis.com/ogc-3d-tiles/droneship/tileset.json",
        renderer: renderer,
        geometricErrorMultiplier: 1.0,
        loadOutsideView: false,
        tileLoader: instancedTileLoader,
        static: true // when static is set to true, you must call InstancedOGC3DTile#updateMatrix manually
    });
    
    tileset.translateOnAxis(new THREE.Vector3(1, 0, 0), 50 * i);
    tileset.updateMatrices(); // important when static property is true (different from the Object3D#updateMatrix API)
    scene.add(tileset);
    instancedTilesets.push(tileset);
}

//setup an update loop for the LODs
setInterval(() => {
    instancedTilesets[updateIndex].update(camera);
    updateIndex= (updateIndex+1)%instancedTilesets.length;
},50);

//in the animate function, you also need to update the instancedTileLoader
function animate() {
    requestAnimationFrame(animate);
    instancedTileLoader.update();
    
    ... // rest of render loop
}
animate();

```
### Center tileset and re-orient geolocated data

OGC3DTiles data is not necessarily centered on the origin and when it's georeferenced, it's also rotated relative to the cartesian coordinate system.
The optional property "centerModel" will center the model on the origin. In the case of georeferenced models, identified as those using the "region" bounding volume, it will also rotate it so that it's up-axis alligns with the y axis.

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    centerModel:true
});
```
This property is also available for instanced models.

### Performance tips

#### static tilesets
When you know your tileset will be static or move rarely, you can specify it in the OGC3DTile object constructor parameter.
This will skip recalculating the transformation matrix of every tile each frame and give a few extra frames per second.

However, you'll need to manually call #updateMatrix and #updateMatrixWorld on the OGC3DTile object whenever you apply a transformation.

```
const ogc3DTile = new OGC3DTile({
        url: "path/to/tileset.json",
        renderer: renderer,
        static: true
    });

    setTimeout(()=>{

        ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5);
        ogc3DTile.updateMatrices(); // different from the Object3D#updateMatrix API
    },1000)
```

For InstancedOGC3DTile objects, You need to call instancedOgc3DTile#updateMatrix() and the gains will be much less significant.

```
const ogc3DTile = new InstancedOGC3DTile({
        ...
    });

    setTimeout(()=>{
        ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5);
        ogc3DTile.updateMatrix();
    },1000)
```
### Meshopt, Draco and Ktx2
Compressed meshes via Draco and compressed textures in Ktx2 format are supported automatically using the threejs plugins by passing the renderer at initialization.
The ktx and draco loader can also be passed manually.

The Meshopt decoder doesn't need to be specified, it'll be loaded automatically.

#### when using a tileLoader (recommended):

```
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('node_modules/three/examples/jsm/libs/draco/');

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('node_modules/three/examples/jsm/libs/basis/').detectSupport(renderer);

const tileLoader = new TileLoader({
        ktx2Loader: ktx2Loader,
        dracoLoader: dracoLoader,
        maxCachedItems: 100,
        ...
    });
const ogc3DTile = new OGC3DTile({
        url: "...",
        tileLoader: tileLoader,
        ...
    });
```

#### when using a tileLoader fallback to web wasms loaded through http:

```

const tileLoader = new TileLoader({
        renderer: renderer
        maxCachedItems: 100,
        ...
    });
const ogc3DTile = new OGC3DTile({
        url: "...",
        tileLoader: tileLoader,
        ...
    });
```

#### when not using a TileLoader:

```
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('node_modules/three/examples/jsm/libs/draco/');

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('node_modules/three/examples/jsm/libs/basis/').detectSupport(renderer);

const ogc3DTile = new OGC3DTile({
        url: "...",
        ktx2Loader: ktx2Loader,
        dracoLoader: dracoLoader,
        ...
    });
```

#### when not using a TileLoader and using fallback wasms loaded from web:

```
const ogc3DTile = new OGC3DTile({
        url: "...",
        renderer: renderer,
        ...
    });
```

### tileset update loop
Updating a single tileset via OGC3DTile#update or InstancedOGC3DTile#update is quite fast, even when the tree is deep.
For a single tileset, it's safe to call it on every frame:
```
function animate() {
    requestAnimationFrame(animate);
    ogc3DTile.update(camera);
    ogc3DTile.tileLoader.update();
    
    ... // rest of render loop
}
animate();
```

However, if you have several OGC3DTiles loaded or when you use instancedTilesets, you may have hundreds or even thousands of LOD trees that need to be updated individually. In order to preserve frame-rate,
you'll want to avoid updating every single tileset on every frame.

#### Mobile performance 
just a note because this is valid for any heavy webgl app. mobiles throttle automatically when it deems the app heavy.
if you control frame-rate manually by only doing updates and renders at 30fps, mobile apps will run more smoothly because the automatic throttling, which is very un-smooth, doesn't kick in as much.
