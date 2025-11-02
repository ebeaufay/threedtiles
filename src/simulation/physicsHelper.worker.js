// physicsHelper.worker.js
// Helper worker that computes a convex hull from mesh geometry using three.js's ConvexHull.
// - Receives Float32Array positions (and optional Uint32Array indices - not required for hull).
// - Applies optional non-uniform localScale [sx,sy,sz] to vertex positions in-place.
// - Computes convex hull and returns hull vertices (Float32Array) and indices (Uint32Array) to the main thread.
// - Buffer ownership is transferred back to main to minimize memory usage.

/* No external imports required */

// Simple reply helpers for request/reply correlation with _envId
function ack(id, result = null, transfer = []) {
  if (id == null) return;
  // Always include replyTo to match main thread envelope handling
  postMessage({ replyTo: id, result }, transfer);
}
function nack(id, error) {
  if (id == null) return;
  postMessage({ replyTo: id, error: (error && (error.message || String(error))) || String(error) });
}

// Compute convex hull input for Rapier from points (Float32Array positions).
// Rapier's ColliderDesc.convexHull computes the hull internally from an arbitrary point cloud,
// so we only need to return a scaled vertex array. No triangle faces are required.
function computeHullFromPositions(positions, scale) {
  if (!(positions instanceof Float32Array)) {
    throw new Error('positions must be a Float32Array');
  }
  const n = positions.length;
  if (n % 3 !== 0) {
    throw new Error('positions length must be a multiple of 3');
  }

  // Apply in-place scaling to avoid additional copies (positions buffer is owned by this worker).
  const sx = (scale && +scale[0]) || 1.0;
  const sy = (scale && +scale[1]) || 1.0;
  const sz = (scale && +scale[2]) || 1.0;
  if (sx !== 1 || sy !== 1 || sz !== 1) {
    for (let i = 0; i < n; i += 3) {
      positions[i + 0] *= sx;
      positions[i + 1] *= sy;
      positions[i + 2] *= sz;
    }
  }

  // Return the scaled point cloud directly; indices are unnecessary for Rapier's convexHull.
  const hullVertices = positions;
  const hullIndices = null;
  return { hullVertices, hullIndices };
}

self.addEventListener('message', (e) => {
  const msg = e.data || {};
  const replyId = (typeof msg._envId !== 'undefined') ? msg._envId : (typeof msg.replyTo !== 'undefined' ? msg.replyTo : msg.id);
  try {
    switch (msg.type) {
      case 'computeConvexHull': {
        const positions = msg.positions instanceof Float32Array ? msg.positions : new Float32Array(msg.positions?.buffer || msg.positions);
        // indices are not strictly needed for hull generation with ConvexHull; accept but ignore for computation.
        // If provided and transferred, they will be garbage collected afterward.
        const scale = msg.localScale || msg.scale || msg.local?.s || [1, 1, 1];

        const { hullVertices, hullIndices } = computeHullFromPositions(positions, scale);

        // Transfer results back, release incoming buffers by letting them go out of scope.
        const transfer = [];
        if (hullVertices?.buffer) transfer.push(hullVertices.buffer);
        if (hullIndices?.buffer) transfer.push(hullIndices.buffer);

        ack(replyId, { vertices: hullVertices, indices: hullIndices }, transfer);
        break;
      }

      default: {
        ack(replyId, { ok: false, reason: 'unknown message type' });
        break;
      }
    }
  } catch (err) {
    nack(replyId, err);
  }
});