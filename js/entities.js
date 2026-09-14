'use strict';
/* SUPER-NAT — entities.js : player, enemies, bullets, pickups, particles, floaters */

/* ============================== FX SPAWNERS ============================== */

function addP(p) {
  if (particles.length >= CFG.maxParticles) {
    particles[(Math.random() * particles.length) | 0] = p; // recycle random
    return;
  }
  p.age = 0;
  particles.push(p);
}

function addFloater(x, y, txt, color, size = 15) {
  floaters.push({ x, y, txt, color, size, life: 0.9, max: 0.9 });
}

function bloodBurst(x, y, dir, n, big) {
  for (let i = 0; i < n; i++) {
    const a = dir + rand(-0.7, 0.7);
    const sp = rand(60, big ? 420 : 300);
    addP({
      type: 'blood', x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: rand(0.25, 0.6), max: 0.6,
      size: rand(1.6, big ? 4.4 : 3.2), color: Math.random() < 0.5 ? '#8f1410' : '#6e1410',
      drag: 4, stamp: Math.random() < 0.6,
    });
  }
}

function gibBurst(x, y, dir, n) {
  for (let i = 0; i < n; i++) {
    const a = dir + rand(-1.1, 1.1);
    const sp = rand(120, 380);
    addP({
      type: 'gib', x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: rand(0.5, 0.9), max: 0.9,
      size: rand(2.4, 5), color: Math.random() < 0.6 ? '#7c1712' : '#5a100c',
      rot: rand(TAU), vr: rand(-9, 9), drag: 3.2,
      z: rand(2, 10), vz: rand(60, 200), bounces: 0,
    });
  }
}

function dustPuff(x, y, n, spd = 70) {
  for (let i = 0; i < n; i++) {
    const a = rand(TAU);
    addP({
      type: 'smoke', x: x + rand(-6, 6), y: y + rand(-6, 6),
      vx: Math.cos(a) * rand(10, spd), vy: Math.sin(a) * rand(10, spd),
      life: rand(0.4, 0.9), max: 0.9,
      size: rand(5, 12), color: 'rgba(120,104,80,', drag: 2.5, grow: 16,
    });
  }
}

function sparkBurst(x, y, dir, n) {
  for (let i = 0; i < n; i++) {
    const a = dir + rand(-0.9, 0.9);
    const sp = rand(120, 420);
    addP({
      type: 'spark', x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: rand(0.1, 0.28), max: 0.28,
      size: rand(1, 2), color: '#ffcf7a', drag: 5,
    });
  }
}

function ringFx(x, y, color, from = 6, to = 42, life = 0.35) {
  addP({ type: 'ring', x, y, vx: 0, vy: 0, life, max: life, size: from, to, color, grow: 0 });
}

function addTrauma(v) { S.shakeTrauma = Math.min(1, S.shakeTrauma + v); }

/* ============================== PLAYER ============================== */

