# MaryoWorld - oyun notlari (v0.09)

## Hikaye
Insanligin kayboldugu bir dunya. Son yapay zeka ajani, yari insansi bir robot govdesinde bir insan ariyor.
Gogusteki turuncu cekirdek "yasam sinyali"dir: bitise yaklastikca nabzi hizlanir (sol ustte % olarak da yazar).
Derin anlam: robotun aradigi insan OYUNCUNUN KENDISIDIR. Robot yol boyunca kisa cumlelerle dusunur
("Sinyal gucleniyor", "Cok yakin. Hissediyorum."); sonunda kasanin icinde hala calisan bir cihaz bulur,
ekraninda oyuncuyu (on kamera) gorur ve elini ona uzatir.
Oyun cevre etkilesimi ve bulmaca agirliklidir (Inside / Tomb Raider tarzi): dugmeye bas, fisi cek, sandigi it,
guc hucresini tasi, bir seyi acip geri don.

## Kontroller
| Is | Klavye | Dokunmatik |
|---|---|---|
| Yuru | sol/sag ok, A/D | solda sol/sag |
| Zipla / merdivende yukari | Bosluk, yukari ok, W | sagda yukari ok |
| Egil (bas-cek: bir kez bas egilir, bir daha bas kalkar) | asagi ok, S | sagda asagi ok |
| Surun (cok alcak yerler) | asagi tusu BASILI tutulur | asagi ok basili |
| Merdivende asagi | asagi ok, S | asagi ok |
| Etkilesim | E (F, Enter) | el simgesi (menzildeyken parlar) ya da nesnenin USTUNE DOKUN |
| Sandik itme | sandiga dayanip yurunur | ayni |
| Tam ekran + yatay kilit | - | sag ust kose |

Telefon dik tutulursa sahne kodla 90 derece cevrilir: oyun her zaman yatay oynanir.
Ekrana dokunma: etkilesim noktasina dokununca (460 px icinde, ayni zemindeyse) robot kendisi gidip kullanir.

## Karakter (parcali iskelet)
- Parcalar: kafa, govde, 2 ust kol, 2 on kol (el dahil), 2 uyluk, 2 baldir, 2 ayak.
- Ayaklar zemine basar: her ayak bastigi noktada kalir, geride kalinca adim atar (adim 54 px).
  Diz ters kinematikle cozulur; geride kalan ayakta topuk kalkar.
- Ayak tabani, bastigi zemin parcasinin kendi egimine yatar (`Zemin.egimYerel`): yokusta egik, basamakta ve duzde tam duz.
  Merdivende adim hedefi basamagin ustune oturtulur (`Zemin.basamakOtur`).
- Egilme: kalca 46 px alcalir, govde one yatar, hiz yariya duser. Boy 164 -> 104 px.
- Surunme (dort ayak): govde yere paralel, eller ve dizler yerde capraz sirayla ilerler (eski "duvara yapisik tirmanma"
  durusunun yere yatirilmis hali). Hiz 0.32, boy 76 px. `Robot._surun`.
- Dik merdiven: robot merdivenden kol boyu uzakta durur (52 px), kollar uzanmis, eller basamaklari tutar;
  eller ve ayaklar capraz sirayla ilerler (22 px aralik). Altinda yukari tusu ile tutunur; ustunde asagi tusu ile
  (ya da kenardan yuruyunce kendiliginden) iner. Duvardan uzaga basili tutunca birakir.
- Etkilesim: menzile (82 px) girince tus aktif olur. Robot kendisi yerine gecer, hedefe doner ve on kolu ters
  kinematikle cozulerek eli TAM hedef noktasina gider (dugme / fis / salter / hucre), sonra geri ceker.
- Itme: sandiga dayaninca iki kol one uzanir, govde one yatar.
- Olculer: yurume 215 px/sn, ziplama ~113 px yukseklik / ~160 px mesafe, tirmanma 118 px/sn, itme 95 px/sn.
- 215 px'ten yuksekten dusmek oldurur.

## Tehditler
| Tehdit | Nasil gecilir |
|---|---|
| Cukur | ziplanir |
| Projektor kulesi / dron isigi | siperin arkasinda EGILEREK ya da cokmus tablanin altinda SURUNEREK saklanilir. 0.42 sn acikta kalinirsa yakalanir |
| Alcak boru (112 px) | egilerek gecilir |
| Cokmus beton tabla (86 px) | surunerek gecilir |
| Pres | yukaridayken altindan gecilir (inmeden once lambasi kirmizi yanip soner) |
| Ust lazer (124 px) | egilerek |
| Surunme lazeri (92 px) | surunerek |
| Alt lazer (16 px) | ziplanir; yanip sonenler sonukken gecilir (tunelde surunurken zamanlama) |
| Lazer bariyeri (dikey) | gecilmez; dugme / agirlik plakasi ile kapanir (sureli olani 8 sn acik kalir) |
| Elektrikli su birikintisi | kapaliyken gecilir ya da ziplanir; surekli acik olanin fisi cekilir |
| Sivri demirler | ziplanir (uyari levhali, iri) |
| Curuk kalas | durmadan gecilir (1.15 sn sonra duser) |
| Raya asili platform | binilir, karsiya tasir |

