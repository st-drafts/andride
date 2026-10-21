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

## Follow-up after the iPhone 16 report

The user confirmed the fixed header plus 1px strip still blurred on an iPhone 16 running their latest iOS, while other installed PWAs did not. Do not treat that experiment as a verified fix or infer a precise iOS version. A proposed control shift was not published and is removed. No root-scrolling changes are being made.

The user supplied a workaround describing a real opaque viewport-constrained element at top:0, at least 6px tall and 80% of viewport width. Test that narrow change first: the existing DOM strip now has width:100%, height:max(6px, env(safe-area-inset-top)), opaque black paint, z-index:9999 and pointer-events:none. It is neither a pseudo-element nor clipped/transparent. It stays outside the app render subtree. The logo geometry, content start and 4px standalone clearance are unchanged. With zero safe inset, the 6px strip remains within the existing blank top margin before brand controls.

Checks cover safe insets 0, 20, 47, 59 and 62px, viewport widths from 320px to landscape and desktop, real element bounds/background/pointer behavior, native document scroll, navigation and rename dialogs. These verify the workaround geometry, not the system blur result. Re-test a cold launch on an installed iPhone before calling this resolved.

## Isolated scroll-pane experiment after the 6px layer failed

The reporter confirmed the minimum-height solid strip also failed. The next local experiment changes scrolling ownership, without moving the logo or changing safe-area/header height. At mobile widths, the root document cannot scroll; main#content is an independent fixed scroll pane between the header and bottom navigation. Both bars remain siblings outside that pane. The bottom edge reserves the actual nav height including the home-indicator inset. Onboarding scrolls to the bottom of the viewport because it has no tab bar. Desktop retains document scrolling. Installation/error screens without a brand header also retain normal document scrolling.

Route changes reset the content scroll position, while same-page renders preserve it alongside disclosure state. Page entry animations fade the scroll pane rather than transforming it; individual content animations still work. Native dialogs remain outside the pane in the top layer. Map pointer handling is unchanged.

This is a structural experiment, not evidence that the iOS compositor blur has been removed. Browser checks must cover both scroll owners, reaching the last item, bottom-nav clearance, dialog focus/save/cancel, map interaction, route reset, same-page scroll preservation, orientation and desktop behavior before testing again on the actual installed iPhone.
