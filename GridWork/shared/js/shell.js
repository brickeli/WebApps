// shared/js/shell.js
export function initShell({ storage, onStatsClose, onWinClose }) {
    const dom = {
        menuBtn: document.getElementById('menu-btn'),
        closeMenuBtn: document.getElementById('close-menu-btn'),
        menuOverlay: document.getElementById('menu-overlay'),
        sidePanel: document.getElementById('side-panel'),
        statsModal: document.getElementById('stats-modal'),
        statsBody: document.getElementById('stats-body'),
        statsHeaders: document.querySelectorAll('#stats-table th[data-sort]'),
        closeStatsBtn: document.getElementById('close-stats-btn'),
        winModal: document.getElementById('win-modal'),
        winMessage: document.getElementById('win-message'),
        closeWinBtn: document.getElementById('close-win-btn')
    };

    let sortConfig = { key: 'timestamp', asc: false };

    function setSidePanelOpen(isOpen) {
        dom.sidePanel?.classList.toggle('open', isOpen);
        dom.menuOverlay?.classList.toggle('open', isOpen);
        dom.menuBtn?.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            dom.closeMenuBtn?.focus();
        }
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

    dom.statsHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            sortConfig = { key, asc: sortConfig.key === key ? !sortConfig.asc : true };
            renderStatsTable();
        });
    });

    dom.closeStatsBtn?.addEventListener('click', hideStatsModal);
    dom.closeWinBtn?.addEventListener('click', hideWinModal);

    window.addEventListener('click', (e) => {
        if (e.target === dom.statsModal) hideStatsModal();
        if (e.target === dom.winModal) hideWinModal();
    });

    function handleGlobalEscape() {
        if (isStatsModalOpen()) { hideStatsModal(); return true; }
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
        showWinModal,
        hideWinModal,
        isWinModalOpen,
        handleGlobalEscape
    };
}
