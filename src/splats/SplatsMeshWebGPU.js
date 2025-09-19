
// SplatsMeshWebGPU.fixed.js
import {
  Mesh,
  InstancedBufferGeometry,
  BufferAttribute,
  InstancedBufferAttribute,
  DynamicDrawUsage,
  Data3DTexture,
  UnsignedIntType,
  RGBAIntegerFormat,
  NearestFilter,
  Vector2,
  Vector3,
  Matrix3,
  Matrix4
} from 'three';

import {
  wgslFn, uniform, texture, attribute,
  varyingProperty, cameraProjectionMatrix, cameraViewMatrix, modelWorldMatrix
} from 'three/tsl';
import { MeshBasicNodeMaterial } from 'three/webgpu';

import { gamma } from 'mathjs';
import { MinPriorityQueue } from 'data-structure-typed';
import WorkerConstructor from './PointsManager.worker.js?worker&inline';
import * as splatWGSL from './splats.wgsl.js';
import { SplatsCollider } from './SplatsColider';

function packHalf2x16(x, y) {
  const buffer = new ArrayBuffer(4);
  const uint16View = new Uint16Array(buffer);
  const uint32View = new Uint32Array(buffer);
  function toHalfFloat(val) {
    const floatBuf = new Float32Array(1);
    const uintBuf = new Uint32Array(floatBuf.buffer);
    floatBuf[0] = val;
    const xBits = uintBuf[0];
    const sign = (xBits >> 31) & 0x1;
    let exponent = (xBits >> 23) & 0xff;
    let mantissa = xBits & 0x7fffff;
    if (exponent === 0xff) {
      return (sign << 15) | 0x7c00 | (mantissa !== 0 ? (mantissa >> 13) : 0);
    }
    if (exponent === 0) {
      if (mantissa === 0) return sign << 15;
      while ((mantissa & 0x800000) === 0) { mantissa <<= 1; exponent--; }
      mantissa &= 0x7fffff; exponent++;
    }
    exponent = exponent - 127 + 15;
    if (exponent >= 0x1f) return (sign << 15) | 0x7c00;
    if (exponent <= 0) {
      if (exponent < -10) return sign << 15;
      mantissa |= 0x800000;
      const shift = 14 - exponent;
      return (sign << 15) | ((mantissa >> shift) + ((mantissa >> (shift - 1)) & 1));
    }
    return (sign << 15) | (exponent << 10) | (mantissa >> 13);
  }
  uint16View[0] = toHalfFloat(x);
  uint16View[1] = toHalfFloat(y);
  return uint32View[0];
}

