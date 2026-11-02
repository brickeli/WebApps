import { fullTarotDeck } from './js/cardLibrary.js';
import { initTheme, selectTheme, toggleUtilsMenu, updateAudioUI } from './js/theme.js';
import { toggleAudio, playMysticChime } from './js/audio.js';
import { handleTarotShare, initShareButton } from './js/share.js';

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
    if (historyCountEl) {
        historyCountEl.textContent = readingHistory.length;
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-msg');
    if (toast && msg) {
        msg.textContent = message;
        toast.classList.remove('translate-y-16', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-16', 'opacity-0');
        }, 3000);
    }
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
});

/* ==========================================================================
  3. INITIALIZATION
  ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
   initCanvasFX();
   updateHistoryBadge();
   initTheme();

   // Mode Navigation
   document.getElementById('btn-single')?.addEventListener('click', () => setMode('single'));
   document.getElementById('btn-triple')?.addEventListener('click', () => setMode('triple'));
   document.getElementById('btn-history')?.addEventListener('click', () => toggleHistoryModal(true));

   // Single Card Draw & Flip
   document.getElementById('deck-card-container')?.addEventListener('click', drawSingleCard);
   document.getElementById('btn-draw-single')?.addEventListener('click', drawSingleCard);
   document.getElementById('btn-redraw-single')?.addEventListener('click', drawSingleCard);
   document.getElementById('single-card-inner')?.addEventListener('click', flipSingleCard);

   // 3-Card Spread Draw & Flips
   document.getElementById('btn-draw-triple')?.addEventListener('click', drawTripleSpread);
   document.getElementById('triple-card-inner-0')?.addEventListener('click', () => flipTripleCard(0));
   document.getElementById('triple-card-inner-1')?.addEventListener('click', () => flipTripleCard(1));
   document.getElementById('triple-card-inner-2')?.addEventListener('click', () => flipTripleCard(2));

   // Settings Dropdown - Single listener passing event
   document.getElementById('utils-menu-btn')?.addEventListener('click', (e) => toggleUtilsMenu(e));
   document.getElementById('menu-audio-btn')?.addEventListener('click', handleToggleAudio);

   // Library Search & Mobile Filters
   document.getElementById('archive-search-input')?.addEventListener('input', applyLibrarySearch);
   document.getElementById('filter-toggle-btn')?.addEventListener('click', toggleMobileFilters); // Fixed 'sclick' typo

   // Share Results
   initShareButton(() => {
         if (currentMode === 'triple') {
             // Check if triple cards have been drawn
             if (!tripleCards || !tripleCards[0]) return null;

             const past = `${tripleCards[0].name} (${tripleReversed[0] ? 'Reversed' : 'Upright'})`;
             const present = `${tripleCards[1].name} (${tripleReversed[1] ? 'Reversed' : 'Upright'})`;
             const future = `${tripleCards[2].name} (${tripleReversed[2] ? 'Reversed' : 'Upright'})`;

             return {
                 isTripleSpread: true,
                 title: 'My 3-Card Celestial Spread',
                 description: `Past: ${past} | Present: ${present} | Future: ${future}`
             };
         } else {
             // Default to Single Card mode
             if (!currentSingleCard) return null;
             return {
                 ...currentSingleCard,
                 isReversed: isSingleReversed
             };
         }
     });
}); // Properly closes the main DOMContentLoaded block

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
        if (btnSingle) btnSingle.className = "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-cinzel text-xs sm:text-sm font-semibold transition-all border border-gold/40 bg-gold/10 text-gold shadow-md";
        if (btnTriple) btnTriple.className = "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-cinzel text-xs sm:text-sm font-semibold transition-all border border-purple-900/40 bg-velvet/40 text-starlight/70 hover:text-gold hover:border-gold/30";
        if (singleView) singleView.classList.remove('hidden');
        if (tripleView) tripleView.classList.add('hidden');
        if (titleEl) titleEl.textContent = "Consult the Sacred Arcana";
        if (descEl) descEl.textContent = "Clear your mind, focus upon your daily path, and draw from the ancient wisdom of the deck.";

        // Reset single mode deck state
        if (deckArea) {
            deckArea.classList.remove('hidden', 'card-slide-travel');
            deckArea.style.transform = '';
            deckArea.style.opacity = '';
        }
        if (revealArea) revealArea.classList.add('hidden');
        if (detailsBox) detailsBox.classList.remove('details-slide-active', 'details-slide-enter');
    } else {
        if (btnTriple) btnTriple.className = "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-cinzel text-xs sm:text-sm font-semibold transition-all border border-gold/40 bg-gold/10 text-gold shadow-md";
        if (btnSingle) btnSingle.className = "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-cinzel text-xs sm:text-sm font-semibold transition-all border border-purple-900/40 bg-velvet/40 text-starlight/70 hover:text-gold hover:border-gold/30";
        if (tripleView) tripleView.classList.remove('hidden');
        if (singleView) singleView.classList.add('hidden');
        if (titleEl) titleEl.textContent = "The Three Temporal Pillars";
        if (descEl) descEl.textContent = "Cast a spread to illuminate the foundation of your Past, the focus of your Present, and the promise of Future.";
    }
}

/* ==========================================================================
   4. SINGLE CARD LOGIC
   ========================================================================== */
