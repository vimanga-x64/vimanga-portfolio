(() => {
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
      filter: drop-shadow(0 7px 13px rgba(145, 91, 28, .12));
    }
    .pastel-sun svg { display: block; width: 100%; height: auto; overflow: visible; }
    .pastel-sun__body, .pastel-sun__outline, .pastel-sun__face, .pastel-sun__texture { transition: none; }
    .pastel-sun__moon { display: none; }
    html[data-theme='dark'] .pastel-sun { filter: drop-shadow(0 7px 16px rgba(169, 162, 224, .18)); }
    html[data-theme='dark'] .pastel-sun__sun { display: none; }
    html[data-theme='dark'] .pastel-sun__moon { display: block; }
    @media (max-width: 700px) {
      .pastel-sun { top: 78px !important; left: 10px !important; width: 72px !important; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  let character = document.getElementById('pastelSun');
  if (!character) {
    character = document.createElement('div');
    character.className = 'pastel-sun';
    character.id = 'pastelSun';
    character.setAttribute('aria-hidden', 'true');
  }

  character.innerHTML = `
    <svg viewBox="0 0 240 240" role="presentation">
      <defs>
        <filter id="pastelRough" x="-18%" y="-18%" width="136%" height="136%">
          <feTurbulence id="pastelNoise" type="fractalNoise" baseFrequency=".021 .068" numOctaves="3" seed="13" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.8" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <clipPath id="pastelSunClip"><path id="pastelSunClipShape"/></clipPath>
        <clipPath id="pastelMoonClip"><path id="pastelMoonClipShape"/></clipPath>
      </defs>

      <g class="pastel-sun__sun">
        <path class="pastel-sun__body" id="pastelSunShape" fill="#f3b942" filter="url(#pastelRough)"/>
        <path class="pastel-sun__outline" id="pastelSunOutline" fill="none" stroke="#dfa43b" stroke-width="2.1" opacity=".55" filter="url(#pastelRough)"/>
        <g class="pastel-sun__texture" id="pastelSunTexture" clip-path="url(#pastelSunClip)" fill="none" stroke-linecap="round" filter="url(#pastelRough)">
          <path d="M43 73c14-8 27-12 40-15M38 91c19-11 37-16 55-21M35 113c28-16 52-26 78-34M39 134c30-15 61-29 92-40M46 155c35-19 69-33 102-43M58 174c34-18 66-31 101-41M78 190c31-16 60-27 91-36M108 201c28-13 53-22 76-29M143 196c19-9 34-16 46-22" stroke="#f9d276" stroke-width="5.5" opacity=".48"/>
          <path d="M62 55c-4 13-8 24-11 37M88 43c-8 24-18 48-27 70M115 38c-14 36-27 70-38 105M143 42c-17 42-33 80-47 119M169 56c-19 44-36 84-51 120M189 82c-17 37-31 70-44 99M199 113c-11 23-20 43-28 59" stroke="#efd060" stroke-width="2.4" opacity=".34"/>
          <path d="M52 66l17-5m15-9 13-3m25 1 19 3m20 8 15 9M46 102l17-4m22-9 13-4m25-6 22 1m23 9 16 5M43 139l23-7m17-2 16-4m30-4 22 4m20 10 14 7M58 169l18-7m20 4 14-4m30 3 21 8M87 190l20-6m24 5 15 4" stroke="#fff0b3" stroke-width="2.7" opacity=".72"/>
          <path d="M58 61l3 14m35-31-2 15m48-7-5 14m43 7-10 12M42 123l16-4m-6 40 15-10m27 37 7-16m38 30-1-17m39-9-14-12m32-31-17-4" stroke="#cf9130" stroke-width="2" opacity=".48"/>
        </g>
        <g class="pastel-sun__face" id="pastelSunFace" color="#4b301d" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path data-eye-left/><path data-eye-right/><path data-nose fill="none"/><path data-mouth/><path data-mouth-detail fill="none" stroke="#f3b942"/>
        </g>
      </g>

      <g class="pastel-sun__moon">
        <path class="pastel-sun__body" id="pastelMoonShape" fill="#c6c1df" filter="url(#pastelRough)"/>
        <path class="pastel-sun__outline" id="pastelMoonOutline" fill="none" stroke="#aaa4ca" stroke-width="2.1" opacity=".58" filter="url(#pastelRough)"/>
        <g class="pastel-sun__texture" id="pastelMoonTexture" clip-path="url(#pastelMoonClip)" fill="none" stroke-linecap="round" filter="url(#pastelRough)">
          <path d="M40 78c24-17 48-26 72-31M34 103c38-21 75-37 111-44M34 130c48-26 93-43 135-51M43 156c45-23 90-39 133-47M61 180c39-20 76-32 113-39M91 198c29-14 57-23 83-28" stroke="#e1ddf0" stroke-width="5.5" opacity=".43"/>
          <path d="M67 56c18 7 22 19 12 31s-27 8-31-5M151 51c17 2 25 12 19 23s-22 14-32 6M168 139c19 3 26 14 19 26s-25 13-35 2M68 150c14 1 20 10 15 20s-20 11-28 3" stroke="#918bb7" stroke-width="3" opacity=".44"/>
          <path d="M48 92l18-5m28-32 18-3m48 37 20 3M43 129l22-6m91-6 22 5M75 184l19-6m34 11 18 4" stroke="#f0edf7" stroke-width="2.5" opacity=".72"/>
        </g>
        <g class="pastel-sun__face" id="pastelMoonFace" color="#342f4c" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path data-eye-left/><path data-eye-right/><path data-nose fill="none"/><path data-mouth/><path data-mouth-detail fill="none" stroke="#c6c1df"/>
        </g>
      </g>
    </svg>`;

  if (character.parentElement !== document.body) document.body.prepend(character);
  character.style.removeProperty('visibility');

  const shapes = [
    'M116 34C147 29 178 40 195 67C213 95 209 132 194 161C177 192 145 207 109 204C74 202 44 183 33 152C21 120 30 82 53 57C69 40 91 35 116 34Z',
    'M119 30C150 29 180 43 196 68C212 94 211 128 199 157C187 187 158 205 124 208C91 210 57 196 41 168C25 140 27 104 39 77C51 50 83 30 119 30Z',
    'M111 35C144 26 178 38 197 64C215 90 213 126 201 155C188 184 163 202 130 207C96 211 62 201 43 174C25 146 26 112 36 83C46 55 76 40 111 35Z',
    'M108 31C140 25 173 35 193 59C213 83 213 118 204 149C195 181 171 203 137 207C102 211 68 201 47 176C27 151 27 116 36 84C44 56 74 38 108 31Z',
    'M120 37C153 31 184 47 199 74C214 102 207 139 190 168C171 196 138 207 103 201C68 195 41 175 31 145C21 113 33 77 58 55C75 41 97 39 120 37Z',
    'M122 28C153 29 181 43 196 69C211 96 207 133 194 162C180 191 153 208 118 210C83 211 52 196 38 168C24 139 28 102 42 73C55 45 86 26 122 28Z'
  ];

  const faces = [
    { left: 'M82 104c1-7 8-10 12-3 2 6-2 12-7 12-5 0-7-4-5-9Z', right: 'M140 102c2-7 9-9 13-2 2 6-2 12-7 12-5 0-8-4-6-10Z', nose: 'M117 112c-1 7-5 13-2 17 3 2 8 1 10-1', mouth: 'M82 141c19 19 51 20 72-1', detail: '', open: false },
    { left: 'M84 101c2-6 8-8 11-2 2 6-1 12-6 12s-7-5-5-10Z', right: 'M143 101c2-6 8-8 11-2 2 6-1 12-6 12s-7-5-5-10Z', nose: 'M120 111c-2 8-5 13-2 17 3 3 8 1 10-1', mouth: 'M83 137c21 14 50 14 72-2-2 31-19 41-37 41-18 0-34-11-35-39Z', detail: 'M101 160c12 8 27 8 39-1', open: true },
    { left: 'M79 106c6 5 13 5 19-1', right: 'M139 104c6 5 13 5 19-1', nose: 'M118 113c-1 7-4 12-1 16 3 2 8 1 10-1', mouth: 'M86 143c18 15 45 16 65 0', detail: '', open: false },
    { left: 'M80 104c6 5 13 5 19-1', right: 'M143 99c2-7 9-9 13-2 2 6-2 12-7 12-5 0-8-4-6-10Z', nose: 'M120 111c-2 8-5 13-2 17 3 3 8 1 10-1', mouth: 'M84 138c20 15 49 15 70-2-1 29-18 39-36 39-17 0-32-11-34-37Z', detail: 'M102 159c10 7 25 7 36 0', open: true },
    { left: 'M83 105c2-7 8-9 12-2 2 6-2 12-7 12-5 0-7-4-5-10Z', right: 'M142 104c2-7 8-9 12-2 2 6-2 12-7 12-5 0-7-4-5-10Z', nose: 'M119 113c-1 7-5 13-2 17 3 2 8 1 10-1', mouth: 'M108 143c4-9 17-9 22 0 5 11 0 23-11 23-10 0-16-12-11-23Z', detail: 'M113 158c4 3 9 3 13 0', open: true },
    { left: 'M81 106c6-5 13-5 19 0', right: 'M139 106c6-5 13-5 19 0', nose: 'M119 114c-2 7-4 12-1 15 3 2 7 1 10-1', mouth: 'M84 142c20 18 49 18 70-1', detail: '', open: false }
  ];

  const textureTransforms = ['rotate(-1 120 120)', 'translate(2 -1) rotate(.7 120 120)', 'translate(-1 2) rotate(-1.4 120 120)', 'translate(1 1) rotate(.4 120 120)', 'translate(-2 -1) rotate(1.1 120 120)', 'translate(1 -2) rotate(-.5 120 120)'];
  const sunShape = document.getElementById('pastelSunShape');
  const sunOutline = document.getElementById('pastelSunOutline');
  const sunClip = document.getElementById('pastelSunClipShape');
  const moonShape = document.getElementById('pastelMoonShape');
  const moonOutline = document.getElementById('pastelMoonOutline');
  const moonClip = document.getElementById('pastelMoonClipShape');
  const noise = document.getElementById('pastelNoise');
  const textures = [document.getElementById('pastelSunTexture'), document.getElementById('pastelMoonTexture')];
  const faceGroups = [document.getElementById('pastelSunFace'), document.getElementById('pastelMoonFace')];
  let frameIndex = 0;

  const drawFace = (group, face) => {
    group.querySelector('[data-eye-left]').setAttribute('d', face.left);
    group.querySelector('[data-eye-right]').setAttribute('d', face.right);
    const nose = group.querySelector('[data-nose]');
    nose.setAttribute('d', face.nose);
    nose.setAttribute('stroke-width', '3.2');
    const mouth = group.querySelector('[data-mouth]');
    mouth.setAttribute('d', face.mouth);
    mouth.setAttribute('fill', face.open ? 'currentColor' : 'none');
    mouth.setAttribute('stroke-width', face.open ? '2.4' : '6');
    const detail = group.querySelector('[data-mouth-detail]');
    detail.setAttribute('d', face.detail || 'M0 0');
    detail.setAttribute('stroke-width', '3.2');
    detail.setAttribute('opacity', face.detail ? '1' : '0');
  };

  const drawFrame = index => {
    const shape = shapes[index];
    [sunShape, sunOutline, sunClip, moonShape, moonOutline, moonClip].forEach(node => node.setAttribute('d', shape));
    faceGroups.forEach(group => drawFace(group, faces[index]));
    textures.forEach(texture => texture.setAttribute('transform', textureTransforms[index]));
    noise.setAttribute('seed', String(13 + index * 11));
    character.dataset.frame = String(index + 1);
  };

  drawFrame(0);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => {
      frameIndex = (frameIndex + 1) % shapes.length;
      drawFrame(frameIndex);
    }, 1050);
  }
})();
