
//Initializes the 81 cell elements in the board grid.
export function initBoardUI(boardEl, onSelectCell) {
    boardEl.innerHTML = '';
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => onSelectCell(i));
        boardEl.appendChild(cell);
    }
}

//Toggles the slide-out navigation panel.
export function toggleSidePanel(sidePanelEl, menuOverlayEl, menuBtnEl) {
    const isOpen = sidePanelEl.classList.contains('open');
    if (isOpen) {
        sidePanelEl.classList.remove('open');
        menuOverlayEl.classList.remove('open');
        menuBtnEl.setAttribute('aria-expanded', 'false');
    } else {
        sidePanelEl.classList.add('open');
        menuOverlayEl.classList.add('open');
        menuBtnEl.setAttribute('aria-expanded', 'true');
    }
}

//Highlights selected cell and its row, column, and 3x3 box peers.
export function highlightCellPeers(boardEl, index) {
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('selected', 'highlight');
    });
    if (index === null) return;

    const cellEl = boardEl.children[index];
    cellEl.classList.add('selected');

    let row = Math.floor(index / 9);
    let col = index % 9;
    for (let i = 0; i < 81; i++) {
        let r = Math.floor(i / 9);
        let c = i % 9;
        if (r === row || c === col || (Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3))) {
            boardEl.children[i].classList.add('highlight');
        }
    }
    cellEl.classList.remove('highlight');
}

//Renders board values, given states, hints, and notes grids.
export function renderBoard(boardEl, board, solution, givens, hints, notes, selectedCell) {
    for (let i = 0; i < 81; i++) {
        const cellEl = boardEl.children[i];
        const val = board[i];
        cellEl.textContent = '';
        cellEl.className = 'cell';

        if (val !== 0) {
            cellEl.textContent = val;
            cellEl.dataset.value = val; // <-- Add this to sync dataset value for highlight scanner

            if (givens[i]) {
                cellEl.classList.add('given');
            } else if (hints[i]) {
                cellEl.classList.add('hint-cell');
            } else {
                cellEl.classList.add('user-input');
            }
        } else {
            cellEl.dataset.value = ''; // <-- Clear dataset value for empty/notes cells

            const notesGrid = document.createElement('div');
            notesGrid.className = 'notes-grid';
            for (let n = 1; n <= 9; n++) {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                if (notes[i][n]) {
                    noteItem.textContent = n;
                }
                notesGrid.appendChild(noteItem);
            }
            cellEl.appendChild(notesGrid);
        }

        if (i === selectedCell) {
            cellEl.classList.add('selected');
        }
    }
    updateCompletedKeypadNumbers(board, solution);
}

//Grays out keypad digits that are fully completed (placed correctly 9 times).
export function updateCompletedKeypadNumbers(board, solution) {
    let counts = Array(10).fill(0);
    for (let i = 0; i < 81; i++) {
        let val = board[i];
        if (val >= 1 && val <= 9 && val === solution[i]) {
            counts[val]++;
        }
    }

    for (let num = 1; num <= 9; num++) {
        const keyBtn = document.getElementById(`key-${num}`);
        if (keyBtn) {
            if (counts[num] === 9) {
                keyBtn.classList.add('completed');
            } else {
                keyBtn.classList.remove('completed');
            }
        }
    }
}

/**
 * Updates the Auto-Fill Notes menu item label based on toggle state.
 */
 export function updateAutoNotesMenuLabel(isEnabled) {
     const autoNotesBtn = document.getElementById('auto-notes-menu-btn');
     if (autoNotesBtn) {
         if (isEnabled) {
             autoNotesBtn.innerHTML = '<i class="fa-solid fa-file-pen"></i> Auto-Fill Notes <span class="toggle-status on">ON</span>';
             autoNotesBtn.classList.add('active-toggle');
         } else {
             autoNotesBtn.innerHTML = '<i class="fa-solid fa-file-pen"></i> Auto-Fill Notes <span class="toggle-status off">OFF</span>';
             autoNotesBtn.classList.remove('active-toggle');
         }
     }
 }

 /**
 * Applies the given theme ('light' or 'dark') to the document root and updates the menu toggle button.
 */
export function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('theme-menu-btn');
    if (themeBtn) {
        if (theme === 'dark') {
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Theme: <span class="toggle-status dark-pill">DARK</span>';
        } else {
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Theme: <span class="toggle-status light-pill">LIGHT</span>';
        }
    }
}
