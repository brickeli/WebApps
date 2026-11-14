/**
 * Accessible behaviour layer (step 2). Put at js/ui/a11y.js.
 * Attaches to the existing markup: dialogs, menus, tooltips, input names,
 * live regions, reduced motion. Call initA11y() once per page after DOMContentLoaded.
 */
import { toggleNavMenu, isNavOpen } from './components.js';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const $ = (id) => document.getElementById(id);
const visible = (el) => !!el && el.offsetParent !== null;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. Shared dialog behaviour (help modal, particle picker) ---------- */
let openDialogEl = null;
let opener = null;

function focusables(root) {
    return [...root.querySelectorAll(FOCUSABLE)].filter(visible);
}

// Everything outside the open dialog becomes unreachable by keyboard, mouse and screen reader
function setInert(dialog, on) {
    [...document.body.children].forEach((el) => {
        if (el === dialog || el.contains(dialog) || el.id === 'element-tooltip' || el.tagName === 'SCRIPT') return;
        el.toggleAttribute('inert', on);
    });
}

function onDialogOpen(dialog) {
    openDialogEl = dialog;
    setInert(dialog, true);
    const active = document.activeElement;
    opener = visible(active) && active !== document.body ? active : $('nav-menu-btn');
    const panel = dialog.firstElementChild || dialog;
    (focusables(panel)[0] || panel).focus();
}

function onDialogClose(dialog) {
    if (openDialogEl !== dialog) return;
    openDialogEl = null;
    setInert(dialog, false);
    let target = opener;
    if (!target || !document.contains(target) || !visible(target)) {
        target = $('nav-menu-btn') || document.querySelector('main button');
    }
    opener = null;
    target?.focus();
}

function setupDialog(id) {
    const dialog = $(id);
    if (!dialog) return;
    const heading = dialog.querySelector('h3');
    if (heading && !heading.id) heading.id = `${id}-title`;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    if (heading) dialog.setAttribute('aria-labelledby', heading.id);

    let wasOpen = !dialog.classList.contains('hidden');
    new MutationObserver(() => {
        const isOpen = !dialog.classList.contains('hidden');
        if (isOpen === wasOpen) return;
        wasOpen = isOpen;
        isOpen ? onDialogOpen(dialog) : onDialogClose(dialog);
    }).observe(dialog, { attributes: true, attributeFilter: ['class'] });
}

function closeDialog(dialog) {
    // use the page's own close button so existing handlers and sounds still run
    const btn = dialog.querySelector('[id^="close-"]');
    btn ? btn.click() : dialog.classList.add('hidden');
}

/* ---------- 2. Escape + Tab trap + menu handling ---------- */
function onKeydown(e) {
    if (e.key === 'Escape') {
        if (openDialogEl) { e.preventDefault(); closeDialog(openDialogEl); return; }
        const tip = $('element-tooltip');
        if (tip && !tip.classList.contains('hidden')) tip.classList.add('hidden');
        if (isNavOpen()) { toggleNavMenu(false); $('nav-menu-btn')?.focus(); return; }
        const modeBtn = $('mode-dropdown-btn');
        if (modeBtn?.getAttribute('aria-expanded') === 'true') { modeBtn.click(); modeBtn.focus(); }
        return;
    }
    if (e.key === 'Tab' && openDialogEl) {
        const items = focusables(openDialogEl);
        if (!items.length) { e.preventDefault(); return; }
        const first = items[0], last = items[items.length - 1];
        if (!openDialogEl.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
}

function setupMenus() {
    // Settings menu: expose state, close when focus leaves it
    const btn = $('nav-menu-btn'), menu = $('nav-menu-dropdown');
    if (btn && menu) {
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-controls', 'nav-menu-dropdown');
        btn.setAttribute('aria-label', 'App settings and info');
        const sync = () => btn.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
        sync();
        new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['class'] });
        btn.parentElement.addEventListener('focusout', (e) => {
            if (isNavOpen() && e.relatedTarget && !btn.parentElement.contains(e.relatedTarget)) toggleNavMenu(false);
        });
    }
    // Mode menu: it is two links behind a button, so drop the menu roles
    const modeMenu = $('mode-dropdown-menu');
    if (modeMenu) {
        modeMenu.removeAttribute('role');
        modeMenu.querySelectorAll('[role="menuitem"]').forEach((el) => el.removeAttribute('role'));
        $('mode-dropdown-btn')?.removeAttribute('aria-haspopup');
        $('mode-dropdown-btn')?.setAttribute('aria-controls', 'mode-dropdown-menu');
        $('mode-dropdown-btn')?.parentElement.addEventListener('focusout', (e) => {
            const b = $('mode-dropdown-btn');
            if (b.getAttribute('aria-expanded') === 'true' && e.relatedTarget && !b.parentElement.contains(e.relatedTarget)) b.click();
        });
    }
}

