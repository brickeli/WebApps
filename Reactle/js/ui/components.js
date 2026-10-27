import { PERIODIC_TABLE } from '../data/periodicTable.js';
import { playSound } from '../engine/audio.js';

// --- NAV MENU STATE ---
let isNavMenuOpen = false;

export function isNavOpen() {
    return isNavMenuOpen;
}

// --- MODALS & ACCORDIONS ---
export function toggleModal(modalId) {
    playSound('click');
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('hidden');
    }
}

export function toggleNavMenu(forceState) {
    playSound('click');
    const dropdown = document.getElementById('nav-menu-dropdown');
    const chevron = document.getElementById('nav-menu-chevron');

    isNavMenuOpen = typeof forceState === 'boolean' ? forceState : !isNavMenuOpen;

    if (isNavMenuOpen) {
        dropdown?.classList.remove('hidden');
        chevron?.classList.add('rotate-180');
    } else {
        dropdown?.classList.add('hidden');
        chevron?.classList.remove('rotate-180');
    }
}

export function toggleFilterAccordion(forceState) {
    playSound('click');
    const wrapper = document.getElementById('filter-accordion-wrapper');
    const chevron = document.getElementById('filter-accordion-chevron');

    const isOpen = typeof forceState === 'boolean'
        ? forceState
        : wrapper?.classList.contains('max-h-0');

    if (isOpen) {
        wrapper?.classList.remove('max-h-0', 'opacity-0');
        wrapper?.classList.add('max-h-[300px]', 'opacity-100');
        chevron?.classList.add('rotate-180');
    } else {
        wrapper?.classList.remove('max-h-[300px]', 'opacity-100');
        wrapper?.classList.add('max-h-0', 'opacity-0');
        chevron?.classList.remove('rotate-180');
    }
}

/**
 * Generic Matrix Accordion Toggle (supports both atom-matrix and nuclear-matrix)
 */
export function toggleMatrixAccordion(wrapperId = 'nuclear-matrix-wrapper', chevronId = 'nuclear-matrix-chevron', forceState) {
    playSound('click');
    const wrapper = document.getElementById(wrapperId);
    const chevron = document.getElementById(chevronId);
    if (!wrapper) return;

    const isCurrentlyClosed = wrapper.classList.contains('max-h-0') || wrapper.classList.contains('hidden');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : isCurrentlyClosed;

    if (shouldOpen) {
        wrapper.classList.remove('hidden', 'max-h-0', 'opacity-0');
        wrapper.classList.add('max-h-[600px]', 'opacity-100');
        chevron?.classList.add('rotate-180');
    } else {
        wrapper.classList.remove('max-h-[600px]', 'opacity-100');
        wrapper.classList.add('max-h-0', 'opacity-0');
        chevron?.classList.remove('rotate-180');
    }
}

// --- HEADER APP DROPDOWN (IDEMPOTENT INITIALIZATION) ---
let modeDropdownInitialized = false;

