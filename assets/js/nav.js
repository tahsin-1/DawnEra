/* Dawn Era — mobile nav (hamburger) toggle.
   New file: previously there was no way to reach Shop/Story/Contact from a
   phone-width screen once the old CSS hid `.nav__links` under 640px. */
(function () {
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');
  if (!burger || !links) return;

  function closeMenu() {
    links.classList.remove('is-open');
    burger.classList.remove('is-active');
    burger.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    var open = links.classList.toggle('is-open');
    burger.classList.toggle('is-active', open);
    burger.setAttribute('aria-expanded', String(open));
  }

  burger.addEventListener('click', toggleMenu);
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 860) closeMenu();
  });
})();
