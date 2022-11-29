import * as THREE from 'three';
import { InstancedMesh } from 'three';

class MeshTile{
    constructor(scene){
        const self = this;
        self.scene = scene;
        self.instancedTiles = [];
        self.instancedMesh;

        self.reuseableMatrix = new THREE.Matrix4();
    }
    addInstance(instancedTile){
        const self = this;
        instancedTile.added = true;
        instancedTile.listOMesh = self.instancedTiles;
        self.instancedTiles.push(instancedTile);
        if(self.instancedMesh){
            instancedTile.loadMesh(self.instancedMesh)
        }
    }

    addToScene(){
        //this.instancedMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
        const self = this;
        self.instancedMesh.setMatrixAt(0,new THREE.Matrix4());
        self.instancedMesh.instanceMatrix.needsUpdate = true;
        self.instancedMesh.count = 1;
        
        self.scene.add(self.instancedMesh);
        self.instancedMesh.onAfterRender = () => {
            delete self.instancedMesh.onAfterRender;
            self.instancedMesh.displayedOnce = true;
        };
    }

    setObject(instancedMesh){
        const self = this;
        self.instancedMesh = instancedMesh;
        
        for(let i = 0; i<self.instancedTiles.length; i++){
            self.instancedTiles[i].loadMesh(self.instancedMesh)
        }
    }

    update(){
        const self = this;

        for(let i = self.instancedTiles.length-1; i>=0; i--){
            if(self.instancedTiles[i].deleted){
                self.instancedTiles.splice(i,1);
            }
        }
        
        if(!!self.instancedMesh){
            
            self.instancedMesh.count = 0;
            
            for(let i = 0; i<self.instancedTiles.length; i++){
                self.instancedTiles[i].meshContent = self.instancedMesh;
                if(self.instancedTiles[i].materialVisibility && !!self.instancedTiles[i].meshContent){
                    self.instancedMesh.count++;
                    self.instancedMesh.setMatrixAt(self.instancedMesh.count-1, self.reuseableMatrix.multiplyMatrices(self.instancedMesh.baseMatrix, self.instancedTiles[i].getWorldMatrix()) )
                }
                
            }
            self.instancedMesh.instanceMatrix.needsUpdate = true;
        }
    }

    getCount(){
        return this.instancedTiles.length;
    }

}export { MeshTile };