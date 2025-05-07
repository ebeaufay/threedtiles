export class InstancedTile extends THREE.Object3D<THREE.Object3DEventMap> {
    /**
     *
     * @param {
     *   json: optional,
     *   url: optional,
     *   rootPath: optional,
     *   parentGeometricError: optional,
     *   parentBoundingVolume: optional,
     *   parentRefinement: optional,
     *   loadOutsideView: Boolean,
     *   tileLoader : InstancedTileLoader,
     *   cameraOnLoad: camera,
     *   parentTile: OGC3DTile,
     *   onLoadCallback: function,
     *   centerModel: Boolean,
     *   queryParams: String,
     *   distanceBias: distanceBias
     * } properties
     */
    constructor(properties: any);
    queryParams: any;
    tileLoader: any;
    master: any;
    loadOutsideView: any;
    cameraOnLoad: any;
    parentTile: any;
    distanceBias: number;
    childrenTiles: any[];
    jsonChildren: any;
    meshContent: Set<any>;
    static: any;
    materialVisibility: boolean;
    inFrustum: boolean;
    level: any;
    hasMeshContent: number;
    hasUnloadedJSONContent: number;
    centerModel: any;
    deleted: boolean;
    abortController: AbortController;
    rootPath: any;
    loadJson(json: any, url: any): void;
    setup(properties: any): Promise<void>;
    isSetup: boolean | undefined;
    isAbsolutePathOrURL(input: any): any;
    assembleURL(root: any, relative: any): string;
    extractQueryParams(url: any, params: any): string;
    load(): void;
    loadMesh(mesh: any): void;
    dispose(): void;
    disposeChildren(): void;
    _update(camera: any, frustum: any): void;
    areAllChildrenLoadedAndHidden(): boolean;
    /**
     * Node is ready if it is outside frustum, if it was drawn at least once or if all it's children are ready
     * @returns true if ready
     */
    isReady(): boolean;
    changeContentVisibility(visibility: any): void;
    calculateUpdateMetric(camera: any, frustum: any): number;
    getSiblings(): any[];
    calculateDistanceToCamera(camera: any): number;
    getWorldMatrix(): THREE.Matrix4;
    transformWGS84ToCartesian(lon: any, lat: any, h: any, sfct: any): void;
}
import * as THREE from 'three';
