/* CALOTA — hiệu ứng: hạt, rung màn hình, chữ sát thương, và CHIÊU PHUN HÓA CHẤT */
(function (C) {
  // ---------- bộ đệm ánh sáng (vẽ sẵn để chạy nhanh trên điện thoại) ----------
  const glowCache = {};
  function glow(key, stops) {
    if (glowCache[key]) return glowCache[key];
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (glowCache[key] = c);
  }
  const G = C.G = {};
  C.initGlows = function () {
    G.lime = glow('lime', [[0, 'rgba(240,255,170,1)'], [0.25, 'rgba(180,255,60,0.9)'], [0.6, 'rgba(60,230,80,0.35)'], [1, 'rgba(0,120,40,0)']]);
    G.teal = glow('teal', [[0, 'rgba(160,255,230,0.8)'], [0.4, 'rgba(30,220,170,0.4)'], [1, 'rgba(0,90,80,0)']]);
    G.toxic = glow('toxic', [[0, 'rgba(90,220,40,0.75)'], [0.5, 'rgba(40,170,50,0.35)'], [1, 'rgba(10,80,30,0)']]);
    G.goo = glow('goo', [[0, 'rgba(150,240,30,0.95)'], [0.45, 'rgba(70,200,40,0.6)'], [1, 'rgba(20,110,30,0)']]);
    G.purple = glow('purple', [[0, 'rgba(230,170,255,0.9)'], [0.4, 'rgba(170,70,255,0.45)'], [1, 'rgba(80,0,160,0)']]);
    G.smoke = glow('smoke', [[0, 'rgba(120,110,130,0.55)'], [0.6, 'rgba(90,85,100,0.25)'], [1, 'rgba(60,60,70,0)']]);
    G.white = glow('white', [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,220,0.7)'], [1, 'rgba(255,255,200,0)']]);
    G.orange = glow('orange', [[0, 'rgba(255,250,200,1)'], [0.3, 'rgba(255,190,60,0.8)'], [1, 'rgba(255,90,0,0)']]);
    G.red = glow('red', [[0, 'rgba(255,200,200,0.9)'], [0.4, 'rgba(255,60,40,0.5)'], [1, 'rgba(160,0,0,0)']]);
  };

  // ---------- hạt ----------
  const P = C.particles = [];
  const MAX = 1100;
  C.emit = function (p) {
    if (P.length >= MAX) P.shift();
    p.t = 0; p.max = p.max || 0.5; p.vx = p.vx || 0; p.vy = p.vy || 0;
    p.s0 = p.s0 == null ? 10 : p.s0; p.s1 = p.s1 == null ? p.s0 : p.s1; p.a0 = p.a0 == null ? 1 : p.a0;
    P.push(p); return p;
  };
  C.updateParticles = function (dt) {
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.t += dt;
      if (p.t >= p.max) { if (p.onDie) p.onDie(p); P.splice(i, 1); continue; }
      if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
      if (p.grav) p.vy += p.grav * dt;
      if (p.wob) p.x += Math.sin((p.t + p.seed) * p.wob) * 30 * dt;
      if (p.follow) { p.x += p.follow.dx || 0; p.y += p.follow.dy || 0; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.vr) p.rot = (p.rot || 0) + p.vr * dt;
    }
  };
  C.drawParticles = function (ctx, layer) {
    for (const p of P) {
      if ((p.layer || 0) !== layer) continue;
      const k = p.t / p.max, s = p.s0 + (p.s1 - p.s0) * k;
      let a = p.a0 * (p.fadeIn ? Math.min(1, k / p.fadeIn) : 1) * (1 - Math.pow(k, p.fadePow || 1.6));
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
      switch (p.kind) {
        case 'glow': ctx.drawImage(p.img, p.x - s, p.y - s, s * 2, s * 2); break;
        case 'drop': {
          const sp = Math.hypot(p.vx, p.vy) || 1, L = Math.min(28, sp * 0.03) + s;
          ctx.strokeStyle = p.color; ctx.lineWidth = s; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / sp * L, p.y - p.vy / sp * L); ctx.stroke();
          if (p.add) { ctx.drawImage(G.lime, p.x - s * 2.5, p.y - s * 2.5, s * 5, s * 5); }
          break;
        }
        case 'bubble': {
          ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 7); ctx.stroke();
          ctx.fillStyle = 'rgba(200,255,200,0.25)'; ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(p.x - s * 0.35, p.y - s * 0.35, s * 0.25, 0, 7); ctx.fill();
          break;
        }
        case 'blob': {
          ctx.fillStyle = p.color; ctx.strokeStyle = p.edge || '#0f5a22'; ctx.lineWidth = Math.max(1.5, s * 0.22);
          ctx.beginPath(); ctx.ellipse(p.x, p.y, s, s * (p.squash || 1), p.rot || 0, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,230,0.75)'; ctx.beginPath(); ctx.arc(p.x - s * 0.3, p.y - s * 0.35, s * 0.28, 0, 7); ctx.fill();
          break;
        }
        case 'ring': ctx.strokeStyle = p.color; ctx.lineWidth = p.lw ? p.lw * (1 - k) + 1 : 4; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 7); ctx.stroke(); break;
        case 'drip': {
          ctx.fillStyle = p.color; ctx.beginPath();
          ctx.ellipse(p.x, p.y, s * 0.55, s * (1 + Math.min(2.2, p.vy / 120)), 0, 0, 7); ctx.fill();
          break;
        }
        case 'img': C.spr(ctx, p.img, 0, p.x, p.y, s, { rot: p.rot }); break;
        case 'text': {
          ctx.font = `900 ${Math.round(s)}px "Baloo 2", system-ui, sans-serif`; ctx.textAlign = 'center';
          ctx.lineWidth = Math.max(3, s * 0.18); ctx.strokeStyle = p.stroke || '#16301c'; ctx.strokeText(p.text, p.x, p.y);
          ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y); break;
        }
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };

  // ---------- rung / chớp màn hình ----------
  C.cam = { shake: 0, shakeHold: 0, flash: 0, flashColor: '#fff', tint: 0, slow: 0, slowT: 0 };
  C.shake = (v) => { C.cam.shake = Math.max(C.cam.shake, v); };
  C.flash = (v, c) => { C.cam.flash = Math.max(C.cam.flash, v); C.cam.flashColor = c || '#fff'; };

  C.dmgText = function (x, y, val, color, size) {
    C.emit({ kind: 'text', text: String(Math.round(val)), x: x + C.rand(-14, 14), y, vy: -90, drag: 2, max: 0.8, s0: size || 26, s1: (size || 26) * 0.9, color: color || '#fff', layer: 3, fadePow: 3 });
  };
  C.explode = function (x, y, size) {
    C.emit({ kind: 'img', img: 'explosion', x, y, max: 0.55, s0: size * 0.5, s1: size * 1.25, layer: 2, fadePow: 2.5, rot: C.rand(-0.4, 0.4) });
    C.emit({ kind: 'glow', img: G.orange, x, y, max: 0.35, s0: size * 0.5, s1: size * 1.2, add: true, layer: 2 });
    for (let i = 0; i < 10; i++) { const a = C.rand(0, 6.28), v = C.rand(150, 420); C.emit({ kind: 'glow', img: G.orange, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 3, max: C.rand(0.3, 0.6), s0: 10, s1: 2, add: true, layer: 2 }); }
    for (let i = 0; i < 5; i++) C.emit({ kind: 'glow', img: G.smoke, x: x + C.rand(-20, 20), y: y + C.rand(-20, 20), vx: C.rand(-40, 40), vy: C.rand(-80, -20), max: C.rand(0.8, 1.3), s0: size * 0.3, s1: size * 0.8, layer: 2, a0: 0.8 });
  };
  C.spark = function (x, y, size) {
    C.emit({ kind: 'img', img: 'hitspark', x, y, max: 0.18, s0: size * 0.6, s1: size, layer: 2, rot: C.rand(0, 6.28) });
  };

  // =====================================================================
  //   CHIÊU PHUN HÓA CHẤT
  //   - phun thường: giữ nút, tốn thanh hóa chất
  //   - SIÊU PHUN: khi thanh đầy — cut-in, luồng khổng lồ, ăn mòn tối đa
  // =====================================================================
  const Chem = C.Chem = {
    active: false, ult: false, power: 0, t: 0,
    x: 0, y: 0, dir: 0, range: 430, half: 0.26, hitDist: null, hitPoint: null,
    emitAcc: 0
  };
  Chem.params = function () {
    return Chem.ult ? { range: 1150, half: 0.5, w0: 34, w1: 230 } : { range: 520, half: 0.25, w0: 14, w1: 96 };
  };
  /** điểm (px,py) bán kính r có nằm trong luồng phun không. Trả về khoảng cách hoặc -1 */
  Chem.inCone = function (px, py, r) {
    if (Chem.power < 0.2) return -1;
    const pr = Chem.params(); const dx = px - Chem.x, dy = py - Chem.y; const d = Math.hypot(dx, dy);
    if (d - r > pr.range) return -1;
    const ang = Math.abs(C.angleDiff(Math.atan2(dy, dx), Chem.dir));
    const allow = pr.half + Math.atan2(r, Math.max(d, 1));
    return ang <= allow ? d : -1;
  };

  Chem.update = function (dt, on, ult, nx, ny) {
    Chem.x = nx; Chem.y = ny; Chem.t += dt;
    const was = Chem.power > 0;
    Chem.ult = ult;
    Chem.power = C.clamp(Chem.power + (on || ult ? dt * 8 : -dt * 10), 0, 1);
    Chem.active = Chem.power > 0;
    C.sfx.hiss(Chem.active ? (ult ? 1 : 0.6 * Chem.power) : 0);
    if (!Chem.active) { if (was) Chem.hitDist = null; return; }
    // dao động hướng phun nhẹ cho sống động
    Chem.dir = Math.sin(Chem.t * 7) * (ult ? 0.05 : 0.035);
    const pr = Chem.params();
    const len = Math.min(pr.range, Chem.hitDist || pr.range) * Chem.power;
    const rate = (ult ? 260 : 120) * Chem.power;
    Chem.emitAcc += rate * dt;
    while (Chem.emitAcc > 1) {
      Chem.emitAcc--;
      const r = Math.random();
      const a = Chem.dir + C.rand(-pr.half, pr.half) * 0.8;
      const ca = Math.cos(a), sa = Math.sin(a);
      if (r < 0.25) { // cục chất lỏng có viền bay trong luồng
        const v = C.rand(900, 1300) * (ult ? 1.3 : 1);
        C.emit({ kind: 'blob', color: Math.random() < 0.6 ? '#9be22c' : '#4fd04a', x: Chem.x, y: Chem.y, vx: ca * v, vy: sa * v, drag: 1.2, max: len / v * 0.95, s0: ult ? 9 : 5, s1: ult ? 26 : 14, layer: 2, fadePow: 4, squash: 0.7, rot: a });
      } else if (r < 0.45) { // quầng sáng độc
        const v = C.rand(900, 1400) * (ult ? 1.3 : 1);
        C.emit({ kind: 'glow', img: G.goo, x: Chem.x, y: Chem.y, vx: ca * v, vy: sa * v, drag: 1.8, max: len / v * 1.15, s0: ult ? 18 : 9, s1: ult ? 80 : 40, layer: 1, a0: 0.7, fadePow: 2.2 });
      } else if (r < 0.7) { // sương độc lan ra
        const d = C.rand(0.25, 1) * len, v = C.rand(60, 160);
        C.emit({ kind: 'glow', img: Math.random() < 0.25 ? G.purple : G.toxic, x: Chem.x + ca * d, y: Chem.y + sa * d, vx: ca * v + C.rand(-40, 40), vy: sa * v + C.rand(-60, 10), drag: 1.2, max: C.rand(0.7, 1.3), s0: ult ? 60 : 28, s1: ult ? 210 : 105, layer: 1, a0: ult ? 0.6 : 0.45, fadeIn: 0.15 });
      } else if (r < 0.88) { // giọt hóa chất rơi theo trọng lực
        const v = C.rand(500, 900);
        C.emit({ kind: 'blob', color: Math.random() < 0.5 ? '#a6ee2e' : '#5ad84a', x: Chem.x, y: Chem.y, vx: ca * v, vy: sa * v - C.rand(40, 160), grav: 1100, max: C.rand(0.5, 0.9), s0: C.rand(3.5, 6), s1: 2.5, layer: 2 });
      } else if (r < 0.97) { // bong bóng sủi
        const d = C.rand(0.2, 0.9) * len;
        C.emit({ kind: 'bubble', color: Math.random() < 0.3 ? 'rgba(200,120,255,0.9)' : 'rgba(160,255,120,0.95)', x: Chem.x + ca * d, y: Chem.y + sa * d + C.rand(-20, 20), vx: C.rand(-30, 30), vy: C.rand(-120, -40), wob: 9, seed: Math.random() * 9, max: C.rand(0.5, 1.0), s0: C.rand(4, 9), s1: C.rand(8, 16), layer: 2, onDie: popBubble });
      } else { // tia tím độc hiếm cho chiều sâu màu
        const v = C.rand(700, 1100);
        C.emit({ kind: 'glow', img: G.purple, x: Chem.x, y: Chem.y, vx: ca * v, vy: sa * v, drag: 2, max: 0.35, s0: 5, s1: 26, add: true, layer: 2 });
      }
    }
    // tia sáng ở miệng vòi
    if (Math.random() < 0.5) C.emit({ kind: 'glow', img: G.white, x: Chem.x, y: Chem.y, max: 0.08, s0: ult ? 70 : 34, s1: ult ? 90 : 46, add: true, layer: 2 });
    // tóe hóa chất tại điểm trúng
    if (Chem.hitPoint && Math.random() < (ult ? 0.9 : 0.6)) Chem.splash(Chem.hitPoint.x, Chem.hitPoint.y, ult ? 2 : 1);
  };
  function popBubble(p) { C.emit({ kind: 'ring', color: 'rgba(200,255,170,0.9)', x: p.x, y: p.y, max: 0.15, s0: 3, s1: 14, lw: 3, layer: 2 }); }

  Chem.splash = function (x, y, k) {
    for (let i = 0; i < 3 * k; i++) {
      const a = Math.PI + C.rand(-1.3, 1.3), v = C.rand(200, 520);
      C.emit({ kind: 'blob', color: Math.random() < 0.5 ? '#b0f034' : '#62dc4c', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, grav: 1300, max: C.rand(0.3, 0.6), s0: C.rand(3.5, 7), s1: 2, layer: 2 });
    }
    C.emit({ kind: 'blob', color: '#9be22c', x: x + C.rand(-10, 10), y: y + C.rand(-14, 14), max: 0.14, s0: 10 * k, s1: 26 * k, layer: 2, squash: 0.8, fadePow: 3 });
    C.emit({ kind: 'glow', img: G.lime, x, y, max: 0.1, s0: 24 * k, s1: 44 * k, add: true, layer: 2, a0: 0.5 });
    if (Math.random() < 0.35 * k) C.emit({ kind: 'glow', img: G.smoke, x: x + C.rand(-20, 20), y, vx: C.rand(-20, 20), vy: C.rand(-140, -70), max: C.rand(0.7, 1.1), s0: 16, s1: 60, layer: 2, a0: 0.75 });
  };
  /** Vệt nhỏ giọt + khói xèo xèo trên mục tiêu bị ăn mòn */
  Chem.corrode = function (x, y, w, h, level) {
    if (Math.random() < 0.08 + level * 0.05) C.emit({ kind: 'drip', color: Math.random() < 0.5 ? 'rgba(170,255,70,0.95)' : 'rgba(90,240,150,0.9)', x: x + C.rand(-w * 0.4, w * 0.4), y: y + C.rand(-h * 0.2, h * 0.3), vy: 20, grav: 260, max: C.rand(0.6, 1.1), s0: C.rand(4, 7), s1: 3, layer: 2 });
    if (Math.random() < 0.04 + level * 0.03) C.emit({ kind: 'glow', img: G.smoke, x: x + C.rand(-w * 0.4, w * 0.4), y: y + C.rand(-h * 0.4, h * 0.2), vx: C.rand(-15, 15), vy: C.rand(-90, -40), max: C.rand(0.8, 1.4), s0: 10, s1: 46, layer: 2, a0: 0.7 });
    if (Math.random() < 0.03 + level * 0.02) C.emit({ kind: 'bubble', color: 'rgba(190,255,90,0.9)', x: x + C.rand(-w * 0.35, w * 0.35), y: y + C.rand(-h * 0.35, h * 0.35), vy: -20, max: C.rand(0.3, 0.5), s0: 3, s1: 9, layer: 2, onDie: popBubble });
  };

  /** Vẽ luồng chất lỏng dạng dải uốn lượn nhiều lớp (vẽ trước hạt) */
  Chem.drawJet = function (ctx) {
    if (!Chem.active) return;
    const pr = Chem.params(), len = Math.min(pr.range, Chem.hitDist || pr.range) * Chem.power;
    if (len < 10) return;
    ctx.save(); ctx.translate(Chem.x, Chem.y); ctx.rotate(Chem.dir);
    const N = 22, t = Chem.t;
    const shape = (wMul, amp) => {
      const up = [], dn = [];
      for (let i = 0; i <= N; i++) {
        const k = i / N, d = k * len;
        const wob = Math.sin(d * 0.035 - t * 38) * amp * k * (Chem.ult ? 2.2 : 1) + Math.sin(d * 0.011 - t * 13) * amp * 0.6 * k;
        const w = (pr.w0 + (pr.w1 - pr.w0) * Math.pow(k, 0.8)) * wMul * (1 + 0.12 * Math.sin(t * 50 + i));
        up.push([d, wob - w / 2]); dn.push([d, wob + w / 2]);
      }
      ctx.beginPath(); ctx.moveTo(up[0][0], up[0][1]);
      for (const p of up) ctx.lineTo(p[0], p[1]);
      // đầu luồng bo tròn
      const e1 = up[N], e2 = dn[N]; ctx.quadraticCurveTo(e1[0] + (e2[1] - e1[1]) * 0.45, (e1[1] + e2[1]) / 2, e2[0], e2[1]);
      for (let i = dn.length - 1; i >= 0; i--) ctx.lineTo(dn[i][0], dn[i][1]);
      ctx.closePath();
    };
    // quầng độc phía sau
    ctx.globalCompositeOperation = 'source-over';
    shape(1.25, 12); const gh = ctx.createLinearGradient(0, 0, len, 0);
    gh.addColorStop(0, 'rgba(60,200,60,0.35)'); gh.addColorStop(1, 'rgba(120,60,220,0.08)'); ctx.fillStyle = gh; ctx.fill();
    // thân chất lỏng có viền đậm kiểu hoạt hình
    shape(0.62, 7);
    const gb = ctx.createLinearGradient(0, 0, len, 0);
    gb.addColorStop(0, '#d8ff5a'); gb.addColorStop(0.35, '#8fe02a'); gb.addColorStop(1, 'rgba(60,190,60,0.55)');
    ctx.fillStyle = gb; ctx.fill();
    ctx.lineWidth = Chem.ult ? 5 : 3; ctx.strokeStyle = 'rgba(16,80,30,0.85)'; ctx.lineJoin = 'round'; ctx.stroke();
    // lõi sáng
    ctx.globalCompositeOperation = 'lighter';
    shape(0.2, 4); const gc = ctx.createLinearGradient(0, 0, len, 0);
    gc.addColorStop(0, 'rgba(255,255,220,0.95)'); gc.addColorStop(1, 'rgba(220,255,140,0.1)'); ctx.fillStyle = gc; ctx.fill();
    // vệt tốc độ chạy dọc luồng
    ctx.strokeStyle = 'rgba(240,255,200,0.55)'; ctx.lineWidth = Chem.ult ? 4 : 2; ctx.lineCap = 'round';
    for (let i = 0; i < (Chem.ult ? 9 : 5); i++) {
      const ph = ((t * 3.2 + i * 0.37) % 1), d = ph * len, sl = 60 + 80 * ph;
      const off = Math.sin(i * 12.9) * (pr.w0 + (pr.w1 - pr.w0) * ph) * 0.35;
      ctx.beginPath(); ctx.moveTo(d, off); ctx.lineTo(Math.min(len, d + sl), off); ctx.stroke();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
  };
})(window.C);
