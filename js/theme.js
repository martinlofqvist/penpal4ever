/**
 * PenPal4ever — theme.js
 *
 * Handles:
 *  1. NEW THEME intro animation (2s hold → fly to top)
 *  2. CURRENT THEME barn-door reveal
 *  3. Left/right arrow navigation between themes
 *  4. Next button disabled until both sides have uploaded
 */

(function () {

  // ─── State ───────────────────────────────────────────────

  let themes    = [];
  let themeIndex = 0;

  // ─── DOM refs ────────────────────────────────────────────

  const intro      = document.getElementById('intro');
  const introBlock = document.getElementById('intro-block');
  const introTitle = document.getElementById('intro-title');

  const ctLayout   = document.getElementById('ct-layout');
  const ctTitle    = document.getElementById('ct-title');
  const labelWord1 = document.getElementById('label-word-1');

  const barnWrap   = document.getElementById('barn-wrap');
  const doorLeft   = document.getElementById('door-left');
  const doorRight  = document.getElementById('door-right');

  const nameLeft   = document.getElementById('name-left');
  const nameRight  = document.getElementById('name-right');

  const unseenLeft  = document.getElementById('unseen-left');
  const unseenRight = document.getElementById('unseen-right');
  const imageLeft   = document.getElementById('image-left');
  const imageRight  = document.getElementById('image-right');
  const captionLeft  = document.getElementById('caption-left');
  const captionRight = document.getElementById('caption-right');

  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  // ─── Helpers ─────────────────────────────────────────────

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /**
   * Ordinal word for the theme position (1st, 2nd, 3rd…)
   * Used in the label: "THE FIRST THEME IS"
   */
  function ordinalLabel(n) {
    const labels = ['FIRST','SECOND','THIRD','FOURTH','FIFTH',
                    'SIXTH','SEVENTH','EIGHTH','NINTH','TENTH'];
    return labels[n] || `#${n + 1}`;
  }

  // ─── Load themes ─────────────────────────────────────────

  async function loadThemes() {
    try {
      const res = await fetch('./data/themes.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.themes;
    } catch (err) {
      console.error('Could not load themes.json:', err);
      return [];
    }
  }

  // ─── Render theme content ─────────────────────────────────

  function renderTheme(theme, index) {
    const ord = ordinalLabel(index);

    // Intro text
    introTitle.textContent = `"${theme.title}"`;

    // CT header
    ctTitle.textContent    = `"${theme.title}"`;
    labelWord1.textContent = `THE ${ord}`;

    // Names (static for now, wired to penpal data later)
    nameLeft.textContent  = theme.left?.name  || 'DANIEL';
    nameRight.textContent = theme.right?.name || 'MARTIN';

    // Left side
    if (theme.left?.image) {
      imageLeft.src = theme.left.image;
      imageLeft.alt = theme.left.caption || '';
      imageLeft.hidden = false;
      unseenLeft.hidden = true;
      captionLeft.textContent = theme.left.caption || '';
    } else {
      imageLeft.hidden = true;
      unseenLeft.hidden = false;
      captionLeft.textContent = '';
    }

    // Right side
    if (theme.right?.image) {
      imageRight.src = theme.right.image;
      imageRight.alt = theme.right.caption || '';
      imageRight.hidden = false;
      unseenRight.hidden = true;
      captionRight.textContent = theme.right.caption || '';
    } else {
      imageRight.hidden = true;
      unseenRight.hidden = false;
      captionRight.textContent = '';
    }

    // Navigation button states
    btnPrev.disabled = (index === 0);

    const bothUploaded = !!(theme.left?.image && theme.right?.image);
    const hasNext      = index < themes.length - 1;
    btnNext.disabled   = !(bothUploaded && hasNext);
  }

  // ─── Navigation ──────────────────────────────────────────

  function navigateTo(newIndex) {
    if (newIndex < 0 || newIndex >= themes.length) return;
    themeIndex = newIndex;

    // Reset barn doors
    doorLeft.classList.remove('is-open');
    doorRight.classList.remove('is-open');
    doorLeft.style.transform  = 'rotateY(-90deg)';
    doorRight.style.transform = 'rotateY(90deg)';

    renderTheme(themes[themeIndex], themeIndex);

    // Re-open doors after a tick
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        doorLeft.style.transform  = '';
        doorRight.style.transform = '';
        doorLeft.classList.add('is-open');
        doorRight.classList.add('is-open');
      });
    });
  }

  btnPrev.addEventListener('click', () => navigateTo(themeIndex - 1));
  btnNext.addEventListener('click', () => navigateTo(themeIndex + 1));

  // ─── Intro sequence ───────────────────────────────────────

  async function runIntroSequence() {

    // Hold for 2s so user reads the NEW THEME text
    await sleep(2000);

    // Calculate how far up the intro block needs to fly
    // so it lands at the CT header position
    const blockRect  = introBlock.getBoundingClientRect();
    const headerRect = ctLayout.querySelector('.ct-header__text').getBoundingClientRect();
    const delta      = headerRect.top - blockRect.top;
    introBlock.style.setProperty('--intro-fly-offset', `translateY(${delta}px)`);

    // Fly text upward
    introBlock.classList.add('is-flying');
    await sleep(380);

    // Fade the white overlay away; reveal CT layout
    intro.classList.add('is-gone');
    ctLayout.classList.add('is-visible');
    await sleep(180);

    // Remove intro entirely
    intro.classList.add('is-done');

    // Barn doors open
    doorLeft.classList.add('is-open');
    doorRight.classList.add('is-open');
  }

  // ─── Init ─────────────────────────────────────────────────

  async function init() {
    themes = await loadThemes();
    if (!themes.length) return;

    // Read ?id=N from URL (1-based), default to 1
    const params = new URLSearchParams(window.location.search);
    const id     = parseInt(params.get('id') || '1', 10);
    themeIndex   = Math.max(0, Math.min(id - 1, themes.length - 1));

    renderTheme(themes[themeIndex], themeIndex);
    runIntroSequence();
  }

  init();

})();
