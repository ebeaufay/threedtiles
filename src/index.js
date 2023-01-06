import "regenerator-runtime/runtime.js";
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OGC3DTile } from "./tileset/OGC3DTile";
import { TileLoader } from "./tileset/TileLoader";
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { OcclusionCullingService } from "./tileset/OcclusionCullingService";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { InstancedOGC3DTile } from "./tileset/instanced/InstancedOGC3DTile.js"
import { InstancedTileLoader } from "./tileset/instanced/InstancedTileLoader.js"


const occlusionCullingService = new OcclusionCullingService();
occlusionCullingService.setSide(THREE.DoubleSide);
const scene = initScene();

const domContainer = initDomContainer("screen");
const camera = initCamera(domContainer.offsetWidth, domContainer.offsetHeight);
const stats = initStats(domContainer);
const renderer = initRenderer(camera, domContainer);
const ogc3DTiles = initTileset(scene, 4.0);

//const instancedTileLoader = createInstancedTileLoader(scene);
//initInstancedTilesets(instancedTileLoader);

const controller = initController(camera, domContainer);

const composer = initComposer(scene, camera, renderer);

animate();


function initComposer(scene, camera, renderer) {
    const renderScene = new RenderPass(scene, camera);
    //const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.5, 0);


    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    //composer.addPass(bloomPass);
    return composer;
}
function initScene() {
    const scene = new THREE.Scene();
    scene.matrixAutoUpdate = false;
    //scene.matrixWorldAutoUpdate = false;
    scene.background = new THREE.Color(0xffffff);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 1.0));

    /* const light = new THREE.PointLight(0xbbbbff, 2, 5000);
    const sphere = new THREE.SphereGeometry(2, 16, 8);
    light.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xbbbbff })));
    scene.add(light);
    light.position.set(200, 200, 200);


    const light2 = new THREE.PointLight(0xffbbbb, 2, 5000);
    const sphere2 = new THREE.SphereGeometry(2, 16, 8);
    light2.add(new THREE.Mesh(sphere2, new THREE.MeshBasicMaterial({ color: 0xffbbbb })));
    scene.add(light2);
    light2.position.set(200, 100, -100); */


    return scene;
}

function initDomContainer(divID) {

    const domContainer = document.getElementById(divID);
    domContainer.style = "position: absolute; height:100%; width:100%; left: 0px; top:0px;";
    document.body.appendChild(domContainer);
    return domContainer;
}


function initRenderer(camera, dom) {

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(dom.offsetWidth, dom.offsetHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    //renderer.toneMapping = THREE.ReinhardToneMapping;
    //renderer.toneMappingExposure = Math.pow(0.8, 4.0);
    renderer.autoClear = false;

    dom.appendChild(renderer.domElement);

    onWindowResize();
    window.addEventListener('resize', onWindowResize);
    function onWindowResize() {

        const aspect = window.innerWidth / window.innerHeight;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();

        renderer.setSize(dom.offsetWidth, dom.offsetHeight);
    }

    return renderer;
}

function initStats(dom) {
    const stats = Stats();
    document.body.appendChild(stats.dom);
    return stats;
}


function initCamera(width, height) {
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 100000);
    camera.position.set(10000,0,0);
    camera.lookAt(0,0,0);

    camera.matrixAutoUpdate = true;
    return camera;
}

