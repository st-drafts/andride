# Weather comfort and optional moves

The selected weekdays remain strict availability. Automatic sessions never move
onto an unselected weekday. The coach can show one conditional weather suggestion
on an unselected rest day; the original workout remains scheduled and the target
remains a rest day. Suggestions are recalculated, not saved as availability changes
or applied to history.

## Ranking selected days

The previous coach handled wind, gusts, rain and heat limits but gave +6°C and
+18°C the same temperature cost. Its spacing preference could therefore select
cold days while leaving mild days free. The updated relative comfort cost adds
two score units per degree below a daytime maximum of 15°C or above 25°C, capped
at 24 units. A caution forecast receives an additional 24-unit condition cost so
warmth does not give rain, wind, gusts or heat an advantage over a normal dry cool
day. The existing caution-related duration reduction remains. These
are product preference weights, not medical or certified safety thresholds.
Nighttime minimums alone do not penalize a mild day. Existing heat, storm, ice,
wind, load, recovery, readiness and session-length rules remain in force.

The existing cost of consecutive sessions and the preference for spreading work
remain. Weather does not force every session into a short warm spell. Day selection,
the longer session and interval selection share the same weather ranking. Unknown
or incomplete forecasts receive no cost advantage over known conditions. An entirely
missing or stale forecast retains balanced scheduling and produces no comfort advice.

## Optional suggestion on a rest day

An offer can target only an unselected, unrecorded rest day inside the current
seven-day plan and goal dates. Both days need a complete fresh forecast. The source
must have a planned workout and a daytime maximum below 15°C; the target must be
at least 4°C warmer, improve the comfort score, have an available outdoor forecast,
and be at most three calendar days away. Wind, gusts and precipitation must not
increase; precipitation probability must also not increase when known at the source.
Invalid optional forecast fields make the data incomplete.

The hypothetical move must fit every affected rolling seven-day limit, including
recorded work. Existing overload is not increased. It may not introduce a third
consecutive active day or increase an already longer active streak. Today's fatigue,
missing check-in and reduced readiness can suppress a suggestion for today. The
existing hard-effort recovery window and long/interval separation are checked for
the moved session as well. Minutes are transferred hypothetically, never added.

Only the offer with the largest comfort improvement is shown, with shorter moves
preferred on a tie. The rest-day heading shows a weather hint. Opening it shows a
conditional suggestion and two localized dates, for example Friday → Thursday.
The text does not claim that a selected weekday or workout was already changed.

All advice and comfort explanations have complete sentences in the 38 interface
languages. Dates are formatted with Intl and inserted after translation. The source
and target dates are validated before markup generation.

## Verification

`tests/coach-weather.test.mjs` covers the +18°C-to-+6°C regression, strict
availability, unchanged state, weaker/missing forecasts, comfort versus heat,
rolling capacity, recovery, streaks, completed goals and localization. A matrix of
weather patterns, availability and training focus checks hypothetical moves.

After a build, run `node tests/browser-coach-weather.mjs`. `BUILD_DIR` can point to
an isolated build, `BROWSER_ENGINE=webkit` selects WebKit, and `PLAYWRIGHT_MODULE`
can locate an external Playwright installation. The suite checks mobile/desktop
display, the source workout remaining in place, preserved stored data, multiple
interface languages and removal of advice when weather becomes incomplete/stale.

Daily forecast summaries do not determine the weather at the hour of a ride.
These rules choose between the available forecast days; they do not establish
individual comfort, fitness or route safety.
