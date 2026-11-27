// js/solver.js

// Validates Sudoku placement against row, column, and 3x3 box rules.
export function isValid(arr, index, num) {
    const row = Math.floor(index / 9);
    const col = index % 9;

    // 1. Check Row and Column
    for (let i = 0; i < 9; i++) {
        const rowIdx = row * 9 + i;
        const colIdx = i * 9 + col;

        if (rowIdx !== index && arr[rowIdx] === num) return false;
        if (colIdx !== index && arr[colIdx] === num) return false;
    }

    // 2. Check 3x3 Box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const boxIdx = (startRow + r) * 9 + (startCol + c);
            if (boxIdx !== index && arr[boxIdx] === num) return false;
        }
    }

    return true;
}

// Fisher-Yates shuffle for unbiased number ordering
function shuffledDigits() {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    return nums;
}

// Recursively solves an 81-length Sudoku board array in place.
export function solveSudoku(arr) {
    for (let i = 0; i < 81; i++) {
        if (arr[i] === 0) {
            for (const num of shuffledDigits()) {
                if (isValid(arr, i, num)) {
                    arr[i] = num;
                    if (solveSudoku(arr)) return true;
                    arr[i] = 0;
                }
            }
            return false;
        }
    }
    return true;
}

// Counts valid solutions up to `limit` (default 2) to verify uniqueness.
export function countSolutions(board, limit = 2) {
    const arr = [...board];
    let count = 0;

    function backtrack() {
        if (count >= limit) return;

        let bestIdx = -1;
        let bestCandidates = null;

        for (let i = 0; i < 81; i++) {
            if (arr[i] === 0) {
                const candidates = getValidCandidates(arr, i);
                if (candidates.length === 0) return;
                if (!bestCandidates || candidates.length < bestCandidates.length) {
                    bestIdx = i;
                    bestCandidates = candidates;
                    if (candidates.length === 1) break;
                }
            }
        }

        if (bestIdx === -1) {
            count++;
            return;
        }

        for (const num of bestCandidates) {
            arr[bestIdx] = num;
            backtrack();
            arr[bestIdx] = 0;
            if (count >= limit) return;
        }
    }

    backtrack();
    return count;
}

// Returns valid candidate numbers for an empty cell.
export function getValidCandidates(arr, index) {
    if (arr[index] !== 0) return [];
    const candidates = [];
    for (let num = 1; num <= 9; num++) {
        if (isValid(arr, index, num)) {
            candidates.push(num);
        }
    }
    return candidates;
}

// Precompute unit index arrays (9 rows, 9 cols, 9 boxes) for fast logical grading
const UNITS = (() => {
    const units = [];
    for (let r = 0; r < 9; r++) {
        units.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
    }
    for (let c = 0; c < 9; c++) {
        units.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
    }
    for (let b = 0; b < 9; b++) {
        const startRow = Math.floor(b / 3) * 3;
        const startCol = (b % 3) * 3;
        const box = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                box.push((startRow + r) * 9 + (startCol + c));
            }
        }
        units.push(box);
    }
    return units;
})();

/**
 * Evaluates a puzzle using human deduction techniques without guessing.
 * Returns { solvable: boolean, highestTierUsed: number }
 *   Tier 1: Naked & Hidden Singles
 *   Tier 2: Pointing Pairs/Triples, Box-Line Reduction (Claiming), Naked Pairs
 *   Tier 3: Naked Triples & Hidden Pairs
 */
