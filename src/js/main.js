/**
 * Total Equipment Hire - Main JavaScript
 * Production-quality site interactions with zero dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------
  // 1. Mobile Navigation Toggle
  // -------------------------------------------------------
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  /**
   * Open or close the mobile navigation drawer.
   * Toggles .active on the hamburger button and nav panel,
   * and locks body scroll while the drawer is open.
   */
  const toggleMobileNav = (forceClose = false) => {
    if (!navToggle || !mobileNav) return;

    const shouldClose = forceClose || mobileNav.classList.contains('active');

    navToggle.classList.toggle('active', !shouldClose);
    mobileNav.classList.toggle('active', !shouldClose);
    document.body.style.overflow = shouldClose ? '' : 'hidden';
  };

  if (navToggle) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileNav();
    });
  }

  // Close mobile nav when clicking a link inside it
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleMobileNav(true));
    });
  }

  // Close mobile nav when clicking outside of it
  document.addEventListener('click', (e) => {
    if (
      mobileNav &&
      mobileNav.classList.contains('active') &&
      !mobileNav.contains(e.target) &&
      !navToggle.contains(e.target)
    ) {
      toggleMobileNav(true);
    }
  });

  // -------------------------------------------------------
  // 2. Smooth Scroll for Anchor Links
  // -------------------------------------------------------
  const HEADER_OFFSET = 80; // px - matches fixed header height

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      // Close mobile nav if it is open
      if (mobileNav && mobileNav.classList.contains('active')) {
        toggleMobileNav(true);
      }

      const targetPosition =
        targetEl.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    });
  });

  // -------------------------------------------------------
  // 3. Scroll-Triggered Fade-In Animations
  // -------------------------------------------------------
  const fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;

          // If the parent opts into staggered children, delay each child
          if (el.closest('[data-stagger]')) {
            const parent = el.closest('[data-stagger]');
            const siblings = Array.from(
              parent.querySelectorAll('.fade-in')
            );
            const index = siblings.indexOf(el);
            const delay = index * 100; // 100ms per child

            setTimeout(() => el.classList.add('visible'), delay);
          } else {
            el.classList.add('visible');
          }

          // One-time animation: stop observing after it triggers
          observer.unobserve(el);
        });
      },
      {
        threshold: 0.15,
        rootMargin: '-50px',
      }
    );

    fadeElements.forEach((el) => fadeObserver.observe(el));
  }

  // -------------------------------------------------------
  // 4. Gallery Lightbox
  // -------------------------------------------------------
  const galleryImages = document.querySelectorAll('.gallery-item img');
  let lightbox = null;
  let lightboxImg = null;
  let lightboxClose = null;
  let lightboxPrev = null;
  let lightboxNext = null;
  let currentGalleryIndex = 0;

  /**
   * Build the lightbox DOM on first use so we don't pollute
   * the page if the gallery section doesn't exist.
   */
  const createLightbox = () => {
    if (lightbox) return;

    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-label', 'Image lightbox');

    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
      <button class="lightbox-prev" aria-label="Previous image">&#10094;</button>
      <div class="lightbox-content">
        <img src="" alt="" />
      </div>
      <button class="lightbox-next" aria-label="Next image">&#10095;</button>
    `;

    document.body.appendChild(lightbox);

    lightboxImg = lightbox.querySelector('.lightbox-content img');
    lightboxClose = lightbox.querySelector('.lightbox-close');
    lightboxPrev = lightbox.querySelector('.lightbox-prev');
    lightboxNext = lightbox.querySelector('.lightbox-next');

    // Close on close-button click
    lightboxClose.addEventListener('click', closeLightbox);

    // Close when clicking outside the image (on the overlay)
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Prev / Next buttons
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(-1);
    });

    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(1);
    });
  };

  const openLightbox = (index) => {
    createLightbox();
    currentGalleryIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  const navigateLightbox = (direction) => {
    currentGalleryIndex =
      (currentGalleryIndex + direction + galleryImages.length) %
      galleryImages.length;
    updateLightboxImage();
  };

  const updateLightboxImage = () => {
    const img = galleryImages[currentGalleryIndex];
    // Prefer data-full for a high-res version; fall back to the thumbnail src
    lightboxImg.src = img.dataset.full || img.src;
    lightboxImg.alt = img.alt || '';
  };

  // Bind gallery item clicks
  galleryImages.forEach((img, index) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => openLightbox(index));
  });

  // Keyboard controls for the lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        navigateLightbox(-1);
        break;
      case 'ArrowRight':
        navigateLightbox(1);
        break;
    }
  });

  // -------------------------------------------------------
  // 5. Contact Form Handling (Formspree)
  // -------------------------------------------------------
  const contactForm = document.querySelector('form.contact-form');

  if (contactForm) {
    const submitBtn = contactForm.querySelector('[type="submit"]');
    const formSuccess = document.querySelector('.form-success');
    const formError = document.querySelector('.form-error');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Determine the Formspree endpoint from the form's action attribute
      const action = contactForm.getAttribute('action');
      if (!action) {
        console.error('Contact form is missing an action attribute.');
        return;
      }

      // Hide any prior messages
      if (formSuccess) formSuccess.style.display = 'none';
      if (formError) formError.style.display = 'none';

      // Show loading state
      const originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      // Collect form data as a plain object
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          // Success: show confirmation, hide form
          if (formSuccess) formSuccess.style.display = 'block';
          contactForm.style.display = 'none';
          contactForm.reset();
        } else {
          throw new Error(`Server responded with ${response.status}`);
        }
      } catch (error) {
        console.error('Form submission error:', error);
        if (formError) formError.style.display = 'block';
      } finally {
        // Reset button regardless of outcome
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  // -------------------------------------------------------
  // 6. Header Scroll Effect
  // -------------------------------------------------------
  const siteHeader = document.querySelector('.site-header');
  const SCROLL_THRESHOLD = 50; // px

  const handleHeaderScroll = () => {
    if (!siteHeader) return;
    siteHeader.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
  };

  // Run once on load in case the page is already scrolled
  handleHeaderScroll();
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });

  // -------------------------------------------------------
  // 7. Active Navigation Link Highlighting
  // -------------------------------------------------------
  const currentPath = window.location.pathname;

  document.querySelectorAll('.site-header a, .mobile-nav a').forEach((link) => {
    const linkPath = new URL(link.href, window.location.origin).pathname;

    // Exact match, or match trailing-slash variants
    if (
      linkPath === currentPath ||
      linkPath === currentPath.replace(/\/$/, '') ||
      linkPath + '/' === currentPath
    ) {
      link.classList.add('active');
    }
  });

  // -------------------------------------------------------
  // 8. Click-to-Call / CTA Analytics Placeholder
  // -------------------------------------------------------
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.addEventListener('click', () => {
      const phoneNumber = link.getAttribute('href').replace('tel:', '');

      // Analytics placeholder -- swap in your real tracking call here
      // e.g. gtag('event', 'click_to_call', { phone: phoneNumber });
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'click_to_call', {
          event_category: 'engagement',
          event_label: phoneNumber,
        });
      }

      console.debug(`[Analytics] Click-to-call: ${phoneNumber}`);
    });
  });
});
