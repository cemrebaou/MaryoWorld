// Tum gorseller kodla uretilir (assets/ icinde foto varsa onun yerine gecer)
'use strict';

const Sanat = {
  s: {},        // hazir tuvaller
  foto: {},     // assets/ icinden yuklenen fotograflar

  fotoYukle(bitince) {
    const liste = { uzak: 'assets/bg_far.jpg', zemin: 'assets/zemin.jpg' };
    const adlar = Object.keys(liste);
    let kalan = adlar.length;
    const tamam = () => { if (--kalan <= 0) bitince(); };
    adlar.forEach((ad) => {
      const im = new Image();
      im.onload = () => { this.foto[ad] = im; tamam(); };
      im.onerror = tamam;
      im.src = liste[ad];
    });
  },

  hazirla() {
    const r = rngYap(20261112);
    const s = this.s;
    s.gren = this.gurultu(192, r, 1);
    s.sis = this.sisDoku(r);
    s.toprakDoku = this.yeraltiDoku(r);
    s.betonDoku = this.betonDoku(r);
    s.metalDoku = this.metalDoku(r);
    s.lamba = this.lamba(r);
    s.araba = this.araba(r);
    s.kule = this.kule(r);
    s.siper = this.siper(r);
    s.kapi = this.kapi(r);
    s.agaclar = {};
    // arka plan parcalari (3 derinlik)
    s.binaUzak = []; s.binaOrta = []; s.yakinlar = [];
    for (let i = 0; i < 7; i++) s.binaUzak.push(this.bina(r, r.ar(70, 170), r.ar(120, 330), '#1b2a33', '#22343f'));
    for (let i = 0; i < 7; i++) s.binaOrta.push(this.bina(r, r.ar(120, 260), r.ar(140, 380), '#111c23', '#182832'));
    for (let i = 0; i < 4; i++) s.yakinlar.push(this.agacSil(rngYap(100 + i), r.ar(300, 420), '#0a1318', 5));
    s.direk = this.direk('#0a1318');
    s.cit = this.cit('#0a1318');
    // on plan (bulanik siluetler)
    s.on = [
      bulanik(this.agacSil(rngYap(7), 760, '#020406', 13, false, 0.66), 7),
      bulanik(this.onDirek(), 6),
      bulanik(this.onCali(rngYap(9), 420, 150), 5),
      bulanik(this.onCali(rngYap(10), 300, 110), 5),
      bulanik(this.onKablo(rngYap(4)), 6)
    ];
    s.damla = this.damla();
  },

  agacAl(tohum, boy) {
    const k = tohum + '_' + boy;
    if (!this.s.agaclar[k]) this.s.agaclar[k] = this.agacSil(rngYap(tohum), boy, '#161d21', 7, true);
    return this.s.agaclar[k];
  },

  // ---------- dokular ----------
  gurultu(b, r, alfa) {
    const c = tuvalYap(b, b), x = c.getContext('2d');
    const d = x.createImageData(b, b);
    for (let i = 0; i < b * b; i++) {
      const v = (r() * 255) | 0;
      d.data[i * 4] = v; d.data[i * 4 + 1] = v; d.data[i * 4 + 2] = v;
      d.data[i * 4 + 3] = (alfa * 255) | 0;
    }
    x.putImageData(d, 0, 0);
    return c;
  },

  // yatayda dikissiz sis lekeleri
  sisDoku(r) {
    const w = 1024, h = 256;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    for (let i = 0; i < 46; i++) {
      const cx = r() * w, cy = h * (0.25 + r() * 0.6), rad = r.ar(70, 190), a = r.ar(0.05, 0.16);
      for (let k = -1; k <= 1; k++) {
        const g = x.createRadialGradient(cx + k * w, cy, 0, cx + k * w, cy, rad);
        g.addColorStop(0, 'rgba(150,178,190,' + a + ')');
        g.addColorStop(1, 'rgba(150,178,190,0)');
        x.fillStyle = g;
        x.save(); x.translate(cx + k * w, cy); x.scale(1.9, 0.55); x.translate(-(cx + k * w), -cy);
        x.fillRect(cx + k * w - rad, cy - rad, rad * 2, rad * 2);
        x.restore();
      }
    }
    return c;
  },

  _taneler(x, r, w, h, adet, renkler, minB, maxB) {
    for (let i = 0; i < adet; i++) {
      x.fillStyle = r.sec(renkler);
      const px = r() * w, py = r() * h, b = r.ar(minB, maxB);
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        x.beginPath();
        x.ellipse(px + ox * w, py + oy * h, b, b * r.ar(0.5, 0.9), r() * 3, 0, 6.283);
        x.fill();
      }
    }
  },

  yeraltiDoku(r) {
    const w = 320, h = 320;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.fillStyle = '#2a2622'; x.fillRect(0, 0, w, h);
    this._taneler(x, r, w, h, 260, ['#332e29', '#221f1c', '#3a352f', '#1d1b19'], 3, 16);
    this._taneler(x, r, w, h, 40, ['#4a4a48', '#3c3f41', '#55534e', '#2f3234'], 6, 22);   // taslar
    this._taneler(x, r, w, h, 500, ['#15130f', '#40382f', '#4b453d'], 0.6, 2.2);
    x.globalAlpha = 0.22; x.globalCompositeOperation = 'overlay';
    x.drawImage(this.s.gren, 0, 0, w, h);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    return c;
  },

  betonDoku(r) {
    const w = 256, h = 256;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.fillStyle = '#5d6569'; x.fillRect(0, 0, w, h);
    this._taneler(x, r, w, h, 90, ['#565d61', '#646c70', '#4f5559', '#6b7377'], 8, 34);
    this._taneler(x, r, w, h, 300, ['#3d4245', '#7a8286', '#484d50'], 0.5, 1.8);
    // akinti lekeleri
    for (let i = 0; i < 9; i++) {
      const px = r() * w, g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(25,28,30,' + r.ar(0.12, 0.3) + ')');
      g.addColorStop(1, 'rgba(25,28,30,0)');
      x.fillStyle = g; x.fillRect(px, 0, r.ar(3, 14), h * r.ar(0.4, 1));
    }
    // catlaklar
    x.strokeStyle = 'rgba(20,22,24,0.55)'; x.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      let px = r() * w, py = r() * h;
      x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 7; k++) { px += r.ar(-16, 16); py += r.ar(4, 18); x.lineTo(px, py); }
      x.stroke();
    }
    x.globalAlpha = 0.25; x.globalCompositeOperation = 'overlay';
    x.drawImage(this.s.gren, 0, 0, w, h);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    return c;
  },

  // oluklu konteyner sac
  metalDoku(r) {
    const w = 240, h = 61;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.fillStyle = '#4a3d36'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 20) {
      const g = x.createLinearGradient(i, 0, i + 20, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.42)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.10)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.03)');
      g.addColorStop(1, 'rgba(0,0,0,0.42)');
      x.fillStyle = g; x.fillRect(i, 0, 20, h);
    }
    this._taneler(x, r, w, h, 60, ['rgba(110,60,32,0.5)', 'rgba(70,40,25,0.5)', 'rgba(30,24,22,0.5)'], 3, 16);
    x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(0, 0, w, 3); x.fillRect(0, h - 3, w, 3);
    x.fillStyle = 'rgba(190,200,205,0.20)'; x.fillRect(0, 3, w, 1.5);
    x.globalAlpha = 0.3; x.globalCompositeOperation = 'overlay';
    x.drawImage(this.s.gren, 0, 0);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    return c;
  },

  // ---------- oyun duzlemi nesneleri ----------
  lamba(r) {
    const w = 130, h = 260;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    // direk
    const g = x.createLinearGradient(26, 0, 34, 0);
    g.addColorStop(0, '#3d464c'); g.addColorStop(0.4, '#68747b'); g.addColorStop(1, '#22282c');
    x.fillStyle = g; x.fillRect(27, 26, 7, h - 26);
    x.fillStyle = '#2a3035'; x.fillRect(23, h - 26, 15, 26);
    // kol
    x.strokeStyle = '#4b555b'; x.lineWidth = 5; x.lineCap = 'round';
    x.beginPath(); x.moveTo(30, 30); x.quadraticCurveTo(34, 8, 78, 14); x.stroke();
    // armatur
    x.fillStyle = '#2b3237';
    x.beginPath(); x.moveTo(70, 8); x.lineTo(108, 12); x.lineTo(104, 24); x.lineTo(72, 22); x.closePath(); x.fill();
    x.fillStyle = '#cfe6ee'; x.fillRect(77, 21, 24, 3);
    // pas
    x.fillStyle = 'rgba(96,54,30,0.45)';
    for (let i = 0; i < 10; i++) x.fillRect(27 + r() * 5, r.ar(40, h - 30), r.ar(1, 3), r.ar(6, 30));
    c.kokX = 30; c.isikX = 89 - 30; c.isikY = -(h - 24);
    return c;
  },

  araba(r) {
    const w = 270, h = 96;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    const govde = new Path2D();
    govde.moveTo(8, 70); govde.lineTo(10, 50); govde.quadraticCurveTo(40, 40, 70, 38);
    govde.lineTo(98, 14); govde.quadraticCurveTo(140, 6, 182, 14); govde.lineTo(214, 40);
    govde.quadraticCurveTo(250, 44, 262, 56); govde.lineTo(262, 74); govde.lineTo(8, 78); govde.closePath();
    const g = x.createLinearGradient(0, 6, 0, 80);
    g.addColorStop(0, '#5a5f60'); g.addColorStop(0.25, '#4b3f37'); g.addColorStop(1, '#231d1a');
    x.fillStyle = g; x.fill(govde);
    x.save(); x.clip(govde);
    this._taneler(x, r, w, h, 90, ['rgba(92,56,36,0.30)', 'rgba(52,34,26,0.4)', 'rgba(20,18,17,0.38)'], 2, 9);
    x.restore();
    // camlar (bos)
    x.fillStyle = '#0c1114';
    x.beginPath(); x.moveTo(102, 20); x.lineTo(136, 15); x.lineTo(136, 38); x.lineTo(80, 38); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(142, 15); x.lineTo(178, 19); x.lineTo(202, 38); x.lineTo(142, 38); x.closePath(); x.fill();
    // ust kenar isigi
    x.strokeStyle = 'rgba(175,200,212,0.5)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(98, 14); x.quadraticCurveTo(140, 6, 182, 14); x.stroke();
    // tekerler (biri patlak, biri jant)
    x.fillStyle = '#0b0d0e';
    x.beginPath(); x.ellipse(62, 78, 21, 16, 0, 0, 6.283); x.fill();
    x.beginPath(); x.arc(212, 76, 15, 0, 6.283); x.fill();
    x.fillStyle = '#3a3f42';
    x.beginPath(); x.arc(62, 78, 9, 0, 6.283); x.fill();
    x.beginPath(); x.arc(212, 76, 11, 0, 6.283); x.fill();
    c.kokX = w / 2;
    return c;
  },

  kule(r) {
    const w = 120, h = 470;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.strokeStyle = '#2b3338'; x.lineWidth = 4; x.lineCap = 'round';
    const sol = (y) => 60 - (16 + (y / h) * 30), sag = (y) => 60 + (16 + (y / h) * 30);
    x.beginPath(); x.moveTo(sol(50), 50); x.lineTo(sol(h), h); x.moveTo(sag(50), 50); x.lineTo(sag(h), h); x.stroke();
    x.lineWidth = 2;
    for (let y = 50; y < h - 30; y += 52) {
      x.beginPath();
      x.moveTo(sol(y), y); x.lineTo(sag(y + 52), y + 52);
      x.moveTo(sag(y), y); x.lineTo(sol(y + 52), y + 52);
      x.moveTo(sol(y), y); x.lineTo(sag(y), y);
      x.stroke();
    }
    // kabin
    x.fillStyle = '#242b30'; x.fillRect(26, 22, 68, 32);
    x.fillStyle = '#3a454c'; x.fillRect(22, 18, 76, 6);
    x.fillStyle = '#161b1e'; x.fillRect(36, 30, 20, 14);
    // projektor govdesi
    x.fillStyle = '#39434a';
    x.beginPath(); x.arc(60, 12, 11, 0, 6.283); x.fill();
    x.fillStyle = 'rgba(96,54,30,0.4)';
    for (let i = 0; i < 14; i++) x.fillRect(r.ar(20, 100), r.ar(60, h - 20), 2, r.ar(8, 30));
    c.kokX = 60; c.isikX = 0; c.isikY = -(h - 12);
    return c;
  },

  // beton siper (arkasina saklanilir)
  siper(r) {
    const w = 132, h = 124;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    const p = new Path2D();
    p.moveTo(4, h); p.lineTo(10, 26); p.lineTo(24, 12); p.lineTo(52, 15); p.lineTo(66, 6);
    p.lineTo(96, 12); p.lineTo(118, 10); p.lineTo(126, 40); p.lineTo(128, h); p.closePath();
    x.save(); x.clip(p);
    x.fillStyle = x.createPattern(this.s.betonDoku, 'repeat'); x.fillRect(0, 0, w, h);
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.05)'); g.addColorStop(0.75, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const g2 = x.createLinearGradient(0, 0, 0, h);
    g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.5)');
    x.fillStyle = g2; x.fillRect(0, 0, w, h);
    // soluk uyari seridi
    x.globalAlpha = 0.22; x.fillStyle = '#b89a3a';
    for (let i = -h; i < w; i += 34) {
      x.beginPath(); x.moveTo(i, 78); x.lineTo(i + 17, 78); x.lineTo(i + 39, 56); x.lineTo(i + 22, 56); x.closePath(); x.fill();
    }
    x.globalAlpha = 1;
    x.restore();
    x.strokeStyle = 'rgba(185,205,214,0.45)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(10, 26); x.lineTo(24, 12); x.lineTo(52, 15); x.lineTo(66, 6); x.lineTo(96, 12); x.lineTo(118, 10); x.stroke();
    // demirler
    x.strokeStyle = '#3a2a22'; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(58, 10); x.lineTo(54, -6); x.moveTo(70, 7); x.quadraticCurveTo(76, -4, 86, -2); x.stroke();
    c.kokX = w / 2;
    return c;
  },

  kapi(r) {
    const w = 360, h = 300;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.fillStyle = x.createPattern(this.s.betonDoku, 'repeat');
    const p = new Path2D();
    p.moveTo(0, h); p.lineTo(26, 40); p.lineTo(70, 8); p.lineTo(w, 0); p.lineTo(w, h); p.closePath();
    x.fill(p);
    x.save(); x.clip(p);
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0.15)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.restore();
    // kapi bosluguu + icerideki sicak isik
    x.fillStyle = '#0a0b0b'; x.fillRect(140, 118, 110, 182);
    const gi = x.createLinearGradient(140, 0, 250, 0);
    gi.addColorStop(0, 'rgba(255,196,120,0)'); gi.addColorStop(0.55, 'rgba(255,190,110,0.75)'); gi.addColorStop(1, 'rgba(255,214,150,1)');
    x.fillStyle = gi; x.fillRect(196, 124, 54, 176);
    // aralik celik kapi
    const gk = x.createLinearGradient(140, 0, 200, 0);
    gk.addColorStop(0, '#3b4347'); gk.addColorStop(0.5, '#596369'); gk.addColorStop(1, '#262c30');
    x.fillStyle = gk; x.fillRect(140, 118, 60, 182);
    x.fillStyle = 'rgba(0,0,0,0.4)';
    for (let i = 0; i < 4; i++) x.fillRect(146, 130 + i * 42, 48, 3);
    x.fillStyle = '#1b2023'; x.fillRect(184, 200, 8, 26);
    // cerceve
    x.strokeStyle = '#2a3034'; x.lineWidth = 8; x.strokeRect(136, 114, 118, 190);
    // sari serit + numara
    x.fillStyle = 'rgba(190,160,60,0.5)'; x.fillRect(136, 100, 118, 6);
    x.fillStyle = 'rgba(210,220,225,0.35)'; x.font = '700 26px sans-serif'; x.fillText('07', 272, 150);
    c.kokX = 196; c.isikX = 24; c.isikY = -90;
    return c;
  },

  // ---------- siluetler ----------
  bina(r, w, h, renk, delik) {
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.fillStyle = renk;
    x.beginPath(); x.moveTo(0, h);
    let px = 0, py = r.ar(0, h * 0.25);
    x.lineTo(0, py);
    while (px < w) {                       // kirik ust
      const ad = r.ar(8, 34);
      px = Math.min(w, px + ad);
      if (r() < 0.45) py = clamp(py + r.ar(-h * 0.14, h * 0.2), 0, h * 0.5);
      x.lineTo(px, py);
      if (r() < 0.3) x.lineTo(px, py = clamp(py + r.ar(-26, 30), 0, h * 0.5));
    }
    x.lineTo(w, h); x.closePath(); x.fill();
    // pencere bosluklari
    x.fillStyle = delik;
    const kw = r.ar(7, 11), kh = r.ar(9, 14), ax = kw + r.ar(7, 12), ay = kh + r.ar(8, 14);
    for (let yy = h * 0.5 + 6; yy < h - 10; yy += ay) for (let xx = 8; xx < w - kw - 4; xx += ax) {
      if (r() < 0.62) x.fillRect(xx, yy, kw, kh);
    }
    // cati demirleri
    x.strokeStyle = renk; x.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { const xx = r.ar(6, w - 6); x.beginPath(); x.moveTo(xx, h * 0.5); x.lineTo(xx + r.ar(-8, 8), r.ar(0, h * 0.2)); x.stroke(); }
    return c;
  },

  agacSil(r, boy, renk, kalin, isikli, govdeOran) {
    const w = boy * 0.95, h = boy;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.strokeStyle = renk; x.lineCap = 'round';
    const dal = (px, py, ac, uz, k, d) => {
      const ex = px + Math.cos(ac) * uz, ey = py + Math.sin(ac) * uz;
      const mx = (px + ex) / 2 + r.ar(-uz * 0.12, uz * 0.12), my = (py + ey) / 2 + r.ar(-uz * 0.08, uz * 0.08);
      x.lineWidth = k;
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
      if (isikli && k > 2.5) {
        x.save(); x.strokeStyle = 'rgba(120,145,158,0.25)'; x.lineWidth = Math.max(1, k * 0.22);
        x.beginPath(); x.moveTo(px - k * 0.32, py); x.quadraticCurveTo(mx - k * 0.32, my, ex - k * 0.2, ey); x.stroke(); x.restore();
      }
      if (d <= 0 || uz < 9) return;
      const n = d > 3 ? 2 : r.tam(2, 3);
      for (let i = 0; i < n; i++) dal(ex, ey, ac + r.ar(-0.75, 0.75), uz * r.ar(0.58, 0.8), Math.max(0.8, k * 0.62), d - 1);
    };
    dal(w / 2, h, -1.5708 + r.ar(-0.08, 0.08), h * (govdeOran || 0.33), kalin * (boy / 300) * 2.2, govdeOran ? 4 : 6);
    c.kokX = w / 2;
    return c;
  },

  direk(renk) {
    const c = tuvalYap(90, 330), x = c.getContext('2d');
    x.fillStyle = renk; x.fillRect(42, 14, 6, 316);
    x.fillRect(12, 26, 66, 4); x.fillRect(22, 44, 46, 3);
    x.fillRect(12, 18, 3, 10); x.fillRect(75, 18, 3, 10); x.fillRect(43, 4, 3, 12);
    c.kokX = 45;
    return c;
  },

  cit(renk) {
    const w = 300, h = 90;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.strokeStyle = renk; x.fillStyle = renk;
    for (let i = 0; i < 4; i++) { x.save(); x.translate(20 + i * 86, h); x.rotate((i % 2 ? 0.05 : -0.04)); x.fillRect(-2.5, -h + 6, 5, h); x.restore(); }
    x.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(0, 22 + k * 20); x.bezierCurveTo(90, 30 + k * 20, 200, 16 + k * 20, w, 26 + k * 20); x.stroke(); }
    // tel orgu
    x.globalAlpha = 0.4; x.lineWidth = 0.8;
    for (let i = -h; i < w; i += 9) { x.beginPath(); x.moveTo(i, h); x.lineTo(i + 62, 20); x.moveTo(i + 62, h); x.lineTo(i, 20); x.stroke(); }
    x.globalAlpha = 1;
    c.kokX = 0;
    return c;
  },

  onDirek() {
    const c = tuvalYap(120, 900), x = c.getContext('2d');
    x.fillStyle = '#020406'; x.fillRect(40, 0, 34, 900);
    x.fillRect(10, 220, 100, 14); x.fillRect(30, 520, 60, 10);
    c.kokX = 57;
    return c;
  },

  onCali(r, w, h) {
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.strokeStyle = '#020406'; x.lineCap = 'round';
    for (let i = 0; i < w / 5; i++) {
      const px = r.ar(8, w - 8), uz = r.ar(h * 0.3, h * 0.95) * (1 - Math.abs(px / w - 0.5) * 1.1);
      x.lineWidth = r.ar(2, 5);
      x.beginPath(); x.moveTo(px, h); x.quadraticCurveTo(px + r.ar(-10, 10), h - uz * 0.6, px + r.ar(-34, 34), h - uz); x.stroke();
    }
    c.kokX = w / 2;
    return c;
  },

  onKablo(r) {
    const w = 520, h = 200;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.strokeStyle = '#020406'; x.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      x.lineWidth = r.ar(4, 9);
      const y0 = r.ar(0, 30), y1 = r.ar(0, 40), sark = r.ar(70, 190);
      x.beginPath(); x.moveTo(0, y0); x.bezierCurveTo(w * 0.3, sark, w * 0.7, sark, w, y1); x.stroke();
    }
    c.kokX = w / 2; c.ustten = true;
    return c;
  },

  damla() {
    const c = tuvalYap(4, 34), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 34);
    g.addColorStop(0, 'rgba(190,215,228,0)'); g.addColorStop(1, 'rgba(190,215,228,0.5)');
    x.fillStyle = g; x.fillRect(1, 0, 1.4, 34);
    return c;
  },

  // ---------- ekran boyutuna bagli olanlar ----------
  gokYap(W, H) {
    const c = tuvalYap(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04080c'); g.addColorStop(0.45, '#0d1820'); g.addColorStop(0.72, '#1c2d37'); g.addColorStop(1, '#172530');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // bulut arkasindaki ay
    const mx = W * 0.68, my = H * 0.2;
    let ay = x.createRadialGradient(mx, my, 0, mx, my, H * 0.62);
    ay.addColorStop(0, 'rgba(170,200,214,0.42)'); ay.addColorStop(0.12, 'rgba(120,155,172,0.22)');
    ay.addColorStop(0.45, 'rgba(70,100,116,0.08)'); ay.addColorStop(1, 'rgba(70,100,116,0)');
    x.fillStyle = ay; x.fillRect(0, 0, W, H);
    ay = x.createRadialGradient(mx, my, 0, mx, my, 34);
    ay.addColorStop(0, 'rgba(225,238,245,0.75)'); ay.addColorStop(0.6, 'rgba(200,222,232,0.35)'); ay.addColorStop(1, 'rgba(200,222,232,0)');
    x.fillStyle = ay; x.fillRect(mx - 40, my - 40, 80, 80);
    return c;
  },

  vinyetYap(W, H) {
    const c = tuvalYap(W, H), x = c.getContext('2d');
    const g = x.createRadialGradient(W / 2, H * 0.52, H * 0.34, W / 2, H * 0.52, Math.hypot(W, H) * 0.56);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, 'rgba(0,2,4,0.42)'); g.addColorStop(1, 'rgba(0,2,4,0.94)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    return c;
  }
};
