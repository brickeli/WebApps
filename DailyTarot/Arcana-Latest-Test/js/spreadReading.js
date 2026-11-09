/* ==========================================================================
   SPREAD READING
   Turns a 3-card draw into a short, specific "overall message" by looking at
   the patterns a human reader would notice: Major Arcana, reversals by
   position, repeated suits / numbers, court cards and number sequences.
   Pure functions, no DOM access.
   ========================================================================== */

const POSITIONS = ['Past', 'Present', 'Future'];
const MAX_POINTS = 4;

const RANK_BY_WORD = {
    ace: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10, page: 11, knight: 12, queen: 13, king: 14
};

const RANK_PLURAL = {
    1: 'Aces', 2: 'Twos', 3: 'Threes', 4: 'Fours', 5: 'Fives', 6: 'Sixes', 7: 'Sevens',
    8: 'Eights', 9: 'Nines', 10: 'Tens', 11: 'Pages', 12: 'Knights', 13: 'Queens', 14: 'Kings'
};

const RANK_THEME = {
    1: 'new seeds and fresh starts',
    2: 'choices and balance',
    3: 'growth and collaboration',
    4: 'stability and rest',
    5: 'conflict and change',
    6: 'harmony and transition',
    7: 'tests of resolve',
    8: 'movement and mastery',
    9: 'nearing completion',
    10: 'completion and its weight',
    11: 'messages and learning',
    12: 'pursuit and action',
    13: 'mature, nurturing mastery',
    14: 'authority and command'
};

const SUIT_DOMAIN = {
    wands: 'drive, ambition and action',
    cups: 'feelings and relationships',
    swords: 'thought, truth and conflict',
    pentacles: 'work, money and the body'
};

const ROMAN = { I: 1, V: 5, X: 10, L: 50 };

function romanToInt(str) {
    let total = 0;
    for (let i = 0; i < str.length; i++) {
        const value = ROMAN[str[i]];
        const next = ROMAN[str[i + 1]];
        total += next && next > value ? -value : value;
    }
    return total;
}

