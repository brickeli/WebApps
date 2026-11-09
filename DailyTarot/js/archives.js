// js/archives.js
// The Archives page: Journal (saved readings) and Card Library (the full deck).
// URL state: ?tab=journal|library&filter=<Wands|Cups|...>&q=<search text>

import { fullTarotDeck } from './cardLibrary.js';
import { getCardSigilMarkup, animateSigilDraw } from './sigil.js';
import { iconHTML, escapeHTML, showToast, initSiteChrome } from './common.js';
import { loadHistory, removeJournalEntry, clearJournal, HISTORY_KEY } from './journal.js';

const TABS = ['journal', 'library'];
const FILTERS = ['all', 'Major Arcana', 'Minor Arcana', 'Wands', 'Cups', 'Swords', 'Pentacles'];

const state = { tab: 'journal', filter: 'all', query: '' };
let entries = [];          // journal entries as last rendered (delete checks them against storage)
let librarySearchTimer;

const $ = (id) => document.getElementById(id);

/* ---------- URL state ---------- */
function readState() {
    const p = new URLSearchParams(window.location.search);
    const tab = p.get('tab');
    const filter = p.get('filter');
    state.tab = TABS.includes(tab) ? tab : 'journal';
    state.filter = FILTERS.includes(filter) ? filter : 'all';
    state.query = (p.get('q') || '').slice(0, 80);
}

function writeState() {
    const url = new URL(window.location);
    url.searchParams.delete('mode');
    url.searchParams.set('tab', state.tab);
    if (state.filter !== 'all') url.searchParams.set('filter', state.filter); else url.searchParams.delete('filter');
    if (state.query) url.searchParams.set('q', state.query); else url.searchParams.delete('q');
    if (state.tab === 'journal') { url.searchParams.delete('filter'); url.searchParams.delete('q'); }
    if (url.toString() !== window.location.href) window.history.replaceState(null, '', url.toString());
}

/* ---------- Tabs ---------- */
function setTab(tab, { focus = false } = {}) {
    state.tab = tab;
    const isJournal = tab === 'journal';

    TABS.forEach(t => {
        const btn = $(`tab-btn-${t}`);
        const on = t === tab;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', String(on));
        btn.tabIndex = on ? 0 : -1;
        $(`archive-view-${t}`).classList.toggle('hidden', !on);
    });
    if (focus) $(`tab-btn-${tab}`).focus();

    $('archive-search-container').classList.toggle('hidden', isJournal);
    $('archives-toolbar').classList.toggle('hidden', isJournal);

    if (isJournal) $('archive-filters').classList.add('hidden');
    else if (state.filter !== 'all') setFiltersOpen(true);
    document.title = `${isJournal ? 'Journal' : 'Card Library'} - The Arcane Archives - Arcana`;

    if (isJournal) {
        renderJournal();
    } else {
        $('archive-search-input').value = state.query;
        syncFilterButtons();
        renderLibrary({ animate: true });
    }
    writeState();
}

/* ---------- Journal ---------- */
function updateCount() {
    $('tab-journal-count').textContent = entries.length;
}

function renderJournal() {
    entries = loadHistory();
    updateCount();

    const view = $('archive-view-journal');
    const footerAction = $('archive-footer-action');
    $('archives-footer-status').textContent = 'Stored in your local browser memory';
    footerAction.classList.toggle('hidden', entries.length === 0);

    if (entries.length === 0) {
        view.innerHTML = `<div class="tarot-empty-history">No readings saved yet. Consult the cards!<br><a class="archives-empty-link" href="./arcana.html">Draw today's card</a></div>`;
        return;
    }

    view.innerHTML = entries.map((item, index) => `
        <article class="tarot-history-item-card">
            <div class="tarot-history-item-top">
                <span class="tarot-history-item-type">${escapeHTML(item.type || 'Reading')}</span>
                <div class="tarot-history-item-actions">
                    <span class="tarot-history-item-date">${escapeHTML(item.date || '')}</span>
                    <button type="button" class="tarot-history-delete-btn" data-index="${index}" title="Delete entry" aria-label="Delete this reading">
                        ${iconHTML('trash')}
                    </button>
                </div>
            </div>
            <div class="tarot-history-item-cards">${escapeHTML((Array.isArray(item.cards) ? item.cards : []).join(' • '))}</div>
            ${item.headline ? `<div class="tarot-history-item-headline">✦ ${escapeHTML(item.headline)} ✦</div>` : ''}
            <p class="tarot-history-item-summary">"${escapeHTML(item.summary || '')}"</p>
        </article>
    `).join('');
}

function onJournalClick(e) {
    const btn = e.target.closest('.tarot-history-delete-btn');
    if (!btn) return;
    const index = Number(btn.dataset.index);
    const result = removeJournalEntry(index, entries[index]);
    if (result === 'failed') {
        showToast("Couldn't delete that entry: your browser is blocking storage.", 5000);
        return;
    }
    if (result === 'stale') showToast('Your journal changed in another tab, so it was refreshed.', 4000);
    renderJournal();
}

