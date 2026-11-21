import { parseFormulaDetailed } from './parser.js';

/**
 * Balances a chemical equation exactly.
 *
 * Builds the atom (and charge) matrix, finds its null space with exact fractions, and scales the
 * result to the smallest whole numbers. There is no search, so it is instant for any realistic
 * equation and is not limited to coefficients of 12 or less.
 *
 * Returns { reactants: [{ raw, coeff }], products: [{ raw, coeff }] }.
 * Throws an Error with a plain-language message when the input cannot be read, cannot be
 * balanced, or has more than one valid answer.
 */

export const MAX_SPECIES = 20;

const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => (a / gcd(a, b)) * b;

// fractions as [numerator, denominator] BigInt pairs, denominator > 0
const frac = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const sub = (a, b) => frac(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const mul = (a, b) => frac(a[0] * b[0], a[1] * b[1]);
const div = (a, b) => frac(a[0] * b[1], a[1] * b[0]);
const isZero = (a) => a[0] === 0n;

function parseAll(raws, side) {
    return raws.map(raw => {
        try {
            return parseFormulaDetailed(raw);
        } catch (err) {
            throw new Error(`${side} "${raw}": ${err.message}`);
        }
    });
}

export function computeCoefficients(reactantsRaw, productsRaw) {
    const total = reactantsRaw.length + productsRaw.length;
    if (reactantsRaw.length === 0 || productsRaw.length === 0) {
        throw new Error('An equation needs at least one reactant and one product.');
    }
    if (total > MAX_SPECIES) throw new Error(`Too many species (the limit is ${MAX_SPECIES}).`);

    const parsed = [
        ...parseAll(reactantsRaw, 'Reactant'),
        ...parseAll(productsRaw, 'Product')
    ];
    const rawNames = [...reactantsRaw, ...productsRaw];
    const numReactants = reactantsRaw.length;

    // one row per element (plus one for charge when any species is charged), one column per species
    const rowKeys = [];
    parsed.forEach(p => Object.keys(p.atoms).forEach(el => { if (!rowKeys.includes(el)) rowKeys.push(el); }));
    if (parsed.some(p => p.charge !== 0)) rowKeys.push('charge');

    const matrix = rowKeys.map(key => parsed.map((p, col) => {
        const value = key === 'charge' ? p.charge : (p.atoms[key] || 0);
        return frac(BigInt(col < numReactants ? value : -value));
    }));

    // reduced row echelon form
    const pivotColumns = [];
    let row = 0;
    for (let col = 0; col < total && row < matrix.length; col++) {
        let pivot = row;
        while (pivot < matrix.length && isZero(matrix[pivot][col])) pivot++;
        if (pivot === matrix.length) continue;
        [matrix[row], matrix[pivot]] = [matrix[pivot], matrix[row]];
        const lead = matrix[row][col];
        matrix[row] = matrix[row].map(v => div(v, lead));
        for (let r = 0; r < matrix.length; r++) {
            if (r !== row && !isZero(matrix[r][col])) {
                const factor = matrix[r][col];
                matrix[r] = matrix[r].map((v, c) => sub(v, mul(factor, matrix[row][c])));
            }
        }
        pivotColumns.push(col);
        row++;
    }

    const freeColumns = [];
    for (let c = 0; c < total; c++) if (!pivotColumns.includes(c)) freeColumns.push(c);

    if (freeColumns.length === 0) {
        throw new Error('This equation cannot be balanced: the atoms (or charges) on the two sides cannot be made to match. Check each formula and that every element appears on both sides.');
    }
    if (freeColumns.length > 1) {
        throw new Error(`This equation has ${freeColumns.length} independent ways to balance, so there is no single answer. Remove a species or add the missing one.`);
    }

    // the single free column is set to 1 and the pivot columns follow from it
    const free = freeColumns[0];
    const solution = new Array(total).fill(frac(0n));
    solution[free] = frac(1n);
    pivotColumns.forEach((col, r) => { solution[col] = frac(-matrix[r][free][0], matrix[r][free][1]); });

    // scale to whole numbers, in lowest terms, all positive
    let scale = 1n;
    solution.forEach(v => { scale = lcm(scale, v[1]); });
    let ints = solution.map(v => (v[0] * scale) / v[1]);
    let divisor = 0n;
    ints.forEach(v => { divisor = gcd(divisor, v); });
    ints = ints.map(v => v / divisor);
    if (ints.every(v => v <= 0n)) ints = ints.map(v => -v);

    if (ints.some(v => v <= 0n)) {
        throw new Error('This equation cannot be balanced with every species taking part. Check that each formula is on the correct side.');
    }

    const coeffs = ints.map(Number);
    return {
        reactants: reactantsRaw.map((raw, i) => ({ raw, coeff: coeffs[i] })),
        products: productsRaw.map((raw, i) => ({ raw, coeff: coeffs[numReactants + i] }))
    };
}
