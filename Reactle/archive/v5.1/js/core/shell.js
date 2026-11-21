/**
 * Shared page shell: header, mode menu, settings menu, footer, help dialog, tooltip.
 * Put at js/core/shell.js. Import it FIRST in main.js and nuclearMain.js
 * (import './core/shell.js';) so the markup exists before the game code looks for it.
 *
 * Each page sets <body data-shell="reactle"> or <body data-shell="nuclear"> and holds
 * three placeholders: #shell-header, #shell-dialogs, #shell-footer.
 * All element ids match the old hand-written markup.
 */

const PAGES = {
    reactle: {
        icon: 'fa-flask',
        title: 'Reactle',
        subtitle: 'Chemical Equation Balancer',
        matrixLabel: 'Balance Check',
        footer: 'Reactle &copy; 2026 - Master Chemical Equation Balancing through Practice &amp; Interactive Visuals.',
        helpTitle: 'How to Play Reactle',
        helpBody: `
            <p><strong>Goal:</strong> Balance the chemical equation so that the number of atoms of each element is equal on both sides of the arrow.</p>
            <ul class="modal-list">
                <li>Type the lowest whole number coefficients into the input boxes.</li>
                <li>Leaving an input <strong>blank defaults to 1</strong>.</li>
                <li>Watch the <strong>Real-time Atom Matrix</strong> updates as you type to see if reactants match products!</li>
                <li>Need assistance? Click <span class="modal-hint-highlight"><i class="fa-solid fa-lightbulb"></i> Hint</span> to reveal steps or coefficients.</li>
            </ul>`
    },
    nuclear: {
        icon: 'fa-radiation',
        title: 'Nuclear Reactle',
        subtitle: 'Decay &amp; Transmutation',
        matrixLabel: 'Conservation Check',
        footer: 'Nuclear Reactle &copy; 2026 - Master Nuclear Equation Balancing through Practice &amp; Interactive Visuals.',
        helpTitle: 'How to Play Nuclear Reactle',
        helpBody: `
            <p><strong>Goal:</strong> Balance the nuclear equation so that the Mass Number (A) and Atomic Charge (Z) are equal on both sides of the arrow.</p>
            <ul class="modal-list">
                <li><strong>Select Subatomic Particles:</strong> Tap on empty slot buttons to pick missing particles (neutrons, protons, alpha, beta, gamma) needed to complete the reaction.</li>
                <li><strong>Balance Mass Number (A):</strong> Ensure the sum of superscripts (mass) on the left side matches the right side.</li>
                <li><strong>Balance Atomic Charge (Z):</strong> Ensure the sum of subscripts (protons/charge) on the left side matches the right side.</li>
            </ul>`
    }
};

function modeOption(id, current) {
    const isActive = id === current;
    const label = id === 'reactle' ? 'Reactle' : 'Nuclear Reactle';
    const sub = id === 'reactle' ? 'Chemical Equation Balancer' : 'Decay &amp; Transmutation';
    const icon = id === 'reactle' ? 'fa-flask' : 'fa-radiation';

    return `
        <button id="opt-${id}" class="mode-option ${isActive ? 'is-active' : ''}" data-mode="${id}" type="button">
            <div class="mode-option-badge is-${id}"><i class="fa-solid ${icon}" aria-hidden="true"></i></div>
            <div>
                <div class="mode-option-title">${label}</div>
                <div class="mode-option-sub">${sub}</div>
            </div>
        </button>`;
}

function settingsItem(btnId, iconId, icon, isMutedIcon, label, statusId, statusText, statusCls) {
    return `
        <button id="${btnId}" class="settings-item" type="button">
            <span class="settings-item-label"><i id="${iconId}" class="fa-solid ${icon} settings-item-icon ${isMutedIcon ? 'is-muted' : ''}" aria-hidden="true"></i> ${label}</span>
            <span id="${statusId}" class="settings-status ${statusCls}">${statusText}</span>
        </button>`;
}

