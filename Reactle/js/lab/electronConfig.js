import { PERIODIC_TABLE } from '../data/periodicTable.js';
import { playSound } from '../engine/audio.js';

// Standard Aufbau filling sequence (n + l rule)
const AUFBAU_SUBSHELLS = [
    { label: '1s', n: 1, l: 0, max: 2, boxes: 1 },
    { label: '2s', n: 2, l: 0, max: 2, boxes: 1 },
    { label: '2p', n: 2, l: 1, max: 6, boxes: 3 },
    { label: '3s', n: 3, l: 0, max: 2, boxes: 1 },
    { label: '3p', n: 3, l: 1, max: 6, boxes: 3 },
    { label: '4s', n: 4, l: 0, max: 2, boxes: 1 },
    { label: '3d', n: 3, l: 2, max: 10, boxes: 5 },
    { label: '4p', n: 4, l: 1, max: 6, boxes: 3 },
    { label: '5s', n: 5, l: 0, max: 2, boxes: 1 },
    { label: '4d', n: 4, l: 2, max: 10, boxes: 5 },
    { label: '5p', n: 5, l: 1, max: 6, boxes: 3 },
    { label: '6s', n: 6, l: 0, max: 2, boxes: 1 },
    { label: '4f', n: 4, l: 3, max: 14, boxes: 7 },
    { label: '5d', n: 5, l: 2, max: 10, boxes: 5 },
    { label: '6p', n: 6, l: 1, max: 6, boxes: 3 },
    { label: '7s', n: 7, l: 0, max: 2, boxes: 1 },
    { label: '5f', n: 5, l: 3, max: 14, boxes: 7 },
    { label: '6d', n: 6, l: 2, max: 10, boxes: 5 },
    { label: '7p', n: 7, l: 1, max: 6, boxes: 3 }
];

const NOBLE_GASES = [
    { z: 86, symbol: 'Rn' },
    { z: 54, symbol: 'Xe' },
    { z: 36, symbol: 'Kr' },
    { z: 18, symbol: 'Ar' },
    { z: 10, symbol: 'Ne' },
    { z: 2,  symbol: 'He' }
];

// Ground-state experimental exceptions to the strict Madelung (n + l) rule
const EXCEPTIONS = {
    24: { adjustments: { '4s': 1, '3d': 5 }, note: 'Chromium (Z=24) promotes one 4s electron into 3d to achieve extra stability from two half-filled subshells (4s¹ 3d⁵).' },
    29: { adjustments: { '4s': 1, '3d': 10 }, note: 'Copper (Z=29) promotes one 4s electron into 3d to achieve a completely filled 3d¹⁰ subshell (4s¹ 3d¹⁰).' },
    41: { adjustments: { '5s': 1, '4d': 4 }, note: 'Niobium (Z=41) favors 5s¹ 4d⁴ due to reduced electron-electron repulsion in the 4d orbitals.' },
    42: { adjustments: { '5s': 1, '4d': 5 }, note: 'Molybdenum (Z=42) promotes a 5s electron to reach a symmetric half-filled 4d⁵ subshell (5s¹ 4d⁵).' },
    44: { adjustments: { '5s': 1, '4d': 7 }, note: 'Ruthenium (Z=44) adopts a 5s¹ 4d⁷ ground-state configuration.' },
    45: { adjustments: { '5s': 1, '4d': 8 }, note: 'Rhodium (Z=45) adopts a 5s¹ 4d⁸ ground-state configuration.' },
    46: { adjustments: { '5s': 0, '4d': 10 }, note: 'Palladium (Z=46) promotes both 5s electrons to achieve a completely filled 4d¹⁰ subshell (5s⁰ 4d¹⁰).' },
    47: { adjustments: { '5s': 1, '4d': 10 }, note: 'Silver (Z=47) promotes a 5s electron to complete its 4d¹⁰ subshell (5s¹ 4d¹⁰).' },
    57: { adjustments: { '4f': 0, '5d': 1 }, note: 'Lanthanum (Z=57) places its differentiating electron into 5d¹ before 4f begins filling.' },
    58: { adjustments: { '4f': 1, '5d': 1 }, note: 'Cerium (Z=58) occupies both 4f¹ and 5d¹ orbitals in its ground state.' },
    64: { adjustments: { '4f': 7, '5d': 1 }, note: 'Gadolinium (Z=64) places an electron in 5d¹ to preserve a stable half-filled 4f⁷ core.' },
    78: { adjustments: { '6s': 1, '5d': 9 }, note: 'Platinum (Z=78) adopts a 6s¹ 5d⁹ ground-state configuration due to relativistic orbital effects.' },
    79: { adjustments: { '6s': 1, '5d': 10 }, note: 'Gold (Z=79) promotes a 6s electron to complete a filled 5d¹⁰ subshell (6s¹ 5d¹⁰).' },
    89: { adjustments: { '5f': 0, '6d': 1 }, note: 'Actinium (Z=89) places its differentiating electron in 6d¹ before 5f begins filling.' },
    90: { adjustments: { '5f': 0, '6d': 2 }, note: 'Thorium (Z=90) occupies 6d² before 5f orbitals drop lower in energy.' },
    91: { adjustments: { '5f': 2, '6d': 1 }, note: 'Protactinium (Z=91) splits its valence electrons across 5f² and 6d¹.' },
    92: { adjustments: { '5f': 3, '6d': 1 }, note: 'Uranium (Z=92) has ground-state configuration [Rn] 7s² 5f³ 6d¹.' },
    93: { adjustments: { '5f': 4, '6d': 1 }, note: 'Neptunium (Z=93) has ground-state configuration [Rn] 7s² 5f⁴ 6d¹.' },
    96: { adjustments: { '5f': 7, '6d': 1 }, note: 'Curium (Z=96) keeps a half-filled 5f⁷ core by placing one electron in 6d¹.' },
    103: { adjustments: { '6d': 0, '7p': 1 }, note: 'Lawrencium (Z=103) exhibits a relativistic 7s² 5f¹⁴ 7p¹ ground state.' }
};

