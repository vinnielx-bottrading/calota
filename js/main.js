/* CALOTA — giao diện (menu, tạm dừng, thắng/thua, cài app, ủng hộ) và khởi động */
(function (C) {
  const g = C.game;
  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  C.debug = { boss: q.has('boss'), ult: q.has('ult'), all: q.has('all'), gate: q.has('gate') ? (+q.get('gate') || 1) - 1 : 0 };
  let sel = C.store.get('gateSel', 0);
  const unlocked = i => i === 0 || C.debug.all || C.store.get('clear' + C.GATES[i - 1].id, false);
  function renderGates() {
    if (!unlocked(sel)) sel = 0;
    const el = $('gateList'); el.innerHTML = '';
    C.GATES.forEach((gt, i) => {
      const ok = unlocked(i), d = document.createElement('button');
      d.className = 'gateCard' + (i === sel ? ' sel' : '') + (ok ? '' : ' locked');
      const best = C.store.get('best' + gt.id, 0);
      d.innerHTML = `<img src="${gt.thumb || 'assets/ui/g1_thumb.webp'}" alt=""><div><b>CỬA ${gt.id}${C.store.get('clear' + gt.id, false) ? ' ✓' : ''}</b><span>${gt.name}</span><small>${ok ? 'Boss: ' + (gt.bossShort || gt.bossName) : '🔒 Hạ boss cửa ' + (i) + ' để mở'}</small>${best ? `<small class="gb">Kỷ lục ${best.toLocaleString('vi-VN')}</small>` : ''}</div>`;
      d.onclick = () => { if (!ok) { d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); return; } sel = i; C.store.set('gateSel', i); renderGates(); };
      el.appendChild(d);
    });
  }

  const ui = C.ui = {};
  ui.show = function (id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === id));
    document.body.classList.toggle('playing', id === null && g.state === 'play');
  };
  function fmt(s) { const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + String(r).padStart(2, '0'); }
  ui.showWin = function (r) {
    $('winStats').innerHTML = `<div><b>${r.score.toLocaleString('vi-VN')}</b><span>Điểm</span></div><div><b>${r.coins}</b><span>Xu</span></div><div><b>${fmt(r.bossTime)}</b><span>Hạ boss</span></div><div><b>${Math.max(0, r.hp)}/5</b><span>Máu còn</span></div>`;
    $('winBest').textContent = 'Kỷ lục cửa ' + g.gate.id + ': ' + r.best.toLocaleString('vi-VN');
    $('winText').textContent = g.gate.winText || 'Khinh Khí Cầu Gai Rêu đã tan xác.';
    const hasNext = g.gateIdx + 1 < C.GATES.length;
    $('btnNext').style.display = hasNext ? '' : 'none'; $('winSoon').style.display = hasNext ? 'none' : '';
    ui.show('win');
    setTimeout(() => { if (g.state === 'win') C.donate.open('end', 'win'); }, 2200);
  };
  ui.showLose = function (r) {
    $('loseInfo').textContent = r.boss ? `Boss còn ${Math.ceil(r.bossHp * 100)}% máu — cố lên!` : 'Calota đã bị hạ giữa đường bay.';
    $('btnRetryBoss').style.display = r.boss ? '' : 'none';
    ui.show('lose');
    // khi thua chỉ mời 1 lần mỗi phiên để không phiền
    let dnSeen = true; try { dnSeen = !!sessionStorage.getItem('calota_dn_lose'); sessionStorage.setItem('calota_dn_lose', '1'); } catch (e) { }
    if (!dnSeen) { setTimeout(() => { if (g.state === 'lose') C.donate.open('end', 'lose'); }, 1800); }
  };

  function bind() {
    $('btnPlay').onclick = () => { C.sfx.unlock(); tryFullscreen(); g.start(sel, false); };
    $('btnNext').onclick = () => { sel = g.gateIdx + 1; C.store.set('gateSel', sel); g.start(sel, false); };
    $('btnHow').onclick = () => ui.show('how');
    document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => ui.show(b.dataset.back));
    $('btnPause').onclick = () => g.pause();
    $('btnResume').onclick = () => g.resume();
    $('btnQuit').onclick = $('btnMenu1').onclick = $('btnMenu2').onclick = () => toMenu();
    $('btnRetry').onclick = $('btnAgain').onclick = () => g.start(g.gateIdx || 0, false);
    $('btnRetryBoss').onclick = () => g.start(g.gateIdx || 0, true);
    const snd = () => { document.querySelectorAll('.btnSound').forEach(b => b.textContent = C.sfx.on ? '🔊' : '🔇'); };
    document.querySelectorAll('.btnSound').forEach(b => b.onclick = () => { C.sfx.unlock(); C.sfx.setOn(!C.sfx.on); snd(); });
    snd();
    $('btnDonate').onclick = () => C.donate.open('start', 'menu');
    $('btnDonate2').onclick = () => C.donate.open('end', 'win');
    $('btnDonate3').onclick = () => C.donate.open('end', 'lose');
    C.donate.init();
    $('btnInstall').onclick = () => { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; } else ui.show('install'); };
    renderGates(); $('best').textContent = '';
  }
  function toMenu() { g.state = 'menu'; C.sfx.hiss(0); C.sfx.music(null); C.particles.length = 0; renderGates(); ui.show('menu'); }
  function tryFullscreen() {
    if (!('ontouchstart' in window)) return;
    const el = document.documentElement;
    try { (el.requestFullscreen || el.webkitRequestFullscreen || (() => { })).call(el).then?.(() => screen.orientation?.lock?.('landscape').catch(() => { })).catch?.(() => { }); } catch (e) { }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) g.pause(); });

  // ---------- PWA ----------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').then(r => { r.update(); setInterval(() => r.update(), 30 * 60 * 1000); }).catch(() => { });
  }

  // ---------- vòng lặp ----------
  C.lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - C.lastT) / 1000); C.lastT = now;
    g.update(dt); C.render(); C.input.endFrame();
    const rb = document.getElementById('btnRage'); if (rb) rb.classList.toggle('ready', (g.rage || 0) >= 100 && !g.rageActive);
    requestAnimationFrame(frame);
  }

  // ---------- khởi động ----------
  window.addEventListener('load', () => {
    C.initCanvas(); C.initGlows(); C.input.bindTouch(); bind();
    C.loadImages(C.assetList(), k => { $('loadBar').style.width = Math.round(k * 100) + '%'; }).then(() => {
      $('loading').classList.add('gone');
      g.state = 'menu'; ui.show('menu');
      let seen = false; try { seen = !!sessionStorage.getItem('calota_dn_start'); sessionStorage.setItem('calota_dn_start', '1'); } catch (e) { }
      if (C.debug.boss || q.has('gate')) g.start(C.debug.gate, C.debug.boss);
      else if (!seen) setTimeout(() => { if (g.state === 'menu') C.donate.open('start', 'menu'); }, 900);
    });
    requestAnimationFrame(frame);
  });
})(window.C);
