# MaryoWorld - oyun notlari (v0.05)

## Hikaye
Insanligin kayboldugu bir dunya. Son yapay zeka ajani, yari insansi bir robot govdesinde bir insan ariyor.
Gogusteki turuncu cekirdek "yasam sinyali"dir: bitise yaklastikca nabzi hizlanir (sol ustte % olarak da yazar).
Oyun cevre etkilesimi agirliklidir: dugmeye bas, fisi cek, tehdidi kapat.

## Kontroller
| Is | Klavye | Dokunmatik |
|---|---|---|
| Yuru | sol/sag ok, A/D | solda sol/sag |
| Zipla / merdivende yukari | Bosluk, yukari ok, W | sagda yukari ok |
| Egil / merdivende asagi | asagi ok, S | sagda asagi ok |
| Etkilesim | E (F, Enter) | el simgesi (menzildeyken parlar) |
| Tam ekran + yatay kilit | - | sag ust kose |

Telefon dik tutulursa sahne kodla 90 derece cevrilir: oyun her zaman yatay oynanir.

## Karakter (parcali iskelet)
- Parcalar: kafa, govde, 2 ust kol, 2 on kol (el dahil), 2 uyluk, 2 baldir, 2 ayak.
- Ayaklar zemine basar: her ayak bastigi noktada kalir, geride kalinca adim atar (adim 54 px).
  Diz ters kinematikle cozulur; geride kalan ayakta topuk kalkar.
- Ayak tabani, bastigi zemin parcasinin kendi egimine yatar (`Zemin.egimYerel`): yokusta egik, basamakta ve duzde tam duz.
  Merdivende adim hedefi basamagin ustune oturtulur (`Zemin.basamakOtur`): burun/topuk basamaktan tasmaz.
- Yokus: govde egime gore one/arkaya egilir, yukari cikarken yavaslar, inerken hizlanir.
- Egilme: kalca 46 px alcalir, govde one yatar, hiz yariya duser, adim kisalir. Boy 164 -> 104 px.
- Dik merdiven: altinda yukari tusu ile tutunur; ustunde asagi tusu ile (ya da kenardan yuruyunce kendiliginden) iner.
  Eller ve ayaklar basamaklara capraz sirayla basar (22 px aralik). Duvardan uzaga basili tutunca birakir.
- Etkilesim: menzile (82 px) girince tus aktif olur. Basinca robot kendisi yerine gecer, hedefe doner ve
  on kolu ters kinematikle cozulerek eli TAM hedef noktasina gider (dugme / fis), sonra geri ceker. Alcak hedeflerde egilerek uzanir.
- Olculer: yurume 215 px/sn, ziplama ~113 px yukseklik / ~160 px mesafe, tirmanma 118 px/sn.
- 215 px'ten yuksekten dusmek oldurur.

## Tehditler
| Tehdit | Nasil gecilir |
|---|---|
| Cukur | ziplanir |
| Projektor kulesi / dron isigi | beton siperin arkasinda EGILEREK saklanilir (ayakta durursa gorur). 0.42 sn acikta kalinirsa yakalanir |
| Alcak boru | egilerek altindan gecilir |
| Pres | yukaridayken altindan gecilir (inmeden once lambasi kirmizi yanip soner) |
| Ust lazer (124 px) | egilerek altindan yurunur |
| Alt lazer (16 px) | ustunden ziplanir |
| Lazer bariyeri (dikey) | gecilmez; dugmesine basilinca kapanir |
| Elektrikli su birikintisi | kapaliyken gecilir ya da ustunden ziplanir; surekli acik olanin fisi cekilir |
| Sivri demirler | ustunden ziplanir |
| Curuk kalas | durmadan gecilir (1.15 sn sonra duser, uzaklasinca yerine gelir) |
| Raya asili platform | yaklasinca ustune binilir, karsiya tasir |

