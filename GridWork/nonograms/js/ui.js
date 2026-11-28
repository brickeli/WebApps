// nonograms/js/ui.js
import { getClues } from './solver.js';

export const dom = {
    boardEl: document.getElementById('board'),
    rowCluesEl: document.getElementById('row-clues'),
    colCluesEl: document.getElementById('col-clues'),
    guessBar: document.getElementById('pixel-guess-bar'),
    guessInput: document.getElementById('pixel-guess-input'),
    guessFeedback: document.getElementById('pixel-guess-feedback')
};

import { createGrid } from '../../shared/js/grid.js';

let grid = null;

// Clues are read as "Row 3 clues: 2 1" (+ ", complete" once the player's fills match).
function clueLabel(kind, index, clues, isSatisfied) {
    return `${kind} ${index + 1} clues: ${clues.join(' ')}${isSatisfied ? ', complete' : ''}`;
}

export function renderModeUI(crossMode) {
    const modeToggleBtn = document.getElementById('mode-toggle');
    if (!modeToggleBtn) return;

    const modeIcon = document.getElementById('mode-icon');
    const modeLabel = document.getElementById('mode-label');
    const modeBadge = document.getElementById('mode-badge');

    modeToggleBtn.classList.toggle('cross-active', crossMode);
    modeToggleBtn.setAttribute('aria-pressed', String(crossMode));

    if (crossMode) {
        if (modeIcon) modeIcon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
        if (modeLabel) modeLabel.textContent = 'Cross Mode:';
    } else {
        if (modeIcon) modeIcon.innerHTML = '<rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" stroke="none"/>';
        if (modeLabel) modeLabel.textContent = 'Fill Mode:';
    }

    if (modeBadge) {
        modeBadge.textContent = 'ON';
        modeBadge.className = 'user-notes toggle-status on';
    }
}

export function renderTimerUI(timeStr, isPaused) {
    const timerBtn = document.getElementById('timer-btn');
    const timerText = document.getElementById('timer-text');
    const pauseOverlay = document.getElementById('pause-overlay');

    // While paused the board is hidden, so remove it from the tab order and accessibility tree.
    dom.boardEl.inert = isPaused;

    timerBtn?.classList.toggle('paused', isPaused);
    if (pauseOverlay) {
        pauseOverlay.classList.toggle('visible', isPaused);
        pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    }
    if (timerText) timerText.textContent = isPaused ? 'Paused' : timeStr;
}

export function renderClues(solution) {
    const size = solution.length;
    const mid = Math.floor(size / 2);
    dom.rowCluesEl.innerHTML = '';
    dom.colCluesEl.innerHTML = '';

    for (let r = 0; r < size; r++) {
        const clues = getClues(solution[r]);
        const clueDiv = document.createElement('div');
        clueDiv.className = 'row-clue';
        if (size > 5 && (r + 1) % mid === 0 && r !== size - 1) {
            clueDiv.style.borderBottom = '2px solid var(--border-thick)';
        }
        clueDiv.innerHTML = clues.map(c => `<span>${c}</span>`).join('');
        clueDiv.setAttribute('role', 'group');
        clueDiv.setAttribute('aria-label', clueLabel('Row', r, clues, false));
        dom.rowCluesEl.appendChild(clueDiv);
    }

    for (let c = 0; c < size; c++) {
        const clues = getClues(solution.map(row => row[c]));
        const clueDiv = document.createElement('div');
        clueDiv.className = 'col-clue';
        if (size > 5 && (c + 1) % mid === 0 && c !== size - 1) {
            clueDiv.style.borderRight = '2px solid var(--border-thick)';
        }
        clueDiv.innerHTML = clues.map(c => `<span>${c}</span>`).join('');
        clueDiv.setAttribute('role', 'group');
        clueDiv.setAttribute('aria-label', clueLabel('Column', c, clues, false));
        dom.colCluesEl.appendChild(clueDiv);
    }
}

