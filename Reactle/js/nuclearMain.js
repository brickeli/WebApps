/**
 * Nuclear Reactle - Main Application Controller
 * Handles nuclear decay & transmutation balancing, UI interactions, and state updates.
 */

import { Storage } from './utils/storage.js';
import { parseNuclearEquation, checkNuclearBalance } from './engine/nuclearParser.js';
import { renderNuclearMatrix } from './ui/nuclearUI.js';
import { NUCLEAR_EQUATIONS } from './data/nuclearEquations.js';
import { PERIODIC_TABLE } from './data/periodicTable.js';
import { initModeDropdown, toggleNavMenu, toggleMatrixAccordion, toggleFilterAccordion, toggleModal, showElementTooltip, hideElementTooltip } from './ui/components.js';
import { populateFilterDropdowns, onFilterChange } from './ui/filters.js';
import { initTheme, toggleTheme, initUtilitiesDropdown } from './ui/theme.js';
import { playSound, setAudioEnabled } from './engine/audio.js';
import { hashDateString, getTodayDateString, startDailyCountdownTimer, getDailyChallengeNumber, getRandomDifferentItem } from './utils/helpers.js';

// Global array to track active input elements across the equation
let inputsArray = [];
let activeTargetTerm = null;

// --- Application State ---
const state = {
    currentMode: 'daily',
    practiceEquation: null,
    dailyEquation: null,
    currentEquation: null,
    userCoefficients: [],
    scoreCorrect: 0,
    scoreAttempts: 0,
    hintStep: 0,
    showMatrixBadge: false,
    isMatrixAccordionOpen: true
};

// --- DOM Elements ---
const DOM = {
    dropdownBtn: document.getElementById('mode-dropdown-btn'),
    dropdownMenu: document.getElementById('mode-dropdown-menu'),
    dropdownChevron: document.getElementById('mode-dropdown-chevron'),
    equationContainer: document.getElementById('nuclear-equation-container'),
    matrixContainer: document.getElementById('nuclear-matrix-container'),
    matrixToggleBtn: document.getElementById('nuclear-matrix-toggle'),
    matrixWrapper: document.getElementById('nuclear-matrix-wrapper'),
    matrixChevron: document.getElementById('nuclear-matrix-chevron'),
    checkBtn: document.getElementById('check-btn'),
    nextBtn: document.getElementById('next-btn'),
    shareBtn: document.getElementById('share-btn'),
    goToPracticeBtn: document.getElementById('go-to-practice-btn'),
    hintBtn: document.getElementById('hint-btn'),
    feedbackBanner: document.getElementById('feedback-banner'),
    badgeCategory: document.getElementById('badge-category'),
    badgeDifficulty: document.getElementById('badge-difficulty'),
    dailyHeaderTag: document.getElementById('daily-header-tag'),
    gameView: document.getElementById('game-view'),
    solverView: document.getElementById('solver-view'),
    filterPanel: document.getElementById('filter-controls-panel'),
    filterAccordionToggle: document.getElementById('filter-accordion-toggle'),
};

// Expose functions globally for inline HTML event calls
window.showElementTooltip = showElementTooltip;
window.hideElementTooltip = hideElementTooltip;
window.switchMode = switchMode;
window.toggleNavMenu = toggleNavMenu;
window.toggleModal = toggleModal;

/* --- Bootstrap Application --- */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initModeDropdown();
    initUtilitiesDropdown();
    initCustomSolverSection();
    loadSharedSettings();
    loadScoreStats();
    populateFilterDropdowns(NUCLEAR_EQUATIONS);
    setupEventListeners();

    toggleMatrixAccordion('nuclear-matrix-wrapper', 'nuclear-matrix-chevron', true);
    switchMode('daily');
});

// --- Shared Settings Loader ---
function loadSharedSettings() {
    const savedTheme = Storage.getTheme();
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);

    const themeLabel = document.getElementById('theme-status-label');
    const themeIcon = document.getElementById('theme-icon');
    if (themeLabel) themeLabel.textContent = isDark ? 'DARK' : 'LIGHT';
    if (themeIcon) {
        themeIcon.className = isDark ? 'fa-solid fa-moon w-4 text-amber-500' : 'fa-solid fa-sun w-4 text-amber-500';
    }

    const soundEnabled = Storage.getSound();
    setAudioEnabled(soundEnabled);
    const soundLabel = document.getElementById('sound-status-label');
    const soundIcon = document.getElementById('sound-icon');
    if (soundLabel) {
        soundLabel.textContent = soundEnabled ? 'ON' : 'OFF';
        soundLabel.className = soundEnabled ? 'text-xs font-mono font-bold text-amber-600 dark:text-amber-400' : 'text-xs font-mono font-bold text-rose-600';
    }
    if (soundIcon) {
        soundIcon.className = soundEnabled ? 'fa-solid fa-volume-high w-4 text-amber-500' : 'fa-solid fa-volume-xmark w-4 text-slate-500';
    }

    state.showMatrixBadge = Storage.getMatrixBadge();
    const matrixLabel = document.getElementById('matrix-badge-status-label');
    const matrixIcon = document.getElementById('matrix-badge-icon');
    const statusBadge = document.getElementById('balance-status');

    if (matrixLabel) {
        matrixLabel.textContent = state.showMatrixBadge ? 'ON' : 'OFF';
        matrixLabel.className = state.showMatrixBadge ? 'text-xs font-mono font-bold text-amber-600 dark:text-amber-400' : 'text-xs font-mono font-bold text-rose-600';
    }
    if (matrixIcon) {
        matrixIcon.className = state.showMatrixBadge ? 'fa-solid fa-scale-balanced w-4 text-amber-500' : 'fa-solid fa-scale-balanced w-4 text-slate-500';
    }
    if (statusBadge) {
        statusBadge.classList.toggle('hidden', !state.showMatrixBadge);
    }

    const streakCountEl = document.getElementById('streak-count');
    if (streakCountEl) {
        streakCountEl.textContent = Storage.getDailyStreak();
    }
}

