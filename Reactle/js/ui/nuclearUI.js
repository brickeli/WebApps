// --- Nuclear UI Helpers ---
import { showElementTooltip, hideElementTooltip } from './components.js';
import { PERIODIC_TABLE, NUCLEAR_PARTICLES } from '../data/periodicTable.js';
import { extractSymbol as extractSymbolHelper } from '../utils/helpers.js';

/**
 * Safely extracts a clean element/particle symbol across all nuclear term types
 * @param {Object} term - Reaction term
 * @returns {string|null} Normalized symbol string
 */
function extractSymbol(term) {
    if (!term) return null;

    // First try the imported helper from utils/helpers.js
    if (typeof extractSymbolHelper === 'function') {
        const helperResult = extractSymbolHelper(term);
        if (helperResult) return helperResult;
    }

    // Direct fallback logic
    let rawSym = term.isSelectable
        ? term.selectedParticle?.symbol
        : (term.symbol || term.element || term.rawStr);

    if (!rawSym) return null;

    if (NUCLEAR_PARTICLES[rawSym] || PERIODIC_TABLE[rawSym]) {
        return rawSym;
    }

    const cleaned = rawSym.replace(/[^a-zA-Z]/g, '');
    if (!cleaned) return null;

    const formatted = cleaned.length === 1
        ? cleaned.toUpperCase()
        : cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();

    return PERIODIC_TABLE[formatted] || NUCLEAR_PARTICLES[formatted] ? formatted : rawSym;
}

/**
 * Creates an interactive species card for particles and isotopes in the reaction matrix.
 * @param {string} symbol - Chemical element or particle symbol (e.g., "U", "Ba", "n", "e")
 * @returns {HTMLElement} Formatted DOM card element with tooltip listeners
 */
 function createSpeciesCard(symbol) {
     const card = document.createElement('div');
     card.className = 'p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/80 hover:border-amber-500/40 transition-all cursor-help select-none flex items-center justify-between text-xs sm:text-sm font-medium group';

     if (symbol === '?') {
         card.innerHTML = `
             <div class="flex items-center gap-2 text-xs w-full justify-between opacity-70">
                 <div class="flex items-center gap-2 min-w-0">
                     <span class="w-6 h-6 shrink-0 rounded-md bg-amber-500/10 border border-dashed border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-500">
                         ?
                     </span>
                     <span class="text-slate-600 dark:text-slate-400 italic truncate">
                         Select Particle
                     </span>
                 </div>
             </div>
         `;
         return card;
     }

     const itemData = PERIODIC_TABLE[symbol] || NUCLEAR_PARTICLES[symbol];
     const fullName = itemData ? itemData.name : symbol;

     card.innerHTML = `
         <div class="flex items-center gap-2 text-xs w-full justify-between">
             <div class="flex items-center gap-2 min-w-0">
                 <span class="w-6 h-6 shrink-0 rounded-md bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-mono border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 group-hover:border-amber-500/50 group-hover:text-amber-500 transition-colors">
                     ${symbol}
                 </span>
                 <span class="text-slate-700 font-medium dark:text-slate-200 group-hover:text-amber-500 transition-colors truncate">
                     ${fullName}
                 </span>
             </div>
             <i class="fa-solid fa-circle-info text-slate-400 dark:text-slate-600 group-hover:text-amber-500 text-xs transition-colors shrink-0 ml-1"></i>
         </div>
     `;

     card.addEventListener('mouseenter', (e) => showElementTooltip(e, symbol));
     card.addEventListener('mouseleave', () => hideElementTooltip());
     card.addEventListener('touchstart', (e) => showElementTooltip(e, symbol), { passive: true });
     card.addEventListener('touchend', () => hideElementTooltip());

     return card;
 }

/**
 * Safely evaluates Mass (A) and Charge (Z) for fixed terms or user-selected particle slots
 * @param {Object} term - Reaction term
 * @param {number|string} coeffVal - User entered coefficient
 * @returns {{massVal: number, chargeVal: number}}
 */
function getTermValues(term, coeffVal) {
    const coeff = parseInt(coeffVal, 10) || 1;
    let mass = 0;
    let charge = 0;

    if (term.isSelectable) {
        // Handle selectable particle dropdowns
        const particle = term.selectedParticle || {};
        mass = parseInt(particle.mass || particle.A || 0, 10);
        charge = parseInt(particle.charge || particle.Z || 0, 10);
    } else {
        // Handle standard isotopes/particles
        mass = parseInt(term.mass || term.A || 0, 10);
        charge = parseInt(term.charge || term.Z || 0, 10);
    }

    return {
        massVal: mass * coeff,
        chargeVal: charge * coeff
    };
}

/**
 * Renders the nuclear conservation matrix displaying total mass numbers (A) and atomic charges (Z)
 * @param {Object} parsedEquation - Parsed equation object containing reactants and products arrays
 * @param {Array<number>} userCoefficients - Array of active user-entered coefficients
 * @param {boolean} showMatrixBadge - Toggle state for the balance badge in header
 */
