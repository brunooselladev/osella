import * as THREE from 'three'
import { day } from './day'
import { foliageTex } from './textures'

// Whitewashed greenhouse glass. Lime brushed on unevenly, putty at the edges, algae low,
// canopy shadows from the trees outside. At night it turns into a dark mirror for the lamp.

const vertex = /* glsl */ `
attribute float aSeed;
varying vec3 vWorld;
varying vec3 vN;
varying vec2 vUv;
varying float vSeed;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vUv = uv;
  vSeed = aSeed;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`

const fragment = /* glsl */ `
uniform vec3 uMilk;
uniform float uGlow;
uniform float uNight;
uniform sampler2D uFoliage;
uniform vec3 uLampPos;
uniform float uLamp;
uniform vec3 uSkyLow;
uniform float uWash;
varying vec3 vWorld;
varying vec3 vN;
varying vec2 vUv;
varying float vSeed;
#include <fog_pars_fragment>

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

void main() {
  vec3 n = dot(vN, vN) > 1e-8 ? normalize(vN) : vec3(0.0, 1.0, 0.0);
  vec3 v = normalize(cameraPosition - vWorld);
  if (dot(n, v) < 0.0) n = -n;
  vec2 P = abs(n.x) > 0.5 ? vWorld.zy : (abs(n.z) > 0.5 ? vWorld.xy : vWorld.zx);

  float strokes = fbm(vec2(P.x * 2.4 + vSeed * 13.0, P.y * 8.0));
  float patches = smoothstep(0.3, 0.75, fbm(P * 0.55 + vSeed * 7.0));
  float wash = patches * 0.55 + strokes * 0.45;
  float clean = step(0.94, vSeed);
  float frost = mix(0.6 + wash * 0.4, 0.12 + wash * 0.18, clean) * uWash;

  vec2 e = min(vUv, 1.0 - vUv);
  float edge = 1.0 - smoothstep(0.0, 0.045, min(e.x, e.y));
  float grime = 1.0 - smoothstep(0.0, 0.25, vUv.y);
  float shade = texture2D(uFoliage, P * 0.075 + vec2(vSeed * 0.04, 0.0)).r;

  vec3 col = uMilk * (0.9 + 0.12 * strokes) * (1.0 - 0.26 * shade * (1.0 - uNight)) * uGlow;
  col *= 1.0 - grime * 0.22;
  col = mix(col, col * vec3(0.82, 0.9, 0.66), grime * step(0.55, vSeed) * 0.7);
  col = mix(col, col * 0.58, edge * 0.7);
  float alpha = mix(0.16, 0.93, frost);
  alpha = max(alpha, edge * 0.8);

  vec3 L = uLampPos - vWorld;
  float d = length(L);
  L /= d;
  vec3 H = normalize(L + v);
  float spec = pow(max(dot(n, H), 0.0), 2400.0) * 2.0 + 0.05 / (1.0 + d * d * 0.5);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 nightCol = uMilk * (0.7 + 0.4 * strokes) + vec3(1.0, 0.66, 0.38) * spec * uLamp + uSkyLow * fres * 0.6;
  col = mix(col, nightCol, uNight);
  alpha = mix(alpha, 0.5 + wash * 0.25 + fres * 0.2, uNight);

  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`

export function makeGlassMaterial(wash = 1) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uMilk: { value: new THREE.Color('#fbf1de') },
        uGlow: { value: 1 },
        uNight: { value: 0 },
        uFoliage: { value: null },
        uLampPos: { value: new THREE.Vector3(1.9, 1.3, 18.6) },
        uLamp: { value: 0 },
        uSkyLow: { value: new THREE.Color('#f4dcb4') },
        uWash: { value: wash },
      },
    ]),
  })
}

export function initGlass(mat: THREE.ShaderMaterial) {
  mat.uniforms.uFoliage.value = foliageTex()
}

export function syncGlass(mat: THREE.ShaderMaterial) {
  const u = mat.uniforms
  u.uMilk.value.copy(day.milk)
  u.uGlow.value = day.glow
  u.uNight.value = day.night
  u.uLamp.value = day.lamp
  u.uSkyLow.value.copy(day.skyLow)
}
