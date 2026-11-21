import { playSound } from '../engine/audio.js';

const EVERYDAY_SAMPLES = [
    { label: 'Battery Acid (0.5)', ph: 0.5 },
    { label: 'Lemon Juice (2.2)', ph: 2.2 },
    { label: 'Black Coffee (4.5)', ph: 4.5 },
    { label: 'Pure Water (7.0)', ph: 7.0 },
    { label: 'Human Blood (7.4)', ph: 7.4 },
    { label: 'Baking Soda (8.3)', ph: 8.3 },
    { label: 'Ammonia (11.5)', ph: 11.5 },
    { label: 'Bleach (13.0)', ph: 13.0 }
];

const STRONG_PRESETS = [
    { label: '0.1 M HCl', type: 'acid', conc: 0.1 },
    { label: '0.01 M HCl', type: 'acid', conc: 0.01 },
    { label: '1×10⁻⁵ M HNO₃', type: 'acid', conc: 0.00001 },
    { label: '0.001 M NaOH', type: 'base', conc: 0.001 },
    { label: '0.1 M KOH', type: 'base', conc: 0.1 }
];

const WEAK_PRESETS = [
    { label: '0.1 M Acetic Acid', type: 'acid', k: 1.8e-5, conc: 0.1 },
    { label: '0.1 M Formic Acid', type: 'acid', k: 1.8e-4, conc: 0.1 },
    { label: '0.05 M HF', type: 'acid', k: 6.8e-4, conc: 0.05 },
    { label: '0.1 M Ammonia (NH₃)', type: 'base', k: 1.8e-5, conc: 0.1 }
];

const BUFFER_PRESETS = [
    { label: 'Acetate (pKa 4.76)', pka: 4.76, acid: 0.1, base: 0.1 },
    { label: 'Phosphate (pKa 7.20)', pka: 7.20, acid: 0.1, base: 0.15 },
    { label: 'Blood Bicarbonate (pKa 6.10)', pka: 6.10, acid: 0.0012, base: 0.024 },
    { label: 'Tris Buffer (pKa 8.06)', pka: 8.06, acid: 0.05, base: 0.05 }
];

const SCALE_BENCHMARKS = [
    { ph: 0.5, label: 'Battery Acid' },
    { ph: 2.2, label: 'Lemon Juice' },
    { ph: 4.5, label: 'Coffee' },
    { ph: 7.0, label: 'Pure Water' },
    { ph: 7.4, label: 'Blood' },
    { ph: 10.5, label: 'Magnesia' },
    { ph: 13.0, label: 'Bleach' }
];

function formatSci(val) {
    if (!Number.isFinite(val) || val <= 0) return '0';
    if (val >= 0.001 && val < 1000) {
        return Number(val.toPrecision(4)).toString();
    }
    return val.toExponential(2).replace('+', '');
}

function formatFoldFactor(diff) {
    const fold = Math.pow(10, Math.abs(diff));
    if (fold < 1000) return `${Math.round(fold).toLocaleString('en-US')}×`;
    return `${fold.toExponential(1).replace('+', '')}×`;
}

