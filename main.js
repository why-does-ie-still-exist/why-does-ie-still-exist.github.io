"use strict";
/* ============================================================ helpers */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9E3779B9 | 0, (s >>> 0) / 4294967296)); }
const vw = () => Math.max(1, innerWidth || document.documentElement.clientWidth || 1), vh = () => Math.max(1, innerHeight || document.documentElement.clientHeight || 1);
const portrait = () => vh() > vw() || vw() <= 720;
const dpr = () => Math.min(2, devicePixelRatio || 1);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Nothing in the scene animates on its own: torchlight is steady and the flames are painted on the
   walls. The only motion is the door opening and the walk-in; after that the view is a still image. */

/* ============================================================ the oak door, drawn at screen resolution */
function buildDoor() {
  // The corridor is as tall as it is wide, and the door fills it floor to ceiling: so the door is a
  // square as wide as the screen, centred on the horizon. On a wide screen its top and bottom run
  // off-screen; on a tall one you see the corridor's floor and ceiling above and below it.
  const k = Math.min(dpr(), 2048 / vw()), W = Math.round(vw() * k / 2) * 2, H = W;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), r = rng(7);
  const perLeaf = portrait() ? 3 : 5, pw = W / 2 / perLeaf;
  for (let leaf = 0; leaf < 2; leaf++) for (let i = 0; i < perLeaf; i++) {
    const x0 = leaf * W / 2 + i * pw;
    g.save(); g.beginPath(); g.rect(x0, 0, pw, H); g.clip();
    g.fillStyle = `hsl(${24 + r() * 7}, ${44 + r() * 10}%, ${19 + r() * 7}%)`; g.fillRect(x0, 0, pw, H);
    // long grain: many faint wandering lines
    for (let n = 0; n < 90; n++) {
      const gx = x0 + r() * pw, amp = 2 * k + r() * 7 * k, f1 = .002 + r() * .006, ph = r() * 9, dark = r() > .35;
      g.strokeStyle = dark ? `rgba(20,9,2,${.05 + r() * .16})` : `rgba(214,160,96,${.03 + r() * .09})`;
      g.lineWidth = (.6 + r() * 2.2) * k;
      g.beginPath();
      for (let y = -10; y <= H + 10; y += 14 * k) { const x = gx + Math.sin(y * f1 / k + ph) * amp + Math.sin(y * f1 * 3.1 / k + ph * 2) * amp * .3; y < 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
    }
    // a knot or two
    for (let n = 0; n < 2; n++) if (r() > .45) {
      const kx = x0 + pw * (.2 + r() * .6), ky = H * (.08 + r() * .84), kr = (5 + r() * 9) * k;
      for (let q = 5; q >= 0; q--) { g.strokeStyle = `rgba(18,8,2,${.5 - q * .07})`; g.lineWidth = 1.4 * k; g.beginPath(); g.ellipse(kx, ky, kr * (.3 + q * .32), kr * (.55 + q * .62), 0, 0, 7); g.stroke(); }
      g.fillStyle = "rgba(14,6,2,.75)"; g.beginPath(); g.ellipse(kx, ky, kr * .3, kr * .5, 0, 0, 7); g.fill();
    }
    // the plank is slightly rounded: light on one edge, shade on the other
    const sh = g.createLinearGradient(x0, 0, x0 + pw, 0);
    sh.addColorStop(0, "rgba(0,0,0,.55)"); sh.addColorStop(.035, "rgba(255,214,160,.10)"); sh.addColorStop(.12, "rgba(0,0,0,0)"); sh.addColorStop(.85, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.38)");
    g.fillStyle = sh; g.fillRect(x0, 0, pw, H);
    g.restore();
  }
  // iron straps with rivets
  const sH = Math.round(H * .03);
  for (const fy of [.33, .67]) {
    const y = Math.round(H * fy);
    const below = g.createLinearGradient(0, y + sH, 0, y + sH + 14 * k); below.addColorStop(0, "rgba(0,0,0,.6)"); below.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = below; g.fillRect(0, y + sH, W, 14 * k);
    const iron = g.createLinearGradient(0, y, 0, y + sH); iron.addColorStop(0, "#565962"); iron.addColorStop(.08, "#33353b"); iron.addColorStop(.6, "#24262b"); iron.addColorStop(1, "#131417");
    g.fillStyle = iron; g.fillRect(0, y, W, sH);
    for (let n = 0; n < W * sH / 900; n++) { g.fillStyle = `rgba(${r() > .5 ? "255,255,255" : "0,0,0"},${r() * .07})`; g.fillRect(r() * W, y + r() * sH, (1 + r() * 3) * k, (1 + r() * 2) * k); }   // hammered pitting
    const step = sH * 1.9, rr = sH * .2;
    for (let x = step * .5; x < W; x += step) {
      g.fillStyle = "rgba(0,0,0,.55)"; g.beginPath(); g.arc(x + rr * .25, y + sH / 2 + rr * .35, rr * 1.1, 0, 7); g.fill();
      const rv = g.createRadialGradient(x - rr * .35, y + sH / 2 - rr * .35, rr * .1, x, y + sH / 2, rr); rv.addColorStop(0, "#a9adb6"); rv.addColorStop(.5, "#5a5d66"); rv.addColorStop(1, "#22242a");
      g.fillStyle = rv; g.beginPath(); g.arc(x, y + sH / 2, rr, 0, 7); g.fill();
    }
  }
  // the seam between the leaves, then a vignette
  g.fillStyle = "#070302"; g.fillRect(W / 2 - 2 * k, 0, 4 * k, H);
  g.fillStyle = "rgba(255,214,160,.18)"; g.fillRect(W / 2 + 2 * k, 0, k, H);
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.hypot(W, H) * .6);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.72)");
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  // the ring handle
  const css = Math.round(Math.min(vw(), vh()) * (portrait() ? .26 : .2)), S = css * k;
  const ring = $("#ring"), rc = ring.querySelector("canvas"); rc.width = S; rc.height = Math.round(S * 1.4);
  const q = rc.getContext("2d"), cx = S / 2, by = S * .2, br = S * .15, ry = S * .47, rx = S * .37, cy = by + ry * .93;
  const hoop = (w, style, dx = 0, dy = 0) => { q.strokeStyle = style; q.lineWidth = w; q.beginPath(); q.ellipse(cx + dx, cy + dy, rx, ry, 0, 0, 7); q.stroke(); };
  q.shadowColor = "rgba(0,0,0,.65)"; q.shadowBlur = S * .06; q.shadowOffsetX = S * .025; q.shadowOffsetY = S * .04;
  hoop(S * .1, "#0c0d10");
  q.shadowColor = "transparent";
  const metal = q.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry); metal.addColorStop(0, "#c9cdd6"); metal.addColorStop(.3, "#6d717b"); metal.addColorStop(.62, "#2c2e34"); metal.addColorStop(1, "#595c66");
  hoop(S * .075, metal);
  const glint = q.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry); glint.addColorStop(0, "rgba(255,255,255,.75)"); glint.addColorStop(.25, "rgba(255,255,255,0)"); glint.addColorStop(.8, "rgba(255,255,255,0)"); glint.addColorStop(1, "rgba(255,255,255,.25)");
  hoop(S * .018, glint, -S * .012, -S * .014);
  q.shadowColor = "rgba(0,0,0,.6)"; q.shadowBlur = S * .05; q.shadowOffsetY = S * .03;
  const boss = q.createRadialGradient(cx - br * .35, by - br * .4, br * .1, cx, by, br); boss.addColorStop(0, "#d3d6dd"); boss.addColorStop(.35, "#6a6e78"); boss.addColorStop(.8, "#2a2c32"); boss.addColorStop(1, "#111215");
  q.fillStyle = boss; q.beginPath(); q.arc(cx, by, br, 0, 7); q.fill();
  ring.style.width = css + "px"; ring.style.height = Math.round(css * 1.4) + "px";
  const left = Math.round(vw() / 2 * (1 + (portrait() ? .12 : .1))), top = Math.round(vh() / 2 - css * .62);
  ring.style.left = left + "px"; ring.style.top = top + "px";
  // Two versions of the door: a bare one, shown while the ring is a live button on top of it, and
  // one with the same ring painted on exactly where the button sits. The renderer swaps to the
  // second at the moment the button is removed, so the ring stays on the leaf as the door swings
  // and there is never a second ring behind the button. (The door's top edge sits (vh - vw) / 2
  // down the screen.)
  const withRing = document.createElement("canvas"); withRing.width = W; withRing.height = H;
  const g2 = withRing.getContext("2d"); g2.drawImage(c, 0, 0); g2.drawImage(rc, left * k, (top - (vh() - vw()) / 2) * k);
  doorCanvas = c; doorWithRing = withRing; uploadDoor();
}

