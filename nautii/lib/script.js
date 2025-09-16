// --- 1. Global Variables & Initial Setup --- //
let playerDesktop, audioMobile;
const isMobile = () => $(window).width() < 992;
let navTimeout; // Make navTimeout globally accessible within the script

// --- 2. Page Load Logic --- //
$(window).on("load", function() {
    // Fade out preloader
    $('body').addClass('loaded');
    $(".preloader").addClass('fade-out');

    // --- 4. Sticky Music Player Bar --- //
    // This logic depends on the final height of the slider, so it runs on window.load
    if (!isMobile()) {
        const musicBar = $('.music-player-bar');
        const sliderHeight = $('#home-slider').outerHeight();
        
        $(window).on('scroll', function() {
            if ($(window).scrollTop() >= sliderHeight - musicBar.outerHeight()) {
                musicBar.addClass('sticky-top');
            } else {
                musicBar.removeClass('sticky-top');
            }
        });
    }

    // --- 12. Swiper Slider Initialization --- //
    // This must run on window.load to ensure all elements have correct dimensions
    new Swiper('#home-slider', {
        loop: true,
        effect: 'fade',
        keyboard: {
            enabled: true,
        },
        navigation: {
            nextEl: '#home-slider .swiper-button-next',
            prevEl: '#home-slider .swiper-button-prev',
        },
        autoplay: {
            delay: 6000,
            disableOnInteraction: false, // Allows autoplay to restart after manual navigation
            pauseOnMouseEnter: true,   // Pauses autoplay on hover
        },
    });
});


