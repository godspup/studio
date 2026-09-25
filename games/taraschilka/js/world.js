'use strict';

function getWaveType(w) {
  const pattern = TUNE.waves.pattern || 'LHHLHH';
  const idx = (w - 1) % pattern.length;
  return pattern.charAt(idx) === 'H' ? 'heavy' : 'light';
}
function isFinaleWave(w) { return w === TUNE.waves.finaleWave; }
function isPreFinaleWave(w) { return TUNE.waves.preFinaleWaves.indexOf(w) !== -1; }
function isBossWave(w) {
  return (w - TUNE.waves.bossFirstWave) % TUNE.waves.bossEveryN === 0
    && w >= TUNE.waves.bossFirstWave
    && w !== TUNE.waves.finaleWave;
}

// ═══════════════════════════════════════════════
// ARENA SHAPES
// ═══════════════════════════════════════════════
function getArenaVertices(shape, R) {
  if (shape === 'octagon') {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + i * TAU / 8;
      out.push({ x: Math.cos(a) * R, y: Math.sin(a) * R });
    }
    return out;
  }
  if (shape === 'hexagon') {
    const out = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 2 + i * TAU / 6;
      out.push({ x: Math.cos(a) * R, y: Math.sin(a) * R });
    }
    return out;
  }
  if (shape === 'cross') {
    const L = R;
    const W2 = R * (TUNE.arena.crossArmWidth || 0.35);
    return [
      { x: -W2, y: -L }, { x:  W2, y: -L },
      { x:  W2, y: -W2 }, { x:  L, y: -W2 },
      { x:  L, y:  W2 }, { x:  W2, y:  W2 },
      { x:  W2, y:  L }, { x: -W2, y:  L },
      { x: -W2, y:  W2 }, { x: -L, y:  W2 },
      { x: -L, y: -W2 }, { x: -W2, y: -W2 },
    ];
  }
  if (shape === 'star') {
    const inner = TUNE.arena.starInnerRatio || 0.5;
    const pts = 6;
    const out = [];
    for (let i = 0; i < pts * 2; i++) {
      const a = -Math.PI / 2 + i * TAU / (pts * 2);
      const rr = i % 2 === 0 ? R : R * inner;
      out.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
    }
    return out;
  }
  return null;
}

function isInsideArena(x, y) {
  const shape = G.arenaShape || 'circle';
  const R = ARENA_R;
  if (shape === 'circle') return x * x + y * y <= R * R;
  const verts = getArenaVertices(shape, R);
  if (!verts) return true;
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const xi = verts[i].x, yi = verts[i].y;
    const xj = verts[j].x, yj = verts[j].y;
    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function clampToArena(x, y, margin) {
  margin = margin || 0;
  if (G.arenaShape === 'circle') {
    const d = Math.hypot(x, y);
    const lim = ARENA_R - margin;
    if (d > lim) {
      const k = lim / d;
      return { x: x * k, y: y * k, hit: true };
    }
    return { x, y, hit: false };
  }
  if (!isInsideArena(x, y)) {
    const dirLen = Math.hypot(x, y) || 1;
    const nx = x / dirLen, ny = y / dirLen;
    let lo = 0, hi = dirLen;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (isInsideArena(nx * mid, ny * mid)) lo = mid;
      else hi = mid;
    }
    return { x: nx * lo, y: ny * lo, hit: true };
  }
  return { x, y, hit: false };
}

function _keepEnemyInside(e) {
  if (G.arenaShape === 'circle') {
    const d2 = e.x * e.x + e.y * e.y;
    const lim = ARENA_R - e.r * 0.5;
    if (d2 > lim * lim) {
      const d = Math.sqrt(d2) || 1;
      e.x = (e.x / d) * lim;
      e.y = (e.y / d) * lim;
      if (e.kbVx || e.kbVy) {
        const kx = e.x / (Math.hypot(e.x, e.y) || 1);
        const ky = e.y / (Math.hypot(e.x, e.y) || 1);
        const vdot = e.kbVx * kx + e.kbVy * ky;
        if (vdot > 0) { e.kbVx -= vdot * kx; e.kbVy -= vdot * ky; }
      }
    }
  } else {
    if (!isInsideArena(e.x, e.y)) {
      const c = clampToArena(e.x, e.y, e.r * 0.5);
      e.x = c.x; e.y = c.y;
    }
  }
}

// ---------- СПАВН ВРАГОВ ----------
function spawnEnemy(type, opts) {
  opts = opts || {};
  if (G.enemies.length >= LIMITS.enemies) return null;

  let x, y;
  if (opts.atEdge !== false) {
    let placed = false;
    for (let tries = 0; tries < 10; tries++) {
      const a = Math.random() * TAU;
      const r = ARENA_R * rand(0.55, 0.9);
      x = Math.cos(a) * r; y = Math.sin(a) * r;
      if (isInsideArena(x, y)) { placed = true; break; }
    }
    if (!placed) { x = 0; y = 0; }
  } else { x = opts.x; y = opts.y; }

  const hpScale  = 1 + (G.wave - 1) * TUNE.enemies.hpScalePerWave;
  const dmgScale = 1 + (G.wave - 1) * TUNE.enemies.dmgScalePerWave;
  const waveType = getWaveType(G.wave);
  const spdMult  = waveType === 'heavy' ? TUNE.waves.heavySpeedMul : TUNE.waves.lightSpeedMul;
  let e;

  if (type === 'grunt') {
    const c = TUNE.enemies.grunt;
    e = { x, y, type, r: c.radius * DPR, hp: c.hp * hpScale, maxHp: c.hp * hpScale,
          speed: c.speed * DPR * spdMult, color: '#ff3d6e', dmg: c.dmg * dmgScale, xp: c.xp, _cfg: c };
  } else if (type === 'fast') {
    const c = TUNE.enemies.fast;
    e = { x, y, type, r: c.radius * DPR, hp: c.hp * hpScale, maxHp: c.hp * hpScale,
          speed: c.speed * DPR * spdMult, color: '#ffb030', dmg: c.dmg * dmgScale, xp: c.xp, _cfg: c };
  } else if (type === 'tank') {
    const c = TUNE.enemies.tank;
    e = { x, y, type, r: c.radius * DPR, hp: c.hp * hpScale, maxHp: c.hp * hpScale,
          speed: c.speed * DPR * spdMult, color: '#a840ff', dmg: c.dmg * dmgScale, xp: c.xp, _cfg: c };
  } else if (type === 'shooter') {
    const c = TUNE.enemies.shooter;
    e = { x, y, type, r: c.radius * DPR, hp: c.hp * hpScale, maxHp: c.hp * hpScale,
          speed: c.speed * DPR * spdMult, color: '#4dffb0', dmg: c.dmg * dmgScale, xp: c.xp,
          shootCd: rand(c.shootCdMin, c.shootCdMax), keepDist: c.keepDist * DPR, _cfg: c };
  } else if (type === 'elite') {
    const c = TUNE.enemies.elite;
    e = { x, y, type, isElite: true, r: c.radius * DPR, hp: c.hp * hpScale, maxHp: c.hp * hpScale,
          speed: c.speed * DPR * spdMult, color: '#ffd060', dmg: c.dmg * dmgScale, xp: c.xp, _cfg: c };
  } else if (type === 'boss_hydra') {
    const c = TUNE.bosses.boss_hydra;
    e = { x, y, type, isBoss: true, r: c.radius * DPR, hp: c.hp, maxHp: c.hp,
          speed: c.speed * DPR * spdMult, color: '#ff3080', dmg: c.dmg, xp: c.xp,
          bossPhase: 0, bossTimer: 0, shootCd: c.shootCd, _cfg: c };
  } else if (type === 'boss_spiral') {
    const c = TUNE.bosses.boss_spiral;
    e = { x, y, type, isBoss: true, r: c.radius * DPR, hp: c.hp, maxHp: c.hp,
          speed: c.speed * DPR * spdMult, color: '#4da0ff', dmg: c.dmg, xp: c.xp,
          bossPhase: 0, spiralAngle: 0, shootCd: 0, _cfg: c };
  } else if (type === 'boss_slasher') {
    const c = TUNE.bosses.boss_slasher;
    e = { x, y, type, isBoss: true, r: c.radius * DPR, hp: c.hp, maxHp: c.hp,
          speed: c.speed * DPR * spdMult, color: '#ff8020', dmg: c.dmg, xp: c.xp,
          bossPhase: 0, phase: 'idle', phaseT: rand(0.8, 1.4),
          dashVX: 0, dashVY: 0, aimX: 0, aimY: 0, dashHit: false, _cfg: c };
  }

  if (!e) return null;
  e.hitT = 0;
  e._lastOrbHit = -999;
  e._cyanLeadAt = -999;
  e._cyanBassAt = -999;
  e.kbVx = 0;
  e.kbVy = 0;
  e.rotOffset = 0;
  e._dead = false;
  _keepEnemyInside(e);
  G.enemies.push(e);
  return e;
}