function setupEventListeners() {
    // --- 1. Navigation & Mode Selection ---
    document.getElementById('nav-practice')?.addEventListener('click', () => switchMode('practice'));
    document.getElementById('nav-daily')?.addEventListener('click', () => switchMode('daily'));
    document.getElementById('nav-solver')?.addEventListener('click', () => switchMode('solver'));
    document.getElementById('mode-dropdown')?.addEventListener('change', (e) => switchMode(e.target.value));
    document.getElementById('nav-menu-btn')?.addEventListener('click', () => toggleNavMenu());
    // --- Help Modal Event Binding ---
    document.getElementById('open-help-modal-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleModal('help-modal');
        toggleNavMenu(false); // Closes the nav menu drawer smoothly when opening the modal
    });
    document.getElementById('close-help-modal-btn')?.addEventListener('click', () => { toggleModal('help-modal'); });
    document.getElementById('modal-confirm-btn')?.addEventListener('click', () => { toggleModal('help-modal'); });

    // --- 2. Accordions & UI Controls ---
    DOM.matrixToggleBtn?.addEventListener('click', () => toggleMatrixAccordion('nuclear-matrix-wrapper', 'nuclear-matrix-chevron'));
    DOM.filterAccordionToggle?.addEventListener('click', () => toggleFilterAccordion());
    document.getElementById('reset-score-btn')?.addEventListener('click', resetScoreboard);

    // --- 3. Equation Filters (Category & Difficulty) ---
    const handleFilterUpdate = () => {
        if (state.currentMode === 'practice') {
            loadNextEquation();
        }
    };

    document.getElementById('category-filter-desktop')?.addEventListener('change', (e) => {
        onFilterChange(e.target.value, 'cat', handleFilterUpdate);
    });
    document.getElementById('category-filter-mobile')?.addEventListener('change', (e) => {
        onFilterChange(e.target.value, 'cat', handleFilterUpdate);
    });
    document.getElementById('difficulty-filter-desktop')?.addEventListener('change', (e) => {
        onFilterChange(e.target.value, 'diff', handleFilterUpdate);
    });
    document.getElementById('difficulty-filter-mobile')?.addEventListener('change', (e) => {
        onFilterChange(e.target.value, 'diff', handleFilterUpdate);
    });

    // --- 4. Game Action Buttons ---
    DOM.checkBtn?.addEventListener('click', checkNuclearBalanceHandler);
    DOM.nextBtn?.addEventListener('click', loadNextEquation);
    DOM.shareBtn?.addEventListener('click', shareDailyResult);
    DOM.goToPracticeBtn?.addEventListener('click', () => switchMode('practice'));
    DOM.hintBtn?.addEventListener('click', provideNuclearHint);

    // --- 5. Outside Clicks & Modals ---
    document.addEventListener('click', (e) => {
        const navMenuBtn = document.getElementById('nav-menu-btn');
        const navDropdown = document.getElementById('nav-menu-dropdown');
        if (navMenuBtn && navDropdown && !navMenuBtn.contains(e.target) && !navDropdown.contains(e.target)) {
            toggleNavMenu(false);
        }
    });

    document.getElementById('close-particle-modal-btn')?.addEventListener('click', () => {
        document.getElementById('particle-picker-modal')?.classList.add('hidden');
    });

    // --- 6. Particle Picker Modal Options ---
    document.querySelectorAll('.particle-option-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            playSound('click');

            if (activeTargetTerm) {
                const selected = {
                    symbol: btn.dataset.symbol,
                    mass: parseInt(btn.dataset.mass, 10),
                    charge: parseInt(btn.dataset.charge, 10)
                };

                // Persist directly onto the active target term
                activeTargetTerm.selectedParticle = selected;

                // Sync directly onto state.currentEquation arrays
                if (state.currentEquation) {
                    const syncParticle = (list) => {
                        if (!list) return;
                        list.forEach(item => {
                            if (item === activeTargetTerm || item.id === activeTargetTerm.id || item.symbol === activeTargetTerm.symbol) {
                                item.selectedParticle = selected;
                            }
                        });
                    };
                    syncParticle(state.currentEquation.reactants);
                    syncParticle(state.currentEquation.products);
                }

                // Re-parse and transfer selected particle
                const parsed = parseNuclearEquation(state.currentEquation);

                const rebindParticles = (sourceList, targetList) => {
                    if (!sourceList || !targetList) return;
                    sourceList.forEach((src, i) => {
                        if (src.selectedParticle && targetList[i]) {
                            targetList[i].selectedParticle = src.selectedParticle;
                        }
                    });
                };

                if (state.currentEquation.reactants) rebindParticles(state.currentEquation.reactants, parsed.reactants);
                if (state.currentEquation.products) rebindParticles(state.currentEquation.products, parsed.products);

                // Render updated board & matrix
                renderNuclearBoard(parsed);
                calculateNuclearMatrix();
            }

            const particleModal = document.getElementById('particle-picker-modal');
            if (particleModal) particleModal.classList.add('hidden');
        };
    });
}

function updateDropdownIcon(mode) {
    const iconEl = document.getElementById('mode-dropdown-icon');
    if (!iconEl) return;

    const iconMap = {
        practice: 'fa-solid fa-radiation',
        daily: 'fa-solid fa-calendar-day',
        solver: 'fa-solid fa-calculator'
    };

    iconEl.className = `${iconMap[mode] || 'fa-solid fa-atom'} text-sm`;
}

