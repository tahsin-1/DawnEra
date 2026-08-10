/* Dawn Era — app.js
   Shared logic for theme switching, cart/wishlist, and quick view — used by every page.
   Each page calls DawnApp.init({ products: {...} }) with its own product data (if any).
   Requires storage.js to be loaded first. */
window.DawnApp = (function () {
  'use strict';

  var WHATSAPP_NUMBER = '8801997307069';
  function buildWaLink(message) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  }

  // Mirrors --dawn-navy per theme in style.css, so the browser/PWA chrome
  // color follows whichever theme is active instead of staying stuck on Light.
  var THEME_NAVY = {
    light: '#10192B', dark: '#1A1A1C', golden: '#5C3521',
    luxury: '#141210', minimal: '#1C1C1C', cyber: '#150F26'
  };

  // Tracks which modals are currently open, in open order, so Escape (and
  // closeTopModal) only ever closes the most recently opened one instead of
  // every open modal at once — which previously caused a focus-restore race
  // when a modal was opened from inside another modal (e.g. Size Guide from
  // Quick View).
  var modalStack = [];
  function pushModal(closeFn) { modalStack.push(closeFn); }
  function popModal(closeFn) {
    var i = modalStack.indexOf(closeFn);
    if (i > -1) modalStack.splice(i, 1);
  }
  function closeTopModal() {
    if (!modalStack.length) return false;
    modalStack[modalStack.length - 1]();
    return true;
  }

  // Traps Tab/Shift+Tab inside `container` and focuses `focusTarget` (or the
  // container's first focusable element if not given). Returns a release()
  // function that removes the trap and restores focus to whatever was
  // focused before the modal opened. Each call is self-contained (its own
  // returnEl + its own listener) so two modals never interfere with each
  // other's focus history.
  function trapFocus(container, focusTarget) {
    if (!container) return function () {};
    var returnEl = document.activeElement;
    var focusables = container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var first = focusables[0], last = focusables[focusables.length - 1];
    // Deferred two animation frames out: clicking a <button> makes some
    // browsers re-focus that button shortly after the click handler runs —
    // sometimes across more than one frame — which would otherwise silently
    // undo a focus() call made synchronously from inside that same handler.
    // Verified empirically: a single rAF was not always enough; two is reliable.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var toFocus = focusTarget || first;
        if (toFocus && typeof toFocus.focus === 'function') toFocus.focus();
      });
    });
    function onKeydown(e) {
      if (e.key !== 'Tab' || !first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKeydown);
    return function release() {
      container.removeEventListener('keydown', onKeydown);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (returnEl && typeof returnEl.focus === 'function') returnEl.focus();
        });
      });
    };
  }

  function init(config) {
    config = config || {};
    var PRODUCTS = config.products || {};
    var root = document.documentElement;
    root.classList.add('js-ready');

    /* Loader */
    window.addEventListener('load', function () {
      setTimeout(function () {
        var loader = document.getElementById('loader');
        if (loader) loader.classList.add('is-hidden');
      }, config.loaderDelay || 400);
    });

    /* Reveal on scroll */
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reveals = document.querySelectorAll('.reveal');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } });
      }, { threshold: 0.15 });
      reveals.forEach(function (el) { obs.observe(el); });
    }

    /* Scroll progress + back to top */
    var progressBar = document.getElementById('scrollProgress');
    var backToTop = document.getElementById('backToTop');
    if (progressBar || backToTop) {
      window.addEventListener('scroll', function () {
        var h = document.documentElement;
        if (progressBar) progressBar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
        if (backToTop) backToTop.classList.toggle('is-visible', h.scrollTop > 500);
      });
      if (backToTop) {
        backToTop.addEventListener('click', function () {
          window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
        });
      }
    }

    /* Theme switcher */
    var themeToggle = document.getElementById('themeToggle');
    var themePanel = document.getElementById('themePanel');
    var themeOpts = document.querySelectorAll('.theme-opt');
    var themeColorMeta = document.querySelector('meta[name="theme-color"]');
    function applyTheme(name) {
      if (name === 'light') { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', name); }
      DawnStorage.setTheme(name);
      themeOpts.forEach(function (o) { o.classList.toggle('is-active', o.getAttribute('data-theme') === name); });
      if (themeColorMeta && THEME_NAVY[name]) themeColorMeta.setAttribute('content', THEME_NAVY[name]);
    }
    if (themeToggle && themePanel) {
      applyTheme(DawnStorage.getTheme());
      themeToggle.addEventListener('click', function () {
        themeToggle.setAttribute('aria-expanded', themePanel.classList.toggle('is-open'));
      });
      themeOpts.forEach(function (opt) {
        opt.addEventListener('click', function () { applyTheme(opt.getAttribute('data-theme')); themePanel.classList.remove('is-open'); });
      });
      document.addEventListener('click', function (e) { if (!e.target.closest('.theme-switcher')) themePanel.classList.remove('is-open'); });
    }

    /* Cart + Wishlist */
    function getList(key) { return DawnStorage.get(key); }
    function setList(key, list) { DawnStorage.set(key, list); renderCounts(); renderDrawer(); }
    function renderCounts() {
      var cartCount = document.getElementById('cartCount');
      var wishCount = document.getElementById('wishCount');
      if (cartCount) cartCount.textContent = getList('dawnera_cart').length;
      if (wishCount) wishCount.textContent = getList('dawnera_wishlist').length;
    }

    var cwDrawer = document.getElementById('cwDrawer');
    var cwBackdrop = document.getElementById('cwBackdrop');
    function renderDrawer() {
      var activeTabEl = document.querySelector('.cw-tab.is-active');
      var itemsEl = document.getElementById('cwItems');
      if (!activeTabEl || !itemsEl) return;
      var activeTab = activeTabEl.getAttribute('data-tab');
      var list = getList(activeTab === 'cart' ? 'dawnera_cart' : 'dawnera_wishlist');
      if (list.length === 0) {
        itemsEl.innerHTML = '<p class="cw-empty">' + (activeTab === 'cart' ? 'Your cart is empty.' : 'Your wishlist is empty.') + '</p>';
        return;
      }
      itemsEl.innerHTML = list.map(function (item, i) {
        var meta = activeTab === 'cart' ? ('Size ' + item.size) : 'Saved for later';
        return '<div class="cw-item"><div><p class="cw-item__name">' + item.name + '</p><p class="cw-item__meta">' + meta + '</p></div><button class="cw-item__remove" data-idx="' + i + '" aria-label="Remove">\u2715</button></div>';
      }).join('');
      itemsEl.querySelectorAll('.cw-item__remove').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = activeTab === 'cart' ? 'dawnera_cart' : 'dawnera_wishlist';
          var arr = getList(key);
          arr.splice(parseInt(btn.getAttribute('data-idx'), 10), 1);
          setList(key, arr);
        });
      });
    }
    var cwRelease = null;
    function openDrawer(tab) {
      if (!cwDrawer || !cwBackdrop) return;
      document.querySelectorAll('.cw-tab').forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-tab') === tab); });
      renderDrawer();
      cwDrawer.classList.add('is-open');
      cwBackdrop.classList.add('is-open');
      cwRelease = trapFocus(cwDrawer);
      pushModal(closeDrawer);
    }
    function closeDrawer() {
      if (!cwDrawer || !cwBackdrop || !cwDrawer.classList.contains('is-open')) return;
      cwDrawer.classList.remove('is-open');
      cwBackdrop.classList.remove('is-open');
      if (cwRelease) { cwRelease(); cwRelease = null; }
      popModal(closeDrawer);
    }
    var cartToggleBtn = document.getElementById('cartToggle');
    var wishToggleBtn = document.getElementById('wishToggle');
    if (cartToggleBtn) cartToggleBtn.addEventListener('click', function () { openDrawer('cart'); });
    if (wishToggleBtn) wishToggleBtn.addEventListener('click', function () { openDrawer('wishlist'); });
    var cwCloseBtn = document.getElementById('cwClose');
    if (cwCloseBtn) cwCloseBtn.addEventListener('click', closeDrawer);
    if (cwBackdrop) cwBackdrop.addEventListener('click', closeDrawer);
    document.querySelectorAll('.cw-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { openDrawer(tab.getAttribute('data-tab')); });
    });

    function addToCart(id, btnEl) {
      var p = PRODUCTS[id];
      if (!p) return;
      var card = btnEl.closest('.drop-card, .product-card, .qv-modal');
      var sizeSel = card ? card.querySelector('select') : null;
      var size = sizeSel ? sizeSel.value : '';
      var cart = getList('dawnera_cart');
      cart.push({ id: id, name: p.name, size: size });
      setList('dawnera_cart', cart);
      var old = btnEl.textContent;
      btnEl.textContent = 'Added \u2713';
      setTimeout(function () { btnEl.textContent = old; }, 1100);
      openDrawer('cart');
    }

    function toggleWishlist(id, btnEl) {
      var p = PRODUCTS[id];
      if (!p) return;
      var wish = getList('dawnera_wishlist');
      var idx = wish.findIndex(function (w) { return w.id === id; });
      if (idx > -1) { wish.splice(idx, 1); btnEl.classList.remove('is-active'); btnEl.textContent = '\u2661'; }
      else { wish.push({ id: id, name: p.name }); btnEl.classList.add('is-active'); btnEl.textContent = '\u2665'; }
      setList('dawnera_wishlist', wish);
    }

    /* Quick View */
    var qvBackdrop = document.getElementById('qvBackdrop');
    var currentQvId = null;
    var qvRelease = null;
    function openQuickView(id) {
      var p = PRODUCTS[id];
      if (!p || !qvBackdrop) return;
      currentQvId = id;
      var catEl = document.getElementById('qvCat');
      var nameEl = document.getElementById('qvName');
      var sizeEl = document.getElementById('qvSize');
      if (catEl) catEl.textContent = p.category;
      if (nameEl) nameEl.textContent = p.name;
      if (sizeEl) sizeEl.innerHTML = p.sizes.map(function (s) { return '<option>' + s + '</option>'; }).join('');
      qvBackdrop.classList.add('is-open');
      qvRelease = trapFocus(qvBackdrop);
      pushModal(closeQuickView);
    }
    function closeQuickView() {
      if (!qvBackdrop || !qvBackdrop.classList.contains('is-open')) return;
      qvBackdrop.classList.remove('is-open');
      if (qvRelease) { qvRelease(); qvRelease = null; }
      popModal(closeQuickView);
    }
    if (qvBackdrop) {
      var qvCloseBtn = document.getElementById('qvClose');
      var qvAddBtn = document.getElementById('qvAdd');
      if (qvCloseBtn) qvCloseBtn.addEventListener('click', closeQuickView);
      qvBackdrop.addEventListener('click', function (e) { if (e.target === qvBackdrop) closeQuickView(); });
      if (qvAddBtn) {
        qvAddBtn.addEventListener('click', function () {
          if (currentQvId) addToCart(currentQvId, this);
          setTimeout(closeQuickView, 500);
        });
      }
    }

    /* Product card interactions — replaces inline onclick="" attributes */
    document.querySelectorAll('[data-product]').forEach(function (card) {
      var id = card.getAttribute('data-product');
      var wishBtn = card.querySelector('.drop-card__wish, .product-card__wish');
      if (wishBtn) wishBtn.addEventListener('click', function () { toggleWishlist(id, wishBtn); });
      var addBtn = card.querySelector('.drop-card__add, .product-card__add');
      if (addBtn) addBtn.addEventListener('click', function () { addToCart(id, addBtn); });
      var qvTriggers = card.querySelectorAll('.drop-card__top, .product-card__image, .product-card__name');
      qvTriggers.forEach(function (el) {
        el.addEventListener('click', function () { openQuickView(id); });
        // These were plain <div>/<p> elements — not focusable or operable by
        // keyboard at all. Adding button semantics makes Quick View reachable
        // via Tab and usable with Enter/Space, and gives focus-restore-on-close
        // an actual element to return focus to.
        if (!el.hasAttribute('tabindex')) {
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', 'Quick view');
          el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openQuickView(id); }
          });
        }
      });
    });

    /* Restore wishlist heart state on load */
    getList('dawnera_wishlist').forEach(function (w) {
      var btn = document.querySelector('[data-product="' + w.id + '"] .drop-card__wish, [data-product="' + w.id + '"] .product-card__wish');
      if (btn) { btn.classList.add('is-active'); btn.textContent = '\u2665'; }
    });

    /* WhatsApp links driven by the single WHATSAPP_NUMBER constant above */
    document.querySelectorAll('[data-wa-link]').forEach(function (el) {
      el.href = buildWaLink(el.getAttribute('data-wa-link') || 'Hi Dawn Era!');
    });

    renderCounts();

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!closeTopModal() && themePanel) themePanel.classList.remove('is-open');
    });

    return { addToCart: addToCart, toggleWishlist: toggleWishlist, openQuickView: openQuickView };
  }

  return {
    init: init, buildWaLink: buildWaLink, WHATSAPP_NUMBER: WHATSAPP_NUMBER,
    trapFocus: trapFocus, pushModal: pushModal, popModal: popModal, closeTopModal: closeTopModal
  };
})();
