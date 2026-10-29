# Speed colours after route editing

The editor and saved 3D route use the same original FIT speed scale as the normal route. The original FIT record is never modified.

`src/route-speed.js` builds a profile from cumulative FIT distance and recorded speed. It normalizes an initial distance offset and maps progress from the first to the last recorded distance onto progress along the edited geometry. A longer or shorter edited route therefore still matches the original start and finish. This is a proportional visual alignment, not a claim that every corrected coordinate has an exact recorded timestamp.

If FIT distance is absent or resets, a continuous, usable original GPS track may supply cumulative distance. If speed or a usable distance track is unavailable, the line stays grey. Recorded zero speed remains zero.

Speed is interpolated only between neighbouring usable readings. Missing values, timer pauses and recording gaps over 30 seconds produce grey sections, using the same time-gap threshold as the original route view. The stricter 10-second training-analysis rules remain separate. Geometry is sampled at terrain vertices and a bounded selection of distance readings; a display edge crossing an unknown interval remains grey even when display sampling skips the missing records.

Projected speeds are stored only in temporary `routeSpeed` fields. The temporary `v`, `p`, `hr` and `c` fields stay null. Saved terrain elevations retain their map source. Physiology, records, route matching, original FIT downloads and backups continue to use original measurements.

The live map editor uses coloured GeoJSON segments; the 3D map and elevation profile use the corresponding speed gradient. Tests cover unequal route lengths, nonuniform sample distances, distance offsets, missing values, pauses, GPS fallback, date-line crossing, immutable measurements and large FIT recordings.
