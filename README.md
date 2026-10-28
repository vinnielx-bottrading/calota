# CALOTA – Phi Công Hóa Chất · v0.4.1

Game web bay ngang (side-scrolling shooter) đánh boss. Thuộc dự án **Vinh làm game**.
Calota – phi công hạt đậu có cánh – bắn tự động, **phun hóa chất ăn mòn** và hạ boss trâu.

## Chơi thử
- Mở `index.html` trực tiếp trong trình duyệt là chạy (không cần server).

## Deploy lên Vercel
**Cách 1 – qua GitHub (khuyên dùng, tự deploy mỗi lần push):**
1. Tạo repo mới trên GitHub, ví dụ `calota`.
2. Đẩy **nội dung bên trong** thư mục `calota-game` lên (để `index.html` nằm ở gốc repo):
   ```
   cd calota-game
   git init && git add . && git commit -m "Calota v0.4.1"
   git branch -M main
   git remote add origin https://github.com/<tài-khoản>/calota.git
   git push -u origin main
   ```
   (hoặc kéo-thả file trên giao diện web GitHub → *Add file → Upload files*).
3. vercel.com → **Add New… → Project** → chọn repo `calota` → **Import**.
4. Framework Preset: **Other**. Build Command và Output Directory: để trống. Root Directory: `./`. Bấm **Deploy**.
5. Đổi tên miền: Project → Settings → Domains → ví dụ `calota.vercel.app`.
6. Từ giờ mỗi lần `git push`, Vercel tự deploy; người chơi tự nhận bản mới.

**Cách 2 – Vercel CLI:** trong thư mục `calota-game` chạy `npx vercel` (lần đầu đăng nhập, chọn mặc định), rồi `npx vercel --prod`.

`vercel.json` đã cấu hình: `sw.js` và code không cache (để tự cập nhật), ảnh cache 7 ngày.
Khi phát hành bản mới: tăng `CACHE` trong `sw.js` và `C.VERSION` trong `js/core.js`.
- Đường tắt kiểm thử: `index.html?boss` (vào thẳng boss), `index.html?ult` (thanh hóa chất đầy).

## Điều khiển
| | Máy tính | Điện thoại |
|---|---|---|
| Bay | Mũi tên / WASD | Kéo ngón tay ở nửa trái màn hình |
| Bắn | Tự động | Tự động |
| **Phun hóa chất** | Giữ `Space` / `J` | Giữ nút **PHUN** |
| **Siêu phun** (thanh đầy) | `K` / `E` | Nút **SIÊU PHUN** |
| Lướt né | `Shift` / `L` | Nút **LƯỚT** |
| Tạm dừng | `P` / `Esc` | Nút ❚❚ |

## Cơ chế chính
- **Thanh hóa chất (0–100):** tự hồi 2,5/giây; +0,5 mỗi viên trúng; +6 mỗi quái hạ; +45 khi nhặt ⚡. Phun tốn 22/giây.
- **Phun thường:** tầm 520px, quái nhỏ tan chảy, **hòa tan đạn gai** của boss, đốt được **dây gai** (đạn thường vô hiệu).
- **Ăn mòn:** mỗi 0,3 giây bị xịt boss +1 tầng (tối đa 10), mỗi tầng **+8% sát thương từ mọi nguồn**. Ngừng xịt 1,2 giây thì giảm dần. Boss chuyển xanh, nhỏ giọt, bốc khói.
- **Siêu phun:** cut-in anime 0,95s (thời gian gần như dừng) → sóng xung kích quét sạch quái nhỏ → luồng khổng lồ 2,8s, Calota bất tử, sát thương ×3,5, ăn mòn tối đa rất nhanh.
- **Giáp rêu** (boss giai đoạn 2 và 3): đạn thường chỉ gây 20%, hóa chất gây 300%, Siêu phun 400%.

## Cửa 1 – Rừng Đá Đảo Trời
- Đoạn bay ~80 giây: bọ lá, đại bàng bổ nhào, cột đá treo/mọc, đá pha lê, dây gai, vật phẩm.
- **Boss: Khinh Khí Cầu Gai Rêu** – 18.000 máu (trâu):
  - GĐ1 (>66%): bắn cầu gai nhắm thẳng, loạt 3 phát.
  - GĐ2 (66–33%): giáp rêu 2.000, bắn tỏa 3, triệu hồi bọ lá.
  - GĐ3 (<33%): giáp rêu 2.600, nổi giận đỏ, bắn tỏa 5, **húc ngang** có vạch đỏ báo trước.
  - Thua khi đang đánh boss → nút **Đánh lại Boss** (không phải bay lại từ đầu).
