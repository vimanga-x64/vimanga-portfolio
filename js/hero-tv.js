(() => {
  const tv = document.getElementById('heroTv');
  const modelViewer = document.getElementById('heroTvModel');
  if (!tv || !modelViewer) return;

  const videoSrc = modelViewer.dataset.videoSrc;
  let video = null;
  let isVisible = true;

  const playSignal = () => {
    if (!video || !isVisible || document.hidden) return;
    video.play().catch(() => {});
  };

  const pauseSignal = () => video?.pause();

  const observer = new IntersectionObserver(entries => {
    isVisible = entries[0]?.isIntersecting ?? false;
    if (isVisible) playSignal();
    else pauseSignal();
  }, { threshold: .05, rootMargin: '120px 0px' });
  observer.observe(tv);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseSignal();
    else playSignal();
  });

  modelViewer.addEventListener('load', async () => {
    const model = modelViewer.model;
    if (!model) return;

    const screenMaterial = model.materials.find(material => material.name.toLowerCase() === 'phong2')
      || model.materials.find(material => /screen|display|monitor|glass|emissi/.test(material.name.toLowerCase()));

    if (!screenMaterial || !videoSrc || typeof modelViewer.createVideoTexture !== 'function') {
      modelViewer.classList.add('is-ready');
      return;
    }

    try {
      const texture = modelViewer.createVideoTexture(videoSrc);
      video = texture?.source?.element || null;
      if (!video) throw new Error('The TV signal could not be initialized.');

      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');

      const pbr = screenMaterial.pbrMetallicRoughness;
      pbr?.setBaseColorFactor([.025, .035, .04, 1]);
      pbr?.setMetallicFactor(0);
      pbr?.setRoughnessFactor(1);
      screenMaterial.emissiveTexture?.setTexture(texture);
      screenMaterial.setEmissiveFactor?.([1, 1, 1]);

      const threeTexture = texture.source?.texture;
      if (threeTexture) {
        threeTexture.generateMipmaps = false;
        threeTexture.minFilter = 1006;
        threeTexture.magFilter = 1006;
        threeTexture.needsUpdate = true;
      }

      playSignal();
    } catch (error) {
      console.warn('Unable to tune the CRT signal:', error);
    } finally {
      modelViewer.classList.add('is-ready');
    }
  }, { once: true });

  window.addEventListener('pagehide', () => {
    observer.disconnect();
    pauseSignal();
  }, { once: true });
})();
