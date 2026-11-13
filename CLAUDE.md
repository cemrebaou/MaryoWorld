# Son Sinyal (repo: MaryoWorld) - calisma kurallari

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
- Cizim kurali: duz ve parlak yuzey birakilmaz; her yeni gorselin ustunden `Sanat._eskit` (pas, toz, gren) gecilir.
  Gorseller `tuvalQ` ile yuksek cozunurlukte uretilir, `lw` / `lh` mantiksal olcusuyle basilir.
- Oyun cevre etkilesimi + bulmaca agirliklidir; robotun aradigi insan oyuncudur (bkz. OYUN.md, bitis sahnesi).
- Sesler ayri modulde: `www/js/audio.js` + `www/assets/sounds/` (yagmur ambiyansi, adim sesleri). Oyun koduna dokunmaz, `Robot.guncelle`yi sarar. Ses seviyeleri `SES.AYAR` icinde. Olay sesleri `fx_*.mp3`, seviyeleri `SES.FX`; oyun `SES.cal(ad)` ile calar (bkz. OYUN.md).

## Dosyalar
- `config.js` ayarlar + metinler, `util.js` yardimcilar, `level.js` zemin ve bolum,
  `art.js` kodla uretilen gorseller, `robot.js` parcali karakter (ayak basma, egilme, surunme, tirmanma, itme, el uzatma),
  `game.js` dongu, kamera, katmanlar, isik, hava, tehditler, bulmacalar, etkilesim, bitis sahnesi, `audio.js` sesler.
- Yeni tehdit/etkilesim eklerken: `level.js` icindeki yardimcilar (pres, lazer, elektrik, dron, kule, etki, bariyer...)
  kullanilir; kapatilabilen her tehdit `kapali` alanina bakar. Bulmaca icin: `sandik`, `plaka`, `asansor`, `uyut`,
  `etki` secenekleri (`ac`, `gerek`, `verir`, `kilit`, `onkosul`, `sure`).
- Bolumler: `level.js` icinde `kurucu()` ortak yardimcilar, `bolum1()` .. `bolum10()`, `bolumKur(no)`. Her bolumun kendi yetenegi,
  dusmani ve tekrar etmeyen bulmacalari var (bkz. OYUN.md). 3-5. bolumun oyun kodu `game.js` sonundaki `ek*` fonksiyonlarinda
  (`ekGuncelle`, `ekCiz`, `ekIsik`, `ekMaske`, `kancaGuncelle`), 6-10. bolumunki `ek2*` fonksiyonlarinda; gorselleri `art.js` `_parca` ile uretilir.
  Kol / bacak gibi uzuvlar duz cizgiyle degil `uzuv(...)` dokulu parcasiyla cizilir.
- `www/assets/` icine konan fotograflar kodla cizilenlerin yerine gecer (bkz. OYUN.md).