const REVERSAL_CHANCE = 0.25; // 25% chance of a card pulling reversed
let isSingleReversed = false;

function drawSingleCard() {
    const randomIndex = Math.floor(Math.random() * fullTarotDeck.length);
    currentSingleCard = fullTarotDeck[randomIndex];
    isSingleFlipped = false;
    isSingleReversed = Math.random() < REVERSAL_CHANCE;

    const deckArea = document.getElementById('deck-draw-area');
    const revealArea = document.getElementById('single-reveal-area');
    const cardInner = document.getElementById('single-card-inner');
    const cardFront = document.getElementById('single-card-front');
    const detailsBox = document.getElementById('single-card-details');

    playMysticChime();

    // Check if redrawing while card detail view is already visible
    const isRedraw = revealArea && !revealArea.classList.contains('hidden');

    if (isRedraw) {
        // Redraw flow: flip card back face down, swap content, flip open again
        if (cardInner) cardInner.classList.remove('flipped');
        if (detailsBox) detailsBox.classList.remove('details-slide-active');

        setTimeout(() => {
            renderCardFront(cardFront);
            setTimeout(() => {
                if (cardInner) flipSingleCard();
                if (detailsBox) detailsBox.classList.add('details-slide-active');
            }, 200);
        }, 300);

    } else {
        // Initial draw flow from center deck
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
                if (cardInner) flipSingleCard();
            }, 100);

            setTimeout(() => {
                if (detailsBox) detailsBox.classList.add('details-slide-active');
            }, 350);

        }, 450);
    }
}

// Reusable card front renderer
function renderCardFront(cardFront) {
    if (!cardFront) return;
    const artRotation = isSingleReversed ? 'transform rotate-180' : '';
    cardFront.className = `card-front border-2 border-gold/70 bg-gradient-to-b ${currentSingleCard.color} p-4 flex flex-col justify-between box-glow-gold`;
    cardFront.innerHTML = `
        <div class="flex justify-between items-center text-[10px] font-cinzel text-gold/80 border-b border-gold/20 pb-1">
            <span>${currentSingleCard.arcana}</span>
            <span class="text-[9px] font-cinzel uppercase tracking-wider px-2 py-0.5 rounded-full border border-gold/30 bg-obsidian/60 text-gold">
                ${currentSingleCard.element}
            </span>
        </div>

        <div class="my-auto flex flex-col items-center text-center py-4 ${artRotation}">
            <i class="fa-solid ${currentSingleCard.icon} text-5xl sm:text-6xl text-gold mb-3 animate-pulse"></i>
            <h3 class="font-cinzel text-lg sm:text-xl font-bold text-ivory tracking-wide">${currentSingleCard.name}</h3>
            <p class="text-[10px] text-starlight/60 font-atkinson tracking-widest uppercase mt-1">(${currentSingleCard.originalName})</p>
        </div>

        <div class="flex justify-between items-center text-[10px] font-cinzel text-gold/70 border-t border-gold/20 pt-1">
            <span>ARCANA TAROT</span>
            <span>✦ ${isSingleReversed ? 'REVERSED' : ''}</span>
        </div>
    `;
}

