'use strict';

// Рандом при загрузке: 50% обычная ASCII сцена, 50% арт
const _MENU_VARIANT = Math.random() < 0.5 ? 'scene' : 'dick';

// ══════════════════════════════════════════════════════════════
// ЖИВАЯ ASCII-КАРТИНА ДЛЯ ГЛАВНОГО МЕНЮ
// Ночь/день · Молнии · Киты · Дирижабли · Отражения в воде
// ══════════════════════════════════════════════════════════════
function _runDickMenuScene(canvas, ctx) {
  const TAU = Math.PI * 2;
  let W = 0, H = 0, dpr = 1;
  let active = false;
  let sparks = [];

  const ART = [
    '       ▄▄███▄▄       ',
    '      █████████      ',
    '      █████████      ',
    '      █████████      ',
    '      █████████      ',
    '      █████████      ',
    '      █████████      ',
    '      █████████      ',
    '     ▄█████████▄     ',
    '    █████████████    ',
    '    █████████████    ',
    '    ████     ████    ',
    '    ████     ████    ',
    '    ▀▀▀▀     ▀▀▀▀    ',
  ];
  const COLORS = ['#b16dff', '#ff4dc4', '#4da0ff', '#7a4aff'];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(innerWidth * dpr);
    H = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    sparks = [];
    for (let i = 0; i < 50; i++) {
      sparks.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 40 * dpr,
        vy: (-30 - Math.random() * 60) * dpr,
        life: 1 + Math.random() * 3,
        maxLife: 4,
        size: (1 + Math.random() * 2) * dpr,
        hue: 260 + Math.random() * 80,
      });
    }
  }

  function hexA(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function lerpColor(a, b, t) {
    const ra = parseInt(a.slice(1, 3), 16), ga = parseInt(a.slice(3, 5), 16), ba = parseInt(a.slice(5, 7), 16);
    const rb = parseInt(b.slice(1, 3), 16), gb = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
    const r = Math.round(ra + (rb - ra) * t);
    const g = Math.round(ga + (gb - ga) * t);
    const bv = Math.round(ba + (bb - ba) * t);
    return '#' + [r, g, bv].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function drawFrame(time) {
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.65);
    bg.addColorStop(0, 'rgba(177,109,255,0.08)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (const s of sparks) {
      s.x += s.vx * (1 / 60);
      s.y += s.vy * (1 / 60);
      s.life -= 1 / 60;
      if (s.life <= 0) {
        s.x = Math.random() * W;
        s.y = H + 20 * dpr;
        s.vx = (Math.random() - 0.5) * 40 * dpr;
        s.vy = (-30 - Math.random() * 60) * dpr;
        s.life = 1 + Math.random() * 3;
        s.hue = 260 + Math.random() * 80;
      }
      const a = Math.min(1, s.life / s.maxLife) * 0.7;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'hsl(' + s.hue + ', 90%, 70%)';
      ctx.shadowBlur = 8 * dpr;
      ctx.shadowColor = 'hsl(' + s.hue + ', 90%, 60%)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    const colorT = (time * 0.3) % COLORS.length;
    const cIdx = Math.floor(colorT);
    const cNext = (cIdx + 1) % COLORS.length;
    const color = lerpColor(COLORS[cIdx], COLORS[cNext], colorT - cIdx);

    const artW = ART[0].length;
    const artH = ART.length;
    const cellSize = Math.min(W / (artW + 2), H / (artH + 2)) * 0.95;
    const fontSize = cellSize * 1.15;
    const totalW = artW * cellSize * 0.62;
    const totalH = artH * cellSize;
    const startX = (W - totalW) / 2;
    const startY = (H - totalH) / 2;

    const pulse = 1 + Math.sin(time * 2.5) * 0.05;
    const sway = Math.sin(time * 0.7) * 0.04;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(sway);
    ctx.scale(pulse, pulse);
    ctx.translate(-W / 2, -H / 2);

    const glowR = Math.max(totalW, totalH) * 0.9;
    const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, glowR);
    glow.addColorStop(0, hexA(color, 0.45));
    glow.addColorStop(0.5, hexA(color, 0.15));
    glow.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.font = 'bold ' + fontSize + 'px "Courier New", monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = color;
    ctx.shadowBlur = 22 * dpr;
    ctx.shadowColor = color;

    for (let row = 0; row < artH; row++) {
      const line = ART[row];
      const y = startY + row * cellSize;
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === ' ') continue;
        const x = startX + col * cellSize * 0.62;
        const jx = Math.sin(time * 7 + row * 0.7 + col * 0.4) * 1.8 * dpr;
        const jy = Math.cos(time * 6 + row * 0.4 + col * 0.7) * 1.2 * dpr;
        ctx.fillText(ch, x + jx, y + jy);
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#000';
    const scanStep = Math.max(2, Math.floor(3 * dpr));
    for (let y = 0; y < H; y += scanStep) ctx.fillRect(0, y, W, 1 * dpr);
    ctx.restore();

    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function loop(now) {
    if (!active) return;
    drawFrame(now / 1000);
    requestAnimationFrame(loop);
  }

  resize();
  addEventListener('resize', resize);

  const title = document.getElementById('titleScreen');
  function activate() {
    if (active) return;
    canvas.classList.add('show');
    active = true;
    requestAnimationFrame(loop);
  }
  function deactivate() {
    if (!active) return;
    canvas.classList.remove('show');
    active = false;
  }
  if (title) {
    const mo = new MutationObserver(() => {
      if (title.classList.contains('show')) activate();
      else deactivate();
    });
    mo.observe(title, { attributes: true, attributeFilter: ['class'] });
    if (title.classList.contains('show')) activate();
  } else {
    activate();
  }
}

(function () {
  const canvas = document.getElementById('menuBg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (_MENU_VARIANT === 'dick') {
    _runDickMenuScene(canvas, ctx);
    return;
  }

  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const CYCLE = 24; // полный цикл день+ночь в секундах

  let W = 0, H = 0, dpr = 1, horizonY = 0, vpX = 0;
  let active = false;
  let last = performance.now();

  // ─────────────────────────────────────────────
  // ПАЛИТРЫ
  // ─────────────────────────────────────────────
  const NIGHT = {
    skyTop: '#03001c', skyMid: '#180a42', skyLow: '#48146a', skyBot: '#a0286a', skyHrz: '#e04070',
    sunTop: '#fff0ff', sunMid: '#ffb8d8', sunBot: '#a040a0',
    mountain: '#05010f', city: '#0a0220',
    grid: '#ff5ac8', star: '#ffffff', starBright: 1.0,
    whale: '#c090f0', airship: '#ffb060',
  };
  const DAY = {
    skyTop: '#2a76d8', skyMid: '#5aa0e8', skyLow: '#90c8f8', skyBot: '#ffd8a0', skyHrz: '#ffb070',
    sunTop: '#fffff0', sunMid: '#ffe060', sunBot: '#ff8030',
    mountain: '#2a1840', city: '#1a0a30',
    grid: '#ff8c64', star: '#e0f0ff', starBright: 0.08,
    whale: '#ffb8e0', airship: '#ffd080',
  };
  const h2r = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function mix(a, b, t) {
    const ca = h2r(a), cb = h2r(b);
    return `rgb(${ca[0] + (cb[0] - ca[0]) * t | 0},${ca[1] + (cb[1] - ca[1]) * t | 0},${ca[2] + (cb[2] - ca[2]) * t | 0})`;
  }
  function mixA(a, b, t, alpha) {
    const ca = h2r(a), cb = h2r(b);
    return `rgba(${ca[0] + (cb[0] - ca[0]) * t | 0},${ca[1] + (cb[1] - ca[1]) * t | 0},${ca[2] + (cb[2] - ca[2]) * t | 0},${alpha})`;
  }

  // ─────────────────────────────────────────────
  // СОСТОЯНИЕ
  // ─────────────────────────────────────────────
  let stars = [], rain = [], birds = [], city = [], fireflies = [], whales = [], airships = [];
  let bolts = [], lightningFlash = 0, nextLightning = 2;
  let meteor = null, meteorTimer = 6;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(innerWidth * dpr);
    H = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    horizonY = H * 0.60;
    vpX = W * 0.5;
    initAll();
  }

  function initAll() {
    // Звёзды
    stars = [];
    const nS = Math.min(150, Math.floor(W * H * 0.00004));
    for (let i = 0; i < nS; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * horizonY * 0.88,
        ch: Math.random() < 0.55 ? '·' : (Math.random() < 0.5 ? '*' : '✧'),
        phase: Math.random() * TAU,
        speed: 0.6 + Math.random() * 2.4,
        hue: 250 + Math.random() * 90,
      });
    }
    // Дождь
    rain = [];
    const nR = Math.min(180, Math.floor(W * H * 0.00006));
    for (let i = 0; i < nR; i++) {
      rain.push({
        x: Math.random() * W * 1.2 - W * 0.1,
        y: Math.random() * H,
        vy: (520 + Math.random() * 720) * dpr,
        vx: -70 * dpr,
        ch: Math.random() < 0.45 ? '│' : (Math.random() < 0.5 ? '┃' : '|'),
        alpha: 0.10 + Math.random() * 0.35,
        hue: 200 + Math.random() * 60,
      });
    }
    // Птицы
    birds = [];
    for (let i = 0; i < 7; i++) {
      birds.push({
        x: Math.random() * W * 1.2 - W * 0.1,
        y: horizonY * (0.06 + Math.random() * 0.38),
        vx: (26 + Math.random() * 52) * dpr,
        phase: Math.random() * TAU,
        flapSpeed: 4 + Math.random() * 3.5,
        scale: 0.65 + Math.random() * 0.9,
      });
    }
    // Город
    city = [];
    let x = -20 * dpr;
    while (x < W + 20 * dpr) {
      const w = (14 + Math.random() * 36) * dpr;
      const h = (24 + Math.random() * 130) * dpr;
      const cw = Math.max(2, Math.floor(w / (5.2 * dpr)));
      const rh = Math.max(2, Math.floor(h / (7.5 * dpr)));
      const windows = [];
      for (let ry = 0; ry < rh; ry++) {
        for (let rx = 0; rx < cw; rx++) {
          if (Math.random() < 0.34) {
            windows.push({
              x: rx * 5.2 * dpr + 2.2 * dpr,
              y: ry * 7.5 * dpr + 3.2 * dpr,
              phase: Math.random() * TAU,
              hue: Math.random() < 0.65 ? 48 : 320,
            });
          }
        }
      }
      city.push({ x, w, h, windows });
      x += w + (2 + Math.random() * 10) * dpr;
    }
    // Светлячки
    fireflies = [];
    for (let i = 0; i < 40; i++) {
      fireflies.push({
        x: Math.random() * W,
        y: horizonY + Math.random() * (H - horizonY),
        phase: Math.random() * TAU,
        speed: 0.4 + Math.random() * 0.9,
        amp: (20 + Math.random() * 60) * dpr,
        hue: 40 + Math.random() * 40,
      });
    }
    // Киты — плавают в небе
    whales = [];
    const nW = 2;
    for (let i = 0; i < nW; i++) {
      whales.push(makeWhale(i));
    }
    // Дирижабли
    airships = [];
    const nA = 2;
    for (let i = 0; i < nA; i++) {
      airships.push(makeAirship(i));
    }
  }

  function makeWhale(i) {
    const dir = i % 2 === 0 ? 1 : -1;
    return {
      x: dir > 0 ? -300 * dpr : W + 300 * dpr,
      y: horizonY * (0.20 + Math.random() * 0.42),
      vx: dir * (25 + Math.random() * 25) * dpr,
      size: (45 + Math.random() * 45) * dpr,
      phase: Math.random() * TAU,
      wobSpeed: 0.6 + Math.random() * 0.6,
      wobAmp: (6 + Math.random() * 10) * dpr,
      spout: [],
      spoutCd: 2 + Math.random() * 3,
    };
  }

  function makeAirship(i) {
    const dir = i % 2 === 0 ? 1 : -1;
    return {
      x: dir > 0 ? -200 * dpr : W + 200 * dpr,
      y: horizonY * (0.06 + Math.random() * 0.28),
      vx: dir * (12 + Math.random() * 18) * dpr,
      size: (26 + Math.random() * 20) * dpr,
      phase: Math.random() * TAU,
      bobSpeed: 0.4 + Math.random() * 0.5,
    };
  }

  function mountainHeight(u) {
    return 0.055
      + Math.sin(u * 3.1 + 0.4) * 0.028
      + Math.sin(u * 7.7 + 1.3) * 0.016
      + Math.sin(u * 17.3 + 4.1) * 0.009
      + Math.sin(u * 41.1 + 2.7) * 0.005;
  }

  // ─────────────────────────────────────────────
  // МОЛНИИ
  // ─────────────────────────────────────────────
  function spawnBolt() {
    const startX = Math.random() * W;
    const startY = Math.random() * horizonY * 0.2;
    const endX = startX + rand(-W * 0.18, W * 0.18);
    const endY = horizonY * (0.75 + Math.random() * 0.2);

    const segs = [];
    let x = startX, y = startY;
    const steps = 12 + Math.floor(Math.random() * 8);
    const dx = (endX - startX) / steps;
    const dy = (endY - startY) / steps;
    for (let i = 0; i < steps; i++) {
      const jitter = rand(-22, 22) * dpr;
      const nx = startX + dx * (i + 1) + jitter;
      const ny = startY + dy * (i + 1);
      segs.push({ x1: x, y1: y, x2: nx, y2: ny });
      x = nx; y = ny;
      if (Math.random() < 0.18 && i < steps - 3) {
        const bx = nx + rand(-80, 80) * dpr;
        const by = ny + rand(30, 90) * dpr;
        segs.push({ x1: nx, y1: ny, x2: bx, y2: by, branch: true });
      }
    }
    bolts.push({ segs, life: 0.28, maxLife: 0.28 });
  }

  function updateLightning(dt, sunT, time) {
    const nightFactor = 1 - sunT;
    if (nightFactor > 0.25 && time > nextLightning) {
      if (Math.random() < 0.4) {
        spawnBolt();
        lightningFlash = 1;
      }
      nextLightning = time + 1.2 + Math.random() * 3;
    }
    lightningFlash = Math.max(0, lightningFlash - dt * 3.5);
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].life -= dt;
      if (bolts[i].life <= 0) bolts.splice(i, 1);
    }
  }

  // ─────────────────────────────────────────────
  // КИТЫ / ДИРИЖАБЛИ
  // ─────────────────────────────────────────────
  function updateWhales(dt) {
    for (const w of whales) {
      w.x += w.vx * dt;
      w.phase += dt * w.wobSpeed;
      // Уходит за экран — возвращаем с другой стороны
      if (w.vx > 0 && w.x > W + 400 * dpr) Object.assign(w, makeWhale(0));
      if (w.vx < 0 && w.x < -400 * dpr) Object.assign(w, makeWhale(1));
      // Фонтан
      w.spoutCd -= dt;
      if (w.spoutCd <= 0) {
        w.spoutCd = 3 + Math.random() * 3;
        for (let i = 0; i < 8; i++) {
          w.spout.push({
            x: 0, y: 0,
            vx: rand(-25, 25) * dpr,
            vy: rand(-80, -40) * dpr,
            life: 0.9, maxLife: 0.9,
          });
        }
      }
      for (let i = w.spout.length - 1; i >= 0; i--) {
        const p = w.spout[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 25 * dpr * dt;
        p.life -= dt;
        if (p.life <= 0) w.spout.splice(i, 1);
      }
    }
  }

  function updateAirships(dt) {
    for (const a of airships) {
      a.x += a.vx * dt;
      a.phase += dt * a.bobSpeed;
      if (a.vx > 0 && a.x > W + 300 * dpr) Object.assign(a, makeAirship(0));
      if (a.vx < 0 && a.x < -300 * dpr) Object.assign(a, makeAirship(1));
    }
  }

  // ─────────────────────────────────────────────
  // ОТРИСОВКА СЦЕНЫ
  // ─────────────────────────────────────────────
  function drawFrame(time, sunT) {
    // --- Небо ---
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
    sky.addColorStop(0.00, mix(NIGHT.skyTop, DAY.skyTop, sunT));
    sky.addColorStop(0.30, mix(NIGHT.skyMid, DAY.skyMid, sunT));
    sky.addColorStop(0.58, mix(NIGHT.skyLow, DAY.skyLow, sunT));
    sky.addColorStop(0.82, mix(NIGHT.skyBot, DAY.skyBot, sunT));
    sky.addColorStop(1.00, mix(NIGHT.skyHrz, DAY.skyHrz, sunT));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizonY);

    // --- Планета с кольцом (видна ночью) ---
    const planetAlpha = 1 - sunT * 0.85;
    if (planetAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = planetAlpha;
      const pX = W * 0.78, pY = H * 0.17, pR = H * 0.055;
      ctx.save();
      ctx.translate(pX, pY); ctx.rotate(-0.42);
      ctx.beginPath();
      ctx.ellipse(0, 0, pR * 1.9, pR * 0.5, 0, Math.PI, TAU);
      ctx.strokeStyle = 'rgba(255,180,230,0.55)';
      ctx.lineWidth = 2.5 * dpr;
      ctx.shadowColor = '#ff8ad0'; ctx.shadowBlur = 14 * dpr;
      ctx.stroke();
      ctx.restore();

      const pG = ctx.createRadialGradient(pX - pR * 0.35, pY - pR * 0.4, 0, pX, pY, pR * 1.15);
      pG.addColorStop(0, '#ffe8ff'); pG.addColorStop(0.55, '#ff8ad0'); pG.addColorStop(1, '#4a1248');
      ctx.fillStyle = pG;
      ctx.shadowColor = '#ff8ad0'; ctx.shadowBlur = 30 * dpr;
      ctx.beginPath(); ctx.arc(pX, pY, pR, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.translate(pX, pY); ctx.rotate(-0.42);
      ctx.beginPath();
      ctx.ellipse(0, 0, pR * 1.9, pR * 0.5, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(255,220,250,0.85)';
      ctx.lineWidth = 2.5 * dpr;
      ctx.shadowColor = '#ff8ad0'; ctx.shadowBlur = 14 * dpr;
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    // --- Звёзды ---
    const starAlphaMul = NIGHT.starBright + (DAY.starBright - NIGHT.starBright) * sunT;
    ctx.font = `${Math.max(10, Math.floor(13 * dpr))}px "Courier New", monospace`;
    ctx.textBaseline = 'top';
    ctx.shadowBlur = 6 * dpr;
    for (const s of stars) {
      const a = (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase))) * starAlphaMul;
      ctx.globalAlpha = a;
      ctx.fillStyle = `hsl(${s.hue}, 85%, 78%)`;
      ctx.shadowColor = `hsl(${s.hue}, 95%, 70%)`;
      ctx.fillText(s.ch, s.x, s.y);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // --- Дирижабли (в небе, за солнцем) ---
    for (const a of airships) drawAirship(a, time, sunT);

    // --- Солнце/луна ---
    const sunCX = W * 0.5;
    const sunR = H * 0.32;
    const sunPulse = 1 + Math.sin(time * 0.8) * 0.012;
    const sunR2 = sunR * sunPulse;
    // Двигается по высоте: ночью за горизонтом, днём выше
    const sunCenterY = horizonY + (0.5 - sunT) * H * 0.14;
    const sunTop = sunCenterY - sunR2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(sunCX, sunCenterY, sunR2, Math.PI, TAU);
    ctx.clip();

    const sg = ctx.createLinearGradient(0, sunTop, 0, sunCenterY);
    sg.addColorStop(0.00, mix(NIGHT.sunTop, DAY.sunTop, sunT));
    sg.addColorStop(0.30, mix('#ffd24a', DAY.sunMid, sunT));
    sg.addColorStop(0.60, mix('#ff8030', DAY.sunMid, sunT));
    sg.addColorStop(0.85, mix('#ff4a5a', DAY.sunBot, sunT));
    sg.addColorStop(1.00, mix(NIGHT.sunBot, DAY.sunBot, sunT));
    ctx.fillStyle = sg;
    ctx.fillRect(0, sunTop, W, sunR2 + 4);

    // Полосы
    const bandCount = 11;
    for (let i = 0; i < bandCount; i++) {
      const u = i / bandCount;
      const y = sunTop + sunR2 * (0.30 + u * 0.70);
      const th = (1.4 + u * u * 8.5) * dpr;
      ctx.globalAlpha = (0.9 - u * 0.45) * (0.4 + 0.6 * (1 - sunT * 0.5));
      ctx.fillStyle = mix('#1a0740', '#5a3880', sunT);
      ctx.fillRect(0, y, W, th);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Свечение
    ctx.save();
    const glow = ctx.createRadialGradient(sunCX, sunCenterY, sunR2 * 0.85, sunCX, sunCenterY, sunR2 * 1.9);
    glow.addColorStop(0, mixA('#ff5ab0', '#ffe0a0', sunT, 0.42));
    glow.addColorStop(0.5, mixA('#ff3a80', '#ffa060', sunT, 0.14));
    glow.addColorStop(1, 'rgba(255,80,140,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, horizonY);
    ctx.restore();

    // --- Луна (ночью, отдельно от солнца) ---
    if (sunT < 0.4) {
      const moonA = 1 - sunT / 0.4;
      const mX = W * 0.22, mY = H * 0.14, mR = H * 0.03;
      ctx.save();
      ctx.globalAlpha = moonA;
      ctx.shadowColor = '#e0e8ff'; ctx.shadowBlur = 30 * dpr;
      ctx.fillStyle = '#f0f4ff';
      ctx.beginPath(); ctx.arc(mX, mY, mR, 0, TAU); ctx.fill();
      // кратеры
      ctx.globalAlpha = moonA * 0.35;
      ctx.fillStyle = '#8890b0';
      ctx.beginPath(); ctx.arc(mX - mR * 0.3, mY - mR * 0.2, mR * 0.18, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(mX + mR * 0.25, mY + mR * 0.15, mR * 0.13, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(mX - mR * 0.05, mY + mR * 0.35, mR * 0.1, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // --- Горы ---
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    const stepPx = Math.max(2, Math.floor(W / 240));
    for (let px = 0; px <= W; px += stepPx) {
      const u = px / W;
      ctx.lineTo(px, horizonY - mountainHeight(u) * H * 3.2);
    }
    ctx.lineTo(W, horizonY);
    ctx.closePath();
    ctx.fillStyle = mix(NIGHT.mountain, DAY.mountain, sunT);
    ctx.fill();
    ctx.strokeStyle = mixA('#ff6eb4', '#ffb088', sunT, 0.55);
    ctx.lineWidth = 1.2 * dpr;
    ctx.shadowColor = mix(NIGHT.grid, DAY.grid, sunT);
    ctx.shadowBlur = 14 * dpr;
    ctx.stroke();
    ctx.restore();

    // --- Город ---
    const winAlphaMul = 0.2 + (1 - sunT) * 0.8;
    for (const b of city) {
      const bx = b.x, by = horizonY - b.h, bw = b.w, bh = b.h;
      ctx.fillStyle = mix(NIGHT.city, DAY.city, sunT);
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = mixA('#b45adc', '#8050b0', sunT, 0.55);
      ctx.lineWidth = 1 * dpr;
      ctx.shadowColor = mix(NIGHT.grid, DAY.grid, sunT);
      ctx.shadowBlur = 8 * dpr;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.shadowBlur = 0;
      for (const win of b.windows) {
        const flick = 0.5 + 0.5 * Math.sin(time * 1.7 + win.phase);
        ctx.globalAlpha = (0.35 + flick * 0.65) * winAlphaMul;
        ctx.fillStyle = `hsl(${win.hue}, 100%, ${58 + flick * 22}%)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6 * dpr;
        ctx.fillRect(bx + win.x, by + win.y, 2.2 * dpr, 3.2 * dpr);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // --- Отражение города в воде (перевёрнутый силуэт под горизонтом) ---
    ctx.save();
    ctx.globalAlpha = 0.25 * (1 - sunT * 0.3);
    for (const b of city) {
      const rby = horizonY;
      const rbh = b.h * 0.65;
      ctx.fillStyle = mix(NIGHT.city, DAY.city, sunT);
      // рисуем мягкую размытую тень
      ctx.globalAlpha = 0.10;
      ctx.fillRect(b.x, rby, b.w, rbh);
      ctx.globalAlpha = 0.22 * (1 - sunT * 0.3);
      ctx.fillRect(b.x, rby, b.w, rbh * 0.3);
    }
    ctx.restore();

    // --- Земля ---
    const ground = ctx.createLinearGradient(0, horizonY, 0, H);
    ground.addColorStop(0, mix('#2a0838', '#3a2040', sunT));
    ground.addColorStop(0.45, mix('#14041e', '#1a0a2a', sunT));
    ground.addColorStop(1, '#05010a');
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizonY, W, H - horizonY);

    // --- Перспективная сетка ---
    ctx.save();
    const gridCol = mix(NIGHT.grid, DAY.grid, sunT);
    ctx.strokeStyle = gridCol;
    ctx.lineWidth = 1 * dpr;
    ctx.shadowColor = gridCol;
    ctx.shadowBlur = 8 * dpr;
    const nH = 24;
    for (let i = 0; i < nH; i++) {
      const u = i / nH;
      const y = horizonY + Math.pow(u, 2.3) * (H - horizonY);
      ctx.globalAlpha = 0.12 + u * 0.7;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    const nV = 26;
    ctx.globalAlpha = 0.38;
    for (let i = -nV; i <= nV; i++) {
      const ang = i * 0.115;
      const endX = vpX + Math.sin(ang) * W * 2.2;
      const endY = H + Math.abs(Math.cos(ang)) * H * 1.2;
      ctx.beginPath();
      ctx.moveTo(vpX, horizonY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // --- Отражение солнца в воде ---
    ctx.save();
    const reflW = sunR2 * 1.7;
    const reflG = ctx.createLinearGradient(0, horizonY, 0, H);
    reflG.addColorStop(0.00, mixA('#ff8ac8', '#ffd8a0', sunT, 0.5 * (0.4 + 0.6 * sunT)));
    reflG.addColorStop(0.45, mixA('#ff5a90', '#ffb070', sunT, 0.14));
    reflG.addColorStop(1.00, 'rgba(255,80,140,0)');
    ctx.fillStyle = reflG;
    ctx.beginPath();
    ctx.moveTo(sunCX - sunR2 * 0.95, horizonY);
    ctx.lineTo(sunCX + sunR2 * 0.95, horizonY);
    ctx.lineTo(sunCX + reflW, H);
    ctx.lineTo(sunCX - reflW, H);
    ctx.closePath();
    ctx.fill();
    // Волны
    for (let i = 0; i < 16; i++) {
      const u = i / 16;
      const y = horizonY + Math.pow(u, 1.7) * (H - horizonY) * 0.9;
      const w = sunR2 * (0.85 - u * 0.5);
      const wob = Math.sin(time * 2.2 + i * 0.8) * 14 * dpr;
      ctx.globalAlpha = (1 - u) * 0.45;
      ctx.fillStyle = mix('#ff9ac8', '#ffe0a0', sunT);
      ctx.shadowColor = mix(NIGHT.grid, DAY.grid, sunT);
      ctx.shadowBlur = 8 * dpr;
      ctx.fillRect(sunCX - w + wob, y, w * 2, 2 * dpr);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // --- Киты (плавают в небе перед горами) ---
    for (const w of whales) drawWhale(w, time, sunT);

    // --- Светлячки (видны в основном ночью) ---
    const ffA = 0.15 + (1 - sunT) * 0.85;
    ctx.font = `${Math.max(10, Math.floor(12 * dpr))}px "Courier New", monospace`;
    ctx.shadowBlur = 10 * dpr;
    for (const f of fireflies) {
      const fx = f.x + Math.sin(time * f.speed + f.phase) * f.amp;
      const fy = f.y + Math.cos(time * f.speed * 0.7 + f.phase) * f.amp * 0.35;
      const flick = 0.5 + 0.5 * Math.sin(time * 3.5 + f.phase * 2);
      ctx.globalAlpha = (0.2 + flick * 0.8) * ffA;
      ctx.fillStyle = `hsl(${f.hue}, 100%, 70%)`;
      ctx.shadowColor = `hsl(${f.hue}, 100%, 60%)`;
      ctx.fillText(flick > 0.5 ? '✦' : '·', fx, fy);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // --- Дождь ---
    const rainA = 0.5 + (1 - sunT) * 0.5;
    ctx.font = `${Math.max(10, Math.floor(12 * dpr))}px "Courier New", monospace`;
    ctx.shadowColor = '#7ab8ff';
    ctx.shadowBlur = 4 * dpr;
    for (const r of rain) {
      ctx.globalAlpha = r.alpha * rainA;
      ctx.fillStyle = `hsl(${r.hue}, 100%, 78%)`;
      ctx.fillText(r.ch, r.x, r.y);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // --- Птицы ---
    ctx.save();
    ctx.strokeStyle = mixA('#0f0514', '#1a1020', sunT, 0.9);
    ctx.lineWidth = 1.6 * dpr;
    ctx.lineCap = 'round';
    for (const b of birds) {
      const flap = Math.sin(time * b.flapSpeed + b.phase);
      const w = 9 * dpr * b.scale;
      const h = (2.5 + Math.abs(flap) * 5) * dpr * b.scale;
      const px = b.x, py = b.y;
      ctx.beginPath();
      ctx.moveTo(px - w, py + flap * h * 0.5);
      ctx.quadraticCurveTo(px - w * 0.4, py - h * 0.4, px, py);
      ctx.quadraticCurveTo(px + w * 0.4, py - h * 0.4, px + w, py + flap * h * 0.5);
      ctx.stroke();
    }
    ctx.restore();

    // --- Метеоры (только ночью) ---
    if (sunT < 0.35) {
      meteorTimer -= 1 / 60;
      if (meteorTimer <= 0 && !meteor) {
        meteor = {
          x: Math.random() * W,
          y: Math.random() * horizonY * 0.5,
          vx: (400 + Math.random() * 300) * dpr,
          vy: (200 + Math.random() * 200) * dpr,
          life: 1.6, maxLife: 1.6,
        };
        meteorTimer = 6 + Math.random() * 10;
      }
      if (meteor) {
        meteor.x += meteor.vx * (1 / 60);
        meteor.y += meteor.vy * (1 / 60);
        meteor.life -= 1 / 60;
        if (meteor.life <= 0) meteor = null;
        else {
          const a = meteor.life / meteor.maxLife;
          const trail = 60 * dpr;
          const grd = ctx.createLinearGradient(meteor.x - trail * 1.2, meteor.y - trail * 0.6, meteor.x, meteor.y);
          grd.addColorStop(0, 'rgba(255,255,255,0)');
          grd.addColorStop(1, `rgba(255,240,255,${a * 0.9})`);
          ctx.strokeStyle = grd;
          ctx.lineWidth = 2 * dpr;
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = 12 * dpr;
          ctx.beginPath();
          ctx.moveTo(meteor.x - trail * 1.2, meteor.y - trail * 0.6);
          ctx.lineTo(meteor.x, meteor.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    }

    // --- Линзовое свечение ---
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.05 + 0.02 * Math.sin(time * 1.3);
    const rayG = ctx.createRadialGradient(sunCX, sunCenterY, sunR2 * 0.9, sunCX, sunCenterY, sunR2 * 3.2);
    rayG.addColorStop(0, 'rgba(255,200,255,1)');
    rayG.addColorStop(1, 'rgba(255,120,200,0)');
    ctx.fillStyle = rayG;
    ctx.fillRect(0, 0, W, horizonY + 4);
    ctx.restore();

    // --- Молнии ---
    for (const bolt of bolts) {
      const a = bolt.life / bolt.maxLife;
      ctx.save();
      ctx.shadowColor = '#a8d0ff';
      ctx.shadowBlur = 20 * dpr;
      ctx.lineCap = 'round';
      for (const s of bolt.segs) {
        ctx.strokeStyle = s.branch
          ? `rgba(180,210,255,${a * 0.6})`
          : `rgba(255,255,255,${a})`;
        ctx.lineWidth = (s.branch ? 1 : 2.2) * dpr;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- Вспышка молнии ---
    if (lightningFlash > 0) {
      ctx.fillStyle = `rgba(180,200,255,${lightningFlash * 0.22})`;
      ctx.fillRect(0, 0, W, H);
    }

    // --- CRT scanlines ---
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = '#000';
    const scanStep = Math.max(2, Math.floor(3 * dpr));
    for (let y = 0; y < H; y += scanStep) ctx.fillRect(0, y, W, 1 * dpr);
    ctx.restore();

    // --- Виньетка ---
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.48, Math.min(W, H) * 0.28, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // --- Хроматическая аберрация ---
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ff00a0';
    ctx.fillRect(2 * dpr, 0, W, H);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(-2 * dpr, 0, W, H);
    ctx.restore();
  }

  // ─────────────────────────────────────────────
  // КИТ
  // ─────────────────────────────────────────────
  function drawWhale(w, time, sunT) {
    const wob = Math.sin(w.phase) * w.wobAmp;
    const dir = w.vx >= 0 ? 1 : -1;
    const s = w.size;
    const col = mix(NIGHT.whale, DAY.whale, sunT);
    const alpha = 0.55 + (1 - sunT) * 0.3;

    ctx.save();
    ctx.translate(w.x, w.y + wob);
    ctx.scale(dir, 1);
    ctx.globalAlpha = alpha;

    // Тело
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, 0);
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.35, 0, -s * 0.4);
    ctx.quadraticCurveTo(s * 0.6, -s * 0.35, s * 0.9, -s * 0.05);
    ctx.quadraticCurveTo(s * 0.95, s * 0.15, s * 0.7, s * 0.25);
    ctx.quadraticCurveTo(0, s * 0.45, -s * 0.9, 0);
    ctx.closePath();

    const wg = ctx.createLinearGradient(-s, -s * 0.4, s, s * 0.4);
    wg.addColorStop(0, 'rgba(100,60,160,0.35)');
    wg.addColorStop(0.5, 'rgba(180,120,220,0.55)');
    wg.addColorStop(1, 'rgba(255,180,230,0.7)');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.6 * dpr;
    ctx.shadowColor = col;
    ctx.shadowBlur = 20 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Глаз
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8 * dpr;
    ctx.beginPath();
    ctx.arc(s * 0.6, -s * 0.05, s * 0.06, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0728';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(s * 0.62, -s * 0.05, s * 0.03, 0, TAU);
    ctx.fill();

    // Хвост
    const tailA = Math.sin(time * 1.8 + w.phase) * 0.3;
    ctx.save();
    ctx.translate(-s * 0.9, 0);
    ctx.rotate(tailA);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-s * 0.35, -s * 0.4, -s * 0.55, -s * 0.32);
    ctx.quadraticCurveTo(-s * 0.35, 0, -s * 0.55, s * 0.32);
    ctx.quadraticCurveTo(-s * 0.35, s * 0.4, 0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(160,100,200,0.7)';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.4 * dpr;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12 * dpr;
    ctx.stroke();
    ctx.restore();

    // Фонтан
    for (const p of w.spout) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = alpha * a * 0.8;
      ctx.fillStyle = '#e0c8ff';
      ctx.shadowColor = col;
      ctx.shadowBlur = 10 * dpr;
      ctx.beginPath();
      ctx.arc(s * 0.3 + p.x, -s * 0.5 + p.y, 2 * dpr * a + 1, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // АСЦИИ-искры вокруг (trail)
    ctx.font = `${Math.floor(11 * dpr)}px "Courier New", monospace`;
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 10 * dpr;
    const chars = ['·', '✧', '⋆'];
    for (let i = 0; i < 4; i++) {
      const t = time * 1.5 + i * 1.7 + w.phase;
      ctx.globalAlpha = alpha * (0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t)));
      ctx.fillText(chars[i % 3], -s - 15 * dpr - i * 12 * dpr, -10 * dpr + Math.sin(t) * 10 * dpr);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // ─────────────────────────────────────────────
  // ДИРИЖАБЛЬ
  // ─────────────────────────────────────────────
  function drawAirship(a, time, sunT) {
    const bob = Math.sin(a.phase) * 8 * dpr;
    const dir = a.vx >= 0 ? 1 : -1;
    const s = a.size;
    const col = mix(NIGHT.airship, DAY.airship, sunT);
    const alpha = 0.65 + (1 - sunT) * 0.25;

    ctx.save();
    ctx.translate(a.x, a.y + bob);
    ctx.scale(dir, 1);
    ctx.globalAlpha = alpha;

    // Оболочка
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.2, s * 0.9, s * 0.5, 0, 0, TAU);
    const ag = ctx.createRadialGradient(-s * 0.3, -s * 0.4, 0, 0, -s * 0.2, s * 0.9);
    ag.addColorStop(0, 'rgba(255,240,200,0.7)');
    ag.addColorStop(0.6, 'rgba(255,140,80,0.5)');
    ag.addColorStop(1, 'rgba(140,60,140,0.45)');
    ctx.fillStyle = ag;
    ctx.shadowColor = col;
    ctx.shadowBlur = 22 * dpr;
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Полоски на оболочке
    ctx.strokeStyle = `rgba(255,240,200,0.45)`;
    ctx.lineWidth = 0.8 * dpr;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.3, -s * 0.65);
      ctx.lineTo(i * s * 0.3, s * 0.25);
      ctx.stroke();
    }

    // Верёвки
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.8 * dpr;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.05); ctx.lineTo(-s * 0.28, s * 0.32);
    ctx.moveTo(s * 0.5, -s * 0.05); ctx.lineTo(s * 0.28, s * 0.32);
    ctx.stroke();

    // Гондола
    ctx.shadowColor = col;
    ctx.shadowBlur = 12 * dpr;
    ctx.fillStyle = 'rgba(30,15,50,0.9)';
    ctx.fillRect(-s * 0.28, s * 0.3, s * 0.56, s * 0.22);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2 * dpr;
    ctx.strokeRect(-s * 0.28, s * 0.3, s * 0.56, s * 0.22);

    // Мигающий огонь
    const blink = Math.sin(time * 4 + a.phase) > 0.7;
    if (blink) {
      ctx.fillStyle = '#ff3060';
      ctx.shadowColor = '#ff3060';
      ctx.shadowBlur = 20 * dpr;
      ctx.beginPath();
      ctx.arc(0, s * 0.41, s * 0.05, 0, TAU);
      ctx.fill();
    }

    // Пропеллер
    ctx.save();
    ctx.translate(s * 0.7, s * 0.4);
    ctx.rotate(time * 22 + a.phase);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.6 * dpr;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8 * dpr;
    ctx.beginPath();
    ctx.moveTo(-s * 0.16, 0);
    ctx.lineTo(s * 0.16, 0);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // ─────────────────────────────────────────────
  // ЦИКЛ
  // ─────────────────────────────────────────────
  function loop(now) {
    if (!active) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;
    const cycleT = (time / CYCLE) % 1;
    const sunT = 0.5 - 0.5 * Math.cos(cycleT * TAU);

    updateLightning(dt, sunT, time);
    updateWhales(dt);
    updateAirships(dt);

    // Дождь
    for (const r of rain) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      if (r.y > H + 20 || r.x < -40) {
        r.y = -20;
        r.x = Math.random() * W * 1.2;
      }
    }
    // Птицы
    for (const b of birds) {
      b.x += b.vx * dt;
      if (b.x > W + 60) {
        b.x = -60;
        b.y = horizonY * (0.06 + Math.random() * 0.38);
      }
    }

    drawFrame(time, sunT);
    requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────
  // СТАРТ / ОСТАНОВ
  // ─────────────────────────────────────────────
  resize();
  addEventListener('resize', resize);

  const title = document.getElementById('titleScreen');

  function activate() {
    if (active) return;
    canvas.classList.add('show');
    active = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  function deactivate() {
    if (!active) return;
    canvas.classList.remove('show');
    active = false;
  }

  if (title) {
    // Следим за переключением .show у titleScreen
    const mo = new MutationObserver(() => {
      if (title.classList.contains('show')) activate();
      else deactivate();
    });
    mo.observe(title, { attributes: true, attributeFilter: ['class'] });

    if (title.classList.contains('show')) activate();
  } else {
    // fallback: если по какой-то причине titleScreen нет — просто всегда крутим
    activate();
  }
})();