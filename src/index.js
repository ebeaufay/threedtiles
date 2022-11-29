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

import { InstancedOGC3DTile} from "./tileset/instanced/InstancedOGC3DTile.js"
import { InstancedTileLoader} from "./tileset/instanced/InstancedTileLoader.js"

import { B3DMDecoder } from "./decoder/B3DMDecoder";

const occlusionCullingService = new OcclusionCullingService();
occlusionCullingService.setSide(THREE.DoubleSide);
const scene = initScene();

const domContainer = initDomContainer("screen");
const camera = initCamera();
//const ogc3DTiles = initTileset(scene);


const instancedTileLoader = createInstancedTileLoader(scene);
initInstancedTilesets(instancedTileLoader);

const controller = initController(camera, domContainer);

const stats = initStats(domContainer);
const renderer = initRenderer(camera, domContainer);
const composer = initComposer(scene, camera, renderer);


/* fetch("https://storage.googleapis.com/ogc-3d-tiles/droneship/1/2007.b3dm").then(result => {
    
    if (!result.ok) {
        console.error("could not load tile with path : " + path)
        throw new Error(`couldn't load "${path}". Request failed with status ${result.status} : ${result.statusText}`);
    }
    return result.arrayBuffer();

})
.then(resultArrayBuffer=>{
    return B3DMDecoder.parseB3DMInstanced(resultArrayBuffer, self.meshCallback, 1);
})
.then(mesh=>{
    scene.add(mesh)
        
}) */


animate();


function initComposer(scene, camera, renderer) {
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.5, 0);


    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    return composer;
}
function initScene() {
    const scene = new THREE.Scene();
    scene.matrixAutoUpdate = false;
    scene.background = new THREE.Color(0x000000);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.2));
    
    const light = new THREE.PointLight(0xbbbbff, 2, 5000);
    const sphere = new THREE.SphereGeometry(2, 16, 8);
    light.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xbbbbff })));
    scene.add(light);
    light.position.set(200, 200, 200);


    const light2 = new THREE.PointLight(0xffbbbb, 2, 5000);
    const sphere2 = new THREE.SphereGeometry(2, 16, 8);
    light2.add(new THREE.Mesh(sphere2, new THREE.MeshBasicMaterial({ color: 0xffbbbb })));
    scene.add(light2);
    light2.position.set(200, 100, -100);

    scene.matrixWorldAutoUpdate = true;
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


function initCamera() {
    const camera = new THREE.PerspectiveCamera(40, window.offsetWidth / window.offsetHeight, 1, 100000);
    camera.position.set(100, 10, 100);
    camera.matrixAutoUpdate = true;
    return camera;
}

function initTileset(scene) {

    const tileLoader = new TileLoader(mesh => {
        //// Insert code to be called on every newly decoded mesh e.g.:
        mesh.material.wireframe = false;
        mesh.material.side = THREE.FrontSide;
    }, 1000)
    const ogc3DTile = new OGC3DTile({
        url: "https://storage.googleapis.com/ogc-3d-tiles/droneship/tileset.json",
        //url: "https://storage.googleapis.com/ogc-3d-tiles/berlinTileset/tileset.json",
        geometricErrorMultiplier: 1.0,
        loadOutsideView: false,
        tileLoader: tileLoader,
        //occlusionCullingService: occlusionCullingService,
        static: false,

    });




    //// The OGC3DTile object is a threejs Object3D so you may do all the usual opperations like transformations e.g.:
    //ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5) // Z-UP to Y-UP
    //// If the OGC3DTile object is marked as "static" (constructorParameter), these operations will not work.



    //// It's up to the user to call updates on the tileset. You might call them whenever the camera moves or at regular time intervals like here



    var interval;
    document.addEventListener('keyup', (e) => {
        console.log(camera.position)
        if (!!e.key && e.key !== "p") {

            if (!!interval) {
                clearInterval(interval);
                interval = null;
            } else {
                startInterval();
            }
        }
        if (!!e.key && e.key !== "l") {

            console.log("new THREE.Vector3(" + camera.position.x + "," + camera.position.y + "," + camera.position.z + ")");
            console.log("new THREE.Quaternion(" + camera.quaternion.x + "," + camera.quaternion.y + "," + camera.quaternion.z + "," + camera.quaternion.w + ")");

        }

    });
    function startInterval() {
        interval = setIntervalAsync(function () {
            ogc3DTile.update(camera);

        }, 20);
    }
    startInterval();

    scene.add(ogc3DTile)
    return ogc3DTile;
}

function createInstancedTileLoader(scene){
    return new InstancedTileLoader(scene, mesh => {
        //// Insert code to be called on every newly decoded mesh e.g.:
        mesh.material.wireframe = false;
        mesh.material.side = THREE.FrontSide;
    }, 1000, 1000);
}
function initInstancedTilesets(instancedTileLoader){

    const instancedTilesets = [];

    for(let x = 0; x<10; x++){
        for(let y = 0; y<10; y++){
            for(let z = 0; z<10; z++){
                const tileset = new InstancedOGC3DTile({
                    url: "https://storage.googleapis.com/ogc-3d-tiles/droneship/tileset.json",
                    //url: "http://localhost:8080/tileset.json",
                    geometricErrorMultiplier: 0.5,
                    loadOutsideView: false,
                    tileLoader: instancedTileLoader,
                    static: false,
                });
                tileset.translateOnAxis(new THREE.Vector3(1, 0, 0), 50*x)
                tileset.translateOnAxis(new THREE.Vector3(0, 1, 0), 15*y)
                tileset.translateOnAxis(new THREE.Vector3(0, 0, 1), 25*z)
                scene.add(tileset);
                instancedTilesets.push(tileset);

                idleCallback();

                function idleCallback(){
                    tileset.update(camera);
                    setTimeout(()=>{
                        window.requestIdleCallback(idleCallback,{timeout:50})
                    },20)
                    
                }
            }
        }
    }

    initLODMultiplierSlider(instancedTilesets);
}

function initLODMultiplierSlider(instancedTilesets) {
    var slider = document.getElementById("lodMultiplier");
    var output = document.getElementById("multiplierValue");
    output.innerHTML = slider.value;

    slider.oninput = () => {
        instancedTilesets.forEach(tileset=>{
            tileset.setGeometricErrorMultiplier(slider.value)
        })
        output.innerHTML = slider.value;
    }
}

function initController(camera, dom) {
    const controller = new OrbitControls(camera, dom);

    controller.target.set(0, 0, 0);
    controller.minDistance = 0.01;
    controller.maxDistance = 100000;
    controller.update();
    return controller;
}


function animate() {
    requestAnimationFrame(animate);
    instancedTileLoader.update();
    composer.render();
    //occlusionCullingService.update(scene, renderer, camera)
    stats.update();
}





