# MaryoWorld - oyun notlari (v0.01)

## Hikaye
Insanligin kayboldugu bir dunya. Son yapay zeka ajani, yari insansi bir robot govdesinde bir insan ariyor.
Gogusteki turuncu cekirdek "yasam sinyali"dir: bitise yaklastikca nabzi hizlanir (sol ustte % olarak da yazar).

## Kontroller
- Klavye: sol/sag ok veya A/D yuru, Bosluk / yukari ok / W zipla (kisa basis = alcak ziplama).
- Dokunmatik: solda sol/sag, sagda zipla.

## Karakter (parcali iskelet)
- Parcalar: kafa, govde, 2 ust kol, 2 on kol (el dahil), 2 uyluk, 2 baldir, 2 ayak.
- Ayaklar zemine basar: her ayak bastigi noktada kalir, geride kalinca adim atar (adim 54 px).
  Diz ters kinematikle cozulur; ayak tabani zeminin egimine yatar; geride kalan ayakta topuk kalkar.
- Yokus: govde egime gore one/arkaya egilir, yukari cikarken yavaslar, inerken hizlanir.
- Merdiven: basamak yuksekligi 22 px (27 px'e kadar kendiliginden cikilir); ayak her basamaga ayri basar.
- Olculer: boy ~170 px, yurume 215 px/sn, ziplama ~113 px yukseklik / ~160 px mesafe.

## Bolum 1 (9092 px, yaklasik Mario 1-1'in yarisi)
1. Orman kenari - uyanis (giris yazilari)
2. Hafif inis, eski yol, hurda araba, titreyen lamba
3. Yokus yukari (172 px)
4. 8 basamak merdiven -> ust gecit
5. Kirik kopru: 104 ve 124 px iki bosluk (dusunce son kontrol noktasina doner)
6. 6 basamak inis, ust uste iki konteyner (62 + 60 px, ziplanarak cikilir)
7. Uzun toprak inis
8. Projektor bolgesi: kuledeki isik 8.4 sn'de gidip gelir; 3 beton siperin arkasinda saklanilir.
   Isikta 0.42 sn acikta kalinirsa "TESPIT EDILDIN" -> kontrol noktasi
9. Yokus + 5 basamak -> siginak kapisi (07) -> "YASAM SINYALI BULUNDU"

Kontrol noktalari: baslangic, merdiven oncesi, kopru oncesi, kopru sonrasi, projektor oncesi, projektor sonrasi.

## Goruntu katmanlari (arkadan one)
Gok + ay -> uzak sehir (0.08) -> harabeler (0.22) -> agac/direk/cit (0.48) -> isik huzmeleri ->
oyun duzlemi (nesneler, zemin, robot, siperler) + karanlik maskesi -> parlamalar -> yer sisi -> yagmur ->
on plan bulanik siluetler (1.55, karakterin onunden gecer) -> vinyet + gren.

## Fotograf ile degistirilebilen gorseller
`www/assets/` icine su adlarla konursa otomatik kullanilir:
- `bg_far.jpg` : uzak arka plan (gok + sehir)
- `zemin.jpg`  : zemin kesiti dokusu (dikissiz)
Robot parca sayfasi (yesil fon, 9 parca) geldiginde parcalar kesilip `robot.js` icindeki kod cizimlerinin yerine konacak.

## Hata ayiklama
`index.html?x=6200` o konumdan baslatir (giris atlanir), `&oto=1` kendiliginden saga yurur, `&dbg` durumu sekme basligina yazar.
