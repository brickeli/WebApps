/**
 * Nuclear Reaction Parser & Conservation Validator
 * Formatted specifically for the structured nuclearEquations.js schema.
 */

// Mapping atomic charges (Z) for symbols used in nuclear data
export const ATOMIC_NUMBERS = {
  // Common nuclear particles
  'n': 0,      // Neutron
  'p': 1,      // Proton
  'e': -1,     // Beta / Electron
  'beta': -1,

  // Elements present in dataset
  'H': 1,
  'He': 2,
  'Be': 4,
  'C': 6,
  'N': 7,
  'O': 8,
  'Kr': 36,
  'Ba': 56,
  'Rn': 86,
  'Ra': 88,
  'U': 92,
  'Cf': 98
};

/**
 * Parses a single species object from nuclearEquations.js
 * Supports both new schema ({ symbol, mass, charge }) and legacy schema ({ raw: 'U235' })
 *
 * @param {Object} speciesObj
 * @returns {Object} { symbol, mass, charge, massNumber, atomicNumber, targetCoeff, raw, formulaHTML }
 */
export function parseNuclearSpecies(speciesObj) {
  let symbol = speciesObj.symbol;
  let mass = speciesObj.mass;
  let charge = speciesObj.charge;

  // Fallback: Extract from raw string if mass/symbol aren't explicitly passed
  if (!symbol || mass === undefined) {
    const raw = speciesObj.raw || '';
    const match = raw.match(/^([A-Za-z]+)(\d+)$/);

    if (match) {
      symbol = match[1];
      mass = parseInt(match[2], 10);
    } else {
      symbol = raw || 'X';
      mass = 0;
    }
  }

  // Fallback: Look up atomic charge Z if not provided in speciesObj
  if (charge === undefined) {
    charge = ATOMIC_NUMBERS[symbol] !== undefined ? ATOMIC_NUMBERS[symbol] : 0;
  }

  return {
    symbol,
    mass,
    charge,
    massNumber: mass,       // Dual key for backward compatibility with calculation functions
    atomicNumber: charge,   // Dual key for backward compatibility with calculation functions
    targetCoeff: speciesObj.coeff || 1,
    raw: speciesObj.raw || `${symbol}${mass}`,
    formulaHTML: speciesObj.formula || null
  };
}

/**
 * Parses a full reaction object from nuclearEquations.js
 *
 * @param {Object} equationObj - An entry from NUCLEAR_EQUATIONS array
 * @returns {Object} { reactants: [...], products: [...] }
 */
 export function parseNuclearEquation(equationObj) {
   if (!equationObj || !equationObj.reactants || !equationObj.products) {
     return { ...equationObj, reactants: [], products: [] };
   }

   const parseTerm = (term) => {
     const parsed = parseNuclearSpecies(term);
     const selected = term.selectedParticle;

     return {
       ...term,
       ...parsed,
       // Dynamically assign mass, charge, and symbol from selectedParticle if selectable
       mass: term.isSelectable ? (selected ? selected.mass : 0) : (parsed.mass ?? term.mass ?? 0),
       charge: term.isSelectable ? (selected ? selected.charge : 0) : (parsed.charge ?? term.charge ?? 0),
       symbol: term.isSelectable ? (selected ? selected.symbol : '?') : (parsed.symbol ?? term.symbol ?? ''),
       rawTerm: term,
       isSelectable: term.isSelectable || false,
       expectedParticle: term.expectedParticle || null,
       selectedParticle: term.selectedParticle || null
     };
   };

   return {
     ...equationObj,
     reactants: equationObj.reactants.map(parseTerm),
     products: equationObj.products.map(parseTerm)
   };
 }

/**
 * Validates whether user-entered coefficients satisfy conservation
 * of Mass Number (A) AND Atomic Number / Charge (Z).
 *
 * @param {Object} equationObj - Entry from NUCLEAR_EQUATIONS
 * @param {Array<number>} userCoefficients - Array of integer coefficients entered by user
 * @returns {boolean} True if total A and total Z match on both sides
 */
export function checkNuclearBalance(equationObj, userCoefficients) {
  const parsed = parseNuclearEquation(equationObj);
  const totalTerms = parsed.reactants.length + parsed.products.length;

  if (!userCoefficients || userCoefficients.length !== totalTerms) {
    return false;
  }

  let reactA = 0;
  let reactZ = 0;
  let prodA = 0;
  let prodZ = 0;

  // Calculate sum of Mass (A) and Charge (Z) for Reactants
  parsed.reactants.forEach((term, idx) => {
    const coeff = userCoefficients[idx] || 1;
    reactA += term.mass * coeff;
    reactZ += term.charge * coeff;
  });

  // Calculate sum of Mass (A) and Charge (Z) for Products
  const offset = parsed.reactants.length;
  parsed.products.forEach((term, idx) => {
    const coeff = userCoefficients[offset + idx] || 1;
    prodA += term.mass * coeff;
    prodZ += term.charge * coeff;
  });

  // Balanced if total mass (A) AND total charge (Z) are equal across both sides
  return reactA === prodA && reactZ === prodZ;
}

export function loadNextEquation() {
    // 1. Reset state & UI controls
    state.hintStep = 0;

    const checkBtn = document.getElementById('check-btn');
    const nextBtn = document.getElementById('next-btn');
    const feedbackBanner = document.getElementById('feedback-banner');

    if (checkBtn) checkBtn.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
    if (feedbackBanner) feedbackBanner.classList.add('hidden');

    // 2. Select next equation from dataset
    const available = NUCLEAR_EQUATIONS.filter(eq => eq.id !== state.currentEquation?.id);
    const nextEq = available[Math.floor(Math.random() * available.length)] || NUCLEAR_EQUATIONS[0];

    state.currentEquation = nextEq;
    state.userCoefficients = {};

    // 3. Render Equation & Reset Matrix
    renderNuclearEquationContainer(nextEq);
    calculateNuclearMatrix();
}
