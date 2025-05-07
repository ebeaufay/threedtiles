export class JsonTile {
    count: number;
    instancedTiles: any[];
    addInstance(instanceTile: any): void;
    setObject(json: any, url: any): void;
    json: any;
    url: any;
    getCount(): number;
    update(): void;
    dispose(): boolean;
}
