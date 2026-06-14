/**
 * PenPal4ever — modal.js
 *
 * Handles the "NEW PENPAL" modal on the home page.
 * On submit, stores the penpal session in sessionStorage
 * and redirects to theme.html?id=1
 */

(function () {

  const overlay    = document.getElementById('modal-overlay');
  const closeBtn   = document.getElementById('modal-close');
  const form       = document.getElementById('penpal-form');
  const inputYou   = document.getElementById('input-your-name');
  const inputThem  = document.getElementById('input-penpal-name');
  const btnNewPenpal = document.querySelector('.btn--primary');

  if (!overlay || !btnNewPenpal) return;

  // ─── Open / close ────────────────────────────────────────

  function openModal() {
    overlay.classList.add('is-open');
    inputYou.focus();
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    form.reset();
  }

  btnNewPenpal.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ─── Submit ──────────────────────────────────────────────

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const yourName   = inputYou.value.trim();
    const penpalName = inputThem.value.trim();

    if (!yourName || !penpalName) return;

    // Persist names for use on the theme page
    sessionStorage.setItem('pp_your_name',   yourName);
    sessionStorage.setItem('pp_penpal_name', penpalName);

    // Go to the first theme
    window.location.href = './theme.html?id=1';
  });

})();
