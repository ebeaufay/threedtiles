

class JsonTile{
    constructor(){
        const self = this;
        self.count = 0;
        self.json;
        self.instancedTiles = [];
    }

    addInstance(instanceTile){
        this.instancedTiles.push(instanceTile);
        if(this.json){
            instanceTile.loadJson(this.json, this.url)
        }
    }

    

    setObject(json, url){
        const self = this;
        self.json = json;
        self.url = url;
        for(let i = 0; i<self.instancedTiles.length; i++){
            self.instancedTiles[i].loadJson( self.json, self.url );
        }
    }

    getCount(){
        return this.instancedTiles.length;
    }
    update(){
        const self = this;
        for(let i = self.instancedTiles.length-1; i>=0; i--){
            if(self.instancedTiles[i].deleted){
                self.instancedTiles.splice(i,1);
            }
        }
    }
    dispose(){
        if(!!this.json && this.instancedTiles.length == 0){
            return true;
        }
        return false;
    }

}export { JsonTile };