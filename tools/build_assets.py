"""Cắt sprite sheet thành frame, căn neo, xuất WebP vào assets/.
Chạy: python tools/build_assets.py <thư mục ảnh gốc CALOTA> <thư mục Điều chỉnh> <thư mục project>"""
import sys, os, json, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
SRC, ADJ, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
A = lambda p: os.path.join(SRC, p)
J = lambda p: os.path.join(ADJ, p)
meta = {}

def load(p):
    return Image.open(p).convert('RGBA')

def splits(profile, n, lo_frac=0.25):
    L = len(profile); cuts = [0]
    for k in range(1, n):
        c = L * k / n; w = int(L / n * lo_frac)
        s, e = int(c - w), int(c + w)
        cuts.append(s + int(np.argmin(profile[s:e])))
    cuts.append(L); return cuts

def slice_sheet(im, cols, rows):
    a = np.array(im); al = a[..., 3].astype(float)
    rc = splits(al.sum(1), rows) if rows > 1 else [0, a.shape[0]]
    out = []
    for r in range(rows):
        band = al[rc[r]:rc[r+1]]
        cc = splits(band.sum(0), cols) if cols > 1 else [0, a.shape[1]]
        for c in range(cols):
            out.append(im.crop((cc[c], rc[r], cc[c+1], rc[r+1])))
    return out

def clean_alpha(im, thr=8):
    a = np.array(im); al = a[..., 3]
    al[al < thr] = 0; al[al >= 248] = 255
    # bỏ mảnh rác nhỏ
    lab, n = ndimage.label(al > 0)
    if n > 1:
        sz = ndimage.sum(al > 0, lab, range(1, n+1)); big = sz.max()
        for i, s in enumerate(sz):
            if s < big * 0.002: al[lab == i+1] = 0
    a[..., 3] = al; return Image.fromarray(a)

def lens_anchor(im):
    a = np.array(im).astype(int); al = a[..., 3]
    m = (al > 200) & (a[..., 2] > 170) & (a[..., 0] < 110) & (a[..., 1] > 130)
    ys, xs = np.nonzero(m)
    if len(xs) < 30: return mass_anchor(im)
    return xs.mean(), ys.mean()

def mass_anchor(im):
    al = np.array(im)[..., 3].astype(float)
    ys, xs = np.nonzero(al > 128); return xs.mean(), ys.mean()

def align(frames, anchor_fn, scale):
    frames = [clean_alpha(f) for f in frames]
    anc = [anchor_fn(f) for f in frames]
    # khung chung: đặt neo tại cùng 1 điểm
    L = max(ax for ax, ay in anc); T = max(ay for ax, ay in anc)
    R = max(f.width - ax for f, (ax, ay) in zip(frames, anc)); B = max(f.height - ay for f, (ax, ay) in zip(frames, anc))
    W, H = int(L + R) + 2, int(T + B) + 2
    canv = []
    for f, (ax, ay) in zip(frames, anc):
        c = Image.new('RGBA', (W, H)); c.alpha_composite(f, (int(round(L - ax)), int(round(T - ay)))); canv.append(c)
    # cắt về union bbox
    bb = None
    for c in canv:
        b = c.getchannel('A').getbbox()
        bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    pad = 4; bb = (max(0, bb[0]-pad), max(0, bb[1]-pad), min(W, bb[2]+pad), min(H, bb[3]+pad))
    canv = [c.crop(bb) for c in canv]
    w, h = canv[0].size; s = scale / max(w, h)
    canv = [c.resize((max(1, round(w*s)), max(1, round(h*s))), Image.LANCZOS) for c in canv]
    ax, ay = (L - bb[0]) * s, (T - bb[1]) * s
    return canv, (round(ax, 1), round(ay, 1))

def save_strip(name, frames, anchor):
    """Ghép frame thành 1 dải ngang (1 file / animation) cho nhẹ request."""
    w, h = frames[0].size
    strip = Image.new('RGBA', (w * len(frames), h))
    for i, f in enumerate(frames): strip.alpha_composite(f, (i * w, 0))
    p = os.path.join(OUT, 'assets', 'sprites', name + '.webp'); os.makedirs(os.path.dirname(p), exist_ok=True)
    strip.save(p, 'WEBP', quality=90, method=6)
    meta[name] = {'file': 'assets/sprites/' + name + '.webp', 'fw': w, 'fh': h, 'n': len(frames), 'ax': anchor[0], 'ay': anchor[1]}

def sheet(name, path, cols, rows, scale, anchor=mass_anchor, pick=None):
    fr = slice_sheet(load(path), cols, rows)
    if pick: fr = [fr[i] for i in pick]
    f, an = align(fr, anchor, scale); save_strip(name, f, an)

def single(name, path, scale):
    im = clean_alpha(load(path)); im = im.crop(im.getchannel('A').getbbox())
    f, an = align([im], mass_anchor, scale); save_strip(name, f, an)

