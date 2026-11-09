// js/common.js
// Pieces every page shares: icon/escape/toast helpers and the site chrome
// (theme, settings menu, audio toggle, particle canvas, keyboard activation).

import { initTheme, selectTheme, toggleUtilsMenu, updateAudioUI, initThemeController } from './theme.js';
import { toggleAudio } from './audio.js';
import { initCanvasFX } from './fx.js';

export function iconHTML(name, extraClass = '') {
    return `<svg class="icon${extraClass ? ' ' + extraClass : ''}" aria-hidden="true"><use href="./assets/icons.svg#icon-${name}"></use></svg>`;
}

export function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

let toastTimer;
export function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const msgEl = document.getElementById('toast-msg');
    if (msgEl) msgEl.textContent = message;
    else toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

export function handleToggleAudio() {
    const active = toggleAudio(showToast);
    updateAudioUI(active);
}

// Call once per page, from DOMContentLoaded.
export function initSiteChrome() {
    // the footer's theme buttons use inline onclick="selectTheme(...)"
    Object.assign(window, { selectTheme, toggleUtilsMenu, toggleAudio: handleToggleAudio });

    initCanvasFX();
    initTheme();
    initThemeController();

    document.getElementById('utils-menu-btn')?.addEventListener('click', (e) => toggleUtilsMenu(e));
    document.getElementById('menu-audio-btn')?.addEventListener('click', handleToggleAudio);

    // Enter / Space activate non-button role="button" elements
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = e.target;
        if (el instanceof HTMLElement && el.tagName !== 'BUTTON' && el.matches('[role="button"]')) {
            e.preventDefault();
            if (!e.repeat) el.click();
        }
    });
}
