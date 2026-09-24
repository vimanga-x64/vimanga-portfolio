(() => {
  const isResume = window.location.pathname.replace(/\\/g, '/').includes('/resume');
  const sunSrc = isResume ? '../images/hero-sun-gif.webp' : 'images/hero-sun-gif.webp';
  const moonSrc = isResume ? '../images/hero-moon-gif.webp' : 'images/hero-moon-gif.webp';

  const style = document.createElement('style');
  style.id = 'pastelSunGlobalStyles';
  style.textContent = `
    .pastel-sun {
      position: fixed !important;
      z-index: 89 !important;
      top: 86px !important;
      left: 18px !important;
      width: clamp(90px, 7.2vw, 116px) !important;
      pointer-events: none !important;
      filter: drop-shadow(0 7px 16px rgba(245, 178, 35, .22));
      transition: filter .3s ease;
    }
    .pastel-sun img,
    .pastel-sun__img {
      display: block;
      width: 100%;
      height: auto;
      user-select: none;
      -webkit-user-drag: none;
    }
    .pastel-sun__img--moon {
      display: none !important;
    }
    html[data-theme='dark'] .pastel-sun {
      filter: drop-shadow(0 8px 22px rgba(186, 178, 235, .32));
    }
    html[data-theme='dark'] .pastel-sun__img--sun {
      display: none !important;
    }
    html[data-theme='dark'] .pastel-sun__img--moon {
      display: block !important;
    }
    @media (max-width: 700px) {
      .pastel-sun {
        top: 78px !important;
        left: 10px !important;
        width: 72px !important;
      }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  let character = document.getElementById('pastelSun');
  if (!character) {
    character = document.createElement('div');
    character.className = 'pastel-sun';
    character.id = 'pastelSun';
    character.setAttribute('aria-hidden', 'true');
    document.body.prepend(character);
  }

  // Ensure both sun and moon images are present
  const sunImg = character.querySelector('.pastel-sun__img--sun');
  const moonImg = character.querySelector('.pastel-sun__img--moon');

  if (!sunImg || !moonImg) {
    character.innerHTML = `
      <img class="pastel-sun__img pastel-sun__img--sun" src="${sunSrc}" alt="Animated crayon sun smiling and bouncing" width="118" height="118" decoding="async">
      <img class="pastel-sun__img pastel-sun__img--moon" src="${moonSrc}" alt="Animated crayon moon smiling and bouncing" width="118" height="118" decoding="async">
    `;
  }
})();
