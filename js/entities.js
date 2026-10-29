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
  // miệng Calota (điểm bắt đầu luồng bọt) — tính từ sprite phun
  const SPRAY_W = 230, SPRAY_OX = 18, SPRAY_OY = -4;
  E.nozzle = p => { const m = C.SPRITES.calota_spray, s = SPRAY_W / m.fw; return { x: p.x + SPRAY_OX + (m.mx - m.fw / 2) * s, y: p.y + SPRAY_OY + (m.my - m.fh / 2) * s }; };

  E.updatePlayer = function (g, dt) {
    const p = g.player, I = C.input;
    p.anim += dt;
    if (p.dead) { p.deadT += dt; p.vy += 900 * dt; p.y += p.vy * dt; p.x += p.vx * dt; return; }
    if (g.rageActive) { p.vx = p.vy = 0; p.inv -= dt; I.consumeTouchDelta(); return; } // đứng yên gồng
    p.slowT = Math.max(0, (p.slowT || 0) - dt);
    const slow = p.slowT > 0 ? 0.5 : 1; // dính băng → chậm
    const sp = 520 * slow;
    let tx = I.moveX * sp, ty = I.moveY * sp;
    const d = I.consumeTouchDelta();
    if (I.touch.active || d.x || d.y) { p.x += d.x * 1.35 * slow; p.y += d.y * 1.35 * slow; tx = ty = 0; }
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
      // SÚNG 3 CẤP: nhặt xu để lên cấp, trúng đòn tụt 1 cấp
      const lv = g.gunLv || 1; p.fireCd = lv === 3 ? 0.085 : 0.09;
      const n = E.nozzle(p), bx = n.x + 12, by = n.y + 2, V = 1250;
      const shot = (ang, dmg, r) => g.bullets.push({ x: bx, y: by, vx: Math.cos(ang) * V, vy: Math.sin(ang) * V, dmg, r, lv });
      shot(0, lv === 3 ? 12 : 10, lv === 3 ? 11 : 9);
      if (lv >= 2) { shot(-0.09, 6, 8); shot(0.09, 6, 8); }
      if (lv >= 3) { shot(-0.2, 4, 7); shot(0.2, 4, 7); }
      C.emit({ kind: 'glow', img: C.G.orange, x: bx, y: by, max: 0.06, s0: 16 + lv * 4, s1: 22 + lv * 4, add: true, layer: 2 });
      C.sfx.play('shoot');
    }
  };
  E.hurtPlayer = function (g, dmg) {
    const p = g.player;
    if (p.inv > 0 || p.dead || g.ultActive || g.rageActive || g.state !== 'play') return false;
    C.Rage.add(g, 12); // trúng đòn → nộ tăng
    if (p.shield > 0) { p.shield = 0; p.inv = 1; C.sfx.play('shieldBreak'); C.flash(0.3, '#7fd8ff'); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; C.emit({ kind: 'glow', img: C.G.teal, x: p.x, y: p.y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, drag: 3, max: 0.5, s0: 14, s1: 4, add: true, layer: 2 }); } return true; }
    if ((g.gunLv || 1) > (g.gate.minGun || 1)) { g.gunLv--; g.gunXP = 0; g.banner('Súng tụt cấp ' + g.gunLv, 1.2, 'small'); }
    p.hp -= dmg; p.inv = 1.4; p.hurtT = 0.45; C.shake(14); C.flash(0.35, '#ff3b30'); C.sfx.play('hurt');
    p.vx = -500;
    for (let i = 0; i < 6; i++) C.emit({ kind: 'glow', img: C.G.white, x: p.x, y: p.y, vx: C.rand(-300, 300), vy: C.rand(-300, 300), drag: 3, max: 0.4, s0: 10, s1: 2, add: true, layer: 2 });
    if (p.hp <= 0) { p.dead = true; p.vy = -420; p.vx = -80; g.onPlayerDead(); }
    return true;
  };
  E.drawPlayer = function (ctx, g) {
    const p = g.player;
    C.ST.drawEcho(ctx, g);
    if (g.rageActive) { C.Rage.drawCalota(ctx, g); return; }
    if (C.Venom.draw(ctx, g)) { drawShield(ctx, p); drawFrost(ctx, p); return; }
    if (p.inv > 0 && !p.dead && Math.floor(p.inv * 20) % 2 === 0 && p.hurtT < 0) ctx.globalAlpha = 0.45;
    const tilt = C.clamp(p.vy / 1400, -0.18, 0.22);
    if (p.dead) C.spr(ctx, 'calota_fall', 0, p.x, p.y, 160, { rot: p.deadT * 6 });
    else if (p.hurtT > 0) C.spr(ctx, 'calota_hurt', Math.floor(p.anim * 10), p.x, p.y, 156, { rot: tilt });
    else if (g.cutin > 0) C.spr(ctx, 'calota_spray', 0, p.x + SPRAY_OX, p.y + SPRAY_OY, SPRAY_W * (1 + 0.06 * Math.sin(p.anim * 40))); // phồng má lấy đà
    else if (C.Chem.active) C.spr(ctx, 'calota_spray', C.Chem.power < 0.5 ? 0 : 1 + (Math.floor(p.anim * 12) % 2), p.x + SPRAY_OX, p.y + SPRAY_OY, SPRAY_W);
    else if (p.dashT > 0) C.spr(ctx, 'calota_dash', Math.floor(p.anim * 14), p.x - 6, p.y + 2, 172, { rot: tilt });
    else C.spr(ctx, 'calota_fly', Math.floor(p.anim * 16), p.x, p.y, 150, { rot: tilt });
    ctx.globalAlpha = 1;
    drawShield(ctx, p); drawFrost(ctx, p);
  };
  function drawFrost(ctx, p) { // bị đóng băng: lớp sương xanh + tinh thể
    if (!(p.slowT > 0) || p.dead) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.7, p.slowT * 0.5); ctx.drawImage(C.G.ice, p.x - 90, p.y - 80, 180, 160); ctx.restore();
    if (Math.random() < 0.3) C.emit({ kind: 'glow', img: C.G.ice, x: p.x + C.rand(-40, 40), y: p.y + C.rand(-30, 30), vy: 30, max: 0.5, s0: 8, s1: 2, add: true, layer: 2 });
  }
  function drawShield(ctx, p) {
    if (!(p.shield > 0) || p.dead) return;
    const t = p.anim;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 + 0.15 * Math.sin(t * 8); ctx.drawImage(C.G.teal, p.x - 95, p.y - 95, 190, 190);
    ctx.strokeStyle = 'rgba(150,230,255,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 78 + 3 * Math.sin(t * 6), 0, 7); ctx.stroke();
    ctx.restore();
  }

  // ===================== ĐẠN =====================
  E.drawBullets = function (ctx, g) {
    for (const b of g.bullets) {
      const a = Math.atan2(b.vy, b.vx);
      const k = b.r / 9;
      ctx.strokeStyle = 'rgba(255,190,60,0.45)'; ctx.lineWidth = 6 * k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(b.x - Math.cos(a) * 34 * k, b.y - Math.sin(a) * 34 * k); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.fillStyle = b.lv === 3 ? '#ff8a1e' : '#ffb21e'; ctx.strokeStyle = '#6a2c00'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(b.x, b.y, 16 * k, 7 * k, a, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.ellipse(b.x + 3, b.y - 1.5, 7 * k, 2.5 * k, a, 0, 7); ctx.fill();
    }
    for (const b of g.ebullets) {
      if (b.kind === 'spike') C.spr(ctx, 'spikeball', 0, b.x, b.y, b.r * 2.6, { rot: b.rot });
      else if (b.kind === 'venom') C.spr(ctx, 'g2_proj_big', 0, b.x, b.y, b.r * 3.6, { rot: Math.atan2(b.vy, b.vx) + Math.PI });
      else if (b.spr) C.spr(ctx, b.spr, 0, b.x, b.y, b.r * (b.sz || 3.4), { rot: b.face ? Math.atan2(b.vy, b.vx) + Math.PI : b.rot });
      else if (b.kind === 'glob') C.spr(ctx, 'g2_venom_glob', 0, b.x, b.y, b.r * 3.2, { rot: b.rot });
      else { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(C.G.red, b.x - b.r * 2, b.y - b.r * 2, b.r * 4, b.r * 4); ctx.globalCompositeOperation = 'source-over'; }
    }
  };

  // ===================== QUÁI THƯỜNG & VẬT CẢN =====================
  // type: beetle | eagle | rock | vine | pillarTop | pillarBot
  E.spawn = function (g, type, o) {
    o = o || {};
    const e = { type, t: 0, x: o.x || C.W + 120, y: o.y || 360, y0: o.y || 360, hp: 1, maxHp: 1, r: 40, dead: false, flash: 0, corr: 0, ...o };
    switch (type) {
      case 'beetle': e.hp = 45; e.r = 38; e.w = 118; e.shootT = Math.random() < (g.gate ? C.gateRule(g.gate.id).shooterChance : 0.45) ? C.rand(1.2, 3) : Infinity; /* tỉ lệ bọ có nạp đạn tăng theo cửa */ e.speed = o.speed || 240; e.amp = o.amp == null ? 60 : o.amp; e.freq = o.freq || 3; e.score = 100; break;
      case 'eagle': e.hp = 140; e.r = 46; e.w = 150; e.speed = 330; e.phase = 'enter'; e.score = 220; break;
      case 'rock': e.hp = 260; e.r = 52; e.w = 120; e.speed = o.speed || 170; e.rotS = C.rand(-1, 1); e.score = 150; e.solid = true; break;
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
  /** quái bắn 1 viên gai nhắm vào Calota. muzzle ≈ đầu nòng ở phía trên-trái thân */
  E.enemyShot = function (g, e, r, speed, ox, oy) {
    const x = e.x + e.w * ox, y = e.y + e.w * oy, p = g.player;
    const a = Math.atan2(p.y - y, p.x - x);
    g.ebullets.push({ kind: 'spike', x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r, rot: 0, vr: C.rand(-6, 6), hp: r > 20 ? 2 : 1 });
    C.emit({ kind: 'img', img: 'muzzle', x: x - 30, y, max: 0.15, s0: r * 4, s1: r * 5, layer: 2, rot: Math.PI });
    C.sfx.play(r > 20 ? 'bossShot' : 'hit');
  };
  E.updateEnemy = function (g, e, dt) {
    e.t += dt; e.flash -= dt; if (e.corr > 0) e.corr -= dt * 0.8;
    const p = g.player;
    switch (e.type) {
      case 'beetle': // Bọ Lá Răng Nanh: bay lượn, thỉnh thoảng nã 1 viên gai từ ống pháo trên lưng
        e.x -= e.speed * dt; e.y = e.y0 + Math.sin(e.t * e.freq) * e.amp;
        e.shootT -= dt;
        if (e.shootT <= 0 && e.x < C.W - 60 && e.x > p.x + 160 && !p.dead) { e.shootT = C.rand(2.4, 3.8); e.shotAt = e.t; }
        if (e.shotAt != null && e.t - e.shotAt > 0.22 && !e.fired) { e.fired = true; E.enemyShot(g, e, 14, 400, -0.42, -0.26); }
        if (e.shotAt != null && e.t - e.shotAt > 0.55) { e.shotAt = null; e.fired = false; }
        break;
      case 'eagle': // Kền Kền ống lồng 3 tầng: dừng lại, kéo dài nòng, nã 1 phát nặng giật lùi, rồi bổ nhào
        if (e.phase === 'enter') { e.x -= e.speed * dt; e.y = C.lerp(e.y, p.y, dt * 0.8); if (e.x < (e.stopX || 980) + (C.W - 1280)) { e.phase = 'aim'; e.t = 0; C.sfx.play('warn'); } }
        else if (e.phase === 'aim') { e.y = C.lerp(e.y, p.y, dt * 1.5); if (e.t > 0.7) { e.phase = 'fire'; e.t = 0; E.enemyShot(g, e, 24, 600, -0.4, -0.3); e.x += 40; C.shake(5); } }
        else if (e.phase === 'fire') { if (e.t > 0.7) { e.phase = 'dive'; const a = Math.atan2(p.y - e.y, p.x - e.x); e.dvx = Math.cos(a) * 720; e.dvy = Math.sin(a) * 720; } }
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
      else if (corr > 0.05) C.sprTint(ctx, name, f, x, y, w, '#f2faff', corr * 0.6, o);
      else C.spr(ctx, name, f, x, y, w, o);
    };
    switch (e.type) {
      case 'beetle':
        if (e.shotAt != null) draw('beetle_shoot', Math.min(3, Math.floor((e.t - e.shotAt) / 0.14)), e.x, e.y, e.w);
        else draw('beetle', Math.floor(e.t * 12), e.x, e.y, e.w);
        break;
      case 'eagle': {
        const rot = e.phase === 'dive' ? C.angleDiff(Math.atan2(e.dvy, e.dvx), Math.PI) : 0;
        if (e.phase === 'aim') draw('eagle_shoot', e.t < 0.35 ? 0 : 1, e.x, e.y, e.w);                 // kéo dài nòng lồng
        else if (e.phase === 'fire') draw('eagle_shoot', e.t < 0.2 ? 2 : 3, e.x, e.y, e.w);            // nổ nòng + khói
        else draw('eagle', Math.floor(e.t * 10), e.x, e.y, e.w, { rot });
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
  E.drop = function (g, kind, x, y, o) { const it = { kind, x, y, vx: -120, vy: C.rand(-80, 80), t: 0 }; if (o) Object.assign(it, o); g.items.push(it); return it; };
  E.updateItems = function (g, dt) {
    const p = g.player;
    for (const it of g.items) {
      it.t += dt;
      const d2 = C.dist2(it.x, it.y, p.x, p.y);
      if (it.wave) { // tim boss rơi: trôi chậm lượn sóng, hút rất ngắn → phải tự bay tới nhặt
        it.x += it.vx * dt; it.y = it.y0 + Math.sin(it.t * 2.2) * 110;
        if (d2 < 70 * 70 && !p.dead) { it.taken = true; g.pickup(it); }
        if (it.x < -80) it.taken = true;
        continue;
      }
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
      const s = it.kind === 'coin' ? 42 : it.wave ? 84 + Math.sin(it.t * 8) * 8 : 64, bob = Math.sin(it.t * 5) * 4;
      if (it.wave) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(it.t * 8); ctx.drawImage(C.G.red, it.x - s * 1.4, it.y - s * 1.4, s * 2.8, s * 2.8); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
      if (it.kind !== 'coin') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45; ctx.drawImage(it.kind === 'bolt' ? C.G.lime : C.G.white, it.x - s, it.y - s + bob, s * 2, s * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
      C.spr(ctx, names[it.kind], 0, it.x, it.y + bob, s);
    }
  };
})(window.C);
