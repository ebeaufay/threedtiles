import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OGC3DTile, getOGC3DTilesCopyrightInfo } from "./tileset/OGC3DTile";
import { TileLoader } from "./tileset/TileLoader";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OcclusionCullingService } from "./tileset/OcclusionCullingService";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass';

import { InstancedOGC3DTile } from "./tileset/instanced/InstancedOGC3DTile.js"
import { InstancedTileLoader } from "./tileset/instanced/InstancedTileLoader.js"
import { Sky } from "three/addons/objects/Sky";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from "three/addons/loaders/KTX2Loader";
import { TransformControls } from 'three/addons/controls/TransformControls.js';





/* const manager = new PointManager();

// Add some points
const positions = new Float32Array(300);
for(let i = 0; i<300; i++){
    positions[i] = i;
}
manager.addPoints(positions, 0);

// Compute distances from a reference point

console.log(manager.sort(0,0,0))
console.log(manager.sort(0,0,0))

// Check if a point is used
console.log(manager.isPointUsed(1)); // true

// Remove points
manager.removePoints(0);

 */

let startShowing = false;
let endShowing = false;
let splatsShowCount = 0;

let lon = -2.915;
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



/* const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.002;
const pointer = new THREE.Vector2();
const geometry = new THREE.SphereGeometry(0.02, 32, 16);
const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sphere = new THREE.Mesh(geometry, material);
material.transparent = true;
material.opacity = 0.5
sphere.renderOrder = 1;
scene.add(sphere);
window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
}); */

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
const controller = initController(camera, domContainer);
const control = new TransformControls(camera, renderer.domElement);
const gizmo = control.getHelper();
scene.add(gizmo);

control.addEventListener('dragging-changed', function (event) {

    controller.enabled = !event.value;

});
window.addEventListener( 'keydown', function ( event ) {

    switch ( event.key ) {

        case 'q':
            control.setSpace( control.space === 'local' ? 'world' : 'local' );
            break;

        case 'Shift':
            control.setTranslationSnap( 1 );
            control.setRotationSnap( THREE.MathUtils.degToRad( 15 ) );
            control.setScaleSnap( 0.25 );
            break;

        case 'w':
            control.setMode( 'translate' );
            break;

        case 'e':
            control.setMode( 'rotate' );
            break;

        case 'r':
            control.setMode( 'scale' );
            break;

        case 'c':
            const position = currentCamera.position.clone();

            currentCamera = currentCamera.isPerspectiveCamera ? cameraOrtho : cameraPersp;
            currentCamera.position.copy( position );

            orbit.object = currentCamera;
            control.camera = currentCamera;

            currentCamera.lookAt( orbit.target.x, orbit.target.y, orbit.target.z );
            onWindowResize();
            break;

        case 'v':
            const randomFoV = Math.random() + 0.1;
            const randomZoom = Math.random() + 0.1;

            cameraPersp.fov = randomFoV * 160;
            cameraOrtho.bottom = - randomFoV * 500;
            cameraOrtho.top = randomFoV * 500;

            cameraPersp.zoom = randomZoom * 5;
            cameraOrtho.zoom = randomZoom * 5;
            onWindowResize();
            break;

        case '+':
        case '=':
            control.setSize( control.size + 0.1 );
            break;

        case '-':
        case '_':
            control.setSize( Math.max( control.size - 0.1, 0.1 ) );
            break;

        case 'x':
            control.showX = ! control.showX;
            break;

        case 'y':
            control.showY = ! control.showY;
            break;

        case 'z':
            control.showZ = ! control.showZ;
            break;

        case ' ':
            control.enabled = ! control.enabled;
            break;

        case 'Escape':
            control.reset();
            break;

    }

} );
const gl = renderer.getContext();
const cropRadiusSlider = document.getElementById("cropRadius");
const cropRadiusValue = document.getElementById("cropRadiusValue");

let tileLoader;
let ogc3DTiles;
tileLoader = initTileLoader();
ogc3DTiles = initTilesets(scene, tileLoader, "INCREMENTAL", 1.0, 1.0);

const geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
const material = new THREE.MeshStandardMaterial( {color: 0x00ff00, transparent: true, opacity: 0.5} ); 
const cube = new THREE.Mesh( geometry, material ); 
scene.add( cube );
control.attach(cube)
const matrices = [];
window.addEventListener( 'keydown', function ( e ) {
    if(e.key === 'Enter'){
        matrices.push(cube.matrix.clone())
        console.log(matrices)
    }
});
//let google = initGoogleTileset(scene, tileLoader, "INCREMENTAL", 0.5, 1.0);

