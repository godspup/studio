'use strict';

const TUNE_DEFAULTS = {
  player: {
    hp: 100, speed: 340, dmg: 12, fireRate: 3.2, projSpeed: 640,
    projCount: 1, range: 480, xpBonus: 1.0, xpMagnet: 200,
    xpPullSpeed: 1, regen: 0, crit: 0, critMult: 3, invulnOnHit: 0.1,
    bossTargetRadius: 400,
  },
  xpCurve: { base: 5, growth: 1.25, add: 5 },
  enemies: {
    hpScalePerWave: 0.08,
    dmgScalePerWave: 0,
    grunt:   { hp: 22,  speed: 90,  dmg: 8,  xp: 1,  radius: 12 },
    fast:    { hp: 12,  speed: 130, dmg: 6,  xp: 1,  radius: 8 },
    tank:    { hp: 90,  speed: 55,  dmg: 16, xp: 3,  radius: 22 },
    shooter: { hp: 15,  speed: 55,  dmg: 0,  xp: 2,  radius: 11,
               keepDist: 200, shootCdMin: 1.4, shootCdMax: 2.4,
               bulletSpeed: 300, bulletDmg: 10, bulletRange: 700 },
    elite:   { hp: 250, speed: 75,  dmg: 22, xp: 12, radius: 26 },
  },
  bosses: {
    boss_hydra:   { hp: 900, speed: 40, dmg: 25, xp: 30, radius: 60,
                    shootCd: 1.8, heads: 6, bulletSpeed: 260, bulletDmg: 12 },
    boss_spiral:  { hp: 850, speed: 30, dmg: 25, xp: 30, radius: 55,
                    spiralRate: 0.13, bulletSpeed: 260, bulletDmg: 10 },
    boss_slasher: { hp: 700, speed: 90, dmg: 30, xp: 30, radius: 48,
                    dashSpeed: 1300, dashDur: 0.35, windupDur: 0.7,
                    stuckDur: 0.9, recoverDur: 0.5 },
  },
  spawn: {
    baseInterval: 2.0,
    intervalDecay: 0.04,
    intervalMin: 0.6,
    baseCount: 1,
    countStep: 3,
  },
  streakGlow: {
    zoomBonus: 0.10, edgeAlpha: 0.42, smoothSpeed: 3.0,
    tierFire: 0.50, tierBlaze: 0.75, tierVoid: 1.00,
  },
  waves: {
    duration: 12,
    healPercent: 0.10,
    pattern: 'LHHLHH',
    heavySpawnMul: 1.5,
    lightSpawnMul: 0.75,
    heavySpeedMul: 1.2,
    lightSpeedMul: 1.0,
    eliteEveryNHeavy: 2,
    bossFirstWave: 12,
    bossEveryN: 12,
    finaleWave: 36,
    preFinaleWaves: [34, 35],
    finaleBossCount: 3,
    finaleShrinkRate: 0.012,
    finaleMinScale: 0.35,
  },
  economy: {
    killsReward: 0.5, scoreDivider: 500, waveReward: 2,
    scorePerOrb: 10, scorePerKillMul: 100,
  },
  upgrades: {
    power:     { factor: 1.25, maxLevel: 99 },
    overclock: { factor: 1.3,  maxLevel: 99 },
    thrusters: { factor: 1.4,  maxLevel: 3 },
    armor:     { hpAdd: 25,    maxLevel: 99 },
    spread:    { maxLevel: 6 },
    pierce:    { maxLevel: 5 },
    ricochet:  { maxLevel: 3 },
    magnet:    { baseAdd: 0.8, maxLevel: 4 },
    vacuum:    { baseAdd: 0.5, maxLevel: 4 },
    nano:      { regenAdd: 1,  maxLevel: 3 },
    shrine:    { factor: 1.2,  maxLevel: 3 },
    crit:      { chanceAdd: 0.15, maxLevel: 5 },
    explosive: { maxLevel: 3,
                 dmgTbl:    [0, 0.6, 1.2, 1.8],
                 radiusTbl: [0, 60, 80, 100] },
    orbital:   { maxLevel: 5,
                 dmgPerSec: 30,
                 hitDmg: 20,
                 hitCooldown: 0.4,
                 knockback: 250,
                 knockbackDecay: 0.0005,
                 knockbackTiltDeg: 55,
                 knockbackTiltDecay: 3.2,
                 radius: 70, orbitSpeed: 4.5,
                 speedPerLevel: 1.25, hitR: 12 },
    pointblank:{ maxLevel: 3, boostPerLevel: 0.4,
                 radiusTbl: [0, 200, 300, 400] },
    sandy:     { maxLevel: 3, thresholds: [0, 5, 3, 2] },
    cyanMultishot: { maxLevel: 4, leadAdd: [0,1,1,2,4], bassAdd: [0,0,1,2,4] },
    cyanRange:     { factor: 2.0, maxLevel: 3 },
    cyanPower:     { factor: 1.25, maxLevel: 99 },
    cyanChain:     { maxLevel: 3, bounces: [0,1,2,3], damageTbl: [0, 0.5, 0.65, 0.8] },
  },
  pickups: {
    spawnInterval: 30, maxOnMap: 4, lifetime: 25,
    hasteDur: 8, hasteMult: 1.5,
    shieldDur: 10,
    rageDur: 8, rageMult: 2.0,
    slowmoDur: 5, slowmoFactor: 0.4,
  },
  dmc: {
    thresholds:  { C: 15, B: 35, A: 60, S: 100 },
    multipliers: { D: 1,  C: 1.5, B: 2, A: 3, S: 4 },
    streakFireAt: 10, streakBlazeAt: 30, streakVoidAt: 60,
  },
  limits: {
    enemies: 150, bullets: 80, ebullets: 100,
    particles: 250, xporbs: 150,
  },
  performance: {
    allowBlur: true,
    autoLowFX: true,
    autoLowFXThreshold: 30,
    autoHighFXThreshold: 50,
  },
  arena: {
    radiusMul: 2.0,
    fireDps: 45,
    shape: 'circle',
    shapesPool: ['circle', 'octagon', 'hexagon', 'cross', 'star'],
    crossArmWidth: 0.35,
    starInnerRatio: 0.5,
  },
  skins: {
    base: {
      hiddenUpgrades: ['cyanMultishot','cyanRange','cyanPower','cyanChain'],
    },
    cyan: {
      enabled: true,
      leadPattern: [1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
      bassPattern: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],
      leadCol0: '#4da0ff',
      leadCol1: '#ffffff',
      bassCol0: '#ff40c0',
      bassCol1: '#ffe0ff',
      leadWidthMul: 0.7,
      bassWidthMul: 1.6,
      leadTargets: 1,
      bassTargets: 2,
      leadRange: 60,
      targetCooldown: 0.35,
      hiddenUpgrades: ['spread','pierce','ricochet','overclock','explosive','pointblank','power'],
    },
  },
};

