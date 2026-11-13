# CI'da `npx cap add android` sonrasi calisir: yatay ekran, tam ekran, imza, surum.
import os, re, sys

def oku(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

def yaz(p, s):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)

# 1) Yatay (sensor) + tam ekran
man = 'android/app/src/main/AndroidManifest.xml'
s = oku(man)
if 'screenOrientation' not in s:
    s = s.replace('<activity', '<activity\n            android:screenOrientation="sensorLandscape"', 1)
if 'gms.ads.APPLICATION_ID' not in s:
    s = s.replace('</application>', '    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />\n    </application>', 1)
yaz(man, s)

# AdMob uygulama kimligi
strs = 'android/app/src/main/res/values/strings.xml'
t = oku(strs)
if 'admob_app_id' not in t:
    t = t.replace('</resources>', '    <string name="admob_app_id">ca-app-pub-7983529419004158~4030244222</string>\n</resources>')
yaz(strs, t)

stl = 'android/app/src/main/res/values/styles.xml'
s = oku(stl)
tam = '<item name="android:windowFullscreen">true</item>\n        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>'
s = re.sub(r'(<style name="AppTheme\.NoActionBar"[^>]*>)', r'\1\n        ' + tam, s)
s = re.sub(r'(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)', r'\1\n        ' + tam, s)
yaz(stl, s)

# 2) Surum
kod = os.environ.get('SURUM_KODU', '1')
ad = os.environ.get('SURUM_AD', '1.0')
gr = 'android/app/build.gradle'
s = oku(gr)
s = re.sub(r'versionCode \d+', 'versionCode ' + kod, s)
s = re.sub(r'versionName "[^"]*"', 'versionName "' + ad + '"', s)

# 3) Imza (ortam degiskenlerinden)
if 'signingConfigs' not in s:
    imza = '''
    signingConfigs {
        release {
            storeFile file(System.getenv("KS_DOSYA") ?: "../son-sinyal.keystore")
            storePassword System.getenv("KS_SIFRE")
            keyAlias System.getenv("KS_TAKMA")
            keyPassword System.getenv("KS_SIFRE")
        }
    }
'''
    s = s.replace('buildTypes {', imza.strip('\n') + '\n    buildTypes {', 1)
    s = re.sub(r'(buildTypes\s*\{\s*release\s*\{)', r'\1\n            signingConfig signingConfigs.release', s, 1)
yaz(gr, s)
# 4) Play: minSdk 24 (otomatik koruma), hedef/derleme SDK 36 (en guncel)
vg = 'android/variables.gradle'
if os.path.exists(vg):
    v = oku(vg)
    v = re.sub(r'minSdkVersion\s*=\s*\d+', 'minSdkVersion = 24', v)
    v = re.sub(r'compileSdkVersion\s*=\s*\d+', 'compileSdkVersion = 36', v)
    v = re.sub(r'targetSdkVersion\s*=\s*\d+', 'targetSdkVersion = 36', v)
    yaz(vg, v)
print('ayarlandi', kod, ad)
