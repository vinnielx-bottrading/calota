/* CALOTA — nhân vật, đạn, quái thường, vật cản, vật phẩm */
(function (C) {
  const E = C.E = {};

  // ===================== CALOTA =====================
  E.Player = function () {
    return {
      x: 230, y: 360, vx: 0, vy: 0, w: 150, hp: 5, maxHp: 5, shield: 0, inv: 1.5,
      hurtT: 0, dashT: 0, dashCd: 0, fireCd: 0, anim: 0, dead: false, deadT: 0, r: 26
    };
  };
  E.nozzle = p => ({ x: p.x + 62, y: p.y + 22 });

  E.updatePlayer = function (g, dt) {
    const p = g.player, I = C.input;
    p.anim += dt;
    if (p.dead) { p.deadT += dt; p.vy += 900 * dt; p.y += p.vy * dt; p.x += p.vx * dt; return; }
    const sp = 520;
    let tx = I.moveX * sp, ty = I.moveY * sp;
    const d = I.consumeTouchDelta();
    if (I.touch.active || d.x || d.y) { p.x += d.x * 1.35; p.y += d.y * 1.35; tx = ty = 0; }
    p.vx = C.lerp(p.vx, tx, Math.min(1, dt * 14)); p.vy = C.lerp(p.vy, ty, Math.min(1, dt * 14));
    // lướt
    p.dashCd -= dt;
    if (I.dashPressed && p.dashCd <= 0 && !g.ultActive) {
      p.dashT = 0.24; p.dashCd = 1.1; p.inv = Math.max(p.inv, 0.42); C.sfx.play('dash');
      const mx = I.moveX || (d.x > 0 ? 1 : d.x < 0 ? -1 : 1), my = I.moveY;
      p.dvx = mx * 1300; p.dvy = my * 1100;
      for (let i = 0; i < 8; i++) C.emit({ kind: 'glow', img: C.G.white, x: p.x - 40, y: p.y + C.rand(-30, 30), vx: -C.rand(200, 500), max: 0.3, s0: 12, s1: 2, add: true, layer: 1 });
    }
    if (p.dashT > 0) { p.dashT -= dt; p.x += p.dvx * dt; p.y += p.dvy * dt; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = C.clamp(p.x, 70, C.W - 120); p.y = C.clamp(p.y, 60, C.H - 60);
    p.inv -= dt; p.hurtT -= dt;
    // bắn tự động (tạm ngưng khi Siêu phun)
    p.fireCd -= dt;
    if (p.fireCd <= 0 && !g.ultActive && g.state === 'play') {
      p.fireCd = 0.12;
      const n = E.nozzle(p);
      g.bullets.push({ x: n.x + 10, y: n.y - 6, vx: 1150, vy: 0, dmg: 6, r: 8 });
      if (g.power2) g.bullets.push({ x: n.x + 6, y: n.y - 6, vx: 1100, vy: -120, dmg: 4, r: 7 }, { x: n.x + 6, y: n.y - 6, vx: 1100, vy: 120, dmg: 4, r: 7 });
      C.sfx.play('shoot');
    }
  };
  E.hurtPlayer = function (g, dmg) {
    const p = g.player;
    if (p.inv > 0 || p.dead || g.ultActive || g.state !== 'play') return false;
    if (p.shield > 0) { p.shield = 0; p.inv = 1; C.sfx.play('shieldBreak'); C.flash(0.3, '#7fd8ff'); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; C.emit({ kind: 'glow', img: C.G.teal, x: p.x, y: p.y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, drag: 3, max: 0.5, s0: 14, s1: 4, add: true, layer: 2 }); } return true; }
    p.hp -= dmg; p.inv = 1.4; p.hurtT = 0.45; C.shake(14); C.flash(0.35, '#ff3b30'); C.sfx.play('hurt');
    p.vx = -500;
    for (let i = 0; i < 6; i++) C.emit({ kind: 'glow', img: C.G.white, x: p.x, y: p.y, vx: C.rand(-300, 300), vy: C.rand(-300, 300), drag: 3, max: 0.4, s0: 10, s1: 2, add: true, layer: 2 });
    if (p.hp <= 0) { p.dead = true; p.vy = -420; p.vx = -80; g.onPlayerDead(); }
    return true;
  };
  E.drawPlayer = function (ctx, g) {
    const p = g.player;
    if (p.inv > 0 && !p.dead && Math.floor(p.inv * 20) % 2 === 0 && p.hurtT < 0) ctx.globalAlpha = 0.45;
    const tilt = C.clamp(p.vy / 1400, -0.18, 0.22);
    if (p.dead) C.spr(ctx, 'calota_fall', 0, p.x, p.y, 160, { rot: p.deadT * 6 });
    else if (p.hurtT > 0) C.spr(ctx, 'calota_hurt', Math.floor(p.anim * 10), p.x, p.y, 156, { rot: tilt });
    else if (p.dashT > 0 || g.ultActive) C.spr(ctx, 'calota_dash', Math.floor(p.anim * 14), p.x - 6, p.y + 2, 172, { rot: g.ultActive ? 0 : tilt });
    else C.spr(ctx, 'calota_fly', Math.floor(p.anim * 16), p.x, p.y, 150, { rot: tilt });
    ctx.globalAlpha = 1;
    if (p.shield > 0 && !p.dead) {
      const t = p.anim;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.15 * Math.sin(t * 8); ctx.drawImage(C.G.teal, p.x - 95, p.y - 95, 190, 190);
      ctx.strokeStyle = 'rgba(150,230,255,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 78 + 3 * Math.sin(t * 6), 0, 7); ctx.stroke();
      ctx.restore();
    }
  };

  // ===================== ĐẠN =====================
  E.drawBullets = function (ctx, g) {
    for (const b of g.bullets) {
      const a = Math.atan2(b.vy, b.vx);
      ctx.fillStyle = '#ffb21e'; ctx.strokeStyle = '#6a2c00'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(b.x, b.y, 15, 6.5, a, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.ellipse(b.x + 3, b.y - 1.5, 7, 2.5, a, 0, 7); ctx.fill();
    }
    for (const b of g.ebullets) {
      if (b.kind === 'spike') C.spr(ctx, 'spikeball', 0, b.x, b.y, b.r * 2.6, { rot: b.rot });
      else { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(C.G.red, b.x - b.r * 2, b.y - b.r * 2, b.r * 4, b.r * 4); ctx.globalCompositeOperation = 'source-over'; }
    }
  };

  // ===================== QUÁI THƯỜNG & VẬT CẢN =====================
  // type: beetle | eagle | rock | vine | pillarTop | pillarBot
  E.spawn = function (g, type, o) {
    o = o || {};
    const e = { type, t: 0, x: o.x || C.W + 120, y: o.y || 360, y0: o.y || 360, hp: 1, maxHp: 1, r: 40, dead: false, flash: 0, corr: 0, ...o };
    switch (type) {
      case 'beetle': e.hp = 30; e.r = 34; e.w = 96; e.speed = o.speed || 240; e.amp = o.amp == null ? 60 : o.amp; e.freq = o.freq || 3; e.score = 100; break;
      case 'eagle': e.hp = 80; e.r = 42; e.w = 130; e.speed = 330; e.phase = 'enter'; e.score = 220; break;
      case 'rock': e.hp = 160; e.r = 52; e.w = 120; e.speed = o.speed || 170; e.rotS = C.rand(-1, 1); e.score = 150; e.solid = true; break;
      case 'vine': e.hp = 90; e.r = 50; e.w = 150; e.speed = 200; e.sprayOnly = true; e.score = 180; e.solid = true; break;
      case 'pillarTop': e.hp = Infinity; e.w = o.w || 250; e.speed = 200; e.static = true; e.solid = true; e.h = C.sprH('pillar_top', e.w); e.y = e.h / 2 - (o.cut || 30); break;
      case 'pillarBot': e.hp = Infinity; e.w = o.w || 230; e.speed = 200; e.static = true; e.solid = true; e.h = C.sprH('pillar_bottom', e.w); e.y = C.H - e.h / 2 + (o.cut || 30); break;
    }
    e.maxHp = e.hp; g.enemies.push(e); return e;
  };
  /** danh sách vòng tròn va chạm của 1 vật */
  E.circles = function (e) {
    if (e.type === 'pillarTop') {
      const top = e.y - e.h / 2;
      return [[0.15, 0.36], [0.38, 0.3], [0.6, 0.22], [0.8, 0.13]].map(([f, r]) => [e.x - e.w * 0.02, top + e.h * f, e.w * r]);
    }
    if (e.type === 'pillarBot') {
      const top = e.y - e.h / 2;
      return [[0.12, 0.34], [0.32, 0.26], [0.52, 0.24], [0.72, 0.24], [0.92, 0.24]].map(([f, r]) => [e.x + e.w * 0.02, top + e.h * f, e.w * r]);
    }
    return [[e.x, e.y, e.r]];
  };
  E.updateEnemy = function (g, e, dt) {
    e.t += dt; e.flash -= dt; if (e.corr > 0) e.corr -= dt * 0.8;
    const p = g.player;
    switch (e.type) {
      case 'beetle': e.x -= e.speed * dt; e.y = e.y0 + Math.sin(e.t * e.freq) * e.amp; break;
      case 'eagle':
        if (e.phase === 'enter') { e.x -= e.speed * dt; e.y = C.lerp(e.y, p.y, dt * 0.8); if (e.x < (e.stopX || 980)) { e.phase = 'aim'; e.t = 0; C.sfx.play('warn'); } }
        else if (e.phase === 'aim') { e.x += Math.sin(e.t * 40) * 1.2; if (e.t > 0.55) { e.phase = 'dive'; const a = Math.atan2(p.y - e.y, p.x - e.x); e.dvx = Math.cos(a) * 720; e.dvy = Math.sin(a) * 720; } }
        else { e.x += e.dvx * dt; e.y += e.dvy * dt; }
        break;
      case 'rock': e.x -= e.speed * dt; e.y = e.y0 + Math.sin(e.t * 1.4) * 18; e.rot = (e.rot || 0) + e.rotS * dt; break;
      case 'vine': e.x -= e.speed * dt; e.y = e.y0 + Math.sin(e.t * 2) * 10; break;
      default: e.x -= e.speed * dt;
    }
    if (e.x < -300 || e.y < -250 || e.y > C.H + 250) e.dead = 'gone';
  };
  E.drawEnemy = function (ctx, e) {
    const flash = e.flash > 0;
    const corr = Math.min(1, e.corr / 2);
    const draw = (name, f, x, y, w, o) => {
      if (flash) C.sprTint(ctx, name, f, x, y, w, '#ffffff', 0.7, o);
      else if (corr > 0.05) C.sprTint(ctx, name, f, x, y, w, '#59ff3a', corr * 0.55, o);
      else C.spr(ctx, name, f, x, y, w, o);
    };
    switch (e.type) {
      case 'beetle': draw('beetle', Math.floor(e.t * 14), e.x, e.y, e.w); break;
      case 'eagle': {
        const f = e.phase === 'dive' ? 2 : Math.floor(e.t * 10);
        draw('eagle', f, e.x, e.y, e.w, { rot: e.phase === 'dive' ? C.angleDiff(Math.atan2(e.dvy, e.dvx), Math.PI) : 0 });
        if (e.phase === 'aim') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(e.t * 40); ctx.drawImage(C.G.red, e.x - 70, e.y - 50, 60, 60); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
        break;
      }
      case 'rock': case 'vine':
        ctx.save(); ctx.shadowColor = 'rgba(120,0,0,0.6)'; ctx.shadowBlur = 14;
        draw(e.type === 'rock' ? 'crystal_rock' : 'thorn_vine', 0, e.x, e.y, e.w, { rot: e.rot }); ctx.restore(); break;
      case 'pillarTop': case 'pillarBot':
        // bóng tối viền để tách vật cản khỏi nền cùng tông
        ctx.save(); ctx.shadowColor = 'rgba(40,10,0,0.75)'; ctx.shadowBlur = 18;
        C.spr(ctx, e.type === 'pillarTop' ? 'pillar_top' : 'pillar_bottom', 0, e.x, e.y, e.w); ctx.restore(); break;
    }
    if (e.maxHp > 60 && e.maxHp !== Infinity && e.hp < e.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - 30, e.y - e.r - 18, 60, 6);
      ctx.fillStyle = e.sprayOnly ? '#9dff3a' : '#ff6b3a'; ctx.fillRect(e.x - 30, e.y - e.r - 18, 60 * Math.max(0, e.hp / e.maxHp), 6);
    }
  };

  // ===================== VẬT PHẨM =====================
  E.drop = function (g, kind, x, y) { g.items.push({ kind, x, y, vx: -120, vy: C.rand(-80, 80), t: 0 }); };
  E.updateItems = function (g, dt) {
    const p = g.player;
    for (const it of g.items) {
      it.t += dt;
      const d2 = C.dist2(it.x, it.y, p.x, p.y);
      if (d2 < 220 * 220 && !p.dead) { const d = Math.sqrt(d2) || 1; it.vx = C.lerp(it.vx, (p.x - it.x) / d * 700, dt * 6); it.vy = C.lerp(it.vy, (p.y - it.y) / d * 700, dt * 6); }
      else { it.vy *= Math.exp(-dt * 2); it.vx = C.lerp(it.vx, -120, dt); }
      it.x += it.vx * dt; it.y += it.vy * dt;
      if (d2 < 55 * 55 && !p.dead) { it.taken = true; g.pickup(it); }
      if (it.x < -80) it.taken = true;
    }
    g.items = g.items.filter(i => !i.taken);
  };
  E.drawItems = function (ctx, g) {
    const names = { coin: 'item_coin', shield: 'item_shield', bolt: 'item_bolt', heart: 'item_heart' };
    for (const it of g.items) {
      const s = it.kind === 'coin' ? 42 : 64, bob = Math.sin(it.t * 5) * 4;
      if (it.kind !== 'coin') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45; ctx.drawImage(it.kind === 'bolt' ? C.G.lime : C.G.white, it.x - s, it.y - s + bob, s * 2, s * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
      C.spr(ctx, names[it.kind], 0, it.x, it.y + bob, s);
    }
  };
})(window.C);
