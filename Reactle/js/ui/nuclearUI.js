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
     card.className = 'species-card';

     if (symbol === '?') {
         card.classList.add('is-placeholder');
         card.innerHTML = `
             <div class="species-card-inner">
                 <div class="species-card-main">
                     <span class="species-badge is-placeholder">?</span>
                     <span class="species-label is-placeholder">Select Particle</span>
                 </div>
             </div>
         `;
         return card;
     }

     const itemData = PERIODIC_TABLE[symbol] || NUCLEAR_PARTICLES[symbol];
     const fullName = itemData ? itemData.name : symbol;

     card.innerHTML = `
         <div class="species-card-inner">
             <div class="species-card-main">
                 <span class="species-badge">${symbol}</span>
                 <span class="species-label">${fullName}</span>
             </div>
             <i class="fa-solid fa-circle-info species-info-icon"></i>
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
        massCard.className = `conservation-card ${isMassBalanced ? 'is-balanced' : 'is-unbalanced'}`;
    }
    if (massIcon) {
        massIcon.className = `conservation-icon fa-solid ${isMassBalanced ? 'fa-circle-check' : 'fa-scale-balanced'}`;
    }
    if (massReactants) massReactants.textContent = reactA;
    if (massProducts) massProducts.textContent = prodA;

    // 3. Update Atomic Charge (Z) Card DOM
    const chargeCard = document.getElementById('charge-card');
    const chargeIcon = document.getElementById('charge-icon');
    const chargeReactants = document.getElementById('charge-reactants');
    const chargeProducts = document.getElementById('charge-products');

    if (chargeCard) {
        chargeCard.className = `conservation-card ${isChargeBalanced ? 'is-balanced' : 'is-unbalanced'}`;
    }
    if (chargeIcon) {
        chargeIcon.className = `conservation-icon fa-solid ${isChargeBalanced ? 'fa-circle-check' : 'fa-scale-balanced'}`;
    }
    if (chargeReactants) {
        chargeReactants.textContent = reactZ > 0 ? `+${reactZ}` : reactZ;
    }
    if (chargeProducts) {
        chargeProducts.textContent = prodZ > 0 ? `+${prodZ}` : prodZ;
    }

    // 4. Update Header Status Badge
    const statusBadge = document.getElementById('balance-status');
    if (statusBadge) {
        statusBadge.innerText = isFullyBalanced ? 'Balanced!' : 'Unbalanced';
        statusBadge.className = `status-badge ${isFullyBalanced ? 'is-balanced' : ''} ${showMatrixBadge ? '' : 'hidden'}`.trim();
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
       netChargeHTML = `<sup class="nuclide-charge">${displayVal}</sup>`;
   }

   return `
       <span class="nuclide">
           <span class="nuclide-nums">
               <span>${mass ?? '?'}</span>
               <span>${charge ?? '?'}</span>
           </span>
           <span class="nuclide-symbol">${symbol}</span>
           ${netChargeHTML}
       </span>
   `;
}
