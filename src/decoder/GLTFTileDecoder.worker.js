// Worker to handle GLTF splats parsing and heavy numeric work (merges previous SPZ.worker.js + KHR work).
// Runs as an ESM worker so bundlers (Vite/webpack) can inline it when imported with ?worker&inline
import { loadSpz } from '@spz-loader/core';

// Convert arbitrary alpha encodings to 0..1 (matches main-thread logic)
function toUnitAlpha(a) {
  if (!Number.isFinite(a)) return 1;
  if (a >= 0 && a <= 1) return a;
  if (a >= 0 && a <= 255 && Math.abs(a - Math.round(a)) < 1e-3) return a / 255;
  if (a >= 0 && a <= 65535 && Math.abs(a - Math.round(a)) < 1e-3) return a / 65535;
  return Math.min(1, Math.max(0, a));
}

// Convert sRGB or SH0 luminance to linear RGB (matches main-thread logic)
function toLinearFromSh0Maybe(r, g, b) {
  const isU8 = (v) => v >= 0 && v <= 255 && Math.abs(v - Math.round(v)) < 1e-3;
  const isU16 = (v) => v >= 0 && v <= 65535 && Math.abs(v - Math.round(v)) < 1e-3;
  const lin = (s) => (s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4));
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  let sr = r,
    sg = g,
    sb = b;
  if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
    // sRGB float 0–1
  } else if (isU8(r) && isU8(g) && isU8(b)) {
    sr = r / 255;
    sg = g / 255;
    sb = b / 255;
  } else if (isU16(r) && isU16(g) && isU16(b)) {
    sr = r / 65535;
    sg = g / 65535;
    sb = b / 65535;
  } else {
    const sh = (x) => 0.5 + 0.28209479177387814 * x;
    sr = sh(r);
    sg = sh(g);
    sb = sh(b);
  }
  sr = clamp01(sr);
  sg = clamp01(sg);
  sb = clamp01(sb);
  return [lin(sr), lin(sg), lin(sb)];
}

// Covariance computation variant used by SPZ.worker (note the negation of rotation xyz).
function covFromRotScaleSPZ(rot, logScale) {
  const n = (rot?.length || 0) / 4;
  const c0 = new Float32Array(n * 3);
  const c1 = new Float32Array(n * 3);
  const R = new Float32Array(9);
  for (let i = 0; i < n; i++) {
    const x = rot ? -rot[i * 4 + 0] : 0,
      y = rot ? -rot[i * 4 + 1] : 0,
      z = rot ? -rot[i * 4 + 2] : 0,
      w = rot ? rot[i * 4 + 3] : 1;
    const xx = x * x,
      yy = y * y,
      zz = z * z,
      xy = x * y,
      xz = x * z,
      yz = y * z,
      wx = w * x,
      wy = w * y,
      wz = w * z;
    // rotation matrix
    R[0] = 1 - 2 * (yy + zz);
    R[1] = 2 * (xy - wz);
    R[2] = 2 * (xz + wy);
    R[3] = 2 * (xy + wz);
    R[4] = 1 - 2 * (xx + zz);
    R[5] = 2 * (yz - wx);
    R[6] = 2 * (xz - wy);
    R[7] = 2 * (yz + wx);
    R[8] = 1 - 2 * (xx + yy);
    // scales; note exponential omitted to match main-thread behaviour
    const sx = Math.max(1e-12, logScale ? logScale[i * 3 + 0] : 0);
    const sy = Math.max(1e-12, logScale ? logScale[i * 3 + 1] : 0);
    const sz = Math.max(1e-12, logScale ? logScale[i * 3 + 2] : 0);
    const sxx = sx * sx,
      syy = sy * sy,
      szz = sz * sz;
    const m00 = R[0] * R[0] * sxx + R[1] * R[1] * syy + R[2] * R[2] * szz;
    const m10 = R[3] * R[0] * sxx + R[4] * R[1] * syy + R[5] * R[2] * szz;
    const m20 = R[6] * R[0] * sxx + R[7] * R[1] * syy + R[8] * R[2] * szz;
    const m11 = R[3] * R[3] * sxx + R[4] * R[4] * syy + R[5] * R[5] * szz;
    const m21 = R[6] * R[3] * sxx + R[7] * R[4] * syy + R[8] * R[5] * szz;
    const m22 = R[6] * R[6] * sxx + R[7] * R[7] * syy + R[8] * R[8] * szz;
    const j = i * 3;
    c0[j + 0] = m00;
    c0[j + 1] = m10;
    c0[j + 2] = m20;
    c1[j + 0] = m11;
    c1[j + 1] = m21;
    c1[j + 2] = m22;
  }
  return { c0, c1 };
}