/* ============================================================ stone textures, generated at 1024px */
const TS = 1024;
function stoneTexture(seed, N, tones, mortar) {
  const r = rng(seed), cell = TS / N, pts = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = tones[Math.floor(r() * tones.length)], v = .78 + r() * .34;
    pts.push({ x: (i + .18 + r() * .64) * cell, y: (j + .18 + r() * .64) * cell, c: [t[0] * v, t[1] * v, t[2] * v] });
  }
  // tileable value noise
  const lat = {};
  const noise = (x, y, P) => {
    const L = lat[P] || (lat[P] = Float32Array.from({ length: P * P }, () => r()));
    const fx = x / TS * P, fy = y / TS * P, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), a = (x0 % P), b = ((x0 + 1) % P), c = (y0 % P) * P, d = ((y0 + 1) % P) * P;
    return lerp(lerp(L[c + a], L[c + b], sx), lerp(L[d + a], L[d + b], sx), sy);
  };
  // Flat stones: each is one colour with fine grain, separated by mortar. No height field and no
  // baked-in relief shading, so nothing implies a light direction.
  const img = new ImageData(TS, TS), d = img.data;
  for (let y = 0; y < TS; y++) {
    const cj = Math.floor(y / cell);
    for (let x = 0; x < TS; x++) {
      const ci = Math.floor(x / cell);
      let d1 = 1e9, d2 = 1e9, w = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const idx = ((cj + dj + N) % N) * N + ((ci + di + N) % N), p = pts[idx];
        let dx = Math.abs(x - p.x), dy = Math.abs(y - p.y);
        if (dx > TS / 2) dx = TS - dx; if (dy > TS / 2) dy = TS - dy;
        const dd = Math.hypot(dx, dy * 1.12);
        if (dd < d1) { d2 = d1; d1 = dd; w = idx; } else if (dd < d2) d2 = dd;
      }
      const e = d2 - d1 + (noise(x, y, 32) - .5) * 9;                       // wobbly stone outlines
      const grain = noise(x, y, 16) * .5 + noise(x, y, 64) * .3 + noise(x, y, 256) * .2, speck = noise(x, y, 256);
      const c = pts[w].c, v = .78 + grain * .3, m = 34 + speck * 26;
      const s = smooth(mortar - 1, mortar + 1, e);                           // 0 in the mortar, 1 on the stone
      const o = (y * TS + x) * 4;
      d[o] = clamp(lerp(m * 1.05, c[0] * v, s), 0, 255); d[o + 1] = clamp(lerp(m * .96, c[1] * v, s), 0, 255); d[o + 2] = clamp(lerp(m * .86, c[2] * v, s), 0, 255); d[o + 3] = 255;
    }
  }
  return img;
}

