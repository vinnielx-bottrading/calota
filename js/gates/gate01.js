/* CALOTA — CỬA 1: RỪNG ĐÁ ĐẢO TRỜI
   Đoạn bay ~80 giây → Boss: KHINH KHÍ CẦU GAI RÊU (trâu, 3 giai đoạn, giáp rêu chỉ hóa chất đốt nhanh) */
(function (C) {
  C.GATES = C.GATES || [];
  const E = C.E;

  const gate = {
    id: 1,
    name: 'Rừng Đá Đảo Trời',
    stageTime: 80,
    bg: { far: 'bg_far', mid: 'bg_mid', fg: 'bg_fg', farSpeed: 18, midSpeed: 70, fgSpeed: 260, sky: ['#5fb6ff', '#bfe6ff'] },
    bossName: 'KHINH KHÍ CẦU GAI RÊU',

    timeline() {
      const ev = [];
      const at = (t, f) => ev.push({ t, f });
      const beetles = (t, y, n, amp, gap) => { for (let i = 0; i < n; i++) at(t + i * (gap || 0.32), g => E.spawn(g, 'beetle', { y, amp: amp == null ? 60 : amp, freq: 3 })); };
      const eagle = (t, y, stopX) => at(t, g => E.spawn(g, 'eagle', { y, stopX: stopX || 980 }));
      const item = (t, kind, y) => at(t, g => E.drop(g, kind, C.W + 40, y));
      const coins = (t, y, n) => { for (let i = 0; i < n; i++) at(t + i * 0.18, g => E.drop(g, 'coin', C.W + 40, y + Math.sin(i * 0.8) * 50)); };
      const hint = (t, txt) => at(t, g => g.banner(txt, 2.6, 'hint'));
      const top = (t, w) => at(t, g => E.spawn(g, 'pillarTop', { w: w || 250 }));
      const bot = (t, w) => at(t, g => E.spawn(g, 'pillarBot', { w: w || 230 }));

      at(0.6, g => g.banner('CỬA 1 · RỪNG ĐÁ ĐẢO TRỜI', 2.6, 'title'));
      beetles(2.5, 220, 5, 40); beetles(5.2, 500, 5, 40);
      item(7.5, 'bolt', 360); hint(8, C.input.usingTouch ? 'Giữ nút PHUN để xịt hóa chất!' : 'Giữ SPACE / J để PHUN HÓA CHẤT!');
      coins(9, 360, 6);
      top(10.5); bot(12.8); beetles(13.5, 360, 6, 120);
      eagle(16, 210); eagle(18, 520);
      at(19.5, g => E.spawn(g, 'vine', { y: 360 })); hint(20, 'Dây gai chỉ cháy bằng HÓA CHẤT');
      at(22.5, g => E.spawn(g, 'rock', { y: 240 })); at(23.6, g => E.spawn(g, 'rock', { y: 500 }));
      item(24.5, 'bolt', 300);
      for (let i = 0; i < 4; i++) { (i % 2 ? bot : top)(26 + i * 2.3); beetles(27 + i * 2.3, i % 2 ? 230 : 500, 3, 30); }
      item(28.5, 'shield', 360); coins(29.5, 360, 5);
      eagle(35, 180); eagle(35.8, 540, 900);
      beetles(37.5, 170, 6, 30); beetles(37.5, 560, 6, 30);
      at(40.5, g => E.spawn(g, 'vine', { y: 230 })); at(41.2, g => E.spawn(g, 'vine', { y: 510 }));
      item(42.5, 'bolt', 370); hint(43, C.input.usingTouch ? 'Thanh đầy → bấm SIÊU PHUN!' : 'Thanh đầy → bấm K: SIÊU PHUN!');
      at(45, g => { E.spawn(g, 'rock', { y: 200, speed: 210 }); E.spawn(g, 'rock', { y: 380, speed: 190 }); E.spawn(g, 'rock', { y: 560, speed: 230 }); });
      eagle(48, 260); eagle(49, 460, 920); eagle(50, 360, 1000);
      item(51.5, 'heart', 360);
      for (let i = 0; i < 5; i++) { top(53 + i * 2, 230 + (i % 2) * 40); bot(54 + i * 2, 210 + (i % 3) * 30); beetles(53.6 + i * 2, 360, 2, 70); }
      item(58, 'bolt', 360); coins(59, 300, 6);
      at(63, g => E.spawn(g, 'vine', { y: 360 })); eagle(63.5, 180); eagle(64, 560);
      beetles(66, 360, 10, 200, 0.25);
      item(68.5, 'bolt', 360); coins(69, 420, 8);
      eagle(70, 220, 940); eagle(70.6, 500, 960);
      top(72.5, 280); bot(74, 260);
      at(76, g => g.bossWarning());
      at(80, g => g.startBoss());
      return ev.sort((a, b) => a.t - b.t);
    },

    makeBoss(g) { return new Airship(g); }
  };
  C.GATES.push(gate);

  // =============================================================
  //   BOSS: KHINH KHÍ CẦU GAI RÊU
  // =============================================================
  const HP = 18000;
  function Airship(g) {
    this.g = g; this.x = C.W + 260; this.y = 340; this.w = 360;
    this.hp = HP; this.maxHp = HP; this.phase = 1;
    this.shield = 0; this.shieldMax = 0; this.stacks = 0; this.corrT = 0; this.sprayedT = 9;
    this.state = 'enter'; this.t = 0; this.fireT = 2; this.volleyT = 7; this.summonT = 6; this.chargeT = 7; this.atkT = 0;
    this.flash = 0; this.invT = 0; this.anim = 0; this.r = 125; this.dieT = 0;
    this.blotches = Array.from({ length: 7 }, () => ({ x: C.rand(0.25, 0.85), y: C.rand(0.2, 0.75), r: C.rand(0.08, 0.18), c: Math.random() < 0.7 ? 'rgba(120,255,40,1)' : 'rgba(150,60,255,1)' }));
  }
  const B = Airship.prototype;
  B.muzzle = function () { return { x: this.x - this.w * 0.42, y: this.y + 8 }; };
  B.hitCircles = function () { return [[this.x + 10, this.y - 20, this.r], [this.x - 120, this.y + 10, 45], [this.x, this.y + 120, 60]]; };
  B.mult = function () { return 1 + this.stacks * 0.08; };

  /** src: 'bullet' | 'spray' | 'ult'. Trả về sát thương thực */
  B.damage = function (dmg, src) {
    if (this.state === 'dying' || this.state === 'enter' || this.invT > 0) return 0;
    dmg *= this.mult();
    if (this.shield > 0) {
      const k = src === 'bullet' ? 0.2 : src === 'spray' ? 3 : 4;
      this.shield -= dmg * k;
      if (this.shield <= 0) {
        this.shield = 0; C.sfx.play('shieldBreak'); C.shake(16); C.flash(0.4, '#c8ff70');
        this.g.banner('GIÁP RÊU ĐÃ BỊ ĐỐT TAN!', 1.6, 'hint');
        for (let i = 0; i < 40; i++) { const a = C.rand(0, 6.28), v = C.rand(200, 700); C.emit({ kind: 'glow', img: C.G.lime, x: this.x, y: this.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 2.5, max: C.rand(0.5, 1), s0: 16, s1: 4, add: true, layer: 2 }); }
      }
      return 0;
    }
    this.hp -= dmg; this.flash = src === 'bullet' ? Math.max(this.flash, 0.04) : this.flash;
    if (this.phase === 1 && this.hp <= HP * 0.66) this.toPhase(2);
    else if (this.phase === 2 && this.hp <= HP * 0.33) this.toPhase(3);
    if (this.hp <= 0) this.die();
    return dmg;
  };
  B.toPhase = function (n) {
    this.phase = n; this.invT = 1.3; this.shieldMax = this.shield = n === 2 ? 2000 : 2600;
    C.shake(20); C.sfx.play('explode'); C.sfx.play('warn');
    this.g.banner(n === 2 ? 'GIÁP RÊU! Xịt HÓA CHẤT để đốt nhanh' : 'NỔI GIẬN! Giáp rêu dày hơn', 2.4, 'boss');
    for (let i = 0; i < 30; i++) { const a = C.rand(0, 6.28); C.emit({ kind: 'glow', img: C.G.toxic, x: this.x + Math.cos(a) * 160, y: this.y + Math.sin(a) * 160, vx: -Math.cos(a) * 200, vy: -Math.sin(a) * 200, max: 0.8, s0: 40, s1: 10, layer: 2 }); }
    this.state = 'fight'; this.x = Math.max(this.x, 980);
  };
  B.die = function () {
    if (this.state === 'dying') return;
    this.state = 'dying'; this.t = 0; this.hp = 0; this.shield = 0;
    this.g.ebullets.length = 0; C.sfx.hiss(0); C.sfx.music(null);
    C.flash(0.8, '#fff'); C.shake(30); C.cam.slow = 1.2;
  };

  B.fire = function (n, spread, speed) {
    const g = this.g, m = this.muzzle(), p = g.player;
    const base = Math.atan2(p.y - m.y, p.x - m.x);
    for (let i = 0; i < n; i++) {
      const a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
      g.ebullets.push({ kind: 'spike', x: m.x, y: m.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 24, rot: 0, vr: C.rand(-6, 6), hp: 1 });
    }
    this.atkT = 0.45; C.sfx.play('bossShot'); C.shake(4);
    C.emit({ kind: 'img', img: 'muzzle', x: m.x - 40, y: m.y, max: 0.18, s0: 120, s1: 150, layer: 2, rot: Math.PI });
  };

  B.update = function (dt) {
    const g = this.g, p = g.player;
    this.t += dt; this.anim += dt; this.flash -= dt; this.invT -= dt; this.atkT -= dt;
    // ăn mòn: tăng khi bị xịt, giảm dần khi thôi
    this.sprayedT += dt;
    if (this.sprayedT > 1.2) { this.corrT += dt; if (this.corrT > 1.1) { this.corrT = 0; this.stacks = Math.max(0, this.stacks - 1); } }
    if (this.stacks > 0) C.Chem.corrode(this.x, this.y, this.w, this.w * 0.8, this.stacks / 10);

    if (this.state === 'enter') {
      this.x = C.lerp(this.x, 1010, dt * 1.4);
      if (this.x < 1030) { this.state = 'fight'; this.t = 0; }
      return;
    }
    if (this.state === 'dying') {
      this.y += (40 + this.t * 120) * dt; this.x += 30 * dt;
      if (Math.random() < 0.35) C.explode(this.x + C.rand(-150, 150), this.y + C.rand(-130, 130), C.rand(120, 220));
      if (Math.random() < 0.2) C.sfx.play('explode');
      C.shake(10);
      if (this.t > 3.2 && !this.done) { this.done = true; C.explode(this.x, this.y, 520); C.flash(1, '#fff'); g.onBossDefeated(); }
      return;
    }
    // di chuyển: bám theo độ cao của Calota + nhấp nhô
    if (this.state === 'fight') {
      const ty = C.clamp(p.y + Math.sin(this.t * 0.9) * 120, 170, 560);
      this.y = C.lerp(this.y, ty, dt * (this.phase === 3 ? 1.3 : 0.8));
      this.x = C.lerp(this.x, 1010 + Math.sin(this.t * 0.6) * 40, dt * 2);
      // tấn công theo giai đoạn
      this.fireT -= dt;
      if (this.fireT <= 0) {
        if (this.phase === 1) { this.fire(1, 0, 430); this.fireT = 1.5; }
        else if (this.phase === 2) { this.fire(3, 0.55, 420); this.fireT = 1.7; }
        else { this.fire(5, 0.9, 460); this.fireT = 1.35; }
      }
      this.volleyT -= dt;
      if (this.volleyT <= 0) {
        this.volleyT = this.phase === 3 ? 5 : 7;
        [0, 0.22, 0.44].forEach(d => setTimeout(() => { if (this.state === 'fight') this.fire(1, 0, 560); }, d * 1000));
      }
      if (this.phase >= 2) {
        this.summonT -= dt;
        if (this.summonT <= 0) {
          this.summonT = this.phase === 3 ? 7 : 9;
          for (let i = 0; i < 3; i++) E.spawn(g, 'beetle', { x: this.x - 60, y: this.y - 80 + i * 80, amp: 50, speed: 280 });
        }
      }
      if (this.phase === 3) {
        this.chargeT -= dt;
        if (this.chargeT <= 0) { this.state = 'tele'; this.t = 0; C.sfx.play('warn'); }
      }
    } else if (this.state === 'tele') { // báo trước cú húc
      this.x += Math.sin(this.t * 60) * 2;
      if (this.t > 0.9) { this.state = 'charge'; this.t = 0; C.shake(10); }
    } else if (this.state === 'charge') {
      this.x -= 1500 * dt;
      if (Math.random() < 0.6) C.emit({ kind: 'glow', img: C.G.smoke, x: this.x + 150, y: this.y + C.rand(-80, 80), vx: 200, max: 0.6, s0: 30, s1: 80, layer: 1 });
      if (this.x < 180) { this.state = 'back'; this.t = 0; }
    } else if (this.state === 'back') {
      this.x += 520 * dt;
      if (this.x > 1000) { this.state = 'fight'; this.chargeT = 8; }
    }
    // va chạm thân boss
    if (!p.dead) for (const [cx, cy, r] of this.hitCircles()) if (C.dist2(cx, cy, p.x, p.y) < (r + p.r) * (r + p.r)) { C.E.hurtPlayer(g, 1); break; }
  };

  B.onSprayed = function (dt, ult) {
    this.sprayedT = 0; this.corrT += dt;
    const need = ult ? 0.07 : 0.3;
    while (this.corrT > need) { this.corrT -= need; if (this.stacks < 10) { this.stacks++; if (this.stacks % 3 === 0) C.sfx.play('sizzle'); } }
  };

  B.draw = function (ctx) {
    const st = this.state;
    let name = 'boss_idle', f = Math.floor(this.anim * 8);
    if (st === 'dying') { name = 'boss_defeat'; f = Math.min(3, Math.floor(this.t / 0.7)); }
    else if (this.atkT > 0) { name = 'boss_attack'; f = this.atkT > 0.3 ? 0 : 3; }
    const rot = st === 'dying' ? this.t * 0.25 : st === 'charge' ? -0.12 : Math.sin(this.anim * 1.5) * 0.04;
    const corr = this.stacks / 10;
    if (this.phase === 3 && st !== 'dying') { // hào quang đỏ khi nổi giận
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.anim * 6);
      ctx.drawImage(C.G.red, this.x - 260, this.y - 260, 520, 520); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    if (st === 'tele') {
      ctx.fillStyle = `rgba(255,40,40,${0.18 + 0.15 * Math.sin(this.t * 40)})`; ctx.fillRect(0, this.y - 90, this.x, 180);
      ctx.strokeStyle = 'rgba(255,80,80,0.9)'; ctx.setLineDash([24, 14]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, this.y); ctx.lineTo(this.x, this.y); ctx.stroke(); ctx.setLineDash([]);
    }
    if (this.invT > 0 && Math.floor(this.invT * 16) % 2 === 0) C.sprTint(ctx, name, f, this.x, this.y, this.w, '#ffffff', 0.6, { rot });
    else if (corr > 0) C.sprTint(ctx, name, f, this.x, this.y, this.w, '#7dff2a', 0.12 + corr * 0.35, { rot, blotches: this.blotches.slice(0, Math.ceil(corr * 7)) });
    else if (this.flash > 0) C.sprTint(ctx, name, f, this.x, this.y, this.w, '#fff4d0', 0.22, { rot });
    else C.spr(ctx, name, f, this.x, this.y, this.w, { rot });
    // giáp rêu: vòng khiên lá xanh
    if (this.shield > 0) {
      const k = this.shield / this.shieldMax, t = this.anim;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + 0.25 * k; ctx.drawImage(C.G.toxic, this.x - 250, this.y - 250, 500, 500);
      ctx.globalAlpha = 0.9; ctx.strokeStyle = `rgba(120,255,90,${0.4 + 0.5 * k})`; ctx.lineWidth = 6;
      ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * 6.283, r = 185 + Math.sin(a * 7 + t * 4) * 8; const px = this.x + Math.cos(a) * r, py = this.y + Math.sin(a) * r * 0.9; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 10; i++) { const a = t * 0.8 + i / 10 * 6.283; C.spr(ctx, 'thorn_vine', 0, this.x + Math.cos(a) * 185, this.y + Math.sin(a) * 166, 70 * (0.6 + 0.4 * k), { rot: a + 1.57, alpha: 0.9 }); }
    }
  };
})(window.C);
