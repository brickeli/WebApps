/**
 * Nuclear Reactle - Main Application Controller
 * Handles nuclear decay & transmutation balancing, UI interactions, and state updates.
 */

import './core/shell.js';
import { Storage } from './utils/storage.js';
import { parseNuclearEquation } from './engine/nuclearParser.js';
import { checkNuclearCoefficients } from './engine/nuclearCheck.js';
import { renderNuclearMatrix } from './ui/nuclearUI.js';
import { NUCLEAR_EQUATIONS } from './data/nuclearEquations.js';
import { PERIODIC_TABLE } from './data/periodicTable.js';
import { initModeDropdown, toggleNavMenu, toggleMatrixAccordion, toggleFilterAccordion, toggleModal, showElementTooltip, hideElementTooltip } from './ui/components.js';
import { populateFilterDropdowns, onFilterChange } from './ui/filters.js';
import { initSettings } from './core/settings.js';
import { initA11y } from './ui/a11y.js';
import { createScoreboard, createModeSwitcher, shareDailyResult as shareResult, pickPractice, loadDaily, setControls, finishSolve, getModeFromURL  } from './core/game-common.js';
import { playSound } from './engine/audio.js';

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
    hintStep: 0,
    showMatrixBadge: false,
    isMatrixAccordionOpen: true
};

const scoreboard = createScoreboard('nuclear');

