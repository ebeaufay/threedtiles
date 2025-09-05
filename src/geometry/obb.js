

import { Matrix3, Matrix4, Ray, Sphere, Vector3, Box3, BufferGeometry, LineSegments, LineBasicMaterial } from "three";

const tempMatrix = new Matrix3();
const tempVector3 = new Vector3();
const size = new Vector3();
const aabb = new Box3();
const matrix = new Matrix4();
const inverse = new Matrix4();
const localRay = new Ray();

class OBB {
    /**
     * Creates an oriented-bounding-box (OBB) from a 12-element numeric array.
     *
     * @param {number[]} values 12 numbers:  
     * `[cx, cy, cz, e1x, e1y, e1z, e2x, e2y, e2z, e3x, e3y, e3z]` where  
     * `center = (cx, cy, cz)` and `e1 e2 e3` are the local edge vectors.
     * @constructor
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:0]{index=0}
    */constructor(values) {
        this.isOBB = true;
        this.center = new Vector3(values[0], values[1], values[2]);
        this.e1 = new Vector3(values[3], values[4], values[5]);
        this.e2 = new Vector3(values[6], values[7], values[8]);
        this.e3 = new Vector3(values[9], values[10], values[11]);

        this.halfSize = new Vector3(this.e1.length(), this.e2.length(), this.e3.length());

        this.e1.normalize();
        // make e2 orthogonal to e1
        const dot12 = this.e2.dot(this.e1);
        this.e2.addScaledVector(this.e1, -dot12).normalize();
        // e3 as cross to ensure orthonormal frame
        this.e3.copy(this.e1).cross(this.e2);
        if (this.e3.lengthSq() === 0) {
            // fallback if inputs were collinear
            this.e2.set(0, 1, 0);
            if (Math.abs(this.e1.y) > 0.999) this.e2.set(1, 0, 0);
            this.e2.addScaledVector(this.e1, -this.e2.dot(this.e1)).normalize();
            this.e3.copy(this.e1).cross(this.e2);
        } else {
            this.e3.normalize();
        }

        this.rotationMatrix = new Matrix3();
        this.rotationMatrix.set(
            this.e1.x, this.e2.x, this.e3.x,
            this.e1.y, this.e2.y, this.e3.y,
            this.e1.z, this.e2.z, this.e3.z);
    }

    /**
     * Copy all geometric properties from another {@link OBB}.
     *
     * @param {OBB} aObb Source OBB whose data will be copied.
     * @returns {void}
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:1]{index=1}
    */
    copy(aObb) {
        this.center.copy(aObb.center);
        this.rotationMatrix.copy(aObb.rotationMatrix);
        this.halfSize.copy(aObb.halfSize);
        this.e1.copy(aObb.e1);
        this.e2.copy(aObb.e2);
        this.e3.copy(aObb.e3);
    }

    /**
     * Get the full **size** (width, height, depth) of this OBB.
     *
     * @param {THREE.Vector3} result Pre-allocated vector that receives the size.
     * @returns {THREE.Vector3} The same `result` instance for chaining.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:2]{index=2}
     */
    getSize(result) {

        return result.copy(this.halfSize).multiplyScalar(2);

    }

    /**
     * Apply an arbitrary affine transformation to this OBB.
     *
     * Scales, rotations (including non-uniform scale & reflection) and translations
     * encoded in the 4×4 matrix are baked into `center`, `rotationMatrix`
     * and `halfSize`.
     *
     * @param {THREE.Matrix4} matrix World-space transform to apply.
     * @returns {OBB} This instance for chaining.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:3]{index=3}
     */applyMatrix4(matrix) {
        const e = matrix.elements;

        let sx = tempVector3.set(e[0], e[1], e[2]).length();
        let sy = tempVector3.set(e[4], e[5], e[6]).length();
        let sz = tempVector3.set(e[8], e[9], e[10]).length();

        tempMatrix.setFromMatrix4(matrix);

        const invSX = sx !== 0 ? 1 / sx : 0;
        const invSY = sy !== 0 ? 1 / sy : 0;
        const invSZ = sz !== 0 ? 1 / sz : 0;

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

        this.halfSize.x *= Math.abs(sx);
        this.halfSize.y *= Math.abs(sy);
        this.halfSize.z *= Math.abs(sz);

        this.center.applyMatrix4(matrix);
        this.rotationMatrix.extractBasis(this.e1, this.e2, this.e3);
        return this;
    }

