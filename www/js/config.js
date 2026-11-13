// Son Sinyal - ayarlar. Her degisiklikte surum artirilir.
'use strict';
const CFG = {
  surum: 'v0.16',
  oyunAdi: 'SON SİNYAL',

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
    bolumAd: ['YÜZEY', 'TESİS', 'KANALLAR', 'ÇATILAR', 'ÇEKİRDEK', 'HURDALIK', 'SERA', 'ARŞİV', 'SAAT KULESİ', 'KALP'],
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
    // ortak: uc kilitli kapilar
    dKilitBir: 'Bir kilit çözüldü.',
    dKilitHepsi: 'Kilitlerin hepsi çözüldü.',
    // bolum 3 - kanallar
    ipKanca: 'KANCA: HALKAYA DOKUN',
    ipBirak: 'ASILIYKEN  ▲ FIRLA   ▼ BIRAK  —  ya da sıradaki halkaya dokun',
    ipFare: 'FARELER YERDE KOŞAR: SANDIĞA ÇIK YA DA LAZERLE DAĞIT',
    ipBuhar: 'BUHAR KESİLİNCE GEÇ',
    ipKol: 'KOLA DOKUN: KANCA ÇEKER',
    ipZemin: 'YERE BASMA',
    ipTika: 'SANDIĞI BORUNUN ÖNÜNE İT',
    d3Bas: 'Şehrin altı. Su hâlâ akıyor; demek biri hâlâ pompalıyor.',
    dKanca: 'Bir kanca. Sen halkayı göster, ben tutunurum.',
    dFare: 'Yalnız değilim. Aşağıda bir şeyler kıpırdıyor.',
    dBuhar: 'Borular kaynıyor. Arada bir nefes alıyorlar.',
    dSal: 'Bir şamandıra. Pompası karşıdaki kola bağlı.',
    dSikis: 'Önümde buhar, arkamda dişler.',
    dDerin: 'Daha aşağı inmem gerek. Kol suyu boşaltıyor.',
    dSandikFare: 'Sandık beni yukarı çıkarır. Onlar izin verirse.',
    dZemin: 'Zemin onların. Tavan benim.',
    dVana: 'Vana buharı keser. Ama uzun sürmez.',
    dIkiSal: 'İki şamandıra, tek kol. Biri çıkarken öteki iniyor.',
    dHavuz: 'Büyük havuz. Dibini görmek istemiyorum.',
    dTika: 'Hepsi şu borudan çıkıyor. Bir şeyle kapatabilirim.',
    dTirman: 'Yukarı. Sinyal yukarıdan geliyor.',
    dSel: 'Bu ses… Su geliyor. KOŞ.',
    dSelBitti: 'Geçti. Sen olmasan yetişemezdim.',
    dPompa: 'Pompa odası. Kapı üç kol bekliyor.',
    d3Kilit: 'Üç kol da çekilmeden kapı açılmaz.',
    // bolum 4 - catilar
    ipJet: 'ZIPLA  ▲  BASILI TUT: UÇ',
    ipFan: 'FANIN ÜSTÜNE ÇIK',
    ipAri: 'HAVADAYKEN KOVALARLAR: ÖNCE VUR YA DA YERE İN',
    ipTaret: 'SİPERDE EĞİL  ▼  ya da GÖZÜNE ATEŞ ET',
    ipAyna: 'AYNAYA ATEŞ ET',
    ipHavada: 'UÇ, HAVADA HALKAYA DOKUN',
    d4Bas: 'Gökyüzü. Yağmur burada daha sert.',
    dJet: 'Bir itici. Sırtıma oturdu. Düşmek artık tek seçenek değil.',
    dYakit: 'Yakıtı kısa. Yere basınca doluyor.',
    dFan: 'Havalandırma hâlâ çalışıyor. Beni kaldırır.',
    dAri: 'Avcı dronlar. Uçanı kovalıyorlar.',
    dTaret: 'Bir nişancı. Beni gördüğü an saymaya başlıyor.',
    dAyna: 'Sigorta kafesin içinde. Ama ayna onu görüyor.',
    dYuksel: 'Her çatı bir öncekinden yüksek.',
    dMakas: 'Şalter aynayı çeviriyor. İki sigorta, tek ışın.',
    dHavada: 'Çok uzak. Ama ortada bir halka var.',
    dZirhTaret: 'Bu nişancı zırhlı. Gücünü kesmem gerek.',
    dIkiFan: 'Tek güç hattı. Aynı anda yalnızca biri dönüyor.',
    dGozetim: 'Platformu izliyor. Önce onu kör etmeliyim.',
    dAnten: 'Anten. Köprü üç kilit bekliyor.',
    // bolum 5 - cekirdek
    ipKalkan: 'EĞİL  ▼ : KALKAN. ATEŞE DOĞRU DÖN',
    ipDalga: 'DALGAYA DÖN VE EĞİL',
    ipNabiz: 'NABIZ ATARKEN KALKANDA YA DA SİPERDE OL',
    d5Bas: 'Buradayım. Her şeyin kalbi burada atıyor.',
    dKalkan: 'Bir kalkan. Ben eğilince açılıyor.',
    dDalga: 'Koridoru süpüren bir ışık. Kaçamam; karşılamam gerek.',
    dArkaDalga: 'Bu kez arkadan da geliyor.',
    dNabiz: 'Bu bir kalp atışı. Benimkinden çok daha büyük.',
    dNabizGolge: 'Eğildiğimde sırtım açıkta. Ve arkamda biri var.',
    dCapraz: 'Biri önümde, biri arkamda. Kalkanım tek yöne bakıyor.',
    dDalgaBekci: 'Zırhı lazere dayanıyor. Dalgaya dayanmaz.',
    dTasiDalga: 'Taşıyıcının üstünde de saklanacak yer yok.',
    dKuyu: 'Havadayken kalkanım yok. Atışların arasında çıkmalıyım.',
    dHendek: 'Bu dalgalar kalkanımı eritir. Hendekler var.',
    dZincir: 'İki ayna. Işın, benim gidemediğim yere gidiyor.',
    dUcurum: 'Aşağısı yok. Yalnızca karşısı var.',
    dSavunma: 'Beni içeri almak istemiyorlar. Demek doğru yerdeyim.',
    dCekirdek: 'Son kapı. Sinyal hemen arkasında.',
    d5Kilit: 'Kapı üç kilit bekliyor.',
    // bolum 6 - hurdalik
    ipMik: 'MIKNATIS: SANDIĞA DOKUN, SANA GELSİN',
    ipPlat: 'PLATFORMA DOKUN: GELİR.  ÜSTÜNDEYKEN ÇAPAYA DOKUN: GÖTÜRÜR',
    ipMayin: 'MAYINI UZAKTAN VUR',
    d6Bas: 'Makinelerin mezarlığı. Benden öncekiler burada yatıyor.',
    dMik: 'Bir mıknatıs. Sen göster, ben çekerim.',
    dPlat: 'Platform rayında bekliyor. Çağırırsam gelir.',
    dMayin: 'Mayınlar. Metale doğru süzülüyorlar. Ben de metalim.',
    dAda6: 'Sandık adada kaldı. Karşıdan çekebilirim.',
    dIkiPlat: 'İki platform, arada mayınlar.',
    dPlatTaret: 'Platformun üstünde saklanacak yer yok. Kalkanım var.',
    dTarla: 'Yerde mayın, havada arı. Aralarında bir yol olmalı.',
    dIkiPlaka: 'İki plaka, tek sandık. Sırayla.',
    dYarim: 'Platform yarıda kalıyor. Gerisi bana kalmış.',
    dHurdaTaret: 'Hurdaların arasında bir göz daha.',
    dMayinSandik: 'Sandığı aralarından çekersem hepsi birden gider.',
    dYuksekRay: 'Ray yukarıda. Uzun bir yol.',
    dHurdaKapi: 'İki bariyer, iki plaka, iki sandık.',
    // bolum 7 - sera
    ipYem: 'YEM: EĞİL  ▼  ve ETKİLEŞİM  E',
    ipSiper: 'YEMİ SİPERİN GERİSİNE BIRAK, SİPERDE EĞİL',
    ipYemTaret: 'YEMİ TARETİN GÖRDÜĞÜ YERE BIRAK',
    ipBekciPlaka: 'YEMİ PLAKAYA BIRAK',
    d7Bas: 'Burada bir şeyler hâlâ büyüyor. İnsansız da olsa.',
    dYem: 'Bir yansıtıcı. Arkamda benden bir görüntü bırakıyor.',
    dBekci: 'Bir bekçi. Geçmeme izin vermez. Ama aklı pek yok.',
    dYemDort: 'Dört ayaklılar da görüntüye koşuyor.',
    dYemTaret: 'Nişancı beni değil, görüntümü vursun.',
    dTunelBekci: 'Tünelin öbür ucunda bekliyor.',
    dBekciPlaka: 'Plakaya ağırlık gerek. Yeterince ağır biri var.',
    dAsiliBekci: 'Yukarıdayken bana uzanamıyorlar.',
    dIkiTaret: 'İki göz. İkisi de aynı yere bakmalı.',
    dKoridor: 'Üç bekçi. Tek nefeste geçmem gerek.',
    dSandikBekci: 'Sandık bekçinin ardında. Mıknatısım ondan uzun.',
    dSeraKapi: 'Kapıyı üçü birden tutuyor.',
    // bolum 8 - arsiv
    ipKus: 'KUŞ: UZAKTAKİ DÜĞMEYE DOKUN',
    ipKusPlaka: 'PLAKAYA DOKUN: KUŞ KONAR',
    ipTestere: 'TESTERENİN ÜSTÜNDEN ATLA',
    d8Bas: 'Raflar dolusu kayıt. Hepsi onların sesi.',
    dKus: 'Küçük bir yardımcı. Benim uzanamadığım yere o uzanır.',
    dKusPlaka: 'Plakada ben durursam geçemem. O dursun.',
    dTestere: 'Raylar hâlâ çalışıyor. Ne kesiyorlardı?',
    dKusSure: 'Düğme karşıda. O basar, ben koşarım.',
    dYerDegis: 'Önce o orada, ben burada. Sonra yer değişiriz.',
    dKusAsansor: 'Asansörün şalteri yukarıda kalmış.',
    dKusPres: 'O plakada durdukça presler susuyor.',
    dTunelTestere: 'Tünelin içinden testere geçiyor. Durdurmam gerek.',
    dSirayla: 'Üç bariyer. Onu her seferinde bir adım öne yollamalıyım.',
    dKusDalga: 'Dalganın düğmesi öbür uçta. Yaklaşmam yeter; gerisini o halleder.',
    dOnArka: 'Biri ileride, biri geride. Onu iki kez yollamalıyım.',
    dArsivKapi: 'Kapı üç düğme istiyor. Üçü de tavanda.',
    d8Kilit: 'Üç düğmeye de basılmadan kapı açılmaz.',
    // bolum 9 - saat kulesi
    ipAgir: 'AĞIR ÇEKİM: AYAKTAYKEN ETKİLEŞİM  E',
    ipIgne: 'YAVAŞLAT, SONRA VUR',
    d9Bas: 'Burada zaman fazla hızlı akıyor.',
    dAgir: 'Bir düzenleyici. Dünya yavaşlıyor; ben yavaşlamıyorum.',
    dHizli: 'Göremeyeceğim kadar hızlılar.',
    dAralik: 'Arada geçecek boşluk yok. Normalde yok.',
    dIgne: 'Bunlar benden hızlı.',
    dHizliDalga: 'Dalgalar art arda. Nefes aldırmıyor.',
    dHizliPlat: 'Platform yetişemeyeceğim kadar hızlı.',
    dHizliTaret: 'Bu nişancı saymıyor bile.',
    dSaatKalbi: 'Saatin kalbi. Her şey aynı anda dönüyor.',
    // bolum 10 - kalp
    ipSarj: 'AŞIRI YÜK: İSTASYONA DOKUN  —  8 SANİYE',
    d10Bas: 'Sinyalin kaynağı. Artık her atışını duyuyorum.',
    dSarj: 'Bir yük istasyonu. Taşıyabileceğimden fazlasını veriyor.',
    dIsikKopru: 'Köprü ışıktan. Ben yüklüyken var.',
    dYukGolge: 'Yüklüyken bana dokunan yanıyor.',
    dYukTasi: 'Panel yük istiyor. Yükü oraya kadar taşımalıyım.',
    dYukYok: 'Panel boş. Yüklü gelmem gerek.',
    dZincir10: 'Işıktan köprüler. Her adada yeniden dolmam gerek.',
    dNabizYuk: 'Kalp atınca yüküm siliniyor.',
    dDalgaIzgara: 'Altımda elektrik, karşımda dalga.',
    dCokus: 'Her şey içine çöküyor. KOŞ.',
    dKalpKapi: 'Son kapı. Üç panel, üçü de yük istiyor.',
    d10Kilit: 'Üç panel de yüklenmeden kapı açılmaz.',
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
