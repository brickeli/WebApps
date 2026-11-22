import { PERIODIC_TABLE } from '../data/periodicTable.js';
import { COMMON_COMPOUNDS } from '../data/commonCompounds.js';
import { playSound } from '../engine/audio.js';

const PRESET_EXAMPLES = [
    { label: 'H₂O', formula: 'H2O' },
    { label: 'C₆H₁₂O₆', formula: 'C6H12O6' },
    { label: 'Fe₂(SO₄)₃', formula: 'Fe2(SO4)3' },
    { label: 'CuSO₄·5H₂O', formula: 'CuSO4·5H2O' },
    { label: '(NH₄)₂SO₄', formula: '(NH4)2SO4' }
];

/**
 * Parses a single chemical segment (supports nested () and []) into an atom count map.
 */
function parseSegment(segment) {
    const clean = segment.replace(/\[/g, '(').replace(/\]/g, ')');
    const stack = [{}];
    let i = 0;

    while (i < clean.length) {
        const ch = clean[i];

        if (ch === '(') {
            stack.push({});
            i++;
        } else if (ch === ')') {
            if (stack.length === 1) {
                throw new Error('Unmatched closing parenthesis ")" in formula.');
            }
            i++;
            let numStr = '';
            while (i < clean.length && /[0-9]/.test(clean[i])) {
                numStr += clean[i++];
            }
            const multiplier = numStr ? parseInt(numStr, 10) : 1;
            const popped = stack.pop();
            const top = stack[stack.length - 1];

            for (const [el, count] of Object.entries(popped)) {
                top[el] = (top[el] || 0) + count * multiplier;
            }
        } else if (/[A-Z]/.test(ch)) {
            let symbol = ch;
            i++;
            while (i < clean.length && /[a-z]/.test(clean[i])) {
                symbol += clean[i++];
            }
            if (!PERIODIC_TABLE[symbol]) {
                throw new Error(`Unknown element symbol "${symbol}". Check capitalization (e.g., Co vs CO).`);
            }
            let numStr = '';
            while (i < clean.length && /[0-9]/.test(clean[i])) {
                numStr += clean[i++];
            }
            const count = numStr ? parseInt(numStr, 10) : 1;
            if (count === 0) {
                throw new Error(`Subscript for ${symbol} cannot be zero.`);
            }
            const top = stack[stack.length - 1];
            top[symbol] = (top[symbol] || 0) + count;
        } else if (/[0-9]/.test(ch)) {
            throw new Error(`Unexpected number "${ch}" without a preceding element or group.`);
        } else {
            throw new Error(`Invalid character "${ch}" in chemical formula.`);
        }
    }

    if (stack.length !== 1) {
        throw new Error('Unclosed opening parenthesis "(" in formula.');
    }

    return stack[0];
}

/**
 * Full formula parser supporting hydrate notation (e.g., CuSO4·5H2O or CuSO4.5H2O).
 */
export function calculateMolarMass(rawInput) {
    const trimmed = rawInput.trim();
    if (!trimmed) {
        throw new Error('Enter a chemical formula or element symbol (e.g., H2O, NaCl, Fe).');
    }

    // Split on hydrate separators (middle dot ·, bullet •, asterisk *, or period .)
    const parts = trimmed.split(/[·•*.]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) {
        throw new Error('Enter a valid chemical formula.');
    }

    const totalCounts = {};

    parts.forEach((part, idx) => {
        // Check for leading stoichiometric multiplier (e.g., "5H2O" in a hydrate)
        const match = part.match(/^(\d+)(.+)$/);
        const partMultiplier = match ? parseInt(match[1], 10) : 1;
        const formulaBody = match ? match[2] : part;

        if (idx === 0 && match) {
            // Allow leading coefficient on main species too, or treat as multiplier
        }

        const counts = parseSegment(formulaBody);
        for (const [el, count] of Object.entries(counts)) {
            totalCounts[el] = (totalCounts[el] || 0) + count * partMultiplier;
        }
    });

    const entries = Object.entries(totalCounts);
    if (entries.length === 0) {
        throw new Error('No valid elements found in formula.');
    }

    let totalMass = 0;
    const breakdown = entries.map(([symbol, count]) => {
        const elem = PERIODIC_TABLE[symbol];
        const atomicMass = parseFloat(elem.atomicMass);
        const subtotal = atomicMass * count;
        totalMass += subtotal;
        return {
            symbol,
            name: elem.name,
            atomicNumber: elem.atomicNumber,
            category: elem.category,
            count,
            atomicMass,
            subtotal
        };
    });

    breakdown.forEach((row) => {
        row.percent = totalMass > 0 ? (row.subtotal / totalMass) * 100 : 0;
    });

    return {
        formula: trimmed,
        totalMass,
        totalAtoms: breakdown.reduce((sum, r) => sum + r.count, 0),
        breakdown
    };
}