function switchMode(mode) {
    playSound('click');
    state.currentMode = mode;

    const feedbackBanner = document.getElementById('feedback-banner');
    if (feedbackBanner) feedbackBanner.classList.add('hidden');

    const dropdown = document.getElementById('mode-dropdown');
    if (dropdown) dropdown.value = mode;
    updateDropdownIcon(mode);

    const tabs = {
        practice: document.getElementById('nav-practice'),
        daily: document.getElementById('nav-daily'),
        solver: document.getElementById('nav-solver')
    };

    const activeClasses = ['bg-white', 'dark:bg-slate-700', 'text-amber-600', 'dark:text-amber-300', 'shadow-sm'];
    const inactiveClasses = ['text-slate-700', 'dark:text-slate-400', 'hover:text-slate-900', 'dark:hover:text-slate-200'];

    Object.keys(tabs).forEach(tabKey => {
        const btn = tabs[tabKey];
        if (!btn) return;
        if (tabKey === mode) {
            btn.classList.remove(...inactiveClasses);
            btn.classList.add(...activeClasses);
        } else {
            btn.classList.remove(...activeClasses);
            btn.classList.add(...inactiveClasses);
        }
    });

    if (mode === 'solver') {
        if (DOM.gameView) DOM.gameView.classList.add('hidden');
        if (DOM.solverView) DOM.solverView.classList.remove('hidden');
    } else {
        if (DOM.gameView) DOM.gameView.classList.remove('hidden');
        if (DOM.solverView) DOM.solverView.classList.add('hidden');

        if (mode === 'daily') {
            if (DOM.dailyHeaderTag) DOM.dailyHeaderTag.classList.remove('hidden');
            if (DOM.filterPanel) DOM.filterPanel.classList.add('hidden');
            loadDailyEquation();
        } else if (mode === 'practice') {
            if (DOM.dailyHeaderTag) DOM.dailyHeaderTag.classList.add('hidden');
            if (DOM.filterPanel) DOM.filterPanel.classList.remove('hidden');

            if (!state.practiceEquation) {
                loadNextEquation();
            } else {
                state.currentEquation = state.practiceEquation;
                loadNuclearEquation(state.practiceEquation);
            }
        }
    }
}

function updateScoreboardDisplay() {
    const correctEl = document.getElementById('score-correct');
    const attemptsEl = document.getElementById('score-attempts');
    const accuracyEl = document.getElementById('score-accuracy');

    if (correctEl) correctEl.textContent = state.scoreCorrect;
    if (attemptsEl) attemptsEl.textContent = state.scoreAttempts;

    if (accuracyEl) {
        const accuracy = state.scoreAttempts > 0
            ? Math.round((state.scoreCorrect / state.scoreAttempts) * 100)
            : 0;
        accuracyEl.textContent = `${accuracy}%`;
    }
}

function resetScoreboard() {
    playSound('click');
    state.scoreCorrect = 0;
    state.scoreAttempts = 0;
    Storage.saveStats(state.scoreCorrect, state.scoreAttempts, Storage.getDailyStreak());
    updateScoreboardDisplay();
}

function loadScoreStats() {
    const stats = Storage.getStats();
    state.scoreCorrect = stats.correct || 0;
    state.scoreAttempts = stats.attempts || 0;
    updateScoreboardDisplay();
}

function loadNextEquation() {
    const cat = document.getElementById('category-filter-desktop')?.value || 'ALL';
    const diff = document.getElementById('difficulty-filter-desktop')?.value || 'ALL';

    let filtered = NUCLEAR_EQUATIONS.filter(eq => {
        const catMatch = (cat === 'ALL') || (
            Array.isArray(eq.category)
                ? eq.category.includes(cat)
                : eq.category === cat
        );
        const diffMatch = (diff === 'ALL' || eq.difficulty === diff);
        return catMatch && diffMatch;
    });

    if (filtered.length === 0) filtered = NUCLEAR_EQUATIONS;

    state.practiceEquation = getRandomDifferentItem(filtered, state.practiceEquation);
    state.currentEquation = state.practiceEquation;

    loadNuclearEquation(state.practiceEquation);
}

function loadDailyEquation() {
    const todayStr = getTodayDateString();
    const hash = hashDateString(todayStr);
    const index = hash % NUCLEAR_EQUATIONS.length;

    state.dailyEquation = NUCLEAR_EQUATIONS[index];
    state.currentEquation = state.dailyEquation;

    const feedbackBanner = document.getElementById('feedback-banner');
    if (feedbackBanner) feedbackBanner.classList.add('hidden');

    loadNuclearEquation(state.dailyEquation);

    const history = Storage.getDailyHistory();
    const todayRecord = history[todayStr];

    if (todayRecord && todayRecord.completed) {
        if (DOM.checkBtn) DOM.checkBtn.classList.add('hidden');
        if (DOM.hintBtn) DOM.hintBtn.classList.add('hidden');
        if (DOM.shareBtn) DOM.shareBtn.classList.remove('hidden');
        if (DOM.goToPracticeBtn) DOM.goToPracticeBtn.classList.remove('hidden');

        showInsightCard();
        if (DOM.dailyHeaderTag) startDailyCountdownTimer(DOM.dailyHeaderTag);
    } else {
        if (DOM.dailyHeaderTag) {
            DOM.dailyHeaderTag.innerHTML = `<i class="fa-solid fa-calendar text-amber-500 mr-1"></i> Today's Daily Reaction`;
        }
        if (DOM.checkBtn) DOM.checkBtn.classList.remove('hidden');
        if (DOM.hintBtn) DOM.hintBtn.classList.remove('hidden');
        if (DOM.shareBtn) DOM.shareBtn.classList.add('hidden');
        if (DOM.goToPracticeBtn) DOM.goToPracticeBtn.classList.add('hidden');
    }
}

