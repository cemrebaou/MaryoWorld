// MaryoWorld - ana dongu, kamera, katmanlar, isik, hava
'use strict';

(function () {
  const cv = document.getElementById('oyun');
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
  let durum = 'yukleniyor';     // giris | oyun | geri | son
  let dZaman = 0, zaman = 0, girisT = 0, karart = 1, geriNeden = '';
  let kontrolX = 250, alarm = 0, uyari = 0;
  let katman = [], onPlan = [], yagmur = [], toz = [], sicrama = [];
  const girdi = { x: 0, zipla: false };
  const tus = {};
  const dok = { sol: false, sag: false, zipla: false };

  // ---------- kurulum ----------
  function boyutla() {
    const iw = window.innerWidth, ih = window.innerHeight;
    const oran = clamp(iw / ih, CFG.minOran, CFG.maxOran);
    W = Math.round(H * oran);
    let cw = iw, ch = iw / oran;
    if (ch > ih) { ch = ih; cw = ih * oran; }
    cv.style.width = Math.round(cw) + 'px';
    cv.style.height = Math.round(ch) + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    rs = clamp(ch * dpr / H, 0.6, 1.6);
    cv.width = Math.round(W * rs); cv.height = Math.round(H * rs);
    G = tuvalYap(cv.width, cv.height); gx = G.getContext('2d');
    maske = tuvalYap(W * MS, H * MS); mx = maske.getContext('2d');
    gok = Sanat.gokYap(W, H);
    vinyet = Sanat.vinyetYap(W, H);
    if (!yagmur.length) for (let i = 0; i < 150; i++) yagmur.push({ x: Math.random() * 2600, y: Math.random() * H, h: 900 + Math.random() * 500, u: 14 + Math.random() * 22 });
  }

  function katmanKur() {
    const r = rngYap(77), s = Sanat.s;
    const yap = (p, py, taban, renk, liste) => ({ p: p, py: py, taban: taban, renk: renk, o: liste, tel: [] });
    // 1 - uzak sehir
    let l = [], x = -200, son = B.uz * 0.08 + 2800;
    while (x < son) { const sp = r.sec(s.binaUzak); l.push({ sp: sp, x: x, k: r.ar(0.9, 1.5) }); x += sp.width * r.ar(0.5, 1.3); }
    katman.push(yap(0.08, 0.05, 0.60, '#1b2a33', l));
    // 2 - harabeler
    l = []; x = -300; son = B.uz * 0.22 + 2800;
    while (x < son) { const sp = r.sec(s.binaOrta); l.push({ sp: sp, x: x, k: r.ar(0.9, 1.35) }); x += sp.width * r.ar(0.7, 2.4); }
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
      if (wx > B.projektor.x0 - 300 && wx < B.projektor.x1 + 300) return true;
      for (const c of Z.cukurlar) if (wx > c.x0 - 380 && wx < c.x1 + 380) return true;
      for (const k of B.konteynerler) if (wx > k.x0 - 300 && wx < k.x1 + 200) return true;
      if (wx > B.uz - 1000) return true;
      return false;
    };
    const op = 1.55;
    x = 1750;
    while (x < B.uz * op + 600) {
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
    boyutla();
    katmanKur();
    B.projektor.t = 0; B.projektor.sx = B.projektor.x0;
    for (const o of B.nesneler) if (o.tip === 'lamba') o.guc = 1;
    yenidenBasla(true);
    window.addEventListener('resize', boyutla);
    requestAnimationFrame(dongu);
  }

  function yenidenBasla(ilk) {
    kontrolX = B.baslaX; alarm = 0;
    if (dbgX !== null) {
      robot.sifirla(dbgX); kontrolX = dbgX; durum = 'oyun'; karart = 0;
    } else {
      robot.sifirla(B.baslaX); robot.cokme = 1; robot.kilit = true; durum = 'giris'; karart = 1;
    }
    dZaman = 0; girisT = dbgX !== null ? 99 : 0;
    cam.x = clamp(robot.x - W * 0.42, 0, B.uz - W); cam.y = robot.y - H * 0.70;
  }

  // ---------- girdi ----------
  window.addEventListener('keydown', (e) => {
    tus[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].indexOf(e.code) >= 0) e.preventDefault();
    if (durum === 'son' && dZaman > 4) yenidenBasla();
  });
  window.addEventListener('keyup', (e) => { tus[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in tus) tus[k] = false; dok.sol = dok.sag = dok.zipla = false; });
  [['dSol', 'sol'], ['dSag', 'sag'], ['dZip', 'zipla']].forEach((c) => {
    const el = document.getElementById(c[0]);
    const ac = (e) => { e.preventDefault(); dok[c[1]] = true; el.classList.add('bas'); };
    const kapa = (e) => { e.preventDefault(); dok[c[1]] = false; el.classList.remove('bas'); };
    el.addEventListener('pointerdown', ac); el.addEventListener('pointerup', kapa);
    el.addEventListener('pointercancel', kapa); el.addEventListener('pointerleave', kapa);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  cv.addEventListener('pointerdown', () => { if (durum === 'son' && dZaman > 4) yenidenBasla(); });

  function girdiOku() {
    let x = 0;
    if (tus.ArrowLeft || tus.KeyA || dok.sol) x -= 1;
    if (tus.ArrowRight || tus.KeyD || dok.sag) x += 1;
    if (dbgOto) x = 1;
    girdi.x = x;
    girdi.zipla = !!(tus.Space || tus.ArrowUp || tus.KeyW || dok.zipla);
  }

  // ---------- guncelleme ----------
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
        if (!robot._yerlesti) { robot.sifirla(kontrolX); robot._yerlesti = true; alarm = 0; B.projektor.t = 0; cam.x = clamp(robot.x - W * 0.42, 0, B.uz - W); cam.y = robot.y - H * 0.70; }
        karart = 1 - smooth((dZaman - 0.75) / 0.7);
        if (dZaman > 1.5) { durum = 'oyun'; karart = 0; }
      }
      robot.kilit = durum !== 'oyun';
    } else if (durum === 'son') {
      robot.kilit = true;
      karart = smooth((dZaman - 1.6) / 2.6) * 0.93;
    }

    robot.guncelle(dt, girdi);

    if (durum === 'oyun') {
      // kontrol noktasi
      if (robot.yerde) for (const k of B.kontrol) if (robot.x >= k.x && k.x > kontrolX) kontrolX = k.x;
      if (robot.olu) geriAl('dustu');
      if (robot.x >= B.bitisX && robot.yerde) { durum = 'son'; dZaman = 0; }
    }

    // projektor
    const P = B.projektor;
    if (durum !== 'geri') P.t += dt;
    const orta = (P.x0 + P.x1) / 2, gen = (P.x1 - P.x0) / 2;
    P.sx = orta - Math.cos(P.t * 6.2832 / P.periyot) * gen;
    P.sy = Z.yuk(P.sx);
    let siperde = false;
    for (const s of B.siperler) if (Math.abs(robot.x - s.x) < s.w / 2 - 10) siperde = true;
    const gorunur = Math.abs(robot.x - P.sx) < P.yaricap - 28 && robot.y > P.sy - 160;
    if (durum === 'oyun' && gorunur && !siperde) alarm += dt; else alarm = Math.max(0, alarm - dt * 1.6);
    uyari = damp(uyari, clamp(alarm / CFG.yakalanmaSure, 0, 1), 12, dt);
    if (durum === 'oyun' && alarm > CFG.yakalanmaSure) geriAl('yakalandi');

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
    if (robot.indiOlay > 250) for (let i = 0; i < 9; i++) toz.push({ x: robot.x + (Math.random() - 0.5) * 34, y: robot.y - 2, vx: (Math.random() - 0.5) * 120, vy: -14 - Math.random() * 40, o: 0, s: 0.6 + Math.random() * 0.4, b: 4 + Math.random() * 6 });
    for (let i = toz.length - 1; i >= 0; i--) {
      const t = toz[i]; t.o += dt; t.x += t.vx * dt; t.y += t.vy * dt; t.vx *= 0.94; t.vy *= 0.94; t.b += dt * 9;
      if (t.o > t.s) toz.splice(i, 1);
    }

    // kamera
    const bak = robot.yon * 70 + robot.vx * 0.25;
    const hx = clamp(robot.x + bak - W * 0.44, 0, B.uz - W);
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
    if (Math.random() < dt * 46) {
      const wx = cam.x + Math.random() * W, wy = Z.yuk(wx);
      if (wy < CUKUR) sicrama.push({ x: wx, y: wy, o: 0 });
    }
    for (let i = sicrama.length - 1; i >= 0; i--) { sicrama[i].o += dt; if (sicrama[i].o > 0.26) sicrama.splice(i, 1); }
  }

  function geriAl(neden) {
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
      const w = o.sp.width * o.k, h = o.sp.height * o.k;
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
    // beton bloklar: merdiven ve ust gecit govdesi
    gx.fillStyle = betonDesen;
    for (let i = i0; i <= i1; i++) {
      if (Z.mat[i] !== 'beton' || n[i].y >= CUKUR || n[i + 1].y >= CUKUR) continue;
      const ust = Math.min(n[i].y, n[i + 1].y);
      gx.fillRect(n[i].x - 0.5, ust, n[i + 1].x - n[i].x + 1, 150);
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
      const y = Z.yuk(x); if (y >= CUKUR) continue;
      const hs2 = Math.sin(x * 78.233) * 12543.21; const h2 = hs2 - Math.floor(hs2);
      gx.moveTo(x, y + 1.5); gx.lineTo(x + (h2 - 0.5) * 8 + Math.sin(zaman * 1.6 + x * 0.05) * 1.2, y - 3 - h1 * 11);
    }
    gx.stroke();
    // yagmur sicramalari
    gx.strokeStyle = 'rgba(190,215,228,0.5)'; gx.lineWidth = 1;
    gx.beginPath();
    for (const s of sicrama) { const r = 1.5 + s.o * 22; gx.moveTo(s.x + r, s.y - 0.5); gx.ellipse(s.x, s.y - 0.5, r, r * 0.3, 0, 0, 3.1416, true); }
    gx.stroke();
  }

  function nesneCiz(on) {
    const s = Sanat.s;
    for (const o of B.nesneler) {
      if (o.x < cam.x - 420 || o.x > cam.x + W + 420) continue;
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
      if (sp) gx.drawImage(sp, o.x - sp.kokX, o.y - sp.height + (o.tip === 'araba' ? 6 : 2));
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
      gx.drawImage(sp, s.x - sp.kokX, Z.yuk(s.x) - sp.height + 3);
    }
  }

  // isik listesi (ekran koordinati)
  function isiklariTopla() {
    const L = [];
    for (const o of B.nesneler) {
      if (o.tip === 'lamba') {
        const lx = o.x + Sanat.s.lamba.isikX - cam.x, ly = o.y + Sanat.s.lamba.isikY - cam.y;
        if (lx < -400 || lx > W + 400) continue;
        L.push({ tip: 'lamba', x: lx, y: ly, yer: o.y - cam.y, guc: o.guc });
      } else if (o.tip === 'kapi') {
        const lx = o.x + Sanat.s.kapi.isikX - cam.x;
        if (lx < -500 || lx > W + 500) continue;
        L.push({ tip: 'kapi', x: lx, y: o.y - 90 - cam.y, yer: o.y - cam.y, guc: 0.9 + Math.sin(zaman * 2.1) * 0.06 });
      }
    }
    return L;
  }

  function ciz() {
    const K = robot.iskelet;
    ctx.setTransform(rs, 0, 0, rs, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

    // --- gok ---
    if (Sanat.foto.uzak) {
      const im = Sanat.foto.uzak, o = (H * 1.12) / im.height, iw = im.width * o;
      const ox = -clamp(cam.x * 0.03, 0, Math.max(0, iw - W)) - Math.max(0, (iw - W) * 0);
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

    const L = isiklariTopla();
    const P = B.projektor;
    const kuleSp = Sanat.s.kule;
    const pKx = P.kuleX - cam.x, pKy = Z.yuk(P.kuleX) + kuleSp.isikY - cam.y;
    const pSx = P.sx - cam.x, pSy = P.sy - cam.y;
    const pGor = pSx > -700 && pSx < W + 700;
    const kirmizi = uyari;
    const pRenk = Math.round(235) + ',' + Math.round(lerp(244, 70, kirmizi)) + ',' + Math.round(lerp(255, 60, kirmizi));

    // --- isik huzmeleri (oyun katmaninin arkasinda) ---
    ctx.globalCompositeOperation = 'lighter';
    for (const l of L) {
      if (l.tip === 'lamba') {
        const g = ctx.createLinearGradient(0, l.y, 0, l.yer);
        g.addColorStop(0, 'rgba(190,222,236,' + 0.30 * l.guc + ')'); g.addColorStop(1, 'rgba(190,222,236,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(l.x - 10, l.y); ctx.lineTo(l.x + 10, l.y); ctx.lineTo(l.x + 150, l.yer); ctx.lineTo(l.x - 150, l.yer); ctx.closePath(); ctx.fill();
        isin(ctx, l.x, l.y, 190, '170,210,228', 0.34 * l.guc);
      } else isin(ctx, l.x, l.y, 330, '255,176,96', 0.42 * l.guc);
    }
    if (pGor) {
      const g = ctx.createLinearGradient(pKx, pKy, pSx, pSy);
      g.addColorStop(0, 'rgba(' + pRenk + ',0.34)'); g.addColorStop(1, 'rgba(' + pRenk + ',0.05)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(pKx - 7, pKy); ctx.lineTo(pKx + 7, pKy); ctx.lineTo(pSx + P.yaricap, pSy); ctx.lineTo(pSx - P.yaricap, pSy); ctx.closePath(); ctx.fill();
      isin(ctx, pKx, pKy, 120, pRenk, 0.7);
    }
    ctx.globalCompositeOperation = 'source-over';

    // --- oyun katmani ---
    gx.setTransform(1, 0, 0, 1, 0, 0);
    gx.globalCompositeOperation = 'source-over'; gx.globalAlpha = 1;
    gx.clearRect(0, 0, G.width, G.height);
    gx.setTransform(rs, 0, 0, rs, -cam.x * rs, -cam.y * rs);
    nesneCiz();
    zeminCiz();
    konteynerCiz();
    // golge
    if (robot.yerde) {
      gx.fillStyle = 'rgba(0,0,0,0.42)';
      gx.beginPath(); gx.ellipse(robot.x, robot.y + 2, 30, 4.5, Z.egim(robot.x, 14), 0, 6.283); gx.fill();
    }
    robot.ciz(gx);
    // toz
    for (const t of toz) {
      gx.fillStyle = 'rgba(150,150,140,' + 0.22 * (1 - t.o / t.s) + ')';
      gx.beginPath(); gx.arc(t.x, t.y, t.b, 0, 6.283); gx.fill();
    }
    siperCiz();

    // --- karanlik maskesi ---
    mx.setTransform(MS, 0, 0, MS, 0, 0);
    mx.globalCompositeOperation = 'source-over';
    mx.clearRect(0, 0, W, H);
    mx.fillStyle = 'rgba(3,7,11,0.80)'; mx.fillRect(0, 0, W, H);
    mx.globalCompositeOperation = 'destination-out';
    for (const l of L) {
      if (l.tip === 'lamba') { isin(mx, l.x, l.yer - 60, 250, '0,0,0', 0.95 * l.guc); isin(mx, l.x, l.y, 120, '0,0,0', 0.8 * l.guc); }
      else isin(mx, l.x, l.yer - 60, 320, '0,0,0', 0.9 * l.guc);
    }
    const gozA = durum === 'giris' ? clamp((dZaman - 1.3) / 0.5, 0, 1) * (Math.sin(dZaman * 40) > -0.6 || dZaman > 2.2 ? 1 : 0.2) : 1;
    const rx = robot.x - cam.x, ry = K.hy - cam.y;
    isin(mx, rx, ry - 14, 120, '0,0,0', 0.5);
    isin(mx, K.gozX - cam.x + K.f * 96, K.gozY - cam.y + 26, 190, '0,0,0', 0.62 * gozA);
    if (pGor) {
      mx.save(); mx.translate(pSx, pSy); mx.scale(1, 0.62);
      isin(mx, 0, -40, P.yaricap * 1.25, '0,0,0', 1);
      mx.restore();
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
        ctx.save(); ctx.translate(l.x - 40, l.yer); ctx.scale(1, 0.2); isin(ctx, 0, 0, 240, '255,180,100', 0.42); ctx.restore();
      }
    }
    if (pGor) {
      ctx.save(); ctx.translate(pSx, pSy); ctx.scale(1, 0.2);
      isin(ctx, 0, 0, P.yaricap * 1.05, pRenk, 0.55); ctx.restore();
      isin(ctx, pKx, pKy, 20, pRenk, 1);
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
    const yakin = clamp(robot.x / B.bitisX, 0, 1);
    const nabiz = Math.pow(0.5 + 0.5 * Math.sin(zaman * (2.2 + yakin * 7)), 3);
    isin(ctx, K.cekX - cam.x, K.cekY - cam.y, 4 + nabiz * 9, '255,190,110', (0.45 + nabiz * 0.55) * gozA);
    ctx.globalCompositeOperation = 'source-over';

    // --- yer sisi, yagmur ---
    const yerY = robot.sonZeminY - cam.y;
    sisCiz(ctx, zaman * 22 + cam.x * 1.12, yerY - 150, 1.25, 0.34);
    ctx.strokeStyle = 'rgba(175,205,220,0.20)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of yagmur) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.u * 0.16, d.y + d.u); }
    ctx.stroke();

    // --- on plan (bulanik siluetler karakterin onunden gecer) ---
    for (const o of onPlan) {
      const w = o.sp.width * o.k, h = o.sp.height * o.k;
      const sx = o.x - cam.x * 1.55 - w / 2;
      if (sx > W || sx + w < 0) continue;
      const y = o.sp.ustten ? -30 - cam.y * 0.1 : H + 46 - h - cam.y * 0.18 + 30;
      ctx.globalAlpha = 0.93;
      if (o.cevir) { ctx.save(); ctx.translate(sx + w, y); ctx.scale(-1, 1); ctx.drawImage(o.sp, 0, 0, w, h); ctx.restore(); }
      else ctx.drawImage(o.sp, sx, y, w, h);
    }
    ctx.globalAlpha = 1;

    // --- son islemler ---
    ctx.drawImage(vinyet, 0, 0, W, H);
    if (uyari > 0.02) { ctx.fillStyle = 'rgba(190,30,20,' + uyari * 0.16 + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.globalAlpha = 0.055; ctx.globalCompositeOperation = 'overlay';
    const gk2 = Sanat.s.gren, ox = (Math.random() * 192) | 0, oy = (Math.random() * 192) | 0;
    for (let y = -oy; y < H; y += 192 * 2) for (let x = -ox; x < W; x += 192 * 2) ctx.drawImage(gk2, x, y, 384, 384);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    if (karart > 0.003) { ctx.fillStyle = 'rgba(0,0,0,' + clamp(karart, 0, 1) + ')'; ctx.fillRect(0, 0, W, H); }
    yaziCiz();
  }

  function yazi(t, x, y, boy, alfa, hiza, aralik) {
    if (alfa <= 0.01) return;
    ctx.font = '300 ' + boy + 'px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = hiza || 'center'; ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (aralik === undefined ? boy * 0.42 : aralik) + 'px';
    ctx.fillStyle = 'rgba(214,228,236,' + clamp(alfa, 0, 1) + ')';
    ctx.fillText(t, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  const gecis = (t, a, b, s) => clamp(Math.min((t - a) / s, (b - t) / s), 0, 1);

  function yaziCiz() {
    const M = CFG.metin;
    if (girisT < 11 && durum !== 'son') {
      const t = girisT;
      yazi(M.giris1, W / 2, H * 0.26, 21, gecis(t, 1.2, 5.2, 0.9));
      yazi(M.giris2, W / 2, H * 0.26, 21, gecis(t, 5.6, 10.2, 0.9));
    }
    if (durum === 'geri' && geriNeden === 'yakalandi') yazi(M.yakalandin, W / 2, H * 0.4, 20, gecis(dZaman, 0.1, 1.2, 0.3));
    if (durum === 'son') {
      yazi(M.son1, W / 2, H * 0.4, 26, clamp((dZaman - 2.2) / 1.2, 0, 1));
      yazi(M.son2, W / 2, H * 0.4 + 52, 15, clamp((dZaman - 3.4) / 1.2, 0, 1) * 0.8);
      yazi(M.tekrar, W / 2, H * 0.82, 13, clamp((dZaman - 4.4) / 1, 0, 1) * (0.45 + 0.2 * Math.sin(zaman * 3)), 'center', 3);
    }
    // sinyal gostergesi + surum
    if (durum === 'oyun' || durum === 'geri') {
      const yuzde = Math.round(clamp(robot.x / B.bitisX, 0, 1) * 100);
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
