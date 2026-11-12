// MaryoWorld - sesler (ayri modul). Oyun koduna dokunmaz: Robot.guncelle'yi sarar.
// Dosyalar: assets/sounds/  rain.mp3 (ambiyans), step_1..10.mp3 (ayak basma)
'use strict';
const SES = (function () {
  const YOL = 'assets/sounds/';
  const AYAR = {
    yagmur: 0.38,     // ambiyans yagmur sesi
    adim: 0.75,       // ayak yere basinca
    inis: 1.0,        // zipladiktan sonra yere inis
  };
  const ADIMLAR = []; for (let i = 1; i <= 10; i++) ADIMLAR.push('step_' + i + '.mp3');

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
    } else htmlBaslat();
  }

  // Yedek: file:// ile acilinca (fetch calismaz) HTML Audio kullan
  function htmlBaslat() {
    webAudio = false;
    htmlYagmur = new Audio(YOL + 'rain.mp3'); htmlYagmur.loop = true; htmlYagmur.volume = AYAR.yagmur; htmlYagmur.play().catch(() => {});
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

  return { AYAR: AYAR, baslat: baslat };
})();
