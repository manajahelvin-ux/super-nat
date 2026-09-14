'use strict';
/* SUPER-NAT — sprites.js : all art pre-rendered to offscreen canvases */

function mk(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  fn(g, c);
  return c;
}

function makeGlow(r, g, b) {
  return mk(64, 64, (x) => {
    const gr = x.createRadialGradient(32, 32, 1, 32, 32, 32);
    gr.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
    gr.addColorStop(0.3, `rgba(${r},${g},${b},0.38)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
  });
}

function darken(src, amt) {
  return mk(src.width, src.height, (g) => {
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = `rgba(14,9,7,${amt})`;
    g.fillRect(0, 0, src.width, src.height);
  });
}

/* ---------- humanoids (all face +x) ---------- */

const SKINS = ['#8a9b7a', '#93a06f', '#7f9584', '#9aa27b'];
const CLOTHES = ['#4a4438', '#54473b', '#3e4a4a', '#57453a'];

function drawWalker(g, v) {
  const skin = SKINS[v % SKINS.length], cloth = CLOTHES[(v * 2 + 1) % CLOTHES.length];
  // reaching arms
  g.strokeStyle = skin; g.lineWidth = 5.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(3, -6); g.lineTo(17, -8); g.stroke();
  g.beginPath(); g.moveTo(3, 6); g.lineTo(16, 9); g.stroke();
  // torso
  g.fillStyle = cloth; rrect(g, -10, -10, 19, 20, 8); g.fill();
  // torn shirt
  g.fillStyle = 'rgba(0,0,0,0.25)';
  rrect(g, -6, -4, 7, 6, 2); g.fill();
  // gore dots
  g.fillStyle = '#6e1410';
  circle(g, -2, 5, 2); g.fill();
  circle(g, 2, -4, 1.4); g.fill();
  // head
  g.fillStyle = SKINS[(v + 2) % SKINS.length];
  circle(g, 3, 0, 5.5); g.fill();
  // scraggly hair
  g.fillStyle = '#2a2620';
  g.beginPath(); g.arc(3, 0, 5.5, TAU * 0.3, TAU * 0.8); g.lineTo(3, 0); g.closePath(); g.fill();
  // wound
  g.fillStyle = '#7c1712';
  circle(g, 0, -3, 1.8); g.fill();
}

function drawRunner(g, v) {
  const skin = v ? '#a8b094' : '#9aa585', cloth = v ? '#3c3f45' : '#463c33';
  // trailing arms
  g.strokeStyle = skin; g.lineWidth = 4.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -5); g.lineTo(-9, -10); g.stroke();
  g.beginPath(); g.moveTo(0, 5); g.lineTo(-9, 10); g.stroke();
  // lean torso
  g.fillStyle = cloth; rrect(g, -11, -7, 17, 14, 6); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.2)'; rrect(g, -11, -7, 6, 14, 3); g.fill();
  // gaunt head thrust forward
  g.fillStyle = skin; circle(g, 5, 0, 5); g.fill();
  g.fillStyle = '#1c1915'; circle(g, 7, -1.5, 1.1); g.fill(); circle(g, 7, 1.5, 1.1); g.fill();
  g.fillStyle = '#6e1410'; circle(g, 2, 3, 1.5); g.fill();
}

function drawSpitter(g) {
  // bloated torso
  g.fillStyle = '#5d7a4c'; rrect(g, -11, -12, 22, 24, 10); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.18)'; rrect(g, -11, -12, 22, 8, 6); g.fill();
  // glowing sacs
  const sacs = [[-5, -6], [-7, 0], [-5, 6]];
  for (const [sx, sy] of sacs) {
    g.fillStyle = '#9fe06a'; circle(g, sx, sy, 3.2); g.fill();
    g.fillStyle = 'rgba(126,240,201,0.8)'; circle(g, sx, sy, 1.4); g.fill();
  }
  // short arms
  g.strokeStyle = '#74905e'; g.lineWidth = 4.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(2, -7); g.lineTo(11, -9); g.stroke();
  g.beginPath(); g.moveTo(2, 7); g.lineTo(11, 9); g.stroke();
  // small head
  g.fillStyle = '#87a06b'; circle(g, 4, 0, 4.4); g.fill();
  g.fillStyle = '#c9f76a'; circle(g, 6.5, 0, 1.6); g.fill();
}

function drawBrute(g) {
  // massive arms
  g.strokeStyle = '#5f6b58'; g.lineWidth = 10; g.lineCap = 'round';
  g.beginPath(); g.moveTo(4, -15); g.lineTo(21, -19); g.stroke();
  g.beginPath(); g.moveTo(4, 15); g.lineTo(21, 19); g.stroke();
  g.strokeStyle = '#4d5747'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(20, -19); g.lineTo(26, -19); g.stroke();
  g.beginPath(); g.moveTo(20, 19); g.lineTo(26, 19); g.stroke();
  // torso
  g.fillStyle = '#5f6b58'; rrect(g, -17, -21, 33, 42, 13); g.fill();
  // shoulder plates
  g.fillStyle = '#464f40'; rrect(g, -14, -21, 12, 14, 5); g.fill();
  rrect(g, -14, 7, 12, 14, 5); g.fill();
  // straps
  g.strokeStyle = '#33291c'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(-12, -8); g.lineTo(8, 8); g.stroke();
  g.beginPath(); g.moveTo(-12, 8); g.lineTo(8, -8); g.stroke();
  // gore
  g.fillStyle = '#6e1410'; circle(g, -4, -2, 3.4); g.fill(); circle(g, 2, 10, 2.4); g.fill();
  // tiny head
  g.fillStyle = '#77836b'; circle(g, 6, 0, 5.5); g.fill();
  g.fillStyle = '#1c1915'; circle(g, 8.5, -2, 1.2); g.fill(); circle(g, 8.5, 2, 1.2); g.fill();
}

function drawPlayerSprite(g) {
  // backpack
  g.fillStyle = '#372f22'; rrect(g, -17, -7, 9, 14, 3); g.fill();
  g.fillStyle = '#2c251c'; rrect(g, -15, -4, 5, 8, 2); g.fill();
  // arms reaching to weapon
  g.strokeStyle = '#576040'; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(1, -5); g.lineTo(13, -2.5); g.stroke();
  g.beginPath(); g.moveTo(1, 5); g.lineTo(13, 2.5); g.stroke();
  g.fillStyle = '#d9a983';
  circle(g, 13, -2.5, 2.4); g.fill();
  circle(g, 13, 2.5, 2.4); g.fill();
  // torso jacket
  g.fillStyle = '#576040'; rrect(g, -9, -11, 20, 22, 9); g.fill();
  g.fillStyle = '#454d31'; rrect(g, -9, -11, 20, 7, 5); g.fill();
  // chest strap
  g.strokeStyle = '#8a6a3a'; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(-6, -8); g.lineTo(7, 9); g.stroke();
  // head
  g.fillStyle = '#d9a983'; circle(g, 1, 0, 6.2); g.fill();
  // hair (back of head)
  g.fillStyle = '#26221b';
  g.beginPath(); g.arc(1, 0, 6.2, TAU * 0.28, TAU * 0.72); g.lineTo(1, 0); g.closePath(); g.fill();
  // amber headband
  g.strokeStyle = '#f2a541'; g.lineWidth = 2.2;
  g.beginPath(); g.arc(1, 0, 6.2, -TAU * 0.12, TAU * 0.12); g.stroke();
}

/* ---------- guns (point +x, origin at grip) ---------- */
function gunSprites() {
  const pistol = mk(18, 10, (g) => {
    g.fillStyle = '#22201c'; rrect(g, 0, -2.2, 15, 4.6, 1.6); g.fill();
    g.fillStyle = '#3a352c'; rrect(g, 0, -2.2, 9, 2, 1); g.fill();
    g.fillStyle = '#141310'; rrect(g, 13, -1.6, 4, 3.2, 1); g.fill();
  });
  const smg = mk(24, 12, (g) => {
    g.fillStyle = '#232120'; rrect(g, 0, -2.6, 20, 5.2, 2); g.fill();
    g.fillStyle = '#171514'; rrect(g, 6, -4.4, 4, 3, 1); g.fill(); // mag
    g.fillStyle = '#3a352c'; rrect(g, 0, -2.6, 8, 2, 1); g.fill();
    g.fillStyle = '#141310'; rrect(g, 18, -1.8, 5, 3.6, 1); g.fill();
  });
  const shotgun = mk(30, 12, (g) => {
    g.fillStyle = '#26231d'; rrect(g, 0, -2, 27, 4, 1.5); g.fill();
    g.fillStyle = '#4c3b26'; rrect(g, 9, -3.4, 8, 6.8, 2.4); g.fill(); // pump
    g.fillStyle = '#141310'; rrect(g, 24, -2.4, 5, 4.8, 1.4); g.fill();
  });
  const rifle = mk(34, 12, (g) => {
    g.fillStyle = '#232620'; rrect(g, 0, -2, 30, 4, 1.5); g.fill();
    g.fillStyle = '#141311'; circle(g, 12, 0, 3); g.fill();
    g.fillStyle = '#f2a541'; circle(g, 12, 0, 1.1); g.fill();
    g.fillStyle = '#141310'; rrect(g, 27, -2.6, 6, 5.2, 1.4); g.fill();
  });
  return { pistol, smg, shotgun, rifle };
}

/* ---------- pickups ---------- */
function pickupSprites() {
  const med = mk(30, 30, (g) => {
    g.fillStyle = '#cfc9b8'; rrect(g, 3, 3, 24, 24, 5); g.fill();
    g.strokeStyle = '#8f887a'; g.lineWidth = 2; rrect(g, 3, 3, 24, 24, 5); g.stroke();
    g.fillStyle = '#d63a2f';
    rrect(g, 12.5, 7, 5, 16, 1.5); g.fill();
    rrect(g, 7, 12.5, 16, 5, 1.5); g.fill();
  });
  const crate = (stripe) => mk(30, 30, (g) => {
    g.fillStyle = '#2e2b24'; rrect(g, 2, 5, 26, 20, 4); g.fill();
    g.strokeStyle = '#514a3a'; g.lineWidth = 2; rrect(g, 2, 5, 26, 20, 4); g.stroke();
    g.fillStyle = stripe;
    rrect(g, 2, 5, 26, 4, 2); g.fill();
    rrect(g, 2, 21, 26, 4, 2); g.fill();
    g.fillStyle = stripe; rrect(g, 8, 11, 14, 4, 1); g.fill(); rrect(g, 8, 16, 9, 3, 1); g.fill();
  });
  const adr = mk(30, 30, (g) => {
    g.fillStyle = '#1e1c17'; circle(g, 15, 15, 12); g.fill();
    g.strokeStyle = '#ffd75e'; g.lineWidth = 2; circle(g, 15, 15, 12); g.stroke();
    g.fillStyle = '#ffd75e';
    g.beginPath();
    g.moveTo(17, 6); g.lineTo(10, 16); g.lineTo(14, 16); g.lineTo(12, 24); g.lineTo(20, 13); g.lineTo(15.5, 13); g.closePath();
    g.fill();
  });
  return { med, smg: crate('#ffd27a'), shotgun: crate('#ff9a4d'), rifle: crate('#ffe9b0'), adr };
}

/* ---------- props ---------- */
const CAR_COLORS = [
  { body: '#6b3226', roof: '#7c4a33' },
  { body: '#6f6350', roof: '#7f7460' },
  { body: '#4c523b', roof: '#5c6349' },
];

function carSprite(v) {
  const c = CAR_COLORS[v % CAR_COLORS.length];
  return mk(150, 76, (g) => {
    // wheels
    g.fillStyle = '#14120f';
    rrect(g, 18, -4, 30, 10, 4); g.fill();
    rrect(g, 102, -4, 30, 10, 4); g.fill();
    rrect(g, 18, 70, 30, 10, 4); g.fill();
    rrect(g, 102, 70, 30, 10, 4); g.fill();
    // body
    g.fillStyle = c.body; rrect(g, 4, 8, 142, 60, 16); g.fill();
    // cabin
    g.fillStyle = c.roof; rrect(g, 30, 16, 90, 44, 12); g.fill();
    // windshield
    g.fillStyle = '#1b1d20'; rrect(g, 96, 20, 18, 36, 5); g.fill();
    rrect(g, 36, 20, 14, 36, 5); g.fill();
    // cracked glass
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(100, 24); g.lineTo(108, 40); g.lineTo(102, 52); g.stroke();
    // rust + dust
    g.fillStyle = 'rgba(150,70,20,0.35)';
    circle(g, 20, 30, 7); g.fill(); circle(g, 130, 55, 9); g.fill();
    g.fillStyle = 'rgba(120,100,70,0.25)'; rrect(g, 4, 8, 142, 14, 8); g.fill();
    // dings
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(60, 62); g.lineTo(74, 66); g.stroke();
  });
}

function rubbleSprite(seed) {
  const R = mulberry32(seed);
  return mk(130, 100, (g) => {
    const cols = ['#3d3830', '#4a443a', '#57503f', '#33302a'];
    for (let i = 0; i < 13; i++) {
      const x = 15 + R() * 100, y = 15 + R() * 70, r = 7 + R() * 14;
      g.fillStyle = cols[(R() * cols.length) | 0];
      g.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + R() * 0.6;
        const rr = r * (0.6 + R() * 0.5);
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        k === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.28)';
      g.beginPath();
      g.arc(x + r * 0.25, y + r * 0.3, r * 0.55, 0, TAU); g.fill();
    }
    // rebar
    g.strokeStyle = '#5a3d28'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(30, 70); g.lineTo(80, 30); g.stroke();
    g.beginPath(); g.moveTo(60, 80); g.lineTo(95, 55); g.stroke();
  });
}

function barrelSprite() {
  return mk(34, 34, (g) => {
    g.fillStyle = '#703021'; circle(g, 17, 17, 15); g.fill();
    g.strokeStyle = '#4a1e14'; g.lineWidth = 2.5; circle(g, 17, 17, 15); g.stroke();
    g.strokeStyle = '#4a1e14'; g.lineWidth = 1.6; circle(g, 17, 17, 10); g.stroke();
    g.fillStyle = '#8a4a33'; circle(g, 17, 17, 5); g.fill();
    g.fillStyle = 'rgba(160,90,30,0.5)'; circle(g, 10, 12, 4); g.fill(); circle(g, 24, 22, 3); g.fill();
  });
}

/* ---------- fx ---------- */
function coneSprite() {
  return mk(300, 300, (g) => {
    const apex = { x: 18, y: 150 };
    const layers = [
      { spread: 105, a: 0.10 },
      { spread: 72, a: 0.13 },
      { spread: 42, a: 0.16 },
    ];
    for (const L of layers) {
      const gr = g.createLinearGradient(0, 0, 300, 0);
      gr.addColorStop(0, `rgba(255,214,140,${L.a})`);
      gr.addColorStop(0.55, `rgba(255,200,120,${L.a * 0.45})`);
      gr.addColorStop(1, 'rgba(255,190,110,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(apex.x, apex.y);
      g.lineTo(300, 150 - L.spread);
      g.lineTo(300, 150 + L.spread);
      g.closePath();
      g.fill();
    }
    const rg = g.createRadialGradient(apex.x, 150, 2, apex.x, 150, 70);
    rg.addColorStop(0, 'rgba(255,220,150,0.28)');
    rg.addColorStop(1, 'rgba(255,220,150,0)');
    g.fillStyle = rg;
    circle(g, apex.x, 150, 70); g.fill();
  });
}

function chevronSprite() {
  return mk(30, 30, (g) => {
    g.fillStyle = '#ff4a3d';
    g.beginPath();
    g.moveTo(6, 4); g.lineTo(24, 15); g.lineTo(6, 26); g.lineTo(11, 15); g.closePath();
    g.fill();
  });
}

function flashSprite() {
  return mk(48, 48, (g) => {
    g.translate(24, 24);
    const gr = g.createRadialGradient(0, 0, 1, 0, 0, 22);
    gr.addColorStop(0, 'rgba(255,240,200,0.95)');
    gr.addColorStop(0.4, 'rgba(255,190,90,0.5)');
    gr.addColorStop(1, 'rgba(255,160,60,0)');
    g.fillStyle = gr;
    circle(g, 0, 0, 22); g.fill();
    g.strokeStyle = 'rgba(255,245,220,0.95)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU;
      const l = i % 2 ? 10 : 17;
      g.beginPath();
      g.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
      g.lineTo(Math.cos(a) * l, Math.sin(a) * l);
      g.stroke();
    }
  });
}

function fogSprite() {
  return mk(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, 'rgba(205,185,150,0.5)');
    gr.addColorStop(1, 'rgba(205,185,150,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
  });
}

function grainURL() {
  const c = mk(140, 140, (g, cv) => {
    const im = g.createImageData(140, 140);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      im.data[i] = v; im.data[i + 1] = v; im.data[i + 2] = v;
      im.data[i + 3] = 16;
    }
    g.putImageData(im, 0, 0);
  });
  return c.toDataURL('image/png');
}

/* ---------- build ---------- */
const Spr = {
  enemy: {
    walker: [0, 1, 2].map((v) => mk(44, 44, (g) => { g.translate(22, 22); drawWalker(g, v); })),
    runner: [0, 1].map((v) => mk(40, 40, (g) => { g.translate(20, 20); drawRunner(g, v); })),
    spitter: [mk(48, 48, (g) => { g.translate(24, 24); drawSpitter(g); })],
    brute: [mk(72, 72, (g) => { g.translate(36, 36); drawBrute(g); })],
  },
  corpse: null, // filled below
  player: mk(48, 48, (g) => { g.translate(24, 24); drawPlayerSprite(g); }),
  guns: gunSprites(),
  pk: pickupSprites(),
  cars: [0, 1, 2].map(carSprite),
  rubble: [rubbleSprite(7), rubbleSprite(1337)],
  barrel: barrelSprite(),
  glow: {
    amber: makeGlow(255, 190, 100),
    red: makeGlow(255, 80, 60),
    teal: makeGlow(126, 240, 201),
    white: makeGlow(255, 245, 230),
    gold: makeGlow(255, 225, 120),
    green: makeGlow(150, 240, 90),
  },
  cone: coneSprite(),
  chevron: chevronSprite(),
  flash: flashSprite(),
  fog: fogSprite(),
  grain: grainURL(),
};
Spr.corpse = {
  walker: Spr.enemy.walker.map((c) => darken(c, 0.5)),
  runner: Spr.enemy.runner.map((c) => darken(c, 0.5)),
  spitter: Spr.enemy.spitter.map((c) => darken(c, 0.5)),
  brute: Spr.enemy.brute.map((c) => darken(c, 0.5)),
};
