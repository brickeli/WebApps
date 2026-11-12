// js/game.js

import { isValid, solveSudoku, countSolutions, evaluatePuzzleLogic } from './solver.js';
import { saveStats, renderStatsTable, sortStats } from './storage.js';
import { initBoardUI, toggleSidePanel, highlightCellPeers, renderBoard, updateAutoNotesMenuLabel, applyTheme } from './ui.js';

// Application State
let board = Array(81).fill(0);
let solution = Array(81).fill(0);
let givens = Array(81).fill(false);
let hints = Array(81).fill(false);
let notes = Array(81).fill(0).map(() => Array(10).fill(false));
let currentTheme = localStorage.getItem('sudoku_theme') || 'light';

let selectedCell = null;
let currentClues = 38;
let currentDiffLabel = 'Easy';
let isNotesMode = false;
let isPaused = false;
let hintCount = 0;
let timerSeconds = 0;
let timerInterval = null;
let isGameWon = false;
let isAutoNotesEnabled = false;

// Undo History Stack
const undoStack = [];

// DOM Elements
const boardEl = document.getElementById('board');
const timerBtnEl = document.getElementById('timer-btn');
const statsModalEl = document.getElementById('stats-modal');
const winModalEl = document.getElementById('win-modal');
const winMessageEl = document.getElementById('win-message');
const statsBodyEl = document.getElementById('stats-body');
const notesBtn = document.getElementById('mode-toggle');
const pauseOverlayEl = document.getElementById('pause-overlay');
const menuBtnEl = document.getElementById('menu-btn');
const sidePanelEl = document.getElementById('side-panel');
const menuOverlayEl = document.getElementById('menu-overlay');

// Global Window Event Bindings
window.executeMenuAction = function(action) {
    if (action === 'toggleAutoNotes') {
        toggleAutoNotes();
    } else if (action === 'toggleTheme') {
        toggleTheme();
    } else {
        toggleSidePanel(sidePanelEl, menuOverlayEl, menuBtnEl);
        if (action === 'newGame') newGame();
        else if (action === 'resetPuzzle') resetPuzzle();
        else if (action === 'showStats') toggleStatsModal();
    }
};

window.setDifficulty = function(level, clues, label, evt) {
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    if (evt && evt.target) evt.target.classList.add('active');
    currentClues = clues;
    currentDiffLabel = label;
    newGame();
};

window.toggleSidePanel = () => toggleSidePanel(sidePanelEl, menuOverlayEl, menuBtnEl);
window.toggleNotesMode = toggleNotesMode;
window.togglePause = togglePause;
window.inputNumber = inputNumber;
window.provideHint = provideHint;
window.undo = undo;
window.toggleStatsModal = toggleStatsModal;
window.closeWinModal = () => winModalEl.style.display = 'none';
window.sortStats = (col) => sortStats(col, statsBodyEl, formatTime);

// Record State Before User Actions
function recordMove() {
    undoStack.push({
        board: [...board],
        notes: notes.map(cellNotes => [...cellNotes]),
        hints: [...hints],
        selectedCell: selectedCell
    });
}

function undo() {
    if (undoStack.length === 0 || isGameWon || isPaused) return;

    const previousState = undoStack.pop();
    board = previousState.board;
    notes = previousState.notes;
    hints = previousState.hints;
    selectedCell = previousState.selectedCell;

    triggerRender();
    updateBoardHighlights(boardEl, board);
    if (selectedCell !== null) {
        highlightCellPeers(boardEl, selectedCell);
    }
}

function selectCell(index) {
    if (isPaused) return;
    selectedCell = index;
    highlightCellPeers(boardEl, index);
}

