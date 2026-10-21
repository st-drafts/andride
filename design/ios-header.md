# iOS status-bar blur investigation

The installed-app screenshot shows a soft blur over the brand even with an opaque black background and `backdrop-filter: none`. This resembles the native iOS scroll-edge/status-bar compositor effect reported by other PWA authors. It is a hypothesis, not an on-device diagnosis: we do not know the reporter's exact iOS version and cannot reproduce the system overlay in Chromium emulation.

Primary sources checked on 2026-10-21:

- WebKit change 296485 describes suppressing the scroll-edge effect when a viewport-constrained element extends a solid colour into the top inset: https://results.webkit.org/commit?uuid=175056451300
- MeshMonitor's device report and follow-up: https://github.com/Yeraze/meshmonitor/issues/5286
- Their later fix pins the actual top bar to the viewport instead of leaving it in the scrolling document: https://github.com/Yeraze/meshmonitor/commit/c95a83a088d8a5d227896bda3334bbfd528306ce
- Independent on-device CSS experiments also report a dedicated fixed top-edge element changing the system blur: https://tips.ojapp.app/en/ios-27-pwa-top-blur-workaround-2/

## Local change

On mobile, the real brand header is fixed to the full viewport width at top:0, with a solid black background and no filter or transform. Its controls keep the existing safe-area padding plus 4px clearance. An equally tall space is reserved before page content. Inner horizontal padding follows the existing 430px shell. A real non-interactive 1px black DOM element at the viewport's top edge supplies an unambiguous top-edge paint even during launch and installation screens. It remains outside the rerendered app subtree. Desktop layout stays sticky. Header links never acquire hover opacity.

No hidden animated panels, global scroll locks, forced scroll nudges or UA version assumptions are introduced. Native scroll and map gestures remain in place.

## Verification limits

Browser checks verify header position and background, safe-area geometry, content clearance, route changes, scrolling, dialog open/close, six languages, mobile widths and desktop layout. They cannot establish whether iOS's native overlay is gone. On an actual iPhone, update the installed app, cold-launch it, scroll down/up, open and cancel rename, background/resume it and rotate it. Compare portrait screenshots before/after without adding extra padding. If blur persists, record the iOS version and device before choosing another workaround.
