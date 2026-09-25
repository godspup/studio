'use strict';

// ---------- КЛАВИАТУРА ----------
const keys = {};
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  if (k === 'p' || k === 'escape') togglePause();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// ---------- ВИРТУАЛЬНЫЙ ДЖОЙСТИК ----------
const joy = { active: false, id: null, cx: 0, cy: 0, dx: 0, dy: 0 };
const joyEl = document.getElementById('joy');
const joyKnob = document.getElementById('joyKnob');

function initInput() {
  canvas.addEventListener('pointerdown', e => {
    if (joy.active) return;
    joy.active = true; joy.id = e.pointerId;
    joy.cx = e.clientX; joy.cy = e.clientY;
    joy.dx = 0; joy.dy = 0;
    joyEl.style.left = (e.clientX - 60) + 'px';
    joyEl.style.top  = (e.clientY - 60) + 'px';
    joyEl.classList.add('show');
    try { canvas.setPointerCapture(e.pointerId); } catch(err) {}
  });

  canvas.addEventListener('pointermove', e => {
    if (!joy.active || e.pointerId !== joy.id) return;
    let dx = e.clientX - joy.cx, dy = e.clientY - joy.cy;
    const max = 55, d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    joy.dx = dx / max; joy.dy = dy / max;
    joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  });

  function endJoy(e) {
    if (e.pointerId !== joy.id) return;
    joy.active = false;
    joyEl.classList.remove('show');
    joyKnob.style.transform = 'translate(-50%,-50%)';
  }
  canvas.addEventListener('pointerup', endJoy);
  canvas.addEventListener('pointercancel', endJoy);
}

// ---------- ГОРЯЧИЕ КЛАВИШИ DEV ----------
// (P/Esc уже обработаны выше и вызывают togglePause)