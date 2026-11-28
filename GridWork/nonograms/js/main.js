// nonograms/js/main.js
import * as UI from './ui.js';
import { initTheme } from '../../shared/js/theme.js';
import { createGameStorage } from '../../shared/js/storage.js';
import { initShell } from '../../shared/js/shell.js';
import { createGameController, createKeyboardRouter } from '../../shared/js/gameController.js';
import { gridNavTarget } from '../../shared/js/grid.js';
import { applySEO } from '../../shared/js/seo.js';
import { getPuzzleForMode, checkPixelArtGuess } from './pixelArt.js';

applySEO({
    siteName: 'Gridwork',
    appName: 'Gridwork Nonograms',
    title: 'Gridwork — Pure Logic Nonograms | Free No-Guess Picross Puzzle',
    ogTitle: 'Gridwork — Pure Logic Nonograms',
    description:
        'Play Gridwork Nonograms, a free, responsive logic picture puzzle engineered with line-deduction verification, keyboard navigation, and zero guessing.',
    keywords:
        'Gridwork, Nonograms, Picross, Griddlers, pure logic Nonograms, no-guess Nonograms, free online Nonograms',
    baseUrl: 'https://brickeli.github.io/WebApps/GridWork/nonograms/',
    ogImage: 'https://brickeli.github.io/WebApps/GridWork/shared/assets/og-nonograms.png',
    ogImageAlt: 'Gridwork responsive Nonograms grid interface in high-contrast dark and light themes'
});

const storage = createGameStorage('gridwork_nonogram_stats', 50);

const state = {
    size: 5,
    difficultyLabel: 'Easy',
    mode: 'standard',
    pixelMeta: null,
    solvedEarly: false,
    solution: [],
    playerGrid: [],
    hintCells: new Set(),
    undoStack: [],
    focused: { r: 0, c: 0 },
    isDragging: false,
    dragTarget: null,
    hintsUsed: 0,
    seconds: 0,
    active: false,
    paused: false,
    crossMode: false
};

const NONOGRAMS_HOW_TO = `
    <h3>Goal</h3>
    <p>Fill in cells to reveal a hidden grid pattern using the number clues on the top and left edges. Every puzzle is 100% solvable by logic—no guessing required.</p>
    <h3>Clues</h3>
    <ul>
        <li>Each number shows a contiguous run of filled cells in that row or column, in order.</li>
        <li>Separate runs must have at least <strong>one empty cell (×)</strong> between them.</li>
        <li>A <strong>0</strong> clue means the entire line is empty.</li>
    </ul>
    <h3>Pixel Mode</h3>
    <ul>
        <li>Uncover enough of the picture to recognize the object, then type its name into the guess bar to solve the puzzle.</li>
    </ul>
    <h3>Controls &amp; Shortcuts</h3>
    <ul>
        <li><strong>Tap / Click</strong> to fill; <strong>Right-Click</strong> or toggle <strong>Cross Mode</strong> to mark known empty cells (<kbd>×</kbd>).</li>
        <li><kbd>Arrows</kbd> move focus, <kbd>F</kbd> fill, <kbd>X</kbd> cross, <kbd>M</kbd> toggle mode, <kbd>Z</kbd> undo, <kbd>H</kbd> hint.</li>
    </ul>
`;

const shell = initShell({
    storage,
    title: 'NONOGRAMS',
    difficulties: [
        { label: 'Easy', dataset: { mode: 'standard', size: 5 } },
        { label: 'Medium', dataset: { mode: 'standard', size: 8 } },
        { label: 'Hard', dataset: { mode: 'standard', size: 12 } },
        { label: 'Pixel', dataset: { mode: 'pixel-art', size: 10 } }
    ],
    modeToggle: {
        icon: '<rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" stroke="none"/>',
        label: 'Fill Mode:',
        badgeText: 'ON',
        badgeState: 'on'
    },
    howToHtml: NONOGRAMS_HOW_TO,
    onReset: resetPuzzle,
    onNewGame: initGame,
    onStatsClose: () => setFocus(state.focused.r, state.focused.c, true),
    onHowToClose: () => setFocus(state.focused.r, state.focused.c, true),
    onWinClose: () => {
        initGame();
        setFocus(0, 0, true);
    }
});

