export const PERIODIC_TABLE = {
    H:  { name: 'Hydrogen', atomicNumber: 1, atomicMass: '1.008', category: 'Nonmetal', summary: 'Lightest and most abundant chemical element in the universe.' },
    He: { name: 'Helium', atomicNumber: 2, atomicMass: '4.0026', category: 'Noble Gas', summary: 'Colorless, odorless noble gas and second lightest element.' },
    Be: { name: 'Beryllium', atomicNumber: 4, atomicMass: '9.0122', category: 'Alkaline Earth', summary: 'Lightweight, rigid metal used in aerospace alloys and neutron reflectors.' },
    C:  { name: 'Carbon', atomicNumber: 6, atomicMass: '12.011', category: 'Nonmetal', summary: 'Versatile nonmetal forming the chemical basis for all known organic life.' },
    N:  { name: 'Nitrogen', atomicNumber: 7, atomicMass: '14.007', category: 'Nonmetal', summary: 'Essential constituent of proteins and primary component of Earth’s atmosphere.' },
    O:  { name: 'Oxygen', atomicNumber: 8, atomicMass: '15.999', category: 'Nonmetal', summary: 'Highly reactive nonmetal crucial for cellular respiration and combustion.' },
    Na: { name: 'Sodium', atomicNumber: 11, atomicMass: '22.990', category: 'Alkali Metal', summary: 'Soft, highly reactive alkali metal essential for biological fluid balance.' },
    Mg: { name: 'Magnesium', atomicNumber: 12, atomicMass: '24.305', category: 'Alkaline Earth', summary: 'Essential structural metal used in lightweight alloys and biological enzymes.' },
    Al: { name: 'Aluminum', atomicNumber: 13, atomicMass: '26.982', category: 'Post-Transition Metal', summary: 'Low-density, corrosion-resistant metal widely used in manufacturing.' },
    S:  { name: 'Sulfur', atomicNumber: 16, atomicMass: '32.06', category: 'Nonmetal', summary: 'Abundant nonmetal essential for amino acid biosynthesis and industrial acids.' },
    Cl: { name: 'Chlorine', atomicNumber: 17, atomicMass: '35.45', category: 'Halogen', summary: 'Reactive halogen widely used in water disinfection and synthesis.' },
    Ar: { name: 'Argon', atomicNumber: 18, atomicMass: '39.948', category: 'Noble Gas', summary: 'Colorless, odorless noble gas used in shield-gas welding, incandescent lighting, and radiometric dating.' },
    K:  { name: 'Potassium', atomicNumber: 19, atomicMass: '39.098', category: 'Alkali Metal', summary: 'Essential mineral and electrolyte required for nerve impulse transmission.' },
    Ca: { name: 'Calcium', atomicNumber: 20, atomicMass: '40.078', category: 'Alkaline Earth', summary: 'Key structural metal for bones, teeth, and cellular signal transduction.' },
    Fe: { name: 'Iron', atomicNumber: 26, atomicMass: '55.845', category: 'Transition Metal', summary: 'Fundamental metal used in steelmaking and oxygen transport in hemoglobin.' },
    Ni: { name: 'Nickel', atomicNumber: 28, atomicMass: '58.693', category: 'Transition Metal', summary: 'Hard, silvery-white transition metal widely used in stainless steel, corrosion-resistant alloys, and rechargeable batteries.' },
    Cu: { name: 'Copper', atomicNumber: 29, atomicMass: '63.546', category: 'Transition Metal', summary: 'Ductile metal with exceptionally high thermal and electrical conductivity.' },
    Zn: { name: 'Zinc', atomicNumber: 30, atomicMass: '65.38', category: 'Transition Metal', summary: 'Essential trace element used in galvanizing steel and enzyme functions.' },
    Br: { name: 'Bromine', atomicNumber: 35, atomicMass: '79.904', category: 'Halogen', summary: 'Fuming red-liquid halogen used in flame retardants and pharmaceuticals.' },
    Kr: { name: 'Krypton', atomicNumber: 36, atomicMass: '83.798', category: 'Noble Gas', summary: 'Colorless, odorless noble gas produced during nuclear fission of heavy elements.' },
    Ag: { name: 'Silver', atomicNumber: 47, atomicMass: '107.87', category: 'Transition Metal', summary: 'Lustrous metal exhibiting the highest electrical conductivity of any element.' },
    I:  { name: 'Iodine', atomicNumber: 53, atomicMass: '126.90', category: 'Halogen', summary: 'Essential halogen required for thyroid hormone production.' },
    Ba: { name: 'Barium', atomicNumber: 56, atomicMass: '137.33', category: 'Alkaline Earth', summary: 'Dense alkaline earth metal used in drilling fluids and medical imaging.' },
    Hg: { name: 'Mercury', atomicNumber: 80, atomicMass: '200.59', category: 'Transition Metal', summary: 'Heavy liquid transition metal historically used in thermometers and switches.' },
    Pb: { name: 'Lead', atomicNumber: 82, atomicMass: '207.2', category: 'Post-Transition Metal', summary: 'Heavy metal used extensively in radiation shielding and batteries.' },
    Rn: { name: 'Radon', atomicNumber: 86, atomicMass: '222', category: 'Noble Gas', summary: 'Radioactive noble gas formed naturally through the decay chain of radium.' },
    Ra: { name: 'Radium', atomicNumber: 88, atomicMass: '226', category: 'Alkaline Earth', summary: 'Intensely radioactive metal historically used in luminescent paints.' },
    U:  { name: 'Uranium', atomicNumber: 92, atomicMass: '238.03', category: 'Actinide', summary: 'Heavy radioactive actinide metal essential for nuclear power generation.' },
    Cf: { name: 'Californium', atomicNumber: 98, atomicMass: '251', category: 'Actinide', summary: 'Synthetic transuranic actinide and strong neutron emitter created by heavy ion bombardment.' }
};