Olunce son kontrol noktasina donulur. Yapilan etkilesimler, sandik yeri ve tasinan hucre olunce korunur (bastan baslayinca sifirlanir).

## Bulmaca parcalari (level.js yardimcilari)
- `etki(tip, x, h, egil, hedef, ek)`: tip `dugme` | `kablo` | `salter` | `hucre` | `yuva`.
  `hedef` kapatilir, `ek.ac` acilir, `ek.gerek` / `ek.verir` tasinan nesne, `ek.kilit` once yapilmasi gerekenler
  (yoksa robot `ek.red` dusuncesini soyler), `ek.onkosul` (yapilmadan gorunmez), `ek.sure` (sureli), `ek.dusun`.
- `sandik` (itilir, ustune cikilir), `plaka` (ustunde robot/sandik varken hedefi kapatir), `asansor` (guc gelince inip cikar),
  `bariyer`, `uyut(tehdit)` (baslangicta kapali, sonradan acilir), `dusunce(x, ad)`.

## Bulmacalar
1. Fabrika girisi: dugme -> lazer bariyeri kapanir (ogretici).
2. Elektrikli avlu: fis cekilir -> atlanamayan birikinti soner.
3. Projektor 2: orta siperin arkasinda kulenin fisi (istege bagli).
4. Vinc yolu: USTTEKI dugme, merdivenden inince karsilasilan bariyeri acar (basmadan inilirse geri cikilir).
5. Depo: sandigi agirlik plakasina it -> bariyer acilir -> otedeki dugme bariyeri kalici acar -> geri don,
   sandigi 150 px'lik sete kadar it, ustune cikip tirman.
6. Guc hucresi: bos yuva gecilir -> ileride raftan hucre alinir -> asansorde guc yoktur -> geri donulup hucre
   yuvaya takilir -> guc gelince geri donus yolunda surunme lazeri ve pres de uyanir -> asansorle yukari.
7. Sureli bariyer: dugme 8 sn acar; arada surunulecek tabla var.
8. Kasa kapisi: panele bas ("kapi iki guc hatti bekliyor") -> GERI donup dron bolgesindeki siperin arkasindan
   1. salteri ac -> kapinin otesindeki tunelden surunup 2. salteri ac -> panele tekrar bas -> disli kapak acilir.

## Bolum 1 (oynanan kisim 42082 px; ilk surum 9092, v0.05 29592)
1. Orman kenari - uyanis
2. Hafif inis, eski yol, hurda araba
3. Yokus yukari
4. 8 basamak merdiven, kirik kopru (104 ve 124 px bosluk)
5. Inis, iki konteyner, uzun toprak inis
6. Alcak boru (egil) + cokmus tabla (surun)
7. Projektor kulesi 1, 3 siper
8. Yokus + 264 px dik merdiven
9. Cati: iki curuk kalas, dik merdivenle inis
10. Fabrika: dugme + bariyer, 2 pres, ust lazer, 2 hizli pres, surunme lazeri
11. Elektrikli avlu: 2 birikinti, alt lazer, fisli genis birikinti
12. Tepeler: sivri demirler, 110 / 130 px cukurlar
13. 10 basamak, yuksek kopru, 520 px ucurumda hareketli platform, 140 px bosluk
14. Devriye dronlari: 2 dron, 4 siper
15. Projektor kulesi 2 + 2 alt lazer + kulenin fisi
16. Konteynerler, vinc yolu (cukur, kalas, pres, dugme), 386 px inis, bariyer
17. Depo bulmacasi (sandik + plaka + dugme + set)
18. Havalandirma tunelleri: 560 ve 480 px surunme, yanip sonen alt lazerler, arada pres
19. Guc hucresi bulmacasi + 300 px asansor
20. Yuksek yol: hareketli platform, sureli bariyer, kalas, 450 px dik merdivenle inis
21. Dron koridoru: saklanacak yer yalnizca 3 cokmus tablanin alti
22. Son yaklasim: ust lazer, elektrik, dron + siper (1. salter burada)
23. Kasa kapisi, panel, surunme tuneli, 2. salter
24. Kasanin ici (ayri oda, x 42782+): bitis sahnesi

42 kontrol noktasi var.

