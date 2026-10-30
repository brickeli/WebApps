// js/game.js

import { isValid, solveSudoku } from './solver.js';
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
    // Toggle visual state on the number pad wrapper to scale buttons
  if (keypad) {
    keypad.classList.toggle('notes-active', isNotesMode);
  }

  // Optional: Update board selection highlights or cursor styling if applicable
  updateUI();
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

        // Pause timer UI state
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

    // Snapshot state for undo prior to mutation
    recordMove();

    if (num === 0) {
        // Clear value, hints, and notes for the selected cell
        board[selectedCell] = 0;
        hints[selectedCell] = false;
        notes[selectedCell].fill(false);
    } else if (isNotesMode) {
        // Clear any placed primary value when entering Notes Mode on a cell
        if (board[selectedCell] !== 0) {
            board[selectedCell] = 0;
            hints[selectedCell] = false;
        }

        // Toggle the specific note boolean (true -> false or false -> true)
        notes[selectedCell][num] = !notes[selectedCell][num];
    } else {
        // Standard Entry Mode
        board[selectedCell] = (board[selectedCell] === num) ? 0 : num; // Toggle value off if re-pressed
        hints[selectedCell] = false;
        notes[selectedCell].fill(false); // Clear notes on primary entry

        if (board[selectedCell] !== 0) {
            clearPeerNotes(selectedCell, num);
        }
    }

    // Always re-render the board UI to show the updated note state
    triggerRender();
    checkWinCondition();
    updateBoardHighlights(boardEl, board);
    highlightCellPeers(boardEl, selectedCell);
}

function updateBoardHighlights(boardEl, boardState) {
    const cells = Array.from(boardEl.children);

    // 1. Clear existing duplicate styles
    cells.forEach(cell => cell.classList.remove('duplicate'));

    // 2. Compare entries directly from the numerical state array
    for (let i = 0; i < 81; i++) {
        const val = boardState[i];

        // Skip empty/unplaced cells
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
    undoStack.length = 0; // Clear undo stack on reset

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
    if (board.every((val, idx) => val === solution[idx])) {
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

function newGame() {
    isGameWon = false;
    hintCount = 0;
    undoStack.length = 0; // Reset undo history for new game

    solution = Array(81).fill(0);
    solveSudoku(solution);

    board = [...solution];
    givens = Array(81).fill(true);
    hints = Array(81).fill(false);
    notes = Array(81).fill(0).map(() => Array(10).fill(false));

    let removeCount = 81 - currentClues;
    let removed = 0;
    while (removed < removeCount) {
        let idx = Math.floor(Math.random() * 81);
        if (board[idx] !== 0) {
            board[idx] = 0;
            givens[idx] = false;
            removed++;
        }
    }
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
