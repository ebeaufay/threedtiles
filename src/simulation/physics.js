// Main-thread physics orchestration with a worker backend (skeleton).
// - Spawns ./physics.worker.js (inline) and bridges rendering objects with simulated rigid bodies
// - Supports SharedArrayBuffer geometry sharing when COOP/COEP enables crossOriginIsolated
// - Provides ID-based APIs for rigid bodies and colliders, plus attach/detach
//
// NOTE: This file wires up the API and message protocol. physics.worker.js will contain placeholder logic initially.

import * as THREE from 'three';
import PhysicsRapierWorkerConstructor from './physicsRapier.worker.js?worker&inline'
import PhysicsHelperWorkerConstructor from './physicsHelper.worker.js?worker&inline'

function normalizeVector3(input, fallback = [0, -9.81, 0]) {
  if (!input) return fallback.slice();
  if (Array.isArray(input) && input.length === 3) return [Number(input[0]), Number(input[1]), Number(input[2])];
  if (input.isVector3) return [input.x, input.y, input.z];
  if (typeof input === 'object' && 'x' in input && 'y' in input && 'z' in input) return [Number(input.x), Number(input.y), Number(input.z)];
  return fallback.slice();
}

function normalizeQuaternion(input, fallback = [0, 0, 0, 1]) {
  if (!input) return fallback.slice();
  if (Array.isArray(input) && input.length === 4) return [Number(input[0]), Number(input[1]), Number(input[2]), Number(input[3])];
  if (input.isQuaternion) return [input.x, input.y, input.z, input.w];
  if (input.isEuler) {
    const q = new THREE.Quaternion().setFromEuler(input);
    return [q.x, q.y, q.z, q.w];
  }
  return fallback.slice();
}

function normalizeGravity(gravity) {
  // Supports:
  // - { mode: 'vector', vector: [x,y,z] }
  // - { mode: 'geocentric', planetCenter: [x,y,z], intensity: 9.81 }
  // - simple [x,y,z]
  if (Array.isArray(gravity) || (gravity && gravity.isVector3)) {
    return { mode: 'vector', vector: normalizeVector3(gravity) };
  }
  const g = gravity || {};
  const mode = (g.mode || 'vector').toLowerCase();
  if (mode === 'geocentric') {
    return {
      mode: 'geocentric',
      planetCenter: normalizeVector3(g.planetCenter || [0, 0, 0], [0, 0, 0]),
      intensity: typeof g.intensity === 'number' ? g.intensity : 9.81
    };
  }
  return { mode: 'vector', vector: normalizeVector3(g.vector || g, [0, -9.81, 0]) };
}

// Try deriving a Rapier primitive collider shape from a Three.js geometry.
// Returns null if geometry is not a known simple primitive.
function shapeFromThreeGeometry(geometry) {
  if (!geometry || !geometry.parameters) return null;
  const type = geometry.type;

  // Follow the three.js example mapping to Rapier shapes
  if (type === 'RoundedBoxGeometry') {
    const p = geometry.parameters;
    const sx = (p.width !== undefined ? p.width : 1) / 2;
    const sy = (p.height !== undefined ? p.height : 1) / 2;
    const sz = (p.depth !== undefined ? p.depth : 1) / 2;
    const radius = p.radius !== undefined ? p.radius : 0.1;
    return {
      kind: 'roundCuboid',
      params: { hx: sx - radius, hy: sy - radius, hz: sz - radius, radius }
    };
  } else if (type === 'BoxGeometry') {
    const p = geometry.parameters;
    const sx = (p.width !== undefined ? p.width : 1) / 2;
    const sy = (p.height !== undefined ? p.height : 1) / 2;
    const sz = (p.depth !== undefined ? p.depth : 1) / 2;
    return { kind: 'box', params: { hx: sx, hy: sy, hz: sz } };
  } else if (type === 'SphereGeometry' || type === 'IcosahedronGeometry') {
    const p = geometry.parameters;
    const radius = p.radius !== undefined ? p.radius : 1;
    return { kind: 'ball', params: { radius } };
  } else if (type === 'CylinderGeometry') {
    const p = geometry.parameters;
    const radius = (p.radiusBottom !== undefined ? p.radiusBottom :
      (p.radiusTop !== undefined ? p.radiusTop : (p.radius !== undefined ? p.radius : 0.5)));
    const length = p.height !== undefined ? p.height : 1.0;
    return { kind: 'cylinder', params: { halfHeight: length / 2, radius } };
  } else if (type === 'CapsuleGeometry') {
    const p = geometry.parameters;
    const radius = p.radius !== undefined ? p.radius : 0.5;
    const length = p.height !== undefined ? p.height : 1.0;
    return { kind: 'capsule', params: { halfHeight: length / 2, radius } };
  }

  // Not a recognized primitive
  return null;
}

