(() => {
  'use strict';

  const models = [...document.querySelectorAll('model-viewer')];
  if (!models.length) return;

  const configureRuntime = () => {
    const ModelViewerElement = window.customElements?.get('model-viewer');
    if (!ModelViewerElement) return;
    // Enforce 1:1 full-resolution render scale so 3D objects are crystal clear without blur
    ModelViewerElement.minimumRenderScale = 1;
    models.forEach(model => {
      try {
        model.minimumRenderScale = 1;
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

  const pauseOffscreenWork = model => {
    const sync = visible => {
      if (visible) {
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

    if (!('IntersectionObserver' in window)) return;
    // Keep the splash cup spinning for the whole loading sequence.
    if (isLoaderModel(model)) return;

    const rotationObserver = new IntersectionObserver(entries => {
      sync(Boolean(entries[0]?.isIntersecting));
    }, { threshold: 0.08, rootMargin: '80px 0px' });
    sync(false);
    rotationObserver.observe(model);
  };

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

    const hydrate = model => {
      const src = model.getAttribute('data-src');
      if (!src || model.getAttribute('src')) return;
      model.minimumRenderScale = 1;
      model.setAttribute('src', src);
      model.removeAttribute('data-src');
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        hydrate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '280px 0px', threshold: 0.01 });

    deferred.forEach(model => observer.observe(model));
  };

  const needsEagerRuntime = models.some(model => (
    model.getAttribute('loading') === 'eager' || isLoaderModel(model)
  ));

  deferHeavySources();

  if (needsEagerRuntime || !('IntersectionObserver' in window)) {
    loadRuntime();
    models.forEach(pauseOffscreenWork);
    return;
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    loadRuntime();
  }, { threshold: 0, rootMargin: '220px 0px' });

  models.forEach(model => {
    observer.observe(model);
    pauseOffscreenWork(model);
  });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();
