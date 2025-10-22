import {
    Mesh, InstancedMesh, ShaderMaterial, Vector2, Vector3, Vector4, Box2, Box3, DataArrayTexture,
    FloatType, HalfFloatType, RGBAFormat, FrontSide, AlwaysDepth, PlaneGeometry, Matrix3,
    NearestFilter, Data3DTexture, DataTexture, UnsignedByteType, BufferAttribute, InstancedBufferAttribute, DynamicDrawUsage,
    LinearSRGBColorSpace, InstancedBufferGeometry,
    WebGL3DRenderTarget, OrthographicCamera, Scene,
    NeverDepth, MathUtils, GLSL3, DataUtils, CustomBlending, OneMinusSrcAlphaFactor, OneFactor, Matrix4,
    NormalBlending
} from "three";
import { gamma } from 'mathjs';
import {
    MinPriorityQueue
} from 'data-structure-typed';
import { SplatsCollider } from "./SplatsColider";
import WorkerConstructor from './PointsManager.worker.js?worker&inline';

const tmpVector = new Vector3();
const tmpVector2 = new Vector3();
const zUpToYUpMatrix3x3 = new Matrix3();
zUpToYUpMatrix3x3.set(
    1, 0, 0,
    0, 0, 1,
    0, -1, 0);
    const inverseZUpToYUpMatrix4x4 = new Matrix4().set(
        1, 0,  0, 0, 
        0, 0, -1, 0, 
        0, 1,  0, 0, 
        0, 0,  0, 1
    );

