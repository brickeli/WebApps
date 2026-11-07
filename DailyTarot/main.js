import { fullTarotDeck, ELEMENTAL_LORE } from './js/cardLibrary.js';
import { initTheme, selectTheme, toggleUtilsMenu, updateAudioUI, initThemeController, renderAllCardBacks } from './js/theme.js';
import { toggleAudio, playMysticChime } from './js/audio.js';
import { initShareButton } from './js/share.js';
import { analyzeSpread } from './js/spreadReading.js';
import { safeGetItem, safeSetItem, safeRemoveItem, safeParse, checkURLState, updateURLMode, readURLMode } from './js/storage.js';

let currentMode = 'single';
let currentSingleCard = null;
let isSingleFlipped = false;
let tripleCards = [null, null, null];
let tripleFlipped = [false, false, false];
let readingHistory = loadHistory();
let activeArchiveTab = 'journal'; // 'journal' or 'library'
let currentLibraryFilter = 'all';
let browseCard = null; // card being previewed from the Library (never overwrites today's draw)

/* ==========================================================================
   1. HANDLERS & HELPER FUNCTIONS
   ========================================================================== */
function iconHTML(name, extraClass = '') {
    return `<svg class="icon${extraClass ? ' ' + extraClass : ''}" aria-hidden="true"><use href="./assets/icons.svg#icon-${name}"></use></svg>`;
}

function handleToggleAudio() {
    const active = toggleAudio(showToast);
    updateAudioUI(active);
}

function updateHistoryBadge() {
    const tabCountEl = document.getElementById('tab-journal-count');
    if (tabCountEl) tabCountEl.textContent = readingHistory.length;
}

let toastTimer;
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const msgEl = document.getElementById('toast-msg');
    if (msgEl) msgEl.textContent = message;
    else toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ==========================================================================
   0. SMALL SHARED HELPERS
   ========================================================================== */
function loadHistory() {
    const parsed = safeParse(safeGetItem('arcana_tarot_history'), []);
    return Array.isArray(parsed) ? parsed : [];
}

