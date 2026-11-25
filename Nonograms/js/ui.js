import { getClues } from './solver.js';

export const dom = {
    boardEl: document.getElementById('board'),
    rowCluesEl: document.getElementById('row-clues'),
    colCluesEl: document.getElementById('col-clues'),
    timerBtn: document.getElementById('timer-btn'),
    timerText: document.getElementById('timer-text'),
    pauseOverlay: document.getElementById('pause-overlay'),
    diffBtns: document.querySelectorAll('.diff-btn'),

    // Sub-toolbar & Side Panel
    modeToggleBtn: document.getElementById('mode-toggle'),
    modeIcon: document.getElementById('mode-icon'),
    modeLabel: document.getElementById('mode-label'),
    modeBadge: document.getElementById('mode-badge'),
    menuBtn: document.getElementById('menu-btn'),
    closeMenuBtn: document.getElementById('close-menu-btn'),
    menuOverlay: document.getElementById('menu-overlay'),
    sidePanel: document.getElementById('side-panel'),
    themeMenuBtn: document.getElementById('theme-menu-btn'),
    themeStatus: document.getElementById('theme-status'),
    themeIcon: document.getElementById('theme-icon'),

    // Actions & Modals
    resetMenuBtn: document.getElementById('reset-menu-btn'),
    newgameMenuBtn: document.getElementById('newgame-menu-btn'),
    statsMenuBtn: document.getElementById('stats-menu-btn'),
    hintBtn: document.getElementById('hint-btn'),
    undoBtn: document.getElementById('undo-btn'),
    statsModal: document.getElementById('stats-modal'),
    statsBody: document.getElementById('stats-body'),
    statsHeaders: document.querySelectorAll('#stats-table th'),
    closeStatsBtn: document.getElementById('close-stats-btn'),
    winModal: document.getElementById('win-modal'),
    winMessage: document.getElementById('win-message'),
    closeWinBtn: document.getElementById('close-win-btn')
};

export function renderThemeUI(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        dom.themeStatus.textContent = 'DARK';
        dom.themeStatus.className = 'toggle-status dark-pill';
        dom.themeIcon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        dom.themeStatus.textContent = 'LIGHT';
        dom.themeStatus.className = 'toggle-status light-pill';
        dom.themeIcon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';
    }
}

export function setSidePanelOpen(isOpen) {
    dom.sidePanel.classList.toggle('open', isOpen);
    dom.menuOverlay.classList.toggle('open', isOpen);
    dom.menuBtn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
        dom.closeMenuBtn.focus();
    }
}

export function isSidePanelOpen() {
    return dom.sidePanel.classList.contains('open');
}

export function setActiveDifficultyBtn(activeBtn) {
    dom.diffBtns.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

export function renderModeUI(crossMode) {
    dom.modeToggleBtn.classList.toggle('cross-active', crossMode);
    dom.modeToggleBtn.setAttribute('aria-pressed', String(crossMode));
    if (crossMode) {
        dom.modeIcon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
        dom.modeLabel.textContent = 'Cross Mode:';
        dom.modeBadge.textContent = 'ON';
        dom.modeBadge.className = 'user-notes toggle-status on';
    } else {
        dom.modeIcon.innerHTML = '<rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" stroke="none"/>';
        dom.modeLabel.textContent = 'Fill Mode:';
        dom.modeBadge.textContent = 'ON';
        dom.modeBadge.className = 'user-notes toggle-status on';
    }
}

export function renderTimerUI(timeStr, isPaused) {
    dom.timerBtn.classList.toggle('paused', isPaused);
    dom.pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    dom.timerText.textContent = isPaused ? 'Paused' : timeStr;
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
        dom.rowCluesEl.appendChild(clueDiv);
    }

    for (let c = 0; c < size; c++) {
        const colData = solution.map(row => row[c]);
        const clues = getClues(colData);
        const clueDiv = document.createElement('div');
        clueDiv.className = 'col-clue';
        if (size > 5 && (c + 1) % mid === 0 && c !== size - 1) {
            clueDiv.style.borderRight = '2px solid var(--border-thick)';
        }
        clueDiv.innerHTML = clues.map(c => `<span>${c}</span>`).join('');
        dom.colCluesEl.appendChild(clueDiv);
    }
}

