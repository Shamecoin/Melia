/**
 * "Honey" tabbed product section: swaps the visible product-grid panel
 * based on the selected tab.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-honey-tabs]').forEach(setUpTabs);
  });

  function setUpTabs(root) {
    var triggers = Array.prototype.slice.call(root.querySelectorAll('[data-tab-trigger]'));
    if (!triggers.length) return;

    function activate(key) {
      triggers.forEach(function (trigger) {
        var isActive = trigger.getAttribute('data-tab-trigger') === key;
        trigger.classList.toggle('is-active', isActive);
        trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      root.querySelectorAll('[data-tab-panel]').forEach(function (panel) {
        var isActive = panel.getAttribute('data-tab-panel') === key;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      });
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        activate(trigger.getAttribute('data-tab-trigger'));
      });
    });
  }
})();
