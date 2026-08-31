(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const status = form.querySelector('[data-contact-status]');
  const submit = form.querySelector('[data-contact-submit]');
  const submitLabel = form.querySelector('[data-contact-submit-label]');
  const endpoint = form.action;

  const setSubmitLabel = text => {
    const defaultLabel = submitLabel?.querySelector('[data-contact-submit-label-default]');
    if (defaultLabel) defaultLabel.textContent = text;
    else if (submitLabel) submitLabel.textContent = text;
  };

  const setStatus = (message, state = '') => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    form.classList.remove('has-error', 'is-sent');
    form.classList.add('is-sending');
    submit.disabled = true;
    setSubmitLabel('Sending…');
    setStatus('Sending your message…');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Formspree returned ${response.status}`);

      form.reset();
      form.classList.remove('is-sending');
      form.classList.add('is-sent');
      setSubmitLabel('Message sent');
      submit.querySelector('b').textContent = '✓';
      setStatus('Thanks — I’ll get back to you soon.', 'success');

      setTimeout(() => {
        form.classList.remove('is-sent');
        submit.disabled = false;
        setSubmitLabel('Send message');
        submit.querySelector('b').textContent = '↗';
      }, 3200);
    } catch (error) {
      console.error('Contact form submission failed:', error);
      form.classList.remove('is-sending');
      form.classList.add('has-error');
      submit.disabled = false;
      setSubmitLabel('Try again');
      setStatus('Something went wrong. Please email me directly.', 'error');
    }
  });
})();
