// shared/js/theme.js
const THEME_KEY = 'gridwork_theme';
const LEGACY_SUDOKU_KEY = 'sudoku_theme';

const SUN_SVG = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';
const MOON_SVG = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';

export function getSavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;

    const legacy = localStorage.getItem(LEGACY_SUDOKU_KEY);
    if (legacy) {
        localStorage.setItem(THEME_KEY, legacy);
        localStorage.removeItem(LEGACY_SUDOKU_KEY);
        return legacy;
    }
    return 'light';
}

export function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    const statusEl = document.getElementById('theme-status');
    const iconEl = document.getElementById('theme-icon');
    if (statusEl) {
        statusEl.textContent = isDark ? 'DARK' : 'LIGHT';
        statusEl.className = `toggle-status ${isDark ? 'dark-pill' : 'light-pill'}`;
    }
    if (iconEl) {
        iconEl.innerHTML = isDark ? MOON_SVG : SUN_SVG;
    }
}

export function initTheme(toggleBtnEl) {
    applyTheme(getSavedTheme());
    requestAnimationFrame(() => document.body.classList.add('theme-ready'));

    toggleBtnEl?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    });
}
