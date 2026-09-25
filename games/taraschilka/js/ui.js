'use strict';

function showToastHTML(text, color, dur) {
  color = color || '#b16dff';
  dur = dur || 2200;
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0.85);
    padding: 22px 36px;
    background: rgba(15,12,30,0.96);
    border: 2px solid ${color}; border-radius: 14px;
    color: #fff; font-size: 17px; font-weight: 700;
    letter-spacing: 0.08em; text-align: center;
    z-index: 99999; pointer-events: none;
    box-shadow: 0 0 30px ${color}, 0 0 80px ${color}66;
    opacity: 0; transition: opacity 0.35s, transform 0.35s;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    white-space: pre-line; max-width: 85vw;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, -50%) scale(1)';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => el.remove(), 400);
  }, dur);
}

function showTugriksFloat(n) {
  if (!n || n <= 0) return;
  const el = document.createElement('div');
  el.className = 'tugriks-float';
  el.textContent = '◆ +' + n;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('go'));
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 450);
  }, 1200);
}

function showArenaToast(shape) {
  const names = {
    circle:  'CIRCLE',
    octagon: 'OCTAGON',
    hexagon: 'HEXAGON',
    cross:   'CROSS',
    star:    'STAR',
  };
  const name = names[shape] || (shape ? shape.toUpperCase() : 'ARENA');
  addToast(name, '#b16dff', 2.2);
}

const SKINS = {
  base: {
    id: 'base',
    name: 'БАЗОВЫЙ',
    desc: 'Белое ядро, стреляет снарядами в цвете бита',
    price: 0,
    color: '#7ec9ff',
    icon: '○',
  },
  cyan: {
    id: 'cyan',
    name: 'CYAN',
    desc: 'Катушка Теслы. Молнии бьют во врагов вместо пуль',
    price: 800,
    color: '#4da0ff',
    icon: '⚡',
    beta: true,
  },
};

function getHiddenUpgrades(skinId) {
  const S = TUNE.skins && TUNE.skins[skinId];
  return (S && Array.isArray(S.hiddenUpgrades)) ? S.hiddenUpgrades : [];
}

function isUpgradeHiddenForSkin(u, skinId) {
  return getHiddenUpgrades(skinId).indexOf(u.id) !== -1;
}

let pendingLevelUp = 0;

function openUpgrade() {
  G.paused2 = true;
  const list = document.getElementById('upgradeList');
  const screen = document.getElementById('upgradeScreen');
  const p = G.player;

  const hidden = getHiddenUpgrades(G.selectedSkin);
  const pool = UPGRADES.filter(u =>
    hidden.indexOf(u.id) === -1 && u.getLevel(p) < u.maxLevel
  );
  const picks = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = randi(0, pool.length);
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }

  list.innerHTML = '';
  picks.forEach(u => {
    const el = document.createElement('div');
    el.className = 'upgrade-card';
    const lvl = u.getLevel(p);
    const lvlHtml = u.maxLevel > 1
      ? `<span class="u-level">[${lvl + 1}/${u.maxLevel}]</span>` : '';
    const desc = getUpgradeDesc(u, p, lvl, 'card');
    el.innerHTML = `<div class="u-title">${u.title}${lvlHtml}</div><div class="u-desc">${desc}</div>`;
    el.addEventListener('click', () => {
      u.apply(G.player);
      screen.classList.remove('show');
      G.paused2 = false;
      pendingLevelUp--;
      if (pendingLevelUp > 0) setTimeout(openUpgrade, 150);
      updateHUD();
    });
    list.appendChild(el);
  });
  screen.classList.add('show');
}

function togglePause() {
  if (!G.running) return;
  if (G.paused2) return;
  const tp = document.getElementById('tuningPanel');
  if (tp && tp.classList.contains('show')) return;
  G.paused = !G.paused;
  const screen = document.getElementById('pauseScreen');
  if (G.paused) {
    screen.classList.add('show');
    renderPausePane('main');
    refreshPauseTabs();
  } else {
    screen.classList.remove('show');
  }
}

function closePause() {
  if (!G.running) return;
  if (G.paused2) return;
  G.paused = false;
  document.getElementById('pauseScreen').classList.remove('show');
}

function applyZoom(v) {
  G.zoom = v;
  saveZoom(v);
  const el = document.getElementById('zoomVal');
  if (el) el.textContent = v.toFixed(2) + '×';
}

