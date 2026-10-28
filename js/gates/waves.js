/* CALOTA — quy tắc độ khó theo cửa + bộ sinh đợt quái cho cửa 2 trở đi
   Quy tắc (Vinh chốt): từ cửa 2, đoạn bay DÀI hơn và quái ra NHIỀU hơn sau mỗi cửa. */
(function (C) {
  /** thời lượng đoạn bay (giây) và hệ số mật độ quái của cửa n */
  C.gateRule = function (n) {
    return {
      stageTime: Math.min(80 + 25 * (n - 1), 230),   // cửa 1: 80s · cửa 2: 105s · cửa 3: 130s … cửa 7: 230s
      density: 1 + 0.35 * (n - 1),                    // cửa 2: ×1.35 · cửa 3: ×1.7 · … cửa 7: ×3.1
      shooterChance: Math.min(0.45 + 0.08 * (n - 1), 0.9), // tỉ lệ quái có bắn
      bossHp: 30000 + 8000 * (n - 1)
    };
  };

  /**
   * Sinh timeline cho một cửa từ danh sách quái của cửa đó.
   * cfg = { n, minions: ['typeA','typeB'], obstacles: ['pillarTop','pillarBot','rock','vine'], banner: 'CỬA 2 · …' }
   * Mỗi "nhịp" 12s gồm: 1 đợt bầy, 1 đợt quái mạnh, vật cản, vật phẩm; mật độ tăng dần trong cửa và theo cửa.
   */
  C.makeTimeline = function (cfg) {
    const E = C.E, R = C.gateRule(cfg.n), ev = [], at = (t, f) => ev.push({ t, f });
    const rnd = (a, b) => a + Math.random() * (b - a);
    at(0.6, g => g.banner(cfg.banner, 2.6, 'title'));
    const T = R.stageTime;
    for (let t = 3, beat = 0; t < T - 6; t += 12, beat++) {
      const ramp = 1 + (t / T) * 0.6;                     // càng về cuối cửa càng dày
      const swarm = Math.round(4 * R.density * ramp);
      const y0 = rnd(160, 560);
      for (let i = 0; i < swarm; i++) at(t + i * 0.28, g => E.spawn(g, cfg.minions[0], { y: C.clamp(y0 + Math.sin(i) * 90, 120, 600), amp: 50 }));
      const heavy = Math.max(1, Math.round(R.density * ramp * 0.8));
      for (let i = 0; i < heavy; i++) at(t + 4 + i * 0.9, g => E.spawn(g, cfg.minions[1] || cfg.minions[0], { y: rnd(160, 560), stopX: rnd(880, 1000) }));
      const ob = cfg.obstacles || [];
      if (ob.length) at(t + 7, g => E.spawn(g, ob[beat % ob.length], { y: rnd(200, 520) }));
      if (beat % 2 === 0) at(t + 8, g => E.drop(g, 'bolt', C.W + 40, rnd(200, 520)));
      if (beat % 3 === 1) at(t + 9, g => E.drop(g, Math.random() < 0.5 ? 'heart' : 'shield', C.W + 40, 360));
      for (let i = 0; i < 5; i++) at(t + 10 + i * 0.18, g => E.drop(g, 'coin', C.W + 40, 300 + Math.sin(i) * 60));
    }
    at(T - 4, g => g.bossWarning());
    at(T, g => g.startBoss());
    return ev.sort((a, b) => a.t - b.t);
  };
})(window.C);
