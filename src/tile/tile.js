import {loader} from "./../loader/loader"
function Tile(){
    var self = this;
    this.children = [];
    this.volume;
    this.refine;
    this.geometricError;
    this.content;

    function getTilesInView(frustum, cameraPosition, errorCoefficient){
        if(self.content.endsWith(".json")){
            loader(self.content).then(tile=>{
                setContent(tile.getContent);
                setGeometricError(tile.geometricError);
                setRefine(tile.getRefine);
                setVolume(tile.getVolume);
                setChildren(tile.getChildren);
                return traverse(frustum, cameraPosition, errorCoefficient);
            });
            // if the content is a json, parse it and fill this tile with the result's values
        }else{
            return traverse(frustum, cameraPosition, errorCoefficient);
        }
        
    }

    function traverse(frustum, cameraPosition, errorCoefficient){
        let tilePromises = [];
        let distToVolume = distanceToVolume(cameraPosition)/(errorCoefficient*200);
        if(inFrustum(frustum)){
            if((!!self.refine && self.refine.toUpperCase() === "ADD") || self.children.length == 0 || distToVolume > self.geometricError){
                tilePromises.push(Promise.resolve([self]));
            }

            if(self.children.length > 0 && distToVolume < self.geometricError){
                self.children.forEach(child => tilePromises.push(child.getTilesInView(frustum, cameraPosition, errorCoefficient)));
            }
        }
        return Promise.all(tilePromises).then(children=> children.flat());
    }

    function setChildren(children){
        self.children = children;
    }
    function distanceToVolume(point){
        if(!self.volume || !self.volume.type || !point){
            return Number.MAX_VALUE;
        }
        switch (self.volume.type){
            case "box": return self.volume.distanceToPoint(point);
            case "sphere" : return Math.max(0, point.distanceTo(self.volume.center) - self.volume.radius);
            case "region" : return self.volume.distanceToPoint(point);
        }
    }
    function inFrustum(frustum){
        if(!self.volume || !self.volume.type || !frustum){
            return false;
        }
        switch (self.volume.type){
            case "box": return self.volume.inFrustum(frustum);
            case "sphere" : return frustum.intersectsSphere(self.volume);
            case "region" : return frustum.intersectsBox(self.volume);
        }
    }

    function setVolume(volume, type){
        if(type != "box" && type != "sphere" && type != "region"){
            throw "volume type should be box, sphere or region";
        }
        self.volume = volume;
        self.volume.type = type;
    }

    function getVolume(){
        return self.volume;
    }

    function addChild(child){
        self.children.push(child);
    }

    function getChildren(){
        return self.children;
    }

    function setGeometricError(geometricError){
        self.geometricError = geometricError;
    }
    function getGeometricError(){
        return self.geometricError;
    }
    function setRefine(refine){
        self.refine = refine;
    }
    function getRefine(){
        return self.refine;
    }
    function setContent(content){
        self.content = content;
    }
    function getContent(){
        return content.content;
    }

    return{
        "getTilesInView" : getTilesInView,
        "addChild" : addChild,
        "getChildren":getChildren,
        "setVolume": setVolume,
        "getVolume": getVolume,
        "setGeometricError": setGeometricError,
        "getGeometricError":getGeometricError,
        "setRefine" : setRefine,
        "getRefine" : getRefine,
        "setContent" : setContent,
        "getContent" : getContent,
        "setChildren": setChildren
    }
} 
export {Tile};