import { EQUATION_DATABASE } from './data/equations.js';
import { PERIODIC_TABLE } from './data/periodicTable.js';
import { Storage } from './utils/storage.js';
import { hashDateString, startDailyCountdownTimer } from './utils/helpers.js';
import { playSound, setAudioEnabled } from './engine/audio.js';
import { parseFormula } from './engine/parser.js';
import { computeCoefficients } from './engine/solver.js';
import { showElementTooltip, hideElementTooltip } from './ui/tooltips.js';

// Application State
let currentMode = 'daily';
let practiceEquation = null;
let dailyEquation = null;
let currentEquation = null;
let inputsArray = [];
let scoreCorrect = 0;
let scoreAttempts = 0;
let streak = 0;
let soundEnabled = true;
let showMatrixBadge = false;
let hintStage = 0;

let isMatrixAccordionOpen = false;
let isFilterAccordionOpen = false;
let isNavMenuOpen = false;

// Expose functions globally for inline HTML event calls
window.showElementTooltip = showElementTooltip;
window.hideElementTooltip = hideElementTooltip;
window.switchMode = switchMode;
window.toggleModal = toggleModal;
window.toggleNavMenu = toggleNavMenu;
window.solveCustomEquation = solveCustomEquation;

/* Bootstrap Application */
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadStats();
    loadMatrixBadgeSetting();
    updateScoreboardDisplay();
    updateSoundIcon();
    setupEventListeners();

    // Set view tabs to match daily mode
    switchMode('daily');
});

function loadStats() {
    const stats = Storage.getStats();
    scoreCorrect = stats.correct;
    scoreAttempts = stats.attempts;
    // Calculate streak exclusively from Daily Challenge completions
    streak = Storage.getDailyStreak();
    soundEnabled = Storage.getSound();
    setAudioEnabled(soundEnabled);
}

function saveStats() {
    Storage.saveStats(scoreCorrect, scoreAttempts, streak);
}

function updateScoreboardDisplay() {
    document.getElementById('score-correct').innerText = scoreCorrect;
    document.getElementById('score-attempts').innerText = scoreAttempts;
    document.getElementById('streak-count').innerText = streak;

    const accuracy = scoreAttempts === 0 ? 0 : Math.round((scoreCorrect / scoreAttempts) * 100);
    document.getElementById('score-accuracy').innerText = `${accuracy}%`;
}

function setupEventListeners() {
    // Mode Selectors
    document.getElementById('nav-practice')?.addEventListener('click', () => switchMode('practice'));
    document.getElementById('nav-daily')?.addEventListener('click', () => switchMode('daily'));
    document.getElementById('nav-solver')?.addEventListener('click', () => switchMode('solver'));
    document.getElementById('mode-dropdown')?.addEventListener('change', (e) => switchMode(e.target.value));

    // Nav Settings Menu
    document.getElementById('nav-menu-btn')?.addEventListener('click', () => toggleNavMenu());
    document.getElementById('toggle-sound-btn')?.addEventListener('click', toggleSound);
    document.getElementById('toggle-theme-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('toggle-matrix-badge-btn')?.addEventListener('click', toggleMatrixBadgeSetting);
    document.getElementById('open-help-modal-btn')?.addEventListener('click', () => {
        toggleModal('help-modal');
        toggleNavMenu(false);
    });

    // Accordions
    document.getElementById('filter-accordion-toggle')?.addEventListener('click', () => toggleFilterAccordion());
    document.getElementById('atom-matrix-toggle')?.addEventListener('click', () => toggleAtomMatrixAccordion());

    // Game Action Buttons
    document.getElementById('check-btn')?.addEventListener('click', checkAnswer);
    document.getElementById('next-btn')?.addEventListener('click', loadNextEquation);
    document.getElementById('share-btn')?.addEventListener('click', shareDailyResult);
    document.getElementById('hint-btn')?.addEventListener('click', triggerHint);
    document.getElementById('reset-score-btn')?.addEventListener('click', resetScoreboard);

    // Custom Solver
    document.getElementById('solve-custom-btn')?.addEventListener('click', solveCustomEquation);
    document.getElementById('play-custom-quiz-btn')?.addEventListener('click', playCustomAsQuiz);
    document.querySelectorAll('.custom-example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('custom-input').value = btn.dataset.expr;
            solveCustomEquation();
        });
    });

    // Modals & Outside Clicks
    document.getElementById('close-help-modal-btn')?.addEventListener('click', () => toggleModal('help-modal'));
    document.getElementById('modal-confirm-btn')?.addEventListener('click', () => toggleModal('help-modal'));

    document.addEventListener('click', (e) => {
        const navMenuBtn = document.getElementById('nav-menu-btn');
        const navDropdown = document.getElementById('nav-menu-dropdown');
        if (isNavMenuOpen && navMenuBtn && navDropdown && !navMenuBtn.contains(e.target) && !navDropdown.contains(e.target)) {
            toggleNavMenu(false);
        }
    });

    // Reaction Filters
    document.getElementById('category-filter-desktop')?.addEventListener('change', (e) => onFilterChange(e.target.value, 'cat'));
    document.getElementById('category-filter-mobile')?.addEventListener('change', (e) => onFilterChange(e.target.value, 'cat'));
    document.getElementById('difficulty-filter-desktop')?.addEventListener('change', (e) => onFilterChange(e.target.value, 'diff'));
    document.getElementById('difficulty-filter-mobile')?.addEventListener('change', (e) => onFilterChange(e.target.value, 'diff'));
}