function pickSpawnType() {
  const w = G.wave, r = Math.random();
  if (w <= 1) return r < 0.85 ? 'grunt' : 'fast';
  if (w <= 3) return r < 0.55 ? 'grunt' : r < 0.85 ? 'fast' : 'tank';
  if (w <= 6) return r < 0.42 ? 'grunt' : r < 0.7 ? 'fast' : r < 0.86 ? 'tank' : 'shooter';
  return r < 0.35 ? 'grunt' : r < 0.6 ? 'fast' : r < 0.78 ? 'tank' : 'shooter';
}

function spawnBoss() {
  const bosses = ['boss_hydra', 'boss_spiral', 'boss_slasher'];
  const pick = bosses[(Math.floor(G.wave / 12) - 1) % 3] || bosses[0];
  const b = spawnEnemy(pick);
  if (b) {
    G.bossActive = true;
    const angle = Math.random() * TAU;
    b.x = Math.cos(angle) * ARENA_R * 0.7;
    b.y = Math.sin(angle) * ARENA_R * 0.7;
    _keepEnemyInside(b);
  }
}

function spawnFinale() {
  G.bossActive = true;
  const list = ['boss_hydra', 'boss_spiral', 'boss_slasher'];
  for (let i = 0; i < list.length; i++) {
    const b = spawnEnemy(list[i]);
    if (!b) continue;
    const angle = (i / list.length) * TAU - Math.PI / 2;
    b.x = Math.cos(angle) * ARENA_R * 0.6;
    b.y = Math.sin(angle) * ARENA_R * 0.6;
    _keepEnemyInside(b);
  }
}

function addParticles(x, y, n, color, speed, life) {
  const room = LIMITS.particles - G.particles.length;
  if (room <= 0) return;
  const cnt = Math.min(n, room);
  for (let i = 0; i < cnt; i++) {
    const a = Math.random() * TAU, s = rand(speed * 0.4, speed);
    G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: rand(life * 0.6, life), maxLife: life, color, size: rand(1.5, 3.5) * DPR });
  }
}
function addRipple(x, y, color, maxR, life) { G.ripples.push({ x, y, r: 0, maxR, life, maxLife: life, color }); }
function shake(mag, dur) { if (mag > G.shakeMag) { G.shakeMag = mag; G.shakeT = dur; } }
function flash(a) { G.flashT = Math.max(G.flashT, a); }
function addToast(text, color, dur) { dur = dur || 1.8; G.toasts.push({ text, color, life: dur, maxLife: dur }); }

function recordRunSnapshot() {
  const p = G.player;
  if (!p) return;
  const dps = p.dmg * p.projCount * p.fireRate * (1 + p.crit * (p.critMult - 1));
  G.runLog.push({
    t: Math.floor(G.time),
    w: G.wave,
    hp: Math.round(p.hp),
    mhp: p.maxHp,
    dmg: Math.round(p.dmg),
    fr: p.fireRate,
    dps: Math.round(dps),
    en: G.enemies.length,
    k: G.kills,
    lvl: p.level,
    xp: Math.round(p.xp),
    xpn: p.xpNeed,
    cb: G.comboCount,
    r: G.rating,
    orb: G.xporbs.length,
    haste: p.hasteT > 0,
    shield: p.shieldT > 0,
    rage: p.rageT > 0,
    dd: Math.round(G._track.dd),
    dt: Math.round(G._track.dt),
    hit: G._track.hits,
    sh: G._track.shots,
    ovk: Math.round(G._track.ovk),
  });
  G._track = _blankTrack();
  if (G.runLog.length > 2500) {
    const thin = [];
    for (let i = 0; i < G.runLog.length; i += 2) thin.push(G.runLog[i]);
    G.runLog = thin;
  }
}

// ═══════════════════════════════════════════════
// CYAN — Tesla coil
// Молнии бьют в РАЗНЫХ врагов. У каждого врага кулдаун
// по типу молнии (лид / бас), чтобы цель не дёргалась
// между соседними мобами каждые 125мс.
// Босс — без кулдауна, всё летит в него.
// ═══════════════════════════════════════════════
function spawnCyanBolt(p, target, col0, col1, widthMul, bass, idx, total) {
  let offX = 0, offY = 0;
  if (total > 1) {
    const ang = -Math.PI / 2 + (idx / total) * TAU;
    const rad = 22 * DPR;
    offX = Math.cos(ang) * rad;
    offY = Math.sin(ang) * rad;
  }
  G.cyanBolts.push({
    x1: p.x, y1: p.y,
    x2: target.x + offX, y2: target.y + offY,
    targetRef: target,
    targetOffX: offX, targetOffY: offY,
    life: bass ? 0.35 : 0.28,
    maxLife: bass ? 0.35 : 0.28,
    col0, col1, widthMul, bass,
    segs: null, lastGen: -1,
  });
}

// Поиск цели с учётом кулдауна и used Set
function findCyanTarget(x, y, maxDist, used, cdKey, now, cd) {
  let best = null, bestD2 = maxDist * maxDist;
  for (const e of G.enemies) {
    if (used && used.has(e)) continue;
    if (e._dead || e.hp <= 0) continue;
    if (now - (e[cdKey] || -999) < cd) continue;
    const d2 = dist2(x, y, e.x, e.y);
    if (d2 < bestD2) { bestD2 = d2; best = e; }
  }
  return best;
}

