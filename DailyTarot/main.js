import { fullTarotDeck, ELEMENTAL_LORE } from './js/cardLibrary.js';
import { initTheme, selectTheme, toggleUtilsMenu, updateAudioUI } from './js/theme.js';
import { toggleAudio, playMysticChime } from './js/audio.js';
import { handleTarotShare, initShareButton, generateTarotShareText, showShareToast } from './js/share.js';

let currentMode = 'single';
let currentSingleCard = null;
let isSingleFlipped = false;
let tripleCards = [null, null, null];
let tripleFlipped = [false, false, false];
let readingHistory = JSON.parse(localStorage.getItem('arcana_tarot_history') || '[]');
let activeArchiveTab = 'journal'; // 'journal' or 'library'
let currentLibraryFilter = 'all';

/* ==========================================================================
   1. HANDLERS & HELPER FUNCTIONS
   ========================================================================== */
function handleToggleAudio() {
    const active = toggleAudio(showToast);
    updateAudioUI(active);
}

function updateHistoryBadge() {
    const historyCountEl = document.getElementById('history-count');
    const tabCountEl = document.getElementById('tab-journal-count');
    if (historyCountEl) historyCountEl.textContent = readingHistory.length;
    if (tabCountEl) tabCountEl.textContent = readingHistory.length;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Daily Limit Check & Record Helpers
function canDrawToday(drawType) {
    const lastDate = localStorage.getItem(`arcana_last_${drawType}_date`);
    const today = new Date().toDateString();
    return lastDate !== today;
}

function recordDrawToday(drawType) {
    const today = new Date().toDateString();
    localStorage.setItem(`arcana_last_${drawType}_date`, today);
}

/* ==========================================================================
   2. GLOBAL SCOPE BINDING (Expose to window for HTML onclick attributes)
   ========================================================================== */
Object.assign(window, {
    setMode,
    drawSingleCard,
    flipSingleCard,
    drawTripleSpread,
    flipTripleCard,
    saveCurrentReading,
    saveTripleReading,
    toggleHistoryModal,
    clearHistory,
    toggleAudio: handleToggleAudio,
    toggleUtilsMenu,
    selectTheme,
    toggleArchivesModal,
    switchArchiveTab,
    filterLibrary,
    inspectCardFromLibrary,
    removeJournalEntry,
});

/* ==========================================================================
   3. INITIALIZATION
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    initCanvasFX();
    updateHistoryBadge();
    initTheme();

    // Mode Navigation
    document.getElementById('btn-single')?.addEventListener('click', () => setMode('single'));
    document.getElementById('btn-triple')?.addEventListener('click', () => setMode('triple'));
    document.getElementById('btn-history')?.addEventListener('click', () => toggleArchivesModal(true));

    // Single Card Draw & Flip
    document.getElementById('deck-card-container')?.addEventListener('click', drawSingleCard);
    document.getElementById('btn-draw-single')?.addEventListener('click', drawSingleCard);
    document.getElementById('btn-redraw-single')?.addEventListener('click', drawSingleCard);
    document.getElementById('single-card-inner')?.addEventListener('click', flipSingleCard);
    document.getElementById('btn-tab-wisdom')?.addEventListener('click', () => switchInsightTab('wisdom'));
    document.getElementById('btn-tab-elemental')?.addEventListener('click', () => switchInsightTab('elemental'));

    // ✦ UNIFIED 3-CARD SPREAD DRAW & FLIP LISTENERS ✦
    document.getElementById('btn-draw-triple')?.addEventListener('click', drawTripleSpread);

    for (let i = 0; i < 3; i++) {
        const cardInner = document.getElementById(`triple-card-inner-${i}`);
        if (cardInner) {
            cardInner.addEventListener('click', (e) => {
                const todayDate = new Date().toDateString();
                const lastDate = localStorage.getItem('arcana_last_triple_date');

                // If not drawn today yet, tapping Present (Center Card, i === 1) casts the spread
                if (lastDate !== todayDate) {
                    if (i === 1) {
                        e.stopPropagation();
                        drawTripleSpread();
                    }
                } else {
                    // If already drawn today, tapping ANY card delegates to flipTripleCard
                    flipTripleCard(i);
                }
            });
        }
    }

    // Settings Dropdown
    document.getElementById('utils-menu-btn')?.addEventListener('click', (e) => toggleUtilsMenu(e));
    document.getElementById('menu-audio-btn')?.addEventListener('click', handleToggleAudio);

    // Library Search & Mobile Filters
    document.getElementById('archive-search-input')?.addEventListener('input', applyLibrarySearch);
    document.getElementById('filter-toggle-btn')?.addEventListener('click', toggleMobileFilters);
    document.getElementById('btn-archives')?.addEventListener('click', () => toggleArchivesModal(true));

    // ==========================================================
    // RESTORE TODAY'S COMPLETED DRAWS ON LOAD
    // ==========================================================
    const today = new Date().toDateString();

    // 1. Check Single Draw State
    if (localStorage.getItem('arcana_last_single_date') === today) {
        const savedCardJson = localStorage.getItem('arcana_saved_single_card');
        const savedReversed = localStorage.getItem('arcana_saved_single_reversed') === 'true';

        if (savedCardJson) {
            currentSingleCard = JSON.parse(savedCardJson);
            isSingleReversed = savedReversed;

            restoreSingleCardUI();
        }
    }

    // 2. Check Triple Spread State
    if (localStorage.getItem('arcana_last_triple_date') === today) {
        const savedTripleJson = localStorage.getItem('arcana_saved_triple_cards');
        const savedTripleRevJson = localStorage.getItem('arcana_saved_triple_reversed');
        const tripleBtn = document.querySelector('.tarot-btn-cast-triple');
        if (tripleBtn) {
            tripleBtn.innerHTML = `<i class="fa-solid fa-hourglass-end triple-btn-icon"></i> Return tomorrow for another reading`;
            tripleBtn.classList.add('is-locked');
        }
        if (savedTripleJson) {
            tripleCards = JSON.parse(savedTripleJson);
            tripleReversed = JSON.parse(savedTripleRevJson || '[false, false, false]');
            tripleFlipped = [true, true, true];

            const actionsDiv = document.getElementById('triple-actions');
            if (actionsDiv) actionsDiv.classList.remove('hidden');

            for (let i = 0; i < 3; i++) {
                const inner = document.getElementById(`triple-card-inner-${i}`);
                const front = document.getElementById(`triple-card-front-${i}`);

                if (inner) inner.classList.add('flipped');
                renderTripleFront(front, tripleCards[i], tripleReversed[i]);
            }

            const elementalContainer = document.getElementById('triple-elemental-container');
            if (elementalContainer) {
                elementalContainer.innerHTML = renderElementalAnalyzer(tripleCards);
            }
        }
    }

    // Check if all 3 cards are already flipped upon loading
    const allFlipped = [0, 1, 2].every(i => {
        const cardInner = document.getElementById(`triple-card-inner-${i}`);
        return cardInner && cardInner.classList.contains('flipped');
    });

    const container = document.querySelector('.triple-spread-container');
    if (container && allFlipped) {
        container.classList.add('revealed');
    }

    // Share Results Init
    initShareButton(() => {
        if (currentMode === 'triple') {
            if (!tripleCards || !tripleCards[0]) return null;
            const balance = typeof calculateElementalBalance === 'function' ? calculateElementalBalance(tripleCards) : null;
            const dominant = balance ? balance.dominant : 'Cosmic';
            const loreMap = typeof ELEMENTAL_LORE !== 'undefined' ? ELEMENTAL_LORE : {};
            return {
                isTripleSpread: true,
                title: 'My 3-Card Arcana Spread',
                cards: tripleCards,
                dominantElement: balance ? balance.dominant : 'Cosmic',
                loreBlurb: loreMap[dominant] || "A harmonious equilibrium of cosmic forces flowing through the timeline.",
                description: `Past: ${tripleCards[0].name} | Present: ${tripleCards[1].name} | Future: ${tripleCards[2].name}`
            };
        } else {
            if (!currentSingleCard) return null;
            return {
                ...currentSingleCard,
                isReversed: isSingleReversed
            };
        }
    });
});

function setMode(mode) {
    currentMode = mode;
    const btnSingle = document.getElementById('btn-single');
    const btnTriple = document.getElementById('btn-triple');
    const singleView = document.getElementById('single-card-view');
    const tripleView = document.getElementById('triple-card-view');
    const titleEl = document.getElementById('reading-title');
    const descEl = document.getElementById('reading-desc');

    const deckArea = document.getElementById('deck-draw-area');
    const revealArea = document.getElementById('single-reveal-area');
    const detailsBox = document.getElementById('single-card-details');

    if (mode === 'single') {
        if (btnSingle) btnSingle.classList.add('active');
        if (btnTriple) btnTriple.classList.remove('active');
        if (singleView) singleView.classList.remove('hidden');
        if (tripleView) tripleView.classList.add('hidden');
        if (titleEl) titleEl.textContent = "Consult the Sacred Arcana";
        if (descEl) descEl.textContent = "Clear your mind, focus upon your daily path, and draw from the ancient wisdom of the deck.";

        if (!canDrawToday('single')) {
            if (deckArea) deckArea.classList.add('hidden');
            if (revealArea) revealArea.classList.remove('hidden');
        } else {
            if (deckArea) {
                deckArea.classList.remove('hidden', 'card-slide-travel');
                deckArea.style.transform = '';
                deckArea.style.opacity = '';
            }
            if (revealArea) revealArea.classList.add('hidden');
            if (detailsBox) detailsBox.classList.remove('details-slide-active', 'details-slide-enter');
        }
    } else {
        if (btnTriple) btnTriple.classList.add('active');
        if (btnSingle) btnSingle.classList.remove('active');
        if (tripleView) tripleView.classList.remove('hidden');
        if (singleView) singleView.classList.add('hidden');
        if (titleEl) titleEl.textContent = "The Three Temporal Pillars";
        if (descEl) descEl.textContent = "Cast a spread to illuminate the foundation of your Past, the focus of your Present, and the promise of Future.";
    }
}

/* ==========================================================================
   4. SINGLE CARD LOGIC
   ========================================================================== */
const REVERSAL_CHANCE = 0.25;
let isSingleReversed = false;

function drawSingleCard() {
   const today = new Date().toDateString();
   const lastDate = localStorage.getItem('arcana_last_single_date');

   if (lastDate === today) {
       const savedCardJson = localStorage.getItem('arcana_saved_single_card');
       const savedReversed = localStorage.getItem('arcana_saved_single_reversed') === 'true';

       if (savedCardJson) {
           const parsedCard = JSON.parse(savedCardJson);
           currentSingleCard = fullTarotDeck.find(c => c.name === parsedCard.name || c.id === parsedCard.id) || parsedCard;
           isSingleReversed = savedReversed;

           playMysticChime();
           restoreSingleCardUI();
           return;
       }
   }

   const randomIndex = Math.floor(Math.random() * fullTarotDeck.length);
   currentSingleCard = fullTarotDeck[randomIndex];
   isSingleFlipped = false;
   isSingleReversed = Math.random() < REVERSAL_CHANCE;

   recordDrawToday('single');
   localStorage.setItem('arcana_saved_single_card', JSON.stringify(currentSingleCard));
   localStorage.setItem('arcana_saved_single_reversed', isSingleReversed);

   const deckArea = document.getElementById('deck-draw-area');
   const revealArea = document.getElementById('single-reveal-area');
   const cardInner = document.getElementById('single-card-inner');
   const cardFront = document.getElementById('single-card-front');
   const detailsBox = document.getElementById('single-card-details');

   playMysticChime();
   renderCardFront(cardFront);

   if (cardInner) cardInner.classList.remove('flipped');
   if (detailsBox) {
       detailsBox.classList.remove('details-slide-active');
       detailsBox.classList.add('details-slide-enter');
   }

   if (deckArea) {
       deckArea.classList.add('card-slide-travel');
       const isDesktop = window.innerWidth >= 1024;
       deckArea.style.transform = isDesktop ? 'translateX(-220px) scale(0.95)' : 'translateY(-20px) scale(0.95)';
       deckArea.style.opacity = '0';
   }

   setTimeout(() => {
       if (deckArea) {
           deckArea.classList.add('hidden');
           deckArea.style.transform = '';
           deckArea.style.opacity = '';
           deckArea.classList.remove('card-slide-travel');
       }

       if (revealArea) revealArea.classList.remove('hidden');

       setTimeout(() => {
           if (cardInner) {
               isSingleFlipped = true;
               cardInner.classList.add('flipped');
               populateSingleDetails();
           }
       }, 100);

       setTimeout(() => {
           if (detailsBox) detailsBox.classList.add('details-slide-active');
       }, 350);

   }, 450);
}

function restoreSingleCardUI() {
    const deckArea = document.getElementById('deck-draw-area');
    const revealArea = document.getElementById('single-reveal-area');
    const cardInner = document.getElementById('single-card-inner');
    const cardFront = document.getElementById('single-card-front');
    const detailsBox = document.getElementById('single-card-details');

    if (deckArea) deckArea.classList.add('hidden');
    if (revealArea) revealArea.classList.remove('hidden');

    renderCardFront(cardFront);

    isSingleFlipped = true;
    if (cardInner) cardInner.classList.add('flipped');

    populateSingleDetails();

    if (detailsBox) detailsBox.classList.add('details-slide-active');
}

function renderCardFront(cardFront) {
    if (!cardFront || !currentSingleCard) return;

    const rawElem = currentSingleCard.element || currentSingleCard.suit || currentSingleCard.elemental || '';
    let elemKey = String(rawElem).toLowerCase();

    if (elemKey.includes('fire') || elemKey.includes('wand')) elemKey = 'fire';
    else if (elemKey.includes('water') || elemKey.includes('cup')) elemKey = 'water';
    else if (elemKey.includes('air') || elemKey.includes('sword')) elemKey = 'air';
    else if (elemKey.includes('earth') || elemKey.includes('pentacle')) elemKey = 'earth';

    cardFront.classList.remove('element-fire', 'element-water', 'element-earth', 'element-air');
    cardFront.classList.add('card-front', 'tarot-card-front-face', 'box-glow-gold');
    if (elemKey) cardFront.classList.add(`element-${elemKey}`);

    cardFront.style.background = '';

    const artRotation = isSingleReversed ? 'rotate-180' : '';

    cardFront.innerHTML = `
        <div class="tarot-single-header">
            <span>${currentSingleCard.arcana || 'TAROT'}</span>
            <span class="tarot-element-badge badge-${elemKey}">
                ${currentSingleCard.element || rawElem || 'Spirit'}
            </span>
        </div>

        <div class="tarot-single-body ${artRotation}">
            <i class="fa-solid ${currentSingleCard.icon} tarot-single-icon"></i>
            <h3 class="tarot-single-title">${currentSingleCard.name}</h3>
            <p class="tarot-single-subtitle">(${currentSingleCard.originalName || currentSingleCard.name})</p>
        </div>

        <div class="tarot-single-footer">
            <span>ARCANA TAROT</span>
            <span>✦ ${isSingleReversed ? 'REVERSED' : 'UPRIGHT'}</span>
        </div>
    `;
}

function flipSingleCard() {
    const cardInner = document.getElementById('single-card-inner');
    const detailsBox = document.getElementById('single-card-details');
    const cardFront = document.getElementById('single-card-front');

    if (!cardInner) return;

    isSingleFlipped = cardInner.classList.contains('flipped');
    isSingleFlipped = !isSingleFlipped;

    if (isSingleFlipped) {
        if (currentSingleCard && cardFront) renderCardFront(cardFront);
        cardInner.classList.add('flipped');
        populateSingleDetails();

        if (detailsBox) detailsBox.classList.add('details-slide-active');
    } else {
        cardInner.classList.remove('flipped');
        if (detailsBox) detailsBox.classList.remove('details-slide-active');
    }
}

function populateSingleDetails() {
    if (!currentSingleCard) return;

    const titleText = isSingleReversed
        ? `${currentSingleCard.name} (Reversed)`
        : currentSingleCard.name;

    const elArcana = document.getElementById('card-arcana');
    const elTitle = document.getElementById('card-title');
    const elDesc = document.getElementById('card-desc');
    const elLight = document.getElementById('card-light');
    const elShadow = document.getElementById('card-shadow');
    const elAdvice = document.getElementById('card-advice');
    const elSingleElemental = document.getElementById('single-elemental-container');

    if (elArcana) elArcana.textContent = `${currentSingleCard.arcana || 'TAROT'} ${isSingleReversed ? '• Reversed' : '• Upright'}`;
    if (elTitle) elTitle.textContent = titleText;
    if (elDesc) elDesc.textContent = currentSingleCard.desc || '';
    if (elLight) elLight.textContent = currentSingleCard.light || '';
    if (elShadow) elShadow.textContent = currentSingleCard.shadow || '';
    if (elAdvice) elAdvice.textContent = currentSingleCard.advice || '';

    const deckMatch = (typeof fullTarotDeck !== 'undefined' ? fullTarotDeck.find(d => d.name === currentSingleCard.name) : null) || currentSingleCard;
    const rawElem = deckMatch.element || deckMatch.suit || currentSingleCard.element || currentSingleCard.suit || '';
    const s = String(rawElem).toLowerCase();

    let elementKey = 'Fire';
    if (s.includes('fire') || s.includes('wand')) elementKey = 'Fire';
    else if (s.includes('water') || s.includes('cup')) elementKey = 'Water';
    else if (s.includes('air') || s.includes('sword')) elementKey = 'Air';
    else if (s.includes('earth') || s.includes('pentacle') || s.includes('coin')) elementKey = 'Earth';

    const loreMap = (typeof ELEMENTAL_LORE !== 'undefined') ? ELEMENTAL_LORE : {};
    const elementalBlurb = loreMap[elementKey] || "";

    if (elSingleElemental) {
        elSingleElemental.innerHTML = elementalBlurb ? `
            <div class="single-elemental-banner element-${elementKey.toLowerCase()}">
                <div class="elemental-header">✦ GUIDED BY: <span class="uppercase font-semibold">${elementKey}</span> ✦</div>
                <p class="elemental-lore-blurb">${elementalBlurb}</p>
            </div>
        ` : '';
    }

    const lightBox = elLight ? elLight.closest('div') : null;
    const shadowBox = elShadow ? elShadow.closest('div') : null;

    if (isSingleReversed) {
        if (lightBox) lightBox.className = "tarot-aspect-box tarot-aspect-dim";
        if (shadowBox) shadowBox.className = "tarot-aspect-box tarot-aspect-highlight-shadow";
    } else {
        if (lightBox) lightBox.className = "tarot-aspect-box tarot-aspect-highlight-light";
        if (shadowBox) shadowBox.className = "tarot-aspect-box tarot-aspect-dim";
    }

    const kwContainer = document.getElementById('card-keywords');
    if (kwContainer && currentSingleCard.keywords) {
        kwContainer.innerHTML = currentSingleCard.keywords.map(kw =>
            `<span class="tarot-keyword-pill">${kw}</span>`
        ).join('');
    }
}

function switchInsightTab(tabName) {
    const wisdomBtn = document.querySelector('.insight-tab-btn:nth-child(1)');
    const elementalBtn = document.querySelector('.insight-tab-btn:nth-child(2)');
    const wisdomPanel = document.getElementById('tab-content-wisdom');
    const elementalPanel = document.getElementById('tab-content-elemental');

    if (!wisdomBtn || !elementalBtn || !wisdomPanel || !elementalPanel) return;

    if (tabName === 'wisdom') {
        wisdomBtn.classList.add('active');
        elementalBtn.classList.remove('active');
        wisdomPanel.classList.add('active');
        elementalPanel.classList.remove('active');
    } else if (tabName === 'elemental') {
        elementalBtn.classList.add('active');
        wisdomBtn.classList.remove('active');
        elementalPanel.classList.add('active');
        wisdomPanel.classList.remove('active');
    }
}

window.switchInsightTab = switchInsightTab;

/* ==========================================================================
   5. TRIPLE CARD LOGIC
   ========================================================================== */
let tripleReversed = [false, false, false];

function drawTripleSpread() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('arcana_last_triple_date');
    const castTripleBtn = document.querySelector('.tarot-btn-cast-triple');
    const presentCardInner = document.getElementById('triple-card-inner-1');
    const container = document.querySelector('.triple-spread-container');

    if (presentCardInner) {
        presentCardInner.classList.remove('deck-pulse-trigger');
    }

    if (lastDate === today) {
        if (castTripleBtn) {
            castTripleBtn.innerHTML = `<i class="fa-solid fa-hourglass-end triple-btn-icon"></i> Return tomorrow for another reading`;
            castTripleBtn.classList.add('is-locked');
        }

        const savedTripleJson = localStorage.getItem('arcana_saved_triple_cards');
        const savedTripleRevJson = localStorage.getItem('arcana_saved_triple_reversed');

        if (savedTripleJson) {
            tripleCards = JSON.parse(savedTripleJson);
            tripleReversed = JSON.parse(savedTripleRevJson || '[false, false, false]');
            tripleFlipped = [true, true, true];

            playMysticChime();
            const actionsDiv = document.getElementById('triple-actions');
            if (actionsDiv) actionsDiv.classList.remove('hidden');

            for (let i = 0; i < 3; i++) {
                const inner = document.getElementById(`triple-card-inner-${i}`);
                const front = document.getElementById(`triple-card-front-${i}`);

                if (inner) inner.classList.add('flipped');
                renderTripleFront(front, tripleCards[i], tripleReversed[i]);
            }

            if (container) container.classList.add('revealed');

            const elementalContainer = document.getElementById('triple-elemental-container');
            if (elementalContainer) {
                elementalContainer.innerHTML = renderElementalAnalyzer(tripleCards);
            }

            return;
        }
    }

    recordDrawToday('triple');

    if (castTripleBtn) {
        castTripleBtn.innerHTML = `<i class="fa-solid fa-hourglass-end triple-btn-icon"></i> Return tomorrow for another reading`;
        castTripleBtn.classList.add('is-locked');
    }

    const shuffled = [...fullTarotDeck].sort(() => 0.5 - Math.random());
    tripleCards = shuffled.slice(0, 3);
    tripleFlipped = [false, false, false];

    tripleReversed = [
        Math.random() < REVERSAL_CHANCE,
        Math.random() < REVERSAL_CHANCE,
        Math.random() < REVERSAL_CHANCE
    ];

    localStorage.setItem('arcana_saved_triple_cards', JSON.stringify(tripleCards));
    localStorage.setItem('arcana_saved_triple_reversed', JSON.stringify(tripleReversed));

    const actionsDiv = document.getElementById('triple-actions');
    if (actionsDiv) actionsDiv.classList.add('hidden');

    // 1. Reset card faces while stacked
    for (let i = 0; i < 3; i++) {
        const inner = document.getElementById(`triple-card-inner-${i}`);
        const front = document.getElementById(`triple-card-front-${i}`);

        if (inner) inner.classList.remove('flipped');
        renderTripleFront(front, tripleCards[i], tripleReversed[i]);
    }

    // 2. Expand into 3-column spread layout FIRST (0ms / initial movement)
    if (container) container.classList.add('revealed');

    // 3. Stagger card flips as they slide out to their layout slots
    setTimeout(() => {
        const inner0 = document.getElementById('triple-card-inner-0');
        if (inner0) inner0.classList.add('flipped');
        tripleFlipped[0] = true;
    }, 250);

    setTimeout(() => {
        const inner1 = document.getElementById('triple-card-inner-1');
        if (inner1) inner1.classList.add('flipped');
        tripleFlipped[1] = true;
    }, 550);

    setTimeout(() => {
        const inner2 = document.getElementById('triple-card-inner-2');
        if (inner2) inner2.classList.add('flipped');
        tripleFlipped[2] = true;
    }, 850);

    // 4. Reveal actions & elemental analyzer after last card lands
    setTimeout(() => {
        if (actionsDiv) actionsDiv.classList.remove('hidden');

        const elementalContainer = document.getElementById('triple-elemental-container');
        if (elementalContainer) {
            elementalContainer.innerHTML = renderElementalAnalyzer(tripleCards);
        }
    }, 1200);

    playMysticChime();
}