function renderPausePane(name) {
  document.querySelectorAll('.pause-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.pause-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === name));
  if (name === 'upgrades' || name === 'stats') refreshPauseTabs();
  if (name === 'dev' && G.devUnlocked) refreshDevList();
}

function refreshPauseTabs() {
  const ul = document.getElementById('pauseUpgradesList');
  ul.innerHTML = '';
  const p = G.player;
  let any = false;
  UPGRADES.forEach(u => {
    const lvl = u.getLevel(p);
    if (lvl <= 0) return;
    if (isUpgradeHiddenForSkin(u, G.selectedSkin)) return;
    any = true;
    const row = document.createElement('div');
    row.className = 'list-row' + (u.maxLevel < 99 && lvl >= u.maxLevel ? ' maxed' : '');
    const lvlStr = u.maxLevel < 99 ? `[${lvl}/${u.maxLevel}]` : `×${lvl}`;
    const desc = getUpgradeDesc(u, p, lvl, 'pause');
    row.innerHTML = `<div class="top"><span class="name">${u.title}</span><span class="lvl">${lvlStr}</span></div>
      <div class="desc">${desc}</div>`;
    ul.appendChild(row);
  });
  if (!any) ul.innerHTML = '<div class="list-row" style="text-align:center;color:#6a7a99;padding:20px">Нет апгрейдов</div>';

  const sl = document.getElementById('pauseStatsList');
  sl.innerHTML = '';
  const dps = p.dmg * p.projCount * p.fireRate * (1 + p.crit * (p.critMult - 1));
  const waveType = (typeof getWaveType === 'function') ? getWaveType(G.wave) : 'light';
  const waveTypeStr = waveType === 'heavy' ? 'тяжёлая' : 'лёгкая';
  const waveTypeColor = waveType === 'heavy' ? '#ff3060' : '#4dffb0';
  const skinName = (SKINS[G.selectedSkin] && SKINS[G.selectedSkin].name) || G.selectedSkin;

  const groups = [
    ['УРОН', [
      ['Урон снаряда', p.dmg.toFixed(1)],
      ['Выстрелов/сек', p.fireRate.toFixed(2)],
      ['Снарядов за выстрел', p.projCount],
      ['Расчётный DPS', dps.toFixed(0)],
      ['Шанс крита', Math.round(p.crit * 100) + '%'],
      ['Множитель крита', '×' + p.critMult],
    ]],
    ['СНАРЯДЫ', [
      ['Пробитие', p.pierce],
      ['Рикошет', p.ricochet],
      ['Орбиталы', p.orbitals.length + ' (' + (p.orbitals.length * TUNE.upgrades.orbital.dmgPerSec) + ' DPS)'],
    ]],
    ['ЖИЗНЬ', [
      ['HP', Math.ceil(p.hp) + ' / ' + p.maxHp],
      ['Regen', p.regen.toFixed(1) + ' / сек'],
      ['Shield', p.shieldT > 0 ? p.shieldT.toFixed(1) + 'с' : '—'],
      ['Rage', p.rageT > 0 ? p.rageT.toFixed(1) + 'с' : '—'],
      ['Haste', p.hasteT > 0 ? p.hasteT.toFixed(1) + 'с' : '—'],
    ]],
    ['ДВИЖЕНИЕ', [['Скорость', Math.round(p.speed / DPR) + ' px/сек']]],
    ['ОПЫТ', [
      ['Множитель XP', '×' + p.xpBonus.toFixed(2)],
      ['Радиус сбора', Math.round(p.xpMagnet / DPR) + ' px'],
      ['Скорость притягивания', '×' + p.xpPullSpeed.toFixed(2)],
      ['До след. уровня', p.xp + ' / ' + p.xpNeed],
    ]],
    ['АРЕНА', [
      ['Форма', (G.arenaShape || 'circle').toUpperCase()],
      ['Радиус', Math.round(ARENA_R / DPR) + ' px'],
      ['Масштаб', Math.round((G.arenaScale || 1) * 100) + '%'],
    ]],
    ['СКИН', [
      ['Активный', skinName],
    ]],
    ...(G.selectedSkin === 'cyan' ? [(() => {
      const C = TUNE.skins.cyan;
      const MU = TUNE.upgrades.cyanMultishot;
      const mLv = p._lv.cyanMultishot || 0;
      const leadTargets = C.leadTargets + (MU.leadAdd[mLv] || 0);
      const bassTargets = C.bassTargets + (MU.bassAdd[mLv] || 0);
      const rangeMul = 1 + (TUNE.upgrades.cyanRange.factor - 1) * (p._lv.cyanRange || 0);
      const leadRangePx = Math.round(C.leadRange * rangeMul);
      const chainLv = p._lv.cyanChain || 0;
      const chainBounces = chainLv > 0 ? TUNE.upgrades.cyanChain.bounces[chainLv] : 0;
      const chainDmgPct = chainLv > 0 ? Math.round(TUNE.upgrades.cyanChain.damageTbl[chainLv] * 100) : 0;
      const powerMul = Math.pow(TUNE.upgrades.cyanPower.factor, p._lv.cyanPower || 0);
      const leadDmg = (p.dmg * 0.25 * powerMul).toFixed(1);
      const bassDmg = (p.dmg * 0.4 * powerMul).toFixed(1);
      return ['CYAN', [
        ['Радиус атаки', leadRangePx + ' px'],
        ['Кулдаун на цель', (C.targetCooldown != null ? C.targetCooldown : 0.35) + ' сек'],
        ['Молний мелодии', leadTargets],
        ['Молний баса', bassTargets],
        ['Урон мелодии', leadDmg],
        ['Урон баса', bassDmg],
        ['Цепь: отскоков', chainBounces],
        ['Цепь: урон', chainDmgPct + '%'],
        ['ARC POWER ур.', (p._lv.cyanPower || 0)],
        ['TWIN ARCS ур.', mLv],
        ['CHAIN LIGHTNING ур.', chainLv],
        ['ARC NOVA ур.', (p._lv.cyanRange || 0)],
      ]];
    })()] : []),
    ['ВОЛНА', [
      ['Тип', `<span style="color:${waveTypeColor}">${waveTypeStr}</span>`],
      ['Номер', G.wave],
      ['Интенсивность музыки', Math.round(A.intensity * 100) + '%'],
      ['DMC рейтинг', G.rating + ' (×' + getRatingMultiplier() + ')'],
      ['Streak', G.comboCount],
    ]],
  ];

  groups.forEach(([title, items]) => {
    const g = document.createElement('div');
    g.className = 'stat-group';
    g.innerHTML = `<div class="stat-group-title">${title}</div>` +
      items.map(([k, v]) => `<div class="stat-line"><span>${k}</span><span class="v">${v}</span></div>`).join('');
    sl.appendChild(g);
  });
}

function unlockDev() {
  const pass = prompt('DEV PASSWORD:');
  if (pass === '14881') {
    G.devUnlocked = true;
    document.getElementById('devTabBtn').style.display = 'block';
    document.getElementById('devUnlockBtn').style.display = 'none';
    const pb = document.getElementById('devPanelBtn');
    if (pb) pb.style.display = 'block';
    renderPausePane('dev');
  } else if (pass !== null) showToastHTML('WRONG', '#ff3060', 1500);
}

function refreshDevList() {
  const list = document.getElementById('devList');
  list.innerHTML = '';
  const p = G.player;
  UPGRADES.forEach(u => {
    const lvl = u.getLevel(p);
    const row = document.createElement('div');
    row.className = 'list-row dev';
    row.innerHTML = `<span class="name">${u.title}</span>
      <span class="ctrl">
        <button class="dev-btn minus" data-id="${u.id}" data-op="minus">−</button>
        <span class="dev-lvl">${lvl}</span>
        <button class="dev-btn" data-id="${u.id}" data-op="plus">+</button>
      </span>`;
    list.appendChild(row);
  });
}

const _devHold = {
  active: false,
  timer: null,
  interval: null,
  u: null,
  op: null,
};

function _devStep() {
  if (!_devHold.active) return false;
  const u = _devHold.u, op = _devHold.op;
  if (!u) return false;
  const p = G.player;
  if (!p) return false;
  const cur = u.getLevel(p);
  if (op === 'plus') {
    if (cur >= 99) return false;
    u.apply(p);
  } else {
    if (cur <= 0) return false;
    u.remove(p, cur);
    if (cur - 1 > 0) u.reapply(p, cur - 1);
  }
  sanitizePlayer();
  refreshDevList();
  refreshPauseTabs();
  updateHUD();
  return true;
}

function _devStop() {
  _devHold.active = false;
  if (_devHold.timer) clearTimeout(_devHold.timer);
  if (_devHold.interval) clearInterval(_devHold.interval);
  _devHold.timer = null;
  _devHold.interval = null;
  _devHold.u = null;
  _devHold.op = null;
}

document.addEventListener('pointerdown', e => {
  if (!e.target.matches('.dev-btn')) return;
  const id = e.target.dataset.id;
  const op = e.target.dataset.op;
  const u = UPGRADES.find(x => x.id === id);
  if (!u) return;

  _devStop();
  _devHold.active = true;
  _devHold.u = u;
  _devHold.op = op;

  if (!_devStep()) { _devStop(); return; }

  _devHold.timer = setTimeout(() => {
    _devHold.interval = setInterval(() => {
      if (!_devStep()) _devStop();
    }, 80);
  }, 350);
});

document.addEventListener('pointerup', _devStop);
document.addEventListener('pointercancel', _devStop);

function sanitizePlayer() {
  const p = G.player;
  if (!p) return;
  if (!isFinite(p.maxHp) || isNaN(p.maxHp) || p.maxHp < 1) p.maxHp = 100;
  if (!isFinite(p.hp) || isNaN(p.hp)) p.hp = p.maxHp;
  if (p.hp > p.maxHp) p.hp = p.maxHp;
  if (p.hp < 0) p.hp = 0;
}

const hud = {
  root: document.getElementById('hud'),
  wave: document.getElementById('hud-wave'),
  lvl: document.getElementById('hud-lvl'),
  score: document.getElementById('hud-score'),
  kills: document.getElementById('hud-kills'),
  hp: document.getElementById('hud-hp'),
  xp: document.getElementById('hud-xp'),
  time: document.getElementById('hud-time'),
  fps: document.getElementById('fpsTag'),
  hpLblMid: document.getElementById('hud-hp-lbl-mid'),
  hpLblMax: document.getElementById('hud-hp-lbl-max'),
  pickups: document.getElementById('hudPickups'),
};

function updatePickupHUD(p) {
  if (!hud.pickups) return;
  const K = TUNE.pickups;
  const items = [
    { key: 'haste',  t: p.hasteT,  max: K.hasteDur  },
    { key: 'shield', t: p.shieldT, max: K.shieldDur },
    { key: 'rage',   t: p.rageT,   max: K.rageDur   },
    { key: 'slowmo', t: G.slowmoT, max: K.slowmoDur },
  ];
  for (const item of items) {
    const el = hud.pickups.querySelector('[data-pk="' + item.key + '"]');
    if (!el) continue;
    if (item.t > 0) {
      el.style.display = 'flex';
      const fill = el.querySelector('.hud-pickup-fill');
      if (fill) fill.style.width = clamp(item.t / item.max * 100, 0, 100) + '%';
    } else {
      el.style.display = 'none';
    }
  }
}

function updateHUD() {
  const p = G.player; if (!p) return;
  sanitizePlayer();
  hud.wave.textContent = G.wave;
  hud.lvl.textContent = p.level;
  hud.score.textContent = G.score;
  hud.kills.textContent = G.kills;
  hud.hp.style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
  hud.xp.style.width = clamp(p.xp / p.xpNeed * 100, 0, 100) + '%';
  hud.hpLblMid.textContent = Math.round(p.maxHp * 0.5);
  hud.hpLblMax.textContent = p.maxHp;
  const t = Math.floor(G.time);
  hud.time.textContent = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  updatePickupHUD(p);
}

function updateMenuTugriks() {
  const el = document.getElementById('menuTugriks');
  if (el) el.textContent = '◆ ' + G.tugriks;
}

function autoClaimReward() {
  if (pendingReward <= 0) return 0;
  const reward = pendingReward;
  G.tugriks += reward;
  saveTugriks(G.tugriks);
  pendingReward = 0;
  updateMenuTugriks();
  const claimBtn = document.getElementById('claimBtn');
  if (claimBtn) { claimBtn.disabled = true; claimBtn.textContent = 'CLAIMED'; }
  const rewardTag = document.getElementById('rewardTag');
  if (rewardTag) rewardTag.textContent = '◆ +' + reward;
  return reward;
}

function startGame() {
  if (pendingReward > 0) {
    const r = autoClaimReward();
    if (r > 0) showTugriksFloat(r);
  }
  startAudio();
  setTrack(G.selectedTrack);

  if (typeof pickRandomArena === 'function') {
    pickRandomArena();
  } else {
    G.arenaShape = 'circle';
  }

  resetGame();
  G.running = true;
  G.paused = false;
  G.paused2 = false;
  document.getElementById('titleScreen').classList.remove('show');
  document.getElementById('deadScreen').classList.remove('show');
  document.getElementById('upgradeScreen').classList.remove('show');
  document.getElementById('pauseScreen').classList.remove('show');
  const ts = document.getElementById('tracksScreen');
  if (ts) ts.classList.remove('show');
  const cs = document.getElementById('changelogScreen');
  if (cs) cs.classList.remove('show');
  const tp = document.getElementById('tuningPanel');
  if (tp) tp.classList.remove('show');
  const sp = document.getElementById('shopScreen');
  if (sp) sp.classList.remove('show');
  hud.root.style.display = 'flex';
  hud.time.style.display = 'block';
  document.getElementById('pauseBtn').style.display = 'flex';

  showArenaToast(G.arenaShape);
  updateDMCRating();
  lastTime = performance.now();
}

function quitToMenu() {
  const wasRunning = G.running;
  if (wasRunning) {
    const reward = calcReward();
    if (reward > 0) {
      G.tugriks += reward;
      saveTugriks(G.tugriks);
      updateMenuTugriks();
      showTugriksFloat(reward);
    }
  }
  G.running = false;
  G.paused = false;
  G.paused2 = false;
  document.getElementById('pauseScreen').classList.remove('show');
  document.getElementById('deadScreen').classList.remove('show');
  document.getElementById('upgradeScreen').classList.remove('show');
  const ts = document.getElementById('tracksScreen');
  if (ts) ts.classList.remove('show');
  const cs = document.getElementById('changelogScreen');
  if (cs) cs.classList.remove('show');
  const tp = document.getElementById('tuningPanel');
  if (tp) tp.classList.remove('show');
  const sp = document.getElementById('shopScreen');
  if (sp) sp.classList.remove('show');
  document.getElementById('titleScreen').classList.add('show');
  hud.root.style.display = 'none';
  hud.time.style.display = 'none';
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('dmcRating').classList.remove('show');
  document.getElementById('dmcCombo').classList.remove('show');
  updateMenuTugriks();
}

function quitToMenuFromDeath() {
  if (pendingReward > 0) {
    const r = autoClaimReward();
    if (r > 0) showTugriksFloat(r);
  }
  G.running = false;
  G.paused = false;
  G.paused2 = false;
  document.getElementById('pauseScreen').classList.remove('show');
  document.getElementById('deadScreen').classList.remove('show');
  document.getElementById('upgradeScreen').classList.remove('show');
  const ts = document.getElementById('tracksScreen');
  if (ts) ts.classList.remove('show');
  const cs = document.getElementById('changelogScreen');
  if (cs) cs.classList.remove('show');
  const tp = document.getElementById('tuningPanel');
  if (tp) tp.classList.remove('show');
  const sp = document.getElementById('shopScreen');
  if (sp) sp.classList.remove('show');
  document.getElementById('titleScreen').classList.add('show');
  hud.root.style.display = 'none';
  hud.time.style.display = 'none';
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('dmcRating').classList.remove('show');
  document.getElementById('dmcCombo').classList.remove('show');
  updateMenuTugriks();
}

let pendingReward = 0;

function calcReward() {
  const E = TUNE.economy;
  const raw = G.kills * E.killsReward + G.score / E.scoreDivider + G.wave * E.waveReward;
  return Math.max(0, Math.floor(raw));
}

function buildRunReport(finalReason) {
  const lines = [];
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  const p = G.player;
  if (!p) return 'Нет данных — игрок не создан';

  const totalSec = Math.floor(G.time);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');

  lines.push('=== RUN ' + date + ' ' + time + ' ===');
  lines.push('reason:    ' + (finalReason || 'manual'));
  lines.push('track:     ' + (typeof A !== 'undefined' ? A.trackId : '?'));
  lines.push('skin:      ' + G.selectedSkin);
  lines.push('arena:     ' + (G.arenaShape || 'circle'));
  lines.push('duration:  ' + mm + ':' + ss + ' (' + totalSec + 's)');
  lines.push('wave:      ' + G.wave + '  (last heal ' + G._lastHealWave + ')');
  lines.push('level:     ' + p.level);
  lines.push('kills:     ' + G.kills);
  lines.push('score:     ' + G.score);
  lines.push('rating:    ' + G.rating + ' (peak combo ' + (G._peakCombo || 0) + ')');
  lines.push('hp final:  ' + Math.round(p.hp) + ' / ' + p.maxHp);
  lines.push('');

  lines.push('─── UPGRADES ───');
  let anyUpg = false;
  if (typeof UPGRADES !== 'undefined') {
    UPGRADES.forEach(u => {
      const lvl = u.getLevel(p);
      if (lvl > 0) {
        anyUpg = true;
        const name = (u.title || u.id).padEnd(18, ' ');
        lines.push('  ' + name + ' x' + lvl);
      }
    });
  }
  if (!anyUpg) lines.push('  (нет апгрейдов)');
  lines.push('');

  const log = G.runLog || [];
  if (log.length === 0) {
    lines.push('─── TIMELINE ───');
    lines.push('  (лог пуст — забег был слишком коротким)');
    return lines.join('\n');
  }

  lines.push('─── TIMELINE ───');
  const header = ['T', 'W', 'HP', 'DD', 'DT', 'HIT', 'SH', 'EN', 'K', 'LVL', 'CB', 'R'];
  const widths = [4, 3, 8, 6, 6, 5, 5, 4, 5, 4, 4, 2];
  function fmtRow(vals) {
    return vals.map((v, i) => String(v).padStart(widths[i], ' ')).join(' ');
  }
  lines.push(fmtRow(header));

  const MAX_ROWS = 120;
  const step = log.length > MAX_ROWS ? Math.ceil(log.length / MAX_ROWS) : 1;
  for (let i = 0; i < log.length; i += step) {
    const e = log[i];
    let mods = '';
    if (e.haste) mods += 'h';
    if (e.shield) mods += 's';
    if (e.rage) mods += 'r';
    const hpStr = e.hp + '/' + e.mhp;
    lines.push(fmtRow([
      e.t, e.w, hpStr, e.dd || 0, e.dt || 0, e.hit || 0, e.sh || 0,
      e.en, e.k, e.lvl, e.cb, e.r
    ]) + (mods ? '  +' + mods : ''));
  }
  if (step > 1) lines.push('  (показана каждая ' + step + '-я секунда, всего ' + log.length + ')');
  lines.push('');

  lines.push('─── SUMMARY ───');
  let peakDps = 0, peakDpsT = 0;
  let peakEn = 0, peakEnT = 0;
  let minHp = Infinity, minHpT = 0;
  let peakDD = 0, peakDDT = 0;
  let peakDT = 0, peakDTT = 0;
  let sumDD = 0, sumDT = 0, sumHit = 0, sumSh = 0, sumOvk = 0;
  for (const e of log) {
    if (e.dps > peakDps) { peakDps = e.dps; peakDpsT = e.t; }
    if (e.en > peakEn) { peakEn = e.en; peakEnT = e.t; }
    const hpRatio = e.hp / e.mhp;
    if (hpRatio < minHp) { minHp = hpRatio; minHpT = e.t; }
    const dd = e.dd || 0, dt = e.dt || 0;
    if (dd > peakDD) { peakDD = dd; peakDDT = e.t; }
    if (dt > peakDT) { peakDT = dt; peakDTT = e.t; }
    sumDD += dd; sumDT += dt;
    sumHit += e.hit || 0; sumSh += e.sh || 0;
    sumOvk += e.ovk || 0;
  }
  let sumHp = 0;
  for (const e of log) sumHp += e.hp / e.mhp;
  const avgHp = log.length ? sumHp / log.length : 1;

  lines.push('peak DPS (theo): ' + peakDps + '  (на ' + fmtSec(peakDpsT) + ')');
  lines.push('peak DPS (real): ' + peakDD + '  (на ' + fmtSec(peakDDT) + ')');
  lines.push('peak dmg taken:  ' + peakDT + '  (на ' + fmtSec(peakDTT) + ')');
  lines.push('peak enemies:    ' + peakEn + '  (на ' + fmtSec(peakEnT) + ')');
  lines.push('min HP:          ' + Math.round(minHp * 100) + '%  (на ' + fmtSec(minHpT) + ')');
  lines.push('avg HP:          ' + Math.round(avgHp * 100) + '%');
  lines.push('total dmg dealt: ' + Math.round(sumDD));
  lines.push('total dmg taken: ' + Math.round(sumDT));
  const acc = sumSh > 0 ? Math.round(sumHit / sumSh * 100) : 0;
  lines.push('shots:           ' + sumSh + '  hits: ' + sumHit + '  accuracy: ' + acc + '%');
  const ovkPct = sumDD > 0 ? Math.round(sumOvk / sumDD * 100) : 0;
  lines.push('overkill:        ' + Math.round(sumOvk) + '  (' + ovkPct + '% of dealt)');
  lines.push('');

  const totalBySrc = (G._total && G._total.bySource) || {};
  const srcNames = ['bullet', 'orbital', 'explode', 'cyan_lead', 'cyan_bass', 'cyan_chain', 'other'];
  let srcTotal = 0;
  for (const k of srcNames) srcTotal += totalBySrc[k] || 0;
  if (srcTotal > 0) {
    lines.push('─── DAMAGE BY SOURCE ───');
    for (const k of srcNames) {
      const v = totalBySrc[k] || 0;
      if (v <= 0) continue;
      const pct = Math.round(v / srcTotal * 100);
      lines.push('  ' + k.padEnd(12, ' ') + ' : ' + String(Math.round(v)).padStart(7, ' ') + '  (' + pct + '%)');
    }
    lines.push('');
  }

  lines.push('per-wave:');
  const byWave = {};
  for (const e of log) {
    if (!byWave[e.w]) byWave[e.w] = { count: 0, dpsSum: 0, enSum: 0, ddSum: 0, dtSum: 0, kills0: null, killsN: 0 };
    const w = byWave[e.w];
    w.count++;
    w.dpsSum += e.dps;
    w.enSum += e.en;
    w.ddSum += e.dd || 0;
    w.dtSum += e.dt || 0;
    w.killsN = e.k;
    if (w.kills0 === null) w.kills0 = e.k;
  }
  const waveKeys = Object.keys(byWave).map(Number).sort((a, b) => a - b);
  for (const wk of waveKeys) {
    const w = byWave[wk];
    const avgDps = Math.round(w.dpsSum / w.count);
    const avgEn = Math.round(w.enSum / w.count);
    const avgDD = Math.round(w.ddSum / w.count);
    const avgDT = Math.round(w.dtSum / w.count);
    const killsWave = w.killsN - w.kills0;
    lines.push('  w' + String(wk).padStart(2, ' ') +
      '  dps ' + String(avgDps).padStart(4, ' ') +
      '  dd ' + String(avgDD).padStart(4, ' ') +
      '  dt ' + String(avgDT).padStart(4, ' ') +
      '  en ' + String(avgEn).padStart(3, ' ') +
      '  kills ' + String(killsWave).padStart(4, ' '));
  }

  return lines.join('\n');
}

function fmtSec(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return mm + ':' + ss;
}

function openRunReport() {
  const text = buildRunReport(G.running ? 'manual (pause)' : 'manual (death)');
  const ta = document.getElementById('runReportText');
  if (ta) ta.value = text;
  const modal = document.getElementById('runReportModal');
  if (modal) modal.classList.add('show');
}

function closeRunReport() {
  const modal = document.getElementById('runReportModal');
  if (modal) modal.classList.remove('show');
}

function gameOver() {
  G.running = false;

  // трекер: финализируем забег
  G.runMeta = {
    date: new Date().toISOString(),
    duration: Math.floor(G.time),
    track: (typeof A !== 'undefined') ? A.trackId : '?',
    skin: G.selectedSkin,
    arena: G.arenaShape || 'circle',
    wave: G.wave,
    level: G.player ? G.player.level : 1,
    kills: G.kills,
    score: G.score,
    rating: G.rating,
    peakCombo: G._peakCombo || 0,
    hpFinal: G.player ? Math.round(G.player.hp) : 0,
    maxHpFinal: G.player ? G.player.maxHp : 0,
    logLen: G.runLog.length,
  };
  try {
    localStorage.setItem('ns_last_run_meta', JSON.stringify(G.runMeta));
    localStorage.setItem('ns_last_run_log', JSON.stringify(G.runLog));
  } catch (e) { console.warn('run log save failed', e); }

  pendingReward = calcReward();
  const isBest = saveBest();
  document.getElementById('bestTag').textContent = isBest ? '★ NEW BEST ★' : `BEST: ${G.best}`;
  const t = Math.floor(G.time);
  document.getElementById('statTime').textContent =
    String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  document.getElementById('statScore').textContent = G.score;
  document.getElementById('statKills').textContent = G.kills;
  document.getElementById('statWave').textContent = G.wave;
  document.getElementById('statLvl').textContent = G.player.level;
  document.getElementById('statRank').textContent = G.rating;
  document.getElementById('rewardTag').textContent = '◆ +' + pendingReward;
  document.getElementById('claimBtn').disabled = false;
  document.getElementById('claimBtn').textContent = 'CLAIM REWARD';
  document.getElementById('deadScreen').classList.add('show');
  const reportBtn = document.getElementById('deadReportBtn');
  if (reportBtn) reportBtn.style.display = 'inline-block';
  hud.root.style.display = 'none';
  hud.time.style.display = 'none';
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('dmcRating').classList.remove('show');
  document.getElementById('dmcCombo').classList.remove('show');
  A.intensity = 0;
}

function devRevive() {
  const pass = prompt('DEV PASSWORD:');
  if (pass !== '14881') {
    if (pass !== null) showToastHTML('WRONG', '#ff3060', 1500);
    return;
  }
  const p = G.player;
  if (!p) return;
  G.particles.length = 0; G.ripples.length = 0; G.explosions.length = 0; G.toasts.length = 0;
  G.shakeT = 0; G.shakeMag = 0; G.flashT = 0; G.beatFlashT = 0;
  G.fireDamageTime = 0; G.gridPulse = 0; G.streakGlowT = 0;
  if (typeof draw !== 'undefined') { draw._vg = null; draw._vgW = 0; draw._vgH = 0; }
  sanitizePlayer();
  p.hp = p.maxHp;
  p.invulnT = 3.0;
  p.shieldT = 0; p.rageT = 0; p.hasteT = 0; p.sandyGlitchT = 0;
  p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
  G.running = true; G.paused = false; G.paused2 = false;
  G.comboCount = 0; G.comboTimer = 0; G.rating = 'D';
  updateDMCRating();
  document.getElementById('deadScreen').classList.remove('show');
  hud.root.style.display = 'flex';
  hud.time.style.display = 'block';
  document.getElementById('pauseBtn').style.display = 'flex';
  if (typeof addToast === 'function') addToast('REVIVED · 3s INVULN', '#7eff90', 1.8);
  lastTime = performance.now();
}

const TRACK_ICONS = { default: '🎵', void: '🌌', kyrie: '✞' };
const TRACK_COLORS = { default: '#b16dff', void: '#4da0ff', kyrie: '#ffd060' };
let _shopTab = 'skins';
let _shopAnimFrame = null;

function _startShopAnim() {
  if (_shopAnimFrame) return;
  const tick = () => {
    const t = performance.now() / 1000;
    const cvs = document.querySelectorAll('canvas.shop-preview[data-skin]');
    cvs.forEach(cv => {
      const id = cv.dataset.skin;
      try { renderSkinPreview(cv, id, t); } catch (e) {}
    });
    _shopAnimFrame = requestAnimationFrame(tick);
  };
  _shopAnimFrame = requestAnimationFrame(tick);
}

function _stopShopAnim() {
  if (_shopAnimFrame) cancelAnimationFrame(_shopAnimFrame);
  _shopAnimFrame = null;
}

function openShop() {
  document.getElementById('titleScreen').classList.remove('show');
  const sp = document.getElementById('shopScreen');
  if (sp) sp.classList.add('show');
  renderShop();
  _startShopAnim();
}

function closeShop() {
  const sp = document.getElementById('shopScreen');
  if (sp) sp.classList.remove('show');
  document.getElementById('titleScreen').classList.add('show');
  _stopShopAnim();
}

function renderShop() {
  const balance = document.getElementById('shopBalance');
  if (balance) balance.textContent = G.tugriks;
  document.querySelectorAll('.shop-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.shopTab === _shopTab);
  });
  const body = document.getElementById('shopBody');
  if (!body) return;
  body.innerHTML = '';

  if (_shopTab === 'skins') {
    Object.values(SKINS).forEach(s => {
      const owned = G.ownedSkins.includes(s.id);
      const selected = G.selectedSkin === s.id;
      const card = document.createElement('div');
      card.className = 'shop-card' + (owned ? ' owned' : ' locked') + (selected ? ' selected' : '');
      const canAfford = G.tugriks >= s.price;
      const betaHtml = s.beta ? ' <span class="beta-tag">BETA</span>' : '';
      let actionHtml;
      if (selected) {
        actionHtml = `<div class="shop-action selected">АКТИВЕН</div>`;
      } else if (owned) {
        actionHtml = `<button class="shop-action select" data-skin-action="select" data-id="${s.id}">ВЫБРАТЬ</button>`;
      } else {
        actionHtml = `<button class="shop-action buy" data-skin-action="buy" data-id="${s.id}" ${canAfford ? '' : 'disabled'}>КУПИТЬ</button>
          <div class="shop-price">◆ ${s.price}</div>`;
      }
      card.innerHTML = `
        <canvas class="shop-preview" data-skin="${s.id}"></canvas>
        <div class="shop-info">
          <div class="shop-name">${s.name}${betaHtml}</div>
          <div class="shop-desc">${s.desc}</div>
        </div>
        <div class="shop-action-wrap">${actionHtml}</div>
      `;
      body.appendChild(card);
    });
  } else if (_shopTab === 'tracks') {
    if (typeof TRACKS === 'undefined') {
      body.innerHTML = '<div style="text-align:center;color:#6a7a99;padding:20px">TRACKS не загружены</div>';
      return;
    }
    Object.values(TRACKS).forEach(t => {
      const owned = G.ownedTracks.includes(t.id);
      const selected = G.selectedTrack === t.id;
      const card = document.createElement('div');
      card.className = 'shop-card' + (owned ? ' owned' : ' locked') + (selected ? ' selected' : '');
      const color = TRACK_COLORS[t.id] || '#b16dff';
      const icon = TRACK_ICONS[t.id] || '🎵';
      const canAfford = G.tugriks >= t.price;
      let actionHtml;
      if (selected) {
        actionHtml = `<div class="shop-action selected">АКТИВЕН</div>`;
      } else if (owned) {
        actionHtml = `<button class="shop-action select" data-track-action="select" data-id="${t.id}">ВЫБРАТЬ</button>`;
      } else {
        actionHtml = `<button class="shop-action buy" data-track-action="buy" data-id="${t.id}" ${canAfford ? '' : 'disabled'}>КУПИТЬ</button>
          <div class="shop-price">◆ ${t.price}</div>`;
      }
      card.innerHTML = `
        <div class="shop-icon" style="color:${color}">${icon}</div>
        <div class="shop-info">
          <div class="shop-name">${t.name}</div>
          <div class="shop-desc">${t.desc}</div>
          <div class="shop-meta">BPM ${t.bpm}${owned ? '' : ' · ◆ ' + t.price}</div>
        </div>
        <div class="shop-action-wrap">${actionHtml}</div>
      `;
      body.appendChild(card);
    });
  }

  body.querySelectorAll('[data-skin-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.skinAction;
      const id = btn.dataset.id;
      if (action === 'select') {
        G.selectedSkin = id;
        saveSelectedSkin(id);
        G.cyanBolts.length = 0;
        renderShop();
      } else if (action === 'buy') {
        const sk = SKINS[id];
        if (!sk) return;
        if (G.ownedSkins.includes(id)) return;
        if (G.tugriks < sk.price) return;
        G.tugriks -= sk.price;
        saveTugriks(G.tugriks);
        G.ownedSkins.push(id);
        saveOwnedSkins(G.ownedSkins);
        updateMenuTugriks();
        renderShop();
      }
    });
  });
  body.querySelectorAll('[data-track-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.trackAction;
      const id = btn.dataset.id;
      if (action === 'select') {
        G.selectedTrack = id;
        saveSelectedTrack(id);
        setTrack(id);
        renderShop();
      } else if (action === 'buy') {
        const track = TRACKS[id];
        if (!track) return;
        if (G.ownedTracks.includes(id)) return;
        if (G.tugriks < track.price) return;
        G.tugriks -= track.price;
        saveTugriks(G.tugriks);
        G.ownedTracks.push(id);
        saveOwnedTracks(G.ownedTracks);
        updateMenuTugriks();
        renderShop();
      }
    });
  });
}

