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

// Bolum kurucu: zemin + her bolumun kullandigi yardimcilar
function kurucu() {
  const z = new Zemin(-300, 540);
  const B = {
    nesneler: [], kontrol: [], gozculer: [], siperler: [], konteynerler: [], tirmanma: [],
    presler: [], elektrik: [], lazerler: [], dikenler: [], kalaslar: [], platformlar: [],
    alcaklar: [], ipuclari: [], temiz: [], etkiler: [], bariyerler: [], yapilar: [],
    sandiklar: [], plakalar: [], asansorler: [], dusunceler: [], hatlar: [],
    lambalar: [], dusmanlar: [], paletliler: [], nisanlar: [], asililar: [], kopruler: [],
    halkalar: [], suruler: [], buharlar: [], sallar: [], kovalar: [], fanlar: [], arilar: [], aynalar: [], taretler: [],
    dalgalar: [], nabizlar: [],
    tema: { ic: false }, oda: null, oyunSonX: 0
  };

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
  const yapiBasla = () => { yapiBas = z.x; };
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
    const l = { x0: x, x1: x + w, y: z.y, h: tip === 'ust' ? 124 : (tip === 'surun' ? 92 : 16), ust: tip !== 'alt', periyot: periyot ? periyot + 2.1 : 0, oran: 0.28, faz: faz || 0, acik: true };   // yanip sonenler: 1.4 sn acik, ~3.5 sn kapali (surunerek ucu ucuna)
    B.lazerler.push(l);
    return l;
  };
  const diken = (x) => { B.dikenler.push({ x0: x, x1: x + 84, y: z.y }); };
  // alcak gecitler: boru = egilerek (112 px), tabla = surunerek (86 px)
  // kot verilirse boru o kadar yuksektedir: yalnizca tasiyicinin ustundeyken egilmek gerekir
  const alcak = (x, w, kot) => { B.alcaklar.push({ x0: x, x1: x + w, y: z.y, h: 112, tip: 'boru', kot: kot || 0 }); };
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

  // ---- bolum 2 ve sonrasi ----
  // tavan lambasi: r yaricapinda aydinlatir; kapali baslayabilir (dugme / sigorta ile yanar)
  const tlamba = (x, kapali) => { const o = { x: x, y: z.y, h: 250, r: 175, kapali: !!kapali, kapali0: !!kapali }; B.lambalar.push(o); return o; };
  // golge: robot uy0..uy1 arasina girince uyanir, x0..x1 arasinda dolasir
  const golge = (bas, uy0, uy1, x0, x1) => {
    const d = { tip: 'golge', x: bas, bas: bas, y: z.y, x0: x0, x1: x1, uyanX0: uy0, uyanX1: uy1, hiz: 105, yon: 1, yon0: 1,
                uyanik: false, isik: false, isikT: 0, yanT: 0, adim: 0, olu: false, oluT: 0, kosT: 0, bekle: 0 };
    B.dusmanlar.push(d); temiz(x0 - 200, x1 + 200);
    return d;
  };
  // dortayak: x0..x1 arasinda devriye; zirhli olan lazerle olmez
  const dortayak = (x0, x1, zirhli) => {
    const d = { tip: 'dortayak', x: x0 + 40, bas: x0 + 40, y: z.y, x0: x0, x1: x1, hiz: 78, gor: 200, yon: 1, yon0: 1, zirhli: !!zirhli,
                kosT: 0, bekle: 0, adim: 0, olu: false, oluT: 0 };
    B.dusmanlar.push(d); temiz(x0 - 300, x1 + 300);
    return d;
  };
  // paletli tasiyici: a0..a1 arasinda gidip gelen, ustune binilen kati kutu. ters = sag uctan baslar
  const paletli = (a0, a1, ters) => {
    const x = ters ? a1 - 130 : a0;
    const p = { x0: x, x1: x + 130, w: 130, h: 76, ust: z.y - 76, taban: z.y, a0: a0, a1: a1, hiz: 90, yon: ters ? -1 : 1, yon0: ters ? -1 : 1, bekle: 1.2, bas: x };
    z.bloklar.push(p); B.paletliler.push(p); temiz(a0 - 200, a1 + 200);
    return p;
  };
  // lazerle vurulan hedef. tip: 'sigorta' | 'halat'. hedef kapatilir, ek.ac acilir
  const nisan = (tip, x, h, hedef, ek) => {
    const n = Object.assign({ tip: tip, x: x, y: z.y, h: h, hedef: hedef || [], ac: [], yapildi: false, t: 9 }, ek || {});
    B.nisanlar.push(n); temiz(x - 250, x + 250);
    return n;
  };
  // halatla asili sandik: halat vurulunca duser, itilebilir sandik olur (min..max)
  const asili = (x, h, min, max) => {
    const a = { x: x, yer: z.y, y0: z.y - h - 70, y: z.y - h - 70, vy: 0, durum: 0, min: min, max: max, s: null };
    B.asililar.push(a);
    nisan('halat', x + 38, h + 120, [], { asili: a });
    return a;
  };
  // geri cekili kopru: acilinca (sigorta) cukurun ustune uzanir
  const kopru = (w) => {
    const e = { x0: z.x, x1: z.x + w, y: z.y, aktif: false };
    z.ekler.push(e);
    const k = { e: e, kapali: true, kapali0: true };
    B.kopruler.push(k);
    cukur(w);
    return k;
  };
  // ---- bolum 3 ve sonrasi ----
  // kanca halkasi: h = zeminden yukseklik (asilan robotun ayaklari halkanin 188 px altinda kalir)
  const halka = (x, h) => { const o = { x: x, y: z.y - h }; B.halkalar.push(o); temiz(x - 250, x + 250); return o; };
  // halkali bosluk: ustunde halkalar dizili genis cukur; son halka karsi yakanin ustundedir
  const halkali = (w, h) => {
    const x0 = z.x, n = Math.ceil(w / 250);
    for (let i = 0; i < n; i++) halka(x0 + w * (i + 0.5) / n, h || 330);
    halka(x0 + w + 46, h || 330);
    cukur(w);
    return x0;
  };
  // fare surusu: yuva (boru agzi) x'inden cikar; robot x0..x1 arasinda zemindeyken kovalar. tikanir = onune sandik itilince cikamaz
  const suru = (yuva, x0, x1) => {
    const s = { tip: 'suru', yuva: yuva, x: yuva, y: z.y, x0: x0, x1: x1, min: Math.min(yuva, x0), max: Math.max(yuva, x1),
                durum: 0, t: 0, kapali: false, kapali0: false };
    B.suruler.push(s); temiz(yuva - 200, yuva + 200);
    return s;
  };
  // buhar: periyodik fiskirir (periyot 0 = hep acik; dugme / vana ile kesilir)
  const buhar = (x, periyot, faz) => { const b = { x: x, y: z.y, periyot: periyot, faz: faz || 0, acik: false, kapali: false, kapali0: false }; B.buharlar.push(b); return b; };
  // sal: su dolu cukurda, pistonlu bir samandira. dAlt / dUst = alcak ve yuksek konumu (z.y'ye gore); kol ile degisir
  const sal = (w, dAlt, dUst, yuksek) => {
    const e = { x0: z.x, x1: z.x + w, y: z.y + (yuksek ? dUst : dAlt), aktif: true };
    z.ekler.push(e);
    const s = { e: e, x0: z.x, x1: z.x + w, yAlt: z.y + dAlt, yUst: z.y + dUst, k: yuksek ? 1 : 0, kapali: !yuksek, kapali0: !yuksek };
    B.sallar.push(s);
    cukur(w);
    return s;
  };
  // sel: robot tetik'i gecince x0'dan x1'e ilerleyen su baskini
  const kovala = (tetik, x0, x1, hiz) => { const k = { tetik: tetik, x0: x0, x1: x1, hiz: hiz, x: x0, y: z.y, aktif: false }; B.kovalar.push(k); return k; };
  // fan: ustune gelen robotu h kadar yukari ufler
  const fan = (x, w, h, kapali) => { const f = { x0: x, x1: x + w, y: z.y, h: h, kapali: !!kapali, kapali0: !!kapali }; B.fanlar.push(f); temiz(x - 250, x + w + 250); return f; };
  // ari: yuk yuksekliginde x0..x1 arasinda gezen avci dron; havadaki robotu kovalar
  const ari = (x0, x1, yuk) => {
    const a = { tip: 'ari', x: x0, y: z.y - yuk, bx: x0, by: z.y - yuk, x0: x0, x1: x1, yon: 1, olu: false, oluT: 0, kizgin: 0, vy: 0 };
    B.arilar.push(a); temiz(x0 - 200, x1 + 200);
    return a;
  };
  // ayna: lazeri hedefine (sigorta ya da baska bir ayna) yansitir. hedef2 varsa salterle cevrilir
  const ayna = (x, h, hedef) => { const a = { tip: 'ayna', x: x, y: z.y - h, hedef: hedef, hedef2: null, t: 9, kapali: false, kapali0: false }; B.aynalar.push(a); temiz(x - 250, x + 250); return a; };
  // taret: x0..x1 arasindaki robota kilitlenip ates eder. zirhli olan lazerle susturulamaz
  const taret = (x, h, x0, x1) => {
    const t = { tip: 'taret', x: x, y: z.y - h, yer: z.y, x0: x0, x1: x1, kilit: 0, sus: 0, ates: 9, ac: 1.57, kapali: false, kapali0: false,
                zirhli: false, olu: false, yapildi: false };
    B.taretler.push(t); temiz(x0 - 100, x1 + 100);
    return t;
  };
  // enerji dalgasi: x0..x1 arasini yon yonunde supurur. guc = kalkandan goturdugu enerji
  const dalga = (x0, x1, periyot, faz, yon) => { const d = { x0: x0, x1: x1, y: z.y, periyot: periyot, faz: faz || 0, yon: yon || -1, x: -1e9, guc: 0.4, kapali: false, kapali0: false }; B.dalgalar.push(d); return d; };
  // cekirdegin nabzi: x0..x1 arasinda her periyotta bir atar
  const nabiz = (x0, x1, periyot, faz) => { const n = { x0: x0, x1: x1, y: z.y, periyot: periyot, faz: faz || 0 }; B.nabizlar.push(n); return n; };

  // bitis odasi (kasanin en ici): son bolumun sonuna eklenir
  const odaEkle = () => {
    B.oyunSonX = z.x;
    z.bosluk(700);
    const r0 = z.x;
    z.duz(2400);
    z.bitir();
    nesne('oda', r0);
    B.oda = { x0: r0, x1: r0 + 2400, kaideX: r0 + 1250, y: z.y };
  };
  const bitir = (kapi) => {
    if (!B.oyunSonX) B.oyunSonX = z.x;
    if (z.uz === undefined) z.bitir();
    for (const o of B.nesneler) o.y = z.yuk(o.x);
    B.zemin = z; B.uz = z.uz; B.kapi = kapi; B.bitisX = kapi.x - 285; B.baslaX = 250;
    return B;
  };
  return { z: z, B: B, nesne: nesne, kontrol: kontrol, temiz: temiz, ipucu: ipucu, dusunce: dusunce, uyut: uyut, cukur: cukur,
           kalasli: kalasli, hareketli: hareketli, duvarCik: duvarCik, duvarIn: duvarIn, konteyner: konteyner, siper: siper,
           kule: kule, dron: dron, pres: pres, elektrik: elektrik, lazer: lazer, diken: diken, alcak: alcak, dar: dar,
           bariyer: bariyer, sandik: sandik, plaka: plaka, asansor: asansor, etki: etki, tlamba: tlamba, golge: golge,
           dortayak: dortayak, paletli: paletli, nisan: nisan, asili: asili, kopru: kopru, yapiBasla: yapiBasla,
           halka: halka, halkali: halkali, suru: suru, buhar: buhar, sal: sal, kovala: kovala, fan: fan, ari: ari, ayna: ayna,
           taret: taret, dalga: dalga, nabiz: nabiz, odaEkle: odaEkle, bitir: bitir };
}