function makeSharedCopyIfSupported(typed, shared) {
  // Returns { array: TypedArray, transferred: boolean, isShared: boolean, transferList?: ArrayBuffer[] }
  // If SharedArrayBuffer is supported and 'shared' is true, allocates a SAB-backed typed array and copies data.
  // Otherwise, returns the original typed array and proposes its ArrayBuffer for transferList.
  if (!typed) return { array: undefined, transferred: false, isShared: false, transferList: [] };

  const Ctor = typed.constructor;
  if (shared && typeof SharedArrayBuffer !== 'undefined') {
    const sab = new SharedArrayBuffer(typed.byteLength);
    const sharedArray = new Ctor(sab);
    sharedArray.set(typed);
    return { array: sharedArray, transferred: false, isShared: true, transferList: [] };
  }

  // non-shared path: Transfer the ArrayBuffer to worker
  const ab = typed.buffer;
  return { array: typed, transferred: true, isShared: false, transferList: ab ? [ab] : [] };
}

function nowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

export class Physics {
  /**
   * constructor(options)
   *  - updateIntervalMs: number (default 16). setTimeout tick period on the main thread
   *  - fixedDt: number seconds per physics step (default: updateIntervalMs/1000)
   *  - gravity: [x,y,z] OR { mode:'vector', vector:[x,y,z] } OR { mode:'geocentric', planetCenter:[x,y,z], intensity:number }
   *  - autoStart: boolean (default true)
   */
  constructor(options = {}) {
    this.updateIntervalMs = typeof options.updateIntervalMs === 'number' ? options.updateIntervalMs : 16;
    this.fixedDt = typeof options.fixedDt === 'number' ? options.fixedDt : (this.updateIntervalMs / 1000);
    this.gravity = normalizeGravity(options.gravity);
    this.autoStart = options.autoStart !== false;

    // Shared memory support requires crossOriginIsolation (COOP/COEP headers)
    this.sharedMemorySupported = (typeof SharedArrayBuffer !== 'undefined') && !!(globalThis && globalThis.crossOriginIsolated);

    // Worker and messaging setup
    // Use a module worker constructed via new URL() so Rollup/Vite can emit the worker and its chunks
    // with correct relative paths. Try Vite's inline worker build first (helps with wasm locateFile resolution
    // when the worker loads a .wasm relative to its own module). Fall back to the standard emitted module worker.
    // Always emit a separate module worker so locateFile(import.meta.url) can resolve the .wasm asset correctly.
    // Inlining workers breaks relative URL resolution for WASM in many bundlers.
    this.worker = new PhysicsRapierWorkerConstructor();
    //this.worker = new Worker(new URL('./physicsRapier.worker.js', import.meta.url), { type: 'module' });
    this._msgId = 0;
    this._pending = new Map();
    this._onWorkerMessage = this._onWorkerMessage.bind(this);
    this.worker.onmessage = this._onWorkerMessage;
    this.worker.onerror = (e) => {
      console.error('Physics worker error:', e?.message || e);
    };

    // Helper worker (convex hull computation) - lazy initialized
    this.helperWorker = null;
    this._helperMsgId = 0;
    this._helperPending = new Map();
    this._onHelperMessage = this._onHelperMessage ? this._onHelperMessage.bind(this) : ((_) => {});

    // State tracking
    this._paused = false;
    this._lastTickTime = nowMs();
    this._lastState = null;   // { timeMs, bodies: { [id]: { p:[3], q:[4] } } }
    this._currentState = null;
    this._interpolationMax = 1.25; // bounds interp alpha

    // Mappings and registries
    this._nextBodyId = 1;
    this._nextColliderId = 1;
    this.rigidBodies = new Map();       // id -> { object, type, mass, ... }
    this.bodyToColliders = new Map();   // bodyId -> Set<colliderId>
    this.colliderToBody = new Map();    // colliderId -> bodyId | undefined

    // Optional listeners map (simple event system)
    this._listeners = new Map(); // type -> Set<fn>

    // Send init to worker and keep the promise so we don't start ticking before Rapier is ready.
    // _post returns a promise that resolves when the worker replies; schedule ticks only after init ack.
    this._initPromise = this._post({
      type: 'init',
      gravity: this.gravity,
      sharedMemorySupported: this.sharedMemorySupported,
      fixedDt: this.fixedDt
    });

    if (this.autoStart) {
      this._initPromise
        .then(() => { this._scheduleNextTick(); })
        .catch((err) => { console.error('Physics init failed:', err); });
    }
  }

