import { initTheme } from '../shared/js/theme.js';
import { createGameStorage } from '../shared/js/storage.js';
import { applySEO } from '../shared/js/seo.js';

applySEO({
    siteName: 'GridWork',
    appName: 'GridWork — Pure Logic Puzzle Suite',
    title: 'GridWork — Pure Logic Sudoku & Nonograms',
    ogTitle: 'GridWork — Pure Logic Puzzle Suite',
    description:
        'A collection of free, accessible, zero-guess browser logic puzzles including 9×9 Sudoku and pure-logic Nonograms.',
    keywords:
        'GridWork, logic puzzles, pure logic Sudoku, Nonograms, Picross, free browser games, accessible web apps',
    baseUrl: 'https://brickeli.github.io/WebApps/GridWork/',
    ogImage: 'https://brickeli.github.io/WebApps/GridWork/shared/assets/og-gridwork.png',
    ogImageAlt: 'GridWork pure logic puzzle hub featuring Sudoku and Nonograms'
});

initTheme(document.getElementById('theme-menu-btn'));

const sudokuStorage = createGameStorage('gridwork_sudoku_stats');
const nonogramStorage = createGameStorage('gridwork_nonogram_stats');

const sudokuCount = sudokuStorage.getStats().length;
const nonogramCount = nonogramStorage.getStats().length;

const sudokuPill = document.getElementById('sudoku-stat-pill');
const nonogramPill = document.getElementById('nonogram-stat-pill');

if (sudokuPill) sudokuPill.textContent = `${sudokuCount} Solved`;
if (nonogramPill) nonogramPill.textContent = `${nonogramCount} Solved`;
