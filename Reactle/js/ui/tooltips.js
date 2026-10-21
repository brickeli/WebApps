import { PERIODIC_TABLE } from '../data/periodicTable.js';

export function showElementTooltip(e, symbol) {
    const data = PERIODIC_TABLE[symbol];
    if (!data) return;

    const tooltip = document.getElementById('element-tooltip');
    document.getElementById('tooltip-symbol').innerText = symbol;
    document.getElementById('tooltip-name').innerText = data.name;
    document.getElementById('tooltip-number').innerText = `#${data.number}`;
    document.getElementById('tooltip-mass').innerText = data.mass;
    document.getElementById('tooltip-category').innerText = data.category;

    tooltip.classList.remove('hidden');

    const x = e.clientX || (e.touches && e.touches[0].clientX) || 100;
    const y = e.clientY || (e.touches && e.touches[0].clientY) || 100;

    tooltip.style.left = `${Math.min(x + 12, window.innerWidth - 180)}px`;
    tooltip.style.top = `${y + 12}px`;
}

export function hideElementTooltip() {
    const tooltip = document.getElementById('element-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
}