const TUNE_HINTS = {
  'player.hp':                { hint: 'Стартовое здоровье игрока' },
  'player.speed':             { hint: 'Скорость передвижения в px/сек' },
  'player.dmg':               { hint: 'Урон одного снаряда (и урона молний)' },
  'player.fireRate':          { hint: 'Выстрелов в секунду' },
  'player.projSpeed':         { hint: 'Скорость полёта снаряда, px/сек' },
  'player.projCount':         { hint: 'Снарядов за выстрел' },
  'player.range':             { hint: 'Радиус поиска цели, px' },
  'player.xpBonus':           { hint: 'Множитель получаемого опыта', dir: '1.0 = без бонуса' },
  'player.xpMagnet':          { hint: 'Радиус сбора сфер опыта, px' },
  'player.xpPullSpeed':       { hint: 'Скорость притягивания сфер (множитель)' },
  'player.regen':             { hint: 'Восстановление HP в секунду' },
  'player.crit':              { hint: 'Шанс крита (0.15 = 15%)' },
  'player.critMult':          { hint: 'Множитель урона при крите' },
  'player.invulnOnHit':       { hint: 'Неуязвимость после урона, сек' },
  'player.bossTargetRadius':  { hint: 'Радиус, в котором автострельба целится в босса, px (у базы И у CYAN)', dir: '↑ босс важнее' },

  'xpCurve.base':   { hint: 'Стоимость первого уровня' },
  'xpCurve.growth': { hint: 'Множитель роста цены уровня' },
  'xpCurve.add':    { hint: 'Прибавка к цене каждого уровня' },

  'enemies.hpScalePerWave':  { hint: 'Прирост HP врагов за каждую волну' },
  'enemies.dmgScalePerWave': { hint: 'Прирост урона врагов за волну' },
  'enemies.grunt.hp':     { hint: 'HP гранта' },
  'enemies.grunt.speed':  { hint: 'Скорость гранта' },
  'enemies.grunt.dmg':    { hint: 'Урон при касании' },
  'enemies.grunt.xp':     { hint: 'Сколько опыта даёт' },
  'enemies.grunt.radius': { hint: 'Радиус визуальный' },
  'enemies.fast.hp':      { hint: 'HP быстрого моба' },
  'enemies.fast.speed':   { hint: 'Скорость быстрого' },
  'enemies.fast.dmg':     { hint: 'Урон быстрого' },
  'enemies.fast.xp':      { hint: 'Опыт за быстрого' },
  'enemies.fast.radius':  { hint: 'Радиус быстрого' },
  'enemies.tank.hp':      { hint: 'HP танка' },
  'enemies.tank.speed':   { hint: 'Скорость танка' },
  'enemies.tank.dmg':     { hint: 'Урон танка' },
  'enemies.tank.xp':      { hint: 'Опыт за танка' },
  'enemies.tank.radius':  { hint: 'Радиус танка' },
  'enemies.shooter.hp':         { hint: 'HP стрелка' },
  'enemies.shooter.speed':      { hint: 'Скорость стрелка' },
  'enemies.shooter.dmg':        { hint: 'Урон при контакте' },
  'enemies.shooter.xp':         { hint: 'Опыт за стрелка' },
  'enemies.shooter.radius':     { hint: 'Радиус стрелка' },
  'enemies.shooter.keepDist':   { hint: 'На какой дистанции держится, px' },
  'enemies.shooter.shootCdMin': { hint: 'Мин. пауза между выстрелами, сек' },
  'enemies.shooter.shootCdMax': { hint: 'Макс. пауза между выстрелами, сек' },
  'enemies.shooter.bulletSpeed':{ hint: 'Скорость снаряда' },
  'enemies.shooter.bulletDmg':  { hint: 'Урон снаряда' },
  'enemies.shooter.bulletRange':{ hint: 'Макс. дистанция стрельбы, px' },
  'enemies.elite.hp':     { hint: 'HP элитника' },
  'enemies.elite.speed':  { hint: 'Скорость элитника' },
  'enemies.elite.dmg':    { hint: 'Урон элитника' },
  'enemies.elite.xp':     { hint: 'Опыт за элитника' },
  'enemies.elite.radius': { hint: 'Радиус элитника' },

  'bosses.boss_hydra.hp':          { hint: 'HP гидры' },
  'bosses.boss_hydra.speed':       { hint: 'Скорость гидры' },
  'bosses.boss_hydra.dmg':         { hint: 'Урон при касании' },
  'bosses.boss_hydra.xp':          { hint: 'Опыт за убийство' },
  'bosses.boss_hydra.radius':      { hint: 'Размер' },
  'bosses.boss_hydra.shootCd':     { hint: 'Пауза между залпами, сек' },
  'bosses.boss_hydra.heads':       { hint: 'Сколько голов у гидры' },
  'bosses.boss_hydra.bulletSpeed': { hint: 'Скорость пуль' },
  'bosses.boss_hydra.bulletDmg':   { hint: 'Урон пуль' },
  'bosses.boss_spiral.hp':           { hint: 'HP спирали' },
  'bosses.boss_spiral.speed':        { hint: 'Скорость спирали' },
  'bosses.boss_spiral.dmg':          { hint: 'Урон при касании' },
  'bosses.boss_spiral.xp':           { hint: 'Опыт за убийство' },
  'bosses.boss_spiral.radius':       { hint: 'Размер' },
  'bosses.boss_spiral.spiralRate':   { hint: 'Пауза между пулями, сек', dir: '↓ плотнее' },
  'bosses.boss_spiral.bulletSpeed':  { hint: 'Скорость пуль' },
  'bosses.boss_spiral.bulletDmg':    { hint: 'Урон пуль' },
  'bosses.boss_slasher.hp':          { hint: 'HP слэшера' },
  'bosses.boss_slasher.speed':       { hint: 'Скорость слэшера' },
  'bosses.boss_slasher.dmg':         { hint: 'Урон в рывке' },
  'bosses.boss_slasher.xp':          { hint: 'Опыт за убийство' },
  'bosses.boss_slasher.radius':      { hint: 'Размер' },
  'bosses.boss_slasher.dashSpeed':   { hint: 'Скорость рывка' },
  'bosses.boss_slasher.dashDur':     { hint: 'Длительность рывка, сек' },
  'bosses.boss_slasher.windupDur':   { hint: 'Замах перед рывком, сек' },
  'bosses.boss_slasher.stuckDur':    { hint: 'Застревание после рывка, сек' },
  'bosses.boss_slasher.recoverDur':  { hint: 'Отлёт назад, сек' },

  'spawn.baseInterval':  { hint: 'Базовый интервал между спавнами, сек' },
  'spawn.intervalDecay': { hint: 'Насколько уменьшается интервал за волну' },
  'spawn.intervalMin':   { hint: 'Минимальный интервал (пол), сек' },
  'spawn.baseCount':     { hint: 'Сколько мобов за раз на 1-й волне' },
  'spawn.countStep':     { hint: 'За сколько волн +1 к количеству' },

  'waves.duration':        { hint: 'Длительность волны, сек' },
  'waves.healPercent':     { hint: 'Восстановление HP между волнами' },
  'waves.pattern':         { hint: 'Паттерн волн: L=лёгкая, H=тяжёлая' },
  'waves.heavySpawnMul':   { hint: 'Множитель спавна на тяжёлой волне' },
  'waves.lightSpawnMul':   { hint: 'Множитель спавна на лёгкой волне' },
  'waves.heavySpeedMul':   { hint: 'Множитель скорости на тяжёлой' },
  'waves.lightSpeedMul':   { hint: 'Множитель скорости на лёгкой' },
  'waves.eliteEveryNHeavy':{ hint: 'Каждая N-я тяжёлая волна даёт элитника' },
  'waves.bossFirstWave':   { hint: 'Номер волны первого босса' },
  'waves.bossEveryN':      { hint: 'Каждые N волн появляется босс' },
  'waves.finaleWave':      { hint: 'Номер финальной волны' },
  'waves.preFinaleWaves':  { hint: 'Волны-затишья перед финалом' },
  'waves.finaleBossCount': { hint: 'Сколько боссов одновременно в финале' },
  'waves.finaleShrinkRate':{ hint: 'Скорость сжатия арены во время финала', dir: '↑ сжимается быстрее' },
  'waves.finaleMinScale':  { hint: 'Минимальный масштаб арены (0.35 = 35%)' },

  'economy.killsReward':    { hint: 'Тугриков за убийство' },
  'economy.scoreDivider':   { hint: 'Делитель score для тугриков' },
  'economy.waveReward':     { hint: 'Тугриков за волну' },
  'economy.scorePerOrb':    { hint: 'Очков за XP-сферу' },
  'economy.scorePerKillMul':{ hint: 'Очков за убийство = xp × это × рейтинг DMC' },

  'upgrades.power.factor':     { hint: 'Множитель урона за уровень' },
  'upgrades.power.maxLevel':   { hint: 'Максимум уровней' },
  'upgrades.overclock.factor': { hint: 'Множитель скорости стрельбы' },
  'upgrades.overclock.maxLevel':{ hint: 'Максимум уровней' },
  'upgrades.thrusters.factor': { hint: 'Множитель скорости движения' },
  'upgrades.thrusters.maxLevel':{ hint: 'Максимум уровней' },
  'upgrades.armor.hpAdd':      { hint: 'Прибавка HP за уровень' },
  'upgrades.armor.maxLevel':   { hint: 'Максимум уровней' },
  'upgrades.spread.maxLevel':  { hint: 'Макс. +пуль' },
  'upgrades.pierce.maxLevel':  { hint: 'Макс. пробитий' },
  'upgrades.ricochet.maxLevel':{ hint: 'Макс. рикошетов' },
  'upgrades.magnet.baseAdd':   { hint: 'Прибавка к радиусу сбора' },
  'upgrades.magnet.maxLevel':  { hint: 'Максимум уровней' },
  'upgrades.vacuum.baseAdd':   { hint: 'Прибавка к скорости притягивания' },
  'upgrades.vacuum.maxLevel':  { hint: 'Максимум уровней' },
  'upgrades.nano.regenAdd':    { hint: 'Прибавка HP/сек за уровень' },
  'upgrades.nano.maxLevel':    { hint: 'Максимум уровней' },
  'upgrades.shrine.factor':    { hint: 'Множитель опыта за уровень' },
  'upgrades.shrine.maxLevel':  { hint: 'Максимум уровней' },
  'upgrades.crit.chanceAdd':   { hint: 'Прибавка шанса крита' },
  'upgrades.crit.maxLevel':    { hint: 'Максимум уровней' },
  'upgrades.explosive.maxLevel':{ hint: 'Максимум уровней взрыва' },
  'upgrades.explosive.dmgTbl': { hint: 'Урон взрыва [-, L1, L2, L3]' },
  'upgrades.explosive.radiusTbl':{ hint: 'Радиус взрыва, px' },
  'upgrades.orbital.maxLevel':   { hint: 'Макс. количество шаров' },
  'upgrades.orbital.dmgPerSec':  { hint: 'Средний DPS, для Stats' },
  'upgrades.orbital.hitDmg':     { hint: 'Урон за одно касание шара' },
  'upgrades.orbital.hitCooldown':{ hint: 'Сек между ударами по одному врагу' },
  'upgrades.orbital.knockback':      { hint: 'Импульс отбрасывания, px/сек' },
  'upgrades.orbital.knockbackDecay': { hint: 'Затухание импульса за 1 сек' },
  'upgrades.orbital.knockbackTiltDeg': { hint: 'Наклон врага при ударе, градусов' },
  'upgrades.orbital.knockbackTiltDecay': { hint: 'Скорость выравнивания наклона' },
  'upgrades.orbital.radius':     { hint: 'Радиус орбиты, px' },
  'upgrades.orbital.orbitSpeed': { hint: 'Базовая скорость облёта' },
  'upgrades.orbital.speedPerLevel':{ hint: 'Множитель скорости облёта' },
  'upgrades.orbital.hitR':       { hint: 'Радиус попадания шара' },
  'upgrades.pointblank.boostPerLevel':{ hint: 'Прибавка урона' },
  'upgrades.pointblank.maxLevel':{ hint: 'Максимум уровней' },
  'upgrades.pointblank.radiusTbl':{ hint: 'Радиус действия, px' },
  'upgrades.sandy.maxLevel':   { hint: 'Максимум уровней' },
  'upgrades.sandy.thresholds': { hint: 'Уклонение от N-й пули' },

  'upgrades.cyanPower.factor':       { hint: 'Множитель урона молний за уровень (только CYAN)' },
  'upgrades.cyanPower.maxLevel':     { hint: 'Максимум уровней' },
  'upgrades.cyanMultishot.maxLevel': { hint: 'Макс. уровень TWIN ARCS' },
  'upgrades.cyanMultishot.leadAdd':  { hint: 'Сколько доп. молний мелодии даёт уровень [-, L1, L2, L3, L4]' },
  'upgrades.cyanMultishot.bassAdd':  { hint: 'Сколько доп. бас-молний даёт уровень [-, L1, L2, L3, L4]' },
  'upgrades.cyanRange.factor':       { hint: 'Множитель радиуса за уровень (2.0 = +100%)' },
  'upgrades.cyanChain.maxLevel':     { hint: 'Макс. уровень цепной молнии' },
  'upgrades.cyanChain.bounces':      { hint: 'Отскоков по уровням [-, L1, L2, L3]' },
  'upgrades.cyanChain.damageTbl':    { hint: 'Множитель урона отскока [-, L1, L2, L3]' },
  'upgrades.cyanRange.maxLevel':     { hint: 'Максимум уровней ARC NOVA' },

  'pickups.spawnInterval': { hint: 'Сек между появлениями пикапов' },
  'pickups.maxOnMap':      { hint: 'Макс. пикапов на карте' },
  'pickups.lifetime':      { hint: 'Сколько живёт пикап, сек' },
  'pickups.hasteDur':      { hint: 'Длительность ускорения, сек' },
  'pickups.hasteMult':     { hint: 'Множитель скорости' },
  'pickups.shieldDur':     { hint: 'Длительность щита, сек' },
  'pickups.rageDur':       { hint: 'Длительность ярости, сек' },
  'pickups.rageMult':      { hint: 'Множитель урона при ярости' },
  'pickups.slowmoDur':     { hint: 'Длительность слоу-мо, сек' },
  'pickups.slowmoFactor':  { hint: 'Множитель скорости врагов' },

  'dmc.thresholds':    { hint: 'Пороги комбо для D/C/B/A/S' },
  'dmc.multipliers':   { hint: 'Множитель очков по рейтингу' },
  'dmc.streakFireAt':  { hint: 'Порог комбо для оранжевого стрика' },
  'dmc.streakBlazeAt': { hint: 'Порог комбо для синего стрика' },
  'dmc.streakVoidAt':  { hint: 'Порог комбо для фиолетового стрика' },

  'limits.enemies':   { hint: 'Макс. врагов на арене' },
  'limits.bullets':   { hint: 'Макс. снарядов игрока' },
  'limits.ebullets':  { hint: 'Макс. пуль врагов' },
  'limits.particles': { hint: 'Макс. частиц' },
  'limits.xporbs':    { hint: 'Макс. сфер опыта' },

  'performance.allowBlur':           { hint: 'Включить свечения' },
  'performance.autoLowFX':           { hint: 'Авто-отключение свечений при низком FPS' },
  'performance.autoLowFXThreshold':  { hint: 'Ниже этого FPS включается low FX' },
  'performance.autoHighFXThreshold': { hint: 'Выше этого FPS возвращает свечения' },

  'arena.radiusMul':    { hint: 'Радиус арены = min(W,H) × это' },
  'arena.fireDps':      { hint: 'Урон в сек при касании границы' },
  'arena.shape':        { hint: 'Форма арены: circle / octagon / hexagon / cross / star' },
  'arena.crossArmWidth':{ hint: 'Ширина луча креста (доля радиуса)' },
  'arena.starInnerRatio':{ hint: 'Отношение внутреннего радиуса звезды к внешнему' },

  'skins.base.hiddenUpgrades': { hint: 'Список id апгрейдов, скрываемых для BASE' },
  'skins.cyan.enabled':      { hint: 'Молнии CYAN включены' },
  'skins.cyan.leadPattern':  { hint: 'Паттерн мелодии (синие молнии): 1=нота звучит в этот шаг' },
  'skins.cyan.bassPattern':  { hint: 'Паттерн баса (маджента-молнии): 1=звучит в этот шаг' },
  'skins.cyan.leadCol0':     { hint: 'Цвет синей (мелодия) молнии' },
  'skins.cyan.bassCol0':     { hint: 'Цвет маджента (бас) молнии' },
  'skins.cyan.leadWidthMul': { hint: 'Толщина мелодия-молнии' },
  'skins.cyan.bassWidthMul': { hint: 'Толщина бас-молнии' },
  'skins.cyan.leadTargets':  { hint: 'Базовое число целей мелодии за ноту' },
  'skins.cyan.bassTargets':  { hint: 'Базовое число целей баса за кик' },
  'skins.cyan.leadRange':    { hint: 'Базовый радиус поиска цели, px (до прокачки ARC NOVA)' },
  'skins.cyan.targetCooldown': { hint: 'Кулдаун на врага между молниями одного типа, сек', dir: '↑ реже флипается, но меньше урона' },
  'skins.cyan.hiddenUpgrades':{ hint: 'Список id апгрейдов, скрываемых для CYAN' },
};

