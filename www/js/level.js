// Bolum 1 - zemin, nesneler, kontrol noktalari
'use strict';

const CUKUR = 99999; // cukur isareti (zemin yok)

class Zemin {
  constructor(x, y) {
    this.n = [{ x: x, y: y }];   // noktalar
    this.mat = [];               // i -> i+1 parcasinin malzemesi
    this.m = 'toprak';
    this.x = x; this.y = y;
    this.cukurlar = [];
    this.merdivenler = [];
    this.yokuslar = [];
  }
  malzeme(m) { this.m = m; return this; }
  _ekle(x, y, mat) {
    this.n.push({ x: x, y: y });
    this.mat.push(mat || this.m);
    this.x = x; this.y = y;
  }
  duz(w) { this._ekle(this.x + w, this.y); return this; }
  // dy<0 yokus yukari. Uclari yumusatmak icin 3 parcaya bolunur
  yokus(w, dy) {
    const x0 = this.x, y0 = this.y;
    const adim = 8;
    for (let i = 1; i <= adim; i++) {
      const t = i / adim;
      const e = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
      this._ekle(x0 + w * t, y0 + dy * e);
    }
    this.yokuslar.push({ x0: x0, x1: x0 + w });
    return this;
  }
  // adet basamak; kosu = basamak derinligi, yuk = basamak yuksekligi (<0 yukari)
  merdiven(adet, kosu, yuk) {
    const x0 = this.x;
    for (let i = 0; i < adet; i++) {
      if (yuk < 0) { this._ekle(this.x, this.y + yuk, 'beton'); this._ekle(this.x + kosu, this.y, 'beton'); }
      else { this._ekle(this.x + kosu, this.y, 'beton'); this._ekle(this.x, this.y + yuk, 'beton'); }
    }
    this.merdivenler.push({ x0: x0, x1: this.x, yukari: yuk < 0 });
    return this;
  }
  // dik basamak (ziplamak gerekir)
  set(dy) { this._ekle(this.x, this.y + dy); return this; }
  bosluk(w) {
    const y = this.y;
    this.cukurlar.push({ x0: this.x, x1: this.x + w, y: y });
    this._ekle(this.x, CUKUR, 'bos');
    this._ekle(this.x + w, CUKUR, 'bos');
    this._ekle(this.x, y, 'bos');
    return this;
  }
  bitir() {
    this.uz = this.x;
    return this;
  }
  // x noktasindaki zemin yuksekligi
  yuk(x) {
    const n = this.n;
    if (x <= n[0].x) return n[0].y;
    if (x >= n[n.length - 1].x) return n[n.length - 1].y;
    let a = 0, b = n.length - 1;
    while (b - a > 1) {
      const o = (a + b) >> 1;
      if (n[o].x <= x) a = o; else b = o;
    }
    const p = n[a], q = n[a + 1];
    if (p.y >= CUKUR || q.y >= CUKUR) {
      // cukur kenari: dik duvar
      if (p.y >= CUKUR && q.y >= CUKUR) return CUKUR;
      return (p.y >= CUKUR) ? CUKUR : (x >= q.x ? q.y : p.y);
    }
    const w = q.x - p.x;
    if (w < 0.0001) return q.y;
    return p.y + (q.y - p.y) * ((x - p.x) / w);
  }
  // egim acisi (radyan), kucuk pencere ile
  egim(x, pen) {
    pen = pen || 7;
    const a = this.yuk(x - pen), b = this.yuk(x + pen);
    if (a >= CUKUR || b >= CUKUR) return 0;
    return Math.atan2(b - a, pen * 2);
  }
  malzemeAl(x) {
    const n = this.n;
    let a = 0, b = n.length - 1;
    while (b - a > 1) {
      const o = (a + b) >> 1;
      if (n[o].x <= x) a = o; else b = o;
    }
    return this.mat[a] || 'toprak';
  }
}

function bolumKur() {
  const z = new Zemin(-300, 540);
  const B = { nesneler: [], kontrol: [], isiklar: [] };
  const nesne = function (tip, x, ek) {
    const o = Object.assign({ tip: tip, x: x, y: z.yuk(x) }, ek || {});
    B.nesneler.push(o);
    return o;
  };

  // A - baslangic: orman kenari
  z.malzeme('toprak').duz(300 + 720);                 // x: 0..720
  B.kontrol.push({ x: 250 });
  // B - hafif inis
  z.yokus(600, 52);                                   // 720..1320
  // C - eski yol, hurda araba, titreyen lamba
  z.malzeme('asfalt').duz(460);                       // 1320..1780
  const xC = z.x;
  // D - yokus yukari
  z.malzeme('toprak').yokus(640, -172);               // 1780..2420
  z.malzeme('beton').duz(280);                        // ..2700
  B.kontrol.push({ x: z.x - 160 });
  // E - merdiven
  z.merdiven(8, 46, -22);                             // ..3068
  // F - ust gecit + kirik kopru
  z.duz(400);
  const xF = z.x;
  B.kontrol.push({ x: xF - 170 });
  z.bosluk(104);
  z.duz(250);
  z.bosluk(124);
  z.duz(330);
  B.kontrol.push({ x: z.x - 200 });
  // G - merdiven asagi
  z.merdiven(6, 46, 22);
  z.malzeme('asfalt').duz(260);
  // H - konteyner basamaklari (ziplayarak)
  B.konteynerler = [];
  let k0 = z.x;
  z.malzeme('metal').set(-62).duz(280);
  B.konteynerler.push({ x0: k0, x1: z.x, y: z.y, h: 62, kat: 1 });
  k0 = z.x;
  z.set(-60).duz(240);
  B.konteynerler.push({ x0: k0, x1: z.x, y: z.y, h: 122, kat: 2 });
  // I - uzun inis
  z.malzeme('toprak').yokus(700, 214);
  z.malzeme('asfalt').duz(240);
  B.kontrol.push({ x: z.x - 120 });
  // J - projektor bolgesi
  const j0 = z.x;
  z.duz(1560);
  const j1 = z.x;
  B.projektor = {
    x0: j0 + 190, x1: j1 - 190,
    kuleX: (j0 + j1) / 2, yaricap: 150, periyot: 8.4
  };
  B.siperler = [
    { x: j0 + 330, w: 118, h: 112 },
    { x: j0 + 770, w: 118, h: 112 },
    { x: j0 + 1210, w: 118, h: 112 }
  ];
  B.kontrol.push({ x: j1 + 60 });
  // K - siginaga cikis
  z.malzeme('toprak').yokus(420, -92);
  z.malzeme('beton').merdiven(5, 46, -22).duz(560);
  z.bitir();

  B.zemin = z;
  B.uz = z.uz;
  B.bitisX = z.uz - 250;
  B.baslaX = 250;

  // --- oyun duzlemindeki nesneler ---
  nesne('agac', 90, { boy: 330, tohum: 11 });
  nesne('agac', 520, { boy: 290, tohum: 12 });
  nesne('agac', 930, { boy: 350, tohum: 13 });
  nesne('lamba', xC - 300, { titrek: true });
  nesne('araba', xC - 120);
  nesne('lamba', 2560, {});
  nesne('korkuluk', xF - 395, { w: 390 });
  nesne('lamba', xF + 104 + 125, {});
  nesne('korkuluk', xF + 104 + 250 + 124 + 10, { w: 300 });
  nesne('lamba', j0 - 140, { titrek: true });
  nesne('kule', B.projektor.kuleX, {});
  nesne('agac', j1 + 330, { boy: 300, tohum: 17 });
  nesne('kapi', z.uz - 150, {});

  return B;
}
