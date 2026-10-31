// share.js

/**
 * Handles sharing tarot draw details or card insights with property fallback safety
 */
 export async function handleTarotShare(cardData) {
   if (!cardData) return;

   let shareTitle = '';
   let shareText = '';
   const shareUrl = 'https://brickeli.github.io/WebApps/DailyTarot/arcana.html';
   const shareFeedback = document.getElementById('share-feedback');

   // Check if it's a Triple Spread object
   if (cardData.isTripleSpread) {
     shareTitle = cardData.title;
     shareText = `Today's 3-Card Spread from Arcana Tarot — ${cardData.description}`;
   } else {
     // Single Card mode
     const cardName = cardData.name || 'Unknown Card';
     const isReversed = cardData.isReversed ?? false;
     const orientation = isReversed ? 'Reversed' : 'Upright';
     const description = cardData.description || cardData.advice || 'Embracing the energy of the archetypes.';

     shareTitle = `My Tarot Draw: ${cardName} (${orientation})`;
     shareText = `Today's card from Arcana Tarot: ${cardName} (${orientation}). ${description}`;
   }

   if (navigator.share) {
     try {
       await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
       return;
     } catch (err) {
       if (err.name === 'AbortError') return;
       console.warn('Native share failed, falling back to clipboard:', err);
     }
   }

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
 * Optional helper to bind the event listener automatically if the button exists
 */
export function initShareButton(getCardCallback) {
  const shareBtn = document.getElementById('share-card-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', () => {
    const activeCard = getCardCallback ? getCardCallback() : {
      name: 'The Fool',
      isReversed: false,
      description: 'New beginnings and uninhibited potential.'
    };
    handleTarotShare(activeCard);
  });
}
