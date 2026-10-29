/* CALOTA — ĐẤU TRƯỜNG BOSS (mở khi hạ boss cửa 4)
   Chỉ đánh boss: lần lượt từng boss của 4 cửa, rồi các vòng HỖN HỢP 2 boss cùng lúc.
   Gom đủ mọi chiêu không phân chia: Phun, Siêu phun, Giáp nọc (F), Tuyệt Mệnh Vô Cực (Q), Hắc Song Trùng (R).
   Boss trâu – Calota trâu: 8 tim, súng luôn ≥ cấp 2, nạp dịch độc và nộ nhanh hơn.
   Thua giữa chừng → đánh lại đúng vòng đang đánh. */
(function (C) {
  const ROUNDS = [
    { b: [0], mul: 0.85 }, { b: [1], mul: 0.85 }, { b: [2], mul: 0.85 }, { b: [3], mul: 0.85 },
    { b: [0, 2], mul: 0.6 }, { b: [1, 3], mul: 0.6 }
  ];
  const arena = {
    id: 'boss', label: 'ĐẤU TRƯỜNG BOSS', name: 'Toàn chiêu · Boss liên hoàn', bossShort: '4 boss + vòng hỗn hợp',
    stageTime: 4, allSkills: true, rageMode: 'vc', minGun: 2, noResume: true, maxHp: 8, gaugeMul: 2, rageMul: 1.5,
    thumb: 'assets/ui/g4_thumb.webp', winText: 'Calota đã hạ toàn bộ boss trong Đấu Trường!',
    bg: null, skin: {}, bossName: '', curRound: 0,
    timeline() {
      return [
        { t: 0.4, f: g => g.banner('ĐẤU TRƯỜNG BOSS', 2.4, 'title') },
        { t: 1.6, f: g => g.banner(C.input.usingTouch ? 'Đủ mọi chiêu: GIÁP NỌC · TUYỆT MỆNH · SONG TRÙNG' : 'Đủ mọi chiêu: F giáp nọc · Q Vô Cực · R Song Trùng', 2.6, 'hint') },
        { t: 3.6, f: g => g.startBoss() }
      ];
    },
    onStart(g, fromBoss) {
      g.player.maxHp = g.player.hp = arena.maxHp; g.gunLv = 3; g.gauge = 60; g.rage = fromBoss ? 60 : 30;
      if (!fromBoss) arena.curRound = 0; arena.wait = null;
      arena.useGate(C.GATES[ROUNDS[arena.curRound].b[0]]);
    },
    useGate(gt) { arena.bg = gt.bg; arena.skin = gt.skin || {}; C.skin = arena.skin; },
    startBoss(g) { arena.spawnRound(g, arena.curRound); },
    spawnRound(g, i) {
      const R = ROUNDS[i], gates = R.b.map(k => C.GATES[k]);
      arena.curRound = i; arena.useGate(gates[0]);
      g.bosses = gates.map((gt, j) => {
        const B = gt.makeBoss(g); B.skin = gt.skin || {};
        B.maxHp = B.hp = Math.round(B.maxHp * R.mul);
        if (R.b.length > 1) { B.yOff = j ? 150 : -150; B.xOff = j ? 40 : -90; B.w *= 0.82; B.x += j * 160; }
        return B;
      });
      g.boss = g.bosses[0];
      arena.bossName = gates.map(gt => gt.bossName).join(' + ');
      C.sfx.music('boss'); C.shake(12);
      g.banner('VÒNG ' + (i + 1) + '/' + ROUNDS.length + (R.b.length > 1 ? ' · HỖN HỢP' : ''), 2.2, 'title');
      setTimeout(() => g.banner(arena.bossName, 2.4, 'boss'), 600);
    },
    /** 1 boss vừa nổ xong. Trả về true nếu trận chưa kết thúc */
    onBossDown(g, B) {
      g.bosses = g.bosses.filter(x => x !== B && x.state !== 'dying');
      if (g.bosses.length) { g.boss = g.bosses[0]; C.sfx.music('boss'); return true; }
      if (arena.curRound + 1 >= ROUNDS.length) { g.boss = B; return false; } // hết vòng → THẮNG
      // nghỉ giữa vòng: hồi 2 tim, rơi tiếp tế
      const p = g.player; p.hp = Math.min(p.maxHp, p.hp + 2); g.boss = null;
      g.banner('+2 TIM · chuẩn bị vòng ' + (arena.curRound + 2), 2, 'hint');
      C.E.drop(g, 'bolt', C.W + 40, 260); C.E.drop(g, 'shield', C.W + 40, 460);
      arena.wait = { t: 1.4, stage: 0, next: arena.curRound + 1 };
      return true;
    },
    /** đếm giờ nghỉ giữa vòng theo thời gian game (dừng khi tạm dừng) */
    tick(g, dt) {
      const w = arena.wait; if (!w) return;
      w.t -= dt; if (w.t > 0) return;
      if (w.stage === 0) { arena.curRound = w.next; g.bossWarning(); w.stage = 1; w.t = 2.6; }
      else { arena.wait = null; arena.spawnRound(g, w.next); }
    },
    makeBoss(g) { return C.GATES[0].makeBoss(g); },
    rounds: ROUNDS
  };
  Object.defineProperty(arena, 'bossNameLive', { get: () => arena.bossName });
  C.GATES.push(arena);
})(window.C);