function updatePlayer(dt) {
  const p = player;
  if (p.dead) return;

  p.invuln -= dt; p.dashCd -= dt; p.fireCd -= dt; p.adr -= dt; p.recoil *= Math.exp(-8 * dt); p.muzzle *= Math.exp(-14 * dt);

  const mv = Input.moveVec();
  const speed = CFG.player.speed * (p.adr > 0 ? 1.28 : 1);
  const k = expDamp(11, dt);
  p.vx = lerp(p.vx, mv.x * speed * mv.m, k);
  p.vy = lerp(p.vy, mv.y * speed * mv.m, k);
  p.moving = Math.hypot(p.vx, p.vy) / CFG.player.speed;

  // dash
  if (Input.consumeDash() && p.dashCd <= 0 && mv.m > 0 && S.mode === 'playing') {
    p.dashT = CFG.player.dashTime;
    p.dashCd = CFG.player.dashCd;
    p.invuln = Math.max(p.invuln, 0.28);
    p.dvx = mv.x * CFG.player.dashSpeed;
    p.dvy = mv.y * CFG.player.dashSpeed;
    Sfx.dash();
    addTrauma(0.12);
    dustPuff(p.x, p.y, 5, 110);
  }

  if (p.dashT > 0) {
    p.dashT -= dt;
    p.vx = p.dvx; p.vy = p.dvy;
    addP({ type: 'trail', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.24, max: 0.24, size: 13, color: 'amber' });
  }

  p.x += p.vx * dt;
  p.y += p.vy * dt;
  resolveObstacles(p);

  p.bob += dt * (6 + p.moving * 8);

  // aim
  if (IS_TOUCH) {
    const a = Input.aimInfo();
    if (a.active) p.aim = Math.atan2(a.y, a.x);
    else if (mv.m > 0.2) p.aim = Math.atan2(mv.y, mv.x);
  } else {
    const wx = cam.x + (Input.mouse.x - view.w / 2) / cam.zoom;
    const wy = cam.y + (Input.mouse.y - view.h / 2) / cam.zoom;
    p.aim = Math.atan2(wy - p.y, wx - p.x);
  }

  // adrenaline shimmer
  if (p.adr > 0 && Math.random() < dt * 30) {
    addP({ type: 'glow', x: p.x + rand(-10, 10), y: p.y + rand(-10, 10), vx: 0, vy: -30, life: 0.4, max: 0.4, size: 7, color: 'gold', grow: -8 });
  }

  // fire
  if (Input.firing() && p.fireCd <= 0 && S.mode === 'playing') fireWeapon();
}

function fireWeapon() {
  const p = player;
  const w = WEAPONS[p.weapon];
  p.fireCd = w.rate * (p.adr > 0 ? 0.6 : 1);
  const mx = p.x + Math.cos(p.aim) * (p.r + 12);
  const my = p.y + Math.sin(p.aim) * (p.r + 12);

  for (let i = 0; i < w.pellets; i++) {
    const a = p.aim + rand(-w.spread, w.spread);
    const spd = w.speed * rand(0.92, 1.1);
    bullets.push({
      x: mx, y: my,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      dmg: w.dmg, knock: w.knock, dir: a,
      pierce: w.pierce || 0, hitIds: w.pierce ? [] : null,
      life: 0.9, color: w.color, tracer: w.tracer, size: w.size,
    });
  }

  // recoil + fx
  p.vx -= Math.cos(p.aim) * w.push;
  p.vy -= Math.sin(p.aim) * w.push;
  p.recoil = Math.min(1, p.recoil + 0.45);
  p.muzzle = 1;
  addTrauma(w.shake / 26);
  addP({ type: 'flash', x: mx, y: my, vx: 0, vy: 0, life: 0.055, max: 0.055, size: 14 + w.shake * 3, rot: p.aim, color: 'amber' });
  addP({ type: 'smoke', x: mx, y: my, vx: Math.cos(p.aim) * 40 + rand(-15, 15), vy: Math.sin(p.aim) * 40 + rand(-15, 15), life: 0.45, max: 0.45, size: 4, color: 'rgba(150,135,110,', drag: 2, grow: 10 });
  // shell casing
  const ca = p.aim + Math.PI / 2 + rand(-0.4, 0.4);
  addP({
    type: 'casing', x: p.x + Math.cos(p.aim) * 6, y: p.y + Math.sin(p.aim) * 6,
    vx: Math.cos(ca) * rand(70, 150) + p.vx * 0.4, vy: Math.sin(ca) * rand(70, 150) + p.vy * 0.4,
    life: 1.4, max: 1.4, size: 2, color: w.shell ? '#c46a3a' : '#d9a441',
    rot: rand(TAU), vr: rand(-14, 14), drag: 1.5, z: 8, vz: rand(90, 170), bounces: 0,
  });
  Sfx.shoot(p.weapon);

  if (p.ammo !== Infinity) {
    p.ammo--;
    if (p.ammo <= 0) {
      addFloater(p.x, p.y - 26, 'OUT OF AMMO', '#ff6a4a', 13);
      p.weapon = 'pistol'; p.ammo = Infinity;
      Sfx.empty();
    }
  }
}

