import { Cache } from "./cache/cache";
import { Loader } from "./loader/Loader";
import * as THREE from 'three';



function Tileset(url, scene, camera, geometricErrorMultiplier, meshCallback) {
    var self = this;
    this.rootTile;
    if (!!scene) this.scene = scene;
    this.camera = camera;
    this.geometricErrorMultiplier = !!geometricErrorMultiplier ? geometricErrorMultiplier : 1;
    this.currentlyRenderedTiles = {};
    this.futureActionOnTiles = {};
    this.loadAroundView = false;
    this.loader = new Loader(meshCallback);
    this.cache = new Cache(100, this.loader);
    this.loader.load(url).then(rootTile => {
        self.rootTile = rootTile;
        update();
    });
    this.matrix = new THREE.Matrix4();
    this.position = new THREE.Vector3();
    this.scale = new THREE.Vector3(1,1,1);
    this.rotation = new THREE.Quaternion();
    this.tilesetCamera = this.camera.clone();
    this.tilesetCameraHelper = new THREE.CameraHelper(this.tilesetCamera);

    function setGeometricErrorMultiplier(geometricErrorMultiplier) {
        self.geometricErrorMultiplier = geometricErrorMultiplier;
    }
    function setLoadAroundView(loadAroundView) {
        self.loadAroundView = loadAroundView;
    }
    function deleteFromCurrentScene() {
        if (!!self.scene) {
            Object.values(self.currentlyRenderedTiles).forEach(element => {
                self.scene.remove(element.scene);
            });
        }
        self.currentlyRenderedTiles = {}
        self.scene = null;
    }
    function setScene(scene) {
        deleteFromCurrentScene();
        self.scene = scene;
        update();
    }

    function setCamera(camera) {
        self.camera = camera;
    }

    function update() {
        if (!self.rootTile || !self.scene) {
            return;
        }
        var frustum = new THREE.Frustum();
        self.tilesetCamera.copy(self.camera, false);
        self.tilesetCamera.applyMatrix4(self.matrix.clone().invert());
        self.tilesetCamera.updateMatrixWorld(true);
        self.tilesetCamera.updateProjectionMatrix();
        //self.tilesetCameraHelper.update();
        var projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(self.tilesetCamera.projectionMatrix, self.tilesetCamera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        self.rootTile.getTilesInView(frustum, self.tilesetCamera.position, self.geometricErrorMultiplier, self.loadAroundView).then(tiles => {
            if (tiles.length > 0 && !!self.scene) {
                let newTilesContent = tiles.map(tile => tile.content);
                let toDelete = [];
                Object.keys(self.currentlyRenderedTiles).forEach(current => {
                    if (!newTilesContent.includes(current)) {
                        self.futureActionOnTiles[current] = "toDelete";
                        toDelete.push(current);
                    }
                });
                var contentRequests = [];
                newTilesContent.forEach(content => {
                    if (!self.currentlyRenderedTiles[content]) {
                        if (self.futureActionOnTiles[content] !== "toUpdate") {
                            self.futureActionOnTiles[content] = "toUpdate";
                            contentRequests.push(self.cache.get(content/*, controller.signal*/).then(gltf => {
                                if (!!gltf && !!self.scene) {
                                    if (self.futureActionOnTiles[content] === "toUpdate") {
                                        applyMatrix(gltf.model.scene);
                                        self.scene.add(gltf.model.scene);
                                        self.currentlyRenderedTiles[content] = gltf.model;
                                        delete self.futureActionOnTiles[content];
                                    }
                                }
                            }).catch(error => {
                                console.error(error);
                            }));
                        };

                    } else if (!!self.futureActionOnTiles[content]) {
                        delete self.futureActionOnTiles[content];
                    }
                });
                if (contentRequests.length > 0) {
                    if (!!self.controller) {
                        self.controller.abort();
                    }
                    let controller = new AbortController();
                    self.controller = controller;

                    Promise.all(contentRequests).catch(error => {
                        console.log(error);
                    }).finally(() => {
                        if (!controller.signal.aborted && !!self.scene) {
                            toDelete.forEach(url => {
                                setTimeout(() => {
                                    if (self.futureActionOnTiles[url] === "toDelete") {
                                        self.scene.remove(self.currentlyRenderedTiles[url].scene);
                                        delete self.currentlyRenderedTiles[url];
                                        delete self.futureActionOnTiles[url];
                                    }
                                }, 0);
                            })
                        }

                    });
                }
            }

        });
    }


    function setScale(x, y, z, applyNow) {
        self.scale.set(x, y, z);
        if (!!applyNow) applyMovement();
    }

    function setRotation(x, y, z, applyNow) {
        self.rotation.setFromEuler(new THREE.Euler( x,y,z, 'XYZ' ));
        if (!!applyNow) applyMovement();
    }

    function translate(x, y, z, applyNow) {
        self.position.set(self.position.x + x, self.position.y + y, self.position.z + z);
        if (!!applyNow) applyMovement();
    }

    function move(x, y, z, applyNow) {
        self.position.set(x, y, z);
        if (!!applyNow) applyMovement();
    }

    function applyMatrixAll() {
        for (var model in self.currentlyRenderedTiles) {
            applyMatrix(self.currentlyRenderedTiles[model].scene);
        }
    }
    function applyMatrix(object) {
        object.matrix.copy(self.matrix);
        //object.updateMatrix();
        object.matrix.decompose(object.position, object.quaternion, object.scale);
    }

    function applyMovement() {
        self.matrix.compose(self.position, self.rotation, self.scale);
        applyMatrixAll();
    }

    return {
        "setScene": setScene,
        "update": update,
        "setCamera": setCamera,
        "deleteFromCurrentScene": deleteFromCurrentScene,
        "setLoadOutsideView": setLoadAroundView,
        "setGeometricErrorMultiplier": setGeometricErrorMultiplier,
        "setRotation": setRotation,
        "translate": translate,
        "move": move,
        "setScale": setScale,
        "apply":applyMovement,
        "matrix": self.matrix
    }
}

export { Tileset };