Olunce son kontrol noktasina donulur. Basilan dugmeler ve cekilen fisler olunce geri gelmez (bastan baslayinca sifirlanir).

## Etkilesim noktalari
1. Fabrika girisi - dugme: lazer bariyerini kapatir (ogretici).
2. Elektrikli avlu - fis: atlanamayan genis birikintinin elektrigini keser.
3. Projektor 2, orta siperin arkasi - fis: kulenin isigini sondurur (istege bagli kolaylik).
4. Vinc yolu ustu - dugme: asagidaki son dronu yere indirir.
5. Kasa kapisi - dugme: disli kapak yuvarlanarak acilir -> bolum sonu.

## Bolum 1 (29592 px, ilk surumun ~3.25 kati)
1. Orman kenari - uyanis (giris yazilari)
2. Hafif inis, eski yol, hurda araba, titreyen lamba
3. Yokus yukari (172 px)
4. 8 basamak merdiven -> ust gecit, kirik kopru: 104 ve 124 px iki bosluk
5. 6 basamak inis, ust uste iki konteyner (62 + 60 px), uzun toprak inis
6. Alcak boru (egilme ogretilir)
7. Projektor kulesi 1: 8.4 sn'de gidip gelir, 3 siper
8. Yokus + 264 px dik merdiven (tirmanma ogretilir)
9. Cati: 150 ve 170 px iki curuk kalas, sonra dik merdivenle inis
10. Fabrika: dugme + lazer bariyeri, 2 pres, 270 px ust lazer, 2 hizli pres
11. Elektrikli avlu: 2 aralikli birikinti, alt lazer, fisi cekilecek genis birikinti
12. Tepeler: sivri demirler ve 110 / 130 px cukurlar
13. 10 basamak merdiven -> yuksek kopru, 520 px ucurumda raya asili platform, 140 px bosluk
14. Devriye dronlari: 2 dron, 4 siper
15. Projektor kulesi 2 (7.2 sn) + 2 alt lazer, 3 siper, kulenin fisi
16. Konteynerler -> dik merdiven -> vinc yolu: 116 px bosluk, 180 px curuk kalas, pres, dron dugmesi -> 386 px dik merdivenle inis
17. Son yaklasim: 250 px ust lazer, elektrik, dron (dugmeyle kapatilmadiysa tek siper var) -> yokus + 6 basamak -> kasa kapisi

27 kontrol noktasi var (her tehdit grubundan once ve sonra).

## Goruntu katmanlari (arkadan one)
Gok + ay -> uzak sehir (0.08) -> harabeler (0.22) -> agac/direk/cit (0.48) -> isik huzmeleri ->
oyun duzlemi (nesneler, zemin, tehditler, robot, pres kafalari, siperler) + karanlik maskesi ->
parlamalar (lambalar, lazerler, elektrik arklari, durum isiklari) -> yer sisi -> yagmur ->
on plan bulanik siluetler (1.55, karakterin onunden gecer) -> vinyet + gren.

## Sesler
`www/js/audio.js` + `www/assets/sounds/` (ayri modul; `Robot.guncelle`yi sarar): yagmur ambiyansi, adim ve inis sesleri.

## Fotograf ile degistirilebilen gorseller
Tum gorseller kodla cizilir. `www/assets/` icine su adlarla dosya konursa otomatik onlarin yerine gecer:
- `bg_far.jpg` : uzak arka plan (gok + sehir)
- `zemin.jpg`  : zemin kesiti dokusu (dikissiz)

## Hata ayiklama
`index.html?x=6200` o konumdan baslatir (giris atlanir), `&oto=1` kendiliginden saga yurur, `&dbg` durumu sekme basligina yazar.
Bolge baslangiclari (yaklasik x): boru 6100, projektor 6850, dik merdiven 9250, kalaslar 9950, fabrika 10750,
avlu 12750, tepeler 14250, platform 17650, dronlar 19500, projektor 2 21300, vinc yolu 23400, son 25600, kapi 29000.