/* Floorboards: N strips across the tile running along y, two boards to a strip with staggered ends.
   Flat colour and grain only, like the stones. Tiles seamlessly. */
function plankTexture(seed, N) {
  const r = rng(seed), lat = {};
  const noise = (x, y, P) => {
    const L = lat[P] || (lat[P] = Float32Array.from({ length: P * P }, () => r()));
    const fx = x / TS * P, fy = y / TS * P, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), a = x0 % P, b = (x0 + 1) % P, c = (y0 % P) * P, d = ((y0 + 1) % P) * P;
    return lerp(lerp(L[c + a], L[c + b], sx), lerp(L[d + a], L[d + b], sx), sy);
  };
  const tones = [[150, 98, 52], [132, 84, 44], [164, 110, 60], [120, 76, 40], [142, 96, 56]];
  const pw = TS / N, half = TS / 2, gap = 2.5;
  const strips = Array.from({ length: N }, () => ({ off: Math.floor(r() * TS), boards: [0, 1].map(() => { const t = tones[Math.floor(r() * tones.length)], v = .82 + r() * .3; return [t[0] * v, t[1] * v, t[2] * v]; }) }));
  const img = new ImageData(TS, TS), d = img.data;
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const si = Math.floor(x / pw), s = strips[si], along = (y + s.off) % TS, c = s.boards[Math.floor(along / half)];
    const inX = x - si * pw, inY = along % half;
    const edge = Math.min(inX, pw - inX, inY, half - inY);                 // distance to the nearest joint
    const grain = noise((x * 8) % TS, y, 32) * .55 + noise((x * 16) % TS, y, 128) * .3 + noise(x, y, 256) * .15;   // streaks along the board
    const v = .72 + grain * .5, k = smooth(gap - 1, gap + 1, edge), o = (y * TS + x) * 4;
    d[o] = clamp(lerp(20, c[0] * v, k), 0, 255); d[o + 1] = clamp(lerp(12, c[1] * v, k), 0, 255); d[o + 2] = clamp(lerp(7, c[2] * v, k), 0, 255); d[o + 3] = 255;
  }
  return img;
}

/* ============================================================ the castle */
const MAP = [
  "111111111111",
  "100000000001",
  "100000000001",
  "100000000001",
  "100000000001",
  "111110111111",
  "111110111111",
  "111110111111",
  "111111111111"].map(r => [...r].map(Number));
const MW = MAP[0].length, MH = MAP.length;
const torches = [[2.5, 1.1], [5.5, 1.1], [8.5, 1.1], [10.9, 2.9], [1.1, 2.05], [1.1, 3.95], [3.5, 4.9], [8.0, 4.9], [5.9, 6.4], [5.1, 7.4]]
  .map(([x, y], i) => ({ x, y, phase: i * 1.7, level: .9 }));
const NT = torches.length, NS = 1;
// Banners hang flat on the walls: [x, y] of a point just off the wall, like the torches.
const banners = [[4.0, 1.1], [7.0, 1.1], [10.0, 1.1], [1.1, 1.45], [1.1, 4.55], [10.9, 1.8], [10.9, 4.0],
  [2.2, 4.9], [4.5, 4.9], [6.6, 4.9], [9.6, 4.9], [5.1, 5.65], [5.9, 5.65]];
const NB = banners.length;
// The same site lives at /moe with pink banners instead of red.
const MOE = /\/moe\/?$/.test(location.pathname.replace(/index\.html$/, ""));
const BANNER_CLOTH = MOE ? "vec3(.96, .45, .68)" : "vec3(.56, .05, .07)";
const wizard = { x: 1.85, y: 3.0, ready: false };
const WIZ_CROP = [0, 0, 1200, 1600], WIZ_SIZE = [1200, 1600];      // the whole photo (x, y, width, height of the part to show)
const START_Y = 7.75;
const cam = { x: 5.5, y: START_Y, a: -Math.PI / 2, bob: 0, horizon: .5 };

/* The door is a thing in the world, drawn by the same renderer as the walls: two flat leaves, floor
   to ceiling, hinged on the corridor walls a fixed distance ahead of where you start. They swing
   inward and stay there while you walk between them. */
const doorDist = () => .5 / planeLen;               // the distance at which a corridor-wide door exactly fills the screen
const SWING = 1.5, SWING_TIME = 1.5;                // radians (86 degrees) and seconds
let doorCanvas = null, doorWithRing = null, ringedTex = null, makeTex = null;
function uploadDoor() {
  if (!makeTex || !doorCanvas) return;
  ringedTex = makeTex(5, doorWithRing, false, true);   // kept ready on a spare unit
  makeTex(4, doorCanvas, false, true);                 // unit 4 is the one the shader draws
  dirty = true;
}
function showRingOnDoor() {                            // instant: just rebinds the ready-made texture
  if (!gl || !ringedTex) return;
  gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, ringedTex); dirty = true;
}

