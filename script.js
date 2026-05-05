const revealElements = document.querySelectorAll('.reveal');

if (revealElements.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 60, 300)}ms`;
    observer.observe(element);
  });
}

// Cookie consent + GA Consent Mode
const consentBanner = document.getElementById('cookie-consent');
const consentAcceptBtn = document.getElementById('cookie-accept');
const consentDeclineBtn = document.getElementById('cookie-decline');
const consentSettingsTriggers = document.querySelectorAll('[data-cookie-settings]');
const consentStorageKey = 'zynkline_cookie_consent';
const gaMeasurementId = 'G-21JVW86GLZ';
const gaScriptSrc = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
let lastFocusedElement = null;

function ensureAnalyticsLibraryLoaded() {
  if (document.querySelector(`script[data-ga-loader="${gaMeasurementId}"]`)) {
    return;
  }

  const analyticsScript = document.createElement('script');
  analyticsScript.async = true;
  analyticsScript.src = gaScriptSrc;
  analyticsScript.dataset.gaLoader = gaMeasurementId;
  document.head.appendChild(analyticsScript);
}

function applyAnalyticsConsent(state, options = {}) {
  const { trackPageView = false } = options;
  if (typeof window.gtag !== 'function') return;

  const granted = state === 'accepted';
  if (granted) {
    ensureAnalyticsLibraryLoaded();
  }

  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  if (granted && trackPageView) {
    window.gtag('event', 'page_view');
  }
}

function hideConsentBanner() {
  if (!consentBanner) return;
  consentBanner.classList.remove('is-visible');
  consentBanner.setAttribute('aria-hidden', 'true');
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function showConsentBanner() {
  if (!consentBanner) return;
  lastFocusedElement = document.activeElement;
  consentBanner.classList.add('is-visible');
  consentBanner.setAttribute('aria-hidden', 'false');
  if (consentAcceptBtn) {
    consentAcceptBtn.focus();
  }
}

const savedConsent = localStorage.getItem(consentStorageKey);
let consentState = savedConsent;

if (savedConsent === 'accepted' || savedConsent === 'declined') {
  applyAnalyticsConsent(savedConsent, { trackPageView: savedConsent === 'accepted' });
}

if (consentBanner) {
  consentBanner.setAttribute('aria-hidden', 'true');

  if (savedConsent !== 'accepted' && savedConsent !== 'declined') {
    showConsentBanner();
  }

  if (consentAcceptBtn) {
    consentAcceptBtn.addEventListener('click', () => {
      const wasAccepted = consentState === 'accepted';
      consentState = 'accepted';
      localStorage.setItem(consentStorageKey, 'accepted');
      applyAnalyticsConsent('accepted', { trackPageView: !wasAccepted });
      hideConsentBanner();
    });
  }

  if (consentDeclineBtn) {
    consentDeclineBtn.addEventListener('click', () => {
      consentState = 'declined';
      localStorage.setItem(consentStorageKey, 'declined');
      applyAnalyticsConsent('declined');
      hideConsentBanner();
    });
  }

  consentSettingsTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      showConsentBanner();
    });
  });

  consentBanner.addEventListener('keydown', (event) => {
    if (!consentBanner.classList.contains('is-visible')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      hideConsentBanner();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = consentBanner.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

const inPageAnchors = document.querySelectorAll('a[href^="#"]');
if (inPageAnchors.length) {
  inPageAnchors.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') {
        return;
      }

      const target = document.querySelector(targetId);
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');

if (lightbox) {
  const projectCards = Array.from(document.querySelectorAll('.project-card'));
  const projectEntries = projectCards.map((card) => {
    let photos = [];
    try {
      photos = JSON.parse(card.getAttribute('data-photos') || '[]');
    } catch (e) {
      photos = [];
    }

    if (!photos.length) {
      const img = card.querySelector('.project-photo img');
      if (img && img.src) {
        photos = [img.getAttribute('src') || img.src];
      }
    }

    const title = card.querySelector('h3');
    const meta = card.querySelector('.project-meta');
    const caption = (title ? title.textContent : '') + (meta ? ' \u2014 ' + meta.textContent : '');

    return {
      card,
      photos,
      caption
    };
  }).filter((entry) => entry.photos.length > 0);

  let currentProjectIndex = 0;
  let currentPhotoIndex = 0;
  let lastWheelAt = 0;

  function hasNavigation() {
    if (projectEntries.length > 1) return true;
    if (!projectEntries.length) return false;
    return projectEntries[0].photos.length > 1;
  }

  function showCurrentPhoto() {
    if (!projectEntries.length) return;

    const project = projectEntries[currentProjectIndex];
    lightboxImg.style.backgroundImage = "url('" + project.photos[currentPhotoIndex] + "')";
    lightboxCaption.textContent = project.caption;

    if (hasNavigation()) {
      lightboxCounter.textContent =
        (currentPhotoIndex + 1) +
        ' / ' +
        project.photos.length +
        ' · ' +
        (currentProjectIndex + 1) +
        ' / ' +
        projectEntries.length;
      lightboxPrev.style.display = '';
      lightboxNext.style.display = '';
    } else {
      lightboxCounter.textContent = '';
      lightboxPrev.style.display = 'none';
      lightboxNext.style.display = 'none';
    }
  }

  function stepPhoto(direction) {
    if (!projectEntries.length) return;

    const project = projectEntries[currentProjectIndex];
    const nextPhotoIndex = currentPhotoIndex + direction;

    if (nextPhotoIndex >= project.photos.length) {
      currentProjectIndex = (currentProjectIndex + 1) % projectEntries.length;
      currentPhotoIndex = 0;
    } else if (nextPhotoIndex < 0) {
      currentProjectIndex = (currentProjectIndex - 1 + projectEntries.length) % projectEntries.length;
      currentPhotoIndex = projectEntries[currentProjectIndex].photos.length - 1;
    } else {
      currentPhotoIndex = nextPhotoIndex;
    }

    showCurrentPhoto();
  }

  function openLightbox(projectIndex, photoIndex = 0) {
    if (!projectEntries.length) return;

    currentProjectIndex = Math.max(0, Math.min(projectIndex, projectEntries.length - 1));
    currentPhotoIndex = photoIndex;
    showCurrentPhoto();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  projectCards.forEach((card, cardIndex) => {
    card.addEventListener('click', () => {
      const normalizedIndex = projectEntries.findIndex((entry) => entry.card === card);
      const targetIndex = normalizedIndex >= 0 ? normalizedIndex : cardIndex;
      openLightbox(targetIndex, 0);
    });
  });

  lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); stepPhoto(-1); });
  lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); stepPhoto(1); });
  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  lightbox.addEventListener('wheel', (e) => {
    if (!lightbox.classList.contains('is-open') || !hasNavigation()) return;

    const now = Date.now();
    if (now - lastWheelAt < 260) {
      e.preventDefault();
      return;
    }

    if (Math.abs(e.deltaY) < 12) return;

    e.preventDefault();
    lastWheelAt = now;
    stepPhoto(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepPhoto(-1);
    if (e.key === 'ArrowRight') stepPhoto(1);
  });
}
