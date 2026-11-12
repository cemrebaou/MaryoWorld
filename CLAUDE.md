# MaryoWorld - calisma kurallari

Karanlik, atmosferik 2D platform oyunu (Inside tarzi). Mobil (yatay) hedefli, PC'de de test edilir.
Oyun `www/` altinda; bagimliligi yok (saf Canvas 2D). Test: `www/index.html`.

## Kurallar
- Her degisiklikte `www/js/config.js` icindeki `surum` artirilir (v0.01 -> v0.02 ...).
- Degisiklikten sonra sadece `node --check` ile sozdizimi kontrolu yapilir; gorsel test/ekran goruntusu
  kullanici istemedikce alinmaz (hatalari kullanici bildirir).
- Repoya baska yapay zekalar da gonderiyor: gondermeden once `git pull --rebase` yapilir, cakismada iki taraf da korunur.
  Force push yapilmaz, gecmis silinmez.
- Oyun bilgileri (olculer, bolum yapisi, kurallar) `OYUN.md` icinde tutulur; degisince guncellenir.
- Dokunmatik dugmeler PC'de de gorunur kalir.
- Sesler ayri modulde: `www/js/audio.js` + `www/assets/sounds/` (yagmur ambiyansi, robot hareket dongusu, adim sesleri). Oyun koduna dokunmaz, `Robot.guncelle`yi sarar. Ses seviyeleri `SES.AYAR` icinde.

## Dosyalar
- `config.js` ayarlar + metinler, `util.js` yardimcilar, `level.js` zemin ve bolum,
  `art.js` kodla uretilen gorseller, `robot.js` parcali karakter (ayak basma, egilme, tirmanma, el uzatma),
  `game.js` dongu, kamera, katmanlar, isik, hava, tehditler, etkilesim, `audio.js` sesler.
- Yeni tehdit/etkilesim eklerken: `level.js` icindeki yardimcilar (pres, lazer, elektrik, dron, kule, etki, bariyer...)
  kullanilir; kapatilabilen her tehdit `kapali` alanina bakar.
- `www/assets/` icine konan fotograflar kodla cizilenlerin yerine gecer (bkz. OYUN.md).