function spawnCyanChainBolt(p, source, target, col0, col1, widthMul) {
  G.cyanBolts.push({
    x1: source.x, y1: source.y,
    x2: target.x, y2: target.y,
    sourceRef: source,
    targetRef: target,
    targetOffX: 0, targetOffY: 0,
    life: 0.22, maxLife: 0.22,
    col0, col1, widthMul: widthMul * 0.8, bass: false,
    segs: null, lastGen: -1,
  });
}

function applyCyanChain(p, sourceEnemy, baseDmg, col0, col1, widthMul, range, chainInfo, sharedUsed) {
  if (!chainInfo || chainInfo.bounces <= 0) return;
  let cur = sourceEnemy;
  for (let i = 0; i < chainInfo.bounces; i++) {
    const next = findCyanTarget(cur.x, cur.y, range, sharedUsed, '_cyanChainAt', G.time, 0);
    if (!next) break;
    sharedUsed.add(next);
    spawnCyanChainBolt(p, cur, next, col0, col1, widthMul);
    const chainDmg = getEnemyDamage(next, baseDmg * chainInfo.damageMul);
    damageEnemy(next, chainDmg, { silent: true, source: 'cyan_chain' });
    cur = next;
  }
}

function cyanFireAt(stepIdx, barIdx) {
  if (G.selectedSkin !== 'cyan') return;
  if (G.paused || G.paused2 || !G.running) return;
  const C = TUNE.skins.cyan;
  if (!C || !C.enabled) return;
  const p = G.player;
  if (!p) return;

  const MU = TUNE.upgrades.cyanMultishot;
  const mLv = p._lv.cyanMultishot || 0;
  const leadTargets = C.leadTargets + (MU.leadAdd[mLv] || 0);
  const bassTargets = C.bassTargets + (MU.bassAdd[mLv] || 0);

  const rangeMul = 1 + (TUNE.upgrades.cyanRange.factor - 1) * (p._lv.cyanRange || 0);
  const leadRangePx = C.leadRange * rangeMul * DPR;
  const cd = C.targetCooldown != null ? C.targetCooldown : 0.35;
  const now = G.time;
  const powerMul = Math.pow(TUNE.upgrades.cyanPower.factor, p._lv.cyanPower || 0);
  const leadDmg = p.dmg * 0.25 * powerMul;
  const bassDmg = p.dmg * 0.4 * powerMul;

  const chainLv = p._lv.cyanChain || 0;
  const CU = TUNE.upgrades.cyanChain;
  const chainInfo = (chainLv > 0 && CU.bounces[chainLv]) ? {
    bounces: CU.bounces[chainLv],
    damageMul: CU.damageTbl[chainLv] || 0,
  } : null;

  // Босс-приоритет
  const bossR = (TUNE.player.bossTargetRadius || 0) * DPR;
  let bossTarget = null;
  if (bossR > 0) {
    let bestD2 = bossR * bossR;
    for (const e of G.enemies) {
      if (!e.isBoss || e._dead || e.hp <= 0) continue;
      const d2 = dist2(p.x, p.y, e.x, e.y);
      if (d2 < bestD2) { bestD2 = d2; bossTarget = e; }
    }
  }

  const leadActive = C.leadPattern[stepIdx % C.leadPattern.length] === 1;
  const bassActive = C.bassPattern[stepIdx % C.bassPattern.length] === 1;
  const usedThisTick = new Set();

  // ─── ЛИД (синие молнии) ───
  if (leadActive) {
    if (bossTarget) {
      const n = Math.max(2, leadTargets);
      for (let k = 0; k < n; k++) {
        spawnCyanBolt(p, bossTarget, C.leadCol0, C.leadCol1, C.leadWidthMul, false, k, n);
        damageEnemy(bossTarget, getEnemyDamage(bossTarget, leadDmg), { silent: true, source: 'cyan_lead' });
      }
    } else {
      for (let k = 0; k < leadTargets; k++) {
        const t = findCyanTarget(p.x, p.y, leadRangePx, usedThisTick, '_cyanLeadAt', now, cd);
        if (!t) break;
        usedThisTick.add(t);
        t._cyanLeadAt = now;
        spawnCyanBolt(p, t, C.leadCol0, C.leadCol1, C.leadWidthMul, false, k, 1);
        damageEnemy(t, getEnemyDamage(t, leadDmg), { silent: true, source: 'cyan_lead' });
        if (chainInfo) {
          applyCyanChain(p, t, leadDmg, C.leadCol0, C.leadCol1, C.leadWidthMul, leadRangePx, chainInfo, usedThisTick);
        }
      }
    }
  }

  // ─── БАС (маджента-молнии) ───
  if (bassActive) {
    if (bossTarget) {
      const n = Math.max(2, bassTargets);
      for (let k = 0; k < n; k++) {
        spawnCyanBolt(p, bossTarget, C.bassCol0, C.bassCol1, C.bassWidthMul, true, k, n);
        damageEnemy(bossTarget, getEnemyDamage(bossTarget, bassDmg), { silent: true, source: 'cyan_bass' });
      }
    } else {
      const list = [];
      const bassRange = (leadRangePx * 2) ** 2;
      for (const e of G.enemies) {
        if (e._dead || e.hp <= 0) continue;
        if (usedThisTick.has(e)) continue;
        if (now - (e._cyanBassAt || -999) < cd) continue;
        const d2 = dist2(p.x, p.y, e.x, e.y);
        if (d2 < bassRange) list.push({ e, d2 });
      }
      list.sort((a, b) => a.d2 - b.d2);
      const n = Math.min(bassTargets, list.length);
      for (let k = 0; k < n; k++) {
        const t = list[k].e;
        t._cyanBassAt = now;
        usedThisTick.add(t);
        spawnCyanBolt(p, t, C.bassCol0, C.bassCol1, C.bassWidthMul, true, k, 1);
        damageEnemy(t, getEnemyDamage(t, bassDmg), { silent: true, source: 'cyan_bass' });
        if (chainInfo) {
          applyCyanChain(p, t, bassDmg, C.bassCol0, C.bassCol1, C.bassWidthMul, leadRangePx * 1.5, chainInfo, usedThisTick);
        }
      }
    }
  }
}

function updateCyanBolts(dt) {
  if (G.cyanBolts.length === 0) return;
  const p = G.player;
  if (!p) return;
  for (let i = G.cyanBolts.length - 1; i >= 0; i--) {
    const b = G.cyanBolts[i];
    b.life -= dt;
    if (b.life <= 0) { G.cyanBolts.splice(i, 1); continue; }

    if (b.sourceRef && !b.sourceRef._dead && b.sourceRef.hp > 0
        && G.enemies.indexOf(b.sourceRef) !== -1) {
      b.x1 = b.sourceRef.x;
      b.y1 = b.sourceRef.y;
    } else {
      b.x1 = p.x;
      b.y1 = p.y;
    }

    if (b.targetRef && !b.targetRef._dead && b.targetRef.hp > 0
        && G.enemies.indexOf(b.targetRef) !== -1) {
      b.x2 = b.targetRef.x + (b.targetOffX || 0);
      b.y2 = b.targetRef.y + (b.targetOffY || 0);
    }

    const age = b.maxLife - b.life;
    if (!b.segs || age - b.lastGen > 0.06) {
      b.segs = makeFractalBolt(b.x1, b.y1, b.x2, b.y2, 3, 15 * DPR);
      b.lastGen = age;
    }
  }
}

