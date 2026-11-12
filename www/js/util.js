// Yardimci fonksiyonlar
'use strict';

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
// kare-hizindan bagimsiz yumusak takip
function damp(a, b, hiz, dt) { return lerp(a, b, 1 - Math.exp(-hiz * dt)); }
function sign(v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); }

// Tohumlu rastgele (her acilista ayni dunya)
function rngYap(tohum) {
  let s = tohum >>> 0;
  const r = function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.ar = function (a, b) { return a + (b - a) * r(); };
  r.tam = function (a, b) { return Math.floor(a + (b - a + 1) * r()); };
  r.sec = function (d) { return d[Math.floor(r() * d.length)]; };
  return r;
}

function tuvalYap(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// Kucult-buyut ile bulaniklastirma (ctx.filter her cihazda yok)
function bulanik(kaynak, guc) {
  const k = Math.max(2, guc);
  const kw = Math.max(2, Math.round(kaynak.width / k));
  const kh = Math.max(2, Math.round(kaynak.height / k));
  const a = tuvalYap(kw, kh);
  const ax = a.getContext('2d');
  ax.imageSmoothingEnabled = true;
  ax.imageSmoothingQuality = 'high';
  ax.drawImage(kaynak, 0, 0, kw, kh);
  const b = tuvalYap(kaynak.width, kaynak.height);
  const bx = b.getContext('2d');
  bx.imageSmoothingEnabled = true;
  bx.imageSmoothingQuality = 'high';
  bx.drawImage(a, 0, 0, b.width, b.height);
  b.kokX = kaynak.kokX; b.ustten = kaynak.ustten;
  return b;
}

// Iki kemikli ters kinematik: kok K, hedef H, uzunluklar a,b. yon: +1/-1 dirsek/diz tarafi
function ikCoz(kx, ky, hx, hy, a, b, yon) {
  let dx = hx - kx, dy = hy - ky;
  let d = Math.sqrt(dx * dx + dy * dy);
  const maxD = a + b - 0.5;
  const minD = Math.abs(a - b) + 0.5;
  if (d < 0.0001) { d = 0.0001; dx = 0; dy = d; }
  let dd = clamp(d, minD, maxD);
  const ux = dx / d, uy = dy / d;
  const cosA = clamp((a * a + dd * dd - b * b) / (2 * a * dd), -1, 1);
  const A = Math.acos(cosA) * yon;
  const c = Math.cos(A), s = Math.sin(A);
  const jx = kx + (ux * c - uy * s) * a;
  const jy = ky + (ux * s + uy * c) * a;
  // hedefe ulasilamiyorsa uc nokta kisalir
  const ex = kx + ux * dd, ey = ky + uy * dd;
  return { jx: jx, jy: jy, ex: ex, ey: ey };
}
