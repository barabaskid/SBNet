document.addEventListener('DOMContentLoaded', function() {
    const mainContent = document.querySelector('.main-content');
    
    // Initialize all site functions
    initializePreloader(mainContent);
    initializeSplitLanding(); // Executes the landing intercept
    initializeCopyright();
    initializeRoleToggle(); // Handles synchronization of all 3 toggles
    initializeNavLinks(); // Handles Z-Axis section swapping
    initializeMobileMenu();
    initializeTextScramble();
    initializeContactForm();
});

/**
 * 0. Split Landing Overlay Logic
 * Intercepts the user on load and forces a persona selection.
 */
function initializeSplitLanding() {
    const landing = document.getElementById('split-landing');
    const btnDefense = document.getElementById('btn-split-defense');
    const btnProsecutor = document.getElementById('btn-split-prosecutor');
    const body = document.body;
    const sidebarCheckbox = document.getElementById('sidebar-role-switch');

    if (!landing || !btnDefense || !btnProsecutor) return;

    // Check sessionStorage so the overlay doesn't fire on every page refresh
    if (sessionStorage.getItem('perspectiveSelected')) {
        landing.style.display = 'none';
        return;
    }

    const hideLanding = (isDefense) => {
        // Tag session to prevent overlay re-triggering
        sessionStorage.setItem('perspectiveSelected', 'true');
        
        // Sync the state natively by simulating a toggle click 
        // if the current body state doesn't match the selection
        if (isDefense) {
            if (!body.classList.contains('light-mode') && sidebarCheckbox) {
                sidebarCheckbox.click();
            }
        } else {
            if (body.classList.contains('light-mode') && sidebarCheckbox) {
                sidebarCheckbox.click();
            }
        }
        
        // Trigger CSS fade out
        landing.classList.add('hidden');
        
        // Physically remove from the interaction layer after transition
        setTimeout(() => {
            landing.style.display = 'none';
        }, 1200);
    };

    btnDefense.addEventListener('click', () => hideLanding(true));
    btnProsecutor.addEventListener('click', () => hideLanding(false));
}


/**
 * 1. Role Toggle Logic (Prosecutor vs. Defense)
 * synchronizes state across Home, Sidebar, and Mobile toggles.
 */
function initializeRoleToggle() {
    const body = document.body;
    
    // Select All Toggle Inputs/Elements
    const sidebarCheckbox = document.getElementById('sidebar-role-switch');
    const mobileCheckbox = document.getElementById('mobile-role-switch');
    const heroToggle = document.getElementById('hero-toggle');
    
    // Select Text Elements that need updating
    const roleStatusText = document.getElementById('role-status-text'); // Sidebar text
    
    // Function to update UI based on current body state
    const updatePersona = () => {
        const isDefense = body.classList.contains('light-mode');
        
        // Select Content Blocks
        const prosecutorContent = document.querySelectorAll('.prosecutor-content');
        const defenseContent = document.querySelectorAll('.defense-content');

        if (isDefense) {
            // --- DEFENSE MODE (Light) ---
            prosecutorContent.forEach(el => el.classList.add('d-none'));
            defenseContent.forEach(el => el.classList.remove('d-none'));
            
            if (roleStatusText) roleStatusText.textContent = "Defense";
            
            if (sidebarCheckbox) sidebarCheckbox.checked = true;
            if (mobileCheckbox) mobileCheckbox.checked = true;
            
            if (heroToggle) {
                const knob = heroToggle.querySelector('.toggle-knob');
                if (knob) knob.style.left = '30px'; 
            }

        } else {
            // --- PROSECUTOR MODE (Dark) ---
            prosecutorContent.forEach(el => el.classList.remove('d-none'));
            defenseContent.forEach(el => el.classList.add('d-none'));
            
            if (roleStatusText) roleStatusText.textContent = "Prosecution";
            
            if (sidebarCheckbox) sidebarCheckbox.checked = false;
            if (mobileCheckbox) mobileCheckbox.checked = false;

            if (heroToggle) {
                const knob = heroToggle.querySelector('.toggle-knob');
                if (knob) knob.style.left = '4px';
            }
        }
    };

    // Shared Handler for Toggle Events
    const handleToggle = () => {
        body.classList.toggle('light-mode');
        updatePersona();
    };

    // Attach Listeners to All Toggles
    if (sidebarCheckbox) sidebarCheckbox.addEventListener('change', handleToggle);
    if (mobileCheckbox) mobileCheckbox.addEventListener('change', handleToggle);
    if (heroToggle) heroToggle.addEventListener('click', handleToggle);

    // Run once on load to ensure correct initial state
    updatePersona();
}

