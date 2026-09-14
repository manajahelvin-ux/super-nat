'use strict';
/* SUPER-NAT — render.js : full render pipeline (world pass + screen pass) */

let vigCanvas = null;
let dustMotes = null;

function buildVignette() {
  vigCanvas = mk(Math.max(2, view.w), Math.max(2, view.h), (g) => {
    const r = Math.hypot(view.w, view.h) / 2;
    const gr = g.createRadialGradient(view.w / 2, view.h / 2, r * 0.42, view.w / 2, view.h / 2, r);
    gr.addColorStop(0, 'rgba(8,6,4,0)');
    gr.addColorStop(0.72, 'rgba(8,6,4,0.26)');
    gr.addColorStop(1, 'rgba(5,4,3,0.6)');
    g.fillStyle = gr;
    g.fillRect(0, 0, view.w, view.h);
    const gt = g.createLinearGradient(0, 0, 0, view.h * 0.45);
    gt.addColorStop(0, 'rgba(255,178,96,0.06)');
    gt.addColorStop(1, 'rgba(255,178,96,0)');
    g.fillStyle = gt;
    g.fillRect(0, 0, view.w, view.h * 0.45);
  });
}

function updateAmbient(dt) {
  if (!dustMotes) {
    dustMotes = [];
    for (let i = 0; i < 34; i++) {
      dustMotes.push({ x: Math.random() * view.w, y: Math.random() * view.h, vx: rand(-14, 14), vy: rand(-8, 8), s: rand(0.8, 2), a: rand(0.1, 0.4) });
    }
  }
  for (const m of dustMotes) {
    m.x += m.vx * dt; m.y += m.vy * dt;
    if (m.x < -10) m.x = view.w + 10; if (m.x > view.w + 10) m.x = -10;
    if (m.y < -10) m.y = view.h + 10; if (m.y > view.h + 10) m.y = -10;
  }
  for (const f of world.fog) {
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.x < -f.r) f.x = world.w + f.r; if (f.x > world.w + f.r) f.x = -f.r;
    if (f.y < -f.r) f.y = world.h + f.r; if (f.y > world.h + f.r) f.y = -f.r;
  }
}

function shakeState() {
  const t2 = S.shakeTrauma * S.shakeTrauma;
  return {
    x: (Math.random() - 0.5) * 2 * t2 * 17,
    y: (Math.random() - 0.5) * 2 * t2 * 17,
    a: (Math.random() - 0.5) * 2 * t2 * 0.022,
  };
}

