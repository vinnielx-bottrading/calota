"""Dựng asset cho 1 cửa (từ cửa 2 trở đi) và GỘP vào assets/sprites.js.
Ảnh đặt trong thư mục "CuaN", tên file bắt đầu bằng mã prompt (L2b, L2mg, ...).
Chạy:  python tools/build_gate.py source/02-cua2-dam-lay-doc 2 .   (tìm ảnh trong mọi thư mục con)
Tự tách nền: xanh lá #00FF00, nền đen (JPG mất trong suốt) hoặc ảnh có alpha sẵn."""
import sys, os, glob, json, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC, N, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3]
P = f'g{N}_'
SP = os.path.join(OUT, 'assets', 'sprites'); BGD = os.path.join(OUT, 'assets', 'bg'); UID = os.path.join(OUT, 'assets', 'ui')
for d in (SP, BGD, UID): os.makedirs(d, exist_ok=True)
meta = json.load(open(os.path.join(OUT, 'assets', 'sprites.json')))

def find(code):
    fs = [f for f in glob.glob(os.path.join(glob.escape(SRC), '**', '*.*'), recursive=True) if os.path.basename(f).split(' ')[0] == code]
    return fs[0] if fs else None

# ---------------- tách nền ----------------
def key_green(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)
    al = 255 * (1 - np.clip((d - 30) / 90, 0, 1))
    a[..., 1] = np.where(al < 255, np.minimum(g, np.maximum(r, b) + 10), g)
    return al

def key_black(a, big=1500):
    """nền đen: chỉ xóa vùng gần-đen nối ra mép ảnh (hoặc vùng đen lớn bị bao), giữ nét viền tối của nhân vật"""
    v = a[..., :3].max(-1)
    m = v < 26
    lab, n = ndimage.label(m)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sz = ndimage.sum(m, lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        if i in border or sz[i - 1] > big: keep[i] = True
    bg = keep[lab]
    # viền chuyển tiếp: pixel tối kề nền → bán trong suốt theo độ sáng
    edge = ndimage.binary_dilation(bg, iterations=2) & ~bg
    al = np.where(bg, 0, 255).astype(float)
    al[edge] = np.clip((v[edge] - 10) * 6, 0, 255)
    return al

def unmult_black(a):
    """hiệu ứng phát sáng trên nền đen → alpha = độ sáng (giữ quầng sáng mềm)"""
    rgb = a[..., :3]; mx = rgb.max(-1)
    al = np.clip(mx * 1.15, 0, 255)
    safe = np.maximum(al, 1)[..., None] / 255.0
    a[..., :3] = np.clip(rgb / safe, 0, 255)
    return al

def load(path, mode='auto'):
    im = Image.open(path)
    a = np.array(im.convert('RGBA')).astype(float)
    if im.mode == 'RGBA' and (a[..., 3] < 250).mean() > 0.1: return Image.fromarray(a.astype(np.uint8))
    green = ((a[..., 1] > 200) & (a[..., 0] < 70) & (a[..., 2] < 70)).mean() > 0.15
    if mode == 'glow': al = unmult_black(a)
    elif green: al = key_green(a)
    else: al = key_black(a)
    a[..., 3] = al
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')

# ---------------- cắt & căn ----------------
def splits(profile, n, lo=0.25):
    L = len(profile); cuts = [0]
    for k in range(1, n):
        c = L * k / n; w = int(L / n * lo); s, e = int(c - w), int(c + w)
        cuts.append(s + int(np.argmin(profile[s:e])))
    cuts.append(L); return cuts

def slice_sheet(im, cols, rows):
    al = np.array(im)[..., 3].astype(float)
    rc = splits(al.sum(1), rows) if rows > 1 else [0, al.shape[0]]
    out = []
    for r in range(rows):
        band = al[rc[r]:rc[r + 1]]
        cc = splits(band.sum(0), cols) if cols > 1 else [0, al.shape[1]]
        for c in range(cols): out.append(im.crop((cc[c], rc[r], cc[c + 1], rc[r + 1])))
    return out

def main_blob(im, keep_near=0):
    a = np.array(im); m = a[..., 3] > 90
    lab, n = ndimage.label(ndimage.binary_dilation(ndimage.binary_opening(m, structure=np.ones((7, 7))), iterations=3 + keep_near))
    if n > 1:
        k = int(np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)))) + 1
        a[..., 3][lab != k] = 0
    return Image.fromarray(a)