// --- DOM Elements ---
const DOM = {
    dropdownBtn: document.getElementById('mode-dropdown-btn'),
    dropdownMenu: document.getElementById('mode-dropdown-menu'),
    dropdownChevron: document.getElementById('mode-dropdown-chevron'),
    equationContainer: document.getElementById('nuclear-equation-container'),
    matrixContainer: document.getElementById('nuclear-matrix-container'),
    matrixToggleBtn: document.getElementById('matrix-toggle'),
    matrixWrapper: document.getElementById('matrix-wrapper'),
    matrixChevron: document.getElementById('matrix-chevron'),
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

const modeSwitcher = createModeSwitcher({
    icons: { daily: 'fa-calendar-day', practice: 'fa-radiation', solver: 'fa-calculator' },
    onDaily: loadDailyEquation,
    onPractice: () => {
        if (!state.practiceEquation) loadNextEquation();
        else { state.currentEquation = state.practiceEquation; loadNuclearEquation(state.practiceEquation); }
    }
});

function switchMode(mode) {
    state.currentMode = mode;
    modeSwitcher(mode);
}

// Expose functions globally for inline HTML event calls
window.showElementTooltip = showElementTooltip;
window.hideElementTooltip = hideElementTooltip;
window.switchMode = switchMode;
window.toggleNavMenu = toggleNavMenu;
window.toggleModal = toggleModal;
window.calculateNuclearMatrix = calculateNuclearMatrix;

/* --- Bootstrap Application --- */
document.addEventListener('DOMContentLoaded', () => {
    initA11y();
    initSettings({ accent: 'amber', onMatrixChange: calculateNuclearMatrix });
    initModeDropdown();
    initCustomSolverSection();
    scoreboard.load();
    populateFilterDropdowns(NUCLEAR_EQUATIONS);
    setupEventListeners();

    toggleMatrixAccordion('matrix-wrapper', 'matrix-chevron', true);
    switchMode(getModeFromURL(), { replace: true, silent: true });
});

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
    DOM.matrixToggleBtn?.addEventListener('click', () => toggleMatrixAccordion('matrix-wrapper', 'matrix-chevron'));
    DOM.filterAccordionToggle?.addEventListener('click', () => toggleFilterAccordion());
    document.getElementById('reset-score-btn')?.addEventListener('click', () => scoreboard.reset());

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

function loadNextEquation() {
    state.practiceEquation = pickPractice(NUCLEAR_EQUATIONS, state.practiceEquation);
    state.currentEquation = state.practiceEquation;
    loadNuclearEquation(state.practiceEquation);
}

function loadDailyEquation() {
    loadDaily({
        game: 'nuclear',
        list: NUCLEAR_EQUATIONS,
        accent: 'amber',
        render: loadNuclearEquation,
        showInsight: showInsightCard
    });
}

function calculateNuclearMatrix() {
    if (!state.currentEquation) return;

    const parsed = parseNuclearEquation(state.currentEquation);
    const showBadge = Storage.getMatrixBadge() ?? true;

    renderNuclearMatrix(
        parsed,
        state.userCoefficients,
        showBadge
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
    setControls('ready');

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
    boardWrapper.className = 'equation-board';

    parsedEq.reactants.forEach((term, idx) => {
        const termEl = createNuclearTermHTML(term, idx, 'reactant');
        boardWrapper.appendChild(termEl);

        if (idx < parsedEq.reactants.length - 1) {
            const plusSpan = document.createElement('span');
            plusSpan.className = 'equation-plus';
            plusSpan.textContent = '+';
            boardWrapper.appendChild(plusSpan);
        }
    });

    const arrowIcon = document.createElement('i');
    arrowIcon.className = 'fa-solid fa-arrow-right equation-arrow';
    boardWrapper.appendChild(arrowIcon);

    parsedEq.products.forEach((term, idx) => {
        const globalIdx = parsedEq.reactants.length + idx;
        const termEl = createNuclearTermHTML(term, globalIdx, 'product');
        boardWrapper.appendChild(termEl);

        if (idx < parsedEq.products.length - 1) {
            const plusSpan = document.createElement('span');
            plusSpan.className = 'equation-plus';
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
    wrapper.className = 'term-card';

    const input = document.createElement('input');
    const coeff = state.userCoefficients[index];
    input.type = 'number';
    input.id = `coeff-${type}-${index}`;
    input.name = `coeff-${type}-${index}`;
    input.autocomplete = 'off';
    input.min = '1';
    input.max = '99';
    input.placeholder = '1';
    input.value = (coeff && coeff > 1) ? coeff : '';
    input.className = 'term-coeff-input';

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
            slotBtn.className = 'particle-slot-btn is-selected';
            slotBtn.innerHTML = `
                <span class="particle-slot-nums">
                    <span>${term.selectedParticle.mass}</span>
                    <span>${term.selectedParticle.charge >= 0 ? '+' : ''}${term.selectedParticle.charge}</span>
                </span>
                <span class="particle-slot-symbol">${term.selectedParticle.symbol}</span>
            `;

            slotBtn.addEventListener('mouseenter', (e) => showElementTooltip(e, term.selectedParticle.symbol));
            slotBtn.addEventListener('mouseleave', hideElementTooltip);
        } else {
            slotBtn.className = 'particle-slot-btn is-empty';
            slotBtn.innerHTML = `<i class="fa-solid fa-circle-question particle-slot-icon"></i> Choose`;
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
        label.className = 'nuclide term-nuclide-wrap';

        const mass = term.mass !== undefined ? term.mass : '';
        const charge = term.charge !== undefined ? term.charge : '';
        const symbol = term.symbol || '';

        label.innerHTML = `
            <span class="nuclide-nums">
                <span>${mass}</span>
                <span>${charge >= 0 && charge !== '' ? '+' + charge : charge}</span>
            </span>
            <span class="nuclide-symbol">${symbol}</span>
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

    // same rules as Reactle: balanced AND in the smallest whole numbers
    const result = checkNuclearCoefficients(state.currentEquation, state.userCoefficients);
    const isCoeffBalanced = result.balanced && result.reduced;

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

        if (typeof window.confetti === 'function') {
            window.confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        }

        showFeedback('<i class="fa-solid fa-circle-check feedback-icon"></i> Perfect! Mass numbers (A), atomic charges (Z), and subatomic particles are correctly balanced!', 'success');

        showInsightCard();

        finishSolve('nuclear', state.currentMode);
    } else if (!isParticleSelectionCorrect) {
        playSound('wrong');
        showFeedback('<i class="fa-solid fa-triangle-exclamation feedback-icon"></i> Almost there! Make sure you have selected the correct subatomic particle for the blank slot.', 'error');
    } else if (result.balanced) {
        playSound('click');
        showFeedback(`<i class="fa-solid fa-lightbulb feedback-icon is-accent"></i> Balanced! Can you reduce it to the smallest whole numbers? Every coefficient can be divided by ${result.divisor}.`, 'hint');
    } else {
        playSound('wrong');
        const clues = result.mismatches.map(m => `${m.label} is ${m.left} on the left and ${m.right} on the right`);
        showFeedback(`<i class="fa-solid fa-triangle-exclamation feedback-icon"></i> Not balanced yet: ${clues.join('; ')}.`, 'error');
    }

    // after the daily history is written, so the streak shown is current
    scoreboard.recordAttempt(isBalanced);
}

function showFeedback(msg, type) {
    const banner = DOM.feedbackBanner || document.getElementById('feedback-banner');
    if (!banner) return;

    banner.innerHTML = msg;
    banner.className = `feedback-banner is-${type}`;
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
        toggleMatrixAccordion('matrix-wrapper', 'matrix-chevron', true);
        if (reactA !== prodA) {
            const diff = Math.abs(reactA - prodA);
            hintMessage = `<i class="fa-solid fa-lightbulb hint-icon"></i> <strong>Hint 1 (Mass Number A):</strong> Total Mass on the left is <strong>${reactA}</strong> and on the right is <strong>${prodA}</strong>. Adjust coefficients to balance a difference of <strong>${diff}</strong>.`;
        } else {
            hintMessage = `<i class="fa-solid fa-lightbulb hint-icon"></i> <strong>Hint 1 (Mass Number A):</strong> Total Mass Number (A = ${reactA}) is currently balanced!`;
        }
    } else if (state.hintStep === 2) {
        if (reactZ !== prodZ) {
            hintMessage = `<i class="fa-solid fa-lightbulb hint-icon"></i> <strong>Hint 2 (Atomic Charge Z):</strong> Left side charge is <strong>${reactZ}</strong> vs Right side <strong>${prodZ}</strong>. Adjust coefficients to match total charge.`;
        } else {
            hintMessage = `<i class="fa-solid fa-lightbulb hint-icon"></i> <strong>Hint 2 (Atomic Charge Z):</strong> Atomic Charge (Z = ${reactZ}) is currently balanced!`;
        }
    } else if (state.hintStep === 3) {
        const correctCoeffs = [
            ...parsed.reactants.map(r => r.coeff || 1),
            ...parsed.products.map(p => p.coeff || 1)
        ].join(', ');
        hintMessage = `<i class="fa-solid fa-wand-magic-sparkles hint-icon"></i> <strong>Hint 3 (Solution):</strong> The correct lowest whole-number coefficient ratio is: <strong>${correctCoeffs}</strong>`;
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
    shareResult({
        game: 'nuclear',
        title: 'Nuclear Reactle',
        emoji: '☢️',
        url: 'https://brickeli.github.io/WebApps/Reactle/nuclear.html',
        onCopied: () => showFeedback('<i class="fa-solid fa-copy mr-2"></i> Daily result copied to clipboard!', 'hint')
    });
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

    const formatTerm = (t, isMissing = false) => {
        const coeffStr = t.coeff > 1 ? `<span class="solver-term-coeff">${t.coeff}</span>` : '';
        const chargeStr = t.charge >= 0 ? `+${t.charge}` : `${t.charge}`;

        return `
            <span class="solver-term ${isMissing ? 'is-missing' : ''}">
                ${coeffStr}
                <span class="solver-term-nums">
                    <span>${t.mass}</span>
                    <span>${chargeStr}</span>
                </span>
                <span class="solver-term-symbol">${t.symbol}</span>
            </span>
        `;
    };

    const reactantsStr = res.reactants.map((t) => formatTerm(t)).join('<span class="solver-op">+</span>');
    let productsStr = res.products.map((t) => formatTerm(t)).join('<span class="solver-op">+</span>');

    if (!res.isBalanced && res.solvedMissingParticle) {
        const missingTermStr = formatTerm(res.solvedMissingParticle, true);
        productsStr += `<span class="solver-op is-accent">+</span>${missingTermStr}`;
    }

    const fullBalancedEq = `${reactantsStr} <i class="fa-solid fa-arrow-right solver-arrow"></i> ${productsStr}`;

    const isBalanced = res.isBalanced;
    const statusClass = isBalanced ? 'is-balanced' : 'is-unbalanced';
    const statusIcon = isBalanced ? 'fa-circle-check' : 'fa-triangle-exclamation';
    const statusTitle = isBalanced ? 'Reaction is Balanced!' : 'Unbalanced Reaction!';

    const massMatchClass = res.initialReactA === res.initialProdA ? 'solver-val-match' : 'solver-val-mismatch';
    const chargeMatchClass = res.initialReactZ === res.initialProdZ ? 'solver-val-match' : 'solver-val-mismatch';

    resultContainer.classList.remove('hidden');
    outputEq.innerHTML = `
        <div class="solver-solution">
            <div class="solver-solution-header">
                <div class="solver-status ${statusClass}">
                    <i class="fa-solid ${statusIcon}"></i> ${statusTitle}
                </div>
                ${!isBalanced && res.solvedMissingParticle ? `
                    <span class="solver-missing-badge">
                        Missing Particle: +${res.solvedMissingParticle.coeff > 1 ? res.solvedMissingParticle.coeff : ''}${res.solvedMissingParticle.symbol}
                    </span>
                ` : ''}
            </div>

            <div class="solver-equation-row">
                ${fullBalancedEq}
            </div>

            <div class="solver-breakdown">
                <div>
                    <span class="solver-side-heading">Reactants (Left Side):</span>
                    <div>Total Mass Number (A): <strong class="solver-val-match">${res.initialReactA}</strong></div>
                    <div>Total Atomic Charge (Z): <strong class="solver-val-match">${res.initialReactZ}</strong></div>
                </div>
                <div>
                    <span class="solver-side-heading">Products (Right Side):</span>
                    <div>Total Mass Number (A): <strong class="${massMatchClass}">${res.initialProdA}</strong></div>
                    <div>Total Atomic Charge (Z): <strong class="${chargeMatchClass}">${res.initialProdZ}</strong></div>
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
            <div class="solver-error">
                <i class="fa-solid fa-triangle-exclamation"></i>${message}
            </div>
        `;
    }
}
