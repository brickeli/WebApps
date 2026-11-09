// js/sigil.js
// Procedural card sigils: the same text always draws the same glyph.

function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function generateSigilFromAdvice({ advice = '', size = 24, strokeWidth = 1.25, fillOpacity = 0.2 } = {}) {
  const seed = typeof advice === 'string' ? hashString(advice) : advice;

  const prng = (s) => {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  let s = seed;
  const random = () => (s = Math.floor(prng(s) * 100000), prng(s));
  const randomChoice = (arr) => arr[Math.floor(random() * arr.length)];
  const center = size / 2;

  const createCoreShape = () => {
    const r = 2.5 + random() * 2.5;
    const type = randomChoice(['circle', 'diamond', 'up-triangle', 'down-triangle', 'hexagram', 'dot-cluster']);

    if (type === 'circle') {
      const d = `M ${center - r} ${center} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`;
      return { fillPath: d, strokePath: d };
    } else if (type === 'diamond') {
      const d = `M ${center} ${center - r} L ${center + r} ${center} L ${center} ${center + r} L ${center - r} ${center} Z`;
      return { fillPath: d, strokePath: d };
    } else if (type === 'up-triangle') {
      const d = `M ${center} ${center - r} L ${center + r * 1.1} ${center + r * 0.8} L ${center - r * 1.1} ${center + r * 0.8} Z`;
      return { fillPath: d, strokePath: d };
    } else if (type === 'down-triangle') {
      const d = `M ${center} ${center + r} L ${center + r * 1.1} ${center - r * 0.8} L ${center - r * 1.1} ${center - r * 0.8} Z`;
      return { fillPath: d, strokePath: d };
    } else if (type === 'hexagram') {
      const d1 = `M ${center} ${center - r} L ${center + r} ${center + r * 0.7} L ${center - r} ${center + r * 0.7} Z`;
      const d2 = `M ${center} ${center + r} L ${center + r} ${center - r * 0.7} L ${center - r} ${center - r * 0.7} Z`;
      return { fillPath: d1, strokePath: `${d1} ${d2}` };
    } else {
      const dotR = 1.2;
      const offset = 2.2;
      const d = `M ${center - offset} ${center} a ${dotR} ${dotR} 0 1 0 ${dotR * 2} 0 a ${dotR} ${dotR} 0 1 0 -${dotR * 2} 0 ` +
                `M ${center + offset - dotR * 2} ${center} a ${dotR} ${dotR} 0 1 0 ${dotR * 2} 0 a ${dotR} ${dotR} 0 1 0 -${dotR * 2} 0`;
      return { fillPath: d, strokePath: d };
    }
  };

  const createLinework = () => {
    const style = randomChoice(['cross', 'octagram', 'chevrons', 'vertical-stave', 'horizontal-stave', 'diagonal-x']);
    const len = 6 + Math.floor(random() * 4);

    if (style === 'cross') {
      return `M ${center} ${center - len} V ${center + len} M ${center - len} ${center} H ${center + len}`;
    } else if (style === 'octagram') {
      const off = Math.round(len * 0.707);
      return `M ${center} ${center - len} V ${center + len} M ${center - len} ${center} H ${center + len} ` +
             `M ${center - off} ${center - off} L ${center + off} ${center + off} ` +
             `M ${center + off} ${center - off} L ${center - off} ${center + off}`;
    } else if (style === 'chevrons') {
      return `M ${center} ${center - len} V ${center + len} ` +
             `M ${center - 4} ${center - 3} L ${center} ${center - 7} L ${center + 4} ${center - 3} ` +
             `M ${center - 4} ${center + 3} L ${center} ${center + 7} L ${center + 4} ${center + 3}`;
    } else if (style === 'vertical-stave') {
      return `M ${center} 3 V 21 M ${center - 4} 7 H ${center + 4} M ${center - 4} 17 H ${center + 4}`;
    } else if (style === 'horizontal-stave') {
      return `M 3 ${center} H 21 M 7 ${center - 4} V ${center + 4} M 17 ${center - 4} V ${center + 4}`;
    } else {
      return `M 5 5 L 19 19 M 19 5 L 5 19`;
    }
  };

  const createOuterFrame = () => {
    const frameType = randomChoice(['double-ring', 'crescents', 'end-caps', 'corner-bounds', 'orbital-dots']);

    if (frameType === 'double-ring') {
      const r1 = 9, r2 = 7;
      return `M ${center - r1} ${center} a ${r1} ${r1} 0 1 0 ${r1 * 2} 0 a ${r1} ${r1} 0 1 0 -${r1 * 2} 0 ` +
             `M ${center - r2} ${center} a ${r2} ${r2} 0 1 0 ${r2 * 2} 0 a ${r2} ${r2} 0 1 0 -${r2 * 2} 0`;
    } else if (frameType === 'crescents') {
      return `M ${center - 9} ${center - 5} A 10 10 0 0 1 ${center - 9} ${center + 5} ` +
             `M ${center + 9} ${center - 5} A 10 10 0 0 0 ${center + 9} ${center + 5}`;
    } else if (frameType === 'end-caps') {
      return `M 4 4 H 20 M 4 20 H 20 M ${center} 2 V 4 M ${center} 20 V 22`;
    } else if (frameType === 'corner-bounds') {
      return `M 4 8 V 4 H 8 M 16 4 H 20 V 8 M 4 16 V 20 H 8 M 16 20 H 20 V 16`;
    } else {
      const r = 9;
      return `M ${center - r} ${center} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0 ` +
             `M ${center - 1} 3 a 1 1 0 1 0 2 0 a 1 1 0 1 0 -2 0 ` +
             `M ${center - 1} 21 a 1 1 0 1 0 2 0 a 1 1 0 1 0 -2 0`;
    }
  };

  const core = createCoreShape();
  const linework = createLinework();
  const frame = createOuterFrame();
  const strokePathData = `${linework} ${frame} ${core.strokePath}`.trim();

  return `
<svg viewBox="0 0 ${size} ${size}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
  <path d="${core.fillPath}" fill="currentColor" opacity="${fillOpacity}" stroke="none" />
  <path d="${strokePathData}" vector-effect="non-scaling-stroke" />
</svg>
`.trim();
}

export function animateSigilDraw(target) {
    const containers = !target ? [] : (target instanceof Element ? [target] : Array.from(target));
    if (containers.length === 0) return;

    requestAnimationFrame(() => {
        const items = [];

        for (const container of containers) {
            const paths = container.querySelectorAll('svg path');
            if (paths.length < 2) continue;
            const fillPath = paths[0];
            const strokePath = paths[1];
            try {
                const length = strokePath.getTotalLength();
                if (!length || isNaN(length)) continue;
                items.push({ fillPath, strokePath, length });
            } catch (err) {
                console.warn('Sigil animation fallback triggered:', err);
            }
        }
        if (items.length === 0) return;

        for (const { fillPath, strokePath, length } of items) {
            strokePath.setAttribute('stroke', 'currentColor');
            strokePath.style.vectorEffect = 'non-scaling-stroke';
            strokePath.style.strokeDasharray = `${length} ${length}`;
            strokePath.style.strokeDashoffset = `${length}`;
            strokePath.style.transition = 'none';
            fillPath.style.opacity = '0';
            fillPath.style.transition = 'opacity 0.4s ease-in 0.8s';
        }

        void items[0].strokePath.getBoundingClientRect();

        for (const { fillPath, strokePath } of items) {
            strokePath.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1)';
            strokePath.style.strokeDashoffset = '0';
            fillPath.style.opacity = '0.2';
        }
    });
}

const sigilMarkupCache = new Map();
export function getCardSigilMarkup(card) {
    const key = card.id || card.name;
    let markup = sigilMarkupCache.get(key);
    if (!markup) {
        const adviceText = card.advice || card.meaning || card.desc || card.name;
        markup = generateSigilFromAdvice({ advice: `${key}_${adviceText}` });
        sigilMarkupCache.set(key, markup);
    }
    return markup;
}