function calculateNuclearMatrix() {
    const container = DOM.matrixContainer || document.getElementById('nuclear-matrix-container');
    if (!container || !state.currentEquation) return;

    const parsed = parseNuclearEquation(state.currentEquation);

    renderNuclearMatrix(
        'nuclear-matrix-container',
        parsed,
        state.userCoefficients,
        Storage.getMatrixBadge()
    );
}

function loadNuclearEquation(equationData) {
    if (equationData.reactants) equationData.reactants.forEach(r => { if (r.isSelectable) r.selectedParticle = null; });
    if (equationData.products) equationData.products.forEach(p => { if (p.isSelectable) p.selectedParticle = null; });

    state.currentEquation = equationData;
    state.hintStep = 0;

    if (DOM.badgeCategory && equationData.category) {
        DOM.badgeCategory.textContent = equationData.category;
    }
    if (DOM.badgeDifficulty && equationData.difficulty) {
        DOM.badgeDifficulty.textContent = equationData.difficulty;
    }

    if (DOM.feedbackBanner) DOM.feedbackBanner.classList.add('hidden');
    if (DOM.checkBtn) DOM.checkBtn.classList.remove('hidden');
    if (DOM.nextBtn) DOM.nextBtn.classList.add('hidden');
    if (DOM.shareBtn) DOM.shareBtn.classList.add('hidden');
    if (DOM.goToPracticeBtn) DOM.goToPracticeBtn.classList.add('hidden');
    if (DOM.hintBtn) DOM.hintBtn.classList.remove('hidden');

    const parsed = parseNuclearEquation(equationData);
    state.userCoefficients = new Array(parsed.reactants.length + parsed.products.length).fill(1);

    const insightCard = document.getElementById('insight-card');
    if (insightCard) insightCard.classList.add('hidden');

    renderNuclearBoard(parsed);
}

function renderNuclearBoard(parsedEq) {
    if (!DOM.equationContainer) return;

    DOM.equationContainer.innerHTML = '';
    inputsArray = [];

    const boardWrapper = document.createElement('div');
    boardWrapper.className = 'flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 text-lg md:text-xl font-bold text-slate-700 dark:text-slate-100';

    parsedEq.reactants.forEach((term, idx) => {
        const termEl = createNuclearTermHTML(term, idx, 'reactant');
        boardWrapper.appendChild(termEl);

        if (idx < parsedEq.reactants.length - 1) {
            const plusSpan = document.createElement('span');
            plusSpan.className = 'text-slate-500 font-bold mx-1';
            plusSpan.textContent = '+';
            boardWrapper.appendChild(plusSpan);
        }
    });

    const arrowIcon = document.createElement('i');
    arrowIcon.className = 'fa-solid fa-arrow-right text-amber-500 mx-2 text-2xl';
    boardWrapper.appendChild(arrowIcon);

    parsedEq.products.forEach((term, idx) => {
        const globalIdx = parsedEq.reactants.length + idx;
        const termEl = createNuclearTermHTML(term, globalIdx, 'product');
        boardWrapper.appendChild(termEl);

        if (idx < parsedEq.products.length - 1) {
            const plusSpan = document.createElement('span');
            plusSpan.className = 'text-slate-500 font-bold mx-1';
            plusSpan.textContent = '+';
            boardWrapper.appendChild(plusSpan);
        }
    });

    DOM.equationContainer.appendChild(boardWrapper);

    calculateNuclearMatrix();

    if (inputsArray.length > 0) {
        setTimeout(() => inputsArray[0].inputEl.focus(), 50);
    }
}

function createNuclearTermHTML(term, index, type) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 p-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm';

    const input = document.createElement('input');
    const coeff = state.userCoefficients[index];
    input.type = 'number';
    input.min = '1';
    input.max = '99';
    input.placeholder = '1';
    input.value = (coeff && coeff > 1) ? coeff : '';
    input.className = 'w-12 h-10 sm:w-14 sm:h-11 text-center text-lg sm:text-xl font-bold font-mono bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all';

    input.addEventListener('input', (e) => {
        playSound('click');
        const rawVal = e.target.value.trim();
        const val = parseInt(rawVal, 10);
        state.userCoefficients[index] = (!isNaN(val) && val > 0) ? val : 1;
        calculateNuclearMatrix();
    });

    wrapper.appendChild(input);

    if (term.isSelectable) {
        const slotBtn = document.createElement('button');
        slotBtn.type = 'button';

        if (term.selectedParticle) {
            slotBtn.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 transition-all font-mono font-bold text-sm sm:text-base cursor-pointer';

            slotBtn.innerHTML = `
                <span class="text-xs flex flex-col items-end leading-none font-sans font-normal opacity-80">
                    <span>${term.selectedParticle.mass}</span>
                    <span>${term.selectedParticle.charge >= 0 ? '+' : ''}${term.selectedParticle.charge}</span>
                </span>
                <span class="text-lg font-bold">${term.selectedParticle.symbol}</span>
            `;

            slotBtn.addEventListener('mouseenter', (e) => showElementTooltip(e, term.selectedParticle.symbol));
            slotBtn.addEventListener('mouseleave', hideElementTooltip);
        } else {
            slotBtn.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-dashed border-amber-500/50 hover:border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 transition-all font-mono font-bold text-sm sm:text-base cursor-pointer';
            slotBtn.innerHTML = `<i class="fa-solid fa-circle-question text-amber-500 mr-1"></i> Choose`;
        }

        slotBtn.addEventListener('click', (e) => {
            e.preventDefault();
            playSound('click');
            activeTargetTerm = term;
            document.getElementById('particle-picker-modal')?.classList.remove('hidden');
        });

        wrapper.appendChild(slotBtn);
    } else {
        // --- Standard Fixed Isotope Display ---
        const label = document.createElement('div');
        label.className = 'flex items-center font-mono cursor-help select-none';

        const mass = term.mass !== undefined ? term.mass : '';
        const charge = term.charge !== undefined ? term.charge : '';
        const symbol = term.symbol || '';
        const netCharge = term.netCharge;

        let netChargeHTML = '';
        if (netCharge !== null && netCharge !== undefined && netCharge !== 0) {
            const sign = netCharge > 0 ? '+' : '-';
            const absVal = Math.abs(netCharge);
            const displayVal = absVal === 1 ? sign : `${absVal}${sign}`;
            netChargeHTML = `<sup class="text-[10px] sm:text-xs font-bold text-amber-500 ml-0.5">${displayVal}</sup>`;
        }

        label.innerHTML = `
            <span class="inline-flex flex-col text-[10px] sm:text-xs text-right mr-1 leading-tight text-slate-500 dark:text-slate-400 font-bold">
                <span>${mass}</span>
                <span>${charge >= 0 && charge !== '' ? '+' + charge : charge}</span>
            </span>
            <span class="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100">${symbol}</span>
            ${netChargeHTML}
        `;

        label.addEventListener('mouseenter', (e) => showElementTooltip(e, symbol));
        label.addEventListener('mouseleave', hideElementTooltip);
        label.addEventListener('touchstart', (e) => showElementTooltip(e, symbol), { passive: true });
        label.addEventListener('touchend', hideElementTooltip);

        wrapper.appendChild(label);
    }

    inputsArray.push({
        inputEl: input,
        expectedCoeff: term.coeff,
        isSelectable: term.isSelectable || false,
        expectedParticle: term.expectedParticle || null,
        termData: term,
        type: type
    });

    return wrapper;
}

