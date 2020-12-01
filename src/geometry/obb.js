import * as THREE from "three";
import { Matrix3, Sphere, Vector3 } from "three";

function OBB(values){
    var self = this;
    this.center = new Vector3(values[0], values[1], values[2]);
    var e1 = new Vector3(values[3], values[4], values[5]);
    var e2 = new Vector3(values[6], values[7], values[8]);
    var e3 = new Vector3(values[9], values[10], values[11]);

    this.halfWidth = e1.length();
    this.halfHeight = e2.length();
    this.halfDepth = e3.length();

    e1.normalize();
    e2.normalize();
    e3.normalize();

    this.sphere = new Sphere(this.center, Math.sqrt(this.halfWidth * this.halfWidth + this.halfHeight * this.halfHeight + this.halfDepth * this.halfDepth));
    
    this.matrixToOBBCoordinateSystem = new Matrix3();
    this.matrixToOBBCoordinateSystem.set( 
        e1.x, e1.y, e1.z,
        e2.x, e2.y, e2.z,
        e3.x, e3.y, e3.z );

    function distanceToPoint(point){

        let transformedPoint = point.clone();
        transformedPoint.sub(self.center);
        transformedPoint.applyMatrix3(self.matrixToOBBCoordinateSystem);

        //// point to bounds 
        let dx = Math.max(0, Math.max(-self.halfWidth - transformedPoint.x, transformedPoint.x - self.halfWidth));
        let dy = Math.max(0, Math.max(-self.halfHeight - transformedPoint.y, transformedPoint.y - self.halfHeight));
        let dz = Math.max(0, Math.max(-self.halfDepth - transformedPoint.z, transformedPoint.z - self.halfDepth));
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function inFrustum(frustum){
        // frustum check simplified to bounding sphere intersection
        return frustum.intersectsSphere(self.sphere);
    }

    return {
        "inFrustum" : inFrustum,
        "distanceToPoint" : distanceToPoint
    }
}

export {OBB};