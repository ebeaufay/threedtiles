export class FeatureTable {
    constructor(buffer: any, start: any, headerLength: any, binLength: any);
    buffer: any;
    binOffset: any;
    binLength: any;
    header: any;
    getKeys(): string[];
    getData(key: any, count: any, defaultComponentType?: null, defaultType?: null): any;
}
export class BatchTable extends FeatureTable {
    constructor(buffer: any, batchSize: any, start: any, headerLength: any, binLength: any);
    batchSize: any;
    getData(key: any, componentType?: null, type?: null): any;
}
