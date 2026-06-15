/**
 * PenPal4ever — theme.js
 *
 * Handles:
 *  1. Session loading from /api/sessions/:id (URL: /session/:id)
 *  2. NEW THEME intro animation (2s hold → fly to top)
 *  3. CURRENT THEME barn-door reveal (half-speed: 650ms)
 *  4. Left/right arrow navigation — saves progress to DB
 *  5. Image uploads for each side, saved to DB
 *  6. Session info bar
 */

(function () {

  // ─── Timing (all halved from original) ──────────────────────

  const INTRO_HOLD_MS = 2000;
  const INTRO_FLY_MS  = 190;   // was 380
  const BARN_OPEN_MS  = 650;   // was 1300
  const BARN_CLOSE_MS = 650;   // was 1300
  const FLASH_HOLD_MS = 300;   // was 600
  const FLASH_FADE_MS = 100;   // was 200

  // ─── State ───────────────────────────────────────────────────

  let themes      = [];
  let themeIndex  = 0;
  let isAnimating = false;
  let sessionId   = null;
  let sessionData = null;
  let uploadsMap  = {};  // { "0-left": {...}, "0-right": {...}, ... }

  // ─── DOM refs ─────────────────────────────────────────────────

  const intro      = document.getElementById('intro');
  const introBlock = document.getElementById('intro-block');
  const introTitle = document.getElementById('intro-title');

  const ctLayout     = document.getElementById('ct-layout');
  const ctTitle      = document.getElementById('ct-title');
  const labelOrdinal = document.getElementById('label-ordinal');

  const doorLeft    = document.getElementById('door-left');
  const doorRight   = document.getElementById('door-right');

  const nameLeft    = document.getElementById('name-left');
  const nameRight   = document.getElementById('name-right');

  const uploadZoneLeft  = document.getElementById('upload-zone-left');
  const uploadZoneRight = document.getElementById('upload-zone-right');
  const fileInputLeft   = document.getElementById('file-input-left');
  const fileInputRight  = document.getElementById('file-input-right');

  const imageLeft   = document.getElementById('image-left');
  const imageRight  = document.getElementById('image-right');
  const captionLeft  = document.getElementById('caption-left');
  const captionRight = document.getElementById('caption-right');

  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  const sessionBar      = document.getElementById('session-bar');
  const sessionNames    = document.getElementById('session-names');
  const sessionIdDisplay = document.getElementById('session-id-display');
  const btnCopyLink     = document.getElementById('btn-copy-link');

  // ─── Helpers ─────────────────────────────────────────────────

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function ordinalLabel(n) {
    const labels = ['FIRST','SECOND','THIRD','FOURTH','FIFTH',
                    'SIXTH','SEVENTH','EIGHTH','NINTH','TENTH'];
    return labels[n] || `#${n + 1}`;
  }

  // ─── Session ID from URL ──────────────────────────────────────

  function getSessionIdFromUrl() {
    const match = window.location.pathname.match(/^\/session\/([^/]+)/);
    return match ? match[1] : null;
  }

  // ─── Load session from API ────────────────────────────────────

  async function loadSession(id) {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) throw new Error(`Session ${id} not found`);
    return res.json();
  }

  // ─── Load themes.json ─────────────────────────────────────────

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

  // ─── Build uploads map ────────────────────────────────────────

  function buildUploadsMap(uploads) {
    const map = {};
    for (const u of uploads) {
      map[`${u.theme_index}-${u.person}`] = u;
    }
    return map;
  }

  // ─── Save current theme index to DB ──────────────────────────

  async function saveThemeIndex(index) {
    if (!sessionId) return;
    try {
      await fetch(`/api/sessions/${sessionId}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeIndex: index }),
      });
    } catch (err) {
      console.warn('Could not save theme index:', err);
    }
  }

  // ─── Update nav button states ─────────────────────────────────

  function updateNavButtons() {
    btnPrev.disabled = (themeIndex === 0);
    btnNext.disabled = !(themeIndex < themes.length - 1);
  }

  // ─── Render theme content ─────────────────────────────────────

  function renderTheme(theme, index) {
    setThemeOrdinal(ordinalLabel(index));

    introTitle.textContent = `"${theme.title}"`;
    ctTitle.textContent    = `"${theme.title}"`;

    // Names from session or fallback from theme data
    nameLeft.textContent  = sessionData
      ? sessionData.your_first_name.toUpperCase()
      : (theme.left?.name || 'YOU');
    nameRight.textContent = sessionData
      ? sessionData.penpal_first_name.toUpperCase()
      : (theme.right?.name || 'PENPAL');

    // Show upload zone or image — left
    const uploadLeft = uploadsMap[`${index}-left`];
    if (uploadLeft) {
      imageLeft.src    = uploadLeft.image_url;
      imageLeft.alt    = uploadLeft.caption || '';
      imageLeft.hidden = false;
      uploadZoneLeft.hidden = true;
      captionLeft.textContent = uploadLeft.caption || '';
    } else {
      imageLeft.hidden  = true;
      uploadZoneLeft.hidden = false;
      captionLeft.textContent = '';
    }

    // Show upload zone or image — right
    const uploadRight = uploadsMap[`${index}-right`];
    if (uploadRight) {
      imageRight.src    = uploadRight.image_url;
      imageRight.alt    = uploadRight.caption || '';
      imageRight.hidden = false;
      uploadZoneRight.hidden = true;
      captionRight.textContent = uploadRight.caption || '';
    } else {
      imageRight.hidden  = true;
      uploadZoneRight.hidden = false;
      captionRight.textContent = '';
    }

    updateNavButtons();
  }

  // ─── Header fade ─────────────────────────────────────────────

  function fadeHeaderOut() {
    const t = `opacity ${FLASH_FADE_MS}ms ease`;
    labelOrdinal.style.transition = t;  labelOrdinal.style.opacity = '0';
    ctTitle.style.transition      = t;  ctTitle.style.opacity      = '0';
  }

  function fadeHeaderIn() {
    const t = `opacity ${FLASH_FADE_MS}ms ease`;
    labelOrdinal.style.transition = t;  labelOrdinal.style.opacity = '1';
    ctTitle.style.transition      = t;  ctTitle.style.opacity      = '1';
  }

  // ─── Barn door helpers ────────────────────────────────────────

  function closeDoors() {
    doorLeft.classList.remove('is-open');  doorLeft.classList.add('is-closing');
    doorRight.classList.remove('is-open'); doorRight.classList.add('is-closing');
  }

  function resetDoorsToClose() {
    doorLeft.classList.remove('is-closing', 'is-open');
    doorRight.classList.remove('is-closing', 'is-open');
    doorLeft.style.animation  = 'none';
    doorRight.style.animation = 'none';
    doorLeft.style.transform  = 'rotateY(-90deg)';
    doorRight.style.transform = 'rotateY(90deg)';
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

  // ─── Navigation ──────────────────────────────────────────────

  async function navigateTo(newIndex) {
    if (newIndex < 0 || newIndex >= themes.length) return;
    if (isAnimating) return;
    isAnimating = true;
    btnPrev.disabled = true;
    btnNext.disabled = true;

    fadeHeaderOut();
    closeDoors();
    await sleep(BARN_CLOSE_MS);

    themeIndex = newIndex;
    renderTheme(themes[themeIndex], themeIndex);
    resetDoorsToClose();
    saveThemeIndex(themeIndex);

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

  // ─── Upload handling ──────────────────────────────────────────

  function setupUploadZone(zone, fileInput, person) {
    // Click to open file picker
    zone.addEventListener('click', () => {
      if (!sessionId) {
        alert('No session loaded. Please start from the home page.');
        return;
      }
      fileInput.click();
    });

    // File selected via input
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) doUpload(file, person, zone);
      fileInput.value = ''; // reset so same file can be re-selected
    });

    // Drag and drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('is-dragging');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-dragging'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('is-dragging');
      if (!sessionId) return;
      const file = e.dataTransfer?.files[0];
      if (file && file.type.startsWith('image/')) doUpload(file, person, zone);
    });
  }

  async function doUpload(file, person, zone) {
    zone.classList.add('is-uploading');
    const label = zone.querySelector('.upload-zone__label');
    const origLabel = label.textContent;
    label.textContent = 'UPLOADING';

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('themeIndex', themeIndex);
      formData.append('person', person);
      formData.append('caption', '');

      const res = await fetch(`/api/sessions/${sessionId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const upload = await res.json();

      // Update local map
      uploadsMap[`${themeIndex}-${person}`] = upload;

      // Re-render to show image
      renderTheme(themes[themeIndex], themeIndex);
    } catch (err) {
      console.error('Upload error:', err);
      label.textContent = 'UPLOAD FAILED — TRY AGAIN';
      zone.classList.remove('is-uploading');
      setTimeout(() => { label.textContent = origLabel; }, 2500);
    }
  }

  setupUploadZone(uploadZoneLeft,  fileInputLeft,  'left');
  setupUploadZone(uploadZoneRight, fileInputRight, 'right');

  // ─── Session info bar ─────────────────────────────────────────

  function showSessionBar(session) {
    sessionNames.textContent =
      `${session.your_first_name} × ${session.penpal_first_name}`;
    sessionIdDisplay.textContent = `ID: ${session.id}`;
    sessionBar.hidden = false;
  }

  btnCopyLink.addEventListener('click', () => {
    const url = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(url).then(() => {
      btnCopyLink.textContent = 'COPIED!';
      setTimeout(() => { btnCopyLink.textContent = 'COPY LINK'; }, 2000);
    }).catch(() => {
      btnCopyLink.textContent = 'FAILED';
      setTimeout(() => { btnCopyLink.textContent = 'COPY LINK'; }, 2000);
    });
  });

  // ─── Intro sequence ───────────────────────────────────────────

  async function runIntroSequence() {
    await sleep(INTRO_HOLD_MS);

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

  // ─── Fisher-Yates shuffle ─────────────────────────────────────

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ─── Init ─────────────────────────────────────────────────────

  async function init() {
    // Load themes
    const rawThemes = await loadThemes();
    if (!rawThemes.length) {
      console.error('No themes found');
      return;
    }
    themes = shuffle(rawThemes);

    // Try to load session
    sessionId = getSessionIdFromUrl();
    if (sessionId) {
      try {
        const { session, uploads } = await loadSession(sessionId);
        sessionData  = session;
        uploadsMap   = buildUploadsMap(uploads);
        themeIndex   = Math.min(session.current_theme_index, themes.length - 1);
        showSessionBar(session);
      } catch (err) {
        console.warn('Could not load session, running without DB:', err);
        sessionId = null;
      }
    }

    renderTheme(themes[themeIndex], themeIndex);
    runIntroSequence();
  }

  init();

})();
