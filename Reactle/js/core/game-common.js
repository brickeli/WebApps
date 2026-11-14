/**
 * Code shared by Reactle and Nuclear Reactle (pass 1: scoreboard, share, mode switching).
 * Put at js/core/game-common.js. Each game passes its name ('reactle' | 'nuclear').
 */
import { Storage } from '../utils/storage.js';
import { playSound } from '../engine/audio.js';
import { calculateAccuracy, getDailyChallengeNumber, hashDateString, getTodayDateString, startDailyCountdownTimer, getRandomDifferentItem } from '../utils/helpers.js';

const $ = (id) => document.getElementById(id);

/* ---------- Scoreboard (solved / attempts / accuracy / streak) ---------- */
export function createScoreboard(game) {
    let correct = 0;
    let attempts = 0;

    const render = () => {
        const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
        set('score-correct', correct);
        set('score-attempts', attempts);
        set('score-accuracy', `${calculateAccuracy(correct, attempts)}%`);
        set('streak-count', Storage.getDailyStreak(game));
    };
    const save = () => Storage.saveStats(game, correct, attempts, Storage.getDailyStreak(game));

    return {
        load() {
            const stats = Storage.getStats(game);
            correct = stats.correct;
            attempts = stats.attempts;
            render();
        },
        // call AFTER the daily history has been written, so the streak shown is current
        recordAttempt(isCorrect) {
            attempts++;
            if (isCorrect) correct++;
            save();
            render();
        },
        reset() {   // never touches the daily streak
            playSound('click');
            correct = 0;
            attempts = 0;
            save();
            render();
        },
        render
    };
}

/* ---------- Share ---------- */
export function shareDailyResult({ game, title, emoji, url, onCopied }) {
    playSound('click');
    const text = `${title} Daily #${getDailyChallengeNumber('2026-01-01')} ${emoji}\n` +
                 `Streak: ${Storage.getDailyStreak(game)} 🔥 | Solved in Daily Challenge Mode!\n${url}`;

    if (navigator.share) {
        navigator.share({ title: `${title} Daily Challenge`, text }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => onCopied?.()).catch(() => {});
    }
}

/* ---------- Mode switching (daily / practice / solver) ---------- */

// Maps internal tab keys <-> clean URL query values
const MODE_TO_QUERY = { practice: 'practice', daily: 'daily', solver: 'custom' };
const QUERY_TO_MODE = { practice: 'practice', daily: 'daily', custom: 'solver', solver: 'solver' };
const DEFAULT_MODE = 'daily';

export function getModeFromURL() {
    const raw = new URLSearchParams(window.location.search).get('mode')?.toLowerCase();
    return QUERY_TO_MODE[raw] || DEFAULT_MODE;
}

function syncModeURL(mode, replace = false) {
    const url = new URL(window.location.href);
    const queryVal = MODE_TO_QUERY[mode] || DEFAULT_MODE;

    if (queryVal === DEFAULT_MODE) {
        url.searchParams.delete('mode');
    } else {
        url.searchParams.set('mode', queryVal);
    }
    if (url.href === window.location.href) return;
    window.history[replace ? 'replaceState' : 'pushState']({ mode }, '', url);
}

export function createModeSwitcher({ icons, onDaily, onPractice }) {
    function switchMode(mode, { updateURL = true, replace = false, silent = false } = {}) {
        if (!silent) playSound('click');

        const select = $('mode-dropdown');
        if (select) select.value = mode;
        const iconEl = $('mode-dropdown-icon');
        if (iconEl) iconEl.className = `fa-solid ${icons[mode] || icons.practice}`;

        ['practice', 'daily', 'solver'].forEach((key) => {
            $(`nav-${key}`)?.classList.toggle('is-active', key === mode);
        });

        $('feedback-banner')?.classList.add('hidden');

        if (updateURL) {
            syncModeURL(mode, replace);
        }

        const isSolver = mode === 'solver';
        $('game-view')?.classList.toggle('hidden', isSolver);
        $('solver-view')?.classList.toggle('hidden', !isSolver);
        if (isSolver) return;

        $('daily-header-tag')?.classList.toggle('hidden', mode !== 'daily');
        $('filter-controls-panel')?.classList.toggle('hidden', mode === 'daily');
        mode === 'daily' ? onDaily() : onPractice();
    }

    // Sync view when user clicks browser Back / Forward
    window.addEventListener('popstate', () => {
        const mode = getModeFromURL();
        if (window.switchMode) {
            window.switchMode(mode, { updateURL: false, silent: true });
        } else {
            switchMode(mode, { updateURL: false, silent: true });
        }
    });

    return switchMode;
}

/* ---------- Picking equations (pass 2) ---------- */
export function pickPractice(list, current) {
    const cat = $('category-filter-desktop')?.value || 'ALL';
    const diff = $('difficulty-filter-desktop')?.value || 'ALL';

    let filtered = list.filter((eq) => {
        const catMatch = cat === 'ALL' || (Array.isArray(eq.category) ? eq.category.includes(cat) : eq.category === cat);
        return catMatch && (diff === 'ALL' || eq.difficulty === diff);
    });
    if (filtered.length === 0) filtered = list;
    return getRandomDifferentItem(filtered, current);
}

export function pickDaily(list) {
    return list[hashDateString(getTodayDateString()) % list.length];
}

/* ---------- Button states ---------- */
const CONTROL_IDS = { check: 'check-btn', next: 'next-btn', hint: 'hint-btn', share: 'share-btn', practice: 'go-to-practice-btn' };
const CONTROL_STATES = {
    'ready':         { check: true,  next: false, hint: true,  share: false, practice: false },
    'daily-done':    { check: false, next: false, hint: false, share: true,  practice: true },
    'practice-done': { check: false, next: true,  hint: true,  share: false, practice: false }
};

/** state: 'ready' (new equation) | 'daily-done' | 'practice-done' */
export function setControls(state) {
    const wanted = CONTROL_STATES[state];
    Object.entries(CONTROL_IDS).forEach(([key, id]) => $(id)?.classList.toggle('hidden', !wanted[key]));
}

/* ---------- Daily challenge ---------- */
export function loadDaily({ game, list, render, showInsight }) {
    const equation = pickDaily(list);
    render(equation);

    const tag = $('daily-header-tag');
    if (Storage.getDailyHistory(game)[getTodayDateString()]?.completed) {
        setControls('daily-done');
        showInsight();
        if (tag) startDailyCountdownTimer(tag);
    } else {
        if (tag) tag.innerHTML = `<i class="fa-solid fa-calendar"></i> Today's Daily Reaction`;
        setControls('ready');
    }
    return equation;
}

/** Call when the answer is correct; then call scoreboard.recordAttempt(true). */
export function finishSolve(game, mode) {
    if (mode === 'daily') {
        const history = Storage.getDailyHistory(game);
        history[getTodayDateString()] = { completed: true, timestamp: new Date().toISOString() };
        Storage.setDailyHistory(game, history);
        setControls('daily-done');
        const tag = $('daily-header-tag');
        if (tag) startDailyCountdownTimer(tag);
    } else {
        setControls('practice-done');
    }
}