function formatSubscripts(formula) {
    return formula.replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');
}

function resolveQuickTip(formula, breakdown) {
    // Normalize dot separators to middle dot · for dictionary lookup
    const normalized = formula.replace(/\s+/g, '').replace(/[•*.]/g, '·');
    const known = COMMON_COMPOUNDS[normalized];

    if (known) {
        return {
            badge: known.category,
            title: known.name,
            body: known.tip
        };
    }

    // Single pure element (e.g., "Fe", "Au", or diatomic/allotrope like "O2", "S8")
    if (breakdown.length === 1) {
        const item = breakdown[0];
        const elemData = PERIODIC_TABLE[item.symbol];
        const label = item.count === 1
            ? `${elemData.name} (${item.symbol})`
            : `${elemData.name} (${formatSubscripts(formula)})`;

        return {
            badge: elemData.category,
            title: label,
            body: elemData.summary
        };
    }

    // Fallback summary for custom/unlisted multi-element compounds
    const elementNames = breakdown.map((b) => `${b.name} (${b.count})`).join(', ');
    return {
        badge: `${breakdown.length}-Element Compound`,
        title: `Formula Composition (${breakdown.reduce((s, b) => s + b.count, 0)} Total Atoms)`,
        body: `Composed of ${elementNames}. Use the breakdown table below for exact mass fractions in stoichiometry and percent-yield calculations.`
    };
}

