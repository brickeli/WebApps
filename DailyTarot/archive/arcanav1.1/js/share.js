// share.js

let globalGetCardCallback = null;

/**
 * Handles sharing tarot draw details or card insights
 */
export async function handleTarotShare(cardData) {
  if (!cardData) return;

  let shareTitle = '';
  let shareText = '';
  const shareUrl = window.location.href; // Uses current live URL dynamically
  const shareFeedback = document.getElementById('share-feedback');

  if (cardData.isTripleSpread) {
    shareTitle = cardData.title;
    shareText = `Today's 3-Card Spread from Arcana Tarot — ${cardData.description}`;
  } else {
    const cardName = cardData.name || 'Unknown Card';
    const isReversed = cardData.isReversed ?? false;
    const orientation = isReversed ? 'Reversed' : 'Upright';
    const description = cardData.description || cardData.advice || 'Embracing the energy of the archetypes.';

    shareTitle = `My Tarot Draw: ${cardName} (${orientation})`;
    shareText = `Today's card from Arcana Tarot: ${cardName} (${orientation}). ${description}`;
  }

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

  // Fallback Clipboard Copy
  try {
    const fallbackString = `${shareTitle}\n\n${shareText}\n\nApp Link: ${shareUrl}`;
    await navigator.clipboard.writeText(fallbackString);

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

  // Use a broad document listener that catches any element with id or class containing 'share'
  document.addEventListener('click', (event) => {
    const shareBtn = event.target.closest('#share-card-btn') ||
                     event.target.closest('.share-card-btn') ||
                     event.target.id === 'share-card-btn';

    if (!shareBtn) return;

    // Prevent default anchor/button behaviors just in case
    event.preventDefault();

    const activeCard = globalGetCardCallback ? globalGetCardCallback() : {
      name: 'The Fool',
      isReversed: false,
      description: 'New beginnings and uninhibited potential.'
    };

    handleTarotShare(activeCard);
  }, { passive: false });
}
