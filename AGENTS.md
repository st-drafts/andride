# Product copy

- Write release notes in English, regardless of the selected interface language. Keep the release log marked `lang="en"`, `translate="no"`, and excluded from interface localization.
- Use clear, natural language. Prefer “you rode more” over technical phrases such as “the volume of recorded distance increased”. Keep detailed methods in the explanation sections.
- Translate complete sentences and insert values afterwards. Do not build sentences by joining translated fragments.
- Preserve the difference between a recorded zero and missing sensor data. Cadence 0 means no pedalling; missing cadence must not contribute to analysis. Rising speed while coasting can suggest a descent; grade or elevation confirms it.
- Projected map speeds belong in display-only `routeSpeed` fields. Keep original FIT measurements and map-sourced elevations separate; do not feed corrected geometry or projected speed back into training analysis.