$(document).ready(function() {

    // --- 3. Desktop Navigation Hover Effect --- //
    $('.navigation-wrapper').on('mouseenter', function() {
        clearTimeout(navTimeout);
        $('body').addClass('navHover');
    }).on('mouseleave', function() {
        navTimeout = setTimeout(function() {
            $('body').removeClass('navHover');
        }, 250);
    });

    // --- 5. Gallery Item Overlay --- //
    $('.gallery-item a').each(function() {
        const captionText = $(this).data('caption') || "View Image";
        const overlayHtml = `
            <div class="gallery-overlay">
                <div class="gallery-border"></div>
                <div class="gallery-content">
                    <h5>${captionText}</h5>
                    <i class="fas fa-expand-alt"></i>
                </div>
            </div>
        `;
        $(this).append(overlayHtml);
    });

    // --- 6. Dynamic Scroll Animations --- //
    $('[data-animate-left], [data-animate-right]').each(function() {
        if(isMobile()) {
            $(this).addClass('fade-in-on-scroll');
        } else {
            if ($(this).is('[data-animate-left]')) {
                $(this).addClass('fade-in-from-left');
            } else {
                $(this).addClass('fade-in-from-right');
            }
        }
    });

    $('.gallery-item').each(function(index) {
        if (isMobile()) {
            $(this).addClass('fade-in-on-scroll');
        } else {
            if (index % 3 === 0) $(this).addClass('fade-in-from-left');
            else if (index % 3 === 1) $(this).addClass('fade-in-on-scroll');
            else $(this).addClass('fade-in-from-right');
        }
    });

    $('.merch-item').each(function(index) {
        if (isMobile()) {
            $(this).addClass('fade-in-on-scroll');
        } else {
            if (index % 2 === 0) $(this).addClass('fade-in-from-left');
            else $(this).addClass('fade-in-from-right');
        }
    });

    // --- 7. Navigation & Smooth Scrolling --- //
    const mobileMenu = document.getElementById('navbarContent');
    const bsMobileMenu = new bootstrap.Collapse(mobileMenu, { toggle: false });
    const mobileNavToggler = document.querySelector("#mobile-header .navbar-toggler");

    if (mobileMenu) {
        mobileMenu.addEventListener('show.bs.collapse', () => mobileNavToggler.classList.add('active'));
        mobileMenu.addEventListener('hide.bs.collapse', () => mobileNavToggler.classList.remove('active'));
    }

    $("#desktopNav a, #navbarContent .nav-link, .navbar-brand[href=\"#home\"]").on("click", function(event) {
        event.preventDefault();
        const targetId = this.getAttribute("href");
        const targetElement = $(targetId);
        
        if (targetId === '#home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (targetElement.length) {
            let headerOffset = isMobile() ? ($('#mobile-header').outerHeight() || 60) : ($('.music-player-bar').outerHeight() || 60);
            const scrollPosition = targetElement.offset().top - headerOffset;
            window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
        }
        
        clearTimeout(navTimeout);
        if (isMobile() && mobileMenu.classList.contains('show')) {
           bsMobileMenu.hide();
        }
        if (!isMobile()) {
            $('body').removeClass('navHover');
        }
    });

    // --- 8. Music Player Logic (Plyr) --- //
    const songToastEl = document.getElementById('song-toast');
    const songToast = new bootstrap.Toast(songToastEl);
    const toastSongInfo = document.getElementById('toast-song-info');
    let firstPlay = true;
    
    const playlist = [{
        title: "Febreeze",
        artist: "nautii",
        src: "../nautii/lib/NAUTII-Febreze.mp3"
    }, {
        title: "The Signal",
        artist: "nautii",
        src: "../nautii/lib/NAUTII-The Signal.mp3"
    }];
    let currentTrackIndex = 0;
    
    audioMobile = document.getElementById("audio-player-mobile");
    playerDesktop = new Plyr("#audio-player-desktop");

    function loadTrack(index) {
        const track = playlist[index];
        playerDesktop.source = {
            type: "audio",
            sources: [{ src: track.src, type: "audio/mp3" }]
        };
        if(audioMobile) {
            audioMobile.src = track.src;
            audioMobile.load();
        }
    }

    function playNextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        playerDesktop.play();
        if (audioMobile) audioMobile.play();
    }

    function updateSongToast(track) {
        if(firstPlay) return;
        toastSongInfo.innerHTML = `<strong>${track.title}</strong> by ${track.artist}`;
        songToast.show();
    }

    function handleFirstPlay() {
        if(firstPlay) {
            firstPlay = false;
            updateSongToast(playlist[currentTrackIndex]);
        }
    }

    if (playerDesktop) {
        playerDesktop.on("play", () => {
            handleFirstPlay();
            updateSongToast(playlist[currentTrackIndex]);
        });
        playerDesktop.on("ended", playNextTrack);
    }

    if (audioMobile) {
        const playPauseBtn = document.getElementById("play-pause-btn-mobile");
        const volumeBtn = document.getElementById("volume-btn-mobile");
        const volumeIcon = volumeBtn.querySelector("i");
        
        playPauseBtn.addEventListener("click", () => audioMobile.paused ? audioMobile.play() : audioMobile.pause());
        audioMobile.addEventListener("play", () => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            handleFirstPlay();
            updateSongToast(playlist[currentTrackIndex]);
        });
        audioMobile.addEventListener("pause", () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>');
        audioMobile.addEventListener("ended", () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            playNextTrack();
        });
        volumeBtn.addEventListener("click", () => audioMobile.muted = !audioMobile.muted);
        audioMobile.addEventListener("volumechange", () => {
            volumeIcon.className = audioMobile.muted || audioMobile.volume === 0 ? "fas fa-volume-mute" : "fas fa-volume-up";
        });
    }
    loadTrack(currentTrackIndex);


    // --- 9. Intersection Observers (Nav Highlighting & Scroll Animations) --- //
    const sections = document.querySelectorAll("#main-container .section");
    const navLinks = document.querySelectorAll("#desktopNav a");
    const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                navLinks.forEach(link => {
                    link.parentElement.classList.toggle("active", link.getAttribute("href") === `#${id}`);
                });
            }
        });
    }, { root: null, threshold: 0.5 });
    sections.forEach(section => navObserver.observe(section));

    const animatedElements = document.querySelectorAll(".fade-in-on-scroll, .fade-in-from-left, .fade-in-from-right, .unblur-on-scroll, .reveal-effect, .fade-in-up");
    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const itemIndex = Array.from(entry.target.parentElement.children).indexOf(entry.target);
                entry.target.style.transitionDelay = `${itemIndex * 0.1}s`;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, threshold: 0.1 });
    animatedElements.forEach(el => animationObserver.observe(el));

    // --- 10. UI Components (Scroll-to-Top, Theme Switcher, Modals) --- //
    const scrollToTopBtn = $("#scroll-to-top");
    $(window).on("scroll", () => {
        scrollToTopBtn.toggleClass("visible", $(window).scrollTop() > 300);
    });
    scrollToTopBtn.on("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const themeSwitcher = $("#theme-switcher, #theme-switcher-mobile");
    const applyTheme = () => {
        const isDarkMode = localStorage.getItem("theme") === "dark";
        $("body").toggleClass("dark-mode", isDarkMode);
        themeSwitcher.find("i").toggleClass("fa-moon", !isDarkMode).toggleClass("fa-sun", isDarkMode);
    };
    themeSwitcher.on("click", () => {
        const isDarkMode = $("body").hasClass("dark-mode");
        localStorage.setItem("theme", isDarkMode ? "light" : "dark");
        applyTheme();
    });
    applyTheme();
    
    // --- 11. Glitch Modal Logic --- //
    const glitchModalEl = document.getElementById('glitchModal');
    if (glitchModalEl) {
        const glitchModal = new bootstrap.Modal(glitchModalEl);
        const ttlEl = document.getElementById('ttl');
        const textToType = `╔════════════════════════════════╗
║ * * Copyright  (c)  Nautii * * ║
╚════════════════════════════════╝

SYNCING... RHYTHM_MODULE
CALIBRATING... BASS_THUMPER
UPLOADING... SUBCONSCIOUS_MELODY
DECODING... LATE_NIGHT_GROOVE
HARMONICS... STABILIZED_SENSUAL
SIGNATURE VERIFIED: <span class="primary">nautii</span>

               Play <span data-action="y">Y</span>/<span data-action="n">N</span>`;

        function typeWriter(element, text, i, callback) {
            if (!element || !glitchModalEl.classList.contains('show')) {
                return; // Stop if element is gone or modal is closed
            }
            if (i < text.length) {
                const char = text.charAt(i);
                if (char === '<') {
                    const tagEndIndex = text.indexOf('>', i);
                    element.innerHTML += text.substring(i, tagEndIndex + 1);
                    setTimeout(() => typeWriter(element, text, tagEndIndex + 1, callback), 30);
                } else {
                    element.innerHTML += char;
                    setTimeout(() => typeWriter(element, text, i + 1, callback), 30);
                }
            } else if (callback) {
                callback();
            }
        }

        const handleModalKeydown = (event) => {
            const key = event.key.toLowerCase();
            if (key === 'y') {
                window.open('room.html', '_blank');
                glitchModal.hide();
            } else if (key === 'n') {
                glitchModal.hide();
            }
        };

        const handleModalClick = (event) => {
            const action = event.target.dataset.action;
            if (action === 'y') {
                window.open('room.html', '_blank');
                glitchModal.hide();
            } else if (action === 'n') {
                glitchModal.hide();
            }
        };

        // Use 'shown.bs.modal' which fires after the modal is fully visible
        glitchModalEl.addEventListener('shown.bs.modal', () => {
            ttlEl.innerHTML = ''; // Always load fresh
            typeWriter(ttlEl, textToType, 0, () => {
                if (ttlEl) ttlEl.innerHTML += '<span class="cursor">█</span>';
            });
            document.addEventListener('keydown', handleModalKeydown);
            ttlEl.addEventListener('click', handleModalClick);
        });

        glitchModalEl.addEventListener('hide.bs.modal', () => {
            document.removeEventListener('keydown', handleModalKeydown);
            if (ttlEl) ttlEl.removeEventListener('click', handleModalClick);
        });

        $('.dont-click-me').on('click', function() {
            glitchModal.show();
        });
    }
    
    // --- 13. VHS Slide JS --- //
    if (document.querySelector('.vhs-slide')) {
        Splitting();

        let vhsSeconds = 0;
        const secondsEl = document.getElementById("vhs-seconds");
        const minutesEl = document.getElementById("vhs-minutes");
        const counterEl = document.querySelector(".vhs-counter");

        function pad(val) {
            return val.toString().padStart(2, '0');
        }

        // Update the clock every second
        setInterval(() => {
            vhsSeconds++;
            if (counterEl && !counterEl.classList.contains('vhs-glitch')) {
                minutesEl.innerHTML = pad(Math.floor(vhsSeconds / 60));
                secondsEl.innerHTML = pad(vhsSeconds % 60);
            }
        }, 1000);

        // Function to trigger a visual glitch
        function triggerGlitch() {
            if (counterEl) {
                const glitchMinutes = pad(Math.floor(Math.random() * 99));
                const glitchSeconds = pad(Math.floor(Math.random() * 99));
                
                minutesEl.innerHTML = glitchMinutes;
                secondsEl.innerHTML = glitchSeconds;
                counterEl.classList.add('vhs-glitch');

                setTimeout(() => {
                    counterEl.classList.remove('vhs-glitch');
                    minutesEl.innerHTML = pad(Math.floor(vhsSeconds / 60));
                    secondsEl.innerHTML = pad(vhsSeconds % 60);
                }, 300);
            }
            const randomDelay = Math.random() * 3000 + 2000; // 2-5 seconds
            setTimeout(triggerGlitch, randomDelay);
        }
        
        // Start the glitch loop after an initial random delay
        setTimeout(triggerGlitch, Math.random() * 3000 + 2000);
    }
});