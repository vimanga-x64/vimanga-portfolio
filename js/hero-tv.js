(() => {
  const tv = document.getElementById('heroTv');
  const modelViewer = document.getElementById('heroTvModel');
  if (!tv || !modelViewer) return;

  const videoSrc = modelViewer.dataset.videoSrc;
  let video = null;
  let sourceVideo = null;
  let signalCanvas = null;
  let signalContext = null;
  let renderFrame = 0;
  let isVisible = true;
  let gazeX = 0;
  let gazeY = 0;

  // The screen mesh in old_tv.glb only uses this slice of its texture atlas, so the
  // signal has to be scaled into that rectangle or it shows up cropped and magnified.
  const SCREEN_UV = { u0: .0616317, u1: .5380306, v0: .58215666, v1: .9362226 };
  const NEAREST = 9728, LINEAR = 9729, CLAMP_TO_EDGE = 33071;
  const GRID_W = 32, GRID_H = 24, PIXEL = 16, LOOP_SECONDS = 12;
  const BLINK_TIMES = [1.25, 3.35, 6.45, 7.55, 8, 11.4];
  const EYE_SPRITE = ['.###.', '#####', '#####', '#####', '#####', '.###.'];
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const blinkPhase = time => {
    for (const start of BLINK_TIMES) {
      const offset = time - start;
      if (offset >= 0 && offset < 5 / 24) {
        return [1, 2, 2, 2, 1][Math.floor(offset * 24)];
      }
    }
    return 0;
  };

  const fillCell = (x, y, width = 1, height = 1) => {
    signalContext.fillRect(x * PIXEL, y * PIXEL, width * PIXEL, height * PIXEL);
  };

  const paintEye = (x, y, phase, pupilX, pupilY, background) => {
    if (phase === 2) {
      signalContext.fillStyle = '#080a0e';
      fillCell(x - 1, y + 3, 7, 2);
      return;
    }

    if (phase === 1) {
      signalContext.fillStyle = '#080a0e';
      fillCell(x, y + 2, 5, 3);
      return;
    }

    signalContext.fillStyle = '#080a0e';
    EYE_SPRITE.forEach((row, rowIndex) => {
      [...row].forEach((cell, columnIndex) => {
        if (cell === '#') fillCell(x + columnIndex, y + rowIndex);
      });
    });

    // Carve a light centre into the original block eye, then move a two-pixel
    // pupil within it. The one-cell steps preserve the face's pixel language.
    signalContext.fillStyle = background;
    fillCell(x + 1, y + 1, 3, 4);
    signalContext.fillStyle = '#080a0e';
    fillCell(x + 2 + pupilX, y + 2 + pupilY, 1, 2);
  };

  const sampleScreenColor = () => {
    const sample = signalContext.getImageData(15 * PIXEL, 7 * PIXEL, 8, 8).data;
    let red = 0, green = 0, blue = 0;
    for (let index = 0; index < sample.length; index += 4) {
      red += sample[index];
      green += sample[index + 1];
      blue += sample[index + 2];
    }
    const count = sample.length / 4;
    return `rgb(${Math.round(red / count)} ${Math.round(green / count)} ${Math.round(blue / count)})`;
  };

  const paintSignal = () => {
    if (!sourceVideo || !signalContext || sourceVideo.readyState < 2) return;

    signalContext.drawImage(sourceVideo, 0, 0, GRID_W * PIXEL, GRID_H * PIXEL);
    const time = sourceVideo.currentTime % LOOP_SECONDS;
    const background = sampleScreenColor();
    const swayX = Math.round(1.4 * Math.sin(2 * Math.PI * time / LOOP_SECONDS));
    const swayY = Math.round(.9 * Math.sin(4 * Math.PI * time / LOOP_SECONDS));
    const phase = blinkPhase(time);
    const winking = time >= 4.45 && time < 5.05;
    const eyeY = 5 + swayY;

    // Remove every position occupied by the loop's baked-in eye saccades.
    signalContext.fillStyle = background;
    fillCell(2, 2, 11, 12);
    fillCell(18, 2, 12, 12);

    paintEye(5 + swayX, eyeY, winking ? 2 : phase, gazeX, gazeY, background);
    paintEye(22 + swayX, eyeY, phase, gazeX, gazeY, background);

    // Restore a hint of the CRT scan pattern over the freshly drawn pixels.
    signalContext.fillStyle = 'rgba(8,10,14,.055)';
    for (let y = 2 * PIXEL; y < 14 * PIXEL; y += 3) {
      signalContext.fillRect(2 * PIXEL, y, 11 * PIXEL, 1);
      signalContext.fillRect(18 * PIXEL, y, 12 * PIXEL, 1);
    }
  };

  const renderSignal = () => {
    renderFrame = 0;
    if (!isVisible || document.hidden || !sourceVideo) return;
    paintSignal();
    renderFrame = requestAnimationFrame(renderSignal);
  };

  const updateGaze = event => {
    const bounds = tv.getBoundingClientRect();
    const centerX = bounds.left + bounds.width * .5;
    const centerY = bounds.top + bounds.height * .42;
    gazeX = Math.round(clamp((event.clientX - centerX) / (innerWidth * .3), -1, 1));
    gazeY = Math.round(clamp((event.clientY - centerY) / (innerHeight * .3), -1, 1));
  };

  const resetGaze = () => {
    gazeX = 0;
    gazeY = 0;
  };

  const playSignal = () => {
    if (!video || !isVisible || document.hidden) return;
    video.play().catch(() => {});
    sourceVideo?.play().catch(() => {});
    if (sourceVideo && !renderFrame) renderSignal();
  };

  const pauseSignal = () => {
    video?.pause();
    sourceVideo?.pause();
    cancelAnimationFrame(renderFrame);
    renderFrame = 0;
  };

  const makeSignalInteractive = async textureVideo => {
    if (!finePointer || typeof HTMLCanvasElement.prototype.captureStream !== 'function') return;

    const source = document.createElement('video');
    source.muted = true;
    source.defaultMuted = true;
    source.loop = true;
    source.playsInline = true;
    source.preload = 'auto';
    source.src = videoSrc;

    await new Promise((resolve, reject) => {
      if (source.readyState >= 2) resolve();
      else {
        source.addEventListener('loadeddata', resolve, { once: true });
        source.addEventListener('error', reject, { once: true });
      }
      source.load();
    });

    const canvas = document.createElement('canvas');
    canvas.width = GRID_W * PIXEL;
    canvas.height = GRID_H * PIXEL;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    context.imageSmoothingEnabled = false;

    sourceVideo = source;
    signalCanvas = canvas;
    signalContext = context;
    paintSignal();

    const stream = canvas.captureStream(24);
    textureVideo.pause();
    textureVideo.removeAttribute('src');
    textureVideo.srcObject = stream;

    window.addEventListener('pointermove', updateGaze, { passive: true });
    document.documentElement.addEventListener('pointerleave', resetGaze);
    modelViewer.dataset.eyeTracking = 'true';
  };

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

      // setTexture resets the texture transform, so the sampler is tuned afterwards.
      const scaleU = 1 / (SCREEN_UV.u1 - SCREEN_UV.u0);
      const scaleV = 1 / (SCREEN_UV.v1 - SCREEN_UV.v0);
      const sampler = texture.sampler;
      sampler?.setScale({ u: scaleU, v: scaleV });
      sampler?.setOffset({ u: -SCREEN_UV.u0 * scaleU, v: -SCREEN_UV.v0 * scaleV });
      sampler?.setWrapS(CLAMP_TO_EDGE);
      sampler?.setWrapT(CLAMP_TO_EDGE);
      sampler?.setMagFilter(NEAREST);
      sampler?.setMinFilter(LINEAR);

      try {
        await makeSignalInteractive(video);
      } catch (interactiveError) {
        sourceVideo?.pause();
        sourceVideo = null;
        signalCanvas = null;
        signalContext = null;
        modelViewer.dataset.eyeTracking = 'false';
        video.srcObject = null;
        video.src = videoSrc;
        video.load();
        console.warn('Unable to add pointer tracking to the CRT signal:', interactiveError);
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
    window.removeEventListener('pointermove', updateGaze);
    document.documentElement.removeEventListener('pointerleave', resetGaze);
  }, { once: true });
})();
