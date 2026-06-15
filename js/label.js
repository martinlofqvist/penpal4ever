/**
 * label.js — theme label updater.
 * Updates ordinal span in both the intro overlay and ct-header simultaneously.
 * @param {string} ordinal — e.g. "FIRST", "SECOND", …
 */
function setThemeOrdinal(ordinal) {
  const introOrdinal = document.getElementById('intro-ordinal');
  const ctOrdinal    = document.getElementById('label-ordinal');
  if (introOrdinal) introOrdinal.textContent = ordinal;
  if (ctOrdinal)    ctOrdinal.textContent    = ordinal;
}
