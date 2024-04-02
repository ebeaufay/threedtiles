[![Version](https://img.shields.io/npm/v/@jdultra/threedtiles?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/@jdultra/threedtiles)
[![Downloads](https://img.shields.io/npm/dt/@jdultra/threedtiles.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/@jdultra/threedtiles)

# T H R E E D T I L E S : http://www.jdultra.com/


A faster 3DTiles viewer for three.js, now with OGC3DTiles 1.1 support

[Windows desktop viewer](https://github.com/ebeaufay/desktop-3dtiles-viewer)

[Google Map Tile API](https://www.jdultra.com/google-tiles/index.html) (experimental service with limited availability)

[Photogrametry (OBJ conversion)](https://ebeaufay.github.io/ThreedTilesViewer.github.io/)

[Point cloud vs Mesh](https://www.jdultra.com/pointmeshing/index.html)

[PBR material (GlTF conversion)](https://www.jdultra.com/pbr/)

[Occlusion culling (IFC conversion)](https://www.jdultra.com/occlusion/index.html)

[Instanced Tileset (pilot a swarm of highly detailed spaceships)](https://www.jdultra.com/instanced/index.html)

install the library and threejs if not done already:

```
npm install three @jdultra/threedtiles --legacy-peer-deps
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
    
    ogc3DTile.update(camera);
    ogc3DTile.tileLoader.update(); // important, since v10!
    
    ...

}
```

It is discouraged to call the update functions outside the render loop in a setInterval for example.
While that may work fine on desktop, mobile browsers tend to block an entire frame when a timeout triggers in it.

Here is a simple project : [Getting started](https://drive.google.com/file/d/1kJ-yfYmy8ShOMMPPXgqW2gMgGkLOIidf/view?usp=share_link)

Unzip and run :

> npm install

> npm run dev

## Mesh to 3DTiles Converter

If you need to convert meshes to 3DTiles, from small assets to gigabytes of data, contact me for a trial on UltraMesh tool.
It works for all types of meshes: photogrametry, BIM, colored or textured meshes with a single texture atlas or many individual textures.
There's support for OBJ, IFC and glTF meshes and las/laz point clouds.
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
- draco and ktx2 compression support
- point clouds (only through gltf/glb tiles)

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
    tileset.updateMatrix(); // important when static property is true
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
        ogc3DTile.updateMatrix();
        ogc3DTile.updateMatrixWorld(true);
    },1000)
```

For InstancedOGC3DTile objects, You only need to call instancedOgc3DTile#updateMatrix() and the gains will be much less significant.

```
const ogc3DTile = new InstancedOGC3DTile({
        ...
    });

    setTimeout(()=>{
        ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5);
        ogc3DTile.updateMatrix();
    },1000)
```
### Draco and Ktx2
Compressed meshes via Draco and compressed textures in Ktx2 format are supported automatically using the threejs plugins.
KTX uses an external wasm loaded at runtime so if you have trouble packaging your app correctly, check out the 
[Getting started](https://drive.google.com/file/d/1kJ-yfYmy8ShOMMPPXgqW2gMgGkLOIidf/view?usp=share_link) project for a sample webpack configuration.

### tileset update loop
Updating a single tileset via OGC3DTile#update or InstancedOGC3DTile#update is quite fast, even when the tree is deep.
For a single tileset, it's safe to call it regularly with a setInterval:
```
function startInterval() {
        interval = setIntervalAsync(function () {
            ogc3DTile.update(camera);
        }, 20);
    }
```

However, with instancedTilesets, you may have hundreds or even thousands of LOD trees that need to be updated individually. In order to preserve frame-rate,
you may want to implement something a little smarter that yields the CPU to the render loop. In the example below, the process tries to update as many tilesets as it can in under 4 ms.

```
function now() {
    return (typeof performance === 'undefined' ? Date : performance).now();
}
let updateIndex = 0;
setInterval(() => {
    let startTime = now();
    do{
        instancedTilesets[updateIndex].update(camera);
        updateIndex= (updateIndex+1)%instancedTilesets.length;
    }while(updateIndex < instancedTilesets.length && now()-startTime<4);
},50);
```

window#requestIdleCallback is also a good option but the rate of updates becomes slightly unpredictable.