export function renderNuclearMatrix(parsedEquation, userCoefficients = [], showMatrixBadge = true) {
    if (!parsedEquation) return;

    const offset = parsedEquation.reactants ? parsedEquation.reactants.length : 0;
    const allSpecies = new Set();
    let reactA = 0, reactZ = 0, prodA = 0, prodZ = 0;

    // 1. Calculate Mass (A) and Charge (Z) totals safely & extract normalized species symbols
    if (Array.isArray(parsedEquation.reactants)) {
        parsedEquation.reactants.forEach((term, idx) => {
            try {
                const { massVal, chargeVal } = getTermValues(term, userCoefficients[idx]);
                reactA += massVal || 0;
                reactZ += chargeVal || 0;

                const sym = extractSymbol(term);
                if (sym) allSpecies.add(sym);
            } catch (err) {
                console.warn('Error parsing reactant term:', term, err);
            }
        });
    }

    if (Array.isArray(parsedEquation.products)) {
        parsedEquation.products.forEach((term, idx) => {
            try {
                const { massVal, chargeVal } = getTermValues(term, userCoefficients[offset + idx]);
                prodA += massVal || 0;
                prodZ += chargeVal || 0;

                const sym = extractSymbol(term);
                if (sym) allSpecies.add(sym);
            } catch (err) {
                console.warn('Error parsing product term:', term, err);
            }
        });
    }

    const isMassBalanced = (reactA === prodA) && (reactA > 0);
    const isChargeBalanced = reactZ === prodZ;
    const isFullyBalanced = isMassBalanced && isChargeBalanced;

    // 2. Update Mass (A) Card DOM
    const massCard = document.getElementById('mass-card');
    const massIcon = document.getElementById('mass-icon');
    const massReactants = document.getElementById('mass-reactants');
    const massProducts = document.getElementById('mass-products');

    if (massCard) {
        massCard.className = `p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/50 border transition-all duration-200 ${
            isMassBalanced
                ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                : 'border-rose-500/40 dark:border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.08)]'
        }`;
    }
    if (massIcon) {
        massIcon.className = `fa-solid ${isMassBalanced ? 'fa-circle-check text-emerald-500' : 'fa-scale-balanced text-rose-500'} text-xs`;
    }
    if (massReactants) {
        massReactants.textContent = reactA;
        massReactants.className = `text-xl sm:text-2xl font-black ${isMassBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;
    }
    if (massProducts) {
        massProducts.textContent = prodA;
        massProducts.className = `text-xl sm:text-2xl font-black ${isMassBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;
    }

    // 3. Update Atomic Charge (Z) Card DOM
    const chargeCard = document.getElementById('charge-card');
    const chargeIcon = document.getElementById('charge-icon');
    const chargeReactants = document.getElementById('charge-reactants');
    const chargeProducts = document.getElementById('charge-products');

    if (chargeCard) {
        chargeCard.className = `p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/50 border transition-all duration-200 ${
            isChargeBalanced
                ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                : 'border-rose-500/40 dark:border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.08)]'
        }`;
    }
    if (chargeIcon) {
        chargeIcon.className = `fa-solid ${isChargeBalanced ? 'fa-circle-check text-emerald-500' : 'fa-scale-balanced text-rose-500'} text-xs`;
    }
    if (chargeReactants) {
        chargeReactants.textContent = reactZ > 0 ? `+${reactZ}` : reactZ;
        chargeReactants.className = `text-xl sm:text-2xl font-black ${isChargeBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;
    }
    if (chargeProducts) {
        chargeProducts.textContent = prodZ > 0 ? `+${prodZ}` : prodZ;
        chargeProducts.className = `text-xl sm:text-2xl font-black ${isChargeBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;
    }

    // 4. Update Header Status Badge
    const statusBadge = document.getElementById('balance-status');
    if (statusBadge) {
        statusBadge.innerText = isFullyBalanced ? 'Balanced!' : 'Unbalanced';
        statusBadge.className = `text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            isFullyBalanced
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
        } ${showMatrixBadge ? '' : 'hidden'}`;
    }

    // 5. Update Species Grid
    const speciesGrid = document.getElementById('species-cards-grid');
    if (speciesGrid) {
        speciesGrid.innerHTML = '';
        allSpecies.forEach(symbol => {
            const card = createSpeciesCard(symbol);
            if (card) {
                speciesGrid.appendChild(card);
            }
        });
    }
}

/**
 * Formats isotope notation with stacked mass (A) and charge (Z), plus optional net ionic charge badge.
 * @param {string} symbol - Chemical element or particle symbol
 * @param {number|string} mass - Mass number A
 * @param {number|string} charge - Atomic number Z
 * @param {number|null} netCharge - Net charge value
 * @returns {string} Formatted HTML string
 */
export function formatIsotopeHTML(symbol, mass, charge, netCharge = null) {
    let netChargeHTML = '';

    if (netCharge !== null && netCharge !== undefined && netCharge !== 0 && netCharge !== charge) {
        const sign = netCharge > 0 ? '+' : '-';
        const absVal = Math.abs(netCharge);
        const displayVal = absVal === 1 ? sign : `${absVal}${sign}`;
        netChargeHTML = `<sup class="text-[10px] sm:text-xs font-bold text-amber-500 ml-0.5">${displayVal}</sup>`;
    }

    return `
        <span class="inline-flex items-center font-mono leading-none">
            <span class="inline-flex flex-col text-[10px] sm:text-xs text-right mr-1 leading-tight text-slate-500 dark:text-slate-300 font-bold">
                <span>${mass ?? '?'}</span>
                <span>${charge ?? '?'}</span>
            </span>
            <span class="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100">${symbol}</span>
            ${netChargeHTML}
        </span>
    `;
}
