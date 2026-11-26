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

// Analyze pure-logic solvability and return deduction metrics
export function analyzePureLogic(grid) {
    const size = grid.length;
    const rowClues = grid.map(row => getClues(row));
    const colClues = Array.from({ length: size }, (_, c) =>
        getClues(grid.map(row => row[c]))
    );

    const state = Array.from({ length: size }, () => new Array(size).fill(0));
    let passes = 0;
    let initialRowOpenings = 0;
    let initialColOpenings = 0;
    let progress = true;

    while (progress) {
        progress = false;
        passes++;

        // Propagate rows
        for (let r = 0; r < size; r++) {
            if (!state[r].includes(0)) continue;
            const res = solveLineStep(size, rowClues[r], state[r]);
            if (!res) return { solvable: false };
            if (res.changed) {
                if (passes === 1) initialRowOpenings++;
                state[r] = res.deduced;
                progress = true;
            }
        }

        // Propagate columns
        for (let c = 0; c < size; c++) {
            const col = state.map(row => row[c]);
            if (!col.includes(0)) continue;
            const res = solveLineStep(size, colClues[c], col);
            if (!res) return { solvable: false };
            if (res.changed) {
                if (passes === 1) initialColOpenings++;
                for (let r = 0; r < size; r++) {
                    state[r][c] = res.deduced[r];
                }
                progress = true;
            }
        }
    }

    const solvable = state.every(row => !row.includes(0));
    return { solvable, passes, initialRowOpenings, initialColOpenings };
}

// Stamp 1 anchor row and 1 anchor column with guaranteed overlap so the player
// always has a deterministic entry point to branch from
function seedAnchorLines(grid, size, difficulty) {
    const anchorRow = Math.floor(Math.random() * size);
    const anchorCol = Math.floor(Math.random() * size);

    // Harder difficulties use smaller overlap blocks (fewer free cells on Pass 1)
    const overlapRatio = difficulty === 'easy' ? 0.75 : difficulty === 'hard' ? 0.55 : 0.65;
    const blockLen = Math.min(size, Math.max(Math.floor(size / 2) + 1, Math.round(size * overlapRatio)));

    const rowStart = Math.floor(Math.random() * (size - blockLen + 1));
    for (let c = 0; c < size; c++) {
        grid[anchorRow][c] = (c >= rowStart && c < rowStart + blockLen) ? 1 : 0;
    }

    // Align the anchor column block so it intersects the anchor row cleanly
    const minColStart = Math.max(0, anchorRow - blockLen + 1);
    const maxColStart = Math.min(size - blockLen, anchorRow);
    const colStart = minColStart + Math.floor(Math.random() * (maxColStart - minColStart + 1));

    for (let r = 0; r < size; r++) {
        grid[r][anchorCol] = (r >= colStart && r < colStart + blockLen) ? 1 : 0;
    }
}

// Check if solver pass count matches the requested difficulty tier
function matchesDifficultyCurve(passes, size, difficulty) {
    if (size <= 5) return true; // 5x5 grids naturally solve in 1–3 passes
    if (difficulty === 'easy') return passes <= 3;
    if (difficulty === 'medium') return passes >= 3 && passes <= 6;
    if (difficulty === 'hard') return passes >= 5;
    return true;
}

// Generate a pure-logic, no-guess Nonogram board with guaranteed starting lines
export function generatePureLogicPuzzle(size, difficulty = 'medium') {
    const density = size === 5 ? 0.56 : size === 8 ? 0.54 : 0.52;
    const maxCluesPerLine = size === 5 ? 3 : 4;
    const maxAttempts = 500;
    let bestSolvableFallback = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = Array.from({ length: size }, () =>
            Array.from({ length: size }, () => (Math.random() < density ? 1 : 0))
        );

        seedAnchorLines(candidate, size, difficulty);

        // Avoid overly sparse boards
        const filledCount = candidate.flat().reduce((a, b) => a + b, 0);
        if (filledCount < size) continue;

        // Keep row & column clue lists compact so mobile grids stay large
        const withinClueCap =
            candidate.every(row => getClues(row).length <= maxCluesPerLine) &&
            Array.from({ length: size }, (_, c) =>
                getClues(candidate.map(row => row[c])).length <= maxCluesPerLine
            ).every(Boolean);

        if (!withinClueCap) continue;

        const metrics = analyzePureLogic(candidate);
        if (!metrics.solvable) continue;

        // Enforce at least 1 immediate row opening and 1 immediate column opening
        if (metrics.initialRowOpenings < 1 || metrics.initialColOpenings < 1) continue;

        // Save the first valid no-guess board in case the pass-count target takes extra tries
        if (!bestSolvableFallback) {
            bestSolvableFallback = candidate;
        }

        if (matchesDifficultyCurve(metrics.passes, size, difficulty)) {
            return candidate;
        }
    }

    // Return a verified no-guess board if pass-count tuning hit maxAttempts
    if (bestSolvableFallback) return bestSolvableFallback;

    // Guaranteed solvable fallback pattern
    return Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => ((r + c) % 2 === 0 || r === 0 ? 1 : 0))
    );
}
