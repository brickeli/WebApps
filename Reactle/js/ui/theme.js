// ui/theme.js
import { Storage } from '../utils/storage.js';
import { playSound, setAudioEnabled } from '../engine/audio.js';

export function initUtilitiesDropdown() {
    const themeBtn = document.getElementById('toggle-theme-btn');
    const soundBtn = document.getElementById('toggle-sound-btn');
    const matrixBtn = document.getElementById('toggle-matrix-badge-btn');

    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTheme();

            const isDark = document.documentElement.classList.contains('dark');
            const themeLabel = document.getElementById('theme-status-label');
            const themeIcon = document.getElementById('theme-icon');

            if (themeLabel) themeLabel.textContent = isDark ? 'DARK' : 'LIGHT';
            if (themeIcon) {
                themeIcon.className = isDark ? 'fa-solid fa-moon w-4 text-amber-500' : 'fa-solid fa-sun w-4 text-amber-500';
            }
        });
    }

    if (soundBtn) {
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            const currentSound = Storage.getSound();
            const nextSound = !currentSound;

            Storage.setSound(nextSound);
            setAudioEnabled(nextSound);

            if (nextSound) playSound('click');

            const soundLabel = document.getElementById('sound-status-label');
            const soundIcon = document.getElementById('sound-icon');

            if (soundLabel) {
                soundLabel.textContent = nextSound ? 'ON' : 'OFF';
                soundLabel.className = nextSound
                    ? 'text-xs font-mono font-bold text-amber-600 dark:text-amber-400'
                    : 'text-xs font-mono font-bold text-rose-600';
            }

            if (soundIcon) {
                soundIcon.className = nextSound
                    ? 'fa-solid fa-volume-high w-4 text-amber-500'
                    : 'fa-solid fa-volume-xmark w-4 text-slate-500';
            }
        });
    }

    if (matrixBtn) {
        matrixBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            const currentBadge = Storage.getMatrixBadge();
            const nextBadge = !currentBadge;

            Storage.setMatrixBadge(nextBadge);
            if (Storage.getSound()) playSound('click');

            const matrixLabel = document.getElementById('matrix-badge-status-label');
            const matrixIcon = document.getElementById('matrix-badge-icon');

            if (matrixLabel) {
                matrixLabel.textContent = nextBadge ? 'ON' : 'OFF';
                matrixLabel.className = nextBadge
                    ? 'text-xs font-mono font-bold text-amber-600 dark:text-amber-400'
                    : 'text-xs font-mono font-bold text-rose-600';
            }

            if (matrixIcon) {
                matrixIcon.className = nextBadge
                    ? 'fa-solid fa-scale-balanced w-4 text-amber-500'
                    : 'fa-solid fa-scale-balanced w-4 text-slate-500';
            }

            if (typeof window.calculateNuclearMatrix === 'function') {
                window.calculateNuclearMatrix();
            }
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
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon w-4 text-chemistry-500';
        if (themeLabel) themeLabel.innerText = 'DARK';
    } else {
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun w-4 text-chemistry-500';
        if (themeLabel) themeLabel.innerText = 'LIGHT';
    }
}
