
//Validates Sudoku placement against row, column, and 3x3 box rules.
export function isValid(arr, index, num) {
    let row = Math.floor(index / 9);
    let col = index % 9;

    for (let i = 0; i < 9; i++) {
        if (arr[row * 9 + i] === num) return false;
        if (arr[i * 9 + col] === num) return false;
    }

    let startRow = Math.floor(row / 3) * 3;
    let startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (arr[(startRow + r) * 9 + (startCol + c)] === num) return false;
        }
    }
    return true;
}

//Recursively solves an 81-length Sudoku board array in place.
export function solveSudoku(arr) {
    for (let i = 0; i < 81; i++) {
        if (arr[i] === 0) {
            let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            for (let num of nums) {
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

//Returns valid candidate numbers for an empty cell.
export function getValidCandidates(arr, index) {
    if (arr[index] !== 0) return [];
    let candidates = [];
    for (let num = 1; num <= 9; num++) {
        if (isValid(arr, index, num)) {
            candidates.push(num);
        }
    }
    return candidates;
}
