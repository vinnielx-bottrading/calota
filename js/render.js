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
    if (g.boss) g.boss.draw(ctx);
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
  function drawHUD(ctx) {
    const p = g.player, now = performance.now() / 1000;
    // khối HUD trái: né tai thỏ và nút quay về "Vinh Làm Game" (nếu có phủ góc trên-trái)
    if (!C._hubT || now - C._hubT > 2) {
      C._hubT = now; const r = C.cv.getBoundingClientRect(); let hub = false;
      try {
        for (const [px, py] of [[24, 20], [60, 28], [120, 28], [40, 50]]) {
          const el = document.elementFromPoint(r.left + px, r.top + py);
          if (el && el !== C.cv && el !== document.body && el !== document.documentElement && !el.closest('#touchUI') && !el.closest('.panel') && el.id !== 'safeProbe') { hub = true; break; }
        }
      } catch (e) { }
      C._hubY = hub ? 62 : 0;
    }
    const hx = (C.safe ? C.safe.l : 0), hy = C._hubY || 0;
    ctx.save(); ctx.translate(hx, hy);
    // chân dung
    ctx.save(); ctx.beginPath(); ctx.arc(62, 62, 44, 0, 7); ctx.fillStyle = '#ffd36b'; ctx.fill(); ctx.clip();
    C.spr(ctx, 'calota_portrait', 0, 64, 70, 104); ctx.restore();
    ctx.lineWidth = 5; ctx.strokeStyle = '#3b1f0e'; ctx.beginPath(); ctx.arc(62, 62, 44, 0, 7); ctx.stroke();
    // tim
    for (let i = 0; i < p.maxHp; i++) { ctx.globalAlpha = i < p.hp ? 1 : 0.22; C.spr(ctx, 'item_heart', 0, 128 + i * 36, 38, 34); }
    ctx.globalAlpha = 1;
    if (p.shield) C.spr(ctx, 'item_shield', 0, 128 + p.maxHp * 36 + 6, 38, 36);
    // cấp súng + tiến độ xu lên cấp
    const gl = g.gunLv || 1, gx = 400, gy = 75;
    txt(ctx, 'SÚNG CẤP ' + gl + '/3', gx, gy, 16, '#ffd34d', 'left');
    if (gl < 3) { const need = gl === 1 ? 10 : 18, k2 = Math.min(1, (g.gunXP || 0) / need); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(gx, gy + 12, 92, 5); ctx.fillStyle = '#ffd34d'; ctx.fillRect(gx, gy + 12, 92 * k2, 5); }
    // thanh hóa chất
    const bx = 112, by = 64, bw = 270, bh = 22, k = g.gauge / 100, full = g.gauge >= 100;
    rr(ctx, bx - 3, by - 3, bw + 6, bh + 6, 13); ctx.fillStyle = '#2a1608'; ctx.fill();
    rr(ctx, bx, by, bw, bh, 10); ctx.fillStyle = '#0e2a1a'; ctx.fill();
    if (k > 0) {
      ctx.save(); rr(ctx, bx, by, bw * k, bh, 10); ctx.clip();
      const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#3aa0e8'); gr.addColorStop(0.6, '#9fdcff'); gr.addColorStop(1, '#ffffff');
      ctx.fillStyle = gr; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx, by + 3, bw, 4);
      for (let i = 0; i < 9; i++) { const ph = (now * 0.6 + i * 0.137) % 1; ctx.beginPath(); ctx.arc(bx + ((i * 61) % bw), by + bh - ph * bh, 2 + (i % 3), 0, 7); ctx.fillStyle = 'rgba(240,255,200,0.6)'; ctx.fill(); }
      ctx.restore();
    }
    if (full && !g.ultActive) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(now * 8);
      ctx.drawImage(C.G.ice, bx - 30, by - 40, bw + 60, bh + 80); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    txt(ctx, 'DỊCH ĐỘC', bx + 8, by + bh / 2 + 1, 15, '#fff', 'left', '#0b3a5a');
    if (full && !g.ultActive) txt(ctx, C.input.usingTouch ? 'SIÊU PHUN SẴN SÀNG!' : 'SIÊU PHUN SẴN SÀNG · [K]', bx, by + bh + 20, 17, '#ffffff', 'left', '#0b3a5a');
    // thanh NỘ — chiêu Tuyệt Mệnh
    const rk = (g.rage || 0) / 100, ry = 124, rfull = rk >= 1 && !g.rageActive;
    rr(ctx, bx - 2, ry - 2, 200 + 4, 14, 7); ctx.fillStyle = '#2a1608'; ctx.fill();
    if (rk > 0) { const gr2 = ctx.createLinearGradient(bx, 0, bx + 200, 0); gr2.addColorStop(0, '#ff5a2a'); gr2.addColorStop(1, '#ffe066'); rr(ctx, bx, ry, 200 * rk, 10, 5); ctx.fillStyle = gr2; ctx.fill(); }
    if (rfull) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(now * 9); ctx.drawImage(C.G.orange, bx - 30, ry - 30, 260, 70); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    txt(ctx, rfull ? (C.input.usingTouch ? 'TUYỆT MỆNH SẴN SÀNG!' : 'TUYỆT MỆNH SẴN SÀNG · [Q]') : 'NỘ', bx + 208, ry + 5, 14, rfull ? '#ffe066' : '#ffb08a', 'left');
    if (rfull && (g.threat || 0) >= 3) txt(ctx, 'BỊ BAO VÂY!', bx, ry + 26, 18, '#ff6b4a', 'left');
    ctx.restore();
    // điểm & xu
    const rx = C.W - 24 - (C.safe ? C.safe.r : 0);
    txt(ctx, g.score.toLocaleString('vi-VN'), rx, 36, 30, '#fff', 'right');
    C.spr(ctx, 'item_coin', 0, rx - 86, 74, 30); txt(ctx, '× ' + g.coins, rx - 64, 75, 22, '#ffe066');
    // tiến trình hoặc máu boss
    const B = g.boss;
    if (!B) {
      const pw = 380, px = C.W / 2 - pw / 2, py = 26, pk = C.clamp(g.t / g.gate.stageTime, 0, 1);
      rr(ctx, px, py, pw, 10, 5); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      rr(ctx, px, py, pw * pk, 10, 5); ctx.fillStyle = '#ffd34d'; ctx.fill();
      C.spr(ctx, 'calota_portrait', 0, px + pw * pk, py + 5, 34);
      C.spr(ctx, 'boss_idle', 0, px + pw + 26, py + 4, 52);
    } else {
      const bw2 = 600, bx2 = C.W / 2 - bw2 / 2, by2 = 34;
      txt(ctx, g.gate.bossName, C.W / 2, by2 - 14, 18, '#fff', 'center');
      rr(ctx, bx2 - 4, by2 - 2, bw2 + 8, 24, 10); ctx.fillStyle = '#2a1608'; ctx.fill();
      const hk = Math.max(0, B.hp / B.maxHp);
      B.shownHp = B.shownHp == null ? hk : C.lerp(B.shownHp, hk, 0.06);
      rr(ctx, bx2, by2 + 1, bw2 * B.shownHp, 18, 8); ctx.fillStyle = '#ffe1a8'; ctx.fill();
      const hg = ctx.createLinearGradient(0, by2, 0, by2 + 18); hg.addColorStop(0, '#ff6b4a'); hg.addColorStop(1, '#c4231a');
      rr(ctx, bx2, by2 + 1, bw2 * hk, 18, 8); ctx.fillStyle = hg; ctx.fill();
      [0.66, 0.33].forEach(m => { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx2 + bw2 * m - 1, by2 + 1, 3, 18); });
      if (B.shield > 0) { rr(ctx, bx2, by2 + 22, bw2 * B.shield / B.shieldMax, 9, 4); ctx.fillStyle = '#7dff4a'; ctx.fill(); txt(ctx, 'GIÁP RÊU', bx2 + bw2 + 12, by2 + 27, 13, '#9dff5a'); }
      if (B.stacks > 0) {
        txt(ctx, 'NGỘP BỌT ×' + B.stacks + '  (+' + B.stacks * 8 + '% sát thương)', C.W / 2, by2 + 46, 16, '#cfeeff', 'center');
      }
    }
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