class SplatsMeshWebGPU extends Mesh {
  constructor(renderer, isStatic, fragShader) {
    const textureSize = 1024;
    const numTextures = 1;
    const batchSize = Math.min(Math.ceil(4096 / textureSize) * textureSize, Math.pow(textureSize, 2));
    let maxSplats = numTextures * Math.pow(textureSize, 2);
    maxSplats = Math.floor(maxSplats / batchSize) * batchSize;

    const positionColorArray = new Uint32Array(textureSize * textureSize * numTextures * 4);
    const covarianceArray = new Uint32Array(textureSize * textureSize * numTextures * 4);
    const positionColorTexture = new Data3DTexture(positionColorArray, textureSize, textureSize, numTextures);
    positionColorTexture.type = UnsignedIntType;
    positionColorTexture.format = RGBAIntegerFormat;
    positionColorTexture.internalFormat = 'rgba32uint';
    positionColorTexture.magFilter = NearestFilter;
    positionColorTexture.minFilter = NearestFilter;
    positionColorTexture.needsUpdate = true;

    const covarianceTexture = new Data3DTexture(covarianceArray, textureSize, textureSize, numTextures);
    covarianceTexture.type = UnsignedIntType;
    covarianceTexture.format = RGBAIntegerFormat;
    covarianceTexture.internalFormat = 'rgba32uint';
    covarianceTexture.magFilter = NearestFilter;
    covarianceTexture.minFilter = NearestFilter;
    covarianceTexture.needsUpdate = true;

    renderer.initTexture(positionColorTexture);
    renderer.initTexture(covarianceTexture);

    const geometry = new InstancedBufferGeometry();
    const vertices = new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
    const indices = [0, 2, 1, 2, 3, 1];
    geometry.setIndex(indices);
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    const orderArray = new Uint32Array(maxSplats);
    const orderAttribute = new InstancedBufferAttribute(orderArray, 1, false);
    orderAttribute.setUsage(DynamicDrawUsage);
    orderAttribute.needsUpdate = true;
    geometry.setAttribute('order', orderAttribute);
    geometry.instanceCount = 0;

    // scalar uniforms
    const params = {
      textureSize: uniform(textureSize, 'uint'),
      sizeMultiplier: uniform(1.0),
      k: uniform(2.0),
      beta_k: uniform(2.0),
      minSplatPixelSize: uniform(0.0),
      minOpacity: uniform(0.01),
      culling: uniform(0, 'uint'),
      antialiasingFactor: uniform(2.0),
      cropRadius: uniform(Number.MAX_VALUE),
      depthBias: uniform(0.0),
      viewportPixelSize: uniform(new Vector2()),
      zUpToYUpMatrix3x3: uniform(new Matrix3().set(1, 0, 0, 0, 0, 1, 0, -1, 0))
    };

    // varyings
    const vUv = varyingProperty('vec2', 'vUv');
    const vStds = varyingProperty('float', 'vStds');
    const vColor = varyingProperty('vec4', 'vColor');
    const vSplatDepth = varyingProperty('float', 'vSplatDepth');

    const vs = wgslFn(splatWGSL.vertex, [vUv, vStds, vColor, vSplatDepth]);
    const fs = wgslFn(fragShader ? fragShader : splatWGSL.fragment);
    const ds = wgslFn(splatWGSL.depth);

    const material = new MeshBasicNodeMaterial();
    const orderNode = attribute('order', 'uint');
    const quadPos = attribute('position');
    const posTex = texture(positionColorTexture);
    const covTex = texture(covarianceTexture);

    const commonVSParams = {
      order: orderNode,
      quadPos,
      projectionMatrix: cameraProjectionMatrix,
      viewMatrix: cameraViewMatrix,
      modelMatrix: modelWorldMatrix,
      positionColor3D: posTex,
      covariance3D: covTex,
      textureSize: params.textureSize,
      sizeMultiplier: params.sizeMultiplier,
      k: params.k,
      beta_k: params.beta_k,
      minSplatPixelSize: params.minSplatPixelSize,
      minOpacity: params.minOpacity,
      culling: params.culling,
      antialiasingFactor: params.antialiasingFactor,
      cropRadius: params.cropRadius,
      depthBias: params.depthBias,
      viewportPixelSize: params.viewportPixelSize,
      zUpToYUpMatrix3x3: params.zUpToYUpMatrix3x3
    };

    material.positionNode = vs(commonVSParams);
    material.colorNode = fs({
      vUv, vStds, vColor,
      k: params.k,
      beta_k: params.beta_k
    });
    material.depthTest = true;
    material.depthWrite = false;
    material.transparent = true;
    material.side = 1;
    material.blending = 1;
    material.depthNode = ds({ vSplatDepth });

    super(geometry, material);

    this._vertexNodeFn = (args) => vs(args);
    this._fragmentNodeFn = (args) => fs(args);
    this._depthNodeFn = (args) => ds(args);

    this.matrixAutoUpdate = false;
    this.numBatches = 0;
    this.numVisibleBatches = 0;
    this.orderAttribute = orderAttribute;
    this.textureSize = textureSize;
    this.numTextures = numTextures;
    this.batchSize = batchSize;
    this.maxSplats = maxSplats;
    this.numSplatsRendered = 0;
    this.positionColorTexture = positionColorTexture;
    this.covarianceTexture = covarianceTexture;
    this.renderer = renderer;
    this.material = material;
    this.params = params;
    this.sortID = 0;

    this.freeAddresses = new MinPriorityQueue();
    for (let i = 0; i < this.maxSplats; i += batchSize) {
      this.freeAddresses.add(i);
    }

    this.worker = new WorkerConstructor();
    this.sortListeners = [];
    this.worker.onmessage = (message) => {
      const newOrder = new Uint32Array(message.data.order);
      this.numSplatsRendered = newOrder.length;
      if (newOrder.length > this.orderAttribute.count) {
        const newGeometry = new InstancedBufferGeometry();
        newGeometry.setIndex(indices);
        newGeometry.setAttribute('position', new BufferAttribute(vertices, 3));
        const newOrderArray = new Uint32Array(this.maxSplats);
        const newOrderAttribute = new InstancedBufferAttribute(newOrderArray, 1, false);
        newOrderAttribute.setUsage(DynamicDrawUsage);
        newGeometry.setAttribute('order', newOrderAttribute);
        newGeometry.instanceCount = 0;
        this.geometry.dispose();
        this.geometry = newGeometry;
        this.orderAttribute = newOrderAttribute;

        const orderNode2 = attribute('order', 'uint');
        const quadPos2 = attribute('position');

        this.material.positionNode = this._vertexNodeFn({
          ...commonVSParams,
          order: orderNode2,
          quadPos: quadPos2,
          positionColor3D: texture(this.positionColorTexture),
          covariance3D: texture(this.covarianceTexture)
        });
        this.material.colorNode = this._fragmentNodeFn({
          vUv, vStds, vColor, k: this.params.k, beta_k: this.params.beta_k
        });
        this.material.depthNode = this._depthNodeFn({ vSplatDepth });
      }
      this.orderAttribute.clearUpdateRanges();
      this.orderAttribute.set(newOrder);
      this.orderAttribute.addUpdateRange(0, newOrder.length);
      this.orderAttribute.needsUpdate = true;
      this.geometry.instanceCount = message.data.count;
      this.geometry.needsUpdate = true;
      for (let i = this.sortListeners.length - 1; i >= 0; i--) {
        const done = this.sortListeners[i](message.data.id);
        if (done) this.sortListeners.splice(i, 1);
      }
    };
    this.cameraPosition = new Vector3(0, 0, 0);
    this.viewProjModel = undefined;
    this.rotateOnAxis(new Vector3(1, 0, 0), Math.PI * 0.5);
    this.frustumCulled = false;
    this.splatsCPUCuling = false;
  }