    /**
     * Compute the exact intersection point between a world-space ray and this OBB.
     *
     * @param {THREE.Ray} ray Ray expressed in world coordinates.
     * @param {THREE.Vector3} result Vector that receives the intersection point.
     * @returns {?THREE.Vector3} `result` with the hit point, or `null` if no hit.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:4]{index=4}
     */intersectRay(ray, result) {

        this.getSize(size);
        aabb.setFromCenterAndSize(tempVector3.set(0, 0, 0), size);

        const RT = tempMatrix.copy(this.rotationMatrix).transpose();

        localRay.origin.copy(ray.origin).sub(this.center).applyMatrix3(RT);
        localRay.direction.copy(ray.direction).applyMatrix3(RT).normalize();

        if (localRay.intersectBox(aabb, result)) {
            return result
                .applyMatrix3(this.rotationMatrix)
                .add(this.center);
        } else {
            return null;
        }
    }

    /**
     * Clamp a point to the surface or interior of the OBB (closest point query).
     *
     * @param {THREE.Vector3} point World-space point to be clamped.
     * @param {THREE.Vector3} target Vector that will receive the clamped point.
     * @returns {THREE.Vector3} The same `target` instance for chaining.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:5]{index=5}
     */
    clampPoint(point, target) {

        // point → local coordinates of this OBB
        tempVector3.copy(point).sub(this.center);

        const lx = tempVector3.dot(this.e1);
        const ly = tempVector3.dot(this.e2);
        const lz = tempVector3.dot(this.e3);

        // clamp each local coordinate to the half-extents
        const cx = Math.max(- this.halfSize.x, Math.min(this.halfSize.x, lx));
        const cy = Math.max(- this.halfSize.y, Math.min(this.halfSize.y, ly));
        const cz = Math.max(- this.halfSize.z, Math.min(this.halfSize.z, lz));

        // local → world
        return target
            .copy(this.center)
            .addScaledVector(this.e1, cx)
            .addScaledVector(this.e2, cy)
            .addScaledVector(this.e3, cz);

    }

    /**
     * Test whether a {@link THREE.Sphere} intersects or is contained by this OBB.
     *
     * @param {THREE.Sphere} sphere Sphere to test.
     * @returns {boolean} `true` if the sphere overlaps the OBB.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:6]{index=6}
     */
    intersectsSphere(sphere) {

        // get nearest point on the box to the sphere centre
        this.clampPoint(sphere.center, tempVector3);

        // inside sphere?
        return tempVector3.distanceToSquared(sphere.center) <= sphere.radius * sphere.radius;

    }

