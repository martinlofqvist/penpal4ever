/**
 * PenPal4ever — theme.js
 *
 * Handles:
 *  1. NEW THEME intro animation (2s hold → fly to top)
 *  2. CURRENT THEME barn-door reveal
 *  3. Left/right arrow navigation between themes
 *     with close → flash → open animation
 *
 * DEBUG: next button enabled whenever a next theme exists,
 *        regardless of upload status.
 */

(function () {

  const DEBUG = true; // set false in production to enforce upload requirement

  // ─── Timing (ms) ────────────────────────────────────────

  const INTRO_HOLD_MS  = 2000;
  const INTRO_FLY_MS   = 380;
  const BARN_OPEN_MS   = 1300;
  const BARN_CLOSE_MS  = 1300;
  const FLASH_HOLD_MS  = 600;
  const FLASH_FADE_MS  = 200;

  // ─── State ───────────────────────────────────────────────

  let themes      = [];
  let themeIndex  = 0;
  let isAnimating = false;

  // ─── DOM refs ────────────────────────────────────────────

  const intro       = document.getElementById('intro');
  const introBlock  = document.getElementById('intro-block');
  const introTitle  = document.getElementById('intro-title');
  const introLabel  = intro.querySelector('.theme-label');

  const ctLayout      = document.getElementById('ct-layout');
  const ctTitle       = document.getElementById('ct-title');
  const labelOrdinal  = document.getElementById('label-ordinal');

  const barnWrap    = document.getElementById('barn-wrap');
  const doorLeft    = document.getElementById('door-left');
  const doorRight   = document.getElementById('door-right');

  const nameLeft    = document.getElementById('name-left');
  const nameRight   = document.getElementById('name-right');

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

  // ─── Update nav button states ─────────────────────────────

  function updateNavButtons() {
    btnPrev.disabled = (themeIndex === 0);

    const hasNext      = themeIndex < themes.length - 1;
    const bothUploaded = !!(themes[themeIndex]?.left?.image && themes[themeIndex]?.right?.image);
    btnNext.disabled   = !(hasNext && (DEBUG || bothUploaded));
  }

  // ─── Render theme content ─────────────────────────────────

  function renderTheme(theme, index) {
    const ord = ordinalLabel(index);

    // Intro overlay text
    introTitle.textContent = `"${theme.title}"`;
    if (introLabel) {
      const spans = introLabel.querySelectorAll('span');
      if (spans[0]) spans[0].textContent = `THE ${ord}`;
    }

    // CT header text
    ctTitle.textContent      = `"${theme.title}"`;
    labelOrdinal.textContent = ord;

    // Names
    nameLeft.textContent  = theme.left?.name  || 'DANIEL';
    nameRight.textContent = theme.right?.name || 'MARTIN';

    // Left side
    if (theme.left?.image) {
      imageLeft.src     = theme.left.image;
      imageLeft.alt     = theme.left.caption || '';
      imageLeft.hidden  = false;
      unseenLeft.hidden = true;
      captionLeft.textContent = theme.left.caption || '';
    } else {
      imageLeft.hidden  = true;
      unseenLeft.hidden = false;
      captionLeft.textContent = '';
    }

    // Right side
    if (theme.right?.image) {
      imageRight.src     = theme.right.image;
      imageRight.alt     = theme.right.caption || '';
      imageRight.hidden  = false;
      unseenRight.hidden = true;
      captionRight.textContent = theme.right.caption || '';
    } else {
      imageRight.hidden  = true;
      unseenRight.hidden = false;
      captionRight.textContent = '';
    }

    updateNavButtons();
  }

  // ─── Header fade (between themes) ────────────────────────
  // Only fade the ordinal + title — THE / THEME / IS stay visible throughout

  function fadeHeaderOut() {
    const t = `opacity ${FLASH_FADE_MS}ms ease`;
    labelOrdinal.style.transition = t;
    labelOrdinal.style.opacity    = '0';
    ctTitle.style.transition      = t;
    ctTitle.style.opacity         = '0';
  }

  function fadeHeaderIn() {
    const t = `opacity ${FLASH_FADE_MS}ms ease`;
    labelOrdinal.style.transition = t;
    labelOrdinal.style.opacity    = '1';
    ctTitle.style.transition      = t;
    ctTitle.style.opacity         = '1';
  }

  // ─── Barn door helpers ────────────────────────────────────

  function closeDoors() {
    doorLeft.classList.remove('is-open');
    doorRight.classList.remove('is-open');
    doorLeft.classList.add('is-closing');
    doorRight.classList.add('is-closing');
  }

  function resetDoorsToClose() {
    doorLeft.classList.remove('is-closing', 'is-open');
    doorRight.classList.remove('is-closing', 'is-open');
    // Force the element back to the closed transform without animation
    doorLeft.style.animation  = 'none';
    doorRight.style.animation = 'none';
    doorLeft.style.transform  = 'rotateY(-90deg)';
    doorRight.style.transform = 'rotateY(90deg)';
    // Trigger reflow so the next animation starts from scratch
    void doorLeft.offsetWidth;
    doorLeft.style.animation  = '';
    doorRight.style.animation = '';
    doorLeft.style.transform  = '';
    doorRight.style.transform = '';
  }

  function openDoors() {
    doorLeft.classList.add('is-open');
    doorRight.classList.add('is-open');
  }

  // ─── Navigation ──────────────────────────────────────────

  async function navigateTo(newIndex) {
    if (newIndex < 0 || newIndex >= themes.length) return;
    if (isAnimating) return;
    isAnimating = true;

    // Lock nav buttons during transition
    btnPrev.disabled = true;
    btnNext.disabled = true;

    // 1. Close doors + fade header text out simultaneously
    fadeHeaderOut();
    closeDoors();
    await sleep(BARN_CLOSE_MS);

    // 2. Update content while doors are closed
    themeIndex = newIndex;
    renderTheme(themes[themeIndex], themeIndex);
    resetDoorsToClose();

    // 3. Open doors + fade header text in simultaneously
    fadeHeaderIn();
    openDoors();
    await sleep(BARN_OPEN_MS);

    isAnimating = false;
    updateNavButtons();
  }

  btnPrev.addEventListener('click', () => navigateTo(themeIndex - 1));
  btnNext.addEventListener('click', () => navigateTo(themeIndex + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  navigateTo(themeIndex - 1);
    if (e.key === 'ArrowRight') navigateTo(themeIndex + 1);
  });

  // ─── Initial intro sequence ───────────────────────────────

  async function runIntroSequence() {
    await sleep(INTRO_HOLD_MS);

    // FLIP: measure delta between intro block and ct header text
    const blockRect  = introBlock.getBoundingClientRect();
    const headerText = ctLayout.querySelector('.ct-header__text');
    const headerRect = headerText.getBoundingClientRect();
    const delta      = headerRect.top - blockRect.top;
    introBlock.style.setProperty('--intro-fly-offset', `translateY(${delta}px)`);

    introBlock.classList.add('is-flying');
    await sleep(INTRO_FLY_MS);

    intro.classList.add('is-gone');
    ctLayout.classList.add('is-visible');
    await sleep(FLASH_FADE_MS);

    intro.classList.add('is-done');
    openDoors();
  }

  // ─── Init ─────────────────────────────────────────────────

  // ─── Fisher-Yates shuffle ────────────────────────────────

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function init() {
    const raw = await loadThemes();
    if (!raw.length) return;

    // Shuffle themes into a random order each session
    themes = shuffle(raw);

    themeIndex = 0;
    renderTheme(themes[themeIndex], themeIndex);
    runIntroSequence();
  }

  init();

})();
