import { fullTarotDeck } from './js/cardLibrary.js';
import { renderAllCardBacks } from './js/theme.js';
import { escapeHTML, showToast, initSiteChrome } from './js/common.js';
import { generateSigilFromAdvice, animateSigilDraw } from './js/sigil.js';
import { addJournalEntry, SAVE_FAILED_MSG } from './js/journal.js';
import { playMysticChime } from './js/audio.js';
import { initShareButton } from './js/share.js';
import { analyzeSingleCard, renderSingleReading } from './js/singleReading.js';
import { analyzeSpread } from './js/spreadReading.js';
import { analyzeElements, analyzeElementalCard, getElementKey } from './js/elements.js';
import { renderElementalReading, renderElementalTeaser, renderSingleElementalReading } from './js/elementsView.js';
import { syncArchiveKeepsake } from './js/archivePreview.js';
import { safeGetItem, safeSetItem, safeParse, checkURLState, updateURLMode, readURLMode } from './js/storage.js';

const REVERSAL_CHANCE = 0.25;

let currentMode = 'single';
let singleDrawing = false;   // true while the draw animation runs, so extra taps can't interrupt it
let tripleCasting = false;   // same for the cast animation
let currentSingleCard = null;
let isSingleReversed = false;
let isSingleFlipped = false;
let tripleCards = [null, null, null];
let tripleReversed = [false, false, false];
let tripleFlipped = [false, false, false];
let tripleAnalysis = null;   // { elements, spread } for the spread on screen; computed once, reused by render/share/save
let browseCard = null;       // card opened from the Archives (never overwrites today's draw)

/* ==========================================================================
   0. SMALL SHARED HELPERS
   ========================================================================== */
function todayKey() {
    return new Date().toDateString();
}

