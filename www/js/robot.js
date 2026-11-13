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
    this.merdivenler = [];   // dik merdivenler (oyun atar)
    this.alcaklar = [];      // alcak gecitler: h >= 100 egilerek, h < 100 surunerek gecilir
    this.duvarlar = [];      // gecici duvarlar: [x0, x1, x0, x1, ...]
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
    this.el = [{ x: x, y: y - 120 }, { x: x, y: y - 110 }];   // tirmanirken / surunurken el konumlari
    this.elHedef = [null, null];    // disaridan verilen el hedefi (bitis sahnesi): {x, y}
    this.bacak = CFG.uyluk + CFG.baldir;
    this.kalcaY = y - CFG.bilek - this.bacak * 0.87;
    this.egik = 0.06; this.ezme = 0; this.cokme = 0; this.zaman = 0;
    this.salinim = 0; this.havaK = 0;
    this.egilK = 0;                 // 0 ayakta, 1 egik
    this.surunK = 0;                // 0..1 surunme (dort ayak)
    this.egilAcik = false;          // bas-cek egilme durumu
    this.egilT = 0; this.egilOnce = false; this.egilYut = false;
    this.itK = 0; this.itiyor = false;                       // sandik itme
    this.merd = null;               // tutunulan dik merdiven
    this.kayX = 0; this.tirmanBekle = 0; this.birakT = 0;
    this.etk = null; this.uzanK = 0; this.etkOlay = false;   // etkilesim (el uzatma)
    this.otoX = null;               // kendiliginden yurunecek hedef
    this.olu = false; this.kilit = false;
    this.bastiOlay = null; this.indiOlay = 0;
    this.duvarlar.length = 0;
    this.iskelet = null;
    this._iskeletKur();
  }

  // govdenin yerden yuksekligi (lazer, pres icin)
  boyAl() { return lerp(lerp(CFG.boyAyakta, CFG.boyEgik, this.egilK), CFG.boySurun, this.surunK); }

  // hareketli platform / asansor uzerinde tasinma
  tasi(dx, dy) {
    dy = dy || 0;
    this.x += dx; this.y += dy; this.sonZeminY += dy; this.kalcaY += dy;
    for (let i = 0; i < 2; i++) {
      const a = this.ayak[i]; a.x += dx; a.sx += dx; a.tx += dx; a.y += dy; a.sy += dy; a.ty += dy;
      this.el[i].x += dx; this.el[i].y += dy;
    }
  }

  // etkilesim baslat: robot yerine gecer, doner ve elini tam (tx, ty) noktasina goturur
  etkBasla(tx, ty, egil) {
    if (this.etk || this.merd || !this.yerde) return false;
    this.etk = { tx: tx, ty: ty, egil: egil, faz: 0, t: 0, s: sign(tx - this.x) || this.yon, sinir: 1.2 + Math.abs(tx - this.x) / 90 };
    return true;
  }

  guncelle(dt, girdi) {
    const z = this.z;
    this.zaman += dt;
    this.bastiOlay = null; this.indiOlay = 0; this.etkOlay = false;
    this.tirmanBekle -= dt;
    this.kayX = damp(this.kayX, 0, 11, dt);
    this.itK = damp(this.itK, this.itiyor ? 1 : 0, 12, dt); this.itiyor = false;
    if (this.merd) { this._tirman(dt, girdi); this._iskeletKur(); return; }

    let gx = this.kilit ? 0 : girdi.x;
    let zipla = girdi.zipla, eg = !this.kilit && girdi.egil;
    if (this.otoX !== null) { const fo = this.otoX - this.x; gx = Math.abs(fo) > 6 ? sign(fo) * 0.7 : 0; }

    // --- etkilesim: yerine gec, don, elini hedefe uzat, geri cek ---
    const E = this.etk;
    if (E) {
      gx = 0; zipla = false; eg = false;
      if (!this.yerde) { this.etk = null; this.uzanK = 0; }
      else if (E.faz === 0) {
        const fe = E.tx - E.s * (E.egil ? 46 : 30) - this.x;
        E.t += dt;
        if (Math.abs(fe) > 4 && E.t < E.sinir) gx = sign(fe) * (Math.abs(fe) > 70 ? 1 : 0.6); else { E.faz = 1; E.t = 0; }
      } else {
        this.yon = E.s; E.t += dt;
        if (E.faz === 1) { this.uzanK = smooth(E.t / 0.3); if (E.t >= 0.3) { E.faz = 2; E.t = 0; this.etkOlay = true; } }
        else if (E.faz === 2) { this.uzanK = 1; if (E.t > 0.24) { E.faz = 3; E.t = 0; } }
        else { this.uzanK = 1 - smooth(E.t / 0.26); if (E.t >= 0.26) { this.uzanK = 0; this.etk = null; } }
      }
    } else this.uzanK = 0;

    // --- dik merdivene tutunma: altta yukari tusu, ustte asagi tusu ---
    if (!E && this.yerde && !this.kilit && this.tirmanBekle <= 0) {
      for (const L of this.merdivenler) {
        const ara = (L.duvarX - this.x) * L.yon;
        if (zipla && ara > 0 && ara < 96 && Math.abs(this.y - L.yAlt) < 10) { this._tutun(L, L.yAlt); break; }
        if (eg && Math.abs(this.x - L.ux) < 32 && Math.abs(this.y - L.yUst) < 10) { this._tutun(L, L.yUst); break; }
      }
      if (this.merd) { this._tirman(dt, girdi); this._iskeletKur(); return; }
    }

    // --- egilme tusu: kisa bas = egil / kalk (bas-cek), basili tut = surun ---
    if (this.egilYut) { if (!girdi.egil) this.egilYut = false; eg = false; }
    if (eg && !this.egilOnce) this.egilT = 0;
    if (eg) this.egilT += dt;
    else if (this.egilOnce) this.egilAcik = this.egilT < CFG.surunBekle ? !this.egilAcik : true;
    this.egilOnce = eg;
    let alcakta = false, darda = false;
    for (const a of this.alcaklar) {
      if (!a.kot && this.x > a.x0 - 16 && this.x < a.x1 + 16) { if (a.h < 100) darda = true; else alcakta = true; }
    }
    const surunIst = this.yerde && (darda || (eg && this.egilT >= CFG.surunBekle));
    const egilIst = this.yerde && (surunIst || alcakta || this.egilAcik || eg || (E && E.egil));
    this.egilK = damp(this.egilK, egilIst ? 1 : 0, 13, dt);
    this.surunK = damp(this.surunK, surunIst ? 1 : 0, 9, dt);

    // --- yatay ---
    let hedef = gx * CFG.yuruHiz * lerp(lerp(1, CFG.egilHiz, this.egilK), CFG.surunHiz, this.surunK);
    if (this.yerde && gx !== 0) {
      // yokus yukari biraz yavas, asagi biraz hizli
      const egm = z.egim(this.x, 22);
      hedef *= 1 + clamp(egm * sign(gx), -0.5, 0.4) * 0.45;
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
    // alcak gecit: yeterince egilmeden / surunmeden girilmez
    for (const a of this.alcaklar) {
      if (a.kot || (this.yerde && (a.h < 100 ? this.surunK > 0.7 : this.egilK > 0.7))) continue;
      const s0 = a.x0 - 18, s1 = a.x1 + 18;
      if (this.x <= s0 && nx > s0) { nx = s0; this.vx = 0; }
      else if (this.x >= s1 && nx < s1) { nx = s1; this.vx = 0; }
    }
    // gecici duvarlar (inmis pres, lazer bariyeri)
    for (let i = 0; i < this.duvarlar.length; i += 2) {
      const d0 = this.duvarlar[i], d1 = this.duvarlar[i + 1];
      if (this.x <= d0 && nx > d0) { nx = d0; this.vx = 0; }
      else if (this.x >= d1 && nx < d1) { nx = d1; this.vx = 0; }
    }
    this.x = clamp(nx, this.minX, this.maxX);

    // --- dikey ---
    if (this.yerde) {
      const gy = z.yuk(this.x);
      if (gy - this.y > CFG.maxInis) {
        // kenarda dik merdiven varsa dusmek yerine ona tutun
        let L = null;
        if (!this.kilit && !E) {
          for (const m of this.merdivenler) {
            if (Math.abs(this.x - m.duvarX) < 16 && Math.abs(this.y - m.yUst) < 8 && sign(this.x - m.duvarX) === -m.yon) L = m;
          }
        }
        if (L) { this._tutun(L, L.yUst); this._iskeletKur(); return; }
        this.yerde = false; this.vy = 0; this.coyoteT = CFG.coyote;
      } else { this.y = gy; this.sonZeminY = gy; }
    }
    // ziplama (tampon + coyote)
    if (zipla && !this.ziplaBasili) { if (this.egilK > 0.4) this.egilAcik = false; else this.tampon = CFG.ziplaTampon; }   // egikken: once ayaga kalk
    if (!zipla && this.ziplaBasili && this.vy < 0 && !this.yerde) this.vy *= CFG.ziplaKes;
    this.ziplaBasili = zipla;
    this.tampon -= dt; this.coyoteT -= dt;
    if (alcakta || darda || E) this.tampon = 0;
    if (this.tampon > 0 && !this.kilit && (this.yerde || this.coyoteT > 0)) {
      this.vy = -CFG.ziplaHiz; this.yerde = false; this.tampon = 0; this.coyoteT = 0;
    }
    if (!this.yerde) {
      this.vy = Math.min(this.vy + CFG.yercekimi * dt, 1500);
      this.y += this.vy * dt;
      const gy = z.yuk(this.x);
      if (this.vy >= 0 && this.y >= gy) {
        this.indiOlay = this.vy;
        if (gy - this.sonZeminY > CFG.dusmeOlum) this.olu = true;     // cok yuksekten dustu
        this.ezme = clamp(this.vy * 0.034, 4, 24);
        this.y = gy; this.vy = 0; this.yerde = true; this.sonZeminY = gy;
        for (let i = 0; i < 2; i++) {
          const a = this.ayak[i];
          let ay = z.yuk(a.x);
          if (ay >= CUKUR || Math.abs(ay - gy) > 30) { a.x = this.x + this.yon * (i === 0 ? 10 : -10); ay = z.yuk(a.x); if (ay >= CUKUR || Math.abs(ay - gy) > 30) { a.x = this.x; ay = gy; } }
          a.y = ay; a.hav = false;
        }
      }
      if (gy >= CUKUR && this.y > this.sonZeminY + 300) this.olu = true;
    }

    if (this.yerde && this.surunK > 0.5) this._surun(dt); else this._ayaklar(dt);
    this._govde(dt);
    this._iskeletKur();
  }

  // ---- dik merdiven ----
  _tutun(L, y) {
    this.merd = L;
    this.kayX += this.x - L.ax;        // govde eski yerinden yumusakca kayar
    this.x = L.ax; this.y = y;
    this.vx = 0; this.vy = 0; this.yerde = false; this.yon = L.yon;
    this.tampon = 0; this.ziplaBasili = true; this.birakT = 0;
    this.egilAcik = false; this.egilOnce = false; this.egilYut = true;
    this.sonZeminY = y;
    for (let i = 0; i < 2; i++) { this.ayak[i].hav = false; this.ayak[i].u = 0; }
  }

  _tirman(dt, girdi) {
    const L = this.merd, z = this.z, B = this.bacak, R = CFG.basamakAra;
    let v = 0;
    if (!this.kilit) { if (girdi.zipla) v -= 1; if (girdi.egil) v += 1; }
    this.ziplaBasili = girdi.zipla; this.tampon = 0;
    this.egilK = damp(this.egilK, 0, 13, dt);
    this.surunK = damp(this.surunK, 0, 9, dt);
    this.havaK = damp(this.havaK, 0, 12, dt);
    this.salinim = damp(this.salinim, 0, 14, dt);
    this.egik = damp(this.egik, 0.07, 8, dt);     // govde dik, kollar uzanmis: merdivenden uzak durur
    this.yon = L.yon; this.vx = 0; this.vy = 0;

    // duvardan uzaga basili tutulursa birak
    if (!this.kilit && girdi.x === -L.yon && v === 0) this.birakT += dt; else this.birakT = 0;
    if (this.birakT > 0.18) {
      this.merd = null; this.tirmanBekle = 0.4; this.yerde = false;
      this.vx = -L.yon * 70; this.sonZeminY = this.y;
      return;
    }

    this.y += v * CFG.tirmanHiz * dt;
    this.sonZeminY = this.y;

    if (v < 0 && this.y <= L.yUst) {
      // uste cik: govde kenara kayar, ayaklar adim atarak gelir
      this.y = L.yUst; this.sonZeminY = L.yUst;
      this.kayX += L.ax - L.ux; this.x = L.ux;
      this.merd = null; this.yerde = true; this.tirmanBekle = 0.3;
      for (let i = 0; i < 2; i++) { const a = this.ayak[i]; a.y = L.yUst; a.hav = false; a.u = 0; }
      return;
    }
    if (v > 0 && this.y >= L.yAlt) {
      this.y = L.yAlt; this.sonZeminY = L.yAlt;
      this.merd = null; this.yerde = true; this.tirmanBekle = 0.3;
      for (let i = 0; i < 2; i++) {
        const a = this.ayak[i];
        a.x = this.x + (i === 0 ? 1 : -1) * 11 * this.yon; a.y = z.yuk(a.x); a.hav = false; a.u = 0;
      }
      return;
    }
    this.y = clamp(this.y, L.yUst, L.yAlt);

    // ayaklar ve eller basamaklara sirayla basar/tutar (capraz: sol ayak + sag el)
    const s = L.yAlt - this.y, tavan = L.yAlt - L.yUst;
    const enUst = Math.floor((tavan - 4) / R) * R;      // en ustteki basamak
    const hs = [
      clamp(Math.round((s + 14) / (R * 2)) * R * 2, 0, enUst),
      clamp(Math.round((s - 8) / (R * 2)) * R * 2 + R, 0, enUst)
    ];
    for (let i = 0; i < 2; i++) {
      const a = this.ayak[i];
      a.hav = false; a.u = 0;
      a.x = damp(a.x, L.lx - L.yon * 6, 20, dt);
      a.y = damp(a.y, L.yAlt - hs[i], 20, dt);
      const e = this.el[i];
      e.x = damp(e.x, L.lx - L.yon * 1, 20, dt);
      e.y = damp(e.y, L.yAlt - Math.min(hs[1 - i] + R * 6 - 14, tavan + 40), 20, dt);
    }
    this.kalcaY = damp(this.kalcaY, this.y - CFG.bilek - B * 0.72, 20, dt);
  }

  // ---- surunme: dort ayak, eller ve dizler yerde capraz sirayla ilerler ----
  _surun(dt) {
    const z = this.z, f = this.yon, P = 44;
    const s = this.x * f;
    const q = [Math.round((s - 28) / P) * P, Math.round((s - 50) / P) * P + 22];
    this.havaK = damp(this.havaK, 0, 12, dt);
    for (let i = 0; i < 2; i++) {
      const a = this.ayak[i];
      a.hav = false; a.u = 0;
      const ax = q[i] * f;
      let ay = z.yuk(ax); if (ay >= CUKUR || Math.abs(ay - this.y) > 40) ay = this.y;
      a.x = damp(a.x, ax, 18, dt); a.y = damp(a.y, ay, 18, dt);
      const e = this.el[i];
      const ex = (q[1 - i] + 98) * f;
      let ey = z.yuk(ex); if (ey >= CUKUR || Math.abs(ey - this.y) > 40) ey = this.y;
      e.x = damp(e.x, ex, 18, dt); e.y = damp(e.y, ey - 4, 18, dt);
    }
  }

  _ayaklar(dt) {
    const z = this.z, hiz = Math.abs(this.vx);
    const S = CFG.adim * lerp(1, 0.62, this.egilK);
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
        // merdivende hedef, basamagin ustune tam oturacak sekilde kaydirilir
        a.tx = z.basamakOtur(d !== 0 ? this.x + d * (S * 0.5) + this.vx * a.T * (1 - u) : durusX, this.yon);
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
      hedef = ort - CFG.bilek - B * 0.87 - bob * 2.6 + nefes + this.ezme + this.cokme * 40 + this.egilK * CFG.egilCokme + this.itK * 12;
      // surunurken kalca yere yakin, hafif salinir
      hedef = lerp(hedef, ort - 38 + Math.sin(this.x * 0.143) * 1.6, this.surunK);
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
    // egilme: hiz + yokus + comelme + itme
    let eh = 0.05 + (this.vx * this.yon / CFG.yuruHiz) * 0.11;
    if (this.yerde) {
      const eg = z.egim(this.x, 30);
      eh += clamp(-eg * this.yon, -0.45, 0.6) * 0.5;
    } else eh += clamp(-this.vy / 900, -0.12, 0.16);
    eh += this.cokme * 0.85 + this.egilK * 0.7 + this.itK * 0.4;
    eh = lerp(eh, 1.45, this.surunK);             // surunurken govde yere paralel
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
    const f = this.yon, z = this.z, E = this.etk;
    const surun = this.yerde && !this.merd && this.surunK > 0.5;
    const hx = this.x + this.kayX - f * 2, hy = this.kalcaY;
    const sx = Math.sin(this.egik) * f, sy = -Math.cos(this.egik);
    const nx = hx + sx * CFG.govde, ny = hy + sy * CFG.govde;          // boyun
    const ox = hx + sx * (CFG.govde - 6), oy = hy + sy * (CFG.govde - 6); // omuz
    let kafaEg = this.egik * 0.45 + this.cokme * 0.5 - this.egilK * 0.26 - (this.merd ? 0.2 : 0);
    kafaEg = lerp(kafaEg, 0.72, this.surunK);      // surunurken bas kalkik: yere degil karsiya bakar
    const kx = Math.sin(kafaEg) * f, ky = -Math.cos(kafaEg);
    const K = { f: f, hx: hx, hy: hy, nx: nx, ny: ny, sx: sx, sy: sy, kx: kx, ky: ky, bacak: [], kol: [] };
    for (let i = 0; i < 2; i++) {
      const a = this.ayak[i];
      // ayak acisi: taban, bastigi parcanin egimine yatar (basamakta ve duzde tam duz)
      let eg = 0, yunus = 0;
      if (this.merd) yunus = 0.1;
      else if (surun) yunus = 1.1;                 // parmak ucu yerde, topuk havada
      else if (this.yerde && !a.hav) {
        eg = clamp(z.egimYerel(a.x), -0.6, 0.6);
        // geride kalan ayakta topuk kalkar
        const geri = -(a.x - this.x) * sign(this.vx || f);
        if (Math.abs(this.vx) > 30) yunus = clamp((geri - 12) / 26, 0, 1) * 0.42;
      } else if (a.hav) {
        yunus = Math.sin(Math.PI * a.u) * 0.42 - smooth((a.u - 0.6) / 0.4) * 0.3;
        eg = clamp(z.egimYerel(a.tx), -0.6, 0.6) * smooth(a.u);
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
      fi = lerp(fi, 0.5, this.egilK * 0.55);
      fi = lerp(fi, 1.3 + i * 0.12, this.itK);                 // iterken iki kol one
      const bukum = lerp(0.28 + 0.4 * clamp(fi + 0.35, 0, 1) + this.havaK * 0.5 + this.egilK * 0.5, 0.18, this.itK);
      let ex = ox + Math.sin(fi) * f * CFG.ustKol, ey = oy + Math.cos(fi) * CFG.ustKol;
      let elx = ex + Math.sin(fi + bukum) * f * CFG.onKol, ely = ey + Math.cos(fi + bukum) * CFG.onKol;
      // el belirli bir noktaya gidecekse (basamak, zemin, dugme, fis, parmak) kol ters kinematikle cozulur
      let hdf = null, uc = 0;
      if (this.merd || surun) { hdf = this.el[i]; uc = 6; }
      else if (this.elHedef[i]) { hdf = this.elHedef[i]; uc = 8; }
      else if (i === 0 && E && this.uzanK > 0) { hdf = { x: lerp(elx, E.tx, this.uzanK), y: lerp(ely, E.ty, this.uzanK) }; uc = 10; }
      if (hdf) {
        const kk = ikCoz(ox, oy, hdf.x, hdf.y, CFG.ustKol, CFG.onKol + uc, f);
        ex = kk.jx; ey = kk.jy;
        const ddx = kk.ex - ex, ddy = kk.ey - ey, dl = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        elx = ex + ddx / dl * CFG.onKol; ely = ey + ddy / dl * CFG.onKol;
      }
      if (!this.merd && !surun) { this.el[i].x = elx; this.el[i].y = ely; }   // gecislerde el oldugu yerden baslasin
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
