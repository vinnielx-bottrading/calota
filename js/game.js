/* CALOTA — vòng lặp game, va chạm, chiêu phun, Siêu phun */
(function (C) {
  const E = C.E;
  const SPRAY_DPS = 150, ULT_DPS = 520, MINION_SPRAY_DPS = 220;
  const GAUGE_DRAIN = 22, GAUGE_PASSIVE = 2.5;

  const g = C.game = {
    state: 'loading', t: 0, gate: null, bgX: 0,
    player: null, bullets: [], ebullets: [], enemies: [], items: [], boss: null,
    gauge: 0, score: 0, coins: 0, kills: 0, events: [], evI: 0,
    banners: [], ultActive: false, ultT: 0, cutin: 0, bossT: 0, sprayAcc: 0, sprayAccT: 0, checkpoint: false
  };

  g.start = function (gateIdx, fromBoss) {
    g.gate = C.GATES[gateIdx || 0];
    g.player = E.Player(); g.bullets = []; g.ebullets = []; g.enemies = []; g.items = []; g.boss = null;
    C.particles.length = 0; g.banners = [];
    g.gauge = fromBoss ? 60 : 20; g.score = fromBoss ? g.checkpointScore || 0 : 0; g.coins = fromBoss ? g.checkpointCoins || 0 : 0; g.kills = 0;
    g.ultActive = false; g.ultT = 0; g.cutin = 0; C.Chem.power = 0; C.Chem.ult = false;
    g.events = g.gate.timeline(); g.evI = 0; g.t = 0; g.bossT = 0; g.state = 'play'; g.startedAt = performance.now();
    if (fromBoss) { g.t = g.gate.stageTime - 0.5; while (g.evI < g.events.length && g.events[g.evI].t < g.t) g.evI++; g.player.hp = g.player.maxHp; }
    if (C.debug.ult) g.gauge = 100;
    C.sfx.music(fromBoss ? 'boss' : 'stage');
    C.ui.show(null);
  };

  g.banner = function (text, dur, style) { g.banners.push({ text, t: 0, max: dur || 2, style: style || 'hint' }); };
  g.bossWarning = function () {
    g.banner('⚠ CẢNH BÁO: BOSS ĐANG ĐẾN ⚠', 3.4, 'warn');
    let n = 0; const iv = setInterval(() => { C.sfx.play('warn'); if (++n >= 4) clearInterval(iv); }, 800);
  };
  g.startBoss = function () {
    g.boss = g.gate.makeBoss(g); g.bossT = 0; g.checkpoint = true; g.checkpointScore = g.score; g.checkpointCoins = g.coins;
    C.sfx.music('boss'); g.banner(g.gate.bossName, 2.6, 'boss'); C.shake(12);
  };
  g.onBossDefeated = function () {
    setTimeout(() => {
      if (g.state !== 'play') return;
      g.state = 'win'; C.sfx.play('win'); C.sfx.hiss(0); C.Chem.power = 0; C.Chem.active = false;
      const best = C.store.get('best1', 0); if (g.score > best) C.store.set('best1', g.score);
      C.store.set('clear1', true);
      C.ui.showWin({ score: g.score, coins: g.coins, bossTime: g.bossT, hp: g.player.hp, best: Math.max(best, g.score) });
    }, 1600);
  };
  g.onPlayerDead = function () {
    C.sfx.play('lose'); C.sfx.music(null); C.sfx.hiss(0); g.ultActive = false;
    setTimeout(() => { if (g.state === 'play') { g.state = 'lose'; C.Chem.power = 0; C.Chem.active = false; C.ui.showLose({ score: g.score, boss: !!g.boss, bossHp: g.boss ? g.boss.hp / g.boss.maxHp : 1 }); } }, 1500);
  };
  g.addGauge = function (v) { if (!g.ultActive) g.gauge = C.clamp(g.gauge + v, 0, 100); };
  g.pickup = function (it) {
    switch (it.kind) {
      case 'coin': g.coins++; g.score += 50; C.sfx.play('pickup'); break;
      case 'bolt': g.addGauge(45); C.sfx.play('pickup'); C.dmgText(it.x, it.y - 20, 45, '#b6ff3a', 30); g.banner('+ HÓA CHẤT', 0.9, 'small'); break;
      case 'heart': g.player.hp = Math.min(g.player.maxHp, g.player.hp + 1); C.sfx.play('pickup'); break;
      case 'shield': g.player.shield = 1; C.sfx.play('shield'); break;
    }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; C.emit({ kind: 'glow', img: C.G.white, x: it.x, y: it.y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, drag: 4, max: 0.35, s0: 10, s1: 2, add: true, layer: 2 }); }
  };

  function killEnemy(e, bySpray) {
    e.dead = 'killed'; g.kills++; g.score += e.score || 100; g.addGauge(6);
    if (bySpray) { // tan chảy trong hóa chất
      for (let i = 0; i < 14; i++) C.emit({ kind: 'drop', color: '#b6ff3a', x: e.x + C.rand(-20, 20), y: e.y + C.rand(-20, 20), vx: C.rand(-200, 200), vy: C.rand(-300, 50), grav: 1100, max: C.rand(0.4, 0.8), s0: C.rand(3, 6), s1: 2, add: true, layer: 2 });
      for (let i = 0; i < 4; i++) C.emit({ kind: 'glow', img: C.G.smoke, x: e.x + C.rand(-20, 20), y: e.y, vx: C.rand(-30, 30), vy: C.rand(-120, -50), max: 1, s0: 20, s1: 70, layer: 2, a0: 0.8 });
      C.emit({ kind: 'glow', img: C.G.lime, x: e.x, y: e.y, max: 0.3, s0: 40, s1: 120, add: true, layer: 2 });
      C.sfx.play('sizzle');
    } else C.explode(e.x, e.y, e.w * 1.1);
    C.sfx.play('kill');
    const r = Math.random();
    if (r < 0.28) E.drop(g, 'coin', e.x, e.y); else if (r < 0.34) E.drop(g, 'bolt', e.x, e.y);
  }

  // --------------------- áp dụng luồng phun ---------------------
  function applySpray(dt) {
    const Ch = C.Chem; if (!Ch.active || Ch.power < 0.3) { Ch.hitDist = null; Ch.hitPoint = null; return; }
    const ult = g.ultActive; let nearest = Infinity, hp = null;
    // vật cản chặn luồng (cột đá) — luồng tóe lên bề mặt
    if (!ult) for (const e of g.enemies) if (e.static) for (const [cx, cy, r] of E.circles(e)) {
      const d = Ch.inCone(cx, cy, r * 0.7); if (d >= 0 && d < nearest) { nearest = d - r * 0.5; hp = { x: cx - r * 0.6, y: Ch.y + Math.sin(Ch.dir) * d }; }
    }
    for (const e of g.enemies) {
      if (e.static || e.dead) continue;
      const d = Ch.inCone(e.x, e.y, e.r); if (d < 0 || d > nearest + 40) continue;
      e.hp -= MINION_SPRAY_DPS * (ult ? 4 : 1) * dt; e.corr = Math.min(3, e.corr + dt * 4);
      C.Chem.corrode(e.x, e.y, e.w, e.w * 0.8, 0.6);
      if (e.hp <= 0) killEnemy(e, true);
    }
    // đạn gai của boss bị hòa tan
    for (const b of g.ebullets) {
      if (Ch.inCone(b.x, b.y, b.r) >= 0 && Ch.inCone(b.x, b.y, b.r) < nearest) {
        b.hp -= dt * (ult ? 99 : 3.5);
        if (b.hp <= 0) { b.dead = true; C.Chem.splash(b.x, b.y, 1); C.emit({ kind: 'glow', img: C.G.smoke, x: b.x, y: b.y, vy: -80, max: 0.8, s0: 16, s1: 50, layer: 2 }); g.score += 20; }
      }
    }
    const B = g.boss;
    if (B && B.state !== 'dying' && B.state !== 'enter') {
      for (const [cx, cy, r] of B.hitCircles()) {
        const d = Ch.inCone(cx, cy, r);
        if (d >= 0 && d < nearest) {
          const surf = Math.max(30, d - r * 0.85);
          if (surf < nearest) { nearest = surf; hp = { x: Ch.x + Math.cos(Ch.dir) * surf, y: C.clamp(Ch.y + Math.sin(Ch.dir) * surf, cy - r, cy + r) }; }
          const dealt = B.damage((ult ? ULT_DPS : SPRAY_DPS) * dt, ult ? 'ult' : 'spray');
          B.onSprayed(dt, ult);
          g.sprayAcc += dealt; g.score += Math.round(dealt * 0.5);
          if (!ult) g.addGauge(dt * 1.5);
          break;
        }
      }
    }
    Ch.hitDist = isFinite(nearest) ? nearest : null; Ch.hitPoint = hp;
    g.sprayAccT += dt;
    if (g.sprayAccT > 0.16) {
      if (g.sprayAcc >= 1 && hp) C.dmgText(hp.x, hp.y - 30, g.sprayAcc, ult ? '#e7ff3a' : '#9dff5a', ult ? 40 : 28);
      g.sprayAcc = 0; g.sprayAccT = 0;
    }
  }

  g.update = function (rdt) {
    if (g.state !== 'play') { C.updateParticles(rdt * 0.5); return; }
    const I = C.input; I.poll();
    if (I.pausePressed) { g.pause(); return; }
    // thời gian: chậm khi cut-in / boss nổ
    let dt = rdt;
    if (g.cutin > 0) { g.cutin -= rdt; dt = rdt * 0.04; if (g.cutin <= 0) { C.flash(0.9, '#e9ffb0'); C.shake(26); spawnShockwave(); } }
    else if (C.cam.slow > 0) { C.cam.slow -= rdt; dt = rdt * 0.35; }
    g.t += dt; if (g.boss) g.bossT += dt;
    while (g.evI < g.events.length && g.events[g.evI].t <= g.t) g.events[g.evI++].f(g);
    g.bgX += dt;

    const p = g.player;
    E.updatePlayer(g, dt);

    // ---- Siêu phun ----
    if (I.ultPressed && g.gauge >= 100 && !g.ultActive && !p.dead) {
      g.ultActive = true; g.ultT = 2.8; g.cutin = 0.95; C.sfx.play('ult'); C.flash(0.5, '#b6ff3a');
      g.ebullets.forEach(b => b.vx *= 0.3);
    }
    let sprayOn = false;
    if (g.ultActive && g.cutin <= 0) {
      g.ultT -= dt; g.gauge = Math.max(0, 100 * g.ultT / 2.8); C.shake(7);
      if (g.ultT <= 0) { g.ultActive = false; g.gauge = 0; }
    } else if (!g.ultActive && I.spray && g.gauge > 0 && !p.dead) {
      sprayOn = true; g.gauge = Math.max(0, g.gauge - GAUGE_DRAIN * dt);
    }
    const n = E.nozzle(p);
    C.Chem.update(dt, sprayOn, g.ultActive && g.cutin <= 0, n.x, n.y);
    if (C.Chem.active && !g.ultActive) C.shake(2.2 * C.Chem.power);
    applySpray(dt);
    if (!g.ultActive) g.addGauge(GAUGE_PASSIVE * dt);

    // ---- đạn Calota ----
    for (const b of g.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x > C.W + 40) { b.dead = true; continue; }
      for (const e of g.enemies) {
        if (e.dead) continue;
        let hit = false;
        for (const [cx, cy, r] of E.circles(e)) if (C.dist2(cx, cy, b.x, b.y) < (r + b.r) * (r + b.r)) { hit = true; break; }
        if (!hit) continue;
        b.dead = true;
        if (e.static || e.sprayOnly) { C.emit({ kind: 'glow', img: C.G.orange, x: b.x, y: b.y, max: 0.12, s0: 14, s1: 24, add: true, layer: 2 }); break; }
        e.hp -= b.dmg; e.flash = 0.06; C.spark(b.x, b.y, 50); g.addGauge(0.5);
        if (e.hp <= 0) killEnemy(e, false); else C.sfx.play('hit');
        break;
      }
      const B = g.boss;
      if (!b.dead && B && B.state !== 'dying') for (const [cx, cy, r] of B.hitCircles()) if (C.dist2(cx, cy, b.x, b.y) < (r + b.r) * (r + b.r)) {
        b.dead = true; const d = B.damage(b.dmg, 'bullet');
        C.spark(b.x, b.y, B.shield > 0 ? 40 : 60); g.addGauge(0.5); g.score += Math.round(d);
        if (B.shield > 0) C.emit({ kind: 'glow', img: C.G.toxic, x: b.x, y: b.y, max: 0.2, s0: 20, s1: 40, add: true, layer: 2 });
        break;
      }
    }
    g.bullets = g.bullets.filter(b => !b.dead);

    // ---- đạn boss ----
    for (const b of g.ebullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
      if (b.x < -60 || b.x > C.W + 80 || b.y < -60 || b.y > C.H + 60) b.dead = true;
      else if (!p.dead && C.dist2(b.x, b.y, p.x, p.y) < (b.r * 0.8 + p.r) * (b.r * 0.8 + p.r)) { if (E.hurtPlayer(g, 1)) { b.dead = true; C.explode(b.x, b.y, 110); } }
    }
    g.ebullets = g.ebullets.filter(b => !b.dead);

    // ---- quái & vật cản ----
    for (const e of g.enemies) {
      E.updateEnemy(g, e, dt);
      if (e.dead || p.dead) continue;
      for (const [cx, cy, r] of E.circles(e)) if (C.dist2(cx, cy, p.x, p.y) < (r * 0.85 + p.r) * (r * 0.85 + p.r)) {
        if (E.hurtPlayer(g, 1) && !e.static && !e.solid) { e.hp = 0; killEnemy(e, false); }
        else if (e.static) { p.y += (p.y < cy ? -1 : 1) * 300 * dt; p.x -= 200 * dt; }
        break;
      }
    }
    g.enemies = g.enemies.filter(e => !e.dead);
    E.updateItems(g, dt);
    if (g.boss) g.boss.update(dt);
    C.updateParticles(dt);
    for (const b of g.banners) b.t += rdt;
    g.banners = g.banners.filter(b => b.t < b.max);
  };

  function spawnShockwave() {
    const n = E.nozzle(g.player);
    C.emit({ kind: 'ring', color: 'rgba(200,255,120,0.95)', x: n.x, y: n.y, max: 0.6, s0: 20, s1: 700, lw: 26, layer: 2, add: true });
    C.emit({ kind: 'ring', color: 'rgba(120,255,220,0.8)', x: n.x, y: n.y, max: 0.8, s0: 10, s1: 1000, lw: 14, layer: 2, add: true });
    for (let i = 0; i < 60; i++) { const a = C.rand(-0.7, 0.7), v = C.rand(600, 1600); C.emit({ kind: 'drop', color: '#d4ff4a', x: n.x, y: n.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, grav: 900, max: C.rand(0.5, 1), s0: C.rand(4, 8), s1: 2, add: true, layer: 2 }); }
    // quét sạch quái nhỏ trên màn hình
    for (const e of g.enemies) if (!e.static && !e.dead && e.x < C.W + 40) { e.hp = 0; killEnemy(e, true); }
  }

  g.pause = function () { if (g.state !== 'play') return; g.state = 'pause'; C.sfx.hiss(0); C.ui.show('pause'); };
  g.resume = function () { if (g.state !== 'pause') return; g.state = 'play'; C.ui.show(null); C.lastT = performance.now(); };
})(window.C);