let targetFrameRate = _isMobileDevice() ? 30 : 5000;
initSliders();
//const tileLoader = createInstancedTileLoader(scene);
//initInstancedTilesets(tileLoader);

function initSliders() {
    const lodSlider = document.getElementById("lodMultiplier");
    const lodSliderValue = document.getElementById("multiplierValue");
    const distanceBiasSlider = document.getElementById("distanceBias");
    const distanceBiasSliderValue = document.getElementById("distanceBiasValue");
    const fpsSlider = document.getElementById("targetFPS");
    const fpsSliderValue = document.getElementById("targetFPSValue");
    //fpsSlider.value = targetFrameRate;
    //fpsSliderValue.innerText = targetFrameRate;
    const loadingStrategy = document.getElementById("loadingStrategy");
    const loadingStrategyValue = document.getElementById("loadingStrategyValue");
    const loadingStrategyWrapper = document.getElementById("loadingStrategyWrapper");


    /* cropRadiusSlider.addEventListener("input", e => {
        cropRadiusValue.innerText = cropRadiusSlider.value;
        ogc3DTiles.forEach(tileset=>{
            tileset.setSplatsCropRadius(cropRadiusSlider.value)
        })
    }) */
    lodSlider.addEventListener("input", e => {
        lodSliderValue.innerText = lodSlider.value;
        ogc3DTiles.forEach(t => t.setGeometricErrorMultiplier(Number(lodSlider.value)));

    })

    /* distanceBiasSlider.addEventListener("input", e => {
        distanceBiasSliderValue.innerText = distanceBiasSlider.value;
        ogc3DTiles.setDistanceBias(distanceBiasSlider.value)
    }) */

    /* fpsSlider.addEventListener("input", e => {
        fpsSliderValue.innerText = fpsSlider.value;
        targetFrameRate = fpsSlider.value
    }) */


    /* loadingStrategyWrapper.addEventListener("click", e => {

        if (loadingStrategy.value == 0) {
            loadingStrategy.setAttribute("value", "1")
            loadingStrategyValue.innerText = "IMMEDIATE";
            reloadTileset("IMMEDIATE", lodSlider.value, distanceBiasSlider.value);
        } else {
            loadingStrategy.setAttribute("value", "0")
            loadingStrategyValue.innerText = "INCREMENTAL";
            reloadTileset("INCREMENTAL", lodSlider.value, distanceBiasSlider.value);
        }
    }) */
}

function reloadTileset(loadingStrategy, geometricErrorMultiplier, distanceBias) {
    ogc3DTiles.forEach(tileset => {
        scene.remove(tileset);
        tileset.dispose();
    })

    tileLoader.clear();
    ogc3DTiles = initTilesets(scene, tileLoader, loadingStrategy, geometricErrorMultiplier, distanceBias)
}

