import "regenerator-runtime/runtime.js";
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OGC3DTile, getOGC3DTilesCopyrightInfo } from "./tileset/OGC3DTile";
import { TileLoader } from "./tileset/TileLoader";
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OcclusionCullingService } from "./tileset/OcclusionCullingService";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { InstancedOGC3DTile } from "./tileset/instanced/InstancedOGC3DTile.js"
import { InstancedTileLoader } from "./tileset/instanced/InstancedTileLoader.js"
import { Sky } from "three/examples/jsm/objects/Sky";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from "three/addons/loaders/KTX2Loader";

let t = 0;
let lightShadowMapViewer;
let paused = false;
//const dirLight = new THREE.DirectionalLight(0xffFFFF, 1.0, 0, Math.PI / 5, 0.3);
//dirLight.position.set(1,1,1);
let cameraToLight = new THREE.Vector3(-1000, 1000, -1000);
let lightVector = new THREE.Vector3(1000, -1000, 1000);
let lightTarget = new THREE.Object3D();
const occlusionCullingService = new OcclusionCullingService();
occlusionCullingService.setSide(THREE.DoubleSide);
const scene = initScene();

const clock = new THREE.Clock();

const infoTilesToLoad = document.getElementById("tilesToLoadValue");
const infoTilesRendered = document.getElementById("tilesRenderedValue");
const infoMaxLOD = document.getElementById("maxLODValue");
const infoPercentage = document.getElementById("percentageValue");


/* const m = new THREE.Mesh(new THREE.TorusGeometry(), new THREE.MeshPhongMaterial());
m.castShadow = true;
m.receiveShadow = true;
m.scale.set(50,50,50)
scene.add(m); */

const domContainer = initDomContainer("screen");
const camera = initCamera(domContainer.offsetWidth, domContainer.offsetHeight);
const stats = initStats(domContainer);
const renderer = initRenderer(camera, domContainer);
const tileLoader = initTileLoader();
let ogc3DTiles = initTilesets(scene, tileLoader, "IMMEDIATE", 1.0, 1.0);
//const google = initGoogleTileset(tileLoader);
//scene.add(google);
initSliders();
//const tileLoader = createInstancedTileLoader(scene);
//initInstancedTilesets(tileLoader);
let targetFrameRate = 200;
function initSliders(){
    const lodSlider = document.getElementById("lodMultiplier");
    const lodSliderValue = document.getElementById("multiplierValue");
    const distanceBiasSlider = document.getElementById("distanceBias");
    const distanceBiasSliderValue = document.getElementById("distanceBiasValue");
    const fpsSlider = document.getElementById("targetFPS");
    const fpsSliderValue = document.getElementById("targetFPSValue");
    const loadingStrategy = document.getElementById("loadingStrategy");
    const loadingStrategyValue = document.getElementById("loadingStrategyValue");
    const loadingStrategyWrapper = document.getElementById("loadingStrategyWrapper");

    lodSlider.addEventListener("input", e=>{
        lodSliderValue.innerText = lodSlider.value;
        ogc3DTiles.setGeometricErrorMultiplier(lodSlider.value)
    })

    distanceBiasSlider.addEventListener("input", e=>{
        distanceBiasSliderValue.innerText = distanceBiasSlider.value;
        ogc3DTiles.setDistanceBias(distanceBiasSlider.value)
    })

    fpsSlider.addEventListener("input", e=>{
        fpsSliderValue.innerText = fpsSlider.value;
        targetFrameRate = fpsSlider.value
    })

    
    loadingStrategyWrapper.addEventListener("click", e=>{
        
        if(loadingStrategy.value == 0){
            loadingStrategy.setAttribute("value", "1")
            loadingStrategyValue.innerText = "IMMEDIATE";
            reloadTileset("IMMEDIATE", lodSlider.value, distanceBiasSlider.value);
        }else{
            loadingStrategy.setAttribute("value", "0")
            loadingStrategyValue.innerText = "INCREMENTAL";
            reloadTileset("INCREMENTAL", lodSlider.value, distanceBiasSlider.value);
        }
    })
}