function checkNuclearBalanceHandler() {
    if (!state.currentEquation) return;

    state.scoreAttempts++;

    const isCoeffBalanced = checkNuclearBalance(state.currentEquation, state.userCoefficients);

    let isParticleSelectionCorrect = true;
    inputsArray.forEach(item => {
        if (item.isSelectable) {
            const selected = item.termData.selectedParticle;
            if (!selected ||
                selected.symbol !== item.expectedParticle.symbol ||
                selected.mass !== item.expectedParticle.mass ||
                selected.charge !== item.expectedParticle.charge) {
                isParticleSelectionCorrect = false;
            }
        }
    });

    const isBalanced = isCoeffBalanced && isParticleSelectionCorrect;

    if (isBalanced) {
        playSound('correct');
        state.scoreCorrect++;

        if (typeof window.confetti === 'function') {
            window.confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        }

        showFeedback('<i class="fa-solid fa-circle-check mr-2"></i> Perfect! Mass numbers (A), atomic charges (Z), and subatomic particles are correctly balanced!', 'success');

        showInsightCard();

        if (DOM.checkBtn) DOM.checkBtn.classList.add('hidden');

        if (state.currentMode === 'daily') {
            const todayStr = getTodayDateString();
            const history = Storage.getDailyHistory();

            history[todayStr] = { completed: true, timestamp: new Date().toISOString() };
            Storage.setDailyHistory(history);

            if (DOM.nextBtn) DOM.nextBtn.classList.add('hidden');
            if (DOM.hintBtn) DOM.hintBtn.classList.add('hidden');
            if (DOM.shareBtn) DOM.shareBtn.classList.remove('hidden');
            if (DOM.goToPracticeBtn) DOM.goToPracticeBtn.classList.remove('hidden');

            const streakCountEl = document.getElementById('streak-count');
            if (streakCountEl) streakCountEl.textContent = Storage.getDailyStreak();

            if (DOM.dailyHeaderTag) startDailyCountdownTimer(DOM.dailyHeaderTag);
        } else {
            if (DOM.nextBtn) DOM.nextBtn.classList.remove('hidden');
            if (DOM.shareBtn) DOM.shareBtn.classList.add('hidden');
            if (DOM.goToPracticeBtn) DOM.goToPracticeBtn.classList.add('hidden');
            if (DOM.hintBtn) DOM.hintBtn.classList.remove('hidden');
        }
    } else {
        playSound('wrong');

        if (!isParticleSelectionCorrect) {
            showFeedback('<i class="fa-solid fa-triangle-exclamation mr-2"></i> Almost there! Make sure you have selected the correct subatomic particle for the blank slot.', 'error');
        } else {
            showFeedback('<i class="fa-solid fa-triangle-exclamation mr-2"></i> Not balanced yet. Check mass numbers and atomic charges in the matrix table above!', 'error');
        }
    }

    Storage.saveStats(state.scoreCorrect, state.scoreAttempts, Storage.getDailyStreak());
    updateScoreboardDisplay();
}

function showFeedback(msg, type) {
    const banner = DOM.feedbackBanner || document.getElementById('feedback-banner');
    if (!banner) return;

    banner.innerHTML = msg;
    banner.classList.remove('hidden');

    if (type === 'success') {
        banner.className = 'mt-6 p-4 rounded-xl text-center font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 animate-bounce';
    } else if (type === 'error') {
        banner.className = 'mt-6 p-4 rounded-xl text-center font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/20 border border-rose-500/40';
    } else if (type === 'hint') {
        banner.className = 'mt-6 p-4 rounded-xl text-center font-medium bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs sm:text-sm';
    }
}