function initTileLoader() {
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('https://storage.googleapis.com/ogc-3d-tiles/basis/').detectSupport(renderer);
    const mat = new THREE.MeshStandardMaterial({vertexColors: true, fog: true, side: THREE.DoubleSide});
    const tileLoader = new TileLoader({
        renderer: renderer,
        //ktx2Loader:ktx2Loader,
        maxCachedItems: 20,
        meshCallback: (mesh, geometricError) => {
            //mesh.material.vertexColors = true;
            /* mesh.material.vertexColors = true;
            mesh.material.fog= true; */
            mesh.material.metalness = 0;
            /* mesh.material.wireframe = false;



            mesh.material.roughness = 0.5;
            mesh.material.side = THREE.DoubleSide; */
        },
        pointsCallback: (points, geometricError) => {
            points.material.size = Math.min(1.0, 0.03 * Math.sqrt(geometricError));
            points.material.sizeAttenuation = true;
            //points.add(new THREE.BoxHelper( points, 0xffff00 ))

        }
    });


    return tileLoader;
}
/* const gltfLoader = new GLTFLoader();


//gltfLoader.setKTX2Loader(ktx2Loader)


gltfLoader.load(
    // resource URL
    'http://localhost:8084/LaPalmaPriness_8M_8-8K_4-4K (1).glb',
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



const composer = initComposer(scene, camera, renderer);
let previousFrame = performance.now();
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
        elevation: 80,
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
    //scene.background = new THREE.Color(0xE5E3E4);
    scene.background = new THREE.Color(0xffffff);
    const axesHelper = new THREE.AxesHelper(50000000);
    //scene.add(axesHelper);



    //scene.add(lightTarget)
    //const helper = new THREE.DirectionalLightHelper(dirLight, 50);
    //scene.add(helper);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 3.0));
    scene.fog = new THREE.FogExp2( 0xcccccc, 0.01 );
    //const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.0 );
    //scene.add( directionalLight );

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(1);
    renderer.maxSamples = 0;
    renderer.setSize(dom.offsetWidth, dom.offsetHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    //renderer.toneMapping = THREE.ACESFilmicToneMapping;
    //renderer.toneMappingExposure = 10.0;

    renderer.shadowMap.enabled = true;
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



    /* const ogc3DTile = new OGC3DTile({

        //url: "https://storage.googleapis.com/ogc-3d-tiles/playaSquarePack/tileset.json",
        //url: "https://s3.us-east-2.wasabisys.com/construkted-assets/a8cpnqtyjb2/tileset.json", //ION
        //url: "https://s3.us-east-2.wasabisys.com/construkted-assets/ayj1tydhip1/tileset.json", //UM
        //url: "https://storage.googleapis.com/ogc-3d-tiles/splatsMirai/tileset.json", //UM
        //url: "https://vectuel-3d-models.s3.eu-west-3.amazonaws.com/DAE/SM/B/tileset.json", //UM
        // url: "https://storage.googleapis.com/ogc-3d-tiles/cabinSplats/tileset.json", //UM
        url: "https://storage.googleapis.com/ogc-3d-tiles/voluma/sectorA/tileset.json", //UM

        geometricErrorMultiplier: 0.4,
        distanceBias: 1,
        loadOutsideView: true,
        tileLoader: tileLoader,
        static: false,
        centerModel: false,
        //loadingStrategy: "IMMEDIATE",
        distanceBias: distanceBias,
        drawBoundingVolume: false,
        //renderer: renderer,
        onLoadCallback: (e) => {
            console.log(e)
        }

    });
    ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * 0.5);
    ogc3DTile.updateMatrices();
    ogc3DTile.setSplatsCropRadius(500);
    scene.add(ogc3DTile); */

    const ogc3DTile2 = new OGC3DTile({

        //url: "https://s3.us-east-2.wasabisys.com/construkted-assets/a8cpnqtyjb2/tileset.json", //ION
        //url: "https://s3.us-east-2.wasabisys.com/construkted-assets/ayj1tydhip1/tileset.json", //UM
        //url: "https://storage.googleapis.com/ogc-3d-tiles/splatsMirai/tileset.json", //UM
        //url: "https://vectuel-3d-models.s3.eu-west-3.amazonaws.com/DAE/SM/B/tileset.json", //UM
        // url: "https://storage.googleapis.com/ogc-3d-tiles/cabinSplats/tileset.json", //UM
        //url: "https://storage.googleapis.com/ogc-3d-tiles/voluma/maximap/tileset.json", //UM
        //url: "https://storage.googleapis.com/ogc-3d-tiles/ifc/architecture/tileset.json",
        url: "https://storage.googleapis.com/ogc-3d-tiles/ifc/utilities/tileset.json", //UM
        renderer: renderer,
        geometricErrorMultiplier: 1.0,
        distanceBias: 1,
        loadOutsideView: false,
        tileLoader: tileLoader,
        static: false,
        centerModel: true,
        //loadingStrategy: "IMMEDIATE",
        distanceBias: distanceBias,
        drawBoundingVolume: false,
        //renderer: renderer,
        onLoadCallback: (e) => {
            //console.log(e)
        }

    });
    scene.add(ogc3DTile2);
    ogc3DTile2.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * 1.0);

    /* const googleTiles = new OGC3DTile({
        url: "https://tile.googleapis.com/v1/3dtiles/root.json",
        queryParams: { key: "AIzaSyD5lm27SjppfG4b4Qbr0r1xy5vAKb1139Y" },
        geometricErrorMultiplier: 0.5, // controls the level of detail
        loadOutsideView: false, // when true, extra low detail tiles are loaded outside the frustum
        tileLoader: tileLoader,
        renderer: renderer,
        static: true,
    });

    earthAntiGeoreferencing(googleTiles, -76.613170, 39.274965, -16); */
    //googleTiles.setSplatsCropRadius(5)
    /* googleTiles.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI * -0.5);
    googleTiles.position.set(0,0,0)
    //ogc3DTile2.scale.set(0.5,0.5,0.5)
    googleTiles.updateMatrices(); */
    //ogc3DTile2.setSplatsCropRadius(500);
    //scene.add(googleTiles);
    //

    //const axesHelper = new THREE.AxesHelper( 5000 );
    //scene.add( axesHelper );

    return [ogc3DTile2];
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

