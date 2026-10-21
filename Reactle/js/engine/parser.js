export function parseFormula(formulaStr) {
    const counts = {};
    const regex = /([A-Z][a-z]*)(\d*)|(\()|(\))(\d*)/g;
    const stack = [counts];

    let match;
    while ((match = regex.exec(formulaStr)) !== null) {
        const elem = match[1];
        const count = match[2];
        const openParen = match[3];
        const closeParen = match[4];
        const groupCount = match[5];

        if (elem) {
            const currentObj = stack[stack.length - 1];
            const num = count ? parseInt(count) : 1;
            currentObj[elem] = (currentObj[elem] || 0) + num;
        } else if (openParen) {
            stack.push({});
        } else if (closeParen) {
            const poppedObj = stack.pop();
            const multiplier = groupCount ? parseInt(groupCount) : 1;
            const currentObj = stack[stack.length - 1];
            for (let el in poppedObj) {
                currentObj[el] = (currentObj[el] || 0) + (poppedObj[el] * multiplier);
            }
        }
    }
    return counts;
}
