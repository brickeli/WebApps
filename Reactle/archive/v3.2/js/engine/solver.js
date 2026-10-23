import { parseFormula } from './parser.js';

export function computeCoefficients(rArr, pArr) {
    const allSpecies = [...rArr, ...pArr];
    const parsedSpecies = allSpecies.map(parseFormula);

    const elements = Array.from(new Set(parsedSpecies.flatMap(Object.keys)));
    const numSpecies = allSpecies.length;

    function* generateVectors(length, maxVal) {
        if (length === 0) { yield []; return; }
        for (let i = 1; i <= maxVal; i++) {
            for (let rest of generateVectors(length - 1, maxVal)) {
                yield [i, ...rest];
            }
        }
    }

    for (let coeffs of generateVectors(numSpecies, 10)) {
        let balanced = true;
        for (let elem of elements) {
            let rSum = 0;
            let pSum = 0;

            for (let i = 0; i < rArr.length; i++) {
                rSum += (parsedSpecies[i][elem] || 0) * coeffs[i];
            }
            for (let j = 0; j < pArr.length; j++) {
                pSum += (parsedSpecies[rArr.length + j][elem] || 0) * coeffs[rArr.length + j];
            }

            if (rSum !== pSum) {
                balanced = false;
                break;
            }
        }

        if (balanced) {
            return {
                reactants: rArr.map((r, i) => ({ raw: r, coeff: coeffs[i] })),
                products: pArr.map((p, j) => ({ raw: p, coeff: coeffs[rArr.length + j] }))
            };
        }
    }
    return null;
}
