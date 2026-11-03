# Final release review — 1.73

Reviewed on 3 November 2026 against the current working tree, with its existing changes retained. The audit started from `1.0.72`; the fixes are prepared for deployment as `1.0.73`. The production build is in `dist/`; the GitHub Pages workflow handles publication.

## Corrections

- Ride title and route edits read the current ride inside their write transaction. Independent edits preserve each other's fields. A delayed save reports a missing ride instead of recreating a session deleted in another window. Reanalysis also checks the current stored sessions and preserves their latest titles and corrected routes.
- IndexedDB request errors are captured from the failing request. Writes reject only after the transaction has rolled back, preserving the actual error rather than rejecting with a null `transaction.error`. Synchronous failures in asynchronous edit callbacks also abort cleanly. App reset uses the same transaction completion rules.
- Modelled power coverage merges overlapping timer stops and clips them to the session's elapsed interval. For example, 40 seconds of sensors within 60 active seconds no longer pass the 80% coverage requirement because two stops overlap. Original measurements, recorded zeroes and missing sensors remain separate.
- All-time Progress totals, monthly rows and power records now use the same completed-ride rules. Rides dated in the future, reversed sessions and duplicate IDs do not contribute to these totals.
- Route speed colours reuse the merged pause index instead of scanning every timer stop for every adjacent reading. Power records build each block's integral once for all requested effort durations, retaining only compact results in the cache. Projected speed remains display-only `routeSpeed`; corrected terrain does not enter training calculations.

Release notes remain English, with `lang="en"`, `translate="no"` and `data-no-localize` on the release log.

## Verification

- 294 automated tests passed, with no failures or skipped tests.
- Syntax and static local-import checks passed for 102 application, locale and build/serve modules.
- Production build succeeded: 250 files, cache `b653f90c71650c`.
- Five Chromium suites reported 167 passing browser checks with no uncaught JavaScript errors. These cover native IndexedDB request failures and rollback, concurrent edits, delayed rename after deletion, reanalysis after deletion, FIT worker import, backup round trips, original-byte preservation, failed saves and retries, smart-goal deletion, month/year boundaries, future rides, missing measurements, language switching, weather notices, an upgrade from 1.64 and offline startup. The native storage harness contains additional individual assertions within its reported suite check.
- Browser runs used temporary profiles and isolated loopback origins with synthetic data. Third-party requests were blocked or replaced by fixtures. No personal browser profile or real ride history was used.

An alternating-order Node.js 24.22.1 benchmark used fresh rides with 50,001 records, ten runs per version and two discarded warmups. The pause-heavy cases contain 600 timer stops. Serialized numerical outputs matched by SHA-256 before and after the performance changes.

| Calculation | Before, median | After, median |
| --- | ---: | ---: |
| Route speed profile, 600 stops | 201.43 ms | 12.48 ms |
| Power records, 600 stops | 12.02 ms | 10.33 ms |
| Power records, continuous recording | 18.09 ms | 11.20 ms |

These are timings of individual calculation functions on this machine, not total app startup or physical-phone performance. Benchmark code, baseline modules, measurements and browser counts are retained under `artifacts/release-1.72/final-audit/`. Run the benchmark with `node artifacts/release-1.72/final-audit/benchmark.mjs`. Browser screenshots and detailed checks remain in each suite's artifact folder.

## Remaining acceptance

Physical iPhone/Safari and Android/Chrome installation, standalone relaunch, storage eviction and native touch behaviour still need device checks. Chromium emulation does not establish those operating-system behaviours. Live map, weather and elevation service availability was not tested; their fixture-based success and failure paths were checked. Vendored Garmin and MapLibre internals were not independently audited. Existing backup restore limits remain 200 MB and 300 original FIT files.

---

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
