# 3DTilesViewer

3DTiles viewer for three.js

demo : https://ebeaufay.github.io/ThreedTilesViewer.github.io/

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
}, 200);
```

Currently, the library is limmited to B3DM files.

## Features

- Handles nested tileset.json files which are loaded on the fly (a tileset.json may point to another tileset.json file as its child).
- Allows tilesets transformations. Translate, scale and rotate a tilesets in real-time.
- callback on loaded geometry to assign a custom material or use the meshes for computations.
- Optionally load low detail tiles outside of view frustum for correct shadows and basic mesh present when the camera moves quickly.
- Share a cache between tileset instances
- Optimal tile load order

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
By default, only the tiles that intersect the view frustum are loaded. When the camera moves, the scene will have to load the missing tiles.
Instead of this behaviour, you can force the lowest possible LODs to be loaded for tiles around the view so that there are no gaps in the mesh when the camera moves or when displaying shadows.

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    loadOutsideView: true
});
```

### Callback
Add a callback on loaded tiles in order to set a material or do some logic on the meshes.

```
const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    meshCallback: mesh => {
            mesh.material.wireframe = true;
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
...
```

# Displaying meshes on a globe
I'm working on this project in parallel https://github.com/ebeaufay/UltraGlobe which allows displaying a globe with multi resolution imagery, elevation and 3DTiles.

# Mesh to 3DTiles Converter

I also have code to convert meshes to 3DTiles with no limit to the size of the dataset relative to faces or textures.
It works for all types of meshes: photogrametry, BIM, colored or textured meshes with a single texture atlas or many individual textures. 
I'm keeping the code private for now but I'll convert any dataset you have for free.
Contact: emericbeaufays@gmail.com