export const NUCLEAR_PARTICLES = {
    // Standard Elements ...

    // Subatomic Particles & Decay Products
    'n': {
        symbol: 'n',
        name: 'Neutron',
        number: 0,
        mass: 1,
        charge: 0,
        category: 'Subatomic Particle',
        summary: 'A neutral nucleon with mass number 1 and zero electric charge. Triggers nuclear fission and is emitted in chain reactions.'
    },
    'p': {
        symbol: 'p',
        name: 'Proton (Protium Nucleus)',
        number: 1,
        mass: 1,
        charge: 1,
        category: 'Subatomic Particle',
        summary: 'A positively charged nucleon with mass number 1 and charge +1. Identical to a Hydrogen-1 nucleus.'
    },
    'α': {
        symbol: 'α',
        name: 'Alpha Particle',
        number: 2,
        mass: 4,
        charge: 2,
        category: 'Radiation / Light Nucleus',
        summary: 'A helium-4 nucleus consisting of two protons and two neutrons emitted during alpha decay.'
    },
    'β⁻': {
        symbol: 'β⁻',
        name: 'Beta-minus Particle',
        number: -1,
        mass: 0,
        charge: -1,
        category: 'Lepton / Decay Product',
        summary: 'A high-speed electron emitted from the nucleus when a neutron transforms into a proton.'
    },
    'β⁺': {
        symbol: 'β⁺',
        name: 'Positron (Beta-plus)',
        number: 1,
        mass: 0,
        charge: 1,
        category: 'Antimatter / Decay Product',
        summary: 'The antiparticle of the electron, emitted during positron emission when a proton transforms into a neutron.'
    },
    'γ': {
        symbol: 'γ',
        name: 'Gamma Ray Photon',
        number: 0,
        mass: 0,
        charge: 0,
        category: 'Electromagnetic Radiation',
        summary: 'High-energy electromagnetic radiation emitted to release excess nuclear energy without altering mass or charge.'
    }
};
