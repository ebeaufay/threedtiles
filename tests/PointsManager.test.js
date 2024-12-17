
import { describe, it, expect, vi } from 'vitest';
import { PointsManager } from '../src/splats/PointsManager.js';

// Mock the radixSort function from 'three/addons/utils/SortUtils.js'
/* vi.mock('three/addons/utils/SortUtils.js', () => ({
  radixSort: (indexes, options) => {
    // Simple mock: sort the indexes based on the distances
    indexes.sort((a, b) => options.get(a) - options.get(b));
  },
})); */

describe('PointsManager', () => {
    it('should call sortCallback with sorted indexes after sorting', async () => {
        const mockCallback = vi.fn();
        const pointsManager = new PointsManager(mockCallback);

        const positions = new Float32Array([
            1.0, 1.0, 1.0, // Point 0
            2.0, 2.0, 2.0, // Point 1
            3.0, 3.0, 3.0, // Point 2
        ]);
        const insertionIndexes = [0, 3, 6];
        const offset = 0;
        const stride = 3;
        const batchSize = 1;

        pointsManager.addBatchesOffsetStrideCount(positions, insertionIndexes, offset, stride, batchSize);
        insertionIndexes.forEach(insertionIndex => pointsManager.showPoints(insertionIndex));

        vi.useFakeTimers();

        const xyz = [0, 0, 0];
        pointsManager.sort(xyz);

        // Advance all timers and wait for all pending promises to resolve
        await vi.runAllTimersAsync();

        expect(mockCallback).toHaveBeenCalledTimes(1);

        const sortedIndexes = mockCallback.mock.calls[0][0];

        expect(sortedIndexes).toEqual(new Uint32Array([2, 1, 0]));

        // Restore real timers
        vi.useRealTimers();
    });

    it('insertionIndexes with gap', async () => {
        const mockCallback = vi.fn();
        const pointsManager = new PointsManager(mockCallback);

        const positions = new Float32Array([
            1.0, 1.0, 1.0, // Point 0
            2.0, 2.0, 2.0, // Point 1
            3.0, 3.0, 3.0, // Point 2
        ]);
        const insertionIndexes = [0, 3, 9];
        const offset = 0;
        const stride = 3;
        const batchSize = 1;

        pointsManager.addBatchesOffsetStrideCount(positions, insertionIndexes, offset, stride, batchSize);
        insertionIndexes.forEach(insertionIndex => pointsManager.showPoints(insertionIndex))
        vi.useFakeTimers();

        const xyz = [0, 0, 0];
        pointsManager.sort(xyz);

        await vi.runAllTimersAsync();

        expect(mockCallback).toHaveBeenCalledTimes(1);

        const sortedIndexes = mockCallback.mock.calls[0][0];


        expect(sortedIndexes).toEqual(new Uint32Array([3, 1, 0, 2]));

        // Restore real timers
        vi.useRealTimers();
    });

    it('stride and offset test', async () => {
        const mockCallback = vi.fn();
        const pointsManager = new PointsManager(mockCallback);

        let positions = new Float32Array([
            1.0, 1.0, 1.0, 0.0, // Point 0
            2.0, 2.0, 2.0, 0.0, // Point 1
            3.0, 3.0, 3.0, 0.0, // Point 2
        ]);
        let insertionIndexes = [0, 3, 6];
        let offset = 0;
        let stride = 4;
        let batchSize = 1;

        pointsManager.addBatchesOffsetStrideCount(positions, insertionIndexes, offset, stride, batchSize);
        insertionIndexes.forEach(insertionIndex => pointsManager.showPoints(insertionIndex))


        positions = new Float32Array([
            0.0, 4.0, 4.0, 4.0, // Point 0
            0.0, 5.0, 5.0, 5.0, // Point 1
            0.0, 6.0, 6.0, 6.0, // Point 2
        ]);
        insertionIndexes = [9, 12, 15];
        offset = 1;
        stride = 4;
        batchSize = 1;

        pointsManager.addBatchesOffsetStrideCount(positions, insertionIndexes, offset, stride, batchSize);
        insertionIndexes.forEach(insertionIndex => pointsManager.showPoints(insertionIndex))
        vi.useFakeTimers();

        const xyz = [0, 0, 0];
        pointsManager.sort(xyz);

        await vi.runAllTimersAsync();

        expect(mockCallback).toHaveBeenCalledTimes(1);

        const sortedIndexes = mockCallback.mock.calls[0][0];


        expect(sortedIndexes).toEqual(new Uint32Array([5,4,3,2,1,0]));

        // Restore real timers
        vi.useRealTimers();
    });

    it('remove/hide', async () => {
        const mockCallback = vi.fn();
        const pointsManager = new PointsManager(mockCallback);

        let positions = new Float32Array([
            1.0, 1.0, 1.0, 0.0, // Point 0
            2.0, 2.0, 2.0, 0.0, // Point 1
            3.0, 3.0, 3.0, 0.0, // Point 2
        ]);
        let insertionIndexes = [0, 3, 6];
        let offset = 0;
        let stride = 4;
        let batchSize = 1;

        pointsManager.addBatchesOffsetStrideCount(positions, insertionIndexes, offset, stride, batchSize);
        insertionIndexes.forEach(insertionIndex => pointsManager.showPoints(insertionIndex))


        positions = new Float32Array([
            0.0, 4.0, 4.0, 4.0, // Point 0
            0.0, 5.0, 5.0, 5.0, // Point 1
            0.0, 6.0, 6.0, 6.0, // Point 2
        ]);
        insertionIndexes = [9, 12, 15];
        offset = 1;
        stride = 4;
        batchSize = 1;

        pointsManager.addBatchesOffsetStrideCount(positions, insertionIndexes, offset, stride, batchSize);
        insertionIndexes.forEach(insertionIndex => pointsManager.showPoints(insertionIndex))

        pointsManager.removePoints(3);
        pointsManager.hidePoints(12);
        vi.useFakeTimers();

        const xyz = [0, 0, 0];
        pointsManager.sort(xyz);

        await vi.runAllTimersAsync();

        expect(mockCallback).toHaveBeenCalledTimes(1);

        const sortedIndexes = mockCallback.mock.calls[0][0];


        expect(sortedIndexes).toEqual(new Uint32Array([5,3,2,0,1,4]));

        // Restore real timers
        vi.useRealTimers();
    });

    it('large Batches', async () => {
        const mockCallback = vi.fn();
        const pointsManager = new PointsManager(mockCallback);

        let positions = new Float32Array([
            1.0, 1.0, 1.0, 0.0,
            2.0, 2.0, 2.0, 0.0, 
            3.0, 3.0, 3.0, 0.0,
            4.0, 4.0, 4.0, 0.0, 
        ]);
        let insertionIndexes = [0, 18];
        let offset = 0;
        let stride = 4;
        let batchSize = 2;

        pointsManager.addBatchesOffsetStrideCount(positions, insertionIndexes, offset, stride, batchSize);
        insertionIndexes.forEach(insertionIndex => pointsManager.showPoints(insertionIndex))


        positions = new Float32Array([
            0.0, 5.0, 5.0, 5.0,
            0.0, 6.0, 6.0, 6.0,
            0.0, 7.0, 7.0, 7.0,
            0.0, 8.0, 8.0, 8.0,
        ]);
        insertionIndexes = [6,12];
        offset = 1;
        stride = 4;
        batchSize = 2;

        pointsManager.addBatchesOffsetStrideCount(positions, insertionIndexes, offset, stride, batchSize);
        insertionIndexes.forEach(insertionIndex => pointsManager.showPoints(insertionIndex))

        //pointsManager.removePoints(3);
        //pointsManager.hidePoints(12);
        vi.useFakeTimers();

        const xyz = [0, 0, 0];
        pointsManager.sort(xyz);

        await vi.runAllTimersAsync();

        expect(mockCallback).toHaveBeenCalledTimes(1);

        const sortedIndexes = mockCallback.mock.calls[0][0];


        expect(sortedIndexes).toEqual(new Uint32Array([5,4,3,2,7,6,1,0]));

        // Restore real timers
        vi.useRealTimers();
    });

    it('performance', async () => {
        // Create a mock callback
        const mockCallback = vi.fn();
    
        // Instantiate PointManager with the mock callback
        const pointsManager = new PointsManager(mockCallback);
    
        const numPoints = 1000000; // One million points
        const positions = new Float32Array(numPoints * 3);
        const insertionIndexes = [];
    
        // Generate one million points and corresponding insertion indexes
        for (let i = 0; i < numPoints; i++) {
          positions[i * 3] = Math.random();     // x-coordinate
          positions[i * 3 + 1] = Math.random(); // y-coordinate
          positions[i * 3 + 2] = Math.random(); // z-coordinate
        }
    
        const offset = 0;
        const stride = 3;
        const batchSize = numPoints;
    
        // Add the points to the PointManager
        pointsManager.addBatchesOffsetStrideCount(positions, [0], offset, stride, batchSize);
    
        // Optionally, show all points (this could be optimized or batched differently)
        pointsManager.showPoints(0)
    
        // Define the xyz coordinates for sorting
        const xyz = [0, 0, 0];
    
        let totalDuration = 0;
        // Record the start time using performance.now()
        //warmup
        for(let i = 0; i<10;i++){
            const callbackPromise = new Promise(resolve => {
              mockCallback.mockImplementation(sortedIndexes => {
                resolve();
              });
            });
            pointsManager.sort(xyz);
            await callbackPromise;
            
        }
        for(let i = 0; i<50;i++){
            const startTime = performance.now();
    
            // Create a promise that resolves when the callback is called
            const callbackPromise = new Promise(resolve => {
              mockCallback.mockImplementation(sortedIndexes => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                resolve(duration);
              });
            });
            pointsManager.sort(xyz);
            const duration = await callbackPromise;
            expect(duration).toBeLessThanOrEqual(100);
            totalDuration+=duration;
            
        }
        console.log(`Sort Average Time 1M points : ${(totalDuration/50).toFixed(2)} ms`);
        
      }, 5000); // Optional: Increase the test timeout if necessary (e.g., 200 ms)
});

