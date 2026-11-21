export const LAB_TOOLS = [
    {
        id: 'periodictable',
        title: 'Periodic Table',
        category: 'reference',
        badge: 'Reference',
        icon: 'fa-solid fa-table-cells',
        description: 'Interactive 118-element grid with state/group filters, atomic masses, and electron configurations.',
        loader: () => import('./periodicTableLab.js')
    },
    {
        id: 'molarmass',
        title: 'Molar Mass Calculator',
        category: 'calculator',
        badge: 'Calculator',
        icon: 'fa-solid fa-scale-balanced',
        description: 'Calculate molecular weight and percent mass composition for formulas, parentheses, and hydrates.',
        loader: () => import('./molarMass.js')
    },
    {
        id: 'unitconverter',
        title: 'Unit Converter',
        category: 'calculator',
        badge: 'Calculator',
        icon: 'fa-solid fa-arrow-right-arrow-left',
        description: 'Live bidirectional conversions for pressure, temperature, molarity/concentration, and energy.',
        loader: () => import('./unitConverter.js')
    },
    {
        id: 'phcalculator',
        title: 'pH & Buffer Calculator',
        category: 'calculator',
        badge: 'Calculator',
        icon: 'fa-solid fa-vial-circle-check',
        description: 'Solve strong/weak acid-base equilibria and Henderson-Hasselbalch buffer preparations.',
        loader: () => import('./phCalculator.js')
    },
    {
        id: 'functionalgroups',
        title: 'Functional Groups',
        category: 'organic',
        badge: 'Organic',
        icon: 'fa-solid fa-diagram-project',
        description: 'Visual structure gallery with IUPAC naming rules, polarity, and reactivity highlights.',
        loader: () => import('./functionalGroups.js')
    },
    {
        id: 'electronconfig',
        title: 'Electron Configuration',
        category: 'reference',
        badge: 'Reference',
        icon: 'fa-solid fa-atom',
        description: 'Visualize orbital box filling, electron spin pairing (Hund’s rule), noble-gas shorthand, and Aufbau exceptions for all 118 elements.',
        loader: () => import('./electronConfig.js')
    }
];
