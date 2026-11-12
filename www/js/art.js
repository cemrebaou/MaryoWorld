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
    s.kapiDisk = this.kapiDisk(r);
    s.presKafa = this.presKafa(r);
    s.dron = this.dron();
    s.diken = this.diken(r);
    s.kutular = {};
    s.presCerceve = this.presCerceve(r);
    s.bariyerCerceve = this.bariyerCerceve(r);
    s.tabla150 = this.tabla(r, 150);
    s.tabla110 = this.tabla(r, 110);
    s.sandik = this.sandik(r);
    s.boruDoku = this.boruDoku(r);
    s.kalasDoku = this.kalasDoku(r);
    s.hucre = this.hucre(r);
    s.cihaz = this.cihaz(r);
    s.kaide = this.kaide(r);
    s.oda = null;      // bitis odasi: ilk gerektiginde uretilir (odaAl)
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
      bulanik(this.agacSil(rngYap(7), 760, '#020406', 13, false, 0.66, 1), 7),
      bulanik(this.onDirek(), 6),
      bulanik(this.onCali(rngYap(9), 420, 150), 5),
      bulanik(this.onCali(rngYap(10), 300, 110), 5),
      bulanik(this.onKablo(rngYap(4)), 6)
    ];
    s.damla = this.damla();
  },

  // etkilesim kutusu (dugme, priz, salter, yuva): el yuksekligine gore direkli kutu
  kutuAl(hh) {
    if (!this.s.kutular[hh]) this.s.kutular[hh] = this.kutu(rngYap(500 + hh), hh);
    return this.s.kutular[hh];
  },
  odaAl(w) {
    if (!this.s.oda) this.s.oda = this.oda(rngYap(909), w);
    return this.s.oda;
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
    const c = tuvalQ(w, h), x = c.getContext('2d');
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
    const c = tuvalQ(w, h), x = c.getContext('2d');
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
    const c = tuvalQ(w, h), x = c.getContext('2d');
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
    const c = tuvalQ(w, h), x = c.getContext('2d');
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

  // Bolum sonu: yamaca gomulu beton cephe + yuvarlak kasa agzi. Disli kapak ayri cizilir (yuvarlanarak acilir)
  kapi(r) {
    const w = 580, h = 400;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    const cx = 340, cy = h - 132, R = 108;
    // beton cephe
    const p = new Path2D();
    p.moveTo(0, h); p.lineTo(34, 150); p.lineTo(96, 64); p.lineTo(180, 30); p.lineTo(w - 70, 22); p.lineTo(w, 58); p.lineTo(w, h); p.closePath();
    x.fillStyle = x.createPattern(this.s.betonDoku, 'repeat'); x.fill(p);
    x.save(); x.clip(p);
    let g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.62)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    // kalip derzleri
    x.strokeStyle = 'rgba(12,14,16,0.45)'; x.lineWidth = 1.2;
    for (let yy = 96; yy < h; yy += 74) { x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); }
    for (let xx = 60; xx < w; xx += 118) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, h); x.stroke(); }
    // akinti lekeleri
    for (let i = 0; i < 12; i++) {
      const px = r() * w;
      g = x.createLinearGradient(0, 30, 0, h);
      g.addColorStop(0, 'rgba(18,20,22,' + r.ar(0.15, 0.35) + ')'); g.addColorStop(1, 'rgba(18,20,22,0)');
      x.fillStyle = g; x.fillRect(px, 30, r.ar(3, 12), h * r.ar(0.3, 0.9));
    }
    // soluk uyari seridi
    x.globalAlpha = 0.3; x.fillStyle = '#b89a3a';
    for (let i = -40; i < w; i += 34) {
      x.beginPath(); x.moveTo(i, h - 268); x.lineTo(i + 17, h - 268); x.lineTo(i + 33, h - 284); x.lineTo(i + 16, h - 284); x.closePath(); x.fill();
    }
    x.globalAlpha = 1;
    x.restore();
    x.strokeStyle = 'rgba(185,205,214,0.4)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(34, 150); x.lineTo(96, 64); x.lineTo(180, 30); x.lineTo(w - 70, 22); x.lineTo(w, 58); x.stroke();
    // kapak rayi
    x.fillStyle = '#0f1214'; x.fillRect(cx - 320, h - 12, 460, 9);
    x.fillStyle = 'rgba(170,190,200,0.3)'; x.fillRect(cx - 320, h - 12, 460, 1.2);
    // celik bilezik
    x.fillStyle = '#14181b'; x.beginPath(); x.arc(cx, cy, R + 22, 0, 6.2832); x.fill();
    g = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    g.addColorStop(0, '#59646b'); g.addColorStop(0.5, '#2c3338'); g.addColorStop(1, '#171b1e');
    x.strokeStyle = g; x.lineWidth = 12; x.beginPath(); x.arc(cx, cy, R + 12, 0, 6.2832); x.stroke();
    x.fillStyle = '#0d1012';
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * 6.2832;
      x.beginPath(); x.arc(cx + Math.cos(a) * (R + 12), cy + Math.sin(a) * (R + 12), 2.6, 0, 6.2832); x.fill();
    }
    // ic: sicak isikli tunel
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.clip();
    g = x.createRadialGradient(cx + 18, cy + 4, 4, cx + 18, cy + 4, R * 1.25);
    g.addColorStop(0, '#fff0cf'); g.addColorStop(0.22, '#ffcd86'); g.addColorStop(0.6, '#d9792c'); g.addColorStop(1, '#3a1808');
    x.fillStyle = g; x.fillRect(cx - R, cy - R, R * 2, R * 2);
    x.strokeStyle = 'rgba(70,30,10,0.5)';
    for (let i = 1; i <= 3; i++) {
      x.lineWidth = 5 - i;
      x.beginPath(); x.arc(cx + 18 * (i / 3), cy + 4 * (i / 3), R * (1 - i * 0.22), 0, 6.2832); x.stroke();
    }
    x.fillStyle = 'rgba(40,18,6,0.55)'; x.fillRect(cx - R, cy + R * 0.66, R * 2, R);
    x.restore();
    // numara + durum lambasi yuvasi
    x.fillStyle = 'rgba(210,220,225,0.32)'; x.font = '700 30px sans-serif'; x.textAlign = 'left';
    x.fillText('07', cx + R + 44, cy - 70);
    x.fillStyle = '#14181b'; x.fillRect(cx - 12, cy - R - 52, 24, 14);
    c.kokX = cx; c.merkezY = 132; c.isikX = 0; c.isikY = -132;
    c.lambaX = 0; c.lambaY = -(132 + R + 45); c.diskYol = 176;
    return c;
  },

  // kasa agzini kapatan disli kapak (merkezden cizilir)
  kapiDisk(r) {
    const Rd = 120, b = (Rd + 12) * 2;
    const c = tuvalQ(b, b), x = c.getContext('2d');
    x.translate(b / 2, b / 2);
    x.fillStyle = '#20262a';
    for (let i = 0; i < 18; i++) { x.save(); x.rotate(i / 18 * 6.2832); x.fillRect(-11, -Rd - 9, 22, 20); x.restore(); }
    const g = x.createLinearGradient(-Rd, -Rd, Rd, Rd);
    g.addColorStop(0, '#7f8a91'); g.addColorStop(0.35, '#566067'); g.addColorStop(0.7, '#333b40'); g.addColorStop(1, '#1b2023');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, Rd, 0, 6.2832); x.fill();
    x.strokeStyle = 'rgba(10,12,14,0.6)'; x.lineWidth = 2;
    x.beginPath(); x.arc(0, 0, Rd - 16, 0, 6.2832); x.stroke();
    x.beginPath(); x.arc(0, 0, Rd * 0.55, 0, 6.2832); x.stroke();
    x.strokeStyle = 'rgba(200,214,222,0.28)'; x.lineWidth = 1.2;
    x.beginPath(); x.arc(0, 0, Rd - 1, 3.5, 5.2); x.stroke();
    // civatalar
    x.fillStyle = '#14181b';
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; x.beginPath(); x.arc(Math.cos(a) * (Rd - 31), Math.sin(a) * (Rd - 31), 4.2, 0, 6.2832); x.fill(); }
    // uyari seridi halkasi
    x.strokeStyle = 'rgba(196,160,52,0.4)'; x.lineWidth = 7; x.setLineDash([14, 12]);
    x.beginPath(); x.arc(0, 0, Rd * 0.66, 0, 6.2832); x.stroke(); x.setLineDash([]);
    // gobek + cark kollari
    x.fillStyle = '#1b2023'; x.beginPath(); x.arc(0, 0, Rd * 0.3, 0, 6.2832); x.fill();
    x.strokeStyle = '#8c979e'; x.lineWidth = 5; x.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.2832 + 0.4; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * Rd * 0.44, Math.sin(a) * Rd * 0.44); x.stroke(); }
    x.fillStyle = '#525d64'; x.beginPath(); x.arc(0, 0, 9, 0, 6.2832); x.fill();
    // pas ve yipranma
    x.setTransform(c.q, 0, 0, c.q, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    this._taneler(x, r, b, b, 70, ['rgba(96,54,30,0.28)', 'rgba(20,18,17,0.3)'], 2, 10);
    x.globalAlpha = 0.25; x.drawImage(this.s.gren, 0, 0, b, b);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    c.yaricap = Rd;
    return c;
  },

  // pres kafasi (alt kenar = ezen yuzey)
  presKafa(r) {
    const w = 104, h = 86;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#2a3035'); g.addColorStop(0.3, '#6a757c'); g.addColorStop(0.55, '#4a545a'); g.addColorStop(1, '#1a1e21');
    x.fillStyle = g; x.fillRect(4, 0, w - 8, h - 14);
    x.fillStyle = '#23282c'; x.fillRect(0, h - 16, w, 16);
    // uyari seritleri
    x.save(); x.beginPath(); x.rect(4, h - 36, w - 8, 16); x.clip();
    x.fillStyle = '#17191a'; x.fillRect(0, h - 36, w, 16);
    x.fillStyle = 'rgba(196,160,52,0.75)';
    for (let i = -20; i < w + 20; i += 22) {
      x.beginPath(); x.moveTo(i, h - 20); x.lineTo(i + 10, h - 20); x.lineTo(i + 22, h - 36); x.lineTo(i + 12, h - 36); x.closePath(); x.fill();
    }
    x.restore();
    x.fillStyle = '#14181a';
    for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(18 + i * 22.6, 14, 3.2, 0, 6.2832); x.fill(); }
    x.fillStyle = 'rgba(200,215,222,0.35)'; x.fillRect(4, 0, w - 8, 1.5);
    x.globalCompositeOperation = 'source-atop';
    this._taneler(x, r, w, h, 40, ['rgba(96,54,30,0.32)', 'rgba(20,18,17,0.35)'], 2, 8);
    x.globalAlpha = 0.25; x.drawImage(this.s.gren, 0, 0);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    c.kokX = w / 2;
    return c;
  },

  // devriye dronu (pervaneler oyunda cizilir). isikX/isikY = alttaki goz
  dron() {
    const w = 96, h = 40;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    x.strokeStyle = '#262e33'; x.lineWidth = 3.4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(32, 20); x.lineTo(10, 13); x.moveTo(64, 20); x.lineTo(86, 13); x.stroke();
    x.fillStyle = '#151a1d'; x.fillRect(6, 8, 8, 9); x.fillRect(82, 8, 8, 9);
    const g = x.createLinearGradient(0, 10, 0, 32);
    g.addColorStop(0, '#59646b'); g.addColorStop(0.4, '#2c343a'); g.addColorStop(1, '#0f1215');
    x.fillStyle = g; x.beginPath(); x.ellipse(48, 21, 21, 10, 0, 0, 6.2832); x.fill();
    x.strokeStyle = 'rgba(200,215,222,0.4)'; x.lineWidth = 1;
    x.beginPath(); x.ellipse(48, 21, 20, 9, 0, 3.6, 5.7); x.stroke();
    x.fillStyle = '#07090a'; x.beginPath(); x.arc(48, 30, 6.5, 0, 6.2832); x.fill();
    c.kokX = 48; c.isikY = 30;
    return c;
  },

  // toz, pas, akinti: duz / parlak yuzey birakmamak icin her yeni gorselin ustunden gecilir
  _eskit(x, r, w, h, guc) {
    guc = guc || 1;
    x.save(); x.globalCompositeOperation = 'source-atop';
    this._taneler(x, r, w, h, Math.round(w * h / 300 * guc), ['rgba(96,54,30,0.30)', 'rgba(20,18,17,0.32)', 'rgba(150,150,140,0.10)'], 1.5, 7);
    for (let i = 0; i < w / 14 * guc; i++) {
      const px = r() * w, y0 = r() * h * 0.5, g = x.createLinearGradient(0, y0, 0, h);
      g.addColorStop(0, 'rgba(14,16,18,' + r.ar(0.1, 0.3) + ')'); g.addColorStop(1, 'rgba(14,16,18,0)');
      x.fillStyle = g; x.fillRect(px, y0, r.ar(1.5, 5), h * r.ar(0.3, 0.9));
    }
    // ust yuzeylerde biriken toz
    const th = Math.min(h, 14), gt = x.createLinearGradient(0, 0, 0, th);
    gt.addColorStop(0, 'rgba(170,175,165,0.18)'); gt.addColorStop(1, 'rgba(170,175,165,0)');
    x.fillStyle = gt; x.fillRect(0, 0, w, th);
    x.globalAlpha = 0.28;
    for (let yy = 0; yy < h; yy += 192) for (let xx = 0; xx < w; xx += 192) x.drawImage(this.s.gren, xx, yy);
    x.restore();
  },

  // molozdan cikan sivri insaat demirleri + uyari levhasi (cimenle karismasin diye iri ve acik renk uclu)
  diken(r) {
    const w = 104, h = 74;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    // moloz yigini
    x.fillStyle = x.createPattern(this.s.betonDoku, 'repeat');
    x.beginPath(); x.moveTo(2, h); x.lineTo(8, h - 12); x.lineTo(22, h - 17); x.lineTo(38, h - 11); x.lineTo(54, h - 19);
    x.lineTo(72, h - 13); x.lineTo(88, h - 16); x.lineTo(w - 4, h - 8); x.lineTo(w - 1, h); x.closePath(); x.fill();
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, h - 6, w, 6);
    x.strokeStyle = 'rgba(200,214,222,0.4)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(8, h - 12); x.lineTo(22, h - 17); x.lineTo(38, h - 11); x.lineTo(54, h - 19); x.lineTo(72, h - 13); x.lineTo(88, h - 16); x.stroke();
    // demirler: kalin govde, pasli, ucta parlak sivri kesim
    x.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const px = 14 + i * 8.6 + r.ar(-2, 2), uz = r.ar(30, 46), eg = r.ar(-0.3, 0.3);
      const ex = px + Math.sin(eg) * uz, ey = h - 12 - Math.cos(eg) * uz;
      x.strokeStyle = '#17110e'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(px, h - 10); x.lineTo(ex, ey); x.stroke();
      x.strokeStyle = '#7a4a30'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(px, h - 10); x.lineTo(ex, ey); x.stroke();
      x.strokeStyle = 'rgba(232,238,240,0.9)'; x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(lerp(px, ex, 0.7), lerp(h - 10, ey, 0.7)); x.lineTo(ex, ey); x.stroke();
    }
    this._eskit(x, r, w, h, 0.5);
    // uyari levhasi (egik direkte sari ucgen)
    x.save(); x.translate(96, h - 6); x.rotate(0.1);
    x.fillStyle = '#20262a'; x.fillRect(-1.5, -52, 3, 52);
    x.fillStyle = '#c9a233'; x.beginPath(); x.moveTo(0, -70); x.lineTo(11, -50); x.lineTo(-11, -50); x.closePath(); x.fill();
    x.fillStyle = '#14181a'; x.fillRect(-1.2, -63, 2.4, 7); x.fillRect(-1.2, -54.5, 2.4, 2.4);
    x.restore();
    c.kokX = 10; c.levhaX = 80; c.levhaY = -64;
    return c;
  },

  // etkilesim kutusu: ustte kutu (elin gidecegi nokta kutunun ortasi), altta yere inen direk
  kutu(r, hh) {
    const w = 34, h = 20 + hh;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    let g = x.createLinearGradient(13, 0, 21, 0);
    g.addColorStop(0, '#4b555b'); g.addColorStop(0.5, '#2a3035'); g.addColorStop(1, '#14181b');
    x.fillStyle = g; x.fillRect(14, 30, 6, h - 30);
    x.fillStyle = '#1a1f22'; x.fillRect(8, h - 5, 18, 5);
    g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#5b656c'); g.addColorStop(0.6, '#39424a'); g.addColorStop(1, '#232a2f');
    x.fillStyle = g; x.fillRect(3, 0, 28, 40);
    x.strokeStyle = 'rgba(10,12,14,0.7)'; x.lineWidth = 1; x.strokeRect(3.5, 0.5, 27, 39);
    x.fillStyle = 'rgba(196,160,52,0.5)'; x.fillRect(3, 33, 28, 4);
    x.fillStyle = '#12161a';
    x.beginPath(); x.arc(7, 4, 1.5, 0, 6.2832); x.fill();
    x.beginPath(); x.arc(27, 4, 1.5, 0, 6.2832); x.fill();
    x.beginPath(); x.arc(17, 20, 9, 0, 6.2832); x.fill();
    this._eskit(x, r, w, h, 1.2);
    c.kokX = 17; c.elY = 20;
    return c;
  },

  // pres cercevesi: iki kolon + ust kiris + silindir yuvasi (kokX = orta, alt kenar = zemin)
  presCerceve(r) {
    const w = 190, h = 356;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    for (let k = 0; k < 2; k++) {
      const kx = k === 0 ? 8 : w - 26;
      const g = x.createLinearGradient(kx, 0, kx + 18, 0);
      g.addColorStop(0, '#4a545a'); g.addColorStop(0.45, '#2a3136'); g.addColorStop(1, '#14181b');
      x.fillStyle = g; x.fillRect(kx, 6, 18, h - 6);
      x.fillStyle = '#12161a';
      for (let yy = 40; yy < h - 20; yy += 46) { x.beginPath(); x.arc(kx + 9, yy, 2.2, 0, 6.2832); x.fill(); }
      // kolon dibinde uyari seritleri
      x.save(); x.beginPath(); x.rect(kx, h - 44, 18, 30); x.clip();
      x.fillStyle = 'rgba(196,160,52,0.55)';
      for (let i = -30; i < 40; i += 14) { x.beginPath(); x.moveTo(kx + i, h - 14); x.lineTo(kx + i + 7, h - 14); x.lineTo(kx + i + 37, h - 44); x.lineTo(kx + i + 30, h - 44); x.closePath(); x.fill(); }
      x.restore();
    }
    const g = x.createLinearGradient(0, 0, 0, 32);
    g.addColorStop(0, '#59646b'); g.addColorStop(0.3, '#333b40'); g.addColorStop(1, '#171b1e');
    x.fillStyle = g; x.fillRect(0, 0, w, 32);
    x.fillStyle = '#101417'; x.fillRect(w / 2 - 22, 30, 44, 34);
    x.fillStyle = '#0b0e10'; x.fillRect(w / 2 - 7, 8, 14, 9);
    this._eskit(x, r, w, h, 0.9);
    c.kokX = w / 2; c.lambaY = -(h - 12);
    return c;
  },

  // lazer bariyeri govdesi: ters L direk + taban (isinlar oyunda cizilir)
  bariyerCerceve(r) {
    const w = 62, h = 250;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    let g = x.createLinearGradient(2, 0, 12, 0);
    g.addColorStop(0, '#4a545a'); g.addColorStop(0.5, '#2a3136'); g.addColorStop(1, '#14181b');
    x.fillStyle = g; x.fillRect(2, 8, 10, h - 8);
    g = x.createLinearGradient(0, 0, 0, 14);
    g.addColorStop(0, '#59646b'); g.addColorStop(1, '#1c2125');
    x.fillStyle = g; x.fillRect(0, 0, w - 4, 13);
    x.fillStyle = '#0d1012'; x.fillRect(16, 11, 36, 4);
    x.fillStyle = '#1c2125'; x.fillRect(14, h - 6, 44, 6);
    x.fillStyle = '#0d1012'; x.fillRect(18, h - 8, 36, 3);
    this._eskit(x, r, w, h, 1.2);
    c.kokX = 34;      // isinlarin ortasi
    return c;
  },

  // izgarali metal tabla (hareketli platform, asansor)
  tabla(r, w) {
    const h = 16;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5a656c'); g.addColorStop(0.25, '#343c41'); g.addColorStop(1, '#14181b');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(8,10,12,0.55)';
    for (let i = 6; i < w - 4; i += 9) x.fillRect(i, 3, 4, 5);
    x.fillStyle = 'rgba(196,160,52,0.5)'; x.fillRect(0, 11, 14, 3); x.fillRect(w - 14, 11, 14, 3);
    this._eskit(x, r, w, h, 2);
    return c;
  },

  // itilebilen sandik: celik koseli, ezik, tozlu
  sandik(r) {
    const w = 76, h = 72;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#5d5548'); g.addColorStop(0.5, '#463f36'); g.addColorStop(1, '#2a2620');
    x.fillStyle = g; x.fillRect(1, 1, w - 2, h - 2);
    x.fillStyle = 'rgba(10,9,8,0.55)';
    for (let i = 1; i < 5; i++) x.fillRect(1, i * 14.4, w - 2, 1.4);
    x.strokeStyle = '#2b2620'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(7, 7); x.lineTo(w - 7, h - 7); x.stroke();
    x.strokeStyle = '#353c40'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
    x.fillStyle = '#4a545a';
    [[1, 1], [w - 13, 1], [1, h - 13], [w - 13, h - 13]].forEach((k) => { x.fillRect(k[0], k[1], 12, 12); });
    x.fillStyle = '#14181a';
    [[7, 7], [w - 7, 7], [7, h - 7], [w - 7, h - 7]].forEach((k) => { x.beginPath(); x.arc(k[0], k[1], 2, 0, 6.2832); x.fill(); });
    x.fillStyle = 'rgba(200,214,222,0.3)'; x.fillRect(1, 1, w - 2, 1.3);
    this._eskit(x, r, w, h, 1.3);
    return c;
  },

  // boru govdesi: yatayda yan yana dizilir
  boruDoku(r) {
    const w = 240, h = 66;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5b666d'); g.addColorStop(0.22, '#3d464c'); g.addColorStop(0.7, '#1c2125'); g.addColorStop(1, '#0d1012');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(8,10,12,0.5)'; x.fillRect(118, 0, 2, h);
    this._eskit(x, r, w, h, 1.1);
    return c;
  },

  // curuk kalas: yatayda yan yana dizilir
  kalasDoku(r) {
    const w = 60, h = 10;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#4a4034'); g.addColorStop(1, '#221d18');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(29, 0, 1.6, h);
    x.strokeStyle = 'rgba(15,12,10,0.5)'; x.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) { const yy = r.ar(2, h - 2); x.beginPath(); x.moveTo(r.ar(0, 20), yy); x.lineTo(r.ar(30, w), yy + r.ar(-1, 1)); x.stroke(); }
    this._eskit(x, r, w, h, 2.5);
    return c;
  },

  // guc hucresi (kokX/kokY = merkez). Isigi oyunda eklenir
  hucre(r) {
    const w = 16, h = 30;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#59646b'); g.addColorStop(0.5, '#2f373c'); g.addColorStop(1, '#14181b');
    x.fillStyle = g; x.fillRect(1, 0, w - 2, h);
    x.fillStyle = '#12161a'; x.fillRect(0, 0, w, 5); x.fillRect(0, h - 5, w, 5);
    x.fillStyle = '#ffb45a'; x.fillRect(5, 8, 6, 14);
    this._eskit(x, r, w, h, 1.5);
    x.fillStyle = 'rgba(255,200,120,0.9)'; x.fillRect(6.5, 9.5, 3, 11);
    c.kokX = w / 2; c.kokY = h / 2;
    return c;
  },

  // eldeki eski cihaz: icinde hala calisan bir ekran (goruntu oyunda cizilir)
  cihaz(r) {
    const w = 46, h = 34;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#4f595f'); g.addColorStop(1, '#1d2226');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(4, 0); x.lineTo(w - 4, 0); x.lineTo(w, 4); x.lineTo(w, h - 4); x.lineTo(w - 4, h); x.lineTo(4, h); x.lineTo(0, h - 4); x.lineTo(0, 4); x.closePath(); x.fill();
    x.fillStyle = '#12161a'; x.fillRect(w - 9, 7, 5, 5); x.fillRect(w - 9, 16, 5, 3);
    this._eskit(x, r, w, h, 1.6);
    x.fillStyle = '#05080a'; x.fillRect(4, 4, 30, 24);
    c.kokX = w / 2; c.kokY = h / 2;
    return c;
  },

  // cihazin durdugu beton kaide
  kaide(r) {
    const w = 78, h = 70;
    const c = tuvalQ(w, h), x = c.getContext('2d');
    x.fillStyle = x.createPattern(this.s.betonDoku, 'repeat');
    x.beginPath(); x.moveTo(8, h); x.lineTo(12, 10); x.lineTo(2, 8); x.lineTo(2, 0); x.lineTo(w - 2, 0); x.lineTo(w - 2, 8); x.lineTo(w - 12, 10); x.lineTo(w - 8, h); x.closePath(); x.fill();
    x.save(); x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.restore();
    this._eskit(x, r, w, h, 0.8);
    c.kokX = w / 2;
    return c;
  },

  // kasanin ici: eski bir siginak odasi. Raflar, sonmus ekranlar, duvarda insanlardan kalan izler
  oda(r, w) {
    const h = 660;
    const c = tuvalYap(w, h), x = c.getContext('2d');
    x.fillStyle = x.createPattern(this.s.betonDoku, 'repeat'); x.fillRect(0, 0, w, h);
    let g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(2,4,6,0.86)'); g.addColorStop(0.55, 'rgba(2,4,6,0.58)'); g.addColorStop(1, 'rgba(2,4,6,0.74)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    // panel derzleri
    x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 2;
    for (let xx = 90; xx < w; xx += 210) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, h); x.stroke(); }
    x.beginPath(); x.moveTo(0, h - 210); x.lineTo(w, h - 210); x.stroke();
    // tavan borulari
    for (let i = 0; i < 3; i++) {
      const yy = 46 + i * 30;
      g = x.createLinearGradient(0, yy, 0, yy + 14);
      g.addColorStop(0, '#39434a'); g.addColorStop(1, '#0d1012');
      x.fillStyle = g; x.fillRect(0, yy, w, 14);
      x.fillStyle = '#1a2024';
      for (let xx = 60 + i * 70; xx < w; xx += 330) x.fillRect(xx, yy - 3, 9, 20);
    }
    // raflar, sonmus ekranlar, sarkan kablolar
    const orta = w * 0.52;
    for (let i = 0; i < w / 300; i++) {
      const px = 80 + i * 300 + r.ar(-50, 50), ry = h - r.ar(300, 360);
      if (Math.abs(px + 85 - orta) < 330) continue;      // kaidenin arkasi duvar resmi icin bos kalir
      x.fillStyle = '#12171a';
      x.fillRect(px, ry, 170, 7); x.fillRect(px + 8, ry, 5, h - ry); x.fillRect(px + 157, ry, 5, h - ry); x.fillRect(px, ry + 110, 170, 6);
      for (let k = 0; k < 2; k++) {
        const ex = px + 14 + k * 78, ew = r.ar(52, 66), eh = r.ar(40, 50);
        x.fillStyle = '#1b2125'; x.fillRect(ex, ry - eh - 2, ew, eh);
        x.fillStyle = '#06090b'; x.fillRect(ex + 5, ry - eh + 3, ew - 10, eh - 12);
        x.fillStyle = 'rgba(120,160,180,0.07)';
        x.beginPath(); x.moveTo(ex + 7, ry - eh + 5); x.lineTo(ex + ew * 0.5, ry - eh + 5); x.lineTo(ex + 7, ry - 14); x.closePath(); x.fill();
      }
      x.strokeStyle = '#0b0e10'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(px + 40, ry + 7); x.bezierCurveTo(px + 30, ry + 60, px + 70, ry + 70, px + 60, ry + 110); x.stroke();
      x.fillStyle = '#161b1e'; x.fillRect(px + 20, ry + 82, 44, 28); x.fillRect(px + 96, ry + 74, 56, 36);
    }
    // duvarda tebesirle cizilmis resim: bir insan ile bir robot el ele (kaidenin arkasinda)
    const tx = orta + 150, ty = h - 250;
    x.strokeStyle = 'rgba(215,225,228,0.34)'; x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath();
    x.moveTo(tx + 11, ty); x.arc(tx, ty, 11, 0, 6.2832);                 // insan
    x.moveTo(tx, ty + 11); x.lineTo(tx + 1, ty + 52);
    x.lineTo(tx - 13, ty + 86); x.moveTo(tx + 1, ty + 52); x.lineTo(tx + 15, ty + 86);
    x.moveTo(tx, ty + 24); x.lineTo(tx - 20, ty + 44);
    x.moveTo(tx, ty + 24); x.lineTo(tx + 34, ty + 36);                    // uzanan el
    x.rect(tx + 58, ty - 14, 26, 22);                                    // robot: kare kafa
    x.moveTo(tx + 71, ty - 14); x.lineTo(tx + 76, ty - 26);
    x.rect(tx + 54, ty + 12, 34, 40);
    x.moveTo(tx + 62, ty + 52); x.lineTo(tx + 60, ty + 86); x.moveTo(tx + 80, ty + 52); x.lineTo(tx + 83, ty + 86);
    x.moveTo(tx + 54, ty + 24); x.lineTo(tx + 34, ty + 36);              // eller birlesir
    x.moveTo(tx + 88, ty + 24); x.lineTo(tx + 104, ty + 44);
    x.stroke();
    x.fillStyle = 'rgba(215,225,228,0.34)';
    x.beginPath(); x.arc(tx + 66, ty - 4, 2, 0, 6.2832); x.fill();
    x.beginPath(); x.arc(tx + 77, ty - 4, 2, 0, 6.2832); x.fill();
    // gun sayan cizikler
    x.strokeStyle = 'rgba(215,225,228,0.22)'; x.lineWidth = 1.8;
    for (let gr = 0; gr < 7; gr++) {
      const gx0 = orta - 330 + gr * 46, gy0 = h - 300 + (gr % 2) * 44;
      x.beginPath();
      for (let k = 0; k < 4; k++) { x.moveTo(gx0 + k * 7, gy0); x.lineTo(gx0 + k * 7 + r.ar(-1, 1), gy0 + 26); }
      x.moveTo(gx0 - 4, gy0 + 20); x.lineTo(gx0 + 26, gy0 + 5);
      x.stroke();
    }
    // genel toz / kir
    x.globalAlpha = 0.2;
    for (let yy = 0; yy < h; yy += 192) for (let xx = 0; xx < w; xx += 192) x.drawImage(this.s.gren, xx, yy);
    x.globalAlpha = 1;
    c.kokX = 0;
    return c;
  },

  // ---------- siluetler ----------
  bina(r, w, h, renk, delik) {
    const c = tuvalQ(w, h, 1.5), x = c.getContext('2d');
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

  agacSil(r, boy, renk, kalin, isikli, govdeOran, q) {
    const w = boy * 0.95, h = boy;
    const c = tuvalQ(w, h, q || 1.5), x = c.getContext('2d');
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
    const c = tuvalQ(90, 330, 1.5), x = c.getContext('2d');
    x.fillStyle = renk; x.fillRect(42, 14, 6, 316);
    x.fillRect(12, 26, 66, 4); x.fillRect(22, 44, 46, 3);
    x.fillRect(12, 18, 3, 10); x.fillRect(75, 18, 3, 10); x.fillRect(43, 4, 3, 12);
    c.kokX = 45;
    return c;
  },

  cit(renk) {
    const w = 300, h = 90;
    const c = tuvalQ(w, h, 1.5), x = c.getContext('2d');
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
