'use strict';

const UPGRADES = [
  { id: 'power', title: 'POWER CORE',
    get maxLevel() { return TUNE.upgrades.power.maxLevel; },
    getLevel: p => p._lv.power,
    apply: p => { p._lv.power++; p.dmg *= TUNE.upgrades.power.factor; },
    remove: (p, lvl) => { p.dmg /= Math.pow(TUNE.upgrades.power.factor, lvl); p._lv.power = 0; },
    reapply: (p, lvl) => { p.dmg = TUNE.player.dmg * Math.pow(TUNE.upgrades.power.factor, lvl); p._lv.power = lvl; } },

  { id: 'overclock', title: 'OVERCLOCK',
    get maxLevel() { return TUNE.upgrades.overclock.maxLevel; },
    getLevel: p => p._lv.overclock,
    apply: p => { p._lv.overclock++; p.fireRate *= TUNE.upgrades.overclock.factor; },
    remove: (p, lvl) => { p.fireRate /= Math.pow(TUNE.upgrades.overclock.factor, lvl); p._lv.overclock = 0; },
    reapply: (p, lvl) => { p.fireRate = TUNE.player.fireRate * Math.pow(TUNE.upgrades.overclock.factor, lvl); p._lv.overclock = lvl; } },

  { id: 'thrusters', title: 'THRUSTERS',
    get maxLevel() { return TUNE.upgrades.thrusters.maxLevel; },
    getLevel: p => p._lv.thrusters,
    apply: p => { p._lv.thrusters++; p.speed *= TUNE.upgrades.thrusters.factor; },
    remove: (p, lvl) => { p.speed /= Math.pow(TUNE.upgrades.thrusters.factor, lvl); p._lv.thrusters = 0; },
    reapply: (p, lvl) => { p.speed = TUNE.player.speed * DPR * Math.pow(TUNE.upgrades.thrusters.factor, lvl); p._lv.thrusters = lvl; } },

  { id: 'armor', title: 'ARMOR PLATE',
    get maxLevel() { return TUNE.upgrades.armor.maxLevel; },
    getLevel: p => p._lv.armor,
    apply: p => { p._lv.armor++; p.maxHp += TUNE.upgrades.armor.hpAdd; p.hp = p.maxHp; },
    remove: (p, lvl) => {
      p.maxHp -= TUNE.upgrades.armor.hpAdd * lvl;
      if (p.hp > p.maxHp) p.hp = p.maxHp;
      p._lv.armor = 0;
    },
    reapply: (p, lvl) => {
      p.maxHp = TUNE.player.hp + TUNE.upgrades.armor.hpAdd * lvl;
      if (p.hp > p.maxHp) p.hp = p.maxHp;
      p._lv.armor = lvl;
    } },

  { id: 'spread', title: 'SPREAD SHOT',
    get maxLevel() { return TUNE.upgrades.spread.maxLevel; },
    getLevel: p => p.projCount - TUNE.player.projCount,
    apply: p => p.projCount += 1,
    remove: (p) => { p.projCount = TUNE.player.projCount; },
    reapply: (p, lvl) => { p.projCount = TUNE.player.projCount + lvl; } },

  { id: 'pierce', title: 'PIERCING ROUNDS',
    get maxLevel() { return TUNE.upgrades.pierce.maxLevel; },
    getLevel: p => p.pierce,
    apply: p => p.pierce += 1,
    remove: (p) => { p.pierce = 0; },
    reapply: (p, lvl) => { p.pierce = lvl; } },

  { id: 'ricochet', title: 'RICOCHET',
    get maxLevel() { return TUNE.upgrades.ricochet.maxLevel; },
    getLevel: p => p.ricochet,
    apply: p => p.ricochet += 1,
    remove: (p) => { p.ricochet = 0; },
    reapply: (p, lvl) => { p.ricochet = lvl; } },

  { id: 'magnet', title: 'MAGNETIC FIELD',
    get maxLevel() { return TUNE.upgrades.magnet.maxLevel; },
    getLevel: p => p._lv.magnet,
    apply: p => {
      p._lv.magnet++;
      p.xpMagnet = TUNE.player.xpMagnet * DPR * (1 + TUNE.upgrades.magnet.baseAdd * p._lv.magnet);
    },
    remove: (p) => { p._lv.magnet = 0; p.xpMagnet = TUNE.player.xpMagnet * DPR; },
    reapply: (p, lvl) => {
      p._lv.magnet = lvl;
      p.xpMagnet = TUNE.player.xpMagnet * DPR * (1 + TUNE.upgrades.magnet.baseAdd * lvl);
    } },

  { id: 'vacuum', title: 'XP VACUUM',
    get maxLevel() { return TUNE.upgrades.vacuum.maxLevel; },
    getLevel: p => p._lv.vacuum,
    apply: p => {
      p._lv.vacuum++;
      p.xpPullSpeed = TUNE.player.xpPullSpeed * (1 + TUNE.upgrades.vacuum.baseAdd * p._lv.vacuum);
    },
    remove: (p) => { p._lv.vacuum = 0; p.xpPullSpeed = TUNE.player.xpPullSpeed; },
    reapply: (p, lvl) => {
      p._lv.vacuum = lvl;
      p.xpPullSpeed = TUNE.player.xpPullSpeed * (1 + TUNE.upgrades.vacuum.baseAdd * lvl);
    } },

  { id: 'nano', title: 'NANOBOTS',
    get maxLevel() { return TUNE.upgrades.nano.maxLevel; },
    getLevel: p => p._lv.nano,
    apply: p => {
      p._lv.nano++;
      p.regen = TUNE.player.regen + TUNE.upgrades.nano.regenAdd * p._lv.nano;
    },
    remove: (p) => { p._lv.nano = 0; p.regen = TUNE.player.regen; },
    reapply: (p, lvl) => {
      p._lv.nano = lvl;
      p.regen = TUNE.player.regen + TUNE.upgrades.nano.regenAdd * lvl;
    } },

  { id: 'shrine', title: 'DATA SHRINE',
    get maxLevel() { return TUNE.upgrades.shrine.maxLevel; },
    getLevel: p => p._lv.shrine,
    apply: p => {
      p._lv.shrine++;
      p.xpBonus = TUNE.player.xpBonus * Math.pow(TUNE.upgrades.shrine.factor, p._lv.shrine);
    },
    remove: (p) => { p._lv.shrine = 0; p.xpBonus = TUNE.player.xpBonus; },
    reapply: (p, lvl) => {
      p._lv.shrine = lvl;
      p.xpBonus = TUNE.player.xpBonus * Math.pow(TUNE.upgrades.shrine.factor, lvl);
    } },

  { id: 'crit', title: 'CRITICAL HIT',
    get maxLevel() { return TUNE.upgrades.crit.maxLevel; },
    getLevel: p => p._lv.crit,
    apply: p => {
      p._lv.crit++;
      p.crit = TUNE.player.crit + TUNE.upgrades.crit.chanceAdd * p._lv.crit;
    },
    remove: (p) => { p._lv.crit = 0; p.crit = TUNE.player.crit; },
    reapply: (p, lvl) => {
      p._lv.crit = lvl;
      p.crit = TUNE.player.crit + TUNE.upgrades.crit.chanceAdd * lvl;
    } },

  { id: 'explosive', title: 'EXPLOSIVE ROUNDS',
    get maxLevel() { return TUNE.upgrades.explosive.maxLevel; },
    getLevel: p => p.explosiveLevel,
    apply: p => {
      p.explosiveLevel++;
      const u = TUNE.upgrades.explosive;
      p.explosiveDmg = p.dmg * u.dmgTbl[p.explosiveLevel];
      p.explosiveRadius = u.radiusTbl[p.explosiveLevel] * DPR;
    },
    remove: (p) => { p.explosiveLevel = 0; p.explosiveDmg = 0; p.explosiveRadius = 0; },
    reapply: (p, lvl) => {
      p.explosiveLevel = lvl;
      const u = TUNE.upgrades.explosive;
      p.explosiveDmg = p.dmg * u.dmgTbl[lvl];
      p.explosiveRadius = u.radiusTbl[lvl] * DPR;
    } },

  { id: 'orbital', title: 'ORBITAL SHIELD',
    get maxLevel() { return TUNE.upgrades.orbital.maxLevel; },
    getLevel: p => p.orbitals.length,
    apply: p => { addOrbital(p); },
    remove: (p) => { p.orbitals = []; },
    reapply: (p, lvl) => { p.orbitals = []; for (let i = 0; i < lvl; i++) addOrbital(p); } },

  { id: 'pointblank', title: 'POINT BLANK',
    get maxLevel() { return TUNE.upgrades.pointblank.maxLevel; },
    getLevel: p => p.pointBlankLevel,
    apply: p => { p.pointBlankLevel++; },
    remove: (p) => { p.pointBlankLevel = 0; },
    reapply: (p, lvl) => { p.pointBlankLevel = lvl; } },

  { id: 'sandy', title: 'SANDY',
    get maxLevel() { return TUNE.upgrades.sandy.maxLevel; },
    getLevel: p => p.dodgeLevel,
    apply: p => { p.dodgeLevel++; },
    remove: (p) => { p.dodgeLevel = 0; p.dodgeCounter = 0; },
    reapply: (p, lvl) => { p.dodgeLevel = lvl; } },

  // ═════════ CYAN-specific ═════════
  { id: 'cyanPower', title: 'ARC POWER',
    get maxLevel() { return TUNE.upgrades.cyanPower.maxLevel; },
    getLevel: p => p._lv.cyanPower,
    apply: p => { p._lv.cyanPower++; },
    remove: p => { p._lv.cyanPower = 0; },
    reapply: (p, lvl) => { p._lv.cyanPower = lvl; } },

  { id: 'cyanMultishot', title: 'TWIN ARCS',
    get maxLevel() { return TUNE.upgrades.cyanMultishot.maxLevel; },
    getLevel: p => p._lv.cyanMultishot,
    apply: p => { p._lv.cyanMultishot++; },
    remove: p => { p._lv.cyanMultishot = 0; },
    reapply: (p, lvl) => { p._lv.cyanMultishot = lvl; } },

  { id: 'cyanChain', title: 'CHAIN LIGHTNING',
    get maxLevel() { return TUNE.upgrades.cyanChain.maxLevel; },
    getLevel: p => p._lv.cyanChain,
    apply: p => { p._lv.cyanChain++; },
    remove: p => { p._lv.cyanChain = 0; },
    reapply: (p, lvl) => { p._lv.cyanChain = lvl; } },

  { id: 'cyanRange', title: 'ARC NOVA',
    get maxLevel() { return TUNE.upgrades.cyanRange.maxLevel; },
    getLevel: p => p._lv.cyanRange,
    apply: p => { p._lv.cyanRange++; },
    remove: p => { p._lv.cyanRange = 0; },
    reapply: (p, lvl) => { p._lv.cyanRange = lvl; } },
];

