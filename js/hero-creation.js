(() => {
  'use strict';

  const hero = document.getElementById('home');
  const scene = hero?.querySelector('.hero-creation');
  const hand = scene?.querySelector('.hero-creation-hand');
  if (!hero || !scene || !hand) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = false;
  let frame = 0;

  const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

  const render = () => {
    frame = 0;
    if (reducedMotion.matches) {
      scene.style.removeProperty('--creation-presence');
      scene.style.removeProperty('--hand-x');
      scene.style.removeProperty('--hand-y');
      scene.style.removeProperty('--hand-rotate');
      scene.style.removeProperty('--cursor-x');
      scene.style.removeProperty('--cursor-y');
      scene.style.removeProperty('--cursor-rotate');
      return;
    }

    const rect = hero.getBoundingClientRect();
    const travel = Math.max(hero.offsetHeight - window.innerHeight, 1);
    const progress = clamp(-rect.top / travel);
    const drift = Math.min(window.innerWidth * .18, 240);

    scene.style.setProperty('--creation-presence', String(clamp(1 - progress * 1.12)));
    scene.style.setProperty('--hand-x', `${(progress * drift).toFixed(2)}px`);
    scene.style.setProperty('--hand-y', `${(progress * -24).toFixed(2)}px`);
    scene.style.setProperty('--hand-rotate', `${(progress * 3).toFixed(2)}deg`);
    scene.style.setProperty('--cursor-x', `${(progress * drift * -.82).toFixed(2)}px`);
    scene.style.setProperty('--cursor-y', `${(progress * 36).toFixed(2)}px`);
    scene.style.setProperty('--cursor-rotate', `${(progress * -12).toFixed(2)}deg`);
  };

  const schedule = () => {
    if (active && !frame) frame = requestAnimationFrame(render);
  };

  const reveal = () => scene.classList.add('is-ready');
  if (hand.complete) reveal();
  else {
    hand.addEventListener('load', reveal, { once: true });
    hand.addEventListener('error', () => scene.remove(), { once: true });
  }

  new IntersectionObserver(([entry]) => {
    active = Boolean(entry?.isIntersecting);
    if (active) schedule();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { threshold: 0 }).observe(hero);

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  reducedMotion.addEventListener('change', schedule);
})();
