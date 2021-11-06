import "regenerator-runtime/runtime.js";
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OGC3DTile } from "./tileset/OGC3DTile";
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


const scene = initScene();
const domContainer = initDomContainer("screen");
const camera = initCamera();
const ogc3DTiles = initTileset();
initLODMultiplierSlider(ogc3DTiles);
const controller = initController(camera, domContainer);
addElementsToScene(scene, ogc3DTiles);
const stats = initStats(domContainer);
const renderer = initRenderer(camera, domContainer);

animate();

function initLODMultiplierSlider(tileset) {
    var slider = document.getElementById("lodMultiplier");
    var output = document.getElementById("multiplierValue");
    output.innerHTML = slider.value;

    slider.oninput = ()=> {
        tileset.setGeometricErrorMultiplier(slider.value)
        output.innerHTML = slider.value;
    }
}
function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8A853F);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.5));

    var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(49, 500, 151);
    dirLight.target.position.set(0, 0, 0);

    scene.add(dirLight);
    scene.add(dirLight.target);
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
    const stats = new Stats();
    dom.appendChild(stats.dom);
    return stats;
}


function initCamera() {
    const camera = new THREE.PerspectiveCamera(30, window.offsetWidth / window.offsetHeight, 1, 10000);
    camera.position.set(200, 200, 200);
    camera.lookAt(0, 0, 0);

    return camera;
}

function initTileset() {

    const ogc3DTile = new OGC3DTile({
        url: "https://ebeaufay.github.io/ThreedTilesViewer.github.io/momoyama/tileset.json",
        geometricErrorMultiplier: 2.0,
        loadOutsideView: true,
        meshCallback: mesh => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            //mesh.material.wireframe = true;
        }
    });

    //// The OGC3DTile object is a threejs Object3D so you may do all the usual opperations like transformations e.g.:
    // ogc3DTile.translateOnAxis(new THREE.Vector3(0,1,0), -450)
    // ogc3DTile.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI*0.5)

    //// It's up to the user to call updates on the tileset. You might call them whenever the camera moves or at regular time intervals like here
    setInterval(function () {
        var frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        ogc3DTile.update(camera, frustum);
    }, 200);

    return ogc3DTile;
}

function initController(camera, dom) {
    const controller = new MapControls(camera, dom);

    controller.target.set(0, 0, 0);
    controller.minDistance = 1;
    controller.maxDistance = 5000;
    return controller;
}
function addElementsToScene(scene, object) {
    scene.add(object);
}

function animate() {
    requestAnimationFrame(animate);

    camera.updateMatrixWorld();
    renderer.render(scene, camera);

    stats.update();

}




