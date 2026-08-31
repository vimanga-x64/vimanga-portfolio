(() => {
  const loader = document.getElementById('loader');
  const loaderCounter = document.getElementById('loaderCounter');
  const menuButton = document.getElementById('menuButton');
  const mobileMenu = document.getElementById('mobileMenu');
  const localTime = document.getElementById('localTime');
  const themeToggle = document.getElementById('themeToggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const reducedThemeMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let themeTransitioning = false;

  const applyTheme = (theme, persist = false) => {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    themeToggle?.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    themeColor?.setAttribute('content', isDark ? '#07101e' : '#8ec8ee');
    if (persist) {
      try { localStorage.setItem('vu-theme', isDark ? 'dark' : 'light'); } catch (error) { /* Storage may be disabled. */ }
    }
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: isDark ? 'dark' : 'light' } }));
  };

  const transitionTheme = async theme => {
    if (themeTransitioning) return;

    if (!document.startViewTransition || reducedThemeMotion.matches || !themeToggle) {
      applyTheme(theme, true);
      return;
    }

    const toggleRect = themeToggle.getBoundingClientRect();
    const originX = toggleRect.left + toggleRect.width / 2;
    const originY = toggleRect.top + toggleRect.height / 2;
    const radius = Math.hypot(
      Math.max(originX, innerWidth - originX),
      Math.max(originY, innerHeight - originY)
    );

    themeTransitioning = true;
    document.documentElement.classList.add('theme-transitioning');
    themeToggle.classList.add('is-transitioning');

    const transition = document.startViewTransition(() => applyTheme(theme, true));
    const cleanup = () => {
      document.documentElement.classList.remove('theme-transitioning');
      themeToggle.classList.remove('is-transitioning');
      themeTransitioning = false;
    };

    try {
      await transition.ready;
      const reveal = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${radius}px at ${originX}px ${originY}px)`
          ]
        },
        {
          duration: 860,
          easing: 'cubic-bezier(.76,0,.24,1)',
          fill: 'both',
          pseudoElement: '::view-transition-new(root)'
        }
      );
      await reveal.finished;
      await transition.finished;
    } catch (error) {
      /* The new theme is already applied; only the animation was unavailable. */
    } finally {
      cleanup();
    }
  };

  applyTheme(document.documentElement.dataset.theme || 'light');
  themeToggle?.addEventListener('click', () => {
    transitionTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  systemTheme.addEventListener?.('change', event => {
    try {
      if (!localStorage.getItem('vu-theme')) applyTheme(event.matches ? 'dark' : 'light');
    } catch (error) {
      applyTheme(event.matches ? 'dark' : 'light');
    }
  });

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loaderWheels = [];
  const loaderReels = [];
  let announcedPercent = -1;
  let loaderFinishing = false;

  const wheelOffset = (value, place) => {
    const p = 10 ** place;
    if (place === 0) return value;
    const base = Math.floor(value / p);
    const lower = value % p;
    const wrapFrom = p - 1;
    return lower > wrapFrom ? base + (lower - wrapFrom) : base;
  };

  const buildLoaderReels = () => {
    if (!loaderCounter) return;
    const fragment = document.createDocumentFragment();
    [2, 1, 0].forEach((place, index) => {
      const length = place === 0 ? 101 : place === 1 ? 11 : 2;
      const wheel = document.createElement('span');
      wheel.className = 'loader__wheel';
      if (place > 0) wheel.classList.add('is-empty');
      wheel.dataset.place = String(place);
      const reel = document.createElement('span');
      reel.className = 'loader__reel';
      for (let i = 0; i < length; i += 1) {
        const digit = document.createElement('span');
        digit.textContent = String(i % 10);
        reel.appendChild(digit);
      }
      wheel.appendChild(reel);
      fragment.appendChild(wheel);
      loaderWheels[index] = wheel;
      loaderReels[index] = reel;
    });
    const suffix = document.createElement('span');
    suffix.className = 'loader__suffix';
    suffix.textContent = '%';
    fragment.appendChild(suffix);
    loaderCounter.replaceChildren(fragment);
  };

  const setLoaderPercent = value => {
    const next = Math.max(0, Math.min(100, value));
    if (!loader || !loaderReels.length) return;
    const rounded = Math.floor(next);
    if (rounded !== announcedPercent) {
      announcedPercent = rounded;
      loader.setAttribute('aria-label', `Loading, ${rounded} percent`);
    }
    loaderWheels[0]?.classList.toggle('is-empty', next < 100);
    loaderWheels[1]?.classList.toggle('is-empty', next < 10);
    [2, 1, 0].forEach((place, index) => {
      const offset = wheelOffset(next, place);
      loaderReels[index].style.transform = `translate3d(0, calc(var(--digit-h) * ${-offset}), 0)`;
    });
  };

  const finishLoading = () => {
    if (!loader || loaderFinishing || loader.classList.contains('is-done')) return;
    loaderFinishing = true;
    setLoaderPercent(100);
    window.setTimeout(() => {
      loader.classList.add('is-done');
      loader.setAttribute('aria-hidden', 'true');
    }, reducedMotion ? 0 : 720);
  };

  if (loader && loaderCounter && !reducedMotion) {
    buildLoaderReels();
    setLoaderPercent(0);
    const startedAt = performance.now();
    let pageLoaded = document.readyState === 'complete';
    let visual = 0;
    let lastTime = startedAt;
    const renderLoader = now => {
      if (loaderFinishing) return;
      const elapsed = now - startedAt;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const simulated = Math.min(92, (1 - Math.exp(-elapsed / 720)) * 100);
      const canComplete = pageLoaded && elapsed >= 1100;
      const target = canComplete ? 100 : simulated;
      visual += (target - visual) * (1 - Math.exp(-(canComplete ? 9 : 3.2) * dt));
      setLoaderPercent(visual);
      if (canComplete && visual >= 99.7) {
        finishLoading();
        return;
      }
      window.requestAnimationFrame(renderLoader);
    };
    window.addEventListener('load', () => { pageLoaded = true; }, { once: true });
    window.setTimeout(() => { pageLoaded = true; }, 1900);
    window.requestAnimationFrame(renderLoader);
  } else {
    loader?.classList.add('is-done');
    loader?.setAttribute('aria-hidden', 'true');
  }

  const updateTime = () => {
    if (!localTime) return;
    localTime.textContent = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date());
  };
  updateTime();
  window.setInterval(updateTime, 30000);

  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    mobileMenu?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  };

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    document.body.classList.toggle('menu-open', open);
    mobileMenu?.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  });
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -35px' });
    reveals.forEach(node => observer.observe(node));
  } else {
    reveals.forEach(node => node.classList.add('is-visible'));
  }

  const experience = document.getElementById('experience');
  if (experience) {
    if ('IntersectionObserver' in window) {
      const experienceObserver = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        experience.classList.add('is-experience-active');
        experienceObserver.disconnect();
      }, { threshold: .08 });
      experienceObserver.observe(experience);
    } else {
      experience.classList.add('is-experience-active');
    }

    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      experience.querySelectorAll('.role').forEach(role => {
        role.addEventListener('pointermove', event => {
          const bounds = role.getBoundingClientRect();
          role.style.setProperty('--role-pointer-x', `${event.clientX - bounds.left}px`);
          role.style.setProperty('--role-pointer-y', `${event.clientY - bounds.top}px`);
        }, { passive: true });
        role.addEventListener('pointerleave', () => {
          role.style.removeProperty('--role-pointer-x');
          role.style.removeProperty('--role-pointer-y');
        });
      });

      if ('animate' in Element.prototype) {
        const createStaggeredMotions = (elements, keyframes, timing) => {
          const shuffled = [...elements];
          for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
          }

          return shuffled.map((element, index) => {
            const stagger = shuffled.length > 1 ? (6000 * index) / (shuffled.length - 1) : 0;
            const motion = element.animate(keyframes, {
              ...timing,
              delay: 1000 + stagger,
              direction: 'alternate',
              iterations: Infinity,
              fill: 'both'
            });
            motion.pause();
            return motion;
          });
        };

        const artwork = [
          experience.querySelector('.experience-art--ladder img'),
          experience.querySelector('.experience-art--conduit img'),
          experience.querySelector('.experience-portal__door')
        ].filter(Boolean);
        const cards = [...experience.querySelectorAll('.role')];
        const experienceMotions = [
          ...createStaggeredMotions(artwork, [
            { translate: '0 0' },
            { translate: '10% 0' }
          ], { duration: 5000, easing: 'cubic-bezier(.45, 0, .55, 1)' }),
          ...createStaggeredMotions(cards, [
            { translate: '0 0' },
            { translate: '0 4%' }
          ], { duration: 2500, easing: 'ease-in-out' })
        ];

        let experienceIsInView = false;
        const syncExperienceMotions = () => {
          const shouldPlay = experienceIsInView && !document.hidden;
          experienceMotions.forEach(motion => shouldPlay ? motion.play() : motion.pause());
        };

        if ('IntersectionObserver' in window) {
          const motionObserver = new IntersectionObserver(([entry]) => {
            experienceIsInView = entry.isIntersecting;
            syncExperienceMotions();
          }, { threshold: 0 });
          motionObserver.observe(experience);
        } else {
          experienceIsInView = true;
          syncExperienceMotions();
        }

        document.addEventListener('visibilitychange', syncExperienceMotions);
      }
    }
  }

  const researchSection = document.getElementById('research');
  if (researchSection) {
    const activateResearch = () => researchSection.classList.add('is-research-active');

    if (reducedMotion || !('IntersectionObserver' in window)) {
      activateResearch();
    } else {
      researchSection.classList.add('research-motion-ready');
      const researchObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        activateResearch();
        researchObserver.disconnect();
      }, { threshold: .08, rootMargin: '0px 0px -12% 0px' });
      researchObserver.observe(researchSection);
    }
  }

  const shootingStar = document.getElementById('shootingStar');
  let shootingStarTimer;
  let shootingStarCleanupTimer;

  const scheduleShootingStar = (soon = false) => {
    window.clearTimeout(shootingStarTimer);
    window.clearTimeout(shootingStarCleanupTimer);
    if (!shootingStar || reducedMotion || document.documentElement.dataset.theme !== 'dark') return;
    const delay = soon ? 1900 : 9000 + Math.random() * 10000;
    shootingStarTimer = window.setTimeout(() => {
      const duration = 1.15 + Math.random() * .35;
      const trajectoryAngle = Math.atan2(window.innerHeight * .88, window.innerWidth + 190) * 180 / Math.PI;
      shootingStar.style.setProperty('--star-top', `${3 + Math.random() * 9}%`);
      shootingStar.style.setProperty('--star-angle', `${trajectoryAngle - 2 + Math.random() * 4}deg`);
      shootingStar.style.setProperty('--star-duration', `${duration.toFixed(2)}s`);
      shootingStar.classList.remove('is-flying');
      void shootingStar.offsetWidth;
      shootingStar.classList.add('is-flying');
      shootingStarCleanupTimer = window.setTimeout(() => {
        shootingStar.classList.remove('is-flying');
        scheduleShootingStar();
      }, duration * 1000 + 120);
    }, delay);
  };

  document.addEventListener('themechange', event => {
    if (event.detail.theme === 'dark') scheduleShootingStar(true);
    else {
      window.clearTimeout(shootingStarTimer);
      window.clearTimeout(shootingStarCleanupTimer);
      shootingStar?.classList.remove('is-flying');
    }
  });
  if (document.documentElement.dataset.theme === 'dark') scheduleShootingStar(true);

  const heroTitle = document.getElementById('hero-title');
  const heroGreeting = heroTitle?.querySelector('.hero__greeting');
  const heroRoleWrap = document.getElementById('heroRoleWrap');
  const heroRole = document.getElementById('heroRole');
  const rotatingRoles = [
    { label: 'SOFTWARE DEVELOPER', color: '#f3d83f' },
    { label: 'M.SC. CANDIDATE', color: '#8ee89a' },
    { label: 'GRADUATE RESEARCHER', color: '#ff8a57' },
    { label: 'FULL-STACK BUILDER', color: '#b9a7ff' }
  ];
  let roleIndex = 0;

  if (heroRoleWrap && heroRole) {
    const roleWipe = heroRoleWrap.querySelector('.hero__role-wipe');
    const roleMeasure = document.createElement('span');
    roleMeasure.className = 'hero__role-measure';
    roleMeasure.setAttribute('aria-hidden', 'true');
    heroRoleWrap.append(roleMeasure);
    let roleAnimating = false;

    const measureRole = label => {
      roleMeasure.textContent = label;
      // Text metrics do not include every anti-aliased edge/italic overhang.
      // Keep a font-scaled gutter inside the clipping wrapper so final glyphs
      // (notably the R in RESEARCHER) never touch its hard edge.
      const fontSize = parseFloat(getComputedStyle(roleMeasure).fontSize) || 16;
      const glyphGutter = Math.max(28, Math.ceil(fontSize * 0.22));
      return Math.ceil(roleMeasure.getBoundingClientRect().width) + glyphGutter;
    };

    const positionTitle = roleWidth => {
      if (!heroTitle) return;
      const titleRect = heroTitle.getBoundingClientRect();
      const transform = getComputedStyle(heroTitle).transform;
      const currentShift = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
      const unshiftedLeft = titleRect.left - currentShift;
      const greetingWidth = heroGreeting?.scrollWidth || 0;
      const roleFontSize = parseFloat(getComputedStyle(heroRoleWrap).fontSize) || 16;
      const ribbonOverhang = Math.max(24, Math.ceil(roleFontSize * 0.3));
      const widestLine = Math.max(roleWidth + ribbonOverhang, greetingWidth);
      const safeLeft = 8;
      const safeRight = innerWidth - 8;
      const overflow = Math.max(0, unshiftedLeft + widestLine - safeRight);
      const nextShift = -Math.min(overflow, Math.max(0, unshiftedLeft - safeLeft));
      heroTitle.style.setProperty('--hero-title-shift', `${nextShift}px`);
    };

    const syncRoleWidth = () => {
      if (roleAnimating) return;
      const width = measureRole(heroRole.textContent);
      heroRoleWrap.style.setProperty('--role-width', `${width}px`);
      positionTitle(width);
    };

    syncRoleWidth();
    document.fonts?.ready.then(syncRoleWidth);
    window.addEventListener('resize', syncRoleWidth, { passive: true });

    if (!reducedMotion && roleWipe && typeof roleWipe.animate === 'function') {
      const transitionRole = async () => {
        if (roleAnimating) return;
        roleAnimating = true;
        const nextIndex = (roleIndex + 1) % rotatingRoles.length;
        const currentWidth = measureRole(rotatingRoles[roleIndex].label);
        const nextWidth = measureRole(rotatingRoles[nextIndex].label);
        heroRoleWrap.style.setProperty('--role-color', rotatingRoles[nextIndex].color);

        heroRoleWrap.style.setProperty('--role-width', `${currentWidth}px`);
        roleWipe.style.removeProperty('width');
        roleWipe.style.transform = 'scaleX(0)';

        try {
          const cover = roleWipe.animate(
            [{ transform: 'scaleX(0)', transformOrigin: 'left center' }, { transform: 'scaleX(1)', transformOrigin: 'left center' }],
            { duration: 520, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' }
          );
          await cover.finished;
          roleWipe.style.transform = 'scaleX(1)';
          cover.cancel();

          heroRole.textContent = rotatingRoles[nextIndex].label;
          roleIndex = nextIndex;
          positionTitle(nextWidth);

          const resizeWrapper = heroRoleWrap.animate(
            [{ width: `${currentWidth}px` }, { width: `${nextWidth}px` }],
            { duration: 520, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' }
          );
          const uncover = roleWipe.animate(
            [{ transform: 'scaleX(1)', transformOrigin: 'right center' }, { transform: 'scaleX(0)', transformOrigin: 'right center' }],
            { duration: 520, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' }
          );

          await Promise.all([resizeWrapper.finished, uncover.finished]);
          heroRoleWrap.style.setProperty('--role-width', `${nextWidth}px`);
          roleWipe.style.transform = 'scaleX(0)';
          resizeWrapper.cancel();
          uncover.cancel();
        } finally {
          roleWipe.getAnimations().forEach(animation => animation.cancel());
          roleAnimating = false;
        }
      };

      window.setInterval(transitionRole, 2200);
    }
  }

  // A deterministic editorial curtain avoids blank cross-document snapshots
  // while still giving the two case studies a deliberate hand-off.
  const caseCurtain = document.getElementById('caseNavigationCurtain');
  const caseCurtainTitle = document.getElementById('caseNavigationTitle');
  document.querySelectorAll('[data-case-transition]').forEach(card => {
    const caseName = card.dataset.caseTransition;
    card.querySelectorAll('a[href$=".html"]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!caseCurtain || reducedMotion) return;
        event.preventDefault();
        if (document.body.classList.contains('is-navigating-case')) return;
        caseCurtain.dataset.case = caseName;
        if (caseCurtainTitle) caseCurtainTitle.textContent = card.querySelector('h3')?.textContent || 'Case study';
        document.body.classList.add('is-navigating-case');
        caseCurtain.classList.add('is-active');
        window.setTimeout(() => window.location.assign(link.href), 580);
      });
    });
  });

  window.addEventListener('pageshow', () => {
    document.body.classList.remove('is-navigating-case');
    caseCurtain?.classList.remove('is-active');
  });

  const projectCards = [...document.querySelectorAll('.project-atlas .project-showcase-card')];
  if (projectCards.length && !reducedMotion && 'IntersectionObserver' in window) {
    const rows = [];
    projectCards.forEach(card => {
      const top = card.offsetTop;
      let row = rows.find(item => Math.abs(item.top - top) < 12);
      if (!row) {
        row = { top, count: 0 };
        rows.push(row);
      }
      card.style.setProperty('--project-reveal-delay', `${row.count * 130}ms`);
      row.count += 1;
      card.classList.add('project-reveal-ready');
    });

    const projectRevealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        projectRevealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: .04 });

    projectCards.forEach(card => projectRevealObserver.observe(card));
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const gardenBar = document.querySelector('.garden-footer__bar');
  const gardenState = gardenBar?.querySelector('[data-garden-state]');
  const gardenTime = gardenBar?.querySelector('[data-garden-time]');
  const gardenMatcha = gardenBar?.querySelector('[data-garden-matcha]');
  const gardenActivity = gardenBar?.querySelector('.garden-footer__activity');
  if (gardenBar && gardenState && gardenTime && gardenMatcha && gardenActivity) {
    const TORONTO = 'America/Toronto';
    const matchaBase = Number(gardenBar.dataset.matchaBase) || 155;
    const matchaStartedAt = new Date(gardenBar.dataset.matchaStart);
    const torontoDay = new Intl.DateTimeFormat('en-CA', {
      timeZone: TORONTO, year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const torontoClock = new Intl.DateTimeFormat('en-CA', {
      timeZone: TORONTO, hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZoneName: 'short'
    });
    const torontoHour = new Intl.DateTimeFormat('en-CA', {
      timeZone: TORONTO, hour: '2-digit', hour12: false
    });
    const dayIndex = (date) => {
      const parts = Object.fromEntries(
        torontoDay.formatToParts(date)
          .filter(({ type }) => type !== 'literal')
          .map(({ type, value }) => [type, Number(value)])
      );
      return Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000;
    };
    const activityFor = (hour) => {
      if (hour < 6 || hour >= 22) return { label: 'probably asleep', mode: 'asleep' };
      if (hour < 9) return { label: 'booting up', mode: 'booting' };
      if (hour < 12) return { label: 'caffeinated', mode: 'caffeinated' };
      if (hour < 18) return { label: 'building things', mode: 'building' };
      return { label: 'still shipping', mode: 'shipping' };
    };
    const renderGardenLive = () => {
      const now = new Date();
      const hour = Number(torontoHour.format(now));
      const activity = activityFor(Number.isFinite(hour) ? hour : 12);
      gardenState.textContent = activity.label;
      gardenActivity.dataset.mode = activity.mode;
      gardenTime.textContent = torontoClock.format(now).replace(',', '');
      gardenTime.setAttribute('datetime', now.toISOString());
      const matchaDays = Number.isNaN(matchaStartedAt.getTime())
        ? 0
        : Math.max(0, dayIndex(now) - dayIndex(matchaStartedAt));
      gardenMatcha.textContent = String(matchaBase + matchaDays);
    };
    renderGardenLive();
    let gardenTimer = 0;
    let gardenVisible = false;
    const startGardenLive = () => {
      if (gardenTimer || document.hidden) return;
      gardenTimer = window.setInterval(renderGardenLive, 1000);
    };
    const stopGardenLive = () => {
      window.clearInterval(gardenTimer);
      gardenTimer = 0;
    };
    if ('IntersectionObserver' in window) {
      const gardenLiveObserver = new IntersectionObserver(entries => {
        gardenVisible = !!entries[0]?.isIntersecting;
        if (gardenVisible && !document.hidden) startGardenLive();
        else stopGardenLive();
      }, { rootMargin: '80px 0px' });
      gardenLiveObserver.observe(gardenBar);
    } else {
      gardenVisible = true;
      startGardenLive();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopGardenLive();
        return;
      }
      renderGardenLive();
      if (gardenVisible) startGardenLive();
    });
  }

  const header = document.getElementById('siteHeader');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    if (header && currentY > 240 && currentY > lastY && !document.body.classList.contains('menu-open')) {
      header.classList.add('is-hidden');
    } else if (header) {
      header.classList.remove('is-hidden');
    }
    lastY = currentY;
  }, { passive: true });

  const butterflies = document.querySelector('.garden-footer__butterflies');
  if (butterflies && !reducedMotion) {
    const playButterflies = () => butterflies.play().catch(() => {});
    butterflies.removeAttribute('autoplay');
    butterflies.preload = 'none';
    if ('IntersectionObserver' in window) {
      const butterflyObserver = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting && !document.hidden) playButterflies();
        else butterflies.pause();
      }, { rootMargin: '80px 0px', threshold: 0.05 });
      butterflyObserver.observe(butterflies);
    } else {
      playButterflies();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) butterflies.pause();
    });
  }
})();
