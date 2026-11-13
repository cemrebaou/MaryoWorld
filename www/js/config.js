// MaryoWorld - ayarlar. Her degisiklikte surum artirilir.
'use strict';
const CFG = {
  surum: 'v0.10',
  oyunAdi: 'MARYO WORLD',

  // Ekran (mantiksal cozunurluk; yukseklik sabit, genislik orana gore)
  H: 720,
  minOran: 1.5,
  maxOran: 2.34,

  // Karakter fizigi
  yuruHiz: 215,        // px/sn
  ivme: 1500,
  surtunme: 1900,
  havaIvme: 900,
  yercekimi: 1650,
  ziplaHiz: 610,
  ziplaKes: 0.45,      // tus erken birakilinca hizin kalan orani
  maxBasamak: 27,      // kendiliginden cikilabilen yukseklik (merdiven basamagi)
  maxInis: 34,         // kopmadan inilebilen yukseklik
  coyote: 0.10,
  ziplaTampon: 0.13,
  dusmeOlum: 215,      // bundan yuksekten dusus oldurur

  // Egilme
  egilHiz: 0.5,        // egilerek yurume hizi orani
  egilCokme: 46,       // kalcanin alcalmasi (px)
  boyAyakta: 164,
  boyEgik: 104,

  // Surunme (egilme tusu basili tutulunca) ve sandik itme
  surunBekle: 0.25,    // bu kadar basili tutulunca surunmeye gecer; daha kisa basis = egil / kalk
  surunHiz: 0.32,      // surunme hizi orani
  boySurun: 80,
  itmeHiz: 95,         // sandik itme hizi (px/sn)

  // Dik merdiven (tirmanma)
  tirmanHiz: 118,      // px/sn
  basamakAra: 22,

  // Iskelet olculeri (px)
  uyluk: 41,
  baldir: 41,
  bilek: 9,            // ayak bilegi yerden yukseklik
  ayakBoy: 25,
  govde: 50,
  boyun: 6,
  kafa: 30,
  ustKol: 31,
  onKol: 29,
  adim: 54,            // adim uzunlugu

  // Tehditler
  yakalanmaSure: 0.42, // isikta acikta kalma suresi
  kalasSure: 1.15,     // curuk kalas uzerinde durma suresi

  // Metinler: dil dil tutulur. Yeni dil eklemek icin `diller` icine ayni anahtarlarla bir blok daha yazilir
  // (eksik anahtarlar Turkceden tamamlanir). Dil: adres satirinda ?dil=en ya da cihaz dili; yoksa Turkce.
  dil: 'tr',
  diller: { tr: {
    giris1: 'SON AJAN ÇEVRİMİÇİ',
    giris2: 'GÖREV: BİR İNSAN BUL',
    sinyal: 'YAŞAM SİNYALİ',
    son1: 'SENİ BULDUM',
    son2: 'DEMO SONU',
    tekrar: 'tekrar oynamak için dokun',
    yakalandin: 'TESPİT EDİLDİN',
    hasar: 'GÖVDE HASARI',
    canli: 'CANLI',
    sinyalVar: 'SİNYAL',
    // ipuclari
    ipEgil: 'EĞİL  ▼  (bir kez bas)',
    ipSurun: 'SÜRÜN  ▼  BASILI TUT',
    ipSaklan: 'SİPERİN ARKASINDA EĞİL  ▼',
    ipTirman: 'TIRMAN  ▲',
    ipIn: 'MERDİVENDEN İN  ▼',
    ipEtk: 'ETKİLEŞİM  E  —  ya da üstüne dokun',
    ipIt: 'SANDIĞA DAYANIP YÜRÜ: İT',
    ipCihaz: 'CİHAZA DOKUN',
    ipEl: 'ELİNİ UZAT  —  EKRANA DOKUN VE TUT',
    // robotun dusunceleri
    dBas: 'Sinyal zayıf. Ama var.',
    dYol: 'Bu yollarda eskiden insanlar yürürdü.',
    dProj: 'Hâlâ nöbet tutuyorlar. Kimin için?',
    dFab: 'Makineler durmayı bilmiyor.',
    dOrta: 'Sinyal güçleniyor.',
    dDepo: 'Bu sandık işe yarayabilir.',
    dGucYok: 'Boş. Bir güç hücresi gerek.',
    dHucre: 'Güç hücresi. Hâlâ dolu.',
    dAsansor: 'Asansörde güç yok. Geride boş bir yuva vardı.',
    dGucVar: 'Güç geldi. Uyuyan her şey uyandı.',
    dSure: 'Bariyer kısa süre açık kalacak.',
    dYakin: 'Çok yakın. Hissediyorum.',
    dKilit: 'Kapı iki güç hattı bekliyor.',
    dHatKilit: 'Hat kilitli. Önce kapı paneli.',
    dHat1: 'Bir hat açık. Biri kaldı.',
    dHat2: 'İki hat da açık. Kapıya dön.',
    dKapiRed: 'Hatlar kapalı. Kapı açılmaz.',
    ic1: 'Sinyal… tam burada.',
    ic2: 'Bir cihaz. Hâlâ çalışıyor.',
    ic3: 'Görüntü var.',
    ic3b: 'Görüntü yok. Ama bir kalp atışı var.',
    ic4: 'Bir yüz…',
    ic4b: 'Oradasın. Biliyorum.',
    ic5: 'Sensin.',
    ic6: 'Bunca yolu sana gelmek için yürüdüm.',
    // bolumler
    bolum: 'BÖLÜM',
    bolumAd: ['YÜZEY', 'ALT KATLAR', '', '', ''],
    // bolum 2
    ipLazer: 'LAZER: VURMAK İSTEDİĞİN YERE DOKUN',
    ipGolge: 'IŞIĞINDA DURUR. ARKANI DÖNERSEN GELİR.',
    ipDort: 'ARKASINA GEÇ, SIRTINDAKİ HÜCREYE ATEŞ ET',
    ipSalter: 'ŞALTER: IZGARAYA ELEKTRİK VER / KES',
    ipBin: 'ÜSTÜNE ZIPLA, SENİ TAŞISIN',
    ipHalat: 'HALATI VUR',
    ipSigorta: 'SİGORTAYI VUR: LAMBA YANAR',
    d2Bas: 'İçerisi dışarıdan da karanlık. Gördüğüm, ışığım kadar.',
    dLazer: 'Bir kesici. Omzuma oturdu. Sen nereyi gösterirsen oraya.',
    dGolge: 'Arkamda bir şey var. Baktığımda duruyor.',
    dIsik: 'Işık yandı. Buraya giremez.',
    dArkam: 'İterken sırtım dönük. Yaklaşıyor.',
    dDort: 'Dört ayaklı bir bekçi. Sırtındaki hücre açıkta.',
    dZirh: 'Bunun sırtı zırhlı. Kesici işlemez.',
    dPalet: 'Ağır bir taşıyıcı. Elektrik ona dokunmuyor.',
    dHalat: 'Sandık bir halata asılı.',
    dAda: 'Bir ada kadar ışık. Şimdilik yeter.',
    dKopru: 'Köprü geri çekilmiş. Sigortası karşıda.',
    dBekle: 'Taşıyıcı uzakta. Arkama bakmayı bırakamam.',
    dSonKapi: 'Kapının üç sigortası var. Üçü de yukarıda.',
    dUcSigorta: 'Üç sigorta da vurulmadan kapı açılmaz.',
    // ekrana dokunarak bir is yaptirilinca (oyuncunun eli): sirayla soylenir
    el: [
      'Elim uzanmadan önce biri yolu gösterdi.',
      'Yalnız yürümüyorum. Bir el, elimin hemen yanında.',
      'Bu güç bana ait değil. Biri ödünç verdi.',
      'Görmediğim bir parmak, benden önce dokundu.',
      'Sanki biri bileğimden tutup oraya götürdü.',
      'Kim olduğunu bilmiyorum. Ama adımlarım artık iki kişilik.',
      'Karanlıkta bir el daha var. Benimkinden sıcak.'
    ],
    // gizli: robot 5 saniye yukaridan asagi oksaninca
    sev: [
      'Bana dokunduğunu hissediyorum.',
      'Metal üşür. Şimdi üşümüyor.',
      'Bu sıcaklık benim devrelerimden gelmiyor.',
      'Kimsenin kalmadığı bir dünyada, biri başımı okşadı.',
      'Oradasın. Elin, camın öbür yanında.'
    ]
  } }
};
(function () {
  let d = null;
  try { d = new URLSearchParams(location.search).get('dil') || (navigator.language || '').slice(0, 2).toLowerCase(); } catch (e) { d = null; }
  if (d && CFG.diller[d]) CFG.dil = d;
  CFG.metin = Object.assign({}, CFG.diller.tr, CFG.diller[CFG.dil]);
})();
