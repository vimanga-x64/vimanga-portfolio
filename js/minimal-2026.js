(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => prefersReducedMotion.matches;
  const supportsObserver = 'IntersectionObserver' in window;

  const onVisible = (element, callback, options = {}) => {
    if (!supportsObserver) {
      callback(true);
      return () => {};
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => callback(entry.isIntersecting, entry));
    }, { threshold: .15, ...options });
    observer.observe(element);
    return () => observer.disconnect();
  };

  const once = (element, callback, options) => {
    const stop = onVisible(element, visible => {
      if (!visible) return;
      callback();
      stop();
    }, options);
  };

  /* ------------------------------------------------------------ header */

  const header = document.querySelector('[data-header]');
  const navLinks = [...document.querySelectorAll('.site-menu a[href^="#"]')];
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('siteMenu');
  const scrim = document.querySelector('[data-menu-scrim]');

  let headerFrame = 0;
  const syncHeader = () => {
    headerFrame = 0;
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  syncHeader();
  window.addEventListener('scroll', () => {
    if (headerFrame) return;
    headerFrame = window.requestAnimationFrame(syncHeader);
  }, { passive: true });

  if (menuToggle && menu && scrim) {
    let closeTimer = 0;
    let readyTimer = 0;
    let motion = null;
    const openDuration = reduced() ? 0 : 520;
    const closeDuration = reduced() ? 0 : 520;
    const snap = 'cubic-bezier(.33, 0, .2, 1)';

    const layoutWidth = () => document.documentElement.clientWidth;

    const buttonFrame = () => {
      const rect = menuToggle.getBoundingClientRect();
      const top = rect.top;
      const right = Math.max(0, layoutWidth() - rect.right);
      menu.style.setProperty('--menu-top', `${top}px`);
      menu.style.setProperty('--menu-right', `${right}px`);
      return {
        top: `${top}px`,
        right: `${right}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        borderRadius: '999px',
        backgroundColor: '#1d3f86',
        boxShadow: '0 8px 18px rgba(29, 63, 134, .18)',
      };
    };

    const currentFrame = () => {
      const rect = menu.getBoundingClientRect();
      const style = getComputedStyle(menu);
      return {
        top: `${rect.top}px`,
        right: `${Math.max(0, layoutWidth() - rect.right)}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        borderRadius: style.borderTopLeftRadius,
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    };

    const pin = frame => {
      menu.style.top = frame.top;
      menu.style.right = frame.right;
      menu.style.width = frame.width;
      menu.style.height = frame.height;
    };

    const unpin = () => {
      menu.style.top = '';
      menu.style.right = '';
      menu.style.width = '';
      menu.style.height = '';
    };

    const finishClose = () => {
      motion?.cancel();
      motion = null;
      menu.hidden = true;
      scrim.hidden = true;
      unpin();
      menu.classList.remove('is-closing');
      header.classList.remove('is-menu-open');
      header.classList.remove('is-closing');
      document.body.style.overflow = '';
    };

    const play = (frames, duration, fill, easing = snap) => {
      motion?.cancel();
      motion = menu.animate(frames, { duration, easing, fill });
    };

    const openMenu = () => {
      window.clearTimeout(closeTimer);
      header.classList.remove('is-closing');
      menu.classList.remove('is-closing');
      document.body.style.overflow = 'hidden';
      const from = menu.hidden ? buttonFrame() : currentFrame();
      motion?.cancel();
      motion = null;
      menu.hidden = false;
      scrim.hidden = false;
      pin(from);
      menu.classList.add('is-open');
      unpin();
      const to = currentFrame();
      pin(from);
      play([from, to], openDuration, 'both');
      menuToggle.setAttribute('aria-expanded', 'true');
      header.classList.add('is-menu-open');
      scrim.classList.add('is-open');
      window.clearTimeout(readyTimer);
      readyTimer = window.setTimeout(() => menu.classList.add('is-ready'), openDuration ? 160 : 0);
      const running = motion;
      running.onfinish = () => {
        if (motion !== running) return;
        running.cancel();
        motion = null;
        unpin();
      };
    };

    const closeMenu = () => {
      if (menu.hidden) return;
      window.clearTimeout(readyTimer);
      menu.classList.remove('is-ready');
      const from = currentFrame();
      const to = buttonFrame();
      from.backgroundColor = '#ffffff';
      to.backgroundColor = '#1d3f86';
      menu.classList.remove('is-open');
      menu.classList.add('is-closing');
      scrim.classList.remove('is-open');
      pin(from);
      play([
        { ...from, backgroundColor: '#ffffff', offset: 0 },
        { backgroundColor: '#ffffff', offset: .62 },
        { ...to, backgroundColor: '#1d3f86', offset: 1 },
      ], closeDuration, 'forwards');
      menuToggle.setAttribute('aria-expanded', 'false');
      closeTimer = window.setTimeout(finishClose, closeDuration);
    };

    menuToggle.addEventListener('click', openMenu);
    scrim.addEventListener('click', closeMenu);
    menu.querySelector('[data-menu-close]')?.addEventListener('click', closeMenu);
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') closeMenu();
    });
  }

  if (navLinks.length && supportsObserver) {
    const sections = navLinks
      .map(link => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.classList.toggle('is-current', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }

  /* ------------------------------------------------- flipping headline */

  const flip = document.querySelector('[data-flip]');
  if (flip) {
    const track = flip.querySelector('.flip__words');
    const words = [...track.querySelectorAll('span')];
    let index = 0;
    // the pill hugs the current word so the headline stays optically centred
    const fit = () => {
      const width = words[index].getBoundingClientRect().width;
      const overhang = parseFloat(getComputedStyle(track).fontSize) * .06; // italic glyphs lean past their advance width
      if (width) track.style.width = `${Math.ceil(width + overhang)}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener('resize', fit);
    if (words.length > 1 && !reduced()) {
      window.setInterval(() => {
        const current = words[index];
        index = (index + 1) % words.length;
        current.classList.remove('is-active');
        current.classList.add('is-leaving');
        window.setTimeout(() => current.classList.remove('is-leaving'), 700);
        words[index].classList.add('is-active');
        flip.dataset.tone = String(index);
        fit();
        // the hero colour field follows the pill's tone
        document.dispatchEvent(new CustomEvent('flip:change', { detail: index }));
      }, 2600);
    }
  }

  /* ----------------------------------------------------- ask + photos */

  const ask = document.querySelector('[data-ask]');
  if (ask) {
    const input = ask.querySelector('[data-ask-input]');
    const ghost = ask.querySelector('[data-ask-ghost]');
    const answer = ask.querySelector('[data-ask-answer]');
    const photos = [...document.querySelectorAll('[data-hero-photo]')];

    const examples = [
      'Try ‘What did Vimanga build for NASA?’',
      'Try ‘Show me the research on tutoring systems’',
      'Try ‘Which tools does he reach for most?’',
      'Try ‘Is Vimanga open to new roles?’',
      'Try ‘What is FitTrack?’',
      'Try ‘Where did he study?’'
    ];

    const intents = [
      {
        id: 'nasa',
        keys: ['nasa', 'weather', 'space', 'satellite', 'geospatial', 'earth'],
        target: '.work-card--weather',
        answer: 'WeatherWise, built at NASA Space Apps. Taking you there.'
      },
      {
        id: 'fittrack',
        keys: ['fittrack', 'fit track', 'health', 'recovery', 'hackathon', 'winhacks', 'fitness', 'biometric'],
        target: '.work-card--fittrack',
        answer: 'FitTrack: a recovery assistant that was a WinHacks finalist.'
      },
      {
        id: 'movie',
        keys: ['movie', 'films', 'tmdb', 'semantic', 'hugging'],
        target: '.work-card--movie',
        answer: 'AI Movie Search, a natural-language way to find films.'
      },
      {
        id: 'tutor',
        keys: ['tutor', 'thesis', 'pomdp', 'adaptive', 'e-tutor', 'etutor'],
        target: '.work-card--tutor',
        answer: 'E-Tutor, the mobile tutoring system behind my master’s thesis.'
      },
      {
        id: 'research',
        keys: ['research', 'paper', 'publish', 'study', 'graph', 'hypergraph', 'gloss', 'nlp', 'heart', 'academic'],
        target: '#research',
        answer: 'Four selected papers, from hypergraph learning to health AI.'
      },
      {
        id: 'stack',
        keys: ['stack', 'tool', 'tech', 'react', 'python', 'typescript', 'framework', 'skills', 'languages'],
        target: '#practice',
        answer: 'Twelve tools I reach for most, plus how I like to work.'
      },
      {
        id: 'hire',
        keys: ['hire', 'open to', 'job', 'available', 'role', 'work with', 'contact', 'email', 'talk', 'reach', 'opportunit'],
        target: '#contact',
        answer: 'Yes. Open to software engineering, applied AI and research roles.'
      },
      {
        id: 'resume',
        keys: ['resume', 'résumé', 'cv'],
        action: () => window.open('output/pdf/Vimanga_Umange_Resume.pdf', '_blank', 'noopener'),
        answer: 'Opening my resume in a new tab.'
      },
      {
        id: 'experience',
        keys: ['experience', 'worked', 'career', 'history', 'teach', 'intern', 'etezazi', 'study', 'school', 'university', 'degree', 'education', 'windsor', 'wichita'],
        target: '#experience',
        answer: 'Three roles and two degrees, in order.'
      },
      {
        id: 'archive',
        keys: ['old', 'previous', 'archive', 'before', 'past', 'booth', 'easter'],
        target: '#oldsite',
        answer: 'Look for the little red telephone booth. The old site is still ringing.'
      },
      {
        id: 'about',
        keys: ['about', 'who', 'yourself', 'matcha', 'hobby', 'interest', 'read', 'walk', 'fiction'],
        target: '#about',
        answer: 'A little context, with a photo.'
      }
    ];

    const fallback = { target: '#work', answer: 'A good place to start: selected work.' };

    let exampleIndex = 0;
    let ghostTimer = 0;
    let ghostActive = true;

    const setPhoto = index => {
      const total = photos.length;
      if (!total) return;
      photos.forEach((photo, i) => {
        photo.classList.remove('is-active', 'is-prev', 'is-next');
        if (i === index % total) photo.classList.add('is-active');
        else if (i === (index + total - 1) % total) photo.classList.add('is-prev');
        else if (i === (index + 1) % total) photo.classList.add('is-next');
      });
      const count = document.querySelector('[data-hero-count] b');
      if (count) count.textContent = String((index % total) + 1);
    };

    const wait = ms => new Promise(resolve => { ghostTimer = window.setTimeout(resolve, ms); });

    const typeGhost = async () => {
      if (!ghost) return;
      while (ghostActive) {
        const text = examples[exampleIndex % examples.length];
        setPhoto(exampleIndex);
        if (reduced()) {
          ghost.textContent = text;
          await wait(4200);
        } else {
          ghost.textContent = '';
          for (let i = 1; i <= text.length; i += 1) {
            if (!ghostActive) return;
            ghost.textContent = text.slice(0, i);
            await wait(26 + Math.random() * 18);
          }
          await wait(2400);
          for (let i = text.length; i >= 0; i -= 1) {
            if (!ghostActive) return;
            ghost.textContent = text.slice(0, i);
            await wait(9);
          }
          await wait(260);
        }
        exampleIndex += 1;
      }
    };

    setPhoto(0);
    typeGhost();

    const syncGhost = () => {
      ghost?.classList.toggle('is-hidden', input.value.length > 0);
    };
    input.addEventListener('input', syncGhost);
    input.addEventListener('focus', syncGhost);
    input.addEventListener('blur', syncGhost);

    const resolveIntent = query => {
      const text = query.toLowerCase();
      return intents.find(intent => intent.keys.some(key => text.includes(key))) || fallback;
    };

    const spotlight = element => {
      element.classList.remove('is-spotlit');
      void element.offsetWidth;
      element.classList.add('is-spotlit');
      element.addEventListener('animationend', () => element.classList.remove('is-spotlit'), { once: true });
    };

    const runIntent = intent => {
      if (answer) {
        answer.textContent = intent.answer;
        answer.classList.add('is-visible');
      }
      if (intent.action) {
        intent.action();
        return;
      }
      const target = document.querySelector(intent.target);
      if (!target) return;
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: target.matches('.egg') ? 'center' : 'start' });
        if (!reduced() && target.matches('.work-card')) spotlight(target);
        if (target.matches('.egg')) {
          target.classList.add('is-hinted');
          window.setTimeout(() => target.classList.remove('is-hinted'), 3200);
        }
      }, 1100); // long enough to read the reply under the bar before the page moves
    };

    ask.addEventListener('submit', event => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) {
        const example = examples[exampleIndex % examples.length].replace(/^Try ‘|’$/g, '');
        runIntent(resolveIntent(example));
        return;
      }
      runIntent(resolveIntent(query));
    });

    ask.querySelectorAll('[data-ask-suggest]').forEach(button => {
      button.addEventListener('click', () => {
        const intent = intents.find(item => item.id === button.dataset.askSuggest) || fallback;
        input.value = button.textContent.trim();
        syncGhost();
        runIntent(intent);
      });
    });
  }

  /* ------------------------------------------------- hero release film */
  /* A live colour field behind the hero: large soft blobs in the site palette
     drifting through each other (multiply), two thin ribbons, and a clearing
     in the middle so the headline stays legible. Palette follows the pill. */

  const heroCanvas = document.querySelector('[data-hero-canvas]');
  const hero = heroCanvas?.closest('.hero');
  if (heroCanvas && hero) {
    const ctx = heroCanvas.getContext('2d', { alpha: false });
    const sky = [185, 203, 230], butter = [241, 221, 154], sand = [231, 216, 193];
    const sage = [169, 183, 159], clay = [217, 119, 87], plum = [143, 122, 165];
    const palettes = [
      [sky, sand, clay, sky, butter, sand],
      [butter, clay, sand, butter, sky, sand],
      [sand, clay, plum, sand, butter, sky],
      [sage, sky, sand, sage, clay, butter]
    ];

    const blobs = [];
    const ribbons = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let lastFrame = 0;
    let time = 0;
    let visible = false;
    let targetPalette = palettes[0];

    const random = (min, max) => min + Math.random() * (max - min);
    const lerp = (a, b, t) => a + (b - a) * t;

    const buildScene = () => {
      blobs.length = 0;
      ribbons.length = 0;
      for (let i = 0; i < 6; i += 1) {
        blobs.push({
          x: random(.1, .9),
          y: random(.15, .85),
          r: random(.3, .5),
          ax: random(.1, .22), ay: random(.08, .2),
          fx: random(.00006, .00013), fy: random(.00005, .00012),
          px: random(0, Math.PI * 2), py: random(0, Math.PI * 2),
          color: [...palettes[0][i]],
          alpha: random(.55, .75)
        });
      }
      for (let i = 0; i < 2; i += 1) {
        ribbons.push({
          y: random(.3, .7),
          amp: random(.05, .12),
          freq: random(1.1, 2),
          speed: random(.0001, .0002),
          phase: random(0, Math.PI * 2),
          alpha: random(.1, .18)
        });
      }
    };

    let scrolling = false;
    let scrollTimer = 0;
    window.addEventListener('scroll', () => {
      scrolling = true;
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        scrolling = false;
        lastFrame = 0;
        if (visible) start();
      }, 160);
    }, { passive: true });

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      heroCanvas.width = width;
      heroCanvas.height = height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const draw = delta => {
      time += delta;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#f5f3ee';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'multiply';
      const scale = Math.max(width, height);
      blobs.forEach((blob, i) => {
        const target = targetPalette[i % targetPalette.length];
        for (let c = 0; c < 3; c += 1) blob.color[c] = lerp(blob.color[c], target[c], Math.min(1, delta * .0009));
        const x = (blob.x + Math.sin(time * blob.fx + blob.px) * blob.ax) * width;
        const y = (blob.y + Math.cos(time * blob.fy + blob.py) * blob.ay) * height;
        const r = blob.r * scale * (1 + Math.sin(time * .00015 + i) * .08);
        const [cr, cg, cb] = blob.color.map(Math.round);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, `rgba(${cr},${cg},${cb},${blob.alpha})`);
        gradient.addColorStop(.55, `rgba(${cr},${cg},${cb},${blob.alpha * .45})`);
        gradient.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1;
      ribbons.forEach(ribbon => {
        ctx.strokeStyle = `rgba(184, 92, 62, ${ribbon.alpha})`;
        ctx.beginPath();
        const steps = 56;
        for (let s = 0; s <= steps; s += 1) {
          const t = s / steps;
          const x = t * width;
          const y = (ribbon.y + Math.sin(t * ribbon.freq * Math.PI * 2 + time * ribbon.speed + ribbon.phase) * ribbon.amp
            + Math.sin(t * 7 + time * ribbon.speed * .6) * ribbon.amp * .18) * height;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      /* clearing behind the headline and ask bar */
      const cx = width / 2;
      const cy = height * .42;
      const clearing = ctx.createRadialGradient(cx, cy, Math.min(width, height) * .1, cx, cy, Math.max(width, height) * .55);
      clearing.addColorStop(0, 'rgba(245, 243, 238, .62)');
      clearing.addColorStop(.6, 'rgba(245, 243, 238, .18)');
      clearing.addColorStop(1, 'rgba(245, 243, 238, 0)');
      ctx.fillStyle = clearing;
      ctx.fillRect(0, 0, width, height);
    };

    const frame = now => {
      raf = 0;
      if (!visible || document.hidden || reduced() || scrolling) return;
      const elapsed = lastFrame ? now - lastFrame : 48;
      if (lastFrame && elapsed < 48) {
        raf = window.requestAnimationFrame(frame);
        return;
      }
      lastFrame = now;
      draw(Math.min(80, elapsed));
      raf = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf) return;
      lastFrame = 0;
      raf = window.requestAnimationFrame(frame);
    };

    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    };

    onVisible(hero, isVisible => {
      visible = isVisible;
      if (visible) start();
      else stop();
    }, { threshold: 0 });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (visible) start();
    });

    document.addEventListener('flip:change', event => {
      targetPalette = palettes[Number(event.detail) % palettes.length];
    });

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        if (reduced()) draw(16);
      }, 120);
    });

    buildScene();
    resize();
    draw(16);
  }

  /* -------------------------------------------------------- butterflies */

  const butterflies = document.querySelector('[data-butterflies]');
  if (butterflies && !reduced()) {
    const footer = butterflies.closest('.footer') || butterflies;
    butterflies.addEventListener('playing', () => butterflies.classList.add('is-playing'), { once: true });
    onVisible(footer, isVisible => {
      if (isVisible) butterflies.play().catch(() => {});
      else butterflies.pause();
    }, { threshold: .05 });
  }

  /* ------------------------------------------------- portfolio archive */

  const archiveTrigger = document.querySelector('[data-archive-trigger]');
  const archive = archiveTrigger?.closest('.egg');
  if (archiveTrigger && archive) {
    const setArchiveOpen = open => {
      archive.classList.toggle('is-open', open);
      archiveTrigger.setAttribute('aria-expanded', String(open));
    };

    archiveTrigger.addEventListener('click', event => {
      event.stopPropagation();
      setArchiveOpen(!archive.classList.contains('is-open'));
    });
    document.addEventListener('click', event => {
      if (!archive.contains(event.target)) setArchiveOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        setArchiveOpen(false);
        archiveTrigger.focus();
      }
    });
  }

  /* ----------------------------------------------------------- reveals */

  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduced() || !supportsObserver) {
    reveals.forEach(item => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveals.forEach(item => revealObserver.observe(item));
  }

  /* -------------------------------------------------------------- tilt */

  document.querySelectorAll('[data-tilt]').forEach(card => {
    if (reduced() || !window.matchMedia('(hover: hover)').matches) return;
    let tiltFrame = 0;
    let tiltX = 0;
    let tiltY = 0;
    let tiltRect = null;
    const paintTilt = () => {
      tiltFrame = 0;
      card.style.transform = `perspective(1200px) rotateX(${(-tiltY * 6).toFixed(2)}deg) rotateY(${(tiltX * 8).toFixed(2)}deg)`;
    };
    card.addEventListener('pointerenter', () => {
      tiltRect = card.getBoundingClientRect();
    });
    card.addEventListener('pointermove', event => {
      const rect = tiltRect || card.getBoundingClientRect();
      tiltX = (event.clientX - rect.left) / rect.width - .5;
      tiltY = (event.clientY - rect.top) / rect.height - .5;
      if (tiltFrame) return;
      tiltFrame = window.requestAnimationFrame(paintTilt);
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  /* ------------------------------------------------------------- clock */

  const timeNode = document.querySelector('[data-local-time]');
  const yearNode = document.querySelector('[data-year]');
  const updateLocalTime = () => {
    if (!timeNode) return;
    const now = new Date();
    timeNode.textContent = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    timeNode.setAttribute('datetime', now.toISOString());
  };
  updateLocalTime();
  window.setInterval(updateLocalTime, 30000);
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());
})();
