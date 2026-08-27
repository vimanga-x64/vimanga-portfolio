let Application;

const stage = document.getElementById('tech-keyboard-stage');
const canvas = document.getElementById('tech-keyboard-canvas');
const loader = document.getElementById('tech-keyboard-loader');
const fallback = document.getElementById('tech-keyboard-fallback');
const keyOutput = document.getElementById('tech-keyboard-key');
const labelOutput = document.getElementById('tech-keyboard-label');
const descriptionOutput = document.getElementById('tech-keyboard-description');

const skills = {
  js: ['JS', 'JavaScript', 'Interactive interfaces, browser systems, and modern application logic.'],
  ts: ['TS', 'TypeScript', 'Typed JavaScript for dependable, maintainable applications.'],
  html: ['HTML', 'HTML', 'Semantic, accessible structure for resilient web experiences.'],
  css: ['CSS', 'CSS', 'Responsive layouts, design systems, motion, and polished interfaces.'],
  react: ['REACT', 'React', 'Component-driven user interfaces and production web applications.'],
  vue: ['VUE', 'Vue', 'Progressive, approachable interfaces built around reusable components.'],
  nextjs: ['NEXT', 'Next.js', 'Full-stack React applications with routing, rendering, and server features.'],
  tailwind: ['TW', 'Tailwind CSS', 'Fast, consistent interface development using utility-first styling.'],
  nodejs: ['NODE', 'Node.js', 'JavaScript services, APIs, automation, and backend tooling.'],
  express: ['EXP', 'Express', 'Focused Node.js APIs and lightweight backend services.'],
  postgres: ['PG', 'PostgreSQL', 'Reliable relational data modeling and production SQL workflows.'],
  sql: ['SQL', 'SQL', 'Relational querying, schema design, and data analysis.'],
  mongodb: ['MONGO', 'MongoDB', 'Flexible document databases for application data and prototypes.'],
  git: ['GIT', 'Git', 'Versioned, collaborative development and disciplined delivery workflows.'],
  github: ['GH', 'GitHub', 'Source collaboration, project delivery, and automated development workflows.'],
  prettier: ['PRETTY', 'Prettier', 'Consistent automated formatting across collaborative codebases.'],
  npm: ['NPM', 'npm', 'JavaScript dependency management and reusable project tooling.'],
  firebase: ['FIRE', 'Firebase', 'Authentication, managed data, notifications, and rapid application delivery.'],
  wordpress: ['WP', 'WordPress', 'Content-driven sites and practical publishing workflows.'],
  linux: ['LINUX', 'Linux', 'Development environments, servers, shell tooling, and deployment.'],
  docker: ['DOCKER', 'Docker', 'Portable containers and reproducible development environments.'],
  nginx: ['NGINX', 'Nginx', 'Reverse proxying, routing, and production web delivery.'],
  aws: ['AWS', 'AWS', 'Cloud infrastructure and managed application services.'],
  gcp: ['GCP', 'Google Cloud', 'Cloud-native services, deployment, and data workflows.'],
  vim: ['VIM', 'Vim', 'Fast keyboard-driven editing and terminal-based development.'],
  vercel: ['▲', 'Vercel', 'Fast frontend deployments, previews, and edge delivery.'],
};

const skillGrid = [
  ['js', 'ts', 'html', 'css', 'react', 'vue'],
  ['nextjs', 'tailwind', 'nodejs', 'express', 'postgres', 'mongodb'],
  ['git', 'github', 'prettier', 'npm', 'firebase', 'wordpress'],
  ['linux', 'docker', 'nginx', 'aws', 'vim', 'vercel'],
];

let app;
let pressBuffer;
let releaseBuffer;
let audioUnlockPromise;
let audioUnlocked = false;
let lastNativePress = 0;
let lastNativeRelease = 0;
let tactileContext;
let audioPrepared = false;
let activeSkill = '';
let hitGrid;
let hitGridRect;
let suppressSplineEvent = false;
let entranceObserver;
let entranceFrame;
let entranceVisibilityFrame;
let entranceVisibilityHandler;
let entrancePlayed = false;
let keyboardTarget;

