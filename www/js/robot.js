// Parcali robot: fizik + ayaklarin zemine bastigi yurume (ters kinematik)
'use strict';

const PS = 2; // parca cizim olcegi (keskinlik icin 2x)

// ---- parca gorselleri (kodla) ----
const RobotSanat = {
  _zirh(x, y0, y1) {
    const g = x.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#c3ccd1'); g.addColorStop(0.2, '#929da4'); g.addColorStop(0.6, '#59636a'); g.addColorStop(1, '#262c31');
    return g;
  },
  _mek(x, y0, y1) {
    const g = x.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#4b545a'); g.addColorStop(0.5, '#2a3035'); g.addColorStop(1, '#101316');
    return g;
  },
  _yipranma(x, r, w, h, adet) {
    x.save(); x.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < adet; i++) {
      x.strokeStyle = r() < 0.5 ? 'rgba(20,22,24,0.45)' : 'rgba(215,225,230,0.28)';
      x.lineWidth = r.ar(0.3, 0.9);
      const px = r() * w, py = r() * h, ac = r.ar(-0.5, 0.5);
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(ac) * r.ar(2, 9), py + Math.sin(ac) * r.ar(2, 9)); x.stroke();
    }
    for (let i = 0; i < adet / 3; i++) {
      x.fillStyle = r() < 0.6 ? 'rgba(88,52,30,0.30)' : 'rgba(14,16,18,0.35)';
      x.beginPath(); x.ellipse(r() * w, r() * h, r.ar(0.8, 3.2), r.ar(0.6, 2), r() * 3, 0, 6.283); x.fill();
    }
    x.globalAlpha = 0.22; x.globalCompositeOperation = 'source-atop';
    x.drawImage(Sanat.s.gren, 0, 0);
    x.restore();
  },
  _bitir(c, ox, oy) { c.ox = ox * PS; c.oy = oy * PS; return c; },

  // A ekleminden B eklemine uzanan uzuv. on taraf = -y
  uzuv(r, uz, r0, r1, plaka, el) {
    const ek = el ? 13 : 0;
    const rm = Math.max(r0, r1) + 3;
    const w = uz + r0 + r1 + 6 + ek, h = rm * 2;
    const c = tuvalYap(w * PS, h * PS), x = c.getContext('2d');
    const ox = r0 + 3, oy = rm;
    x.scale(PS, PS); x.translate(ox, oy);
    // ic mekanik govde
    const p = new Path2D();
    p.moveTo(0, -r0 * 0.78); p.lineTo(uz, -r1 * 0.78);
    p.arc(uz, 0, r1 * 0.78, -1.5708, 1.5708);
    p.lineTo(0, r0 * 0.78); p.arc(0, 0, r0 * 0.78, 1.5708, 4.7124); p.closePath();
    x.fillStyle = this._mek(x, -r0, r0); x.fill(p);
    // piston / kablo
    x.strokeStyle = '#6d7980'; x.lineWidth = 1.1;
    x.beginPath(); x.moveTo(r0 * 0.4, r0 * 0.45); x.lineTo(uz - r1 * 0.3, r1 * 0.5); x.stroke();
    // zirh plakasi (onde)
    if (plaka) {
      const a = uz * 0.14, b = uz * 0.9;
      const z = new Path2D();
      z.moveTo(a, -r0 * 1.02); z.lineTo(b, -r1 * 1.02); z.quadraticCurveTo(b + r1 * 0.6, -r1 * 0.2, b - 1, r1 * 0.34);
      z.lineTo(a + 3, r0 * 0.3); z.quadraticCurveTo(a - r0 * 0.5, -r0 * 0.3, a, -r0 * 1.02); z.closePath();
      x.fillStyle = this._zirh(x, -r0 * 1.05, r0 * 0.6); x.fill(z);
      x.strokeStyle = 'rgba(12,14,16,0.7)'; x.lineWidth = 0.7; x.stroke(z);
      x.strokeStyle = 'rgba(10,12,14,0.55)'; x.lineWidth = 0.6;
      x.beginPath(); x.moveTo(uz * 0.52, -r0); x.lineTo(uz * 0.56, r0 * 0.3); x.stroke();
      x.fillStyle = 'rgba(235,242,246,0.5)'; x.fillRect(a + 2, -r0 * 0.98, (b - a) * 0.8, 0.8);
    }
    // el
    if (el) {
      x.fillStyle = this._mek(x, -r1, r1);
      x.beginPath(); x.moveTo(uz, -r1 * 0.8); x.lineTo(uz + 7, -r1 * 0.9); x.lineTo(uz + 13, -r1 * 0.2);
      x.lineTo(uz + 12, r1 * 0.5); x.lineTo(uz + 6, r1 * 0.3); x.lineTo(uz + 7, r1 * 0.95); x.lineTo(uz, r1 * 0.8); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(160,175,182,0.5)'; x.lineWidth = 0.6;
      x.beginPath(); x.moveTo(uz + 2, -r1 * 0.85); x.lineTo(uz + 7, -r1 * 0.9); x.lineTo(uz + 13, -r1 * 0.2); x.stroke();
    }
    // eklem diski
    x.fillStyle = '#15191c'; x.beginPath(); x.arc(0, 0, r0 * 0.72, 0, 6.283); x.fill();
    x.strokeStyle = '#7b8890'; x.lineWidth = 0.9; x.beginPath(); x.arc(0, 0, r0 * 0.72, 3.4, 5.6); x.stroke();
    x.fillStyle = '#525d64'; x.beginPath(); x.arc(0, 0, r0 * 0.26, 0, 6.283); x.fill();
    x.setTransform(1, 0, 0, 1, 0, 0);
    this._yipranma(x, r, c.width, c.height, 26);
    return this._bitir(c, ox, oy);
  },

  // A = ayak bilegi, +x burun yonu, taban = +y
  ayak(r) {
    const w = 38, h = 24, ox = 12, oy = 9;
    const c = tuvalYap(w * PS, h * PS), x = c.getContext('2d');
    x.scale(PS, PS); x.translate(ox, oy);
    const p = new Path2D();
    p.moveTo(-9, 9); p.lineTo(-10, 3); p.lineTo(-5, -6); p.lineTo(5, -7); p.lineTo(12, -1);
    p.lineTo(21, 3.5); p.quadraticCurveTo(24.5, 6, 23, 9); p.closePath();
    x.fillStyle = this._zirh(x, -8, 12); x.fill(p);
    x.strokeStyle = 'rgba(12,14,16,0.7)'; x.lineWidth = 0.7; x.stroke(p);
    x.fillStyle = '#0d0f11'; x.fillRect(-9.5, 6.4, 33, 2.6);
    x.strokeStyle = 'rgba(10,12,14,0.6)'; x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(9, -3); x.lineTo(8, 6.4); x.stroke();
    x.fillStyle = '#15191c'; x.beginPath(); x.arc(0, 0, 4.6, 0, 6.283); x.fill();
    x.fillStyle = '#525d64'; x.beginPath(); x.arc(0, 0, 1.6, 0, 6.283); x.fill();
    x.setTransform(1, 0, 0, 1, 0, 0);
    this._yipranma(x, r, c.width, c.height, 14);
    // camur
    x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, c.height * 0.45, 0, c.height);
    g.addColorStop(0, 'rgba(52,42,32,0)'); g.addColorStop(1, 'rgba(52,42,32,0.7)');
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    return this._bitir(c, ox, oy);
  },

  // A = kalca, B = boyun (uz). on taraf = +y
  govde(r, uz) {
    const w = uz + 30, h = 54, ox = 14, oy = 26;
    const c = tuvalYap(w * PS, h * PS), x = c.getContext('2d');
    x.scale(PS, PS); x.translate(ox, oy);
    // karin (esnek, koyu)
    x.fillStyle = this._mek(x, -10, 10);
    x.beginPath(); x.moveTo(4, -8); x.lineTo(26, -9); x.lineTo(26, 10); x.lineTo(4, 9); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(120,135,142,0.35)'; x.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(9 + i * 4.4, -8.5); x.lineTo(9 + i * 4.4, 9.5); x.stroke(); }
    // lege
    const le = new Path2D();
    le.moveTo(-9, -9); le.lineTo(7, -11); le.lineTo(9, 11); le.lineTo(-6, 12); le.quadraticCurveTo(-12, 2, -9, -9); le.closePath();
    const gl = x.createLinearGradient(-10, 0, 10, 0);
    gl.addColorStop(0, '#3b444a'); gl.addColorStop(1, '#8b969d');
    x.fillStyle = gl; x.fill(le);
    x.strokeStyle = 'rgba(12,14,16,0.7)'; x.lineWidth = 0.7; x.stroke(le);
    // sirt unitesi
    x.fillStyle = this._mek(x, -22, -10);
    x.beginPath(); x.moveTo(24, -12); x.lineTo(46, -13); x.lineTo(44, -21); x.lineTo(27, -20); x.closePath(); x.fill();
    x.fillStyle = 'rgba(150,170,180,0.4)'; x.fillRect(28, -20.6, 15, 0.8);
    // gogus zirhi
    const g = new Path2D();
    g.moveTo(21, -12); g.lineTo(48, -13); g.quadraticCurveTo(54, -6, 52, 4);
    g.quadraticCurveTo(47, 15, 39, 16.5); g.lineTo(24, 11.5); g.quadraticCurveTo(19, 0, 21, -12); g.closePath();
    const gg = x.createLinearGradient(20, 0, 54, 0);
    gg.addColorStop(0, '#4d575e'); gg.addColorStop(0.55, '#8d989f'); gg.addColorStop(1, '#d3dce1');
    x.fillStyle = gg; x.fill(g);
    x.save(); x.clip(g);
    const gk = x.createLinearGradient(0, -14, 0, 18);
    gk.addColorStop(0, 'rgba(8,10,12,0.55)'); gk.addColorStop(0.45, 'rgba(8,10,12,0)'); gk.addColorStop(1, 'rgba(8,10,12,0.25)');
    x.fillStyle = gk; x.fillRect(10, -20, 60, 40);
    x.restore();
    x.strokeStyle = 'rgba(12,14,16,0.75)'; x.lineWidth = 0.7; x.stroke(g);
    x.beginPath(); x.moveTo(33, -12.5); x.lineTo(34, 14.5); x.stroke();
    // omuz eklemi yuvasi
    x.fillStyle = '#15191c'; x.beginPath(); x.arc(uz - 6, -1, 6.2, 0, 6.283); x.fill();
    // cekirdek yuvasi (isik oyunda eklenir)
    x.fillStyle = '#0b0d0f'; x.beginPath(); x.arc(40, 10.5, 3.2, 0, 6.283); x.fill();
    // boyun
    x.fillStyle = this._mek(x, -4, 4); x.fillRect(uz - 1, -4, 8, 8);
    x.setTransform(1, 0, 0, 1, 0, 0);
    this._yipranma(x, r, c.width, c.height, 50);
    c.cekX = 40; c.cekY = 10.5;
    return this._bitir(c, ox, oy);
  },

  // A = boyun, B = tepe. on taraf = +y
  kafa(r, uz) {
    const w = uz + 22, h = 40, ox = 6, oy = 18;
    const c = tuvalYap(w * PS, h * PS), x = c.getContext('2d');
    x.scale(PS, PS); x.translate(ox, oy);
    // anten
    x.strokeStyle = '#39424a'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(uz - 5, -9); x.lineTo(uz + 11, -13); x.stroke();
    const p = new Path2D();
    p.moveTo(2, -9); p.quadraticCurveTo(4, -14, 14, -14); p.lineTo(uz - 6, -13);
    p.quadraticCurveTo(uz + 2, -10, uz + 1, 0); p.quadraticCurveTo(uz, 12, uz - 9, 14.5);
    p.lineTo(9, 14); p.quadraticCurveTo(1, 11, 3, 4); p.closePath();
    const g = x.createLinearGradient(0, 0, uz, 0);
    g.addColorStop(0, '#444e55'); g.addColorStop(0.6, '#8c979e'); g.addColorStop(1, '#dbe3e8');
    x.fillStyle = g; x.fill(p);
    x.save(); x.clip(p);
    const gk = x.createLinearGradient(0, -15, 0, 15);
    gk.addColorStop(0, 'rgba(8,10,12,0.6)'); gk.addColorStop(0.5, 'rgba(8,10,12,0.05)'); gk.addColorStop(1, 'rgba(8,10,12,0.2)');
    x.fillStyle = gk; x.fillRect(-4, -16, uz + 10, 34);
    x.restore();
    x.strokeStyle = 'rgba(12,14,16,0.75)'; x.lineWidth = 0.7; x.stroke(p);
    // vizor (koyu cam)
    const v = new Path2D();
    v.moveTo(10, 3); v.lineTo(22, 1.5); v.quadraticCurveTo(25.5, 8, 22.5, 14.8); v.lineTo(11, 14.3); v.quadraticCurveTo(8.5, 9, 10, 3); v.closePath();
    x.fillStyle = '#07090b'; x.fill(v);
    x.strokeStyle = 'rgba(160,190,205,0.35)'; x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(20.5, 3.4); x.quadraticCurveTo(23.2, 8, 21.4, 12.6); x.stroke();
    // kulak diski
    x.fillStyle = '#1a1f22'; x.beginPath(); x.arc(14, -3.5, 4.4, 0, 6.283); x.fill();
    x.strokeStyle = '#7b8890'; x.lineWidth = 0.8; x.beginPath(); x.arc(14, -3.5, 4.4, 3.6, 5.8); x.stroke();
    x.setTransform(1, 0, 0, 1, 0, 0);
    this._yipranma(x, r, c.width, c.height, 30);
    c.gozX = 16.5; c.gozY = 11.2;
    return this._bitir(c, ox, oy);
  },

  karart(sp, miktar) {
    const c = tuvalYap(sp.width, sp.height), x = c.getContext('2d');
    x.drawImage(sp, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = 'rgba(5,9,12,' + miktar + ')'; x.fillRect(0, 0, c.width, c.height);
    c.ox = sp.ox; c.oy = sp.oy;
    return c;
  },

  hepsi() {
    const r = rngYap(4242);
    const P = {};
    P.uyluk = this.uzuv(r, CFG.uyluk, 10, 8, true, false);
    P.baldir = this.uzuv(r, CFG.baldir, 8, 6.2, true, false);
    P.ustKol = this.uzuv(r, CFG.ustKol, 7.6, 6.2, true, false);
    P.onKol = this.uzuv(r, CFG.onKol, 6.4, 5.4, true, true);
    P.ayak = this.ayak(r);
    P.govde = this.govde(r, CFG.govde);
    P.kafa = this.kafa(r, CFG.kafa);
    ['uyluk', 'baldir', 'ustKol', 'onKol', 'ayak'].forEach((k) => { P[k + 'A'] = this.karart(P[k], 0.5); });
    return P;
  }
};

