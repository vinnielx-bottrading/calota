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
    G.foam = glow('foam', [[0, 'rgba(255,255,255,0.95)'], [0.45, 'rgba(220,240,255,0.55)'], [1, 'rgba(180,215,245,0)']]);
    G.ice = glow('ice', [[0, 'rgba(230,248,255,1)'], [0.35, 'rgba(140,210,255,0.6)'], [1, 'rgba(60,150,230,0)']]);
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
        case 'img': C.spr(ctx, p.img, p.f || 0, p.x, p.y, s, { rot: p.rot, flip: p.flip }); break;
        case 'anim': { const n = (C.SPRITES[p.img] || { n: 1 }).n; C.spr(ctx, p.img, Math.min(n - 1, Math.floor(k * n)), p.x, p.y, s, { rot: p.rot, flip: p.flip }); break; }
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
      if (r < 0.3) { // cục bọt bay trong luồng
        const v = C.rand(900, 1300) * (ult ? 1.3 : 1);
        C.emit({ kind: 'blob', color: '#ffffff', edge: '#6fa3c8', x: Chem.x, y: Chem.y, vx: ca * v, vy: sa * v, drag: 1.2, max: len / v * 0.95, s0: ult ? 10 : 6, s1: ult ? 30 : 16, layer: 2, fadePow: 4, squash: 0.8, rot: a });
      } else if (r < 0.5) { // hơi bọt mờ lan ra
        const d = C.rand(0.3, 1) * len, v = C.rand(60, 160);
        C.emit({ kind: 'glow', img: G.foam, x: Chem.x + ca * d, y: Chem.y + sa * d, vx: ca * v + C.rand(-40, 40), vy: sa * v + C.rand(-50, 20), drag: 1.2, max: C.rand(0.8, 1.4), s0: ult ? 50 : 24, s1: ult ? 190 : 90, layer: 1, a0: ult ? 0.55 : 0.4, fadeIn: 0.15 });
      } else if (r < 0.8) { // giọt bọt văng & rơi
        const v = C.rand(500, 950);
        C.emit({ kind: 'blob', color: Math.random() < 0.7 ? '#ffffff' : '#dff1ff', edge: '#6fa3c8', x: Chem.x, y: Chem.y, vx: ca * v + C.rand(-80, 80), vy: sa * v - C.rand(40, 220), grav: 1100, max: C.rand(0.6, 1.1), s0: C.rand(4, 8), s1: 3, layer: 2, onDie: groundDrop });
      } else { // bong bóng xà phòng
        const d = C.rand(0.15, 0.9) * len;
        C.emit({ kind: 'bubble', color: 'rgba(120,190,240,0.95)', x: Chem.x + ca * d, y: Chem.y + sa * d + C.rand(-24, 24), vx: C.rand(-30, 30), vy: C.rand(-130, -40), wob: 9, seed: Math.random() * 9, max: C.rand(0.6, 1.2), s0: C.rand(4, 9), s1: C.rand(9, 18), layer: 2, onDie: popBubble });
      }
    }
    // tóe bọt tại điểm trúng
    Chem.splashT = (Chem.splashT || 0) - dt;
    if (Chem.hitPoint && Chem.splashT <= 0) { Chem.splashT = ult ? 0.07 : 0.12; Chem.splash(Chem.hitPoint.x, Chem.hitPoint.y, ult ? 2 : 1); }
  };
  function popBubble(p) { C.emit({ kind: 'ring', color: 'rgba(200,235,255,0.95)', x: p.x, y: p.y, max: 0.15, s0: 3, s1: 14, lw: 3, layer: 2 }); }
  // giọt rơi chạm đất → đọng thành vũng bọt
  function groundDrop(p) { if (p.y > C.H - 140 && Math.random() < 0.25) Decals.add(null, C.rand(p.x - 10, p.x + 10), C.H - C.rand(40, 70), 4, C.rand(60, 110), 8); }

  Chem.splash = function (x, y, k) {
    C.emit({ kind: 'anim', img: 'foam_splash', x: x + C.rand(-8, 8), y: y + C.rand(-10, 10), max: 0.42, s0: 110 * k, s1: 150 * k, layer: 2, fadePow: 6, rot: C.rand(-0.3, 0.3), flip: true });
    for (let i = 0; i < 3 * k; i++) {
      const a = Math.PI + C.rand(-1.4, 1.4), v = C.rand(200, 560);
      C.emit({ kind: 'blob', color: '#ffffff', edge: '#6fa3c8', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, grav: 1200, max: C.rand(0.5, 0.9), s0: C.rand(4, 8), s1: 3, layer: 2, onDie: groundDrop });
    }
  };
  /** Mục tiêu ngộp bọt: nhỏ giọt + sủi bong bóng */
  Chem.corrode = function (x, y, w, h, level) {
    if (Math.random() < 0.08 + level * 0.06) C.emit({ kind: 'drip', color: Math.random() < 0.6 ? 'rgba(250,253,255,0.97)' : 'rgba(200,232,255,0.95)', x: x + C.rand(-w * 0.4, w * 0.4), y: y + C.rand(-h * 0.1, h * 0.35), vy: 20, grav: 240, max: C.rand(0.8, 1.4), s0: C.rand(4, 8), s1: 3, layer: 2, onDie: groundDrop });
    if (Math.random() < 0.04 + level * 0.04) C.emit({ kind: 'bubble', color: 'rgba(120,190,240,0.95)', x: x + C.rand(-w * 0.35, w * 0.35), y: y + C.rand(-h * 0.35, h * 0.35), vy: -30, max: C.rand(0.4, 0.8), s0: 4, s1: 11, layer: 2, onDie: popBubble });
  };

  /** Luồng bọt: ảnh dải bọt (3 biến thể) kéo từ miệng tới điểm trúng */
  Chem.drawJet = function (ctx) {
    if (!Chem.active) return;
    const pr = Chem.params(), len = Math.min(pr.range, Chem.hitDist || pr.range) * Chem.power;
    const m = C.SPRITES.foam_stream, im = C.img.foam_stream;
    if (len < 10 || !m || !im) return;
    const t = Chem.t, f = Math.floor(t * 16) % m.n;
    const H = (Chem.ult ? 330 : 120) * (0.9 + 0.1 * Math.sin(t * 40));
    const srcW = m.fw * Math.min(1, len / pr.range * 1.15);
    ctx.save(); ctx.translate(Chem.x, Chem.y); ctx.rotate(Chem.dir);
    if (Chem.ult) { // lớp sóng bọt to phía sau
      ctx.globalAlpha = 0.55; ctx.save(); ctx.scale(1, -1);
      ctx.drawImage(im, ((f + 1) % m.n) * m.fw, 0, srcW, m.fh, -10, -H * 0.65, len + 40, H * 1.3); ctx.restore(); ctx.globalAlpha = 1;
    }
    if (f % 2) ctx.scale(1, -1);
    ctx.drawImage(im, f * m.fw, 0, srcW, m.fh, -14, -H / 2, len + 30, H);
    ctx.restore();
  };

  // =====================================================================
  //   VẾT BỌT BÁM (lưu lâu, chảy xệ, nhỏ giọt rồi mới mờ)
  // =====================================================================
  const Decals = C.Decals = { list: [], screen: [] };
  /** ent = vật để bám theo (null = bám mặt đất, trôi theo cảnh). f: 0-5 kiểu vết */
  Decals.add = function (ent, x, y, f, size, life) {
    const L = Decals.list; if (L.length > 110) L.shift();
    L.push({ ent, ox: ent ? x - ent.x : x, oy: ent ? y - ent.y : y, f, s: size, life: life || C.rand(5, 8), t: 0, rot: f === 4 ? 0 : C.rand(-0.5, 0.5), sag: 0, dripT: C.rand(0.4, 1.2), vy: 0, free: !ent });
  };
  Decals.splatScreen = function () {
    const S = Decals.screen; if (S.length > 6) S.shift();
    const side = Math.random() < 0.5;
    S.push({ x: side ? C.rand(-40, 260) : C.rand(C.W - 260, C.W + 40), y: C.rand(80, C.H - 120), f: C.randi(0, 2), s: C.rand(220, 360), t: 0, life: C.rand(3, 4.5), rot: C.rand(-0.6, 0.6) });
  };
  Decals.update = function (dt, scroll) {
    const L = Decals.list;
    for (const d of L) {
      d.t += dt;
      if (d.ent && (d.ent.dead || d.ent.state === 'gone')) { d.ox += d.ent.x; d.oy += d.ent.y; d.ent = null; d.falling = true; }
      if (d.falling) { d.vy += 700 * dt; d.oy += d.vy * dt; if (d.oy > C.H - 50) { d.falling = false; d.f = 4; d.oy = C.H - 50; d.rot = 0; d.free = true; } }
      else { d.sag += dt * (d.f === 4 ? 0 : 5); }
      if (d.free && !d.falling) d.ox -= scroll * dt;
      d.dripT -= dt;
      if (d.dripT <= 0 && d.f !== 4 && d.t < d.life - 1) {
        d.dripT = C.rand(0.5, 1.5); const p = Decals.pos(d);
        C.emit({ kind: 'drip', color: 'rgba(250,253,255,0.97)', x: p.x + C.rand(-d.s * 0.25, d.s * 0.25), y: p.y + d.s * 0.3, vy: 30, grav: 420, max: C.rand(0.8, 1.3), s0: C.rand(4, 7), s1: 3, layer: 2, onDie: groundDrop });
      }
    }
    Decals.list = L.filter(d => d.t < d.life && d.ox > -200);
    for (const s of Decals.screen) { s.t += dt; s.y += 14 * dt; }
    Decals.screen = Decals.screen.filter(s => s.t < s.life);
  };
  Decals.pos = d => d.ent ? { x: d.ent.x + d.ox, y: d.ent.y + d.oy + d.sag } : { x: d.ox, y: d.oy + d.sag };
  Decals.draw = function (ctx) {
    for (const d of Decals.list) {
      const p = Decals.pos(d), a = Math.min(1, (d.life - d.t) / 1.5, d.t * 8);
      C.spr(ctx, 'foam_decal', d.f, p.x, p.y, d.s * (1 + Math.min(0.15, d.t * 0.03)), { rot: d.rot, alpha: a });
    }
  };
  Decals.drawScreen = function (ctx) {
    for (const s of Decals.screen) {
      const a = Math.min(0.85, (s.life - s.t) / 1.2, s.t * 10);
      C.spr(ctx, 'foam_decal', s.f, s.x, s.y, s.s * (1 + s.t * 0.04), { rot: s.rot, alpha: a });
    }
  };
  Decals.clear = function () { Decals.list = []; Decals.screen = []; };
})(window.C);
