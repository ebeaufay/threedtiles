import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Tileset } from './tileset';

var tileset;
var scene = new THREE.Scene();
scene.background = new THREE.Color( 0x283860 );
const light = new THREE.AmbientLight( 0xeeeeee, 1 ); // soft white light
scene.add( light );

// build camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );


// controls
var controls = new OrbitControls( camera, renderer.domElement );


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

setAyaModel();

setInterval(function(){
  tileset.update();
}, 100);


/////// options
var loadOutsideFrustum = document.getElementById ("loadOutsideFrustum");
if (loadOutsideFrustum.addEventListener) {
  loadOutsideFrustum.addEventListener ("change", function(event){
    if(!!loadOutsideFrustum.checked) tileset.setLoadOutsideView(true);
    else tileset.setLoadOutsideView(false);
  }, false);
}

var geometricErrorMultiplier = document.getElementById ("GEM_range");
if (geometricErrorMultiplier.addEventListener) {
  geometricErrorMultiplier.addEventListener ("change", function(event){
    tileset.setGeometricErrorMultiplier(geometricErrorMultiplier.value / 100);
  }, false);
}

var modelDropDown = document.getElementById ("model");
if (modelDropDown.addEventListener) {
  document.addEventListener ("change", function(event){
    switch(event.target.value){
      case "Village":{
        setVillageModel();
        return;
      }
      case "Aya":{
        setAyaModel();
        return;
      }
    }
  }, false);
}

function setVillageModel(){
  if(!!tileset) tileset.deleteFromCurrentScene();
  tileset = new Tileset("https://ebeaufay.github.io/ThreedTilesViewer.github.io/frenchVillage/tileset.json", scene, camera);
  if(!!geometricErrorMultiplier) geometricErrorMultiplier.value = 100;
  if(!!loadOutsideFrustum) loadOutsideFrustum.checked = false;
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 100;
  controls.minDistance = 1;
  controls.maxDistance = 1000;
  controls.target.x = 0;
  controls.target.y = 0;
  controls.target.z = -25;
  controls.update();
}

function setAyaModel(){
  if(!!tileset) tileset.deleteFromCurrentScene();
  tileset = new Tileset("https://ebeaufay.github.io/ThreedTilesViewer.github.io/aya/tileset.json", scene, camera);
  if(!!geometricErrorMultiplier) geometricErrorMultiplier.value = 100;
  if(!!loadOutsideFrustum) loadOutsideFrustum.checked = false;
  camera.position.x = 2000;
  camera.position.y = 2000;
  camera.position.z = 2400;
  controls.minDistance = 1;
  controls.maxDistance = 5000;
  controls.target.x = 0;
  controls.target.y = 1000;
  controls.target.z = 0;
  controls.update();
}