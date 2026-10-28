/* CALOTA — core: canvas, tiện ích, nạp ảnh, vẽ sprite */
window.C = window.C || {};
(function (C) {
  C.W = 1280; C.H = 720;
  C.VERSION = '0.4.1';

  // ---------- tiện ích ----------
  C.rand = (a, b) => a + Math.random() * (b - a);
  C.randi = (a, b) => Math.floor(C.rand(a, b + 1));
  C.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  C.lerp = (a, b, t) => a + (b - a) * t;
  C.dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
  C.angleDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  C.store = {
    get(k, d) { try { const v = localStorage.getItem('calota_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('calota_' + k, JSON.stringify(v)); } catch (e) { } }
  };

  // ---------- canvas ----------
  C.initCanvas = function () {
    const cv = document.getElementById('game');
    C.cv = cv; C.ctx = cv.getContext('2d');
    C.view = { s: 1, ox: 0, oy: 0 };
    const fit = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const s = Math.min(w / C.W, h / C.H);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.style.width = Math.round(C.W * s) + 'px';
      cv.style.height = Math.round(C.H * s) + 'px';
      cv.width = Math.round(C.W * s * dpr); cv.height = Math.round(C.H * s * dpr);
      C.pxScale = (C.W * s * dpr) / C.W;
      C.view.s = s;
      document.body.classList.toggle('portrait', h > w && 'ontouchstart' in window);
    };
    window.addEventListener('resize', fit); fit();
  };
  C.toLogical = function (clientX, clientY) {
    const r = C.cv.getBoundingClientRect();
    return { x: (clientX - r.left) / r.width * C.W, y: (clientY - r.top) / r.height * C.H };
  };

  // ---------- ảnh ----------
  C.img = {};
  C.loadImages = function (map, onProgress) {
    const keys = Object.keys(map); let done = 0;
    return Promise.all(keys.map(k => new Promise(res => {
      const im = new Image();
      im.onload = im.onerror = () => { done++; onProgress && onProgress(done / keys.length); res(); };
      im.src = map[k]; C.img[k] = im;
    })));
  };
  C.assetList = function () {
    const m = {};
    for (const k in C.SPRITES) m[k] = C.SPRITES[k].file;
    m.bg_far = 'assets/bg/g1_far.webp'; m.bg_mid = 'assets/bg/g1_mid.webp'; m.bg_fg = 'assets/bg/g1_fg.webp';
    return m;
  };

  /** Vẽ frame `f` của sprite `name`, tâm tại (x,y). w = chiều rộng hiển thị. */
  C.spr = function (ctx, name, f, x, y, w, o) {
    const m = C.SPRITES[name], im = C.img[name];
    if (!m || !im || !im.complete) return;
    f = ((f | 0) % m.n + m.n) % m.n;
    const s = w / m.fw, dw = m.fw * s, dh = m.fh * s;
    ctx.save(); ctx.translate(x, y);
    if (o) { if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1); if (o.alpha != null) ctx.globalAlpha *= o.alpha; }
    ctx.drawImage(im, f * m.fw, 0, m.fw, m.fh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };
  C.sprH = (name, w) => { const m = C.SPRITES[name]; return m ? m.fh * w / m.fw : w; };

  /** Bộ đệm để tô màu sprite (ăn mòn, nháy trắng) không cần đọc pixel. */
  const tintCv = document.createElement('canvas'), tctx = tintCv.getContext('2d');
  C.sprTint = function (ctx, name, f, x, y, w, color, amount, o) {
    const m = C.SPRITES[name], im = C.img[name];
    if (!m || !im || !im.complete) return;
    f = ((f | 0) % m.n + m.n) % m.n;
    if (tintCv.width < m.fw || tintCv.height < m.fh) { tintCv.width = Math.max(tintCv.width, m.fw); tintCv.height = Math.max(tintCv.height, m.fh); }
    tctx.clearRect(0, 0, tintCv.width, tintCv.height);
    tctx.globalCompositeOperation = 'source-over'; tctx.globalAlpha = 1;
    tctx.drawImage(im, f * m.fw, 0, m.fw, m.fh, 0, 0, m.fw, m.fh);
    tctx.globalCompositeOperation = 'source-atop'; tctx.globalAlpha = amount; tctx.fillStyle = color;
    tctx.fillRect(0, 0, m.fw, m.fh);
    if (o && o.blotches) { // vệt ăn mòn loang lổ
      tctx.globalAlpha = Math.min(1, amount * 1.6);
      for (const b of o.blotches) {
        const g = tctx.createRadialGradient(b.x * m.fw, b.y * m.fh, 0, b.x * m.fw, b.y * m.fh, b.r * m.fw);
        g.addColorStop(0, b.c); g.addColorStop(1, 'rgba(0,0,0,0)');
        tctx.fillStyle = g; tctx.fillRect(0, 0, m.fw, m.fh);
      }
    }
    tctx.globalCompositeOperation = 'source-over'; tctx.globalAlpha = 1;
    const s = w / m.fw;
    ctx.save(); ctx.translate(x, y);
    if (o && o.rot) ctx.rotate(o.rot);
    if (o && o.flip) ctx.scale(-1, 1);
    ctx.drawImage(tintCv, 0, 0, m.fw, m.fh, -m.fw * s / 2, -m.fh * s / 2, m.fw * s, m.fh * s);
    ctx.restore();
  };
})(window.C);
