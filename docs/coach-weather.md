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

The planner keeps the highest feasible session count, capped at four. A milder
temperature alone no longer deletes a cooler-day workout. At that count it first
prefers fewer caution/incomplete-weather days, then fewer short recovery rides
inside the post-hard-effort window, then the shorter maximum known gap and the
lower sum of squared gaps, and only then weather comfort and the
existing secondary preferences. Gaps use the latest known activity before the
week, activity and manual commitments inside it, and a nearby booked ride after
it. The unbooked tail of the displayed week also contributes to the distribution
cost. If there is no known earlier activity, a window edge is only a layout prior;
it is not evidence that the person rested. There is no medically asserted maximum
number of days between rides. These are transparent scheduling heuristics.

For the regression fixture with all seven weekdays selected, four days at +18°C
followed by three at +6°C, all four feasible sessions remain, including usable
cooler days. Recovery, readiness, user availability and all affected rolling
capacity windows can still require a short ride or a longer break. Existing long
streaks in the history do not permit a new three-day automatic streak elsewhere.
Unused time is not added later as catch-up debt.

## Stable volume calibration

With a recent confirmation of complete history and enough valid rides, the
volume reference uses the last three **completed calendar weeks**, all within
the confirmed 28-day history. It does not relearn a smaller reference every
morning as a partly completed week slides through the averaging window. Typical
session duration comes from the median valid recorded duration. Allocation keeps
that duration where feasible, reserves the minimum for remaining selected days,
and still applies rolling caps, the current budget, comfort limits, reduced
readiness and recovery reductions. Equal-weather ties for the longer session use
a stable weekday preference instead of always pushing it to the far end of the
moving forecast. No extra persistence or changes to original FIT data are needed.

At equal feasible session count and forecast quality, a schedule of ordinary
rides is preferred over one that inserts a short recovery ride after a recorded
hard effort and displaces an ordinary ride. The rolling forecast must not
progressively learn that displacement as the rider's new lower usual volume.
Recovery rides remain available when the selected days or other constraints
require them; their 30-minute limit is unchanged. This is a scheduling policy,
not a claim that every rider needs complete rest for 48 hours.

The calibration, rounding, maximum four automatic sessions, re-entry reductions
and recovery cutoffs are product rules. They do not measure fitness loss or prove
an optimal frequency for an individual rider. General training evidence supports
individual context and monitoring, not one universal gap limit: see the
[frequency study](https://pubmed.ncbi.nlm.nih.gov/7219129/), the
[two-week detraining study](https://pubmed.ncbi.nlm.nih.gov/33517866/), and the
[IOC load-management consensus](https://pubmed.ncbi.nlm.nih.gov/27535989/).

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

Moving a workout must not worsen the known maximum gap; when that maximum is
unchanged, it must not worsen the gap-distribution cost either. Thus an old long
break cannot hide a newly enlarged gap inside the current plan. A blocked move
has a separate regularity explanation instead of claiming a workload or recovery
problem. Interval moves also retain the same separation from booked rides of at
least 90 minutes as the original interval assignment.

The hypothetical move must fit every affected rolling seven-day guideline,
including recorded work. Existing overload cannot increase. Streak, readiness,
missing check-in, hard-effort recovery and long/interval separation checks remain.
Minutes are transferred hypothetically, never added. Only the greatest comfort
improvement is shown, with shorter moves preferred on a tie. A visible card above
the goal dashboard in Intellect gives the full suggestion and source/target dates.
The card has no accent stripe and is not displayed on Overview. The upcoming
week retains forecast refresh independently of the card. Its action opens the target rest day. Advice also remains
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
spacing reason. A blocked weather move that worsens regularity has its own explanation.
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
smart-goal controls. `tests/coach-rhythm.test.mjs` covers the ordering of regularity,
weather and recovery constraints. `tests/coach-continuity.test.mjs` follows every
prescribed session for 112 days, including RPE-rated intervals and each weekday
as the initial forecast boundary. This is an engineering continuity regression,
not evidence that its resulting volume is a physiological target. The existing
six-week simulation remains part of the unit run.

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

`tests/browser-weather-notice.mjs` verifies all seven states in Intellect, their
absence from Overview and the plain card edge at mobile and desktop sizes. It also
checks date navigation, localization and unchanged training data. The goal audit now enters the edit page before testing deletion,
including draft preservation on cancellation and navigation after success.
