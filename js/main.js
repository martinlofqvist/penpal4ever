/**
 * PenPal4ever — main.js
 * Loads themes from data/themes.json and renders the theme list.
 */

const App = {
  async init() {
    const themes = await this.loadThemes();
    if (!themes) return;
    this.renderThemeList(themes);
    this.setCurrentTheme(themes);
  },

  async loadThemes() {
    try {
      const res = await fetch('./data/themes.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.themes;
    } catch (err) {
      console.error('Could not load themes:', err);
      return null;
    }
  },

  setCurrentTheme(themes) {
    // Use the first theme as the active one (swap out for dynamic logic later)
    const active = themes[0];
    const titleEl = document.querySelector('.current-theme__title');
    if (titleEl) titleEl.textContent = active.title;
  },

  renderThemeList(themes) {
    const list = document.querySelector('.theme-list');
    if (!list) return;

    list.innerHTML = themes.map(theme => `
      <li class="theme-item">
        <span class="theme-item__number">${String(theme.id).padStart(2, '0')}</span>
        <span class="theme-item__title">${theme.title}</span>
      </li>
    `).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