export function provideNuclearHint() {
    playSound('click');
    if (!state.currentEquation) return;

    const parsed = parseNuclearEquation(state.currentEquation);
    const offset = parsed.reactants.length;
    let reactA = 0, reactZ = 0, prodA = 0, prodZ = 0;

    parsed.reactants.forEach((term, idx) => {
        const coeff = state.userCoefficients[idx] || 1;
        reactA += (term.mass || 0) * coeff;
        reactZ += (term.charge !== undefined ? term.charge : 0) * coeff;
    });

    parsed.products.forEach((term, idx) => {
        const coeff = state.userCoefficients[offset + idx] || 1;
        prodA += (term.mass || 0) * coeff;
        prodZ += (term.charge !== undefined ? term.charge : 0) * coeff;
    });

    state.hintStep = (state.hintStep % 3) + 1;
    let hintMessage = '';

    if (state.hintStep === 1) {
        toggleMatrixAccordion('nuclear-matrix-wrapper', 'nuclear-matrix-chevron', true);
        if (reactA !== prodA) {
            const diff = Math.abs(reactA - prodA);
            hintMessage = `<i class="fa-solid fa-lightbulb text-amber-500 mr-2"></i> <strong>Hint 1 (Mass Number A):</strong> Total Mass on the left is <strong>${reactA}</strong> and on the right is <strong>${prodA}</strong>. Adjust coefficients to balance a difference of <strong>${diff}</strong>.`;
        } else {
            hintMessage = `<i class="fa-solid fa-lightbulb text-amber-500 mr-2"></i> <strong>Hint 1 (Mass Number A):</strong> Total Mass Number (A = ${reactA}) is currently balanced!`;
        }
    } else if (state.hintStep === 2) {
        if (reactZ !== prodZ) {
            hintMessage = `<i class="fa-solid fa-lightbulb text-amber-500 mr-2"></i> <strong>Hint 2 (Atomic Charge Z):</strong> Left side charge is <strong>${reactZ}</strong> vs Right side <strong>${prodZ}</strong>. Adjust coefficients to match total charge.`;
        } else {
            hintMessage = `<i class="fa-solid fa-lightbulb text-amber-500 mr-2"></i> <strong>Hint 2 (Atomic Charge Z):</strong> Atomic Charge (Z = ${reactZ}) is currently balanced!`;
        }
    } else if (state.hintStep === 3) {
        const correctCoeffs = [
            ...parsed.reactants.map(r => r.coeff || 1),
            ...parsed.products.map(p => p.coeff || 1)
        ].join(', ');
        hintMessage = `<i class="fa-solid fa-wand-magic-sparkles text-amber-500 mr-2"></i> <strong>Hint 3 (Solution):</strong> The correct lowest whole-number coefficient ratio is: <strong>${correctCoeffs}</strong>`;
    }

    showFeedback(hintMessage, 'hint');
}

function showInsightCard() {
    const card = document.getElementById('insight-card');
    const text = document.getElementById('insight-text');
    const formula = document.getElementById('insight-formula');

    if (!card || !state.currentEquation) return;

    if (text) {
        text.innerText = state.currentEquation.explanation || 'Nuclear reaction balanced according to the conservation of mass number (A) and atomic charge (Z).';
    }

    if (formula) {
        const parsed = parseNuclearEquation(state.currentEquation);
        const offset = parsed.reactants.length;

        const formatTermStr = (term, coeff) => {
            const prefix = coeff > 1 ? `${coeff}` : '';
            const mass = term.mass !== undefined ? term.mass : '';
            const charge = term.charge !== undefined ? term.charge : '';
            const symbol = term.symbol || '';
            return `${prefix}<sup>${mass}</sup><sub>${charge}</sub>${symbol}`;
        };

        const reactantsStr = parsed.reactants.map((r, i) =>
            formatTermStr(r, state.userCoefficients[i] || 1)
        ).join(' + ');

        const productsStr = parsed.products.map((p, i) =>
            formatTermStr(p, state.userCoefficients[offset + i] || 1)
        ).join(' + ');

        formula.innerHTML = `${reactantsStr} &rarr; ${productsStr}`;
    }

    card.classList.remove('hidden');
}

function shareDailyResult() {
    playSound('click');

    const currentStreak = Storage.getDailyStreak();
    const dayNum = getDailyChallengeNumber('2026-01-01');

    const shareText = `Nuclear Reactle Daily #${dayNum} ☢️\n` +
                      `Streak: ${currentStreak} 🔥 | Solved in Daily Challenge Mode!\n` +
                      `https://brickeli.github.io/WebApps/Reactle/nuclear.html`;

    if (navigator.share) {
        navigator.share({ title: 'Nuclear Reactle Daily Challenge', text: shareText }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showFeedback('<i class="fa-solid fa-copy mr-2"></i> Daily result copied to clipboard!', 'hint');
        });
    }
}

/**
 * Custom Equation Setup & Handlers
 */
export function initCustomSolverSection() {
    const customInput = document.getElementById('custom-input');
    const solveBtn = document.getElementById('solve-custom-btn');
    const exampleBtns = document.querySelectorAll('.custom-example-btn');

    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            const expr = btn.getAttribute('data-expr');
            if (expr && customInput) {
                customInput.value = expr;
                customInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });

    if (solveBtn && customInput) {
        solveBtn.addEventListener('click', () => {
            playSound('click');
            const rawInput = customInput.value.trim();

            if (!rawInput) {
                showCustomError("Please enter or select a nuclear reaction first.");
                return;
            }

            try {
                const solvedResult = handleCustomNuclearBalance(rawInput);
                if (solvedResult) {
                    renderCustomSolution(solvedResult);
                } else {
                    showCustomError("Unable to balance reaction. Please check element notations.");
                }
            } catch (err) {
                console.error("Custom balancing failed:", err);
                showCustomError("Invalid equation format. Example: Ra226 -> Rn222 + He4");
            }
        });
    }
}

