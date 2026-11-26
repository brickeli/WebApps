// sudoku/js/ui.js
export const dom = {
    boardEl: document.getElementById('board'),
    timerBtn: document.getElementById('timer-btn'),
    timerText: document.getElementById('timer-text'),
    pauseOverlay: document.getElementById('pause-overlay'),
    diffBtns: document.querySelectorAll('.diff-btn'),
    keypad: document.querySelector('.keypad'),
    keypadBtns: document.querySelectorAll('.keypad-btn[data-num]'),
    notesBtn: document.getElementById('mode-toggle'),
    autoNotesMenuBtn: document.getElementById('auto-notes-menu-btn'),
    themeMenuBtn: document.getElementById('theme-menu-btn'),
    resetMenuBtn: document.getElementById('reset-menu-btn'),
    newgameMenuBtn: document.getElementById('newgame-menu-btn'),
    statsMenuBtn: document.getElementById('stats-menu-btn'),
    hintBtn: document.getElementById('hint-btn'),
    undoBtn: document.getElementById('undo-btn')
};

export function initBoardUI(onSelectCell) {
    dom.boardEl.innerHTML = '';
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.tabIndex = 0;
        cell.dataset.index = i;
        cell.addEventListener('click', () => onSelectCell(i));
        cell.addEventListener('focus', () => onSelectCell(i));
        dom.boardEl.appendChild(cell);
    }
}

export function setActiveDifficultyBtn(activeBtn) {
    dom.diffBtns.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

export function renderTimerUI(timeStr, isPaused) {
    dom.timerBtn.classList.toggle('paused', isPaused);
    dom.pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    if (dom.timerText) {
        dom.timerText.textContent = isPaused ? 'Resume' : timeStr;
    } else {
        dom.timerBtn.textContent = isPaused ? 'Resume' : timeStr;
    }
}

export function renderNotesModeUI(isNotesMode) {
    dom.notesBtn?.classList.toggle('notes-active', isNotesMode);
    dom.notesBtn?.setAttribute('aria-pressed', String(isNotesMode));
    dom.keypad?.classList.toggle('notes-active', isNotesMode);

    const badge = document.getElementById('mode-badge');
    if (badge) {
        badge.textContent = isNotesMode ? 'ON' : 'OFF';
        badge.className = `user-notes toggle-status ${isNotesMode ? 'on' : 'off'}`;
    }
}

export function updateAutoNotesMenuLabel(isEnabled) {
    dom.autoNotesMenuBtn?.classList.toggle('active-toggle', isEnabled);
    const status = document.getElementById('auto-notes-status');
    if (status) {
        status.textContent = isEnabled ? 'ON' : 'OFF';
        status.className = `toggle-status ${isEnabled ? 'on' : 'off'}`;
    }
}

export function highlightCellPeers(index) {
    const cells = Array.from(dom.boardEl.children);
    cells.forEach(c => c.classList.remove('selected', 'highlight'));
    if (index === null) return;

    const cellEl = cells[index];
    cellEl.classList.add('selected');

    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    for (let i = 0; i < 81; i++) {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === row || c === col || (Math.floor(r / 3) === boxRow && Math.floor(c / 3) === boxCol)) {
            cells[i].classList.add('highlight');
        }
    }
    cellEl.classList.remove('highlight');
}

export function updateDuplicateHighlights(boardState) {
    const cells = Array.from(dom.boardEl.children);
    cells.forEach(cell => cell.classList.remove('duplicate'));

    for (let i = 0; i < 81; i++) {
        const val = boardState[i];
        if (!val) continue;

        const row = Math.floor(i / 9);
        const col = i % 9;
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);

        for (let j = i + 1; j < 81; j++) {
            if (boardState[j] === val) {
                const r = Math.floor(j / 9);
                const c = j % 9;
                if (r === row || c === col || (Math.floor(r / 3) === boxRow && Math.floor(c / 3) === boxCol)) {
                    cells[i].classList.add('duplicate');
                    cells[j].classList.add('duplicate');
                }
            }
        }
    }
}

export function renderBoard(board, solution, givens, hints, notes, selectedCell) {
    for (let i = 0; i < 81; i++) {
        const cellEl = dom.boardEl.children[i];
        const val = board[i];
        cellEl.textContent = '';
        cellEl.className = 'cell';

        if (val !== 0) {
            cellEl.textContent = val;
            cellEl.dataset.value = val;
            if (givens[i]) cellEl.classList.add('given');
            else if (hints[i]) cellEl.classList.add('hint-cell');
            else cellEl.classList.add('user-input');
        } else {
            cellEl.dataset.value = '';
            const notesGrid = document.createElement('div');
            notesGrid.className = 'notes-grid';
            for (let n = 1; n <= 9; n++) {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                if (notes[i][n]) noteItem.textContent = n;
                notesGrid.appendChild(noteItem);
            }
            cellEl.appendChild(notesGrid);
        }

        if (i === selectedCell) cellEl.classList.add('selected');
    }

    const counts = Array(10).fill(0);
    for (let i = 0; i < 81; i++) {
        const val = board[i];
        if (val >= 1 && val <= 9 && val === solution[i]) counts[val]++;
    }
    for (let num = 1; num <= 9; num++) {
        document.getElementById(`key-${num}`)?.classList.toggle('completed', counts[num] === 9);
    }
}
