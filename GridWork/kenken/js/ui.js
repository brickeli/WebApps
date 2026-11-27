// kenken/js/ui.js
import { isCageSatisfied } from './solver.js';

export const dom = {
    boardEl: document.getElementById('board'),
    keypadEl: document.getElementById('keypad')
};

export function renderKeypad(size, isNotesMode, onInput) {
    dom.keypadEl.innerHTML = '';
    dom.keypadEl.style.gridTemplateColumns = `repeat(${Math.min(size + 1, 5)}, 1fr)`;
    dom.keypadEl.classList.toggle('notes-active', isNotesMode);

    for (let n = 1; n <= size; n++) {
        const btn = document.createElement('button');
        btn.className = 'keypad-btn';
        btn.dataset.num = String(n);
        btn.innerHTML = `<span class="key-num">${n}</span>`;
        btn.addEventListener('click', () => onInput(n));
        dom.keypadEl.appendChild(btn);
    }

    const clearBtn = document.createElement('button');
    clearBtn.className = 'keypad-btn';
    clearBtn.dataset.num = '0';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => onInput(0));
    dom.keypadEl.appendChild(clearBtn);
}

export function renderTimerUI(timeStr, isPaused) {
    const timerBtn = document.getElementById('timer-btn');
    const timerText = document.getElementById('timer-text');
    const pauseOverlay = document.getElementById('pause-overlay');

    timerBtn?.classList.toggle('paused', isPaused);
    if (pauseOverlay) {
        pauseOverlay.classList.toggle('visible', isPaused);
        pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    }
    if (timerText) timerText.textContent = isPaused ? 'Resume' : timeStr;
}

export function renderNotesModeUI(isNotesMode) {
    const notesBtn = document.getElementById('mode-toggle');
    notesBtn?.classList.toggle('notes-active', isNotesMode);
    notesBtn?.setAttribute('aria-pressed', String(isNotesMode));
    dom.keypadEl?.classList.toggle('notes-active', isNotesMode);

    const badge = document.getElementById('mode-badge');
    if (badge) {
        badge.textContent = isNotesMode ? 'ON' : 'OFF';
        badge.className = `user-notes toggle-status ${isNotesMode ? 'on' : 'off'}`;
    }
}

export function renderBoard({ size, cages, playerGrid, hintCells, notes, selected, onSelectCell }) {
    dom.boardEl.style.setProperty('--grid-size', size);
    dom.boardEl.innerHTML = '';

    const cageMap = Array.from({ length: size }, () => Array(size).fill(null));
    const anchorMap = new Map();

    cages.forEach(cage => {
        cage.cells.forEach(({ r, c }) => { cageMap[r][c] = cage.id; });
        const anchor = cage.cells[0];
        anchorMap.set(`${anchor.r},${anchor.c}`, cage.label);
    });

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.tabIndex = 0;
            cell.setAttribute('role', 'gridcell');
            cell.dataset.r = r;
            cell.dataset.c = c;

            if (c < size - 1 && cageMap[r][c] !== cageMap[r][c + 1]) cell.classList.add('cage-right');
            if (r < size - 1 && cageMap[r][c] !== cageMap[r + 1][c]) cell.classList.add('cage-bottom');

            cell.addEventListener('click', () => onSelectCell(r, c, false));
            cell.addEventListener('focus', () => onSelectCell(r, c, false));
            dom.boardEl.appendChild(cell);
        }
    }

    syncBoardUI({ size, cages, playerGrid, hintCells, notes, selected, anchorMap });
}

export function syncBoardUI({ size, cages, playerGrid, hintCells, notes, selected, anchorMap }) {
    if (!anchorMap) {
        anchorMap = new Map();
        cages.forEach(cage => anchorMap.set(`${cage.cells[0].r},${cage.cells[0].c}`, cage.label));
    }

    const conflicts = computeConflicts(size, cages, playerGrid);
    const counts = Array(size + 1).fill(0);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = dom.boardEl.children[r * size + c];
            if (!cell) continue;

            const val = playerGrid[r][c];
            const key = `${r},${c}`;
            const isSelected = selected && selected.r === r && selected.c === c;
            const isPeer = selected && !isSelected && (selected.r === r || selected.c === c);

            cell.classList.toggle('selected', Boolean(isSelected));
            cell.classList.toggle('peer-highlight', Boolean(isPeer));
            cell.classList.toggle('user-input', val !== 0 && !hintCells.has(key));
            cell.classList.toggle('hint-cell', val !== 0 && hintCells.has(key));
            cell.classList.toggle('conflict', conflicts.has(key));

            cell.innerHTML = '';
            const clueText = anchorMap.get(key);
            if (clueText) {
                const clueEl = document.createElement('span');
                clueEl.className = 'cage-clue';
                clueEl.textContent = clueText;
                cell.appendChild(clueEl);
            }

            if (val !== 0) {
                counts[val]++;
                cell.appendChild(document.createTextNode(String(val)));
            } else {
                const cellNotes = notes[r][c];
                if (cellNotes.some(Boolean)) {
                    const grid = document.createElement('div');
                    grid.className = 'notes-grid';
                    for (let n = 1; n <= size; n++) {
                        const item = document.createElement('div');
                        item.className = 'note-item';
                        if (cellNotes[n]) item.textContent = String(n);
                        grid.appendChild(item);
                    }
                    cell.appendChild(grid);
                }
            }
        }
    }

    for (let n = 1; n <= size; n++) {
        const btn = dom.keypadEl.querySelector(`.keypad-btn[data-num="${n}"]`);
        btn?.classList.toggle('completed', counts[n] >= size);
    }
}

function computeConflicts(size, cages, playerGrid) {
    const bad = new Set();

    // Row & column duplicates
    for (let i = 0; i < size; i++) {
        for (let a = 0; a < size; a++) {
            for (let b = a + 1; b < size; b++) {
                if (playerGrid[i][a] !== 0 && playerGrid[i][a] === playerGrid[i][b]) {
                    bad.add(`${i},${a}`);
                    bad.add(`${i},${b}`);
                }
                if (playerGrid[a][i] !== 0 && playerGrid[a][i] === playerGrid[b][i]) {
                    bad.add(`${a},${i}`);
                    bad.add(`${b},${i}`);
                }
            }
        }
    }

    // Completed cages that fail their math target
    for (const cage of cages) {
        const vals = cage.cells.map(({ r, c }) => playerGrid[r][c]);
        if (vals.every(v => v !== 0) && !isCageSatisfied(cage, vals)) {
            cage.cells.forEach(({ r, c }) => bad.add(`${r},${c}`));
        }
    }

    return bad;
}

export function focusCell(size, r, c) {
    dom.boardEl.children[r * size + c]?.focus();
}
