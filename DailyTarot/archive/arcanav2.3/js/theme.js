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
        audioIcon.className = `fa-solid ${audioActive ? 'fa-volume-high is-active' : 'fa-volume-xmark is-muted'} settings-audio-icon`;
        audioText.textContent = audioActive ? 'Ambient Active' : 'Sound Muted';
        audioBadge.className = `settings-audio-badge ${audioActive ? 'is-on' : 'is-off'}`;
        audioBadge.textContent = audioActive ? 'ON' : 'OFF';
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
