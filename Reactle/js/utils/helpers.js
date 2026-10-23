export function hashDateString(str, seed = 0x97f29ac1) {
    let h1 = seed;
    for (let i = 0; i < str.length; i++) {
        let k1 = str.charCodeAt(i);
        k1 = Math.imul(k1, 0xcc9e2d51);
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = Math.imul(k1, 0x1b873593);
        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1 = Math.imul(h1, 5) + 0xe6546b64;
    }
    h1 ^= str.length;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;
    return h1 >>> 0;
}

// Returns today's date formatted as 'YYYY-MM-DD'*/
export function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

// Calculates the Daily Challenge number relative to a launch date*/
export function getDailyChallengeNumber(launchDateStr = '2026-01-01') {
    const launchDate = new Date(launchDateStr);
    const today = new Date();
    return Math.floor((today - launchDate) / (1000 * 60 * 60 * 24)) + 1;
}

export function startDailyCountdownTimer(containerEl) {
    function updateTimer() {
        const now = new Date();
        const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const diffMs = nextReset - now;

        const h = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const s = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');

        if (containerEl) {
            containerEl.innerHTML = `<i class="fa-solid fa-clock text-amber-500 mr-1"></i> Next Daily in ${h}:${m}:${s}`;
        }
    }
    updateTimer();
    if (window.dailyTimerInterval) clearInterval(window.dailyTimerInterval);
    window.dailyTimerInterval = setInterval(updateTimer, 1000);
}

// Calculates rounded accuracy percentage from correct and attempt counts
export function calculateAccuracy(correct, attempts) {
    if (!attempts || attempts <= 0) return 0;
    return Math.round((correct / attempts) * 100);
}

// Create subscripts within Custom Solver
export function formatSubscripts(formulaStr) {
    if (!formulaStr) return '';
    return formulaStr.replace(/([A-Za-z\)])(\d+)/g, '$1<sub>$2</sub>');
}

// Selects a random item from an array that differs from the current item
export function getRandomDifferentItem(array, currentItem) {
    if (!array || array.length === 0) return null;
    if (array.length === 1) return array[0];

    let nextItem;
    do {
        nextItem = array[Math.floor(Math.random() * array.length)];
    } while (nextItem === currentItem);

    return nextItem;
}
