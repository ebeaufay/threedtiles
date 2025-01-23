import {
    Mesh, InstancedMesh, ShaderMaterial, Vector2, Vector3, Vector4, Box2, Box3, DataArrayTexture,
    FloatType, HalfFloatType, RGBFormat, RGBAFormat, FrontSide, AlwaysDepth, PlaneGeometry, Matrix3,
    NearestFilter, Data3DTexture, DataTexture, UnsignedByteType, BufferAttribute, InstancedBufferAttribute, DynamicDrawUsage,
    LinearSRGBColorSpace, InstancedBufferGeometry,
    WebGL3DRenderTarget, OrthographicCamera, Scene,
    NeverDepth
} from "three";
import {
    MinPriorityQueue
} from 'data-structure-typed';
import { SplatsCollider } from "./SplatsColider";
import WorkerConstructor from './PointsManager.worker.js?worker';

const tmpVector = new Vector3();
const tmpVector2 = new Vector3();
const zUpToYUpMatrix3x3 = new Matrix3();
zUpToYUpMatrix3x3.set(
    1, 0, 0,
    0, 0, 1,
    0, -1, 0);

class SplatsMesh extends Mesh {
    constructor(renderer, fragShader) {

        const textureSize = 512;

        const numTextures = 1;
        const batchSize = Math.min(Math.ceil(4096 / textureSize) * textureSize, Math.pow(textureSize, 2));
        let maxSplats = numTextures * Math.pow(textureSize, 2);
        maxSplats = Math.floor(maxSplats / batchSize) * batchSize;


        const colorRenderTarget = new WebGL3DRenderTarget(textureSize, textureSize, numTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        renderer.initRenderTarget(colorRenderTarget);

        const positionRenderTarget = new WebGL3DRenderTarget(textureSize, textureSize, numTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            type: FloatType,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        positionRenderTarget.texture.type = FloatType;
        renderer.initRenderTarget(positionRenderTarget);
        const cov1RenderTarget = new WebGL3DRenderTarget(textureSize, textureSize, numTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            type: FloatType,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        cov1RenderTarget.texture.type = FloatType;
        renderer.initRenderTarget(cov1RenderTarget);
        const cov2RenderTarget = new WebGL3DRenderTarget(textureSize, textureSize, numTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            type: FloatType,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        cov2RenderTarget.texture.type = FloatType;
        renderer.initRenderTarget(cov2RenderTarget);


        const material = new ShaderMaterial(
            {
                uniforms: {
                    textureSize: { value: textureSize },
                    numSlices: { value: numTextures },
                    cov1Texture: { value: cov1RenderTarget.texture },
                    cov2Texture: { value: cov2RenderTarget.texture },
                    colorTexture: { value: colorRenderTarget.texture },
                    positionTexture: { value: positionRenderTarget.texture },
                    zUpToYUpMatrix3x3: { value: zUpToYUpMatrix3x3 },
                    sizeMultiplier: { value: 1 },
                    cropRadius: { value: Number.MAX_VALUE },
                    cameraNear: {value: 0.01},
                    cameraFar: {value: 10},
                    computeLinearDepth:{value: true}
                },
                vertexShader: splatsVertexShader(),
                fragmentShader: fragShader?fragShader:splatsFragmentShader(),
                transparent: true,
                side: FrontSide,
                depthTest: false,
                depthWrite: false,
                //depthFunc: AlwaysDepth
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
        this.numBatches = 0;
        this.numVisibleBatches = 0;
        this.orderAttribute = orderAttribute;
        this.textureSize = textureSize;
        this.numTextures = numTextures;
        this.batchSize = batchSize;
        this.maxSplats = maxSplats;
        this.numSplatsRendered = 0;

        this.colorRenderTarget = colorRenderTarget;
        this.positionRenderTarget = positionRenderTarget;
        this.cov1RenderTarget = cov1RenderTarget;
        this.cov2RenderTarget = cov2RenderTarget;

        this.renderer = renderer;

        this.sortID = 0;

        this.freeAddresses = new MinPriorityQueue();
        for (let i = 0; i < this.maxSplats; i += batchSize) {
            this.freeAddresses.add(i);
        }

        this.worker = new WorkerConstructor({ type: 'module' });

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
            this.geometry.needsUpdate = true;
            for (let i = this.sortListeners.length - 1; i >= 0; i--) {
                const done = this.sortListeners[i](message.data.id);
                if (done) {
                    this.sortListeners.splice(i, 1);
                }
            }
        }
        this.cameraPosition = new Vector3(0, 0, 0);
        this.rotateOnAxis(new Vector3(1, 0, 0), Math.PI * 0.5);
        this.frustumCulled = false;


        /// Copy setup ///
        this.copyMaterial2D = new ShaderMaterial(
            {
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
        const self = this;
        
    }

    dispose() {
        this.material.dispose();
        this.copyMaterial2D.dispose();
        this.copyMaterial3D.dispose();
        this.cov1RenderTarget.dispose();
        this.cov2RenderTarget.dispose();
        this.positionRenderTarget.dispose();
        this.colorRenderTarget.dispose();
        this.worker.terminate();
        this.worker = null;
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
        this.material.uniforms.sizeMultiplier.value = sizeMultiplier;
    }
    /**
     * specify a crop radius for splats
     * @param {number} cropRadius 
     */
    setSplatsCropRadius(cropRadius) {
        this.material.uniforms.cropRadius.value = cropRadius;
    }

    sort(cameraPosition) {
        if (!cameraPosition && this.cameraPosition) {
            this.worker.postMessage({
                method: "sort",
                xyz: [this.cameraPosition.x, this.cameraPosition.z, -this.cameraPosition.y],
                id: this.sortID++
            })
        }
        else if (!this.cameraPosition || !cameraPosition.equals(this.cameraPosition)) {
            this.cameraPosition.copy(cameraPosition);
            this.worker.postMessage({
                method: "sort",
                xyz: [this.cameraPosition.x, this.cameraPosition.z, -this.cameraPosition.y],
                id: this.sortID++
            })
        }
    }
    raycast(raycaster, intersects) {
        // overrides the method because the SplatsMesh itself is not meant to be raycast onto, the tiles should be individualy raycast
    }

    addSplatsTile(positions, colors, cov1, cov2) {
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


        for (let i = 0; i < positionArray.length / 3; i++) {
            positionsOnly[i * 3] = positionArray[i * stride + offset];
            positionsOnly[i * 3 + 1] = positionArray[i * stride + offset + 1];
            positionsOnly[i * 3 + 2] = positionArray[i * stride + offset + 2];
        }

        // console.log(performance.now()-start)
        raycast = (ray, intersects, threshold) => {
            const threshSquared = threshold * threshold;
            for (let i = 0; i < positionsOnly.length; i += 3) {
                tmpVector.set(positionsOnly[i], -positionsOnly[i + 2], positionsOnly[i + 1])
                const dot = tmpVector2.copy(tmpVector).sub(ray.origin).dot(ray.direction);
                if (dot > 0) {
                    const d = ray.distanceSqToPoint(tmpVector);
                    if (d < threshSquared) {
                        intersects.push({ distance: dot, point: tmpVector.clone(), type: "splat" });
                    }
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
            this.addSplatsBatch(startIndex, address, positions, colors, cov1, cov2);
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
            
            if (visible == true) {
                self.numVisibleBatches--;
                visible = false;
                self.worker.postMessage({
                    method: "hideBatches",
                    insertionIndexes: pointManagerAddresses,
                    xyz: [self.cameraPosition.x, self.cameraPosition.z, -self.cameraPosition.y],
                    id: self.sortID++
                });
            }

        }


        const show = (callback) => {
            if (visible == false) {
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
                    id: self.sortID++
                });
            }


        }
        const remove = () => {
            raycast = undefined;
            self.worker.postMessage({
                method: "removeBatches",
                insertionIndexes: pointManagerAddresses,
                xyz: [self.cameraPosition.x, self.cameraPosition.z, -self.cameraPosition.y],
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


        const positionArray = new Float32Array(this.batchSize * 4);
        const colorsArray = new Uint8Array(this.batchSize * 4);
        const cov1Array = new Float32Array(this.batchSize * 4);
        const cov2Array = new Float32Array(this.batchSize * 4);


        for (let i = address; i < address + this.batchSize; i++) {
            const base = i - address;
            const arrayIndexBase4 = base * 4;

            const positionIndex = positionsStartIndex + base;
            if (positionIndex >= positions.count) break;

            positionArray[arrayIndexBase4] = positions.getX(positionIndex)
            positionArray[arrayIndexBase4 + 1] = positions.getY(positionIndex)
            positionArray[arrayIndexBase4 + 2] = positions.getZ(positionIndex)

            const r = Math.floor(colors.getX(positionIndex) * 255);
            const g = Math.floor(colors.getY(positionIndex) * 255);
            const b = Math.floor(colors.getZ(positionIndex) * 255);
            const a = Math.floor(colors.getW(positionIndex) * 255);

            colorsArray[arrayIndexBase4] = Math.floor(colors.getX(positionIndex) * 255);
            colorsArray[arrayIndexBase4 + 1] = Math.floor(colors.getY(positionIndex) * 255);
            colorsArray[arrayIndexBase4 + 2] = Math.floor(colors.getZ(positionIndex) * 255);
            colorsArray[arrayIndexBase4 + 3] = Math.floor(colors.getW(positionIndex) * 255);


            cov1Array[arrayIndexBase4] = cov1.getX(positionIndex)
            cov1Array[arrayIndexBase4 + 1] = cov1.getY(positionIndex)
            cov1Array[arrayIndexBase4 + 2] = cov1.getZ(positionIndex)
            cov2Array[arrayIndexBase4] = cov2.getX(positionIndex)
            cov2Array[arrayIndexBase4 + 1] = cov2.getY(positionIndex)
            cov2Array[arrayIndexBase4 + 2] = cov2.getZ(positionIndex)

        }

        const destTextureLayer = Math.floor(address / Math.pow(this.textureSize, 2));
        const srcHeight = Math.ceil(this.batchSize / this.textureSize);
        const scissor = [0, (address / this.textureSize) - (destTextureLayer * this.textureSize), this.textureSize];
        scissor.push(scissor[1] + srcHeight);
        const batchPositionTexture = new DataTexture(positionArray, this.textureSize, srcHeight, RGBAFormat, FloatType);
        batchPositionTexture.generateMipmaps = false;
        batchPositionTexture.magFilter = NearestFilter;
        batchPositionTexture.minFilter = NearestFilter;
        batchPositionTexture.anisotropy = 0;
        batchPositionTexture.needsUpdate = true;
        this.renderer.initTexture(batchPositionTexture)
        this.renderer.initRenderTarget(this.positionRenderTarget)
        this.copyTex2D(batchPositionTexture, this.positionRenderTarget, scissor, destTextureLayer)
        batchPositionTexture.dispose();


        const batchColorTexture = new DataTexture(colorsArray, this.textureSize, srcHeight, RGBAFormat, UnsignedByteType);
        batchColorTexture.generateMipmaps = false;
        batchColorTexture.magFilter = NearestFilter;
        batchColorTexture.minFilter = NearestFilter;
        batchColorTexture.anisotropy = 0;
        batchColorTexture.needsUpdate = true;
        this.renderer.initTexture(batchColorTexture)
        this.copyTex2D(batchColorTexture, this.colorRenderTarget, scissor, destTextureLayer);
        batchColorTexture.dispose();


        const batchCov1Texture = new DataTexture(cov1Array, this.textureSize, srcHeight, RGBAFormat, FloatType);
        batchCov1Texture.generateMipmaps = false;
        batchCov1Texture.magFilter = NearestFilter;
        batchCov1Texture.minFilter = NearestFilter;
        batchCov1Texture.anisotropy = 0;
        batchCov1Texture.needsUpdate = true;
        this.renderer.initTexture(batchCov1Texture)
        this.copyTex2D(batchCov1Texture, this.cov1RenderTarget, scissor, destTextureLayer)
        batchCov1Texture.dispose();

        const batchCov2Texture = new DataTexture(cov2Array, this.textureSize, srcHeight, RGBAFormat, FloatType);
        batchCov2Texture.generateMipmaps = false;
        batchCov2Texture.magFilter = NearestFilter;
        batchCov2Texture.minFilter = NearestFilter;
        batchCov2Texture.anisotropy = 0;
        batchCov2Texture.needsUpdate = true;
        this.renderer.initTexture(batchCov2Texture)
        this.copyTex2D(batchCov2Texture, this.cov2RenderTarget, scissor, destTextureLayer);
        batchCov2Texture.dispose();

    }

    growTextures() {

        //const start = performance.now();
        for (let i = this.maxSplats; i < this.maxSplats + (this.textureSize * this.textureSize); i += this.batchSize) {
            this.freeAddresses.add(i);
        }
        this.maxSplats += (this.textureSize * this.textureSize);



        const newNumTextures = this.numTextures + 1;
        const colorRenderTarget = new WebGL3DRenderTarget(this.textureSize, this.textureSize, newNumTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })


        this.renderer.initRenderTarget(colorRenderTarget);
        this.copyTex3D(this.colorRenderTarget.texture, colorRenderTarget, this.numTextures);
        this.colorRenderTarget.dispose();
        this.colorRenderTarget = colorRenderTarget;
        this.material.uniforms.colorTexture.value = this.colorRenderTarget.texture;


        const positionRenderTarget = new WebGL3DRenderTarget(this.textureSize, this.textureSize, newNumTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            type: FloatType,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        positionRenderTarget.texture.type = FloatType;
        this.renderer.initRenderTarget(positionRenderTarget);
        this.copyTex3D(this.positionRenderTarget.texture, positionRenderTarget, this.numTextures);
        this.positionRenderTarget.dispose();
        this.positionRenderTarget = positionRenderTarget;
        this.material.uniforms.positionTexture.value = this.positionRenderTarget.texture;


        const cov1RenderTarget = new WebGL3DRenderTarget(this.textureSize, this.textureSize, newNumTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            type: FloatType,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        cov1RenderTarget.texture.type = FloatType;
        this.renderer.initRenderTarget(cov1RenderTarget);
        this.copyTex3D(this.cov1RenderTarget.texture, cov1RenderTarget, this.numTextures);
        this.cov1RenderTarget.dispose();
        this.cov1RenderTarget = cov1RenderTarget;
        this.material.uniforms.cov1Texture.value = this.cov1RenderTarget.texture;

        const cov2RenderTarget = new WebGL3DRenderTarget(this.textureSize, this.textureSize, newNumTextures, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            anisotropy: 0,
            type: FloatType,
            depthBuffer: false,
            resolveDepthBuffer: false,
        })
        cov2RenderTarget.texture.type = FloatType;
        this.renderer.initRenderTarget(cov2RenderTarget);
        this.copyTex3D(this.cov2RenderTarget.texture, cov2RenderTarget, this.numTextures);
        this.cov2RenderTarget.dispose();
        this.cov2RenderTarget = cov2RenderTarget;
        this.material.uniforms.cov2Texture.value = this.cov2RenderTarget.texture;


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
    return `
precision highp float;
precision highp int;

#include <common>
#include <packing>

uniform float textureSize;
uniform float numSlices;
uniform float sizeMultiplier;
in uint order;
out vec4 color;
out vec2 vUv;
out vec3 splatPositionWorld;
out vec3 splatPositionModel;
out float splatDepth;
//out float orthographicDepth;
out float splatCrop;
uniform sampler3D colorTexture;
uniform sampler3D positionTexture;
uniform sampler3D cov1Texture;
uniform sampler3D cov2Texture;
uniform mat3 zUpToYUpMatrix3x3;
uniform float logDepthBufFC;
//uniform float cameraNear;
//uniform float cameraFar;
//uniform bool computeLinearDepth;


void getVertexData(out vec3 position, out mat3 covariance) {
    float index = float(order)+0.1; // add small offset to avoid floating point errors with modulo
    float pixelsPerSlice = textureSize * textureSize;
    float sliceIndex = floor(index / pixelsPerSlice);
    float slicePixelIndex = mod(index,pixelsPerSlice);

    float x = mod(slicePixelIndex,textureSize);
    float y = floor(slicePixelIndex / textureSize);

    vec3 uvw = vec3((x + 0.5) / textureSize, (y + 0.5) / textureSize, (sliceIndex + 0.5) / numSlices);

    // Position
    position = texture(positionTexture, uvw).xyz;
    
    
    
    
    vec4 cov1 = texture(cov1Texture, uvw);
    vec4 cov2 = texture(cov2Texture, uvw);

    covariance[0][0] = cov1.x;
    covariance[1][0] = cov1.y;
    covariance[0][1] = cov1.y;
    covariance[2][0] = cov1.z;
    covariance[0][2] = cov1.z;

    covariance[1][1] = cov2.x;
    covariance[2][1] = cov2.y;
    covariance[1][2] = cov2.y;
    covariance[2][2] = cov2.z;

    
     

    //covariance *= 4.0;
    mat3 modelRotation = zUpToYUpMatrix3x3*transpose(mat3(modelMatrix));
    covariance = transpose(zUpToYUpMatrix3x3) * covariance * zUpToYUpMatrix3x3;
    covariance = transpose(modelRotation) * covariance * (modelRotation);

    // Color
    color = texture(colorTexture, uvw);
    // color = vec4(uvw.z, 0.0,0.0,1.0);
}

void modelTransform(in vec3 splatPosition, in mat3 covariance, inout vec3 vertexPosition){
    vec3 upReference = vec3(0.0, 1.0, 0.0);
    vec3 look = normalize(cameraPosition - splatPosition);
    vec3 right = normalize(cross(upReference, look));

    float rightLength = length(cross(upReference, look));
    if (rightLength < 1e-6) { // Check if vectors are parallel
        upReference = vec3(1.0, 0.0, 0.0); // Choose an alternative up vector
        right = normalize(cross(upReference, look));
    }

    vec3 up = cross(look, right);

    // Construct the billboard rotation matrix
    mat3 billboardRot = mat3(
        right.x, right.y, right.z,
        up.x, up.y, up.z,
        look.x, look.y, look.z);

    mat3 cov2D = transpose(billboardRot) * covariance * billboardRot;
    
    float a = max(cov2D[0][0],1e-6);
    float b = cov2D[0][1];
    
    float c = max(cov2D[1][1],1e-6);

    
    float trace = a + c;
    float det = a * c - b * b;
    

    float traceOver2 = 0.5 * trace;
    float dist = sqrt(max(traceOver2*traceOver2 - det, 0.0));
    //float dist = sqrt(max(0.1, traceOver2 * traceOver2 - det));

    float lambda1 = max(0.0, traceOver2 + dist);
    float lambda2 = max(0.0, traceOver2 - dist);


    vec2 eigenvector1;
    if(abs(covariance[0][1]) < 1e-7 && abs(covariance[0][2]) < 1e-7 && abs(covariance[1][2]) < 1e-7){
					eigenvector1 = vec2(0,1);
	}else{
		eigenvector1 = normalize(vec2(b, lambda1 - a));
	}
    vec2 eigenvector2 = vec2(-eigenvector1.y, eigenvector1.x);
    float l1 = sqrt(lambda1);
    float l2 = sqrt(lambda2);

    eigenvector1 *= l1*2.0;
    eigenvector2 *= l2*2.0;
    vertexPosition.xy = vertexPosition.x * eigenvector1 + vertexPosition.y * eigenvector2;
    vertexPosition = billboardRot * vertexPosition + splatPosition;
}


void main() {
    vUv = vec2(position);

    splatPositionModel = vec3(0.0);
    mat3 covariance = mat3(0.0);
    getVertexData(splatPositionModel, covariance);
    splatCrop = 0.5*sqrt(color.w); // discard more pixels when opacity is low
    splatPositionWorld = (modelMatrix * vec4(splatPositionModel, 1.0)).xyz;
    

    vec3 outPosition = vec3(position)*sizeMultiplier;
    modelTransform(splatPositionWorld, covariance, outPosition);
    
    gl_Position = projectionMatrix * viewMatrix * vec4(outPosition, 1.0);
    /* if(computeLinearDepth){
        orthographicDepth = viewZToOrthographicDepth( -gl_Position.w, cameraNear, cameraFar );
    } */
    
    vec4 centerP = projectionMatrix * viewMatrix * vec4(splatPositionWorld, 1.0);
    #if defined( USE_LOGDEPTHBUF )
	    float isPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
        splatDepth = isPerspective == 0.0 ? centerP.z : log2( 1.0 + centerP.w ) * logDepthBufFC * 0.5;
    #else
        splatDepth = (centerP.z / centerP.w)* 0.5 + 0.5;
    #endif

    
}
`};
export function splatsFragmentShader() {
    return `
precision highp float;

in vec4 color;
in vec2 vUv;
in vec3 splatPositionModel;
in vec3 splatPositionWorld;
in float splatDepth;
//in float orthographicDepth;
in float splatCrop;
uniform float textureSize;
uniform float cropRadius;

void main() {
    if(length(splatPositionModel)>cropRadius) discard;
    float l = length(vUv);
    
    // Early discard for pixels outside the radius
    if (l > 0.5) {
        discard;
    };
     vec2 p = vUv * 4.0;
    float alpha = exp(-dot(p, p));

    gl_FragColor = vec4(pow(color.xyz,vec3(1.0/2.2)), color.w * pow(alpha, 1.8)); 
    //gl_FragColor = vec4(splatDepth,0.0,0.0,1.0); 
    //gl_FragDepth = splatDepth;
    
}`
};

function vertexCopyShader() {
    return `

out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
};

function fragmentCopyShader2D() {
    return `
precision highp float;

uniform sampler2D sourceTexture;

in vec2 vUv;

void main() {
    gl_FragColor = texture( sourceTexture, vUv );
}`
};


function fragmentCopyShader3D() {
    return `
precision highp float;

uniform sampler3D sourceTexture;
uniform float w;

in vec2 vUv;

void main() {
    gl_FragColor = texture( sourceTexture, vec3(vUv, w) );
}`
};