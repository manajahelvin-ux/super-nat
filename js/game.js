'use strict';
/* SUPER-NAT — game.js : boot, loop, waves, HUD, screens, high scores */

const $ = (id) => document.getElementById(id);
const el = {};
let savedThisRun = false;
const WAVE_SUBS = ['THEY ARE COMING', 'HOLD THE LINE', 'INCOMING HORDE', 'STAY ALERT', 'NO RETREAT', 'FEED THEM LEAD'];

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ============================== HIGH SCORES ============================== */

const HS_KEY = 'supernat_scores_v1';

function loadScores() {
  try {
    const v = JSON.parse(localStorage.getItem(HS_KEY) || '[]');
    if (Array.isArray(v)) return v.filter((e) => e && typeof e.s === 'number').slice(0, 8);
  } catch (e) { /* private mode */ }
  return [];
}

function qualifies(score, list) {
  if (score <= 0) return false;
  return list.length < 8 || score > list[list.length - 1].s;
}

function renderScores(listEl, emptyEl, hl) {
  const list = loadScores();
  if (emptyEl) emptyEl.classList.toggle('hidden', list.length > 0);
  let html = '';
  list.forEach((e, i) => {
    html += `<li class="${i === hl ? 'hl' : ''}"><span class="rk">${i + 1}</span><span class="nm">${esc(e.n || 'SURVIVOR')}</span><span class="sc">${fmt(e.s)}</span><span class="wv">W${e.w || 1}</span></li>`;
  });
  listEl.innerHTML = html;
}

function commitScore() {
  if (savedThisRun) return;
  const name = ((el.nameInput.value || '').trim().toUpperCase().slice(0, 10)) || 'SURVIVOR';
  try { localStorage.setItem('supernat_name', name); } catch (e) { /* ok */ }
  const list = loadScores();
  const entry = { n: name, s: Math.round(S.score), w: S.wave, k: S.kills };
  list.push(entry);
  list.sort((a, b) => b.s - a.s);
  const cut = list.slice(0, 8);
  try { localStorage.setItem(HS_KEY, JSON.stringify(cut)); } catch (e) { /* ok */ }
  savedThisRun = true;
  el.btnSaveScore.disabled = true;
  el.btnSaveScore.textContent = 'LOGGED ✓';
  const idx = cut.indexOf(entry);
  renderScores(el.overScores, null, idx);
  renderScores(el.menuScores, el.menuEmpty, -1);
  S.best = Math.max(S.best, Math.round(S.score));
  updateBest();
}

function updateBest() {
  el.menuBest.textContent = S.best > 0 ? 'BEST ' + fmt(S.best) : 'NO RECORDS YET';
  el.bestTag.textContent = S.best > 0 ? 'BEST ' + fmt(S.best) : '';
}

/* ============================== SCREENS ============================== */

const SCREEN_IDS = { menu: 'menuScreen', pause: 'pauseScreen', over: 'overScreen' };

function showScreen(name) {
  for (const k in SCREEN_IDS) el[SCREEN_IDS[k]].classList.toggle('hidden', k !== name);
  const hudVisible = name === null || name === 'pause';
  el.hud.classList.toggle('hidden', !hudVisible);
  document.body.classList.toggle('in-game', name === null);
}

function banner(title, sub) {
  el.bannerTitle.textContent = title;
  el.bannerSub.textContent = sub || '';
  el.banner.classList.remove('show');
  void el.banner.offsetWidth;
  el.banner.classList.add('show');
}

function setPaused(on) {
  if (on && S.mode !== 'playing') return;
  if (!on && S.mode !== 'paused') return;
  S.mode = on ? 'paused' : 'playing';
  showScreen(on ? 'pause' : null);
  Sfx.click();
}

function quitToMenu() {
  S.mode = 'menu';
  S.timeScale = 1;
  enemies.length = 0; bullets.length = 0; acid.length = 0; pickups.length = 0;
  particles.length = 0; floaters.length = 0; markers.length = 0;
  genWorld((Math.random() * 1e9) | 0);
  seedMenu();
  showScreen('menu');
  Sfx.click();
}

/* ============================== WAVES ============================== */