  // Public API

  /**
   * addObject({ object, type, mass, position, rotation, velocity, angularVelocity })
   *  - object: THREE.Object3D (e.g., OGC3DTile or any Object3D)
   *  - type: 'dynamic' | 'kinematic' | 'fixed' (default 'dynamic')
   *  - mass: number (default 1)
   *  - position: array|Vector3
   *  - rotation: Euler|Quaternion|[x,y,z,w]
   *  - velocity: array|Vector3 (optional)
   *  - angularVelocity: array|Vector3 (optional)
   */
  addObject(options = {}) {
    const id = `rb-${this._nextBodyId++}`;
    const type = (options.type || 'dynamic').toLowerCase();
    const mass = typeof options.mass === 'number' ? options.mass : 1;

    const p = normalizeVector3(options.position, [0, 0, 0]);
    const q = normalizeQuaternion(options.rotation, [0, 0, 0, 1]);
    const v = options.velocity ? normalizeVector3(options.velocity, [0, 0, 0]) : undefined;
    const w = options.angularVelocity ? normalizeVector3(options.angularVelocity, [0, 0, 0]) : undefined;

    this.rigidBodies.set(id, {
      id,
      object: options.object || null,
      type,
      mass,
      last: { p, q },
      current: { p: p.slice(), q: q.slice() }
    });
    this.bodyToColliders.set(id, new Set());

    this._post({
      type: 'addObject',
      id,
      body: { type, mass, p, q, v, w }
    });

    return id;
  }



