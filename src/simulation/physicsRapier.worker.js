// physicsRapier.worker.js
// Fully implemented physics worker using @dimforge/rapier3d-compat.
// Handles rigid bodies, primitive and trimesh colliders, gravity (vector/geocentric), forces, stepping, and raycasts.
// Message contract mirrors the placeholder worker but executes with Rapier under the hood.

let RAPIER = null;
let world = null;
// Single-flight init to avoid concurrent wasm initialization races
let initPromise = null;

// State maps
const bodies = new Map();                 // id -> RigidBody
const bodyInfo = new Map();               // id -> { type, mass }
const colliders = new Map();              // id -> Collider
const colliderOwners = new Map();         // id -> bodyId

// Gravity configuration
let gravityMode = 'vector';               // 'vector' | 'geocentric'
let gravityVec = { x: 0, y: -9.81, z: 0 };
let planetCenter = { x: 0, y: 0, z: 0 };
let gravityIntensity = 9.81;

// Timing
let simTimeMs = 0;
let fixedDt = 1 / 60;

// Utilities
function ack(id, result = null) {
  if (id == null) return;
  postMessage({ replyTo: id, result });
}
function nack(id, error) {
  if (id == null) return;
  postMessage({ replyTo: id, error: (error && (error.message || error)) || 'error' });
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function v3(a) { return { x: +a[0], y: +a[1], z: +a[2] }; }
function q4(a) { return { x: +a[0], y: +a[1], z: +a[2], w: +a[3] }; }
function toArrV3(v) { return [v.x, v.y, v.z]; }
function toArrQ4(q) { return [q.x, q.y, q.z, q.w]; }
function addV(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function subV(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function scaleV(a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; }
function lenV(a) { return Math.hypot(a.x, a.y, a.z); }
function normV(a) { const L = lenV(a) || 1; return { x: a.x / L, y: a.y / L, z: a.z / L }; }

async function ensureRapier() {
  // De-duplicate concurrent initialization to avoid WASM re-entrancy ("unreachable"/OOB) races.
  if (initPromise) {
    await initPromise;
    return;
  }
  initPromise = (async () => {
    if (!RAPIER) {
      postMessage({ type: 'debug', msg: 'importing rapier module' });
      // Import may provide the module as the default export or as the module namespace.
      const mod = await import('@dimforge/rapier3d-compat');

      // Provide locateFile so the worker can resolve the .wasm file relative to this worker module.
      const locateFile = (file) => {
        try {
          return new URL(file, import.meta.url).href;
        } catch (e) {
          // Fallback: return filename (bundlers may replace with emitted asset paths)
          return file;
        }
      };
      const initOptions = { locateFile };

      // Normalize common export patterns:
      // - Factory function: default or module export is a function that initializes/returns the module.
      // - Object with init(options) function: call init and then use the object.
      // - Already-initialized object/module returned directly.
      const maybe = mod?.default ?? mod;
      postMessage({
        type: 'debug',
        msg: 'rapier module import result',
        hasDefault: !!mod?.default,
        hasInitFunction: typeof (maybe?.init) === 'function',
        isFactoryFunction: typeof maybe === 'function'
      });

      try {
        if (typeof maybe === 'function') {
          // Factory function case: call it with initOptions. It may return a Promise or the module synchronously.
          postMessage({ type: 'debug', msg: 'rapier: calling module factory function' });
          const res = maybe(initOptions);
          RAPIER = (res && typeof res.then === 'function') ? await res : (res || maybe);
          postMessage({ type: 'debug', msg: 'rapier factory resolved', hasWorld: !!RAPIER?.World });
        } else if (typeof maybe?.init === 'function') {
          // Object with init() API
          postMessage({ type: 'debug', msg: 'rapier: calling init()' });
          await maybe.init(initOptions);
          RAPIER = maybe;
          postMessage({ type: 'debug', msg: 'rapier.init completed', hasWorld: !!RAPIER?.World });
        } else if (maybe) {
          // Already-initialized module/object
          RAPIER = maybe;
          postMessage({ type: 'debug', msg: 'rapier: using imported module as-is', hasWorld: !!RAPIER?.World });
        } else {
          throw new Error('Imported Rapier module is empty/invalid');
        }
      } catch (err) {
        // Emit a helpful debug/error message back to the main thread so the app can surface it.
        postMessage({ type: 'error', msg: 'rapier init failed', error: (err && (err.message || String(err))) || String(err) });
        throw err;
      }

      if (!RAPIER) throw new Error('Failed to import Rapier module');
    }

    if (!world) {
      // Initialize world with vector gravity; if geocentric, we keep world gravity = 0 and apply per-body forces each step
      const g = (gravityMode === 'vector') ? gravityVec : { x: 0, y: 0, z: 0 };

      // Different Rapier builds expose constructors differently; try common variants.
      try {
        if (typeof RAPIER.World === 'function') {
          world = new RAPIER.World(g);
        } else if (typeof RAPIER.World?.new === 'function') {
          world = RAPIER.World.new(g);
        } else if (typeof RAPIER?.World === 'object' && typeof RAPIER.World.create === 'function') {
          world = RAPIER.World.create(g);
        } else if (typeof RAPIER === 'function') {
          // In case RAPIER itself is callable and returns a World
          world = RAPIER(g);
        } else {
          // Last resort: attempt to call World as a function if present
          world = RAPIER.World ? RAPIER.World(g) : null;
        }
        postMessage({ type: 'debug', msg: 'rapier world created' });
      } catch (err) {
        // Surface a clearer error for debugging
        postMessage({ type: 'error', msg: 'failed to construct rapier World', error: (err && (err.message || String(err))) || String(err) });
        throw new Error('Failed to construct Rapier World: ' + (err && err.message ? err.message : String(err)));
      }
    }
  })();

  try {
    await initPromise;
  } finally {
    // Keep the resolved promise for future awaiters; do not clear to prevent re-init.
  }
}

function setVectorGravity(vec3) {
  gravityMode = 'vector';
  gravityVec = { x: +vec3[0], y: +vec3[1], z: +vec3[2] };
  if (world) world.gravity = gravityVec;
}

function setGeocentricGravity(center, intensity) {
  gravityMode = 'geocentric';
  planetCenter = { x: +center[0], y: +center[1], z: +center[2] };
  gravityIntensity = +intensity;
  if (world) world.gravity = { x: 0, y: 0, z: 0 };
}

function computeGeocentricAt(p) {
  const dir = normV(subV(planetCenter, p));
  return scaleV(dir, gravityIntensity);
}

// Bodies
function createBody(desc, id, init) {
  try {
    if (typeof world.createRigidBody !== 'function') {
      postMessage({ type: 'error', msg: 'world.createRigidBody is not a function', value: typeof world.createRigidBody });
      throw new Error('world.createRigidBody is not a function');
    }
    postMessage({ type: 'debug', msg: 'createBody: about to call world.createRigidBody', id, descType: typeof desc, descCtor: (desc && desc.constructor) ? desc.constructor.name : null });
    const rb = world.createRigidBody(desc);
    if (init?.v && typeof rb.setLinvel === 'function') rb.setLinvel(v3(init.v), false);
    if (init?.w && typeof rb.setAngvel === 'function') rb.setAngvel(v3(init.w), false);
    bodies.set(id, rb);
    bodyInfo.set(id, { type: init.type, mass: init.mass });
    return rb;
  } catch (err) {
    postMessage({ type: 'error', msg: 'createBody failed', error: (err && (err.message || String(err))) || String(err), id, descType: typeof desc });
    throw err;
  }
}

function removeBodyById(id) {
  const rb = bodies.get(id);
  if (rb) {
    // Remove attached colliders
    for (const [cid, owner] of Array.from(colliderOwners.entries())) {
      if (owner === id) {
        const col = colliders.get(cid);
        if (col) world.removeCollider(col, true);
        colliders.delete(cid);
        colliderOwners.delete(cid);
      }
    }
    world.removeRigidBody(rb);
  }
  bodies.delete(id);
  bodyInfo.delete(id);
}

// Colliders - create from trimesh with baked scale
function createTrimeshColliderScaled({ id, positions, indices, bodyId, local }) {
  // Validate incoming positions buffer
  if (!(positions instanceof Float32Array)) {
    throw new Error('attachCollider: positions must be Float32Array');
  }
  if (positions.length % 3 !== 0) {
    throw new Error('attachCollider: positions length must be a multiple of 3');
  }

  // Copy positions to avoid unsafe aliasing with other views that may share the same ArrayBuffer.
  // This also protects Rapier's wasm from receiving JS-owned buffers that might be reused elsewhere.
  const posCopy = new Float32Array(positions);

  // Bake non-uniform scale into the copied vertex positions
  const sx = (local && local.s && +local.s[0]) || 1;
  const sy = (local && local.s && +local.s[1]) || 1;
  const sz = (local && local.s && +local.s[2]) || 1;
  for (let i = 0, n = posCopy.length; i < n; i += 3) {
    posCopy[i + 0] *= sx;
    posCopy[i + 1] *= sy;
    posCopy[i + 2] *= sz;
  }

  // Prepare a safe copy of indices (if provided) and validate index ranges
  let idxCopy = null;
  if (indices) {
    const srcIdx = indices instanceof Uint32Array ? indices : new Uint32Array(indices.buffer || indices);
    idxCopy = new Uint32Array(srcIdx); // make a copy to avoid aliasing
    const vertCount = posCopy.length / 3;
    for (let i = 0; i < idxCopy.length; ++i) {
      const v = idxCopy[i];
      if (!Number.isFinite(v) || v < 0 || v >= vertCount) {
        throw new Error(`attachCollider: index out of range or invalid at ${i}: ${v} (vertCount=${vertCount})`);
      }
    }
  }

  // Validate numeric contents to prevent wasm OOB or NaN propagation
  for (let i = 0; i < posCopy.length; ++i) {
    const v = posCopy[i];
    if (!Number.isFinite(v)) throw new Error(`attachCollider: invalid position value at ${i}: ${v}`);
  }

  // Construct the Rapier collider descriptor with the copied, validated buffers
  const desc = RAPIER.ColliderDesc.trimesh(posCopy, idxCopy);
  if (local?.p) desc.setTranslation(+local.p[0], +local.p[1], +local.p[2]);
  if (local?.q) desc.setRotation(q4(local.q));

  const rb = bodies.get(bodyId);
  if (!rb) throw new Error(`attachCollider: body not found: ${bodyId}`);
  const col = world.createCollider(desc, rb);

  colliders.set(id, col);
  colliderOwners.set(id, bodyId);
}

function removeColliderById(id) {
  const col = colliders.get(id);
  if (col) world.removeCollider(col, true);
  colliders.delete(id);
  colliderOwners.delete(id);
}

// Engine-agnostic primitive shape adapter
function colliderDescFromShape(shape) {
  if (!shape || typeof shape !== 'object') throw new Error('attachShapeCollider: missing shape');
  const kind = String(shape.kind || '').toLowerCase();
  const p = shape.params || {};
  switch (kind) {
    case 'ball': {
      const r = +p.radius;
      return RAPIER.ColliderDesc.ball(r);
    }
    case 'cuboid':
    case 'box': {
      const hx = +p.hx, hy = +p.hy, hz = +p.hz;
      return RAPIER.ColliderDesc.cuboid(hx, hy, hz);
    }
    case 'roundcuboid':
    case 'round_cuboid':
    case 'round-cuboid': {
      const hx = +p.hx, hy = +p.hy, hz = +p.hz, radius = +p.radius || 0;
      return RAPIER.ColliderDesc.roundCuboid(hx, hy, hz, radius);
    }
    case 'capsule': {
      const hh = +p.halfHeight;
      const r = +p.radius;
      return RAPIER.ColliderDesc.capsule(hh, r);
    }
    case 'cone': {
      const hh = +p.halfHeight;
      const r = +p.radius;
      return RAPIER.ColliderDesc.cone(hh, r);
    }
    case 'cylinder': {
      const hh = +p.halfHeight;
      const r = +p.radius;
      return RAPIER.ColliderDesc.cylinder(hh, r);
    }
    case 'segment': {
      const a = p.a || p.p1;
      const b = p.b || p.p2;
      if (!a || !b) throw new Error('segment requires a and b (or p1,p2)');
      return RAPIER.ColliderDesc.segment(v3(a), v3(b));
    }
    case 'triangle': {
      const a = p.a, b = p.b, c = p.c;
      if (!a || !b || !c) throw new Error('triangle requires a, b, c');
      return RAPIER.ColliderDesc.triangle(v3(a), v3(b), v3(c));
    }
    case 'polyline': {
      const verts = p.vertices instanceof Float32Array ? p.vertices : new Float32Array(p.vertices);
      let idx = null;
      if (p.indices) idx = p.indices instanceof Uint32Array ? p.indices : new Uint32Array(p.indices);
      return RAPIER.ColliderDesc.polyline(verts, idx);
    }
    case 'convexhull':
    case 'convex_hull':
    case 'convex-hull': {
      const verts = p.vertices instanceof Float32Array ? p.vertices : new Float32Array(p.vertices);
      const desc = RAPIER.ColliderDesc.convexHull(verts);
      if (!desc) throw new Error('convexHull: invalid or insufficient points');
      return desc;
    }
    case 'heightfield': {
      const rows = +p.rows, cols = +p.cols;
      const heights = p.heights instanceof Float32Array ? p.heights : new Float32Array(p.heights);
      const scale = p.scale || { x: 1, y: 1, z: 1 };
      return RAPIER.ColliderDesc.heightfield(rows, cols, heights, scale);
    }
    default:
      throw new Error(`Unknown primitive collider kind: ${shape.kind}`);
  }
}

// Step and state
function applyExternalForces(dt) {
  if (gravityMode !== 'geocentric') return;
  for (const [id, rb] of bodies.entries()) {
    if (!rb || rb.isFixed()) continue;
    const mass = Math.max(1e-6, bodyInfo.get(id)?.mass ?? 1);
    const p = rb.translation();
    const g = computeGeocentricAt(p);
    const f = { x: g.x * mass, y: g.y * mass, z: g.z * mass };
    rb.applyForce(f, true);
  }
}

function step(dt) {
  world.timestep = dt;
  applyExternalForces(dt);
  world.step();
  simTimeMs += dt * 1000.0;

  const stateBodies = {};
  for (const [id, rb] of bodies.entries()) {
    const t = rb.translation();
    const r = rb.rotation();
    stateBodies[id] = { p: [t.x, t.y, t.z], q: [r.x, r.y, r.z, r.w] };
  }
  postMessage({ type: 'state', state: { timeMs: simTimeMs, bodies: stateBodies } });
}

// Raycast (first hit)
function raycast(origin, dir, maxToi = 1e6) {
  const o = v3(origin);
  const d = v3(dir);
  const ray = new RAPIER.Ray(o, d);
  // solid=true returns time-of-impact including if ray starts inside collider
  const hit = world.castRay(ray, maxToi, true);
  if (!hit) return { hits: [] };

  const toi = hit.toi;
  const point = ray.pointAt(toi);
  const normal = hit.normal;
  // Find collider id
  let colliderId = null;
  for (const [cid, col] of colliders.entries()) {
    if (col.handle === hit.collider.handle) {
      colliderId = cid;
      break;
    }
  }
  let bodyId = null;
  const rbHandle = hit.collider.parent()?.handle;
  if (rbHandle != null) {
    for (const [bid, rb] of bodies.entries()) {
      if (rb.handle === rbHandle) { bodyId = bid; break; }
    }
  }
  return {
    hits: [{
      toi,
      point: [point.x, point.y, point.z],
      normal: [normal.x, normal.y, normal.z],
      colliderId,
      bodyId
    }]
  };
}

// Message handling
async function onMessage(e) {
  const msg = e.data || {};
  const { id, type, _envId, replyTo } = msg;
  const replyId = (typeof _envId !== 'undefined') ? _envId : (typeof replyTo !== 'undefined' ? replyTo : id);
  const _ack = (res) => ack(replyId, res);
  const _nack = (err) => nack(replyId, err);
  try {
    switch (type) {
      case 'init': {
        fixedDt = typeof msg.fixedDt === 'number' ? msg.fixedDt : fixedDt;
        const g = msg.gravity || {};
        const mode = (g.mode || 'vector').toLowerCase();
        if (mode === 'geocentric') {
          setGeocentricGravity(g.planetCenter || [0, 0, 0], typeof g.intensity === 'number' ? g.intensity : 9.81);
        } else {
          setVectorGravity(g.vector || [0, -9.81, 0]);
        }
        await ensureRapier();
        _ack({ ok: true });
        break;
      }

      case 'addObject': {
        await ensureRapier();
        const bodyId = msg.id;
        const b = msg.body || {};
        const typeStr = (b.type || 'dynamic').toLowerCase();
        const mass = typeof b.mass === 'number' ? b.mass : 1.0;
        const p = v3(b.p || [0, 0, 0]);
        const q = q4(b.q || [0, 0, 0, 1]);
  
        // Validate numeric values to avoid creating a RigidBodyDesc with NaN/Infinity
        function isNum(n) { return typeof n === 'number' && isFinite(n); }
        if (!isNum(p.x) || !isNum(p.y) || !isNum(p.z)) {
          postMessage({ type: 'debug', msg: 'addObject: invalid translation detected, resetting to 0', bodyId, p });
          p.x = isNum(p.x) ? p.x : 0;
          p.y = isNum(p.y) ? p.y : 0;
          p.z = isNum(p.z) ? p.z : 0;
        }
        if (![q.x, q.y, q.z, q.w].every(isNum)) {
          postMessage({ type: 'debug', msg: 'addObject: invalid rotation detected, using identity quat', bodyId, q });
          q.x = 0; q.y = 0; q.z = 0; q.w = 1;
        } else {
          // Normalize quaternion to be safe
          const L = Math.hypot(q.x, q.y, q.z, q.w) || 1;
          q.x /= L; q.y /= L; q.z /= L; q.w /= L;
        }
  
        let desc;
        if (typeStr === 'fixed') desc = RAPIER.RigidBodyDesc.fixed();
        else if (typeStr === 'kinematic') desc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        else desc = RAPIER.RigidBodyDesc.dynamic().setAdditionalMass(mass);
  
        // Defensive setters to capture errors before calling into wasm
        try {
          desc.setTranslation(p.x, p.y, p.z);
        } catch (err) {
          postMessage({ type: 'error', msg: 'desc.setTranslation failed', error: (err && (err.message || String(err))) || String(err), bodyId, p });
          throw err;
        }
        try {
          desc.setRotation(q);
        } catch (err) {
          postMessage({ type: 'error', msg: 'desc.setRotation failed', error: (err && (err.message || String(err))) || String(err), bodyId, q });
          throw err;
        }
  
        postMessage({ type: 'debug', msg: 'addObject: creating body', bodyId, typeStr, mass, p, q });
        createBody(desc, bodyId, { type: typeStr, mass, v: b.v, w: b.w });
        _ack({ ok: true });
        break;
      }

      case 'removeObject': {
        await ensureRapier();
        removeBodyById(msg.id);
        _ack({ ok: true });
        break;
      }

      // addCollider removed: colliders are created during attachCollider

      // disposeCollider removed

      case 'attachCollider':
      case 'attachTrimeshCollider': {
        await ensureRapier();
        const bodyId = msg.bodyId;
        const colId = msg.id || msg.colliderId;
        const positions = msg.positions;
        const indices = msg.indices || null;
        const local = msg.local || {};
        if (!positions) { ack(id, { ok: false, reason: 'missing positions' }); break; }
        const verts = positions instanceof Float32Array ? positions : new Float32Array(positions.buffer || positions);
        let idx = indices;
        if (idx && !(idx instanceof Uint32Array)) idx = new Uint32Array(idx.buffer || idx);
        createTrimeshColliderScaled({
          id: colId,
          positions: verts,
          indices: idx || null,
          bodyId,
          local
        });
        _ack({ ok: true, colliderId: colId });
        break;
      }
 
      case 'attachShapeCollider': {
        await ensureRapier();
        const bodyId = msg.bodyId;
        const colId = msg.id || msg.colliderId;
        const shape = msg.shape;
        const local = msg.local || {};
        const desc = colliderDescFromShape(shape);
        if (local?.p) desc.setTranslation(+local.p[0], +local.p[1], +local.p[2]);
        if (local?.q) desc.setRotation(q4(local.q));
        const rb = bodies.get(bodyId);
        if (!rb) { ack(id, { ok: false, reason: 'unknown body' }); break; }
        const col = world.createCollider(desc, rb);
        colliders.set(colId, col);
        colliderOwners.set(colId, bodyId);
        _ack({ ok: true, colliderId: colId });
        break;
      }
 
       case 'detachCollider': {
        await ensureRapier();
        const colId = msg.colliderId || msg.id;
        removeColliderById(colId);
        _ack({ ok: true });
        break;
      }

      case 'applyForce': {
        await ensureRapier();
        const bodyId = msg.id;
        const rb = bodies.get(bodyId);
        if (!rb) { ack(id, { ok: false, reason: 'unknown body' }); break; }

        const impulse = !!msg.impulse;
        const force = v3(msg.force || [0, 0, 0]);
        const wake = msg.wake !== false;

        if (impulse) {
          if (msg.point && typeof rb.applyImpulseAtPoint === 'function') {
            rb.applyImpulseAtPoint(force, v3(msg.point), wake);
          } else {
            rb.applyImpulse(force, wake);
          }
        } else {
          if (msg.point && typeof rb.applyForceAtPoint === 'function') {
            rb.applyForceAtPoint(force, v3(msg.point), wake);
          } else {
            rb.applyForce(force, wake);
          }
        }
        _ack({ ok: true });
        break;
      }

      case 'setPose': {
        await ensureRapier();
        const bodyId = msg.id;
        const rb = bodies.get(bodyId);
        if (!rb) { _ack({ ok: false, reason: 'unknown body' }); break; }

        const p = msg.p; // [x,y,z] or null
        const q = msg.q; // [x,y,z,w] or null
        const wake = msg.wake !== false;

        try {
          if (typeof rb.isKinematic === 'function' && rb.isKinematic()) {
            // Kinematic bodies use "next" pose setters
            if (p) rb.setNextKinematicTranslation(v3(p));
            if (q) rb.setNextKinematicRotation(q4(q));
          } else {
            // Dynamic/fixed bodies: set pose directly
            if (p && typeof rb.setTranslation === 'function') rb.setTranslation(v3(p), true);
            if (q && typeof rb.setRotation === 'function') rb.setRotation(q4(q), true);
          }
          if (wake && typeof rb.wakeUp === 'function') rb.wakeUp();
          _ack({ ok: true });
        } catch (err) {
          _nack(err);
        }
        break;
      }

      case 'setGravity': {
        await ensureRapier();
        const g = msg.gravity || {};
        const mode = (g.mode || 'vector').toLowerCase();
        if (mode === 'geocentric') {
          setGeocentricGravity(g.planetCenter || [0, 0, 0], typeof g.intensity === 'number' ? g.intensity : 9.81);
        } else {
          setVectorGravity(g.vector || [0, -9.81, 0]);
        }
        _ack({ ok: true });
        break;
      }

      case 'step': {
        await ensureRapier();
        const dt = typeof msg.dt === 'number' ? clamp(msg.dt, 1 / 600, 1 / 10) : fixedDt;
        step(dt);
        _ack({ ok: true, dtUsed: dt });
        break;
      }

      case 'raycast': {
        await ensureRapier();
        const result = raycast(msg.origin || [0, 0, 0], msg.direction || [0, -1, 0], typeof msg.maxToi === 'number' ? msg.maxToi : 1e6);
        _ack(result);
        break;
      }

      default: {
        _ack({ ok: false, reason: 'unknown message type' });
        break;
      }
    }
  } catch (err) {
    _nack(err);
  }
}

self.addEventListener('message', onMessage);