export function initModeDropdown() {
    const btn = document.getElementById('mode-dropdown-btn');
    const menu = document.getElementById('mode-dropdown-menu');
    const chevron = document.getElementById('mode-dropdown-chevron');

    if (!btn || !menu || modeDropdownInitialized) return;
    modeDropdownInitialized = true;

    function toggleDropdown(show) {
        const isOpening = show !== undefined ? show : menu.classList.contains('hidden');

        if (isOpening) {
            menu.classList.remove('hidden');
            requestAnimationFrame(() => {
                menu.classList.remove('opacity-0', 'scale-95');
                menu.classList.add('opacity-100', 'scale-100');
            });
            if (chevron) chevron.classList.add('rotate-180');
            btn.setAttribute('aria-expanded', 'true');
        } else {
            menu.classList.remove('opacity-100', 'scale-100');
            menu.classList.add('opacity-0', 'scale-95');
            if (chevron) chevron.classList.remove('rotate-180');
            btn.setAttribute('aria-expanded', 'false');
            setTimeout(() => {
                menu.classList.add('hidden');
            }, 150);
        }
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    menu.addEventListener('click', (e) => {
        const optionBtn = e.target.closest('.mode-option');
        if (!optionBtn) return;

        const targetMode = optionBtn.getAttribute('data-mode');
        toggleDropdown(false);

        const currentPath = window.location.pathname;
        if (targetMode === 'reactle' && !currentPath.endsWith('index.html') && currentPath !== '/') {
            window.location.href = './index.html';
        } else if (targetMode === 'nuclear' && !currentPath.endsWith('nuclear.html')) {
            window.location.href = './nuclear.html';
        }
    });
}

// --- SUBATOMIC & ELEMENT TOOLTIP HELPERS ---
export function cleanSymbol(symbol) {
    if (!symbol) return '';
    return symbol.replace(/<[^>]*>/g, '').replace(/[0-9]/g, '').trim();
}

export function getSubatomicParticleData(symbol) {
    const raw = cleanSymbol(symbol);
    const lower = raw.toLowerCase();

    if (raw === 'n') {
        return {
            name: "Neutron",
            atomicNumber: 0,
            category: "Subatomic Particle",
            atomicMass: 1.0087,
            summary: "A neutral nucleon with mass number 1 and zero electric charge, essential for initiating and sustaining fission chain reactions."
        };
    }
    if (raw === 'p') {
        return {
            name: "Proton",
            atomicNumber: 1,
            category: "Subatomic Particle",
            atomicMass: 1.0073,
            summary: "Positively charged nucleon representing a Hydrogen-1 nucleus."
        };
    }
    if (raw === 'β⁻' || raw === 'e-' || raw === 'β-' || raw === 'e' || lower === 'beta') {
        return {
            name: "Beta-Minus Particle (Electron)",
            atomicNumber: -1,
            category: "Subatomic Particle",
            atomicMass: 0.0005,
            summary: "High-energy electron emitted from a nucleus during nuclear beta-minus decay, converting a neutron into a proton."
        };
    }

    if (lower === 'β⁺' || lower === 'positron') {
        return {
            name: "Positron (Beta-Plus)",
            atomicNumber: 1,
            category: "Antimatter Particle",
            atomicMass: 0.0005,
            summary: "Positively charged antielectron emitted during positron emission."
        };
    }
    if (raw === 'α' || lower === 'alpha') {
        return {
            name: "Alpha Particle",
            atomicNumber: 2,
            category: "Light Nucleus / Decay Product",
            atomicMass: 4.0015,
            summary: "Helium-4 nucleus consisting of two protons and two neutrons emitted during alpha decay."
        };
    }
    if (raw === 'γ' || lower === 'gamma') {
        return {
            name: "Gamma Ray Photon",
            atomicNumber: 0,
            category: "Electromagnetic Radiation",
            atomicMass: 0,
            summary: "High-energy electromagnetic radiation emitted to release excess nuclear energy without altering mass or charge."
        };
    }
    return null;
}

export function resolveTooltipData(rawSymbol) {
    const symbol = cleanSymbol(rawSymbol);
    if (!symbol) return { symbol: '', data: null };

    const particle = getSubatomicParticleData(symbol);
    if (particle) return { symbol, data: particle };

    if (PERIODIC_TABLE && PERIODIC_TABLE[symbol]) {
        return { symbol, data: PERIODIC_TABLE[symbol] };
    }

    const formattedSymbol = symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase();
    if (PERIODIC_TABLE && PERIODIC_TABLE[formattedSymbol]) {
        return { symbol: formattedSymbol, data: PERIODIC_TABLE[formattedSymbol] };
    }

    return { symbol, data: null };
}

export function showElementTooltip(event, rawSymbol) {
    const { symbol, data: elemData } = resolveTooltipData(rawSymbol);

    if (!elemData) return;

    const tooltip = document.getElementById('element-tooltip');
    if (!tooltip) return;

    const symbolEl = document.getElementById('tooltip-symbol');
    const nameEl = document.getElementById('tooltip-name');
    const numberEl = document.getElementById('tooltip-number');
    const massEl = document.getElementById('tooltip-mass');
    const categoryEl = document.getElementById('tooltip-category');
    const summaryEl = document.getElementById('tooltip-summary');

    if (symbolEl) symbolEl.innerText = symbol;
    if (nameEl) nameEl.innerText = elemData.name || symbol;
    if (numberEl) numberEl.innerText = `#${elemData.atomicNumber ?? '?'}`;
    if (massEl) massEl.innerText = elemData.atomicMass || 'N/A';
    if (categoryEl) categoryEl.innerText = elemData.category || 'Element';
    if (summaryEl) summaryEl.innerText = elemData.summary || 'No element description available.';

    tooltip.classList.remove('hidden');

    const targetEl = event?.currentTarget || event?.target;
    if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
        const rect = targetEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const tooltipHeight = tooltip.offsetHeight || 140;
        const isMobile = viewportWidth < 640;

        if (isMobile) {
            const sidePadding = 16;
            tooltip.style.width = `${viewportWidth - (sidePadding * 2)}px`;
            tooltip.style.left = `${viewportWidth / 2}px`;
        } else {
            const tooltipWidth = 320;
            tooltip.style.width = `${tooltipWidth}px`;

            const sidePadding = 12;
            let centerX = rect.left + (rect.width / 2);
            const minX = (tooltipWidth / 2) + sidePadding;
            const maxX = viewportWidth - (tooltipWidth / 2) - sidePadding;
            centerX = Math.max(minX, Math.min(centerX, maxX));

            tooltip.style.left = `${centerX}px`;
        }

        const topPadding = 12;
        let topY = rect.top - 8;

        if (topY - tooltipHeight < topPadding) {
            if (rect.bottom + tooltipHeight + topPadding <= viewportHeight) {
                tooltip.style.transform = 'translate(-50%, 0)';
                topY = rect.bottom + 8;
            } else {
                tooltip.style.transform = 'translate(-50%, 0)';
                topY = topPadding;
            }
        } else {
            tooltip.style.transform = 'translate(-50%, -100%)';
        }

        tooltip.style.top = `${topY}px`;
    }
}

export function hideElementTooltip() {
    const tooltip = document.getElementById('element-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
}
