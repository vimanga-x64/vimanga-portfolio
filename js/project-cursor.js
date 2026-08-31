(() => {
  const supportsCursor = matchMedia('(hover: hover) and (pointer: fine)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportsCursor) return;

  const projectSection = document.getElementById('work');
  if (!projectSection) return;

  const targets = [...projectSection.querySelectorAll('.case__media, .project-tile, .project-showcase-card__visual[href], .project-showcase-card__launch, .project-showcase-card__details > a')];
  if (!targets.length) return;

  const cursor = document.createElement('div');
  cursor.className = 'project-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  const disc = document.createElement('span');
  disc.className = 'project-cursor__disc';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  const shaft = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  shaft.classList.add('project-cursor__shaft');
  shaft.setAttribute('d', 'M17 47 47 17');
  shaft.setAttribute('pathLength', '1');
  const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  head.classList.add('project-cursor__head');
  head.setAttribute('d', 'M22 17H47V42');
  head.setAttribute('pathLength', '1');
  svg.append(shaft, head);
  disc.append(svg);
  cursor.append(disc);
  document.body.append(cursor);

  let targetX = innerWidth / 2;
  let targetY = innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let frame = 0;
  let activeTarget = null;

  const hideCursor = () => {
    activeTarget = null;
    cursor.classList.remove('is-visible', 'is-pressed');
    document.body.classList.remove('project-cursor-active');
  };

  const draw = () => {
    frame = 0;
    currentX += (targetX - currentX) * .2;
    currentY += (targetY - currentY) * .2;
    cursor.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
    if (Math.abs(targetX - currentX) > .1 || Math.abs(targetY - currentY) > .1) {
      frame = requestAnimationFrame(draw);
    }
  };

  const requestDraw = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  addEventListener('pointermove', event => {
    targetX = event.clientX;
    targetY = event.clientY;
    requestDraw();
  }, { passive: true });

  targets.forEach(target => {
    target.addEventListener('pointerenter', event => {
      activeTarget = target;
      targetX = event.clientX;
      targetY = event.clientY;
      const projectCard = target.closest('.project-showcase-card');
      const isProjectRedirect = Boolean(projectCard);
      const isProjectVisual = target.matches('.project-showcase-card__visual[href]');
      const isWeather = Boolean(target.closest('.case--weather'));
      const cardColor = projectCard
        ? getComputedStyle(projectCard).getPropertyValue('--project-link-color').trim()
        : '';
      const surface = isProjectRedirect ? cardColor || '#f3d83f' : isWeather ? '#1e4eff' : target.closest('.case--fittrack') ? '#f3d83f' : '#f0efe9';
      cursor.style.setProperty('--project-cursor-surface', surface);
      cursor.classList.toggle('is-light', isWeather && !isProjectRedirect);
      cursor.classList.remove('is-visible', 'is-pressed');

      if (isProjectVisual) {
        const launch = projectCard.querySelector('.project-showcase-card__launch');
        if (launch) {
          const launchRect = launch.getBoundingClientRect();
          currentX = launchRect.left + launchRect.width / 2;
          currentY = launchRect.top + launchRect.height / 2;
          cursor.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
        }
      }

      void cursor.offsetWidth;
      cursor.classList.add('is-visible');
      document.body.classList.add('project-cursor-active');
      requestDraw();
    });

    target.addEventListener('pointerleave', () => {
      if (activeTarget === target) hideCursor();
    });

    target.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'));
    target.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'));
  });

  addEventListener('scroll', hideCursor, { passive: true });
  addEventListener('resize', hideCursor, { passive: true });
  addEventListener('blur', hideCursor);
  document.addEventListener('mouseleave', hideCursor);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hideCursor();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) hideCursor();
    }, { threshold: 0 }).observe(projectSection);
  }
})();