function hurtPlayer(dmg, fx, fy) {
  const p = player;
  if (p.invuln > 0 || p.dead || S.mode !== 'playing') return;
  p.hp -= dmg;
  p.invuln = 0.55;
  p.lastDmg = S.runTime;
  S.hurtFlash = 1;
  S.hpGhostT = 0.7;
  addTrauma(0.4);
  S.streak = 0; S.mult = 1;
  const a = angTo(fx, fy, p.x, p.y);
  p.vx += Math.cos(a) * 190;
  p.vy += Math.sin(a) * 190;
  bloodBurst(p.x, p.y, a, 8, false);
  Sfx.hurt();
  if (p.hp <= 0) { p.hp = 0; startDeath(); }
}

function startDeath() {
  const p = player;
  p.dead = true;
  S.mode = 'dying';
  S.deathT = 1.6;
  S.timeScale = 0.24;
  addTrauma(1);
  S.zoomKick = 0.1;
  bloodBurst(p.x, p.y, rand(TAU), 26, true);
  gibBurst(p.x, p.y, rand(TAU), 8);
  stampBlood(p.x, p.y, 0, 26);
  ringFx(p.x, p.y, 'rgba(200,40,30,0.8)', 10, 90, 0.5);
  Sfx.boom();
  Sfx.over();
}

/* ============================== ENEMIES ============================== */

function spawnMarker(type, x, y) {
  markers.push({ x, y, t: 0.8, type });
}

function pickSpawnPos(minD, maxD) {
  const cands = [];
  for (const pt of world.spawnPts) {
    const d = Math.hypot(pt.x - player.x, pt.y - player.y);
    if (d > minD && d < maxD) cands.push(pt);
  }
  const arr = cands.length ? cands : world.spawnPts;
  const pt = pick(arr);
  return { x: pt.x + rand(-24, 24), y: pt.y + rand(-24, 24) };
}

function createEnemy(type, x, y) {
  const d = ENEMY[type];
  const hpMul = 1 + Math.max(0, S.wave - 1) * 0.045;
  enemies.push({
    type, x, y, vx: 0, vy: 0, r: d.r,
    hp: d.hp * hpMul, maxHp: d.hp * hpMul,
    spd: rand(d.spd[0], d.spd[1]) * (1 + Math.max(0, S.wave - 1) * 0.012),
    angle: rand(TAU), hitFlash: 0, atkCd: rand(0.4, 1),
    kx: 0, ky: 0, stun: 0,
    lungeT: 0, lungeCd: rand(1.4, 3.2), lx: 0, ly: 0, tell: 0,
    spitCd: rand(1.2, 2.6),
    wob: rand(TAU), variant: (Math.random() * 4) | 0,
    wt: null, dead: false,
  });
}