// ============ BOLUM 1 - YUZEY (yagmurlu sehir) ============
function bolum1() {
  const K = kurucu();
  const { z, B, nesne, kontrol, temiz, ipucu, dusunce, uyut, cukur, kalasli, hareketli, duvarCik, duvarIn, konteyner, siper,
          kule, dron, pres, elektrik, lazer, diken, alcak, dar, bariyer, sandik, plaka, asansor, etki, yapiBasla, bitir } = K;
  let a0 = 0;

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
  yapiBasla();
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
  return bitir(kapi);       // kapi acilinca 2. bolume gecilir
}

// ============ BOLUM 2 - ALT KATLAR (kasanin ici, karanlik) ============
// Yeni: omuz lazeri (dokunulan yere ates), golge (isikta durur, arkadan gelir, lamba altinda yanar),
// dortayak (devriye; arkadaki hucresinden vurulur, zirhlisi elektrikle / sandikla), paletli tasiyici (ustune binilir),
// sigorta kutulari ve halatlar (lazerle vurulur), uzanan kopruler.
function bolum2() {
  const K = kurucu();
  const { z, B, nesne, kontrol, temiz, ipucu, dusunce, uyut, cukur, kalasli, hareketli, duvarCik, duvarIn, siper,
          elektrik, lazer, alcak, dar, bariyer, sandik, asansor, etki, tlamba, golge, dortayak, paletli, nisan, asili,
          kopru, yapiBasla, odaEkle, bitir } = K;
  B.tema = { ic: true };
  let a0 = 0;
  const izgara = (x, w, uyuyan) => { const e = elektrik(x, w, 0, 0); e.izgara = true; return uyuyan ? uyut(e) : e; };

  // 1 - giris: kaidede omuz lazeri; bariyerin sigortasi yuksekte, lazerle vurulur
  z.malzeme('beton').duz(300 + 2100);
  kontrol(250);
  tlamba(420); tlamba(1250);
  dusunce(380, 'd2Bas');
  etki('silah', 760, 84, false, [], { verir: 'lazer', dusun: 'dLazer' });
  ipucu(1120, 'ipLazer');
  nisan('sigorta', 1440, 235, [bariyer(1560)]);
  kontrol(1700);

  // 2 - karanlik koridor: ilk golge arkadan gelir. Dugme lambayi yakar; golge isiga giremez
  a0 = z.x; z.duz(3000);
  kontrol(a0 + 60);
  ipucu(a0 + 300, 'ipGolge');
  golge(a0 + 150, a0 + 650, a0 + 3000, a0 + 60, a0 + 2700);
  dusunce(a0 + 720, 'dGolge');
  const l2 = tlamba(a0 + 1350, true);
  etki('dugme', a0 + 1230, 116, false, [], { ac: [l2], dusun: 'dIsik' });
  kontrol(a0 + 1360);
  dar(a0 + 1700, 420);
  kontrol(a0 + 2300);
  tlamba(a0 + 2500);
  duvarCik(220);

  // 3 - ust kat: sandigi sete it; golge arkadan yaklasir (don, bak, yine it)
  a0 = z.x; z.duz(1700);
  kontrol(a0 + 120); tlamba(a0 + 150);
  golge(a0 + 420, a0 + 900, a0 + 1700, a0 + 380, a0 + 1690);
  ipucu(a0 + 780, 'ipIt');
  dusunce(a0 + 960, 'dArkam');
  sandik(a0 + 1000, a0 + 950, a0 + 1700);
  z.set(-150); z.duz(900);
  tlamba(z.x - 700); kontrol(z.x - 720);
  ipucu(z.x - 80, 'ipIn');
  duvarIn(370);

  // 4 - dortayak devriyeleri: siperde bekle, donunce arkasindaki hucreye ates et
  a0 = z.x; z.duz(3300);
  kontrol(a0 + 150); tlamba(a0 + 200);
  dusunce(a0 + 300, 'dDort'); ipucu(a0 + 430, 'ipDort');
  siper(a0 + 560);
  dortayak(a0 + 780, a0 + 1700);
  tlamba(a0 + 1250);
  siper(a0 + 1920); kontrol(a0 + 1920);
  dortayak(a0 + 2220, a0 + 3000);
  tlamba(a0 + 2600);
  kontrol(a0 + 3220);

  // 5 - zirhli dortayak + elektrik izgarasi: salterle izgaraya elektrik ver, olunce kapat, gec
  a0 = z.x; z.duz(2300);
  kontrol(a0 + 80);
  dusunce(a0 + 130, 'dZirh'); ipucu(a0 + 240, 'ipSalter');
  tlamba(a0 + 320); tlamba(a0 + 1010);
  const iz5 = izgara(a0 + 800, 420, true);
  etki('salter', a0 + 300, 116, false, [], { cevir: [iz5] });
  dortayak(a0 + 580, a0 + 1600, true);
  tlamba(a0 + 2100); kontrol(a0 + 2150);

  // 6 - paletli tasiyici: ustune bin, elektrikli zemini onunla gec; alcak borularin altinda egil
  a0 = z.x; z.duz(2400);
  kontrol(a0 + 60); tlamba(a0 + 180);
  dusunce(a0 + 100, 'dPalet'); ipucu(a0 + 210, 'ipBin');
  izgara(a0 + 520, 1000);
  paletli(a0 + 340, a0 + 1740);
  alcak(a0 + 820, 150, 76); alcak(a0 + 1180, 150, 76);
  tlamba(a0 + 1000); tlamba(a0 + 1900); kontrol(a0 + 1950);

  // 7 - asili sandik: halati vur, sandik duser (altindaki dortayagi ezer); sandigi sete it, tirman
  a0 = z.x; z.duz(1500);
  kontrol(a0 + 60); tlamba(a0 + 250);
  dusunce(a0 + 150, 'dHalat'); ipucu(a0 + 310, 'ipHalat');
  siper(a0 + 420);
  asili(a0 + 760, 250, a0 + 500, a0 + 1500);
  dortayak(a0 + 580, a0 + 1300);
  tlamba(a0 + 1050);
  z.set(-150); z.duz(700);
  kontrol(z.x - 560); tlamba(z.x - 500);

  // 8 - iki golge, uc lamba: ortadaki lambanin sigortasini vur (guvenli ada). Yan lambalari salterle
  //     yak / sondur: lambanin altinda kalan golge yanar
  a0 = z.x; z.duz(2100);
  kontrol(a0 + 60);
  ipucu(a0 + 330, 'ipSigorta');
  golge(a0 + 140, a0 + 520, a0 + 2100, a0 + 100, a0 + 1900);
  golge(a0 + 1880, a0 + 520, a0 + 2100, a0 + 100, a0 + 1900);
  const lo = tlamba(a0 + 1050, true), ls = tlamba(a0 + 720, true), lg = tlamba(a0 + 1380, true);
  nisan('sigorta', a0 + 1050, 240, [], { ac: [lo], dusun: 'dAda' });
  etki('salter', a0 + 1000, 116, false, [], { cevir: [ls] });
  etki('salter', a0 + 1100, 116, false, [], { cevir: [lg] });
  duvarCik(300);

  // 9 - ust galeri: sigortayi vurunca uzanan kopruler, dar platformda dortayak, kalas, hareketli platform
  a0 = z.x; z.duz(500);
  kontrol(a0 + 120); tlamba(a0 + 200);
  dusunce(a0 + 160, 'dKopru');
  const k1 = kopru(300);
  nisan('sigorta', k1.e.x0 - 70, 200, [], { ac: [k1] });
  z.duz(760);
  dortayak(z.x - 640, z.x - 110);
  tlamba(z.x - 380);
  const k2 = kopru(340);
  nisan('sigorta', k2.e.x1 + 90, 260, [], { ac: [k2] });        // karsi yakada: ucurumun ustunden vurulur
  z.duz(420);
  kontrol(z.x - 300); tlamba(z.x - 210);
  kalasli(170);
  z.duz(300);
  hareketli(480, 150, 8.5);
  z.duz(520);
  kontrol(z.x - 400); tlamba(z.x - 300);
  ipucu(z.x - 70, 'ipIn');
  duvarIn(450);

  // 10 - buyuk salon: golge arkada, zirhli dortayak onde. Sigorta lambalari yakar (ada); salter izgarayi
  a0 = z.x; z.duz(2700);
  kontrol(a0 + 80);
  golge(a0 + 200, a0 + 600, a0 + 2700, a0 + 150, a0 + 1150);
  const la = tlamba(a0 + 900, true), lb = tlamba(a0 + 560, true);
  nisan('sigorta', a0 + 900, 250, [], { ac: [la, lb] });
  const iz10 = izgara(a0 + 1500, 420, true);
  etki('salter', a0 + 960, 116, false, [], { cevir: [iz10] });
  dortayak(a0 + 1270, a0 + 2200, true);
  tlamba(a0 + 2450); kontrol(a0 + 2520);

  // 11 - iki paletli: ilkinden ikincisine atla (ortada bulusurlar)
  a0 = z.x; z.duz(3000);
  kontrol(a0 + 60); tlamba(a0 + 150);
  izgara(a0 + 480, 2000);
  paletli(a0 + 320, a0 + 1480);
  paletli(a0 + 1500, a0 + 2660, true);
  alcak(a0 + 760, 140, 76); alcak(a0 + 1900, 140, 76);
  tlamba(a0 + 1490); tlamba(a0 + 2760); kontrol(a0 + 2800);

  // 12 - surunme tunelleri: yanip sonen lazerler. Arkadan golge gelir: once lambanin sigortasini vur
  a0 = z.x; z.duz(2600);
  kontrol(a0 + 60);
  golge(a0 + 120, a0 + 420, a0 + 2600, a0 + 80, a0 + 2300);
  const l12 = tlamba(a0 + 620, true);
  nisan('sigorta', a0 + 620, 240, [], { ac: [l12] });
  dar(a0 + 820, 520);
  lazer(a0 + 1000, 56, 'alt', 3.0, 0);
  lazer(a0 + 1200, 56, 'alt', 3.0, 1.5);
  kontrol(a0 + 1450); tlamba(a0 + 1560);
  dar(a0 + 1750, 420);
  lazer(a0 + 1920, 56, 'alt', 2.6, 0.5);
  kontrol(a0 + 2300); tlamba(a0 + 2400);

  // 13 - suru: uc dortayak. Ikisi arkadan vurulur ya da ustune sandik dusurulur; ucuncusu zirhli (yalnizca sandik)
  a0 = z.x; z.duz(3500);
  kontrol(a0 + 80); tlamba(a0 + 160);
  siper(a0 + 420);
  dortayak(a0 + 640, a0 + 1300);
  tlamba(a0 + 1000);
  siper(a0 + 1420);
  asili(a0 + 1700, 250, a0 + 1500, a0 + 2350);
  dortayak(a0 + 1600, a0 + 2180);
  tlamba(a0 + 1900);
  siper(a0 + 2440); kontrol(a0 + 2440);
  asili(a0 + 2900, 250, a0 + 2760, a0 + 3400);
  dortayak(a0 + 2700, a0 + 3250, true);
  tlamba(a0 + 2960);
  kontrol(a0 + 3470);

  // 14 - karanlikta tasiyici beklerken arkana bak: golge yaklasir, paletli agir agir gelir
  a0 = z.x; z.duz(2200);
  kontrol(a0 + 30);
  golge(a0 + 110, a0 + 250, a0 + 2200, a0 + 70, a0 + 430);
  dusunce(a0 + 260, 'dBekle');
  izgara(a0 + 520, 1100);
  paletli(a0 + 340, a0 + 1790);
  tlamba(a0 + 2000); kontrol(a0 + 1960);

  // 15 - asansor kuyusu: sigorta asansoru calistirir; yukarida sureli bariyer + surunme
  a0 = z.x; z.duz(900);
  kontrol(a0 + 60); tlamba(a0 + 300);
  const as15 = uyut(asansor(a0 + 790, 110, 320));
  nisan('sigorta', a0 + 690, 300, [], { ac: [as15], dusun: 'dGucVar' });
  yapiBasla();
  z.set(-320); z.duz(1500);
  kontrol(z.x - 1380); tlamba(z.x - 1300);
  const g15 = bariyer(z.x - 500);
  etki('dugme', z.x - 1150, 116, false, [g15], { sure: 8, dusun: 'dSure' });
  dar(z.x - 930, 200);
  kontrol(z.x - 380); tlamba(z.x - 300);
  ipucu(z.x - 70, 'ipIn');
  duvarIn(320);

  // 16 - son salon: kapinin uc sigortasi ates edilerek acilir; arkadan iki golge gelir.
  //      Ucu de vurulunca kapi lambasi yanar (guvenli) ve panel calisir
  a0 = z.x; z.duz(2600);
  kontrol(a0 + 100); tlamba(a0 + 180);
  dusunce(a0 + 700, 'dSonKapi');
  golge(a0 + 420, a0 + 900, a0 + 2600, a0 + 380, a0 + 1700);
  golge(a0 + 540, a0 + 1150, a0 + 2600, a0 + 380, a0 + 1700);
  const lk = tlamba(a0 + 1880, true);
  const kapi = nesne('kapi', a0 + 2150);
  const s1 = nisan('sigorta', a0 + 1500, 150, [], {}), s2 = nisan('sigorta', a0 + 1640, 255, [], {}), s3 = nisan('sigorta', a0 + 1780, 195, [], {});
  s1.grup = s2.grup = s3.grup = [s1, s2, s3];
  s1.grupAc = s2.grupAc = s3.grupAc = [lk];
  etki('dugme', kapi.x - 285, 116, false, [], { kilit: [s1, s2, s3], red: 'dUcSigorta', kapi: true });
  B.hatlar = [s1, s2, s3];
  temiz(a0, a0 + 3000);
  return bitir(kapi);
}

