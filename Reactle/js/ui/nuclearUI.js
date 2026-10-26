// --- Nuclear UI Helpers ---
import { showElementTooltip, hideElementTooltip } from './tooltips.js';

/**
 * Creates an interactive species card for particles and isotopes in the reaction matrix.
 * @param {string} symbol - Chemical element or particle symbol (e.g., "U", "Ba", "n", "e")
 * @returns {HTMLElement} Formatted DOM card element with tooltip listeners
 */
function createSpeciesCard(symbol) {
    const card = document.createElement('div');
    card.className = 'p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/80 hover:border-amber-500/40 transition-all cursor-help select-none flex items-center justify-between text-xs sm:text-sm font-medium group';

    card.innerHTML = `
        <div class="flex items-center gap-2 font-bold w-full justify-between">
            <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-mono text-xs border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 group-hover:border-amber-500/50 group-hover:text-amber-500 transition-colors">
                    ${symbol}
                </span>
                <span class="text-slate-700 dark:text-slate-200 group-hover:text-amber-500 transition-colors">${symbol}</span>
            </div>
            <i class="fa-solid fa-circle-info text-slate-400 dark:text-slate-600 group-hover:text-amber-500 text-xs transition-colors"></i>
        </div>
    `;

    card.addEventListener('mouseenter', (e) => showElementTooltip(e, symbol));
    card.addEventListener('mouseleave', () => hideElementTooltip());
    card.addEventListener('touchstart', (e) => showElementTooltip(e, symbol), { passive: true });
    card.addEventListener('touchend', () => hideElementTooltip());

    return card;
}

/**
 * Renders the nuclear conservation matrix displaying total mass numbers (A) and atomic charges (Z)
 * @param {string} containerId - DOM ID of the container element
 * @param {Object} parsedEquation - Parsed equation object containing reactants and products arrays
 * @param {Array<number>} userCoefficients - Array of active user-entered coefficients
 * @param {boolean} showMatrixBadge - Toggle state for the balance badge in header
 */
 export function renderNuclearMatrix(containerId, parsedEquation, userCoefficients, showMatrixBadge) {
     if (!parsedEquation) return;

     const offset = parsedEquation.reactants.length;
     const allSpecies = new Set();
     let reactA = 0, reactZ = 0, prodA = 0, prodZ = 0;

     // 1. Calculate Mass (A) and Charge (Z) totals
     parsedEquation.reactants.forEach((term, idx) => {
         const coeff = userCoefficients[idx] || 1;
         reactA += (term.mass || 0) * coeff;
         reactZ += (term.charge !== undefined ? term.charge : 0) * coeff;
         if (term.symbol) allSpecies.add(term.symbol);
     });

     parsedEquation.products.forEach((term, idx) => {
         const coeff = userCoefficients[offset + idx] || 1;
         prodA += (term.mass || 0) * coeff;
         prodZ += (term.charge !== undefined ? term.charge : 0) * coeff;
         if (term.symbol) allSpecies.add(term.symbol);
     });

     const isMassBalanced = reactA === prodA;
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
         chargeReactants.textContent = reactZ;
         chargeReactants.className = `text-xl sm:text-2xl font-black ${isChargeBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;
     }
     if (chargeProducts) {
         chargeProducts.textContent = prodZ;
         chargeProducts.className = `text-xl sm:text-2xl font-black ${isChargeBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;
     }

     // 4. Update Species Grid
     const speciesGrid = document.getElementById('species-cards-grid');
     if (speciesGrid) {
         speciesGrid.innerHTML = '';
         allSpecies.forEach(symbol => speciesGrid.appendChild(createSpeciesCard(symbol)));
     }

     // 5. Update Status Badge in Header
     const statusBadge = document.getElementById('balance-status');
     if (statusBadge) {
         statusBadge.innerText = isFullyBalanced ? 'Balanced!' : 'Unbalanced';
         statusBadge.className = `text-xs font-semibold px-2.5 py-0.5 rounded-full ${
             isFullyBalanced
                 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                 : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
         } ${showMatrixBadge ? '' : 'hidden'}`;
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

    if (netCharge !== null && netCharge !== 0) {
        const sign = netCharge > 0 ? '+' : '-';
        const absVal = Math.abs(netCharge);
        const displayVal = absVal === 1 ? sign : `${absVal}${sign}`;
        netChargeHTML = `<sup class="text-[10px] sm:text-xs font-bold text-amber-500 ml-0.5">${displayVal}</sup>`;
    }

    return `
        <span class="inline-flex items-center font-mono leading-none">
            <span class="inline-flex flex-col text-[10px] sm:text-xs text-right mr-1 leading-tight text-slate-500 dark:text-slate-400 font-bold">
                <span>${mass ?? '?'}</span>
                <span>${charge ?? '?'}</span>
            </span>
            <span class="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100">${symbol}</span>
            ${netChargeHTML}
        </span>
    `;
}