const QUICK_ELEMENTS = [
    { label: 'C (6)', z: 6 },
    { label: 'O (8)', z: 8 },
    { label: 'Ne (10)', z: 10 },
    { label: 'Cr (24)*', z: 24 },
    { label: 'Fe (26)', z: 26 },
    { label: 'Cu (29)*', z: 29 },
    { label: 'Ag (47)*', z: 47 },
    { label: 'Au (79)*', z: 79 }
];

const ELEMENTS_BY_Z = Object.entries(PERIODIC_TABLE)
    .map(([symbol, data]) => ({
        symbol,
        ...data,
        z: data.atomicNumber ?? data.z ?? data.number ?? 0
    }))
    .filter((el) => el.z > 0)
    .sort((a, b) => a.z - b.z);

const ELEMENT_MAP_BY_Z = new Map(ELEMENTS_BY_Z.map((el) => [el.z, el]));

function computeConfiguration(z) {
    let remaining = z;
    const filled = {};

    for (const sub of AUFBAU_SUBSHELLS) {
        if (remaining <= 0) {
            filled[sub.label] = 0;
        } else {
            const take = Math.min(sub.max, remaining);
            filled[sub.label] = take;
            remaining -= take;
        }
    }

    const exception = EXCEPTIONS[z] || null;
    if (exception) {
        for (const [subLabel, count] of Object.entries(exception.adjustments)) {
            filled[subLabel] = count;
        }
    }

    // Active subshells in Aufbau filling order
    const activeSubshells = AUFBAU_SUBSHELLS.filter((s) => filled[s.label] > 0).map((s) => ({
        ...s,
        count: filled[s.label]
    }));

    // Determine highest principal quantum number (n) for valence electrons
    const maxN = activeSubshells.reduce((max, s) => Math.max(max, s.n), 1);
    const valenceElectrons = activeSubshells
        .filter((s) => s.n === maxN)
        .reduce((sum, s) => sum + s.count, 0);

    // Full notation HTML (Aufbau order)
    const fullHTML = activeSubshells
        .map((s) => `${s.label}<sup>${s.count}</sup>`)
        .join(' ');

    // Noble gas core shorthand
    const core = NOBLE_GASES.find((ng) => ng.z < z);
    let shorthandHTML = fullHTML;
    if (core) {
        const coreFilled = {};
        let coreRem = core.z;
        for (const sub of AUFBAU_SUBSHELLS) {
            const take = Math.min(sub.max, Math.max(0, coreRem));
            coreFilled[sub.label] = take;
            coreRem -= take;
        }

        const outerParts = activeSubshells
            .filter((s) => s.count > (coreFilled[s.label] || 0))
            .map((s) => `${s.label}<sup>${s.count - (coreFilled[s.label] || 0)}</sup>`);

        shorthandHTML = `[${core.symbol}] ${outerParts.join(' ')}`;
    }

    return {
        activeSubshells,
        maxN,
        valenceElectrons,
        fullHTML,
        shorthandHTML,
        exception
    };
}

