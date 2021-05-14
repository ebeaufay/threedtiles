# 3DTilesViewer

contact me at : emericbeaufays@gmail.com

3DTiles viewer for three.js

demo : https://ebeaufay.github.io/ThreedTilesViewer.github.io/

Currently, the library is limmited to B3DM files.

Adding a tileset to a scene is as easy as :

```
import { Tileset } from './tileset';

...

var tileset = new Tileset("http://127.0.0.1:8080/tileset.json", scene, camera);

setInterval(function(){
  tileset.update();
}, 100);
```
##Features

- Correctly traverses tileset trees, whatever the structure.
- Handles nested tileset.json files which are loaded on the fly (a tileset.json may point to other tileset.json files as its children).
- Allows tilesets transformations. Translate, scale and rotate a tilesets in real-time.
- callback on loaded geometry to assign a custom material or use the meshes for computations.
- Optionally load low detail tiles outside of view frustum for correct shadows and basic mesh present when the camera moves quickly.

## Caching
Caching of B3DMs is not implemented yet. The current code relies on simple browser caching.

## Options

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

## upcomming features
 - provide access to batch and feature tables
 - support for i3dm, pnts,...

# EXTRA Mesh to 3DTiles Converter

I also have code to convert meshes to 3DTiles with no limit to the size of the dataset relative to faces or textures.
For more info, don't hesitate to contact me at emericbeaufays@gmail.com