// ---------- БОЙ ----------
function findNearest(x, y, maxDist, ignoreSet) {
  let best = null, bestD2 = maxDist * maxDist;
  for (const e of G.enemies) {
    if (ignoreSet && ignoreSet.has(e)) continue;
    if (e._dead || e.hp <= 0) continue;
    const d2 = dist2(x, y, e.x, e.y);
    if (d2 < bestD2) { bestD2 = d2; best = e; }
  }
  return best;
}

function findTargetForPlayer(p) {
  const bossR = (TUNE.player.bossTargetRadius || 0) * DPR;
  if (bossR > 0) {
    let boss = null, bestD2 = bossR * bossR;
    for (const e of G.enemies) {
      if (!e.isBoss || e._dead || e.hp <= 0) continue;
      const d2 = dist2(p.x, p.y, e.x, e.y);
      if (d2 < bestD2) { bestD2 = d2; boss = e; }
    }
    if (boss) return boss;
  }
  return findNearest(p.x, p.y, p.range);
}

function playerShoot() {
  const p = G.player;
  const t = findTargetForPlayer(p);
  if (!t) return;
  const a0 = Math.atan2(t.y - p.y, t.x - p.x);
  p.aimAngle = a0;

  let pbBoost = 0;
  if (p.pointBlankLevel > 0) {
    const pb = TUNE.upgrades.pointblank;
    const rPx = pb.radiusTbl[p.pointBlankLevel] * DPR;
    const dx = t.x - p.x, dy = t.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < rPx) pbBoost = 1 - d / rPx;
  }

  const spread = 0.14;
  for (let i = 0; i < p.projCount; i++) {
    if (G.bullets.length >= LIMITS.bullets) break;
    G._track.shots++;
    const off = p.projCount === 1 ? 0 : (i - (p.projCount - 1) / 2) * spread;
    const a = a0 + off;
    G.bullets.push({
      x: p.x + Math.cos(a) * p.r, y: p.y + Math.sin(a) * p.r,
      vx: Math.cos(a) * p.projSpeed, vy: Math.sin(a) * p.projSpeed,
      r: 4 * DPR, dmg: p.dmg, pierce: p.pierce, ricochet: p.ricochet,
      hit: new Set(), life: 1.5, color: G.beatColor, alreadySplit: false, pbBoost,
    });
  }
  p.vx -= Math.cos(a0) * 40;
  p.vy -= Math.sin(a0) * 40;
}

function getEnemyDamage(e, baseDmg) {
  const p = G.player;
  let dmg = baseDmg;
  e._wasCrit = false;
  if (p.crit > 0 && Math.random() < p.crit) { dmg *= p.critMult; e._wasCrit = true; }
  if (p.pointBlankLevel > 0) {
    const pb = TUNE.upgrades.pointblank;
    const rPx = pb.radiusTbl[p.pointBlankLevel] * DPR;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < rPx) dmg *= (1 + pb.boostPerLevel * p.pointBlankLevel);
  }
  if (p.rageT > 0) dmg *= (TUNE.pickups.rageMult || 2);
  return dmg;
}

function damageEnemy(e, dmg, opts) {
  if (e._dead) return;
  const src = (opts && opts.source) || 'other';
  e.hp -= dmg;
  G._track.dd += dmg;
  G._total.dd += dmg;
  if (G._track.bySource[src] !== undefined) G._track.bySource[src] += dmg;
  if (G._total.bySource[src] !== undefined) G._total.bySource[src] += dmg;
  if (e.hp < 0) {
    const ovk = -e.hp;
    G._track.ovk += ovk;
    G._total.ovk += ovk;
  }
  if (!opts || !opts.silent) {
    e.hitT = Math.max(e.hitT, 0.08);
    addParticles(e.x, e.y, 3, e.color, 220 * DPR, 0.3);
    if (e._wasCrit) addParticles(e.x, e.y, 4, '#ffd060', 400 * DPR, 0.35);
  }
  if (e.hp <= 0) killEnemy(e);
}

function explode(x, y, radius, dmg) {
  for (const e of G.enemies) {
    if (e._dead) continue;
    if (dist2(x, y, e.x, e.y) < (radius + e.r) ** 2) damageEnemy(e, dmg, { source: 'explode' });
  }
  addRipple(x, y, '#ff8020', radius, 0.32);
  addParticles(x, y, 8, '#ff8020', 320 * DPR, 0.45);
  G.explosions.push({ x, y, r: 0, maxR: radius, life: 0.3, maxLife: 0.3 });
}

function spawnXpOrbs(x, y, totalXp) {
  const room = LIMITS.xporbs - G.xporbs.length;
  if (room <= 0 || totalXp <= 0) return;
  const MAX_VAL = 10;
  const chunks = [];
  let remaining = totalXp;
  while (remaining > 0 && chunks.length < room) {
    const take = Math.min(remaining, MAX_VAL);
    chunks.push(take);
    remaining -= take;
  }
  const n = chunks.length;
  for (let i = 0; i < n; i++) {
    const value = chunks[i];
    let r;
    if (value >= 10)      r = 9 * DPR;
    else if (value >= 7)  r = 7 * DPR;
    else if (value >= 4)  r = 5.5 * DPR;
    else if (value >= 2)  r = 4.5 * DPR;
    else                  r = 3.5 * DPR;
    let a, dist;
    if (n === 1) {
      a = Math.random() * TAU;
      dist = rand(2, 8) * DPR;
    } else {
      a = (i / n) * TAU + rand(-0.25, 0.25);
      dist = rand(12, 26) * DPR;
    }
    G.xporbs.push({
      x: x + Math.cos(a) * dist,
      y: y + Math.sin(a) * dist,
      vx: Math.cos(a) * 120, vy: Math.sin(a) * 120,
      r, value, life: 30,
    });
  }
}

function killEnemy(e) {
  if (e._dead) return;
  e._dead = true;
  G.kills++;
  const scoreMul = getRatingMultiplier();
  G.score += Math.round(e.xp * TUNE.economy.scorePerKillMul * scoreMul);
  G.comboCount++;
  G.comboTimer = 3.5;
  updateDMCRating();

  addParticles(e.x, e.y, 8, e.color, 380 * DPR, 0.55);
  addRipple(e.x, e.y, e.color, e.r * 4, 0.5);
  shake(3 * DPR, 0.08);

  spawnXpOrbs(e.x, e.y, e.xp);

  if (e.isBoss) {
    G.bossActive = G.enemies.some(x => x.isBoss && x !== e && !x._dead && x.hp > 0);
    flash(0.6);
    shake(15 * DPR, 0.6);
    addToast('BOSS DOWN', '#ffd060', 2.5);
  }
}

