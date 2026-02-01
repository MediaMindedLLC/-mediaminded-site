/* ============================================
   MediaMinded.ai — Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar scroll effect ---
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    });

    // --- Mobile menu toggle ---
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close mobile menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Scroll animations ---
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        scrollObserver.observe(el);
    });

    // --- Stat counter animation ---
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-count'), 10);
                animateCounter(el, target);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));

    function animateCounter(el, target) {
        const duration = 1500;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);

            el.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Phone number auto-formatting ---
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        function formatPhone() {
            let digits = phoneInput.value.replace(/\D/g, '');
            if (digits.length > 10) digits = digits.slice(0, 10);
            let formatted = digits;
            if (digits.length > 6) {
                formatted = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
            } else if (digits.length > 3) {
                formatted = digits.slice(0, 3) + '-' + digits.slice(3);
            }
            phoneInput.value = formatted;
        }
        phoneInput.addEventListener('input', formatPhone);
        phoneInput.addEventListener('keyup', formatPhone);
    }

    // --- Contact form submission ---
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    contactForm.style.display = 'none';
                    formSuccess.classList.add('show');
                } else {
                    submitBtn.textContent = 'Error — Try Again';
                    submitBtn.disabled = false;
                    setTimeout(() => { submitBtn.textContent = originalText; }, 3000);
                }
            } catch (err) {
                submitBtn.textContent = 'Error — Try Again';
                submitBtn.disabled = false;
                setTimeout(() => { submitBtn.textContent = originalText; }, 3000);
            }
        });
    }

    // --- Interactive Demo Tab Switching ---
    const iaoSidebar = document.querySelector('.iao-sidebar');
    if (iaoSidebar) {
        const navItems = iaoSidebar.querySelectorAll('.iao-nav-item');
        const panels = document.querySelectorAll('.iao-tab-panel');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetTab = item.getAttribute('data-tab');

                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                panels.forEach(p => p.classList.remove('active'));
                const targetPanel = document.getElementById('iao-panel-' + targetTab);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }

                // Leaflet needs invalidateSize when its container becomes visible
                if (targetTab === 'novamap' && window._novaMap) {
                    setTimeout(() => window._novaMap.invalidateSize(), 150);
                }
            });
        });
    }

    // --- Nova Map sub-tab switching (Main Map / Schedule) ---
    const nmTabs = document.querySelectorAll('.iao-nm-tab');
    const nmViews = document.querySelectorAll('.iao-nm-view');

    if (nmTabs.length) {
        nmTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-nm-view');

                nmTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                nmViews.forEach(v => v.classList.remove('active'));
                const targetView = document.getElementById('nm-' + target);
                if (targetView) {
                    targetView.classList.add('active');
                }

                if (target === 'mainmap' && window._novaMap) {
                    setTimeout(() => window._novaMap.invalidateSize(), 150);
                }
            });
        });
    }

    // --- Nova Map Leaflet initialization ---
    const novaMapEl = document.getElementById('novamap-leaflet');
    if (novaMapEl && typeof L !== 'undefined') {
        const map = L.map('novamap-leaflet', {
            center: [37.5, -79.5],
            zoom: 6,
            zoomControl: true,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            boxZoom: false,
            keyboard: false,
            attributionControl: false
        });

        map.zoomControl.setPosition('topright');

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
        }).addTo(map);

        // Helper: create circle marker
        function pin(lat, lng, color, radius, glow) {
            return L.circleMarker([lat, lng], {
                radius: radius || 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.9,
                interactive: false
            }).addTo(map);
        }

        // HQ — Philadelphia area
        var hq = L.circleMarker([39.95, -75.17], {
            radius: 14, fillColor: '#1976D2', color: '#fff',
            weight: 3, fillOpacity: 1, interactive: false
        }).addTo(map);

        // Branches (yellow)
        pin(40.0, -82.5, '#F9A825', 9);
        pin(35.5, -83.5, '#F9A825', 9);

        // Sales Reps (purple)
        [[40.5,-79.5],[40.2,-78.0],[40.8,-77.5],[40.4,-76.5],
         [41.0,-75.0],[40.3,-74.5],[39.7,-75.8],[40.1,-73.8],
         [40.6,-73.5],[35.8,-82.0],[35.5,-82.5],[35.2,-81.5],
         [34.8,-80.5],[34.5,-79.5]].forEach(function(c) {
            pin(c[0], c[1], '#9C27B0', 8);
        });

        // Star reps (purple with larger radius)
        [[40.0,-74.0],[35.6,-82.8]].forEach(function(c) {
            pin(c[0], c[1], '#9C27B0', 10);
            L.circleMarker([c[0], c[1]], {
                radius: 4, fillColor: '#D4A843', color: '#D4A843',
                weight: 0, fillOpacity: 1, interactive: false
            }).addTo(map);
        });

        // Appointments (teal)
        [[40.1,-77.0],[39.8,-76.5],[35.0,-80.0],[34.6,-79.0],
         [34.2,-78.0],[35.5,-81.0],[34.0,-77.5]].forEach(function(c) {
            pin(c[0], c[1], '#00897B', 8);
        });

        // Store reference for invalidateSize calls
        window._novaMap = map;
    }

    // --- Staggered scroll animations ---
    const staggerContainers = [
        '.problems-grid',
        '.services-grid',
        '.why-grid',
        '.results-grid'
    ];

    staggerContainers.forEach(selector => {
        const container = document.querySelector(selector);
        if (!container) return;

        const children = container.querySelectorAll('.animate-on-scroll');
        children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.1}s`;
        });
    });

});
