window.C=window.C||{};
/* CALOTA — Ủng hộ: tạo mã VietQR có sẵn số tiền ngay trong máy (không cần mạng) */
(function (C) {
  const BANK_BIN = '970436', ACC = '0111000182684', NAME = 'NGUYEN HOANG VINH', BANK = 'Vietcombank';
  const NOTE = 'Ung ho Calota';
  const f = (id, v) => id + String(v.length).padStart(2, '0') + v;
  function crc16(s) {
    let c = 0xFFFF;
    for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1; c &= 0xFFFF; }
    return c.toString(16).toUpperCase().padStart(4, '0');
  }
  /** Chuỗi VietQR (chuẩn EMVCo/NAPAS). amount = 0 → mã tĩnh, người chơi tự nhập số tiền */
  C.vietqr = function (amount) {
    let s = f('00', '01') + f('01', amount ? '12' : '11') +
      f('38', f('00', 'A000000727') + f('01', f('00', BANK_BIN) + f('01', ACC)) + f('02', 'QRIBFTTA')) +
      f('53', '704') + (amount ? f('54', String(Math.round(amount))) : '') + f('58', 'VN') +
      (amount ? f('62', f('08', NOTE)) : '') + '6304';
    return s + crc16(s);
  };
  C.crc16 = crc16;

  const AMOUNTS = [50000, 100000, 200000, 1000000];
  const fmt = v => v >= 1e6 ? (v / 1e6) + ' triệu' : (v / 1000) + 'k';
  let current = 50000;
  function draw(amount) {
    current = amount;
    const qr = qrcode(0, 'M'); qr.addData(C.vietqr(amount)); qr.make();
    const cv = document.getElementById('qrCanvas'), n = qr.getModuleCount(), cell = Math.floor(240 / (n + 8)), size = cell * (n + 8);
    cv.width = cv.height = size; const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, size, size); x.fillStyle = '#0b2a12';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) x.fillRect((c + 4) * cell, (r + 4) * cell, cell, cell);
    document.getElementById('qrAmount').textContent = amount ? amount.toLocaleString('vi-VN') + ' đ' : 'Tự nhập số tiền';
    document.querySelectorAll('.amt').forEach(b => b.classList.toggle('sel', +b.dataset.v === amount));
  }
  C.donate = {
    init() {
      const box = document.getElementById('amts');
      box.innerHTML = AMOUNTS.map(v => `<button class="amt" data-v="${v}">${fmt(v)}</button>`).join('') + '<button class="amt" data-v="0">Tùy ý</button>';
      box.onclick = e => { const b = e.target.closest('.amt'); if (!b) return; if (+b.dataset.v === 0) { const v = prompt('Nhập số tiền ủng hộ (VNĐ):', '20000'); const n = parseInt(String(v || '').replace(/\D/g, ''), 10); draw(n >= 1000 ? n : 0); } else draw(+b.dataset.v); };
      document.getElementById('qrBank').textContent = `${NAME} · ${ACC} · ${BANK}`;
      document.getElementById('btnCopyAcc').onclick = () => { try { navigator.clipboard.writeText(ACC); document.getElementById('btnCopyAcc').textContent = 'Đã chép STK ✓'; } catch (e) { } };
      draw(current);
    },
    /** from: 'start' | 'end' — đổi lời mời cho hợp ngữ cảnh */
    open(from, back) {
      document.getElementById('donateMsg').textContent = from === 'end'
        ? 'Bạn vừa qua một cửa! Ủng hộ một ly cà phê để Calota sớm có cửa mới nhé ☕'
        : 'Calota là game miễn phí của Vinh làm game. Mỗi phần ủng hộ giúp làm thêm cửa mới ☕';
      document.getElementById('btnDonateClose').onclick = () => C.ui.show(back || 'menu');
      C.ui.show('donate');
    }
  };
})(window.C);
