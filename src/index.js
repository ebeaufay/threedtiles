import "regenerator-runtime/runtime.js";
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OGC3DTile } from "./tileset/OGC3DTile";
import { TileLoader } from "./tileset/TileLoader";
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { OcclusionCullingService } from "./tileset/OcclusionCullingService";


const occlusionCullingService = new OcclusionCullingService();
occlusionCullingService.setSide(THREE.DoubleSide);
const scene = initScene();
const domContainer = initDomContainer("screen");
const camera = initCamera();
const ogc3DTiles = initTileset(scene);
initLODMultiplierSlider(ogc3DTiles)
const controller = initController(camera, domContainer);

const stats = initStats(domContainer);
const renderer = initRenderer(camera, domContainer);


animate();

function initScene() {
    const scene = new THREE.Scene();
    scene.matrixAutoUpdate = false;
    scene.background = new THREE.Color(0xaaffcc);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.2));
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
    directionalLight.position.set(100,100,100)
    directionalLight.lookAt(-1,-1,-1)
    scene.add( directionalLight );
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
    const camera = new THREE.PerspectiveCamera(70, window.offsetWidth / window.offsetHeight, 0.1, 1000);
    camera.position.set(-10, 5, 20);
    camera.matrixAutoUpdate = true;
    return camera;
}

function initTileset(scene) {

    const ogc3DTile = new OGC3DTile({
        url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tiledWithSkirts/tileset.json",
        //url: "http://localhost:8081/tileset.json",
        geometricErrorMultiplier: 0.5,
        loadOutsideView: false,
        tileLoader: new TileLoader(mesh => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            mesh.material.wireframe = false;
            mesh.material.side = THREE.DoubleSide;
        }, 1000),
        occlusionCullingService: occlusionCullingService
    });


    
    //// The OGC3DTile object is a threejs Object3D so you may do all the usual opperations like transformations e.g.:
    //-172683.125,301451.125,1367762.21875
    //ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5) // Z-UP to Y-UP
    
    
    //// It's up to the user to call updates on the tileset. You might call them whenever the camera moves or at regular time intervals like here


    
    var interval;
    document.addEventListener('keyup', (e) => {
        console.log(camera.position)
        if (!e.key || e.key !== "p") return;
        if (!!interval) {
            clearInterval(interval);
            interval = null;
        } else {
            startInterval();
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

function initLODMultiplierSlider(tileset) {
    var slider = document.getElementById("lodMultiplier");
    var output = document.getElementById("multiplierValue");
    output.innerHTML = slider.value;

    slider.oninput = () => {
        tileset.setGeometricErrorMultiplier(slider.value)
        output.innerHTML = slider.value;
    }
}

function initController(camera, dom) {
    const controller = new OrbitControls(camera, dom);

    controller.target.set(0, 0, 0);
    controller.minDistance = 1;
    controller.maxDistance = 5000;
    controller.update();
    return controller;
}


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    occlusionCullingService.update(scene, renderer, camera)
    stats.update();


}




