// kenken/js/main.js
import { generateKenKenPuzzle, isCageSatisfied } from './solver.js';
import * as UI from './ui.js';
import { initTheme } from '../../shared/js/theme.js';
import { createGameStorage, formatTime } from '../../shared/js/storage.js';
import { initShell } from '../../shared/js/shell.js';
import { applySEO } from '../../shared/js/seo.js';

applySEO({
    siteName: 'Gridwork',
    appName: 'Gridwork KenKen',
    title: 'GridWork — Pure Logic KenKen | Free No-Guess Math & Logic Grid Puzzle',
    ogTitle: 'GridWork — Pure Logic KenKen',
    description:
        'Play GridWork KenKen, a free, responsive arithmetic logic puzzle engineered with unique-solution cage generation, candidate notes, keyboard navigation, and zero guessing.',
    keywords:
        'GridWork, KenKen, Calcudoku, Mathdoku, pure logic KenKen, no-guess KenKen, free online KenKen',
    baseUrl: 'https://brickeli.github.io/WebApps/GridWork/kenken/',
    ogImage: 'https://brickeli.github.io/WebApps/GridWork/shared/assets/og-kenken.png',
    ogImageAlt: 'GridWork responsive KenKen math and logic grid interface in high-contrast dark and light themes'
});

const KENKEN_HOW_TO = `
    <h3>Goal</h3>
    <p>Fill the <strong>N×N</strong> grid with the digits <strong>1 through N</strong> so no number repeats in any row or column, while satisfying every outlined cage's math target.</p>
    <h3>Cages &amp; Operations</h3>
    <ul>
        <li><strong>Target + Operation:</strong> The numbers inside each heavy-bordered cage must combine using the clue's operation (<kbd>+</kbd>, <kbd>−</kbd>, <kbd>×</kbd>, <kbd>÷</kbd>) to equal its target.</li>
        <li><strong>Single-Cell Cages:</strong> A clue with no operator is a freebie—enter that exact digit.</li>
        <li><strong>Repeats Inside Cages:</strong> Digits <em>may</em> repeat inside a cage as long as they don't repeat in the same row or column.</li>
    </ul>
    <h3>Controls &amp; Shortcuts</h3>
    <ul>
        <li>Select a cell and tap the keypad—or use <kbd>Arrows</kbd> and number keys <kbd>1</kbd>–<kbd>7</kbd>.</li>
        <li><kbd>N</kbd> toggle Notes, <kbd>Backspace</kbd> clear cell, <kbd>Z</kbd> undo, <kbd>H</kbd> hint, <kbd>P</kbd> pause.</li>
    </ul>
`;

const storage = createGameStorage('gridwork_kenken_stats', 50);

const state = {
    size: 4,
    difficultyLabel: 'Easy',
    solution: [],
    cages: [],
    playerGrid: [],
    notes: [],
    hintCells: new Set(),
    undoStack: [],
    selected: { r: 0, c: 0 },
    isNotesMode: false,
    hintsUsed: 0,
    seconds: 0,
    timerId: null,
    active: false,
    paused: false
};

const shell = initShell({
    storage,
    title: 'KENKEN',
    difficulties: [
        { label: 'Easy', dataset: { size: 4 } },
        { label: 'Medium', dataset: { size: 5 } },
        { label: 'Hard', dataset: { size: 6 } },
        { label: 'Expert', dataset: { size: 7 } }
    ],
    modeToggle: {
        icon: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
        label: 'Notes Mode:',
        badgeText: 'OFF',
        badgeState: 'off'
    },
    howToHtml: KENKEN_HOW_TO,
    onReset: resetPuzzle,
    onNewGame: initGame,
    onStatsClose: () => UI.focusCell(state.size, state.selected.r, state.selected.c),
    onHowToClose: () => UI.focusCell(state.size, state.selected.r, state.selected.c),
    onWinClose: () => {
        initGame();
        UI.focusCell(state.size, 0, 0);
    }
});

// Bind shell-injected controls
const diffBtns = document.querySelectorAll('.diff-btn');
diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.size = Number(btn.dataset.size) || 4;
        state.difficultyLabel = btn.dataset.label;
        initGame();
    });
});

document.getElementById('mode-toggle')?.addEventListener('click', toggleNotesMode);

[document.getElementById('timer-btn'), document.getElementById('pause-overlay')].forEach(el => {
    el?.addEventListener('click', togglePause);
});

document.getElementById('undo-btn')?.addEventListener('click', performUndo);
document.getElementById('hint-btn')?.addEventListener('click', performHint);

function sync() {
    UI.syncBoardUI({
        size: state.size,
        cages: state.cages,
        playerGrid: state.playerGrid,
        hintCells: state.hintCells,
        notes: state.notes,
        selected: state.selected
    });
}

function selectCell(r, c, moveFocus = false) {
    if (state.paused) return;
    state.selected = { r, c };
    sync();
    if (moveFocus) UI.focusCell(state.size, r, c);
}

function toggleNotesMode() {
    if (state.paused) return;
    state.isNotesMode = !state.isNotesMode;
    UI.renderNotesModeUI(state.isNotesMode);
}

