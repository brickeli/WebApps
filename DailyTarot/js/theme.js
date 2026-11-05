// js/theme.js

import { safeGetItem, safeSetItem } from './storage.js';

export const THEME_NAMES = {
    'obsidian-plum': 'Gothic Plum',
    'crimson-alchemist': 'Crimson Alchemist',
    'nocturnal-cosmic': 'Nocturnal Cosmic',
    'modern-astral': 'Modern Astral'
};

/**
 * Generates the complete sacred geometry card back markup
 */
export function getCardBackGeometryHTML() {
    return `
        <!-- Header Label -->
        <div class="deck-card-text">✦ SACRED ARCANA ✦</div>

        <!-- Central Sacred Geometry Engine -->
        <div class="sacred-geometry-container">
            <div class="outer-geom-ring"></div>
            <div class="mid-geom-ring"></div>
            <div class="inner-geom-ring"></div>

            <svg class="ring-compass-outter-svg" viewBox="0 0 120 120" aria-hidden="true">
                <!-- 8 Radial Energy Dots -->
                <g fill="rgb(var(--color-gold))">
                    <circle cx="60" cy="6" r="2.5" />   <!-- North -->
                    <circle cx="114" cy="60" r="2.5" />  <!-- East -->
                    <circle cx="60" cy="114" r="2.5" />  <!-- South -->
                    <circle cx="6" cy="60" r="2.5" />   <!-- West -->
                </g>
            </svg>

            <svg class="ring-compass-inner-svg" viewBox="0 0 120 120" aria-hidden="true">
                <!-- 8 Radial Energy Dots -->
                <g fill="rgb(var(--color-mystic-purple))">
                    <circle cx="98.1" cy="21.8" r="2" /> <!-- NE -->
                    <circle cx="98.1" cy="98.1" r="2" /> <!-- SE -->
                    <circle cx="21.8" cy="98.1" r="2" /> <!-- SW -->
                    <circle cx="21.8" cy="21.8" r="2" /> <!-- NW -->
                </g>
            </svg>

            <!-- Motif 1: 8-Node Solar Octagram -->
            <div class="theme-geom-octagram">
                <svg class="sacred-octagram-svg solar-octagram-svg" viewBox="0 0 100 100" aria-hidden="true">
                    <g fill="none">
                        <!-- Interlocking Primary Squares (Gold & Mystic Purple Accent) -->
                        <g stroke-width="1.2">
                            <rect x="25" y="25" width="50" height="50" transform="rotate(0 50 50)" stroke="rgb(var(--color-gold))" />
                            <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" stroke="rgb(var(--color-mystic-purple) / 0.85)" />
                            <circle cx="50" cy="50" r="18" stroke="rgb(var(--color-gold) / 0.6)" stroke-dasharray="2 3" />
                        </g>
                        <!-- Intersecting Ray Framework -->
                        <g stroke="rgb(var(--color-starlight) / 0.35)" stroke-width="0.7" stroke-dasharray="1 3">
                            <line x1="50" y1="10" x2="50" y2="90" />
                            <line x1="10" y1="50" x2="90" y2="50" />
                            <line x1="21.7" y1="21.7" x2="78.3" y2="78.3" />
                            <line x1="21.7" y1="78.3" x2="78.3" y2="21.7" />
                        </g>
                        <!-- Glowing Energy Intersection Nodes (8 Cardinal Points) -->
                        <g fill="rgb(var(--color-gold))">
                            <circle cx="50" cy="14.6" r="2" />
                            <circle cx="85.4" cy="50" r="2" />
                            <circle cx="50" cy="85.4" r="2" />
                            <circle cx="14.6" cy="50" r="2" />
                            <circle cx="75" cy="25" r="2" />
                            <circle cx="75" cy="75" r="2" />
                            <circle cx="25" cy="75" r="2" />
                            <circle cx="25" cy="25" r="2" />
                        </g>
                    </g>
                </svg>
            </div>

            <!-- Motif 2: 7-Chakra Stellar Seed -->
            <div class="theme-geom-seed-of-life">
                <svg class="sacred-seed-svg seed-of-life-svg" viewBox="0 0 100 100" aria-hidden="true">
                    <g fill="none">
                        <!-- Interlocking Core Orbits -->
                        <g stroke-width="1.2">
                            <circle cx="50" cy="50" r="20" stroke="rgb(var(--color-gold))" />
                            <circle cx="50" cy="30" r="20" stroke="rgb(var(--color-gold) / 0.75)" />
                            <circle cx="67.3" cy="40" r="20" stroke="rgb(var(--color-mystic-purple) / 0.8)" />
                            <circle cx="67.3" cy="60" r="20" stroke="rgb(var(--color-gold) / 0.75)" />
                            <circle cx="50" cy="70" r="20" stroke="rgb(var(--color-mystic-purple) / 0.8)" />
                            <circle cx="32.7" cy="60" r="20" stroke="rgb(var(--color-gold) / 0.75)" />
                            <circle cx="32.7" cy="40" r="20" stroke="rgb(var(--color-mystic-purple) / 0.8)" />
                        </g>
                        <!-- Intersecting Ray Framework -->
                        <g stroke="rgb(var(--color-starlight) / 0.35)" stroke-width="0.7" stroke-dasharray="1 3">
                            <polygon points="50,30 67.3,60 32.7,60" />
                            <polygon points="50,70 67.3,40 32.7,40" />
                        </g>
                        <!-- Glowing Intersection Nodes -->
                        <g fill="rgb(var(--color-gold))">
                            <circle cx="50" cy="30" r="2" />
                            <circle cx="67.3" cy="40" r="2" />
                            <circle cx="67.3" cy="60" r="2" />
                            <circle cx="50" cy="70" r="2" />
                            <circle cx="32.7" cy="60" r="2" />
                            <circle cx="32.7" cy="40" r="2" />
                        </g>
                    </g>
                </svg>
            </div>

            <!-- Motif 3: 6-Node Merkaba Star Tetrahedron -->
            <div class="theme-geom-metatron">
                <svg class="sacred-metatron-svg merkaba-svg" viewBox="0 0 100 100" aria-hidden="true">
                    <g fill="none">
                        <!-- Primary Light & Shadow Tetrahedrons -->
                        <g stroke-width="1.2">
                            <polygon points="50,10 84.6,70 15.4,70" stroke="rgb(var(--color-gold))" fill="rgb(var(--color-gold) / 0.04)" />
                            <polygon points="50,90 84.6,30 15.4,30" stroke="rgb(var(--color-mystic-purple))" fill="rgb(var(--color-mystic-purple) / 0.04)" />
                        </g>
                        <!-- Intersecting Dashed Facet Rays to Center Origin -->
                        <g stroke="rgb(var(--color-starlight) / 0.35)" stroke-width="0.7" stroke-dasharray="1 3">
                            <line x1="50" y1="10" x2="50" y2="90" />
                            <line x1="84.6" y1="70" x2="15.4" y2="30" />
                            <line x1="15.4" y1="70" x2="84.6" y2="30" />
                        </g>
                        <!-- Inner Facet Hexagon Geometry -->
                        <polygon points="50,30 67.3,40 67.3,60 50,70 32.7,60 32.7,40" stroke="rgb(var(--color-gold) / 0.7)" stroke-width="1" />
                        <!-- Glowing Energy Intersection Nodes (6 Apex Vertices) -->
                        <g fill="rgb(var(--color-gold))">
                            <circle cx="50" cy="10" r="2" />
                            <circle cx="84.6" cy="30" r="2" />
                            <circle cx="84.6" cy="70" r="2" />
                            <circle cx="50" cy="90" r="2" />
                            <circle cx="15.4" cy="70" r="2" />
                            <circle cx="15.4" cy="30" r="2" />
                        </g>
                    </g>
                </svg>
            </div>

            <!-- Central Celestial Star Beam Layer -->
            <svg class="sacred-star-beam-svg" viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                    <linearGradient id="beam-gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="rgb(var(--color-gold))" stop-opacity="0" />
                        <stop offset="50%" stop-color="rgb(var(--color-gold))" stop-opacity="0.9" />
                        <stop offset="100%" stop-color="rgb(var(--color-gold))" stop-opacity="0" />
                    </linearGradient>
                    <linearGradient id="beam-purple-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="rgb(var(--color-mystic-purple))" stop-opacity="0" />
                        <stop offset="50%" stop-color="rgb(var(--color-mystic-purple))" stop-opacity="0.8" />
                        <stop offset="100%" stop-color="rgb(var(--color-mystic-purple))" stop-opacity="0" />
                    </linearGradient>
                </defs>

                <!-- Cross Beams -->
                <g class="star-beam-lines">
                    <line x1="50" y1="0" x2="50" y2="100" class="beam-purple beam-thick" />
                    <line x1="50" y1="10" x2="50" y2="90" class="beam-gold beam-thin" />
                    <line x1="0" y1="50" x2="100" y2="50" class="beam-gold beam-thick" />
                    <line x1="10" y1="50" x2="90" y2="50" class="beam-purple beam-thin" />
                </g>

                <!-- Elongated Diagonal Flares -->
                <g class="flare-diagonal">
                    <polygon points="50,22 51.5,50 50,78 48.5,50" class="rotate-45" />
                    <polygon points="22,50 50,48.5 78,50 50,51.5" class="rotate-45" />
                    <polygon points="50,22 51.5,50 50,78 48.5,50" class="rotate-neg-45" />
                    <polygon points="22,50 50,48.5 78,50 50,51.5" class="rotate-neg-45" />
                </g>

                <!-- Primary Cardinal Flares -->
                <g class="flare-cardinal">
                    <polygon points="50,36 53,50 50,64 47,50" />
                    <polygon points="36,50 50,47 64,50 50,53" />
                </g>

                <!-- Core Radiant Flare Halo -->
                <circle cx="50" cy="50" r="7.5" class="flare-core-halo" />
            </svg>
        </div>

        <!-- Footer Text & Status -->
        <div class="deck-center-content">
            <p class="deck-tap-text">UNVEIL THE ARCANA</p>
        </div>
        <div class="deck-card-text">✦ INTUITION ✦</div>
    `;
}