/* --- Game View Management --- */
function switchMode(mode) {
    playSound('click');
    currentMode = mode;

    const gameView = document.getElementById('game-view');
    const solverView = document.getElementById('solver-view');
    const dailyTag = document.getElementById('daily-header-tag');

    const dropdown = document.getElementById('mode-dropdown');
    if (dropdown) dropdown.value = mode;

    const tabs = {
        practice: document.getElementById('nav-practice'),
        daily: document.getElementById('nav-daily'),
        solver: document.getElementById('nav-solver')
    };

    const activeClasses = ['bg-white', 'dark:bg-slate-700', 'text-chemistry-700', 'dark:text-chemistry-300', 'shadow-sm'];
    const inactiveClasses = ['text-slate-600', 'dark:text-slate-400', 'hover:text-slate-900', 'dark:hover:text-slate-200'];

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
        gameView.classList.add('hidden');
        solverView.classList.remove('hidden');
    } else {
        gameView.classList.remove('hidden');
        solverView.classList.add('hidden');

        if (mode === 'daily') {
            dailyTag.classList.remove('hidden');
            loadDailyEquation();
        } else if (mode === 'practice') {
            dailyTag.classList.add('hidden');
            if (!practiceEquation) {
                loadNextEquation();
            } else {
                currentEquation = practiceEquation;
                renderEquationCard(practiceEquation);
            }
        }
    }
}

function loadNextEquation() {
    const cat = document.getElementById('category-filter-desktop').value;
    const diff = document.getElementById('difficulty-filter-desktop').value;

    let filtered = EQUATION_DATABASE.filter(eq => {
        const catMatch = (cat === 'ALL' || eq.category === cat);
        const diffMatch = (diff === 'ALL' || eq.difficulty === diff);
        return catMatch && diffMatch;
    });

    if (filtered.length === 0) filtered = EQUATION_DATABASE;

    let nextEq;
    do {
        nextEq = filtered[Math.floor(Math.random() * filtered.length)];
    } while (nextEq === practiceEquation && filtered.length > 1);

    practiceEquation = nextEq;
    currentEquation = practiceEquation;

    renderEquationCard(practiceEquation);
}

function loadDailyEquation() {
    const todayStr = new Date().toISOString().split('T')[0];
    const hash = hashDateString(todayStr);
    const index = hash % EQUATION_DATABASE.length;

    dailyEquation = EQUATION_DATABASE[index];
    currentEquation = dailyEquation;

    renderEquationCard(dailyEquation);

    const history = Storage.getDailyHistory();
    const todayRecord = history[todayStr];
    const dailyTag = document.getElementById('daily-header-tag');
    const checkBtn = document.getElementById('check-btn');
    const shareBtn = document.getElementById('share-btn');

    if (todayRecord && todayRecord.completed) {
        checkBtn.classList.add('hidden');
        if (shareBtn) shareBtn.classList.remove('hidden');
        showInsightCard();
        startDailyCountdownTimer(dailyTag);
    } else {
        dailyTag.innerHTML = `<i class="fa-solid fa-calendar text-chemistry-500 mr-1"></i> Today's Daily Reaction`;
        checkBtn.classList.remove('hidden');
        if (shareBtn) shareBtn.classList.add('hidden');
    }
}

