import { playSound } from '../engine/audio.js';
import { renderLabTabs, bindLabTabs } from '../labMain.js';

const CONVERSION_CATEGORIES = {
    pressure: {
        label: 'Pressure',
        icon: 'fa-gauge-high',
        defaultFrom: 'atm',
        defaultTo: 'kPa',
        defaultValue: 1,
        note: 'Standard atmospheric pressure at sea level equals 1 atm = 101.325 kPa = 760 mmHg (torr).',
        units: [
            { id: 'atm', name: 'Atmospheres', symbol: 'atm', toBase: (v) => v * 101325, fromBase: (b) => b / 101325 },
            { id: 'kPa', name: 'Kilopascals', symbol: 'kPa', toBase: (v) => v * 1000, fromBase: (b) => b / 1000 },
            { id: 'Pa', name: 'Pascals (SI)', symbol: 'Pa', toBase: (v) => v, fromBase: (b) => b },
            { id: 'mmHg', name: 'Millimeters of Mercury', symbol: 'mmHg', toBase: (v) => v * (101325 / 760), fromBase: (b) => b * (760 / 101325) },
            { id: 'torr', name: 'Torr', symbol: 'torr', toBase: (v) => v * (101325 / 760), fromBase: (b) => b * (760 / 101325) },
            { id: 'bar', name: 'Bar', symbol: 'bar', toBase: (v) => v * 100000, fromBase: (b) => b / 100000 },
            { id: 'psi', name: 'Pounds per Sq. Inch', symbol: 'psi', toBase: (v) => v * 6894.757293, fromBase: (b) => b / 6894.757293 }
        ]
    },
    temperature: {
        label: 'Temperature',
        icon: 'fa-temperature-half',
        defaultFrom: 'C',
        defaultTo: 'K',
        defaultValue: 25,
        note: 'Gas law calculations (PV = nRT) always require absolute temperature in Kelvin: K = °C + 273.15.',
        units: [
            { id: 'C', name: 'Celsius', symbol: '°C', toBase: (v) => v + 273.15, fromBase: (b) => b - 273.15 },
            { id: 'K', name: 'Kelvin (SI)', symbol: 'K', toBase: (v) => v, fromBase: (b) => b },
            { id: 'F', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (b) => ((b - 273.15) * 9) / 5 + 32 }
        ]
    },
    concentration: {
        label: 'Concentration',
        icon: 'fa-vial',
        defaultFrom: 'M',
        defaultTo: 'mM',
        defaultValue: 0.5,
        requiresMolarMass: true,
        note: 'Molarity (M = mol/L) converts to mass concentration (g/L) via Molar Mass: g/L = M × (g/mol). In dilute aqueous solutions, 1 mg/L ≈ 1 ppm.',
        units: [
            { id: 'M', name: 'Molar (mol/L)', symbol: 'M', toBase: (v) => v, fromBase: (b) => b },
            { id: 'mM', name: 'Millimolar (mmol/L)', symbol: 'mM', toBase: (v) => v * 1e-3, fromBase: (b) => b * 1e3 },
            { id: 'uM', name: 'Micromolar (µmol/L)', symbol: 'µM', toBase: (v) => v * 1e-6, fromBase: (b) => b * 1e6 },
            { id: 'gL', name: 'Grams per Liter', symbol: 'g/L', toBase: (v, mw) => v / mw, fromBase: (b, mw) => b * mw },
            { id: 'mgL', name: 'Milligrams/L (≈ ppm)', symbol: 'mg/L', toBase: (v, mw) => (v / 1000) / mw, fromBase: (b, mw) => b * mw * 1000 }
        ]
    },
    energy: {
        label: 'Energy',
        icon: 'fa-bolt',
        defaultFrom: 'kJ',
        defaultTo: 'kcal',
        defaultValue: 4.184,
        note: 'Thermochemical calorie definition: 1 cal = 4.184 J (1 kcal = 4.184 kJ). Electronvolts (eV) are standard in atomic and nuclear spectroscopy.',
        units: [
            { id: 'J', name: 'Joules (SI)', symbol: 'J', toBase: (v) => v, fromBase: (b) => b },
            { id: 'kJ', name: 'Kilojoules', symbol: 'kJ', toBase: (v) => v * 1000, fromBase: (b) => b / 1000 },
            { id: 'cal', name: 'Calories (thermochem.)', symbol: 'cal', toBase: (v) => v * 4.184, fromBase: (b) => b / 4.184 },
            { id: 'kcal', name: 'Kilocalories', symbol: 'kcal', toBase: (v) => v * 4184, fromBase: (b) => b / 4184 },
            { id: 'eV', name: 'Electronvolts', symbol: 'eV', toBase: (v) => v * 1.602176634e-19, fromBase: (b) => b / 1.602176634e-19 }
        ]
    }
};

