/**
 * Octree class for splats raycast.
 */
export class SplatsCollider {
    /**
     * @param {Box3} bounds - The bounding box of the octree node.
     * @param {number} maxPoints - Maximum number of points per node before subdivision.
     * @param {number} [threshold] - Optional threshold. If not provided, it defaults to bounds diagonal / 100000.
     */
    constructor(bounds: Box3, maxPoints: number, threshold?: number);
    bounds: Box3;
    maxPointsPerNode: number;
    points: any[];
    children: any[] | null;
    threshold: number;
    /**
     * Inserts a splat object into the Octree.
     * @param {Object} splat - The splat object with a Vector3 'center' property.
     */
    insert(splat: Object): void;
    /**
     * Queries the Octree with a Ray to find all splats within a threshold.
     * Returns the splats ordered front to back relative to the ray origin.
     * @param {Ray} ray - The three.js Ray object.
     * @param {number} [threshold=this.threshold] - The maximum allowed distance from the ray.
     * @returns {Array<{ t: number, splat: Object }>} - Array of splats within the threshold, sorted by t ascending.
     */
    query(ray: Ray, queryResults: any, threshold?: number): Array<{
        t: number;
        splat: Object;
    }>;
    /**
     * Recursively queries the Octree to find all splats within a threshold.
     * @private
     * @param {Ray} ray - The three.js Ray object.
     * @param {number} threshold - The maximum allowed distance from the ray.
     */
    private queryRecursive;
    /**
     * Determines which child Octree node the point belongs to.
     * @private
     * @param {Vector3} point - The point to determine the child index for.
     * @returns {number} - The index of the child node (0-7).
     */
    private getChildIndex;
    /**
 * Subdivides the current Octree node into eight children.
 * @private
 */
    private subdivide;
}
import { Box3 } from 'three';
import { Ray } from 'three';
