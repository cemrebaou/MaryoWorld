// MaryoWorld - sesler (ayri modul). Oyun koduna dokunmaz: Robot.guncelle'yi sarar.
// Dosyalar: assets/sounds/  rain.mp3 (ambiyans), step_1..10.mp3 (ayak basma), fx_*.mp3 (olay sesleri)
'use strict';
const SES = (function () {
  const YOL = 'assets/sounds/';
  const AYAR = {
    yagmur: 0.62,     // ambiyans yagmur sesi
    adim: 0.40,       // ayak yere basinca
    inis: 1.0,        // zipladiktan sonra yere inis
  };
  const ADIMLAR = []; for (let i = 1; i <= 10; i++) ADIMLAR.push('step_' + i + '.mp3');
  // Olay sesleri (fx_<ad>.mp3): earshot ses bankasindan uretildi. Oyun SES.cal('ad', siddet) ile calar.
  // Buradaki sayi her sesin temel seviyesidir.
  const FX = {
    pres: 0.81, dugme: 0.7, salter: 0.8, fis: 0.7, hucre: 0.7, red: 0.5, alarm: 0.6, hasar: 0.8, dustu: 0.8,
    kapi: 0.9, kalas: 0.7, bariyer: 0.35, guc: 0.6, sev: 0.5, el: 0.45, buldum: 0.8, basamak: 0.16, elektrik: 0.4, sandik: 0.5, lazer: 0.45, vur: 0.6
  };
  const fxDosya = (ad) => 'fx_' + ad + '.mp3';

  let ctx = null, ana = null, tampon = {}, basladi = false, webAudio = false;
  let yagmurKaynak = null, htmlYagmur = null, sonAdim = -1;

  function yukle(ad) {
    return fetch(YOL + ad).then((r) => r.arrayBuffer())
      .then((b) => new Promise((ok, red) => ctx.decodeAudioData(b, ok, red)))
      .then((buf) => { tampon[ad] = buf; });
  }

  function dongu(ad, ses) {
    const k = ctx.createBufferSource(); k.buffer = tampon[ad]; k.loop = true;
    const g = ctx.createGain(); g.gain.value = ses;
    k.connect(g); g.connect(ana); k.start();
    return { k: k, g: g };
  }

  function baslat() {
    if (basladi) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
    basladi = true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && location.protocol !== 'file:') {
      ctx = new AC(); ana = ctx.createGain(); ana.connect(ctx.destination);
      Promise.all(['rain.mp3'].concat(ADIMLAR).map(yukle)).then(() => {
        webAudio = true;
        yagmurKaynak = dongu('rain.mp3', AYAR.yagmur);
      }).catch(htmlBaslat);
      // olay sesleri ayri yuklenir: biri eksik olsa da digerleri calisir
      Object.keys(FX).forEach((ad) => { yukle(fxDosya(ad)).catch(() => {}); });
    } else htmlBaslat();
  }

  // Yedek: file:// ile acilinca (fetch calismaz) HTML Audio kullan
  function htmlBaslat() {
    webAudio = false;
    htmlYagmur = new Audio(YOL + 'rain.mp3'); htmlYagmur.loop = true; htmlYagmur.volume = AYAR.yagmur; htmlYagmur.play().catch(() => {});
  }

  // olay sesi cal. siddet 0..1 (uzakliga gore kisilabilir), hiz = calma hizi (1 = normal)
  function cal(ad, siddet, hiz) {
    if (!basladi || FX[ad] === undefined) return;
    const ses = Math.max(0, Math.min(1, FX[ad] * (siddet === undefined ? 1 : siddet)));
    if (ses < 0.01) return;
    const dosya = fxDosya(ad);
    if (webAudio && tampon[dosya]) {
      const k = ctx.createBufferSource(); k.buffer = tampon[dosya];
      k.playbackRate.value = (hiz || 1) * (0.97 + Math.random() * 0.06);
      const g = ctx.createGain(); g.gain.value = ses;
      k.connect(g); g.connect(ana); k.start();
    } else if (!webAudio) {
      const a = new Audio(YOL + dosya); a.volume = ses; a.play().catch(() => {});
    }
  }

  function adimCal(guc) {
    let i; do { i = Math.floor(Math.random() * ADIMLAR.length); } while (i === sonAdim && ADIMLAR.length > 1);
    sonAdim = i;
    const ses = Math.min(1, guc);
    if (webAudio) {
      const k = ctx.createBufferSource(); k.buffer = tampon[ADIMLAR[i]];
      k.playbackRate.value = 0.94 + Math.random() * 0.12;
      const g = ctx.createGain(); g.gain.value = ses;
      k.connect(g); g.connect(ana); k.start();
    } else if (basladi) {
      const a = new Audio(YOL + ADIMLAR[i]); a.volume = ses; a.play().catch(() => {});
    }
  }

  // Robot.guncelle'yi sar: adim / inis olaylarini dinle
  if (typeof Robot !== 'undefined') {
    const eski = Robot.prototype.guncelle;
    Robot.prototype.guncelle = function (dt, girdi) {
      const r = eski.call(this, dt, girdi);
      if (basladi) {
        if (this.indiOlay > 250) adimCal(AYAR.inis * Math.min(1, this.indiOlay / 600));
        else if (this.bastiOlay) adimCal(AYAR.adim * (0.55 + this.bastiOlay.guc * 0.45));
        // dik merdivende her basamakta tik
        if (this.merd) { const b = Math.floor(this.y / 22); if (this._sesBas !== undefined && b !== this._sesBas) cal('basamak', 1, 0.8); this._sesBas = b; }
        else this._sesBas = undefined;
      }
      return r;
    };
  }

  // Tarayicilar sesi ancak ilk dokunus/tustan sonra baslatir
  ['pointerdown', 'keydown', 'touchstart'].forEach((o) => window.addEventListener(o, baslat, { passive: true }));

  // Uygulama arka plana gecince sustur
  document.addEventListener('visibilitychange', () => {
    const gizli = document.hidden;
    if (ctx) { if (gizli) ctx.suspend(); else ctx.resume(); }
    if (htmlYagmur) { if (gizli) htmlYagmur.pause(); else htmlYagmur.play().catch(() => {}); }
  });

  return { AYAR: AYAR, FX: FX, baslat: baslat, cal: cal };
})();