// ============ BOLUM 3 - KANALLAR (kanalizasyon: kanca, fareler, buhar, yukselen su) ============
function bolum3() {
  const K = kurucu();
  const { z, B, nesne, kontrol, temiz, ipucu, dusunce, cukur, kalasli, hareketli, duvarCik, duvarIn, alcak, dar,
          sandik, etki, tlamba, nisan, kopru, halka, halkali, suru, buhar, sal, kovala, bitir } = K;
  B.tema = { ic: true, su: true, renk: '34,74,48' };
  let a0 = 0;
  const ada = (x) => { sandik(x, x, x + 76); kontrol(x + 38); };     // oynamayan sandik: farelerin cikamadigi ada

  // 1 - giris: kaidede kanca. Ilk su kanali halkalara tutunarak gecilir
  z.malzeme('beton').duz(300 + 1500);
  kontrol(250); tlamba(420); tlamba(1250);
  dusunce(380, 'd3Bas');
  etki('silah', 760, 84, false, [], { verir: 'kanca', dusun: 'dKanca' });
  ipucu(1160, 'ipKanca');
  kontrol(1380);
  ipucu(z.x + 215, 'ipBirak');
  halkali(430);
  z.duz(800);
  kontrol(z.x - 700); tlamba(z.x - 560);

  // 2 - ilk fareler: arkadaki borudan cikar, zeminde kosarlar. Sandigin ustune cikamazlar; lazer dagitir
  a0 = z.x; z.duz(2500);
  kontrol(a0 + 60); tlamba(a0 + 240);
  dusunce(a0 + 200, 'dFare'); ipucu(a0 + 560, 'ipFare');
  suru(a0 + 130, a0 + 430, a0 + 2380);
  ada(a0 + 900); tlamba(a0 + 1060);
  ada(a0 + 1560); tlamba(a0 + 1720);
  kontrol(a0 + 2440);
  duvarCik(190);

  // 3 - ust kanal: halkalarin arasinda buhar fiskirir; ardindan raya asili platform
  a0 = z.x; z.duz(600);
  kontrol(a0 + 120); tlamba(a0 + 250);
  dusunce(a0 + 280, 'dBuhar'); ipucu(a0 + 520, 'ipBuhar');
  buhar(z.x + 250, 3.4, 0); buhar(z.x + 500, 3.4, 1.7);
  halkali(750);
  z.duz(700);
  kontrol(z.x - 580); tlamba(z.x - 430);
  hareketli(560, 150, 8);
  z.duz(500);
  kontrol(z.x - 400); tlamba(z.x - 300);
  ipucu(z.x - 70, 'ipIn');
  duvarIn(190);

  // 4 - yukselen su: sala bin, karsidaki kolu kancayla cek; su yukselir, sal ust kata cikar
  a0 = z.x; z.duz(1000);
  kontrol(a0 + 100); tlamba(a0 + 320);
  dusunce(a0 + 560, 'dSal'); ipucu(a0 + 840, 'ipKol');
  const s4 = sal(340, 0, -200);
  nisan('kol', z.x + 80, 290, [], { cevir: [s4] });
  z.set(-200); z.duz(800);
  kontrol(z.x - 640); tlamba(z.x - 520);

  // 5 - buhar koridoru: onde buhar, arkada fareler. Adada bekle, buhar kesilince kos
  a0 = z.x; z.duz(2700);
  kontrol(a0 + 60);
  dusunce(a0 + 300, 'dSikis');
  suru(a0 + 110, a0 + 420, a0 + 2250);
  ada(a0 + 620); buhar(a0 + 880, 3.2, 0); tlamba(a0 + 760);
  ada(a0 + 1100); buhar(a0 + 1360, 3.2, 1.2);
  ada(a0 + 1580); buhar(a0 + 1830, 3.2, 0); buhar(a0 + 1960, 3.2, 0.5); tlamba(a0 + 1720);
  kontrol(a0 + 2330); tlamba(a0 + 2460);

  // 6 - inen su: kol suyu bosaltir, sal asagi iner. Alt tunelde sandigi sete kadar it; fareler pesinde
  a0 = z.x; z.duz(800);
  kontrol(a0 + 100); tlamba(a0 + 300);
  dusunce(a0 + 420, 'dDerin');
  const s6 = sal(320, 240, 0, true);
  nisan('kol', a0 + 690, 250, [], { cevir: [s6] });
  z.set(240);
  a0 = z.x; z.duz(2000);
  kontrol(a0 + 90); tlamba(a0 + 200);
  suru(a0 + 300, a0 + 560, a0 + 1990);
  dusunce(a0 + 700, 'dSandikFare');
  sandik(a0 + 820, a0 + 760, a0 + 2000);
  tlamba(a0 + 1400);
  z.set(-150); z.duz(700);
  kontrol(z.x - 560); tlamba(z.x - 430);

  // 7 - zemin farelerin: boru ortada. Halkadan halkaya gec, yere basma; arada buhar
  a0 = z.x; z.duz(2700);
  kontrol(a0 + 80); tlamba(a0 + 200);
  dusunce(a0 + 260, 'dZemin'); ipucu(a0 + 440, 'ipZemin');
  suru(a0 + 1350, a0 + 520, a0 + 2180);
  for (let i = 0; i < 6; i++) halka(a0 + 760 + i * 310, 330);
  buhar(a0 + 1535, 3.6, 0);
  tlamba(a0 + 915); tlamba(a0 + 1845);
  kontrol(a0 + 2420); tlamba(a0 + 2520);

  // 8 - vana: dugme buhari kisa sure keser. Kos, halkalardan gec, buhar yeniden acilmadan cik
  a0 = z.x; z.duz(760);
  kontrol(a0 + 80); tlamba(a0 + 240);
  dusunce(a0 + 200, 'dVana');
  const p8 = z.x;
  const b8 = [buhar(p8 + 173, 0, 0), buhar(p8 + 347, 0, 0)];
  halkali(520);
  z.duz(900);
  b8.push(buhar(p8 + 850, 0, 0), buhar(p8 + 940, 0, 0));
  etki('dugme', a0 + 330, 116, false, b8, { sure: 10, dusun: 'dSure' });
  kontrol(z.x - 330); tlamba(z.x - 250);

  // 9 - iki sal, tek kol: biri cikarken oteki iner. Iki kez cek, iki kat yuksel
  a0 = z.x; z.duz(700);
  kontrol(a0 + 100); tlamba(a0 + 300);
  dusunce(a0 + 380, 'dIkiSal');
  const sA = sal(300, 0, -200);
  z.set(-200); z.duz(240);
  const kx9 = z.x - 120;
  kontrol(kx9);
  const sB = sal(300, 0, -200, true);
  nisan('kol', kx9, 260, [], { cevir: [sA, sB] });
  z.set(-200); z.duz(700);
  kontrol(z.x - 560); tlamba(z.x - 430);

  // 10 - karsidaki kol kopruyu uzatir; ardindan curuk kalaslar
  const k10 = kopru(360);
  nisan('kol', z.x + 60, 150, [], { ac: [k10] });
  z.duz(600);
  kontrol(z.x - 480); tlamba(z.x - 380);
  kalasli(170); z.duz(260); kalasli(170); z.duz(500);
  kontrol(z.x - 380); tlamba(z.x - 280);
  ipucu(z.x - 70, 'ipIn');
  duvarIn(400);

  // 11 - buyuk havuz: uzun halka dizileri, ortada raya asili platform, buhar
  a0 = z.x; z.duz(700);
  kontrol(a0 + 100); tlamba(a0 + 300);
  dusunce(a0 + 400, 'dHavuz');
  buhar(z.x + 400, 3.0, 0);
  halkali(800);
  z.duz(240);
  kontrol(z.x - 120);
  hareketli(620, 150, 9);
  z.duz(240);
  kontrol(z.x - 120); tlamba(z.x - 120);
  buhar(z.x + 225, 3.0, 0); buhar(z.x + 675, 3.0, 1.5);
  halkali(900);
  z.duz(800);
  kontrol(z.x - 660); tlamba(z.x - 520);

  // 12 - boruyu tika: sandigi fare borusunun onune it. Yoksa surunme tunelinde yakalarlar
  a0 = z.x; z.duz(3000);
  kontrol(a0 + 80); tlamba(a0 + 200);
  dusunce(a0 + 300, 'dTika'); ipucu(a0 + 600, 'ipTika');
  sandik(a0 + 560, a0 + 500, a0 + 1076);
  suru(a0 + 1000, a0 + 400, a0 + 2900).tikanir = true;
  tlamba(a0 + 1000); kontrol(a0 + 1250);
  dar(a0 + 1700, 700);
  kontrol(a0 + 2520); tlamba(a0 + 2700);

  // 13 - yukari: basamak basamak yukselen duvarlar, her birinin ustunde bir halka (kancayla tirman)
  a0 = z.x; z.duz(500);
  kontrol(a0 + 100); tlamba(a0 + 250);
  dusunce(a0 + 300, 'dTirman');
  for (let i = 0; i < 4; i++) {
    z.set(-170); halka(z.x + 70, 330); z.duz(i < 3 ? 420 : 700);
    if (i === 1) kontrol(z.x - 300);
  }
  kontrol(z.x - 560); tlamba(z.x - 420);

  // 14 - sel: arkadan su baskini gelir. Durmadan kos: bosluklari atla, borularin altindan egil, halkalara tutun
  a0 = z.x; z.duz(900);
  kontrol(a0 + 80); tlamba(a0 + 260);
  dusunce(a0 + 440, 'dSel');
  const t14 = a0 + 700;
  z.duz(500); cukur(110); z.duz(600);
  alcak(z.x - 330, 150);
  kontrol(z.x - 60); tlamba(z.x - 60);
  z.duz(500); halkali(430); z.duz(700);
  alcak(z.x - 420, 150);
  cukur(110); z.duz(420); kontrol(z.x - 300); tlamba(z.x - 300); cukur(120); z.duz(700);
  alcak(z.x - 380, 170);
  z.duz(300);
  kovala(t14, t14 - 520, z.x - 150, 168);
  duvarCik(260);
  z.duz(600);
  kontrol(z.x - 480); tlamba(z.x - 380);
  dusunce(z.x - 420, 'dSelBitti');

  // 15 - pompa odasi: kapi uc kol ister. Biri buharin ardinda, biri fare zemininin ustunde, biri suyun karsisinda
  a0 = z.x; z.duz(1500);
  kontrol(a0 + 100); tlamba(a0 + 300);
  dusunce(a0 + 420, 'dPompa');
  buhar(a0 + 900, 3.0, 0); buhar(a0 + 1010, 3.0, 0.6);
  const k1 = nisan('kol', a0 + 1250, 240, [], {});
  const b0 = z.x; z.duz(1900);
  kontrol(b0 + 60); tlamba(b0 + 150);
  suru(b0 + 1000, b0 + 380, b0 + 1560);
  for (let i = 0; i < 4; i++) halka(b0 + 640 + i * 330, 330);
  const k2 = nisan('kol', b0 + 1135, 520, [], {});
  kontrol(b0 + 1760); tlamba(b0 + 1800);
  const c0 = z.x; z.duz(500);
  kontrol(c0 + 100); tlamba(c0 + 250);
  const p15 = z.x, kp = kopru(560);
  halka(p15 + 200, 330);
  const k3 = nisan('kol', z.x + 60, 160, [], { ac: [kp] });
  z.duz(1700);
  kontrol(z.x - 1560); tlamba(z.x - 1400);
  const kapi = nesne('kapi', z.x - 450);
  tlamba(kapi.x - 430);
  k1.grup = k2.grup = k3.grup = [k1, k2, k3]; k1.grupAc = k2.grupAc = k3.grupAc = [];
  k1.grupDusun = k2.grupDusun = k3.grupDusun = true;
  etki('dugme', kapi.x - 285, 116, false, [], { kilit: [k1, k2, k3], red: 'd3Kilit', kapi: true });
  B.hatlar = [k1, k2, k3];
  temiz(z.x - 1900, z.x + 400);
  return bitir(kapi);
}

