(() => {
  const root = document.documentElement;
  const header = document.querySelector('.resume-nav');
  let frame = 0;

  const renderProgress = () => {
    frame = 0;
    const scrollable = Math.max(1, root.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    root.style.setProperty('--resume-scroll-progress', progress.toFixed(4));
    header?.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  const scheduleProgress = () => {
    if (!frame) frame = window.requestAnimationFrame(renderProgress);
  };

  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress, { passive: true });
  renderProgress();

})();