function flipSingleCard() {
    const cardInner = document.getElementById('single-card-inner');
    const detailsBox = document.getElementById('single-card-details');

    isSingleFlipped = !isSingleFlipped;

    if (isSingleFlipped) {
        if (cardInner) cardInner.classList.add('flipped');

        const titleText = isSingleReversed
            ? `${currentSingleCard.name} (Reversed)`
            : currentSingleCard.name;

        const elArcana = document.getElementById('card-arcana');
        const elTitle = document.getElementById('card-title');
        const elDesc = document.getElementById('card-desc');
        const elLight = document.getElementById('card-light');
        const elShadow = document.getElementById('card-shadow');
        const elAdvice = document.getElementById('card-advice');

        if (elArcana) elArcana.textContent = `${currentSingleCard.arcana} ${isSingleReversed ? '• Reversed' : '• Upright'}`;
        if (elTitle) elTitle.textContent = titleText;
        if (elDesc) elDesc.textContent = currentSingleCard.desc;
        if (elLight) elLight.textContent = currentSingleCard.light;
        if (elShadow) elShadow.textContent = currentSingleCard.shadow;
        if (elAdvice) elAdvice.textContent = `"${currentSingleCard.advice}"`;

        const lightBox = elLight ? elLight.closest('div') : null;
        const shadowBox = elShadow ? elShadow.closest('div') : null;

        if (isSingleReversed) {
            if (lightBox) {
                lightBox.className = "bg-velvet/20 border border-starlight/10 p-3 rounded-lg transition-all duration-300 opacity-30 grayscale-[40%]";
            }
            if (shadowBox) {
                shadowBox.className = "bg-rose-950/40 border-2 border-rose-500/70 p-3 rounded-lg transition-all duration-300 opacity-100 shadow-md shadow-rose-950/50";
            }
        } else {
            if (lightBox) {
                lightBox.className = "bg-emerald-950/40 border-2 border-emerald-500/70 p-3 rounded-lg transition-all duration-300 opacity-100 shadow-md shadow-emerald-950/50";
            }
            if (shadowBox) {
                shadowBox.className = "bg-velvet/20 border border-starlight/10 p-3 rounded-lg transition-all duration-300 opacity-30 grayscale-[40%]";
            }
        }

        const kwContainer = document.getElementById('card-keywords');
        if (kwContainer) {
            kwContainer.innerHTML = currentSingleCard.keywords.map(kw =>
                `<span class="px-2.5 py-1 rounded-md bg-plum/60 border border-gold/30">${kw}</span>`
            ).join('');
        }

        setTimeout(() => {
            if (detailsBox) detailsBox.classList.remove('opacity-0', 'translate-y-4');
        }, 400);
    } else {
        if (cardInner) cardInner.classList.remove('flipped');
        if (detailsBox) detailsBox.classList.add('opacity-0', 'translate-y-4');
    }
}

/* ==========================================================================
   5. TRIPLE CARD LOGIC
   ========================================================================== */
let tripleReversed = [false, false, false];