function render() {
  if (!ctx) return;
  const cw = view.w, ch = view.h;
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, cw, ch);

  const sh = shakeState();
  const z = cam.zoom;

  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate(sh.a);
  ctx.scale(z, z);
  ctx.translate(-cam.x + sh.x, -cam.y + sh.y);

  // visible bounds (for culling)
  const pad = 90;
  const vx0 = cam.x - cw / 2 / z - pad, vx1 = cam.x + cw / 2 / z + pad;
  const vy0 = cam.y - ch / 2 / z - pad, vy1 = cam.y + ch / 2 / z + pad;
  const vis = (x, y, r) => x > vx0 - r && x < vx1 + r && y > vy0 - r && y < vy1 + r;

  /* ground + decals (visible sub-rect only) */
  {
    const sx = clamp(Math.floor(vx0), 0, world.w), sy = clamp(Math.floor(vy0), 0, world.h);
    const sw = clamp(Math.ceil(vx1 - vx0), 0, world.w - sx), shh = clamp(Math.ceil(vy1 - vy0), 0, world.h - sy);
    if (sw > 0 && shh > 0) {
      if (world.ground) ctx.drawImage(world.ground, sx, sy, sw, shh, sx, sy, sw, shh);
      if (world.decal) ctx.drawImage(world.decal, sx, sy, sw, shh, sx, sy, sw, shh);
    }
  }

  /* spawn markers */
  for (const m of markers) {
    if (!vis(m.x, m.y, 50)) continue;
    const prog = 1 - m.t / 0.8;
    const rr = lerp(40, ENEMY[m.type].r + 6, prog);
    const alpha = 0.2 + 0.55 * prog + Math.sin(S.realTime * 24) * 0.08;
    ctx.strokeStyle = `rgba(226,59,45,${alpha})`;
    ctx.lineWidth = 2.2;
    circle(ctx, m.x, m.y, rr); ctx.stroke();
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(255,120,90,${alpha * 0.7})`;
    circle(ctx, m.x, m.y, rr * 0.6 + Math.sin(S.realTime * 6) * 3); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = prog * 0.5;
    ctx.drawImage(Spr.glow.red, m.x - 22, m.y - 22, 44, 44);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* fog */
  ctx.globalCompositeOperation = 'screen';
  for (const f of world.fog) {
    if (!vis(f.x, f.y, f.r)) continue;
    ctx.globalAlpha = f.a;
    ctx.drawImage(Spr.fog, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  /* obstacles */
  for (const o of world.obstacles) {
    if (o.wall) continue;
    if (!vis(o.x + o.w / 2, o.y + o.h / 2, Math.max(o.w, o.h))) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    rrect(ctx, o.x + 5 - 4, o.y + 7 - 5, o.w + 8, o.h + 10, 14); ctx.fill();
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
    ctx.rotate(o.ang || 0);
    if (o.kind === 'barrel') ctx.rotate(S.realTime * 0.0); // barrels static
    ctx.drawImage(o.spr, -o.spr.width / 2, -o.spr.height / 2);
    ctx.restore();
  }

  /* player flashlight cone */
  if (!player.dead && (S.mode === 'playing' || S.mode === 'paused')) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(player.x, player.y);
    ctx.rotate(player.aim);
    ctx.drawImage(Spr.cone, -16, -150);
    ctx.restore();
  }

  /* pickups */
  for (const pk of pickups) {
    if (!vis(pk.x, pk.y, 40)) continue;
    const bob = Math.sin(pk.t * 3) * 2.5;
    const blink = pk.life < 4 ? (Math.sin(pk.t * 14) > -0.2 ? 1 : 0.25) : 1;
    const gl = pk.kind === 'med' ? Spr.glow.teal : pk.kind === 'adr' ? Spr.glow.gold : Spr.glow.amber;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (0.4 + Math.sin(pk.t * 4) * 0.15) * blink;
    const gs = 40 + Math.sin(pk.t * 4) * 5;
    ctx.drawImage(gl, pk.x - gs / 2, pk.y - gs / 2 + bob, gs, gs);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(pk.x + 2, pk.y + 8, 11, 5, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = blink;
    ctx.drawImage(Spr.pk[pk.kind], pk.x - 15, pk.y - 15 + bob);
    ctx.globalAlpha = 1;
  }

  /* enemies */
  for (const e of enemies) {
    if (!vis(e.x, e.y, 60)) continue;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath(); ctx.ellipse(e.x + 3, e.y + 5, e.r * 0.95, e.r * 0.55, 0, 0, TAU); ctx.fill();
    // runner windup tell
    if (e.tell > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + Math.sin(S.realTime * 30) * 0.3;
      ctx.drawImage(Spr.glow.red, e.x - 26, e.y - 26, 52, 52);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    const list = Spr.enemy[e.type];
    const spr = list[e.variant % list.length];
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    const step = e.type === 'brute' ? Math.sin(e.wob * 0.7) * 0.05 : Math.sin(e.wob) * 0.08;
    ctx.rotate(step);
    ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    ctx.restore();
    if (e.hitFlash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = clamp(e.hitFlash / 0.09, 0, 1) * 0.85;
      const fs = e.r * 3.2;
      ctx.drawImage(Spr.glow.white, e.x - fs / 2, e.y - fs / 2, fs, fs);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    // hp bar when damaged
    if (e.hp < e.maxHp - 0.5 && e.type !== 'walker') {
      const w = e.r * 2.1, h = 3.5, bx = e.x - w / 2, by = e.y - e.r - 12;
      ctx.fillStyle = 'rgba(10,8,6,0.75)';
      ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
      ctx.fillStyle = e.type === 'brute' ? '#e23b3b' : '#c96a2a';
      ctx.fillRect(bx, by, w * clamp(e.hp / e.maxHp, 0, 1), h);
    }
  }

  /* player */
  if (!player.dead && S.mode !== 'menu') {
    const p = player;
    ctx.fillStyle = 'rgba(0,0,0,0.36)';
    ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 6, p.r * 1.05, p.r * 0.62, 0, 0, TAU); ctx.fill();
    if (p.adr > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + Math.sin(S.realTime * 10) * 0.12;
      ctx.drawImage(Spr.glow.gold, p.x - 26, p.y - 26, 52, 52);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.aim);
    if (p.invuln > 0 && Math.sin(S.realTime * 42) > 0) ctx.globalAlpha = 0.45;
    ctx.drawImage(Spr.player, -24, -24);
    const gun = Spr.guns[p.weapon];
    ctx.drawImage(gun, 5, -gun.height / 2 + 1);
    ctx.restore();
    ctx.globalAlpha = 1;
    // muzzle light
    if (p.muzzle > 0.06) {
      const mx = p.x + Math.cos(p.aim) * (p.r + 14), my = p.y + Math.sin(p.aim) * (p.r + 14);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = p.muzzle * 0.9;
      const ms = 34 + p.muzzle * 26;
      ctx.drawImage(Spr.glow.amber, mx - ms / 2, my - ms / 2, ms, ms);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* acid projectiles */
  for (const a of acid) {
    if (!vis(a.x, a.y, 20)) continue;
    const sq = 1 + Math.sin(a.wob) * 0.25;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(Spr.glow.green, a.x - 13, a.y - 13, 26, 26);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#8ed44e';
    ctx.beginPath(); ctx.ellipse(a.x, a.y, 5.5 * sq, 5.5 / sq, a.wob, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d3f76a';
    ctx.beginPath(); ctx.ellipse(a.x - 1, a.y - 1, 2.2, 2.2, 0, 0, TAU); ctx.fill();
  }

  /* bullets (additive tracers) */
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (const b of bullets) {
    if (!vis(b.x, b.y, 30)) continue;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.size;
    ctx.beginPath();
    ctx.moveTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.drawImage(Spr.glow.amber, b.x - 6, b.y - 6, 12, 12);
  }
  ctx.globalCompositeOperation = 'source-over';

  /* particles */
  for (const p of particles) {
    if (!vis(p.x, p.y, 40)) continue;
    const lt = clamp(p.life / p.max, 0, 1);
    switch (p.type) {
      case 'blood':
        ctx.globalAlpha = Math.min(1, lt * 1.6);
        ctx.fillStyle = p.color;
        circle(ctx, p.x, p.y, p.size * (0.5 + lt * 0.5)); ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'acid':
        ctx.globalAlpha = lt;
        ctx.fillStyle = p.color;
        circle(ctx, p.x, p.y, p.size); ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'gib':
      case 'casing': {
        const dz = p.z * 0.35;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        circle(ctx, p.x, p.y, p.size * 0.7); ctx.fill();
        ctx.globalAlpha = Math.min(1, lt * 2);
        ctx.save();
        ctx.translate(p.x, p.y - dz);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.type === 'casing') ctx.fillRect(-p.size * 1.2, -p.size * 0.5, p.size * 2.4, p.size);
        else ctx.fillRect(-p.size, -p.size * 0.7, p.size * 2, p.size * 1.4);
        ctx.restore();
        ctx.globalAlpha = 1;
        break;
      }
      case 'smoke': {
        ctx.globalAlpha = lt * 0.32;
        ctx.fillStyle = p.color + '1)';
        circle(ctx, p.x, p.y, Math.max(0.5, p.size)); ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      case 'spark':
        ctx.globalAlpha = lt;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.028, p.y - p.vy * 0.028);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      case 'flash': {
        ctx.globalAlpha = lt;
        const fs = p.size * 2;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.color === 'green') ctx.drawImage(Spr.glow.green, -fs / 2, -fs / 2, fs, fs);
        else ctx.drawImage(Spr.flash, -fs / 2, -fs / 2, fs, fs);
        ctx.restore();
        ctx.globalAlpha = 1;
        break;
      }
      case 'ring': {
        const prog = 1 - lt;
        const rr = lerp(p.size, p.to, prog);
        ctx.globalAlpha = lt;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.6;
        circle(ctx, p.x, p.y, rr); ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }
      case 'trail':
        ctx.globalAlpha = lt * 0.35;
        ctx.drawImage(Spr.glow.amber, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        ctx.globalAlpha = 1;
        break;
      case 'glow':
        ctx.globalAlpha = lt * 0.8;
        ctx.drawImage(Spr.glow[p.color] || Spr.glow.gold, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        ctx.globalAlpha = 1;
        break;
    }
  }

  /* floaters */
  if (floaters.length) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of floaters) {
      const age = f.max - f.life;
      const pop = 1 + 0.5 * Math.max(0, 1 - age * 9);
      ctx.globalAlpha = clamp(f.life * 3, 0, 1);
      ctx.font = `800 ${Math.round(f.size * pop)}px 'Saira Condensed', 'Arial Narrow', sans-serif`;
      ctx.strokeStyle = 'rgba(10,6,4,0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText(f.txt, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.txt, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();

  /* ============ screen-space pass ============ */

  // dust motes (subtle parallax)
  ctx.fillStyle = 'rgba(215,195,160,0.5)';
  for (const m of dustMotes || []) {
    let mx = (m.x - cam.x * 0.05) % cw; if (mx < 0) mx += cw;
    ctx.globalAlpha = m.a;
    ctx.fillRect(mx, m.y, m.s, m.s);
  }
  ctx.globalAlpha = 1;

  // offscreen enemy indicators
  if (S.mode === 'playing' || S.mode === 'dying') {
    let shown = 0;
    for (const e of enemies) {
      if (shown > 14) break;
      const sx = (e.x - cam.x) * z + cw / 2;
      const sy = (e.y - cam.y) * z + ch / 2;
      const M = 40;
      if (sx > M && sx < cw - M && sy > M && sy < ch - M) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d > 1500) continue;
      const cxs = clamp(sx, M, cw - M), cys = clamp(sy, M, ch - M);
      const a = Math.atan2(sy - ch / 2, sx - cw / 2);
      const alpha = clamp(1.15 - d / 1500, 0.25, 0.9) * (0.75 + Math.sin(S.realTime * 8) * 0.25);
      const sc = e.type === 'brute' ? 1.5 : 1;
      ctx.save();
      ctx.translate(cxs, cys);
      ctx.rotate(a);
      ctx.globalAlpha = alpha;
      ctx.drawImage(Spr.chevron, -15 * sc, -15 * sc, 30 * sc, 30 * sc);
      ctx.restore();
      shown++;
    }
    ctx.globalAlpha = 1;
  }

  // touch sticks
  if (IS_TOUCH && (S.mode === 'playing' || S.mode === 'dying')) {
    for (const key of ['move', 'aim']) {
      const st = Input.st[key];
      if (st.id !== null) {
        ctx.strokeStyle = 'rgba(232,221,199,0.22)';
        ctx.lineWidth = 2;
        circle(ctx, st.ox, st.oy, Input.R); ctx.stroke();
        ctx.fillStyle = key === 'move' ? 'rgba(242,165,65,0.35)' : 'rgba(226,59,45,0.35)';
        circle(ctx, st.ox + st.dx, st.oy + st.dy, 24); ctx.fill();
        ctx.strokeStyle = 'rgba(232,221,199,0.35)';
        circle(ctx, st.ox + st.dx, st.oy + st.dy, 24); ctx.stroke();
      }
    }
    // first-run hints
    if (S.touchHintT > 0 && S.mode === 'playing') {
      const a = Math.min(1, S.touchHintT) * (0.55 + Math.sin(S.realTime * 4) * 0.15);
      ctx.textAlign = 'center';
      ctx.font = "700 15px 'Saira Condensed', sans-serif";
      const draw = (x, y, label) => {
        ctx.strokeStyle = `rgba(232,221,199,${a * 0.4})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        circle(ctx, x, y, 46); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(232,221,199,${a})`;
        ctx.fillText(label, x, y + 66);
      };
      if (Input.st.move.id === null) draw(cw * 0.2, ch * 0.68, 'MOVE');
      if (Input.st.aim.id === null) draw(cw * 0.8, ch * 0.68, 'AIM + FIRE');
    }
  }

  // desktop crosshair
  if (!IS_TOUCH && S.mode === 'playing' && Input.mouse.seen) {
    const mx = Input.mouse.x, my = Input.mouse.y;
    const r = 9 + player.recoil * 8;
    ctx.strokeStyle = 'rgba(255,210,122,0.9)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'butt';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + TAU / 8;
      ctx.beginPath();
      ctx.moveTo(mx + Math.cos(a) * r, my + Math.sin(a) * r);
      ctx.lineTo(mx + Math.cos(a) * (r + 7), my + Math.sin(a) * (r + 7));
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,210,122,0.9)';
    circle(ctx, mx, my, 1.6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,210,122,0.22)';
    ctx.lineWidth = 1;
    circle(ctx, mx, my, r + 12); ctx.stroke();
  }

  // vignette
  if (vigCanvas) ctx.drawImage(vigCanvas, 0, 0, cw, ch);
}