  setQuality(quality) {
    quality = Math.max(0, Math.min(1, 1 - quality));
    const k = 2 + quality * 2;
    this.params.k.value = k;
    this.params.beta_k.value = Math.pow((4.0 * gamma(2.0 / k)) / k, k / 2);
    this.params.minSplatPixelSize.value = quality * 5;
    this.params.minOpacity.value = 0.01;
  }

  setSplatsCPUCulling(splatsCPUCuling) {
    this.splatsCPUCuling = splatsCPUCuling;
    this.params.culling.value = splatsCPUCuling ? 1 : 0;
  }

  setSplatsCropRadius(cropRadius) {}
  setSplatsSizeMultiplier(sizeMultiplier) {}
  setDepthBias(depthBias) { this.params.depthBias.value = depthBias; }

  updateShaderParams(camera) {
    this.renderer.getSize(this.params.viewportPixelSize.value);
    const pixelRatio = this.renderer.getPixelRatio();
    this.params.viewportPixelSize.value.multiplyScalar(pixelRatio);
    if (pixelRatio < 1) {
      this.params.antialiasingFactor.value = 2;
    } else {
      this.params.antialiasingFactor.value = 2;
    }
  }

  dispose() {
    this.material.dispose();
    this.positionColorTexture.dispose();
    this.covarianceTexture.dispose();
    this.worker.terminate();
    this.worker = null;
    this.orderAttribute.array = undefined;
    this.geometry.dispose();
  }

