$(document).ready(function() {
    let navTimeout, audioMobile, playerDesktop;
    const isMobile = () => $(window).width() < 992;
    $(window).on("load", function() {
        $("body").addClass("loaded"), $(".preloader").addClass("fade-out"), isMobile() || $(window).on("scroll", function() {
            const e = $(".music-player-bar"),
                t = $("#home-slider").outerHeight();
            $(window).scrollTop() >= t - e.outerHeight() ? e.addClass("sticky-top") : e.removeClass("sticky-top")
        }), new Swiper("#home-slider", {
            loop: !0,
            effect: "fade",
            keyboard: {
                enabled: !0
            },
            navigation: {
                nextEl: "#home-slider .swiper-button-next",
                prevEl: "#home-slider .swiper-button-prev"
            },
            autoplay: {
                delay: 6e3,
                disableOnInteraction: !1,
                pauseOnMouseEnter: !0
            }
        })
    }), $(".navigation-wrapper").on("mouseenter", function() {
        clearTimeout(navTimeout), $("body").addClass("navHover")
    }).on("mouseleave", function() {
        navTimeout = setTimeout(function() {
            $("body").removeClass("navHover")
        }, 250)
    }), $(".gallery-item a").each(function() {
        const e = $(this).data("caption") || "View Image";
        $(this).append(`\n <div class="gallery-overlay">\n <div class="gallery-border"></div>\n <div class="gallery-content">\n <h5>${e}</h5>\n </div>\n </div>\n `)
    });
    const navbarContentEl = document.getElementById("navbarContent"),
        navbarCollapse = new bootstrap.Collapse(navbarContentEl, {
            toggle: !1
        }),
        navbarToggler = document.querySelector("#mobile-header .navbar-toggler");
    navbarContentEl && (navbarContentEl.addEventListener("show.bs.collapse", () => navbarToggler.classList.add("active")), navbarContentEl.addEventListener("hide.bs.collapse", () => navbarToggler.classList.remove("active"))), $("#desktopNav a, #navbarContent .nav-link, .navbar-brand[href=\"#home\"]").on("click", function(e) {
        e.preventDefault();
        const t = this.getAttribute("href"),
            o = $(t);
        if ("#home" === t) window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        else if (o.length) {
            let e = isMobile() ? $("#mobile-header").outerHeight() || 60 : $(".music-player-bar").outerHeight() || 60;
            window.scrollTo({
                top: o.offset().top - e,
                behavior: "smooth"
            })
        }
        clearTimeout(navTimeout), isMobile() && navbarContentEl.classList.contains("show") && navbarCollapse.hide(), isMobile() || $("body").removeClass("navHover")
    });
    const songToastEl = document.getElementById("song-toast"),
        songToast = new bootstrap.Toast(songToastEl),
        toastSongInfo = document.getElementById("toast-song-info");
    let firstPlay = !0;
    const songPlaylist = [{
        title: "Febreeze",
        artist: "nautii",
        src: "../nautii/lib/NAUTII-Febreze.mp3"
    }, {
        title: "The Signal",
        artist: "nautii",
        src: "../nautii/lib/NAUTII-The Signal.mp3"
    }];
    let currentSongIndex = 0;

    function loadSong(e) {
        const t = songPlaylist[e];
        playerDesktop.source = {
            type: "audio",
            sources: [{
                src: t.src,
                type: "audio/mp3"
            }]
        }, audioMobile && (audioMobile.src = t.src, audioMobile.load())
    }

    function playNextSong() {
        currentSongIndex = (currentSongIndex + 1) % songPlaylist.length, loadSong(currentSongIndex), playerDesktop.play(), audioMobile && audioMobile.play()
    }

    function showSongToast(e) {
        firstPlay || (toastSongInfo.innerHTML = `<strong>${e.title}</strong> by ${e.artist}`, songToast.show())
    }

    function handleFirstPlay() {
        firstPlay && (firstPlay = !1, showSongToast(songPlaylist[currentSongIndex]))
    }
    audioMobile = document.getElementById("audio-player-mobile"), playerDesktop = new Plyr("#audio-player-desktop"), playerDesktop && (playerDesktop.on("play", () => {
        handleFirstPlay(), showSongToast(songPlaylist[currentSongIndex])
    }), playerDesktop.on("ended", playNextSong)), audioMobile && (() => {
        const e = document.getElementById("play-pause-btn-mobile"),
            t = document.getElementById("volume-btn-mobile"),
            o = t.querySelector("i");
        e.addEventListener("click", () => audioMobile.paused ? audioMobile.play() : audioMobile.pause()), audioMobile.addEventListener("play", () => {
            e.innerHTML = '<i class="fas fa-pause"></i>', handleFirstPlay(), showSongToast(songPlaylist[currentSongIndex])
        }), audioMobile.addEventListener("pause", () => e.innerHTML = '<i class="fas fa-play"></i>'), audioMobile.addEventListener("ended", () => {
            e.innerHTML = '<i class="fas fa-play"></i>', playNextSong()
        }), t.addEventListener("click", () => audioMobile.muted = !audioMobile.muted), audioMobile.addEventListener("volumechange", () => {
            o.className = audioMobile.muted || 0 === audioMobile.volume ? "fas fa-volume-mute" : "fas fa-volume-up"
        })
    })(), loadSong(currentSongIndex);
    const sections = document.querySelectorAll("#main-container .section"),
        navLinks = document.querySelectorAll("#desktopNav a"),
        observer = new IntersectionObserver(e => {
            e.forEach(e => {
                if (e.isIntersecting) {
                    const t = e.target.getAttribute("id");
                    navLinks.forEach(e => {
                        e.parentElement.classList.toggle("active", e.getAttribute("href") === `#${t}`)
                    })
                }
            })
        }, {
            root: null,
            threshold: .5
        });
    sections.forEach(e => observer.observe(e));
    const scrollToTopBtn = $("#scroll-to-top");
    $(window).on("scroll", () => {
        scrollToTopBtn.toggleClass("visible", $(window).scrollTop() > 300)
    }), scrollToTopBtn.on("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    });
    const themeSwitchers = $("#theme-switcher, #theme-switcher-mobile"),
        updateTheme = () => {
            const isLight = "light" === localStorage.getItem("theme");
            $("body").toggleClass("dark-mode", !isLight), themeSwitchers.find("i").toggleClass("fa-moon", isLight).toggleClass("fa-sun", !isLight);
            const themePrefix = isLight ? "l" : "d";
            $(".gallery-item a").each(function() {
                const link = $(this);
                const img = link.find("img");
                const currentHref = link.attr("href");
                if (currentHref) {
                    const filename = currentHref.substring(currentHref.lastIndexOf("/") + 1);
                    const number = filename.replace(/^[ld]?(\d+)\.jpg$/, "$1");
                    const newPath = `../nautii/lib/${themePrefix}${number}.jpg`;
                    link.attr("href", newPath);
                    img.attr("src", newPath);
                }
            })
        };
    themeSwitchers.on("click", function() {
        const body = $("body"),
            overlay = $("#theme-transition-overlay");
        body.hasClass("dark-mode") ? overlay.css("background-color", "#fff") : overlay.css("background-color", "#000"), overlay.addClass("active"), setTimeout(function() {
            body.hasClass("dark-mode") ? localStorage.setItem("theme", "light") : localStorage.setItem("theme", "dark"), updateTheme(), setTimeout(function() {
                overlay.removeClass("active")
            }, 50)
        }, 500)
    }), updateTheme();
    const glitchModalEl = document.getElementById("glitchModal");
    if (glitchModalEl) {
        const glitchModal = new bootstrap.Modal(glitchModalEl),
            ttlElement = document.getElementById("ttl"),
            modalText = `╔════════════════════════════════╗\n ║ * * Copyright (c) Nautii * * ║\n ╚════════════════════════════════╝\n\n SYNCING... RHYTHM_MODULE\n CALIBRATING... BASS_THUMPER\n UPLOADING... SUBCONSCIOUS_MELODY\n DECODING... LATE_NIGHT_GROOVE\n HARMONICS... STABILIZED_SENSUAL\n SIGNATURE VERIFIED: <span class="primary">nautii</span>\n\n Play <span data-action="y">Y</span> <span data-action="n">N</span>`;

        function typeWriter(e, t, o, a) {
            if (e && glitchModalEl.classList.contains("show")) {
                if (o < t.length) {
                    const n = t.charAt(o);
                    "<" === n ? (e.innerHTML += t.substring(o, t.indexOf(">", o) + 1), setTimeout(() => typeWriter(e, t, t.indexOf(">", o) + 1, a), 24)) : (e.innerHTML += n, setTimeout(() => typeWriter(e, t, o + 1, a), 24))
                } else a && a()
            }
        }

        function handleModalAction(e) {
            "y" === e ? (window.open("https://samuelbutcher.net/nautii/index.html", "_blank"), glitchModal.hide()) : "n" === e && glitchModal.hide()
        }
        const handleKeyPress = e => {
                const t = e.key.toLowerCase();
                handleModalAction(t)
            },
            handleClick = e => {
                const t = e.target.dataset.action;
                handleModalAction(t)
            };
        glitchModalEl.addEventListener("shown.bs.modal", () => {
            ttlElement.innerHTML = "", typeWriter(ttlElement, modalText, 0, () => {
                ttlElement && (ttlElement.innerHTML += '<span class="cursor">█</span>')
            }), document.addEventListener("keydown", handleKeyPress), ttlElement.addEventListener("click", handleClick)
        }), glitchModalEl.addEventListener("hide.bs.modal", () => {
            document.removeEventListener("keydown", handleKeyPress), ttlElement && ttlElement.removeEventListener("click", handleClick)
        }), $(".dont-click-me").on("click", function() {
            glitchModal.show()
        })
    }
    if (document.querySelector(".vhs-slide")) {
        Splitting();
        let e = 5400;
        const vhsSeconds = document.getElementById("vhs-seconds"),
            vhsMinutes = document.getElementById("vhs-minutes"),
            vhsCounter = document.querySelector(".vhs-counter");

        function formatTime(e) {
            return e.toString().padStart(2, "0")
        }

        function triggerGlitch() {
            const e = "1234567890@#$%^&*()_+-=[]{};'\\|,./<>?~";
            vhsMinutes.textContent = e.charAt(Math.floor(Math.random() * e.length)) + e.charAt(Math.floor(Math.random() * e.length)), vhsSeconds.textContent = e.charAt(Math.floor(Math.random() * e.length)) + e.charAt(Math.floor(Math.random() * e.length)), vhsCounter.classList.add("vhs-glitch"), setTimeout(() => {
                vhsCounter.classList.remove("vhs-glitch"), updateCounter()
            }, 1e3)
        }

        function updateCounter() {
            if (vhsCounter && e >= 0) {
                const t = Math.floor(e / 60),
                    o = e % 60;
                vhsMinutes.innerHTML = formatTime(t), vhsSeconds.innerHTML = formatTime(o)
            }
        }
        const counterInterval = setInterval(() => {
            e > 0 ? e-- : clearInterval(counterInterval), updateCounter()
        }, 1e3);
        ! function scheduleGlitch() {
            triggerGlitch(), setTimeout(scheduleGlitch, 5e3 + 3e3 * Math.random())
        }()
    }
});
const poemModalEl = document.getElementById("poemModal");
if (poemModalEl) {
    const o = '<p>For the sharp <span>facts</span> of the world are these: a <span>clatter</span> of <span>bone</span> and a <span>silence</span> of <span>rust</span>. A final <span>number</span> in the cold mouth of <span>gravity</span>. <span>Experts</span> think we are <span>remembered</span> by the <span>craters</span> we leave, by the <span>ash</span> of our <span>fires</span>, and the dry, hollow sockets of our <span>skulls</span>. But then: <span>you</span>. You <span>arrive</span> like a forgotten <span>dialect</span> of <span>light</span>, your <span>shoulders</span> a curved <span>stanza</span> against <span>dusk</span> your <span>hands</span> <span>sonnets</span> that sleep and wake and in your <span>walking</span> is the <span>metric</span> <span>grace</span> of a <span>universe</span> that chose <span>rhythm</span> over <span>ruin</span>. In your <span>eyes</span> is the entire, startled <span>myth</span> of a <span>nebula</span> deciding to be <span>born</span> anew. So when the silver <span>listeners</span> come <span>sifting</span> through the <span>dust</span> of our <span>sun</span> for a <span>sign</span> they will not find the <span>inventory</span> of our <span>dead</span> nor the brittle <span>record</span> of what we <span>broke</span>. They will find the <span>echo</span> of how you <span>turned</span> your head, the sudden <span>flower</span> of your <span>smile</span>, a <span>living</span> <span>syllable</span> <span>proof</span>; a <span>prayer</span> made of <span>breath</span> and <span>blood</span>, and they will <span>know</span>, in the vast <span>quiet</span> between <span>galaxies</span>, that we were not a species of <span>corpses</span> but of <span>poets</span> littered among the <span>stars</span>. Because we <span>saw</span> (I <span>saw</span>) <span>you</span>.</p>',
        e = poemModalEl.querySelector(".content");

    function t() {
        const t = poemModalEl.querySelectorAll(".text");
        t.forEach(t => {
            t.innerHTML = `<div class="loop-container">${o}${o}</div>`
        })
    }

    function n() {
        if (e) {
            const o = window.innerWidth,
                t = o < 1e3 ? .95 * o / 1e3 : 1;
            e.style.transform = `scale(${t})`
        }
    }
    poemModalEl.addEventListener("shown.bs.modal", () => {
        t(), n(), window.addEventListener("resize", n)
    }), poemModalEl.addEventListener("hide.bs.modal", () => {
        window.removeEventListener("resize", n)
    })
}
