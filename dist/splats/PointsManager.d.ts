export class PointsManager {
    constructor(sortCallback: any);
    points: Float32Array<ArrayBuffer>;
    distances: Uint32Array<ArrayBuffer>;
    pointSets: Map<any, any>;
    numUsed: number;
    sortOngoing: boolean;
    sortCallback: any;
    sortPromise: Promise<void>;
    hidePoints(insertionIndex: any): void;
    removePoints(insertionIndex: any): void;
    showPoints(insertionIndex: any): void;
    resizeArrays(newLength: any): void;
    addBatchesOffsetStrideCount(positions: any, insertionIndexes: any, offset: any, stride: any, batchSize: any): void;
    computeDistances(x: any, y: any, z: any): void;
    indexes: any;
    sort(xyz: any, id: any): void;
    pendingSort: any;
    pendingID: any;
    processSortQueue(): Promise<void>;
    initialized: boolean | undefined;
}
