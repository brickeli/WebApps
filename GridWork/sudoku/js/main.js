// sudoku/js/main.js
import { isValid, solveSudoku, countSolutions, evaluatePuzzleLogic } from './solver.js';
import * as UI from './ui.js';
import { initTheme } from '../../shared/js/theme.js';
import { createGameStorage, formatTime } from '../../shared/js/storage.js';
import { initShell } from '../../shared/js/shell.js';
import { applySEO } from '../../shared/js/seo.js';

applySEO({
    siteName: 'Gridwork',
    appName: 'Gridwork Sudoku',
    title: 'Gridwork — Pure Logic Sudoku | Free No-Guess 9×9 Puzzle',
    ogTitle: 'Gridwork — Pure Logic Sudoku',
    description:
        'Play Gridwork Sudoku, a free, responsive 9×9 web app engineered with unique-solution carving, human-technique difficulty grading, Auto Notes, and zero trial-and-error guessing.',
    keywords:
        'Gridwork, Sudoku, pure logic Sudoku, no-guess Sudoku, free online Sudoku, responsive Sudoku, daily logic puzzle',
    baseUrl: 'https://brickeli.github.io/WebApps/GridWork/sudoku/',
    ogImage: 'https://brickeli.github.io/WebApps/GridWork/shared/assets/og-sudoku.png',
    ogImageAlt: 'Gridwork responsive 9x9 Sudoku board interface in high-contrast dark and light themes'
});

const storage = createGameStorage('gridwork_sudoku_stats', 25);

const state = {
    board: Array(81).fill(0),
    solution: Array(81).fill(0),
    givens: Array(81).fill(false),
    hints: Array(81).fill(false),
    notes: Array.from({ length: 81 }, () => Array(10).fill(false)),
    undoStack: [],
    selectedCell: null,
    currentClues: 38,
    currentDiffLabel: 'Easy',
    isNotesMode: false,
    isAutoNotesEnabled: false,
    isPaused: false,
    isGameWon: false,
    hintCount: 0,
    timerSeconds: 0,
    timerId: null
};

const SUDOKU_HOW_TO = `
    <h3>Goal</h3>
    <p>Fill the 9×9 grid so every row, column, and 3×3 box contains the digits <strong>1 through 9</strong> without repeats.</p>
    <h3>Tools</h3>
    <ul>
        <li><strong>Notes Mode:</strong> Pencil in small candidate digits inside empty cells to track possibilities.</li>
        <li><strong>Auto Notes:</strong> Automatically populates valid candidates for all open cells.</li>
        <li><strong>Undo &amp; Hint:</strong> Step backward through moves or reveal a single verified cell.</li>
    </ul>
    <h3>Controls &amp; Shortcuts</h3>
    <ul>
        <li>Select a cell and tap a number on the keypad—or use <kbd>Arrows</kbd> and keys <kbd>1</kbd>–<kbd>9</kbd>.</li>
        <li><kbd>N</kbd> toggle Notes, <kbd>Backspace</kbd> clear cell, <kbd>Z</kbd> undo, <kbd>H</kbd> hint.</li>
    </ul>
`;

const shell = initShell({
    storage,
    title: 'SUDOKU',
    difficulties: [
        { label: 'Easy', dataset: { clues: 38 } },
        { label: 'Medium', dataset: { clues: 32 } },
        { label: 'Hard', dataset: { clues: 27 } },
        { label: 'Expert', dataset: { clues: 23 } },
        { label: 'Master', dataset: { clues: 19 } }
    ],
    modeToggle: {
        icon: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
        label: 'Notes Mode:',
        badgeText: 'OFF',
        badgeState: 'off'
    },
    howToHtml: SUDOKU_HOW_TO,
    extraMenuItems: [{
        id: 'autonotes-menu-btn',
        label: 'Auto Notes',
        icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
        badgeId: 'autonotes-status',
        badgeText: 'OFF'
    }],
    onReset: resetPuzzle,
    onNewGame: newGame
});

const diffBtns = document.querySelectorAll('.diff-btn');
diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentClues = Number(btn.dataset.clues);
        state.currentDiffLabel = btn.dataset.label;
        newGame();
    });
});

document.getElementById('mode-toggle')?.addEventListener('click', toggleNotesMode);

[document.getElementById('timer-btn'), document.getElementById('pause-overlay')].forEach(el => {
    el?.addEventListener('click', togglePause);
});

document.getElementById('undo-btn')?.addEventListener('click', undo);
document.getElementById('hint-btn')?.addEventListener('click', provideHint);
document.getElementById('autonotes-menu-btn')?.addEventListener('click', toggleAutoNotes);

function triggerRender() {
    UI.renderBoard(state.board, state.solution, state.givens, state.hints, state.notes, state.selectedCell);
    UI.updateDuplicateHighlights(state.board);
}

function recordMove() {
    state.undoStack.push({
        board: [...state.board],
        notes: state.notes.map(cellNotes => [...cellNotes]),
        hints: [...state.hints],
        selectedCell: state.selectedCell
    });
}