function _tuneDeepClone(o) { return JSON.parse(JSON.stringify(o)); }

function _tuneDeepMerge(target, source) {
  for (const k in source) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      _tuneDeepMerge(target[k], source[k]);
    } else target[k] = source[k];
  }
  return target;
}

let TUNE_ORIGINAL;
(function _loadBase() {
  try {
    const raw = localStorage.getItem('ns_tuning_base');
    if (raw) {
      TUNE_ORIGINAL = _tuneDeepMerge(_tuneDeepClone(TUNE_DEFAULTS), JSON.parse(raw));
      console.log('✓ Base tuning loaded from localStorage');
      return;
    }
  } catch (e) { console.warn('Base tuning load error:', e); }
  TUNE_ORIGINAL = _tuneDeepClone(TUNE_DEFAULTS);
})();

let TUNE = _tuneDeepClone(TUNE_ORIGINAL);
(function _loadCurrent() {
  try {
    const raw = localStorage.getItem('ns_tuning');
    if (!raw) return;
    _tuneDeepMerge(TUNE, JSON.parse(raw));
    console.log('✓ Tuning loaded from localStorage');
  } catch (e) { console.warn('Tuning load error:', e); }
})();

function saveTuningToStorage() {
  try { localStorage.setItem('ns_tuning', JSON.stringify(TUNE)); return true; }
  catch (e) { console.warn('Tuning save error:', e); return false; }
}
function resetTuningAll() { TUNE = _tuneDeepClone(TUNE_ORIGINAL); saveTuningToStorage(); }
function setCurrentAsBase() {
  TUNE_ORIGINAL = _tuneDeepClone(TUNE);
  try {
    localStorage.setItem('ns_tuning_base', JSON.stringify(TUNE_ORIGINAL));
    localStorage.removeItem('ns_tuning');
  } catch (e) { console.warn('setCurrentAsBase error:', e); }
}
function clearTuningStorage() {
  try { localStorage.removeItem('ns_tuning'); localStorage.removeItem('ns_tuning_base'); } catch (e) {}
  TUNE_ORIGINAL = _tuneDeepClone(TUNE_DEFAULTS);
  TUNE = _tuneDeepClone(TUNE_ORIGINAL);
}
function getTune(path) {
  const parts = path.split('.'); let cur = TUNE;
  for (const p of parts) { if (cur == null) return undefined; cur = cur[p]; }
  return cur;
}
function getTuneDefault(path) {
  const parts = path.split('.'); let cur = TUNE_ORIGINAL;
  for (const p of parts) { if (cur == null) return undefined; cur = cur[p]; }
  return cur;
}
function setTune(path, value) {
  const parts = path.split('.'); let cur = TUNE;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}
