// Son Sinyal - ana dongu, kamera, katmanlar, isik, hava, tehditler, bulmacalar, etkilesim, bitis sahnesi
'use strict';

(function () {
  const cv = document.getElementById('oyun');
  const sahne = document.getElementById('sahne');
  const dEtk = document.getElementById('dEtk');
  const ctx = cv.getContext('2d');
  const H = CFG.H;
  let W = 1280, rs = 1;
  let G, gx, maske, mx, gok, vinyet;
  const MS = 1 / 3;   // isik maskesi olcegi

  const prm = new URLSearchParams(location.search);
  const dbgX = prm.has('x') ? parseFloat(prm.get('x')) : null;
  const dbgOto = prm.get('oto') === '1';

  let B, Z, robot;
  const cam = { x: 0, y: 0 };
  let camMin = 0, camMax = 0;
  let durum = 'yukleniyor';     // giris | oyun | geri | kapida | final
  let dZaman = 0, zaman = 0, girisT = 0, karart = 1, geriNeden = '';
  let kontrolX = 250, alarm = 0, uyari = 0, sars = 0;
  let kapiAc = false, kapiAcik = 0;
  let etkYakin = null, etkSecili = null, etkOnceki = false;
  let tasinan = null;                              // tasinan nesne ('pil')
  let dsn = null;                                  // robotun o anki dusuncesi {ad, t}
  let icerde = false;                              // kasanin icindeki oda
  const F = { faz: 0, t: 0, temas: 0, elde: false, soz: {}, ex: 0, ey: 0, px: 0, py: 0, beyaz: 0 };
  let video = null, kamDurum = 'yok';              // yok | istek | var | red
  const isaret = { bas: false, x: 0, y: 0, yeni: false, kullanildi: false, sonAsagi: -9 };
  const sev = { t: 0, bekle: 0, sira: 0, elSira: 0 };       // gizli oksama + dokunma cumleleri    // parmak / fare (mantiksal ekran koordinati)
  let bolumNo = 1, acT = 9;                                 // hangi bolum; bolum acilis karartmasi
  const yet = { lazer: false, kanca: false, jet: false, kalkan: false, miknatis: false, yem: false, kus: false, agir: false };                             // kazanilan yetenekler
  const lz = { sog: 0, t: 9, x0: 0, y0: 0, x1: 0, y1: 0, ax: 1, ay: 0 };   // omuz lazeri
  const olm = { tip: '', y: 0 };                            // son olumun turu (sahnesi icin)
  let kiv = [], tasT = 9, tasX = 0, tasY = 0, itilen = null;
  let katman = [], onPlan = [], yagmur = [], toz = [], sicrama = [];
  const girdi = { x: 0, zipla: false, egil: false, etk: false };
  const tus = {};
  const dok = { sol: false, sag: false, zipla: false, egil: false, etk: false };

  // olay sesi (audio.js varsa). uzak = sesin kaynagi; uzaklastikca kisilir
  const ses = (ad, uzakX, g) => {
    if (typeof SES === 'undefined' || !SES.cal) return;
    const k = uzakX === undefined || uzakX === null ? 1 : clamp(1 - Math.abs(uzakX - robot.x) / 1000, 0, 1);
    SES.cal(ad, k * (g === undefined ? 1 : g));
  };

  // gorseli mantiksal olcusuyle bas (gorseller ekrandan daha yuksek cozunurlukte uretilir)
  const bas = (c, sp, x, y) => { c.drawImage(sp, x, y, sp.lw, sp.lh); };
  const gorunur = (e) => !e.onkosul || e.onkosul.every((k) => k.yapildi);
  const secilir = (e) => !e.yapildi && gorunur(e) && !e.uzak;      // uzak = yalnizca kusun basabildigi
  const gecis = (t, a, b, s) => clamp(Math.min((t - a) / s, (b - t) / s), 0, 1);

  // ---------- kurulum ----------
  function boyutla() {
    const gw = window.innerWidth, gh = window.innerHeight;
    // telefon dik tutuluyorsa sahne 90 derece cevrilir: oyun her zaman yatay
    const dik = gh > gw;
    const iw = dik ? gh : gw, ih = dik ? gw : gh;
    sahne.style.width = iw + 'px'; sahne.style.height = ih + 'px';
    sahne.style.transform = dik ? 'translateX(' + gw + 'px) rotate(90deg)' : 'none';
    const oran = clamp(iw / ih, CFG.minOran, CFG.maxOran);
    W = Math.round(H * oran);
    let cw = iw, ch = iw / oran;
    if (ch > ih) { ch = ih; cw = ih * oran; }
    cv.style.width = Math.round(cw) + 'px';
    cv.style.height = Math.round(ch) + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    rs = clamp(ch * dpr / H, 0.6, 2);
    cv.width = Math.round(W * rs); cv.height = Math.round(H * rs);
    G = tuvalYap(cv.width, cv.height); gx = G.getContext('2d');
    maske = tuvalYap(W * MS, H * MS); mx = maske.getContext('2d');
    gok = Sanat.gokYap(W, H);
    vinyet = Sanat.vinyetYap(W, H);
    if (B) kameraSinir();
    if (!yagmur.length) for (let i = 0; i < 150; i++) yagmur.push({ x: Math.random() * 2600, y: Math.random() * H, h: 900 + Math.random() * 500, u: 14 + Math.random() * 22 });
  }

  function kameraSinir() {
    if (icerde) { camMin = B.oda.x0; camMax = Math.max(B.oda.x0, B.oda.x1 - W); }
    else { camMin = 0; camMax = B.oyunSonX - W; }
  }

  // tam ekran + yatay kilit
  function tamEkran() {
    const d = document, el = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      const cik = d.exitFullscreen || d.webkitExitFullscreen;
      if (cik) cik.call(d);
      return;
    }
    const iste = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!iste) return;
    const kilitle = () => {
      try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* desteklenmiyor */ }
    };
    let s = null;
    try { s = iste.call(el); } catch (e) { return; }
    if (s && s.then) s.then(kilitle).catch(() => {}); else kilitle();
  }

  // on kamera: goruntu yalnizca bu cihazda, bitis sahnesindeki ekranda gosterilir; hicbir yere gonderilmez
  function kameraAc() {
    if (kamDurum !== 'yok') return;
    kamDurum = 'istek';
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { kamDurum = 'red'; return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
        .then((akis) => {
          video = document.createElement('video');
          video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
          video.srcObject = akis;
          return video.play();
        })
        .then(() => { kamDurum = 'var'; })
        .catch(() => { kamDurum = 'red'; });
    } catch (e) { kamDurum = 'red'; }
  }
  function kameraKapat() {
    try { if (video && video.srcObject) video.srcObject.getTracks().forEach((t) => t.stop()); } catch (e) { /* bos */ }
    video = null; kamDurum = 'yok';
  }

  function katmanKur() {
    const r = rngYap(77), s = Sanat.s;
    const yap = (p, py, taban, renk, liste) => ({ p: p, py: py, taban: taban, renk: renk, o: liste, tel: [] });
    // 1 - uzak sehir
    let l = [], x = -200, son = B.uz * 0.08 + 2800;
    while (x < son) { const sp = r.sec(s.binaUzak); l.push({ sp: sp, x: x, k: r.ar(0.9, 1.5) }); x += sp.lw * r.ar(0.5, 1.3); }
    katman.push(yap(0.08, 0.05, 0.60, '#1b2a33', l));
    // 2 - harabeler
    l = []; x = -300; son = B.uz * 0.22 + 2800;
    while (x < son) { const sp = r.sec(s.binaOrta); l.push({ sp: sp, x: x, k: r.ar(0.9, 1.35) }); x += sp.lw * r.ar(0.7, 2.4); }
    katman.push(yap(0.22, 0.12, 0.655, '#111c23', l));
    // 3 - agaclar, direkler, citler
    l = []; x = -300; son = B.uz * 0.48 + 2800;
    const k3 = yap(0.48, 0.28, 0.72, '#0a1318', l);
    let direkX = 120;
    while (x < son) {
      const z = r();
      if (z < 0.5) { l.push({ sp: r.sec(s.yakinlar), x: x, k: r.ar(0.8, 1.25) }); x += r.ar(120, 360); }
      else if (z < 0.75) { l.push({ sp: s.cit, x: x, k: 1 }); x += 300; if (r() < 0.6) { l.push({ sp: s.cit, x: x, k: 1 }); x += 300; } x += r.ar(60, 260); }
      else x += r.ar(120, 300);
    }
    while (direkX < son) { l.push({ sp: s.direk, x: direkX, k: 1, direk: true }); k3.tel.push(direkX); direkX += r.ar(330, 420); }
    katman.push(k3);

    // on plan: oyun alanini kapatmayacak yerlere
    const yasak = (wx) => {
      for (const t of B.temiz) if (wx > t[0] && wx < t[1]) return true;
      return false;
    };
    const op = 1.55;
    x = 1750;
    while (x < B.oyunSonX * op + 600) {
      const wx = x / op;              // kabaca hangi oyun konumunda ekrana gelir
      const tip = r();
      if (yasak(wx)) { if (tip < 0.5) onPlan.push({ sp: s.on[r() < 0.5 ? 2 : 3], x: x, k: r.ar(1, 1.5) }); }
      else if (tip < 0.34) onPlan.push({ sp: s.on[0], x: x, k: r.ar(1, 1.3), cevir: r() < 0.5 });
      else if (tip < 0.52) onPlan.push({ sp: s.on[1], x: x, k: 1 });
      else if (tip < 0.82) onPlan.push({ sp: s.on[r() < 0.5 ? 2 : 3], x: x, k: r.ar(1.2, 1.9) });
      else onPlan.push({ sp: s.on[4], x: x, k: r.ar(1, 1.4) });
      x += r.ar(520, 1150);
    }
  }

  // giris gorseli = yukleme cubugu: siyah ekran %0, gorsel soldan saga acildikca yuzde artar
  function basla() {
    const yk = document.getElementById('yukle'), yg = document.getElementById('yukleGorsel'), yy = document.getElementById('yukleYuzde');
    const adimlar = Sanat.hazirlaAdim();
    const toplam = (Sanat.hazirlaAdim.toString().match(/yield;/g) || []).length + 1;
    let biten = 0, bitti = false, gosterilen = 0, son = 0, bekle = 0, hazir = false;
    const goster = (k) => {
      const p = (k * 104 - 4).toFixed(2);     // yumusak kenar
      const m = 'linear-gradient(90deg, #000 ' + p + '%, transparent ' + (+p + 4) + '%)';
      yg.style.webkitMaskImage = m; yg.style.maskImage = m;
      yy.textContent = '%' + Math.floor(k * 100);
    };
    goster(0);
    const resim = new Image();
    resim.onload = resim.onerror = () => { yg.style.backgroundImage = 'url(assets/giris.jpg)'; hazir = true; };
    resim.src = 'assets/giris.jpg';
    const kare = (t) => {
      const dt = son ? Math.min(0.05, (t - son) / 1000) : 0; son = t;
      if (hazir && !bitti) {
        const t0 = performance.now();
        while (performance.now() - t0 < 14) {
          if (adimlar.next().done) {
            boyutla(); bolumYukle(1); bitti = true;
            window.addEventListener('resize', boyutla);
            window.addEventListener('orientationchange', () => setTimeout(boyutla, 120));
            document.addEventListener('fullscreenchange', () => setTimeout(boyutla, 120));
            document.addEventListener('webkitfullscreenchange', () => setTimeout(boyutla, 120));
            break;
          }
          biten++;
        }
      }
      const hedef = bitti ? 1 : (hazir ? Math.min(0.97, biten / toplam) : 0);
      gosterilen = Math.min(hedef, gosterilen + dt / 1.6);      // en az ~1.6 sn'de dolar, gorsel gorunsun
      goster(gosterilen);
      if (bitti && gosterilen >= 1) {
        bekle += dt;
        if (bekle > 0.7) {
          yk.style.opacity = '0';
          requestAnimationFrame(dongu);
          setTimeout(() => yk.remove(), 900);
          return;
        }
      }
      requestAnimationFrame(kare);
    };
    requestAnimationFrame(kare);
  }

  // tam = true: dugmeler, fisler, sandiklar, kapi da basa doner
  function tehlikeSifirla(tam) {
    alarm = 0;
    ekSifirla(tam);
    for (const g of B.gozculer) g.t = 0;
    for (const d of B.dusmanlar) {
      if (tam) d.olu = false;
      if (!d.olu) { d.x = d.bas; d.yon = d.yon0; d.uyanik = false; d.kosT = 0; d.isikT = 0; d.yanT = 0; d.bekle = 0; d.isik = false; }
    }
    for (const p of B.platformlar) { p.t = 0; p.e.x0 = p.c0; p.e.x1 = p.c0 + p.w; }
    for (const k of B.kalaslar) { k.t = -1; k.dy = 0; k.vy = 0; k.e.aktif = true; }
    for (const a of B.asansorler) { a.t = 0; a.k = 0; a.ust = a.yAlt; }
    if (tam) {
      const hepsi = [B.gozculer, B.presler, B.lazerler, B.elektrik, B.bariyerler, B.asansorler, B.lambalar, B.kopruler];
      for (const liste of hepsi) for (const o of liste) { o.kapali = !!o.kapali0; o.kalici = false; }
      for (const g of B.gozculer) { g.in = 0; g.guc = g.kapali ? 0 : 1; }
      for (const e of B.etkiler) { e.yapildi = false; e.t = 0; e.kalan = 0; e.redT = 9; }
      for (const s of B.sandiklar) { s.x0 = s.bas; s.x1 = s.bas + s.w; }
      for (const d of B.dusunceler) d.oldu = false;
      kapiAc = false; kapiAcik = 0; tasinan = null; dsn = null;
      for (const n of B.nisanlar) { n.yapildi = false; n.t = 9; n.konum = false; }
      for (const p of B.paletliler) { p.x0 = p.bas; p.x1 = p.bas + p.w; p.yon = p.yon0; p.bekle = 1.2; }
      for (const a of B.asililar) {
        if (a.s) { Z.bloklar.splice(Z.bloklar.indexOf(a.s), 1); B.sandiklar.splice(B.sandiklar.indexOf(a.s), 1); a.s = null; }
        a.durum = 0; a.y = a.y0; a.vy = 0;
      }
    }
  }

  function yenidenBasla() {
    kameraKapat();
    icerde = false; kameraSinir();
    F.faz = 0; F.t = 0; F.temas = 0; F.elde = false; F.soz = {}; F.beyaz = 0;
    kontrolX = B.baslaX;
    yet.lazer = bolumNo > 2; yet.kanca = bolumNo > 3; yet.jet = bolumNo > 4; yet.kalkan = bolumNo > 5;
    yet.miknatis = bolumNo > 6; yet.yem = bolumNo > 7; yet.kus = bolumNo > 8; yet.agir = bolumNo > 9;     // onceki bolumlerde kazanilan yetenekler
    lz.t = 9; lz.sog = 0; kiv.length = 0; tasT = 9; itilen = null; acT = 9; olm.tip = '';
    tehlikeSifirla(true);
    robot.minX = 40; robot.maxX = B.oyunSonX - 60;
    if (dbgX !== null) {
      robot.sifirla(dbgX); kontrolX = dbgX; durum = 'oyun'; karart = 0;
    } else if (bolumNo > 1) {
      robot.sifirla(B.baslaX); durum = 'oyun'; karart = 1; acT = 0;      // sonraki bolumler: dogrudan baslar
    } else {
      robot.sifirla(B.baslaX); robot.cokme = 1; robot.kilit = true; durum = 'giris'; karart = 1;
    }
    dZaman = 0; girisT = dbgX !== null ? 99 : 0;
    robot.kilit = durum === 'giris';
    cam.x = clamp(robot.x - W * 0.42, camMin, camMax); cam.y = robot.y - H * 0.70;
  }

  // ---------- girdi ----------
  window.addEventListener('keydown', (e) => {
    tus[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].indexOf(e.code) >= 0) e.preventDefault();
    if (durum === 'final' && F.faz === 5 && F.t > 7) yenidenBasla();
  });
  window.addEventListener('keyup', (e) => { tus[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in tus) tus[k] = false; for (const k in dok) dok[k] = false; isaret.bas = false; });
  [['dSol', 'sol'], ['dSag', 'sag'], ['dZip', 'zipla'], ['dEgil', 'egil'], ['dEtk', 'etk']].forEach((c) => {
    const el = document.getElementById(c[0]);
    if (!el) return;
    const ac = (e) => { e.preventDefault(); dok[c[1]] = true; el.classList.add('bas'); };
    const kapa = (e) => { e.preventDefault(); dok[c[1]] = false; el.classList.remove('bas'); };
    el.addEventListener('pointerdown', ac); el.addEventListener('pointerup', kapa);
    el.addEventListener('pointercancel', kapa); el.addEventListener('pointerleave', kapa);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  const dTam = document.getElementById('dTam');
  if (dTam) {
    dTam.addEventListener('click', (e) => { e.preventDefault(); tamEkran(); });
    dTam.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  // ekrana dogrudan dokunma: etkilesim noktasina dokununca robot gidip onu kullanir; bitiste el parmagi izler
  function isaretOku(e) {
    const cw = cv.clientWidth || 1, ch = cv.clientHeight || 1;
    const ey = isaret.y;
    isaret.x = e.offsetX * W / cw; isaret.y = e.offsetY * H / ch;
    // robotun ustunde yukaridan asagi cekilen parmak = oksama
    if (isaret.bas && isaret.y - ey > 0.5 && robot && Math.abs(isaret.x + cam.x - robot.x) < 75 && isaret.y + cam.y > robot.y - 210 && isaret.y + cam.y < robot.y + 25) isaret.sonAsagi = zaman;
  }
  cv.addEventListener('pointerdown', (e) => {
    isaretOku(e); isaret.bas = true; isaret.yeni = true;
    if (durum === 'final' && F.faz === 5 && F.t > 7) yenidenBasla();
  });
  cv.addEventListener('pointermove', (e) => { isaretOku(e); });
  const isaretBirak = () => { isaret.bas = false; };
  cv.addEventListener('pointerup', isaretBirak);
  cv.addEventListener('pointercancel', isaretBirak);
  cv.addEventListener('pointerleave', isaretBirak);

  function girdiOku() {
    let x = 0;
    if (tus.ArrowLeft || tus.KeyA || dok.sol) x -= 1;
    if (tus.ArrowRight || tus.KeyD || dok.sag) x += 1;
    if (dbgOto) x = 1;
    girdi.x = x;
    girdi.zipla = !!(tus.Space || tus.ArrowUp || tus.KeyW || dok.zipla);
    girdi.egil = !!(tus.ArrowDown || tus.KeyS || dok.egil);
    girdi.etk = !!(tus.KeyE || tus.KeyF || tus.Enter || dok.etk);
  }

  // ---------- guncelleme ----------
  function tozEkle(x, y, adet, yay, guc) {
    for (let i = 0; i < adet; i++) toz.push({ x: x + (Math.random() - 0.5) * yay, y: y - 2, vx: (Math.random() - 0.5) * guc, vy: -12 - Math.random() * 40, o: 0, s: 0.6 + Math.random() * 0.4, b: 4 + Math.random() * 6 });
  }

  function dusun(ad) { if (CFG.metin[ad]) dsn = { ad: ad, t: 0 }; }
  // listeden siradaki cumle (ayni cumle ust uste gelmez)
  function dusunSira(liste, alan) {
    const l = CFG.metin[liste];
    if (!l || !l.length) return;
    dsn = { metin: l[sev[alan] % l.length], t: 0 };
    sev[alan]++;
  }
  // gizli: robot 5 sn boyunca tekrar tekrar yukaridan asagi oksanirsa bunu hisseder
  function sevGuncelle(dt) {
    sev.bekle -= dt;
    if (durum === 'oyun' && zaman - isaret.sonAsagi < 0.8) sev.t += dt; else sev.t = Math.max(0, sev.t - dt * 2);
    if (sev.t >= 5 && sev.bekle <= 0) { sev.t = 0; sev.bekle = 7; dusunSira('sev', 'sira'); ses('sev'); }
  }

  function devir(e) {
    if (!e.periyot) return 0;
    const t = zaman + e.faz;
    return (((t % e.periyot) + e.periyot) % e.periyot) / e.periyot;
  }

  // raya asili platformlar: robot ustundeyse birlikte tasinir
  function platformGuncelle(dt) {
    for (const p of B.platformlar) {
      if (durum !== 'geri') p.t += dt;
      const eski = p.e.x0;
      const mrk = p.orta - Math.cos(p.t * 6.2832 / p.periyot) * p.gen;
      p.e.x0 = mrk - p.w / 2; p.e.x1 = mrk + p.w / 2;
      const dx = p.e.x0 - eski;
      if (dx !== 0 && robot.yerde && Math.abs(robot.y - p.y) < 3 && robot.x > p.c0 && robot.x < p.c1 &&
          robot.x >= eski - 2 && robot.x <= eski + p.w + 2) robot.tasi(dx, 0);
    }
  }

  // asansor, sandik, agirlik plakasi
  function blokGuncelle(dt) {
    for (const a of B.asansorler) {
      const eski = a.ust;
      if (a.kapali) a.t = 0; else if (durum !== 'geri') a.t += dt;
      const f = a.t % 11;                              // altta bekle, cik, ustte bekle, in
      a.k = f < 2.2 ? 0 : (f < 5.4 ? (f - 2.2) / 3.2 : (f < 7.8 ? 1 : 1 - (f - 7.8) / 3.2));
      a.ust = lerp(a.yAlt, a.yUst, smooth(a.k));
      const dy = a.ust - eski;
      if (dy !== 0 && robot.yerde && robot.x >= a.x0 - 1 && robot.x <= a.x1 + 1 && Math.abs(robot.y - eski) < 4) robot.tasi(0, dy);
    }
    // paletli tasiyicilar: iki uc arasinda gidip gelir; ustundeki robotu tasir, onundekini iter
    for (const p of B.paletliler) {
      const eski = p.x0;
      p.bekle -= dt;
      if (p.bekle <= 0 && durum !== 'geri') {
        let nx = p.x0 + p.yon * p.hiz * dt;
        if (nx < p.a0) { nx = p.a0; p.yon = 1; p.bekle = 1.6; } else if (nx > p.a1 - p.w) { nx = p.a1 - p.w; p.yon = -1; p.bekle = 1.6; }
        p.x0 = nx; p.x1 = nx + p.w;
      }
      const dx = p.x0 - eski;
      if (robot.yerde && Math.abs(robot.y - p.ust) < 3 && robot.x >= eski - 2 && robot.x <= eski + p.w + 2) { if (dx) robot.tasi(dx, 0); }
      else if (Math.abs(robot.y - p.taban) < 20 && robot.x > p.x0 - 12 && robot.x < p.x1 + 12) robot.x = robot.x < (p.x0 + p.x1) / 2 ? p.x0 - 12 : p.x1 + 12;
    }
    // sandik: bir adim geride durup ellerini ust kosesine dayayarak iter (ayaklar sandiga degmez)
    const d = (durum === 'oyun' && robot.yerde && !robot.merd && !robot.etk && robot.surunK < 0.3) ? girdi.x : 0;
    itilen = null;
    for (const s of B.sandiklar) {
      const ayni = Math.abs(robot.y - s.taban) < 3;
      if (ayni && robot.yerde) robot.duvarlar.push(s.x0 - 34, s.x1 + 34);       // sandiga 34 px'ten fazla yaklasamaz
      if (!d || !ayni) continue;
      const ara = d > 0 ? s.x0 - robot.x : robot.x - s.x1;
      if (ara < 6 || ara > 44) continue;
      // acik olmayan bariyerden sandik da gecemez (araya robotun sigacagi bosluk kalir)
      let lo = s.min, hi = s.max - s.w;
      for (const b of B.bariyerler) {
        if (b.kapali || Math.abs(b.y - s.taban) > 3) continue;
        if (s.x1 <= b.x) hi = Math.min(hi, b.x - 120 - s.w); else lo = Math.max(lo, b.x + 120);
      }
      const nx0 = clamp(s.x0 + d * CFG.itmeHiz * dt, Math.min(lo, s.x0), Math.max(hi, s.x0));
      robot.x += nx0 - s.x0;                         // robot sandikla birlikte ilerler (ayaklar adim atarak gelir)
      s.x0 = nx0; s.x1 = nx0 + s.w;
      if (zaman - (s.sesT || -9) > 0.6) ses('sandik');     // itmeye baslarken tok bir ses
      s.sesT = zaman;
      robot.itiyor = true;
      itilen = { x: d > 0 ? s.x0 : s.x1, y: s.ust };
    }
    // plaka: ustunde robot ya da sandik varken hedefleri kapatir (dugmeyle kilitlenmis olanlar acik kalir)
    for (const p of B.plakalar) {
      let b = durum !== 'geri' && robot.yerde && Math.abs(robot.y - p.y) < 3 && robot.x > p.x0 && robot.x < p.x1;
      for (const s of B.sandiklar) if (Math.abs(s.taban - p.y) < 3 && Math.min(s.x1, p.x1) - Math.max(s.x0, p.x0) > 36) b = true;
      p.basili = b; p.k = damp(p.k, b ? 1 : 0, 14, dt);
      for (const h of p.hedef) if (!h.kalici) h.kapali = b;
    }
  }

  // projektor kuleleri ve dronlar
  function gozcuGuncelle(dt) {
    // saklanma: siperin arkasinda EGILMIS olmak ya da cokmus tablanin altinda SURUNMEK gerekir
    let gizli = false;
    for (const s of B.siperler) if (Math.abs(robot.x - s.x) < s.w / 2 - 6 && robot.egilK > 0.6) gizli = true;
    for (const a of B.alcaklar) if (a.h < 100 && robot.x > a.x0 - 6 && robot.x < a.x1 + 6 && robot.surunK > 0.6) gizli = true;
    let gorundu = false;
    for (const g of B.gozculer) {
      if (durum !== 'geri' && !g.kapali) g.t += dt;
      const orta = (g.x0 + g.x1) / 2, gen = (g.x1 - g.x0) / 2;
      g.sx = orta - Math.cos(g.t * 6.2832 / g.periyot + g.faz) * gen;
      g.sy = Z.yukZemin(g.sx);
      g.guc = damp(g.guc === undefined ? 1 : g.guc, g.kapali ? 0 : 1, 6, dt);
      if (g.tip === 'dron') {
        g.in = damp(g.in || 0, g.kapali ? 1 : 0, 2.2, dt);    // kapaninca yere iner
        g.kx = g.sx + Math.sin(zaman * 1.7 + g.x0) * 6 * (1 - g.in);
        g.ky = g.sy - lerp(g.yuk + Math.sin(zaman * 2.3 + g.x0) * 5, 15, g.in);
      } else {
        g.kx = g.kuleX; g.ky = Z.yukZemin(g.kuleX) + Sanat.s.kule.isikY;
      }
      if (!g.kapali && Math.abs(robot.x - g.sx) < g.yaricap - 28 && robot.y > g.sy - 160 && robot.y < g.sy + 80) gorundu = true;
    }
    if (durum === 'oyun' && gorundu && !gizli) alarm += dt; else alarm = Math.max(0, alarm - dt * 1.6);
    uyari = damp(uyari, clamp(alarm / CFG.yakalanmaSure, 0, 1), 12, dt);
    if (durum === 'oyun' && alarm > CFG.yakalanmaSure) geriAl('yakalandi');
  }

  function tehlikeGuncelle(dt) {
    const rx = robot.x, ry = robot.y, boy = robot.boyAl();
    let olum = null, otip = '', oy = 0;
    robot.duvarlar.length = 0;

    // presler
    for (const p of B.presler) {
      const f = devir(p);
      let k;
      if (p.kapali) k = 0;
      else if (f < 0.52) k = 0;
      else if (f < 0.60) k = Math.pow((f - 0.52) / 0.08, 2);
      else if (f < 0.76) k = 1;
      else k = 1 - smooth((f - 0.76) / 0.24);
      p.k = k; p.uyari = !p.kapali && f > 0.30 && f < 0.60;
      p.alt = p.y - lerp(p.acik, 0, k);
      const dx = Math.abs(rx - p.x);
      if (p.y - p.alt < boy + 4 && Math.abs(ry - p.y) < 70) {
        if (dx < p.w / 2 - 6) { olum = 'hasar'; otip = 'ezik'; }                                // altinda kaldi
        else {
          if (dx < p.w / 2 + 10) robot.x = p.x + (rx < p.x ? -1 : 1) * (p.w / 2 + 10);   // kenardaysa disari it
          robot.duvarlar.push(p.x - p.w / 2 - 10, p.x + p.w / 2 + 10);
        }
      }
      if (k >= 1 && p.onceki < 1 && Math.abs(p.x - cam.x - W / 2) < W * 0.7) { sars = Math.max(sars, 5); tozEkle(p.x, p.y, 10, p.w + 30, 150); ses('pres', p.x); }
      p.onceki = k;
    }
    // lazer bariyerleri (dugme / plaka ile kapanir)
    for (const b of B.bariyerler) {
      b.k = damp(b.k === undefined ? 1 : b.k, b.kapali ? 0 : 1, 8, dt);
      if (!b.kapali) robot.duvarlar.push(b.x - 26, b.x + 26);
    }
    // elektrikli su birikintileri
    for (const e of B.elektrik) {
      e.sal = Math.sin(zaman * 1.3 + e.x0) * 4;
      e.ucX = (e.x0 + e.x1) / 2 + e.sal * 0.6; e.ucY = e.y - 50;                 // kablonun ucu
      if (e.kapali) { e.acik = false; e.yakinda = false; continue; }
      if (!e.periyot) { e.acik = true; e.yakinda = false; }
      else { const f = devir(e); e.acik = f < 0.5; e.yakinda = f > 0.86; }
      if (e.acik && !e.sesAcik) ses('elektrik', (e.x0 + e.x1) / 2, Math.abs((e.x0 + e.x1) / 2 - rx) < 520 ? 1 : 0);
      e.sesAcik = e.acik;
      if (e.acik && robot.yerde && rx > e.x0 + 6 && rx < e.x1 - 6 && Math.abs(ry - e.y) < 12 && sarjT <= 0) { olum = 'hasar'; otip = 'elektrik'; }
    }
    // lazerler: ust = egilerek, surun = surunerek, alt = ziplayarak (ya da sonukken) gecilir
    for (const l of B.lazerler) {
      const f = l.periyot ? devir(l) : 0;
      l.acik = !l.kapali && (!l.periyot || f < (l.oran || 0.4));
      l.yakinda = !l.kapali && l.periyot > 0 && f > 0.88;
      // govdenin tamami sayilir: surunurken eller onde, ayaklar arkada
      const onU = robot.surunK > 0.5 ? 74 : 9, arkaU = robot.surunK > 0.5 ? 40 : 9;      // cizgiye gercekten degen govde (pay birakilir)
      const bx0 = rx - (robot.yon > 0 ? arkaU : onU), bx1 = rx + (robot.yon > 0 ? onU : arkaU);
      if (!l.acik || bx1 < l.x0 + 3 || bx0 > l.x1 - 3) continue;
      const by = l.y - l.h;
      if (l.ust) { if (ry - boy < by - 12 && ry > by) { olum = 'yakalandi'; otip = 'lazer'; oy = by; } }
      else if (ry > by + 5 && ry < l.y + 40) { olum = 'yakalandi'; otip = 'lazer'; oy = by; }
    }
    // sivri demirler
    for (const d of B.dikenler) if (rx > d.x0 + 8 && rx < d.x1 - 8 && ry > d.y - 10 && ry < d.y + 40) { olum = 'hasar'; otip = 'diken'; }
    // curuk kalaslar
    for (const k of B.kalaslar) {
      if (k.t < 0) {
        if (durum === 'oyun' && robot.yerde && rx > k.x0 - 4 && rx < k.x1 + 4 && Math.abs(ry - k.y) < 3) k.t = 0;
        continue;
      }
      k.t += dt;
      if (k.e.aktif && k.t > CFG.kalasSure) { k.e.aktif = false; k.vy = 0; k.dy = 0; ses('kalas', k.x0); }
      if (!k.e.aktif) {
        k.vy += 1500 * dt; k.dy += k.vy * dt;
        // robot uzaklasinca yerine gelir (geri donulebilsin)
        if (k.t > CFG.kalasSure + 5 && (rx < k.x0 - 260 || rx > k.x1 + 260)) { k.t = -1; k.dy = 0; k.vy = 0; k.e.aktif = true; }
      }
    }
    if (olum && durum === 'oyun') geriAl(olum, otip, oy);
  }

  // etkilesim: menzile girince tus aktif olur (ya da noktaya dokunulur); robot yerine gecip elini tam hedefe goturur
  function etkiGuncelle(dt) {
    etkYakin = null;
    const uygun = durum === 'oyun' && robot.yerde && !robot.merd;
    if (uygun) {
      let en = 82;
      for (const e of B.etkiler) {
        if (!secilir(e)) continue;
        const d = Math.abs(robot.x - e.x);
        if (d < en && Math.abs(robot.y - e.y) < 14) { en = d; etkYakin = e; }
      }
    }
    let sec = null;
    if (etkYakin && girdi.etk && !etkOnceki) sec = etkYakin;
    // ekrana dokunma: dokunulan etkilesim noktasina (ayni zemindeyse) robot kendisi gider
    if (uygun && isaret.yeni && !robot.etk) {
      const wx = isaret.x + cam.x, wy = isaret.y + cam.y;
      for (const e of B.etkiler) {
        if (!secilir(e) || Math.abs(robot.y - e.y) > 14 || Math.abs(robot.x - e.x) > 460) continue;
        if (Math.abs(wx - e.x) < 46 && wy > e.y - e.h - 60 && wy < e.y + 10) sec = e;
      }
    }
    if (sec && isaret.yeni) isaret.kullanildi = true;
    const dokunuldu = !!sec && sec !== etkYakin || (!!sec && isaret.yeni && !(girdi.etk && !etkOnceki));
    if (sec && !robot.etk && robot.etkBasla(sec.x, sec.y - sec.h, sec.egil)) { etkSecili = sec; sec.dokun = dokunuldu; }
    etkOnceki = girdi.etk;

    if ((robot.etkOlay && etkSecili) || uzakEtk) {
      // el hedefe degdi: kosullar tamamsa calisir, degilse robot nedenini dusunur
      const e = uzakEtk || etkSecili;
      uzakEtk = null;
      let olur = true;
      if (e.kilit) for (const k of e.kilit) if (!k.yapildi) olur = false;
      if (e.gerek && tasinan !== e.gerek && !(e.gerek === 'sarj' && sarjT > 0)) olur = false;
      if (!olur) { e.redT = 0; if (e.red) dusun(e.red); ses('red'); }
      else {
        e.yapildi = true; e.t = 0; e.s = robot.etk ? robot.etk.s : 1;
        ses(e.tip === 'dugme' ? 'dugme' : (e.tip === 'salter' ? 'salter' : (e.tip === 'kablo' ? 'fis' : 'hucre')));
        if (e.kapi) ses('kapi'); else if (e.ac) ses('guc'); else if (e.hedef.length) ses('bariyer');
        if (e.gerek) tasinan = null;
        if (yet[e.verir] !== undefined) yet[e.verir] = true;
        else if (e.verir && e.verir !== 'sarj') { tasinan = e.verir; tasT = 0; tasX = e.x; tasY = e.y - e.h; }     // once elde tutar, sonra sirtina takar
        for (const h of e.hedef) { h.kapali = true; if (!e.sure) h.kalici = true; }
        if (e.ac) for (const h of e.ac) h.kapali = false;
        if (e.sure) e.kalan = e.sure;
        if (e.cevir) { for (const h of e.cevir) h.kapali = !h.kapali; e.konum = !e.konum; e.yapildi = false; }     // ac / kapa salteri
        if (e.kapi) kapiAc = true;
        if (e.hat) dusun(B.hatlar.every((h) => h.yapildi) ? 'dHat2' : 'dHat1');
        else if (e.dusun) dusun(e.dusun);
        else if (e.dokun) { dusunSira('el', 'elSira'); ses('el'); }      // isi oyuncunun eli yaptirdi
      }
      etkSecili = null;
    }
    if (!robot.etk) etkSecili = null;
    for (const e of B.etkiler) {
      e.redT += dt;
      if (!e.yapildi) continue;
      e.t += dt;
      if (e.sure) {                                   // sureli: sure bitince hedefler yeniden acilir
        e.kalan -= dt;
        if (e.kalan <= 0) { e.yapildi = false; for (const h of e.hedef) h.kapali = false; }
      }
    }
    if (dEtk) dEtk.classList.toggle('var', !!etkYakin && !robot.etk);

    // yol ustundeki dusunceler
    if (durum === 'oyun') {
      for (const d of B.dusunceler) {
        if (d.oldu || Math.abs(robot.x - d.x) > 60) continue;
        d.oldu = true;
        if (!d.etkiYok || !d.etkiYok.yapildi) dusun(d.ad);
      }
    }
    if (dsn) { dsn.t += dt; if (dsn.t > 4.6) dsn = null; }

    // kasa kapisi yuvarlanarak acilir -> robot iceri yurur
    if (kapiAc && kapiAcik < 1) { kapiAcik = Math.min(1, kapiAcik + dt / 2.6); sars = Math.max(sars, 1.2); }
    if (durum === 'oyun' && kapiAcik > 0.6) { durum = 'kapida'; dZaman = 0; robot.kilit = true; robot.otoX = B.kapi.x - 10; }
  }

  // ---- bitis sahnesi: kasanin ici ----
  function iceriGec() {
    const O = B.oda;
    icerde = true; kameraSinir();
    robot.minX = O.x0 + 60; robot.maxX = O.x1 - 60;
    robot.sifirla(O.kaideX - 620); robot.kilit = true;
    cam.x = clamp(robot.x - W * 0.42, camMin, camMax); cam.y = robot.y - H * 0.70;
    durum = 'final'; dZaman = 0; tasinan = null; dsn = null; toz.length = 0;
    F.faz = 0; F.t = 0; F.temas = 0; F.elde = false; F.soz = {}; F.beyaz = 0;
  }
  function soz(ad, t) { if (F.t >= t && !F.soz[ad]) { F.soz[ad] = true; dusun(ad); } }

  function finalGuncelle(dt) {
    const O = B.oda, cx = O.kaideX, cy = O.y - 86;       // cihazin durdugu nokta
    const K = robot.iskelet;
    F.t += dt;
    karart = 1 - smooth((dZaman - 0.3) / 1.8);
    robot.kilit = true;
    if (F.faz === 0) {
      // kaideye yuru
      robot.otoX = cx - 130;
      soz('ic1', 1.4);
      if (Math.abs(robot.x - (cx - 130)) < 10 && F.t > 4.6) { F.faz = 1; F.t = 0; F.soz = {}; robot.otoX = null; }
    } else if (F.faz === 1) {
      // oyuncu cihaza dokunana (ya da etkilesim tusuna basana) kadar bekle
      soz('ic2', 0.3);
      const wx = isaret.x + cam.x, wy = isaret.y + cam.y;
      const dokundu = isaret.yeni && Math.abs(wx - cx) < 80 && Math.abs(wy - cy) < 80;
      if (((girdi.etk && !etkOnceki) || dokundu) && F.t > 0.6) {
        if (robot.etkBasla(cx - 8, cy, false)) { F.faz = 2; F.t = 0; kameraAc(); }
      }
      etkOnceki = girdi.etk;
    } else if (F.faz === 2) {
      if (robot.etkOlay) { F.elde = true; F.ex = cx; F.ey = cy; }
      if (F.elde && !robot.etk) { F.faz = 3; F.t = 0; F.soz = {}; }
    } else if (F.faz === 3) {
      // cihaz elde, yuzunun onunde tutar; goruntu gelir, robot dusunur
      soz(kamDurum === 'var' ? 'ic3' : 'ic3b', 1.0);
      soz(kamDurum === 'var' ? 'ic4' : 'ic4b', 4.8);
      soz('ic5', 8.6);
      soz('ic6', 12.0);
      if (F.t > 16) { F.faz = 4; F.t = 0; }
    } else if (F.faz === 4) {
      // "elini uzat": oyuncu ekrana dokunup tuttukca robotun bos eli parmaga uzanir
      const tutuyor = isaret.bas || girdi.etk;
      if (tutuyor) F.temas += dt; else F.temas = Math.max(0, F.temas - dt * 0.7);
      if (F.temas > 2.8) { F.faz = 5; F.t = 0; dsn = null; ses('buldum'); }
    } else {
      F.beyaz = smooth(F.t / 3.2);
    }
    if (dEtk) dEtk.classList.toggle('var', F.faz === 1 || F.faz === 4);
    // eller: on kol cihazi tutar, arka kol parmaga uzanir
    if (F.elde) {
      F.ex = damp(F.ex, K.nx + K.f * 44, 6, dt); F.ey = damp(F.ey, K.ny + 2, 6, dt);
      robot.elHedef[0] = { x: F.ex, y: F.ey };
    } else robot.elHedef[0] = null;
    if (F.faz >= 4 && (isaret.bas || girdi.etk || F.faz === 5)) {
      const tx = isaret.bas ? isaret.x + cam.x : K.nx + K.f * 60, ty = isaret.bas ? isaret.y + cam.y : K.ny - 30;
      if (!robot.elHedef[1]) { F.px = K.kol[1].hx; F.py = K.kol[1].hy; }
      F.px = damp(F.px, tx, 9, dt); F.py = damp(F.py, ty, 9, dt);
      robot.elHedef[1] = { x: F.px, y: F.py };
    } else robot.elHedef[1] = null;
    if (dsn) { dsn.t += dt; if (dsn.t > 4.6) dsn = null; }
  }

  function guncelle(dt) {
    zk = damp(zk, agirT > 0 ? 0.3 : 1, 10, dt);      // agir cekim: dunya yavaslar, robot yavaslamaz
    const dtW = dt * zk;
    zaman += dtW; dZaman += dt; girisT += dt;
    girdiOku();

    if (durum === 'giris') {
      karart = 1 - smooth((dZaman - 0.4) / 2.4);
      robot.cokme = 1 - smooth((dZaman - 1.7) / 1.9);
      robot.kilit = dZaman < 3.3;
      if (dZaman > 3.6) { durum = 'oyun'; robot.cokme = 0; }
    } else if (durum === 'geri') {
      // olum sahnesi, karar, yerine koy, ac
      const bk = olm.tip === 'dustu' ? 0 : 1.0;
      if (dZaman < bk + 0.55) {
        karart = smooth((dZaman - bk) / 0.5);
        if (olm.tip !== 'dustu' && olm.tip !== 'ezik' && olm.tip !== 'lazer') robot.cokme = smooth(dZaman / 0.45);     // dizlerinin ustune coker
      } else {
        if (!robot._yerlesti) {
          robot.sifirla(kontrolX); robot._yerlesti = true;
          tehlikeSifirla(false);
          cam.x = clamp(robot.x - W * 0.42, camMin, camMax); cam.y = robot.y - H * 0.70;
        }
        karart = 1 - smooth((dZaman - bk - 0.75) / 0.7);
        if (dZaman > bk + 1.5) { durum = 'oyun'; karart = 0; }
      }
      robot.kilit = durum !== 'oyun';
    } else if (durum === 'kapida') {
      robot.kilit = true;
      karart = smooth((dZaman - 1.2) / 1.8);
      if (dZaman > 3.3) { if (B.oda) iceriGec(); else bolumYukle(Math.min(bolumNo + 1, BOLUM_HAZIR)); }
    }
    if (durum === 'final') finalGuncelle(dt);
    if (durum === 'oyun' && acT < 1.6) { acT += dt; karart = 1 - smooth(acT / 1.4); }

    platformGuncelle(dtW);
    blokGuncelle(dt);
    ekOnce(dtW);
    ek2Once2(dtW);
    elleriAyarla();
    // ezilme ve lazerle kesilmede robot oldugu yerde kalir (sahnesi oynar)
    if (!(durum === 'geri' && !robot._yerlesti && (olm.tip === 'ezik' || olm.tip === 'lazer'))) robot.guncelle(dt, girdi);

    if (durum === 'oyun') {
      // kontrol noktasi
      if (robot.yerde) for (const k of B.kontrol) if (robot.x >= k.x && k.x > kontrolX) kontrolX = k.x;
      if (robot.olu) geriAl('dustu');
    }

    if (!icerde) {
      gozcuGuncelle(dtW);
      tehlikeGuncelle(dtW);
      etkiGuncelle(dt);
      dusmanGuncelle(dtW);
      ekGuncelle(dtW);
      ek2Guncelle(dt, dtW);
      kancaGuncelle(dt);
      lazerAt(dt);
    }
    sevGuncelle(dt);
    tasT += dt;
    isaret.yeni = false; isaret.kullanildi = false;
    sars = damp(sars, 0, 9, dt);

    // lamba titremesi
    for (const o of B.nesneler) {
      if (o.tip !== 'lamba') continue;
      if (o.titrek) {
        const n = Math.sin(zaman * 23.1 + o.x) * Math.sin(zaman * 7.3 + o.x * 0.3) + Math.sin(zaman * 1.3 + o.x);
        const hedef = n > 1.25 ? 0.12 : (n > 0.9 ? 0.55 : 1);
        o.guc = damp(o.guc, hedef, 30, dt);
      } else o.guc = 0.92 + Math.sin(zaman * 3 + o.x) * 0.04;
    }

    // adim tozu / inis
    if (robot.bastiOlay) {
      const b = robot.bastiOlay;
      for (let i = 0; i < 3; i++) toz.push({ x: b.x + (Math.random() - 0.5) * 10, y: b.y - 2, vx: (Math.random() - 0.5) * 30 - robot.vx * 0.08, vy: -10 - Math.random() * 22, o: 0, s: 0.5 + Math.random() * 0.35, b: 3 + Math.random() * 4 });
    }
    if (robot.indiOlay > 250) tozEkle(robot.x, robot.y, 9, 34, 120);
    for (let i = toz.length - 1; i >= 0; i--) {
      const t = toz[i]; t.o += dt; t.x += t.vx * dt; t.y += t.vy * dt; t.vx *= 0.94; t.vy *= 0.94; t.b += dt * 9;
      if (t.o > t.s) toz.splice(i, 1);
    }

    // kamera
    const bak = robot.yon * 70 + robot.vx * 0.25;
    const hx = clamp(robot.x + bak - W * 0.44, camMin, camMax);
    const eski = cam.x;
    cam.x = damp(cam.x, hx, 3.2, dt);
    cam.y = damp(cam.y, robot.sonZeminY - H * 0.70, 2.6, dt);
    const kay = cam.x - eski;

    // yagmur
    for (const d of yagmur) {
      d.y += d.h * dt; d.x -= d.h * dt * 0.16 + kay * 1.2;
      if (d.y > H + 30) { d.y = -40 - Math.random() * 60; d.x = Math.random() * (W + 300); }
      if (d.x < -40) d.x += W + 340; else if (d.x > W + 300) d.x -= W + 340;
    }
    if (!icerde && !B.tema.ic && Math.random() < dt * 46) {
      const wx = cam.x + Math.random() * W, wy = Z.yukZemin(wx);
      if (wy < CUKUR) sicrama.push({ x: wx, y: wy, o: 0 });
    }
    for (let i = sicrama.length - 1; i >= 0; i--) { sicrama[i].o += dt; if (sicrama[i].o > 0.26) sicrama.splice(i, 1); }
  }

  // neden: 'yakalandi' | 'hasar' | 'dustu' (yazi ve ses). tip: olum sahnesi (ezik, lazer, elektrik, diken, golge, dortayak...)
  function geriAl(neden, tip, y) {
    if (durum !== 'oyun') return;
    olm.tip = tip || neden; olm.y = y || 0;
    ses(neden === 'yakalandi' ? 'alarm' : (neden === 'hasar' ? 'hasar' : 'dustu'));
    durum = 'geri'; dZaman = 0; geriNeden = neden; robot._yerlesti = false; robot.kilit = true;
    if (typeof REKLAM !== 'undefined') REKLAM.olum();      // her 3 olumde bir gecis reklami (reklam.js)
    if (olm.tip !== 'dustu') kivEkle(robot.x, robot.y - (olm.tip === 'ezik' ? 20 : 80), olm.tip === 'yakalandi' ? 0 : 16);
    if (olm.tip === 'ezik') sars = Math.max(sars, 6);
  }

  // ---------- cizim yardimcilari ----------
  function sisCiz(c, kay, y, olcek, alfa) {
    const sp = Sanat.s.sis, tw = sp.width * olcek, th = sp.height * olcek;
    let x = -(((kay % tw) + tw) % tw);
    c.globalAlpha = alfa;
    for (; x < W; x += tw) c.drawImage(sp, x, y, tw + 1, th);
    c.globalAlpha = 1;
  }

  function isin(c, x, y, r, renk, guc) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + renk + ',' + guc + ')');
    g.addColorStop(0.35, 'rgba(' + renk + ',' + guc * 0.42 + ')');
    g.addColorStop(1, 'rgba(' + renk + ',0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function katmanCiz(k) {
    const taban = H * k.taban - cam.y * k.py;
    const kx = cam.x * k.p;
    ctx.fillStyle = k.renk;
    ctx.fillRect(0, taban - 1, W, H - taban + 2);
    for (const o of k.o) {
      const w = o.sp.lw * o.k, h = o.sp.lh * o.k;
      const sx = o.x - kx - (o.sp.kokX || 0) * o.k;
      if (sx > W || sx + w < 0) continue;
      ctx.drawImage(o.sp, sx, taban - h + 2, w, h);
    }
    if (k.tel.length) {
      ctx.strokeStyle = k.renk; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < k.tel.length - 1; i++) {
        const a = k.tel[i] - kx, b = k.tel[i + 1] - kx;
        if (b < -50 || a > W + 50) continue;
        for (let j = 0; j < 2; j++) {
          const dx = j === 0 ? -31 : 31, y0 = taban - 330 + 28;
          ctx.moveTo(a + dx, y0); ctx.quadraticCurveTo((a + b) / 2 + dx, y0 + 46, b + dx, y0);
        }
      }
      ctx.stroke();
    }
  }

  function sisBandi(taban, yuk, renk, alfa) {
    const g = ctx.createLinearGradient(0, taban - yuk, 0, taban + 30);
    g.addColorStop(0, 'rgba(' + renk + ',0)');
    g.addColorStop(1, 'rgba(' + renk + ',' + alfa + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, taban - yuk, W, H - (taban - yuk));
  }

  const MAT = {
    toprak: ['#2b3628', 'rgba(128,150,120,0.42)'],
    asfalt: ['#394046', 'rgba(170,196,210,0.55)'],
    beton: ['#687074', 'rgba(205,218,224,0.6)'],
    metal: ['#5c473b', 'rgba(200,180,160,0.5)']
  };
  let zeminDesen = null, betonDesen = null, metalDesen = null;

  function zeminCiz() {
    const n = Z.n;
    let i0 = 0, i1 = n.length - 2;
    while (i0 < n.length - 2 && n[i0 + 1].x < cam.x - 60) i0++;
    while (i1 > i0 && n[i1].x > cam.x + W + 60) i1--;
    const alt = cam.y + H + 80;
    const poly = new Path2D();
    poly.moveTo(n[i0].x, alt);
    for (let i = i0; i <= i1 + 1; i++) poly.lineTo(n[i].x, Math.min(n[i].y, alt));
    poly.lineTo(n[i1 + 1].x, alt); poly.closePath();
    if (!zeminDesen) {
      zeminDesen = gx.createPattern(Sanat.foto.zemin || Sanat.s.toprakDoku, 'repeat');
      betonDesen = gx.createPattern(Sanat.s.betonDoku, 'repeat');
      metalDesen = gx.createPattern(Sanat.s.metalDoku, 'repeat');
    }
    gx.fillStyle = zeminDesen; gx.fill(poly);
    gx.save(); gx.clip(poly);
    // beton bloklar: merdiven, gecit ve duvar govdeleri
    gx.fillStyle = betonDesen;
    for (let i = i0; i <= i1; i++) {
      if (Z.mat[i] !== 'beton' || n[i].y >= CUKUR || n[i + 1].y >= CUKUR) continue;
      const ust = Math.min(n[i].y, n[i + 1].y);
      const yuk = Math.max(150, Math.abs(n[i + 1].y - n[i].y) + 40);
      gx.fillRect(n[i].x - 0.5, ust, n[i + 1].x - n[i].x + 1, yuk);
    }
    // yuksek yapilar: govde boydan boya beton
    for (const yp of B.yapilar) {
      if (yp[1] < cam.x - 60 || yp[0] > cam.x + W + 60) continue;
      gx.fillStyle = betonDesen; gx.fillRect(yp[0], cam.y - 60, yp[1] - yp[0], H + 200);
      gx.fillStyle = 'rgba(2,4,6,0.38)'; gx.fillRect(yp[0], cam.y - 60, yp[1] - yp[0], H + 200);
    }
    // derinlikle kararma (zemin cizgisini asagi kaydirarak)
    gx.lineJoin = 'round';
    for (let k = 1; k <= 5; k++) {
      gx.strokeStyle = 'rgba(2,4,6,0.26)'; gx.lineWidth = 44;
      gx.beginPath();
      let acik = false;
      for (let i = i0; i <= i1 + 1; i++) {
        if (n[i].y >= CUKUR) { acik = false; continue; }
        const yy = n[i].y + 22 + k * 34;
        if (!acik) { gx.moveTo(n[i].x, yy); acik = true; } else gx.lineTo(n[i].x, yy);
      }
      gx.stroke();
    }
    // yuzey seridi (malzemeye gore)
    gx.lineWidth = 17; gx.lineCap = 'butt';
    for (const m in MAT) {
      gx.strokeStyle = MAT[m][0];
      gx.beginPath();
      for (let i = i0; i <= i1; i++) {
        if (Z.mat[i] !== m || n[i].y >= CUKUR || n[i + 1].y >= CUKUR) continue;
        gx.moveTo(n[i].x, n[i].y); gx.lineTo(n[i + 1].x, n[i + 1].y);
      }
      gx.stroke();
    }
    gx.restore();
    // islak ust kenar parlamasi
    gx.lineWidth = 1.4;
    for (const m in MAT) {
      gx.strokeStyle = MAT[m][1];
      gx.beginPath();
      for (let i = i0; i <= i1; i++) {
        if (Z.mat[i] !== m || n[i].y >= CUKUR || n[i + 1].y >= CUKUR) continue;
        gx.moveTo(n[i].x, n[i].y + 0.7); gx.lineTo(n[i + 1].x, n[i + 1].y + 0.7);
      }
      gx.stroke();
    }
    // ot
    gx.strokeStyle = '#26332a'; gx.lineWidth = 1.3; gx.lineCap = 'round';
    gx.beginPath();
    const x0 = Math.floor((cam.x - 20) / 6) * 6, x1 = cam.x + W + 20;
    for (let x = x0; x < x1; x += 6) {
      if (Z.malzemeAl(x) !== 'toprak') continue;
      const hs = Math.sin(x * 12.9898) * 43758.5453; const h1 = hs - Math.floor(hs);
      if (h1 < 0.28) continue;
      const y = Z._taban(x); if (y >= CUKUR) continue;
      const hs2 = Math.sin(x * 78.233) * 12543.21; const h2 = hs2 - Math.floor(hs2);
      gx.moveTo(x, y + 1.5); gx.lineTo(x + (h2 - 0.5) * 8 + Math.sin(zaman * 1.6 + x * 0.05) * 1.2, y - 3 - h1 * 11);
    }
    gx.stroke();
    // yagmur sicramalari
    gx.strokeStyle = 'rgba(190,215,228,0.5)'; gx.lineWidth = 1;
    gx.beginPath();
    for (const s of sicrama) { const r = 1.5 + s.o * 22; gx.moveTo(s.x + r, s.y - 0.5); gx.ellipse(s.x, s.y - 0.5, r, r * 0.3, 0, 0, 3.1416, true); }
    gx.stroke();
    gx.lineCap = 'butt';
  }

  function nesneCiz() {
    const s = Sanat.s;
    for (const o of B.nesneler) {
      if (o.tip === 'oda') {
        if (icerde) { const od = Sanat.odaAl(B.oda.x1 - B.oda.x0); bas(gx, od, o.x, o.y - od.lh + 2); }
        continue;
      }
      if (o.x < cam.x - 520 || o.x > cam.x + W + 520) continue;
      let sp = null;
      if (o.tip === 'agac') sp = Sanat.agacAl(o.tohum, o.boy);
      else if (o.tip === 'lamba') sp = s.lamba;
      else if (o.tip === 'araba') sp = s.araba;
      else if (o.tip === 'kule') sp = s.kule;
      else if (o.tip === 'kapi') sp = s.kapi;
      else if (o.tip === 'korkuluk') {
        gx.strokeStyle = '#39434a'; gx.lineWidth = 3; gx.beginPath();
        for (let x = o.x; x <= o.x + o.w; x += 56) { gx.moveTo(x, o.y); gx.lineTo(x, o.y - 46); }
        gx.stroke();
        gx.lineWidth = 2.4; gx.beginPath();
        gx.moveTo(o.x, o.y - 45); gx.lineTo(o.x + o.w, o.y - 45); gx.moveTo(o.x, o.y - 24); gx.lineTo(o.x + o.w, o.y - 24); gx.stroke();
        gx.strokeStyle = 'rgba(190,208,216,0.4)'; gx.lineWidth = 0.8; gx.beginPath(); gx.moveTo(o.x, o.y - 46.4); gx.lineTo(o.x + o.w, o.y - 46.4); gx.stroke();
        continue;
      }
      if (!sp) continue;
      bas(gx, sp, o.x - sp.kokX, o.y - sp.lh + (o.tip === 'araba' ? 6 : 2));
      if (o.tip === 'kapi') {
        // disli kapak: acilirken sola yuvarlanir
        const d = s.kapiDisk, kay = sp.diskYol * smooth(kapiAcik);
        gx.save();
        gx.translate(o.x - kay, o.y + 2 - sp.merkezY);
        gx.rotate(-kay / d.yaricap);
        bas(gx, d, -d.lw / 2, -d.lh / 2);
        gx.restore();
      }
    }
  }

  function konteynerCiz() {
    for (const k of B.konteynerler) {
      if (k.x1 < cam.x - 20 || k.x0 > cam.x + W + 20) continue;
      const w = k.x1 - k.x0;
      gx.save(); gx.translate(k.x0, k.y);
      gx.fillStyle = metalDesen || '#4a3d36'; gx.fillRect(0, 0, w, k.h);
      gx.fillStyle = 'rgba(0,0,0,0.4)'; gx.fillRect(w - 5, 0, 5, k.h); gx.fillRect(0, 0, 4, k.h);
      gx.fillStyle = 'rgba(205,190,172,0.5)'; gx.fillRect(0, 0, w, 1.4);
      gx.restore();
    }
  }

  function siperCiz() {
    const sp = Sanat.s.siper;
    for (const s of B.siperler) {
      if (s.x < cam.x - 150 || s.x > cam.x + W + 150) continue;
      bas(gx, sp, s.x - sp.kokX, Z.yukZemin(s.x) - sp.lh + 3);
    }
  }

  // yatay doku seridi (boru, kalas): gorseli yan yana dizerek w kadar doldurur
  function serit(sp, x, y, w) {
    for (let o = 0; o < w; o += sp.lw) {
      const pw = Math.min(sp.lw, w - o);
      gx.drawImage(sp, 0, 0, pw * sp.q, sp.height, x + o, y, pw, sp.lh);
    }
  }

  // etkilesim kutulari: dugme / salter / hucre rafi / hucre yuvasi / priz + fis
  function etkiCiz(onde) {
    const s = Sanat.s, sol = cam.x - 260, sag = cam.x + W + 260;
    for (const e of B.etkiler) {
      if (e.x < sol || e.x > sag || !!e.onde !== onde || !gorunur(e)) continue;
      const ty = e.y - e.h;
      if (e.tip === 'silah') {      // kaidenin ustunde duran omuz lazeri
        bas(gx, s.kaide, e.x - s.kaide.kokX, e.y - s.kaide.lh + 2);
        const al = (e.verir !== 'lazer' && s[e.verir]) || s.omuz;
        if (!e.yapildi) bas(gx, al, e.x - al.lw / 2, ty + 16 - al.lh);
        continue;
      }
      const ku = Sanat.kutuAl(e.h);
      bas(gx, ku, e.x - ku.kokX, ty - ku.elY);
      if (e.tip === 'dugme') {
        const basili = e.yapildi && e.t < 0.3;
        gx.fillStyle = e.yapildi ? '#1f5a3a' : '#7a1f1a';
        gx.beginPath(); gx.arc(e.x, ty, basili ? 4.6 : 6, 0, 6.283); gx.fill();
        gx.fillStyle = 'rgba(255,255,255,0.14)'; gx.beginPath(); gx.arc(e.x - 1.6, ty - 1.8, 2, 0, 6.283); gx.fill();
      } else if (e.tip === 'salter') {
        // salter kolu: kapaliyken yukari, acilinca asagi
        const k = e.cevir ? (e.konum ? 1 : 0) : (e.yapildi ? smooth(e.t / 0.2) : 0), ac = lerp(-0.9, 0.9, k);
        gx.fillStyle = '#0a0c0e'; gx.fillRect(e.x - 2, ty - 8, 4, 16);
        gx.strokeStyle = '#8c979e'; gx.lineWidth = 3; gx.lineCap = 'round';
        gx.beginPath(); gx.moveTo(e.x, ty); gx.lineTo(e.x - e.s * Math.cos(ac) * 11, ty + Math.sin(ac) * 11); gx.stroke();
        gx.lineCap = 'butt';
      } else if (e.tip === 'hucre' || e.tip === 'yuva') {
        gx.fillStyle = '#07090a'; gx.fillRect(e.x - 6, ty - 12, 12, 24);
        const dolu = e.tip === 'hucre' ? !e.yapildi : e.yapildi;
        if (dolu) bas(gx, s.hucre, e.x - s.hucre.kokX, ty - s.hucre.kokY + 1);
      } else {
        // priz + fis + kablo: fis sokulunce yere duser
        gx.fillStyle = '#0a0c0e'; gx.fillRect(e.x - 5, ty - 5, 10, 10);
        const k = e.yapildi ? smooth(e.t / 0.45) : 0;
        const fx = lerp(e.x - e.s * 7, e.x - e.s * 36, k), fy = lerp(ty, e.y - 5, k * k);
        gx.strokeStyle = '#0b0d0f'; gx.lineWidth = 3.4; gx.lineCap = 'round';
        gx.beginPath(); gx.moveTo(fx, fy); gx.quadraticCurveTo(fx - e.s * 8, e.y - 2, fx - e.s * 20, e.y - 2);
        gx.lineTo(e.kx === undefined ? e.x : e.kx, e.y - 2); gx.stroke();
        gx.lineCap = 'butt';
        gx.fillStyle = '#3a444a'; gx.fillRect(fx - 5, fy - 4, 10, 8);
        gx.fillStyle = '#b08a5a'; gx.fillRect(fx + e.s * 5 - 1, fy - 2, 2, 4);
      }
    }
  }

  // robotun arkasinda kalan tehdit ve bulmaca nesneleri (dunya koordinati)
  function tehlikeArka() {
    const s = Sanat.s, sol = cam.x - 260, sag = cam.x + W + 260;

    // alcak gecitler: boru (egil) / cokmus beton tabla (surun)
    for (const a of B.alcaklar) {
      if (a.x1 < sol - 60 || a.x0 > sag + 60) continue;
      if (a.tip === 'boru') {
        const ust = a.y - 178 - (a.kot || 0), bx = a.x0 - 26, bw = a.x1 - a.x0 + 52;
        if (a.kot) {      // yuksek boru: tavandan askili
          gx.fillStyle = '#12161a'; gx.fillRect(a.x0 - 10, ust - 700, 6, 700); gx.fillRect(a.x1 + 4, ust - 700, 6, 700);
        } else {
          gx.fillStyle = betonDesen || '#1b2023';
          gx.fillRect(a.x0 - 16, a.y - 116, 14, 116); gx.fillRect(a.x1 + 2, a.y - 116, 14, 116);
          gx.fillStyle = 'rgba(2,4,6,0.5)'; gx.fillRect(a.x0 - 16, a.y - 116, 14, 116); gx.fillRect(a.x1 + 2, a.y - 116, 14, 116);
        }
        serit(s.boruDoku, bx, ust, bw);
        gx.fillStyle = '#20262a';
        for (let i = 0; i <= 3; i++) gx.fillRect(bx + bw * i / 3 - 4, ust - 4, 8, 74);
        gx.fillStyle = 'rgba(190,208,216,0.3)'; gx.fillRect(bx, ust, bw, 1.2);
      } else {
        // egik dusmus kalin beton tabla, iki ucunda moloz ayaklar, sarkan demirler
        const x0 = a.x0 - 34, x1 = a.x1 + 34, alt = a.y - a.h;
        const p = new Path2D();
        p.moveTo(x0, alt + 2); p.lineTo(x0 + 6, alt - 44); p.lineTo(x0 + 60, alt - 58); p.lineTo((x0 + x1) / 2, alt - 50);
        p.lineTo(x1 - 50, alt - 62); p.lineTo(x1 - 4, alt - 40); p.lineTo(x1, alt + 2); p.closePath();
        p.rect(x0 + 2, alt, 24, a.h); p.rect(x1 - 26, alt, 24, a.h);
        gx.fillStyle = betonDesen || '#3a4044'; gx.fill(p);
        gx.save(); gx.clip(p);
        const g = gx.createLinearGradient(0, alt - 62, 0, a.y);
        g.addColorStop(0, 'rgba(2,4,6,0.12)'); g.addColorStop(0.35, 'rgba(2,4,6,0.5)'); g.addColorStop(1, 'rgba(2,4,6,0.72)');
        gx.fillStyle = g; gx.fillRect(x0, alt - 70, x1 - x0, a.h + 80);
        gx.restore();
        gx.strokeStyle = 'rgba(190,208,216,0.38)'; gx.lineWidth = 1.2;
        gx.beginPath(); gx.moveTo(x0 + 6, alt - 44); gx.lineTo(x0 + 60, alt - 58); gx.lineTo((x0 + x1) / 2, alt - 50); gx.lineTo(x1 - 50, alt - 62); gx.lineTo(x1 - 4, alt - 40); gx.stroke();
        gx.strokeStyle = '#4a352a'; gx.lineWidth = 2;
        gx.beginPath();
        for (let xx = a.x0 + 26; xx < a.x1 - 10; xx += 67) { gx.moveTo(xx, alt); gx.lineTo(xx + ((xx * 7) % 9) - 4, alt + 9 + (xx % 8)); }
        gx.stroke();
      }
    }

    // dik merdivenler
    for (const L of B.tirmanma) {
      if (L.duvarX < sol || L.duvarX > sag) continue;
      const m0 = L.lx - 7, m1 = L.lx + 7, ust = L.yUst - 44;
      gx.lineCap = 'butt';
      gx.strokeStyle = '#1e2428'; gx.lineWidth = 2.4;
      gx.beginPath();
      for (let y = L.yAlt - 34; y > L.yUst + 10; y -= 88) { gx.moveTo(L.lx, y); gx.lineTo(L.duvarX, y); }
      gx.stroke();
      gx.strokeStyle = '#59646b'; gx.lineWidth = 2.4;
      gx.beginPath();
      for (let y = L.yAlt - CFG.basamakAra; y > L.yUst + 4; y -= CFG.basamakAra) { gx.moveTo(m0, y); gx.lineTo(m1, y); }
      gx.stroke();
      gx.strokeStyle = '#3d474d'; gx.lineWidth = 3.4; gx.lineCap = 'round';
      gx.beginPath();
      for (let k = 0; k < 2; k++) {
        const xr = k === 0 ? m0 : m1;
        gx.moveTo(xr, L.yAlt); gx.lineTo(xr, ust);
        gx.quadraticCurveTo(xr, ust - 13, xr + L.yon * 14, ust - 13);
        gx.lineTo(xr + L.yon * 24, ust - 13); gx.lineTo(xr + L.yon * 24, L.yUst);
      }
      gx.stroke();
      // pas lekeleri (duz cizgi kalmasin)
      gx.strokeStyle = 'rgba(96,54,30,0.55)'; gx.lineWidth = 3.4; gx.lineCap = 'butt';
      gx.beginPath();
      for (let y = L.yAlt - 20; y > ust + 40; y -= 57) { gx.moveTo(m0, y); gx.lineTo(m0, y - 9 - (Math.abs(y) % 11)); gx.moveTo(m1, y - 26); gx.lineTo(m1, y - 33 - (Math.abs(y) % 7)); }
      gx.stroke();
      gx.strokeStyle = 'rgba(190,208,216,0.3)'; gx.lineWidth = 0.9;
      gx.beginPath(); gx.moveTo(m0 - 1.2, L.yAlt); gx.lineTo(m0 - 1.2, ust); gx.stroke();
    }

    // pres cerceveleri
    for (const p of B.presler) {
      if (p.x < sol || p.x > sag) continue;
      const sp = s.presCerceve;
      bas(gx, sp, p.x - sp.kokX, p.y - sp.lh + 2);
      gx.fillStyle = '#15191c'; gx.fillRect(p.x - p.w / 2 - 6, p.y - 3, p.w + 12, 6);
    }

    // lazer bariyeri govdesi
    for (const b of B.bariyerler) {
      if (b.x < sol || b.x > sag) continue;
      const sp = s.bariyerCerceve;
      bas(gx, sp, b.x - sp.kokX, b.y - sp.lh + 2);
    }

    // lazer direkleri
    for (const l of B.lazerler) {
      if (l.x1 < sol || l.x0 > sag) continue;
      const hy = l.y - l.h;
      for (let k = 0; k < 2; k++) {
        const px = k === 0 ? l.x0 : l.x1;
        gx.fillStyle = '#1d2327';
        gx.fillRect(px - 3, hy - 8, 6, l.h + 8); gx.fillRect(px - 6, hy - 6, 12, 12); gx.fillRect(px - 9, l.y - 4, 18, 4);
        gx.fillStyle = 'rgba(96,54,30,0.5)'; gx.fillRect(px - 3, hy + 10, 3, Math.min(14, l.h * 0.4));
        gx.fillStyle = 'rgba(190,208,216,0.3)'; gx.fillRect(px - 6, hy - 6, 12, 1);
      }
    }

    // elektrik: egik direk, sarkan kablo, su birikintisi
    for (const e of B.elektrik) {
      if (e.x1 < sol || e.x0 > sag) continue;
      if (e.izgara) {      // zemine gomulu elektrik izgarasi
        gx.fillStyle = '#0d1114'; gx.fillRect(e.x0, e.y - 3, e.x1 - e.x0, 6);
        gx.fillStyle = 'rgba(120,135,142,0.55)';
        for (let xx = e.x0 + 4; xx < e.x1 - 4; xx += 12) gx.fillRect(xx, e.y - 3, 5, 2);
        gx.fillStyle = 'rgba(196,160,52,0.6)'; gx.fillRect(e.x0 - 10, e.y - 4, 10, 5); gx.fillRect(e.x1, e.y - 4, 10, 5);
        continue;
      }
      const mrk = (e.x0 + e.x1) / 2, w = e.x1 - e.x0, dxp = e.x0 - 46, sal = e.sal || 0;
      gx.lineCap = 'butt';
      gx.strokeStyle = '#161b1e'; gx.lineWidth = 7;
      gx.beginPath(); gx.moveTo(dxp, e.y); gx.lineTo(dxp + 16, e.y - 230); gx.stroke();
      gx.lineWidth = 3; gx.beginPath(); gx.moveTo(dxp - 8, e.y - 214); gx.lineTo(dxp + 44, e.y - 222); gx.stroke();
      gx.strokeStyle = '#0c0f11'; gx.lineWidth = 2.6;
      gx.beginPath(); gx.moveTo(dxp + 40, e.y - 221); gx.bezierCurveTo(mrk - 10, e.y - 200, mrk + 16 + sal, e.y - 120, mrk + sal * 0.6, e.y - 50); gx.stroke();
      gx.fillStyle = 'rgba(10,16,20,0.85)'; gx.beginPath(); gx.ellipse(mrk, e.y + 1, w / 2, 4.5, 0, 0, 6.283); gx.fill();
      gx.strokeStyle = 'rgba(150,185,205,0.45)'; gx.lineWidth = 1;
      gx.beginPath(); gx.ellipse(mrk, e.y + 0.5, w / 2 - 4, 3, 0, 3.5, 5.6); gx.stroke();
    }

    // sivri demirler
    for (const d of B.dikenler) {
      if (d.x1 < sol || d.x0 > sag) continue;
      bas(gx, s.diken, d.x0 - s.diken.kokX, d.y - s.diken.lh + 6);
    }

    // curuk kalaslar
    for (const k of B.kalaslar) {
      if (k.x1 < sol || k.x0 > sag || k.dy > 900) continue;
      const w = k.x1 - k.x0;
      const sal = (k.t >= 0 && k.e.aktif) ? Math.sin(k.t * 55) * 1.6 * Math.min(1, k.t * 2.5) : 0;
      gx.save(); gx.translate(k.x0 + w / 2, k.y + k.dy + sal); gx.rotate(k.dy * 0.0011);
      serit(s.kalasDoku, -w / 2, 0, w);
      gx.restore();
    }

    // raya asili platformlar
    for (const p of B.platformlar) {
      if (p.c1 < sol - 80 || p.c0 > sag + 80) continue;
      const ry = p.y - 330, mrk = (p.e.x0 + p.e.x1) / 2;
      gx.fillStyle = '#161b1e';
      gx.fillRect(p.c0 - 60, ry, p.c1 - p.c0 + 120, 7);
      gx.fillRect(p.c0 - 56, ry, 8, 330); gx.fillRect(p.c1 + 48, ry, 8, 330);
      gx.fillStyle = 'rgba(96,54,30,0.4)';
      for (let xx = p.c0 - 40; xx < p.c1 + 50; xx += 83) gx.fillRect(xx, ry + 1, 26, 5);
      gx.fillStyle = '#232a2f'; gx.fillRect(mrk - 20, ry - 6, 40, 17);
      gx.strokeStyle = '#0d1012'; gx.lineWidth = 1.7;
      gx.beginPath(); gx.moveTo(mrk - 12, ry + 11); gx.lineTo(p.e.x0 + 8, p.y); gx.moveTo(mrk + 12, ry + 11); gx.lineTo(p.e.x1 - 8, p.y); gx.stroke();
      bas(gx, s.tabla150, p.e.x0, p.y);
    }

    // asansorler: makasli tabla + duvarda ray
    for (const a of B.asansorler) {
      if (a.x1 < sol || a.x0 > sag) continue;
      gx.fillStyle = '#161b1e'; gx.fillRect(a.x1 - 7, a.yUst - 30, 7, a.yAlt - a.yUst + 30);
      gx.fillStyle = 'rgba(96,54,30,0.4)';
      for (let yy = a.yUst; yy < a.yAlt - 20; yy += 71) gx.fillRect(a.x1 - 7, yy, 7, 18);
      const yuk = a.yAlt - a.ust;
      if (yuk > 3) {
        const kat = 3, ky = (yuk - 14) / kat;
        gx.strokeStyle = '#3a444a'; gx.lineWidth = 4; gx.lineCap = 'round';
        gx.beginPath();
        for (let i = 0; i < kat; i++) {
          const y0 = a.ust + 14 + ky * i, y1 = y0 + ky;
          gx.moveTo(a.x0 + 12, y0); gx.lineTo(a.x1 - 16, y1);
          gx.moveTo(a.x1 - 16, y0); gx.lineTo(a.x0 + 12, y1);
        }
        gx.stroke(); gx.lineCap = 'butt';
      }
      gx.fillStyle = '#14181b'; gx.fillRect(a.x0 - 4, a.yAlt - 3, a.w + 4, 5);
      bas(gx, s.tabla110, a.x0, a.ust);
    }

    // agirlik plakalari
    for (const p of B.plakalar) {
      if (p.x1 < sol || p.x0 > sag) continue;
      const w = p.x1 - p.x0, yy = p.y - 6 + p.k * 4;
      gx.fillStyle = '#101417'; gx.fillRect(p.x0 - 5, p.y - 2, w + 10, 5);
      gx.fillStyle = betonDesen || '#3a4044'; gx.fillRect(p.x0, yy, w, p.y - yy + 1);
      gx.fillStyle = 'rgba(2,4,6,0.35)'; gx.fillRect(p.x0, yy, w, p.y - yy + 1);
      gx.fillStyle = 'rgba(196,160,52,0.5)';
      for (let xx = p.x0 + 6; xx < p.x1 - 10; xx += 18) gx.fillRect(xx, yy, 9, 2.4);
      gx.fillStyle = 'rgba(200,214,222,0.35)'; gx.fillRect(p.x0, yy, w, 1);
    }

    // sandiklar
    for (const sd of B.sandiklar) {
      if (sd.x1 < sol || sd.x0 > sag) continue;
      bas(gx, s.sandik, sd.x0, sd.ust);
    }

    etkiCiz(false);

    // bitis odasi: kaide ve ustundeki cihaz
    if (icerde) {
      const O = B.oda;
      bas(gx, s.kaide, O.kaideX - s.kaide.kokX, O.y - s.kaide.lh + 2);
      if (!F.elde) bas(gx, s.cihaz, O.kaideX - s.cihaz.kokX, O.y - 86 - s.cihaz.kokY + 2);
    }

    dusmanCiz();

    // dronlar
    for (const g of B.gozculer) {
      if (g.tip !== 'dron' || g.kx < sol || g.kx > sag) continue;
      const sp = s.dron;
      gx.save(); gx.translate(g.kx, g.ky);
      gx.rotate(Math.sin(g.t * 6.2832 / g.periyot + g.faz) * 0.13 * (1 - (g.in || 0)));
      bas(gx, sp, -sp.kokX, -sp.isikY);
      if (!g.kapali) {
        gx.fillStyle = 'rgba(160,180,190,' + (0.16 + 0.1 * Math.sin(zaman * 70)) + ')';
        gx.beginPath(); gx.ellipse(-38, -23, 18, 2.4, 0, 0, 6.283); gx.fill();
        gx.beginPath(); gx.ellipse(38, -23, 18, 2.4, 0, 0, 6.283); gx.fill();
      }
      gx.restore();
    }
  }

  // robotun onunde kalanlar: pres kafalari, tasinan hucre, eldeki cihaz
  function tehlikeOn() {
    const s = Sanat.s, sp = s.presKafa, K = robot.iskelet;
    for (const p of B.presler) {
      if (p.x < cam.x - 200 || p.x > cam.x + W + 200) continue;
      const ust = p.y - 350, kafaUst = p.alt - sp.lh, boy = kafaUst - (ust + 56);
      if (boy > 0) {
        const g = gx.createLinearGradient(p.x - 9, 0, p.x + 9, 0);
        g.addColorStop(0, '#3a4349'); g.addColorStop(0.4, '#aab4ba'); g.addColorStop(1, '#2a3035');
        gx.fillStyle = g; gx.fillRect(p.x - 9, ust + 56, 18, boy);
        gx.fillStyle = 'rgba(40,30,22,0.35)';
        for (let yy = ust + 70; yy < kafaUst - 8; yy += 37) gx.fillRect(p.x - 9, yy, 18, 5);
      }
      bas(gx, sp, p.x - sp.kokX, kafaUst);
    }
    if (tasinan === 'pil') {
      // sirtta tasinir
      const pn = pilNokta();
      gx.save(); gx.translate(pn.x, pn.y); gx.rotate(Math.atan2(K.sy, K.sx) + 1.5708);
      bas(gx, s.hucre, -s.hucre.kokX, -s.hucre.kokY);
      gx.restore();
    }
    if (icerde && F.elde) {
      gx.save(); gx.translate(F.ex, F.ey); gx.rotate(-0.12 * K.f);
      bas(gx, s.cihaz, -s.cihaz.kokX, -s.cihaz.kokY);
      gx.restore();
    }
  }

  // isik listesi (ekran koordinati)
  function isiklariTopla() {
    const L = [];
    if (icerde) return L;
    for (const o of B.nesneler) {
      if (o.tip === 'lamba') {
        const lx = o.x + Sanat.s.lamba.isikX - cam.x, ly = o.y + Sanat.s.lamba.isikY - cam.y;
        if (lx < -400 || lx > W + 400) continue;
        L.push({ tip: 'lamba', x: lx, y: ly, yer: o.y - cam.y, guc: o.guc });
      } else if (o.tip === 'kapi') {
        const lx = o.x - cam.x;
        if (lx < -600 || lx > W + 600) continue;
        L.push({ tip: 'kapi', x: lx, y: o.y + Sanat.s.kapi.isikY - cam.y, yer: o.y - cam.y, guc: smooth(kapiAcik) * (0.92 + Math.sin(zaman * 2.1) * 0.06) });
      }
    }
    return L;
  }

  function yazi(t, x, y, boy, alfa, hiza, aralik, renk) {
    if (alfa <= 0.01 || !t) return;
    ctx.font = '300 ' + boy + 'px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = hiza || 'center'; ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (aralik === undefined ? boy * 0.42 : aralik) + 'px';
    ctx.fillStyle = 'rgba(' + (renk || '214,228,236') + ',' + clamp(alfa, 0, 1) + ')';
    ctx.fillText(t, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  // bitisteki buyuk ekran: eldeki cihazin gosterdigi goruntu (oyuncunun kamerasi)
  function ekranCiz(x, y, w, h, alfa) {
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.fillStyle = '#0b0f12'; ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
    ctx.fillStyle = 'rgba(150,170,180,0.25)'; ctx.fillRect(x - 10, y - 10, w + 20, 1.5);
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = '#060a0d'; ctx.fillRect(x, y, w, h);
    let goruntu = false;
    if (kamDurum === 'var' && video && video.videoWidth) {
      try {
        const o = Math.max(w / video.videoWidth, h / video.videoHeight), vw = video.videoWidth * o, vh = video.videoHeight * o;
        ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(-1, 1);
        ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);
        ctx.restore();
        goruntu = true;
      } catch (e) { goruntu = false; }
    }
    if (!goruntu) {
      // goruntu yok: karincali ekran + nabiz cizgisi
      const gr = Sanat.s.gren;
      ctx.globalAlpha = alfa * 0.3;
      for (let yy = y - ((Math.random() * 90) | 0); yy < y + h; yy += 192) for (let xx = x - ((Math.random() * 90) | 0); xx < x + w; xx += 192) ctx.drawImage(gr, xx, yy);
      ctx.globalAlpha = alfa;
      ctx.strokeStyle = 'rgba(255,190,110,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath();
      const my = y + h * 0.55, hz = 2.2 + F.temas * 1.6;
      for (let i = 0; i <= w; i += 4) {
        const f = ((i / w) * 3 + zaman * hz * 0.5) % 1;
        const tepe = f < 0.08 ? Math.sin(f / 0.08 * Math.PI) * 34 : (f < 0.16 ? -Math.sin((f - 0.08) / 0.08 * Math.PI) * 14 : 0);
        if (i === 0) ctx.moveTo(x + i, my - tepe); else ctx.lineTo(x + i, my - tepe);
      }
      ctx.stroke();
    }
    // eski ekran: mavi ton, tarama cizgileri, kenar kararmasi
    ctx.fillStyle = 'rgba(50,120,165,0.22)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    const kay = (zaman * 26) % 4;
    for (let yy = y + kay; yy < y + h; yy += 4) ctx.fillRect(x, yy, w, 1.2);
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.3, x + w / 2, y + h / 2, w * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.restore();
    if (Math.sin(zaman * 4) > 0) { ctx.fillStyle = 'rgba(255,80,60,' + 0.85 * alfa + ')'; ctx.beginPath(); ctx.arc(x + 14, y + 14, 4, 0, 6.283); ctx.fill(); }
    yazi(goruntu ? CFG.metin.canli : CFG.metin.sinyalVar, x + 26, y + 15, 10, 0.6 * alfa, 'left', 2);
  }

  function ciz() {
    const K = robot.iskelet;
    const sk = sars > 0.05 ? Math.sin(zaman * 95) * sars : 0;
    cam.y += sk;
    ctx.setTransform(rs, 0, 0, rs, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

    // --- gok ve arka katmanlar (odada yok) ---
    if (icerde) { ctx.fillStyle = '#020405'; ctx.fillRect(0, 0, W, H); }
    else if (B.tema.ic) icArka();
    else {
      if (Sanat.foto.uzak) {
        const im = Sanat.foto.uzak, o = (H * 1.12) / im.height, iw = im.width * o;
        const ox = -clamp(cam.x * 0.03, 0, Math.max(0, iw - W));
        ctx.drawImage(im, ox, -H * 0.06 - cam.y * 0.03, iw, H * 1.12);
      } else {
        ctx.drawImage(gok, 0, 0, W, H);
        sisCiz(ctx, zaman * 5 + cam.x * 0.02, -H * 0.05, 2.6, 0.55);
        katmanCiz(katman[0]);
      }
      const t1 = H * katman[0].taban - cam.y * katman[0].py;
      sisBandi(t1, 300, '72,100,114', 0.62);
      katmanCiz(katman[1]);
      const t2 = H * katman[1].taban - cam.y * katman[1].py;
      sisBandi(t2, 260, '58,84,97', 0.5);
      sisCiz(ctx, zaman * 9 + cam.x * 0.22, t2 - 250, 1.5, 0.5);
      katmanCiz(katman[2]);
      const t3 = H * katman[2].taban - cam.y * katman[2].py;
      sisBandi(t3, 230, '40,62,74', 0.5);
      sisCiz(ctx, -zaman * 14 + cam.x * 0.5, t3 - 210, 1.15, 0.42);
    }

    const L = isiklariTopla();
    // ekrandaki gozculer (kule + dron)
    const GZ = [];
    if (!icerde) for (const g of B.gozculer) {
      const sx = g.sx - cam.x;
      if (sx < -700 || sx > W + 700 || g.guc < 0.02) continue;
      GZ.push({ g: g, kx: g.kx - cam.x, ky: g.ky - cam.y, sx: sx, sy: g.sy - cam.y, guc: g.guc });
    }
    const pRenk = '235,' + Math.round(lerp(244, 70, uyari)) + ',' + Math.round(lerp(255, 60, uyari));
    const solE = cam.x - 200, sagE = cam.x + W + 200;
    const O = B.oda || { kaideX: 0, y: 0 }, odaLx = O.kaideX - cam.x, odaLy = O.y - 430 - cam.y, odaYer = O.y - cam.y;

    // --- isik huzmeleri (oyun katmaninin arkasinda) ---
    ctx.globalCompositeOperation = 'lighter';
    for (const l of L) {
      if (l.tip === 'lamba') {
        const g = ctx.createLinearGradient(0, l.y, 0, l.yer);
        g.addColorStop(0, 'rgba(255,200,120,' + 0.30 * l.guc + ')'); g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(l.x - 10, l.y); ctx.lineTo(l.x + 10, l.y); ctx.lineTo(l.x + 150, l.yer); ctx.lineTo(l.x - 150, l.yer); ctx.closePath(); ctx.fill();
        isin(ctx, l.x, l.y, 190, '255,190,110', 0.34 * l.guc);
      } else isin(ctx, l.x, l.y, 380, '255,176,96', 0.42 * l.guc);
    }
    for (const z of GZ) {
      const yr = z.g.yaricap;
      const g = ctx.createLinearGradient(z.kx, z.ky, z.sx, z.sy);
      g.addColorStop(0, 'rgba(' + pRenk + ',' + 0.34 * z.guc + ')'); g.addColorStop(1, 'rgba(' + pRenk + ',' + 0.05 * z.guc + ')');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(z.kx - 7, z.ky); ctx.lineTo(z.kx + 7, z.ky); ctx.lineTo(z.sx + yr, z.sy); ctx.lineTo(z.sx - yr, z.sy); ctx.closePath(); ctx.fill();
      isin(ctx, z.kx, z.ky, z.g.tip === 'dron' ? 70 : 120, pRenk, 0.7 * z.guc);
    }
    ctx.globalCompositeOperation = 'source-over';

    // --- oyun katmani ---
    gx.setTransform(1, 0, 0, 1, 0, 0);
    gx.globalCompositeOperation = 'source-over'; gx.globalAlpha = 1;
    gx.imageSmoothingEnabled = true; gx.imageSmoothingQuality = 'high';
    gx.clearRect(0, 0, G.width, G.height);
    gx.setTransform(rs, 0, 0, rs, -cam.x * rs, -cam.y * rs);
    nesneCiz();
    zeminCiz();
    konteynerCiz();
    tehlikeArka();
    // golge
    if (robot.yerde) {
      gx.fillStyle = 'rgba(0,0,0,0.42)';
      gx.beginPath(); gx.ellipse(robot.x + robot.yon * 26 * robot.surunK, robot.y + 2, 30 + 34 * robot.surunK, 4.5, Z.egim(robot.x, 14), 0, 6.283); gx.fill();
    }
    robotCiz();
    // toz
    for (const t of toz) {
      gx.fillStyle = 'rgba(150,150,140,' + 0.22 * (1 - t.o / t.s) + ')';
      gx.beginPath(); gx.arc(t.x, t.y, t.b, 0, 6.283); gx.fill();
    }
    tehlikeOn();
    siperCiz();
    etkiCiz(true);

    // --- karanlik maskesi ---
    mx.setTransform(MS, 0, 0, MS, 0, 0);
    mx.globalCompositeOperation = 'source-over';
    mx.clearRect(0, 0, W, H);
    mx.fillStyle = icerde ? 'rgba(2,4,7,0.88)' : (B.tema.ic ? 'rgba(2,4,7,0.93)' : 'rgba(3,7,11,0.80)'); mx.fillRect(0, 0, W, H);
    mx.globalCompositeOperation = 'destination-out';
    for (const l of L) {
      if (l.tip === 'lamba') { isin(mx, l.x, l.yer - 60, 250, '0,0,0', 0.95 * l.guc); isin(mx, l.x, l.y, 120, '0,0,0', 0.8 * l.guc); }
      else { isin(mx, l.x - 60, l.yer - 80, 380, '0,0,0', 0.95 * l.guc); isin(mx, l.x, l.y - 60, 260, '0,0,0', 0.45); }
    }
    const gozA = durum === 'giris' ? clamp((dZaman - 1.3) / 0.5, 0, 1) * (Math.sin(dZaman * 40) > -0.6 || dZaman > 2.2 ? 1 : 0.2) : 1;
    const rx = robot.x - cam.x, ry = K.hy - cam.y;
    isin(mx, rx, ry - 14, 120, '0,0,0', 0.5);
    isin(mx, K.gozX - cam.x + K.f * 96, K.gozY - cam.y + 26, 190, '0,0,0', 0.62 * gozA);
    if (B.tema.ic && !icerde) {      // karanlik bolum: gorebildigin yer fenerin uzandigi kadar
      isin(mx, K.gozX - cam.x + K.f * 230, K.gozY - cam.y + 34, 230, '0,0,0', 0.62 * gozA);
      isin(mx, K.gozX - cam.x + K.f * 390, K.gozY - cam.y + 40, 190, '0,0,0', 0.42 * gozA);
    }
    for (const z of GZ) {
      mx.save(); mx.translate(z.sx, z.sy); mx.scale(1, 0.62);
      isin(mx, 0, -40, z.g.yaricap * 1.25, '0,0,0', z.guc);
      mx.restore();
    }
    if (icerde) {
      // tavandaki tek lamba kaideyi ve duvardaki resmi aydinlatir
      isin(mx, odaLx, odaYer - 150, 430, '0,0,0', 0.9);
      isin(mx, odaLx + 190, odaYer - 190, 220, '0,0,0', 0.35);
      if (F.elde) isin(mx, F.ex - cam.x, F.ey - cam.y, 170, '0,0,0', 0.7);
      if (F.faz >= 4 && isaret.bas) isin(mx, isaret.x, isaret.y, 150, '0,0,0', clamp(0.5 + 0.1 * F.temas, 0, 0.9));
    } else {
      dusmanMaske(solE, sagE);
      for (const p of B.presler) if (p.x > solE && p.x < sagE) isin(mx, p.x - cam.x, p.y - 200 - cam.y, 190, '0,0,0', 0.42);
      for (const e of B.elektrik) if (e.acik && e.x1 > solE && e.x0 < sagE) isin(mx, (e.x0 + e.x1) / 2 - cam.x, e.y - 40 - cam.y, 190, '0,0,0', 0.8);
      for (const l of B.lazerler) if (l.acik && l.x1 > solE && l.x0 < sagE) {
        mx.save(); mx.translate((l.x0 + l.x1) / 2 - cam.x, l.y - l.h - cam.y); mx.scale((l.x1 - l.x0) / 130 + 0.6, 1);
        isin(mx, 0, 0, 90, '0,0,0', 0.4); mx.restore();
      }
      for (const b of B.bariyerler) if (b.x > solE && b.x < sagE) isin(mx, b.x - cam.x, b.y - 120 - cam.y, 170, '0,0,0', 0.25 + 0.3 * (b.k === undefined ? 1 : b.k));
      for (const e of B.etkiler) if (e.x > solE && e.x < sagE && gorunur(e)) isin(mx, e.x - cam.x, e.y - e.h - cam.y, 80, '0,0,0', 0.55);
      for (const d of B.dikenler) if (d.x1 > solE && d.x0 < sagE) isin(mx, (d.x0 + d.x1) / 2 - cam.x, d.y - 30 - cam.y, 120, '0,0,0', 0.5);
      for (const sd of B.sandiklar) if (sd.x1 > solE && sd.x0 < sagE) isin(mx, (sd.x0 + sd.x1) / 2 - cam.x, sd.ust + 30 - cam.y, 110, '0,0,0', 0.4);
      for (const p of B.plakalar) if (p.x1 > solE && p.x0 < sagE) isin(mx, (p.x0 + p.x1) / 2 - cam.x, p.y - 10 - cam.y, 90, '0,0,0', 0.4);
      for (const a of B.asansorler) if (a.x1 > solE && a.x0 < sagE) isin(mx, (a.x0 + a.x1) / 2 - cam.x, a.ust - 20 - cam.y, 130, '0,0,0', 0.4);
    }
    mx.globalCompositeOperation = 'source-over';
    gx.setTransform(1, 0, 0, 1, 0, 0);
    gx.globalCompositeOperation = 'source-atop';
    gx.drawImage(maske, 0, 0, G.width, G.height);
    gx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(G, 0, 0);
    ctx.setTransform(rs, 0, 0, rs, 0, 0);

    // --- parlamalar (onde) ---
    ctx.globalCompositeOperation = 'lighter';
    for (const l of L) {
      if (l.tip === 'lamba') {
        isin(ctx, l.x, l.y, 26, '255,232,185', 0.95 * l.guc);
        ctx.save(); ctx.translate(l.x, l.yer); ctx.scale(1, 0.16); isin(ctx, 0, 0, 170, '255,186,105', 0.3 * l.guc); ctx.restore();
      } else {
        // kasa agzindan tasan sicak isik + yere dokulen huzme
        isin(ctx, l.x + 6, l.y, 170, '255,200,130', 0.5 * l.guc);
        const g = ctx.createLinearGradient(l.x, 0, l.x - 420, 0);
        g.addColorStop(0, 'rgba(255,186,110,' + 0.22 * l.guc + ')'); g.addColorStop(1, 'rgba(255,186,110,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(l.x, l.y - 96); ctx.lineTo(l.x - 420, l.y - 150); ctx.lineTo(l.x - 420, l.yer); ctx.lineTo(l.x, l.yer - 24); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.translate(l.x - 90, l.yer); ctx.scale(1, 0.2); isin(ctx, 0, 0, 300, '255,180,100', 0.5 * l.guc); ctx.restore();
      }
    }
    if (icerde) {
      // tavan lambasi + eldeki cihazin ekran isigi + parmaga uzanan elin sicakligi
      const g = ctx.createLinearGradient(0, odaLy, 0, odaYer);
      g.addColorStop(0, 'rgba(255,214,160,0.20)'); g.addColorStop(1, 'rgba(255,214,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(odaLx - 8, odaLy); ctx.lineTo(odaLx + 8, odaLy); ctx.lineTo(odaLx + 230, odaYer); ctx.lineTo(odaLx - 230, odaYer); ctx.closePath(); ctx.fill();
      isin(ctx, odaLx, odaLy, 30, '255,232,190', 0.9);
      const cxs = (F.elde ? F.ex : O.kaideX) - cam.x, cys = (F.elde ? F.ey : O.y - 86) - cam.y;
      isin(ctx, cxs - 4, cys, 20 + Math.sin(zaman * 9) * 1.5, '120,200,255', 0.75);
      isin(ctx, cxs - 4, cys, 80, '90,170,230', 0.22);
      if (F.faz === 1) {
        const nb = 0.5 + 0.5 * Math.sin(zaman * 6);
        ctx.strokeStyle = 'rgba(255,225,170,' + (0.35 + 0.4 * nb) + ')'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(cxs, cys, 26 + nb * 5, 0, 6.283); ctx.stroke();
      }
      if (F.faz >= 4 && robot.elHedef[1]) {
        const ex = K.kol[1].hx - cam.x, ey = K.kol[1].hy - cam.y, yak = clamp(F.temas / 2.8, 0, 1);
        isin(ctx, ex, ey, 18 + yak * 40, '255,200,130', 0.3 + yak * 0.6);
        if (isaret.bas) isin(ctx, isaret.x, isaret.y, 30 + yak * 50, '255,210,150', 0.25 + yak * 0.5);
      }
    } else {
      // kasa kapisi: durum lambasi + iki guc hatti lambasi
      const kp = B.kapi, ksp = Sanat.s.kapi;
      if (kp.x > cam.x - 500 && kp.x < cam.x + W + 500) {
        const lx = kp.x + ksp.lambaX - cam.x, ly = kp.y + ksp.lambaY - cam.y;
        const yan = kapiAc ? 1 : (Math.sin(zaman * 5) > 0 ? 1 : 0.25);
        isin(ctx, lx, ly, 26, kapiAc ? '120,255,170' : '255,90,60', 0.9 * yan);
        for (let i = 0; i < B.hatlar.length; i++) isin(ctx, lx + (i - (B.hatlar.length - 1) / 2) * 62, ly + 14, 13, B.hatlar[i].yapildi ? '120,255,170' : '255,90,60', 0.8);
      }
      for (const z of GZ) {
        ctx.save(); ctx.translate(z.sx, z.sy); ctx.scale(1, 0.2);
        isin(ctx, 0, 0, z.g.yaricap * 1.05, pRenk, 0.55 * z.guc); ctx.restore();
        isin(ctx, z.kx, z.ky, z.g.tip === 'dron' ? 13 : 20, pRenk, z.guc);
      }
      // pres uyari lambalari
      for (const p of B.presler) {
        if (p.x < solE || p.x > sagE) continue;
        const px = p.x - cam.x, py = p.y - 338 - cam.y;
        if (p.kapali) isin(ctx, px, py, 12, '255,90,60', 0.3);
        else if (p.uyari) isin(ctx, px, py, 30, '255,70,40', Math.sin(zaman * 26) > 0 ? 1 : 0.2);
        else isin(ctx, px, py, 14, '255,180,80', 0.55);
      }
      // lazerler
      ctx.lineCap = 'butt';
      for (const l of B.lazerler) {
        if (l.x1 < solE || l.x0 > sagE) continue;
        const y = l.y - l.h - cam.y, a = l.x0 - cam.x, b = l.x1 - cam.x;
        if (!l.acik) {
          // sonuk: verici noktalari; yanmak uzereyken titrek ince isin
          const k = l.kapali ? 0.15 : 0.4;
          isin(ctx, a, y, 8, '255,80,60', k); isin(ctx, b, y, 8, '255,80,60', k);
          if (l.yakinda && Math.sin(zaman * 60) > 0) { ctx.strokeStyle = 'rgba(255,96,76,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.stroke(); }
          continue;
        }
        const tit = 0.75 + 0.25 * Math.sin(zaman * 31 + l.x0);
        ctx.strokeStyle = 'rgba(255,40,30,' + 0.22 * tit + ')'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,96,76,' + 0.92 * tit + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.stroke();
        isin(ctx, a, y, 14, '255,80,60', 0.8); isin(ctx, b, y, 14, '255,80,60', 0.8);
      }
      // lazer bariyerleri: yerden tavana dikey isinlar
      for (const b of B.bariyerler) {
        if (b.x < solE || b.x > sagE) continue;
        const k = b.k === undefined ? 1 : b.k, bx = b.x - cam.x, y0 = b.y - 233 - cam.y, y1 = b.y - 6 - cam.y;
        if (k > 0.02) {
          const tit = (0.8 + 0.2 * Math.sin(zaman * 37)) * k;
          ctx.fillStyle = 'rgba(255,40,30,' + 0.16 * tit + ')'; ctx.fillRect(bx - 16, y0, 34, y1 - y0);
          ctx.strokeStyle = 'rgba(255,96,76,' + 0.9 * tit + ')'; ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) { ctx.moveTo(bx - 11 + i * 6, y0); ctx.lineTo(bx - 11 + i * 6, y1); }
          ctx.stroke();
        }
        isin(ctx, bx - 27, b.y - 252 - cam.y, 12, b.kapali ? '120,255,170' : '255,80,60', 0.8);
      }
      // elektrik arklari: tam kablonun ucundan cikar
      for (const e of B.elektrik) {
        if (e.x1 < solE || e.x0 > sagE || e.ucX === undefined) continue;
        if (e.izgara) {
          if (e.acik) {
            const i0 = Math.max(e.x0, cam.x - 40) - cam.x, i1 = Math.min(e.x1, cam.x + W + 40) - cam.x, iy = e.y - cam.y;
            ctx.strokeStyle = 'rgba(190,225,255,0.85)'; ctx.lineWidth = 1.2;
            ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              let px = i0 + Math.random() * (i1 - i0);
              ctx.moveTo(px, iy - 2);
              for (let j = 0; j < 4; j++) { px += (Math.random() - 0.5) * 44; ctx.lineTo(px, iy - 2 - Math.random() * 22); }
            }
            ctx.stroke();
            ctx.fillStyle = 'rgba(120,180,255,' + (0.10 + Math.random() * 0.08) + ')'; ctx.fillRect(i0, iy - 26, i1 - i0, 26);
          }
          continue;
        }
        const ux = e.ucX - cam.x, uy = e.ucY - cam.y, mrk = (e.x0 + e.x1) / 2 - cam.x, yy = e.y - cam.y, w = e.x1 - e.x0;
        if (e.acik) {
          ctx.strokeStyle = 'rgba(190,225,255,0.9)'; ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let k = 0; k < 3; k++) {
            const hdf = mrk + (Math.random() - 0.5) * w * 0.8;
            ctx.moveTo(ux, uy);
            for (let j = 1; j <= 5; j++) ctx.lineTo(lerp(ux, hdf, j / 5) + (j < 5 ? (Math.random() - 0.5) * 16 : 0), lerp(uy, yy, j / 5));
          }
          ctx.stroke();
          isin(ctx, mrk, yy - 22, 120, '120,180,255', 0.3 + Math.random() * 0.2);
          ctx.save(); ctx.translate(mrk, yy); ctx.scale(1, 0.18); isin(ctx, 0, 0, w * 0.8, '150,200,255', 0.6); ctx.restore();
          isin(ctx, ux, uy, 9, '235,245,255', 1);
        } else if (e.yakinda && Math.random() < 0.5) isin(ctx, ux, uy, 16, '170,210,255', 0.8);
        // parlamanin ustune kablonun ucu yeniden cizilir (isikta kaybolmasin): siyah kilif + ciplak bakir uc
        const p2x = mrk + 16 + (e.sal || 0), p2y = yy - 120;
        ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round';
        ctx.strokeStyle = '#0a0c0e'; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.moveTo(lerp(p2x, ux, 0.6), lerp(p2y, uy, 0.6)); ctx.lineTo(lerp(p2x, ux, 0.93), lerp(p2y, uy, 0.93)); ctx.stroke();
        ctx.strokeStyle = e.acik ? '#ffe2b0' : '#a8794a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lerp(p2x, ux, 0.93), lerp(p2y, uy, 0.93)); ctx.lineTo(ux, uy); ctx.stroke();
        ctx.lineCap = 'butt'; ctx.globalCompositeOperation = 'lighter';
      }
      // sivri demir levhalarinda minik kirmizi isik (karanlikta belli olsun)
      for (const d of B.dikenler) {
        if (d.x1 < solE || d.x0 > sagE) continue;
        const sp = Sanat.s.diken;
        isin(ctx, d.x0 - sp.kokX + sp.levhaX + 16 - cam.x, d.y + sp.levhaY - cam.y, 10, '255,90,60', 0.5 + 0.4 * Math.sin(zaman * 5 + d.x0));
      }
      // asansor guc lambasi
      for (const a of B.asansorler) {
        if (a.x1 < solE || a.x0 > sagE) continue;
        isin(ctx, a.x1 - 3 - cam.x, a.yAlt - 170 - cam.y, 12, a.kapali ? '255,80,60' : '120,255,170', a.kapali ? 0.5 + 0.3 * Math.sin(zaman * 4) : 0.8);
      }
      // etkilesim noktalari: durum isigi, menzildeyken halka
      for (const e of B.etkiler) {
        if (e.x < solE || e.x > sagE || !gorunur(e)) continue;
        const ex = e.x - cam.x, ey = e.y - e.h - cam.y;
        const red = e.redT < 0.6 && Math.sin(e.redT * 40) > 0;
        if (e.tip === 'dugme' || e.tip === 'salter') {
          const yesil = e.yapildi || e.konum;
          isin(ctx, ex, e.tip === 'salter' ? ey - 14 : ey, 13, red ? '255,60,40' : (yesil ? '110,255,160' : '255,80,60'), red ? 1 : (yesil ? 0.8 : 0.55 + 0.3 * Math.sin(zaman * 4)));
        } else if (e.tip === 'hucre' || e.tip === 'yuva') {
          const dolu = e.tip === 'hucre' ? !e.yapildi : e.yapildi;
          if (dolu) isin(ctx, ex, ey, 22, '255,190,110', 0.6 + 0.2 * Math.sin(zaman * 3));
          else isin(ctx, ex, ey - 15, 8, '255,80,60', red ? 1 : 0.5);
        } else if (!e.yapildi) isin(ctx, ex, ey - 9, 7, '255,190,90', 0.8);
        else if (e.t < 0.35) isin(ctx, ex - e.s * 12, ey, 30, '170,210,255', (1 - e.t / 0.35) * (0.5 + Math.random() * 0.5));
        if (e.sure && e.yapildi) {
          // kalan sure halkasi
          ctx.strokeStyle = 'rgba(120,255,170,0.8)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(ex, ey, 15, -1.5708, -1.5708 + 6.2832 * clamp(e.kalan / e.sure, 0, 1)); ctx.stroke();
        }
        if (e === etkYakin && !robot.etk) {
          const nb = 0.5 + 0.5 * Math.sin(zaman * 6);
          ctx.strokeStyle = 'rgba(255,225,170,' + (0.35 + 0.4 * nb) + ')'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(ex, ey, 17 + nb * 4, 0, 6.283); ctx.stroke();
        }
      }
      // tasinan guc hucresinin isigi
      if (tasinan === 'pil') isin(ctx, K.hx + K.sx * 30 + K.sy * K.f * 19 - cam.x, K.hy + K.sy * 30 - K.sx * K.f * 19 - cam.y, 20, '255,190,110', 0.6);
    }
    if (!icerde) dusmanIsik(solE, sagE);
    // vizor ve cekirdek: siperin arkasinda kalinca gorunmez
    siperKirp();
    const gxs = K.gozX - cam.x, gys = K.gozY - cam.y;
    isin(ctx, gxs, gys, 5, '215,245,255', 1 * gozA);
    isin(ctx, gxs + K.f * 3, gys, 26, '110,200,255', 0.6 * gozA);
    const gk = ctx.createLinearGradient(gxs, gys, gxs + K.f * 260, gys + 60);
    gk.addColorStop(0, 'rgba(120,200,245,' + 0.13 * gozA + ')'); gk.addColorStop(1, 'rgba(120,200,245,0)');
    ctx.fillStyle = gk;
    ctx.beginPath(); ctx.moveTo(gxs, gys - 2); ctx.lineTo(gxs + K.f * 260, gys - 30); ctx.lineTo(gxs + K.f * 260, gys + 150); ctx.lineTo(gxs, gys + 3); ctx.closePath(); ctx.fill();
    // cekirdek: sinyal yaklastikca hizlanan nabiz
    const yakin = icerde ? 1 + F.temas * 0.5 : clamp(robot.x / B.bitisX, 0, 1);
    const nabiz = Math.pow(0.5 + 0.5 * Math.sin(zaman * (2.2 + yakin * 7)), 3);
    isin(ctx, K.cekX - cam.x, K.cekY - cam.y, 4 + sev.t * 3 + nabiz * (9 + (icerde ? F.temas * 6 : 0)), '255,190,110', (0.45 + nabiz * 0.55) * gozA);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    if (!icerde && !B.tema.ic) {
      // --- yer sisi, yagmur ---
      const yerY = robot.sonZeminY - cam.y;
      sisCiz(ctx, zaman * 22 + cam.x * 1.12, yerY - 150, 1.25, 0.34);
      ctx.strokeStyle = 'rgba(175,205,220,0.20)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of yagmur) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.u * 0.16, d.y + d.u); }
      ctx.stroke();

      // --- on plan (bulanik siluetler karakterin onunden gecer) ---
      for (const o of onPlan) {
        const w = o.sp.lw * o.k, h = o.sp.lh * o.k;
        const sx = o.x - cam.x * 1.55 - w / 2;
        if (sx > W || sx + w < 0) continue;
        const y = o.sp.ustten ? -30 - cam.y * 0.1 : H + 46 - h - cam.y * 0.18 + 30;
        ctx.globalAlpha = 0.93;
        if (o.cevir) { ctx.save(); ctx.translate(sx + w, y); ctx.scale(-1, 1); ctx.drawImage(o.sp, 0, 0, w, h); ctx.restore(); }
        else ctx.drawImage(o.sp, sx, y, w, h);
      }
      ctx.globalAlpha = 1;
    }

    // --- son islemler ---
    ctx.drawImage(vinyet, 0, 0, W, H);
    if (uyari > 0.02) { ctx.fillStyle = 'rgba(190,30,20,' + uyari * 0.16 + ')'; ctx.fillRect(0, 0, W, H); }

    // bitis: eldeki cihazin ekrani buyuk gorunur (oyuncunun goruntusu)
    if (icerde && F.elde && F.faz >= 3) {
      const a = smooth((F.faz === 3 ? F.t : 9) / 1.4) * (1 - F.beyaz * 0.4);
      const pw = Math.min(340, W * 0.3), ph = pw * 0.75, px = W * 0.585, py = H * 0.15;
      const cxs = F.ex - cam.x, cys = F.ey - cam.y;
      ctx.strokeStyle = 'rgba(120,190,235,' + 0.22 * a + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cxs, cys - 12); ctx.lineTo(px - 10, py - 10); ctx.moveTo(cxs, cys + 12); ctx.lineTo(px - 10, py + ph + 10); ctx.stroke();
      ekranCiz(px, py, pw, ph, a);
    }

    ctx.globalAlpha = 0.055; ctx.globalCompositeOperation = 'overlay';
    const gk2 = Sanat.s.gren, ox2 = (Math.random() * 192) | 0, oy2 = (Math.random() * 192) | 0;
    for (let y = -oy2; y < H; y += 192 * 2) for (let x = -ox2; x < W; x += 192 * 2) ctx.drawImage(gk2, x, y, 384, 384);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    if (karart > 0.003) { ctx.fillStyle = 'rgba(0,0,0,' + clamp(karart, 0, 1) + ')'; ctx.fillRect(0, 0, W, H); }
    if (F.beyaz > 0.003) { ctx.fillStyle = 'rgba(255,228,190,' + clamp(F.beyaz * 0.92, 0, 1) + ')'; ctx.fillRect(0, 0, W, H); }
    yaziCiz();
    cam.y -= sk;
  }

  function yaziCiz() {
    const M = CFG.metin;
    if (bolumNo > 1 && girisT < 6 && durum !== 'final') {
      yazi(M.bolum + ' ' + bolumNo, W / 2, H * 0.24, 14, gecis(girisT, 0.4, 5.2, 0.8) * 0.7, 'center', 5);
      yazi(M.bolumAd[bolumNo - 1], W / 2, H * 0.24 + 34, 22, gecis(girisT, 0.7, 5.4, 0.9));
    } else if (bolumNo === 1 && girisT < 11 && durum !== 'final') {
      const t = girisT;
      yazi(M.giris1, W / 2, H * 0.26, 21, gecis(t, 1.2, 5.2, 0.9));
      yazi(M.giris2, W / 2, H * 0.26, 21, gecis(t, 5.6, 10.2, 0.9));
    }
    // ipuclari: ilgili yere yaklasinca belirir
    if (durum === 'oyun') {
      for (const ip of B.ipuclari) {
        const d = Math.abs(robot.x - ip.x);
        if (d < 300) yazi(M[ip.ad], W / 2, H * 0.19, 15, clamp((300 - d) / 110, 0, 1) * 0.72, 'center', 4);
      }
    }
    // robotun dusuncesi (sicak renkte, altta)
    if (dsn) yazi(dsn.metin || M[dsn.ad], W / 2, H * 0.865, 17, gecis(dsn.t, 0, 4.6, 0.5) * 0.92, 'center', 1.5, F.beyaz > 0.3 ? '60,40,24' : '255,214,170');
    if (durum === 'geri' && geriNeden === 'yakalandi') yazi(M.yakalandin, W / 2, H * 0.4, 20, gecis(dZaman, 0.1, 1.2, 0.3));
    if (durum === 'geri' && geriNeden === 'hasar') yazi(M.hasar, W / 2, H * 0.4, 20, gecis(dZaman, 0.1, 1.2, 0.3));
    if (durum === 'final') {
      if (F.faz === 1) yazi(M.ipCihaz, W / 2, H * 0.19, 15, clamp(F.t - 1.5, 0, 1) * 0.72, 'center', 4);
      if (F.faz === 4) {
        yazi(M.ipEl, W / 2, H * 0.19, 16, clamp(F.t / 1.2, 0, 1) * (0.6 + 0.25 * Math.sin(zaman * 3)), 'center', 4);
        // temas gostergesi
        const k = clamp(F.temas / 2.8, 0, 1);
        if (k > 0.01) { ctx.strokeStyle = 'rgba(255,214,170,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, H * 0.27, 13, -1.5708, -1.5708 + 6.2832 * k); ctx.stroke(); }
      }
      if (F.faz === 5) {
        yazi(M.son1, W / 2, H * 0.42, 30, clamp((F.t - 2.2) / 1.4, 0, 1), 'center', undefined, '40,26,14');
        yazi(M.son2, W / 2, H * 0.42 + 56, 15, clamp((F.t - 4.4) / 1.2, 0, 1) * 0.8, 'center', undefined, '60,40,24');
        yazi(M.tekrar, W / 2, H * 0.82, 13, clamp((F.t - 7) / 1, 0, 1) * (0.5 + 0.2 * Math.sin(zaman * 3)), 'center', 3, '60,40,24');
      }
    }
    // sinyal gostergesi + surum
    if (durum === 'oyun' || durum === 'geri' || durum === 'kapida' || (durum === 'final' && F.faz < 5)) {
      // sinyal butun bolumler boyunca dolar: her bolum toplamin 1/5'i
      const yuzde = icerde ? 100 : Math.round((bolumNo - 1 + clamp(robot.x / B.bitisX, 0, 1)) / BOLUM_SAYI * 100);
      const nb = 0.4 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(zaman * (2.2 + yuzde * 0.07)), 3);
      ctx.fillStyle = 'rgba(255,190,110,' + nb * 0.8 + ')';
      ctx.beginPath(); ctx.arc(30, 30, 3.5, 0, 6.283); ctx.fill();
      yazi(M.sinyal + '  %' + yuzde, 44, 31, 11, 0.42, 'left', 3);
    }
    yazi(CFG.oyunAdi + ' ' + CFG.surum, W - 16, H - 14, 10, 0.3, 'right', 2);
  }

  // ================= BOLUMLER =================
  function bolumYukle(no) {
    bolumNo = no;
    B = bolumKur(no); Z = B.zemin;
    robot = new Robot(Z);
    robot.merdivenler = B.tirmanma;
    robot.alcaklar = B.alcaklar;
    // siperin icinde kalan etkilesim kutulari siperin onunde cizilir (yoksa gorunmez)
    for (const e of B.etkiler) for (const s of B.siperler) if (Math.abs(e.x - s.x) < 70) e.onde = true;
    katman = []; onPlan = [];
    if (!B.tema.ic) katmanKur();
    for (const o of B.nesneler) if (o.tip === 'lamba') o.guc = 1;
    yenidenBasla();
    bolumDugmeleri();
  }
  // ustteki 1-5 dugmeleri: hazir bolume aninda gecer
  function bolumDugmeleri() {
    const ds = document.querySelectorAll('#bolumler button');
    for (let i = 0; i < ds.length; i++) {
      const n = i + 1;
      ds[i].className = (n === bolumNo ? 'secili' : '') + (n > BOLUM_HAZIR ? ' kilitli' : '');
      if (!ds[i]._bagli) {
        ds[i]._bagli = true;
        ds[i].addEventListener('click', (e) => { e.preventDefault(); if (n <= BOLUM_HAZIR) bolumYukle(n); });
      }
    }
  }

  // ic mekan arka plani (gok, sehir, yagmur yok)
  function icArka() {
    const sp = Sanat.s.icDuvar, tw = sp.width;
    ctx.fillStyle = '#020405'; ctx.fillRect(0, 0, W, H);
    const kay = cam.x * 0.62, oy = clamp(-cam.y * 0.5 - 40, -110, 110);
    for (let x = -(((kay % tw) + tw) % tw); x < W; x += tw) ctx.drawImage(sp, x, oy);
    sisCiz(ctx, zaman * 6 + cam.x * 0.7, H * 0.42, 1.4, 0.10);
    if (B.tema.renk) { ctx.fillStyle = 'rgba(' + B.tema.renk + ',0.17)'; ctx.fillRect(0, 0, W, H); }     // bolumun rengi (kanal yesili, cekirdek kizili)
  }

  // ================= DUSMANLAR, LAZER, OLUM SAHNELERI =================
  function isikta(x, y) {
    for (const o of B.lambalar) if (!o.kapali && Math.abs(x - o.x) < o.r && Math.abs(y - o.y) < 120) return true;
    return false;
  }
  function saklaniyor() {
    if (robot.egilK < 0.6) return false;
    for (const s of B.siperler) if (Math.abs(robot.x - s.x) < s.w / 2 - 6) return true;
    return false;
  }
  function kivEkle(x, y, n) {
    for (let i = 0; i < n; i++) kiv.push({ x: x, y: y, vx: (Math.random() - 0.5) * 460, vy: -60 - Math.random() * 320, o: 0, s: 0.25 + Math.random() * 0.45 });
  }
  function oldur(d) {
    if (d.olu) return;
    d.olu = true; d.oluT = 0;
    ses('hasar', d.x, 0.7);
    kivEkle(d.x, d.y - 36, 12);
  }
  function nisanVur(n) {
    n.yapildi = true; n.t = 0;
    ses('vur', n.x);
    kivEkle(n.x, n.y - n.h, 10);
    for (const h of n.hedef) { h.kapali = true; h.kalici = true; }
    for (const h of n.ac) h.kapali = false;
    if (n.asili) n.asili.durum = 1;
    if (n.grup && n.grup.every((g) => g.yapildi)) for (const h of n.grupAc) h.kapali = false;
    if (n.cevir) { for (const h of n.cevir) h.kapali = !h.kapali; n.konum = !n.konum; n.yapildi = false; ses('guc'); }      // ac / kapa: yeniden kullanilir
    if (n.grup && n.grupDusun) dusun(n.grup.every((g) => g.yapildi) ? 'dKilitHepsi' : 'dKilitBir');
    if (n.hedef.length) ses('bariyer'); else if (n.ac.length) ses('guc');
    if (n.dusun) dusun(n.dusun);
  }

  // omuz lazeri: ekrana dokunulan yone ates eder; ilk carptigi hedefte durur
  function lazerAt(dt) {
    lz.sog -= dt; lz.t += dt;
    if (!yet.lazer || durum !== 'oyun' || !isaret.yeni || isaret.kullanildi || lz.sog > 0 || robot.merd || robot.surunK > 0.5 || robot.etk) return;
    const K = robot.iskelet, wx = isaret.x + cam.x, wy = isaret.y + cam.y;
    if (Math.abs(wx - robot.x) < 55 && wy > robot.y - 190 && wy < robot.y + 20) return;      // robotun ustune dokunma: ates etme (oksama)
    robot.yon = wx >= robot.x ? 1 : -1;
    const ox = robot.x - robot.yon * 4, oy = K.ny - 9;
    let dx = wx - ox, dy = wy - oy;
    const uz = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= uz; dy /= uz;
    let son = 640;
    for (let s = 24; s <= 640; s += 10) { if (oy + dy * s > Z.yuk(ox + dx * s) + 2) { son = s; break; } }
    let vur = null;
    const dene = (o, x, y, r) => {
      const t = (x - ox) * dx + (y - oy) * dy;
      if (t < 0 || t > son + r) return;
      const ux = ox + dx * t - x, uy = oy + dy * t - y;
      if (ux * ux + uy * uy < r * r) { son = Math.min(son, t); vur = o; }
    };
    for (const n of B.nisanlar) if (!n.yapildi && n.tip !== 'kol' && !n.ayna && !(n.asili && n.asili.durum !== 0)) dene(n, n.x, n.y - n.h, 24);
    for (const a of B.arilar) if (!a.olu) dene(a, a.x, a.y, 30);
    for (const t of B.taretler) if (!t.olu && !t.kapali) dene(t, t.x, t.y + 16, 26);
    for (const q of B.suruler) if (q.durum === 1) dene(q, q.x, q.y - 10, 46);
    for (const a of B.aynalar) dene(a, a.x, a.y, 28);
    for (const m of B.mayinlar) if (!m.olu) dene(m, m.x, m.y, 26);
    for (const n of B.nisanlar) if (n.ayna) dene({ tip: 'plaka', x: n.x, y: n.y - n.h + 14 }, n.x, n.y - n.h + 12, 36);      // kafes: dogrudan atis siperde kalir
    for (const d of B.dusmanlar) if (!d.olu && d.tip === 'dortayak') dene(d, d.x, d.y - 36, 44);
    lz.x0 = ox; lz.y0 = oy; lz.x1 = ox + dx * son; lz.y1 = oy + dy * son; lz.ax = dx; lz.ay = dy; lz.t = 0; lz.sog = 0.65;
    ses('lazer');
    kivEkle(lz.x1, lz.y1, 5);
    if (!vur) return;
    if (vur.tip === 'dortayak') {
      // yalnizca zirhsiz olan, arkasindan (sirtindaki hucreden) vurulur
      if (!vur.zirhli && (vur.x - ox) * vur.yon > 0) oldur(vur); else { vur.kosT = 2.2; ses('red'); }
    } else if (vur.tip === 'sigorta' || vur.tip === 'halat') nisanVur(vur);
    else ekVur(vur);
  }

  function dusmanGuncelle(dt) {
    const rx = robot.x, ry = robot.y, oyun = durum === 'oyun';
    const gizli = saklaniyor();
    for (const k of B.kopruler) { k.e.aktif = !k.kapali; k.k = damp(k.k === undefined ? 0 : k.k, k.kapali ? 0 : 1, 5, dt); }
    for (const n of B.nisanlar) n.t += dt;
    for (let i = kiv.length - 1; i >= 0; i--) { const k = kiv[i]; k.o += dt; k.vy += 900 * dt; k.x += k.vx * dt; k.y += k.vy * dt; if (k.o > k.s) kiv.splice(i, 1); }

    for (const d of B.dusmanlar) {
      if (d.olu) { d.oluT += dt; continue; }
      const yemli = d.tip === 'dortayak' && yem.t > 0 && Math.abs(yem.x - d.x) < 600 && Math.abs(yem.y - d.y) < 20;      // yeme kosar
      const dx = (yemli ? yem.x : rx) - d.x, uzak = Math.abs(dx), yon = dx >= 0 ? 1 : -1;
      if (d.tip === 'golge') {
        // golge: isikta kipirdayamaz; robot arkasini donunce yaklasir; lambanin altinda kalirsa yanar
        if (!d.uyanik) { if (oyun && rx > Math.min(d.uyanX0, d.bas + 230) && rx < d.uyanX1) d.uyanik = true; else continue; }
        const lamba = isikta(d.x, d.y);
        const fener = robot.yon === -yon && uzak < 450 && Math.abs(ry - d.y) < 150 && !robot.merd;
        d.isik = lamba || fener;
        if (lamba) { d.v = 0; d.yanT += dt; if (d.yanT > 2.2) { oldur(d); continue; } }
        else {
          d.yanT = Math.max(0, d.yanT - dt);
          // havada suzulur: yumusak hizlanir, isik vurunca yavaslayip durur, uzun bakilirsa geriler
          let hv = 0;
          if (fener) { d.isikT += dt; if (d.isikT > 0.6) hv = -yon * 55; }
          else { d.isikT = 0; if (Math.abs(ry - d.y) < 220 && uzak > 6) hv = yon * d.hiz; }
          d.v = yaklas(d.v || 0, hv, (hv === 0 ? 620 : 230) * dt);
          const nx = d.x + d.v * dt;
          if (nx > d.x0 && nx < d.x1 && !isikta(nx, d.y)) { d.x = nx; d.adim += Math.abs(d.v) * dt; } else d.v = 0;
        }
        if (oyun && uzak < 32 && Math.abs(ry - d.y) < 70) { if (sarjT > 0) oldur(d); else geriAl('hasar', 'golge'); }
      } else {
        // dortayak: devriye; onunde robotu gorurse kosar
        d.bekle -= dt;
        if (yemli || (oyun && !gizli && yon === d.yon && uzak < d.gor && Math.abs(ry - d.y) < 62)) d.kosT = 1.4;
        if (d.kosT > 0) {
          d.kosT -= dt; d.yon = yon;
          const nx = d.x + yon * 265 * dt;
          if (uzak > 20 && nx > d.x0 - 170 && nx < d.x1 + 170 && Math.abs(Z.yukZemin(nx + yon * 50) - d.y) < 4) d.x = nx;
          d.adim += 265 * dt;
        } else if (d.bekle <= 0) {
          const nx = d.x + d.yon * d.hiz * dt;
          if ((nx < d.x0 && d.yon < 0) || (nx > d.x1 && d.yon > 0)) { d.yon = -d.yon; d.bekle = 0.8; }
          else { d.x = nx; d.adim += d.hiz * dt; }
        }
        for (const e of B.elektrik) if (e.acik && d.x > e.x0 && d.x < e.x1 && Math.abs(e.y - d.y) < 10) oldur(d);
        if (!d.olu && oyun && Math.abs(rx - d.x) < 46 && ry > d.y - 52 && ry < d.y + 30) geriAl('hasar', 'dortayak');
      }
    }

    // halati vurulan sandik duser: altindaki dortayagi (ve robotu) ezer, sonra itilebilir sandik olur
    for (const a of B.asililar) {
      if (a.durum !== 1) continue;
      a.vy += 1500 * dt; a.y += a.vy * dt;
      if (a.y < a.yer - 70) continue;
      a.y = a.yer - 70; a.durum = 2;
      const s = { x0: a.x, x1: a.x + 76, w: 76, h: 70, ust: a.yer - 70, taban: a.yer, min: a.min, max: a.max, bas: a.x, gecici: true };
      Z.bloklar.push(s); B.sandiklar.push(s); a.s = s;
      sars = Math.max(sars, 4); tozEkle(a.x + 38, a.yer, 10, 90, 160); ses('pres', a.x, 0.7);
      for (const d of B.dusmanlar) if (!d.olu && d.tip === 'dortayak' && Math.abs(d.x - (a.x + 38)) < 80 && Math.abs(d.y - a.yer) < 10) oldur(d);
      if (oyun && Math.abs(rx - (a.x + 38)) < 48 && Math.abs(ry - a.yer) < 30) geriAl('hasar', 'ezik');
    }

    // tasiyicinin ustunde, egilmeden yuksek boruya gelirse takilir (tasiyici altindan kayip gider)
    for (const a of B.alcaklar) {
      if (!a.kot || rx < a.x0 - 4 || rx > a.x1 + 4) continue;
      if (ry < a.y - a.kot + 30 && ry > a.y - a.kot - 60 && robot.boyAl() > 116) {
        const p = B.paletliler.find((q) => rx >= q.x0 - 4 && rx <= q.x1 + 4);
        const yn = p ? p.yon : robot.yon;
        robot.x = yn > 0 ? a.x0 - 5 : a.x1 + 5; robot.vx = 0;
        if (zaman - (a.sesT || -9) > 1) { a.sesT = zaman; ses('kalas'); sars = Math.max(sars, 2); }
      }
    }
  }

  // tasinan guc hucresinin yeri: once elde, sonra sirta takilir
  function pilNokta() {
    const K = robot.iskelet;
    const bx = K.hx + K.sx * 30 + K.sy * K.f * 19, by = K.hy + K.sy * 30 - K.sx * K.f * 19;
    const k = smooth((tasT - 0.35) / 0.5);
    return { x: lerp(tasX, bx, k), y: lerp(tasY, by, k), k: k };
  }
  // ellerin gidecegi yer: itilen sandigin ust kosesi / sirta takilan hucre
  function elleriAyarla() {
    if (durum === 'final') return;
    let h0 = null, h1 = null;
    if (itilen) { h0 = { x: itilen.x, y: itilen.y + 5 }; h1 = { x: itilen.x, y: itilen.y + 17 }; }
    else if (tasinan && tasT < 0.9) { const p = pilNokta(); h0 = { x: p.x, y: p.y }; }
    else if (robot.dis && kn.h) h0 = { x: lerp(robot.x, kn.h.x, 0.25), y: Math.max(kn.h.y + 6, robot.y - 190) };       // kancanin tutundugu halka
    robot.elHedef[0] = h0; robot.elHedef[1] = h1;
  }

  function dusmanCiz() {
    const s = Sanat.s, sol = cam.x - 260, sag = cam.x + W + 260;
    ekCiz(sol, sag);
    ek2Ciz(sol, sag);
    // tavan lambalari
    for (const o of B.lambalar) {
      if (o.x < sol || o.x > sag) continue;
      const ly = o.y - o.h;
      gx.strokeStyle = '#0b0e10'; gx.lineWidth = 2;
      gx.beginPath(); gx.moveTo(o.x, ly - 700); gx.lineTo(o.x, ly - 18); gx.stroke();
      bas(gx, s.tlamba, o.x - s.tlamba.kokX, ly - s.tlamba.lh + 4);
    }
    // uzanan kopruler
    for (const k of B.kopruler) {
      const e = k.e;
      if (e.x1 < sol || e.x0 > sag) continue;
      serit(s.tabla150, e.x0, e.y, (e.x1 - e.x0) * (0.1 + 0.9 * (k.k || 0)));
      gx.fillStyle = '#161b1e'; gx.fillRect(e.x0 - 16, e.y - 5, 16, 26);
    }
    // sigorta kutulari
    for (const n of B.nisanlar) {
      if (n.tip !== 'sigorta' || n.x < sol || n.x > sag) continue;
      const ny = n.y - n.h;
      gx.strokeStyle = '#0b0e10'; gx.lineWidth = 3;
      gx.beginPath(); gx.moveTo(n.x, ny - 20); gx.lineTo(n.x, B.tema.ic || Z._taban(n.x) >= CUKUR ? ny - 700 : n.y); gx.stroke();
      bas(gx, s.sigorta, n.x - s.sigorta.kokX, ny - s.sigorta.kokY);
      if (n.yapildi) { gx.fillStyle = 'rgba(0,0,0,0.65)'; gx.beginPath(); gx.arc(n.x, ny, 9, 0, 6.283); gx.fill(); }
    }
    // halata asili sandiklar
    for (const a of B.asililar) {
      if (a.x < sol - 100 || a.x > sag || a.durum === 2) continue;
      gx.strokeStyle = '#3a3128'; gx.lineWidth = 3; gx.lineCap = 'butt';
      gx.beginPath();
      if (a.durum === 0) {
        gx.moveTo(a.x + 38, a.y - 700); gx.lineTo(a.x + 38, a.y - 22);
        gx.moveTo(a.x + 38, a.y - 22); gx.lineTo(a.x + 8, a.y + 4); gx.moveTo(a.x + 38, a.y - 22); gx.lineTo(a.x + 68, a.y + 4);
      } else { gx.moveTo(a.x + 38, a.y0 - 700); gx.lineTo(a.x + 38 + Math.sin(zaman * 5) * 4, a.y0 - 56); }
      gx.stroke();
      bas(gx, s.sandik, a.x, a.y);
    }
    // paletli tasiyicilar
    for (const p of B.paletliler) {
      if (p.x1 < sol || p.x0 > sag) continue;
      bas(gx, s.paletli, p.x0, p.ust);
      gx.fillStyle = 'rgba(120,135,142,0.5)';
      const kay = ((p.x0 % 14) + 14) % 14;
      for (let xx = 10 + (14 - kay); xx < p.w - 12; xx += 14) { gx.fillRect(p.x0 + xx, p.ust + 47, 5, 2.4); gx.fillRect(p.x1 - xx - 5, p.taban - 2.6, 5, 2.4); }
    }
    // dusmanlar
    for (const d of B.dusmanlar) {
      if (d.x < sol || d.x > sag) continue;
      if (d.tip === 'golge') {
        const sp = s.golge, alfa = d.olu ? clamp(1 - d.oluT / 1.6, 0, 1) : 1;
        if (alfa <= 0) continue;
        gx.globalAlpha = alfa;
        const cok = d.olu ? smooth(d.oluT / 0.8) * 42 : 0;
        const by = d.y - 44 + cok + (d.isik || d.olu ? 0 : Math.sin(d.adim * 0.07) * 3);     // govdenin alti
        const rr = sign(robot.x - d.x) || 1, uz = d.isik || !d.uyanik ? 4 : 26;
        // bacak yok: itici tablanin ustunde suzulur, hizlaninca one yatar. Kollar dokulu parcalardan
        const yat = clamp((d.v || 0) / 150, -1, 1) * 0.1;
        gx.save(); gx.translate(d.x, by); gx.rotate(yat);
        bas(gx, sp, -sp.kokX, -sp.lh + 6);
        gx.drawImage(s.hover, -32, -4, 64, 18);
        for (let i = -1; i <= 1; i += 2) {
          const ox = i * 17, dx2 = i * 25 + rr * 9, hx2 = i * 13 + rr * uz;
          uzuv(ox, -90, dx2, -52, 8); uzuv(dx2, -52, hx2, -18, 6.5);
        }
        gx.restore();
        gx.globalAlpha = 1;
      } else {
        const sp = d.zirhli ? s.dortayakZ : s.dortayak;
        const gy = d.y - 20 + (d.olu ? smooth(d.oluT / 0.4) * 16 : 0);       // govdenin alti
        for (let i = 0; i < 4; i++) {
          const kx = d.x + ((i < 2 ? -38 : 30) + (i % 2) * 9) * d.yon, f = d.adim * 0.075 + (i === 0 || i === 3 ? 0 : 3.14);
          const fx = kx + (d.olu ? (i < 2 ? -15 : 15) * d.yon : Math.sin(f) * 12 * d.yon), fy = d.y - (d.olu ? 0 : Math.max(0, Math.cos(f)) * 7);
          const ik = ikCoz(kx, gy - 6, fx, fy - 3, 15, 15, d.yon * (i < 2 ? 1 : -1));
          uzuv(kx, gy - 6, ik.jx, ik.jy, 10); uzuv(ik.jx, ik.jy, ik.ex, ik.ey, 7.5);
          uzuv(ik.ex - 6, fy - 2.5, ik.ex + 7, fy - 2.5, 5);       // taban
        }
        gx.save(); gx.translate(d.x, gy);
        if (d.yon < 0) gx.scale(-1, 1);
        if (d.olu) gx.rotate(0.1);
        bas(gx, sp, -sp.kokX, -sp.lh + 10);
        gx.restore();
      }
    }
  }

  // robot + olum sahneleri + omuz lazeri
  function robotCiz() {
    const K = robot.iskelet, x = robot.x, y = robot.y;
    const olur = durum === 'geri' && !robot._yerlesti && olm.tip;
    if (olur && olm.tip === 'ezik') {
      // pres altinda yassilasir
      const k = clamp(dZaman / 0.14, 0, 1);
      gx.save(); gx.translate(x, y); gx.scale(lerp(1, 1.55, k), lerp(1, 0.09, k * k)); gx.translate(-x, -y);
      robot.ciz(gx); gx.restore();
    } else if (olur && olm.tip === 'lazer') {
      // lazerin gectigi hizadan kesilir: ust yari kayip duser
      const ky = Math.min(olm.y, y - 6), k = smooth((dZaman - 0.12) / 0.75);
      gx.save(); gx.beginPath(); gx.rect(x - 240, ky, 480, 500); gx.clip(); robot.ciz(gx); gx.restore();
      gx.save();
      gx.translate(x - robot.yon * k * 30, ky + k * k * Math.max(0, y - ky - 14)); gx.rotate(-robot.yon * k * 1.35); gx.translate(-x, -ky);
      gx.beginPath(); gx.rect(x - 240, ky - 500, 480, 500); gx.clip(); robot.ciz(gx); gx.restore();
    } else if (olur && olm.tip === 'elektrik' && dZaman < 0.75) {
      gx.save(); gx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4); robot.ciz(gx); gx.restore();
    } else robot.ciz(gx);
    if (yet.lazer && !olur) {
      // omuzdaki lazer: son ates edilen yone doner
      const sp = Sanat.s.omuz;
      let ac = -0.12;
      if (lz.t < 0.7) ac = clamp(Math.atan2(lz.ay, lz.ax * K.f), -1.3, 1.1);
      gx.save(); gx.translate(K.nx - K.f * 7, K.ny - 7);
      if (K.f < 0) gx.scale(-1, 1);
      gx.rotate(ac);
      bas(gx, sp, -sp.kokX, -sp.kokY);
      gx.restore();
    }
    ekRobot(olur);
  }

  function olumIsik() {
    if (durum !== 'geri' || robot._yerlesti || !olm.tip) return;
    const x = robot.x - cam.x, y = robot.y - cam.y, t = dZaman;
    if (olm.tip === 'lazer') {
      const ky = Math.min(olm.y, robot.y - 6) - cam.y, a = clamp(1.5 - t, 0, 1);
      ctx.strokeStyle = 'rgba(255,150,60,' + a + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 24, ky); ctx.lineTo(x + 24, ky); ctx.stroke();
      isin(ctx, x, ky, 44, '255,120,50', 0.7 * a);
    } else if (olm.tip === 'elektrik' && t < 0.85) {
      ctx.strokeStyle = 'rgba(190,225,255,0.9)'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        let px = x + (Math.random() - 0.5) * 40, py = y - Math.random() * 150;
        ctx.moveTo(px, py);
        for (let j = 0; j < 3; j++) { px += (Math.random() - 0.5) * 30; py += (Math.random() - 0.5) * 34; ctx.lineTo(px, py); }
      }
      ctx.stroke();
      isin(ctx, x, y - 80, 120, '140,190,255', 0.3 + Math.random() * 0.3);
    } else if (olm.tip === 'yakalandi') {
      // hedef kilidi: kirmizi kose isaretleri daralir
      const a = clamp(t / 0.2, 0, 1) * clamp(1.4 - t, 0, 1), b = 46 + (1 - clamp(t / 0.35, 0, 1)) * 70, cy = y - 84, u = 16;
      ctx.strokeStyle = 'rgba(255,60,50,' + 0.85 * a + ')'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let sx = -1; sx <= 1; sx += 2) for (let sy = -1; sy <= 1; sy += 2) {
        const px = x + sx * b, py = cy + sy * b * 1.5;
        ctx.moveTo(px - sx * u, py); ctx.lineTo(px, py); ctx.lineTo(px, py - sy * u);
      }
      ctx.stroke();
    } else if (olm.tip === 'golge') isin(ctx, x, y - 80, 170, '255,30,20', 0.3 * clamp(1 - t, 0, 1));
    else if (olm.tip === 'ezik' && t < 0.3) isin(ctx, x, y - 10, 90, '255,200,130', 0.5 * (1 - t / 0.3));
  }

  // lambalar, dusman gozleri, hedef isaretleri, lazer isini, kivilcimlar (ekran koordinati, parlak katman)
  function dusmanIsik(solE, sagE) {
    const K = robot.iskelet;
    for (const o of B.lambalar) {
      if (o.kapali || o.x < solE - 200 || o.x > sagE + 200) continue;
      const lx = o.x - cam.x, ly = o.y - o.h - cam.y, yer = o.y - cam.y;
      const g = ctx.createLinearGradient(0, ly, 0, yer);
      g.addColorStop(0, 'rgba(255,200,120,0.24)'); g.addColorStop(1, 'rgba(255,200,120,0.02)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(lx - 12, ly); ctx.lineTo(lx + 12, ly); ctx.lineTo(lx + o.r, yer); ctx.lineTo(lx - o.r, yer); ctx.closePath(); ctx.fill();
      isin(ctx, lx, ly, 26, '255,230,180', 0.95);
      ctx.save(); ctx.translate(lx, yer); ctx.scale(1, 0.16); isin(ctx, 0, 0, o.r, '255,190,110', 0.32); ctx.restore();
    }
    for (const d of B.dusmanlar) {
      if (d.x < solE || d.x > sagE) continue;
      const dx = d.x - cam.x, dy = d.y - cam.y;
      if (d.tip === 'golge') {
        if (d.olu) { if (d.oluT < 0.8) isin(ctx, dx, dy - 80, 90, '255,160,80', 0.6 * (1 - d.oluT / 0.8)); continue; }
        isin(ctx, dx, dy - 156, d.isik ? 5 : 8, '255,40,30', d.uyanik ? (d.isik ? 0.5 : 0.95) : 0.16);
        if (d.uyanik) isin(ctx, dx, dy - 26, 26 + Math.abs(d.v || 0) * 0.08, '140,175,255', 0.28 + Math.abs(d.v || 0) * 0.002);      // itici
        if (d.yanT > 0) isin(ctx, dx, dy - 90, 60 + d.yanT * 20, '255,150,70', 0.2 + 0.25 * Math.random());      // lambanin altinda yaniyor
      } else {
        if (d.olu) { if (d.oluT < 0.7 && Math.random() < 0.6) isin(ctx, dx + (Math.random() - 0.5) * 60, dy - 30, 22, '170,210,255', 0.8); continue; }
        const rk = d.kosT > 0 ? '255,60,50' : '255,190,110';
        isin(ctx, dx + d.yon * 50, dy - 47, 9, rk, 0.9);
        const g = ctx.createLinearGradient(dx, 0, dx + d.yon * d.gor, 0);
        g.addColorStop(0, 'rgba(' + rk + ',0.16)'); g.addColorStop(1, 'rgba(' + rk + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(dx + d.yon * 50, dy - 49); ctx.lineTo(dx + d.yon * d.gor, dy - 86); ctx.lineTo(dx + d.yon * d.gor, dy); ctx.lineTo(dx + d.yon * 50, dy - 44); ctx.closePath(); ctx.fill();
        if (!d.zirhli) isin(ctx, dx - d.yon * 46, dy - 50, 11, '255,190,110', 0.7 + 0.25 * Math.sin(zaman * 5));
      }
    }
    for (const p of B.paletliler) {
      if (p.x1 < solE || p.x0 > sagE) continue;
      isin(ctx, (p.yon > 0 ? p.x1 - 15 : p.x0 + 15) - cam.x, p.ust + 19 - cam.y, 12, '255,190,110', 0.8);
    }
    for (const n of B.nisanlar) {
      if (n.x < solE || n.x > sagE || n.tip === 'kol') continue;
      const nx = n.x - cam.x, ny = n.y - n.h - cam.y;
      if (n.yapildi) { if (n.t < 0.5) isin(ctx, nx, ny, 50, '170,210,255', (1 - n.t / 0.5) * (0.5 + Math.random() * 0.5)); continue; }
      if (n.asili && n.asili.durum !== 0) continue;
      const nb = 0.5 + 0.5 * Math.sin(zaman * 4 + n.x);
      isin(ctx, nx, ny, 10, '120,220,255', 0.5 + 0.3 * nb);
      if (yet.lazer) {
        // nisan isareti
        ctx.strokeStyle = 'rgba(120,220,255,' + (0.25 + 0.3 * nb) + ')'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(nx, ny, 16 + nb * 3, 0, 6.283);
        ctx.moveTo(nx - 24, ny); ctx.lineTo(nx - 12, ny); ctx.moveTo(nx + 12, ny); ctx.lineTo(nx + 24, ny); ctx.stroke();
      }
    }
    if (lz.t < 0.18) {
      const a = 1 - lz.t / 0.18, x0 = lz.x0 - cam.x, y0 = lz.y0 - cam.y, x1 = lz.x1 - cam.x, y1 = lz.y1 - cam.y;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(80,190,255,' + 0.35 * a + ')'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = 'rgba(225,245,255,' + a + ')'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.lineCap = 'butt';
      isin(ctx, x1, y1, 46, '140,215,255', 0.8 * a); isin(ctx, x0, y0, 22, '140,215,255', 0.7 * a);
    }
    if (yet.lazer && !icerde) isin(ctx, K.nx - K.f * 2 - cam.x, K.ny - 10 - cam.y, 5, '120,220,255', lz.sog > 0 ? 0.3 : 0.8);
    if (kiv.length) {
      ctx.strokeStyle = 'rgba(255,214,150,0.9)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const k of kiv) { const x = k.x - cam.x, y = k.y - cam.y; ctx.moveTo(x, y); ctx.lineTo(x - k.vx * 0.03, y - k.vy * 0.03); }
      ctx.stroke();
    }
    ekIsik(solE, sagE);
    ek2Isik(solE, sagE);
    olumIsik();
  }

  function dusmanMaske(solE, sagE) {
    for (const o of B.lambalar) {
      if (o.kapali || o.x < solE - 200 || o.x > sagE + 200) continue;
      isin(mx, o.x - cam.x, o.y - 70 - cam.y, o.r * 1.5, '0,0,0', 0.95); isin(mx, o.x - cam.x, o.y - o.h - cam.y, 110, '0,0,0', 0.7);
    }
    for (const n of B.nisanlar) if (!n.yapildi && n.x > solE && n.x < sagE) isin(mx, n.x - cam.x, n.y - n.h - cam.y, 60, '0,0,0', 0.5);
    for (const p of B.paletliler) if (p.x1 > solE && p.x0 < sagE) isin(mx, (p.x0 + p.x1) / 2 - cam.x, p.ust + 20 - cam.y, 130, '0,0,0', 0.45);
    for (const d of B.dusmanlar) if (d.tip === 'dortayak' && d.x > solE && d.x < sagE) isin(mx, d.x + d.yon * 60 - cam.x, d.y - 40 - cam.y, 120, '0,0,0', 0.4);
    if (lz.t < 0.18) isin(mx, lz.x1 - cam.x, lz.y1 - cam.y, 120, '0,0,0', 0.7);
    ekMaske(solE, sagE);
    ek2Maske(solE, sagE);
  }

  // robotun isiklari siperin arkasindan gorunmesin: siperlerin alani kirpilir
  function siperKirp() {
    const p = new Path2D();
    p.rect(0, 0, W, H);
    for (const s of B.siperler) {
      const sx = s.x - cam.x;
      if (sx < -120 || sx > W + 120) continue;
      p.rect(sx - 50, Z.yukZemin(s.x) - cam.y - 106, 100, 112);
    }
    ctx.save(); ctx.clip(p, 'evenodd');
  }

  // ================= BOLUM 3-5: KANCA, SIRT ITICISI, KALKAN ve yeni tehditler =================
  const kn = { h: null, zipOnce: false, cek: null, cekT: 9 };              // kanca: tutunulan halka, son atis
  let kalkanEn = 1, kalkanK = 0, kalkanVur = 9, simsek = 9, simsekSonra = 5;
  const kalkanAcik = () => yet.kalkan && robot.yerde && robot.egilK > 0.6 && robot.surunK < 0.4 && kalkanEn > 0.25;
  // dokulu uzuv parcasi (bacak / kol): iki nokta arasina dondurulup uzatilarak basilir
  const uzuv = (x0, y0, x1, y1, kal) => {
    const sp = Sanat.s.uzuv, u = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    gx.save(); gx.translate(x0, y0); gx.rotate(Math.atan2(y1 - y0, x1 - x0));
    gx.drawImage(sp, -kal * 0.5, -kal / 2, u + kal, kal);
    gx.restore();
  };
  const hedefNok = (o) => (o.tip === 'ayna' ? { x: o.x, y: o.y } : { x: o.x, y: o.y - o.h });

  function ekSifirla(tam) {
    ek2Sifirla(tam);
    if (robot) robot.dis = null;
    kn.h = null; kn.cekT = 9; kalkanEn = 1; kalkanVur = 9;
    for (const d of B.dusmanlar) d.v = 0;
    for (const s of B.suruler) { s.x = s.yuva; s.durum = 0; s.t = 0; if (tam) s.kapali = s.kapali0; }
    for (const s of B.sallar) { s.kapali = s.kapali0; s.k = s.kapali ? 0 : 1; s.e.y = s.kapali ? s.yAlt : s.yUst; }
    for (const a of B.arilar) { a.x = a.bx; a.y = a.by; a.kizgin = 0; a.olu = false; a.vy = 0; }
    for (const t of B.taretler) { t.kilit = 0; t.sus = 0; t.ates = 9; if (tam) { t.kapali = t.kapali0; t.olu = false; t.yapildi = false; } }
    for (const k of B.kovalar) {
      k.x = k.x0; k.aktif = false; k.yuk = 0;
      if (!tam && kontrolX > k.tetik && kontrolX < k.x1) { k.aktif = true; k.x = Math.max(k.x0, kontrolX - 430); }     // kovalamacanin ortasinda dogdu
    }
    for (const n of B.nabizlar) { n.onceki = undefined; n.vurT = 9; }
    if (tam) for (const liste of [B.buharlar, B.fanlar, B.aynalar]) for (const o of liste) o.kapali = o.kapali0;
  }

  // robottan once: sal su seviyesiyle iner cikar, ustundeki robotu tasir
  function ekOnce(dt) {
    for (const s of B.sallar) {
      const eski = s.e.y;
      s.k = yaklas(s.k, s.kapali ? 0 : 1, dt / 3.2);
      s.e.y = lerp(s.yAlt, s.yUst, smooth(s.k));
      const dy = s.e.y - eski;
      if (dy !== 0 && robot.yerde && robot.x >= s.e.x0 - 1 && robot.x <= s.e.x1 + 1 && Math.abs(robot.y - eski) < 4) robot.tasi(0, dy);
    }
  }

  // kanca: halkaya dokun = cekil ve asil; asiliyken zipla = firla, egil = birak. Kola dokun = uzaktan cek
  function kancaGuncelle(dt) {
    kn.cekT += dt;
    if (robot.dis) {
      if (durum !== 'oyun') { robot.dis = null; kn.h = null; }
      else if (girdi.zipla && !kn.zipOnce && robot.dis.vardi) {
        robot.dis = null; kn.h = null; robot.vy = -430; robot.vx = (girdi.x || robot.yon) * 235; robot.ziplaBasili = true;
      } else if (girdi.egil && robot.dis.vardi) { robot.dis = null; kn.h = null; robot.egilYut = true; }
    } else kn.h = null;
    kn.zipOnce = girdi.zipla;
    if (!yet.kanca || durum !== 'oyun' || !isaret.yeni || isaret.kullanildi || robot.merd || robot.etk || robot.surunK > 0.5) return;
    const wx = isaret.x + cam.x, wy = isaret.y + cam.y, ox = robot.x, oy = robot.y - 130;
    let en = 56 * 56, halka = null, kol = null;
    for (const h of B.halkalar) {
      const d = (h.x - wx) * (h.x - wx) + (h.y - wy) * (h.y - wy);
      if (d < en && h !== kn.h) { en = d; halka = h; }
    }
    for (const n of B.nisanlar) {
      if (n.tip !== 'kol' || n.yapildi) continue;
      const d = (n.x - wx) * (n.x - wx) + (n.y - n.h - wy) * (n.y - n.h - wy);
      if (d < en) { en = d; kol = n; halka = null; }
    }
    if (!halka && !kol) return;
    isaret.kullanildi = true;
    const tx = halka ? halka.x : kol.x, ty = halka ? halka.y : kol.y - kol.h;
    let acik = Math.sqrt((tx - ox) * (tx - ox) + (ty - oy) * (ty - oy)) <= 470;
    for (let i = 1; i < 10 && acik; i++) { const t = i / 10; if (oy + (ty - oy) * t > Z.yuk(ox + (tx - ox) * t) - 2) acik = false; }     // arada zemin var
    kn.cekT = 0; kn.cek = { x: tx, y: ty, red: !acik };
    if (!acik) { ses('red'); return; }
    if (tx !== robot.x) robot.yon = tx > robot.x ? 1 : -1;
    ses('fis');
    if (kol) { nisanVur(kol); return; }
    kn.h = halka;
    robot.dis = { x: halka.x, y: halka.y + 216, vardi: false };
    robot.egilAcik = false;
  }

  // lazerin vurdugu yeni hedefler
  function ekVur(o) {
    if (o.tip === 'ari') { o.olu = true; o.oluT = 0; o.vy = 0; ses('hasar', o.x, 0.6); kivEkle(o.x, o.y, 10); }
    else if (o.tip === 'taret') {
      if (o.zirhli) { ses('red'); kivEkle(o.x, o.y + 14, 4); }
      else { o.sus = 7; o.kilit = 0; ses('vur', o.x); kivEkle(o.x, o.y + 14, 9); }
    } else if (o.tip === 'suru') { o.durum = 2; o.t = 0; ses('vur', o.x); kivEkle(o.x, o.y - 8, 6); }
    else if (o.tip === 'mayin') patlat(o);
    else if (o.tip === 'plaka') { ses('red'); kivEkle(o.x, o.y, 5); }
    else if (o.tip === 'ayna') {
      // isin aynadan hedefine yansir (hedef baska bir ayna da olabilir)
      o.t = 0;
      const n = o.kapali && o.hedef2 ? o.hedef2 : o.hedef;
      o.son = n;
      if (n.tip === 'ayna') { if (n !== o) ekVur(n); } else if (!n.yapildi) nisanVur(n);
    }
  }

  function ekGuncelle(dt) {
    const rx = robot.x, ry = robot.y, oyun = durum === 'oyun';
    let giz = saklaniyor();
    for (const a of B.alcaklar) if (a.h < 100 && rx > a.x0 - 6 && rx < a.x1 + 6 && robot.surunK > 0.6) giz = true;
    robot.jet = yet.jet;
    kalkanEn = Math.min(1, Math.max(0, kalkanEn) + dt * 0.15); kalkanVur += dt;
    kalkanK = damp(kalkanK, kalkanAcik() ? 1 : 0, 14, dt);
    if (B.tema.firtina) { simsek += dt; simsekSonra -= dt; if (simsekSonra <= 0) { simsek = 0; simsekSonra = 4 + Math.random() * 9; } }
    for (const a of B.aynalar) a.t += dt;

    // fare surusu: 0 yuvada, 1 kovaliyor, 2 kaciyor (vuruldu / robot gitti), 3 yuvada bekliyor
    for (const s of B.suruler) {
      s.t += dt;
      let kapali = s.kapali;
      if (s.tikanir) for (const sd of B.sandiklar) if (Math.abs(sd.taban - s.y) < 3 && sd.x0 <= s.yuva + 4 && sd.x1 >= s.yuva - 4) kapali = true;
      s.tikali = kapali;
      const zeminde = oyun && robot.yerde && Math.abs(ry - s.y) < 12 && rx > s.x0 && rx < s.x1;
      const bolgede = oyun && rx > s.x0 - 40 && rx < s.x1 + 40 && ry > s.y - 340 && ry < s.y + 12;
      if (s.durum === 0) { if (!kapali && zeminde && s.t > 0.4) { s.durum = 1; s.t = 0; } }
      else if (s.durum === 1) {
        if (!bolgede) { s.durum = 2; s.t = 0; }
        else if (s.t > 0.7) {
          if (Math.abs(rx - s.x) > 8) s.x = clamp(s.x + sign(rx - s.x) * 255 * dt, s.min, s.max);
          if (zeminde && Math.abs(rx - s.x) < 30) geriAl('hasar', 'fare');
        }
      } else if (s.durum === 2) {
        const dx = s.yuva - s.x;
        if (Math.abs(dx) < 14) { s.x = s.yuva; s.durum = 3; s.t = 0; } else s.x += sign(dx) * 330 * dt;
      } else if (s.t > 2.6) { s.durum = 0; s.t = 0; }
    }

    // buhar: periyodik fiskirir (periyot 0 = hep acik); egilerek gecilmez
    for (const b of B.buharlar) {
      if (b.kapali) { b.acik = false; b.yakinda = false; continue; }
      const f = devir(b);
      b.acik = !b.periyot || f < (b.oran || 0.42); b.yakinda = !!b.periyot && f > 0.82;
      if (b.acik && !b.sesAcik && Math.abs(b.x - rx) < 600) ses('bariyer', b.x, 0.7);
      b.sesAcik = b.acik;
      if (oyun && b.acik && Math.abs(rx - b.x) < 30 && ry > b.y - 250 && ry < b.y + 12) geriAl('hasar', 'buhar');
    }

    // fan: ustundeki robotu h kadar yukari ufler
    for (const f of B.fanlar) {
      f.k = damp(f.k === undefined ? 0 : f.k, f.kapali ? 0 : 1, 3, dt);
      if (f.kapali || !oyun || robot.merd || robot.dis || rx < f.x0 || rx > f.x1 || ry > f.y + 6 || ry < f.y - f.h) continue;
      if (robot.yerde) { if (Math.abs(ry - f.y) < 4) { robot.yerde = false; robot.vy = -250; } }
      else { robot.vy = Math.max(robot.vy - 3400 * dt, -360); robot.sonZeminY = robot.y; }
    }

    // ari: havadaki robotu kovalar; yere inince devriyesine doner. Vurulunca bir sure sonra yenisi gelir
    for (const a of B.arilar) {
      if (a.olu) {
        a.oluT += dt; a.vy += 900 * dt;
        const yer = Z.yukZemin(a.x);
        a.y = yer < CUKUR ? Math.min(a.y + a.vy * dt, yer - 8) : a.y + a.vy * dt;
        if (a.oluT > 9) { a.olu = false; a.x = a.bx; a.y = a.by; a.kizgin = 0; a.vy = 0; }
        continue;
      }
      const havada = oyun && !robot.yerde && !robot.merd && rx > a.x0 - 80 && rx < a.x1 + 80;
      a.kizgin = clamp(a.kizgin + (havada ? dt * 2.2 : -dt * 0.9), 0, 1);
      if (a.kizgin > 0.5) {
        const dx = rx - a.x, dy = ry - 80 - a.y, u = Math.sqrt(dx * dx + dy * dy) || 1;
        const ah = a.hiz || 170;
        a.x += dx / u * ah * dt; a.y += dy / u * ah * dt; a.yon = dx >= 0 ? 1 : -1;
      } else {
        a.x += a.yon * 85 * dt;
        if (a.x < a.x0) a.yon = 1; else if (a.x > a.x1) a.yon = -1;
        a.y = damp(a.y, a.by + Math.sin(zaman * 2 + a.bx) * 10, 2, dt);
      }
      a.x = clamp(a.x, a.x0 - 120, a.x1 + 120);
      if (oyun && Math.abs(rx - a.x) < 30 && a.y > ry - 150 && a.y < ry - 10) geriAl('hasar', 'elektrik');
    }

    // taret: robotu gorunce kilitlenir, 1.25 sn sonra ates eder. Siper gizler; kalkan atesi geri yollar
    for (const t of B.taretler) {
      t.ates += dt;
      if (t.olu || t.kapali) { t.kilit = 0; continue; }
      if (t.sus > 0) { t.sus -= dt; t.kilit = 0; continue; }
      if (yem.t > 0 && yem.x > t.x0 && yem.x < t.x1) { t.ac = damp(t.ac, Math.atan2(yem.y - 90 - t.y - 16, yem.x - t.x), 9, dt); t.kilit = 0.5; continue; }      // yeme kilitlenir
      const gor = oyun && rx > t.x0 && rx < t.x1 && ry > t.y && ry < t.yer + 30 && !giz;
      if (gor) { t.kilit += dt; t.ac = damp(t.ac, Math.atan2(ry - 90 - t.y - 16, rx - t.x), 9, dt); }
      else { t.kilit = Math.max(0, t.kilit - dt * 1.5); t.ac = damp(t.ac, 1.57 + Math.sin(zaman * 0.8 + t.x) * 0.7, 2, dt); }
      if (t.kilit > (t.sure || 1.25)) {
        t.kilit = 0.3; t.ates = 0; t.hx = rx; t.hy = ry - 90; ses('lazer', t.x);
        if (kalkanAcik() && robot.yon === sign(t.x - rx)) {
          t.olu = true; t.yapildi = true; kalkanVur = 0; kalkanEn -= 0.34;
          kivEkle(t.x, t.y + 12, 16); ses('hasar', t.x, 0.7);
        } else geriAl('yakalandi', 'lazer', ry - 96);
      }
    }

    // enerji dalgasi: koridoru bir uctan otekine supurur. Kalkanla karsilanir, hendekte / asiliyken ustten gecer
    for (const d of B.dalgalar) {
      const f = d.kapali ? 1 : devir(d), gez = 0.62, eski = d.x;
      if (f > gez) { d.x = -1e9; d.yakinda = !d.kapali && f > 0.86; continue; }
      d.yakinda = false;
      d.x = d.yon < 0 ? d.x1 - (d.x1 - d.x0) * f / gez : d.x0 + (d.x1 - d.x0) * f / gez;
      if (eski < -1e8) continue;
      const lo = Math.min(eski, d.x), hi = Math.max(eski, d.x);
      for (const q of B.dusmanlar) if (!q.olu && q.tip === 'dortayak' && q.x >= lo && q.x <= hi && Math.abs(q.y - d.y) < 10) oldur(q);
      if (oyun && rx >= lo && rx <= hi && ry <= d.y + 10 && ry > d.y - 140) {
        if (kalkanAcik() && robot.yon === -d.yon) { kalkanVur = 0; kalkanEn -= d.guc; ses('vur', rx); kivEkle(rx + robot.yon * 40, ry - 60, 8); }
        else geriAl('hasar', 'elektrik');
      }
    }

    // cekirdegin nabzi: attiginda bolgedeki robot kalkanin ardinda ya da siperde olmali
    for (const n of B.nabizlar) {
      const f = devir(n);
      n.vurT = (n.vurT === undefined ? 9 : n.vurT) + dt;
      if (n.onceki !== undefined && f < n.onceki) {
        n.vurT = 0;
        if (oyun && rx > n.x0 && rx < n.x1) {
          sars = Math.max(sars, 3); ses('pres', rx, 0.5);
          if (kalkanAcik()) { kalkanVur = 0; kalkanEn -= 0.5; }
          else if (!giz) geriAl('hasar', 'elektrik');
        }
      }
      n.onceki = f;
    }

    // sel: tetik gecilince arkadan gelir; x1'e varinca durur
    for (const k of B.kovalar) {
      if (!k.aktif) { if (oyun && rx > k.tetik && rx < k.x1) { k.aktif = true; k.x = k.x0; sars = Math.max(sars, 4); ses('pres', rx, 0.8); } continue; }
      if (!oyun) continue;
      if (k.x >= k.x1) {      // duvara dayandi: su yukselir; merdivenle ya da kancayla son anda cikilir
        k.yuk = Math.min(k.tavan || 0, (k.yuk || 0) + 62 * dt);
        if (k.yuk > 30 && rx < k.x1 + 400 && ry > k.y - k.yuk + 24 && ry < k.y + 40) geriAl('hasar', 'sel');
        continue;
      }
      k.x = Math.min(k.x1, k.x + k.hiz * dt); sars = Math.max(sars, 0.8);
      if (rx < k.x + 30) geriAl('hasar', 'sel');
    }
  }

  // tavandan (ic mekan / bosluk ustu) ya da direkten (cati) aski
  function aski(x, y, yer) {
    gx.strokeStyle = '#0b0e10'; gx.lineWidth = 3;
    gx.beginPath(); gx.moveTo(x, y);
    gx.lineTo(x, B.tema.ic || Z._taban(x) >= CUKUR ? y - 700 : yer);
    gx.stroke();
  }

  // dunya koordinati, robotun arkasi
  function ekCiz(sol, sag) {
    const s = Sanat.s;
    // samandiralarin pistonu (suyun arkasinda)
    for (const q of B.sallar) {
      if (q.x1 < sol || q.x0 > sag) continue;
      const ox = (q.x0 + q.x1) / 2;
      gx.fillStyle = '#12171a'; gx.fillRect(ox - 11, q.e.y + 14, 22, 900);
      gx.fillStyle = 'rgba(96,54,30,0.35)'; gx.fillRect(ox - 6, q.e.y + 14, 4, 900);
    }
    // kanallardaki bosluklar suyla dolu
    if (B.tema.su) {
      for (const c of Z.cukurlar) {
        if (c.x1 < sol || c.x0 > sag) continue;
        let sy = c.y + 34;
        for (const q of B.sallar) if (q.x0 === c.x0) sy = Math.max(sy, q.e.y + 12);      // su bosalinca alcalir; samandira suyun ustune pistonla cikar
        const g = gx.createLinearGradient(0, sy, 0, sy + 260);
        g.addColorStop(0, 'rgba(38,74,58,0.92)'); g.addColorStop(1, 'rgba(6,14,12,0.98)');
        gx.fillStyle = g; gx.fillRect(c.x0, sy, c.x1 - c.x0, 900);
        gx.strokeStyle = 'rgba(150,200,170,0.22)'; gx.lineWidth = 1.2;
        gx.beginPath();
        for (let x = c.x0 + 10; x < c.x1 - 30; x += 46) { const o = Math.sin(zaman * 1.6 + x * 0.05) * 6; gx.moveTo(x + o, sy + 1.5); gx.lineTo(x + o + 22, sy + 1.5); }
        gx.stroke();
      }
    }
    for (const q of B.sallar) if (q.x1 > sol && q.x0 < sag) serit(s.tabla150, q.x0 + 5, q.e.y, q.x1 - q.x0 - 10);
    // sel: koyu su duvari
    for (const k of B.kovalar) {
      if (!k.aktif || k.x < sol - 100) continue;
      const g = gx.createLinearGradient(k.x - 300, 0, k.x + 40, 0);
      g.addColorStop(0, k.cokus ? 'rgba(6,3,3,0.99)' : 'rgba(10,26,21,0.98)'); g.addColorStop(1, k.cokus ? 'rgba(90,24,16,0.95)' : 'rgba(40,82,62,0.92)');
      gx.fillStyle = g;
      gx.beginPath(); gx.moveTo(k.x - 2600, k.y + 900); gx.lineTo(k.x - 2600, k.y - 560);
      for (let yy = -560; yy <= 0; yy += 40) gx.lineTo(k.x + Math.sin(zaman * 7 + yy * 0.05) * 16 + (yy + 560) * 0.08, k.y + yy);
      gx.lineTo(k.x + 60, k.y - 46); gx.lineTo(k.x + 260, k.y - 16); gx.lineTo(k.x + 460, k.y);      // onden yayilan, yerden kabaran su
      gx.lineTo(k.x + 460, k.y + 900); gx.closePath(); gx.fill();
      if (k.yuk) gx.fillRect(k.x - 20, k.y - k.yuk + Math.sin(zaman * 4) * 3, 190, k.yuk + 10);
    }
    for (const h of B.halkalar) {
      if (h.x < sol || h.x > sag) continue;
      aski(h.x, h.y - 26, Z.yukZemin(h.x));
      bas(gx, s.halka, h.x - s.halka.kokX, h.y - s.halka.kokY);
    }
    for (const n of B.nisanlar) {
      if (n.tip !== 'kol' || n.x < sol || n.x > sag) continue;
      const ny = n.y - n.h, asagi = n.cevir ? !!n.konum : n.yapildi;
      aski(n.x, ny - 22, n.y);
      bas(gx, s.kol, n.x - s.kol.kokX, ny - s.kol.kokY);
      gx.strokeStyle = '#8c979e'; gx.lineWidth = 3.4; gx.lineCap = 'round';
      gx.beginPath(); gx.moveTo(n.x, ny); gx.lineTo(n.x - 12, ny + (asagi ? 13 : -13)); gx.stroke(); gx.lineCap = 'butt';
    }
    for (const n of B.nisanlar) if (n.ayna && n.x > sol && n.x < sag) bas(gx, s.kafes, n.x - 38, n.y - n.h - 12);
    for (const b of B.buharlar) {
      if (b.x < sol || b.x > sag) continue;
      gx.fillStyle = '#161b1e';
      if (Z._taban(b.x) >= CUKUR) gx.fillRect(b.x - 5, b.y - 4, 10, 900);
      gx.fillRect(b.x - 13, b.y - 12, 26, 14);
      gx.fillStyle = '#07090a'; gx.fillRect(b.x - 7, b.y - 15, 14, 4);
    }
    for (const f of B.fanlar) if (f.x1 > sol && f.x0 < sag) gx.drawImage(s.fan, f.x0, f.y - 10, f.x1 - f.x0, s.fan.lh);
    for (const a of B.aynalar) {
      if (a.x < sol || a.x > sag) continue;
      aski(a.x, a.y, Z.yukZemin(a.x));
      const p = hedefNok(a.kapali && a.hedef2 ? a.hedef2 : a.hedef);
      a.acK = damp(a.acK === undefined ? 0 : a.acK, Math.atan2(p.y - a.y, p.x - a.x) * 0.5, 8, 0.016);
      gx.save(); gx.translate(a.x, a.y); gx.rotate(a.acK); bas(gx, s.ayna, -s.ayna.kokX, -s.ayna.kokY); gx.restore();
    }
    for (const t of B.taretler) {
      if (t.x < sol || t.x > sag) continue;
      aski(t.x, t.y, t.yer);
      const ac = t.olu || t.kapali ? 1.95 : t.ac;
      uzuv(t.x, t.y + 16, t.x + Math.cos(ac) * 30, t.y + 16 + Math.sin(ac) * 30, 9);
      bas(gx, s.taret, t.x - s.taret.kokX, t.y);
    }
    for (const a of B.arilar) {
      if (a.x < sol || a.x > sag) continue;
      gx.save(); gx.translate(a.x, a.y);
      gx.rotate(a.olu ? Math.min(a.oluT * 3, 2.4) : Math.sin(zaman * 3 + a.bx) * 0.08 + (a.kizgin > 0.5 ? a.yon * 0.2 : 0));
      bas(gx, s.ari, -s.ari.kokX, -s.ari.kokY);
      if (!a.olu) { gx.fillStyle = 'rgba(160,180,190,' + (0.16 + 0.1 * Math.sin(zaman * 70)) + ')'; gx.beginPath(); gx.ellipse(0, -11, 24, 2.2, 0, 0, 6.283); gx.fill(); }
      gx.restore();
    }
    // fare yuvasi (boru agzi) ve suru
    for (const q of B.suruler) {
      if (q.yuva > sol - 100 && q.yuva < sag + 100) {
        bas(gx, s.boruAgiz, q.yuva - 30, q.y - 62);
        if (q.kapali) { gx.fillStyle = '#12161a'; for (let i = -18; i <= 18; i += 9) gx.fillRect(q.yuva + i - 1.5, q.y - 58, 3, 52); }
      }
      if (q.durum === 0 || q.durum === 3 || q.x < sol - 200 || q.x > sag + 200) continue;
      const yn = (q.durum === 2 ? sign(q.yuva - q.x) : sign(robot.x - q.x)) || 1, yay = q.durum === 1 && q.t < 0.7 ? q.t / 0.7 : 1;
      for (let i = 0; i < 14; i++) {
        const ox = (((i * 37) % 120) - 60 + Math.sin(zaman * 9 + i * 2.1) * 7) * yay, oy = Math.abs(Math.sin(zaman * 14 + i)) * 3;
        gx.save(); gx.translate(q.x + ox, q.y - oy);
        if (yn < 0) gx.scale(-1, 1);
        bas(gx, s.fare, -15, -13); gx.restore();
      }
    }
  }

  // robotun sirtindaki itici
  function ekRobot(olur) {
    if (!yet.jet || olur) return;
    const K = robot.iskelet, sp = Sanat.s.jet;
    gx.save();
    gx.translate(K.hx + K.sx * 30 + K.sy * K.f * 18, K.hy + K.sy * 30 - K.sx * K.f * 18);
    gx.rotate(Math.atan2(K.sy, K.sx) + 1.5708);
    bas(gx, sp, -sp.kokX, -sp.kokY);
    gx.restore();
  }

  // ekran koordinati, parlak katman
  function ekIsik(solE, sagE) {
    const K = robot.iskelet, cx = cam.x, cy = cam.y;
    // kanca halati
    if (robot.dis && kn.h) {
      ctx.strokeStyle = 'rgba(255,205,140,0.85)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(K.kol[0].hx - cx, K.kol[0].hy - cy); ctx.lineTo(kn.h.x - cx, kn.h.y - cy); ctx.stroke();
      isin(ctx, kn.h.x - cx, kn.h.y - cy, 16, '255,200,130', 0.7);
    } else if (kn.cekT < 0.28 && kn.cek) {
      const a = 1 - kn.cekT / 0.28;
      ctx.strokeStyle = 'rgba(' + (kn.cek.red ? '255,80,60,' : '255,205,140,') + a + ')'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(K.nx - cx, K.ny - cy); ctx.lineTo(kn.cek.x - cx, kn.cek.y - cy); ctx.stroke();
    }
    if (yet.kanca) {
      // tutunulabilir halkalar ve cekilebilir kollar
      const nb = 0.5 + 0.5 * Math.sin(zaman * 4);
      ctx.strokeStyle = 'rgba(255,200,130,' + (0.3 + 0.3 * nb) + ')'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (const h of B.halkalar) if (h.x > solE && h.x < sagE && h !== kn.h) { const x = h.x - cx, y = h.y - cy, r = 19 + nb * 3; ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); }
      for (const n of B.nisanlar) if (n.tip === 'kol' && !n.yapildi && n.x > solE && n.x < sagE) { const x = n.x - cx, y = n.y - n.h - cy, r = 22 + nb * 3; ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); }
      ctx.stroke();
    }
    for (const n of B.nisanlar) if (n.tip === 'kol' && n.x > solE && n.x < sagE) isin(ctx, n.x - cx, n.y - n.h - cy, 9, n.yapildi ? '120,255,170' : '255,200,130', 0.6);
    // buhar
    for (const b of B.buharlar) {
      if (b.x < solE || b.x > sagE || (!b.acik && !b.yakinda)) continue;
      const x = b.x - cx, y = b.y - cy;
      if (b.acik) for (let i = 0; i < 7; i++) { const k = ((zaman * 2.4 + i / 7) % 1); isin(ctx, x + Math.sin(i * 2.3 + zaman * 5) * (6 + k * 16), y - 18 - k * 232, 20 + k * 30, '205,220,225', 0.42 * (1 - k * 0.7)); }
      else isin(ctx, x, y - 22, 14, '205,220,225', 0.2 + 0.25 * Math.random());
    }
    // fan akimi
    ctx.lineWidth = 1.2;
    for (const f of B.fanlar) {
      if (f.x1 < solE || f.x0 > sagE || (f.k || 0) < 0.05) continue;
      ctx.strokeStyle = 'rgba(190,215,225,' + 0.2 * f.k + ')';
      ctx.beginPath();
      for (let i = 0; i < 9; i++) { const k = ((zaman * 1.5 + i * 0.37) % 1), x = f.x0 + 14 + ((i * 53) % (f.x1 - f.x0 - 28)) - cx, y = f.y - k * f.h - cy; ctx.moveTo(x, y); ctx.lineTo(x, y - 34); }
      ctx.stroke();
      isin(ctx, (f.x0 + f.x1) / 2 - cx, f.y - 6 - cy, 60, '190,215,225', 0.12 * f.k);
    }
    // ayna: parilti ve yansiyan isin
    for (const a of B.aynalar) {
      if (a.x < solE - 700 || a.x > sagE + 700) continue;
      isin(ctx, a.x - cx, a.y - cy, 9, '170,225,245', 0.5 + 0.2 * Math.sin(zaman * 3 + a.x));
      if (a.t < 0.2 && a.son) {
        const p = hedefNok(a.son), al = 1 - a.t / 0.2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(80,190,255,' + 0.35 * al + ')'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(a.x - cx, a.y - cy); ctx.lineTo(p.x - cx, p.y - cy); ctx.stroke();
        ctx.strokeStyle = 'rgba(225,245,255,' + al + ')'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(a.x - cx, a.y - cy); ctx.lineTo(p.x - cx, p.y - cy); ctx.stroke();
        ctx.lineCap = 'butt';
      }
    }
    // taret: goz, nisan cizgisi, atis
    for (const t of B.taretler) {
      if (t.x < solE - 200 || t.x > sagE + 200) continue;
      const x = t.x - cx, y = t.y + 16 - cy;
      if (t.ates < 0.16) {
        const al = 1 - t.ates / 0.16;
        ctx.strokeStyle = 'rgba(255,120,80,' + al + ')'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(t.hx - cx, t.hy - cy); ctx.stroke();
        isin(ctx, t.hx - cx, t.hy - cy, 60, '255,120,80', 0.8 * al);
      }
      if (t.olu || t.kapali) continue;
      if (t.sus > 0) { if (Math.random() < 0.3) isin(ctx, x, y, 12, '170,210,255', 0.7); continue; }
      const k = clamp(t.kilit / 1.25, 0, 1);
      isin(ctx, x, y, 7 + k * 6, t.zirhli ? '255,60,50' : '255,150,60', 0.6 + 0.4 * k);
      if (k > 0.02) {
        ctx.strokeStyle = 'rgba(255,60,50,' + (0.2 + 0.7 * k) + ')'; ctx.lineWidth = 1 + k * 1.4;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(t.ac) * 900, y + Math.sin(t.ac) * 900); ctx.stroke();
      }
    }
    for (const a of B.arilar) {
      if (a.olu || a.x < solE || a.x > sagE) continue;
      isin(ctx, a.x - cx, a.y + 4 - cy, a.kizgin > 0.5 ? 12 : 7, a.kizgin > 0.5 ? '255,60,50' : '255,190,110', 0.9);
    }
    // fare gozleri
    for (const q of B.suruler) if ((q.durum === 1 || q.durum === 2) && q.x > solE && q.x < sagE) isin(ctx, q.x - cx, q.y - 8 - cy, 46, '255,70,40', 0.16 + 0.08 * Math.sin(zaman * 20));
    // enerji dalgasi
    for (const d of B.dalgalar) {
      if (d.yakinda) { const ux = (d.yon < 0 ? d.x1 : d.x0) - cx; if (ux > -100 && ux < W + 100) isin(ctx, ux, d.y - 70 - cy, 70, '120,235,215', 0.3 + 0.3 * Math.random()); }
      const x = d.x - cx;
      if (x < -80 || x > W + 80) continue;
      const g = ctx.createLinearGradient(x - d.yon * 70, 0, x, 0);
      g.addColorStop(0, 'rgba(120,235,215,0)'); g.addColorStop(1, 'rgba(160,245,230,0.55)');
      ctx.fillStyle = g; ctx.fillRect(Math.min(x, x - d.yon * 70), d.y - 140 - cy, 70, 140);
      ctx.fillStyle = 'rgba(235,255,250,0.95)'; ctx.fillRect(x - 2, d.y - 140 - cy, 4, 140);
      isin(ctx, x, d.y - 70 - cy, 90, '120,235,215', 0.4);
    }
    // sel kopugu
    for (const k of B.kovalar) if (k.aktif && k.x > solE - 100 && k.x < sagE + 100) for (let i = 0; i < 6; i++) isin(ctx, k.x + 20 - cx + Math.sin(zaman * 6 + i) * 14, k.y - 30 - i * 80 - cy, 44, k.cokus ? '255,120,60' : '170,215,190', k.cokus ? 0.5 : 0.22);
    // kalkan
    if (kalkanK > 0.03) {
      const x = robot.x - cx, y = robot.y - 58 - cy, a0 = robot.yon > 0 ? -1.15 : Math.PI - 1.15, vur = kalkanVur < 0.3;
      const guc = (vur ? 1 : 0.5 + 0.12 * Math.sin(zaman * 7)) * kalkanK * (0.35 + 0.65 * kalkanEn);
      for (let i = 0; i <= 8; i++) {      // keskin cizgi yok: yay boyunca ust uste binen yumusak isik
        const a = a0 + 2.3 * i / 8, kn2 = 1 - Math.abs(i - 4) / 6;
        isin(ctx, x + Math.cos(a) * 78, y + Math.sin(a) * 78, vur ? 46 : 32, '120,235,215', guc * 0.42 * kn2);
        isin(ctx, x + Math.cos(a) * 78, y + Math.sin(a) * 78, 9, '225,255,248', guc * 0.5 * kn2);
      }
      isin(ctx, x + robot.yon * 52, y, 96, '120,235,215', 0.16 * kalkanK + (vur ? 0.45 : 0));
    }
    // itici: alev ve yakit
    if (yet.jet && !icerde) {
      const bx = K.hx + K.sx * 6 + K.sy * K.f * 18 - cx, by = K.hy + K.sy * 6 - K.sx * K.f * 18 - cy;
      if (robot.jetAcik) { isin(ctx, bx, by + 8, 20 + Math.random() * 12, '255,170,80', 0.9); isin(ctx, bx, by + 26, 34, '255,120,50', 0.4); }
      if (robot.jetYakit < 0.84) {
        ctx.fillStyle = 'rgba(255,190,110,0.7)'; ctx.fillRect(robot.x - cx - 18, robot.y - 196 - cy, 36 * clamp(robot.jetYakit / 0.85, 0, 1), 2.5);
      }
    }
    // cekirdegin nabzi: yaklasirken kizarir, atinca parlar
    for (const n of B.nabizlar) {
      if (robot.x < n.x0 - 400 || robot.x > n.x1 + 400) continue;
      const f = devir(n), ic = robot.x > n.x0 && robot.x < n.x1 ? 1 : 0.35;
      if (f > 0.68) { ctx.fillStyle = 'rgba(255,50,30,' + (f - 0.68) / 0.32 * 0.16 * ic + ')'; ctx.fillRect(0, 0, W, H); }
      if (n.vurT < 0.35) { ctx.fillStyle = 'rgba(255,170,130,' + (1 - n.vurT / 0.35) * 0.5 * ic + ')'; ctx.fillRect(0, 0, W, H); }
    }
    // simsek
    if (B.tema.firtina && simsek < 0.45) {
      const a = simsek < 0.07 ? 0.3 : (simsek < 0.15 ? 0.06 : 0.22 * (1 - (simsek - 0.15) / 0.3));
      ctx.fillStyle = 'rgba(185,210,255,' + a + ')'; ctx.fillRect(0, 0, W, H);
    }
  }

  function ekMaske(solE, sagE) {
    const cx = cam.x, cy = cam.y, K = robot.iskelet;
    for (const h of B.halkalar) if (h.x > solE && h.x < sagE) isin(mx, h.x - cx, h.y - cy, 55, '0,0,0', 0.5);
    for (const b of B.buharlar) if (b.acik && b.x > solE && b.x < sagE) isin(mx, b.x - cx, b.y - 120 - cy, 150, '0,0,0', 0.5);
    for (const f of B.fanlar) if (f.x1 > solE && f.x0 < sagE) isin(mx, (f.x0 + f.x1) / 2 - cx, f.y - 40 - cy, 130, '0,0,0', 0.4);
    for (const a of B.aynalar) if (a.x > solE && a.x < sagE) isin(mx, a.x - cx, a.y - cy, 70, '0,0,0', 0.55);
    for (const t of B.taretler) if (t.x > solE && t.x < sagE) isin(mx, t.x - cx, t.y + 16 - cy, 90, '0,0,0', 0.5);
    for (const a of B.arilar) if (a.x > solE && a.x < sagE) isin(mx, a.x - cx, a.y - cy, 80, '0,0,0', 0.5);
    for (const q of B.sallar) if (q.x1 > solE && q.x0 < sagE) isin(mx, (q.x0 + q.x1) / 2 - cx, q.e.y - 10 - cy, 170, '0,0,0', 0.4);
    for (const q of B.suruler) {
      if (q.yuva > solE && q.yuva < sagE) isin(mx, q.yuva - cx, q.y - 32 - cy, 70, '0,0,0', 0.45);
      if ((q.durum === 1 || q.durum === 2) && q.x > solE && q.x < sagE) isin(mx, q.x - cx, q.y - 10 - cy, 110, '0,0,0', 0.5);
    }
    for (const d of B.dalgalar) if (d.x > solE && d.x < sagE) isin(mx, d.x - cx, d.y - 70 - cy, 190, '0,0,0', 0.8);
    for (const k of B.kovalar) if (k.aktif && k.x > solE - 200 && k.x < sagE + 200) isin(mx, k.x - cx, k.y - 160 - cy, 300, '0,0,0', 0.6);
    for (const n of B.nabizlar) if (n.vurT < 0.35 && robot.x > n.x0 - 400 && robot.x < n.x1 + 400) { mx.fillStyle = 'rgba(0,0,0,' + (1 - n.vurT / 0.35) * 0.7 + ')'; mx.fillRect(0, 0, W, H); }
    if (kalkanK > 0.03) isin(mx, robot.x + robot.yon * 40 - cx, robot.y - 58 - cy, 130, '0,0,0', 0.5 * kalkanK);
    if (robot.jetAcik) isin(mx, K.hx - cx, K.hy + 20 - cy, 120, '0,0,0', 0.6);
    if (B.tema.firtina && simsek < 0.3) { mx.fillStyle = 'rgba(0,0,0,' + (simsek < 0.07 ? 0.6 : 0.4 * (1 - simsek / 0.3)) + ')'; mx.fillRect(0, 0, W, H); }
  }

  // ================= BOLUM 6-10: MIKNATIS, YEM, KUS, AGIR CEKIM, ASIRI YUK =================
  let sarjT = 0, agirT = 0, agirSog = 0, zk = 1, uzakEtk = null, ek2Once = false;
  const yem = { x: 0, y: 0, t: 0, sog: 0 };                                     // hologram yem
  const kus = { x: 0, y: 0, hedef: null, plaka: null, vardi: false, aktif: false };     // yardimci dron
  const mk = { x: 0, y: 0, t: 9 };                                              // son miknatis cekisi (isik icin)

  function ek2Sifirla(tam) {
    sarjT = 0; agirT = 0; yem.t = 0; uzakEtk = null; kus.hedef = null; kus.plaka = null; kus.vardi = false; kus.aktif = false;
    if (tam) { agirSog = 0; yem.sog = 0; }
    for (const m of B.mayinlar) { m.x = m.bx; m.y = m.by; m.olu = false; m.oluT = 9; }
    for (const b of B.bekciler) { b.x = b.ev; b.durum = 0; b.t = 0; }
    for (const m of B.mplatlar) { m.hx = m.bas; m.e.x0 = m.bas; m.e.x1 = m.bas + m.w; }
    for (const s of B.sandiklar) s.cek = 0;
    if (tam) for (const t of B.testereler) { t.kapali = t.kapali0; t.kalici = false; }
  }

  function patlat(m) {
    if (m.olu) return;
    m.olu = true; m.oluT = 0;
    ses('pres', m.x, 0.8); sars = Math.max(sars, 4); kivEkle(m.x, m.y, 18);
    for (const o of B.mayinlar) if (!o.olu && Math.abs(o.x - m.x) < 135 && Math.abs(o.y - m.y) < 135) patlat(o);
    for (const d of B.dusmanlar) if (!d.olu && d.tip === 'dortayak' && Math.abs(d.x - m.x) < 130 && Math.abs(d.y - 30 - m.y) < 130) oldur(d);
    if (durum === 'oyun' && Math.abs(robot.x - m.x) < 105 && Math.abs(robot.y - 80 - m.y) < 120) geriAl('hasar', 'elektrik');
  }

  // robottan once (dunya zamani): cekilen sandiklar, miknatisli platformlar, plakadaki kus / bekci
  function ek2Once2(dt) {
    for (const s of B.sandiklar) {
      if (!s.cek) continue;
      const mer = (s.x0 + s.x1) / 2, ayni = Math.abs(robot.y - s.taban) < 3;
      const hed = ayni ? robot.x + (mer > robot.x ? 78 : -78) : robot.x;
      const nx0 = clamp(s.x0 + clamp(hed - mer, -190 * dt, 190 * dt), Math.min(s.min, s.x0), Math.max(s.max - s.w, s.x0));
      if (Math.abs(nx0 - s.x0) < 0.01) { s.cek = 0; continue; }
      if (robot.yerde && Math.abs(robot.y - s.ust) < 3 && robot.x >= s.x0 - 2 && robot.x <= s.x1 + 2) robot.tasi(nx0 - s.x0, 0);
      s.x0 = nx0; s.x1 = nx0 + s.w;
      for (const m of B.mayinlar) if (!m.olu && m.x > s.x0 - 22 && m.x < s.x1 + 22 && m.y > s.ust - 34) patlat(m);
    }
    for (const m of B.mplatlar) {
      const eski = m.e.x0;
      m.hx = clamp(m.hx, m.c0, m.c1 - m.w);
      m.e.x0 = yaklas(m.e.x0, m.hx, 165 * dt); m.e.x1 = m.e.x0 + m.w;
      const dx = m.e.x0 - eski;
      if (dx !== 0 && robot.yerde && Math.abs(robot.y - m.y) < 3 && robot.x >= eski - 2 && robot.x <= eski + m.w + 2) robot.tasi(dx, 0);
    }
    for (const p of B.plakalar) {
      let b = kus.plaka === p && kus.vardi;
      for (const q of B.bekciler) if (Math.abs(q.x - (p.x0 + 45)) < 52 && Math.abs(q.y - p.y) < 4) b = true;
      if (b) { p.basili = true; p.k = 1; for (const h of p.hedef) h.kapali = true; }
    }
  }

  function ek2Guncelle(dt, dtW) {
    const rx = robot.x, ry = robot.y, oyun = durum === 'oyun', K = robot.iskelet;
    let giz = saklaniyor();
    const etkBas = girdi.etk && !ek2Once; ek2Once = girdi.etk;
    yem.t -= dt; yem.sog -= dt; agirT -= dt; agirSog -= dt; sarjT -= dt; mk.t += dt;
    // yem: egilip etkilesim. Agir cekim: ayakta etkilesim (yakinda etkilesim noktasi yokken)
    if (oyun && etkBas && !etkYakin && !robot.etk && robot.yerde) {
      if (yet.yem && robot.egilK > 0.6 && yem.sog <= 0) { yem.x = rx; yem.y = ry; yem.t = 6; yem.sog = 9; ses('guc'); }
      else if (yet.agir && robot.egilK < 0.4 && agirSog <= 0) { agirT = 3.2; agirSog = 8; ses('guc'); }
    }
    // asiri yuk
    for (const e of B.etkiler) if (e.verir === 'sarj' && e.yapildi) { sarjT = 8; e.yapildi = false; }
    for (const k of B.kopruler) if (k.sarj) k.kapali = sarjT <= 0;
    for (const n of B.nabizlar) if (n.yukSiler && n.vurT === 0 && rx > n.x0 && rx < n.x1) sarjT = 0;

    // dokunma: kus (uzak dugme / plaka), miknatis (sandik / platform / capa)
    if (oyun && isaret.yeni && !isaret.kullanildi && !robot.etk) {
      const wx = isaret.x + cam.x, wy = isaret.y + cam.y;
      if (yet.kus) {
        let hed = null, pl = null;
        for (const e of B.etkiler) if (e.uzak && !e.yapildi && gorunur(e) && Math.abs(wx - e.x) < 52 && Math.abs(wy - (e.y - e.h)) < 62 && Math.abs(e.x - rx) < 820) hed = e;
        if (!hed) for (const p of B.plakalar) if (Math.abs(wx - (p.x0 + 45)) < 62 && wy > p.y - 80 && wy < p.y + 34 && Math.abs(p.x0 + 45 - rx) < 820) pl = p;
        if (hed || pl) {
          isaret.kullanildi = true;
          if (!kus.aktif) { kus.x = K.nx; kus.y = K.ny - 30; kus.aktif = true; }
          kus.hedef = hed; kus.plaka = pl; kus.vardi = false; ses('fis');
        }
      }
      if (yet.miknatis && !isaret.kullanildi) {
        for (const s of B.sandiklar) if (wx > s.x0 - 14 && wx < s.x1 + 14 && wy > s.ust - 14 && wy < s.taban + 14 && Math.abs((s.x0 + s.x1) / 2 - rx) < 790) { s.cek = 1; isaret.kullanildi = true; mk.x = (s.x0 + s.x1) / 2; mk.y = s.ust + 30; mk.t = 0; }
        for (const m of B.mplatlar) if (!isaret.kullanildi && wx > m.e.x0 - 12 && wx < m.e.x1 + 12 && Math.abs(wy - m.y) < 48 && Math.abs((m.e.x0 + m.e.x1) / 2 - rx) < 900) {
          m.hx = rx < (m.c0 + m.c1) / 2 ? m.c0 : m.c1 - m.w; isaret.kullanildi = true; mk.x = (m.e.x0 + m.e.x1) / 2; mk.y = m.y; mk.t = 0;
        }
        for (const c of B.capalar) if (!isaret.kullanildi && Math.abs(wx - c.x) < 52 && Math.abs(wy - c.y) < 52 && Math.abs(c.x - rx) < 1100) {
          let en = 1100, sec = null;
          for (const m of B.mplatlar) { const d = Math.abs((m.c0 + m.c1) / 2 - c.x); if (d < en) { en = d; sec = m; } }
          if (sec) { sec.hx = c.x < (sec.c0 + sec.c1) / 2 ? sec.c0 : sec.c1 - sec.w; isaret.kullanildi = true; mk.x = c.x; mk.y = c.y; mk.t = 0; }
        }
        if (isaret.kullanildi) ses('fis');
      }
    }

    // kus: hedefe ucar; dugmeye basar ya da plakaya konar; isi yoksa omuzda bekler
    if (kus.aktif) {
      if (kus.plaka && Math.abs(kus.plaka.x0 - rx) > 1300) { kus.plaka = null; kus.vardi = false; }
      let tx = K.nx - K.f * 22, ty = K.ny - 46 + Math.sin(zaman * 3) * 4;
      if (kus.hedef) { tx = kus.hedef.x; ty = kus.hedef.y - kus.hedef.h; }
      else if (kus.plaka) { tx = kus.plaka.x0 + 45; ty = kus.plaka.y - 12; }
      const dx = tx - kus.x, dy = ty - kus.y, u = Math.sqrt(dx * dx + dy * dy), ad = 360 * dt;
      if (u <= ad || (!kus.hedef && !kus.plaka && u < 60)) {
        if (kus.hedef || kus.plaka) { kus.x = tx; kus.y = ty; } else { kus.x = damp(kus.x, tx, 8, dt); kus.y = damp(kus.y, ty, 8, dt); }
        if (kus.hedef) { uzakEtk = kus.hedef; kus.hedef = null; }
        else if (kus.plaka) kus.vardi = true;
      } else { kus.x += dx / u * ad; kus.y += dy / u * ad; }
    }

    // mayin: yakindaki robota dogru suzulur, degince patlar
    for (const m of B.mayinlar) {
      if (m.olu) { m.oluT += dt; continue; }
      const dx = rx - m.x, dy = ry - 80 - m.y, u = Math.sqrt(dx * dx + dy * dy) || 1;
      if (oyun && u < 380) { m.x += dx / u * 70 * dtW; m.y += dy / u * 70 * dtW; }
      if (oyun && u < 42) patlat(m);
    }

    // bekci: yerinde gecidi kapatir; yeme gider, 6 sn bekler, doner. Siperde egilen robotu gormez
    for (const b of B.bekciler) {
      const cag = yem.t > 0 && Math.abs(yem.y - b.y) < 20 && Math.abs(yem.x - b.ev) < 1500;
      if (cag) { b.hx = yem.x; b.durum = 1; b.t = 0; }
      if (b.durum === 1) {
        if (Math.abs(b.hx - b.x) > 6) { b.x += sign(b.hx - b.x) * 170 * dtW; b.adim += 170 * dtW; } else { b.t += dtW; if (b.t > 6 && !cag) b.durum = 2; }
      } else if (b.durum === 2) {
        if (Math.abs(b.ev - b.x) > 4) { b.x += sign(b.ev - b.x) * 170 * dtW; b.adim += 170 * dtW; } else { b.x = b.ev; b.durum = 0; }
      }
      if (b.durum === 0) {
        robot.duvarlar.push(b.x - 46, b.x + 46);
        if (oyun && Math.abs(rx - b.x) < 62 && ry < b.y - 20 && ry > b.y - 300) geriAl('hasar', 'ezik');       // ustunden gecmeye calisani yakalar
      } else if (oyun && !giz && Math.abs(rx - b.x) < 52 && Math.abs(ry - b.y) < 70) geriAl('hasar', 'ezik');
    }

    // testere: rayda gidip gelir; ustunden atlanir
    for (const t of B.testereler) {
      if (!t.kapali) t.x = (t.x0 + t.x1) / 2 - Math.cos(zaman * 6.2832 / t.periyot + t.faz) * (t.x1 - t.x0) / 2;
      if (oyun && Math.abs(rx - t.x) < 30 && ry > t.y - 56 && ry < t.y + 10) geriAl('hasar', 'lazer', t.y - 30);
    }
  }

  function ek2Ciz(sol, sag) {
    const s = Sanat.s;
    for (const m of B.mplatlar) {
      if (m.c1 < sol || m.c0 > sag) continue;
      gx.fillStyle = '#12171a'; gx.fillRect(m.c0, m.y + 16, m.c1 - m.c0, 5);
      gx.fillStyle = 'rgba(96,54,30,0.4)'; gx.fillRect(m.c0, m.y + 16, m.c1 - m.c0, 1.5);
      serit(s.tabla150, m.e.x0, m.y, m.w);
    }
    for (const c of B.capalar) { if (c.x < sol || c.x > sag) continue; aski(c.x, c.y - 26, Z.yukZemin(c.x)); bas(gx, s.halka, c.x - s.halka.kokX, c.y - s.halka.kokY); }
    for (const t of B.testereler) {
      if (t.x1 < sol || t.x0 > sag) continue;
      gx.fillStyle = '#0d1012'; gx.fillRect(t.x0 - 20, t.y - 4, t.x1 - t.x0 + 40, 4);
      gx.save(); gx.translate(t.x, t.y - 22); gx.rotate(t.kapali ? 0.4 : zaman * 18); bas(gx, s.testere, -30, -30); gx.restore();
    }
    for (const b of B.bekciler) {
      if (b.x < sol || b.x > sag) continue;
      const sp = s.bekci, yur = b.durum !== 0 && Math.abs((b.durum === 1 ? b.hx : b.ev) - b.x) > 6;
      for (let i = -1; i <= 1; i += 2) {
        const f = b.adim * 0.045 + (i > 0 ? 3.14 : 0), fx = b.x + i * 16 + (yur ? Math.sin(f) * 20 : 0), fy = b.y - (yur ? Math.max(0, Math.cos(f)) * 9 : 0);
        const ik = ikCoz(b.x + i * 13, b.y - 74, fx, fy - 4, 39, 39, i);
        uzuv(b.x + i * 13, b.y - 74, ik.jx, ik.jy, 15); uzuv(ik.jx, ik.jy, ik.ex, ik.ey, 12); uzuv(ik.ex - 10, fy - 3, ik.ex + 12, fy - 3, 7);
      }
      bas(gx, sp, b.x - 36, b.y - 74 - sp.lh + 8 + (yur ? Math.sin(b.adim * 0.09) * 2 : 0));
      for (let i = -1; i <= 1; i += 2) { uzuv(b.x + i * 33, b.y - 168, b.x + i * 42, b.y - 122, 12); uzuv(b.x + i * 42, b.y - 122, b.x + i * 36, b.y - 82, 10); }
    }
    for (const m of B.mayinlar) {
      if (m.olu || m.x < sol || m.x > sag) continue;
      gx.save(); gx.translate(m.x, m.y + Math.sin(zaman * 2.2 + m.bx) * 4); gx.rotate(zaman * 0.6 + m.bx); bas(gx, s.mayin, -19, -19); gx.restore();
    }
    if (kus.aktif) { gx.save(); gx.translate(kus.x, kus.y); gx.rotate(Math.sin(zaman * 5) * 0.08); bas(gx, s.kus, -15, -9); gx.restore(); }
    // yem: robotun durusunu taklit eden titrek hologram
    if (yem.t > 0) {
      gx.save(); gx.translate(yem.x - robot.x, yem.y - robot.y);
      gx.globalAlpha = (0.22 + 0.12 * Math.sin(zaman * 30)) * clamp(yem.t / 0.5, 0, 1);
      robot.ciz(gx); gx.restore(); gx.globalAlpha = 1;
    }
  }

  function ek2Isik(solE, sagE) {
    const cx = cam.x, cy = cam.y, nb = 0.5 + 0.5 * Math.sin(zaman * 4);
    if (yet.miknatis) {
      ctx.strokeStyle = 'rgba(140,175,255,' + (0.3 + 0.3 * nb) + ')'; ctx.lineWidth = 1.3;
      for (const s of B.sandiklar) if (s.x1 > solE && s.x0 < sagE) ctx.strokeRect(s.x0 - 5 - cx, s.ust - 5 - cy, s.w + 10, s.h + 10);
      for (const m of B.mplatlar) if (m.e.x1 > solE && m.e.x0 < sagE) ctx.strokeRect(m.e.x0 - 4 - cx, m.y - 6 - cy, m.w + 8, 26);
      for (const c of B.capalar) if (c.x > solE && c.x < sagE) { ctx.strokeRect(c.x - 21 - cx, c.y - 21 - cy, 42, 42); isin(ctx, c.x - cx, c.y - cy, 12, '140,175,255', 0.7); }
      if (mk.t < 0.4) {
        const K = robot.iskelet, a = 1 - mk.t / 0.4;
        ctx.strokeStyle = 'rgba(140,175,255,' + a + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(K.nx - cx, K.ny - cy); ctx.lineTo(mk.x - cx, mk.y - cy); ctx.stroke();
        isin(ctx, mk.x - cx, mk.y - cy, 50, '140,175,255', 0.6 * a);
      }
    }
    if (yet.kus) {
      ctx.strokeStyle = 'rgba(150,255,190,' + (0.3 + 0.3 * nb) + ')'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (const e of B.etkiler) if (e.uzak && !e.yapildi && e.x > solE && e.x < sagE) ctx.arc(e.x - cx, e.y - e.h - cy, 20 + nb * 3, 0, 6.283);
      ctx.stroke();
      if (kus.aktif) isin(ctx, kus.x - cx, kus.y - cy, 10, '150,255,190', 0.9);
    }
    for (const m of B.mayinlar) {
      const x = m.x - cx, y = m.y - cy;
      if (m.olu) { if (m.oluT < 0.4) isin(ctx, x, y, 150 * (0.4 + m.oluT), '255,180,100', 1 - m.oluT / 0.4); continue; }
      if (m.x > solE && m.x < sagE) isin(ctx, x, y, 8, '255,60,50', 0.4 + 0.6 * (Math.sin(zaman * 6 + m.bx) > 0.6 ? 1 : 0));
    }
    for (const b of B.bekciler) if (b.x > solE && b.x < sagE) isin(ctx, b.x - cx, b.y - 196 - cy, 9, b.durum === 1 ? '120,235,215' : '255,60,50', 0.95);
    for (const t of B.testereler) if (!t.kapali && t.x > solE && t.x < sagE && Math.random() < 0.5) isin(ctx, t.x + (Math.random() - 0.5) * 30 - cx, t.y - 2 - cy, 10, '255,200,130', 0.7);
    if (yem.t > 0) isin(ctx, yem.x - cx, yem.y - 90 - cy, 110, '120,235,215', 0.22 + 0.1 * Math.sin(zaman * 30));
    for (const k of B.kopruler) if (k.sarj && !k.kapali && k.e.x1 > solE && k.e.x0 < sagE) {
      ctx.fillStyle = 'rgba(255,200,120,' + (0.35 + 0.15 * nb) * clamp(sarjT / 1.2, 0.25, 1) + ')'; ctx.fillRect(k.e.x0 - cx, k.e.y - 3 - cy, k.e.x1 - k.e.x0, 7);
    }
    if (sarjT > 0) {
      const K = robot.iskelet, a = clamp(sarjT / 1.2, 0, 1) * (sarjT < 2 && Math.sin(zaman * 24) > 0 ? 0.4 : 1);
      isin(ctx, K.hx - cx, K.hy - 30 - cy, 120, '255,200,120', 0.3 * a);
      if (Math.random() < 0.5) isin(ctx, K.hx + (Math.random() - 0.5) * 60 - cx, K.hy - Math.random() * 110 - cy, 12, '255,235,190', 0.8 * a);
      ctx.fillStyle = 'rgba(255,200,120,0.8)'; ctx.fillRect(robot.x - cx - 22, robot.y - 204 - cy, 44 * sarjT / 8, 3);
    }
    if (zk < 0.97) { ctx.fillStyle = 'rgba(60,110,200,' + (1 - zk) * 0.22 + ')'; ctx.fillRect(0, 0, W, H); }
    if (yet.agir && agirSog > 0 && !icerde) { ctx.fillStyle = 'rgba(120,170,255,0.7)'; ctx.fillRect(robot.x - cx - 22, robot.y - 210 - cy, 44 * clamp(1 - agirSog / 8, 0, 1), 2.5); }
  }

  function ek2Maske(solE, sagE) {
    const cx = cam.x, cy = cam.y;
    for (const m of B.mayinlar) if (!m.olu && m.x > solE && m.x < sagE) isin(mx, m.x - cx, m.y - cy, 60, '0,0,0', 0.5);
    for (const m of B.mayinlar) if (m.olu && m.oluT < 0.4) isin(mx, m.x - cx, m.y - cy, 260, '0,0,0', 0.9);
    for (const b of B.bekciler) if (b.x > solE && b.x < sagE) isin(mx, b.x - cx, b.y - 110 - cy, 150, '0,0,0', 0.5);
    for (const t of B.testereler) if (t.x > solE && t.x < sagE) isin(mx, t.x - cx, t.y - 22 - cy, 80, '0,0,0', 0.55);
    for (const m of B.mplatlar) if (m.e.x1 > solE && m.e.x0 < sagE) isin(mx, (m.e.x0 + m.e.x1) / 2 - cx, m.y - cy, 120, '0,0,0', 0.4);
    for (const c of B.capalar) if (c.x > solE && c.x < sagE) isin(mx, c.x - cx, c.y - cy, 55, '0,0,0', 0.5);
    if (kus.aktif) isin(mx, kus.x - cx, kus.y - cy, 90, '0,0,0', 0.6);
    if (yem.t > 0) isin(mx, yem.x - cx, yem.y - 90 - cy, 150, '0,0,0', 0.6);
    if (sarjT > 0) isin(mx, robot.x - cx, robot.y - 80 - cy, 230, '0,0,0', 0.7);
    for (const k of B.kopruler) if (k.sarj && !k.kapali) isin(mx, (k.e.x0 + k.e.x1) / 2 - cx, k.e.y - cy, (k.e.x1 - k.e.x0) * 0.6, '0,0,0', 0.5);
  }

  let sonT = 0;
  function dongu(t) {
    const dt = Math.min(0.034, sonT ? (t - sonT) / 1000 : 0.016);
    sonT = t;
    guncelle(dt);
    ciz();
    if (prm.has('dbg')) document.title = durum + ' t=' + dZaman.toFixed(2) + ' k=' + karart.toFixed(2) + ' x=' + robot.x.toFixed(0) + ' y=' + robot.y.toFixed(0) + ' kal=' + robot.kalcaY.toFixed(0) + ' cam=' + cam.x.toFixed(0) + ',' + cam.y.toFixed(0);
    requestAnimationFrame(dongu);
  }

  Sanat.fotoYukle(basla);
})();
