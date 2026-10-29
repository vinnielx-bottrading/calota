/* CALOTA — CỬA 2: ĐẦM LẦY ĐỘC
   Đoạn bay ~105 giây (dài hơn, quái dày hơn cửa 1) → Boss: BỌ LÁ ĐỘC GAI CHÚA
   Quái: Muỗi Pháo Độc (bầy) · Ếch Độc Nòng Lồng (quái nặng). Boss kế thừa khung boss cửa 1
   (giáp rêu, ngộp bọt, lao tới & cụng) và thêm: đạn độc · PHUN ĐỘC quét · CẮN NỌC lao tới. */
(function (C) {
  const E = C.E, R = C.gateRule(2), Base = C.BossBase(), OX = C.bossOX;

  const gate = {
    id: 2,
    name: 'Đầm Lầy Độc',
    stageTime: R.stageTime,
    bg: { far: 'g2_far', mid: 'g2_mid', fg: 'g2_fg', farSpeed: 16, midSpeed: 66, fgSpeed: 250, sky: ['#1d3b22', '#5f8a3c'] },
    bossName: 'BỌ LÁ ĐỘC GAI CHÚA',
    bossShort: 'Bọ Lá Độc Gai Chúa',
    thumb: 'assets/ui/g2_thumb.webp',
    winText: 'Bọ Lá Độc Gai Chúa đã chìm trong bọt.',
    // cùng logic quái cửa 1, đổi hình theo đầm lầy
    skin: {
      beetle: 'g2_mosq', beetle_shoot: 'g2_mosq_shoot', eagle: 'g2_frog', eagle_shoot: 'g2_frog_shoot',
      pillar_top: 'g2_pillar_top', pillar_bottom: 'g2_pillar_bottom', crystal_rock: 'g2_rock', thorn_vine: 'g2_vine',
      spikeball: 'g2_proj_small', muzzle: 'g2_muzzle',
      boss_idle: 'g2_boss_idle', boss_attack: 'g2_boss_attack', boss_ram: 'g2_boss_ram', boss_defeat: 'g2_boss_defeat', boss_foam: 'g2_boss_foam'
    },
    timeline() {
      const ev = C.makeTimeline({ n: 2, minions: ['beetle', 'eagle'], obstacles: ['vine', 'pillarTop', 'rock', 'pillarBot'], banner: 'CỬA 2 · ĐẦM LẦY ĐỘC' });
      ev.push({ t: 6, f: g => g.banner('Muỗi độc bay thành bầy — PHUN cả đàn!', 2.4, 'hint') });
      ev.push({ t: 20, f: g => g.banner('Ếch độc kéo dài nòng — LƯỚT để né', 2.4, 'hint') });
      return ev.sort((a, b) => a.t - b.t);
    },
    makeBoss(g) { return new Queen(g); }
  };
  C.GATES.push(gate);

  // =============================================================
  //   BOSS: BỌ LÁ ĐỘC GAI CHÚA
  // =============================================================
  function Queen(g) {
    Base.call(this, g);
    this.w = 400; this.r = 150; this.y = 360;
    this.sprayT = 8; this.biteT = 12; this.chargeT = 15;
  }
  const Q = Queen.prototype = Object.create(Base.prototype);
  Q.constructor = Queen;
  Q.baseHp = R.bossHp;            // 38 000 — trâu hơn cửa 1
  Q.shieldMul = 1.2;
  Q.txt2 = 'GIÁP LÁ ĐỘC! Xịt DỊCH ĐỘC để đốt';
  Q.txt3 = 'ĐIÊN CUỒNG! Phun độc liên tục';
  Q.txtBreak = 'GIÁP LÁ ĐỘC ĐÃ TAN!';

  Q.muzzle = function () { return { x: this.x - this.w * 0.37, y: this.y - 112 }; };     // đầu nòng pháo trên lưng
  Q.mouth = function () { return { x: this.x - this.w * 0.33, y: this.y + 50 }; };       // hàm răng nanh
  Q.hitCircles = function () { return [[this.x + 20, this.y - 10, 135], [this.x - 115, this.y + 45, 70], [this.x + 10, this.y + 130, 70]]; };

  Q.fire = function (n, spread, speed) {
    const g = this.g, m = this.muzzle(), p = g.player;
    const base = Math.atan2(p.y - m.y, p.x - m.x);
    for (let i = 0; i < n; i++) {
      const a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
      g.ebullets.push({ kind: 'venom', x: m.x, y: m.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 22, rot: 0, vr: 0, hp: 2 });
    }
    this.atkT = 0.45; C.sfx.play('bossShot'); C.shake(4);
    C.emit({ kind: 'img', img: 'g2_muzzle', x: m.x - 36, y: m.y, max: 0.2, s0: 120, s1: 160, layer: 2, rot: Math.PI });
  };

  Q.attacks = function (dt) {
    const g = this.g;
    this.fireT -= dt; this.sprayT -= dt; this.biteT -= dt;
    if (this.chargeT < 1.6) return; // sắp lao tới → không ra chiêu khác
    if (this.sprayT <= 0) { this.state = 'sprayTele'; this.t = 0; this.sprayT = this.phase === 1 ? 11 : this.phase === 2 ? 9 : 6.5; C.sfx.play('warn'); return; }
    if (this.phase >= 2 && this.biteT <= 0) { this.state = 'biteTele'; this.t = 0; this.biteT = this.phase === 2 ? 9 : 6.5; this.biteTo = { x: C.clamp(g.player.x + 60, 260, C.W - 500), y: C.clamp(g.player.y - 40, 160, 560) }; C.sfx.play('warn'); return; }
    if (this.fireT <= 0) {
      if (this.phase === 1) { this.fire(1, 0, 440); this.fireT = 1.6; }
      else if (this.phase === 2) { this.fire(3, 0.5, 430); this.fireT = 1.8; }
      else { this.fire(5, 0.85, 470); this.fireT = 1.45; }
    }
    if (this.phase >= 2) {
      this.summonT -= dt;
      if (this.summonT <= 0) {
        this.summonT = this.phase === 3 ? 7 : 9;
        for (let i = 0; i < 3; i++) E.spawn(g, 'beetle', { x: this.x - 60, y: this.y - 80 + i * 80, amp: 50, speed: 280 });
        if (this.phase === 3) E.spawn(g, 'eagle', { x: this.x, y: C.rand(160, 560), stopX: C.rand(820, 940) });
      }
    }
  };

  /** các trạng thái riêng — trả về true nếu đã xử lý */
  Q.custom = function (dt) {
    const g = this.g, p = g.player, st = this.state;
    if (st !== 'sprayTele' && st !== 'spraying' && st !== 'biteTele' && st !== 'bite' && st !== 'biteBack') return false;
    if (this.stunT > 0 && st !== 'biteBack') { this.state = st === 'bite' ? 'biteBack' : 'fight'; return true; }
    if (st === 'sprayTele') {            // phồng nòng, sủi độc
      this.x += Math.sin(this.t * 50) * 1.5;
      this.y = C.lerp(this.y, C.clamp(p.y + 60, 200, 540), dt * 1.5);
      if (Math.random() < 0.5) C.emit({ kind: 'glow', img: C.G.toxic, x: this.muzzle().x + C.rand(-20, 20), y: this.muzzle().y + C.rand(-20, 20), vy: -60, max: 0.5, s0: 20, s1: 50, add: true, layer: 2 });
      if (this.t > 0.85) { this.state = 'spraying'; this.t = 0; this.sprayA = Math.atan2(p.y - this.muzzle().y, p.x - this.muzzle().x) - 0.35; this.globT = 0; C.shake(8); C.sfx.play('bossShot'); }
    } else if (st === 'spraying') {      // phun độc quét từ trên xuống
      const dur = this.phase === 3 ? 2.2 : 1.7;
      const m = this.muzzle(), ox = m.x - 50, oy = m.y + 10;
      const a = this.sprayA + (this.t / dur) * (this.phase === 1 ? 0.7 : 0.95);
      this.globT -= dt;
      while (this.globT <= 0) {
        this.globT += this.phase === 3 ? 0.045 : 0.06;
        const aa = a + C.rand(-0.09, 0.09), v = C.rand(460, 600);
        g.ebullets.push({ kind: 'glob', x: ox, y: oy, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v, grav: 260, r: 15, rot: C.rand(0, 6), vr: C.rand(-4, 4), hp: 1 });
      }
      if (Math.random() < 0.6) C.emit({ kind: 'glow', img: C.G.toxic, x: ox, y: oy, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, drag: 3, max: 0.4, s0: 40, s1: 90, add: true, layer: 2 });
      C.shake(2);
      if (this.t > dur) { this.state = 'fight'; this.t = 0; this.atkT = 0; }
    } else if (st === 'biteTele') {      // há hàm, nhắm vị trí Calota
      this.x += Math.sin(this.t * 70) * 2;
      if (this.t > 0.7) { this.state = 'bite'; this.t = 0; C.shake(8); }
    } else if (st === 'bite') {          // lao tới cắn nọc
      const to = this.biteTo, mo = this.mouth();
      const dx = to.x - mo.x, dy = to.y - mo.y, d = Math.hypot(dx, dy) || 1, v = 1500 * dt;
      if (d > v) { this.x += dx / d * v; this.y += dy / d * v; }
      if (Math.random() < 0.6) C.emit({ kind: 'glow', img: C.G.smoke, x: this.x + 160, y: this.y + C.rand(-80, 80), vx: 200, max: 0.5, s0: 30, s1: 70, layer: 1 });
      if (d <= v || this.t > 0.6) {
        this.state = 'biteBack'; this.t = 0; this.snapped = true;
        const m2 = this.mouth();
        C.shake(18); C.sfx.play('explode');
        C.emit({ kind: 'img', img: 'g2_venom_slash', x: m2.x - 20, y: m2.y, max: 0.35, s0: 170, s1: 230, layer: 2 });
        C.emit({ kind: 'img', img: 'g2_venom_splash', x: m2.x - 40, y: m2.y + 10, max: 0.5, s0: 140, s1: 220, layer: 2 });
        if (!p.dead && C.dist2(m2.x - 20, m2.y, p.x, p.y) < (110 + p.r) * (110 + p.r)) E.hurtPlayer(g, 1);
        // vãi giọt độc ra xung quanh
        for (let i = 0; i < (this.phase === 3 ? 10 : 6); i++) { const aa = Math.PI + C.rand(-1.2, 1.2), vv = C.rand(250, 420); g.ebullets.push({ kind: 'glob', x: m2.x, y: m2.y, vx: Math.cos(aa) * vv, vy: Math.sin(aa) * vv - 120, grav: 380, r: 13, rot: 0, vr: 3, hp: 1 }); }
      }
    } else if (st === 'biteBack') {      // lùi về chỗ cũ
      const hx = 1010 + OX();
      this.x = Math.min(hx, this.x + 650 * dt);
      if (this.x >= hx - 2) { this.state = 'fight'; this.t = 0; this.snapped = false; }
    }
    return true;
  };

  /** chọn khung hình: [tên, khung, hệ số bề rộng, lệch x] */
  Q.pose = function () {
    const st = this.state;
    if (st === 'sprayTele') return ['g2_boss_spray', this.t < 0.4 ? 0 : 1, 520 / 440, 70];
    if (st === 'spraying') return ['g2_boss_spray', this.t < 0.12 ? 1 : 2, 520 / 440, 70];
    if (st === 'biteTele') return ['g2_boss_bite', 0, 467 / 440, 10];
    if (st === 'bite') return ['g2_boss_bite', 1, 467 / 440, 10];
    if (st === 'biteBack') return ['g2_boss_bite', this.t < 0.3 ? 2 : 3, 467 / 440, 10];
    if (this.atkT > 0 && !(this.stunT > 0) && !(this.hurtT > 0)) return ['g2_boss_attack', this.atkT > 0.3 ? 2 : 3];
    return null;
  };

  Q.draw = function (ctx) {
    if (this.state === 'biteTele' && this.biteTo) { // vạch nhắm cú cắn
      const m = this.mouth(), k = 0.5 + 0.5 * Math.sin(this.t * 40);
      ctx.save(); ctx.strokeStyle = `rgba(170,255,60,${0.5 + 0.4 * k})`; ctx.lineWidth = 5; ctx.setLineDash([22, 12]);
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(this.biteTo.x, this.biteTo.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.3 * k; ctx.drawImage(C.G.toxic, this.biteTo.x - 110, this.biteTo.y - 110, 220, 220);
      ctx.restore();
    }
    if (this.state === 'sprayTele') { // cảnh báo hướng phun
      const m = this.muzzle(), p = this.g.player, a = Math.atan2(p.y - m.y, p.x - m.x);
      ctx.save(); ctx.globalAlpha = 0.18 + 0.12 * Math.sin(this.t * 30); ctx.fillStyle = '#9dff3a';
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.arc(m.x, m.y, 900, a - 0.4, a + 0.6); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    Base.prototype.draw.call(this, ctx);
  };
})(window.C);