// ============ BOLUM 4 - CATILAR (firtinali catilar: sirt iticisi, fanlar, arilar, taretler, aynalar) ============
function bolum4() {
  const K = kurucu();
  const { z, B, nesne, kontrol, temiz, ipucu, dusunce, cukur, hareketli, siper, lazer,
          etki, nisan, kopru, halka, fan, ari, ayna, taret, bitir } = K;
  B.tema = { ic: false, firtina: true };
  let a0 = 0;
  const lamba = (x) => nesne('lamba', x);

  // 1 - cati: kaidede sirt iticisi. Ilk bosluk ziplayarak gecilmez; ikincisinin karsisi daha yuksek
  z.malzeme('beton').duz(300 + 1500);
  kontrol(250); lamba(450); lamba(1250);
  dusunce(380, 'd4Bas');
  etki('silah', 760, 84, false, [], { verir: 'jet', dusun: 'dJet' });
  ipucu(1260, 'ipJet');
  kontrol(1380);
  cukur(270); z.duz(700);
  kontrol(z.x - 600); lamba(z.x - 420);
  cukur(250); z.set(-170); z.duz(800);
  kontrol(z.x - 680); lamba(z.x - 500);
  dusunce(z.x - 620, 'dYakit');

  // 2 - havalandirma: fan robotu yukari ufler. Ikinci fan kapali: sigortasini vur
  a0 = z.x; z.duz(900);
  dusunce(a0 + 300, 'dFan'); ipucu(a0 + 600, 'ipFan');
  fan(a0 + 740, 160, 500);
  z.set(-400); z.duz(900);
  kontrol(z.x - 780); lamba(z.x - 600);
  const f2 = fan(z.x - 160, 160, 500, true);
  nisan('sigorta', z.x - 340, 220, [], { ac: [f2] });
  z.set(-400); z.duz(800);
  kontrol(z.x - 680); lamba(z.x - 520);

  // 3 - arilar: boslugun ustunde devriye gezen avci dronlar. Havadayken kovalarlar; lazerle dusur ya da yere in
  a0 = z.x; z.duz(900);
  dusunce(a0 + 300, 'dAri'); ipucu(a0 + 620, 'ipAri');
  ari(a0 + 820, a0 + 1300, 210);
  cukur(290); z.duz(600);
  kontrol(z.x - 480); lamba(z.x - 380);
  ari(z.x - 100, z.x + 420, 190); ari(z.x + 380, z.x + 900, 260);
  cukur(280); z.duz(260); cukur(280); z.duz(800);
  kontrol(z.x - 680); lamba(z.x - 520);

  // 4 - taret: direkteki nisanci. Gorunce kilitlenir; siperin arkasinda egil ya da gozunu vur (bir sure susar)
  a0 = z.x; z.duz(2600);
  kontrol(a0 + 80); lamba(a0 + 200);
  dusunce(a0 + 300, 'dTaret'); ipucu(a0 + 540, 'ipTaret');
  siper(a0 + 620);
  taret(a0 + 1100, 300, a0 + 700, a0 + 1500);
  siper(a0 + 900); siper(a0 + 1160); siper(a0 + 1420);
  kontrol(a0 + 1620); lamba(a0 + 1700);
  taret(a0 + 2150, 300, a0 + 1800, a0 + 2500).zirhli = true;
  siper(a0 + 1960); siper(a0 + 2200); siper(a0 + 2420);
  kontrol(a0 + 2560);

  // 5 - ayna: kafesli sigorta dogrudan vurulmaz. Aynaya ates et, isin sigortaya yansir; kopru uzanir
  a0 = z.x; z.duz(900);
  kontrol(a0 + 80); lamba(a0 + 220);
  dusunce(a0 + 320, 'dAyna'); ipucu(a0 + 600, 'ipAyna');
  const k5 = kopru(520);
  const s5 = nisan('sigorta', a0 + 420, 330, [], { ac: [k5], ayna: true });
  ayna(a0 + 780, 300, s5);
  z.duz(800);
  kontrol(z.x - 680); lamba(z.x - 520);

  // 6 - yukselen catilar: her bosluk bir kat yukari; arada arilar
  a0 = z.x; z.duz(500);
  dusunce(a0 + 200, 'dYuksel');
  for (let i = 0; i < 4; i++) {
    if (i === 1 || i === 3) ari(z.x - 60, z.x + 330, 330);
    cukur(220); z.set(-150); z.duz(i === 3 ? 800 : 380);
    if (i === 1) kontrol(z.x - 300);
  }
  kontrol(z.x - 680); lamba(z.x - 520);

  // 7 - ayna makasi: salter aynayi cevirir. Bir yonde kopru sigortasi, oteki yonde fan sigortasi
  a0 = z.x; z.duz(1000);
  kontrol(a0 + 80); lamba(a0 + 220);
  dusunce(a0 + 300, 'dMakas');
  const k7 = kopru(480);
  z.duz(700);
  const f7 = fan(z.x - 160, 160, 500, true);
  const s7a = nisan('sigorta', a0 + 380, 340, [], { ac: [k7], ayna: true });
  const s7b = nisan('sigorta', a0 + 620, 360, [], { ac: [f7], ayna: true });
  ayna(a0 + 880, 290, s7a).hedef2 = s7b;
  etki('salter', a0 + 760, 116, false, [], { cevir: [B.aynalar[B.aynalar.length - 1]] });
  z.set(-400); z.duz(800);
  kontrol(z.x - 680); lamba(z.x - 520);

  // 8 - halka + itici: bosluk cok genis. Uc, havada halkaya tutun (yakit dolar), firla, yine uc
  a0 = z.x; z.duz(700);
  kontrol(a0 + 80); lamba(a0 + 220);
  dusunce(a0 + 300, 'dHavada'); ipucu(a0 + 560, 'ipHavada');
  halka(z.x + 520, 380);
  cukur(900); z.duz(700);
  kontrol(z.x - 600); lamba(z.x - 450);
  halka(z.x + 330, 380); halka(z.x + 760, 380); ari(z.x + 200, z.x + 900, 150);
  cukur(1100); z.duz(800);
  kontrol(z.x - 680); lamba(z.x - 520);

  // 9 - zirhli taret + fan: yukselirken acikta kalirsin. Aynadan sigortasini vur, taret kapanir
  a0 = z.x; z.duz(1600);
  kontrol(a0 + 80); lamba(a0 + 220);
  dusunce(a0 + 400, 'dZirhTaret');
  const t9 = taret(a0 + 1250, 620, a0 + 1000, a0 + 1640); t9.zirhli = true;
  const s9 = nisan('sigorta', a0 + 1130, 430, [t9], { ayna: true });
  siper(a0 + 900);
  ayna(a0 + 620, 330, s9);
  fan(a0 + 1440, 160, 500);
  z.set(-400); z.duz(800);
  kontrol(z.x - 680); lamba(z.x - 520);

  // 10 - dar catilar: kisa catilar, genis bosluklar, arilar ve yanip sonen lazer
  a0 = z.x; z.duz(600);
  kontrol(a0 + 80); lamba(a0 + 220);
  for (let i = 0; i < 5; i++) {
    if (i % 2 === 0) ari(z.x - 40, z.x + 560, 240 - i * 10);
    cukur(300); z.duz(250);
    if (i === 1 || i === 3) lazer(z.x - 150, 56, 'alt', 2.6, i);
    if (i === 2) kontrol(z.x - 125);
  }
  z.duz(600);
  kontrol(z.x - 480); lamba(z.x - 380);

  // 11 - tek guc hatti: ayni anda yalnizca bir fan doner. Yukari cik, sigortayi yukaridan vur, guc oteki fana gecer
  a0 = z.x; z.duz(900);
  kontrol(a0 + 80); lamba(a0 + 220);
  dusunce(a0 + 300, 'dIkiFan');
  const fA = fan(a0 + 740, 160, 500);
  const hy = z.y;
  z.set(-400); z.duz(1000);
  const fB = fan(z.x - 160, 160, 500, true);
  B.nisanlar.push({ tip: 'sigorta', x: a0 + 560, y: hy, h: 300, hedef: [], ac: [], cevir: [fA, fB], yapildi: false, t: 9 });
  kontrol(z.x - 880); lamba(z.x - 700);
  z.set(-400); z.duz(800);
  kontrol(z.x - 680); lamba(z.x - 520);

  // 12 - gozetim altinda: taret raya asili platformu izler; ardindan iki taretin gordugu halkali bosluk
  a0 = z.x; z.duz(800);
  kontrol(a0 + 80); lamba(a0 + 220);
  dusunce(a0 + 300, 'dGozetim');
  siper(a0 + 600);
  taret(a0 + 1150, 330, a0 + 700, a0 + 1640);
  hareketli(760, 150, 9.5);
  z.duz(500);
  siper(z.x - 380); kontrol(z.x - 380); lamba(z.x - 200);
  taret(z.x + 350, 430, z.x + 80, z.x + 700); taret(z.x + 760, 430, z.x + 450, z.x + 1100);
  halka(z.x + 300, 380); halka(z.x + 700, 380);
  cukur(1000); z.duz(900);
  siper(z.x - 760); kontrol(z.x - 680); lamba(z.x - 500);

  // 13 - arilar yuvasi: uc bosluk, alti ari. Once hepsini dusur ya da aralarindan sec
  a0 = z.x; z.duz(600);
  kontrol(a0 + 80); lamba(a0 + 220);
  for (let i = 0; i < 3; i++) {
    ari(z.x - 60, z.x + 340, 170 + i * 40); ari(z.x + 40, z.x + 420, 300 - i * 30);
    cukur(290); z.set(i === 1 ? 120 : -120); z.duz(420);
    if (i === 1) kontrol(z.x - 210);
  }
  z.duz(500);
  kontrol(z.x - 400); lamba(z.x - 300);

  // 14 - anten: kopru uc kilit ister. Karsidaki kol, aynali sigorta ve boslugun ortasinda, asiliyken vurulan sigorta
  a0 = z.x; z.duz(1200);
  kontrol(a0 + 80); lamba(a0 + 220);
  dusunce(a0 + 400, 'dAnten');
  const q3 = nisan('kol', a0 + 520, 400, [], {});
  const q2 = nisan('sigorta', a0 + 760, 420, [], { ayna: true });
  ayna(a0 + 1040, 320, q2);
  const k14 = kopru(1100);
  halka(a0 + 1530, 380);
  const q1 = nisan('sigorta', a0 + 2060, 300, [], {});
  ari(a0 + 1300, a0 + 2200, 120);
  q1.grup = q2.grup = q3.grup = [q1, q2, q3]; q1.grupAc = q2.grupAc = q3.grupAc = [k14];
  q1.grupDusun = q2.grupDusun = q3.grupDusun = true;
  z.duz(1900);
  kontrol(z.x - 1780); lamba(z.x - 1600);
  const kapi = nesne('kapi', z.x - 450);
  lamba(kapi.x - 430);
  etki('dugme', kapi.x - 285, 116, false, [], { kapi: true });
  B.hatlar = [q1, q2, q3];
  temiz(z.x - 2000, z.x + 400);
  return bitir(kapi);
}

