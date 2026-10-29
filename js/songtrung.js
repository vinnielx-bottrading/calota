/* CALOTA — TUYỆT CHIÊU HẮC SONG TRÙNG (mở từ cửa 4)
   Âm Dương: Calota phóng to, aura rực rỡ → tách thành 2 Calota ĐEN → xoay vòng quanh tâm màn hình,
   vệt bay vẽ biểu tượng ☯ → 2 bóng đen phun bọt TRẮNG cực đại bằng miệng, quét xoay như cánh quạt,
   lốc bọt lấp màn hình, quái bị bọc bọt chết ngợp → nhập thân, trắng xóa.
   Dư âm 8 giây: 2 bóng đen bay kèm Calota và phun theo mỗi lần Calota phun.
   Bọt + dịch độc bám màn hình, bám cây cỏ, trôi tuột xuống và nhỏ giọt lộp độp ~15 giây. */
(function (C) {
  const R = C.Rage;
  const ST = C.ST = { SPLIT: 0.75, ORBIT: 1.5, SPRAY: 3.4, MERGE: 0.55, ECHO: 8, ORB_R: 290, STREAM: 720 };
  const center = () => ({ x: C.W / 2, y: C.H / 2 - 10 });

  ST.begin = function (g) {
    const p = g.player;
    g.ragePhase = 'split'; g.rageT = 0; g.stAng = 0; g.stSpin = 0; g.stEcho = 0; g.stEchoStreams = null;
    g.stClones = [{ x: p.x, y: p.y, a: Math.PI }, { x: p.x, y: p.y, a: 0 }];
    g.stFrom = { x: p.x, y: p.y };
    C.flash(0.9, '#ffffff'); C.shake(26); C.sfx.play('dash');
    // tiếng gào đôi vọng hai bên
    if (!C.sfx.sample('sfx_rage_roar', 1)) C.sfx.play('ult'); setTimeout(() => C.sfx.sample('sfx_rage_roar', 0.7), 140);
    g.banner('HẮC SONG TRÙNG!', 2.2, 'title');
    for (const e of g.enemies) e._st = 0;
  };

  function mouthOf(c, dir) { return { x: c.x + Math.cos(dir) * 60, y: c.y + Math.sin(dir) * 60 }; }
  // khoảng cách từ điểm tới đoạn thẳng
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = C.clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1);
    return Math.hypot(px - ax - dx * t, py - ay - dy * t);
  }
  function smother(g, e) { // quái bị bọc bọt chết ngợp
    C.emit({ kind: 'anim', img: 'foam_trap', x: e.x, y: e.y, vy: -60, max: 0.9, s0: e.w * 1.1, s1: e.w * 1.5, layer: 2, fadePow: 8 });
    g.killEnemy(e, true);
  }
  function hitStreams(g, dt, list, dps, bossDps) {
    for (const s of list) {
      for (const e of g.enemies) {
        if (e.static || e.dead) continue;
        if (segDist(e.x, e.y, s.ax, s.ay, s.bx, s.by) < 70 + e.r) { e.hp -= dps * dt; e.corr = 3; if (e.hp <= 0) smother(g, e); }
      }
      for (const B of C.bossList(g)) {
        if (B.state === 'dying' || B.state === 'enter') continue;
        for (const [cx, cy, r] of B.hitCircles()) if (segDist(cx, cy, s.ax, s.ay, s.bx, s.by) < r + 50) { B.damage(bossDps * dt, 'ult'); B.stacks = 10; B.sprayedT = 0; if (Math.random() < dt * 6) C.Decals.add(B, cx + C.rand(-r, r) * 0.6, cy + C.rand(-r, r) * 0.6, C.randi(0, 3), C.rand(80, 140), 14); break; }
      }
      for (const b of g.ebullets) if (segDist(b.x, b.y, s.ax, s.ay, s.bx, s.by) < 60) b.dead = true;
    }
  }
  /** mưa bọt + dịch độc đọng lâu, bám cây cỏ, nhỏ giọt */
  function residue(g, n) {
    for (let i = 0; i < n; i++) {
      const venom = Math.random() < 0.35;
      C.emit({ kind: venom ? 'drip' : 'blob', color: venom ? 'rgba(170,240,40,0.97)' : '#ffffff', edge: '#6fa3c8', x: C.rand(0, C.W), y: C.rand(-60, -10), vx: C.rand(-40, 40), vy: C.rand(250, 600), grav: 900, max: C.rand(1, 1.6), s0: C.rand(7, 16), s1: 5, layer: 2, onDie: venom ? C.venomDrop : null });
    }
  }
  function sceneGoo() { // bọt bám bụi cây, ngọn cỏ, mỏm đá dưới đất
    for (let i = 0; i < 7; i++) C.Decals.add(null, C.rand(0, C.W), C.H - C.rand(50, 90), C.pick([0, 1, 2, 4]), C.rand(130, 200), C.rand(13, 16), 'scene_goo');
  }

  ST.update = function (g, dt) {
    const p = g.player, cl = g.stClones, c = center();
    if (g.ragePhase === 'split') { // tách thân sang 2 bên
      const k = Math.min(1, g.rageT / ST.SPLIT), e = 1 - Math.pow(1 - k, 3);
      cl[0].x = g.stFrom.x - 160 * e; cl[0].y = g.stFrom.y - 110 * e;
      cl[1].x = g.stFrom.x + 160 * e; cl[1].y = g.stFrom.y + 110 * e;
      if (Math.random() < 0.6) for (const q of cl) C.emit({ kind: 'glow', img: C.G.purple, x: q.x, y: q.y, max: 0.5, s0: 50, s1: 10, add: true, layer: 1 });
      if (g.rageT >= ST.SPLIT) { g.ragePhase = 'orbit'; g.rageT = 0; g.stFrom = { x: p.x, y: p.y }; }
      return;
    }
    if (g.ragePhase === 'orbit' || g.ragePhase === 'spray') {
      const lk = Math.min(1, (g.ragePhase === 'orbit' ? g.rageT : 9) / 0.35);
      p.x = C.lerp(g.stFrom.x, c.x, lk); p.y = C.lerp(g.stFrom.y, c.y, lk);   // Calota về tâm ☯
      g.stSpin = g.ragePhase === 'orbit' ? Math.min(5.5, 1.5 + g.rageT * 3) : 2.4;
      g.stAng += g.stSpin * dt;
      const r = ST.ORB_R * (g.ragePhase === 'orbit' ? Math.min(1, 0.3 + g.rageT) : 1);
      cl.forEach((q, i) => { const a = g.stAng + i * Math.PI; const nx = c.x + Math.cos(a) * r, ny = c.y + Math.sin(a) * r * 0.82; q.dir = Math.atan2(ny - q.y, nx - q.x); q.x = nx; q.y = ny; q.a = a; });
      for (const q of cl) C.emit({ kind: 'glow', img: Math.random() < 0.5 ? C.G.purple : C.G.orange, x: q.x, y: q.y, max: 0.6, s0: 30, s1: 6, add: true, layer: 1 });
      C.shake(g.ragePhase === 'spray' ? 9 : 4);
      if (g.ragePhase === 'orbit') {
        for (const e of g.enemies) if (!e.static && !e.dead) for (const q of cl) if (C.dist2(e.x, e.y, q.x, q.y) < 110 * 110) { e.hp -= 600 * dt; if (e.hp <= 0) smother(g, e); }
        if (g.rageT >= ST.ORBIT) { g.ragePhase = 'spray'; g.rageT = 0; C.flash(0.5, '#ffffff'); C.sfx.play('explode'); C.sfx.hiss(1); }
        return;
      }
      // PHUN: luồng bọt bắn theo hướng tiếp tuyến → quét xoay như cánh quạt
      g.stStreams = cl.map(q => { const d = q.a + Math.PI / 2 + Math.PI, m = mouthOf(q, d); return { ax: m.x, ay: m.y, bx: m.x + Math.cos(d) * ST.STREAM, by: m.y + Math.sin(d) * ST.STREAM, d }; });
      hitStreams(g, dt, g.stStreams, 900, 1300);
      for (const s of g.stStreams) for (let i = 0; i < 3; i++) { const t = Math.random(), v = C.rand(300, 700); C.emit({ kind: 'blob', color: '#ffffff', edge: '#6fa3c8', x: C.lerp(s.ax, s.bx, t), y: C.lerp(s.ay, s.by, t), vx: Math.cos(s.d) * v, vy: Math.sin(s.d) * v - 100, grav: 700, max: C.rand(0.6, 1.1), s0: C.rand(6, 14), s1: 4, layer: 2 }); }
      if (Math.random() < 0.35) C.emit({ kind: 'anim', img: 'foam_vortex', x: C.rand(80, C.W - 80), y: C.rand(80, C.H - 120), max: 0.9, s0: C.rand(160, 240), s1: C.rand(280, 380), layer: 2, rot: C.rand(-0.3, 0.3) });
      if (g.rageT > 0.3) residue(g, 8);
      g.stSplatT = (g.stSplatT || 0) - dt;
      if (g.stSplatT <= 0) { g.stSplatT = 0.4; C.Decals.splatScreen(Math.random() < 0.6 ? null : 'venom_decal', C.rand(12, 16)); }
      if (g.rageT >= ST.SPRAY) { g.ragePhase = 'merge'; g.rageT = 0; g.stStreams = null; C.sfx.hiss(0); }
      return;
    }
    if (g.ragePhase === 'merge') { // nhập thân → trắng xóa
      const k = Math.min(1, g.rageT / ST.MERGE);
      for (const q of cl) { q.x = C.lerp(q.x, p.x, k); q.y = C.lerp(q.y, p.y, k); }
      if (g.rageT >= ST.MERGE) {
        C.flash(1.2, '#ffffff'); C.shake(40); C.sfx.play('explode'); C.sfx.play('shieldBreak');
        C.emit({ kind: 'ring', color: 'rgba(255,255,255,0.95)', x: p.x, y: p.y, max: 0.8, s0: 40, s1: 1400, lw: 40, layer: 2 });
        C.emit({ kind: 'ring', color: 'rgba(170,90,255,0.9)', x: p.x, y: p.y, max: 1, s0: 20, s1: 1700, lw: 20, layer: 2 });
        for (const e of g.enemies) if (!e.static && !e.dead && e.x < C.W + 60) smother(g, e);
        for (const B of C.bossList(g)) if (B.state !== 'dying' && B.state !== 'enter') {
          const d = B.damage(2600, 'ult'); if (d) C.dmgText(B.x, B.y - 130, d, '#ffffff', 56);
          for (let i = 0; i < 5; i++) C.Decals.add(B, B.x + C.rand(-150, 150), B.y + C.rand(-120, 120), C.randi(0, 3), C.rand(100, 170), 15);
          if (B.state === 'fight') B.stunT = 3.5;
        }
        g.ebullets.length = 0;
        sceneGoo(); for (let i = 0; i < 5; i++) setTimeout(() => C.Decals.splatScreen(i % 2 ? 'venom_decal' : null, C.rand(13, 16)), i * 160);
        g.rageActive = false; g.ragePhase = null; g.rage = 0; p.inv = 1.5;
        g.stEcho = ST.ECHO; g.stClones = cl;
        g.banner('SONG TRÙNG BAY KÈM 8 GIÂY!', 1.6, 'small');
      }
    }
  };

  /** dư âm: 2 bóng đen bay kèm Calota, phun theo khi Calota phun */
  ST.updateEcho = function (g, dt) {
    if (!(g.stEcho > 0) || !g.stClones || g.rageActive) return;
    const p = g.player; g.stEcho -= dt;
    const off = [[-70, -95], [-70, 95]], t = performance.now() / 1000;
    g.stClones.forEach((q, i) => { q.x = C.lerp(q.x, p.x + off[i][0], dt * 8); q.y = C.lerp(q.y, p.y + off[i][1] + Math.sin(t * 4 + i * 3) * 8, dt * 8); });
    if (C.Chem.active && !p.dead) {
      g.stEchoStreams = g.stClones.map(q => ({ ax: q.x + 60, ay: q.y + 4, bx: q.x + 60 + 460, by: q.y + 4, d: 0 }));
      hitStreams(g, dt, g.stEchoStreams, 220, 160);
    } else g.stEchoStreams = null;
    if (g.stEcho <= 0) { g.stClones = null; g.stEchoStreams = null; for (let i = 0; i < 12; i++) C.emit({ kind: 'glow', img: C.G.purple, x: p.x + C.rand(-90, 90), y: p.y + C.rand(-100, 100), max: 0.5, s0: 30, s1: 4, add: true, layer: 2 }); }
  };

  // ---------------- vẽ ----------------
  function drawStream(ctx, s, H) {
    const st = C.SPRITES.foam_stream, im = C.img.foam_stream; if (!st || !im || !im.naturalWidth) return;
    const t = performance.now() / 1000, f = Math.floor(t * 16) % st.n, len = Math.hypot(s.bx - s.ax, s.by - s.ay);
    ctx.save(); ctx.translate(s.ax, s.ay); ctx.rotate(Math.atan2(s.by - s.ay, s.bx - s.ax)); if (f % 2) ctx.scale(1, -1);
    ctx.drawImage(im, f * st.fw, 0, st.fw, st.fh, -10, -H / 2, len, H); ctx.restore();
  }
  function drawClone(ctx, q, spraying, dir) {
    const t = performance.now() / 1000;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(C.G.purple, q.x - 110, q.y - 110, 220, 220); ctx.restore();
    if (spraying) { const left = Math.cos(dir) < 0; C.spr(ctx, 'shadow_spray', Math.floor(t * 12) % 3, q.x, q.y, 220, { rot: left ? dir - Math.PI : dir, flip: left }); }
    else { const d = q.dir || 0, left = Math.cos(d) < 0; C.spr(ctx, 'shadow_fly', Math.floor(t * 10) % 4, q.x, q.y, 170, { rot: (left ? d - Math.PI : d) * 0.5, flip: left }); }
  }
  ST.drawBehind = function (ctx, g) {
    if (!g.rageActive || g.ragePhase === 'charge' || g.ragePhase === 'split') return;
    const c = center(), t = performance.now() / 1000;
    const k = g.ragePhase === 'orbit' ? Math.min(1, g.rageT / ST.ORBIT) : g.ragePhase === 'merge' ? 1 - g.rageT / ST.MERGE : 1;
    ctx.save(); ctx.globalAlpha = 0.85 * k;
    C.spr(ctx, 'yinyang', 0, c.x, c.y, ST.ORB_R * 1.9 * (0.6 + 0.4 * k), { rot: g.stAng * 0.6 });
    ctx.restore();
    if (g.stStreams) for (const s of g.stStreams) drawStream(ctx, s, 170 + Math.sin(t * 30) * 14);
  };
  ST.drawCalota = function (ctx, g) {
    const p = g.player, t = performance.now() / 1000;
    if (g.ragePhase === 'charge') { // phóng to + aura rực rỡ
      const k = Math.min(1, g.rageT / R.CHARGE);
      C.spr(ctx, 'calota_st_grow', Math.min(3, Math.floor(k * 4)), p.x + Math.sin(t * 70) * 2 * k, p.y, 230 * (1 + 0.7 * k));
      return;
    }
    if (g.ragePhase === 'split') {
      const k = Math.min(1, g.rageT / ST.SPLIT);
      C.spr(ctx, 'calota_st_grow', 3, p.x, p.y, 230 * (1.7 - 0.7 * k));
      ctx.save(); ctx.globalAlpha = k; for (const q of g.stClones) drawClone(ctx, q, false); ctx.restore();
      return;
    }
    C.spr(ctx, 'calota_st_grow', 3, p.x, p.y, 220 + Math.sin(t * 20) * 6);
    if (g.stClones) for (const [i, q] of g.stClones.entries()) drawClone(ctx, q, g.ragePhase === 'spray', g.stStreams ? g.stStreams[i].d : 0);
  };
  ST.drawEcho = function (ctx, g) { // vẽ trước Calota
    if (!(g.stEcho > 0) || !g.stClones || g.rageActive) return;
    if (g.stEchoStreams) for (const s of g.stEchoStreams) drawStream(ctx, s, 90);
    const fade = Math.min(1, g.stEcho / 1.2);
    ctx.save(); ctx.globalAlpha = fade * (g.stEcho < 1.5 && Math.floor(g.stEcho * 10) % 2 ? 0.5 : 1);
    for (const q of g.stClones) drawClone(ctx, q, !!g.stEchoStreams, 0);
    ctx.restore();
  };
  ST.reset = g => { g.stEcho = 0; g.stClones = null; g.stStreams = null; g.stEchoStreams = null; };
})(window.C);
