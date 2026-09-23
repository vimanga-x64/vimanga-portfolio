(() => {
  'use strict';

  const stage = document.querySelector('[data-hero-stage]');
  if (!stage) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const viewers = [...stage.querySelectorAll('model-viewer[data-hero-motion]')];

  let raf = 0;
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;
  let pointerActive = false;
  let stageVisible = true;
  let lastTs = 0;

  // Continuous wind — no discrete gust events (those caused idle snaps).
  let windAngle = 0;
  let windSpeed = 0.3;

  // Filtered umbrella pose so orientation never jumps frame-to-frame.
  let umbrellaPitch = -8;
  let umbrellaYaw = 0;
  let umbrellaRoll = 0;

  // FitTrack weights rock impulse
  let weightRock = 0;
  let weightRockVel = 0;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrapDeg = (deg) => {
    const m = ((deg + 180) % 360 + 360) % 360;
    return m - 180;
  };

  const applyParallax = () => {
    stage.style.setProperty('--hero-mx', curX.toFixed(3));
    stage.style.setProperty('--hero-my', curY.toFixed(3));
  };

  const setOrientation = (viewer, pitch, yaw, roll) => {
    viewer.orientation = `${pitch.toFixed(2)}deg ${yaw.toFixed(2)}deg ${roll.toFixed(2)}deg`;
  };

  const parseOrbit = (viewer) => {
    const raw = viewer.getAttribute('camera-orbit') || '0deg 75deg 105%';
    const parts = raw.trim().split(/\s+/);
    return {
      theta: parseFloat(parts[0]) || 0,
      phi: parseFloat(parts[1]) || 75,
      radius: parts[2] || '105%',
    };
  };

  const bases = new Map(
    viewers.map((viewer) => [viewer, parseOrbit(viewer)])
  );

  // Disable model-viewer's own orbit tween — it fights per-frame updates and snaps.
  const armViewer = (viewer) => {
    viewer.interpolationDecay = 0;
    viewer.setAttribute('interpolation-decay', '0');
  };
  viewers.forEach(armViewer);
  customElements.whenDefined('model-viewer').then(() => {
    viewers.forEach(armViewer);
  });

  const setOrbitYaw = (viewer, thetaDeg, phiDeg) => {
    const base = bases.get(viewer);
    if (!base) return;
    viewer.cameraOrbit = `${thetaDeg.toFixed(2)}deg ${phiDeg.toFixed(2)}deg ${base.radius}`;
  };

  const updateWind = (now, dt) => {
    const t = now * 0.001;
    const step = Math.min(dt / 16, 2);

    // Layered sines only — continuous, no target jumps.
    const idleHeading =
      Math.sin(t * 0.11) * 26 +
      Math.sin(t * 0.047 + 1.3) * 14 +
      Math.sin(t * 0.19 + 0.6) * 5;
    const idleSpeed = 0.28 + Math.sin(t * 0.15) * 0.07;

    let desiredHeading = idleHeading;
    let desiredSpeed = idleSpeed;

    if (pointerActive && finePointer) {
      const pointerWind = Math.atan2(curX, -Math.max(0.15, 0.55 - curY)) * (180 / Math.PI);
      desiredHeading = windAngle + wrapDeg(pointerWind - windAngle);
      desiredSpeed = 0.38 + Math.hypot(curX, curY) * 0.32;
    }

    // Heavy easing so pointer enter/leave and idle drift never pop.
    const follow = pointerActive ? 0.04 : 0.018;
    windAngle = lerp(windAngle, desiredHeading, follow * step);
    windSpeed = lerp(windSpeed, desiredSpeed, 0.03 * step);
  };

  const applyMotion = (viewer, now, dt) => {
    const motion = viewer.dataset.heroMotion;
    const t = now * 0.001;
    const step = Math.min(dt / 16, 2);

    switch (motion) {
      case 'wind-vane': {
        const base = bases.get(viewer);
        const theta = (base?.theta || -20) + windAngle;
        // Keep phi locked — nudging it via cameraOrbit looked like a hitch.
        setOrbitYaw(viewer, theta, base?.phi || 68);
        break;
      }
      case 'landmark': {
        const yaw = Math.sin(t * 0.22) * 3.5 + curX * 2.5;
        const roll = Math.sin(t * 0.18) * 1.4 + curY * 1.2;
        setOrientation(viewer, Math.sin(t * 0.15) * 0.8, yaw, roll);
        break;
      }
      case 'gust': {
        const windRad = windAngle * (Math.PI / 180);
        const leanX = Math.sin(windRad);
        const lean = 5 + windSpeed * 6;
        const targetPitch = -lean + Math.sin(t * 1.15) * windSpeed * 1.2 + curY * 2;
        const targetRoll = leanX * lean * 0.45 + Math.sin(t * 1.35) * windSpeed * 1.4 + curX * 2.5;
        const targetYaw = leanX * 6 + Math.sin(t * 0.45) * 2;
        umbrellaPitch = lerp(umbrellaPitch, targetPitch, 0.05 * step);
        umbrellaYaw = lerp(umbrellaYaw, targetYaw, 0.05 * step);
        umbrellaRoll = lerp(umbrellaRoll, targetRoll, 0.05 * step);
        setOrientation(viewer, umbrellaPitch, umbrellaYaw, umbrellaRoll);
        break;
      }
      case 'steady': {
        // Planted machine — tiny bob only. No yaw/roll (that skewed the treadmill).
        const pitch = Math.sin(t * 2.4) * 0.55 + curY * 0.6;
        const yaw = curX * 1.5;
        setOrientation(viewer, pitch, yaw, 0);
        break;
      }
      case 'heavy': {
        if (pointerActive && finePointer) {
          weightRockVel += curX * 0.045 * step;
        }
        weightRockVel += -weightRock * 0.08;
        weightRockVel *= 0.9;
        weightRock = clamp(weightRock + weightRockVel, -14, 14);
        const yaw = 12 + Math.sin(t * 0.2) * 1.5 + curX * 2;
        const roll = weightRock + Math.sin(t * 0.45) * 0.8;
        setOrientation(viewer, Math.sin(t * 0.3) * 0.6, yaw, roll);
        break;
      }
      case 'ready': {
        const yaw = 8 + curX * 10 + Math.sin(t * 0.55) * 3;
        const pitch = curY * -4 + Math.sin(t * 0.8) * 1.5;
        const roll = curX * -3 + Math.sin(t * 0.4) * 1.2;
        setOrientation(viewer, pitch, yaw, roll);
        break;
      }
      default:
        break;
    }
  };

  const tick = (now) => {
    const dt = lastTs ? Math.min(now - lastTs, 48) : 16;
    lastTs = now;

    curX += (targetX - curX) * 0.08;
    curY += (targetY - curY) * 0.08;
    applyParallax();

    if (!reduceMotion && stageVisible && viewers.length) {
      updateWind(now, dt);
      for (const viewer of viewers) applyMotion(viewer, now, dt);
    }

    if (pointerActive || (stageVisible && !reduceMotion && viewers.length)) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      lastTs = 0;
      curX = 0;
      curY = 0;
      applyParallax();
    }
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const hero = stage.closest('.hero') || stage;

  if (finePointer) {
    hero.addEventListener('pointerenter', () => {
      pointerActive = true;
      start();
    });

    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      pointerActive = true;
      start();
    }, { passive: true });

    const end = () => {
      pointerActive = false;
      targetX = 0;
      targetY = 0;
      start();
    };

    hero.addEventListener('pointerleave', end);
    hero.addEventListener('pointercancel', end);
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      stageVisible = Boolean(entries[0]?.isIntersecting);
      if (stageVisible) start();
    }, { threshold: 0.08 });
    io.observe(stage);
  }

  if (!reduceMotion && viewers.length) start();
})();