// Covariance computation variant used by KHR handling (no negation)
function covFromRotScaleKHR(rot, logScale) {
  const n = (rot?.length || 0) / 4;
  const c0 = new Float32Array(n * 3);
  const c1 = new Float32Array(n * 3);
  const R = new Float32Array(9);
  for (let i = 0; i < n; i++) {
    const x = rot ? rot[i * 4 + 0] : 0,
      y = rot ? rot[i * 4 + 1] : 0,
      z = rot ? rot[i * 4 + 2] : 0,
      w = rot ? rot[i * 4 + 3] : 1;
    const xx = x * x,
      yy = y * y,
      zz = z * z,
      xy = x * y,
      xz = x * z,
      yz = y * z,
      wx = w * x,
      wy = w * y,
      wz = w * z;
    R[0] = 1 - 2 * (yy + zz);
    R[1] = 2 * (xy - wz);
    R[2] = 2 * (xz + wy);
    R[3] = 2 * (xy + wz);
    R[4] = 1 - 2 * (xx + zz);
    R[5] = 2 * (yz - wx);
    R[6] = 2 * (xz - wy);
    R[7] = 2 * (yz + wx);
    R[8] = 1 - 2 * (xx + yy);
    const sx = Math.max(1e-12, logScale ? logScale[i * 3 + 0] : 0);
    const sy = Math.max(1e-12, logScale ? logScale[i * 3 + 1] : 0);
    const sz = Math.max(1e-12, logScale ? logScale[i * 3 + 2] : 0);
    const sxx = sx * sx,
      syy = sy * sy,
      szz = sz * sz;
    const m00 = R[0] * R[0] * sxx + R[1] * R[1] * syy + R[2] * R[2] * szz;
    const m10 = R[3] * R[0] * sxx + R[4] * R[1] * syy + R[5] * R[2] * szz;
    const m20 = R[6] * R[0] * sxx + R[7] * R[1] * syy + R[8] * R[2] * szz;
    const m11 = R[3] * R[3] * sxx + R[4] * R[4] * syy + R[5] * R[5] * szz;
    const m21 = R[6] * R[3] * sxx + R[7] * R[4] * syy + R[8] * R[5] * szz;
    const m22 = R[6] * R[6] * sxx + R[7] * R[7] * syy + R[8] * R[8] * szz;
    const j = i * 3;
    c0[j + 0] = m00;
    c0[j + 1] = m10;
    c0[j + 2] = m20;
    c1[j + 0] = m11;
    c1[j + 1] = m21;
    c1[j + 2] = m22;
  }
  return { c0, c1 };
}

// Helper to create Float32Array view from an ArrayBuffer that's known to contain float32s.
// If buffer is null/undefined it returns null.
function asF32(buf) {
  if (!buf) return null;
  return new Float32Array(buf);
}

