import { playSound } from '../engine/audio.js';
import { renderLabTabs, bindLabTabs } from '../labMain.js';

const CONVERSION_CATEGORIES = {
    base: {
        label: 'Base / SI',
        icon: 'fa-ruler-combined',
        requiresDimension: true,
        defaultDimension: 'mass',
        dimensions: {
            mass: {
                label: 'Mass (g)',
                defaultFrom: 'g',
                defaultTo: 'mg',
                defaultValue: 1,
                note: 'SI base unit of mass is the kilogram (kg), though grams (g) and milligrams (mg) are standard for benchtop stoichiometry. 1 g = 1,000 mg = 10⁶ µg.',
                units: [
                    { id: 'kg', name: 'Kilograms (SI)', symbol: 'kg', toBase: (v) => v * 1000, fromBase: (b) => b / 1000 },
                    { id: 'g', name: 'Grams', symbol: 'g', toBase: (v) => v, fromBase: (b) => b },
                    { id: 'mg', name: 'Milligrams', symbol: 'mg', toBase: (v) => v * 1e-3, fromBase: (b) => b * 1e3 },
                    { id: 'ug', name: 'Micrograms', symbol: 'µg', toBase: (v) => v * 1e-6, fromBase: (b) => b * 1e6 },
                    { id: 'ng', name: 'Nanograms', symbol: 'ng', toBase: (v) => v * 1e-9, fromBase: (b) => b * 1e9 },
                    { id: 'lb', name: 'Pounds', symbol: 'lb', toBase: (v) => v * 453.59237, fromBase: (b) => b / 453.59237 },
                    { id: 'oz', name: 'Ounces', symbol: 'oz', toBase: (v) => v * 28.349523125, fromBase: (b) => b / 28.349523125 }
                ]
            },
            volume: {
                label: 'Volume (L)',
                defaultFrom: 'L',
                defaultTo: 'mL',
                defaultValue: 1,
                note: '1 Liter (L) = 1 dm³ = 1,000 mL. In laboratory glassware and pipetting, 1 mL is strictly equal to 1 cubic centimeter (cm³ or cc).',
                units: [
                    { id: 'm3', name: 'Cubic Meters (SI)', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (b) => b / 1000 },
                    { id: 'L', name: 'Liters', symbol: 'L', toBase: (v) => v, fromBase: (b) => b },
                    { id: 'mL', name: 'Milliliters', symbol: 'mL', toBase: (v) => v * 1e-3, fromBase: (b) => b * 1e3 },
                    { id: 'cm3', name: 'Cubic Centimeters', symbol: 'cm³', toBase: (v) => v * 1e-3, fromBase: (b) => b * 1e3 },
                    { id: 'uL', name: 'Microliters', symbol: 'µL', toBase: (v) => v * 1e-6, fromBase: (b) => b * 1e6 },
                    { id: 'nL', name: 'Nanoliters', symbol: 'nL', toBase: (v) => v * 1e-9, fromBase: (b) => b * 1e9 },
                    { id: 'gal', name: 'US Gallons', symbol: 'gal', toBase: (v) => v * 3.785411784, fromBase: (b) => b / 3.785411784 }
                ]
            },
            length: {
                label: 'Length (m)',
                defaultFrom: 'm',
                defaultTo: 'cm',
                defaultValue: 1,
                note: 'SI base unit of length is the meter (m). Nanometers (nm) are standard for UV-Vis spectroscopy wavelengths; Angstroms (1 Å = 0.1 nm) are used for bond lengths.',
                units: [
                    { id: 'km', name: 'Kilometers', symbol: 'km', toBase: (v) => v * 1000, fromBase: (b) => b / 1000 },
                    { id: 'm', name: 'Meters (SI)', symbol: 'm', toBase: (v) => v, fromBase: (b) => b },
                    { id: 'cm', name: 'Centimeters', symbol: 'cm', toBase: (v) => v * 1e-2, fromBase: (b) => b * 1e2 },
                    { id: 'mm', name: 'Millimeters', symbol: 'mm', toBase: (v) => v * 1e-3, fromBase: (b) => b * 1e3 },
                    { id: 'um', name: 'Micrometers', symbol: 'µm', toBase: (v) => v * 1e-6, fromBase: (b) => b * 1e6 },
                    { id: 'nm', name: 'Nanometers', symbol: 'nm', toBase: (v) => v * 1e-9, fromBase: (b) => b * 1e9 },
                    { id: 'A', name: 'Angstroms', symbol: 'Å', toBase: (v) => v * 1e-10, fromBase: (b) => b * 1e10 },
                    { id: 'in', name: 'Inches', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (b) => b / 0.0254 }
                ]
            },
            amount: {
                label: 'Amount (mol)',
                defaultFrom: 'mol',
                defaultTo: 'mmol',
                defaultValue: 1,
                note: 'One mole (mol) contains exactly 6.02214076 × 10²³ elementary entities (Avogadro constant).',
                units: [
                    { id: 'kmol', name: 'Kilomoles', symbol: 'kmol', toBase: (v) => v * 1000, fromBase: (b) => b / 1000 },
                    { id: 'mol', name: 'Moles (SI)', symbol: 'mol', toBase: (v) => v, fromBase: (b) => b },
                    { id: 'mmol', name: 'Millimoles', symbol: 'mmol', toBase: (v) => v * 1e-3, fromBase: (b) => b * 1e3 },
                    { id: 'umol', name: 'Micromoles', symbol: 'µmol', toBase: (v) => v * 1e-6, fromBase: (b) => b * 1e6 },
                    { id: 'nmol', name: 'Nanomoles', symbol: 'nmol', toBase: (v) => v * 1e-9, fromBase: (b) => b * 1e9 }
                ]
            }
        }
    },
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
    let activeCatKey = 'base';
    let activeDimKey = CONVERSION_CATEGORIES.base.defaultDimension;
    let fromUnitId = CONVERSION_CATEGORIES.base.dimensions[activeDimKey].defaultFrom;
    let toUnitId = CONVERSION_CATEGORIES.base.dimensions[activeDimKey].defaultTo;
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
                    Bidirectional conversions for SI base units, metric prefixes, pressure, temperature, concentration, and energy.
                </p>

                <div class="mt-md">
                    ${renderLabTabs({ idPrefix: 'uc', ariaLabel: 'Unit categories', tabs: UC_TABS, activeValue: activeCatKey })}
                </div>
            </div>

            <!-- Active Converter Workspace -->
            <div class="lab-panel glass-panel">
                <!-- Base Dimension Selector Bar (Shown for Base / SI Tab) -->
                <div id="uc-dim-bar" class="uc-mw-bar hidden">
                    <div class="uc-mw-top">
                        <label for="uc-pq-input" class="lab-label">
                            <i class="fa-solid fa-cubes" aria-hidden="true"></i>
                            Physical Quantity
                        </label>
                        <div class="lab-pill-row" id="uc-dim-pills">
                            ${Object.entries(CONVERSION_CATEGORIES.base.dimensions)
                                .map(
                                    ([key, dim]) =>
                                        `<button type="button" class="lab-pill is-compact uc-dim-pill ${key === activeDimKey ? 'is-active' : ''}" data-dim="${key}">${dim.label}</button>`
                                )
                                .join('')}
                        </div>
                    </div>
                </div>

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
                <h3 class="lab-section-title">All Equivalents in <span id="uc-all-cat-label">Mass (g)</span></h3>
                <div id="uc-all-grid" class="uc-all-grid"></div>
            </div>
        </div>
    `;

    const dimBar = container.querySelector('#uc-dim-bar');
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

    function getActiveConfig() {
        const cat = CONVERSION_CATEGORIES[activeCatKey];
        if (cat.requiresDimension) {
            return cat.dimensions[activeDimKey];
        }
        return cat;
    }

    function getUnit(unitId) {
        const units = getActiveConfig().units;
        return units.find((u) => u.id === unitId) || units[0];
    }

    function populateUnitSelects() {
        const cat = CONVERSION_CATEGORIES[activeCatKey];
        const config = getActiveConfig();
        const optionsHTML = config.units
            .map((u) => `<option value="${u.id}">${u.name} (${u.symbol})</option>`)
            .join('');

        fromUnitSelect.innerHTML = optionsHTML;
        toUnitSelect.innerHTML = optionsHTML;
        fromUnitSelect.value = fromUnitId;
        toUnitSelect.value = toUnitId;

        dimBar.classList.toggle('hidden', !cat.requiresDimension);
        mwBar.classList.toggle('hidden', !cat.requiresMolarMass);
        noteEl.innerHTML = `<i class="fa-solid fa-circle-info" aria-hidden="true"></i> <span>${config.note}</span>`;
        allCatLabel.textContent = config.label;

        container.querySelectorAll('.uc-dim-pill').forEach((pill) => {
            pill.classList.toggle('is-active', pill.dataset.dim === activeDimKey);
        });
    }

    function recalculate() {
        const fromUnit = getUnit(fromUnitId);
        const toUnit = getUnit(toUnitId);
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
        const config = getActiveConfig();
        if (!Number.isFinite(baseValue)) {
            allGrid.innerHTML = `<p class="lab-subtitle">Enter a numeric value above to view all unit equivalents.</p>`;
            return;
        }

        allGrid.innerHTML = config.units
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
        if (cat.requiresDimension) {
            activeDimKey = cat.defaultDimension;
        }
        const config = getActiveConfig();
        fromUnitId = config.defaultFrom;
        toUnitId = config.defaultTo;
        lastEdited = 'from';

        fromValInput.value = config.defaultValue;
        populateUnitSelects();
        recalculate();
    }

    function switchDimension(dimKey) {
        const cat = CONVERSION_CATEGORIES[activeCatKey];
        if (!cat?.dimensions?.[dimKey]) return;
        activeDimKey = dimKey;
        const config = getActiveConfig();
        fromUnitId = config.defaultFrom;
        toUnitId = config.defaultTo;
        lastEdited = 'from';

        fromValInput.value = config.defaultValue;
        populateUnitSelects();
        recalculate();
    }

    // Event Listeners
    bindLabTabs(container, UC_TABS, (newCat) => {
        switchCategory(newCat);
    });

    container.querySelectorAll('.uc-dim-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            playSound('click');
            switchDimension(btn.dataset.dim);
        });
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
