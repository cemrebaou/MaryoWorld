// Bolum 1 - zemin, nesneler, tehditler, kontrol noktalari
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
    this.ekler = [];             // cukur ustundeki hareketli/gecici yuzeyler (kalas, platform)
    this.bloklar = [];           // zeminin ustunde duran kati kutular (sandik, asansor): {x0, x1, ust}
  }
  malzeme(m) { this.m = m; return this; }
  _ekle(x, y, mat) {
    this.n.push({ x: x, y: y });
    this.mat.push(mat || this.m);
    this.x = x; this.y = y;
  }
  duz(w) { this._ekle(this.x + w, this.y); return this; }
  // dy<0 yokus yukari. Uclari yumusatmak icin parcalara bolunur
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
    this.merdivenler.push({ x0: x0, x1: this.x, kosu: kosu, yukari: yuk < 0 });
    return this;
  }
  // dik duvar (ziplamak ya da tirmanmak gerekir)
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
  _parca(x) {
    const n = this.n;
    let a = 0, b = n.length - 1;
    while (b - a > 1) {
      const o = (a + b) >> 1;
      if (n[o].x <= x) a = o; else b = o;
    }
    return a;
  }
  // sabit zemin yuksekligi
  _taban(x) {
    const n = this.n;
    if (x <= n[0].x) return n[0].y;
    if (x >= n[n.length - 1].x) return n[n.length - 1].y;
    const a = this._parca(x);
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
  // zemin yuksekligi: sabit zemin + kalas/platform (sandik ve asansor haric)
  yukZemin(x) {
    const y = this._taban(x);
    if (y >= CUKUR) {
      const e = this.ekler;
      for (let i = 0; i < e.length; i++) if (e[i].aktif && x >= e[i].x0 && x <= e[i].x1) return e[i].y;
    }
    return y;
  }
  // x noktasinda basilabilecek en ust yuzey (sandik ve asansor dahil)
  yuk(x) {
    let y = this.yukZemin(x);
    const b = this.bloklar;
    for (let i = 0; i < b.length; i++) if (x >= b[i].x0 && x <= b[i].x1 && b[i].ust < y) y = b[i].ust;
    return y;
  }
  // egim acisi (radyan), kucuk pencere ile (kutular egim sayilmaz)
  egim(x, pen) {
    pen = pen || 7;
    const a = this.yukZemin(x - pen), b = this.yukZemin(x + pen);
    if (a >= CUKUR || b >= CUKUR) return 0;
    return Math.atan2(b - a, pen * 2);
  }
  // ayagin bastigi parcanin kendi egimi: basamakta ve duzde tam 0 doner
  egimYerel(x) {
    const n = this.n;
    if (x <= n[0].x || x >= n[n.length - 1].x) return 0;
    const a = this._parca(x);
    const p = n[a], q = n[a + 1];
    if (p.y >= CUKUR || q.y >= CUKUR) return 0;
    const w = q.x - p.x;
    if (w < 0.5) return 0;
    return Math.atan2(q.y - p.y, w);
  }
  // merdivende ayagi basamagin ustune tam oturt (burun/topuk disari tasmasin). f = bakis yonu
  basamakOtur(x, f) {
    for (let i = 0; i < this.merdivenler.length; i++) {
      const m = this.merdivenler[i];
      if (x <= m.x0 || x >= m.x1) continue;
      const t0 = m.x0 + Math.floor((x - m.x0) / m.kosu) * m.kosu;
      const lo = t0 + (f > 0 ? 11 : 24), hi = t0 + m.kosu - (f > 0 ? 24 : 11);
      if (lo > hi) return t0 + m.kosu / 2;
      return x < lo ? lo : (x > hi ? hi : x);
    }
    return x;
  }
  malzemeAl(x) {
    return this.mat[this._parca(x)] || 'toprak';
  }
}