function capitalise(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function joinPositions(indexes) {
    const names = indexes.map(i => POSITIONS[i]);
    if (names.length <= 1) return names[0] || '';
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Reduce a card to the facts the patterns care about. */
function describeCard(card, reversed) {
    const isMajor = card.arcana === 'Major Arcana';
    const facts = { card, reversed: !!reversed, isMajor, suit: null, rank: null, number: null, isCourt: false };

    if (isMajor) {
        const match = /^([IVXL]+|0)\./.exec(card.name || '');
        facts.number = match ? (match[1] === '0' ? 0 : romanToInt(match[1])) : null;
    } else {
        const match = /^(\w+) of (\w+)$/.exec(card.originalName || card.name || '');
        if (match) {
            facts.rank = RANK_BY_WORD[match[1].toLowerCase()] || null;
            facts.suit = match[2].toLowerCase();
            facts.isCourt = facts.rank !== null && facts.rank > 10;
        }
    }
    return facts;
}

function groupBy(items, keyFn) {
    const groups = new Map();
    items.forEach((item, index) => {
        const key = keyFn(item);
        if (key === null || key === undefined) return;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(index);
    });
    return groups;
}

/* ---- Pattern detectors: each pushes { priority, headline, text } ---------- */

function majorPatterns(facts, out) {
    const idx = facts.map((f, i) => (f.isMajor ? i : -1)).filter(i => i >= 0);
    if (idx.length === 3) {
        out.push({ priority: 100, headline: 'A Spread of Destiny', text: 'All three cards are Major Arcana: these are the big currents of your life, larger than any single day.' });
    } else if (idx.length === 2) {
        out.push({ priority: 70, headline: 'Weighty Currents', text: `Two Major Arcana, in the ${joinPositions(idx)}: this stretch of your story carries real weight.` });
    } else if (idx.length === 1) {
        out.push({ priority: 40, headline: `The ${POSITIONS[idx[0]]} Holds the Lesson`, text: `The only Major Arcana falls in the ${POSITIONS[idx[0]]}, so that is where the deepest lesson of this spread lives.` });
    } else {
        out.push({ priority: 15, headline: 'Within Your Hands', text: 'No Major Arcana appear: this is about everyday choices and circumstances, and most of it is within your reach.' });
    }
}

const REVERSAL_PATTERNS = {
    '000': { priority: 20, headline: 'Energy Flows Freely', text: 'All three cards are upright: energy moves freely through the spread with little resistance.' },
    '111': { priority: 90, headline: 'A Spread Turned Inward', text: 'All three cards are reversed: resistance runs through every position. Slow down and look inward before pushing outward.' },
    '100': { priority: 35, headline: 'A Weight Lifting', text: 'The Past is reversed while the Present and Future run upright: an old tangle is loosening its hold.' },
    '010': { priority: 35, headline: 'Friction at the Hinge', text: 'Only the Present is reversed: the resistance is happening now, at the hinge of the whole spread.' },
    '001': { priority: 35, headline: 'Foresight Needed', text: 'Only the Future is reversed: the road ahead has friction, which is easier to handle if you meet it early.' },
    '110': { priority: 45, headline: 'Resolution After Struggle', text: 'The Past and Present are reversed but the Future is upright: the struggle resolves as you move forward.' },
    '011': { priority: 45, headline: 'Resistance Building', text: 'The Present and Future are reversed while the Past is upright: what worked before is meeting resistance, so adjust course early.' },
    '101': { priority: 45, headline: 'A Clear Window', text: 'The Present is upright between two reversed cards: right now is a clear window between two tangled chapters.' }
};

function reversalPatterns(facts, out) {
    const key = facts.map(f => (f.reversed ? '1' : '0')).join('');
    out.push(REVERSAL_PATTERNS[key]);
}

function suitPatterns(facts, out) {
    for (const [suit, idx] of groupBy(facts, f => f.suit)) {
        const name = capitalise(suit);
        const domain = SUIT_DOMAIN[suit];
        if (!domain) continue;
        if (idx.length === 3) {
            out.push({ priority: 95, headline: `A Spread Ruled by ${name}`, text: `All three cards are ${name}, so everything here plays out in the arena of ${domain}.` });
        } else if (idx.length === 2) {
            out.push({ priority: 50, headline: `${name} Run Through It`, text: `${name} appear in the ${joinPositions(idx)}, making ${domain} a recurring theme.` });
        }
    }
}

function rankPatterns(facts, out) {
    for (const [rank, idx] of groupBy(facts, f => f.rank)) {
        const plural = RANK_PLURAL[rank];
        const theme = RANK_THEME[rank];
        if (!plural) continue;
        if (idx.length === 3) {
            out.push({ priority: 92, headline: `Triple ${plural}`, text: `Three ${plural}: the theme of ${theme} is the lesson this spread keeps repeating.` });
        } else if (idx.length === 2) {
            out.push({ priority: 55, headline: `Echoing ${plural}`, text: `${plural} appear in the ${joinPositions(idx)}: the theme of ${theme} repeats across the timeline.` });
        }
    }
}

function courtPatterns(facts, out) {
    const idx = facts.map((f, i) => (f.isCourt ? i : -1)).filter(i => i >= 0);
    if (idx.length === 3) {
        out.push({ priority: 80, headline: 'A Gathering of People', text: 'Three court cards: people, roles and personalities matter more than events here.' });
    } else if (idx.length === 2) {
        out.push({ priority: 48, headline: 'Many Faces', text: `Court cards in the ${joinPositions(idx)}: other people, or roles you are stepping into, shape the story.` });
    } else if (idx.length === 1) {
        out.push({ priority: 25, headline: 'A Person Enters', text: `The ${POSITIONS[idx[0]]} is a court card (${facts[idx[0]].card.originalName}): a person, or a role you are growing into.` });
    }
}

function sequencePatterns(facts, out) {
    let nums = null;
    if (facts.every(f => f.isMajor && f.number !== null)) nums = facts.map(f => f.number);
    else if (facts.every(f => !f.isMajor && f.rank !== null && f.rank <= 10)) nums = facts.map(f => f.rank);
    if (!nums) return;

    const [a, b, c] = nums;
    if (b === a + 1 && c === b + 1) {
        out.push({ priority: 85, headline: 'A Clear Progression', text: 'The numbers climb in order: this is a story building step by step.' });
    } else if (b === a - 1 && c === b - 1) {
        out.push({ priority: 85, headline: 'Unwinding in Order', text: 'The numbers fall in order: something is winding down, stage by stage.' });
    } else if (a < b && b < c) {
        out.push({ priority: 45, headline: 'Rising Momentum', text: 'The numbers rise from Past to Future: a situation gathering strength and moving toward completion.' });
    } else if (a > b && b > c) {
        out.push({ priority: 45, headline: 'Winding Down', text: 'The numbers fall from Past to Future: the situation is simplifying and loosening its hold.' });
    }
}


/* ---- Card pairs and Major Arcana phases ---------------------------------- */

/**
 * Curated pairings that read differently together than apart. For a pair
 * [x, y], `forward` applies when x sits earlier in the spread than y and
 * `backward` when it sits later. A pair with only `neutral` ignores order.
 */
const CARD_PAIRS = [
    { ids: ['tower', 'star'],
      forward:  { headline: 'Hope After the Fall', meaning: 'a collapse that clears the ground for healing' }, backward: { headline: 'Hope Disrupted', meaning: 'a hopeful stretch is about to be shaken, so keep your footing' } },
    { ids: ['death', 'sun'],
      forward:  { headline: 'An Ending That Frees', meaning: 'an ending that opens into joy and clarity' }, backward: { headline: 'A Bright Chapter Closing', meaning: 'a bright chapter is closing and a transformation is on its way' } },
    { ids: ['fool', 'world'],
      forward:  { headline: 'A Short Road to Completion', meaning: 'the first step and its fulfilment sit close together' }, backward: { headline: 'A Cycle Renews', meaning: 'one cycle closes and the next begins at once' } },
    { ids: ['hanged_man', 'death'],
      forward:  { headline: 'Surrender, Then Change', meaning: 'a pause or surrender that ripens into real transformation' }, backward: { headline: 'Change, Then Stillness', meaning: 'a transformation followed by a necessary pause to take it in' } },
    { ids: ['judgement', 'world'],
      forward:  { headline: 'Reckoning to Completion', meaning: 'a reckoning that carries you to completion' }, backward: { headline: 'Completion Calls Again', meaning: 'a finished chapter is calling you to answer a deeper question' } },
    { ids: ['moon', 'sun'],
      forward:  { headline: 'Fog Lifting', meaning: 'uncertainty gives way to clarity' }, backward: { headline: 'Clarity Clouding', meaning: 'clarity gives way to doubt, so trust what you already know' } },
    { ids: ['star', 'moon'],
      neutral: { headline: 'Hope in the Dark', meaning: 'hope and uncertainty travel together, so keep faith while the path is unclear' } },
    { ids: ['tower', 'death'],
      neutral: { headline: 'Radical Endings', meaning: 'structures fall and changes become final: resist less, rebuild sooner' } },
    { ids: ['devil', 'lovers'],
      neutral: { headline: 'Choices and Chains', meaning: 'attachment and desire are shaping a choice, so look closely at what binds you' } },
    { ids: ['temperance', 'devil'],
      neutral: { headline: 'Moderation Tested', meaning: 'balance is being tested by excess: where is a pattern out of proportion?' } },
    { ids: ['wheel_of_fortune', 'justice'],
      neutral: { headline: 'Cause and Effect', meaning: 'cycles and consequences: what comes around is what you set in motion' } },
    { ids: ['hermit', 'high_priestess'],
      neutral: { headline: 'The Inner Voice', meaning: 'solitude and intuition: the answers are inward' } },
    { ids: ['empress', 'emperor'],
      neutral: { headline: 'Nurture and Structure', meaning: 'creativity needs boundaries, and structure needs warmth' } },
    { ids: ['magician', 'high_priestess'],
      neutral: { headline: 'Will Meets Intuition', meaning: 'action and inner knowing agree: act on what you sense' } },
    { ids: ['strength', 'chariot'],
      neutral: { headline: 'Gentle Force', meaning: 'drive and self-mastery: steady control beats brute force' } },
    { ids: ['lovers', 'two_cups'],
      neutral: { headline: 'A Meeting of Hearts', meaning: 'a strong partnership theme where connection and choice reinforce each other' } },
    { ids: ['three_swords', 'ten_swords'],
      neutral: { headline: 'The Lowest Point', meaning: 'pain and endings stack up, which usually means the worst is behind you' } },
    { ids: ['fool', 'magician'],
      neutral: { headline: 'Spark Meets Skill', meaning: 'raw potential and focused skill: begin, and bring your craft with you' } },
    { ids: ['hierophant', 'lovers'],
      neutral: { headline: 'Vows and Values', meaning: 'tradition and personal choice meet: commit to what genuinely reflects your values' } },
    { ids: ['high_priestess', 'moon'],
      neutral: { headline: 'Deep Waters', meaning: 'intuition at its strongest and its murkiest: trust the feeling, question the story' } },
    { ids: ['empress', 'death'],
      neutral: { headline: 'The Cycle of Growth', meaning: 'endings and fertility belong to one cycle: what is cleared makes room to grow' } },
    { ids: ['justice', 'judgement'],
      neutral: { headline: 'The Final Account', meaning: 'an honest evaluation: you are asked to own the consequences and answer for them' } },
    { ids: ['sun', 'star'],
      neutral: { headline: 'Clear Skies', meaning: 'warmth and hope together: a genuinely bright stretch' } },
    { ids: ['temperance', 'star'],
      neutral: { headline: 'Gentle Recovery', meaning: 'balance and hope: steady, unhurried healing' } },
    { ids: ['devil', 'tower'],
      forward:  { headline: 'Chains Break', meaning: 'a bondage that cracks open suddenly, painful and freeing at once' },
      backward: { headline: 'Watch What You Cling To', meaning: 'a collapse followed by a new trap, so notice what you reach for after the fall' } },
    { ids: ['ace_cups', 'ten_cups'],
      forward:  { headline: 'Love\'s Full Arc', meaning: 'a new feeling that grows into lasting fulfilment' },
      backward: { headline: 'Joy Renewing', meaning: 'a settled happiness that opens into something new' } },
    { ids: ['eight_pentacles', 'ten_pentacles'],
      forward:  { headline: 'Craft Becomes Legacy', meaning: 'patient work builds lasting security' },
      backward: { headline: 'Security Frees the Craft', meaning: 'stability that lets you deepen your work without pressure' } }
];

// Above "Weighty Currents" (two Major Arcana, 70): most pairs are two Majors, and a specific pairing
// says more than the generic headline. Still below all-Major, all-reversed, same-suit and sequence signals.
const PAIR_PRIORITY = 72;

export const CARD_PAIR_IDS = CARD_PAIRS.map(p => p.ids);

/** Display name without the numeral prefix: "XVI. The Lightning Spire" -> "The Lightning Spire". */
function shortName(card) {
    return String(card.name || '').replace(/^([IVXL]+|0)\.\s*/, '');
}

function pairPatterns(facts, out) {
    for (const pair of CARD_PAIRS) {
        const [idA, idB] = pair.ids;
        const posA = facts.findIndex(f => f.card.id === idA);
        const posB = facts.findIndex(f => f.card.id === idB);
        if (posA < 0 || posB < 0) continue;

        const variant = pair.neutral || (posA < posB ? pair.forward : pair.backward);
        const [first, second] = posA < posB ? [posA, posB] : [posB, posA];
        const anyReversed = facts[posA].reversed || facts[posB].reversed;
        const caveat = anyReversed ? ' With reversed energy here, this is still unfolding or being resisted.' : '';

        out.push({
            priority: PAIR_PRIORITY,
            headline: variant.headline,
            text: `${shortName(facts[first].card)} (${POSITIONS[first]}) and ${shortName(facts[second].card)} (${POSITIONS[second]}): ${variant.meaning}.${caveat}`
        });
    }
}

const MAJOR_PHASES = [
    { max: 7,  headline: 'The Early Path', text: 'The Major Arcana here sit in the first stretch of the journey: identity, learning and the rules you are forming.' },
    { max: 14, headline: 'The Inner Trials', text: 'The Major Arcana here sit in the middle of the journey: testing, balance and inner work.' },
    { max: 21, headline: 'The Late Path', text: 'The Major Arcana here sit in the last stretch of the journey: illusions falling away, hard truths and culmination.' }
];

function majorPhasePatterns(facts, out) {
    const numbers = facts.filter(f => f.isMajor && f.number !== null).map(f => f.number);
    if (numbers.length < 2) return;
    const phaseOf = n => MAJOR_PHASES.findIndex(ph => n <= ph.max);
    const phases = numbers.map(phaseOf);
    if (phases.some(p => p !== phases[0])) return;
    const phase = MAJOR_PHASES[phases[0]];
    out.push({ priority: 58, headline: phase.headline, text: phase.text });
}

/**
 * One keyword per card for the closing "thread". The keyword is plain text and `reversed` is a
 * separate flag, so the page can style the "Reversed" marker itself (see .spread-reading-step-rev).
 */
function keywordThread(facts) {
    return facts.map((f, i) => {
        const word = (f.card.keywords && f.card.keywords[0]) || f.card.originalName || f.card.name;
        return { position: POSITIONS[i], keyword: word, reversed: f.reversed };
    });
}

/**
 * @param {Array} cards     three card objects from the deck
 * @param {Array} reversed  three booleans
 * @returns {{headline: string, points: string[], thread: Array<{position: string, keyword: string, reversed: boolean}>}|null}
 */
export function analyzeSpread(cards, reversed = []) {
    if (!Array.isArray(cards) || cards.length !== 3 || cards.some(c => !c)) return null;

    const facts = cards.map((card, i) => describeCard(card, reversed[i]));
    const found = [];
    majorPatterns(facts, found);
    reversalPatterns(facts, found);
    suitPatterns(facts, found);
    rankPatterns(facts, found);
    courtPatterns(facts, found);
    sequencePatterns(facts, found);
    pairPatterns(facts, found);
    majorPhasePatterns(facts, found);

    // Stable sort: strongest signal first, ties keep detector order.
    const ranked = found
        .map((p, order) => ({ ...p, order }))
        .sort((x, y) => y.priority - x.priority || x.order - y.order);

    return {
        headline: ranked[0].headline,
        points: ranked.slice(0, MAX_POINTS).map(p => p.text),
        thread: keywordThread(facts)
    };
}