function isTuneChanged(path) {
  const cur = getTune(path); const def = getTuneDefault(path);
  if (Array.isArray(cur) && Array.isArray(def)) return JSON.stringify(cur) !== JSON.stringify(def);
  return cur !== def;
}
function exportTuningDiff() {
  const diff = {};
  function walk(def, cur, prefix) {
    for (const k in cur) {
      const path = prefix ? prefix + '.' + k : k;
      const v = cur[k]; const d = def ? def[k] : undefined;
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(d, v, path);
      else if (Array.isArray(v)) { if (JSON.stringify(v) !== JSON.stringify(d)) diff[path] = v; }
      else { if (d === undefined || d !== v) diff[path] = v; }
    }
  }
  walk(TUNE_ORIGINAL, TUNE, '');
  return diff;
}
function importTuningDiff(diff) {
  if (!diff || typeof diff !== 'object') return false;
  TUNE = _tuneDeepClone(TUNE_ORIGINAL);
  for (const path in diff) setTune(path, diff[path]);
  saveTuningToStorage();
  return true;
}
function downloadTuningFile() {
  const diff = exportTuningDiff();
  const payload = {
    _comment: 'Tuning diff',
    _date: new Date().toISOString(),
    _count: Object.keys(diff).length, diff,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = url; a.download = 'tuning-' + date + '.json';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  return Object.keys(diff).length;
}
function loadTuningFromFile(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result);
      const diff = raw.diff || raw;
      const ok = importTuningDiff(diff);
      if (onDone) onDone(ok, Object.keys(diff).length);
    } catch (e) { if (onDone) onDone(false, 0, e.message); }
  };
  reader.readAsText(file);
}

console.log('✓ tuning.js loaded · hints: ' + Object.keys(TUNE_HINTS).length);