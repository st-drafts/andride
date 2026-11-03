# Training review — 1.74

The six training improvements are local features. They use original FIT measurements, stored profile settings and recorded feedback. Projected map speeds, corrected geometry, terrain elevations and estimated watts do not enter power records or effort classification.

## Power and recovery spacing

Intellect retains its existing heart-rate and RPE evidence and additionally considers time in measured power zones. Its conservative hard-work heuristic requires a valid FTP for the ride date, at least 80% measured-power coverage, at least ten minutes in Z4–Z7 and at least 15% of measured time in those zones. Recorded zero watts count towards coverage; missing watts and recording gaps do not. A missing FTP is distinct from missing power: coverage can still be shown, while relative intensity and power-based classification remain unavailable.

These cutoffs are product heuristics for spacing sessions. They do not diagnose fatigue, establish recovery time or certify readiness. They are tested as application rules, not clinically validated thresholds.

The ride summary displays normalized power only when FIT records it. IF is that value divided by the effective FTP. No NP is synthesized from speed, estimated watts or incomplete recordings. The definition of IF follows [Andrew Coggan's explanation](https://www.trainingpeaks.com/learn/articles/normalized-power-intensity-factor-training-stress/); the hard-work cutoffs above are separate application choices.

## Reserved workouts

Upcoming unlinked manual workouts reserve their date and minutes. Automatic sessions check all rolling seven-day windows containing their date, including later manual commitments beyond the displayed week. Multiple commitments on one day add together; duplicate plan IDs, invalid values and past commitments are ignored. A plan linked to an existing completed ride is not counted again.

Explicit manual workouts remain visible even if they exceed the suggested volume. The planner does not add automatic volume to an already overloaded window. Planned minutes are kept separate from recorded minutes and never count as completed goal progress. Link a FIT ride after completing a manual workout.

## Dated FTP

Profile history contains effective local calendar dates and FTP values. An empty value switches back to the FTP in each FIT from that date onward. Earlier rides retain their prior threshold. Users can choose an explicit, reversible global override to recalculate all rides with the entered FTP.

An existing global FTP remains effective for old rides when it is first changed; a baseline entry preserves that meaning. A first-ever setting applies only from its chosen date, so earlier rides continue using their recorded thresholds. Original FIT thresholds and bytes are never rewritten. History, mode and current value participate in calculation-cache invalidation.

## Workout inspector

Power, heart rate, cadence and speed share a time selection. Drag across the chart, use either time slider, or select a recorded lap. The summary integrates the same original intervals for all sensors. Timer pauses are merged and excluded, intervals longer than ten seconds are rejected, and missing sensor values do not become zero. Recorded zero cadence remains no pedalling. Each sensor shows its coverage of the selected active time.

The line chart uses independent scales identified by its legend. It is a compact display, while selected averages use time integrals. Lap checkboxes compare recorded repeats with duration, power, heart rate, cadence and power difference from the first selected lap. Where time records are absent, recorded lap-summary power or heart rate may be shown; missing values remain unavailable.

Prefix integrals belong to the mounted inspector. Subsequent selection queries use binary searches rather than rescanning the full recording. Navigation disposes observers, theme subscriptions, pointer listeners, capture and scheduled frames.

## Recent progress

The default is the latest 30 local calendar days, including today. The preceding 30 days form its comparison window. The 90-day option works the same way. Season means January 1 through today, compared with the same dates of the preceding year; February 29 is clipped to February 28 where necessary. All time retains the full completed history and has no previous-period comparison.

Totals, monthly rows and power records use the same selected rides. Invalid, future and duplicate rides are excluded. Historical record calculations yield between rides and cancel on navigation. A zero-power effort is a valid result; missing efforts are not filled.

## Time goals and events

Personal planning supports distance, total training hours, hours per calendar week and an event date. Count goals remain simple progress goals. Weekly goals reset on local Monday, and a completed current week does not cancel planning in the following week. Availability, comfort, experience and recorded load continue limiting volume; a larger target does not force a training increase.

Events reserve the event date without inventing completion or a distance target. During the final seven calendar days the application reduces its automatic time budget and rolling cap to 60% of baseline, excludes automatic intervals and keeps explicit manual commitments. This is a conservative default, not an individualized race taper or a promise of race readiness.

## Storage, copy and verification

Backup version 2 preserves dated FTP and the new goal kinds. It prevents older applications from silently discarding those fields. Version 1 backups remain readable. Goal saves, profile saves and restores publish updated state only after storage commits.

New interface copy is bundled for all 38 languages. Full templates are translated before formatted values are inserted. Release notes remain English and excluded from interface localization.

Automated tests cover original-data preservation, power-only rides, missing thresholds, dated and global FTP, linked and future commitments, rolling caps, weekly boundaries, event dates, partial sample integration, pauses, zero cadence, DST, leap days, period comparisons and translation placeholders. The browser workflow is `tests/browser-training.mjs`; it uses synthetic FIT and isolated profiles. It also checks backup round trips and mobile/desktop layout. Physical-phone installation and hardware gestures remain device acceptance checks.
