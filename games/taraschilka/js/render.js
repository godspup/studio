'use strict';

function getEffectiveZoom() {
  const SG = TUNE.streakGlow;
  return G.zoom * (1 + G.streakGlowT * SG.zoomBonus);
}

function getStreakColor() {
  const c = G.comboCount;
  const D = TUNE.dmc;
  if (c >= D.streakVoidAt)  return STREAK_COLORS.void;
  if (c >= D.streakBlazeAt) return STREAK_COLORS.blaze;
  if (c >= D.streakFireAt)  return STREAK_COLORS.fire;
  return '#7a8aad';
}

function hexToRgbStr(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r + ',' + g + ',' + b;
}

function _useBlur() {
  return TUNE.performance.allowBlur && !G.lowFX;
}

const ORB_TIERS = [
  { minVal: 10, color: '#ffffff' },
  { minVal: 7,  color: '#ffd060' },
  { minVal: 4,  color: '#ff80d0' },
  { minVal: 2,  color: '#b16dff' },
  { minVal: 1,  color: '#6a30b0' },
];

function getOrbTier(value) {
  for (const t of ORB_TIERS) if (value >= t.minVal) return t;
  return ORB_TIERS[ORB_TIERS.length - 1];
}

function pathArena(cx, cy) {
  const shape = G.arenaShape || 'circle';
  const R = ARENA_R;
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    return;
  }
  const verts = getArenaVertices(shape, R);
  if (!verts) return;
  ctx.beginPath();
  for (let i = 0; i < verts.length; i++) {
    const x = cx + verts[i].x;
    const y = cy + verts[i].y;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawBgFixed() {
  ctx.fillStyle = '#05060a';
  ctx.fillRect(0, 0, W, H);
  const p = G.player; if (!p) return;

  const zoom = getEffectiveZoom();
  const pulse = 1 + G.gridPulse * 0.025;
  const cell = 80 * DPR * zoom * pulse;
  const originX = CX - p.x * zoom;
  const originY = CY - p.y * zoom;

  let startX = originX % cell; if (startX > 0) startX -= cell;
  let startY = originY % cell; if (startY > 0) startY -= cell;

  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(zoom, zoom);
  ctx.translate(-p.x, -p.y);

  ctx.beginPath();
  pathArena(0, 0);
  ctx.clip();

  if (!drawBgFixed._fillG || drawBgFixed._fillR !== ARENA_R) {
    const fillG = ctx.createRadialGradient(0, 0, 0, 0, 0, ARENA_R);
    fillG.addColorStop(0, 'rgba(20,10,40,0.35)');
    fillG.addColorStop(1, 'rgba(5,3,15,0.1)');
    drawBgFixed._fillG = fillG;
    drawBgFixed._fillR = ARENA_R;
  }
  ctx.fillStyle = drawBgFixed._fillG;
  ctx.fillRect(-ARENA_R * 2, -ARENA_R * 2, ARENA_R * 4, ARENA_R * 4);

  const worldCell = cell / zoom;
  const firstWorldX = (startX - originX) / zoom;
  const firstWorldY = (startY - originY) / zoom;
  const maxWorldX = (W - originX) / zoom + worldCell;
  const maxWorldY = (H - originY) / zoom + worldCell;

  ctx.globalAlpha = 0.14 + A.intensity * 0.14;
  ctx.strokeStyle = '#4a3a8a';
  ctx.lineWidth = 1 * DPR / zoom;
  ctx.beginPath();
  for (let wx = firstWorldX; wx <= maxWorldX; wx += worldCell) {
    ctx.moveTo(wx, -H * 2);
    ctx.lineTo(wx, H * 2);
  }
  for (let wy = firstWorldY; wy <= maxWorldY; wy += worldCell) {
    ctx.moveTo(-W * 2, wy);
    ctx.lineTo(W * 2, wy);
  }
  ctx.stroke();

  if (G.gridPulse > 0.02) {
    ctx.globalAlpha = G.gridPulse * 0.12;
    ctx.strokeStyle = G.beatColor;
    ctx.lineWidth = 1.2 * DPR / zoom;
    ctx.beginPath();
    for (let wx = firstWorldX; wx <= maxWorldX; wx += worldCell) {
      ctx.moveTo(wx, -H * 2);
      ctx.lineTo(wx, H * 2);
    }
    for (let wy = firstWorldY; wy <= maxWorldY; wy += worldCell) {
      ctx.moveTo(-W * 2, wy);
      ctx.lineTo(W * 2, wy);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawArenaRing() {
  const blur = _useBlur();
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.strokeStyle = 'rgba(20,5,5,0.9)';
  ctx.lineWidth = 60 * DPR;
  pathArena(0, 0);
  ctx.stroke();

  ctx.shadowBlur = blur ? 40 * DPR : 0; ctx.shadowColor = '#ff5010';
  ctx.strokeStyle = '#ff4010'; ctx.lineWidth = 10 * DPR;
  pathArena(0, 0);
  ctx.stroke();

  ctx.shadowBlur = blur ? 20 * DPR : 0; ctx.shadowColor = '#ffd060';
  ctx.strokeStyle = '#ffb030'; ctx.lineWidth = 4 * DPR;
  pathArena(0, 0);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffeaa0'; ctx.lineWidth = 1.5 * DPR;
  pathArena(0, 0);
  ctx.stroke();

  ctx.restore();
}

// Fractal bolt — прибитые концы, джиттер только в середине
function makeFractalBolt(x1, y1, x2, y2, depth, jitter) {
  const segs = [];
  const dx = x2 - x1, dy = y2 - y1;

  const headX = x1 + dx * 0.25, headY = y1 + dy * 0.25;
  const tailX = x1 + dx * 0.75, tailY = y1 + dy * 0.75;

  segs.push({ x1, y1, x2: headX, y2: headY, w: depth + 1 });
  segs.push({ x1: tailX, y1: tailY, x2, y2, w: depth + 1 });

  function split(ax, ay, bx, by, d, ampl) {
    if (d <= 0) {
      segs.push({ x1: ax, y1: ay, x2: bx, y2: by, w: 1 });
      return;
    }
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const ddx = bx - ax, ddy = by - ay;
    const len = Math.hypot(ddx, ddy) || 1;
    const nx = -ddy / len, ny = ddx / len;
    const amp = ampl * (Math.random() - 0.5) * 2;
    const px = mx + nx * amp;
    const py = my + ny * amp;
    segs.push({ x1: ax, y1: ay, x2: px, y2: py, w: d });
    segs.push({ x1: px, y1: py, x2: bx, y2: by, w: d });
    split(ax, ay, px, py, d - 1, ampl * 0.55);
    split(px, py, bx, by, d - 1, ampl * 0.55);
    if (d >= 3 && Math.random() < 0.15) {
      const ba = Math.random() * TAU;
      const bl = len * (0.15 + Math.random() * 0.2);
      split(px, py, px + Math.cos(ba) * bl, py + Math.sin(ba) * bl, d - 2, ampl * 0.3);
    }
  }
  split(headX, headY, tailX, tailY, depth, jitter);

  return segs;
}

function drawCyanBolts() {
  if (G.selectedSkin !== 'cyan') return;
  if (!TUNE.skins.cyan || !TUNE.skins.cyan.enabled) return;
  if (G.cyanBolts.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const b of G.cyanBolts) {
    const age = 1 - b.life / b.maxLife;
    const alpha = Math.max(0, 1 - age);
    if (alpha <= 0.02) continue;
    if (!b.segs || b.segs.length === 0) continue;

    const wMul = b.widthMul || 1;

    ctx.beginPath();
    for (const s of b.segs) {
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
    }

    ctx.globalAlpha = alpha;
    ctx.shadowColor = b.col0;
    ctx.shadowBlur = 12 * DPR;
    ctx.strokeStyle = b.col0;
    ctx.lineWidth = 2.5 * wMul * DPR;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = b.col1;
    ctx.lineWidth = Math.max(0.8, 0.7 * wMul * DPR);
    ctx.stroke();

    const fx = b.x2, fy = b.y2;
    const fr = (b.bass ? 10 : 7) * DPR * (1 + age * 0.5);

    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = b.col0;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fx, fy, fr * 0.55, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawPlayer() {
  const p = G.player; if (!p) return;
  const blur = _useBlur();
  ctx.save();

  const isCyan = G.selectedSkin === 'cyan';
  const col = isCyan ? '#4da0ff' : G.beatColor;

  let pulseMul;
  if (isCyan) {
    pulseMul = 1.4 + G.cyanBeatT * 0.5 + G.gridPulse * 0.2;
  } else {
    pulseMul = 1.4 + G.gridPulse * 0.35 + G.beatFlashT * 0.6;
  }
  const pulseR = p.r * pulseMul;

  const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseR * 4);
  grd.addColorStop(0, col + 'cc');
  grd.addColorStop(0.4, col + '55');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(p.x, p.y, pulseR * 4, 0, TAU); ctx.fill();

  if (p.pointBlankLevel > 0 && !isCyan) {
    const uu = TUNE.upgrades.pointblank;
    const rad = uu.radiusTbl[p.pointBlankLevel] * DPR;
    const t = G.time;
    const PB_COL = '#4da0ff';

    const edgeGlow = ctx.createRadialGradient(p.x, p.y, rad * 0.75, p.x, p.y, rad);
    edgeGlow.addColorStop(0, 'rgba(77, 160, 255, 0)');
    edgeGlow.addColorStop(0.75, `rgba(77, 160, 255, ${0.06 + 0.03 * Math.sin(t * 2.4)})`);
    edgeGlow.addColorStop(1, `rgba(77, 160, 255, ${0.14 + 0.06 * Math.sin(t * 2.4)})`);
    ctx.fillStyle = edgeGlow;
    ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, TAU); ctx.fill();

    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 2.6);
    ctx.strokeStyle = PB_COL;
    ctx.lineWidth = 1.6 * DPR;
    ctx.shadowBlur = blur ? 14 * DPR : 0;
    ctx.shadowColor = PB_COL;
    ctx.setLineDash([6 * DPR, 10 * DPR]);
    ctx.lineDashOffset = -t * 30 * DPR;
    ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  if (p.sandyGlitchT > 0.01) {
    const totalDur = 0.35;
    const progress = 1 - p.sandyGlitchT / totalDur;
    const eT = totalDur - p.sandyGlitchT;
    const blink = Math.sin(eT * 60) > 0 ? 1 : 0.15;
    const jitter = (Math.sin(eT * 90) + Math.sin(eT * 47)) * 3 * DPR;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (1 - progress) * 0.9;
    ctx.shadowColor = '#ff00a0';
    ctx.shadowBlur = blur ? 18 * DPR : 0;
    ctx.fillStyle = '#ff00a0';
    ctx.beginPath(); ctx.arc(p.x + jitter - 6 * DPR, p.y, p.r, 0, TAU); ctx.fill();
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.beginPath(); ctx.arc(p.x + jitter + 6 * DPR, p.y, p.r, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.globalAlpha = blink;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(p.x + jitter, p.y, p.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1.5 * DPR;
    ctx.beginPath(); ctx.arc(p.x + jitter, p.y, p.r + 2 * DPR, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  } else {
    ctx.shadowBlur = blur ? 20 * DPR : 0; ctx.shadowColor = col;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();

    ctx.shadowBlur = blur ? 12 * DPR : 0;
    ctx.strokeStyle = col; ctx.lineWidth = 2 * DPR;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5 * DPR, 0, TAU); ctx.stroke();
  }

  ctx.shadowBlur = 0;
  for (const o of p.orbitals) {
    if (o._x === undefined) continue;
    ctx.fillStyle = '#a0ffe0';
    ctx.beginPath(); ctx.arc(o._x, o._y, o.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2 * DPR;
    ctx.beginPath(); ctx.arc(o._x, o._y, o.r + 4 * DPR, 0, TAU); ctx.stroke();
  }

  if (p.invulnT > 0) {
    ctx.globalAlpha = Math.min(0.6, p.invulnT / 0.3);
    ctx.strokeStyle = '#ff3060'; ctx.lineWidth = 3 * DPR;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 12 * DPR, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (p.shieldT > 0) {
    const a = 0.4 + 0.3 * Math.sin(G.time * 10);
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#4da0ff'; ctx.lineWidth = 3 * DPR;
    ctx.shadowBlur = blur ? 20 * DPR : 0; ctx.shadowColor = '#4da0ff';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 20 * DPR, 0, TAU); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  if (p.rageT > 0) {
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(G.time * 12);
    ctx.strokeStyle = '#ff3060'; ctx.lineWidth = 3 * DPR;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 14 * DPR, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawEnemies() {
  const blur = _useBlur();
  ctx.save();
  for (const e of G.enemies) {
    const flash = e.hitT > 0;
    const isBoss = e.isBoss;
    const isElite = e.isElite;

    if (blur) {
      if (isBoss)        ctx.shadowBlur = 20 * DPR;
      else if (isElite)  ctx.shadowBlur = 14 * DPR;
      else               ctx.shadowBlur = 8 * DPR;
      ctx.shadowColor = e.color;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = flash ? '#ffffff' : e.color;

    const rot = Math.atan2(G.player.y - e.y, G.player.x - e.x) + (e.rotOffset || 0);

    if (e.type === 'grunt') {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill();
    } else if (e.type === 'fast') {
      ctx.beginPath();
      ctx.moveTo(e.x + Math.cos(rot) * e.r * 1.4, e.y + Math.sin(rot) * e.r * 1.4);
      ctx.lineTo(e.x + Math.cos(rot + 2.3) * e.r, e.y + Math.sin(rot + 2.3) * e.r);
      ctx.lineTo(e.x + Math.cos(rot - 2.3) * e.r, e.y + Math.sin(rot - 2.3) * e.r);
      ctx.closePath(); ctx.fill();
    } else if (e.type === 'tank') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6 + G.time;
        const px = e.x + Math.cos(a) * e.r, py = e.y + Math.sin(a) * e.r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(e.x - e.r, e.y - e.r - 8 * DPR, e.r * 2, 3 * DPR);
      ctx.fillStyle = '#a840ff';
      ctx.fillRect(e.x - e.r, e.y - e.r - 8 * DPR, e.r * 2 * (e.hp / e.maxHp), 3 * DPR);
    } else if (e.type === 'shooter') {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - e.r); ctx.lineTo(e.x + e.r, e.y);
      ctx.lineTo(e.x, e.y + e.r); ctx.lineTo(e.x - e.r, e.y);
      ctx.closePath(); ctx.fill();
    } else if (e.type === 'elite') {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = i * TAU / 10 + G.time * 0.5;
        const rr = i % 2 === 0 ? e.r : e.r * 0.55;
        const px = e.x + Math.cos(a) * rr, py = e.y + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.35, 0, TAU); ctx.fill();
    } else if (e.type === 'boss_hydra') {
      const t = G.time;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6 + t * 0.8;
        const hx = e.x + Math.cos(a) * e.r * 1.35;
        const hy = e.y + Math.sin(a) * e.r * 1.35;
        ctx.fillStyle = '#ff80c0';
        ctx.beginPath(); ctx.arc(hx, hy, e.r * 0.4, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.5, 0, TAU); ctx.fill();
    } else if (e.type === 'boss_spiral') {
      const t = G.time;
      ctx.beginPath();
      for (let i = 0; i < 36; i++) {
        const a = i * TAU / 36;
        const rr = e.r * (0.6 + 0.5 * Math.sin(a * 3 + t * 3));
        const px = e.x + Math.cos(a) * rr, py = e.y + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.3, 0, TAU); ctx.fill();
    } else if (e.type === 'boss_slasher') {
      ctx.beginPath();
      ctx.moveTo(e.x + Math.cos(rot) * e.r * 1.5, e.y + Math.sin(rot) * e.r * 1.5);
      ctx.lineTo(e.x + Math.cos(rot + 2.0) * e.r, e.y + Math.sin(rot + 2.0) * e.r);
      ctx.lineTo(e.x - Math.cos(rot) * e.r * 0.7, e.y - Math.sin(rot) * e.r * 0.7);
      ctx.lineTo(e.x + Math.cos(rot - 2.0) * e.r, e.y + Math.sin(rot - 2.0) * e.r);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.25, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

function drawBossHPBars() {
  const blur = _useBlur();
  let idx = 0;
  for (const e of G.enemies) {
    if (!e.isBoss) continue;
    const bw = 280 * DPR, bh = 12 * DPR;
    const bx = CX - bw / 2;
    const by = 90 * DPR + idx * 26 * DPR;
    idx++;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
    ctx.fillStyle = e.color;
    ctx.shadowBlur = blur ? 20 * DPR : 0; ctx.shadowColor = e.color;
    ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), bh);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * DPR;
    ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${13 * DPR}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowBlur = blur ? 8 * DPR : 0; ctx.shadowColor = e.color;
    ctx.fillText(e.type.replace('boss_', '').toUpperCase(), CX, by - 10 * DPR);
    ctx.restore();
  }
}

function drawToasts() {
  const blur = _useBlur();
  ctx.save();
  for (let i = 0; i < G.toasts.length; i++) {
    const t = G.toasts[i];
    const age = t.maxLife - t.life;
    const alpha = t.life > 0.5 ? 1 : t.life / 0.5;
    const y = H * 0.28 - age * 40 * DPR - i * 42 * DPR;
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${24 * DPR}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = blur ? 24 * DPR : 0;
    ctx.shadowColor = t.color;
    ctx.fillStyle = '#fff';
    ctx.fillText(t.text, CX, y);
    ctx.fillStyle = t.color;
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillText(t.text, CX, y);
  }
  ctx.restore();
}

function drawBullets() {
  const blur = _useBlur();
  ctx.save();

  const batches = new Map();
  const pbBullets = [];
  for (const b of G.bullets) {
    const pb = b.pbBoost || 0;
    if (pb > 0.05) {
      pbBullets.push(b);
    } else {
      const c = b.color || '#7ec9ff';
      if (!batches.has(c)) batches.set(c, []);
      batches.get(c).push(b);
    }
  }

  for (const [color, list] of batches) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const b of list) {
      ctx.moveTo(b.x + b.r * 1.6, b.y);
      ctx.arc(b.x, b.y, b.r * 1.6, 0, TAU);
    }
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (const b of list) {
      ctx.moveTo(b.x + b.r, b.y);
      ctx.arc(b.x, b.y, b.r, 0, TAU);
    }
    ctx.fill();
  }

  for (const b of pbBullets) {
    const pb = b.pbBoost || 0;
    const baseR = b.r + pb * 3.5 * DPR;
    const PB_COL = '#4da0ff';

    ctx.shadowColor = PB_COL;
    ctx.shadowBlur = blur ? (18 + pb * 16) * DPR : 0;
    ctx.fillStyle = PB_COL;
    ctx.globalAlpha = 0.28 + pb * 0.35;
    ctx.beginPath(); ctx.arc(b.x, b.y, baseR * 2.6, 0, TAU); ctx.fill();

    ctx.globalAlpha = 0.55 + pb * 0.4;
    ctx.beginPath(); ctx.arc(b.x, b.y, baseR * 1.7, 0, TAU); ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = blur ? (10 + pb * 10) * DPR : 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(b.x, b.y, baseR, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#4dffb0';
  ctx.beginPath();
  for (const b of G.ebullets) {
    ctx.moveTo(b.x + b.r, b.y);
    ctx.arc(b.x, b.y, b.r, 0, TAU);
  }
  ctx.fill();
  ctx.restore();
}

function drawXpOrbs() {
  ctx.save();
  const groups = new Map();
  for (const o of G.xporbs) {
    const tier = getOrbTier(o.value);
    if (!groups.has(tier.color)) groups.set(tier.color, { tier, list: [] });
    groups.get(tier.color).list.push(o);
  }
  for (const { tier, list } of groups.values()) {
    ctx.fillStyle = tier.color;
    ctx.beginPath();
    for (const o of list) {
      const alpha = o.life > 3 ? 1 : Math.max(0.2, o.life / 3);
      ctx.globalAlpha = 0.7 + alpha * 0.3;
      ctx.moveTo(o.x + o.r, o.y);
      ctx.arc(o.x, o.y, o.r, 0, TAU);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  const buckets = new Map();
  for (const p of G.particles) {
    const a = p.life / p.maxLife;
    const qa = Math.round(a * 10) / 10;
    if (qa <= 0) continue;
    const key = p.color + '|' + qa;
    if (!buckets.has(key)) buckets.set(key, { color: p.color, alpha: qa, list: [] });
    buckets.get(key).list.push(p);
  }
  for (const b of buckets.values()) {
    ctx.globalAlpha = b.alpha;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    for (const p of b.list) {
      const s = p.size * b.alpha;
      ctx.moveTo(p.x + s, p.y);
      ctx.arc(p.x, p.y, s, 0, TAU);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

let _explosionSprite = null;
function _getExplosionSprite() {
  if (_explosionSprite) return _explosionSprite;
  const SIZE = 128;
  const cv = document.createElement('canvas');
  cv.width = SIZE;
  cv.height = SIZE;
  const c2 = cv.getContext('2d');
  const grd = c2.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
  grd.addColorStop(0, 'rgba(255,220,120,0.9)');
  grd.addColorStop(0.5, 'rgba(255,120,30,0.6)');
  grd.addColorStop(1, 'rgba(255,80,20,0)');
  c2.fillStyle = grd;
  c2.fillRect(0, 0, SIZE, SIZE);
  _explosionSprite = cv;
  return cv;
}

function drawRipples() {
  ctx.save();
  for (const r of G.ripples) {
    const a = r.life / r.maxLife;
    ctx.globalAlpha = a * 0.7;
    ctx.strokeStyle = r.color; ctx.lineWidth = 2 * DPR;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
  }

  if (G.explosions.length > 0) {
    const spr = _getExplosionSprite();
    for (const e of G.explosions) {
      const a = e.life / e.maxLife;
      ctx.globalAlpha = a;
      ctx.drawImage(spr, e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
    }
  }
  ctx.restore();
}

function drawPickups() {
  const blur = _useBlur();
  ctx.save();
  for (const pk of G.pickups) {
    const scale = 1 + pk.pulse * 0.3;
    const alpha = pk.life > 3 ? 1 : pk.life / 3;
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = blur ? 22 * DPR : 0; ctx.shadowColor = pk.color;
    ctx.strokeStyle = pk.color; ctx.lineWidth = 2 * DPR;
    ctx.beginPath(); ctx.arc(pk.x, pk.y, pk.r * scale, 0, TAU); ctx.stroke();
    ctx.fillStyle = pk.color;
    ctx.globalAlpha = alpha * 0.22;
    ctx.beginPath(); ctx.arc(pk.x, pk.y, pk.r * scale, 0, TAU); ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pk.color;
    ctx.shadowBlur = blur ? 14 * DPR : 0;

    const ir = pk.r * 0.55, ix = pk.x, iy = pk.y;
    if (pk.type === 'haste') {
      ctx.beginPath();
      ctx.moveTo(ix + ir * 0.2, iy - ir);
      ctx.lineTo(ix - ir * 0.5, iy + ir * 0.1);
      ctx.lineTo(ix + ir * 0.05, iy + ir * 0.1);
      ctx.lineTo(ix - ir * 0.2, iy + ir);
      ctx.lineTo(ix + ir * 0.5, iy - ir * 0.1);
      ctx.lineTo(ix - ir * 0.05, iy - ir * 0.1);
      ctx.closePath(); ctx.fill();
    } else if (pk.type === 'shield') {
      ctx.beginPath();
      ctx.moveTo(ix, iy - ir);
      ctx.lineTo(ix + ir * 0.75, iy - ir * 0.5);
      ctx.lineTo(ix + ir * 0.75, iy + ir * 0.1);
      ctx.quadraticCurveTo(ix + ir * 0.6, iy + ir * 0.7, ix, iy + ir);
      ctx.quadraticCurveTo(ix - ir * 0.6, iy + ir * 0.7, ix - ir * 0.75, iy + ir * 0.1);
      ctx.lineTo(ix - ir * 0.75, iy - ir * 0.5);
      ctx.closePath(); ctx.fill();
    } else if (pk.type === 'rage') {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 - Math.PI / 2;
        const rr = i % 2 === 0 ? ir : ir * 0.35;
        const px = ix + Math.cos(a) * rr, py = iy + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(ix - ir * 0.6, iy - ir * 0.8);
      ctx.lineTo(ix + ir * 0.6, iy - ir * 0.8);
      ctx.lineTo(ix + ir * 0.05, iy);
      ctx.lineTo(ix + ir * 0.6, iy + ir * 0.8);
      ctx.lineTo(ix - ir * 0.6, iy + ir * 0.8);
      ctx.lineTo(ix - ir * 0.05, iy);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

function drawMinimap() {
  if (!G.running) return;
  const size = 90 * DPR, margin = 16 * DPR;
  const cx = size / 2 + margin;
  const cy = H - size / 2 - margin;
  const r = size / 2 - 2 * DPR;

  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#0a0a18';
  ctx.beginPath(); ctx.arc(cx, cy, r + 2 * DPR, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ff8020'; ctx.lineWidth = 1.5 * DPR;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();

  const scale = r / ARENA_R;

  for (const e of G.enemies) {
    const ex = cx + e.x * scale, ey = cy + e.y * scale;
    if (dist2(ex, ey, cx, cy) > (r - 2 * DPR) ** 2) continue;
    ctx.fillStyle = e.isBoss ? '#ffd060' : '#ff3060';
    const rr = e.isBoss ? 3 * DPR : 1.5 * DPR;
    ctx.beginPath(); ctx.arc(ex, ey, rr, 0, TAU); ctx.fill();
  }
  for (const pk of G.pickups) {
    const ex = cx + pk.x * scale, ey = cy + pk.y * scale;
    ctx.fillStyle = pk.color;
    ctx.beginPath(); ctx.arc(ex, ey, 2 * DPR, 0, TAU); ctx.fill();
  }

  const p = G.player;
  const px = cx + p.x * scale, py = cy + p.y * scale;
  ctx.fillStyle = G.selectedSkin === 'cyan' ? '#4da0ff' : G.beatColor;
  ctx.beginPath(); ctx.arc(px, py, 3 * DPR, 0, TAU); ctx.fill();

  ctx.restore();
}

function draw() {
  const p = G.player; if (!p) return;
  let sx = 0, sy = 0;
  if (G.shakeT > 0) {
    const k = G.shakeT / 0.2;
    sx = rand(-1, 1) * G.shakeMag * k;
    sy = rand(-1, 1) * G.shakeMag * k;
  }
  const zoom = getEffectiveZoom();

  drawBgFixed();

  ctx.save();
  ctx.translate(sx, sy);
  ctx.translate(CX, CY);
  ctx.scale(zoom, zoom);
  ctx.translate(-p.x, -p.y);

  drawArenaRing();
  drawXpOrbs();
  drawPickups();
  drawEnemies();
  drawBullets();
  drawCyanBolts();
  drawPlayer();
  drawParticles();
  drawRipples();

  ctx.restore();

  if (G.flashT > 0) {
    ctx.fillStyle = `rgba(255,60,100,${G.flashT * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (G.fireDamageTime > 0) {
    const a = Math.min(0.35, G.fireDamageTime * 1.2);
    ctx.fillStyle = `rgba(255,80,20,${a})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (G.beatFlashT > 0) {
    const grd = ctx.createRadialGradient(CX, CY, Math.min(W, H) * 0.3, CX, CY, Math.max(W, H) * 0.75);
    grd.addColorStop(0, 'transparent');
    grd.addColorStop(1, G.beatColor);
    ctx.globalAlpha = G.beatFlashT * 0.12;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  if (G.streakGlowT > 0.02) {
    const SG = TUNE.streakGlow;
    const rgb = hexToRgbStr(getStreakColor());
    const innerR = Math.min(W, H) * 0.32;
    const outerR = Math.max(W, H) * 0.75;
    const vgI = ctx.createRadialGradient(CX, CY, innerR, CX, CY, outerR);
    vgI.addColorStop(0, `rgba(${rgb},0)`);
    vgI.addColorStop(0.55, `rgba(${rgb},${G.streakGlowT * SG.edgeAlpha * 0.15})`);
    vgI.addColorStop(1, `rgba(${rgb},${G.streakGlowT * SG.edgeAlpha})`);
    ctx.fillStyle = vgI;
    ctx.fillRect(0, 0, W, H);
  }

  if (!draw._vg || draw._vgW !== W || draw._vgH !== H) {
    const vg = ctx.createRadialGradient(CX, CY, Math.min(W, H) * 0.35, CX, CY, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.75)');
    draw._vg = vg;
    draw._vgW = W;
    draw._vgH = H;
  }
  ctx.fillStyle = draw._vg;
  ctx.fillRect(0, 0, W, H);

  drawBossHPBars();
  drawToasts();
  drawMinimap();
}

// ═══════════════════════════════════════════════
// SKIN PREVIEWS (для магазина)
// ═══════════════════════════════════════════════
function _previewBg(c, w, h) {
  c.fillStyle = '#05060a';
  c.fillRect(0, 0, w, h);
}

function previewBase(c, w, h, t) {
  _previewBg(c, w, h);
  const cx = w / 2, cy = h / 2;
  const col = BEAT_COLORS[Math.floor(t * 2) % BEAT_COLORS.length];
  const pulse = 1 + Math.sin(t * 3) * 0.15;
  const r = 11 * pulse;

  const g = c.createRadialGradient(cx, cy, 0, cx, cy, r * 4);
  g.addColorStop(0, col + 'cc');
  g.addColorStop(0.4, col + '55');
  g.addColorStop(1, 'transparent');
  c.fillStyle = g;
  c.beginPath(); c.arc(cx, cy, r * 4, 0, TAU); c.fill();

  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
  c.strokeStyle = col; c.lineWidth = 1.6;
  c.beginPath(); c.arc(cx, cy, r + 4, 0, TAU); c.stroke();
}

function previewCyan(c, w, h, t) {
  _previewBg(c, w, h);
  const cx = w / 2, cy = h / 2;
  const r = 11;
  const dist = Math.min(w, h) * 0.32;

  const enemies = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + t * 0.3 - Math.PI / 2;
    enemies.push({
      x: cx + Math.cos(a) * dist,
      y: cy + Math.sin(a) * dist,
    });
  }
  for (const e of enemies) {
    c.fillStyle = '#ff3d6e';
    c.shadowColor = '#ff3d6e'; c.shadowBlur = 4;
    c.beginPath(); c.arc(e.x, e.y, 4.5, 0, TAU); c.fill();
  }
  c.shadowBlur = 0;

  // Мелодия
  const noteDur = 0.25;
  const noteIdx = Math.floor(t / noteDur);
  const noteT = (t % noteDur) / noteDur;
  const noteAlpha = noteT < 0.5 ? 1 - noteT / 0.5 * 0.6 : 0;
  const pattern = [1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1];
  const pidx = noteIdx % 16;

  if (pattern[pidx] && noteAlpha > 0.02) {
    const tgt = enemies[noteIdx % enemies.length];
    const segs = makeFractalBolt(cx, cy, tgt.x, tgt.y, 3, 10);
    c.globalAlpha = noteAlpha;
    c.strokeStyle = '#4da0ff';
    c.shadowColor = '#4da0ff'; c.shadowBlur = 10;
    c.lineCap = 'round';
    for (const s of segs) {
      c.lineWidth = s.w * 0.7;
      c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke();
    }
    c.shadowBlur = 0;
    c.globalAlpha = 1;
  }

  // Бас
  const bassDur = 0.5;
  const bassIdx = Math.floor(t / bassDur);
  const bassT = (t % bassDur) / bassDur;
  const bassAlpha = bassT < 0.35 ? 1 - bassT / 0.35 * 0.5 : 0;
  if (bassAlpha > 0.02) {
    for (let k = 0; k < 2; k++) {
      const tgt = enemies[(bassIdx * 2 + k) % enemies.length];
      const segs = makeFractalBolt(cx, cy, tgt.x, tgt.y, 3, 12);
      c.globalAlpha = bassAlpha;
      c.strokeStyle = '#40e0d0';
      c.shadowColor = '#40e0d0'; c.shadowBlur = 12;
      for (const s of segs) {
        c.lineWidth = s.w * 1.4;
        c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke();
      }
      c.shadowBlur = 0;
      c.globalAlpha = 1;
    }
  }

  // Ядро — белый шарик с синей аурой (как в игре)
  const col = '#4da0ff';
  const pulse = 1 + Math.max(0, 1 - noteT * 5) * 0.15;
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, r * 3.5);
  g.addColorStop(0, col + 'cc');
  g.addColorStop(0.4, col + '55');
  g.addColorStop(1, 'transparent');
  c.fillStyle = g;
  c.beginPath(); c.arc(cx, cy, r * 3.5, 0, TAU); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(cx, cy, r * pulse, 0, TAU); c.fill();
  c.strokeStyle = col; c.lineWidth = 1.6;
  c.beginPath(); c.arc(cx, cy, r * pulse + 4, 0, TAU); c.stroke();
}

function renderSkinPreview(cv, skinId, t) {
  if (!cv || !cv.getContext) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const CW = 240, CH = 100;
  const expectedW = CW * dpr, expectedH = CH * dpr;
  if (cv.width !== expectedW || cv.height !== expectedH) {
    cv.width = expectedW;
    cv.height = expectedH;
    cv.style.aspectRatio = CW + '/' + CH;
  }
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.scale(dpr, dpr);
  c.globalAlpha = 1;
  c.shadowBlur = 0;
  if (skinId === 'cyan') previewCyan(c, CW, CH, t);
  else previewBase(c, CW, CH, t);
}