import { parseFormula } from './parser.js';

/**
 * Computes integer coefficients for standard chemical equations using matrix balancing.
  */
 export function computeCoefficients(reactantsRaw, productsRaw) {
     const parsedReactants = reactantsRaw.map(parseFormula);
     const parsedProducts = productsRaw.map(parseFormula);

     // 1. Gather all unique chemical elements present in the reaction
     const elements = new Set();
     [...parsedReactants, ...parsedProducts].forEach(counts => {
         Object.keys(counts).forEach(e => elements.add(e));
     });

     const elementList = Array.from(elements);
     const numReactants = reactantsRaw.length;
     const numProducts = productsRaw.length;
     const totalSpecies = numReactants + numProducts;

     // 2. Helper to check if a specific set of coefficients balances the equation
     function isBalanced(coeffs) {
         for (const elem of elementList) {
             let reactantCount = 0;
             let productCount = 0;

             for (let i = 0; i < numReactants; i++) {
                 reactantCount += (parsedReactants[i][elem] || 0) * coeffs[i];
             }
             for (let j = 0; j < numProducts; j++) {
                 productCount += (parsedProducts[j][elem] || 0) * coeffs[numReactants + j];
             }

             if (reactantCount !== productCount || reactantCount === 0) {
                 return false;
             }
         }
         return true;
     }

     // 3. Search for the smallest valid integer coefficients (1 to 12)
     let solutionCoeffs = null;

     function search(index, currentCoeffs) {
         if (solutionCoeffs) return; // Stop if already found

         if (index === totalSpecies) {
             if (isBalanced(currentCoeffs)) {
                 solutionCoeffs = [...currentCoeffs];
             }
             return;
         }

         for (let coeff = 1; coeff <= 12; coeff++) {
             currentCoeffs[index] = coeff;
             search(index + 1, currentCoeffs);
             if (solutionCoeffs) return;
         }
     }

     search(0, new Array(totalSpecies).fill(1));

     // 4. Return formatted result matching solveCustomEquation expectations
     if (!solutionCoeffs) return null;

     return {
         reactants: reactantsRaw.map((raw, i) => ({
             raw: raw,
             coeff: solutionCoeffs[i]
         })),
         products: productsRaw.map((raw, i) => ({
             raw: raw,
             coeff: solutionCoeffs[numReactants + i]
         }))
     };
 }
