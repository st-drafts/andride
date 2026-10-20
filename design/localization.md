# Application languages

Supported locales: ru-RU, en-GB, fr-FR, de-DE, es-ES, ja-JP.
The chosen language is stored as `andride-language` in localStorage. On first
use, a supported browser language is selected; otherwise Russian is used.
Installation instructions expose the same selector before database access.
The selector is also available in App settings.

`src/translations.js` holds source messages and five translations. `src/i18n.js`
localizes rendered text and accessibility labels, retains source copy for
asynchronous changes, and excludes user-content nodes and input values.
Dates/numbers use Intl with the chosen locale; time zone remains the device's.
Canvas labels explicitly call the translator. Manifests use locale-specific
files with a common app ID, start URL and scope.

User ride names, plan names, goal names and original file names are never
translated or written back in another language. User content must be wrapped
in `[data-user-content]`; composite accessible names use `[data-user-label]`.

Figma has an `and Ride / Languages` string collection with six modes. Newly
updated flows share those bindings. `design/figma-translations.json` contains
additional presentation copy used in the design examples.

Validation: catalog completeness; locale/platform unit checks; isolated
browser sweeps of onboarding, populated ride/analytics, import, calendar,
settings, profile, backup, route editor and illustrated installation pages.
No deploy or remote repository writes are part of this change.
