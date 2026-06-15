/**
 * PenPal4ever — home.js
 *
 * Handles:
 *  - NEW PENPAL modal (create session → redirect to /session/:id)
 *  - CONTINUE PENPAL modal (lookup by email or session ID → redirect)
 *  - Smooth scroll to #about
 */

(function () {

  // ─── Modal helpers ────────────────────────────────────────

  function openModal(backdrop) {
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Focus first input
    const first = backdrop.querySelector('input');
    if (first) setTimeout(() => first.focus(), 60);
  }

  function closeModal(backdrop) {
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function showMsg(el, text, isError = false) {
    el.textContent = text;
    el.classList.toggle('is-error', isError);
    el.classList.add('is-visible');
  }

  function hideMsg(el) {
    el.classList.remove('is-visible', 'is-error');
    el.textContent = '';
  }

  // Close on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.is-open').forEach(closeModal);
    }
  });

  // ─── NEW PENPAL ───────────────────────────────────────────

  const backdropNew   = document.getElementById('modal-new');
  const formNew       = document.getElementById('form-new-penpal');
  const msgNew        = document.getElementById('modal-new-msg');
  const limitCheck    = document.getElementById('limit-themes');
  const limitWrap     = document.getElementById('limit-count-wrap');

  document.getElementById('btn-new-penpal').addEventListener('click', () => {
    formNew.reset();
    hideMsg(msgNew);
    formNew.querySelectorAll('.has-error').forEach(g => g.classList.remove('has-error'));
    limitWrap.classList.remove('is-visible');
    openModal(backdropNew);
  });

  document.getElementById('modal-new-close').addEventListener('click',  () => closeModal(backdropNew));
  document.getElementById('modal-new-cancel').addEventListener('click', () => closeModal(backdropNew));

  // Toggle limit field
  limitCheck.addEventListener('change', () => {
    limitWrap.classList.toggle('is-visible', limitCheck.checked);
  });

  // Validation helpers
  function validateGroup(input) {
    const group = input.closest('.form-group');
    const ok = input.type === 'email'
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
      : input.value.trim().length > 0;
    group.classList.toggle('has-error', !ok);
    return ok;
  }

  // Submit new session
  document.getElementById('modal-new-submit').addEventListener('click', async () => {
    hideMsg(msgNew);

    // Validate all required inputs
    const inputs = formNew.querySelectorAll('input[required]');
    let valid = true;
    inputs.forEach(inp => { if (!validateGroup(inp)) valid = false; });
    if (!valid) return;

    const data = {
      yourFirstName:   formNew.yourFirstName.value.trim(),
      yourLastName:    formNew.yourLastName.value.trim(),
      yourEmail:       formNew.yourEmail.value.trim(),
      penpalFirstName: formNew.penpalFirstName.value.trim(),
      penpalLastName:  formNew.penpalLastName.value.trim(),
      penpalEmail:     formNew.penpalEmail.value.trim(),
      limitThemes:     limitCheck.checked,
      maxThemes:       limitCheck.checked ? parseInt(formNew.maxThemes?.value || '0', 10) : null,
    };

    const submitBtn = document.getElementById('modal-new-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating…';

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Server error');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      showMsg(msgNew, 'Something went wrong. Please try again.', true);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Start Correspondence';
    }
  });

  // Inline validation on blur
  formNew.querySelectorAll('input[required]').forEach(inp => {
    inp.addEventListener('blur', () => validateGroup(inp));
  });

  // ─── CONTINUE PENPAL ──────────────────────────────────────

  const backdropContinue = document.getElementById('modal-continue');
  const formContinue     = document.getElementById('form-continue');
  const msgContinue      = document.getElementById('modal-continue-msg');
  const lookupInput      = document.getElementById('continue-lookup');

  document.getElementById('btn-continue-penpal').addEventListener('click', () => {
    formContinue.reset();
    hideMsg(msgContinue);
    formContinue.querySelectorAll('.has-error').forEach(g => g.classList.remove('has-error'));
    openModal(backdropContinue);
  });

  document.getElementById('modal-continue-close').addEventListener('click',  () => closeModal(backdropContinue));
  document.getElementById('modal-continue-cancel').addEventListener('click', () => closeModal(backdropContinue));

  document.getElementById('modal-continue-submit').addEventListener('click', async () => {
    hideMsg(msgContinue);

    const raw = lookupInput.value.trim();
    if (!raw) {
      lookupInput.closest('.form-group').classList.add('has-error');
      return;
    }
    lookupInput.closest('.form-group').classList.remove('has-error');

    const submitBtn = document.getElementById('modal-continue-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Looking up…';

    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
      let res;

      if (isEmail) {
        res = await fetch(`/api/sessions/lookup/email?email=${encodeURIComponent(raw)}`);
      } else {
        res = await fetch(`/api/sessions/${encodeURIComponent(raw)}`);
      }

      if (res.status === 404) {
        showMsg(msgContinue, 'No session found. Check your email or session ID and try again.', true);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continue';
        return;
      }

      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      const sessionId = isEmail ? data.id : data.session?.id || raw;
      window.location.href = `/session/${sessionId}`;
    } catch (err) {
      showMsg(msgContinue, 'Something went wrong. Please try again.', true);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue';
    }
  });

  // Allow Enter to submit in continue form
  lookupInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('modal-continue-submit').click();
  });

  // ─── About scroll ─────────────────────────────────────────

  document.querySelector('.home-about-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  });

})();
