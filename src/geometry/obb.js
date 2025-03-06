

import { Matrix3, Matrix4, Ray, Sphere, Vector3, Box3, BufferGeometry, LineSegments, LineBasicMaterial } from "three";
import { OBB as threeOBB } from 'three/addons/math/OBB.js';

const tempMatrix = new Matrix3();
const tempVector3 = new Vector3();
const size = new Vector3();
const aabb = new Box3();
const matrix = new Matrix4();
const inverse = new Matrix4();
const localRay = new Ray();

class OBB {
    constructor(values) {
        this.center = new Vector3(values[0], values[1], values[2]);
        this.e1 = new Vector3(values[3], values[4], values[5]);
        this.e2 = new Vector3(values[6], values[7], values[8]);
        this.e3 = new Vector3(values[9], values[10], values[11]);

        this.halfSize = new Vector3(this.e1.length(), this.e2.length(), this.e3.length());


        this.e1.normalize();
        this.e2.normalize();
        this.e3.normalize();

        this.rotationMatrix = new Matrix3();
        this.rotationMatrix.set(
            this.e1.x, this.e2.x, this.e3.x,
            this.e1.y, this.e2.y, this.e3.y,
            this.e1.z, this.e2.z, this.e3.z);
    }

    copy(aObb) {
        this.center.copy(aObb.center);
        this.rotationMatrix.copy(aObb.rotationMatrix);
        this.halfSize.copy(aObb.halfSize);
        this.e1.copy(aObb.e1);
        this.e2.copy(aObb.e2);
        this.e3.copy(aObb.e3);
    }

    getSize(result) {

        return result.copy(this.halfSize).multiplyScalar(2);

    }

    applyMatrix4(matrix) {
        const e = matrix.elements;

        let sx = tempVector3.set(e[0], e[1], e[2]).length();
        const sy = tempVector3.set(e[4], e[5], e[6]).length();
        const sz = tempVector3.set(e[8], e[9], e[10]).length();

        const det = matrix.determinant();
        if (det < 0) sx = - sx;

        tempMatrix.setFromMatrix4(matrix);

        const invSX = 1 / sx;
        const invSY = 1 / sy;
        const invSZ = 1 / sz;

        tempMatrix.elements[0] *= invSX;
        tempMatrix.elements[1] *= invSX;
        tempMatrix.elements[2] *= invSX;

        tempMatrix.elements[3] *= invSY;
        tempMatrix.elements[4] *= invSY;
        tempMatrix.elements[5] *= invSY;

        tempMatrix.elements[6] *= invSZ;
        tempMatrix.elements[7] *= invSZ;
        tempMatrix.elements[8] *= invSZ;

        this.rotationMatrix.premultiply(tempMatrix);

        this.halfSize.x *= sx;
        this.halfSize.y *= sy;
        this.halfSize.z *= sz;

        //tempVector3.setFromMatrixPosition(matrix);
        this.center.applyMatrix4(matrix);
        //console.log(this.e1);
        this.rotationMatrix.extractBasis(this.e1, this.e2, this.e3);
        //console.log(this.e1)
        return this;

    }

    intersectRay(ray, result) {

        // the idea is to perform the intersection test in the local space
        // of the OBB.

        this.getSize(size);
        aabb.setFromCenterAndSize(tempVector3.set(0, 0, 0), size);

        // create a 4x4 transformation matrix

        matrix.setFromMatrix3(this.rotationMatrix);
        matrix.setPosition(this.center);

        // transform ray to the local space of the OBB

        inverse.copy(matrix).invert();
        localRay.copy(ray).applyMatrix4(inverse);

        // perform ray <-> AABB intersection test

        if (localRay.intersectBox(aabb, result)) {

            // transform the intersection point back to world space

            return result.applyMatrix4(matrix);

        } else {

            return null;

        }

    }

    intersectsRay(ray) {

        return this.intersectRay(ray, tempVector3) !== null;

    }

