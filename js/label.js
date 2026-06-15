/**
 * label.js — theme label updater.
 *
 * The label structure (THE | ordinal | THEME | IS) is defined once in
 * theme.html and used in two places: the intro overlay and the ct-header.
 * Both must be kept identical — see the comments in theme.html.
 *
 * This file provides a single function to update the ordinal in both
 * places simultaneously, so they can never fall out of sync at runtime.
 *
 * @param {string} ordinal  — e.g. "FIRST", "SECOND", …
 */
function setThemeOrdinal(ordinal) {
  const introOrdinal = document.getElementById('intro-ordinal');
  const ctOrdinal    = document.getElementById('label-ordinal');
  if (introOrdinal) introOrdinal.textContent = ordinal;
  if (ctOrdinal)    ctOrdinal.textContent    = ordinal;
}
