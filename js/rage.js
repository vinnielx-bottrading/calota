/* CALOTA — CHIÊU TUYỆT MỆNH
   Thanh Nộ đầy (nạp nhanh khi bị bao vây / trúng đòn) → Calota dừng lại, gồng tạo aura,
   ngửa mặt lên trời phun cột bọt hóa chất long trời lở đất, bọt đổ mưa xuống khắp màn hình. */
(function (C) {
  const R = C.Rage = { CHARGE: 1.1, BLAST: 3.4 };
  const E = C.E;

  R.reset = function (g) { g.rage = 0; g.rageActive = false; g.rageT = 0; g.ragePhase = null; g.rageTick = 0; };

  /** đếm mối nguy quanh Calota (quái + đạn) */
  R.threat = function (g) {
    const p = g.player; let n = 0;
    for (const e of g.enemies) if (!e.static && !e.dead && C.dist2(e.x, e.y, p.x, p.y) < 330 * 330) n++;
    for (const b of g.ebullets) if (C.dist2(b.x, b.y, p.x, p.y) < 260 * 260) n++;
    if (g.boss && g.boss.state !== 'dying' && C.dist2(g.boss.x, g.boss.y, p.x, p.y) < 420 * 420) n += 2;
    return n;
  };
  R.add = function (g, v) { if (!g.rageActive) g.rage = C.clamp((g.rage || 0) + v, 0, 100); };

  R.update = function (g, dt, rdt) {
    const p = g.player, I = C.input;
    if (!g.rageActive) {
      g.threat = R.threat(g);
      R.add(g, dt * (0.6 + g.threat * 2.2)); // càng bị vây càng nạp nhanh
      if (I.ragePressed && g.rage >= 100 && !p.dead && !g.ultActive) R.start(g);
      return;
    }
    g.rageT += rdt;
    if (g.ragePhase === 'charge') {
      // gồng: hút bọt vào người, aura lớn dần, đẩy đạn ra xa
      C.shake(2 + g.rageT * 8);
      for (let i = 0; i < 4; i++) {
        const a = C.rand(0, 6.283), d = C.rand(160, 320);
        C.emit({ kind: 'blob', color: '#ffffff', edge: '#6fa3c8', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, vx: -Math.cos(a) * d * 2.4, vy: -Math.sin(a) * d * 2.4, max: 0.4, s0: C.rand(4, 9), s1: 2, layer: 2 });
      }
      for (const b of g.ebullets) { const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy) || 1; if (d < 380) { b.vx = dx / d * 500; b.vy = dy / d * 500; } }
      if (g.rageT >= R.CHARGE) {
        g.ragePhase = 'blast'; g.rageT = 0; C.flash(1, '#ffffff'); C.shake(34); C.sfx.play('explode'); if (!C.sfx.sample('sfx_rage_roar', 1.1)) C.sfx.play('ult'); // tiếng RỐNG khi tung chiêu
        g.banner('TUYỆT MỆNH!', 1.8, 'title');
        const m = R.mouth(g);
        C.emit({ kind: 'ring', color: 'rgba(255,255,255,0.95)', x: p.x, y: p.y, max: 0.7, s0: 30, s1: 900, lw: 30, layer: 2 });
        C.emit({ kind: 'ring', color: 'rgba(255,225,120,0.9)', x: p.x, y: p.y, max: 0.9, s0: 20, s1: 1300, lw: 16, layer: 2 });
        for (let i = 0; i < 6; i++) setTimeout(() => C.Decals.splatScreen(), 150 + i * 380);
        g.ebullets.length = 0;
      }
    } else {
      // phun cột bọt lên trời → bọt đổ mưa khắp màn hình
      C.shake(9);
      const m = R.mouth(g);
      for (let i = 0; i < 6; i++) { // bọt bắn ngược lên
        const a = -Math.PI / 2 + C.rand(-0.25, 0.25), v = C.rand(900, 1500);
        C.emit({ kind: 'blob', color: '#ffffff', edge: '#6fa3c8', x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: 0.6, s0: C.rand(8, 16), s1: 6, layer: 2 });
      }
      if (g.rageT > 0.35) for (let i = 0; i < 7; i++) { // mưa bọt rơi khắp nơi
        C.emit({ kind: 'blob', color: Math.random() < 0.8 ? '#ffffff' : '#dff1ff', edge: '#6fa3c8', x: C.rand(0, C.W), y: C.rand(-60, -10), vx: C.rand(-60, 60), vy: C.rand(300, 700), grav: 900, max: C.rand(1, 1.6), s0: C.rand(8, 20), s1: 6, layer: 2, onDie: p2 => { if (p2.y > C.H - 160 && Math.random() < 0.3) C.Decals.add(null, p2.x, C.H - C.rand(40, 70), 4, C.rand(80, 140), 9); } });
      }
      if (Math.random() < 0.5) C.emit({ kind: 'anim', img: 'foam_splash', x: C.rand(100, C.W - 100), y: C.rand(80, C.H - 120), max: 0.5, s0: 160, s1: 260, layer: 2, fadePow: 6, rot: C.rand(-3, 3) });
      // sát thương mỗi 0.2s lên MỌI thứ trên màn hình
      g.rageTick -= rdt;
      if (g.rageTick <= 0) {
        g.rageTick = 0.2;
        for (const e of g.enemies) if (!e.static && !e.dead && e.x < C.W + 40) {
          e.hp -= 150; e.corr = 3;
          C.Decals.add(e, e.x + C.rand(-20, 20), e.y + C.rand(-20, 20), C.randi(0, 3), C.rand(50, 90));
          if (e.hp <= 0) g.killEnemy(e, true);
        }
        const B = g.boss;
        if (B && B.state !== 'dying' && B.state !== 'enter') {
          const d = B.damage(190, 'ult'); B.stacks = 10; B.sprayedT = 0;
          if (d) C.dmgText(B.x, B.y - 120, d, '#fff6a0', 46);
          C.Decals.add(B, B.x + C.rand(-150, 150), B.y + C.rand(-120, 120), C.randi(0, 3), C.rand(90, 160), 9);
        }
        g.ebullets.length = 0;
      }
      if (g.rageT >= R.BLAST) {
        g.rageActive = false; g.ragePhase = null; g.rage = 0; g.player.inv = 1.2;
        if (g.boss && g.boss.state === 'fight') { g.boss.stunT = 2.5; g.banner('BOSS NGỘP BỌT — CHOÁNG!', 1.6, 'boss'); }
      }
    }
  };
  R.start = function (g) {
    g.rageActive = true; g.ragePhase = 'charge'; g.rageT = 0; g.rageTick = 0;
    C.Chem.power = 0; C.sfx.play('ult'); C.flash(0.4, '#ffe9a0');
  };
  /** miệng khi ngửa mặt lên trời */
  R.mouth = function (g) {
    const p = g.player, m = C.SPRITES.calota_rage_sky;
    if (m) { const f = R.skyFrame ? R.skyFrame() : 0, W = 270, H = m.fh * W / m.fw; return { x: p.x + ([0.66, 0.51, 0.56][f] - 0.5) * W, y: p.y + ([0.47, 0.53, 0.54][f] - 0.5) * H }; }
    return { x: p.x + 10, y: p.y - 30 };
  };

  // ---------------- vẽ ----------------
  R.drawBehind = function (ctx, g) { // aura sau lưng Calota
    if (!g.rageActive) return;
    const p = g.player, t = performance.now() / 1000;
    const k = g.ragePhase === 'charge' ? Math.min(1, g.rageT / R.CHARGE) : 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const r = 90 + k * 140 + Math.sin(t * 30) * 8;
    ctx.globalAlpha = 0.55 + 0.3 * k; ctx.drawImage(C.G.white, p.x - r, p.y - r, r * 2, r * 2);
    ctx.globalAlpha = 0.6 * k; ctx.drawImage(C.G.orange, p.x - r * 1.3, p.y - r * 1.3, r * 2.6, r * 2.6);
    // tia sáng xoay
    ctx.translate(p.x, p.y); ctx.rotate(t * 1.5);
    ctx.globalAlpha = 0.35 + 0.35 * k; ctx.fillStyle = '#fff3c0';
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(r * 2.4, -3); ctx.lineTo(r * 2.4, 3); ctx.lineTo(0, 12); ctx.fill(); }
    ctx.restore();
    // vòng aura dạng lửa trắng
    ctx.save(); ctx.strokeStyle = `rgba(255,240,180,${0.5 + 0.4 * k})`; ctx.lineWidth = 6;
    for (let j = 0; j < 2; j++) { ctx.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * 6.283, rr = r * (0.7 + j * 0.25) + Math.sin(a * 9 + t * 20 + j) * 10; const x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    ctx.restore();
  };
  // vị trí miệng / tâm cột bọt trong từng frame ảnh "ngửa mặt phun trời" (tỉ lệ theo khung)
  const SKY = [[0.66, 0.47], [0.51, 0.53], [0.56, 0.54]], SKY_W = 270;
  R.skyFrame = () => Math.floor(performance.now() / 1000 * 10) % 3;
  R.drawCalota = function (ctx, g) { // ảnh thật: gồng aura 4 frame → ngửa mặt phun lên trời 3 frame
    const p = g.player, t = performance.now() / 1000;
    if (g.ragePhase === 'charge') {
      const k = g.rageT / R.CHARGE, shake = Math.sin(t * 80) * (2 + k * 4);
      const f = k > 0.86 ? 3 : Math.min(2, Math.floor(k * 3.5));
      if (C.SPRITES.calota_rage_charge) C.spr(ctx, 'calota_rage_charge', f, p.x + shake, p.y, 250 * (1 + 0.05 * Math.sin(t * 40)));
      else C.spr(ctx, 'calota_spray', 0, p.x + shake, p.y, 230);
      return;
    }
    const m = C.SPRITES.calota_rage_sky;
    if (!m) { C.spr(ctx, 'calota_spray', 1, p.x, p.y, 230, { rot: -Math.PI / 2 }); return; }
    const f = R.skyFrame(), W = SKY_W, H = m.fh * W / m.fw, top = p.y - H / 2;
    const cx = p.x + (SKY[f][0] - 0.5) * W;
    // cột bọt nối từ đỉnh ảnh lên tới mép trên màn hình
    const st = C.SPRITES.foam_stream, im = C.img.foam_stream;
    if (st && im && im.naturalWidth && top > -20) {
      const len = top + 60, CW = 190 + Math.sin(t * 40) * 16, ff = Math.floor(t * 16) % st.n;
      ctx.save(); ctx.translate(cx, top + 30); ctx.rotate(-Math.PI / 2);
      ctx.drawImage(im, ff * st.fw, 0, st.fw * 0.6, st.fh, 0, -CW / 2, len, CW);
      ctx.restore();
    }
    C.spr(ctx, 'calota_rage_sky', f, p.x + Math.sin(t * 60) * 2, p.y, W);
  };
  R.drawOverlay = function (ctx, g) {
    if (!g.rageActive) return;
    const k = g.ragePhase === 'charge' ? Math.min(1, g.rageT / R.CHARGE) : 0.35;
    ctx.fillStyle = `rgba(10,15,30,${0.45 * k})`; ctx.fillRect(0, 0, C.W, C.H);
  };
})(window.C);
