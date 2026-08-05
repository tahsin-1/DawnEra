/* Dawn Era — Storage layer
   Wraps localStorage with schema versioning, basic validation, and quota-safe writes.
   The exported shape (schemaVersion, cart, wishlist, exportedAt) is intentionally
   API-ready — when there's a real backend, exportPayload() can be POSTed as-is
   to sync a guest's local cart/wishlist to their account on login/signup. */
window.DawnStorage = (function () {
  var SCHEMA_VERSION = 1;
  var KEYS = { cart: 'dawnera_cart', wishlist: 'dawnera_wishlist', theme: 'dawnera_theme' };

  function isValidItem(item) {
    return !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string';
  }

  function get(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      // Supports both the legacy flat-array format and the new {v, items} format,
      // so older data already saved in a visitor's browser still loads correctly.
      var items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);
      return items.filter(isValidItem);
    } catch (e) {
      console.warn('DawnStorage: could not read "' + key + '", starting fresh.', e);
      return [];
    }
  }

  function set(key, items) {
    var safeItems = Array.isArray(items) ? items.filter(isValidItem) : [];
    var payload = JSON.stringify({ v: SCHEMA_VERSION, updatedAt: new Date().toISOString(), items: safeItems });
    try {
      localStorage.setItem(key, payload);
      return true;
    } catch (e) {
      // Storage full or blocked (private browsing, etc). Try trimming the oldest
      // entry once rather than losing the whole cart/wishlist silently.
      if (e && (e.name === 'QuotaExceededError' || e.code === 22) && safeItems.length > 1) {
        console.warn('DawnStorage: storage full, dropping oldest item and retrying.');
        return set(key, safeItems.slice(1));
      }
      console.warn('DawnStorage: write to "' + key + '" failed, change will not persist.', e);
      return false;
    }
  }

  function getTheme() {
    try { return localStorage.getItem(KEYS.theme) || 'light'; } catch (e) { return 'light'; }
  }
  function setTheme(name) {
    try { localStorage.setItem(KEYS.theme, name); return true; } catch (e) { return false; }
  }

  // Bundles current cart + wishlist into one API-ready payload for a future
  // "sync to my account" backend call.
  function exportPayload() {
    return {
      schemaVersion: SCHEMA_VERSION,
      cart: get(KEYS.cart),
      wishlist: get(KEYS.wishlist),
      exportedAt: new Date().toISOString()
    };
  }

  return { KEYS: KEYS, get: get, set: set, getTheme: getTheme, setTheme: setTheme, exportPayload: exportPayload };
})();