function clearAll() {
    if (entries.length > 0 && !confirm('Clear all saved readings from your journal? This cannot be undone.')) return;
    if (!clearJournal()) {
        showToast("Couldn't clear the journal: your browser is blocking storage.", 5000);
        return;
    }
    renderJournal();
    showToast('Journal cleared.');
}

/* ---------- Library ---------- */
function matchesFilter(card) {
    const f = state.filter;
    if (f === 'all') return true;
    if (f === 'Major Arcana') return card.arcana === 'Major Arcana';
    if (f === 'Minor Arcana') return card.arcana.startsWith('Minor Arcana');
    return card.arcana.includes(f);
}

function matchesQuery(card) {
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    return card.name.toLowerCase().includes(q) ||
        card.originalName.toLowerCase().includes(q) ||
        card.keywords.some(kw => kw.toLowerCase().includes(q)) ||
        card.desc.toLowerCase().includes(q);
}

function renderLibrary({ animate = false } = {}) {
    const grid = $('archive-view-library');
    const cards = fullTarotDeck.filter(c => matchesFilter(c) && matchesQuery(c));
    $('archive-footer-action').classList.add('hidden');
    $('archives-footer-status').textContent = cards.length === fullTarotDeck.length
        ? `Complete Sacred Deck Index (${cards.length} cards)`
        : `Showing ${cards.length} of ${fullTarotDeck.length} cards`;

    if (cards.length === 0) {
        grid.innerHTML = `<div class="tarot-grid-full">No arcane archetypes found matching your query.</div>`;
        return;
    }

    // Each card is a real link: it opens on the main page and Back returns here
    grid.innerHTML = cards.map(card => `
        <a href="./arcana.html?mode=archive-${encodeURIComponent(card.id)}" aria-label="${escapeHTML(card.name)} (${escapeHTML(card.originalName)})" class="tarot-library-card box-glow-gold">
            <div class="tarot-element-badge">${escapeHTML(card.element || 'spirit')}</div>
            <div class="tarot-library-card-content">
                <div class="library-card-icon-slot tarot-library-card-icon">${getCardSigilMarkup(card)}</div>
                <h4 class="tarot-library-card-title">${escapeHTML(card.name)}</h4>
                <p class="tarot-library-card-subtitle">(${escapeHTML(card.originalName)})</p>
            </div>
            <div class="tarot-library-card-footer">
                ${card.keywords.slice(0, 2).map(kw => `<span class="tarot-library-keyword-tag">${escapeHTML(kw)}</span>`).join('')}
            </div>
        </a>
    `).join('');

    if (animate) animateSigilDraw(Array.from(grid.querySelectorAll('.library-card-icon-slot')).slice(0, 12));
}

function syncFilterButtons() {
    document.querySelectorAll('.lib-filter-btn').forEach(btn => {
        const on = btn.dataset.filter === state.filter;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', String(on));
    });
}

function setFiltersOpen(open) {
    $('archive-filters').classList.toggle('hidden', !open);
    const toggle = $('filter-toggle-btn');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.classList.toggle('filters-open', open);
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
    initSiteChrome();
    readState();

    TABS.forEach(t => {
        const btn = $(`tab-btn-${t}`);
        btn.addEventListener('click', () => setTab(t));
        btn.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
            e.preventDefault();
            const i = TABS.indexOf(t);
            const next = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
            setTab(TABS[next], { focus: true });
        });
    });

    $('archive-view-journal').addEventListener('click', onJournalClick);
    $('archive-footer-action').addEventListener('click', clearAll);

    $('archive-search-input').addEventListener('input', (e) => {
        clearTimeout(librarySearchTimer);
        librarySearchTimer = setTimeout(() => {
            state.query = e.target.value;
            renderLibrary();
            writeState();
        }, 120);
    });
    $('filter-toggle-btn').addEventListener('click', () => setFiltersOpen($('archive-filters').classList.contains('hidden')));
    document.querySelectorAll('.lib-filter-btn').forEach(btn => btn.addEventListener('click', () => {
        state.filter = btn.dataset.filter;
        syncFilterButtons();
        renderLibrary();
        writeState();
    }));

    // Keep the count and list current when another tab saves or clears a reading
    window.addEventListener('storage', (e) => {
        if (e.key !== null && e.key !== HISTORY_KEY) return;
        if (state.tab === 'journal') renderJournal();
        else { entries = loadHistory(); updateCount(); }
    });
    // Coming back through the Back button can restore this page from cache
    window.addEventListener('pageshow', (e) => { if (e.persisted) setTab(state.tab); });

    entries = loadHistory();
    updateCount();
    setTab(state.tab);
});