def body_anchor(im):
    al = np.array(im)[..., 3] > 128
    lab, n = ndimage.label(ndimage.binary_opening(al, structure=np.ones((5, 5))))
    if n == 0: ys, xs = np.nonzero(al); return xs.mean(), ys.mean()
    k = int(np.argmax(ndimage.sum(al, lab, range(1, n + 1)))) + 1
    ys, xs = np.nonzero(lab == k); return xs.mean(), ys.mean()

def align(frames, scale, anchor=body_anchor):
    anc = [anchor(f) for f in frames]
    L = max(a[0] for a in anc); T = max(a[1] for a in anc)
    R = max(f.width - a[0] for f, a in zip(frames, anc)); B = max(f.height - a[1] for f, a in zip(frames, anc))
    W, H = int(L + R) + 2, int(T + B) + 2
    cv = []
    for f, (ax, ay) in zip(frames, anc):
        c = Image.new('RGBA', (W, H)); c.alpha_composite(f, (int(round(L - ax)), int(round(T - ay)))); cv.append(c)
    bb = None
    for c in cv:
        b = c.getchannel('A').getbbox()
        if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    bb = (max(0, bb[0] - 4), max(0, bb[1] - 4), min(W, bb[2] + 4), min(H, bb[3] + 4))
    cv = [c.crop(bb) for c in cv]; w, h = cv[0].size; s = scale / max(w, h)
    return [c.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS) for c in cv]

def save(name, frames):
    w, h = frames[0].size; st = Image.new('RGBA', (w * len(frames), h))
    for i, f in enumerate(frames): st.alpha_composite(f, (i * w, 0))
    st.save(os.path.join(SP, P + name + '.webp'), 'WEBP', quality=88, method=6)
    meta[P + name] = {'file': f'assets/sprites/{P}{name}.webp', 'fw': w, 'fh': h, 'n': len(frames), 'ax': w / 2, 'ay': h / 2}
    print(P + name, w, h, len(frames))

def sheet(code, name, cols, rows, scale, clean=True, mode='auto', split_rows=None):
    p = find(code)
    if not p: print('THIẾU', code); return
    fr = slice_sheet(load(p, mode), cols, rows)
    if clean: fr = [main_blob(f) for f in fr]
    fr = align(fr, scale)
    if split_rows:
        save(name, fr[:cols]); save(name + split_rows, fr[cols:])
    else: save(name, fr)

def singles(code, names, cols, rows, scales, mode='auto', clean=True):
    p = find(code)
    if not p: print('THIẾU', code); return
    for f, nm, sc in zip(slice_sheet(load(p, mode), cols, rows), names, scales):
        if nm is None: continue
        if clean: f = main_blob(f)
        b = f.getchannel('A').getbbox(); f = f.crop(b)
        save(nm, align([f], sc))