/** Today's saved daily card, or null. Mirrors loadSavedTriple(). */
function loadSavedSingle() {
    if (safeGetItem('arcana_last_single_date') !== todayKey()) return null;
    const saved = safeParse(safeGetItem('arcana_saved_single_card'), null);
    if (!saved || typeof saved !== 'object') return null;
    return {
        card: fullTarotDeck.find(c => c.id === saved.id) || saved,
        reversed: safeGetItem('arcana_saved_single_reversed') === 'true'
    };
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

// Today's spread, only when it can actually be shown. The saved date alone is not enough:
// if the cards failed to save, the visitor must still be able to cast.
function loadTodaysTriple() {
    return safeGetItem('arcana_last_triple_date') === todayKey() ? loadSavedTriple() : null;
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

function recordDrawToday(drawType) {
    return safeSetItem(`arcana_last_${drawType}_date`, todayKey());
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

/** Resets a card face's element class from the card's element ('fire' | 'water' | 'air' | 'earth' | ''). */
function applyElementClass(face, elemKey) {
    face.classList.remove('element-fire', 'element-water', 'element-earth', 'element-air');
    face.classList.add('card-front', 'tarot-card-front-face', 'box-glow-gold');
    if (elemKey) face.classList.add(`element-${elemKey}`);
    face.style.background = '';
}

/** Draws the card's sigil into the face's icon slot. */
function drawSigilInto(face, card, fallbackText) {
    const adviceText = card.advice || card.meaning || fallbackText || card.name;
    const seedString = `${card.id || card.name}_${adviceText}`;
    const iconSlot = face.querySelector('.card-icon-slot');
    if (iconSlot) {
        iconSlot.innerHTML = generateSigilFromAdvice({ advice: seedString });
        animateSigilDraw(iconSlot);
    }
}

/* ==========================================================================
   1. GLOBAL SCOPE BINDING (for the inline onclick handlers still in arcana.html)
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
   2. INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    checkURLState(() => setMode('triple'));

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
    initInsightTabs('tarot-insights-container', ['tab-content-wisdom', 'tab-content-elemental']);
    initInsightTabs('triple-insights-container', ['triple-tab-overall', 'triple-tab-elemental']);
    updateNav();
    renderAllCardBacks();

    // Mode navigation (arcana.html also has inline onclick="setMode(...)" on these two; the URL update lives here)
    document.getElementById('btn-single')?.addEventListener('click', () => { setMode('single'); updateURLMode('single'); });
    document.getElementById('btn-triple')?.addEventListener('click', () => { setMode('triple'); updateURLMode('triple'); });

    // Single card draw & flip
    document.getElementById('deck-card-container')?.addEventListener('click', drawSingleCard);
    document.getElementById('btn-draw-single')?.addEventListener('click', drawSingleCard);
    document.getElementById('single-card-inner')?.addEventListener('click', flipSingleCard);

    // 3-card spread: tapping a back casts the spread; once cast, tapping toggles the reveal.
    // Decided from memory, not storage, so a blocked-storage visitor does not recast on every tap.
    for (let i = 0; i < 3; i++) {
        document.getElementById(`triple-card-inner-${i}`)?.addEventListener('click', (e) => {
            if (tripleCasting) return;
            if (!tripleCards[0]) {
                e.stopPropagation();
                drawTripleSpread();
            } else {
                flipTripleCard(i);
            }
        });
    }

    // Restore today's single draw
    const savedSingle = loadSavedSingle();
    if (savedSingle) {
        currentSingleCard = savedSingle.card;
        isSingleReversed = savedSingle.reversed;
        restoreSingleCardUI();
    }

    // Restore today's triple spread
    const savedTriple = loadTodaysTriple();
    if (savedTriple) showSavedTriple(savedTriple);

    // Share
    initShareButton(() => {
        if (currentMode === 'triple') {
            if (!tripleCards[0]) return null;
            const { elements: balance, spread: overall } = tripleAnalysis || computeTripleAnalysis();
            return {
                isTripleSpread: true,
                title: 'My 3-Card Arcana Spread',
                cards: tripleCards,
                dominantElement: balance ? balance.dominant : 'Cosmic',
                overallHeadline: overall ? overall.headline : '',
                loreBlurb: balance ? balance.lore : "A harmonious equilibrium of cosmic forces flowing through the timeline.",
                description: `Past: ${tripleCards[0].name} | Present: ${tripleCards[1].name} | Future: ${tripleCards[2].name}`
            };
        }
        if (browseCard || !currentSingleCard) return null;
        return { ...currentSingleCard, isReversed: isSingleReversed };
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

        // A card already drawn today (in memory, or saved) is shown; otherwise the deck is offered.
        if (!currentSingleCard) {
            const saved = loadSavedSingle();
            if (saved) {
                currentSingleCard = saved.card;
                isSingleReversed = saved.reversed;
            }
        }

        if (currentSingleCard) {
            restoreSingleCardUI();
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
   3. SINGLE CARD LOGIC
   ========================================================================== */
function drawSingleCard() {
    if (singleDrawing) return;

    // Already drawn today (this page, or saved by an earlier visit / another tab): show it again.
    const existing = currentSingleCard ? { card: currentSingleCard, reversed: isSingleReversed } : loadSavedSingle();
    if (existing) {
        currentSingleCard = existing.card;
        isSingleReversed = existing.reversed;
        playMysticChime();
        restoreSingleCardUI();
        return;
    }

    singleDrawing = true;
    currentSingleCard = fullTarotDeck[Math.floor(Math.random() * fullTarotDeck.length)];
    isSingleReversed = Math.random() < REVERSAL_CHANCE;
    isSingleFlipped = false;
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
            singleDrawing = false;
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

    if (detailsBox) {
        detailsBox.classList.remove('details-slide-enter');
        detailsBox.classList.add('details-slide-active');
    }
}

function renderCardFront(cardFront) {
    const card = getShownCard();
    const reversed = getShownReversed();
    if (!cardFront || !card) return;

    const elemKey = getElementKey(card);
    applyElementClass(cardFront, elemKey);

    const artRotation = reversed ? 'single-reversed' : '';

    cardFront.innerHTML = `
        <div class="tarot-single-header">
            <span>${escapeHTML(card.arcana || 'TAROT')}</span>
            <span class="tarot-element-badge badge-${elemKey}">
                ${escapeHTML(card.element || card.suit || 'Spirit')}
            </span>
        </div>

        <div class="tarot-single-body ${artRotation}">
            <div class="card-icon-slot tarot-single-icon"></div>
            <h3 class="tarot-single-title">${escapeHTML(card.name)}</h3>
            <p class="tarot-single-subtitle">(${escapeHTML(card.originalName || card.name)})</p>
        </div>

        <div class="tarot-single-footer">
            <span>ARCANA TAROT</span>
            <span>✦ ${browseCard ? 'ARCHIVE' : (reversed ? 'REVERSED' : 'UPRIGHT')}</span>
        </div>
    `;

    drawSigilInto(cardFront, card, card.desc);
}

function flipSingleCard() {
    const cardInner = document.getElementById('single-card-inner');
    if (!cardInner) return;

    // Toggle the 3D flip on the card face only. The face and the details panel are already rendered,
    // so flipping back just replays the sigil draw.
    isSingleFlipped = !isSingleFlipped;
    cardInner.classList.toggle('flipped', isSingleFlipped);

    if (isSingleFlipped) {
        const slot = document.querySelector('#single-card-front .card-icon-slot');
        if (slot) animateSigilDraw(slot);
    }
}

function populateSingleDetails() {
    const card = getShownCard();
    const reversed = getShownReversed();
    if (!card) return;

    const previewing = !!browseCard;
    const isRev = previewing ? false : reversed;

    // 1. Run the single-card and elemental engines once each
    const analysis = analyzeSingleCard(card, isRev);
    const elemAnalysis = analyzeElementalCard(card, isRev);

    // 2. Arcana tag & top title
    const titleText = (!previewing && reversed) ? `${card.name} (Reversed)` : card.name;

    const elArcana = document.getElementById('card-arcana');
    const elTitle = document.getElementById('card-title');

    if (elArcana) {
        elArcana.textContent = previewing
            ? `${card.arcana || 'TAROT'}`
            : (analysis ? analysis.tag[0]?.value : `${card.arcana || 'TAROT'} ${reversed ? '• Reversed' : '• Upright'}`);
    }
    if (elTitle) elTitle.textContent = titleText;

    // 3. Wisdom tab (renderSingleReading returns inner markup only)
    const elWisdomTab = document.getElementById('tab-content-wisdom');
    if (elWisdomTab) {
        elWisdomTab.innerHTML = renderSingleReading(card, isRev, elemAnalysis, analysis);
    }

    // 4. Standard card descriptions
    const elDesc = document.getElementById('card-desc');
    const elLight = document.getElementById('card-light');
    const elShadow = document.getElementById('card-shadow');

    if (elDesc) elDesc.textContent = card.desc || '';
    if (elLight) elLight.textContent = card.light || '';
    if (elShadow) elShadow.textContent = card.shadow || '';

    // 5. Elemental tab
    const elElementalTab = document.getElementById('tab-content-elemental');
    if (elElementalTab) {
        elElementalTab.innerHTML = renderSingleElementalReading(card, isRev, elemAnalysis, analysis?.headline);
    }

    // 6. Aspect box highlighting (Light / Shadow)
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

    // 7. Library preview swaps the reading tabs for the keepsake; a drawn card gets the tabs back
    syncArchiveKeepsake(previewing ? card : null);

    // 8. Keywords
    const kwContainer = document.getElementById('card-keywords');
    if (kwContainer && card.keywords) {
        kwContainer.innerHTML = card.keywords.map(kw =>
            `<span class="tarot-keyword-pill">${escapeHTML(kw)}</span>`
        ).join('');
    }
}

/* ==========================================================================
   4. INSIGHT TABS (single card and triple spread share one controller)
   Click + arrow keys + Home/End. panelIds lists the panels in tab order (Wisdom, Elemental).
   Buttons inside a panel can jump to another tab with data-goto-tab="wisdom|elemental";
   that listener sits on the container because the panels are re-rendered with innerHTML.
   ========================================================================== */
function initInsightTabs(rootId, panelIds) {
    const root = document.getElementById(rootId);
    if (!root) return;
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = panelIds.map(id => document.getElementById(id));
    if (tabs.length !== panels.length || panels.some(p => !p)) return;

    tabs.forEach((tab, i) => {
        tab.setAttribute('aria-controls', panelIds[i]);
        panels[i].setAttribute('role', 'tabpanel');
        panels[i].setAttribute('aria-labelledby', tab.id);
    });

    const select = (tab, { focus = false } = {}) => {
        tabs.forEach((t, i) => {
            const on = t === tab;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
            panels[i].classList.toggle('active', on);
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

    root.addEventListener('click', event => {
        const jump = event.target.closest('[data-goto-tab]');
        if (!jump) return;
        select(jump.dataset.gotoTab === 'elemental' ? tabs[1] : tabs[0], { focus: true });
    });
}

/* ==========================================================================
   5. TRIPLE CARD LOGIC
   ========================================================================== */
function computeTripleAnalysis() {
    tripleAnalysis = {
        elements: analyzeElements(tripleCards, tripleReversed),
        spread: analyzeSpread(tripleCards, tripleReversed)
    };
    return tripleAnalysis;
}

/** Puts an already-cast spread on screen (page load, or a second tap on Cast). */
function showSavedTriple({ cards, reversed }) {
    const castBtn = document.querySelector('.tarot-btn-cast-triple');
    if (castBtn) castBtn.style.display = 'none';   // only hide Cast when there is a reading to show instead

    tripleCards = cards;
    tripleReversed = reversed;
    tripleFlipped = [true, true, true];
    tripleAnalysis = null;

    document.getElementById('triple-actions')?.classList.remove('hidden');

    for (let i = 0; i < 3; i++) {
        document.getElementById(`triple-card-inner-${i}`)?.classList.add('flipped');
        renderTripleFront(document.getElementById(`triple-card-front-${i}`), tripleCards[i], tripleReversed[i]);
    }

    document.querySelector('.triple-spread-container')?.classList.add('revealed');
    renderTripleInsights();
}

function drawTripleSpread() {
    if (tripleCasting) return;

    document.getElementById('triple-card-inner-1')?.classList.remove('deck-pulse-trigger');

    // Already cast today (this page, or saved by an earlier visit / another tab): show it again.
    const existing = tripleCards[0] ? { cards: tripleCards, reversed: tripleReversed } : loadTodaysTriple();
    if (existing) {
        playMysticChime();
        showSavedTriple(existing);
        return;
    }

    tripleCasting = true;
    tripleAnalysis = null;
    const tripleDateSaved = recordDrawToday('triple');

    tripleCards = shuffle([...fullTarotDeck]).slice(0, 3);
    tripleFlipped = [false, false, false];
    tripleReversed = tripleCards.map(() => Math.random() < REVERSAL_CHANCE);

    const triplePersisted = [
        tripleDateSaved,
        safeSetItem('arcana_saved_triple_cards', JSON.stringify(tripleCards)),
        safeSetItem('arcana_saved_triple_reversed', JSON.stringify(tripleReversed))
    ].every(Boolean);
    if (!triplePersisted) warnDrawNotRemembered();

    const actionsDiv = document.getElementById('triple-actions');
    const castTripleBtn = document.querySelector('.tarot-btn-cast-triple');
    const container = document.querySelector('.triple-spread-container');

    if (actionsDiv) actionsDiv.classList.add('hidden');

    for (let i = 0; i < 3; i++) {
        document.getElementById(`triple-card-inner-${i}`)?.classList.remove('flipped');
        renderTripleFront(document.getElementById(`triple-card-front-${i}`), tripleCards[i], tripleReversed[i]);
    }

    if (container) container.classList.add('revealed');

    [250, 550, 850].forEach((delay, i) => {
        setTimeout(() => {
            document.getElementById(`triple-card-inner-${i}`)?.classList.add('flipped');
            tripleFlipped[i] = true;
        }, delay);
    });

    setTimeout(() => {
        if (actionsDiv) actionsDiv.classList.remove('hidden');
        if (castTripleBtn) castTripleBtn.style.display = 'none';   // hide Cast once the last flip finishes
        renderTripleInsights();
        tripleCasting = false;
    }, 1200);

    playMysticChime();
}

function renderTripleFront(front, card, isReversed) {
    if (!front || !card) return;

    const deckMatch = fullTarotDeck.find(d => d.id === card.id) || card;
    const elemKey = getElementKey(deckMatch) || getElementKey(card);
    applyElementClass(front, elemKey);

    const artRotation = isReversed ? 'rotate-180' : '';
    const orientationBadge = isReversed ? 'Reversed' : 'Upright';
    const badgeClass = isReversed ? 'tarot-triple-badge-reversed' : 'tarot-triple-badge-upright';
    const meaningText = isReversed ? (deckMatch.shadow || card.shadow) : (deckMatch.light || card.light);
    const infoBoxClass = isReversed ? 'tarot-triple-info-box-reversed' : 'tarot-triple-info-box-upright';
    const name = deckMatch.name || card.name;

    front.innerHTML = `
        <div class="tarot-triple-header">
            <span>${escapeHTML(deckMatch.arcana || card.arcana || 'TAROT')}</span>
            <span class="tarot-element-badge badge-${elemKey}">
                ${escapeHTML(deckMatch.element || card.element || 'Spirit')}
            </span>
        </div>
        <div class="tarot-triple-body ${artRotation}">
            <div class="card-icon-slot tarot-triple-icon"></div>
            <h4 class="tarot-triple-title">${escapeHTML(name)}</h4>
            <p class="tarot-triple-subtitle">(${escapeHTML(deckMatch.originalName || card.originalName || name)})</p>
        </div>
        <div class="${infoBoxClass}">
            <div class="tarot-triple-info-header">
                <h5 class="tarot-triple-info-title">${escapeHTML(name)}</h5>
                <span class="${badgeClass}">${orientationBadge}</span>
            </div>
            <p class="card-aspect-text">${escapeHTML(meaningText || '')}</p>
        </div>
    `;

    drawSigilInto(front, deckMatch, meaningText);
}

function flipTripleCard() {
    const container = document.querySelector('.triple-spread-container');
    if (!container) return;

    const isRevealed = container.classList.contains('revealed');
    tripleFlipped = isRevealed ? [false, false, false] : [true, true, true];

    for (let i = 0; i < 3; i++) {
        document.getElementById(`triple-card-inner-${i}`)?.classList.toggle('flipped', !isRevealed);
    }
    container.classList.toggle('revealed', !isRevealed);
}

/* ==========================================================================
   6. SAVING TO THE JOURNAL (the Journal itself lives on archives.html)
   ========================================================================== */
function todayLabel() {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function saveCurrentReading() {
    if (browseCard || !currentSingleCard) return;

    const cardDisplayName = isSingleReversed
        ? `${currentSingleCard.name} (Reversed)`
        : currentSingleCard.name;

    const entry = {
        type: 'Daily Single Card',
        date: todayLabel(),
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

    const overall = (tripleAnalysis || computeTripleAnalysis()).spread;

    const entry = {
        type: '3-Card Celestial Spread',
        date: todayLabel(),
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
    if (detailsBox) {
        detailsBox.classList.remove('details-slide-enter');
        detailsBox.classList.add('details-slide-active');
    }

    if (cardInner) cardInner.focus({ preventScroll: true });

    if (updateUrl) updateURLMode('archive', cardSlug(card));
    if (announce) showToast('Previewing from the Archives. Tap "Daily Card" to return.');
}

/* ==========================================================================
   SPREAD INSIGHTS (the two tabs under the 3-card spread)
   Arcanum Wisdom    -> analyzeSpread()   in js/spreadReading.js
   Elemental Insight -> analyzeElements() in js/elements.js, markup in js/elementsView.js
   ========================================================================== */
function renderSpreadReading(reading, elementalAnalysis) {
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

    const { elements, spread } = computeTripleAnalysis();
    overall.innerHTML = renderSpreadReading(spread, elements);
    elemental.innerHTML = renderElementalReading(tripleCards, tripleReversed, elements, spread?.headline);
    root.classList.remove('hidden');
}