export function updateClueCompletion(solution, playerGrid) {
    const size = solution.length;

    for (let r = 0; r < size; r++) {
        const target = getClues(solution[r]).join(',');
        const current = getClues(playerGrid[r].map(v => (v === 1 ? 1 : 0))).join(',');
        if (dom.rowCluesEl.children[r]) {
            dom.rowCluesEl.children[r].classList.toggle('clue-satisfied', target === current);
        }
    }

    for (let c = 0; c < size; c++) {
        const target = getClues(solution.map(row => row[c])).join(',');
        const current = getClues(playerGrid.map(row => (row[c] === 1 ? 1 : 0))).join(',');
        if (dom.colCluesEl.children[c]) {
            dom.colCluesEl.children[c].classList.toggle('clue-satisfied', target === current);
        }
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
    dom.boardEl.setAttribute('role', 'grid');
    dom.boardEl.setAttribute('aria-label', `${difficultyLabel} ${size} by ${size} Nonogram Grid`);
    dom.boardEl.innerHTML = '';
    const mid = Math.floor(size / 2);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.tabIndex = 0;
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', buildCellAriaLabel(solution, playerGrid, r, c));

            if (size > 5) {
                if ((c + 1) % mid === 0 && c !== size - 1) cell.classList.add('border-right');
                if ((r + 1) % mid === 0 && r !== size - 1) cell.classList.add('border-bottom');
            }

            cell.dataset.r = r;
            cell.dataset.c = c;

            cell.addEventListener('focus', () => handlers.onCellFocus(r, c));
            cell.addEventListener('mousedown', (e) => handlers.onCellStart(e, r, c, e.button === 2));
            cell.addEventListener('mouseenter', () => handlers.onCellEnter(r, c));
            cell.addEventListener('touchstart', (e) => handlers.onCellStart(e, r, c, false), { passive: false });
            cell.addEventListener('contextmenu', (e) => e.preventDefault());

            dom.boardEl.appendChild(cell);
        }
    }
}

export function updateCellUI({ size, solution, playerGrid, hintCells, r, c }) {
    const cell = dom.boardEl.children[r * size + c];
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
    const prevEl = dom.boardEl.children[prevCell.r * size + prevCell.c];
    if (prevEl) {
        prevEl.classList.remove('focused');
    }

    const nextEl = dom.boardEl.children[nextCell.r * size + nextCell.c];
    if (nextEl) {
        nextEl.classList.add('focused');
        if (moveDomFocus) nextEl.focus();
    }
}

export function renderStatsTable(stats, sortConfig) {
    dom.statsBody.innerHTML = '';

    if (stats.length === 0) {
        dom.statsBody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:0.6;padding:16px;">No completed puzzles yet.</td></tr>`;
        return;
    }

    const sorted = [...stats].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (typeof valA === 'string') {
            return sortConfig.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortConfig.asc ? valA - valB : valB - valA;
    });

    sorted.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.difficulty}</td>
            <td>${entry.hints}</td>
            <td>${entry.time}</td>
        `;
        dom.statsBody.appendChild(tr);
    });
}

export function showStatsModal(stats, sortConfig) {
    renderStatsTable(stats, sortConfig);
    dom.statsModal.style.display = 'flex';
    dom.closeStatsBtn.focus();
}

export function hideStatsModal() {
    dom.statsModal.style.display = 'none';
}

export function isStatsModalOpen() {
    return dom.statsModal.style.display === 'flex';
}

export function showWinModal({ difficultyLabel, size, finalTime, hintsUsed }) {
    dom.winMessage.innerHTML = `You solved <strong>${difficultyLabel} (${size}×${size})</strong> in <strong>${finalTime}</strong> with <strong>${hintsUsed}</strong> hint${hintsUsed === 1 ? '' : 's'}!`;
    dom.winModal.style.display = 'flex';
    dom.closeWinBtn.focus();
}

export function hideWinModal() {
    dom.winModal.style.display = 'none';
}

export function isWinModalOpen() {
    return dom.winModal.style.display === 'flex';
}