function loadSavedTriple() {
    const cards = safeParse(safeGetItem('arcana_saved_triple_cards'), null);
    if (!Array.isArray(cards) || cards.length !== 3 || !cards.every(Boolean)) return null;

    const rev = safeParse(safeGetItem('arcana_saved_triple_reversed'), null);
    return {
        cards: cards.map(c => fullTarotDeck.find(d => d.id === c.id) || c),
        reversed: Array.isArray(rev) && rev.length === 3 ? rev : [false, false, false]
    };
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

// Storage can be blocked (private windows, strict settings) or full. Say so instead of pretending a save worked.
const SAVE_FAILED_MSG = "Couldn't save: your browser is blocking storage or it is full.";

function persistHistory() {
    return safeSetItem('arcana_tarot_history', JSON.stringify(readingHistory));
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
            inspectCardFromLibrary(card.id, { updateUrl: false, announce: false });
        } else {
            setMode(mode === 'triple' ? 'triple' : 'single');
        }
    });

    initCanvasFX();
    initTripleCarousel();
    initTripleInsightTabs();
    updateHistoryBadge();
    initTheme();
    initThemeController();
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
                const todayDate = new Date().toDateString();
                const lastDate = safeGetItem('arcana_last_triple_date');

                if (lastDate !== todayDate) {
                    if (i === 1 || e.detail === 0) {
                        e.stopPropagation();
                        drawTripleSpread();
                    }
                } else {
                    flipTripleCard(i);
                }
            });
        }
    }

    // Settings Dropdown
    document.getElementById('utils-menu-btn')?.addEventListener('click', (e) => toggleUtilsMenu(e));
    document.getElementById('menu-audio-btn')?.addEventListener('click', handleToggleAudio);

    // Library Search & Mobile Filters
    let librarySearchTimer;
    document.getElementById('archive-search-input')?.addEventListener('input', () => {
        clearTimeout(librarySearchTimer);
        librarySearchTimer = setTimeout(applyLibrarySearch, 120);
    });
    document.getElementById('filter-toggle-btn')?.addEventListener('click', toggleMobileFilters);
    document.getElementById('btn-archives')?.addEventListener('click', () => toggleArchivesModal(true));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleArchivesModal(false);
            return;
        }

        if (e.key === 'Tab') {
            trapTabInArchives(e);
            return;
        }

        if (e.key === 'Enter' || e.key === ' ') {
            const el = e.target;
            if (el instanceof HTMLElement && el.tagName !== 'BUTTON' && el.matches('[role="button"]')) {
                e.preventDefault();
                if (!e.repeat) el.click();
            }
        }
    });

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
        const tripleBtn = document.querySelector('.tarot-btn-cast-triple');
        if (tripleBtn) {
            tripleBtn.style.display = 'none';
        }
        const savedTriple = loadSavedTriple();
        if (savedTriple) {
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
            const balance = typeof calculateElementalBalance === 'function' ? calculateElementalBalance(tripleCards) : null;
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
            inspectCardFromLibrary(linkedCard.id, { updateUrl: false, announce: false });
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
            <span>✦ ${reversed ? 'REVERSED' : 'UPRIGHT'}</span>
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

    if (elArcana) elArcana.textContent = `${card.arcana || 'TAROT'} ${reversed ? '• Reversed' : '• Upright'}`;
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

    if (reversed) {
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
   6. HISTORY & JOURNAL SYSTEM
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

    readingHistory.unshift(entry);
    if (!persistHistory()) {
        readingHistory.shift();
        showToast(SAVE_FAILED_MSG, 5000);
        return;
    }
    updateHistoryBadge();
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

    readingHistory.unshift(entry);
    if (!persistHistory()) {
        readingHistory.shift();
        showToast(SAVE_FAILED_MSG, 5000);
        return;
    }
    updateHistoryBadge();
    showToast("3-Card Spread saved to journal!");
}

function clearHistory() {
    if (readingHistory.length > 0 && !confirm('Clear all saved readings from your journal? This cannot be undone.')) return;
    const previousHistory = readingHistory;
    readingHistory = [];
    if (!safeRemoveItem('arcana_tarot_history')) {
        readingHistory = previousHistory;
        showToast("Couldn't clear the journal: your browser is blocking storage.", 5000);
        return;
    }
    updateHistoryBadge();
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
    if (!ctx) return;

    const PARTICLE_COUNT = 50;
    const FRAME_MS = 1000 / 30;     // draw at ~30fps; the drift is slow enough that nobody can tell
    const GLOW_BLUR = 6;
    const GLOW_PAD = GLOW_BLUR * 2; // room around each dot for the glow
    const COLORS = [
        { rgb: '212, 175, 55' },   // gold
        { rgb: '226, 217, 243' }   // lavender
    ];
    const RADIUS_STEPS = 6;        // dot sizes are rounded to a few buckets so each one can be pre-rendered
    const MIN_R = 0.3, MAX_R = 2.1;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Pre-render each (color, size) glowing dot once. Per-frame shadowBlur is what made the old loop expensive.
    let sprites = null;
    function buildSprites() {
        sprites = COLORS.map(({ rgb }) => Array.from({ length: RADIUS_STEPS }, (_, step) => {
            const r = MIN_R + ((MAX_R - MIN_R) * step) / (RADIUS_STEPS - 1);
            const size = Math.ceil(r + GLOW_PAD) * 2;   // even, so the dot centre sits on a pixel boundary
            const c = document.createElement('canvas');
            c.width = c.height = size;
            const g = c.getContext('2d');
            g.shadowBlur = GLOW_BLUR;
            g.shadowColor = `rgba(${rgb}, 0.7)`;
            g.fillStyle = `rgb(${rgb})`;
            g.beginPath();
            g.arc(size / 2, size / 2, r, 0, Math.PI * 2);
            g.fill();
            return { img: c, half: size / 2 };
        }));
    }

    let particles = [];
    function seedParticles() {
        particles = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            color: Math.random() > 0.4 ? 0 : 1,
            size: Math.floor(Math.random() * RADIUS_STEPS),
            alpha: Math.random() * 0.5 + 0.15,
            speedY: -Math.random() * 0.25 - 0.05,
            speedX: Math.sin(Math.random() * Math.PI) * 0.15
        }));
    }

    function sizeCanvas() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (canvas.width === w && canvas.height === h) return;
        const sx = canvas.width ? w / canvas.width : 1;
        const sy = canvas.height ? h / canvas.height : 1;
        canvas.width = w;   // resizing also clears the canvas
        canvas.height = h;
        // keep particles in view after a resize instead of stranding them off-screen
        particles.forEach(p => { p.x *= sx; p.y *= sy; });
    }

    sizeCanvas();
    seedParticles();

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(sizeCanvas, 150);
    });

    function draw(steps) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
            p.y += p.speedY * steps;
            p.x += p.speedX * steps;

            if (p.y < 0) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            const s = sprites[p.color][p.size];
            ctx.globalAlpha = p.alpha;
            ctx.drawImage(s.img, p.x - s.half, p.y - s.half);
        }
        ctx.globalAlpha = 1;
    }

    // Run only while the tab is visible, the visitor has not asked for reduced motion, and no modal covers the page
    let rafId = 0;
    let lastTime = 0;

    function frame(now) {
        rafId = requestAnimationFrame(frame);
        const elapsed = now - lastTime;
        if (elapsed < FRAME_MS - 4) return;   // small tolerance so 60/120Hz displays land on 30fps
        lastTime = now;
        // movement is tuned per 60fps frame; scale by elapsed time and cap it after a stall
        draw(Math.min(elapsed, 100) / (1000 / 60));
    }

    function start() {
        if (rafId) return;
        if (!sprites) buildSprites();
        lastTime = performance.now();
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        if (!rafId) return;
        cancelAnimationFrame(rafId);
        rafId = 0;
    }

    const root = document.documentElement;

    function sync() {
        if (document.hidden || reducedMotion.matches || root.classList.contains('modal-open')) {
            stop();
            if (reducedMotion.matches) ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            start();
        }
    }

    document.addEventListener('visibilitychange', sync);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
    if (reducedMotion.addEventListener) {
        reducedMotion.addEventListener('change', sync);
    } else if (reducedMotion.addListener) {
        reducedMotion.addListener(sync);   // older Safari
    }
    sync();
}