function openChangelog() {
  if (typeof CHANGELOG === 'undefined') {
    showToastHTML('CHANGELOG не загружен\nПроверь changelog.js', '#ff3060', 2500);
    return;
  }
  renderChangelog();
  document.getElementById('titleScreen').classList.remove('show');
  const cs = document.getElementById('changelogScreen');
  if (cs) cs.classList.add('show');
}

function closeChangelog() {
  const cs = document.getElementById('changelogScreen');
  if (cs) cs.classList.remove('show');
  document.getElementById('titleScreen').classList.add('show');
}

function renderChangelog() {
  const list = document.getElementById('changelogList');
  if (!list) return;
  list.innerHTML = '';
  CHANGELOG.forEach(entry => {
    const el = document.createElement('div');
    el.className = 'changelog-item';
    const dateStr = entry.date && entry.date !== '—' ? entry.date : '';
    const titleHtml = entry.title ? `<div class="changelog-title">${entry.title}</div>` : '';
    let itemsHtml = '';
    if (Array.isArray(entry.items) && entry.items.length) {
      itemsHtml = '<ul class="changelog-items">' +
        entry.items.map(line => `<li>${line}</li>`).join('') + '</ul>';
    }
    el.innerHTML = `
      <div class="changelog-head">
        <span class="changelog-version">v${entry.version}</span>
        ${dateStr ? `<span class="changelog-date">${dateStr}</span>` : ''}
      </div>
      ${titleHtml}
      ${itemsHtml}
    `;
    list.appendChild(el);
  });
}

