import { PERIODIC_TABLE, NUCLEAR_PARTICLES } from '../data/periodicTable.js';

export function hashDateString(str, seed = 0x97f29ac1) {
    let h1 = seed;
    for (let i = 0; i < str.length; i++) {
        let k1 = str.charCodeAt(i);
        k1 = Math.imul(k1, 0xcc9e2d51);
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = Math.imul(k1, 0x1b873593);
        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1 = Math.imul(h1, 5) + 0xe6546b64;
    }
    h1 ^= str.length;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;
    return h1 >>> 0;
}

// Returns today's date formatted as 'YYYY-MM-DD'
// ---------------------------------------------------------------------------
// Daily puzzle clock. The puzzle day rolls over at midnight US Eastern Time
// (America/New_York, so it follows EST/EDT) for every player, which keeps the
// puzzle number and shared results the same worldwide.
// ---------------------------------------------------------------------------
export const DAILY_TIME_ZONE = 'America/New_York';

const easternFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
});

function easternParts(date) {
    const p = {};
    easternFormatter.formatToParts(date).forEach(part => { p[part.type] = part.value; });
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

/** Today's puzzle date as 'YYYY-MM-DD' in Eastern Time. */
export function getTodayDateString(date = new Date()) {
    const p = easternParts(date);
    return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** Adds (or subtracts) whole days to a 'YYYY-MM-DD' string. */
export function shiftDateString(dateStr, days) {
    const t = new Date(`${dateStr}T12:00:00Z`);
    t.setUTCDate(t.getUTCDate() + days);
    return t.toISOString().slice(0, 10);
}

/** The instant (ms since epoch) at which the Eastern calendar day `dateStr` begins. */
export function easternMidnight(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const wanted = Date.UTC(y, m - 1, d);
    let t = wanted;
    for (let i = 0; i < 2; i++) {   // two passes settle the offset, including on daylight-saving days
        const p = easternParts(new Date(t));
        t += wanted - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
    }
    return t;
}

export function getDailyChallengeNumber(launchDateStr = '2026-01-01', date = new Date()) {
    const days = (Date.parse(`${getTodayDateString(date)}T00:00:00Z`) - Date.parse(`${launchDateStr}T00:00:00Z`)) / 86400000;
    return Math.round(days) + 1;
}

export function startDailyCountdownTimer(containerEl) {
    function updateTimer() {
        const now = new Date();
        const nextReset = easternMidnight(shiftDateString(getTodayDateString(now), 1));
        const diffMs = Math.max(0, nextReset - now.getTime());

        const h = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const s = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');

        if (containerEl) {
            containerEl.innerHTML = `<i class="fa-solid fa-clock"></i> Next Daily in ${h}:${m}:${s}`;
        }
    }
    updateTimer();
    if (window.dailyTimerInterval) clearInterval(window.dailyTimerInterval);
    window.dailyTimerInterval = setInterval(updateTimer, 1000);
}

export function calculateAccuracy(correct, attempts) {
    if (!attempts || attempts <= 0) return 0;
    return Math.round((correct / attempts) * 100);
}

// Create subscripts within Custom Solver
export function formatSubscripts(formulaStr) {
    if (!formulaStr) return '';
    return formulaStr.replace(/([A-Za-z\)])(\d+)/g, '$1<sub>$2</sub>');
}

// Selects a random item from an array that differs from the current item
export function getRandomDifferentItem(array, currentItem) {
    if (!array || array.length === 0) return null;
    if (array.length === 1) return array[0];

    let nextItem;
    do {
        nextItem = array[Math.floor(Math.random() * array.length)];
    } while (nextItem === currentItem);

    return nextItem;
}

export function getParticleName(symbol) {
    const names = {
        'n': 'Neutron',
        'p': 'Proton',
        'α': 'Alpha Particle (Helium-4 Nucleus)',
        'β⁻': 'Beta-Minus Particle (Electron)',
        'β⁺': 'Positron (Antielectron)',
        'γ': 'Gamma Ray Photon'
    };
    return names[symbol] || 'Subatomic Particle';
}

/**
 * Normalizes nuclear equation terms and isotope strings to match PERIODIC_TABLE or NUCLEAR_PARTICLES keys
 * @param {Object} term - Nuclear reaction term object
 * @returns {string|null} Normalized symbol key
 */
 export function extractSymbol(term) {
     if (!term) return null;

     // 1. For selectable particle slots, return chosen particle symbol or '?' if unselected
     let rawSym = term.isSelectable
         ? (term.selectedParticle?.symbol || '?')
         : (term.symbol || term.element || term.rawStr);

     if (!rawSym) return null;

     // 2. Direct match for subatomic particles, elements, and mystery placeholder '?'
     if (rawSym === '?' || NUCLEAR_PARTICLES[rawSym] || PERIODIC_TABLE[rawSym]) {
         return rawSym;
     }

     // 3. Strip mass numbers, digits, and hyphens (e.g., "U235" -> "U", "Ba-141" -> "Ba")
     const cleaned = rawSym.replace(/[^a-zA-Z]/g, '');
     if (!cleaned) return null;

     const formatted = cleaned.length === 1
         ? cleaned.toUpperCase()
         : cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();

     if (PERIODIC_TABLE[formatted] || NUCLEAR_PARTICLES[formatted]) {
         return formatted;
     }

     return formatted;
 }
