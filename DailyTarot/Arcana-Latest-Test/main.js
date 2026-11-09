import { fullTarotDeck, ELEMENTAL_LORE } from './js/cardLibrary.js';
import { renderAllCardBacks } from './js/theme.js';
import { iconHTML, escapeHTML, showToast, initSiteChrome } from './js/common.js';
import { generateSigilFromAdvice, animateSigilDraw } from './js/sigil.js';
import { addJournalEntry, SAVE_FAILED_MSG } from './js/journal.js';
import { playMysticChime } from './js/audio.js';
import { initShareButton } from './js/share.js';
import { analyzeSpread } from './js/spreadReading.js';
import { analyzeElements } from './js/elements.js';
import { renderElementalReading, renderElementalTeaser } from './js/elementsView.js';
import { safeGetItem, safeSetItem, safeParse, checkURLState, updateURLMode, readURLMode } from './js/storage.js';

let currentMode = 'single';
let tripleCasting = false;   // true while the cast animation runs, so extra taps can't interrupt it
let currentSingleCard = null;
let isSingleFlipped = false;
let tripleCards = [null, null, null];
let tripleFlipped = [false, false, false];
let browseCard = null; // card opened from the Archives (never overwrites today's draw)

/* ==========================================================================
   1. HANDLERS & HELPER FUNCTIONS
   ========================================================================== */
/* ==========================================================================
   0. SMALL SHARED HELPERS
   ========================================================================== */
function loadSavedTriple() {
    const cards = safeParse(safeGetItem('arcana_saved_triple_cards'), null);
    if (!Array.isArray(cards) || cards.length !== 3 || !cards.every(Boolean)) return null;

    const rev = safeParse(safeGetItem('arcana_saved_triple_reversed'), null);
    return {
        cards: cards.map(c => fullTarotDeck.find(d => d.id === c.id) || c),
        reversed: Array.isArray(rev) && rev.length === 3 ? rev : [false, false, false]
    };
}

// True only when today's spread can actually be shown. The saved date alone is not enough:
// if the cards failed to save, the visitor must still be able to cast.
function hasTripleToday() {
    return safeGetItem('arcana_last_triple_date') === new Date().toDateString() && loadSavedTriple() !== null;
}

function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function getShownCard() {
    return browseCard || currentSingleCard;
}

function getShownReversed() {
    return browseCard ? false : isSingleReversed;
}

function setNavActive(id, on) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('active', on);
    if (on) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
}

// Highlights the nav button for what is on screen. Previewing a card from the Library
// counts as "The Archives", not "Daily Card".
function updateNav() {
    const previewing = currentMode === 'single' && !!browseCard;
    setNavActive('btn-single', currentMode === 'single' && !previewing);
    setNavActive('btn-triple', currentMode === 'triple');
    setNavActive('btn-archives', previewing);
}

function setSingleActionsVisible(visible) {
    document.querySelector('#single-reveal-area .card-action-container')?.classList.toggle('hidden', !visible);
}

function canDrawToday(drawType) {
    const lastDate = safeGetItem(`arcana_last_${drawType}_date`);
    const today = new Date().toDateString();
    return lastDate !== today;
}

function recordDrawToday(drawType) {
    const today = new Date().toDateString();
    return safeSetItem(`arcana_last_${drawType}_date`, today);
}

let storageWarningShown = false;
function warnDrawNotRemembered() {
    if (storageWarningShown) return;
    storageWarningShown = true;
    showToast("Your browser is blocking storage, so today's draw won't be remembered after you leave this page.", 6000);
}

// Archive deep links use the card's id as-is (king_wands -> ?mode=archive-king_wands).
// Ids are lowercase letters, digits and underscores, which is why readURLMode() can safely lowercase the URL value.
function cardSlug(card) {
    return card.id;
}

function findCardBySlug(slug) {
    return fullTarotDeck.find(c => c.id === slug) || null;
}

/* ==========================================================================
   2. GLOBAL SCOPE BINDING
   ========================================================================== */