function applyTuneToGame() {
  const old = G.player;
  if (!old) { showToastHTML('Игра не запущена', '#ff3060', 1500); return; }
  const snapshot = {
    x: old.x, y: old.y, vx: old.vx, vy: old.vy,
    hpRatio: old.maxHp > 0 ? old.hp / old.maxHp : 1,
    level: old.level, xp: old.xp, xpNeed: old.xpNeed,
    shieldT: old.shieldT, rageT: old.rageT, hasteT: old.hasteT,
    invulnT: old.invulnT, aimAngle: old.aimAngle,
  };
  const levels = {};
  UPGRADES.forEach(u => { levels[u.id] = u.getLevel(old); });
  const fresh = newPlayer();
  UPGRADES.forEach(u => {
    const lvl = levels[u.id] || 0;
    if (lvl > 0 && typeof u.reapply === 'function') u.reapply(fresh, lvl);
  });
  fresh.x = snapshot.x; fresh.y = snapshot.y;
  fresh.vx = snapshot.vx; fresh.vy = snapshot.vy;
  fresh.level = snapshot.level; fresh.xp = snapshot.xp;
  fresh.xpNeed = snapshot.xpNeed; fresh.aimAngle = snapshot.aimAngle;
  fresh.hp = Math.max(1, fresh.maxHp * snapshot.hpRatio);
  fresh.shieldT = snapshot.shieldT;
  fresh.rageT = snapshot.rageT;
  fresh.hasteT = snapshot.hasteT;
  fresh.invulnT = Math.max(snapshot.invulnT, 0.5);
  G.player = fresh;
  sanitizePlayer();
  updateHUD();
  refreshPauseTabs();
  return { hp: fresh.hp, maxHp: fresh.maxHp, dmg: fresh.dmg, fireRate: fresh.fireRate, speed: fresh.speed };
}