function selectCell(index, moveDomFocus = false) {
    if (state.isPaused) return;
    state.selectedCell = index;
    UI.highlightCellPeers(index);
    if (moveDomFocus && index !== null) {
        UI.dom.boardEl.children[index]?.focus();
    }
}

function undo() {
    if (!state.undoStack.length || state.isGameWon || state.isPaused) return;
    const prev = state.undoStack.pop();
    state.board = prev.board;
    state.notes = prev.notes;
    state.hints = prev.hints;
    state.selectedCell = prev.selectedCell;

    triggerRender();
    if (state.selectedCell !== null) UI.highlightCellPeers(state.selectedCell);
}

function toggleNotesMode() {
    if (state.isPaused) return;
    state.isNotesMode = !state.isNotesMode;
    UI.renderNotesModeUI(state.isNotesMode);
}

function toggleAutoNotes() {
    if (state.isPaused || state.isGameWon) return;
    state.isAutoNotesEnabled = !state.isAutoNotesEnabled;
    UI.updateAutoNotesMenuLabel(state.isAutoNotesEnabled);

    if (state.isAutoNotesEnabled) {
        autoFillNotes();
    } else {
        state.notes.forEach(cellNotes => cellNotes.fill(false));
        triggerRender();
    }
}

function togglePause() {
    if (state.isGameWon) return;
    state.isPaused = !state.isPaused;
    UI.renderTimerUI(formatTime(state.timerSeconds), state.isPaused);
}

function startTimer() {
    clearInterval(state.timerId);
    state.timerSeconds = 0;
    state.isPaused = false;
    UI.renderTimerUI('00:00', false);

    state.timerId = setInterval(() => {
        if (!state.isGameWon && !state.isPaused) {
            UI.renderTimerUI(formatTime(++state.timerSeconds), false);
        }
    }, 1000);
}

function clearPeerNotes(index, val) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    for (let i = 0; i < 81; i++) {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === row || c === col || (Math.floor(r / 3) === boxRow && Math.floor(c / 3) === boxCol)) {
            state.notes[i][val] = false;
        }
    }
}

function autoFillNotes() {
    for (let i = 0; i < 81; i++) {
        state.notes[i].fill(false);
        if (state.board[i] === 0) {
            for (let num = 1; num <= 9; num++) {
                if (isValid(state.board, i, num)) state.notes[i][num] = true;
            }
        }
    }
    triggerRender();
}

function inputNumber(num) {
    const idx = state.selectedCell;
    if (idx === null || state.givens[idx] || state.isGameWon || state.isPaused) return;

    recordMove();

    if (num === 0) {
        state.board[idx] = 0;
        state.hints[idx] = false;
        state.notes[idx].fill(false);
    } else if (state.isNotesMode) {
        if (state.board[idx] !== 0) {
            state.board[idx] = 0;
            state.hints[idx] = false;
        }
        state.notes[idx][num] = !state.notes[idx][num];
    } else {
        state.board[idx] = state.board[idx] === num ? 0 : num;
        state.hints[idx] = false;
        state.notes[idx].fill(false);
        if (state.board[idx] !== 0) clearPeerNotes(idx, num);
    }

    triggerRender();
    UI.highlightCellPeers(idx);
    checkWinCondition();
}

function provideHint() {
    if (state.isGameWon || state.isPaused) return;
    recordMove();

    let targetIdx = state.selectedCell;
    if (targetIdx === null || state.givens[targetIdx] || state.board[targetIdx] === state.solution[targetIdx]) {
        const candidates = [];
        for (let i = 0; i < 81; i++) {
            if (!state.givens[i] && (state.board[i] === 0 || state.board[i] !== state.solution[i])) {
                candidates.push(i);
            }
        }
        if (!candidates.length) return;
        targetIdx = candidates[Math.floor(Math.random() * candidates.length)];
    }

    state.board[targetIdx] = state.solution[targetIdx];
    state.notes[targetIdx].fill(false);
    state.hints[targetIdx] = true;
    state.hintCount++;
    clearPeerNotes(targetIdx, state.solution[targetIdx]);
    selectCell(targetIdx, false);

    if (state.isAutoNotesEnabled) autoFillNotes();
    else triggerRender();
    checkWinCondition();
}

function resetPuzzle() {
    if (state.isGameWon || state.isPaused) return;
    state.undoStack.length = 0;

    for (let i = 0; i < 81; i++) {
        if (!state.givens[i]) {
            state.board[i] = 0;
            state.hints[i] = false;
            state.notes[i].fill(false);
        }
    }
    state.selectedCell = null;
    if (state.isAutoNotesEnabled) autoFillNotes();
    else triggerRender();
}

