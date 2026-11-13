# Uygulama ikonunu uretir: assets/icon-background.png, icon-foreground.png, icon-only.png (1024x1024)
import math, random
from PIL import Image, ImageDraw, ImageFilter
random.seed(7)
N = 1024
# arka plan: koyu mavi-siyah dikey gecis + yagmur + gren
bg = Image.new('RGB', (N, N))
px = bg.load()
for y in range(N):
    t = y / N
    c = (int(8 + 10 * t), int(12 + 16 * t), int(18 + 22 * t))
    for x in range(N):
        px[x, y] = c
d = ImageDraw.Draw(bg)
for _ in range(140):
    x = random.randint(-100, N); y = random.randint(-100, N); l = random.randint(60, 180)
    g = random.randint(28, 56)
    d.line([(x, y), (x - l * 0.22, y + l)], fill=(g, g + 8, g + 16), width=random.choice([2, 3]))
bg = bg.filter(ImageFilter.GaussianBlur(1.2))
px = bg.load()
for _ in range(90000):
    x = random.randrange(N); y = random.randrange(N); r, g, b = px[x, y]; k = random.randint(-9, 9)
    px[x, y] = (max(0, r + k), max(0, g + k), max(0, b + k))
bg.save('assets/icon-background.png')

# on plan: sinyal halkalari + robot gozu (guvenli bolge icinde)
fg = Image.new('RGBA', (N, N), (0, 0, 0, 0))
cx, cy = N // 2, int(N * 0.52)
glow = Image.new('RGBA', (N, N), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for i, r in enumerate([95, 165, 235, 305]):
    a = int(230 - i * 45)
    box = [cx - r, cy - r, cx + r, cy + r]
    gd.arc(box, 215, 325, fill=(120, 205, 255, a), width=16 - i * 2)
# govde: yuvarlak kose dikdortgen kafa
gd.rounded_rectangle([cx - 150, cy + 20, cx + 150, cy + 250], radius=60, fill=(22, 27, 33, 255), outline=(70, 82, 92, 255), width=8)
# goz
gd.ellipse([cx - 62, cy + 85, cx + 62, cy + 209], fill=(255, 150, 40, 255))
gd.ellipse([cx - 26, cy + 121, cx + 26, cy + 173], fill=(255, 235, 190, 255))
halo = glow.filter(ImageFilter.GaussianBlur(26))
fg = Image.alpha_composite(fg, halo)
fg = Image.alpha_composite(fg, glow)
fg.save('assets/icon-foreground.png')

only = bg.convert('RGBA')
only = Image.alpha_composite(only, fg)
only.convert('RGB').save('assets/icon-only.png')
print('ikon hazir')
