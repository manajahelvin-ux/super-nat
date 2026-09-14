'use strict';
/* SUPER-NAT — world.js : arena generation, ground art, blood decals, obstacle collision */

function genWorld(seed) {
  const R = mulberry32(seed);
  world.w = CFG.world.w;
  world.h = CFG.world.h;

  /* ----- static ground art ----- */
  const g = mk(world.w, world.h, () => {});
  const x = g.getContext('2d');

  // base
  x.fillStyle = '#171310';
  x.fillRect(0, 0, world.w, world.h);

  // large mottling
  const blotches = ['#1d1913', '#13100c', '#211b14', '#0f0d0a', '#1a1610'];
  for (let i = 0; i < 170; i++) {
    const bx = R() * world.w, by = R() * world.h, br = 60 + R() * 240;
    const gr = x.createRadialGradient(bx, by, 0, bx, by, br);
    const col = blotches[(R() * blotches.length) | 0];
    gr.addColorStop(0, col + '');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = 0.5;
    x.fillStyle = gr;
    circle(x, bx, by, br); x.fill();
  }
  x.globalAlpha = 1;

  // roads (crossing)
  const roadH = { y: world.h * 0.52, w: 200 };
  const roadV = { x: world.w * 0.5, w: 170 };
  x.fillStyle = 'rgba(38,33,26,0.9)';
  x.fillRect(0, roadH.y - roadH.w / 2, world.w, roadH.w);
  x.fillRect(roadV.x - roadV.w / 2, 0, roadV.w, world.h);
  // worn edges
  x.strokeStyle = 'rgba(10,8,6,0.7)'; x.lineWidth = 3;
  x.strokeRect(-4, roadH.y - roadH.w / 2, world.w + 8, roadH.w);
  x.strokeRect(roadV.x - roadV.w / 2, -4, roadV.w, world.h + 8);
  // faded lane dashes
  x.strokeStyle = 'rgba(210,160,70,0.14)'; x.lineWidth = 6;
  x.setLineDash([34, 46]);
  x.beginPath(); x.moveTo(0, roadH.y); x.lineTo(world.w, roadH.y); x.stroke();
  x.beginPath(); x.moveTo(roadV.x, 0); x.lineTo(roadV.x, world.h); x.stroke();
  x.setLineDash([]);

  // cracks
  x.strokeStyle = 'rgba(8,6,5,0.85)';
  for (let i = 0; i < 70; i++) {
    let cx = R() * world.w, cy = R() * world.h;
    x.lineWidth = 0.8 + R() * 1.6;
    x.beginPath(); x.moveTo(cx, cy);
    const segs = 3 + (R() * 4) | 0;
    let a = R() * TAU;
    for (let s = 0; s < segs; s++) {
      a += (R() - 0.5) * 1.6;
      const l = 14 + R() * 42;
      cx += Math.cos(a) * l; cy += Math.sin(a) * l;
      x.lineTo(cx, cy);
    }
    x.stroke();
  }

  // oil stains
  for (let i = 0; i < 26; i++) {
    const sx = R() * world.w, sy = R() * world.h, sr = 12 + R() * 34;
    x.fillStyle = 'rgba(8,7,6,0.5)';
    x.beginPath(); x.ellipse(sx, sy, sr, sr * (0.5 + R() * 0.5), R() * TAU, 0, TAU); x.fill();
  }

  // gravel speckle
  const specks = ['#3a352c', '#2c2822', '#454035', '#24211c'];
  for (let i = 0; i < 1100; i++) {
    x.fillStyle = specks[(R() * specks.length) | 0];
    x.globalAlpha = 0.3 + R() * 0.3;
    x.fillRect(R() * world.w, R() * world.h, 1 + R() * 2, 1 + R() * 2);
  }
  x.globalAlpha = 1;

  // scattered debris
  for (let i = 0; i < 90; i++) {
    x.save();
    x.translate(R() * world.w, R() * world.h);
    x.rotate(R() * TAU);
    x.fillStyle = ['rgba(70,60,45,0.5)', 'rgba(90,80,60,0.4)', 'rgba(50,45,38,0.5)'][(R() * 3) | 0];
    x.fillRect(-4 - R() * 5, -1.5, 8 + R() * 10, 3);
    x.restore();
  }

  // border barricade strip
  const wl = CFG.world.wall;
  x.fillStyle = '#1f1b16';
  x.fillRect(0, 0, world.w, wl); x.fillRect(0, world.h - wl, world.w, wl);
  x.fillRect(0, 0, wl, world.h); x.fillRect(world.w - wl, 0, wl, world.h);
  // hazard stripes
  x.save();
  x.globalAlpha = 0.22;
  x.fillStyle = '#d99a3d';
  for (let i = -wl; i < world.w + world.h; i += 46) {
    x.save(); x.translate(i, 0); x.rotate(-0.7);
    x.fillRect(0, -14, 18, 30);
    x.restore();
    x.save(); x.translate(i, world.h); x.rotate(-0.7);
    x.fillRect(0, -14, 18, 30);
    x.restore();
  }
  x.restore();
  // welded plates
  x.fillStyle = 'rgba(0,0,0,0.35)';
  for (let i = 0; i < 40; i++) {
    const side = (R() * 4) | 0;
    let px, py;
    if (side === 0) { px = R() * world.w; py = R() * wl; }
    else if (side === 1) { px = R() * world.w; py = world.h - R() * wl; }
    else if (side === 2) { px = R() * wl; py = R() * world.h; }
    else { px = world.w - R() * wl; py = R() * world.h; }
    x.fillRect(px, py, 12 + R() * 20, 6 + R() * 10);
  }
  // inner rust line
  x.strokeStyle = 'rgba(150,80,30,0.4)'; x.lineWidth = 3;
  x.strokeRect(wl, wl, world.w - wl * 2, world.h - wl * 2);

  world.ground = g;

  /* ----- decal layer ----- */
  world.decal = mk(world.w, world.h, () => {});
  world.dctx = world.decal.getContext('2d');
  world.decalFadeT = 0;

  /* ----- obstacles ----- */
  world.obstacles = [];
  const wl2 = CFG.world.wall;
  world.obstacles.push({ x: -80, y: -80, w: world.w + 160, h: 80 + wl2, wall: true });            // top
  world.obstacles.push({ x: -80, y: world.h - wl2, w: world.w + 160, h: 80 + wl2, wall: true });   // bottom
  world.obstacles.push({ x: -80, y: -80, w: 80 + wl2, h: world.h + 160, wall: true });             // left
  world.obstacles.push({ x: world.w - wl2, y: -80, w: 80 + wl2, h: world.h + 160, wall: true });   // right

  const cx = world.w / 2, cy = world.h / 2;
  const overlaps = (o) => world.obstacles.some((b) =>
    !(o.x > b.x + b.w + 30 || o.x + o.w + 30 < b.x || o.y > b.y + b.h + 30 || o.y + o.h + 30 < b.y));

  // wrecked cars
  const carCount = 9 + ((R() * 3) | 0);
  for (let i = 0; i < carCount; i++) {
    for (let t = 0; t < 40; t++) {
      const onRoadH = R() < 0.4, onRoadV = !onRoadH && R() < 0.4;
      let px, py, ang;
      if (onRoadH) { px = 140 + R() * (world.w - 420); py = roadH.y + (R() - 0.5) * 120; ang = (R() < 0.5 ? 0 : Math.PI); }
      else if (onRoadV) { px = roadV.x + (R() - 0.5) * 90; py = 140 + R() * (world.h - 420); ang = Math.PI / 2 + (R() < 0.5 ? 0 : Math.PI); }
      else { px = 140 + R() * (world.w - 420); py = 140 + R() * (world.h - 420); ang = (R() * 4 | 0) * (Math.PI / 2); }
      const v = (R() * 3) | 0;
      const hor = Math.abs(Math.sin(ang)) < 0.5;
      const w = hor ? 128 : 56, h = hor ? 56 : 128;
      const o = { x: px - w / 2, y: py - h / 2, w, h, spr: Spr.cars[v], ang, kind: 'car', shadow: 20 };
      if (dist2(px, py, cx, cy) < 260 * 260) continue;
      if (overlaps(o)) continue;
      world.obstacles.push(o);
      break;
    }
  }

  // rubble piles
  const rubCount = 6 + ((R() * 3) | 0);
  for (let i = 0; i < rubCount; i++) {
    for (let t = 0; t < 40; t++) {
      const px = 160 + R() * (world.w - 380), py = 160 + R() * (world.h - 380);
      const w = 84 + R() * 50, h = 64 + R() * 40;
      const o = { x: px - w / 2, y: py - h / 2, w, h, spr: Spr.rubble[(R() * 2) | 0], ang: 0, kind: 'rubble', shadow: 10 };
      if (dist2(px, py, cx, cy) < 240 * 240) continue;
      if (overlaps(o)) continue;
      world.obstacles.push(o);
      break;
    }
  }

  // barrels
  const barCount = 7 + ((R() * 5) | 0);
  for (let i = 0; i < barCount; i++) {
    for (let t = 0; t < 40; t++) {
      const px = 150 + R() * (world.w - 360), py = 150 + R() * (world.h - 360);
      const o = { x: px - 16, y: py - 16, w: 32, h: 32, spr: Spr.barrel, ang: 0, kind: 'barrel', shadow: 8 };
      if (dist2(px, py, cx, cy) < 220 * 220) continue;
      if (overlaps(o)) continue;
      world.obstacles.push(o);
      break;
    }
  }

  /* ----- spawn points (inner border ring) ----- */
  world.spawnPts = [];
  const inset = CFG.world.wall + 42;
  for (let sx = inset + 40; sx < world.w - inset - 40; sx += 150) {
    world.spawnPts.push({ x: sx, y: inset + rand(-26, 26) });
    world.spawnPts.push({ x: sx, y: world.h - inset + rand(-26, 26) });
  }
  for (let sy = inset + 40; sy < world.h - inset - 40; sy += 150) {
    world.spawnPts.push({ x: inset + rand(-26, 26), y: sy });
    world.spawnPts.push({ x: world.w - inset + rand(-26, 26), y: sy });
  }

  /* ----- drifting fog blobs ----- */
  world.fog = [];
  for (let i = 0; i < 7; i++) {
    world.fog.push({
      x: R() * world.w, y: R() * world.h,
      r: 190 + R() * 220,
      vx: (R() - 0.5) * 9, vy: (R() - 0.5) * 9,
      a: 0.05 + R() * 0.05,
    });
  }
}