function reloadTileset(loadingStrategy, geometricErrorMultiplier, distanceBias){
    scene.remove(ogc3DTiles);
    ogc3DTiles.dispose();
    tileLoader.clear();
    ogc3DTiles = initTilesets(scene, tileLoader, loadingStrategy, geometricErrorMultiplier, distanceBias)
}

function initTileLoader(){
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('https://storage.googleapis.com/ogc-3d-tiles/basis/').detectSupport(renderer);
    const tileLoader = new TileLoader({
        //renderer: renderer,
        ktx2Loader:ktx2Loader,
        maxCachedItems: 0,
        meshCallback: (mesh, geometricError) => {
            mesh.material.wireframe = false;
            
            //mesh.material.roughness = 0.5;
            //mesh.material.side = THREE.DoubleSide;
        },
        pointsCallback: (points, geometricError) => {
            points.material.size = Math.min(1.0, 0.5 * Math.sqrt(geometricError));
            points.material.sizeAttenuation = true;
            //points.add(new THREE.BoxHelper( points, 0xffff00 ))
            
        }
    });
    return tileLoader;
}
const gltfLoader = new GLTFLoader();


//gltfLoader.setKTX2Loader(ktx2Loader)


/* gltfLoader.load(
    // resource URL
    'http://localhost:8080/export.glb',
    // called when the resource is loaded
    function (gltf) {

        scene.add(gltf.scene);

    },
    // called while loading is progressing
    function (xhr) {

        console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

        console.log('An error happened : ' + error);

    }
); */
// Optional: Provide a DRACOLoader instance to decode compressed mesh data

const controller = initController(camera, domContainer);

const composer = initComposer(scene, camera, renderer);
let previousFrame = Date.now();
animate();

let sky, sun;
initSky();
function initSky() {
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    sun = new THREE.Vector3();

    const effectController = {
        turbidity: 0.1,
        rayleigh: 0.1,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.3,
        elevation: 25,
        azimuth: 20,
        exposure: renderer.toneMappingExposure
    };

    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = effectController.turbidity;
    uniforms['rayleigh'].value = effectController.rayleigh;
    uniforms['mieCoefficient'].value = effectController.mieCoefficient;
    uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
    const theta = THREE.MathUtils.degToRad(effectController.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    uniforms['sunPosition'].value.copy(sun);

    renderer.toneMappingExposure = effectController.exposure;
    renderer.render(scene, camera);
}
function initComposer(scene, camera, renderer) {
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.1, 0.5, 0.4);


    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    //composer.addPass(bloomPass);
    return composer;
}
function initScene() {
    const scene = new THREE.Scene();
    scene.matrixAutoUpdate = false;
    //scene.matrixWorldAutoUpdate = false;
    scene.background = new THREE.Color(0xE5E3E4);

    


    //scene.add(lightTarget)
    //const helper = new THREE.DirectionalLightHelper(dirLight, 50);
    //scene.add(helper);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 1.0));

    //scene.add(dirLight)

    /* lightShadowMapViewer = new ShadowMapViewer(dirLight);
    lightShadowMapViewer.position.x = 10;
    lightShadowMapViewer.position.y = 110;
    lightShadowMapViewer.size.width = 400;
    lightShadowMapViewer.size.height = 400;
    lightShadowMapViewer.update(); */

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: false, powerPreference: "high-performance"});
    renderer.setPixelRatio(1);
    renderer.maxSamples = 2;
    renderer.setSize(dom.offsetWidth, dom.offsetHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping ;
    renderer.toneMappingExposure = 2.0;

    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFShadowMap;
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




function initTilesets(scene, tileLoader, loadingStrategy, geometricErrorMultiplier, distanceBias) {

    
    
    const ogc3DTile = new OGC3DTile({
        
        //url: "https://storage.googleapis.com/ogc-3d-tiles/playaSquarePack/tileset.json",
        url: "http://localhost:8080/tileset.json",
        
        geometricErrorMultiplier: geometricErrorMultiplier,
        distanceBias: 1,
        //loadOutsideView: true,
        tileLoader: tileLoader,
        static: false,
        centerModel: true,
        loadingStrategy: loadingStrategy,
        distanceBias: distanceBias,
        //drawBoundingVolume: true,
        //renderer: renderer,
        onLoadCallback:(e)=>{
            console.log(e)
        }

    });
    
    //ogc3DTile.rotateOnAxis(new THREE.Vector3(1,0,0), -3.1415*0.5);
    ogc3DTile.updateMatrix();
        ogc3DTile.updateMatrixWorld(true);
    scene.matrixAutoUpdate = true;
    scene.add(ogc3DTile);

    //const axesHelper = new THREE.AxesHelper( 5000 );
    //scene.add( axesHelper );
    
    return ogc3DTile;
}


function createInstancedTileLoader(scene) {
    return new InstancedTileLoader(scene, {
        renderer: renderer,
        maxCachedItems: 0,
        maxInstances: 100,
        meshCallback: mesh => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            //mesh.material.wireframe = true;
            //mesh.material.alphaMap = mesh.material.map;
            //mesh.material.side = THREE.DoubleSide;
            //mesh.geometry.computeVertexNormals();
            //console.log(mesh.material.type)
            //mesh.material.shadowSide = THREE.BackSide;
            //mesh.material.flatShading = true;
            //mesh.material.needsUpdate = true
            //mesh.material.map = mesh.material.metalnessMap
            //mesh.material.metalness = 0.5
            //mesh.material.metalnessMap = undefined
            //mesh.material.emissiveIntensity = 0
            //mesh.material.emissive = new THREE.Color( 0xffffff );
            //mesh.material.map = undefined
            //mesh.material.emissiveMap = undefined
            //mesh.material.aoMap = undefined
            //mesh.material.aoMapIntensity = 0
            //mesh.material.normalMap = undefined
            //mesh.material.roughness = 0.5
            //mesh.material.roughnessMap = undefined

        },
        pointsCallback: points => {
            points.material.size = Math.min(1.0, 0.5 * Math.sqrt(points.geometricError));
            points.material.sizeAttenuation = true;
            
            
        }
    });
}

