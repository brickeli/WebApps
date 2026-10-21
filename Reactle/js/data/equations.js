export const EQUATION_DATABASE = [
    // --- SYNTHESIS REACTIONS ---
    {
        id: 'water-synthesis',
        category: 'Synthesis',
        difficulty: 'Easy',
        reactants: [{ formula: "H<sub>2</sub>", raw: "H2", coeff: 2 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 1 }],
        products: [{ formula: "H<sub>2</sub>O", raw: "H2O", coeff: 2 }],
        explanation: "Hydrogen gas combines explosively with oxygen gas to form liquid water in a classic synthesis reaction."
    },
    {
        id: 'rust-formation',
        category: 'Synthesis',
        difficulty: 'Medium',
        reactants: [{ formula: "Fe", raw: "Fe", coeff: 4 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 3 }],
        products: [{ formula: "Fe<sub>2</sub>O<sub>3</sub>", raw: "Fe2O3", coeff: 2 }],
        explanation: "Iron oxidizes in the presence of atmospheric oxygen gas to form iron(III) oxide, commonly known as rust."
    },
    {
        id: 'ammonia-synthesis',
        category: 'Synthesis',
        difficulty: 'Medium',
        reactants: [{ formula: "N<sub>2</sub>", raw: "N2", coeff: 1 }, { formula: "H<sub>2</sub>", raw: "H2", coeff: 3 }],
        products: [{ formula: "NH<sub>3</sub>", raw: "NH3", coeff: 2 }],
        explanation: "The Haber process combines nitrogen and hydrogen gas under pressure and high heat to synthesize industrial ammonia."
    },
    {
        id: 'magnesium-oxide-synthesis',
        category: 'Synthesis',
        difficulty: 'Easy',
        reactants: [{ formula: "Mg", raw: "Mg", coeff: 2 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 1 }],
        products: [{ formula: "MgO", raw: "MgO", coeff: 2 }],
        explanation: "Magnesium ribbon ignites with a blinding white light in oxygen gas to form solid magnesium oxide powder."
    },
    {
        id: 'sulfur-trioxide-synthesis',
        category: 'Synthesis',
        difficulty: 'Medium',
        reactants: [{ formula: "SO<sub>2</sub>", raw: "SO2", coeff: 2 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 1 }],
        products: [{ formula: "SO<sub>3</sub>", raw: "SO3", coeff: 2 }],
        explanation: "Sulfur dioxide combines with oxygen gas during the industrial contact process to synthesize sulfur trioxide."
    },

    // --- DECOMPOSITION REACTIONS ---
    {
        id: 'water-electrolysis',
        category: 'Decomposition',
        difficulty: 'Easy',
        reactants: [{ formula: "H<sub>2</sub>O", raw: "H2O", coeff: 2 }],
        products: [{ formula: "H<sub>2</sub>", raw: "H2", coeff: 2 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 1 }],
        explanation: "Electrical current splits liquid water into diatomic hydrogen and oxygen gases."
    },
    {
        id: 'hydrogen-peroxide-decomposition',
        category: 'Decomposition',
        difficulty: 'Easy',
        reactants: [{ formula: "H<sub>2</sub>O<sub>2</sub>", raw: "H2O2", coeff: 2 }],
        products: [{ formula: "H<sub>2</sub>O", raw: "H2O", coeff: 2 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 1 }],
        explanation: "Hydrogen peroxide decomposes into water and oxygen gas, accelerated by light or catalysts like manganese dioxide."
    },
    {
        id: 'calcium-carbonate-decomposition',
        category: 'Decomposition',
        difficulty: 'Medium',
        reactants: [{ formula: "CaCO<sub>3</sub>", raw: "CaCO3", coeff: 1 }],
        products: [{ formula: "CaO", raw: "CaO", coeff: 1 }, { formula: "CO<sub>2</sub>", raw: "CO2", coeff: 1 }],
        explanation: "Thermal decomposition of limestone (calcium carbonate) yields quicklime (calcium oxide) and carbon dioxide gas."
    },
    {
        id: 'potassium-chlorate-decomposition',
        category: 'Decomposition',
        difficulty: 'Medium',
        reactants: [{ formula: "KClO<sub>3</sub>", raw: "KClO3", coeff: 2 }],
        products: [{ formula: "KCl", raw: "KCl", coeff: 2 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 3 }],
        explanation: "Heating potassium chlorate produces solid potassium chloride and releases dense streams of oxygen gas."
    },
    {
        id: 'carbonic-acid-decomposition',
        category: 'Decomposition',
        difficulty: 'Easy',
        reactants: [{ formula: "H<sub>2</sub>CO<sub>3</sub>", raw: "H2CO3", coeff: 1 }],
        products: [{ formula: "H<sub>2</sub>O", raw: "H2O", coeff: 1 }, { formula: "CO<sub>2</sub>", raw: "CO2", coeff: 1 }],
        explanation: "Unstable carbonic acid in carbonated beverages spontaneously breaks down into water and escaping carbon dioxide gas."
    },
    {
        id: 'mercury-oxide-decomposition',
        category: 'Decomposition',
        difficulty: 'Hard',
        reactants: [{ formula: "HgO", raw: "HgO", coeff: 2 }],
        products: [{ formula: "Hg", raw: "Hg", coeff: 2 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 1 }],
        explanation: "Historically significant reaction where heating red mercury(II) oxide releases silvery liquid mercury and oxygen gas."
    },

    // --- COMBUSTION REACTIONS ---
    {
        id: 'methane-combustion',
        category: 'Combustion',
        difficulty: 'Easy',
        reactants: [{ formula: "CH<sub>4</sub>", raw: "CH4", coeff: 1 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 2 }],
        products: [{ formula: "CO<sub>2</sub>", raw: "CO2", coeff: 1 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 2 }],
        explanation: "Complete combustion of natural gas (methane) in oxygen yields carbon dioxide, water vapor, and thermal energy."
    },
    {
        id: 'propane-combustion',
        category: 'Combustion',
        difficulty: 'Hard',
        reactants: [{ formula: "C<sub>3</sub>H<sub>8</sub>", raw: "C3H8", coeff: 1 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 5 }],
        products: [{ formula: "CO<sub>2</sub>", raw: "CO2", coeff: 3 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 4 }],
        explanation: "Propane fuel combusts completely in oxygen, releasing carbon dioxide gas, water vapor, and heat."
    },
    {
        id: 'ethane-combustion',
        category: 'Combustion',
        difficulty: 'Hard',
        reactants: [{ formula: "C<sub>2</sub>H<sub>6</sub>", raw: "C2H6", coeff: 2 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 7 }],
        products: [{ formula: "CO<sub>2</sub>", raw: "CO2", coeff: 4 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 6 }],
        explanation: "Complete combustion of hydrocarbon ethane gas requires seven oxygen molecules to produce carbon dioxide and water vapor."
    },
    {
        id: 'ethanol-combustion',
        category: 'Combustion',
        difficulty: 'Medium',
        reactants: [{ formula: "C<sub>2</sub>H<sub>5</sub>OH", raw: "C2H5OH", coeff: 1 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 3 }],
        products: [{ formula: "CO<sub>2</sub>", raw: "CO2", coeff: 2 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 3 }],
        explanation: "Bioethanol burns cleanly with a blue flame in oxygen to yield carbon dioxide, water vapor, and kinetic heat energy."
    },
    {
        id: 'acetylene-combustion',
        category: 'Combustion',
        difficulty: 'Hard',
        reactants: [{ formula: "C<sub>2</sub>H<sub>2</sub>", raw: "C2H2", coeff: 2 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 5 }],
        products: [{ formula: "CO<sub>2</sub>", raw: "CO2", coeff: 4 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 2 }],
        explanation: "Acetylene combustion generates high-temperature oxy-acetylene flames capable of cutting and welding steel."
    },

    // --- SINGLE REPLACEMENT REACTIONS ---
    {
        id: 'thermite-reaction',
        category: 'Single Replacement',
        difficulty: 'Medium',
        reactants: [{ formula: "Al", raw: "Al", coeff: 2 }, { formula: "Fe<sub>2</sub>O<sub>3</sub>", raw: "Fe2O3", coeff: 1 }],
        products: [{ formula: "Al<sub>2</sub>O<sub>3</sub>", raw: "Al2O3", coeff: 1 }, { formula: "Fe", raw: "Fe", coeff: 2 }],
        explanation: "The thermite reaction generates molten iron used to weld railway tracks due to extreme exothermic energy."
    },
    {
        id: 'zinc-hydrochloric-acid',
        category: 'Single Replacement',
        difficulty: 'Easy',
        reactants: [{ formula: "Zn", raw: "Zn", coeff: 1 }, { formula: "HCl", raw: "HCl", coeff: 2 }],
        products: [{ formula: "ZnCl<sub>2</sub>", raw: "ZnCl2", coeff: 1 }, { formula: "H<sub>2</sub>", raw: "H2", coeff: 1 }],
        explanation: "Zinc metal reacts with hydrochloric acid, displacing hydrogen gas and forming aqueous zinc chloride."
    },
    {
        id: 'iron-copper-sulfate-displacement',
        category: 'Single Replacement',
        difficulty: 'Easy',
        reactants: [{ formula: "Fe", raw: "Fe", coeff: 1 }, { formula: "CuSO<sub>4</sub>", raw: "CuSO4", coeff: 1 }],
        products: [{ formula: "FeSO<sub>4</sub>", raw: "FeSO4", coeff: 1 }, { formula: "Cu", raw: "Cu", coeff: 1 }],
        explanation: "Iron nail immersed in blue copper(II) sulfate solution displaces reddish copper metal onto the iron surface."
    },
    {
        id: 'copper-silver-nitrate-displacement',
        category: 'Single Replacement',
        difficulty: 'Medium',
        reactants: [{ formula: "Cu", raw: "Cu", coeff: 1 }, { formula: "AgNO<sub>3</sub>", raw: "AgNO3", coeff: 2 }],
        products: [{ formula: "Cu(NO<sub>3</sub>)<sub>2</sub>", raw: "Cu(NO3)2", coeff: 1 }, { formula: "Ag", raw: "Ag", coeff: 2 }],
        explanation: "Copper wire in silver nitrate solution displaces elemental silver crystals while turning the solution blue."
    },
    {
        id: 'chlorine-potassium-bromide-replacement',
        category: 'Single Replacement',
        difficulty: 'Medium',
        reactants: [{ formula: "Cl<sub>2</sub>", raw: "Cl2", coeff: 1 }, { formula: "KBr", raw: "KBr", coeff: 2 }],
        products: [{ formula: "KCl", raw: "KCl", coeff: 2 }, { formula: "Br<sub>2</sub>", raw: "Br2", coeff: 1 }],
        explanation: "More reactive chlorine gas displaces bromine from potassium bromide solution, liberating orange bromine liquid."
    },
    {
        id: 'magnesium-hydrochloric-acid',
        category: 'Single Replacement',
        difficulty: 'Easy',
        reactants: [{ formula: "Mg", raw: "Mg", coeff: 1 }, { formula: "HCl", raw: "HCl", coeff: 2 }],
        products: [{ formula: "MgCl<sub>2</sub>", raw: "MgCl2", coeff: 1 }, { formula: "H<sub>2</sub>", raw: "H2", coeff: 1 }],
        explanation: "Magnesium ribbon reacts vigorously in hydrochloric acid, producing magnesium chloride salt and bubbling hydrogen gas."
    },
    {
        id: 'sodium-water-reaction',
        category: 'Single Replacement',
        difficulty: 'Hard',
        reactants: [{ formula: "Na", raw: "Na", coeff: 2 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 2 }],
        products: [{ formula: "NaOH", raw: "NaOH", coeff: 2 }, { formula: "H<sub>2</sub>", raw: "H2", coeff: 1 }],
        explanation: "Highly reactive sodium metal displaces hydrogen from water, forming aqueous sodium hydroxide base and flammable hydrogen gas."
    },
    {
        id: 'aluminum-copper-chloride',
        category: 'Single Replacement',
        difficulty: 'Hard',
        reactants: [{ formula: "Al", raw: "Al", coeff: 2 }, { formula: "CuCl<sub>2</sub>", raw: "CuCl2", coeff: 3 }],
        products: [{ formula: "AlCl<sub>3</sub>", raw: "AlCl3", coeff: 2 }, { formula: "Cu", raw: "Cu", coeff: 3 }],
        explanation: "Aluminum foil reacts exothermically in copper(II) chloride solution, displacing copper metal while forming aluminum chloride."
    },

    // --- DOUBLE REPLACEMENT REACTIONS ---
    {
        id: 'silver-chloride-precipitation',
        category: 'Double Replacement',
        difficulty: 'Easy',
        reactants: [{ formula: "AgNO<sub>3</sub>", raw: "AgNO3", coeff: 1 }, { formula: "NaCl", raw: "NaCl", coeff: 1 }],
        products: [{ formula: "AgCl", raw: "AgCl", coeff: 1 }, { formula: "NaNO<sub>3</sub>", raw: "NaNO3", coeff: 1 }],
        explanation: "Silver nitrate and sodium chloride exchange ions to form an insoluble white precipitate of silver chloride."
    },
    {
        id: 'lead-iodide-precipitation',
        category: 'Double Replacement',
        difficulty: 'Medium',
        reactants: [{ formula: "Pb(NO<sub>3</sub>)<sub>2</sub>", raw: "Pb(NO3)2", coeff: 1 }, { formula: "KI", raw: "KI", coeff: 2 }],
        products: [{ formula: "PbI<sub>2</sub>", raw: "PbI2", coeff: 1 }, { formula: "KNO<sub>3</sub>", raw: "KNO3", coeff: 2 }],
        explanation: "Mixing clear lead(II) nitrate and potassium iodide solutions produces a vibrant yellow lead(II) iodide precipitate."
    },
    {
        id: 'barium-sulfate-precipitation',
        category: 'Double Replacement',
        difficulty: 'Easy',
        reactants: [{ formula: "BaCl<sub>2</sub>", raw: "BaCl2", coeff: 1 }, { formula: "Na<sub>2</sub>SO<sub>4</sub>", raw: "Na2SO4", coeff: 1 }],
        products: [{ formula: "BaSO<sub>4</sub>", raw: "BaSO4", coeff: 1 }, { formula: "NaCl", raw: "NaCl", coeff: 2 }],
        explanation: "Barium chloride reacts with sodium sulfate to yield a dense white precipitate of barium sulfate."
    },
    {
        id: 'copper-hydroxide-precipitation',
        category: 'Double Replacement',
        difficulty: 'Medium',
        reactants: [{ formula: "CuSO<sub>4</sub>", raw: "CuSO4", coeff: 1 }, { formula: "NaOH", raw: "NaOH", coeff: 2 }],
        products: [{ formula: "Cu(OH)<sub>2</sub>", raw: "Cu(OH)2", coeff: 1 }, { formula: "Na<sub>2</sub>SO<sub>4</sub>", raw: "Na2SO4", coeff: 1 }],
        explanation: "Copper(II) sulfate and sodium hydroxide react in solution to form a gelatinous light blue copper(II) hydroxide precipitate."
    },
    {
        id: 'calcium-carbonate-precipitation',
        category: 'Double Replacement',
        difficulty: 'Easy',
        reactants: [{ formula: "CaCl<sub>2</sub>", raw: "CaCl2", coeff: 1 }, { formula: "Na<sub>2</sub>CO<sub>3</sub>", raw: "Na2CO3", coeff: 1 }],
        products: [{ formula: "CaCO<sub>3</sub>", raw: "CaCO3", coeff: 1 }, { formula: "NaCl", raw: "NaCl", coeff: 2 }],
        explanation: "Calcium chloride and sodium carbonate swap partner ions to yield insoluble calcium carbonate (chalk)."
    },
    {
        id: 'hydrogen-sulfide-gas-evolution',
        category: 'Double Replacement',
        difficulty: 'Medium',
        reactants: [{ formula: "K<sub>2</sub>S", raw: "K2S", coeff: 1 }, { formula: "HCl", raw: "HCl", coeff: 2 }],
        products: [{ formula: "KCl", raw: "KCl", coeff: 2 }, { formula: "H<sub>2</sub>S", raw: "H2S", coeff: 1 }],
        explanation: "Potassium sulfide reacts with hydrochloric acid, giving off toxic hydrogen sulfide gas with a distinct rotten egg odor."
    },
    {
        id: 'potassium-sulfate-barium-nitrate',
        category: 'Double Replacement',
        difficulty: 'Easy',
        reactants: [{ formula: "K<sub>2</sub>SO<sub>4</sub>", raw: "K2SO4", coeff: 1 }, { formula: "Ba(NO<sub>3</sub>)<sub>2</sub>", raw: "Ba(NO3)2", coeff: 1 }],
        products: [{ formula: "BaSO<sub>4</sub>", raw: "BaSO4", coeff: 1 }, { formula: "KNO<sub>3</sub>", raw: "KNO3", coeff: 2 }],
        explanation: "Potassium sulfate and barium nitrate swap ions in solution, precipitating insoluble white barium sulfate."
    },
    {
        id: 'ammonium-chloride-sodium-hydroxide',
        category: 'Double Replacement',
        difficulty: 'Medium',
        reactants: [{ formula: "NH<sub>4</sub>Cl", raw: "NH4Cl", coeff: 1 }, { formula: "NaOH", raw: "NaOH", coeff: 1 }],
        products: [{ formula: "NaCl", raw: "NaCl", coeff: 1 }, { formula: "NH<sub>3</sub>", raw: "NH3", coeff: 1 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 1 }],
        explanation: "Reaction of ammonium chloride with sodium hydroxide yields table salt, water, and pungent ammonia gas."
    },

    // --- ACID-BASE REACTIONS ---
    {
        id: 'hydrochloric-acid-sodium-hydroxide',
        category: 'Acid-Base',
        difficulty: 'Easy',
        reactants: [{ formula: "HCl", raw: "HCl", coeff: 1 }, { formula: "NaOH", raw: "NaOH", coeff: 1 }],
        products: [{ formula: "NaCl", raw: "NaCl", coeff: 1 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 1 }],
        explanation: "A classic neutralization reaction where a strong acid and a strong base form neutral table salt and water."
    },
    {
        id: 'sulfuric-acid-sodium-hydroxide',
        category: 'Acid-Base',
        difficulty: 'Medium',
        reactants: [{ formula: "H<sub>2</sub>SO<sub>4</sub>", raw: "H2SO4", coeff: 1 }, { formula: "NaOH", raw: "NaOH", coeff: 2 }],
        products: [{ formula: "Na<sub>2</sub>SO<sub>4</sub>", raw: "Na2SO4", coeff: 1 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 2 }],
        explanation: "Diprotic sulfuric acid requires two sodium hydroxide molecules to completely neutralize and form sodium sulfate and water."
    },
    {
        id: 'nitric-acid-calcium-hydroxide',
        category: 'Acid-Base',
        difficulty: 'Medium',
        reactants: [{ formula: "HNO<sub>3</sub>", raw: "HNO3", coeff: 2 }, { formula: "Ca(OH)<sub>2</sub>", raw: "Ca(OH)2", coeff: 1 }],
        products: [{ formula: "Ca(NO<sub>3</sub>)<sub>2</sub>", raw: "Ca(NO3)2", coeff: 1 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 2 }],
        explanation: "Two units of nitric acid react with calcium hydroxide to produce calcium nitrate salt and water."
    },
    {
        id: 'baking-soda-acid-neutralization',
        category: 'Acid-Base',
        difficulty: 'Hard',
        reactants: [{ formula: "NaHCO<sub>3</sub>", raw: "NaHCO3", coeff: 1 }, { formula: "HCl", raw: "HCl", coeff: 1 }],
        products: [{ formula: "NaCl", raw: "NaCl", coeff: 1 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 1 }, { formula: "CO<sub>2</sub>", raw: "CO2", coeff: 1 }],
        explanation: "Sodium bicarbonate neutralizes hydrochloric acid to produce sodium chloride, water, and carbon dioxide gas bubbles."
    },
    {
        id: 'calcium-carbonate-acid-neutralization',
        category: 'Acid-Base',
        difficulty: 'Hard',
        reactants: [{ formula: "CaCO<sub>3</sub>", raw: "CaCO3", coeff: 1 }, { formula: "HCl", raw: "HCl", coeff: 2 }],
        products: [{ formula: "CaCl<sub>2</sub>", raw: "CaCl2", coeff: 1 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 1 }, { formula: "CO<sub>2</sub>", raw: "CO2", coeff: 1 }],
        explanation: "Antacid digestion action where hydrochloric acid dissolves calcium carbonate, forming calcium chloride, water, and carbon dioxide gas."
    },
    {
        id: 'acetic-acid-sodium-hydroxide',
        category: 'Acid-Base',
        difficulty: 'Easy',
        reactants: [{ formula: "CH<sub>3</sub>COOH", raw: "CH3COOH", coeff: 1 }, { formula: "NaOH", raw: "NaOH", coeff: 1 }],
        products: [{ formula: "CH<sub>3</sub>COONa", raw: "CH3COONa", coeff: 1 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 1 }],
        explanation: "Weak acetic acid (vinegar) reacts with strong sodium hydroxide base to yield sodium acetate salt and water."
    },
    {
        id: 'sulfuric-acid-potassium-hydroxide',
        category: 'Acid-Base',
        difficulty: 'Medium',
        reactants: [{ formula: "H<sub>2</sub>SO<sub>4</sub>", raw: "H2SO4", coeff: 1 }, { formula: "KOH", raw: "KOH", coeff: 2 }],
        products: [{ formula: "K<sub>2</sub>SO<sub>4</sub>", raw: "K2SO4", coeff: 1 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 2 }],
        explanation: "Diprotic sulfuric acid requires two units of potassium hydroxide base to produce potassium sulfate salt and water."
    },

    // --- BIOLOGICAL REACTIONS ---
    {
        id: 'cellular-respiration',
        category: 'Biological',
        difficulty: 'Hard',
        reactants: [{ formula: "C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>", raw: "C6H12O6", coeff: 1 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 6 }],
        products: [{ formula: "CO<sub>2</sub>", raw: "CO2", coeff: 6 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 6 }],
        explanation: "Cells metabolize glucose with oxygen to yield energy (ATP), carbon dioxide, and water."
    },
    {
        id: 'photosynthesis',
        category: 'Biological',
        difficulty: 'Hard',
        reactants: [{ formula: "CO<sub>2</sub>", raw: "CO2", coeff: 6 }, { formula: "H<sub>2</sub>O", raw: "H2O", coeff: 6 }],
        products: [{ formula: "C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>", raw: "C6H12O6", coeff: 1 }, { formula: "O<sub>2</sub>", raw: "O2", coeff: 6 }],
        explanation: "Plants utilize solar energy to convert atmospheric carbon dioxide and water into glucose sugar and oxygen gas."
    },
    {
        id: 'alcoholic-fermentation',
        category: 'Biological',
        difficulty: 'Hard',
        reactants: [{ formula: "C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>", raw: "C6H12O6", coeff: 1 }],
        products: [{ formula: "C<sub>2</sub>H<sub>5</sub>OH", raw: "C2H5OH", coeff: 2 }, { formula: "CO<sub>2</sub>", raw: "CO2", coeff: 2 }],
        explanation: "Yeast cells break down glucose under anaerobic conditions to produce ethanol and carbon dioxide bubbles."
    },
    {
        id: 'lactic-acid-fermentation',
        category: 'Biological',
        difficulty: 'Easy',
        reactants: [{ formula: "C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>", raw: "C6H12O6", coeff: 1 }],
        products: [{ formula: "C<sub>3</sub>H<sub>6</sub>O<sub>3</sub>", raw: "C3H6O3", coeff: 2 }],
        explanation: "Anaerobic respiration in overworked muscle tissues converts glucose directly into two units of lactic acid."
    }
];
