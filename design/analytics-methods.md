# Derived metrics and motion

## Provenance

FIT `totalCalories` and `totalWork` take precedence. Recorded watts remain unchanged. When no summary average is available, recorded power is averaged by time; recorded timer pauses are excluded. User names and deleted sessions survive re-reading stored original FIT files for the new metadata.

Calories from mechanical work use 22% gross efficiency. The displayed 18–25% range is an assumption range, not a confidence interval. Work can come from the FIT total, sufficiently complete power samples, a FIT average times timer duration, or the explicit mechanical model. An average reconstructed from partial samples never fills a whole ride's missing energy. Missing samples and pauses are not silently interpolated.

Estimated watts require valid speed, elevation, rider mass and bicycle/equipment mass. The model uses mass, grade, acceleration, rolling resistance and aerodynamic resistance. Defaults: density 1.225 kg/m³, CdA 0.40 m², Crr 0.006, drivetrain efficiency 0.97, no wind/drafting. Invalid grades/accelerations and gaps over 10 s are excluded; at least 30 s and 80% of available intervals are needed. Estimated energy covers the modelled intervals only. Model values never enter measured power graphs, FTP, power curves or records.

## Heart-rate zones

An explicit user HR maximum overrides FIT zones. Otherwise, four increasing FIT zone boundaries take precedence over a FIT profile maximum. The maximum observed during the ride is never used as a physiological maximum; age formulas are not applied automatically. The default maximum-based scale uses 50/60/70/80/90/100%, with half-open intervals and readings over the stated maximum counted in Z5 and flagged. Values below 50% are reported separately.

Time is integrated over intervals of at most 10 s using the initial sample. Invalid/missing HR and recorded timer pauses are excluded. Percentages use valid HR time; coverage uses elapsed recording time minus known pauses. Advice describes the recorded distribution and does not diagnose recovery or prescribe a medical plan. Previous-ride comparisons require identical boundaries and provenance.

## References

- FIT SDK profile and file conventions: https://developer.garmin.com/fit/overview/
- Mechanical power model: https://pubmed.ncbi.nlm.nih.gov/28121252/
- Cycling efficiency variation: https://pubmed.ncbi.nlm.nih.gov/22706941/
- Five HR-max zones: https://www.polar.com/us-en/guide/heart-rate-zones

## Motion and charts

Sensor columns display the arithmetic mean of recorded values in each displayed time bucket; inspection reports the original nearest sample. Empty buckets remain empty. Elevation uses vertical columns; the GPS track stays a line so its spatial shape remains readable. Daily distance columns preserve the underlying totals.

Display values count up on first visibility, columns reveal over 550 ms, and illustration columns reveal with a short stagger. All motion respects `prefers-reduced-motion`. Resize observers, event listeners and animation frames are cancelled on navigation.
