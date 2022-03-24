import "regenerator-runtime/runtime.js";
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import TilesetStats from './tileset/TilesetStats';
import { OGC3DTile } from "./tileset/OGC3DTile";
import { TileLoader } from "./tileset/TileLoader";
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';




const scene = initScene();
const tilesetStats = TilesetStats();
const domContainer = initDomContainer("screen");
const camera = initCamera();
const ogc3DTiles = initTileset(scene);
const controller = initController(camera, domContainer);

const stats = initStats(domContainer);
const renderer = initRenderer(camera, domContainer);

animate();


function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 1.0));
    return scene;
}

function initDomContainer(divID) {

    const domContainer = document.getElementById(divID);
    domContainer.style = "position: absolute; height:100%; width:100%; left: 0px; top:0px;";
    document.body.appendChild(domContainer);
    return domContainer;
}


function initRenderer(camera, dom) {

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.antialias = true;
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
    const camera = new THREE.PerspectiveCamera(70, window.offsetWidth / window.offsetHeight, 1, 10000);
    camera.position.set(10, 10, 10);

    return camera;
}

function initTileset(scene) {

    const ogc3DTile = new OGC3DTile({
        url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
        geometricErrorMultiplier: 1,
        loadOutsideView: true,
        tileLoader: new TileLoader(mesh => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            mesh.material.wireframe = false;
            mesh.material.side = THREE.DoubleSide;
        }, tilesetStats),
        stats: tilesetStats
    });
    

    //// The OGC3DTile object is a threejs Object3D so you may do all the usual opperations like transformations e.g.:
    //ogc3DTile.translateOnAxis(new THREE.Vector3(0,1,0), -10)
    //ogc3DTile.translateOnAxis(new THREE.Vector3(1,0,0), -65)
    //ogc3DTile.translateOnAxis(new THREE.Vector3(0,0,1), -80)
    //ogc3DTile.scale.set(0.0001,0.0001,0.0001);
    // ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * 0.5) // Z-UP to Y-UP
    // ogc3DTile.translateOnAxis(new THREE.Vector3(1,0,0), -16.5)
    // ogc3DTile.translateOnAxis(new THREE.Vector3(0,1,0), 0)
    // ogc3DTile.translateOnAxis(new THREE.Vector3(0,0,1), -9.5)
    //// It's up to the user to call updates on the tileset. You might call them whenever the camera moves or at regular time intervals like here

    

    var interval ;
    document.addEventListener('keyup', (e) => {
        console.log(camera.position)
        if(!e.key || e.key !== "p") return;
        if(!!interval){
            clearInterval(interval);
            interval = null;
        }else{
            startInterval();
        }
    });
    function startInterval(){
        interval = setInterval(function () {
            ogc3DTile.update(camera);
        }, 25);
    }
    startInterval();

    scene.add(ogc3DTile)
    return ogc3DTile;
}

function initController(camera, dom) {
    const controller = new OrbitControls(camera, dom);

    controller.target.set(-11.50895,0.058452500000001, 3.1369285);
    controller.minDistance = 1;
    controller.maxDistance = 5000;
    controller.update();
    return controller;
}


function animate() {
    requestAnimationFrame(animate);

    camera.updateMatrixWorld();
    renderer.render(scene, camera);
    tilesetStats.update();
    stats.update();

}