const TUNE_SECTIONS = [
  { id: 'player',   title: 'PLAYER',     paths: ['player'],   open: true },
  { id: 'xpCurve',  title: 'XP CURVE',   paths: ['xpCurve'],  open: false },
  { id: 'enemies',  title: 'ENEMIES',    paths: ['enemies'],  open: false },
  { id: 'bosses',   title: 'BOSSES',     paths: ['bosses'],   open: false },
  { id: 'spawn',    title: 'SPAWN',      paths: ['spawn'],    open: false },
  { id: 'streakGlow', title: 'STREAK GLOW', paths: ['streakGlow'], open: false },
  { id: 'waves',    title: 'WAVES',      paths: ['waves'],    open: false },
  { id: 'economy',  title: 'ECONOMY',    paths: ['economy'],  open: false },
  { id: 'upgrades', title: 'UPGRADES',   paths: ['upgrades'], open: false },
  { id: 'pickups',  title: 'PICKUPS',    paths: ['pickups'],  open: false },
  { id: 'dmc',      title: 'DMC',        paths: ['dmc'],      open: false },
  { id: 'limits',   title: 'LIMITS',     paths: ['limits'],   open: false },
  { id: 'arena',    title: 'ARENA',      paths: ['arena'],    open: false },
  { id: 'skins',    title: 'SKINS',      paths: ['skins'],    open: false },
];

