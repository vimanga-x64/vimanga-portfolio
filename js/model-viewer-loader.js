(() => {
  'use strict';

  const models = [...document.querySelectorAll('model-viewer')];
  if (!models.length) return;

  let runtimeRequested = false;
  const lockFullResolution = () => {
    const ModelViewerElement = window.customElements?.get('model-viewer');
    if (ModelViewerElement) ModelViewerElement.minimumRenderScale = 1;
  };

  const loadRuntime = () => {
    if (window.customElements?.get('model-viewer')) {
      lockFullResolution();
      return;
    }
    if (runtimeRequested) return;
    runtimeRequested = true;

    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
    script.dataset.modelViewerRuntime = 'true';
    script.addEventListener('load', () => {
      window.customElements.whenDefined('model-viewer').then(lockFullResolution);
    }, { once: true });
    document.head.appendChild(script);
  };

  if (!('IntersectionObserver' in window)) {
    loadRuntime();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    loadRuntime();
  }, { threshold: 0, rootMargin: '700px 0px' });

  models.forEach((model) => observer.observe(model));
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();
