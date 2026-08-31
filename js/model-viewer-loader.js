(() => {
  'use strict';

  const models = [...document.querySelectorAll('model-viewer')];
  if (!models.length) return;

  const configureRuntime = () => {
    const ModelViewerElement = window.customElements?.get('model-viewer');
    if (!ModelViewerElement) return;
    const constrained = matchMedia('(pointer: coarse)').matches || innerWidth < 800;
    ModelViewerElement.minimumRenderScale = constrained ? 0.5 : 0.75;
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

  const pauseOffscreenRotation = model => {
    if (!model.hasAttribute('auto-rotate')) return;
    const sync = visible => {
      if (visible) model.setAttribute('auto-rotate', '');
      else model.removeAttribute('auto-rotate');
    };
    if (!('IntersectionObserver' in window)) return;
    const rotationObserver = new IntersectionObserver(entries => {
      sync(Boolean(entries[0]?.isIntersecting));
    }, { threshold: 0.12 });
    sync(false);
    rotationObserver.observe(model);
  };

  if (!('IntersectionObserver' in window)) {
    loadRuntime();
    models.forEach(pauseOffscreenRotation);
    return;
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    loadRuntime();
  }, { threshold: 0, rootMargin: '220px 0px' });

  models.forEach(model => {
    observer.observe(model);
    pauseOffscreenRotation(model);
  });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();
