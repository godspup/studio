'use strict';

// ─── Миграция: выкидываем вырезанный скин VOID ───
(function _migrateSkins() {
  try {
    let sel = localStorage.getItem('ns_selected_skin');
    if (sel === 'void') {
      localStorage.setItem('ns_selected_skin', 'base');
      console.log('[MIGRATE] selected skin void → base');
    }
    const rawOwned = localStorage.getItem('ns_owned_skins');
    if (rawOwned) {
      let owned = JSON.parse(rawOwned);
      if (Array.isArray(owned)) {
        const before = owned.length;
        owned = owned.filter(s => s !== 'void');
        if (!owned.includes('base')) owned.unshift('base');
        if (owned.length !== before) {
          localStorage.setItem('ns_owned_skins', JSON.stringify(owned));
          console.log('[MIGRATE] owned skins cleaned');
        }
      }
    }
  } catch (e) {}
})();

let _selSkin = localStorage.getItem('ns_selected_skin') || 'base';
if (_selSkin === 'void') _selSkin = 'base';
let _ownedSkins = [];
try { _ownedSkins = JSON.parse(localStorage.getItem('ns_owned_skins') || '["base"]'); } catch (e) {}
if (!Array.isArray(_ownedSkins) || _ownedSkins.length === 0) _ownedSkins = ['base'];
_ownedSkins = _ownedSkins.filter(s => s !== 'void');
if (!_ownedSkins.includes('base')) _ownedSkins.unshift('base');

function _blankTrack() {
  return {
    dd: 0, dt: 0, hits: 0, shots: 0, ovk: 0,
    bySource: { bullet: 0, orbital: 0, explode: 0, cyan_lead: 0, cyan_bass: 0, cyan_chain: 0, other: 0 },
  };
}

const G = {
  running: false, paused: false, paused2: false,
  time: 0, wave: 1, waveTimer: 0,
  score: 0, kills: 0,

  player: null,
  enemies: [], bullets: [], ebullets: [], pickups: [],
  particles: [], xporbs: [], ripples: [], explosions: [], toasts: [],

  shakeT: 0, shakeMag: 0, flashT: 0,
  best: +localStorage.getItem('ns_best') || 0,
  gridPulse: 0,
  fireDamageTime: 0,
  zoom: parseFloat(localStorage.getItem('ns_zoom')) || 0.7,
  beatColorIdx: 0, beatColor: '#7ec9ff', beatFlashT: 0,
  devUnlocked: false,
  gameSpeed: 1,

  streakGlowT: 0,

  comboCount: 0, comboTimer: 0, rating: 'D',

  tugriks: +localStorage.getItem('ns_tugriks') || 0,
  ownedTracks: JSON.parse(localStorage.getItem('ns_owned_tracks') || '["default"]'),
  selectedTrack: localStorage.getItem('ns_selected_track') || 'default',

  selectedSkin: _selSkin,
  ownedSkins: _ownedSkins,

  pickupTimer: 30,
  nextBossWave: 12,
  bossActive: false,
  slowmoT: 0,
  _lastHealWave: 0,
  _lastFinaleWave: -1,
  _heavyCounter: 0,

  lowFX: false,
  fpsSample: 60,
  _lowFXTimer: 0,
  _highFXTimer: 0,

  arenaShape: 'circle',
  arenaScale: 1,

  cyanBolts: [],
  cyanBeatT: 0,
  _lastAudioStep: -1,

  // ТРЕКЕР ЗАБЕГА
  runLog: [],
  runMeta: null,
  _logAccum: 0,
  _peakCombo: 0,
  _track: _blankTrack(),
  _total: _blankTrack(),
};

let W, H, CX, CY, ARENA_R;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

function resizeCanvas() {
  W = canvas.width = Math.floor(innerWidth * DPR);
  H = canvas.height = Math.floor(innerHeight * DPR);
  CX = W / 2;
  CY = H / 2;
  ARENA_R = Math.min(W, H) * TUNE.arena.radiusMul * (G.arenaScale || 1);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
}

