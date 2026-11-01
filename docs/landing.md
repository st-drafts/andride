# Landing page

The existing GitHub Pages root serves both the landing and the PWA. `src/entry.js`
loads the landing in a normal browser and the application when launched in
standalone display mode (including iOS's `navigator.standalone`). The manifest
identity, scope, start URL and all stored ride data are unchanged.

For local development, `/andride/` previews the landing and
`/andride/?view=app` opens the application. The latter shortcut only applies to
localhost; it does not bypass installation on GitHub Pages. Build and serve with
`npm run build` and `npm run dev`.

The landing shares the application's 38-language catalog. On first use it
chooses a supported browser/system language, falling back to English. A manual
selection is saved in the shared `andride-language` preference. An explicit
`?lang=` link overrides that preference. Automatic language detection does not
save a preference. Complete landing sentences live in `src/landing-copy.js`;
decorative icon tokens are substituted only after translation. The installation
guide uses the existing app translations and platform detection.

The fixed lower-right menu contains Install, About and ride, and Language.
About and ride and the introductory link navigate to `#about`, the black section
with the handlebar. Native anchors support history, keyboard navigation and
direct links. Mobile feature cards form two columns, with the third card below.
On desktop the signature triangle is lifted to align its bottom edge with the
install link. It is anchored to the content's bottom edge without shifting the link.
Feature copy uses font weight 500 and 130% line spacing on mobile and desktop, and grows vertically
with each translation without horizontal page overflow.
Feature descriptions and the signature logo, description and credits use
`#9A9A9A`. Mobile spacing before the install link and between the link and triangle
uses the same `--landing-install-gap` value.

Images and SVGs in `public/assets/landing/` come from the supplied Figma file:
`KpEhai0ctHWr2HlNrs2BD2`, Home `250:4258` and Mobile `254:100`. The screenshot,
transparent phone, cockpit, wordmark, signature and icons remain separate assets.
The 700px breakpoint switches between the two compositions; dimensions scale
continuously and translated copy can grow vertically. The desktop hero fits the
window height and scales the phone down for shorter windows. The mobile hero
uses the updated 402×584 composition and the phone's 442×442 source placement.
The phone entrance animates scale only, remaining opaque throughout.

The cockpit is exported from Figma with progressive blur already rendered:
desktop 1512×980 and mobile 402×752, rendered
against the section's black background. A picture
element selects the appropriate WebP. The original 4.2 MiB image and all browser
blur layers are removed; mobile scrolling does not run parallax updates. This
keeps animation limited to opacity and transforms of already rendered assets.

The application launch loader is removed synchronously for browser visits,
before modules load. It remains in the installed application. The phone is
anchored to the hero's bottom edge, with a small zoom instead of vertical
scroll displacement, so the image cannot reveal a gap above the black section.

The signature has a fixed square shape. Its logo, description and credits form
one vertical group anchored 9.3% from the left and bottom edges. Complete
translations grow upward inside a safe area; fitting runs after font loading
and on resize, without ellipsis or clipping. Compact layouts give the group
more height while preserving its bottom alignment. Description and credits use
120% line spacing in every layout.

Entrance and intersection animations plus small scroll effects honour
`prefers-reduced-motion`, including preference changes while the page is open.
Scroll work uses one scheduled animation frame per scroll update and has no
continuous idle loop. All assets participate in the existing offline build.

Install uses the browser's deferred native prompt when available. Otherwise it
opens the existing platform-specific guide; iOS uses Share → Add to Home Screen.
The browser stays on the landing after installation and explains how to launch
from the app icon. Browsers decide whether to offer an immediate Open action.

## Cached entry migration — 1.53

Older service workers served the root and index document from their cache first,
which could hide the new landing while another app window kept an update waiting.
After a complete successful precache, a new worker refreshes those two entry
documents and the small entry bootstrap in previous app caches. This initially used `landing-v` queries for modules and CSS. That old worker
normalizes those queries to its cached canonical paths, so changing the release
number alone cannot reliably refresh a landing while the installed app is open.
The 1.65 migration below replaces that mechanism.
Existing app modules, map caches and personal
storage are untouched. No forced activation or client navigation interrupts a
running installed app. Browser navigation under the new worker tries the network
first and falls back to its own cached index document when offline.

On mobile, the signature triangle overlaps the preceding content and rises with scroll near the page end. Only its transform changes during scrolling; reduced-motion mode retains the static layout and spacing.

Installation uses the same Pages entry with `?install=1`; the installed PWA still opens the application. Desktop landing actions open a QR dialog; mobile actions navigate directly to the device-specific guide. The QR points to the production installation URL without a language override, allowing the phone's system language to select its own translation. The guide selects instructions automatically and keeps the Figma composition free of extra controls. Native installation is offered only after `beforeinstallprompt`; it never skips the guide or the desktop QR choice. New copy is complete for all 38 locales; existing translated installation sentences are reused.

The QR SVG was generated locally using Project Nayuki's QR Code generator (MIT), with medium error correction and a four-module quiet zone. No external QR service or runtime dependency is used.

Installation visual target: Figma nodes `274:4352` (402×814) and `274:4374` (500×500). Original exported SVG artwork is stored under `assets/landing/install-*.svg`. The page uses Inter Display SemiBold, 26px / 135%, and a bottom-aligned instruction group (20px sides, 20px bottom at the reference size). The desktop dialog uses 40px padding and gaps, a 30px radius, and a 210px QR slot. Each locale has a complete instruction with inline emphasis/icon tokens; text may wrap naturally while retaining the geometry and hierarchy.

The updated desktop dialog has a fixed 500×500 reference size; its footer sits about 19px above the bottom. The close control has no focus outline. Keyboard focus uses a subtle icon opacity change instead. The Android Chrome menu glyph `⋮` is emphasized in white in every locale.


## Public cache refresh — 1.65

Builds fingerprint the input paths and bytes, package version, build script and
service-worker template. The generated HTML loads `entry.js?site-v=<fingerprint>`;
the entry, landing/installation module graph, landing CSS, image URLs and landing
font use that fingerprint. It changes for a design or cache-policy change without
requiring a manually edited release query. The small entry bootstrap has no
static imports and uses the browser/standalone mode selected by the inline HTML.
Installed-app modules continue to use their existing canonical cache keys.

The new `site-v` namespace bypasses the legacy worker's `landing-v` normalization.
For tagged public files, the new worker revalidates the HTTP cache with
`cache: 'no-cache'` and returns `Cache-Control: no-cache` so browser memory/HTTP
caches cannot indefinitely reuse those successful responses. Successful current
public resources are saved for offline fallback. Failed requests do not replace
working cache entries, and unknown future fingerprints do not grow the active
cache. A complete precache creates exact versioned aliases locally, without
another download; even the legacy worker can find these aliases while the next
app worker is waiting. HTML navigation also revalidates the HTTP cache.

There is no automatic `skipWaiting`, app-window navigation, unregister, IndexedDB
migration or database/storage clearing in this fix. FIT files, ride records,
profile, goals and preferences keep their existing stores and values. The normal
installed-app update action retains its import/restore guards. A normal landing
reload requests the new design; an already open page does not replace its UI
without navigation. If a very old browser document persists, a one-time link such
as `?refresh=1.65` requests another HTML URL without deleting any site data.

Verification: 254 unit tests, 23 general browser checks and 14 upgrade checks each
in Chromium and WebKit. The upgrade suite starts with the actual 1.64 build,
keeps the installed app open, seeds an original FIT plus ride/profile/goal data,
loads two subsequent landing versions through the legacy worker, compares the
stored bytes/records, checks offline fallback and then lets the worker activate
normally after the old clients close. A separate clean HTTP-cache context
verifies the new revalidation policy against long-lived upstream headers.

The optional upgrade command is `node tests/browser-landing-cache.mjs`, using
`PLAYWRIGHT_MODULE` when Playwright is installed outside the repository.
`PREVIOUS_BUILD` points to an actual built 1.64 directory; locally the saved
baseline is `artifacts/landing-cache-fix/previous-build`. Set `BROWSER_ENGINE=webkit`
(and `PLAYWRIGHT_BROWSERS_PATH` if needed) for WebKit. WebKit network loss is
simulated by disconnecting the local test server, because Playwright's offline
emulation currently rejects service-worker navigation even for a literal response
([Playwright issue 42775](https://github.com/microsoft/playwright/issues/42775)).
Chromium also tests browser offline mode. These isolated contexts do not open or
modify a personal Safari profile. Physical iPhone installation remains a device
check.

Cache semantics follow [MDN's Request.cache documentation](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache).
The decision to retain waiting activation protects existing open clients, as
explained in [the service-worker lifecycle](https://web.dev/articles/service-worker-lifecycle).


## WebP assets — included in the pending 1.65 build

All four raster images in the landing now use WebP at their original dimensions.
RGB encoding uses quality 90 for the photo cutout/cockpits and 95 for the interface
screenshot. The alpha channel uses quality 100 and is verified byte-for-byte
against each source after decoding. The phone image retains all 256 alpha levels,
including its transparent screen and partially transparent edges. This preserves
transparency; RGB compression is lossy. Original ICC profiles are preserved when
present. The visual comparisons were checked at useful display sizes on both
white and black backgrounds.

| Asset | Source bytes | WebP bytes |
| --- | ---: | ---: |
| Phone cutout | 561,717 | 94,670 |
| Interface screenshot | 209,737 | 106,762 |
| Desktop cockpit | 442,769 | 29,174 |
| Mobile cockpit | 85,207 | 7,946 |
| Total | 1,299,430 | 238,552 |

The four-file total falls by 81.6%. A viewport loads only its appropriate cockpit;
the complete offline precache retains both WebP variants. Legacy PNG URLs remain
available to old cached pages, but converted PNG counterparts are excluded from
both the new precache and the versioned alias list so users do not download both
formats for offline installation. The source files remain available for future
exports. The local server serves `.webp` as `image/webp`.

Regenerate with `python3 scripts/optimize-landing-images.py` using Pillow with
WebP support. The script rejects changed dimensions, changed alpha bytes or an
output larger than its source. WebP decoding and responsive selection were tested
in desktop/mobile Chromium and during a 1.64-to-1.65 cache upgrade in WebKit.
[WebP supports lossless alpha alongside lossy RGB](https://developers.google.com/speed/webp/docs/compression).
