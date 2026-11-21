import './core/shell.js';
import { EQUATION_DATABASE } from './data/equations.js';
import { PERIODIC_TABLE } from './data/periodicTable.js';
import { Storage } from './utils/storage.js';
import { formatSubscripts } from './utils/helpers.js';
import { playSound } from './engine/audio.js';
import { parseFormula } from './engine/parser.js';
import { computeCoefficients } from './engine/solver.js';
import { checkCoefficients } from './engine/check.js';
import { populateFilterDropdowns, onFilterChange } from './ui/filters.js';
import { initA11y } from './ui/a11y.js';
import { initSettings } from './core/settings.js';
import { createScoreboard, createModeSwitcher, shareDailyResult as shareResult, pickPractice, loadDaily, setControls, finishSolve, getModeFromURL } from './core/game-common.js';
import { showElementTooltip, hideElementTooltip, toggleModal, toggleNavMenu, toggleFilterAccordion, toggleMatrixAccordion, initModeDropdown, isNavOpen } from './ui/components.js';

// Application State
let currentMode = 'daily';
let practiceEquation = null;
let currentEquation = null;
let inputsArray = [];
let hintStage = 0;

const scoreboard = createScoreboard('reactle');

const switchMode = createModeSwitcher({
    icons: { daily: 'fa-calendar-day', practice: 'fa-vial', solver: 'fa-calculator' },
    onDaily: loadDailyEquation,
    onPractice: () => {
        if (!practiceEquation) loadNextEquation();
        else { currentEquation = practiceEquation; renderEquationCard(practiceEquation); }
    }
});

// Expose functions globally for inline HTML event calls
window.showElementTooltip = showElementTooltip;
window.hideElementTooltip = hideElementTooltip;
window.switchMode = (mode) => { currentMode = mode; switchMode(mode); };
window.toggleModal = toggleModal;
window.toggleNavMenu = toggleNavMenu;
window.solveCustomEquation = solveCustomEquation;

/* Bootstrap Application */
window.addEventListener('DOMContentLoaded', () => {
    initA11y();
    initSettings({ accent: 'chemistry', onMatrixChange: calculateAtomMatrix });
    scoreboard.load();
    populateFilterDropdowns(EQUATION_DATABASE);
    setupEventListeners();
    initModeDropdown();

    window.switchMode(getModeFromURL(), { replace: true, silent: true });
});

function setupEventListeners() {
    // Mode Selectors
    document.getElementById('nav-practice')?.addEventListener('click', () => window.switchMode('practice'));
    document.getElementById('nav-daily')?.addEventListener('click', () => window.switchMode('daily'));
    document.getElementById('nav-solver')?.addEventListener('click', () => window.switchMode('solver'));
    document.getElementById('mode-dropdown')?.addEventListener('change', (e) => window.switchMode(e.target.value));

    // Nav Settings Menu
    document.getElementById('nav-menu-btn')?.addEventListener('click', () => toggleNavMenu());
    document.getElementById('open-help-modal-btn')?.addEventListener('click', () => {
        toggleModal('help-modal');
        toggleNavMenu(false);
    });

    // Close Nav Menu when clicking outside
    document.addEventListener('click', (e) => {
        const navMenuBtn = document.getElementById('nav-menu-btn');
        const navDropdown = document.getElementById('nav-menu-dropdown');
        if (isNavOpen() && navMenuBtn && navDropdown && !navMenuBtn.contains(e.target) && !navDropdown.contains(e.target)) {
            toggleNavMenu(false);
        }
    });

    // Accordions
    document.getElementById('filter-accordion-toggle')?.addEventListener('click', () => toggleFilterAccordion());
    document.getElementById('matrix-toggle')?.addEventListener('click', () => toggleMatrixAccordion('matrix-wrapper', 'matrix-chevron'));

    // Game Action Buttons
    document.getElementById('check-btn')?.addEventListener('click', checkAnswer);
    document.getElementById('next-btn')?.addEventListener('click', loadNextEquation);
    document.getElementById('share-btn')?.addEventListener('click', shareDailyResult);
    document.getElementById('go-to-practice-btn')?.addEventListener('click', () => window.switchMode('practice'));
    document.getElementById('hint-btn')?.addEventListener('click', triggerHint);
    document.getElementById('reset-score-btn')?.addEventListener('click', () => scoreboard.reset());

    // Custom Solver
    document.getElementById('solve-custom-btn')?.addEventListener('click', solveCustomEquation);
    document.getElementById('play-custom-quiz-btn')?.addEventListener('click', playCustomAsQuiz);
    document.querySelectorAll('.custom-example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('custom-input').value = btn.dataset.expr;
            solveCustomEquation();
        });
    });

    // Modals
    document.getElementById('close-help-modal-btn')?.addEventListener('click', () => toggleModal('help-modal'));
    document.getElementById('modal-confirm-btn')?.addEventListener('click', () => toggleModal('help-modal'));

    // Reaction Filters
    const refresh = () => { if (currentMode === 'practice') loadNextEquation(); };
    [['category-filter-desktop', 'cat'], ['category-filter-mobile', 'cat'],
     ['difficulty-filter-desktop', 'diff'], ['difficulty-filter-mobile', 'diff']].forEach(([id, type]) => {
        document.getElementById(id)?.addEventListener('change', (e) => onFilterChange(e.target.value, type, refresh));
    });
}