function renderEquationCard(eq) {
    currentEquation = eq;
    inputsArray = [];
    hintStage = 0;

    document.getElementById('badge-category').innerText = eq.category;
    document.getElementById('badge-difficulty').innerText = eq.difficulty;
    document.getElementById('insight-card').classList.add('hidden');
    document.getElementById('feedback-banner').classList.add('hidden');
    document.getElementById('check-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');

    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.classList.add('hidden');

    document.getElementById('hint-btn-text').innerText = 'Hint';
    toggleAtomMatrixAccordion(false);

    const container = document.getElementById('equation-container');
    container.innerHTML = '';

    // Reactants
    const reactantsGroup = document.createElement('div');
    reactantsGroup.className = 'flex items-center flex-wrap justify-center gap-2 sm:gap-3';
    eq.reactants.forEach((r, idx) => {
        reactantsGroup.appendChild(createMoleculeInputGroup(r, idx, 'reactant'));
        if (idx < eq.reactants.length - 1) {
            const plus = document.createElement('span');
            plus.className = 'text-slate-400 font-bold mx-1';
            plus.textContent = '+';
            reactantsGroup.appendChild(plus);
        }
    });

    // Arrow
    const arrow = document.createElement('div');
    arrow.className = 'text-chemistry-500 dark:text-chemistry-400 font-bold mx-2 text-2xl sm:text-3xl';
    arrow.innerHTML = '&rarr;';

    // Products
    const productsGroup = document.createElement('div');
    productsGroup.className = 'flex items-center flex-wrap justify-center gap-2 sm:gap-3';
    eq.products.forEach((p, idx) => {
        productsGroup.appendChild(createMoleculeInputGroup(p, idx, 'product'));
        if (idx < eq.products.length - 1) {
            const plus = document.createElement('span');
            plus.className = 'text-slate-400 font-bold mx-1';
            plus.textContent = '+';
            productsGroup.appendChild(plus);
        }
    });

    container.appendChild(reactantsGroup);
    container.appendChild(arrow);
    container.appendChild(productsGroup);

    if (inputsArray.length > 0) {
        setTimeout(() => inputsArray[0].inputEl.focus(), 50);
    }

    calculateAtomMatrix();
}

function createMoleculeInputGroup(molData, index, type) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 p-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '99';
    input.placeholder = '1';
    input.className = 'w-12 h-10 sm:w-14 sm:h-11 text-center text-lg sm:text-xl font-bold font-mono bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:border-chemistry-500 focus:ring-2 focus:ring-chemistry-500/20 outline-none transition-all';

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
    label.className = 'font-semibold text-slate-800 dark:text-slate-100 text-lg sm:text-xl font-mono';
    label.innerHTML = molData.formula;

    wrapper.appendChild(input);
    wrapper.appendChild(label);

    inputsArray.push({
        inputEl: input,
        expectedCoeff: molData.coeff,
        rawFormula: molData.raw,
        type: type
    });

    return wrapper;
}

