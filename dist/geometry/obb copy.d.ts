export class OBB {
    constructor(values: any);
    center: Vector3;
    halfWidth: number;
    halfHeight: number;
    halfDepth: number;
    aabb: Box3;
    sphere: Sphere;
    matrixToOBBCoordinateSystem: Matrix3;
    inFrustum(frustum: any): any;
    distanceToPoint(point: any): number;
}
import { Vector3 } from "three";
import { Box3 } from "three";
import { Sphere } from "three";
import { Matrix3 } from "three";
