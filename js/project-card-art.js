(() => {
  const cards = [...document.querySelectorAll('.project-atlas .project-showcase-card')];
  if (!cards.length) return;

  const BANDS = 7;
  const OVERLAP = 0.4;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const animated = !reducedMotion && 'IntersectionObserver' in window;

  const paint = card => {
    const visual = card.querySelector('.project-showcase-card__visual');
    if (!visual || visual.querySelector('.project-art')) return;
    if (!getComputedStyle(card).getPropertyValue('--project-art').trim()) return;

    const art = document.createElement('div');
    art.className = animated ? 'project-art' : 'project-art project-art--static';
    art.setAttribute('aria-hidden', 'true');

    for (let index = 0; index < BANDS; index++) {
      const band = document.createElement('div');
      band.className = 'project-art__band';
      band.style.setProperty('--band-left', `${Math.max(index * 100 / BANDS - OVERLAP, 0)}%`);
      band.style.setProperty('--band-right', `${Math.max((BANDS - index - 1) * 100 / BANDS - OVERLAP, 0)}%`);
      band.style.setProperty('--band-from', index % 2 ? '-102%' : '102%');
      band.style.setProperty('--band-delay', `${index * 68}ms`);
      art.appendChild(band);
    }

    visual.prepend(art);
  };

  if (animated) {
    // Built well before the card reveals, so the bands are in place to animate
    // and the paintings are not fetched until the work section is approached.
    const builder = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        paint(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '600px 0px' });
    cards.forEach(card => builder.observe(card));
  } else {
    cards.forEach(paint);
  }

  if (!fineHover || reducedMotion) return;

  cards.forEach(card => {
    const visual = card.querySelector('.project-showcase-card__visual');
    if (!visual) return;

    let pending = 0;
    let pointerX = 0;
    let pointerY = 0;

    const settleLayers = (artShift, sceneShift) => {
      const art = visual.querySelector('.project-art');
      if (art) art.style.translate = artShift;
      [...visual.children].forEach(layer => {
        if (layer !== art) layer.style.translate = sceneShift;
      });
    };

    visual.addEventListener('pointermove', event => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        const rect = visual.getBoundingClientRect();
        const x = (pointerX - rect.left) / rect.width - .5;
        const y = (pointerY - rect.top) / rect.height - .5;
        // The painting drifts against the pointer and the devices with it, which
        // separates the two planes without moving either far enough to notice.
        settleLayers(`${-x * 22}px ${-y * 14}px`, `${x * 9}px ${y * 6}px`);
      });
    });

    visual.addEventListener('pointerleave', () => {
      cancelAnimationFrame(pending);
      pending = 0;
      settleLayers('', '');
    });
  });
})();