function initGoogleTileset(scene, tileLoader, loadingStrategy, geometricErrorMultiplier, distanceBias) {
    const google = new OGC3DTile({
        url: "https://tile.googleapis.com/v1/3dtiles/root.json",
        queryParams: { key: "" },
        geometricErrorMultiplier: geometricErrorMultiplier, // controls the level of detail
        //loadOutsideView: true, // when true, extra low detail tiles are loaded outside the frustum
        tileLoader: tileLoader,
        loadingStrategy: loadingStrategy,
        distanceBias: distanceBias,
        drawBoundingVolume: true,
        displayCopyright: true,
        static: false,
        renderer: renderer

    });

    //earthAntiGeoreferencing(google, -2.915, 53.392, 200);
    scene.add(google);
    return google;
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
                centerModel: false,
                loadingStrategy: "IMMEDIATE",
            });
            tileset.translateOnAxis(new THREE.Vector3(1, 0, 0), 10000 * x);
            tileset.translateOnAxis(new THREE.Vector3(0, 0, 1), 10000 * y);
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
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);

    camera.position.set(100, 100, 0);

    camera.lookAt(0, 0.0, 0);

    camera.matrixAutoUpdate = true;

    /* document.addEventListener('keydown', function (event) {
        if (event.key === 'p') {
            paused = !paused;
        }
        if (event.key === 'a') {
            tileLoader = initTileLoader();
            ogc3DTiles = initTilesets(scene, tileLoader, "INCREMENTAL", 1.0, 1.0);
        }
        if (event.key === 'z') {
            ogc3DTiles.forEach(t=>{
                scene.remove(t)
                t.dispose();
            })
            
            ogc3DTiles = undefined;
            tileLoader.dispose();
            tileLoader = undefined;
        }
        
    }); */

    return camera;
}
function initController(camera, dom) {
    const controller = new OrbitControls(camera, dom);

    //controller.target.set(4629210.73133627, 435359.7901640832, 4351492.357788198);
    controller.target.set(0, 0.0, 0);


    controller.minDistance = 0;
    controller.maxDistance = 10000000;
    controller.autoRotate = false;
    const checkbox = document.getElementById("autorotate");
    /* checkbox.addEventListener("click", () => {
        controller.autoRotate = checkbox.checked;
    }) */
    controller.update();
    return controller;
}






function animate() {
    requestAnimationFrame(animate);
    const delta = performance.now() - previousFrame;
    if (delta < 1000 / targetFrameRate) {
        return;
    }
    previousFrame = performance.now();
    /*  lon+=0.000001;
     t++;
     if(t%400 == 0){
         ogc3DTiles.position.copy(llhToCartesianFast(lon, 53.392, 0));
         ogc3DTiles.updateMatrices();
     } */


    if (!paused) {
        if (tileLoader) tileLoader.update();
        if (ogc3DTiles) {

            ogc3DTiles.forEach(t => {
                if (t && !t.deleted) {

                    t.update(camera);
                }
            })
        }



        /* const info = ogc3DTiles.update(camera);
        infoTilesToLoad.innerText = info.numTilesLoaded
        infoTilesRendered.innerText = info.numTilesRendered
        infoMaxLOD.innerText = info.maxLOD
        infoPercentage.innerText = (info.percentageLoaded * 100).toFixed(1); */
        controller.update();

        /* raycaster.setFromCamera(pointer, camera);

        // calculate objects intersecting the picking ray
        const a = [];
        let intersects = raycaster.intersectObject(ogc3DTiles, true, a);

        if(intersects.length>0){
            sphere.position.copy(intersects[0].point);
            
        } *//* else{
            intersects = raycaster.intersectObject(ogc3DTiles[1], true, a);
            if(intersects.length>0){
                sphere.position.copy(intersects[0].point);
            }
        } */
        /* for (let i = 0; i < intersects.length; i++) {
            console.log(intersects[i]);
            sphere.position.set()
        } */
    }



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
    composer.render();
    stats.update();

}




function _isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};