Object.assign(window, {
    setMode,
    drawSingleCard,
    flipSingleCard,
    drawTripleSpread,
    flipTripleCard,
    saveCurrentReading,
    saveTripleReading,
});

/* ==========================================================================
   3. INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    checkURLState(() => {
        if (typeof setMode === 'function') {
            setMode('triple');
        } else {
            document.getElementById('btn-triple')?.click();
        }
    });

    window.addEventListener('popstate', () => {
        const { mode, slug } = readURLMode();
        const card = mode === 'archive' ? findCardBySlug(slug) : null;
        if (card) {
            previewArchiveCard(card.id, { updateUrl: false, announce: false });
        } else {
            setMode(mode === 'triple' ? 'triple' : 'single');
        }
    });

    initSiteChrome();
    initTripleCarousel();
    initTripleInsightTabs();
    updateNav();
    renderAllCardBacks();

    // Mode Navigation
    document.getElementById('btn-single')?.addEventListener('click', () => { setMode('single'); updateURLMode('single'); });
    document.getElementById('btn-triple')?.addEventListener('click', () => { setMode('triple'); updateURLMode('triple'); });

    // Single Card Draw & Flip Listeners
    document.getElementById('deck-card-container')?.addEventListener('click', drawSingleCard);
    document.getElementById('btn-draw-single')?.addEventListener('click', drawSingleCard);
    document.getElementById('single-card-inner')?.addEventListener('click', flipSingleCard);
    document.getElementById('btn-tab-wisdom')?.addEventListener('click', () => switchInsightTab('wisdom'));
    document.getElementById('btn-tab-elemental')?.addEventListener('click', () => switchInsightTab('elemental'));

    // 3-Card Spread Listeners
    for (let i = 0; i < 3; i++) {
        const cardInner = document.getElementById(`triple-card-inner-${i}`);
        if (cardInner) {
            cardInner.addEventListener('click', (e) => {
                if (tripleCasting) return;

                if (!hasTripleToday()) {
                    // Nothing cast yet: tapping any of the three card backs casts the spread
                    e.stopPropagation();
                    drawTripleSpread();
                } else {
                    flipTripleCard(i);
                }
            });
        }
    }

    // Restore Today's Single Draw
    const today = new Date().toDateString();

    if (safeGetItem('arcana_last_single_date') === today) {
        const savedCardJson = safeGetItem('arcana_saved_single_card');
        const savedReversed = safeGetItem('arcana_saved_single_reversed') === 'true';

        const savedCard = safeParse(savedCardJson, null);
        if (savedCard) {
            currentSingleCard = fullTarotDeck.find(c => c.id === savedCard.id) || savedCard;
            isSingleReversed = savedReversed;

            restoreSingleCardUI();
        }
    }

    // Restore Today's Triple Spread
    if (safeGetItem('arcana_last_triple_date') === today) {
        const savedTriple = loadSavedTriple();
        if (savedTriple) {
            // Only hide the Cast button when there is a saved reading to show instead
            const tripleBtn = document.querySelector('.tarot-btn-cast-triple');
            if (tripleBtn) {
                tripleBtn.style.display = 'none';
            }
            tripleCards = savedTriple.cards;
            tripleReversed = savedTriple.reversed;
            tripleFlipped = [true, true, true];

            const actionsDiv = document.getElementById('triple-actions');
            if (actionsDiv) actionsDiv.classList.remove('hidden');

            for (let i = 0; i < 3; i++) {
                const inner = document.getElementById(`triple-card-inner-${i}`);
                const front = document.getElementById(`triple-card-front-${i}`);

                if (inner) inner.classList.add('flipped');
                renderTripleFront(front, tripleCards[i], tripleReversed[i]);
            }

            renderTripleInsights();
        }
    }

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
            const balance = analyzeElements(tripleCards, tripleReversed);
            const overall = analyzeSpread(tripleCards, tripleReversed);
            return {
                isTripleSpread: true,
                title: 'My 3-Card Arcana Spread',
                cards: tripleCards,
                dominantElement: balance ? balance.dominant : 'Cosmic',
                overallHeadline: overall ? overall.headline : '',
                loreBlurb: balance ? balance.lore : "A harmonious equilibrium of cosmic forces flowing through the timeline.",
                description: `Past: ${tripleCards[0].name} | Present: ${tripleCards[1].name} | Future: ${tripleCards[2].name}`
            };
        } else {
            if (browseCard || !currentSingleCard) return null;
            return {
                ...currentSingleCard,
                isReversed: isSingleReversed
            };
        }
    });

    // Deep link: ?mode=archive-king_wands opens that card's preview straight away
    const initialState = readURLMode();
    if (initialState.mode === 'archive') {
        const linkedCard = findCardBySlug(initialState.slug);
        if (linkedCard) {
            previewArchiveCard(linkedCard.id, { updateUrl: false, announce: false });
        } else {
            updateURLMode('single', null, { replace: true });   // unknown card: tidy the address bar
        }
    }
});

/* On narrow screens the revealed spread is a horizontal scroll-snap row (see card-styles.css).
   This keeps the Past / Present / Future pills in step with it and lets them jump to a card. */
