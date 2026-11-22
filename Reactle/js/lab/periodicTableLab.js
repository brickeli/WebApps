import { PERIODIC_TABLE } from '../data/periodicTable.js';
import { playSound } from '../engine/audio.js';

const CATEGORIES = [
    { id: 'all', label: 'All Elements', slug: 'all' },
    { id: 'Alkali Metal', label: 'Alkali Metals', slug: 'alkali' },
    { id: 'Alkaline Earth', label: 'Alkaline Earth', slug: 'alkaline' },
    { id: 'Transition Metal', label: 'Transition Metals', slug: 'transition' },
    { id: 'Post-Transition Metal', label: 'Post-Transition', slug: 'post-transition' },
    { id: 'Metalloid', label: 'Metalloids', slug: 'metalloid' },
    { id: 'Nonmetal', label: 'Nonmetals', slug: 'nonmetal' },
    { id: 'Halogen', label: 'Halogens', slug: 'halogen' },
    { id: 'Noble Gas', label: 'Noble Gases', slug: 'noble' },
    { id: 'Lanthanide', label: 'Lanthanides', slug: 'lanthanide' },
    { id: 'Actinide', label: 'Actinides', slug: 'actinide' }
];

const FILTERABLE_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'all');

const SLUG_BY_CATEGORY = Object.fromEntries(
    FILTERABLE_CATEGORIES.map((c) => [c.id, c.slug])
);

/**
 * Computes standard 18-column periodic table grid coordinates (row 1-9, col 1-18)
 * from atomic number Z (1..118). Rows 8 and 9 represent Lanthanides and Actinides.
 */
function getGridPosition(z) {
    if (z === 1) return { row: 1, col: 1, period: 1, group: 1 };
    if (z === 2) return { row: 1, col: 18, period: 1, group: 18 };

    if (z >= 3 && z <= 4) return { row: 2, col: z - 2, period: 2, group: z - 2 };
    if (z >= 5 && z <= 10) return { row: 2, col: z + 8, period: 2, group: z + 8 };

    if (z >= 11 && z <= 12) return { row: 3, col: z - 10, period: 3, group: z - 10 };
    if (z >= 13 && z <= 18) return { row: 3, col: z, period: 3, group: z };

    if (z >= 19 && z <= 36) return { row: 4, col: z - 18, period: 4, group: z - 18 };
    if (z >= 37 && z <= 54) return { row: 5, col: z - 36, period: 5, group: z - 36 };

    if (z >= 55 && z <= 56) return { row: 6, col: z - 54, period: 6, group: z - 54 };
    if (z >= 57 && z <= 71) return { row: 8, col: z - 53, period: 6, group: 'f-block' }; // Lanthanides (cols 4-18)
    if (z >= 72 && z <= 86) return { row: 6, col: z - 68, period: 6, group: z - 68 };

    if (z >= 87 && z <= 88) return { row: 7, col: z - 86, period: 7, group: z - 86 };
    if (z >= 89 && z <= 103) return { row: 9, col: z - 85, period: 7, group: 'f-block' }; // Actinides (cols 4-18)
    if (z >= 104 && z <= 118) return { row: 7, col: z - 100, period: 7, group: z - 100 };

    return { row: 1, col: 1, period: 1, group: 1 };
}

// Build sorted array of all 118 elements enriched with coordinates & category slug
const ELEMENTS_LIST = Object.entries(PERIODIC_TABLE)
    .map(([symbol, data]) => {
        const pos = getGridPosition(data.atomicNumber);
        return {
            symbol,
            ...data,
            slug: SLUG_BY_CATEGORY[data.category] || 'nonmetal',
            ...pos
        };
    })
    .sort((a, b) => a.atomicNumber - b.atomicNumber);