function buildWaveQueue(n) {
  let budget = Math.min(8 + n * 5, 120);
  const q = [];
  let t = 0.3, brutes = 0, guard = 0;
  const maxBrutes = Math.max(1, Math.floor((n - 2) / 2));
  while (budget > 0 && guard++ < 400) {
    const roll = Math.random();
    let type = 'walker';
    if (n >= 4 && roll < 0.15 && brutes < maxBrutes) { type = 'brute'; brutes++; }
    else if (n >= 3 && roll < 0.34) type = 'spitter';
    else if (n >= 2 && roll < 0.63) type = 'runner';
    budget -= ENEMY[type].cost;
    q.push({ type, t });
    t += rand(0.2, 0.95) * clamp(1.2 - n * 0.035, 0.42, 1.2);
  }
  q.sort((a, b) => a.t - b.t);
  return q;
}

function startWave(n) {
  S.wave = n;
  S.wavePhase = 'announce';
  S.waveTimer = 1.15;
  S.spawnClock = 0;
  S.spawnQueue = buildWaveQueue(n);
  banner('WAVE ' + n, pick(WAVE_SUBS));
  Sfx.wave();
}

function updateWaves(dt) {
  if (S.wavePhase === 'announce') {
    S.waveTimer -= dt;
    if (S.waveTimer <= 0) S.wavePhase = 'active';
  } else if (S.wavePhase === 'active') {
    const cap = Math.min(13 + S.wave * 2, 55);
    if (enemies.length + markers.length < cap) {
      S.spawnClock += dt;
      while (S.spawnQueue.length && S.spawnQueue[0].t <= S.spawnClock) {
        const it = S.spawnQueue.shift();
        const pos = pickSpawnPos(S.wave <= 2 ? 290 : 260, 950);
        spawnMarker(it.type, pos.x, pos.y);
      }
    }
    if (!S.spawnQueue.length && !markers.length && !enemies.length) {
      const bonus = 250 * S.wave;
      S.score += bonus;
      banner('WAVE ' + S.wave + ' CLEARED', '+' + fmt(bonus) + ' BONUS');
      Sfx.cleared();
      const a = rand(TAU);
      spawnPickup('med',
        clamp(player.x + Math.cos(a) * 150, 120, world.w - 120),
        clamp(player.y + Math.sin(a) * 150, 120, world.h - 120));
      S.wavePhase = 'clear';
      S.waveTimer = 3.4;
    }
  } else if (S.wavePhase === 'clear') {
    S.waveTimer -= dt;
    if (S.waveTimer <= 0) startWave(S.wave + 1);
  }
}

/* ============================== CAMERA ============================== */

function updateCamera(rdt) {
  let tx, ty;
  if (S.mode === 'menu') {
    S.menuCamT += rdt;
    tx = world.w / 2 + Math.sin(S.menuCamT * 0.1) * 300;
    ty = world.h / 2 + Math.cos(S.menuCamT * 0.07) * 190;
  } else {
    const look = IS_TOUCH ? 40 : 74;
    tx = player.x + Math.cos(player.aim) * look + player.vx * 0.1;
    ty = player.y + Math.sin(player.aim) * look + player.vy * 0.1;
  }
  const k = expDamp(S.mode === 'menu' ? 1.1 : 7, rdt);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;

  const hw = view.w / 2 / cam.zoom, hh = view.h / 2 / cam.zoom;
  cam.x = world.w > hw * 2 ? clamp(cam.x, hw - 40, world.w - hw + 40) : world.w / 2;
  cam.y = world.h > hh * 2 ? clamp(cam.y, hh - 40, world.h - hh + 40) : world.h / 2;

  const zt = S.mode === 'dying' ? 1.16 : 1;
  cam.zoom = lerp(cam.zoom, cam.baseZoom * zt + S.zoomKick, expDamp(4, rdt));
  S.zoomKick *= Math.exp(-3.2 * rdt);
}

/* ============================== HUD ============================== */

const hudCache = { hp: -1, score: '', wave: -1, host: -1, wkey: '', kills: -1, mult: -1, time: -1 };

function resetHudCache() {
  for (const k in hudCache) hudCache[k] = typeof hudCache[k] === 'number' ? -1 : '';
}

