(() => {
  'use strict';

  const monitor = document.querySelector('.footer-monitor');
  const portfolioAge = monitor?.querySelector('[data-monitor-age]');
  const localTime = monitor?.querySelector('[data-monitor-time]');
  const state = monitor?.querySelector('[data-monitor-state]');
  const deploy = monitor?.querySelector('[data-monitor-deploy]');
  const matcha = monitor?.querySelector('[data-monitor-matcha]');
  if (!monitor || !portfolioAge || !localTime || !state || !deploy || !matcha) return;

  const launchedAt = new Date(monitor.dataset.launched);
  const pad = (value) => String(value).padStart(2, '0');
  const clock = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });

  const deployedAt = new Date(monitor.dataset.lastUpdated || document.lastModified);
  const torontoDay = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const dayIndex = (date) => {
    const parts = Object.fromEntries(
      torontoDay.formatToParts(date)
        .filter(({ type }) => type !== 'literal')
        .map(({ type, value }) => [type, Number(value)])
    );
    return Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000;
  };
  const deployAge = Number.isNaN(deployedAt.getTime())
    ? null
    : Math.max(0, dayIndex(new Date()) - dayIndex(deployedAt));
  const matchaBase = Number(monitor.dataset.matchaBase) || 847;
  const matchaStartedAt = new Date(monitor.dataset.matchaStart);
  deploy.textContent = deployAge === null
    ? 'UNKNOWN'
    : deployAge === 0
      ? 'TODAY'
      : deployAge === 1
        ? '1 DAY AGO'
        : `${deployAge} DAYS AGO`;

  const getState = (hour) => {
    if (hour < 6) return 'PROBABLY ASLEEP';
    if (hour < 9) return 'BOOTING UP';
    if (hour < 12) return 'CAFFEINATED';
    if (hour < 18) return 'BUILDING THINGS';
    if (hour < 22) return 'STILL SHIPPING';
    return 'PROBABLY ASLEEP';
  };

  const render = () => {
    const totalSeconds = Number.isNaN(launchedAt.getTime())
      ? 0
      : Math.max(0, Math.floor((Date.now() - launchedAt.getTime()) / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = totalSeconds % 60;
    portfolioAge.textContent = `${String(days).padStart(3, '0')}D ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    const now = new Date();
    localTime.textContent = clock.format(now).replace(',', '');
    const matchaDays = Number.isNaN(matchaStartedAt.getTime())
      ? 0
      : Math.max(0, dayIndex(now) - dayIndex(matchaStartedAt));
    matcha.textContent = String(matchaBase + matchaDays);
    const windsorHour = Number(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      hour: '2-digit',
      hour12: false
    }).format(now));
    state.textContent = getState(windsorHour);
  };

  render();
  window.setInterval(render, 1000);
})();
