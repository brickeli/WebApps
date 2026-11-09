// js/journal.js
// The reading journal (localStorage). Every write re-reads storage first, so two open tabs
// can't overwrite each other's entries with a stale copy.

import { safeGetItem, safeSetItem, safeRemoveItem, safeParse } from './storage.js';

export const HISTORY_KEY = 'arcana_tarot_history';
export const SAVE_FAILED_MSG = "Couldn't save: your browser is blocking storage or it is full.";

export function loadHistory() {
    const parsed = safeParse(safeGetItem(HISTORY_KEY), []);
    return Array.isArray(parsed) ? parsed.filter(e => e && typeof e === 'object') : [];
}

function saveHistory(list) {
    return safeSetItem(HISTORY_KEY, JSON.stringify(list));
}

// Newest first. Returns true when the entry was stored.
export function addJournalEntry(entry) {
    const list = loadHistory();
    list.unshift(entry);
    return saveHistory(list);
}

// `expected` is the entry the page showed at that index; if another tab changed the list since, nothing is deleted.
// Returns 'ok', 'stale' (list changed elsewhere) or 'failed' (storage blocked).
export function removeJournalEntry(index, expected) {
    const list = loadHistory();
    if (index < 0 || index >= list.length || JSON.stringify(list[index]) !== JSON.stringify(expected)) return 'stale';
    list.splice(index, 1);
    return saveHistory(list) ? 'ok' : 'failed';
}

export function clearJournal() {
    return safeRemoveItem(HISTORY_KEY);
}