function checkWinCondition() {
    const isComplete = state.board.every((val, idx) => val !== 0 && isValid(state.board, idx, val));
    if (!isComplete) return;

    state.isGameWon = true;
    clearInterval(state.timerId);
    const finalTime = formatTime(state.timerSeconds);

    storage.saveStat({
        difficulty: state.currentDiffLabel,
        hints: state.hintCount,
        timeVal: state.timerSeconds
    });

    setTimeout(() => {
        shell.showWinModal(
            `You solved <strong>${state.currentDiffLabel}</strong> in <strong>${finalTime}</strong> with <strong>${state.hintCount}</strong> hint${state.hintCount === 1 ? '' : 's'}!`
        );
    }, 100);
}

function canSafelyRemoveClue(boardState, idx, minBoxGivens) {
    const val = boardState[idx];
    let digitCount = 0;
    for (let i = 0; i < 81; i++) {
        if (boardState[i] === val) digitCount++;
    }
    if (digitCount <= 1) return false;

    const startRow = Math.floor(Math.floor(idx / 9) / 3) * 3;
    const startCol = Math.floor((idx % 9) / 3) * 3;
    let boxGivens = 0;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (boardState[(startRow + r) * 9 + (startCol + c)] !== 0) boxGivens++;
        }
    }
    return boxGivens > minBoxGivens;
}

function newGame() {
    state.isGameWon = false;
    state.hintCount = 0;
    state.undoStack.length = 0;

    let minLogicTier = 1;
    let maxLogicTier = 1;
    if (state.currentClues <= 25) { minLogicTier = 3; maxLogicTier = 3; }
    else if (state.currentClues <= 28) { minLogicTier = 2; maxLogicTier = 3; }
    else if (state.currentClues <= 31) { minLogicTier = 2; maxLogicTier = 2; }

    const minBoxGivens = state.currentClues <= 26 ? 1 : 2;
    const targetRemoved = 81 - state.currentClues;

    let bestPuzzle = null;
    let bestSolution = null;
    let bestScore = -1;

    for (let attempt = 0; attempt < 35; attempt++) {
        const candidateSolution = Array(81).fill(0);
        solveSudoku(candidateSolution);
        const candidateBoard = [...candidateSolution];

        const cellIndices = Array.from({ length: 81 }, (_, i) => i);
        for (let i = cellIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
        }

        let removed = 0;
        let currentEval = { solvable: true, highestTierUsed: 1 };

        for (const idx of cellIndices) {
            if (removed >= targetRemoved) break;
            if (!canSafelyRemoveClue(candidateBoard, idx, minBoxGivens)) continue;

            const backup = candidateBoard[idx];
            candidateBoard[idx] = 0;

            if (countSolutions(candidateBoard, 2) === 1) {
                const evalResult = evaluatePuzzleLogic(candidateBoard, maxLogicTier);
                if (evalResult.solvable) {
                    removed++;
                    currentEval = evalResult;
                } else {
                    candidateBoard[idx] = backup;
                }
            } else {
                candidateBoard[idx] = backup;
            }
        }

        const meetsMinLogic = currentEval.highestTierUsed >= minLogicTier ? 100 : 0;
        const score = meetsMinLogic + removed;

        if (score > bestScore) {
            bestScore = score;
            bestPuzzle = candidateBoard;
            bestSolution = candidateSolution;
        }
        if (meetsMinLogic > 0 && removed >= targetRemoved) break;
    }

    state.solution = bestSolution;
    state.board = bestPuzzle;
    state.givens = state.board.map(val => val !== 0);
    state.hints = Array(81).fill(false);
    state.notes = Array.from({ length: 81 }, () => Array(10).fill(false));
    state.selectedCell = null;

    if (state.isAutoNotesEnabled) autoFillNotes();
    else triggerRender();
    startTimer();
}

// --- Event Wiring ---
initTheme(document.getElementById('theme-menu-btn'));

UI.dom.keypadBtns.forEach(btn => {
    btn.addEventListener('click', () => inputNumber(Number(btn.dataset.num)));
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        shell.handleGlobalEscape();
        return;
    }
    if (shell.isStatsModalOpen() || shell.isHowToModalOpen() || shell.isWinModalOpen() || shell.isSidePanelOpen()) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
    }

    if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        togglePause();
        return;
    }

    if (state.selectedCell === null || state.isGameWon || state.isPaused) return;

    if (e.key >= '1' && e.key <= '9') inputNumber(parseInt(e.key, 10));
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') inputNumber(0);
    else if (e.key.toLowerCase() === 'n') toggleNotesMode();
    else if (e.key === 'ArrowUp' && state.selectedCell >= 9) { e.preventDefault(); selectCell(state.selectedCell - 9, true); }
    else if (e.key === 'ArrowDown' && state.selectedCell < 72) { e.preventDefault(); selectCell(state.selectedCell + 9, true); }
    else if (e.key === 'ArrowLeft' && state.selectedCell % 9 !== 0) { e.preventDefault(); selectCell(state.selectedCell - 1, true); }
    else if (e.key === 'ArrowRight' && state.selectedCell % 9 !== 8) { e.preventDefault(); selectCell(state.selectedCell + 1, true); }
});

UI.initBoardUI((idx) => selectCell(idx, false));
newGame();
