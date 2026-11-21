import { playSound } from '../engine/audio.js';

const FUNCTIONAL_GROUPS = [
    {
        id: 'alkane',
        name: 'Alkane (Single Bond)',
        family: 'Hydrocarbons',
        formula: 'R–CH₂–CH₃',
        suffix: '-ane',
        polarity: 'Nonpolar',
        example: 'Methane (natural gas), Propane, Octane (gasoline)',
        clue: 'Saturated hydrocarbon skeleton made purely of single C–C and C–H bonds; hydrophobic and undergoes combustion.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="36" y1="62" x2="82" y2="38" class="fg-bond-muted" />
                <line x1="82" y1="38" x2="128" y2="62" class="fg-bond-accent" />
                <line x1="128" y1="62" x2="168" y2="42" class="fg-bond-muted" />
                <text x="22" y="68" class="fg-atom-muted">R</text>
                <text x="82" y="29" text-anchor="middle" class="fg-atom-accent">CH₂</text>
                <text x="128" y="80" text-anchor="middle" class="fg-atom-accent">CH₂</text>
                <text x="176" y="46" class="fg-atom-muted">R′</text>
            </svg>
        `
    },
    {
        id: 'alkene',
        name: 'Alkene (Double Bond)',
        family: 'Hydrocarbons',
        formula: 'R₂C=CR₂',
        suffix: '-ene',
        polarity: 'Nonpolar',
        example: 'Ethylene (fruit-ripening plant hormone), Beta-carotene',
        clue: 'Unsaturated carbon-carbon double bond (one sigma + one pi bond) that locks rotation and readily undergoes addition reactions.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="36" y1="26" x2="68" y2="50" class="fg-bond-muted" />
                <line x1="36" y1="74" x2="68" y2="50" class="fg-bond-muted" />
                <line x1="68" y1="45" x2="132" y2="45" class="fg-bond-accent" />
                <line x1="68" y1="55" x2="132" y2="55" class="fg-bond-accent" />
                <line x1="132" y1="50" x2="164" y2="26" class="fg-bond-muted" />
                <line x1="132" y1="50" x2="164" y2="74" class="fg-bond-muted" />
                <text x="22" y="28" class="fg-atom-muted">R</text>
                <text x="22" y="80" class="fg-atom-muted">R</text>
                <text x="68" y="36" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="132" y="36" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="170" y="28" class="fg-atom-muted">R</text>
                <text x="170" y="80" class="fg-atom-muted">R</text>
            </svg>
        `
    },
    {
        id: 'alkyne',
        name: 'Alkyne (Triple Bond)',
        family: 'Hydrocarbons',
        formula: 'R–C≡C–R′',
        suffix: '-yne',
        polarity: 'Nonpolar',
        example: 'Acetylene (welding torch fuel)',
        clue: 'Linear carbon-carbon triple bond (180° geometry) with high electron density and a mildly acidic terminal C–H proton.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="32" y1="50" x2="68" y2="50" class="fg-bond-muted" />
                <line x1="68" y1="42" x2="132" y2="42" class="fg-bond-accent" />
                <line x1="68" y1="50" x2="132" y2="50" class="fg-bond-accent" />
                <line x1="68" y1="58" x2="132" y2="58" class="fg-bond-accent" />
                <line x1="132" y1="50" x2="168" y2="50" class="fg-bond-muted" />
                <text x="18" y="55" class="fg-atom-muted">R</text>
                <text x="68" y="32" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="132" y="32" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="174" y="55" class="fg-atom-muted">R′</text>
            </svg>
        `
    },
    {
        id: 'aromatic',
        name: 'Aromatic / Phenyl Ring',
        family: 'Hydrocarbons',
        formula: 'C₆H₅–R',
        suffix: 'phenyl- / -benzene',
        polarity: 'Nonpolar',
        example: 'Aspirin, Ibuprofen, Caffeine, Vanillin',
        clue: 'Planar six-carbon ring with delocalized pi electrons; unusually stable and favors substitution over addition.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <polygon points="90,18 122,36 122,72 90,90 58,72 58,36" class="fg-ring-accent" />
                <circle cx="90" cy="54" r="18" class="fg-ring-accent" />
                <line x1="122" y1="36" x2="156" y2="22" class="fg-bond-muted" />
                <text x="162" y="26" class="fg-atom-muted">R</text>
            </svg>
        `
    },
    {
        id: 'alcohol',
        name: 'Alcohol (Hydroxyl)',
        family: 'Oxygen-Containing',
        formula: 'R–OH',
        suffix: '-ol',
        polarity: 'Polar (H-Bonding)',
        example: 'Ethanol, Isopropanol (rubbing alcohol), Menthol',
        clue: 'Hydroxyl group (–OH) bonded to a saturated carbon; forms strong hydrogen bonds that raise boiling points and water solubility.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="48" y1="52" x2="81" y2="52" class="fg-bond-muted" />
                <line x1="104" y1="52" x2="152" y2="52" class="fg-bond-accent" />
                <text x="32" y="58" class="fg-atom-muted">R</text>
                <text x="92" y="58" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="162" y="58" class="fg-atom-accent">H</text>
            </svg>
        `
    },
    {
        id: 'ether',
        name: 'Ether',
        family: 'Oxygen-Containing',
        formula: 'R–O–R′',
        suffix: 'alkoxy- / -ether',
        polarity: 'Moderately Polar',
        example: 'Diethyl ether (historic anesthetic), THF (lab solvent)',
        clue: 'Oxygen atom bridging two carbon groups; lacks an O–H bond so it cannot hydrogen-bond with itself, making it volatile and unreactive.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="44" y1="62" x2="88" y2="42" class="fg-bond-muted" />
                <line x1="112" y1="42" x2="156" y2="62" class="fg-bond-muted" />
                <text x="30" y="68" class="fg-atom-muted">R</text>
                <text x="100" y="45" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="162" y="68" class="fg-atom-muted">R′</text>
            </svg>
        `
    },
    {
        id: 'aldehyde',
        name: 'Aldehyde',
        family: 'Carbonyls',
        formula: 'R–CHO',
        suffix: '-al',
        polarity: 'Polar',
        example: 'Vanillin (vanilla), Cinnamaldehyde (cinnamon), Formaldehyde',
        clue: 'Terminal carbonyl group (C=O) bonded to at least one hydrogen atom; easily oxidized to a carboxylic acid.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="44" y1="74" x2="92" y2="52" class="fg-bond-muted" />
                <line x1="96" y1="42" x2="96" y2="20" class="fg-bond-accent" />
                <line x1="104" y1="42" x2="104" y2="20" class="fg-bond-accent" />
                <line x1="110" y1="52" x2="152" y2="72" class="fg-bond-accent" />
                <text x="28" y="80" class="fg-atom-muted">R</text>
                <text x="100" y="58" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="100" y="16" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="160" y="80" class="fg-atom-accent">H</text>
            </svg>
        `
    },
    {
        id: 'ketone',
        name: 'Ketone',
        family: 'Carbonyls',
        formula: 'R–CO–R′',
        suffix: '-one',
        polarity: 'Polar',
        example: 'Acetone (nail polish remover), Fructose, Testosterone',
        clue: 'Internal carbonyl group (C=O) flanked by two carbon chains; resists mild oxidation unlike aldehydes.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="44" y1="74" x2="92" y2="52" class="fg-bond-muted" />
                <line x1="96" y1="42" x2="96" y2="20" class="fg-bond-accent" />
                <line x1="104" y1="42" x2="104" y2="20" class="fg-bond-accent" />
                <line x1="110" y1="52" x2="156" y2="74" class="fg-bond-muted" />
                <text x="28" y="80" class="fg-atom-muted">R</text>
                <text x="100" y="58" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="100" y="16" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="162" y="80" class="fg-atom-muted">R′</text>
            </svg>
        `
    },
    {
        id: 'carboxylic-acid',
        name: 'Carboxylic Acid',
        family: 'Carbonyls',
        formula: 'R–COOH',
        suffix: '-oic acid',
        polarity: 'Very Polar (Acidic)',
        example: 'Acetic acid (vinegar), Citric acid (citrus), Lactic acid',
        clue: 'Combines a carbonyl (C=O) and hydroxyl (–OH) on the same carbon; donates a proton (H⁺) to form resonance-stabilized carboxylate ions.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="36" y1="74" x2="82" y2="52" class="fg-bond-muted" />
                <line x1="86" y1="42" x2="86" y2="20" class="fg-bond-accent" />
                <line x1="94" y1="42" x2="94" y2="20" class="fg-bond-accent" />
                <line x1="100" y1="52" x2="132" y2="68" class="fg-bond-accent" />
                <line x1="150" y1="72" x2="172" y2="62" class="fg-bond-accent" />
                <text x="22" y="80" class="fg-atom-muted">R</text>
                <text x="90" y="58" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="90" y="16" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="142" y="78" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="176" y="64" class="fg-atom-accent">H</text>
            </svg>
        `
    },
    {
        id: 'ester',
        name: 'Ester',
        family: 'Carbonyls',
        formula: 'R–COO–R′',
        suffix: '-oate',
        polarity: 'Moderately Polar',
        example: 'Isoamyl acetate (banana scent), Methyl salicylate (wintergreen)',
        clue: 'Derived from a carboxylic acid and an alcohol; famous for pleasant fruity and floral aromas in nature.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="36" y1="74" x2="82" y2="52" class="fg-bond-muted" />
                <line x1="86" y1="42" x2="86" y2="20" class="fg-bond-accent" />
                <line x1="94" y1="42" x2="94" y2="20" class="fg-bond-accent" />
                <line x1="100" y1="52" x2="132" y2="68" class="fg-bond-accent" />
                <line x1="150" y1="68" x2="174" y2="54" class="fg-bond-muted" />
                <text x="22" y="80" class="fg-atom-muted">R</text>
                <text x="90" y="58" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="90" y="16" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="142" y="78" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="178" y="56" class="fg-atom-muted">R′</text>
            </svg>
        `
    },
    {
        id: 'amine',
        name: 'Amine',
        family: 'Nitrogen-Containing',
        formula: 'R–NH₂',
        suffix: '-amine',
        polarity: 'Polar (Basic)',
        example: 'Dopamine, Adrenaline, Caffeine, Amino acids',
        clue: 'Organic derivative of ammonia with a nitrogen lone pair that acts as a weak Brønsted-Lowry base by accepting protons.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="42" y1="56" x2="90" y2="56" class="fg-bond-muted" />
                <line x1="108" y1="48" x2="142" y2="28" class="fg-bond-accent" />
                <line x1="108" y1="62" x2="142" y2="80" class="fg-bond-accent" />
                <text x="26" y="62" class="fg-atom-muted">R</text>
                <text x="100" y="62" text-anchor="middle" class="fg-atom-accent">N</text>
                <text x="148" y="30" class="fg-atom-accent">H</text>
                <text x="148" y="86" class="fg-atom-accent">H</text>
            </svg>
        `
    },
    {
        id: 'amide',
        name: 'Amide (Peptide Bond)',
        family: 'Nitrogen-Containing',
        formula: 'R–CONH₂',
        suffix: '-amide',
        polarity: 'Very Polar',
        example: 'Proteins (peptide backbone), Acetaminophen (Tylenol), Nylon',
        clue: 'Carbonyl bonded directly to nitrogen; resonance makes the C–N bond rigid and planar, forming the structural backbone of all proteins.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="34" y1="74" x2="80" y2="52" class="fg-bond-muted" />
                <line x1="84" y1="42" x2="84" y2="20" class="fg-bond-accent" />
                <line x1="92" y1="42" x2="92" y2="20" class="fg-bond-accent" />
                <line x1="98" y1="52" x2="130" y2="68" class="fg-bond-accent" />
                <line x1="148" y1="66" x2="174" y2="48" class="fg-bond-accent" />
                <line x1="146" y1="76" x2="170" y2="90" class="fg-bond-accent" />
                <text x="20" y="80" class="fg-atom-muted">R</text>
                <text x="88" y="58" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="88" y="16" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="139" y="76" text-anchor="middle" class="fg-atom-accent">N</text>
                <text x="178" y="50" class="fg-atom-accent">H</text>
                <text x="174" y="95" class="fg-atom-accent">H</text>
            </svg>
        `
    },
    {
        id: 'thiol',
        name: 'Thiol (Sulfhydryl)',
        family: 'Sulfur & Phosphorus',
        formula: 'R–SH',
        suffix: '-thiol / mercapto-',
        polarity: 'Slightly Polar',
        example: 'Cysteine (amino acid), Garlic compounds, Natural gas odorant',
        clue: 'Sulfur analog of an alcohol (–SH); forms weaker hydrogen bonds than –OH, is more acidic, and is famous for pungent odors.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="48" y1="52" x2="104" y2="52" class="fg-bond-muted" />
                <line x1="124" y1="52" x2="152" y2="52" class="fg-bond-accent" />
                <text x="32" y="58" class="fg-atom-muted">R</text>
                <text x="114" y="58" text-anchor="middle" class="fg-atom-accent">S</text>
                <text x="162" y="58" class="fg-atom-accent">H</text>
            </svg>
        `
    },
    {
        id: 'disulfide',
        name: 'Disulfide Bridge',
        family: 'Sulfur & Phosphorus',
        formula: 'R–S–S–R′',
        suffix: 'disulfide',
        polarity: 'Nonpolar',
        example: 'Keratin (hair structure), Insulin (protein cross-links)',
        clue: 'Covalent sulfur–sulfur bond formed by oxidizing two thiol groups; acts as a molecular staple stabilizing 3D protein shapes.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="34" y1="62" x2="74" y2="44" class="fg-bond-muted" />
                <line x1="90" y1="44" x2="114" y2="56" class="fg-bond-accent" />
                <line x1="130" y1="56" x2="166" y2="40" class="fg-bond-muted" />
                <text x="20" y="68" class="fg-atom-muted">R</text>
                <text x="82" y="46" text-anchor="middle" class="fg-atom-accent">S</text>
                <text x="122" y="64" text-anchor="middle" class="fg-atom-accent">S</text>
                <text x="172" y="44" class="fg-atom-muted">R′</text>
            </svg>
        `
    },
    {
        id: 'phosphate',
        name: 'Phosphate Group',
        family: 'Sulfur & Phosphorus',
        formula: 'R–OPO₃²⁻',
        suffix: 'phospho- / -phosphate',
        polarity: 'Very Polar (Ionic)',
        example: 'ATP (cellular energy), DNA & RNA backbone, Phospholipids',
        clue: 'Phosphorus surrounded by four oxygens; carries negative charges at physiological pH and stores high-energy bonds in ATP.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="28" y1="54" x2="64" y2="54" class="fg-bond-muted" />
                <line x1="82" y1="54" x2="108" y2="54" class="fg-bond-accent" />
                <line x1="115" y1="42" x2="115" y2="22" class="fg-bond-accent" />
                <line x1="121" y1="42" x2="121" y2="22" class="fg-bond-accent" />
                <line x1="118" y1="66" x2="118" y2="82" class="fg-bond-accent" />
                <line x1="130" y1="54" x2="154" y2="54" class="fg-bond-accent" />
                <text x="16" y="59" class="fg-atom-muted">R</text>
                <text x="73" y="59" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="118" y="60" text-anchor="middle" class="fg-atom-accent">P</text>
                <text x="118" y="18" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="118" y="95" text-anchor="middle" class="fg-atom-accent">O⁻</text>
                <text x="168" y="59" text-anchor="middle" class="fg-atom-accent">O⁻</text>
            </svg>
        `
    },
    {
        id: 'alkyl-halide',
        name: 'Alkyl Halide (Haloalkane)',
        family: 'Halogens',
        formula: 'R–X (F, Cl, Br, I)',
        suffix: 'fluoro- / chloro- / bromo-',
        polarity: 'Moderately Polar',
        example: 'Chloroform, Teflon (PTFE), Refrigerants, PVC',
        clue: 'Carbon bonded to an electronegative halogen atom; creates a polar C–X bond that makes the carbon an easy target for substitution reactions.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="56" y1="44" x2="122" y2="44" class="fg-bond-muted" />
                <text x="40" y="50" class="fg-atom-muted">R</text>
                <text x="136" y="50" text-anchor="middle" class="fg-atom-accent">X</text>
                <text x="136" y="68" text-anchor="middle" class="fg-atom-muted" style="font-size: 11px;">(F, Cl, Br, I)</text>
            </svg>
        `
    },
    {
        id: 'acyl-chloride',
        name: 'Acyl Chloride (Acid Halide)',
        family: 'Halogens',
        formula: 'R–COCl',
        suffix: '-oyl chloride',
        polarity: 'Polar (Highly Reactive)',
        example: 'Acetyl chloride (used in aspirin synthesis)',
        clue: 'Carbonyl bonded directly to chlorine; the most reactive carboxylic acid derivative, reacting rapidly even with water.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="40" y1="74" x2="88" y2="52" class="fg-bond-muted" />
                <line x1="92" y1="42" x2="92" y2="20" class="fg-bond-accent" />
                <line x1="100" y1="42" x2="100" y2="20" class="fg-bond-accent" />
                <line x1="106" y1="52" x2="146" y2="72" class="fg-bond-accent" />
                <text x="24" y="80" class="fg-atom-muted">R</text>
                <text x="96" y="58" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="96" y="16" text-anchor="middle" class="fg-atom-accent">O</text>
                <text x="160" y="80" text-anchor="middle" class="fg-atom-accent">Cl</text>
            </svg>
        `
    },
    {
        id: 'nitrile',
        name: 'Nitrile',
        family: 'Nitrogen-Containing',
        formula: 'R–C≡N',
        suffix: '-nitrile / cyano-',
        polarity: 'Very Polar',
        example: 'Acetonitrile (HPLC lab solvent), Nitrile lab gloves',
        clue: 'Carbon triple-bonded to nitrogen in a linear 180° geometry; strongly polar and can be hydrolyzed into a carboxylic acid.',
        svg: `
            <svg viewBox="0 0 200 100" class="fg-svg" aria-hidden="true">
                <line x1="36" y1="50" x2="76" y2="50" class="fg-bond-muted" />
                <line x1="94" y1="42" x2="144" y2="42" class="fg-bond-accent" />
                <line x1="94" y1="50" x2="144" y2="50" class="fg-bond-accent" />
                <line x1="94" y1="58" x2="144" y2="58" class="fg-bond-accent" />
                <text x="22" y="55" class="fg-atom-muted">R</text>
                <text x="85" y="55" text-anchor="middle" class="fg-atom-accent">C</text>
                <text x="156" y="55" text-anchor="middle" class="fg-atom-accent">N</text>
            </svg>
        `
    }
];

const FAMILIES = ['All', 'Hydrocarbons', 'Oxygen-Containing', 'Carbonyls', 'Nitrogen-Containing', 'Sulfur & Phosphorus', 'Halogens'];

function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function mountTool(container) {
    let viewMode = 'explore'; // 'explore' | 'quiz'
    let activeFamily = 'All';
    let searchQuery = '';

    // Quiz state
    let quizScore = 0;
    let quizStreak = 0;
    let currentQuestion = null;
    let answeredId = null;

    container.innerHTML = `
        <div class="lab-stack">
            <!-- Header & View Mode Switcher -->
            <div class="lab-panel glass-panel">
                <div class="lab-tool-header mb-md">
                    <div>
                        <span class="lab-eyebrow">
                            <i class="fa-solid fa-diagram-project" aria-hidden="true"></i>
                            Organic Chemistry
                        </span>
                        <h2 class="lab-heading">Functional Groups Studio</h2>
                        <p class="lab-subtitle">
                            Recognize the reactive atom clusters (highlighted in violet) that give organic molecules their smells, acidity, and reactivity.
                        </p>
                    </div>

                    <div class="lab-tabs" role="tablist" aria-label="Functional groups mode">
                        <button type="button" class="lab-tab is-active" data-view="explore" role="tab" aria-selected="true">
                            <i class="fa-solid fa-compass" aria-hidden="true"></i>
                            <span>Explore Structures</span>
                        </button>
                        <button type="button" class="lab-tab" data-view="quiz" role="tab" aria-selected="false">
                            <i class="fa-solid fa-brain" aria-hidden="true"></i>
                            <span>Spot the Group Quiz</span>
                        </button>
                    </div>
                </div>

                <!-- Explore Filter & Search Bar -->
                <div id="fg-explore-controls" class="fg-controls">
                    <div class="lab-search-wrap">
                        <label for="fg-search" class="sr-only">Search functional groups</label>
                        <i class="fa-solid fa-magnifying-glass lab-search-icon" aria-hidden="true"></i>
                        <input
                            type="search"
                            id="fg-search"
                            name="fg-search"
                            class="lab-search-input"
                            placeholder="Search name, -ol, -oic acid, vinegar..."
                            autocomplete="off"
                        />
                    </div>
                    <div class="lab-chip-row" role="tablist" aria-label="Filter by chemical family">
                        ${FAMILIES.map(
                            (fam) => `
                            <button
                                type="button"
                                class="lab-chip ${fam === 'All' ? 'is-active' : ''}"
                                data-family="${fam}"
                                role="tab"
                                aria-selected="${fam === 'All'}"
                            >
                                ${fam}
                            </button>
                        `
                        ).join('')}
                    </div>
                </div>
            </div>

            <!-- EXPLORE GALLERY -->
            <div id="fg-gallery" class="fg-gallery"></div>

            <!-- PRACTICE QUIZ WORKSPACE -->
            <div id="fg-quiz-wrap" class="hidden"></div>
        </div>
    `;

    const viewTabs = container.querySelectorAll('.lab-tab');
    const exploreControls = container.querySelector('#fg-explore-controls');
    const familyChips = container.querySelectorAll('[data-family]');
    const searchInput = container.querySelector('#fg-search');
    const galleryEl = container.querySelector('#fg-gallery');
    const quizWrap = container.querySelector('#fg-quiz-wrap');

    function renderGallery() {
        const q = searchQuery.trim().toLowerCase();
        const filtered = FUNCTIONAL_GROUPS.filter((fg) => {
            const famMatch = activeFamily === 'All' || fg.family === activeFamily;
            if (!famMatch) return false;
            if (!q) return true;
            return (
                fg.name.toLowerCase().includes(q) ||
                fg.suffix.toLowerCase().includes(q) ||
                fg.formula.toLowerCase().includes(q) ||
                fg.example.toLowerCase().includes(q) ||
                fg.clue.toLowerCase().includes(q)
            );
        });

        if (filtered.length === 0) {
            galleryEl.innerHTML = `<div class="fg-card glass-panel"><p class="lab-subtitle">No functional groups match your search or family filter.</p></div>`;
            return;
        }

        galleryEl.innerHTML = filtered
            .map(
                (fg) => `
                <article class="lab-panel fg-item-card glass-panel">
                    <div class="fg-item-top">
                        <span class="lab-card-badge">${fg.family}</span>
                        <span class="fg-polarity-pill">${fg.polarity}</span>
                    </div>

                    <div class="fg-diagram-box">
                        ${fg.svg}
                        <span class="fg-formula-tag">${fg.formula}</span>
                    </div>

                    <div class="fg-item-header">
                        <h3 class="fg-item-title">${fg.name}</h3>
                        <span class="fg-suffix-badge">IUPAC: <code>${fg.suffix}</code></span>
                    </div>

                    <p class="fg-item-clue">${fg.clue}</p>

                    <div class="fg-item-example">
                        <strong>Found in:</strong> ${fg.example}
                    </div>
                </article>
            `
            )
            .join('');
    }

    function generateQuestion() {
        const shuffled = shuffleArray(FUNCTIONAL_GROUPS);
        const target = shuffled[0];
        const options = shuffleArray(shuffled.slice(0, 4));
        currentQuestion = { target, options };
        answeredId = null;
        renderQuiz();
    }

    function renderQuiz() {
        if (!currentQuestion) {
            generateQuestion();
            return;
        }

        const { target, options } = currentQuestion;
        const isAnswered = answeredId !== null;
        const isCorrect = answeredId === target.id;

        quizWrap.innerHTML = `
            <div class="lab-panel glass-panel">
                <div class="fg-quiz-top">
                    <span class="lab-eyebrow" style="margin-bottom: 0;">
                        <i class="fa-solid fa-flask" aria-hidden="true"></i>
                        Identify the Highlighted Structure
                    </span>
                    <div class="lab-pill-group">
                        <span class="lab-meta-pill">Score: ${quizScore}</span>
                        <span class="lab-meta-pill ${quizStreak >= 3 ? 'is-good' : ''}">Streak: ${quizStreak}</span>
                    </div>
                </div>

                <div class="fg-quiz-stage">
                    <div class="fg-diagram-box fg-quiz-diagram">
                        ${target.svg}
                    </div>

                    <div class="fg-quiz-prompt">
                        <p class="fg-quiz-clue">
                            <strong>Clue:</strong> ${target.clue}
                        </p>
                        <p class="fg-item-example" style="border-top: none; padding-top: 0;">
                            <strong>Common examples:</strong> ${target.example}
                        </p>
                    </div>
                </div>

                <div class="fg-options-grid">
                    ${options
                        .map((opt) => {
                            let stateCls = '';
                            if (isAnswered) {
                                if (opt.id === target.id) stateCls = 'is-correct';
                                else if (opt.id === answeredId) stateCls = 'is-wrong';
                            }
                            return `
                                <button
                                    type="button"
                                    class="fg-option-btn ${stateCls}"
                                    data-opt-id="${opt.id}"
                                    ${isAnswered ? 'disabled' : ''}
                                >
                                    <span class="fg-opt-name">${opt.name}</span>
                                    <span class="fg-opt-meta">${opt.formula} &bull; IUPAC: ${opt.suffix}</span>
                                </button>
                            `;
                        })
                        .join('')}
                </div>

                ${
                    isAnswered
                        ? `
                    <div class="fg-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}">
                        <div>
                            <strong>${isCorrect ? 'Spot on!' : `Not quite — that’s a ${target.name}.`}</strong>
                            <p style="margin: 0.25rem 0 0; font-size: 0.88rem;">
                                Formula <code>${target.formula}</code> uses the IUPAC ending <code>${target.suffix}</code> (${target.polarity}).
                            </p>
                        </div>
                        <button type="button" id="fg-next-btn" class="lab-btn-primary">
                            <span>Next Structure</span>
                            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                        </button>
                    </div>
                `
                        : ''
                }
            </div>
        `;

        quizWrap.querySelectorAll('.fg-option-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (answeredId !== null) return;
                answeredId = btn.dataset.optId;
                if (answeredId === target.id) {
                    quizScore += 1;
                    quizStreak += 1;
                    playSound('correct');
                } else {
                    quizStreak = 0;
                    playSound('wrong');
                }
                renderQuiz();
            });
        });

        quizWrap.querySelector('#fg-next-btn')?.addEventListener('click', () => {
            playSound('click');
            generateQuestion();
        });
    }

    // View Mode Switching (Explore vs Quiz)
    viewTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            playSound('click');
            viewMode = tab.dataset.view;
            viewTabs.forEach((t) => {
                const active = t.dataset.view === viewMode;
                t.classList.toggle('is-active', active);
                t.setAttribute('aria-selected', String(active));
            });

            const isExplore = viewMode === 'explore';
            exploreControls.classList.toggle('hidden', !isExplore);
            galleryEl.classList.toggle('hidden', !isExplore);
            quizWrap.classList.toggle('hidden', isExplore);

            if (!isExplore && !currentQuestion) {
                generateQuestion();
            }
        });
    });

    // Family Filter Chips
    familyChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            playSound('click');
            familyChips.forEach((c) => {
                c.classList.remove('is-active');
                c.setAttribute('aria-selected', 'false');
            });
            chip.classList.add('is-active');
            chip.setAttribute('aria-selected', 'true');
            activeFamily = chip.dataset.family;
            renderGallery();
        });
    });

    // Live Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderGallery();
    });

    // Initial Render
    renderGallery();
}