const game = createGameController({
    state,
    shell,
    storage,
    renderTimer: UI.renderTimerUI,
    onResume: () => setFocus(state.focused.r, state.focused.c, true)
});
game.bindControls();

const diffBtns = document.querySelectorAll('.diff-btn');
diffBtns.forEach(btn => btn.addEventListener('click', () => {
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.mode = btn.dataset.mode || 'standard';
    state.size = Number(btn.dataset.size) || 10;
    state.difficultyLabel = btn.dataset.label;
    initGame();
}));

function toggleCrossMode() {
    state.crossMode = !state.crossMode;
    UI.renderModeUI(state.crossMode);
}
document.getElementById('mode-toggle')?.addEventListener('click', toggleCrossMode);

document.getElementById('undo-btn')?.addEventListener('click', performUndo);
document.getElementById('hint-btn')?.addEventListener('click', performHint);

function setFocus(r, c, moveDom = true) {
    const next = {
        r: Math.max(0, Math.min(state.size - 1, r)),
        c: Math.max(0, Math.min(state.size - 1, c))
    };
    UI.updateFocusedCellUI(state.size, state.focused, next, moveDom);
    state.focused = next;
}

function syncCell(r, c) {
    UI.updateCellUI({
        size: state.size,
        solution: state.solution,
        playerGrid: state.playerGrid,
        hintCells: state.hintCells,
        r,
        c
    });
    UI.updateClueCompletion(state.solution, state.playerGrid);
}

function initGame() {
    const puzzle = getPuzzleForMode(
        state.mode,
        state.size,
        state.difficultyLabel.toLowerCase()
    );

    Object.assign(state, {
        size: puzzle.size,
        solvedEarly: false,
        pixelMeta: puzzle.pixelMeta,
        undoStack: [],
        focused: { r: 0, c: 0 },
        solution: puzzle.grid,
        playerGrid: Array.from({ length: puzzle.size }, () => new Array(puzzle.size).fill(0))
    });
    state.hintCells.clear();

    UI.toggleGuessBar(state.mode === 'pixel-art');
    game.start();

    UI.renderClues(state.solution);
    UI.renderBoard({
        size: state.size,
        difficultyLabel: state.difficultyLabel,
        solution: state.solution,
        playerGrid: state.playerGrid,
        handlers: {
            onCellFocus: (r, c) => setFocus(r, c, false),
            onCellStart: startDrag,
            onCellEnter: continueDrag
        }
    });
    UI.updateClueCompletion(state.solution, state.playerGrid);
    setFocus(0, 0, false);
}

function resetPuzzle() {
    if (!state.solution.length) return;
    state.undoStack = [];
    state.hintCells.clear();
    game.start();

    for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
            state.playerGrid[r][c] = 0;
            syncCell(r, c);
        }
    }
    setFocus(state.focused.r, state.focused.c, true);
}

function applyAction(r, c, newState) {
    const prevVal = state.playerGrid[r][c];
    if (prevVal === newState) return;

    state.undoStack.push({ r, c, prevVal });
    state.playerGrid[r][c] = newState;
    syncCell(r, c);
    checkWin();
}

function performUndo() {
    if (!state.active || state.paused || !state.undoStack.length) return;
    const { r, c, prevVal } = state.undoStack.pop();
    state.playerGrid[r][c] = prevVal;
    syncCell(r, c);
    setFocus(r, c, false);
}