/**
 * Renders individual orbital boxes applying Hund's Rule:
 * 1. Fill one spin-up (↑) electron into each degenerate box first.
 * 2. Pair remaining electrons with spin-down (↓) arrows.
 */
function renderOrbitalBoxes(subshell) {
    const { boxes, count } = subshell;
    const upCount = Math.min(boxes, count);
    const downCount = Math.max(0, count - boxes);

    return Array.from({ length: boxes }, (_, idx) => {
        const hasUp = idx < upCount;
        const hasDown = idx < downCount;
        const stateCls = hasDown ? 'is-paired' : hasUp ? 'is-half' : 'is-empty';

        return `
            <div class="ec-box ${stateCls}" title="${subshell.label} orbital ${idx + 1}: ${hasDown ? 'Paired (↑↓)' : hasUp ? 'Unpaired (↑)' : 'Empty'}">
                <span class="ec-spin is-up ${hasUp ? 'is-filled' : ''}" aria-hidden="true">&uarr;</span>
                <span class="ec-spin is-down ${hasDown ? 'is-filled' : ''}" aria-hidden="true">&darr;</span>
            </div>
        `;
    }).join('');
}

/**
 * Renders a concentric Bohr shell SVG showing the nucleus, inner core rings,
 * and highlighted valence electrons on the outermost ring.
 */
function renderBohrDiagram(elem, cfg) {
    // Group electrons by principal quantum number n (1..7)
    const shellCounts = new Map();
    for (const sub of cfg.activeSubshells) {
        shellCounts.set(sub.n, (shellCounts.get(sub.n) || 0) + sub.count);
    }

    const maxN = cfg.maxN;
    const cx = 150;
    const cy = 150;
    const minRadius = 34;
    const maxRadius = 132;
    const step = maxN > 1 ? (maxRadius - minRadius) / (maxN - 1) : 0;

    let ringsSVG = '';
    let electronsSVG = '';

    for (let n = 1; n <= maxN; n++) {
        const count = shellCounts.get(n) || 0;
        const isValence = n === maxN;
        const r = maxN === 1 ? 68 : minRadius + (n - 1) * step;

        // Concentric shell ring
        ringsSVG += `
            <circle
                cx="${cx}"
                cy="${cy}"
                r="${r.toFixed(1)}"
                class="ec-bohr-ring ${isValence ? 'is-valence' : ''}"
            />
        `;

        // Distribute electron dots evenly around the ring (starting at 12 o'clock)
        for (let i = 0; i < count; i++) {
            const angle = (2 * Math.PI * i) / count - Math.PI / 2;
            const ex = cx + r * Math.cos(angle);
            const ey = cy + r * Math.sin(angle);
            const dotRadius = isValence ? 5.2 : count > 18 ? 2.6 : 3.4;

            electronsSVG += `
                <circle
                    cx="${ex.toFixed(1)}"
                    cy="${ey.toFixed(1)}"
                    r="${dotRadius}"
                    class="ec-bohr-dot ${isValence ? 'is-valence' : 'is-core'}"
                />
            `;
        }
    }

    // Build shell-by-shell breakdown pills (e.g., "2 · 8 · 14 · 2")
    const shellDistribution = Array.from({ length: maxN }, (_, idx) => {
        const n = idx + 1;
        const count = shellCounts.get(n) || 0;
        const isValence = n === maxN;
        return `<span class="ec-shell-pill ${isValence ? 'is-valence' : ''}">n=${n}: <strong>${count}</strong></span>`;
    }).join('');

    return `
        <div class="ec-bohr-panel">
            <div class="ec-bohr-stage">
                <svg
                    viewBox="0 0 300 300"
                    class="ec-bohr-svg"
                    role="img"
                    aria-label="Bohr shell diagram for ${elem.name} showing ${maxN} electron shells and ${cfg.valenceElectrons} valence electrons on the outermost ring"
                >
                    ${ringsSVG}
                    ${electronsSVG}
                    <!-- Central Nucleus -->
                    <circle cx="${cx}" cy="${cy}" r="20" class="ec-bohr-nucleus" />
                    <text x="${cx}" y="${cy + 1}" text-anchor="middle" dominant-baseline="middle" class="ec-bohr-nuc-sym">
                        ${elem.symbol}
                    </text>
                </svg>
            </div>

            <div class="ec-bohr-meta">
                <span class="lab-stat-label">Shell Distribution (Inner &rarr; Valence)</span>
                <div class="ec-shell-pills-row">${shellDistribution}</div>
                <p class="ec-bohr-caption">
                    <strong>${cfg.valenceElectrons}</strong> valence ${cfg.valenceElectrons === 1 ? 'electron' : 'electrons'} highlighted on the outermost ring (<strong>n = ${maxN}</strong>).
                </p>
            </div>
        </div>
    `;
}