function toggleNotesMode() {
    if (isPaused) return;
    isNotesMode = !isNotesMode;
    const keypad = document.querySelector('.keypad');

    if (isNotesMode) {
        notesBtn.classList.add('notes-active');
        notesBtn.innerHTML = '<i class="fa-solid fa-pen-clip"></i> Notes Mode: <span class="user-notes toggle-status on">ON</span>';
    } else {
        notesBtn.classList.remove('notes-active');
        notesBtn.innerHTML = '<i class="fa-solid fa-pen-clip"></i> Notes Mode: <span class="user-notes toggle-status off">OFF</span>';
    }

    if (keypad) {
        keypad.classList.toggle('notes-active', isNotesMode);
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('sudoku_theme', currentTheme);
    applyTheme(currentTheme);
}
applyTheme(currentTheme);

function toggleAutoNotes() {
    if (isPaused || isGameWon) return;
    isAutoNotesEnabled = !isAutoNotesEnabled;

    updateAutoNotesMenuLabel(isAutoNotesEnabled);

    if (isAutoNotesEnabled) {
        autoFillNotes();
    } else {
        notes.forEach(cellNotes => cellNotes.fill(false));
        triggerRender();
    }
}

function togglePause() {
    if (isGameWon) return;
    isPaused = !isPaused;

    if (isPaused) {
        clearInterval(timerInterval);
        pauseOverlayEl.style.display = 'flex';

        timerBtnEl.classList.add('paused');
        const timerTextEl = document.getElementById('timer-text');
        if (timerTextEl) timerTextEl.textContent = 'Resume';
    } else {
        pauseOverlayEl.style.display = 'none';
        timerBtnEl.classList.remove('paused');
        startTimerInterval();
        updateTimerDisplay();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerSeconds = 0;
    isPaused = false;
    pauseOverlayEl.style.display = 'none';
    updateTimerDisplay();
    startTimerInterval();
}

function startTimerInterval() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isGameWon && !isPaused) {
            timerSeconds++;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    let minutes = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    let seconds = (timerSeconds % 60).toString().padStart(2, '0');

    const timerTextEl = document.getElementById('timer-text');
    if (timerTextEl) {
        timerTextEl.textContent = `${minutes}:${seconds}`;
    } else {
        timerBtnEl.textContent = `${minutes}:${seconds}`;
    }
}

function formatTime(totalSeconds) {
    let minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    let seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function clearPeerNotes(index, val) {
    let row = Math.floor(index / 9);
    let col = index % 9;
    for (let i = 0; i < 81; i++) {
        let r = Math.floor(i / 9);
        let c = i % 9;
        let inBox = (Math.floor(r / 3) === Math.floor(row / 3)) && (Math.floor(c / 3) === Math.floor(col / 3));
        if (r === row || c === col || inBox) {
            notes[i][val] = false;
        }
    }
}

function autoFillNotes() {
    for (let i = 0; i < 81; i++) {
        notes[i].fill(false);
        if (board[i] === 0) {
            for (let num = 1; num <= 9; num++) {
                if (isValid(board, i, num)) {
                    notes[i][num] = true;
                }
            }
        }
    }
    triggerRender();
}

function inputNumber(num) {
    if (selectedCell === null || givens[selectedCell] || isGameWon || isPaused) return;

    recordMove();

    if (num === 0) {
        board[selectedCell] = 0;
        hints[selectedCell] = false;
        notes[selectedCell].fill(false);
    } else if (isNotesMode) {
        if (board[selectedCell] !== 0) {
            board[selectedCell] = 0;
            hints[selectedCell] = false;
        }
        notes[selectedCell][num] = !notes[selectedCell][num];
    } else {
        board[selectedCell] = (board[selectedCell] === num) ? 0 : num;
        hints[selectedCell] = false;
        notes[selectedCell].fill(false);

        if (board[selectedCell] !== 0) {
            clearPeerNotes(selectedCell, num);
        }
    }

    triggerRender();
    checkWinCondition();
    updateBoardHighlights(boardEl, board);
    highlightCellPeers(boardEl, selectedCell);
}

function updateBoardHighlights(boardEl, boardState) {
    const cells = Array.from(boardEl.children);
    cells.forEach(cell => cell.classList.remove('duplicate'));

    for (let i = 0; i < 81; i++) {
        const val = boardState[i];
        if (!val || val === 0) continue;

        const row = Math.floor(i / 9);
        const col = i % 9;
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);

        for (let j = i + 1; j < 81; j++) {
            const otherVal = boardState[j];
            if (otherVal === val) {
                const r = Math.floor(j / 9);
                const c = j % 9;

                const isSameRow = r === row;
                const isSameCol = c === col;
                const isSameBox = Math.floor(r / 3) === boxRow && Math.floor(c / 3) === boxCol;

                if (isSameRow || isSameCol || isSameBox) {
                    cells[i].classList.add('duplicate');
                    cells[j].classList.add('duplicate');
                }
            }
        }
    }
}

function provideHint() {
    if (isGameWon || isPaused) return;

    recordMove();

    let targetIdx = selectedCell;
    if (targetIdx === null || givens[targetIdx] || board[targetIdx] === solution[targetIdx]) {
        let candidates = [];
        for (let i = 0; i < 81; i++) {
            if (!givens[i] && (board[i] === 0 || board[i] !== solution[i])) {
                candidates.push(i);
            }
        }
        if (candidates.length === 0) return;
        targetIdx = candidates[Math.floor(Math.random() * candidates.length)];
    }

    board[targetIdx] = solution[targetIdx];
    notes[targetIdx].fill(false);
    hints[targetIdx] = true;
    hintCount++;
    clearPeerNotes(targetIdx, solution[targetIdx]);
    selectCell(targetIdx);

    if (isAutoNotesEnabled) {
        autoFillNotes();
    } else {
        triggerRender();
    }
    checkWinCondition();
}

function resetPuzzle() {
    if (isGameWon || isPaused) return;
    undoStack.length = 0;

    for (let i = 0; i < 81; i++) {
        if (!givens[i]) {
            board[i] = 0;
            hints[i] = false;
            notes[i].fill(false);
        }
    }
    selectedCell = null;

    if (isAutoNotesEnabled) {
        autoFillNotes();
    } else {
        triggerRender();
    }
}

function toggleStatsModal() {
    if (statsModalEl.style.display === 'flex') {
        statsModalEl.style.display = 'none';
    } else {
        renderStatsTable(statsBodyEl, formatTime);
        statsModalEl.style.display = 'flex';
    }
}

function checkWinCondition() {
    // Verify all 81 cells are filled and obey Sudoku row/col/box rules
    const isCompleteAndValid = board.every((val, idx) => val !== 0 && isValid(board, idx, val));

    if (isCompleteAndValid) {
        isGameWon = true;
        clearInterval(timerInterval);
        saveStats(timerSeconds, currentDiffLabel, hintCount);
        setTimeout(() => {
            let minutes = Math.floor(timerSeconds / 60);
            let seconds = timerSeconds % 60;
            winMessageEl.textContent = `You solved the ${currentDiffLabel} puzzle in ${minutes}m ${seconds}s with ${hintCount} hints!`;
            winModalEl.style.display = 'flex';
        }, 100);
    }
}

function triggerRender() {
    renderBoard(boardEl, board, solution, givens, hints, notes, selectedCell);
}

// Helper: Checks minimum box & digit representation so Expert/Master boards stay fair
function canSafelyRemoveClue(boardState, idx, minBoxGivens) {
    const val = boardState[idx];

    // 1. Ensure at least 1 instance of every digit (1-9) remains on the board
    let digitCount = 0;
    for (let i = 0; i < 81; i++) {
        if (boardState[i] === val) digitCount++;
    }
    if (digitCount <= 1) return false;

    // 2. Ensure the 3x3 box keeps at least `minBoxGivens` anchors
    const startRow = Math.floor(Math.floor(idx / 9) / 3) * 3;
    const startCol = Math.floor((idx % 9) / 3) * 3;
    let boxGivens = 0;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (boardState[(startRow + r) * 9 + (startCol + c)] !== 0) {
                boxGivens++;
            }
        }
    }
    if (boxGivens <= minBoxGivens) return false;

    return true;
}

