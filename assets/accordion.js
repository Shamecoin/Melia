// Reusable accordion behavior — used by the FAQ page and the product page's
// "How to Use" / "Ingredients" sections. Delegated at the document level so
// it works for any number of accordion instances added later.
(function () {
  'use strict';

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-accordion-trigger]');
    if (!trigger) return;

    var item = trigger.closest('[data-accordion-item]');
    var panel = item ? item.querySelector('[data-accordion-panel]') : null;
    if (!panel) return;

    var isOpen = trigger.getAttribute('aria-expanded') === 'true';

    trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    panel.hidden = isOpen;
  });
})();
