(() => {
  const viewers = [...document.querySelectorAll('model-viewer.project-screen-model')];
  if (!viewers.length) return;

  const tonedScreens = new Map();

  const toneScreen = (source, rotation = 0, insetX = 0, insetY = insetX, flipY = false, saturation = .66) => {
    const cacheKey = `${source}|${rotation}|${insetX}|${insetY}|${flipY}|${saturation}`;
    if (tonedScreens.has(cacheKey)) return tonedScreens.get(cacheKey);

    const toned = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        const maxWidth = 960;
        const scale = Math.min(1, maxWidth / image.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) {
          resolve(source);
          return;
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'medium';
        context.fillStyle = '#0d0f13';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.filter = `saturate(${saturation}) contrast(.96) brightness(.97)`;
        if (flipY) {
          context.translate(0, canvas.height);
          context.scale(1, -1);
        } else if (rotation === 180) {
          context.translate(canvas.width, canvas.height);
          context.rotate(Math.PI);
        }
        const paddingX = canvas.width * insetX;
        const paddingY = canvas.height * insetY;
        context.drawImage(image, paddingX, paddingY, canvas.width - paddingX * 2, canvas.height - paddingY * 2);
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.filter = 'none';
        context.fillStyle = 'rgba(12, 17, 23, .02)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        try {
          canvas.toBlob(blob => {
            resolve(blob ? URL.createObjectURL(blob) : source);
          }, 'image/webp', .86);
        } catch (_) {
          resolve(source);
        }
      };
      image.onerror = reject;
      image.src = source;
    }).catch(() => source);

    tonedScreens.set(cacheKey, toned);
    return toned;
  };

  const screenMaterial = (model, preferredName) => {
    const materials = model?.materials || [];
    const preferred = preferredName
      ? materials.find(material => (material.name || '').toLowerCase() === preferredName.toLowerCase())
      : null;
    const byName = materials.find(material => /screen|display|monitor|emission|emissive|wallpaper/i.test(material.name || ''));
    return preferred || byName || materials.find(material => material.emissiveTexture?.texture) || null;
  };

  const applyProjectScreen = async viewer => {
    if (viewer.dataset.screenApplied === 'true') return;
    const screenSrc = viewer.dataset.projectScreen;
    const material = screenMaterial(viewer.model, viewer.dataset.screenMaterial);
    const device = viewer.closest('.project-device--model');

    device?.classList.add('is-model-loaded');
    if (!screenSrc || !material) {
      device?.classList.add('is-screen-ready');
      return;
    }

    try {
      const rotation = Number.parseInt(viewer.dataset.screenRotation || '0', 10);
      const clampInset = value => Math.min(.3, Math.max(0, Number.isFinite(value) ? value : 0));
      const fallbackInset = Number.parseFloat(viewer.dataset.screenInset || '0');
      const insetX = clampInset(Number.parseFloat(viewer.dataset.screenInsetX || `${fallbackInset}`));
      const insetY = clampInset(Number.parseFloat(viewer.dataset.screenInsetY || `${fallbackInset}`));
      const flipY = viewer.dataset.screenFlipY === 'true';
      const requestedSaturation = Number.parseFloat(viewer.dataset.screenSaturation || '.66');
      const saturation = Math.min(1, Math.max(.2, Number.isFinite(requestedSaturation) ? requestedSaturation : .66));
      const tonedScreenSrc = await toneScreen(screenSrc, rotation, insetX, insetY, flipY, saturation);
      const texture = await viewer.createTexture(tonedScreenSrc);
      const pbr = material.pbrMetallicRoughness;

      if (pbr) {
        pbr.setBaseColorFactor([.86, .86, .86, 1]);
        pbr.setMetallicFactor(0);
        pbr.setRoughnessFactor(1);
        pbr.baseColorTexture?.setTexture(texture);
      }
      material.emissiveTexture?.setTexture(texture);
      const requestedGlow = Number.parseFloat(viewer.dataset.screenGlow || '.3');
      const glow = Math.min(1, Math.max(0, Number.isFinite(requestedGlow) ? requestedGlow : .3));
      material.setEmissiveFactor?.([glow, glow, glow]);

      // keycaps and other palette-textured parts ship with a glossy metal/rough map that smears
      // highlights across the keyboard; make them matte so the keys read cleanly
      if (viewer.dataset.matteKeys !== 'false') {
        (viewer.model?.materials || []).forEach(other => {
          if (other === material || !/^PaletteMaterial/i.test(other.name || '')) return;
          const otherPbr = other.pbrMetallicRoughness;
          if (!otherPbr) return;
          otherPbr.metallicRoughnessTexture?.setTexture(null);
          otherPbr.setMetallicFactor(0);
          otherPbr.setRoughnessFactor(.92);
        });
      }

      viewer.dataset.screenApplied = 'true';
      device?.classList.add('is-screen-ready');
    } catch (error) {
      console.warn('Project laptop screen texture could not be applied.', error);
      device?.classList.add('is-screen-ready');
    }
  };

  const bindViewer = viewer => {
    viewer.addEventListener('load', () => applyProjectScreen(viewer), { once: true });
    if (viewer.loaded && viewer.model) applyProjectScreen(viewer);
  };

  customElements.whenDefined('model-viewer').then(() => viewers.forEach(bindViewer));
})();
