(() => {
  'use strict';

  document.documentElement.classList.add('studio-motion-ready');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const prefersLiteMotion = prefersReducedMotion.matches || Boolean(connection?.saveData) || Boolean(navigator.deviceMemory && navigator.deviceMemory <= 2);
  const slowConnection = /(^|-)2g$/.test(connection?.effectiveType || '') || Boolean(connection?.downlink && connection.downlink < 2.5);
  const useLightweight3D = prefersLiteMotion || slowConnection || window.matchMedia('(max-width: 820px)').matches || Boolean(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  document.documentElement.classList.toggle('studio-performance-lite', prefersLiteMotion);
  document.documentElement.classList.toggle('studio-lightweight-3d', useLightweight3D);

  function initStudioReveals() {
    const revealGroups = [
      { selector: '.section-heading-row .section-title, #contact .contact-title', type: 'headline' },
      { selector: '.section-deck, .research-intro-desc, .contact-subtitle', type: 'copy' },
      { selector: '#about .education-record', type: 'card' },
      { selector: '#projects .project-visual', type: 'project-visual' },
      { selector: '#projects .project-info', type: 'project-copy' },
      { selector: '#research .research-left', type: 'from-left' },
      { selector: '#contact .minimal-contact-form, #contact .contact-social', type: 'panel' }
    ];

    revealGroups.forEach(({ selector, type }) => {
      document.querySelectorAll(selector).forEach((item, index) => {
        item.setAttribute('data-studio-reveal', type);
        item.style.setProperty('--studio-reveal-delay', `${Math.min(index, 4) * 65}ms`);
      });
    });

    document.querySelectorAll('#experience .exp-timeline-item').forEach((item, index) => {
      item.setAttribute('data-studio-reveal', 'experience');
      item.style.setProperty('--studio-reveal-delay', `${Math.min(index, 3) * 90}ms`);
    });

    const items = [...document.querySelectorAll('[data-studio-reveal]')];
    if (!items.length) return;

    if (prefersLiteMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const pendingItems = new Set(items);
    let fallbackFrame = 0;

    const revealItem = (item) => {
      if (!pendingItems.has(item)) return;
      item.classList.add('is-visible');
      pendingItems.delete(item);
      observer.unobserve(item);
      if (!pendingItems.size) {
        window.removeEventListener('scroll', scheduleRevealCheck);
        window.removeEventListener('resize', scheduleRevealCheck);
      }
    };

    const revealPassedItems = () => {
      fallbackFrame = 0;
      pendingItems.forEach((item) => {
        if (item.getBoundingClientRect().top <= window.innerHeight * .94) revealItem(item);
      });
    };

    const scheduleRevealCheck = () => {
      if (!fallbackFrame) fallbackFrame = window.requestAnimationFrame(revealPassedItems);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const hasPassedRevealPoint = entry.boundingClientRect.top <= window.innerHeight * .94;
        if (!entry.isIntersecting && !hasPassedRevealPoint) return;
        revealItem(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });

    items.forEach((item) => observer.observe(item));
    window.addEventListener('scroll', scheduleRevealCheck, { passive: true });
    window.addEventListener('resize', scheduleRevealCheck, { passive: true });
    scheduleRevealCheck();
  }

  function initWorkstationPointer() {
    const hero = document.getElementById('home');
    if (!hero) return;

    const heading = hero.querySelector('.hero-name-section h1');
    const computerModel = document.getElementById('heroComputerModel');
    const computerStage = hero.querySelector('.hero-computer-stage');
    const accessoryModels = [...hero.querySelectorAll('.hero-accessory-model')];
    const keyboardModel = hero.querySelector('.hero-keyboard-model');
    const mouseModel = hero.querySelector('.hero-mouse-model');
    const floppyModel = hero.querySelector('.hero-floppy-model');
    const loadingScreen = document.getElementById('loading-screen');
    let computerReady = Boolean(computerModel?.loaded);
    const readyAccessories = new Set(accessoryModels.filter((model) => model.loaded));
    const settledAccessories = new Set(readyAccessories);
    let revealScheduled = false;
    let workstationRevealed = false;
    let accessoriesHydrated = false;
    let accessoryFallbackTimer = 0;
    let readinessTimeout = 0;

    const revealWorkstation = (force = false) => {
      if (workstationRevealed || !hero.classList.contains('hero-scene-ready') || !computerStage) return;

      if (useLightweight3D) {
        if (!computerReady) return;
      } else {
        if (!accessoriesHydrated || !computerReady) return;
        const allAccessoriesReady = readyAccessories.size === accessoryModels.length;
        if (!allAccessoriesReady && !force) return;
      }

      workstationRevealed = true;
      if (readinessTimeout) window.clearTimeout(readinessTimeout);
      window.requestAnimationFrame(() => {
        computerStage.classList.add('is-model-ready');
        readyAccessories.forEach((model) => model.classList.add('is-model-ready'));
        hero.classList.add('hero-workstation-ready');
      });
    };

    const hydrateAccessories = () => {
      if (accessoriesHydrated) return;
      accessoriesHydrated = true;
      if (accessoryFallbackTimer) window.clearTimeout(accessoryFallbackTimer);
      if (useLightweight3D) return;
      accessoryModels.forEach((model) => {
        if (model.dataset.src && !model.getAttribute('src')) model.setAttribute('src', model.dataset.src);
      });
      readinessTimeout = window.setTimeout(() => revealWorkstation(true), 12000);
      revealWorkstation();
    };

    const beginHeroReveal = () => {
      if (loadingScreen && !loadingScreen.classList.contains('hidden')) return;
      if (revealScheduled) return;
      revealScheduled = true;
      window.setTimeout(() => {
        hero.classList.add('hero-light-ready');
        if (!useLightweight3D) {
          hero.addEventListener('pointerenter', hydrateAccessories, { once: true, passive: true });
          hero.addEventListener('pointermove', hydrateAccessories, { once: true, passive: true });
          accessoryFallbackTimer = window.setTimeout(hydrateAccessories, 6500);
        }
        window.setTimeout(() => {
          hero.classList.add('hero-scene-ready');
          revealWorkstation();
        }, prefersReducedMotion.matches ? 0 : 560);
      }, prefersReducedMotion.matches || !loadingScreen ? 0 : 520);
    };

    if (computerModel && !computerReady) {
      computerModel.addEventListener('load', () => {
        computerReady = true;
        revealWorkstation();
      }, { once: true });
    }
    accessoryModels.forEach((model) => {
      if (model.loaded) return;
      model.addEventListener('load', () => {
        readyAccessories.add(model);
        settledAccessories.add(model);
        revealWorkstation();
      }, { once: true });
      model.addEventListener('error', () => {
        settledAccessories.add(model);
        if (settledAccessories.size === accessoryModels.length) revealWorkstation(true);
      }, { once: true });
    });
    if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
      const accessoryObserver = new MutationObserver(() => {
        if (!loadingScreen.classList.contains('hidden')) return;
        accessoryObserver.disconnect();
        beginHeroReveal();
      });
      accessoryObserver.observe(loadingScreen, { attributes: true, attributeFilter: ['class'] });
    } else {
      beginHeroReveal();
    }
    if (prefersLiteMotion || !window.matchMedia('(pointer: fine)').matches) return;
    const letters = [];
    if (heading && !heading.querySelector('.hero-letter')) {
      [...heading.childNodes].forEach((node) => {
        if (node.nodeName === 'BR') return;
        if (node.nodeType !== Node.TEXT_NODE) return;
        const fragment = document.createDocumentFragment();
        [...node.textContent].forEach((character, index) => {
          const span = document.createElement('span');
          span.className = 'hero-letter';
          span.textContent = character;
          span.style.setProperty('--letter-index', letters.length + index);
          letters.push(span);
          fragment.appendChild(span);
        });
        node.replaceWith(fragment);
      });
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let targetScroll = 0;
    let currentScroll = 0;
    let isVisible = true;
    let workstationFrame = 0;

    const scheduleWorkstationRender = () => {
      if (isVisible && !workstationFrame) workstationFrame = window.requestAnimationFrame(render);
    };

    const updateScrollTarget = () => {
      const rect = hero.getBoundingClientRect();
      targetScroll = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height * .9)));
      scheduleWorkstationRender();
    };

    const setTarget = (event) => {
      const rect = hero.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      scheduleWorkstationRender();
    };

    const resetTarget = () => {
      targetX = 0;
      targetY = 0;
      scheduleWorkstationRender();
    };

    hero.addEventListener('pointermove', setTarget, { passive: true });
    hero.addEventListener('pointerleave', resetTarget, { passive: true });
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('resize', updateScrollTarget, { passive: true });
    updateScrollTarget();

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry && entry.isIntersecting);
      hero.classList.toggle('is-scene-active', isVisible);
      if (!isVisible) resetTarget();
      else scheduleWorkstationRender();
    }, { threshold: 0.08 });
    observer.observe(hero);

    function render() {
      workstationFrame = 0;
      if (!isVisible) return;
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;
      currentScroll += (targetScroll - currentScroll) * .085;
      hero.style.setProperty('--studio-pointer-x', currentX.toFixed(4));
      hero.style.setProperty('--studio-pointer-y', currentY.toFixed(4));
      hero.style.setProperty('--hero-scene-exit-x', `${(currentScroll * 6).toFixed(2)}vw`);
      hero.style.setProperty('--hero-scene-exit-y', `${(-currentScroll * 8).toFixed(2)}vh`);
      const exitFade = Math.max(0, Math.min(1, (currentScroll - .42) / .5));
      hero.style.setProperty('--hero-scene-opacity', (1 - exitFade * .96).toFixed(3));
      if (computerModel) {
        const theta = -10 + currentX * 8 + currentScroll * 58;
        const phi = 72 - currentY * 5 - currentScroll * 7;
        computerModel.cameraOrbit = `${theta.toFixed(2)}deg ${phi.toFixed(2)}deg 86%`;
      }
      if (keyboardModel) {
        const theta = -18 - currentX * 7 + currentScroll * 205;
        const phi = 68 - currentY * 4 - currentScroll * 6;
        keyboardModel.cameraOrbit = `${theta.toFixed(2)}deg ${phi.toFixed(2)}deg 90%`;
      }
      if (mouseModel) {
        const theta = 24 + currentX * 12 - currentScroll * 238;
        const phi = 68 - currentY * 5 + currentScroll * 5;
        mouseModel.cameraOrbit = `${theta.toFixed(2)}deg ${phi.toFixed(2)}deg 92%`;
      }
      if (floppyModel) {
        const theta = 18 - currentX * 9 + currentScroll * 190;
        const phi = 72 - currentY * 4 - currentScroll * 4;
        floppyModel.cameraOrbit = `${theta.toFixed(2)}deg ${phi.toFixed(2)}deg 78%`;
      }
      letters.forEach((letter, index) => {
        const horizontal = Math.sin(index * 0.72) * currentX * 2.2;
        const vertical = Math.cos(index * 0.58) * currentY * 1.8;
        const rotation = Math.sin(index * 0.45) * currentX * 0.28;
        letter.style.transform = `translate3d(${horizontal}px, ${vertical}px, 0) rotate(${rotation}deg)`;
      });
      const stillMoving = Math.abs(targetX - currentX) > .001
        || Math.abs(targetY - currentY) > .001
        || Math.abs(targetScroll - currentScroll) > .001;
      if (stillMoving) scheduleWorkstationRender();
    }

    scheduleWorkstationRender();
  }

  function initProjectProgress() {
    const wrapper = document.getElementById('projectsBorderWrapper');
    const cards = [...document.querySelectorAll('#projectGridTrack .project-card')];
    const dots = document.getElementById('projectProgressDots');
    const current = document.getElementById('projectProgressCurrent');
    const total = document.getElementById('projectProgressTotal');

    if (!wrapper || !cards.length || !dots || !current || !total) return;

    let activeIndex = 0;
    let ticking = false;

    wrapper.tabIndex = 0;
    wrapper.setAttribute('aria-label', 'Selected projects carousel. Use the left and right arrow keys to navigate.');
    total.textContent = String(cards.length).padStart(2, '0');

    const scrollToCard = (index) => {
      const card = cards[Math.max(0, Math.min(cards.length - 1, index))];
      if (!card) return;
      const left = card.offsetLeft - (wrapper.clientWidth - card.offsetWidth) / 2;
      wrapper.scrollTo({ left, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
    };

    const dotButtons = cards.map((card, index) => {
      card.dataset.projectNumber = String(index + 1).padStart(2, '0');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-progress-dot';
      button.setAttribute('aria-label', `Go to project ${index + 1} of ${cards.length}`);
      button.addEventListener('click', () => scrollToCard(index));
      dots.appendChild(button);
      return button;
    });

    const updateActiveProject = () => {
      ticking = false;
      const wrapperRect = wrapper.getBoundingClientRect();
      const center = wrapperRect.left + wrapperRect.width / 2;
      let nearestDistance = Number.POSITIVE_INFINITY;
      let nearestIndex = 0;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(center - (rect.left + rect.width / 2));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      activeIndex = nearestIndex;
      current.textContent = String(activeIndex + 1).padStart(2, '0');

      cards.forEach((card, index) => {
        card.dataset.projectActive = String(index === activeIndex);
      });

      dotButtons.forEach((dot, index) => {
        if (index === activeIndex) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActiveProject);
    };

    wrapper.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    wrapper.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      scrollToCard(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });

    updateActiveProject();
  }

  function initContactParallax() {
    const contact = document.getElementById('contact');
    const canvas = document.getElementById('contact-particles-canvas');
    if (!contact || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const canTrackPointer = window.matchMedia('(pointer: fine)').matches && !prefersLiteMotion;
    let width = 0;
    let height = 0;
    let particles = [];
    let targetX = 0;
    let targetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let isVisible = false;
    let animationFrame = 0;
    let lastRenderedTime = 0;
    let pointerActiveUntil = 0;
    let particleColor = document.documentElement.dataset.theme === 'light' ? '32,34,31' : '255,255,255';
    const idleFrameInterval = 1000 / 24;
    const interactiveFrameInterval = 1000 / 45;

    const themeObserver = new MutationObserver(() => {
      particleColor = document.documentElement.dataset.theme === 'light' ? '32,34,31' : '255,255,255';
      draw(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const createParticles = () => {
      const count = prefersLiteMotion
        ? (width < 700 ? 28 : Math.min(58, Math.max(40, Math.round((width * height) / 26000))))
        : (width < 700 ? 48 : Math.min(105, Math.max(72, Math.round((width * height) / 15000))));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: index % 17 === 0 ? 1.65 : .45 + Math.random() * .95,
        alpha: .26 + Math.random() * .64,
        depth: .25 + Math.random() * .95,
        phase: Math.random() * Math.PI * 2,
        velocityX: (Math.random() - .5) * .055,
        velocityY: -.024 - Math.random() * .034,
        glint: index % 17 === 0
      }));
    };

    const resize = () => {
      const rect = contact.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, prefersLiteMotion ? 1.25 : 2);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
      draw(performance.now());
    };

    const draw = (time) => {
      context.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        const driftX = pointerX * particle.depth * 18;
        const driftY = pointerY * particle.depth * 14;
        const ambientX = prefersReducedMotion.matches ? 0 : Math.sin(time * .00018 + particle.phase) * (2.6 + particle.depth * 4.8);
        const ambientY = prefersReducedMotion.matches ? 0 : Math.cos(time * .00015 + particle.phase * 1.3) * (2 + particle.depth * 3.8);
        const x = particle.x + driftX + ambientX;
        const y = particle.y + driftY + ambientY;
        const shimmer = prefersReducedMotion.matches ? 1 : .78 + Math.sin(time * .0012 + particle.phase) * .22;

        context.beginPath();
        context.fillStyle = `rgba(${particleColor},${particle.alpha * shimmer})`;
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();

        if (particle.glint) {
          const length = 4 + particle.depth * 4;
          context.strokeStyle = `rgba(${particleColor},${particle.alpha * .28 * shimmer})`;
          context.lineWidth = .6;
          context.beginPath();
          context.moveTo(x - length, y);
          context.lineTo(x + length, y);
          context.moveTo(x, y - length);
          context.lineTo(x, y + length);
          context.stroke();
        }
      });
    };

    const render = (time) => {
      if (!isVisible) {
        animationFrame = 0;
        lastRenderedTime = 0;
        return;
      }

      const frameInterval = time < pointerActiveUntil ? interactiveFrameInterval : idleFrameInterval;
      if (lastRenderedTime && time - lastRenderedTime < frameInterval) {
        animationFrame = window.requestAnimationFrame(render);
        return;
      }

      pointerX += (targetX - pointerX) * .055;
      pointerY += (targetY - pointerY) * .055;
      const delta = lastRenderedTime ? Math.min(3, (time - lastRenderedTime) / 16.667) : 1;
      lastRenderedTime = time;
      if (!prefersReducedMotion.matches) {
        particles.forEach((particle) => {
          particle.x += particle.velocityX * delta;
          particle.y += particle.velocityY * delta;
          if (particle.x < -12) particle.x = width + 12;
          if (particle.x > width + 12) particle.x = -12;
          if (particle.y < -12) particle.y = height + 12;
        });
      }
      draw(time);
      animationFrame = window.requestAnimationFrame(render);
    };

    if (canTrackPointer) {
      contact.addEventListener('pointermove', (event) => {
        const rect = contact.getBoundingClientRect();
        targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
        targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
        pointerActiveUntil = performance.now() + 180;
      }, { passive: true });

      contact.addEventListener('pointerleave', () => {
        targetX = 0;
        targetY = 0;
      }, { passive: true });
    }

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      if (isVisible && !animationFrame && !prefersReducedMotion.matches) {
        animationFrame = window.requestAnimationFrame(render);
      } else if (isVisible && prefersReducedMotion.matches) {
        draw(performance.now());
      }
    }, { threshold: 0.05 });
    observer.observe(contact);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(contact);
    resize();
  }

  function initLegacyPortal() {
    const portal = document.querySelector('.legacy-portal');
    const model = portal?.querySelector('.legacy-telephone-model');
    if (!portal || !model) return;

    if (useLightweight3D) {
      portal.classList.add('is-static-fallback');
      return;
    }

    if (prefersLiteMotion) model.removeAttribute('auto-rotate');

    const hydrateModel = () => {
      if (!model.dataset.src || model.getAttribute('src')) return;
      model.setAttribute('src', model.dataset.src);
    };

    if (!('IntersectionObserver' in window)) {
      hydrateModel();
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      hydrateModel();
      observer.disconnect();
    }, { threshold: 0.01, rootMargin: '320px 0px' });

    observer.observe(portal);
  }

  function initEducationGlobe() {
    const canvas = document.getElementById('education-globe-canvas');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const figure = canvas.closest('.education-globe');
    const aboutSection = document.getElementById('about');

    const locations = [
      { label: 'Windsor', latitude: 42.3149, longitude: -83.0364, phase: 0 },
      { label: 'Wichita', latitude: 37.6872, longitude: -97.3301, phase: Math.PI }
    ];
    const landMasses = [
      { color: 'rgba(114,214,208,.58)', points: [[-168,72],[-145,69],[-135,57],[-128,54],[-124,49],[-105,49],[-95,50],[-84,46],[-67,46],[-58,52],[-64,60],[-82,62],[-95,70],[-120,73]] },
      { color: 'rgba(230,173,58,.88)', points: [[-125,49],[-124,42],[-117,32],[-107,31],[-103,29],[-97,26],[-82,25],[-80,30],[-75,35],[-67,45],[-83,46],[-96,49]] },
      { color: 'rgba(224,111,82,.72)', points: [[-117,32],[-107,31],[-103,29],[-97,26],[-86,20],[-90,16],[-100,20],[-106,23],[-114,28]] },
      { color: 'rgba(137,182,112,.66)', points: [[-81,12],[-75,3],[-79,-5],[-74,-15],[-70,-20],[-66,-31],[-60,-38],[-68,-56],[-73,-44],[-77,-34],[-78,-17],[-68,-2],[-50,5],[-35,-6],[-40,-17],[-50,-28]] },
      { color: 'rgba(243,238,226,.46)', points: [[-73,82],[-45,83],[-20,78],[-26,61],[-48,58],[-64,69]] }
    ];
    let countryFeatures = [];
    let size = 0;
    let visible = false;
    let frame = 0;
    let currentRotation = 148;
    let targetRotation = 148;
    let entrance = prefersReducedMotion.matches ? 1 : 0;
    let targetEntrance = entrance;

    // Stable texture points avoid the shimmer caused by generating noise per frame.
    const oceanTexture = Array.from({ length: 170 }, (_, index) => ({
      x: ((index * 47) % 167) / 166 * 2 - 1,
      y: ((index * 83) % 173) / 172 * 2 - 1,
      alpha: .018 + (index % 5) * .006
    })).filter((point) => point.x * point.x + point.y * point.y < .94);

    const project = (latitude, longitude, rotation, radius) => {
      const phi = latitude * Math.PI / 180;
      const lambda = (longitude + rotation) * Math.PI / 180;
      const tilt = -7 * Math.PI / 180;
      const rawY = -Math.sin(phi);
      const rawZ = Math.cos(phi) * Math.cos(lambda);
      return {
        x: Math.cos(phi) * Math.sin(lambda) * radius,
        y: (rawY * Math.cos(tilt) - rawZ * Math.sin(tilt)) * radius,
        z: rawY * Math.sin(tilt) + rawZ * Math.cos(tilt)
      };
    };

    const drawLine = (points, strokeStyle, lineWidth) => {
      context.strokeStyle = strokeStyle;
      context.lineWidth = lineWidth;
      context.beginPath();
      let drawing = false;
      points.forEach((point) => {
        if (point.z <= 0) {
          drawing = false;
          return;
        }
        const x = size / 2 + point.x;
        const y = size / 2 + point.y;
        if (!drawing) context.moveTo(x, y);
        else context.lineTo(x, y);
        drawing = true;
      });
      context.stroke();
    };

    const drawLand = (land, rotation, radius, isLight) => {
      const projected = land.points.map(([longitude, latitude]) => project(latitude, longitude, rotation, radius));
      if (projected.some((point) => point.z <= 0)) return;
      context.beginPath();
      projected.forEach((point, index) => {
        const x = size / 2 + point.x;
        const y = size / 2 + point.y;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.closePath();
      context.fillStyle = land.color;
      context.fill();
      context.strokeStyle = isLight ? 'rgba(65,55,38,.28)' : 'rgba(245,239,222,.28)';
      context.lineWidth = .8;
      context.stroke();
    };

    const countryColor = (feature, isLight) => {
      if (feature.id === 'USA') return isLight ? 'rgba(194,139,30,.9)' : 'rgba(230,173,58,.9)';
      if (feature.id === 'CAN') return isLight ? 'rgba(42,139,135,.78)' : 'rgba(114,214,208,.76)';
      if (feature.id === 'MEX') return isLight ? 'rgba(190,82,57,.72)' : 'rgba(224,111,82,.74)';
      return isLight ? 'rgba(91,119,84,.34)' : 'rgba(174,198,151,.3)';
    };

    const drawCountry = (feature, rotation, radius, isLight) => {
      if (!feature.geometry) return;
      const polygons = feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates
        : [feature.geometry.coordinates];
      polygons.forEach((polygon) => {
        const outerRing = polygon[0] || [];
        const visiblePoints = outerRing
          .map(([longitude, latitude]) => project(latitude, longitude, rotation, radius))
          .filter((point) => point.z > 0);
        if (visiblePoints.length < 3) return;
        context.beginPath();
        visiblePoints.forEach((point, index) => {
          const x = size / 2 + point.x;
          const y = size / 2 + point.y;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.closePath();
        context.fillStyle = countryColor(feature, isLight);
        context.shadowColor = isLight ? 'rgba(78,60,24,.18)' : 'rgba(0,0,0,.32)';
        context.shadowBlur = 2.5;
        context.shadowOffsetY = 1.2;
        context.fill();
        context.shadowColor = 'transparent';
        context.strokeStyle = isLight ? 'rgba(48,53,45,.28)' : 'rgba(245,239,222,.24)';
        context.lineWidth = .72;
        context.stroke();
      });
    };

    const drawAtmosphere = (radius, isLight) => {
      const center = size / 2;
      context.save();
      const aura = context.createRadialGradient(center, center, radius * .86, center, center, radius * 1.11);
      aura.addColorStop(0, 'rgba(255,255,255,0)');
      aura.addColorStop(.74, isLight ? 'rgba(205,177,105,.05)' : 'rgba(119,203,195,.04)');
      aura.addColorStop(.9, isLight ? 'rgba(180,139,44,.16)' : 'rgba(174,224,215,.13)');
      aura.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = aura;
      context.beginPath();
      context.arc(center, center, radius * 1.12, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = isLight ? 'rgba(132,101,35,.24)' : 'rgba(203,225,198,.22)';
      context.lineWidth = 1.15;
      context.beginPath();
      context.arc(center, center, radius + .5, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    };

    const drawCloudBands = (time, radius, isLight) => {
      const center = size / 2;
      const drift = prefersReducedMotion.matches ? 0 : Math.sin(time * .00018) * radius * .018;
      context.save();
      context.beginPath();
      context.arc(center, center, radius - 1, 0, Math.PI * 2);
      context.clip();
      context.globalCompositeOperation = 'screen';
      context.strokeStyle = isLight ? 'rgba(255,255,255,.13)' : 'rgba(225,238,232,.075)';
      context.lineCap = 'round';
      [
        { y: -.42, width: 1.42, height: .28, start: .18, end: 2.72 },
        { y: -.05, width: 1.58, height: .2, start: 3.36, end: 6.02 },
        { y: .35, width: 1.26, height: .24, start: .45, end: 2.9 }
      ].forEach((band, index) => {
        context.lineWidth = radius * (.018 + index * .003);
        context.beginPath();
        context.ellipse(center + drift * (index + 1), center + radius * band.y, radius * band.width / 2, radius * band.height / 2, -.08, band.start, band.end);
        context.stroke();
      });
      context.restore();
    };

    const drawRoute = (points, time, isLight) => {
      if (points.length !== 2 || points.some((point) => point.z <= 0)) return;
      const [start, end] = points;
      const centerX = size / 2;
      const centerY = size / 2;
      const x1 = centerX + start.x;
      const y1 = centerY + start.y;
      const x2 = centerX + end.x;
      const y2 = centerY + end.y;
      const lift = Math.max(13, Math.hypot(x2 - x1, y2 - y1) * .34);
      context.save();
      context.strokeStyle = isLight ? 'rgba(100,83,30,.58)' : 'rgba(238,250,163,.62)';
      context.lineWidth = 1.15;
      context.setLineDash([3, 5]);
      context.lineDashOffset = prefersReducedMotion.matches ? 0 : -time * .012;
      context.beginPath();
      context.moveTo(x1, y1);
      context.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - lift, x2, y2);
      context.stroke();
      context.restore();
    };

    const renderGlobe = (time = 0) => {
      const isLight = document.documentElement.dataset.theme === 'light';
      const radius = size * .39 * (.88 + entrance * .12);
      const idleDrift = prefersReducedMotion.matches ? 0 : Math.sin(time * .00034) * .75;
      const rotation = currentRotation + idleDrift;
      context.clearRect(0, 0, size, size);

      drawAtmosphere(radius, isLight);

      context.save();
      context.translate(size / 2, size / 2);
      const sphereGradient = context.createRadialGradient(-radius * .34, -radius * .38, radius * .04, radius * .08, radius * .08, radius * 1.08);
      sphereGradient.addColorStop(0, isLight ? '#faf7ed' : '#315451');
      sphereGradient.addColorStop(.38, isLight ? '#ddd9c9' : '#173432');
      sphereGradient.addColorStop(.76, isLight ? '#aaa99f' : '#0b1d1e');
      sphereGradient.addColorStop(1, isLight ? '#696d67' : '#03090a');
      context.fillStyle = sphereGradient;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.save();
      context.beginPath();
      context.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      context.clip();
      oceanTexture.forEach((point) => {
        context.fillStyle = isLight ? `rgba(58,61,56,${point.alpha})` : `rgba(220,238,229,${point.alpha})`;
        context.fillRect(size / 2 + point.x * radius, size / 2 + point.y * radius, 1, 1);
      });
      context.restore();

      context.save();
      context.beginPath();
      context.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      context.clip();
      if (countryFeatures.length) countryFeatures.forEach((feature) => drawCountry(feature, rotation, radius, isLight));
      else landMasses.forEach((land) => drawLand(land, rotation, radius, isLight));
      context.restore();

      const gridColor = isLight ? 'rgba(32,38,44,.14)' : 'rgba(218,232,218,.14)';
      [-60, -30, 0, 30, 60].forEach((latitude) => {
        const points = [];
        for (let longitude = -180; longitude <= 180; longitude += 3) {
          points.push(project(latitude, longitude, rotation, radius));
        }
        drawLine(points, gridColor, .75);
      });
      for (let longitude = -180; longitude < 180; longitude += 30) {
        const points = [];
        for (let latitude = -90; latitude <= 90; latitude += 3) {
          points.push(project(latitude, longitude, rotation, radius));
        }
        drawLine(points, gridColor, .75);
      }

      drawCloudBands(time, radius, isLight);

      // Directional glassy light and a soft night-side falloff add physical volume.
      context.save();
      context.beginPath();
      context.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      context.clip();
      const light = context.createRadialGradient(size / 2 - radius * .48, size / 2 - radius * .52, 0, size / 2 - radius * .28, size / 2 - radius * .3, radius * 1.36);
      light.addColorStop(0, isLight ? 'rgba(255,252,235,.48)' : 'rgba(229,247,239,.24)');
      light.addColorStop(.42, 'rgba(255,255,255,.02)');
      light.addColorStop(.78, isLight ? 'rgba(58,50,38,.12)' : 'rgba(0,5,8,.22)');
      light.addColorStop(1, isLight ? 'rgba(31,29,24,.42)' : 'rgba(0,3,6,.67)');
      context.fillStyle = light;
      context.fillRect(size / 2 - radius, size / 2 - radius, radius * 2, radius * 2);
      context.restore();

      const locationPoints = locations.map((location) => project(location.latitude, location.longitude, rotation, radius));
      drawRoute(locationPoints, time, isLight);

      locations.forEach((location, index) => {
        const point = locationPoints[index];
        if (point.z <= 0) return;
        const x = size / 2 + point.x;
        const y = size / 2 + point.y;
        const pulseCycle = (time * .0018 + location.phase) % (Math.PI * 2);
        const pulse = prefersReducedMotion.matches ? 9 : 8 + (Math.sin(pulseCycle) + 1) * 5;
        context.strokeStyle = isLight ? 'rgba(83,97,12,.34)' : 'rgba(238,250,163,.34)';
        context.lineWidth = 1;
        context.beginPath();
        context.arc(x, y, pulse, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = isLight ? '#596514' : '#eefaa3';
        context.beginPath();
        context.arc(x, y, 3.2, 0, Math.PI * 2);
        context.fill();
      });
    };

    const updateScrollTarget = () => {
      if (!aboutSection) return;
      const rect = aboutSection.getBoundingClientRect();
      const viewportHeight = Math.max(1, window.innerHeight);
      const progress = Math.max(0, Math.min(1, (viewportHeight * .92 - rect.top) / (viewportHeight + rect.height * .58)));
      targetRotation = 148 - progress * 58;
      if (prefersReducedMotion.matches) currentRotation = targetRotation;
      if (visible && !frame) frame = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.max(1, Math.round(Math.min(rect.width, rect.height)));
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderGlobe(performance.now());
    };

    const animate = (time) => {
      if (!visible) {
        frame = 0;
        return;
      }
      entrance += (targetEntrance - entrance) * .065;
      currentRotation += (targetRotation - currentRotation) * .055;
      renderGlobe(time);
      frame = window.requestAnimationFrame(animate);
    };

    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      targetEntrance = visible ? 1 : 0;
      figure?.classList.toggle('is-visible', visible);
      updateScrollTarget();
      if (visible && !frame) frame = window.requestAnimationFrame(animate);
    }, { threshold: .12, rootMargin: '8% 0px 8%' }).observe(canvas);
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('resize', updateScrollTarget, { passive: true });
    fetch('assets/world-countries.geojson')
      .then((response) => {
        if (!response.ok) throw new Error(`Country geometry returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        countryFeatures = Array.isArray(data.features) ? data.features : [];
        renderGlobe(performance.now());
      })
      .catch(() => { countryFeatures = []; });
    updateScrollTarget();
    resize();
  }

  function initEducationEarthModel() {
    const model = document.getElementById('education-globe-model');
    if (!model) return;

    const figure = model.closest('.education-globe');
    const aboutSection = document.getElementById('about');
    const locations = [
      { key: 'windsor', latitude: 42.3149, longitude: -83.0364 },
      { key: 'wichita', latitude: 37.6872, longitude: -97.3301 }
    ];
    let visible = false;
    let frame = 0;
    let currentTheta = -40;
    let targetTheta = -40;
    let currentPhi = 76;
    let targetPhi = 76;
    let pointerX = 0;
    let pointerY = 0;
    let modelHydrated = Boolean(model.getAttribute('src'));

    const hydrateModel = () => {
      if (modelHydrated || !model.dataset.src) return;
      modelHydrated = true;
      // Begin the real Earth download before the user reaches this section.
      // `loading="lazy"` previously kept the request paused even after `src`
      // was assigned, which made cold-cache visitors wait beside the globe.
      model.setAttribute('loading', 'eager');
      model.setAttribute('src', model.dataset.src);
    };

    const warmGlobeModel = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(hydrateModel, { timeout: 900 });
      } else {
        window.setTimeout(hydrateModel, 180);
      }
    };

    const scheduleGlobeRender = () => {
      if (visible && !frame && !prefersReducedMotion.matches) frame = window.requestAnimationFrame(render);
    };

    const positionHotspots = async () => {
      if (typeof model.getDimensions !== 'function' || typeof model.getBoundingBoxCenter !== 'function') return;
      const dimensions = model.getDimensions();
      const center = await model.getBoundingBoxCenter();
      const radius = Math.max(dimensions.x, dimensions.y, dimensions.z) * .505;

      locations.forEach(({ key, latitude, longitude }) => {
        const hotspot = model.querySelector(`[data-location="${key}"]`);
        if (!hotspot) return;
        const latitudeRadians = latitude * Math.PI / 180;
        const longitudeRadians = longitude * Math.PI / 180;
        // NASA's texture uses the opposite longitudinal seam from the former
        // canvas globe, so X/Z are flipped to align coordinates to the mesh.
        const normal = {
          x: -Math.cos(latitudeRadians) * Math.sin(longitudeRadians),
          y: Math.sin(latitudeRadians),
          z: -Math.cos(latitudeRadians) * Math.cos(longitudeRadians)
        };
        const position = `${center.x + normal.x * radius}m ${center.y + normal.y * radius}m ${center.z + normal.z * radius}m`;
        const normalString = `${normal.x}m ${normal.y}m ${normal.z}m`;
        hotspot.dataset.position = position;
        hotspot.dataset.normal = normalString;
        if (typeof model.updateHotspot === 'function') {
          model.updateHotspot({ name: `hotspot-${key}`, position, normal: normalString });
        }
      });
    };

    const updateScrollTarget = () => {
      if (!figure) return;
      const rect = figure.getBoundingClientRect();
      const viewportHeight = Math.max(1, window.innerHeight);
      const clamp = (value) => Math.max(0, Math.min(1, value));
      const smoothstep = (value) => value * value * (3 - 2 * value);
      // One continuous journey: Asia/Pacific enters, North America faces the
      // viewer at the viewport midpoint, then the Earth keeps turning away.
      const journey = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height));
      const entrance = smoothstep(clamp(journey / .28));
      const exit = smoothstep(clamp((journey - .76) / .24));
      targetTheta = -40 + journey * 220 + pointerX * 5;
      targetPhi = 76 - Math.sin(journey * Math.PI) * 7 + pointerY * 2.5;
      figure.style.setProperty('--globe-scroll-y', `${(-exit * 88).toFixed(2)}px`);
      figure.style.setProperty('--globe-scroll-scale', (1 - exit * .16).toFixed(3));
      figure.style.setProperty('--globe-scroll-tilt', `${(exit * 3.2).toFixed(2)}deg`);
      figure.style.setProperty('--globe-scroll-opacity', (1 - exit * .88).toFixed(3));
      if (prefersReducedMotion.matches) {
        currentTheta = targetTheta;
        currentPhi = targetPhi;
        model.setAttribute('camera-orbit', `${currentTheta.toFixed(2)}deg ${currentPhi.toFixed(2)}deg 104%`);
      } else scheduleGlobeRender();
    };

    function render() {
      frame = 0;
      if (!visible) return;
      currentTheta += (targetTheta - currentTheta) * .11;
      currentPhi += (targetPhi - currentPhi) * .11;
      model.setAttribute('camera-orbit', `${currentTheta.toFixed(2)}deg ${currentPhi.toFixed(2)}deg 104%`);
      const stillMoving = Math.abs(targetTheta - currentTheta) > .01 || Math.abs(targetPhi - currentPhi) > .01;
      if (stillMoving) scheduleGlobeRender();
    }

    const setPointerTarget = (event) => {
      if (!figure || prefersReducedMotion.matches || !window.matchMedia('(pointer: fine)').matches) return;
      const rect = figure.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      updateScrollTarget();
    };

    const resetPointerTarget = () => {
      pointerX = 0;
      pointerY = 0;
      updateScrollTarget();
    };

    model.addEventListener('load', () => {
      model.classList.add('is-model-ready');
      positionHotspots();
      scheduleGlobeRender();
    }, { once: true });
    if (model.loaded) {
      model.classList.add('is-model-ready');
      positionHotspots();
    }

    figure?.addEventListener('pointermove', setPointerTarget, { passive: true });
    figure?.addEventListener('pointerleave', resetPointerTarget, { passive: true });
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('resize', updateScrollTarget, { passive: true });
    if ('IntersectionObserver' in window) {
      const preloadObserver = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        preloadObserver.disconnect();
        warmGlobeModel();
      }, { threshold: 0, rootMargin: '700px 0px' });
      preloadObserver.observe(figure || model);
    } else {
      warmGlobeModel();
    }
    new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) hydrateModel();
      figure?.classList.toggle('is-visible', visible);
      updateScrollTarget();
      scheduleGlobeRender();
    }, { threshold: .16, rootMargin: '10% 0px 10%' }).observe(model);
    if (aboutSection) {
      new IntersectionObserver(([entry]) => {
        aboutSection.classList.toggle('is-animation-active', Boolean(entry?.isIntersecting));
      }, { threshold: .02, rootMargin: '12% 0px 12%' }).observe(aboutSection);
    }
    updateScrollTarget();
  }

  initStudioReveals();
  initWorkstationPointer();
  initProjectProgress();
  initContactParallax();
  initLegacyPortal();
  if (useLightweight3D) initEducationGlobe();
  else initEducationEarthModel();
})();
