// "News and Recipes" filter pills. "All" shows every card; the other two
// filter to entries whose data-category matches, since both blogs render
// into a single merged grid rather than separate tab panels.
(function () {
  'use strict';

  document.querySelectorAll('[data-news-recipes]').forEach(function (root) {
    var triggers = Array.prototype.slice.call(root.querySelectorAll('[data-filter-trigger]'));
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-category]'));
    if (!triggers.length || !items.length) return;

    function activate(key) {
      triggers.forEach(function (trigger) {
        var isActive = trigger.getAttribute('data-filter-trigger') === key;
        trigger.classList.toggle('is-active', isActive);
        trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      items.forEach(function (item) {
        var matches = key === 'all' || item.getAttribute('data-category') === key;
        item.hidden = !matches;
      });
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        activate(trigger.getAttribute('data-filter-trigger'));
      });
    });
  });
})();
