# CALOTA – Phi Công Hóa Chất · v0.9.1

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
| **Tuyệt Mệnh** (thanh Nộ đầy) | `Q` / `U` | Nút **TUYỆT MỆNH** (nhấp nháy khi sẵn sàng) |
| Lướt né | `Shift` / `L` | Nút **LƯỚT** |
| Tạm dừng | `P` / `Esc` | Nút ❚❚ |

## Cơ chế chính
- **Súng 3 cấp:** bắn tự động. Cấp 1: 1 tia (10 sát thương, 11 phát/giây). Nhặt 10 xu → **cấp 2** (3 tia). Nhặt thêm 18 xu → **cấp 3** (5 tia, đạn to). Trúng đòn tụt 1 cấp. Đánh lại boss giữ cấp súng lúc gặp boss.
- **Thanh hóa chất (0–100):** tự hồi 2,5/giây; +0,5 mỗi viên trúng; +6 mỗi quái hạ; +45 khi nhặt ⚡. Phun tốn 22/giây.
- **Phun thường:** Calota phồng má rồi **phun bọt hóa chất trắng bằng miệng**, tầm 520px; quái nhỏ chìm trong bọt, **nuốt chửng đạn gai** của boss, phá được **dây gai** (đạn thường vô hiệu).
- **Bọt bám lâu:** vết bọt dính lên boss/quái/cột đá 5–8 giây, chảy xệ và nhỏ giọt; giọt rơi đọng thành vũng dưới đất ~8 giây; Siêu phun văng bọt lên màn hình 3–4 giây.
- **Ngộp bọt (trước là Ăn mòn):** mỗi 0,3 giây bị xịt boss +1 tầng (tối đa 10), mỗi tầng **+8% sát thương từ mọi nguồn**. Ngừng xịt 1,2 giây thì giảm dần. Boss phủ bọt, nhỏ giọt; từ 8 tầng chuyển sang sprite boss ngộp bọt.
- **Siêu phun:** cut-in anime 0,95s (thời gian gần như dừng) → sóng xung kích quét sạch quái nhỏ → luồng khổng lồ 2,8s, Calota bất tử, sát thương ×3,5, ăn mòn tối đa rất nhanh.
- **Tuyệt Mệnh (chiêu thứ 3):** thanh **Nộ** nạp chậm theo thời gian, nạp rất nhanh khi quái/đạn vây quanh (mỗi mối nguy trong bán kính ~300px), +12 khi trúng đòn, +2 mỗi quái hạ. Đầy → Calota đứng lại gồng aura 1,1s (thế giới gần như dừng, đạn bị đẩy ra), rồi ngửa mặt phun cột bọt lên trời 3,4s: bọt đổ mưa khắp màn hình, quét sạch quái và đạn, boss mất ~5.000–6.000 máu và CHOÁNG 2,5s. Bất tử suốt chiêu.
- **Giáp rêu** (boss giai đoạn 2 và 3): đạn thường chỉ gây 20%, hóa chất gây 300%, Siêu phun 400%.

## Cửa 1 – Rừng Đá Đảo Trời
- Đoạn bay ~80 giây: bọ lá, đại bàng bổ nhào, cột đá treo/mọc, đá pha lê, dây gai, vật phẩm.
- **Boss: Khinh Khí Cầu Gai Rêu** – 30.000 máu (trâu):
  - GĐ1 (>66%): bắn cầu gai nhắm thẳng, loạt 3 phát.
  - GĐ2 (66–33%): giáp rêu 2.000, bắn tỏa 3, triệu hồi bọ lá.
  - GĐ3 (<33%): giáp rêu 2.600, nổi giận đỏ, bắn tỏa 5.
  - **Lao tới & cụng** (chiêu chung mọi boss): có vạch đỏ báo trước, dùng ở cả 3 giai đoạn, càng về sau càng dồn dập (13s → 10s → 7s); cụng vào mép trái tạo sóng chấn động.
  - Thua khi đang đánh boss → **Đánh tiếp Boss**: boss vào lại với máu = phần còn + ½ phần đã mất (còn 10% → 55%), tối đa **3 lượt**; hết lượt thì **Đánh lại Boss từ đầu** (boss đầy máu, lượt reset về 3).
  - **Tiếp tế tim:** khi boss đổi giai đoạn (66%, 33%) mà Calota còn ≤ 3 tim, boss rơi 1 tim trôi lượn sóng — phải tự bay tới nhặt (không hút từ xa).
  - Còn 1 tim → thanh Nộ nạp **gấp đôi** để lật kèo bằng Tuyệt Mệnh.