/* ============================================================ the renderer: a raycaster in a fragment shader */
const FRAG = `#version 300 es
precision highp float;
#define NT ${NT}
#define NS ${NS}
#define NB ${NB}
const vec2 BANNER[NB] = vec2[NB](${banners.map(b => `vec2(${b[0].toFixed(2)}, ${b[1].toFixed(2)})`).join(", ")});
uniform vec2 uRes, uPos;
uniform float uAng, uPlane, uHz, uTime;
uniform sampler2D uMap, uWall, uFloor, uWiz;
uniform vec3 uTorch[NT];      // x, y, brightness
uniform vec4 uSpr[NS];        // centre x, top, height, width (pixels, y down), far to near
uniform vec4 uSprA[NS];       // depth, kind (0 torch, 1 wizard, -1 none), light, seed
uniform vec4 uWizCrop;        // u0, v0, u1, v1
uniform vec4 uDoor;           // y of the doorway, swing angle, visible, -
uniform sampler2D uDoorTex;
out vec4 o;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float torchLight(vec2 p) { float l = 0.; for (int i = 0; i < NT; i++) { vec2 d = p - uTorch[i].xy; l += uTorch[i].z / (1. + 2.2 * dot(d, d)); } return l; }
vec3 lit(vec3 c, float amb, float tl) { return c * (amb * vec3(1., 1., 1.15) + tl * vec3(1., .78, .46)); }

// a wall torch in its own square: uv 0..1, y down. Returns colour and coverage; glow is added on top.
vec4 torch(vec2 uv, float seed, out vec3 glow) {
  float X = uv.x - .5, t = seed;                 // a fixed shape per torch: the flame never moves
  vec4 c = vec4(0.);
  float shaft = smoothstep(.034, .026, abs(X)) * step(.56, uv.y) * step(uv.y, .95);
  c = mix(c, vec4(mix(vec3(.36, .22, .1), vec3(.14, .08, .03), smoothstep(-.03, .03, X)), 1.), shaft);
  float cupW = .1 - (uv.y - .5) * .55;
  float cup = smoothstep(cupW, cupW - .008, abs(X)) * step(.5, uv.y) * step(uv.y, .6);
  c = mix(c, vec4(mix(vec3(.32, .33, .37), vec3(.05, .05, .06), smoothstep(-.08, .07, X)), 1.), cup);
  float h = (.52 - uv.y) / .4;                       // 0 at the base of the flame, 1 at its tip
  if (h > 0. && h < 1.) {
    float xs = X + sin(h * 5. - t * 5.) * .022 * h + sin(h * 11. + t * 8.3) * .012 * h;
    float w = .135 * pow(1. - h, .65) * smoothstep(-.05, .22, h) * (.82 + .36 * vnoise(vec2(h * 5. - t * 2.6, seed)));
    float d = abs(xs) / max(w, 1e-4), a = smoothstep(1., .55, d);
    float heat = (1. - d) * (1. - h * .75);
    vec3 fc = mix(vec3(.95, .2, .03), vec3(1., .62, .1), smoothstep(.0, .45, heat));
    fc = mix(fc, vec3(1., .96, .72), smoothstep(.4, .85, heat));
    c = mix(c, vec4(fc, 1.), a);
  }
  vec2 g = vec2(X, uv.y - .36);
  glow = vec3(1., .5, .14) * exp(-dot(g, g) * 22.) * .55;
  return c;
}

// A carpet runner woven into the floor: up the corridor, then left along the hall to the wizard.
// Returns its colour and how much it covers the floor at p.
float sdBox(vec2 p, vec2 c, vec2 h) { vec2 d = abs(p - c) - h; return length(max(d, 0.)) + min(max(d.x, d.y), 0.); }
vec4 carpet(vec2 p, float soft) {
  float d = min(sdBox(p, vec2(5.5, 5.6), vec2(.3, 2.9)), sdBox(p, vec2(4.2, 3.0), vec2(1.6, .3)));     // the runner; < 0 on the carpet
  d = min(d, sdBox(p, vec2(2.0, 3.0), vec2(.82, 1.0)));                                                  // and a broad rug before the wizard
  if (d > soft) return vec4(0.);
  vec3 red = vec3(.5, .05, .07), deep = vec3(.3, .02, .05), gold = vec3(.8, .6, .2);
  vec3 c = red;
  vec2 g = abs(fract(p * 3.3333) - .5);
  c = mix(c, deep, smoothstep(.2 + soft * 3., .2 - soft * 3., g.x + g.y) * step(d, -.1));          // a field of diamonds
  c = mix(c, gold, smoothstep(.006 + soft, .006, abs(g.x + g.y - .3)) * step(d, -.1) * .6);
  c = mix(c, gold, smoothstep(.016 + soft, .016, abs(d + .06)));                                      // gold stripe inside the edge
  c = mix(c, deep, smoothstep(soft, 0., abs(d + .012) - .012));                                        // dark bound edge
  c *= .9 + .2 * vnoise(p * 70.);                                                                      // weave
  return vec4(c, smoothstep(soft, -soft, d));
}
// A banner in its own box: b.x across (-1..1), b.y down (0 at the rod, 1 at the tips). Swallow-tailed,
// red with a gold border and device.
vec4 banner(vec2 b) {
  vec3 red = ${BANNER_CLOTH}, gold = vec3(.82, .62, .2);
  float ax = abs(b.x);
  if (b.y > -.045 && b.y < .02 && ax < 1.14) return vec4(mix(vec3(.45, .32, .1), vec3(.16, .1, .03), smoothstep(-.045, .02, b.y)), 1.);   // the rod
  float bottom = 1. - .2 * (1. - ax);                         // the notch between the two tails
  if (ax > 1. || b.y < .02 || b.y > bottom) return vec4(0.);
  vec3 c = red;
  float dia = ax * .95 + abs(b.y - .4) * 2.1;                 // a diamond device
  c = mix(c, gold, step(dia, .52) * step(.4, dia));
  c = mix(c, gold, step(dia, .15));
  c = mix(c, gold, step(.84, ax) * step(ax, .93));           // gold border down the sides
  c = mix(c, gold, step(bottom - .09, b.y) * step(b.y, bottom - .045));   // and along the tails
  c = mix(c, gold, step(.05, b.y) * step(b.y, .075));
  c *= .82 + .18 * sin(b.x * 7. + 1.);                         // soft vertical folds
  return vec4(c, 1.);
}

void main() {
  vec2 f = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float focal = uRes.x * .5 / uPlane;
  vec2 dir = vec2(cos(uAng), sin(uAng)), pl = vec2(-dir.y, dir.x) * uPlane;
  vec2 ray = dir + pl * (2. * f.x / uRes.x - 1.) + 1e-6;

  // walk the grid to the first wall
  ivec2 m = ivec2(floor(uPos)), st = ivec2(sign(ray));
  vec2 dd = abs(1. / ray), sd = (sign(ray) * (vec2(m) - uPos) + sign(ray) * .5 + .5) * dd;
  int side = 0;
  for (int i = 0; i < 48; i++) {
    if (sd.x < sd.y) { sd.x += dd.x; m.x += st.x; side = 0; } else { sd.y += dd.y; m.y += st.y; side = 1; }
    if (texelFetch(uMap, m, 0).r > .5) break;
  }
  float dist = max(.02, side == 0 ? sd.x - dd.x : sd.y - dd.y);
  float lineH = focal / dist, y0 = uHz - lineH * .5;
  vec3 col;
  if (f.y >= y0 && f.y < y0 + lineH) {
    vec2 hit = uPos + dist * ray;
    vec2 uv = vec2(side == 0 ? hit.y : hit.x, (f.y - y0) / lineH);
    col = textureGrad(uWall, uv, vec2(1. / lineH, 0.), vec2(0., 1. / lineH)).rgb;
    // banners are part of the wall: painted on before the lighting
    for (int i = 0; i < NB; i++) {
      vec2 bp = BANNER[i];
      if ((side == 0 ? abs(hit.x - bp.x) : abs(hit.y - bp.y)) > .2) continue;      // not this wall
      vec4 bn = banner(vec2((side == 0 ? hit.y - bp.y : hit.x - bp.x) / .19, (uv.y - .07) / .62));
      col = mix(col, bn.rgb, bn.a);
    }
    col = lit(col, (side == 1 ? .2 : .15) / (1. + dist * dist * .08), torchLight(hit) * (side == 1 ? 1. : .86));
    // a soft dark line where wall meets floor and ceiling
    col *= .55 + .45 * smoothstep(0., .05, min(uv.y, 1. - uv.y));
    // torches are painted flat onto the wall face, like part of its texture
    for (int i = 0; i < NT; i++) {
      vec2 tp = uTorch[i].xy;
      if ((side == 0 ? abs(hit.x - tp.x) : abs(hit.y - tp.y)) > .2) continue;      // not this wall
      vec2 tuv = vec2((side == 0 ? hit.y - tp.y : hit.x - tp.x) / .62 + .5, (uv.y - .18) / .62);
      if (tuv.x < 0. || tuv.x > 1. || tuv.y < 0. || tuv.y > 1.) continue;
      vec3 glow; vec4 c = torch(tuv, float(i) * 1.7, glow);
      col = mix(col, c.rgb, c.a) + glow;
    }
  } else {
    bool ceil_ = f.y < uHz;
    float dy = abs(f.y - uHz) + .5, rd = .5 * focal / dy;
    vec2 p = uPos + rd * ray;
    vec3 t = textureGrad(uFloor, p, pl * (2. * rd / uRes.x), ray * (rd / dy)).rgb;
    if (!ceil_) { vec4 cp = carpet(p, rd * 2.5 / uRes.x + .002); t = mix(t, cp.rgb, cp.a); }   // the runner is part of the floor
    float tl = torchLight(p) * .8;
    if (ceil_) { t *= vec3(.5, .47, .46); tl *= .75; }
    col = lit(t, .16 / (1. + rd * rd * .1), tl);
  }

  // the door: two leaves hinged at x = 5 and x = 6, each a flat panel from floor to ceiling
  if (uDoor.z > .5) {
    for (int i = 0; i < 2; i++) {
      vec2 A = vec2(i == 0 ? 5. : 6., uDoor.x);
      vec2 E = .5 * vec2((i == 0 ? 1. : -1.) * cos(uDoor.y), -sin(uDoor.y));    // hinge to free edge
      float den = ray.x * E.y - ray.y * E.x;
      if (abs(den) < 1e-6) continue;
      vec2 AP = A - uPos;
      float t = (AP.x * E.y - AP.y * E.x) / den, s = (AP.x * ray.y - AP.y * ray.x) / den;
      if (t < .02 || t > dist || s < 0. || s > 1.) continue;
      float lh = focal / t, v = (f.y - (uHz - lh * .5)) / lh;
      if (v < 0. || v > 1.) continue;
      vec2 duv = vec2(i == 0 ? s * .5 : 1. - s * .5, v);
      col = textureGrad(uDoorTex, duv, vec2(.5 / lh, 0.), vec2(0., 1. / lh)).rgb * mix(1., .5, uDoor.y / 1.5);
      dist = t;
    }
  }

  // the one billboard: the wizard
  for (int i = 0; i < NS; i++) {
    vec4 s = uSpr[i], a = uSprA[i];
    if (a.y < 0. || a.x > dist) continue;
    vec2 uv = (f - vec2(s.x - s.w * .5, s.y)) / vec2(s.w, s.z);
    if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) continue;
    vec2 n = uv * 2. - 1.;
    float rad = pow(pow(abs(n.x), 5.) + pow(abs(n.y), 5.), 1. / 5.);          // a rounded rectangle, so the corners (and the hat) survive
    float alpha = smoothstep(1., .84, rad);
    vec3 w = texture(uWiz, mix(uWizCrop.xy, uWizCrop.zw, uv)).rgb;
    col = mix(col, w * a.z, alpha);
  }
  col = pow(col, vec3(.92));
  col += (hash(f) - .5) / 255.;                    // fixed dither against banding (it does not animate)
  o = vec4(col, 1.);
}`;
const VERT = `#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2. - 1., 0., 1.); }`;