function updateHUD(rdt) {
  const p = player;

  const hpPct = clamp(p.hp / CFG.player.hp, 0, 1) * 100;
  el.hpFill.style.width = hpPct + '%';
  el.hpFill.classList.toggle('low', hpPct < 30);
  if (S.hpGhostT > 0) S.hpGhostT -= rdt;
  else if (S.hpGhost > p.hp) S.hpGhost = Math.max(p.hp, S.hpGhost - 46 * rdt);
  el.hpGhost.style.width = clamp(S.hpGhost / CFG.player.hp, 0, 1) * 100 + '%';
  if (hudCache.hp !== p.hp) { hudCache.hp = p.hp; el.hpText.textContent = Math.ceil(p.hp); }

  S.displayScore += (S.score - S.displayScore) * Math.min(1, 12 * rdt);
  if (Math.abs(S.score - S.displayScore) < 1) S.displayScore = S.score;
  const ds = fmt(S.displayScore);
  if (hudCache.score !== ds) { hudCache.score = ds; el.score.textContent = ds; }

  if (hudCache.wave !== S.wave) { hudCache.wave = S.wave; el.waveLabel.textContent = 'WAVE ' + S.wave; }
  const host = enemies.length + markers.length + S.spawnQueue.length;
  if (hudCache.host !== host) {
    hudCache.host = host;
    el.hostiles.textContent = S.wavePhase === 'clear' ? 'AREA CLEAR' : host + ' HOSTILES';
  }

  const wk = p.weapon + ':' + p.ammo;
  if (hudCache.wkey !== wk) {
    hudCache.wkey = wk;
    el.wName.textContent = WEAPONS[p.weapon].name;
    el.wAmmo.textContent = p.ammo === Infinity ? '∞' : p.ammo;
    el.wChip.className = 'weapon-chip w-' + p.weapon;
  }

  const showC = S.mult > 1 && S.streakTimer > 0;
  el.comboWrap.classList.toggle('on', showC);
  if (showC) {
    if (hudCache.mult !== S.mult) {
      hudCache.mult = S.mult;
      el.comboX.textContent = 'x' + S.mult;
      el.comboX.classList.remove('pop');
      void el.comboX.offsetWidth;
      el.comboX.classList.add('pop');
    }
    el.comboFill.style.transform = 'scaleX(' + clamp(S.streakTimer / CFG.comboWindow, 0, 1).toFixed(3) + ')';
  } else hudCache.mult = -1;

  if (hudCache.kills !== S.kills) { hudCache.kills = S.kills; el.killCount.textContent = S.kills + ' KILLS'; }
  const t = Math.floor(S.runTime);
  if (hudCache.time !== t) { hudCache.time = t; el.timer.textContent = pad(t / 60) + ':' + pad(t % 60); }

  if (IS_TOUCH) {
    const ready = p.dashCd <= 0;
    el.btnDash.classList.toggle('ready', ready);
    if (!ready) el.btnDash.style.setProperty('--p', (1 - clamp(p.dashCd / CFG.player.dashCd, 0, 1)).toFixed(3));
  }
}

function updateDmgFx(rdt) {
  S.hurtFlash = Math.max(0, S.hurtFlash - rdt * 2.1);
  const lowHp = player.hp > 0 && player.hp < 30 && !player.dead;
  const crit = lowHp ? 0.2 + Math.sin(S.realTime * 5) * 0.09 : 0;
  el.dmgFx.style.opacity = Math.min(1, S.hurtFlash * 0.9 + crit).toFixed(3);
}

/* ============================== GAME FLOW ============================== */

function seedMenu() {
  for (let i = 0; i < 9; i++) {
    createEnemy(Math.random() < 0.75 ? 'walker' : 'runner', rand(200, world.w - 200), rand(200, world.h - 200));
  }
}

function updateMenuSim(dt) {
  if (enemies.length < 9 && Math.random() < dt * 2) {
    createEnemy(Math.random() < 0.75 ? 'walker' : 'runner', rand(200, world.w - 200), rand(200, world.h - 200));
  }
  updateEnemies(dt);
}

