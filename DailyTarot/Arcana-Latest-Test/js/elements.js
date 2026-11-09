/* ==========================================================================
   ELEMENT READING
   The Elemental Insight counterpart to spreadReading.js. Same shape: small
   detectors push { priority, headline, text }, the strongest rise to the top.
   Where the Wisdom reading talks about cards, suits and patterns, this one
   talks about temperament: which energies lead, which are missing, how they
   move from Past to Future, and where they pull against each other.
   Pure functions, no DOM access.
   ========================================================================== */

import { ELEMENTAL_LORE } from './cardLibrary.js';

export const ELEMENTS = ['Fire', 'Water', 'Air', 'Earth'];

const POSITIONS = ['Past', 'Present', 'Future'];
const MAX_POINTS = 3;
const BALANCED_LORE = 'A harmonious equilibrium of cosmic forces flowing through the timeline.';

/** Every card in cardLibrary.js carries an `element`; suit/coin fallbacks are kept for older saved data. */
export function getElement(card) {
    if (!card) return null;
    const s = String(card.element || card.suit || '').toLowerCase();
    if (s.includes('fire') || s.includes('wand')) return 'Fire';
    if (s.includes('water') || s.includes('cup')) return 'Water';
    if (s.includes('air') || s.includes('sword')) return 'Air';
    if (s.includes('earth') || s.includes('pentacle') || s.includes('coin')) return 'Earth';
    return null;
}

/* ---- Wording tables -------------------------------------------------------- */

const TEMPER = {
    Fire:  { trait: 'drive, heat and momentum',               excess: 'burning out or rushing ahead',     lack: 'initiative' },
    Water: { trait: 'feeling, intuition and connection',      excess: 'being swept along by mood',        lack: 'emotional honesty' },
    Air:   { trait: 'thought, words and perspective',         excess: 'overthinking',                     lack: 'clear thinking' },
    Earth: { trait: 'practicality, the body and steady work', excess: 'rigidity and holding on too tight', lack: 'grounding' }
};

const BLOCKED = {
    Fire:  'drive is stalling or burning too hot',
    Water: 'feelings are being held back or are overflowing',
    Air:   'thinking is clouded or cutting too sharply',
    Earth: 'practical matters feel shaky or too rigid'
};

const FLOW = {
    'Fire>Water':  'drive softens into feeling',
    'Fire>Air':    'action gives way to reflection and words',
    'Fire>Earth':  'enthusiasm settles into practical work',
    'Water>Fire':  'feeling turns into action',
    'Water>Air':   'emotion finds language and perspective',
    'Water>Earth': 'feeling takes tangible form',
    'Air>Fire':    'ideas ignite into action',
    'Air>Water':   'thinking gives way to feeling',
    'Air>Earth':   'ideas become form',
    'Earth>Fire':  'steady ground sparks new drive',
    'Earth>Water': 'stability opens into feeling',
    'Earth>Air':   'routine opens into new ideas'
};

// Keys are the two element names in alphabetical order.
const TENSION = {
    'Fire+Water': 'drive and feeling pull against each other, so what you want to do and what you feel may not agree yet',
    'Air+Earth':  'ideas and practicality pull against each other, so the plan and the ground it stands on need reconciling'
};

const HARMONY = {
    'Air+Fire':    'ideas feed action and action sharpens ideas, so momentum comes easily',
    'Earth+Water': 'feeling and practicality support each other, so care becomes something that actually gets built'
};

/* ---- Small helpers ----------------------------------------------------------- */