    /**
     * Separating-Axis-Theorem (SAT) intersection test between two OBBs.
     *
     * @param {OBB} other The second OBB.
     * @param {number} [epsilon=Number.EPSILON] Numerical tolerance for stability.
     * @returns {boolean} `true` if the two OBBs overlap.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:7]{index=7}
     */
    intersectsOBB(other, epsilon = Number.EPSILON) {

        const uA = [this.e1, this.e2, this.e3];
        const uB = [other.e1, other.e2, other.e3];
        const aE = [this.halfSize.x, this.halfSize.y, this.halfSize.z];
        const bE = [other.halfSize.x, other.halfSize.y, other.halfSize.z];

        // rotation matrix & absolute value matrix
        const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        const AbsR = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                R[i][j] = uA[i].dot(uB[j]);
                AbsR[i][j] = Math.abs(R[i][j]) + epsilon;
            }
        }

        // translation vector (world) → A-space
        tempVector3.subVectors(other.center, this.center);
        const t = [
            tempVector3.dot(uA[0]),
            tempVector3.dot(uA[1]),
            tempVector3.dot(uA[2])
        ];

        let ra, rb;

        // 3 face axes of A
        for (let i = 0; i < 3; ++i) {
            ra = aE[i];
            rb = bE[0] * AbsR[i][0] + bE[1] * AbsR[i][1] + bE[2] * AbsR[i][2];
            if (Math.abs(t[i]) > ra + rb) return false;
        }

        // 3 face axes of B
        for (let i = 0; i < 3; ++i) {
            ra = aE[0] * AbsR[0][i] + aE[1] * AbsR[1][i] + aE[2] * AbsR[2][i];
            rb = bE[i];
            if (Math.abs(t[0] * R[0][i] + t[1] * R[1][i] + t[2] * R[2][i]) > ra + rb) return false;
        }

        // 9 edge-cross-edge axes
        ra = aE[1] * AbsR[2][0] + aE[2] * AbsR[1][0];
        rb = bE[1] * AbsR[0][2] + bE[2] * AbsR[0][1];
        if (Math.abs(t[2] * R[1][0] - t[1] * R[2][0]) > ra + rb) return false;

        ra = aE[1] * AbsR[2][1] + aE[2] * AbsR[1][1];
        rb = bE[0] * AbsR[0][2] + bE[2] * AbsR[0][0];
        if (Math.abs(t[2] * R[1][1] - t[1] * R[2][1]) > ra + rb) return false;

        ra = aE[1] * AbsR[2][2] + aE[2] * AbsR[1][2];
        rb = bE[0] * AbsR[0][1] + bE[1] * AbsR[0][0];
        if (Math.abs(t[2] * R[1][2] - t[1] * R[2][2]) > ra + rb) return false;

        ra = aE[0] * AbsR[2][0] + aE[2] * AbsR[0][0];
        rb = bE[1] * AbsR[1][2] + bE[2] * AbsR[1][1];
        if (Math.abs(t[0] * R[2][0] - t[2] * R[0][0]) > ra + rb) return false;

        ra = aE[0] * AbsR[2][1] + aE[2] * AbsR[0][1];
        rb = bE[0] * AbsR[1][2] + bE[2] * AbsR[1][0];
        if (Math.abs(t[0] * R[2][1] - t[2] * R[0][1]) > ra + rb) return false;

        ra = aE[0] * AbsR[2][2] + aE[2] * AbsR[0][2];
        rb = bE[0] * AbsR[1][1] + bE[1] * AbsR[1][0];
        if (Math.abs(t[0] * R[2][2] - t[2] * R[0][2]) > ra + rb) return false;

        ra = aE[0] * AbsR[1][0] + aE[1] * AbsR[0][0];
        rb = bE[1] * AbsR[2][2] + bE[2] * AbsR[2][1];
        if (Math.abs(t[1] * R[0][0] - t[0] * R[1][0]) > ra + rb) return false;

        ra = aE[0] * AbsR[1][1] + aE[1] * AbsR[0][1];
        rb = bE[0] * AbsR[2][2] + bE[2] * AbsR[2][0];
        if (Math.abs(t[1] * R[0][1] - t[0] * R[1][1]) > ra + rb) return false;

        ra = aE[0] * AbsR[1][2] + aE[1] * AbsR[0][2];
        rb = bE[0] * AbsR[2][1] + bE[1] * AbsR[2][0];
        if (Math.abs(t[1] * R[0][2] - t[0] * R[1][2]) > ra + rb) return false;

        // no separating axis found → intersecting
        return true;

    }

    /**
     * Fast boolean ray-OBB intersection convenience method.
     *
     * @param {THREE.Ray} ray Ray expressed in world coordinates.
     * @returns {boolean} `true` if the ray intersects the OBB.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:8]{index=8}
     */
    intersectsRay(ray) {

        return this.intersectRay(ray, tempVector3) !== null;

    }

    /**
     * Determine whether the OBB lies on the positive side of (or intersects) a plane.
     *
     * The plane is interpreted as **inside-facing** when its normal points toward
     * the allowed half-space.
     *
     * @param {THREE.Plane} plane Plane used for the half-space test.
     * @returns {boolean} `true` if any part of the OBB is inside or touching the plane.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:9]{index=9}
     */insidePlane(plane) {
        const n = plane.normal;
        const nlen = n.length();
        if (nlen === 0) return true;
        const unit = tempVector3.copy(n).multiplyScalar(1 / nlen);
        const r = this.halfSize.x * Math.abs(unit.dot(this.e1)) +
                  this.halfSize.y * Math.abs(unit.dot(this.e2)) +
                  this.halfSize.z * Math.abs(unit.dot(this.e3));
        const d = n.dot(this.center) + plane.constant;
        return d >= -r * nlen;
    }

    /**
     * View-frustum culling test.
     *
     * @param {THREE.Frustum} frustum Frustum to test against.
     * @returns {boolean} `true` if this OBB is at least partially inside the frustum.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:10]{index=10}
     */
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

    /**
     * Compute the shortest Euclidean distance from the OBB to a point.
     *
     * @param {THREE.Vector3} point Point in world coordinates.
     * @returns {number} Distance (≥ 0). Zero indicates the point is inside.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:11]{index=11}
     */distanceToPoint(point) {

        tempVector3.copy(point);
        tempVector3.sub(this.center);
        const R_T = tempMatrix.copy(this.rotationMatrix).transpose();
        tempVector3.applyMatrix3(R_T);

        let dx = Math.max(0, Math.max(-this.halfSize.x - tempVector3.x, tempVector3.x - this.halfSize.x));
        let dy = Math.max(0, Math.max(-this.halfSize.y - tempVector3.y, tempVector3.y - this.halfSize.y));
        let dz = Math.max(0, Math.max(-this.halfSize.z - tempVector3.z, tempVector3.z - this.halfSize.z));
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Create a red wire-frame visual helper for debugging purposes.
     *
     * @returns {THREE.LineSegments} A disposable wireframe object that
     *          renders the eight corners and twelve edges of the OBB.
     * @memberof OBB
     * @see OBB implementation source :contentReference[oaicite:12]{index=12}
     */
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

        wireframe.dispose = () => {
            material.dispose();
            geometry.dispose();
        }
        return wireframe;
    }

}

export { OBB };