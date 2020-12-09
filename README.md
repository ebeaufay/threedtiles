# 3DTilesViewer
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

## Caching
Caching is automatically handled. the cache size is set to one tenth of the estimated device memory.

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
Instead of this behaviour, you can force the lowest possible LODs to be loaded for tiles around the view so that there are no gaps in the mesh when the camera moves. 

```
tileset.setLoadOutsideView(true);
```
