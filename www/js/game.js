// MaryoWorld - ana dongu, kamera, katmanlar, isik, hava, tehditler, bulmacalar, etkilesim, bitis sahnesi
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
  const isaret = { bas: false, x: 0, y: 0, yeni: false };    // parmak / fare (mantiksal ekran koordinati)
  let katman = [], onPlan = [], yagmur = [], toz = [], sicrama = [];
  const girdi = { x: 0, zipla: false, egil: false, etk: false };
  const tus = {};
  const dok = { sol: false, sag: false, zipla: false, egil: false, etk: false };

  // gorseli mantiksal olcusuyle bas (gorseller ekrandan daha yuksek cozunurlukte uretilir)
  const bas = (c, sp, x, y) => { c.drawImage(sp, x, y, sp.lw, sp.lh); };
  const gorunur = (e) => !e.onkosul || e.onkosul.every((k) => k.yapildi);
  const secilir = (e) => !e.yapildi && gorunur(e);
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

  function basla() {
    Sanat.hazirla();
    B = bolumKur(); Z = B.zemin;
    robot = new Robot(Z);
    robot.merdivenler = B.tirmanma;
    robot.alcaklar = B.alcaklar;
    // siperin icinde kalan etkilesim kutulari siperin onunde cizilir (yoksa gorunmez)
    for (const e of B.etkiler) for (const s of B.siperler) if (Math.abs(e.x - s.x) < 70) e.onde = true;
    boyutla();
    katmanKur();
    for (const o of B.nesneler) if (o.tip === 'lamba') o.guc = 1;
    yenidenBasla();
    window.addEventListener('resize', boyutla);
    window.addEventListener('orientationchange', () => setTimeout(boyutla, 120));
    document.addEventListener('fullscreenchange', () => setTimeout(boyutla, 120));
    document.addEventListener('webkitfullscreenchange', () => setTimeout(boyutla, 120));
    requestAnimationFrame(dongu);
  }

  // tam = true: dugmeler, fisler, sandiklar, kapi da basa doner
  function tehlikeSifirla(tam) {
    alarm = 0;
    for (const g of B.gozculer) g.t = 0;
    for (const p of B.platformlar) { p.t = 0; p.e.x0 = p.c0; p.e.x1 = p.c0 + p.w; }
    for (const k of B.kalaslar) { k.t = -1; k.dy = 0; k.vy = 0; k.e.aktif = true; }
    for (const a of B.asansorler) { a.t = 0; a.k = 0; a.ust = a.yAlt; }
    if (tam) {
      const hepsi = [B.gozculer, B.presler, B.lazerler, B.elektrik, B.bariyerler, B.asansorler];
      for (const liste of hepsi) for (const o of liste) { o.kapali = !!o.kapali0; o.kalici = false; }
      for (const g of B.gozculer) { g.in = 0; g.guc = g.kapali ? 0 : 1; }
      for (const e of B.etkiler) { e.yapildi = false; e.t = 0; e.kalan = 0; e.redT = 9; }
      for (const s of B.sandiklar) { s.x0 = s.bas; s.x1 = s.bas + s.w; }
      for (const d of B.dusunceler) d.oldu = false;
      kapiAc = false; kapiAcik = 0; tasinan = null; dsn = null;
    }
  }

  function yenidenBasla() {
    kameraKapat();
    icerde = false; kameraSinir();
    F.faz = 0; F.t = 0; F.temas = 0; F.elde = false; F.soz = {}; F.beyaz = 0;
    kontrolX = B.baslaX;
    tehlikeSifirla(true);
    robot.minX = 40; robot.maxX = B.oyunSonX - 60;
    if (dbgX !== null) {
      robot.sifirla(dbgX); kontrolX = dbgX; durum = 'oyun'; karart = 0;
    } else {
      robot.sifirla(B.baslaX); robot.cokme = 1; robot.kilit = true; durum = 'giris'; karart = 1;
    }
    dZaman = 0; girisT = dbgX !== null ? 99 : 0;
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
    isaret.x = e.offsetX * W / cw; isaret.y = e.offsetY * H / ch;
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
    // sandik: yanina dayanip yurununce itilir
    const d = (durum === 'oyun' && robot.yerde && !robot.merd && !robot.etk && robot.surunK < 0.3) ? girdi.x : 0;
    for (const s of B.sandiklar) {
      if (!d || Math.abs(robot.y - s.taban) > 3) continue;
      const ara = d > 0 ? s.x0 - robot.x : robot.x - s.x1;
      if (ara < 0 || ara > 17) continue;
      // acik olmayan bariyerden sandik da gecemez (araya robotun sigacagi bosluk kalir)
      let lo = s.min, hi = s.max - s.w;
      for (const b of B.bariyerler) {
        if (b.kapali || Math.abs(b.y - s.taban) > 3) continue;
        if (s.x1 <= b.x) hi = Math.min(hi, b.x - 92 - s.w); else lo = Math.max(lo, b.x + 92);
      }
      const nx0 = clamp(s.x0 + d * CFG.itmeHiz * dt, Math.min(lo, s.x0), Math.max(hi, s.x0));
      robot.x += nx0 - s.x0;                         // robot sandikla birlikte ilerler (ayaklar adim atarak gelir)
      s.x0 = nx0; s.x1 = nx0 + s.w;
      robot.itiyor = true;
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
    let olum = null;
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
        if (dx < p.w / 2 - 6) olum = 'hasar';                                   // altinda kaldi
        else {
          if (dx < p.w / 2 + 10) robot.x = p.x + (rx < p.x ? -1 : 1) * (p.w / 2 + 10);   // kenardaysa disari it
          robot.duvarlar.push(p.x - p.w / 2 - 10, p.x + p.w / 2 + 10);
        }
      }
      if (k >= 1 && p.onceki < 1 && Math.abs(p.x - cam.x - W / 2) < W * 0.7) { sars = Math.max(sars, 5); tozEkle(p.x, p.y, 10, p.w + 30, 150); }
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
      if (e.acik && robot.yerde && rx > e.x0 + 6 && rx < e.x1 - 6 && Math.abs(ry - e.y) < 12) olum = 'hasar';
    }
    // lazerler: ust = egilerek, surun = surunerek, alt = ziplayarak (ya da sonukken) gecilir
    for (const l of B.lazerler) {
      const f = l.periyot ? devir(l) : 0;
      l.acik = !l.kapali && (!l.periyot || f < 0.4);
      l.yakinda = !l.kapali && l.periyot > 0 && f > 0.88;
      if (!l.acik || rx < l.x0 - 6 || rx > l.x1 + 6) continue;
      const by = l.y - l.h;
      if (l.ust) { if (ry - boy < by - 4 && ry > by) olum = 'yakalandi'; }
      else if (ry > by - 2 && ry < l.y + 40) olum = 'yakalandi';
    }
    // sivri demirler
    for (const d of B.dikenler) if (rx > d.x0 + 8 && rx < d.x1 - 8 && ry > d.y - 10 && ry < d.y + 40) olum = 'hasar';
    // curuk kalaslar
    for (const k of B.kalaslar) {
      if (k.t < 0) {
        if (durum === 'oyun' && robot.yerde && rx > k.x0 - 4 && rx < k.x1 + 4 && Math.abs(ry - k.y) < 3) k.t = 0;
        continue;
      }
      k.t += dt;
      if (k.e.aktif && k.t > CFG.kalasSure) { k.e.aktif = false; k.vy = 0; k.dy = 0; }
      if (!k.e.aktif) {
        k.vy += 1500 * dt; k.dy += k.vy * dt;
        // robot uzaklasinca yerine gelir (geri donulebilsin)
        if (k.t > CFG.kalasSure + 5 && (rx < k.x0 - 260 || rx > k.x1 + 260)) { k.t = -1; k.dy = 0; k.vy = 0; k.e.aktif = true; }
      }
    }
    if (olum && durum === 'oyun') geriAl(olum);
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
    if (sec && !robot.etk && robot.etkBasla(sec.x, sec.y - sec.h, sec.egil)) etkSecili = sec;
    etkOnceki = girdi.etk;

    if (robot.etkOlay && etkSecili) {
      // el hedefe degdi: kosullar tamamsa calisir, degilse robot nedenini dusunur
      const e = etkSecili;
      let olur = true;
      if (e.kilit) for (const k of e.kilit) if (!k.yapildi) olur = false;
      if (e.gerek && tasinan !== e.gerek) olur = false;
      if (!olur) { e.redT = 0; if (e.red) dusun(e.red); }
      else {
        e.yapildi = true; e.t = 0; e.s = robot.etk ? robot.etk.s : 1;
        if (e.gerek) tasinan = null;
        if (e.verir) tasinan = e.verir;
        for (const h of e.hedef) { h.kapali = true; if (!e.sure) h.kalici = true; }
        if (e.ac) for (const h of e.ac) h.kapali = false;
        if (e.sure) e.kalan = e.sure;
        if (e.kapi) kapiAc = true;
        if (e.hat) dusun(B.hatlar.every((h) => h.yapildi) ? 'dHat2' : 'dHat1');
        else if (e.dusun) dusun(e.dusun);
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
      if (F.temas > 2.8) { F.faz = 5; F.t = 0; dsn = null; }
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
    zaman += dt; dZaman += dt; girisT += dt;
    girdiOku();

    if (durum === 'giris') {
      karart = 1 - smooth((dZaman - 0.4) / 2.4);
      robot.cokme = 1 - smooth((dZaman - 1.7) / 1.9);
      robot.kilit = dZaman < 3.3;
      if (dZaman > 3.6) { durum = 'oyun'; robot.cokme = 0; }
    } else if (durum === 'geri') {
      // karar, yerine koy, ac
      if (dZaman < 0.55) karart = smooth(dZaman / 0.5);
      else {
        if (!robot._yerlesti) {
          robot.sifirla(kontrolX); robot._yerlesti = true;
          tehlikeSifirla(false);
          cam.x = clamp(robot.x - W * 0.42, camMin, camMax); cam.y = robot.y - H * 0.70;
        }
        karart = 1 - smooth((dZaman - 0.75) / 0.7);
        if (dZaman > 1.5) { durum = 'oyun'; karart = 0; }
      }
      robot.kilit = durum !== 'oyun';
    } else if (durum === 'kapida') {
      robot.kilit = true;
      karart = smooth((dZaman - 1.2) / 1.8);
      if (dZaman > 3.3) iceriGec();
    }
    if (durum === 'final') finalGuncelle(dt);

    platformGuncelle(dt);
    blokGuncelle(dt);
    robot.guncelle(dt, girdi);

    if (durum === 'oyun') {
      // kontrol noktasi
      if (robot.yerde) for (const k of B.kontrol) if (robot.x >= k.x && k.x > kontrolX) kontrolX = k.x;
      if (robot.olu) geriAl('dustu');
    }

    if (!icerde) {
      gozcuGuncelle(dt);
      tehlikeGuncelle(dt);
      etkiGuncelle(dt);
    }
    isaret.yeni = false;
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
    if (!icerde && Math.random() < dt * 46) {
      const wx = cam.x + Math.random() * W, wy = Z.yukZemin(wx);
      if (wy < CUKUR) sicrama.push({ x: wx, y: wy, o: 0 });
    }
    for (let i = sicrama.length - 1; i >= 0; i--) { sicrama[i].o += dt; if (sicrama[i].o > 0.26) sicrama.splice(i, 1); }
  }

  function geriAl(neden) {
    if (durum !== 'oyun') return;
    durum = 'geri'; dZaman = 0; geriNeden = neden; robot._yerlesti = false; robot.kilit = true;
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
      const ty = e.y - e.h, ku = Sanat.kutuAl(e.h);
      bas(gx, ku, e.x - ku.kokX, ty - ku.elY);
      if (e.tip === 'dugme') {
        const basili = e.yapildi && e.t < 0.3;
        gx.fillStyle = e.yapildi ? '#1f5a3a' : '#7a1f1a';
        gx.beginPath(); gx.arc(e.x, ty, basili ? 4.6 : 6, 0, 6.283); gx.fill();
        gx.fillStyle = 'rgba(255,255,255,0.14)'; gx.beginPath(); gx.arc(e.x - 1.6, ty - 1.8, 2, 0, 6.283); gx.fill();
      } else if (e.tip === 'salter') {
        // salter kolu: kapaliyken yukari, acilinca asagi
        const k = e.yapildi ? smooth(e.t / 0.2) : 0, ac = lerp(-0.9, 0.9, k);
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
        const ust = a.y - 178, bx = a.x0 - 26, bw = a.x1 - a.x0 + 52;
        gx.fillStyle = betonDesen || '#1b2023';
        gx.fillRect(a.x0 - 16, a.y - 116, 14, 116); gx.fillRect(a.x1 + 2, a.y - 116, 14, 116);
        gx.fillStyle = 'rgba(2,4,6,0.5)'; gx.fillRect(a.x0 - 16, a.y - 116, 14, 116); gx.fillRect(a.x1 + 2, a.y - 116, 14, 116);
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
      const bx = K.hx + K.sx * 30 + K.sy * K.f * 19, by = K.hy + K.sy * 30 - K.sx * K.f * 19;
      gx.save(); gx.translate(bx, by); gx.rotate(Math.atan2(K.sy, K.sx) + 1.5708);
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
    const O = B.oda, odaLx = O.kaideX - cam.x, odaLy = O.y - 430 - cam.y, odaYer = O.y - cam.y;

    // --- isik huzmeleri (oyun katmaninin arkasinda) ---
    ctx.globalCompositeOperation = 'lighter';
    for (const l of L) {
      if (l.tip === 'lamba') {
        const g = ctx.createLinearGradient(0, l.y, 0, l.yer);
        g.addColorStop(0, 'rgba(190,222,236,' + 0.30 * l.guc + ')'); g.addColorStop(1, 'rgba(190,222,236,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(l.x - 10, l.y); ctx.lineTo(l.x + 10, l.y); ctx.lineTo(l.x + 150, l.yer); ctx.lineTo(l.x - 150, l.yer); ctx.closePath(); ctx.fill();
        isin(ctx, l.x, l.y, 190, '170,210,228', 0.34 * l.guc);
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
    robot.ciz(gx);
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
    mx.fillStyle = icerde ? 'rgba(2,4,7,0.88)' : 'rgba(3,7,11,0.80)'; mx.fillRect(0, 0, W, H);
    mx.globalCompositeOperation = 'destination-out';
    for (const l of L) {
      if (l.tip === 'lamba') { isin(mx, l.x, l.yer - 60, 250, '0,0,0', 0.95 * l.guc); isin(mx, l.x, l.y, 120, '0,0,0', 0.8 * l.guc); }
      else { isin(mx, l.x - 60, l.yer - 80, 380, '0,0,0', 0.95 * l.guc); isin(mx, l.x, l.y - 60, 260, '0,0,0', 0.45); }
    }
    const gozA = durum === 'giris' ? clamp((dZaman - 1.3) / 0.5, 0, 1) * (Math.sin(dZaman * 40) > -0.6 || dZaman > 2.2 ? 1 : 0.2) : 1;
    const rx = robot.x - cam.x, ry = K.hy - cam.y;
    isin(mx, rx, ry - 14, 120, '0,0,0', 0.5);
    isin(mx, K.gozX - cam.x + K.f * 96, K.gozY - cam.y + 26, 190, '0,0,0', 0.62 * gozA);
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
        isin(ctx, l.x, l.y, 26, '225,242,250', 0.95 * l.guc);
        ctx.save(); ctx.translate(l.x, l.yer); ctx.scale(1, 0.16); isin(ctx, 0, 0, 170, '160,205,225', 0.3 * l.guc); ctx.restore();
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
        for (let i = 0; i < B.hatlar.length; i++) isin(ctx, lx + (i === 0 ? -52 : 52), ly + 14, 13, B.hatlar[i].yapildi ? '120,255,170' : '255,90,60', 0.8);
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
          isin(ctx, ex, e.tip === 'salter' ? ey - 14 : ey, 13, red ? '255,60,40' : (e.yapildi ? '110,255,160' : '255,80,60'), red ? 1 : (e.yapildi ? 0.8 : 0.55 + 0.3 * Math.sin(zaman * 4)));
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
    // vizor ve cekirdek
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
    isin(ctx, K.cekX - cam.x, K.cekY - cam.y, 4 + nabiz * (9 + (icerde ? F.temas * 6 : 0)), '255,190,110', (0.45 + nabiz * 0.55) * gozA);
    ctx.globalCompositeOperation = 'source-over';

    if (!icerde) {
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
    if (girisT < 11 && durum !== 'final') {
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
    if (dsn) yazi(M[dsn.ad], W / 2, H * 0.865, 17, gecis(dsn.t, 0, 4.6, 0.5) * 0.92, 'center', 1.5, F.beyaz > 0.3 ? '60,40,24' : '255,214,170');
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
      const yuzde = icerde ? 100 : Math.round(clamp(robot.x / B.bitisX, 0, 1) * 100);
      const nb = 0.4 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(zaman * (2.2 + yuzde * 0.07)), 3);
      ctx.fillStyle = 'rgba(255,190,110,' + nb * 0.8 + ')';
      ctx.beginPath(); ctx.arc(30, 30, 3.5, 0, 6.283); ctx.fill();
      yazi(M.sinyal + '  %' + yuzde, 44, 31, 11, 0.42, 'left', 3);
    }
    yazi(CFG.oyunAdi + ' ' + CFG.surum, W - 16, H - 14, 10, 0.3, 'right', 2);
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
