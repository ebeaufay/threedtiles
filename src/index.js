import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import Stats from 'three/addons/libs/stats.module.js';
import { OGC3DTile } from "./tileset/OGC3DTile";
import { TileLoader } from "./tileset/TileLoader";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass';
import { InstancedOGC3DTile } from "./tileset/instanced/InstancedOGC3DTile.js"
import { InstancedTileLoader } from "./tileset/instanced/InstancedTileLoader.js"
import { KTX2Loader } from "three/addons/loaders/KTX2Loader";
import { SplatsMesh } from './splats/SplatsMesh.js';

let quat = new THREE.Quaternion();
quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.6585408946722412, 0.7520797288025427, 0.02645697580181784))

var rotationMatrix = new THREE.Matrix4();
rotationMatrix.makeRotationFromQuaternion(quat);

console.log(rotationMatrix);


let paused = false;

const scene = initScene();
const geom = new THREE.SphereGeometry(10, 32, 16 ); 
const mat = new THREE.MeshBasicMaterial(  ); 
const sphere = new THREE.Mesh( geom, mat ); 
scene.add( sphere );



const domContainer = initDomContainer("screen");
const camera = initCamera(domContainer.offsetWidth, domContainer.offsetHeight);
const stats = initStats(domContainer);
const renderer = initRenderer(camera, domContainer);


/// raycast ///
const raycaster = new THREE.Raycaster();


const geometry = new THREE.SphereGeometry( 1, 32, 16 ); 
const material = new THREE.MeshBasicMaterial( { color: 0xffff00, transparent: true, depthTest: true, depthWrite: true } ); 

const raycastSphere = new THREE.Mesh( geometry, material ); scene.add( raycastSphere );
raycastSphere.renderOrder = 5;

const pointer = new THREE.Vector2();
window.addEventListener( 'click', (event)=>{
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( scene.children );
    let a = 0;
    for (const layer of intersects) {
        if (layer.type != "splat") continue;
        a += layer.opacity * (1 - a);
        if (a >= 0.75) {
            console.log(layer.point)
            break;
        }
    }
} );

initSliders();
let tileLoader;
let ogc3DTiles = [];

setTimeout(()=>{
tileLoader = initTileLoader();
ogc3DTiles = reloadTileset("INCREMENTAL", 0.5)
},1000)

initController(camera, domContainer)


let targetFrameRate = _isMobileDevice() ? 30 : 3000;

function initSliders() {
    const lodSlider = document.getElementById("lodMultiplier");
    const lodSliderValue = document.getElementById("multiplierValue");
    const strategy = document.getElementById("strategy");

    strategy.addEventListener("input", e => {
        ogc3DTiles = reloadTileset(strategy.value, lodSlider.value)
    })
    lodSlider.addEventListener("input", e => {
        lodSliderValue.innerText = lodSlider.value;
        ogc3DTiles.forEach(t => t.setGeometricErrorMultiplier(Number(lodSlider.value)));

    })
}

function reloadTileset(loadingStrategy, geometricErrorMultiplier) {
    //scene.clear()
    
    scene.add(new THREE.AmbientLight(0xFFFFFF, 3.0));
    ogc3DTiles.forEach(tileset => {

        tileset.dispose();
    })

    ogc3DTiles = initTilesets(scene, tileLoader, loadingStrategy, geometricErrorMultiplier)
    //scene.add(raycastSphere);
    return ogc3DTiles
}

function initTileLoader() {
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('https://storage.googleapis.com/ogc-3d-tiles/basis/').detectSupport(renderer);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
    const tileLoader = new TileLoader({
        downloadParallelism: 32,
        renderer: renderer,
        maxCachedItems: 0,
        timeout: 5000,
        meshCallback: (mesh, geometricError) => {
            mesh.material.metalness = 0;
        },
        pointsCallback: (points, geometricError) => {
            points.material.size = Math.min(1.0, 0.03 * Math.sqrt(geometricError));
            points.material.sizeAttenuation = true;

        }
    });


    return tileLoader;
}



const composer = initComposer(scene, camera, renderer);
let previousFrame = performance.now();
renderer.setAnimationLoop(animate);


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
    scene.matrixWorldAutoUpdate = false;
    scene.background = new THREE.Color(0x880000);
    const axesHelper = new THREE.AxesHelper(50000000);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 3.0));
    return scene;
}