export function mountTool(container) {
  container.innerHTML = `
        <div class="lab-stack">
            <!-- Header & Formula Input -->
            <div class="lab-panel glass-panel">
                <span class="lab-eyebrow">
                    <i class="fa-solid fa-scale-balanced" aria-hidden="true"></i>
                    Stoichiometry Tool
                </span>
                <h2 class="lab-heading">Molar Mass Calculator</h2>
                <p class="lab-subtitle">
                    Enter any element symbol or chemical formula—supports parentheses and hydrates (e.g., <code>CuSO4·5H2O</code>).
                </p>

                <form id="mm-form" class="mm-form mt-md" novalidate>
                    <div class="mm-input-group">
                        <label for="mm-formula-input" class="sr-only">Chemical Formula</label>
                        <input
                            type="text"
                            id="mm-formula-input"
                            name="formula"
                            class="lab-input is-mono mm-formula-input"
                            placeholder="e.g., C6H12O6, Fe2(SO4)3, or Au"
                            autocomplete="off"
                            spellcheck="false"
                            value="C6H12O6"
                        />
                        <button
                            type="submit"
                            class="lab-btn-primary mm-submit-btn"
                            aria-label="Calculate molar mass"
                            title="Calculate molar mass"
                        >
                            <i class="fa-solid fa-calculator" aria-hidden="true"></i>
                        </button>
                    </div>
                </form>

                <div class="lab-pill-row mt-sm">
                    <span class="lab-pill-label">Quick examples:</span>
                    ${PRESET_EXAMPLES.map(
                        (ex) => `<button type="button" class="lab-pill is-compact" data-formula="${ex.formula}">${ex.label}</button>`
                    ).join('')}
                </div>

                <div id="mm-error" class="mm-error hidden" role="alert"></div>
            </div>

            <!-- Results Region -->
            <div id="mm-results" class="lab-stack"></div>
        </div>
    `;
    
    const form = container.querySelector('#mm-form');
    const input = container.querySelector('#mm-formula-input');
    const errorEl = container.querySelector('#mm-error');
    const resultsEl = container.querySelector('#mm-results');

    function renderCalculation(formulaStr, playClick = false) {
        if (playClick) playSound('click');

        try {
            const res = calculateMolarMass(formulaStr);
            const tip = resolveQuickTip(res.formula, res.breakdown);

            errorEl.classList.add('hidden');
            errorEl.textContent = '';

            const formattedFormula = formatSubscripts(res.formula);
            const formattedMass = res.totalMass.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4
            });

            resultsEl.innerHTML = `
                <div class="mm-summary-grid">
                    <!-- Total Molar Mass Card -->
                    <div class="lab-panel glass-panel">
                        <div class="mm-mass-top">
                            <span class="lab-label">Molar Mass of ${formattedFormula}</span>
                            <button type="button" id="mm-copy-btn" class="lab-btn-ghost" title="Copy molar mass">
                                <i class="fa-regular fa-copy" aria-hidden="true"></i>
                                <span>Copy</span>
                            </button>
                        </div>
                        <div class="mm-mass-value">
                            ${formattedMass} <span class="mm-mass-unit">g/mol</span>
                        </div>
                        <div class="mm-mass-meta">
                            ${res.breakdown.length} element${res.breakdown.length === 1 ? '' : 's'} &bull; ${res.totalAtoms} total atom${res.totalAtoms === 1 ? '' : 's'}
                        </div>
                    </div>

                    <!-- Quick Tip / Compound Profile Card -->
                    <div class="lab-panel glass-panel">
                        <div class="mm-tip-header">
                            <span class="mm-tip-icon"><i class="fa-solid fa-lightbulb" aria-hidden="true"></i></span>
                            <div>
                                <h3 class="mm-tip-title">${tip.title}</h3>
                            </div>
                        </div>
                        <p class="mm-tip-body">${tip.body}</p>
                        <span class="lab-card-badge">${tip.badge}</span>
                    </div>
                </div>

                <!-- Elemental Breakdown Table -->
                <div class="lab-panel glass-panel">
                    <h3 class="lab-section-title">Elemental Composition Breakdown</h3>
                    <div class="mm-table-wrap">
                      <table class="mm-table">
                          <thead>
                              <tr>
                                  <th scope="col">Element</th>
                                  <th scope="col" class="is-num">Atoms</th>
                                  <th scope="col" class="is-num">Atomic Mass (g/mol)</th>
                                  <th scope="col" class="is-num">Subtotal (g/mol)</th>
                                  <th scope="col" class="is-num">Mass %</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${res.breakdown
                                  .map(
                                      (row) => `
                                  <tr>
                                      <td>
                                          <span class="mm-el-badge">${row.symbol}</span>
                                          <span>${row.name}</span>
                                      </td>
                                      <td class="is-num">${row.count}</td>
                                      <td class="is-num">${row.atomicMass.toFixed(3)}</td>
                                      <td class="is-num"><strong>${row.subtotal.toFixed(3)}</strong></td>
                                      <td class="is-num">
                                          <div class="mm-pct-cell">
                                              <div class="mm-pct-bar" aria-hidden="true">
                                                  <div class="mm-pct-fill" style="width: ${Math.min(100, row.percent).toFixed(1)}%;"></div>
                                              </div>
                                              <span>${row.percent.toFixed(2)}%</span>
                                          </div>
                                      </td>
                                  </tr>
                              `
                                  )
                                  .join('')}
                          </tbody>
                      </table>
                    </div>
                </div>
            `;
            const copyBtn = resultsEl.querySelector('#mm-copy-btn');
            copyBtn?.addEventListener('click', () => {
                playSound('click');
                navigator.clipboard?.writeText(`${formattedMass} g/mol`).then(() => {
                    const span = copyBtn.querySelector('span');
                    if (span) {
                        span.textContent = 'Copied!';
                        setTimeout(() => {
                            span.textContent = 'Copy';
                        }, 1500);
                    }
                });
            });
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
            resultsEl.innerHTML = '';
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        renderCalculation(input.value, true);
    });

    // Live calculation as user types (silently handles incomplete parentheses until valid)
    input.addEventListener('input', () => {
        if (!input.value.trim()) {
            errorEl.classList.add('hidden');
            resultsEl.innerHTML = '';
            return;
        }
        try {
            calculateMolarMass(input.value);
            renderCalculation(input.value, false);
        } catch {
            // Wait for submit or completion if user is mid-typing e.g. "Fe2("
        }
    });

    container.querySelectorAll('.lab-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            input.value = btn.dataset.formula;
            renderCalculation(input.value, true);
        });
    });

    // Run initial calculation on mount
    renderCalculation(input.value, false);
}