let _tunePanelBuilt = false;
let _tuneSaveTimer = null;

function openTuningPanel() {
  if (!G.devUnlocked) { showToastHTML('Сначала разблокируй DEV TOOLS', '#ff3060', 1500); return; }
  const ps = document.getElementById('pauseScreen');
  if (ps) ps.classList.remove('show');
  const panel = document.getElementById('tuningPanel');
  if (!panel) return;
  if (!_tunePanelBuilt) { buildTuningPanel(); _tunePanelBuilt = true; }
  updateTuneCounters();
  panel.classList.add('show');
}

function closeTuningPanel() {
  const panel = document.getElementById('tuningPanel');
  if (panel) panel.classList.remove('show');
  if (G.running && G.paused) {
    const ps = document.getElementById('pauseScreen');
    if (ps) ps.classList.add('show');
  }
}

function _hintHtml(path) {
  if (typeof TUNE_HINTS === 'undefined') return '';
  const H = TUNE_HINTS[path];
  if (!H) return '';
  let html = '<div class="tune-hint">' + H.hint;
  if (H.dir) html += ' <span class="tune-dir">' + H.dir + '</span>';
  html += '</div>';
  return html;
}

function buildTuningPanel() {
  const content = document.getElementById('tuneContent');
  if (!content) return;
  content.innerHTML = '';
  TUNE_SECTIONS.forEach(sec => {
    const rootObj = sec.paths.length === 1 ? TUNE[sec.paths[0]] : null;
    const secEl = document.createElement('div');
    secEl.className = 'tune-section' + (sec.open ? ' open' : '');
    secEl.dataset.sectionId = sec.id;
    const headEl = document.createElement('div');
    headEl.className = 'tune-section-head';
    headEl.innerHTML = `
      <span class="tune-section-title">${sec.title}</span>
      <span class="tune-section-count" data-count="${sec.id}">—</span>
      <span class="tune-section-arrow">▸</span>
    `;
    headEl.addEventListener('click', () => { secEl.classList.toggle('open'); });
    secEl.appendChild(headEl);
    const bodyEl = document.createElement('div');
    bodyEl.className = 'tune-section-body';
    secEl.appendChild(bodyEl);
    renderTuneNode(bodyEl, rootObj, sec.paths[0], 0);
    content.appendChild(secEl);
  });
}