function loadNextEquation() {
    practiceEquation = pickPractice(EQUATION_DATABASE, practiceEquation);
    currentEquation = practiceEquation;
    renderEquationCard(practiceEquation);
}

function loadDailyEquation() {
    loadDaily({
        game: 'reactle',
        list: EQUATION_DATABASE,
        accent: 'chemistry',
        render: renderEquationCard,
        showInsight: showInsightCard
    });
}

function renderEquationCard(eq) {
    currentEquation = eq;
    inputsArray = [];
    hintStage = 0;

    // Clean display format for array or string category
    const displayCategory = Array.isArray(eq.category) ? eq.category.join(' / ') : eq.category;
    document.getElementById('badge-category').innerText = displayCategory;
    document.getElementById('badge-difficulty').innerText = eq.difficulty;

    document.getElementById('insight-card').classList.add('hidden');
    document.getElementById('feedback-banner').classList.add('hidden');
    setControls('ready');

    document.getElementById('hint-btn-text').innerText = 'Hint';
    toggleMatrixAccordion('matrix-wrapper', 'matrix-chevron', true);

    const container = document.getElementById('equation-container');
    container.innerHTML = '';

    const boardWrapper = document.createElement('div');
    boardWrapper.className = 'equation-board';

    // Reactants
    eq.reactants.forEach((r, idx) => {
        boardWrapper.appendChild(createMoleculeInputGroup(r, idx, 'reactant'));
        if (idx < eq.reactants.length - 1) {
            const plus = document.createElement('span');
            plus.className = 'equation-plus';
            plus.textContent = '+';
            boardWrapper.appendChild(plus);
        }
    });

    // Arrow
    const arrow = document.createElement('i');
    arrow.className = 'fa-solid fa-arrow-right equation-arrow';
    boardWrapper.appendChild(arrow);

    // Products
    eq.products.forEach((p, idx) => {
        boardWrapper.appendChild(createMoleculeInputGroup(p, idx, 'product'));
        if (idx < eq.products.length - 1) {
            const plus = document.createElement('span');
            plus.className = 'equation-plus';
            plus.textContent = '+';
            boardWrapper.appendChild(plus);
        }
    });

    container.appendChild(boardWrapper);

    if (inputsArray.length > 0) {
        setTimeout(() => inputsArray[0].inputEl.focus(), 50);
    }

    calculateAtomMatrix();
}

function createMoleculeInputGroup(molData, index, type) {
    const wrapper = document.createElement('div');
    wrapper.className = 'term-card';

    const input = document.createElement('input');
    input.type = 'number';
    input.id = `coeff-${type}-${index}`;
    input.name = `coeff-${type}-${index}`;
    input.autocomplete = 'off';
    input.min = '1';
    input.max = '99';
    input.placeholder = '1';
    input.className = 'term-coeff-input';

    input.addEventListener('input', () => {
        playSound('click');
        calculateAtomMatrix();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const idx = inputsArray.findIndex(i => i.inputEl === input);
            if (e.key === 'ArrowRight' && idx < inputsArray.length - 1) inputsArray[idx + 1].inputEl.focus();
            if (e.key === 'ArrowLeft' && idx > 0) inputsArray[idx - 1].inputEl.focus();
        }
    });

    const label = document.createElement('span');
    label.className = 'molecule-formula';
    label.innerHTML = molData.formula;

    wrapper.appendChild(input);
    wrapper.appendChild(label);

    inputsArray.push({
        inputEl: input,
        expectedCoeff: molData.coeff,
        rawFormula: molData.raw || molData.formula.replace(/<[^>]*>/g, '').trim(),
        type: type
    });

    return wrapper;
}