function initTileset(scene, gem) {

    const tileLoader = new TileLoader(mesh => {
        //// Insert code to be called on every newly decoded mesh e.g.:
        mesh.material.wireframe = false;
        mesh.material.side = THREE.DoubleSide;
        mesh.material.metalness = 0.0
    }, 100);

    const ogc3DTile = new OGC3DTile({
        //url: "https://sampledata.luciad.com/data/ogc3dtiles/LucerneAirborneMesh/tileset.json",
        url: "https://sampleservices.luciad.com/ogc/3dtiles/marseille-mesh/tileset.json",
        //url: "https://storage.googleapis.com/ogc-3d-tiles/baltimore/tileset.json",
        //url: "https://storage.googleapis.com/ogc-3d-tiles/berlinTileset/tileset.json",
        geometricErrorMultiplier: gem,
        loadOutsideView: false,
        tileLoader: tileLoader,
        //occlusionCullingService: occlusionCullingService,
        static: false,
        centerModel:true,
        renderer: renderer,
        /* onLoadCallback: (tile)=>{
            if (!!tile.json.boundingVolume.region) {
                const halfHeight = (tile.json.boundingVolume.region[5] - tile.json.boundingVolume.region[4]) * 0.5;
                ogc3DTile.translateOnAxis(new THREE.Vector3(0, 1, 0), halfHeight);
                //ogc3DTile.updateWorldMatrix(true, true);
            }
        } */

    });
    setIntervalAsync(function () {
        ogc3DTile.update(camera);
    }, 20);

    

    //ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5) // Z-UP to Y-UP
    //ogc3DTile.translateOnAxis(new THREE.Vector3(0, 0, 1), 1)
    /* 
    ogc3DTile.translateOnAxis(new THREE.Vector3(0, 0, 1), 10) // Z-UP to Y-UP
    ogc3DTile.translateOnAxis(new THREE.Vector3(0, 1, 0), 18.5) // Z-UP to Y-UP */
    scene.add(ogc3DTile);

    return ogc3DTile;
}


function createInstancedTileLoader(scene) {
    return new InstancedTileLoader(scene, mesh => {
        //// Insert code to be called on every newly decoded mesh e.g.:
        mesh.material.wireframe = false;
        mesh.material.side = THREE.DoubleSide;
        mesh.material.metalness = 0.0;
    }, 0, 1);
}
function initInstancedTilesets(instancedTileLoader) {

    /*new GLTFLoader().load('http://localhost:8080/test.glb', function ( gltf ) {
        scene.add(gltf.scene);
    } );*/

    const instancedTilesets = [];


    const tileset = new InstancedOGC3DTile({
        //url: "https://storage.googleapis.com/ogc-3d-tiles/berlinTileset/tileset.json",
        url: "https://sampleservices.luciad.com/ogc/3dtiles/marseille-mesh/tileset.json",
        //url: "https://s3.eu-central-2.wasabisys.com/construkted-assets-eu/ab13lasdc9i/tileset.json",
        //url: "http://localhost:8081/tileset.json",
        geometricErrorMultiplier: 1.0,
        loadOutsideView: true,
        tileLoader: instancedTileLoader,
        static: false,
        centerModel:true,
        renderer: renderer
    });
    //tileset.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5) // Z-UP to Y-UP

    tileset.updateMatrix()
    scene.add(tileset);
    instancedTilesets.push(tileset);

    scene.updateMatrixWorld(true)
    function now() {
        return (typeof performance === 'undefined' ? Date : performance).now();
    }
    let updateIndex = 0;
    setInterval(() => {
        let startTime = now();
        do {
            const frustum = new THREE.Frustum();
            frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
            instancedTilesets[updateIndex].update(camera, frustum);
            updateIndex = (updateIndex + 1) % instancedTilesets.length;
        } while (updateIndex < instancedTilesets.length && now() - startTime < 4);
    }, 40);

    //initLODMultiplierSlider(instancedTilesets);
}

function initLODMultiplierSlider(instancedTilesets) {
    var slider = document.getElementById("lodMultiplier");
    var output = document.getElementById("multiplierValue");
    output.innerHTML = slider.value;

    slider.oninput = () => {
        instancedTilesets.forEach(tileset => {
            tileset.setGeometricErrorMultiplier(slider.value * 0.1)
        })
        output.innerHTML = slider.value;
    }
}

function initController(camera, dom) {
    const controller = new OrbitControls(camera, dom);

    //controller.target.set(4629210.73133627, 435359.7901640832, 4351492.357788198);
    controller.target.set(0,0,0);


    controller.minDistance = 0.1;
    controller.maxDistance = 100000;
    controller.update();
    return controller;
}


function animate() {
    requestAnimationFrame(animate);
    //instancedTileLoader.update();
    composer.render();
    //occlusionCullingService.update(scene, renderer, camera)
    stats.update();
}