/**
 * 2. Preloader
 */
function initializePreloader(mainContent) {
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        if (preloader) {
            preloader.classList.add('hidden');
        }
        if (mainContent) {
            mainContent.classList.add('loaded');
        }
    });
}

/**
 * 3. Dynamic Copyright Year
 */
function initializeCopyright() {
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

/**
 * 4. Navigation Links (Z-Axis Fade & Blur Transitions)
 * Replaces horizontal scroll execution with active-class toggles.
 */
function initializeNavLinks() {
    const allLinks = document.querySelectorAll('.nav-link');
    
    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                
                if (targetSection) {
                    // 1. Remove active status from current section
                    const currentActiveSection = document.querySelector('.content-section.active-section');
                    if (currentActiveSection) {
                        currentActiveSection.classList.remove('active-section');
                    }
                    
                    // 2. Add active status to target section (Triggers CSS fade & blur)
                    targetSection.classList.add('active-section');

                    // 3. Update active states on all corresponding nav links
                    allLinks.forEach(nav => nav.classList.remove('active'));
                    const targetNavs = document.querySelectorAll(`.nav-link[href="${href}"]`);
                    targetNavs.forEach(nav => nav.classList.add('active'));
                }
            }
        });
    });
}

/**
 * 5. Mobile Menu
 * Handles opening/closing the mobile navigation overlay.
 */
function initializeMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav-dropdown');
    
    if (!hamburgerBtn || !mobileNav) return;

    const mobileLinks = mobileNav.querySelectorAll('.nav-link');

    const toggleMenu = () => {
        hamburgerBtn.classList.toggle('is-open');
        mobileNav.classList.toggle('is-open');
    };

    hamburgerBtn.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Close menu when a link is clicked. 
            // Section transition is natively handled by initializeNavLinks() above.
            if (mobileNav.classList.contains('is-open')) {
                toggleMenu();
            }
        });
    });
}

/**
 * 6. Text Scramble Effect (Anagrams)
 */
function initializeTextScramble() {
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = 'SamuelButcher';
            this.update = this.update.bind(this);
        }
        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => this.resolve = resolve);
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        update() {
            let output = '';
            let complete = 0;
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.randomChar();
                        this.queue[i].char = char;
                    }
                    output += `<span class="dud">${char}</span>`;
                } else {
                    output += from;
                }
            }
            this.el.innerHTML = output;
            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
        randomChar() {
            return this.chars[Math.floor(Math.random() * this.chars.length)];
        }
    }

    const phrases = [
      'Samuel Butcher', 'Cute Brash Mule', 'Ambush Lecture',
      'Samuel Butcher', 'Cherub\'s Amulet', 'Acute Humblers',
      'Samuel Butcher', 'Uh, Embrace Lust', 'Ambush Lecture',
      'Samuel Butcher', 'Helm SCUBA True', 'The Curable Sum'
    ];

    const el = document.querySelector('.anatext');
    if (el) {
        const fx = new TextScramble(el);
        let counter = 0;
        const next = () => {
            fx.setText(phrases[counter]).then(() => {
                setTimeout(next, 1400);
            });
            counter = (counter + 1) % phrases.length;
        };
        next();
    }
}

/**
 * 7. Contact Form
 * Hijacks the form submit to open the user's email client (mailto).
 */
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Construct the mailto link
            const mailtoLink = `mailto:butcher.samuel@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
            
            window.location.href = mailtoLink;
        });
    }
}