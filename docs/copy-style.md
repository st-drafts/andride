# Interface copy

Use plain, direct wording. Describe what the rider did: “you rode farther”, not “the volume of recorded FIT distance increased”. Keep the recorded-history context and avoid claiming fitness improvement from distance or speed alone.

New coach, goal, ride analysis, feedback and sleep-picker messages use `message(id, values)` from `src/copy.js`. `src/copy-sources.js` keeps Russian source sentences; matching `@id` entries live in the main translation table and the language packs. Select the full translated sentence before inserting formatted values. Do not assemble prose from separately translated fragments. User titles remain excluded from localization.

There are 38 supported languages. The copy review covered the complete message catalog, missing translations, templates, numbers, confirmation tokens, cycling terminology and common actions. It added complete translations for the newer screens, replaced malformed phrases and normalized important terms such as ride, cadence, power, indoor trainer and smart plan. Automated tests render coach screens in every language. Browser checks cover Russian, French and Chinese, including the release log and mobile text wrapping.

Use `Intl` for numbers, dates, weekdays and hour/minute units. `src/copy-counts.js` supplies the appropriate ride noun forms for numeric counters.

## Release notes

Always write `releaseNotes.changes` in English. Set `language: 'en'`. The release log is rendered by `src/release-log.js` with `lang="en"`, `translate="no"` and `data-no-localize`; the interface translation pass must skip it. The surrounding update controls still use the selected interface language.

All translations are saved locally and included in the PWA cache. No translation service is called by the running application.
