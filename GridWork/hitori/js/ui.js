// hitori/js/ui.js
export const dom = {
    boardEl: document.getElementById('board'),
    diffBtns: document.querySelectorAll('.diff-btn'),
    timerBtn: document.getElementById('timer-btn'),
    timerDisplay: document.getElementById('timer-text'),
    pauseOverlay: document.getElementById('pause-overlay'),
    modeToggleBtn: document.getElementById('mode-toggle'),
    modeIcon: document.getElementById('mode-icon'),
    modeLabel: document.getElementById('mode-label'),
    modeBadge: document.getElementById('mode-badge'),
    undoBtn: document.getElementById('undo-btn'),
    hintBtn: document.getElementById('hint-btn')
};

import { createGrid } from '../../shared/js/grid.js';

let grid = null;

const STATE_WORDS = ['unmarked', 'shaded', 'circled'];

const MODE_CONFIG = {
    false: {
        icon: '<rect x="4" y="4" width="16" height="16" rx="2" fill="#4f46e5" stroke="none"/>',
        label: 'Shade Mode:'
    },
    true: {
        icon: '<circle cx="12" cy="12" r="8" />',
        label: 'Circle Mode:'
    }
};

export function setActiveDifficultyBtn(activeBtn) {
    dom.diffBtns.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

export function renderTimerUI(formattedTime, isPaused) {
    const timerDisplay = document.getElementById('timer-text');
    const pauseOverlay = document.getElementById('pause-overlay');
    const timerBtn = document.getElementById('timer-btn');

    // While paused the board is hidden, so remove it from the tab order and accessibility tree.
    dom.boardEl.inert = isPaused;

    if (timerDisplay) timerDisplay.textContent = formattedTime;
    if (pauseOverlay) {
        pauseOverlay.classList.toggle('visible', isPaused);
        pauseOverlay.classList.toggle('open', isPaused);
        pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    }
    timerBtn?.classList.toggle('paused', isPaused);
}

export function renderModeUI(safeMode) {
    const modeToggleBtn = document.getElementById('mode-toggle');
    if (!modeToggleBtn) return;

    const config = MODE_CONFIG[Boolean(safeMode)];
    const modeIcon = document.getElementById('mode-icon');
    const modeLabel = document.getElementById('mode-label');
    const modeBadge = document.getElementById('mode-badge');

    modeToggleBtn.classList.toggle('cross-active', safeMode);
    modeToggleBtn.setAttribute('aria-pressed', String(safeMode));
    if (modeIcon) modeIcon.innerHTML = config.icon;
    if (modeLabel) modeLabel.textContent = config.label;
    if (modeBadge) {
        modeBadge.textContent = 'ON';
        modeBadge.className = 'user-notes toggle-status on';
    }
}

export function renderBoard({ size, numbers, playerGrid, hintCells, onCellClick, onCellRightClick, onCellFocus }) {
    dom.boardEl.style.setProperty('--grid-size', size);
    grid = createGrid({
        el: dom.boardEl,
        rows: size,
        label: 'Hitori grid',
        createCell: (r, c) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hitori-cell';

            const span = document.createElement('span');
            span.className = 'cell-num';
            span.textContent = numbers[r][c];
            btn.appendChild(span);

            btn.addEventListener('click', () => onCellClick(r, c));
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                onCellRightClick(r, c);
            });
            return btn;
        },
        onFocusCell: onCellFocus
    });

    syncBoardUI(size, numbers, playerGrid, hintCells);
}

export function syncBoardUI(size, numbers, playerGrid, hintCells) {
    const conflicts = computeConflicts(size, numbers, playerGrid);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = grid.cellAt(r, c);
            if (!cell) continue;
            const key = `${r},${c}`;
            const state = playerGrid[r][c]; // 0 = unknown, 1 = shaded, 2 = circled
            const isConflict = conflicts.has(key);
            cell.classList.toggle('shaded', state === 1);
            cell.classList.toggle('circled', state === 2);
            cell.classList.toggle('hinted', hintCells.has(key));
            cell.classList.toggle('conflict', isConflict);

            // The label carries the number AND the player's mark, which the visuals show by color/shape.
            const parts = [`Row ${r + 1}, column ${c + 1}`, `number ${numbers[r][c]}`, STATE_WORDS[state]];
            if (hintCells.has(key)) parts.push('hint');
            cell.setAttribute('aria-label', parts.join(', '));
            if (isConflict) cell.setAttribute('aria-invalid', 'true');
            else cell.removeAttribute('aria-invalid');
        }
    }
}

export function focusCell(size, r, c) {
    grid.focus(r, c);
}

function computeConflicts(size, numbers, playerGrid) {
    const conflicts = new Set();

    // 1. Adjacent shaded cells
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (playerGrid[r][c] !== 1) continue;
            if (r + 1 < size && playerGrid[r + 1][c] === 1) {
                conflicts.add(`${r},${c}`);
                conflicts.add(`${r + 1},${c}`);
            }
            if (c + 1 < size && playerGrid[r][c + 1] === 1) {
                conflicts.add(`${r},${c}`);
                conflicts.add(`${r},${c + 1}`);
            }
        }
    }

    // 2. Duplicate unshaded numbers in rows and columns
    for (let i = 0; i < size; i++) {
        const rowMap = new Map();
        const colMap = new Map();

        for (let j = 0; j < size; j++) {
            if (playerGrid[i][j] !== 1) {
                const val = numbers[i][j];
                if (rowMap.has(val)) {
                    conflicts.add(`${i},${j}`);
                    conflicts.add(`${i},${rowMap.get(val)}`);
                } else {
                    rowMap.set(val, j);
                }
            }

            if (playerGrid[j][i] !== 1) {
                const val = numbers[j][i];
                if (colMap.has(val)) {
                    conflicts.add(`${j},${i}`);
                    conflicts.add(`${colMap.get(val)},${i}`);
                } else {
                    colMap.set(val, j);
                }
            }
        }
    }

    return conflicts;
}
