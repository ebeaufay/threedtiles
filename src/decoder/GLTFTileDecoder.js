// SplatsDecoder.js
import * as THREE from 'three';
import { loadSpz } from '@spz-loader/core';
// Import a module worker for SPZ decoding. When compiled/bundled by tooling such as Vite,
// the '?worker' suffix ensures a proper Worker constructor is generated. If the bundler
// does not support this convention the import will silently fail and fall back to main‑thread decoding.
import GLTFTileWorkerConstructor from './GLTFTileDecoder.worker.js?worker&inline';

class GLTFTileDecoder {
  constructor(gltfLoader, renderer) {
    this.gltfLoader = gltfLoader;
    this.renderer = renderer;
    if (this.gltfLoader?.register) {
      this.gltfLoader.register(() => ({ name: 'KHR_spz_gaussian_splats_compression' }));
    }
    // Create a dedicated worker that will handle the heavy numeric work
    // (SPZ decoding and KHR processing). If worker creation fails we fall
    // back to main-thread decoding logic.
    try {
      this.worker = new GLTFTileWorkerConstructor();
      this.workerJobId = 0;
      this.workerCallbacks = new Map();
      this.worker.onmessage = (e) => {
        const { id, pos, col, c0, c1, error } = e.data || {};
        const cb = this.workerCallbacks.get(id);
        if (!cb) return;
        this.workerCallbacks.delete(id);
        if (error) cb.reject(new Error(error));
        else cb.resolve({ pos, col, c0, c1 });
      };
      this.worker.onerror = (err) => {
        // propagate worker errors to all outstanding callbacks
        for (const [, cb] of this.workerCallbacks) {
          cb.reject(err instanceof Error ? err : new Error(String(err)));
        }
        this.workerCallbacks.clear();
      };
    } catch (_) {
      // Worker creation failed; leave worker undefined to trigger fallback.
      this.worker = undefined;
    }
  }

  parseSplats(arrayBuffer, sceneZupToYUp, meshZUpToYUp, isUltraSplats) {
    return new Promise(async (resolve, reject) => {
      await this.#waitLoaderDeps();
      this.gltfLoader.parse(
        arrayBuffer,
        '',
        async (gltf) => {
          try {
            const tile = await this.#dispatch(gltf, isUltraSplats);
            
            resolve(tile);
          } catch (e) {
            reject(e);
          }
        },
        (err) => reject(err)
      );
    });
  }

  async #dispatch(gltf, isUltraSplats) {
    if(isUltraSplats){
      return this.#handleULTRA(gltf);
    }
    const parser = gltf.parser;
    const json = parser.json;
    const loc = this.#findPrim(json);
    if (loc?.type === 'SPZ') return this.#handleSPZ(parser, loc, gltf);
    if (loc?.type === 'KHR') return this.#handleKHR(parser, json, loc, gltf);
    if (loc?.type === 'ULTRA') return this.#handleULTRA(gltf);