/* ---------- 3. Focusable tooltips ---------- */
function setupTooltips() {
    const tip = $('element-tooltip');
    if (tip) tip.setAttribute('role', 'tooltip');

    const targets = '#atom-count-matrix > div, #species-cards-grid > div, #nuclear-equation-container .cursor-help, #nuclear-equation-container button.font-mono';
    const prep = (el) => {
        if (el.dataset.a11yTip) return;
        el.dataset.a11yTip = '1';
        el.tabIndex = 0;
    };
    const scan = () => document.querySelectorAll(targets).forEach(prep);

    // the existing mouseenter/mouseleave listeners already show and hide the tooltip
    document.addEventListener('focusin', (e) => {
        const el = e.target.closest?.(targets);
        if (!el) return;
        el.setAttribute('aria-describedby', 'element-tooltip');
        el.dispatchEvent(new MouseEvent('mouseenter'));
    });
    document.addEventListener('focusout', (e) => {
        const el = e.target.closest?.(targets);
        if (el) el.dispatchEvent(new MouseEvent('mouseleave'));
    });
    scan();
    new MutationObserver(scan).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
}

/* ---------- 4. Names for coefficient inputs, live regions ---------- */
function nameInputs() {
    document.querySelectorAll('#equation-container input[type="number"], #nuclear-equation-container input[type="number"]').forEach((input) => {
        const group = input.parentElement;
        const text = [...group.children].filter((c) => c !== input).map((c) => c.textContent.replace(/\s+/g, ' ').trim()).join(' ').trim();
        const name = text && !text.includes('Choose') ? text : 'this species';
        input.setAttribute('aria-label', `Coefficient for ${name}`);
        input.setAttribute('inputmode', 'numeric');
    });
}

function setupLiveRegions() {
    const banner = $('feedback-banner');
    if (banner) { banner.setAttribute('role', 'status'); banner.setAttribute('aria-live', 'polite'); banner.setAttribute('aria-atomic', 'true'); }
    const solver = $('solver-result');
    if (solver) { solver.setAttribute('role', 'status'); solver.setAttribute('aria-live', 'polite'); }
    const status = $('balance-status');
    if (status) status.setAttribute('aria-live', 'polite');
}

/* ---------- 5. Motion and first-load focus ---------- */
function setupMotion() {
    if (reducedMotion() && typeof window.confetti === 'function') window.confetti = () => null;
}

// The pages focus the first answer box shortly after each render. Skip that
// only until the person has interacted, so it stays after pressing Next.
function setupFirstLoadFocus() {
    let interacted = false;
    const mark = () => { interacted = true; };
    ['keydown', 'pointerdown', 'touchstart'].forEach((t) => document.addEventListener(t, mark, { capture: true, once: true }));
    document.addEventListener('focusin', (e) => {
        if (!interacted && e.target.matches?.('#equation-container input, #nuclear-equation-container input')) e.target.blur();
    }, true);
}

/* ---------- init ---------- */
export function initA11y() {
    setupFirstLoadFocus();
    ['help-modal', 'particle-picker-modal'].forEach(setupDialog);
    document.addEventListener('keydown', onKeydown);
    setupMenus();
    setupTooltips();
    setupLiveRegions();
    setupMotion();
    nameInputs();
    const containers = ['equation-container', 'nuclear-equation-container'].map($).filter(Boolean);
    containers.forEach((c) => new MutationObserver(nameInputs).observe(c, { childList: true, subtree: true }));
}