function initTripleCarousel() {
    const scroller = document.querySelector('.triple-spread-container');
    const pills = Array.from(document.querySelectorAll('.triple-dot'));
    const cards = scroller ? Array.from(scroller.querySelectorAll('.triple-card-wrapper')) : [];
    if (!scroller || pills.length !== cards.length || cards.length === 0) return;

    // distance from the middle of the scroller to the middle of a card
    const offsetToCentre = (card) => {
        const s = scroller.getBoundingClientRect();
        const c = card.getBoundingClientRect();
        return (c.left + c.width / 2) - (s.left + s.width / 2);
    };

    function syncPills() {
        let nearest = 0;
        cards.forEach((card, i) => {
            if (Math.abs(offsetToCentre(card)) < Math.abs(offsetToCentre(cards[nearest]))) nearest = i;
        });
        pills.forEach((pill, i) => {
            pill.classList.toggle('active', i === nearest);
            if (i === nearest) pill.setAttribute('aria-current', 'true');
            else pill.removeAttribute('aria-current');
        });
    }

    let frame = 0;
    scroller.addEventListener('scroll', () => {
        if (frame) return;
        frame = requestAnimationFrame(() => { frame = 0; syncPills(); });
    }, { passive: true });

    pills.forEach((pill, i) => {
        pill.addEventListener('click', () => {
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            scroller.scrollTo({ left: scroller.scrollLeft + offsetToCentre(cards[i]), behavior: reduce ? 'auto' : 'smooth' });
        });
    });

    // every time the spread is (re)revealed, start from the Past card again
    let wasRevealed = scroller.classList.contains('revealed');
    new MutationObserver(() => {
        const isRevealed = scroller.classList.contains('revealed');
        if (isRevealed && !wasRevealed) {
            scroller.scrollLeft = 0;
            syncPills();
        }
        wasRevealed = isRevealed;
    }).observe(scroller, { attributes: true, attributeFilter: ['class'] });

    // cards slide into the row with a transition; measure again once it has settled
    scroller.addEventListener('transitionend', () => {
        if (frame) return;
        frame = requestAnimationFrame(() => { frame = 0; syncPills(); });
    });

    window.addEventListener('resize', syncPills);
    syncPills();
}

