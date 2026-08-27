(() => {
  'use strict';

  const hero = document.getElementById('home');
  if (!hero || !hero.querySelector('.hero-name-art')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;

  const syncPlayback = () => {
    hero.classList.toggle(
      'hero-artifacts-active',
      visible && !document.hidden && !reducedMotion.matches
    );
  };

  new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    syncPlayback();
  }, { threshold: .05 }).observe(hero);

  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
})();