## Bitis sahnesi (game.js `finalGuncelle`)
Kapi acilinca robot iceri yurur, ekran kararir, kasanin icindeki odaya gecilir (yagmur/sis/arka plan yok; tek tavan lambasi,
duvarda tebesirle cizilmis insan-robot el ele resmi ve gun sayan cizikler).
Fazlar: 0 kaideye yuru -> 1 oyuncu cihaza dokunur / E -> 2 robot cihazi alir (on kamera izni burada istenir) ->
3 cihazi yuzunun onunde tutar, buyuk ekranda oyuncunun goruntusu belirir, robot dusunur ("Bir yuz...", "Sensin.") ->
4 "ELINI UZAT": oyuncu ekrana dokunup tuttukca robotun bos eli parmaga uzanir (2.8 sn) -> 5 sicak beyaz isik, "SENI BULDUM".
Kamera izni verilmezse ekranda karincalanma + kalp atisi cizgisi gorunur, metinler buna gore degisir.
Kamera goruntusu yalnizca cihazda cizilir, hicbir yere gonderilmez; yeniden baslayinca kamera kapatilir.

## Goruntu
- Katmanlar (arkadan one): gok + ay -> uzak sehir (0.08) -> harabeler (0.22) -> agac/direk/cit (0.48) -> isik huzmeleri ->
  oyun duzlemi + karanlik maskesi -> parlamalar -> yer sisi -> yagmur -> on plan bulanik siluetler (1.55) -> vinyet + gren.
- Keskinlik: gorseller `tuvalQ` ile ekrandan 1.5-2 kat buyuk uretilir, mantiksal olcuyle (`lw`, `lh`) basilir.
  On plan bulanikligi gercek bulaniklik filtresiyle (yoksa kademeli kucult-buyut) yapilir; basamakli piksel gorunmez.
- Cizim kurali: DUZ ve PARLAK yuzey birakilmaz. Her yeni gorselin ustunden `Sanat._eskit` (pas, akinti, toz, gren) gecilir.

## Sesler
`www/js/audio.js` + `www/assets/sounds/` (ayri modul; `Robot.guncelle`yi sarar): yagmur ambiyansi, adim ve inis sesleri.

## Fotograf ile degistirilebilen gorseller
Tum gorseller kodla cizilir. `www/assets/` icine su adlarla dosya konursa otomatik onlarin yerine gecer:
- `bg_far.jpg` : uzak arka plan (gok + sehir)
- `zemin.jpg`  : zemin kesiti dokusu (dikissiz)

## Hata ayiklama
`index.html?x=6200` o konumdan baslatir (giris atlanir), `&oto=1` kendiliginden saga yurur, `&dbg` durumu sekme basligina yazar.
Yaklasik x: boru 6450, tabla 6920, projektor 7500, dik merdiven 9690, fabrika 11200, avlu 13600, tepeler 15100,
platform 18640, dronlar 20500, projektor 2 22340, vinc yolu 24540, depo 26740, tuneller 28500, guc hucresi 30400
(yuva 30676, hucre 32306, asansor 32800), yuksek yol 33400, dron koridoru 35570, son yaklasim 37900, kapi 40960.

## Oyuncunun eli (dokunma cumleleri) ve gizli oksama
- Bir etkilesim ekrana DOKUNARAK yaptirilirsa ve o noktanin kendi dusuncesi yoksa robot `metin.el` listesinden
  siradaki cumleyi soyler ("Yalniz yurumuyorum. Bir el, elimin hemen yaninda.").
- Gizli: robotun ustunde parmak 5 sn boyunca tekrar tekrar yukaridan asagi cekilirse (oksama) gogus isigi buyur ve
  `metin.sev` listesinden bir cumle soyler ("Bana dokundugunu hissediyorum."). 7 sn sonra yeniden yapilabilir.

## Diller
Tum metinler `config.js` icinde `CFG.diller.tr` altindadir; oyun `CFG.metin` uzerinden okur.
Yeni dil: `diller` icine ayni anahtarlarla blok eklenir (eksikler Turkceden tamamlanir). Secim: `?dil=en` ya da cihaz dili.

## Olay sesleri (fx_*.mp3)
earshot (github.com/Leonxlnx/earshot, MIT) ses bankasindan uretildi; `audio.js` icindeki `FX` tablosunda seviyeleri var.
Oyun `SES.cal(ad, siddet)` ile calar (game.js `ses()` uzakliga gore kisar).
| Ses | Ne zaman | Banka |
|---|---|---|
| pres | pres yere vurunca | impact/metal |
| dugme / salter / fis / hucre | etkilesim tamamlaninca | toggle/latch, toggle/rocker, pro_zip/down, pro_pop_in/deep |
| red | kosulu saglanmayan etkilesim | ui_pop/fall |
| bariyer / guc / kapi | bariyer kapaninca, guc gelince, kasa kapisi acilirken | downlifter/synth_fall, logo_sting/soft_bloom, pro_impact/rumble |
| alarm / hasar / dustu | yakalanma, ezilme-carpilma, dusme | glitch/burst, cut_hit/punch, sub_drop/punch |
| kalas / sandik / basamak | kalas kirilinca, sandik itilmeye baslaninca, dik merdivende her basamak | knock/wood, knock/desk, tap/knuckle |
| elektrik | yakindaki birikinti elektriklenince | pro_glitch/crunchy |
| el / sev / buldum | dokunma cumlesi, gizli oksama, bitis | hover_tick/ping, shimmer/m1, logo_sting/reverse_bloom |
