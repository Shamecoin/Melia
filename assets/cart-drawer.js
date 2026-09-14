// Slide-in cart drawer, backed by Shopify's AJAX Cart API (/cart/add.js,
// /cart/change.js, /cart.js) so line-item changes never leave the page.
// The drawer has its own backdrop and escape-key handling rather than
// sharing header.js's mega-menu/mobile-menu state, so it works the same
// way regardless of which header state (transparent or solid) is active —
// it's simply a higher-stacked fixed overlay.
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  var drawer, backdrop, body, footer, subtotalEl, toggles, closeBtn;
  var moneyFormat = window.Shopify && window.Shopify.money_format;

  function init() {
    drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;

    backdrop = document.querySelector('[data-cart-drawer-backdrop]');
    body = drawer.querySelector('[data-cart-drawer-body]');
    footer = drawer.querySelector('[data-cart-drawer-footer]');
    subtotalEl = drawer.querySelector('[data-cart-drawer-subtotal]');
    toggles = document.querySelectorAll('[data-cart-drawer-toggle]');
    closeBtn = drawer.querySelector('[data-cart-drawer-close]');

    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function (event) {
        event.preventDefault();
        open();
        refresh();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });

    document.addEventListener('click', handleDelegatedClicks);
    document.addEventListener('submit', handleProductFormSubmit);

    window._meliaCloseCartDrawer = close;
  }

  function open() {
    drawer.hidden = false;
    window.requestAnimationFrame(function () {
      drawer.classList.add('is-open');
    });
    if (backdrop) {
      backdrop.hidden = false;
      window.requestAnimationFrame(function () {
        backdrop.classList.add('is-visible');
      });
    }
    document.body.style.overflow = 'hidden';
  }

  function close() {
    drawer.classList.remove('is-open');
    window.setTimeout(function () {
      drawer.hidden = true;
    }, 300);
    if (backdrop) {
      backdrop.classList.remove('is-visible');
      window.setTimeout(function () {
        backdrop.hidden = true;
      }, 200);
    }
    document.body.style.overflow = '';
  }

  /* ---- Intercept "Add to Cart" forms anywhere on the page ---- */

  function handleProductFormSubmit(event) {
    var form = event.target.closest('form');
    if (!form || form.getAttribute('action').indexOf('/cart/add') === -1) return;
    event.preventDefault();

    var submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(formDataToObject(new FormData(form))),
    })
      .then(function (response) {
        if (!response.ok) return response.json().then(function (err) { throw err; });
        return response.json();
      })
      .then(function () {
        open();
        return refresh();
      })
      .catch(function (err) {
        console.error('Add to cart failed', err);
      })
      .finally(function () {
        if (submitButton) submitButton.disabled = false;
      });
  }

  function formDataToObject(formData) {
    var obj = {};
    formData.forEach(function (value, key) {
      obj[key] = value;
    });
    return obj;
  }

  /* ---- Quantity +/- and remove, delegated from the drawer body ---- */

  function handleDelegatedClicks(event) {
    var increase = event.target.closest('[data-cart-qty-increase]');
    var decrease = event.target.closest('[data-cart-qty-decrease]');
    var remove = event.target.closest('[data-cart-remove]');
    if (!increase && !decrease && !remove) return;

    var item = event.target.closest('[data-cart-line]');
    if (!item) return;
    var line = parseInt(item.getAttribute('data-cart-line'), 10);

    if (remove) {
      changeLine(line, 0);
      return;
    }

    var valueEl = item.querySelector('[data-cart-qty-value]');
    var current = parseInt(valueEl.textContent, 10) || 1;
    var next = increase ? current + 1 : Math.max(0, current - 1);
    changeLine(line, next);
  }

  function changeLine(line, quantity) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity }),
    })
      .then(function (response) { return response.json(); })
      .then(render)
      .catch(function (err) {
        console.error('Cart update failed', err);
      });
  }

  /* ---- Fetch + render ---- */

  function refresh() {
    return fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (response) { return response.json(); })
      .then(render);
  }

  function render(cart) {
    updateCartCount(cart.item_count);

    if (!cart.items.length) {
      body.innerHTML = '<p class="cart-drawer__empty" data-cart-drawer-empty>' + emptyMessage() + '</p>';
      footer.hidden = true;
      return;
    }

    footer.hidden = false;
    subtotalEl.textContent = formatMoney(cart.total_price);

    var list = document.createElement('ul');
    list.className = 'cart-drawer__items';
    list.setAttribute('role', 'list');
    list.setAttribute('data-cart-drawer-items', '');

    cart.items.forEach(function (item, index) {
      var li = document.createElement('li');
      li.className = 'cart-drawer__item';
      li.setAttribute('data-cart-line', index + 1);

      var mediaHtml = item.image
        ? '<img src="' + item.image + '" alt="' + escapeHtml(item.product_title) + '" class="cart-drawer__item-image" loading="lazy">'
        : '<span class="cart-drawer__item-placeholder" aria-hidden="true"></span>';

      li.innerHTML =
        '<div class="cart-drawer__item-media">' + mediaHtml + '</div>' +
        '<div class="cart-drawer__item-details">' +
          '<p class="cart-drawer__item-title">' + escapeHtml(item.product_title) + '</p>' +
          '<p class="cart-drawer__item-price" data-cart-line-price>' + formatMoney(item.final_line_price) + '</p>' +
          '<div class="cart-drawer__item-controls">' +
            '<div class="cart-drawer__qty">' +
              '<button type="button" class="cart-drawer__qty-btn" data-cart-qty-decrease aria-label="Decrease quantity">&minus;</button>' +
              '<span class="cart-drawer__qty-value" data-cart-qty-value>' + item.quantity + '</span>' +
              '<button type="button" class="cart-drawer__qty-btn" data-cart-qty-increase aria-label="Increase quantity">&plus;</button>' +
            '</div>' +
            '<button type="button" class="cart-drawer__remove" data-cart-remove>Remove</button>' +
          '</div>' +
        '</div>';

      list.appendChild(li);
    });

    body.innerHTML = '';
    body.appendChild(list);
  }

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  function emptyMessage() {
    var existingEmpty = document.querySelector('[data-cart-drawer-empty]');
    return existingEmpty ? existingEmpty.textContent : 'Your cart is empty.';
  }

  function formatMoney(cents) {
    var amount = (cents / 100).toFixed(2);
    if (moneyFormat) {
      return moneyFormat.replace(/\{\{\s*amount\s*\}\}/, amount);
    }
    return '€' + amount;
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }
})();