function initGoogleTileset(tileLoader) {
    const googleTiles = new OGC3DTile({
        url: "https://tile.googleapis.com/v1/3dtiles/root.json",
        queryParams: { key: "" },
        geometricErrorMultiplier: 0.5, // controls the level of detail
        //loadOutsideView: true, // when true, extra low detail tiles are loaded outside the frustum
        tileLoader: tileLoader,
        loadingStrategy: "IMMEDIATE",
        //drawBoundingVolume: true,
        displayCopyright: true,
        static: true,
        renderer: renderer

    });

    earthAntiGeoreferencing(googleTiles, -76.613170, 39.274965, -16);
    return googleTiles;
}


function earthAntiGeoreferencing(googleTiles, longitude, latitude, height) {


    const cartesianLocation = llhToCartesianFast(longitude, latitude, height);

    const quaternionToEarthNormalOrientation = new THREE.Quaternion();
    quaternionToEarthNormalOrientation.setFromUnitVectors(cartesianLocation.clone().normalize(), new THREE.Vector3(0, 1, 0));

    const rotation = new THREE.Matrix4();
    const translation = new THREE.Matrix4();
    translation.makeTranslation(-cartesianLocation.x, -cartesianLocation.y, -cartesianLocation.z);
    rotation.makeRotationFromQuaternion(quaternionToEarthNormalOrientation);

    googleTiles.matrix.multiplyMatrices(rotation, translation);
    googleTiles.matrix.decompose(googleTiles.position, googleTiles.quaternion, googleTiles.scale);
}



