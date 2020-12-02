import {cache} from "./cache/cache";
import { loader } from "./loader/loader";

console.log(navigator.deviceMemory);

function Tileset(url){
    var self = this;
    this.rootTile;

    loader(url).then(rootTile => self.rootTile = rootTile);

    function setScene(scene){
        self.scene = scene;
    }

    function update(){
        
    }

    return{
        "setScene" : setScene
    }
}