  /**
   * attachTrimeshCollider({ bodyId, geometry?, positions?, indices?, localPosition?, localRotation?, localScale? }) => Promise<string colliderId>
   * Creates a TRIMESH collider with baked non-uniform scale and attaches it to the body.
   * Positions/indices are always duplicated on the main thread and their ArrayBuffers are transferred.
   */
  attachTrimeshCollider({ bodyId, geometry, positions, indices, localPosition, localRotation, localScale }) {
    if (!this.rigidBodies.has(bodyId)) {
      console.warn(`attachTrimeshCollider: unknown bodyId ${bodyId}`);
      return Promise.resolve(null);
    }

    // Extract/duplicate buffers
    let posArray = null;
    let idxArray = null;

    if (geometry && geometry.isBufferGeometry) {
      const posAttr = geometry.getAttribute('position');
      if (!posAttr) {
        console.warn('attachTrimeshCollider: geometry has no position attribute');
      } else if (posAttr.isInterleavedBufferAttribute) {
        const count = posAttr.count;
        posArray = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          posArray[3 * i + 0] = posAttr.getX(i);
          posArray[3 * i + 1] = posAttr.getY(i);
          posArray[3 * i + 2] = posAttr.getZ(i);
        }
      } else if (posAttr.array) {
        posArray = new Float32Array(posAttr.array);
      }

      const idxAttr = geometry.getIndex?.();
      if (idxAttr && idxAttr.array) {
        const src = idxAttr.array;
        idxArray = src instanceof Uint32Array ? new Uint32Array(src) : new Uint32Array(src);
      }
    } else {
      if (positions) {
        posArray = Array.isArray(positions)
          ? new Float32Array(positions)
          : (positions instanceof Float32Array
            ? new Float32Array(positions)
            : new Float32Array(positions.buffer || positions));
      }
      if (indices) {
        idxArray = Array.isArray(indices)
          ? new Uint32Array(indices)
          : (indices instanceof Uint32Array
            ? new Uint32Array(indices)
            : new Uint32Array(indices.buffer || indices));
      }
    }

    if (!(posArray instanceof Float32Array)) {
      console.warn('attachTrimeshCollider: missing or invalid positions buffer');
      return Promise.resolve(null);
    }

    const lp = localPosition ? normalizeVector3(localPosition, [0, 0, 0]) : [0, 0, 0];
    const lq = localRotation ? normalizeQuaternion(localRotation, [0, 0, 0, 1]) : [0, 0, 0, 1];
    const ls = (Array.isArray(localScale) && localScale.length === 3)
      ? [Number(localScale[0]), Number(localScale[1]), Number(localScale[2])]
      : [1, 1, 1];

    const colliderId = `col-${this._nextColliderId++}`;

    const set = this.bodyToColliders.get(bodyId) || new Set();
    set.add(colliderId);
    this.bodyToColliders.set(bodyId, set);
    this.colliderToBody.set(colliderId, bodyId);

    const msg = {
      type: 'attachTrimeshCollider',
      id: colliderId,
      bodyId,
      positions: posArray,
      indices: idxArray || null,
      local: { p: lp, q: lq, s: ls }
    };

    const transfer = [];
    if (posArray?.buffer) transfer.push(posArray.buffer);
    if (idxArray?.buffer) transfer.push(idxArray.buffer);

