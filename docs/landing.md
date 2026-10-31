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
direct links. Mobile feature cards scroll horizontally with scroll snapping,
touch and keyboard access, without horizontal page overflow.

Images and SVGs in `public/assets/landing/` come from the supplied Figma file:
`KpEhai0ctHWr2HlNrs2BD2`, Home `250:4258` and Mobile `254:100`. The screenshot,
transparent phone, cockpit, wordmark, signature and icons remain separate assets.
The 700px breakpoint switches between the two original compositions; dimensions
scale continuously and translated copy can grow vertically. Progressive blur
uses masked backdrop filters, preserving the cockpit's source image.

The application launch loader is removed synchronously for browser visits,
before modules load. It remains in the installed application. The phone is
anchored to the hero's bottom edge, with a small zoom instead of vertical
scroll displacement, so the image cannot reveal a gap above the black section.

The signature has a fixed square shape. Its logo, description and credits form
one vertical group anchored 9.3% from the left and bottom edges. Complete
translations grow upward inside a safe area; fitting runs after font loading
and on resize, without ellipsis or clipping. Compact layouts give the group
more height while preserving its bottom alignment.

Entrance and intersection animations plus small scroll effects honour
`prefers-reduced-motion`, including preference changes while the page is open.
Scroll work uses one scheduled animation frame per scroll update and has no
continuous idle loop. All assets participate in the existing offline build.

Install uses the browser's deferred native prompt when available. Otherwise it
opens the existing platform-specific guide; iOS uses Share → Add to Home Screen.
The browser stays on the landing after installation and explains how to launch
from the app icon. Browsers decide whether to offer an immediate Open action.