- Bot ngắm hoàn hảo hạ boss: súng cấp 1 ~78s, cấp 2 ~62s, cấp 3 ~45s. Người chơi thật khoảng 1,5–2 phút.

## Cửa 2 – Đầm Lầy Độc
- Mở khóa khi hạ boss cửa 1 (menu có thẻ chọn cửa; thêm `?all` vào link để mở hết khi thử, `?gate=2` vào thẳng cửa 2, `?gate=2&boss` vào thẳng boss).
- Đoạn bay ~105 giây, quái ×1,35: **Muỗi Pháo Độc** (bầy, 53% có bắn), **Ếch Độc Nòng Lồng** (quái nặng), gốc cây độc, đá rêu, dây độc.
- **Boss: Bọ Lá Độc Gai Chúa** – 38.000 máu, giáp lá độc 2.400/3.120:
  - Đạn độc từ nòng pháo trên lưng (1 → tỏa 3 → tỏa 5).
  - **Phun độc quét**: nòng phồng lên + quạt cảnh báo xanh → quét luồng giọt độc rơi thành vũng. Bọt hóa chất của Calota hòa tan được giọt độc.
  - **Cắn nọc** (từ GĐ2): vạch nhắm xanh → lao tới đớp vào chỗ Calota đứng, vãi giọt độc.
  - Lao tới & cụng (chiêu chung), GĐ2+ gọi bầy muỗi, GĐ3 thêm ếch.
- Quái/vật cản cửa 2 dùng chung logic cửa 1, chỉ đổi hình qua `skin` trong `gate02.js`.

## Cửa 3 – Hẻm Núi Cát Đỏ
- Mở khi hạ boss cửa 2. Đoạn bay ~130 giây, quái ×1,7 quái: **Thằn Lằn Ống Phóng** (bầy) và **Bọ Cạp Pháo** (quái nặng).
- **Boss: Kền Kền Chúa Ống Lồng** – 46.000 máu, giáp lông sắt 2.800/3.640:
  - Nòng lồng bắn đạn gai lửa (loạt 3 → tỏa 3 → tỏa 5), giật lùi mỗi phát.
  - **Ném bom thùng** (GĐ2+): bom bay vòng cung, chạm đất nổ văng mảnh.
  - **Bổ nhào cào móng**: vạch nhắm đỏ → lao xuống chỗ Calota, văng mảnh.
  - Lao tới & cụng, gọi kền kền nhỏ.
- **Chiêu mới từ cửa 3:**
  - **GIÁP NỌC ĐỘC** (`F` / nút GIÁP NỌC): tốn 35% Dịch Độc, hồi 14s, khoác 6s. Quái chạm vào thì quái mất máu (Calota không đau), giọt nọc văng ra đốt quái, đọng vũng dưới đất. Đạn và thân boss vẫn gây đau; chạm boss thì đốt boss + cộng Ngộp bọt.
  - **TUYỆT MỆNH VÔ CỰC** thay Tuyệt Mệnh thường: gồng nổi gân (thế giới chậm lại) → bay vẽ hình ∞ giữa màn hình, vệt sáng cắt quái → ngửa cổ phun dịch độc ×2,5 sát thương, cháy nổ khắp màn hình, xóa đạn → dịch bám màn hình và đọng vũng ~15s, chảy lộp độp. Boss choáng 3s.

## Tài nguyên gốc
Toàn bộ ảnh và nhạc gốc nằm trong `source/`, chia theo nhóm (dùng chung, từng cửa, âm thanh, marketing). Xem `source/HUONG_DAN_ASSETS.md`.