/* ==========================================================================
   8. ARCHIVES
   ========================================================================== */
let lastFocusBeforeArchives = null;

function toggleArchivesModal(open) {
   const modal = document.getElementById('archives-modal');
   if (!modal) return;

   if (open) {
        if (modal.classList.contains('hidden')) lastFocusBeforeArchives = document.activeElement;
        modal.classList.remove('hidden');
        // lets the CSS and the particle canvas pause while the overlay covers them
        document.documentElement.classList.add('modal-open');
        switchArchiveTab(activeArchiveTab);
        updateHistoryBadge();

        if (!modal.contains(document.activeElement)) {
            document.getElementById(`tab-btn-${activeArchiveTab}`)?.focus();
        }
   } else {
        const wasOpen = !modal.classList.contains('hidden');
        modal.classList.add('hidden');
        document.documentElement.classList.remove('modal-open');

        if (wasOpen && lastFocusBeforeArchives && document.contains(lastFocusBeforeArchives)) {
            lastFocusBeforeArchives.focus();
        }
        if (wasOpen) lastFocusBeforeArchives = null;
   }
}

function trapTabInArchives(e) {
    const modal = document.getElementById('archives-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    const focusable = [...modal.querySelectorAll('button, input, a[href], [tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.disabled && el.getClientRects().length > 0);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!modal.contains(active)) {
        e.preventDefault();
        first.focus();
    } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
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

        renderLibraryGrid(fullTarotDeck, { animate: true });
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
                            ${iconHTML('trash')}
                        </button>
                    </div>
                </div>
                <div class="tarot-history-item-cards">${item.cards.join(' • ')}</div>
                ${item.headline ? `<div class="tarot-history-item-headline">✦ ${escapeHTML(item.headline)} ✦</div>` : ''}
                <p class="tarot-history-item-summary">"${item.summary}"</p>
            </div>
        `).join('');
    }
}

function removeJournalEntry(index) {
    if (index < 0 || index >= readingHistory.length) return;

    const [removed] = readingHistory.splice(index, 1);
    if (!persistHistory()) {
        readingHistory.splice(index, 0, removed);
        showToast("Couldn't delete that entry: your browser is blocking storage.", 5000);
        return;
    }

    renderJournalHistory();
    updateHistoryBadge();
}

const sigilMarkupCache = new Map();
function getCardSigilMarkup(card) {
    const key = card.id || card.name;
    let markup = sigilMarkupCache.get(key);
    if (!markup) {
        const adviceText = card.advice || card.meaning || card.desc || card.name;
        markup = generateSigilFromAdvice({ advice: `${key}_${adviceText}` });
        sigilMarkupCache.set(key, markup);
    }
    return markup;
}

function renderLibraryGrid(cards, { animate = false } = {}) {
    const grid = document.getElementById('archive-view-library');
    if (!grid) return;

    if (cards.length === 0) {
        grid.innerHTML = `<div class="tarot-grid-full">No arcane archetypes found matching your query.</div>`;
        return;
    }

    grid.innerHTML = cards.map(card => `
        <div role="button" tabindex="0" aria-label="${card.name} (${card.originalName})" onclick="inspectCardFromLibrary('${card.id}')" class="tarot-library-card box-glow-gold">
            <div class="tarot-element-badge">${card.element || 'spirit'}</div>
            <div class="tarot-library-card-content">
                <div class="library-card-icon-slot tarot-library-card-icon" data-card-id="${card.id}">${getCardSigilMarkup(card)}</div>
                <h4 class="tarot-library-card-title">${card.name}</h4>
                <p class="tarot-library-card-subtitle">(${card.originalName})</p>
            </div>
            <div class="tarot-library-card-footer">
                ${card.keywords.slice(0, 2).map(kw => `<span class="tarot-library-keyword-tag">${kw}</span>`).join('')}
            </div>
        </div>
    `).join('');

    if (animate) {
        animateSigilDraw(Array.from(grid.querySelectorAll('.library-card-icon-slot')).slice(0, 12));
    }
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

// updateUrl: add ?mode=archive-<card> to the address bar (off when we are responding to the URL itself)
// announce:  show the "Previewing from the Library" toast (off for deep links and Back/Forward)
function inspectCardFromLibrary(cardId, { updateUrl = true, announce = true } = {}) {
    const card = fullTarotDeck.find(c => c.id === cardId);
    if (!card) return;

    setMode('single');
    toggleArchivesModal(false);

    browseCard = card;

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
    if (announce) showToast('Previewing from the Library. Tap "Daily Card" to return.');
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

    const maxCount = Math.max(...Object.values(counts));
    const leaders = Object.keys(counts).filter(k => counts[k] === maxCount);

    let dominant, headline, lore, cssElement;
    if (leaders.length === 1) {
        dominant = leaders[0];
        headline = `${dominant} Dominant`;
        lore = ELEMENTAL_LORE[dominant] || '';
        cssElement = dominant.toLowerCase();
    } else if (leaders.length === 2) {
        dominant = leaders.join(' & ');
        headline = `${dominant} in Balance`;
        lore = leaders.map(l => ELEMENTAL_LORE[l] || '').join(' ');
        cssElement = '';
    } else {
        dominant = 'Balanced';
        headline = 'Elements in Balance';
        lore = "A harmonious equilibrium of cosmic forces flowing through the timeline.";
        cssElement = '';
    }

    return { counts, percentages, dominant, headline, lore, leaders, cssElement };
}

function renderElementalAnalyzer(drawnCards) {
    const balance = calculateElementalBalance(drawnCards);
    if (!balance) return '<div class="elemental-balance-container tarot-guidance-quote">✦ Awaiting Elemental Alignment ✦</div>';

    const { percentages, headline, lore, cssElement } = balance;
    const dominantClass = cssElement ? `element-${cssElement}` : 'element-balanced';

    const elementClassMap = {
        Fire: 'elemental-fill-fire',
        Water: 'elemental-fill-water',
        Air: 'elemental-fill-air',
        Earth: 'elemental-fill-earth'
    };

    return `
        <div class="elemental-balance-container ${dominantClass}">
            <div class="elemental-header">
                ✦ Elemental Resonance: <span>${headline}</span> ✦
            </div>
<p class="elemental-lore-blurb">${lore}</p>
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
        </div>
    `;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

function renderSpreadReading(drawnCards, reversedFlags) {
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
                        </li>
                    `).join('')}
                </ol>
            </div>
        </div>
    `;
}

/** Fills both tabs under the triple spread and reveals the container. */
function renderTripleInsights() {
    const root = document.getElementById('triple-insights-container');
    const overall = document.getElementById('triple-overall-container');
    const elemental = document.getElementById('triple-elemental-container');
    if (!root || !overall || !elemental) return;

    overall.innerHTML = renderSpreadReading(tripleCards, tripleReversed);
    elemental.innerHTML = renderElementalAnalyzer(tripleCards);
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
}

function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function generateSigilFromAdvice({ advice = '', size = 24, strokeWidth = 1.25, fillOpacity = 0.2 } = {}) {
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

function animateSigilDraw(target) {
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
