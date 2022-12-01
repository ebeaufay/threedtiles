# T H R E E D T I L E S : http://www.jdultra.com/



The fastest 3DTiles viewer for three.js

[Photogrametry (OBJ conversion)](https://ebeaufay.github.io/ThreedTilesViewer.github.io/)

[PBR material (GlTF conversion)](https://www.jdultra.com/pbr/)

[Occlusion culling (IFC conversion)](https://www.jdultra.com/occlusion/index.html)

[Instanced Tileset (pilot a swarm of highly detailed spaceships)](https://www.jdultra.com/instanced/index.html)

Adding a tileset to a scene is as easy as :

```
import { OGC3DTile } from "./tileset/OGC3DTile";

...

const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json"
});

scene.add(ogc3DTile);
```

It's up to the user to call updates on the tileset. You might call them whenever the camera moves or at regular time intervals like here:
```
setInterval(function () {
    ogc3DTile.update(camera);
}, 20);
```

Currently, the library is limmited to B3DM files.

## Features

- Handles nested tileset.json files which are loaded on the fly (a tileset.json may point to another tileset.json file as its child).
- Allows tilesets transformations. Translate, scale and rotate a tilesets in real-time.
- callback on loaded geometry to assign a custom material or use the meshes for computations.
- Optionally load low detail tiles outside of view frustum for correct shadows and basic mesh present when the camera moves quickly.
- Share a cache between tileset instances
- Optimal tile load order
- Occlusion culling
- Instanced tilesets

### geometric Error Multiplier
The geometric error multiplier allows you to multiply the geometric error by a factor.
```
tileset.setGeometricErrorMultiplier(1.5);
```
you may also set this value at initialization:

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    geometricErrorMultiplier: 2.0
});
```
A lower value will result in lower detail tiles being loaded and a higher value results in higher detail tiles being loaded.
A value of 1.0 is the default.



### load tiles outside of view
By default, only the tiles that intersect the view frustum are loaded. When the camera moves, the scene will have to load the missing tiles and the user might see some holes in the model.
Instead of this behaviour, you can force the lowest possible LODs to be loaded for tiles outside the view so that there are no gaps in the mesh when the camera moves. This also allows displaying shadows correctly.

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
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
    onLoadCallback: tilese => {
            console.log(tileset.boundingVolume);
        }
});
```

#### Mesh callback
Add a callback on loaded tiles in order to set a material or do some logic on the meshes.

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    meshCallback: mesh => {
            mesh.material.wireframe = true;
            mesh.material.side = THREE.DoubleSide;
        }
});
```
If using a shared cache between tilesets, check out the next section.

### Cache
You may instanciate a cache through the TileLoader class and re-use it for several or all your tilesets. 
The limitation is that all the tilesets using the same cache will have the same callback.

The TileLoader constructor takes 2 arguments. The first is a callback for meshes (see above section) and the second is
the maximum number of items in the cache (default is 1000).

```
import { TileLoader } from "@jdultra/threedtiles/src/tileset/TileLoader";

const ogc3DTile = new OGC3DTile({
        url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
        tileLoader: new TileLoader(mesh => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            mesh.material.wireframe = false;
            mesh.material.side = THREE.DoubleSide;
            }, 
            2000
        ),
        meshCallback: mesh => { mesh.material.wireframe = true;} // This callback will not be used as the callback provided to the TileLoader takes priority
    });
```

### Transformations
The OGC 3DTile object is a regular three.js Object3D so it can be transformed via the standard three.js API:

```
const ogc3DTile = new OGC3DTile({
    url: "https://ebeaufay.github.io/ThreedTilesViewer.github.io/momoyama/tileset.json"
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
const occlusionCullingService = new OcclusionCullingService();
```

This service must be passed to every OGC3DTiles object like so:
```
const ogc3DTile = new OGC3DTile({
        url: "path/to/tileset.json",
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
Using InstancedTileLoader and InstancedOGC3DTile allows displaying the same Tileset at many different places with little impact on performance.
Each Tileset is independent in terms of it's position, orientation and level of detail but each tile is created as an "InstancedMesh" giving much 
higher performance when displaying the same Tileset many times.

### static tilesets and other performance tips
When you know your tileset will be static, you can specify it in the OGC3DTile object constructor parameter.
This will skip recalculating the transformation matrix of every tile each frame and give a few extra frames per second.

```
const ogc3DTile = new OGC3DTile({
        url: "path/to/tileset.json",
        static: true
    });
```

Either way, it's advised to set the autoUpdate property of the scene to false and update the matrices manually whenever you move things around.

```
scene.autoUpdate = false;
```

# Projects that use this library
https://github.com/ebeaufay/UltraGlobe allows displaying a globe with multi resolution imagery, elevation and 3DTiles.

Don't hesitate to tell me if you have a project that stems from this code. I'd love to link to it here and I'm always open to implementing extra features.
Contact: emeric.beaufays@jdultra.com


# Mesh to 3DTiles Converter

I also have code to convert meshes to 3DTiles with no limit to the size of the dataset relative to faces or textures.
It works for all types of meshes: photogrametry, BIM, colored or textured meshes with a single texture atlas or many individual textures. 
I'm keeping the code private for now but feel free to contact me about it.
Contact: emeric.beaufays@jdultra.com