function handleCustomNuclearBalance(inputStr) {
    const normalized = inputStr.replace(/-->|=|⇒/g, '->');
    const parts = normalized.split('->');

    if (parts.length !== 2) {
        throw new Error("Missing reaction arrow ('->')");
    }

    const parseTerm = (termStr) => {
        const trimmed = termStr.trim();
        if (!trimmed) return null;

        let coeff = 1;
        let remainder = trimmed;
        const coeffMatch = trimmed.match(/^(\d+)\s*(.+)$/);
        if (coeffMatch) {
            coeff = parseInt(coeffMatch[1], 10);
            remainder = coeffMatch[2].trim();
        }

        let symbolRaw = '';
        let mass = null;
        let charge = null;

        const matchSuffix = remainder.match(/^([a-zA-Z]+)[\-]?(\d+)$/);
        const matchPrefix = remainder.match(/^(\d+)[\-]?([a-zA-Z]+)$/);
        const matchSuper = remainder.match(/^(-?\d+)\^(\d+)([a-zA-Z]+)$/);

        if (matchSuffix) {
            symbolRaw = matchSuffix[1];
            mass = parseInt(matchSuffix[2], 10);
        } else if (matchPrefix) {
            mass = parseInt(matchPrefix[1], 10);
            symbolRaw = matchPrefix[2];
        } else if (matchSuper) {
            charge = parseInt(matchSuper[1], 10);
            mass = parseInt(matchSuper[2], 10);
            symbolRaw = matchSuper[3];
        } else if (/^[a-zA-Z]+$/.test(remainder)) {
            symbolRaw = remainder;
        } else {
            throw new Error(`Unrecognized term '${trimmed}'`);
        }

        if (symbolRaw === 'n' || symbolRaw === 'n1' || symbolRaw === '0^1n') {
            return { coeff, mass: mass || 1, charge: 0, symbol: 'n', rawStr: trimmed };
        }
        if (symbolRaw === 'p' || symbolRaw === 'p1' || symbolRaw === '1^1h') {
            return { coeff, mass: mass || 1, charge: 1, symbol: 'p', rawStr: trimmed };
        }
        if (symbolRaw === 'e' || symbolRaw === 'e-' || symbolRaw.toLowerCase() === 'beta') {
            return { coeff, mass: mass || 0, charge: -1, symbol: 'e⁻', rawStr: trimmed };
        }
        if (symbolRaw === 'e+' || symbolRaw.toLowerCase() === 'positron') {
            return { coeff, mass: mass || 0, charge: 1, symbol: 'e⁺', rawStr: trimmed };
        }
        if (symbolRaw.toLowerCase() === 'alpha') {
            return { coeff, mass: mass || 4, charge: 2, symbol: 'α', rawStr: trimmed };
        }

        const formattedSymbol = symbolRaw.length === 1
            ? symbolRaw.toUpperCase()
            : symbolRaw.charAt(0).toUpperCase() + symbolRaw.charAt(1).toLowerCase();

        const Z_LOOKUP = {
            H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10,
            Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18, K: 19, Ca: 20,
            Fe: 26, Co: 27, Ni: 28, Cu: 29, Zn: 30, Br: 35, Kr: 36, Mo: 42, Tc: 43, Ag: 47,
            I: 53, Ba: 56, Hg: 80, Pb: 82, Bi: 83, Po: 84, Rn: 86, Ra: 88, Th: 90, U: 92,
            Pu: 94, Am: 95, Cf: 98
        };

        if (typeof PERIODIC_TABLE !== 'undefined' && PERIODIC_TABLE[formattedSymbol]) {
            const el = PERIODIC_TABLE[formattedSymbol];
            if (charge === null && el.atomicNumber !== undefined) {
                charge = parseInt(el.atomicNumber, 10);
            }
            if ((mass === null || mass === 0) && el.atomicMass) {
                mass = Math.round(parseFloat(el.atomicMass));
            }
        }

        if (charge === null) {
            charge = Z_LOOKUP[formattedSymbol] !== undefined ? Z_LOOKUP[formattedSymbol] : 0;
        }
        if (mass === null) mass = 0;

        return { coeff, mass, charge, symbol: formattedSymbol, rawStr: trimmed };
    };

    const parseSide = (sideStr) => sideStr.split('+').map(parseTerm).filter(Boolean);

    const reactants = parseSide(parts[0]);
    const products = parseSide(parts[1]);

    const initialReactA = reactants.reduce((sum, r) => sum + (r.mass * r.coeff), 0);
    const initialReactZ = reactants.reduce((sum, r) => sum + (r.charge * r.coeff), 0);
    const initialProdA = products.reduce((sum, p) => sum + (p.mass * p.coeff), 0);
    const initialProdZ = products.reduce((sum, p) => sum + (p.charge * p.coeff), 0);

    const deltaA = initialReactA - initialProdA;
    const deltaZ = initialReactZ - initialProdZ;

    const isInitiallyBalanced = (initialReactA === initialProdA) && (initialReactZ === initialProdZ);

    let solvedMissingParticle = null;
    let solvedCoeffs = null;

    if (!isInitiallyBalanced) {
        if (deltaA !== 0 || deltaZ !== 0) {
            solvedMissingParticle = identifyParticle(deltaA, deltaZ);
        }
        solvedCoeffs = solveCoefficients(reactants, products);
    }

    return {
        reactants,
        products,
        initialReactA,
        initialReactZ,
        initialProdA,
        initialProdZ,
        solvedMissingParticle,
        solvedCoeffs,
        isBalanced: isInitiallyBalanced
    };
}

function identifyParticle(mass, charge) {
    if (mass === 1 && charge === 0) return { coeff: 1, mass: 1, charge: 0, symbol: 'n' };
    if (mass === 2 && charge === 0) return { coeff: 2, mass: 1, charge: 0, symbol: 'n' };
    if (mass === 3 && charge === 0) return { coeff: 3, mass: 1, charge: 0, symbol: 'n' };
    if (mass === 1 && charge === 1) return { coeff: 1, mass: 1, charge: 1, symbol: 'p' };
    if (mass === 0 && charge === -1) return { coeff: 1, mass: 0, charge: -1, symbol: 'e⁻' };
    if (mass === 0 && charge === 1) return { coeff: 1, mass: 0, charge: 1, symbol: 'e⁺' };
    if (mass === 4 && charge === 2) return { coeff: 1, mass: 4, charge: 2, symbol: 'α' };
    if (mass > 0 && charge >= 0) return { coeff: 1, mass: mass, charge: charge, symbol: `Z${charge}A${mass}` };
    return null;
}