function initGame() {
    const puzzle = generateKenKenPuzzle(state.size);
    Object.assign(state, {
        size: puzzle.size,
        solution: puzzle.solution,
        cages: puzzle.cages,
        playerGrid: Array.from({ length: puzzle.size }, () => Array(puzzle.size).fill(0)),
        notes: Array.from({ length: puzzle.size }, () =>
            Array.from({ length: puzzle.size }, () => Array(puzzle.size + 1).fill(false))
        ),
        undoStack: [],
        selected: { r: 0, c: 0 },
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

    UI.renderKeypad(state.size, state.isNotesMode, inputNumber);
    UI.renderBoard({
        size: state.size,
        cages: state.cages,
        playerGrid: state.playerGrid,
        hintCells: state.hintCells,
        notes: state.notes,
        selected: state.selected,
        onSelectCell: selectCell
    });
}

function resetPuzzle() {
    if (!state.solution.length) return;
    Object.assign(state, { hintsUsed: 0, seconds: 0, active: true, paused: false, undoStack: [] });
    state.hintCells.clear();
    state.playerGrid = Array.from({ length: state.size }, () => Array(state.size).fill(0));
    state.notes = Array.from({ length: state.size }, () =>
        Array.from({ length: state.size }, () => Array(state.size + 1).fill(false))
    );
    UI.renderTimerUI('00:00', false);
    sync();
}

function togglePause() {
    if (!state.active) return;
    state.paused = !state.paused;
    UI.renderTimerUI(formatTime(state.seconds), state.paused);
    if (!state.paused) UI.focusCell(state.size, state.selected.r, state.selected.c);
}

function recordMove() {
    state.undoStack.push({
        grid: state.playerGrid.map(row => [...row]),
        notes: state.notes.map(row => row.map(cell => [...cell])),
        hints: new Set(state.hintCells),
        selected: { ...state.selected }
    });
}

function clearPeerNotes(r, c, val) {
    for (let i = 0; i < state.size; i++) {
        state.notes[r][i][val] = false;
        state.notes[i][c][val] = false;
    }
}

function inputNumber(num) {
    if (!state.active || state.paused || num < 0 || num > state.size) return;
    const { r, c } = state.selected;
    const key = `${r},${c}`;
    if (state.hintCells.has(key)) return;

    recordMove();

    if (num === 0) {
        state.playerGrid[r][c] = 0;
        state.notes[r][c].fill(false);
    } else if (state.isNotesMode) {
        state.playerGrid[r][c] = 0;
        state.notes[r][c][num] = !state.notes[r][c][num];
    } else {
        state.playerGrid[r][c] = state.playerGrid[r][c] === num ? 0 : num;
        state.notes[r][c].fill(false);
        if (state.playerGrid[r][c] !== 0) clearPeerNotes(r, c, num);
    }

    sync();
    checkWin();
}

function performUndo() {
    if (!state.active || state.paused || !state.undoStack.length) return;
    const prev = state.undoStack.pop();
    state.playerGrid = prev.grid;
    state.notes = prev.notes;
    state.hintCells = prev.hints;
    state.selected = prev.selected;
    sync();
    UI.focusCell(state.size, state.selected.r, state.selected.c);
}

function performHint() {
    if (!state.active || state.paused) return;
    const candidates = [];

    for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
            if (state.playerGrid[r][c] !== state.solution[r][c]) {
                candidates.push({ r, c });
            }
        }
    }
    if (!candidates.length) return;

    recordMove();
    const { r, c } = candidates[Math.floor(Math.random() * candidates.length)];
    const val = state.solution[r][c];

    state.playerGrid[r][c] = val;
    state.notes[r][c].fill(false);
    state.hintCells.add(`${r},${c}`);
    state.hintsUsed++;
    clearPeerNotes(r, c, val);
    state.selected = { r, c };

    sync();
    UI.focusCell(state.size, r, c);
    checkWin();
}

function checkWin() {
    if (!state.active) return;
    const size = state.size;

    // 1. Every row and column contains 1..size without repeats
    for (let i = 0; i < size; i++) {
        const rowSet = new Set();
        const colSet = new Set();
        for (let j = 0; j < size; j++) {
            const rv = state.playerGrid[i][j];
            const cv = state.playerGrid[j][i];
            if (rv < 1 || rv > size || cv < 1 || cv > size) return;
            rowSet.add(rv);
            colSet.add(cv);
        }
        if (rowSet.size !== size || colSet.size !== size) return;
    }

    // 2. Every cage satisfies its arithmetic target
    for (const cage of state.cages) {
        const vals = cage.cells.map(({ r, c }) => state.playerGrid[r][c]);
        if (!isCageSatisfied(cage, vals)) return;
    }

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

    const { r, c } = state.selected;

    if (ARROW_DELTAS[e.key]) {
        e.preventDefault();
        const [dr, dc] = ARROW_DELTAS[e.key];
        const nr = Math.max(0, Math.min(state.size - 1, r + dr));
        const nc = Math.max(0, Math.min(state.size - 1, c + dc));
        return selectCell(nr, nc, true);
    }

    if (e.key >= '1' && e.key <= String(state.size)) {
        e.preventDefault();
        return inputNumber(Number(e.key));
    }

    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        return inputNumber(0);
    }

    const shortcuts = {
        n: toggleNotesMode,
        h: performHint,
        z: performUndo
    };

    if (shortcuts[key] && (key === 'z' || noMod)) {
        e.preventDefault();
        shortcuts[key]();
    }
});

initGame();
