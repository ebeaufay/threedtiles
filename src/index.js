import "regenerator-runtime/runtime.js";
import * as THREE from 'three';
import { Tileset } from './tileset';
import { Renderer } from './Renderer';

init();

function init() {
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    var container = document.getElementById('screen');
    container.style = "position: absolute; height:100%; width:100%; left: 0px; top:0px;";
    document.body.appendChild(container);
    var camera = new THREE.PerspectiveCamera(50, window.offsetWidth / window.offsetHeight, 3, 10000);
    camera.position.z = 4;


    /// Lights
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.5));

    var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(49, 500, 151);
    dirLight.target.position.set(0, 0, 0);

    scene.add(dirLight);
    scene.add(dirLight.target);
    //scene.add(new THREE.DirectionalLightHelper(dirLight, 5, "#ff0000"));

    var renderer = new Renderer(scene, container, camera);
    var tileset = new Tileset("https://ebeaufay.github.io/ThreedTilesViewer.github.io/momoyama/tileset.json", scene, renderer.camera, 0.3, aMesh => {
        //aMesh.material = new THREE.MeshPhongMaterial({ color: 0xffaaff, flatShading: true })
        aMesh.material.side = THREE.DoubleSide;
        //aMesh.material.flatShading = true;
        //aMesh.geometry.computeVertexNormals();
    });
    tileset.setLoadOutsideView(true);
    tileset.setGeometricErrorMultiplier(1.0);

    setInterval(function () {
        tileset.update();
    }, 200);

    var r = 0.0;
    /* setInterval(function () {
        r+=0.001;
        tileset.setRotation(0,r,0,true);
    }, 10); */

    animate();
    function animate() {
        renderer.render();
    }
}


