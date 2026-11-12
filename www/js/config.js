// MaryoWorld - ayarlar. Her degisiklikte surum artirilir.
'use strict';
const CFG = {
  surum: 'v0.05',
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

  // Metinler
  metin: {
    giris1: 'SON AJAN ÇEVRİMİÇİ',
    giris2: 'GÖREV: BİR İNSAN BUL',
    sinyal: 'YAŞAM SİNYALİ',
    son1: 'YAŞAM SİNYALİ BULUNDU',
    son2: 'DEMO SONU',
    tekrar: 'tekrar oynamak için dokun',
    yakalandin: 'TESPİT EDİLDİN',
    hasar: 'GÖVDE HASARI',
    ipEgil: 'EĞİL  ▼',
    ipSaklan: 'SİPERİN ARKASINDA EĞİL  ▼',
    ipTirman: 'TIRMAN  ▲',
    ipIn: 'MERDİVENDEN İN  ▼',
    ipEtk: 'ETKİLEŞİM  E'
  }
};
