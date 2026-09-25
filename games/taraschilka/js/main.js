'use strict';

function boot() {
  console.log('[BOOT] start');
  if (typeof G === 'object' && G && G._peakCombo === undefined) G._peakCombo = 0;
  try {
    if (typeof resizeCanvas !== 'function') throw new Error('resizeCanvas не загружен');
    if (typeof initInput !== 'function') throw new Error('initInput не загружен');
    if (typeof initUI !== 'function') throw new Error('initUI не загружен');
    if (typeof update !== 'function') throw new Error('update не загружен');
    if (typeof draw !== 'function') throw new Error('draw не загружен');
    console.log('[BOOT] все функции на месте');

    resizeCanvas();
    addEventListener('resize', resizeCanvas);

    initInput();
    initUI();
    updateMenuTugriks();
    updateDMCRating();

    A.onKick = () => { G.gridPulse = 1; if (G.running) shake(2 * DPR, 0.05); };
    A.onSnare = () => { if (G.running) flash(0.05); };
    A.onBeat = () => {
      if (G.running) {
        if (G.gridPulse < 0.5) G.gridPulse = 0.5;
        G.beatColorIdx = (G.beatColorIdx + 1) % BEAT_COLORS.length;
        G.beatColor = BEAT_COLORS[G.beatColorIdx];
        G.beatFlashT = 1;
      }
    };

    function unlockAudio() { if (!A.started) startAudio(); }
    document.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    lastTime = performance.now();
    requestAnimationFrame(loop);
    console.log('[BOOT] готово, RAF запущен');
  } catch (e) {
    console.error('[BOOT] FATAL:', e);
    alert('Ошибка загрузки: ' + e.message + '\n\nОткрой консоль (F12 → Console).');
  }
}

// ─── Мониторинг FPS и авто low FX ───
function updateFpsMonitor(dt, fps) {
  if (!TUNE.performance || !TUNE.performance.autoLowFX) return;
  G.fpsSample = fps;

  const LOW = TUNE.performance.autoLowFXThreshold || 30;
  const HIGH = TUNE.performance.autoHighFXThreshold || 50;

  if (fps < LOW) {
    G._lowFXTimer += dt;
    G._highFXTimer = 0;
    if (G._lowFXTimer >= 2 && !G.lowFX) {
      G.lowFX = true;
      G._lowFXTimer = 0;
      console.log('[PERF] lowFX ON (fps ' + fps + ')');
    }
  } else if (fps > HIGH) {
    G._highFXTimer += dt;
    G._lowFXTimer = 0;
    if (G._highFXTimer >= 4 && G.lowFX) {
      G.lowFX = false;
      G._highFXTimer = 0;
      console.log('[PERF] lowFX OFF (fps ' + fps + ')');
    }
  } else {
    // Средний fps — плавно сбрасываем накопленное время
    G._lowFXTimer = Math.max(0, G._lowFXTimer - dt * 0.5);
    G._highFXTimer = Math.max(0, G._highFXTimer - dt * 0.5);
  }
}

function loop(t) {
  const dtRaw = Math.min((t - lastTime) / 1000, 0.1);
  lastTime = t;

  fpsFrames++;
  fpsTimer += dtRaw;
  if (fpsTimer >= 0.5) {
    const fps = Math.round(fpsFrames / fpsTimer);
    if (hud.fps) {
      hud.fps.textContent = 'FPS: ' + fps + (G.lowFX ? ' · LOW FX' : '');
    }
    updateFpsMonitor(fpsTimer, fps);
    fpsFrames = 0;
    fpsTimer = 0;
  }

  if (G.running) {
    try {
      update(dtRaw);
      draw();
    } catch (e) {
      console.error('[LOOP] ошибка:', e);
      G.running = false;
      alert('Ошибка в игре: ' + e.message + '\n\nКонсоль → скрин.');
    }
  }

  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}