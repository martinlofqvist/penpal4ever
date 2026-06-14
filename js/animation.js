/**
 * PenPal4ever — animation.js
 *
 * Placeholder for the right-panel animation.
 * Currently renders a solid grey fill.
 * Replace the draw() function body with your animation logic.
 */

(function () {
  const canvas = document.getElementById('animation-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
  }

  function draw() {
    // ── Placeholder: solid grey ──────────────────────────────────
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ── Add animation logic here ─────────────────────────────────
  }

  window.addEventListener('resize', resize);
  resize();
})();
