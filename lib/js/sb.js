        document.addEventListener('DOMContentLoaded', function() {
            const mainContent = document.querySelector('.main-content');
            const sections = document.querySelectorAll('.content-section');
            
            initializePreloader(mainContent);
            initializeCopyright();
            initializeThemeSwitcher();
            initializeNavLinks(mainContent);
            initializeScrollObserver(sections);
            initializeMobileMenu();
            initializeTextScramble();
            initializeContactForm();
            initializeQuoteSlider();
        });

        function initializePreloader(mainContent) {
            const preloader = document.getElementById('preloader');
            window.addEventListener('load', () => {
                preloader.classList.add('hidden');
                mainContent.classList.add('loaded');
            });
        }

        function initializeCopyright() {
            document.getElementById('copyright-year').textContent = new Date().getFullYear();
        }

        function initializeThemeSwitcher() {
            const themeToggles = [document.getElementById('theme-toggle'), document.getElementById('mobile-theme-toggle')];
            themeToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    document.body.classList.toggle('light-mode');
                    const isLightMode = document.body.classList.contains('light-mode');
                    themeToggles.forEach(t => {
                        t.classList.toggle('fa-sun', isLightMode);
                        t.classList.toggle('fa-moon', !isLightMode);
                    });
                });
            });
        }

        function initializeNavLinks(mainContent) {
            const desktopLinks = document.querySelectorAll('.sidebar .nav-link');
            desktopLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetSection = document.querySelector(this.getAttribute('href'));
                    if (targetSection) {
                        mainContent.scrollTo({ left: targetSection.offsetLeft, behavior: 'smooth' });
                    }
                });
            });
        }

        function initializeScrollObserver(sections) {
            const observerOptions = {
                root: window.innerWidth > 768 ? document.querySelector('.main-content') : null,
                threshold: 0.6
            };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        const allLinks = document.querySelectorAll('.nav-link');
                        allLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, observerOptions);
            sections.forEach(section => observer.observe(section));
        }

        function initializeMobileMenu() {
            const hamburgerBtn = document.getElementById('hamburger-btn');
            const mobileNav = document.getElementById('mobile-nav-dropdown');
            const mobileLinks = mobileNav.querySelectorAll('.nav-link');
            const toggleMenu = () => {
                hamburgerBtn.classList.toggle('is-open');
                mobileNav.classList.toggle('is-open');
            };
            hamburgerBtn.addEventListener('click', toggleMenu);
            mobileLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (mobileNav.classList.contains('is-open')) {
                        const targetId = link.getAttribute('href');
                        const targetSection = document.querySelector(targetId);
                        
                        document.querySelector('.content-section.active-section').classList.remove('active-section');
                        if(targetSection) {
                            targetSection.classList.add('active-section');
                        }

                        mobileLinks.forEach(l => l.classList.remove('active'));
                        link.classList.add('active');
                        
                        toggleMenu();
                    }
                });
            });
        }

        /**
         * Initializes the text scramble effect for anagrams in the About section.
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
            if(el) {
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
         * Initializes the contact form to open the user's email client on submit.
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
                    
                    const mailtoLink = `mailto:here@email.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
                    
                    window.location.href = mailtoLink;
                });
            }
        }

        /**
         * Initializes the Owl Carousel quote slider.
         */
        function initializeQuoteSlider() {
            const owl = $('.quote-slider');
            if (owl.length > 0) {
                owl.owlCarousel({
                    loop: true,
                    margin: 10,
                    nav: true,
                    navText: ["<i class='fas fa-chevron-left'></i>","<i class='fas fa-chevron-right'></i>"],
                    dots: false,
                    autoplay: true,
                    autoplayTimeout: 5000,
                    autoplayHoverPause: true,
                    animateOut: 'fadeOut',
                    animateIn: 'fadeIn',
                    items: 1,
                    onInitialized: function(event) {
                        const carousel = $(event.target);
                        carousel.find('.owl-nav .owl-prev').on('click', function() {
                            const total = carousel.find('.owl-item').length;
                            const current = carousel.find('.owl-item.active').index();
                            let randomIndex;
                            do {
                                randomIndex = Math.floor(Math.random() * total);
                            } while (randomIndex === current);
                            carousel.trigger('to.owl.carousel', [randomIndex, 300]);
                        });
                        carousel.find('.owl-nav .owl-next').on('click', function() {
                            const total = carousel.find('.owl-item').length;
                            const current = carousel.find('.owl-item.active').index();
                            let randomIndex;
                            do {
                                randomIndex = Math.floor(Math.random() * total);
                            } while (randomIndex === current);
                            carousel.trigger('to.owl.carousel', [randomIndex, 300]);
                        });
                    }
                });
            }
        }
