/**
 * Nuclear Reactle - Filter Controls & Synchronizer
 */

// Custom display labels for category and difficulty options
const CATEGORY_LABELS = {
    'ALL': 'All Categories',
    'Fission': 'Heavy Fission',
    'Fusion': 'Stellar Fusion',
    'Decay': 'Radioactive Decay',
    'Transmutation': 'Transmutation Alchemy',
    'Bombardment': 'Particle Collisions'
};

const DIFFICULTY_LABELS = {
    'ALL': 'All Difficulties',
    'Easy': 'Easy (Low Energy)',
    'Medium': 'Medium (Moderate Flux)',
    'Hard': 'Hard (High Energy)'
};

/**
 * Dynamically populates category and difficulty select dropdowns
 * @param {Array} database - Array of equation objects
 */
export function populateFilterDropdowns(database) {
    if (!database || !Array.isArray(database)) return;

    const catDesk = document.getElementById('category-filter-desktop');
    const catMob = document.getElementById('category-filter-mobile');
    const diffDesk = document.getElementById('difficulty-filter-desktop');
    const diffMob = document.getElementById('difficulty-filter-mobile');

    // --- POPULATE CATEGORIES ---
    if (catDesk || catMob) {
        const allCategories = database.flatMap(eq =>
            Array.isArray(eq.category) ? eq.category : [eq.category]
        );
        const uniqueCategories = [...new Set(allCategories)].sort((a, b) => a.localeCompare(b));

        let catOptionsHTML = `<option value="ALL">${CATEGORY_LABELS['ALL']}</option>`;
        uniqueCategories.forEach(cat => {
            const label = CATEGORY_LABELS[cat] || cat;
            catOptionsHTML += `<option value="${cat}">${label}</option>`;
        });

        if (catDesk) catDesk.innerHTML = catOptionsHTML;
        if (catMob) catMob.innerHTML = catOptionsHTML;
    }

    // --- POPULATE DIFFICULTIES ---
    if (diffDesk || diffMob) {
        const difficultyOrder = ['Easy', 'Medium', 'Hard'];
        const extractedDiffs = [...new Set(database.map(eq => eq.difficulty))];

        const sortedDifficulties = extractedDiffs.sort((a, b) => {
            const idxA = difficultyOrder.indexOf(a);
            const idxB = difficultyOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        let diffOptionsHTML = `<option value="ALL">${DIFFICULTY_LABELS['ALL']}</option>`;
        sortedDifficulties.forEach(diff => {
            const label = DIFFICULTY_LABELS[diff] || diff;
            diffOptionsHTML += `<option value="${diff}">${label}</option>`;
        });

        if (diffDesk) diffDesk.innerHTML = diffOptionsHTML;
        if (diffMob) diffMob.innerHTML = diffOptionsHTML;
    }
}

/**
 * Synchronizes desktop/mobile select controls and updates header summary
 * @param {string} value - Selected filter option value
 * @param {'cat'|'diff'} type - Filter type identifier
 * @param {Function} [onUpdateCallback] - Optional callback to trigger equation refresh
 */
export function onFilterChange(value, type, onUpdateCallback) {
    const catDesk = document.getElementById('category-filter-desktop');
    const catMob = document.getElementById('category-filter-mobile');
    const diffDesk = document.getElementById('difficulty-filter-desktop');
    const diffMob = document.getElementById('difficulty-filter-mobile');

    if (type === 'cat') {
        if (catDesk) catDesk.value = value;
        if (catMob) catMob.value = value;
    } else if (type === 'diff') {
        if (diffDesk) diffDesk.value = value;
        if (diffMob) diffMob.value = value;
    }

    const currentCat = catDesk?.value || 'ALL';
    const currentDiff = diffDesk?.value || 'ALL';

    const catLabel = CATEGORY_LABELS[currentCat] || currentCat;
    const diffLabel = currentDiff === 'ALL' ? '' : ` • ${currentDiff}`;

    const summaryEl = document.getElementById('filter-active-summary');
    if (summaryEl) {
        summaryEl.innerText = `(${catLabel}${diffLabel})`;
    }

    if (typeof onUpdateCallback === 'function') {
        onUpdateCallback();
    }
}
