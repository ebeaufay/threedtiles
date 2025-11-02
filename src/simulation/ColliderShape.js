// Engine-agnostic collider shape descriptors for primitive colliders.
/**
 * Engine-agnostic collider shape descriptors.
 * Each function returns a plain object { kind: string, params: object } that can be
 * consumed by any worker/engine adapter (Rapier, Jolt, etc.).
 *
 * Conventions (matching Rapier 3D):
 * - Cuboid/Box uses half-extents (hx, hy, hz)
 * - RoundCuboid uses half-extents + radius
 * - Capsule uses halfHeight and radius
 * - Cone uses halfHeight and radius
 * - Cylinder uses halfHeight and radius
 * - Ball uses radius
 * - Segment uses endpoints a,b as [x,y,z]
 * - Triangle uses points a,b,c as [x,y,z]
 * - Polyline uses vertices (Float32Array|number[]) and optional indices (Uint32Array|number[])
 * - ConvexHull uses vertices (Float32Array|number[])
 * - Heightfield uses rows, cols, heights (Float32Array|number[]), and scale {x,y,z}
 *
 * Note: Any scaling should be baked into the params before creating the descriptor.
 */

function assertVec3(name, v) {
  if (!v || (Array.isArray(v) && v.length !== 3)) {
    throw new Error(`${name} must be a length-3 array [x,y,z]`);
  }
  return v;
}

function createBall(radius) {
  return { kind: 'ball', params: { radius: Number(radius) } };
}

function createCuboid(hx, hy, hz) {
  return { kind: 'cuboid', params: { hx: Number(hx), hy: Number(hy), hz: Number(hz) } };
}

// Convenience alias
function createBox(hx, hy, hz) {
  return createCuboid(hx, hy, hz);
}

function createRoundCuboid(hx, hy, hz, radius) {
  return { kind: 'roundCuboid', params: { hx: Number(hx), hy: Number(hy), hz: Number(hz), radius: Number(radius) } };
}

function createCapsule(halfHeight, radius) {
  return { kind: 'capsule', params: { halfHeight: Number(halfHeight), radius: Number(radius) } };
}

function createCone(halfHeight, radius) {
  return { kind: 'cone', params: { halfHeight: Number(halfHeight), radius: Number(radius) } };
}

function createCylinder(halfHeight, radius) {
  return { kind: 'cylinder', params: { halfHeight: Number(halfHeight), radius: Number(radius) } };
}

function createSegment(a, b) {
  return { kind: 'segment', params: { a: assertVec3('a', a), b: assertVec3('b', b) } };
}

function createTriangle(a, b, c) {
  return { kind: 'triangle', params: { a: assertVec3('a', a), b: assertVec3('b', b), c: assertVec3('c', c) } };
}

function createPolyline(vertices, indices) {
  return { kind: 'polyline', params: { vertices, indices: indices || null } };
}

function createConvexHull(vertices) {
  return { kind: 'convexHull', params: { vertices } };
}

function createHeightfield(rows, cols, heights, scale = { x: 1, y: 1, z: 1 }) {
  return { kind: 'heightfield', params: { rows: Number(rows), cols: Number(cols), heights, scale } };
}

export const ColliderShape = {
  createBall,
  createCuboid,
  createBox,
  createRoundCuboid,
  createCapsule,
  createCone,
  createCylinder,
  createSegment,
  createTriangle,
  createPolyline,
  createConvexHull,
  createHeightfield
};
