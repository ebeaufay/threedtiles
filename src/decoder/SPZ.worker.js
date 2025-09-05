// A dedicated Web Worker for decoding SPZ gaussian splats. The worker
// is written as a module (ESM) so that bundlers like Vite can inline
// dependencies. It receives a message containing an `id` and a
// transferred `spz` ArrayBuffer. It decodes the SPZ payload using
// `loadSpz` from '@spz-loader/core', computes linearized colors and
// covariance matrices, and sends the resulting ArrayBuffers back to
// the main thread. Any errors are reported back to the main thread
// via an `error` property.
import { loadSpz } from '@spz-loader/core';

// Convert arbitrary alpha encodings to the 0..1 range. Mirrors the logic
// in GLTFTileDecoder.js. Supports 0..1 floats and various integer ranges.
function toUnitAlpha(a) {
  if (!Number.isFinite(a)) return 1;
  if (a >= 0 && a <= 1) return a;
  if (a >= 0 && a <= 255 && Math.abs(a - Math.round(a)) < 1e-3) return a / 255;
  if (a >= 0 && a <= 65535 && Math.abs(a - Math.round(a)) < 1e-3) return a / 65535;
  return Math.min(1, Math.max(0, a));
}

// Convert sRGB or SH0 luminance to linear RGB. Mirrors the logic from
// GLTFTileDecoder.js.#toLinearFromSh0Maybe. Accepts values in several
// encodings: floats in 0..1, integers in 0..255 or 0..65535, or SH0.
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

// Construct two 3×3 covariance columns from quaternion rotations and
// log‑scales (see the gaussian splats paper). Mirrors GLTFTileDecoder.js.#covFromRotScale.
function covFromRotScale(rot, logScale) {
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
    // scales; note that the exponential is omitted to match GLTFTileDecoder.js
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

self.onmessage = async function (e) {
  const data = e.data || {};
  const { id, spz } = data;
  if (spz === undefined) return;
  try {
    const gs = await loadSpz(spz);
    const numPoints = gs.numPoints ?? gs.positions.length / 3;
    // Copy positions to a new Float32Array. gs.positions can be a typed array,
    // a plain array, or something else. The copy ensures we can detach
    // the underlying buffer and send it back.
    const positions = new Float32Array(gs.positions);
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
    const cov = covFromRotScale(rot, scl);
    // Return just the underlying ArrayBuffers to allow zero‑copy transfer.
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
};