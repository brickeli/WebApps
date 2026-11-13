/* ==========================================================================
   ARCHIVE KEEPSAKE
   The special view shown when a card is opened from the Archives: one line of
   advice (card.advice) and one line of elemental wisdom (the element's blurb
   from elements.js), set apart as a small keepsake above the card details.
   The Wisdom / Elemental tabs belong to a drawn reading, so they are hidden
   while previewing and come back as soon as the visitor returns to Daily Card.
   ========================================================================== */
import { escapeHTML } from './common.js';
import { analyzeElementalCard, getElementKey } from './elements.js';
import { shortName } from './singleReading.js';

const KEEPSAKE_ID = 'archive-keepsake';
const TABS_ID = 'tarot-insights-container';

/** Markup for the keepsake. Returns '' when the card has nothing to show. */
export function renderArchiveKeepsake(card) {
    if (!card) return '';
    const elem = analyzeElementalCard(card, false);
    const advice = String(card.advice || '').trim();
    if (!elem || (!advice && !elem.quote)) return '';

    const key = getElementKey(card) || 'fire';
    const attribute = elem.tags?.[0]?.value || '';
    const name = shortName(card) || card.name;

    return `
        <div class="keepsake-header"><span aria-hidden="true">✦</span> Words of the Arcana <span aria-hidden="true">✦</span></div>

        ${advice ? `
            <figure class="keepsake-advice">
                <blockquote>“${escapeHTML(advice)}”</blockquote>
                <figcaption>${escapeHTML(name)}</figcaption>
            </figure>
        ` : ''}

        ${advice && elem.quote ? '<div class="keepsake-divider" aria-hidden="true"><span>✦</span></div>' : ''}

        ${elem.quote ? `
            <div class="keepsake-element">
                <span class="keepsake-element-label">
                    ✦ ${escapeHTML(elem.element)}${attribute ? ` · ${escapeHTML(attribute)}` : ''} ✦
                </span>
                <blockquote>“${escapeHTML(elem.quote)}”</blockquote>
            </div>
        ` : ''}
    `;
}

/**
 * Shows the keepsake for `card` and hides the reading tabs, or (card = null) removes it and restores them.
 * Safe to call repeatedly; it reuses one element.
 */
export function syncArchiveKeepsake(card) {
    const tabs = document.getElementById(TABS_ID);
    if (!tabs) return;

    let box = document.getElementById(KEEPSAKE_ID);
    const html = card ? renderArchiveKeepsake(card) : '';

    if (!html) {
        box?.remove();
        tabs.classList.remove('hidden');
        return;
    }

    if (!box) {
        box = document.createElement('section');
        box.id = KEEPSAKE_ID;
        tabs.parentNode.insertBefore(box, tabs);
    }
    box.className = `archive-keepsake keepsake-${getElementKey(card) || 'fire'}`;
    box.setAttribute('aria-label', `Words of wisdom for ${card.originalName || card.name}`);
    box.innerHTML = html;
    tabs.classList.add('hidden');
}