function setMode(mode) {
    currentMode = mode;
    const singleView = document.getElementById('single-card-view');
    const tripleView = document.getElementById('triple-card-view');
    const titleEl = document.getElementById('reading-title');
    const descEl = document.getElementById('reading-desc');

    const deckArea = document.getElementById('deck-draw-area');
    const revealArea = document.getElementById('single-reveal-area');
    const detailsBox = document.getElementById('single-card-details');

    if (mode === 'single') {
        if (singleView) singleView.classList.remove('hidden');
        if (tripleView) tripleView.classList.add('hidden');
        if (titleEl) titleEl.textContent = "Consult the Sacred Arcana";
        if (descEl) descEl.textContent = "Clear your mind, focus upon your daily path, and draw from the ancient wisdom of the deck.";

        browseCard = null;
        setSingleActionsVisible(true);

        if (!canDrawToday('single')) {
            if (currentSingleCard) {
                restoreSingleCardUI();
            } else {
                if (deckArea) deckArea.classList.add('hidden');
                if (revealArea) revealArea.classList.remove('hidden');
            }
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
        if (tripleView) tripleView.classList.remove('hidden');
        if (singleView) singleView.classList.add('hidden');
        if (titleEl) titleEl.textContent = "The Three Temporal Pillars";
        if (descEl) descEl.textContent = "Cast a spread to illuminate the foundation of your Past, the focus of your Present, and the promise of Future.";
    }

    updateNav();
}

/* ==========================================================================
   4. SINGLE CARD LOGIC
   ========================================================================== */
const REVERSAL_CHANCE = 0.25;
let isSingleReversed = false;

function drawSingleCard() {
    const today = new Date().toDateString();
    const lastDate = safeGetItem('arcana_last_single_date');

    if (lastDate === today) {
        const savedCardJson = safeGetItem('arcana_saved_single_card');
        const savedReversed = safeGetItem('arcana_saved_single_reversed') === 'true';

        const parsedCard = safeParse(savedCardJson, null);
        if (parsedCard) {
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
    browseCard = null;
    updateNav();
    setSingleActionsVisible(true);

    const singlePersisted = [
        recordDrawToday('single'),
        safeSetItem('arcana_saved_single_card', JSON.stringify(currentSingleCard)),
        safeSetItem('arcana_saved_single_reversed', isSingleReversed)
    ].every(Boolean);
    if (!singlePersisted) warnDrawNotRemembered();

    const deckArea = document.getElementById('deck-draw-area');
    const revealArea = document.getElementById('single-reveal-area');
    const cardInner = document.getElementById('single-card-inner');
    const cardFront = document.getElementById('single-card-front');
    const detailsBox = document.getElementById('single-card-details');

    playMysticChime();
    renderCardFront(cardFront);

    // Reset card state for new draw
    isSingleFlipped = false;
    if (cardInner) cardInner.classList.remove('flipped');

    // Reset details box to enter state (will slide in later)
    if (detailsBox) {
        detailsBox.classList.remove('details-slide-active');
        detailsBox.classList.add('details-slide-enter');
    }

    // Animate deck exit
    if (deckArea) {
        deckArea.classList.add('card-slide-travel');
        const isDesktop = window.innerWidth >= 1024;
        deckArea.style.transform = isDesktop ? 'translateX(-220px) scale(0.95)' : 'translateY(-20px) scale(0.95)';
        deckArea.style.opacity = '0';
    }

    setTimeout(() => {
        const deckHadFocus = !!deckArea && deckArea.contains(document.activeElement);
        const cardSlot = document.querySelector('.single-slot-container');

        // 1. Prepare card container entry offset
        if (cardSlot) {
            cardSlot.classList.add('card-slide-enter');
            cardSlot.classList.remove('card-slide-active');
        }

        // 2. Unhide reveal area & hide deck area
        if (revealArea) revealArea.classList.remove('hidden');
        if (deckArea) {
            deckArea.classList.add('hidden');
            deckArea.style.transform = '';
            deckArea.style.opacity = '';
            deckArea.classList.remove('card-slide-travel');
        }

        // 3. Force reflow specifically on the card container
        if (cardSlot) void cardSlot.offsetWidth;
        if (deckHadFocus && cardInner) cardInner.focus({ preventScroll: true });

        // 4. Trigger card slide glide + 3D flip in next frame
        requestAnimationFrame(() => {
            if (cardSlot) {
                cardSlot.classList.remove('card-slide-enter');
                cardSlot.classList.add('card-slide-active');
            }

            if (cardInner) {
                isSingleFlipped = true;
                cardInner.classList.add('flipped');
                populateSingleDetails();
            }
        });

        // 5. Slide in details pane right behind it
        setTimeout(() => {
            if (detailsBox) {
                detailsBox.classList.remove('details-slide-enter');
                detailsBox.classList.add('details-slide-active');
            }
        }, 550);

    }, 450);
}

function restoreSingleCardUI() {
    browseCard = null;
    updateNav();
    setSingleActionsVisible(true);
    const deckArea = document.getElementById('deck-draw-area');
    const revealArea = document.getElementById('single-reveal-area');
    const cardInner = document.getElementById('single-card-inner');
    const cardFront = document.getElementById('single-card-front');
    const detailsBox = document.getElementById('single-card-details');

    const deckHadFocus = !!deckArea && deckArea.contains(document.activeElement);
    if (deckArea) deckArea.classList.add('hidden');
    if (revealArea) revealArea.classList.remove('hidden');
    if (deckHadFocus && cardInner) cardInner.focus({ preventScroll: true });

    renderCardFront(cardFront);

    isSingleFlipped = true;
    if (cardInner) cardInner.classList.add('flipped');

    populateSingleDetails();

    if (detailsBox) detailsBox.classList.add('details-slide-active');
}

function renderCardFront(cardFront) {
    const card = getShownCard();
    const reversed = getShownReversed();
    if (!cardFront || !card) return;

    const rawElem = card.element || card.suit || card.elemental || '';
    let elemKey = String(rawElem).toLowerCase();

    if (elemKey.includes('fire') || elemKey.includes('wand')) elemKey = 'fire';
    else if (elemKey.includes('water') || elemKey.includes('cup')) elemKey = 'water';
    else if (elemKey.includes('air') || elemKey.includes('sword')) elemKey = 'air';
    else if (elemKey.includes('earth') || elemKey.includes('pentacle')) elemKey = 'earth';

    cardFront.classList.remove('element-fire', 'element-water', 'element-earth', 'element-air');
    cardFront.classList.add('card-front', 'tarot-card-front-face', 'box-glow-gold');
    if (elemKey) cardFront.classList.add(`element-${elemKey}`);

    cardFront.classList.toggle('is-reversed', reversed);
    cardFront.classList.toggle('card-reverse', reversed);

    cardFront.style.background = '';

    const artRotation = reversed ? 'single-reversed' : '';

    cardFront.innerHTML = `
        <div class="tarot-single-header">
            <span>${card.arcana || 'TAROT'}</span>
            <span class="tarot-element-badge badge-${elemKey}">
                ${card.element || rawElem || 'Spirit'}
            </span>
        </div>

        <div class="tarot-single-body ${artRotation}">
            <div class="card-icon-slot tarot-single-icon"></div>
            <h3 class="tarot-single-title">${card.name}</h3>
            <p class="tarot-single-subtitle">(${card.originalName || card.name})</p>
        </div>

        <div class="tarot-single-footer">
            <span>ARCANA TAROT</span>
            <span>✦ ${browseCard ? 'ARCHIVE' : (reversed ? 'REVERSED' : 'UPRIGHT')}</span>
        </div>
    `;

    const adviceText = card.advice || card.meaning || card.desc || card.name;
    const seedString = `${card.id || card.name}_${adviceText}`;
    const sigilMarkup = generateSigilFromAdvice({ advice: seedString });

    const iconSlot = cardFront.querySelector('.card-icon-slot');
    if (iconSlot) {
        iconSlot.innerHTML = sigilMarkup;
        animateSigilDraw(iconSlot);
    }
}

function flipSingleCard() {
    const cardInner = document.getElementById('single-card-inner');
    const cardFront = document.getElementById('single-card-front');

    if (!cardInner) return;

    // Toggle 3D flip on the card face only—details panel stays visible once revealed
    isSingleFlipped = !isSingleFlipped;
    cardInner.classList.toggle('flipped', isSingleFlipped);

    if (isSingleFlipped && currentSingleCard && cardFront) {
        renderCardFront(cardFront);
        populateSingleDetails();
    }
}

function populateSingleDetails() {
    const card = getShownCard();
    const reversed = getShownReversed();
    if (!card) return;

    const titleText = reversed
        ? `${card.name} (Reversed)`
        : card.name;

    const elArcana = document.getElementById('card-arcana');
    const elTitle = document.getElementById('card-title');
    const elDesc = document.getElementById('card-desc');
    const elLight = document.getElementById('card-light');
    const elShadow = document.getElementById('card-shadow');
    const elAdvice = document.getElementById('card-advice-text');
    const elSingleElemental = document.getElementById('single-elemental-container');

    // A Library preview has no orientation: it shows the card itself, with both aspects on equal footing
    const previewing = !!browseCard;

    if (elArcana) elArcana.textContent = previewing
        ? `${card.arcana || 'TAROT'}`
        : `${card.arcana || 'TAROT'} ${reversed ? '• Reversed' : '• Upright'}`;
    if (elTitle) elTitle.textContent = titleText;
    if (elDesc) elDesc.textContent = card.desc || '';
    if (elLight) elLight.textContent = card.light || '';
    if (elShadow) elShadow.textContent = card.shadow || '';
    if (elAdvice) elAdvice.textContent = card.advice || '';

    const deckMatch = (typeof fullTarotDeck !== 'undefined' ? fullTarotDeck.find(d => d.name === card.name) : null) || card;
    const rawElem = deckMatch.element || deckMatch.suit || card.element || card.suit || '';
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
                <div class="elemental-header">✦ GUIDED BY: <span class="element-${elementKey.toLowerCase()}">${elementKey}</span> ✦</div>
                <p class="elemental-lore-blurb">${elementalBlurb}</p>
            </div>
        ` : '';
    }

    const lightBox = elLight ? elLight.closest('div') : null;
    const shadowBox = elShadow ? elShadow.closest('div') : null;

    if (previewing) {
        if (lightBox) lightBox.className = "tarot-aspect-box tarot-aspect-highlight-light";
        if (shadowBox) shadowBox.className = "tarot-aspect-box tarot-aspect-highlight-shadow";
    } else if (reversed) {
        if (lightBox) lightBox.className = "tarot-aspect-box tarot-aspect-dim";
        if (shadowBox) shadowBox.className = "tarot-aspect-box tarot-aspect-highlight-shadow";
    } else {
        if (lightBox) lightBox.className = "tarot-aspect-box tarot-aspect-highlight-light";
        if (shadowBox) shadowBox.className = "tarot-aspect-box tarot-aspect-dim";
    }

    const kwContainer = document.getElementById('card-keywords');
    if (kwContainer && card.keywords) {
        kwContainer.innerHTML = card.keywords.map(kw =>
            `<span class="tarot-keyword-pill">${kw}</span>`
        ).join('');
    }
}

function switchInsightTab(tabName) {
    const wisdomBtn = document.querySelector('#tarot-insights-container .insight-tab-btn:nth-child(1)');
    const elementalBtn = document.querySelector('#tarot-insights-container .insight-tab-btn:nth-child(2)');
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
    if (tripleCasting) return;

    const today = new Date().toDateString();
    const lastDate = safeGetItem('arcana_last_triple_date');
    const castTripleBtn = document.querySelector('.tarot-btn-cast-triple');
    const presentCardInner = document.getElementById('triple-card-inner-1');
    const container = document.querySelector('.triple-spread-container');

    if (presentCardInner) {
        presentCardInner.classList.remove('deck-pulse-trigger');
    }

    if (lastDate === today) {
        const savedTriple = loadSavedTriple();
        if (savedTriple) {
            // Hide the draw button completely if today's reading is loaded
            if (castTripleBtn) {
                castTripleBtn.style.display = 'none';
            }

            tripleCards = savedTriple.cards;
            tripleReversed = savedTriple.reversed;
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

            renderTripleInsights();

            return;
        }
    }

    tripleCasting = true;
    const tripleDateSaved = recordDrawToday('triple');

    const shuffled = shuffle([...fullTarotDeck]);
    tripleCards = shuffled.slice(0, 3);
    tripleFlipped = [false, false, false];

    tripleReversed = [
        Math.random() < REVERSAL_CHANCE,
        Math.random() < REVERSAL_CHANCE,
        Math.random() < REVERSAL_CHANCE
    ];

    const triplePersisted = [
        tripleDateSaved,
        safeSetItem('arcana_saved_triple_cards', JSON.stringify(tripleCards)),
        safeSetItem('arcana_saved_triple_reversed', JSON.stringify(tripleReversed))
    ].every(Boolean);
    if (!triplePersisted) warnDrawNotRemembered();

    const actionsDiv = document.getElementById('triple-actions');
    if (actionsDiv) actionsDiv.classList.add('hidden');

    for (let i = 0; i < 3; i++) {
        const inner = document.getElementById(`triple-card-inner-${i}`);
        const front = document.getElementById(`triple-card-front-${i}`);

        if (inner) inner.classList.remove('flipped');
        renderTripleFront(front, tripleCards[i], tripleReversed[i]);
    }

    if (container) container.classList.add('revealed');

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

    setTimeout(() => {
        if (actionsDiv) actionsDiv.classList.remove('hidden');

        // Hide the button once the final card flip finishes and actions display
        if (castTripleBtn) {
            castTripleBtn.style.display = 'none';
        }

        renderTripleInsights();
        tripleCasting = false;
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
            <div class="card-icon-slot tarot-triple-icon"></div>
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

    const adviceText = deckMatch.advice || card.advice || meaningText || card.name;
    const seedString = `${deckMatch.id || card.id || deckMatch.name}_${adviceText}`;
    const sigilMarkup = generateSigilFromAdvice({ advice: seedString });

    const iconSlot = front.querySelector('.card-icon-slot');
    if (iconSlot) {
        iconSlot.innerHTML = sigilMarkup;
        animateSigilDraw(iconSlot);
    }
}

function flipTripleCard(index) {
    const container = document.querySelector('.triple-spread-container');
    if (!container) return;

    const isRevealed = container.classList.contains('revealed');

    if (isRevealed) {
        tripleFlipped = [false, false, false];
        container.classList.remove('revealed');

        for (let i = 0; i < 3; i++) {
            const cardInner = document.getElementById(`triple-card-inner-${i}`);
            if (cardInner) {
                cardInner.classList.remove('flipped');
            }
        }
    } else {
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
   6. SAVING TO THE JOURNAL (the Journal itself lives on archives.html)
   ========================================================================== */
function saveCurrentReading() {
    if (browseCard || !currentSingleCard) return;

    const cardDisplayName = isSingleReversed
        ? `${currentSingleCard.name} (Reversed)`
        : currentSingleCard.name;

    const entry = {
        type: 'Daily Single Card',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        cards: [cardDisplayName],
        summary: isSingleReversed ? currentSingleCard.shadow : currentSingleCard.advice
    };

    if (!addJournalEntry(entry)) {
        showToast(SAVE_FAILED_MSG, 5000);
        return;
    }
    showToast("Single card reading saved to journal!");
}

function saveTripleReading() {
    if (!tripleCards[0]) return;

    const formattedCards = tripleCards.map((card, i) =>
        tripleReversed[i] ? `${card.name} (Reversed)` : card.name
    );

    const overall = analyzeSpread(tripleCards, tripleReversed);

    const entry = {
        type: '3-Card Celestial Spread',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        cards: formattedCards,
        headline: overall ? overall.headline : '',
        summary: `Past: ${formattedCards[0]} | Present: ${formattedCards[1]} | Future: ${formattedCards[2]}`
    };

    if (!addJournalEntry(entry)) {
        showToast(SAVE_FAILED_MSG, 5000);
        return;
    }
    showToast("3-Card Spread saved to journal!");
}

/* ==========================================================================
   ARCHIVE CARD PREVIEW (reached from archives.html via ?mode=archive-<card id>)
   ========================================================================== */
// updateUrl: add ?mode=archive-<card> to the address bar (off when we are responding to the URL itself)
// announce:  show the "Opened from the Archives" toast (off for deep links and Back/Forward)
function previewArchiveCard(cardId, { updateUrl = true, announce = true } = {}) {
    const card = fullTarotDeck.find(c => c.id === cardId);
    if (!card) return;

    setMode('single');

    browseCard = card;
    updateNav();

    const deckArea = document.getElementById('deck-draw-area');
    const revealArea = document.getElementById('single-reveal-area');
    const cardInner = document.getElementById('single-card-inner');
    const cardFront = document.getElementById('single-card-front');
    const detailsBox = document.getElementById('single-card-details');

    if (deckArea) deckArea.classList.add('hidden');
    if (revealArea) revealArea.classList.remove('hidden');
    setSingleActionsVisible(false);

    renderCardFront(cardFront);
    isSingleFlipped = true;
    if (cardInner) cardInner.classList.add('flipped');
    populateSingleDetails();
    if (detailsBox) detailsBox.classList.add('details-slide-active');

    if (cardInner) cardInner.focus({ preventScroll: true });

    if (updateUrl) updateURLMode('archive', cardSlug(card));
    if (announce) showToast('Previewing from the Archives. Tap "Daily Card" to return.');
}

/* ==========================================================================
   SPREAD INSIGHTS (the two tabs under the 3-card spread)
   Arcanum Wisdom  -> analyzeSpread()   in js/spreadReading.js
   Elemental Insight -> analyzeElements() in js/elements.js, markup in js/elementsView.js
   ========================================================================== */
function renderSpreadReading(drawnCards, reversedFlags, elementalAnalysis) {
    const reading = analyzeSpread(drawnCards, reversedFlags);
    if (!reading) return '<div class="spread-reading">✦ Awaiting Your Spread ✦</div>';

    return `
        <div class="spread-reading">
            <div class="elemental-header">
                ✦ <span>${escapeHTML(reading.headline)}</span> ✦
            </div>
            <ul class="spread-reading-points">
                ${reading.points.map(text => `<li>${escapeHTML(text)}</li>`).join('')}
            </ul>
            <div class="spread-reading-thread">
                <ol class="spread-reading-steps">
                    ${reading.thread.map(step => `
                        <li class="spread-reading-step">
                            <span class="spread-reading-step-pos">${escapeHTML(step.position)}</span>
                            <span class="spread-reading-step-word">${escapeHTML(step.keyword)}</span>
                            ${step.reversed ? '<span class="spread-reading-step-rev">Reversed</span>' : ''}
                        </li>
                    `).join('')}
                </ol>
            </div>
            ${renderElementalTeaser(elementalAnalysis)}
        </div>
    `;
}

/** Fills both tabs under the triple spread and reveals the container. */
function renderTripleInsights() {
    const root = document.getElementById('triple-insights-container');
    const overall = document.getElementById('triple-overall-container');
    const elemental = document.getElementById('triple-elemental-container');
    if (!root || !overall || !elemental) return;

    const elementalAnalysis = analyzeElements(tripleCards, tripleReversed);
    overall.innerHTML = renderSpreadReading(tripleCards, tripleReversed, elementalAnalysis);
    elemental.innerHTML = renderElementalReading(tripleCards, tripleReversed, elementalAnalysis);
    root.classList.remove('hidden');
}

/** Tab behaviour for the triple insights (click + arrow keys), scoped to its own container. */
function initTripleInsightTabs() {
    const root = document.getElementById('triple-insights-container');
    if (!root) return;
    const tabs = [...root.querySelectorAll('[role="tab"]')];

    const select = (tab, { focus = false } = {}) => {
        tabs.forEach(t => {
            const on = t === tab;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
            const panel = document.getElementById(t.getAttribute('aria-controls'));
            if (panel) panel.classList.toggle('active', on);
        });
        if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', event => {
            let next = null;
            if (event.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
            else if (event.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
            else if (event.key === 'Home') next = tabs[0];
            else if (event.key === 'End') next = tabs[tabs.length - 1];
            if (next) {
                event.preventDefault();
                select(next, { focus: true });
            }
        });
    });

    // Buttons inside a panel (the Wisdom teaser) can jump to another tab with data-goto-tab="<name>".
    // The listener sits on the container because the panels are re-rendered with innerHTML.
    root.addEventListener('click', event => {
        const jump = event.target.closest('[data-goto-tab]');
        if (!jump) return;
        const target = tabs.find(t => t.id === `btn-triple-tab-${jump.dataset.gotoTab}`);
        if (target) select(target, { focus: true });
    });
}