function parcaCiz(ctx, sp, ax, ay, aci, f) {
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(aci);
  ctx.scale(1 / PS, f / PS);
  ctx.drawImage(sp, -sp.ox, -sp.oy);
  ctx.restore();
}

function yaklas(v, hedef, adim) {
  if (v < hedef) return Math.min(hedef, v + adim);
  return Math.max(hedef, v - adim);
}

class Robot {
  constructor(zemin) {
    this.z = zemin;
    this.P = RobotSanat.hepsi();
    this.minX = 40; this.maxX = zemin.uz - 60;
    this.sifirla(250);
  }

  sifirla(x) {
    const y = this.z.yuk(x);
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.yerde = true; this.yon = 1;
    this.sonZeminY = y;
    this.coyoteT = 0; this.tampon = 0; this.ziplaBasili = false;
    this.ayak = [
      { x: x + 11, y: this.z.yuk(x + 11), hav: false, t: 0, T: 0.2, sx: 0, sy: 0, tx: 0, ty: 0, kalk: 0, u: 0 },
      { x: x - 11, y: this.z.yuk(x - 11), hav: false, t: 0, T: 0.2, sx: 0, sy: 0, tx: 0, ty: 0, kalk: 0, u: 0 }
    ];
    this.bacak = CFG.uyluk + CFG.baldir;
    this.kalcaY = y - CFG.bilek - this.bacak * 0.87;
    this.egik = 0.06; this.ezme = 0; this.cokme = 0; this.zaman = 0;
    this.salinim = 0; this.havaK = 0;
    this.olu = false; this.kilit = false;
    this.bastiOlay = null; this.indiOlay = 0;
    this.iskelet = null;
    this._iskeletKur();
  }

