import _ from 'lodash';
import {Tile} from "./tile/tile";
import {OBB} from "./geometry/obb"
import * as THREE from 'three';
import {loader} from './loader/loader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Tileset } from './tileset';

  
console.log("Hello World");
var tile = new Tile();
tile.geometricError = 10;
let volume = new OBB([
  0,0,0,
  7.0,-7.0,0,
  7.0,7.0,0,
  0,0,10
]);

var scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcce0ff );
scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );
const light = new THREE.AmbientLight( 0x404040, 10 ); // soft white light
scene.add( light );

// build camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 136;

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );


// controls
var controls = new OrbitControls( camera, renderer.domElement );
//controls.maxPolarAngle = Math.PI * 0.5;
controls.minDistance = 1;
controls.maxDistance = 5000;

// handle resize
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
  requestAnimationFrame( animate );
  camera.updateMatrixWorld();
  renderer.render( scene, camera );
}
animate();

var tileset = new Tileset("http://127.0.0.1:8080/tileset.json", scene, camera, 1);

setInterval(function(){
  tileset.update();
}, 1000);
//console.log(loader("http://127.0.0.1:8080/tileset.json"));
/*loader("http://127.0.0.1:8080/tileset.json").then(function(tileset){
  var frustum = new THREE.Frustum();
  var tiles = {};
  setInterval(function(){ 
    camera.updateMatrix(); 
    camera.updateMatrixWorld();
    var projScreenMatrix = new THREE.Matrix4();

    projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    frustum.setFromProjectionMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
    tileset.getTilesInView(frustum, camera.position, 1).then(tilesInView=>{
      var contents = tilesInView.map(tile=>tile.content);
      
      tilesInView.forEach(tile=>{
        if(!tiles[tile.content]){
          tiles[tile.content] = "waiting";
          loader(tile.content).then(gltf=>{
            if(!!tiles[tile.content]){
              if(!!gltf){
                tiles[tile.content] = gltf.model;
                scene.add(gltf.model.scene);
              }
            }
          });
        }
      });

      Object.keys(tiles).forEach(key => {
        if(!contents.includes(key)){
          if(tiles[key]!="waiting"){
            scene.remove(tiles[key].scene);
          }
          delete tiles[key];
        }
      });
    });
   }, 500);
});*/


