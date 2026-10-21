# and Ride — UX review, 21 October 2026

UX changes prepared for release 0.24. Deployment authorized by the user on 21 October 2026.

## Structure

- **Overview:** chosen periods, distance/time/elevation, comparison, daily distance, latest ride.
- **Rides:** search across the full history; month/day filtering when search is empty; whole cards open rides.
- **Ride:** name/date, distance and recorded metrics, inline 3D route, shared sensor graph, heart-rate zones, energy. Individual graphs, data provenance and management actions use disclosures.
- **Progress:** all-time totals, monthly volume, measured power records when available, goals.
- **Plan:** calendar, manually planned sessions and links to imported rides; destructive actions are secondary.
- **More:** training (profile, goals) and app (settings, backup, about).
- **Settings:** language, local storage, help and updates. Installed apps do not repeat installation instructions as a primary action.

## Changes

1. Welcome leads directly to the first FIT import. Intro/FIT explanation remain available as help.
2. Removed repeated import buttons on import/onboarding pages, duplicate Progress entry, repeated dates in ride cards and repeated measured power in the energy section.
3. Search is no longer silently limited to the visible month. Clearing search restores the calendar.
4. Detailed comparison metrics and methodology remain available on demand.
5. Route controls, individual sensor charts and technical tools are secondary; rename, original FIT and deletion remain available.
6. Open disclosures survive changes to the active sensor or overlay. New pages start at the top.
7. Consistent 44 px minimum action targets; 44 px ride-card icons; icon/value pairs stay together on wrapping.
8. Calendar dates use large bold typography. Imported rides glow orange. The range picker uses the dialog’s gray background and an unfilled orange outline.
9. New copy is translated into Russian, English, French, German, Spanish and Japanese.

## Validation

- 29 automated data, physiology, calendar and route-coordinate tests passed.
- Browser walkthrough: direct import, duplicate prevention controls, whole-history search, rename, sensor selection, disclosure state, route rendering, terrain failure/success and original GPS restoration.
- Main pages checked at 320, 393 and 1440 px without horizontal overflow.
- Five non-Russian locales checked across onboarding, overview, rides, workout, progress, plan, menus, storage, installation and route editor: no Russian fallback strings or page errors.
- Figma active screens and shared calendars updated with editable nodes; broader explanatory/reference screens remain available.

Physical iPhone validation of native status-bar blur remains outstanding until the user’s next device test. The original review iteration stayed local; release 0.24 includes these changes.
