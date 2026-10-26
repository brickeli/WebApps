import { PERIODIC_TABLE } from '../data/periodicTable.js';

function cleanSymbol(symbol) {
    if (!symbol) return '';
    // Strips HTML tags (like <sup>), digits, and whitespace -> "U235" or "<sup>235</sup>U" becomes "U"
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
            summary: "Neutral nucleon with mass number 1, essential for initiating and sustaining fission chain reactions."
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
    return null;
}

export function showElementTooltip(event, rawSymbol) {
    const symbol = cleanSymbol(rawSymbol);
    const elemData = PERIODIC_TABLE[symbol] || getSubatomicParticleData(symbol);

    if (!elemData) return;

    const tooltip = document.getElementById('element-tooltip');
    if (!tooltip) return;

    // Populate all tooltip DOM nodes
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

    // Position & Reveal
    tooltip.classList.remove('hidden');

    const targetEl = event?.currentTarget || event?.target;
    if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
        const rect = targetEl.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 10}px`;
    }
}

export function hideElementTooltip() {
    const tooltip = document.getElementById('element-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
}
