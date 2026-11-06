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
    } catch (e) {}
}

export function safeParse(text, fallback = null) {
    if (text === null || text === undefined || text === '') return fallback;
    try {
        return JSON.parse(text);
    } catch (e) {
        return fallback;
    }
}


export function checkURLState(onTripleSpread) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'triple') {
        if (typeof onTripleSpread === 'function') {
            onTripleSpread();
        }
    }
}

export function updateURLMode(mode) {
    const url = new URL(window.location);
    if (mode === 'triple') {
        url.searchParams.set('mode', 'triple');
    } else {
        url.searchParams.delete('mode');
    }
    if (url.toString() === window.location.href) return;   // already there: no duplicate history entry
    window.history.pushState({ path: url.toString() }, '', url.toString());
}
