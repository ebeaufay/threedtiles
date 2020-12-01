import _ from 'lodash';
import {Tile} from "./tile/tile";
import {OBB} from "./geometry/obb"
import * as THREE from 'three';
import {loader} from './loader/loader'


  
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

// build camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 136;

camera.updateMatrix(); 
camera.updateMatrixWorld(); 

var frustum = new THREE.Frustum();
var projScreenMatrix = new THREE.Matrix4();
projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );



//console.log(loader("http://127.0.0.1:8080/tileset.json"));
loader("http://127.0.0.1:8080/tileset.json").then(function(tile){
  tile.getTilesInView(frustum, camera.position, 1).then(result=>console.log(result));
})