function calculateAtomMatrix() {
    if (!currentEquation) return;

    const reactantTotals = {};
    const productTotals = {};
    const allElements = new Set();

    inputsArray.forEach(item => {
        const coeff = parseInt(item.inputEl.value) || 1;
        const atomCounts = parseFormula(item.rawFormula);

        const targetDict = item.type === 'reactant' ? reactantTotals : productTotals;
        for (let elem in atomCounts) {
            allElements.add(elem);
            targetDict[elem] = (targetDict[elem] || 0) + (atomCounts[elem] * coeff);
        }
    });

    const matrixContainer = document.getElementById('atom-count-matrix');
    matrixContainer.innerHTML = '';

    let isFullyBalanced = true;

    allElements.forEach(elem => {
        const rCount = reactantTotals[elem] || 0;
        const pCount = productTotals[elem] || 0;
        const isMatch = rCount === pCount;

        if (!isMatch) isFullyBalanced = false;

        const card = document.createElement('div');
        card.className = `p-2.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium transition-all ${
            isMatch
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
        }`;

        card.innerHTML = `
            <div class="flex items-center gap-1.5 font-bold cursor-help"
                 onmouseenter="showElementTooltip(event, '${elem}')"
                 onmouseleave="hideElementTooltip()"
                 ontouchstart="showElementTooltip(event, '${elem}')"
                 ontouchend="hideElementTooltip()">
                <span class="w-6 h-6 rounded-md bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-mono text-xs border border-slate-200 dark:border-slate-700">
                    ${elem}
                </span>
                <span>${elem}</span>
            </div>
            <div class="font-mono font-bold">
                ${rCount} <span class="text-slate-400 font-normal">|</span> ${pCount}
                <i class="fa-solid ${isMatch ? 'fa-check text-emerald-500' : 'fa-xmark text-rose-500'} ml-1"></i>
            </div>
        `;

        matrixContainer.appendChild(card);
    });

    const statusBadge = document.getElementById('balance-status');
    if (statusBadge) {
        if (isFullyBalanced) {
            statusBadge.innerText = 'Balanced!';
            statusBadge.className = `text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ${showMatrixBadge ? '' : 'hidden'}`;
        } else {
            statusBadge.innerText = 'Unbalanced';
            statusBadge.className = `text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ${showMatrixBadge ? '' : 'hidden'}`;
        }
    }
}

function checkAnswer() {
    scoreAttempts++;
    let isCorrect = true;

    inputsArray.forEach(item => {
        const userVal = parseInt(item.inputEl.value) || 1;
        if (userVal !== item.expectedCoeff) {
            isCorrect = false;
        }
    });

    const feedback = document.getElementById('feedback-banner');
    feedback.classList.remove('hidden');

    if (isCorrect) {
        playSound('correct');
        scoreCorrect++;

        if (typeof confetti === 'function') {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        }

        feedback.className = 'mt-6 p-4 rounded-xl text-center font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 animate-bounce';
        feedback.innerHTML = `<i class="fa-solid fa-circle-check mr-2"></i> Perfect! Equation is correctly balanced!`;

        document.getElementById('check-btn').classList.add('hidden');

        if (currentMode === 'daily') {
            const todayStr = new Date().toISOString().split('T')[0];
            const history = Storage.getDailyHistory();

            history[todayStr] = { completed: true, timestamp: new Date().toISOString() };
            Storage.setDailyHistory(history);

            document.getElementById('next-btn').classList.add('hidden');
            const shareBtn = document.getElementById('share-btn');
            if (shareBtn) shareBtn.classList.remove('hidden');

            const dailyTag = document.getElementById('daily-header-tag');
            startDailyCountdownTimer(dailyTag);
        } else {
            document.getElementById('next-btn').classList.remove('hidden');
            const shareBtn = document.getElementById('share-btn');
            if (shareBtn) shareBtn.classList.add('hidden');
        }
        saveStats();
        updateScoreboardDisplay();
        showInsightCard();
    } else {
        playSound('wrong');
        saveStats();
        updateScoreboardDisplay();

        feedback.className = 'mt-6 p-4 rounded-xl text-center font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/20 border border-rose-500/30';
        feedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i> Not quite balanced yet. Check atom counts in the matrix table above!`;
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
    playSound('click');

    // Always fetch the verified daily streak from storage
    const currentStreak = Storage.getDailyStreak();

    // Calculate the Daily Challenge number relative to your start date
    const launchDate = new Date('2026-01-01');
    const today = new Date();
    const dayNum = Math.floor((today - launchDate) / (1000 * 60 * 60 * 24)) + 1;

    const shareText = `Reactle Daily #${dayNum} 🧪\n` +
                      `Streak: ${currentStreak} 🔥 | Solved in Daily Challenge Mode!\n` +
                      `https://brickeli.github.io/WebApps/Reactle/index.html`;

    if (navigator.share) {
        navigator.share({ title: 'Reactle Daily Challenge', text: shareText }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            const feedback = document.getElementById('feedback-banner');
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.className = 'mt-6 p-3 rounded-xl text-center font-bold text-chemistry-700 dark:text-chemistry-300 bg-chemistry-500/20 border border-chemistry-500/30';
                feedback.innerHTML = `<i class="fa-solid fa-copy mr-2"></i> Daily result copied to clipboard!`;
            }
        });
    }
}

