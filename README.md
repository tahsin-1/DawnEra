# Dawn Era
**A streetwear storefront built with HTML, CSS, and vanilla JavaScript.**

[Website](https://dawnera.netlify.app) · [Quick start](#run-locally) · [Code guide](#code-guide) · [Review checklist](#manual-review-checklist)

## Project overview

Dawn Era is a frontend project for my streetwear brand. It brings product browsing, size selection, a cart, a wishlist, and brand information into a multi-page website.

**Status:** frontend prototype with products marked "Coming soon." The repository contains static pages and browser-side JavaScript; it does not include a payment processor, account system, or order-management backend.

## Explore the project

1. Open the home page to see the brand introduction and featured products.
2. Visit the shop and select a product size.
3. Add items to the cart or wishlist, then reload to examine browser persistence.
4. Change the visual theme.
5. Open the FAQ assistant and try a question about sizing.
6. Read the code guide below to follow how these interactions are organized.

The contact page includes external WhatsApp links and an early-access form. Submitting the form can send data to the deployed site's form service; it is not required to explore the frontend.

## Features

- Home, shop, story, and contact pages.
- Product size selection, quick view, cart, and wishlist interfaces.
- Browser-local cart, wishlist, and theme persistence.
- Six theme options.
- Keyword-based FAQ assistant with predefined responses.
- Shared dialog focus management and Escape-key handling.
- Web app manifest, icons, and a service worker.
- Early-access form markup and submission code for Netlify Forms.

The FAQ assistant uses local keyword matching; it does not call a language-model API.

## Stack

| Layer | Implementation |
| --- | --- |
| Pages | Semantic HTML |
| Styling | Shared CSS in `assets/css/style.css` |
| Interactions | Vanilla JavaScript and DOM events |
| Persistence | `localStorage` via `DawnStorage` |
| Caching | Browser Service Worker and Cache APIs |
| Fonts | Google Fonts |
| Hosting integration | Static hosting; Netlify Forms markup |

## Run locally

No npm install or build step is required.

### VS Code

Clone or download the repository, open its root folder in VS Code, and serve `index.html` using a local web server such as the Live Server extension.

### Python 3

If Python 3 is installed:

```bash
git clone https://github.com/tahsin-1/DawnEra.git
cd DawnEra
python -m http.server 8000
```

Open **http://localhost:8000**. On Windows, `py -m http.server 8000` is an alternative if the Python launcher is installed.

Serve the repository at the server root: service-worker and cache paths start with `/`. Opening files directly with `file://` does not reproduce service-worker behavior. Google Fonts requires network access; the Netlify form backend is not provided by a local static server.

## Code guide

| File | Responsibility |
| --- | --- |
| `index.html` | Home page and featured-product configuration |
| `shop.html` | Shop page |
| `story.html` | Brand story |
| `contact.html` | Contact options, early-access form, countdown |
| `assets/css/style.css` | Shared layout, component styles, themes |
| `assets/js/storage.js` | Storage keys, item validation, versioned writes, fallback handling |
| `assets/js/app.js` | Shared UI initialization, cart/wishlist, quick view, themes, modal management |
| `assets/js/nav.js` | Navigation behavior |
| `assets/js/chat-widget.js` | Keyword-based FAQ widget |
| `manifest.json` | Web app metadata |
| `service-worker.js` | Precaching and request caching |

**Suggested reading order:** `index.html` → `storage.js` → `app.js` → `chat-widget.js`.

## Implementation notes

**Shared behavior:** pages initialize `DawnApp` with product configuration. Common UI behavior lives in shared scripts rather than being repeated on every page.

**Storage boundary:** `DawnStorage` validates item shapes, reads legacy arrays as well as versioned payloads, and catches unavailable or full-storage errors. State stays in the visitor's browser; there is no cross-device account synchronization.

**Keyboard interaction:** shared modal helpers manage focus and a stack of close handlers. These mechanisms should be checked in actual keyboard and assistive-technology testing; their presence alone is not an accessibility certification.

**Caching:** HTML requests use a network-first strategy. Other GET requests use a cache-first strategy. The current precache list omits `app.js` and `storage.js`, so a full offline workflow should not be assumed.

## Manual review checklist

These are repeatable review steps, not a record of tests already passed.

- [ ] Open all four pages at mobile and desktop widths; check for horizontal overflow.
- [ ] Add and remove cart/wishlist items; reload and compare the persisted state.
- [ ] Change themes and verify that the selection survives a reload.
- [ ] Navigate with Tab and Shift+Tab; open and close dialogs with the keyboard.
- [ ] Check Escape handling and focus return after closing a dialog.
- [ ] Try known and unknown questions in the FAQ widget.
- [ ] Inspect console errors and failed network requests.
- [ ] After an online visit, test offline behavior and identify missing cached assets.
- [ ] On a controlled deployment, verify successful and failed form submissions.

No automated test suite is currently included in this repository.

## Next improvements

- Complete the offline asset list and verify cache-update behavior.
- Check HTTP response status before displaying form-submission success.
- Replace the placeholder Instagram link and launch countdown when real details are ready.
- Add focused automated tests for storage and cart/wishlist behavior.
- Perform and document mobile, keyboard, and accessibility checks.

## Author

[Md. Tahsin](https://github.com/tahsin-1) — learning frontend development through practical projects.