function drawTripleSpread() {
    const shuffled = [...fullTarotDeck].sort(() => 0.5 - Math.random());
    tripleCards = shuffled.slice(0, 3);
    tripleFlipped = [false, false, false];

    tripleReversed = [
        Math.random() < REVERSAL_CHANCE,
        Math.random() < REVERSAL_CHANCE,
        Math.random() < REVERSAL_CHANCE
    ];

    const actionsDiv = document.getElementById('triple-actions');
    if (actionsDiv) actionsDiv.classList.add('hidden');

    for (let i = 0; i < 3; i++) {
        const inner = document.getElementById(`triple-card-inner-${i}`);
        const front = document.getElementById(`triple-card-front-${i}`);

        if (inner) inner.classList.remove('flipped');

        const card = tripleCards[i];
        const isReversed = tripleReversed[i];

        const artRotation = isReversed ? 'transform rotate-180' : '';
        const orientationBadge = isReversed ? 'Reversed' : 'Upright';
        const badgeAccent = isReversed ? 'text-rose-400' : 'text-emerald-400';
        const meaningText = isReversed ? card.shadow : card.light;

        const infoBorderStyle = isReversed
            ? 'border border-rose-500/60 bg-rose-950/60 shadow-md shadow-rose-950/50'
            : 'border border-emerald-500/60 bg-emerald-950/60 shadow-md shadow-emerald-950/50';

        if (front) {
            front.className = `card-front border-2 border-gold/70 bg-gradient-to-b ${card.color} p-3 flex flex-col justify-between overflow-hidden box-glow-gold`;
            front.innerHTML = `
                <div class="flex justify-between items-center text-[10px] font-cinzel text-gold/80 border-b border-gold/20 pb-1">
                    <span>${card.arcana}</span>
                    <span class="text-[9px] font-cinzel uppercase tracking-wider px-2 py-0.5 rounded-full border border-gold/30 bg-obsidian/60 text-gold">
                        ${card.element}
                    </span>
                </div>

                <div class="my-auto flex flex-col items-center text-center py-2 transition-transform duration-500 ${artRotation}">
                    <i class="fa-solid ${card.icon} text-4xl text-gold mb-1.5 animate-pulse"></i>
                    <h4 class="font-cinzel text-sm font-bold text-ivory tracking-wide">${card.name}</h4>
                    <p class="text-[9px] text-starlight/60 font-atkinson tracking-widest uppercase">(${card.originalName})</p>
                </div>

                <div class="p-2.5 rounded-lg text-left transition-all duration-300 w-full mt-auto ${infoBorderStyle}">
                    <div class="flex justify-between items-center border-b border-gold/20 pb-1 mb-1">
                        <h5 class="font-cinzel font-bold text-gold text-[11px]">${card.name}</h5>
                        <span class="text-[8px] font-cinzel ${badgeAccent} font-semibold uppercase tracking-wider">${orientationBadge}</span>
                    </div>
                    <p class="text-[13px] text-starlight/90 leading-snug font-sans max-h-24 overflow-y-auto custom-scrollbar">${meaningText}</p>
                </div>
            `;
        }
    }

    setTimeout(() => flipTripleCard(0), 300);
    setTimeout(() => flipTripleCard(1), 700);
    setTimeout(() => flipTripleCard(2), 1100);

    setTimeout(() => {
        if (actionsDiv) actionsDiv.classList.remove('hidden');
    }, 1500);

    playMysticChime();
}