function updateMarkers(dt) {
  for (let i = markers.length - 1; i >= 0; i--) {
    const m = markers[i];
    m.t -= dt;
    if (Math.random() < dt * 22) dustPuff(m.x + rand(-14, 14), m.y + rand(-14, 14), 1, 26);
    if (m.t <= 0) {
      createEnemy(m.type, m.x, m.y);
      dustPuff(m.x, m.y, 6, 90);
      markers.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  const playing = S.mode === 'playing';
  const targetPlayer = playing || S.mode === 'dying';

  // spatial hash for separation
  const grid = new Map();
  const CS = 76;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const key = ((e.x / CS) | 0) * 4096 + ((e.y / CS) | 0);
    let arr = grid.get(key);
    if (!arr) { arr = []; grid.set(key, arr); }
    arr.push(e);
  }

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    e.hitFlash -= dt; e.atkCd -= dt; e.stun -= dt;

    // target
    let tx, ty;
    if (targetPlayer) { tx = player.x; ty = player.y; }
    else {
      if (!e.wt || dist2(e.x, e.y, e.wt.x, e.wt.y) < 40 * 40) {
        e.wt = { x: rand(120, world.w - 120), y: rand(120, world.h - 120) };
      }
      tx = e.wt.x; ty = e.wt.y;
    }
    const dx = tx - e.x, dy = ty - e.y;
    const d = Math.hypot(dx, dy) || 1;

    let sp = e.spd;
    let mvx = dx / d, mvy = dy / d;

    // type behavior
    if (e.type === 'runner' && playing) {
      e.lungeCd -= dt;
      if (e.lungeT > 0) {
        e.lungeT -= dt;
        mvx = e.lx; mvy = e.ly;
        sp = 560;
        if (e.lungeT <= 0) e.stun = 0.3;
      } else if (e.tell > 0) {
        e.tell -= dt;
        sp = 24;
        if (e.tell <= 0) { e.lungeT = 0.4; e.lx = dx / d; e.ly = dy / d; Sfx.lunge(); }
      } else if (e.lungeCd <= 0 && d < 300) {
        e.tell = 0.28;
        e.lungeCd = rand(2.4, 4.2);
      }
    }
    if (e.type === 'spitter' && playing) {
      e.spitCd -= dt;
      if (d < 190) { mvx = -mvx; mvy = -mvy; sp = e.spd * 0.8; }
      else if (d < 330) sp = 0;
      if (e.spitCd <= 0 && d < 560) {
        e.spitCd = rand(2.2, 3.4);
        if (losClear(e.x, e.y, player.x, player.y)) spawnAcid(e);
      }
    }
    if (e.stun > 0) sp = 0;

    // organic wobble
    e.wob += dt * (e.type === 'runner' ? 10 : e.type === 'brute' ? 3 : 5.5);
    const wobAmp = e.type === 'walker' ? 0.42 : e.type === 'brute' ? 0.12 : 0.16;
    const ma = Math.atan2(mvy, mvx) + Math.sin(e.wob) * wobAmp;

    let vx = Math.cos(ma) * sp;
    let vy = Math.sin(ma) * sp;

    // separation
    let px = 0, py = 0;
    const gx = (e.x / CS) | 0, gy = (e.y / CS) | 0;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const arr = grid.get((gx + ox) * 4096 + (gy + oy));
      if (!arr) continue;
      for (let j = 0; j < arr.length; j++) {
        const n = arr[j];
        if (n === e) continue;
        const ddx = e.x - n.x, ddy = e.y - n.y;
        const dd = ddx * ddx + ddy * ddy;
        const rr = e.r + n.r + 4;
        if (dd < rr * rr && dd > 0.01) {
          const dl = Math.sqrt(dd);
          const q = (rr - dl) / rr;
          px += (ddx / dl) * q; py += (ddy / dl) * q;
        }
      }
    }
    vx += px * 105; vy += py * 105;

    e.x += (vx + e.kx) * dt;
    e.y += (vy + e.ky) * dt;
    e.kx *= Math.exp(-7 * dt); e.ky *= Math.exp(-7 * dt);

    // facing
    const spd2 = vx * vx + vy * vy;
    if (spd2 > 4) {
      const want = Math.atan2(vy, vx);
      e.angle += angDiff(e.angle, want) * Math.min(1, 9 * dt);
    }

    resolveObstacles(e);

    // attack player
    if (playing && !player.dead && d < e.r + player.r + 7 && e.atkCd <= 0) {
      e.atkCd = 0.9;
      hurtPlayer(ENEMY[e.type].dmg, e.x, e.y);
      e.kx -= (dx / d) * 90; e.ky -= (dy / d) * 90;
    }
  }

  // compact dead
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].dead) enemies.splice(i, 1);
  }
}

function damageEnemy(e, dmg, dir, knock) {
  if (e.dead) return;
  e.hp -= dmg;
  e.hitFlash = 0.09;
  e.stun = Math.max(e.stun, 0.07);
  const kf = e.type === 'brute' ? 0.22 : 1;
  e.kx += Math.cos(dir) * knock * kf;
  e.ky += Math.sin(dir) * knock * kf;
  bloodBurst(e.x + Math.cos(dir) * e.r * 0.4, e.y + Math.sin(dir) * e.r * 0.4, dir, 3, false);
  Sfx.hit();
  if (e.hp <= 0) killEnemy(e, dir);
}