function renderTripleFront(front, card, isReversed) {
    if (!front || !card) return;

    const deckMatch = fullTarotDeck.find(d => d.name === card.name || d.id === card.id) || card;
    const rawElem = deckMatch.element || deckMatch.suit || card.element || card.suit || '';
    let elemKey = String(rawElem).toLowerCase();

    if (elemKey.includes('fire') || elemKey.includes('wand')) elemKey = 'fire';
    else if (elemKey.includes('water') || elemKey.includes('cup')) elemKey = 'water';
    else if (elemKey.includes('air') || elemKey.includes('sword')) elemKey = 'air';
    else if (elemKey.includes('earth') || elemKey.includes('pentacle')) elemKey = 'earth';

    front.classList.remove('element-fire', 'element-water', 'element-earth', 'element-air');
    front.classList.add('card-front', 'tarot-card-front-face', 'box-glow-gold');
    if (elemKey) front.classList.add(`element-${elemKey}`);

    front.style.background = '';

    const artRotation = isReversed ? 'rotate-180' : '';
    const orientationBadge = isReversed ? 'Reversed' : 'Upright';
    const badgeClass = isReversed ? 'tarot-triple-badge-reversed' : 'tarot-triple-badge-upright';
    const meaningText = isReversed ? (deckMatch.shadow || card.shadow) : (deckMatch.light || card.light);
    const infoBoxClass = isReversed ? 'tarot-triple-info-box-reversed' : 'tarot-triple-info-box-upright';

    front.innerHTML = `
        <div class="tarot-triple-header">
            <span>${deckMatch.arcana || card.arcana || 'TAROT'}</span>
            <span class="tarot-element-badge badge-${elemKey}">
                ${deckMatch.element || rawElem || 'Spirit'}
            </span>
        </div>
        <div class="tarot-triple-body ${artRotation}">
            <i class="fa-solid ${deckMatch.icon || card.icon} tarot-triple-icon"></i>
            <h4 class="tarot-triple-title">${deckMatch.name || card.name}</h4>
            <p class="tarot-triple-subtitle">(${deckMatch.originalName || card.originalName || deckMatch.name})</p>
        </div>
        <div class="${infoBoxClass}">
            <div class="tarot-triple-info-header">
                <h5 class="tarot-triple-info-title">${deckMatch.name || card.name}</h5>
                <span class="${badgeClass}">${orientationBadge}</span>
            </div>
            <p class="card-aspect-text">${meaningText}</p>
        </div>
    `;
}

