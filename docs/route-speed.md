# Speed colours after route editing

The editor and saved 3D route use the same original FIT speed scale as the normal route. The original FIT record is never modified. Both route views include valid speed readings without GPS coordinates when calculating the colour scale.

`src/route-speed.js` builds a profile from cumulative FIT distance and recorded speed. It normalizes an initial distance offset and maps progress from the first to the last recorded distance onto progress along the edited geometry. A longer or shorter edited route therefore still matches the original start and finish. This is a proportional visual alignment, not a claim that every corrected coordinate has an exact recorded timestamp.

If FIT distance is absent or resets, a continuous, usable original GPS track may supply cumulative distance. If speed or a usable distance track is unavailable, the line stays grey. Recorded zero speed remains zero.

Speed is interpolated only between neighbouring usable readings. Missing values, timer pauses and recording gaps over 30 seconds produce grey sections, using the same time-gap threshold as the original route view. The stricter 10-second training-analysis rules remain separate. Geometry is sampled at terrain vertices and a bounded selection of distance readings; a display edge crossing an unknown interval remains grey even when display sampling skips the missing records.

Projected speeds are stored only in temporary `routeSpeed` fields. The temporary `v`, `p`, `hr` and `c` fields stay null. Saved terrain elevations retain their map source. Physiology, records, route matching, original FIT downloads and backups continue to use original measurements.

The live map editor uses coloured GeoJSON segments; the 3D map and elevation profile use the corresponding speed gradient. Tests cover unequal route lengths, nonuniform sample distances, distance offsets, missing values, pauses, GPS fallback, date-line crossing, immutable measurements and large FIT recordings.

Version 1.47 fixes the handedness of the canvas projection. Local GPS coordinates remain east-positive and north-positive. After rotating the ground plane, screen Y is the negative depth (scaled by the sine of the viewing angle in 3D), minus vertical elevation. Both route points and landmarks use projectRoutePoint. This preserves compass orientation without reflecting asymmetric shapes at any yaw. Altitude and speed data, saved geometry and the satellite editor are unchanged.

Version 1.48: two-pointer gestures translate the map by the midpoint movement and scale around that midpoint, in CSS pixels. The actual clamped zoom ratio preserves the focal location at limits. A gesture that used multiple pointers never selects a point or turns into single-finger rotation until all fingers lift. Single-finger rotation, explicit pan, shift-drag and point taps remain available. Pointer cancellation/lost capture and disposal clear gesture state and handlers. Wheel zoom also preserves its focal location.

## Ground map — 1.50

The ordinary street-map underlay is drawn from OpenFreeMap/OpenMapTiles vector data, not satellite imagery. A small bounded MVT decoder selects water, land, buildings, streets and place labels. Tile textures use only neutral colours; the background comes from the existing --surface token. They are projected through the same east/north camera as the original or edited route, on a flat reference plane at the minimum route height. This is a map reference plane, not a new terrain elevation model. Recorded FIT elevations, corrected terrain samples and analytical metrics are unchanged.

The screen-to-ground inverse accounts for yaw, pitch, pan, focus and zoom. Mercator tile coordinates are converted back to geographic latitude before projecting into the route's local metre system; a small triangle mesh avoids reflection and projection drift. Date-line tile X coordinates remain unwrapped while network requests wrap to the correct world copy. The route gradient and selected point render above the map.

Only the visible viewport is requested (up to 24 tiles, at most four jobs, debounced during gestures). Weekly source metadata and viewed tile bytes are retained in a separate bounded cache (160 entries / 20 MiB). Both colour themes are rendered from the same vector bytes without another download. No offline area prefetch is performed. If tiles are absent offline, the saved route remains usable on the themed grey background, with a localized status and retry button. Cached geography survives weekly source updates and application updates; clearing personal app data removes it. Corrupt cached tiles are evicted before retrying the source.

OpenFreeMap receives requests for the displayed map areas. Original FIT files and sensor measurements are not sent. Source attribution remains visible on the map. The existing satellite route editor is unchanged. Source and availability: https://openfreemap.org/ and https://openfreemap.org/quick_start/ . New status and privacy sentences are bundled in map-copy.js for all 38 languages.