function damagePlayer(dmg) {
  const p = G.player;
  if (p.invulnT > 0) return;
  if (p.shieldT > 0) { addParticles(p.x, p.y, 8, '#4da0ff', 260 * DPR, 0.4); return; }
  p.hp -= dmg;
  G._track.dt += dmg;
  G._total.dt += dmg;
  p.invulnT = TUNE.player.invulnOnHit;
  shake(8 * DPR, 0.2);
  flash(0.35);
  addParticles(p.x, p.y, 12, '#ff3060', 320 * DPR, 0.5);
  A.intensity = Math.max(A.intensity, 0.9);
  G.comboCount = 0; G.comboTimer = 0;
  updateDMCRating();
  if (p.hp <= 0) { p.hp = 0; gameOver(); }
}

function damagePlayerRing(dmg) {
  const p = G.player;
  if (p.shieldT > 0) return;
  p.hp -= dmg;
  G._track.dt += dmg;
  G._total.dt += dmg;
  if (Math.random() < 0.15) flash(0.18);
  if (p.hp <= 0) { p.hp = 0; gameOver(); }
}

function spawnPickup() {
  const types = ['haste', 'shield', 'rage', 'slowmo'];
  const type = types[randi(0, types.length)];
  const a = Math.random() * TAU, r = rand(300, ARENA_R * 0.7);
  const x = Math.cos(a) * r, y = Math.sin(a) * r;
  const colors = { haste: '#7eff90', shield: '#4da0ff', rage: '#ff3060', slowmo: '#b16dff' };
  G.pickups.push({ x, y, r: 16 * DPR, type, color: colors[type],
                   life: TUNE.pickups.lifetime, angle: 0, pulse: 0 });
}

function activatePickup(pk) {
  const p = G.player;
  const K = TUNE.pickups;
  if (pk.type === 'haste') { p.hasteT = K.hasteDur; addToast('HASTE · ' + K.hasteDur + 's', '#7eff90'); }
  else if (pk.type === 'shield') { p.shieldT = K.shieldDur; addToast('SHIELD · ' + K.shieldDur + 's', '#4da0ff'); }
  else if (pk.type === 'rage') { p.rageT = K.rageDur; addToast('RAGE · ' + K.rageDur + 's', '#ff3060'); }
  else if (pk.type === 'slowmo') { G.slowmoT = K.slowmoDur; addToast('SLOW-MO · ' + K.slowmoDur + 's', '#b16dff'); }
  addParticles(pk.x, pk.y, 20, pk.color, 400 * DPR, 0.6);
  addRipple(pk.x, pk.y, pk.color, 100 * DPR, 0.5);
  flash(0.15); shake(6 * DPR, 0.15);
}

function getRatingMultiplier() { return TUNE.dmc.multipliers[G.rating] || 1; }

function updateDMCRating() {
  const c = G.comboCount;
  const T = TUNE.dmc.thresholds;
  let newRating;
  if (c >= T.S) newRating = 'S';
  else if (c >= T.A) newRating = 'A';
  else if (c >= T.B) newRating = 'B';
  else if (c >= T.C) newRating = 'C';
  else newRating = 'D';

  if (newRating !== G.rating) {
    const ORDER = { D: 0, C: 1, B: 2, A: 3, S: 4 };
    const upgraded = ORDER[newRating] > ORDER[G.rating];
    G.rating = newRating;
    const el = document.getElementById('dmcRating');
    if (el) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 200); }
    if (upgraded && G.running && G.player) {
      const col = { D: '#7a8aad', C: '#4da0ff', B: '#4dffb0', A: '#ffd060', S: '#ff3060' }[newRating];
      flash(0.2);
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * TAU;
        G.particles.push({ x: G.player.x, y: G.player.y,
          vx: Math.cos(a) * 400 * DPR, vy: Math.sin(a) * 400 * DPR,
          life: 0.8, maxLife: 0.8, color: col, size: 3.5 * DPR });
      }
      addRipple(G.player.x, G.player.y, col, 120 * DPR, 0.5);
    }
  }

  const el = document.getElementById('dmcRating');
  if (el) {
    const col = { D: '#7a8aad', C: '#4da0ff', B: '#4dffb0', A: '#ffd060', S: '#ff3060' }[G.rating];
    el.textContent = G.rating; el.style.color = col;
    el.classList.toggle('show', G.running && G.rating !== 'D');
  }

  const streakEl = document.getElementById('dmcCombo');
  if (streakEl) {
    streakEl.textContent = `STREAK ×${G.comboCount}`;
    streakEl.classList.toggle('show', G.running && G.comboCount > 5);
    const D = TUNE.dmc;
    const isVoid  = c >= D.streakVoidAt;
    const isBlaze = !isVoid && c >= D.streakBlazeAt;
    const isFire  = !isVoid && !isBlaze && c >= D.streakFireAt;
    streakEl.classList.toggle('void',  isVoid);
    streakEl.classList.toggle('blaze', isBlaze);
    streakEl.classList.toggle('fire',  isFire);
  }
}

let lastTime = 0;
let fpsFrames = 0, fpsTimer = 0;

