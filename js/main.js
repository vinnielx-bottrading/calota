/* CALOTA — giao diện (menu, tạm dừng, thắng/thua, cài app, ủng hộ) và khởi động */
(function (C) {
  const g = C.game;
  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  C.debug = { boss: q.has('boss'), ult: q.has('ult') };

  const ui = C.ui = {};
  ui.show = function (id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === id));
    document.body.classList.toggle('playing', id === null && g.state === 'play');
  };
  function fmt(s) { const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + String(r).padStart(2, '0'); }
  ui.showWin = function (r) {
    $('winStats').innerHTML = `<div><b>${r.score.toLocaleString('vi-VN')}</b><span>Điểm</span></div><div><b>${r.coins}</b><span>Xu</span></div><div><b>${fmt(r.bossTime)}</b><span>Hạ boss</span></div><div><b>${Math.max(0, r.hp)}/5</b><span>Máu còn</span></div>`;
    $('winBest').textContent = 'Kỷ lục: ' + r.best.toLocaleString('vi-VN');
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
    $('btnPlay').onclick = () => { C.sfx.unlock(); tryFullscreen(); g.start(0, false); };
    $('btnHow').onclick = () => ui.show('how');
    document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => ui.show(b.dataset.back));
    $('btnPause').onclick = () => g.pause();
    $('btnResume').onclick = () => g.resume();
    $('btnQuit').onclick = $('btnMenu1').onclick = $('btnMenu2').onclick = () => toMenu();
    $('btnRetry').onclick = $('btnAgain').onclick = () => g.start(0, false);
    $('btnRetryBoss').onclick = () => g.start(0, true);
    const snd = () => { document.querySelectorAll('.btnSound').forEach(b => b.textContent = C.sfx.on ? '🔊' : '🔇'); };
    document.querySelectorAll('.btnSound').forEach(b => b.onclick = () => { C.sfx.unlock(); C.sfx.setOn(!C.sfx.on); snd(); });
    snd();
    $('btnDonate').onclick = () => C.donate.open('start', 'menu');
    $('btnDonate2').onclick = () => C.donate.open('end', 'win');
    $('btnDonate3').onclick = () => C.donate.open('end', 'lose');
    C.donate.init();
    $('btnInstall').onclick = () => { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; } else ui.show('install'); };
    $('best').textContent = C.store.get('best1', 0) ? 'Kỷ lục: ' + C.store.get('best1', 0).toLocaleString('vi-VN') : '';
  }
  function toMenu() { g.state = 'menu'; C.sfx.hiss(0); C.sfx.music(null); C.particles.length = 0; ui.show('menu'); $('best').textContent = C.store.get('best1', 0) ? 'Kỷ lục: ' + C.store.get('best1', 0).toLocaleString('vi-VN') : ''; }
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
    requestAnimationFrame(frame);
  }

  // ---------- khởi động ----------
  window.addEventListener('load', () => {
    C.initCanvas(); C.initGlows(); C.input.bindTouch(); bind();
    C.loadImages(C.assetList(), k => { $('loadBar').style.width = Math.round(k * 100) + '%'; }).then(() => {
      $('loading').classList.add('gone');
      g.state = 'menu'; ui.show('menu');
      let seen = false; try { seen = !!sessionStorage.getItem('calota_dn_start'); sessionStorage.setItem('calota_dn_start', '1'); } catch (e) { }
      if (C.debug.boss) g.start(0, true);
      else if (!seen) setTimeout(() => { if (g.state === 'menu') C.donate.open('start', 'menu'); }, 900);
    });
    requestAnimationFrame(frame);
  });
})(window.C);