function triggerHint() {
    playSound('click');
    hintStage++;
    const feedback = document.getElementById('feedback-banner');
    feedback.classList.remove('hidden');

    if (hintStage === 1) {
        toggleAtomMatrixAccordion(true);
        feedback.className = 'mt-6 p-4 rounded-xl text-center font-medium text-amber-800 dark:text-amber-200 bg-amber-500/20 border border-amber-500/30';
        feedback.innerHTML = `<i class="fa-solid fa-lightbulb text-amber-500 mr-2"></i> <strong>Hint 1:</strong> Matrix expanded! Focus on balancing oxygen or hydrogen atoms last!`;
        document.getElementById('hint-btn-text').innerText = 'Reveal Coefficient';
    } else if (hintStage >= 2) {
        const unrevealed = inputsArray.find(item => parseInt(item.inputEl.value) !== item.expectedCoeff);
        if (unrevealed) {
            unrevealed.inputEl.value = unrevealed.expectedCoeff;
            unrevealed.inputEl.classList.add('glow-active');
            calculateAtomMatrix();
        }
        feedback.className = 'mt-6 p-4 rounded-xl text-center font-medium text-amber-800 dark:text-amber-200 bg-amber-500/20 border border-amber-500/30';
        feedback.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-amber-500 mr-2"></i> <strong>Hint 2:</strong> Revealed a missing coefficient in the equation!`;
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

            let balancedStr = solution.reactants.map((r) => `${r.coeff > 1 ? r.coeff : ''}${r.raw}`).join(' + ') +
                              ' &rarr; ' +
                              solution.products.map((p) => `${p.coeff > 1 ? p.coeff : ''}${p.raw}`).join(' + ');

            document.getElementById('solver-output-eq').innerHTML = balancedStr;
            document.getElementById('solver-coefficients-breakdown').innerHTML =
                `<strong>Coefficients:</strong> [${[...solution.reactants, ...solution.products].map(x => x.coeff).join(', ')}]`;

            window.customQuizData = {
                id: 'custom-' + Date.now(),
                category: 'Custom Reaction',
                difficulty: 'Custom',
                reactants: solution.reactants.map(r => ({ formula: r.raw, raw: r.raw, coeff: r.coeff })),
                products: solution.products.map(p => ({ formula: p.raw, raw: p.raw, coeff: p.coeff })),
                explanation: 'Custom user generated chemical reaction balanced automatically!'
            };
        } else {
            alert("Could not automatically compute coefficients for this specific equation.");
        }
    } catch(err) {
        alert("Error parsing reaction: " + err.message);
    }
}

function playCustomAsQuiz() {
    if (window.customQuizData) {
        switchMode('practice');
        renderEquationCard(window.customQuizData);
    }
}

/* --- Settings & UI Helpers --- */
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    Storage.setTheme(isDark ? 'dark' : 'light');
    updateThemeUI(isDark);
}

function initTheme() {
    const savedTheme = Storage.getTheme();
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeUI(isDark);
}

