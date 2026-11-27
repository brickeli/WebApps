// js/hub.js
import { initTheme } from '../shared/js/theme.js';
import { createGameStorage } from '../shared/js/storage.js';
import { applySEO } from '../shared/js/seo.js';

applySEO({
    siteName: 'GridWork',
    appName: 'GridWork — Pure Logic Puzzle Suite',
    title: 'GridWork — Pure Logic Sudoku, Nonograms, Hitori & KenKen',
    ogTitle: 'GridWork — Pure Logic Puzzle Suite',
    description:
        'A collection of free, accessible, zero-guess browser logic puzzles including 9×9 Sudoku, Nonograms, Hitori, and KenKen.',
    keywords:
        'GridWork, logic puzzles, pure logic Sudoku, Nonograms, Picross, Hitori, KenKen, Calcudoku, free browser games, accessible web apps',
    baseUrl: 'https://brickeli.github.io/WebApps/GridWork/',
    ogImage: 'https://brickeli.github.io/WebApps/GridWork/shared/assets/og-gridwork.png',
    ogImageAlt: 'GridWork pure logic puzzle hub featuring Sudoku, Nonograms, Hitori, and KenKen'
});

initTheme(document.getElementById('theme-menu-btn'));

const GAMES = [
    { storageKey: 'gridwork_sudoku_stats', pillId: 'sudoku-stat-pill' },
    { storageKey: 'gridwork_nonogram_stats', pillId: 'nonogram-stat-pill' },
    { storageKey: 'gridwork_hitori_stats', pillId: 'hitori-stat-pill' },
    { storageKey: 'gridwork_kenken_stats', pillId: 'kenken-stat-pill' }
];

GAMES.forEach(({ storageKey, pillId }) => {
    const pill = document.getElementById(pillId);
    if (!pill) return;

    const count = createGameStorage(storageKey).getStats().length;
    pill.textContent = `${count} Solved`;
});