function renderTuneNode(container, obj, path, depth) {
  if (!obj || typeof obj !== 'object') return;
  for (const key in obj) {
    const v = obj[key];
    const childPath = path + '.' + key;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const groupEl = document.createElement('div');
      groupEl.className = 'tune-group';
      groupEl.textContent = key;
      container.appendChild(groupEl);
      renderTuneNode(container, v, childPath, depth + 1);
    } else if (Array.isArray(v)) {
      container.appendChild(buildTuneArrayRow(key, childPath, v));
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      container.appendChild(buildTuneNumberRow(key, childPath, v));
    } else if (typeof v === 'string') {
      container.appendChild(buildTuneStringRow(key, childPath, v));
    }
  }
}

function buildTuneNumberRow(label, path, value) {
  const row = document.createElement('div');
  row.className = 'tune-row';
  row.dataset.path = path;
  const lbl = document.createElement('div');
  lbl.className = 'tune-label';
  lbl.innerHTML = `${label}<span class="tune-path">${path}</span>${_hintHtml(path)}`;
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'decimal';
  input.className = 'tune-input';
  input.value = value;
  input.dataset.path = path;
  input.addEventListener('input', () => {
    const raw = input.value.trim().replace(',', '.');
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return;
    const num = parseFloat(raw);
    if (isNaN(num)) { input.classList.add('invalid'); return; }
    input.classList.remove('invalid');
    setTune(path, num);
    row.classList.toggle('changed', isTuneChanged(path));
    input.classList.toggle('changed', isTuneChanged(path));
    scheduleTuneSave();
    updateTuneCounters();
  });
  input.addEventListener('blur', () => {
    const cur = getTune(path);
    if (cur !== undefined) input.value = cur;
    input.classList.remove('invalid');
  });
  const resetBtn = document.createElement('button');
  resetBtn.className = 'tune-reset';
  resetBtn.textContent = '↺';
  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const def = getTuneDefault(path);
    setTune(path, def);
    input.value = def;
    row.classList.remove('changed');
    input.classList.remove('changed');
    scheduleTuneSave();
    updateTuneCounters();
  });
  row.classList.toggle('changed', isTuneChanged(path));
  input.classList.toggle('changed', isTuneChanged(path));
  row.appendChild(lbl); row.appendChild(input); row.appendChild(resetBtn);
  return row;
}

function buildTuneStringRow(label, path, value) {
  const row = document.createElement('div');
  row.className = 'tune-row';
  row.dataset.path = path;
  const lbl = document.createElement('div');
  lbl.className = 'tune-label';
  lbl.innerHTML = `${label}<span class="tune-path">${path}</span>${_hintHtml(path)}`;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'tune-input';
  input.value = value;
  input.style.textAlign = 'left';
  input.style.fontSize = '12px';
  input.dataset.path = path;
  input.addEventListener('input', () => {
    setTune(path, input.value);
    row.classList.toggle('changed', isTuneChanged(path));
    input.classList.toggle('changed', isTuneChanged(path));
    scheduleTuneSave();
    updateTuneCounters();
  });
  input.addEventListener('blur', () => {
    const cur = getTune(path);
    if (cur !== undefined) input.value = cur;
  });
  const resetBtn = document.createElement('button');
  resetBtn.className = 'tune-reset';
  resetBtn.textContent = '↺';
  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const def = getTuneDefault(path);
    setTune(path, def);
    input.value = def;
    row.classList.remove('changed');
    input.classList.remove('changed');
    scheduleTuneSave();
    updateTuneCounters();
  });
  row.classList.toggle('changed', isTuneChanged(path));
  input.classList.toggle('changed', isTuneChanged(path));
  row.appendChild(lbl); row.appendChild(input); row.appendChild(resetBtn);
  return row;
}

function buildTuneArrayRow(label, path, arr) {
  const row = document.createElement('div');
  row.className = 'tune-row';
  row.dataset.path = path;
  const lbl = document.createElement('div');
  lbl.className = 'tune-label';
  lbl.innerHTML = `${label}<span class="tune-path">${path}</span>${_hintHtml(path)}`;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'tune-input';
  input.value = JSON.stringify(arr);
  input.inputMode = 'text';
  input.style.textAlign = 'left';
  input.style.fontSize = '11px';
  input.dataset.path = path;
  input.addEventListener('input', () => {
    try {
      const parsed = JSON.parse(input.value);
      if (!Array.isArray(parsed)) throw new Error('not array');
      setTune(path, parsed);
      input.classList.remove('invalid');
      row.classList.toggle('changed', isTuneChanged(path));
      input.classList.toggle('changed', isTuneChanged(path));
      scheduleTuneSave();
      updateTuneCounters();
    } catch (e) { input.classList.add('invalid'); }
  });
  input.addEventListener('blur', () => {
    const cur = getTune(path);
    if (Array.isArray(cur)) input.value = JSON.stringify(cur);
    input.classList.remove('invalid');
  });
  const resetBtn = document.createElement('button');
  resetBtn.className = 'tune-reset';
  resetBtn.textContent = '↺';
  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const def = getTuneDefault(path);
    setTune(path, JSON.parse(JSON.stringify(def)));
    input.value = JSON.stringify(def);
    row.classList.remove('changed');
    input.classList.remove('changed');
    scheduleTuneSave();
    updateTuneCounters();
  });
  row.classList.toggle('changed', isTuneChanged(path));
  input.classList.toggle('changed', isTuneChanged(path));
  row.appendChild(lbl); row.appendChild(input); row.appendChild(resetBtn);
  return row;
}

function updateTuneCounters() {
  let total = 0;
  TUNE_SECTIONS.forEach(sec => {
    let count = 0;
    function walk(obj, path) {
      for (const k in obj) {
        const childPath = path + '.' + k;
        const v = obj[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, childPath);
        else if (isTuneChanged(childPath)) { count++; total++; }
      }
    }
    const root = TUNE[sec.paths[0]];
    if (root) walk(root, sec.paths[0]);
    const el = document.querySelector(`[data-count="${sec.id}"]`);
    if (el) {
      el.textContent = count > 0 ? `${count} изм.` : '—';
      el.classList.toggle('changed', count > 0);
    }
  });
  const info = document.getElementById('tuneInfo');
  if (info) {
    info.textContent = total > 0
      ? `${total} изменений · сохранено в localStorage`
      : 'Все значения — дефолтные';
    info.classList.toggle('changed', total > 0);
  }
}

function scheduleTuneSave() {
  if (_tuneSaveTimer) clearTimeout(_tuneSaveTimer);
  _tuneSaveTimer = setTimeout(() => {
    saveTuningToStorage();
    _tuneSaveTimer = null;
  }, 400);
}

