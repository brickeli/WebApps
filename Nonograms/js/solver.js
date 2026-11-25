export function getClues(line) {
    const clues = [];
    let count = 0;
    for (const val of line) {
        if (val === 1) {
            count++;
        } else if (count > 0) {
            clues.push(count);
            count = 0;
        }
    }
    if (count > 0) clues.push(count);
    return clues.length > 0 ? clues : [0];
}

// Generate all valid binary arrangements for a single line given its clues and known cell states
// Known cell states: 0 = unknown, 1 = must be filled, 2 = must be empty
function generateValidLines(length, clues, knownLine) {
    if (clues.length === 1 && clues[0] === 0) {
        if (knownLine.some(v => v === 1)) return [];
        return [new Array(length).fill(2)];
    }

    const results = [];
    const totalBlocks = clues.length;

    function backtrack(blockIdx, pos, current) {
        if (blockIdx === totalBlocks) {
            for (let i = pos; i < length; i++) {
                if (knownLine[i] === 1) return;
                current[i] = 2;
            }
            results.push([...current]);
            return;
        }

        const blockLen = clues[blockIdx];
        const remainingBlocks = clues.slice(blockIdx + 1);
        const minRemainingSpace = remainingBlocks.reduce((sum, len) => sum + len + 1, 0);
        const maxStart = length - minRemainingSpace - blockLen;

        for (let start = pos; start <= maxStart; start++) {
            let valid = true;

            // Cells before block must be empty
            for (let i = pos; i < start; i++) {
                if (knownLine[i] === 1) {
                    valid = false;
                    break;
                }
                current[i] = 2;
            }
            if (!valid) continue;

            // Block cells must be filled
            for (let i = start; i < start + blockLen; i++) {
                if (knownLine[i] === 2) {
                    valid = false;
                    break;
                }
                current[i] = 1;
            }
            if (!valid) continue;

            // Separator cell after block (if not the last block) must be empty
            let nextPos = start + blockLen;
            if (blockIdx < totalBlocks - 1) {
                if (knownLine[nextPos] === 1) continue;
                current[nextPos] = 2;
                nextPos++;
            }

            backtrack(blockIdx + 1, nextPos, current);
        }
    }

    backtrack(0, 0, new Array(length).fill(2));
    return results;
}

// Deduce forced cells in a single line from all valid arrangements
function solveLineStep(length, clues, knownLine) {
    const validLines = generateValidLines(length, clues, knownLine);
    if (validLines.length === 0) return null;

    const deduced = [...knownLine];
    let changed = false;

    for (let i = 0; i < length; i++) {
        if (deduced[i] !== 0) continue;
        const firstVal = validLines[0][i];
        if (validLines.every(line => line[i] === firstVal)) {
            deduced[i] = firstVal;
            changed = true;
        }
    }

    return { deduced, changed };
}

// Verify that a grid is 100% solvable using pure line logic (zero guessing)
export function isPureLogicSolvable(grid) {
    const size = grid.length;
    const rowClues = grid.map(row => getClues(row));
    const colClues = Array.from({ length: size }, (_, c) =>
        getClues(grid.map(row => row[c]))
    );

    const state = Array.from({ length: size }, () => new Array(size).fill(0));
    let progress = true;

    while (progress) {
        progress = false;

        // Propagate rows
        for (let r = 0; r < size; r++) {
            if (!state[r].includes(0)) continue;
            const res = solveLineStep(size, rowClues[r], state[r]);
            if (!res) return false;
            if (res.changed) {
                state[r] = res.deduced;
                progress = true;
            }
        }

        // Propagate columns
        for (let c = 0; c < size; c++) {
            const col = state.map(row => row[c]);
            if (!col.includes(0)) continue;
            const res = solveLineStep(size, colClues[c], col);
            if (!res) return false;
            if (res.changed) {
                for (let r = 0; r < size; r++) {
                    state[r][c] = res.deduced[r];
                }
                progress = true;
            }
        }
    }

    // Solved cleanly if no unknown cells remain
    return state.every(row => !row.includes(0));
}

// Generate a pure-logic, unique-solution Nonogram board
export function generatePureLogicPuzzle(size) {
    const density = size === 5 ? 0.56 : size === 8 ? 0.54 : 0.52;
    const maxAttempts = 250;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = Array.from({ length: size }, () =>
            Array.from({ length: size }, () => (Math.random() < density ? 1 : 0))
        );

        // Avoid completely blank boards
        const filledCount = candidate.flat().reduce((a, b) => a + b, 0);
        if (filledCount < size) continue;

        if (isPureLogicSolvable(candidate)) {
            return candidate;
        }
    }

    // Guaranteed solvable fallback pattern if random search hits attempt cap
    return Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => ((r + c) % 2 === 0 || r === 0 ? 1 : 0))
    );
}
