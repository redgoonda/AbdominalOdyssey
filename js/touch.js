// touch.js — Virtual gamepad overlay for mobile browsers
// Provides a joystick (left) and action buttons (right) over the Phaser canvas.

window.TouchControls = {
  dx: 0,
  dy: 0,
  _fireDown: false,
  _interactDown: false,

  // Consumed-once getters — reset to false after the scene reads them
  get fireJustDown()     { if (this._fireDown)     { this._fireDown = false;     return true; } return false; },
  get interactJustDown() { if (this._interactDown) { this._interactDown = false; return true; } return false; }
};

(function () {
  // Only inject on touch-capable devices
  if (!('ontouchstart' in window) && !navigator.maxTouchPoints) return;

  const STICK_RADIUS = 55;

  // ── Root overlay (no pointer events by default; children opt in) ──────────
  const overlay = document.createElement('div');
  overlay.id = 'touch-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:1000',
    'pointer-events:none', 'touch-action:none', 'user-select:none'
  ].join(';');

  // ── Left joystick zone ────────────────────────────────────────────────────
  const jZone = document.createElement('div');
  jZone.style.cssText = [
    'position:absolute', 'left:0', 'bottom:0',
    'width:55%', 'height:65%',
    'pointer-events:all'
  ].join(';');

  // Visual base ring (hidden until touch)
  const jBase = document.createElement('div');
  jBase.style.cssText = [
    'position:fixed', 'width:120px', 'height:120px', 'border-radius:50%',
    'background:rgba(0,229,255,0.08)', 'border:2px solid rgba(0,229,255,0.35)',
    'pointer-events:none', 'display:none',
    'transform:translate(-50%,-50%)'
  ].join(';');

  const jKnob = document.createElement('div');
  jKnob.style.cssText = [
    'position:absolute', 'width:48px', 'height:48px', 'border-radius:50%',
    'background:rgba(0,229,255,0.55)', 'border:2px solid rgba(0,229,255,0.9)',
    'top:50%', 'left:50%', 'transform:translate(-50%,-50%)',
    'pointer-events:none'
  ].join(';');
  jBase.appendChild(jKnob);

  let jActive = false, jStartX = 0, jStartY = 0;

  jZone.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    jActive = true;
    jStartX = t.clientX;
    jStartY = t.clientY;
    jBase.style.display = 'block';
    jBase.style.left = t.clientX + 'px';
    jBase.style.top  = t.clientY + 'px';
    jKnob.style.transform = 'translate(-50%,-50%)';
  }, { passive: false });

  jZone.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!jActive) return;
    const t = e.changedTouches[0];
    const ox = t.clientX - jStartX;
    const oy = t.clientY - jStartY;
    const dist = Math.sqrt(ox * ox + oy * oy);
    const clamped = Math.min(dist, STICK_RADIUS);
    const angle = Math.atan2(oy, ox);
    const cx = Math.cos(angle) * clamped;
    const cy = Math.sin(angle) * clamped;
    window.TouchControls.dx = cx / STICK_RADIUS;
    window.TouchControls.dy = cy / STICK_RADIUS;
    jKnob.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
  }, { passive: false });

  ['touchend', 'touchcancel'].forEach(ev => {
    jZone.addEventListener(ev, e => {
      e.preventDefault();
      jActive = false;
      window.TouchControls.dx = 0;
      window.TouchControls.dy = 0;
      jBase.style.display = 'none';
    }, { passive: false });
  });

  // ── Action buttons (bottom-right) ─────────────────────────────────────────
  const btnWrap = document.createElement('div');
  btnWrap.style.cssText = [
    'position:absolute', 'right:20px', 'bottom:32px',
    'display:flex', 'flex-direction:column', 'gap:16px',
    'align-items:center', 'pointer-events:all'
  ].join(';');

  function makeBtn(label, r, g, b, onTap) {
    const btn = document.createElement('div');
    btn.style.cssText = [
      'width:70px', 'height:70px', 'border-radius:50%',
      `background:rgba(${r},${g},${b},0.12)`,
      `border:2px solid rgba(${r},${g},${b},0.65)`,
      'display:flex', 'align-items:center', 'justify-content:center',
      'font-family:\'Press Start 2P\',monospace', 'font-size:8px',
      `color:rgba(${r},${g},${b},1)`,
      `text-shadow:0 0 8px rgba(${r},${g},${b},0.7)`,
      'cursor:pointer', 'touch-action:none',
      '-webkit-tap-highlight-color:transparent',
      'transition:background 0.08s'
    ].join(';');
    btn.textContent = label;
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      btn.style.background = `rgba(${r},${g},${b},0.38)`;
      onTap();
    }, { passive: false });
    btn.addEventListener('touchend', e => {
      e.preventDefault();
      btn.style.background = `rgba(${r},${g},${b},0.12)`;
    }, { passive: false });
    return btn;
  }

  // Interact button (gold) — top of stack so thumb reaches it first
  btnWrap.appendChild(makeBtn('[ E ]', 255, 215, 0, () => {
    window.TouchControls._interactDown = true;
  }));

  // Fire button (cyan) — bottom, natural thumb position
  btnWrap.appendChild(makeBtn('FIRE', 0, 229, 255, () => {
    window.TouchControls._fireDown = true;
  }));

  // ── Assemble ──────────────────────────────────────────────────────────────
  jZone.appendChild(jBase);
  overlay.appendChild(jZone);
  overlay.appendChild(btnWrap);
  document.body.appendChild(overlay);
})();