    insidePlane(plane) {
        // compute the projection interval radius of this OBB onto L(t) = this->center + t * p.normal;

        plane.normal.normalize();
        const r = this.halfSize.x * Math.abs(plane.normal.dot(this.e1)) +
            this.halfSize.y * Math.abs(plane.normal.dot(this.e2)) +
            this.halfSize.z * Math.abs(plane.normal.dot(this.e3));

        // compute distance of the OBB's center from the plane

        const d = plane.distanceToPoint(this.center);

        // Intersection occurs when distance d falls within [-r,+r] interval

        return d > -r;

    }

    inFrustum(frustum) {

        //this.rotationMatrix.extractBasis(this.e1, this.e2, this.e3);

        for (let i = 0; i < 6; i++) {
            const plane = frustum.planes[i];
            const planeIntersection = this.insidePlane(plane);

            if (!planeIntersection) {
                return false;
            }
        }
        return true;
    }
    distanceToPoint(point) {

        tempVector3.copy(point);
        tempVector3.sub(this.center);
        tempVector3.applyMatrix3(this.rotationMatrix);

        //// point to bounds 
        let dx = Math.max(0, Math.max(-this.halfSize.x - tempVector3.x, tempVector3.x - this.halfSize.x));
        let dy = Math.max(0, Math.max(-this.halfSize.y - tempVector3.y, tempVector3.y - this.halfSize.y));
        let dz = Math.max(0, Math.max(-this.halfSize.z - tempVector3.z, tempVector3.z - this.halfSize.z));
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    helper() {
        const hs = this.halfSize;
        const c = this.center;
        const e1 = this.e1;
        const e2 = this.e2;
        const e3 = this.e3;
    
        // Calculate all 8 corners
        const corners = [
            new Vector3().copy(c)
                .add(e1.clone().multiplyScalar(hs.x))
                .add(e2.clone().multiplyScalar(hs.y))
                .add(e3.clone().multiplyScalar(hs.z)),
            new Vector3().copy(c)
                .add(e1.clone().multiplyScalar(-hs.x))
                .add(e2.clone().multiplyScalar(hs.y))
                .add(e3.clone().multiplyScalar(hs.z)),
            new Vector3().copy(c)
                .add(e1.clone().multiplyScalar(-hs.x))
                .add(e2.clone().multiplyScalar(-hs.y))
                .add(e3.clone().multiplyScalar(hs.z)),
            new Vector3().copy(c)
                .add(e1.clone().multiplyScalar(hs.x))
                .add(e2.clone().multiplyScalar(-hs.y))
                .add(e3.clone().multiplyScalar(hs.z)),
            new Vector3().copy(c)
                .add(e1.clone().multiplyScalar(hs.x))
                .add(e2.clone().multiplyScalar(hs.y))
                .add(e3.clone().multiplyScalar(-hs.z)),
            new Vector3().copy(c)
                .add(e1.clone().multiplyScalar(-hs.x))
                .add(e2.clone().multiplyScalar(hs.y))
                .add(e3.clone().multiplyScalar(-hs.z)),
            new Vector3().copy(c)
                .add(e1.clone().multiplyScalar(-hs.x))
                .add(e2.clone().multiplyScalar(-hs.y))
                .add(e3.clone().multiplyScalar(-hs.z)),
            new Vector3().copy(c)
                .add(e1.clone().multiplyScalar(hs.x))
                .add(e2.clone().multiplyScalar(-hs.y))
                .add(e3.clone().multiplyScalar(-hs.z)),
        ];
    
        // Define the edges by connecting the corners
        const edges = [
            0, 1, 1, 2, 2, 3, 3, 0, // Top face
            4, 5, 5, 6, 6, 7, 7, 4, // Bottom face
            0, 4, 1, 5, 2, 6, 3, 7  // Side edges
        ];
    
        // Create geometry and add line segments
        const geometry = new BufferGeometry().setFromPoints(corners);
        geometry.setIndex(edges);
        geometry.computeBoundingSphere();
    
        // Create line material
        const material = new LineBasicMaterial({ color: 0xff0000 });
    
        // Create the wireframe mesh
        const wireframe = new LineSegments(geometry, material);
    
        wireframe.dispose = ()=>{
            material.dispose();
            geometry.dispose();
        }
        return wireframe;
    }

}

export { OBB };