const UC_TABS = Object.entries(CONVERSION_CATEGORIES).map(([value, cat]) => ({
    value,
    label: cat.label,
    icon: cat.icon
}));

const MW_PRESETS = [
    { label: 'H₂O (18.02)', value: 18.015 },
    { label: 'NaCl (58.44)', value: 58.44 },
    { label: 'HCl (36.46)', value: 36.46 },
    { label: 'Glucose (180.16)', value: 180.156 }
];

function formatSmartNumber(num) {
    if (!Number.isFinite(num)) return '';
    if (num === 0) return '0';
    const abs = Math.abs(num);
    if (abs >= 1e6 || (abs > 0 && abs < 1e-4)) {
        return num.toExponential(5).replace(/\.?0+e/, 'e');
    }
    return Number(num.toPrecision(7)).toString();
}

export function mountTool(container) {
    let activeCatKey = 'pressure';
    let fromUnitId = CONVERSION_CATEGORIES.pressure.defaultFrom;
    let toUnitId = CONVERSION_CATEGORIES.pressure.defaultTo;
    let molarMass = 58.44;
    let lastEdited = 'from'; // 'from' | 'to'

    container.innerHTML = `
        <div class="lab-stack">
            <!-- Header & Category Tabs -->
            <div class="lab-panel glass-panel">
                <span class="lab-eyebrow">
                    <i class="fa-solid fa-arrow-right-arrow-left" aria-hidden="true"></i>
                    Measurement Utility
                </span>
                <h2 class="lab-heading">Scientific Unit Converter</h2>
                <p class="lab-subtitle">
                    Bidirectional conversions for laboratory pressure, temperature, solution concentration, and reaction energy.
                </p>

                <div class="mt-md">
                    ${renderLabTabs({ idPrefix: 'uc', ariaLabel: 'Unit categories', tabs: UC_TABS, activeValue: activeCatKey })}
                </div>
            </div>

            <!-- Active Converter Workspace -->
            <div class="lab-panel glass-panel">
                <!-- Optional Molar Mass Bar (Shown for Concentration Tab) -->
                <div id="uc-mw-bar" class="uc-mw-bar hidden">
                    <div class="uc-mw-top">
                        <label for="uc-mw-input" class="lab-label">
                            <i class="fa-solid fa-scale-balanced" aria-hidden="true"></i>
                            Solute Molar Mass (g/mol) — used for M &harr; g/L &amp; mg/L
                        </label>
                        <div class="lab-pill-row">
                            ${MW_PRESETS.map(
                                (p) => `<button type="button" class="lab-pill is-compact uc-mw-preset" data-mw="${p.value}">${p.label}</button>`
                            ).join('')}
                        </div>
                    </div>
                    <input
                        type="number"
                        id="uc-mw-input"
                        name="molar-mass"
                        class="lab-input is-mono uc-mw-input"
                        step="any"
                        min="0.001"
                        value="58.44"
                    />
                </div>

                <!-- Bidirectional From <-> To Fields -->
                <div class="uc-converter-row">
                    <div class="lab-field">
                        <label for="uc-from-val" class="lab-label">From</label>
                        <div class="uc-input-combo">
                            <input
                                type="number"
                                id="uc-from-val"
                                name="from-value"
                                class="lab-input is-mono"
                                step="any"
                                value="1"
                            />
                            <label for="uc-from-unit" class="sr-only">From Unit</label>
                            <select id="uc-from-unit" name="from-unit" class="lab-select"></select>
                        </div>
                    </div>

                    <button type="button" id="uc-swap-btn" class="uc-swap-btn" title="Swap units" aria-label="Swap units">
                        <i class="fa-solid fa-right-left" aria-hidden="true"></i>
                    </button>

                    <div class="lab-field">
                        <label for="uc-to-val" class="lab-label">To</label>
                        <div class="uc-input-combo">
                            <input
                                type="number"
                                id="uc-to-val"
                                name="to-value"
                                class="lab-input is-mono"
                                step="any"
                            />
                            <label for="uc-to-unit" class="sr-only">To Unit</label>
                            <select id="uc-to-unit" name="to-unit" class="lab-select"></select>
                        </div>
                    </div>
                </div>

                <!-- Contextual Chemistry Tip -->
                <div id="uc-note" class="lab-callout mt-md"></div>
            </div>

            <!-- All Units Equivalent Grid -->
            <div class="lab-panel glass-panel">
                <h3 class="lab-section-title">All Equivalents in <span id="uc-all-cat-label">Pressure</span></h3>
                <div id="uc-all-grid" class="uc-all-grid"></div>
            </div>
        </div>
    `;

    const mwBar = container.querySelector('#uc-mw-bar');
    const mwInput = container.querySelector('#uc-mw-input');
    const fromValInput = container.querySelector('#uc-from-val');
    const toValInput = container.querySelector('#uc-to-val');
    const fromUnitSelect = container.querySelector('#uc-from-unit');
    const toUnitSelect = container.querySelector('#uc-to-unit');
    const swapBtn = container.querySelector('#uc-swap-btn');
    const noteEl = container.querySelector('#uc-note');
    const allCatLabel = container.querySelector('#uc-all-cat-label');
    const allGrid = container.querySelector('#uc-all-grid');

    function getUnit(catKey, unitId) {
        return CONVERSION_CATEGORIES[catKey].units.find((u) => u.id === unitId) || CONVERSION_CATEGORIES[catKey].units[0];
    }

    function populateUnitSelects() {
        const cat = CONVERSION_CATEGORIES[activeCatKey];
        const optionsHTML = cat.units
            .map((u) => `<option value="${u.id}">${u.name} (${u.symbol})</option>`)
            .join('');

        fromUnitSelect.innerHTML = optionsHTML;
        toUnitSelect.innerHTML = optionsHTML;
        fromUnitSelect.value = fromUnitId;
        toUnitSelect.value = toUnitId;

        mwBar.classList.toggle('hidden', !cat.requiresMolarMass);
        noteEl.innerHTML = `<i class="fa-solid fa-circle-info" aria-hidden="true"></i> <span>${cat.note}</span>`;
        allCatLabel.textContent = cat.label;
    }

    function recalculate() {
        const cat = CONVERSION_CATEGORIES[activeCatKey];
        const fromUnit = getUnit(activeCatKey, fromUnitId);
        const toUnit = getUnit(activeCatKey, toUnitId);
        const mw = Math.max(0.0001, parseFloat(mwInput.value) || molarMass || 58.44);

        let baseValue = NaN;

        if (lastEdited === 'from') {
            const rawFrom = parseFloat(fromValInput.value);
            if (!Number.isFinite(rawFrom)) {
                toValInput.value = '';
                renderAllEquivalents(NaN, mw);
                return;
            }
            baseValue = fromUnit.toBase(rawFrom, mw);
            const converted = toUnit.fromBase(baseValue, mw);
            toValInput.value = formatSmartNumber(converted);
        } else {
            const rawTo = parseFloat(toValInput.value);
            if (!Number.isFinite(rawTo)) {
                fromValInput.value = '';
                renderAllEquivalents(NaN, mw);
                return;
            }
            baseValue = toUnit.toBase(rawTo, mw);
            const converted = fromUnit.fromBase(baseValue, mw);
            fromValInput.value = formatSmartNumber(converted);
        }

        renderAllEquivalents(baseValue, mw);
    }

    function renderAllEquivalents(baseValue, mw) {
        const cat = CONVERSION_CATEGORIES[activeCatKey];
        if (!Number.isFinite(baseValue)) {
            allGrid.innerHTML = `<p class="lab-subtitle">Enter a numeric value above to view all unit equivalents.</p>`;
            return;
        }

        allGrid.innerHTML = cat.units
            .map((u) => {
                const val = u.fromBase(baseValue, mw);
                const formatted = formatSmartNumber(val);
                const isHighlighted = u.id === fromUnitId || u.id === toUnitId;
                return `
                    <button
                        type="button"
                        class="uc-equiv-card ${isHighlighted ? 'is-highlighted' : ''}"
                        data-copy="${formatted} ${u.symbol}"
                        title="Click to copy ${formatted} ${u.symbol}"
                    >
                        <div class="uc-equiv-top">
                            <span class="uc-equiv-sym">${u.symbol}</span>
                            <i class="fa-regular fa-copy uc-equiv-copy-icon" aria-hidden="true"></i>
                        </div>
                        <div class="uc-equiv-bottom">
                          <div class="uc-equiv-val">${formatted}</div>
                          <div class="uc-equiv-name">${u.symbol}</div>
                        </div>
                    </button>
                `;
            })
            .join('');
    }

    function switchCategory(catKey) {
        if (!CONVERSION_CATEGORIES[catKey]) return;
        activeCatKey = catKey;
        const cat = CONVERSION_CATEGORIES[catKey];
        fromUnitId = cat.defaultFrom;
        toUnitId = cat.defaultTo;
        lastEdited = 'from';

        fromValInput.value = cat.defaultValue;
        populateUnitSelects();
        recalculate();
    }

    // Event Listeners
    bindLabTabs(container, UC_TABS, (newCat) => {
        switchCategory(newCat);
    });

    fromValInput.addEventListener('input', () => {
        lastEdited = 'from';
        recalculate();
    });

    toValInput.addEventListener('input', () => {
        lastEdited = 'to';
        recalculate();
    });

    fromUnitSelect.addEventListener('change', () => {
        playSound('click');
        fromUnitId = fromUnitSelect.value;
        lastEdited = 'from';
        recalculate();
    });

    toUnitSelect.addEventListener('change', () => {
        playSound('click');
        toUnitId = toUnitSelect.value;
        lastEdited = 'from';
        recalculate();
    });

    swapBtn.addEventListener('click', () => {
        playSound('click');
        const tempUnit = fromUnitId;
        fromUnitId = toUnitId;
        toUnitId = tempUnit;
        fromUnitSelect.value = fromUnitId;
        toUnitSelect.value = toUnitId;
        lastEdited = 'from';
        recalculate();
    });

    mwInput.addEventListener('input', () => {
        molarMass = parseFloat(mwInput.value) || 58.44;
        recalculate();
    });

    container.querySelectorAll('.uc-mw-preset').forEach((btn) => {
        btn.addEventListener('click', () => {
            playSound('click');
            molarMass = parseFloat(btn.dataset.mw);
            mwInput.value = molarMass;
            recalculate();
        });
    });

    allGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.uc-equiv-card');
        if (!card) return;
        playSound('click');
        const text = card.dataset.copy;
        navigator.clipboard?.writeText(text).then(() => {
            const symEl = card.querySelector('.uc-equiv-sym');
            const orig = symEl.textContent;
            symEl.textContent = 'Copied!';
            setTimeout(() => {
                symEl.textContent = orig;
            }, 1200);
        });
    });

    // Initial Mount Render
    populateUnitSelects();
    recalculate();
}
