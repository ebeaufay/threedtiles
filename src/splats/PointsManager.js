import init, { radix_sort_indices } from './radix/wasm_sorter.js';

const buffer = new ArrayBuffer(4);
const floatView = new Float32Array(buffer);
const uintView = new Uint32Array(buffer);

class PointsManager {
    constructor(sortCallback) {
        this.points = new Float32Array(4096  * 3);
        this.distances = new Uint32Array(4096);
        this.pointSets = new Map(); // Map<number, object>
        this.numUsed = 0;
        this.sortOngoing = false;
        this.sortCallback = sortCallback;
        this.sortPromise = Promise.resolve();
    }



    hidePoints(insertionIndex) {
        /* console.log("hide"); */
        const pointSet = this.pointSets.get(insertionIndex);
        if (pointSet.used) {
            pointSet.used = false;
        }
    }
    removePoints(insertionIndex) {
        /* console.log("remove"); */
        const pointSet = this.pointSets.get(insertionIndex);
        if (pointSet.used) {
            pointSet.used = false;
        }

        this.pointSets.delete(insertionIndex);

        // Determine newLength based on remaining points
        let newLength = 0;
        for (const [key, aPointSet] of this.pointSets.entries()) {
            if (key + aPointSet.length > newLength) {
                newLength = key + aPointSet.length;
            }
        }

    }
    showPoints(insertionIndex) {
        /* console.log("show"); */
        const pointSet = this.pointSets.get(insertionIndex);
        if (!pointSet.used) {
            pointSet.used = true;
        }

    }

    resizeArrays(newLength) {

        if (isNaN(newLength)) {
            console.log("hit max splats")
        }
        //console.log(newLength)
        if (newLength > this.points.length) {
            newLength = Math.max(this.points.length * 2, newLength);
            // Resize points array
            const newPoints = new Float32Array(newLength);
            newPoints.set(this.points, 0);
            this.points = newPoints;

            // Resize distances array
            const newNumPoints = Math.floor(newLength / 3);
            const newDistances = new Uint32Array(newNumPoints);
            newDistances.set(this.distances, 0);
            this.distances = newDistances;

        }

    }


    addBatchesOffsetStrideCount(positions, insertionIndexes, offset, stride, batchSize) {

        const newLength = Math.max(this.points.length, insertionIndexes[insertionIndexes.length - 1] + batchSize * 3);

        this.resizeArrays(newLength);
        for (let batchIndex = 0; batchIndex < insertionIndexes.length; batchIndex++) {

            const insertionIndex = insertionIndexes[batchIndex];
            const start = Math.floor(insertionIndex / 3);
            const batchPositionStartIndex = batchIndex * batchSize * stride;
            const batchNumPoints = Math.min((positions.length - batchPositionStartIndex) / stride, batchSize);


            for (let i = 0; i < batchNumPoints; i++) {

                this.points[insertionIndex + i * 3] = positions[i * stride + offset + batchPositionStartIndex]
                this.points[insertionIndex + i * 3 + 1] = positions[i * stride + offset + batchPositionStartIndex + 1]
                this.points[insertionIndex + i * 3 + 2] = positions[i * stride + offset + batchPositionStartIndex + 2]

            }
            this.pointSets.set(insertionIndex, { length: batchNumPoints * 3, used: false });


        }


    }




    computeDistances(x, y, z) {

        this.distances.fill(0);
        const keys = Array.from(this.pointSets.keys());
        const numKeys = keys.length;
        this.numUsed = 0;
        for (let i = 0; i < numKeys; i++) {
            const key = keys[i];
            const pointSet = this.pointSets.get(key);
            if (!pointSet.used) continue;
            const length = Math.floor(pointSet.length / 3);
            this.numUsed += length
        }
        //console.log("num used : "+this.numUsed);
        this.indexes = new Uint32Array(this.numUsed);
        this.distances = new Uint32Array(this.numUsed);
        let c = 0;
        for (let i = 0; i < numKeys; i++) {
            const key = keys[i];
            const keyBase = Math.floor(key / 3);
            const pointSet = this.pointSets.get(key);
            if (!pointSet.used) continue;
            const length = Math.floor(pointSet.length / 3);
            //this.numUsed += length
            for (let j = 0; j < length; j++) {
                const idx = key + (j * 3);
                const dx = x - this.points[idx];
                const dy = y - this.points[idx + 1];
                const dz = z - this.points[idx + 2];
                const d = dx*dx + dy*dy + dz*dz;
                floatView[0] = d;
                this.distances[c] = uintView[0];
                this.indexes[c++] = keyBase + j;
            }
        }
        
    }

    sort(xyz, id) {
        // Always store the latest sort request

        this.pendingSort = xyz;
        this.pendingID = id;
        //console.log(`Received sort request with ID: ${id}`);

        // If no sort is currently ongoing, start processing
        if (!this.sortOngoing) {
            this.sortOngoing = true;
            this.processSortQueue();
        }
    }

    // Asynchronous loop to process sort requests sequentially
    async processSortQueue() {
        if(!this.initialized){
            await init();
            this.initialized = true;
        }
        while (this.pendingSort) {
            const currentSort = this.pendingSort;
            const currentID = this.pendingID;

            // Clear the pending sort to capture any new requests during processing
            this.pendingSort = null;
            this.pendingID = null;

            //console.log(`Starting sort with ID: ${currentID}`);

            const start = performance.now();

            // Perform the synchronous sort operations
            this.computeDistances(currentSort[0], currentSort[1], currentSort[2]);
            //console.log((performance.now() - start)+' ms');
        
            //console.log(this.indexes.length)
            
            this.indexes = radix_sort_indices(this.indexes, this.distances);
            /* radixSort(this.indexes, {
                get: (el) => this.distances[el],
                reversed: true
            }); */
            
            const duration = performance.now() - start;
            //console.log(`Sort with ID: ${currentID} completed in ${duration.toFixed(2)}ms`);

            // Callback after sorting is done
            this.sortCallback(this.indexes, this.numUsed, currentID);

            // Yield control to the event loop to handle new incoming sort requests
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // No more pending sorts
        this.sortOngoing = false;
        //console.log("No more pending sorts. SortWorker is idle.");
    }
} export { PointsManager }