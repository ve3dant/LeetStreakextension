/**
 * Lightweight canvas confetti animation for LeetStreak celebrations
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LeetStreakConfetti = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function triggerCelebration(originX = null, originY = null) {
    const canvas = document.createElement('canvas');
    canvas.id = 'leetstreak-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const colors = ['#ff5722', '#ff9800', '#ffeb3b', '#4caf50', '#00e5ff', '#e040fb', '#ffffff'];
    const particles = [];
    const particleCount = 75;

    const startX = originX !== null ? originX : width / 2;
    const startY = originY !== null ? originY : height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 6;
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4, // slight upward bias
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 40 + 70
      });
    }

    let animId;
    function render() {
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;
        if (p.life < p.maxLife) {
          aliveCount++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35; // gravity
          p.vx *= 0.98; // air resistance
          p.rotation += p.rotationSpeed;

          // Fade out near end of life
          if (p.life > p.maxLife - 25) {
            p.opacity = Math.max(0, (p.maxLife - p.life) / 25);
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        animId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animId);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
    }

    render();
  }

  return {
    triggerCelebration
  };
});