export function calculateAtomMatrix() {
    if (!currentEquation) return;

    const reactantTotals = {};
    const productTotals = {};
    const allElements = new Set();

    inputsArray.forEach(item => {
        const userRaw = item.inputEl.value.trim();
        const coeff = userRaw === '' ? 1 : parseInt(userRaw, 10);

        const cleanFormula = (item.rawFormula || '').replace(/<[^>]*>/g, '').trim();
        const atomCounts = parseFormula(cleanFormula);

        const targetDict = item.type === 'reactant' ? reactantTotals : productTotals;
        for (let elem in atomCounts) {
            allElements.add(elem);
            targetDict[elem] = (targetDict[elem] || 0) + (atomCounts[elem] * coeff);
        }
    });

    const matrixContainer = document.getElementById('atom-count-matrix');
    if (!matrixContainer) return;
    matrixContainer.innerHTML = '';

    let isFullyBalanced = true;

    allElements.forEach(elem => {
        const rCount = reactantTotals[elem] || 0;
        const pCount = productTotals[elem] || 0;
        const isMatch = rCount === pCount && rCount > 0;

        if (!isMatch) isFullyBalanced = false;

        const elementName = PERIODIC_TABLE[elem]?.name || elem;

        const card = document.createElement('div');
        card.className = `atom-matrix-card ${isMatch ? 'is-balanced' : 'is-unbalanced'}`;

        card.addEventListener('mouseenter', (e) => showElementTooltip(e, elem));
        card.addEventListener('mouseleave', () => hideElementTooltip());
        card.addEventListener('touchstart', (e) => showElementTooltip(e, elem), { passive: true });
        card.addEventListener('touchend', () => hideElementTooltip());

        const statusIcon = isMatch ? 'fa-check' : 'fa-xmark';

        card.innerHTML = `
          <div class="species-card-main">
            <span class="species-badge">${elem}</span>
            <span class="species-label">${elementName}</span>
          </div>
          <div class="atom-matrix-counts">
            <span class="atom-count-val">${rCount}</span>
            <span class="atom-count-sep">|</span>
            <span class="atom-count-val">${pCount}</span>
            <i class="fa-solid ${statusIcon} atom-count-icon"></i>
          </div>
        `;

        matrixContainer.appendChild(card);
    });

    const statusBadge = document.getElementById('balance-status');
    if (statusBadge) {
        const showBadge = Storage.getMatrixBadge();
        statusBadge.classList.toggle('hidden', !showBadge);
        if (showBadge) {
            if (isFullyBalanced) {
                statusBadge.innerText = 'Balanced!';
                statusBadge.className = 'status-badge is-balanced';
            } else {
                statusBadge.innerText = 'Unbalanced';
                statusBadge.className = 'status-badge';
            }
        }
    }
}

function checkAnswer() {
    // an empty box counts as 1, matching the "1" placeholder and the atom matrix
    const coeffs = inputsArray.map(item => {
        const v = parseInt(item.inputEl.value, 10);
        return Number.isFinite(v) && v > 0 ? v : 1;
    });
    const result = checkCoefficients(
        inputsArray.map(item => ({ raw: item.rawFormula, type: item.type })),
        coeffs
    );
    // any balanced answer in the smallest whole numbers is correct
    const isCorrect = result.balanced && result.reduced;

    const feedback = document.getElementById('feedback-banner');
    if (!feedback) return;
    feedback.classList.remove('hidden');

    if (isCorrect) {
        playSound('correct');

        if (typeof confetti === 'function') {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        }

        feedback.className = 'feedback-banner is-success';
        feedback.innerHTML = `<i class="fa-solid fa-circle-check feedback-icon" aria-hidden="true"></i> Perfect! Equation is correctly balanced!`;

        finishSolve('reactle', currentMode);
        scoreboard.recordAttempt(true);
        showInsightCard();
    } else {
        playSound(result.balanced ? 'click' : 'wrong');
        scoreboard.recordAttempt(false);

        const icon = document.createElement('i');
        const message = document.createElement('span');
        if (result.balanced) {
            // balanced, but not yet in the smallest whole numbers
            feedback.className = 'feedback-banner is-hint';
            icon.className = 'fa-solid fa-lightbulb feedback-icon is-accent';
            message.textContent = `Balanced! Can you reduce it to the smallest whole numbers? Every coefficient can be divided by ${result.divisor}.`;
        } else {
            feedback.className = 'feedback-banner is-error';
            icon.className = 'fa-solid fa-triangle-exclamation feedback-icon';
            const clues = result.mismatches.slice(0, 2).map(x => (
                x.element === 'charge'
                    ? `charge is ${x.left} on the left and ${x.right} on the right`
                    : `${x.element} is ${x.left} on the left and ${x.right} on the right`
            ));
            message.textContent = `Not quite balanced yet: ${clues.join('; ')}. The atom matrix above shows every element.`;
        }
        feedback.replaceChildren(icon, message);
    }
}

