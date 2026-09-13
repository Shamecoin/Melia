/**
 * Site header behavior: transparent-over-hero / solid-on-scroll toggling,
 * mega menu, currency stub, search overlay, mobile menu.
 *
 * Mega menu and mobile menu are shells only — inner content is placeholder
 * and gets wired up in a later step.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var header = document.querySelector('[data-site-header]');
    if (!header) return;

    setUpHeightVar(header);
    setUpScrollState(header);
    setUpMegaMenus();
    setUpCurrencyPanel();
    setUpSearchOverlay();
    setUpMobileMenu();
    setUpEscapeKey();
  }

  function isTouchDevice() {
    return window.matchMedia('(hover: none)').matches;
  }

  /* ---- Header height custom property, used to position the mega menu
     and search overlay flush beneath the header at any viewport size ---- */

  function setUpHeightVar(header) {
    function update() {
      document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
    }
    update();
    window.addEventListener('resize', update);
  }

  /* ---- Transparent over hero / solid on scroll ----
     Reads the hero section's live height via getBoundingClientRect on every
     scroll (throttled with rAF) rather than a hardcoded pixel offset, so it
     keeps working if the hero's height changes (responsive images, content
     edits, etc). Pages without a `[data-hero]` element, or with the header's
     "transparent over hero" setting turned off, get a solid header from the
     start. */

  function setUpScrollState(header) {
    var transparentEnabled = header.classList.contains('site-header--transparent-enabled');
    var hero = document.querySelector('[data-hero]');

    if (!transparentEnabled || !hero) {
      header.classList.add('site-header--solid');
      return;
    }

    var ticking = false;

    function evaluate() {
      var heroBottom = hero.getBoundingClientRect().bottom;
      var overlappingHero = heroBottom > header.offsetHeight;
      header.classList.toggle('site-header--solid', !overlappingHero);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        evaluate();
        ticking = false;
      });
    }

    evaluate();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', evaluate);
  }

  /* ---- Shared backdrop for mega menu / mobile menu ---- */

  var backdrop = document.querySelector('[data-header-backdrop]');
  var megaMenuOpenKey = null;
  var mobileMenuOpen = false;

  function showBackdrop() {
    if (!backdrop) return;
    backdrop.hidden = false;
    window.requestAnimationFrame(function () {
      backdrop.classList.add('is-visible');
    });
  }

  function hideBackdropIfIdle() {
    if (!backdrop || megaMenuOpenKey || mobileMenuOpen) return;
    backdrop.classList.remove('is-visible');
    window.setTimeout(function () {
      if (!megaMenuOpenKey && !mobileMenuOpen) backdrop.hidden = true;
    }, 200);
  }

  /* ---- Mega menu (Shop / Learn) ---- */

  function setUpMegaMenus() {
    var triggers = document.querySelectorAll('[data-mega-menu-trigger]');
    if (!triggers.length) return;

    var hoverTimeout;
    var pointerOverTriggerKey = null;

    function openMenu(key) {
      triggers.forEach(function (t) {
        var tKey = t.getAttribute('data-mega-menu-trigger');
        if (tKey !== key) closeMenu(tKey);
      });

      var trigger = document.querySelector('[data-mega-menu-trigger="' + key + '"]');
      var panel = document.getElementById('MegaMenu-' + key);
      if (!trigger || !panel) return;

      trigger.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      window.requestAnimationFrame(function () {
        panel.classList.add('is-open');
      });
      showBackdrop();
      megaMenuOpenKey = key;
    }

    function closeMenu(key) {
      var trigger = document.querySelector('[data-mega-menu-trigger="' + key + '"]');
      var panel = document.getElementById('MegaMenu-' + key);
      if (!trigger || !panel) return;

      trigger.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');
      window.setTimeout(function () {
        panel.hidden = true;
      }, 200);

      if (megaMenuOpenKey === key) megaMenuOpenKey = null;
      hideBackdropIfIdle();
    }

    function closeAll() {
      triggers.forEach(function (t) {
        closeMenu(t.getAttribute('data-mega-menu-trigger'));
      });
    }

    triggers.forEach(function (trigger) {
      var key = trigger.getAttribute('data-mega-menu-trigger');
      var item = trigger.closest('li');

      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        // A mouse click on a trigger the pointer is already resting on is
        // part of the same hover interaction that just opened this menu
        // (mouseenter always fires first) — treat it as "keep open", not a
        // toggle, or hovering then clicking would instantly close it again.
        // Keyboard (Enter/Space) and touch taps never set pointerOverTriggerKey,
        // so they still get the normal open/close toggle.
        if (!isTouchDevice() && pointerOverTriggerKey === key) {
          openMenu(key);
          return;
        }
        if (megaMenuOpenKey === key) {
          closeMenu(key);
        } else {
          openMenu(key);
        }
      });

      if (item) {
        item.addEventListener('mouseenter', function () {
          if (isTouchDevice()) return;
          pointerOverTriggerKey = key;
          window.clearTimeout(hoverTimeout);
          openMenu(key);
        });
        item.addEventListener('mouseleave', function () {
          if (isTouchDevice()) return;
          if (pointerOverTriggerKey === key) pointerOverTriggerKey = null;
          hoverTimeout = window.setTimeout(function () {
            closeMenu(key);
          }, 150);
        });
      }
    });

    document.querySelectorAll('[data-mega-menu]').forEach(function (panel) {
      var key = panel.getAttribute('data-mega-menu');
      panel.addEventListener('mouseenter', function () {
        if (isTouchDevice()) return;
        window.clearTimeout(hoverTimeout);
      });
      panel.addEventListener('mouseleave', function () {
        if (isTouchDevice()) return;
        hoverTimeout = window.setTimeout(function () {
          closeMenu(key);
        }, 150);
      });
    });

    if (backdrop) {
      backdrop.addEventListener('click', closeAll);
    }

    window._meliaCloseMegaMenus = closeAll;
  }

  /* ---- Currency / region selector (UI stub — see comment in header.liquid) ---- */

  function setUpCurrencyPanel() {
    var toggle = document.querySelector('[data-currency-toggle]');
    var panel = document.querySelector('[data-currency-panel]');
    if (!toggle || !panel) return;

    function close() {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }

    function open() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function (event) {
      event.stopPropagation();
      if (panel.hidden) {
        open();
      } else {
        close();
      }
    });

    document.addEventListener('click', function (event) {
      if (!panel.hidden && !panel.contains(event.target)) close();
    });

    window._meliaCloseCurrencyPanel = close;
  }

  /* ---- Search overlay ---- */

  function setUpSearchOverlay() {
    var toggle = document.querySelector('[data-search-toggle]');
    var overlay = document.querySelector('[data-search-overlay]');
    var closeBtn = document.querySelector('[data-search-close]');
    var input = document.querySelector('[data-search-input]');
    if (!toggle || !overlay) return;

    function open() {
      overlay.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      window.setTimeout(function () {
        if (input) input.focus();
      }, 50);
    }

    function close() {
      overlay.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function () {
      if (overlay.hidden) {
        open();
      } else {
        close();
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', close);

    window._meliaCloseSearchOverlay = close;
  }

  /* ---- Mobile menu drawer ---- */

  function setUpMobileMenu() {
    var toggle = document.querySelector('[data-mobile-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    var closeBtn = document.querySelector('[data-mobile-menu-close]');
    if (!toggle || !menu) return;

    function open() {
      menu.hidden = false;
      window.requestAnimationFrame(function () {
        menu.classList.add('is-open');
      });
      toggle.setAttribute('aria-expanded', 'true');
      mobileMenuOpen = true;
      showBackdrop();
      document.body.style.overflow = 'hidden';
    }

    function close() {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      window.setTimeout(function () {
        menu.hidden = true;
      }, 300);
      mobileMenuOpen = false;
      document.body.style.overflow = '';
      hideBackdropIfIdle();
    }

    toggle.addEventListener('click', function () {
      if (mobileMenuOpen) {
        close();
      } else {
        open();
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);

    window._meliaCloseMobileMenu = close;
  }

  /* ---- Escape key closes any open overlay ---- */

  function setUpEscapeKey() {
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (window._meliaCloseMegaMenus) window._meliaCloseMegaMenus();
      if (window._meliaCloseCurrencyPanel) window._meliaCloseCurrencyPanel();
      if (window._meliaCloseSearchOverlay) window._meliaCloseSearchOverlay();
      if (window._meliaCloseMobileMenu) window._meliaCloseMobileMenu();
    });
  }
})();