  addSplatsTile(positions, colors, cov1, cov2) {
    if (!this.worker) return;
    const positionArray = positions.data ? positions.data.array : positions.array;
    const stride = positions.data && positions.data.isInterleavedBuffer ? positions.data.stride : 3;
    const offset = positions.data && positions.data.isInterleavedBuffer ? positions.offset : 0;
    const numBatches = Math.ceil(positionArray.length / (this.batchSize * stride));
    const textureAddresses = [];
    const pointManagerAddresses = [];

    const positionsOnly = new Float32Array((positionArray.length / stride) * 3);
    for (let i = 0; i < positionArray.length / stride; i++) {
      positionsOnly[i * 3 + 0] = positionArray[i * stride + offset + 0];
      positionsOnly[i * 3 + 1] = positionArray[i * stride + offset + 1];
      positionsOnly[i * 3 + 2] = positionArray[i * stride + offset + 2];
    }

    if (numBatches > this.freeAddresses.size) {
      this.growTextures();
    }

    for (let i = 0; i < numBatches; i++) {
      const address = this.freeAddresses.poll();
      if (isNaN(address)) console.log('insufficient texture size to store splats info');
      textureAddresses.push(address);
      pointManagerAddresses.push(address * 3);
      const startIndex = i * this.batchSize;
      this.addSplatsBatch(startIndex, address, positionsOnly, colors, cov1, cov2);
    }

    this.worker.postMessage({
      method: 'addBatches',
      insertionIndexes: pointManagerAddresses,
      positions: positionArray.buffer,
      offset: offset,
      stride: stride,
      batchSize: this.batchSize
    }, [positionArray.buffer]);

    let visible = false;
    const self = this;
    const positionsOnlyRef = positionsOnly;
    let raycast = (ray, intersects, threshold) => {
      const threshSquared = threshold * threshold;
      const cropRadiusSquared = Math.pow(self.params.cropRadius.value, 2);
      const tempMatrix = new Matrix3();
      const splatCenter = new Vector3();
      const V = new Vector3();
      const W = new Vector3();
      const closestPointVec = new Vector3();
      const numSplats = positionsOnlyRef.length / 3;
      for (let i = 0; i < numSplats; i++) {
        splatCenter.set(positionsOnlyRef[i * 3], -positionsOnlyRef[i * 3 + 2], positionsOnlyRef[i * 3 + 1]);
        if (splatCenter.lengthSq() > cropRadiusSquared || ray.distanceSqToPoint(splatCenter) > threshSquared) continue;
        reconstructCovariance(cov1, cov2, i, tempMatrix);
        const t = V.copy(splatCenter).sub(ray.origin).dot(ray.direction);
        if (t < 0) continue;
        closestPointVec.copy(ray.direction).multiplyScalar(t).add(ray.origin);
        const vecToClosest = V.copy(closestPointVec).sub(splatCenter);
        solve3x3LinearSystem(tempMatrix, vecToClosest, W);
        const mahalanobisSq = vecToClosest.dot(W);
        const hitOpacity = colors.getW(i) * Math.exp(-0.5 * mahalanobisSq);
        if (hitOpacity > 0.01) {
          intersects.push({ distance: t, point: closestPointVec.clone(), opacity: hitOpacity, type: 'splat', object: this });
        }
      }
    };
    const hide = () => {
      if (visible === true && self.worker) {
        self.numVisibleBatches--;
        visible = false;
        self.worker.postMessage({
          method: 'hideBatches',
          insertionIndexes: pointManagerAddresses,
          xyz: [self.cameraPosition.x, self.cameraPosition.z, -self.cameraPosition.y],
          vpm: this.viewProjModel && this.splatsCPUCuling ? this.viewProjModel.toArray() : undefined,
          id: self.sortID++
        });
      }
    };
    const show = (callback) => {
      if (visible === false && self.worker) {
        self.numVisibleBatches++;
        visible = true;
        const sortID = self.sortID;
        const listener = (id) => {
          if (id >= sortID) { callback(); return true; }
          return false;
        };
        self.sortListeners.push(listener);
        self.worker.postMessage({
          method: 'showBatches',
          insertionIndexes: pointManagerAddresses,
          xyz: [self.cameraPosition.x, self.cameraPosition.z, -self.cameraPosition.y],
          vpm: this.viewProjModel && this.splatsCPUCuling ? this.viewProjModel.toArray() : undefined,
          id: self.sortID++
        });
      }
    };
    const remove = () => {
      if (!self.worker) return;
      raycast = undefined;
      self.worker.postMessage({
        method: 'removeBatches',
        insertionIndexes: pointManagerAddresses,
        xyz: [self.cameraPosition.x, self.cameraPosition.z, -self.cameraPosition.y],
        vpm: this.viewProjModel && this.splatsCPUCuling ? this.viewProjModel.toArray() : undefined,
        id: self.sortID++
      });
      textureAddresses.forEach(address => self.freeAddresses.add(address));
    };
    return { hide, show, remove, sort: this.sort, raycast, isSplatsBatch: true };
  }

