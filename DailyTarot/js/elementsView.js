// js/elementsView.js
// HTML for the Elemental Insight tab and the teaser that points to it from Arcanum Wisdom.
//
// Elemental tab order, top to bottom:
//   headline -> lore -> ranked points -> element bars -> Past / Present / Future flow

import { escapeHTML } from './common.js';
import { analyzeElements, analyzeElementalCard } from './elements.js';

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
            <ol class="elemental-flow-steps">
                ${flow.map(step => `
                    <li class="elemental-flow-step">
                        <span class="elemental-flow-pos">${escapeHTML(step.position)}</span>
                        <span class="elemental-flow-card">${escapeHTML(step.keyword)}</span>
                        ${step.reversed ? '<span class="elemental-flow-rev">Reversed</span>' : ''}
                    </li>
                `).join('')}
            </ol>
        </div>
    `;
}

/**
 * Single-card Elemental Insight panel, laid out like the Arcanum Wisdom panel.
 * `analysis.headline` already contains the element badge <span> (built and escaped in elements.js),
 * so it is inserted as HTML; everything else is escaped here.
 */
export function renderSingleElementalReading(card, reversed = false, analysis = analyzeElementalCard(card, reversed), wisdomHeadline = '') {
    if (!analysis) return '<div class="elemental-balance-container tarot-guidance-quote">✦ Awaiting Elemental Alignment ✦</div>';

    const { tags, headline, subhead, lore, quote } = analysis;
    const loreList = Array.isArray(lore) ? lore : [lore].filter(Boolean);
    const points = [subhead, ...loreList].filter(Boolean);

    return `
        <div class="single-elemental-banner">
            <div class="elemental-header">
                ✦ <span>${headline}</span> ✦
            </div>

            <ul class="single-reading-points">
                ${points.map(text => `<li>${escapeHTML(text)}</li>`).join('')}
            </ul>

            ${quote ? `<div class="esoteric-quote">${escapeHTML(quote)}</div>` : ''}

            <div class="spread-reading-thread">
                <ol class="spread-reading-steps">
                    ${tags.map(item => `
                        <li class="spread-reading-step">
                            <span class="spread-reading-step-pos">${escapeHTML(item.header)}</span>
                            <span class="spread-reading-step-word">${escapeHTML(item.value)}</span>
                        </li>
                    `).join('')}
                </ol>
            </div>

            ${renderWisdomTeaser(wisdomHeadline)}
        </div>
    `;
}

/** The full Elemental Insight panel for the 3-card spread. Pass an existing analysis to avoid computing it twice. */
export function renderElementalReading(cards, reversed, analysis = analyzeElements(cards, reversed), wisdomHeadline = '') {
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
            ${renderWisdomTeaser(wisdomHeadline)}
        </div>
    `;
}

/**
 * A button for the bottom of the Wisdom reading. The tab controller in main.js handles the click via data-goto-tab.
 * The headline is plain text for a spread and badge HTML for a single card, so it is rendered as-is
 * (both come from elements.js, never from user input) and stripped of tags for the aria-label.
 */
export function renderElementalTeaser(analysis) {
    if (!analysis) return '';
    const rawHeadline = analysis.headline || '';
    const cleanText = rawHeadline.replace(/<[^>]*>/g, '');
    return `
        <button type="button" class="spread-reading-teaser" data-goto-tab="elemental" aria-label="Open Elemental Insight: ${escapeHTML(cleanText)}">
            <span>✦ Elements add nuance: ${rawHeadline}</span>
            <span aria-hidden="true">→</span>
        </button>
    `;
}

/**
 * A button for the bottom of the Elemental reading that points back to Arcanum Wisdom.
 * Pass the Wisdom reading's headline (plain text) to show it; without one it falls back to the generic label.
 */
export function renderWisdomTeaser(headline = '') {
    const text = String(headline || '').trim();
    return `
        <button type="button" class="spread-reading-teaser" data-goto-tab="wisdom" aria-label="Return to Arcanum Wisdom${text ? `: ${escapeHTML(text)}` : ''}">
            <span aria-hidden="true">←</span>
            <span>${text ? `Wisdom speaks: ${escapeHTML(text)}` : 'Wisdom Speaks in layers'} ✦</span>
        </button>
    `;
}
