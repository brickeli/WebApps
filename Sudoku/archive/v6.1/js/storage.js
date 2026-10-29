let currentSortColumn = 'date';
let currentSortAscending = false;

/**
 * Saves a completed game session to localStorage.
 */
export function saveStats(timerSeconds, difficultyLabel, hintCount) {
    let stats = JSON.parse(localStorage.getItem('sudoku_stats') || '[]');
    stats.push({
        time: timerSeconds,
        difficulty: difficultyLabel,
        hints: hintCount,
        date: new Date().toISOString()
    });
    stats.sort((a, b) => a.time - b.time);
    if (stats.length > 25) {
        stats = stats.slice(0, 25);
    }
    localStorage.setItem('sudoku_stats', JSON.stringify(stats));
}

/**
 * Renders the stats table rows inside the modal.
 */
export function renderStatsTable(statsBodyEl, formatTimeFn) {
    let stats = JSON.parse(localStorage.getItem('sudoku_stats') || '[]');

    stats.sort((a, b) => {
        let valA = a[currentSortColumn];
        let valB = b[currentSortColumn];
        if (valA < valB) return currentSortAscending ? -1 : 1;
        if (valA > valB) return currentSortAscending ? 1 : -1;
        return 0;
    });

    statsBodyEl.innerHTML = '';
    if (stats.length === 0) {
        statsBodyEl.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b;">No completed games yet!</td></tr>`;
        return;
    }

    stats.forEach(stat => {
        let row = document.createElement('tr');
        let formattedDate = new Date(stat.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${stat.difficulty}</td>
            <td style="text-align: center;">${stat.hints}</td>
            <td>${formatTimeFn(stat.time)}</td>
        `;
        statsBodyEl.appendChild(row);
    });
}

/**
 * Handles column sorting toggles for stats.
 */
export function sortStats(column, statsBodyEl, formatTimeFn) {
    if (currentSortColumn === column) {
        currentSortAscending = !currentSortAscending;
    } else {
        currentSortColumn = column;
        currentSortAscending = true;
    }
    renderStatsTable(statsBodyEl, formatTimeFn);
}