function solveCoefficients(reactants, products) {
    for (let c1 = 1; c1 <= 6; c1++) {
        for (let c2 = 1; c2 <= 6; c2++) {
            for (let c3 = 1; c3 <= 6; c3++) {
                for (let c4 = 1; c4 <= 6; c4++) {
                    const rCoeffs = [c1, c2].slice(0, reactants.length);
                    const pCoeffs = [c3, c4].slice(0, products.length);

                    const rA = reactants.reduce((s, r, idx) => s + r.mass * (rCoeffs[idx] || 1), 0);
                    const rZ = reactants.reduce((s, r, idx) => s + r.charge * (rCoeffs[idx] || 1), 0);
                    const pA = products.reduce((s, p, idx) => s + p.mass * (pCoeffs[idx] || 1), 0);
                    const pZ = products.reduce((s, p, idx) => s + p.charge * (pCoeffs[idx] || 1), 0);

                    if (rA === pA && rZ === pZ) {
                        return { reactants: rCoeffs, products: pCoeffs };
                    }
                }
            }
        }
    }
    return null;
}

function renderCustomSolution(res) {
    const resultContainer = document.getElementById('solver-result');
    const outputEq = document.getElementById('solver-output-eq');
    if (!resultContainer || !outputEq) return;

    const formatTerm = (t) => {
        const coeffStr = t.coeff > 1 ? `<span class="text-amber-500 font-bold mr-1">${t.coeff}</span>` : '';
        const chargeStr = t.charge >= 0 ? `+${t.charge}` : `${t.charge}`;

        return `
            <span class="inline-flex items-center gap-0.5">
                ${coeffStr}
                <span class="inline-flex flex-col text-[0.65em] leading-none text-right font-sans font-normal opacity-80 select-none mr-0.5">
                    <span>${t.mass}</span>
                    <span>${chargeStr}</span>
                </span>
                <span class="font-bold">${t.symbol}</span>
            </span>
        `;
    };

    const reactantsStr = res.reactants.map(formatTerm).join('<span class="mx-2 text-slate-400 dark:text-slate-500">+</span>');
    let productsStr = res.products.map(formatTerm).join('<span class="mx-2 text-slate-400 dark:text-slate-500">+</span>');

    if (!res.isBalanced && res.solvedMissingParticle) {
        const p = res.solvedMissingParticle;
        const missingTermStr = `
            <span class="inline-flex items-center gap-0.5 text-amber-500 animate-pulse">
                ${p.coeff > 1 ? `<span class="font-bold mr-1">${p.coeff}</span>` : ''}
                <span class="inline-flex flex-col text-[0.65em] leading-none text-right font-sans font-normal opacity-80 select-none mr-0.5">
                    <span>${p.mass}</span>
                    <span>${p.charge >= 0 ? '+' : ''}${p.charge}</span>
                </span>
                <span class="font-bold">${p.symbol}</span>
            </span>
        `;
        productsStr += `<span class="mx-2 text-amber-500 font-bold">+</span>${missingTermStr}`;
    }

    const fullBalancedEq = `${reactantsStr} <i class="fa-solid fa-arrow-right text-amber-500 mx-2 text-lg"></i> ${productsStr}`;

    const isBalanced = res.isBalanced;
    const statusColor = isBalanced ? 'emerald' : 'rose';
    const statusIcon = isBalanced ? 'fa-circle-check' : 'fa-triangle-exclamation';
    const statusTitle = isBalanced ? 'Reaction is Balanced!' : 'Unbalanced Reaction!';

    resultContainer.classList.remove('hidden');
    outputEq.innerHTML = `
        <div class="space-y-4 text-base">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2 font-bold text-${statusColor}-600 dark:text-${statusColor}-400">
                    <i class="fa-solid ${statusIcon}"></i> ${statusTitle}
                </div>
                ${!isBalanced && res.solvedMissingParticle ? `
                    <span class="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono font-semibold">
                        Missing Particle: +${res.solvedMissingParticle.coeff > 1 ? res.solvedMissingParticle.coeff : ''}${res.solvedMissingParticle.symbol}
                    </span>
                ` : ''}
            </div>

            <div class="text-xl sm:text-2xl font-mono p-4 flex flex-wrap gap-y-2">
                ${fullBalancedEq}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                    <span class="text-amber-600 block mb-1">Reactants (Left Side):</span>
                    <div>Total Mass Number (A): <strong class="text-amber-500">${res.initialReactA}</strong></div>
                    <div>Total Atomic Charge (Z): <strong class="text-amber-500">${res.initialReactZ}</strong></div>
                </div>
                <div>
                    <span class="text-amber-600 block mb-1">Products (Right Side):</span>
                    <div>Total Mass Number (A): <strong class="${res.initialReactA === res.initialProdA ? 'text-amber-500' : 'text-rose-600'}">${res.initialProdA}</strong></div>
                    <div>Total Atomic Charge (Z): <strong class="${res.initialReactZ === res.initialProdZ ? 'text-amber-500' : 'text-rose-600'}">${res.initialProdZ}</strong></div>
                </div>
            </div>
        </div>
    `;
}

function showCustomError(message) {
    const resultContainer = document.getElementById('solver-result');
    const outputEq = document.getElementById('solver-output-eq');
    if (resultContainer && outputEq) {
        resultContainer.classList.remove('hidden');
        outputEq.innerHTML = `
            <div class="p-3 text-sm text-rose-600 bg-rose-500/10 border border-rose-500/40 rounded-lg font-sans font-medium">
                <i class="fa-solid fa-triangle-exclamation mr-2"></i>${message}
            </div>
        `;
    }
}