/* ---------- decal stamping ---------- */
function stampBlood(x, y, dir, size) {
  const g = world.dctx;
  if (!g) return;
  g.save();
  g.translate(x, y);
  g.rotate(dir || 0);
  g.fillStyle = 'rgba(96,14,10,0.74)';
  g.beginPath();
  g.ellipse(0, 0, size, size * 0.65, 0, 0, TAU);
  g.fill();
  // spray droplets forward
  const n = 2 + (Math.random() * 3) | 0;
  for (let i = 0; i < n; i++) {
    const d = size * (0.8 + Math.random() * 1.8);
    const a = (Math.random() - 0.5) * 0.9;
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, 1.5 + Math.random() * size * 0.3, 1.5 + Math.random() * 2, 0, 0, TAU);
    g.fill();
  }
  g.restore();
}

function stampCorpse(e) {
  const g = world.dctx;
  if (!g) return;
  stampBlood(e.x, e.y, e.angle + rand(-0.5, 0.5), e.r * (1.1 + Math.random() * 0.5));
  const list = Spr.corpse[e.type];
  const spr = list[e.variant % list.length];
  g.save();
  g.translate(e.x, e.y);
  g.rotate(e.angle + rand(-0.4, 0.4));
  g.globalAlpha = 0.85;
  g.drawImage(spr, -spr.width / 2, -spr.height / 2);
  g.restore();
}

function fadeDecals(dt) {
  world.decalFadeT += dt;
  if (world.decalFadeT < 6) return;
  world.decalFadeT = 0;
  const g = world.dctx;
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.globalAlpha = 0.08;
  g.fillRect(0, 0, world.w, world.h);
  g.restore();
}

/* ---------- obstacle helpers ---------- */
function resolveObstacles(ent) {
  for (let i = 0; i < world.obstacles.length; i++) {
    const o = world.obstacles[i];
    const hit = circleRectHit(ent.x, ent.y, ent.r, o);
    if (hit) {
      ent.x += hit[0] * hit[2];
      ent.y += hit[1] * hit[2];
    }
  }
}

function losClear(x1, y1, x2, y2) {
  for (let i = 0; i < world.obstacles.length; i++) {
    const o = world.obstacles[i];
    if (o.wall) continue;
    if (segRect(x1, y1, x2, y2, o.x, o.y, o.w, o.h)) return false;
  }
  return true;
}

function bulletHitsObstacle(x1, y1, x2, y2) {
  for (let i = 0; i < world.obstacles.length; i++) {
    const o = world.obstacles[i];
    if (segRect(x1, y1, x2, y2, o.x, o.y, o.w, o.h)) return o;
  }
  return null;
}