function startGame() {
  enemies.length = 0; bullets.length = 0; acid.length = 0; pickups.length = 0;
  particles.length = 0; floaters.length = 0; markers.length = 0;
  genWorld((Math.random() * 1e9) | 0);
  Object.assign(player, {
    x: world.w / 2, y: world.h / 2, vx: 0, vy: 0, hp: CFG.player.hp,
    weapon: 'pistol', ammo: Infinity, fireCd: 0, dashT: 0, dashCd: 0,
    invuln: 1, adr: 0, recoil: 0, dead: false, muzzle: 0, bob: 0,
  });
  Object.assign(S, {
    score: 0, displayScore: 0, kills: 0, streak: 0, streakTimer: 0, mult: 1, bestMult: 1,
    runTime: 0, timeScale: 1, hitstop: 0, wave: 0, wavePhase: 'idle',
    shakeTrauma: 0, zoomKick: 0, hurtFlash: 0, recordLive: false,
    hpGhost: CFG.player.hp, hpGhostT: 0, touchHintT: IS_TOUCH ? 6 : 0,
  });
  cam.x = player.x; cam.y = player.y; cam.zoom = cam.baseZoom;
  S.mode = 'playing';
  savedThisRun = false;
  resetHudCache();
  showScreen(null);
  startWave(1);
}

function finalizeGameOver() {
  S.mode = 'gameover';
  S.timeScale = 1;
  el.dmgFx.style.opacity = 0;

  el.stScore.textContent = fmt(S.score);
  el.stWave.textContent = S.wave;
  el.stKills.textContent = fmt(S.kills);
  const t = Math.floor(S.runTime);
  el.stTime.textContent = pad(t / 60) + ':' + pad(t % 60);
  el.stMult.textContent = 'x' + S.bestMult;

  const best = loadScores();
  const isRecord = S.score > 0 && S.score > (best[0] ? best[0].s : 0);
  el.recordBadge.classList.toggle('hidden', !isRecord);
  S.best = Math.max(S.best, Math.round(S.score));
  updateBest();

  const q = qualifies(Math.round(S.score), best);
  el.nameRow.classList.toggle('hidden', !q);
  if (q) {
    let ln = 'SURVIVOR';
    try { ln = localStorage.getItem('supernat_name') || 'SURVIVOR'; } catch (e) { /* ok */ }
    el.nameInput.value = ln;
    el.btnSaveScore.disabled = false;
    el.btnSaveScore.textContent = 'LOG RECORD';
  }
  renderScores(el.overScores, null, -1);
  showScreen('over');
}

/* ============================== MAIN LOOP ============================== */

let lastT = -1;

