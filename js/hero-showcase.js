/* Magnetic hero thumbnails.
   Each card is drawn toward the cursor once it enters that card's radius, with
   the pull falling off toward the edge. Per-card output is published as:
     --pull-x / --pull-y  offset in px toward the cursor
     --pull               0 -> 1 proximity, used for scale

   CSS owns the resting rotation and arc; this only ever adds an offset, so the
   fan layout stays intact if the script never runs. */
(() => {
  const hero = document.getElementById('home');
  if (!hero) return;

  const cards = [...hero.querySelectorAll('.hero-thumb')];
  if (!cards.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');

  // Pull is capped well below the card gap so neighbours never trade places.
  const MAX_PULL = 22;
  const RADIUS_RATIO = 1.6;

  const state = cards.map(() => ({ x: 0, y: 0, p: 0, tx: 0, ty: 0, tp: 0 }));

  let centres = [];
  let radius = 160;
  let frame = 0;
  let visible = true;
  let pointerInside = false;

  const measure = () => {
    centres = cards.map((card) => {
      const rect = card.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    const first = cards[0].getBoundingClientRect();
    radius = Math.max(90, first.width * RADIUS_RATIO);
  };

  const schedule = () => {
    if (!frame && visible) frame = requestAnimationFrame(render);
  };

  const clearTargets = () => {
    state.forEach((s) => {
      s.tx = 0;
      s.ty = 0;
      s.tp = 0;
    });
    schedule();
  };

  function render() {
    frame = 0;
    let moving = false;

    for (let i = 0; i < cards.length; i++) {
      const s = state[i];
      s.x += (s.tx - s.x) * .14;
      s.y += (s.ty - s.y) * .14;
      s.p += (s.tp - s.p) * .14;

      const card = cards[i];
      card.style.setProperty('--pull-x', `${s.x.toFixed(2)}px`);
      card.style.setProperty('--pull-y', `${s.y.toFixed(2)}px`);
      card.style.setProperty('--pull', s.p.toFixed(3));

      if (Math.abs(s.tx - s.x) > .05 || Math.abs(s.ty - s.y) > .05 || Math.abs(s.tp - s.p) > .002) {
        moving = true;
      }
    }

    if (moving) schedule();
  }

  const onPointerMove = (event) => {
    if (!finePointer.matches || reducedMotion.matches) return;
    if (!pointerInside) {
      // Positions are only valid once the pane has settled at its pinned size.
      measure();
      pointerInside = true;
    }

    for (let i = 0; i < cards.length; i++) {
      const centre = centres[i];
      if (!centre) continue;
      const dx = event.clientX - centre.x;
      const dy = event.clientY - centre.y;
      const distance = Math.hypot(dx, dy);
      const s = state[i];

      if (distance > radius || distance === 0) {
        s.tx = 0;
        s.ty = 0;
        s.tp = 0;
        continue;
      }

      // Quadratic falloff: the card barely reacts at the rim and leans
      // decisively once the cursor is close.
      const strength = (1 - distance / radius) ** 2;
      s.tx = (dx / distance) * strength * MAX_PULL;
      s.ty = (dy / distance) * strength * MAX_PULL;
      s.tp = strength;
    }

    schedule();
  };

  hero.addEventListener('pointermove', onPointerMove, { passive: true });

  hero.addEventListener('pointerleave', () => {
    pointerInside = false;
    clearTargets();
  }, { passive: true });

  window.addEventListener('resize', () => {
    pointerInside = false;
    measure();
    clearTargets();
  }, { passive: true });

  // The pane is pinned, so card positions shift while the hero enters and
  // leaves; force a re-read next time the pointer arrives.
  window.addEventListener('scroll', () => {
    pointerInside = false;
  }, { passive: true });

  new IntersectionObserver(([entry]) => {
    visible = Boolean(entry && entry.isIntersecting);
    if (visible) schedule();
    else clearTargets();
  }, { threshold: 0 }).observe(hero);

  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    cards.forEach((card) => {
      card.style.removeProperty('--pull-x');
      card.style.removeProperty('--pull-y');
      card.style.removeProperty('--pull');
    });
  });

  window.addEventListener('load', measure, { once: true });
  measure();
})();