  guncelle(dt, girdi) {
    const z = this.z;
    this.zaman += dt;
    this.bastiOlay = null; this.indiOlay = 0;
    const gx = this.kilit ? 0 : girdi.x;

    // --- yatay ---
    let hedef = gx * CFG.yuruHiz;
    if (this.yerde && gx !== 0) {
      // yokus yukari biraz yavas, asagi biraz hizli
      const eg = z.egim(this.x, 22);
      hedef *= 1 + clamp(eg * gx, -0.5, 0.4) * 0.45;
    }
    const iv = this.yerde ? (gx !== 0 ? CFG.ivme : CFG.surtunme) : (gx !== 0 ? CFG.havaIvme : CFG.havaIvme * 0.25);
    this.vx = yaklas(this.vx, hedef, iv * dt);
    if (gx !== 0) this.yon = gx > 0 ? 1 : -1;

    let nx = this.x + this.vx * dt;
    const d = sign(this.vx);
    if (d !== 0) {
      const gy = z.yuk(nx + d * 9);
      if (this.yerde) {
        if (this.y - gy > CFG.maxBasamak) { nx = this.x; this.vx = 0; }
      } else if (gy < CUKUR && this.y - gy > 3) { nx = this.x; this.vx = 0; }
    }
    this.x = clamp(nx, this.minX, this.maxX);

    // --- dikey ---
    if (this.yerde) {
      const gy = z.yuk(this.x);
      if (gy - this.y > CFG.maxInis) { this.yerde = false; this.vy = 0; this.coyoteT = CFG.coyote; }
      else { this.y = gy; this.sonZeminY = gy; }
    }
    // ziplama (tampon + coyote)
    if (girdi.zipla && !this.ziplaBasili) this.tampon = CFG.ziplaTampon;
    if (!girdi.zipla && this.ziplaBasili && this.vy < 0 && !this.yerde) this.vy *= CFG.ziplaKes;
    this.ziplaBasili = girdi.zipla;
    this.tampon -= dt; this.coyoteT -= dt;
    if (this.tampon > 0 && !this.kilit && (this.yerde || this.coyoteT > 0)) {
      this.vy = -CFG.ziplaHiz; this.yerde = false; this.tampon = 0; this.coyoteT = 0;
    }
    if (!this.yerde) {
      this.vy = Math.min(this.vy + CFG.yercekimi * dt, 1500);
      this.y += this.vy * dt;
      const gy = z.yuk(this.x);
      if (this.vy >= 0 && this.y >= gy) {
        this.indiOlay = this.vy;
        this.ezme = clamp(this.vy * 0.034, 4, 24);
        this.y = gy; this.vy = 0; this.yerde = true; this.sonZeminY = gy;
        for (let i = 0; i < 2; i++) {
          const a = this.ayak[i];
          let ay = z.yuk(a.x);
          if (ay >= CUKUR || Math.abs(ay - gy) > 30) { a.x = this.x + this.yon * (i === 0 ? 10 : -10); ay = z.yuk(a.x); if (ay >= CUKUR) { a.x = this.x; ay = gy; } }
          a.y = ay; a.hav = false;
        }
      }
      if (gy >= CUKUR && this.y > this.sonZeminY + 300) this.olu = true;
    }

    this._ayaklar(dt);
    this._govde(dt);
    this._iskeletKur();
  }

