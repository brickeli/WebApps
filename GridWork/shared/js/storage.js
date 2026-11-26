// shared/js/storage.js
export function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

export function createGameStorage(storageKey, maxEntries = 50) {
    function getStats() {
        try {
            return JSON.parse(localStorage.getItem(storageKey)) || [];
        } catch {
            return [];
        }
    }

    function saveStat({ difficulty, hints, timeVal }) {
        const stats = getStats();
        const now = new Date();

        stats.push({
            timestamp: now.getTime(),
            date: now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            difficulty,
            hints,
            time: formatTime(timeVal),
            timeVal
        });

        localStorage.setItem(storageKey, JSON.stringify(stats.slice(-maxEntries)));
    }

    return { getStats, saveStat };
}
