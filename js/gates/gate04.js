/* CALOTA — CỬA 4: ĐỈNH BĂNG TUYẾT
   Đoạn bay ~155 giây (quái ×2,05) → Boss: CÁ VOI PHÁO BĂNG
   Quái: Cánh Cụt Pháo Băng (bầy) · Cú Tuyết Ống Phóng (quái nặng).
   Tuyệt chiêu từ cửa 4: HẮC SONG TRÙNG (thay Tuyệt Mệnh Vô Cực). */
(function (C) {
  const E = C.E, R = C.gateRule(4), Base = C.BossBase(), OX = C.bossOX;

  const gate = {
    id: 4,
    name: 'Đỉnh Băng Tuyết',
    stageTime: R.stageTime,
    bg: { far: 'g4_far', mid: 'g4_mid', fg: 'g4_fg', farSpeed: 14, midSpeed: 66, fgSpeed: 260, sky: ['#5fb0ff', '#dff3ff'] },
    bossName: 'CÁ VOI PHÁO BĂNG',
    bossShort: 'Cá Voi Pháo Băng',
    thumb: 'assets/ui/g4_thumb.webp',
    winText: 'Cá Voi Pháo Băng đã đông cứng trong bọt.',
    skin: {
      beetle: 'g4_penguin', beetle_shoot: 'g4_penguin_shoot', eagle: 'g4_owl', eagle_shoot: 'g4_owl_shoot',
      pillar_top: 'g4_pillar_top', pillar_bottom: 'g4_pillar_bottom', crystal_rock: 'g4_rock', thorn_vine: 'g4_vine', muzzle: 'g4_muzzle',
      boss_idle: 'g4_boss_idle', boss_attack: 'g4_boss_attack', boss_ram: 'g4_boss_ram', boss_defeat: 'g4_boss_defeat', boss_foam: 'g4_boss_foam'
    },
    timeline() {
      const ev = C.makeTimeline({ n: 4, minions: ['beetle', 'eagle'], obstacles: ['pillarTop', 'rock', 'pillarBot', 'vine'], banner: 'CỬA 4 · ĐỈNH BĂNG TUYẾT' });
      ev.push({ t: 5, f: g => g.banner('Tuyệt chiêu mới: HẮC SONG TRÙNG (thanh Nộ đầy)', 3, 'hint') });
      ev.push({ t: 24, f: g => g.banner('Tia băng làm Calota CHẬM lại — tránh xa!', 2.6, 'hint') });
      return ev.sort((a, b) => a.t - b.t);
    },
    makeBoss(g) { return new Whale(g); }
  };
  C.GATES.push(gate);

  // =============================================================
  //   BOSS: CÁ VOI PHÁO BĂNG
  // =============================================================
  function Whale(g) {
    Base.call(this, g);
    this.w = 430; this.r = 140; this.y = 360;
    this.beamT = 9; this.snowT = 8; this.chargeT = 17;
  }
  const Q = Whale.prototype = Object.create(Base.prototype);
  Q.constructor = Whale;
  Q.baseHp = R.bossHp;            // 54 000
  Q.shieldMul = 1.6;
  Q.txt2 = 'GIÁP BĂNG! Xịt DỊCH ĐỘC để làm tan';
  Q.txt3 = 'BÃO TUYẾT! Tia băng liên tục';
  Q.txtBreak = 'GIÁP BĂNG ĐÃ TAN!';

  Q.muzzle = function () { return { x: this.x - this.w * 0.42, y: this.y - 112 }; };
  Q.hitCircles = function () { return [[this.x + 20, this.y + 20, 140], [this.x - 140, this.y + 40, 70], [this.x - 30, this.y - 110, 60]]; };

  Q.fire = function (n, spread, speed) {
    const g = this.g, m = this.muzzle(), p = g.player, base = Math.atan2(p.y - m.y, p.x - m.x);
    for (let i = 0; i < n; i++) {
      const a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
      g.ebullets.push({ kind: 'icicle', spr: 'g4_proj_big', face: true, sz: 4.4, x: m.x, y: m.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 20, rot: 0, vr: 0, hp: 3, chill: 1 });
    }
    this.atkT = 0.5; C.sfx.play('bossShot'); C.shake(5);
    C.emit({ kind: 'img', img: 'g4_muzzle', x: m.x - 50, y: m.y, max: 0.22, s0: 140, s1: 200, layer: 2, rot: Math.PI });
  };
  Q.lobSnow = function (n) {
    const g = this.g, m = this.muzzle();
    for (let i = 0; i < n; i++) g.ebullets.push({ kind: 'bomb', spr: 'g4_snowball', impact: 'g4_impact', sz: 3.8, x: m.x, y: m.y, vx: -C.rand(250, 520), vy: -C.rand(360, 600), grav: 640, r: 24, rot: 0, vr: C.rand(-4, 4), hp: 3, chill: 1 });
    this.atkT = 0.5; C.sfx.play('bossShot');
  };

  Q.attacks = function (dt) {
    const g = this.g;
    this.fireT -= dt; this.beamT -= dt; this.snowT -= dt;
    if (this.chargeT < 1.6) return;
    if (this.beamT <= 0) { this.state = 'beamTele'; this.t = 0; this.beamT = this.phase === 1 ? 11 : this.phase === 2 ? 9 : 7; C.sfx.play('warn'); return; }
    if (this.phase >= 2 && this.snowT <= 0) { this.snowT = this.phase === 2 ? 7 : 5; this.lobSnow(this.phase === 2 ? 2 : 3); }
    if (this.fireT <= 0) {
      if (this.phase === 1) { this.fire(2, 0.18, 480); this.fireT = 1.7; }
      else if (this.phase === 2) { this.fire(3, 0.5, 470); this.fireT = 1.7; }
      else { this.fire(5, 0.85, 500); this.fireT = 1.35; }
    }
    if (this.phase >= 2) {
      this.summonT -= dt;
      if (this.summonT <= 0) {
        this.summonT = this.phase === 3 ? 7 : 9;
        for (let i = 0; i < 3; i++) E.spawn(g, 'beetle', { x: this.x - 60, y: this.y - 80 + i * 80, amp: 50, speed: 280 });
      }
    }
  };

  /** TIA BĂNG: hút băng vào nòng → bắn tia ngang quét dần về phía Calota, trúng thì đau + CHẬM */
  Q.custom = function (dt) {
    const g = this.g, p = g.player, st = this.state;
    if (st !== 'beamTele' && st !== 'beam' && st !== 'beamEnd') return false;
    if (this.stunT > 0) { this.state = 'fight'; return true; }
    if (st === 'beamTele') {
      this.y = C.lerp(this.y, C.clamp(p.y + 110, 220, 560), dt * 2);
      const m = this.muzzle();
      if (Math.random() < 0.7) { const a = C.rand(0, 6.283), d = C.rand(80, 160); C.emit({ kind: 'glow', img: C.G.ice, x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d, vx: -Math.cos(a) * d * 2.5, vy: -Math.sin(a) * d * 2.5, max: 0.4, s0: 18, s1: 4, add: true, layer: 2 }); }
      if (this.t > 1.0) { this.state = 'beam'; this.t = 0; this.beamY = this.muzzle().y; C.shake(12); C.sfx.play('ult'); }
    } else if (st === 'beam') {
      const dur = this.phase === 3 ? 2.2 : 1.7;
      this.y = C.lerp(this.y, C.clamp(p.y + 112, 200, 580), dt * (this.phase === 3 ? 0.9 : 0.6)); // quét chậm theo Calota
      this.beamY = this.muzzle().y; C.shake(3);
      const m = this.muzzle();
      if (!p.dead && p.x < m.x && Math.abs(p.y - this.beamY) < 46 + p.r) { if (C.E.hurtPlayer(g, 1)) {} p.slowT = 2.5; }
      for (let i = 0; i < 3; i++) C.emit({ kind: 'glow', img: C.G.ice, x: C.rand(0, m.x), y: this.beamY + C.rand(-40, 40), vx: -C.rand(200, 600), max: 0.4, s0: 20, s1: 6, add: true, layer: 2 });
      if (this.t > dur) { this.state = 'beamEnd'; this.t = 0; }
    } else if (st === 'beamEnd') {
      if (this.t > 0.4) { this.state = 'fight'; this.t = 0; }
    }
    return true;
  };

  Q.pose = function () {
    const st = this.state;
    if (st === 'beamTele') return ['g4_boss_special', this.t < 0.5 ? 0 : 1, 500 / 440, 30];
    if (st === 'beam') return ['g4_boss_special', 2, 500 / 440, 30];
    if (st === 'beamEnd') return ['g4_boss_special', 3, 500 / 440, 30];
    if (this.atkT > 0 && !(this.stunT > 0) && !(this.hurtT > 0)) return ['g4_boss_attack', this.atkT > 0.36 ? 1 : this.atkT > 0.18 ? 2 : 3];
    return null;
  };

  Q.draw = function (ctx) {
    const t = performance.now() / 1000;
    if (this.state === 'beamTele') { // vạch báo tia băng
      const m = this.muzzle(), k = 0.5 + 0.5 * Math.sin(this.t * 30);
      ctx.save(); ctx.fillStyle = `rgba(150,220,255,${0.12 + 0.12 * k})`; ctx.fillRect(0, m.y - 46, m.x, 92);
      ctx.strokeStyle = `rgba(200,240,255,${0.6 + 0.3 * k})`; ctx.lineWidth = 3; ctx.setLineDash([20, 12]); ctx.beginPath(); ctx.moveTo(0, m.y); ctx.lineTo(m.x, m.y); ctx.stroke(); ctx.restore();
    }
    if (this.state === 'beam') { // tia băng kéo dài tới mép trái
      const m = this.muzzle(), h = 70 + Math.sin(t * 40) * 8;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createLinearGradient(0, m.y - h, 0, m.y + h); gr.addColorStop(0, 'rgba(120,200,255,0)'); gr.addColorStop(0.35, 'rgba(160,225,255,0.7)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.65, 'rgba(160,225,255,0.7)'); gr.addColorStop(1, 'rgba(120,200,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, m.y - h, m.x - 60, h * 2);
      ctx.globalAlpha = 0.8; for (let i = 0; i < 6; i++) C.spr(ctx, 'g4_proj_big', 0, ((t * 900 + i * 220) % (m.x + 100)) * -1 + m.x, m.y + Math.sin(t * 9 + i) * 18, 150, { rot: Math.PI });
      ctx.restore();
    }
    Base.prototype.draw.call(this, ctx);
  };
})(window.C);