  _ayaklar(dt) {
    const z = this.z, S = CFG.adim, hiz = Math.abs(this.vx);
    const d = hiz > 22 ? sign(this.vx) : 0;
    if (!this.yerde) {
      // havada: yukselirken toplan, duserken uzan
      const k = clamp(this.vy / 420, -1, 1);
      this.havaK = damp(this.havaK, 1, 14, dt);
      const hy = this.y;
      const hedefler = [
        { x: this.x + this.yon * lerp(17, 9, (k + 1) / 2), y: hy - lerp(24, 0, (k + 1) / 2) },
        { x: this.x - this.yon * lerp(15, 7, (k + 1) / 2), y: hy - lerp(9, -3, (k + 1) / 2) }
      ];
      for (let i = 0; i < 2; i++) {
        const a = this.ayak[i];
        a.x = damp(a.x, hedefler[i].x, 20, dt); a.y = damp(a.y, hedefler[i].y, 26, dt);
        a.hav = false; a.u = 0.5;
      }
      return;
    }
    this.havaK = damp(this.havaK, 0, 12, dt);
    for (let i = 0; i < 2; i++) {
      const a = this.ayak[i], b = this.ayak[1 - i];
      const durusX = this.x + this.yon * (i === 0 ? 11 : -11);
      if (a.hav) {
        a.t += dt / a.T;
        const u = Math.min(a.t, 1);
        a.tx = d !== 0 ? this.x + d * (S * 0.5) + this.vx * a.T * (1 - u) : durusX;
        let ty = z.yuk(a.tx);
        if (ty >= CUKUR || ty - this.y > 44) ty = this.y;       // cukur ustu: govde hizasinda kal
        if (this.y - ty > 44) { a.tx = this.x; ty = this.y; }  // duvar: ayagi govde altina al
        a.ty = ty;
        const e = smooth(u);
        const kalk = a.kalk + 0.3 * Math.abs(a.ty - a.sy);
        let fx = lerp(a.sx, a.tx, e);
        let fy = lerp(a.sy, a.ty, e) - Math.sin(Math.PI * u) * kalk;
        const g = z.yuk(fx);
        if (u < 1 && g < CUKUR && fy > g - 2) fy = g - 2;     // basamak kenarina takilma
        a.x = fx; a.y = fy; a.u = u;
        if (u >= 1) {
          a.hav = false; a.x = a.tx; a.y = a.ty; a.u = 0;
          this.bastiOlay = { x: a.x, y: a.y, guc: clamp(hiz / CFG.yuruHiz, 0.2, 1) };
        }
      } else {
        a.u = 0;
        const rel = a.x - this.x;
        let at = false;
        if (d !== 0) { if (rel * d < -S * 0.5 && (!b.hav || (b.u > 0.55 && rel * d < -S * 0.7))) at = true; }
        else if (Math.abs(a.x - durusX) > 14 && !b.hav) at = true;
        if (Math.abs(rel) > S * 1.3 || Math.abs(a.y - this.y) > 74) at = true;
        if (at) {
          a.hav = true; a.t = 0; a.sx = a.x; a.sy = a.y;
          a.T = d !== 0 ? clamp(S / Math.max(hiz, 70) * 0.92, 0.13, 0.34) : 0.22;
          a.kalk = d !== 0 ? 12 : 5;
        }
      }
    }
  }

