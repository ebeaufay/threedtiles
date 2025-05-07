export class OBB {
    constructor(values: any);
    center: Vector3;
    e1: Vector3;
    e2: Vector3;
    e3: Vector3;
    halfSize: Vector3;
    rotationMatrix: Matrix3;
    copy(aObb: any): void;
    getSize(result: any): any;
    applyMatrix4(matrix: any): this;
    intersectRay(ray: any, result: any): any;
    intersectsRay(ray: any): boolean;
    insidePlane(plane: any): boolean;
    inFrustum(frustum: any): boolean;
    distanceToPoint(point: any): number;
    helper(): LineSegments<BufferGeometry<import("three").NormalBufferAttributes>, LineBasicMaterial, import("three").Object3DEventMap>;
}
import { Vector3 } from "three";
import { Matrix3 } from "three";
import { BufferGeometry } from "three";
import { LineBasicMaterial } from "three";
import { LineSegments } from "three";
