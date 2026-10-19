/* =====================================================================
   SamuelButcher.Net — site behaviour
   Sides, section navigation, tabs, essay modal and small flourishes.
   ===================================================================== */
(function () {
    'use strict';

    const root = document.documentElement;
    const SIDES = ['attorney', 'tech', 'personal'];
    const STORAGE_KEY = 'sb-side';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    document.addEventListener('DOMContentLoaded', () => {
        initPreloader();
        initCopyright();
        initRevealOrder();
        initSides();
        initSections();
        initMobileMenu();
        initExpertise();
        initSpotlight();
        initEssayModal();
        initAnagrams();
        initMercuryAge();
        initCodeStream();
        initStarfield();
        initConsoleHeadline();
        initContactForm();
    });


    /* ---------- Helpers ---------- */

    const $ = (sel, scope = document) => scope.querySelector(sel);
    const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

    // Read a CSS time token ("300ms" / "0.3s") from :root as milliseconds
    function cssMs(name) {
        const raw = getComputedStyle(root).getPropertyValue(name).trim();
        const n = parseFloat(raw) || 0;
        return raw.endsWith('ms') ? n : n * 1000;
    }

    // localStorage can throw in private windows; never let that break the page
    function saveSide(side) {
        try { localStorage.setItem(STORAGE_KEY, side); } catch (e) { /* ignore */ }
    }

    const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));


    /* ---------- Preloader ---------- */

    function initPreloader() {
        const preloader = $('#preloader');
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            if (preloader) preloader.classList.add('is-hidden');
            root.classList.add('is-loaded');            // unlocks the reveal animations
        };
        if (document.readyState === 'complete') finish();
        else window.addEventListener('load', finish);
        setTimeout(finish, 4000);                       // never hold the page hostage to a slow asset
    }


    /* ---------- Copyright year ---------- */

    function initCopyright() {
        $$('.copyright-year').forEach((el) => { el.textContent = new Date().getFullYear(); });
    }


    /* ---------- Stagger indexes for reveal + chip animations ---------- */

    function initRevealOrder() {
        $$('.content-section').forEach((section) => {
            $$('.reveal', section).forEach((el, i) => el.style.setProperty('--i', i));
        });
        $$('.knowledges, .route').forEach((list) => {
            $$('li', list).forEach((li, i) => li.style.setProperty('--i', i));
        });
    }


    /* ---------- Sides (attorney / tech / personal) ---------- */

    const fontLoads = {};

    // Resolve once a side's fonts are ready (capped so a slow CDN never stalls the switch)
    function loadSideFonts(side) {
        if (!document.fonts || !document.fonts.load) return Promise.resolve();
        if (!fontLoads[side]) {
            const styles = getComputedStyle(root);
            const families = ['mainfont', 'displayfont', 'headingfont', 'uifont']
                .map((key) => styles.getPropertyValue(`--${side}-${key}`).trim())
                .filter(Boolean);
            const loads = [];
            families.forEach((family) => {
                ['400', '700', 'italic 400'].forEach((variant) => {
                    loads.push(document.fonts.load(`${variant} 1em ${family}`).catch(() => null));
                });
            });
            fontLoads[side] = Promise.race([Promise.all(loads), wait(800)]);
        }
        return fontLoads[side];
    }

    function initSides() {
        const controls = $$('[data-side-target]');
        const metaDescription = $('meta[name="description"]');
        const metaTheme = $('meta[name="theme-color"]');
        let busy = false;
        let queued = null;

        // Mirror the active side on every switch button and picker card
        const syncControls = (side) => {
            controls.forEach((btn) => {
                const on = btn.dataset.sideTarget === side;
                btn.setAttribute('aria-checked', String(on));
                btn.tabIndex = on ? 0 : -1;
            });
        };

        // Colours (morph via registered CSS properties)
        const applyTheme = (side) => {
            root.dataset.theme = side;
            emit('sb:theme', { side });
            if (metaTheme) metaTheme.setAttribute('content', getComputedStyle(root).getPropertyValue(`--${side}-bg`).trim());
        };

        // Fonts + copy (swapped while the page is blurred)
        const applySide = (side) => {
            root.dataset.side = side;
            if (metaDescription && metaDescription.dataset[side]) metaDescription.setAttribute('content', metaDescription.dataset[side]);
            saveSide(side);
            emit('sb:side', { side });
        };

        async function setSide(side) {
            if (!SIDES.includes(side)) return;
            if (busy) { queued = side; return; }
            if (side === root.dataset.side && side === root.dataset.theme) return;
            busy = true;
            syncControls(side);

            if (reducedMotion.matches) {
                applyTheme(side);
                applySide(side);
            } else {
                root.classList.add('switch-prep');        // promote layers a frame early
                await nextFrame();
                applyTheme(side);                         // colours start morphing now
                root.classList.add('is-switching');       // content blurs out
                await Promise.all([wait(cssMs('--switch-out')), loadSideFonts(side)]);
                applySide(side);                          // swap at peak blur
                await nextFrame();
                await nextFrame();                        // let layout settle before un-blurring
                root.classList.remove('is-switching');
                setTimeout(() => { if (!root.classList.contains('is-switching')) root.classList.remove('switch-prep'); }, cssMs('--switch-in'));
            }

            busy = false;
            if (queued && queued !== side) {
                const next = queued;
                queued = null;
                setSide(next);
            }
            queued = null;
        }

        // Clicks
        controls.forEach((btn) => btn.addEventListener('click', () => setSide(btn.dataset.sideTarget)));

        // Arrow keys move between options inside each radiogroup
        $$('[role="radiogroup"]').forEach((group) => {
            group.addEventListener('keydown', (e) => {
                const keys = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
                if (!(e.key in keys)) return;
                const buttons = $$('[data-side-target]', group);
                const index = buttons.findIndex((b) => b.getAttribute('aria-checked') === 'true');
                const next = buttons[(index + keys[e.key] + buttons.length) % buttons.length];
                e.preventDefault();
                next.focus();
                setSide(next.dataset.sideTarget);
            });
        });

        // Initial state (the inline head script may already have restored a saved side)
        const initial = SIDES.includes(root.dataset.side) ? root.dataset.side : 'attorney';
        syncControls(initial);
        applyTheme(initial);
        root.dataset.side = initial;
        if (metaDescription && metaDescription.dataset[initial]) metaDescription.setAttribute('content', metaDescription.dataset[initial]);

        // Warm every side's fonts once the page is idle so the first switch is seamless
        window.addEventListener('load', () => SIDES.forEach(loadSideFonts));
    }


    /* ---------- Section navigation (z-axis blur cross-fade) ---------- */

    function initSections() {
        // Sections may be limited to some sides (data-sides); others redirect to data-fallback
        const availableHere = (section) => !section.dataset.sides || section.dataset.sides.split(' ').includes(root.dataset.side);

        const show = (id) => {
            let target = document.getElementById(id);
            if (!target || !target.classList.contains('content-section')) return false;
            if (!availableHere(target)) {
                target = document.getElementById(target.dataset.fallback || 'home');
                id = target.id;
            }

            const current = $('.content-section.active-section');
            if (current !== target) {
                if (current) current.classList.remove('active-section');
                const wrapper = $('.content-wrapper', target);
                if (wrapper) wrapper.scrollTop = 0;
                target.classList.add('active-section');
            }

            // Active link + the divider beneath it (via .is-current on its list item)
            $$('.nav-link').forEach((link) => {
                const on = link.getAttribute('href') === `#${id}`;
                link.classList.toggle('active', on);
                const item = link.closest('.nav-item');
                if (item) item.classList.toggle('is-current', on);
            });
            if (history.replaceState) history.replaceState(null, '', `#${id}`);
            emit('sb:section', { section: target });
            return true;
        };

        // Leaving a section the new side doesn't have (e.g. Resume on Human) moves to its fallback
        document.addEventListener('sb:side', () => {
            const current = $('.content-section.active-section');
            if (current && !availableHere(current)) show(current.dataset.fallback || 'home');
        });

        // Mark the initial section's nav item
        $$('.nav-link.active').forEach((link) => { const item = link.closest('.nav-item'); if (item) item.classList.add('is-current'); });

        // Any in-page link that points at a section
        $$('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', (e) => {
                if (show(link.getAttribute('href').slice(1))) e.preventDefault();
            });
        });

        // Deep links (e.g. /#resume) open instantly; back/forward animates
        if (location.hash) {
            const sections = $$('.content-section');
            sections.forEach((s) => { s.style.transition = 'none'; });
            show(location.hash.slice(1));
            void document.body.offsetWidth;
            sections.forEach((s) => { s.style.transition = ''; });
        }
        window.addEventListener('hashchange', () => show(location.hash.slice(1)));
    }


    /* ---------- Mobile menu ---------- */

    function initMobileMenu() {
        const button = $('#hamburger-btn');
        const menu = $('#mobile-nav-dropdown');
        if (!button || !menu) return;

        const setOpen = (open) => {
            button.classList.toggle('is-open', open);
            menu.classList.toggle('is-open', open);
            button.setAttribute('aria-expanded', String(open));
        };

        button.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
        $$('.nav-link', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    }


    /* ---------- Areas of Expertise: tabs + animated metrics ---------- */

    // Count a metric label up to its value alongside the bar
    function countUp(metric) {
        const label = $('.metric-value', metric);
        const target = parseFloat(metric.style.getPropertyValue('--value')) || 0;
        if (!label) return;
        if (reducedMotion.matches) { label.textContent = `${target}%`; return; }
        const start = performance.now();
        const duration = 1200;
        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            label.textContent = `${Math.round(target * (1 - Math.pow(1 - t, 3)))}%`;
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    // Reset bars to zero without animating, then let them fill again
    function playMetrics(scope) {
        const panes = $$('.pane', scope);
        panes.forEach((pane) => {
            $$('.metric-bar', pane).forEach((bar) => { bar.style.transition = 'none'; });
            pane.classList.remove('is-shown');
        });
        void scope.offsetWidth;
        panes.forEach((pane) => $$('.metric-bar', pane).forEach((bar) => { bar.style.transition = ''; }));

        requestAnimationFrame(() => {
            panes
                .filter((pane) => pane.classList.contains('active') && pane.offsetParent !== null)
                .forEach((pane) => {
                    pane.classList.add('is-shown');
                    $$('.metric', pane).forEach(countUp);
                });
        });
    }

    function initExpertise() {
        const about = $('#about');

        $$('.expertise').forEach((group) => {
            const tabs = $$('.pillar', group);
            tabs.forEach((tab) => {
                tab.setAttribute('aria-selected', String(tab.classList.contains('active')));
                tab.addEventListener('click', () => {
                    tabs.forEach((t) => {
                        const on = t === tab;
                        t.classList.toggle('active', on);
                        t.setAttribute('aria-selected', String(on));
                    });
                    $$('.pane', group).forEach((pane) => pane.classList.toggle('active', pane.id === tab.dataset.pane));
                    playMetrics(group);
                });
            });
        });

        // Replay whenever About opens, or the side changes while it is open
        document.addEventListener('sb:section', (e) => { if (e.detail.section === about) playMetrics(about); });
        document.addEventListener('sb:side', () => { if (about && about.classList.contains('active-section')) playMetrics(about); });
        if (about && about.classList.contains('active-section')) playMetrics(about);
    }


    /* ---------- Cursor spotlight on .spot cards ---------- */

    function initSpotlight() {
        let frame = 0;
        let last = null;
        document.addEventListener('pointermove', (e) => {
            last = e;
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const card = last.target.closest && last.target.closest('.spot');
                if (!card) return;
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${last.clientX - rect.left}px`);
                card.style.setProperty('--my', `${last.clientY - rect.top}px`);
            });
        }, { passive: true });
    }


    /* ---------- Essay modal (filled from <template> by id) ---------- */

    function initEssayModal() {
        const modal = $('#essay-modal');
        if (!modal) return;
        const dialog = $('.essay-dialog', modal);
        const closeBtn = $('.essay-close', modal);
        const title = $('#essay-title');
        const kicker = $('#essay-kicker');
        const body = $('#essay-body');
        let returnFocus = null;

        const isOpen = () => modal.classList.contains('is-open');

        const open = (card) => {
            const template = document.getElementById(card.dataset.essay);
            if (!template) return;
            title.textContent = $('h4', card).textContent;
            kicker.textContent = ($('.position-kicker', card) || {}).textContent || '';
            body.replaceChildren(template.content.cloneNode(true));
            dialog.scrollTop = 0;
            returnFocus = document.activeElement;
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            dialog.focus({ preventScroll: true });
        };

        const close = () => {
            if (!isOpen()) return;
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            if (returnFocus) returnFocus.focus({ preventScroll: true });
        };

        $$('[data-essay]').forEach((card) => {
            card.addEventListener('click', () => open(card));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
            });
        });
        $$('[data-close]', modal).forEach((el) => el.addEventListener('click', close));

        document.addEventListener('keydown', (e) => {
            if (!isOpen()) return;
            if (e.key === 'Escape') close();
            if (e.key === 'Tab') {                       // keep focus inside the dialog
                e.preventDefault();
                (document.activeElement === closeBtn ? dialog : closeBtn).focus();
            }
        });
    }


    /* ---------- Name anagrams (Human side, About) ---------- */

    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = 'SamuelButcher';
            this.update = this.update.bind(this);
        }
        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => { this.resolve = resolve; });
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const start = Math.floor(Math.random() * 40);
                this.queue.push({ from: oldText[i] || '', to: newText[i] || '', start, end: start + Math.floor(Math.random() * 40) });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        update() {
            let output = '';
            let complete = 0;
            this.queue.forEach((item) => {
                if (this.frame >= item.end) {
                    complete++;
                    output += item.to;
                } else if (this.frame >= item.start) {
                    if (!item.char || Math.random() < 0.28) item.char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    output += `<span class="dud">${item.char}</span>`;
                } else {
                    output += item.from;
                }
            });
            this.el.innerHTML = output;
            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
    }

    function initAnagrams() {
        const el = $('.anatext');
        if (!el) return;
        const about = $('#about');
        const phrases = [
            'Samuel Butcher', 'Cute Brash Mule', 'Ambush Lecture',
            'Samuel Butcher', "Cherub's Amulet", 'Acute Humblers',
            'Samuel Butcher', 'Uh, Embrace Lust', 'Ambush Lecture',
            'Samuel Butcher', 'Helm SCUBA True', 'The Curable Sum'
        ];
        const fx = new TextScramble(el);
        let index = 0;

        // Only animate while the element is actually on screen
        const visible = () => !document.hidden && el.offsetParent !== null && about.classList.contains('active-section');
        const loop = () => {
            if (!visible()) { setTimeout(loop, 800); return; }
            fx.setText(phrases[index]).then(() => setTimeout(loop, 1600));
            index = (index + 1) % phrases.length;
        };
        loop();
    }


    /* ---------- Age in Mercury years (from the UNIX birth timestamp) ---------- */

    function initMercuryAge() {
        const el = $('#mercury-age');
        if (!el) return;
        const BIRTH_MS = 497452929 * 1000;
        const MERCURY_YEAR_MS = 87.969 * 86400000;
        el.textContent = Math.floor((Date.now() - BIRTH_MS) / MERCURY_YEAR_MS);
    }


    /* ---------- Technologist backdrop: a terminal printing this site's source ---------- */

    function initCodeStream() {
        const stream = $('#code-stream');
        if (!stream) return;
        const FILES = ['index.html', 'lib/css/sb.css', 'lib/js/sb.js'];
        const CHUNK = 6;                                  // characters typed per tick
        const history = document.createTextNode('');
        const typing = document.createElement('span');
        typing.className = 'is-typing';
        stream.append(history, typing);

        let lines = [];
        let printed = [];
        let lineIndex = 0;
        let charIndex = 0;
        let timer = 0;
        let maxLines = 40;

        // Fetch the site's own files; fall back to the live DOM if they can't be read (e.g. file://)
        const loadSource = async () => {
            const out = [];
            for (const file of FILES) {
                try {
                    const res = await fetch(file, { cache: 'force-cache' });
                    if (!res.ok) continue;
                    const text = await res.text();
                    out.push(`$ cat ${file}`, ...text.replace(/\t/g, '    ').split(/\r?\n/), '');
                } catch (e) { /* ignore */ }
            }
            if (!out.length) out.push('$ cat index.html', ...document.documentElement.outerHTML.split('\n'));
            return out.map((line) => (line.length > 140 ? `${line.slice(0, 137)}...` : line));
        };

        const measure = () => {
            const styles = getComputedStyle(stream);
            const lineHeight = parseFloat(styles.lineHeight) || 21;
            maxLines = Math.ceil(window.innerHeight / lineHeight) + 1;
        };

        const tick = () => {
            const line = lines[lineIndex] || '';
            charIndex = Math.min(line.length, charIndex + CHUNK);
            typing.textContent = line.slice(0, charIndex);
            if (charIndex >= line.length) {                 // line done: move it into the scrollback
                printed.push(line);
                if (printed.length > maxLines) printed = printed.slice(-maxLines);
                history.textContent = printed.join('\n') + '\n';
                lineIndex = (lineIndex + 1) % lines.length;
                charIndex = 0;
                typing.textContent = '';
            }
        };

        // Only print while the console side is showing and the tab is visible
        const update = () => {
            const shouldRun = root.dataset.theme === 'tech' && !document.hidden && !reducedMotion.matches && lines.length;
            if (shouldRun && !timer) timer = setInterval(tick, cssMs('--tech-stream-speed') || 28);
            else if (!shouldRun && timer) { clearInterval(timer); timer = 0; }
        };

        loadSource().then((source) => {
            lines = source;
            measure();
            update();
        });
        document.addEventListener('sb:theme', update);
        document.addEventListener('visibilitychange', update);
        window.addEventListener('resize', measure);
    }


    /* ---------- Human backdrop: three layers of drifting stars ---------- */

    function initStarfield() {
        const layers = { sm: $('.stars-sm'), md: $('.stars-md'), lg: $('.stars-lg') };
        if (!layers.sm) return;
        const styles = getComputedStyle(root);
        const field = parseFloat(styles.getPropertyValue('--personal-star-field')) || 2000;
        const color = styles.getPropertyValue('--personal-star-color').trim() || '#fff';
        const width = Math.max(2560, window.screen.width || 0);

        // One box-shadow per star, scattered over a width x field tile (the ::after repeats it below)
        const scatter = (count) => Array.from({ length: count }, () =>
            `${Math.round(Math.random() * width)}px ${Math.round(Math.random() * field)}px ${color}`).join(', ');

        Object.entries(layers).forEach(([size, el]) => {
            const count = parseInt(styles.getPropertyValue(`--personal-star-count-${size}`), 10) || 100;
            if (el) el.style.boxShadow = scatter(count);
        });
    }


    /* ---------- Technologist home headline types itself out ---------- */

    function initConsoleHeadline() {
        const headline = $('#home [data-only="tech"] .dynamic-headline');
        if (!headline) return;
        const textNodes = [];
        const walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) textNodes.push({ node: walker.currentNode, full: walker.currentNode.textContent });
        let timer = 0;

        const finish = () => { clearInterval(timer); textNodes.forEach((t) => { t.node.textContent = t.full; }); };

        const type = () => {
            finish();
            if (reducedMotion.matches) return;
            textNodes.forEach((t) => { t.node.textContent = ''; });
            let index = 0;
            timer = setInterval(() => {
                const current = textNodes[index];
                if (!current) { clearInterval(timer); return; }
                if (current.node.textContent.length < current.full.length) {
                    current.node.textContent = current.full.slice(0, current.node.textContent.length + 1);
                } else {
                    index++;
                }
            }, 32);
        };

        // Type on arrival at the console side, and on first load if it was saved
        document.addEventListener('sb:side', (e) => { if (e.detail.side === 'tech') type(); else finish(); });
        if (root.dataset.side === 'tech') window.addEventListener('load', type);
    }


    /* ---------- Contact form (opens the visitor's mail client) ---------- */

    function initContactForm() {
        const form = $('#contact-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const value = (id) => document.getElementById(id).value;
            const body = `Name: ${value('name')}\nEmail: ${value('email')}\n\nMessage:\n${value('message')}`;
            window.location.href = `mailto:butcher.samuel@gmail.com?subject=${encodeURIComponent(value('subject'))}&body=${encodeURIComponent(body)}`;
        });
    }
})();