  addSplatsBatch(positionsStartIndex, address, positions, colors, cov1, cov2) {
    const texSize = this.textureSize;
    const sliceSize = texSize * texSize;
    const sliceIndex = Math.floor(address / sliceSize);
    const pixelInSlice = address % sliceSize;
    const baseY = Math.floor(pixelInSlice / texSize);
    const baseX = pixelInSlice % texSize;
    const positionArray = this.positionColorTexture.image.data;
    const covarianceArray = this.covarianceTexture.image.data;
    const f32Buf = new Float32Array(1);
    const u32Buf = new Uint32Array(f32Buf.buffer);
    function f32ToU32(f) { f32Buf[0] = f; return u32Buf[0]; }
    const batchCount = this.batchSize;
    for (let i = 0; i < batchCount; i++) {
      const posIndex = positionsStartIndex + i;
      if (posIndex >= positions.length / 3) break;
      const destX = (baseX + (i % texSize)) % texSize;
      const destY = baseY + Math.floor(i / texSize);
      const destIdx = ((sliceIndex * texSize + destY) * texSize + destX) * 4;
      const pIndex3 = posIndex * 3;
      positionArray[destIdx] = f32ToU32(positions[pIndex3]);
      positionArray[destIdx + 1] = f32ToU32(positions[pIndex3 + 1]);
      positionArray[destIdx + 2] = f32ToU32(positions[pIndex3 + 2]);
      const r = Math.floor(colors.getX(posIndex) * 255 + 0.5) | 0;
      const g = Math.floor(colors.getY(posIndex) * 255 + 0.5) | 0;
      const b = Math.floor(colors.getZ(posIndex) * 255 + 0.5) | 0;
      const a = Math.floor(colors.getW(posIndex) * 255 + 0.5) | 0;
      positionArray[destIdx + 3] = (r | (g << 8) | (b << 16) | (a << 24)) >>> 0;
      const covDestIdx = destIdx;
      covarianceArray[covDestIdx] = packHalf2x16(cov1.getX(posIndex), cov1.getY(posIndex));
      covarianceArray[covDestIdx + 1] = packHalf2x16(cov1.getZ(posIndex), cov2.getX(posIndex));
      covarianceArray[covDestIdx + 2] = packHalf2x16(cov2.getY(posIndex), cov2.getZ(posIndex));
    }
    this.positionColorTexture.needsUpdate = true;
    this.covarianceTexture.needsUpdate = true;
  }

  growTextures() {
    for (let i = this.maxSplats; i < this.maxSplats + this.textureSize * this.textureSize; i += this.batchSize) {
      this.freeAddresses.add(i);
    }
    this.maxSplats += this.textureSize * this.textureSize;
    const newNumTextures = this.numTextures + 1;
    const newPositionColorArray = new Uint32Array(this.textureSize * this.textureSize * newNumTextures * 4);
    const newCovarianceArray = new Uint32Array(this.textureSize * this.textureSize * newNumTextures * 4);
    const oldSliceSize = this.textureSize * this.textureSize * 4;
    const oldSlices = this.numTextures;
    for (let s = 0; s < oldSlices; s++) {
      const oldOffset = s * oldSliceSize;
      const newOffset = s * oldSliceSize;
      newPositionColorArray.set(this.positionColorTexture.image.data.subarray(oldOffset, oldOffset + oldSliceSize), newOffset);
      newCovarianceArray.set(this.covarianceTexture.image.data.subarray(oldOffset, oldOffset + oldSliceSize), newOffset);
    }
    const newPositionColorTexture = new Data3DTexture(newPositionColorArray, this.textureSize, this.textureSize, newNumTextures);
    newPositionColorTexture.type = UnsignedIntType;
    newPositionColorTexture.format = RGBAIntegerFormat;
    newPositionColorTexture.internalFormat = 'rgba32uint';
    newPositionColorTexture.magFilter = NearestFilter;
    newPositionColorTexture.minFilter = NearestFilter;
    newPositionColorTexture.needsUpdate = true;
    const newCovarianceTexture = new Data3DTexture(newCovarianceArray, this.textureSize, this.textureSize, newNumTextures);
    newCovarianceTexture.type = UnsignedIntType;
    newCovarianceTexture.format = RGBAIntegerFormat;
    newCovarianceTexture.internalFormat = 'rgba32uint';
    newCovarianceTexture.magFilter = NearestFilter;
    newCovarianceTexture.minFilter = NearestFilter;
    newCovarianceTexture.needsUpdate = true;
    this.renderer.initTexture(newPositionColorTexture);
    this.renderer.initTexture(newCovarianceTexture);
    this.positionColorTexture.dispose();
    this.covarianceTexture.dispose();
    this.positionColorTexture = newPositionColorTexture;
    this.covarianceTexture = newCovarianceTexture;

    const orderNode = attribute('order', 'uint');
    const quadPos = attribute('position');

    this.material.positionNode = this._vertexNodeFn({
      order: orderNode,
      quadPos,
      projectionMatrix: cameraProjectionMatrix,
      viewMatrix: cameraViewMatrix,
      modelMatrix: modelWorldMatrix,
      positionColor3D: texture(newPositionColorTexture),
      covariance3D: texture(newCovarianceTexture),
      textureSize: this.params.textureSize,
      sizeMultiplier: this.params.sizeMultiplier,
      k: this.params.k,
      beta_k: this.params.beta_k,
      minSplatPixelSize: this.params.minSplatPixelSize,
      minOpacity: this.params.minOpacity,
      culling: this.params.culling,
      antialiasingFactor: this.params.antialiasingFactor,
      cropRadius: this.params.cropRadius,
      depthBias: this.params.depthBias,
      viewportPixelSize: this.params.viewportPixelSize,
      zUpToYUpMatrix3x3: this.params.zUpToYUpMatrix3x3
    });
    this.material.colorNode = this._fragmentNodeFn({
      vUv: varyingProperty('vec2', 'vUv'),
      vStds: varyingProperty('float', 'vStds'),
      vColor: varyingProperty('vec4', 'vColor'),
      k: this.params.k,
      beta_k: this.params.beta_k
    });
    this.material.depthNode = this._depthNodeFn({ vSplatDepth: varyingProperty('float', 'vSplatDepth') });

    this.numTextures = newNumTextures;
  }

