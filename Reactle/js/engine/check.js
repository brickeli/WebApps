import { parseFormulaDetailed } from './parser.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * Checks a set of coefficients against an equation.
 *
 * species: [{ raw: 'H2', type: 'reactant' | 'product' }, ...]
 * coeffs:  whole numbers, one per species, in the same order
 *
 * Returns { balanced, reduced, divisor, mismatches }
 *   balanced   - every element (and the charge) matches on both sides
 *   reduced    - the coefficients share no common factor (smallest whole numbers)
 *   divisor    - the common factor (1 when reduced)
 *   mismatches - [{ element, left, right }] for each element that does not match
 */
export function checkCoefficients(species, coeffs) {
    const left = {};
    const right = {};

    species.forEach((s, i) => {
        const { atoms, charge } = parseFormulaDetailed(s.raw);
        const side = s.type === 'reactant' ? left : right;
        for (const el in atoms) side[el] = (side[el] || 0) + atoms[el] * coeffs[i];
        if (charge !== 0) side.charge = (side.charge || 0) + charge * coeffs[i];
    });

    const mismatches = [];
    new Set([...Object.keys(left), ...Object.keys(right)]).forEach(element => {
        const l = left[element] || 0;
        const r = right[element] || 0;
        if (l !== r) mismatches.push({ element, left: l, right: r });
    });

    const divisor = coeffs.reduce((g, c) => gcd(g, c), 0) || 1;
    return { balanced: mismatches.length === 0, reduced: divisor === 1, divisor, mismatches };
}