function flipTripleCard(index) {
    const container = document.querySelector('.triple-spread-container');
    if (!container) return;

    const isRevealed = container.classList.contains('revealed');

    if (isRevealed) {
        // --- RESTACK BACK INTO FANNED DECK ---
        tripleFlipped = [false, false, false];
        container.classList.remove('revealed');

        for (let i = 0; i < 3; i++) {
            const cardInner = document.getElementById(`triple-card-inner-${i}`);
            if (cardInner) {
                cardInner.classList.remove('flipped');
            }
        }
    } else {
        // --- UNROLL SPREAD BACK INTO LINE ---
        tripleFlipped = [true, true, true];

        for (let i = 0; i < 3; i++) {
            const cardInner = document.getElementById(`triple-card-inner-${i}`);
            if (cardInner) {
                cardInner.classList.add('flipped');
            }
        }

        container.classList.add('revealed');
    }
}

/* ==========================================================================
   6. HISTORY & JOURNAL SYSTEM
   ========================================================================== */
function saveCurrentReading() {
    if (!currentSingleCard) return;

    const cardDisplayName = isSingleReversed
        ? `${currentSingleCard.name} (Reversed)`
        : currentSingleCard.name;

    const entry = {
        type: 'Daily Single Card',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        cards: [cardDisplayName],
        summary: isSingleReversed ? currentSingleCard.shadow : currentSingleCard.advice
    };

    readingHistory.unshift(entry);
    localStorage.setItem('arcana_tarot_history', JSON.stringify(readingHistory));
    updateHistoryBadge();
    showToast("Single card reading saved to journal!");
}