  _govde(dt) {
    const z = this.z, B = this.bacak;
    const a0 = this.ayak[0], a1 = this.ayak[1];
    // adim ortasinda hafif yukselme
    let bob = 0;
    if (a0.hav) bob = Math.sin(Math.PI * a0.u); else if (a1.hav) bob = Math.sin(Math.PI * a1.u);
    const nefes = Math.sin(this.zaman * 1.9) * 1.1;
    this.ezme = damp(this.ezme, 0, 9, dt);
    let hedef;
    if (this.yerde) {
      const ort = (this._zeminAlt(a0) + this._zeminAlt(a1)) / 2;
      hedef = ort - CFG.bilek - B * 0.87 - bob * 2.6 + nefes + this.ezme + this.cokme * 40;
      this.kalcaY = damp(this.kalcaY, hedef, 17, dt);
    } else {
      hedef = this.y - CFG.bilek - B * 0.84;
      this.kalcaY = damp(this.kalcaY, hedef, 30, dt);
    }
    // bacak boyu siniri: kalca, basan ayaklara yetisecek kadar alcalir
    if (this.yerde) {
      const maxU = B - 1.5;
      for (let i = 0; i < 2; i++) {
        const a = this.ayak[i];
        if (a.hav) continue;
        const dx = a.x - this.x;
        const kok = maxU * maxU - dx * dx;
        const gerek = (a.y - CFG.bilek) - (kok > 0 ? Math.sqrt(kok) : 0);
        if (this.kalcaY < gerek) this.kalcaY = gerek;
      }
    }
    // egilme: hiz + yokus
    let eh = 0.05 + (this.vx * this.yon / CFG.yuruHiz) * 0.11;
    if (this.yerde) {
      const eg = z.egim(this.x, 30);
      eh += clamp(-eg * this.yon, -0.45, 0.6) * 0.5;
    } else eh += clamp(-this.vy / 900, -0.12, 0.16);
    eh += this.cokme * 0.85;
    this.egik = damp(this.egik, eh, 8, dt);
    // kol salinimi: bacaklarin tersine
    const s = this.yerde ? clamp((a0.x - a1.x) / CFG.adim, -1, 1) * this.yon : 0;
    this.salinim = damp(this.salinim, s, 14, dt);
  }

