/* CALOTA — điều khiển: bàn phím + cảm ứng */
(function (C) {
  const I = C.input = {
    keys: {}, moveX: 0, moveY: 0,
    spray: false, ultPressed: false, dashPressed: false, pausePressed: false,
    touch: { id: null, lastX: 0, lastY: 0, dx: 0, dy: 0, active: false },
    usingTouch: false
  };
  const K = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    spray: ['Space', 'KeyJ'], ult: ['KeyK', 'KeyE'], dash: ['ShiftLeft', 'ShiftRight', 'KeyL'], pause: ['KeyP', 'Escape']
  };
  const has = (arr) => arr.some(k => I.keys[k]);
  window.addEventListener('keydown', e => {
    if (e.repeat) { if (K.spray.includes(e.code) || e.code.startsWith('Arrow')) e.preventDefault(); return; }
    I.keys[e.code] = true;
    if (K.ult.includes(e.code)) I.ultPressed = true;
    if (K.dash.includes(e.code)) I.dashPressed = true;
    if (K.pause.includes(e.code)) I.pausePressed = true;
    if (K.spray.includes(e.code) || e.code.startsWith('Arrow')) e.preventDefault();
    C.sfx && C.sfx.unlock();
  });
  window.addEventListener('keyup', e => { I.keys[e.code] = false; });
  window.addEventListener('blur', () => { I.keys = {}; I.sprayBtn = false; I.pausePressed = true; });

  // cảm ứng: kéo ở nửa trái màn hình = di chuyển tương đối
  I.bindTouch = function () {
    const cv = C.cv;
    cv.addEventListener('touchstart', e => {
      I.usingTouch = true; document.body.classList.add('touch');
      C.sfx && C.sfx.unlock();
      for (const t of e.changedTouches) {
        const p = C.toLogical(t.clientX, t.clientY);
        if (I.touch.id === null && p.x < C.W * 0.62) {
          I.touch.id = t.identifier; I.touch.lastX = p.x; I.touch.lastY = p.y; I.touch.active = true;
        }
      }
      e.preventDefault();
    }, { passive: false });
    cv.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) if (t.identifier === I.touch.id) {
        const p = C.toLogical(t.clientX, t.clientY);
        I.touch.dx += p.x - I.touch.lastX; I.touch.dy += p.y - I.touch.lastY;
        I.touch.lastX = p.x; I.touch.lastY = p.y;
      }
      e.preventDefault();
    }, { passive: false });
    const end = e => { for (const t of e.changedTouches) if (t.identifier === I.touch.id) { I.touch.id = null; I.touch.active = false; } };
    cv.addEventListener('touchend', end); cv.addEventListener('touchcancel', end);

    const hold = (id, on, off) => {
      const el = document.getElementById(id); if (!el) return;
      el.addEventListener('touchstart', e => { e.preventDefault(); I.usingTouch = true; C.sfx && C.sfx.unlock(); on(); el.classList.add('down'); }, { passive: false });
      const up = e => { e.preventDefault(); off && off(); el.classList.remove('down'); };
      el.addEventListener('touchend', up); el.addEventListener('touchcancel', up);
      el.addEventListener('mousedown', e => { e.preventDefault(); on(); el.classList.add('down'); });
      el.addEventListener('mouseup', up); el.addEventListener('mouseleave', up);
    };
    hold('btnSpray', () => I.sprayBtn = true, () => I.sprayBtn = false);
    hold('btnUlt', () => I.ultPressed = true);
    hold('btnDash', () => I.dashPressed = true);
  };

  I.poll = function () {
    let x = 0, y = 0;
    if (has(K.left)) x -= 1; if (has(K.right)) x += 1;
    if (has(K.up)) y -= 1; if (has(K.down)) y += 1;
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    I.moveX = x; I.moveY = y;
    I.spray = has(K.spray) || !!I.sprayBtn;
  };
  I.consumeTouchDelta = function () { const d = { x: I.touch.dx, y: I.touch.dy }; I.touch.dx = I.touch.dy = 0; return d; };
  I.endFrame = function () { I.ultPressed = I.dashPressed = I.pausePressed = false; };
})(window.C);
