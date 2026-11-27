// hitori/js/main.js
import { generateHitoriPuzzle, areUnshadedConnected } from './solver.js';
import * as UI from './ui.js';
import { initTheme } from '../../shared/js/theme.js';
import { createGameStorage, formatTime } from '../../shared/js/storage.js';
import { initShell } from '../../shared/js/shell.js';
import { applySEO } from '../../shared/js/seo.js';

applySEO({
    siteName: 'Gridwork',
    appName: 'Gridwork Hitori',
    title: 'Gridwork — Pure Logic Hitori | Free No-Guess Number Shading Puzzle',
    ogTitle: 'Gridwork — Pure Logic Hitori',
    description:
        'Play Gridwork Hitori, a free, responsive logic puzzle engineered with connectivity-verified generation, keyboard navigation, and zero trial-and-error guessing.',
    keywords:
        'Gridwork, Hitori, pure logic Hitori, no-guess Hitori, free online Hitori, responsive logic puzzle',
    baseUrl: 'https://brickeli.github.io/WebApps/GridWork/hitori/',
    ogImage: 'https://brickeli.github.io/WebApps/GridWork/shared/assets/og-hitori.png',
    ogImageAlt: 'Gridwork responsive Hitori grid interface in high-contrast dark and light themes'
});

const HITORI_HOW_TO = `
    <h3>Goal</h3>
    <p>Shade out duplicate numbers so no digit appears more than once in any row or column.</p>
    <h3>Rules</h3>
    <ul>
        <li><strong>No Repeat Numbers:</strong> Every unshaded number in a row or column must be unique.</li>
        <li><strong>No Touching Shaded Cells:</strong> Shaded cells cannot touch horizontally or vertically (diagonals are fine).</li>
        <li><strong>Stay Connected:</strong> All remaining unshaded cells must form a single connected group.</li>
    </ul>
    <h3>Controls &amp; Shortcuts</h3>
    <ul>
        <li><strong>Tap / Click</strong> cycles a cell (or uses your active <strong>Shade / Circle</strong> mode); <strong>Right-Click</strong> circles a safe number.</li>
        <li><kbd>Arrows</kbd> move focus, <kbd>S</kbd> shade, <kbd>C</kbd> circle, <kbd>M</kbd> toggle mode, <kbd>Z</kbd> undo, <kbd>H</kbd> hint.</li>
    </ul>
`;

const storage = createGameStorage('gridwork_hitori_stats', 50);

const state = {
    size: 5,
    difficultyLabel: 'Easy',
    numbers: [],
    solution: [],
    playerGrid: [], // 0 = unknown, 1 = shaded, 2 = circled
    hintCells: new Set(),
    undoStack: [],
    focused: { r: 0, c: 0 },
    safeMode: false,
    hintsUsed: 0,
    seconds: 0,
    timerId: null,
    active: false,
    paused: false
};

const shell = initShell({
    storage,
    title: 'HITORI',
    difficulties: [
        { label: 'Easy', dataset: { size: 5 } },
        { label: 'Medium', dataset: { size: 7 } },
        { label: 'Hard', dataset: { size: 8 } },
        { label: 'Expert', dataset: { size: 9 } }
    ],
    modeToggle: {
        icon: '<rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" stroke="none"/>',
        label: 'Shade Mode:',
        badgeText: 'ON',
        badgeState: 'on'
    },
    howToHtml: HITORI_HOW_TO,
    onReset: resetPuzzle,
    onNewGame: initGame,
    onStatsClose: () => UI.focusCell(state.size, state.focused.r, state.focused.c),
    onHowToClose: () => UI.focusCell(state.size, state.focused.r, state.focused.c),
    onWinClose: () => {
        initGame();
        UI.focusCell(state.size, 0, 0);
    }
});

// Bind controls after initShell injects them
const diffBtns = document.querySelectorAll('.diff-btn');
diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.size = Number(btn.dataset.size) || 5;
        state.difficultyLabel = btn.dataset.label;
        initGame();
    });
});

document.getElementById('mode-toggle')?.addEventListener('click', () => {
    state.safeMode = !state.safeMode;
    UI.renderModeUI(state.safeMode);
});

[document.getElementById('timer-btn'), document.getElementById('pause-overlay')].forEach(el => {
    el?.addEventListener('click', togglePause);
});

document.getElementById('undo-btn')?.addEventListener('click', performUndo);
document.getElementById('hint-btn')?.addEventListener('click', performHint);

function sync() {
    UI.syncBoardUI(state.size, state.numbers, state.playerGrid, state.hintCells);
}

function initGame() {
    const puzzle = generateHitoriPuzzle(state.size);
    Object.assign(state, {
        size: puzzle.size,
        numbers: puzzle.numbers,
        solution: puzzle.solution,
        playerGrid: Array.from({ length: puzzle.size }, () => new Array(puzzle.size).fill(0)),
        undoStack: [],
        focused: { r: 0, c: 0 },
        hintsUsed: 0,
        seconds: 0,
        active: true,
        paused: false
    });
    state.hintCells.clear();

    UI.renderTimerUI('00:00', false);
    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
        if (state.active && !state.paused) {
            UI.renderTimerUI(formatTime(++state.seconds), false);
        }
    }, 1000);

    UI.renderBoard({
        size: state.size,
        numbers: state.numbers,
        playerGrid: state.playerGrid,
        hintCells: state.hintCells,
        onCellClick: handleCellPrimaryClick,
        onCellRightClick: handleCellSecondaryClick,
        onCellFocus: (r, c) => { state.focused = { r, c }; }
    });
}

