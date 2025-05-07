var Zt = Object.defineProperty;
var $t = (h, e, a) => e in h ? Zt(h, e, { enumerable: !0, configurable: !0, writable: !0, value: a }) : h[e] = a;
var le = (h, e, a) => $t(h, typeof e != "symbol" ? e + "" : e, a);
import * as E from "three";
import { Matrix3 as Da, Vector3 as D, Box3 as va, Matrix4 as xe, Ray as eA, BufferGeometry as Ze, LineBasicMaterial as It, LineSegments as mt, TrianglesDrawMode as aA, TriangleFanDrawMode as Ea, TriangleStripDrawMode as Bt, BufferAttribute as de, Loader as Fa, LoaderUtils as He, FileLoader as Be, MeshPhysicalMaterial as ee, Vector2 as Ct, Color as he, LinearSRGBColorSpace as K, SRGBColorSpace as se, SpotLight as tA, PointLight as AA, DirectionalLight as iA, Quaternion as pt, InstancedMesh as sA, InstancedBufferAttribute as Qa, Object3D as Et, TextureLoader as rA, ImageBitmapLoader as nA, InterleavedBuffer as oA, InterleavedBufferAttribute as cA, LinearMipmapLinearFilter as Xe, NearestMipmapLinearFilter as bA, LinearMipmapNearestFilter as dA, NearestMipmapNearestFilter as hA, LinearFilter as me, NearestFilter as v, RepeatWrapping as ya, MirroredRepeatWrapping as lA, ClampToEdgeWrapping as gA, PointsMaterial as fA, Material as ea, MeshStandardMaterial as Ua, DoubleSide as uA, MeshBasicMaterial as Me, PropertyBinding as IA, SkinnedMesh as mA, Mesh as wa, Line as BA, LineLoop as CA, Points as pA, Group as aa, PerspectiveCamera as EA, MathUtils as QA, OrthographicCamera as Qt, Skeleton as yA, AnimationClip as wA, Bone as kA, InterpolateDiscrete as xA, InterpolateLinear as yt, Texture as Ga, VectorKeyframeTrack as Ha, NumberKeyframeTrack as Na, QuaternionKeyframeTrack as La, ColorManagement as ka, FrontSide as We, Interpolant as jA, Sphere as SA, CompressedCubeTexture as DA, CompressedArrayTexture as vA, CompressedTexture as Oa, NoColorSpace as FA, RGBA_ASTC_6x6_Format as Ja, RGBA_ASTC_4x4_Format as wt, RedFormat as Te, RGFormat as Ue, RGBAFormat as $, UnsignedByteType as W, HalfFloatType as we, FloatType as R, DataTexture as Ge, Data3DTexture as RA, RGBA_S3TC_DXT1_Format as MA, RGB_PVRTC_4BPPV1_Format as TA, RGB_ETC2_Format as UA, RGB_ETC1_Format as GA, RGBA_S3TC_DXT5_Format as HA, RGBA_PVRTC_4BPPV1_Format as NA, RGBA_ETC2_EAC_Format as LA, RGBA_BPTC_Format as OA, RGB_BPTC_UNSIGNED_Format as JA, WebGL3DRenderTarget as re, ShaderMaterial as ta, InstancedBufferGeometry as Pa, DynamicDrawUsage as qa, Scene as PA, PlaneGeometry as qA } from "three";
class Wi {
  constructor() {
    this.cullMap = [], this.cullMaterial = new E.MeshBasicMaterial({ vertexColors: !0 }), this.cullMaterial.side = E.FrontSide, this.cullTarget = this._createCullTarget(), this.cullPixels = new Uint8Array(4 * this.cullTarget.width * this.cullTarget.height);
  }
  setSide(e) {
    this.cullMaterial.side = e;
  }
  _createCullTarget() {
    const e = new E.WebGLRenderTarget(Math.floor(0.05 * window.innerWidth), Math.floor(0.05 * window.innerHeight));
    return e.texture.format = E.RGBAFormat, e.texture.colorSpace = E.LinearSRGBColorSpace, e.texture.minFilter = E.NearestFilter, e.texture.magFilter = E.NearestFilter, e.texture.generateMipmaps = !1, e.stencilBuffer = !1, e.depthBuffer = !0, e.depthTexture = new E.DepthTexture(), e.depthTexture.format = E.DepthFormat, e.depthTexture.type = E.UnsignedShortType, e;
  }
  update(e, a, t) {
    let A = a.getRenderTarget(), i = e.overrideMaterial;
    e.overrideMaterial = this.cullMaterial, a.setRenderTarget(this.cullTarget), a.render(e, t), e.overrideMaterial = i, a.setRenderTarget(A), a.readRenderTargetPixels(this.cullTarget, 0, 0, this.cullTarget.width, this.cullTarget.height, this.cullPixels), this.cullMap = [];
    for (let s = 0; s < this.cullPixels.length; s += 4) {
      const r = E.MathUtils.clamp(this.cullPixels[s], 0, 255) << 16 ^ E.MathUtils.clamp(this.cullPixels[s + 1], 0, 255) << 8 ^ E.MathUtils.clamp(this.cullPixels[s + 2], 0, 255);
      this.cullMap[r] = !0;
    }
  }
  hasID(e) {
    return this.cullMap[e];
  }
}
const _ = new Da(), H = new D(), _a = new D(), Ka = new va(), qe = new xe(), za = new xe(), Va = new eA();
class Z {
  constructor(e) {
    this.center = new D(e[0], e[1], e[2]), this.e1 = new D(e[3], e[4], e[5]), this.e2 = new D(e[6], e[7], e[8]), this.e3 = new D(e[9], e[10], e[11]), this.halfSize = new D(this.e1.length(), this.e2.length(), this.e3.length()), this.e1.normalize(), this.e2.normalize(), this.e3.normalize(), this.rotationMatrix = new Da(), this.rotationMatrix.set(this.e1.x, this.e2.x, this.e3.x, this.e1.y, this.e2.y, this.e3.y, this.e1.z, this.e2.z, this.e3.z);
  }
  copy(e) {
    this.center.copy(e.center), this.rotationMatrix.copy(e.rotationMatrix), this.halfSize.copy(e.halfSize), this.e1.copy(e.e1), this.e2.copy(e.e2), this.e3.copy(e.e3);
  }
  getSize(e) {
    return e.copy(this.halfSize).multiplyScalar(2);
  }
  applyMatrix4(e) {
    const a = e.elements;
    let t = H.set(a[0], a[1], a[2]).length();
    const A = H.set(a[4], a[5], a[6]).length(), i = H.set(a[8], a[9], a[10]).length();
    e.determinant() < 0 && (t = -t), _.setFromMatrix4(e);
    const s = 1 / t, r = 1 / A, n = 1 / i;
    return _.elements[0] *= s, _.elements[1] *= s, _.elements[2] *= s, _.elements[3] *= r, _.elements[4] *= r, _.elements[5] *= r, _.elements[6] *= n, _.elements[7] *= n, _.elements[8] *= n, this.rotationMatrix.premultiply(_), this.halfSize.x *= t, this.halfSize.y *= A, this.halfSize.z *= i, this.center.applyMatrix4(e), this.rotationMatrix.extractBasis(this.e1, this.e2, this.e3), this;
  }
  intersectRay(e, a) {
    return this.getSize(_a), Ka.setFromCenterAndSize(H.set(0, 0, 0), _a), qe.setFromMatrix3(this.rotationMatrix), qe.setPosition(this.center), za.copy(qe).invert(), Va.copy(e).applyMatrix4(za), Va.intersectBox(Ka, a) ? a.applyMatrix4(qe) : null;
  }
  intersectsRay(e) {
    return this.intersectRay(e, H) !== null;
  }
  insidePlane(e) {
    e.normal.normalize();
    const a = this.halfSize.x * Math.abs(e.normal.dot(this.e1)) + this.halfSize.y * Math.abs(e.normal.dot(this.e2)) + this.halfSize.z * Math.abs(e.normal.dot(this.e3));
    return e.distanceToPoint(this.center) > -a;
  }
  inFrustum(e) {
    for (let a = 0; a < 6; a++) {
      const t = e.planes[a];
      if (!this.insidePlane(t)) return !1;
    }
    return !0;
  }
  distanceToPoint(e) {
    H.copy(e), H.sub(this.center), H.applyMatrix3(this.rotationMatrix);
    let a = Math.max(0, Math.max(-this.halfSize.x - H.x, H.x - this.halfSize.x)), t = Math.max(0, Math.max(-this.halfSize.y - H.y, H.y - this.halfSize.y)), A = Math.max(0, Math.max(-this.halfSize.z - H.z, H.z - this.halfSize.z));
    return Math.sqrt(a * a + t * t + A * A);
  }
  helper() {
    const e = this.halfSize, a = this.center, t = this.e1, A = this.e2, i = this.e3, s = [new D().copy(a).add(t.clone().multiplyScalar(e.x)).add(A.clone().multiplyScalar(e.y)).add(i.clone().multiplyScalar(e.z)), new D().copy(a).add(t.clone().multiplyScalar(-e.x)).add(A.clone().multiplyScalar(e.y)).add(i.clone().multiplyScalar(e.z)), new D().copy(a).add(t.clone().multiplyScalar(-e.x)).add(A.clone().multiplyScalar(-e.y)).add(i.clone().multiplyScalar(e.z)), new D().copy(a).add(t.clone().multiplyScalar(e.x)).add(A.clone().multiplyScalar(-e.y)).add(i.clone().multiplyScalar(e.z)), new D().copy(a).add(t.clone().multiplyScalar(e.x)).add(A.clone().multiplyScalar(e.y)).add(i.clone().multiplyScalar(-e.z)), new D().copy(a).add(t.clone().multiplyScalar(-e.x)).add(A.clone().multiplyScalar(e.y)).add(i.clone().multiplyScalar(-e.z)), new D().copy(a).add(t.clone().multiplyScalar(-e.x)).add(A.clone().multiplyScalar(-e.y)).add(i.clone().multiplyScalar(-e.z)), new D().copy(a).add(t.clone().multiplyScalar(e.x)).add(A.clone().multiplyScalar(-e.y)).add(i.clone().multiplyScalar(-e.z))], r = new Ze().setFromPoints(s);
    r.setIndex([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]), r.computeBoundingSphere();
    const n = new It({ color: 16711680 }), o = new mt(r, n);
    return o.dispose = () => {
      n.dispose(), r.dispose();
    }, o;
  }
}
/**
 * @copyright 2021 Aaron Zhao <yujianzhao2013@gmail.com>
 * @license MIT
 * Linked hash map data structure
 * @class LinkedHashMap
 */
class kt {
  constructor() {
    this._data = /* @__PURE__ */ new Map(), this._link = /* @__PURE__ */ new Map(), this._head = void 0, this._tail = void 0;
  }
  put(e, a, t = !1) {
    this.has(e) ? this._data.set(e, a) : (this._data.set(e, a), this._link.set(e, { previous: void 0, next: void 0 }), this._head == null ? (this._head = e, this._tail = e) : t ? (this._link.get(this._head).previous = e, this._link.get(e).next = this._head, this._head = e) : (this._link.get(this._tail).next = e, this._link.get(e).previous = this._tail, this._tail = e));
  }
  head() {
    return { key: this._head, value: this.get(this._head), next: () => this.next(this._head), previous: () => null };
  }
  tail() {
    return { key: this._tail, value: this.get(this._tail), next: () => null, previous: () => this.previous(this._tail) };
  }
  get(e) {
    return this._data.get(e);
  }
  previousKey(e) {
    const a = this._link.get(e);
    return a != null ? a.previous : void 0;
  }
  previousValue(e) {
    return this.get(this.previousKey(e));
  }
  previous(e) {
    const a = this.previousKey(e);
    return { key: a, value: this.get(a), next: () => this.next(a), previous: () => this.previous(a) };
  }
  nextKey(e) {
    const a = this._link.get(e);
    return a != null ? a.next : void 0;
  }
  nextValue(e) {
    return this.get(this.nextKey(e));
  }
  next(e) {
    const a = this.nextKey(e);
    return { key: a, value: this.get(a), next: () => this.next(a), previous: () => this.previous(a) };
  }
  remove(e) {
    const a = this._data.get(e);
    if (a != null) if (this.size() === 1) this.reset();
    else {
      if (e === this._head) {
        const t = this._link.get(this._head);
        this._link.get(t.next).previous = null, this._head = t.next;
      } else if (e === this._tail) {
        const t = this._link.get(this._tail);
        this._link.get(t.previous).next = null, this._tail = t.previous;
      } else {
        const t = this._link.get(e), A = this._link.get(t.previous), i = this._link.get(t.next);
        A.next = t.next, i.previous = t.previous;
      }
      this._link.delete(e), this._data.delete(e);
    }
    return a;
  }
  has(e) {
    return this._data.has(e);
  }
  size() {
    return this._data.size;
  }
  reset() {
    this._data.clear(), this._link.clear(), this._head = void 0, this._tail = void 0;
  }
  keys() {
    return this._data.keys();
  }
  values() {
    return this._data.values();
  }
  entries() {
    return this._data.entries();
  }
  toArray(e = "orderByInsert") {
    if (e !== "orderByInsert") {
      const a = [];
      let t = this._head;
      for (; t != null; ) a.push({ key: t, value: this.get(t) }), t = this.nextKey(t);
      return a;
    }
    return Array.from(this.keys()).map((a) => ({ key: a, value: this.get(a) }));
  }
}
const _A = new TextDecoder();
class xt {
  constructor(e, a, t, A) {
    this.buffer = e, this.binOffset = a + t, this.binLength = A;
    let i = null;
    if (t !== 0) try {
      const s = new Uint8Array(e, a, t);
      i = JSON.parse(_A.decode(s));
    } catch {
      i = {};
    }
    else i = {};
    this.header = i;
  }
  getKeys() {
    return Object.keys(this.header);
  }
  getData(e, a, t = null, A = null) {
    const i = this.header;
    if (!(e in i)) return null;
    const s = i[e];
    if (s instanceof Object) {
      if (Array.isArray(s)) return s;
      {
        const { buffer: r, binOffset: n, binLength: o } = this, c = s.byteOffset || 0, b = s.type || A, g = s.componentType || t;
        if ("type" in s && A && s.type !== A) throw new Error("FeatureTable: Specified type does not match expected type.");
        let l, d;
        switch (b) {
          case "SCALAR":
            l = 1;
            break;
          case "VEC2":
            l = 2;
            break;
          case "VEC3":
            l = 3;
            break;
          case "VEC4":
            l = 4;
            break;
          default:
            throw new Error(`FeatureTable : Feature type not provided for "${e}".`);
        }
        const f = n + c, I = a * l;
        switch (g) {
          case "BYTE":
            d = new Int8Array(r, f, I);
            break;
          case "UNSIGNED_BYTE":
            d = new Uint8Array(r, f, I);
            break;
          case "SHORT":
            d = new Int16Array(r, f, I);
            break;
          case "UNSIGNED_SHORT":
            d = new Uint16Array(r, f, I);
            break;
          case "INT":
            d = new Int32Array(r, f, I);
            break;
          case "UNSIGNED_INT":
            d = new Uint32Array(r, f, I);
            break;
          case "FLOAT":
            d = new Float32Array(r, f, I);
            break;
          case "DOUBLE":
            d = new Float64Array(r, f, I);
            break;
          default:
            throw new Error(`FeatureTable : Feature component type not provided for "${e}".`);
        }
        if (f + I * d.BYTES_PER_ELEMENT > n + o) throw new Error("FeatureTable: Feature data read outside binary body length.");
        return d;
      }
    }
    return s;
  }
}
class KA extends xt {
  constructor(e, a, t, A, i) {
    super(e, t, A, i), this.batchSize = a;
  }
  getData(e, a = null, t = null) {
    return super.getData(e, this.batchSize, a, t);
  }
}
function Ya(h) {
  let e, a, t, A = -1, i = 0;
  for (let o = 0; o < h.length; ++o) {
    const c = h[o];
    if (e === void 0 && (e = c.array.constructor), e !== c.array.constructor) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."), null;
    if (a === void 0 && (a = c.itemSize), a !== c.itemSize) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."), null;
    if (t === void 0 && (t = c.normalized), t !== c.normalized) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."), null;
    if (A === -1 && (A = c.gpuType), A !== c.gpuType) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."), null;
    i += c.count * a;
  }
  const s = new e(i), r = new de(s, a, t);
  let n = 0;
  for (let o = 0; o < h.length; ++o) {
    const c = h[o];
    if (c.isInterleavedBufferAttribute) {
      const b = n / a;
      for (let g = 0, l = c.count; g < l; g++) for (let d = 0; d < a; d++) {
        const f = c.getComponent(g, d);
        r.setComponent(g + b, d, f);
      }
    } else s.set(c.array, n);
    n += c.count * a;
  }
  return A !== void 0 && (r.gpuType = A), r;
}
function Wa(h, e) {
  if (e === aA) return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."), h;
  if (e === Ea || e === Bt) {
    let a = h.getIndex();
    if (a === null) {
      const s = [], r = h.getAttribute("position");
      if (r === void 0) return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."), h;
      for (let n = 0; n < r.count; n++) s.push(n);
      h.setIndex(s), a = h.getIndex();
    }
    const t = a.count - 2, A = [];
    if (e === Ea) for (let s = 1; s <= t; s++) A.push(a.getX(0)), A.push(a.getX(s)), A.push(a.getX(s + 1));
    else for (let s = 0; s < t; s++) s % 2 == 0 ? (A.push(a.getX(s)), A.push(a.getX(s + 1)), A.push(a.getX(s + 2))) : (A.push(a.getX(s + 2)), A.push(a.getX(s + 1)), A.push(a.getX(s)));
    A.length / 3 !== t && console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
    const i = h.clone();
    return i.setIndex(A), i.clearGroups(), i;
  }
  return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:", e), h;
}
class jt {
  constructor(e) {
    le(this, "checkLoaderInitialized", async () => new Promise((e) => {
      const a = setInterval(() => {
        this.gltfLoader.hasDracoLoader && !this.gltfLoader.dracoLoader || this.gltfLoader.hasKTX2Loader && !this.gltfLoader.ktx2Loader || (clearInterval(a), e());
      }, 10);
    }));
    this.gltfLoader = e, this.tempMatrix = new E.Matrix4(), this.zUpToYUpMatrix = new E.Matrix4(), this.zUpToYUpMatrix.set(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1);
  }
  parseB3DM(e, a, t, A) {
    const i = this, s = new DataView(e), r = String.fromCharCode(s.getUint8(0)) + String.fromCharCode(s.getUint8(1)) + String.fromCharCode(s.getUint8(2)) + String.fromCharCode(s.getUint8(3));
    console.assert(r === "b3dm");
    const n = s.getUint32(8, !0);
    console.assert(n === e.byteLength);
    const o = s.getUint32(12, !0), c = s.getUint32(16, !0), b = s.getUint32(20, !0), g = s.getUint32(24, !0), l = new xt(e, 28, o, c), d = 28 + o + c;
    new KA(e, l.getData("BATCH_LENGTH"), d, b, g);
    const f = d + b + g, I = new Uint8Array(e, f, n - f).slice().buffer;
    return new Promise(async (m, u) => {
      await this.checkLoaderInitialized(), this.gltfLoader.parse(I, null, (C) => {
        const B = l.getData("RTC_CENTER");
        B ? (this.tempMatrix.makeTranslation(B[0], B[1], B[2]), C.scene.applyMatrix4(this.tempMatrix)) : C.userData.gltfExtensions && C.userData.gltfExtensions.CESIUM_RTC && (this.tempMatrix.makeTranslation(C.userData.gltfExtensions.CESIUM_RTC.center[0], C.userData.gltfExtensions.CESIUM_RTC.center[1], C.userData.gltfExtensions.CESIUM_RTC.center[2]), C.scene.applyMatrix4(this.tempMatrix)), t && C.scene.applyMatrix4(i.zUpToYUpMatrix), C.scene.asset = C.asset, C.scene.traverse((w) => {
          w.isMesh && (A && w.applyMatrix4(i.zUpToYUpMatrix), a && a(w));
        }), m(C.scene);
      }, (C) => {
        console.error(C);
      });
    });
  }
  parseB3DMInstanced(e, a, t, A, i) {
    return this.parseB3DM(e, a, A, i).then((s) => {
      let r, n = [], o = [];
      s.updateWorldMatrix(!1, !0), s.traverse((b) => {
        b.isMesh && (b.geometry.applyMatrix4(b.matrixWorld), n.push(b.geometry), o.push(b.material));
      });
      let c = function(b) {
        let g = /* @__PURE__ */ new Set();
        return b.forEach((d) => {
          for (let f in d.attributes) g.add(f);
        }), b.forEach((d) => {
          g.forEach((f) => {
            if (!d.attributes[f]) {
              const I = function(u) {
                switch (u) {
                  case "position":
                  case "normal":
                  case "color":
                    return 3;
                  case "uv":
                  case "uv2":
                    return 2;
                  default:
                    throw new Error(`Unknown attribute ${u}`);
                }
              }(f), m = new Float32Array(I * d.getAttribute("position").count).fill(0);
              d.setAttribute(f, new E.BufferAttribute(m, I));
            }
          });
        }), function(d, f = !1) {
          const I = d[0].index !== null, m = new Set(Object.keys(d[0].attributes)), u = new Set(Object.keys(d[0].morphAttributes)), C = {}, B = {}, w = d[0].morphTargetsRelative, k = new Ze();
          let y = 0;
          for (let p = 0; p < d.length; ++p) {
            const Q = d[p];
            let x = 0;
            if (I !== (Q.index !== null)) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + p + ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."), null;
            for (const j in Q.attributes) {
              if (!m.has(j)) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + p + '. All geometries must have compatible attributes; make sure "' + j + '" attribute exists among all geometries, or in none of them.'), null;
              C[j] === void 0 && (C[j] = []), C[j].push(Q.attributes[j]), x++;
            }
            if (x !== m.size) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + p + ". Make sure all geometries have the same number of attributes."), null;
            if (w !== Q.morphTargetsRelative) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + p + ". .morphTargetsRelative must be consistent throughout all geometries."), null;
            for (const j in Q.morphAttributes) {
              if (!u.has(j)) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + p + ".  .morphAttributes must be consistent throughout all geometries."), null;
              B[j] === void 0 && (B[j] = []), B[j].push(Q.morphAttributes[j]);
            }
            if (f) {
              let j;
              if (I) j = Q.index.count;
              else {
                if (Q.attributes.position === void 0) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + p + ". The geometry must have either an index or a position attribute"), null;
                j = Q.attributes.position.count;
              }
              k.addGroup(y, j, p), y += j;
            }
          }
          if (I) {
            let p = 0;
            const Q = [];
            for (let x = 0; x < d.length; ++x) {
              const j = d[x].index;
              for (let M = 0; M < j.count; ++M) Q.push(j.getX(M) + p);
              p += d[x].attributes.position.count;
            }
            k.setIndex(Q);
          }
          for (const p in C) {
            const Q = Ya(C[p]);
            if (!Q) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + p + " attribute."), null;
            k.setAttribute(p, Q);
          }
          for (const p in B) {
            const Q = B[p][0].length;
            if (Q === 0) break;
            k.morphAttributes = k.morphAttributes || {}, k.morphAttributes[p] = [];
            for (let x = 0; x < Q; ++x) {
              const j = [];
              for (let O = 0; O < B[p].length; ++O) j.push(B[p][O][x]);
              const M = Ya(j);
              if (!M) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + p + " morphAttribute."), null;
              k.morphAttributes[p].push(M);
            }
          }
          return k;
        }(b, !0);
      }(n);
      return r = new E.InstancedMesh(c, o, t), r.baseMatrix = new E.Matrix4().identity(), r;
    });
  }
}
const T = [];
for (let h = 0; h < 256; ++h) T.push((h + 256).toString(16).slice(1));
let Aa;
const zA = new Uint8Array(16), Xa = { randomUUID: typeof crypto < "u" && crypto.randomUUID && crypto.randomUUID.bind(crypto) };
function St(h, e, a) {
  var A;
  if (Xa.randomUUID && !h) return Xa.randomUUID();
  const t = (h = h || {}).random ?? ((A = h.rng) == null ? void 0 : A.call(h)) ?? function() {
    if (!Aa) {
      if (typeof crypto > "u" || !crypto.getRandomValues) throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      Aa = crypto.getRandomValues.bind(crypto);
    }
    return Aa(zA);
  }();
  if (t.length < 16) throw new Error("Random bytes length must be >= 16");
  return t[6] = 15 & t[6] | 64, t[8] = 63 & t[8] | 128, function(i, s = 0) {
    return (T[i[s + 0]] + T[i[s + 1]] + T[i[s + 2]] + T[i[s + 3]] + "-" + T[i[s + 4]] + T[i[s + 5]] + "-" + T[i[s + 6]] + T[i[s + 7]] + "-" + T[i[s + 8]] + T[i[s + 9]] + "-" + T[i[s + 10]] + T[i[s + 11]] + T[i[s + 12]] + T[i[s + 13]] + T[i[s + 14]] + T[i[s + 15]]).toLowerCase();
  }(t);
}
class VA {
  constructor(e, a) {
    le(this, "checkLoaderInitialized", async () => {
      const e = this;
      return new Promise((a) => {
        const t = setInterval(() => {
          e.gltfLoader.hasDracoLoader && !e.gltfLoader.dracoLoader || e.gltfLoader.hasKTX2Loader && !e.gltfLoader.ktx2Loader || (clearInterval(t), a());
        }, 10);
      });
    });
    this.renderer = a, this.gltfLoader = e;
  }
  parseSplats(e, a, t, A) {
    const i = this;
    return new Promise(async (s, r) => {
      await i.checkLoaderInitialized(), i.gltfLoader.parse(e, null, (n) => {
        n.scene;
        const o = n.scene.children[0], c = o.geometry.attributes.position, b = o.geometry.attributes.color, g = o.geometry.attributes.cov_0, l = o.geometry.attributes.cov_1, d = A.addSplatsTile(c, b, g, l);
        n.scene.traverse((f) => {
          f.dispose && f.dispose();
        }), s(d);
      }, (n) => {
        console.error(n);
      });
    });
  }
}
class Dt extends Fa {
  constructor(e) {
    super(e), this.dracoLoader = null, this.ktx2Loader = null, this.meshoptDecoder = null, this.pluginCallbacks = [], this.register(function(a) {
      return new $A(a);
    }), this.register(function(a) {
      return new ei(a);
    }), this.register(function(a) {
      return new ci(a);
    }), this.register(function(a) {
      return new bi(a);
    }), this.register(function(a) {
      return new di(a);
    }), this.register(function(a) {
      return new ti(a);
    }), this.register(function(a) {
      return new Ai(a);
    }), this.register(function(a) {
      return new ii(a);
    }), this.register(function(a) {
      return new si(a);
    }), this.register(function(a) {
      return new ZA(a);
    }), this.register(function(a) {
      return new ri(a);
    }), this.register(function(a) {
      return new ai(a);
    }), this.register(function(a) {
      return new oi(a);
    }), this.register(function(a) {
      return new ni(a);
    }), this.register(function(a) {
      return new WA(a);
    }), this.register(function(a) {
      return new hi(a);
    }), this.register(function(a) {
      return new li(a);
    });
  }
  load(e, a, t, A) {
    const i = this;
    let s;
    if (this.resourcePath !== "") s = this.resourcePath;
    else if (this.path !== "") {
      const o = He.extractUrlBase(e);
      s = He.resolveURL(o, this.path);
    } else s = He.extractUrlBase(e);
    this.manager.itemStart(e);
    const r = function(o) {
      A ? A(o) : console.error(o), i.manager.itemError(e), i.manager.itemEnd(e);
    }, n = new Be(this.manager);
    n.setPath(this.path), n.setResponseType("arraybuffer"), n.setRequestHeader(this.requestHeader), n.setWithCredentials(this.withCredentials), n.load(e, function(o) {
      try {
        i.parse(o, s, function(c) {
          a(c), i.manager.itemEnd(e);
        }, r);
      } catch (c) {
        r(c);
      }
    }, t, r);
  }
  setDRACOLoader(e) {
    return this.dracoLoader = e, this;
  }
  setKTX2Loader(e) {
    return this.ktx2Loader = e, this;
  }
  setMeshoptDecoder(e) {
    return this.meshoptDecoder = e, this;
  }
  register(e) {
    return this.pluginCallbacks.indexOf(e) === -1 && this.pluginCallbacks.push(e), this;
  }
  unregister(e) {
    return this.pluginCallbacks.indexOf(e) !== -1 && this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e), 1), this;
  }
  parse(e, a, t, A) {
    let i;
    const s = {}, r = {}, n = new TextDecoder();
    if (typeof e == "string") i = JSON.parse(e);
    else if (e instanceof ArrayBuffer)
      if (n.decode(new Uint8Array(e, 0, 4)) === vt) {
        try {
          s[S.KHR_BINARY_GLTF] = new ui(e);
        } catch (c) {
          return void (A && A(c));
        }
        i = JSON.parse(s[S.KHR_BINARY_GLTF].content);
      } else i = JSON.parse(n.decode(e));
    else i = e;
    if (i.asset === void 0 || i.asset.version[0] < 2) return void (A && A(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.")));
    const o = new Si(i, { path: a || this.resourcePath || "", crossOrigin: this.crossOrigin, requestHeader: this.requestHeader, manager: this.manager, ktx2Loader: this.ktx2Loader, meshoptDecoder: this.meshoptDecoder });
    o.fileLoader.setRequestHeader(this.requestHeader);
    for (let c = 0; c < this.pluginCallbacks.length; c++) {
      const b = this.pluginCallbacks[c](o);
      b.name || console.error("THREE.GLTFLoader: Invalid plugin found: missing name"), r[b.name] = b, s[b.name] = !0;
    }
    if (i.extensionsUsed) for (let c = 0; c < i.extensionsUsed.length; ++c) {
      const b = i.extensionsUsed[c], g = i.extensionsRequired || [];
      switch (b) {
        case S.KHR_MATERIALS_UNLIT:
          s[b] = new XA();
          break;
        case S.KHR_DRACO_MESH_COMPRESSION:
          s[b] = new Ii(i, this.dracoLoader);
          break;
        case S.KHR_TEXTURE_TRANSFORM:
          s[b] = new mi();
          break;
        case S.KHR_MESH_QUANTIZATION:
          s[b] = new Bi();
          break;
        default:
          g.indexOf(b) >= 0 && r[b] === void 0 && console.warn('THREE.GLTFLoader: Unknown extension "' + b + '".');
      }
    }
    o.setExtensions(s), o.setPlugins(r), o.parse(t, A);
  }
  parseAsync(e, a) {
    const t = this;
    return new Promise(function(A, i) {
      t.parse(e, a, A, i);
    });
  }
}
function YA() {
  let h = {};
  return { get: function(e) {
    return h[e];
  }, add: function(e, a) {
    h[e] = a;
  }, remove: function(e) {
    delete h[e];
  }, removeAll: function() {
    h = {};
  } };
}
const S = { KHR_BINARY_GLTF: "KHR_binary_glTF", KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression", KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual", KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat", KHR_MATERIALS_DISPERSION: "KHR_materials_dispersion", KHR_MATERIALS_IOR: "KHR_materials_ior", KHR_MATERIALS_SHEEN: "KHR_materials_sheen", KHR_MATERIALS_SPECULAR: "KHR_materials_specular", KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission", KHR_MATERIALS_IRIDESCENCE: "KHR_materials_iridescence", KHR_MATERIALS_ANISOTROPY: "KHR_materials_anisotropy", KHR_MATERIALS_UNLIT: "KHR_materials_unlit", KHR_MATERIALS_VOLUME: "KHR_materials_volume", KHR_TEXTURE_BASISU: "KHR_texture_basisu", KHR_TEXTURE_TRANSFORM: "KHR_texture_transform", KHR_MESH_QUANTIZATION: "KHR_mesh_quantization", KHR_MATERIALS_EMISSIVE_STRENGTH: "KHR_materials_emissive_strength", EXT_MATERIALS_BUMP: "EXT_materials_bump", EXT_TEXTURE_WEBP: "EXT_texture_webp", EXT_TEXTURE_AVIF: "EXT_texture_avif", EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression", EXT_MESH_GPU_INSTANCING: "EXT_mesh_gpu_instancing" };
class WA {
  constructor(e) {
    this.parser = e, this.name = S.KHR_LIGHTS_PUNCTUAL, this.cache = { refs: {}, uses: {} };
  }
  _markDefs() {
    const e = this.parser, a = this.parser.json.nodes || [];
    for (let t = 0, A = a.length; t < A; t++) {
      const i = a[t];
      i.extensions && i.extensions[this.name] && i.extensions[this.name].light !== void 0 && e._addNodeRef(this.cache, i.extensions[this.name].light);
    }
  }
  _loadLight(e) {
    const a = this.parser, t = "light:" + e;
    let A = a.cache.get(t);
    if (A) return A;
    const i = a.json, s = ((i.extensions && i.extensions[this.name] || {}).lights || [])[e];
    let r;
    const n = new he(16777215);
    s.color !== void 0 && n.setRGB(s.color[0], s.color[1], s.color[2], K);
    const o = s.range !== void 0 ? s.range : 0;
    switch (s.type) {
      case "directional":
        r = new iA(n), r.target.position.set(0, 0, -1), r.add(r.target);
        break;
      case "point":
        r = new AA(n), r.distance = o;
        break;
      case "spot":
        r = new tA(n), r.distance = o, s.spot = s.spot || {}, s.spot.innerConeAngle = s.spot.innerConeAngle !== void 0 ? s.spot.innerConeAngle : 0, s.spot.outerConeAngle = s.spot.outerConeAngle !== void 0 ? s.spot.outerConeAngle : Math.PI / 4, r.angle = s.spot.outerConeAngle, r.penumbra = 1 - s.spot.innerConeAngle / s.spot.outerConeAngle, r.target.position.set(0, 0, -1), r.add(r.target);
        break;
      default:
        throw new Error("THREE.GLTFLoader: Unexpected light type: " + s.type);
    }
    return r.position.set(0, 0, 0), ie(r, s), s.intensity !== void 0 && (r.intensity = s.intensity), r.name = a.createUniqueName(s.name || "light_" + e), A = Promise.resolve(r), a.cache.add(t, A), A;
  }
  getDependency(e, a) {
    if (e === "light") return this._loadLight(a);
  }
  createNodeAttachment(e) {
    const a = this, t = this.parser, A = t.json.nodes[e], i = (A.extensions && A.extensions[this.name] || {}).light;
    return i === void 0 ? null : this._loadLight(i).then(function(s) {
      return t._getNodeRef(a.cache, i, s);
    });
  }
}
class XA {
  constructor() {
    this.name = S.KHR_MATERIALS_UNLIT;
  }
  getMaterialType() {
    return Me;
  }
  extendParams(e, a, t) {
    const A = [];
    e.color = new he(1, 1, 1), e.opacity = 1;
    const i = a.pbrMetallicRoughness;
    if (i) {
      if (Array.isArray(i.baseColorFactor)) {
        const s = i.baseColorFactor;
        e.color.setRGB(s[0], s[1], s[2], K), e.opacity = s[3];
      }
      i.baseColorTexture !== void 0 && A.push(t.assignTexture(e, "map", i.baseColorTexture, se));
    }
    return Promise.all(A);
  }
}
class ZA {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_EMISSIVE_STRENGTH;
  }
  extendMaterialParams(e, a) {
    const t = this.parser.json.materials[e];
    if (!t.extensions || !t.extensions[this.name]) return Promise.resolve();
    const A = t.extensions[this.name].emissiveStrength;
    return A !== void 0 && (a.emissiveIntensity = A), Promise.resolve();
  }
}
class $A {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_CLEARCOAT;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser, A = t.json.materials[e];
    if (!A.extensions || !A.extensions[this.name]) return Promise.resolve();
    const i = [], s = A.extensions[this.name];
    if (s.clearcoatFactor !== void 0 && (a.clearcoat = s.clearcoatFactor), s.clearcoatTexture !== void 0 && i.push(t.assignTexture(a, "clearcoatMap", s.clearcoatTexture)), s.clearcoatRoughnessFactor !== void 0 && (a.clearcoatRoughness = s.clearcoatRoughnessFactor), s.clearcoatRoughnessTexture !== void 0 && i.push(t.assignTexture(a, "clearcoatRoughnessMap", s.clearcoatRoughnessTexture)), s.clearcoatNormalTexture !== void 0 && (i.push(t.assignTexture(a, "clearcoatNormalMap", s.clearcoatNormalTexture)), s.clearcoatNormalTexture.scale !== void 0)) {
      const r = s.clearcoatNormalTexture.scale;
      a.clearcoatNormalScale = new Ct(r, r);
    }
    return Promise.all(i);
  }
}
class ei {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_DISPERSION;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser.json.materials[e];
    if (!t.extensions || !t.extensions[this.name]) return Promise.resolve();
    const A = t.extensions[this.name];
    return a.dispersion = A.dispersion !== void 0 ? A.dispersion : 0, Promise.resolve();
  }
}
class ai {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_IRIDESCENCE;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser, A = t.json.materials[e];
    if (!A.extensions || !A.extensions[this.name]) return Promise.resolve();
    const i = [], s = A.extensions[this.name];
    return s.iridescenceFactor !== void 0 && (a.iridescence = s.iridescenceFactor), s.iridescenceTexture !== void 0 && i.push(t.assignTexture(a, "iridescenceMap", s.iridescenceTexture)), s.iridescenceIor !== void 0 && (a.iridescenceIOR = s.iridescenceIor), a.iridescenceThicknessRange === void 0 && (a.iridescenceThicknessRange = [100, 400]), s.iridescenceThicknessMinimum !== void 0 && (a.iridescenceThicknessRange[0] = s.iridescenceThicknessMinimum), s.iridescenceThicknessMaximum !== void 0 && (a.iridescenceThicknessRange[1] = s.iridescenceThicknessMaximum), s.iridescenceThicknessTexture !== void 0 && i.push(t.assignTexture(a, "iridescenceThicknessMap", s.iridescenceThicknessTexture)), Promise.all(i);
  }
}
class ti {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_SHEEN;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser, A = t.json.materials[e];
    if (!A.extensions || !A.extensions[this.name]) return Promise.resolve();
    const i = [];
    a.sheenColor = new he(0, 0, 0), a.sheenRoughness = 0, a.sheen = 1;
    const s = A.extensions[this.name];
    if (s.sheenColorFactor !== void 0) {
      const r = s.sheenColorFactor;
      a.sheenColor.setRGB(r[0], r[1], r[2], K);
    }
    return s.sheenRoughnessFactor !== void 0 && (a.sheenRoughness = s.sheenRoughnessFactor), s.sheenColorTexture !== void 0 && i.push(t.assignTexture(a, "sheenColorMap", s.sheenColorTexture, se)), s.sheenRoughnessTexture !== void 0 && i.push(t.assignTexture(a, "sheenRoughnessMap", s.sheenRoughnessTexture)), Promise.all(i);
  }
}
class Ai {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_TRANSMISSION;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser, A = t.json.materials[e];
    if (!A.extensions || !A.extensions[this.name]) return Promise.resolve();
    const i = [], s = A.extensions[this.name];
    return s.transmissionFactor !== void 0 && (a.transmission = s.transmissionFactor), s.transmissionTexture !== void 0 && i.push(t.assignTexture(a, "transmissionMap", s.transmissionTexture)), Promise.all(i);
  }
}
class ii {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_VOLUME;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser, A = t.json.materials[e];
    if (!A.extensions || !A.extensions[this.name]) return Promise.resolve();
    const i = [], s = A.extensions[this.name];
    a.thickness = s.thicknessFactor !== void 0 ? s.thicknessFactor : 0, s.thicknessTexture !== void 0 && i.push(t.assignTexture(a, "thicknessMap", s.thicknessTexture)), a.attenuationDistance = s.attenuationDistance || 1 / 0;
    const r = s.attenuationColor || [1, 1, 1];
    return a.attenuationColor = new he().setRGB(r[0], r[1], r[2], K), Promise.all(i);
  }
}
class si {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_IOR;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser.json.materials[e];
    if (!t.extensions || !t.extensions[this.name]) return Promise.resolve();
    const A = t.extensions[this.name];
    return a.ior = A.ior !== void 0 ? A.ior : 1.5, Promise.resolve();
  }
}
class ri {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_SPECULAR;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser, A = t.json.materials[e];
    if (!A.extensions || !A.extensions[this.name]) return Promise.resolve();
    const i = [], s = A.extensions[this.name];
    a.specularIntensity = s.specularFactor !== void 0 ? s.specularFactor : 1, s.specularTexture !== void 0 && i.push(t.assignTexture(a, "specularIntensityMap", s.specularTexture));
    const r = s.specularColorFactor || [1, 1, 1];
    return a.specularColor = new he().setRGB(r[0], r[1], r[2], K), s.specularColorTexture !== void 0 && i.push(t.assignTexture(a, "specularColorMap", s.specularColorTexture, se)), Promise.all(i);
  }
}
class ni {
  constructor(e) {
    this.parser = e, this.name = S.EXT_MATERIALS_BUMP;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser, A = t.json.materials[e];
    if (!A.extensions || !A.extensions[this.name]) return Promise.resolve();
    const i = [], s = A.extensions[this.name];
    return a.bumpScale = s.bumpFactor !== void 0 ? s.bumpFactor : 1, s.bumpTexture !== void 0 && i.push(t.assignTexture(a, "bumpMap", s.bumpTexture)), Promise.all(i);
  }
}
class oi {
  constructor(e) {
    this.parser = e, this.name = S.KHR_MATERIALS_ANISOTROPY;
  }
  getMaterialType(e) {
    const a = this.parser.json.materials[e];
    return a.extensions && a.extensions[this.name] ? ee : null;
  }
  extendMaterialParams(e, a) {
    const t = this.parser, A = t.json.materials[e];
    if (!A.extensions || !A.extensions[this.name]) return Promise.resolve();
    const i = [], s = A.extensions[this.name];
    return s.anisotropyStrength !== void 0 && (a.anisotropy = s.anisotropyStrength), s.anisotropyRotation !== void 0 && (a.anisotropyRotation = s.anisotropyRotation), s.anisotropyTexture !== void 0 && i.push(t.assignTexture(a, "anisotropyMap", s.anisotropyTexture)), Promise.all(i);
  }
}
class ci {
  constructor(e) {
    this.parser = e, this.name = S.KHR_TEXTURE_BASISU;
  }
  loadTexture(e) {
    const a = this.parser, t = a.json, A = t.textures[e];
    if (!A.extensions || !A.extensions[this.name]) return null;
    const i = A.extensions[this.name], s = a.options.ktx2Loader;
    if (!s) {
      if (t.extensionsRequired && t.extensionsRequired.indexOf(this.name) >= 0) throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
      return null;
    }
    return a.loadTextureImage(e, i.source, s);
  }
}
class bi {
  constructor(e) {
    this.parser = e, this.name = S.EXT_TEXTURE_WEBP, this.isSupported = null;
  }
  loadTexture(e) {
    const a = this.name, t = this.parser, A = t.json, i = A.textures[e];
    if (!i.extensions || !i.extensions[a]) return null;
    const s = i.extensions[a], r = A.images[s.source];
    let n = t.textureLoader;
    if (r.uri) {
      const o = t.options.manager.getHandler(r.uri);
      o !== null && (n = o);
    }
    return this.detectSupport().then(function(o) {
      if (o) return t.loadTextureImage(e, s.source, n);
      if (A.extensionsRequired && A.extensionsRequired.indexOf(a) >= 0) throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");
      return t.loadTexture(e);
    });
  }
  detectSupport() {
    return this.isSupported || (this.isSupported = new Promise(function(e) {
      const a = new Image();
      a.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA", a.onload = a.onerror = function() {
        e(a.height === 1);
      };
    })), this.isSupported;
  }
}
class di {
  constructor(e) {
    this.parser = e, this.name = S.EXT_TEXTURE_AVIF, this.isSupported = null;
  }
  loadTexture(e) {
    const a = this.name, t = this.parser, A = t.json, i = A.textures[e];
    if (!i.extensions || !i.extensions[a]) return null;
    const s = i.extensions[a], r = A.images[s.source];
    let n = t.textureLoader;
    if (r.uri) {
      const o = t.options.manager.getHandler(r.uri);
      o !== null && (n = o);
    }
    return this.detectSupport().then(function(o) {
      if (o) return t.loadTextureImage(e, s.source, n);
      if (A.extensionsRequired && A.extensionsRequired.indexOf(a) >= 0) throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");
      return t.loadTexture(e);
    });
  }
  detectSupport() {
    return this.isSupported || (this.isSupported = new Promise(function(e) {
      const a = new Image();
      a.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=", a.onload = a.onerror = function() {
        e(a.height === 1);
      };
    })), this.isSupported;
  }
}
class hi {
  constructor(e) {
    this.name = S.EXT_MESHOPT_COMPRESSION, this.parser = e;
  }
  loadBufferView(e) {
    const a = this.parser.json, t = a.bufferViews[e];
    if (t.extensions && t.extensions[this.name]) {
      const A = t.extensions[this.name], i = this.parser.getDependency("buffer", A.buffer), s = this.parser.options.meshoptDecoder;
      if (!s || !s.supported) {
        if (a.extensionsRequired && a.extensionsRequired.indexOf(this.name) >= 0) throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");
        return null;
      }
      return i.then(function(r) {
        const n = A.byteOffset || 0, o = A.byteLength || 0, c = A.count, b = A.byteStride, g = new Uint8Array(r, n, o);
        return s.decodeGltfBufferAsync ? s.decodeGltfBufferAsync(c, b, g, A.mode, A.filter).then(function(l) {
          return l.buffer;
        }) : s.ready.then(function() {
          const l = new ArrayBuffer(c * b);
          return s.decodeGltfBuffer(new Uint8Array(l), c, b, g, A.mode, A.filter), l;
        });
      });
    }
    return null;
  }
}
class li {
  constructor(e) {
    this.name = S.EXT_MESH_GPU_INSTANCING, this.parser = e;
  }
  createNodeMesh(e) {
    const a = this.parser.json, t = a.nodes[e];
    if (!t.extensions || !t.extensions[this.name] || t.mesh === void 0) return null;
    const A = a.meshes[t.mesh];
    for (const n of A.primitives) if (n.mode !== J.TRIANGLES && n.mode !== J.TRIANGLE_STRIP && n.mode !== J.TRIANGLE_FAN && n.mode !== void 0) return null;
    const i = t.extensions[this.name].attributes, s = [], r = {};
    for (const n in i) s.push(this.parser.getDependency("accessor", i[n]).then((o) => (r[n] = o, r[n])));
    return s.length < 1 ? null : (s.push(this.parser.createNodeMesh(e)), Promise.all(s).then((n) => {
      const o = n.pop(), c = o.isGroup ? o.children : [o], b = n[0].count, g = [];
      for (const l of c) {
        const d = new xe(), f = new D(), I = new pt(), m = new D(1, 1, 1), u = new sA(l.geometry, l.material, b);
        for (let C = 0; C < b; C++) r.TRANSLATION && f.fromBufferAttribute(r.TRANSLATION, C), r.ROTATION && I.fromBufferAttribute(r.ROTATION, C), r.SCALE && m.fromBufferAttribute(r.SCALE, C), u.setMatrixAt(C, d.compose(f, I, m));
        for (const C in r) if (C === "_COLOR_0") {
          const B = r[C];
          u.instanceColor = new Qa(B.array, B.itemSize, B.normalized);
        } else C !== "TRANSLATION" && C !== "ROTATION" && C !== "SCALE" && l.geometry.setAttribute(C, r[C]);
        Et.prototype.copy.call(u, l), this.parser.assignFinalMaterial(u), g.push(u);
      }
      return o.isGroup ? (o.clear(), o.add(...g), o) : g[0];
    }));
  }
}
const vt = "glTF", gi = 1313821514, fi = 5130562;
class ui {
  constructor(e) {
    this.name = S.KHR_BINARY_GLTF, this.content = null, this.body = null;
    const a = new DataView(e, 0, 12), t = new TextDecoder();
    if (this.header = { magic: t.decode(new Uint8Array(e.slice(0, 4))), version: a.getUint32(4, !0), length: a.getUint32(8, !0) }, this.header.magic !== vt) throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    if (this.header.version < 2) throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    const A = this.header.length - 12, i = new DataView(e, 12);
    let s = 0;
    for (; s < A; ) {
      const r = i.getUint32(s, !0);
      s += 4;
      const n = i.getUint32(s, !0);
      if (s += 4, n === gi) {
        const o = new Uint8Array(e, 12 + s, r);
        this.content = t.decode(o);
      } else if (n === fi) {
        const o = 12 + s;
        this.body = e.slice(o, o + r);
      }
      s += r;
    }
    if (this.content === null) throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
}
class Ii {
  constructor(e, a) {
    if (!a) throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    this.name = S.KHR_DRACO_MESH_COMPRESSION, this.json = e, this.dracoLoader = a, this.dracoLoader.preload();
  }
  decodePrimitive(e, a) {
    const t = this.json, A = this.dracoLoader, i = e.extensions[this.name].bufferView, s = e.extensions[this.name].attributes, r = {}, n = {}, o = {};
    for (const c in s) {
      const b = xa[c] || c.toLowerCase();
      r[b] = s[c];
    }
    for (const c in e.attributes) {
      const b = xa[c] || c.toLowerCase();
      if (s[c] !== void 0) {
        const g = t.accessors[e.attributes[c]], l = ke[g.componentType];
        o[b] = l.name, n[b] = g.normalized === !0;
      }
    }
    return a.getDependency("bufferView", i).then(function(c) {
      return new Promise(function(b, g) {
        A.decodeDracoFile(c, function(l) {
          for (const d in l.attributes) {
            const f = l.attributes[d], I = n[d];
            I !== void 0 && (f.normalized = I);
          }
          b(l);
        }, r, o, K, g);
      });
    });
  }
}
class mi {
  constructor() {
    this.name = S.KHR_TEXTURE_TRANSFORM;
  }
  extendTexture(e, a) {
    return (a.texCoord !== void 0 && a.texCoord !== e.channel || a.offset !== void 0 || a.rotation !== void 0 || a.scale !== void 0) && (e = e.clone(), a.texCoord !== void 0 && (e.channel = a.texCoord), a.offset !== void 0 && e.offset.fromArray(a.offset), a.rotation !== void 0 && (e.rotation = a.rotation), a.scale !== void 0 && e.repeat.fromArray(a.scale), e.needsUpdate = !0), e;
  }
}
class Bi {
  constructor() {
    this.name = S.KHR_MESH_QUANTIZATION;
  }
}
class Ft extends jA {
  constructor(e, a, t, A) {
    super(e, a, t, A);
  }
  copySampleValue_(e) {
    const a = this.resultBuffer, t = this.sampleValues, A = this.valueSize, i = e * A * 3 + A;
    for (let s = 0; s !== A; s++) a[s] = t[i + s];
    return a;
  }
  interpolate_(e, a, t, A) {
    const i = this.resultBuffer, s = this.sampleValues, r = this.valueSize, n = 2 * r, o = 3 * r, c = A - a, b = (t - a) / c, g = b * b, l = g * b, d = e * o, f = d - o, I = -2 * l + 3 * g, m = l - g, u = 1 - I, C = m - g + b;
    for (let B = 0; B !== r; B++) {
      const w = s[f + B + r], k = s[f + B + n] * c, y = s[d + B + r], p = s[d + B] * c;
      i[B] = u * w + C * k + I * y + m * p;
    }
    return i;
  }
}
const Ci = new pt();
class pi extends Ft {
  interpolate_(e, a, t, A) {
    const i = super.interpolate_(e, a, t, A);
    return Ci.fromArray(i).normalize().toArray(i), i;
  }
}
const J = { POINTS: 0, LINES: 1, LINE_LOOP: 2, LINE_STRIP: 3, TRIANGLES: 4, TRIANGLE_STRIP: 5, TRIANGLE_FAN: 6 }, ke = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }, Za = { 9728: v, 9729: me, 9984: hA, 9985: dA, 9986: bA, 9987: Xe }, $a = { 33071: gA, 33648: lA, 10497: ya }, ia = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }, xa = { POSITION: "position", NORMAL: "normal", TANGENT: "tangent", TEXCOORD_0: "uv", TEXCOORD_1: "uv1", TEXCOORD_2: "uv2", TEXCOORD_3: "uv3", COLOR_0: "color", WEIGHTS_0: "skinWeight", JOINTS_0: "skinIndex" }, ne = { scale: "scale", translation: "position", rotation: "quaternion", weights: "morphTargetInfluences" }, Ei = { CUBICSPLINE: void 0, LINEAR: yt, STEP: xA }, Qi = "OPAQUE", yi = "MASK", wi = "BLEND";
function ge(h, e, a) {
  for (const t in a.extensions) h[t] === void 0 && (e.userData.gltfExtensions = e.userData.gltfExtensions || {}, e.userData.gltfExtensions[t] = a.extensions[t]);
}
function ie(h, e) {
  e.extras !== void 0 && (typeof e.extras == "object" ? Object.assign(h.userData, e.extras) : console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, " + e.extras));
}
function ki(h, e) {
  if (h.updateMorphTargets(), e.weights !== void 0) for (let a = 0, t = e.weights.length; a < t; a++) h.morphTargetInfluences[a] = e.weights[a];
  if (e.extras && Array.isArray(e.extras.targetNames)) {
    const a = e.extras.targetNames;
    if (h.morphTargetInfluences.length === a.length) {
      h.morphTargetDictionary = {};
      for (let t = 0, A = a.length; t < A; t++) h.morphTargetDictionary[a[t]] = t;
    } else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.");
  }
}
function xi(h) {
  let e;
  const a = h.extensions && h.extensions[S.KHR_DRACO_MESH_COMPRESSION];
  if (e = a ? "draco:" + a.bufferView + ":" + a.indices + ":" + sa(a.attributes) : h.indices + ":" + sa(h.attributes) + ":" + h.mode, h.targets !== void 0) for (let t = 0, A = h.targets.length; t < A; t++) e += ":" + sa(h.targets[t]);
  return e;
}
function sa(h) {
  let e = "";
  const a = Object.keys(h).sort();
  for (let t = 0, A = a.length; t < A; t++) e += a[t] + ":" + h[a[t]] + ";";
  return e;
}
function ja(h) {
  switch (h) {
    case Int8Array:
      return 1 / 127;
    case Uint8Array:
      return 1 / 255;
    case Int16Array:
      return 1 / 32767;
    case Uint16Array:
      return 1 / 65535;
    default:
      throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.");
  }
}
const ji = new xe();
class Si {
  constructor(e = {}, a = {}) {
    this.json = e, this.extensions = {}, this.plugins = {}, this.options = a, this.cache = new YA(), this.associations = /* @__PURE__ */ new Map(), this.primitiveCache = {}, this.nodeCache = {}, this.meshCache = { refs: {}, uses: {} }, this.cameraCache = { refs: {}, uses: {} }, this.lightCache = { refs: {}, uses: {} }, this.sourceCache = {}, this.textureCache = {}, this.nodeNamesUsed = {};
    let t = !1, A = -1, i = !1, s = -1;
    if (typeof navigator < "u") {
      const r = navigator.userAgent;
      t = /^((?!chrome|android).)*safari/i.test(r) === !0;
      const n = r.match(/Version\/(\d+)/);
      A = t && n ? parseInt(n[1], 10) : -1, i = r.indexOf("Firefox") > -1, s = i ? r.match(/Firefox\/([0-9]+)\./)[1] : -1;
    }
    typeof createImageBitmap > "u" || t && A < 17 || i && s < 98 ? this.textureLoader = new rA(this.options.manager) : this.textureLoader = new nA(this.options.manager), this.textureLoader.setCrossOrigin(this.options.crossOrigin), this.textureLoader.setRequestHeader(this.options.requestHeader), this.fileLoader = new Be(this.options.manager), this.fileLoader.setResponseType("arraybuffer"), this.options.crossOrigin === "use-credentials" && this.fileLoader.setWithCredentials(!0);
  }
  setExtensions(e) {
    this.extensions = e;
  }
  setPlugins(e) {
    this.plugins = e;
  }
  parse(e, a) {
    const t = this, A = this.json, i = this.extensions;
    this.cache.removeAll(), this.nodeCache = {}, this._invokeAll(function(s) {
      return s._markDefs && s._markDefs();
    }), Promise.all(this._invokeAll(function(s) {
      return s.beforeRoot && s.beforeRoot();
    })).then(function() {
      return Promise.all([t.getDependencies("scene"), t.getDependencies("animation"), t.getDependencies("camera")]);
    }).then(function(s) {
      const r = { scene: s[0][A.scene || 0], scenes: s[0], animations: s[1], cameras: s[2], asset: A.asset, parser: t, userData: {} };
      return ge(i, r, A), ie(r, A), Promise.all(t._invokeAll(function(n) {
        return n.afterRoot && n.afterRoot(r);
      })).then(function() {
        for (const n of r.scenes) n.updateMatrixWorld();
        e(r);
      });
    }).catch(a);
  }
  _markDefs() {
    const e = this.json.nodes || [], a = this.json.skins || [], t = this.json.meshes || [];
    for (let A = 0, i = a.length; A < i; A++) {
      const s = a[A].joints;
      for (let r = 0, n = s.length; r < n; r++) e[s[r]].isBone = !0;
    }
    for (let A = 0, i = e.length; A < i; A++) {
      const s = e[A];
      s.mesh !== void 0 && (this._addNodeRef(this.meshCache, s.mesh), s.skin !== void 0 && (t[s.mesh].isSkinnedMesh = !0)), s.camera !== void 0 && this._addNodeRef(this.cameraCache, s.camera);
    }
  }
  _addNodeRef(e, a) {
    a !== void 0 && (e.refs[a] === void 0 && (e.refs[a] = e.uses[a] = 0), e.refs[a]++);
  }
  _getNodeRef(e, a, t) {
    if (e.refs[a] <= 1) return t;
    const A = t.clone(), i = (s, r) => {
      const n = this.associations.get(s);
      n != null && this.associations.set(r, n);
      for (const [o, c] of s.children.entries()) i(c, r.children[o]);
    };
    return i(t, A), A.name += "_instance_" + e.uses[a]++, A;
  }
  _invokeOne(e) {
    const a = Object.values(this.plugins);
    a.push(this);
    for (let t = 0; t < a.length; t++) {
      const A = e(a[t]);
      if (A) return A;
    }
    return null;
  }
  _invokeAll(e) {
    const a = Object.values(this.plugins);
    a.unshift(this);
    const t = [];
    for (let A = 0; A < a.length; A++) {
      const i = e(a[A]);
      i && t.push(i);
    }
    return t;
  }
  getDependency(e, a) {
    const t = e + ":" + a;
    let A = this.cache.get(t);
    if (!A) {
      switch (e) {
        case "scene":
          A = this.loadScene(a);
          break;
        case "node":
          A = this._invokeOne(function(i) {
            return i.loadNode && i.loadNode(a);
          });
          break;
        case "mesh":
          A = this._invokeOne(function(i) {
            return i.loadMesh && i.loadMesh(a);
          });
          break;
        case "accessor":
          A = this.loadAccessor(a);
          break;
        case "bufferView":
          A = this._invokeOne(function(i) {
            return i.loadBufferView && i.loadBufferView(a);
          });
          break;
        case "buffer":
          A = this.loadBuffer(a);
          break;
        case "material":
          A = this._invokeOne(function(i) {
            return i.loadMaterial && i.loadMaterial(a);
          });
          break;
        case "texture":
          A = this._invokeOne(function(i) {
            return i.loadTexture && i.loadTexture(a);
          });
          break;
        case "skin":
          A = this.loadSkin(a);
          break;
        case "animation":
          A = this._invokeOne(function(i) {
            return i.loadAnimation && i.loadAnimation(a);
          });
          break;
        case "camera":
          A = this.loadCamera(a);
          break;
        default:
          if (A = this._invokeOne(function(i) {
            return i != this && i.getDependency && i.getDependency(e, a);
          }), !A) throw new Error("Unknown type: " + e);
      }
      this.cache.add(t, A);
    }
    return A;
  }
  getDependencies(e) {
    let a = this.cache.get(e);
    if (!a) {
      const t = this, A = this.json[e + (e === "mesh" ? "es" : "s")] || [];
      a = Promise.all(A.map(function(i, s) {
        return t.getDependency(e, s);
      })), this.cache.add(e, a);
    }
    return a;
  }
  loadBuffer(e) {
    const a = this.json.buffers[e], t = this.fileLoader;
    if (a.type && a.type !== "arraybuffer") throw new Error("THREE.GLTFLoader: " + a.type + " buffer type is not supported.");
    if (a.uri === void 0 && e === 0) return Promise.resolve(this.extensions[S.KHR_BINARY_GLTF].body);
    const A = this.options;
    return new Promise(function(i, s) {
      t.load(He.resolveURL(a.uri, A.path), i, void 0, function() {
        s(new Error('THREE.GLTFLoader: Failed to load buffer "' + a.uri + '".'));
      });
    });
  }
  loadBufferView(e) {
    const a = this.json.bufferViews[e];
    return this.getDependency("buffer", a.buffer).then(function(t) {
      const A = a.byteLength || 0, i = a.byteOffset || 0;
      return t.slice(i, i + A);
    });
  }
  loadAccessor(e) {
    const a = this, t = this.json, A = this.json.accessors[e];
    if (A.bufferView === void 0 && A.sparse === void 0) {
      const s = ia[A.type], r = ke[A.componentType], n = A.normalized === !0, o = new r(A.count * s);
      return Promise.resolve(new de(o, s, n));
    }
    const i = [];
    return A.bufferView !== void 0 ? i.push(this.getDependency("bufferView", A.bufferView)) : i.push(null), A.sparse !== void 0 && (i.push(this.getDependency("bufferView", A.sparse.indices.bufferView)), i.push(this.getDependency("bufferView", A.sparse.values.bufferView))), Promise.all(i).then(function(s) {
      const r = s[0], n = ia[A.type], o = ke[A.componentType], c = o.BYTES_PER_ELEMENT, b = c * n, g = A.byteOffset || 0, l = A.bufferView !== void 0 ? t.bufferViews[A.bufferView].byteStride : void 0, d = A.normalized === !0;
      let f, I;
      if (l && l !== b) {
        const m = Math.floor(g / l), u = "InterleavedBuffer:" + A.bufferView + ":" + A.componentType + ":" + m + ":" + A.count;
        let C = a.cache.get(u);
        C || (f = new o(r, m * l, A.count * l / c), C = new oA(f, l / c), a.cache.add(u, C)), I = new cA(C, n, g % l / c, d);
      } else f = r === null ? new o(A.count * n) : new o(r, g, A.count * n), I = new de(f, n, d);
      if (A.sparse !== void 0) {
        const m = ia.SCALAR, u = ke[A.sparse.indices.componentType], C = A.sparse.indices.byteOffset || 0, B = A.sparse.values.byteOffset || 0, w = new u(s[1], C, A.sparse.count * m), k = new o(s[2], B, A.sparse.count * n);
        r !== null && (I = new de(I.array.slice(), I.itemSize, I.normalized)), I.normalized = !1;
        for (let y = 0, p = w.length; y < p; y++) {
          const Q = w[y];
          if (I.setX(Q, k[y * n]), n >= 2 && I.setY(Q, k[y * n + 1]), n >= 3 && I.setZ(Q, k[y * n + 2]), n >= 4 && I.setW(Q, k[y * n + 3]), n >= 5) throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
        }
        I.normalized = d;
      }
      return I;
    });
  }
  loadTexture(e) {
    const a = this.json, t = this.options, A = a.textures[e].source, i = a.images[A];
    let s = this.textureLoader;
    if (i.uri) {
      const r = t.manager.getHandler(i.uri);
      r !== null && (s = r);
    }
    return this.loadTextureImage(e, A, s);
  }
  loadTextureImage(e, a, t) {
    const A = this, i = this.json, s = i.textures[e], r = i.images[a], n = (r.uri || r.bufferView) + ":" + s.sampler;
    if (this.textureCache[n]) return this.textureCache[n];
    const o = this.loadImageSource(a, t).then(function(c) {
      c.flipY = !1, c.name = s.name || r.name || "", c.name === "" && typeof r.uri == "string" && r.uri.startsWith("data:image/") === !1 && (c.name = r.uri);
      const b = (i.samplers || {})[s.sampler] || {};
      return c.magFilter = Za[b.magFilter] || me, c.minFilter = Za[b.minFilter] || Xe, c.wrapS = $a[b.wrapS] || ya, c.wrapT = $a[b.wrapT] || ya, c.generateMipmaps = !c.isCompressedTexture && c.minFilter !== v && c.minFilter !== me, A.associations.set(c, { textures: e }), c;
    }).catch(function() {
      return null;
    });
    return this.textureCache[n] = o, o;
  }
  loadImageSource(e, a) {
    const t = this, A = this.json, i = this.options;
    if (this.sourceCache[e] !== void 0) return this.sourceCache[e].then((b) => b.clone());
    const s = A.images[e], r = self.URL || self.webkitURL;
    let n = s.uri || "", o = !1;
    if (s.bufferView !== void 0) n = t.getDependency("bufferView", s.bufferView).then(function(b) {
      o = !0;
      const g = new Blob([b], { type: s.mimeType });
      return n = r.createObjectURL(g), n;
    });
    else if (s.uri === void 0) throw new Error("THREE.GLTFLoader: Image " + e + " is missing URI and bufferView");
    const c = Promise.resolve(n).then(function(b) {
      return new Promise(function(g, l) {
        let d = g;
        a.isImageBitmapLoader === !0 && (d = function(f) {
          const I = new Ga(f);
          I.needsUpdate = !0, g(I);
        }), a.load(He.resolveURL(b, i.path), d, void 0, l);
      });
    }).then(function(b) {
      var g;
      return o === !0 && r.revokeObjectURL(n), ie(b, s), b.userData.mimeType = s.mimeType || ((g = s.uri).search(/\.jpe?g($|\?)/i) > 0 || g.search(/^data\:image\/jpeg/) === 0 ? "image/jpeg" : g.search(/\.webp($|\?)/i) > 0 || g.search(/^data\:image\/webp/) === 0 ? "image/webp" : g.search(/\.ktx2($|\?)/i) > 0 || g.search(/^data\:image\/ktx2/) === 0 ? "image/ktx2" : "image/png"), b;
    }).catch(function(b) {
      throw console.error("THREE.GLTFLoader: Couldn't load texture", n), b;
    });
    return this.sourceCache[e] = c, c;
  }
  assignTexture(e, a, t, A) {
    const i = this;
    return this.getDependency("texture", t.index).then(function(s) {
      if (!s) return null;
      if (t.texCoord !== void 0 && t.texCoord > 0 && ((s = s.clone()).channel = t.texCoord), i.extensions[S.KHR_TEXTURE_TRANSFORM]) {
        const r = t.extensions !== void 0 ? t.extensions[S.KHR_TEXTURE_TRANSFORM] : void 0;
        if (r) {
          const n = i.associations.get(s);
          s = i.extensions[S.KHR_TEXTURE_TRANSFORM].extendTexture(s, r), i.associations.set(s, n);
        }
      }
      return A !== void 0 && (s.colorSpace = A), e[a] = s, s;
    });
  }
  assignFinalMaterial(e) {
    const a = e.geometry;
    let t = e.material;
    const A = a.attributes.tangent === void 0, i = a.attributes.color !== void 0, s = a.attributes.normal === void 0;
    if (e.isPoints) {
      const r = "PointsMaterial:" + t.uuid;
      let n = this.cache.get(r);
      n || (n = new fA(), ea.prototype.copy.call(n, t), n.color.copy(t.color), n.map = t.map, n.sizeAttenuation = !1, this.cache.add(r, n)), t = n;
    } else if (e.isLine) {
      const r = "LineBasicMaterial:" + t.uuid;
      let n = this.cache.get(r);
      n || (n = new It(), ea.prototype.copy.call(n, t), n.color.copy(t.color), n.map = t.map, this.cache.add(r, n)), t = n;
    }
    if (A || i || s) {
      let r = "ClonedMaterial:" + t.uuid + ":";
      A && (r += "derivative-tangents:"), i && (r += "vertex-colors:"), s && (r += "flat-shading:");
      let n = this.cache.get(r);
      n || (n = t.clone(), i && (n.vertexColors = !0), s && (n.flatShading = !0), A && (n.normalScale && (n.normalScale.y *= -1), n.clearcoatNormalScale && (n.clearcoatNormalScale.y *= -1)), this.cache.add(r, n), this.associations.set(n, this.associations.get(t))), t = n;
    }
    e.material = t;
  }
  getMaterialType() {
    return Ua;
  }
  loadMaterial(e) {
    const a = this, t = this.json, A = this.extensions, i = t.materials[e];
    let s;
    const r = {}, n = [];
    if ((i.extensions || {})[S.KHR_MATERIALS_UNLIT]) {
      const c = A[S.KHR_MATERIALS_UNLIT];
      s = c.getMaterialType(), n.push(c.extendParams(r, i, a));
    } else {
      const c = i.pbrMetallicRoughness || {};
      if (r.color = new he(1, 1, 1), r.opacity = 1, Array.isArray(c.baseColorFactor)) {
        const b = c.baseColorFactor;
        r.color.setRGB(b[0], b[1], b[2], K), r.opacity = b[3];
      }
      c.baseColorTexture !== void 0 && n.push(a.assignTexture(r, "map", c.baseColorTexture, se)), r.metalness = c.metallicFactor !== void 0 ? c.metallicFactor : 1, r.roughness = c.roughnessFactor !== void 0 ? c.roughnessFactor : 1, c.metallicRoughnessTexture !== void 0 && (n.push(a.assignTexture(r, "metalnessMap", c.metallicRoughnessTexture)), n.push(a.assignTexture(r, "roughnessMap", c.metallicRoughnessTexture))), s = this._invokeOne(function(b) {
        return b.getMaterialType && b.getMaterialType(e);
      }), n.push(Promise.all(this._invokeAll(function(b) {
        return b.extendMaterialParams && b.extendMaterialParams(e, r);
      })));
    }
    i.doubleSided === !0 && (r.side = uA);
    const o = i.alphaMode || Qi;
    if (o === wi ? (r.transparent = !0, r.depthWrite = !1) : (r.transparent = !1, o === yi && (r.alphaTest = i.alphaCutoff !== void 0 ? i.alphaCutoff : 0.5)), i.normalTexture !== void 0 && s !== Me && (n.push(a.assignTexture(r, "normalMap", i.normalTexture)), r.normalScale = new Ct(1, 1), i.normalTexture.scale !== void 0)) {
      const c = i.normalTexture.scale;
      r.normalScale.set(c, c);
    }
    if (i.occlusionTexture !== void 0 && s !== Me && (n.push(a.assignTexture(r, "aoMap", i.occlusionTexture)), i.occlusionTexture.strength !== void 0 && (r.aoMapIntensity = i.occlusionTexture.strength)), i.emissiveFactor !== void 0 && s !== Me) {
      const c = i.emissiveFactor;
      r.emissive = new he().setRGB(c[0], c[1], c[2], K);
    }
    return i.emissiveTexture !== void 0 && s !== Me && n.push(a.assignTexture(r, "emissiveMap", i.emissiveTexture, se)), Promise.all(n).then(function() {
      const c = new s(r);
      return i.name && (c.name = i.name), ie(c, i), a.associations.set(c, { materials: e }), i.extensions && ge(A, c, i), c;
    });
  }
  createUniqueName(e) {
    const a = IA.sanitizeNodeName(e || "");
    return a in this.nodeNamesUsed ? a + "_" + ++this.nodeNamesUsed[a] : (this.nodeNamesUsed[a] = 0, a);
  }
  loadGeometries(e) {
    const a = this, t = this.extensions, A = this.primitiveCache;
    function i(r) {
      return t[S.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(r, a).then(function(n) {
        return et(n, r, a);
      });
    }
    const s = [];
    for (let r = 0, n = e.length; r < n; r++) {
      const o = e[r], c = xi(o), b = A[c];
      if (b) s.push(b.promise);
      else {
        let g;
        g = o.extensions && o.extensions[S.KHR_DRACO_MESH_COMPRESSION] ? i(o) : et(new Ze(), o, a), A[c] = { primitive: o, promise: g }, s.push(g);
      }
    }
    return Promise.all(s);
  }
  loadMesh(e) {
    const a = this, t = this.json, A = this.extensions, i = t.meshes[e], s = i.primitives, r = [];
    for (let o = 0, c = s.length; o < c; o++) {
      const b = s[o].material === void 0 ? ((n = this.cache).DefaultMaterial === void 0 && (n.DefaultMaterial = new Ua({ color: 16777215, emissive: 0, metalness: 1, roughness: 1, transparent: !1, depthTest: !0, side: We })), n.DefaultMaterial) : this.getDependency("material", s[o].material);
      r.push(b);
    }
    var n;
    return r.push(a.loadGeometries(s)), Promise.all(r).then(function(o) {
      const c = o.slice(0, o.length - 1), b = o[o.length - 1], g = [];
      for (let d = 0, f = b.length; d < f; d++) {
        const I = b[d], m = s[d];
        let u;
        const C = c[d];
        if (m.mode === J.TRIANGLES || m.mode === J.TRIANGLE_STRIP || m.mode === J.TRIANGLE_FAN || m.mode === void 0) u = i.isSkinnedMesh === !0 ? new mA(I, C) : new wa(I, C), u.isSkinnedMesh === !0 && u.normalizeSkinWeights(), m.mode === J.TRIANGLE_STRIP ? u.geometry = Wa(u.geometry, Bt) : m.mode === J.TRIANGLE_FAN && (u.geometry = Wa(u.geometry, Ea));
        else if (m.mode === J.LINES) u = new mt(I, C);
        else if (m.mode === J.LINE_STRIP) u = new BA(I, C);
        else if (m.mode === J.LINE_LOOP) u = new CA(I, C);
        else {
          if (m.mode !== J.POINTS) throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + m.mode);
          u = new pA(I, C);
        }
        Object.keys(u.geometry.morphAttributes).length > 0 && ki(u, i), u.name = a.createUniqueName(i.name || "mesh_" + e), ie(u, i), m.extensions && ge(A, u, m), a.assignFinalMaterial(u), g.push(u);
      }
      for (let d = 0, f = g.length; d < f; d++) a.associations.set(g[d], { meshes: e, primitives: d });
      if (g.length === 1) return i.extensions && ge(A, g[0], i), g[0];
      const l = new aa();
      i.extensions && ge(A, l, i), a.associations.set(l, { meshes: e });
      for (let d = 0, f = g.length; d < f; d++) l.add(g[d]);
      return l;
    });
  }
  loadCamera(e) {
    let a;
    const t = this.json.cameras[e], A = t[t.type];
    if (A) return t.type === "perspective" ? a = new EA(QA.radToDeg(A.yfov), A.aspectRatio || 1, A.znear || 1, A.zfar || 2e6) : t.type === "orthographic" && (a = new Qt(-A.xmag, A.xmag, A.ymag, -A.ymag, A.znear, A.zfar)), t.name && (a.name = this.createUniqueName(t.name)), ie(a, t), Promise.resolve(a);
    console.warn("THREE.GLTFLoader: Missing camera parameters.");
  }
  loadSkin(e) {
    const a = this.json.skins[e], t = [];
    for (let A = 0, i = a.joints.length; A < i; A++) t.push(this._loadNodeShallow(a.joints[A]));
    return a.inverseBindMatrices !== void 0 ? t.push(this.getDependency("accessor", a.inverseBindMatrices)) : t.push(null), Promise.all(t).then(function(A) {
      const i = A.pop(), s = A, r = [], n = [];
      for (let o = 0, c = s.length; o < c; o++) {
        const b = s[o];
        if (b) {
          r.push(b);
          const g = new xe();
          i !== null && g.fromArray(i.array, 16 * o), n.push(g);
        } else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', a.joints[o]);
      }
      return new yA(r, n);
    });
  }
  loadAnimation(e) {
    const a = this.json, t = this, A = a.animations[e], i = A.name ? A.name : "animation_" + e, s = [], r = [], n = [], o = [], c = [];
    for (let b = 0, g = A.channels.length; b < g; b++) {
      const l = A.channels[b], d = A.samplers[l.sampler], f = l.target, I = f.node, m = A.parameters !== void 0 ? A.parameters[d.input] : d.input, u = A.parameters !== void 0 ? A.parameters[d.output] : d.output;
      f.node !== void 0 && (s.push(this.getDependency("node", I)), r.push(this.getDependency("accessor", m)), n.push(this.getDependency("accessor", u)), o.push(d), c.push(f));
    }
    return Promise.all([Promise.all(s), Promise.all(r), Promise.all(n), Promise.all(o), Promise.all(c)]).then(function(b) {
      const g = b[0], l = b[1], d = b[2], f = b[3], I = b[4], m = [];
      for (let u = 0, C = g.length; u < C; u++) {
        const B = g[u], w = l[u], k = d[u], y = f[u], p = I[u];
        if (B === void 0) continue;
        B.updateMatrix && B.updateMatrix();
        const Q = t._createAnimationTracks(B, w, k, y, p);
        if (Q) for (let x = 0; x < Q.length; x++) m.push(Q[x]);
      }
      return new wA(i, void 0, m);
    });
  }
  createNodeMesh(e) {
    const a = this.json, t = this, A = a.nodes[e];
    return A.mesh === void 0 ? null : t.getDependency("mesh", A.mesh).then(function(i) {
      const s = t._getNodeRef(t.meshCache, A.mesh, i);
      return A.weights !== void 0 && s.traverse(function(r) {
        if (r.isMesh) for (let n = 0, o = A.weights.length; n < o; n++) r.morphTargetInfluences[n] = A.weights[n];
      }), s;
    });
  }
  loadNode(e) {
    const a = this, t = this.json.nodes[e], A = a._loadNodeShallow(e), i = [], s = t.children || [];
    for (let n = 0, o = s.length; n < o; n++) i.push(a.getDependency("node", s[n]));
    const r = t.skin === void 0 ? Promise.resolve(null) : a.getDependency("skin", t.skin);
    return Promise.all([A, Promise.all(i), r]).then(function(n) {
      const o = n[0], c = n[1], b = n[2];
      b !== null && o.traverse(function(g) {
        g.isSkinnedMesh && g.bind(b, ji);
      });
      for (let g = 0, l = c.length; g < l; g++) o.add(c[g]);
      return o;
    });
  }
  _loadNodeShallow(e) {
    const a = this.json, t = this.extensions, A = this;
    if (this.nodeCache[e] !== void 0) return this.nodeCache[e];
    const i = a.nodes[e], s = i.name ? A.createUniqueName(i.name) : "", r = [], n = A._invokeOne(function(o) {
      return o.createNodeMesh && o.createNodeMesh(e);
    });
    return n && r.push(n), i.camera !== void 0 && r.push(A.getDependency("camera", i.camera).then(function(o) {
      return A._getNodeRef(A.cameraCache, i.camera, o);
    })), A._invokeAll(function(o) {
      return o.createNodeAttachment && o.createNodeAttachment(e);
    }).forEach(function(o) {
      r.push(o);
    }), this.nodeCache[e] = Promise.all(r).then(function(o) {
      let c;
      if (c = i.isBone === !0 ? new kA() : o.length > 1 ? new aa() : o.length === 1 ? o[0] : new Et(), c !== o[0]) for (let b = 0, g = o.length; b < g; b++) c.add(o[b]);
      if (i.name && (c.userData.name = i.name, c.name = s), ie(c, i), i.extensions && ge(t, c, i), i.matrix !== void 0) {
        const b = new xe();
        b.fromArray(i.matrix), c.applyMatrix4(b);
      } else i.translation !== void 0 && c.position.fromArray(i.translation), i.rotation !== void 0 && c.quaternion.fromArray(i.rotation), i.scale !== void 0 && c.scale.fromArray(i.scale);
      return A.associations.has(c) || A.associations.set(c, {}), A.associations.get(c).nodes = e, c;
    }), this.nodeCache[e];
  }
  loadScene(e) {
    const a = this.extensions, t = this.json.scenes[e], A = this, i = new aa();
    t.name && (i.name = A.createUniqueName(t.name)), ie(i, t), t.extensions && ge(a, i, t);
    const s = t.nodes || [], r = [];
    for (let n = 0, o = s.length; n < o; n++) r.push(A.getDependency("node", s[n]));
    return Promise.all(r).then(function(n) {
      for (let o = 0, c = n.length; o < c; o++) i.add(n[o]);
      return A.associations = ((o) => {
        const c = /* @__PURE__ */ new Map();
        for (const [b, g] of A.associations) (b instanceof ea || b instanceof Ga) && c.set(b, g);
        return o.traverse((b) => {
          const g = A.associations.get(b);
          g != null && c.set(b, g);
        }), c;
      })(i), i;
    });
  }
  _createAnimationTracks(e, a, t, A, i) {
    const s = [], r = e.name ? e.name : e.uuid, n = [];
    let o;
    switch (ne[i.path] === ne.weights ? e.traverse(function(g) {
      g.morphTargetInfluences && n.push(g.name ? g.name : g.uuid);
    }) : n.push(r), ne[i.path]) {
      case ne.weights:
        o = Na;
        break;
      case ne.rotation:
        o = La;
        break;
      case ne.position:
      case ne.scale:
        o = Ha;
        break;
      default:
        t.itemSize === 1 ? o = Na : o = Ha;
    }
    const c = A.interpolation !== void 0 ? Ei[A.interpolation] : yt, b = this._getArrayFromAccessor(t);
    for (let g = 0, l = n.length; g < l; g++) {
      const d = new o(n[g] + "." + ne[i.path], a.array, b, c);
      A.interpolation === "CUBICSPLINE" && this._createCubicSplineTrackInterpolant(d), s.push(d);
    }
    return s;
  }
  _getArrayFromAccessor(e) {
    let a = e.array;
    if (e.normalized) {
      const t = ja(a.constructor), A = new Float32Array(a.length);
      for (let i = 0, s = a.length; i < s; i++) A[i] = a[i] * t;
      a = A;
    }
    return a;
  }
  _createCubicSplineTrackInterpolant(e) {
    e.createInterpolant = function(a) {
      return new (this instanceof La ? pi : Ft)(this.times, this.values, this.getValueSize() / 3, a);
    }, e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0;
  }
}
function et(h, e, a) {
  const t = e.attributes, A = [];
  function i(s, r) {
    return a.getDependency("accessor", s).then(function(n) {
      h.setAttribute(r, n);
    });
  }
  for (const s in t) {
    const r = xa[s] || s.toLowerCase();
    r in h.attributes || A.push(i(t[s], r));
  }
  if (e.indices !== void 0 && !h.index) {
    const s = a.getDependency("accessor", e.indices).then(function(r) {
      h.setIndex(r);
    });
    A.push(s);
  }
  return ka.workingColorSpace !== K && "COLOR_0" in t && console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ka.workingColorSpace}" not supported.`), ie(h, e), function(s, r, n) {
    const o = r.attributes, c = new va();
    if (o.POSITION === void 0) return;
    {
      const l = n.json.accessors[o.POSITION], d = l.min, f = l.max;
      if (d === void 0 || f === void 0) return void console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      if (c.set(new D(d[0], d[1], d[2]), new D(f[0], f[1], f[2])), l.normalized) {
        const I = ja(ke[l.componentType]);
        c.min.multiplyScalar(I), c.max.multiplyScalar(I);
      }
    }
    const b = r.targets;
    if (b !== void 0) {
      const l = new D(), d = new D();
      for (let f = 0, I = b.length; f < I; f++) {
        const m = b[f];
        if (m.POSITION !== void 0) {
          const u = n.json.accessors[m.POSITION], C = u.min, B = u.max;
          if (C !== void 0 && B !== void 0) {
            if (d.setX(Math.max(Math.abs(C[0]), Math.abs(B[0]))), d.setY(Math.max(Math.abs(C[1]), Math.abs(B[1]))), d.setZ(Math.max(Math.abs(C[2]), Math.abs(B[2]))), u.normalized) {
              const w = ja(ke[u.componentType]);
              d.multiplyScalar(w);
            }
            l.max(d);
          } else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
        }
      }
      c.expandByVector(l);
    }
    s.boundingBox = c;
    const g = new SA();
    c.getCenter(g.center), g.radius = c.min.distanceTo(c.max) / 2, s.boundingSphere = g;
  }(h, e, a), Promise.all(A).then(function() {
    return e.targets !== void 0 ? function(s, r, n) {
      let o = !1, c = !1, b = !1;
      for (let f = 0, I = r.length; f < I; f++) {
        const m = r[f];
        if (m.POSITION !== void 0 && (o = !0), m.NORMAL !== void 0 && (c = !0), m.COLOR_0 !== void 0 && (b = !0), o && c && b) break;
      }
      if (!o && !c && !b) return Promise.resolve(s);
      const g = [], l = [], d = [];
      for (let f = 0, I = r.length; f < I; f++) {
        const m = r[f];
        if (o) {
          const u = m.POSITION !== void 0 ? n.getDependency("accessor", m.POSITION) : s.attributes.position;
          g.push(u);
        }
        if (c) {
          const u = m.NORMAL !== void 0 ? n.getDependency("accessor", m.NORMAL) : s.attributes.normal;
          l.push(u);
        }
        if (b) {
          const u = m.COLOR_0 !== void 0 ? n.getDependency("accessor", m.COLOR_0) : s.attributes.color;
          d.push(u);
        }
      }
      return Promise.all([Promise.all(g), Promise.all(l), Promise.all(d)]).then(function(f) {
        const I = f[0], m = f[1], u = f[2];
        return o && (s.morphAttributes.position = I), c && (s.morphAttributes.normal = m), b && (s.morphAttributes.color = u), s.morphTargetsRelative = !0, s;
      });
    }(h, e.targets, a) : h;
  });
}
const ra = /* @__PURE__ */ new WeakMap();
class Rt extends Fa {
  constructor(e) {
    super(e), this.decoderPath = "", this.decoderConfig = {}, this.decoderBinary = null, this.decoderPending = null, this.workerLimit = 4, this.workerPool = [], this.workerNextTaskID = 1, this.workerSourceURL = "", this.defaultAttributeIDs = { position: "POSITION", normal: "NORMAL", color: "COLOR", uv: "TEX_COORD" }, this.defaultAttributeTypes = { position: "Float32Array", normal: "Float32Array", color: "Float32Array", uv: "Float32Array" };
  }
  setDecoderPath(e) {
    return this.decoderPath = e, this;
  }
  setDecoderConfig(e) {
    return this.decoderConfig = e, this;
  }
  setWorkerLimit(e) {
    return this.workerLimit = e, this;
  }
  load(e, a, t, A) {
    const i = new Be(this.manager);
    i.setPath(this.path), i.setResponseType("arraybuffer"), i.setRequestHeader(this.requestHeader), i.setWithCredentials(this.withCredentials), i.load(e, (s) => {
      this.parse(s, a, A);
    }, t, A);
  }
  parse(e, a, t = () => {
  }) {
    this.decodeDracoFile(e, a, null, null, se, t).catch(t);
  }
  decodeDracoFile(e, a, t, A, i = K, s = () => {
  }) {
    const r = { attributeIDs: t || this.defaultAttributeIDs, attributeTypes: A || this.defaultAttributeTypes, useUniqueIDs: !!t, vertexColorSpace: i };
    return this.decodeGeometry(e, r).then(a).catch(s);
  }
  decodeGeometry(e, a) {
    const t = JSON.stringify(a);
    if (ra.has(e)) {
      const n = ra.get(e);
      if (n.key === t) return n.promise;
      if (e.byteLength === 0) throw new Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.");
    }
    let A;
    const i = this.workerNextTaskID++, s = e.byteLength, r = this._getWorker(i, s).then((n) => (A = n, new Promise((o, c) => {
      A._callbacks[i] = { resolve: o, reject: c }, A.postMessage({ type: "decode", id: i, taskConfig: a, buffer: e }, [e]);
    }))).then((n) => this._createGeometry(n.geometry));
    return r.catch(() => !0).then(() => {
      A && i && this._releaseTask(A, i);
    }), ra.set(e, { key: t, promise: r }), r;
  }
  _createGeometry(e) {
    const a = new Ze();
    e.index && a.setIndex(new de(e.index.array, 1));
    for (let t = 0; t < e.attributes.length; t++) {
      const A = e.attributes[t], i = A.name, s = A.array, r = A.itemSize, n = new de(s, r);
      i === "color" && (this._assignVertexColorSpace(n, A.vertexColorSpace), n.normalized = !(s instanceof Float32Array)), a.setAttribute(i, n);
    }
    return a;
  }
  _assignVertexColorSpace(e, a) {
    if (a !== se) return;
    const t = new he();
    for (let A = 0, i = e.count; A < i; A++) t.fromBufferAttribute(e, A), ka.toWorkingColorSpace(t, se), e.setXYZ(A, t.r, t.g, t.b);
  }
  _loadLibrary(e, a) {
    const t = new Be(this.manager);
    return t.setPath(this.decoderPath), t.setResponseType(a), t.setWithCredentials(this.withCredentials), new Promise((A, i) => {
      t.load(e, A, void 0, i);
    });
  }
  preload() {
    return this._initDecoder(), this;
  }
  _initDecoder() {
    if (this.decoderPending) return this.decoderPending;
    const e = typeof WebAssembly != "object" || this.decoderConfig.type === "js", a = [];
    return e ? a.push(this._loadLibrary("draco_decoder.js", "text")) : (a.push(this._loadLibrary("draco_wasm_wrapper.js", "text")), a.push(this._loadLibrary("draco_decoder.wasm", "arraybuffer"))), this.decoderPending = Promise.all(a).then((t) => {
      const A = t[0];
      e || (this.decoderConfig.wasmBinary = t[1]);
      const i = Di.toString(), s = ["/* draco decoder */", A, "", "/* worker */", i.substring(i.indexOf("{") + 1, i.lastIndexOf("}"))].join(`
`);
      this.workerSourceURL = URL.createObjectURL(new Blob([s]));
    }), this.decoderPending;
  }
  _getWorker(e, a) {
    return this._initDecoder().then(() => {
      if (this.workerPool.length < this.workerLimit) {
        const A = new Worker(this.workerSourceURL);
        A._callbacks = {}, A._taskCosts = {}, A._taskLoad = 0, A.postMessage({ type: "init", decoderConfig: this.decoderConfig }), A.onmessage = function(i) {
          const s = i.data;
          switch (s.type) {
            case "decode":
              A._callbacks[s.id].resolve(s);
              break;
            case "error":
              A._callbacks[s.id].reject(s);
              break;
            default:
              console.error('THREE.DRACOLoader: Unexpected message, "' + s.type + '"');
          }
        }, this.workerPool.push(A);
      } else this.workerPool.sort(function(A, i) {
        return A._taskLoad > i._taskLoad ? -1 : 1;
      });
      const t = this.workerPool[this.workerPool.length - 1];
      return t._taskCosts[e] = a, t._taskLoad += a, t;
    });
  }
  _releaseTask(e, a) {
    e._taskLoad -= e._taskCosts[a], delete e._callbacks[a], delete e._taskCosts[a];
  }
  debug() {
    console.log("Task load: ", this.workerPool.map((e) => e._taskLoad));
  }
  dispose() {
    for (let e = 0; e < this.workerPool.length; ++e) this.workerPool[e].terminate();
    return this.workerPool.length = 0, this.workerSourceURL !== "" && URL.revokeObjectURL(this.workerSourceURL), this;
  }
}
function Di() {
  let h, e;
  function a(t, A, i, s, r, n) {
    const o = n.num_components(), c = i.num_points() * o, b = c * r.BYTES_PER_ELEMENT, g = function(f, I) {
      switch (I) {
        case Float32Array:
          return f.DT_FLOAT32;
        case Int8Array:
          return f.DT_INT8;
        case Int16Array:
          return f.DT_INT16;
        case Int32Array:
          return f.DT_INT32;
        case Uint8Array:
          return f.DT_UINT8;
        case Uint16Array:
          return f.DT_UINT16;
        case Uint32Array:
          return f.DT_UINT32;
      }
    }(t, r), l = t._malloc(b);
    A.GetAttributeDataArrayForAllPoints(i, n, g, b, l);
    const d = new r(t.HEAPF32.buffer, l, c).slice();
    return t._free(l), { name: s, array: d, itemSize: o };
  }
  onmessage = function(t) {
    const A = t.data;
    switch (A.type) {
      case "init":
        h = A.decoderConfig, e = new Promise(function(r) {
          h.onModuleLoaded = function(n) {
            r({ draco: n });
          }, DracoDecoderModule(h);
        });
        break;
      case "decode":
        const i = A.buffer, s = A.taskConfig;
        e.then((r) => {
          const n = r.draco, o = new n.Decoder();
          try {
            const c = function(g, l, d, f) {
              const I = f.attributeIDs, m = f.attributeTypes;
              let u, C;
              const B = l.GetEncodedGeometryType(d);
              if (B === g.TRIANGULAR_MESH) u = new g.Mesh(), C = l.DecodeArrayToMesh(d, d.byteLength, u);
              else {
                if (B !== g.POINT_CLOUD) throw new Error("THREE.DRACOLoader: Unexpected geometry type.");
                u = new g.PointCloud(), C = l.DecodeArrayToPointCloud(d, d.byteLength, u);
              }
              if (!C.ok() || u.ptr === 0) throw new Error("THREE.DRACOLoader: Decoding failed: " + C.error_msg());
              const w = { index: null, attributes: [] };
              for (const k in I) {
                const y = self[m[k]];
                let p, Q;
                if (f.useUniqueIDs) Q = I[k], p = l.GetAttributeByUniqueId(u, Q);
                else {
                  if (Q = l.GetAttributeId(u, g[I[k]]), Q === -1) continue;
                  p = l.GetAttribute(u, Q);
                }
                const x = a(g, l, u, k, y, p);
                k === "color" && (x.vertexColorSpace = f.vertexColorSpace), w.attributes.push(x);
              }
              return B === g.TRIANGULAR_MESH && (w.index = function(k, y, p) {
                const Q = p.num_faces(), x = 3 * Q, j = 4 * x, M = k._malloc(j);
                y.GetTrianglesUInt32Array(p, j, M);
                const O = new Uint32Array(k.HEAPF32.buffer, M, x).slice();
                return k._free(M), { array: O, itemSize: 1 };
              }(g, l, u)), g.destroy(u), w;
            }(n, o, new Int8Array(i), s), b = c.attributes.map((g) => g.array.buffer);
            c.index && b.push(c.index.array.buffer), self.postMessage({ type: "decode", id: A.id, geometry: c }, b);
          } catch (c) {
            console.error(c), self.postMessage({ type: "error", id: A.id, error: c.message });
          } finally {
            n.destroy(o);
          }
        });
    }
  };
}
class vi {
  constructor(e = 4) {
    this.pool = e, this.queue = [], this.workers = [], this.workersResolve = [], this.workerStatus = 0;
  }
  _initWorker(e) {
    if (!this.workers[e]) {
      const a = this.workerCreator();
      a.addEventListener("message", this._onMessage.bind(this, e)), this.workers[e] = a;
    }
  }
  _getIdleWorker() {
    for (let e = 0; e < this.pool; e++) if (!(this.workerStatus & 1 << e)) return e;
    return -1;
  }
  _onMessage(e, a) {
    const t = this.workersResolve[e];
    if (t && t(a), this.queue.length) {
      const { resolve: A, msg: i, transfer: s } = this.queue.shift();
      this.workersResolve[e] = A, this.workers[e].postMessage(i, s);
    } else this.workerStatus ^= 1 << e;
  }
  setWorkerCreator(e) {
    this.workerCreator = e;
  }
  setWorkerLimit(e) {
    this.pool = e;
  }
  postMessage(e, a) {
    return new Promise((t) => {
      const A = this._getIdleWorker();
      A !== -1 ? (this._initWorker(A), this.workerStatus |= 1 << A, this.workersResolve[A] = t, this.workers[A].postMessage(e, a)) : this.queue.push({ resolve: t, msg: e, transfer: a });
    });
  }
  dispose() {
    this.workers.forEach((e) => e.terminate()), this.workersResolve.length = 0, this.workers.length = 0, this.queue.length = 0, this.workerStatus = 0;
  }
}
const Mt = 9, Tt = 15, Ut = 16, Gt = 22, Ht = 37, Nt = 43, Lt = 76, Ot = 83, Jt = 97, Pt = 100, qt = 103, _t = 109, Kt = 165, zt = 166, Ra = 1000066e3;
class Fi {
  constructor() {
    this.vkFormat = 0, this.typeSize = 1, this.pixelWidth = 0, this.pixelHeight = 0, this.pixelDepth = 0, this.layerCount = 0, this.faceCount = 1, this.supercompressionScheme = 0, this.levels = [], this.dataFormatDescriptor = [{ vendorId: 0, descriptorType: 0, descriptorBlockSize: 0, versionNumber: 2, colorModel: 0, colorPrimaries: 1, transferFunction: 2, flags: 0, texelBlockDimension: [0, 0, 0, 0], bytesPlane: [0, 0, 0, 0, 0, 0, 0, 0], samples: [] }], this.keyValue = {}, this.globalData = null;
  }
}
class Fe {
  constructor(e, a, t, A) {
    this._dataView = void 0, this._littleEndian = void 0, this._offset = void 0, this._dataView = new DataView(e.buffer, e.byteOffset + a, t), this._littleEndian = A, this._offset = 0;
  }
  _nextUint8() {
    const e = this._dataView.getUint8(this._offset);
    return this._offset += 1, e;
  }
  _nextUint16() {
    const e = this._dataView.getUint16(this._offset, this._littleEndian);
    return this._offset += 2, e;
  }
  _nextUint32() {
    const e = this._dataView.getUint32(this._offset, this._littleEndian);
    return this._offset += 4, e;
  }
  _nextUint64() {
    const e = this._dataView.getUint32(this._offset, this._littleEndian) + 4294967296 * this._dataView.getUint32(this._offset + 4, this._littleEndian);
    return this._offset += 8, e;
  }
  _nextInt32() {
    const e = this._dataView.getInt32(this._offset, this._littleEndian);
    return this._offset += 4, e;
  }
  _nextUint8Array(e) {
    const a = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._offset, e);
    return this._offset += e, a;
  }
  _skip(e) {
    return this._offset += e, this;
  }
  _scan(e, a) {
    a === void 0 && (a = 0);
    const t = this._offset;
    let A = 0;
    for (; this._dataView.getUint8(this._offset) !== a && A < e; ) A++, this._offset++;
    return A < e && this._offset++, new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + t, A);
  }
}
const G = [171, 75, 84, 88, 32, 50, 48, 187, 13, 10, 26, 10];
function at(h) {
  return new TextDecoder().decode(h);
}
let na, Ae, Sa;
const oa = { env: { emscripten_notify_memory_growth: function(h) {
  Sa = new Uint8Array(Ae.exports.memory.buffer);
} } };
class Ri {
  init() {
    return na || (na = typeof fetch < "u" ? fetch("data:application/wasm;base64," + tt).then((e) => e.arrayBuffer()).then((e) => WebAssembly.instantiate(e, oa)).then(this._init) : WebAssembly.instantiate(Buffer.from(tt, "base64"), oa).then(this._init), na);
  }
  _init(e) {
    Ae = e.instance, oa.env.emscripten_notify_memory_growth(0);
  }
  decode(e, a = 0) {
    if (!Ae) throw new Error("ZSTDDecoder: Await .init() before decoding.");
    const t = e.byteLength, A = Ae.exports.malloc(t);
    Sa.set(e, A), a = a || Number(Ae.exports.ZSTD_findDecompressedSize(A, t));
    const i = Ae.exports.malloc(a), s = Ae.exports.ZSTD_decompress(i, a, A, t), r = Sa.slice(i, i + s);
    return Ae.exports.free(A), Ae.exports.free(i), r;
  }
}
const tt = "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IAMNACAEQQNxBEADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAsMAgsgAkEDTQ0AIAIhBANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAAL8wICAn8BfgJAIAJFDQAgACACaiIDQX9qIAE6AAAgACABOgAAIAJBA0kNACADQX5qIAE6AAAgACABOgABIANBfWogAToAACAAIAE6AAIgAkEHSQ0AIANBfGogAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa0iBUIghiAFhCEFIAMgBGohAQNAIAEgBTcDGCABIAU3AxAgASAFNwMIIAEgBTcDACABQSBqIQEgAkFgaiICQR9LDQALCyAACy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAIajYCACADCy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAFajYCACADCx8AIAAgASACKAIEEAg2AgAgARAEGiAAIAJBCGo2AgQLCAAgAGdBH3MLugUBDX8jAEEQayIKJAACfyAEQQNNBEAgCkEANgIMIApBDGogAyAEEAsaIAAgASACIApBDGpBBBAVIgBBbCAAEAMbIAAgACAESxsMAQsgAEEAIAEoAgBBAXRBAmoQECENQVQgAygAACIGQQ9xIgBBCksNABogAiAAQQVqNgIAIAMgBGoiAkF8aiEMIAJBeWohDiACQXtqIRAgAEEGaiELQQQh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ASIDNgLE4AEgACgCvOABIQQgACABNgK84AEgACABIAJqNgK44AEgACABIAQgA2tqNgLA4AELpgEBAX8gACAAKALs4QEQFjYCyOABIABCADcD+OABIABCADcDuOABIABBwOABakIANwMAIABBqNAAaiIBQYyAgOAANgIAIABBADYCmOIBIABCADcDiOEBIABCAzcDgOEBIABBrNABakHgEikCADcCACAAQbTQAWpB6BIoAgA2AgAgACABNgIMIAAgAEGYIGo2AgggACAAQaAwajYCBCAAIABBEGo2AgALYQEBf0G4fyEDAkAgAUEDSQ0AIAIgABAhIgFBA3YiADYCCCACIAFBAXE2AgQgAiABQQF2QQNxIgM2AgACQCADQX9qIgFBAksNAAJAIAFBAWsOAgEAAgtBbA8LIAAhAwsgAwsMACAAIAEgAkEAEC4LiAQCA38CfiADEBYhBCAAQQBBKBAQIQAgBCACSwRAIAQPCyABRQRAQX8PCwJAAkAgA0EBRg0AIAEoAAAiBkGo6r5pRg0AQXYhAyAGQXBxQdDUtMIBRw0BQQghAyACQQhJDQEgAEEAQSgQECEAIAEoAAQhASAAQQE2AhQgACABrTcDAEEADwsgASACIAMQLyIDIAJLDQAgACADNgIYQXIhAyABIARqIgVBf2otAAAiAkEIcQ0AIAJBIHEiBkUEQEFwIQMgBS0AACIFQacBSw0BIAVBB3GtQgEgBUEDdkEKaq2GIgdCA4h+IAd8IQggBEEBaiEECyACQQZ2IQMgAkECdiEFAkAgAkEDcUF/aiICQQJLBEBBACECDAELAkACQAJAIAJBAWsOAgECAAsgASAEai0AACECIARBAWohBAwCCyABIARqLwAAIQIgBEECaiEEDAELIAEgBGooAAAhAiAEQQRqIQQLIAVBAXEhBQJ+AkACQAJAIANBf2oiA0ECTQRAIANBAWsOAgIDAQtCfyAGRQ0DGiABIARqMQAADAMLIAEgBGovAACtQoACfAwCCyABIARqKAAArQwBCyABIARqKQAACyEHIAAgBTYCICAAIAI2AhwgACAHNwMAQQAhAyAAQQA2AhQgACAHIAggBhsiBzcDCCAAIAdCgIAIIAdCgIAIVBs+AhALIAMLWwEBf0G4fyEDIAIQFiICIAFNBH8gACACakF/ai0AACIAQQNxQQJ0QaAeaigC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C0Egak8NAQsgByAHKQNoNwMQIAcgBykDYDcDCCAEIA0gB0EIaiAHQdwAaiAPIA4gESAQEB4hCwwBCyACIARqIQggBCAKEAcgAkERTwRAIARBEGohAgNAIAIgCkEQaiIKEAcgAkEQaiICIAhJDQALCyAIIAlrIQIgByATNgJcIAkgCCAOa0sEQCAJIAggEWtLBEBBbCELDAILIBAgAiAOayICaiIKIANqIBBNBEAgCCAKIAMQDxoMAgsgCCAKQQAgAmsQDyEIIAcgAiADaiIDNgJkIAggAmshCCAOIQILIAlBEE8EQCADIAhqIQMDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALDAELAkAgCUEHTQRAIAggAi0AADoAACAIIAItAAE6AAEgCCACLQACOgACIAggAi0AAzoAAyAIQQRqIAIgCUECdCIDQcAeaigCAGoiAhAXIAIgA0HgHmooAgBrIQIgBygCZCEDDAELIAggAhAMCyADQQlJDQAgAyAIaiEDIAhBCGoiCCACQQhqIgJrQQ9MBEADQCAIIAIQDCACQQhqIQIgCEEIaiIIIANJDQAMAgALAAsDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALCyAHQRhqEAQaIAsgDCALEAMiAhshDCAEIAQgC2ogAhshBCAFQX9qIgUNAAsgDBADDQFBbCEMIAdBGGoQBEECSQ0BQQAhCANAIAhBA0cEQCAAIAhBAnQiAmpBrNABaiACIAdqKAJENgIAIAhBAWohCAwBCwsgBygCXCEIC0G6fyEMIA8gCGsiACANIARrSw0AIAQEfyAEIAggABALIABqBUEACyABayEMCyAHQfAAaiQAIAwLkRcCFn8FfiMAQdABayIHJAAgByAAKALw4QEiCDYCvAEgASACaiESIAggACgCgOIBaiETAkACQCAFRQRAIAEhAwwBCyAAKALE4AEhESAAKALA4AEhFSAAKAK84AEhDyAAQQE2AozhAUEAIQgDQCAIQQNHBEAgByAIQQJ0IgJqIAAgAmpBrNABaigCADYCVCAIQQFqIQgMAQsLIAcgETYCZCAHIA82AmAgByABIA9rNgJoQWwhECAHQShqIAMgBBAGEAMNASAFQQQgBUEESBshFyAHQTxqIAdBKGogACgCABATIAdBxABqIAdBKGogACgCCBATIAdBzABqIAdB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IAdB0AFqJAAgEAslACAAQgA3AgAgAEEAOwEIIABBADoACyAAIAE2AgwgACACOgAKC7QFAQN/IwBBMGsiBCQAIABB/wFqIgVBfWohBgJAIAMvAQIEQCAEQRhqIAEgAhAGIgIQAw0BIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahASOgAAIAMgBEEIaiAEQRhqEBI6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0FIAEgBEEQaiAEQRhqEBI6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBSABIARBCGogBEEYahASOgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEjoAACABIAJqIABrIQIMAwsgAyAEQRBqIARBGGoQEjoAAiADIARBCGogBEEYahASOgADIANBBGohAwwAAAsACyAEQRhqIAEgAhAGIgIQAw0AIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahAROgAAIAMgBEEIaiAEQRhqEBE6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0EIAEgBEEQaiAEQRhqEBE6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBCABIARBCGogBEEYahAROgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEToAACABIAJqIABrIQIMAgsgAyAEQRBqIARBGGoQEToAAiADIARBCGogBEEYahAROgADIANBBGohAwwAAAsACyAEQTBqJAAgAgtpAQF/An8CQAJAIAJBB00NACABKAAAQbfIwuF+Rw0AIAAgASgABDYCmOIBQWIgAEEQaiABIAIQPiIDEAMNAhogAEKBgICAEDcDiOEBIAAgASADaiACIANrECoMAQsgACABIAIQKgtBAAsLrQMBBn8jAEGAAWsiAyQAQWIhCAJAIAJBCUkNACAAQZjQAGogAUEIaiIEIAJBeGogAEGY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wOABCwutAgIEfwF+IwBBQGoiBCQAAkACQCACQQhJDQAgASgAAEFwcUHQ1LTCAUcNACABIAIQIiEBIABCADcDCCAAQQA2AgQgACABNgIADAELIARBGGogASACEC0iAxADBEAgACADEBoMAQsgAwRAIABBuH8QGgwBCyACIAQoAjAiA2shAiABIANqIQMDQAJAIAAgAyACIARBCGoQLCIFEAMEfyAFBSACIAVBA2oiBU8NAUG4fwsQGgwCCyAGQQFqIQYgAiAFayECIAMgBWohAyAEKAIMRQ0ACyAEKAI4BEAgAkEDTQRAIABBuH8QGgwCCyADQQRqIQMLIAQoAighAiAEKQMYIQcgAEEANgIEIAAgAyABazYCACAAIAIgBmytIAcgB0J/URs3AwgLIARBQGskAAslAQF/IwBBEGsiAiQAIAIgACABEFEgAigCACEAIAJBEGokACAAC30BBH8jAEGQBGsiBCQAIARB/wE2AggCQCAEQRBqIARBCGogBEEMaiABIAIQFSIGEAMEQCAGIQUMAQtBVCEFIAQoAgwiB0EGSw0AIAMgBEEQaiAEKAIIIAcQQSIFEAMNACAAIAEgBmogAiAGayADEDwhBQsgBEGQBGokACAFC4cBAgJ/An5BABAWIQMCQANAIAEgA08EQAJAIAAoAABBcHFB0NS0wgFGBEAgACABECIiAhADRQ0BQn4PCyAAIAEQVSIEQn1WDQMgBCAFfCIFIARUIQJCfiEEIAINAyAAIAEQUiICEAMNAwsgASACayEBIAAgAmohAAwBCwtCfiAFIAEbIQQLIAQLPwIBfwF+IwBBMGsiAiQAAn5CfiACQQhqIAAgARAtDQAaQgAgAigCHEEBRg0AGiACKQMICyEDIAJBMGokACADC40BAQJ/IwBBMGsiASQAAkAgAEUNACAAKAKI4gENACABIABB/OEBaigCADYCKCABIAApAvThATcDICAAEDAgACgCqOIBIQIgASABKAIoNgIYIAEgASkDIDcDECACIAFBEGoQGyAAQQA2AqjiASABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALKgECfyMAQRBrIgAkACAAQQA2AgggAEIANwMAIAAQWCEBIABBEGokACABC4cBAQN/IwBBEGsiAiQAAkAgACgCAEUgACgCBEVzDQAgAiAAKAIINgIIIAIgACkCADcDAAJ/IAIoAgAiAQRAIAIoAghBqOMJIAERBQAMAQtBqOMJECgLIgFFDQAgASAAKQIANwL04QEgAUH84QFqIAAoAgg2AgAgARBZIAEhAwsgAkEQaiQAIAMLywEBAn8jAEEgayIBJAAgAEGBgIDAADYCtOIBIABBADYCiOIBIABBADYC7OEBIABCADcDkOIBIABBADYCpOMJIABBADYC3OIBIABCADcCzOIBIABBADYCvOIBIABBADYCxOABIABCADcCnOIBIABBpOIBakIANwIAIABBrOIBakEANgIAIAFCADcCECABQgA3AhggASABKQMYNwMIIAEgASkDEDcDACABKAIIQQh2QQFxIQIgAEEANgLg4gEgACACNgKM4gEgAUEgaiQAC3YBA38jAEEwayIBJAAgAARAIAEgAEHE0AFqIgIoAgA2AiggASAAKQK80AE3AyAgACgCACEDIAEgAigCADYCGCABIAApArzQATcDECADIAFBEGoQGyABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALzAEBAX8gACABKAK00AE2ApjiASAAIAEoAgQiAjYCwOABIAAgAjYCvOABIAAgAiABKAIIaiICNgK44AEgACACNgLE4AEgASgCuNABBEAgAEKBgICAEDcDiOEBIAAgAUGk0ABqNgIMIAAgAUGUIGo2AgggACABQZwwajYCBCAAIAFBDGo2AgAgAEGs0AFqIAFBqNABaigCADYCACAAQbDQAWogAUGs0AFqKAIANgIAIABBtNABaiABQbDQAWooAgA2AgAPCyAAQgA3A4jhAQs7ACACRQRAQbp/DwsgBEUEQEFsDwsgAiAEEGAEQCAAIAEgAiADIAQgBRBhDwsgACABIAIgAyAEIAUQZQtGAQF/IwBBEGsiBSQAIAVBCGogBBAOAn8gBS0ACQRAIAAgASACIAMgBBAyDAELIAAgASACIAMgBBA0CyEAIAVBEGokACAACzQAIAAgAyAEIAUQNiIFEAMEQCAFDwsgBSAESQR/IAEgAiADIAVqIAQgBWsgABA1BUG4fwsLRgEBfyMAQRBrIgUkACAFQQhqIAQQDgJ/IAUtAAkEQCAAIAEgAiADIAQQYgwBCyAAIAEgAiADIAQQNQshACAFQRBqJAAgAAtZAQF/QQ8hAiABIABJBEAgAUEE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", ca = /* @__PURE__ */ new WeakMap();
let ba, da = 0;
class L extends Fa {
  constructor(e) {
    super(e), this.transcoderPath = "", this.transcoderBinary = null, this.transcoderPending = null, this.workerPool = new vi(), this.workerSourceURL = "", this.workerConfig = null, typeof MSC_TRANSCODER < "u" && console.warn('THREE.KTX2Loader: Please update to latest "basis_transcoder". "msc_basis_transcoder" is no longer supported in three.js r125+.');
  }
  setTranscoderPath(e) {
    return this.transcoderPath = e, this;
  }
  setWorkerLimit(e) {
    return this.workerPool.setWorkerLimit(e), this;
  }
  async detectSupportAsync(e) {
    return this.workerConfig = { astcSupported: await e.hasFeatureAsync("texture-compression-astc"), astcHDRSupported: !1, etc1Supported: await e.hasFeatureAsync("texture-compression-etc1"), etc2Supported: await e.hasFeatureAsync("texture-compression-etc2"), dxtSupported: await e.hasFeatureAsync("texture-compression-bc"), bptcSupported: await e.hasFeatureAsync("texture-compression-bptc"), pvrtcSupported: await e.hasFeatureAsync("texture-compression-pvrtc") }, this;
  }
  detectSupport(e) {
    return e.isWebGPURenderer === !0 ? this.workerConfig = { astcSupported: e.hasFeature("texture-compression-astc"), astcHDRSupported: !1, etc1Supported: e.hasFeature("texture-compression-etc1"), etc2Supported: e.hasFeature("texture-compression-etc2"), dxtSupported: e.hasFeature("texture-compression-bc"), bptcSupported: e.hasFeature("texture-compression-bptc"), pvrtcSupported: e.hasFeature("texture-compression-pvrtc") } : this.workerConfig = { astcSupported: e.extensions.has("WEBGL_compressed_texture_astc"), astcHDRSupported: e.extensions.has("WEBGL_compressed_texture_astc") && e.extensions.get("WEBGL_compressed_texture_astc").getSupportedProfiles().includes("hdr"), etc1Supported: e.extensions.has("WEBGL_compressed_texture_etc1"), etc2Supported: e.extensions.has("WEBGL_compressed_texture_etc"), dxtSupported: e.extensions.has("WEBGL_compressed_texture_s3tc"), bptcSupported: e.extensions.has("EXT_texture_compression_bptc"), pvrtcSupported: e.extensions.has("WEBGL_compressed_texture_pvrtc") || e.extensions.has("WEBKIT_WEBGL_compressed_texture_pvrtc") }, this;
  }
  init() {
    if (!this.transcoderPending) {
      const e = new Be(this.manager);
      e.setPath(this.transcoderPath), e.setWithCredentials(this.withCredentials);
      const a = e.loadAsync("basis_transcoder.js"), t = new Be(this.manager);
      t.setPath(this.transcoderPath), t.setResponseType("arraybuffer"), t.setWithCredentials(this.withCredentials);
      const A = t.loadAsync("basis_transcoder.wasm");
      this.transcoderPending = Promise.all([a, A]).then(([i, s]) => {
        const r = L.BasisWorker.toString(), n = ["/* constants */", "let _EngineFormat = " + JSON.stringify(L.EngineFormat), "let _EngineType = " + JSON.stringify(L.EngineType), "let _TranscoderFormat = " + JSON.stringify(L.TranscoderFormat), "let _BasisFormat = " + JSON.stringify(L.BasisFormat), "/* basis_transcoder.js */", i, "/* worker */", r.substring(r.indexOf("{") + 1, r.lastIndexOf("}"))].join(`
`);
        this.workerSourceURL = URL.createObjectURL(new Blob([n])), this.transcoderBinary = s, this.workerPool.setWorkerCreator(() => {
          const o = new Worker(this.workerSourceURL), c = this.transcoderBinary.slice(0);
          return o.postMessage({ type: "init", config: this.workerConfig, transcoderBinary: c }, [c]), o;
        });
      }), da > 0 && console.warn("THREE.KTX2Loader: Multiple active KTX2 loaders may cause performance issues. Use a single KTX2Loader instance, or call .dispose() on old instances."), da++;
    }
    return this.transcoderPending;
  }
  load(e, a, t, A) {
    if (this.workerConfig === null) throw new Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
    const i = new Be(this.manager);
    i.setResponseType("arraybuffer"), i.setWithCredentials(this.withCredentials), i.load(e, (s) => {
      this.parse(s, a, A);
    }, t, A);
  }
  parse(e, a, t) {
    if (this.workerConfig === null) throw new Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
    if (ca.has(e))
      return ca.get(e).promise.then(a).catch(t);
    this._createTexture(e).then((A) => a ? a(A) : null).catch(t);
  }
  _createTextureFrom(e, a) {
    const { type: t, error: A, data: { faces: i, width: s, height: r, format: n, type: o, dfdFlags: c } } = e;
    if (t === "error") return Promise.reject(A);
    let b;
    if (a.faceCount === 6) b = new DA(i, n, o);
    else {
      const g = i[0].mipmaps;
      b = a.layerCount > 1 ? new vA(g, s, r, a.layerCount, n, o) : new Oa(g, s, r, n, o);
    }
    return b.minFilter = i[0].mipmaps.length === 1 ? me : Xe, b.magFilter = me, b.generateMipmaps = !1, b.needsUpdate = !0, b.colorSpace = At(a), b.premultiplyAlpha = !!(1 & c), b;
  }
  async _createTexture(e, a = {}) {
    const t = function(r) {
      const n = new Uint8Array(r.buffer, r.byteOffset, G.length);
      if (n[0] !== G[0] || n[1] !== G[1] || n[2] !== G[2] || n[3] !== G[3] || n[4] !== G[4] || n[5] !== G[5] || n[6] !== G[6] || n[7] !== G[7] || n[8] !== G[8] || n[9] !== G[9] || n[10] !== G[10] || n[11] !== G[11]) throw new Error("Missing KTX 2.0 identifier.");
      const o = new Fi(), c = 17 * Uint32Array.BYTES_PER_ELEMENT, b = new Fe(r, G.length, c, !0);
      o.vkFormat = b._nextUint32(), o.typeSize = b._nextUint32(), o.pixelWidth = b._nextUint32(), o.pixelHeight = b._nextUint32(), o.pixelDepth = b._nextUint32(), o.layerCount = b._nextUint32(), o.faceCount = b._nextUint32();
      const g = b._nextUint32();
      o.supercompressionScheme = b._nextUint32();
      const l = b._nextUint32(), d = b._nextUint32(), f = b._nextUint32(), I = b._nextUint32(), m = b._nextUint64(), u = b._nextUint64(), C = new Fe(r, G.length + c, 3 * g * 8, !0);
      for (let F = 0; F < g; F++) o.levels.push({ levelData: new Uint8Array(r.buffer, r.byteOffset + C._nextUint64(), C._nextUint64()), uncompressedByteLength: C._nextUint64() });
      const B = new Fe(r, l, d, !0), w = { vendorId: B._skip(4)._nextUint16(), descriptorType: B._nextUint16(), versionNumber: B._nextUint16(), descriptorBlockSize: B._nextUint16(), colorModel: B._nextUint8(), colorPrimaries: B._nextUint8(), transferFunction: B._nextUint8(), flags: B._nextUint8(), texelBlockDimension: [B._nextUint8(), B._nextUint8(), B._nextUint8(), B._nextUint8()], bytesPlane: [B._nextUint8(), B._nextUint8(), B._nextUint8(), B._nextUint8(), B._nextUint8(), B._nextUint8(), B._nextUint8(), B._nextUint8()], samples: [] }, k = (w.descriptorBlockSize / 4 - 6) / 4;
      for (let F = 0; F < k; F++) {
        const U = { bitOffset: B._nextUint16(), bitLength: B._nextUint8(), channelType: B._nextUint8(), samplePosition: [B._nextUint8(), B._nextUint8(), B._nextUint8(), B._nextUint8()], sampleLower: -1 / 0, sampleUpper: 1 / 0 };
        64 & U.channelType ? (U.sampleLower = B._nextInt32(), U.sampleUpper = B._nextInt32()) : (U.sampleLower = B._nextUint32(), U.sampleUpper = B._nextUint32()), w.samples[F] = U;
      }
      o.dataFormatDescriptor.length = 0, o.dataFormatDescriptor.push(w);
      const y = new Fe(r, f, I, !0);
      for (; y._offset < I; ) {
        const F = y._nextUint32(), U = y._scan(F), P = at(U);
        if (o.keyValue[P] = y._nextUint8Array(F - U.byteLength - 1), P.match(/^ktx/i)) {
          const V = at(o.keyValue[P]);
          o.keyValue[P] = V.substring(0, V.lastIndexOf("\0"));
        }
        y._skip(F % 4 ? 4 - F % 4 : 0);
      }
      if (u <= 0) return o;
      const p = new Fe(r, m, u, !0), Q = p._nextUint16(), x = p._nextUint16(), j = p._nextUint32(), M = p._nextUint32(), O = p._nextUint32(), $e = p._nextUint32(), je = [];
      for (let F = 0; F < g; F++) je.push({ imageFlags: p._nextUint32(), rgbSliceByteOffset: p._nextUint32(), rgbSliceByteLength: p._nextUint32(), alphaSliceByteOffset: p._nextUint32(), alphaSliceByteLength: p._nextUint32() });
      const Oe = m + p._offset, Se = Oe + j, De = Se + M, ve = De + O, Je = new Uint8Array(r.buffer, r.byteOffset + Oe, j), Pe = new Uint8Array(r.buffer, r.byteOffset + Se, M), z = new Uint8Array(r.buffer, r.byteOffset + De, O), Ce = new Uint8Array(r.buffer, r.byteOffset + ve, $e);
      return o.globalData = { endpointCount: Q, selectorCount: x, imageDescs: je, endpointsData: Je, selectorsData: Pe, tablesData: z, extendedData: Ce }, o;
    }(new Uint8Array(e)), A = t.vkFormat === Ra && t.dataFormatDescriptor[0].colorModel === 167;
    if (!(t.vkFormat === 0 || A && !this.workerConfig.astcHDRSupported)) return async function(r) {
      const { vkFormat: n } = r;
      if (ha[n] === void 0) throw new Error("THREE.KTX2Loader: Unsupported vkFormat.");
      let o;
      r.supercompressionScheme === 2 && (ba || (ba = new Promise(async (g) => {
        const l = new Ri();
        await l.init(), g(l);
      })), o = await ba);
      const c = [];
      for (let g = 0; g < r.levels.length; g++) {
        const l = Math.max(1, r.pixelWidth >> g), d = Math.max(1, r.pixelHeight >> g), f = r.pixelDepth ? Math.max(1, r.pixelDepth >> g) : 0, I = r.levels[g];
        let m, u;
        if (r.supercompressionScheme === 0) m = I.levelData;
        else {
          if (r.supercompressionScheme !== 2) throw new Error("THREE.KTX2Loader: Unsupported supercompressionScheme.");
          m = o.decode(I.levelData, I.uncompressedByteLength);
        }
        u = la[n] === R ? new Float32Array(m.buffer, m.byteOffset, m.byteLength / Float32Array.BYTES_PER_ELEMENT) : la[n] === we ? new Uint16Array(m.buffer, m.byteOffset, m.byteLength / Uint16Array.BYTES_PER_ELEMENT) : m, c.push({ data: u, width: l, height: d, depth: f });
      }
      let b;
      if (Mi.has(ha[n])) b = r.pixelDepth === 0 ? new Ge(c[0].data, r.pixelWidth, r.pixelHeight) : new RA(c[0].data, r.pixelWidth, r.pixelHeight, r.pixelDepth);
      else {
        if (r.pixelDepth > 0) throw new Error("THREE.KTX2Loader: Unsupported pixelDepth.");
        b = new Oa(c, r.pixelWidth, r.pixelHeight), b.minFilter = c.length === 1 ? me : Xe, b.magFilter = me;
      }
      return b.mipmaps = c, b.type = la[n], b.format = ha[n], b.colorSpace = At(r), b.needsUpdate = !0, Promise.resolve(b);
    }(t);
    const i = a, s = this.init().then(() => this.workerPool.postMessage({ type: "transcode", buffer: e, taskConfig: i }, [e])).then((r) => this._createTextureFrom(r.data, t));
    return ca.set(e, { promise: s }), s;
  }
  dispose() {
    return this.workerPool.dispose(), this.workerSourceURL && URL.revokeObjectURL(this.workerSourceURL), da--, this;
  }
}
L.BasisFormat = { ETC1S: 0, UASTC: 1, UASTC_HDR: 2 }, L.TranscoderFormat = { ETC1: 0, ETC2: 1, BC1: 2, BC3: 3, BC4: 4, BC5: 5, BC7_M6_OPAQUE_ONLY: 6, BC7_M5: 7, PVRTC1_4_RGB: 8, PVRTC1_4_RGBA: 9, ASTC_4x4: 10, ATC_RGB: 11, ATC_RGBA_INTERPOLATED_ALPHA: 12, RGBA32: 13, RGB565: 14, BGR565: 15, RGBA4444: 16, BC6H: 22, RGB_HALF: 24, RGBA_HALF: 25 }, L.EngineFormat = { RGBAFormat: $, RGBA_ASTC_4x4_Format: wt, RGB_BPTC_UNSIGNED_Format: JA, RGBA_BPTC_Format: OA, RGBA_ETC2_EAC_Format: LA, RGBA_PVRTC_4BPPV1_Format: NA, RGBA_S3TC_DXT5_Format: HA, RGB_ETC1_Format: GA, RGB_ETC2_Format: UA, RGB_PVRTC_4BPPV1_Format: TA, RGBA_S3TC_DXT1_Format: MA }, L.EngineType = { UnsignedByteType: W, HalfFloatType: we, FloatType: R }, L.BasisWorker = function() {
  let h, e, a;
  const t = _EngineFormat, A = _EngineType, i = _TranscoderFormat, s = _BasisFormat;
  self.addEventListener("message", function(b) {
    const g = b.data;
    switch (g.type) {
      case "init":
        h = g.config, l = g.transcoderBinary, e = new Promise((d) => {
          a = { wasmBinary: l, onRuntimeInitialized: d }, BASIS(a);
        }).then(() => {
          a.initializeBasis(), a.KTX2File === void 0 && console.warn("THREE.KTX2Loader: Please update Basis Universal transcoder.");
        });
        break;
      case "transcode":
        e.then(() => {
          try {
            const { faces: d, buffers: f, width: I, height: m, hasAlpha: u, format: C, type: B, dfdFlags: w } = function(k) {
              const y = new a.KTX2File(new Uint8Array(k));
              function p() {
                y.close(), y.delete();
              }
              if (!y.isValid()) throw p(), new Error("THREE.KTX2Loader:	Invalid or unsupported .ktx2 file");
              let Q;
              if (y.isUASTC()) Q = s.UASTC;
              else if (y.isETC1S()) Q = s.ETC1S;
              else {
                if (!y.isHDR()) throw new Error("THREE.KTX2Loader: Unknown Basis encoding");
                Q = s.UASTC_HDR;
              }
              const x = y.getWidth(), j = y.getHeight(), M = y.getLayers() || 1, O = y.getLevels(), $e = y.getFaces(), je = y.getHasAlpha(), Oe = y.getDFDFlags(), { transcoderFormat: Se, engineFormat: De, engineType: ve } = function(z, Ce, F, U) {
                const P = n[z];
                for (let V = 0; V < P.length; V++) {
                  const q = P[V];
                  if (!(q.if && !h[q.if]) && q.basisFormat.includes(z) && !(U && q.transcoderFormat.length < 2) && !(q.needsPowerOfTwo && (!o(Ce) || !o(F))))
                    return { transcoderFormat: q.transcoderFormat[U ? 1 : 0], engineFormat: q.engineFormat[U ? 1 : 0], engineType: q.engineType[0] };
                }
                throw new Error("THREE.KTX2Loader: Failed to identify transcoding target.");
              }(Q, x, j, je);
              if (!x || !j || !O) throw p(), new Error("THREE.KTX2Loader:	Invalid texture");
              if (!y.startTranscoding()) throw p(), new Error("THREE.KTX2Loader: .startTranscoding failed");
              const Je = [], Pe = [];
              for (let z = 0; z < $e; z++) {
                const Ce = [];
                for (let F = 0; F < O; F++) {
                  const U = [];
                  let P, V;
                  for (let pe = 0; pe < M; pe++) {
                    const Ee = y.getImageLevelInfo(F, pe, z);
                    z !== 0 || F !== 0 || pe !== 0 || Ee.origWidth % 4 == 0 && Ee.origHeight % 4 == 0 || console.warn("THREE.KTX2Loader: ETC1S and UASTC textures should use multiple-of-four dimensions."), O > 1 ? (P = Ee.origWidth, V = Ee.origHeight) : (P = Ee.width, V = Ee.height);
                    let Qe = new Uint8Array(y.getImageTranscodedSizeInBytes(F, pe, 0, Se));
                    const Xt = y.transcodeImage(Qe, F, pe, z, Se, 0, -1, -1);
                    if (ve === A.HalfFloatType && (Qe = new Uint16Array(Qe.buffer, Qe.byteOffset, Qe.byteLength / Uint16Array.BYTES_PER_ELEMENT)), !Xt) throw p(), new Error("THREE.KTX2Loader: .transcodeImage failed.");
                    U.push(Qe);
                  }
                  const q = c(U);
                  Ce.push({ data: q, width: P, height: V }), Pe.push(q.buffer);
                }
                Je.push({ mipmaps: Ce, width: x, height: j, format: De, type: ve });
              }
              return p(), { faces: Je, buffers: Pe, width: x, height: j, hasAlpha: je, dfdFlags: Oe, format: De, type: ve };
            }(g.buffer);
            self.postMessage({ type: "transcode", id: g.id, data: { faces: d, width: I, height: m, hasAlpha: u, format: C, type: B, dfdFlags: w } }, f);
          } catch (d) {
            console.error(d), self.postMessage({ type: "error", id: g.id, error: d.message });
          }
        });
    }
    var l;
  });
  const r = [{ if: "astcSupported", basisFormat: [s.UASTC], transcoderFormat: [i.ASTC_4x4, i.ASTC_4x4], engineFormat: [t.RGBA_ASTC_4x4_Format, t.RGBA_ASTC_4x4_Format], engineType: [A.UnsignedByteType], priorityETC1S: 1 / 0, priorityUASTC: 1, needsPowerOfTwo: !1 }, { if: "bptcSupported", basisFormat: [s.ETC1S, s.UASTC], transcoderFormat: [i.BC7_M5, i.BC7_M5], engineFormat: [t.RGBA_BPTC_Format, t.RGBA_BPTC_Format], engineType: [A.UnsignedByteType], priorityETC1S: 3, priorityUASTC: 2, needsPowerOfTwo: !1 }, { if: "dxtSupported", basisFormat: [s.ETC1S, s.UASTC], transcoderFormat: [i.BC1, i.BC3], engineFormat: [t.RGBA_S3TC_DXT1_Format, t.RGBA_S3TC_DXT5_Format], engineType: [A.UnsignedByteType], priorityETC1S: 4, priorityUASTC: 5, needsPowerOfTwo: !1 }, { if: "etc2Supported", basisFormat: [s.ETC1S, s.UASTC], transcoderFormat: [i.ETC1, i.ETC2], engineFormat: [t.RGB_ETC2_Format, t.RGBA_ETC2_EAC_Format], engineType: [A.UnsignedByteType], priorityETC1S: 1, priorityUASTC: 3, needsPowerOfTwo: !1 }, { if: "etc1Supported", basisFormat: [s.ETC1S, s.UASTC], transcoderFormat: [i.ETC1], engineFormat: [t.RGB_ETC1_Format], engineType: [A.UnsignedByteType], priorityETC1S: 2, priorityUASTC: 4, needsPowerOfTwo: !1 }, { if: "pvrtcSupported", basisFormat: [s.ETC1S, s.UASTC], transcoderFormat: [i.PVRTC1_4_RGB, i.PVRTC1_4_RGBA], engineFormat: [t.RGB_PVRTC_4BPPV1_Format, t.RGBA_PVRTC_4BPPV1_Format], engineType: [A.UnsignedByteType], priorityETC1S: 5, priorityUASTC: 6, needsPowerOfTwo: !0 }, { if: "bptcSupported", basisFormat: [s.UASTC_HDR], transcoderFormat: [i.BC6H], engineFormat: [t.RGB_BPTC_UNSIGNED_Format], engineType: [A.HalfFloatType], priorityHDR: 1, needsPowerOfTwo: !1 }, { basisFormat: [s.ETC1S, s.UASTC], transcoderFormat: [i.RGBA32, i.RGBA32], engineFormat: [t.RGBAFormat, t.RGBAFormat], engineType: [A.UnsignedByteType, A.UnsignedByteType], priorityETC1S: 100, priorityUASTC: 100, needsPowerOfTwo: !1 }, { basisFormat: [s.UASTC_HDR], transcoderFormat: [i.RGBA_HALF], engineFormat: [t.RGBAFormat], engineType: [A.HalfFloatType], priorityHDR: 100, needsPowerOfTwo: !1 }], n = { [s.ETC1S]: r.filter((b) => b.basisFormat.includes(s.ETC1S)).sort((b, g) => b.priorityUASTC - g.priorityUASTC), [s.UASTC]: r.filter((b) => b.basisFormat.includes(s.UASTC)).sort((b, g) => b.priorityUASTC - g.priorityUASTC), [s.UASTC_HDR]: r.filter((b) => b.basisFormat.includes(s.UASTC_HDR)).sort((b, g) => b.priorityHDR - g.priorityHDR) };
  function o(b) {
    return b <= 2 || !(b & b - 1) && b !== 0;
  }
  function c(b) {
    if (b.length === 1) return b[0];
    let g = 0;
    for (let f = 0; f < b.length; f++)
      g += b[f].byteLength;
    const l = new Uint8Array(g);
    let d = 0;
    for (let f = 0; f < b.length; f++) {
      const I = b[f];
      l.set(I, d), d += I.byteLength;
    }
    return l;
  }
};
const Mi = /* @__PURE__ */ new Set([$, Ue, Te]), ha = { [_t]: $, [Jt]: $, [Ht]: $, [Nt]: $, [qt]: Ue, [Ot]: Ue, [Ut]: Ue, [Gt]: Ue, [Pt]: Te, [Lt]: Te, [Tt]: Te, [Mt]: Te, [Ra]: wt, [zt]: Ja, [Kt]: Ja }, la = { [_t]: R, [Jt]: we, [Ht]: W, [Nt]: W, [qt]: R, [Ot]: we, [Ut]: W, [Gt]: W, [Pt]: R, [Lt]: we, [Tt]: W, [Mt]: W, [Ra]: we, [zt]: W, [Kt]: W };
function At(h) {
  const e = h.dataFormatDescriptor[0];
  return e.colorPrimaries === 1 ? e.transferFunction === 2 ? se : K : e.colorPrimaries === 10 ? e.transferFunction === 2 ? "display-p3" : "display-p3-linear" : (e.colorPrimaries === 0 || console.warn(`THREE.KTX2Loader: Unsupported color primaries, "${e.colorPrimaries}"`), FA);
}
async function it(h) {
  const e = h.split("?")[0].split(".").pop(), a = await fetch(h);
  if (!a.ok) throw new Error(`Failed to fetch ${h}: ${a.statusText}`);
  if (e === "json") {
    const t = await a.json();
    return handleJSONSubtree(t, st(h));
  }
  if (e === "subtree")
    return async function(t, A) {
      const i = new DataView(t), s = i.getBigUint64(8, !0), r = i.getBigUint64(16, !0), n = 24, o = n + Number(s), c = o + (8 - o % 8) % 8, b = c + Number(r), g = t.slice(n, o), l = new TextDecoder().decode(g).trim(), d = JSON.parse(l);
      if (!d.buffers) throw new Error("subtree has no buffers");
      const f = d.buffers.map(async (m) => {
        if (m.uri) {
          const u = new URL(m.uri, A).href, C = await fetch(u);
          if (!C.ok) throw new Error(`Failed to fetch binary file ${u}: ${C.statusText}`);
          return new Uint8Array(await C.arrayBuffer());
        }
        return new Uint8Array(t.slice(c, b));
      }), I = await Promise.all(f);
      return /* @__PURE__ */ function(m, u) {
        function C(p, Q) {
          if (!p) throw new Error("incomplete json subtree");
          if (p.constant) {
            if (p.constant == 0) return !1;
            if (p.constant == 1) return !0;
          }
          if (p.bitstream == null) throw new Error('json subtree "tileAvailability" does not specify a bitstream');
          if (!m.bufferViews || !m.bufferViews[p.bitstream]) throw new Error('json subtree "bufferViews" does not specify a bitstream');
          const x = m.bufferViews[p.bitstream];
          return B(u[x.buffer], x.byteOffset, Q);
        }
        function B(p, Q, x) {
          const j = x % 8;
          return p[Q + Math.floor(x / 8)] >> j & !0;
        }
        function w(p) {
          let Q = 0;
          return Q = p.z == null ? ga(p.x, p.y, p.level) : ua(p.x, p.y, p.z, p.level), C(m.tileAvailability, Q);
        }
        function k(p) {
          let Q = 0;
          Q = p.z == null ? ga(p.x, p.y, p.level) : ua(p.x, p.y, p.z, p.level);
          const x = [];
          return m.contentAvailability.forEach((j) => {
            x.push(C(j, Q));
          }), x;
        }
        function y(p) {
          let Q = 0;
          return Q = p.z == null ? ga(p.x, p.y) : ua(p.x, p.y, p.z), C(m.childSubtreeAvailability, Q);
        }
        return { isTileAvailable: w, isContentAvailable: k, isChildSubtreeAvailable: y };
      }(d, I);
    }(await a.arrayBuffer(), st(h));
  throw new Error(`Unsupported file extension: ${e}`);
}
function st(h) {
  const e = h.split("?")[0];
  return e.substring(0, e.lastIndexOf("/") + 1);
}
function rt(h) {
  return h = 1431655765 & ((h = 858993459 & ((h = 252645135 & ((h = 16711935 & ((h &= 65535) ^ h << 8)) ^ h << 4)) ^ h << 2)) ^ h << 1);
}
function ga(h, e, a) {
  let t = 0;
  return a && (t = (Math.pow(4, a) - 1) / 3), t + (rt(h) | rt(e) << 1);
}
function fa(h) {
  return h = 153391689 & ((h = 51130563 & ((h = 50393103 & ((h = 4278190335 & ((h &= 1023) ^ h << 16)) ^ h << 8)) ^ h << 4)) ^ h << 2);
}
function ua(h, e, a, t) {
  let A = 0;
  return t && (A = (Math.pow(8, t) - 1) / 7), A + (fa(h) | fa(e) << 1 | fa(a) << 2);
}
const Re = /* @__PURE__ */ new Map();
async function Ma(h, e) {
  if (!h.root || !h.root.implicitTiling) return h;
  if (!h.root.content && !h.root.contents) throw new Error("implicit tiling requires a Template URI");
  let a = !0;
  h.root.implicitTiling.subdivisionScheme && (a = h.root.implicitTiling.subdivisionScheme.toUpperCase() === "QUADTREE");
  let t = "";
  h.root.implicitTiling.subtrees && (h.root.implicitTiling.subtrees.uri ? t = h.root.implicitTiling.subtrees.uri : h.root.implicitTiling.subtrees.url && (t = h.root.implicitTiling.subtrees.url));
  let A = [];
  h.root.content ? h.root.content.uri ? A.push(h.root.content.uri) : h.root.content.url && A.push(h.root.content.url) : h.root.contents && h.root.contents.forEach((l) => {
    l.uri ? A.push(l.uri) : l.url && A.push(l.url);
  });
  const i = function(l) {
    const d = l.split("?")[0];
    return d.substring(0, d.lastIndexOf("/") + 1);
  }(e);
  let s;
  a && (s = t.replace("{level}", 0).replace("{x}", 0).replace("{y}", 0)), a || (s = t.replace("{level}", 0).replace("{x}", 0).replace("{y}", 0).replace("{z}", 0));
  const r = { level: 0, x: 0, y: 0 }, n = { level: 0, x: 0, y: 0 };
  a || (r.z = 0, n.z = 0), Re.set(s, await it(i + s));
  const o = Re.get(s), c = [];
  o.isContentAvailable(n) && A.forEach((l) => {
    let d;
    a && (d = l.replace("{level}", r.level).replace("{x}", r.x).replace("{y}", r.y)), a || (d = l.replace("{level}", r.level).replace("{x}", r.x).replace("{y}", r.y).replace("{z}", r.z)), c.push({ uri: d });
  });
  const b = { geometricError: h.root.geometricError, boundingVolume: h.root.boundingVolume, refine: h.root.refine, globalAddress: r, localAddress: n, subtree: o, contents: c, getChildren: async () => g(b) };
  return { root: b };
  async function g(l) {
    const d = [];
    if (l.localAddress.level == h.root.implicitTiling.availableLevels - 1) return d;
    if ((l.localAddress.level + 1) % h.root.implicitTiling.subtreeLevels == 0) {
      const f = _e(l.localAddress), I = _e(l.globalAddress), m = nt(a, h.root.boundingVolume, I);
      for (let u = 0; u < f.length; u++) {
        const C = f[u], B = I[u];
        l.subtree.isChildSubtreeAvailable(C) && (a && t.replace("{level}", B.level).replace("{x}", B.x).replace("{y}", B.y), a || t.replace("{level}", B.level).replace("{x}", B.x).replace("{y}", B.y).replace("{z}", B.z)), Re.has(s) || Re.set(s, await it(i + s));
        const w = Re.get(s), k = { level: 0, x: 0, y: 0 };
        a || (k.z = 0);
        const y = [];
        w.isContentAvailable(k) && A.forEach((Q) => {
          let x;
          a && (x = Q.replace("{level}", B.level).replace("{x}", B.x).replace("{y}", B.y)), a || (x = Q.replace("{level}", B.level).replace("{x}", B.x).replace("{y}", B.y).replace("{z}", B.z)), y.push({ uri: x });
        });
        const p = { geometricError: l.geometricError / 2, boundingVolume: m[u], refine: h.root.refine, globalAddress: B, localAddress: k, subtree: w, contents: y, getChildren: async () => g(p) };
        d.push(p);
      }
    } else {
      const f = _e(l.localAddress), I = _e(l.globalAddress), m = nt(a, h.root.boundingVolume, I);
      for (let u = 0; u < f.length; u++) {
        const C = f[u], B = I[u];
        if (!l.subtree.isTileAvailable(C)) continue;
        const w = [], k = l.subtree.isContentAvailable(C);
        for (let p = 0; p < A.length; p++) {
          if (!k[p]) continue;
          const Q = A[p];
          let x;
          a && (x = Q.replace("{level}", B.level).replace("{x}", B.x).replace("{y}", B.y)), a || (x = Q.replace("{level}", B.level).replace("{x}", B.x).replace("{y}", B.y).replace("{z}", B.z)), w.push({ uri: x });
        }
        const y = { geometricError: l.geometricError / 2, boundingVolume: m[u], refine: h.root.refine, globalAddress: B, localAddress: C, subtree: l.subtree, contents: w, getChildren: async () => g(y) };
        d.push(y);
      }
    }
    return d.length > 0 ? d : void 0;
  }
}
function _e(h) {
  const { level: e, x: a, y: t, z: A } = h, i = e + 1;
  let s = [];
  return s = A === void 0 ? [{ level: i, x: 2 * a, y: 2 * t }, { level: i, x: 2 * a + 1, y: 2 * t }, { level: i, x: 2 * a, y: 2 * t + 1 }, { level: i, x: 2 * a + 1, y: 2 * t + 1 }] : [{ level: i, x: 2 * a, y: 2 * t, z: 2 * A }, { level: i, x: 2 * a + 1, y: 2 * t, z: 2 * A }, { level: i, x: 2 * a, y: 2 * t + 1, z: 2 * A }, { level: i, x: 2 * a + 1, y: 2 * t + 1, z: 2 * A }, { level: i, x: 2 * a, y: 2 * t, z: 2 * A + 1 }, { level: i, x: 2 * a + 1, y: 2 * t, z: 2 * A + 1 }, { level: i, x: 2 * a, y: 2 * t + 1, z: 2 * A + 1 }, { level: i, x: 2 * a + 1, y: 2 * t + 1, z: 2 * A + 1 }], s;
}
function nt(h, e, a) {
  const t = [];
  for (let A = 0; A < a.length; A++) t.push(Ti(h, e, a[A]));
  return t;
}
function Ti(h, e, a) {
  if (e.region) return function(t, A, i) {
    const [s, r, n, o, c, b] = A, g = (n - s) / 2 ** i.level, l = (o - r) / 2 ** i.level, d = t ? 0 : (b - c) / 2 ** i.level, f = s + g * i.x, I = r + l * i.y, m = f + g, u = I + l, C = t ? c : c + d * i.z, B = t ? b : C + d;
    return { region: [f, I, m, u, C, B] };
  }(h, e.region, a);
  if (e.box) return function(t, A, i) {
    const s = A.slice(0, 3), r = [A.slice(3, 6), A.slice(6, 9), A.slice(9, 12)], n = 1 / Math.pow(2, i.level), o = [n, n, t ? 1 : n], c = r.map((l, d) => l.map((f) => f * o[d])), b = [s[0] - r[0][0] - r[1][0] - r[2][0], s[1] - r[0][1] - r[1][1] - r[2][1], s[2] - r[0][2] - r[1][2] - r[2][2]];
    return { box: [b[0] + (2 * i.x + 1) * (c[0][0] + c[1][0] + c[2][0]), b[1] + (2 * i.y + 1) * (c[0][1] + c[1][1] + c[2][1]), t ? s[2] : b[2] + (2 * i.z + 1) * (c[0][2] + c[1][2] + c[2][2])].concat(...c) };
  }(h, e.box, a);
  throw new Error("Unsupported bounding volume type");
}
(function() {
  var h, e = new Uint8Array([32, 0, 65, 2, 1, 106, 34, 33, 3, 128, 11, 4, 13, 64, 6, 253, 10, 7, 15, 116, 127, 5, 8, 12, 40, 16, 19, 54, 20, 9, 27, 255, 113, 17, 42, 67, 24, 23, 146, 148, 18, 14, 22, 45, 70, 69, 56, 114, 101, 21, 25, 63, 75, 136, 108, 28, 118, 29, 73, 115]);
  if (typeof WebAssembly != "object") return { supported: !1 };
  function a(n) {
    if (!n) throw new Error("Assertion failed");
  }
  function t(n) {
    return new Uint8Array(n.buffer, n.byteOffset, n.byteLength);
  }
  function A(n, o, c, b, g) {
    var l = h.exports.sbrk, d = l(o), f = l(b * g), I = new Uint8Array(h.exports.memory.buffer);
    I.set(t(c), f);
    var m = n(d, o, f, b, g), u = new Uint8Array(m);
    return u.set(I.subarray(d, d + m)), l(d - l(0)), u;
  }
  function i(n) {
    for (var o = 0, c = 0; c < n.length; ++c)
      var b = n[c];
    return o;
  }
  function s(n, o) {
    if (a(o == 2 || o == 4), o == 4) return new Uint32Array(n.buffer, n.byteOffset, n.byteLength / 4);
    var c = new Uint16Array(n.buffer, n.byteOffset, n.byteLength / 2);
    return new Uint32Array(c);
  }
  function r(n, o, c, b, g, l, d) {
    var f = h.exports.sbrk, I = f(c * b), m = f(c * l), u = new Uint8Array(h.exports.memory.buffer);
    u.set(t(o), m), n(I, c, b, g, m, d);
    var C = new Uint8Array(c * b);
    return C.set(u.subarray(I, I + c * b)), f(I - f(0)), C;
  }
  WebAssembly.instantiate(function(n) {
    for (var o = new Uint8Array(n.length), c = 0; c < n.length; ++c) {
      var b = n.charCodeAt(c);
      o[c] = b > 96 ? b - 97 : b > 64 ? b - 39 : b + 4;
    }
    var g = 0;
    for (c = 0; c < n.length; ++c) o[g++] = o[c] < 60 ? e[o[c]] : 64 * (o[c] - 60) + o[++c];
    return o.buffer.slice(0, g);
  }("b9H79TebbbeJq9Geueu9Geub9Gbb9Gvuuuuueu9Gduueu9Gluuuueu9Gvuuuuub9Gouuuuuub9Gluuuub9GiuuueuiKLdilevlevlooroowwvwbDDbelve9Weiiviebeoweuec:G:Qdkr;RiOo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWVbe8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9c9V919U9KbdE9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949wWV79P9V9UbiY9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWVbl8E9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWV9c9V919U9Kbv8A9TW79O9V9Wt9FW9U9J9V9KW69U9KW949wWV79P9V9UboE9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JWbra9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JW9c9V919U9KbwL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9p9JtbDK9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9r919HtbqL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWVT949WbkE9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OWbPa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OW9ttV9P9Wbsa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9WbzK9TW79O9V9Wt9F79W9Ht9P9H29t9VVt9sW9T9H9WbHl79IV9RbODwebcekdQXq;A9pLdbk;QqeKu8Jjjjjbcjo9Rgv8Kjjjjbcbhodnalcefae0mbabcbRbN:kjjbc:GeV86bbavcjdfcbcjdzNjjjb8AdnaiTmbavcjdfadalz:tjjjb8Akabaefhrabcefhwavalfcbcbcjdal9RalcFe0EzNjjjb8Aavavcjdfalz:tjjjbhDcj;abal9Uc;WFbGgecjdaecjd6Ehqcbhkindndnaiak9nmbaDcjlfcbcjdzNjjjb8Aaqaiak9Rakaqfai6Egxcsfgecl4cifcd4hmadakal2fhPdndndnaec9WGgsTmbcbhzaPhHawhOxekdnaxmbalheinaraw9Ram6miawcbamzNjjjbamfhwaecufgembxvkkcbhAaPhOinaDaAfRbbhCaDcjlfheaOhoaxhXinaeaoRbbgQaC9RgCcetaCcKtcK91cr4786bbaoalfhoaecefheaQhCaXcufgXmbkaraw9Ram6mdaOcefhOawcbamzNjjjbamfhwaAcefgAal9hmbxlkkindnaxTmbaDazfRbbhCaDcjlfheaHhoaxhXinaeaoRbbgQaC9RgCcetaCcKtcK91cr4786bbaoalfhoaecefheaQhCaXcufgXmbkkaraO9Ram6mearaOcbamzNjjjbgLamfgw9RcK6mecbhKaDcjlfhOinaDcjlfaKfhYcwhAczhQceheindndnaegXce9hmbcuhoaYRbbmecbhodninaogecsSmeaecefhoaOaefcefRbbTmbkkcucbaecs6EhoxekaXcethocuaXtc;:bGcFb7hCcbheinaoaCaOaefRbb9nfhoaecefgecz9hmbkkaoaQaoaQ6geEhQaXaAaeEhAaXcetheaXcl6mbkdndndndnaAcufPdiebkaLaKco4fgeaeRbbcdciaAclSEaKci4coGtV86bbaAcw9hmeawaY8Pbb83bbawcwfaYcwf8Pbb83bbawczfhwxdkaLaKco4fgeaeRbbceaKci4coGtV86bbkdncwaA9Tg8Ambinawcb86bbawcefhwxbkkcuaAtcu7hYcbhEaOh3ina3hea8AhCcbhoinaeRbbgQaYcFeGgXaQaX6EaoaAtVhoaecefheaCcufgCmbkawao86bba3a8Afh3awcefhwaEa8AfgEcz6mbkcbheindnaOaefRbbgoaX6mbawao86bbawcefhwkaecefgecz9hmbkkdnaKczfgKas9pmbaOczfhOaraw9RcL0mekkaKas6meawTmeaHcefhHawhOazcefgzalSmixbkkcbhoxikcbhoaraw9Ralcaalca0E6mddnalc8F0mbawcbcaal9RgezNjjjbaefhwkawaDcjdfalz:tjjjbalfab9RhoxdkaDaPaxcufal2falz:tjjjb8Aaxakfhkawmbkcbhokavcjof8Kjjjjbaok9heeuaecaaeca0Eabcj;abae9Uc;WFbGgdcjdadcjd6Egdfcufad9Uae2adcl4cifcd4adV2fcefkmbcbabBdN:kjjbk:zse5u8Jjjjjbc;ae9Rgl8Kjjjjbcbhvdnaici9UgocHfae0mbabcbyd:e:kjjbgrc;GeV86bbalc;abfcFecjezNjjjb8AalcUfgw9cu83ibalc8WfgD9cu83ibalcyfgq9cu83ibalcafgk9cu83ibalcKfgx9cu83ibalczfgm9cu83ibal9cu83iwal9cu83ibabaefc9WfhPabcefgsaofhednaiTmbcmcsarcb9kgzEhHcbhOcbhAcbhCcbhXcbhQindnaeaP9nmbcbhvxikaQcufhvadaCcdtfgLydbhKaLcwfydbhYaLclfydbh8AcbhEdndndninalc;abfavcsGcitfgoydlh3dndndnaoydbgoaK9hmba3a8ASmekdnaoa8A9hmba3aY9hmbaEcefhExekaoaY9hmea3aK9hmeaEcdfhEkaEc870mdaXcufhvaLaEciGcx2goc:y1jjbfydbcdtfydbh3aLaocN1jjbfydbcdtfydbh8AaLaoc:q1jjbfydbcdtfydbhKcbhodnindnalavcsGcdtfydba39hmbaohYxdkcuhYavcufhvaocefgocz9hmbkkaOa3aOSgvaYce9iaYaH9oVgoGfhOdndndncbcsavEaYaoEgvcs9hmbarce9imba3a3aAa3cefaASgvEgAcefSmecmcsavEhvkasavaEcdtc;WeGV86bbavcs9hmea3aA9Rgvcetavc8F917hvinaeavcFb0crtavcFbGV86bbaecefheavcje6hoavcr4hvaoTmbka3hAxvkcPhvasaEcdtcPV86bba3hAkavTmiavaH9omicdhocehEaQhYxlkavcufhvaEclfgEc;ab9hmbkkdnaLceaYaOSceta8AaOSEcx2gvc:q1jjbfydbcdtfydbgKTaLavcN1jjbfydbcdtfydbg8AceSGaLavc:y1jjbfydbcdtfydbg3cdSGaOcb9hGazGg5ce9hmbaw9cu83ibaD9cu83ibaq9cu83ibak9cu83ibax9cu83ibam9cu83ibal9cu83iwal9cu83ibcbhOkcbhEaXcufgvhodnindnalaocsGcdtfydba8A9hmbaEhYxdkcuhYaocufhoaEcefgEcz9hmbkkcbhodnindnalavcsGcdtfydba39hmbaohExdkcuhEavcufhvaocefgocz9hmbkkaOaKaOSg8EfhLdndnaYcm0mbaYcefhYxekcbcsa8AaLSgvEhYaLavfhLkdndnaEcm0mbaEcefhExekcbcsa3aLSgvEhEaLavfhLkc9:cua8EEh8FcbhvaEaYcltVgacFeGhodndndninavcj1jjbfRbbaoSmeavcefgvcz9hmbxdkka5aKaO9havcm0VVmbasavc;WeV86bbxekasa8F86bbaeaa86bbaecefhekdna8EmbaKaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombkaKhAkdnaYcs9hmba8AaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka8AhAkdnaEcs9hmba3aA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka3hAkalaXcdtfaKBdbaXcefcsGhvdndnaYPzbeeeeeeeeeeeeeebekalavcdtfa8ABdbaXcdfcsGhvkdndnaEPzbeeeeeeeeeeeeeebekalavcdtfa3BdbavcefcsGhvkcihoalc;abfaQcitfgEaKBdlaEa8ABdbaQcefcsGhYcdhEavhXaLhOxekcdhoalaXcdtfa3BdbcehEaXcefcsGhXaQhYkalc;abfaYcitfgva8ABdlava3Bdbalc;abfaQaEfcsGcitfgva3BdlavaKBdbascefhsaQaofcsGhQaCcifgCai6mbkkcbhvaeaP0mbcbhvinaeavfavcj1jjbfRbb86bbavcefgvcz9hmbkaeab9Ravfhvkalc;aef8KjjjjbavkZeeucbhddninadcefgdc8F0meceadtae6mbkkadcrfcFeGcr9Uci2cdfabci9U2cHfkmbcbabBd:e:kjjbk:ydewu8Jjjjjbcz9Rhlcbhvdnaicvfae0mbcbhvabcbRb:e:kjjbc;qeV86bbal9cb83iwabcefhoabaefc98fhrdnaiTmbcbhwcbhDindnaoar6mbcbskadaDcdtfydbgqalcwfawaqav9Rgvavc8F91gv7av9Rc507gwcdtfgkydb9Rgvc8E91c9:Gavcdt7awVhvinaoavcFb0gecrtavcFbGV86bbavcr4hvaocefhoaembkakaqBdbaqhvaDcefgDai9hmbkkcbhvaoar0mbaocbBbbaoab9RclfhvkavkBeeucbhddninadcefgdc8F0meceadtae6mbkkadcwfcFeGcr9Uab2cvfk:bvli99dui99ludnaeTmbcuadcetcuftcu7:Yhvdndncuaicuftcu7:YgoJbbbZMgr:lJbbb9p9DTmbar:Ohwxekcjjjj94hwkcbhicbhDinalclfIdbgrJbbbbJbbjZalIdbgq:lar:lMalcwfIdbgk:lMgr:varJbbbb9BEgrNhxaqarNhrdndnakJbbbb9GTmbaxhqxekJbbjZar:l:tgqaq:maxJbbbb9GEhqJbbjZax:l:tgxax:marJbbbb9GEhrkdndnalcxfIdbgxJbbj:;axJbbj:;9GEgkJbbjZakJbbjZ9FEavNJbbbZJbbb:;axJbbbb9GEMgx:lJbbb9p9DTmbax:Ohmxekcjjjj94hmkdndnaqJbbj:;aqJbbj:;9GEgxJbbjZaxJbbjZ9FEaoNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:OhPxekcjjjj94hPkdndnarJbbj:;arJbbj:;9GEgqJbbjZaqJbbjZ9FEaoNJbbbZJbbb:;arJbbbb9GEMgr:lJbbb9p9DTmbar:Ohsxekcjjjj94hskdndnadcl9hmbabaifgzas86bbazcifam86bbazcdfaw86bbazcefaP86bbxekabaDfgzas87ebazcofam87ebazclfaw87ebazcdfaP87ebkalczfhlaiclfhiaDcwfhDaecufgembkkk;hlld99eud99eudnaeTmbdndncuaicuftcu7:YgvJbbbZMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikaic;8FiGhrinabcofcicdalclfIdb:lalIdb:l9EgialcwfIdb:lalaicdtfIdb:l9EEgialcxfIdb:lalaicdtfIdb:l9EEgiarV87ebdndnJbbj:;JbbjZalaicdtfIdbJbbbb9DEgoalaicd7cdtfIdbJ;Zl:1ZNNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabcdfaq87ebdndnalaicefciGcdtfIdbJ;Zl:1ZNaoNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabaq87ebdndnaoalaicufciGcdtfIdbJ;Zl:1ZNNgoJbbj:;aoJbbj:;9GEgwJbbjZawJbbjZ9FEavNJbbbZJbbb:;aoJbbbb9GEMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikabclfai87ebabcwfhbalczfhlaecufgembkkk;3viDue99eu8Jjjjjbcjd9Rgo8Kjjjjbadcd4hrdndndndnavcd9hmbadcl6meaohwarhDinawc:CuBdbawclfhwaDcufgDmbkaeTmiadcl6mdarcdthqalhkcbhxinaohwakhDarhminawawydbgPcbaDIdbgs:8cL4cFeGc:cufasJbbbb9BEgzaPaz9kEBdbaDclfhDawclfhwamcufgmmbkakaqfhkaxcefgxaeSmixbkkaeTmdxekaeTmekarcdthkavce9hhqadcl6hdcbhxindndndnaqmbadmdc:CuhDalhwarhminaDcbawIdbgs:8cL4cFeGc:cufasJbbbb9BEgPaDaP9kEhDawclfhwamcufgmmbxdkkc:CuhDdndnavPleddbdkadmdaohwalhmarhPinawcbamIdbgs:8cL4cFeGgzc;:bazc;:b9kEc:cufasJbbbb9BEBdbamclfhmawclfhwaPcufgPmbxdkkadmecbhwarhminaoawfcbalawfIdbgs:8cL4cFeGgPc8AaPc8A9kEc:cufasJbbbb9BEBdbawclfhwamcufgmmbkkadmbcbhwarhPinaDhmdnavceSmbaoawfydbhmkdndnalawfIdbgscjjj;8iamai9RcefgmcLt9R::NJbbbZJbbb:;asJbbbb9GEMgs:lJbbb9p9DTmbas:Ohzxekcjjjj94hzkabawfazcFFFrGamcKtVBdbawclfhwaPcufgPmbkkabakfhbalakfhlaxcefgxae9hmbkkaocjdf8Kjjjjbk;HqdCui998Jjjjjbc:qd9Rgv8Kjjjjbavc:Sefcbc;KbzNjjjb8AcbhodnadTmbcbhoaiTmbdnabae9hmbavcuadcdtgradcFFFFi0Ecbyd:m:kjjbHjjjjbbgeBd:SeavceBd:mdaeabarz:tjjjb8Akavc:GefcwfcbBdbav9cb83i:Geavc:Gefaeadaiavc:Sefz:njjjbavyd:Gehwadci9UgDcbyd:m:kjjbHjjjjbbhravc:Sefavyd:mdgqcdtfarBdbavaqcefgkBd:mdarcbaDzNjjjbhxavc:SefakcdtfcuaicdtaicFFFFi0Ecbyd:m:kjjbHjjjjbbgmBdbavaqcdfgPBd:mdawhramhkinakalIdbalarydbgscwascw6Ecdtfc;ebfIdbMUdbarclfhrakclfhkaicufgimbkavc:SefaPcdtfcuaDcdtadcFFFF970Ecbyd:m:kjjbHjjjjbbgPBdbdnadci6mbaehraPhkaDhiinakamarydbcdtfIdbamarclfydbcdtfIdbMamarcwfydbcdtfIdbMUdbarcxfhrakclfhkaicufgimbkkaqcifhoavc;qbfhzavhravyd:KehHavyd:OehOcbhscbhkcbhAcehCinarhXcihQaeakci2gLcdtfgrydbhdarclfydbhqabaAcx2fgicwfarcwfydbgKBdbaiclfaqBdbaiadBdbaxakfce86bbazaKBdwazaqBdlazadBdbaPakcdtfcbBdbdnasTmbcihQaXhiinazaQcdtfaiydbgrBdbaQaraK9harad9haraq9hGGfhQaiclfhiascufgsmbkkaAcefhAcbhsinaOaHaeasaLfcdtfydbcdtgifydbcdtfgKhrawaifgqydbgdhidnadTmbdninarydbakSmearclfhraicufgiTmdxbkkaraKadcdtfc98fydbBdbaqaqydbcufBdbkascefgsci9hmbkdndnaQTmbcuhkJbbbbhYcbhqavyd:KehKavyd:OehLindndnawazaqcdtfydbcdtgsfydbgrmbaqcefhqxekaqcs0hiamasfgdIdbh8AadalcbaqcefgqaiEcdtfIdbalarcwarcw6Ecdtfc;ebfIdbMgEUdbaEa8A:thEarcdthiaLaKasfydbcdtfhrinaParydbgscdtfgdaEadIdbMg8AUdba8AaYaYa8A9DgdEhYasakadEhkarclfhraic98fgimbkkaqaQ9hmbkakcu9hmekaCaD9pmdindnaxaCfRbbmbaChkxdkaDaCcefgC9hmbxikkaQczaQcz6EhsazhraXhzakcu9hmbkkaocdtavc:Seffc98fhrdninaoTmearydbcbyd1:kjjbH:bjjjbbarc98fhraocufhoxbkkavc:qdf8Kjjjjbk;IlevucuaicdtgvaicFFFFi0Egocbyd:m:kjjbHjjjjbbhralalyd9GgwcdtfarBdbalawcefBd9GabarBdbaocbyd:m:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdlcuadcdtadcFFFFi0Ecbyd:m:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdwabydbcbavzNjjjb8Aadci9UhDdnadTmbabydbhoaehladhrinaoalydbcdtfgvavydbcefBdbalclfhlarcufgrmbkkdnaiTmbabydbhlabydlhrcbhvaihoinaravBdbarclfhralydbavfhvalclfhlaocufgombkkdnadci6mbabydlhrabydwhvcbhlinaecwfydbhoaeclfydbhdaraeydbcdtfgwawydbgwcefBdbavawcdtfalBdbaradcdtfgdadydbgdcefBdbavadcdtfalBdbaraocdtfgoaoydbgocefBdbavaocdtfalBdbaecxfheaDalcefgl9hmbkkdnaiTmbabydlheabydbhlinaeaeydbalydb9RBdbalclfhlaeclfheaicufgimbkkkQbabaeadaic:01jjbz:mjjjbkQbabaeadaic:C:jjjbz:mjjjbk9DeeuabcFeaicdtzNjjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk;Wkivuo99lu8Jjjjjbc;W;Gb9Rgl8Kjjjjbcbhvalcj;Gbfcbc;KbzNjjjb8AalcuadcdtadcFFFFi0Egocbyd:m:kjjbHjjjjbbgrBdj9GalceBd;G9GalcFFF;7rBdwal9cFFF;7;3FF:;Fb83dbalcFFF97Bd;S9Gal9cFFF;7FFF:;u83d;K9Gaicd4hwdndnadmbJFFuFhDJFFuuhqJFFuuhkJFFuFhxJFFuuhmJFFuFhPxekawcdthsaehzincbhiinalaifgHazaifIdbgDaHIdbgxaxaD9EEUdbalc;K;GbfaifgHaDaHIdbgxaxaD9DEUdbaiclfgicx9hmbkazasfhzavcefgvad9hmbkalIdwhqalId;S9GhDalIdlhkalId;O9GhxalIdbhmalId;K9GhPkdndnadTmbJbbbbJbbjZJbbbbaPam:tgPaPJbbbb9DEgPaxak:tgxaxaP9DEgxaDaq:tgDaDax9DEgD:vaDJbbbb9BEhDawcdthsarhHadhzindndnaDaeIdbam:tNJb;au9eNJbbbZMgx:lJbbb9p9DTmbax:Ohixekcjjjj94hikaicztaicwtcj;GiGVaicsGVc:p;G:dKGcH2c;d;H:WKGcv2c;j:KM;jbGhvdndnaDaeclfIdbak:tNJb;au9eNJbbbZMgx:lJbbb9p9DTmbax:Ohixekcjjjj94hikaicztaicwtcj;GiGVaicsGVc:p;G:dKGcH2c;d;H:WKGcq2cM;j:KMeGavVhvdndnaDaecwfIdbaq:tNJb;au9eNJbbbZMgx:lJbbb9p9DTmbax:Ohixekcjjjj94hikaHavaicztaicwtcj;GiGVaicsGVc:p;G:dKGcH2c;d;H:WKGcC2c:KM;j:KdGVBdbaeasfheaHclfhHazcufgzmbkalcbcj;GbzNjjjbhiarhHadheinaiaHydbgzcFrGcx2fgvavydbcefBdbaiazcq4cFrGcx2fgvavydlcefBdlaiazcC4cFrGcx2fgzazydwcefBdwaHclfhHaecufgembxdkkalcbcj;GbzNjjjb8AkcbhHcbhzcbhecbhvinalaHfgiydbhsaiazBdbaicwfgwydbhOawavBdbaiclfgiydbhwaiaeBdbasazfhzaOavfhvawaefheaHcxfgHcj;Gb9hmbkcbhHalaocbyd:m:kjjbHjjjjbbgiBd:e9GdnadTmbabhzinazaHBdbazclfhzadaHcefgH9hmbkabhHadhzinalaraHydbgecdtfydbcFrGcx2fgvavydbgvcefBdbaiavcdtfaeBdbaHclfhHazcufgzmbkaihHadhzinalaraHydbgecdtfydbcq4cFrGcx2fgvavydlgvcefBdlabavcdtfaeBdbaHclfhHazcufgzmbkabhHadhzinalaraHydbgecdtfydbcC4cFrGcx2fgvavydwgvcefBdwaiavcdtfaeBdbaHclfhHazcufgzmbkcbhHinabaiydbcdtfaHBdbaiclfhiadaHcefgH9hmbkkclhidninaic98Smealcj;Gbfaifydbcbyd1:kjjbH:bjjjbbaic98fhixbkkalc;W;Gbf8Kjjjjbk9teiucbcbyd:q:kjjbgeabcifc98GfgbBd:q:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd:q:kjjbgeabcrfc94GfgbBd:q:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd:q:kjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd:q:kjjbfgdBd:q:kjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk:Iddbcjwk:edb4:h9w9N94:P:gW:j9O:ye9Pbbbbbbebbbdbbbebbbdbbbbbbbdbbbbbbbebbbbbbb:l29hZ;69:9kZ;N;76Z;rg97Z;z;o9xZ8J;B85Z;:;u9yZ;b;k9HZ:2;Z9DZ9e:l9mZ59A8KZ:r;T3Z:A:zYZ79OHZ;j4::8::Y:D9V8:bbbb9s:49:Z8R:hBZ9M9M;M8:L;z;o8:;8:PG89q;x:J878R:hQ8::M:B;e87bbbbbbjZbbjZbbjZ:E;V;N8::Y:DsZ9i;H;68:xd;R8:;h0838:;W:NoZbbbb:WV9O8:uf888:9i;H;68:9c9G;L89;n;m9m89;D8Ko8:bbbbf:8tZ9m836ZS:2AZL;zPZZ818EZ9e:lxZ;U98F8:819E;68:bc:eqkzebbbebbbdbbba:vbb"), {}).then(function(n) {
    (h = n.instance).exports.__wasm_call_ctors(), h.exports.meshopt_encodeVertexVersion(0), h.exports.meshopt_encodeIndexVersion(1);
  });
})();
var Vt = function() {
  var h = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 3, 2, 0, 0, 5, 3, 1, 0, 1, 12, 1, 0, 10, 22, 2, 12, 0, 65, 0, 65, 0, 65, 0, 252, 10, 0, 0, 11, 7, 0, 65, 0, 253, 15, 26, 11]), e = new Uint8Array([32, 0, 65, 2, 1, 106, 34, 33, 3, 128, 11, 4, 13, 64, 6, 253, 10, 7, 15, 116, 127, 5, 8, 12, 40, 16, 19, 54, 20, 9, 27, 255, 113, 17, 42, 67, 24, 23, 146, 148, 18, 14, 22, 45, 70, 69, 56, 114, 101, 21, 25, 63, 75, 136, 108, 28, 118, 29, 73, 115]);
  if (typeof WebAssembly != "object") return { supported: !1 };
  var a, t = WebAssembly.validate(h) ? i("b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q:6dkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq:p9sqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk:N8JlHud97euo978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnadcefal0mbcuhoaiRbbc:Ge9hmbavaialfgrad9Rad;8qbbcj;abad9UhlaicefhodnaeTmbadTmbalc;WFbGglcjdalcjd6EhwcbhDinawaeaD9RaDawfae6Egqcsfglc9WGgkci2hxakcethmalcl4cifcd4hPabaDad2fhsakc;ab6hzcbhHincbhOaohAdndninaraA9RaP6meavcj;cbfaOak2fhCaAaPfhocbhidnazmbarao9Rc;Gb6mbcbhlinaCalfhidndndndndnaAalco4fRbbgXciGPlbedibkaipxbbbbbbbbbbbbbbbbpklbxikaiaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbaoclfaYpQbfaKc:q:yjjbfRbbfhoxdkaiaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbaocwfaYpQbfaKc:q:yjjbfRbbfhoxekaiaopbbbpklbaoczfhokdndndndndnaXcd4ciGPlbedibkaipxbbbbbbbbbbbbbbbbpklzxikaiaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklzaoclfaYpQbfaKc:q:yjjbfRbbfhoxdkaiaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklzaocwfaYpQbfaKc:q:yjjbfRbbfhoxekaiaopbbbpklzaoczfhokdndndndndnaXcl4ciGPlbedibkaipxbbbbbbbbbbbbbbbbpklaxikaiaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklaaoclfaYpQbfaKc:q:yjjbfRbbfhoxdkaiaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklaaocwfaYpQbfaKc:q:yjjbfRbbfhoxekaiaopbbbpklaaoczfhokdndndndndnaXco4Plbedibkaipxbbbbbbbbbbbbbbbbpkl8WxikaiaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibaXc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkl8WaoclfaYpQbfaXc:q:yjjbfRbbfhoxdkaiaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibaXc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkl8WaocwfaYpQbfaXc:q:yjjbfRbbfhoxekaiaopbbbpkl8Waoczfhokalc;abfhialcjefak0meaihlarao9Rc;Fb0mbkkdnaiak9pmbaici4hlinarao9RcK6miaCaifhXdndndndndnaAaico4fRbbalcoG4ciGPlbedibkaXpxbbbbbbbbbbbbbbbbpkbbxikaXaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkbbaoclfaYpQbfaKc:q:yjjbfRbbfhoxdkaXaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkbbaocwfaYpQbfaKc:q:yjjbfRbbfhoxekaXaopbbbpkbbaoczfhokalcdfhlaiczfgiak6mbkkaoTmeaohAaOcefgOclSmdxbkkc9:hoxlkdnakTmbavcjdfaHfhiavaHfpbdbhYcbhXinaiavcj;cbfaXfglpblbgLcep9TaLpxeeeeeeeeeeeeeeeegQp9op9Hp9rgLalakfpblbg8Acep9Ta8AaQp9op9Hp9rg8ApmbzeHdOiAlCvXoQrLgEalamfpblbg3cep9Ta3aQp9op9Hp9rg3alaxfpblbg5cep9Ta5aQp9op9Hp9rg5pmbzeHdOiAlCvXoQrLg8EpmbezHdiOAlvCXorQLgQaQpmbedibedibedibediaYp9UgYp9AdbbaiadfglaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaladfglaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaladfglaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaladfglaYaEa8EpmwDKYqk8AExm35Ps8E8FgQaQpmbedibedibedibedip9UgYp9AdbbaladfglaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaladfglaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaladfglaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaladfglaYaLa8ApmwKDYq8AkEx3m5P8Es8FgLa3a5pmwKDYq8AkEx3m5P8Es8Fg8ApmbezHdiOAlvCXorQLgQaQpmbedibedibedibedip9UgYp9AdbbaladfglaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaladfglaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaladfglaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaladfglaYaLa8ApmwDKYqk8AExm35Ps8E8FgQaQpmbedibedibedibedip9UgYp9AdbbaladfglaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaladfglaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaladfglaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaladfhiaXczfgXak6mbkkaHclfgHad6mbkasavcjdfaqad2;8qbbavavcjdfaqcufad2fad;8qbbaqaDfgDae6mbkkcbc99arao9Radcaadca0ESEhokavcj;kbf8Kjjjjbaokwbz:bjjjbk::seHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhDaicefgqarfhidnaeTmbcmcsawceSEhkcbhxcbhmcbhPcbhwcbhlindnaiaD9nmbc9:hoxikdndnaqRbbgoc;Ve0mbavc;abfalaocu7gscl4fcsGcitfgzydlhrazydbhzdnaocsGgHak9pmbavawasfcsGcdtfydbaxaHEhoaHThsdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkaxasfhxcdhHavawcdtfaoBdbawasfhwcehsalhOxdkdndnaHcsSmbaHc987aHamffcefhoxekaicefhoai8SbbgHcFeGhsdndnaHcu9mmbaohixekaicvfhiascFbGhscrhHdninao8SbbgOcFbGaHtasVhsaOcu9kmeaocefhoaHcrfgHc8J9hmbxdkkaocefhikasce4cbasceG9R7amfhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhHavawcdtfaoBdbcehsawcefhwalhOaohmxekdnaocpe0mbaxcefgHavawaDaocsGfRbbgocl49RcsGcdtfydbaocz6gzEhravawao9RcsGcdtfydbaHazfgAaocsGgHEhoaHThCdndnadcd9hmbabaPcetfgHax87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHaxBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfaxBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgOaxBdlaOarBdbavawazfgwcsGcdtfaoBdbalcefcsGhOawaCfhwaxhzaAaCfhxxekaxcbaiRbbgOEgzaoc;:eSgHfhraOcsGhCaOcl4hAdndnaOcs0mbarcefhoxekarhoavawaA9RcsGcdtfydbhrkdndnaCmbaocefhxxekaohxavawaO9RcsGcdtfydbhokdndnaHTmbaicefhHxekaicdfhHai8SbegscFeGhzdnascu9kmbaicofhXazcFbGhzcrhidninaH8SbbgscFbGaitazVhzascu9kmeaHcefhHaicrfgic8J9hmbkaXhHxekaHcefhHkazce4cbazceG9R7amfgmhzkdndnaAcsSmbaHhsxekaHcefhsaH8SbbgicFeGhrdnaicu9kmbaHcvfhXarcFbGhrcrhidninas8SbbgHcFbGaitarVhraHcu9kmeascefhsaicrfgic8J9hmbkaXhsxekascefhskarce4cbarceG9R7amfgmhrkdndnaCcsSmbashixekascefhias8SbbgocFeGhHdnaocu9kmbascvfhXaHcFbGhHcrhodninai8SbbgscFbGaotaHVhHascu9kmeaicefhiaocrfgoc8J9hmbkaXhixekaicefhikaHce4cbaHceG9R7amfgmhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfazBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgXazBdlaXarBdbavawaOcz6aAcsSVfgwcsGcdtfaoBdbawaCTaCcsSVfhwalcefcsGhOkaqcefhqavc;abfaOcitfgOarBdlaOaoBdbavc;abfalasfcsGcitfgraoBdlarazBdbawcsGhwalaHfcsGhlaPcifgPae6mbkkcbc99aiaDSEhokavc;aef8Kjjjjbaok:flevu8Jjjjjbcz9Rhvc9:hodnaecvfal0mbcuhoaiRbbc;:eGc;qe9hmbav9cb83iwaicefhraialfc98fhwdnaeTmbdnadcdSmbcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcdtfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfglBdbaoalBdbaDcefgDae9hmbxdkkcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcetfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfgl87ebaoalBdbaDcefgDae9hmbkkcbc99arawSEhokaok:wPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalaeSmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oaoarpmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalaeSmbaiaeciGgvcitgdfcbcaad9R;8kbaiabalcitfglad;8qbbdnavTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oaoarpmbezHdiOAlvCXorQLp9qpklbkalaiad;8qbbkk;4wllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalaeSmbaiaeciGgvcitgofcbcaao9R;8kbaiabalcitfgwao;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkawaiao;8qbbkk:Pddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnavalSmbaialciGgecdtgdVcbc;abad9R;8kbaiabavcdtfgvad;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkavaiad;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz:Dbb") : i("b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:q:Odkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq;w8Wqdbk;esezu8Jjjjjbcj;eb9Rgv8Kjjjjbc9:hodnadcefal0mbcuhoaiRbbc:Ge9hmbavaialfgrad9Radz1jjjbhwcj;abad9Uc;WFbGgocjdaocjd6EhDaicefhocbhqdnindndndnaeaq9nmbaDaeaq9RaqaDfae6Egkcsfglcl4cifcd4hxalc9WGgmTmecbhPawcjdfhsaohzinaraz9Rax6mvarazaxfgo9RcK6mvczhlcbhHinalgic9WfgOawcj;cbffhldndndndndnazaOco4fRbbaHcoG4ciGPlbedibkal9cb83ibalcwf9cb83ibxikalaoRblaoRbbgOco4gAaAciSgAE86bbawcj;cbfaifglcGfaoclfaAfgARbbaOcl4ciGgCaCciSgCE86bbalcVfaAaCfgARbbaOcd4ciGgCaCciSgCE86bbalc7faAaCfgARbbaOciGgOaOciSgOE86bbalctfaAaOfgARbbaoRbegOco4gCaCciSgCE86bbalc91faAaCfgARbbaOcl4ciGgCaCciSgCE86bbalc4faAaCfgARbbaOcd4ciGgCaCciSgCE86bbalc93faAaCfgARbbaOciGgOaOciSgOE86bbalc94faAaOfgARbbaoRbdgOco4gCaCciSgCE86bbalc95faAaCfgARbbaOcl4ciGgCaCciSgCE86bbalc96faAaCfgARbbaOcd4ciGgCaCciSgCE86bbalc97faAaCfgARbbaOciGgOaOciSgOE86bbalc98faAaOfgORbbaoRbigoco4gAaAciSgAE86bbalc99faOaAfgORbbaocl4ciGgAaAciSgAE86bbalc9:faOaAfgORbbaocd4ciGgAaAciSgAE86bbalcufaOaAfglRbbaociGgoaociSgoE86bbalaofhoxdkalaoRbwaoRbbgOcl4gAaAcsSgAE86bbawcj;cbfaifglcGfaocwfaAfgARbbaOcsGgOaOcsSgOE86bbalcVfaAaOfgORbbaoRbegAcl4gCaCcsSgCE86bbalc7faOaCfgORbbaAcsGgAaAcsSgAE86bbalctfaOaAfgORbbaoRbdgAcl4gCaCcsSgCE86bbalc91faOaCfgORbbaAcsGgAaAcsSgAE86bbalc4faOaAfgORbbaoRbigAcl4gCaCcsSgCE86bbalc93faOaCfgORbbaAcsGgAaAcsSgAE86bbalc94faOaAfgORbbaoRblgAcl4gCaCcsSgCE86bbalc95faOaCfgORbbaAcsGgAaAcsSgAE86bbalc96faOaAfgORbbaoRbvgAcl4gCaCcsSgCE86bbalc97faOaCfgORbbaAcsGgAaAcsSgAE86bbalc98faOaAfgORbbaoRbogAcl4gCaCcsSgCE86bbalc99faOaCfgORbbaAcsGgAaAcsSgAE86bbalc9:faOaAfgORbbaoRbrgocl4gAaAcsSgAE86bbalcufaOaAfglRbbaocsGgoaocsSgoE86bbalaofhoxekalao8Pbb83bbalcwfaocwf8Pbb83bbaoczfhokdnaiam9pmbaHcdfhHaiczfhlarao9RcL0mekkaiam6mvaoTmvdnakTmbawaPfRbbhHawcj;cbfhlashiakhOinaialRbbgzce4cbazceG9R7aHfgH86bbaiadfhialcefhlaOcufgOmbkkascefhsaohzaPcefgPad9hmbxikkcbc99arao9Radcaadca0ESEhoxlkaoaxad2fhCdnakmbadhlinaoTmlarao9Rax6mlaoaxfhoalcufglmbkaChoxekcbhmawcjdfhAinarao9Rax6miawamfRbbhHawcj;cbfhlaAhiakhOinaialRbbgzce4cbazceG9R7aHfgH86bbaiadfhialcefhlaOcufgOmbkaAcefhAaoaxfhoamcefgmad9hmbkaChokabaqad2fawcjdfakad2z1jjjb8Aawawcjdfakcufad2fadz1jjjb8Aakaqfhqaombkc9:hoxekc9:hokavcj;ebf8Kjjjjbaok;cseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhDaicefgqarfhidnaeTmbcmcsawceSEhkcbhxcbhmcbhPcbhwcbhlindnaiaD9nmbc9:hoxikdndnaqRbbgoc;Ve0mbavc;abfalaocu7gscl4fcsGcitfgzydlhrazydbhzdnaocsGgHak9pmbavawasfcsGcdtfydbaxaHEhoaHThsdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkaxasfhxcdhHavawcdtfaoBdbawasfhwcehsalhOxdkdndnaHcsSmbaHc987aHamffcefhoxekaicefhoai8SbbgHcFeGhsdndnaHcu9mmbaohixekaicvfhiascFbGhscrhHdninao8SbbgOcFbGaHtasVhsaOcu9kmeaocefhoaHcrfgHc8J9hmbxdkkaocefhikasce4cbasceG9R7amfhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhHavawcdtfaoBdbcehsawcefhwalhOaohmxekdnaocpe0mbaxcefgHavawaDaocsGfRbbgocl49RcsGcdtfydbaocz6gzEhravawao9RcsGcdtfydbaHazfgAaocsGgHEhoaHThCdndnadcd9hmbabaPcetfgHax87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHaxBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfaxBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgOaxBdlaOarBdbavawazfgwcsGcdtfaoBdbalcefcsGhOawaCfhwaxhzaAaCfhxxekaxcbaiRbbgOEgzaoc;:eSgHfhraOcsGhCaOcl4hAdndnaOcs0mbarcefhoxekarhoavawaA9RcsGcdtfydbhrkdndnaCmbaocefhxxekaohxavawaO9RcsGcdtfydbhokdndnaHTmbaicefhHxekaicdfhHai8SbegscFeGhzdnascu9kmbaicofhXazcFbGhzcrhidninaH8SbbgscFbGaitazVhzascu9kmeaHcefhHaicrfgic8J9hmbkaXhHxekaHcefhHkazce4cbazceG9R7amfgmhzkdndnaAcsSmbaHhsxekaHcefhsaH8SbbgicFeGhrdnaicu9kmbaHcvfhXarcFbGhrcrhidninas8SbbgHcFbGaitarVhraHcu9kmeascefhsaicrfgic8J9hmbkaXhsxekascefhskarce4cbarceG9R7amfgmhrkdndnaCcsSmbashixekascefhias8SbbgocFeGhHdnaocu9kmbascvfhXaHcFbGhHcrhodninai8SbbgscFbGaotaHVhHascu9kmeaicefhiaocrfgoc8J9hmbkaXhixekaicefhikaHce4cbaHceG9R7amfgmhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfazBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgXazBdlaXarBdbavawaOcz6aAcsSVfgwcsGcdtfaoBdbawaCTaCcsSVfhwalcefcsGhOkaqcefhqavc;abfaOcitfgOarBdlaOaoBdbavc;abfalasfcsGcitfgraoBdlarazBdbawcsGhwalaHfcsGhlaPcifgPae6mbkkcbc99aiaDSEhokavc;aef8Kjjjjbaok:flevu8Jjjjjbcz9Rhvc9:hodnaecvfal0mbcuhoaiRbbc;:eGc;qe9hmbav9cb83iwaicefhraialfc98fhwdnaeTmbdnadcdSmbcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcdtfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfglBdbaoalBdbaDcefgDae9hmbxdkkcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcetfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfgl87ebaoalBdbaDcefgDae9hmbkkcbc99arawSEhokaok:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;oiliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavciGfgkcd7cetfaD87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavcufciGfcetfaD87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohvxekcjjjj94hvkabakcetfav87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkkkebcjwklzNbb"), A = WebAssembly.instantiate(t, {}).then(function(l) {
    (a = l.instance).exports.__wasm_call_ctors();
  });
  function i(l) {
    for (var d = new Uint8Array(l.length), f = 0; f < l.length; ++f) {
      var I = l.charCodeAt(f);
      d[f] = I > 96 ? I - 97 : I > 64 ? I - 39 : I + 4;
    }
    var m = 0;
    for (f = 0; f < l.length; ++f) d[m++] = d[f] < 60 ? e[d[f]] : 64 * (d[f] - 60) + d[++f];
    return d.buffer.slice(0, m);
  }
  function s(l, d, f, I, m, u, C) {
    var B = l.exports.sbrk, w = I + 3 & -4, k = B(w * m), y = B(u.length), p = new Uint8Array(l.exports.memory.buffer);
    p.set(u, y);
    var Q = d(k, I, m, y, u.length);
    if (Q == 0 && C && C(k, w, m), f.set(p.subarray(k, k + I * m)), B(k - B(0)), Q != 0) throw new Error("Malformed buffer data: " + Q);
  }
  var r = { NONE: "", OCTAHEDRAL: "meshopt_decodeFilterOct", QUATERNION: "meshopt_decodeFilterQuat", EXPONENTIAL: "meshopt_decodeFilterExp" }, n = { ATTRIBUTES: "meshopt_decodeVertexBuffer", TRIANGLES: "meshopt_decodeIndexBuffer", INDICES: "meshopt_decodeIndexSequence" }, o = [], c = 0;
  function b(l) {
    var d = { object: new Worker(l), pending: 0, requests: {} };
    return d.object.onmessage = function(f) {
      var I = f.data;
      d.pending -= I.count, d.requests[I.id][I.action](I.value), delete d.requests[I.id];
    }, d;
  }
  function g(l) {
    var d = l.data;
    if (!d.id) return self.close();
    self.ready.then(function(f) {
      try {
        var I = new Uint8Array(d.count * d.size);
        s(f, f.exports[d.mode], I, d.count, d.size, d.source, f.exports[d.filter]), self.postMessage({ id: d.id, count: d.count, action: "resolve", value: I }, [I.buffer]);
      } catch (m) {
        self.postMessage({ id: d.id, count: d.count, action: "reject", value: m });
      }
    });
  }
  return { ready: A, supported: !0, useWorkers: function(l) {
    (function(d) {
      for (var f = "self.ready = WebAssembly.instantiate(new Uint8Array([" + new Uint8Array(t) + "]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = " + g.name + ";" + s.toString() + g.toString(), I = new Blob([f], { type: "text/javascript" }), m = URL.createObjectURL(I), u = o.length; u < d; ++u) o[u] = b(m);
      for (u = d; u < o.length; ++u) o[u].object.postMessage({});
      o.length = d, URL.revokeObjectURL(m);
    })(l);
  }, decodeVertexBuffer: function(l, d, f, I, m) {
    s(a, a.exports.meshopt_decodeVertexBuffer, l, d, f, I, a.exports[r[m]]);
  }, decodeIndexBuffer: function(l, d, f, I) {
    s(a, a.exports.meshopt_decodeIndexBuffer, l, d, f, I);
  }, decodeIndexSequence: function(l, d, f, I) {
    s(a, a.exports.meshopt_decodeIndexSequence, l, d, f, I);
  }, decodeGltfBuffer: function(l, d, f, I, m, u) {
    s(a, a.exports[n[m]], l, d, f, I, a.exports[r[u]]);
  }, decodeGltfBufferAsync: function(l, d, f, I, m) {
    return o.length > 0 ? function(u, C, B, w, k) {
      for (var y = o[0], p = 1; p < o.length; ++p) o[p].pending < y.pending && (y = o[p]);
      return new Promise(function(Q, x) {
        var j = new Uint8Array(B), M = ++c;
        y.pending += u, y.requests[M] = { resolve: Q, reject: x }, y.object.postMessage({ id: M, count: u, size: C, source: j, mode: w, filter: k }, [j.buffer]);
      });
    }(l, d, f, n[I], r[m]) : A.then(function() {
      var u = new Uint8Array(l * d);
      return s(a, a.exports[n[I]], u, l, d, f, a.exports[r[m]]), u;
    });
  } };
}();
(function() {
  var h, e = new Uint8Array([32, 0, 65, 2, 1, 106, 34, 33, 3, 128, 11, 4, 13, 64, 6, 253, 10, 7, 15, 116, 127, 5, 8, 12, 40, 16, 19, 54, 20, 9, 27, 255, 113, 17, 42, 67, 24, 23, 146, 148, 18, 14, 22, 45, 70, 69, 56, 114, 101, 21, 25, 63, 75, 136, 108, 28, 118, 29, 73, 115]);
  if (typeof WebAssembly != "object") return { supported: !1 };
  var a = WebAssembly.instantiate(function(r) {
    for (var n = new Uint8Array(r.length), o = 0; o < r.length; ++o) {
      var c = r.charCodeAt(o);
      n[o] = c > 96 ? c - 97 : c > 64 ? c - 39 : c + 4;
    }
    var b = 0;
    for (o = 0; o < r.length; ++o) n[b++] = n[o] < 60 ? e[n[o]] : 64 * (n[o] - 60) + n[++o];
    return n.buffer.slice(0, b);
  }("b9H79Tebbbe9Hk9Geueu9Geub9Gbb9Gsuuuuuuuuuuuu99uueu9Gvuuuuub9Gvuuuuue999Gquuuuuuu99uueu9Gwuuuuuu99ueu9Giuuue999Gluuuueu9GiuuueuizsdilvoirwDbqqbeqlve9Weiiviebeoweuecj:Pdkr:Tewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bbz9TW79O9V9Wt9F79P9T9W29P9M95bl8E9TW79O9V9Wt9F79P9T9W29P9M959x9Pt9OcttV9P9I91tW7bvQ9TW79O9V9Wt9F79P9T9W29P9M959q9V9P9Ut7boX9TW79O9V9Wt9F79P9T9W29P9M959t9J9H2Wbra9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9Wbwl79IV9RbDDwebcekdmxq;UMesdbk:kfvKue99euY99Qu8Jjjjjbc;W;qb9Rgs8Kjjjjbcbhzascxfcbc;Kbz:ljjjb8AdnabaeSmbabaeadcdtz:kjjjb8AkdnamcdGTmbalcrfci4gHcbyd;S1jjbHjjjjbbheascxfasyd2gOcdtfaeBdbasaOcefBd2aecbaHz:ljjjbhAcbhlcbhednadTmbcbhlabheadhHinaAaeydbgOci4fgCaCRbbgCceaOcrGgOtV86bbaCcu7aO4ceGalfhlaeclfheaHcufgHmbkcualcdtalcFFFFi0Ehekaecbyd;S1jjbHjjjjbbhzascxfasyd2gecdtfazBdbasaecefBd2alcd4alfhOcehHinaHgecethHaeaO6mbkcbhXcuaecdtgOaecFFFFi0Ecbyd;S1jjbHjjjjbbhHascxfasyd2gCcdtfaHBdbasaCcefBd2aHcFeaOz:ljjjbhQdnadTmbaecufhCcbhLinabaXcdtfgKydbgAc:v;t;h;Ev2hOcbhedndninaQaOaCGgOcdtfgYydbgHcuSmeazaHcdtfydbaASmdaecefgeaOfhOaeaC9nmbxdkkazaLcdtfaABdbaYaLBdbaLhHaLcefhLkaKaHBdbaXcefgXad9hmbkkaQcbyd;O1jjbH:bjjjbbasasyd2cufBd2kcualcefgecdtaecFFFFi0Ecbyd;S1jjbHjjjjbbh8Aascxfasyd2gecdtfa8ABdbasa8ABdlasaecefBd2cuadcitadcFFFFe0Ecbyd;S1jjbHjjjjbbhEascxfasyd2gecdtfaEBdbasaEBdwasaecefBd2asclfabadalcbz:cjjjbcualcdtg3alcFFFFi0Eg5cbyd;S1jjbHjjjjbbhQascxfasyd2gecdtfaQBdbasaecefBd2a5cbyd;S1jjbHjjjjbbh8Eascxfasyd2gecdtfa8EBdbasaecefBd2alcd4alfhOcehHinaHgecethHaeaO6mbkcbhLcuaecdtgOaecFFFFi0Ecbyd;S1jjbHjjjjbbhHascxfasyd2gCcdtfaHBdbasaCcefBd2aHcFeaOz:ljjjbhXdnalTmbavcd4hCaecufhHinaLhednazTmbazaLcdtfydbhekaiaeaC2cdtfgeydlgOcH4aO7c:F:b:DD2aeydbgOcH4aO7c;D;O:B8J27aeydwgecH4ae7c:3F;N8N27aHGheaLcdth8FdndndndndnazTmbaza8FfhKcbhOinaXaecdtfgYydbgAcuSmlaiazaAcdtfydbaC2cdtfaiaKydbaC2cdtfcxz:ojjjbTmiaOcefgOaefaHGheaOaH9nmbxdkkaiaLaC2cdtfhKcbhOinaXaecdtfgYydbgAcuSmiaiaAaC2cdtfaKcxz:ojjjbTmdaOcefgOaefaHGheaOaH9nmbkkcbhYkaYydbgecu9hmekaYaLBdbaLhekaQa8FfaeBdbaLcefgLal9hmbkcbhea8EhHinaHaeBdbaHclfhHalaecefge9hmbkcbheaQhHa8EhOindnaeaHydbgCSmbaOa8EaCcdtfgCydbBdbaCaeBdbkaHclfhHaOclfhOalaecefge9hmbkkcbhaaXcbyd;O1jjbH:bjjjbbasasyd2cufBd2alcbyd;S1jjbHjjjjbbhXascxfasyd2gecdtfaXBdbasaecefBd2a5cbyd;S1jjbHjjjjbbheascxfasyd2gHcdtfaeBdbasaHcefBd2a5cbyd;S1jjbHjjjjbbhHascxfasyd2gOcdtfaHBdbasaOcefBd2aecFea3z:ljjjbhhaHcFea3z:ljjjbhgdnalTmbaEcwfh8Jindna8AaagOcefgacdtfydbgCa8AaOcdtgefydbgHSmbaCaH9Rh8FaEaHcitfh3agaefh8KahaefhLcbhAindndna3aAcitfydbgYaO9hmbaLaOBdba8KaOBdbxekdna8AaYcdtg8LfgeclfydbgHaeydbgeSmbaEaecitgCfydbaOSmeaHae9Rh8Maecu7aHfhKa8JaCfhHcbheinaKaeSmeaecefheaHydbhCaHcwfhHaCaO9hmbkaea8M6mekaga8LfgeaOaYaeydbcuSEBdbaLaYaOaLydbcuSEBdbkaAcefgAa8F9hmbkkaaal9hmbkaQhHa8EhOaghCahhAcbheindndnaeaHydbgY9hmbdnaeaOydbgY9hmbaAydbhYdnaCydbgKcu9hmbaYcu9hmbaXaefcb86bbxikaXaefhLdnaeaKSmbaeaYSmbaLce86bbxikaLcl86bbxdkdnaea8EaYcdtgKfydb9hmbdnaCydbgLcuSmbaeaLSmbaAydbg8FcuSmbaea8FSmbagaKfydbg3cuSmba3aYSmbahaKfydbgKcuSmbaKaYSmbdnaQaLcdtfydbgYaQaKcdtfydb9hmbaYaQa8FcdtfydbgKSmbaKaQa3cdtfydb9hmbaXaefcd86bbxlkaXaefcl86bbxikaXaefcl86bbxdkaXaefcl86bbxekaXaefaXaYfRbb86bbkaHclfhHaOclfhOaCclfhCaAclfhAalaecefge9hmbkdnaqTmbdndnazTmbazheaQhHalhOindnaqaeydbfRbbTmbaXaHydbfcl86bbkaeclfheaHclfhHaOcufgOmbxdkkaQhealhHindnaqRbbTmbaXaeydbfcl86bbkaqcefhqaeclfheaHcufgHmbkkaQhealhOaXhHindnaXaeydbfRbbcl9hmbaHcl86bbkaeclfheaHcefhHaOcufgOmbkkamceGTmbaXhealhHindnaeRbbce9hmbaecl86bbkaecefheaHcufgHmbkkcualcx2alc;v:Q;v:Qe0Ecbyd;S1jjbHjjjjbbhaascxfasyd2gecdtfaaBdbasaecefBd2aaaialavazz:djjjbh8NdndnaDmbcbhycbh8Jxekcbh8JawhecbhHindnaeIdbJbbbb9ETmbasc;Wbfa8JcdtfaHBdba8Jcefh8JkaeclfheaDaHcefgH9hmbkcua8Jal2gecdtaecFFFFi0Ecbyd;S1jjbHjjjjbbhyascxfasyd2gecdtfayBdbasaecefBd2alTmba8JTmbarcd4hLdnazTmba8JcdthicbhYayhKinaoazaYcdtfydbaL2cdtfhAasc;WbfheaKhHa8JhOinaHaAaeydbcdtgCfIdbawaCfIdbNUdbaeclfheaHclfhHaOcufgOmbkaKaifhKaYcefgYal9hmbxdkka8JcdthicbhYayhKinaoaYaL2cdtfhAasc;WbfheaKhHa8JhOinaHaAaeydbcdtgCfIdbawaCfIdbNUdbaeclfheaHclfhHaOcufgOmbkaKaifhKaYcefgYal9hmbkkcualc8S2gHalc;D;O;f8U0EgCcbyd;S1jjbHjjjjbbheascxfasyd2gOcdtfaeBdbasaOcefBd2aecbaHz:ljjjbhqdndndndna8JTmbaCcbyd;S1jjbHjjjjbbhvascxfasyd2gecdtfavBdbcehOasaecefBd2avcbaHz:ljjjb8Acua8Jal2gecltgHaecFFFFb0Ecbyd;S1jjbHjjjjbbhrascxfasyd2gecdtfarBdbasaecefBd2arcbaHz:ljjjb8AadmexikcbhvadTmecbhrkcbhAabhHindnaaaHclfydbgYcx2fgeIdbaaaHydbgKcx2fgOIdbg8P:tgIaaaHcwfydbgLcx2fgCIdlaOIdlg8R:tg8SNaCIdba8P:tgRaeIdla8R:tg8UN:tg8Va8VNa8UaCIdwaOIdwg8W:tg8XNa8SaeIdwa8W:tg8UN:tg8Sa8SNa8UaRNa8XaIN:tgIaINMM:rgRJbbbb9ETmba8VaR:vh8VaIaR:vhIa8SaR:vh8SkaqaQaKcdtfydbc8S2fgea8SaR:rgRa8SNNg8UaeIdbMUdbaeaIaRaINg8YNg8XaeIdlMUdlaea8VaRa8VNg8ZNg80aeIdwMUdwaea8Ya8SNg8YaeIdxMUdxaea8Za8SNg81aeIdzMUdzaea8ZaINg8ZaeIdCMUdCaea8SaRa8Va8WNa8Sa8PNa8RaINMM:mg8RNg8PNg8SaeIdKMUdKaeaIa8PNgIaeId3MUd3aea8Va8PNg8VaeIdaMUdaaea8Pa8RNg8PaeId8KMUd8KaeaRaeIdyMUdyaqaQaYcdtfydbc8S2fgea8UaeIdbMUdbaea8XaeIdlMUdlaea80aeIdwMUdwaea8YaeIdxMUdxaea81aeIdzMUdzaea8ZaeIdCMUdCaea8SaeIdKMUdKaeaIaeId3MUd3aea8VaeIdaMUdaaea8PaeId8KMUd8KaeaRaeIdyMUdyaqaQaLcdtfydbc8S2fgea8UaeIdbMUdbaea8XaeIdlMUdlaea80aeIdwMUdwaea8YaeIdxMUdxaea81aeIdzMUdzaea8ZaeIdCMUdCaea8SaeIdKMUdKaeaIaeId3MUd3aea8VaeIdaMUdaaea8PaeId8KMUd8KaeaRaeIdyMUdyaHcxfhHaAcifgAad6mbkcbhiabhKinabaicdtfhYcbhHinaXaYaHc:G1jjbfydbcdtfydbgOfRbbhedndnaXaKaHfydbgCfRbbgAc99fcFeGcpe0mbaeceSmbaecd9hmekdnaAcufcFeGce0mbahaCcdtfydbaO9hmekdnaecufcFeGce0mbagaOcdtfydbaC9hmekdnaAcv2aefcj1jjbfRbbTmbaQaOcdtfydbaQaCcdtfydb0mekJbbacJbbacJbbjZaeceSEaAceSEh8ZdnaaaYaHc:K1jjbfydbcdtfydbcx2fgeIdwaaaCcx2fgAIdwg8R:tg8VaaaOcx2fgLIdwa8R:tg8Sa8SNaLIdbaAIdbg8W:tgIaINaLIdlaAIdlg8U:tgRaRNMMg8PNa8Va8SNaeIdba8W:tg80aINaRaeIdla8U:tg8YNMMg8Xa8SN:tg8Va8VNa80a8PNa8XaIN:tg8Sa8SNa8Ya8PNa8XaRN:tgIaINMM:rgRJbbbb9ETmba8VaR:vh8VaIaR:vhIa8SaR:vh8SkaqaQaCcdtfydbc8S2fgea8Sa8Za8P:rNgRa8SNNg8XaeIdbMUdbaeaIaRaINg8ZNg80aeIdlMUdlaea8VaRa8VNg8PNg8YaeIdwMUdwaea8Za8SNg8ZaeIdxMUdxaea8Pa8SNg81aeIdzMUdzaea8PaINgBaeIdCMUdCaea8SaRa8Va8RNa8Sa8WNa8UaINMM:mg8RNg8PNg8SaeIdKMUdKaeaIa8PNgIaeId3MUd3aea8Va8PNg8VaeIdaMUdaaea8Pa8RNg8PaeId8KMUd8KaeaRaeIdyMUdyaqaQaOcdtfydbc8S2fgea8XaeIdbMUdbaea80aeIdlMUdlaea8YaeIdwMUdwaea8ZaeIdxMUdxaea81aeIdzMUdzaeaBaeIdCMUdCaea8SaeIdKMUdKaeaIaeId3MUd3aea8VaeIdaMUdaaea8PaeId8KMUd8KaeaRaeIdyMUdykaHclfgHcx9hmbkaKcxfhKaicifgiad6mbkdna8JTmbcbhKinJbbbbh8WaaabaKcdtfgeclfydbgLcx2fgHIdwaaaeydbgicx2fgOIdwg8Y:tgIaINaHIdbaOIdbg81:tg8Va8VNaHIdlaOIdlgB:tgRaRNMMg8Zaaaecwfydbg8Fcx2fgeIdwa8Y:tg8PNaIaIa8PNa8VaeIdba81:tg8RNaRaeIdlaB:tg8UNMMg8SN:tJbbbbJbbjZa8Za8Pa8PNa8Ra8RNa8Ua8UNMMg80Na8Sa8SN:tg8X:va8XJbbbb9BEg8XNh83a80aINa8Pa8SN:ta8XNhUa8Za8UNaRa8SN:ta8XNh85a80aRNa8Ua8SN:ta8XNh86a8Za8RNa8Va8SN:ta8XNh87a80a8VNa8Ra8SN:ta8XNh88a8Va8UNa8RaRN:tg8Sa8SNaRa8PNa8UaIN:tg8Sa8SNaIa8RNa8Pa8VN:tg8Sa8SNMM:rJbbbZNh8Sayaia8J2g3cdtfhHaya8Fa8J2gwcdtfhOayaLa8J2g8LcdtfhCa8Y:mh89aB:mh8:a81:mhZcbhAa8JhYJbbbbh8UJbbbbh8XJbbbbh8ZJbbbbh80Jbbbbh8YJbbbbh81JbbbbhBJbbbbhnJbbbbhcinasc;WbfaAfgecwfa8SaUaCIdbaHIdbg8P:tgRNa83aOIdba8P:tg8RNMgINUdbaeclfa8Sa86aRNa85a8RNMg8VNUdbaea8Sa88aRNa87a8RNMgRNUdbaecxfa8Sa89aINa8:a8VNa8PaZaRNMMMg8PNUdba8SaIa8VNNa80Mh80a8SaIaRNNa8YMh8Ya8Sa8VaRNNa81Mh81a8Sa8Pa8PNNa8WMh8Wa8SaIa8PNNa8UMh8Ua8Sa8Va8PNNa8XMh8Xa8SaRa8PNNa8ZMh8Za8SaIaINNaBMhBa8Sa8Va8VNNanMhna8SaRaRNNacMhcaHclfhHaCclfhCaOclfhOaAczfhAaYcufgYmbkavaic8S2fgeacaeIdbMUdbaeanaeIdlMUdlaeaBaeIdwMUdwaea81aeIdxMUdxaea8YaeIdzMUdzaea80aeIdCMUdCaea8ZaeIdKMUdKaea8XaeId3MUd3aea8UaeIdaMUdaaea8WaeId8KMUd8Kaea8SaeIdyMUdyavaLc8S2fgeacaeIdbMUdbaeanaeIdlMUdlaeaBaeIdwMUdwaea81aeIdxMUdxaea8YaeIdzMUdzaea80aeIdCMUdCaea8ZaeIdKMUdKaea8XaeId3MUd3aea8UaeIdaMUdaaea8WaeId8KMUd8Kaea8SaeIdyMUdyava8Fc8S2fgeacaeIdbMUdbaeanaeIdlMUdlaeaBaeIdwMUdwaea81aeIdxMUdxaea8YaeIdzMUdzaea80aeIdCMUdCaea8ZaeIdKMUdKaea8XaeId3MUd3aea8UaeIdaMUdaaea8WaeId8KMUd8Kaea8SaeIdyMUdyara3cltfhYcbhHa8JhCinaYaHfgeasc;WbfaHfgOIdbaeIdbMUdbaeclfgAaOclfIdbaAIdbMUdbaecwfgAaOcwfIdbaAIdbMUdbaecxfgeaOcxfIdbaeIdbMUdbaHczfhHaCcufgCmbkara8LcltfhYcbhHa8JhCinaYaHfgeasc;WbfaHfgOIdbaeIdbMUdbaeclfgAaOclfIdbaAIdbMUdbaecwfgAaOcwfIdbaAIdbMUdbaecxfgeaOcxfIdbaeIdbMUdbaHczfhHaCcufgCmbkarawcltfhYcbhHa8JhCinaYaHfgeasc;WbfaHfgOIdbaeIdbMUdbaeclfgAaOclfIdbaAIdbMUdbaecwfgAaOcwfIdbaAIdbMUdbaecxfgeaOcxfIdbaeIdbMUdbaHczfhHaCcufgCmbkaKcifgKad6mbkkcbhOxekcehOcbhrkcbh8FdndnamcwGg9cmbJbbbbh8ZcbhJcbhocbhCxekcbhea5cbyd;S1jjbHjjjjbbhCascxfasyd2gHcdtfaCBdbasaHcefBd2dnalTmbaChHinaHaeBdbaHclfhHalaecefge9hmbkkdnaOmbcbhiinabaicdtfhLcbhKinaQaLaKcdtgec:G1jjbfydbcdtfydbcdtfydbhHdnaCaQaLaefydbcdtfydbgOcdtfgAydbgeaOSmbinaAaCaegOcdtfgYydbgeBdbaYhAaOae9hmbkkdnaCaHcdtfgAydbgeaHSmbinaAaCaegHcdtfgYydbgeBdbaYhAaHae9hmbkkdnaOaHSmbaCaOaHaOaH0EcdtfaOaHaOaH6EBdbkaKcefgKci9hmbkaicifgiad6mbkkcbhJdnalTmbcbhYindnaQaYcdtgefydbaY9hmbaYhHdnaCaefgKydbgeaYSmbaKhOinaOaCaegHcdtfgAydbgeBdbaAhOaHae9hmbkkaKaHBdbkaYcefgYal9hmbkcbheaQhOaChHcbhJindndnaeaOydbgA9hmbdnaeaHydbgA9hmbaHaJBdbaJcefhJxdkaHaCaAcdtfydbBdbxekaHaCaAcdtfydbBdbkaOclfhOaHclfhHalaecefge9hmbkkcuaJcltgeaJcjjjjiGEcbyd;S1jjbHjjjjbbhoascxfasyd2gHcdtfaoBdbasaHcefBd2aocbaez:ljjjbhAdnalTmbaChOaahealhYinaecwfIdbh8SaeclfIdbhIaAaOydbcltfgHaeIdbaHIdbMUdbaHclfgKaIaKIdbMUdbaHcwfgKa8SaKIdbMUdbaHcxfgHaHIdbJbbjZMUdbaOclfhOaecxfheaYcufgYmbkkdnaJTmbaAheaJhHinaecxfgOIdbh8SaOcbBdbaeaeIdbJbbbbJbbjZa8S:va8SJbbbb9BEg8SNUdbaeclfgOa8SaOIdbNUdbaecwfgOa8SaOIdbNUdbaeczfheaHcufgHmbkkdnalTmbaChOaahealhYinaAaOydbcltfgHcxfgKaecwfIdbaHcwfIdb:tg8Sa8SNaeIdbaHIdb:tg8Sa8SNaeclfIdbaHclfIdb:tg8Sa8SNMMg8SaKIdbgIaIa8S9DEUdbaOclfhOaecxfheaYcufgYmbkkdnaJmbcbhJJFFuuh8ZxekaAcxfheaAhHaJhOinaHaeIdbUdbaeczfheaHclfhHaOcufgOmbkJFFuuh8ZaAheaJhHinaeIdbg8Sa8Za8Za8S9EEh8ZaeclfheaHcufgHmbkkasydlh9ednalTmba9eclfhea9eydbhAaXhHalhYcbhOincbaeydbgKaA9RaHRbbcpeGEaOfhOaHcefhHaeclfheaKhAaYcufgYmbkaOce4h8Fkcuada8F9RcifgTcx2aTc;v:Q;v:Qe0Ecbyd;S1jjbHjjjjbbhDascxfasyd2gecdtfaDBdbasaecefBd2cuaTcdtaTcFFFFi0Ecbyd;S1jjbHjjjjbbhSascxfasyd2gecdtfaSBdbasaecefBd2a5cbyd;S1jjbHjjjjbbh8Mascxfasyd2gecdtfa8MBdbasaecefBd2alcbyd;S1jjbHjjjjbbh9hascxfasyd2gecdtfa9hBdbasaecefBd2axaxNa8NJbbjZamclGEg83a83N:vhcJbbbbhndnadak9nmbdnaTci6mba8Jclth9iaDcwfh6JbbbbhBJbbbbhninasclfabadalaQz:cjjjbabh8FcbhEcbh5inaba5cdtfh3cbheindnaQa8FaefydbgOcdtgifydbgYaQa3aec:W1jjbfydbcdtfydbgHcdtgwfydbgKSmbaXaHfRbbgLcv2aXaOfRbbgAfc;a1jjbfRbbg8AaAcv2aLfg8Lc;a1jjbfRbbg8KVcFeGTmbdnaKaY9nmba8Lcj1jjbfRbbcFeGmekaAcufhYdnaAaL9hmbaYcFeGce0mbahaifydbaH9hmekdndnaAclSmbaLcl9hmekdnaYcFeGce0mbahaifydbaH9hmdkaLcufcFeGce0mbagawfydbaO9hmekaDaEcx2fgAaHaOa8KcFeGgYEBdlaAaOaHaYEBdbaAaYa8AGcb9hBdwaEcefhEkaeclfgecx9hmbkdna5cifg5ad9pmba8Fcxfh8FaEcifaT9nmekkaETmdcbhiinJbbbbJbbjZaqaQaDaicx2fgAydlgKaAydbgYaAydwgHEgLcdtfydbc8S2fgeIdyg8S:va8SJbbbb9BEaeIdwaaaYaKaHEg8Fcx2fgHIdwgRNaeIdzaHIdbg8PNaeIdaMg8Sa8SMMaRNaeIdlaHIdlg8RNaeIdCaRNaeId3Mg8Sa8SMMa8RNaeIdba8PNaeIdxa8RNaeIdKMg8Sa8SMMa8PNaeId8KMMM:lNh80JbbbbJbbjZaqaQaYcdtfydbc8S2fgeIdyg8S:va8SJbbbb9BEaeIdwaaaKcx2fgHIdwg8VNaeIdzaHIdbg8WNaeIdaMg8Sa8SMMa8VNaeIdlaHIdlg8UNaeIdCa8VNaeId3Mg8Sa8SMMa8UNaeIdba8WNaeIdxa8UNaeIdKMg8Sa8SMMa8WNaeId8KMMM:lNh8YaAcwfh3aAclfhwdna8JTmbavaYc8S2fgOIdwa8VNaOIdza8WNaOIdaMg8Sa8SMMa8VNaOIdla8UNaOIdCa8VNaOId3Mg8Sa8SMMa8UNaOIdba8WNaOIdxa8UNaOIdKMg8Sa8SMMa8WNaOId8KMMMh8SayaKa8J2cdtfhHaraYa8J2cltfheaOIdyh8Xa8JhOinaHIdbgIaIa8XNaecxfIdba8VaecwfIdbNa8WaeIdbNa8UaeclfIdbNMMMgIaIM:tNa8SMh8SaHclfhHaeczfheaOcufgOmbkavaLc8S2fgOIdwaRNaOIdza8PNaOIdaMgIaIMMaRNaOIdla8RNaOIdCaRNaOId3MgIaIMMa8RNaOIdba8PNaOIdxa8RNaOIdKMgIaIMMa8PNaOId8KMMMhIaya8Fa8J2cdtfhHaraLa8J2cltfheaOIdyh8Wa8JhOinaHIdbg8Va8Va8WNaecxfIdbaRaecwfIdbNa8PaeIdbNa8RaeclfIdbNMMMg8Va8VM:tNaIMhIaHclfhHaeczfheaOcufgOmbka80aI:lMh80a8Ya8S:lMh8YkawaKa8Fa8Ya809FgeEBdbaAaYaLaeEBdba3a8Ya80aeEUdbaicefgiaE9hmbkasc;Wbfcbcj;qbz:ljjjb8Aa6heaEhHinasc;WbfaeydbcA4cF8FGgOcFAaOcFA6EcdtfgOaOydbcefBdbaecxfheaHcufgHmbkcbhecbhHinasc;WbfaefgOydbhAaOaHBdbaAaHfhHaeclfgecj;qb9hmbkcbhea6hHinasc;WbfaHydbcA4cF8FGgOcFAaOcFA6EcdtfgOaOydbgOcefBdbaSaOcdtfaeBdbaHcxfhHaEaecefge9hmbkadak9RgOci9Uh9kdnalTmbcbhea8MhHinaHaeBdbaHclfhHalaecefge9hmbkkcbh0a9hcbalz:ljjjbh9maOcO9Uh9na9kce4h9oasydwh9pcbh8KcbhwdninaDaSawcdtfydbcx2fg3Idwg8Sac9Emea8Ka9k9pmeJFFuuhIdna9oaE9pmbaDaSa9ocdtfydbcx2fIdwJbb;aZNhIkdna8SaI9ETmba8San9ETmba8Ka9n0mdkdna9maQa3ydlgicdtg9qfydbgAfg9rRbba9maQa3ydbgLcdtg9sfydbgHfg9tRbbVmbaXaLfRbbh9udna9eaHcdtfgeclfydbgOaeydbgeSmbaOae9RhKa9paecitfheaaaAcx2fg8Lcwfh5a8Lclfh9vaaaHcx2fg8Acwfh9wa8Aclfh9xcbhHceh8Fdnindna8MaeydbcdtfydbgOaASmba8MaeclfydbcdtfydbgYaASmbaOaYSmbaaaYcx2fgYIdbaaaOcx2fgOIdbg8V:tg8Sa9xIdbaOIdlgR:tg8WNa8AIdba8V:tg8UaYIdlaR:tgIN:tg8Pa8Sa9vIdbaR:tg8XNa8LIdba8V:tg80aIN:tgRNaIa9wIdbaOIdwg8R:tg8YNa8WaYIdwa8R:tg8VN:tg8WaIa5Idba8R:tg81Na8Xa8VN:tgINa8Va8UNa8Ya8SN:tg8Ra8Va80Na81a8SN:tg8SNMMa8Pa8PNa8Wa8WNa8Ra8RNMMaRaRNaIaINa8Sa8SNMMN:rJbbj8:N9FmdkaecwfheaHcefgHaK6h8FaKaH9hmbkka8FceGTmba9ocefh9oxeka3cwfhHdndndndna9uc9:fPdebdkaLheina8MaecdtgefaiBdba8EaefydbgeaL9hmbxikkdnagahaha9sfydbaiSEa8Ea9sfydbgLcdtfydbgecu9hmba8Ea9qfydbheka8Ma9sfaiBdbaehika8MaLcdtfaiBdbka9tce86bba9rce86bbaHIdbg8Sanana8S9DEhna0cefh0cecda9uceSEa8Kfh8KkawcefgwaE9hmbkka0TmddnalTmbcbhKcbhiindna8MaicdtgefydbgOaiSmbaQaOcdtfydbh8FdnaiaQaefydb9hg3mbaqa8Fc8S2fgeaqaic8S2fgHIdbaeIdbMUdbaeaHIdlaeIdlMUdlaeaHIdwaeIdwMUdwaeaHIdxaeIdxMUdxaeaHIdzaeIdzMUdzaeaHIdCaeIdCMUdCaeaHIdKaeIdKMUdKaeaHId3aeId3MUd3aeaHIdaaeIdaMUdaaeaHId8KaeId8KMUd8KaeaHIdyaeIdyMUdyka8JTmbavaOc8S2fgeavaic8S2gwfgHIdbaeIdbMUdbaeaHIdlaeIdlMUdlaeaHIdwaeIdwMUdwaeaHIdxaeIdxMUdxaeaHIdzaeIdzMUdzaeaHIdCaeIdCMUdCaeaHIdKaeIdKMUdKaeaHId3aeId3MUd3aeaHIdaaeIdaMUdaaeaHId8KaeId8KMUd8KaeaHIdyaeIdyMUdya9iaO2hLarhHa8JhAinaHaLfgeaHaKfgOIdbaeIdbMUdbaeclfgYaOclfIdbaYIdbMUdbaecwfgYaOcwfIdbaYIdbMUdbaecxfgeaOcxfIdbaeIdbMUdbaHczfhHaAcufgAmbka3mbJbbbbJbbjZaqawfgeIdyg8S:va8SJbbbb9BEaeIdwaaa8Fcx2fgHIdwg8SNaeIdzaHIdbgINaeIdaMg8Va8VMMa8SNaeIdlaHIdlg8VNaeIdCa8SNaeId3Mg8Sa8SMMa8VNaeIdbaINaeIdxa8VNaeIdKMg8Sa8SMMaINaeId8KMMM:lNg8SaBaBa8S9DEhBkaKa9ifhKaicefgial9hmbkcbhHahheindnaeydbgOcuSmbdnaHa8MaOcdtgAfydbgO9hmbcuhOahaAfydbgAcuSmba8MaAcdtfydbhOkaeaOBdbkaeclfhealaHcefgH9hmbkcbhHagheindnaeydbgOcuSmbdnaHa8MaOcdtgAfydbgO9hmbcuhOagaAfydbgAcuSmba8MaAcdtfydbhOkaeaOBdbkaeclfhealaHcefgH9hmbkkaBana8JEhBcbhYabhecbhKindna8MaeydbcdtfydbgHa8MaeclfydbcdtfydbgOSmbaHa8MaecwfydbcdtfydbgASmbaOaASmbabaYcdtfgLaHBdbaLcwfaABdbaLclfaOBdbaYcifhYkaecxfheaKcifgKad6mbkdndna9cTmbaYak9nmba8ZaB9FTmbcbhdabhecbhHindnaoaCaeydbgOcdtfydbcdtfIdbaB9ETmbabadcdtfgAaOBdbaAclfaeclfydbBdbaAcwfaecwfydbBdbadcifhdkaecxfheaHcifgHaY6mbkJFFuuh8ZaJTmeaoheaJhHJFFuuh8SinaeIdbgIa8Sa8SaI9EEg8Va8SaIaB9EgOEh8Sa8Va8ZaOEh8ZaeclfheaHcufgHmbxdkkaYhdkadak0mbxdkkasclfabadalaQz:cjjjbkdndnadak0mbadhOxekdna9cmbadhOxekdna8Zac9FmbadhOxekina8ZJbb;aZNg8Saca8Sac9DEh8VJbbbbh8SdnaJTmbaoheaJhHinaeIdbgIa8SaIa8V9FEa8SaIa8S9EEh8SaeclfheaHcufgHmbkkcbhOabhecbhHindnaoaCaeydbgAcdtfydbcdtfIdba8V9ETmbabaOcdtfgYaABdbaYclfaeclfydbBdbaYcwfaecwfydbBdbaOcifhOkaecxfheaHcifgHad6mbkJFFuuh8ZdnaJTmbaoheaJhHJFFuuhIinaeIdbgRaIaIaR9EEg8PaIaRa8V9EgAEhIa8Pa8ZaAEh8ZaeclfheaHcufgHmbkkdnaOad9hmbadhOxdka8Sanana8S9DEhnaOak9nmeaOhda8Zac9FmbkkdnamcjjjjlGTmbazmbaOTmbcbhQabheinaXaeydbgAfRbbc3thKaecwfgLydbhHdndnahaAcdtg8FfydbaeclfgiydbgCSmbcbhYagaCcdtfydbaA9hmekcjjjj94hYkaeaKaYVaAVBdbaXaCfRbbc3thKdndnahaCcdtfydbaHSmbcbhYagaHcdtfydbaC9hmekcjjjj94hYkaiaKaYVaCVBdbaXaHfRbbc3thYdndnahaHcdtfydbaASmbcbhCaga8FfydbaH9hmekcjjjj94hCkaLaYaCVaHVBdbaecxfheaQcifgQaO6mbkkdnazTmbaOTmbaOheinabazabydbcdtfydbBdbabclfhbaecufgembkkdnaPTmbaPa83an:rNUdbkasyd2gecdtascxffc98fhHdninaeTmeaHydbcbyd;O1jjbH:bjjjbbaHc98fhHaecufhexbkkasc;W;qbf8KjjjjbaOk;Yieouabydlhvabydbclfcbaicdtz:ljjjbhoadci9UhrdnadTmbdnalTmbaehwadhDinaoalawydbcdtfydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbxdkkaehwadhDinaoawydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbkkdnaiTmbcbhDaohwinawydbhqawaDBdbawclfhwaqaDfhDaicufgimbkkdnadci6mbinaecwfydbhwaeclfydbhDaeydbhidnalTmbalawcdtfydbhwalaDcdtfydbhDalaicdtfydbhikavaoaicdtfgqydbcitfaDBdbavaqydbcitfawBdlaqaqydbcefBdbavaoaDcdtfgqydbcitfawBdbavaqydbcitfaiBdlaqaqydbcefBdbavaoawcdtfgwydbcitfaiBdbavawydbcitfaDBdlawawydbcefBdbaecxfhearcufgrmbkkabydbcbBdbk;Podvuv998Jjjjjbca9RgvcFFF;7rBd3av9cFFF;7;3FF:;Fb83dCavcFFF97Bdzav9cFFF;7FFF:;u83dwdnadTmbaicd4hodnabmbdnalTmbcbhrinaealarcdtfydbao2cdtfhwcbhiinavcCfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavcwfaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxikkaocdthrcbhwincbhiinavcCfaifgDaeaifIdbgqaDIdbgkakaq9EEUdbavcwfaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkaearfheawcefgwad9hmbxdkkdnalTmbcbhrinabarcx2fgiaealarcdtfydbao2cdtfgwIdbUdbaiawIdlUdlaiawIdwUdwcbhiinavcCfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavcwfaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxdkkaocdthlcbhraehwinabarcx2fgiaearao2cdtfgDIdbUdbaiaDIdlUdlaiaDIdwUdwcbhiinavcCfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavcwfaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkawalfhwarcefgrad9hmbkkJbbbbavIdwavIdCgk:tgqaqJbbbb9DEgqavIdxavIdKgx:tgmamaq9DEgqavIdzavId3gm:tgPaPaq9DEhPdnabTmbadTmbJbbbbJbbjZaP:vaPJbbbb9BEhqinabaqabIdbak:tNUdbabclfgvaqavIdbax:tNUdbabcwfgvaqavIdbam:tNUdbabcxfhbadcufgdmbkkaPk8MbabaeadaialavcbcbcbcbcbaoarawaDz:bjjjbk8MbabaeadaialavaoarawaDaqakaxamaPz:bjjjbk:nCoDud99rue99lul998Jjjjjbc;Wb9Rgw8KjjjjbdndnarmbcbhDxekawcxfcbc;Kbz:ljjjb8Aawcuadcx2adc;v:Q;v:Qe0Ecbyd;S1jjbHjjjjbbgqBdxawceBd2aqaeadaicbz:djjjb8AawcuadcdtadcFFFFi0Egkcbyd;S1jjbHjjjjbbgxBdzawcdBd2adcd4adfhmceheinaegicetheaiam6mbkcbhPawcuaicdtgsaicFFFFi0Ecbyd;S1jjbHjjjjbbgzBdCawciBd2dndnar:ZgH:rJbbbZMgO:lJbbb9p9DTmbaO:Ohexekcjjjj94hekaicufhAc:bwhmcbhCadhXcbhQinaChLaeamgKcufaeaK9iEaPgDcefaeaD9kEhYdndnadTmbaYcuf:YhOaqhiaxheadhmindndnaiIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ljjjbh3cbh5cbh8Eindna3axa8EcdtfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbaeaCSmbcehiina3amaifaAGgmcdtfgEydbgecuSmeaicefhiaeaC9hmbkkaEaCBdba5aecuSfh5a8Ecefg8Ead9hmbxdkkazcFeasz:ljjjb8Acbh5kaDaYa5ar0giEhPaLa5aiEhCdna5arSmbaYaKaiEgmaP9Rcd9imbdndnaQcl0mbdnaX:ZgOaL:Zg8A:taY:Yg8FaD:Y:tgaa8FaK:Y:tgha5:ZggaH:tNNNaOaH:tahNa8Aag:tNa8AaH:taaNagaO:tNM:va8FMJbbbZMgO:lJbbb9p9DTmbaO:Ohexdkcjjjj94hexekaPamfcd9Theka5aXaiEhXaQcefgQcs9hmekkdndnaCmbcihicbhDxekcbhiawakcbyd;S1jjbHjjjjbbg8EBdKawclBd2aPcuf:Yh8AdndnadTmbaqhiaxheadhmindndnaiIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ljjjbh3cbhDcbh5inaxa5cdtgYfydbgCcm4aC7c:v;t;h;Ev2gics4ai7hecbhidndnina3aeaAGgmcdtfgEydbgecuSmednaxaecdtgEfydbaCSmbaicefgiamfheaiaA9nmekka8EaEfydbhixekaEa5BdbaDhiaDcefhDka8EaYfaiBdba5cefg5ad9hmbkcuaDc32giaDc;j:KM;jb0EhexekazcFeasz:ljjjb8AcbhDcbhekawaecbyd;S1jjbHjjjjbbgeBd3awcvBd2aecbaiz:ljjjbhEavcd4hxdnadTmbdnalTmbaxcdth3a8EhCalheaqhmadhAinaEaCydbc32fgiamIdbaiIdbMUdbaiamclfIdbaiIdlMUdlaiamcwfIdbaiIdwMUdwaiaeIdbaiIdxMUdxaiaeclfIdbaiIdzMUdzaiaecwfIdbaiIdCMUdCaiaiIdKJbbjZMUdKaCclfhCaea3fheamcxfhmaAcufgAmbxdkka8EhmaqheadhCinaEamydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiaiIdxJbbbbMUdxaiaiIdzJbbbbMUdzaiaiIdCJbbbbMUdCaiaiIdKJbbjZMUdKamclfhmaecxfheaCcufgCmbkkdnaDTmbaEhiaDheinaiaiIdbJbbbbJbbjZaicKfIdbgO:vaOJbbbb9BEgONUdbaiclfgmaOamIdbNUdbaicwfgmaOamIdbNUdbaicxfgmaOamIdbNUdbaiczfgmaOamIdbNUdbaicCfgmaOamIdbNUdbaic3fhiaecufgembkkcbhCawcuaDcdtgYaDcFFFFi0Egicbyd;S1jjbHjjjjbbgeBdaawcoBd2awaicbyd;S1jjbHjjjjbbg3Bd8KaecFeaYz:ljjjbh5dnadTmbJbbjZJbbjZa8A:vaPceSEaoNgOaONh8Aaxcdthxalheina8Aaec;C1jjbalEgmIdwaEa8EydbgAc32fgiIdC:tgOaONamIdbaiIdx:tgOaONamIdlaiIdz:tgOaONMMNaqcwfIdbaiIdw:tgOaONaqIdbaiIdb:tgOaONaqclfIdbaiIdl:tgOaONMMMhOdndna5aAcdtgifgmydbcuSmba3aifIdbaO9ETmekamaCBdba3aifaOUdbka8Eclfh8EaeaxfheaqcxfhqadaCcefgC9hmbkkaba5aYz:kjjjb8AcrhikaicdthiinaiTmeaic98fgiawcxffydbcbyd;O1jjbH:bjjjbbxbkkawc;Wbf8KjjjjbaDk:Odieui99iu8Jjjjjbca9RgicFFF;7rBd3ai9cFFF;7;3FF:;Fb83dCaicFFF97Bdzai9cFFF;7FFF:;u83dwdndnaembJbbjFhlJbbjFhvJbbjFhoxekadcd4cdthrcbhwincbhdinaicCfadfgDabadfIdbglaDIdbgvaval9EEUdbaicwfadfgDalaDIdbgvaval9DEUdbadclfgdcx9hmbkabarfhbawcefgwae9hmbkaiIdzaiId3:thoaiIdxaiIdK:thvaiIdwaiIdC:thlkJbbbbalalJbbbb9DEglavaval9DEglaoaoal9DEk9DeeuabcFeaicdtz:ljjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk9teiucbcbyd;W1jjbgeabcifc98GfgbBd;W1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;W1jjbgeabcrfc94GfgbBd;W1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;W1jjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;W1jjbfgdBd;W1jjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akk6eiucbhidnadTmbdninabRbbglaeRbbgv9hmeaecefheabcefhbadcufgdmbxdkkalav9Rhikaikk:bedbcjwk9Oeeebeebebbeeebebbbbbebebbbbbbbbbebbbdbbbbbbbebbbebbbdbbbbbbbbbbbeeeeebebbebbebebbbeebbbbbbbbbbbbbbbbbbbbbc;OwkxebbbdbbbjNbb"), {}).then(function(r) {
    (h = r.instance).exports.__wasm_call_ctors();
  });
  function t(r) {
    if (!r) throw new Error("Assertion failed");
  }
  function A(r) {
    return new Uint8Array(r.buffer, r.byteOffset, r.byteLength);
  }
  function i(r, n, o, c, b, g, l, d) {
    var f = h.exports.sbrk, I = f(4 * d), m = f(o * c), u = f(o * g), C = new Uint8Array(h.exports.memory.buffer);
    C.set(A(n), m), b && C.set(A(b), u);
    var B = r(I, m, o, c, u, g, l, d);
    new Uint8Array(h.exports.memory.buffer);
    var w = new Uint32Array(B);
    return A(w).set(C.subarray(I, I + 4 * B)), f(I - f(0)), w;
  }
  var s = { LockBorder: 1, Sparse: 2, ErrorAbsolute: 4, Prune: 8, _InternalDebug: 1 << 30 };
})(), function() {
  var h, e = new Uint8Array([32, 0, 65, 2, 1, 106, 34, 33, 3, 128, 11, 4, 13, 64, 6, 253, 10, 7, 15, 116, 127, 5, 8, 12, 40, 16, 19, 54, 20, 9, 27, 255, 113, 17, 42, 67, 24, 23, 146, 148, 18, 14, 22, 45, 70, 69, 56, 114, 101, 21, 25, 63, 75, 136, 108, 28, 118, 29, 73, 115]);
  if (typeof WebAssembly != "object") return { supported: !1 };
  var a = WebAssembly.instantiate(function(s) {
    for (var r = new Uint8Array(s.length), n = 0; n < s.length; ++n) {
      var o = s.charCodeAt(n);
      r[n] = o > 96 ? o - 97 : o > 64 ? o - 39 : o + 4;
    }
    var c = 0;
    for (n = 0; n < s.length; ++n) r[c++] = r[n] < 60 ? e[r[n]] : 64 * (r[n] - 60) + r[++n];
    return r.buffer.slice(0, c);
  }("b9H79Tebbbefx9Geueu9Geub9Gbb9Giuuueu9Gkuuuuuuuuuu99eu9Gvuuuuueu9Gkuuuuuuuuu9999eu9Gruuuuuuub9Gkuuuuuuuuuuueu9Gouuuuuub9Giuuub9GluuuubiOHdilvorwDqrkbiibeilve9Weiiviebeoweuec:q:Odkr:Yewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9I919P29K9nW79O2Wt79c9V919U9KbeX9TW79O9V9Wt9F9I919P29K9nW79O2Wt7bd39TW79O9V9Wt9F9J9V9T9W91tWJ2917tWV9c9V919U9K7br39TW79O9V9Wt9F9J9V9T9W91tW9nW79O2Wt9c9V919U9K7bDL9TW79O9V9Wt9F9V9Wt9P9T9P96W9nW79O2Wtbql79IV9RbkDwebcekdsPq;L9kHdbkIbabaec9:fgefcufae9Ugeabci9Uadfcufad9Ugbaeab0Ek:oAlPue99eux998Jjjjjbc:We9Rgk8Kjjjjbakc;mbfcbc;Kbz:njjjb8AakcuaocdtgxaocFFFFi0Egmcbyd:e1jjbHjjjjbbgPBd9makceBd:SeakaPBdnakamcbyd:e1jjbHjjjjbbgsBd9qakcdBd:SeakasBd9eakcualcdtalcFFFFi0Ecbyd:e1jjbHjjjjbbgzBd9uakazBd9iakciBd:SeaPcbaxz:njjjbhHalci9UhOdnalTmbaihPalhAinaHaPydbcdtfgCaCydbcefBdbaPclfhPaAcufgAmbkkdnaoTmbcbhPashAaHhCaohXinaAaPBdbaAclfhAaCydbaPfhPaCclfhCaXcufgXmbkkdnalci6mbcbhPaihAinaAcwfydbhCaAclfydbhXasaAydbcdtfgQaQydbgQcefBdbazaQcdtfaPBdbasaXcdtfgXaXydbgXcefBdbazaXcdtfaPBdbasaCcdtfgCaCydbgCcefBdbazaCcdtfaPBdbaAcxfhAaOaPcefgP9hmbkkdnaoTmbaHhAashPaohCinaPaPydbaAydb9RBdbaAclfhAaPclfhPaCcufgCmbkkakamcbyd:e1jjbHjjjjbbgPBd9yakclBd:SeaPaHaxz:mjjjbhmakaOcbyd:e1jjbHjjjjbbgPBd9CakcvBd:SeaPcbaOz:njjjbhLakcuaOcK2alcjjjjd0Ecbyd:e1jjbHjjjjbbgKBd9GakcoBd:SeJbbbbhYdnalci6g8Ambarcd4hxaihAaKhPaOhrJbbbbhEinavaAclfydbax2cdtfgCIdlh3avaAydbax2cdtfgXIdlhYavaAcwfydbax2cdtfgQIdlh5aCIdwh8EaXIdwh8FaQIdwhaaPaCIdbghaXIdbggMaQIdbg8JMJbbnn:vUdbaPclfaXIdlaCIdlMaQIdlMJbbnn:vUdbaQIdwh8KaCIdwh8LaXIdwh8MaPcxfa3aY:tg3aaa8F:tgaNa5aY:tg5a8Ea8F:tg8EN:tgYJbbbbJbbjZahag:tgha5Na8Jag:tgga3N:tg8Fa8FNaYaYNa8EagNaaahN:tgYaYNMM:rgg:vagJbbbb9BEg3NUdbaPczfaYa3NUdbaPcCfa8Fa3NUdbaPcwfa8Ka8Ma8LMMJbbnn:vUdbaEagMhEaAcxfhAaPcKfhParcufgrmbkaEaO:Z:vJbbbZNhYkakcuaOcdtalcFFFF970Ecbyd:e1jjbHjjjjbbgCBd9KakcrBd:SeaYaD:ZN:rhYdna8AmbcbhPaChAinaAaPBdbaAclfhAaOaPcefgP9hmbkkaYJbbbZNh8MakcuaOcltalcFFFFd0Ecbyd:e1jjbHjjjjbbg8ABd9OakcwBd:Secba8AaKaCaOz:djjjb8Aakaocbyd:e1jjbHjjjjbbgPBd2aPcFeaoz:njjjbhrakc8Wfcwf9cb83ibak9cb83i8WcbhPJbbbbhEJbbbbh5Jbbbbh8EJbbbbhYJbbbbh8FJbbbbhgcbhlinJbbbbh3dnaPTmbJbbjZaP:Z:vh3kaka8Ea3NgaUdaaka5a3NghUd3akaEa3Ng8JUdKJbbbbh3dnagagNaYaYNa8Fa8FNMMg8KJbbbb9BmbJbbjZa8K:r:vh3kakaga3NUd8Saka8Fa3NUdyakaYa3NUd8Kdndndnakyd8WgQakydUgAakcKfaeaiakc;abfaKamara8Maqz:ejjjbgCcuSmbdnaPaD9pmbaAaraiaCcx2fgXydbfRbbcFeSfaraXclfydbfRbbcFeSfaraXcwfydbfRbbcFeSfaw9nmdkaQaAcbaeaiakc;abfaKamara8MJbbbbz:ejjjbgCcu9hmekakaaUdCakahUdzaka8JUdxakcuBdwakcFFF;7rBdla8AcbaKaLakcxfakcwfakclfz:fjjjbakydwgCcuSmekdnakc8WfaiaCcx2fgOydbgPaOclfydbgAaOcwfydbgXarabaeadalawaDz:gjjjbTmbalcefhlJbbbbhEJbbbbh5Jbbbbh8EJbbbbhYJbbbbh8FJbbbbhgkamaPcdtfgPaPydbcufBdbamaAcdtfgPaPydbcufBdbamaXcdtfgPaPydbcufBdbcbhXinazasaOaXcdtfydbcdtgAfydbcdtfgxhPaHaAfgvydbgQhAdnaQTmbdninaPydbaCSmeaPclfhPaAcufgATmdxbkkaPaxaQcdtfc98fydbBdbavavydbcufBdbkaXcefgXci9hmbkaKaCcK2fgPIdbh3aPIdlhaaPIdwhhaPIdxh8JaPIdzh8KaPIdCh8LaLaCfce86bbaga8LMhga8Fa8KMh8FaYa8JMhYa8EahMh8Ea5aaMh5aEa3MhEakyd88hPxekkdnaPTmbdnakyd80gAaPci2fgCciGTmbadaCfcbaPaAcu7fciGcefz:njjjb8AkabalcltfgPak8Pi8W83dbaPcwfakc8Wfcwf8Pib83dbalcefhlkcahPdninaPc98Smeakc;mbfaPfydbcbydj1jjbH:bjjjbbaPc98fhPxbkkakc:Wef8Kjjjjbalk;3vivuv99lu8Jjjjjbca9Rgv8Kjjjjbdndnalcw0mbaiydbhoaeabcitfgralcdtcufBdlaraoBdbdnalcd6mbaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkkalabfhrxekcbhDavczfcwfcbBdbav9cb83izavcwfcbBdbav9cb83ibJbbjZhqJbbjZhkinadaiaDcdtfydbcK2fhwcbhrinavczfarfgoawarfIdbgxaoIdbgm:tgPakNamMgmUdbavarfgoaPaxam:tNaoIdbMUdbarclfgrcx9hmbkJbbjZaqJbbjZMgq:vhkaDcefgDal9hmbkcbhoadcbcecdavIdlgxavIdwgm9GEgravIdbgPam9GEaraPax9GEgscdtgrfhzavczfarfIdbhxaihralhwinaiaocdtfgDydbhHaDarydbgOBdbaraHBdbarclfhraoazaOcK2fIdbax9Dfhoawcufgwmbkaeabcitfhrdndnaocv6mbaoalc98f6mekaraiydbBdbaralcdtcufBdlaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkalabfhrxekaraxUdbaeabcitfgrarydlc98GasVBdlabcefaeadaiaoz:djjjbhwararydlciGawabcu7fcdtVBdlawaeadaiaocdtfalao9Rz:djjjbhrkavcaf8Kjjjjbark;Bloeue99vue99Due99dndnaembcuhkxekJbbjZaq:thxaiabcdtfhmavydbhPavydlhsavydwhzcbhHJFFuuhOcvhbcuhkindnaPamaHcdtfydbcdtgvfydbgATmbazasavfydbcdtfhiindndnawalaiydbgCcx2fgvclfydbgXfRbbcFeSawavydbgQfRbbcFeSfawavcwfydbgLfRbbcFeSfgKmbcbhvxekcehvaraQcdtfydbgYceSmbcehvaraXcdtfydbg8AceSmbcehvaraLcdtfydbgEceSmbdna8AcdSaYcdSfaEcdSfcd6mbaKcefhvxekaKcdfhvkdnavab9kmbdndnadTmbaoaCcK2fgQIdwadIdw:tg3a3NaQIdbadIdb:tg3a3NaQIdladIdl:tg3a3NMM:raD:vaxNJbbjZMJ9VO:d86JbbjZaQIdCadIdCNaQIdxadIdxNaQIdzadIdzNMMaqN:tg3a3J9VO:d869DENh3xekaraQcdtfydbaraXcdtfydbfaraLcdtfydbfc99f:Zh3kaCakavab6a3aO9DVgQEhkavabaQEhba3aOaQEhOkaiclfhiaAcufgAmbkkaHcefgHae9hmbkkakk;bddlue99dndndnabaecitfgrydlgwciGgDci9hmbarclfhqxekinabcbawcd4gwalaDcdtfIdbabaecitfIdb:tgkJbbbb9FEgDaecefgefadaialavaoz:fjjjbak:laoIdb9FTmdabaDaw7aefgecitfgrydlgwciGgDci9hmbkarclfhqkabaecitfhecuhbindnaiaeydbgDfRbbmbadaDcK2fgrIdwalIdw:tgkakNarIdbalIdb:tgkakNarIdlalIdl:tgkakNMM:rgkaoIdb9DTmbaoakUdbavaDBdbaqydbhwkaecwfheabcefgbawcd46mbkkk;yleoudnaladfgkRbbcFeSalaefgxRbbgmcFeSfabydwgPfalaifgsRbbcFeSfaD0abydxaq9pVgzce9hmbavawcltfgmab8Pdb83dbamcwfabcwfgm8Pdb83dbdndnamydbmbcbhqxekcbhDaohminalamabydbcdtfydbfcFe86bbamclfhmaDcefgDabydwgq6mbkkdnabydxglci2gDabydlgmfgPciGTmbaraPfcbalamcu7fciGcefz:njjjb8Aabydxci2hDabydlhmabydwhqkab9cb83dwababydbaqfBdbabaDcifc98GamfBdlaxRbbhmcbhPkdnamcFeGcFe9hmbaxaP86bbababydwgmcefBdwaoabydbcdtfamcdtfaeBdbkdnakRbbcFe9hmbakabydw86bbababydwgmcefBdwaoabydbcdtfamcdtfadBdbkdnasRbbcFe9hmbasabydw86bbababydwgmcefBdwaoabydbcdtfamcdtfaiBdbkarabydlfabydxci2faxRbb86bbarabydlfabydxci2fcefakRbb86bbarabydlfabydxci2fcdfasRbb86bbababydxcefBdxazk;Ckovud99euv99eul998Jjjjjbc:G;ae9Rgo8KjjjjbdndnadTmbavcd4hrcbhwcbhDindnaiaeclfydbar2cdtfgvIdbaiaeydbar2cdtfgqIdbgk:tgxaiaecwfydbar2cdtfgmIdlaqIdlgP:tgsNamIdbak:tgzavIdlaP:tgPN:tgkakNaPamIdwaqIdwgH:tgONasavIdwaH:tgHN:tgPaPNaHazNaOaxN:tgxaxNMM:rgsJbbbb9Bmbaoc:G:qefawcx2fgAakas:vUdwaAaxas:vUdlaAaPas:vUdbaocafawc8K2fgAaq8Pdb83dbaAav8Pdb83dxaAam8Pdb83dKaAcwfaqcwfydbBdbaAcCfavcwfydbBdbaAcafamcwfydbBdbawcefhwkaecxfheaDcifgDad6mbkab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbawTmeao9cb83iKao9cb83izaoczfaocafawci2z1jjjbaoIdKhCaoIdChXaoIdzhQao9cb83iwao9cb83ibaoaoc:G:qefawz1jjjbJbbjZhkaoIdwgPJbbbbJbbjZaPaPNaoIdbgPaPNaoIdlgsasNMM:rgx:vaxJbbbb9BEgzNhxasazNhsaPazNhzaoc:G:qefheawhvinaecwfIdbaxNaeIdbazNasaeclfIdbNMMgPakaPak9DEhkaecxfheavcufgvmbkabaCUdwabaXUdlabaQUdbabaoId3UdxdndnakJ;n;m;m899FmbJbbbbhPaoc:G:qefheaocafhvinaCavcwfIdb:taecwfIdbgHNaQavIdb:taeIdbgONaXavclfIdb:taeclfIdbgLNMMaxaHNazaONasaLNMM:vgHaPaHaP9EEhPavc8KfhvaecxfheawcufgwmbkabazUd3abc8KfaxUdbabcafasUdbabcKfaCaxaPN:tUdbabcCfaXasaPN:tUdbabaQazaPN:tUdzabJbbjZakakN:t:rgkUdydndnaxJbbj:;axJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;axJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohexekcjjjj94hekabc8Ufae86bbdndnasJbbj:;asJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;asJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkabcRfav86bbdndnazJbbj:;azJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;azJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohqxekcjjjj94hqkabaq86b8SdndnaecKtcK91:YJbb;:9c:vax:t:lavcKtcK91:YJbb;:9c:vas:t:laqcKtcK91:YJbb;:9c:vaz:t:lakMMMJbb;:9cNJbbjZMgk:lJbbb9p9DTmbak:Ohexekcjjjj94hekaecFbaecFb9iEhexekabcjjj;8iBdycFbhekabae86b8Vxekab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbkaoc:G;aef8Kjjjjbk:mvdouq99cbhi8Jjjjjbca9RglczfcwfcbBdbal9cb83izalcwfcbBdbal9cb83ibdnadTmbcbhvinaeaifhocbhrinalczfarfgwavawydbgwaoarfIdbgDaearawcx2ffIdb9DEBdbalarfgwavawydbgwaDaearawcx2ffIdb9EEBdbarclfgrcx9hmbkaicxfhiavcefgvad9hmbkkJbbbbhDcbhrcbhicbhvinaealarfydbcx2fgwIdwaealczfarfydbcx2fgoIdw:tgqaqNawIdbaoIdb:tgqaqNawIdlaoIdl:tgqaqNMMgqaDaqaD9EgwEhDavaiawEhiarclfhravcefgvci9hmbkaealczfaicdtgvfydbcx2fgrIdwaealavfydbcx2fglIdwMJbbbZNhqarIdlalIdlMJbbbZNhkarIdbalIdbMJbbbZNhxaD:rJbbbZNhDdnadTmbindnaecwfIdbgmaq:tgPaPNaeIdbgsax:tgPaPNaeclfIdbgzak:tgPaPNMMgPaDaDN9ETmbaqaDaP:rgH:vJbbbZNJbbbZMgPNamJbbjZaP:tgONMhqakaPNazaONMhkaxaPNasaONMhxaDaHMJbbbZNhDkaecxfheadcufgdmbkkabaDUdxabaqUdwabakUdlabaxUdbkjeeiu8Jjjjjbcj8W9Rgr8Kjjjjbaici2hwdnaiTmbawceawce0EhDarhiinaiaeadRbbcdtfydbBdbadcefhdaiclfhiaDcufgDmbkkabarawaladaoz:hjjjbarcj8Wf8Kjjjjbk:Ylequ8Jjjjjbcjx9Rgl8Kjjjjbcbhvalcjqfcbaiz:njjjb8AdndnadTmbcjehoaehrincuhwarhDcuhqavhkdninawakaoalcjqfaDcefRbbfRbb9RcFeGci6aoalcjqfaDRbbfRbb9RcFeGci6faoalcjqfaDcdfRbbfRbb9RcFeGci6fgxaq9mgmEhwdnammbaxce0mdkaxaqaxaq9kEhqaDcifhDadakcefgk9hmbkkaeawci2fgDcdfRbbhqaDcefRbbhxaDRbbhkaeavci2fgDcifaDawav9Rci2z:qjjjb8Aakalcjqffaocefgo86bbaxalcjqffao86bbaDcdfaq86bbaDcefax86bbaDak86bbaqalcjqffao86bbarcifhravcefgvad9hmbkalcFeaiz:njjjbhoadci2gDceaDce0EhqcbhxindnaoaeRbbgkfgwRbbgDcFe9hmbawax86bbaocjdfaxcdtfabakcdtfydbBdbaxhDaxcefhxkaeaD86bbaecefheaqcufgqmbkaxcdthDxekcbhDkabalcjdfaDz:mjjjb8Aalcjxf8Kjjjjbk9teiucbcbyd11jjbgeabcifc98GfgbBd11jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd11jjbgeabcrfc94GfgbBd11jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd11jjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd11jjbfgdBd11jjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akk:;Deludndndnadch9pmbabaeSmdaeabadfgi9Rcbadcet9R0mekabaead;8qbbxekaeab7ciGhldndndnabae9pmbdnalTmbadhvabhixikdnabciGmbadhvabhixdkadTmiabaeRbb86bbadcufhvdnabcefgiciGmbaecefhexdkavTmiabaeRbe86beadc9:fhvdnabcdfgiciGmbaecdfhexdkavTmiabaeRbd86bdadc99fhvdnabcifgiciGmbaecifhexdkavTmiabaeRbi86biabclfhiaeclfheadc98fhvxekdnalmbdnaiciGTmbadTmlabadcufgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc9:fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc99fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc98fgdfaeadfRbb86bbkadcl6mbdnadc98fgocd4cefciGgiTmbaec98fhlabc98fhvinavadfaladfydbBdbadc98fhdaicufgimbkkaocx6mbaec9Wfhvabc9WfhoinaoadfgicxfavadfglcxfydbBdbaicwfalcwfydbBdbaiclfalclfydbBdbaialydbBdbadc9Wfgdci0mbkkadTmdadhidnadciGglTmbaecufhvabcufhoadhiinaoaifavaifRbb86bbaicufhialcufglmbkkadcl6mdaec98fhlabc98fhvinavaifgecifalaifgdcifRbb86bbaecdfadcdfRbb86bbaecefadcefRbb86bbaeadRbb86bbaic98fgimbxikkavcl6mbdnavc98fglcd4cefcrGgdTmbavadcdt9RhvinaiaeydbBdbaeclfheaiclfhiadcufgdmbkkalc36mbinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaiaeydzBdzaiaeydCBdCaiaeydKBdKaiaeyd3Bd3aecafheaicafhiavc9Gfgvci0mbkkavTmbdndnavcrGgdmbavhlxekavc94GhlinaiaeRbb86bbaicefhiaecefheadcufgdmbkkavcw6mbinaiaeRbb86bbaiaeRbe86beaiaeRbd86bdaiaeRbi86biaiaeRbl86blaiaeRbv86bvaiaeRbo86boaiaeRbr86braicwfhiaecwfhealc94fglmbkkabkkAebcjwkxebbbdbbbzNbb"), {}).then(function(s) {
    (h = s.instance).exports.__wasm_call_ctors();
  });
  function t(s) {
    if (!s) throw new Error("Assertion failed");
  }
  function A(s) {
    return new Uint8Array(s.buffer, s.byteOffset, s.byteLength);
  }
  function i(s) {
    var r = new Float32Array(h.exports.memory.buffer, s, 12);
    return { centerX: r[0], centerY: r[1], centerZ: r[2], radius: r[3], coneApexX: r[4], coneApexY: r[5], coneApexZ: r[6], coneAxisX: r[7], coneAxisY: r[8], coneAxisZ: r[9], coneCutoff: r[10] };
  }
}();
let ae = 0;
class Ui {
  constructor(e) {
    if (this.downloadParallelism = e.downloadParallelism == null ? 8 : e.downloadParallelism, this.timeout = e.timeout != null ? e.timeout : 5e3, this.renderer = e.renderer, this.zUpToYUpMatrix = new E.Matrix4(), this.zUpToYUpMatrix.set(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1), this.maxCachedItems = 100, this.proxy = e.proxy, e && (this.meshCallback = e.meshCallback, this.pointsCallback = e.pointsCallback, e.maxCachedItems != null && (this.maxCachedItems = e.maxCachedItems)), this.gltfLoader = new Dt(), e && e.dracoLoader) this.gltfLoader.setDRACOLoader(e.dracoLoader), this.hasDracoLoader = !0;
    else {
      const a = new Rt();
      a.setDecoderPath("https://storage.googleapis.com/ogc-3d-tiles/draco/"), this.dracoLoader = a, this.gltfLoader.setDRACOLoader(a), this.gltfLoader.hasDracoLoader = !0;
    }
    if (e && e.ktx2Loader) this.gltfLoader.setKTX2Loader(e.ktx2Loader), this.hasKTX2Loader = !0;
    else if (e && e.renderer) {
      const a = new L();
      a.setTranscoderPath("https://storage.googleapis.com/ogc-3d-tiles/basis/").detectSupport(e.renderer), this.ktx2loader = a, this.gltfLoader.setKTX2Loader(a), this.gltfLoader.hasKTX2Loader = !0;
    }
    this.gltfLoader.setMeshoptDecoder(Vt), this.hasMeshOptDecoder = !0, this.b3dmDecoder = new jt(this.gltfLoader), this.splatsDecoder = new VA(this.gltfLoader, this.renderer), this.cache = new kt(), this.register = {}, this.ready = [], this.downloads = [], this.nextReady = [], this.nextDownloads = [];
  }
  update() {
    const e = this;
    ae < e.downloadParallelism && e._download(), e._loadBatch();
  }
  _scheduleDownload(e) {
    this.downloads.unshift(e);
  }
  _download() {
    if (this.nextDownloads.length != 0 || (this._getNextDownloads(), this.nextDownloads.length != 0)) for (; this.nextDownloads.length > 0; ) {
      const e = this.nextDownloads.shift();
      e && e.shouldDoDownload() && e.doDownload();
    }
  }
  _meshReceived(e, a, t, A, i, s, r) {
    this.ready.unshift([e, a, t, A, i, s, r]);
  }
  _loadBatch() {
    for (this.nextReady.length == 0 && this._getNextReady(); this.nextReady.length > 0; ) {
      const e = this.nextReady.shift();
      if (!e) return;
      const a = e[0], t = e[1], A = e[2], i = a.get(A);
      i && t[A] && Object.keys(t[A]).forEach((s) => {
        const r = t[A][s];
        r && (r(i), t[A][s] = null);
      }), this.nextReady.length == 0 && this._getNextReady();
    }
  }
  _getNextDownloads() {
    let e = Number.POSITIVE_INFINITY, a = -1;
    for (let r = this.downloads.length - 1; r >= 0; r--) this.downloads[r].shouldDoDownload() ? this.downloads[r].distanceFunction || this.nextDownloads.push(this.downloads.splice(r, 1)[0]) : this.downloads.splice(r, 1);
    if (this.nextDownloads.length > 0) return;
    let t, A = 0, i = Number.MAX_SAFE_INTEGER, s = -1;
    for (let r = this.downloads.length - 1; r >= 0; r--) {
      const n = this.downloads[r].distanceFunction();
      n <= e && (e = n, a = r), A = Math.max(this.downloads[r].level), this.downloads[r].loadingStrategy != "IMMEDIATE" && this.downloads[r].level < i && (i = this.downloads[r].level, s = r);
    }
    if (A > i + 4 ? t = this.downloads.splice(s, 1).pop() : a >= 0 && (t = this.downloads.splice(a, 1).pop()), t) {
      this.nextDownloads.push(t);
      const r = t.getSiblings();
      for (let n = this.downloads.length - 1; n >= 0; n--) r.map((o) => o.uuid).includes(this.downloads[n].uuid) && this.nextDownloads.push(this.downloads.splice(n, 1).pop());
    }
  }
  _getNextReady() {
    let e = Number.POSITIVE_INFINITY, a = -1;
    for (let t = this.ready.length - 1; t >= 0; t--) this.ready[t][3] || this.nextReady.push(this.ready.splice(t, 1)[0]);
    if (!(this.nextReady.length > 0)) {
      for (let t = this.ready.length - 1; t >= 0; t--) {
        const A = this.ready[t][3]() * this.ready[t][5];
        A <= e && (e = A, a = t);
      }
      if (a >= 0) {
        const t = this.ready.splice(a, 1).pop();
        this.nextReady.push(t);
        const A = t[4]();
        for (let i = this.ready.length - 1; i >= 0; i--) A.map((s) => s.uuid).includes(this.ready[i][6]) && this.nextReady.push(this.ready.splice(i, 1).pop());
      }
    }
  }
  get(e, a, t, A, i, s, r, n, o, c, b, g) {
    const l = this, d = ot(t), f = new AbortController();
    if (e.signal.addEventListener("abort", () => {
      l.register[d] && Object.keys(l.register[d]).length != 0 || f.abort("user abort");
    }), !(t.includes(".b3dm") || t.includes(".json") || t.includes(".gltf") || t.includes(".glb"))) return void console.error("the 3DTiles cache can only be used to load B3DM, gltf and json data");
    if (l.register[d] || (l.register[d] = {}), l.register[d][a] && console.error(" a tile should only be loaded once"), l.register[d][a] = A, l.cache.get(d)) this._meshReceived(l.cache, l.register, d, i, s, r, a);
    else {
      let I;
      t.includes(".b3dm") ? I = () => {
        var m;
        m = l.proxy ? () => fetch(l.proxy, { method: "POST", body: t, signal: f.signal }) : () => fetch(t, { signal: f.signal }), ae++, m().then((u) => {
          if (!u.ok) throw console.error("could not load tile with path : " + t), new Error(`couldn't load "${t}". Request failed with status ${u.status} : ${u.statusText}`);
          return u.arrayBuffer();
        }).then((u) => this.b3dmDecoder.parseB3DM(u, (C) => {
          l.meshCallback(C, b);
        }, o, c)).then((u) => {
          l.cache.put(d, u), this._meshReceived(l.cache, l.register, d, i, s, r, a), l._checkSize();
        }).catch((u) => {
        }).finally(() => {
          ae--;
        });
      } : t.includes(".glb") || t.includes(".gltf") ? I = g ? () => {
        var m;
        m = l.proxy ? () => fetch(l.proxy, { method: "POST", body: t, signal: f.signal }) : () => fetch(t, { signal: f.signal }), ae++, m().then((u) => {
          if (!u.ok) throw console.error("could not load tile with path : " + t), new Error(`couldn't load "${t}". Request failed with status ${u.status} : ${u.statusText}`);
          return u.arrayBuffer();
        }).then((u) => this.splatsDecoder.parseSplats(u, o, c, g)).then((u) => {
          l.cache.put(d, u), l._meshReceived(l.cache, l.register, d, i, s, r, a), l._checkSize();
        }).catch((u) => {
        }).finally(() => {
          ae--;
        });
      } : () => {
        var m;
        m = l.proxy ? () => fetch(l.proxy, { method: "POST", body: t, signal: f.signal }) : () => fetch(t, { signal: f.signal }), ae++, m().then((u) => {
          if (!u.ok) throw console.error("could not load tile with path : " + t), new Error(`couldn't load "${t}". Request failed with status ${u.status} : ${u.statusText}`);
          return u.arrayBuffer();
        }).then(async (u) => {
          await async function(C) {
            return new Promise((B) => {
              const w = setInterval(() => {
                C.hasDracoLoader && !C.dracoLoader || C.hasKTX2Loader && !C.ktx2Loader || (clearInterval(w), B());
              }, 10);
            });
          }(this.gltfLoader), this.gltfLoader.parse(u, null, (C) => {
            C.scene.asset = C.asset, o && C.scene.applyMatrix4(this.zUpToYUpMatrix), C.scene.traverse((B) => {
              B.isMesh && (c && B.applyMatrix4(this.zUpToYUpMatrix), l.meshCallback && l.meshCallback(B, b)), B.isPoints && l.pointsCallback && l.pointsCallback(B, b);
            }), l.cache.put(d, C.scene), l._meshReceived(l.cache, l.register, d, i, s, r, a), l._checkSize();
          });
        }).catch((u) => {
          u !== "user abort" && u.code;
        }).finally(() => {
          ae--;
        });
      } : t.includes(".json") && (I = () => {
        var m;
        m = l.proxy ? () => fetch(l.proxy, { method: "POST", body: t, signal: f.signal }) : () => fetch(t, { signal: f.signal }), ae++, m().then((u) => {
          if (!u.ok) throw console.error("could not load tile with path : " + t), new Error(`couldn't load "${t}". Request failed with status ${u.status} : ${u.statusText}`);
          return u.json();
        }).then((u) => Ma(u, t)).then((u) => {
          l.cache.put(d, u), l._meshReceived(l.cache, l.register, d), l._checkSize();
        }).catch((u) => {
          console.error(u);
        }).finally(() => {
          ae--;
        });
      }), this._scheduleDownload({ shouldDoDownload: () => !e.signal.aborted && !!l.register[d] && Object.keys(l.register[d]).length > 0 && !l.cache.get(d), doDownload: I, distanceFunction: i, getSiblings: s, level: r, loadingStrategy: n, uuid: a });
    }
  }
  clear() {
    const e = this.maxCachedItems;
    this.maxCachedItems = 0, this._checkSize(), this.maxCachedItems = e;
  }
  invalidate(e, a) {
    const t = ot(e), A = this;
    A.register[t] && setTimeout(() => {
      A.register && A.register[t] && (delete A.register[t][a], A._checkSize());
    }, A.timeout);
  }
  dispose() {
    let e = this.cache.head();
    for (this._disposeEntryContent(e); (e = e.next()).key != null; ) this._disposeEntryContent(e);
    this.cache.reset(), this.cache = void 0, this.register = void 0, this.dracoLoader && this.dracoLoader.dispose(), this.ktx2loader && this.ktx2loader.dispose();
  }
  _checkSize() {
    const e = this;
    let a = 0;
    for (; e.cache.size() > e.maxCachedItems && a < e.cache.size(); ) {
      a++;
      const t = e.cache.head(), A = e.register[t.key];
      A && (Object.keys(A).length > 0 ? (e.cache.remove(t.key), e.cache.put(t.key, t.value)) : (e.cache.remove(t.key), delete e.register[t.key], e._disposeEntryContent(t)));
    }
  }
  _disposeEntryContent(e) {
    e.value && (e.value.isSplatsBatch ? e.value.remove() : e.value.traverse && e.value.traverse((a) => {
      if (a.material) if (a.material.length) for (let t = 0; t < a.material.length; ++t) a.material[t].dispose();
      else a.material.dispose();
      a.geometry && a.geometry.dispose();
    }));
  }
}
function ot(h) {
  for (var e = h.split("/"), a = [], t = 0, A = 0; A < e.length; A++) {
    var i = e[A];
    i !== "." && i !== "" && i !== ".." ? a[t++] = i : i === ".." && t > 0 && t--;
  }
  if (t === 0) return "/";
  var s = "";
  for (A = 0; A < t; A++) s += "/" + a[A];
  return s;
}
var ct, bt, dt, be = function() {
  if (bt) return ct;
  function h(t) {
    if (typeof t != "string") throw new TypeError("Path must be a string. Received " + JSON.stringify(t));
  }
  function e(t, A) {
    for (var i, s = "", r = 0, n = -1, o = 0, c = 0; c <= t.length; ++c) {
      if (c < t.length) i = t.charCodeAt(c);
      else {
        if (i === 47) break;
        i = 47;
      }
      if (i === 47) {
        if (!(n === c - 1 || o === 1)) if (n !== c - 1 && o === 2) {
          if (s.length < 2 || r !== 2 || s.charCodeAt(s.length - 1) !== 46 || s.charCodeAt(s.length - 2) !== 46) {
            if (s.length > 2) {
              var b = s.lastIndexOf("/");
              if (b !== s.length - 1) {
                b === -1 ? (s = "", r = 0) : r = (s = s.slice(0, b)).length - 1 - s.lastIndexOf("/"), n = c, o = 0;
                continue;
              }
            } else if (s.length === 2 || s.length === 1) {
              s = "", r = 0, n = c, o = 0;
              continue;
            }
          }
          A && (s.length > 0 ? s += "/.." : s = "..", r = 2);
        } else s.length > 0 ? s += "/" + t.slice(n + 1, c) : s = t.slice(n + 1, c), r = c - n - 1;
        n = c, o = 0;
      } else i === 46 && o !== -1 ? ++o : o = -1;
    }
    return s;
  }
  bt = 1;
  var a = { resolve: function() {
    for (var t, A = "", i = !1, s = arguments.length - 1; s >= -1 && !i; s--) {
      var r;
      s >= 0 ? r = arguments[s] : (t === void 0 && (t = process.cwd()), r = t), h(r), r.length !== 0 && (A = r + "/" + A, i = r.charCodeAt(0) === 47);
    }
    return A = e(A, !i), i ? A.length > 0 ? "/" + A : "/" : A.length > 0 ? A : ".";
  }, normalize: function(t) {
    if (h(t), t.length === 0) return ".";
    var A = t.charCodeAt(0) === 47, i = t.charCodeAt(t.length - 1) === 47;
    return (t = e(t, !A)).length !== 0 || A || (t = "."), t.length > 0 && i && (t += "/"), A ? "/" + t : t;
  }, isAbsolute: function(t) {
    return h(t), t.length > 0 && t.charCodeAt(0) === 47;
  }, join: function() {
    if (arguments.length === 0) return ".";
    for (var t, A = 0; A < arguments.length; ++A) {
      var i = arguments[A];
      h(i), i.length > 0 && (t === void 0 ? t = i : t += "/" + i);
    }
    return t === void 0 ? "." : a.normalize(t);
  }, relative: function(t, A) {
    if (h(t), h(A), t === A || (t = a.resolve(t)) === (A = a.resolve(A))) return "";
    for (var i = 1; i < t.length && t.charCodeAt(i) === 47; ++i) ;
    for (var s = t.length, r = s - i, n = 1; n < A.length && A.charCodeAt(n) === 47; ++n) ;
    for (var o = A.length - n, c = r < o ? r : o, b = -1, g = 0; g <= c; ++g) {
      if (g === c) {
        if (o > c) {
          if (A.charCodeAt(n + g) === 47) return A.slice(n + g + 1);
          if (g === 0) return A.slice(n + g);
        } else r > c && (t.charCodeAt(i + g) === 47 ? b = g : g === 0 && (b = 0));
        break;
      }
      var l = t.charCodeAt(i + g);
      if (l !== A.charCodeAt(n + g)) break;
      l === 47 && (b = g);
    }
    var d = "";
    for (g = i + b + 1; g <= s; ++g) g !== s && t.charCodeAt(g) !== 47 || (d.length === 0 ? d += ".." : d += "/..");
    return d.length > 0 ? d + A.slice(n + b) : (n += b, A.charCodeAt(n) === 47 && ++n, A.slice(n));
  }, _makeLong: function(t) {
    return t;
  }, dirname: function(t) {
    if (h(t), t.length === 0) return ".";
    for (var A = t.charCodeAt(0), i = A === 47, s = -1, r = !0, n = t.length - 1; n >= 1; --n) if ((A = t.charCodeAt(n)) === 47) {
      if (!r) {
        s = n;
        break;
      }
    } else r = !1;
    return s === -1 ? i ? "/" : "." : i && s === 1 ? "//" : t.slice(0, s);
  }, basename: function(t, A) {
    if (A !== void 0 && typeof A != "string") throw new TypeError('"ext" argument must be a string');
    h(t);
    var i, s = 0, r = -1, n = !0;
    if (A !== void 0 && A.length > 0 && A.length <= t.length) {
      if (A.length === t.length && A === t) return "";
      var o = A.length - 1, c = -1;
      for (i = t.length - 1; i >= 0; --i) {
        var b = t.charCodeAt(i);
        if (b === 47) {
          if (!n) {
            s = i + 1;
            break;
          }
        } else c === -1 && (n = !1, c = i + 1), o >= 0 && (b === A.charCodeAt(o) ? --o == -1 && (r = i) : (o = -1, r = c));
      }
      return s === r ? r = c : r === -1 && (r = t.length), t.slice(s, r);
    }
    for (i = t.length - 1; i >= 0; --i) if (t.charCodeAt(i) === 47) {
      if (!n) {
        s = i + 1;
        break;
      }
    } else r === -1 && (n = !1, r = i + 1);
    return r === -1 ? "" : t.slice(s, r);
  }, extname: function(t) {
    h(t);
    for (var A = -1, i = 0, s = -1, r = !0, n = 0, o = t.length - 1; o >= 0; --o) {
      var c = t.charCodeAt(o);
      if (c !== 47) s === -1 && (r = !1, s = o + 1), c === 46 ? A === -1 ? A = o : n !== 1 && (n = 1) : A !== -1 && (n = -1);
      else if (!r) {
        i = o + 1;
        break;
      }
    }
    return A === -1 || s === -1 || n === 0 || n === 1 && A === s - 1 && A === i + 1 ? "" : t.slice(A, s);
  }, format: function(t) {
    if (t === null || typeof t != "object") throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof t);
    return function(A, i) {
      var s = i.dir || i.root, r = i.base || (i.name || "") + (i.ext || "");
      return s ? s === i.root ? s + r : s + A + r : r;
    }("/", t);
  }, parse: function(t) {
    h(t);
    var A = { root: "", dir: "", base: "", ext: "", name: "" };
    if (t.length === 0) return A;
    var i, s = t.charCodeAt(0), r = s === 47;
    r ? (A.root = "/", i = 1) : i = 0;
    for (var n = -1, o = 0, c = -1, b = !0, g = t.length - 1, l = 0; g >= i; --g) if ((s = t.charCodeAt(g)) !== 47) c === -1 && (b = !1, c = g + 1), s === 46 ? n === -1 ? n = g : l !== 1 && (l = 1) : n !== -1 && (l = -1);
    else if (!b) {
      o = g + 1;
      break;
    }
    return n === -1 || c === -1 || l === 0 || l === 1 && n === c - 1 && n === o + 1 ? c !== -1 && (A.base = A.name = o === 0 && r ? t.slice(1, c) : t.slice(o, c)) : (o === 0 && r ? (A.name = t.slice(1, n), A.base = t.slice(1, c)) : (A.name = t.slice(o, n), A.base = t.slice(o, c)), A.ext = t.slice(n, c)), o > 0 ? A.dir = t.slice(0, o - 1) : r && (A.dir = "/"), A;
  }, sep: "/", delimiter: ":", win32: null, posix: null };
  return a.posix = a, ct = a;
}();
class Gi {
  constructor(e) {
    le(this, "_toElementFn");
    if (e) {
      const { toElementFn: a } = e;
      if (typeof a == "function") this._toElementFn = a;
      else if (a) throw new TypeError("toElementFn must be a function type");
    }
  }
  get toElementFn() {
    return this._toElementFn;
  }
  *[Symbol.iterator](...e) {
    yield* this._getIterator(...e);
  }
  *values() {
    for (const e of this) yield e;
  }
  every(e, a) {
    let t = 0;
    for (const A of this) if (!e.call(a, A, t++, this)) return !1;
    return !0;
  }
  some(e, a) {
    let t = 0;
    for (const A of this) if (e.call(a, A, t++, this)) return !0;
    return !1;
  }
  forEach(e, a) {
    let t = 0;
    for (const A of this) e.call(a, A, t++, this);
  }
  find(e, a) {
    let t = 0;
    for (const A of this) if (e.call(a, A, t++, this)) return A;
  }
  has(e) {
    for (const a of this) if (a === e) return !0;
    return !1;
  }
  reduce(e, a) {
    let t = a ?? 0, A = 0;
    for (const i of this) t = e(t, i, A++, this);
    return t;
  }
  toArray() {
    return [...this];
  }
  toVisual() {
    return [...this];
  }
  print() {
    console.log(this.toVisual());
  }
}
/**
 * data-structure-typed
 * @author Kirk Qi
 * @copyright Copyright (c) 2022 Kirk Qi <qilinaus@gmail.com>
 * @license MIT License
 */
class Ie extends Gi {
  constructor(a = [], t) {
    super(t);
    le(this, "_elements", []);
    le(this, "_DEFAULT_COMPARATOR", (a, t) => {
      if (typeof a == "object" || typeof t == "object") throw TypeError("When comparing object types, a custom comparator must be defined in the constructor's options parameter.");
      return a > t ? 1 : a < t ? -1 : 0;
    });
    le(this, "_comparator", this._DEFAULT_COMPARATOR);
    if (t) {
      const { comparator: A } = t;
      A && (this._comparator = A);
    }
    this.addMany(a);
  }
  get elements() {
    return this._elements;
  }
  get size() {
    return this.elements.length;
  }
  get leaf() {
    return this.elements[this.size - 1] ?? void 0;
  }
  static heapify(a, t) {
    return new Ie(a, t);
  }
  add(a) {
    return this._elements.push(a), this._bubbleUp(this.elements.length - 1);
  }
  addMany(a) {
    const t = [];
    for (const A of a) this._toElementFn ? t.push(this.add(this._toElementFn(A))) : t.push(this.add(A));
    return t;
  }
  poll() {
    if (this.elements.length === 0) return;
    const a = this.elements[0], t = this.elements.pop();
    return this.elements.length && (this.elements[0] = t, this._sinkDown(0, this.elements.length >> 1)), a;
  }
  peek() {
    return this.elements[0];
  }
  isEmpty() {
    return this.size === 0;
  }
  clear() {
    this._elements = [];
  }
  refill(a) {
    return this._elements = a, this.fix();
  }
  has(a) {
    return this.elements.includes(a);
  }
  delete(a) {
    const t = this.elements.indexOf(a);
    return !(t < 0) && (t === 0 ? this.poll() : t === this.elements.length - 1 ? this.elements.pop() : (this.elements.splice(t, 1, this.elements.pop()), this._bubbleUp(t), this._sinkDown(t, this.elements.length >> 1)), !0);
  }
  dfs(a = "PRE") {
    const t = [], A = (i) => {
      const s = 2 * i + 1, r = s + 1;
      i < this.size && (a === "IN" ? (A(s), t.push(this.elements[i]), A(r)) : a === "PRE" ? (t.push(this.elements[i]), A(s), A(r)) : a === "POST" && (A(s), A(r), t.push(this.elements[i])));
    };
    return A(0), t;
  }
  clone() {
    return new Ie(this, { comparator: this.comparator, toElementFn: this.toElementFn });
  }
  sort() {
    const a = [], t = new Ie(this, { comparator: this.comparator });
    for (; t.size !== 0; ) {
      const A = t.poll();
      A !== void 0 && a.push(A);
    }
    return a;
  }
  fix() {
    const a = [];
    for (let t = Math.floor(this.size / 2); t >= 0; t--) a.push(this._sinkDown(t, this.elements.length >> 1));
    return a;
  }
  filter(a, t) {
    const A = new Ie([], { toElementFn: this.toElementFn, comparator: this.comparator });
    let i = 0;
    for (const s of this) a.call(t, s, i, this) && A.add(s), i++;
    return A;
  }
  map(a, t, A, i) {
    const s = new Ie([], { comparator: t, toElementFn: A });
    let r = 0;
    for (const n of this) s.add(a.call(i, n, r, this)), r++;
    return s;
  }
  get comparator() {
    return this._comparator;
  }
  *_getIterator() {
    for (const a of this.elements) yield a;
  }
  _bubbleUp(a) {
    const t = this.elements[a];
    for (; a > 0; ) {
      const A = a - 1 >> 1, i = this.elements[A];
      if (this.comparator(i, t) <= 0) break;
      this.elements[a] = i, a = A;
    }
    return this.elements[a] = t, !0;
  }
  _sinkDown(a, t) {
    const A = this.elements[a];
    for (; a < t; ) {
      let i = a << 1 | 1;
      const s = i + 1;
      let r = this.elements[i];
      if (s < this.elements.length && this.comparator(r, this.elements[s]) > 0 && (i = s, r = this.elements[s]), this.comparator(r, A) >= 0) break;
      this.elements[a] = r, a = i;
    }
    return this.elements[a] = A, !0;
  }
}
(function(h) {
  h[h.VISIT = 0] = "VISIT", h[h.PROCESS = 1] = "PROCESS";
})(dt || (dt = {}));
class Ne extends Ie {
  constructor(e = [], a) {
    super(e, a);
  }
  clone() {
    return new Ne(this, { comparator: this.comparator, toElementFn: this.toElementFn });
  }
  filter(e, a) {
    const t = new Ne([], { toElementFn: this.toElementFn, comparator: this.comparator });
    let A = 0;
    for (const i of this) e.call(a, i, A, this) && t.add(i), A++;
    return t;
  }
  map(e, a, t, A) {
    const i = new Ne([], { comparator: a, toElementFn: t });
    let s = 0;
    for (const r of this) i.add(e.call(A, r, s, this)), s++;
    return i;
  }
}
class Le extends Ne {
  constructor(e = [], a) {
    super(e, a);
  }
  clone() {
    return new Le(this, { comparator: this.comparator, toElementFn: this.toElementFn });
  }
  filter(e, a) {
    const t = new Le([], { toElementFn: this.toElementFn, comparator: this.comparator });
    let A = 0;
    for (const i of this) e.call(a, i, A, this) && t.add(i), A++;
    return t;
  }
  map(e, a, t, A) {
    const i = new Le([], { comparator: a, toElementFn: t });
    let s = 0;
    for (const r of this) i.add(e.call(A, r, s, this)), s++;
    return i;
  }
}
function Hi(h) {
  return new Worker("" + new URL("assets/PointsManager.worker-5fpGpVvf.js", import.meta.url).href, { type: "module", name: h == null ? void 0 : h.name });
}
new va(), new D(), new D(), new D(), new D();
const Ke = new D(), Ni = new D(), Yt = new Da();
Yt.set(1, 0, 0, 0, 0, 1, 0, -1, 0);
class Li extends wa {
  constructor(e, a, t) {
    const i = Math.min(Math.ceil(8) * 512, Math.pow(512, 2));
    let s = 1 * Math.pow(512, 2);
    s = Math.floor(s / i) * i;
    const r = new re(512, 512, 1, { magFilter: v, minFilter: v, anisotropy: 0, depthBuffer: !1, resolveDepthBuffer: !1 });
    e.initRenderTarget(r);
    const n = new re(512, 512, 1, { magFilter: v, minFilter: v, anisotropy: 0, type: R, depthBuffer: !1, resolveDepthBuffer: !1 });
    n.texture.type = R, e.initRenderTarget(n);
    const o = new re(512, 512, 1, { magFilter: v, minFilter: v, anisotropy: 0, type: R, depthBuffer: !1, resolveDepthBuffer: !1 });
    o.texture.type = R, e.initRenderTarget(o);
    const c = new re(512, 512, 1, { magFilter: v, minFilter: v, anisotropy: 0, type: R, depthBuffer: !1, resolveDepthBuffer: !1 });
    c.texture.type = R, e.initRenderTarget(c);
    const b = new ta({ uniforms: { textureSize: { value: 512 }, numSlices: { value: 1 }, cov1Texture: { value: o.texture }, cov2Texture: { value: c.texture }, colorTexture: { value: r.texture }, positionTexture: { value: n.texture }, zUpToYUpMatrix3x3: { value: Yt }, sizeMultiplier: { value: 1 }, cropRadius: { value: Number.MAX_VALUE }, cameraNear: { value: 0.01 }, cameraFar: { value: 10 }, computeLinearDepth: { value: !0 } }, vertexShader: Oi(), fragmentShader: t || Ji(), transparent: !0, side: We, depthTest: !1, depthWrite: !1 }), g = new Pa(), l = new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
    g.setIndex([0, 2, 1, 2, 3, 1]), g.setAttribute("position", new de(l, 3));
    const d = new Uint32Array(s), f = new Qa(d, 1, !1);
    f.needsUpdate = !0, f.setUsage(qa), g.setAttribute("order", f), g.instanceCount = 0, super(g, b), this.matrixAutoUpdate = !1, this.numBatches = 0, this.numVisibleBatches = 0, this.orderAttribute = f, this.textureSize = 512, this.numTextures = 1, this.batchSize = i, this.maxSplats = s, this.numSplatsRendered = 0, this.colorRenderTarget = r, this.positionRenderTarget = n, this.cov1RenderTarget = o, this.cov2RenderTarget = c, this.renderer = e, this.sortID = 0, this.freeAddresses = new Le();
    for (let m = 0; m < this.maxSplats; m += i) this.freeAddresses.add(m);
    this.worker = new Hi({}), this.sortListeners = [], this.worker.onmessage = (m) => {
      const u = new Uint32Array(m.data.order);
      if (this.numSplatsRendered = u.length, u.length > this.orderAttribute.count) {
        const C = new Pa(), B = new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]), w = [0, 2, 1, 2, 3, 1];
        C.setIndex(w), C.setAttribute("position", new de(B, 3));
        const k = new Uint32Array(this.maxSplats), y = new Qa(k, 1, !1);
        y.needsUpdate = !0, y.setUsage(qa), C.setAttribute("order", y), C.instanceCount = 0, this.geometry.dispose(), this.geometry = C, this.orderAttribute = y;
      }
      this.orderAttribute.clearUpdateRanges(), this.orderAttribute.set(u), this.orderAttribute.addUpdateRange(0, u.length), this.orderAttribute.needsUpdate = !0, this.geometry.instanceCount = m.data.count, this.geometry.needsUpdate = !0;
      for (let C = this.sortListeners.length - 1; C >= 0; C--)
        this.sortListeners[C](m.data.id) && this.sortListeners.splice(C, 1);
    }, this.cameraPosition = new D(0, 0, 0), this.rotateOnAxis(new D(1, 0, 0), 0.5 * Math.PI), this.frustumCulled = !1, this.copyMaterial2D = new ta({ uniforms: { sourceTexture: {} }, vertexShader: ht(), fragmentShader: `
precision highp float;

uniform sampler2D sourceTexture;

in vec2 vUv;

void main() {
    gl_FragColor = texture( sourceTexture, vUv );
}`, transparent: !1, side: We, depthTest: !1, depthWrite: !1 }), this.copyMaterial3D = new ta({ uniforms: { sourceTexture: {}, w: { value: 0 } }, vertexShader: ht(), fragmentShader: `
precision highp float;

uniform sampler3D sourceTexture;
uniform float w;

in vec2 vUv;

void main() {
    gl_FragColor = texture( sourceTexture, vec3(vUv, w) );
}`, transparent: !1, side: We, depthTest: !1, depthWrite: !1 }), this.copyCamera = new Qt(-0.5, 0.5, 0.5, -0.5, 0.1, 10), this.copyCamera.position.z = 1, this.copyScene = new PA();
    const I = new qA(1, 1);
    this.copyQuad = new wa(I, this.copyMaterial2D), this.copyScene.add(this.copyQuad), this.copyScene.matrixAutoUpdate = !1, this.copyQuad.matrixAutoUpdate = !1;
  }
  dispose() {
    this.material.dispose(), this.copyMaterial2D.dispose(), this.copyMaterial3D.dispose(), this.cov1RenderTarget.dispose(), this.cov2RenderTarget.dispose(), this.positionRenderTarget.dispose(), this.colorRenderTarget.dispose(), this.worker.terminate(), this.worker = null, this.orderAttribute.array = void 0, this.geometry.dispose();
  }
  copyTex2D(e, a, t, A) {
    this.copyMaterial2D.uniforms.sourceTexture.value = e;
    const i = this.renderer.autoClear, s = this.renderer.getRenderTarget();
    this.renderer.autoClear = !1;
    const r = t[2] - t[0], n = t[3] - t[1];
    a.viewport.set(t[0], t[1], r, n), this.renderer.setRenderTarget(a, A), this.renderer.render(this.copyScene, this.copyCamera), this.renderer.setRenderTarget(s), this.renderer.autoClear = i;
  }
  copyTex3D(e, a, t) {
    this.copyMaterial3D.uniforms.sourceTexture.value = e;
    const A = this.renderer.autoClear, i = this.renderer.getRenderTarget();
    this.renderer.autoClear = !1, this.copyQuad.material = this.copyMaterial3D;
    for (let s = 0; s < t; s++) this.renderer.setRenderTarget(a, s), this.copyMaterial3D.uniforms.w.value = (s + 0.5) / t, this.renderer.render(this.copyScene, this.copyCamera);
    this.copyQuad.material = this.copyMaterial2D, this.renderer.setRenderTarget(i), this.renderer.autoClear = A;
  }
  setSplatsSizeMultiplier(e) {
    this.material.uniforms.sizeMultiplier.value = e;
  }
  setSplatsCropRadius(e) {
    this.material.uniforms.cropRadius.value = e;
  }
  sort(e) {
    this.worker && (!e && this.cameraPosition ? this.worker.postMessage({ method: "sort", xyz: [this.cameraPosition.x, this.cameraPosition.z, -this.cameraPosition.y], id: this.sortID++ }) : this.cameraPosition && e.equals(this.cameraPosition) || (this.cameraPosition.copy(e), this.worker.postMessage({ method: "sort", xyz: [this.cameraPosition.x, this.cameraPosition.z, -this.cameraPosition.y], id: this.sortID++ })));
  }
  raycast(e, a) {
  }
  addSplatsTile(e, a, t, A) {
    if (!this.worker) return;
    const i = this, s = e.data ? e.data.array : e.array, r = e.data && e.data.isInterleavedBuffer ? e.data.stride : 3, n = e.data && e.data.isInterleavedBuffer ? e.offset : 0, o = Math.ceil(s.length / (this.batchSize * r)), c = [], b = [];
    let g = () => {
    };
    const l = new Float32Array(s.length / r * 3);
    for (let f = 0; f < s.length / 3; f++) l[3 * f] = s[f * r + n], l[3 * f + 1] = s[f * r + n + 1], l[3 * f + 2] = s[f * r + n + 2];
    g = (f, I, m) => {
      const u = m * m;
      for (let C = 0; C < l.length; C += 3) {
        Ke.set(l[C], -l[C + 2], l[C + 1]);
        const B = Ni.copy(Ke).sub(f.origin).dot(f.direction);
        B > 0 && f.distanceSqToPoint(Ke) < u && I.push({ distance: B, point: Ke.clone(), type: "splat" });
      }
    }, o > this.freeAddresses.size && this.growTextures();
    for (let f = 0; f < o; f++) {
      const I = this.freeAddresses.poll();
      isNaN(I) && console.log("insuficient texture size to store splats info"), c.push(I), b.push(3 * I);
      const m = f * this.batchSize;
      this.addSplatsBatch(m, I, e, a, t, A);
    }
    i.worker.postMessage({ method: "addBatches", insertionIndexes: b, positions: s.buffer, offset: n, stride: r, batchSize: i.batchSize }, [s.buffer]);
    let d = !1;
    return { hide: () => {
      d == 1 && i.worker && (i.numVisibleBatches--, d = !1, i.worker.postMessage({ method: "hideBatches", insertionIndexes: b, xyz: [i.cameraPosition.x, i.cameraPosition.z, -i.cameraPosition.y], id: i.sortID++ }));
    }, show: (f) => {
      if (d == 0 && i.worker) {
        i.numVisibleBatches--, d = !0;
        const I = i.sortID, m = (u) => u >= I && (f(), !0);
        i.sortListeners.push(m), i.worker.postMessage({ method: "showBatches", insertionIndexes: b, xyz: [i.cameraPosition.x, i.cameraPosition.z, -i.cameraPosition.y], id: i.sortID++ });
      }
    }, remove: () => {
      i.worker && (g = void 0, i.worker.postMessage({ method: "removeBatches", insertionIndexes: b, xyz: [i.cameraPosition.x, i.cameraPosition.z, -i.cameraPosition.y], id: i.sortID++ }), c.forEach((f) => i.freeAddresses.add(f)));
    }, sort: this.sort, raycast: g, isSplatsBatch: !0 };
  }
  addSplatsBatch(e, a, t, A, i, s) {
    const r = new Float32Array(4 * this.batchSize), n = new Uint8Array(4 * this.batchSize), o = new Float32Array(4 * this.batchSize), c = new Float32Array(4 * this.batchSize);
    for (let u = a; u < a + this.batchSize; u++) {
      const C = u - a, B = 4 * C, w = e + C;
      if (w >= t.count) break;
      r[B] = t.getX(w), r[B + 1] = t.getY(w), r[B + 2] = t.getZ(w), Math.floor(255 * A.getX(w)), Math.floor(255 * A.getY(w)), Math.floor(255 * A.getZ(w)), Math.floor(255 * A.getW(w)), n[B] = Math.floor(255 * A.getX(w)), n[B + 1] = Math.floor(255 * A.getY(w)), n[B + 2] = Math.floor(255 * A.getZ(w)), n[B + 3] = Math.floor(255 * A.getW(w)), o[B] = i.getX(w), o[B + 1] = i.getY(w), o[B + 2] = i.getZ(w), c[B] = s.getX(w), c[B + 1] = s.getY(w), c[B + 2] = s.getZ(w);
    }
    const b = Math.floor(a / Math.pow(this.textureSize, 2)), g = Math.ceil(this.batchSize / this.textureSize), l = [0, a / this.textureSize - b * this.textureSize, this.textureSize];
    l.push(l[1] + g);
    const d = new Ge(r, this.textureSize, g, $, R);
    d.generateMipmaps = !1, d.magFilter = v, d.minFilter = v, d.anisotropy = 0, d.needsUpdate = !0, this.renderer.initTexture(d), this.renderer.initRenderTarget(this.positionRenderTarget), this.copyTex2D(d, this.positionRenderTarget, l, b), d.dispose();
    const f = new Ge(n, this.textureSize, g, $, W);
    f.generateMipmaps = !1, f.magFilter = v, f.minFilter = v, f.anisotropy = 0, f.needsUpdate = !0, this.renderer.initTexture(f), this.copyTex2D(f, this.colorRenderTarget, l, b), f.dispose();
    const I = new Ge(o, this.textureSize, g, $, R);
    I.generateMipmaps = !1, I.magFilter = v, I.minFilter = v, I.anisotropy = 0, I.needsUpdate = !0, this.renderer.initTexture(I), this.copyTex2D(I, this.cov1RenderTarget, l, b), I.dispose();
    const m = new Ge(c, this.textureSize, g, $, R);
    m.generateMipmaps = !1, m.magFilter = v, m.minFilter = v, m.anisotropy = 0, m.needsUpdate = !0, this.renderer.initTexture(m), this.copyTex2D(m, this.cov2RenderTarget, l, b), m.dispose();
  }
  growTextures() {
    for (let s = this.maxSplats; s < this.maxSplats + this.textureSize * this.textureSize; s += this.batchSize) this.freeAddresses.add(s);
    this.maxSplats += this.textureSize * this.textureSize;
    const e = this.numTextures + 1, a = new re(this.textureSize, this.textureSize, e, { magFilter: v, minFilter: v, anisotropy: 0, depthBuffer: !1, resolveDepthBuffer: !1 });
    this.renderer.initRenderTarget(a), this.copyTex3D(this.colorRenderTarget.texture, a, this.numTextures), this.colorRenderTarget.dispose(), this.colorRenderTarget = a, this.material.uniforms.colorTexture.value = this.colorRenderTarget.texture;
    const t = new re(this.textureSize, this.textureSize, e, { magFilter: v, minFilter: v, anisotropy: 0, type: R, depthBuffer: !1, resolveDepthBuffer: !1 });
    t.texture.type = R, this.renderer.initRenderTarget(t), this.copyTex3D(this.positionRenderTarget.texture, t, this.numTextures), this.positionRenderTarget.dispose(), this.positionRenderTarget = t, this.material.uniforms.positionTexture.value = this.positionRenderTarget.texture;
    const A = new re(this.textureSize, this.textureSize, e, { magFilter: v, minFilter: v, anisotropy: 0, type: R, depthBuffer: !1, resolveDepthBuffer: !1 });
    A.texture.type = R, this.renderer.initRenderTarget(A), this.copyTex3D(this.cov1RenderTarget.texture, A, this.numTextures), this.cov1RenderTarget.dispose(), this.cov1RenderTarget = A, this.material.uniforms.cov1Texture.value = this.cov1RenderTarget.texture;
    const i = new re(this.textureSize, this.textureSize, e, { magFilter: v, minFilter: v, anisotropy: 0, type: R, depthBuffer: !1, resolveDepthBuffer: !1 });
    i.texture.type = R, this.renderer.initRenderTarget(i), this.copyTex3D(this.cov2RenderTarget.texture, i, this.numTextures), this.cov2RenderTarget.dispose(), this.cov2RenderTarget = i, this.material.uniforms.cov2Texture.value = this.cov2RenderTarget.texture, this.numTextures = e, this.material.uniforms.numSlices.value = this.numTextures;
  }
}
function Oi() {
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
`;
}
function Ji() {
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
    
}`;
}
function ht() {
  return `

out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
}
var Y;
const te = new E.Sphere(new E.Vector3(0, 0, 0), 1), fe = new Z([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]);
new E.Box3();
const oe = new E.Vector3(0, 0, 0), ye = new E.Vector3(0, 0, 0), Ia = new E.Vector3(0, 1, 0), ze = new E.Ray(), Ve = new E.Matrix4();
new E.Matrix4(), new E.Frustum();
const ma = new E.Vector3(), Ye = [], lt = new E.Quaternion(), X = {};
function Pi() {
  var h = [];
  for (let e in X) X.hasOwnProperty(e) && X[e] > 0 && h.push(e);
  return h;
}
class Wt extends E.Object3D {
  constructor(e) {
    super();
    const a = this;
    if (a.splatsMesh = e.splatsMesh, this.contentURL = [], e.domWidth && e.domHeight ? this.rendererSize = new E.Vector2(e.domWidth, e.domHeight) : this.rendererSize = new E.Vector2(1e3, 1e3), this.loadingStrategy = e.loadingStrategy ? e.loadingStrategy.toUpperCase() : "INCREMENTAL", this.distanceBias = Math.max(1e-4, e.distanceBias ? e.distanceBias : 1), this.proxy = e.proxy, this.drawBoundingVolume = !!e.drawBoundingVolume && e.drawBoundingVolume, this.displayErrors = e.displayErrors, this.displayCopyright = e.displayCopyright, e.queryParams && (this.queryParams = { ...e.queryParams }), this.uuid = St(), e.tileLoader) this.tileLoader = e.tileLoader;
    else {
      const i = {};
      i.meshCallback = e.meshCallback ? e.meshCallback : (r, n) => {
        r.material.wireframe = !1, r.material.side = E.DoubleSide;
      }, i.pointsCallback = e.pointsCallback ? e.pointsCallback : (r, n) => {
        r.material.size = Math.pow(n, 0.33), r.material.sizeAttenuation = !0;
      }, i.proxy = this.proxy, i.renderer = e.renderer, i.dracoLoader = e.dracoLoader, i.ktx2Loader = e.ktx2Loader, a.tileLoader = new Ui(i);
      const s = this.update;
      this.update = (r) => {
        s.call(a, r), a.tileLoader.update();
      };
    }
    if (this.displayCopyright = !!e.displayCopyright, this.geometricErrorMultiplier = e.geometricErrorMultiplier ? e.geometricErrorMultiplier : 1, this.splatsCropRadius = Number.MAX_VALUE, this.splatsSizeMultiplier = 1, this.renderer = e.renderer, this.meshCallback = e.meshCallback, this.loadOutsideView = e.loadOutsideView, this.cameraOnLoad = e.cameraOnLoad, this.parentTile = e.parentTile, this.occlusionCullingService = e.occlusionCullingService, this.static = e.static, this.occlusionCullingService && (this.color = new E.Color(), this.color.setHex(16777215 * Math.random()), this.colorID = E.MathUtils.clamp(255 * a.color.r, 0, 255) << 16 ^ E.MathUtils.clamp(255 * a.color.g, 0, 255) << 8 ^ E.MathUtils.clamp(255 * a.color.b, 0, 255)), this.static && (this.matrixAutoUpdate = !1, this.matrixWorldAutoUpdate = !1), this.childrenTiles = [], this.meshContent = [], this.tileContent, this.refine, this.rootPath, this.geometricError, this.boundingVolume, this.json, this.materialVisibility = !1, this.level = e.level ? e.level : 0, this.hasMeshContent = 0, this.hasUnloadedJSONContent = 0, this.centerModel = e.centerModel, this.abortController = new AbortController(), this.onLoadCallback = e.onLoadCallback, e.json) a._setup(e);
    else if (e.url) {
      var t = e.url;
      if (a.queryParams) {
        var A = "";
        for (let i in a.queryParams) a.queryParams.hasOwnProperty(i) && (A += "&" + i + "=" + a.queryParams[i]);
        t.includes("?") ? t += A : t += "?" + A.substring(1);
      }
      (a.proxy ? () => fetch(a.proxy, { method: "POST", body: t, signal: a.abortController.signal }) : () => fetch(t, { signal: a.abortController.signal }))().then((i) => {
        if (!i.ok) throw new Error(`couldn't load "${e.url}". Request failed with status ${i.status} : ${i.statusText}`);
        i.json().then((s) => Ma(s, t)).then((s) => {
          a._setup({ rootPath: be.dirname(e.url), json: s });
        });
      }).catch((i) => {
        a.displayErrors && gt(i);
      });
    }
  }
  setSplatsSizeMultiplier(e) {
    this.splatsSizeMultiplier = e, this.splatsMesh && this.splatsMesh.setSplatsSizeMultiplier(this.splatsSizeMultiplier);
  }
  setSplatsCropRadius(e) {
    this.splatsCropRadius = e, this.splatsMesh && this.splatsMesh.setSplatsCropRadius(this.splatsCropRadius);
  }
  updateMatrices() {
    this.updateMatrix(), this.splatsMesh && this.splatsMesh.updateMatrix(), this.static && (this.traverse((e) => {
      e.isObject3D && (e.matrixWorldAutoUpdate = !0);
    }), this.splatsMesh && (this.splatsMesh.matrixWorldAutoUpdate = !0)), this.updateMatrixWorld(!0), this.static && (this.traverse((e) => {
      e.isObject3D && (e.matrixWorldAutoUpdate = !1);
    }), this.splatsMesh && (this.splatsMesh.matrixWorldAutoUpdate = !1));
  }
  setCanvasSize(e, a) {
    this.rendererSize.set(e, a);
  }
  async _setup(e) {
    const a = this;
    if (e.json.extensionsRequired && (e.json.extensionsRequired.includes("JDULTRA_gaussian_splats") || e.json.extensionsRequired.includes("JDULTRA_gaussian_splats_V2")) && (a.splatsMesh = new Li(a.tileLoader.renderer), a.splatsMesh.setSplatsCropRadius(a.splatsCropRadius), a.splatsMesh.setSplatsSizeMultiplier(a.splatsSizeMultiplier), a.static && (a.splatsMesh.matrixWorldAutoUpdate = !1), a.add(a.splatsMesh), a.updateMatrices()), e.json.root ? (a.json = e.json.root, a.json.refine || (a.json.refine = e.json.refine), a.json.geometricError || (a.json.geometricError = e.json.geometricError), a.json.transform || (a.json.transform = e.json.transform), a.json.boundingVolume || (a.json.boundingVolume = e.json.boundingVolume)) : a.json = e.json, a.json.children || (a.json.getChildren ? a.json.children = await a.json.getChildren() : a.json.children = []), a.rootPath = e.json.rootPath ? e.json.rootPath : e.rootPath, a.json.refine ? a.refine = a.json.refine : a.refine = e.parentRefine, a.json.geometricError ? a.geometricError = a.json.geometricError : a.geometricError = e.parentGeometricError, a.json.transform) {
      let A = new E.Matrix4();
      A.elements = a.json.transform, a.applyMatrix4(A);
    }
    if (a.json.boundingVolume) if (a.json.boundingVolume.box) a.boundingVolume = new Z(a.json.boundingVolume.box);
    else if (a.json.boundingVolume.region) {
      const A = a.json.boundingVolume.region;
      a._transformWGS84ToCartesian(A[0], A[1], A[4], oe), a._transformWGS84ToCartesian(A[2], A[3], A[5], ye), oe.lerp(ye, 0.5), a.boundingVolume = new E.Sphere(new E.Vector3(oe.x, oe.y, oe.z), oe.distanceTo(ye));
    } else if (a.json.boundingVolume.sphere) {
      const A = a.json.boundingVolume.sphere;
      a.boundingVolume = new E.Sphere(new E.Vector3(A[0], A[1], A[2]), A[3]);
    } else a.boundingVolume = e.parentBoundingVolume;
    else a.boundingVolume = e.parentBoundingVolume;
    function t(A) {
      A.uri && A.uri.includes("json") || A.url && A.url.includes("json") ? a.hasUnloadedJSONContent++ : a.hasMeshContent++;
    }
    if (a.json.content ? (t(a.json.content), a.hasMeshContent == 0 && (a.level = Math.max(0, a.parentTile ? a.parentTile.level + 0.01 : 0)), a._load()) : a.json.contents && (a.json.contents.forEach((A) => t(A)), a.hasMeshContent == 0 && (a.level = Math.max(0, a.parentTile ? a.parentTile.level + 0.01 : 0))), a.centerModel) {
      if (ye.copy(a.boundingVolume.center), this.json.boundingVolume.region) this._transformWGS84ToCartesian(0.5 * (this.json.boundingVolume.region[0] + this.json.boundingVolume.region[2]), 0.5 * (this.json.boundingVolume.region[1] + this.json.boundingVolume.region[3]), 0.5 * (this.json.boundingVolume.region[4] + this.json.boundingVolume.region[5]), oe), lt.setFromUnitVectors(oe.normalize(), Ia.normalize()), a.applyQuaternion(lt);
      else if (this.json.boundingVolume.box) {
        const A = this.json.boundingVolume.box, i = new E.Vector3(A[3], A[4], A[5]).normalize(), s = new E.Vector3(A[6], A[7], A[8]).normalize(), r = new E.Vector3(A[9], A[10], A[11]).normalize(), n = new E.Matrix4();
        n.makeBasis(i, s, r);
        const o = new E.Quaternion();
        o.setFromRotationMatrix(n);
        const c = new E.Quaternion();
        c.setFromUnitVectors(r, Ia);
        const b = new E.Quaternion();
        b.setFromAxisAngle(Ia, Math.PI), a.quaternion.copy(b).multiply(c).multiply(o.invert());
      }
      ye.applyMatrix4(a.matrix), a.position.sub(ye), a.updateMatrices();
    }
    if (a.onLoadCallback && a.onLoadCallback(a), a.isSetup = !0, a.level > 0 && a.drawBoundingVolume) if (a.bbox && console.log("double setup"), this.boundingVolume.aabb) {
      let A = this.boundingVolume.aabb.clone();
      A.applyMatrix4(this.matrixWorld), a.bbox = new E.Box3Helper(A, new E.Color(Math.random(), Math.random(), Math.random())), a.add(a.bbox), a.bbox.material.visible = !1;
    } else a.boundingVolume instanceof Z && (a.bbox = a.boundingVolume.helper(), a.add(a.bbox), a.bbox.material.visible = !1);
  }
  _assembleURL(e, a) {
    e.endsWith("/") || (e += "/");
    const t = new URL(e);
    let A = t.pathname.split("/").filter((s) => s !== ""), i = a.split("/").filter((s) => s !== "");
    for (let s = 1; s <= A.length && !(s >= i.length); s++)
      if (A.slice(A.length - s, A.length).join("/") === i.slice(0, s).join("/")) {
        for (let r = 0; r < s; r++) A.pop();
        break;
      }
    for (; i.length > 0 && i[0] === ".."; ) A.pop(), i.shift();
    return `${t.protocol}//${t.host}/${[...A, ...i].join("/")}`;
  }
  _extractQueryParams(e, a) {
    const t = new URL(e);
    for (let [A, i] of t.searchParams) a[A] = i;
    return t.search = "", t.toString();
  }
  async _load(e = !0, a = !0) {
    var t = this;
    if (!t.deleted) {
      if (t.json.content) await A(t.json.content, null, e, a);
      else if (t.json.contents) {
        let i = t.json.contents.map((s, r) => A(s, r, e, a));
        Promise.all(i);
      }
    }
    async function A(i, s, r, n) {
      let o;
      i.uri ? o = i.uri : i.url && (o = i.url);
      const c = /^(?:http|https|ftp|tcp|udp):\/\/\S+/;
      if (c.test(t.rootPath) ? c.test(o) || (o = t._assembleURL(t.rootPath, o)) : be.isAbsolute(t.rootPath) && (o = t.rootPath + be.sep + o), o = t._extractQueryParams(o, t.queryParams), t.queryParams) {
        var b = "";
        for (let g in t.queryParams) t.queryParams.hasOwnProperty(g) && (b += "&" + g + "=" + t.queryParams[g]);
        o.includes("?") ? o += b : o += "?" + b.substring(1);
      }
      if (o) if (t.contentURL.push(o), n && (o.includes(".b3dm") || o.includes(".glb") || o.includes(".gltf"))) try {
        t.tileLoader.get(t.abortController, t.uuid, o, (g) => {
          t.deleted || (g.asset && g.asset.copyright && (g.asset.copyright.split(";").forEach((l) => {
            X[l] ? X[l]++ : X[l] = 1;
          }), t.displayCopyright && Ba()), t.meshContent.push(g), t.splatsMesh || (g.traverse((l) => {
            if ((l.isMesh || l.isPoints) && l.layers.disable(0), l.isMesh && t.occlusionCullingService) {
              const d = l.geometry.attributes.position, f = [];
              for (let I = 0; I < d.count; I++) f.push(t.color.r, t.color.g, t.color.b);
              l.geometry.setAttribute("color", new E.Float32BufferAttribute(f, 3));
            }
          }), t.add(g), t.updateMatrices()));
        }, t.cameraOnLoad ? () => t.loadingStrategy == "IMMEDIATE" ? t._calculateDistanceToCamera(t.cameraOnLoad) : t.loadingStrategy == "INCREMENTAL" ? t.parentTile ? t.parentTile._calculateDistanceToCamera(t.cameraOnLoad) / Math.max(1, t.parentTile.level) : t._calculateDistanceToCamera(t.cameraOnLoad) / Math.max(1, t.level) : t.loadingStrategy == "PERLEVEL" ? t.parentTile ? t.level + t.parentTile._calculateDistanceToCamera(t.cameraOnLoad) : t.level + t._calculateDistanceToCamera(t.cameraOnLoad) : 0 : () => 0, () => t._getSiblings(), t.level, t.loadingStrategy, !t.json.boundingVolume.region, !!t.json.boundingVolume.region, t.geometricError, t.splatsMesh);
      } catch (g) {
        t.displayErrors && gt(g);
      }
      else r && o.includes(".json") && (t.jsonRequested = o, t.tileLoader.get(t.abortController, t.uuid, o, async (g) => {
        t.jsonReceived = !0, t.deleted || (g.rootPath = be.dirname(o), t.json.children.push(g), s == null ? delete t.json.content : t.json.contents.splice(s, 1), t.hasUnloadedJSONContent--);
      }));
    }
  }
  dispose() {
    const e = this;
    e.meshContent.forEach((a) => {
      a && a.asset && a.asset.copyright && (a.asset.copyright.split(";").forEach((t) => {
        X[t] && X[t]--;
      }), e.displayCopyright && Ba());
    }), e.childrenTiles.forEach((a) => a.dispose()), e.deleted = !0, e.splatsMesh && (e.meshContent.forEach((a) => a.hide()), e.parentTile || (e.splatsMesh.dispose(), e.splatsMesh = void 0)), e.contentURL && (e.contentURL.forEach((a) => {
      e.tileLoader.invalidate(a, e.uuid);
    }), e.contentURL = []), e.abortController && !e.jsonRequested && e.abortController.abort("tile not needed"), this.parent = null, e.meshContent = [], e.bbox && e.bbox.dispose(), this.dispatchEvent({ type: "removed" });
  }
  _disposeMeshContent() {
    const e = this;
    if (!e.deleted) {
      e.deleted = !0, e.abortController && (e.abortController.abort("tile not needed"), e.abortController = new AbortController());
      for (let a = e.meshContent.length - 1; a >= 0; a--) {
        const t = e.meshContent[a];
        t && t.asset && t.asset.copyright && (t.asset.copyright.split(";").forEach((A) => {
          X[A] && X[A]--;
        }), e.displayCopyright && Ba()), e.remove(t);
      }
      e.splatsMesh && e.meshContent.forEach((a) => a.hide()), e.meshContent = [], e.contentURL.forEach((a) => {
        e.tileLoader.invalidate(a, e.uuid);
      }), e.contentURL = [];
    }
  }
  _disposeChildren() {
    var e = this;
    e.childrenTiles.forEach((a) => {
      a.dispose(), e.remove(a);
    }), e.childrenTiles = [];
  }
  raycast(e, a) {
    if (this.splatsMesh) {
      ze.copy(e.ray), Ve.copy(this.matrixWorld).invert(), ze.applyMatrix4(Ve);
      let t = !1;
      if (this.boundingVolume instanceof Z) t = this.boundingVolume.intersectsRay(ze);
      else {
        if (!(this.boundingVolume instanceof E.Sphere)) return !1;
        t = ray.intersectsSphere(this.boundingVolume);
      }
      return t && this.materialVisibility && this.splatsReady && (Ye.length = 0, this.meshContent.forEach((A) => {
        A.isSplatsBatch && (A.raycast(ze, Ye, e.params.Points.threshold), Ye.forEach((i) => {
          i.point.applyMatrix4(this.matrixWorld);
        }), a.push(...Ye));
      })), t;
    }
    return super.raycast(e, a);
  }
  update(e) {
    const a = new E.Frustum();
    a.setFromProjectionMatrix(new E.Matrix4().multiplyMatrices(e.projectionMatrix, e.matrixWorldInverse));
    let t = [0], A = [0], i = [0], s = [0];
    return this.refine == "REPLACE" ? this.loadingStrategy === "IMMEDIATE" ? (this._updateImmediate(e, a), this._statsImmediate(i, t, s, A)) : (this._update(e, a), this._stats(i, t, s, A)) : (this._update(e, a), this._stats(i, t, s, A)), t > 0 && (s[0] /= t[0]), this.splatsMesh && (ma.copy(e.position), Ve.copy(this.matrixWorld).invert(), ma.applyMatrix4(Ve), this.splatsMesh.sort(ma)), { numTilesLoaded: t[0], numTilesRendered: A[0], maxLOD: i[0], percentageLoaded: s[0] };
  }
  _updateImmediate(e, a) {
    this._computeMetricRecursive(e, a), this._updateNodeVisibilityImmediate(), this._expandTreeImmediate(e), this.shouldBeVisible = this.metric > 0 || !!this.loadOutsideView, this._shouldBeVisibleUpdateImmediate(), this._trimTreeImmediate(), this._loadMeshImmediate();
  }
  _statsImmediate(e, a, t, A) {
    e[0] = Math.max(e[0], this.level), (this.shouldBeVisible || this.materialVisibility) && (a[0]++, this.materialVisibility && t[0]++), this.materialVisibility && A[0]++, this.childrenTiles.forEach((i) => {
      i._statsImmediate(e, a, t, A);
    });
  }
  _stats(e, a, t, A) {
    e[0] = Math.max(e[0], this.level), this.hasMeshContent && (a[0]++, this.meshContent.length == this.hasMeshContent && t[0]++, this.materialVisibility && A[0]++), this.childrenTiles.forEach((i) => {
      i._stats(e, a, t, A);
    });
  }
  _trimTreeImmediate() {
    if (this.metric != null) if (this.hasMeshContent && this.shouldBeVisible && this.materialVisibility) {
      if (self.splatsMesh && !self.splatsReady) return;
      this._disposeChildren();
    } else this.childrenTiles.forEach((e) => {
      e._trimTreeImmediate();
    });
  }
  _updateNodeVisibilityImmediate(e = !1) {
    const a = this;
    if (a.hasMeshContent) if (a.shouldBeVisible) a.meshContent.length == a.hasMeshContent ? a.materialVisibility ? a.childrenTiles.forEach((t) => {
      t._updateNodeVisibilityImmediate(!0);
    }) : (a._changeContentVisibility(!0), a.childrenTiles.forEach((t) => {
      t._updateNodeVisibilityImmediate(e);
    })) : a.childrenTiles.forEach((t) => {
      t._updateNodeVisibilityImmediate(e);
    });
    else {
      if (!a.loadOutsideView && a.metric < 0) return a._changeContentVisibility(!1), a.meshContent.length > 0 && a._disposeMeshContent(), void a.childrenTiles.forEach((t) => {
        t._updateNodeVisibilityImmediate(!0);
      });
      if (!a.materialVisibility || a.splatsMesh && !a.splatsReady) a.childrenTiles.forEach((t) => {
        t._updateNodeVisibilityImmediate(e);
      });
      else if (e) a._changeContentVisibility(!1), a.meshContent.length > 0 && a._disposeMeshContent(), a.childrenTiles.forEach((t) => {
        t._updateNodeVisibilityImmediate(e);
      });
      else {
        let t = !0;
        a.childrenTiles.every((A) => !!A._isReadyImmediate() || (t = !1, !1)), t && a.childrenTiles.length > 0 ? (a._changeContentVisibility(!1), a.meshContent.length > 0 && a._disposeMeshContent(), a.childrenTiles.forEach((A) => {
          A._updateNodeVisibilityImmediate(e);
        })) : a.childrenTiles.forEach((A) => {
          A._updateNodeVisibilityImmediate(!a.splatsMesh || !!a.splatsReady);
        });
      }
    }
    else a.childrenTiles.forEach((t) => {
      t._updateNodeVisibilityImmediate(e);
    });
  }
  _shouldBeVisibleUpdateImmediate() {
    const e = this;
    e.hasMeshContent ? e.metric == null ? e.shouldBeVisible = !1 : e.metric < 0 ? (e.shouldBeVisible = !!e.loadOutsideView, e.childrenTiles.forEach((a) => {
      a._setShouldNotBeVisibleRecursive();
    })) : e.metric < e.geometricErrorMultiplier * e.geometricError ? e.hasUnloadedJSONContent || (e.json && e.json.children && e.json.children.length > 0 ? (e.shouldBeVisible = !1, e.childrenTiles.forEach((a) => {
      a.shouldBeVisible = !0, a._shouldBeVisibleUpdateImmediate();
    })) : e.shouldBeVisible = !0) : e.childrenTiles.forEach((a) => {
      a._setShouldNotBeVisibleRecursive();
    }) : (e.childrenTiles.forEach((a) => {
      a.shouldBeVisible = !0, a._shouldBeVisibleUpdateImmediate();
    }), e.shouldBeVisible = !1);
  }
  _setShouldNotBeVisibleRecursive() {
    this.shouldBeVisible = !1, this.childrenTiles.forEach((e) => {
      e._setShouldNotBeVisibleRecursive();
    });
  }
  _loadMeshImmediate() {
    const e = this;
    e.hasMeshContent && e.shouldBeVisible ? e.meshContent.length < e.hasMeshContent && e.contentURL.length == 0 && (e.deleted = !1, e._load(!1, !0)) : e.childrenTiles.forEach((a) => {
      a._loadMeshImmediate();
    });
  }
  _computeMetricRecursive(e, a) {
    const t = this;
    t.metric = -1, t.isSetup && (t.boundingVolume && t.geometricError && (t.metric = t._calculateUpdateMetric(e, a)), t.childrenTiles.forEach((A) => A._computeMetricRecursive(e, a)));
  }
  _expandTreeImmediate(e) {
    const a = this;
    a.hasUnloadedJSONContent || (a.hasMeshContent ? a.occlusionCullingService && a.hasMeshContent && !a.occlusionCullingService.hasID(a.colorID) || a.metric >= 0 && a.metric < a.geometricErrorMultiplier * a.geometricError && a.json && a.json.children && a.childrenTiles.length < a.json.children.length && a._loadJsonChildren(e) : a.json && a.json.children && a.childrenTiles.length < a.json.children.length && a._loadJsonChildren(e)), a.childrenTiles.forEach((t) => t._expandTreeImmediate(e));
  }
  _update(e, a) {
    const t = this;
    if (!t.isSetup) return;
    const A = t.materialVisibility;
    t.boundingVolume && t.geometricError && (t.metric = t._calculateUpdateMetric(e, a)), t.childrenTiles.forEach((i) => i._update(e, a)), function(i) {
      if (i < 0) return t.inFrustum = !1, void t._changeContentVisibility(!!t.loadOutsideView);
      if (t.inFrustum = !0, !!t.hasMeshContent && !(t.meshContent.length < t.hasMeshContent)) {
        if (t.childrenTiles.length == 0) return void t._changeContentVisibility(!0);
        if (i >= t.geometricErrorMultiplier * t.geometricError) t._changeContentVisibility(!0);
        else if (i < t.geometricErrorMultiplier * t.geometricError && t.refine == "REPLACE") {
          let s = !0;
          t.childrenTiles.every((r) => !!r._isReady() || (s = !1, !1)), s ? t._changeContentVisibility(!1) : t._changeContentVisibility(!0);
        }
      }
    }(t.metric), function(i) {
      i < 0 && t.hasMeshContent || t.occlusionCullingService && t.hasMeshContent && !t.occlusionCullingService.hasID(t.colorID) || (!t.hasMeshContent || i <= t.geometricErrorMultiplier * t.geometricError && (t.meshContent.length > 0 || t.splatsMesh)) && t.json && t.json.children && t.childrenTiles.length != t.json.children.length && t._loadJsonChildren(e);
    }(t.metric), function(i, s) {
      if (t.hasMeshContent) {
        if (!t.inFrustum) return void t._disposeChildren();
        if (t.occlusionCullingService && !s && t.hasMeshContent && t.meshContent.length > 0 && t.materialVisibility && t._areAllChildrenLoadedAndHidden())
          return t.splatsMesh && this.materialVisibility && !t.splatsReady ? void 0 : void t._disposeChildren();
        if (i >= t.geometricErrorMultiplier * t.geometricError) {
          if (t.splatsMesh && t.materialVisibility && !t.splatsReady) return;
          t._disposeChildren();
        }
      }
    }(t.metric, A);
  }
  _loadJsonChildren(e) {
    const a = this;
    for (let t = a.json.children.length - 1; t >= 0; t--) a.json.children[t].root || a.json.children[t].children || a.json.children[t].getChildren || a.json.children[t].content || a.json.children[t].contents || a.json.children.splice(t, 1);
    a.json.children.forEach((t) => {
      let A = new Wt({ parentTile: a, queryParams: a.queryParams, parentGeometricError: a.geometricError, parentBoundingVolume: a.boundingVolume, parentRefine: a.refine, json: t, rootPath: a.rootPath, geometricErrorMultiplier: a.geometricErrorMultiplier, loadOutsideView: a.loadOutsideView, level: Math.floor(a.level) + 1, tileLoader: a.tileLoader, cameraOnLoad: e, occlusionCullingService: a.occlusionCullingService, renderer: a.renderer, static: a.static, centerModel: !1, displayErrors: a.displayErrors, displayCopyright: a.displayCopyright, distanceBias: a.distanceBias, loadingStrategy: a.loadingStrategy, drawBoundingVolume: a.drawBoundingVolume, splatsMesh: a.splatsMesh });
      a.childrenTiles.push(A), a.add(A);
    }), a.updateMatrices(!0);
  }
  _areAllChildrenLoadedAndHidden() {
    let e = !0;
    const a = this;
    return this.childrenTiles.every((t) => {
      if (t.hasMeshContent) {
        if (t.childrenTiles.length > 0) return e = !1, !1;
        if (!t.metric < 0) return !0;
        if (t.materialVisibility && (!a.splatsMesh || a.splatsReady) || a.occlusionCullingService.hasID(t.colorID)) return e = !1, !1;
      } else if (!t._areAllChildrenLoadedAndHidden()) return e = !1, !1;
      return !0;
    }), e;
  }
  _isReady() {
    if (this.metric == null) return !1;
    if (this.metric < 0) return !0;
    if (this.hasUnloadedJSONContent) return !1;
    if (!this.hasMeshContent && this.json.children.length == 0 && !this.hasUnloadedJSONContent) return !0;
    if (!this.hasMeshContent || this.meshContent.length == 0 || !this.materialVisibility) {
      if (this.children.length > 0) {
        var e = !0;
        return this.childrenTiles.every((a) => !!a._isReady() || (e = !1, !1)), e;
      }
      return !1;
    }
    return !this.hasMeshContent || !(this.meshContent.length < this.hasMeshContent) && !!this.materialVisibility;
  }
  _isReadyImmediate() {
    if (this.materialVisibility || !this.loadOutsideView && this.metric < 0) return !0;
    if (this.childrenTiles.length > 0) {
      var e = !0;
      return this.childrenTiles.every((a) => !!a._isReadyImmediate() || (e = !1, !1)), e;
    }
    return !1;
  }
  _changeContentVisibility(e) {
    const a = this;
    if (a.bbox && (a.bbox.material.visible = e), a.splatsMesh) e != a.materialVisibility && (a.meshContent.forEach((t) => {
      e && t.isSplatsBatch ? t.show(() => {
        a.materialVisibility && (a.splatsReady = !0);
      }) : (t.hide(), a.splatsReady = !1);
    }), a.materialVisibility = e);
    else {
      if (a.hasMeshContent && a.meshContent.length > 0 && (e ? a.meshContent.forEach((t) => {
        t.traverse((A) => {
          (A.isMesh || A.isPoints) && A.layers.enable(0);
        });
      }) : a.meshContent.forEach((t) => {
        t.traverse((A) => {
          (A.isMesh || A.isPoints) && A.layers.disable(0);
        });
      })), a.materialVisibility == e) return;
      a.materialVisibility = e;
    }
  }
  _calculateUpdateMetric(e, a) {
    let t = 0;
    if (this.boundingVolume instanceof Z) {
      if (fe.copy(this.boundingVolume), fe.applyMatrix4(this.matrixWorld), !fe.inFrustum(a)) return -1;
      t = Math.max(0, fe.distanceToPoint(e.position) - e.near);
    } else {
      if (!(this.boundingVolume instanceof E.Sphere)) return console.error("unsupported shape"), -1;
      if (te.copy(this.boundingVolume), te.applyMatrix4(this.matrixWorld), !a.intersectsSphere(te)) return -1;
      t = Math.max(0, e.position.distanceTo(te.center) - te.radius - e.near);
    }
    if (t = Math.pow(t, this.distanceBias), t == 0) return 0;
    const A = this.matrixWorld.getMaxScaleOnAxis();
    this.renderer && this.renderer.getDrawingBufferSize(this.rendererSize);
    let i = this.rendererSize.y, s = e.fov;
    return e.aspect < 1 && (s *= e.aspect, i = this.rendererSize.x), 16 * (2 * Math.tan(0.5 * s * 0.017453292519943295) * t) / (i * A);
  }
  _getSiblings() {
    const e = this, a = [];
    if (!e.parentTile) return a;
    let t = e.parentTile;
    for (; !t.hasMeshContent && t.parentTile; ) t = t.parentTile;
    return t.childrenTiles.forEach((A) => {
      if (A && A != e) {
        for (; !A.hasMeshContent && A.childrenTiles[0]; ) A = A.childrenTiles[0];
        a.push(A);
      }
    }), a;
  }
  _calculateDistanceToCamera(e) {
    return this.boundingVolume instanceof Z ? (fe.copy(this.boundingVolume), fe.applyMatrix4(this.matrixWorld), Math.max(0, fe.distanceToPoint(e.position))) : this.boundingVolume instanceof E.Sphere ? (te.copy(this.boundingVolume), te.applyMatrix4(this.matrixWorld), Math.max(0, e.position.distanceTo(te.center) - te.radius)) : (console.error("unsupported shape"), -1);
  }
  setGeometricErrorMultiplier(e) {
    this.geometricErrorMultiplier = e, this.childrenTiles.forEach((a) => a.setGeometricErrorMultiplier(e));
  }
  setDistanceBias(e) {
    this.distanceBias = e, this.childrenTiles.forEach((a) => a.setDistanceBias(e));
  }
  _transformWGS84ToCartesian(e, a, t, A) {
    const i = 6378137 / Math.sqrt(1 - 0.006694384442042 * Math.pow(Math.sin(a), 2)), s = Math.cos(a), r = Math.cos(e), n = Math.sin(a), o = i + t, c = o * s * r, b = o * s * Math.sin(e), g = (0.993305615557957 * i + t) * n;
    A.set(c, b, g);
  }
}
function gt(h) {
  var e = document.createElement("div");
  e.textContent = h, e.style.position = "fixed", e.style.top = "10px", e.style.left = "50%", e.style.transform = "translateX(-50%)", e.style.padding = "10px", e.style.backgroundColor = "#ff8800", e.style.color = "#ffffff", e.style.zIndex = "9999", document.body.appendChild(e), setTimeout(function() {
    e.remove();
  }, 8e3);
}
function Ba() {
  Y || ((Y = document.createElement("div")).style.position = "fixed", Y.style.bottom = "20px", Y.style.left = "20px", Y.style.color = "white", Y.style.textShadow = "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000", Y.style.padding = "10px", Y.style.backgroundColor = "rgba(0, 0, 0, 0.1)", document.body.appendChild(Y));
  const h = Pi();
  let e = "";
  h.forEach((a) => {
    e += a + ", ";
  }), e = e.slice(0, -2), Y.textContent = e;
}
const N = new E.Sphere(new E.Vector3(0, 0, 0), 1), ce = new E.Vector3(0, 0, 0), Ca = new E.Vector3(0, 0, 0), qi = new E.Vector3(0, 1, 0), pa = new E.Vector2(), ft = new E.Quaternion(), ut = new E.Matrix4();
class Ta extends E.Object3D {
  constructor(e) {
    super();
    const a = this;
    if (e.queryParams && (this.queryParams = { ...e.queryParams }), this.uuid = St(), e.tileLoader ? this.tileLoader = e.tileLoader : console.error("an instanced tileset must be provided an InstancedTilesetLoader"), this.master = e.master, this.loadOutsideView = e.loadOutsideView, this.cameraOnLoad = e.cameraOnLoad, this.parentTile = e.parentTile, this.distanceBias = Math.max(1e-4, e.distanceBias ? e.distanceBias : 1), this.childrenTiles = [], this.jsonChildren = [], this.meshContent = /* @__PURE__ */ new Set(), this.static = e.static, this.static && (this.matrixAutoUpdate = !1, this.matrixWorldAutoUpdate = !1), this.tileContent, this.refinement, this.rootPath, this.geometricError, this.boundingVolume, this.json, this.materialVisibility = !1, this.inFrustum = !0, this.level = e.level ? e.level : 0, this.hasMeshContent = 0, this.hasUnloadedJSONContent = 0, this.centerModel = e.centerModel, this.deleted = !1, this.abortController = new AbortController(), e.json) this.rootPath = e.json.rootPath ? e.json.rootPath : e.rootPath, e.json.children && (this.jsonChildren = e.json.children), a.setup(e);
    else if (e.url) {
      this.loadJson = (i, s) => {
        const r = be.dirname(s);
        a.setup({ rootPath: r, json: i, onLoadCallback: e.onLoadCallback });
      };
      var t = e.url;
      if (a.queryParams) {
        var A = "";
        for (let i in a.queryParams) a.queryParams.hasOwnProperty(i) && (A += "&" + i + "=" + a.queryParams[i]);
        t.includes("?") ? t += A : t += "?" + A.substring(1);
      }
      a.tileLoader.get(a.abortController, t, a.uuid, a);
    }
  }
  async setup(e) {
    const a = this;
    e.json.root ? (a.json = e.json.root, !a.json.children && a.json.getChildren && (a.json.children = await a.json.getChildren()), a.jsonChildren = a.json.children, a.json.refinement || (a.json.refinement = e.json.refinement), a.json.geometricError || (a.json.geometricError = e.json.geometricError), a.json.transform || (a.json.transform = e.json.transform), a.json.boundingVolume || (a.json.boundingVolume = e.json.boundingVolume)) : (a.json = e.json, !a.json.children && a.json.getChildren && (a.json.children = await a.json.getChildren(), a.jsonChildren = a.json.children)), a.rootPath = e.json.rootPath ? e.json.rootPath : e.rootPath, a.json.refinement ? a.refinement = a.json.refinement : a.refinement = e.parentRefinement, a.json.geometricError ? a.geometricError = a.json.geometricError : a.geometricError = e.parentGeometricError;
    let t = new E.Matrix4();
    if (a.json.transform && !a.centerModel && (t.elements = a.json.transform), a.applyMatrix4(t), a.parentTile && a.parentTile.matrix && (a.matrix.premultiply(a.parentTile.matrix), a.matrix.decompose(a.position, a.quaternion, a.scale)), a.matrixWorldNeedsUpdate = !0, a.updateWorldMatrix(!0, !0), a.json.boundingVolume) if (a.json.boundingVolume.box) a.boundingVolume = new Z(a.json.boundingVolume.box);
    else if (a.json.boundingVolume.region) {
      const i = a.json.boundingVolume.region;
      a.transformWGS84ToCartesian(i[0], i[1], i[4], ce), a.transformWGS84ToCartesian(i[2], i[3], i[5], Ca), ce.lerp(Ca, 0.5), a.boundingVolume = new E.Sphere(new E.Vector3(ce.x, ce.y, ce.z), ce.distanceTo(Ca));
    } else if (a.json.boundingVolume.sphere) {
      const i = a.json.boundingVolume.sphere;
      a.boundingVolume = new E.Sphere(new E.Vector3(i[0], i[1], i[2]), i[3]);
    } else a.boundingVolume = e.parentBoundingVolume;
    else a.boundingVolume = e.parentBoundingVolume;
    function A(i) {
      i.uri && i.uri.includes("json") || i.url && i.url.includes("json") ? a.hasUnloadedJSONContent++ : a.hasMeshContent++;
    }
    if (a.json.content ? (A(a.json.content), a.load()) : a.json.contents && (a.json.contents.forEach((i) => A(i)), a.load()), a.centerModel) {
      const i = new E.Sphere();
      a.boundingVolume instanceof Z ? i.copy(a.boundingVolume.sphere) : a.boundingVolume instanceof E.Sphere && i.copy(a.boundingVolume), this.json.boundingVolume.region && (a.transformWGS84ToCartesian(0.5 * (a.json.boundingVolume.region[0] + a.json.boundingVolume.region[2]), 0.5 * (a.json.boundingVolume.region[1] + a.json.boundingVolume.region[3]), 0.5 * (a.json.boundingVolume.region[4] + a.json.boundingVolume.region[5]), ce), ft.setFromUnitVectors(ce.normalize(), qi.normalize()), a.master.applyQuaternion(ft), a.master.updateWorldMatrix(!1, !1)), ut.makeTranslation(-i.center.x * a.scale.x, -i.center.y * a.scale.y, -i.center.z * a.scale.z), a.master.matrix.multiply(ut), a.master.matrix.decompose(a.master.position, a.master.quaternion, a.master.scale);
    }
    a.isSetup = !0, e.onLoadCallback && e.onLoadCallback(a);
  }
  isAbsolutePathOrURL(e) {
    const a = /^(?:http|https|ftp|tcp|udp):\/\/\S+/.test(e), t = e.startsWith("/") && !e.startsWith("//");
    return a || t;
  }
  assembleURL(e, a) {
    e.endsWith("/") || (e += "/");
    const t = new URL(e);
    let A = t.pathname.split("/").filter((s) => s !== ""), i = a.split("/").filter((s) => s !== "");
    for (let s = 1; s <= A.length && !(s >= i.length); s++)
      if (A.slice(A.length - s, A.length).join("/") === i.slice(0, s).join("/")) {
        for (let r = 0; r < s; r++) A.pop();
        break;
      }
    for (; i.length > 0 && i[0] === ".."; ) A.pop(), i.shift();
    return `${t.protocol}//${t.host}/${[...A, ...i].join("/")}`;
  }
  extractQueryParams(e, a) {
    const t = new URL(e);
    for (let [A, i] of t.searchParams) a[A] = i;
    return t.search = "", t.toString();
  }
  load() {
    var e = this;
    function a(t) {
      let A;
      t.uri ? A = t.uri : t.url && (A = t.url);
      const i = /^(?:http|https|ftp|tcp|udp):\/\/\S+/;
      if (i.test(e.rootPath) ? i.test(A) || (A = e.assembleURL(e.rootPath, A)) : be.isAbsolute(e.rootPath) && (A = e.rootPath + be.sep + A), A = e.extractQueryParams(A, e.queryParams), e.queryParams) {
        var s = "";
        for (let r in e.queryParams) e.queryParams.hasOwnProperty(r) && (s += "&" + r + "=" + e.queryParams[r]);
        A.includes("?") ? A += s : A += "?" + s.substring(1);
      }
      A && (A.includes(".b3dm") || A.includes(".glb") || A.includes(".gltf") ? (e.contentURL = A, e.tileLoader.get(e.abortController, A, e.uuid, e, e.cameraOnLoad ? () => e.calculateDistanceToCamera(e.cameraOnLoad) : () => 0, () => e.getSiblings(), e.level, !e.json.boundingVolume.region, !!e.json.boundingVolume.region, e.geometricError)) : A.includes(".json") && e.tileLoader.get(e.abortController, A, e.uuid, e));
    }
    e.deleted || (e.json.content ? a(e.json.content) : e.json.contents && e.json.contents.forEach((t) => a(t)));
  }
  loadMesh(e) {
    this.deleted || this.meshContent.add(e);
  }
  loadJson(e, a) {
    this.deleted || (this.json.children && (this.jsonChildren = this.json.children), e.rootPath = be.dirname(a), this.jsonChildren.push(e), this.hasUnloadedJSONContent--);
  }
  dispose() {
    const e = this;
    e.childrenTiles.forEach((a) => a.dispose()), e.deleted = !0, e.abortController && e.abortController.abort(), this.parent = null, this.parentTile = null, this.dispatchEvent({ type: "removed" });
  }
  disposeChildren() {
    this.childrenTiles.forEach((e) => e.dispose()), this.childrenTiles = [];
  }
  _update(e, a) {
    const t = this;
    function A(i) {
      if (t.hasMeshContent && !(t.meshContent.size < t.hasMeshContent)) {
        if (i < 0) return t.inFrustum = !1, void t.changeContentVisibility(!!t.loadOutsideView);
        if (t.inFrustum = !0, t.childrenTiles.length != 0) {
          if (i >= t.master.geometricErrorMultiplier * t.geometricError) t.changeContentVisibility(!0);
          else if (i < t.master.geometricErrorMultiplier * t.geometricError) {
            let s = !0;
            t.childrenTiles.every((r) => !!r.isReady() || (s = !1, !1)), s && t.changeContentVisibility(!1);
          }
        } else t.changeContentVisibility(!0);
      }
    }
    t.isSetup && (t.materialVisibility, t.boundingVolume && t.geometricError && (t.metric = t.calculateUpdateMetric(e, a)), t.childrenTiles.forEach((i) => i._update(e, a)), A(t.metric), function(i) {
      i < 0 && t.hasMeshContent || (!t.hasMeshContent && t.rootPath || i < t.master.geometricErrorMultiplier * t.geometricError && t.meshContent.size > 0) && t.json && t.jsonChildren && t.childrenTiles.length != t.jsonChildren.length && t.jsonChildren.forEach((s) => {
        if (!(s.root || s.children || s.getChildren || s.content || s.contents)) return;
        let r = new Ta({ parentTile: t, queryParams: t.queryParams, parentGeometricError: t.geometricError, parentBoundingVolume: t.boundingVolume, parentRefinement: t.refinement, json: s, rootPath: t.rootPath, loadOutsideView: t.loadOutsideView, level: t.level + 1, tileLoader: t.tileLoader, cameraOnLoad: e, master: t.master, centerModel: !1 });
        t.childrenTiles.push(r);
      });
    }(t.metric), function(i) {
      if (t.hasMeshContent) {
        if (!t.inFrustum) return t.disposeChildren(), void A(i);
        i >= t.master.geometricErrorMultiplier * t.geometricError && (t.disposeChildren(), A(i));
      }
    }(t.metric));
  }
  areAllChildrenLoadedAndHidden() {
    let e = !0;
    return this.childrenTiles.every((a) => {
      if (a.hasMeshContent) {
        if (a.childrenTiles.length > 0) return e = !1, !1;
        if (!a.inFrustum) return !0;
        if (!a.materialVisibility || a.meshesToDisplay != a.meshesDisplayed) return e = !1, !1;
      } else if (!a.areAllChildrenLoadedAndHidden()) return e = !1, !1;
      return !0;
    }), e;
  }
  isReady() {
    if (!this.inFrustum) return !0;
    if (this.hasUnloadedJSONContent) return !1;
    if (!this.hasMeshContent || this.meshContent.size == 0 || !this.materialVisibility) {
      if (this.childrenTiles.length > 0) {
        var e = !0;
        return this.childrenTiles.every((a) => !!a.isReady() || (e = !1, !1)), e;
      }
      return !1;
    }
    return !this.hasMeshContent || !(this.meshContent.size < this.hasMeshContent) && !!this.materialVisibility;
  }
  changeContentVisibility(e) {
    this.materialVisibility = e;
  }
  calculateUpdateMetric(e, a) {
    if (this.boundingVolume instanceof Z) {
      if (N.copy(this.boundingVolume.sphere), N.applyMatrix4(this.matrixWorld), !a.intersectsSphere(N)) return -1;
    } else {
      if (!(this.boundingVolume instanceof E.Sphere)) return console.error("unsupported shape"), -1;
      if (N.copy(this.boundingVolume), N.applyMatrix4(this.matrixWorld), !a.intersectsSphere(N)) return -1;
    }
    let t = Math.max(0, e.position.distanceTo(N.center) - N.radius);
    if (t = Math.pow(t, this.distanceBias), t == 0) return 0;
    const A = this.matrixWorld.getMaxScaleOnAxis();
    this.master._renderSize(pa);
    let i = pa.y, s = e.fov;
    e.aspect < 1 && (s *= e.aspect, i = pa.x);
    let r = 2 * Math.tan(0.5 * s * 0.017453292519943295) * t;
    return 16 * window.devicePixelRatio * r / (i * A);
  }
  getSiblings() {
    const e = this, a = [];
    if (!e.parentTile) return a;
    let t = e.parentTile;
    for (; !t.hasMeshContent && t.parentTile; ) t = t.parentTile;
    return t.childrenTiles.forEach((A) => {
      if (A && A != e) {
        for (; !A.hasMeshContent && A.childrenTiles[0]; ) A = A.childrenTiles[0];
        a.push(A);
      }
    }), a;
  }
  calculateDistanceToCamera(e) {
    return this.boundingVolume instanceof Z ? (N.copy(this.boundingVolume.sphere), N.applyMatrix4(this.matrixWorld)) : this.boundingVolume instanceof E.Sphere ? (N.copy(this.boundingVolume), N.applyMatrix4(this.matrixWorld)) : console.error("unsupported shape"), Math.max(0, e.position.distanceTo(N.center) - N.radius);
  }
  getWorldMatrix() {
    return this.matrixWorld;
  }
  transformWGS84ToCartesian(e, a, t, A) {
    const i = 6378137 / Math.sqrt(1 - 0.006694384442042 * Math.pow(Math.sin(a), 2)), s = Math.cos(a), r = Math.cos(e), n = Math.sin(a), o = i + t, c = o * s * r, b = o * s * Math.sin(e), g = (0.993305615557957 * i + t) * n;
    A.set(c, b, g);
  }
}
class Xi extends E.Object3D {
  constructor(e) {
    super(), e.master = this, e.domWidth && e.domHeight ? this.rendererSize = new E.Vector2(e.domWidth, e.domHeight) : this.rendererSize = new E.Vector2(1e3, 1e3), this.renderer = e.renderer, this.distanceBias = Math.max(1e-4, e.distanceBias ? e.distanceBias : 1), this.geometricErrorMultiplier = e.geometricErrorMultiplier ? e.geometricErrorMultiplier : 1, this.tileset = new Ta(e), e.static && (this.matrixAutoUpdate = !1), this.tileLoader = e.tileLoader;
  }
  _renderSize(e) {
    this.renderer ? this.renderer.getDrawingBufferSize(e) : e.copy(this.rendererSize);
  }
  setCanvasSize(e, a) {
    this.rendererSize.set(e, a);
  }
  update(e, a) {
    if (a) this.tileset._update(e, a);
    else {
      const t = new E.Frustum();
      t.setFromProjectionMatrix(new E.Matrix4().multiplyMatrices(e.projectionMatrix, e.matrixWorldInverse)), this.tileset._update(e, t);
    }
  }
  setGeometricErrorMultiplier(e) {
    this.geometricErrorMultiplier = e || 1;
  }
}
class _i {
  constructor(e) {
    const a = this;
    a.scene = e, a.instancedTiles = [], a.instancedMesh, a.reuseableMatrix = new E.Matrix4();
  }
  addInstance(e) {
    const a = this;
    e.added = !0, e.listOMesh = a.instancedTiles, a.instancedTiles.push(e), a.instancedMesh && e.loadMesh(a.instancedMesh);
  }
  addToScene() {
    const e = this;
    e.instancedMesh.setMatrixAt(0, new E.Matrix4()), e.instancedMesh.instanceMatrix.needsUpdate = !0, e.instancedMesh.count = 1, e.scene.add(e.instancedMesh), e.instancedMesh.onAfterRender = () => {
      delete e.instancedMesh.onAfterRender, e.instancedMesh.displayedOnce = !0;
    };
  }
  setObject(e) {
    const a = this;
    a.instancedMesh = e, a.instancedMesh.matrixAutoUpdate = !1, a.instancedMesh.matrixWorldAutoUpdate = !1, a.scene.children.includes(e) || this.addToScene();
    for (let t = 0; t < a.instancedTiles.length; t++) a.instancedTiles[t].loadMesh(a.instancedMesh);
  }
  update() {
    const e = this;
    for (let a = e.instancedTiles.length - 1; a >= 0; a--) e.instancedTiles[a].deleted && e.instancedTiles.splice(a, 1);
    if (e.instancedMesh) {
      e.instancedMesh.count = 0, e.instancedMesh.instancedTiles = [];
      for (let a = 0; a < e.instancedTiles.length; a++) e.instancedTiles[a].meshContent.add(e.instancedMesh), e.instancedTiles[a].materialVisibility && (e.instancedMesh.count++, e.reuseableMatrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), e.reuseableMatrix.multiply(e.instancedTiles[a].matrixWorld), e.reuseableMatrix.multiply(e.instancedMesh.baseMatrix), e.instancedMesh.setMatrixAt(e.instancedMesh.count - 1, e.reuseableMatrix), e.instancedMesh.instancedTiles.push(e.instancedTiles[a]));
      e.instancedMesh.instanceMatrix.needsUpdate = !0, e.instancedMesh.needsUpdate = !0, e.instancedMesh.computeBoundingSphere();
    }
  }
  getCount() {
    return this.instancedTiles.length;
  }
  dispose() {
    const e = this;
    return !(e.instancedTiles.length > 0) && !!e.instancedMesh && (e.scene.remove(e.instancedMesh), e.instancedMesh.traverse((a) => {
      if (a.dispose && a.dispose(), a.material) if (a.material.length) for (let t = 0; t < a.material.length; ++t) a.material[t].dispose();
      else a.material.dispose();
      a.geometry && a.geometry.dispose();
    }), e.instancedMesh.dispose(), !0);
  }
}
class Ki {
  constructor() {
    const e = this;
    e.count = 0, e.json, e.instancedTiles = [];
  }
  addInstance(e) {
    this.instancedTiles.push(e), this.json && e.loadJson(this.json, this.url);
  }
  setObject(e, a) {
    const t = this;
    t.json = e, t.url = a;
    for (let A = 0; A < t.instancedTiles.length; A++) t.instancedTiles[A].loadJson(t.json, t.url);
  }
  getCount() {
    return this.instancedTiles.length;
  }
  update() {
    const e = this;
    for (let a = e.instancedTiles.length - 1; a >= 0; a--) e.instancedTiles[a].deleted && e.instancedTiles.splice(a, 1);
  }
  dispose() {
    return !(!this.json || this.instancedTiles.length != 0);
  }
}
let ue = 0;
class Zi {
  constructor(e, a) {
    if (this.zUpToYUpMatrix = new E.Matrix4(), this.zUpToYUpMatrix.set(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1), this.maxCachedItems = 100, this.maxInstances = 1, this.proxy = a.proxy, a && (this.meshCallback = a.meshCallback, this.pointsCallback = a.pointsCallback, a.maxCachedItems && (this.maxCachedItems = a.maxCachedItems), a.maxInstances && (this.maxInstances = a.maxInstances)), this.gltfLoader = new Dt(), a && a.dracoLoader) this.gltfLoader.setDRACOLoader(a.dracoLoader), this.hasDracoLoader = !0;
    else {
      const t = new Rt();
      t.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.4.3/"), this.gltfLoader.setDRACOLoader(t), this.gltfLoader.hasDracoLoader = !0;
    }
    if (a && a.ktx2Loader) this.gltfLoader.setKTX2Loader(a.ktx2Loader), this.hasKTX2Loader = !0;
    else if (a && a.renderer) {
      const t = new L();
      t.setTranscoderPath("https://storage.googleapis.com/ogc-3d-tiles/basis/").detectSupport(a.renderer), this.gltfLoader.setKTX2Loader(t), this.gltfLoader.hasKTX2Loader = !0;
    }
    this.gltfLoader.setMeshoptDecoder(Vt), this.hasMeshOptDecoder = !0, this.b3dmDecoder = new jt(this.gltfLoader), this.cache = new kt(), this.scene = e, this.ready = [], this.downloads = [], this.nextReady = [], this.nextDownloads = [];
  }
  update() {
    const e = this;
    e._checkSize(), e.cache._data.forEach((a) => {
      a.update();
    }), ue < 8 && e._download(), e._loadBatch();
  }
  _download() {
    const e = this;
    if (e.nextDownloads.length != 0 || (e._getNextDownloads(), e.nextDownloads.length != 0)) for (; e.nextDownloads.length > 0; ) {
      const t = e.nextDownloads.shift();
      if (t) {
        if (t.path.includes(".b3dm") && (a = e.proxy ? () => fetch(e.proxy, { method: "POST", body: t.path }) : () => fetch(t.path), ue++, a().then((A) => {
          if (!A.ok) throw console.error("could not load tile with path : " + t.path), new Error(`couldn't load "${t.path}". Request failed with status ${A.status} : ${A.statusText}`);
          return A.arrayBuffer();
        }).then((A) => this.b3dmDecoder.parseB3DMInstanced(A, (i) => {
          e.meshCallback(i, t.geometricError);
        }, e.maxInstances, t.sceneZupToYup, t.meshZupToYup)).then((A) => {
          A.frustumCulled = !1, t.tile.setObject(A), e.ready.unshift(t);
        }).catch((A) => console.error(A)).finally(() => {
          ue--;
        })), t.path.includes(".glb") || t.path.includes(".gltf")) a = e.proxy ? () => fetch(e.proxy, { method: "POST", body: t.path }) : () => fetch(t.path), ue++, a().then((A) => {
          if (!A.ok) throw new Error("missing content");
          return A.arrayBuffer();
        }).then(async (A) => {
          await zi(this.gltfLoader), this.gltfLoader.parse(A, null, (i) => {
            let s;
            i.scene.asset = i.asset, t.sceneZupToYup && i.scene.applyMatrix4(this.zUpToYUpMatrix), i.scene.traverse((r) => {
              r.geometricError = t.geometricError, r.isMesh && (t.meshZupToYup && r.applyMatrix4(this.zUpToYUpMatrix), e.meshCallback && e.meshCallback(r, r.geometricError)), r.isPoints && console.error("instanced point cloud is not supported");
            }), i.scene.updateWorldMatrix(!1, !0), i.scene.traverse((r) => {
              r.isMesh && (s = new E.InstancedMesh(r.geometry, r.material, e.maxInstances), s.baseMatrix = r.matrixWorld);
            }), e.ready.unshift(t), s ? (s.frustumCulled = !1, t.tile.setObject(s)) : i.scene.traverse((r) => {
              r.dispose && r.dispose(), r.material && r.material.dispose();
            });
          });
        }, (A) => {
          console.error("could not load tile : " + t.path);
        }).finally(() => {
          ue--;
        });
        else if (t.path.includes(".json")) {
          var a;
          a = e.proxy ? () => fetch(e.proxy, { method: "POST", body: t.path }) : () => fetch(t.path), ue++, a().then((A) => {
            if (!A.ok) throw console.error("could not load tile with path : " + t.path), new Error(`couldn't load "${t.path}". Request failed with status ${A.status} : ${A.statusText}`);
            return A.json();
          }).then((A) => Ma(A, t.path)).then((A) => {
            t.tile.setObject(A, t.path), e.ready.unshift(t);
          }).catch((A) => console.error(A)).finally(() => {
            ue--;
          });
        }
      }
    }
  }
  _loadBatch() {
    return this.nextReady.length == 0 && (this._getNextReady(), this.nextReady.length == 0) ? 0 : this.nextReady.shift() ? 1 : 0;
  }
  _getNextReady() {
    let e = Number.MAX_VALUE, a = -1;
    for (let t = this.ready.length - 1; t >= 0; t--) this.ready[t].distanceFunction || this.nextReady.push(this.ready.splice(t, 1)[0]);
    if (!(this.nextReady.length > 0)) {
      for (let t = this.ready.length - 1; t >= 0; t--) {
        const A = this.ready[t].distanceFunction() * this.ready[t].level;
        A < e && (e = A, a = t);
      }
      if (a >= 0) {
        const t = this.ready.splice(a, 1).pop();
        this.nextReady.push(t);
        const A = t.getSiblings();
        for (let i = this.ready.length - 1; i >= 0; i--) A.includes(this.ready[i].uuid) && this.nextready.push(this.ready.splice(i, 1).pop());
      }
    }
  }
  get(e, a, t, A, i, s, r, n, o, c) {
    const b = this, g = function(d) {
      for (var f = d.split("/"), I = [], m = 0, u = 0; u < f.length; u++) {
        var C = f[u];
        C !== "." && C !== "" && C !== ".." ? I[m++] = C : C === ".." && m > 0 && m--;
      }
      if (m === 0) return "/";
      var B = "";
      for (u = 0; u < m; u++) B += "/" + I[u];
      return B;
    }(a);
    if (!(a.includes(".b3dm") || a.includes(".json") || a.includes(".glb") || a.includes(".gltf"))) return void console.error("the 3DTiles cache can only be used to load B3DM, gltf and json data");
    const l = b.cache.get(g);
    if (l) l.addInstance(A);
    else if (a.includes(".b3dm") || a.includes(".glb") || a.includes(".gltf")) {
      const d = new _i(b.scene);
      d.addInstance(A), b.cache.put(g, d);
      const f = new AbortController();
      e.signal.addEventListener("abort", () => {
        d.getCount() == 0 && f.abort();
      }), this.downloads.push({ abortController: f, tile: d, key: g, path: a, distanceFunction: i, getSiblings: s, level: r, uuid: t, sceneZupToYup: n, meshZupToYup: o, geometricError: c, shouldDoDownload: () => !0 });
    } else if (a.includes(".json")) {
      const d = new Ki();
      d.addInstance(A), b.cache.put(g, d);
      const f = new AbortController();
      e.signal.addEventListener("abort", () => {
        d.getCount() == 0 && f.abort();
      }), this.downloads.push({ abortController: f, tile: d, key: g, path: a, distanceFunction: i, getSiblings: s, level: r, shouldDoDownload: () => !0 });
    }
  }
  _getNextDownloads() {
    let e = Number.MAX_VALUE, a = -1;
    for (let t = this.downloads.length - 1; t >= 0; t--) {
      const A = this.downloads[t];
      A.shouldDoDownload() ? A.distanceFunction || this.nextDownloads.push(this.downloads.splice(t, 1)[0]) : this.downloads.splice(t, 1);
    }
    if (!(this.nextDownloads.length > 0)) {
      for (let t = this.downloads.length - 1; t >= 0; t--) {
        const A = this.downloads[t], i = A.distanceFunction() * A.level;
        i < e && (e = i, a = t);
      }
      if (a >= 0) {
        const t = this.downloads.splice(a, 1).pop();
        this.nextDownloads.push(t);
        const A = t.getSiblings();
        for (let i = this.downloads.length - 1; i >= 0; i--) A.includes(this.downloads[i].uuid) && this.nextDownloads.push(this.downloads.splice(i, 1).pop());
      }
    }
  }
  _checkSize() {
    const e = this;
    let a = 0;
    for (; e.cache.size() > e.maxCachedItems && a < e.cache.size(); ) {
      a++;
      const t = e.cache.head();
      e.cache.remove(t.key), t.value.dispose() || e.cache.put(t.key, t.value);
    }
  }
}
async function zi(h) {
  return new Promise((e) => {
    const a = setInterval(() => {
      h.hasDracoLoader && !h.dracoLoader || h.hasKTX2Loader && !h.ktx2Loader || (clearInterval(a), e());
    }, 10);
  });
}
export {
  Xi as InstancedOGC3DTile,
  Zi as InstancedTileLoader,
  Wt as OGC3DTile,
  Wi as OcclusionCullingService,
  Ui as TileLoader,
  Pi as getOGC3DTilesCopyrightInfo,
  Ji as splatsFragmentShader,
  Oi as splatsVertexShader
};
//# sourceMappingURL=threedtiles.es.js.map
