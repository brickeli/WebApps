import { generatePureLogicPuzzle } from './solver.js';
import { getSavedTheme, saveTheme, getStats, savePuzzleStat } from './storage.js';
import * as UI from './ui.js';

const state = {
    size: 5,
    difficultyLabel: 'Easy',
    solution: [],
    playerGrid: [],
    hintCells: new Set(),
    undoStack: [],
    focused: { r: 0, c: 0 },
    isDragging: false,
    dragTarget: null,
    hintsUsed: 0,
    seconds: 0,
    timerId: null,
    active: false,
    paused: false,
    crossMode: false,
    sort: { key: 'timestamp', asc: false }
};

const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

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

// --- Game Lifecycle ---
function initGame() {
    Object.assign(state, {
        hintsUsed: 0,
        seconds: 0,
        active: true,
        paused: false,
        undoStack: [],
        focused: { r: 0, c: 0 },
        solution: generatePureLogicPuzzle(state.size),
        playerGrid: Array.from({ length: state.size }, () => new Array(state.size).fill(0))
    });
    state.hintCells.clear();

    UI.renderTimerUI('00:00', false);
    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
        if (state.active && !state.paused) {
            UI.renderTimerUI(formatTime(++state.seconds), false);
        }
    }, 1000);

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
    Object.assign(state, { hintsUsed: 0, seconds: 0, active: true, paused: false, undoStack: [] });
    state.hintCells.clear();

    for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
            state.playerGrid[r][c] = 0;
            syncCell(r, c);
        }
    }
    UI.renderTimerUI('00:00', false);
    setFocus(state.focused.r, state.focused.c, true);
}

function togglePause() {
    if (!state.active) return;
    state.paused = !state.paused;
    UI.renderTimerUI(formatTime(state.seconds), state.paused);
    if (!state.paused) setFocus(state.focused.r, state.focused.c, true);
}

// --- Cell Actions, Undo, Hint & Win ---
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

function checkWin() {
    const solved = state.solution.every((row, r) =>
        row.every((val, c) => (val === 1 ? state.playerGrid[r][c] === 1 : state.playerGrid[r][c] !== 1))
    );
    if (!solved || !state.active) return;

    state.active = false;
    clearInterval(state.timerId);
    const finalTime = formatTime(state.seconds);
    savePuzzleStat({
        difficultyLabel: state.difficultyLabel,
        size: state.size,
        hintsUsed: state.hintsUsed,
        timeStr: finalTime,
        secondsElapsed: state.seconds
    });
    setTimeout(() => UI.showWinModal({
        difficultyLabel: state.difficultyLabel,
        size: state.size,
        finalTime,
        hintsUsed: state.hintsUsed
    }), 120);
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

// --- Controls, Drawer & Modals ---
UI.renderThemeUI(getSavedTheme());

UI.dom.themeMenuBtn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    UI.renderThemeUI(next);
});

UI.dom.diffBtns.forEach(btn => btn.addEventListener('click', () => {
    UI.setActiveDifficultyBtn(btn);
    state.size = Number(btn.dataset.size);
    state.difficultyLabel = btn.dataset.label;
    initGame();
}));

UI.dom.modeToggleBtn.addEventListener('click', () => {
    state.crossMode = !state.crossMode;
    UI.renderModeUI(state.crossMode);
});

[UI.dom.timerBtn, UI.dom.pauseOverlay].forEach(el => el.addEventListener('click', togglePause));
UI.dom.undoBtn.addEventListener('click', performUndo);
UI.dom.hintBtn.addEventListener('click', performHint);

UI.dom.menuBtn.addEventListener('click', () => UI.setSidePanelOpen(!UI.isSidePanelOpen()));
UI.dom.menuOverlay.addEventListener('click', () => UI.setSidePanelOpen(false));
UI.dom.closeMenuBtn.addEventListener('click', () => { UI.setSidePanelOpen(false); UI.dom.menuBtn.focus(); });

UI.dom.resetMenuBtn.addEventListener('click', () => { UI.setSidePanelOpen(false); resetPuzzle(); });
UI.dom.newgameMenuBtn.addEventListener('click', () => { UI.setSidePanelOpen(false); initGame(); });
UI.dom.statsMenuBtn.addEventListener('click', () => { UI.setSidePanelOpen(false); UI.showStatsModal(getStats(), state.sort); });

UI.dom.statsHeaders.forEach(th => th.addEventListener('click', () => {
    const key = th.dataset.sort;
    state.sort = { key, asc: state.sort.key === key ? !state.sort.asc : true };
    UI.renderStatsTable(getStats(), state.sort);
}));

const closeStats = () => { UI.hideStatsModal(); setFocus(state.focused.r, state.focused.c, true); };
const closeWin = () => { UI.hideWinModal(); initGame(); setFocus(0, 0, true); };

UI.dom.closeStatsBtn.addEventListener('click', closeStats);
UI.dom.closeWinBtn.addEventListener('click', closeWin);
window.addEventListener('click', (e) => {
    if (e.target === UI.dom.statsModal) closeStats();
    if (e.target === UI.dom.winModal) closeWin();
});

// --- Keyboard Navigation & Shortcuts ---
const ARROW_DELTAS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (UI.isStatsModalOpen()) return closeStats();
        if (UI.isWinModalOpen()) return closeWin();
        if (UI.isSidePanelOpen()) { UI.setSidePanelOpen(false); UI.dom.menuBtn.focus(); }
        return;
    }
    if (UI.isStatsModalOpen() || UI.isWinModalOpen() || UI.isSidePanelOpen()) return;

    const key = e.key.toLowerCase();
    const noMod = !e.ctrlKey && !e.metaKey;

    if (key === 'p' && noMod) { e.preventDefault(); return togglePause(); }
    if (!state.active || state.paused) return;

    const { r, c } = state.focused;
    const cellFocused = document.activeElement?.classList.contains('cell');

    if (ARROW_DELTAS[e.key]) {
        e.preventDefault();
        const [dr, dc] = ARROW_DELTAS[e.key];
        return setFocus(r + dr, c + dc, true);
    }

    if (cellFocused && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        const target = state.crossMode ? 2 : 1;
        return applyAction(r, c, state.playerGrid[r][c] === target ? 0 : target);
    }

    if (cellFocused && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        return applyAction(r, c, 0);
    }

    const shortcuts = {
        f: () => { if (!cellFocused) setFocus(r, c, true); applyAction(r, c, state.playerGrid[r][c] === 1 ? 0 : 1); },
        x: () => { if (!cellFocused) setFocus(r, c, true); applyAction(r, c, state.playerGrid[r][c] === 2 ? 0 : 2); },
        m: () => { state.crossMode = !state.crossMode; UI.renderModeUI(state.crossMode); },
        h: performHint,
        z: performUndo
    };

    if (shortcuts[key] && (key === 'z' || noMod)) {
        e.preventDefault();
        shortcuts[key]();
    }
});

initGame();
