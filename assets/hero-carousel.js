/**
 * Homepage hero carousel: manual nav (arrows + dots) plus autoplay with
 * pause-on-hover/focus. Respects prefers-reduced-motion by skipping autoplay.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-hero-carousel]').forEach(setUpCarousel);
  });

  function setUpCarousel(root) {
    var track = root.querySelector('[data-hero-track]');
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    var prevButton = root.querySelector('[data-hero-prev]');
    var nextButton = root.querySelector('[data-hero-next]');

    if (!track || slides.length < 2) return;

    var currentIndex = 0;
    var autoplayEnabled = root.getAttribute('data-autoplay') === 'true';
    var autoplaySpeed = parseInt(root.getAttribute('data-autoplay-speed'), 10) || 6000;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var autoplayTimer = null;

    function goTo(index) {
      currentIndex = (index + slides.length) % slides.length;

      track.style.transform = 'translateX(-' + currentIndex * 100 + '%)';

      slides.forEach(function (slide, i) {
        var isActive = i === currentIndex;
        slide.classList.toggle('is-active', isActive);
        if (isActive) {
          slide.removeAttribute('aria-hidden');
        } else {
          slide.setAttribute('aria-hidden', 'true');
        }
      });

      dots.forEach(function (dot, i) {
        var isActive = i === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function next() {
      goTo(currentIndex + 1);
    }

    function prev() {
      goTo(currentIndex - 1);
    }

    function startAutoplay() {
      if (!autoplayEnabled || reducedMotion) return;
      stopAutoplay();
      autoplayTimer = window.setInterval(next, autoplaySpeed);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    if (prevButton) {
      prevButton.addEventListener('click', function () {
        prev();
        startAutoplay();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        next();
        startAutoplay();
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        goTo(i);
        startAutoplay();
      });
    });

    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('focusin', stopAutoplay);
    root.addEventListener('focusout', startAutoplay);

    goTo(0);
    startAutoplay();
  }
})();
