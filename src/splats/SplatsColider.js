// Import necessary classes from three.js
import { Box3, Vector3, Ray } from 'three';


const tmpBox3 = new Box3();
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
const tmpVector3 = new Vector3();
const tmpVector4 = new Vector3();


/**
 * Octree class for splats raycast.
 */
class SplatsCollider {
    /**
     * @param {Box3} bounds - The bounding box of the octree node.
     * @param {number} maxPoints - Maximum number of points per node before subdivision.
     * @param {number} [threshold] - Optional threshold. If not provided, it defaults to bounds diagonal / 100000.
     */
    constructor(bounds, maxPoints, threshold = undefined) {
        this.bounds = new Box3();
        this.bounds.copy(bounds);
        this.maxPointsPerNode = maxPoints;
        this.points = [];
        this.children = null;

        if (threshold !== undefined) {
            this.threshold = threshold;
        } else {
            tmpVector1.subVectors(bounds.max, bounds.min);
            this.threshold = tmpVector1.length() / 100000;
        }
    }

    /**
     * Inserts a splat object into the Octree.
     * @param {Object} splat - The splat object with a Vector3 'center' property.
     */
    insert(splat) {
        const center = splat.center;

        if (!this.bounds.containsPoint(center)) return;

        if (this.children === null) {
            if (this.points.length < this.maxPointsPerNode) {
                this.points.push(splat);
            } else {
                this.subdivide();
                this.insert(splat);
            }
        } else {
            const index = this.getChildIndex(center);
            this.children[index].insert(splat);
        }
    }

    /**
     * Queries the Octree with a Ray to find all splats within a threshold.
     * Returns the splats ordered front to back relative to the ray origin.
     * @param {Ray} ray - The three.js Ray object.
     * @param {number} [threshold=this.threshold] - The maximum allowed distance from the ray.
     * @returns {Array<{ t: number, splat: Object }>} - Array of splats within the threshold, sorted by t ascending.
     */
    query(ray, queryResults, threshold = this.threshold) {
        this.queryRecursive(ray, queryResults, threshold);
    }

    /**
     * Recursively queries the Octree to find all splats within a threshold.
     * @private
     * @param {Ray} ray - The three.js Ray object.
     * @param {number} threshold - The maximum allowed distance from the ray.
     */
    queryRecursive(ray, queryResults, threshold) {
        // Expand the bounds by the threshold
        tmpBox3.copy(this.bounds).expandByScalar(threshold);

        // Check if the ray intersects the expanded bounds
        if (!ray.intersectBox(tmpBox3, tmpVector1)) return;

        if (this.children === null) {
            for (let splat of this.points) {
                const center = splat.center;

                // Find the closest point on the ray to the splat center
                ray.closestPointToPoint(center, tmpVector1);

                // Vector from ray origin to the closest point
                tmpVector2.copy(tmpVector1).sub(ray.origin);

                // Calculate t parameter along the ray
                const t = tmpVector2.dot(ray.direction);

                // Ignore splats behind the ray origin
                if (t < 0) continue;

                // Calculate the distance from the splat center to the closest point on the ray
                const distance = center.distanceTo(tmpVector1);

                if (distance <= threshold) {
                    // Add the splat and its t to the query results
                    queryResults.push({ distance: t, point: center });
                }
            }
        } else {
            for (let child of this.children) {
                child.queryRecursive(ray, queryResults, threshold);
            }
        }
    }

    /**
     * Determines which child Octree node the point belongs to.
     * @private
     * @param {Vector3} point - The point to determine the child index for.
     * @returns {number} - The index of the child node (0-7).
     */
    getChildIndex(point) {
        let index = 0;
        this.bounds.getCenter(tmpVector1);

        if (point.x >= tmpVector1.x) index |= 1;
        if (point.y >= tmpVector1.y) index |= 2;
        if (point.z >= tmpVector1.z) index |= 4;

        return index;
    }

    /**
 * Subdivides the current Octree node into eight children.
 * @private
 */
    subdivide() {
        this.children = new Array(8);

        // Calculate half the size of the current node's bounds
        tmpVector1.copy(this.bounds.max).sub(this.bounds.min).multiplyScalar(0.5); // size / 2

        // Copy the minimum bounds of the current node
        const parentMin = tmpVector2.copy(this.bounds.min);

        for (let i = 0; i < 8; i++) {
            // Start with the parent minimum bounds
            tmpVector3.copy(parentMin);

            // Adjust the child min based on the index bits
            if (i & 1) tmpVector3.x += tmpVector1.x;
            if (i & 2) tmpVector3.y += tmpVector1.y;
            if (i & 4) tmpVector3.z += tmpVector1.z;

            // Calculate child max by adding the half size to child min
            tmpVector4.copy(tmpVector3).add(tmpVector1); // childMax = childMin + halfSize

            // Set up child bounds using pre-defined temporary Box3
            tmpBox3.set(tmpVector3, tmpVector4);

            // Create a new child Octree node with the calculated bounds
            this.children[i] = new SplatsCollider(tmpBox3, this.maxPointsPerNode, this.threshold);
        }

        // Re-insert existing splats into the appropriate children
        for (let splat of this.points) {
            const index = this.getChildIndex(splat.center);
            this.children[index].insert(splat);
        }

        // Clear points from the current node
        this.points = null;
    }
}

export { SplatsCollider };
