# Speed colours after route editing

The editor and saved 3D route use the same original FIT speed scale as the normal route. The original FIT record is never modified. Both route views include valid speed readings without GPS coordinates when calculating the colour scale.

`src/route-speed.js` builds a profile from cumulative FIT distance and recorded speed. It normalizes an initial distance offset and maps progress from the first to the last recorded distance onto progress along the edited geometry. A longer or shorter edited route therefore still matches the original start and finish. This is a proportional visual alignment, not a claim that every corrected coordinate has an exact recorded timestamp.

If FIT distance is absent or resets, a continuous, usable original GPS track may supply cumulative distance. If speed or a usable distance track is unavailable, the line stays grey. Recorded zero speed remains zero.

Speed is interpolated only between neighbouring usable readings. Missing values, timer pauses and recording gaps over 30 seconds produce grey sections, using the same time-gap threshold as the original route view. The stricter 10-second training-analysis rules remain separate. Geometry is sampled at terrain vertices and a bounded selection of distance readings; a display edge crossing an unknown interval remains grey even when display sampling skips the missing records.

Projected speeds are stored only in temporary `routeSpeed` fields. The temporary `v`, `p`, `hr` and `c` fields stay null. Saved terrain elevations retain their map source. Physiology, records, route matching, original FIT downloads and backups continue to use original measurements.

The live map editor uses coloured GeoJSON segments; the 3D map and elevation profile use the corresponding speed gradient. Tests cover unequal route lengths, nonuniform sample distances, distance offsets, missing values, pauses, GPS fallback, date-line crossing, immutable measurements and large FIT recordings.

Version 1.47 fixes the handedness of the canvas projection. Local GPS coordinates remain east-positive and north-positive. After rotating the ground plane, screen Y is the negative depth (scaled by the sine of the viewing angle in 3D), minus vertical elevation. Both route points and landmarks use projectRoutePoint. This preserves compass orientation without reflecting asymmetric shapes at any yaw. Altitude and speed data, saved geometry and the satellite editor are unchanged.

Version 1.48: two-pointer gestures translate the map by the midpoint movement and scale around that midpoint, in CSS pixels. The actual clamped zoom ratio preserves the focal location at limits. A gesture that used multiple pointers never selects a point or turns into single-finger rotation until all fingers lift. Single-finger rotation, explicit pan, shift-drag and point taps remain available. Pointer cancellation/lost capture and disposal clear gesture state and handlers. Wheel zoom also preserves its focal location.