function llhToCartesianFast(longitude, latitude, height, radians = false) {
    const lon = radians ? longitude : 0.017453292519 * longitude;
    const lat = radians ? latitude : 0.017453292519 * latitude;
    const N = 6378137.0 / (Math.sqrt(1.0 - (0.006694379990141316 * Math.pow(Math.sin(lat), 2.0))));
    const cosLat = Math.cos(lat);
    const cosLon = Math.cos(lon);
    const sinLat = Math.sin(lat);
    const sinLon = Math.sin(lon);
    const nPh = (N + height);

    return new THREE.Vector3(nPh * cosLat * cosLon, nPh * cosLat * sinLon, (0.993305620009858684 * N + height) * sinLat);
}
function initInstancedTilesets(instancedTileLoader) {

    const instancedTilesets = [];


    for (let x = 0; x < 1; x++) {
        for (let y = 0; y < 1; y++) {
            const tileset = new InstancedOGC3DTile({
                url: "https://storage.googleapis.com/ogc-3d-tiles/playaETC1S/tileset.json",
                //url: "https://storage.googleapis.com/ogc-3d-tiles/nyc/tileset.json",
                geometricErrorMultiplier: 0.01,
                loadOutsideView: false,
                tileLoader: instancedTileLoader,
                static: true,
                renderer: renderer,
                centerModel: false
            });
            tileset.translateOnAxis(new THREE.Vector3(1, 0, 0), 10000 * x);
                tileset.translateOnAxis(new THREE.Vector3(0,0, 1),10000 * y);
                tileset.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5);
                tileset.updateMatrix();
                tileset.updateMatrixWorld(true);
                tileset.updateWorldMatrix(true, true);
            
            //tileset.scale.set(0.1,0.1,0.1)
            instancedTilesets.push(tileset);
            scene.add(tileset);
        }
    }


    scene.updateMatrixWorld(true)
    function now() {
        return (typeof performance === 'undefined' ? Date : performance).now();
    }
    let lastUpdateIndex = 0;
    setInterval(() => {
        let startTime = now();
        let updateIndex = lastUpdateIndex;
        do {
            const frustum = new THREE.Frustum();
            frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
            instancedTilesets[updateIndex].update(camera, frustum);
            updateIndex++;
            
        } while (updateIndex < instancedTilesets.length && now() - startTime < 10);
        lastUpdateIndex = updateIndex % instancedTilesets.length;
    }, 100);

    
}


function initCamera(width, height) {
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    camera.position.set(-50,20,0);
    camera.lookAt(0, 0, 0);

    camera.matrixAutoUpdate = true;

    document.addEventListener('keydown', function (event) {
        if (event.key === 'p') {
            console.log(camera.position);
        }
    });

    return camera;
}
function initController(camera, dom) {
    const controller = new OrbitControls(camera, dom);

    //controller.target.set(4629210.73133627, 435359.7901640832, 4351492.357788198);
    controller.target.set(100,0,50);


    controller.minDistance = 1;
    controller.maxDistance = 30000;
    controller.autoRotate = false;
    const checkbox = document.getElementById("autorotate");
    checkbox.addEventListener("click", ()=>{
        controller.autoRotate = checkbox.checked;
    })
    controller.update();
    return controller;
}


function animate1() {
    setTimeout( function() {

        requestAnimationFrame( animate );

    }, 1000 / 60 );
    tileLoader.update();
    ogc3DTiles.update(camera);
    
    composer.render();
    stats.update();
    //occlusionCullingService.update(scene, renderer, camera)
    //lightShadowMapViewer.render(renderer);
}

function animate() {
    requestAnimationFrame( animate );
    tileLoader.update();
    const info = ogc3DTiles.update(camera);
    infoTilesToLoad.innerText = info.numTilesLoaded
    infoTilesRendered.innerText = info.numTilesRendered
    infoMaxLOD.innerText = info.maxLOD
    infoPercentage.innerText = (info.percentageLoaded * 100).toFixed(1);
    /* let c = 0;
    google.traverse(e=>{
        if(!!e.geometry){
            c++;
        }
    })
    console.log("jhgkjgh " + c)
    if(!paused){
        console.log(google.update(camera));
    }
    console.log(getOGC3DTilesCopyrightInfo()) */
    const now = Date.now();
    controller.update(clock.getDelta());
    if( now - previousFrame > 1000 / targetFrameRate){
        
        previousFrame = now;
        composer.render();
        stats.update();
    }
}




function _isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};