function initDomContainer(divID) {

    const domContainer = document.getElementById(divID);
    domContainer.style = "position: absolute; height:100%; width:100%; left: 0px; top:0px;";
    document.body.appendChild(domContainer);
    return domContainer;
}


function initRenderer(camera, dom) {

    //const renderer = new WebGPURenderer( { antialias: true } );
    const renderer = new THREE.WebGLRenderer({ antialias: false, logarithmicDepthBuffer: false, powerPreference: "high-performance", precision: "highp" });
    renderer.setPixelRatio(1.0);
    renderer.setSize(dom.offsetWidth, dom.offsetHeight);
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




function initTilesets(scene, tileLoader, loadingStrategy, geometricErrorMultiplier) {

    const ogc3DTile1 = new OGC3DTile({

        
        url: "http://localhost:8082/tileset.json", //UM
        renderer: renderer,
        geometricErrorMultiplier: 0.5,
        distanceBias: 1,
        loadOutsideView: false,
        tileLoader: tileLoader,
        static: true,
        centerModel: true,
        splatsQuality: 0.25,
        splatsCPUCulling: false,
        iosCompatibility: false,
        drawBoundingVolume: false,
        //clipShape: new THREE.Sphere(new THREE.Vector3(0,0,0), 0.1),

        loadingStrategy: loadingStrategy,
        

    });
    ogc3DTile1.setSplatsSizeMultiplier(1.0);
    //ogc3DTile1.setSplatsCropRadius(4.0);
    ogc3DTile1.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI*0.5)
    ogc3DTile1.scale.set(3,3,3)
    
    ogc3DTile1.updateMatrices();
    /* const ogc3DTile2 = new OGC3DTile({

        
        url: "https://storage.googleapis.com/ogc-3d-tiles/splatsMirai/tileset.json", //UM
        renderer: renderer,
        geometricErrorMultiplier: 0.25,
        distanceBias: 1,
        loadOutsideView: false,
        tileLoader: tileLoader,
        static: false,
        centerModel: true,
        splatsQuality: 0.75,
        splatsCPUCulling: false,
        iosCompatibility: false,
        drawBoundingVolume: false,
        //clipShape: new THREE.Sphere(new THREE.Vector3(0,0,0), 0.1),

        loadingStrategy: loadingStrategy,
        

    });
    ogc3DTile2.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI) */
    const group = new THREE.Group();
    
    group.add(ogc3DTile1);
    group.static = true;
    scene.add(group);
    //ogc3DTile2.updateMatrices();
    //ogc3DTile2.setSplatsCropRadius(10);


    //

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

    return [ogc3DTile1];
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
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 10000);

    camera.position.set(40,10,20);

    camera.lookAt(0, 0.01, 0);

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
    controller.target.set(0, -20, 0);
    controller.rotateSpeed = 0.5;
    controller.panSpeed = 0.5;
    controller.enableDamping = false;
    controller.dampingFactor = 0.1;

    controller.minDistance = 0;
    controller.maxDistance = 1000000000;
    controller.autoRotate = false;
    const checkbox = document.getElementById("autorotate");
    /* checkbox.addEventListener("click", () => {
        controller.autoRotate = checkbox.checked;
    }) */
    controller.update();
    return controller;
}





const debugDisplay = document.getElementById("debugDisplay");

function animate() {
    const delta = performance.now() - previousFrame;
    if (delta < 1000 / targetFrameRate) {
        return;
    }
    previousFrame = performance.now();
    


    if (!paused) {
        if (tileLoader) {

            tileLoader.update();

        }
        if (ogc3DTiles) {

            ogc3DTiles.forEach(t => {
                if (t && !t.deleted) {
                    //let sphere = new THREE.Sphere(camera.position, 10000)
                    //t.setClipShape(sphere)
                    const info = t.update(camera);
                    /* debugDisplay.innerHTML = Object.entries(info)
                        .map(([key, value]) => {
                            if (typeof value === 'number') {
                                value = Math.round(value * 100) / 100;
                            }
                            return `${key}: ${value}`;
                        })
                        .join('<br>'); */
                }
            })
        }



        /* const info = ogc3DTiles.update(camera);
        infoTilesToLoad.innerText = info.numTilesLoaded
        infoTilesRendered.innerText = info.numTilesRendered
        infoMaxLOD.innerText = info.maxLOD
        infoPercentage.innerText = (info.percentageLoaded * 100).toFixed(1); */
        //controller.update();

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