function updateThemeUI(isDark) {
    const themeLabel = document.getElementById('theme-status-label');
    const themeIcon = document.getElementById('theme-icon');
    if (isDark) {
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun w-4 text-amber-400';
        if (themeLabel) themeLabel.innerText = 'DARK';
    } else {
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon w-4 text-chemistry-500';
        if (themeLabel) themeLabel.innerText = 'LIGHT';
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    Storage.setSound(soundEnabled);
    setAudioEnabled(soundEnabled);
    updateSoundIcon();
}

function updateSoundIcon() {
    const soundIcon = document.getElementById('sound-icon');
    const soundLabel = document.getElementById('sound-status-label');

    if (soundEnabled) {
        if (soundIcon) soundIcon.className = 'fa-solid fa-volume-high w-4 text-chemistry-500';
        if (soundLabel) {
            soundLabel.innerText = 'ON';
            soundLabel.className = 'text-xs font-mono font-bold text-chemistry-600 dark:text-chemistry-400';
        }
    } else {
        if (soundIcon) soundIcon.className = 'fa-solid fa-volume-xmark w-4 text-slate-400';
        if (soundLabel) {
            soundLabel.innerText = 'OFF';
            soundLabel.className = 'text-xs font-mono font-bold text-rose-500';
        }
    }
}

function loadMatrixBadgeSetting() {
    showMatrixBadge = Storage.getMatrixBadge();
    updateMatrixBadgeUI();
}

function toggleMatrixBadgeSetting() {
    playSound('click');
    showMatrixBadge = !showMatrixBadge;
    Storage.setMatrixBadge(showMatrixBadge);
    updateMatrixBadgeUI();
    calculateAtomMatrix();
}

function updateMatrixBadgeUI() {
    const statusBadge = document.getElementById('balance-status');
    const labelEl = document.getElementById('matrix-badge-status-label');
    const iconEl = document.getElementById('matrix-badge-icon');

    if (showMatrixBadge) {
        if (statusBadge) statusBadge.classList.remove('hidden');
        if (labelEl) {
            labelEl.innerText = 'ON';
            labelEl.className = 'text-xs font-mono font-bold text-chemistry-600 dark:text-chemistry-400';
        }
        if (iconEl) iconEl.className = 'fa-solid fa-scale-balanced w-4 text-chemistry-500';
    } else {
        if (statusBadge) statusBadge.classList.add('hidden');
        if (labelEl) {
            labelEl.innerText = 'OFF';
            labelEl.className = 'text-xs font-mono font-bold text-rose-500';
        }
        if (iconEl) iconEl.className = 'fa-solid fa-scale-balanced w-4 text-slate-400';
    }
}

function toggleNavMenu(forceState) {
    playSound('click');
    const dropdown = document.getElementById('nav-menu-dropdown');
    const chevron = document.getElementById('nav-menu-chevron');

    isNavMenuOpen = typeof forceState === 'boolean' ? forceState : !isNavMenuOpen;

    if (isNavMenuOpen) {
        dropdown?.classList.remove('hidden');
        chevron?.classList.add('rotate-180');
    } else {
        dropdown?.classList.add('hidden');
        chevron?.classList.remove('rotate-180');
    }
}

function toggleFilterAccordion(forceState) {
    playSound('click');
    const wrapper = document.getElementById('filter-accordion-wrapper');
    const chevron = document.getElementById('filter-accordion-chevron');

    isFilterAccordionOpen = typeof forceState === 'boolean' ? forceState : !isFilterAccordionOpen;

    if (isFilterAccordionOpen) {
        wrapper?.classList.remove('max-h-0', 'opacity-0');
        wrapper?.classList.add('max-h-[300px]', 'opacity-100');
        chevron?.classList.add('rotate-180');
    } else {
        wrapper?.classList.remove('max-h-[300px]', 'opacity-100');
        wrapper?.classList.add('max-h-0', 'opacity-0');
        chevron?.classList.remove('rotate-180');
    }
}

function toggleAtomMatrixAccordion(forceState) {
    playSound('click');
    const wrapper = document.getElementById('atom-matrix-wrapper');
    const chevron = document.getElementById('atom-matrix-chevron');

    isMatrixAccordionOpen = typeof forceState === 'boolean' ? forceState : !isMatrixAccordionOpen;

    if (isMatrixAccordionOpen) {
        wrapper?.classList.remove('max-h-0', 'opacity-0');
        wrapper?.classList.add('max-h-[500px]', 'opacity-100');
        chevron?.classList.add('rotate-180');
    } else {
        wrapper?.classList.remove('max-h-[500px]', 'opacity-100');
        wrapper?.classList.add('max-h-0', 'opacity-0');
        chevron?.classList.remove('rotate-180');
    }
}

function onFilterChange(value, type) {
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

    const catLabel = catDesk?.value === 'ALL' ? 'All Categories' : catDesk?.value;
    const diffLabel = diffDesk?.value === 'ALL' ? '' : ` • ${diffDesk?.value}`;
    const summaryEl = document.getElementById('filter-active-summary');
    if (summaryEl) summaryEl.innerText = `(${catLabel}${diffLabel})`;

    if (currentMode === 'practice') loadNextEquation();
}

function resetScoreboard() {
    playSound('click');
    scoreCorrect = 0;
    scoreAttempts = 0;
    streak = 0;
    saveStats();
    updateScoreboardDisplay();
}

function toggleModal(modalId) {
    playSound('click');
    document.getElementById(modalId)?.classList.toggle('hidden');
}
