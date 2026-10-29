/* CALOTA — vẽ cảnh, HUD, cut-in Siêu phun */
(function (C) {
  const g = C.game, E = C.E;

  /** lát nền lặp ngang kiểu soi gương → luôn liền mép */
  function tile(ctx, im, off, y, w, h, sy, sh) {
    if (!im || !im.complete || !im.naturalWidth) return;
    sy = sy || 0; sh = sh || im.naturalHeight;
    let x = -(off % (w * 2)); if (x > 0) x -= w * 2;
    let k = 0;
    for (; x < C.W; x += w, k++) {
      if (k % 2 === 0) ctx.drawImage(im, 0, sy, im.naturalWidth, sh, Math.floor(x), y, w + 1, h);
      else { ctx.save(); ctx.translate(Math.floor(x) + w, y); ctx.scale(-1, 1); ctx.drawImage(im, 0, sy, im.naturalWidth, sh, 0, 0, w + 1, h); ctx.restore(); }
    }
  }

  C.drawBackground = function (ctx, t) {
    const b = (g.gate || C.GATES[0]).bg;
    const sky = ctx.createLinearGradient(0, 0, 0, C.H); sky.addColorStop(0, b.sky[0]); sky.addColorStop(1, b.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, C.W, C.H);
    tile(ctx, C.img[b.far], t * b.farSpeed, 0, 1280, 720);
    tile(ctx, C.img[b.mid], t * b.midSpeed, 90, 1280, 720);
  };
  C.drawForeground = function (ctx, t) {
    const b = (g.gate || C.GATES[0]).bg, im = C.img[b.fg]; if (!im || !im.naturalWidth) return;
    const ih = im.naturalHeight;
    ctx.globalAlpha = 0.95;
    tile(ctx, im, t * b.fgSpeed, -70, 1280, 300, 0, ih * 0.42);           // tán lá phía trên
    tile(ctx, im, t * b.fgSpeed * 1.1, C.H - 175, 1280, 260, ih * 0.62, ih * 0.38); // bụi đá phía dưới
    ctx.globalAlpha = 1;
  };

  C.render = function () {
    const ctx = C.ctx, cam = C.cam;
    ctx.setTransform(C.pxScale, 0, 0, C.pxScale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (g.state === 'loading') { ctx.fillStyle = '#123'; ctx.fillRect(0, 0, C.W, C.H); return; }
    const t = g.state === 'menu' ? performance.now() / 1000 : g.bgX;
    // rung
    let sx = 0, sy = 0;
    if (cam.shake > 0.3) { sx = C.rand(-cam.shake, cam.shake); sy = C.rand(-cam.shake, cam.shake); }
    cam.shake *= 0.86;
    ctx.save(); ctx.translate(sx, sy);
    C.drawBackground(ctx, t);

    if (g.state === 'menu') {
      const tt = performance.now() / 1000;
      C.spr(ctx, 'calota_fly', Math.floor(tt * 14), 330 + Math.sin(tt * 0.7) * 30, 400 + Math.sin(tt * 1.8) * 18, 300);
      C.drawForeground(ctx, t); ctx.restore(); return;
    }
    // vật thể
    for (const e of g.enemies) if (e.static) E.drawEnemy(ctx, e);
    C.drawParticles(ctx, 0);
    E.drawItems(ctx, g);
    for (const e of g.enemies) if (!e.static) E.drawEnemy(ctx, e);
    for (const B of C.bossList(g)) { const sk = C.skin; if (B.skin) C.skin = B.skin; B.draw(ctx); C.skin = sk; }
    C.Decals.draw(ctx);
    C.drawParticles(ctx, 1);
    E.drawBullets(ctx, g);
    C.Chem.drawJet(ctx);
    C.Rage.drawOverlay(ctx, g); C.Rage.drawBehind(ctx, g);
    E.drawPlayer(ctx, g);
    C.drawParticles(ctx, 2);
    C.drawForeground(ctx, t);
    C.Decals.drawScreen(ctx);
    C.drawParticles(ctx, 3);
    ctx.restore();

    // phủ màu khi phun
    if (C.Chem.active) {
      const k = C.Chem.power * (g.ultActive ? 0.45 : 0.16);
      const v = ctx.createRadialGradient(C.W / 2, C.H / 2, C.H * 0.35, C.W / 2, C.H / 2, C.H * 0.95);
      v.addColorStop(0, 'rgba(200,230,255,0)'); v.addColorStop(1, `rgba(190,225,255,${k})`);
      ctx.fillStyle = v; ctx.fillRect(0, 0, C.W, C.H);
    }
    if (g.player && g.player.hp === 1 && !g.player.dead) {
      const v = ctx.createRadialGradient(C.W / 2, C.H / 2, C.H * 0.4, C.W / 2, C.H / 2, C.H);
      v.addColorStop(0, 'rgba(255,0,0,0)'); v.addColorStop(1, `rgba(220,0,0,${0.18 + 0.1 * Math.sin(performance.now() / 150)})`);
      ctx.fillStyle = v; ctx.fillRect(0, 0, C.W, C.H);
    }
    drawHUD(ctx);
    if (g.cutin > 0) drawCutin(ctx);
    drawBanners(ctx);
    if (cam.flash > 0.01) { ctx.globalAlpha = Math.min(1, cam.flash); ctx.fillStyle = cam.flashColor; ctx.fillRect(0, 0, C.W, C.H); ctx.globalAlpha = 1; cam.flash *= 0.88; }
  };

  // ------------------------------- HUD -------------------------------
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function txt(ctx, s, x, y, size, color, align, stroke) {
    ctx.font = `900 ${size}px "Baloo 2", system-ui, sans-serif`; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size * 0.2); ctx.strokeStyle = stroke || 'rgba(10,30,20,0.85)'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  // HUD GỌN: cụm trái (chân dung + tim + 3 thanh mảnh), góc phải (điểm, xu), giữa trên (máu boss)
  function bar(ctx, x, y, w, h, k, c0, c1, ready, now) {
    rr(ctx, x - 2, y - 2, w + 4, h + 4, (h + 4) / 2); ctx.fillStyle = 'rgba(20,10,4,0.72)'; ctx.fill();
    if (k > 0) { const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, c0); gr.addColorStop(1, c1); rr(ctx, x, y, Math.max(h, w * Math.min(1, k)), h, h / 2); ctx.fillStyle = gr; ctx.fill(); }
    if (ready) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.3 * Math.sin(now * 9); rr(ctx, x - 3, y - 3, w + 6, h + 6, (h + 6) / 2); ctx.strokeStyle = c1; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
  }
  function keyTag(ctx, x, y, label, color) { // ô phím nhỏ cạnh thanh khi sẵn sàng (máy tính)
    ctx.font = '800 11px "Baloo 2", system-ui, sans-serif'; const w = ctx.measureText(label).width + 10;
    rr(ctx, x, y - 8, w, 16, 5); ctx.fillStyle = color; ctx.fill(); ctx.fillStyle = '#2a1608'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + 5, y + 1);
  }
  function drawHUD(ctx) {
    const p = g.player, now = performance.now() / 1000, touch = C.input.usingTouch;
    // né tai thỏ và nút "Vinh Làm Game" (nếu có phủ góc trên-trái)
    if (!C._hubT || now - C._hubT > 2) {
      C._hubT = now; const r = C.cv.getBoundingClientRect(); let hub = false;
      try {
        for (const [px, py] of [[24, 20], [60, 28], [120, 28], [40, 50]]) {
          const el = document.elementFromPoint(r.left + px, r.top + py);
          if (el && el !== C.cv && el !== document.body && el !== document.documentElement && !el.closest('#touchUI') && !el.closest('.panel') && el.id !== 'safeProbe') { hub = true; break; }
        }
      } catch (e) { }
      C._hubY = hub ? 58 : 0;
    }
    const hx = (C.safe ? C.safe.l : 0) + 8, hy = (C._hubY || 0) + 6;
    const hs = C.view.s < 0.75 ? 1.35 : 1; // màn nhỏ (điện thoại) phóng HUD lên cho dễ đọc
    ctx.save(); ctx.translate(hx, hy); ctx.scale(hs, hs);
    // chân dung nhỏ + huy hiệu cấp súng
    const R0 = 27, cx = 30, cy = 32;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R0, 0, 7); ctx.fillStyle = '#ffd36b'; ctx.fill(); ctx.clip();
    C.spr(ctx, 'calota_portrait', 0, cx + 1, cy + 5, 64); ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = '#3b1f0e'; ctx.beginPath(); ctx.arc(cx, cy, R0, 0, 7); ctx.stroke();
    const gl = g.gunLv || 1;
    ctx.beginPath(); ctx.arc(cx + 21, cy + 21, 10, 0, 7); ctx.fillStyle = gl === 3 ? '#ff8a1e' : '#ffd34d'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    txt(ctx, String(gl), cx + 21, cy + 22, 13, '#2a1608', 'center', null);
    if (gl < 3) { const need = gl === 1 ? 10 : 18, k2 = Math.min(1, (g.gunXP || 0) / need); ctx.lineWidth = 3; ctx.strokeStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(cx, cy, R0 + 4, -Math.PI / 2, -Math.PI / 2 + k2 * 6.283); ctx.stroke(); }
    // tim (nhỏ) + khiên
    const x0 = 66;
    for (let i = 0; i < p.maxHp; i++) { ctx.globalAlpha = i < p.hp ? 1 : 0.22; C.spr(ctx, 'item_heart', 0, x0 + 9 + i * 20, 12, 19); }
    ctx.globalAlpha = 1;
    if (p.shield) C.spr(ctx, 'item_shield', 0, x0 + 9 + p.maxHp * 20 + 4, 12, 21);
    // 3 thanh mảnh: dịch độc · nộ · giáp nọc
    const bw = 150, BH = 7;
    const full = g.gauge >= 100 && !g.ultActive;
    bar(ctx, x0, 28, bw, BH + 2, g.gauge / 100, '#3aa0e8', '#ffffff', full, now);
    if (full) touch ? txt(ctx, 'SIÊU PHUN!', x0 + bw + 8, 33, 12, '#dff3ff', 'left') : keyTag(ctx, x0 + bw + 8, 33, 'K', '#dff3ff');
    const rk = (g.rage || 0) / 100, rfull = rk >= 1 && !g.rageActive;
    bar(ctx, x0, 43, bw, BH, rk, '#ff5a2a', '#ffe066', rfull, now);
    if (rfull) {
      if (g.gate && g.gate.allSkills) { if (touch) txt(ctx, 'TUYỆT CHIÊU!', x0 + bw + 8, 47, 12, '#ffe066', 'left'); else { keyTag(ctx, x0 + bw + 8, 47, 'Q', '#ffe066'); keyTag(ctx, x0 + bw + 30, 47, 'R', '#c9a6ff'); } }
      else touch ? txt(ctx, 'TUYỆT MỆNH!', x0 + bw + 8, 47, 12, '#ffe066', 'left') : keyTag(ctx, x0 + bw + 8, 47, 'Q', '#ffe066');
    }
    if (C.Venom.unlocked(g)) {
      const V = C.Venom, on = g.venomT > 0, ready = V.ready(g);
      bar(ctx, x0, 56, bw * 0.7, 5, on ? g.venomT / (V.DUR + V.ON) : 1 - (g.venomCD || 0) / V.CD, on ? '#d8ff7a' : '#4f9a1a', '#b6f23a', ready, now);
      if (ready && !touch) keyTag(ctx, x0 + bw * 0.7 + 8, 59, 'F', '#b6f23a');
      else if (g.venomCD > 0 && !on) txt(ctx, Math.ceil(g.venomCD) + 's', x0 + bw * 0.7 + 8, 60, 11, '#9bb58a', 'left', null);
    }
    if (g.stEcho > 0) txt(ctx, 'SONG TRÙNG ' + Math.ceil(g.stEcho) + 's', x0, 76, 12, '#c9a6ff', 'left');
    else if (rfull && (g.threat || 0) >= 3) txt(ctx, 'BỊ BAO VÂY!', x0, 76, 13, '#ff6b4a', 'left');
    ctx.restore();
    // điểm & xu (gọn, góc phải)
    const rx = C.W - 22 - (C.safe ? C.safe.r : 0);
    ctx.save(); ctx.translate(rx, 0); ctx.scale(hs, hs);
    txt(ctx, g.score.toLocaleString('vi-VN'), 0, 22, 20, '#fff', 'right');
    C.spr(ctx, 'item_coin', 0, -52, 44, 18); txt(ctx, '× ' + g.coins, -40, 45, 14, '#ffe066', 'left');
    ctx.restore();
    // tiến trình cửa hoặc máu boss
    const BL = C.bossList(g).filter(B => B.state !== 'dying' || B.t < 2);
    if (!BL.length) {
      if (g.gate.allSkills) return;
      const pw = 260, px = C.W / 2 - pw / 2, py = 14, pk = C.clamp(g.t / g.gate.stageTime, 0, 1);
      rr(ctx, px, py, pw, 6, 3); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      rr(ctx, px, py, Math.max(6, pw * pk), 6, 3); ctx.fillStyle = '#ffd34d'; ctx.fill();
      C.spr(ctx, 'calota_portrait', 0, px + pw * pk, py + 3, 22);
      C.spr(ctx, 'boss_idle', 0, px + pw + 18, py + 2, 34);
      return;
    }
    const n = BL.length, bw2 = n > 1 ? 280 : 420, gap = 24, tot = n * bw2 + (n - 1) * gap;
    BL.forEach((B, i) => {
      const bx2 = C.W / 2 - tot / 2 + i * (bw2 + gap), by2 = 22;
      const name = n > 1 ? (g.gate.bossName.split(' + ')[C.bossList(g).indexOf(B)] || '') : g.gate.bossName;
      txt(ctx, name, bx2 + bw2 / 2, by2 - 9, 13, '#fff', 'center');
      rr(ctx, bx2 - 2, by2 - 2, bw2 + 4, 14, 7); ctx.fillStyle = 'rgba(20,10,4,0.8)'; ctx.fill();
      const hk = Math.max(0, B.hp / B.maxHp);
      B.shownHp = B.shownHp == null ? hk : C.lerp(B.shownHp, hk, 0.06);
      rr(ctx, bx2, by2, Math.max(10, bw2 * B.shownHp), 10, 5); ctx.fillStyle = '#ffe1a8'; ctx.fill();
      const hg = ctx.createLinearGradient(0, by2, 0, by2 + 10); hg.addColorStop(0, '#ff6b4a'); hg.addColorStop(1, '#c4231a');
      if (hk > 0) { rr(ctx, bx2, by2, Math.max(10, bw2 * hk), 10, 5); ctx.fillStyle = hg; ctx.fill(); }
      [0.66, 0.33].forEach(m => { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx2 + bw2 * m - 1, by2, 2, 10); });
      if (B.shield > 0) { rr(ctx, bx2, by2 + 13, bw2 * B.shield / B.shieldMax, 4, 2); ctx.fillStyle = '#7dff4a'; ctx.fill(); }
      if (B.stacks > 0) { // huy hiệu ngộp bọt
        const sx = bx2 + bw2 + 16, sy = by2 + 5;
        ctx.beginPath(); ctx.arc(sx, sy, 11, 0, 7); ctx.fillStyle = B.stacks >= 8 ? '#ffffff' : '#cfeeff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#3a6f9a'; ctx.stroke();
        txt(ctx, '×' + B.stacks, sx, sy + 1, 11, '#1d4a6f', 'center', null);
      }
    });
  }

  function drawBanners(ctx) {
    let row = 0;
    for (const b of g.banners) {
      const k = b.t / b.max, a = Math.min(1, b.t * 5, (b.max - b.t) * 3);
      ctx.globalAlpha = Math.max(0, a);
      if (b.style === 'title') {
        const y = 250, slide = (1 - Math.min(1, b.t * 3)) * 200;
        ctx.fillStyle = 'rgba(10,30,20,0.55)'; ctx.fillRect(0, y - 48, C.W, 96);
        txt(ctx, b.text, C.W / 2 + slide, y, 54, '#ffe066', 'center');
      } else if (b.style === 'warn') {
        const y = C.H / 2; ctx.fillStyle = `rgba(160,0,0,${0.35 + 0.2 * Math.sin(b.t * 14)})`; ctx.fillRect(0, y - 52, C.W, 104);
        txt(ctx, b.text, C.W / 2, y, 50, '#fff', 'center', '#600');
      } else if (b.style === 'boss') {
        txt(ctx, b.text, C.W / 2, 150 + row * 50, 40, '#ff8a5a', 'center'); row++;
      } else if (b.style === 'small') {
        txt(ctx, b.text, g.player.x, g.player.y - 80 - k * 30, 22, '#cfeeff', 'center');
      } else { txt(ctx, b.text, C.W / 2, C.H - 120 - row * 46, 30, '#fff', 'center'); row++; }
    }
    ctx.globalAlpha = 1;
  }

  // cut-in anime khi kích hoạt Siêu phun
  function drawCutin(ctx) {
    const k = 1 - g.cutin / 0.95; // 0 → 1
    ctx.fillStyle = `rgba(5,15,30,${Math.min(0.7, k * 3)})`; ctx.fillRect(0, 0, C.W, C.H);
    // dải chéo
    const bandIn = Math.min(1, k * 4);
    ctx.save(); ctx.translate(C.W / 2, C.H / 2); ctx.rotate(-0.12);
    const bw = C.W * 1.4 * bandIn;
    const gr = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0); gr.addColorStop(0, '#2f8fe0'); gr.addColorStop(0.5, '#bfe8ff'); gr.addColorStop(1, '#3fb6f0');
    ctx.fillStyle = gr; ctx.fillRect(-bw / 2, -130, bw, 260);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-bw / 2, -138, bw, 6); ctx.fillRect(-bw / 2, 132, bw, 6);
    // vạch tốc độ
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3;
    for (let i = 0; i < 16; i++) { const y = -120 + ((i * 53) % 240), x = ((performance.now() * 3 + i * 197) % (C.W * 1.6)) - C.W * 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 180, y); ctx.stroke(); }
    ctx.restore();
    // chân dung trượt vào
    const px = C.lerp(-300, 330, Math.min(1, k * 3.2)) + k * 30;
    C.spr(ctx, 'calota_portrait', 0, px, C.H / 2 - 10, 330, { rot: -0.08 });
    // chữ
    const tx = C.lerp(C.W + 400, 820, Math.min(1, Math.max(0, k * 3 - 0.3))) - k * 30;
    ctx.save(); ctx.translate(tx, C.H / 2); ctx.rotate(-0.12);
    txt(ctx, 'SIÊU PHUN', 0, -40, 92, '#ffffff', 'center', '#0b3a5a');
    txt(ctx, 'DỊCH ĐỘC!', 0, 52, 84, '#ffe066', 'center', '#0b3a5a');
    ctx.restore();
  }
})(window.C);
