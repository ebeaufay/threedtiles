import {Cache} from "./cache/cache";
import { loader } from "./loader/loader";
import * as THREE from 'three';


const cache = new Cache((navigator.deviceMemory / 10)*8e9, loader);
function Tileset(url, scene, camera, geometricErrorMultiplier){
    var self = this;
    this.rootTile;
    if(!!scene) this.scene = scene;
    this.camera = camera;
    this.geometricErrorMultiplier = !!geometricErrorMultiplier?geometricErrorMultiplier:1;
    this.currentlyRenderedTiles = {};
    this.futureActionOnTiles = {};
    this.loadAroundView = false;


    loader(url).then(rootTile => {
        self.rootTile = rootTile;
        update();
    });

    function setGeometricErrorMultiplier(geometricErrorMultiplier){
        self.geometricErrorMultiplier = geometricErrorMultiplier;
    }
    function setLoadAroundView(loadAroundView){
        self.loadAroundView = loadAroundView;
    }
    function deleteFromCurrentScene(){
        if(!!self.scene){
            self.currentlyRenderedTiles.values().forEach(element => {
                self.scene.remove(element.scene);
            });
        }
        self.currentlyRenderedTiles = {}
    }
    function setScene(scene){
        deleteFromCurrentScene();
        self.scene = scene;
        update();
    }

    function setCamera(camera){
        self.camera = camera;
    }

    function update(){
        

        
        if(!self.rootTile) {
            return;
        }
        var frustum = new THREE.Frustum();
        var projScreenMatrix = new THREE.Matrix4();
                projScreenMatrix.multiplyMatrices( self.camera.projectionMatrix, self.camera.matrixWorldInverse );
                frustum.setFromProjectionMatrix( new THREE.Matrix4().multiplyMatrices( self.camera.projectionMatrix, self.camera.matrixWorldInverse ) );

        self.rootTile.getTilesInView(frustum, camera.position, self.geometricErrorMultiplier, self.loadAroundView).then(tiles=>{
            if(tiles.length>0){
                if(!!self.controller){
                    self.controller.abort();
                }
                let controller = new AbortController();
                self.controller = controller;
                
                
                self.camera.updateMatrix(); 
                self.camera.updateMatrixWorld();
                

                let newTilesContent = tiles.map(tile=>tile.content);
                let toDelete=[];
                Object.keys(self.currentlyRenderedTiles).forEach(current=>{
                    if(!newTilesContent.includes(current)){
                        self.futureActionOnTiles[current] = "toDelete";
                        toDelete.push(current);
                    }
                });
                var contentRequests=[];
                newTilesContent.forEach(content=>{
                    if(!self.currentlyRenderedTiles[content] && self.futureActionOnTiles[content] !== "toUpdate"){
                        self.futureActionOnTiles[content] = "toUpdate";
                        contentRequests.push(cache.get(content/*, controller.signal*/).then(gltf=>{
                            if(!!gltf){
                                if(self.futureActionOnTiles[content] === "toUpdate"){
                                    self.scene.add(gltf.model.scene);
                                    self.currentlyRenderedTiles[content] = gltf.model;
                                    delete self.futureActionOnTiles[content];
                                }
                            }
                        }).catch(error=>{
                            console.error( error);
                        }));
                    }else if(!!self.futureActionOnTiles[content]){
                        delete self.futureActionOnTiles[content];
                    }
                });
                if(contentRequests.length>0){
                    Promise.all(contentRequests).catch(error=>{
                        console.log(error);
                    }).finally(()=>{
                        if(!controller.signal.aborted){
                            toDelete.forEach(url=>{
                                setTimeout(()=>{
                                    if(self.futureActionOnTiles[url] === "toDelete"){
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

    
    return{
        "setScene" : setScene,
        "update" : update,
        "setCamera" : setCamera,
        "deleteFromCurrentScene" : deleteFromCurrentScene,
        "setLoadOutsideView": setLoadAroundView,
        "setGeometricErrorMultiplier":setGeometricErrorMultiplier
    }
}

export {Tileset};