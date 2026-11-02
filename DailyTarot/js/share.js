// share.js

let globalGetCardCallback = null;

/**
 * Formats clean, atmospheric share text for single draws or 3-card spreads
 */
export function generateTarotShareText(cardData) {
    if (!cardData) return "Consulting the Arcana Tarot grimoire...";

    const shareUrl = window.location.href;

    if (cardData.isTripleSpread) {
        const cardNames = cardData.cards ? cardData.cards.map(c => c.name).join(' • ') : (cardData.description || '');
        const dominant = cardData.dominantElement || 'Cosmic';
        const loreBlurb = cardData.loreBlurb || "A harmonious equilibrium of cosmic forces flowing through the timeline.";
        return `✦ Arcana Tarot 3-Card Spread ✦\n` +
               `🔮 ${cardNames}\n` +
               `🌌 Dominant Energy: ${dominant}\n` +
               `📜 ${loreBlurb}\n\n` +
               `✨ Explore your path: ${shareUrl}`;
    } else {
        const cardName = cardData.name || 'Unknown Card';
        const isReversed = cardData.isReversed ?? false;
        const orientation = isReversed ? 'Reversed' : 'Upright';
        const element = cardData.element || cardData.suit || 'Cosmic';
        const advice = cardData.advice || cardData.description || 'Embracing the energy of the archetypes.';

        return `✦ Arcana Tarot Daily Pull ✦\n` +
               `🎴 ${cardName} (${orientation})\n` +
               `🌌 Element: ${element}\n` +
               `📜️ ${advice}\n\n` +
               `✨ Consult the stars: ${shareUrl}`;
    }
}

/**
 * Displays a floating esoteric toast notification on clipboard copy
 */
export function showShareToast(message = "✦ Copied to Grimoire ✦") {
    const existingToast = document.getElementById('tarot-share-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'tarot-share-toast';
    toast.textContent = message;

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        background: 'linear-gradient(135deg, rgba(25, 18, 40, 0.95), rgb(var(--color-velvet)))',
        color: 'rgb(var(--color-gold))',
        border: '1px solid rgb(var(--color-gold) / 0.6)',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        fontFamily: 'var(--font-cinzel, "Cinzel", serif)',
        fontSize: '0.85rem',
        letterSpacing: '0.1em',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgb(var(--color-gold) / 0.2)',
        zIndex: '9999',
        opacity: '0',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/**
 * Handles sharing tarot draw details or card insights
 */
export async function handleTarotShare(cardData) {
  if (!cardData) return;

  const shareUrl = window.location.href;
  const shareText = generateTarotShareText(cardData);
  const shareTitle = cardData.isTripleSpread
    ? (cardData.title || "Arcana Tarot 3-Card Spread")
    : `My Tarot Draw: ${cardData.name || 'Card'} (${cardData.isReversed ? 'Reversed' : 'Upright'})`;

  // Check if native Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return; // Successfully opened mobile share sheet
    } catch (err) {
      if (err.name === 'AbortError') return; // User cancelled, ignore
      console.warn('Native share failed or blocked, falling back to clipboard:', err);
    }
  }

  // Fallback Clipboard Copy with Ritual Toast
  try {
    await navigator.clipboard.writeText(shareText);
    showShareToast("✦ Copied to Grimoire Clipboard ✦");

    // Optional legacy feedback support if element still exists in DOM
    const shareFeedback = document.getElementById('share-feedback');
    if (shareFeedback) {
      shareFeedback.classList.remove('hidden');
      setTimeout(() => shareFeedback.classList.add('hidden'), 3000);
    }
  } catch (clipboardErr) {
    console.error('Failed to copy share text to clipboard:', clipboardErr);
  }
}

/**
 * Initializes share handling and binds directly to share buttons
 */
 export function initShareButton(getCardCallback) {
   if (getCardCallback) {
     globalGetCardCallback = getCardCallback;
   }

   // Prevent duplicate global listeners
   if (window._shareListenerInitialized) return;
   window._shareListenerInitialized = true;

   document.addEventListener('click', (event) => {
     // Laser-focused specifically on dedicated share buttons
     const shareBtn = event.target.closest('#share-card-btn-single') ||
                      event.target.closest('#share-card-btn-triple');

     if (!shareBtn) return;

     event.preventDefault();
     event.stopPropagation();

     const activeCard = globalGetCardCallback ? globalGetCardCallback() : null;

     if (!activeCard) {
       console.warn("Share callback returned no card data.");
       return;
     }

     handleTarotShare(activeCard);
   }, { passive: false });
 }