function classifyPH(ph) {
    const deltaFromNeutral = ph - 7.0;
    let foldHint = 'Balanced [H₃O⁺] and [OH⁻] ions (neutral point at 25 °C).';
    if (deltaFromNeutral <= -0.15) {
        foldHint = `Every 1-unit drop is 10× stronger acid — this is ~${formatFoldFactor(deltaFromNeutral)} more acidic than pure water.`;
    } else if (deltaFromNeutral >= 0.15) {
        foldHint = `Every 1-unit rise is 10× more alkaline — this is ~${formatFoldFactor(deltaFromNeutral)} more basic than pure water.`;
    }

    if (ph < 2.0) {
        return {
            label: 'Strongly Acidic',
            cls: 'is-strong-acid',
            detail: `High concentration of hydrogen/hydronium ions ([H₃O⁺] > 0.01 M). ${foldHint}`
        };
    }
    if (ph < 6.5) {
        return {
            label: 'Moderately / Weakly Acidic',
            cls: 'is-weak-acid',
            detail: `Hydronium ions outnumber hydroxide ions ([H₃O⁺] > [OH⁻]). ${foldHint}`
        };
    }
    if (ph <= 7.5) {
        return {
            label: 'Neutral Range',
            cls: 'is-neutral',
            detail: `Right around pH 7.0 where [H₃O⁺] ≈ [OH⁻] = 1.0 × 10⁻⁷ M. ${foldHint}`
        };
    }
    if (ph <= 12.0) {
        return {
            label: 'Moderately / Weakly Basic',
            cls: 'is-weak-base',
            detail: `Hydroxide ions outnumber hydronium ions ([OH⁻] > [H₃O⁺]). ${foldHint}`
        };
    }
    return {
        label: 'Strongly Basic (Alkaline)',
        cls: 'is-strong-base',
        detail: `High concentration of hydroxide ions ([OH⁻] > 0.01 M). ${foldHint}`
    };
}

function solveFromDirectPH(rawPH) {
    const Kw = 1e-14;
    const ph = Math.max(0, Math.min(14, rawPH));
    const poh = 14 - ph;
    const hPlus = Math.pow(10, -ph);
    const ohMinus = Kw / hPlus;
    return {
        ph,
        poh,
        hPlus,
        ohMinus,
        formulaText: `[H₃O⁺] = 10^(−${ph.toFixed(2)}) = ${formatSci(hPlus)} M  |  pH + pOH = 14`
    };
}

function solveStrong(speciesType, concentration) {
    const Kw = 1e-14;
    const c = Math.max(0, concentration);
    if (speciesType === 'acid') {
        const hPlus = 0.5 * (c + Math.sqrt(c * c + 4 * Kw));
        const ohMinus = Kw / hPlus;
        const ph = -Math.log10(hPlus);
        return {
            ph,
            poh: 14 - ph,
            hPlus,
            ohMinus,
            formulaText: `pH = −log₁₀([H₃O⁺]) = −log₁₀(${formatSci(hPlus)}) = ${ph.toFixed(2)}`
        };
    } else {
        const ohMinus = 0.5 * (c + Math.sqrt(c * c + 4 * Kw));
        const hPlus = Kw / ohMinus;
        const ph = -Math.log10(hPlus);
        const poh = 14 - ph;
        return {
            ph,
            poh,
            hPlus,
            ohMinus,
            formulaText: `pOH = −log₁₀(${formatSci(ohMinus)}) = ${poh.toFixed(2)}  →  pH = 14 − ${poh.toFixed(2)} = ${ph.toFixed(2)}`
        };
    }
}

function solveWeak(speciesType, concentration, kVal) {
    const Kw = 1e-14;
    const c = Math.max(1e-12, concentration);
    const k = Math.max(1e-16, kVal);
    const x = 0.5 * (-k + Math.sqrt(k * k + 4 * k * c));
    const pctIonized = Math.min(100, (x / c) * 100);

    if (speciesType === 'acid') {
        const hPlus = Math.max(x, 1e-7);
        const ohMinus = Kw / hPlus;
        const ph = -Math.log10(hPlus);
        return {
            ph,
            poh: 14 - ph,
            hPlus,
            ohMinus,
            pctIonized,
            formulaText: `[H₃O⁺] = ${formatSci(hPlus)} M (${pctIonized.toFixed(2)}% ionized)  →  pH = ${ph.toFixed(2)}`
        };
    } else {
        const ohMinus = Math.max(x, 1e-7);
        const hPlus = Kw / ohMinus;
        const ph = -Math.log10(hPlus);
        return {
            ph,
            poh: 14 - ph,
            hPlus,
            ohMinus,
            pctIonized,
            formulaText: `[OH⁻] = ${formatSci(ohMinus)} M (${pctIonized.toFixed(2)}% ionized)  →  pH = ${ph.toFixed(2)}`
        };
    }
}