function headerHTML(p, key) {
    return `
    <header class="shell-header glass-panel">
        <div class="shell-header-inner">
            <div class="brand-dropdown">
                <button id="mode-dropdown-btn" class="brand-trigger" type="button" aria-expanded="false">
                    <div id="active-mode-icon-box" class="brand-icon-box">
                        <i id="active-mode-icon" class="fa-solid ${p.icon}" aria-hidden="true"></i>
                    </div>
                    <div>
                        <div class="brand-title-row">
                            <h1 id="active-mode-title" class="brand-title">${p.title}</h1>
                            <i id="mode-dropdown-chevron" class="fa-solid fa-chevron-down brand-chevron" aria-hidden="true"></i>
                        </div>
                        <p id="active-mode-subtitle" class="brand-subtitle">${p.subtitle}</p>
                    </div>
                </button>
                <div id="mode-dropdown-menu" class="brand-menu hidden opacity-0 scale-95">
                    <div class="brand-menu-list">
                        ${modeOption('reactle', key)}
                        ${modeOption('nuclear', key)}
                    </div>
                </div>
            </div>

            <div class="header-actions">
                <div id="streak-badge" class="streak-badge">
                    <i class="fa-solid fa-fire" aria-hidden="true"></i>
                    <span id="streak-count">0</span>
                </div>
                <div class="settings-dropdown">
                    <button id="nav-menu-btn" class="settings-trigger" type="button" title="App Settings &amp; Info">
                        <i class="fa-solid fa-sliders settings-trigger-icon" aria-hidden="true"></i>
                        <i id="nav-menu-chevron" class="fa-solid fa-chevron-down settings-trigger-chevron" aria-hidden="true"></i>
                    </button>
                    <div id="nav-menu-dropdown" class="settings-menu glass-panel hidden">
                        ${settingsItem('toggle-theme-btn', 'theme-icon', 'fa-moon', false, 'Theme Mode', 'theme-status-label', 'DARK', 'is-neutral')}
                        ${settingsItem('toggle-sound-btn', 'sound-icon', 'fa-volume-high', false, 'Sound FX', 'sound-status-label', 'ON', 'is-accent')}
                        ${settingsItem('toggle-matrix-badge-btn', 'matrix-badge-icon', 'fa-scale-balanced', true, p.matrixLabel, 'matrix-badge-status-label', 'OFF', 'is-off')}
                        <div class="settings-divider"></div>
                        <button id="open-help-modal-btn" class="settings-item settings-item-help" type="button">
                            <i class="fa-solid fa-circle-question settings-item-icon" aria-hidden="true"></i> How to Play
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </header>`;
}

function dialogsHTML(p) {
    return `
    <div id="help-modal" class="modal-backdrop hidden">
        <div class="modal-dialog">
            <div class="modal-header">
                <h3 class="modal-title"><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i> ${p.helpTitle}</h3>
                <button id="close-help-modal-btn" class="modal-close-btn" type="button" aria-label="Close">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>
            <div class="modal-body">${p.helpBody}</div>
            <div class="modal-footer">
                <button id="modal-confirm-btn" class="modal-confirm-btn" type="button">Got it, Let's Play!</button>
            </div>
        </div>
    </div>

    <div id="element-tooltip" class="element-tooltip glass-panel hidden">
        <div class="tooltip-header">
            <span id="tooltip-symbol" class="tooltip-symbol"></span>
            <span id="tooltip-name" class="tooltip-name"></span>
            <span id="tooltip-number" class="tooltip-number"></span>
        </div>
        <div class="tooltip-meta">
            <span>Mass: <strong id="tooltip-mass" class="tooltip-mass-val"></strong></span>
            <span id="tooltip-category" class="tooltip-category"></span>
        </div>
        <p id="tooltip-summary" class="tooltip-summary"></p>
    </div>`;
}

function footerHTML(p) {
    return `
    <footer class="shell-footer">
        <p>${p.footer}</p>
    </footer>`;
}

function mount() {
    const key = document.body?.dataset.shell;
    const page = PAGES[key];
    if (!page) return;
    const swap = (id, html) => {
        const slot = document.getElementById(id);
        if (slot) slot.outerHTML = html;
    };
    swap('shell-header', headerHTML(page, key));
    swap('shell-dialogs', dialogsHTML(page));
    swap('shell-footer', footerHTML(page));
}

mount();   // runs on import, before the game code reads the DOM