function flipTripleCard(index) {
    const inner = document.getElementById(`triple-card-inner-${index}`);
    if (!inner) return;

    tripleFlipped[index] = !tripleFlipped[index];

    if (tripleFlipped[index]) {
        inner.classList.add('flipped');
    } else {
        inner.classList.remove('flipped');
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

function toggleHistoryModal(show) {
    const modal = document.getElementById('history-modal');
    const list = document.getElementById('history-list');

    if (!modal || !list) return;

    if (show) {
        if (readingHistory.length === 0) {
            list.innerHTML = `<div class="text-center text-starlight/40 py-8 font-cinzel text-sm">No readings saved yet. Consult the cards!</div>`;
        } else {
            list.innerHTML = readingHistory.map((item) => `
                <div class="bg-velvet/50 border border-gold/20 rounded-xl p-3.5 flex flex-col gap-1.5">
                    <div class="flex justify-between items-center">
                        <span class="font-cinzel text-xs text-gold font-bold">${item.type}</span>
                        <span class="text-[10px] text-starlight/50">${item.date}</span>
                    </div>
                    <div class="text-xs text-ivory font-cinzel">${item.cards.join(' • ')}</div>
                    <p class="text-xs text-starlight/70 italic">"${item.summary}"</p>
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
   Archives
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
        if (btnJournal) btnJournal.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-cinzel text-xs font-semibold transition-all bg-gold/15 text-gold border border-gold/30 shadow";
        if (btnLibrary) btnLibrary.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-cinzel text-xs font-semibold transition-all text-starlight/70 hover:text-gold";

        if (viewJournal) viewJournal.classList.remove('hidden');
        if (viewLibrary) viewLibrary.classList.add('hidden');
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

        renderHistoryList();
    } else {
        if (btnLibrary) btnLibrary.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-cinzel text-xs font-semibold transition-all bg-gold/15 text-gold border border-gold/30 shadow";
        if (btnJournal) btnJournal.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-cinzel text-xs font-semibold transition-all text-starlight/70 hover:text-gold";

        if (viewLibrary) viewLibrary.classList.remove('hidden');
        if (viewJournal) viewJournal.classList.add('hidden');
        if (searchContainer) searchContainer.classList.remove('hidden');

        // Keep filters hidden by default when switching to library tab
        if (filterContainer) {
            filterContainer.classList.add('hidden');
            filterContainer.classList.remove('flex');
            filterContainer.style.display = ''; // Clear any inline style overrides
        }

        if (footerStatus) footerStatus.textContent = "Complete Sacred Deck Index";
        if (footerAction) footerAction.style.display = "none";

        renderLibraryGrid(fullTarotDeck);
        document.getElementById('archive-search-input')?.focus();
    }
}

function renderLibraryGrid(cards) {
    const grid = document.getElementById('archive-view-library');
    if (!grid) return;

    if (cards.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-starlight/60 font-cinzel">No arcane archetypes found matching your query.</div>`;
        return;
    }

    grid.innerHTML = cards.map(card => `
        <div onclick="inspectCardFromLibrary('${card.id}')" class="group bg-velvet/50 border border-gold/20 hover:border-gold/60 rounded-xl p-3.5 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-105 box-glow-gold relative overflow-hidden min-h-[150px]">
            <div class="absolute top-2 left-2 text-[8px] font-cinzel text-gold/60 uppercase tracking-widest">${card.element || 'spirit'}</div>
            <div class="my-auto py-1 flex flex-col items-center">
                <i class="fa-solid ${card.icon} text-2xl sm:text-3xl text-gold mb-2 group-hover:scale-110 transition-transform"></i>
                <h4 class="font-cinzel text-xs sm:text-sm font-bold text-ivory tracking-wide line-clamp-1">${card.name}</h4>
                <p class="text-[9px] text-starlight/60 font-cinzel uppercase mt-0.5">(${card.originalName})</p>
            </div>
            <div class="w-full border-t border-gold/10 pt-2 mt-auto flex flex-wrap gap-1 justify-center">
                ${card.keywords.slice(0, 2).map(kw => `<span class="text-[9px] font-atkinson bg-gold/10 text-gold px-1.5 py-0.5 rounded">${kw}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function filterLibrary(filterType) {
    currentLibraryFilter = filterType;

    // Toggle active state cleanly using CSS classes
    document.querySelectorAll('.lib-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

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
                // Matches specific suit (e.g., "Wands", "Cups", "Swords", "Pentacles")
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
           `<span class="px-2 py-0.5 rounded bg-gold/10 border border-gold/30 text-gold">${kw}</span>`
       ).join('');
   }
}

function toggleMobileFilters() {
    const filtersContainer = document.getElementById('archive-filters');
    const toggleBtn = document.getElementById('filter-toggle-btn');
    if (!filtersContainer) return;

    // Toggle hidden/flex classes on mobile
    if (filtersContainer.classList.contains('hidden')) {
        filtersContainer.classList.remove('hidden');
        filtersContainer.classList.add('flex');
        if (toggleBtn) toggleBtn.classList.add('border-gold', 'bg-gold/10');
    } else {
        filtersContainer.classList.add('hidden');
        filtersContainer.classList.remove('flex');
        if (toggleBtn) toggleBtn.classList.remove('border-gold', 'bg-gold/10');
    }
}
