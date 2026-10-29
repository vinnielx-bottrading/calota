/* CALOTA — CỬA 3: HẺM NÚI CÁT ĐỎ
   Đoạn bay ~130 giây (dài hơn, quái ×1,7) → Boss: KỀN KỀN CHÚA ỐNG LỒNG
   Mở chiêu mới: GIÁP NỌC ĐỘC (F) và TUYỆT MỆNH VÔ CỰC (thay Tuyệt Mệnh thường).
   Quái con: Thằn Lằn Ống Phóng (bầy) · Bọ Cạp Pháo (quái nặng). */
(function (C) {
  const E = C.E, R = C.gateRule(3), Base = C.BossBase(), OX = C.bossOX;

  const gate = {
    id: 3,
    name: 'Hẻm Núi Cát Đỏ',
    stageTime: R.stageTime,
    bg: { far: 'g3_far', mid: 'g3_mid', fg: 'g3_fg', farSpeed: 16, midSpeed: 70, fgSpeed: 270, sky: ['#f08a3c', '#ffd27a'] },
    bossName: 'KỀN KỀN CHÚA ỐNG LỒNG',
    bossShort: 'Kền Kền Chúa Ống Lồng',
    thumb: 'assets/ui/g3_thumb.webp',
    winText: 'Kền Kền Chúa Ống Lồng đã rơi xuống hẻm núi.',
    skin: {
      pillar_top: 'g3_pillar_top', pillar_bottom: 'g3_pillar_bottom', crystal_rock: 'g3_rock', thorn_vine: 'g3_vine', muzzle: 'g3_muzzle',
      boss_idle: 'g3_boss_idle', boss_attack: 'g3_boss_attack', boss_ram: 'g3_boss_ram', boss_defeat: 'g3_boss_defeat', boss_foam: 'g3_boss_foam',
      beetle: 'g3_lizard', beetle_shoot: 'g3_lizard_shoot', eagle: 'g3_scorpion', eagle_shoot: 'g3_scorpion_shoot'
    },
    timeline() {
      const ev = C.makeTimeline({ n: 3, minions: ['beetle', 'eagle'], obstacles: ['pillarTop', 'rock', 'vine', 'pillarBot'], banner: 'CỬA 3 · HẺM NÚI CÁT ĐỎ' });
      ev.push({ t: 3.2, f: g => { E.drop(g, 'bolt', C.W + 40, 300); g.addGauge(40); } });
      ev.push({ t: 4.5, f: g => g.banner(C.input.usingTouch ? 'CHIÊU MỚI: bấm GIÁP NỌC — quái chạm vào là bỏng!' : 'CHIÊU MỚI: bấm F — GIÁP NỌC ĐỘC!', 3, 'hint') });
      ev.push({ t: 30, f: g => g.banner('Tuyệt Mệnh đã tiến hóa: VÔ CỰC', 2.6, 'hint') });
      return ev.sort((a, b) => a.t - b.t);
    },
    makeBoss(g) { return new Vulture(g); }
  };
  // ảnh quái con cửa 3 chưa có → bỏ đổi hình, dùng quái cửa 1
  for (const k of ['beetle', 'beetle_shoot', 'eagle', 'eagle_shoot']) if (!C.SPRITES[gate.skin[k]]) delete gate.skin[k];
  C.GATES.push(gate);

  // =============================================================
  //   BOSS: KỀN KỀN CHÚA ỐNG LỒNG
  // =============================================================
  function Vulture(g) {
    Base.call(this, g);
    this.w = 410; this.r = 140; this.y = 330;
    this.bombT = 9; this.diveT = 7; this.chargeT = 16; this.burstN = 0;
  }
  const Q = Vulture.prototype = Object.create(Base.prototype);
  Q.constructor = Vulture;
  Q.baseHp = R.bossHp;            // 46 000
  Q.shieldMul = 1.4;
  Q.txt2 = 'GIÁP LÔNG SẮT! Xịt DỊCH ĐỘC để đốt';
  Q.txt3 = 'ĐIÊN CUỒNG! Nòng lồng kéo dài tối đa';
  Q.txtBreak = 'GIÁP LÔNG SẮT ĐÃ TAN!';

  Q.muzzle = function () { return { x: this.x - this.w * 0.43, y: this.y - 104 + (this.atkT > 0 ? 0 : 0) }; };
  Q.hitCircles = function () { return [[this.x + 30, this.y + 20, 130], [this.x - 125, this.y + 10, 62], [this.x - 20, this.y - 110, 55]]; };

  Q.shell = function (a, speed, r) {
    const m = this.muzzle();
    this.g.ebullets.push({ kind: 'shell', spr: 'g3_proj_big', face: true, sz: 4.2, x: m.x, y: m.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: r || 22, rot: 0, vr: 0, hp: 3 });
  };
  Q.fire = function (n, spread, speed) {
    const g = this.g, m = this.muzzle(), p = g.player;
    const base = Math.atan2(p.y - m.y, p.x - m.x);
    for (let i = 0; i < n; i++) this.shell(base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread), speed);
    this.atkT = 0.5; C.sfx.play('bossShot'); C.shake(6);
    C.emit({ kind: 'img', img: 'g3_muzzle', x: m.x - 50, y: m.y, max: 0.2, s0: 140, s1: 190, layer: 2, rot: Math.PI });
    this.x += 18; // giật lùi
  };
  Q.lobBombs = function (n) {
    const g = this.g, m = this.muzzle();
    for (let i = 0; i < n; i++) {
      const vx = -C.rand(260, 520), vy = -C.rand(380, 620);
      g.ebullets.push({ kind: 'bomb', spr: 'g3_bomb', sz: 3.8, x: m.x, y: m.y, vx, vy, grav: 640, r: 22, rot: 0, vr: C.rand(-5, 5), hp: 2 });
    }
    this.atkT = 0.5; C.sfx.play('bossShot'); C.emit({ kind: 'img', img: 'g3_muzzle', x: m.x - 40, y: m.y - 20, max: 0.2, s0: 120, s1: 160, layer: 2, rot: Math.PI * 1.2 });
  };

  Q.attacks = function (dt) {
    const g = this.g;
    this.fireT -= dt; this.bombT -= dt; this.diveT -= dt;
    if (this.chargeT < 1.6) return;
    if (this.diveT <= 0) { // BỔ NHÀO CÀO MÓNG
      this.state = 'diveTele'; this.t = 0; this.diveT = this.phase === 1 ? 10 : this.phase === 2 ? 8 : 6;
      this.diveTo = { x: C.clamp(g.player.x, 200, C.W - 520), y: C.clamp(g.player.y, 150, 580) }; C.sfx.play('warn'); return;
    }
    if (this.phase >= 2 && this.bombT <= 0) { this.bombT = this.phase === 2 ? 7 : 5; this.lobBombs(this.phase === 2 ? 2 : 3); }
    if (this.fireT <= 0) {
      if (this.phase === 1) { // nòng lồng: loạt 3 phát nối nhau
        this.fire(1, 0, 520); this.burstN = (this.burstN + 1) % 3; this.fireT = this.burstN ? 0.28 : 1.9;
      } else if (this.phase === 2) { this.fire(3, 0.45, 500); this.fireT = 1.8; }
      else { this.fire(5, 0.8, 540); this.fireT = 1.4; }
    }
    if (this.phase >= 2) {
      this.summonT -= dt;
      if (this.summonT <= 0) {
        this.summonT = this.phase === 3 ? 8 : 10;
        for (let i = 0; i < 2; i++) E.spawn(g, 'eagle', { x: this.x, y: C.rand(160, 560), stopX: C.rand(820, 960) });
      }
    }
  };

  Q.custom = function (dt) {
    const g = this.g, st = this.state;
    if (st !== 'diveTele' && st !== 'dive' && st !== 'diveBack') return false;
    if (this.stunT > 0 && st !== 'diveBack') { this.state = st === 'dive' ? 'diveBack' : 'fight'; return true; }
    if (st === 'diveTele') { // vỗ cánh lấy đà, rít lên
      this.y = C.lerp(this.y, 170, dt * 3); this.x += Math.sin(this.t * 50) * 1.5;
      if (this.t > 0.75) { this.state = 'dive'; this.t = 0; C.shake(10); C.sfx.play('dash'); }
    } else if (st === 'dive') { // lao xuống cào
      const to = this.diveTo, dx = to.x - this.x, dy = to.y - this.y, d = Math.hypot(dx, dy) || 1, v = 1450 * dt;
      if (d > v) { this.x += dx / d * v; this.y += dy / d * v; }
      if (Math.random() < 0.7) C.emit({ kind: 'glow', img: C.G.orange, x: this.x + C.rand(-60, 60), y: this.y + C.rand(-40, 80), vx: 200, max: 0.3, s0: 20, s1: 60, add: true, layer: 1 });
      if (d <= v || this.t > 0.7) {
        this.state = 'diveBack'; this.t = 0; C.shake(18); C.sfx.play('explode');
        C.emit({ kind: 'img', img: 'g3_impact', x: this.x - 80, y: this.y + 60, max: 0.4, s0: 180, s1: 260, layer: 2 });
        for (let i = 0; i < (this.phase === 3 ? 8 : 5); i++) { const a = Math.PI + C.rand(-1.2, 1.2), vv = C.rand(260, 420); g.ebullets.push({ kind: 'spike', x: this.x - 60, y: this.y + 40, vx: Math.cos(a) * vv, vy: Math.sin(a) * vv, r: 12, rot: 0, vr: 6, hp: 1 }); }
      }
    } else if (st === 'diveBack') {
      const hx = 1010 + this.ox();
      this.x = Math.min(hx, this.x + 620 * dt); this.y = C.lerp(this.y, 330, dt * 2);
      if (this.x >= hx - 2) { this.state = 'fight'; this.t = 0; }
    }
    return true;
  };

  Q.pose = function () {
    const st = this.state;
    if (st === 'diveTele') return ['g3_boss_special', 0, 0.95, 0];
    if (st === 'dive') return ['g3_boss_special', this.t < 0.2 ? 1 : 2, 0.95, 0];
    if (st === 'diveBack') return ['g3_boss_special', 3, 0.95, 0];
    if (this.atkT > 0 && !(this.stunT > 0) && !(this.hurtT > 0)) return ['g3_boss_attack', this.atkT > 0.38 ? 1 : this.atkT > 0.2 ? 2 : 3];
    return null;
  };

  Q.draw = function (ctx) {
    if (this.state === 'diveTele' && this.diveTo) {
      const k = 0.5 + 0.5 * Math.sin(this.t * 40);
      ctx.save(); ctx.strokeStyle = `rgba(255,90,40,${0.5 + 0.4 * k})`; ctx.lineWidth = 6; ctx.setLineDash([24, 12]);
      ctx.beginPath(); ctx.moveTo(this.x - 80, this.y + 40); ctx.lineTo(this.diveTo.x, this.diveTo.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.3 * k; ctx.drawImage(C.G.red, this.diveTo.x - 120, this.diveTo.y - 120, 240, 240);
      ctx.restore();
    }
    Base.prototype.draw.call(this, ctx);
  };
})(window.C);
