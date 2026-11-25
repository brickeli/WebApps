const STATS_KEY = 'gridwork_nonogram_stats';
const THEME_KEY = 'gridwork_theme';

export function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
}

export function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}

export function getStats() {
    try {
        return JSON.parse(localStorage.getItem(STATS_KEY)) || [];
    } catch {
        return [];
    }
}

export function savePuzzleStat({ difficultyLabel, size, hintsUsed, timeStr, secondsElapsed }) {
    const stats = getStats();
    const now = new Date();

    stats.push({
        timestamp: now.getTime(),
        date: now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        difficulty: `${difficultyLabel} (${size}×${size})`,
        hints: hintsUsed,
        time: timeStr,
        timeVal: secondsElapsed
    });

    localStorage.setItem(STATS_KEY, JSON.stringify(stats.slice(-50)));
}
