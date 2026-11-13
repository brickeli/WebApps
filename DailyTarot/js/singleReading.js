/* ==========================================================================
   SINGLE READING
   Generates dynamic headers, contextual framing, and focal quotes for a
   single-card pull by analyzing arcana depth, orientation, court roles,
   and suit domains.
   Pure functions apart from the HTML builder at the bottom.

   Expects deck cards to carry `suit` and `rank` for Minor Arcana
   (cardLibrary.js derives them from `originalName`).
   ========================================================================== */

import { escapeHTML } from './common.js';
import { renderElementalTeaser } from './elementsView.js';

const SUIT_DOMAINS = {
    wands: { domain: 'drive, ambition, and creative force', focus: 'Action & Vision' },
    cups: { domain: 'emotion, intuition, and connection', focus: 'Heart & Alignment' },
    swords: { domain: 'mind, truth, and mental clarity', focus: 'Clarity & Truth' },
    pentacles: { domain: 'work, resources, and physical reality', focus: 'Grounding & Craft' }
};

const COURT_ROLES = {
    page: { title: 'The Student', theme: 'a message, curiosity, or a fresh perspective entering your field' },
    knight: { title: 'The Catalyst', theme: 'focused drive, pursuit, or sudden movement toward a goal' },
    queen: { title: 'The Sovereign', theme: 'inner mastery, emotional or intuitive maturity, and quiet presence' },
    king: { title: 'The Commander', theme: 'external authority, structure, and command over your environment' }
};

/** Display name without the numeral prefix: "XVI. The Lightning Spire" -> "The Lightning Spire". */
export function shortName(card) {
    return String((card && card.name) || '').replace(/^([IVXL]+|0)\.\s*/, '');
}

/**
 * Normalizes card properties into a predictable descriptor object.
 */
function describeSingleCard(card, isReversed = false) {
    const isMajor = card.arcana === 'Major Arcana' || card.type === 'major';
    const suit = card.suit ? String(card.suit).toLowerCase() : null;
    const rankStr = card.rank ? String(card.rank).toLowerCase() : '';

    const isCourt = !isMajor && ['page', 'knight', 'queen', 'king'].includes(rankStr);

    return {
        card,
        reversed: !!isReversed,
        isMajor,
        isCourt,
        courtRole: isCourt ? rankStr : null,
        suit: !isMajor ? suit : null
    };
}

/**
 * Determines appropriate header & value combinations for single-card tag displays.
 * Returns an array of structured { header, value } pairs.
 */
export function getCardTag(facts) {
    // 1. Major Arcana
    if (facts.isMajor) {
        return [
            { header: 'REALM', value: 'Major Arcana' },
            { header: 'AXIS',  value: facts.reversed ? 'Subconscious Turning' : 'Core Trajectory' }
        ];
    }
    // 2. Court Cards
    if (facts.isCourt) {
        const role = COURT_ROLES[facts.courtRole]?.title || 'Court Persona';
        return [
            { header: 'PERSONA', value: role },
            { header: 'FOCUS',   value: facts.reversed ? 'Inner Sovereignty' : 'Active Presence' }
        ];
    }
    // 3. Minor Arcana Number Cards
    const suitInfo = SUIT_DOMAINS[facts.suit];
    const focusLabel = suitInfo ? suitInfo.focus : 'Practical Reality';

    return [
        { header: 'DOMAIN', value: focusLabel },
        { header: 'STATE',  value: facts.reversed ? 'Re-aligning' : 'Purposeful Energy' }
    ];
}

/**
 * Builds dynamic headlines based on orientation, arcana level, and suit/court attributes.
 */
