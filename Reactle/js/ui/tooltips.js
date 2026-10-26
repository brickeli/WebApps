import { PERIODIC_TABLE } from '../data/periodicTable.js';

function cleanSymbol(symbol) {
    if (!symbol) return '';
    return symbol.replace(/<[^>]*>/g, '').replace(/[0-9]/g, '').trim();
}

function getSubatomicParticleData(symbol) {
    const clean = cleanSymbol(symbol).toLowerCase();
    if (clean === 'n') {
        return {
            name: "Neutron",
            atomicNumber: 0,
            category: "Subatomic Particle",
            atomicMass: 1.0087,
            summary: "A neutral nucleon with mass number 1 and zero electric charge, essential for initiating and sustaining fission chain reactions."
        };
    }
    if (clean === 'p') {
        return {
            name: "Proton",
            atomicNumber: 1,
            category: "Subatomic Particle",
            atomicMass: 1.0073,
            summary: "Positively charged nucleon representing a Hydrogen-1 nucleus."
        };
    }
    if (clean === 'e' || clean === 'beta' || clean === 'β⁻') {
        return {
            name: "Beta-Minus Particle",
            atomicNumber: -1,
            category: "Subatomic Particle",
            atomicMass: 0.0005,
            summary: "High-energy electron emitted during nuclear beta-minus decay."
        };
    }
    if (clean === 'β⁺' || clean === 'positron') {
        return {
            name: "Positron (Beta-Plus)",
            atomicNumber: 1,
            category: "Antimatter Particle",
            atomicMass: 0.0005,
            summary: "Positively charged antielectron emitted during positron emission."
        };
    }
    if (clean === 'α' || clean === 'alpha') {
        return {
            name: "Alpha Particle",
            atomicNumber: 2,
            category: "Light Nucleus / Decay Product",
            atomicMass: 4.0015,
            summary: "Helium-4 nucleus consisting of two protons and two neutrons emitted during alpha decay."
        };
    }
    if (clean === 'γ' || clean === 'gamma') {
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

export function showElementTooltip(event, rawSymbol) {
    const symbol = cleanSymbol(rawSymbol);
    const elemData = PERIODIC_TABLE[symbol] || getSubatomicParticleData(symbol);

    if (!elemData) return;

    const tooltip = document.getElementById('element-tooltip');
    if (!tooltip) return;

    // 1. Populate Tooltip Data Nodes
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

    // 2. Reveal Tooltip to Measure Dynamic Dimensions
    tooltip.classList.remove('hidden');

    // 3. Compute Position with Full Viewport Boundary Clamping
    const targetEl = event?.currentTarget || event?.target;
    if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
        const rect = targetEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const tooltipHeight = tooltip.offsetHeight || 140;
        const isMobile = viewportWidth < 640;

        // --- Horizontal Sizing & Positioning ---
        if (isMobile) {
            const sidePadding = 16;
            tooltip.style.width = `${viewportWidth - (sidePadding * 2)}px`;
            tooltip.style.left = `${viewportWidth / 2}px`;
        } else {
            const tooltipWidth = 320;
            tooltip.style.width = `${tooltipWidth}px`;

            // Clamp horizontal bounds on desktop
            const sidePadding = 12;
            let centerX = rect.left + (rect.width / 2);
            const minX = (tooltipWidth / 2) + sidePadding;
            const maxX = viewportWidth - (tooltipWidth / 2) - sidePadding;
            centerX = Math.max(minX, Math.min(centerX, maxX));

            tooltip.style.left = `${centerX}px`;
        }

        // --- Vertical Placement & Top Edge Clamping ---
        const topPadding = 12;
        let topY = rect.top - 8;

        // If rendering above the card causes top clipping, clamp to top margin
        if (topY - tooltipHeight < topPadding) {
            // Option A: If enough space below the tile, show below it
            if (rect.bottom + tooltipHeight + topPadding <= viewportHeight) {
                tooltip.style.transform = 'translate(-50%, 0)';
                topY = rect.bottom + 8;
            } else {
                // Option B: Otherwise clamp top coordinate safely inside screen
                tooltip.style.transform = 'translate(-50%, 0)';
                topY = topPadding;
            }
        } else {
            // Standard upward placement
            tooltip.style.transform = 'translate(-50%, -100%)';
        }

        tooltip.style.top = `${topY}px`;
    }
}

export function hideElementTooltip() {
    const tooltip = document.getElementById('element-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
}