export function updateClueCompletion(solution, playerGrid) {
    const size = solution.length;

    for (let r = 0; r < size; r++) {
        const targetClues = getClues(solution[r]);
        const target = targetClues.join(',');
        const current = getClues(playerGrid[r].map(v => (v === 1 ? 1 : 0))).join(',');
        const rowClueEl = dom.rowCluesEl.children[r];
        rowClueEl?.classList.toggle('clue-satisfied', target === current);
        rowClueEl?.setAttribute('aria-label', clueLabel('Row', r, targetClues, target === current));
    }

    for (let c = 0; c < size; c++) {
        const targetClues = getClues(solution.map(row => row[c]));
        const target = targetClues.join(',');
        const current = getClues(playerGrid.map(row => (row[c] === 1 ? 1 : 0))).join(',');
        const colClueEl = dom.colCluesEl.children[c];
        colClueEl?.classList.toggle('clue-satisfied', target === current);
        colClueEl?.setAttribute('aria-label', clueLabel('Column', c, targetClues, target === current));
    }
}

export function buildCellAriaLabel(solution, playerGrid, r, c) {
    const state = playerGrid[r][c];
    const stateText = state === 1 ? 'filled' : state === 2 ? 'crossed' : 'empty';
    const rowClueText = getClues(solution[r]).join(' ');
    const colClueText = getClues(solution.map(row => row[c])).join(' ');
    return `Row ${r + 1} (clues ${rowClueText}), Column ${c + 1} (clues ${colClueText}), ${stateText}`;
}

export function renderBoard({ size, difficultyLabel, solution, playerGrid, handlers }) {
    dom.boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    const mid = Math.floor(size / 2);
    const container = document.getElementById('game-container');
    if (container) container.dataset.size = size;

    grid = createGrid({
        el: dom.boardEl,
        rows: size,
        label: `${difficultyLabel} ${size} by ${size} Nonogram Grid`,
        createCell: (r, c) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('aria-label', buildCellAriaLabel(solution, playerGrid, r, c));

            if (size > 5) {
                if ((c + 1) % mid === 0 && c !== size - 1) cell.classList.add('border-right');
                if ((r + 1) % mid === 0 && r !== size - 1) cell.classList.add('border-bottom');
            }

            cell.addEventListener('mousedown', (e) => handlers.onCellStart(e, r, c, e.button === 2));
            cell.addEventListener('mouseenter', () => handlers.onCellEnter(r, c));
            cell.addEventListener('touchstart', (e) => handlers.onCellStart(e, r, c, false), { passive: false });
            cell.addEventListener('contextmenu', (e) => e.preventDefault());
            return cell;
        },
        onFocusCell: handlers.onCellFocus
    });
}

export function updateCellUI({ size, solution, playerGrid, hintCells, r, c }) {
    const cell = grid.cellAt(r, c);
    if (!cell) return;
    cell.classList.remove('filled', 'crossed', 'hint-cell');
    if (playerGrid[r][c] === 1) {
        cell.classList.add('filled');
        if (hintCells.has(`${r},${c}`)) cell.classList.add('hint-cell');
    } else if (playerGrid[r][c] === 2) {
        cell.classList.add('crossed');
    }
    cell.setAttribute('aria-label', buildCellAriaLabel(solution, playerGrid, r, c));
}

export function updateFocusedCellUI(size, prevCell, nextCell, moveDomFocus = true) {
    grid.cellAt(prevCell.r, prevCell.c)?.classList.remove('focused');
    const nextEl = grid.cellAt(nextCell.r, nextCell.c);
    if (nextEl) {
        nextEl.classList.add('focused');
        grid.setTabbable(nextCell.r, nextCell.c);
        if (moveDomFocus) nextEl.focus();
    }
}

export function toggleGuessBar(isPixelMode) {
    if (!dom.guessBar) return;
    dom.guessBar.hidden = !isPixelMode;
    if (dom.guessInput) {
        dom.guessInput.value = '';
        dom.guessInput.removeAttribute('aria-invalid');
    }
    if (dom.guessFeedback) {
        dom.guessFeedback.textContent = '';
        dom.guessFeedback.classList.remove('prompt');
    }
}

export function showGuessError(message) {
    if (!dom.guessInput || !dom.guessFeedback) return;
    dom.guessFeedback.classList.remove('prompt');
    dom.guessInput.setAttribute('aria-invalid', 'true');
    dom.guessFeedback.textContent = message;
    dom.guessInput.select();
}

export function promptFinalPixelGuess() {
    if (!dom.guessInput || !dom.guessFeedback) return;
    dom.guessInput.removeAttribute('aria-invalid');
    dom.guessFeedback.classList.add('prompt');
    dom.guessFeedback.textContent = 'Picture complete! Type what the object is to finish.';
    dom.guessInput.focus();
}
