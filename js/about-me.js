(() => {
  const collage = document.getElementById('aboutCollage');
  if (!collage) return;

  const allowTilt = matchMedia('(hover: hover) and (pointer: fine)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (allowTilt) {
    collage.querySelectorAll('[data-about-tilt]').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.setProperty('--rx', `${(-y * 3.5).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * 4.5).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  const story = document.getElementById('aboutStory');
  const storyText = document.getElementById('aboutStoryText');
  if (!story || !storyText) return;

  const fullStory = storyText.textContent.trim().replace(/\s+/g, ' ');
  const storyWords = fullStory.split(' ');
  storyText.setAttribute('aria-label', fullStory);
  storyText.textContent = '';

  storyWords.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'about-word';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word;
    storyText.append(span);
    if (index < storyWords.length - 1) storyText.append(' ');
  });

  const words = [...storyText.querySelectorAll('.about-word')];
  let scrollFrame = 0;
  const updateStory = () => {
    scrollFrame = 0;
    const rect = story.getBoundingClientRect();
    const start = innerHeight * .82;
    const end = innerHeight * .18;
    const revealDistance = Math.max(1, start - end);
    const progress = Math.max(0, Math.min(1, (start - rect.top) / revealDistance));
    const cursor = progress * (words.length + 5);

    words.forEach((word, index) => {
      const opacity = Math.max(.09, Math.min(1, (cursor - index + 1.6) / 2.6));
      word.style.setProperty('--word-opacity', opacity.toFixed(3));
    });
  };

  const requestStoryUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(updateStory);
  };

  addEventListener('scroll', requestStoryUpdate, { passive: true });
  addEventListener('resize', requestStoryUpdate, { passive: true });
  updateStory();
})();