function addOrbital(p) {
  const O = TUNE.upgrades.orbital;
  const newCount = p.orbitals.length + 1;
  const speed = O.orbitSpeed * Math.pow(O.speedPerLevel, newCount - 1);
  for (const o of p.orbitals) o.speed = speed;
  p.orbitals.push({
    angle: 0,
    radius: O.radius * DPR,
    speed: speed,
    r: O.hitR * DPR,
  });
  for (let i = 0; i < newCount; i++) p.orbitals[i].angle = i * TAU / newCount;
}

function _old(v) { return '<span class="u-num-old">' + v + '</span>'; }
function _new(v) { return '<span class="u-num-new">' + v + '</span>'; }
function _arr() { return '<span class="u-arrow">→</span>'; }
function _pct(v) { return Math.round(v * 100); }

function getUpgradeDesc(u, p, lvl, mode) {
  const isCard = mode === 'card';
  const nextLvl = lvl + 1;

  switch (u.id) {
    case 'power': {
      const f = TUNE.upgrades.power.factor;
      const curPct = _pct(Math.pow(f, lvl) - 1);
      const nextPct = _pct(Math.pow(f, nextLvl) - 1);
      if (isCard) {
        if (lvl <= 0) return `Урон снарядов ${_new('+' + nextPct + '%')}`;
        return `Урон снарядов ${_old('+' + curPct + '%')} ${_arr()} ${_new('+' + nextPct + '%')}`;
      }
      return `Урон снарядов ${_new('+' + curPct + '%')}`;
    }
    case 'overclock': {
      const f = TUNE.upgrades.overclock.factor;
      const curPct = _pct(Math.pow(f, lvl) - 1);
      const nextPct = _pct(Math.pow(f, nextLvl) - 1);
      if (isCard) {
        if (lvl <= 0) return `Скорострельность ${_new('+' + nextPct + '%')}`;
        return `Скорострельность ${_old('+' + curPct + '%')} ${_arr()} ${_new('+' + nextPct + '%')}`;
      }
      return `Скорострельность ${_new('+' + curPct + '%')}`;
    }
    case 'thrusters': {
      const f = TUNE.upgrades.thrusters.factor;
      const curPct = _pct(Math.pow(f, lvl) - 1);
      const nextPct = _pct(Math.pow(f, nextLvl) - 1);
      if (isCard) {
        if (lvl <= 0) return `Скорость движения ${_new('+' + nextPct + '%')}`;
        return `Скорость движения ${_old('+' + curPct + '%')} ${_arr()} ${_new('+' + nextPct + '%')}`;
      }
      return `Скорость движения ${_new('+' + curPct + '%')}`;
    }
    case 'armor': {
      const add = TUNE.upgrades.armor.hpAdd;
      const cur = add * lvl;
      const next = add * nextLvl;
      if (isCard) {
        if (lvl <= 0) return `Макс. HP ${_new('+' + next)} , полностью восстанавливает здоровье`;
        return `Макс. HP ${_old('+' + cur)} ${_arr()} ${_new('+' + next)} , полностью восстанавливает здоровье`;
      }
      return `Макс. HP ${_new('+' + cur)}`;
    }
    case 'spread': {
      const cur = p.projCount;
      const next = p.projCount + 1;
      if (isCard) {
        if (lvl <= 0) return `Снарядов за выстрел ${_new('+1')}`;
        return `Снарядов за выстрел ${_old(cur)} ${_arr()} ${_new(next)}`;
      }
      return `Снарядов за выстрел ${_new(cur)}`;
    }
    case 'pierce': {
      const cur = p.pierce;
      const next = cur + 1;
      if (isCard) {
        if (lvl <= 0) return `Пробитие врагов ${_new('+1')}`;
        return `Пробитие врагов ${_old(cur)} ${_arr()} ${_new(next)}`;
      }
      return `Пробитие врагов ${_new(cur)}`;
    }
    case 'ricochet': {
      const cur = p.ricochet;
      const next = cur + 1;
      if (isCard) {
        if (lvl <= 0) return `Рикошетов ${_new('+1')}`;
        return `Рикошетов ${_old(cur)} ${_arr()} ${_new(next)}`;
      }
      return `Рикошетов ${_new(cur)}`;
    }
    case 'explosive': {
      const uu = TUNE.upgrades.explosive;
      if (isCard) {
        const newLvl = nextLvl;
        const newDmg = Math.round((uu.dmgTbl[newLvl] || 0) * 100);
        const newR = uu.radiusTbl[newLvl] || 0;
        if (lvl <= 0) {
          return `Взрыв при попадании: ${_new(newDmg + '%')} урона снаряда, радиус ${_new(newR + 'px')}`;
        }
        const curDmg = Math.round(uu.dmgTbl[lvl] * 100);
        const curR = uu.radiusTbl[lvl];
        return `Взрыв при попадании: ${_old(curDmg + '%')} ${_arr()} ${_new(newDmg + '%')} урона, радиус ${_old(curR + 'px')} ${_arr()} ${_new(newR + 'px')}`;
      }
      if (lvl <= 0) return 'Взрыв не активен';
      const dmgPct = Math.round(uu.dmgTbl[lvl] * 100);
      const radius = uu.radiusTbl[lvl];
      return `Взрыв при попадании: ${_new(dmgPct + '%')} урона снаряда, радиус ${_new(radius + 'px')}`;
    }
    case 'magnet': {
      const add = TUNE.upgrades.magnet.baseAdd;
      const curPct = Math.round(add * lvl * 100);
      const nextPct = Math.round(add * nextLvl * 100);
      if (isCard) {
        if (lvl <= 0) return `Радиус сбора ${_new('+' + nextPct + '%')}`;
        return `Радиус сбора ${_old('+' + curPct + '%')} ${_arr()} ${_new('+' + nextPct + '%')}`;
      }
      return `Радиус сбора ${_new('+' + curPct + '%')}`;
    }
    case 'vacuum': {
      const add = TUNE.upgrades.vacuum.baseAdd;
      const curPct = Math.round(add * lvl * 100);
      const nextPct = Math.round(add * nextLvl * 100);
      if (isCard) {
        if (lvl <= 0) return `Скорость притягивания опыта ${_new('+' + nextPct + '%')}`;
        return `Скорость притягивания опыта ${_old('+' + curPct + '%')} ${_arr()} ${_new('+' + nextPct + '%')}`;
      }
      return `Скорость притягивания опыта ${_new('+' + curPct + '%')}`;
    }
    case 'nano': {
      const add = TUNE.upgrades.nano.regenAdd;
      const cur = add * lvl;
      const next = add * nextLvl;
      if (isCard) {
        if (lvl <= 0) return `Регенерация ${_new('+' + next + ' HP/сек')}`;
        return `Регенерация ${_old('+' + cur)} ${_arr()} ${_new('+' + next + ' HP/сек')}`;
      }
      return `Регенерация ${_new('+' + cur + ' HP/сек')}`;
    }
    case 'shrine': {
      const f = TUNE.upgrades.shrine.factor;
      const curPct = Math.round((Math.pow(f, lvl) - 1) * 100);
      const nextPct = Math.round((Math.pow(f, nextLvl) - 1) * 100);
      if (isCard) {
        if (lvl <= 0) return `Даёт на ${_new(nextPct + '%')} больше опыта`;
        return `Получаемый опыт ${_old('+' + curPct + '%')} ${_arr()} ${_new('+' + nextPct + '%')}`;
      }
      return `Получаемый опыт ${_new('+' + curPct + '%')}`;
    }
    case 'crit': {
      const add = TUNE.upgrades.crit.chanceAdd;
      const cur = Math.round(add * lvl * 100);
      const next = Math.round(add * nextLvl * 100);
      const mult = TUNE.player.critMult;
      if (isCard) {
        if (lvl <= 0) return `Шанс крита ${_new('+' + next + '%')} · урон ×${mult}`;
        return `Шанс крита ${_old('+' + cur + '%')} ${_arr()} ${_new('+' + next + '%')} · урон ×${mult}`;
      }
      return `Шанс крита ${_new('+' + cur + '%')} · урон ×${mult}`;
    }
    case 'orbital': {
      const O = TUNE.upgrades.orbital;
      const cur = p.orbitals.length;
      const next = cur + 1;
      if (isCard) {
        if (lvl <= 0) return `Орбитальный шар · ${_new(O.hitDmg + ' урона за удар')} · отбрасывает`;
        return `Шаров ${_old(cur)} ${_arr()} ${_new(next)} · скорость облёта +25%`;
      }
      if (lvl <= 0) return 'Нет шаров';
      const speedPct = Math.round((Math.pow(O.speedPerLevel, lvl - 1) - 1) * 100);
      return `Шаров ${_new(cur)} · ${_new(O.hitDmg + ' урона за удар')} · скорость облёта ${_new('+' + speedPct + '%')}`;
    }
    case 'pointblank': {
      const uu = TUNE.upgrades.pointblank;
      const curR = uu.radiusTbl[lvl > 0 ? lvl : 0] || 200;
      const nextR = uu.radiusTbl[nextLvl];
      const curPct = Math.round(uu.boostPerLevel * lvl * 100);
      const nextPct = Math.round(uu.boostPerLevel * nextLvl * 100);
      if (isCard) {
        if (lvl <= 0) return `Урон по врагам ближе ${_new('200px')} ${_new('+' + nextPct + '%')}`;
        return `Урон по врагам ближе ${_old(curR + 'px')} ${_arr()} ${_new(nextR + 'px')} ${_old('+' + curPct + '%')} ${_arr()} ${_new('+' + nextPct + '%')}`;
      }
      return `Урон по врагам ближе ${_new(curR + 'px')} ${_new('+' + curPct + '%')}`;
    }
    case 'sandy': {
      const tbl = TUNE.upgrades.sandy.thresholds;
      const cur = tbl[lvl > 0 ? lvl : 1];
      const next = tbl[nextLvl] || cur;
      if (isCard) {
        if (lvl <= 0) return `Уклонение от каждой ${_new(cur + '-й пули')}`;
        return `Уклонение от каждой ${_old(cur + '-й')} ${_arr()} ${_new(next + '-й пули')}`;
      }
      return `Уклонение от каждой ${_new(cur + '-й пули')}`;
    }
    case 'cyanPower': {
      const f = TUNE.upgrades.cyanPower.factor;
      const curPct = _pct(Math.pow(f, lvl) - 1);
      const nextPct = _pct(Math.pow(f, nextLvl) - 1);
      if (isCard) {
        if (lvl <= 0) return `Урон молний ${_new('+' + nextPct + '%')}`;
        return `Урон молний ${_old('+' + curPct + '%')} ${_arr()} ${_new('+' + nextPct + '%')}`;
      }
      return `Урон молний ${_new('+' + curPct + '%')}`;
    }
    case 'cyanMultishot': {
      const u = TUNE.upgrades.cyanMultishot;
      const curL = u.leadAdd[lvl] || 0;
      const curB = u.bassAdd[lvl] || 0;
      const nxtL = u.leadAdd[nextLvl] != null ? u.leadAdd[nextLvl] : curL;
      const nxtB = u.bassAdd[nextLvl] != null ? u.bassAdd[nextLvl] : curB;
      if (isCard) {
        const dL = nxtL - curL;
        const dB = nxtB - curB;
        const parts = [];
        if (dL > 0) parts.push(`мелодии ${_new('+' + dL)}`);
        if (dB > 0) parts.push(`баса ${_new('+' + dB)}`);
        return `Доп. молний ${parts.join(' · ')}`;
      }
      const C = TUNE.skins.cyan;
      const totL = C.leadTargets + curL;
      const totB = C.bassTargets + curB;
      return `Молний: мелодия ${_new(totL)} · бас ${_new(totB)}`;
    }
    case 'cyanChain': {
      const u = TUNE.upgrades.cyanChain;
      const curB = u.bounces[lvl] || 0;
      const nxtB = u.bounces[nextLvl] != null ? u.bounces[nextLvl] : curB;
      const curD = Math.round((u.damageTbl[lvl] || 0) * 100);
      const nxtD = Math.round((u.damageTbl[nextLvl] != null ? u.damageTbl[nextLvl] : u.damageTbl[lvl]) * 100);
      if (isCard) {
        if (lvl <= 0) return `Цепь: до ${_new(nxtB)} отскока · ${_new(nxtD + '%')} урона`;
        return `Отскоков ${_old(curB)} ${_arr()} ${_new(nxtB)} · урон ${_old(curD + '%')} ${_arr()} ${_new(nxtD + '%')}`;
      }
      if (lvl <= 0) return 'Нет цепной молнии';
      return `Отскоков ${_new(curB)} · урон ${_new(curD + '%')}`;
    }
    case 'cyanRange': {
      const f = TUNE.upgrades.cyanRange.factor;
      const curPct = Math.round((Math.pow(f, lvl) - 1) * 100);
      const nextPct = Math.round((Math.pow(f, nextLvl) - 1) * 100);
      if (isCard) {
        if (lvl <= 0) return `Радиус молний ${_new('+' + nextPct + '%')}`;
        return `Радиус молний ${_old('+' + curPct + '%')} ${_arr()} ${_new('+' + nextPct + '%')}`;
      }
      return `Радиус молний ${_new('+' + curPct + '%')}`;
    }
  }
  return '';
}