    if(!gltf.scene) gltf.scene =  new THREE.Object3D();
    gltf.scene.asset = gltf.asset;
    return gltf.scene;
  }

  
  #findPrim(json) {
    if (!json?.meshes) return null;
    for (let m = 0; m < json.meshes.length; m++) {
      const mesh = json.meshes[m];
      for (let p = 0; p < (mesh.primitives?.length || 0); p++) {
        const prim = mesh.primitives[p];
        const ext = prim?.extensions;
        if (
          ext?.KHR_spz_gaussian_splats_compression &&
          Number.isInteger(ext.KHR_spz_gaussian_splats_compression.bufferView)
        )
          return { mesh: m, prim: p, type: 'SPZ', bv: ext.KHR_spz_gaussian_splats_compression.bufferView };
        if (ext?.KHR_gaussian_splatting) return { mesh: m, prim: p, type: 'KHR' };
        if (ext?.ULTRA_splats) return { mesh: m, prim: p, type: 'ULTRA' };
      }
    }
    return null;
  }

  async #handleSPZ(parser, loc, gltf) {
    // Read the SPZ buffer view into its own ArrayBuffer so it can be
    // transferred to the worker without retaining the original glTF buffers.
    let ab = await parser.getDependency('bufferView', loc.bv);
    if (ab?.buffer?.byteLength) ab = ab.buffer.slice(ab.byteOffset, ab.byteLength + ab.byteOffset);
    // If our worker is available offload decoding to it. Otherwise fall back
    // to the original main-thread SPZ decoding logic.
    if (this.worker) {
      const jobId = this.workerJobId++;
      const p = new Promise((resolve, reject) => {
        this.workerCallbacks.set(jobId, { resolve, reject });
      });
      try {
        // transfer the SPZ buffer to the worker; the ArrayBuffer is detached
        // from the main thread immediately.
        this.worker.postMessage({ id: jobId, op: 'decodeSPZ', spz: ab }, [ab]);
      } catch (err) {
        // Posting can throw if the worker is broken; reject immediately.
        this.workerCallbacks.delete(jobId);
        throw err;
      }
      const { pos, col, c0, c1 } = await p;
      const positions = new Float32Array(pos);
      const colors = new Float32Array(col);
      const cov0 = new Float32Array(c0);
      const cov1 = new Float32Array(c1);
      const posAttr = new THREE.BufferAttribute(positions, 3);
      const colAttr = new THREE.BufferAttribute(colors, 4);
      const cov0Attr = new THREE.BufferAttribute(cov0, 3);
      const cov1Attr = new THREE.BufferAttribute(cov1, 3);
      gltf.scene.traverse((o) => o.dispose && o.dispose());
      return {
        isSplatsData: true,
        positions: posAttr,
        colors: colAttr,
        cov0: cov0Attr,
        cov1: cov1Attr,
      };
    }
    // Fallback synchronous decoding when no worker is available.
    const gs = await loadSpz(ab, {coordinateSystem: "LUF"});
    const n = gs.numPoints ?? gs.positions.length / 3;
    const positions = new Float32Array(gs.positions);
    const rgb = gs.colors ?? gs.color;
    const aArr = gs.alphas ?? gs.opacity ?? gs.opacities;
    const colors = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const r = rgb[i * 3 + 0],
        g = rgb[i * 3 + 1],
        b = rgb[i * 3 + 2];
      const a = aArr ? this.#toUnitAlpha(aArr[i]) : 1;
      const [lr, lg, lb] = this.#toLinearFromSh0Maybe(r, g, b);
      colors.set([lr, lg, lb, a], i * 4);
    }
    const rot = gs.rotations ?? gs.quaternions;
    const scl = gs.scales ?? gs.scale;
    const cov = this.#covFromRotScale(rot, scl);
    const posAttr = new THREE.BufferAttribute(positions, 3);
    const colAttr = new THREE.BufferAttribute(colors, 4);
    const cov0Attr = new THREE.BufferAttribute(cov.c0, 3);
    const cov1Attr = new THREE.BufferAttribute(cov.c1, 3);
    gltf.scene.traverse((o) => o.dispose && o.dispose());
    return {
      isSplatsData: true,
      positions: posAttr,
      colors: colAttr,
      cov0: cov0Attr,
      cov1: cov1Attr,
    };
  }

  async #handleKHR(parser, json, loc, gltf) {
    const prim = json.meshes[loc.mesh].primitives[loc.prim];
    const getAcc = async (name) => {
      const idx = prim.attributes?.[name];
      if (Number.isInteger(idx)) return parser.getDependency('accessor', idx);
      return null;
    };
  
    // Obtain accessor objects (may contain .buffer and byte offsets)
    let posAcc = await getAcc('POSITION');
    if (!posAcc) return this.#handleULTRA(gltf);
    let colAcc = await getAcc('COLOR_0');
    let rotAcc = (await getAcc('ROTATION')) || (await getAcc('_ROTATION'));
    let sclAcc = (await getAcc('SCALE')) || (await getAcc('_SCALE'));
  
    // Build ArrayBuffer slices for transfer to the worker (if available)
    const posBuf = posAcc?.buffer ? posAcc.buffer.slice(posAcc.byteOffset, posAcc.byteOffset + posAcc.byteLength) : null;
    const colBuf = colAcc?.buffer ? colAcc.buffer.slice(colAcc.byteOffset, colAcc.byteOffset + colAcc.byteLength) : null;
    const rotBuf = rotAcc?.buffer ? rotAcc.buffer.slice(rotAcc.byteOffset, rotAcc.byteOffset + rotAcc.byteLength) : null;
    const sclBuf = sclAcc?.buffer ? sclAcc.buffer.slice(sclAcc.byteOffset, sclAcc.byteOffset + sclAcc.byteLength) : null;
  
    if (this.worker) {
      const jobId = this.workerJobId++;
      const p = new Promise((resolve, reject) => {
        this.workerCallbacks.set(jobId, { resolve, reject });
      });
      try {
        const transfer = [];
        const payload = { pos: posBuf, col: colBuf, rot: rotBuf, scl: sclBuf };
        if (posBuf) transfer.push(posBuf);
        if (colBuf) transfer.push(colBuf);
        if (rotBuf) transfer.push(rotBuf);
        if (sclBuf) transfer.push(sclBuf);
        this.worker.postMessage({ id: jobId, op: 'handleKHR', payload }, transfer);
      } catch (err) {
        this.workerCallbacks.delete(jobId);
        throw err;
      }
      const { pos, col, c0, c1 } = await p;
      const positions = new Float32Array(pos);
      const colors = new Float32Array(col);
      const cov0 = new Float32Array(c0);
      const cov1 = new Float32Array(c1);
      const posAttr = new THREE.BufferAttribute(positions, 3);
      const colAttr = new THREE.BufferAttribute(colors, 4);
      const cov0Attr = new THREE.BufferAttribute(cov0, 3);
      const cov1Attr = new THREE.BufferAttribute(cov1, 3);
      gltf.scene.traverse((o) => o.dispose && o.dispose());
      return {
        isSplatsData: true, positions: posAttr, colors: colAttr, cov0: cov0Attr, cov1: cov1Attr
      }
    }
  
    // Fallback: perform the same processing on the main thread (preserve existing logic)
    let pos = posAcc;
    if (pos?.buffer) pos = new Float32Array(pos.buffer, pos.byteOffset, pos.count * 3);
  
    let col = colAcc;
    if (col?.buffer) col = new Float32Array(col.buffer, col.byteOffset, (col.itemSize || 4) * col.count);
  
    let rot = rotAcc;
    let scl = sclAcc;
    if (rot?.buffer) rot = new Float32Array(rot.buffer, rot.byteOffset, rot.count * 4);
    if (scl?.buffer) scl = new Float32Array(scl.buffer, scl.byteOffset, scl.count * 3);
  
    const n = pos.length / 3;
    const colors = new Float32Array(n * 4);
    if (col) {
      const stride = col.length === n * 4 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const r = col[i * stride + 0], g = col[i * stride + 1], b = col[i * stride + 2];
        const [lr, lg, lb] = this.#toLinearFromSh0Maybe(r, g, b);
        colors.set([lr, lg, lb, stride === 4 ? col[i * stride + 3] : 1], i * 4);
      }
    } else {
      for (let i = 0; i < n; i++) colors.set([1, 1, 1, 1], i * 4);
    }
  
    const cov = this.#covFromRotScale(rot, scl);
  
    const posAttr = new THREE.BufferAttribute(pos, 3);
    const colAttr = new THREE.BufferAttribute(colors, 4);
    const cov0Attr = new THREE.BufferAttribute(cov.c0, 3);
    const cov1Attr = new THREE.BufferAttribute(cov.c1, 3);
  
    gltf.scene.traverse((o) => o.dispose && o.dispose());
    return {
      isSplatsData: true, positions: posAttr, colors: colAttr, cov0: cov0Attr, cov1: cov1Attr
    }
  }

  async #handleULTRA(gltf) {
    const decoded = gltf.scene.children[0];
    const g = decoded.geometry;
    const positions = g.attributes.position;
    const colors = g.attributes.color;
    const cov0 = g.attributes.cov_0 || g.attributes.COV_0;
    const cov1 = g.attributes.cov_1 || g.attributes.COV_1;

    gltf.scene.traverse((o) => o.dispose && o.dispose());
    return {
      isSplatsData: true, positions: positions, colors: colors, cov0: cov0, cov1: cov1
    }

  }

  #covFromRotScale(rot, logScale) {
    const n = (rot?.length || 0) / 4;
    const c0 = new Float32Array(n * 3);
    const c1 = new Float32Array(n * 3);
    const R = new Float32Array(9);
    for (let i = 0; i < n; i++) {
      const x = rot ? rot[i * 4 + 0] : 0, y = rot ? rot[i * 4 + 1] : 0, z = rot ? rot[i * 4 + 2] : 0, w = rot ? rot[i * 4 + 3] : 1;
      const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
      R[0] = 1 - 2 * (yy + zz); R[1] = 2 * (xy - wz); R[2] = 2 * (xz + wy);
      R[3] = 2 * (xy + wz); R[4] = 1 - 2 * (xx + zz); R[5] = 2 * (yz - wx);
      R[6] = 2 * (xz - wy); R[7] = 2 * (yz + wx); R[8] = 1 - 2 * (xx + yy);

      const sx = Math.max(1e-12, /* Math.exp */(logScale ? logScale[i * 3 + 0] : 0));
      const sy = Math.max(1e-12, /* Math.exp */(logScale ? logScale[i * 3 + 1] : 0));
      const sz = Math.max(1e-12, /* Math.exp */(logScale ? logScale[i * 3 + 2] : 0));
      const sxx = sx * sx, syy = sy * sy, szz = sz * sz;

      const m00 = R[0] * R[0] * sxx + R[1] * R[1] * syy + R[2] * R[2] * szz;
      const m10 = R[3] * R[0] * sxx + R[4] * R[1] * syy + R[5] * R[2] * szz;
      const m20 = R[6] * R[0] * sxx + R[7] * R[1] * syy + R[8] * R[2] * szz;
      const m11 = R[3] * R[3] * sxx + R[4] * R[4] * syy + R[5] * R[5] * szz;
      const m21 = R[6] * R[3] * sxx + R[7] * R[4] * syy + R[8] * R[5] * szz;
      const m22 = R[6] * R[6] * sxx + R[7] * R[7] * syy + R[8] * R[8] * szz;

      const j = i * 3;
      c0[j + 0] = m00; c0[j + 1] = m10; c0[j + 2] = m20;
      c1[j + 0] = m11; c1[j + 1] = m21; c1[j + 2] = m22;
    }
    return { c0, c1 };
  }

  #toUnitAlpha(a) {
    if (!Number.isFinite(a)) return 1;
    if (a >= 0 && a <= 1) return a;
    if (a >= 0 && a <= 255 && Math.abs(a - Math.round(a)) < 1e-3) return a / 255;
    if (a >= 0 && a <= 65535 && Math.abs(a - Math.round(a)) < 1e-3) return a / 65535;
    return Math.min(1, Math.max(0, a));
  }

  #toLinearFromSh0Maybe(r, g, b) {
    const isU8 = (v) => v >= 0 && v <= 255 && Math.abs(v - Math.round(v)) < 1e-3;
    const isU16 = (v) => v >= 0 && v <= 65535 && Math.abs(v - Math.round(v)) < 1e-3;
    const lin = (s) => (s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4));
    const clamp01 = (x) => Math.min(1, Math.max(0, x));

    let sr = r, sg = g, sb = b;

    if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
      // sRGB float 0–1
    } else if (isU8(r) && isU8(g) && isU8(b)) {
      sr = r / 255; sg = g / 255; sb = b / 255;
    } else if (isU16(r) && isU16(g) && isU16(b)) {
      sr = r / 65535; sg = g / 65535; sb = b / 65535;
    } else {
      const sh = (x) => 0.5 + 0.28209479177387814 * x;
      sr = sh(r); sg = sh(g); sb = sh(b);
    }

    sr = clamp01(sr); sg = clamp01(sg); sb = clamp01(sb);
    return [lin(sr), lin(sg), lin(sb)];
  }

  #waitLoaderDeps() {
    return new Promise((resolve) => {
      const i = setInterval(() => {
        const l = this.gltfLoader;
        if ((!l.hasDracoLoader || l.dracoLoader) && (!l.hasKTX2Loader || l.ktx2Loader)) {
          clearInterval(i); resolve();
        }
      }, 10);
    });
  }
}

export { GLTFTileDecoder };