const view = $("#view");
const gl = view.getContext("webgl2", { antialias: false, alpha: false });
let U = null, planeLen = 1, focal = 1;
function initGL() {
  if (!gl) return;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);
  U = {}; for (const n of ["uRes", "uPos", "uAng", "uPlane", "uHz", "uTime", "uMap", "uWall", "uFloor", "uWiz", "uTorch", "uSpr", "uSprA", "uWizCrop", "uDoor", "uDoorTex"]) U[n] = gl.getUniformLocation(prog, n);
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
  const tex = (unit, src, repeat, mip) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    if (mip) { gl.generateMipmap(gl.TEXTURE_2D); if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT))); }
    return t;
  };
  // the map, one texel per cell
  const mp = new Uint8Array(MW * MH * 4); MAP.forEach((row, y) => row.forEach((v, x) => { mp[(y * MW + x) * 4] = v * 255; mp[(y * MW + x) * 4 + 3] = 255; }));
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, MW, MH, 0, gl.RGBA, gl.UNSIGNED_BYTE, mp);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  // Start with flat colours so the first frame is drawn at once; the real textures are generated
  // off the main thread and swapped in when ready.
  const flat = (unit, rgb) => tex(unit, new ImageData(new Uint8ClampedArray([...rgb, 255]), 1, 1), true, false);
  flat(1, [150, 142, 130]); flat(2, [128, 84, 46]); flat(3, [0, 0, 0]); flat(4, [74, 47, 24]);
  makeTex = tex;
  const jobs = [[1, "stone", [11, 6, [[172, 162, 150], [150, 144, 138], [182, 166, 140], [140, 132, 122]], 7]], [2, "plank", [29, 6]]];
  const here = () => jobs.forEach(([unit, kind, args], i) => setTimeout(() => { tex(unit, (kind === "stone" ? stoneTexture : plankTexture)(...args), true, true); dirty = true; }, 60 + i * 60));
  try {
    const src = `const TS = ${TS};\n${rng}\nconst clamp = ${clamp}, lerp = ${lerp}, smooth = ${smooth};\n${stoneTexture}\n${plankTexture}\n` +
      `onmessage = e => { const [unit, kind, args] = e.data; const img = (kind === "stone" ? stoneTexture : plankTexture)(...args); postMessage([unit, img.data.buffer], [img.data.buffer]); };`;
    const w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
    let left = jobs.length;
    w.onmessage = e => { tex(e.data[0], new ImageData(new Uint8ClampedArray(e.data[1]), TS, TS), true, true); dirty = true; if (--left === 0) w.terminate(); };
    w.onerror = () => { w.terminate(); here(); };
    jobs.forEach(j => w.postMessage(j));
  } catch (err) { here(); }
  gl.uniform1i(U.uMap, 0); gl.uniform1i(U.uWall, 1); gl.uniform1i(U.uFloor, 2); gl.uniform1i(U.uWiz, 3); gl.uniform1i(U.uDoorTex, 4);
  const [cx, cy, cw, ch] = WIZ_CROP;
  gl.uniform4f(U.uWizCrop, cx / WIZ_SIZE[0], cy / WIZ_SIZE[1], (cx + cw) / WIZ_SIZE[0], (cy + ch) / WIZ_SIZE[1]);
  // the wizard, straight from the painting at its full resolution
  const im = new Image();
  im.onload = () => { gl.activeTexture(gl.TEXTURE3); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); wizard.ready = true; dirty = true; };
  im.src = "wizard.jpg";
}
function sizeView() {
  const k = dpr(); view.width = Math.round(vw() * k); view.height = Math.round(vh() * k);
  planeLen = Math.tan((portrait() ? 54 : 68) * Math.PI / 360); focal = view.width / 2 / planeLen;
  if (gl) gl.viewport(0, 0, view.width, view.height);
  dirty = true;
}
const lightAt = (x, y) => torches.reduce((l, t) => l + t.level / (1 + 2.2 * ((x - t.x) ** 2 + (y - t.y) ** 2)), 0);
const sprBuf = new Float32Array(NS * 4), sprABuf = new Float32Array(NS * 4), torchBuf = new Float32Array(NT * 3);
function render(time) {
  if (!U) return;
  const W = view.width, H = view.height, dx = Math.cos(cam.a), dy = Math.sin(cam.a), hz = H * cam.horizon + cam.bob;
  torches.forEach((t, i) => torchBuf.set([t.x, t.y, t.level], i * 3));
  const list = [];
  if (wizard.ready) list.push({ x: wizard.x, y: wizard.y, wh: .9, z: .04, asp: WIZ_CROP[2] / WIZ_CROP[3], kind: 1, light: clamp(.36 + lightAt(wizard.x, wizard.y) * .7, 0, 1.1), seed: 0 });
  for (const o of list) { const ex = o.x - cam.x, ey = o.y - cam.y; o.f = ex * dx + ey * dy; o.sd = -ex * dy + ey * dx; }
  list.sort((a, b) => b.f - a.f);
  sprABuf.fill(-1);
  list.forEach((o, i) => {
    if (o.f < .12) return;
    const hpx = o.wh * focal / o.f, bottom = hz + (.5 - o.z) * focal / o.f;
    sprBuf.set([W / 2 + o.sd / o.f * focal, bottom - hpx, hpx, hpx * o.asp], i * 4);
    sprABuf.set([o.f, o.kind, o.light, o.seed], i * 4);
  });
  gl.uniform2f(U.uRes, W, H); gl.uniform2f(U.uPos, cam.x, cam.y);
  gl.uniform1f(U.uAng, cam.a); gl.uniform1f(U.uPlane, planeLen); gl.uniform1f(U.uHz, hz); gl.uniform1f(U.uTime, time);
  const doorY = START_Y - doorDist();
  const swing = walkStart === null ? 0 : SWING * ease(clamp((time - walkStart) / SWING_TIME, 0, 1));
  gl.uniform4f(U.uDoor, doorY, swing, cam.a === -Math.PI / 2 && cam.y > doorY - .6 ? 1 : 0, 0);
  gl.uniform3fv(U.uTorch, torchBuf); gl.uniform4fv(U.uSpr, sprBuf); gl.uniform4fv(U.uSprA, sprABuf);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/* ============================================================ the walk-in */
let walkStart = null, arrived = false, dirty = true;
function pose(t) {                                 // t in seconds since the door began to open
  const wp = { x: 5.5, y: 3.0 };                   // where you turn
  const stop = portrait() ? { x: 2.95, y: 3.0 } : { x: 3.3, y: 3.2 };
  const aim = Math.atan2(wizard.y - stop.y, wizard.x - stop.x) + (portrait() ? 0 : .34); // look a little right of him: he sits on the left
  const aimL = aim > 0 ? aim - 2 * Math.PI : aim;  // keep turning left from -90deg
  const hzEnd = portrait() ? .34 : .5;
  const T1 = 1.35, T2 = 4.75, T3 = 6.05, T4 = 7.75;   // wait for the door to swing open, then walk
  let moving = 0, done = false;
  if (t < T1) { cam.x = 5.5; cam.y = START_Y; cam.a = -Math.PI / 2; }
  else if (t < T2) { const k = ease((t - T1) / (T2 - T1)); cam.x = wp.x; cam.y = lerp(START_Y, wp.y, k); cam.a = -Math.PI / 2; moving = 1; }
  else if (t < T3) { const k = ease((t - T2) / (T3 - T2)); cam.x = wp.x; cam.y = wp.y; cam.a = lerp(-Math.PI / 2, -Math.PI, k); }
  else if (t < T4) { const k = ease((t - T3) / (T4 - T3)); cam.x = lerp(wp.x, stop.x, k); cam.y = lerp(wp.y, stop.y, k); cam.a = lerp(-Math.PI, aimL, k); cam.horizon = lerp(.5, hzEnd, k); moving = 1; }
  else { cam.x = stop.x; cam.y = stop.y; cam.a = aimL; cam.horizon = hzEnd; done = true; }   // and then it holds perfectly still
  cam.bob = 0;                                     // no head-bob: the walk is a smooth glide
  return done;
}
function loop(ms) {
  const time = ms / 1000;
  if (walkStart !== null && !arrived) {
    if (pose(time - walkStart)) { arrived = true; openScroll(); }
    render(time);
  } else if (dirty) {                                // nothing animates by itself, so a still view needs no redraw
    if (arrived) pose(1e3);
    render(time); dirty = false;
  }
  requestAnimationFrame(loop);
}

/* ============================================================ the papyrus sheet, painted at screen resolution */
function paintPapyrus() {
  const el = $("#scroll"), c = el.querySelector("canvas"), k = dpr();
  const W = Math.max(16, Math.round(el.offsetWidth * k)), H = Math.max(16, Math.round(el.offsetHeight * k));
  c.width = W; c.height = H;
  const g = c.getContext("2d"), r = rng(41), u = k;            // u: one CSS pixel

  // a torn, uneven outline: a slow wander plus fine raggedness
  const edge = [];
  const side = (x0, y0, x1, y1, nx, ny) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(8, Math.round(len / (5 * u)));
    let slow = 6 * u, target = 6 * u;
    for (let i = 0; i < n; i++) {
      if (i % 9 === 0) target = (3 + r() * 9) * u;
      slow += (target - slow) * .25;
      const d = slow + (r() - .5) * 2.4 * u + (r() > .93 ? r() * 5 * u : 0), t = i / n;
      edge.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d]);
    }
  };
  side(0, 0, W, 0, 0, 1); side(W, 0, W, H, -1, 0); side(W, H, 0, H, 0, -1); side(0, H, 0, 0, 1, 0);
  const outline = () => { g.beginPath(); edge.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };

  g.save(); outline(); g.clip();
  const base = g.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, "#dcc189"); base.addColorStop(.5, "#d3b577"); base.addColorStop(1, "#c9a868");
  g.fillStyle = base; g.fillRect(0, 0, W, H);

  // papyrus is two layers of reed strips laid crosswise: broad horizontal bands over vertical ones
  for (let y = 0; y < H;) { const h = (5 + r() * 12) * u; g.fillStyle = r() > .5 ? `rgba(255,236,190,${.03 + r() * .1})` : `rgba(120,82,34,${.03 + r() * .1})`; g.fillRect(0, y, W, h); y += h; }
  for (let x = 0; x < W;) { const w = (6 + r() * 14) * u; g.fillStyle = r() > .5 ? `rgba(255,236,190,${.02 + r() * .07})` : `rgba(120,82,34,${.02 + r() * .08})`; g.fillRect(x, 0, w, H); x += w; }

  // individual fibres
  const fibres = (count, horizontal) => {
    for (let i = 0; i < count; i++) {
      const len = (20 + r() * 160) * u, x = r() * W, y = r() * H, wob = (r() - .5) * 3 * u, dark = r() > .3;
      g.strokeStyle = dark ? `rgba(104,68,26,${.05 + r() * .2})` : `rgba(255,243,208,${.05 + r() * .16})`;
      g.lineWidth = (.4 + r() * 1.1) * u;
      g.beginPath();
      if (horizontal) { g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y + wob, x + len, y + (r() - .5) * u); }
      else { g.moveTo(x, y); g.quadraticCurveTo(x + wob, y + len / 2, x + (r() - .5) * u, y + len); }
      g.stroke();
    }
  };
  const area = W * H / (u * u);
  fibres(Math.round(area / 110), true); fibres(Math.round(area / 190), false);

  // flecks, and a few stains
  for (let i = 0; i < area / 60; i++) { g.fillStyle = `rgba(84,52,18,${.05 + r() * .22})`; g.fillRect(r() * W, r() * H, (.5 + r() * 1.6) * u, (.5 + r() * 1.2) * u); }
  for (let i = 0; i < 7; i++) {
    const x = r() * W, y = r() * H, rad = (30 + r() * 110) * u, s = g.createRadialGradient(x, y, rad * .1, x, y, rad);
    s.addColorStop(0, `rgba(116,74,26,${.05 + r() * .09})`); s.addColorStop(.7, "rgba(116,74,26,.03)"); s.addColorStop(1, "rgba(116,74,26,0)");
    g.fillStyle = s; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // the sheet darkens and browns toward its edges
  g.lineJoin = "round";
  for (const [w, a] of [[46, .05], [28, .08], [14, .12], [5, .22]]) { outline(); g.lineWidth = w * u; g.strokeStyle = `rgba(92,56,20,${a})`; g.stroke(); }
  g.restore();
  // a hairline of darker fibre right at the tear
  outline(); g.lineWidth = u; g.strokeStyle = "rgba(70,42,14,.55)"; g.stroke();
}
const LINES = {
  0: "Lorem ipsum dolor sit amet, traveller. Consectetur adipiscing elit, sed do eiusmod tempor?",
  1: "Lorem ipsum dolor sit amet. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
  2: "Consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa.",
  3: "Sed do eiusmod tempor incididunt. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
  4: "Ut labore et dolore magna aliqua. Nisi ut aliquip ex ea commodo consequat, mi viator."
};
let typing = 0;
function say(n) {
  const el = $("#say"), text = LINES[n], id = ++typing; let i = 0;
  if (reducedMotion) { el.textContent = text; return; }
  el.textContent = "";
  (function tick() { if (id !== typing) return; el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(tick, 22); })();
}
function openScroll() {
  $("#skip").classList.remove("on");
  paintPapyrus();
  $("#scroll").classList.add("show");
  say(0);
}
$("#opts").addEventListener("click", e => { const b = e.target.closest("button"); if (b) say(+b.dataset.n); });
addEventListener("keydown", e => { if (arrived && e.key >= "1" && e.key <= "4") say(+e.key); });

