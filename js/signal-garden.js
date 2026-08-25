(() => {
  const host = document.querySelector('.site-footer');
  if (!host || host.querySelector('.signal-garden')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
    flower.style.setProperty('--breeze-duration', `${4.8 + specimenIndex * .37}s`);
    flower.style.setProperty('--breeze-delay', `${-specimenIndex * .54}s`);
    flower.style.setProperty('--breeze-range', `${.45 + (specimenIndex % 3) * .2}deg`);

    specimen.stalks.forEach((data) => {
      const stalk = document.createElement('span');
      const stem = document.createElement('span');
      const leafA = document.createElement('span');
      const leafB = document.createElement('span');
      stalk.className = 'signal-stalk';
      stem.className = 'signal-stem';
      leafA.className = 'signal-leaf';
      leafB.className = 'signal-leaf is-right';
      stalk.dataset.depth = String(data.depth);
      stalk.style.setProperty('--stalk-x', `${data.x}px`);
      stalk.style.setProperty('--stalk-height', `${data.h}px`);
      stalk.style.setProperty('--stalk-rest', `${data.tilt}deg`);
      stalk.style.setProperty('--bloom-scale', data.size);
      leafA.style.setProperty('--leaf-y', `${Math.max(10, Math.round(data.h * .34))}px`);
      leafB.style.setProperty('--leaf-y', `${Math.max(17, Math.round(data.h * .56))}px`);
      stalk.append(stem, leafA, leafB);
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

  /* Keep every DOM lookup and depth conversion out of the animation loop.
     Current values deliberately live separately from targets: the loop can
     keep catching up between pointer events instead of asking CSS transitions
     to interpolate each discrete event. */
  const states = flowers.map((flower) => ({
    flower,
    lean: 0,
    shiftX: 0,
    lift: 0,
    presence: 0,
    targetLean: 0,
    targetShiftX: 0,
    targetLift: 0,
    targetPresence: 0,
    stalks: [...flower.querySelectorAll('.signal-stalk')].map((stalk) => ({
      stalk,
      depth: Number(stalk.dataset.depth || 1),
      react: 0,
      headX: 0,
      headY: 0,
      targetReact: 0,
      targetHeadX: 0,
      targetHeadY: 0
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
      state.targetLean = 0;
      state.targetShiftX = 0;
      state.targetLift = 0;
      state.targetPresence = 0;
      state.stalks.forEach((stalkState) => {
        stalkState.targetReact = 0;
        stalkState.targetHeadX = 0;
        stalkState.targetHeadY = 0;
      });
    });
  };

  const setTargets = () => {
    if (!pointer) {
      clearTargets();
      return;
    }

    const radius = 270;
    states.forEach((state, flowerIndex) => {
      const center = bounds[flowerIndex];
      if (!center?.visible) {
        state.targetLean = 0;
        state.targetShiftX = 0;
        state.targetLift = 0;
        state.targetPresence = 0;
        state.stalks.forEach((stalkState) => {
          stalkState.targetReact = 0;
          stalkState.targetHeadX = 0;
          stalkState.targetHeadY = 0;
        });
        return;
      }

      const dx = pointer.x - center.x;
      const dy = pointer.y - center.y;
      const distance = Math.hypot(dx, dy);
      const linear = clamp(1 - distance / radius, 0, 1);
      const presence = linear * linear * (3 - 2 * linear);
      const direction = clamp(dx / 110, -1, 1);
      const lean = direction * presence * 10.5;

      state.targetLean = lean;
      state.targetShiftX = direction * presence * 3.5;
      state.targetLift = -presence * 2.5;
      state.targetPresence = presence;
      state.stalks.forEach((stalkState) => {
        const { depth } = stalkState;
        stalkState.targetReact = lean * depth * .42;
        stalkState.targetHeadX = clamp(dx * presence * depth * .026, -4.5, 4.5);
        stalkState.targetHeadY = clamp(dy * presence * depth * .014, -2.5, 2.5);
      });
    });
  };

  const lerp = (current, target, amount) => current + (target - current) * amount;
  const differs = (current, target, epsilon) => Math.abs(target - current) > epsilon;

  const render = (now) => {
    frame = 0;
    if (!active || reducedMotion.matches || !finePointer.matches) return;

    setTargets();

    const delta = lastFrameTime ? clamp(now - lastFrameTime, 1, 50) : 16.667;
    lastFrameTime = now;

    /* Equivalent to 0.075-per-frame tracking and 0.05-per-frame return at
       60fps, but time-corrected so 120Hz and a temporarily busy tab feel the
       same. The softer return gives the plants a natural trailing settle. */
    const response = pointer ? .075 : .05;
    const amount = 1 - Math.pow(1 - response, delta / 16.667);
    let moving = false;

    states.forEach((state) => {
      state.lean = lerp(state.lean, state.targetLean, amount);
      state.shiftX = lerp(state.shiftX, state.targetShiftX, amount);
      state.lift = lerp(state.lift, state.targetLift, amount);
      state.presence = lerp(state.presence, state.targetPresence, amount);

      state.flower.style.setProperty('--flower-lean', `${state.lean.toFixed(3)}deg`);
      state.flower.style.setProperty('--flower-shift-x', `${state.shiftX.toFixed(3)}px`);
      state.flower.style.setProperty('--flower-lift', `${state.lift.toFixed(3)}px`);
      state.flower.style.setProperty('--flower-presence', state.presence.toFixed(4));

      moving ||= differs(state.lean, state.targetLean, .008)
        || differs(state.shiftX, state.targetShiftX, .008)
        || differs(state.lift, state.targetLift, .008)
        || differs(state.presence, state.targetPresence, .0008);

      state.stalks.forEach((stalkState) => {
        stalkState.react = lerp(stalkState.react, stalkState.targetReact, amount);
        stalkState.headX = lerp(stalkState.headX, stalkState.targetHeadX, amount);
        stalkState.headY = lerp(stalkState.headY, stalkState.targetHeadY, amount);

        stalkState.stalk.style.setProperty('--stalk-react', `${stalkState.react.toFixed(3)}deg`);
        stalkState.stalk.style.setProperty('--head-x', `${stalkState.headX.toFixed(3)}px`);
        stalkState.stalk.style.setProperty('--head-y', `${stalkState.headY.toFixed(3)}px`);

        moving ||= differs(stalkState.react, stalkState.targetReact, .008)
          || differs(stalkState.headX, stalkState.targetHeadX, .008)
          || differs(stalkState.headY, stalkState.targetHeadY, .008);
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
      requestBoundsUpdate();
      schedule();
    } else {
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

  reducedMotion.addEventListener('change', () => {
    pointer = null;
    clearTargets();
    if (reducedMotion.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      states.forEach((state) => {
        state.lean = 0;
        state.shiftX = 0;
        state.lift = 0;
        state.presence = 0;
        state.flower.style.removeProperty('--flower-lean');
        state.flower.style.removeProperty('--flower-shift-x');
        state.flower.style.removeProperty('--flower-lift');
        state.flower.style.removeProperty('--flower-presence');
        state.stalks.forEach((stalkState) => {
          stalkState.react = 0;
          stalkState.headX = 0;
          stalkState.headY = 0;
          stalkState.stalk.style.removeProperty('--stalk-react');
          stalkState.stalk.style.removeProperty('--head-x');
          stalkState.stalk.style.removeProperty('--head-y');
        });
      });
    } else {
      schedule();
    }
  });

  document.fonts?.ready.then(requestBoundsUpdate).catch(() => {});
  requestBoundsUpdate();
})();