function resetPuzzle() {
    if (!state.numbers.length) return;
    Object.assign(state, { hintsUsed: 0, seconds: 0, active: true, paused: false, undoStack: [] });
    state.hintCells.clear();
    state.playerGrid = Array.from({ length: state.size }, () => new Array(state.size).fill(0));
    UI.renderTimerUI('00:00', false);
    sync();
}

function togglePause() {
    if (!state.active) return;
    state.paused = !state.paused;
    UI.renderTimerUI(formatTime(state.seconds), state.paused);
    if (!state.paused) UI.focusCell(state.size, state.focused.r, state.focused.c);
}

function setCellState(r, c, nextVal) {
    if (!state.active || state.paused) return;
    const prevVal = state.playerGrid[r][c];
    if (prevVal === nextVal) return;

    state.undoStack.push({ r, c, prevVal });
    state.playerGrid[r][c] = nextVal;
    sync();
    checkWin();
}

function handleCellPrimaryClick(r, c) {
    const cur = state.playerGrid[r][c];
    const target = state.safeMode ? 2 : 1;
    setCellState(r, c, cur === target ? 0 : target);
}

function handleCellSecondaryClick(r, c) {
    const cur = state.playerGrid[r][c];
    const target = state.safeMode ? 1 : 2;
    setCellState(r, c, cur === target ? 0 : target);
}

function performUndo() {
    if (!state.active || state.paused || !state.undoStack.length) return;
    const { r, c, prevVal } = state.undoStack.pop();
    state.playerGrid[r][c] = prevVal;
    sync();
    UI.focusCell(state.size, r, c);
}

function performHint() {
    if (!state.active || state.paused) return;
    const candidates = [];

    for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
            const target = state.solution[r][c]; // 1 = SHADED, 2 = WHITE (circled)
            if (state.playerGrid[r][c] !== target) {
                candidates.push({ r, c, target });
            }
        }
    }
    if (!candidates.length) return;

    const { r, c, target } = candidates[Math.floor(Math.random() * candidates.length)];
    state.undoStack.push({ r, c, prevVal: state.playerGrid[r][c] });
    state.playerGrid[r][c] = target;
    state.hintCells.add(`${r},${c}`);
    state.hintsUsed++;
    sync();
    UI.focusCell(state.size, r, c);
    checkWin();
}

function checkWin() {
    if (!state.active) return;
    const size = state.size;

    // 1. No adjacent shaded cells
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (state.playerGrid[r][c] !== 1) continue;
            if (r + 1 < size && state.playerGrid[r + 1][c] === 1) return;
            if (c + 1 < size && state.playerGrid[r][c + 1] === 1) return;
        }
    }

    // 2. All unshaded numbers unique in every row and column
    for (let i = 0; i < size; i++) {
        const rowSeen = new Set();
        const colSeen = new Set();
        for (let j = 0; j < size; j++) {
            if (state.playerGrid[i][j] !== 1) {
                const v = state.numbers[i][j];
                if (rowSeen.has(v)) return;
                rowSeen.add(v);
            }
            if (state.playerGrid[j][i] !== 1) {
                const v = state.numbers[j][i];
                if (colSeen.has(v)) return;
                colSeen.add(v);
            }
        }
    }

    // 3. All unshaded cells form one connected region
    if (!areUnshadedConnected(size, (r, c) => state.playerGrid[r][c] === 1)) return;

    state.active = false;
    clearInterval(state.timerId);
    const finalTime = formatTime(state.seconds);

    storage.saveStat({
        difficulty: `${state.difficultyLabel} (${size}×${size})`,
        hints: state.hintsUsed,
        timeVal: state.seconds
    });

    setTimeout(() => {
        shell.showWinModal(
            `You solved <strong>${state.difficultyLabel} (${size}×${size})</strong> in <strong>${finalTime}</strong> with <strong>${state.hintsUsed}</strong> hint${state.hintsUsed === 1 ? '' : 's'}!`
        );
    }, 120);
}

// --- Event Wiring ---
initTheme(document.getElementById('theme-menu-btn'));

const ARROW_DELTAS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        shell.handleGlobalEscape();
        return;
    }
    if (shell.isStatsModalOpen() || shell.isHowToModalOpen() || shell.isWinModalOpen() || shell.isSidePanelOpen()) return;

    const key = e.key.toLowerCase();
    const noMod = !e.ctrlKey && !e.metaKey;

    if (key === 'p' && noMod) { e.preventDefault(); return togglePause(); }
    if (!state.active || state.paused) return;

    const { r, c } = state.focused;

    if (ARROW_DELTAS[e.key]) {
        e.preventDefault();
        const [dr, dc] = ARROW_DELTAS[e.key];
        const nr = Math.max(0, Math.min(state.size - 1, r + dr));
        const nc = Math.max(0, Math.min(state.size - 1, c + dc));
        state.focused = { r: nr, c: nc };
        return UI.focusCell(state.size, nr, nc);
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        return setCellState(r, c, 0);
    }

    const shortcuts = {
        s: () => setCellState(r, c, state.playerGrid[r][c] === 1 ? 0 : 1),
        c: () => setCellState(r, c, state.playerGrid[r][c] === 2 ? 0 : 2),
        m: () => { state.safeMode = !state.safeMode; UI.renderModeUI(state.safeMode); },
        h: performHint,
        z: performUndo
    };

    if (shortcuts[key] && (key === 'z' || noMod)) {
        e.preventDefault();
        shortcuts[key]();
    }
});

initGame();
