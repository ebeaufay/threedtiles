import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Tileset } from './tileset';

var scene = new THREE.Scene();
scene.background = new THREE.Color( 0x283860 );
const light = new THREE.AmbientLight( 0xeeeeee, 1 ); // soft white light
scene.add( light );

// build camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.x = 2000;
camera.position.y = 2000;
camera.position.z = 2400;

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );


// controls
var controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 1;
controls.maxDistance = 5000;
controls.target.y = 1000;
controls.update();

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

var tileset = new Tileset("aya/tileset.json", scene, camera);

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