  _zeminAlt(a) {
    if (!a.hav) return a.y;
    return lerp(a.sy, a.ty, smooth(a.u));
  }

  // eklem konumlarini hesapla (cizim ve isiklar icin)
  _iskeletKur() {
    const f = this.yon, z = this.z;
    const hx = this.x - f * 2, hy = this.kalcaY;
    const sx = Math.sin(this.egik) * f, sy = -Math.cos(this.egik);
    const nx = hx + sx * CFG.govde, ny = hy + sy * CFG.govde;          // boyun
    const ox = hx + sx * (CFG.govde - 6) - sy * (-1) * f * 0, oy = hy + sy * (CFG.govde - 6); // omuz
    const kafaEg = this.egik * 0.45 + this.cokme * 0.5;
    const kx = Math.sin(kafaEg) * f, ky = -Math.cos(kafaEg);
    const K = { f: f, hx: hx, hy: hy, nx: nx, ny: ny, sx: sx, sy: sy, kx: kx, ky: ky, bacak: [], kol: [] };
    for (let i = 0; i < 2; i++) {
      const a = this.ayak[i];
      // ayak acisi
      let eg = 0, yunus = 0;
      if (this.yerde && !a.hav) {
        eg = clamp(z.egim(a.x, 9), -0.6, 0.6);
        // geride kalan ayakta topuk kalkar
        const geri = -(a.x - this.x) * sign(this.vx || f);
        if (Math.abs(this.vx) > 30) yunus = clamp((geri - 12) / 26, 0, 1) * 0.42;
      } else if (a.hav) {
        yunus = Math.sin(Math.PI * a.u) * 0.42 - smooth((a.u - 0.6) / 0.4) * 0.3;
        eg = clamp(z.egim(a.tx, 9), -0.6, 0.6) * smooth(a.u);
      } else yunus = 0.35 + clamp(-this.vy / 700, -0.3, 0.25);
      const bilekY = a.y - CFG.bilek - Math.max(0, Math.sin(yunus)) * 17;
      const ik = ikCoz(hx, hy, a.x, bilekY, CFG.uyluk, CFG.baldir, -f);
      const aci = (f > 0 ? eg : Math.PI + eg) + yunus * f;
      K.bacak.push({ dx: ik.jx, dy: ik.jy, bx: ik.ex, by: ik.ey, aci: aci });
      // kollar
      const yonS = i === 0 ? -1 : 1;
      let fi = this.egik * 0.35 + yonS * this.salinim * 0.62;
      fi = lerp(fi, i === 0 ? -0.55 : 0.85, this.havaK * 0.8);
      fi = lerp(fi, 0.25, this.cokme);
      const bukum = 0.28 + 0.4 * clamp(fi + 0.35, 0, 1) + this.havaK * 0.5;
      const ex = ox + Math.sin(fi) * f * CFG.ustKol, ey = oy + Math.cos(fi) * CFG.ustKol;
      const elx = ex + Math.sin(fi + bukum) * f * CFG.onKol, ely = ey + Math.cos(fi + bukum) * CFG.onKol;
      K.kol.push({ ox: ox, oy: oy, ex: ex, ey: ey, hx: elx, hy: ely });
    }
    // goz ve cekirdek isigi konumlari
    const g = this.P.kafa, gv = this.P.govde;
    K.gozX = nx + kx * g.gozX + (-ky) * f * g.gozY;
    K.gozY = ny + ky * g.gozX + (kx) * f * g.gozY;
    K.cekX = hx + sx * gv.cekX + (-sy) * f * gv.cekY;
    K.cekY = hy + sy * gv.cekX + (sx) * f * gv.cekY;
    this.iskelet = K;
  }