  sort(cameraPosition, viewProjModel) {
    if (!this.worker) return;
    if (!cameraPosition) {
      this.worker.postMessage({
        method: 'sort',
        xyz: [this.cameraPosition.x, this.cameraPosition.z, -this.cameraPosition.y],
        vpm: this.viewProjModel && this.splatsCPUCuling ? this.viewProjModel.toArray() : undefined,
        id: this.sortID++
      });
    } else if (!this.cameraPosition || !cameraPosition.equals(this.cameraPosition)) {
      this.cameraPosition.copy(cameraPosition);
      if (!!viewProjModel) {
        if (!this.viewProjModel) this.viewProjModel = new Matrix4();
        this.viewProjModel.copy(viewProjModel);
        const inverseZUpToYUpMatrix4x4 = new Matrix4().set(
          1, 0, 0, 0,
          0, 0, -1, 0,
          0, 1, 0, 0,
          0, 0, 0, 1
        );
        this.viewProjModel.multiply(inverseZUpToYUpMatrix4x4);
      } else {
        this.viewProjModel = undefined;
      }
      this.worker.postMessage({
        method: 'sort',
        xyz: [this.cameraPosition.x, this.cameraPosition.z, -this.cameraPosition.y],
        vpm: this.viewProjModel && this.splatsCPUCuling ? this.viewProjModel.toArray() : undefined,
        id: this.sortID++
      });
    }
  }
}

function reconstructCovariance(cov1, cov2, index, target) {
  const c1x = cov1.getX(index);
  const c1y = cov1.getY(index);
  const c1z = cov1.getZ(index);
  const c2x = cov2.getX(index);
  const c2y = cov2.getY(index);
  const c2z = cov2.getZ(index);
  target.set(c1x, c1y, c1z, c1y, c2x, c2y, c1z, c2y, c2z);
}

function solve3x3LinearSystem(A, b, target) {
  const det = A.determinant();
  if (Math.abs(det) < 1e-12) { target.set(0, 0, 0); return; }
  const invDet = 1.0 / det;
  const t1 = new Matrix3().copy(A); t1.elements[0] = b.x; t1.elements[3] = b.y; t1.elements[6] = b.z;
  const t2 = new Matrix3().copy(A); t2.elements[1] = b.x; t2.elements[4] = b.y; t2.elements[7] = b.z;
  const t3 = new Matrix3().copy(A); t3.elements[2] = b.x; t3.elements[5] = b.y; t3.elements[8] = b.z;
  target.set(t1.determinant() * invDet, t2.determinant() * invDet, t3.determinant() * invDet);
}

export { SplatsMeshWebGPU };
