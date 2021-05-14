import * as THREE from 'three';
import { Tileset } from './tileset';
import { Renderer } from './Renderer';
import { Water } from 'three/examples/jsm/objects/Water2.js';


init();


function init() {
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);




    var container = document.getElementById('screen');
    container.style = "position: absolute; height:100%; width:100%; left: 0px; top:0px;";
    document.body.appendChild(container);
    var camera = new THREE.PerspectiveCamera(50, window.offsetWidth / window.offsetHeight, 3, 10000);
    camera.position.z = 4;

    // //water

    // const waterGeometry = new THREE.PlaneGeometry(4000, 2000);

    // var water = new Water(waterGeometry, {

    //     color: "#aaaaff",
    //     scale: 50,
    //     flowDirection: new THREE.Vector2(0.05,0.2),
    //     textureWidth: 1024,
    //     textureHeight: 1024
    // });

    // water.position.y = 14;
    // water.rotation.x = Math.PI * - 0.5;
    // scene.add(water);

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

    setInterval(function () {
        tileset.update();
    }, 200);

    var r = 0.0;
    setInterval(function () {
        r+=0.001;
        tileset.setRotation(0,r,0,true);
    }, 10);

    animate();
    function animate() {
        renderer.render();
    }
}


