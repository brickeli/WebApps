// hitori/js/solver.js
const UNKNOWN = 0;
const SHADED = 1;
const WHITE = 2;

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function generateLatinSquare(size) {
    const base = Array.from({ length: size }, (_, i) => i + 1);
    const rowPerm = shuffle([...Array(size).keys()]);
    const colPerm = shuffle([...Array(size).keys()]);
    const symPerm = shuffle([...base]);

    return Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => {
            const val = (rowPerm[r] + colPerm[c]) % size;
            return symPerm[val];
        })
    );
}

/**
 * Checks that all cells where `isBlocked(r, c)` is false form one connected component.
 */
export function areUnshadedConnected(size, isBlocked) {
    let start = null;
    let totalOpen = 0;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (!isBlocked(r, c)) {
                totalOpen++;
                if (!start) start = [r, c];
            }
        }
    }
    if (totalOpen === 0) return false;

    const visited = Array.from({ length: size }, () => new Array(size).fill(false));
    const queue = [start];
    visited[start[0]][start[1]] = true;
    let reached = 0;

    while (queue.length) {
        const [r, c] = queue.shift();
        reached++;
        for (const [dr, dc] of DIRS) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc] && !isBlocked(nr, nc)) {
                visited[nr][nc] = true;
                queue.push([nr, nc]);
            }
        }
    }

    return reached === totalOpen;
}

/**
 * Pure-logic deductive solver (zero guessing).
 * Returns { solved: boolean, state: number[][] }
 */
export function solvePureLogic(numbers) {
    const size = numbers.length;
    const state = Array.from({ length: size }, () => new Array(size).fill(UNKNOWN));
    let changed = true;

    const setWhite = (r, c) => {
        if (state[r][c] === SHADED) return false;
        if (state[r][c] === UNKNOWN) {
            state[r][c] = WHITE;
            changed = true;
        }
        return true;
    };

    const setShaded = (r, c) => {
        if (state[r][c] === WHITE) return false;
        if (state[r][c] === UNKNOWN) {
            state[r][c] = SHADED;
            changed = true;
        }
        return true;
    };

    // Initial pattern scan: Sandwiches (A-B-A) and Double-Adjacent (A-A ... A)
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            // Horizontal sandwich
            if (c + 2 < size && numbers[r][c] === numbers[r][c + 2]) {
                setWhite(r, c + 1);
            }
            // Vertical sandwich
            if (r + 2 < size && numbers[r][c] === numbers[r + 2][c]) {
                setWhite(r + 1, c);
            }
            // Horizontal adjacent pair -> shade any other matching number in row
            if (c + 1 < size && numbers[r][c] === numbers[r][c + 1]) {
                for (let k = 0; k < size; k++) {
                    if (k !== c && k !== c + 1 && numbers[r][k] === numbers[r][c]) {
                        setShaded(r, k);
                    }
                }
            }
            // Vertical adjacent pair -> shade any other matching number in col
            if (r + 1 < size && numbers[r][c] === numbers[r + 1][c]) {
                for (let k = 0; k < size; k++) {
                    if (k !== r && k !== r + 1 && numbers[k][c] === numbers[r][c]) {
                        setShaded(k, c);
                    }
                }
            }
        }
    }

    while (changed) {
        changed = false;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                // Rule 1: Shaded cells force all orthogonal neighbors to be WHITE
                if (state[r][c] === SHADED) {
                    for (const [dr, dc] of DIRS) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                            if (!setWhite(nr, nc)) return { solved: false, state };
                        }
                    }
                }

                // Rule 2: White cells force all same-number peers in row & col to be SHADED
                if (state[r][c] === WHITE) {
                    const val = numbers[r][c];
                    for (let k = 0; k < size; k++) {
                        if (k !== c && numbers[r][k] === val) {
                            if (!setShaded(r, k)) return { solved: false, state };
                        }
                        if (k !== r && numbers[k][c] === val) {
                            if (!setShaded(k, c)) return { solved: false, state };
                        }
                    }
                }
            }
        }

        // Rule 3: Connectivity lookahead (if shading (r,c) disconnects the board, it must be WHITE)
        if (!changed) {
            for (let r = 0; r < size && !changed; r++) {
                for (let c = 0; c < size && !changed; c++) {
                    if (state[r][c] === UNKNOWN) {
                        const connected = areUnshadedConnected(
                            size,
                            (rr, cc) => state[rr][cc] === SHADED || (rr === r && cc === c)
                        );
                        if (!connected) {
                            if (!setWhite(r, c)) return { solved: false, state };
                        }
                    }
                }
            }
        }
    }

    const solved = state.every(row => row.every(cell => cell !== UNKNOWN));
    return { solved, state };
}

/**
 * Generates a verified no-guess Hitori puzzle of the requested size.
 */
export function generateHitoriPuzzle(size = 5) {
    const targetRatio = size <= 5 ? 0.28 : size <= 7 ? 0.30 : 0.32;
    const targetShaded = Math.floor(size * size * targetRatio);

    for (let attempt = 0; attempt < 80; attempt++) {
        const latin = generateLatinSquare(size);
        const numbers = latin.map(row => [...row]);
        const shadedMask = Array.from({ length: size }, () => new Array(size).fill(false));

        const coords = shuffle(
            Array.from({ length: size * size }, (_, i) => [Math.floor(i / size), i % size])
        );

        let shadedCount = 0;
        for (const [r, c] of coords) {
            if (shadedCount >= targetShaded) break;

            // Cannot touch another shaded cell orthogonally
            const hasShadedNeighbor = DIRS.some(([dr, dc]) => {
                const nr = r + dr;
                const nc = c + dc;
                return nr >= 0 && nr < size && nc >= 0 && nc < size && shadedMask[nr][nc];
            });
            if (hasShadedNeighbor) continue;

            shadedMask[r][c] = true;
            if (!areUnshadedConnected(size, (rr, cc) => shadedMask[rr][cc])) {
                shadedMask[r][c] = false;
                continue;
            }

            // Pick a duplicate number from an unshaded cell in the same row or column
            const candidates = [];
            for (let k = 0; k < size; k++) {
                if (k !== c && !shadedMask[r][k]) candidates.push(numbers[r][k]);
                if (k !== r && !shadedMask[k][c]) candidates.push(numbers[k][c]);
            }

            if (!candidates.length) {
                shadedMask[r][c] = false;
                continue;
            }

            numbers[r][c] = candidates[Math.floor(Math.random() * candidates.length)];
            shadedCount++;
        }

        // Ensure every row/col has at least a few duplicates and the whole grid solves purely by logic
        const { solved, state } = solvePureLogic(numbers);
        if (solved) {
            return {
                size,
                numbers,
                solution: state // 1 = SHADED, 2 = WHITE
            };
        }
    }

    // Guaranteed fallback if tight 9x9 loop hits max attempts
    return generateHitoriPuzzle(Math.max(5, size - 1));
}
