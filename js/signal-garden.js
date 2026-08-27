(() => {
  const host = document.querySelector('.site-footer');
  if (!host || host.querySelector('.signal-garden')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const butterflyVideo = host.querySelector('.footer-butterflies');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let butterfliesLoaded = false;

  const butterfliesAllowed = () => !reducedMotion.matches
    && !document.documentElement.classList.contains('studio-performance-lite')
    && !connection?.saveData
    && !/(^|-)2g$/.test(connection?.effectiveType || '');

  const loadButterflies = () => {
    if (!butterflyVideo || butterfliesLoaded || !butterfliesAllowed()) return;
    const source = butterflyVideo.dataset.src;
    if (!source) return;
    butterfliesLoaded = true;
    butterflyVideo.muted = true;
    butterflyVideo.src = source;
    butterflyVideo.load();
  };

  const playButterflies = () => {
    if (!butterflyVideo || !butterfliesAllowed() || document.hidden) return;
    loadButterflies();
    if (!butterfliesLoaded) return;
    butterflyVideo.classList.add('is-visible');
    butterflyVideo.play().catch(() => {
      butterflyVideo.classList.remove('is-visible');
    });
  };

  const pauseButterflies = () => {
    if (!butterflyVideo) return;
    butterflyVideo.classList.remove('is-visible');
    butterflyVideo.pause();
  };

  if (butterflyVideo) {
    butterflyVideo.addEventListener('loadeddata', () => {
      butterflyVideo.classList.add('is-ready');
    }, { once: true });

    /* Attach the 3.4 MB source shortly before it is needed, but leave decoding
       and playback to the tighter visibility observer below. */
    const preloadObserver = new IntersectionObserver(([entry], observer) => {
      if (!entry?.isIntersecting || !butterfliesAllowed()) return;
      loadButterflies();
      observer.disconnect();
    }, { threshold: 0, rootMargin: '700px 0px' });
    preloadObserver.observe(host);
  }

  const garden = document.createElement('div');
  garden.className = 'signal-garden';
  garden.setAttribute('aria-hidden', 'true');

  /* Seven deliberately different silhouettes. The garden should read as a
     small illustration, not a row of repeated flower icons. */
  const specimens = [
    { x: 4, width: 56, height: 72, stalks: [
      { x: 13, h: 48, tilt: -7, kind: 'daisy', size: .72, depth: .76 },
      { x: 29, h: 72, tilt: 1, kind: 'rosette', size: 1, depth: 1 },
      { x: 43, h: 53, tilt: 8, kind: 'daisy', size: .76, depth: .82 }
    ] },
    { x: 17, width: 59, height: 62, stalks: [
      { x: 8, h: 35, tilt: -10, kind: 'bud', size: .62, depth: .68 },
      { x: 23, h: 60, tilt: -3, kind: 'tulip', size: .88, depth: .95 },
      { x: 39, h: 43, tilt: 5, kind: 'daisy', size: .7, depth: .78 },
      { x: 51, h: 31, tilt: 9, kind: 'bud', size: .58, depth: .64 }
    ] },
    { x: 32, width: 51, height: 81, stalks: [
      { x: 8, h: 38, tilt: -12, kind: 'bud', size: .62, depth: .64 },
      { x: 25, h: 81, tilt: 0, kind: 'daisy', size: 1.04, depth: 1.08 },
      { x: 43, h: 47, tilt: 11, kind: 'bud', size: .66, depth: .72 }
    ] },
    { x: 47, width: 48, height: 53, stalks: [
      { x: 5, h: 31, tilt: -10, kind: 'daisy', size: .62, depth: .66 },
      { x: 17, h: 48, tilt: -3, kind: 'daisy', size: .78, depth: .86 },
      { x: 29, h: 39, tilt: 4, kind: 'daisy', size: .68, depth: .74 },
      { x: 42, h: 52, tilt: 10, kind: 'daisy', size: .72, depth: .8 }
    ] },
    { x: 61, width: 42, height: 56, stalks: [
      { x: 7, h: 30, tilt: -9, kind: 'bud', size: .58, depth: .64 },
      { x: 21, h: 56, tilt: 0, kind: 'tulip', size: .95, depth: 1 },
      { x: 35, h: 36, tilt: 9, kind: 'bud', size: .62, depth: .7 }
    ] },
    { x: 75, width: 56, height: 58, stalks: [
      { x: 7, h: 43, tilt: -10, kind: 'daisy', size: .68, depth: .74 },
      { x: 24, h: 57, tilt: -3, kind: 'tulip', size: .9, depth: .98 },
      { x: 42, h: 48, tilt: 8, kind: 'tulip', size: .82, depth: .88 }
    ] },
    { x: 92, width: 30, height: 60, stalks: [
      { x: 15, h: 60, tilt: 1, kind: 'daisy', size: .88, depth: 1 },
      { x: 4, h: 32, tilt: -13, kind: 'bud', size: .54, depth: .62 }
    ] }
  ];

  const addBloom = (stalk, kind) => {
    const bloom = document.createElement('span');
    bloom.className = `signal-bloom is-${kind}`;
    if (kind === 'daisy' || kind === 'rosette') {
      const petalCount = kind === 'rosette' ? 7 : 6;
      for (let index = 0; index < petalCount; index += 1) {
        const petal = document.createElement('span');
        petal.className = 'signal-petal';
        petal.style.setProperty('--petal-angle', `${index * (360 / petalCount)}deg`);
        bloom.append(petal);
      }
      const core = document.createElement('span');
      core.className = 'signal-core';
      bloom.append(core);
    }
    stalk.append(bloom);
  };

  const flowers = specimens.map((specimen, specimenIndex) => {
    const flower = document.createElement('span');
    const body = document.createElement('span');
    flower.className = 'signal-flower';
    body.className = 'signal-flower-body';
    flower.style.setProperty('--flower-x', `${specimen.x}%`);
    flower.style.setProperty('--flower-width', `${specimen.width}px`);
    flower.style.setProperty('--flower-height', `${specimen.height}px`);
    specimen.stalks.forEach((data, stalkIndex) => {
      const stalk = document.createElement('span');
      const stem = document.createElement('span');
      const branchA = document.createElement('span');
      const branchB = document.createElement('span');
      const leafA = document.createElement('span');
      const leafB = document.createElement('span');
      stalk.className = 'signal-stalk';
      stem.className = 'signal-stem';
      branchA.className = 'signal-branch is-left';
      branchB.className = 'signal-branch is-right';
      leafA.className = 'signal-leaf';
      leafB.className = 'signal-leaf';
      stalk.dataset.depth = String(data.depth);
      stalk.dataset.spring = String(.028 * (1 + ((specimenIndex + stalkIndex) % 3 - 1) * .14));
      stalk.style.setProperty('--stalk-x', `${data.x}px`);
      stalk.style.setProperty('--stalk-height', `${data.h}px`);
      stalk.style.setProperty('--stalk-rest', `${data.tilt}deg`);
      stalk.style.setProperty('--bloom-scale', data.size);
      branchA.style.setProperty('--branch-y', `${Math.max(10, Math.round(data.h * .34))}px`);
      branchA.style.setProperty('--branch-length', `${8 + ((specimenIndex + stalkIndex) % 3) * 1.5}px`);
      branchA.style.setProperty('--branch-angle', `${24 + ((specimenIndex + stalkIndex) % 2) * 5}deg`);
      branchB.style.setProperty('--branch-y', `${Math.max(17, Math.round(data.h * .56))}px`);
      branchB.style.setProperty('--branch-length', `${9 + ((specimenIndex * 2 + stalkIndex) % 3) * 1.5}px`);
      branchB.style.setProperty('--branch-angle', `${27 + ((specimenIndex + stalkIndex + 1) % 2) * 5}deg`);
      branchA.append(leafA);
      branchB.append(leafB);
      stalk.append(stem, branchA, branchB);
      addBloom(stalk, data.kind);
      body.append(stalk);
    });
    flower.append(body);
    garden.append(flower);
    return flower;
  });

  host.prepend(garden);

  let bounds = [];
  let pointer = null;
  let frame = 0;
  let lastFrameTime = 0;
  let active = false;
  let boundsFrame = 0;
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* Blake's flowers deform from the head down while their soil-line points
     remain fixed. These DOM flowers mirror that feel by springing each stalk
     around its bottom edge; the flower wrapper itself never translates. */
  const states = flowers.map((flower) => ({
    flower,
    stalks: [...flower.querySelectorAll('.signal-stalk')].map((stalk) => ({
      stalk,
      depth: Number(stalk.dataset.depth || 1),
      stiffness: Number(stalk.dataset.spring || .028),
      react: 0,
      velocity: 0,
      targetReact: 0,
    }))
  }));

  const cacheBounds = () => {
    boundsFrame = 0;
    const gardenRect = garden.getBoundingClientRect();
    bounds = flowers.map((flower) => {
      /* offset* values ignore the transforms being animated, preventing the
         measured centre from drifting toward its own transformed position. */
      const width = flower.offsetWidth;
      const height = flower.offsetHeight;
      return {
        x: gardenRect.left + flower.offsetLeft,
        y: gardenRect.top + flower.offsetTop + height * .38,
        visible: width > 0 && height > 0
      };
    });
  };

  const clearTargets = () => {
    states.forEach((state) => {
      state.stalks.forEach((stalkState) => {
        stalkState.targetReact = 0;
      });
    });
  };

  const setTargets = () => {
    if (!pointer) {
      clearTargets();
      return;
    }

    const radius = 150;
    states.forEach((state, flowerIndex) => {
      const center = bounds[flowerIndex];
      if (!center?.visible) {
        state.stalks.forEach((stalkState) => {
          stalkState.targetReact = 0;
        });
        return;
      }

      const dx = pointer.x - center.x;
      const dy = pointer.y - center.y;
      const distance = Math.hypot(dx, dy);
      const linear = clamp(1 - distance / radius, 0, 1);
      const presence = linear * linear * (3 - 2 * linear);
      /* Direction is binary while proximity controls the bend: plants yield
         away from the pointer instead of following it or lifting upward. */
      const direction = Math.sign(center.x - pointer.x) || 1;
      state.stalks.forEach((stalkState) => {
        stalkState.targetReact = direction * presence * 5.2 * stalkState.depth;
      });
    });
  };

  const differs = (current, target, epsilon) => Math.abs(target - current) > epsilon;

  const render = (now) => {
    frame = 0;
    if (!active || reducedMotion.matches || !finePointer.matches) return;

    setTargets();

    const delta = lastFrameTime ? clamp(now - lastFrameTime, 1, 50) : 16.667;
    lastFrameTime = now;

    const timeScale = delta / 16.667;
    const damping = Math.pow(.88, timeScale);
    let moving = false;

    states.forEach((state) => {
      state.stalks.forEach((stalkState) => {
        stalkState.velocity += (stalkState.targetReact - stalkState.react) * stalkState.stiffness * timeScale;
        stalkState.velocity *= damping;
        stalkState.react += stalkState.velocity * timeScale;

        stalkState.stalk.style.setProperty('--stalk-react', `${stalkState.react.toFixed(3)}deg`);

        moving ||= differs(stalkState.react, stalkState.targetReact, .008)
          || Math.abs(stalkState.velocity) > .008;
      });
    });

    /* Stop once all values have converged. A new pointer event restarts the
       loop, preserving the fluid in-between frames without burning CPU while
       the pointer and plants are both still. */
    if (moving) frame = requestAnimationFrame(render);
  };

  const schedule = () => {
    if (!frame && active && !reducedMotion.matches && finePointer.matches) {
      lastFrameTime = 0;
      frame = requestAnimationFrame(render);
    }
  };

  const requestBoundsUpdate = () => {
    if (!boundsFrame) boundsFrame = requestAnimationFrame(cacheBounds);
  };

  document.addEventListener('pointermove', (event) => {
    if (!active || !finePointer.matches || reducedMotion.matches) return;
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    pointer = null;
    clearTargets();
    schedule();
  }, { passive: true });

  window.addEventListener('blur', () => {
    pointer = null;
    clearTargets();
    schedule();
  });

  const observer = new IntersectionObserver(([entry]) => {
    active = Boolean(entry?.isIntersecting);
    garden.classList.toggle('is-paused', !active);
    if (active) {
      playButterflies();
      requestBoundsUpdate();
      schedule();
    } else {
      pauseButterflies();
      pointer = null;
      clearTargets();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastFrameTime = 0;
    }
  }, { threshold: 0 });
  observer.observe(host);

  window.addEventListener('scroll', () => {
    if (active) requestBoundsUpdate();
  }, { passive: true });
  window.addEventListener('resize', requestBoundsUpdate, { passive: true });
  window.addEventListener('load', requestBoundsUpdate, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (active && !document.hidden) playButterflies();
    else pauseButterflies();
  });
  window.addEventListener('pagehide', pauseButterflies, { once: true });
  connection?.addEventListener?.('change', () => {
    if (active && butterfliesAllowed()) playButterflies();
    else pauseButterflies();
  });

  reducedMotion.addEventListener('change', () => {
    pointer = null;
    clearTargets();
    if (reducedMotion.matches) {
      pauseButterflies();
      butterflyVideo?.classList.remove('is-ready');
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      states.forEach((state) => {
        state.stalks.forEach((stalkState) => {
          stalkState.react = 0;
          stalkState.velocity = 0;
          stalkState.stalk.style.removeProperty('--stalk-react');
        });
      });
    } else {
      if (butterflyVideo?.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        butterflyVideo.classList.add('is-ready');
      }
      if (active) playButterflies();
      schedule();
    }
  });

  document.fonts?.ready.then(requestBoundsUpdate).catch(() => {});
  requestBoundsUpdate();
})();
