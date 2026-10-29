# CALOTA — Kho tài nguyên gốc

Thư mục `source/` chứa **toàn bộ ảnh và âm thanh gốc** (ảnh từ ChatGPT, nhạc từ bạn) chưa qua xử lý.
Game không đọc trực tiếp thư mục này. Game dùng bản đã cắt và nén trong `assets/`.
Khi cần sửa hoặc thay ảnh, chỉ cần đổi file ở đây rồi chạy lại công cụ dựng (hướng dẫn ở dưới).

> Quy tắc: **mọi asset gốc mới luôn được thêm vào đây**, đúng nhóm, trước khi đưa vào game.

## Cấu trúc

| Thư mục | Nội dung | Ra file trong game |
|---|---|---|
| `00-dung-chung/calota-bay-luot` | Calota bay, lướt, thắng | `calota_fly`, `calota_dash`, `calota_win` |
| `00-dung-chung/calota-dau-roi` | Calota trúng đòn, rơi | `calota_hurt`, `calota_fall` |
| `00-dung-chung/calota-chan-dung` | Chân dung góc HUD | `calota_portrait` |
| `00-dung-chung/calota-layer-tach-roi` | Cánh, khăn, ruy băng tách lớp (dự phòng) | — |
| `00-dung-chung/chieu-phun-bot` | Phun bọt bằng miệng, luồng bọt, tóe bọt, vết bọt bám | `calota_spray`, `foam_stream`, `foam_splash`, `foam_decal` |
| `00-dung-chung/chieu-tuyet-menh` | Gồng aura + ngửa mặt phun trời | `calota_rage_charge`, `calota_rage_sky` |
| `00-dung-chung/chieu-giap-noc-doc` | N1 kích hoạt · N2 bay khoác giáp · N3 giọt/vết nọc (mở từ cửa 3) | `calota_venom_on`, `calota_venom_fly`, `venom_fx` |
| `00-dung-chung/chieu-tuyet-menh-vo-cuc` | N5 bay vòng ∞ · N6 vòng ∞ sáng · N7 ngửa cổ phun · N8 cháy nổ · N9 dịch đọng (từ cửa 3) | `calota_loop`, `infinity_ring`, `calota_vc_sky`, `toxic_explode`, `venom_decal` |
| `00-dung-chung/hieu-ung-them` | X24 hiệu ứng đạn nọc, X25 hiệu ứng bọt (dự phòng, chưa dùng) | — |
| `00-dung-chung/_can-gen-lai` | Ảnh gửi nhầm, giữ để tham khảo (SAI-N4) | — |
| `00-dung-chung/logo-vat-pham-hieu-ung` | Logo, vật phẩm (xu, khiên, sét, tim), hiệu ứng nổ/tia | `logo`, `item_*`, `hitspark`, `muzzle`… |
| `01-cua1-rung-da-dao-troi/boss-khinh-khi-cau` | Boss thùng gỗ: đứng yên + bắn, lao cụng, bị hạ, ngộp bọt | `boss_*` |
| `01-cua1-rung-da-dao-troi/quai` | Bọ lá răng nanh, kền kền ống lồng | `beetle*`, `eagle*` |
| `01-cua1-rung-da-dao-troi/nen-vat-can` | Nền xa, giữa, gần; cột đá, đá pha lê, dây gai | `assets/bg/g1_*`, `pillar_*`, `crystal_rock`, `thorn_vine` |
| `01-cua1-rung-da-dao-troi/thumbnail` | Ảnh thẻ cửa 1 | `assets/ui/g1_thumb` |
| `02-cua2-dam-lay-doc/boss-bo-la-doc` | L2a concept · L2b đứng yên + bắn · L2c phun độc · L2c2 cắn nọc · L2d đau, bị hạ · L2e ngộp bọt · L2r lao cụng | `g2_boss_*` |
| `02-cua2-dam-lay-doc/quai` | L2mg muỗi pháo · L2mh ếch độc | `g2_mosq*`, `g2_frog*` |
| `02-cua2-dam-lay-doc/dan-hieu-ung` | L2f đạn, lửa nòng · L2fx giọt độc, vũng độc, tóe, vết cắn | `g2_proj_*`, `g2_muzzle`, `g2_impact`, `g2_venom_*` |
| `02-cua2-dam-lay-doc/nen-vat-can` | L2bg nền xa · L2bm nền giữa · L2fg lớp gần · L2ob vật cản | `assets/bg/g2_*`, `g2_pillar_*`, `g2_rock`, `g2_vine` |
| `02-cua2-dam-lay-doc/thumbnail` | L2th ảnh thẻ cửa 2 | `assets/ui/g2_thumb` |
| `03-cua3-hem-nui-cat-do/boss-ken-ken-chua` | L3a concept · L3b đứng yên + bắn · L3c bổ nhào cào · L3d đau, bị hạ · L3r lao cụng | `g3_boss_*` |
| `03-cua3-hem-nui-cat-do/dan-hieu-ung` | L3f đạn gai lửa, bom thùng, lửa nòng, nổ đất | `g3_proj_big`, `g3_bomb`, `g3_muzzle`, `g3_impact` |
| `03-cua3-hem-nui-cat-do/nen-vat-can` | L3bg nền xa · L3bm nền giữa · L3fg lớp gần · L3ob vật cản | `assets/bg/g3_*`, `g3_pillar_*`, `g3_rock`, `g3_vine` |
| `03-cua3-hem-nui-cat-do/thumbnail` | L3th ảnh thẻ cửa 3 | `assets/ui/g3_thumb` |
| `03-cua3-hem-nui-cat-do/quai` | L3mg thằn lằn ống phóng · L3mh bọ cạp pháo (nền caro giả, tự tách) | `g3_lizard*`, `g3_scorpion*` |
| `03-cua3-hem-nui-cat-do/_can-gen-lai` | Ảnh gửi nhầm lần đầu (SAI-…), giữ tham khảo | — |

