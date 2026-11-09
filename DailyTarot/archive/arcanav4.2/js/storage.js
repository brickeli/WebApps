// js/storage.js
// localStorage wrappers that never throw. Storage can be blocked (private
// windows, strict browser settings) or hold corrupted JSON; neither should
// stop the app from loading.

export function safeGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

export function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        return false;
    }
}

export function safeRemoveItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        return false;
    }
}

export function safeParse(text, fallback = null) {
    if (text === null || text === undefined || text === '') return fallback;
    try {
        return JSON.parse(text);
    } catch (e) {
        return fallback;
    }
}


const ARCHIVE_MODE_PREFIX = 'archive-';

// Reads ?mode= into { mode: 'single' | 'triple' | 'archive', slug }.
// ?mode=triple            -> the 3-card spread
// ?mode=archive-<card>    -> a card previewed from the Archives, e.g. ?mode=archive-king_wands
export function readURLMode() {
    const raw = (new URLSearchParams(window.location.search).get('mode') || '').toLowerCase();
    if (raw === 'triple') return { mode: 'triple', slug: null };
    if (raw.startsWith(ARCHIVE_MODE_PREFIX) && raw.length > ARCHIVE_MODE_PREFIX.length) {
        return { mode: 'archive', slug: raw.slice(ARCHIVE_MODE_PREFIX.length) };
    }
    return { mode: 'single', slug: null };
}

export function checkURLState(onTripleSpread) {
    if (readURLMode().mode === 'triple' && typeof onTripleSpread === 'function') {
        onTripleSpread();
    }
}

// Writes the mode into the address bar. Each change is a history entry so Back/Forward walk through them;
// pass { replace: true } to tidy the URL without adding one.
export function updateURLMode(mode, cardSlug = null, { replace = false } = {}) {
    const url = new URL(window.location);
    if (mode === 'triple') {
        url.searchParams.set('mode', 'triple');
    } else if (mode === 'archive' && cardSlug) {
        url.searchParams.set('mode', ARCHIVE_MODE_PREFIX + cardSlug);
    } else {
        url.searchParams.delete('mode');
    }
    if (url.toString() === window.location.href) return;   // already there: no duplicate history entry
    window.history[replace ? 'replaceState' : 'pushState']({ path: url.toString() }, '', url.toString());
}
