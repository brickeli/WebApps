export const NUCLEAR_EQUATIONS = [
    {
        id: 'nuc-1',
        category: 'Fission',
        difficulty: 'Medium',
        reactants: [
            { symbol: 'U', mass: 235, charge: 92, netCharge: 0, raw: 'U235', coeff: 1 },
            { symbol: 'n', mass: 1, charge: 0, netCharge: 0, raw: 'n1', coeff: 1 }
        ],
        products: [
            { symbol: 'Ba', mass: 141, charge: 56, netCharge: 0, raw: 'Ba141', coeff: 1 },
            { symbol: 'Kr', mass: 92, charge: 36, netCharge: 0, raw: 'Kr92', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'n', mass: 1, charge: 0 },
                selectedParticle: null,
                coeff: 3
            }
        ],
        explanation: 'Induced nuclear fission of Uranium-235 triggered by thermal neutron absorption.'
    },
    {
        id: 'nuc-2',
        category: 'Fusion',
        difficulty: 'Easy',
        reactants: [
            { symbol: 'H', mass: 2, charge: 1, netCharge: 0, raw: 'H2', coeff: 1 },
            { symbol: 'H', mass: 3, charge: 1, netCharge: 0, raw: 'H3', coeff: 1 }
        ],
        products: [
            { symbol: 'He', mass: 4, charge: 2, netCharge: 0, raw: 'He4', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'n', mass: 1, charge: 0 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Deuterium-Tritium nuclear fusion producing a helium nucleus and a free neutron.'
    },
    {
        id: 'nuc-3',
        category: 'Transmutation',
        difficulty: 'Medium',
        reactants: [
            { symbol: 'N', mass: 14, charge: 7, netCharge: 0, raw: 'N14', coeff: 1 },
            { symbol: 'He', mass: 4, charge: 2, netCharge: 2, raw: 'He4', coeff: 1 }
        ],
        products: [
            { symbol: 'O', mass: 17, charge: 8, netCharge: 0, raw: 'O17', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'p', mass: 1, charge: 1 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Rutherford’s classic artificial transmutation converting Nitrogen-14 into Oxygen-17.'
    },
    {
        id: 'nuc-4',
        category: 'Bombardment',
        difficulty: 'Hard',
        reactants: [
            { symbol: 'U', mass: 238, charge: 92, netCharge: 0, raw: 'U238', coeff: 1 },
            { symbol: 'C', mass: 12, charge: 6, netCharge: 0, raw: 'C12', coeff: 1 }
        ],
        products: [
            { symbol: 'Cf', mass: 246, charge: 98, netCharge: 0, raw: 'Cf246', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'n', mass: 1, charge: 0 },
                selectedParticle: null,
                coeff: 4
            }
        ],
        explanation: 'Heavy ion bombardment synthesized to produce Californium-246.'
    },
    {
        id: 'nuc-5',
        category: 'Decay',
        difficulty: 'Easy',
        reactants: [
            { symbol: 'Ra', mass: 226, charge: 88, netCharge: 0, raw: 'Ra226', coeff: 1 }
        ],
        products: [
            { symbol: 'Rn', mass: 222, charge: 86, netCharge: 0, raw: 'Rn222', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'α', mass: 4, charge: 2 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Alpha decay of Radium-226 transforming into Radon-222.'
    },
    {
        id: 'nuc-6',
        category: 'Transmutation',
        difficulty: 'Medium',
        reactants: [
            { symbol: 'Be', mass: 9, charge: 4, netCharge: 0, raw: 'Be9', coeff: 1 },
            { symbol: 'He', mass: 4, charge: 2, netCharge: 2, raw: 'He4', coeff: 1 }
        ],
        products: [
            { symbol: 'C', mass: 12, charge: 6, netCharge: 0, raw: 'C12', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'n', mass: 1, charge: 0 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Chadwick’s discovery of the neutron via alpha particle bombardment of Beryllium-9.'
    },
    {
        id: 'nuc-7',
        category: 'Decay',
        difficulty: 'Easy',
        reactants: [
            { symbol: 'C', mass: 14, charge: 6, netCharge: 0, raw: 'C14', coeff: 1 }
        ],
        products: [
            { symbol: 'N', mass: 14, charge: 7, netCharge: 0, raw: 'N14', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'β⁻', mass: 0, charge: -1 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Beta-minus decay of Carbon-14 into Nitrogen-14, releasing an electron (beta particle).'
    },
    {
        id: 'nuc-8',
        category: 'Decay',
        difficulty: 'Medium',
        reactants: [
            { symbol: 'Na', mass: 22, charge: 11, netCharge: 0, raw: 'Na22', coeff: 1 }
        ],
        products: [
            { symbol: 'Ne', mass: 22, charge: 10, netCharge: 0, raw: 'Ne22', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'β⁺', mass: 0, charge: 1 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Positron emission (Beta-plus decay) of Sodium-22 decaying into Neon-22.'
    },
    {
        id: 'nuc-9',
        category: 'Fusion',
        difficulty: 'Medium',
        reactants: [
            { symbol: 'H', mass: 1, charge: 1, netCharge: 0, raw: 'H1', coeff: 4 }
        ],
        products: [
            { symbol: 'He', mass: 4, charge: 2, netCharge: 0, raw: 'He4', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'β⁺', mass: 0, charge: 1 },
                selectedParticle: null,
                coeff: 2
            }
        ],
        explanation: 'Proton-proton chain step fusing four protons into Helium-4 and two positrons.'
    },
    {
        id: 'nuc-10',
        category: 'Decay',
        difficulty: 'Easy',
        reactants: [
            { symbol: 'U', mass: 238, charge: 92, netCharge: 0, raw: 'U238', coeff: 1 }
        ],
        products: [
            { symbol: 'Th', mass: 234, charge: 90, netCharge: 0, raw: 'Th234', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'α', mass: 4, charge: 2 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Primary alpha decay of Uranium-238 into Thorium-234.'
    },
    {
        id: 'nuc-11',
        category: 'Bombardment',
        difficulty: 'Hard',
        reactants: [
            { symbol: 'Pu', mass: 239, charge: 94, netCharge: 0, raw: 'Pu239', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'n', mass: 1, charge: 0 },
                selectedParticle: null,
                coeff: 2
            }
        ],
        products: [
            { symbol: 'Pu', mass: 241, charge: 94, netCharge: 0, raw: 'Pu241', coeff: 1 }
        ],
        explanation: 'Double neutron capture by Plutonium-239 producing Plutonium-241 in nuclear fuel cycles.'
    },
    {
        id: 'nuc-12',
        category: 'Transmutation',
        difficulty: 'Medium',
        reactants: [
            { symbol: 'Al', mass: 27, charge: 13, netCharge: 0, raw: 'Al27', coeff: 1 },
            { symbol: 'He', mass: 4, charge: 2, netCharge: 2, raw: 'He4', coeff: 1 }
        ],
        products: [
            { symbol: 'P', mass: 30, charge: 15, netCharge: 0, raw: 'P30', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'n', mass: 1, charge: 0 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Curie and Joliot artificial radioactivity discovery: bombarding Aluminum-27 produces Phosphorus-30.'
    },
    {
        id: 'nuc-13',
        category: 'Decay',
        difficulty: 'Easy',
        reactants: [
            { symbol: 'Co', mass: 60, charge: 27, netCharge: 0, raw: 'Co60', coeff: 1 }
        ],
        products: [
            { symbol: 'Ni', mass: 60, charge: 28, netCharge: 0, raw: 'Ni60', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'β⁻', mass: 0, charge: -1 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Cobalt-60 industrial radiological source undergoing Beta-minus decay into Nickel-60.'
    },
    {
        id: 'nuc-14',
        category: 'Fusion',
        difficulty: 'Hard',
        reactants: [
            { symbol: 'He', mass: 4, charge: 2, netCharge: 0, raw: 'He4', coeff: 3 }
        ],
        products: [
            { symbol: 'C', mass: 12, charge: 6, netCharge: 0, raw: 'C12', coeff: 1 }
        ],
        explanation: 'Triple-alpha stellar nucleosynthesis fusing three helium nuclei into Carbon-12.'
    },
    {
        id: 'nuc-15',
        category: 'Transmutation',
        difficulty: 'Medium',
        reactants: [
            { symbol: 'B', mass: 10, charge: 5, netCharge: 0, raw: 'B10', coeff: 1 },
            { symbol: 'n', mass: 1, charge: 0, netCharge: 0, raw: 'n1', coeff: 1 }
        ],
        products: [
            { symbol: 'Li', mass: 7, charge: 3, netCharge: 0, raw: 'Li7', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'α', mass: 4, charge: 2 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Neutron capture therapy reaction: Boron-10 absorbs a neutron to yield Lithium-7 and an alpha particle.'
    },
    {
        id: 'nuc-16',
        category: 'Decay',
        difficulty: 'Hard',
        reactants: [
            { symbol: 'K', mass: 40, charge: 19, netCharge: 0, raw: 'K40', coeff: 1 },
            { symbol: 'e', mass: 0, charge: -1, netCharge: -1, raw: 'e0', coeff: 1 }
        ],
        products: [
            { symbol: 'Ar', mass: 40, charge: 18, netCharge: 0, raw: 'Ar40', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'γ', mass: 0, charge: 0 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Potassium-40 electron capture yielding Argon-40 and characteristic gamma emission.'
    },
    {
    id: 'nuc-17',
    category: 'Decay',
    difficulty: 'Easy',
    reactants: [
        { symbol: 'H', mass: 3, charge: 1, netCharge: 0, raw: 'H3', coeff: 1 }
    ],
    products: [
        { symbol: 'He', mass: 3, charge: 2, netCharge: 0, raw: 'He3', coeff: 1 },
        {
            isSelectable: true,
            expectedParticle: { symbol: 'β⁻', mass: 0, charge: -1 },
            selectedParticle: null,
            coeff: 1
        }
    ],
    explanation: 'Beta-minus decay of Tritium (Hydrogen-3) transforming into Helium-3.'
    },
    {
        id: 'nuc-18',
        category: 'Fission',
        difficulty: 'Hard',
        reactants: [
            { symbol: 'Cf', mass: 252, charge: 98, netCharge: 0, raw: 'Cf252', coeff: 1 }
        ],
        products: [
            { symbol: 'Ba', mass: 142, charge: 56, netCharge: 0, raw: 'Ba142', coeff: 1 },
            { symbol: 'Mo', mass: 106, charge: 42, netCharge: 0, raw: 'Mo106', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'n', mass: 1, charge: 0 },
                selectedParticle: null,
                coeff: 4
            }
        ],
        explanation: 'Spontaneous fission of Californium-252 yielding Barium-142, Molybdenum-106, and four free neutrons.'
    },
    {
        id: 'nuc-19',
        category: 'Decay',
        difficulty: 'Medium',
        reactants: [
            { symbol: 'F', mass: 18, charge: 9, netCharge: 0, raw: 'F18', coeff: 1 }
        ],
        products: [
            { symbol: 'O', mass: 18, charge: 8, netCharge: 0, raw: 'O18', coeff: 1 },
            {
                isSelectable: true,
                expectedParticle: { symbol: 'β⁺', mass: 0, charge: 1 },
                selectedParticle: null,
                coeff: 1
            }
        ],
        explanation: 'Fluorine-18 medical radiotracer positron emission decaying into Oxygen-18 during PET imaging.'
      },
      {
          id: 'nuc-20',
          category: 'Decay',
          difficulty: 'Easy',
          reactants: [
              { symbol: 'Po', mass: 210, charge: 84, netCharge: 0, raw: 'Po210', coeff: 1 }
          ],
          products: [
              { symbol: 'Pb', mass: 206, charge: 82, netCharge: 0, raw: 'Pb206', coeff: 1 },
              {
                  isSelectable: true,
                  expectedParticle: { symbol: 'α', mass: 4, charge: 2 },
                  selectedParticle: null,
                  coeff: 1
              }
          ],
          explanation: 'Alpha decay of Polonium-210 decaying into stable Lead-206.'
      },
      {
          id: 'nuc-21',
          category: 'Fusion',
          difficulty: 'Hard',
          reactants: [
              { symbol: 'C', mass: 12, charge: 6, netCharge: 0, raw: 'C12', coeff: 2 }
          ],
          products: [
              { symbol: 'Ne', mass: 20, charge: 10, netCharge: 0, raw: 'Ne20', coeff: 1 },
              {
                  isSelectable: true,
                  expectedParticle: { symbol: 'α', mass: 4, charge: 2 },
                  selectedParticle: null,
                  coeff: 1
              }
          ],
          explanation: 'Stellar carbon burning fusing two Carbon-12 nuclei into Neon-20 and an alpha particle.'
      }
];