function killEnemy(e, dir) {
  e.dead = true;
  S.kills++;
  const base = ENEMY[e.type].score;
  S.streak++;
  S.streakTimer = CFG.comboWindow;
  const newMult = Math.min(9, 1 + Math.floor(S.streak / 4));
  if (newMult > S.mult) {
    S.mult = newMult;
    S.bestMult = Math.max(S.bestMult, newMult);
    Sfx.combo(newMult);
    addFloater(e.x, e.y - 20, 'x' + newMult + ' COMBO', '#ffe9b0', 14 + newMult);
  }
  const gain = base * S.mult;
  S.score += gain;
  addFloater(e.x, e.y, '+' + fmt(gain), '#ffd27a', 13 + Math.min(8, S.mult));
  if (S.mult >= 4) addFloater(e.x, e.y + 14, 'x' + S.mult, '#ff9a4d', 11);

  const big = e.type === 'brute';
  stampCorpse(e);
  bloodBurst(e.x, e.y, dir, big ? 22 : 9, big);
  gibBurst(e.x, e.y, dir, big ? 9 : 4);
  ringFx(e.x, e.y, 'rgba(180,30,20,0.5)', e.r * 0.6, e.r * 2.4, 0.3);
  S.hitstop = big ? 0.085 : 0.032;
  addTrauma(big ? 0.5 : 0.16);
  if (big) S.zoomKick = 0.045;
  Sfx.kill(big);
  dropRoll(e);

  if (S.best > 0 && S.score > S.best && !S.recordLive) {
    S.recordLive = true;
    addFloater(player.x, player.y - 44, 'NEW RECORD!', '#7ef0c9', 18);
    Sfx.record();
  }
}

function dropRoll(e) {
  if (S.mode !== 'playing') return;
  const pity = player.hp < 40;
  const r = Math.random();
  if (e.type === 'brute') {
    spawnPickup(r < 0.45 ? 'med' : r < 0.85 ? 'weapon' : 'adr', e.x, e.y);
    return;
  }
  const medC = pity ? 0.15 : 0.05;
  const wpnC = medC + 0.075;
  const adrC = wpnC + 0.035;
  if (r < medC) spawnPickup('med', e.x, e.y);
  else if (r < wpnC) spawnPickup('weapon', e.x, e.y);
  else if (r < adrC) spawnPickup('adr', e.x, e.y);
}

/* ============================== BULLETS ============================== */

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.life -= dt;
    const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    let dead = b.life <= 0;

    if (!dead) {
      const o = bulletHitsObstacle(b.x, b.y, nx, ny);
      if (o) {
        sparkBurst(nx, ny, b.dir + Math.PI + rand(-0.6, 0.6), 4);
        dead = true;
      }
    }

    if (!dead) {
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (e.dead) continue;
        if (b.hitIds && b.hitIds.indexOf(e) !== -1) continue;
        if (segCircle(b.x, b.y, nx, ny, e.x, e.y, e.r + 2)) {
          damageEnemy(e, b.dmg, b.dir, b.knock);
          if (b.pierce > 0) { b.pierce--; b.hitIds.push(e); }
          else { dead = true; }
          break;
        }
      }
    }

    if (dead) { bullets[i] = bullets[bullets.length - 1]; bullets.pop(); continue; }
    b.x = nx; b.y = ny;
  }
}

function spawnAcid(e) {
  const a = angTo(e.x, e.y, player.x, player.y) + rand(-0.09, 0.09);
  acid.push({
    x: e.x + Math.cos(a) * (e.r + 6), y: e.y + Math.sin(a) * (e.r + 6),
    vx: Math.cos(a) * 300, vy: Math.sin(a) * 300,
    life: 2.2, wob: rand(TAU),
  });
  Sfx.spit();
  addP({ type: 'flash', x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r, vx: 0, vy: 0, life: 0.08, max: 0.08, size: 10, rot: a, color: 'green' });
}

function updateAcid(dt) {
  for (let i = acid.length - 1; i >= 0; i--) {
    const a = acid[i];
    a.life -= dt;
    a.wob += dt * 14;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    let dead = a.life <= 0;

    if (!dead && bulletHitsObstacle(a.x - a.vx * dt, a.y - a.vy * dt, a.x, a.y)) dead = true;

    if (!dead && !player.dead && S.mode === 'playing') {
      if (dist2(a.x, a.y, player.x, player.y) < (player.r + 6) * (player.r + 6)) {
        if (player.invuln <= 0) hurtPlayer(16, a.x, a.y);
        dead = true;
      }
    }

    if (dead) {
      for (let k = 0; k < 5; k++) {
        const an = rand(TAU);
        addP({ type: 'acid', x: a.x, y: a.y, vx: Math.cos(an) * rand(30, 120), vy: Math.sin(an) * rand(30, 120), life: rand(0.2, 0.45), max: 0.45, size: rand(1.5, 3.2), color: '#9fe06a', drag: 4 });
      }
      acid[i] = acid[acid.length - 1]; acid.pop();
    }
  }
}

