// Son Sinyal - reklamlar (AdMob, sadece Android uygulamasinda calisir; tarayicida hicbir sey yapmaz)
// - Gecis reklami: her 3 olumde bir (olum sahnesinden sonra)
// - Uygulama acilis reklami: uygulama acilinca ve arka plandan geri donunce
const REKLAM = (() => {
  const AYAR = {
    gecis: 'ca-app-pub-7983529419004158/1156668871',
    acilis: 'ca-app-pub-7983529419004158/4096537889',
    olumAraligi: 3,          // kac olumde bir gecis reklami
    gecikme: 1300,           // olumden sonra reklamin gelmesi (ms), sahne gorunsun
    acilisAra: 30000         // iki acilis reklami arasi en az (ms)
  };
  const cap = window.Capacitor;
  const yerli = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const AdMob = yerli && cap.Plugins ? cap.Plugins.AdMob : null;
  let hazir = false, gecisYuklu = false, acilisYuklu = false;
  let olum = 0, reklamAcik = false, sonAcilis = 0, arkaPlan = false;

  function gecisYukle() {
    if (!hazir) return;
    AdMob.prepareInterstitial({ adId: AYAR.gecis }).then(() => { gecisYuklu = true; }).catch(() => { gecisYuklu = false; });
  }
  function acilisYukle() {
    if (!hazir) return;
    AdMob.loadAppOpen({ adId: AYAR.acilis }).then(() => { acilisYuklu = true; }).catch(() => { acilisYuklu = false; });
  }
  function acilisGoster() {
    if (!hazir || reklamAcik || !acilisYuklu) return;
    if (Date.now() - sonAcilis < AYAR.acilisAra) return;
    reklamAcik = true; acilisYuklu = false; sonAcilis = Date.now();
    AdMob.showAppOpen().catch(() => { reklamAcik = false; acilisYukle(); });
  }

  async function basla() {
    if (!AdMob) return;
    try {
      await AdMob.initialize({});
      // AB kullanicilari icin izin formu (gerekirse)
      try {
        const bilgi = await AdMob.requestConsentInfo();
        if (bilgi && bilgi.isConsentFormAvailable && bilgi.status === 'REQUIRED') await AdMob.showConsentForm();
      } catch (e) { /* izin formu yok */ }
      hazir = true;
      AdMob.addListener('interstitialAdDismissed', () => { reklamAcik = false; gecisYukle(); });
      AdMob.addListener('interstitialAdFailedToShow', () => { reklamAcik = false; gecisYukle(); });
      AdMob.addListener('appOpenAdClosed', () => { reklamAcik = false; acilisYukle(); });
      AdMob.addListener('appOpenAdFailedToShow', () => { reklamAcik = false; acilisYukle(); });
      gecisYukle();
      // ilk acilis: reklam yuklenince bir kez goster
      AdMob.loadAppOpen({ adId: AYAR.acilis }).then(() => { acilisYuklu = true; acilisGoster(); }).catch(() => {});
    } catch (e) { hazir = false; }
  }

  // arka plandan donus (reklamin kendi ekrani da sayfayi gizler; reklam acikken sayma)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (!reklamAcik) arkaPlan = true; return; }
    if (arkaPlan) { arkaPlan = false; acilisGoster(); }
  });

  return {
    // oyun her olumde cagirir
    olum() {
      if (!hazir) return;
      olum++;
      if (olum % AYAR.olumAraligi !== 0) return;
      setTimeout(() => {
        if (reklamAcik) return;
        if (!gecisYuklu) { gecisYukle(); return; }
        reklamAcik = true; gecisYuklu = false;
        AdMob.showInterstitial().catch(() => { reklamAcik = false; gecisYukle(); });
      }, AYAR.gecikme);
    },
    basla: basla
  };
})();
REKLAM.basla();
