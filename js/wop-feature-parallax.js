(() => {
  const card = document.querySelector('[data-wop-parallax]');
  if (!card) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reducedMotion || !fineHover) return;

  const layers = [...card.querySelectorAll('[data-depth]')];
  const maxTiltX = 5;
  const maxTiltY = 6.5;
  const ease = 0.09;
  const settle = 0.13;

  let raf = 0;
  let active = false;
  let pointerX = 0;
  let pointerY = 0;

  let curRx = 0;
  let curRy = 0;
  let curTx = 0;
  let curTy = 0;
  let curLift = 0;
  let curScale = 1;
  let curImgScale = 1;
  let glowX = 50;
  let glowY = 30;

  const apply = () => {
    card.style.setProperty('--wop-rx', `${curRx.toFixed(3)}deg`);
    card.style.setProperty('--wop-ry', `${curRy.toFixed(3)}deg`);
    card.style.setProperty('--wop-tx', curTx.toFixed(4));
    card.style.setProperty('--wop-ty', curTy.toFixed(4));
    card.style.setProperty('--wop-lift', `${curLift.toFixed(2)}px`);
    card.style.setProperty('--wop-scale', curScale.toFixed(4));
    card.style.setProperty('--wop-img-scale', curImgScale.toFixed(4));
    card.style.setProperty('--wop-glow-x', `${glowX.toFixed(2)}%`);
    card.style.setProperty('--wop-glow-y', `${glowY.toFixed(2)}%`);

    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0.05);
      layer.style.setProperty('--depth-x', `${(depth * 160).toFixed(1)}px`);
      layer.style.setProperty('--depth-y', `${(depth * 110).toFixed(1)}px`);
      layer.style.setProperty('--depth-z', `${(depth * 180).toFixed(1)}px`);
    });
  };

  const tick = () => {
    const rect = card.getBoundingClientRect();
    const nx = active && rect.width ? ((pointerX - rect.left) / rect.width) - 0.5 : 0;
    const ny = active && rect.height ? ((pointerY - rect.top) / rect.height) - 0.5 : 0;

    const targetRx = active ? -(ny * maxTiltX * 2) : 0;
    const targetRy = active ? nx * maxTiltY * 2 : 0;
    const targetTx = active ? nx : 0;
    const targetTy = active ? ny : 0;
    const targetLift = active ? -6 : 0;
    const targetScale = active ? 1.008 : 1;
    const targetImgScale = active ? 1.02 : 1;
    const targetGlowX = active ? (nx + 0.5) * 100 : 50;
    const targetGlowY = active ? (ny + 0.5) * 100 : 30;

    const k = active ? ease : settle;
    curRx += (targetRx - curRx) * k;
    curRy += (targetRy - curRy) * k;
    curTx += (targetTx - curTx) * k;
    curTy += (targetTy - curTy) * k;
    curLift += (targetLift - curLift) * k;
    curScale += (targetScale - curScale) * k;
    curImgScale += (targetImgScale - curImgScale) * k;
    glowX += (targetGlowX - glowX) * k;
    glowY += (targetGlowY - glowY) * k;

    apply();

    const settling =
      Math.abs(targetRx - curRx) > 0.01 ||
      Math.abs(targetRy - curRy) > 0.01 ||
      Math.abs(targetTx - curTx) > 0.001 ||
      Math.abs(targetLift - curLift) > 0.05 ||
      Math.abs(targetScale - curScale) > 0.0005 ||
      Math.abs(targetImgScale - curImgScale) > 0.0005;

    if (active || settling) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      curRx = 0;
      curRy = 0;
      curTx = 0;
      curTy = 0;
      curLift = 0;
      curScale = 1;
      curImgScale = 1;
      glowX = 50;
      glowY = 30;
      apply();
    }
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  card.addEventListener('pointerenter', (event) => {
    active = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    card.classList.add('is-active');
    start();
  });

  card.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!active) {
      active = true;
      card.classList.add('is-active');
    }
    start();
  }, { passive: true });

  const end = () => {
    active = false;
    card.classList.remove('is-active');
    start();
  };

  card.addEventListener('pointerleave', end);
  card.addEventListener('pointercancel', end);
})();
