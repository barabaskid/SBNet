/* =====================================================================
   SamuelButcher.Net — site behaviour
   Sides, section navigation, tabs, essay modal and small flourishes.
   ===================================================================== */
(function () {
    'use strict';

    const root = document.documentElement;
    const SIDES = ['attorney', 'tech', 'personal'];
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
        initLineRunner();
        initCodeStream();
        initNightSky();
        initTyping();
        initRabbitCarousel();
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
        const started = performance.now();
        const finishSoon = () => setTimeout(finish, Math.max(0, 700 - (performance.now() - started)));   // a short beat, so the fade is seen
        if (document.readyState === 'complete') finishSoon();
        else window.addEventListener('load', finishSoon);
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
            emit('sb:side', { side });
        };

        async function setSide(side) {
            if (!SIDES.includes(side)) return;
            if (busy) { queued = side; return; }
            if (side === root.dataset.side && side === root.dataset.theme) return;
            busy = true;

            if (document.startViewTransition) {
                // True cross-fade: a snapshot of the old side blurs + fades out over the live new side
                await loadSideFonts(side);
                const transition = document.startViewTransition(() => {
                    syncControls(side);
                    applyTheme(side);
                    applySide(side);
                });
                try { await transition.finished; } catch (e) { /* skipped: the switch still applied */ }
            } else {
                syncControls(side);
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


    /* ---------- Areas of Expertise: tabs + animated metrics ----------
       Bars grow from 0 whenever a tab is picked, and whenever the panel comes
       into view (opening About, switching side, or scrolling down to it). */

    // Grow a metric's bar and count its number up together, from the same eased value
    // every frame, so the two always match. Each side moves in its own manner.
    const METRIC_MOTION = {
        attorney: { duration: 1900, stagger: 140, ease: (t) => 1 - Math.pow(1 - t, 3) },                          // unhurried, settles softly
        tech: { duration: 1400, stagger: 110, ease: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) }, // steady load
        personal: { duration: 1700, stagger: 120, ease: (t) => 1 - Math.pow(1 - t, 4) }                          // warm ease-out
    };

    function growMetric(metric, index) {
        const label = $('.metric-value', metric);
        const bar = $('.metric-bar', metric);
        const target = parseFloat(metric.style.getPropertyValue('--value')) || 0;
        const motion = METRIC_MOTION[root.dataset.side] || METRIC_MOTION.attorney;
        const pad = root.dataset.side === 'tech' ? 2 : 1;
        cancelAnimationFrame(metric.countFrame);
        const start = performance.now() + index * motion.stagger;
        const tick = (now) => {
            const t = Math.max(0, Math.min(1, (now - start) / motion.duration));
            const value = target * motion.ease(t);
            if (bar) bar.style.transform = `scaleX(${value / 100})`;
            if (label) label.textContent = `${String(Math.round(value)).padStart(pad, '0')}%`;
            if (t < 1) metric.countFrame = requestAnimationFrame(tick);
        };
        metric.countFrame = requestAnimationFrame(tick);
    }

    // Put bars and numbers back to zero
    function resetMetrics(scope) {
        $$('.pane', scope).forEach((pane) => {
            pane.classList.remove('is-shown');
            $$('.metric', pane).forEach((metric) => {
                cancelAnimationFrame(metric.countFrame);
                const bar = $('.metric-bar', metric);
                const label = $('.metric-value', metric);
                if (bar) bar.style.transform = 'scaleX(0)';
                if (label) label.textContent = '0%';
            });
        });
    }

    // Reset, then grow the visible pane's bars and numbers
    function playMetrics(scope) {
        resetMetrics(scope);
        $$('.pane', scope)
            .filter((pane) => pane.classList.contains('active') && pane.offsetParent !== null)
            .forEach((pane) => {
                pane.classList.add('is-shown');
                $$('.metric', pane).forEach(growMetric);
            });
    }

    function initExpertise() {
        const about = $('#about');
        const groups = $$('.expertise');
        const inView = new Map();

        // A group plays once each time it becomes visible, and resets when it is hidden
        const visible = (group) => about.classList.contains('active-section') && group.offsetParent !== null && inView.get(group);
        const sync = (group) => {
            if (visible(group)) {
                if (!group.dataset.played) { group.dataset.played = '1'; playMetrics(group); }
            } else if (group.dataset.played) {
                delete group.dataset.played;
                resetMetrics(group);
            }
        };
        // After a section or side change, start again once the new view has settled in
        const replayAll = (delay) => {
            groups.forEach((group) => { delete group.dataset.played; resetMetrics(group); });
            setTimeout(() => groups.forEach(sync), delay);
        };

        groups.forEach((group) => {
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
                    group.dataset.played = '1';
                    playMetrics(group);
                });
            });
        });

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => { inView.set(entry.target, entry.isIntersecting); sync(entry.target); });
            }, { threshold: 0.35 });
            groups.forEach((group) => observer.observe(group));
        } else {
            groups.forEach((group) => inView.set(group, true));
        }

        document.addEventListener('sb:section', () => replayAll(450));
        document.addEventListener('sb:side', () => replayAll(350));
        groups.forEach(resetMetrics);
        replayAll(600);
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

        // Delegated, so the copies the Rabbit Holes carousel makes open the modal too
        document.addEventListener('click', (e) => {
            const card = e.target.closest && e.target.closest('[data-essay]');
            if (card) open(card);
        });
        document.addEventListener('keydown', (e) => {
            const card = e.target.closest && e.target.closest('[data-essay]');
            if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(card); }
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


    /* ---------- Attorney backdrop: four maroon lines, two rising, two falling ----------
       Each line keeps its direction. Every run it takes a random column (10%,
       20% … 90% of the backdrop) no other line is on, glides edge to edge, and
       re-enters almost at once, so all four are always in motion. Add or remove
       .line-runner spans in index.html to change how many. Only runs while the
       Attorney side is showing. */

    function initLineRunner() {
        const runners = $$('.line-runner').map((el) => ({
            el,
            rising: el.dataset.direction === 'up',
            column: 0,
            animation: null,
            timer: 0
        }));
        if (!runners.length) return;
        let active = false;

        const pickColumn = (runner) => {
            const taken = runners.map((r) => r.column);
            let column;
            do { column = 1 + Math.floor(Math.random() * 9); } while (taken.includes(column));
            return column;
        };

        const run = (runner, head = 0) => {
            runner.timer = 0;
            if (!active) return;
            runner.column = pickColumn(runner);
            const { el, rising } = runner;
            const height = el.parentElement.clientHeight;
            const length = el.offsetHeight;
            const top = `translateY(${-length}px)`;
            const bottom = `translateY(${height}px)`;
            const duration = (cssMs('--attorney-line-duration') || 6500) * (0.85 + Math.random() * 0.3);

            el.style.left = `${runner.column * 10}%`;
            runner.animation = el.animate(
                [{ transform: rising ? bottom : top, opacity: 1 }, { transform: rising ? top : bottom, opacity: 1 }],
                { duration, easing: getComputedStyle(root).getPropertyValue('--attorney-line-ease').trim() || 'ease-in-out' }
            );
            if (head) runner.animation.currentTime = duration * head;   // start part-way through the run
            runner.animation.onfinish = () => {
                runner.animation = null;
                runner.column = 0;
                const pause = cssMs('--attorney-line-pause') || 250;
                runner.timer = setTimeout(() => run(runner), pause * (0.5 + Math.random()));
            };
        };

        const stop = (runner) => {
            clearTimeout(runner.timer);
            runner.timer = 0;
            runner.column = 0;
            if (runner.animation) { runner.animation.cancel(); runner.animation = null; }
        };

        const update = () => {
            const shouldRun = root.dataset.theme === 'attorney' && !document.hidden;
            if (shouldRun === active) return;
            active = shouldRun;
            // All lines appear at once, each starting at a different point in its run so they're out of step
            if (active) runners.forEach((runner, i) => { runner.timer = setTimeout(() => run(runner, i / runners.length), 300); });
            else runners.forEach(stop);
        };

        document.addEventListener('sb:theme', update);
        document.addEventListener('visibilitychange', update);
        update();
    }


    /* ---------- Technologist backdrop: a terminal printing this site's source ----------
       Fetches index.html, sb.css and sb.js and types them out line by line with
       line numbers and syntax colours, a "$ cat file" prompt before each file,
       and now and then a glitching line. Only runs while the side is showing. */

    // Tiny highlighter: comments, strings, tags, attributes, keywords and numbers
    const TOKEN = new RegExp([
        String.raw`(<!--.*?(?:-->|$)|/\*.*?(?:\*/|$)|(?:^|\s)//.*$)`,                           // 1 comment
        String.raw`("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|` + '`[^`]*`)',                          // 2 string
        String.raw`(</?[a-zA-Z][\w-]*|/?>)`,                                                     // 3 tag
        String.raw`(--[\w-]+|[a-zA-Z-]+(?==)|@[\w-]+)`,                                          // 4 attribute / custom property / at-rule
        String.raw`\b(const|let|var|function|return|if|else|for|of|in|new|class|async|await|try|catch|this|true|false|null|document|window)\b`, // 5 keyword
        String.raw`(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|ms|s|rem|em|vh|vw|deg|%)?\b)`      // 6 number / colour
    ].join('|'), 'g');
    const TOKEN_CLASS = [null, 'tk-com', 'tk-str', 'tk-tag', 'tk-attr', 'tk-kw', 'tk-num'];
    const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    function highlight(line) {
        let html = '';
        let last = 0;
        line.replace(TOKEN, (match, ...args) => {
            const offset = args[6];
            const kind = args.slice(0, 6).findIndex((g) => g !== undefined) + 1;
            html += escapeHtml(line.slice(last, offset));
            html += `<span class="${TOKEN_CLASS[kind]}">${escapeHtml(match)}</span>`;
            last = offset + match.length;
            return match;
        });
        return html + escapeHtml(line.slice(last));
    }

    function initCodeStream() {
        const stream = $('#code-stream');
        if (!stream) return;
        const FILES = ['index.html', 'lib/css/sb.css', 'lib/js/sb.js'];

        let lines = [];                                   // [{ text, number, prompt }]
        let lineIndex = 0;
        let charIndex = 0;
        let current = null;                               // the line element being typed
        let timer = 0;
        let maxLines = 40;

        // Fetch the site's own files; fall back to the live DOM if they can't be read (e.g. file://)
        const loadSource = async () => {
            const out = [];
            const add = (file, text) => {
                out.push({ text: `sb@net:~$ cat ${file}`, prompt: true });
                text.replace(/\t/g, '    ').split(/\r?\n/).forEach((line, i) => {
                    out.push({ text: line.length > 160 ? `${line.slice(0, 157)}...` : line, number: i + 1 });
                });
                out.push({ text: '' });
            };
            for (const file of FILES) {
                try {
                    const res = await fetch(file, { cache: 'force-cache' });
                    if (res.ok) add(file, await res.text());
                } catch (e) { /* ignore */ }
            }
            if (!out.length) add('index.html', document.documentElement.outerHTML);
            return out;
        };

        const measure = () => {
            const lineHeight = parseFloat(getComputedStyle(stream).lineHeight) || 21;
            maxLines = Math.ceil(window.innerHeight / lineHeight) + 1;
        };

        const newLine = (line) => {
            const el = document.createElement('div');
            el.className = `cs-line is-typing${line.prompt ? ' is-prompt' : ''}`;
            el.innerHTML = `<span class="cs-ln">${line.number ? String(line.number).padStart(4, '0') : ''}</span><span class="cs-code"></span>`;
            stream.append(el);
            while (stream.children.length > maxLines) stream.firstElementChild.remove();
            return el;
        };

        const tick = () => {
            const line = lines[lineIndex];
            if (!current) { current = newLine(line); charIndex = 0; }
            const code = current.lastElementChild;
            charIndex = Math.min(line.text.length, charIndex + 2 + Math.floor(Math.random() * 7));   // bursty typing
            code.textContent = line.text.slice(0, charIndex);
            if (charIndex < line.text.length) return;

            // Line finished: colour it, now and then glitch an older line, move on
            current.classList.remove('is-typing');
            if (!line.prompt) code.innerHTML = highlight(line.text);
            if (!reducedMotion.matches && Math.random() < 0.04 && stream.children.length > 4) {
                const victim = stream.children[Math.floor(Math.random() * (stream.children.length - 1))];
                victim.classList.remove('is-glitch');
                void victim.offsetWidth;
                victim.classList.add('is-glitch');
            }
            current = null;
            lineIndex = (lineIndex + 1) % lines.length;
        };

        // Only print while the console side is showing and the tab is visible
        const update = () => {
            const shouldRun = root.dataset.theme === 'tech' && !document.hidden && lines.length;
            if (shouldRun && !timer) timer = setInterval(tick, cssMs('--tech-stream-speed') || 24);
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


    /* ---------- Human backdrop: a dramatic, slowly turning night sky ----------
       Stars are scattered over a disc centred on the pole star (off the top-right
       of the backdrop), with a dense Milky Way arc and soft nebula glow curving
       through the middle of the view. The whole sky turns around the pole, stars
       twinkle, and the brightest flare with diffraction spikes. Only runs while
       the Human side is showing. */

    function initNightSky() {
        const canvas = $('#night-sky');
        if (!canvas || !canvas.getContext) return;
        const ctx = canvas.getContext('2d');
        const TINTS = ['255,255,255', '255,255,255', '255,255,255', '200,218,255', '170,200,255', '255,236,208', '255,214,190'];
        const NEBULAE = ['120,140,255', '190,110,220', '90,180,230', '230,120,150'];
        const TAU = Math.PI * 2;
        const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;   // soft bell curve, -1..1

        let width = 0;
        let height = 0;
        let pole = { x: 0, y: 0 };
        let reach = 0;
        let band = { radius: 0, width: 0 };
        let stars = [];
        let clouds = [];
        let angle = Math.random() * TAU;
        let last = 0;
        let frame = 0;
        let built = false;

        const setting = (name, fallback) => parseFloat(getComputedStyle(root).getPropertyValue(name)) || fallback;

        const makeStar = (r, theta, inBand) => {
            const roll = Math.random();
            const bright = !inBand && roll < 0.018;
            const size = bright ? 1.6 + Math.random() * 1.4 : (inBand ? 0.4 + Math.random() * 0.8 : 0.5 + Math.pow(Math.random(), 3) * 1.5);
            return {
                r,
                theta,
                size,
                bright,
                alpha: bright ? 0.9 + Math.random() * 0.1 : (inBand ? 0.3 + Math.random() * 0.5 : 0.45 + Math.random() * 0.55),
                twinkle: Math.random() < 0.55 ? 0.3 + Math.random() * 0.55 : Math.random() * 0.15,
                speed: 0.5 + Math.random() * 2.2,                            // twinkle rate (radians per second)
                phase: Math.random() * TAU,
                rgb: TINTS[Math.floor(Math.random() * TINTS.length)]
            };
        };

        const build = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            if (!width || !height) return;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            pole = { x: width * setting('--personal-sky-pole-x', 0.82), y: height * setting('--personal-sky-pole-y', -0.08) };
            // The disc reaches the farthest corner, so turning never uncovers an empty patch
            reach = Math.max(...[[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => Math.hypot(x - pole.x, y - pole.y)));
            const field = Math.min(9000, Math.round(Math.PI * reach * reach * setting('--personal-star-density', 0.0008)));

            // The Milky Way: an arc around the pole running through the middle of the view,
            // so however far the sky has turned it always crosses the screen
            band = { radius: Math.hypot(width / 2 - pole.x, height / 2 - pole.y), width: reach * 0.13 };
            const toPolar = (along, across) => [band.radius + across, along * TAU];

            stars = Array.from({ length: field }, () => makeStar(Math.sqrt(Math.random()) * reach, Math.random() * TAU, false));
            const dense = Math.min(6000, Math.round(field * setting('--personal-milky-way', 0.55)));
            for (let i = 0; i < dense; i++) {
                const [r, theta] = toPolar(Math.random(), gauss() * band.width);
                if (r > 0 && r < reach) stars.push(makeStar(r, theta, true));
            }

            // Soft nebula clouds strung along the band
            clouds = Array.from({ length: 12 }, () => {
                const [r, theta] = toPolar(Math.random(), gauss() * band.width * 0.6);
                return { r, theta, size: band.width * (1.2 + Math.random() * 1.6), rgb: NEBULAE[Math.floor(Math.random() * NEBULAE.length)], alpha: 0.05 + Math.random() * 0.06 };
            });
            built = true;
        };

        const drawSkyGlow = () => {
            // Milky Way haze: a soft ring around the pole (the nebulae below turn with the stars)
            const inner = Math.max(0, band.radius - band.width * 1.6);
            const outer = band.radius + band.width * 1.6;
            const haze = ctx.createRadialGradient(pole.x, pole.y, inner, pole.x, pole.y, outer);
            haze.addColorStop(0, 'rgba(140,160,255,0)');
            haze.addColorStop(0.35, 'rgba(150,165,255,0.05)');
            haze.addColorStop(0.5, 'rgba(235,225,255,0.12)');
            haze.addColorStop(0.65, 'rgba(150,165,255,0.05)');
            haze.addColorStop(1, 'rgba(140,160,255,0)');
            ctx.fillStyle = haze;
            ctx.fillRect(0, 0, width, height);

            for (const c of clouds) {
                const a = c.theta + angle;
                const x = pole.x + c.r * Math.cos(a);
                const y = pole.y + c.r * Math.sin(a);
                if (x < -c.size || y < -c.size || x > width + c.size || y > height + c.size) continue;
                const glow = ctx.createRadialGradient(x, y, 0, x, y, c.size);
                glow.addColorStop(0, `rgba(${c.rgb},${c.alpha})`);
                glow.addColorStop(1, `rgba(${c.rgb},0)`);
                ctx.fillStyle = glow;
                ctx.fillRect(x - c.size, y - c.size, c.size * 2, c.size * 2);
            }
        };

        const draw = (now) => {
            const dt = last ? Math.min(now - last, 100) : 16;
            last = now;
            angle -= (dt / (cssMs('--personal-sky-turn') || 600000)) * TAU;   // anticlockwise, like the northern sky
            ctx.clearRect(0, 0, width, height);
            drawSkyGlow();

            const t = now / 1000;
            for (const s of stars) {
                const a = s.theta + angle;
                const x = pole.x + s.r * Math.cos(a);
                const y = pole.y + s.r * Math.sin(a);
                if (x < -12 || y < -12 || x > width + 12 || y > height + 12) continue;
                const shine = s.alpha * (1 - s.twinkle * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase)));
                if (s.bright) {
                    // glow, diffraction spikes, then the core
                    const halo = ctx.createRadialGradient(x, y, 0, x, y, s.size * 6);
                    halo.addColorStop(0, `rgba(${s.rgb},${(0.35 * shine).toFixed(3)})`);
                    halo.addColorStop(1, `rgba(${s.rgb},0)`);
                    ctx.fillStyle = halo;
                    ctx.fillRect(x - s.size * 6, y - s.size * 6, s.size * 12, s.size * 12);
                    const spike = s.size * (5 + 4 * shine);
                    ctx.strokeStyle = `rgba(${s.rgb},${(0.45 * shine).toFixed(3)})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(x - spike, y); ctx.lineTo(x + spike, y);
                    ctx.moveTo(x, y - spike); ctx.lineTo(x, y + spike);
                    ctx.stroke();
                    ctx.fillStyle = `rgba(255,255,255,${shine.toFixed(3)})`;
                    ctx.beginPath();
                    ctx.arc(x, y, s.size * 0.75, 0, TAU);
                    ctx.fill();
                } else {
                    ctx.fillStyle = `rgba(${s.rgb},${shine.toFixed(3)})`;
                    ctx.fillRect(x - s.size / 2, y - s.size / 2, s.size, s.size);
                }
            }

            frame = requestAnimationFrame(draw);
        };

        const update = () => {
            const shouldRun = root.dataset.theme === 'personal' && !document.hidden;
            if (shouldRun && !frame) {
                if (!built) build();
                last = 0;
                frame = requestAnimationFrame(draw);
            } else if (!shouldRun && frame) {
                cancelAnimationFrame(frame);
                frame = 0;
            }
        };

        let resizeTimer = 0;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { built = false; if (frame) build(); }, 200);
        });
        document.addEventListener('sb:theme', update);
        document.addEventListener('visibilitychange', update);
        update();
    }


    /* ---------- Futurist: text types itself out ----------
       On the Futurist side, each section's title, the home headline, the resume
       mission statement and the portrait readout ([data-type]) type out with a
       caret whenever their section opens. */

    function typeOut(el, speed) {
        if (el.typing) el.typing.finish();
        const parts = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) parts.push({ node: walker.currentNode, full: walker.currentNode.textContent });
        const total = parts.reduce((sum, part) => sum + part.full.length, 0);
        if (!total) return;

        const caret = document.createElement('span');
        caret.className = 'type-caret';
        caret.setAttribute('aria-hidden', 'true');
        el.style.minHeight = `${el.offsetHeight}px`;            // hold the space so nothing below jumps
        parts.forEach((part) => { part.node.textContent = ''; });
        el.append(caret);

        let shown = 0;
        const chunk = Math.max(1, Math.round(total / 220));    // long passages type a little faster
        const timer = setInterval(() => {
            shown = Math.min(total, shown + chunk);
            let left = shown;
            parts.forEach((part) => {
                part.node.textContent = part.full.slice(0, Math.max(0, left));
                left -= part.full.length;
            });
            if (shown >= total) finish();
        }, speed);

        function finish() {
            clearInterval(timer);
            parts.forEach((part) => { part.node.textContent = part.full; });
            caret.remove();
            el.style.minHeight = '';
            el.typing = null;
        }
        el.typing = { finish };
    }

    function initTyping() {
        const TARGETS = '.header-page h2, .dynamic-headline, [data-type]';

        const typeSection = (section) => {
            if (root.dataset.side !== 'tech' || !section) return;
            $$(TARGETS, section)
                .filter((el) => el.offsetParent !== null && !el.closest('[data-type] [data-type]'))
                .forEach((el) => typeOut(el, el.matches('h2') ? 55 : 22));
        };
        const finishAll = () => $$(TARGETS).forEach((el) => { if (el.typing) el.typing.finish(); });

        document.addEventListener('sb:section', (e) => { finishAll(); typeSection(e.detail.section); });
        document.addEventListener('sb:side', (e) => {
            finishAll();
            if (e.detail.side === 'tech') typeSection($('.content-section.active-section'));
        });
        if (root.dataset.side === 'tech') window.addEventListener('load', () => typeSection($('.content-section.active-section')));
    }


    /* ---------- Human: Rabbit Holes carousel (Owl Carousel) ----------
       Shows three at a time and turns on its own; pauses while hovered. Built the
       first time the Human side is visible (Owl can't measure hidden content). */

    function initRabbitCarousel() {
        const el = $('.rabbit-carousel');
        if (!el || !window.jQuery || !window.jQuery.fn.owlCarousel) return;
        const $carousel = window.jQuery(el);
        let built = false;

        const sync = () => {
            if (el.parentElement.offsetParent === null) return; // Human side not showing (Owl hides the carousel itself until built)
            if (built) { $carousel.trigger('refresh.owl.carousel'); return; }
            built = true;
            $carousel.owlCarousel({
                loop: true,
                margin: 24,
                autoplay: true,
                autoplayTimeout: 5000,
                autoplayHoverPause: true,
                smartSpeed: 1000,
                dots: true,
                nav: false,
                responsiveBaseElement: el.parentElement,         // breakpoints follow the card, not the window
                responsive: { 0: { items: 1 }, 560: { items: 2 }, 860: { items: 3 } }
            });
        };

        document.addEventListener('sb:side', () => setTimeout(sync, 60));
        document.addEventListener('sb:section', () => setTimeout(sync, 60));
        sync();
    }


    /* ---------- Contact form ----------
       Sends through Web3Forms (https://web3forms.com): free, no server needed,
       and works on a static host like Render. Paste your access key below.
       Until a key is set, the form opens the visitor's mail client instead. */

    const CONTACT = {
        endpoint: 'https://api.web3forms.com/submit',
        accessKey: '0e781c32-194b-448d-9fbb-0a95397b2484', // Web3Forms access key (public; only sends to you)
        to: 'butcher.samuel@gmail.com'                   // used for the mail-client fallback
    };

    function initContactForm() {
        const form = $('#contact-form');
        if (!form) return;
        const status = $('#form-status');
        const button = $('.send-btn', form);
        const value = (name) => (form.elements[name] ? form.elements[name].value.trim() : '');
        const say = (text, kind) => {
            if (!status) return;
            status.textContent = text;
            status.classList.toggle('is-success', kind === 'success');
            status.classList.toggle('is-error', kind === 'error');
        };
        const openMailClient = () => {
            const body = `Name: ${value('name')}\nEmail: ${value('email')}\n\nMessage:\n${value('message')}`;
            window.location.href = `mailto:${CONTACT.to}?subject=${encodeURIComponent(value('subject') || 'Website message')}&body=${encodeURIComponent(body)}`;
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            if (form.elements.botcheck && form.elements.botcheck.checked) return;   // a bot filled the trap

            if (!CONTACT.accessKey) {
                openMailClient();
                say('Opening your email app…');
                return;
            }

            const data = new FormData(form);
            data.append('access_key', CONTACT.accessKey);
            data.append('from_name', 'SamuelButcher.Net');
            data.set('subject', `SamuelButcher.Net: ${value('subject') || `message from ${value('name')}`}`);
            data.append('side', root.dataset.side);

            button.disabled = true;
            say('Sending…');
            try {
                const res = await fetch(CONTACT.endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
                const json = await res.json().catch(() => ({}));
                if (!res.ok || json.success === false) throw new Error(json.message || res.status);
                form.reset();
                say('Thank you. Your message is on its way.', 'success');
            } catch (err) {
                say('Sorry, that didn\'t go through. Please try again in a moment.', 'error');
            } finally {
                button.disabled = false;
            }
        });
    }
})();
