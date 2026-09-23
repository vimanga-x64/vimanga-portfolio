(() => {
  const desk = document.querySelector('[data-ww-desk]');
  if (!desk) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reducedMotion || !fineHover) return;

  let raf = 0;
  let px = 0;
  let py = 0;
  let curX = 0;
  let curY = 0;
  let active = false;

  const apply = () => {
    desk.style.setProperty('--ww-px', curX.toFixed(3));
    desk.style.setProperty('--ww-py', curY.toFixed(3));
  };

  const tick = () => {
    const rect = desk.getBoundingClientRect();
    const targetX = active && rect.width ? ((px - rect.left) / rect.width - 0.5) * 2 : 0;
    const targetY = active && rect.height ? ((py - rect.top) / rect.height - 0.5) * 2 : 0;
    const k = active ? 0.1 : 0.14;

    curX += (targetX - curX) * k;
    curY += (targetY - curY) * k;
    apply();

    const settling =
      Math.abs(targetX - curX) > 0.004 ||
      Math.abs(targetY - curY) > 0.004;

    if (active || settling) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      curX = 0;
      curY = 0;
      apply();
    }
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  desk.addEventListener('pointerenter', () => {
    active = true;
    start();
  });

  desk.addEventListener('pointermove', (event) => {
    px = event.clientX;
    py = event.clientY;
    active = true;
    start();
  }, { passive: true });

  const end = () => {
    active = false;
    start();
  };

  desk.addEventListener('pointerleave', end);
  desk.addEventListener('pointercancel', end);
})();
