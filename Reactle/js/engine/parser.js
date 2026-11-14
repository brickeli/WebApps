/**
 * Chemical formula parser (no DOM code, safe to use from any page or calculator).
 *
 *   parseFormulaDetailed('Ca(OH)2')        -> { atoms: { Ca: 1, O: 2, H: 2 }, charge: 0 }
 *   parseFormulaDetailed('CuSO4·5H2O')     -> { atoms: { Cu: 1, S: 1, O: 9, H: 10 }, charge: 0 }
 *   parseFormulaDetailed('SO4^2-')         -> { atoms: { S: 1, O: 4 }, charge: -2 }
 *   parseFormulaDetailed('NH4+')           -> { atoms: { N: 1, H: 4 }, charge: 1 }
 *   parseFormulaDetailed('e-')             -> { atoms: {}, charge: -1 }
 *
 * parseFormula(str) returns just the atom counts. Both throw an Error with a
 * plain-language message when the input is not a valid formula.
 */

const ELEMENT_SYMBOLS = new Set((
    'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr ' +
    'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu ' +
    'Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr ' +
    'Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'
).split(' '));

export function isElementSymbol(symbol) {
    return ELEMENT_SYMBOLS.has(symbol);
}

const SUPERSCRIPTS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
const SUBSCRIPTS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
const OPEN = { '(': ')', '[': ']', '{': '}' };
const CLOSE = new Set([')', ']', '}']);

function normalise(input) {
    let s = String(input ?? '').trim();
    // a run of superscript characters becomes ^...  (SO₄²⁻ -> SO4^2-)
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, run => '^' + [...run].map(c => SUPERSCRIPTS[c]).join(''));
    s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, c => SUBSCRIPTS[c]);
    s = s.replace(/[−–]/g, '-').replace(/\s+/g, '');
    return s;
}

// Reads a trailing charge: NH4+  Cl-  SO4^2-  Fe^3+  Fe^+3
function splitCharge(s) {
    let m = s.match(/^(.*?)\^(\d*)([+-])(\d*)$/);
    if (m) {
        const magnitude = parseInt(m[2] || m[4] || '1', 10);
        return { body: m[1], charge: m[3] === '+' ? magnitude : -magnitude };
    }
    m = s.match(/^(.*[^+-])([+-])$/);   // a single trailing sign means +1 / -1
    if (m) return { body: m[1], charge: m[2] === '+' ? 1 : -1 };
    return { body: s, charge: 0 };
}

function addCounts(target, source, multiplier) {
    for (const el in source) target[el] = (target[el] || 0) + source[el] * multiplier;
}

function parseBody(body, original) {
    const root = {};
    const stack = [{ counts: root, close: null }];
    let i = 0;

    while (i < body.length) {
        const ch = body[i];

        if (/[A-Z]/.test(ch)) {
            let symbol = ch;
            if (/[a-z]/.test(body[i + 1] || '')) symbol += body[i + 1];
            if (!ELEMENT_SYMBOLS.has(symbol)) {
                throw new Error(`"${symbol}" is not an element symbol. Element symbols start with a capital letter (Co is cobalt, CO is carbon monoxide).`);
            }
            i += symbol.length;
            const digits = body.slice(i).match(/^\d+/);
            const count = digits ? parseInt(digits[0], 10) : 1;
            if (count === 0) throw new Error(`A subscript of 0 after ${symbol} is not allowed.`);
            if (digits) i += digits[0].length;
            const top = stack[stack.length - 1].counts;
            top[symbol] = (top[symbol] || 0) + count;
        } else if (OPEN[ch]) {
            stack.push({ counts: {}, close: OPEN[ch] });
            i++;
        } else if (CLOSE.has(ch)) {
            if (stack.length === 1 || stack[stack.length - 1].close !== ch) {
                throw new Error(`Unexpected "${ch}" in ${original}. Check that every bracket has a partner.`);
            }
            const group = stack.pop();
            i++;
            const digits = body.slice(i).match(/^\d+/);
            const multiplier = digits ? parseInt(digits[0], 10) : 1;
            if (multiplier === 0) throw new Error(`A multiplier of 0 after "${ch}" is not allowed.`);
            if (digits) i += digits[0].length;
            addCounts(stack[stack.length - 1].counts, group.counts, multiplier);
        } else if (/[a-z]/.test(ch)) {
            throw new Error(`Unexpected "${ch}" in ${original}. Element symbols start with a capital letter (write NaCl, not Nacl).`);
        } else {
            throw new Error(`Unexpected "${ch}" in ${original}.`);
        }
    }

    if (stack.length > 1) throw new Error(`A bracket in ${original} is never closed.`);
    return root;
}

export function parseFormulaDetailed(input) {
    const original = String(input ?? '').trim();
    if (!original) throw new Error('Empty formula.');

    const s = normalise(original);

    // a lone electron
    if (/^e(\^?-)?$/.test(s)) return { atoms: {}, charge: -1 };

    const lead = s.match(/^\d+/);
    if (lead) {
        throw new Error(`Remove the "${lead[0]}" in front of ${original}. The balancer works out the coefficients.`);
    }

    const { body, charge } = splitCharge(s);
    if (!body) throw new Error(`Could not read ${original}.`);

    // hydrates and adducts: CuSO4·5H2O, CuSO4.5H2O, CuSO4*5H2O
    const parts = body.split(/[·•∙*.]/);
    const atoms = {};
    parts.forEach((part, index) => {
        let multiplier = 1;
        let text = part;
        if (index > 0) {
            const n = part.match(/^\d+/);
            if (n) { multiplier = parseInt(n[0], 10); text = part.slice(n[0].length); }
        }
        if (!text) throw new Error(`Nothing follows the dot in ${original}.`);
        addCounts(atoms, parseBody(text, original), multiplier);
    });

    if (Object.keys(atoms).length === 0) throw new Error(`No elements found in ${original}.`);
    return { atoms, charge };
}

export function parseFormula(input) {
    return parseFormulaDetailed(input).atoms;
}