/* ============================================================ wiring */
function enter() {
  const ring = $("#ring");
  if (walkStart !== null || ring.classList.contains("knock")) return;
  ring.classList.add("knock");
  setTimeout(() => {
    showRingOnDoor();                                // the painted ring takes over from the button...
    $("#door").remove();                             // ...as the button and hint go; the door itself is in the scene
    walkStart = performance.now() / 1000 - (reducedMotion ? 99 : 0);
    if (!reducedMotion) $("#skip").classList.add("on");
  }, 520);
}
$("#ring").addEventListener("click", enter);
$("#skip").addEventListener("click", () => { if (walkStart !== null) walkStart -= 99; });

let resizeT;
addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { sizeView(); if ($("#door")) buildDoor(); if (arrived) paintPapyrus(); }, 120); });

sizeView();
initGL();
buildDoor();
if (!U) {                                            // no WebGL2: show the door as a picture and skip the walk
  $("#door").style.background = `#2a1a0d url(${doorCanvas.toDataURL("image/jpeg", .85)}) center / cover`;
  $("#ring").addEventListener("click", () => { $("#door").remove(); arrived = true; openScroll(); });
}
requestAnimationFrame(loop);
if (location.hash === "#enter") setTimeout(enter, 300);   // a link ending in #enter knocks for you