# ---------------- cửa N ----------------
sheet('L2b', 'boss_idle', 4, 2, 440, split_rows='_attack') if N == 2 else None
if N == 2:
    os.replace(os.path.join(SP, P + 'boss_idle_attack.webp'), os.path.join(SP, P + 'boss_attack.webp')) if os.path.exists(os.path.join(SP, P + 'boss_idle_attack.webp')) else None
    if P + 'boss_idle_attack' in meta:
        m = meta.pop(P + 'boss_idle_attack'); m['file'] = f'assets/sprites/{P}boss_attack.webp'; meta[P + 'boss_attack'] = m
    sheet('L2r', 'boss_ram', 4, 1, 480, clean=False)
    sheet('L2c', 'boss_spray', 4, 1, 520, clean=True)
    sheet('L2c2', 'boss_bite', 4, 1, 470, clean=False)
    sheet('L2d', 'boss_defeat', 4, 1, 440, clean=False)
    sheet('L2e', 'boss_foam', 2, 1, 440, clean=False)
    sheet('L2mg', 'mosq', 4, 2, 210, split_rows='_shoot')
    sheet('L2mh', 'frog', 4, 2, 230, split_rows='_shoot')
    for a, b in ((P + 'mosq_shoot', 'mosq_shoot'), (P + 'frog_shoot', 'frog_shoot')): pass
    singles('L2ob', ['pillar_top', 'pillar_bottom', 'rock', 'vine'], 2, 2, [520, 520, 210, 280])
    singles('L2f', ['proj_big', 'proj_small', 'muzzle', 'impact'], 2, 2, [180, 160, 220, 240], mode='glow', clean=False)
    singles('L2fx', ['venom_glob', 'venom_puddle', 'venom_splash', 'venom_slash'], 2, 2, [150, 220, 240, 200], mode='glow', clean=False)
    # nền: giữa + gần; nền xa tự tạo từ lớp giữa (mờ + tối + sương độc) vì chưa có ảnh nền xa
    mid = load(find('L2bm')); mid = mid.resize((1600, round(mid.height * 1600 / mid.width)), Image.LANCZOS); mid.save(os.path.join(BGD, P + 'mid.webp'), quality=85)
    fg = load(find('L2fg')); fg = fg.resize((1600, round(fg.height * 1600 / fg.width)), Image.LANCZOS); fg.save(os.path.join(BGD, P + 'fg.webp'), quality=85)
    if find('L2bg'):  # nền xa: ảnh đục, không tách nền
        far = Image.open(find('L2bg')).convert('RGB'); far.resize((1600, round(far.height * 1600 / far.width)), Image.LANCZOS).save(os.path.join(BGD, P + 'far.webp'), quality=82)
    else:
        far = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
        sky = np.zeros((900, 1600, 4), np.uint8)
        for y in range(900):
            t = y / 900; sky[y, :, :3] = (int(28 + 40 * t), int(52 + 70 * t), int(30 + 20 * t)); sky[y, :, 3] = 255
        far = Image.fromarray(sky)
        hz = mid.copy().filter(ImageFilter.GaussianBlur(6)); hz = hz.resize((1600, int(hz.height * 0.75)))
        ha = np.array(hz).astype(float); ha[..., :3] = ha[..., :3] * 0.55 + np.array([40, 70, 40]) * 0.45
        hz = Image.fromarray(ha.clip(0, 255).astype(np.uint8)); far.alpha_composite(hz, (0, 900 - hz.height - 40))
        far.convert('RGB').save(os.path.join(BGD, P + 'far.webp'), quality=80)
    # thumbnail tạm từ concept (chờ ảnh L2th)
    th = find('L2th') or find('L2a'); t = Image.open(th).convert('RGBA') if find('L2th') else load(th); c = Image.new('RGBA', (640, 640), (34, 70, 36, 255))
    t.thumbnail((640, 640) if find('L2th') else (620, 620)); c.alpha_composite(t, ((640 - t.width) // 2, (640 - t.height) // 2)); c.convert('RGB').save(os.path.join(UID, P + 'thumb.webp'), quality=85)

json.dump(meta, open(os.path.join(OUT, 'assets', 'sprites.json'), 'w'), indent=1)
open(os.path.join(OUT, 'assets', 'sprites.js'), 'w').write('window.C=window.C||{};C.SPRITES=' + json.dumps(meta) + ';\n')
print('xong')
