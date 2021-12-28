import "regenerator-runtime/runtime.js";
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OGC3DTile } from "./tileset/OGC3DTile";
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import back from './images/skybox/back.png';
import front from './images/skybox/front.png';
import top from './images/skybox/top.png';
import bottom from './images/skybox/bottom.png';
import right from './images/skybox/right.png';
import left from './images/skybox/left.png';


const scene = initScene();
const domContainer = initDomContainer("screen");
const camera = initCamera();
const ogc3DTiles = initTileset(scene);
initLODMultiplierSlider(ogc3DTiles);
const controller = initController(camera, domContainer);
const skybox = initSkybox(controller, camera, scene);

const stats = initStats(domContainer);
const renderer = initRenderer(camera, domContainer);

animate();

function initSkybox(controller, camera, scene) {
    const geometry = new THREE.BoxGeometry(8000, 8000, 8000);
    const textures = [
        loadTexture(back),
        loadTexture(front),
        loadTexture(top),
        loadTexture(bottom),
        loadTexture(right),
        loadTexture(left),
    ];
    function loadTexture(url) {
        return new THREE.TextureLoader().load(url, (texture => {
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearFilter;
        }))

    }
    const materials = [];
    textures.forEach(tex => {
        materials.push(new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide }));
    })
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.copy(camera.position);
    controller.addEventListener("change", () => {
        mesh.position.copy(camera.position);
    });
    scene.add(mesh);
    return mesh;
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
function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFF0000);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.5));

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(-400, 500, -100);
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
    const camera = new THREE.PerspectiveCamera(70, window.offsetWidth / window.offsetHeight, 1, 10000);
    camera.position.set(-60, 80, -30);
    camera.lookAt(-100, 40, 0);

    return camera;
}

function initTileset(scene) {

    const ogc3DTile = new OGC3DTile({
        //url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
        //url: "https://storage.googleapis.com/ogc-3d-tiles/castleX/tileset.json",
        url: "https://storage.googleapis.com/ogc-3d-tiles/berlinSubsetTiled/tileset.json",
        geometricErrorMultiplier: 1,
        loadOutsideView: true,
        meshCallback: mesh => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            mesh.material.wireframe = false;
            mesh.material.side = THREE.DoubleSide;
        }
    });

    //// The OGC3DTile object is a threejs Object3D so you may do all the usual opperations like transformations e.g.:
    //ogc3DTile.translateOnAxis(new THREE.Vector3(0,1,0), -10)
    //ogc3DTile.translateOnAxis(new THREE.Vector3(1,0,0), -65)
    //ogc3DTile.translateOnAxis(new THREE.Vector3(0,0,1), -80)
    //ogc3DTile.scale.set(0.1,0.1,0.1);
    //ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI * 0.5) // Z-UP to Y-UP
    //// It's up to the user to call updates on the tileset. You might call them whenever the camera moves or at regular time intervals like here

    var interval ;
    document.addEventListener('keyup', (e) => {
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
        }, 200);
    }
    startInterval();
    

    scene.add(ogc3DTile)
    return ogc3DTile;
}

function initController(camera, dom) {
    const controller = new OrbitControls(camera, dom);

    controller.target.set(-20, 40, 35);
    controller.minDistance = 1;
    controller.maxDistance = 500;
    controller.update();
    return controller;
}


function animate() {
    requestAnimationFrame(animate);

    camera.updateMatrixWorld();
    renderer.render(scene, camera);

    stats.update();

}




