// shared/js/shell.js
const ICONS = {
    close: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    reset: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    newGame: '<polygon points="5 3 19 12 5 21 5 3"/>',
    stats: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    howTo: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    hub: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
};

function svg(paths, extraStyle = '') {
    return `<svg class="icon" ${extraStyle ? `style="${extraStyle}"` : ''} viewBox="0 0 24 24">${paths}</svg>`;
}

function renderCustomItem(item) {
    const badge = item.badgeId
        ? `<span id="${item.badgeId}" class="toggle-status">${item.badgeText || 'OFF'}</span>`
        : '';
    return `<button id="${item.id}" class="menu-item-btn">${svg(item.icon)}${item.label}${badge}</button>`;
}

function renderDifficultyBtns(difficulties = []) {
    return difficulties.map((diff, idx) => {
        const isActive = diff.active ?? idx === 0;
        const dataAttrs = Object.entries({ label: diff.label, ...(diff.dataset || {}) })
            .map(([k, v]) => `data-${k}="${v}"`)
            .join(' ');
        return `<button class="diff-btn${isActive ? ' active' : ''}" ${dataAttrs}>${diff.label}</button>`;
    }).join('');
}

function injectShellMarkup({
    title = '',
    difficulties = [],
    modeToggle = null,
    extraMenuItems = [],
    hubHref = '../',
    howToHtml = ''
} = {}) {
    const boardWrapper = document.querySelector('.board-wrapper');

    if (title && !document.querySelector('.status-bar')) {
        const modeBtnHtml = modeToggle
            ? `<button id="mode-toggle" class="mode-btn" aria-pressed="false">
                    <svg id="mode-icon" class="icon" viewBox="0 0 24 24">${modeToggle.icon}</svg>
                    <span id="mode-label">${modeToggle.label}</span>
                    <span id="mode-badge" class="user-notes toggle-status ${modeToggle.badgeState || 'on'}">${modeToggle.badgeText || 'ON'}</span>
               </button>`
            : '';

        const headerChrome = `
            <header class="status-bar">
                <div class="brand-stack">
                    <h1>${title}</h1>
                    <span class="app-subtitle">GRIDWORK</span>
                </div>
                <button id="timer-btn" class="timer-btn" aria-label="Pause or Resume Timer">
                    <span class="timer-dot"></span>
                    <span id="timer-text">00:00</span>
                </button>
            </header>
            ${difficulties.length ? `<nav class="difficulty-container" aria-label="Puzzle difficulty">${renderDifficultyBtns(difficulties)}</nav>` : ''}
            <div class="controls-row">
                ${modeBtnHtml}
                <button id="menu-btn" class="menu-trigger-btn" aria-haspopup="true" aria-expanded="false" aria-controls="side-panel">
                    ${svg(ICONS.gear)}
                    Menu
                </button>
            </div>
        `;

        if (boardWrapper) {
            boardWrapper.insertAdjacentHTML('beforebegin', headerChrome);
        }
    }

    if (!document.getElementById('side-panel')) {
        const customSection = extraMenuItems.length
            ? `${extraMenuItems.map(renderCustomItem).join('')}<hr>`
            : '';

        document.body.insertAdjacentHTML('beforeend', `
            <div id="menu-overlay" class="menu-overlay"></div>
            <aside id="side-panel" class="side-panel" aria-label="Game Menu">
                <div class="side-panel-header">
                    <h2>GAME OPTIONS</h2>
                    <button id="close-menu-btn" class="close-menu-btn" aria-label="Close menu">
                        ${svg(ICONS.close, 'margin:0;width:20px;height:20px;')}
                    </button>
                </div>
                ${customSection}
                <button id="reset-menu-btn" class="menu-item-btn">${svg(ICONS.reset)}Reset Puzzle</button>
                <button id="newgame-menu-btn" class="menu-item-btn">${svg(ICONS.newGame)}New Game</button>
                <button id="stats-menu-btn" class="menu-item-btn">${svg(ICONS.stats)}High Scores &amp; Stats</button>
                <button id="howto-menu-btn" class="menu-item-btn">${svg(ICONS.howTo)}How To Play</button>
                <hr>
                <button id="theme-menu-btn" class="menu-item-btn">
                    ${svg(ICONS.theme)}
                    Theme
                    <span id="theme-status" class="toggle-status light-pill">LIGHT</span>
                </button>
                <a href="${hubHref}" class="menu-item-btn" style="text-decoration: none;">
                    ${svg(ICONS.hub)}
                    All GridWork Games
                </a>
            </aside>
        `);
    }

    if (!document.getElementById('stats-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="stats-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="stats-title">
                <div class="modal-content">
                    <h2 id="stats-title">COMPLETED PUZZLE STATS</h2>
                    <div class="stats-table-container">
                        <table id="stats-table">
                            <thead>
                                <tr>
                                    <th data-sort="timestamp">Date ⇅</th>
                                    <th data-sort="difficulty">Diff ⇅</th>
                                    <th data-sort="hints">Hints ⇅</th>
                                    <th data-sort="timeVal">Time ⇅</th>
                                </tr>
                            </thead>
                            <tbody id="stats-body"></tbody>
                        </table>
                    </div>
                    <button id="close-stats-btn" class="action-btn hint">
                        ${svg(ICONS.close)}
                        Close
                    </button>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('win-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="win-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="win-title">
                <div class="modal-content" style="text-align: center;">
                    <h2 id="win-title">Puzzle Solved!</h2>
                    <p id="win-message"></p>
                    <button id="close-win-btn" class="action-btn hint">Awesome!</button>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('howto-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="howto-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="howto-title">
                <div class="modal-content howto-modal-content">
                    <h2 id="howto-title">HOW TO PLAY</h2>
                    <hr>
                    <div id="howto-body" class="howto-body">${howToHtml}</div>
                    <button id="close-howto-btn" class="action-btn hint">
                        ${svg(ICONS.close)}
                        Got It
                    </button>
                </div>
            </div>
        `);
    }
    if (boardWrapper && !document.getElementById('pause-overlay')) {
        boardWrapper.insertAdjacentHTML('beforeend', `
            <div id="pause-overlay" class="pause-overlay">
                <svg style="width:32px;height:32px;margin-bottom:8px;fill:currentColor;" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Game Paused</span>
                <small>Tap to Resume</small>
            </div>
        `);
    }
    if (!document.querySelector('.action-container')) {
        const anchor = document.querySelector('.keypad') || boardWrapper;
        if (anchor) {
            anchor.insertAdjacentHTML('afterend', `
                <div class="action-container">
                    <button id="hint-btn" class="action-btn hint">
                        <svg class="icon" viewBox="0 0 24 24"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                        Hint
                    </button>
                    <button id="undo-btn" class="action-btn undo-input">
                        <svg class="icon" viewBox="0 0 24 24"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                        Undo
                    </button>
                </div>
            `);
        }
    }
}

export function initShell({
    storage,
    title = '',
    difficulties = [],
    modeToggle = null,
    extraMenuItems = [],
    hubHref = '../',
    howToHtml = '',
    onReset,
    onNewGame,
    onStatsClose,
    onHowToClose,
    onWinClose
}) {
    injectShellMarkup({ title, difficulties, modeToggle, extraMenuItems, hubHref, howToHtml });

    const dom = {
        menuBtn: document.getElementById('menu-btn'),
        closeMenuBtn: document.getElementById('close-menu-btn'),
        menuOverlay: document.getElementById('menu-overlay'),
        sidePanel: document.getElementById('side-panel'),
        resetMenuBtn: document.getElementById('reset-menu-btn'),
        newgameMenuBtn: document.getElementById('newgame-menu-btn'),
        statsMenuBtn: document.getElementById('stats-menu-btn'),
        howtoMenuBtn: document.getElementById('howto-menu-btn'),
        statsModal: document.getElementById('stats-modal'),
        statsBody: document.getElementById('stats-body'),
        statsHeaders: document.querySelectorAll('#stats-table th[data-sort]'),
        closeStatsBtn: document.getElementById('close-stats-btn'),
        howtoModal: document.getElementById('howto-modal'),
        howtoBody: document.getElementById('howto-body'),
        closeHowtoBtn: document.getElementById('close-howto-btn'),
        winModal: document.getElementById('win-modal'),
        winMessage: document.getElementById('win-message'),
        closeWinBtn: document.getElementById('close-win-btn')
    };

    if (dom.howtoBody && howToHtml) {
        dom.howtoBody.innerHTML = howToHtml;
    }

    let sortConfig = { key: 'timestamp', asc: false };

    function setSidePanelOpen(isOpen) {
        dom.sidePanel?.classList.toggle('open', isOpen);
        dom.menuOverlay?.classList.toggle('open', isOpen);
        dom.menuBtn?.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) dom.closeMenuBtn?.focus();
    }

    function isSidePanelOpen() {
        return Boolean(dom.sidePanel?.classList.contains('open'));
    }

    function renderStatsTable() {
        if (!dom.statsBody) return;
        const stats = storage.getStats();
        dom.statsBody.innerHTML = '';

        if (stats.length === 0) {
            dom.statsBody.innerHTML =
                '<tr><td colspan="4" style="text-align:center;opacity:0.6;padding:16px;">No completed puzzles yet.</td></tr>';
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

    function showStatsModal() {
        renderStatsTable();
        if (dom.statsModal) dom.statsModal.style.display = 'flex';
        dom.closeStatsBtn?.focus();
    }

    function hideStatsModal() {
        if (dom.statsModal) dom.statsModal.style.display = 'none';
        onStatsClose?.();
    }

    function isStatsModalOpen() {
        return dom.statsModal?.style.display === 'flex';
    }

    function showHowToModal() {
        if (dom.howtoModal) dom.howtoModal.style.display = 'flex';
        dom.closeHowtoBtn?.focus();
    }

    function hideHowToModal() {
        if (dom.howtoModal) dom.howtoModal.style.display = 'none';
        onHowToClose?.();
    }

    function isHowToModalOpen() {
        return dom.howtoModal?.style.display === 'flex';
    }

    function showWinModal(htmlMessage) {
        if (dom.winMessage) dom.winMessage.innerHTML = htmlMessage;
        if (dom.winModal) dom.winModal.style.display = 'flex';
        dom.closeWinBtn?.focus();
    }

    function hideWinModal() {
        if (dom.winModal) dom.winModal.style.display = 'none';
        onWinClose?.();
    }

    function isWinModalOpen() {
        return dom.winModal?.style.display === 'flex';
    }

    // Wire shared drawer & modal controls
    dom.menuBtn?.addEventListener('click', () => setSidePanelOpen(!isSidePanelOpen()));
    dom.menuOverlay?.addEventListener('click', () => setSidePanelOpen(false));
    dom.closeMenuBtn?.addEventListener('click', () => {
        setSidePanelOpen(false);
        dom.menuBtn?.focus();
    });

    if (onReset) {
        dom.resetMenuBtn?.addEventListener('click', () => { setSidePanelOpen(false); onReset(); });
    }
    if (onNewGame) {
        dom.newgameMenuBtn?.addEventListener('click', () => { setSidePanelOpen(false); onNewGame(); });
    }
    dom.statsMenuBtn?.addEventListener('click', () => { setSidePanelOpen(false); showStatsModal(); });
    dom.howtoMenuBtn?.addEventListener('click', () => { setSidePanelOpen(false); showHowToModal(); });

    dom.statsHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            sortConfig = { key, asc: sortConfig.key === key ? !sortConfig.asc : true };
            renderStatsTable();
        });
    });

    dom.closeStatsBtn?.addEventListener('click', hideStatsModal);
    dom.closeHowtoBtn?.addEventListener('click', hideHowToModal);
    dom.closeWinBtn?.addEventListener('click', hideWinModal);

    window.addEventListener('click', (e) => {
        if (e.target === dom.statsModal) hideStatsModal();
        if (e.target === dom.howtoModal) hideHowToModal();
        if (e.target === dom.winModal) hideWinModal();
    });

    function handleGlobalEscape() {
        if (isStatsModalOpen()) { hideStatsModal(); return true; }
        if (isHowToModalOpen()) { hideHowToModal(); return true; }
        if (isWinModalOpen()) { hideWinModal(); return true; }
        if (isSidePanelOpen()) { setSidePanelOpen(false); dom.menuBtn?.focus(); return true; }
        return false;
    }

    return {
        setSidePanelOpen,
        isSidePanelOpen,
        showStatsModal,
        hideStatsModal,
        isStatsModalOpen,
        showHowToModal,
        hideHowToModal,
        isHowToModalOpen,
        showWinModal,
        hideWinModal,
        isWinModalOpen,
        handleGlobalEscape
    };
}
