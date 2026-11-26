import { PIXEL_ART_PUZZLES } from './pixelArtLibrary.js';
import { generatePureLogicPuzzle } from './solver.js';

export function getPuzzleForMode(mode, size, difficulty = 'medium') {
    if (mode === 'pixel-art') {
        const solvedIds = JSON.parse(localStorage.getItem('gridwork_nonograms_pixel_solved') || '[]');
        const remaining = PIXEL_ART_PUZZLES.filter(p => !solvedIds.includes(p.id));
        const pool = remaining.length > 0 ? remaining : PIXEL_ART_PUZZLES;
        const chosen = pool[Math.floor(Math.random() * pool.length)];

        return {
            grid: chosen.grid,
            size: chosen.grid.length,
            pixelMeta: {
                id: chosen.id,
                title: chosen.title,
                aliases: chosen.aliases,
                category: chosen.category
            }
        };
    }

    return {
        grid: generatePureLogicPuzzle(size, difficulty),
        size,
        pixelMeta: null
    };
}

export function checkPixelArtGuess(rawInput, pixelMeta) {
    if (!pixelMeta || !rawInput) return false;

    const normalized = rawInput
        .toLowerCase()
        .trim()
        .replace(/^(a|an|the)\s+/i, '')
        .replace(/[^a-z0-9\s]/g, '');

    return pixelMeta.aliases.some(alias => alias.toLowerCase() === normalized);
}