## Cấu trúc
```
index.html            giao diện + menu
css/style.css
js/core.js            canvas, nạp ảnh, vẽ sprite, tô màu
js/input.js           bàn phím + cảm ứng
js/audio.js           âm thanh & nhạc tổng hợp (WebAudio, không cần file)
js/fx.js              hạt, rung, chữ sát thương, HỆ THỐNG PHUN HÓA CHẤT
js/entities.js        Calota, đạn, quái, vật cản, vật phẩm
js/gates/gate01.js    kịch bản Cửa 1 + boss Khinh Khí Cầu Gai Rêu (khung boss dùng chung)
js/gates/gate02.js    Cửa 2 Đầm Lầy Độc + boss Bọ Lá Độc Gai Chúa
tools/build_gate.py   cắt ảnh cửa 2+ (thư mục CuaN, tên file bắt đầu bằng mã prompt)
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

## Quy tắc độ khó theo cửa (`js/gates/waves.js`)
| Cửa | Đoạn bay | Mật độ quái | Quái có bắn | Máu boss |
|---|---|---|---|---|
| 1 | 80s (kịch bản tay) | ×1 | 45% | 30.000 |
| 2 | 105s | ×1,35 | 53% | 38.000 |
| 3 | 130s | ×1,7 | 61% | 46.000 |
| 4 | 155s | ×2,05 | 69% | 54.000 |
| 5 | 180s | ×2,4 | 77% | 62.000 |
| 6 | 205s | ×2,75 | 85% | 70.000 |
| 7 | 230s | ×3,1 | 90% | 78.000 |
`C.makeTimeline({ n, minions, obstacles, banner })` tự sinh đợt quái theo nhịp 12s, dày dần về cuối cửa.

## Thêm cửa mới
1. Tạo ảnh bằng prompt trong `docs/CALOTA_PROMPTS.html`.
2. Đặt ảnh vào thư mục `CuaN` (tên file bắt đầu bằng mã prompt, vd. `L3b ...jpg`), thêm dòng cắt ảnh vào `tools/build_gate.py`, chạy:
   `python tools/build_gate.py CuaN N .`
3. Tạo `js/gates/gate0N.js` theo mẫu `gate02.js` (skin + `makeTimeline` + boss kế thừa `C.BossBase()`), thêm `<script>` vào `index.html` và số cửa vào vòng nạp nền trong `C.assetList`.

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
- **0.9.1** – Đủ ảnh cửa 3: thằn lằn, bọ cạp, Kền Kền Chúa ngộp bọt, Calota gồng nổi gân (gân người). Công cụ dựng tự tách nền caro giả + viền trắng sticker.
- **0.9.0** – **CỬA 3 HẺM NÚI CÁT ĐỎ** chơi được: boss Kền Kền Chúa Ống Lồng (nòng lồng, bom thùng, bổ nhào cào, lao cụng). Chiêu mới **Giáp Nọc Độc** và **Tuyệt Mệnh Vô Cực**. Vết dịch độc bám lâu. Còn chờ ảnh đúng: N4 gồng gân, L3e ngộp bọt, L3mg thằn lằn, L3mh bọ cạp.
- **0.8.3** – Boss rơi tim khi đổi giai đoạn (Calota ≤ 3 tim), Nộ ×2 khi còn 1 tim, Đánh tiếp Boss giữ ½ công đã đánh (3 lượt). Prompt N1–N9 cho chiêu cửa 3: Tiết Nọc Nhầy + Tuyệt Mệnh Vô Cực.
- **0.8.2** – Thanh HUD đổi thành DỊCH ĐỘC. Huy hiệu 16+ dời sang phải, không che logo. Thêm thư mục `source/` chứa toàn bộ ảnh + nhạc gốc chia nhóm, kèm `source/HUONG_DAN_ASSETS.md`; công cụ dựng chạy thẳng từ `source/` (`--source`).
- **0.8.1** – Nhạc thật cho menu, đoạn bay, đánh boss, màn thắng (assets/audio, chuyển bài có fade, tự bật ở lần chạm đầu tiên). Tiếng RỐNG khi tung Tuyệt Mệnh. Khẩu hiệu mới có viền sáng, huy hiệu 16+ lắc lư, cut-in đổi thành SIÊU PHUN DỊCH ĐỘC. Nền xa + thumbnail cửa 2 bằng ảnh thật.
- **0.8.0** – **CỬA 2 ĐẦM LẦY ĐỘC** chơi được: boss Bọ Lá Độc Gai Chúa (đạn độc, phun độc quét, cắn nọc, lao tới & cụng), muỗi + ếch độc, nền đầm lầy. Menu chọn cửa (mở khóa theo cửa đã qua), nút Cửa tiếp theo, kỷ lục riêng từng cửa. Sửa lỗi bọ lá cửa 1 bay sai (lọt sang kiểu đại bàng).
- **0.7.1** – Tuyệt Mệnh dùng ảnh thật (gồng aura 4 frame, ngửa mặt phun trời 3 frame). Quy tắc cửa 2+ dài hơn & đông quái hơn (waves.js). Prompt v14: nhóm "Chiêu mới" M1–M6.
- **0.7.0** – Chiêu TUYỆT MỆNH (thanh Nộ, gồng aura, phun cột bọt lên trời, mưa bọt toàn màn). Kế hoạch 7 cửa: cửa 2 Đầm Lầy Độc – boss Bọ Lá Độc Gai Chúa, cửa 3 Hẻm Núi Cát Đỏ – boss Kền Kền Chúa Ống Lồng (bản tiến hóa khổng lồ của quái cửa 1).
- **0.6.0** – Cửa 1 đủ bộ bắt buộc: boss thùng gỗ (đứng yên + bắn, lao tới & cụng), Bọ Lá Răng Nanh (~45% có bắn viên gai), Kền Kền ống lồng (dừng, kéo nòng, nã phát nặng rồi bổ nhào). build_assets tự tách nền xanh lá #00FF00 và xóa viền đỏ; ảnh quái để trong thư mục `Quai/` cạnh `Boss/`.
- **0.5.4** – Boss lao tới & cụng ở mọi giai đoạn. Prompt v11: quái hung tợn (hàm rộng răng nanh), ống pháo lồng nhiều tầng theo cửa, Kền Kền thay Đại Bàng, Bọ Lá Độc Gai cửa 2 (phun độc, cắn nọc), sheet lao & cụng cho mọi boss.
- **0.5.3** – Khung chơi tự giãn theo màn hình dài (điện thoại 20:9 không còn viền đen 2 bên), HUD né tai thỏ và nút "Vinh Làm Game", nút cảm ứng gọn hơn, boss lùi vào khi chơi cảm ứng. Prompt v9: ngôn ngữ thiết kế quái (mọi quái có ống pháo) + boss cửa 1–6.
- **0.5.2** – Súng 3 cấp (nhặt xu lên cấp, trúng đòn tụt cấp), đạn to có vệt sáng, quái bị đẩy lùi khi trúng; máu quái tăng (bọ 45, đại bàng 140, đá 260), boss 30.000. Ảnh lỗi/thiếu không còn được vẽ ra màn hình và được báo trong Console.
- **0.5.1** – Boss chốt kiểu thùng gỗ: ảnh bị hạ & ngộp bọt mới; boss có hoạt cảnh đau khi vỡ giáp/chuyển giai đoạn và CHOÁNG 1,4s sau Siêu phun. Ảnh boss nằm ở thư mục `Boss/` cạnh `Phun hóa chất/`; khi có `Boss1 Barrel Idle Attack 4x2.png` chạy lại build_assets là boss đổi dáng hoàn toàn. Prompt v8: gói hoạt cảnh G–K.
- **0.5.0** – Chiêu phun đổi thành bọt trắng phun bằng miệng (ảnh thật), vết bọt bám/đọng lâu, boss ngộp bọt, logo mới ở menu.
- **0.4.1** – Bảng Ủng hộ VietQR có chọn số tiền; vercel.json; prompt ảnh marketing + công cụ cắt ảnh.
- **0.4.0** – Dựng Cửa 1 chơi được: chiêu phun hóa chất + Siêu phun, boss 3 giai đoạn có giáp rêu, PWA, điều khiển cảm ứng.