export function evaluatePuzzleLogic(board, maxTier = 3) {
    const arr = [...board];
    const candidates = Array.from({ length: 81 }, (_, i) =>
        arr[i] === 0 ? new Set(getValidCandidates(arr, i)) : new Set()
    );
    let highestTierUsed = 1;

    function placeDigit(idx, num) {
        arr[idx] = num;
        candidates[idx].clear();

        const row = Math.floor(idx / 9);
        const col = idx % 9;
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;

        for (let i = 0; i < 9; i++) {
            candidates[row * 9 + i].delete(num);
            candidates[i * 9 + col].delete(num);
        }
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                candidates[(startRow + r) * 9 + (startCol + c)].delete(num);
            }
        }
    }

    let progress = true;
    while (progress) {
        progress = false;

        // Tier 1A: Naked Singles
        for (let i = 0; i < 81; i++) {
            if (arr[i] === 0) {
                if (candidates[i].size === 0) return { solvable: false, highestTierUsed };
                if (candidates[i].size === 1) {
                    const [onlyNum] = candidates[i];
                    placeDigit(i, onlyNum);
                    progress = true;
                }
            }
        }
        if (progress) continue;

        // Tier 1B: Hidden Singles
        for (const unit of UNITS) {
            for (let num = 1; num <= 9; num++) {
                let targetCell = -1;
                let count = 0;
                for (const idx of unit) {
                    if (arr[idx] === 0 && candidates[idx].has(num)) {
                        targetCell = idx;
                        count++;
                        if (count > 1) break;
                    }
                }
                if (count === 1) {
                    placeDigit(targetCell, num);
                    progress = true;
                    break;
                }
            }
            if (progress) break;
        }
        if (progress || maxTier < 2) continue;

        // Tier 2A: Pointing Pairs/Triples (Box -> Line)
        for (let b = 0; b < 9; b++) {
            const boxCells = UNITS[18 + b];
            for (let num = 1; num <= 9; num++) {
                const matching = boxCells.filter(idx => arr[idx] === 0 && candidates[idx].has(num));
                if (matching.length < 2 || matching.length > 3) continue;

                const rows = new Set(matching.map(idx => Math.floor(idx / 9)));
                if (rows.size === 1) {
                    const [sharedRow] = rows;
                    for (let c = 0; c < 9; c++) {
                        const cellIdx = sharedRow * 9 + c;
                        if (!boxCells.includes(cellIdx) && candidates[cellIdx].delete(num)) {
                            progress = true;
                            highestTierUsed = Math.max(highestTierUsed, 2);
                        }
                    }
                }

                const cols = new Set(matching.map(idx => idx % 9));
                if (cols.size === 1) {
                    const [sharedCol] = cols;
                    for (let r = 0; r < 9; r++) {
                        const cellIdx = r * 9 + sharedCol;
                        if (!boxCells.includes(cellIdx) && candidates[cellIdx].delete(num)) {
                            progress = true;
                            highestTierUsed = Math.max(highestTierUsed, 2);
                        }
                    }
                }
            }
        }
        if (progress) continue;

        // Tier 2B: Box-Line Reduction / Claiming (Line -> Box)
        for (let lineIdx = 0; lineIdx < 18; lineIdx++) {
            const lineCells = UNITS[lineIdx];
            for (let num = 1; num <= 9; num++) {
                const matching = lineCells.filter(idx => arr[idx] === 0 && candidates[idx].has(num));
                if (matching.length < 2 || matching.length > 3) continue;

                const boxes = new Set(
                    matching.map(idx => Math.floor(Math.floor(idx / 9) / 3) * 3 + Math.floor((idx % 9) / 3))
                );
                if (boxes.size === 1) {
                    const [sharedBox] = boxes;
                    for (const boxCell of UNITS[18 + sharedBox]) {
                        if (!lineCells.includes(boxCell) && candidates[boxCell].delete(num)) {
                            progress = true;
                            highestTierUsed = Math.max(highestTierUsed, 2);
                        }
                    }
                }
            }
        }
        if (progress) continue;

        // Tier 2C: Naked Pairs
        for (const unit of UNITS) {
            const twoCandCells = unit.filter(idx => arr[idx] === 0 && candidates[idx].size === 2);
            for (let i = 0; i < twoCandCells.length; i++) {
                for (let j = i + 1; j < twoCandCells.length; j++) {
                    const c1 = [...candidates[twoCandCells[i]]];
                    const c2 = candidates[twoCandCells[j]];
                    if (c2.has(c1[0]) && c2.has(c1[1])) {
                        for (const idx of unit) {
                            if (idx !== twoCandCells[i] && idx !== twoCandCells[j] && arr[idx] === 0) {
                                if (candidates[idx].delete(c1[0])) {
                                    progress = true;
                                    highestTierUsed = Math.max(highestTierUsed, 2);
                                }
                                if (candidates[idx].delete(c1[1])) {
                                    progress = true;
                                    highestTierUsed = Math.max(highestTierUsed, 2);
                                }
                            }
                        }
                    }
                }
            }
        }
        if (progress || maxTier < 3) continue;

        // Tier 3A: Naked Triples (3 cells in a unit sharing a union of 3 candidates)
        for (const unit of UNITS) {
            const candCells = unit.filter(idx => arr[idx] === 0 && candidates[idx].size >= 2 && candidates[idx].size <= 3);
            for (let i = 0; i < candCells.length; i++) {
                for (let j = i + 1; j < candCells.length; j++) {
                    for (let k = j + 1; k < candCells.length; k++) {
                        const union = new Set([
                            ...candidates[candCells[i]],
                            ...candidates[candCells[j]],
                            ...candidates[candCells[k]]
                        ]);
                        if (union.size === 3) {
                            for (const idx of unit) {
                                if (idx !== candCells[i] && idx !== candCells[j] && idx !== candCells[k] && arr[idx] === 0) {
                                    for (const num of union) {
                                        if (candidates[idx].delete(num)) {
                                            progress = true;
                                            highestTierUsed = Math.max(highestTierUsed, 3);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (progress) continue;

        // Tier 3B: Hidden Pairs (2 digits restricted to the exact same 2 cells in a unit)
        for (const unit of UNITS) {
            for (let n1 = 1; n1 <= 8; n1++) {
                const pos1 = unit.filter(idx => arr[idx] === 0 && candidates[idx].has(n1));
                if (pos1.length !== 2) continue;
                for (let n2 = n1 + 1; n2 <= 9; n2++) {
                    const pos2 = unit.filter(idx => arr[idx] === 0 && candidates[idx].has(n2));
                    if (pos2.length === 2 && pos1[0] === pos2[0] && pos1[1] === pos2[1]) {
                        for (const cellIdx of pos1) {
                            for (const cand of [...candidates[cellIdx]]) {
                                if (cand !== n1 && cand !== n2) {
                                    candidates[cellIdx].delete(cand);
                                    progress = true;
                                    highestTierUsed = Math.max(highestTierUsed, 3);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return {
        solvable: arr.every(val => val !== 0),
        highestTierUsed
    };
}
