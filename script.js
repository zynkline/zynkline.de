const revealElements = document.querySelectorAll('.reveal');

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

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
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

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');

if (lightbox) {
  let currentPhotos = [];
  let currentIndex = 0;
  let currentCaption = '';

  function showPhoto(index) {
    currentIndex = (index + currentPhotos.length) % currentPhotos.length;
    lightboxImg.style.backgroundImage = "url('" + currentPhotos[currentIndex] + "')";
    lightboxCaption.textContent = currentCaption;
    if (currentPhotos.length > 1) {
      lightboxCounter.textContent = (currentIndex + 1) + ' / ' + currentPhotos.length;
      lightboxPrev.style.display = '';
      lightboxNext.style.display = '';
    } else {
      lightboxCounter.textContent = '';
      lightboxPrev.style.display = 'none';
      lightboxNext.style.display = 'none';
    }
  }

  function openLightbox(photos, caption) {
    currentPhotos = photos;
    currentCaption = caption;
    showPhoto(0);
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('click', () => {
      let photos = [];
      try { photos = JSON.parse(card.getAttribute('data-photos') || '[]'); } catch (e) { /* ignore */ }
      if (!photos.length) {
        const photo = card.querySelector('.project-photo');
        const bg = photo ? photo.style.backgroundImage.replace(/url\(['"]?|['"]?\)/g, '') : '';
        if (bg) photos = [bg];
      }
      const title = card.querySelector('h3');
      const meta = card.querySelector('.project-meta');
      const caption = (title ? title.textContent : '') + (meta ? ' \u2014 ' + meta.textContent : '');
      openLightbox(photos, caption);
    });
  });

  lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showPhoto(currentIndex - 1); });
  lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showPhoto(currentIndex + 1); });
  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPhoto(currentIndex - 1);
    if (e.key === 'ArrowRight') showPhoto(currentIndex + 1);
  });
}