function showInsightCard() {
    const card = document.getElementById('insight-card');
    const text = document.getElementById('insight-text');
    const formula = document.getElementById('insight-formula');

    text.innerText = currentEquation.explanation;

    let fullEqStr = currentEquation.reactants.map(r => `${r.coeff > 1 ? r.coeff : ''}${r.raw}`).join(' + ') +
                    ' → ' +
                    currentEquation.products.map(p => `${p.coeff > 1 ? p.coeff : ''}${p.raw}`).join(' + ');

    formula.innerText = fullEqStr;
    card.classList.remove('hidden');
}

function shareDailyResult() {
    shareDailyResultCommon({
        game: 'reactle',
        title: 'Reactle',
        emoji: '🧪',
        url: 'https://brickeli.github.io/WebApps/Reactle/index.html',
        onCopied: () => {
            const feedback = document.getElementById('feedback-banner');
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.className = 'feedback-banner';
                feedback.innerHTML = `<i class="fa-solid fa-copy feedback-icon is-accent" aria-hidden="true"></i> Daily result copied to clipboard!`;
            }
        }
    });
}

function triggerHint() {
    playSound('click');
    hintStage++;
    const feedback = document.getElementById('feedback-banner');
    if (!feedback) return;

    feedback.className = 'feedback-banner is-hint';

    if (hintStage === 1) {
        toggleMatrixAccordion('matrix-wrapper', 'matrix-chevron', true);
        feedback.innerHTML = `<i class="fa-solid fa-lightbulb feedback-icon is-accent" aria-hidden="true"></i> <strong>Hint 1:</strong> Matrix expanded! Focus on balancing oxygen or hydrogen atoms last!`;
        const hintBtnText = document.getElementById('hint-btn-text');
        if (hintBtnText) hintBtnText.innerText = 'Reveal Coefficient';
    } else if (hintStage >= 2) {
        const unrevealed = inputsArray.find(item => parseInt(item.inputEl.value) !== item.expectedCoeff);
        if (unrevealed) {
            unrevealed.inputEl.value = unrevealed.expectedCoeff;
            unrevealed.inputEl.classList.add('glow-active');
            calculateAtomMatrix();
        }
        feedback.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles feedback-icon is-accent" aria-hidden="true"></i> <strong>Hint 2:</strong> Revealed a missing coefficient in the equation!`;
    }
}

function solveCustomEquation() {
    playSound('click');
    const inputVal = document.getElementById('custom-input').value.trim();
    const resultPanel = document.getElementById('solver-result');

    if (!inputVal) return;

    try {
        const parts = inputVal.split(/->|=/);
        if (parts.length !== 2) throw new Error("Use '->' or '=' to separate reactants from products.");

        const reactantsRaw = parts[0].split('+').map(s => s.trim()).filter(Boolean);
        const productsRaw = parts[1].split('+').map(s => s.trim()).filter(Boolean);

        if (!reactantsRaw.length || !productsRaw.length) throw new Error("Invalid formula components.");

        const solution = computeCoefficients(reactantsRaw, productsRaw);

        if (solution) {
            resultPanel.classList.remove('hidden');

            let balancedStr = solution.reactants.map((r) =>
                `${r.coeff > 1 ? r.coeff : ''}${formatSubscripts(r.raw)}`
            ).join(' + ') +
            ' &rarr; ' +
            solution.products.map((p) =>
                `${p.coeff > 1 ? p.coeff : ''}${formatSubscripts(p.raw)}`
            ).join(' + ');

            document.getElementById('solver-output-eq').innerHTML = balancedStr;

            document.getElementById('solver-coefficients-breakdown').innerHTML =
                `<strong>Coefficients:</strong> [${[...solution.reactants, ...solution.products].map(x => x.coeff).join(', ')}]`;

            window.customQuizData = {
                id: 'custom-' + Date.now(),
                category: 'Custom Reaction',
                difficulty: 'Custom',
                reactants: solution.reactants.map(r => ({ formula: formatSubscripts(r.raw), raw: r.raw, coeff: r.coeff })),
                products: solution.products.map(p => ({ formula: formatSubscripts(p.raw), raw: p.raw, coeff: p.coeff })),
                explanation: 'Custom user generated chemical reaction balanced automatically!'
            };
        } else {
            alert("Could not automatically compute coefficients for this specific equation.");
        }
    } catch(err) {
        alert(err.message);
    }
}

function playCustomAsQuiz() {
    if (window.customQuizData) {
        window.switchMode('practice');
        renderEquationCard(window.customQuizData);
    }
}
