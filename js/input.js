'use strict';
/* SUPER-NAT — input.js : keyboard + mouse + dual virtual touch sticks */

const Input = (() => {
  const keys = new Set();
  const once = new Set();
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false, seen: false };
  const st = {
    move: { id: null, ox: 0, oy: 0, dx: 0, dy: 0 },
    aim: { id: null, ox: 0, oy: 0, dx: 0, dy: 0 },
  };
  let dashQueued = false;
  const R = 58; // stick max travel (css px)

  const PREVENT = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

  function setStick(s, x, y) {
    s.dx = x - s.ox; s.dy = y - s.oy;
    const m = Math.hypot(s.dx, s.dy);
    if (m > R) { s.dx = (s.dx / m) * R; s.dy = (s.dy / m) * R; }
  }

  function init(canvas) {
    addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (PREVENT.includes(e.code)) e.preventDefault();
      if (!e.repeat) { keys.add(e.code); once.add(e.code); }
      Sfx.ensure();
    }, { passive: false });

    addEventListener('keyup', (e) => keys.delete(e.code));

    addEventListener('blur', () => { keys.clear(); mouse.down = false; });

    canvas.addEventListener('pointerdown', (e) => {
      Sfx.ensure();
      if (e.pointerType === 'mouse') {
        mouse.seen = true;
        if (e.button === 0) mouse.down = true;
        mouse.x = e.clientX; mouse.y = e.clientY;
        return;
      }
      const x = e.clientX, y = e.clientY;
      if (st.move.id === null && x < innerWidth * 0.44) {
        st.move.id = e.pointerId; st.move.ox = x; st.move.oy = y; st.move.dx = 0; st.move.dy = 0;
      } else if (st.aim.id === null) {
        st.aim.id = e.pointerId; st.aim.ox = x; st.aim.oy = y; st.aim.dx = 0; st.aim.dy = 0;
      }
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    });

    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; return; }
      if (e.pointerId === st.move.id) setStick(st.move, e.clientX, e.clientY);
      else if (e.pointerId === st.aim.id) setStick(st.aim, e.clientX, e.clientY);
    });

    const rel = (e) => {
      if (e.pointerType === 'mouse') { if (e.button === 0) mouse.down = false; return; }
      if (e.pointerId === st.move.id) st.move.id = null;
      if (e.pointerId === st.aim.id) st.aim.id = null;
    };
    addEventListener('pointerup', rel);
    addEventListener('pointercancel', rel);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // stop iOS double-tap zoom / text selection
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';
    canvas.style.webkitUserSelect = 'none';
  }

  function moveVec() {
    let x = 0, y = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (x || y) { const m = Math.hypot(x, y); return { x: x / m, y: y / m, m: 1 }; }
    if (st.move.id !== null) {
      const m = Math.hypot(st.move.dx, st.move.dy);
      if (m > 7) return { x: st.move.dx / m, y: st.move.dy / m, m: Math.min(1, m / R) };
    }
    return { x: 0, y: 0, m: 0 };
  }

  function aimInfo() {
    if (st.aim.id !== null) {
      const m = Math.hypot(st.aim.dx, st.aim.dy);
      if (m > 10) return { active: true, x: st.aim.dx / m, y: st.aim.dy / m, m: Math.min(1, m / R) };
    }
    return { active: false, x: 0, y: 0, m: 0 };
  }

  function firing() {
    if (mouse.down) return true;
    if (st.aim.id !== null && Math.hypot(st.aim.dx, st.aim.dy) > R * 0.42) return true;
    return false;
  }

  return {
    init, keys, once, mouse, st, R,
    moveVec, aimInfo, firing,
    queueDash() { dashQueued = true; },
    consumeDash() {
      const d = dashQueued || once.has('Space') || once.has('ShiftLeft') || once.has('ShiftRight');
      dashQueued = false;
      return d;
    },
    consumeKey(c) { return once.has(c); },
    clearOnce() { once.clear(); },
  };
})();