Thư mục `_can-gen-lai` chứa ảnh không đúng prompt. Tên bắt đầu bằng `SAI-` nên công cụ dựng bỏ qua. Khi có ảnh đúng, đặt vào nhóm tương ứng với tên bắt đầu bằng mã prompt, ví dụ `L3mg Than lan.png`.
| `90-am-thanh-goc` | Nhạc menu, đoạn bay, đánh boss, thắng; tiếng rống Tuyệt Mệnh (bản gốc 256 kbps) | `assets/audio/*.mp3` |
| `91-marketing` | Ảnh quảng bá | — |

## Đặt tên

- **Cửa 2 trở đi:** tên file **bắt đầu bằng mã prompt** rồi tới dấu cách, ví dụ `L3b Dung yen ban 4x2.jpg`.
  Mã prompt lấy từ `docs/CALOTA_PROMPTS.html`. Công cụ dựng tìm file theo mã này.
- **Dùng chung và cửa 1:** giữ **đúng tên file hiện có**. Công cụ tìm theo tên trong cả cây `source/`, nên đổi thư mục thoải mái nhưng không đổi tên.
- Muốn thay ảnh: ghi đè file cùng tên (cửa 1, dùng chung) hoặc file cùng mã (cửa 2+).

## Dựng lại asset cho game

Cần Python 3 có cài `pillow numpy scipy`. Cài bằng: `pip install pillow numpy scipy`.

```bash
# dùng chung + cửa 1 (~3 phút)
python tools/build_assets.py --source source .

# cửa 2 (~1 phút) — đổi số và thư mục cho cửa sau
python tools/build_gate.py source/02-cua2-dam-lay-doc 2 .

# cửa 3 + chiêu mới Giáp Nọc Độc, Tuyệt Mệnh Vô Cực (~2 phút)
python tools/build_gate.py source 3 .
```

Kết quả được ghi vào `assets/sprites/`, `assets/bg/`, `assets/ui/`, cùng `assets/sprites.js` và `sprites.json`.
Công cụ tự xử lý:
- tách nền xanh #00FF00, nền đen, nền caro giả;
- cắt sheet thành từng frame;
- căn thân nhân vật cho khớp giữa các frame.

## Âm thanh

File gốc để trong `90-am-thanh-goc`. Bản trong game được chỉnh cho to đều nhau và nén 128 kbps:

```bash
ffmpeg -i "source/90-am-thanh-goc/Welcome menu.mp3" -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 -b:a 128k assets/audio/music_menu.mp3
```

| File gốc | Trong game |
|---|---|
| Welcome menu.mp3 | `music_menu` |
| Đoạn bay.mp3 | `music_stage` |
| Đánh Boss.mp3 | `music_boss` |
| Thắng chờ qua cửa.mp3 | `music_win` |
| Chiêu Tuyệt mệnh.mp3 | `sfx_rage_roar` |

## Khi deploy

Thư mục `source/` khá nặng (~100 MB) và chỉ để lưu trữ.
File `.vercelignore` đã loại `source/`, `tools/`, `docs/` khỏi bản deploy, nên người chơi không phải tải về.