// Handler for SPZ decoding (merges logic from previous SPZ.worker.js)
async function handleSPZ(id, spz) {
  try {
    // Load SPZ (some callers used {coordinateSystem:"LUF"}; keep it permissive)
    const gs = await loadSpz(spz, { coordinateSystem: "LUF" });
    const numPoints = gs.numPoints ?? gs.positions.length / 3;
    const positions = new Float32Array(gs.positions); // copy to ensure transferable
    const rgb = gs.colors ?? gs.color;
    const aArr = gs.alphas ?? gs.opacity ?? gs.opacities;
    const colors = new Float32Array(numPoints * 4);
    for (let i = 0; i < numPoints; i++) {
      const r = rgb[i * 3 + 0],
        g = rgb[i * 3 + 1],
        b = rgb[i * 3 + 2];
      const a = aArr ? toUnitAlpha(aArr[i]) : 1;
      const [lr, lg, lb] = toLinearFromSh0Maybe(r, g, b);
      const j = i * 4;
      colors[j + 0] = lr;
      colors[j + 1] = lg;
      colors[j + 2] = lb;
      colors[j + 3] = a;
    }
    const rot = gs.rotations ?? gs.quaternions;
    const scl = gs.scales ?? gs.scale;
    const cov = covFromRotScaleSPZ(rot, scl);
    self.postMessage(
      {
        id,
        pos: positions.buffer,
        col: colors.buffer,
        c0: cov.c0.buffer,
        c1: cov.c1.buffer,
      },
      [positions.buffer, colors.buffer, cov.c0.buffer, cov.c1.buffer]
    );
  } catch (error) {
    self.postMessage({ id, error: error && error.message ? error.message : String(error) });
  }
}

// Handler for KHR gaussian splat style accessors (compute colors and covariances)
// Expects typed-data ArrayBuffers for pos, col, rot, scl (or null). The buffers must
// contain only the accessor bytes (not an entire glb).
function handleKHR(id, payload) {
  try {
    const posBuf = payload.pos;
    const colBuf = payload.col;
    const rotBuf = payload.rot;
    const sclBuf = payload.scl;
    const positions = asF32(posBuf);
    const rgb = colBuf ? asF32(colBuf) : null;
    const rot = rotBuf ? asF32(rotBuf) : null;
    const scl = sclBuf ? asF32(sclBuf) : null;
    const n = positions.length / 3;
    const colors = new Float32Array(n * 4);
    if (rgb) {
      // rgb may be 3 or 4 channels packed as float32s
      const stride = rgb.length === n * 4 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const r = rgb[i * stride + 0],
          g = rgb[i * stride + 1],
          b = rgb[i * stride + 2];
        const [lr, lg, lb] = toLinearFromSh0Maybe(r, g, b);
        colors.set([lr, lg, lb, stride === 4 ? rgb[i * stride + 3] : 1], i * 4);
      }
    } else {
      for (let i = 0; i < n; i++) colors.set([1, 1, 1, 1], i * 4);
    }
    const cov = covFromRotScaleKHR(rot, scl);
    self.postMessage(
      {
        id,
        pos: positions.buffer,
        col: colors.buffer,
        c0: cov.c0.buffer,
        c1: cov.c1.buffer,
      },
      [positions.buffer, colors.buffer, cov.c0.buffer, cov.c1.buffer]
    );
  } catch (error) {
    self.postMessage({ id, error: error && error.message ? error.message : String(error) });
  }
}

// Generic message handler: routes operations
self.onmessage = async function (e) {
  const data = e.data || {};
  const { id, op } = data;
  if (!op) return;
  try {
    if (op === 'decodeSPZ') {
      const { spz } = data;
      if (spz === undefined) return;
      await handleSPZ(id, spz);
    } else if (op === 'handleKHR') {
      // payload contains pos/col/rot/scl ArrayBuffers (already sliced to accessor bytes)
      handleKHR(id, data.payload || {});
    } else {
      // unknown op -> reply with error
      self.postMessage({ id, error: 'Unknown op: ' + String(op) });
    }
  } catch (err) {
    self.postMessage({ id, error: err && err.message ? err.message : String(err) });
  }
};