    return this._post(msg, transfer).then(() => colliderId);
  }

  /**
   * addConvexHullCollider({ bodyId, geometry?, positions?, indices?, localPosition?, localRotation?, localScale? }) => Promise<string colliderId>
   * Computes a convex hull in a helper worker (with non-uniform scale baked in) and attaches it as a collider.
   * Positions/indices are duplicated on the main thread and their ArrayBuffers are transferred to the helper worker.
   */
  addConvexHullCollider({ bodyId, geometry, positions, indices, localPosition, localRotation, localScale }) {
    if (!this.rigidBodies.has(bodyId)) {
      console.warn(`addConvexHullCollider: unknown bodyId ${bodyId}`);
      return Promise.resolve(null);
    }

    // Extract/duplicate buffers (same logic as attachTrimeshCollider)
    let posArray = null;
    let idxArray = null;

    if (geometry && geometry.isBufferGeometry) {
      const posAttr = geometry.getAttribute('position');
      if (!posAttr) {
        console.warn('addConvexHullCollider: geometry has no position attribute');
      } else if (posAttr.isInterleavedBufferAttribute) {
        const count = posAttr.count;
        posArray = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          posArray[3 * i + 0] = posAttr.getX(i);
          posArray[3 * i + 1] = posAttr.getY(i);
          posArray[3 * i + 2] = posAttr.getZ(i);
        }
      } else if (posAttr.array) {
        posArray = new Float32Array(posAttr.array);
      }

      const idxAttr = geometry.getIndex?.();
      if (idxAttr && idxAttr.array) {
        const src = idxAttr.array;
        idxArray = src instanceof Uint32Array ? new Uint32Array(src) : new Uint32Array(src);
      }
    } else {
      if (positions) {
        posArray = Array.isArray(positions)
          ? new Float32Array(positions)
          : (positions instanceof Float32Array
            ? new Float32Array(positions)
            : new Float32Array(positions.buffer || positions));
      }
      if (indices) {
        idxArray = Array.isArray(indices)
          ? new Uint32Array(indices)
          : (indices instanceof Uint32Array
            ? new Uint32Array(indices)
            : new Uint32Array(indices.buffer || indices));
      }
    }

    if (!(posArray instanceof Float32Array)) {
      console.warn('addConvexHullCollider: missing or invalid positions buffer');
      return Promise.resolve(null);
    }

    const lp = localPosition ? normalizeVector3(localPosition, [0, 0, 0]) : [0, 0, 0];
    const lq = localRotation ? normalizeQuaternion(localRotation, [0, 0, 0, 1]) : [0, 0, 0, 1];
    const ls = (Array.isArray(localScale) && localScale.length === 3)
      ? [Number(localScale[0]), Number(localScale[1]), Number(localScale[2])]
      : [1, 1, 1];

    const colliderId = `col-${this._nextColliderId++}`;

    const set = this.bodyToColliders.get(bodyId) || new Set();
    set.add(colliderId);
    this.bodyToColliders.set(bodyId, set);
    this.colliderToBody.set(colliderId, bodyId);

    // Send to helper worker for convex hull computation
    const helperMsg = {
      type: 'computeConvexHull',
      positions: posArray,
      indices: idxArray || null,
      localScale: ls
    };
    const helperTransfer = [];
    if (posArray?.buffer) helperTransfer.push(posArray.buffer);
    if (idxArray?.buffer) helperTransfer.push(idxArray.buffer);

    return this._helperPost(helperMsg, helperTransfer).then((res) => {
      const hullVerts = res?.vertices;
      if (!(hullVerts instanceof Float32Array) || hullVerts.length < 9) {
        throw new Error('convex hull computation failed or returned insufficient vertices');
      }
      // Attach as a convex hull primitive collider
      const shape = { kind: 'convexHull', params: { vertices: hullVerts } };
      const msg = {
        type: 'attachShapeCollider',
        id: colliderId,
        bodyId,
        shape,
        local: { p: lp, q: lq }
      };
      const transfer = [];
      if (hullVerts?.buffer) transfer.push(hullVerts.buffer);
      return this._post(msg, transfer).then(() => colliderId);
    }).catch((err) => {
      // Roll back mapping on failure
      const set2 = this.bodyToColliders.get(bodyId);
      if (set2) set2.delete(colliderId);
      this.colliderToBody.delete(colliderId);
      console.warn('addConvexHullCollider failed:', err);
      return null;
    });
  }

  /**
   * attachShapeCollider({ bodyId, shape, localPosition?, localRotation? }) => Promise<string colliderId>
   * Creates a primitive/analytic collider (via engine-agnostic shape descriptor) and attaches it to the body.
   * Note: Any scale must be baked into the shape's parameters; no scale is applied at runtime.
   */
  attachShapeCollider({ bodyId, shape, localPosition, localRotation }) {
    if (!this.rigidBodies.has(bodyId)) {
      console.warn(`attachShapeCollider: unknown bodyId ${bodyId}`);
      return Promise.resolve(null);
    }
    if (!shape || typeof shape !== 'object') {
      console.warn('attachShapeCollider: missing or invalid shape descriptor');
      return Promise.resolve(null);
    }

    const lp = localPosition ? normalizeVector3(localPosition, [0, 0, 0]) : [0, 0, 0];
    const lq = localRotation ? normalizeQuaternion(localRotation, [0, 0, 0, 1]) : [0, 0, 0, 1];
    const colliderId = `col-${this._nextColliderId++}`;

    const set = this.bodyToColliders.get(bodyId) || new Set();
    set.add(colliderId);
    this.bodyToColliders.set(bodyId, set);
    this.colliderToBody.set(colliderId, bodyId);

    const msg = {
      type: 'attachShapeCollider',
      id: colliderId,
      bodyId,
      shape,
      local: { p: lp, q: lq }
    };

    this._post(msg);
    return colliderId;
  }

  /**
   * detachCollider({ colliderId })
   */
  detachCollider({ colliderId }) {
    const bodyId = this.colliderToBody.get(colliderId);
    if (!bodyId) return;
    const set = this.bodyToColliders.get(bodyId);
    if (set) set.delete(colliderId);
    this.colliderToBody.delete(colliderId);

    this._post({ type: 'detachCollider', colliderId });
  }

  /**
   * removeObject({ bodyId })
   */
  removeObject({ bodyId }) {
    if (!this.rigidBodies.has(bodyId)) return;
    const set = this.bodyToColliders.get(bodyId);
    if (set) {
      for (const colId of set) {
        this.colliderToBody.delete(colId);
      }
    }
    this.bodyToColliders.delete(bodyId);
    this.rigidBodies.delete(bodyId);
    this._post({ type: 'removeObject', id: bodyId });
  }

  /**
   * applyForce({ bodyId, force, worldPoint?, wake = true, impulse = false })
   */
  applyForce({ bodyId, force, worldPoint, wake = true, impulse = false }) {
    if (!this.rigidBodies.has(bodyId)) {
      console.warn(`applyForce: unknown bodyId ${bodyId}`);
      return;
    }
    const f = normalizeVector3(force, [0, 0, 0]);
    const p = worldPoint ? normalizeVector3(worldPoint, [0, 0, 0]) : undefined;
    this._post({ type: 'applyForce', id: bodyId, force: f, point: p, wake: !!wake, impulse: !!impulse });
  }

  /**
   * setGravity(gravityOptions)
   */
  setGravity(gravityOptions) {
    this.gravity = normalizeGravity(gravityOptions);
    this._post({ type: 'setGravity', gravity: this.gravity });
  }
 
  /**
   * setPose({ bodyId, position?, rotation?, wake = true })
   * Teleport a rigid body to a new pose immediately.
   * - position: [x,y,z] or THREE.Vector3 (optional)
   * - rotation: [x,y,z,w] or THREE.Quaternion/Euler (optional)
   * - wake: boolean (default true)
   */
  setPose({ bodyId, position, rotation, wake = true }) {
    if (!this.rigidBodies.has(bodyId)) {
      console.warn(`setPose: unknown bodyId ${bodyId}`);
      return;
    }
    const p = (position !== undefined && position !== null) ? normalizeVector3(position, [0, 0, 0]) : null;
    const q = (rotation !== undefined && rotation !== null) ? normalizeQuaternion(rotation, [0, 0, 0, 1]) : null;
 
    // Send command to worker; worker handles dynamic vs kinematic details
    this._post({ type: 'setPose', id: bodyId, p, q, wake: !!wake });
 
    // Optimistically update cached state and linked Object3D so render matches immediately
    const body = this.rigidBodies.get(bodyId);
    if (body) {
      if (p) {
        body.last.p = p.slice();
        body.current.p = p.slice();
        if (body.object?.isObject3D) body.object.position.set(p[0], p[1], p[2]);
      }
      if (q) {
        body.last.q = q.slice();
        body.current.q = q.slice();
        if (body.object?.isObject3D) body.object.quaternion.set(q[0], q[1], q[2], q[3]);
      }
      if (body.object?.isObject3D) {
        if (body.object.updateMatrices) body.object.updateMatrices();
        else {
          if (body.object.matrixAutoUpdate !== false) body.object.updateMatrix();
          if (body.object.matrixWorldAutoUpdate !== false) body.object.updateMatrixWorld(true);
        }
      }
    }
  }
 
  /**
   * raycast({ origin, direction, maxToi = 1e6, filter? }) => Promise<hits[]>
   */
  raycast({ origin, direction, maxToi = 1e6, filter }) {
    const o = normalizeVector3(origin, [0, 0, 0]);
    const d = normalizeVector3(direction, [0, -1, 0]);
    return this._post({ type: 'raycast', origin: o, direction: d, maxToi, filter: filter || null });
  }

  /**
   * pause / resume
   */
  pause() { this._paused = true; }
  resume() {
    if (!this._paused) return;
    this._paused = false;
    this._lastTickTime = nowMs();
    this._scheduleNextTick();
  }

  /**
   * setUpdateInterval(ms: number)
   */
  setUpdateInterval(ms) {
    this.updateIntervalMs = Math.max(1, Number(ms) || 16);
  }

  /**
   * stepOnce(dtSeconds?: number)
   * Requests a single physics integration step on worker.
   */
  stepOnce(dtSeconds) {
    const dt = typeof dtSeconds === 'number' ? dtSeconds : this.fixedDt;
    return this._post({ type: 'step', dt });
  }

  /**
   * update()
   * Interpolates between the last two physics snapshots and applies transforms to linked THREE.Object3D.
   * This is automatically called on a setTimeout loop by the constructor, but can also be called manually.
   */
  update() {
    if (!this._currentState) return;

    const last = this._lastState || this._currentState;
    const curr = this._currentState;

    const tNow = nowMs();
    const t0 = last.timeMs || tNow;
    const t1 = curr.timeMs || tNow;
    const denom = Math.max(1e-3, (t1 - t0));
    let alpha = THREE.MathUtils.clamp((tNow - t1) / denom + 1.0, 0.0, this._interpolationMax);
    // Bound to [0,1] primarily
    alpha = THREE.MathUtils.clamp(alpha, 0.0, 1.0);

    const tmpQ0 = new THREE.Quaternion();
    const tmpQ1 = new THREE.Quaternion();
    const tmpQT = new THREE.Quaternion();

    for (const [id, body] of this.rigidBodies.entries()) {
      const s0 = last.bodies?.[id];
      const s1 = curr.bodies?.[id];

      if (!s1 && !s0) continue;

      const p0 = s0?.p || body.current.p;
      const q0 = s0?.q || body.current.q;
      const p1 = s1?.p || body.current.p;
      const q1 = s1?.q || body.current.q;

      const px = THREE.MathUtils.lerp(p0[0], p1[0], alpha);
      const py = THREE.MathUtils.lerp(p0[1], p1[1], alpha);
      const pz = THREE.MathUtils.lerp(p0[2], p1[2], alpha);

      tmpQ0.set(q0[0], q0[1], q0[2], q0[3]);
      tmpQ1.set(q1[0], q1[1], q1[2], q1[3]);
      tmpQT.copy(tmpQ0).slerp(tmpQ1, alpha);

      if (body.object && body.object.isObject3D) {
        body.object.position.set(px, py, pz);
        body.object.quaternion.copy(tmpQT);
        if (body.object.updateMatrices) body.object.updateMatrices();
        else {
          if (body.object.matrixAutoUpdate !== false) {
            body.object.updateMatrix();
          }
          if (body.object.matrixWorldAutoUpdate !== false) {
            body.object.updateMatrixWorld(true);
          }
        }

      }

      // Keep the latest "current" cached for next round
      body.last = { p: p0.slice(), q: q0.slice() };
      body.current = { p: p1.slice(), q: q1.slice() };
    }
  }

  /**
   * dispose()
   * Terminates the worker and clears all registries.
   */
  dispose() {
    try { this.worker.terminate(); } catch (_) {}
    try { this.helperWorker?.terminate(); } catch (_) {}
    this.rigidBodies.clear();
    this.bodyToColliders.clear();
    this.colliderToBody.clear();
    this._pending.clear();
    this._listeners.clear();
    this._lastState = null;
    this._currentState = null;
  }

  // Internal

  _scheduleNextTick() {
    if (this._paused) return;
    setTimeout(() => this._onTick(), this.updateIntervalMs);
  }

  _onTick() {
    if (this._paused) return;

    const t = nowMs();
    const dt = Math.max(0.000001, (t - this._lastTickTime) / 1000);
    this._lastTickTime = t;

    // Ask worker to step by a fixed dt (deterministic), regardless of real dt. Could change to adaptive if desired.
    this._post({ type: 'step', dt: this.fixedDt });

    // Interpolate and push transforms to render objects
    this.update();

    // schedule next loop
    this._scheduleNextTick();
  }

  _onWorkerMessage(ev) {
    const data = ev.data || {};
    if (data.replyTo) {
      const pending = this._pending.get(data.replyTo);
      if (pending) {
        this._pending.delete(data.replyTo);
        if (data.error) {
          pending.rej ? pending.rej(data.error) : console.error('Physics worker error:', data.error);
        } else {
          pending.res ? pending.res(data.result) : null;
        }
      }
      return;
    }

    switch (data.type) {
      case 'state': {
        // { timeMs, bodies: { id: { p:[3], q:[4] } } }
        this._lastState = this._currentState;
        this._currentState = data.state || null;
        this._emit('state', this._currentState);
        break;
      }
      case 'event': {
        // e.g., collision events (placeholder)
        this._emit('event', data.event);
        break;
      }
      default:
        // unknown broadcast
        break;
    }
  }

  _ensureHelperWorker() {
    if (this.helperWorker) return;
    this.helperWorker = new PhysicsHelperWorkerConstructor();
    this.helperWorker.onmessage = this._onHelperMessage;
    this.helperWorker.onerror = (e) => {
      console.error('Physics helper worker error:', e?.message || e);
    };
  }

  _onHelperMessage(ev) {
    const data = ev.data || {};
    if (data.replyTo) {
      const pending = this._helperPending.get(data.replyTo);
      if (pending) {
        this._helperPending.delete(data.replyTo);
        if (data.error) {
          pending.rej ? pending.rej(data.error) : console.error('Physics helper worker error:', data.error);
        } else {
          pending.res ? pending.res(data.result) : null;
        }
      }
    }
  }

  _helperPost(msg, transfer = []) {
    this._ensureHelperWorker();
    const id = ++this._helperMsgId;
    const envelope = { ...msg, _envId: id };
    this.helperWorker.postMessage(envelope, transfer);
    return new Promise((res, rej) => {
      this._helperPending.set(id, { res, rej });
    });
  }

  _post(msg, transfer = []) {
    const id = ++this._msgId;
    // Preserve any domain-level "id" in msg (e.g., body/collider ids) and attach
    // an envelope identifier used to correlate replies from the worker.
    const envelope = { ...msg, _envId: id };
    this.worker.postMessage(envelope, transfer);
    return new Promise((res, rej) => {
      this._pending.set(id, { res, rej });
      // Optional: timeout for robustness
      // setTimeout(() => { if (this._pending.has(id)) { this._pending.delete(id); rej(new Error('Worker timeout')); } }, 15000);
    });
  }

  // Simple event system
  on(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type).add(fn);
    return () => this.off(type, fn);
  }
  off(type, fn) {
    const set = this._listeners.get(type);
    if (set) set.delete(fn);
  }
  _emit(type, payload) {
    const set = this._listeners.get(type);
    if (!set) return;
    for (const fn of set) {
      try { fn(payload); } catch (e) { console.error(e); }
    }
  }
}

export default Physics;