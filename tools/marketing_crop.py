"""Cắt + co ảnh marketing đúng kích thước (cắt giữa, không méo).
Chạy:  python tools/marketing_crop.py <ảnh vào> <loại> [ảnh ra]
loại: slide (1920x1080) | kv (2100x800) | thumb (1200x900) | icon (1024x1024)
Thêm --top / --bottom để lệch vùng cắt lên trên / xuống dưới."""
import sys
from PIL import Image
SIZES = {'slide': (1920, 1080), 'kv': (2100, 800), 'thumb': (1200, 900), 'icon': (1024, 1024)}
src, kind = sys.argv[1], sys.argv[2]
out = next((a for a in sys.argv[3:] if not a.startswith('--')), None) or src.rsplit('.', 1)[0] + f'_{kind}.jpg'
bias = 0.0 if '--top' in sys.argv else 1.0 if '--bottom' in sys.argv else 0.5
W, H = SIZES[kind]
im = Image.open(src).convert('RGB')
s = max(W / im.width, H / im.height)
im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
x = (im.width - W) // 2; y = int((im.height - H) * bias)
im.crop((x, y, x + W, y + H)).save(out, quality=92)
print('Đã lưu', out, W, 'x', H)