function frame(now) {
  requestAnimationFrame(frame);
  if (lastT < 0) lastT = now;
  let rdt = (now - lastT) / 1000;
  lastT = now;
  if (rdt > 0.1) rdt = 0.1;
  S.realTime += rdt;

  // global keys (work even in overlays)
  const inInput = document.activeElement && document.activeElement.tagName === 'INPUT';
  if (!inInput) {
    if (Input.consumeKey('KeyP') || Input.consumeKey('Escape')) {
      if (S.mode === 'playing') setPaused(true);
      else if (S.mode === 'paused') setPaused(false);
    }
    if (Input.consumeKey('KeyM')) toggleMute();
    if (Input.consumeKey('KeyR') && (S.mode === 'gameover' || S.mode === 'paused')) startGame();
    if (Input.consumeKey('Enter') && (S.mode === 'menu' || S.mode === 'gameover')) startGame();
  }

  let dt = rdt;
  if (S.hitstop > 0) { S.hitstop -= rdt; dt = rdt * 0.02; }
  dt *= S.timeScale;
  S.time += dt;

  if (S.mode === 'playing' || S.mode === 'dying') {
    S.runTime += dt;
    if (S.mode === 'playing') updateWaves(dt);
    updatePlayer(dt);
    updateMarkers(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateAcid(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateFloaters(dt);
    fadeDecals(dt);
    updateAmbient(dt);
    if (S.streakTimer > 0) {
      S.streakTimer -= dt;
      if (S.streakTimer <= 0) { S.streak = 0; S.mult = 1; }
    }
    updateCamera(rdt);
    updateDmgFx(rdt);
    if (S.touchHintT > 0) S.touchHintT -= rdt;
    if (S.mode === 'dying') {
      S.timeScale = lerp(S.timeScale, 0.2, expDamp(6, rdt));
      S.deathT -= rdt;
      if (S.deathT <= 0) finalizeGameOver();
    }
    updateHUD(rdt);
  } else if (S.mode === 'menu') {
    updateMenuSim(dt);
    updateParticles(dt);
    updateAmbient(dt);
    updateCamera(rdt);
  }

  S.shakeTrauma = Math.max(0, S.shakeTrauma - 1.7 * rdt);

  render();
  Input.clearOnce();
}

/* ============================== BOOT ============================== */

function toggleMute() {
  const m = Sfx.toggleMute();
  el.btnMute.textContent = m ? 'SOUND OFF' : 'SOUND ON';
  if (el.btnMute2) el.btnMute2.textContent = m ? 'SOUND OFF' : 'SOUND ON';
}

function resize() {
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  el.canvas.width = Math.round(view.w * view.dpr);
  el.canvas.height = Math.round(view.h * view.dpr);
  el.canvas.style.width = view.w + 'px';
  el.canvas.style.height = view.h + 'px';
  cam.baseZoom = clamp(Math.min(view.w, view.h) / 880, 0.72, IS_TOUCH ? 1.06 : 1.0);
  buildVignette();
  dustMotes = null;
}

let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  ['canvas', 'grain', 'dmgFx', 'hud', 'hpFill', 'hpGhost', 'hpText', 'wName', 'wAmmo', 'wChip',
    'waveLabel', 'hostiles', 'score', 'comboWrap', 'comboX', 'comboFill', 'killCount', 'timer',
    'bestTag', 'btnPause', 'btnDash', 'banner', 'bannerTitle', 'bannerSub',
    'menuScreen', 'btnPlay', 'menuScores', 'menuEmpty', 'menuBest', 'btnMute', 'ctlDesktop', 'ctlTouch',
    'pauseScreen', 'btnResume', 'btnRestart2', 'btnQuit', 'btnMute2',
    'overScreen', 'recordBadge', 'stScore', 'stWave', 'stKills', 'stTime', 'stMult',
    'nameRow', 'nameInput', 'btnSaveScore', 'overScores', 'btnRestart', 'btnMenu',
  ].forEach((id) => { el[id] = $(id); });

  el.canvas = document.getElementById('game');
  ctx = el.canvas.getContext('2d');

  Input.init(el.canvas);
  resize();
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && S.mode === 'playing') setPaused(true);
  });

  el.grain.style.backgroundImage = 'url(' + Spr.grain + ')';

  const top = loadScores();
  S.best = top.length ? top[0].s : 0;
  renderScores(el.menuScores, el.menuEmpty, -1);
  updateBest();

  el.ctlDesktop.classList.toggle('hidden', IS_TOUCH);
  el.ctlTouch.classList.toggle('hidden', !IS_TOUCH);
  el.btnMute.textContent = Sfx.muted ? 'SOUND OFF' : 'SOUND ON';
  el.btnMute2.textContent = Sfx.muted ? 'SOUND OFF' : 'SOUND ON';

  // buttons
  el.btnPlay.addEventListener('click', () => { Sfx.ensure(); Sfx.click(); startGame(); });
  el.btnResume.addEventListener('click', () => { Sfx.ensure(); setPaused(false); });
  el.btnRestart.addEventListener('click', () => { Sfx.ensure(); Sfx.click(); startGame(); });
  el.btnRestart2.addEventListener('click', () => { Sfx.ensure(); Sfx.click(); startGame(); });
  el.btnMenu.addEventListener('click', () => { Sfx.ensure(); quitToMenu(); });
  el.btnQuit.addEventListener('click', () => { Sfx.ensure(); quitToMenu(); });
  el.btnPause.addEventListener('click', () => { Sfx.ensure(); setPaused(true); });
  el.btnMute.addEventListener('click', () => { Sfx.ensure(); toggleMute(); });
  el.btnMute2.addEventListener('click', () => { Sfx.ensure(); toggleMute(); });
  el.btnSaveScore.addEventListener('click', () => { Sfx.ensure(); Sfx.click(); commitScore(); });
  el.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { commitScore(); el.nameInput.blur(); }
    e.stopPropagation();
  });
  el.btnDash.addEventListener('pointerdown', (e) => { e.preventDefault(); Sfx.ensure(); Input.queueDash(); });

  // menu world
  genWorld((Math.random() * 1e9) | 0);
  seedMenu();
  cam.x = world.w / 2; cam.y = world.h / 2; cam.zoom = cam.baseZoom;
  S.mode = 'menu';
  showScreen('menu');

  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', boot);
if (document.readyState !== 'loading') { try { boot(); } catch (e) { console.error(e); } }
