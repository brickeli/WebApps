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