function bolumKur() {
  const z = new Zemin(-300, 540);
  const B = {
    nesneler: [], kontrol: [], gozculer: [], siperler: [], konteynerler: [], tirmanma: [],
    presler: [], elektrik: [], lazerler: [], dikenler: [], kalaslar: [], platformlar: [],
    alcaklar: [], ipuclari: [], temiz: [], etkiler: [], bariyerler: [], yapilar: [],
    sandiklar: [], plakalar: [], asansorler: [], dusunceler: [], hatlar: []
  };
  let a0 = 0;

  // ---- yardimcilar ----
  const nesne = (tip, x, ek) => { const o = Object.assign({ tip: tip, x: x, y: 0 }, ek || {}); B.nesneler.push(o); return o; };
  const kontrol = (x) => { B.kontrol.push({ x: x }); };
  const temiz = (a, b) => { B.temiz.push([a, b]); };          // on plan siluetlerinin kapatmayacagi yerler
  const ipucu = (x, ad) => { B.ipuclari.push({ x: x, ad: ad }); };
  // robotun dusuncesi: oradan ilk geciste bir kez gorunur. etkiYok verilirse o etkilesim yapilmadiysa
  const dusunce = (x, ad, etkiYok) => { B.dusunceler.push({ x: x, ad: ad, oldu: false, etkiYok: etkiYok || null }); };
  // baslangicta kapali olan tehdit (sonradan bir etkilesimle acilir)
  const uyut = (o) => { o.kapali = true; o.kapali0 = true; return o; };
  const cukur = (w) => { temiz(z.x - 380, z.x + w + 380); z.bosluk(w); };
  // curuk kalas: ustune basinca kisa surede duser
  const kalasli = (w) => {
    const e = { x0: z.x, x1: z.x + w, y: z.y, aktif: true };
    z.ekler.push(e);
    B.kalaslar.push({ x0: e.x0, x1: e.x1, y: e.y, e: e, t: -1, vy: 0, dy: 0 });
    cukur(w);
  };
  // raya asili, gidip gelen platform
  const hareketli = (w, pw, periyot) => {
    const c0 = z.x, c1 = z.x + w;
    const e = { x0: c0, x1: c0 + pw, y: z.y, aktif: true };
    z.ekler.push(e);
    B.platformlar.push({ c0: c0, c1: c1, w: pw, y: z.y, orta: (c0 + c1) / 2, gen: (w - pw) / 2, periyot: periyot, t: 0, e: e });
    cukur(w);
  };
  // dik merdiven. yon: +1 duvar sagda (soldan cikilir), -1 duvar solda (sagdan inilir)
  // ax = robotun merdivendeki yeri (merdivenden kol boyu uzakta), ux = ustte ayak bastigi yer, lx = merdiven
  const merd = (duvarX, yon, yAlt, yUst) => {
    B.tirmanma.push({ duvarX: duvarX, yon: yon, yAlt: yAlt, yUst: yUst, ax: duvarX - yon * 52, ux: duvarX + yon * 16, lx: duvarX - yon * 9 });
    temiz(duvarX - 350, duvarX + 350);
  };
  // iki dik inis/cikis arasi yuksek beton yapi (govdesi tamamen beton cizilir)
  let yapiBas = 0;
  const duvarCik = (h) => { const y = z.y; yapiBas = z.x; merd(z.x, 1, y, y - h); z.set(-h); };
  const duvarIn = (h) => { const y = z.y; B.yapilar.push([yapiBas, z.x]); merd(z.x, -1, y + h, y); z.set(h); };
  const konteyner = (dy, w, toplam) => {
    const k0 = z.x;
    z.set(-dy).duz(w);
    B.konteynerler.push({ x0: k0, x1: z.x, y: z.y, h: toplam });
    temiz(k0 - 300, z.x + 200);
  };
  const siper = (x) => { B.siperler.push({ x: x, w: 118, h: 112 }); };
  const kule = (x0, x1, periyot) => {
    const g = { tip: 'kule', x0: x0 + 190, x1: x1 - 190, kuleX: (x0 + x1) / 2, yaricap: 150, periyot: periyot, faz: 0, t: 0, sx: x0 + 190, sy: z.y, kx: 0, ky: 0 };
    B.gozculer.push(g);
    nesne('kule', g.kuleX);
    temiz(x0 - 300, x1 + 300);
    return g;
  };
  const dron = (x0, x1, periyot, faz) => {
    const g = { tip: 'dron', x0: x0, x1: x1, yuk: 250, yaricap: 104, periyot: periyot, faz: faz || 0, t: 0, sx: x0, sy: z.y, kx: x0, ky: z.y - 250, in: 0 };
    B.gozculer.push(g);
    temiz(x0 - 250, x1 + 250);
    return g;
  };
  const pres = (x, periyot, faz) => { const p = { x: x, y: z.y, w: 96, acik: 232, periyot: periyot, faz: faz, k: 0, alt: z.y - 232, uyari: false, onceki: 0 }; B.presler.push(p); return p; };
  // periyot 0 = surekli acik (yalnizca kablosu sokulunce kapanir)
  const elektrik = (x, w, periyot, faz) => { const e = { x0: x, x1: x + w, y: z.y, periyot: periyot, faz: faz, acik: false, yakinda: false }; B.elektrik.push(e); return e; };
  // lazer. tip: 'ust' (124 px, egilerek), 'surun' (92 px, surunerek), 'alt' (16 px, ziplayarak / sonukken)
  // periyot verilirse yanip soner
  const lazer = (x, w, tip, periyot, faz) => {
    const l = { x0: x, x1: x + w, y: z.y, h: tip === 'ust' ? 124 : (tip === 'surun' ? 92 : 16), ust: tip !== 'alt', periyot: periyot || 0, faz: faz || 0, acik: true };
    B.lazerler.push(l);
    return l;
  };
  const diken = (x) => { B.dikenler.push({ x0: x, x1: x + 84, y: z.y }); };
  // alcak gecitler: boru = egilerek (112 px), tabla = surunerek (86 px)
  const alcak = (x, w) => { B.alcaklar.push({ x0: x, x1: x + w, y: z.y, h: 112, tip: 'boru' }); };
  const dar = (x, w) => { B.alcaklar.push({ x0: x, x1: x + w, y: z.y, h: 86, tip: 'tabla' }); };
  // gecilmez lazer bariyeri (dugme / plaka ile kapanir)
  const bariyer = (x) => { const b = { x: x, y: z.y, kapali: false }; B.bariyerler.push(b); return b; };
  // itilebilen sandik: min..max arasinda itilir, ustune cikilir
  const sandik = (x, min, max) => {
    const s = { x0: x, x1: x + 76, w: 76, h: 70, ust: z.y - 70, taban: z.y, min: min, max: max, bas: x };
    z.bloklar.push(s); B.sandiklar.push(s);
    return s;
  };
  // agirlik plakasi: ustunde robot ya da sandik varken hedefleri kapatir
  const plaka = (x, hedef) => { B.plakalar.push({ x0: x, x1: x + 90, y: z.y, hedef: hedef, basili: false, k: 0 }); };
  // asansor: duvarin dibinde, guc gelince inip cikar
  const asansor = (x, w, h) => {
    const a = { x0: x, x1: x + w, w: w, ust: z.y, yAlt: z.y, yUst: z.y - h, t: 0, k: 0 };
    z.bloklar.push(a); B.asansorler.push(a);
    return a;
  };
  // etkilesim noktasi. tip: 'dugme' | 'kablo' | 'salter' | 'hucre' | 'yuva'
  // h = elin gidecegi yukseklik, egil = egilerek uzanir, hedef = kapatilacak tehditler
  // ek: ac (acilacaklar), gerek / verir (tasinan nesne), kilit (once yapilmasi gerekenler; yoksa 'red' dusuncesi),
  //     onkosul (bunlar yapilmadan gorunmez), sure (sn; sureli), dusun (yapilinca dusunce), kapi, hat
  const etki = (tip, x, h, egil, hedef, ek) => {
    const e = Object.assign({ tip: tip, x: x, y: z.y, h: h, egil: egil, hedef: hedef || [], yapildi: false, t: 0, s: 1, redT: 9 }, ek || {});
    B.etkiler.push(e);
    temiz(x - 250, x + 250);
    return e;
  };

  // 1 - orman kenari: uyanis
  z.malzeme('toprak').duz(300 + 720);
  kontrol(250);
  nesne('agac', 90, { boy: 330, tohum: 11 });
  nesne('agac', 520, { boy: 290, tohum: 12 });
  nesne('agac', 930, { boy: 350, tohum: 13 });
  dusunce(620, 'dBas');

  // 2 - hafif inis, eski yol
  z.yokus(600, 52);
  z.malzeme('asfalt').duz(460);
  nesne('lamba', z.x - 300, { titrek: true });
  nesne('araba', z.x - 120);
  dusunce(z.x - 330, 'dYol');

  // 3 - yokus yukari
  z.malzeme('toprak').yokus(640, -172);
  z.malzeme('beton').duz(280);
  nesne('lamba', z.x - 140);
  kontrol(z.x - 160);

  // 4 - merdiven + kirik kopru
  z.merdiven(8, 46, -22);
  z.duz(400);
  nesne('korkuluk', z.x - 395, { w: 390 });
  kontrol(z.x - 170);
  cukur(104);
  z.duz(250);
  nesne('lamba', z.x - 125);
  cukur(124);
  nesne('korkuluk', z.x + 10, { w: 300 });
  z.duz(330);
  kontrol(z.x - 200);

  // 5 - inis, konteynerler, uzun yokus asagi
  z.merdiven(6, 46, 22);
  z.malzeme('asfalt').duz(260);
  z.malzeme('metal');
  konteyner(62, 280, 62);
  konteyner(60, 240, 122);
  z.malzeme('toprak').yokus(700, 214);

  // 6 - alcak boru (egilme) + cokmus tabla (surunme)
  z.malzeme('asfalt');
  a0 = z.x; z.duz(1300);
  temiz(a0 + 250, a0 + 1300);
  kontrol(a0 + 150);
  nesne('lamba', a0 + 250, { titrek: true });
  ipucu(a0 + 340, 'ipEgil');
  alcak(a0 + 420, 230);
  kontrol(a0 + 720);
  ipucu(a0 + 800, 'ipSurun');
  dar(a0 + 890, 240);
  kontrol(a0 + 1215);

  // 7 - projektor kulesi 1
  a0 = z.x; z.duz(1560);
  dusunce(a0 + 60, 'dProj');
  ipucu(a0 + 230, 'ipSaklan');
  kule(a0, a0 + 1560, 8.4);
  siper(a0 + 330); siper(a0 + 770); siper(a0 + 1210);
  kontrol(z.x + 60);

  // 8 - yokus + dik merdiven (tirmanma)
  z.malzeme('toprak').yokus(420, -92);
  z.malzeme('beton').duz(380);
  nesne('lamba', z.x - 230);
  ipucu(z.x - 90, 'ipTirman');
  duvarCik(264);
  z.duz(560);
  nesne('korkuluk', z.x - 430, { w: 290 });
  kontrol(z.x - 430);

  // 9 - cati: curuk kalaslar, sonra merdivenle inis
  kalasli(150);
  z.duz(230);
  kalasli(170);
  z.duz(400);
  nesne('lamba', z.x - 210);
  kontrol(z.x - 320);
  ipucu(z.x - 70, 'ipIn');
  duvarIn(264);

  // 10 - fabrika: dugme + bariyer, presler, ust lazer, surunme lazeri
  z.malzeme('beton');
  a0 = z.x; z.duz(2400);
  temiz(a0, a0 + 2400);
  kontrol(a0 + 110);
  nesne('lamba', a0 + 120);
  dusunce(a0 + 400, 'dFab');
  ipucu(a0 + 200, 'ipEtk');
  etki('dugme', a0 + 235, 116, false, [bariyer(a0 + 315)]);
  pres(a0 + 430, 2.8, 0);
  pres(a0 + 730, 2.8, 1.2);
  lazer(a0 + 940, 270, 'ust');
  nesne('lamba', a0 + 1300, { titrek: true });
  kontrol(a0 + 1300);
  pres(a0 + 1510, 2.3, 0.3);
  pres(a0 + 1710, 2.3, 1.3);
  kontrol(a0 + 1880);
  ipucu(a0 + 1900, 'ipSurun');
  lazer(a0 + 1990, 230, 'surun');
  kontrol(a0 + 2320);

  // 11 - elektrikli avlu
  z.malzeme('asfalt');
  a0 = z.x; z.duz(1500);
  temiz(a0 + 150, a0 + 1350);
  nesne('araba', a0 + 500);
  elektrik(a0 + 300, 88, 3.0, 0);
  elektrik(a0 + 650, 88, 3.0, 1.5);
  lazer(a0 + 850, 76, 'alt');
  const e3 = elektrik(a0 + 1110, 150, 0, 0);          // atlanamaz: kablosu sokulmeli
  etki('kablo', a0 + 1030, 46, true, [e3], { kx: e3.x0 - 46 });
  nesne('lamba', a0 + 1340);
  kontrol(a0 + 1410);

  // 12 - tepeler: sivri demirler + cukurlar
  z.malzeme('toprak');
  z.yokus(360, -64);
  a0 = z.x; z.duz(270);
  diken(a0 + 95);
  temiz(a0 - 100, a0 + 400);
  nesne('agac', a0 - 180, { boy: 310, tohum: 21 });
  dusunce(a0 - 200, 'dOrta');
  z.yokus(300, 80);
  z.duz(210);
  nesne('agac', z.x - 120, { boy: 340, tohum: 22 });
  cukur(110);
  a0 = z.x; z.duz(310);
  kontrol(a0 + 45);
  diken(a0 + 130);
  z.yokus(340, -90);
  z.duz(190);
  nesne('agac', z.x - 250, { boy: 300, tohum: 23 });
  cukur(130);
  z.duz(300);
  nesne('agac', z.x - 90, { boy: 330, tohum: 24 });
  kontrol(z.x - 230);

  // 13 - merdiven, yuksek kopru, hareketli platform
  z.malzeme('beton').duz(200).merdiven(10, 46, -22);
  z.duz(360);
  nesne('korkuluk', z.x - 350, { w: 300 });
  nesne('lamba', z.x - 250);
  kontrol(z.x - 190);
  hareketli(520, 150, 9);
  z.duz(300);
  nesne('lamba', z.x - 150);
  kontrol(z.x - 210);
  cukur(140);
  z.duz(380);
  nesne('korkuluk', z.x - 360, { w: 340 });
  kontrol(z.x - 260);

  // 14 - devriye dronlari
  z.merdiven(8, 46, 22);
  z.malzeme('toprak');
  a0 = z.x; z.duz(1800);
  kontrol(a0 + 60);
  nesne('agac', a0 + 110, { boy: 320, tohum: 31 });
  dron(a0 + 220, a0 + 920, 6.6, 0);
  dron(a0 + 880, a0 + 1640, 7.6, 2.0);
  siper(a0 + 430); siper(a0 + 800); siper(a0 + 1170); siper(a0 + 1500);
  nesne('agac', a0 + 990, { boy: 290, tohum: 32 });
  kontrol(a0 + 1760);

  // 15 - projektor kulesi 2 + alt lazerler
  z.malzeme('asfalt');
  a0 = z.x; z.duz(1560);
  const k2 = kule(a0, a0 + 1560, 7.2);
  siper(a0 + 340); siper(a0 + 760); siper(a0 + 1200);
  etki('kablo', a0 + 800, 46, true, [k2], { kx: k2.kuleX });   // orta siperin arkasinda: kulenin fisi
  lazer(a0 + 530, 76, 'alt');
  lazer(a0 + 960, 76, 'alt');
  kontrol(z.x + 40);

  // 16 - konteynerler, vinc yolu (merdiven, cukur, kalas, pres). Ustteki dugme, asagidaki bariyeri acar
  z.duz(320);
  nesne('lamba', z.x - 120);
  z.malzeme('metal');
  konteyner(62, 260, 62);
  konteyner(60, 250, 122);
  z.malzeme('beton');
  duvarCik(264);
  z.duz(440);
  nesne('lamba', z.x - 260);
  kontrol(z.x - 340);
  cukur(116);
  z.duz(280);
  kalasli(180);
  a0 = z.x; z.duz(720);
  temiz(a0, a0 + 720);
  kontrol(a0 + 60);
  pres(a0 + 320, 2.5, 0);
  kontrol(a0 + 480);
  ipucu(a0 + 590, 'ipEtk');
  const eVinc = etki('dugme', a0 + 600, 116, false, []);
  duvarIn(386);
  z.malzeme('asfalt');
  a0 = z.x; z.duz(460);
  nesne('lamba', a0 + 240, { titrek: true });
  kontrol(a0 + 150);
  eVinc.hedef.push(bariyer(a0 + 330));

  // 17 - depo bulmacasi: sandigi plakaya it -> bariyer acilir -> otedeki dugme bariyeri kilitler ->
  //      geri don, sandigi yuksek sete kadar it, ustune cikip tirman
  a0 = z.x; z.duz(1150);
  temiz(a0 - 100, a0 + 1300);
  kontrol(a0 + 60);
  nesne('lamba', a0 + 150);
  dusunce(a0 + 130, 'dDepo');
  ipucu(a0 + 250, 'ipIt');
  const g17 = bariyer(a0 + 700);
  sandik(a0 + 260, a0 + 150, a0 + 1150);
  plaka(a0 + 480, [g17]);
  etki('dugme', a0 + 850, 116, false, [g17]);
  nesne('lamba', a0 + 960);
  z.malzeme('beton').set(-150);
  z.duz(620);
  nesne('korkuluk', z.x - 560, { w: 280 });
  kontrol(z.x - 520);

  // 18 - havalandirma tunelleri: surunerek, yanip sonen alt lazerleri zamanlayarak
  a0 = z.x; z.duz(1900);
  temiz(a0, a0 + 1900);
  dar(a0 + 120, 560);
  lazer(a0 + 300, 56, 'alt', 3.0, 0);
  lazer(a0 + 500, 56, 'alt', 3.0, 1.5);
  kontrol(a0 + 770);
  nesne('lamba', a0 + 800);
  pres(a0 + 930, 2.6, 0);
  dar(a0 + 1100, 480);
  lazer(a0 + 1250, 56, 'alt', 2.6, 0.4);
  lazer(a0 + 1420, 56, 'alt', 2.6, 1.7);
  kontrol(a0 + 1680);
  nesne('lamba', a0 + 1760, { titrek: true });

  // 19 - guc hucresi bulmacasi: bos yuva -> ileride hucre -> asansorde guc yok -> geri don, hucreyi tak ->
  //      guc gelince surunme lazeri ve pres de uyanir -> asansorle cik
  z.malzeme('asfalt');
  a0 = z.x; z.duz(2500);
  temiz(a0, a0 + 2700);
  kontrol(a0 + 80);
  nesne('lamba', a0 + 180);
  const lz19 = uyut(lazer(a0 + 520, 280, 'surun'));
  const pz19 = uyut(pres(a0 + 1000, 2.4, 0));
  kontrol(a0 + 1250);
  elektrik(a0 + 1560, 88, 2.8, 0);
  nesne('lamba', a0 + 1800);
  etki('hucre', a0 + 1900, 96, false, [], { verir: 'pil', dusun: 'dHucre' });
  const as19 = uyut(asansor(a0 + 2390, 110, 300));
  const yuva19 = etki('yuva', a0 + 270, 100, false, [], { gerek: 'pil', red: 'dGucYok', ac: [lz19, pz19, as19], dusun: 'dGucVar' });
  as19.guc = yuva19;
  dusunce(a0 + 2330, 'dAsansor', yuva19);
  nesne('lamba', a0 + 2240);
  yapiBas = z.x;
  z.malzeme('beton').set(-300);
  z.duz(520);
  nesne('korkuluk', z.x - 470, { w: 230 });
  kontrol(z.x - 430);

  // 20 - yuksek yol: hareketli platform, sureli bariyer (dugme -> 8 sn acik, arada surunulecek tabla), kalas
  hareketli(460, 150, 8.5);
  a0 = z.x; z.duz(1100);
  temiz(a0, a0 + 1100);
  kontrol(a0 + 60);
  nesne('lamba', a0 + 110);
  const g20 = bariyer(a0 + 760);
  etki('dugme', a0 + 170, 116, false, [g20], { sure: 8, dusun: 'dSure' });
  dar(a0 + 390, 200);
  kontrol(a0 + 960);
  kalasli(160);
  z.duz(420);
  nesne('lamba', z.x - 230);
  kontrol(z.x - 330);
  ipucu(z.x - 70, 'ipIn');
  duvarIn(450);

  // 21 - dron koridoru: saklanacak tek yer cokmus tablalarin alti (surunerek)
  z.malzeme('toprak');
  a0 = z.x; z.duz(1800);
  kontrol(a0 + 70);
  dusunce(a0 + 110, 'dYakin');
  nesne('agac', a0 + 150, { boy: 310, tohum: 35 });
  dron(a0 + 230, a0 + 1560, 8.0, 0);
  dar(a0 + 400, 200); dar(a0 + 840, 200); dar(a0 + 1260, 200);
  nesne('agac', a0 + 1100, { boy: 280, tohum: 36 });
  kontrol(a0 + 1740);

  // 22 - son yaklasim: ust lazer, elektrik, dron. Siperin arkasinda 1. guc hatti salteri
  z.yokus(560, 120);
  z.malzeme('asfalt');
  a0 = z.x; z.duz(1700);
  temiz(a0 + 100, a0 + 1700);
  lazer(a0 + 240, 250, 'ust');
  elektrik(a0 + 640, 92, 2.6, 0);
  kontrol(a0 + 810);
  dron(a0 + 950, a0 + 1500, 6.2, 0);
  siper(a0 + 1220);
  const hatA = etki('salter', a0 + 1220, 46, true, [], { red: 'dHatKilit', hat: true });
  kontrol(a0 + 1660);
  z.malzeme('toprak').yokus(420, -92);
  nesne('agac', z.x - 300, { boy: 300, tohum: 41 });

  // 23 - kasa kapisi bulmacasi: panele bas (kapi 2 guc hatti ister) -> geri donup 1. salteri ac ->
  //      kapinin otesinde tunelden surunup 2. salteri ac -> panele tekrar bas -> kapi acilir
  z.malzeme('beton').merdiven(6, 46, -22);
  const p0 = z.x; z.duz(1760);
  temiz(p0 - 600, p0 + 2400);
  const kapi = nesne('kapi', p0 + 640);
  kontrol(p0 + 120);
  ipucu(kapi.x - 330, 'ipEtk');
  const panel1 = etki('dugme', kapi.x - 285, 116, false, [], { dusun: 'dKilit' });
  hatA.kilit = [panel1];
  dar(p0 + 960, 300);
  lazer(p0 + 1085, 56, 'alt', 2.8, 0);
  nesne('lamba', p0 + 1420);
  const hatB = etki('salter', p0 + 1500, 116, false, [], { kilit: [panel1], red: 'dHatKilit', hat: true });
  etki('dugme', kapi.x - 285, 116, false, [], { onkosul: [panel1], kilit: [hatA, hatB], red: 'dKapiRed', kapi: true });
  B.hatlar = [hatA, hatB];
  B.oyunSonX = z.x;

  // 24 - kasanin ici (bitis sahnesi): oyun alanindan ayri bir oda, kapidan girince buraya gecilir
  z.bosluk(700);
  const r0 = z.x;
  z.duz(2400);
  z.bitir();
  nesne('oda', r0);
  B.oda = { x0: r0, x1: r0 + 2400, kaideX: r0 + 1250, y: z.y };

  for (const o of B.nesneler) o.y = z.yuk(o.x);
  B.zemin = z;
  B.uz = z.uz;
  B.kapi = kapi;
  B.bitisX = kapi.x - 285;
  B.baslaX = 250;
  return B;
}
