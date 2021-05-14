import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as THREE from 'three';

//const types = { UnsignedShortType: THREE.UnsignedShortType, UnsignedIntType: THREE.UnsignedIntType, UnsignedInt248Type: THREE.UnsignedInt248Type };

function Renderer(scene, container, camera) {
    var self = this;
    self.camera = camera;
    this.scene = scene;
    this.camera = camera;
    this.renderer;
    this.controls;
    this.container = container;
    this.supportsExtension = true;
    this.clock = new THREE.Clock();


    init();



    function init() {
        self.renderer = new THREE.WebGLRenderer();
        self.renderer.antialias = true;
        if (self.renderer.capabilities.isWebGL2 === false && self.renderer.extensions.has('WEBGL_depth_texture') === false) {

            self.supportsExtension = false;
            document.querySelector('#error').style.display = 'block';
            return;
        }

        self.renderer.setPixelRatio(window.devicePixelRatio);
        self.renderer.outputEncoding = THREE.sRGBEncoding;
        self.renderer.autoClear = false;

        self.renderer.setSize(self.container.offsetWidth, self.container.offsetHeight);
        self.container.appendChild(self.renderer.domElement);

        self.stats = new Stats();
        self.container.appendChild(self.stats.dom);

        self.controls = new OrbitControls(self.camera, self.renderer.domElement);
        self.camera.position.set(100, 100, 100);
        self.controls.target.x = 0;
        self.controls.target.y = 0;
        self.controls.target.z = 0;
        self.controls.minDistance = 1;
        self.controls.maxDistance = 5000;
        self.controls.update();


        onWindowResize();
        window.addEventListener('resize', onWindowResize);

    }

    function onWindowResize() {
        const aspect = self.container.offsetWidth / self.container.offsetHeight;
        self.camera.aspect = aspect;
        self.camera.updateProjectionMatrix();
        const dpr = self.renderer.getPixelRatio();

        self.renderer.setSize(self.container.offsetWidth, self.container.offsetHeight);

    }

    function render() {
        if (!self.supportsExtension) return;
        //self.camera.near = 0.0 + Math.pow(self.camera.position.y / 10, 0.5);
        //self.camera.far = 1000 + self.camera.position.y * 1;
        //self.camera.updateProjectionMatrix();

        requestAnimationFrame(render);

        self.camera.updateMatrixWorld();
        self.renderer.render(scene, camera);

        self.stats.update();
        const delta = self.clock.getDelta();
        self.controls.movementSpeed = 15;
        self.controls.update(delta);
    }


    return {
        render: render,
        camera: self.camera,
    }
}
export { Renderer };