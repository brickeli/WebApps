import { parseNuclearEquation } from './nuclearParser.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * Same rules as the chemical check: balanced AND in the smallest whole numbers.
 * Put at js/engine/nuclearCheck.js.
 *
 * Returns { balanced, reduced, divisor, mismatches }
 *   mismatches - [{ label, left, right }] for mass number (A) and charge (Z)
 */
export function checkNuclearCoefficients(equation, coeffs) {
    const parsed = parseNuclearEquation(equation);
    const species = [...parsed.reactants, ...parsed.products];
    const offset = parsed.reactants.length;
    const used = species.map((_, i) => (Number.isFinite(coeffs[i]) && coeffs[i] > 0 ? coeffs[i] : 1));

    const sums = { left: { A: 0, Z: 0 }, right: { A: 0, Z: 0 } };
    species.forEach((term, i) => {
        const side = i < offset ? sums.left : sums.right;
        side.A += (term.mass || 0) * used[i];
        side.Z += (term.charge || 0) * used[i];
    });

    const mismatches = [];
    if (sums.left.A !== sums.right.A) mismatches.push({ label: 'mass number (A)', left: sums.left.A, right: sums.right.A });
    if (sums.left.Z !== sums.right.Z) mismatches.push({ label: 'atomic charge (Z)', left: sums.left.Z, right: sums.right.Z });

    const divisor = used.reduce((g, c) => gcd(g, c), 0) || 1;
    return { balanced: mismatches.length === 0, reduced: divisor === 1, divisor, mismatches };
}