function joinList(items) {
    if (items.length <= 1) return items[0] || '';
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function joinPositions(indexes) {
    return joinList(indexes.map(i => POSITIONS[i]));
}

function positionsOf(elems, element) {
    return elems.map((e, i) => (e === element ? i : -1)).filter(i => i >= 0);
}

/** Display name without the numeral prefix: "XVI. The Lightning Spire" -> "The Lightning Spire". */
function shortName(card) {
    return String(card.name || '').replace(/^([IVXL]+|0)\.\s*/, '');
}

function pairKey(a, b) {
    return [a, b].sort().join('+');
}

/* ---- Pattern detectors: each pushes { priority, headline, text } ---------- */

function dominancePatterns(ctx, out) {
    const { elems, counts } = ctx;
    for (const el of ELEMENTS) {
        const n = counts[el];
        const t = TEMPER[el];
        if (n === 3) {
            out.push({
                priority: 95,
                headline: `Pure ${el}`,
                text: `All three cards carry ${el} energy: ${t.trait} saturate this spread with nothing to balance them, so watch for ${t.excess}.`
            });
        } else if (n === 2) {
            const other = elems.find(e => e && e !== el);
            out.push({
                priority: 70,
                headline: `${el} Leads`,
                text: `${el} appears in the ${joinPositions(positionsOf(elems, el))}: ${t.trait} set the tone, with ${other || 'the remaining card'} as the counterweight.`
            });
        }
    }
}

function distinctPatterns(ctx, out) {
    if (ctx.known === 3 && ELEMENTS.filter(e => ctx.counts[e]).length === 3) {
        out.push({
            priority: 66,
            headline: 'Three Elements, One Silent',
            text: 'Three different elements share this spread, so no single temperament runs the show.'
        });
    }
}

function absencePatterns(ctx, out) {
    if (ctx.known < 3) return;
    const missing = ELEMENTS.filter(e => !ctx.counts[e]);
    if (missing.length === 1) {
        const [m] = missing;
        out.push({
            priority: 60,
            headline: `${m} Is Silent`,
            text: `Nothing here speaks for ${m}, so ${TEMPER[m].lack} may need deliberate attention.`
        });
    } else if (missing.length === 2) {
        const [a, b] = missing;
        out.push({
            priority: 42,
            headline: `${a} and ${b} Absent`,
            text: `Neither ${a} nor ${b} appears, so ${TEMPER[a].lack} and ${TEMPER[b].lack} are the gaps to watch.`
        });
    }
}

function flowPatterns(ctx, out) {
    const { elems } = ctx;
    const steps = [];
    for (let i = 0; i < 2; i++) {
        const a = elems[i];
        const b = elems[i + 1];
        if (a && b && a !== b) steps.push({ from: i, to: i + 1, a, b, phrase: FLOW[`${a}>${b}`] });
    }
    if (steps.length === 0) return;

    if (steps.length === 1) {
        const s = steps[0];
        out.push({
            priority: 52,
            headline: `${s.a} Into ${s.b}`,
            text: `${POSITIONS[s.from]} to ${POSITIONS[s.to]}, ${s.a} into ${s.b}: ${s.phrase}.`
        });
    } else {
        const [s1, s2] = steps;
        out.push({
            priority: 58,
            headline: s1.a === s2.b ? `${s1.a} Returns` : `${s1.a} to ${s2.b}`,
            text: `Past to Present: ${s1.phrase}; then Present to Future: ${s2.phrase}.`
        });
    }
}

function relationPatterns(ctx, out) {
    const present = ELEMENTS.filter(e => ctx.counts[e]);
    for (let i = 0; i < present.length; i++) {
        for (let j = i + 1; j < present.length; j++) {
            const a = present[i];
            const b = present[j];
            const key = pairKey(a, b);
            if (TENSION[key]) {
                out.push({ priority: 50, headline: `${a} and ${b} in Tension`, text: `${a} and ${b} meet here: ${TENSION[key]}.` });
            } else if (HARMONY[key]) {
                out.push({ priority: 44, headline: `${a} and ${b} in Harmony`, text: `${a} and ${b} meet here: ${HARMONY[key]}.` });
            }
        }
    }
}

function reversalPatterns(ctx, out) {
    const rev = ctx.elems
        .map((el, i) => ({ el, i }))
        .filter(x => x.el && ctx.reversed[x.i]);
    if (rev.length === 0) return;

    const leader = ctx.leaders.length === 1 && ctx.counts[ctx.leaders[0]] >= 2 ? ctx.leaders[0] : null;
    const sameElement = rev.every(x => x.el === rev[0].el);

    if (sameElement && rev.length >= 2 && rev.length === ctx.counts[rev[0].el]) {
        const el = rev[0].el;
        out.push({
            must: true,
            priority: 76,
            headline: `${el} Turned Inward`,
            text: `Every ${el} card here is reversed (${joinPositions(rev.map(x => x.i))}): ${BLOCKED[el]}.`
        });
    } else if (rev.length === 1) {
        const { el, i } = rev[0];
        const leaderNote = el === leader ? ` Since ${el} leads this spread, that matters more than usual.` : '';
        out.push({
            must: true,
            priority: leaderNote ? 62 : 47,
            headline: `${el} Out of Tune`,
            text: `${el} in the ${POSITIONS[i]} is reversed: ${BLOCKED[el]}.${leaderNote}`
        });
    } else {
        const list = joinList(rev.map(x => `${x.el} (${POSITIONS[x.i]})`));
        out.push({
            must: true,
            priority: 52,
            headline: 'Energies Out of Tune',
            text: `Reversals touch ${list}: those energies are blocked, excessive or still being worked through, so give them extra attention.`
        });
    }
}

/* ---- Summary fields (replace the old calculateElementalBalance) ---------- */

function summarise(counts, known) {
    const percentages = {};
    for (const el of ELEMENTS) percentages[el] = known ? Math.round((counts[el] / known) * 100) : 0;

    const maxCount = Math.max(...ELEMENTS.map(el => counts[el]));
    const leaders = ELEMENTS.filter(el => counts[el] === maxCount);

    let dominant;
    let lore;
    let cssElement = '';
    if (leaders.length === 1) {
        dominant = leaders[0];
        lore = ELEMENTAL_LORE[dominant] || '';
        cssElement = dominant.toLowerCase();
    } else if (leaders.length === 2) {
        dominant = leaders.join(' & ');
        lore = leaders.map(l => ELEMENTAL_LORE[l] || '').join(' ');
    } else {
        dominant = 'Balanced';
        lore = BALANCED_LORE;
    }
    return { percentages, leaders, dominant, lore, cssElement };
}

/**
 * @param {Array} cards     three card objects from the deck
 * @param {Array} reversed  three booleans
 * @returns {{headline: string, points: string[], counts: object, percentages: object,
 *            leaders: string[], dominant: string, lore: string, cssElement: string,
 *            flow: Array}|null}
 */
export function analyzeElements(cards, reversed = []) {
    if (!Array.isArray(cards) || cards.length !== 3 || cards.some(c => !c)) return null;

    const elems = cards.map(getElement);
    const known = elems.filter(Boolean).length;
    if (known === 0) return null;

    const counts = { Fire: 0, Water: 0, Air: 0, Earth: 0 };
    elems.forEach(e => { if (e) counts[e]++; });

    const summary = summarise(counts, known);
    const ctx = {
        elems,
        reversed: cards.map((_, i) => !!reversed[i]),
        counts,
        known,
        leaders: summary.leaders
    };

    const found = [];
    dominancePatterns(ctx, found);
    distinctPatterns(ctx, found);
    absencePatterns(ctx, found);
    flowPatterns(ctx, found);
    relationPatterns(ctx, found);
    reversalPatterns(ctx, found);
    if (found.length === 0) found.push({ priority: 0, headline: 'Elements in Balance', text: BALANCED_LORE });

    // Stable sort: strongest signal first, ties keep detector order.
    const ranked = found
        .map((p, order) => ({ ...p, order }))
        .sort((x, y) => y.priority - x.priority || x.order - y.order);

    // A reversed card should never go unmentioned: if reversals would be crowded out, they take the last slot.
    const top = ranked.slice(0, MAX_POINTS);
    const mustShow = ranked.find(p => p.must);
    if (mustShow && !top.includes(mustShow)) top[top.length - 1] = mustShow;

    return {
        headline: ranked[0].headline,
        points: top.map(p => p.text),
        counts,
        percentages: summary.percentages,
        leaders: summary.leaders,
        dominant: summary.dominant,
        lore: summary.lore,
        cssElement: summary.cssElement,
        flow: cards.map((card, i) => ({
            position: POSITIONS[i],
            element: elems[i],
            name: shortName(card),
            reversed: ctx.reversed[i]
        }))
    };
}