/**
 * Injects the complete card back geometry into all containers marked with data-card-back-slot
 */
export function renderAllCardBacks() {
    const slots = document.querySelectorAll('[data-card-back-slot]');
    const geometryHTML = getCardBackGeometryHTML();
    slots.forEach(slot => {
        slot.innerHTML = geometryHTML;
    });
}



// Opens/closes the Settings popup and keeps aria-expanded and keyboard focus in step.
//   - opening moves focus to the first item in the popup
//   - closing with returnFocus puts focus back on the Settings button
function setUtilsMenuOpen(open, { returnFocus = false } = {}) {
    const dropdown = document.getElementById('utils-dropdown');
    const menuBtn = document.getElementById('utils-menu-btn');
    if (!dropdown) return;

    const wasOpen = !dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden', !open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));

    if (open && !wasOpen) {
        dropdown.querySelector('button')?.focus();
    } else if (!open && wasOpen && returnFocus && menuBtn) {
        menuBtn.focus();
    }
}

export function toggleUtilsMenu(event) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }
    const dropdown = document.getElementById('utils-dropdown');
    if (dropdown) {
        setUtilsMenuOpen(dropdown.classList.contains('hidden'));
    }
}

export function selectTheme(themeId, displayName) {
    document.documentElement.setAttribute('data-theme', themeId);
    safeSetItem('arcana_active_theme', themeId);

    // Picking a theme closes the popup; keyboard users land back on the Settings button.
    // (At startup the popup is already closed, so this does nothing to focus.)
    setUtilsMenuOpen(false, { returnFocus: true });
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
    const savedTheme = safeGetItem('arcana_active_theme') || 'obsidian-plum';
    selectTheme(savedTheme);

    // Close menu on outside click
    document.addEventListener('click', (event) => {
        const menuBtn = document.getElementById('utils-menu-btn');
        const dropdown = document.getElementById('utils-dropdown');
        if (dropdown && menuBtn && !dropdown.classList.contains('hidden')) {
            if (!menuBtn.contains(event.target) && !dropdown.contains(event.target)) {
                setUtilsMenuOpen(false);
            }
        }
    });

    // Close menu with Escape and return focus to the Settings button
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const dropdown = document.getElementById('utils-dropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            setUtilsMenuOpen(false, { returnFocus: true });
        }
    });
}



