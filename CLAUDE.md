# MaryoWorld - calisma kurallari

Karanlik, atmosferik 2D platform oyunu (Inside tarzi). Mobil (yatay) hedefli, PC'de de test edilir.
Oyun `www/` altinda; bagimliligi yok (saf Canvas 2D). Test: `www/index.html`.

## Kurallar
- Her degisiklikte `www/js/config.js` icindeki `surum` artirilir (v0.01 -> v0.02 ...).
- Degisiklikten sonra sadece `node --check` ile sozdizimi kontrolu yapilir; gorsel test/ekran goruntusu
  kullanici istemedikce alinmaz (hatalari kullanici bildirir).
- Repoda sadece son 2 surum (commit) tutulur: yeni surum gonderilirken en eskisi silinir.
- Oyun bilgileri (olculer, bolum yapisi, kurallar) `OYUN.md` icinde tutulur; degisince guncellenir.
- Dokunmatik dugmeler PC'de de gorunur kalir.
- Sesler simdilik yok (kullanici sonra ekleyecek).

## Dosyalar
- `config.js` ayarlar + metinler, `util.js` yardimcilar, `level.js` zemin ve bolum,
  `art.js` kodla uretilen gorseller, `robot.js` parcali karakter + ayak basma fizigi,
  `game.js` dongu, kamera, katmanlar, isik, hava.
- `www/assets/` icine konan fotograflar kodla cizilenlerin yerine gecer (bkz. OYUN.md).