function rebuildTuningPanel() {
  _tunePanelBuilt = false;
  const content = document.getElementById('tuneContent');
  if (content) content.innerHTML = '';
  _tunePanelBuilt = true;
  buildTuningPanel();
  updateTuneCounters();
}

function initUI() {
  const $ = id => document.getElementById(id);

  A.onStep = (step, bar) => {
    if (!G.running) return;
    if (typeof cyanFireAt === 'function') cyanFireAt(step, bar);
  };

  if ($('playBtn')) $('playBtn').addEventListener('click', startGame);
  if ($('retryBtn')) $('retryBtn').addEventListener('click', startGame);
  if ($('deadMenuBtn')) $('deadMenuBtn').addEventListener('click', quitToMenuFromDeath);
  if ($('muteBtn')) $('muteBtn').addEventListener('click', toggleMute);
  if ($('pauseBtn')) $('pauseBtn').addEventListener('click', togglePause);
  if ($('resumeBtn')) $('resumeBtn').addEventListener('click', closePause);
  if ($('pauseClose')) $('pauseClose').addEventListener('click', closePause);
  if ($('quitBtn')) $('quitBtn').addEventListener('click', quitToMenu);
  if ($('devUnlockBtn')) $('devUnlockBtn').addEventListener('click', unlockDev);
  if ($('devReviveBtn')) $('devReviveBtn').addEventListener('click', devRevive);
  if ($('devPanelBtn')) $('devPanelBtn').addEventListener('click', openTuningPanel);
  if ($('tuneCloseBtn')) $('tuneCloseBtn').addEventListener('click', closeTuningPanel);

  if ($('shopBtn')) $('shopBtn').addEventListener('click', openShop);
  if ($('shopClose')) $('shopClose').addEventListener('click', closeShop);
  if ($('shopBackBtn')) $('shopBackBtn').addEventListener('click', closeShop);
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _shopTab = tab.dataset.shopTab;
      renderShop();
    });
  });

  if ($('tuneApplyBtn')) {
    $('tuneApplyBtn').addEventListener('click', () => {
      if (!G.running || !G.player) {
        showToastHTML('Игра не запущена — нечего обновлять', '#ffd060', 1800);
        return;
      }
      const before = { hp: G.player.hp, maxHp: G.player.maxHp, dmg: G.player.dmg };
      const after = applyTuneToGame();
      const dt = after.dmg / Math.max(1, before.dmg);
      showToastHTML(
        `✓ Применено\nHP ${Math.round(before.hp)}→${Math.round(after.hp)} / ${after.maxHp}\nDMG ×${dt.toFixed(2)}`,
        '#4dffb0', 2200
      );
    });
  }

  if ($('tuneBaseBtn')) {
    $('tuneBaseBtn').addEventListener('click', () => {
      if (!confirm('Принять текущие значения как БАЗОВЫЕ?')) return;
      setCurrentAsBase();
      rebuildTuningPanel();
      showToastHTML('📌 Зафиксировано как база', '#4dffb0', 2000);
    });
  }
  if ($('tuneResetAllBtn')) {
    $('tuneResetAllBtn').addEventListener('click', () => {
      if (!confirm('Сбросить все изменения к базовым?')) return;
      resetTuningAll();
      rebuildTuningPanel();
      showToastHTML('Сброшено к базовым', '#ffd060', 1400);
    });
  }
  if ($('tuneExportBtn')) {
    $('tuneExportBtn').addEventListener('click', () => {
      const n = downloadTuningFile();
      showToastHTML(n > 0 ? `Экспортировано ${n} изменений` : 'Нет изменений для экспорта',
        n > 0 ? '#7eff90' : '#ffd060', 2000);
    });
  }
  if ($('tuneImportBtn')) {
    $('tuneImportBtn').addEventListener('click', () => {
      const fi = $('tuneImportFile');
      if (fi) fi.click();
    });
  }
  if ($('tuneImportFile')) {
    $('tuneImportFile').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      loadTuningFromFile(f, (ok, count, err) => {
        if (ok) {
          rebuildTuningPanel();
          showToastHTML(`Импортировано ${count} изменений`, '#7eff90', 1800);
        } else {
          showToastHTML('Ошибка импорта: ' + (err || 'неверный формат'), '#ff3060', 2500);
        }
        e.target.value = '';
      });
    });
  }

  const clogBtn = $('changelogBtn');
  if (clogBtn) {
    clogBtn.addEventListener('click', () => {
      try { openChangelog(); } catch(e) {
        console.error('CHANGELOG error:', e);
        showToastHTML('Ошибка CHANGELOG\n' + e.message, '#ff3060', 3000);
      }
    });
  }
  const clogClose = $('changelogClose');
  if (clogClose) clogClose.addEventListener('click', closeChangelog);
  const clogBack = $('changelogBackBtn');
  if (clogBack) clogBack.addEventListener('click', closeChangelog);

  if ($('claimBtn')) {
    $('claimBtn').addEventListener('click', () => {
      const reward = autoClaimReward();
      if (reward > 0) showToastHTML('◆ +' + reward, '#ffd060', 1500);
    });
  }

  // трекер: отчёт забега
  if ($('pauseReportBtn')) {
    $('pauseReportBtn').addEventListener('click', openRunReport);
  }
  if ($('deadReportBtn')) {
    $('deadReportBtn').addEventListener('click', openRunReport);
  }
  if ($('runReportClose')) {
    $('runReportClose').addEventListener('click', closeRunReport);
  }
  if ($('runReportClose2')) {
    $('runReportClose2').addEventListener('click', closeRunReport);
  }
  if ($('runReportCopy')) {
    $('runReportCopy').addEventListener('click', () => {
      const ta = $('runReportText');
      if (!ta) return;
      ta.select();
      ta.setSelectionRange(0, 99999);
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      if (navigator.clipboard) navigator.clipboard.writeText(ta.value).catch(() => {});
      const btn = $('runReportCopy');
      btn.textContent = ok ? 'СКОПИРОВАНО' : 'ГОТОВО';
      setTimeout(() => { btn.textContent = 'КОПИРОВАТЬ'; }, 1500);
    });
  }

  if ($('spawnWaveBtn')) {
    $('spawnWaveBtn').addEventListener('click', () => {
      const p = G.player;
      if (!p) return;
      const S = TUNE.spawn;
      const baseN = S.baseCount + Math.floor(G.wave / S.countStep);
      const n = Math.ceil(baseN * 2);
      for (let i = 0; i < n; i++) spawnEnemy(pickSpawnType());
    });
  }

  if ($('devTugriksBtn')) {
    $('devTugriksBtn').addEventListener('click', () => {
      G.tugriks += 1000;
      saveTugriks(G.tugriks);
      updateMenuTugriks();
      showToastHTML('◆ +1000', '#ffd060', 1500);
    });
  }

  document.querySelectorAll('.pause-tab').forEach(tab => {
    tab.addEventListener('click', () => renderPausePane(tab.dataset.tab));
  });

  const zs = $('zoomSlider');
  if (zs) {
    zs.value = G.zoom;
    applyZoom(G.zoom);
    zs.addEventListener('input', e => applyZoom(parseFloat(e.target.value)));
  }
  const ss = $('speedSlider');
  if (ss) {
    ss.addEventListener('input', e => {
      G.gameSpeed = parseFloat(e.target.value);
      $('speedVal').textContent = '×' + G.gameSpeed.toFixed(1);
    });
  }
  console.log('✓ UI initialized');
}