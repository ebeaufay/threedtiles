import { PointsManager } from "./PointsManager";

/**
 * Important: radix_sort_indices returns a Uint32Array view into WebAssembly.Memory.
 * You cannot transfer a view backed by WASM memory (detaching it would break the module).
 * Therefore we must copy into a standalone ArrayBuffer before postMessage with transfer.
 */
const sortCallback = ((array, numUsed, id, sortPerf) => {
    // Copy only the used portion (array should already be length==numUsed)
    const copy = new Uint32Array(array.length);
    copy.set(array);
    postMessage({
        order: copy.buffer,
        count: numUsed,
        id: id,
        sortPerf: sortPerf
    }, [copy.buffer]);
});
let pointsManager;
self.onmessage = function (e) {

    try {

        switch (e.data.method) {
            
            case "addBatches":
                if (!pointsManager) {
                    pointsManager = new PointsManager(sortCallback);
                }
                pointsManager.addBatchesOffsetStrideCount(new Float32Array(e.data.positions), e.data.insertionIndexes, e.data.offset, e.data.stride, e.data.batchSize);
                break
            case "hide":

                if (!!pointsManager) {
                    pointsManager.hidePoints(e.data.insertionIndex);
                }

                break
            case "hideBatches":

                if (!!pointsManager) {
                    e.data.insertionIndexes.forEach(insertionIndex => {
                        pointsManager.hidePoints(insertionIndex);
                    });
                    pointsManager.sort(e.data.xyz, e.data.vpm, e.data.id)
                }

                break
            case "show":
                if (!!pointsManager) {
                    pointsManager.showPoints(e.data.insertionIndex);
                    pointsManager.sort(e.data.xyz, e.data.vpm, e.data.id)
                }

                break;
            case "showBatches":

                if (!!pointsManager) {
                    e.data.insertionIndexes.forEach(insertionIndex => {
                        pointsManager.showPoints(insertionIndex);
                    });
                    pointsManager.sort(e.data.xyz, e.data.vpm, e.data.id)
                }

                break
            case "remove":
                if (!!pointsManager) {
                    pointsManager.removePoints(e.data.insertionIndex);
                    pointsManager.sort(e.data.xyz, e.data.vpm, e.data.id)
                }

                break
            case "removeBatches":

                if (!!pointsManager) {
                    e.data.insertionIndexes.forEach(insertionIndex => {
                        pointsManager.removePoints(insertionIndex);
                    });
                    pointsManager.sort(e.data.xyz, e.data.vpm, e.data.id)
                }

                break
            case "sort":
                
                if (!!pointsManager) {
                    pointsManager.sort(e.data.xyz, e.data.vpm, e.data.id)
                }
                break
            default:
                throw new Error(`No method with name ${e.data.method}`)
        }
    } catch (error) {
        postMessage({ error: error.message })
    }
}