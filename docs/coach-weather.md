# Weather-aware coaching

Selected weekdays are strict availability. Automatic workouts never move onto an
unselected day. The planner evaluates actual feasible sessions before choosing a
schedule; a nominal four-session week is no longer a quota independent of load.

## Joint schedule and workload selection

There are at most seven candidate dates. The coach enumerates their subsets
(at most 127), then allocates minutes chronologically using recorded FIT time,
earlier proposed sessions, the rolling seven-day guideline, session limits,
readiness, recovery and forecast caution. A subset containing a session below
15 minutes is rejected rather than treated as a selected workout with zero time.
It cannot introduce a third consecutive active day or lengthen a longer streak
already present in recorded history.

The regular reference is the lowest-cost feasible schedule at the highest viable
session count, capped at four. An alternative may use one fewer session if it
retains at least 80% of the reference's feasible minutes and its mean temperature
comfort cost improves by at least four units. Eligible alternatives are ranked
by average schedule cost, with a penalty for the lost session and lost minutes.
A flat or unknown forecast keeps the regular session count. Unused time is not
added later as catch-up debt. These are explicit product preference weights,
not physiological or medically validated optimization thresholds.

For the regression fixture with all seven weekdays selected, four days at +18°C
followed by three at +6°C, the model now selects three warm-day workouts totalling
150 minutes, instead of four mixed-weather workouts totalling 180 minutes. The
fixture includes 180 recorded minutes in the past seven days and a 210-minute
rolling guideline. Actual capacity and recovery can still require a cooler day
in other histories. Three consecutive workouts are not introduced to chase warmth.

## Weather ranking and its limits

The relative thermal comfort cost adds two units per degree below a daytime
maximum of 15°C or above 25°C, capped at 24 units. A caution forecast adds 24 units
and retains its existing duration reduction. Wind and gust costs, consecutive-day
costs and the preference for spreading work also apply. The longer workout and
interval selection use the same weather ranking. A cold night alone does not
penalize a mild daytime maximum. Unknown or incomplete forecasts receive no cost
advantage over known forecasts. Stale forecasts do not steer temperature choices.

Daily maxima, minima, maximum wind/gusts and precipitation are day-level summaries;
they do not describe the intended hour of a ride. See [Open-Meteo's daily variable
definitions](https://open-meteo.com/en/docs). The UI displays daily highs in the
week strip, with the full minimum/maximum in the title. These inputs cannot
establish individual comfort, fitness or route safety.

The coach still uses conservative endurance-first rules, recorded workload,
self-reported readiness and hard-effort recovery. The [2025 training-distribution
review](https://pubmed.ncbi.nlm.nih.gov/39888556/) does not establish one universally
best distribution; [Saw et al.](https://pubmed.ncbi.nlm.nih.gov/26423706/) supports
monitoring subjective wellbeing, not a diagnosis or these exact scoring weights.

## Optional suggestion on a rest day

One suggestion may target any unrecorded rest day, selected or unselected, within
the current plan and goal dates. The scheduled workout remains in place and the
target remains a rest day; no availability or history is changed automatically.
Both dates require complete fresh forecasts. The source must have a workout and
a daytime high below 15°C. The target must be at least 4°C warmer, improve thermal
comfort, have an available outdoor forecast, and be within three calendar days.

Small forecast differences do not veto a substantial temperature improvement:
target wind may be up to 2 km/h higher, gusts up to 3 km/h higher, precipitation up
to the greater of the source forecast and 1 mm, and precipitation probability up
to 10 percentage points higher when the source probability is known. A caution
or avoid target is never eligible. Invalid optional fields make data incomplete.
The copy describes a more comfortable forecast without promising identical wind
or rain. This tolerance does not change outdoor caution or avoidance thresholds.

The hypothetical move must fit every affected rolling seven-day guideline,
including recorded work. Existing overload cannot increase. Streak, readiness,
missing check-in, hard-effort recovery and long/interval separation checks remain.
Minutes are transferred hypothetically, never added. Only the greatest comfort
improvement is shown, with shorter moves preferred on a tie. A visible card on
Overview and above the goal dashboard in Intellect gives the full suggestion and
source/target dates. Its action opens the target rest day. Advice also remains
in the target day details.

## Visible controls and data integrity

Goal cards expose Edit. Delete is a separate action at the bottom of the edit
page, below Save and Cancel, and is absent from new-goal pages. It is disabled
while a save is pending. Deletion uses the existing
confirmation and atomic transaction for goals and the selected goal. A failure
rolls both changes back. Another goal becomes selected when available. Deleting
the last goal returns to goal creation. Successful deletion leaves the edit page
and returns to its overview or Intellect origin; cancellation preserves the draft. Rides, original FIT files, readiness and
training preferences remain intact.

The plan shows recorded minutes in the past seven days and the rolling guideline.
A rest day constrained by remaining capacity says so instead of giving a generic
spacing reason. A reduced-count weather window has a separate visible explanation.
All new explanations are complete translated sentences in all 38 interface
languages; values and localized dates are inserted afterwards.

The weather panel is above the week and has an explicit refresh button. Automatic
refresh retains the one-hour cache interval; manual refresh bypasses it. A failed
or empty response retains the previous cache, reports the failure and permits a
retry. Replanning preserves unsaved settings and readiness forms, including their
sleep picker and slider accessibility state. Submitted forms use saved values.

## Verification

`tests/coach-weather.test.mjs` covers relative temperature preference, optional
moves, strict availability, load, recovery, forecast completeness and localization.
`tests/coach-audit.test.mjs` adds the all-weekdays warm-window regression, ordinary
and missing weather, capacity reasons, a deterministic scenario matrix and visible
smart-goal controls. The existing six-week simulation remains part of the unit run.

After building, run `node tests/browser-coach-audit.mjs` and
`node tests/browser-coach-weather.mjs`. `BUILD_DIR` can select an isolated build,
`BROWSER_ENGINE=webkit` selects WebKit, and `PLAYWRIGHT_MODULE` locates an external
Playwright installation. The audit checks mobile and desktop, forced forecast
refresh and failure, unsaved forms, localization, goal deletion cancellation,
rollback on the second write, duplicate confirmation, fallback/last-goal behavior,
and byte-for-byte preservation of an original FIT file.

## Visible weather decisions

A missing suggestion no longer leaves the outcome implicit. The planner returns
a `weatherDecision` without changing the existing safety checks or applying a
move. An eligible move is shown in full. A candidate blocked by readiness,
recovery, consecutive days or rolling capacity yields a blocked decision, with
source/target dates and an additional workload explanation where relevant. If
weather already influenced the chosen dates, the card lists those dates and says
that no additional move is proposed. Flat weather has an explicit no-move state.
Missing, stale and partial forecasts have distinct explanations; completed or
expired goals do not display move suggestions. These are inline app messages.

`tests/weather-notice.test.mjs` covers every decision and a synthetic November 3
scenario whose first workout is November 6. Moving it to the warmer November 5
would exceed recent recorded load, so it stays scheduled and the card explains
the constraint. This fixture uses the date reported by the user; it is not a
retrieved Astrakhan forecast or a diagnosis of that user's stored training data.
The live Open-Meteo request was unavailable during the investigation.

`tests/browser-weather-notice.mjs` verifies all seven states on both Overview and
Intellect at mobile and desktop sizes, date navigation, localization and unchanged
training data. The goal audit now enters the edit page before testing deletion,
including draft preservation on cancellation and navigation after success.
