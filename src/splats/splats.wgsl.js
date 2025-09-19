
// splats.wgsl.fixed.js
// Exports two single-function WGSL strings compatible with three/nodes wgslFn().
// Each function has only parameters and no global vars, structs, or entry-point decorators.

export const vertex = /* wgsl */`
fn splatsVS(
  // per-instance inputs
  order: u32,
  quadPos: vec3<f32>,

  // scene matrices (pass cameraProjectionMatrix, cameraViewMatrix, modelWorldMatrix from JS)
  projectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,

  // resources
  positionColor3D: texture_3d<u32>,
  covariance3D: texture_3d<u32>,

  // scalar uniforms
  textureSize: u32,
  sizeMultiplier: f32,
  k: f32,
  beta_k: f32,
  minSplatPixelSize: f32,
  minOpacity: f32,
  culling: u32,
  antialiasingFactor: f32,
  cropRadius: f32,
  depthBias: f32,
  viewportPixelSize: vec2<f32>,
  zUpToYUpMatrix3x3: mat3x3<f32>
) -> vec4<f32> {
  // compute slice coords from linear address
  let texSize: u32 = textureSize;
  let slicePixels: u32 = texSize * texSize;
  let sliceIndex: u32 = order / slicePixels;
  let slicePixelIndex: u32 = order % slicePixels;
  let xVal: u32 = slicePixelIndex % texSize;
  let yVal: u32 = slicePixelIndex / texSize;
  let coord: vec3<i32> = vec3<i32>(i32(xVal), i32(yVal), i32(sliceIndex));

  // load packed position (xyz as u32 bitcasts) and color (rgba8)
  let posCol: vec4<u32> = textureLoad(positionColor3D, coord, 0);
  var splatPosModel: vec3<f32> = vec3<f32>(bitcast<f32>(posCol.r), bitcast<f32>(posCol.g), bitcast<f32>(posCol.b));
  // WGSL builtin to unpack 4x8 UNORM from u32
  var color: vec4<f32> = unpack4x8unorm(posCol.a);

  // cull by radius
  if (length(splatPosModel) > cropRadius) {
    // write varyings via injected 'varyings' object
    varyings.vUv = quadPos.xy;
    varyings.vStds = 0.0;
    varyings.vColor = vec4<f32>(0.0);
    varyings.vSplatDepth = 1.0;
    return vec4<f32>(0.0);
  }

  // fetch covariance rows packed as half2
  let cov: vec4<u32> = textureLoad(covariance3D, coord, 0);
  let c0: vec2<f32> = unpack2x16float(cov.r);
  let c1: vec2<f32> = unpack2x16float(cov.g);
  let c2: vec2<f32> = unpack2x16float(cov.b);
  var covariance: mat3x3<f32> = mat3x3<f32>(
    vec3<f32>(c0.x, c0.y, c1.x),
    vec3<f32>(c0.y, c1.y, c2.x),
    vec3<f32>(c1.x, c2.x, c2.y)
  );

  // rotate covariance from z-up to y-up and by model rotation
  let modelRot: mat3x3<f32> = mat3x3<f32>(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  );
  let modelRotT: mat3x3<f32> = transpose(modelRot);
  covariance = transpose(zUpToYUpMatrix3x3) * covariance * zUpToYUpMatrix3x3;
  covariance = modelRotT * covariance * modelRot;
  covariance = covariance * (sizeMultiplier * sizeMultiplier);

  // threshold-based stds for opacity falloff
  let maxV: f32 = max(color.a, 0.0001);
  let thresh: f32 = min(minOpacity, maxV);
  if (thresh >= maxV) {
    varyings.vUv = quadPos.xy;
    varyings.vStds = 0.0;
    varyings.vColor = vec4<f32>(0.0);
    varyings.vSplatDepth = 1.0;
    return vec4<f32>(0.0);
  }
  let lnRatio: f32 = log(thresh / maxV);
  var stds: f32 = pow(-8.0 * lnRatio / beta_k, 1.0 / k);

  // world position
  let rotatedModel: vec3<f32> = zUpToYUpMatrix3x3 * splatPosModel;
  let splatWorld: vec3<f32> = (modelMatrix * vec4<f32>(rotatedModel, 1.0)).xyz;

  // depth without and with bias
  var splatView: vec4<f32> = viewMatrix * vec4<f32>(splatWorld, 1.0);
  let splatProj: vec4<f32> = projectionMatrix * splatView;
  splatView.z = splatView.z + depthBias;
  let splatProjBias: vec4<f32> = projectionMatrix * splatView;
  let splatDepthWithBias: f32 = (splatProjBias.z / splatProjBias.w) * 0.5 + 0.5;

  // screen-space jacobian
  let posCam: vec3<f32> = (viewMatrix * vec4<f32>(splatWorld, 1.0)).xyz;
  let invZ: f32 = 1.0 / posCam.z;
  let invZ2: f32 = invZ * invZ;
  let fx: f32 = projectionMatrix[0][0];
  let fy: f32 = projectionMatrix[1][1];
  let j0: vec3<f32> = vec3<f32>(fx * invZ, 0.0, -fx * posCam.x * invZ2);
  let j1: vec3<f32> = vec3<f32>(0.0, fy * invZ, -fy * posCam.y * invZ2);
  let viewRot: mat3x3<f32> = mat3x3<f32>(
    viewMatrix[0].xyz,
    viewMatrix[1].xyz,
    viewMatrix[2].xyz
  );
  let viewRotT: mat3x3<f32> = transpose(viewRot);
  let j0W: vec3<f32> = viewRotT * j0 * 4.0;
  let j1W: vec3<f32> = viewRotT * j1 * 4.0;
  let tmp0: vec3<f32> = covariance * j0W;
  let tmp1: vec3<f32> = covariance * j1W;
  var a: f32 = dot(j0W, tmp0);
  var b: f32 = dot(j0W, tmp1);
  var c: f32 = dot(j1W, tmp1);
  let sigmaNDC: f32 = (antialiasingFactor / viewportPixelSize.x) * 2.0;
  let k2: f32 = sigmaNDC * sigmaNDC;
  let detOrig: f32 = a * c - b * b;
  a = a + k2;
  c = c + k2;
  let detBlur: f32 = a * c - b * b;
  color.a = color.a * sqrt(clamp(detOrig / detBlur, 0.0, 1.0 - 1.0e-6));
  if (color.a < 0.01) {
    varyings.vUv = quadPos.xy;
    varyings.vStds = 0.0;
    varyings.vColor = vec4<f32>(0.0);
    varyings.vSplatDepth = 1.0;
    return vec4<f32>(0.0);
  }

  // ellipse axes and quad extrusion
  let halfTrace: f32 = 0.5 * (a + c);
  let rootTerm: f32 = sqrt(max(halfTrace * halfTrace - (a * c - b * b), 0.0));
  let lambda1: f32 = halfTrace + rootTerm;
  let lambda2: f32 = halfTrace - rootTerm;
  if (min(lambda2, lambda1) <= 0.0) {
    varyings.vUv = quadPos.xy;
    varyings.vStds = 0.0;
    varyings.vColor = vec4<f32>(0.0);
    varyings.vSplatDepth = 1.0;
    return vec4<f32>(0.0);
  }
  var eig1: vec2<f32>;
  if (abs(b) < 1e-7) {
    if (a >= c) {
      eig1 = vec2<f32>(1.0, 0.0);
    } else {
      eig1 = vec2<f32>(0.0, 1.0);
    }
  } else {
    eig1 = normalize(vec2<f32>(b, lambda1 - a));
  }
  var eig2: vec2<f32> = vec2<f32>(-eig1.y, eig1.x);
  eig1 = eig1 * sqrt(lambda1) * 2.0;
  eig2 = eig2 * sqrt(lambda2) * 2.0;
  let alpha: f32 = dot(j0, j0);
  let betaV: f32 = dot(j0, j1);
  let gammaV: f32 = dot(j1, j1);
  let invDet: f32 = 1.0 / (alpha * gammaV - betaV * betaV);
  var deltaCam1: vec3<f32> = (gammaV * eig1.x - betaV * eig1.y) * j0 + (-betaV * eig1.x + alpha * eig1.y) * j1;
  var deltaCam2: vec3<f32> = (gammaV * eig2.x - betaV * eig2.y) * j0 + (-betaV * eig2.x + alpha * eig2.y) * j1;
  deltaCam1 = deltaCam1 * invDet * 0.5;
  deltaCam2 = deltaCam2 * invDet * 0.5;
  let axisW1: vec3<f32> = viewRotT * deltaCam1;
  let axisW2: vec3<f32> = viewRotT * deltaCam2;

  let outWorld: vec3<f32> = splatWorld + (quadPos.x * axisW1 + quadPos.y * axisW2) * stds;
  let outPos: vec4<f32> = projectionMatrix * viewMatrix * vec4<f32>(outWorld, 1.0);

  // write varyings
  varyings.vUv = quadPos.xy;
  varyings.vStds = stds;
  varyings.vColor = color;
  varyings.vSplatDepth = splatDepthWithBias;

  return outPos;
}
`;

export const fragment = /* wgsl */`
fn splatsFS(
  vUv: vec2<f32>,
  vStds: f32,
  vColor: vec4<f32>,
  k: f32,
  beta_k: f32
) -> vec4<f32> {
  // cheap quad-circle discard
  if (dot(vUv, vUv) > 0.25) {
    return vec4<f32>(0.0);
  }
  let p: vec2<f32> = vUv * vStds;
  let r2: f32 = dot(p, p);
  let rk: f32 = pow(r2, 0.5 * k);
  let alpha: f32 = vColor.a * exp(-beta_k * rk);
  let corrected: vec3<f32> = pow(vColor.rgb, vec3<f32>(1.0 / 2.2));
  return vec4<f32>(corrected, alpha);
}
`;

export const depth = /* wgsl */`
fn splatsDepth(vSplatDepth: f32) -> f32 {
  return vSplatDepth;
}
`;
