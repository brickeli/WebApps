// shared/js/game-controller.js
// One implementation of the clock, pause/resume and win flow that every GridWork game shares.
//
// The game's own `state` object must have these fields (the controller owns their values):
//   active (boolean), paused (boolean), seconds (number), hintsUsed (number)
import { formatTime } from './storage.js';
import { gridNavTarget } from './grid.js';

export function createGameController({
    state,
    shell,
    storage,
    renderTimer,          // (formattedTime, isPaused) => void
    onResume,             // called after a resume so the game can restore keyboard focus
    now = () => performance.now(),
    winDelayMs = 120
}) {
    let intervalId = null;
    let runStart = 0;     // timestamp the current running stretch began
    let elapsedMs = 0;    // time banked from earlier stretches (before pauses)

    // Clock is derived from timestamps, so it can't drift or lose time when a tab is throttled.
    function tick() {
        if (!state.active || state.paused) return;
        const seconds = Math.floor((elapsedMs + now() - runStart) / 1000);
        if (seconds !== state.seconds) {
            state.seconds = seconds;
            renderTimer(formatTime(seconds), false);
        }
    }

    function syncTimerButton() {
        const btn = document.getElementById('timer-btn');
        btn?.setAttribute('aria-label', state.paused ? 'Resume timer' : 'Pause timer');
        btn?.setAttribute('aria-pressed', String(state.paused));
    }

    function stop() {
        clearInterval(intervalId);
        intervalId = null;
    }

    /** Begin (or restart) a puzzle: zero the clock and hint count and start ticking. */
    function start() {
        stop();
        Object.assign(state, { active: true, paused: false, seconds: 0, hintsUsed: 0 });
        elapsedMs = 0;
        runStart = now();
        renderTimer(formatTime(0), false);
        syncTimerButton();
        intervalId = setInterval(tick, 500);
    }

    function togglePause() {
        if (!state.active) return;
        state.paused = !state.paused;
        if (state.paused) {
            elapsedMs += now() - runStart;
            state.seconds = Math.floor(elapsedMs / 1000);
        } else {
            runStart = now();
        }
        renderTimer(formatTime(state.seconds), state.paused);
        syncTimerButton();
        shell.announce(state.paused ? 'Game paused' : 'Game resumed');
        if (!state.paused) onResume?.();
    }

    /**
     * Finish the puzzle: stop the clock, save the stat and show the win dialog.
     * `difficulty` e.g. "Easy (5×5)"; `detail` is optional extra HTML shown after it.
     */
    function complete({ difficulty, detail = '' }) {
        if (!state.active) return;
        tick();
        state.active = false;
        stop();
        const time = formatTime(state.seconds);
        const hints = state.hintsUsed;

        storage.saveStat({ difficulty, hints, timeVal: state.seconds });

        setTimeout(() => {
            shell.showWinModal(
                `You solved <strong>${difficulty}</strong>${detail} in <strong>${time}</strong> ` +
                `with <strong>${hints}</strong> hint${hints === 1 ? '' : 's'}!`
            );
        }, winDelayMs);
    }

    /** Wire the timer button and the pause overlay (call after initShell has injected them). */
    function bindControls() {
        [document.getElementById('timer-btn'), document.getElementById('pause-overlay')]
            .forEach(el => el?.addEventListener('click', togglePause));
    }

    return {
        start,
        stop,
        togglePause,
        complete,
        bindControls,
        isPlaying: () => state.active && !state.paused
    };
}

// One keydown handler for every GridWork game. It owns what was repeated in each game's
// handler (Escape, text-field and dialog guards, pause, grid navigation, shortcut keys);
// each game only declares what is specific to it.

export function createKeyboardRouter({ shell, game, grid, keys = {}, ctrlKeys = {}, onKey }) {
    const has = (map, key) => Object.prototype.hasOwnProperty.call(map, key);

    function handle(e) {
        if (e.target?.matches?.('input, textarea, select')) return;

        if (e.key === 'Escape') {
            shell.handleGlobalEscape();
            return;
        }
        if (shell.isStatsModalOpen() || shell.isHowToModalOpen() || shell.isWinModalOpen() || shell.isSidePanelOpen()) return;

        const key = e.key.toLowerCase();
        const mod = e.ctrlKey || e.metaKey;
        const run = (fn) => { e.preventDefault(); fn(); };

        if (key === 'p' && !mod) return run(game.togglePause);
        if (!game.isPlaying()) return;

        if (mod && has(ctrlKeys, key)) return run(ctrlKeys[key]);

        const pos = grid?.position();
        if (pos) {
            const rows = grid.rows();
            const nav = gridNavTarget(e.key, e.ctrlKey, pos.r, pos.c, rows, grid.cols?.() ?? rows);
            if (nav) return run(() => grid.moveTo(nav.r, nav.c));
        }

        if (onKey?.(e)) return;

        if (!mod && !e.altKey && has(keys, key)) run(keys[key]);
    }

    document.addEventListener('keydown', handle);
    return { handle };
}