- Thử nghiệm bằng bot ngắm hoàn hảo: hạ boss ~65 giây. Người chơi thật ước tính 1,5–2 phút.

## Cấu trúc
```
index.html            giao diện + menu
css/style.css
js/core.js            canvas, nạp ảnh, vẽ sprite, tô màu
js/input.js           bàn phím + cảm ứng
js/audio.js           âm thanh & nhạc tổng hợp (WebAudio, không cần file)
js/fx.js              hạt, rung, chữ sát thương, HỆ THỐNG PHUN HÓA CHẤT
js/entities.js        Calota, đạn, quái, vật cản, vật phẩm
js/gates/gate01.js    kịch bản Cửa 1 + boss Khinh Khí Cầu Gai Rêu
js/game.js            vòng lặp, va chạm, phun, Siêu phun
js/render.js          vẽ cảnh, HUD, cut-in
js/main.js            menu, thắng/thua, PWA, khởi động
js/donate.js          bảng Ủng hộ + tạo mã VietQR
js/lib-qrcode.js      thư viện vẽ QR (qrcode-generator, MIT)
assets/sprites/*.webp mỗi animation 1 dải ngang; thông số trong assets/sprites.js
assets/bg/            nền xa / giữa / gần của Cửa 1
assets/ui/            thumbnail cửa
icons/                icon app 192/512/maskable/apple/favicon
docs/CALOTA_PROMPTS.html  prompt tạo asset (bấm Copy)
tools/build_assets.py     cắt sprite sheet → assets (Python + Pillow + SciPy)
tools/marketing_crop.py   cắt ảnh marketing đúng kích thước
vercel.json               cấu hình cache khi deploy
sw.js, manifest.webmanifest  PWA
```

## Thêm cửa mới
1. Tạo ảnh bằng prompt trong `docs/CALOTA_PROMPTS.html`.
2. Thêm dòng cắt ảnh vào `tools/build_assets.py`, chạy:
   `python tools/build_assets.py "<thư mục ảnh gốc>" "<thư mục Điều chỉnh>" .`
3. Tạo `js/gates/gate02.js` theo mẫu `gate01.js` (`timeline()` + `makeBoss()`), thêm `<script>` vào `index.html`.

## Ủng hộ
- Bảng Ủng hộ tự hiện **1 lần khi mở game** (mỗi phiên), **sau khi thắng cửa**, và **1 lần/phiên khi thua**; luôn có nút Ủng hộ ở menu, màn thắng, màn thua.
- Chọn **50k / 100k / 200k / 1 triệu / Tùy ý** → mã VietQR (Vietcombank 0111000182684 – NGUYEN HOANG VINH) được tạo ngay trong máy với số tiền + nội dung "Ung ho Calota" điền sẵn. Không cần mạng. Đã kiểm: mã tĩnh tạo ra trùng khớp từng ký tự với QR gốc của ngân hàng.
- Đổi tài khoản/nội dung: sửa đầu file `js/donate.js`.

## Ảnh marketing
Prompt ở `docs/CALOTA_PROMPTS.html` phần F (KV 2100×800 có chữ + sạch, thumbnail 1200×900, 7 slide 1920×1080).
Cắt đúng kích thước: `python tools/marketing_crop.py <ảnh> slide|kv|thumb [ảnh ra] [--top|--bottom]`.

## Việc còn lại
- Boss bị hạ dùng sheet có dáng hơi khác bản idle – có thể gen lại cho khớp (xem prompt D7b).
- Tùy chọn: thay hiệu ứng phun vẽ bằng code bằng ảnh (prompt E1–E3), thêm logo (E4).

## PWA
Cài được như app (nút **Cài app** có hướng dẫn iPhone/Android/máy tính). Service worker network-first nên game **tự cập nhật âm thầm** khi có bản mới; khi phát hành nhớ tăng `CACHE` trong `sw.js` và `C.VERSION` trong `js/core.js`.

## Nhật ký
- **0.4.1** – Bảng Ủng hộ VietQR có chọn số tiền; vercel.json; prompt ảnh marketing + công cụ cắt ảnh.
- **0.4.0** – Dựng Cửa 1 chơi được: chiêu phun hóa chất + Siêu phun, boss 3 giai đoạn có giáp rêu, PWA, điều khiển cảm ứng.
