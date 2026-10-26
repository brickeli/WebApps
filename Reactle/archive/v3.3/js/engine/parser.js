/**
 * Parses a chemical formula string into an object mapping element symbols to atom counts.
 * Handles single elements, subscripts, and nested parentheses with multipliers.
 *
 * Example: 'O2'        -> { O: 2 }
 * Example: 'H2O'       -> { H: 2, O: 1 }
 * Example: 'Ca(OH)2'   -> { Ca: 1, O: 2, H: 2 }
 * Example: 'Al2(SO4)3' -> { Al: 2, S: 3, O: 12 }
 *
 * @param {string} formulaStr - The raw chemical formula to parse.
 * @return {Object.<string, number>} Object with element symbols as keys and counts as values.
 */
export function parseFormula(formulaStr) {
    if (!formulaStr) return {};

    const counts = {};
    const stack = [counts];
    // Tokenize: Matches element+subscript (e.g., 'Al2'), '(' or ')'+subscript (e.g., ')3')
    const tokenRegex = /([A-Z][a-z]*)(\d*)|(\()|(\))(\d*)/g;

    let match;
    while ((match = tokenRegex.exec(formulaStr)) !== null) {
        // Prevent zero-width match infinite loop
        if (match.index === tokenRegex.lastIndex) {
            tokenRegex.lastIndex++;
        }

        const elem = match[1];
        const count = match[2];
        const openParen = match[3];
        const closeParen = match[4];
        const groupCount = match[5];

        if (elem) {
            const currentObj = stack[stack.length - 1];
            const num = count ? parseInt(count, 10) : 1;
            currentObj[elem] = (currentObj[elem] || 0) + num;
        } else if (openParen) {
            stack.push({});
        } else if (closeParen) {
            const poppedObj = stack.pop();
            const multiplier = groupCount ? parseInt(groupCount, 10) : 1;
            const currentObj = stack[stack.length - 1];
            if (poppedObj && currentObj) {
                for (let el in poppedObj) {
                    currentObj[el] = (currentObj[el] || 0) + (poppedObj[el] * multiplier);
                }
            }
        }
    }

    return counts;
}
