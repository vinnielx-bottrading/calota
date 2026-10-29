/* CALOTA — GIÁP NỌC ĐỘC (mở từ cửa 3)
   Calota phủ một lớp giáp nọc độc xanh phát sáng khắp thân trong 6 giây:
   - quái chạm vào Calota thì QUÁI mất máu (Calota không bị thương vì quái/vật cản nhỏ)
   - đạn và cú húc của boss vẫn gây đau (không phải bất tử); chạm boss thì đốt boss + cộng Ngộp bọt
   - giọt nọc văng lộp độp theo đường bay, trúng quái thì đốt + bám, rơi xuống đất thành vũng lâu tan
   Khác chiêu PHUN (miệng) và TUYỆT MỆNH. Tốn 35% thanh Dịch Độc, hồi 14 giây. */
(function (C) {
  const V = C.Venom = { COST: 35, CD: 14, DUR: 6, ON: 0.45, UNLOCK: 3, TOUCH_DPS: 280, BOSS_DPS: 320, DROP_DMG: 28 };

  V.unlocked = g => !!(g.gate && g.gate.id >= V.UNLOCK) || !!(C.debug && C.debug.venom);
  V.reset = g => { g.venomT = 0; g.venomOn = 0; g.venomCD = 0; g.venomDripT = 0; g.vdrops = []; };
  V.active = g => g.venomT > 0;
  V.ready = g => V.unlocked(g) && !(g.venomT > 0) && (g.venomCD || 0) <= 0 && g.gauge >= V.COST;

  V.start = function (g) {
    const p = g.player;
    g.gauge -= V.COST; g.venomOn = V.ON; g.venomT = V.DUR + V.ON; g.venomCD = V.CD;
    C.sfx.play('shield'); C.sfx.play('sizzle');
    g.banner('GIÁP NỌC ĐỘC!', 1.3, 'small');
    C.emit({ kind: 'ring', color: 'rgba(170,255,60,0.9)', x: p.x, y: p.y, max: 0.45, s0: 30, s1: 260, lw: 16, layer: 2 });
    for (let i = 0; i < 24; i++) { const a = C.rand(0, 6.283), v = C.rand(200, 520); C.emit({ kind: 'blob', color: '#b6f23a', edge: '#3d7a10', x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, grav: 700, max: C.rand(0.5, 0.9), s0: C.rand(5, 10), s1: 3, layer: 2, onDie: C.venomDrop }); }
  };

  V.update = function (g, dt) {
    const p = g.player, I = C.input;
    g.venomCD = Math.max(0, (g.venomCD || 0) - dt);
    if (I.venomPressed && !p.dead && !g.rageActive && !g.ultActive) {
      if (V.ready(g)) V.start(g);
      else if (V.unlocked(g) && !(g.venomT > 0)) { C.sfx.play('hit'); g.banner(g.gauge < V.COST ? 'Cần 35% DỊCH ĐỘC' : 'Giáp nọc đang hồi…', 0.9, 'small'); }
    }
    // giọt nọc đã văng ra: trúng quái thì đốt + bám
    if (g.vdrops && g.vdrops.length) {
      for (const d of g.vdrops) {
        if (d.t >= d.max) { d.gone = true; continue; }
        for (const e of g.enemies) {
          if (e.dead || e.static || e.hp === Infinity) continue;
          if (C.dist2(d.x, d.y, e.x, e.y) < (e.r + 10) * (e.r + 10)) {
            e.hp -= V.DROP_DMG; e.corr = Math.max(e.corr, 1.5); e.flash = 0.06;
            if (Math.random() < 0.5) C.Decals.add(e, d.x, d.y, C.pick([0, 2, 3, 5]), C.rand(34, 56), 7, 'venom_decal');
            if (e.hp <= 0) g.killEnemy(e, true);
            d.t = d.max; d.gone = true; break;
          }
        }
      }
      g.vdrops = g.vdrops.filter(d => !d.gone);
    }
    if (!(g.venomT > 0)) return;
    g.venomT -= dt; g.venomOn = Math.max(0, g.venomOn - dt);
    if (g.venomT <= 0 || p.dead) { g.venomT = 0; return; }
    // nhỏ giọt + văng ngược ra sau theo đà bay
    g.venomDripT -= dt;
    while (g.venomDripT <= 0) {
      g.venomDripT += 0.045;
      const big = Math.random() < 0.35;
      const d = C.emit({ kind: big ? 'blob' : 'drip', color: big ? '#b6f23a' : 'rgba(170,240,40,0.97)', edge: '#3d7a10', x: p.x + C.rand(-46, 34), y: p.y + C.rand(-30, 44), vx: -C.rand(60, 260) + p.vx * 0.2, vy: C.rand(-80, 60), grav: 950, max: C.rand(0.7, 1.3), s0: big ? C.rand(5, 9) : C.rand(5, 8), s1: 3, layer: 2, onDie: C.venomDrop });
      g.vdrops.push(d);
    }
    if (Math.random() < dt * 14) C.emit({ kind: 'bubble', color: 'rgba(170,255,70,0.95)', x: p.x + C.rand(-50, 40), y: p.y + C.rand(-50, 40), vx: -C.rand(40, 120), vy: -C.rand(20, 80), max: C.rand(0.4, 0.8), s0: 3, s1: 9, layer: 2 });
  };

  /** quái/vật cản chạm Calota khi đang khoác giáp → trả về true nếu giáp đã xử lý (Calota không bị thương) */
  V.touch = function (g, e, dt) {
    if (!(g.venomT > 0) || e.static) return false;
    e.hp -= V.TOUCH_DPS * dt; e.corr = 3; e.flash = 0.05;
    e.x += 160 * dt; // bị đẩy lùi
    if (Math.random() < dt * 8) C.Decals.add(e, e.x + C.rand(-e.r, e.r * 0.4), e.y + C.rand(-e.r * 0.6, e.r * 0.6), C.pick([0, 2, 3]), C.rand(40, 70), 7, 'venom_decal');
    if (Math.random() < dt * 20) C.emit({ kind: 'glow', img: C.G.goo, x: e.x + C.rand(-20, 20), y: e.y + C.rand(-20, 20), max: 0.3, s0: 20, s1: 50, add: true, layer: 2 });
    if (e.hp <= 0) g.killEnemy(e, true);
    return true;
  };
  /** chạm boss khi đang khoác giáp: đốt boss (Calota vẫn bị thương do va chạm) */
  V.touchBoss = function (g, B, dt) {
    if (!(g.venomT > 0)) return;
    B.damage(V.BOSS_DPS * dt, 'spray'); if (B.onSprayed) B.onSprayed(dt * 2, false);
  };

  V.draw = function (ctx, g) { // vẽ Calota khi đang kích hoạt / khoác giáp. Trả về true nếu đã vẽ
    const p = g.player;
    if (!(g.venomT > 0) || p.dead) return false;
    const t = p.anim, tilt = C.clamp(p.vy / 1400, -0.18, 0.22);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4 + 0.15 * Math.sin(t * 9);
    ctx.drawImage(C.G.goo, p.x - 110, p.y - 100, 220, 200); ctx.restore();
    if (g.venomOn > 0) { C.spr(ctx, 'calota_venom_on', Math.min(2, Math.floor((1 - g.venomOn / V.ON) * 3)), p.x + 4, p.y + 6, 196); return true; }
    if (C.Chem.active || p.hurtT > 0 || g.cutin > 0) return false; // phun / trúng đòn → dùng ảnh thường, lớp sáng nọc vẫn còn
    const end = g.venomT < 1 && Math.floor(g.venomT * 12) % 2 === 0; // sắp hết thì nhấp nháy
    C.spr(ctx, 'calota_venom_fly', Math.floor(t * 12), p.x - 2, p.y + 10, 172, { rot: tilt, alpha: end ? 0.6 : 1 });
    return true;
  };
})(window.C);
