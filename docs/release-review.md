# Release review — 1.64

Reviewed on 1 November 2026. Package version: `1.0.64`. The production build is in `dist/`; this review does not publish it.

## Corrections

- Backups include the IDs of the retained sessions in each original FIT. Deleting one session from a multi-session file no longer causes it to reappear after a new backup is restored. Original FIT bytes are preserved. Backups without the optional session list remain supported and restore all cycling sessions, as before.
- Restore adds a missing session even when another session from the same original is already stored. Reads inside the write transaction preserve existing ride records and avoid restoring a concurrently deleted ride through stale title/route metadata.
- Duplicate FIT imports check for the original and insert it in the same transaction. Concurrent imports commit once instead of racing into a duplicate-key error.
- The Progress power curve uses the same measured-power integration as ride analysis: timer pauses, missing power and recording gaps break effort windows; irregular sample boundaries are handled consistently.
- Plan creation/linking, goal deletion and profile changes update the displayed state only after storage succeeds. Goal deletion and selected-goal changes commit together. Confirmation/save dialogs prevent duplicate submission, keep the form available after an error and report the failure.
- Storage usage counts each original FIT once when it contains multiple sessions.

Release notes remain English and excluded from interface localization. Missing sensor values remain distinct from recorded zeroes. Map-projected speeds and terrain corrections remain separate from FIT measurements and training calculations.

## Verification

- 248 automated tests passed, with no failures or skipped tests. Coverage includes FIT integrity/scaling, pauses, cadence zeroes, missing sensors, power records, physiology, planning, dates/DST, 38 languages, route projection, map caching and service-worker updates.
- Syntax and static local-import checks passed for 99 application, locale and script modules.
- Production build succeeded: 243 files, cache `c4e8c8be0e594b`.
- 21 browser checks passed in temporary Chrome contexts on an isolated loopback server. They exercise native IndexedDB concurrency and rollback, FIT import through the worker, multi-session deletion/backup/restore, original-byte preservation, invalid backup rejection, power records through a pause, forced storage failures and retries, duplicate form submission, atomic goal deletion, profile persistence, installation pages, service-worker installation and startup/language switching with the network disabled. No uncaught JavaScript errors occurred.
- Desktop installation, iPhone-sized installation, mobile backup and offline settings screenshots were inspected. Results and synthetic artifacts are written to `artifacts/release-1.64/`.

Run the regular checks with `npm test` and `npm run build`. The optional browser suite is `node tests/browser-release.mjs`; it needs Playwright and Chrome. Set `PLAYWRIGHT_MODULE` to an installed Playwright module path when it is outside the project's module search path, and `BROWSER_CHANNEL` to select another installed Chromium channel. The suite creates its own server and temporary browser contexts, uses synthetic data, and closes them on completion. It does not use a personal browser profile.

## Acceptance still requiring devices or live services

Physical iPhone/Safari and Android/Chrome installation, standalone relaunch, system storage eviction and native touch behaviour still require device checks. Chromium emulation verifies page routing and layout, not those operating-system behaviours. Live weather, elevation and third-party map availability are not guaranteed by offline browser tests; their validation and failure paths are covered separately. Existing restore limits remain 200 MB and 300 original FIT files. Vendored Garmin and MapLibre internals were not independently audited.
