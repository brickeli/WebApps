import './core/shell.js';
import { PERIODIC_TABLE } from './data/periodicTable.js';
import { initSettings } from './core/settings.js';
import { initModeDropdown, toggleNavMenu, isNavOpen, toggleModal } from './ui/components.js';
import { LAB_TOOLS } from './lab/labTools.js';

const dirView = document.getElementById('lab-directory-view');
const workspaceView = document.getElementById('lab-workspace-view');
const toolsGrid = document.getElementById('lab-tools-grid');
const toolMount = document.getElementById('lab-tool-mount');
const searchInput = document.getElementById('lab-search-input');
const filterPills = document.querySelectorAll('.lab-pill');
const backBtn = document.getElementById('lab-back-btn');
const toolSwitcher = document.getElementById('lab-tool-switcher');

let activeCategory = 'all';
let searchQuery = '';

function init() {
    initSettings();
    initModeDropdown();

// Settings menu & Help modal triggers (matching main.js / nuclearMain.js)
    document.getElementById('nav-menu-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNavMenu();
    });

    document.addEventListener('click', (e) => {
        if (isNavOpen() && !e.target.closest('.settings-dropdown')) {
            toggleNavMenu(false);
        }
    });

    document.getElementById('open-help-modal-btn')?.addEventListener('click', () => {
        toggleNavMenu(false);
        toggleModal('help-modal');
    });

    ['close-help-modal-btn', 'modal-confirm-btn'].forEach((id) => {
        document.getElementById(id)?.addEventListener('click', () => {
            toggleModal('help-modal');
        });
    });

// Populate workspace quick-jump select & bind directory events
    toolSwitcher.innerHTML = LAB_TOOLS.map(
        (t) => `<option value="${t.id}">${t.title}</option>`
    ).join('');

    bindEvents();
    syncRouteFromURL();
}

function renderDirectory() {
    const query = searchQuery.trim().toLowerCase();

    const filtered = LAB_TOOLS.filter((tool) => {
        const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
        const matchesQuery =
            !query ||
            tool.title.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query) ||
            tool.badge.toLowerCase().includes(query);
        return matchesCategory && matchesQuery;
    });

    if (filtered.length === 0) {
        toolsGrid.innerHTML = `
            <p class="lab-subtitle">No tools match "${searchQuery}". Try clearing your search or switching categories.</p>
        `;
        return;
    }

    toolsGrid.innerHTML = filtered
        .map(
            (tool) => `
            <button type="button" class="lab-card glass-panel" data-tool-id="${tool.id}">
                <div>
                    <div class="lab-card-top">
                        <span class="lab-card-icon"><i class="${tool.icon}" aria-hidden="true"></i></span>
                        <span class="lab-card-badge">${tool.badge}</span>
                    </div>
                    <h2 class="lab-card-title">${tool.title}</h2>
                    <p class="lab-card-desc">${tool.description}</p>
                </div>
                <span class="lab-card-cta">
                    Open Tool <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </span>
            </button>
        `
        )
        .join('');
}

async function openTool(toolId, pushHistory = true) {
    const tool = LAB_TOOLS.find((t) => t.id === toolId);
    if (!tool) {
        showDirectory(pushHistory);
        return;
    }

    if (pushHistory) {
        const url = new URL(window.location);
        url.searchParams.set('tool', tool.id);
        window.history.pushState({ tool: tool.id }, '', url);
    }

    dirView.classList.add('hidden');
    workspaceView.classList.remove('hidden');
    toolSwitcher.value = tool.id;
    document.title = `${tool.title} — Reactle Lab Bench`;

    toolMount.innerHTML = `<p class="lab-subtitle">Loading ${tool.title}...</p>`;

    try {
        const mod = await tool.loader();
        toolMount.innerHTML = '';
        if (typeof mod.mountTool === 'function') {
            mod.mountTool(toolMount);
        }
    } catch (err) {
        toolMount.innerHTML = `
            <div class="lab-card">
                <h2 class="lab-card-title">${tool.title}</h2>
                <p class="lab-card-desc">This module hasn't been created yet (<code>js/lab/${tool.id}.js</code>).</p>
            </div>
        `;
    }
}

function showDirectory(pushHistory = true) {
    if (pushHistory) {
        const url = new URL(window.location);
        url.searchParams.delete('tool');
        window.history.pushState({}, '', url);
    }


    workspaceView.classList.add('hidden');
    dirView.classList.remove('hidden');
    toolMount.innerHTML = '';
    renderDirectory();
}

function syncRouteFromURL() {
    const params = new URLSearchParams(window.location.search);
    const toolId = params.get('tool');
    if (toolId) {
        openTool(toolId, false);
    } else {
        showDirectory(false);
    }
}

function bindEvents() {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderDirectory();
    });

    filterPills.forEach((pill) => {
        pill.addEventListener('click', () => {
            filterPills.forEach((p) => {
                p.classList.remove('is-active');
                p.setAttribute('aria-selected', 'false');
            });
            pill.classList.add('is-active');
            pill.setAttribute('aria-selected', 'true');
            activeCategory = pill.dataset.category;
            renderDirectory();
        });
    });

    toolsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('[data-tool-id]');
        if (card) openTool(card.dataset.toolId, true);
    });

    backBtn.addEventListener('click', () => showDirectory(true));

    toolSwitcher.addEventListener('change', (e) => {
        openTool(e.target.value, true);
    });

    window.addEventListener('popstate', syncRouteFromURL);
}

init();