function newPlayer() {
  const T = TUNE.player;
  return {
    x: 0, y: 0, vx: 0, vy: 0, r: 14 * DPR,
    hp: T.hp, maxHp: T.hp,
    speed: T.speed * DPR,
    dmg: T.dmg,
    fireRate: T.fireRate,
    fireCd: 0,
    projSpeed: T.projSpeed * DPR,
    projCount: T.projCount,
    pierce: 0, ricochet: 0,
    range: T.range * DPR,
    xp: 0,
    xpNeed: TUNE.xpCurve.base,
    level: 1,
    xpBonus: T.xpBonus,
    xpMagnet: T.xpMagnet * DPR,
    xpPullSpeed: T.xpPullSpeed,
    regen: T.regen,
    invulnT: 0, aimAngle: 0,
    crit: T.crit, critMult: T.critMult,
    explosiveLevel: 0, explosiveDmg: 0, explosiveRadius: 0,
    pointBlankLevel: 0,
    dodgeLevel: 0, dodgeCounter: 0,
    orbitals: [],
    sandyGlitchT: 0,
    shieldT: 0, rageT: 0, hasteT: 0,
    _lv: {
      power: 0, overclock: 0, thrusters: 0, armor: 0,
      magnet: 0, vacuum: 0, nano: 0, shrine: 0, crit: 0,
      cyanMultishot: 0, cyanRange: 0, cyanPower: 0, cyanChain: 0,
    },
  };
}

function pickRandomArena() {
  const pool = TUNE.arena.shapesPool || ['circle'];
  const idx = Math.floor(Math.random() * pool.length);
  G.arenaShape = pool[idx];
}

function resetGame() {
  G.time = 0; G.wave = 1; G.waveTimer = 0;
  G.score = 0; G.kills = 0;

  G.enemies.length = 0;
  G.bullets.length = 0;
  G.ebullets.length = 0;
  G.pickups.length = 0;
  G.particles.length = 0;
  G.xporbs.length = 0;
  G.ripples.length = 0;
  G.explosions.length = 0;
  G.toasts.length = 0;
  G.cyanBolts.length = 0;

  G.shakeT = 0; G.flashT = 0; G.fireDamageTime = 0;
  G.player = newPlayer();
  G.beatColorIdx = 0;
  G.beatColor = BEAT_COLORS[0];
  G.beatFlashT = 0;

  G.streakGlowT = 0;

  G.comboCount = 0;
  G.comboTimer = 0;
  G.rating = 'D';

  G.pickupTimer = TUNE.pickups.spawnInterval;
  G.nextBossWave = TUNE.waves.bossFirstWave;
  G.bossActive = false;
  G.slowmoT = 0;
  G._lastHealWave = 0;
  G._lastFinaleWave = -1;
  G._heavyCounter = 0;
  G._lastAudioStep = -1;

  G.arenaScale = 1;
  ARENA_R = Math.min(W, H) * TUNE.arena.radiusMul;

  G.cyanBeatT = 0;

  G.runLog = [];
  G.runMeta = null;
  G._logAccum = 0;
  G._peakCombo = 0;
  G._track = _blankTrack();
  G._total = _blankTrack();

  G._lowFXTimer = 0;
  G._highFXTimer = 0;

  A.intensity = 0.85;
  updateHUD();
  updateDMCRating();
}

function saveBest() {
  if (G.score > G.best) {
    G.best = G.score;
    localStorage.setItem('ns_best', G.best);
    return true;
  }
  return false;
}
function saveZoom(v) { localStorage.setItem('ns_zoom', v.toFixed(2)); }
function saveTugriks(v) { localStorage.setItem('ns_tugriks', v); }
function saveOwnedTracks(arr) { localStorage.setItem('ns_owned_tracks', JSON.stringify(arr)); }
function saveSelectedTrack(id) { localStorage.setItem('ns_selected_track', id); }
function saveSelectedSkin(id) { localStorage.setItem('ns_selected_skin', id); }
function saveOwnedSkins(arr) { localStorage.setItem('ns_owned_skins', JSON.stringify(arr)); }