function performHint() {
    if (!state.active || state.paused) return;
    const candidates = [];

    for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
            const target = state.solution[r][c] === 1 ? 1 : 2;
            if (state.playerGrid[r][c] !== target && !(target === 2 && state.playerGrid[r][c] === 0)) {
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
    syncCell(r, c);
    setFocus(r, c, false);
    checkWin();
}

function checkWin(guessedCorrectly = false) {
    const gridSolved = state.solution.every((row, r) =>
        row.every((val, c) => (val === 1 ? state.playerGrid[r][c] === 1 : state.playerGrid[r][c] !== 1))
    );
    if (!state.active) return;

    // In Pixel mode, filling the board prompts the player to type their guess
    if (state.mode === 'pixel-art' && !guessedCorrectly) {
        if (gridSolved) {
            UI.promptFinalPixelGuess();
        }
        return;
    }

    if (!gridSolved) return;

    if (state.mode === 'pixel-art' && state.pixelMeta) {
        const solvedIds = JSON.parse(localStorage.getItem('gridwork_nonograms_pixel_solved') || '[]');
        if (!solvedIds.includes(state.pixelMeta.id)) {
            solvedIds.push(state.pixelMeta.id);
            localStorage.setItem('gridwork_nonograms_pixel_solved', JSON.stringify(solvedIds));
        }
    }

    const titleNote = state.mode === 'pixel-art' && state.pixelMeta
        ? ` — <strong>${state.pixelMeta.title}</strong>`
        : '';

    game.complete({ difficulty: `${state.difficultyLabel} (${state.size}×${state.size})`, detail: titleNote });
}

function handlePixelGuessSubmit(e) {
    e.preventDefault();
    if (!state.active || state.paused || state.mode !== 'pixel-art' || !state.pixelMeta) return;

    const rawGuess = UI.dom.guessInput?.value || '';
    if (!rawGuess.trim()) return;

    if (checkPixelArtGuess(rawGuess, state.pixelMeta)) {
        const alreadyFilled = state.solution.every((row, r) =>
            row.every((val, c) => (val === 1 ? state.playerGrid[r][c] === 1 : state.playerGrid[r][c] !== 1))
        );
        state.solvedEarly = !alreadyFilled;

        // Auto-reveal any remaining cells
        for (let r = 0; r < state.size; r++) {
            for (let c = 0; c < state.size; c++) {
                state.playerGrid[r][c] = state.solution[r][c] === 1 ? 1 : 2;
                syncCell(r, c);
            }
        }
        checkWin(true);
    } else {
        UI.showGuessError(`Not "${rawGuess.trim()}" — take a closer look and try again!`);
    }
}

// --- Pointer & Touch Dragging ---
function startDrag(e, r, c, isRightClick) {
    if (!state.active || state.paused) return;
    e.preventDefault();
    state.isDragging = true;
    setFocus(r, c, true);

    const prev = state.playerGrid[r][c];
    const targetMode = (isRightClick || state.crossMode) ? 2 : 1;
    state.dragTarget = prev === targetMode ? 0 : targetMode;
    applyAction(r, c, state.dragTarget);
}

function continueDrag(r, c) {
    if (!state.isDragging || !state.active || state.paused) return;
    setFocus(r, c, false);
    applyAction(r, c, state.dragTarget);
}

UI.dom.boardEl.addEventListener('touchmove', (e) => {
    if (!state.isDragging || !state.active || state.paused) return;
    e.preventDefault();
    const { clientX, clientY } = e.touches[0];
    const cell = document.elementFromPoint(clientX, clientY);
    if (cell?.classList.contains('cell')) {
        continueDrag(Number(cell.dataset.r), Number(cell.dataset.c));
    }
}, { passive: false });

['mouseup', 'touchend'].forEach(evt =>
    window.addEventListener(evt, () => { state.isDragging = false; state.dragTarget = null; })
);

// --- Controls & Drawer ---
initTheme(document.getElementById('theme-menu-btn'));
UI.dom.guessBar?.addEventListener('submit', handlePixelGuessSubmit);

// --- Keyboard Navigation & Shortcuts ---
const isCellFocused = () => document.activeElement?.classList.contains('cell');

// F / X act on the focused cell (focusing it first if the keyboard focus is elsewhere).
const markCell = (target) => () => {
    const { r, c } = state.focused;
    if (!isCellFocused()) setFocus(r, c, true);
    applyAction(r, c, state.playerGrid[r][c] === target ? 0 : target);
};

createKeyboardRouter({
    shell,
    game,
    grid: {
        rows: () => state.size,
        position: () => state.focused,
        moveTo: (r, c) => setFocus(r, c, true)
    },
    keys: { f: markCell(1), x: markCell(2), m: toggleCrossMode, n: toggleCrossMode, h: performHint, z: performUndo },
    ctrlKeys: { z: performUndo },
    onKey: (e) => {
        if (!isCellFocused()) return false;
        const { r, c } = state.focused;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            const target = state.crossMode ? 2 : 1;
            applyAction(r, c, state.playerGrid[r][c] === target ? 0 : target);
            return true;
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            applyAction(r, c, 0);
            return true;
        }
        return false;
    }
});

initGame();