function buildHeadline(facts) {
    const cardName = shortName(facts.card);

    // 1. Major Arcana Patterns
    if (facts.isMajor) {
        if (facts.reversed) {
            return {
                headline: `The Shadow of ${cardName}`,
                subhead: 'A foundational life lesson turning inward for personal integration.'
            };
        }
        return {
            headline: `The Horizon of ${cardName}`,
            subhead: 'A foundational current directing your long-term course.'
        };
    }

    // 2. Court Card Patterns
    if (facts.isCourt) {
        const roleData = COURT_ROLES[facts.courtRole];
        const suitData = SUIT_DOMAINS[facts.suit];
        const domainText = suitData ? suitData.domain : 'this area of life';

        if (facts.reversed) {
            return {
                headline: `Internalizing ${cardName}`,
                subhead: `Embodying ${roleData.theme} through quiet reflection rather than external action.`
            };
        }
        return {
            headline: `Embodying ${cardName}`,
            subhead: `Stepping into ${roleData.theme} across ${domainText}.`
        };
    }

    // 3. Minor Arcana Number Cards
    const suitData = SUIT_DOMAINS[facts.suit] || { domain: 'your present experience' };
    if (facts.reversed) {
        return {
            headline: `Realigning the ${cardName}`,
            subhead: `Energy around ${suitData.domain} meets internal friction or calls for a pause.`
        };
    }
    return {
        headline: `Calling the ${cardName}`,
        subhead: `Expressive motion unfolding within ${suitData.domain}.`
    };
}

/**
 * Selects or synthesizes a focal quote/affirmation for the reading hero banner.
 */
function buildQuote(facts) {
    // Priority: explicit card quote -> synthesized quote
    if (facts.card.quote) {
        return facts.card.quote;
    }

    if (facts.isMajor) {
        return facts.reversed
            ? 'What is resisted externally invites quiet transformation within.'
            : 'Align with the larger forces already at work around you.';
    }

    if (facts.isCourt) {
        return facts.reversed
            ? 'Mastery begins by governing your own inner landscape.'
            : 'Bring active presence and intentional leadership to your space.';
    }

    const suitQuotes = {
        wands: facts.reversed ? 'Conserve your fire; redirect momentum where it counts.' : 'Act on the spark before the momentum fades.',
        cups: facts.reversed ? 'Let the waters settle before seeking total clarity.' : 'Trust what your emotional field is signaling.',
        swords: facts.reversed ? 'Quiet the inner noise to let objective truth emerge.' : 'Cut through distraction with decisive honesty.',
        pentacles: facts.reversed ? 'Tend to the foundations before building upward.' : 'Ground your intention through steady, practical effort.'
    };

    return suitQuotes[facts.suit] || 'Observe where energy is flowing and meet it with intention.';
}

/**
 * Main export function for single card readings.
 *
 * @param {Object} card - Single card object from deck
 * @param {boolean} isReversed - Whether the card is inverted
 * @returns {{ tag: Array<{header: string, value: string}>, headline: string, subhead: string,
 *             quote: string, reversed: boolean }|null}
 */
export function analyzeSingleCard(card, isReversed = false) {
    if (!card) return null;

    const facts = describeSingleCard(card, isReversed);
    const tag = getCardTag(facts);
    const { headline, subhead } = buildHeadline(facts);
    const quote = buildQuote(facts);

    return {
        tag,
        headline,
        subhead,
        quote,
        reversed: facts.reversed
    };
}

/**
 * Inner markup for the Arcanum Wisdom panel. main.js injects it into #tab-content-wisdom,
 * so this must not wrap itself in another .insight-tab-panel.
 * Pass an existing `reading` / `elementalAnalysis` to avoid computing them twice.
 */
export function renderSingleReading(card, reversed = false, elementalAnalysis = null, reading = analyzeSingleCard(card, reversed)) {
    if (!reading) return '<div class="tarot-guidance-quote">✦ Awaiting Your Draw ✦</div>';

    const tagPairs = Array.isArray(reading.tag) ? reading.tag : [];
    const adviceText = card.advice || '';

    return `
        <div class="tarot-guidance-quote">
            <div class="esoteric-scroll-header">
                ✦ <span>${escapeHTML(reading.headline)}</span> ✦
            </div>
            ${reading.subhead ? `
                <ul class="single-reading-points">
                    <li>${escapeHTML(reading.subhead)}</li>
                    <li>${escapeHTML(reading.quote)}</li>
                </ul>
            ` : ''}
            ${adviceText ? `
                <div class="esoteric-quote">${escapeHTML(adviceText)}</div>
            ` : ''}
            <div class="spread-reading-thread">
                <ol class="spread-reading-steps">
                    ${tagPairs.map(item => `
                        <li class="spread-reading-step">
                            <span class="spread-reading-step-pos">${escapeHTML(item.header)}</span>
                            <span class="spread-reading-step-word">${escapeHTML(item.value)}</span>
                        </li>
                    `).join('')}
                </ol>
            </div>
            ${renderElementalTeaser(elementalAnalysis)}
        </div>
    `;
}
