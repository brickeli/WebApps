import { getTodayDateString, shiftDateString } from './helpers.js';

/**
 * Guarded storage. Every localStorage call is wrapped, so a browser with storage
 * blocked (private modes, strict settings, quota) never throws. When storage is
 * unavailable, values live in memory for the current page only.
 * The key names are unchanged, so existing players keep their data.
 */
export const KEYS = {
    // Reactle keeps its original keys, so existing players keep their numbers
    STATS: {
        reactle: { correct: 'reactle_correct', attempts: 'reactle_attempts', streak: 'reactle_streak' },
        nuclear: { correct: 'nuclear_correct', attempts: 'nuclear_attempts', streak: 'nuclear_streak' }
    },
    DAILY_HISTORY: { reactle: 'reactle_daily_history', nuclear: 'nuclear_daily_history' },
    THEME: 'reactle_theme',
    LEGACY_THEME: 'theme',      // read once for old installs, then removed
    SOUND: 'reactle_sound',
    MATRIX: 'reactle_show_matrix_badge'
};

const memory = new Map();

function safeGet(key) {
    try {
        const value = localStorage.getItem(key);
        if (value !== null) return value;
    } catch (e) { /* storage blocked */ }
    return memory.has(key) ? memory.get(key) : null;
}

function safeSet(key, value) {
    const text = String(value);
    memory.set(key, text);
    try { localStorage.setItem(key, text); } catch (e) { /* kept in memory only */ }
}

function safeRemove(key) {
    memory.delete(key);
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

function readBool(key, fallback) {
    const v = safeGet(key);
    return v === null ? fallback : v === 'true';
}

function readInt(key) {
    const n = parseInt(safeGet(key), 10);
    return Number.isFinite(n) ? n : 0;
}

function statKeys(game) {
    const keys = KEYS.STATS[game];
    if (!keys) throw new Error(`Unknown game "${game}". Use 'reactle' or 'nuclear'.`);
    return keys;
}

function historyKey(game) {
    const key = KEYS.DAILY_HISTORY[game];
    if (!key) throw new Error(`Unknown game "${game}". Use 'reactle' or 'nuclear'.`);
    return key;
}

function readHistory(game) {
    try {
        const parsed = JSON.parse(safeGet(historyKey(game)) || '{}');
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
        return {};   // corrupted value: start clean instead of crashing the page
    }
}

export const Storage = {
    // Theme
    getTheme() {
        return safeGet(KEYS.THEME) || safeGet(KEYS.LEGACY_THEME);
    },
    setTheme(theme) {
        safeSet(KEYS.THEME, theme);
        safeRemove(KEYS.LEGACY_THEME);   // the page-load script prefers the old key if it lingers
    },

    // Sound
    getSound() { return readBool(KEYS.SOUND, true); },
    setSound(enabled) { safeSet(KEYS.SOUND, enabled); },

    // Matrix badge
    getMatrixBadge() { return readBool(KEYS.MATRIX, false); },
    setMatrixBadge(enabled) { safeSet(KEYS.MATRIX, enabled); },

    // Game stats (shared by both games, as before)
    getStats(game) {
        const k = statKeys(game);
        return { correct: readInt(k.correct), attempts: readInt(k.attempts), streak: readInt(k.streak) };
    },
    saveStats(game, correct, attempts, streak) {
        const k = statKeys(game);
        safeSet(k.correct, correct);
        safeSet(k.attempts, attempts);
        safeSet(k.streak, streak);
    },

    // Daily challenge
    // Each game keeps its own history, so each has its own daily puzzle and streak
    getDailyHistory(game) { return readHistory(game); },
    setDailyHistory(game, history) { safeSet(historyKey(game), JSON.stringify(history)); },

    getDailyStreak(game) {
        const history = readHistory(game);
        const dates = Object.keys(history)
            .filter(d => history[d] && history[d].completed)
            .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

        if (dates.length === 0) return 0;

        const todayStr = getTodayDateString();
        const yesterdayStr = shiftDateString(todayStr, -1);
        if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

        let streak = 0;
        let checkDate = dates[0];
        while (history[checkDate] && history[checkDate].completed) {
            streak++;
            checkDate = shiftDateString(checkDate, -1);
        }
        return streak;
    }
};
