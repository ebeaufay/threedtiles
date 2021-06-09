# 3DTilesViewer

3DTiles viewer for three.js

demo : https://ebeaufay.github.io/ThreedTilesViewer.github.io/

Currently, the library is limmited to B3DM files.

Adding a tileset to a scene is as easy as :

```
import { Tileset } from './tileset';

var tileset = new Tileset("http://127.tileset.json", scene, camera);

setInterval(function(){
  tileset.update();
}, 100);
```

## Features

- Correctly traverses tileset trees, whatever the structure.
- Handles nested tileset.json files which are loaded on the fly (a tileset.json may point to other tileset.json files as its children).
- Allows tilesets transformations. Translate, scale and rotate a tilesets in real-time.
- callback on loaded geometry to assign a custom material or use the meshes for computations.
- Optionally load low detail tiles outside of view frustum for correct shadows and basic mesh present when the camera moves quickly.

### geometric Error Multiplier
The geometric error multiplier allows you to multiply the geometric error by a factor.
```
tileset.setGeometricErrorMultiplier(1.5);
```
A lower value will result in lower detail tiles being loaded and a higher value results in higher detail tiles being loaded.
A value of 1.0 is the default.

### load tiles outside of view
By default, only the tiles that intersect the view frustum are loaded. When the camera moves, the scene will have to load the missing tiles.
Instead of this behaviour, you can force the lowest possible LODs to be loaded for tiles around the view so that there are no gaps in the mesh when the camera moves or when displaying shadows.

```
tileset.setLoadOutsideView(true);
```

### Callback
Add a callback on loaded tiles in order to set a material or do some logic on the meshes.

```
var tileset = new Tileset("https://ebeaufay.github.io/ThreedTilesViewer.github.io/momoyama/tileset.json", scene, camera, geometricErrorMultiplier, aMesh => {
        aMesh.material = new THREE.MeshPhongMaterial({ color: 0xffaaff, flatShading: true })
        aMesh.material.side = THREE.DoubleSide;
        aMesh.geometry.computeVertexNormals();
    });
```

### Transformations
Rotation, scale and translation on the entire tileset in real-time.

```
tileset.setRotation(0, 0.5, 0, true); // rotates immediately by 0.5 RAD around the Y-axis
tileset.move(1,0,0,true); // moves immediately to coordinates 1,0,0
tileset.translate(1,0,0,true); // translates immediately by 1,0,0
tileset.setScale(2,1,1); // scales immediately by 2 along the x-axis and 1 along the other axis

tileset.setRotation(1, 0, 0, false); // rotates by 1.0 RAD around the X-axis only when tileset#apply is called
tileset.apply(); // applies all rotations/scales/translations that were accumulated
```

For performance, if there are many transformations that need to be applied in one go, it's best to use a falsy "applyNow" parameter for all transformation calls
followed by a single call to tileset#apply.

## upcomming features
 - caching
 - provide access to batch and feature tables
 - support for i3dm, pnts,...

# EXTRA Mesh to 3DTiles Converter

I also have code to convert meshes to 3DTiles with no limit to the size of the dataset relative to faces or textures.
It works for all types of meshes though it tends to show gaps in photogrametry meshes between tiles (see demo).
I'm keeping the code private for now but I'll convert any dataset you have for free.
Contact: emericbeaufays@gmail.com