function newGame() {
    isGameWon = false;
    hintCount = 0;
    undoStack.length = 0;

    // Set difficulty floors & ceilings so Hard/Expert/Master never generate trivial Singles boards
    let minLogicTier = 1;
    let maxLogicTier = 1;

    if (currentClues <= 25) {
        // Master
        minLogicTier = 3;
        maxLogicTier = 3;
    } else if (currentClues <= 28) {
        // Expert
        minLogicTier = 2;
        maxLogicTier = 3;
    } else if (currentClues <= 31) {
        // Hard
        minLogicTier = 2;
        maxLogicTier = 2;
    }

    const minBoxGivens = currentClues <= 26 ? 1 : 2;
    const targetRemoved = 81 - currentClues;

    let bestPuzzle = null;
    let bestSolution = null;
    let bestScore = -1;

    // Run up to 35 rapid generations (<20ms total) to hit both clue count AND minimum logic depth
    for (let attempt = 0; attempt < 35; attempt++) {
        const candidateSolution = Array(81).fill(0);
        solveSudoku(candidateSolution);

        const candidateBoard = [...candidateSolution];

        // Fisher-Yates shuffle all 81 cell indices
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

        // Score favors hitting the required logic tier first, then hitting the exact clue target
        const meetsMinLogic = currentEval.highestTierUsed >= minLogicTier ? 100 : 0;
        const score = meetsMinLogic + removed;

        if (score > bestScore) {
            bestScore = score;
            bestPuzzle = candidateBoard;
            bestSolution = candidateSolution;
        }

        if (meetsMinLogic > 0 && removed >= targetRemoved) break;
    }

    solution = bestSolution;
    board = bestPuzzle;
    givens = board.map(val => val !== 0);
    hints = Array(81).fill(false);
    notes = Array(81).fill(0).map(() => Array(10).fill(false));
    selectedCell = null;

    if (isAutoNotesEnabled) {
        autoFillNotes();
    } else {
        triggerRender();
    }
    startTimer();
}

// Global Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidePanelEl.classList.contains('open')) {
        toggleSidePanel(sidePanelEl, menuOverlayEl, menuBtnEl);
        return;
    }

    // Ctrl+Z or Cmd+Z Undo Shortcut
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
    }

    if (selectedCell === null || isGameWon || isPaused) return;
    if (e.key >= '1' && e.key <= '9') inputNumber(parseInt(e.key));
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') inputNumber(0);
    else if (e.key === 'n' || e.key === 'N') toggleNotesMode();
    else if (e.key === 'ArrowUp' && selectedCell >= 9) selectCell(selectedCell - 9);
    else if (e.key === 'ArrowDown' && selectedCell < 72) selectCell(selectedCell + 9);
    else if (e.key === 'ArrowLeft' && selectedCell % 9 !== 0) selectCell(selectedCell - 1);
    else if (e.key === 'ArrowRight' && selectedCell % 9 !== 8) selectCell(selectedCell + 1);
});

// App Initialization
initBoardUI(boardEl, selectCell);
newGame();
