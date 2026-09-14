'use strict';
/* SUPER-NAT — state.js : shared config + mutable state (loaded first) */

const IS_TOUCH =
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
  ('ontouchstart' in window);

const CFG = {
  world: { w: 2400, h: 1500, wall: 46 },
  player: { r: 14, speed: 255, hp: 100, dashCd: 1.5, dashTime: 0.16, dashSpeed: 830 },
  comboWindow: 3.2,
  maxParticles: 650,
};

const WEAPONS = {
  pistol:  { key: 'pistol',  name: 'PISTOL',   rate: 0.20, dmg: 34, speed: 940,  spread: 0.035, pellets: 1, knock: 150, shake: 1.5, push: 6,  ammo: Infinity, tracer: 13, color: '#ffd27a', size: 2.6 },
  smg:     { key: 'smg',     name: 'SMG',      rate: 0.072, dmg: 15, speed: 1000, spread: 0.10,  pellets: 1, knock: 70,  shake: 0.9, push: 3,  ammo: 150, tracer: 15, color: '#ffd27a', size: 2.2 },
  shotgun: { key: 'shotgun', name: 'SHOTGUN',  rate: 0.52, dmg: 13, speed: 860,  spread: 0.20,  pellets: 7, knock: 310, shake: 5.0, push: 70, ammo: 36,  tracer: 9,  color: '#ffc46b', size: 2.2, shell: true },
  rifle:   { key: 'rifle',   name: 'MARKSMAN', rate: 0.40, dmg: 82, speed: 1560, spread: 0.012, pellets: 1, knock: 430, shake: 3.2, push: 30, ammo: 42,  tracer: 28, color: '#ffe9b0', size: 3.0, pierce: 3 },
};

const ENEMY = {
  walker:  { r: 13, hp: 30,  spd: [46, 78],  dmg: 12, score: 100, cost: 1, minWave: 1, sprite: 'walker' },
  runner:  { r: 11, hp: 20,  spd: [140, 182], dmg: 9,  score: 150, cost: 2, minWave: 2, sprite: 'runner' },
  spitter: { r: 13, hp: 46,  spd: [52, 74],  dmg: 12, score: 200, cost: 3, minWave: 3, sprite: 'spitter' },
  brute:   { r: 24, hp: 260, spd: [38, 52],  dmg: 26, score: 500, cost: 6, minWave: 4, sprite: 'brute' },
};

const S = {
  mode: 'boot',            // boot | menu | playing | paused | dying | gameover
  time: 0, realTime: 0, runTime: 0,
  timeScale: 1, hitstop: 0,
  score: 0, displayScore: 0, kills: 0,
  streak: 0, streakTimer: 0, mult: 1, bestMult: 1,
  wave: 0, wavePhase: 'idle', waveTimer: 0, spawnQueue: [], spawnClock: 0, waveCountdown: 0,
  shakeTrauma: 0, zoomKick: 0, hurtFlash: 0, deathT: 0,
  recordLive: false, hpGhost: CFG.player.hp, hpGhostT: 0,
  best: 0, menuCamT: 0, touchHintT: 0,
};

const player = {
  x: 0, y: 0, vx: 0, vy: 0, r: CFG.player.r, hp: CFG.player.hp,
  aim: -TAU / 4, weapon: 'pistol', ammo: Infinity, fireCd: 0,
  dashT: 0, dashCd: 0, dvx: 0, dvy: 0, invuln: 0, adr: 0,
  recoil: 0, dead: false, bob: 0, lastDmg: -99, muzzle: 0,
};

const cam = { x: 0, y: 0, zoom: 1, baseZoom: 1 };

const world = {
  w: CFG.world.w, h: CFG.world.h,
  obstacles: [], spawnPts: [], fog: [],
  ground: null, decal: null, dctx: null, decalFadeT: 0,
};

const enemies = [];
const bullets = [];
const acid = [];
const pickups = [];
const particles = [];
const floaters = [];
const markers = [];   // enemy spawn-in markers

const view = { w: 0, h: 0, dpr: 1 };
let ctx = null;