  ciz(ctx) {
    const K = this.iskelet, P = this.P, f = K.f;
    const at2 = Math.atan2;
    const bacak = (i, arka) => {
      const b = K.bacak[i];
      parcaCiz(ctx, arka ? P.uylukA : P.uyluk, K.hx, K.hy, at2(b.dy - K.hy, b.dx - K.hx), f);
      parcaCiz(ctx, arka ? P.ayakA : P.ayak, b.bx, b.by, b.aci, f);
      parcaCiz(ctx, arka ? P.baldirA : P.baldir, b.dx, b.dy, at2(b.by - b.dy, b.bx - b.dx), f);
    };
    const kol = (i, arka) => {
      const k = K.kol[i];
      parcaCiz(ctx, arka ? P.ustKolA : P.ustKol, k.ox, k.oy, at2(k.ey - k.oy, k.ex - k.ox), f);
      parcaCiz(ctx, arka ? P.onKolA : P.onKol, k.ex, k.ey, at2(k.hy - k.ey, k.hx - k.ex), f);
    };
    kol(1, true);
    bacak(1, true);
    parcaCiz(ctx, P.govde, K.hx, K.hy, at2(K.sy, K.sx), f);
    parcaCiz(ctx, P.kafa, K.nx, K.ny, at2(K.ky, K.kx), f);
    bacak(0, false);
    kol(0, false);
  }
}
