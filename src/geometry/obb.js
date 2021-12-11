import { Matrix3, Sphere, Vector3 } from "three";

class OBB {
    constructor(values) {
        this.center = new Vector3(values[0], values[2], -values[1]);
        var e1 = new Vector3(values[3], values[5], values[4]);
        var e2 = new Vector3(values[6], values[8], values[7]);
        var e3 = new Vector3(values[9], values[11], values[10]);

        this.halfWidth = e1.length();
        this.halfHeight = e2.length();
        this.halfDepth = e3.length();

        e1.normalize();
        e2.normalize();
        e3.normalize();

        // A sphere is used for frustum culling
        this.sphere = new Sphere(this.center, Math.sqrt(this.halfWidth * this.halfWidth + this.halfHeight * this.halfHeight + this.halfDepth * this.halfDepth));

        this.matrixToOBBCoordinateSystem = new Matrix3();
        this.matrixToOBBCoordinateSystem.set(
            e1.x, e1.y, e1.z,
            e2.x, e2.y, e2.z,
            e3.x, e3.y, e3.z);
    }

    inFrustum(frustum) {
        // frustum check simplified to bounding sphere intersection
        return frustum.intersectsSphere(this.sphere);
    }
    distanceToPoint(point) {

        let transformedPoint = point.clone();
        transformedPoint.sub(this.center);
        transformedPoint.applyMatrix3(this.matrixToOBBCoordinateSystem);

        //// point to bounds 
        let dx = Math.max(0, Math.max(-this.halfWidth - transformedPoint.x, transformedPoint.x - this.halfWidth));
        let dy = Math.max(0, Math.max(-this.halfHeight - transformedPoint.y, transformedPoint.y - this.halfHeight));
        let dz = Math.max(0, Math.max(-this.halfDepth - transformedPoint.z, transformedPoint.z - this.halfDepth));
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
}

export { OBB };