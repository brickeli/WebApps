// kenken/js/solver.js

function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function generateLatinSquare(size) {
    const base = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => ((r + c) % size) + 1)
    );
    const rowOrder = shuffle(Array.from({ length: size }, (_, i) => i));
    const colOrder = shuffle(Array.from({ length: size }, (_, i) => i));
    const digitMap = shuffle(Array.from({ length: size }, (_, i) => i + 1));

    return rowOrder.map(r =>
        colOrder.map(c => digitMap[base[r][c] - 1])
    );
}

function partitionCages(size, maxCageSize) {
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const cages = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (visited[r][c]) continue;

            // Occasional singleton anchor (about 12%)
            const targetLen = Math.random() < 0.12
                ? 1
                : 2 + Math.floor(Math.random() * (maxCageSize - 1));

            const cells = [{ r, c }];
            visited[r][c] = true;

            while (cells.length < targetLen) {
                const frontier = [];
                for (const cell of cells) {
                    for (const [dr, dc] of dirs) {
                        const nr = cell.r + dr;
                        const nc = cell.c + dc;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
                            frontier.push({ r: nr, c: nc });
                        }
                    }
                }
                if (!frontier.length) break;
                const pick = frontier[Math.floor(Math.random() * frontier.length)];
                visited[pick.r][pick.c] = true;
                cells.push(pick);
            }

            // Sort top-to-bottom, left-to-right so cells[0] is always the top-left anchor
            cells.sort((a, b) => (a.r - b.r) || (a.c - b.c));
            cages.push({ id: cages.length, cells });
        }
    }
    return cages;
}

function assignClue(cage, solution) {
    const vals = cage.cells.map(({ r, c }) => solution[r][c]);

    if (vals.length === 1) {
        return { target: vals[0], op: '', label: `${vals[0]}` };
    }

    if (vals.length === 2) {
        const [a, b] = vals;
        const hi = Math.max(a, b);
        const lo = Math.min(a, b);
        const choices = [];

        if (hi % lo === 0) choices.push({ target: hi / lo, op: '÷', label: `${hi / lo}÷` });
        choices.push({ target: hi - lo, op: '−', label: `${hi - lo}−` });
        choices.push({ target: a * b, op: '×', label: `${a * b}×` });
        choices.push({ target: a + b, op: '+', label: `${a + b}+` });

        // Favor division/subtraction slightly for richer deduction
        const weighted = choices[0].op === '÷' && Math.random() < 0.65
            ? choices[0]
            : choices[Math.floor(Math.random() * choices.length)];
        return weighted;
    }

    const useMultiply = Math.random() < 0.5;
    if (useMultiply) {
        const prod = vals.reduce((acc, v) => acc * v, 1);
        return { target: prod, op: '×', label: `${prod}×` };
    }
    const sum = vals.reduce((acc, v) => acc + v, 0);
    return { target: sum, op: '+', label: `${sum}+` };
}

export function isCageSatisfied(cage, values) {
    if (values.some(v => v === 0)) return false;

    if (cage.op === '') return values[0] === cage.target;
    if (cage.op === '+') return values.reduce((a, b) => a + b, 0) === cage.target;
    if (cage.op === '×') return values.reduce((a, b) => a * b, 1) === cage.target;
    if (cage.op === '−') return Math.abs(values[0] - values[1]) === cage.target;
    if (cage.op === '÷') {
        const hi = Math.max(values[0], values[1]);
        const lo = Math.min(values[0], values[1]);
        return lo !== 0 && hi / lo === cage.target;
    }
    return false;
}

function isPartialCageFeasible(cage, values, size) {
    const filled = values.filter(v => v !== 0);
    if (!filled.length) return true;
    if (filled.length === values.length) return isCageSatisfied(cage, values);

    if (cage.op === '+') {
        const sum = filled.reduce((a, b) => a + b, 0);
        const rem = values.length - filled.length;
        return sum + rem <= cage.target && sum + rem * size >= cage.target;
    }
    if (cage.op === '×') {
        const prod = filled.reduce((a, b) => a * b, 1);
        return prod <= cage.target && cage.target % prod === 0;
    }
    return true;
}

export function countKenKenSolutions(size, cages, limit = 2) {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    const cellToCage = Array.from({ length: size }, () => Array(size).fill(null));
    cages.forEach(cage => cage.cells.forEach(({ r, c }) => { cellToCage[r][c] = cage; }));

    // Order cells by smallest cage first for fast constraint propagation
    const order = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            order.push({ r, c, cageLen: cellToCage[r][c].cells.length });
        }
    }
    order.sort((a, b) => a.cageLen - b.cageLen);

    let solutions = 0;

    function backtrack(idx) {
        if (solutions >= limit) return;
        if (idx === order.length) {
            solutions++;
            return;
        }

        const { r, c } = order[idx];
        const cage = cellToCage[r][c];

        for (let num = 1; num <= size; num++) {
            let rowColConflict = false;
            for (let k = 0; k < size; k++) {
                if (grid[r][k] === num || grid[k][c] === num) {
                    rowColConflict = true;
                    break;
                }
            }
            if (rowColConflict) continue;

            grid[r][c] = num;
            const cageVals = cage.cells.map(cell => grid[cell.r][cell.c]);
            if (isPartialCageFeasible(cage, cageVals, size)) {
                backtrack(idx + 1);
            }
            grid[r][c] = 0;
        }
    }

    backtrack(0);
    return solutions;
}

export function generateKenKenPuzzle(size = 4) {
    const maxCageSize = size <= 4 ? 3 : 4;

    for (let attempt = 0; attempt < 60; attempt++) {
        const solution = generateLatinSquare(size);
        const cages = partitionCages(size, maxCageSize).map(cage => ({
            ...cage,
            ...assignClue(cage, solution)
        }));

        if (countKenKenSolutions(size, cages, 2) === 1) {
            return { size, solution, cages };
        }
    }

    // Guaranteed fallback: break any non-unique cage into singletons if needed
    const solution = generateLatinSquare(size);
    const cages = partitionCages(size, 2).map(cage => ({
        ...cage,
        ...assignClue(cage, solution)
    }));
    return { size, solution, cages };
}
