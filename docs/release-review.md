# Training improvements — 1.74

Prepared locally on 3 November 2026. Package version: `1.0.74`. The existing working changes were retained. This section records local implementation and verification; it does not record a production deployment.

## Implemented

- Intellect considers measured power alongside heart rate and RPE. Manual workouts reserve their dates and minutes in every affected rolling seven-day window. An unlinked manual workout remains pending even if another ride is recorded on the same day.
- FTP changes have effective dates. Earlier rides retain their thresholds, with an explicit reversible option to recalculate all rides using one FTP.
- The ride screen places a synchronized workout inspector before narrative and map sections. Users can select a time interval, inspect power/heart rate/cadence/speed over the same boundaries and compare recorded laps. FIT normalized power and relative intensity appear in the summary.
- Progress offers 30-day, 90-day, season and all-time windows. Totals and power records share those windows, with a preceding-period comparison and asynchronous historical calculations.
- Personal plans support distance, total hours, weekly hours and an event date. The event date is reserved; the final week uses a conservative reduced time budget. These are planning heuristics, not individualized recovery or race-readiness assessments.
- New copy is bundled in all 38 interface languages. Backup version 2 preserves FTP history and new goal types; version 1 remains readable. Original FIT bytes and recorded sensors remain unchanged.

Detailed rules and limitations are documented in [training.md](training.md).

## Verification

- 312 automated tests passed, with no failures or skipped tests.
- 166 browser checks passed across the new training workflow, general release scenarios, Intellect audit and weather notices. No uncaught JavaScript errors occurred. Runs used temporary Chromium profiles, synthetic FIT and isolated loopback origins at mobile and desktop widths.
- The training workflow covers native FIT import, shared interval values, recorded zero cadence, lap comparison, mouse selection and pointer cancellation, recent records, dated FTP, reversible global recalculation, reserved manual rides, weekly/event goals, language switching, unchanged original records and version 2 backup round trips.
- The general release suite also restores a legacy version 1 backup and verifies database rollback, failed-save retries, deletion, worker import, installation routing and offline startup.
- Syntax and local-import checks passed for 121 application, locale, build/serve and browser-test modules. `git diff --check` passed.
- Production build succeeded: 260 files, cache `be16caecd31d6a`.

On this machine, preparing selection integrals for 100,001 records and 1,000 timer pauses took 32.90 ms. Ten thousand selection queries took 21.88 ms in total, approximately 0.0022 ms each. These measurements describe the calculation functions in Node.js 24.22.1, not complete mobile rendering or app startup. Reproduce with `node artifacts/release-1.74/benchmark-selection.mjs`.

Logs, browser screenshots, measurements and a change manifest are under `artifacts/release-1.74/`. Physical iPhone/Android installation and native hardware gestures remain device acceptance checks.

---

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