/* ==========================================================================
   ARCANA TAROT // THEME & MOTIF CONTROLLER (theme.js)
   ========================================================================== */

const STORAGE_KEYS = {
    SITE_THEME: 'arcana_site_theme',
    CARD_THEME: 'arcana_card_theme'
};

// Default fallbacks
const DEFAULTS = {
    SITE_THEME: 'obsidian-plum',
    CARD_THEME: 'octagram'
};

/**
 * Initialize all site and card back theme listeners and local storage bindings
 */
export function initThemeController() {
    initSiteThemePicker();
    initCardThemePicker();
}

/**
 * 1. Global UI Color Palette Controller
 */
function initSiteThemePicker() {
    const siteThemeBtns = document.querySelectorAll('.theme-option-btn');
    const savedSiteTheme = localStorage.getItem(STORAGE_KEYS.SITE_THEME) || DEFAULTS.SITE_THEME;

    applySiteTheme(savedSiteTheme);

    siteThemeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme-val');
            if (theme) {
                applySiteTheme(theme);
            }
        });
    });
}

function applySiteTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem(STORAGE_KEYS.SITE_THEME, themeName);
}

/**
 * 2. Card Back Geometric Motif Controller
 */
function initCardThemePicker() {
    const cardThemeBtns = document.querySelectorAll('.card-theme-btn');
    const savedCardTheme = localStorage.getItem(STORAGE_KEYS.CARD_THEME) || DEFAULTS.CARD_THEME;

    applyCardTheme(savedCardTheme);

    cardThemeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.getAttribute('data-card-style');
            if (style) {
                applyCardTheme(style);
            }
        });
    });
}

function applyCardTheme(cardStyle) {
    document.documentElement.setAttribute('data-card-theme', cardStyle);
    localStorage.setItem(STORAGE_KEYS.CARD_THEME, cardStyle);
    updateCardThemeUI(cardStyle);
}

function updateCardThemeUI(activeStyle) {
    const cardThemeBtns = document.querySelectorAll('.card-theme-btn');
    cardThemeBtns.forEach(btn => {
        if (btn.getAttribute('data-card-style') === activeStyle) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