/* ============================== PICKUPS ============================== */

function spawnPickup(kind, x, y) {
  let spr = kind;
  if (kind === 'weapon') spr = pick(['smg', 'shotgun', 'rifle']);
  pickups.push({ kind: spr, x, y, t: rand(TAU), life: 26 });
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    pk.t += dt; pk.life -= dt;
    if (pk.life <= 0) { pickups.splice(i, 1); continue; }
    if (S.mode !== 'playing' || player.dead) continue;
    const d2p = dist2(pk.x, pk.y, player.x, player.y);
    if (d2p < 140 * 140) {
      const d = Math.sqrt(d2p) || 1;
      const pull = 300 * (1 - d / 140) + 60;
      pk.x += ((player.x - pk.x) / d) * pull * dt;
      pk.y += ((player.y - pk.y) / d) * pull * dt;
    }
    if (d2p < (player.r + 13) * (player.r + 13)) {
      collectPickup(pk);
      pickups.splice(i, 1);
    }
  }
}

function collectPickup(pk) {
  const p = player;
  if (pk.kind === 'med') {
    if (p.hp >= CFG.player.hp) {
      S.score += 50;
      addFloater(p.x, p.y - 26, '+50', '#7ef0c9', 13);
    } else {
      p.hp = Math.min(CFG.player.hp, p.hp + 35);
      addFloater(p.x, p.y - 26, '+35 HP', '#7ef0c9', 15);
    }
    ringFx(p.x, p.y, 'rgba(126,240,201,0.7)', 8, 46, 0.35);
    Sfx.pickup('med');
  } else if (pk.kind === 'adr') {
    p.adr = 6.5;
    addFloater(p.x, p.y - 26, 'ADRENALINE!', '#ffd75e', 16);
    ringFx(p.x, p.y, 'rgba(255,215,94,0.8)', 8, 60, 0.4);
    Sfx.pickup('adr');
    addTrauma(0.15);
  } else {
    const w = WEAPONS[pk.kind];
    if (p.weapon === pk.kind && p.ammo !== Infinity) {
      p.ammo += Math.ceil(w.ammo * 0.5);
      addFloater(p.x, p.y - 26, w.name + ' +' + Math.ceil(w.ammo * 0.5), '#ffd27a', 14);
    } else {
      p.weapon = pk.kind;
      p.ammo = w.ammo;
      addFloater(p.x, p.y - 26, w.name + ' ACQUIRED', '#ffd27a', 16);
    }
    ringFx(p.x, p.y, 'rgba(255,210,122,0.7)', 8, 50, 0.35);
    Sfx.pickup('weapon');
  }
}

/* ============================== PARTICLES & FLOATERS ============================== */

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      if (p.type === 'blood' && p.stamp) stampBlood(p.x, p.y, Math.atan2(p.vy, p.vx), p.size * 0.55);
      particles[i] = particles[particles.length - 1];
      particles.pop();
      continue;
    }
    if (p.drag) { const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; }
    if (p.vr) p.rot += p.vr * dt;
    if (p.grow) p.size += p.grow * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.type === 'casing' || p.type === 'gib') {
      p.vz -= 760 * dt;
      p.z += p.vz * dt;
      if (p.z < 0) {
        p.z = 0;
        p.vz *= -0.42;
        p.vx *= 0.6; p.vy *= 0.6;
        p.bounces = (p.bounces || 0) + 1;
        if (p.type === 'gib' && p.bounces < 3) stampBlood(p.x, p.y, 0, p.size * 0.5);
        if (Math.abs(p.vz) < 30) p.vz = 0;
      }
    }
  }
}

function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= dt;
    f.y -= 34 * dt;
    if (f.life <= 0) floaters.splice(i, 1);
  }
}
