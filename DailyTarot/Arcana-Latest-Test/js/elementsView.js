// js/elementsView.js
// HTML for the Elemental Insight tab and the teaser that points to it from Arcanum Wisdom.
//
// Elemental tab order, top to bottom:
//   headline -> lore -> ranked points -> element bars -> Past / Present / Future flow

import { escapeHTML } from './common.js';
import { analyzeElements } from './elements.js';

const FILL_CLASS = {
    Fire: 'elemental-fill-fire',
    Water: 'elemental-fill-water',
    Air: 'elemental-fill-air',
    Earth: 'elemental-fill-earth'
};

function renderBars(percentages) {
    return `
        <div class="elemental-bars-list">
            ${Object.entries(percentages).map(([elem, pct]) => `
                <div class="elemental-bar-row">
                    <div class="elemental-bar-label">
                        <span>${escapeHTML(elem)}</span>
                        <span>${pct}%</span>
                    </div>
                    <div class="elemental-track">
                        <div class="elemental-fill ${FILL_CLASS[elem] || ''}" style="width: ${pct}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderFlow(flow) {
    return `
        <div class="elemental-flow">
            <span class="elemental-flow-label">Elemental Flow</span>
            <ol class="elemental-flow-steps">
                ${flow.map(step => `
                    <li class="elemental-flow-step">
                        <span class="elemental-flow-pos">${escapeHTML(step.position)}</span>
                        <span class="elemental-flow-chip is-${step.element ? step.element.toLowerCase() : 'none'}">${escapeHTML(step.element || 'Spirit')}</span>
                        <span class="elemental-flow-card">${escapeHTML(step.name)}</span>
                        ${step.reversed ? '<span class="elemental-flow-rev">Reversed</span>' : ''}
                    </li>
                `).join('')}
            </ol>
        </div>
    `;
}

/** The full Elemental Insight panel. Pass an existing analysis to avoid computing it twice. */
export function renderElementalReading(cards, reversed, analysis = analyzeElements(cards, reversed)) {
    if (!analysis) return '<div class="elemental-balance-container tarot-guidance-quote">✦ Awaiting Elemental Alignment ✦</div>';

    const { headline, lore, points, percentages, flow, cssElement } = analysis;
    const dominantClass = cssElement ? `element-${cssElement}` : 'element-balanced';

    return `
        <div class="elemental-balance-container ${dominantClass}">
            <div class="elemental-header">
                ✦ Elemental Resonance: <span>${escapeHTML(headline)}</span> ✦
            </div>

            <ul class="spread-reading-points">
                <li>${escapeHTML(lore)}</li>
                ${points.map(text => `<li>${escapeHTML(text)}</li>`).join('')}
            </ul>
            ${renderBars(percentages)}
            ${renderFlow(flow)}
        </div>
    `;
}

/** A button for the bottom of the Wisdom reading. initTripleInsightTabs() handles the click via data-goto-tab. */
export function renderElementalTeaser(analysis) {
    if (!analysis) return '';
    const headline = escapeHTML(analysis.headline);
    return `
        <button type="button" class="spread-reading-teaser" data-goto-tab="elemental" aria-label="Open Elemental Insight: ${headline}">
            <span>✦ The elements add a layer: ${headline}</span>
            <span aria-hidden="true">→</span>
        </button>
    `;
}