function withTimeout(promise, timeout, message) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), timeout);
  });

  return Promise.race([promise, deadline]).finally(() => window.clearTimeout(timer));
}

function setReadout(name) {
  const skill = skills[name];
  if (!skill) return false;

  keyOutput.textContent = skill[0];
  labelOutput.textContent = skill[1];
  descriptionOutput.textContent = skill[2];
  if (app) {
    app.setVariable('heading', skill[1]);
    app.setVariable('desc', skill[2]);
  }
  return true;
}

function prepareAudio() {
  if (audioPrepared) return;
  audioPrepared = true;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  tactileContext ??= new AudioContextClass({ latencyHint: 'interactive' });

  const decode = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load keyboard sound: ${url}`);
    return tactileContext.decodeAudioData(await response.arrayBuffer());
  };

  Promise.all([
    decode('assets/naresh-keyboard/sounds/press.mp3'),
    decode('assets/naresh-keyboard/sounds/release.mp3'),
  ]).then(([press, release]) => {
    pressBuffer = press;
    releaseBuffer = release;
  }).catch(() => {});

  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('keydown', unlockAudio, true);

  // The keyboard scene is lazy-loaded. If the visitor already interacted with
  // the page before reaching it, sticky user activation allows us to resume
  // now instead of making them click a key before hover sounds start working.
  if (navigator.userActivation?.hasBeenActive) unlockAudio();
}

function unlockAudio() {
  if (!tactileContext) return Promise.resolve(false);
  if (tactileContext.state === 'running') {
    audioUnlocked = true;
    return Promise.resolve(true);
  }

  audioUnlockPromise ??= tactileContext.resume()
    .then(() => {
      audioUnlocked = tactileContext.state === 'running';
      return audioUnlocked;
    })
    .catch(() => false)
    .finally(() => {
      audioUnlockPromise = undefined;
    });

  return audioUnlockPromise;
}

function playSound(buffer) {
  if (!tactileContext || !buffer) return;
  if (tactileContext.state !== 'running') {
    if (!navigator.userActivation?.hasBeenActive) return;
    unlockAudio().then((unlocked) => {
      if (unlocked) playSound(buffer);
    });
    return;
  }
  audioUnlocked = true;
  const source = tactileContext.createBufferSource();
  const gain = tactileContext.createGain();
  source.buffer = buffer;
  source.detune.value = Math.random() * 200 - 100;
  gain.gain.value = 0.4;
  source.connect(gain);
  gain.connect(tactileContext.destination);
  source.start();
}

function playPressSound() {
  if (pressBuffer) playSound(pressBuffer);
}

function playReleaseSound() {
  if (releaseBuffer) playSound(releaseBuffer);
}

function handleNativePress() {
  lastNativePress = performance.now();
  playPressSound();
}

function handleNativeRelease() {
  lastNativeRelease = performance.now();
  playReleaseSound();
}

function addNativeSoundListeners() {
  // Pointer interaction is handled by the calibrated key surface below.
}

function removeNativeSoundListeners() {
  document.removeEventListener('pointerdown', unlockAudio, true);
  document.removeEventListener('keydown', unlockAudio, true);
}

function emitKeyEvent(type, name) {
  if (!app) return;
  suppressSplineEvent = true;
  try {
    app.emitEvent(type, name);
  } finally {
    suppressSplineEvent = false;
  }
}

function emitHoverEvent(name, reverse = false) {
  if (!app) return;
  suppressSplineEvent = true;
  try {
    if (reverse) {
      app.emitEventReverse('mouseHover', name);
    } else {
      app.emitEvent('mouseHover', name);
    }
  } finally {
    suppressSplineEvent = false;
  }
}

function enterKey(name) {
  if (!skills[name] || activeSkill === name) return;
  if (activeSkill) {
    emitHoverEvent(activeSkill, true);
    handleNativeRelease();
  }
  activeSkill = name;
  setReadout(name);
  handleNativePress();
  emitHoverEvent(name);
}

function leaveActiveKey() {
  if (!activeSkill) return;
  emitHoverEvent(activeSkill, true);
  handleNativeRelease();
  activeSkill = '';
}

function getSkillAtPointer(event) {
  if (!hitGrid) return '';
  const rect = hitGridRect ??= hitGrid.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  if (x < 0 || x >= 1 || y < 0 || y >= 1) return '';

  const column = Math.min(5, Math.floor(x * 6));
  const row = Math.min(3, Math.floor(y * 4));
  return skillGrid[row][column];
}

function handleKeySurfacePointer(event) {
  const name = getSkillAtPointer(event);
  if (name) enterKey(name);
}

function handleKeySurfaceLeave() {
  hitGridRect = undefined;
  leaveActiveKey();
}

function handleKeySurfacePointerDown(event) {
  const name = getSkillAtPointer(event);
  if (name) enterKey(name);
  if (audioUnlocked || !name) return;

  unlockAudio().then((unlocked) => {
    if (unlocked && activeSkill === name) handleNativePress();
  });
}

function createKeyHitGrid() {
  if (hitGrid) return;
  hitGrid = document.createElement('div');
  hitGrid.className = 'tech-keyboard-hit-grid';
  hitGrid.setAttribute('aria-label', 'Interactive technology keys');
  hitGrid.addEventListener('pointerenter', handleKeySurfacePointer);
  hitGrid.addEventListener('pointermove', handleKeySurfacePointer);
  hitGrid.addEventListener('pointerdown', handleKeySurfacePointerDown);
  hitGrid.addEventListener('pointerleave', handleKeySurfaceLeave);
  hitGrid.addEventListener('pointercancel', handleKeySurfaceLeave);
  hitGrid.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'mouse') leaveActiveKey();
  });

  skillGrid.flat().forEach((name) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tech-keyboard-hit-key';
    button.dataset.skill = name;
    button.setAttribute('aria-label', `${skills[name][1]} technology key`);

    button.addEventListener('focus', () => setReadout(name));
    button.addEventListener('blur', () => {
      if (activeSkill !== name) return;
      emitKeyEvent('keyUp', name);
      handleNativeRelease();
      activeSkill = '';
    });
    button.addEventListener('keydown', (event) => {
      if (event.repeat || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      if (activeSkill && activeSkill !== name) {
        emitKeyEvent('keyUp', activeSkill);
        handleNativeRelease();
      }
      activeSkill = name;
      setReadout(name);
      handleNativePress();
      emitKeyEvent('keyDown', name);
    });
    button.addEventListener('keyup', (event) => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      handleNativeRelease();
      emitKeyEvent('keyUp', name);
      if (activeSkill === name) activeSkill = '';
    });
    hitGrid.appendChild(button);
  });

  stage.appendChild(hitGrid);
}

function showFallback(error) {
  loader.hidden = true;
  canvas.hidden = true;
  fallback.hidden = false;
  fallback.dataset.reason = error instanceof Error ? error.message : 'Unknown keyboard initialization error.';
}

function easeCinematic(progress) {
  const clamped = Math.max(0, Math.min(1, progress));
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}

function easeScaleSettle(progress) {
  const eased = easeCinematic(progress);
  const settle = Math.sin(progress * Math.PI) * Math.pow(progress, 1.7) * 0.025;
  return eased + settle;
}

function runKeyboardEntrance() {
  if (!app || entrancePlayed || !keyboardTarget) return;
  const keyboard = app.findObjectByName('keyboard');
  if (!keyboard) return;

  if (app.isStopped) app.play();
  entrancePlayed = true;
  keyboard.visible = true;
  stage.classList.remove('is-settled');
  stage.classList.add('is-entering');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    keyboard.scale.x = keyboardTarget.scale;
    keyboard.scale.y = keyboardTarget.scale;
    keyboard.scale.z = keyboardTarget.scale;
    keyboard.position.x = keyboardTarget.x;
    keyboard.position.y = keyboardTarget.y;
    keyboard.rotation.y = keyboardTarget.rotationY;
    keyboard.rotation.x = keyboardTarget.rotationX;
    keyboard.rotation.z = keyboardTarget.rotationZ;
    canvas.style.removeProperty('opacity');
    canvas.style.removeProperty('transition');
    stage.classList.remove('is-entering');
    stage.classList.add('is-settled');
    return;
  }

  canvas.style.transition = 'none';
  canvas.style.opacity = '0';
  const duration = 2300;
  const startTime = performance.now();
  const startScale = keyboardTarget.scale * 0.58;
  const startY = keyboardTarget.y - 36;
  // Begin at the authored isometric angle, then settle into a level
  // screen-space pose as the section enters the viewport.
  const startRotation = Math.PI / 12;
  const startRotationX = Math.PI / 10;
  const startRotationZ = 0;

  const animate = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = easeCinematic(progress);
    const scaleEased = easeScaleSettle(progress);
    const fadeEased = easeCinematic(Math.min(1, progress / 0.58));
    const scale = startScale + (keyboardTarget.scale - startScale) * scaleEased;

    canvas.style.opacity = String(fadeEased);
    keyboard.scale.x = scale;
    keyboard.scale.y = scale;
    keyboard.scale.z = scale;
    keyboard.position.x = keyboardTarget.x;
    keyboard.position.y = startY + (keyboardTarget.y - startY) * eased;
    keyboard.rotation.y = startRotation + (keyboardTarget.rotationY - startRotation) * eased;
    keyboard.rotation.x = startRotationX + (keyboardTarget.rotationX - startRotationX) * eased;
    keyboard.rotation.z = startRotationZ + (keyboardTarget.rotationZ - startRotationZ) * eased;

    if (progress < 1) {
      entranceFrame = requestAnimationFrame(animate);
      return;
    }

    entranceFrame = undefined;
    keyboard.scale.x = keyboardTarget.scale;
    keyboard.scale.y = keyboardTarget.scale;
    keyboard.scale.z = keyboardTarget.scale;
    keyboard.position.y = keyboardTarget.y;
    keyboard.rotation.y = keyboardTarget.rotationY;
    keyboard.rotation.x = keyboardTarget.rotationX;
    keyboard.rotation.z = keyboardTarget.rotationZ;
    canvas.style.removeProperty('opacity');
    canvas.style.removeProperty('transition');
    stage.classList.remove('is-entering');
    stage.classList.add('is-settled');
  };

  entranceFrame = requestAnimationFrame(animate);
}

function observeKeyboardEntrance() {
  if (!('IntersectionObserver' in window)) {
    runKeyboardEntrance();
    return;
  }

  const checkVisibility = () => {
    entranceVisibilityFrame = undefined;
    const rect = stage.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
    const visibleRatio = rect.height ? visibleHeight / rect.height : 0;
    const isOutsideViewport = rect.bottom <= 0 || rect.top >= window.innerHeight;

    if (document.hidden || isOutsideViewport) {
      if (entrancePlayed) {
        if (entranceFrame) cancelAnimationFrame(entranceFrame);
        entranceFrame = undefined;
        entrancePlayed = false;
        stage.classList.remove('is-entering', 'is-settled');
        canvas.style.removeProperty('opacity');
        canvas.style.removeProperty('transition');
        const keyboard = app?.findObjectByName('keyboard');
        if (keyboard) keyboard.visible = false;
      }
      if (app && !app.isStopped) app.stop();
      return;
    }

    if (!entrancePlayed && visibleRatio < 0.58) {
      if (app && !app.isStopped) app.stop();
      return;
    }

    if (entrancePlayed && app?.isStopped) app.play();

    if (visibleRatio >= 0.58) {
      runKeyboardEntrance();
    }
  };

  const queueVisibilityCheck = () => {
    if (entranceVisibilityFrame) return;
    entranceVisibilityFrame = requestAnimationFrame(checkVisibility);
  };
  entranceVisibilityHandler = queueVisibilityCheck;

  entranceObserver = new IntersectionObserver(queueVisibilityCheck, { threshold: [0, 0.58] });
  entranceObserver.observe(stage);
  window.addEventListener('scroll', queueVisibilityCheck, { passive: true });
  window.addEventListener('resize', queueVisibilityCheck, { passive: true });
  document.addEventListener('visibilitychange', queueVisibilityCheck, { passive: true });
  queueVisibilityCheck();
}

function configureKeyboardScene() {
  hitGridRect = undefined;
  if (!app) return;

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const keyboard = app.findObjectByName('keyboard');
  if (keyboard) {
    const scale = Math.max(0.11, Math.min(0.185, stage.clientWidth / 2975));
    keyboardTarget = {
      scale,
      x: stage.clientWidth > 560 ? 8 : (isMobile ? -8 : 16),
      y: -118,
      // Face the keyboard toward the viewer once it settles so the key labels
      // read straight, while retaining just enough depth to feel three-dimensional.
      rotationX: 0.85,
      rotationY: -0.4,
      rotationZ: 0.25,
    };
    keyboard.visible = entrancePlayed;
    keyboard.scale.x = scale;
    keyboard.scale.y = scale;
    keyboard.scale.z = scale;
    keyboard.position.x = keyboardTarget.x;
    keyboard.position.y = keyboardTarget.y;
    keyboard.position.z = 0;
    keyboard.rotation.x = keyboardTarget.rotationX;
    keyboard.rotation.y = keyboardTarget.rotationY;
    keyboard.rotation.z = keyboardTarget.rotationZ;
  }

  const allObjects = app.getAllObjects();
  allObjects.forEach((object) => {
    if (object.name === 'keycap-desktop') object.visible = !isMobile;
    if (object.name === 'keycap-mobile') object.visible = isMobile;
    if (object.name === 'keycap') {
      object.visible = true;
      object.position.y = 50;
    }
  });

  const desktopText = app.findObjectByName('text-desktop');
  const desktopDarkText = app.findObjectByName('text-desktop-dark');
  const mobileText = app.findObjectByName('text-mobile');
  const mobileDarkText = app.findObjectByName('text-mobile-dark');
  if (desktopText) desktopText.visible = false;
  if (desktopDarkText) desktopDarkText.visible = false;
  if (mobileText) mobileText.visible = false;
  if (mobileDarkText) mobileDarkText.visible = false;
}

async function startKeyboard() {
  try {
    if (!Application) {
      ({ Application } = await withTimeout(
        import('./vendor/spline-runtime-1.12.0.js'),
        12000,
        'The local keyboard runtime took too long to initialize.',
      ));
    }
    app = new Application(canvas);

    await withTimeout(
      app.load('assets/naresh-keyboard/skills-keyboard.splinecode'),
      15000,
      'The keyboard scene took too long to load.',
    );
    addNativeSoundListeners();
    createKeyHitGrid();
    configureKeyboardScene();

    app.addEventListener('keyDown', (event) => {
      if (suppressSplineEvent) return;
      const name = event?.target?.name;
      if (name && setReadout(name)) {
        activeSkill = name;
        if (performance.now() - lastNativePress > 120) playPressSound();
      }
    });

    app.addEventListener('keyUp', (event) => {
      if (suppressSplineEvent) return;
      const name = event?.target?.name;
      if (!skills[name]) return;
      if (performance.now() - lastNativeRelease > 120) playReleaseSound();
      if (activeSkill === name) activeSkill = '';
    });

    stage.classList.add('is-loaded');
    observeKeyboardEntrance();
    window.addEventListener('resize', configureKeyboardScene, { passive: true });
  } catch (error) {
    console.error('Unable to initialize the interactive tech keyboard.', error);
    showFallback(error);
  }
}

if (stage && canvas) {
  // Install the lightweight audio unlock path immediately. The considerably
  // heavier 3D runtime and scene remain deferred until the section is near.
  prepareAudio();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      startKeyboard();
    }, { rootMargin: '320px 0px' });
    observer.observe(stage);
  } else {
    startKeyboard();
  }
}

window.addEventListener('pagehide', () => {
  window.removeEventListener('resize', configureKeyboardScene);
  removeNativeSoundListeners();
  entranceObserver?.disconnect();
  if (entranceFrame) cancelAnimationFrame(entranceFrame);
  if (entranceVisibilityFrame) cancelAnimationFrame(entranceVisibilityFrame);
  if (entranceVisibilityHandler) {
    window.removeEventListener('scroll', entranceVisibilityHandler);
    window.removeEventListener('resize', entranceVisibilityHandler);
    document.removeEventListener('visibilitychange', entranceVisibilityHandler);
  }
  app?.dispose();
  app = undefined;
  tactileContext?.close().catch(() => {});
});