export function mountTool(container) {
    let currentZ = 26; // Default to Iron (Fe, Z=26) — great showcase of 4s² 3d⁶ Hund's rule filling

    container.innerHTML = `
        <div class="lab-stack">
            <!-- Header & Element Controls -->
            <div class="lab-panel glass-panel">
                <span class="lab-eyebrow">
                    <i class="fa-solid fa-atom" aria-hidden="true"></i>
                    Quantum Orbitals
                </span>
                <h2 class="lab-heading">Electron Configuration Visualizer</h2>
                <p class="lab-subtitle">
                    Slide across atomic numbers or select an element to watch orbitals fill via the Aufbau principle and Hund’s rule (<code>*</code> marks Aufbau exceptions).
                </p>

                <div class="lab-presets mt-sm mb-md">
                    <span class="lab-presets-label">Quick pick:</span>
                    ${QUICK_ELEMENTS.map(
                        (q) => `<button type="button" class="lab-preset-btn ec-quick-btn" data-z="${q.z}">${q.label}</button>`
                    ).join('')}
                </div>

                <div class="ec-controls-grid">
                    <div class="lab-field">
                        <label for="ec-element-select" class="lab-label">Select Element (1–118)</label>
                        <select id="ec-element-select" name="element-select" class="lab-select">
                            ${ELEMENTS_BY_Z.map(
                                (el) => `<option value="${el.z}" ${el.z === currentZ ? 'selected' : ''}>#${el.z} — ${el.name} (${el.symbol})</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="lab-field">
                        <div class="ec-slider-top">
                            <label for="ec-z-slider" class="lab-label">Step Through Atomic Number (Z)</label>
                            <div class="ec-step-btns">
                                <button type="button" id="ec-prev-btn" class="lab-btn-ghost" title="Previous element (Z - 1)">&minus;1 e⁻</button>
                                <button type="button" id="ec-next-btn" class="lab-btn-ghost" title="Next element (Z + 1)">+1 e⁻</button>
                            </div>
                        </div>
                        <input
                            type="range"
                            id="ec-z-slider"
                            name="z-slider"
                            class="lab-range"
                            min="1"
                            max="118"
                            value="${currentZ}"
                        />
                    </div>
                </div>
            </div>

            <!-- Live Configuration Output -->
            <div id="ec-results" class="lab-stack" aria-live="polite"></div>
        </div>
    `;

    const selectEl = container.querySelector('#ec-element-select');
    const sliderEl = container.querySelector('#ec-z-slider');
    const prevBtn = container.querySelector('#ec-prev-btn');
    const nextBtn = container.querySelector('#ec-next-btn');
    const resultsEl = container.querySelector('#ec-results');

    function setAtomicNumber(newZ, withSound = false) {
        const clamped = Math.max(1, Math.min(118, Number(newZ) || 1));
        if (withSound && clamped !== currentZ) playSound('click');
        currentZ = clamped;
        selectEl.value = String(currentZ);
        sliderEl.value = String(currentZ);
        render();
    }

    function render() {
        const elem = ELEMENT_MAP_BY_Z.get(currentZ) || {
            z: currentZ,
            symbol: `E${currentZ}`,
            name: `Element ${currentZ}`
        };
        const cfg = computeConfiguration(currentZ);

        const exceptionBanner = cfg.exception
            ? `
                <div class="ec-exception-banner">
                    <i class="fa-solid fa-star" aria-hidden="true"></i>
                    <div>
                        <strong>Aufbau Exception:</strong> ${cfg.exception.note}
                    </div>
                </div>
            `
            : '';

        const subshellsHTML = cfg.activeSubshells
            .map((sub) => {
                const isValence = sub.n === cfg.maxN;
                return `
                    <div class="ec-subshell-card ${isValence ? 'is-valence' : ''}">
                        <div class="ec-subshell-head">
                            <span class="ec-subshell-label">${sub.label}<sup>${sub.count}</sup></span>
                            ${isValence ? '<span class="ec-valence-tag">Valence</span>' : ''}
                        </div>
                        <div class="ec-boxes-row">
                            ${renderOrbitalBoxes(sub)}
                        </div>
                    </div>
                `;
            })
            .join('');

        resultsEl.innerHTML = `
            <!-- Notation & Summary Card -->
            <div class="lab-panel glass-panel">
                <div class="ec-summary-top">
                    <div class="ec-elem-badge">
                        <span class="ec-elem-z">Z = ${elem.z}</span>
                        <strong class="ec-elem-sym">${elem.symbol}</strong>
                    </div>

                    <div class="ec-notations">
                        <div class="ec-notation-row">
                            <span class="lab-stat-label">Noble Gas Shorthand (${elem.name})</span>
                            <div class="ec-notation-val">${cfg.shorthandHTML}</div>
                        </div>
                        <div class="ec-notation-row">
                            <span class="lab-stat-label">Full Electron Configuration (${elem.z} e⁻)</span>
                            <div class="ec-notation-full">${cfg.fullHTML}</div>
                        </div>
                    </div>

                    <div class="ec-stats-pills">
                        <div class="lab-stat">
                            <span class="lab-stat-label">Outer Shell</span>
                            <strong class="lab-stat-val">n = ${cfg.maxN}</strong>
                        </div>
                        <div class="lab-stat">
                            <span class="lab-stat-label">Valence e⁻</span>
                            <strong class="lab-stat-val">${cfg.valenceElectrons}</strong>
                        </div>
                    </div>
                </div>

                ${exceptionBanner}
            </div>

            <!-- Visual Diagrams Grid: Bohr Shell Model + Aufbau Orbital Boxes -->
            <div class="ec-visuals-grid">
                <!-- Left: Bohr Shell & Valence Ring Diagram -->
                <div class="lab-panel glass-panel">
                    <h3 class="lab-section-title" style="margin-bottom: 0.2rem;">Bohr Shell Model</h3>
                    <p class="lab-subtitle" style="font-size: 0.82rem; margin-bottom: 0.85rem;">
                        Nucleus surrounded by occupied energy shells (<code>n = 1</code> to <code>${cfg.maxN}</code>), with outer valence electrons highlighted.
                    </p>
                    ${renderBohrDiagram(elem, cfg)}
                </div>

                <!-- Right: Aufbau Orbital Box Diagram -->
                <div class="lab-panel glass-panel">
                    <div class="ec-diagram-head">
                        <div>
                            <h3 class="lab-section-title" style="margin-bottom: 0.2rem;">Aufbau Orbital Box Diagram</h3>
                            <p class="lab-subtitle" style="font-size: 0.82rem;">
                                Orbitals fill from lowest energy (<code>1s</code>) upward; degenerate boxes take one parallel spin (<code>&uarr;</code>) before pairing (<code>&uarr;&darr;</code>).
                            </p>
                        </div>
                        <div class="ec-legend">
                            <span><i class="ec-dot is-half"></i> Unpaired (&uarr;)</span>
                            <span><i class="ec-dot is-paired"></i> Paired (&uarr;&darr;)</span>
                            <span><i class="ec-dot is-valence"></i> Outer Shell (n=${cfg.maxN})</span>
                        </div>
                    </div>

                    <div class="ec-orbitals-grid">
                        ${subshellsHTML}
                    </div>
                </div>
            </div>
        `;
    }

    selectEl.addEventListener('change', (e) => setAtomicNumber(e.target.value, true));
    sliderEl.addEventListener('input', (e) => setAtomicNumber(e.target.value, false));
    prevBtn.addEventListener('click', () => setAtomicNumber(currentZ - 1, true));
    nextBtn.addEventListener('click', () => setAtomicNumber(currentZ + 1, true));

    container.querySelectorAll('.ec-quick-btn').forEach((btn) => {
        btn.addEventListener('click', () => setAtomicNumber(btn.dataset.z, true));
    });

    render();
}
