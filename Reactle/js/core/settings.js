/**
 * Settings menu behaviour (theme, sound, balance/conservation check).
 * Put at js/core/settings.js.
 * onMatrixChange: redraw the matrix after the badge setting changes.
 */
import { Storage } from '../utils/storage.js';
import { playSound, setAudioEnabled } from '../engine/audio.js';

const $ = (id) => document.getElementById(id);

export function initSettings({ onMatrixChange } = {}) {
    const paintTheme = () => {
        const dark = document.documentElement.classList.contains('dark');
        const label = $('theme-status-label');
        if (label) {
            label.textContent = dark ? 'DARK' : 'LIGHT';
            label.className = 'settings-status is-neutral';
        }
        const icon = $('theme-icon');
        if (icon) {
            icon.className = `fa-solid ${dark ? 'fa-moon' : 'fa-sun'} settings-item-icon`;
        }
    };

    const paintSound = () => {
        const enabled = Storage.getSound();
        const label = $('sound-status-label');
        if (label) {
            label.textContent = enabled ? 'ON' : 'OFF';
            label.className = `settings-status ${enabled ? 'is-accent' : 'is-off'}`;
        }
        const icon = $('sound-icon');
        if (icon) {
            icon.className = `fa-solid ${enabled ? 'fa-volume-high' : 'fa-volume-xmark'} settings-item-icon ${enabled ? '' : 'is-muted'}`;
        }
    };

    const paintMatrix = () => {
        const enabled = Storage.getMatrixBadge();
        const label = $('matrix-badge-status-label');
        if (label) {
            label.textContent = enabled ? 'ON' : 'OFF';
            label.className = `settings-status ${enabled ? 'is-accent' : 'is-off'}`;
        }
        const icon = $('matrix-badge-icon');
        if (icon) {
            icon.className = `fa-solid fa-scale-balanced settings-item-icon ${enabled ? '' : 'is-muted'}`;
        }
        $('balance-status')?.classList.toggle('hidden', !enabled);
    };

    // initial state
    const saved = Storage.getTheme();
    const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    setAudioEnabled(Storage.getSound());
    paintTheme();
    paintSound();
    paintMatrix();

    // toggles
    $('toggle-theme-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowDark = document.documentElement.classList.toggle('dark');
        Storage.setTheme(nowDark ? 'dark' : 'light');
        paintTheme();
    });
    $('toggle-sound-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const next = !Storage.getSound();
        Storage.setSound(next);
        setAudioEnabled(next);
        if (next) playSound('click');
        paintSound();
    });
    $('toggle-matrix-badge-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('click');
        Storage.setMatrixBadge(!Storage.getMatrixBadge());
        paintMatrix();
        onMatrixChange?.();
    });
}
