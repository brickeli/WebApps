// js/theme.js

export const THEME_NAMES = {
    'obsidian-plum': 'Gothic Plum',
    'crimson-alchemist': 'Crimson Alchemist',
    'nocturnal-cosmic': 'Nocturnal Cosmic'
};

export function toggleUtilsMenu(event) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }
    const dropdown = document.getElementById('utils-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

export function selectTheme(themeId, displayName) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('arcana_active_theme', themeId);

    const dropdown = document.getElementById('utils-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

export function updateAudioUI(audioActive) {
    const audioIcon = document.getElementById('audio-icon');
    const audioText = document.getElementById('audio-status-text');
    const audioBadge = document.getElementById('audio-toggle-badge');

    if (audioIcon && audioText && audioBadge) {
        if (audioActive) {
            audioIcon.className = 'fa-solid fa-volume-high text-sm text-gold';
            audioText.textContent = 'Ambient Active';
            audioBadge.className = 'text-[9px] font-cinzel px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 font-semibold';
            audioBadge.textContent = 'ON';
        } else {
            audioIcon.className = 'fa-solid fa-volume-xmark text-sm text-starlight/60';
            audioText.textContent = 'Sound Muted';
            audioBadge.className = 'text-[9px] font-cinzel px-1.5 py-0.5 rounded bg-plum/60 border border-plum text-starlight/60';
            audioBadge.textContent = 'OFF';
        }
    }
}

export function initTheme() {
    const savedTheme = localStorage.getItem('arcana_active_theme') || 'obsidian-plum';
    selectTheme(savedTheme);

    // Close menu on outside click
    document.addEventListener('click', (event) => {
        const menuBtn = document.getElementById('utils-menu-btn');
        const dropdown = document.getElementById('utils-dropdown');
        if (dropdown && menuBtn && !dropdown.classList.contains('hidden')) {
            if (!menuBtn.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        }
    });
}
