// js/dev.js

/**
 * Developer Utilities for Arcana Tarot
 * Automatically exposes helpers to window when ?dev or localhost is detected.
 */
export function initDevTools() {
    const isDevEnv = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.search.includes('dev');

    if (!isDevEnv) return;

    window.tarotDev = {
        // Clear daily locks so you can draw again immediately
        resetDaily() {
            localStorage.removeItem('arcana_last_single_date');
            localStorage.removeItem('arcana_last_triple_date');
            localStorage.removeItem('arcana_saved_single_card');
            localStorage.removeItem('arcana_saved_single_reversed');
            localStorage.removeItem('arcana_saved_triple_cards');
            localStorage.removeItem('arcana_saved_triple_reversed');
            console.log('✦ [DevTools] Daily draw locks and saved cards cleared. Refreshing...');
            window.location.reload();
        },

        // Force a specific card test (e.g., test upright vs reversed rendering)
        forceReversed(forceState = true) {
            localStorage.setItem('arcana_saved_single_reversed', String(forceState));
            console.log(`✦ [DevTools] Single card forced reversed state: ${forceState}. Refreshing...`);
            window.location.reload();
        },

        // Print current storage state to console
        inspectStorage() {
            const keys = [
                'arcana_last_single_date', 'arcana_saved_single_card', 'arcana_saved_single_reversed',
                'arcana_last_triple_date', 'arcana_saved_triple_cards', 'arcana_saved_triple_reversed'
            ];
            const data = {};
            keys.forEach(k => data[k] = localStorage.getItem(k));
            console.table(data);
        }
    };

    console.log('🛠️ [DevTools] Active! Type tarotDev.resetDaily() or tarotDev.inspectStorage() in the console.');
}
