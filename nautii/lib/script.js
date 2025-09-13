// Declare variables in a higher scope
let playerDesktop, audioMobile;

$(window).on("load", function() {
    var preloader = $(".preloader");
    $('body').addClass('loaded');
    preloader.addClass('fade-out');
    // Autoplay is disabled per request
});

$(document).ready(function() {
    var navTimeout;
    $('.navigation-wrapper').on('mouseenter', function() {
        clearTimeout(navTimeout);
        $('body').addClass('navHover');
    }).on('mouseleave', function() {
        navTimeout = setTimeout(function() {
            $('body').removeClass('navHover');
        }, 250);
    });

    if (document.querySelector("#about-image-container")) {
        VanillaTilt.init(document.querySelector("#about-image-container"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.4
        });
    }

    $('.gallery-item a').each(function() {
        var captionText = $(this).data('caption') || "View Image";
        var overlayHtml = `
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

    const mainContainer = $("#main-container");
    const isMobile = () => $(window).width() < 992;

    const mobileMenu = document.getElementById('navbarContent');
    const bsMobileMenu = new bootstrap.Collapse(mobileMenu, { toggle: false });
    const mobileNavToggler = document.querySelector("#mobile-header .navbar-toggler");

    if (mobileMenu) {
        mobileMenu.addEventListener('show.bs.collapse', () => mobileNavToggler.classList.add('active'));
        mobileMenu.addEventListener('hide.bs.collapse', () => mobileNavToggler.classList.remove('active'));
    }

    const songToastEl = document.getElementById('song-toast');
    const songToast = new bootstrap.Toast(songToastEl);
    const toastSongInfo = document.getElementById('toast-song-info');
    const cartToastEl = document.getElementById('cart-toast');
    const cartToast = new bootstrap.Toast(cartToastEl);
    const toastCartInfo = document.getElementById('toast-cart-info');

    $("#desktopNav a, #navbarContent .nav-link, .navbar-brand[href=\"#home\"]").on("click", function(event) {
        event.preventDefault();
        var targetId = this.getAttribute("href");
        var targetElement = document.querySelector(targetId);

        if (targetElement) {
            if (isMobile()) {
                let headerOffset = $('#mobile-header').outerHeight() || 60;
                let elementPosition = targetElement.getBoundingClientRect().top;
                let offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                if (targetId === '#home') {
                    offsetPosition = 0;
                }
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
                if (mobileMenu.classList.contains('show')) {
                   bsMobileMenu.hide();
                }
            } else {
                let headerOffset = 0;
                if (targetId !== '#home') {
                    headerOffset = $('.music-player-bar').outerHeight() || 60;
                }
                let scrollPosition = targetElement.offsetTop - headerOffset;
                mainContainer.animate({
                    scrollTop: scrollPosition
                }, 800);
                $('body').removeClass('navHover');
            }
        }
    });

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
    
    // Assign to variables in higher scope
    audioMobile = document.getElementById("audio-player-mobile");
    playerDesktop = new Plyr("#audio-player-desktop");

    function loadTrack(index) {
        const track = playlist[index];
        playerDesktop.source = {
            type: "audio",
            sources: [{
                src: track.src,
                type: "audio/mp3"
            }]
        };
        audioMobile.src = track.src;
        audioMobile.load();
    }

    function playNextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        playerDesktop.play();
        if (audioMobile) audioMobile.play();
    }

    function updateToast(track) {
        toastSongInfo.innerHTML = `<strong>${track.title}</strong> by ${track.artist}`;
        songToast.show();
    }

    if (playerDesktop) {
        playerDesktop.on("play", () => {
            updateToast(playlist[currentTrackIndex]);
        });
        playerDesktop.on("ended", () => {
            playNextTrack();
        });
    }

    if (audioMobile) {
        const playPauseBtn = document.getElementById("play-pause-btn");
        const volumeBtn = document.getElementById("volume-btn");
        const volumeIcon = volumeBtn.querySelector("i");
        playPauseBtn.addEventListener("click", () => {
            audioMobile.paused ? audioMobile.play() : audioMobile.pause();
        });
        audioMobile.addEventListener("play", () => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            updateToast(playlist[currentTrackIndex]);
        });
        audioMobile.addEventListener("pause", () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
        audioMobile.addEventListener("ended", () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            playNextTrack();
        });
        volumeBtn.addEventListener("click", () => {
            audioMobile.muted = !audioMobile.muted;
        });
        audioMobile.addEventListener("volumechange", () => {
            volumeIcon.className = audioMobile.muted || audioMobile.volume === 0 ? "fas fa-volume-mute" : "fas fa-volume-up";
        });
    }

    loadTrack(currentTrackIndex);

    const sections = document.querySelectorAll(".section");
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
    }, {
        root: isMobile() ? null : mainContainer[0],
        threshold: 0.5
    });
    sections.forEach(section => {
        navObserver.observe(section);
    });

    const animatedElements = document.querySelectorAll(".fade-in-on-scroll");
    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const itemIndex = Array.from(entry.target.parentElement.children).indexOf(entry.target);
                entry.target.style.transitionDelay = `${itemIndex * 0.1}s`;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: isMobile() ? null : mainContainer[0],
        threshold: 0.1
    });
    animatedElements.forEach(el => {
        animationObserver.observe(el);
    });


    const scrollToTopBtn = $("#scroll-to-top");
    const scrollElement = isMobile() ? $(window) : mainContainer;
    scrollElement.on("scroll", () => {
        scrollToTopBtn.toggleClass("visible", scrollElement.scrollTop() > 300);
    });
    scrollToTopBtn.on("click", () => {
        isMobile() ? window.scrollTo({
            top: 0,
            behavior: "smooth"
        }) : mainContainer.animate({
            scrollTop: 0
        }, 800);
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
    
    // Video Modal Logic
    const videoModal = document.getElementById('videoModal');
    const modalVideoPlayer = document.getElementById('modalVideoPlayer');
    videoModal.addEventListener('show.bs.modal', function() {
        modalVideoPlayer.play();
    });
    videoModal.addEventListener('hide.bs.modal', function() {
        modalVideoPlayer.pause();
        modalVideoPlayer.currentTime = 0;
    });


    let cart = [];
    const merchModal = new bootstrap.Modal(document.getElementById("merchModal"));
    const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById("cartOffcanvas"));

    function updateCartCounter() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        $(".cart-counter").text(totalItems);
        totalItems > 0 ? $(".cart-counter").css("display", "flex") : $(".cart-counter").hide();
    }

    function renderCart() {
        let total = 0;
        const container = $("#cart-items-container");
        container.empty();
        if (cart.length === 0) {
            container.html("<p>Your cart is empty.</p>");
            $("#cart-total").text("Total: $0.00");
            return;
        }
        cart.forEach((item, index) => {
            total += parseFloat(item.price.replace("$", "")) * item.quantity;
            let itemHtml = `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.img}" class="cart-item-img" alt="${item.name}">
                    <div class="cart-item-details">
                        <h6>${item.name}</h6>
                        <div class="item-meta">
                            ${item.size ? `Size: ${item.size}<br>` : ""}
                            <span class="price">${item.price}</span>
                        </div>
                    </div>
                    <div class="quantity-controls">
                        <button class="btn-quantity-change" data-index="${index}" data-change="-1">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn-quantity-change" data-index="${index}" data-change="1">+</button>
                    </div>
                </div>
            `;
            container.append(itemHtml);
        });
        $("#cart-total").text(`Total: $${total.toFixed(2)}`);
    }

    $("#merch-filters .btn").on("click", function() {
        $("#merch-filters .btn").removeClass("active");
        $(this).addClass("active");
        const filter = $(this).data("filter");
        if (filter === "*") {
            $(".merch-item").fadeIn("fast");
        } else {
            $(".merch-item").fadeOut(0);
            $(".merch-item").filter(function() {
                return $(this).data("category") === filter;
            }).fadeIn("fast");
        }
    });

    $(".merch-grid").on("click", ".btn-more", function(e) {
        e.preventDefault();
        const card = $(this).closest(".merch-item");
        const name = card.find("h5").text();
        const price = card.find(".price").text();
        const img = card.find(".merch-card-img").attr("src");
        const desc = card.find(".description").text();
        const sizeSelector = card.find(".size-select");

        $("#merchModalTitle").text(name);
        $("#merchModalPrice").text(price);
        $("#merchModalImage").attr("src", img);
        $("#merchModalDescription").text(desc);
        $("#merchModalSizeContainer").empty();
        if (sizeSelector.length > 0) {
            $("#merchModalSizeContainer").append(sizeSelector.clone());
        }
        $("#merchModal .btn-add-to-cart").data("item-id", card.data("id"));
        merchModal.show();
    });

    const addToCart = function(event) {
        event.preventDefault();
        const sourceElement = $(this).closest(".merch-item, .modal-content");
        const sizeSelector = sourceElement.find(".size-select");
        const selectedSize = sizeSelector.length ? sizeSelector.val() : null;

        if (sizeSelector.length && selectedSize === "Select Size") {
            toastCartInfo.text("Please select a size.");
            cartToast.show();
            return;
        }

        const baseId = sourceElement.data("id") || $("#merchModal .btn-add-to-cart").data("item-id");
        const itemData = {
            baseId: baseId,
            name: sourceElement.find("h5, #merchModalTitle").text(),
            price: sourceElement.find(".price, #merchModalPrice").text(),
            img: sourceElement.find(".merch-card-img, #merchModalImage").attr("src"),
            size: selectedSize,
            quantity: 1
        };
        const cartItemId = selectedSize ? `${baseId}-${selectedSize}` : baseId;
        const existingItemIndex = cart.findIndex(item => item.id === cartItemId);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity++;
        } else {
            cart.push({
                id: cartItemId,
                ...itemData
            });
        }
        updateCartCounter();
        toastCartInfo.innerHTML = `<strong>${itemData.name} ${itemData.size ? `(${itemData.size})` : ""}</strong> added to cart!`;
        cartToast.show();
        merchModal.hide();
    };

    $(".merch-grid").on("click", ".btn-get-it", addToCart);
    $("#merchModal").on("click", ".btn-add-to-cart", addToCart);

    $(document).on("click", ".cart-icon", function(e) {
        e.preventDefault();
        renderCart();
        cartOffcanvas.show();
    });

    $("#cart-items-container").on("click", ".btn-quantity-change", function() {
        const index = parseInt($(this).data("index"));
        const change = parseInt($(this).data("change"));
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        updateCartCounter();
        renderCart();
    });
    
    // --- Style Customizer Logic ---
    const customizerBody = $('#customizer-body');
    const root = document.documentElement;

    const customizableProperties = {
        'Colors': [
            { label: 'Primary', var: '--primary-color' },
            { label: 'Primary Hover', var: '--primary-hover' },
            { label: 'Neon Blue', var: '--neon-blue' },
            { label: 'Text', var: '--text-primary' },
            { label: 'Background', var: '--background-primary' }
        ],
        'Fonts': [
            { label: 'Main Title', var: '--font-main-title' },
            { label: 'Headings', var: '--font-headings' },
            { label: 'Body', var: '--font-body' }
        ]
    };

    function buildCustomizer() {
        // Build Colors Section
        let colorsHtml = '<h3>Colors</h3>';
        customizableProperties.Colors.forEach(prop => {
            const currentColor = getComputedStyle(root).getPropertyValue(prop.var).trim();
            colorsHtml += `
                <div>
                    <label for="${prop.var}" class="form-label">${prop.label}</label>
                    <input type="color" class="form-control" id="${prop.var}" value="${currentColor}" data-var="${prop.var}">
                </div>
            `;
        });
        customizerBody.append(colorsHtml);

        // Build Fonts Section
        let fontsHtml = '<h3 class="mt-4">Fonts</h3>';
        customizableProperties.Fonts.forEach(prop => {
            const currentFont = getComputedStyle(root).getPropertyValue(prop.var).trim().split(',')[0].replace(/"/g, '');
            fontsHtml += `
                <div>
                    <label for="${prop.var}" class="form-label">${prop.label}</label>
                    <input type="text" class="form-control" id="${prop.var}" value="${currentFont}" data-var="${prop.var}">
                </div>
            `;
        });
        customizerBody.append(fontsHtml);
        
        // Build Google Font Importer
        let importerHtml = `
            <h3 class="mt-4">Add Google Font</h3>
            <div class="d-flex">
                <input type="text" id="google-font-name" class="form-control" placeholder="e.g., Roboto">
                <button class="btn btn-secondary ms-2" id="load-font-btn">Load</button>
            </div>
        `;
        customizerBody.append(importerHtml);

        // Add event listeners
        $('#customizerOffcanvas').on('input', 'input[type="color"]', function() {
            root.style.setProperty($(this).data('var'), $(this).val());
        });
        $('#customizerOffcanvas').on('input', 'input[type="text"]', function() {
            const fontStack = `'${$(this).val()}', sans-serif`;
            root.style.setProperty($(this).data('var'), fontStack);
        });
    }

    $('#customizer-body').on('click', '#load-font-btn', function() {
        const fontName = $('#google-font-name').val().trim();
        if (fontName) {
            const formattedFontName = fontName.replace(/ /g, '+');
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@400;700&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            toastCartInfo.text(`Font "${fontName}" loaded.`);
            cartToast.show();
        }
    });

    $('#export-css-btn').on('click', function() {
        let cssText = ':root {\n';
        customizableProperties.Colors.forEach(prop => {
            const value = getComputedStyle(root).getPropertyValue(prop.var).trim();
            cssText += `  ${prop.var}: ${value};\n`;
        });
        customizableProperties.Fonts.forEach(prop => {
             const value = getComputedStyle(root).getPropertyValue(prop.var).trim();
            cssText += `  ${prop.var}: ${value};\n`;
        });
        cssText += '}';

        navigator.clipboard.writeText(cssText).then(() => {
            toastCartInfo.text('CSS copied to clipboard!');
            cartToast.show();
        }, () => {
            toastCartInfo.text('Failed to copy CSS.');
            cartToast.show();
        });
    });

    buildCustomizer();
    updateCartCounter();
});