export function mountTool(container) {
    let selectedSymbol = 'C';
    const selectedCategories = new Set(); // Empty Set = All Elements
    let searchQuery = '';
    let mobileLayout = 'grid'; // 'list' | 'grid'

    container.innerHTML = `
        <div class="lab-stack">
            <!-- Header & Controls -->
            <div class="lab-panel pt-header-panel glass-panel">
                <div class="lab-tool-header">
                    <div>
                        <span class="lab-eyebrow">
                            <i class="fa-solid fa-table-cells" aria-hidden="true"></i>
                            Reference Table
                        </span>
                        <h2 class="lab-heading">Interactive Periodic Table</h2>
                        <p class="lab-subtitle">
                            Click or tap any element to inspect atomic weight, period/group placement, and chemical notes.
                        </p>
                    </div>

                    <div class="pt-controls-row">
                        <div class="lab-search-wrap">
                            <label for="pt-search-input" class="sr-only">Search elements</label>
                            <i class="fa-solid fa-magnifying-glass lab-search-icon" aria-hidden="true"></i>
                            <input
                                type="search"
                                id="pt-search-input"
                                name="pt-search"
                                class="lab-search-input"
                                placeholder="Symbol, name, or # (e.g. Fe, Gold, 79)"
                                autocomplete="off"
                            />
                        </div>

                        <!-- Multi-Select Category Dropdown -->
                        <div class="pt-filter-dropdown" id="pt-filter-dropdown">
                            <button
                                type="button"
                                class="pt-filter-trigger"
                                id="pt-filter-trigger"
                                aria-haspopup="listbox"
                                aria-expanded="false"
                                aria-controls="pt-filter-menu"
                            >
                                <i class="fa-solid fa-filter pt-filter-icon" aria-hidden="true"></i>
                                <span class="pt-filter-label" id="pt-filter-label">All Elements</span>
                                <span class="pt-filter-badge" id="pt-filter-badge" hidden>0</span>
                                <i class="fa-solid fa-chevron-down pt-filter-chevron" aria-hidden="true"></i>
                            </button>

                            <div
                                class="pt-filter-menu glass-panel"
                                id="pt-filter-menu"
                                role="listbox"
                                aria-multiselectable="true"
                                aria-label="Filter by element category"
                                hidden
                            >
                                <div class="pt-filter-menu-header">
                                    <span>Categories</span>
                                    <button
                                        type="button"
                                        class="pt-filter-reset"
                                        id="pt-filter-reset"
                                        disabled
                                    >
                                        Reset (All)
                                    </button>
                                </div>

                                <div class="pt-filter-options" id="pt-filter-options">
                                    ${FILTERABLE_CATEGORIES.map(
                                        (cat) => `
                                        <button
                                            type="button"
                                            class="pt-filter-option"
                                            role="option"
                                            aria-selected="false"
                                            data-cat="${cat.id}"
                                        >
                                            <span class="pt-swatch pt-cat-${cat.slug}" aria-hidden="true"></span>
                                            <span class="pt-filter-option-text">${cat.label}</span>
                                            <i class="fa-solid fa-check pt-filter-check" aria-hidden="true"></i>
                                        </button>
                                    `
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Selected Element Detail Inspector -->
            <div id="pt-inspector" class="lab-panel pt-inspector glass-panel" aria-live="polite"></div>

            <!-- Desktop 18-Column Grid + Mobile Responsive Card List -->
            <div id="pt-board-wrap" class="lab-panel pt-board-wrap is-full-grid glass-panel">
                <div class="pt-mobile-bar">
                    <span id="pt-mobile-hint" class="pt-mobile-hint">
                        <i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i>
                        Pinch to zoom &amp; swipe to pan
                    </span>
                    <button
                        type="button"
                        id="pt-layout-toggle"
                        class="pt-layout-toggle"
                        aria-pressed="true"
                    >
                        <i class="fa-solid fa-list" aria-hidden="true"></i>
                        <span>Compact List</span>
                    </button>
                </div>

                <div class="pt-grid-scroll">
                    <div id="pt-grid" class="pt-grid" role="grid" aria-label="Periodic Table of Elements"></div>
                </div>
                <div id="pt-mobile-list" class="pt-mobile-list"></div>
            </div>
        </div>
    `;
    
    const searchInput = container.querySelector('#pt-search-input');
    const dropdownEl = container.querySelector('#pt-filter-dropdown');
    const filterTrigger = container.querySelector('#pt-filter-trigger');
    const filterMenu = container.querySelector('#pt-filter-menu');
    const filterLabel = container.querySelector('#pt-filter-label');
    const filterBadge = container.querySelector('#pt-filter-badge');
    const filterReset = container.querySelector('#pt-filter-reset');
    const filterOptions = container.querySelectorAll('.pt-filter-option');
    const inspectorEl = container.querySelector('#pt-inspector');
    const gridEl = container.querySelector('#pt-grid');
    const mobileListEl = container.querySelector('#pt-mobile-list');

    function matchesFilter(el) {
        const catMatch = selectedCategories.size === 0 || selectedCategories.has(el.category);
        if (!catMatch) return false;

        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;

        return (
            el.symbol.toLowerCase().includes(q) ||
            el.name.toLowerCase().includes(q) ||
            String(el.atomicNumber) === q ||
            el.category.toLowerCase().includes(q)
        );
    }

    function updateFilterUI() {
        const count = selectedCategories.size;

        filterOptions.forEach((btn) => {
            const isSelected = selectedCategories.has(btn.dataset.cat);
            btn.classList.toggle('is-selected', isSelected);
            btn.setAttribute('aria-selected', String(isSelected));
        });

        if (count === 0) {
            filterLabel.textContent = 'All Elements';
            filterBadge.hidden = true;
            filterReset.disabled = true;
        } else if (count === 1) {
            const onlyCatId = [...selectedCategories][0];
            const catObj = FILTERABLE_CATEGORIES.find((c) => c.id === onlyCatId);
            filterLabel.textContent = catObj ? catObj.label : '1 Selected';
            filterBadge.hidden = true;
            filterReset.disabled = false;
        } else {
            filterLabel.textContent = 'Categories';
            filterBadge.textContent = String(count);
            filterBadge.hidden = false;
            filterReset.disabled = false;
        }

        renderBoard();
    }

    function toggleDropdown(forceOpen) {
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : filterMenu.hidden;
        filterMenu.hidden = !shouldOpen;
        filterTrigger.setAttribute('aria-expanded', String(shouldOpen));
        dropdownEl.classList.toggle('is-open', shouldOpen);
    }

    function renderInspector() {
        const el = ELEMENTS_LIST.find((item) => item.symbol === selectedSymbol) || ELEMENTS_LIST[0];
        inspectorEl.className = `lab-panel pt-inspector glass-panel pt-cat-${el.slug}`;
        inspectorEl.innerHTML = `
            <div class="pt-insp-main">
                <div class="pt-insp-tile pt-cat-${el.slug}">
                    <span class="pt-insp-num">${el.atomicNumber}</span>
                    <span class="pt-insp-sym">${el.symbol}</span>
                    <span class="pt-insp-mass">${el.atomicMass}</span>
                </div>

                <div class="pt-insp-info">
                    <div class="pt-insp-title-row">
                        <h3 class="pt-insp-name">${el.name}</h3>
                        <span class="pt-insp-badge pt-cat-${el.slug}">${el.category}</span>
                    </div>
                    <p class="pt-insp-summary">${el.summary}</p>
                </div>
            </div>

            <div class="pt-insp-specs">
                <div class="lab-stat">
                    <span class="lab-stat-label">Atomic # (Z)</span>
                    <strong class="lab-stat-val">${el.atomicNumber}</strong>
                </div>
                <div class="lab-stat">
                    <span class="lab-stat-label">Atomic Mass</span>
                    <strong class="lab-stat-val">${el.atomicMass} u</strong>
                </div>
                <div class="lab-stat">
                    <span class="lab-stat-label">Period</span>
                    <strong class="lab-stat-val">${el.period}</strong>
                </div>
                <div class="lab-stat">
                    <span class="lab-stat-label">Group</span>
                    <strong class="lab-stat-val">${el.group === 'f-block' ? el.category : el.group}</strong>
                </div>
            </div>
        `;
    }

    function renderBoard() {
        const hasActiveFilter = selectedCategories.size > 0 || searchQuery.trim() !== '';

        // 1. Desktop 18-column grid (dims non-matching tiles so spatial layout stays intact)
        const tilesHTML = ELEMENTS_LIST.map((el) => {
            const matched = matchesFilter(el);
            const isSelected = el.symbol === selectedSymbol;
            const classes = [
                'pt-tile',
                `pt-cat-${el.slug}`,
                isSelected ? 'is-selected' : '',
                hasActiveFilter && !matched ? 'is-dimmed' : ''
            ]
                .filter(Boolean)
                .join(' ');

            return `
                <button
                    type="button"
                    class="${classes}"
                    data-symbol="${el.symbol}"
                    style="grid-row: ${el.row}; grid-column: ${el.col};"
                    aria-label="${el.name} (${el.symbol}), Atomic Number ${el.atomicNumber}, ${el.category}"
                    aria-pressed="${isSelected}"
                >
                    <span class="pt-tile-num">${el.atomicNumber}</span>
                    <span class="pt-tile-sym">${el.symbol}</span>
                    <span class="pt-tile-name">${el.name}</span>
                </button>
            `;
        }).join('');

        // Series marker placeholders in Period 6 & 7 col 3
        const markersHTML = `
            <div class="pt-series-marker pt-cat-lanthanide" style="grid-row: 6; grid-column: 3;" aria-hidden="true">
                <span>57–71</span>
                <small>La–Lu</small>
            </div>
            <div class="pt-series-marker pt-cat-actinide" style="grid-row: 7; grid-column: 3;" aria-hidden="true">
                <span>89–103</span>
                <small>Ac–Lr</small>
            </div>
        `;

        gridEl.innerHTML = tilesHTML + markersHTML;

        // 2. Mobile responsive list (filters directly so mobile users don't scroll past dimmed items)
        const filteredMobile = ELEMENTS_LIST.filter(matchesFilter);
        if (filteredMobile.length === 0) {
            mobileListEl.innerHTML = `<p class="lab-subtitle">No elements match your search or category filter.</p>`;
        } else {
            mobileListEl.innerHTML = filteredMobile
                .map((el) => {
                    const isSelected = el.symbol === selectedSymbol;
                    return `
                        <button
                            type="button"
                            class="pt-mob-item pt-cat-${el.slug} ${isSelected ? 'is-selected' : ''}"
                            data-symbol="${el.symbol}"
                            aria-pressed="${isSelected}"
                        >
                            <span class="pt-mob-num">${el.atomicNumber}</span>
                            <span class="pt-mob-sym">${el.symbol}</span>
                            <span class="pt-mob-meta">
                                <strong>${el.name}</strong>
                                <small>${el.category} &bull; ${el.atomicMass}</small>
                            </span>
                        </button>
                    `;
                })
                .join('');
        }
    }

    function selectElement(symbol) {
        if (!PERIODIC_TABLE[symbol]) return;
        playSound('click');
        selectedSymbol = symbol;
        renderInspector();
        renderBoard();
    }

    // Event Delegation for Desktop Grid & Mobile List
    [gridEl, mobileListEl].forEach((wrapper) => {
        wrapper.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-symbol]');
            if (btn) selectElement(btn.dataset.symbol);
        });
    });

    // Multi-Select Dropdown Events
    filterTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('click');
        toggleDropdown();
    });

    filterOptions.forEach((option) => {
        option.addEventListener('click', () => {
            playSound('click');
            const catId = option.dataset.cat;
            if (selectedCategories.has(catId)) {
                selectedCategories.delete(catId);
            } else {
                selectedCategories.add(catId);
            }
            updateFilterUI();
        });
    });

    filterReset.addEventListener('click', () => {
        playSound('click');
        selectedCategories.clear();
        updateFilterUI();
    });

    // Close dropdown on outside click or Escape key (scoped to active container)
    const handleOutsideClick = (e) => {
        if (!container.isConnected) {
            document.removeEventListener('click', handleOutsideClick);
            return;
        }
        if (!dropdownEl.contains(e.target) && !filterMenu.hidden) {
            toggleDropdown(false);
        }
    };

    const handleKeydown = (e) => {
        if (!container.isConnected) {
            document.removeEventListener('keydown', handleKeydown);
            return;
        }
        if (e.key === 'Escape' && !filterMenu.hidden) {
            toggleDropdown(false);
            filterTrigger.focus();
        }
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeydown);

    // Live Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderBoard();
    });

    const boardWrap = container.querySelector('#pt-board-wrap');
    const layoutToggleBtn = container.querySelector('#pt-layout-toggle');
    const mobileHint = container.querySelector('#pt-mobile-hint');

    layoutToggleBtn?.addEventListener('click', () => {
        playSound('click');
        mobileLayout = mobileLayout === 'list' ? 'grid' : 'list';
        const isFullGrid = mobileLayout === 'grid';

        boardWrap.classList.toggle('is-full-grid', isFullGrid);
        layoutToggleBtn.setAttribute('aria-pressed', String(isFullGrid));
        layoutToggleBtn.innerHTML = isFullGrid
            ? `<i class="fa-solid fa-list" aria-hidden="true"></i><span>Compact List</span>`
            : `<i class="fa-solid fa-table-cells" aria-hidden="true"></i><span>Full 18-Col Table</span>`;

        if (mobileHint) {
            mobileHint.innerHTML = isFullGrid
                ? `<i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i> Pinch to zoom &amp; swipe to pan`
                : `<i class="fa-solid fa-hand-pointer" aria-hidden="true"></i> Tap an element to inspect`;
        }
    });

    // Initial Render
    renderInspector();
    renderBoard();
}
