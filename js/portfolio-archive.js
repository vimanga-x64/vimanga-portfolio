(() => {
  'use strict';

  const trigger = document.getElementById('archiveCallbox');
  const dialog = document.getElementById('portfolioArchive');
  const closeButton = dialog?.querySelector('[data-archive-close]');
  if (!trigger || !dialog || !closeButton) return;

  let closeTimer = 0;

  const finishClose = () => {
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };

  const closeArchive = () => {
    window.clearTimeout(closeTimer);
    dialog.classList.remove('is-visible');
    closeTimer = window.setTimeout(finishClose, 280);
  };

  const openArchive = () => {
    window.clearTimeout(closeTimer);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    trigger.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('archive-open');
    requestAnimationFrame(() => {
      dialog.classList.add('is-visible');
      closeButton.focus({ preventScroll: true });
    });
  };

  const resetArchive = () => {
    window.clearTimeout(closeTimer);
    dialog.classList.remove('is-visible');
    trigger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('archive-open');
    trigger.focus({ preventScroll: true });
  };

  trigger.addEventListener('click', openArchive);
  closeButton.addEventListener('click', closeArchive);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeArchive();
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeArchive();
  });
  dialog.addEventListener('close', resetArchive);
})();
