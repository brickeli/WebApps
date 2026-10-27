// ui/theme.js
import { Storage } from '../utils/storage.js';


export function initUtilitiesDropdown() {
    const themeBtn = document.getElementById('toggle-theme-btn');
    const soundBtn = document.getElementById('toggle-sound-btn');
    const matrixBtn = document.getElementById('toggle-matrix-badge-btn');

    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTheme();
            loadSharedSettings();
        });
    }

    if (soundBtn) {
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentSound = Storage.getSound();
            const nextSound = !currentSound;
            Storage.setSound(nextSound);
            loadSharedSettings();
            if (nextSound) playSound('click');
        });
    }

    if (matrixBtn) {
        matrixBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentBadge = Storage.getMatrixBadge();
            Storage.setMatrixBadge(!currentBadge);
            loadSharedSettings();
            calculateNuclearMatrix();
        });
    }
}

export function initTheme() {
    const savedTheme = Storage.getTheme();
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    updateThemeUI(isDark);
}

export function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    Storage.setTheme(isDark ? 'dark' : 'light');
    updateThemeUI(isDark);
}

export function updateThemeUI(isDark) {
    const themeLabel = document.getElementById('theme-status-label');
    const themeIcon = document.getElementById('theme-icon');
    if (isDark) {
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun w-4 text-amber-400';
        if (themeLabel) themeLabel.innerText = 'DARK';
    } else {
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon w-4 text-chemistry-500';
        if (themeLabel) themeLabel.innerText = 'LIGHT';
    }
}