function update(dt) {
  if (G.paused || G.paused2 || !G.running) {
    updateParticles(dt * 0.5);
    G.gridPulse *= 0.9;
    G.beatFlashT = Math.max(0, G.beatFlashT - dt * 3);
    return;
  }

  dt *= G.gameSpeed;
  G.time += dt; G.waveTimer += dt; G.pickupTimer += dt;

  const F = TUNE.waves;
  const inFinalePhase = G.wave >= F.finaleWave;
  if (inFinalePhase && G.bossActive) {
    G.arenaScale = Math.max(F.finaleMinScale, G.arenaScale - dt * F.finaleShrinkRate);
  } else if (!G.bossActive && G.arenaScale < 1) {
    G.arenaScale = Math.min(1, G.arenaScale + dt * F.finaleShrinkRate * 2);
  }
  ARENA_R = Math.min(W, H) * TUNE.arena.radiusMul * G.arenaScale;

  if (G.selectedSkin === 'cyan' && G.gridPulse > 0.96) {
    G.cyanBeatT = 1;
  } else {
    G.cyanBeatT = Math.max(0, G.cyanBeatT - dt * 4);
  }

  G.gridPulse *= 0.94;
  G.beatFlashT = Math.max(0, G.beatFlashT - dt * 4);

  const p = G.player;
  p.invulnT = Math.max(0, p.invulnT - dt);
  p.sandyGlitchT = Math.max(0, p.sandyGlitchT - dt);
  p.shieldT = Math.max(0, p.shieldT - dt);
  p.rageT = Math.max(0, p.rageT - dt);
  p.hasteT = Math.max(0, p.hasteT - dt);
  if (G.slowmoT > 0) G.slowmoT = Math.max(0, G.slowmoT - dt);
  if (p.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);

  updateCyanBolts(dt);

  const SG = TUNE.streakGlow;
  const D = TUNE.dmc;
  let targetGlow = 0;
  if (G.comboCount >= D.streakVoidAt)       targetGlow = SG.tierVoid;
  else if (G.comboCount >= D.streakBlazeAt) targetGlow = SG.tierBlaze;
  else if (G.comboCount >= D.streakFireAt)  targetGlow = SG.tierFire;
  G.streakGlowT += (targetGlow - G.streakGlowT) * Math.min(1, dt * SG.smoothSpeed);
  if (G.streakGlowT < 0.005) G.streakGlowT = 0;

  const waveType = getWaveType(G.wave);
  const targetIntensity = waveType === 'heavy' ? 1.0 : 0.7;
  A.intensity += (targetIntensity - A.intensity) * Math.min(1, dt * 0.4);

  if (G.comboTimer > 0) {
    G.comboTimer -= dt;
    if (G.comboTimer <= 0) { G.comboCount = 0; updateDMCRating(); }
  }

  let mx = 0, my = 0;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  if (joy.active) { mx += joy.dx; my += joy.dy; }
  const mlen = Math.hypot(mx, my);
  if (mlen > 1) { mx /= mlen; my /= mlen; }
  const hasteMul = TUNE.pickups.hasteMult || 1.5;
  const spd = p.speed * (p.hasteT > 0 ? hasteMul : 1);
  p.vx += mx * spd * dt * 10;
  p.vy += my * spd * dt * 10;
  const damp = Math.pow(0.0005, dt);
  p.vx *= damp; p.vy *= damp;
  p.x += p.vx * dt; p.y += p.vy * dt;

  const clamped = clampToArena(p.x, p.y, p.r + 4 * DPR);
  if (clamped.hit) {
    p.x = clamped.x;
    p.y = clamped.y;
    const inward = 1 - Math.hypot(p.vx, p.vy) * 0.001;
    p.vx *= 0.7 * inward;
    p.vy *= 0.7 * inward;
    damagePlayerRing(TUNE.arena.fireDps * dt);
    G.fireDamageTime += dt;
  } else {
    G.fireDamageTime = Math.max(0, G.fireDamageTime - dt);
  }

  if (G.selectedSkin === 'base') {
    p.fireCd -= dt;
    if (p.fireCd <= 0) { playerShoot(); p.fireCd = Math.max(0.05, 1 / p.fireRate); }
  }

  if (p.orbitals.length > 0) {
    const O = TUNE.upgrades.orbital;
    const hitDmg = O.hitDmg;
    const hitCd = O.hitCooldown;
    const now = G.time;
    const kbImpulse = O.knockback * DPR;

    for (const o of p.orbitals) {
      o.angle += o.speed * dt;
      o._x = p.x + Math.cos(o.angle) * o.radius;
      o._y = p.y + Math.sin(o.angle) * o.radius;
      const or = o.r;
      for (const e of G.enemies) {
        if (e._dead) continue;
        if (now - e._lastOrbHit < hitCd) continue;
        const dx = o._x - e.x, dy = o._y - e.y;
        const contactR = or + e.r;
        if (dx * dx + dy * dy < contactR * contactR) {
          e._lastOrbHit = now;
          e.hitT = Math.max(e.hitT, 0.1);
          e.hp -= hitDmg;
          G._track.dd += hitDmg;
          G._total.dd += hitDmg;
          G._track.bySource.orbital += hitDmg;
          G._total.bySource.orbital += hitDmg;
          if (e.hp < 0) {
            const ovk = -e.hp;
            G._track.ovk += ovk;
            G._total.ovk += ovk;
          }

          const kx = e.x - p.x, ky = e.y - p.y;
          const kd = Math.hypot(kx, ky) || 1;
          e.kbVx = (kx / kd) * kbImpulse;
          e.kbVy = (ky / kd) * kbImpulse;

          const tiltRad = (O.knockbackTiltDeg || 0) * Math.PI / 180;
          e.rotOffset = (Math.random() < 0.5 ? 1 : -1) * tiltRad;

          addParticles(e.x, e.y, 4, '#a0ffe0', 260 * DPR, 0.35);
          addRipple(o._x, o._y, '#a0ffe0', 26 * DPR, 0.28);
          if (e.hp <= 0) killEnemy(e);
        }
      }
    }
  }

  const S = TUNE.spawn;
  const isPreFinale = isPreFinaleWave(G.wave);
  const isFinale = isFinaleWave(G.wave);
  const postFinaleWithBoss = G.wave > F.finaleWave && G.bossActive;
  const skipSpawn = isFinale
    || (isPreFinale && G.enemies.length > 0)
    || postFinaleWithBoss;

  if (!skipSpawn) {
    const spawnMul = waveType === 'heavy' ? TUNE.waves.heavySpawnMul : TUNE.waves.lightSpawnMul;
    const baseInterval = Math.max(S.intervalMin, S.baseInterval - G.wave * S.intervalDecay);
    const spawnInterval = baseInterval / spawnMul;
    if (G.waveTimer > spawnInterval) {
      G.waveTimer = 0;
      const baseN = S.baseCount + Math.floor(G.wave / S.countStep);
      const n = Math.max(1, Math.round(baseN * spawnMul));
      for (let i = 0; i < n; i++) spawnEnemy(pickSpawnType());
    }
  }

  if (G.pickupTimer >= TUNE.pickups.spawnInterval) {
    G.pickupTimer = 0;
    if (G.pickups.length < TUNE.pickups.maxOnMap) spawnPickup();
  }
  for (let i = G.pickups.length - 1; i >= 0; i--) {
    const pk = G.pickups[i];
    pk.life -= dt; pk.angle += dt * 2;
    pk.pulse = Math.sin(pk.angle * 3) * 0.5 + 0.5;
    if (pk.life <= 0) { G.pickups.splice(i, 1); continue; }
    if (dist2(pk.x, pk.y, p.x, p.y) < (pk.r + p.r) ** 2) {
      activatePickup(pk); G.pickups.splice(i, 1);
    }
  }

  const waveDuration = TUNE.waves.duration;
  if (G.time > G.wave * waveDuration) {
    if (G._lastHealWave !== G.wave) {
      G._lastHealWave = G.wave;
      G.wave++;

      const heal = Math.floor(p.maxHp * TUNE.waves.healPercent);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      addParticles(p.x, p.y, 16, '#7eff90', 260 * DPR, 0.55);
      addRipple(p.x, p.y, '#7eff90', 90 * DPR, 0.55);
      addRipple(p.x, p.y, '#7eff90', 130 * DPR, 0.7);
      addRipple(p.x, p.y, '#7eff90', 170 * DPR, 0.85);
      flash(0.1);
      addToast('+' + heal + ' HP', '#7eff90');

      const nwType = getWaveType(G.wave);
      const isBoss = isBossWave(G.wave);
      const isFinaleW = isFinaleWave(G.wave);

      if (isBoss && !G.bossActive) spawnBoss();
      if (isFinaleW && G._lastFinaleWave !== G.wave) { G._lastFinaleWave = G.wave; spawnFinale(); }
      if (nwType === 'heavy' && !isBoss && !isFinaleW) {
        G._heavyCounter++;
        const eliteEveryN = TUNE.waves.eliteEveryNHeavy || 2;
        if (G._heavyCounter % eliteEveryN === 0) spawnEnemy('elite');
      }
      updateHUD();
    }
  }

  const slowFactor = G.slowmoT > 0 ? TUNE.pickups.slowmoFactor : 1;
  const O_cfg = TUNE.upgrades.orbital;
  const kbThreshold = 20;
  for (const e of G.enemies) {
    if (e._dead) continue;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d;

    const kbActive = Math.abs(e.kbVx) > kbThreshold || Math.abs(e.kbVy) > kbThreshold;
    if (kbActive) {
      e.x += e.kbVx * dt;
      e.y += e.kbVy * dt;
      const kdamp = Math.pow(O_cfg.knockbackDecay, dt);
      e.kbVx *= kdamp;
      e.kbVy *= kdamp;
    } else if (e.kbVx !== 0 || e.kbVy !== 0) {
      e.kbVx = 0; e.kbVy = 0;
    }

    if (e.rotOffset) {
      e.rotOffset *= Math.exp(-O_cfg.knockbackTiltDecay * dt);
      if (Math.abs(e.rotOffset) < 0.01) e.rotOffset = 0;
    }

    if (!kbActive) {
      if (e.type === 'shooter') {
        const target = e.keepDist;
        const dir = d > target ? 1 : d < target - 40 ? -1 : 0;
        e.x += nx * e.speed * dir * dt * slowFactor;
        e.y += ny * e.speed * dir * dt * slowFactor;
        e.shootCd -= dt;
        if (e.shootCd <= 0 && d < e._cfg.bulletRange) {
          e.shootCd = rand(e._cfg.shootCdMin, e._cfg.shootCdMax);
          if (G.ebullets.length < LIMITS.ebullets) {
            const a = Math.atan2(dy, dx);
            G.ebullets.push({ x: e.x, y: e.y,
              vx: Math.cos(a) * e._cfg.bulletSpeed * DPR,
              vy: Math.sin(a) * e._cfg.bulletSpeed * DPR,
              r: 6 * DPR, dmg: e._cfg.bulletDmg, life: 3 });
          }
        }
      } else if (e.type === 'boss_hydra') {
        e.bossTimer += dt;
        e.x += nx * e.speed * dt * slowFactor;
        e.y += ny * e.speed * dt * slowFactor;
        e.shootCd -= dt;
        if (e.shootCd <= 0) {
          e.shootCd = e._cfg.shootCd;
          const heads = e._cfg.heads;
          for (let i = 0; i < heads; i++) {
            const headAngle = i * TAU / heads + G.time * 0.8;
            const hx = e.x + Math.cos(headAngle) * e.r * 1.35;
            const hy = e.y + Math.sin(headAngle) * e.r * 1.35;
            const aimA = Math.atan2(p.y - hy, p.x - hx);
            G.ebullets.push({ x: hx, y: hy,
              vx: Math.cos(aimA) * e._cfg.bulletSpeed * DPR,
              vy: Math.sin(aimA) * e._cfg.bulletSpeed * DPR,
              r: 7 * DPR, dmg: e._cfg.bulletDmg, life: 4 });
          }
        }
      } else if (e.type === 'boss_spiral') {
        e.spiralAngle += dt * 2.2;
        e.x += nx * e.speed * dt * 0.3 * slowFactor;
        e.y += ny * e.speed * dt * 0.3 * slowFactor;
        e.shootCd -= dt;
        if (e.shootCd <= 0) {
          e.shootCd = e._cfg.spiralRate;
          const a = e.spiralAngle;
          G.ebullets.push({ x: e.x, y: e.y,
            vx: Math.cos(a) * e._cfg.bulletSpeed * DPR,
            vy: Math.sin(a) * e._cfg.bulletSpeed * DPR,
            r: 6 * DPR, dmg: e._cfg.bulletDmg, life: 3 });
          G.ebullets.push({ x: e.x, y: e.y,
            vx: Math.cos(a + Math.PI) * e._cfg.bulletSpeed * DPR,
            vy: Math.sin(a + Math.PI) * e._cfg.bulletSpeed * DPR,
            r: 6 * DPR, dmg: e._cfg.bulletDmg, life: 3 });
        }
      } else if (e.type === 'boss_slasher') {
        if (e.phase === undefined) {
          e.phase = 'idle'; e.phaseT = rand(0.8, 1.4);
          e.aimX = 0; e.aimY = 0; e.dashHit = false;
        }
        const C = e._cfg;
        e.phaseT -= dt;
        if (e.phase === 'idle') {
          e.x += nx * e.speed * 0.35 * dt * slowFactor;
          e.y += ny * e.speed * 0.35 * dt * slowFactor;
          if (e.phaseT <= 0 && d < 700 * DPR) {
            e.phase = 'windup'; e.phaseT = C.windupDur;
            e.aimX = p.x; e.aimY = p.y;
            const ddx = e.aimX - e.x, ddy = e.aimY - e.y;
            const dd = Math.hypot(ddx, ddy) || 1;
            e.dashVX = (ddx / dd) * C.dashSpeed * DPR;
            e.dashVY = (ddy / dd) * C.dashSpeed * DPR;
            e.dashHit = false;
          }
        } else if (e.phase === 'windup') {
          if (e.phaseT <= 0) { e.phase = 'dash'; e.phaseT = C.dashDur; }
        } else if (e.phase === 'dash') {
          e.x += e.dashVX * dt; e.y += e.dashVY * dt;
          if (!e.dashHit && dist2(e.x, e.y, p.x, p.y) < (e.r + p.r) ** 2) {
            e.dashHit = true;
            damagePlayer(e.dmg);
            const kx = p.x - e.x, ky = p.y - e.y;
            const kd = Math.hypot(kx, ky) || 1;
            p.vx += (kx / kd) * 500 * DPR;
            p.vy += (ky / kd) * 500 * DPR;
          }
          if (e.phaseT <= 0) { e.phase = 'stuck'; e.phaseT = C.stuckDur; }
        } else if (e.phase === 'stuck') {
          if (e.phaseT <= 0) { e.phase = 'recover'; e.phaseT = C.recoverDur; }
        } else if (e.phase === 'recover') {
          const bx = e.x - p.x, by = e.y - p.y;
          const bd = Math.hypot(bx, by) || 1;
          e.x += (bx / bd) * 400 * DPR * dt;
          e.y += (by / bd) * 400 * DPR * dt;
          if (e.phaseT <= 0) { e.phase = 'idle'; e.phaseT = rand(0.8, 1.4); }
        }
      } else {
        e.x += nx * e.speed * dt * slowFactor;
        e.y += ny * e.speed * dt * slowFactor;
      }
    }

    _keepEnemyInside(e);

    if (e.hitT) e.hitT = Math.max(0, e.hitT - dt);
    if (dist2(e.x, e.y, p.x, p.y) < (e.r + p.r) ** 2) {
      if (e.type !== 'boss_slasher' && e.dmg > 0) damagePlayer(e.dmg);
      if (e.type !== 'boss_slasher') { e.x -= nx * 30; e.y -= ny * 30; }
    }
  }

  for (let i = G.bullets.length - 1; i >= 0; i--) {
    const b = G.bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) { G.bullets.splice(i, 1); continue; }
    let removed = false;
    for (const e of G.enemies) {
      if (e._dead) continue;
      if (b.hit.has(e)) continue;
      if (dist2(b.x, b.y, e.x, e.y) < (e.r + b.r) ** 2) {
        G._track.hits++;
        const finalDmg = getEnemyDamage(e, b.dmg);
        damageEnemy(e, finalDmg, { source: 'bullet' });
        if (p.explosiveLevel > 0) explode(b.x, b.y, p.explosiveRadius, p.explosiveDmg);
        b.hit.add(e);
        if (b.pierce > 0 && b.ricochet > 0 && !b.alreadySplit && G.bullets.length < LIMITS.bullets - 2) {
          const a0 = Math.atan2(b.vy, b.vx);
          const speed = Math.hypot(b.vx, b.vy);
          G.bullets.push({ x: b.x, y: b.y,
            vx: Math.cos(a0) * speed, vy: Math.sin(a0) * speed,
            r: b.r * 0.85, dmg: b.dmg * 0.5,
            pierce: b.pierce - 1, ricochet: 0,
            hit: new Set(b.hit), life: b.life, color: b.color, alreadySplit: true,
            pbBoost: b.pbBoost || 0 });
          const t2 = findNearest(b.x, b.y, p.range, b.hit);
          let a2 = a0 + Math.PI * 0.7;
          if (t2) a2 = Math.atan2(t2.y - b.y, t2.x - b.x);
          G.bullets.push({ x: b.x, y: b.y,
            vx: Math.cos(a2) * speed, vy: Math.sin(a2) * speed,
            r: b.r * 0.85, dmg: b.dmg * 0.5,
            pierce: 0, ricochet: b.ricochet - 1,
            hit: new Set(b.hit), life: b.life, color: b.color, alreadySplit: true,
            pbBoost: b.pbBoost || 0 });
          G.bullets.splice(i, 1);
          removed = true;
          break;
        }
        if (b.pierce > 0) b.pierce--;
        else if (b.ricochet > 0) {
          const t2 = findNearest(b.x, b.y, p.range, b.hit);
          if (t2) {
            const a2 = Math.atan2(t2.y - b.y, t2.x - b.x);
            const speed = Math.hypot(b.vx, b.vy);
            b.vx = Math.cos(a2) * speed;
            b.vy = Math.sin(a2) * speed;
            b.ricochet--;
          } else { G.bullets.splice(i, 1); removed = true; }
        } else { G.bullets.splice(i, 1); removed = true; }
        break;
      }
    }
    if (removed) continue;
  }

  for (let i = G.ebullets.length - 1; i >= 0; i--) {
    const b = G.ebullets[i];
    b.x += b.vx * dt * slowFactor;
    b.y += b.vy * dt * slowFactor;
    b.life -= dt;
    if (b.life <= 0) { G.ebullets.splice(i, 1); continue; }

    if (dist2(b.x, b.y, p.x, p.y) < (b.r + p.r) ** 2) {
      if (p.sandyGlitchT > 0.01) continue;
      if (p.invulnT > 0.01) continue;

      if (p.dodgeLevel > 0 && p.shieldT <= 0) {
        p.dodgeCounter++;
        const threshold = TUNE.upgrades.sandy.thresholds[p.dodgeLevel];
        if (p.dodgeCounter >= threshold) {
          p.dodgeCounter = 0;
          p.sandyGlitchT = 0.35;
          p.invulnT = Math.max(p.invulnT, 0.4);
          addParticles(p.x, p.y, 10, '#ff00a0', 240 * DPR, 0.4);
          addParticles(p.x, p.y, 10, '#00ffff', 240 * DPR, 0.4);
          shake(4 * DPR, 0.1);
          addToast('SANDY', '#ff00a0', 0.7);
          continue;
        }
      }
      damagePlayer(b.dmg);
      G.ebullets.splice(i, 1);
    }
  }

  const magnetR = p.xpMagnet;
  for (let i = G.xporbs.length - 1; i >= 0; i--) {
    const o = G.xporbs[i];
    o.life -= dt;
    if (o.life <= 0) { G.xporbs.splice(i, 1); continue; }
    const dx = p.x - o.x, dy = p.y - o.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < magnetR) {
      const pull = (1 - d / magnetR) * 800 * DPR * p.xpPullSpeed;
      o.vx += (dx / d) * pull * dt;
      o.vy += (dy / d) * pull * dt;
    }
    o.vx *= Math.pow(0.02, dt);
    o.vy *= Math.pow(0.02, dt);
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (d < p.r + o.r + 4) {
      p.xp += o.value * p.xpBonus;
      G.score += TUNE.economy.scorePerOrb;
      G.xporbs.splice(i, 1);
      while (p.xp >= p.xpNeed) {
        p.xp -= p.xpNeed;
        p.level++;
        p.xpNeed = Math.floor(p.xpNeed * TUNE.xpCurve.growth + TUNE.xpCurve.add);
        pendingLevelUp++;
      }
      if (pendingLevelUp > 0 && !G.paused2) openUpgrade();
    }
  }

  for (let i = G.enemies.length - 1; i >= 0; i--) {
    if (G.enemies[i].hp <= 0 || G.enemies[i]._dead) {
      if (G.enemies[i].isBoss) G.bossActive = G.enemies.some(x => x.isBoss && x !== G.enemies[i] && !x._dead && x.hp > 0);
      G.enemies.splice(i, 1);
    }
  }

  updateParticles(dt);
  updateHUD();
  updateDMCRating();

  if (G.comboCount > (G._peakCombo || 0)) G._peakCombo = G.comboCount;

  G._logAccum = (G._logAccum || 0) + dt;
  if (G._logAccum >= 1.0) {
    G._logAccum = 0;
    recordRunSnapshot();
  }

  if (G.shakeT > 0) { G.shakeT -= dt; if (G.shakeT <= 0) G.shakeMag = 0; }
  if (G.flashT > 0) G.flashT = Math.max(0, G.flashT - dt * 3);
}

function updateParticles(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= Math.pow(0.05, dt);
    p.vy *= Math.pow(0.05, dt);
    p.life -= dt;
    if (p.life <= 0) G.particles.splice(i, 1);
  }
  for (let i = G.ripples.length - 1; i >= 0; i--) {
    const r = G.ripples[i];
    r.life -= dt;
    r.r = r.maxR * (1 - r.life / r.maxLife);
    if (r.life <= 0) G.ripples.splice(i, 1);
  }
  for (let i = G.explosions.length - 1; i >= 0; i--) {
    const e = G.explosions[i];
    e.life -= dt;
    e.r = e.maxR * (1 - e.life / e.maxLife);
    if (e.life <= 0) G.explosions.splice(i, 1);
  }
  for (let i = G.toasts.length - 1; i >= 0; i--) {
    const t = G.toasts[i];
    t.life -= dt;
    if (t.life <= 0) G.toasts.splice(i, 1);
  }
}