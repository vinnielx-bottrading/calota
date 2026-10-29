/* CALOTA — CHIÊU TUYỆT MỆNH
   Thanh Nộ đầy (nạp nhanh khi bị bao vây / trúng đòn) → Calota dừng lại, gồng tạo aura,
   ngửa mặt lên trời phun cột bọt hóa chất long trời lở đất, bọt đổ mưa xuống khắp màn hình. */
(function (C) {
  const R = C.Rage = { CHARGE: 1.1, BLAST: 3.4, LOOP: 1.7, BLAST_VC: 4.2 };
  /** từ cửa 3: TUYỆT MỆNH VÔ CỰC — gồng nổi gân → bay hình ∞ → ngửa cổ phun dịch độc gấp bội + cháy nổ */
  /** chế độ tuyệt chiêu theo cửa: base (cửa 1–2) · vc = Vô Cực (cửa 3) · st = Hắc Song Trùng (cửa 4+). Đấu trường Boss: chọn bằng phím */
  R.defMode = g => (g.gate && g.gate.rageMode) || (g.gate && g.gate.id >= 4 ? 'st' : g.gate && g.gate.id >= 3 ? 'vc' : 'base');
  R.mode = g => g.rageActive ? g.rageMode : R.defMode(g);
  R.vc = g => R.mode(g) === 'vc';
  R.st = g => R.mode(g) === 'st';
  const E = C.E;

  R.reset = function (g) { g.rage = 0; g.rageActive = false; g.rageT = 0; g.ragePhase = null; g.rageTick = 0; };

  /** đếm mối nguy quanh Calota (quái + đạn) */
  R.threat = function (g) {
    const p = g.player; let n = 0;
    for (const e of g.enemies) if (!e.static && !e.dead && C.dist2(e.x, e.y, p.x, p.y) < 330 * 330) n++;
    for (const b of g.ebullets) if (C.dist2(b.x, b.y, p.x, p.y) < 260 * 260) n++;
    for (const B of C.bossList(g)) if (B.state !== 'dying' && C.dist2(B.x, B.y, p.x, p.y) < 420 * 420) n += 2;
    return n;
  };
  R.add = function (g, v) { if (!g.rageActive) g.rage = C.clamp((g.rage || 0) + v, 0, 100); };

  R.update = function (g, dt, rdt) {
    const p = g.player, I = C.input;
    if (!g.rageActive) {
      g.threat = R.threat(g);
      R.add(g, dt * (0.6 + g.threat * 2.2) * (g.player.hp <= 1 ? 2 : 1) * (g.gate.rageMul || 1)); // còn 1 tim → Nộ nạp gấp đôi // càng bị vây càng nạp nhanh
      if (g.rage >= 100 && !p.dead && !g.ultActive) {
        if (I.ragePressed) R.start(g, g.gate && g.gate.allSkills ? 'vc' : R.defMode(g));
        else if (I.rage2Pressed && g.gate && g.gate.allSkills) R.start(g, 'st'); // Đấu trường: phím R = Hắc Song Trùng
      }
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
      if (g.rageT >= R.CHARGE && R.st(g)) { C.ST.begin(g); }
      else if (g.rageT >= R.CHARGE && R.vc(g)) {
        g.ragePhase = 'loop'; g.rageT = 0; g.vcPts = []; g.vcFrom = { x: p.x, y: p.y }; g.vcBossT = 0;
        for (const e of g.enemies) e._vc = false;
        C.flash(0.5, '#d8ff7a'); C.shake(20); C.sfx.play('dash'); C.sfx.play('ult');
        g.banner('TUYỆT MỆNH VÔ CỰC!', 2.2, 'title');
      } else if (g.rageT >= R.CHARGE) {
        g.ragePhase = 'blast'; g.rageT = 0; C.flash(1, '#ffffff'); C.shake(34); C.sfx.play('explode'); if (!C.sfx.sample('sfx_rage_roar', 1.1)) C.sfx.play('ult'); // tiếng RỐNG khi tung chiêu
        g.banner('TUYỆT MỆNH!', 1.8, 'title');
        const m = R.mouth(g);
        C.emit({ kind: 'ring', color: 'rgba(255,255,255,0.95)', x: p.x, y: p.y, max: 0.7, s0: 30, s1: 900, lw: 30, layer: 2 });
        C.emit({ kind: 'ring', color: 'rgba(255,225,120,0.9)', x: p.x, y: p.y, max: 0.9, s0: 20, s1: 1300, lw: 16, layer: 2 });
        for (let i = 0; i < 6; i++) setTimeout(() => C.Decals.splatScreen(), 150 + i * 380);
        g.ebullets.length = 0;
      }
    } else if (R.st(g)) {
      C.ST.update(g, rdt);
    } else if (g.ragePhase === 'loop') {
      R.updateLoop(g, rdt);
    } else if (R.vc(g)) {
      R.updateBlastVC(g, rdt);
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
        for (const B of C.bossList(g)) if (B.state !== 'dying' && B.state !== 'enter') {
          const d = B.damage(190, 'ult'); B.stacks = 10; B.sprayedT = 0;
          if (d) C.dmgText(B.x, B.y - 120, d, '#fff6a0', 46);
          C.Decals.add(B, B.x + C.rand(-150, 150), B.y + C.rand(-120, 120), C.randi(0, 3), C.rand(90, 160), 9);
        }
        g.ebullets.length = 0;
      }
      if (g.rageT >= R.BLAST) {
        g.rageActive = false; g.ragePhase = null; g.rage = 0; g.player.inv = 1.2;
        if (C.bossList(g).some(B => B.state === 'fight')) { C.bossList(g).forEach(B => { if (B.state === 'fight') B.stunT = 2.5; }); g.banner('BOSS NGỘP BỌT — CHOÁNG!', 1.6, 'boss'); }
      }
    }
  };
  // ---------------- VÔ CỰC ----------------
  R.lemni = function (u) { // đường cong ∞ (lemniscate Bernoulli) giữa màn hình
    const cx = C.W / 2, cy = C.H / 2 - 10, a = Math.min(C.W * 0.34, 470), s = Math.sin(u), c = Math.cos(u), d = 1 + s * s;
    return { x: cx + a * c / d, y: cy + a * 1.15 * s * c / d };
  };
  R.updateLoop = function (g, dt) {
    const p = g.player, k = g.rageT / R.LOOP;
    const q = R.lemni(Math.PI + k * Math.PI * 2);
    const lk = Math.min(1, g.rageT / 0.22);           // bay từ chỗ đang đứng vào quỹ đạo
    const nx = C.lerp(g.vcFrom.x, q.x, lk), ny = C.lerp(g.vcFrom.y, q.y, lk);
    g.vcDir = Math.atan2(ny - p.y, nx - p.x); p.x = nx; p.y = ny;
    g.vcPts.push({ x: p.x, y: p.y }); if (g.vcPts.length > 140) g.vcPts.shift();
    C.shake(4);
    for (let i = 0; i < 3; i++) C.emit({ kind: 'glow', img: Math.random() < 0.5 ? C.G.goo : C.G.orange, x: p.x + C.rand(-20, 20), y: p.y + C.rand(-20, 20), vx: C.rand(-60, 60), vy: C.rand(-60, 60), max: C.rand(0.5, 1), s0: C.rand(14, 26), s1: 4, add: true, layer: 2 });
    // vệt bay cắt quái
    for (const e of g.enemies) if (!e.static && !e.dead && !e._vc && C.dist2(e.x, e.y, p.x, p.y) < 110 * 110) {
      e._vc = true; e.hp -= 420; e.corr = 3; C.emit({ kind: 'anim', img: 'toxic_explode', x: e.x, y: e.y, max: 0.45, s0: 120, s1: 180, layer: 2 });
      if (e.hp <= 0) g.killEnemy(e, true);
    }
    for (const b of g.ebullets) if (C.dist2(b.x, b.y, p.x, p.y) < 140 * 140) b.dead = true;
    g.vcBossT -= dt; if (g.vcBossT <= 0) for (const B of C.bossList(g)) if (B.state !== 'dying' && B.state !== 'enter') for (const [cx, cy, r] of B.hitCircles()) if (C.dist2(cx, cy, p.x, p.y) < (r + 70) * (r + 70)) {
      B._vcT = 0.3; g.vcBossT = 0.3; const d = B.damage(600, 'ult'); if (d) C.dmgText(B.x, B.y - 120, d, '#d8ff7a', 44); break;
    }
    if (g.rageT >= R.LOOP) { // về giữa vòng ∞, ngửa cổ phun
      g.ragePhase = 'blast'; g.rageT = 0; g.vcFrom = { x: p.x, y: p.y };
      C.flash(1, '#f4ffd0'); C.shake(36); C.sfx.play('explode'); if (!C.sfx.sample('sfx_rage_roar', 1.2)) C.sfx.play('ult');
      C.emit({ kind: 'ring', color: 'rgba(216,255,122,0.95)', x: C.W / 2, y: C.H / 2, max: 0.8, s0: 40, s1: 1100, lw: 34, layer: 2 });
      C.emit({ kind: 'ring', color: 'rgba(255,210,90,0.9)', x: C.W / 2, y: C.H / 2, max: 1, s0: 20, s1: 1500, lw: 18, layer: 2 });
      g.ebullets.length = 0;
    }
  };
  R.updateBlastVC = function (g, dt) {
    const p = g.player, cx = C.W / 2, cy = C.H / 2 + 70;
    const lk = Math.min(1, g.rageT / 0.25); p.x = C.lerp(g.vcFrom.x, cx, lk); p.y = C.lerp(g.vcFrom.y, cy, lk);
    C.shake(12);
    const m = R.mouth(g);
    for (let i = 0; i < 8; i++) { // cột dịch + bọt bắn ngược lên
      const a = -Math.PI / 2 + C.rand(-0.3, 0.3), v = C.rand(1000, 1700), green = Math.random() < 0.6;
      C.emit({ kind: 'blob', color: green ? '#b6f23a' : '#ffffff', edge: green ? '#3d7a10' : '#6fa3c8', x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: 0.6, s0: C.rand(9, 18), s1: 6, layer: 2 });
    }
    if (g.rageT > 0.3) for (let i = 0; i < 10; i++) { // mưa dịch độc khắp màn hình
      const green = Math.random() < 0.7;
      C.emit({ kind: green ? 'drip' : 'blob', color: green ? 'rgba(170,240,40,0.97)' : '#ffffff', edge: '#6fa3c8', x: C.rand(0, C.W), y: C.rand(-60, -10), vx: C.rand(-40, 40), vy: C.rand(300, 700), grav: 900, max: C.rand(1, 1.6), s0: C.rand(8, 18), s1: 6, layer: 2, onDie: green ? C.venomDrop : null });
    }
    if (Math.random() < 0.4) { // cháy nổ dịch độc
      const x = C.rand(60, C.W - 60), y = C.rand(60, C.H - 80);
      C.emit({ kind: 'anim', img: 'toxic_explode', x, y, max: 0.55, s0: C.rand(150, 220), s1: C.rand(240, 340), layer: 2, rot: C.rand(-0.4, 0.4) });
      if (Math.random() < 0.35) C.sfx.play('explode');
    }
    g.vcSplatT = (g.vcSplatT || 0) - dt;
    if (g.vcSplatT <= 0) { g.vcSplatT = 0.45; C.Decals.splatScreen('venom_decal', C.rand(12, 16)); } // dịch bám màn hình rất lâu
    g.rageTick -= dt;
    if (g.rageTick <= 0) {
      g.rageTick = 0.2;
      for (const e of g.enemies) if (!e.static && !e.dead && e.x < C.W + 40) {
        e.hp -= 375; e.corr = 3;
        C.Decals.add(e, e.x + C.rand(-20, 20), e.y + C.rand(-20, 20), C.pick([0, 2, 3, 5]), C.rand(50, 90), 14, 'venom_decal');
        if (e.hp <= 0) g.killEnemy(e, true);
      }
      for (const B of C.bossList(g)) if (B.state !== 'dying' && B.state !== 'enter') {
        const d = B.damage(475, 'ult'); B.stacks = 10; B.sprayedT = 0;
        if (d) C.dmgText(B.x, B.y - 120, d, '#d8ff7a', 50);
        C.Decals.add(B, B.x + C.rand(-150, 150), B.y + C.rand(-120, 120), C.pick([0, 2, 3, 5]), C.rand(90, 160), 15, 'venom_decal');
      }
      g.ebullets.length = 0;
    }
    if (g.rageT >= R.BLAST_VC) {
      g.rageActive = false; g.ragePhase = null; g.rage = 0; g.player.inv = 1.5; g.vcPts = null;
      for (let i = 0; i < 6; i++) C.Decals.add(null, C.rand(0, C.W), C.H - C.rand(40, 70), 4, C.rand(120, 200), 15, 'venom_decal'); // vũng dịch dưới đất
      if (C.bossList(g).some(B => B.state === 'fight')) { C.bossList(g).forEach(B => { if (B.state === 'fight') B.stunT = 3; }); g.banner('BOSS NGỘP DỊCH — CHOÁNG!', 1.6, 'boss'); }
    }
  };

  R.start = function (g, mode) {
    g.rageMode = mode || R.defMode(g);
    g.rageActive = true; g.ragePhase = 'charge'; g.rageT = 0; g.rageTick = 0;
    C.Chem.power = 0; C.sfx.play('ult'); C.flash(0.4, '#ffe9a0');
  };
  /** miệng khi ngửa mặt lên trời */
  const VSKY = [0.61, 0.53, 0.54], VSKY_W = 300;
  R.mouth = function (g) {
    const p = g.player, m = C.SPRITES.calota_rage_sky;
    if (R.vc(g) && C.SPRITES.calota_vc_sky) { const f = R.skyFrame(), mv = C.SPRITES.calota_vc_sky, H = mv.fh * VSKY_W / mv.fw; return { x: p.x + (VSKY[f] - 0.5) * VSKY_W, y: p.y - H / 2 + 10 }; }
    if (m) { const f = R.skyFrame ? R.skyFrame() : 0, W = 270, H = m.fh * W / m.fw; return { x: p.x + ([0.66, 0.51, 0.56][f] - 0.5) * W, y: p.y + ([0.47, 0.53, 0.54][f] - 0.5) * H }; }
    return { x: p.x + 10, y: p.y - 30 };
  };

  // ---------------- vẽ ----------------
  R.drawBehind = function (ctx, g) { // aura sau lưng Calota
    if (!g.rageActive) return;
    if (R.st(g)) { C.ST.drawBehind(ctx, g); if (g.ragePhase !== 'charge') return; }
    if (R.vc(g) && g.ragePhase !== 'charge') { R.drawInfinity(ctx, g); return; }
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
  /** vòng ∞ sáng dày như vành đai sao Thổ + vệt bay */
  R.drawInfinity = function (ctx, g) {
    const t = performance.now() / 1000, loop = g.ragePhase === 'loop';
    const k = loop ? Math.min(1, g.rageT / R.LOOP) : Math.max(0, 1 - Math.max(0, g.rageT - R.BLAST_VC + 1.2) / 1.2);
    const m = C.SPRITES.infinity_ring, a = Math.min(C.W * 0.34, 470);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (m) { ctx.globalAlpha = (loop ? k * 0.9 : 0.75 + 0.2 * Math.sin(t * 12)) * (loop ? 1 : k); C.spr(ctx, 'infinity_ring', 0, C.W / 2, C.H / 2 - 10, a * 2.5 * (1 + 0.02 * Math.sin(t * 8))); }
    const pts = g.vcPts;
    if (pts && pts.length > 2) {
      for (const [lw, col] of [[34, 'rgba(160,255,60,0.35)'], [16, 'rgba(255,220,120,0.7)'], [6, 'rgba(255,255,240,0.95)']]) {
        ctx.globalAlpha = loop ? 1 : k; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const q of pts) ctx.lineTo(q.x, q.y); ctx.stroke();
      }
    }
    if (!loop) { const p = g.player, r = 200 + Math.sin(t * 30) * 12; ctx.globalAlpha = 0.6; ctx.drawImage(C.G.goo, p.x - r, p.y - r, r * 2, r * 2); }
    ctx.restore();
  };
  // gân nổi khi gồng (vẽ bằng code cho tới khi có ảnh N4)
  const VEINS = Array.from({ length: 9 }, () => { const a = Math.random() * 6.283, pts = []; let x = Math.cos(a) * 8, y = Math.sin(a) * 8; for (let i = 0; i < 5; i++) { pts.push([x, y]); x += Math.cos(a + C.rand(-0.8, 0.8)) * 10; y += Math.sin(a + C.rand(-0.8, 0.8)) * 10; } return pts; });
  function drawVeins(ctx, x, y, k, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [lw, col] of [[7, `rgba(120,255,60,${0.35 * k})`], [3, `rgba(230,255,170,${(0.6 + 0.4 * Math.sin(t * 25)) * k})`]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      for (const v of VEINS) { ctx.beginPath(); v.forEach(([vx, vy], i) => i ? ctx.lineTo(x + vx, y + vy) : ctx.moveTo(x + vx, y + vy)); ctx.stroke(); }
    }
    ctx.restore();
  }
  R.drawCalota = function (ctx, g) {
    if (R.st(g)) { C.ST.drawCalota(ctx, g); return; }
    if (R.vc(g)) {
      const p = g.player, t = performance.now() / 1000;
      if (g.ragePhase === 'charge') {
        const k = Math.min(1, g.rageT / R.CHARGE), shake = Math.sin(t * 80) * (2 + k * 4);
        if (C.SPRITES.calota_veins) C.spr(ctx, 'calota_veins', Math.min(3, Math.floor(k * 4)), p.x + shake, p.y, 285 * (1 + 0.03 * Math.sin(t * 40)));
        else { C.spr(ctx, 'calota_rage_charge', k > 0.86 ? 3 : Math.min(2, Math.floor(k * 3.5)), p.x + shake, p.y, 250 * (1 + 0.05 * Math.sin(t * 40))); drawVeins(ctx, p.x + shake + 10, p.y + 10, k, t); }
        return;
      }
      if (g.ragePhase === 'loop') {
        const d = g.vcDir || 0, left = Math.cos(d) < 0;
        C.spr(ctx, 'calota_loop', 3, p.x, p.y, 190, { rot: left ? d - Math.PI : d, flip: left });
        return;
      }
      const m = C.SPRITES.calota_vc_sky, f = R.skyFrame(), W = VSKY_W, H = m ? m.fh * W / m.fw : 300, top = p.y - H / 2;
      const st = C.SPRITES.foam_stream, im = C.img.foam_stream, cx = p.x + (VSKY[f] - 0.5) * W;
      if (st && im && im.naturalWidth && top > -20) { // cột dịch nối lên tới mép trên màn hình
        const len = top + 60, CW = W * 0.55 + Math.sin(t * 40) * 18, ff = Math.floor(t * 16) % st.n;
        ctx.save(); ctx.translate(cx, top + 30); ctx.rotate(-Math.PI / 2);
        ctx.drawImage(im, ff * st.fw, 0, st.fw * 0.6, st.fh, 0, -CW / 2, len, CW);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.drawImage(C.G.goo, 0, -CW * 0.55, len, CW * 1.1);
        ctx.restore();
      }
      if (m) C.spr(ctx, 'calota_vc_sky', f, p.x + Math.sin(t * 60) * 2, p.y, W);
      return;
    } // ảnh thật: gồng aura 4 frame → ngửa mặt phun lên trời 3 frame
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