function packHalf2x16(x, y) {
    return (DataUtils.toHalfFloat(x) | (DataUtils.toHalfFloat(y) << 16)) >>> 0;
}
class SplatsMesh extends Mesh {
    constructor(renderer, isStatic, fragShader, scaleMultiplier) {

        const textureSize = 1024;

        const numTextures = 1;
        const batchSize = Math.min(Math.ceil(4096 / textureSize) * textureSize, Math.pow(textureSize, 2));
        let maxSplats = numTextures * Math.pow(textureSize, 2);
        maxSplats = Math.floor(maxSplats / batchSize) * batchSize;


        const positionColorRenderTarget = new WebGL3DRenderTarget(textureSize, textureSize, numTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            type: FloatType,
            format: RGBAFormat,
            anisotropy: 0,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        positionColorRenderTarget.texture.type = FloatType;
        positionColorRenderTarget.texture.format = RGBAFormat;
        positionColorRenderTarget.texture.internalFormat = 'RGBA32F';
        renderer.initRenderTarget(positionColorRenderTarget);


        const covarianceRenderTarget = new WebGL3DRenderTarget(textureSize, textureSize, numTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            type: FloatType,
            format: RGBAFormat,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        covarianceRenderTarget.texture.type = FloatType;
        covarianceRenderTarget.texture.format = RGBAFormat;
        covarianceRenderTarget.texture.internalFormat = 'RGBA32F';
        renderer.initRenderTarget(covarianceRenderTarget);



        const material = new ShaderMaterial(
            {
                glslVersion: GLSL3,
                uniforms: {
                    textureSize: { value: textureSize },
                    numSlices: { value: numTextures },
                    covarianceTexture: { value: covarianceRenderTarget.texture },
                    positionColorTexture: { value: positionColorRenderTarget.texture },
                    zUpToYUpMatrix3x3: { value: zUpToYUpMatrix3x3 },
                    sizeMultiplier: { value: 1*(scaleMultiplier||1) },
                    cropRadius: { value: Number.MAX_VALUE },
                    //cameraNear: { value: 0.01 },
                    //cameraFar: { value: 10 },
                    //computeLinearDepth: { value: true },
                    viewportPixelSize: { value: new Vector2() },
                    k: { value: 2 },
                    beta_k: { value: 2 },
                    minSplatPixelSize: { value: 0 },
                    minOpacity: { value: 0.01 },
                    culling: {value: false},
                    antialiasingFactor: {value: 2.0},
                    depthBias: {value: 0.0}
                },
                vertexShader: splatsVertexShader(),
                fragmentShader: fragShader ? fragShader : splatsFragmentShader(),
                transparent: true,
                side: FrontSide,
                depthTest: true,
                depthWrite: false,
                blending: NormalBlending,
            }
        );

        
        const geometry = new InstancedBufferGeometry();
        const vertices = new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
        const indices = [0, 2, 1, 2, 3, 1];

        geometry.setIndex(indices);
        geometry.setAttribute('position', new BufferAttribute(vertices, 3));
        const order = new Uint32Array(maxSplats);

        const orderAttribute = new InstancedBufferAttribute(order, 1, false);
        orderAttribute.needsUpdate = true
        orderAttribute.setUsage(DynamicDrawUsage);
        geometry.setAttribute('order', orderAttribute);
        geometry.instanceCount = 0;


        super(geometry, material);
        this.scaleMultiplier = scaleMultiplier;
        this.matrixAutoUpdate = false;
        this.numBatches = 0;
        this.numVisibleBatches = 0;
        this.orderAttribute = orderAttribute;
        this.textureSize = textureSize;
        this.numTextures = numTextures;
        this.batchSize = batchSize;
        this.maxSplats = maxSplats;
        this.numSplatsRendered = 0;

        this.positionColorRenderTarget = positionColorRenderTarget;
        this.covarianceRenderTarget = covarianceRenderTarget;

        this.renderer = renderer;

        this.sortID = 0;

        this.freeAddresses = new MinPriorityQueue();
        for (let i = 0; i < this.maxSplats; i += batchSize) {
            this.freeAddresses.add(i);
        }

        this.worker = new WorkerConstructor();

        this.sortListeners = [];
        this.worker.onmessage = message => {
            const newOrder = new Uint32Array(message.data.order);
            this.numSplatsRendered = newOrder.length;
            //console.log(newOrder.length)
            if (newOrder.length > this.orderAttribute.count) {
                const geometry = new InstancedBufferGeometry();
                const vertices = new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
                const indices = [0, 2, 1, 2, 3, 1];

                geometry.setIndex(indices);
                geometry.setAttribute('position', new BufferAttribute(vertices, 3));
                const order = new Uint32Array(this.maxSplats);

                const orderAttribute = new InstancedBufferAttribute(order, 1, false);
                orderAttribute.needsUpdate = true
                orderAttribute.setUsage(DynamicDrawUsage);
                geometry.setAttribute('order', orderAttribute);
                geometry.instanceCount = 0;

                this.geometry.dispose();
                this.geometry = geometry;
                this.orderAttribute = orderAttribute;
            }
            this.orderAttribute.clearUpdateRanges();
            this.orderAttribute.set(newOrder);
            this.orderAttribute.addUpdateRange(0, newOrder.length);
            this.orderAttribute.needsUpdate = true;
            this.geometry.instanceCount = message.data.count;
            //console.log(this.geometry.instanceCount)
            this.geometry.needsUpdate = true;
            for (let i = this.sortListeners.length - 1; i >= 0; i--) {
                const done = this.sortListeners[i](message.data.id);
                if (done) {
                    this.sortListeners.splice(i, 1);
                }
            }
        }
        this.cameraPosition = new Vector3(0, 0, 0);
        this.viewProjModel;
        this.rotateOnAxis(new Vector3(1, 0, 0), Math.PI * 0.5);
        this.frustumCulled = false;


        /// Copy setup ///
        this.copyMaterial2D = new ShaderMaterial(
            {
                glslVersion: GLSL3,
                uniforms: {
                    sourceTexture: {},
                },
                vertexShader: vertexCopyShader(),
                fragmentShader: fragmentCopyShader2D(),
                transparent: false,
                side: FrontSide,
                depthTest: false,
                depthWrite: false
            }
        );
        this.copyMaterial3D = new ShaderMaterial(
            {
                glslVersion: GLSL3,
                uniforms: {
                    sourceTexture: {},
                    w: { value: 0.0 }
                },
                vertexShader: vertexCopyShader(),
                fragmentShader: fragmentCopyShader3D(),
                transparent: false,
                side: FrontSide,
                depthTest: false,
                depthWrite: false
            }
        );
        this.copyCamera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
        this.copyCamera.position.z = 1;
        this.copyScene = new Scene();
        const copyGeometry = new PlaneGeometry(1, 1);
        this.copyQuad = new Mesh(copyGeometry, this.copyMaterial2D);
        this.copyScene.add(this.copyQuad);
        this.copyScene.matrixAutoUpdate = false;
        this.copyQuad.matrixAutoUpdate = false;
        this.splatsCPUCuling = false;

    }
    /**
     * Sets the splats visualization quality where 1 is the maximum quality and 0 is the fastest
     * @param {number} quality value between 0 and 1 (1 highest quality) 
     */
    setQuality(quality) {
        quality = Math.max(0, Math.min(1, (1 - quality)));
        const k = 2 + quality * 2;
        this.material.uniforms.k.value = k;
        this.material.uniforms.beta_k.value = Math.pow((4.0 * gamma(2.0 / k)) / k, k / 2);
        this.material.uniforms.minSplatPixelSize.value = quality * 5;
        this.material.uniforms.minOpacity.value = 0.01;// + quality * 0.09;
    }
    setSplatsCPUCulling(splatsCPUCuling){
        this.splatsCPUCuling = splatsCPUCuling;
        this.material.uniforms.culling.value = splatsCPUCuling;
    }
    setDepthBias(depthBias){
        this.depthBias = depthBias;
        this.material.uniforms.depthBias.value = this.depthBias;
    }
    updateShaderParams(camera) {
        const proj = camera.projectionMatrix.elements;

        this.renderer.getSize(this.material.uniforms.viewportPixelSize.value);
        const pixelRatio = this.renderer.getPixelRatio();
        this.material.uniforms.viewportPixelSize.value.multiplyScalar(pixelRatio)
        if(pixelRatio<1){
            this.material.uniforms.antialiasingFactor.value = 2;//pixelRatio;
        }else{
            this.material.uniforms.antialiasingFactor.value = 2;
        }
        
    }
    dispose() {
        this.material.dispose();
        this.copyMaterial2D.dispose();
        this.copyMaterial3D.dispose();
        this.covarianceRenderTarget.dispose();
        this.positionColorRenderTarget.dispose();
        this.worker.terminate();
        this.worker = null;
        this.orderAttribute.array = undefined;
        this.geometry.dispose();
    }

    copyTex2D(src, dst, scissorBox, layer) {
        this.copyMaterial2D.uniforms.sourceTexture.value = src;
        const prevAutoClear = this.renderer.autoClear;
        const prevRenderTarget = this.renderer.getRenderTarget();
        this.renderer.autoClear = false;
        const scissorWidth = scissorBox[2] - scissorBox[0];
        const scissorHeight = scissorBox[3] - scissorBox[1];
        dst.viewport.set(scissorBox[0], scissorBox[1], scissorWidth, scissorHeight);

        this.renderer.setRenderTarget(dst, layer);
        this.renderer.render(this.copyScene, this.copyCamera);

        this.renderer.setRenderTarget(prevRenderTarget);

        this.renderer.autoClear = prevAutoClear;

    }

    copyTex3D(src, dst, numLayers) {
        this.copyMaterial3D.uniforms.sourceTexture.value = src;

        const prevAutoClear = this.renderer.autoClear;
        const prevRenderTarget = this.renderer.getRenderTarget();
        this.renderer.autoClear = false;

        this.copyQuad.material = this.copyMaterial3D;

        for (let layer = 0; layer < numLayers; layer++) {
            this.renderer.setRenderTarget(dst, layer);
            this.copyMaterial3D.uniforms.w.value = (layer + 0.5) / (numLayers);
            this.renderer.render(this.copyScene, this.copyCamera);
        }

        this.copyQuad.material = this.copyMaterial2D;

        this.renderer.setRenderTarget(prevRenderTarget);
        this.renderer.autoClear = prevAutoClear;

    }

    /**
     * Specify a size multiplier for splats
     * @param {number} sizeMultiplier 
     */
    setSplatsSizeMultiplier(sizeMultiplier) {
        this.material.uniforms.sizeMultiplier.value = sizeMultiplier*(this.scaleMultiplier || 1);
    }
    /**
     * specify a crop radius for splats
     * @param {number} cropRadius 
     */
    setSplatsCropRadius(cropRadius) {
        this.material.uniforms.cropRadius.value = cropRadius;
    }

    sort(cameraPosition, viewProjModel) {
        if (!this.worker) return;
        if (!cameraPosition) {
            this.worker.postMessage({
                method: "sort",
                xyz: [this.cameraPosition.x, this.cameraPosition.z, -this.cameraPosition.y],
                vpm: this.viewProjModel && this.splatsCPUCuling?this.viewProjModel.toArray():undefined,
                id: this.sortID++
            })
        }
        else if (!this.cameraPosition || !cameraPosition.equals(this.cameraPosition)) {
            this.cameraPosition.copy(cameraPosition);
            if(!!viewProjModel){
                if (!this.viewProjModel) this.viewProjModel = new Matrix4();
                this.viewProjModel.copy(viewProjModel);
                this.viewProjModel.multiply(inverseZUpToYUpMatrix4x4);
            }else{
                this.viewProjModel = undefined;
            }
            
            
            this.worker.postMessage({
                method: "sort",
                xyz: [this.cameraPosition.x, this.cameraPosition.z, -this.cameraPosition.y],
                vpm: this.viewProjModel && this.splatsCPUCuling?this.viewProjModel.toArray():undefined,
                id: this.sortID++
            })
        }
    }
    raycast(raycaster, intersects) {
        // overrides the method because the SplatsMesh itself is not meant to be raycast onto, the tiles should be individualy raycast
    }

    addSplatsTile(positions, colors, cov1, cov2) {
        if (!this.worker) return;
        const self = this;

        const positionArray = positions.data ? positions.data.array : positions.array;
        const stride = positions.data && positions.data.isInterleavedBuffer ? positions.data.stride : 3;
        const offset = positions.data && positions.data.isInterleavedBuffer ? positions.offset : 0;
        const numBatches = Math.ceil(positionArray.length / (this.batchSize * stride));
        const textureAddresses = [];
        const pointManagerAddresses = [];


        /// raycasting ///
        // const start = performance.now();
        let raycast = () => { }
        const positionsOnly = new Float32Array((positionArray.length / stride) * 3);
        const posU32 = new Uint32Array(
            positionsOnly.buffer,
            positionsOnly.byteOffset,
            positionsOnly.length                                              // same element count
        );

        for (let i = 0; i < positionArray.length / 3; i++) {
            positionsOnly[i * 3] = positionArray[i * stride + offset];
            positionsOnly[i * 3 + 1] = positionArray[i * stride + offset + 1];
            positionsOnly[i * 3 + 2] = positionArray[i * stride + offset + 2];
        }

        // console.log(performance.now()-start)
        raycast = (ray, intersects, threshold) => {
            const threshSquared = threshold * threshold;
            const cropRadiusSquared = Math.pow(self.material.uniforms.cropRadius.value,2);
            
            // Pre-allocate temporary objects to avoid memory churn in the loop
            const tempMatrix = new Matrix3();
            const splatCenter = new Vector3();
            const V = new Vector3(); // Re-used for multiple vector operations
            const W = new Vector3();
            const closestPointVec = new Vector3();

            const numSplats = positionsOnly.length / 3;
            for (let i = 0; i < numSplats; i++) {
                // Set splat center, applying the same Y-up transform as the shader
                splatCenter.set(positionsOnly[i * 3], -positionsOnly[i * 3 + 2], positionsOnly[i * 3 + 1]);

                if (splatCenter.lengthSq() > cropRadiusSquared || ray.distanceSqToPoint(splatCenter) > threshSquared) {
                    continue;
                }

                reconstructCovariance(cov1, cov2, i, tempMatrix);
                
                const t = V.copy(splatCenter).sub(ray.origin).dot(ray.direction);
                if (t < 0) continue; // Splat is behind the ray's origin

                closestPointVec.copy(ray.direction).multiplyScalar(t).add(ray.origin);

                const vecToClosest = V.copy(closestPointVec).sub(splatCenter);
                solve3x3LinearSystem(tempMatrix, vecToClosest, W);
                
                const mahalanobisSq = vecToClosest.dot(W);

                const hitOpacity = colors.getW(i) * Math.exp(-0.5 * mahalanobisSq);

                if (hitOpacity > 0.01) {
                    intersects.push({
                        distance: t,
                        point: closestPointVec.clone(),
                        opacity: hitOpacity,
                        type: "splat",
                        object: this // Reference to the batch/tile
                    });
                }
            }
        }

        if (numBatches > this.freeAddresses.size) {
            this.growTextures();
        }

        for (let i = 0; i < numBatches; i++) {
            const address = this.freeAddresses.poll();
            if (isNaN(address)) {
                console.log("insuficient texture size to store splats info")
            }
            if (address == 0) {
            }
            textureAddresses.push(address);
            pointManagerAddresses.push(address * 3);
            const startIndex = i * this.batchSize;
            this.addSplatsBatch(startIndex, address, posU32, colors, cov1, cov2);
        }


        self.worker.postMessage({
            method: "addBatches",
            insertionIndexes: pointManagerAddresses,
            positions: positionArray.buffer,
            offset: offset,
            stride: stride,
            batchSize: self.batchSize,
        }, [positionArray.buffer]);

        let visible = false;
        const hide = () => {

            if (visible == true && self.worker) {
                self.numVisibleBatches--;
                visible = false;
                self.worker.postMessage({
                    method: "hideBatches",
                    insertionIndexes: pointManagerAddresses,
                    xyz: [self.cameraPosition.x, self.cameraPosition.z, -self.cameraPosition.y],
                    vpm: this.viewProjModel && this.splatsCPUCuling?this.viewProjModel.toArray():undefined,
                    id: self.sortID++
                });
            }

        }


        const show = (callback) => {
            if (visible == false && self.worker) {
                self.numVisibleBatches--;
                visible = true;
                const sortID = self.sortID;
                const listener = (id => {
                    if (id >= sortID) {
                        callback();
                        return true;
                    }
                    return false;
                });
                self.sortListeners.push(listener)

                self.worker.postMessage({
                    method: "showBatches",
                    insertionIndexes: pointManagerAddresses,
                    xyz: [self.cameraPosition.x, self.cameraPosition.z, -self.cameraPosition.y],
                    vpm: this.viewProjModel && this.splatsCPUCuling?this.viewProjModel.toArray():undefined,
                    id: self.sortID++
                });
            }


        }
        const remove = () => {
            if (!self.worker) return;
            raycast = undefined;
            self.worker.postMessage({
                method: "removeBatches",
                insertionIndexes: pointManagerAddresses,
                xyz: [self.cameraPosition.x, self.cameraPosition.z, -self.cameraPosition.y],
                vpm: this.viewProjModel && this.splatsCPUCuling?this.viewProjModel.toArray():undefined,
                id: self.sortID++
            });
            textureAddresses.forEach(address => self.freeAddresses.add(address));
        }





        return {
            hide: hide,
            show: show,
            remove: remove,
            sort: this.sort,
            raycast: raycast,
            isSplatsBatch: true
        }

    }


    addSplatsBatch(positionsStartIndex, address, positions, colors, cov1, cov2) {


        // New packing:
        // - covariance RT (Float RGBA):
        //   R=packHalf2(cov1.x,cov1.y), G=packHalf2(cov1.z,cov2.x), B=packHalf2(cov2.y,cov2.z), A=pos.x (float)
        // - positionColor RT (Float RGBA):
        //   R=pos.y, G=pos.z, B=packHalf2(color.r,color.g), A=packHalf2(color.b,color.a)
        const positionColorArray = new Float32Array(this.batchSize * 4);
        const covarianceArray = new Float32Array(this.batchSize * 4);
        
        // views to reinterpret u32->f32 without allocations
        const scratch = new ArrayBuffer(4);
        const u32view = new Uint32Array(scratch);
        const f32view = new Float32Array(scratch);
        const u32ToF32 = (u) => { u32view[0] = u >>> 0; return f32view[0]; };
        
        // positions is a Uint32Array view on a Float32Array buffer. Create a Float32 view.
        const posF32 = new Float32Array(positions.buffer, positions.byteOffset, positions.length);
        
        const totalPositions = positions.length / 3;
        for (let i = address; i < address + this.batchSize; i++) {
            const base = i - address;
            const arrayIndexBase4 = base * 4;
        
            const positionIndex = positionsStartIndex + base;
            const pIndex3 = 3 * (positionsStartIndex + base);
        
            if (positionIndex >= totalPositions) break;
        
            // read positions as float
            const px = posF32[pIndex3];
            const py = posF32[pIndex3 + 1];
            const pz = posF32[pIndex3 + 2];
        
            // colors as 0..1 floats
            const cr = colors.getX(positionIndex);
            const cg = colors.getY(positionIndex);
            const cb = colors.getZ(positionIndex);
            const ca = colors.getW(positionIndex);
        
            // covariance half2 packing packed into 32-bit, then reinterpreted as float
            const covRG = packHalf2x16(cov1.getX(positionIndex), cov1.getY(positionIndex));
            const covGA = packHalf2x16(cov1.getZ(positionIndex), cov2.getX(positionIndex));
            const covBA = packHalf2x16(cov2.getY(positionIndex), cov2.getZ(positionIndex));
        
            covarianceArray[arrayIndexBase4]     = u32ToF32(covRG);
            covarianceArray[arrayIndexBase4 + 1] = u32ToF32(covGA);
            covarianceArray[arrayIndexBase4 + 2] = u32ToF32(covBA);
            covarianceArray[arrayIndexBase4 + 3] = px; // position.x as plain float
        
            // positionColor packing
            positionColorArray[arrayIndexBase4]     = py; // pos.y
            positionColorArray[arrayIndexBase4 + 1] = pz; // pos.z
            const colRG = packHalf2x16(cr, cg);
            const colBA = packHalf2x16(cb, ca);
            positionColorArray[arrayIndexBase4 + 2] = u32ToF32(colRG);
            positionColorArray[arrayIndexBase4 + 3] = u32ToF32(colBA);
        }
        
        const destTextureLayer = Math.floor(address / Math.pow(this.textureSize, 2));
        const srcHeight = Math.ceil(this.batchSize / this.textureSize);
        const scissor = [0, (address / this.textureSize) - (destTextureLayer * this.textureSize), this.textureSize];
        scissor.push(scissor[1] + srcHeight);
        
        const batchPositionColorTexture = new DataTexture(positionColorArray, this.textureSize, srcHeight, RGBAFormat, FloatType);
        batchPositionColorTexture.internalFormat = 'RGBA32F';
        batchPositionColorTexture.generateMipmaps = false;
        batchPositionColorTexture.magFilter = NearestFilter;
        batchPositionColorTexture.minFilter = NearestFilter;
        batchPositionColorTexture.anisotropy = 0;
        batchPositionColorTexture.needsUpdate = true;
        this.renderer.initTexture(batchPositionColorTexture);
        this.copyTex2D(batchPositionColorTexture, this.positionColorRenderTarget, scissor, destTextureLayer);
        batchPositionColorTexture.dispose();
        
        const batchCovarianceTexture = new DataTexture(covarianceArray, this.textureSize, srcHeight, RGBAFormat, FloatType);
        batchCovarianceTexture.internalFormat = 'RGBA32F';
        batchCovarianceTexture.generateMipmaps = false;
        batchCovarianceTexture.magFilter = NearestFilter;
        batchCovarianceTexture.minFilter = NearestFilter;
        batchCovarianceTexture.anisotropy = 0;
        batchCovarianceTexture.needsUpdate = true;
        this.renderer.initTexture(batchCovarianceTexture);
        this.copyTex2D(batchCovarianceTexture, this.covarianceRenderTarget, scissor, destTextureLayer);
        batchCovarianceTexture.dispose();

    }

    growTextures() {

        //const start = performance.now();
        for (let i = this.maxSplats; i < this.maxSplats + (this.textureSize * this.textureSize); i += this.batchSize) {
            this.freeAddresses.add(i);
        }
        this.maxSplats += (this.textureSize * this.textureSize);



        const newNumTextures = this.numTextures + 1;
        const positionColorRenderTarget = new WebGL3DRenderTarget(this.textureSize, this.textureSize, newNumTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            type: FloatType,
            format: RGBAFormat,
            anisotropy: 0,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        positionColorRenderTarget.texture.type = FloatType;
        positionColorRenderTarget.texture.internalFormat = 'RGBA32F';
        positionColorRenderTarget.texture.format = RGBAFormat;
        
        this.renderer.initRenderTarget(positionColorRenderTarget);
        this.copyTex3D(this.positionColorRenderTarget.texture, positionColorRenderTarget, this.numTextures);
        this.positionColorRenderTarget.dispose();
        this.positionColorRenderTarget = positionColorRenderTarget;
        this.material.uniforms.positionColorTexture.value = this.positionColorRenderTarget.texture;


        const covarianceRenderTarget = new WebGL3DRenderTarget(this.textureSize, this.textureSize, newNumTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            type: FloatType,
            format: RGBAFormat,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        
        covarianceRenderTarget.texture.type = FloatType;
        covarianceRenderTarget.texture.internalFormat = 'RGBA32F';
        covarianceRenderTarget.texture.format = RGBAFormat;
        
        this.renderer.initRenderTarget(covarianceRenderTarget);
        this.copyTex3D(this.covarianceRenderTarget.texture, covarianceRenderTarget, this.numTextures);
        this.covarianceRenderTarget.dispose();
        this.covarianceRenderTarget = covarianceRenderTarget;
        this.material.uniforms.covarianceTexture.value = this.covarianceRenderTarget.texture;



        this.numTextures = newNumTextures;
        this.material.uniforms.numSlices.value = this.numTextures;

        //console.log("grow " + (performance.now() - start) + " ms")
    }

} export { SplatsMesh }

function saveBuffer(pixelBuffer) {
    const canvas = document.createElement('canvas');
    const width = 512;
    const height = 512;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const imageData = context.createImageData(width, height);

    // WebGL's coordinate system is bottom-left, so we need to flip the image vertically
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const srcIndex = (y * width + x) * 4;
            const destIndex = ((height - y - 1) * width + x) * 4;
            imageData.data[destIndex] = pixelBuffer[srcIndex];       // R
            imageData.data[destIndex + 1] = pixelBuffer[srcIndex + 1]; // G
            imageData.data[destIndex + 2] = pixelBuffer[srcIndex + 2]; // B
            imageData.data[destIndex + 3] = pixelBuffer[srcIndex + 3]; // A
        }
    }
    context.putImageData(imageData, 0, 0);

    // 6. Convert the canvas to a PNG and trigger download
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `layer_.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 'image/png');
}
export function splatsVertexShader() {
    return /*glsl */`
precision highp float;
precision highp int;
precision highp sampler3D;

#include <common>
#include <packing>

uniform float textureSize;
uniform float numSlices;
uniform float sizeMultiplier;
in highp uint order;
out vec4 color;
out vec2 vUv;
out vec3 splatPositionWorld;
out vec3 splatPositionModel;
out float splatDepth;
out float splatDepthWithBias;
out float stds;
out vec2 viewZW;
uniform highp sampler3D positionColorTexture;
uniform highp sampler3D covarianceTexture;
uniform mat3 zUpToYUpMatrix3x3;
uniform float logDepthBufFC;
uniform vec2 viewportPixelSize;        // vec2(width , height)
uniform float k;
uniform float beta_k; // pow((4.0 * gamma(2.0/k)) /k, k/2)
uniform float minSplatPixelSize;
uniform float minOpacity;
uniform bool culling;
uniform float antialiasingFactor;
uniform float cropRadius;
uniform float depthBias; // depth bias in meters


void getVertexData(out vec3 position, out mat3 covariance) {

    highp uint uOrder = order;

    uint uTextureSize = uint(textureSize);
    uint uPixelsPerSlice = uTextureSize * uTextureSize;

    uint sliceIndexVal = uOrder / uPixelsPerSlice;
    uint slicePixelIndex = uOrder % uPixelsPerSlice;

    uint xVal = slicePixelIndex % uTextureSize;
    uint yVal = slicePixelIndex / uTextureSize;

    // integer texel coords
    ivec3 coord = ivec3(xVal, yVal, sliceIndexVal);

    // Fetch float RGBA from both textures
    vec4 posCol = texelFetch(positionColorTexture, coord, 0);
    vec4 covTex = texelFetch(covarianceTexture, coord, 0);

    // Decode covariance from packed half2 stored in float channels (R,G,B)
    uint covR = floatBitsToUint(covTex.r);
    uint covG = floatBitsToUint(covTex.g);
    uint covB = floatBitsToUint(covTex.b);
    vec2 c0 = unpackHalf2x16(covR);
    vec2 c1 = unpackHalf2x16(covG);
    vec2 c2 = unpackHalf2x16(covB);
    covariance = mat3(c0.x, c0.y, c1.x,
                      c0.y, c1.y, c2.x,
                      c1.x, c2.x, c2.y);

    // Position: x in covariance alpha, y/z in positionColor r/g
    float px = covTex.a;
    float py = posCol.r;
    float pz = posCol.g;
    position = vec3(px, py, pz);

    // Color packed as two half2 in positionColor b/a
    uint rgPacked = floatBitsToUint(posCol.b);
    uint baPacked = floatBitsToUint(posCol.a);
    vec2 rg = unpackHalf2x16(rgPacked);
    vec2 ba = unpackHalf2x16(baPacked);
    color = vec4(rg.x, rg.y, ba.x, ba.y);

    // Transform covariance like before (reduce repeated transpose/mul temps)
    mat3 z = zUpToYUpMatrix3x3;
    mat3 zT = transpose(z);
    mat3 modelRotation = z * transpose(mat3(modelMatrix));
    covariance = zT * covariance * z;
    covariance = transpose(modelRotation) * covariance * modelRotation;
}

bool modelTransform(in vec3 splatWorld, in mat3 covariance, inout vec3 vertexPosition) {

    /* camera‑space Jacobian rows ----------------------------------------- */
    vec3 posCam = (viewMatrix * vec4(splatWorld, 1.0)).xyz;
    float invZ  = 1.0 / posCam.z;
    float invZ2 = invZ * invZ;
    float fx    = projectionMatrix[0][0];
    float fy    = projectionMatrix[1][1];

    vec3 j0 = vec3(fx * invZ,            0.0, -fx * posCam.x * invZ2);
    vec3 j1 = vec3(0.0,  fy * invZ, -fy * posCam.y * invZ2);

    mat3 viewRotT = transpose(mat3(viewMatrix));
    //viewRotT *= 2.0;
    vec3 j0W = viewRotT * j0*4.0;
    vec3 j1W = viewRotT * j1*4.0;

    vec3 tmp0 = covariance * j0W;
    vec3 tmp1 = covariance * j1W;
    float a = dot(j0W, tmp0);
    float b = dot(j0W, tmp1);
    float c = dot(j1W, tmp1);
    float sigmaNDC = (antialiasingFactor / viewportPixelSize.x) * 2.0;
    float k2 = sigmaNDC * sigmaNDC;
    float detOrig = a * c - b * b;
    a += k2;
    c += k2;
    float detBlur = a * c - b * b;
    color.a *= sqrt(clamp(detOrig / detBlur, 0.0, 1.0-1.0e-6));
    if(color.a < 0.01) return false;
    //color.a = 1.0;
    float halfTrace = 0.5 * (a + c);
    float rootTerm  = sqrt(max(halfTrace * halfTrace - (a * c - b * b), 0.0));
    float lambda1   = halfTrace + rootTerm;
    float lambda2   = halfTrace - rootTerm;

    if(min(lambda2,lambda1)<=0.0) {
        return false;
    }
    


    vec2 eig1 = (abs(b) < 1e-7)
              ? ((a >= c) ? vec2(1.0, 0.0) : vec2(0.0, 1.0))
              : normalize(vec2(b, lambda1 - a));
    vec2 eig2 = vec2(-eig1.y, eig1.x);

    eig1 *= sqrt(lambda1) * 2.0;
    eig2 *= sqrt(lambda2) * 2.0;

    float alpha = dot(j0, j0);
    float beta  = dot(j0, j1);
    float gamma = dot(j1, j1);
    float invDet = 1.0 / (alpha * gamma - beta * beta);

    vec3 deltaCam1 = ( gamma * eig1.x - beta * eig1.y) * j0 +
                     (-beta * eig1.x + alpha * eig1.y) * j1;
    vec3 deltaCam2 = ( gamma * eig2.x - beta * eig2.y) * j0 +
                     (-beta * eig2.x + alpha * eig2.y) * j1;
    deltaCam1 *= invDet*0.5;
    deltaCam2 *= invDet*0.5;

    vec3 axisW1 = viewRotT * deltaCam1;
    vec3 axisW2 = viewRotT * deltaCam2;

    vertexPosition = vertexPosition.x * axisW1 + vertexPosition.y * axisW2;
    return true;
}


void main() {
    vUv = vec2(position);

    mat3 covariance;
    getVertexData(splatPositionModel, covariance);

    covariance *=sizeMultiplier*sizeMultiplier;

    if(length(splatPositionModel) > cropRadius) return;
    
    /* opacity ‑> stds */
    float maxV = min(1.0, max(color.a, 0.0001));
    float thresh = min(minOpacity, maxV);
    if (thresh >= maxV) return;
    float lnRatio = log(thresh / maxV);
    float invK = 1.0 / k;
    stds = pow(-8.0 * lnRatio / beta_k, invK); // sqrt(2.0 * log(maxV / thresh));
    

    splatPositionWorld = (modelMatrix * vec4(splatPositionModel, 1.0)).xyz;
    vec4 splatProjectionView = viewMatrix * vec4(splatPositionWorld, 1.0);
    vec4 splatPositionProjected = projectionMatrix * splatProjectionView;
    splatProjectionView.z += depthBias;
    vec4 splatPositionProjectedWithBias = projectionMatrix * splatProjectionView;

    if(culling){
        float clip = 1.2 * splatPositionProjected.w;
        if (splatPositionProjected.z < -splatPositionProjected.w || splatPositionProjected.x < -clip || splatPositionProjected.x > clip || splatPositionProjected.y < -clip || splatPositionProjected.y > clip) {
            gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
            return;
        }
    }
    

    float halfStds = 0.5 * stds;
    vec3 offsetWorld = vec3(position) * halfStds;
    
    bool valid = modelTransform(splatPositionWorld, covariance, offsetWorld);
    if(!valid) return;
    splatPositionWorld+=offsetWorld;
    vec4 outPosition = projectionMatrix * viewMatrix * vec4(splatPositionWorld,1.0);
    
    
    
    gl_Position = outPosition;
    viewZW = outPosition.zw;
    
    #if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	    float isPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
        splatDepthWithBias = isPerspective == 0.0 ? splatPositionProjectedWithBias.z : log2( 1.0 + splatPositionProjectedWithBias.w ) * logDepthBufFC * 0.5;
        splatDepth = isPerspective == 0.0 ? splatPositionProjected.z : log2( 1.0 + splatPositionProjected.w ) * logDepthBufFC * 0.5;
    #else
        splatDepthWithBias = (splatPositionProjectedWithBias.z / splatPositionProjectedWithBias.w)* 0.5 + 0.5;
        splatDepth = (splatPositionProjected.z / splatPositionProjected.w)* 0.5 + 0.5;
    #endif

    
}
`};
export function splatsFragmentShader() {
    return /* glsl */`
precision highp float;
precision highp int;

in float stds;
in vec4 color;
in vec2 vUv;
in vec3 splatPositionModel;
in vec3 splatPositionWorld;
in float splatDepth;
in float splatDepthWithBias;

layout(location = 0) out vec4 fragColor;

uniform float textureSize;

uniform float k;
uniform float beta_k; // pow((4.0 * gamma(2.0/k)) /k, k/2)

void main() {
    float l = dot(vUv, vUv);
    if (l > 0.25) discard;           // early out unchanged
    vec2  p   = vUv * stds;
    float r2  = dot(p, p);           // r²
    float rk  = pow(r2, 0.5 * k);    // r^{k}
    float alpha = color.w * exp(-beta_k * rk);

    fragColor = vec4(pow(color.xyz,vec3(1.0/2.2)), alpha);
    gl_FragDepth = splatDepthWithBias;
    
}`
};

function vertexCopyShader() {
    return /* glsl */`

precision highp float;
precision highp int;

out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
};

function fragmentCopyShader2D() {
    return /* glsl */`
precision highp float;
precision highp int;
precision highp sampler2D;

layout(location = 0) out vec4 fragColor;
uniform sampler2D sourceTexture;

in vec2 vUv;

void main() {
    fragColor = texture( sourceTexture, vUv );
}`
};


function fragmentCopyShader3D() {
    return /* glsl */`
precision highp float;
precision highp int;
precision highp sampler3D;

layout(location = 0) out vec4 fragColor;
uniform sampler3D sourceTexture;
uniform float w;

in vec2 vUv;

void main() {
    fragColor = texture( sourceTexture, vec3(vUv, w) );
}`
};

/**
 * Reconstructs the covariance matrix from cov1 and cov2 buffer attributes
 * into a target Matrix3 object. This avoids allocating new matrices in a loop.
 * @param {import("three").BufferAttribute | import("three").InterleavedBufferAttribute} cov1 - The buffer attribute for the first 3 covariance components.
 * @param {import("three").BufferAttribute | import("three").InterleavedBufferAttribute} cov2 - The buffer attribute for the last 3 unique covariance components.
 * @param {number} index - The index of the splat.
 * @param {import("three").Matrix3} target - The target Matrix3 to store the result.
 */
function reconstructCovariance(cov1, cov2, index, target) {
    const c1x = cov1.getX(index);
    const c1y = cov1.getY(index);
    const c1z = cov1.getZ(index);
    const c2x = cov2.getX(index);
    const c2y = cov2.getY(index);
    const c2z = cov2.getZ(index);

    target.set(
        c1x, c1y, c1z, // Row 1
        c1y, c2x, c2y, // Row 2
        c1z, c2y, c2z  // Row 3
    );
}

/**
 * Solves the 3x3 linear system A*x = b for x using Cramer's rule.
 * This is faster than computing a full matrix inverse.
 * @param {import("three").Matrix3} A - The 3x3 matrix.
 * @param {import("three").Vector3} b - The result vector.
 * @param {import("three").Vector3} target - The target vector to store the solution x.
 */
function solve3x3LinearSystem(A, b, target) {
    const det = A.determinant();
    if (Math.abs(det) < 1e-12) { // Check for singularity
        target.set(0, 0, 0);
        return;
    }
    const invDet = 1.0 / det;

    const t1 = new Matrix3().copy(A);
    t1.elements[0] = b.x; t1.elements[3] = b.y; t1.elements[6] = b.z;
    
    const t2 = new Matrix3().copy(A);
    t2.elements[1] = b.x; t2.elements[4] = b.y; t2.elements[7] = b.z;

    const t3 = new Matrix3().copy(A);
    t3.elements[2] = b.x; t3.elements[5] = b.y; t3.elements[8] = b.z;

    target.set(
        t1.determinant() * invDet,
        t2.determinant() * invDet,
        t3.determinant() * invDet
    );
}