# ---- Calota
sheet('calota_fly',  A('A. Nhân vật Calota — bay (thay FLY 001–008)/Eight-Frame Flying Mascot Sprite Sheet.png'), 4, 2, 256, lens_anchor)
sheet('calota_dash', A('C. Calota — trạng thái còn thiếu/Flying Aviator Mascot Sprite Frames.png'), 2, 1, 300, lens_anchor)
sheet('calota_hurt', A('C. Calota — trạng thái còn thiếu/Dizzy Winged Mascot Sprite Frames.png'), 2, 1, 256)
sheet('calota_idle', A('C. Calota — trạng thái còn thiếu/Flying Orange Mascot Wing Cycle.png'), 4, 1, 256, lens_anchor)
single('calota_fall', A('C. Calota — trạng thái còn thiếu/Dizzy Winged Mascot Tumbling.png'), 300)
single('calota_win',  A('C. Calota — trạng thái còn thiếu/Cheerful Aviator Mascot Soaring.png'), 420)
single('calota_portrait', J('Cheerful Aviator Mascot Portrait.png'), 320)
# ---- Quái / boss
sheet('beetle', J('Leaf Beetle Flight Cycle Sprite Sheet.png'), 4, 1, 200)
sheet('eagle',  A('D. Mẫu asset mỗi cửa — thay [ … ] khi có danh sách cửa/Four-Frame Cartoon Griffin Flight Sprite Sheet.png'), 4, 1, 220)
boss = slice_sheet(load(A('D. Mẫu asset mỗi cửa — thay [ … ] khi có danh sách cửa/Spiked Mossy Airship Sprite Sheet.png')), 4, 2)
# bỏ quả cầu gai bay ra khỏi thân ở hàng tấn công: giữ thành phần lớn nhất (+ gần thân)
def main_blob(im):
    im = clean_alpha(im); a = np.array(im); lab, n = ndimage.label(ndimage.binary_dilation(ndimage.binary_opening(a[..., 3] > 90, structure=np.ones((7, 7))), iterations=3))
    if n > 1:
        sz = ndimage.sum(np.ones_like(lab), lab, range(1, n+1)); k = int(np.argmax(sz)) + 1
        a[..., 3][lab != k] = 0
    return Image.fromarray(a)
bf, ban = align([main_blob(b) for b in boss], mass_anchor, 420)
save_strip('boss_idle', bf[:4], ban); save_strip('boss_attack', bf[4:], ban)
sheet('boss_defeat', J('Steampunk Airship Defeat Sprite Sheet.png'), 4, 1, 420)
# ---- Vật cản, vật phẩm, hiệu ứng
obs = slice_sheet(load(J('Fantasy Jungle Sprite Sheet.png')), 2, 2)
for nm, im, sc in zip(['pillar_top', 'pillar_bottom', 'crystal_rock', 'thorn_vine'], obs, [520, 520, 220, 260]):
    im = main_blob(im) if nm.startswith('pillar') else clean_alpha(im); im = im.crop(im.getchannel('A').getbbox()); f, an = align([im], mass_anchor, sc); save_strip(nm, f, an)
items = slice_sheet(load(A('D. Mẫu asset mỗi cửa — thay [ … ] khi có danh sách cửa/Colorful Glossy Power-Up Icon Grid.png')), 2, 2)
for nm, im in zip(['item_coin', 'item_shield', 'item_bolt', 'item_heart'], items):
    im = clean_alpha(im); im = im.crop(im.getchannel('A').getbbox()); f, an = align([im], mass_anchor, 128); save_strip(nm, f, an)
fx = slice_sheet(load(J('Cartoon Game Effect Sprite Sheet.png')), 2, 2)
for nm, im, sc in zip(['spikeball', 'muzzle', 'explosion', 'hitspark'], fx, [128, 200, 300, 200]):
    im = clean_alpha(im); im = im.crop(im.getchannel('A').getbbox()); f, an = align([im], mass_anchor, sc); save_strip(nm, f, an)

# ---- Nền
bgdir = os.path.join(OUT, 'assets', 'bg'); os.makedirs(bgdir, exist_ok=True)
far = Image.open(A('D. Mẫu asset mỗi cửa — thay [ … ] khi có danh sách cửa/Skybound Archipelago Panorama.png')).convert('RGB')
far = far.resize((1600, round(far.height * 1600 / far.width)), Image.LANCZOS); far.save(os.path.join(bgdir, 'g1_far.webp'), quality=82)
mid = load(J('Floating Jungle Islands with Waterfalls.png')); mid = mid.resize((1600, round(mid.height * 1600 / mid.width)), Image.LANCZOS)
mid.save(os.path.join(bgdir, 'g1_mid.webp'), quality=85)
# lớp gần: ảnh RGB có ô caro giả → tách thành trong suốt
fg = np.array(Image.open(J('Transparent Jungle Canopy Frame.png')).convert('RGB')).astype(int)
neutral = (fg.max(-1) - fg.min(-1) < 14) & (fg.min(-1) > 175)
neutral = ndimage.binary_opening(neutral, iterations=1)
lab, n = ndimage.label(neutral); sz = ndimage.sum(neutral, lab, range(1, n+1))
keep = np.isin(lab, [i+1 for i, s in enumerate(sz) if s > 120])
keep = ndimage.binary_dilation(keep, iterations=2)
alpha = np.where(keep, 0, 255).astype(np.uint8)
alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2)))
fgim = Image.fromarray(np.dstack([fg.astype(np.uint8), alpha]), 'RGBA')
fgim = fgim.resize((1600, round(fgim.height * 1600 / fgim.width)), Image.LANCZOS); fgim.save(os.path.join(bgdir, 'g1_fg.webp'), quality=85)
# icon & thumbnail
th = Image.open(A('D. Mẫu asset mỗi cửa — thay [ … ] khi có danh sách cửa/Whimsical Sky-Island Adventure.png')).convert('RGB')
th.resize((640, 640), Image.LANCZOS).save(os.path.join(OUT, 'assets', 'ui', 'g1_thumb.webp') if os.makedirs(os.path.join(OUT, 'assets', 'ui'), exist_ok=True) is None else '', quality=85)
json.dump(meta, open(os.path.join(OUT, 'assets', 'sprites.json'), 'w'), indent=1)
print(json.dumps({k: (v['fw'], v['fh'], v['n']) for k, v in meta.items()}))
# file JS để chạy được cả khi mở index.html trực tiếp (file://)
open(os.path.join(OUT, 'assets', 'sprites.js'), 'w').write('window.C=window.C||{};C.SPRITES=' + json.dumps(meta) + ';\n')
