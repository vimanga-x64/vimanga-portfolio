(() => {
  'use strict';

  const models = [...document.querySelectorAll('model-viewer')];
  if (!models.length) return;

  const configureRuntime = () => {
    const ModelViewerElement = window.customElements?.get('model-viewer');
    if (!ModelViewerElement) return;
    // The project laptop is large in the card. Full-resolution frames hitch the
    // scroll into that section, so it renders at half scale. Smaller models stay sharp.
    ModelViewerElement.minimumRenderScale = 0.5;
    models.forEach(model => {
      try {
        model.minimumRenderScale = model.classList.contains('project-laptop-model') ? 0.5 : 1;
      } catch (_) {}
    });
  };

  let runtimeRequested = false;
  const loadRuntime = () => {
    if (window.customElements?.get('model-viewer')) {
      configureRuntime();
      return;
    }
    if (runtimeRequested) return;
    runtimeRequested = true;

    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    script.dataset.modelViewerRuntime = 'true';
    script.addEventListener('load', () => {
      window.customElements.whenDefined('model-viewer').then(configureRuntime);
    }, { once: true });
    document.head.appendChild(script);
  };

  const isLoaderModel = model => Boolean(model.closest('#loader, .loader'));

  const modelVisible = new WeakMap();
  let scrolling = false;
  let scrollTimer = 0;

  const applyPlayback = model => {
    const playing = Boolean(modelVisible.get(model)) && !scrolling;
    if (playing) {
      if (model.hasAttribute('data-wants-auto-rotate')) model.setAttribute('auto-rotate', '');
      model.resume?.();
    } else {
      if (model.hasAttribute('auto-rotate')) {
        model.setAttribute('data-wants-auto-rotate', '');
        model.removeAttribute('auto-rotate');
      }
      model.pause?.();
    }
  };

  const pauseOffscreenWork = model => {
    if (!('IntersectionObserver' in window)) return;
    // Keep the splash cup spinning for the whole loading sequence.
    if (isLoaderModel(model)) return;

    const rotationObserver = new IntersectionObserver(entries => {
      modelVisible.set(model, Boolean(entries[0]?.isIntersecting));
      applyPlayback(model);
    }, { threshold: 0.08, rootMargin: '80px 0px' });
    modelVisible.set(model, false);
    applyPlayback(model);
    rotationObserver.observe(model);
  };

  window.addEventListener('scroll', () => {
    if (!scrolling) {
      scrolling = true;
      models.forEach(applyPlayback);
    }
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      scrolling = false;
      models.forEach(applyPlayback);
    }, 140);
  }, { passive: true });

  // Keep src off the network until the model is near the viewport. model-viewer's
  // native loading="lazy" still competes once the runtime is up; this gates fetch.
  const deferHeavySources = () => {
    if (!('IntersectionObserver' in window)) return;

    const deferred = models.filter(model => {
      if (isLoaderModel(model)) return false;
      if (model.getAttribute('loading') === 'eager') return false;
      const src = model.getAttribute('src');
      if (!src) return false;
      model.setAttribute('data-src', src);
      model.removeAttribute('src');
      return true;
    });

    if (!deferred.length) return;

    const renderScale = model => model.classList.contains('project-laptop-model') ? 0.5 : 1;

    const hydrate = model => {
      const src = model.getAttribute('data-src');
      if (!src || model.getAttribute('src')) return;
      try {
        model.minimumRenderScale = renderScale(model);
      } catch (_) {}
      model.setAttribute('src', src);
      model.removeAttribute('data-src');
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        // The project laptop is warmed during idle so arriving at the section
        // does not parse the model on the same frame as the scroll.
        if (entry.target.classList.contains('project-laptop-model')) {
          observer.unobserve(entry.target);
          return;
        }
        hydrate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '120px 0px', threshold: 0.01 });

    deferred.forEach(model => observer.observe(model));
    return hydrate;
  };

  const hydrateModel = deferHeavySources();

  const needsEagerRuntime = models.some(model => (
    model.getAttribute('loading') === 'eager' || isLoaderModel(model)
  ));

  const warmProjectLaptop = () => {
    loadRuntime();
    if (typeof hydrateModel === 'function') {
      models.forEach(model => {
        if (model.classList.contains('project-laptop-model')) hydrateModel(model);
      });
    }
  };

  const scheduleWarm = () => {
    const start = () => {
      const run = deadline => {
        const idleEnough = !deadline || typeof deadline.timeRemaining !== 'function' || deadline.timeRemaining() >= 12;
        if (scrolling || !idleEnough) {
          window.setTimeout(run, 200);
          return;
        }
        warmProjectLaptop();
      };
      if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1800 });
      else window.setTimeout(run, 900);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  };

  if (needsEagerRuntime || !('IntersectionObserver' in window)) {
    loadRuntime();
    models.forEach(pauseOffscreenWork);
    return;
  }

  scheduleWarm();

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    loadRuntime();
  }, { threshold: 0, rootMargin: '220px 0px' });

  models.forEach(model => {
    if (!model.classList.contains('project-laptop-model')) observer.observe(model);
    pauseOffscreenWork(model);
  });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();
