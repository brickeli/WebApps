// shared/js/grid.js
// Shared ARIA grid builder and keyboard navigation for every GridWork game.

const ARROWS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

/**
 * Where should focus go for this key? Handles arrows (clamped at the edges),
 * Home/End (row start/end) and Ctrl+Home/End (first/last cell).
 * Returns { r, c }, or null when the key isn't a navigation key.
 */
export function gridNavTarget(key, ctrl, r, c, rows, cols = rows) {
    const clamp = (v, max) => Math.max(0, Math.min(max, v));
    if (Object.prototype.hasOwnProperty.call(ARROWS, key)) {
        const [dr, dc] = ARROWS[key];
        return { r: clamp(r + dr, rows - 1), c: clamp(c + dc, cols - 1) };
    }
    if (key === 'Home') return { r: ctrl ? 0 : r, c: 0 };
    if (key === 'End') return { r: ctrl ? rows - 1 : r, c: cols - 1 };
    return null;
}

/**
 * Builds an accessible grid inside `el`: role="grid", row wrappers, gridcells with
 * row/column indexes, and a roving tabindex so the board is ONE Tab stop.
 *
 * createCell(r, c) returns the game's own cell element (class, children, listeners).
 * onFocusCell(r, c) fires whenever a cell receives focus (keyboard, click or script).
 */
export function createGrid({ el, rows, cols = rows, label, createCell, onFocusCell }) {
    el.innerHTML = '';
    el.setAttribute('role', 'grid');
    el.setAttribute('aria-label', label);
    el.setAttribute('aria-rowcount', String(rows));
    el.setAttribute('aria-colcount', String(cols));

    const cells = [];
    let tabbable = null;

    function setTabbableCell(cell) {
        if (!cell || cell === tabbable) return;
        tabbable?.setAttribute('tabindex', '-1');
        cell.setAttribute('tabindex', '0');
        tabbable = cell;
    }

    for (let r = 0; r < rows; r++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'board-row';
        rowEl.setAttribute('role', 'row');
        rowEl.setAttribute('aria-rowindex', String(r + 1));

        for (let c = 0; c < cols; c++) {
            const cell = createCell(r, c);
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-colindex', String(c + 1));
            cell.setAttribute('tabindex', '-1');
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.addEventListener('focus', () => {
                setTabbableCell(cell);
                onFocusCell?.(r, c);
            });
            rowEl.appendChild(cell);
            cells.push(cell);
        }
        el.appendChild(rowEl);
    }

    setTabbableCell(cells[0]);

    const cellAt = (r, c) => cells[r * cols + c];
    return {
        cells,
        cellAt,
        focus: (r, c) => cellAt(r, c)?.focus(),
        setTabbable: (r, c) => setTabbableCell(cellAt(r, c))
    };
}