function solveBuffer(pka, acidConc, baseConc) {
    const Kw = 1e-14;
    const ha = Math.max(1e-9, acidConc);
    const aMinus = Math.max(1e-9, baseConc);
    const ratio = aMinus / ha;
    const ph = pka + Math.log10(ratio);
    const hPlus = Math.pow(10, -ph);
    const ohMinus = Kw / hPlus;
    const inRange = Math.abs(ph - pka) <= 1.0;
    return {
        ph,
        poh: 14 - ph,
        hPlus,
        ohMinus,
        pka,
        inRange,
        formulaText: `pH = ${pka.toFixed(2)} + log₁₀(${aMinus} / ${ha}) = ${ph.toFixed(2)}`
    };
}

export function mountTool(container) {
    let mode = 'direct'; // Default to 'direct' (Interactive pH Explorer) for intuitive first-time learning

    container.innerHTML = `
        <div class="lab-stack">
            <!-- Header & Mode Switcher -->
            <div class="lab-panel glass-panel">
                <span class="lab-eyebrow">
                    <i class="fa-solid fa-vial-circle-check" aria-hidden="true"></i>
                    Aqueous Equilibria
                </span>
                <h2 class="lab-heading">pH &amp; Buffer Explorer</h2>
                <p class="lab-subtitle">
                    Drag the pH slider or tap an everyday liquid to see how acidity, ion concentration, and color relate—or switch tabs to solve lab molarity and buffer problems.
                </p>

                <div class="lab-tabs mt-md" role="tablist" aria-label="Calculation mode">
                    <button type="button" class="lab-tab is-active" data-mode="direct" role="tab" aria-selected="true">
                        <i class="fa-solid fa-sliders" aria-hidden="true"></i>
                        <span>Interactive pH Explorer</span>
                    </button>
                    <button type="button" class="lab-tab" data-mode="strong" role="tab" aria-selected="false">
                        <i class="fa-solid fa-bolt" aria-hidden="true"></i>
                        <span>Strong Acid / Base</span>
                    </button>
                    <button type="button" class="lab-tab" data-mode="weak" role="tab" aria-selected="false">
                        <i class="fa-solid fa-scale-unbalanced" aria-hidden="true"></i>
                        <span>Weak Acid / Base</span>
                    </button>
                    <button type="button" class="lab-tab" data-mode="buffer" role="tab" aria-selected="false">
                        <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
                        <span>Buffer (pKa)</span>
                    </button>
                </div>
            </div>

            <!-- Interactive Input Controls Card -->
            <div class="lab-panel glass-panel">
                <!-- MODE 1 (DEFAULT): INTERACTIVE pH EXPLORER -->
                <div id="ph-panel-direct" class="ph-mode-panel">
                    <div class="lab-presets mb-md">
                        <span class="lab-presets-label">Everyday examples:</span>
                        ${EVERYDAY_SAMPLES.map(
                            (s) => `<button type="button" class="lab-preset-btn ph-sample-btn" data-ph="${s.ph}">${s.label}</button>`
                        ).join('')}
                    </div>

                    <div class="ph-form-grid">
                        <div class="lab-field">
                            <label for="ph-direct-range" class="lab-label">Slide Along the 0–14 pH Scale</label>
                            <input
                                type="range"
                                id="ph-direct-range"
                                name="direct-ph-range"
                                class="lab-range"
                                min="0"
                                max="14"
                                step="0.1"
                                value="7.0"
                            />
                        </div>

                        <div class="lab-field">
                            <label for="ph-direct-num" class="lab-label">Or Type an Exact pH (0 – 14)</label>
                            <input type="number" id="ph-direct-num" name="direct-ph" class="lab-input is-mono" step="0.1" min="0" max="14" value="7.0" />
                        </div>
                    </div>
                </div>

                <!-- MODE 2: STRONG ACID / BASE -->
                <div id="ph-panel-strong" class="ph-mode-panel hidden">
                    <div class="lab-presets mb-md">
                        <span class="lab-presets-label">Lab samples:</span>
                        ${STRONG_PRESETS.map(
                            (p, idx) => `<button type="button" class="lab-preset-btn ph-strong-preset" data-idx="${idx}">${p.label}</button>`
                        ).join('')}
                    </div>

                    <div class="ph-form-grid">
                        <div class="lab-field">
                            <label for="ph-strong-type" class="lab-label">Solution Type</label>
                            <select id="ph-strong-type" name="strong-type" class="lab-select">
                                <option value="acid">Strong Acid (e.g., HCl, HNO₃)</option>
                                <option value="base">Strong Base (e.g., NaOH, KOH)</option>
                            </select>
                        </div>

                        <div class="lab-field">
                            <label for="ph-strong-conc" class="lab-label">Concentration in Molarity (M = mol/L)</label>
                            <input type="number" id="ph-strong-conc" name="strong-conc" class="lab-input is-mono" step="any" min="0" value="0.01" placeholder="e.g., 0.01" />
                        </div>
                    </div>
                </div>

                <!-- MODE 3: WEAK ACID / BASE -->
                <div id="ph-panel-weak" class="ph-mode-panel hidden">
                    <div class="lab-presets mb-md">
                        <span class="lab-presets-label">Lab samples:</span>
                        ${WEAK_PRESETS.map(
                            (p, idx) => `<button type="button" class="lab-preset-btn ph-weak-preset" data-idx="${idx}">${p.label}</button>`
                        ).join('')}
                    </div>

                    <div class="ph-form-grid">
                        <div class="lab-field">
                            <label for="ph-weak-type" class="lab-label">Species Type</label>
                            <select id="ph-weak-type" name="weak-type" class="lab-select">
                                <option value="acid">Weak Acid (uses Ka)</option>
                                <option value="base">Weak Base (uses Kb)</option>
                            </select>
                        </div>

                        <div class="lab-field">
                            <label for="ph-weak-conc" class="lab-label">Initial Concentration C₀ (M)</label>
                            <input type="number" id="ph-weak-conc" name="weak-conc" class="lab-input is-mono" step="any" min="0.0000001" value="0.1" />
                        </div>

                        <div class="lab-field">
                            <label for="ph-weak-k" class="lab-label">Dissociation Constant (Ka or Kb)</label>
                            <input type="number" id="ph-weak-k" name="weak-k" class="lab-input is-mono" step="any" min="1e-16" value="0.000018" />
                        </div>
                    </div>
                </div>

                <!-- MODE 4: BUFFER (HENDERSON-HASSELBALCH) -->
                <div id="ph-panel-buffer" class="ph-mode-panel hidden">
                    <div class="lab-presets mb-md">
                        <span class="lab-presets-label">Buffer systems:</span>
                        ${BUFFER_PRESETS.map(
                            (p, idx) => `<button type="button" class="lab-preset-btn ph-buf-preset" data-idx="${idx}">${p.label}</button>`
                        ).join('')}
                    </div>

                    <div class="ph-form-grid">
                        <div class="lab-field">
                            <label for="ph-buf-pka" class="lab-label">Acid pKa</label>
                            <input type="number" id="ph-buf-pka" name="buf-pka" class="lab-input is-mono" step="any" value="4.76" />
                        </div>

                        <div class="lab-field">
                            <label for="ph-buf-acid" class="lab-label">Weak Acid [HA] (M)</label>
                            <input type="number" id="ph-buf-acid" name="buf-acid" class="lab-input is-mono" step="any" min="0.000001" value="0.1" />
                        </div>

                        <div class="lab-field">
                            <label for="ph-buf-base" class="lab-label">Conjugate Base [A⁻] (M)</label>
                            <input type="number" id="ph-buf-base" name="buf-base" class="lab-input is-mono" step="any" min="0.000001" value="0.1" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Visual pH Scale Diagram + Metrics Output -->
            <div id="ph-results" class="lab-stack" aria-live="polite"></div>
        </div>
    `;

    const tabBtns = container.querySelectorAll('.lab-tab');
    const panels = {
        direct: container.querySelector('#ph-panel-direct'),
        strong: container.querySelector('#ph-panel-strong'),
        weak: container.querySelector('#ph-panel-weak'),
        buffer: container.querySelector('#ph-panel-buffer')
    };
    const resultsEl = container.querySelector('#ph-results');

    const directNum = container.querySelector('#ph-direct-num');
    const directRange = container.querySelector('#ph-direct-range');
    const strongType = container.querySelector('#ph-strong-type');
    const strongConc = container.querySelector('#ph-strong-conc');
    const weakType = container.querySelector('#ph-weak-type');
    const weakConc = container.querySelector('#ph-weak-conc');
    const weakK = container.querySelector('#ph-weak-k');
    const bufPka = container.querySelector('#ph-buf-pka');
    const bufAcid = container.querySelector('#ph-buf-acid');
    const bufBase = container.querySelector('#ph-buf-base');

    function renderResults() {
        let data;
        let extraBadgeHTML = '';

        if (mode === 'direct') {
            data = solveFromDirectPH(parseFloat(directNum.value) || 0);
            extraBadgeHTML = `<span class="lab-meta-pill">Interactive Scale</span>`;
        } else if (mode === 'strong') {
            data = solveStrong(strongType.value, parseFloat(strongConc.value) || 0);
            extraBadgeHTML = `<span class="lab-meta-pill">100% Dissociation</span>`;
        } else if (mode === 'weak') {
            data = solveWeak(
                weakType.value,
                parseFloat(weakConc.value) || 0.1,
                parseFloat(weakK.value) || 1.8e-5
            );
            extraBadgeHTML = `<span class="lab-meta-pill">${data.pctIonized.toFixed(2)}% Ionized</span>`;
        } else {
            data = solveBuffer(
                parseFloat(bufPka.value) || 4.76,
                parseFloat(bufAcid.value) || 0.1,
                parseFloat(bufBase.value) || 0.1
            );
            const low = (data.pka - 1).toFixed(2);
            const high = (data.pka + 1).toFixed(2);
            extraBadgeHTML = data.inRange
                ? `<span class="lab-meta-pill is-good">Effective Buffer Range (${low}–${high})</span>`
                : `<span class="lab-meta-pill is-warn">Outside Buffer Window (${low}–${high})</span>`;
        }

        const clampedPH = Math.max(0, Math.min(14, data.ph));
        const pctPosition = (clampedPH / 14) * 100;
        const classification = classifyPH(data.ph);

        const ticksHTML = Array.from({ length: 15 }, (_, n) => {
            const leftPct = (n / 14) * 100;
            return `
                <div class="ph-tick" style="left: ${leftPct}%;">
                    <span class="ph-tick-line"></span>
                    <span class="ph-tick-num">${n}</span>
                </div>
            `;
        }).join('');

        const benchmarksHTML = SCALE_BENCHMARKS.map((b) => {
            const leftPct = (b.ph / 14) * 100;
            return `
                <div class="ph-bench" style="left: ${leftPct}%;" title="pH ${b.ph} — ${b.label}">
                    <span class="ph-bench-dot"></span>
                    <span class="ph-bench-label">${b.label}</span>
                </div>
            `;
        }).join('');

        resultsEl.innerHTML = `
            <div class="lab-panel glass-panel">
                <div class="ph-scale-header">
                    <div>
                        <span class="ph-class-badge ${classification.cls}">${classification.label}</span>
                        <h3 class="ph-big-readout">
                            pH <span>${data.ph.toFixed(2)}</span>
                        </h3>
                    </div>
                    <div class="lab-pill-group">
                        ${extraBadgeHTML}
                        <span class="lab-meta-pill">25 °C</span>
                    </div>
                </div>

                <!-- Step-by-step equation readout -->
                <div class="lab-callout mb-md" style="margin-top: 0; margin-bottom: 1rem;">
                    <i class="fa-solid fa-calculator" aria-hidden="true"></i>
                    <code>${data.formulaText}</code>
                </div>

                <!-- Visual 0-14 Spectrum Bar & Sliding Pin -->
                <div class="ph-diagram" role="img" aria-label="pH scale from 0 to 14 showing current result at pH ${data.ph.toFixed(2)}">
                    <div class="ph-end-labels">
                        <span>0 &bull; Strongly Acidic</span>
                        <span>7 &bull; Neutral</span>
                        <span>Strongly Basic &bull; 14</span>
                    </div>

                    <div class="ph-track-wrap">
                        <div class="ph-marker" style="left: ${pctPosition}%;">
                            <div class="ph-marker-bubble">pH ${data.ph.toFixed(2)}</div>
                            <div class="ph-marker-needle"></div>
                        </div>

                        <div class="ph-spectrum-bar"></div>
                        <div class="ph-ticks-row">${ticksHTML}</div>
                    </div>

                    <div class="ph-bench-row">${benchmarksHTML}</div>
                </div>

                <p class="ph-class-detail">${classification.detail}</p>
            </div>

            <div class="ph-metrics-grid">
                <div class="lab-stat glass-panel">
                    <span class="lab-stat-label">pH (&minus;log[H₃O⁺])</span>
                    <strong class="lab-stat-val is-mono">${data.ph.toFixed(3)}</strong>
                </div>
                <div class="lab-stat glass-panel">
                    <span class="lab-stat-label">pOH (&minus;log[OH⁻])</span>
                    <strong class="lab-stat-val is-mono">${data.poh.toFixed(3)}</strong>
                </div>
                <div class="lab-stat glass-panel">
                    <span class="lab-stat-label">[H₃O⁺] Acid Ions</span>
                    <strong class="lab-stat-val is-mono">${formatSci(data.hPlus)} M</strong>
                </div>
                <div class="lab-stat glass-panel">
                    <span class="lab-stat-label">[OH⁻] Base Ions</span>
                    <strong class="lab-stat-val is-mono">${formatSci(data.ohMinus)} M</strong>
                </div>
            </div>
        `;
    }

    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            playSound('click');
            mode = btn.dataset.mode;
            tabBtns.forEach((b) => {
                const active = b.dataset.mode === mode;
                b.classList.toggle('is-active', active);
                b.setAttribute('aria-selected', String(active));
            });
            Object.entries(panels).forEach(([key, el]) => {
                el.classList.toggle('hidden', key !== mode);
            });
            renderResults();
        });
    });

    [strongType, strongConc, weakType, weakConc, weakK, bufPka, bufAcid, bufBase].forEach((el) => {
        el.addEventListener('input', renderResults);
        el.addEventListener('change', renderResults);
    });

    directNum.addEventListener('input', () => {
        directRange.value = directNum.value;
        renderResults();
    });

    directRange.addEventListener('input', () => {
        directNum.value = directRange.value;
        renderResults();
    });

    container.querySelectorAll('.ph-sample-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            playSound('click');
            const val = parseFloat(btn.dataset.ph);
            directNum.value = val;
            directRange.value = val;
            renderResults();
        });
    });

    container.querySelectorAll('.ph-strong-preset').forEach((btn) => {
        btn.addEventListener('click', () => {
            playSound('click');
            const preset = STRONG_PRESETS[Number(btn.dataset.idx)];
            if (!preset) return;
            strongType.value = preset.type;
            strongConc.value = preset.conc;
            renderResults();
        });
    });

    container.querySelectorAll('.ph-weak-preset').forEach((btn) => {
        btn.addEventListener('click', () => {
            playSound('click');
            const preset = WEAK_PRESETS[Number(btn.dataset.idx)];
            if (!preset) return;
            weakType.value = preset.type;
            weakConc.value = preset.conc;
            weakK.value = preset.k;
            renderResults();
        });
    });

    container.querySelectorAll('.ph-buf-preset').forEach((btn) => {
        btn.addEventListener('click', () => {
            playSound('click');
            const preset = BUFFER_PRESETS[Number(btn.dataset.idx)];
            if (!preset) return;
            bufPka.value = preset.pka;
            bufAcid.value = preset.acid;
            bufBase.value = preset.base;
            renderResults();
        });
    });

    renderResults();
}