// ============ BOLUM 5 - CEKIRDEK (kalkan, enerji dalgalari, cekirdegin nabzi; sonunda bitis odasi) ============
function bolum5() {
  const K = kurucu();
  const { z, B, nesne, kontrol, temiz, ipucu, dusunce, cukur, siper, elektrik, bariyer, etki, tlamba, golge, dortayak, paletli,
          nisan, kopru, halka, halkali, fan, ari, ayna, taret, dalga, nabiz, odaEkle, bitir } = K;
  B.tema = { ic: true, renk: '92,28,18' };
  let a0 = 0;

  // 1 - giris: kaidede kalkan. Ilk taret zirhli: egil, kalkan atesi geri yollar
  z.malzeme('beton').duz(300 + 2300);
  kontrol(250); tlamba(420); tlamba(1250);
  dusunce(380, 'd5Bas');
  etki('silah', 760, 84, false, [], { verir: 'kalkan', dusun: 'dKalkan' });
  ipucu(1180, 'ipKalkan');
  kontrol(1300);
  taret(1900, 300, 1380, 2250).zirhli = true;
  kontrol(2280);

  // 2 - dalga koridoru: enerji dalgasi koridoru supurur. Dalgaya don, egil
  a0 = z.x; z.duz(2600);
  kontrol(a0 + 60); tlamba(a0 + 200);
  dusunce(a0 + 260, 'dDalga'); ipucu(a0 + 520, 'ipDalga');
  dalga(a0 + 400, a0 + 2300, 5.2, 0, -1);
  tlamba(a0 + 1350); kontrol(a0 + 1350); kontrol(a0 + 2400);

  // 3 - iki yonden dalga: biri onden, biri arkadan. Her seferinde gelene don
  a0 = z.x; z.duz(2400);
  kontrol(a0 + 60); tlamba(a0 + 200);
  dusunce(a0 + 300, 'dArkaDalga');
  dalga(a0 + 300, a0 + 2200, 5.6, 0, 1);
  dalga(a0 + 300, a0 + 2200, 5.6, 2.8, -1);
  kontrol(a0 + 1250); tlamba(a0 + 1250); kontrol(a0 + 2300);

  // 4 - nabiz: cekirdek belli araliklarla atar. Atarken kalkanin ardinda ya da siperde ol
  a0 = z.x; z.duz(2800);
  kontrol(a0 + 60); tlamba(a0 + 200);
  dusunce(a0 + 260, 'dNabiz'); ipucu(a0 + 540, 'ipNabiz');
  nabiz(a0 + 500, a0 + 2700, 4.2);
  siper(a0 + 900); siper(a0 + 1500); siper(a0 + 2100);
  kontrol(a0 + 1500); tlamba(a0 + 1650); kontrol(a0 + 2750);

  // 5 - nabiz + golge: egildiginde sirtin donuk kalir, golge yaklasir. Ortadaki lambanin sigortasini vur
  a0 = z.x; z.duz(2800);
  kontrol(a0 + 60);
  dusunce(a0 + 300, 'dNabizGolge');
  golge(a0 + 150, a0 + 500, a0 + 2800, a0 + 100, a0 + 2500);
  nabiz(a0 + 500, a0 + 2500, 3.6);
  const l5 = tlamba(a0 + 1400, true);
  nisan('sigorta', a0 + 1250, 240, [], { ac: [l5] });
  kontrol(a0 + 1400); tlamba(a0 + 2650); kontrol(a0 + 2600);

  // 6 - capraz ates: biri arkanda, biri onunde iki zirhli taret. Kalkan tek yone bakar: sirayla don
  a0 = z.x; z.duz(2400);
  kontrol(a0 + 60); tlamba(a0 + 200);
  dusunce(a0 + 300, 'dCapraz');
  taret(a0 + 350, 300, a0 + 600, a0 + 1900).zirhli = true;
  taret(a0 + 1700, 300, a0 + 900, a0 + 1900).zirhli = true;
  siper(a0 + 1200);
  kontrol(a0 + 2000); tlamba(a0 + 2100);

  // 7 - halkalar + dalga: asiliyken dalga altindan gecer; adaya inince kalkan
  a0 = z.x; z.duz(700);
  kontrol(a0 + 60); tlamba(a0 + 200);
  halkali(700); z.duz(900);
  dalga(z.x - 800, z.x - 100, 3.4, 0, -1);
  kontrol(z.x - 860);
  halkali(600); z.duz(700);
  kontrol(z.x - 600); tlamba(z.x - 450);

  // 8 - zirhli bekci: ustunden uc, pesine tak. Dalganin yoluna girince yanar
  a0 = z.x; z.duz(2600);
  kontrol(a0 + 60); tlamba(a0 + 200);
  dusunce(a0 + 300, 'dDalgaBekci');
  siper(a0 + 420);
  dortayak(a0 + 700, a0 + 1100, true);
  dalga(a0 + 1200, a0 + 2300, 6.0, 0, -1);
  kontrol(a0 + 2400); tlamba(a0 + 2450);

  // 9 - tasiyici + dalga: paletlinin ustunde elektrikli zemini gecerken dalga gelir; ustunde egil
  a0 = z.x; z.duz(2800);
  kontrol(a0 + 60); tlamba(a0 + 180);
  dusunce(a0 + 240, 'dTasiDalga');
  elektrik(a0 + 560, 1500, 0, 0).izgara = true;
  paletli(a0 + 380, a0 + 2240);
  dalga(a0 + 500, a0 + 2300, 5.0, 0, -1);
  tlamba(a0 + 1300); tlamba(a0 + 2400); kontrol(a0 + 2450);

  // 10 - fan kuyusu + nabiz: havada kalkan yok. Nabizdan hemen sonra kos, yuksel
  a0 = z.x; z.duz(1200);
  kontrol(a0 + 60); tlamba(a0 + 200);
  dusunce(a0 + 300, 'dKuyu');
  siper(a0 + 800);
  nabiz(a0 + 500, a0 + 1300, 3.8);
  fan(a0 + 1040, 160, 500);
  z.set(-400); z.duz(900);
  kontrol(z.x - 780); tlamba(z.x - 600);

  // 11 - hendekler: dalga cok guclu ve sik, kalkan yetmez. Hendege in, ustunden gecsin
  a0 = z.x; z.duz(500);
  dusunce(a0 + 200, 'dHendek');
  const d0 = z.x;
  for (let i = 0; i < 4; i++) { z.duz(360); z.set(60); z.duz(170); z.set(-60); if (i === 1) kontrol(z.x + 60); }
  z.duz(500);
  dalga(d0 + 60, z.x - 300, 2.3, 0, -1).guc = 0.7;
  kontrol(z.x - 200); tlamba(z.x - 150);

  // 12 - ayna zinciri: salter aynayi cevirir. Bir yonde lamba (golgeden korur), oteki yonde ikinci ayna -> bariyer
  a0 = z.x; z.duz(2600);
  kontrol(a0 + 60); tlamba(a0 + 150);
  dusunce(a0 + 300, 'dZincir');
  golge(a0 + 200, a0 + 600, a0 + 2600, a0 + 150, a0 + 1500);
  const lz1 = tlamba(a0 + 1100, true), g12 = bariyer(a0 + 1750);
  const sL = nisan('sigorta', a0 + 940, 420, [], { ac: [lz1], ayna: true });
  const sG = nisan('sigorta', a0 + 1960, 300, [g12], { ayna: true });
  const mB = ayna(a0 + 1560, 400, sG);
  const mA = ayna(a0 + 1300, 300, sL); mA.hedef2 = mB;
  etki('salter', a0 + 1160, 116, false, [], { cevir: [mA] });
  kontrol(a0 + 1100); kontrol(a0 + 2000); tlamba(a0 + 2200);

  // 13 - ucurum: uc, havada halkaya tutun; nabiz atan kisa adalarda siper; ari bekcisi
  a0 = z.x; z.duz(700);
  kontrol(a0 + 60); tlamba(a0 + 200);
  dusunce(a0 + 300, 'dUcurum');
  halka(z.x + 430, 380); ari(z.x + 100, z.x + 800, 140);
  cukur(760); z.duz(420);
  siper(z.x - 210); kontrol(z.x - 210);
  nabiz(z.x - 420, z.x, 3.4);
  cukur(300); z.duz(420);
  siper(z.x - 210); kontrol(z.x - 210);
  nabiz(z.x - 420, z.x, 3.4, 1.7);
  halkali(700);
  z.duz(800);
  kontrol(z.x - 660); tlamba(z.x - 500);

  // 14 - son savunma: dalga onden, zirhli taret tepeden
  a0 = z.x; z.duz(2600);
  kontrol(a0 + 60); tlamba(a0 + 200);
  dusunce(a0 + 300, 'dSavunma');
  dalga(a0 + 500, a0 + 2300, 5.4, 0, -1);
  taret(a0 + 1500, 300, a0 + 700, a0 + 2200).zirhli = true;
  siper(a0 + 1000);
  kontrol(a0 + 2400); tlamba(a0 + 2450);

  // 15 - cekirdek kapisi: uc kilit. Zirhli taret (atesini geri yolla), aynali sigorta, ucurumun karsisindaki kol
  a0 = z.x; z.duz(2200);
  kontrol(a0 + 80); tlamba(a0 + 250);
  dusunce(a0 + 500, 'dCekirdek');
  nabiz(a0 + 400, a0 + 2100, 4.6);
  siper(a0 + 700); siper(a0 + 1500); kontrol(a0 + 1500);
  const q1 = taret(a0 + 1150, 300, a0 + 800, a0 + 1450); q1.zirhli = true;
  const q2 = nisan('sigorta', a0 + 1250, 430, [], { ayna: true });
  ayna(a0 + 1780, 300, q2);
  const p15 = z.x, kp = kopru(560);
  halka(p15 + 230, 380);
  const q3 = nisan('kol', z.x + 70, 300, [], { ac: [kp] });
  q2.grup = q3.grup = [q1, q2, q3]; q2.grupAc = q3.grupAc = []; q2.grupDusun = q3.grupDusun = true;
  z.duz(1900);
  kontrol(z.x - 1780); tlamba(z.x - 1600);
  const kapi = nesne('kapi', z.x - 450);
  tlamba(kapi.x - 430);
  etki('dugme', kapi.x - 285, 116, false, [], { kilit: [q1, q2, q3], red: 'd5Kilit', kapi: true });
  B.hatlar = [q1, q2, q3];
  temiz(z.x - 2000, z.x + 800);
  odaEkle();
  return bitir(kapi);
}

const BOLUM_SAYI = 5;      // toplam bolum sayisi (sinyal yuzdesi buna gore dolar)
const BOLUM_HAZIR = 5;     // yapilmis bolum sayisi; bitis odasi son bolumun sonunda
function bolumKur(no) {
  return [bolum1, bolum2, bolum3, bolum4, bolum5][clamp(no, 1, BOLUM_HAZIR) - 1]();
}