function saveTripleReading() {
    if (!tripleCards[0]) return;

    const formattedCards = tripleCards.map((card, i) =>
        tripleReversed[i] ? `${card.name} (Reversed)` : card.name
    );

    const entry = {
        type: '3-Card Celestial Spread',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        cards: formattedCards,
        summary: `Past: ${formattedCards[0]} | Present: ${formattedCards[1]} | Future: ${formattedCards[2]}`
    };

    readingHistory.unshift(entry);
    localStorage.setItem('arcana_tarot_history', JSON.stringify(readingHistory));
    updateHistoryBadge();
    showToast("3-Card Spread saved to journal!");
}

function deleteHistoryEntry(index) {
    if (index < 0 || index >= readingHistory.length) return;

    readingHistory.splice(index, 1);
    localStorage.setItem('arcana_tarot_history', JSON.stringify(readingHistory));
    updateHistoryBadge();

    toggleHistoryModal(true);
    showToast("Reading removed from journal.");
}

function toggleHistoryModal(show) {
    const modal = document.getElementById('history-modal');
    const list = document.getElementById('history-list');

    if (!modal || !list) return;
    if (show) {
        if (readingHistory.length === 0) {
            list.innerHTML = `<div class="tarot-empty-history">No readings saved yet. Consult the cards!</div>`;
        } else {
            list.innerHTML = readingHistory.map((item) => `
                <div class="tarot-history-item-card">
                    <div class="tarot-history-item-top">
                        <span class="tarot-history-item-type">${item.type}</span>
                        <span class="tarot-history-item-date">${item.date}</span>
                    </div>
                    <div class="tarot-history-item-cards">${item.cards.join(' • ')}</div>
                    <p class="tarot-history-item-summary">"${item.summary}"</p>
                </div>
            `).join('');
        }
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function clearHistory() {
    readingHistory = [];
    localStorage.removeItem('arcana_tarot_history');
    updateHistoryBadge();
    toggleHistoryModal(true);
    showToast("Journal cleared.");
    renderJournalHistory();
}

/* ==========================================================================
   7. CANVAS FLOATING CELESTIAL DUST & MIST PARTICLES
   ========================================================================== */
function initCanvasFX() {
    const canvas = document.getElementById('fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.8 + 0.3,
            color: Math.random() > 0.4 ? 'rgba(212, 175, 55, ' : 'rgba(226, 217, 243, ',
            alpha: Math.random() * 0.5 + 0.15,
            speedY: -Math.random() * 0.25 - 0.05,
            speedX: Math.sin(Math.random() * Math.PI) * 0.15
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;

            if (p.y < 0) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.alpha + ')';
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color + '0.7)';
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }
    animate();
}

/* ==========================================================================
   8. Archives
   ========================================================================== */

function toggleArchivesModal(open) {
   const modal = document.getElementById('archives-modal');
   if (!modal) return;

   if (open) {
        modal.classList.remove('hidden');
        switchArchiveTab(activeArchiveTab);
        updateHistoryBadge();
   } else {
        modal.classList.add('hidden');
   }
}

function switchArchiveTab(tab) {
    activeArchiveTab = tab;
    const btnJournal = document.getElementById('tab-btn-journal');
    const btnLibrary = document.getElementById('tab-btn-library');
    const viewJournal = document.getElementById('archive-view-journal');
    const viewLibrary = document.getElementById('archive-view-library');
    const searchContainer = document.getElementById('archive-search-container');
    const filterContainer = document.getElementById('archive-filters');
    const footerAction = document.getElementById('archive-footer-action');
    const footerStatus = document.getElementById('archives-footer-status');

    if (tab === 'journal') {
        if (btnJournal) btnJournal.classList.add('active');
        if (btnLibrary) btnLibrary.classList.remove('active');

        if (viewJournal) viewJournal.classList.add('active-view');
        if (viewLibrary) viewLibrary.classList.remove('active-view');

        if (searchContainer) searchContainer.classList.add('hidden');
        if (filterContainer) {
            filterContainer.classList.add('hidden');
            filterContainer.classList.remove('flex');
        }

        if (footerStatus) footerStatus.textContent = "Stored in your local browser memory";
        if (footerAction) {
            footerAction.textContent = "Clear All Readings";
            footerAction.onclick = clearHistory;
            footerAction.style.display = "inline";
        }
        renderJournalHistory();
    } else {
        if (btnLibrary) btnLibrary.classList.add('active');
        if (btnJournal) btnJournal.classList.remove('active');

        if (viewLibrary) viewLibrary.classList.add('active-view');
        if (viewJournal) viewJournal.classList.remove('active-view');

        if (searchContainer) searchContainer.classList.remove('hidden');

        if (filterContainer) {
            filterContainer.classList.add('hidden');
            filterContainer.classList.remove('flex');
            filterContainer.style.display = '';
        }

        if (footerStatus) footerStatus.textContent = "Complete Sacred Deck Index";
        if (footerAction) footerAction.style.display = "none";

        renderLibraryGrid(fullTarotDeck);
        document.getElementById('archive-search-input')?.focus();
    }
}

function renderJournalHistory() {
    const viewJournal = document.getElementById('archive-view-journal');
    if (!viewJournal) return;

    if (readingHistory.length === 0) {
        viewJournal.innerHTML = `<div class="tarot-empty-history">No readings saved yet. Consult the cards!</div>`;
    } else {
        viewJournal.innerHTML = readingHistory.map((item, index) => `
            <div class="tarot-history-item-card">
                <div class="tarot-history-item-top">
                    <span class="tarot-history-item-type">${item.type}</span>
                    <div class="tarot-history-item-actions">
                        <span class="tarot-history-item-date">${item.date}</span>
                        <button class="tarot-history-delete-btn" onclick="removeJournalEntry(${index})" title="Delete entry">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
                <div class="tarot-history-item-cards">${item.cards.join(' • ')}</div>
                <p class="tarot-history-item-summary">"${item.summary}"</p>
            </div>
        `).join('');
    }
}

function removeJournalEntry(index) {
    let history = JSON.parse(localStorage.getItem('arcana_reading_history') || '[]');
    history.splice(index, 1);
    localStorage.setItem('arcana_reading_history', JSON.stringify(history));
    readingHistory = history;

    renderJournalHistory();
    updateHistoryBadge();
}

function renderLibraryGrid(cards) {
    const grid = document.getElementById('archive-view-library');
    if (!grid) return;

    if (cards.length === 0) {
        grid.innerHTML = `<div class="tarot-grid-full">No arcane archetypes found matching your query.</div>`;
        return;
    }

    grid.innerHTML = cards.map(card => `
        <div onclick="inspectCardFromLibrary('${card.id}')" class="tarot-library-card box-glow-gold">
            <div class="tarot-element-badge">${card.element || 'spirit'}</div>
            <div class="tarot-library-card-content">
                <i class="fa-solid ${card.icon} tarot-library-card-icon"></i>
                <h4 class="tarot-library-card-title">${card.name}</h4>
                <p class="tarot-library-card-subtitle">(${card.originalName})</p>
            </div>
            <div class="tarot-library-card-footer">
                ${card.keywords.slice(0, 2).map(kw => `<span class="tarot-library-keyword-tag">${kw}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function filterLibrary(filterType) {
    currentLibraryFilter = filterType;

    document.querySelectorAll('.lib-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event?.currentTarget?.classList.add('active');

    applyLibrarySearch();
}

function applyLibrarySearch() {
    const query = document.getElementById('archive-search-input')?.value.toLowerCase() || '';

    const filtered = fullTarotDeck.filter(card => {
        let matchesFilter = true;

        if (currentLibraryFilter !== 'all') {
            if (currentLibraryFilter === 'Major Arcana') {
                matchesFilter = card.arcana === 'Major Arcana';
            } else if (currentLibraryFilter === 'Minor Arcana') {
                matchesFilter = card.arcana.startsWith('Minor Arcana');
            } else {
                matchesFilter = card.arcana.includes(currentLibraryFilter);
            }
        }

        const matchesQuery = !query ||
            card.name.toLowerCase().includes(query) ||
            card.originalName.toLowerCase().includes(query) ||
            card.keywords.some(kw => kw.toLowerCase().includes(query)) ||
            card.desc.toLowerCase().includes(query);

        return matchesFilter && matchesQuery;
    });

    renderLibraryGrid(filtered);
}

function inspectCardFromLibrary(cardId) {
   const card = fullTarotDeck.find(c => c.id === cardId);
   if (!card) return;

   currentSingleCard = card;
   isSingleFlipped = true;
   isSingleReversed = false;

   setMode('single');
   toggleArchivesModal(false);

   const deckArea = document.getElementById('deck-draw-area');
   const revealArea = document.getElementById('single-reveal-area');
   const cardInner = document.getElementById('single-card-inner');
   const cardFront = document.getElementById('single-card-front');
   const detailsBox = document.getElementById('single-card-details');

   if (deckArea) deckArea.classList.add('hidden');
   if (revealArea) revealArea.classList.remove('hidden');
   if (cardInner) cardInner.classList.add('flipped');

   renderCardFront(cardFront);

   if (detailsBox) detailsBox.classList.add('details-slide-active');

   document.getElementById('card-arcana').textContent = card.arcana;
   document.getElementById('card-title').textContent = card.name;
   document.getElementById('card-desc').textContent = card.desc;
   document.getElementById('card-light').textContent = card.light;
   document.getElementById('card-shadow').textContent = card.shadow;
   document.getElementById('card-advice').textContent = card.advice;

   const keywordsContainer = document.getElementById('card-keywords');
   if (keywordsContainer) {
       keywordsContainer.innerHTML = card.keywords.map(kw =>
           `<span class="tarot-library-keyword-pill">${kw}</span>`
       ).join('');
   }
}

function toggleMobileFilters() {
    const filtersContainer = document.getElementById('archive-filters');
    const toggleBtn = document.getElementById('filter-toggle-btn');
    if (!filtersContainer) return;

    const isNowHidden = filtersContainer.classList.toggle('hidden');
    if (toggleBtn) {
        if (!isNowHidden) {
            toggleBtn.classList.add('border-gold', 'bg-gold/10');
        } else {
            toggleBtn.classList.remove('border-gold', 'bg-gold/10');
        }
    }
}

/* ==========================================================================
   ELEMENTAL BALANCE ANALYZER FUNCTIONS
   ========================================================================== */

function calculateElementalBalance(drawnCards) {
    if (!drawnCards || !Array.isArray(drawnCards) || drawnCards.length === 0) return null;

    const counts = { Fire: 0, Water: 0, Air: 0, Earth: 0 };
    let totalAssigned = 0;

    drawnCards.forEach(card => {
        const deckMatch = (typeof fullTarotDeck !== 'undefined' ? fullTarotDeck.find(d => d.name === card.name || d.id === card.id) : null) || card;

        const raw = deckMatch.element || deckMatch.suit || card.element || card.suit || deckMatch.arcana || '';
        const s = String(raw).toLowerCase();

        let element = 'Fire';
        if (s.includes('fire') || s.includes('wand')) element = 'Fire';
        else if (s.includes('water') || s.includes('cup')) element = 'Water';
        else if (s.includes('air') || s.includes('sword')) element = 'Air';
        else if (s.includes('earth') || s.includes('pentacle') || s.includes('coin')) element = 'Earth';
        else if (s.includes('major')) element = 'Fire';

        counts[element]++;
        totalAssigned++;
    });

    if (totalAssigned === 0) return null;

    const percentages = {};
    for (const [elem, count] of Object.entries(counts)) {
        percentages[elem] = Math.round((count / totalAssigned) * 100);
    }

    const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    return { counts, percentages, dominant };
}

function renderElementalAnalyzer(drawnCards) {
    const balance = calculateElementalBalance(drawnCards);
    if (!balance) return '<div class="elemental-balance-container tarot-guidance-quote esoteric text-xs text-gold/60 text-center">✦ Awaiting Elemental Alignment ✦</div>';

    const { percentages, dominant } = balance;
    const dominantClass = `element-${dominant.toLowerCase()}`;

    const elementClassMap = {
        Fire: 'elemental-fill-fire',
        Water: 'elemental-fill-water',
        Air: 'elemental-fill-air',
        Earth: 'elemental-fill-earth'
    };

    const loreMap = (typeof ELEMENTAL_LORE !== 'undefined') ? ELEMENTAL_LORE : {};
    const loreBlurb = loreMap[dominant] || "A harmonious equilibrium of cosmic forces.";

    return `
        <div class="elemental-balance-container ${dominantClass}">
            <div class="elemental-header">
                ✦ Elemental Resonance: <span>${dominant} Dominant</span> ✦
            </div>

            <div class="elemental-bars-list">
                ${Object.entries(percentages).map(([elem, pct]) => `
                    <div class="elemental-bar-row">
                        <div class="elemental-bar-label">
                            <span>${elem}</span>
                            <span>${pct}%</span>
                        </div>
                        <div class="elemental-track">
                            <div class="elemental-fill ${elementClassMap[elem]}" style="width: ${pct}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="elemental-lore-blurb">
                <p>${loreBlurb}</p>
            </div>
        </div>
    `;
}
