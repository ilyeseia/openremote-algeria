# Interface languages

The UI supports exactly three languages, in this order:

| Code | Language | Direction | Notes |
| ---- | -------- | --------- | ----- |
| `ar` | Arabic   | RTL       | **Default** when no preference exists |
| `en` | English  | LTR       | Source of truth for keys; fallback for untranslated keys |
| `fr` | French   | LTR       | |

The single definition lives in `ui/component/core/src/locale.ts` (`DEFAULT_LANGUAGE`, `DEFAULT_LANGUAGES`,
`SUPPORTED_LANGUAGES`). The language selector, i18next (`supportedLngs`), the Moment locale bundle
(`ui/util/rspack.util.js`) and Keycloak (`ManagerKeycloakIdentityProvider#configureRealm`) all follow this list.

## Language resolution

On start-up the first *supported* value wins: console storage (`LANGUAGE`) → Keycloak user `locale` attribute →
`ManagerConfig.defaultLanguage` → `ar`. Region suffixes are stripped (`fr-FR` → `fr`). Unsupported or malformed saved values
(e.g. `de`) are skipped, never overwritten with a new value until the user picks a language. The browser language is
deliberately **not** used, so first-time users always get Arabic.

Changing the language (`manager.language = "fr"`) updates i18next, stores the preference and sets `<html lang>` and
`<html dir>` immediately, no reload required.

## Adding or updating translations

* Keys mirror `en/or.json`; keep `{{placeholders}}` untouched and keep `_one`/`_other`/`_plural` suffixes as in English.
* Arabic uses Modern Standard Arabic. Terminology: asset = أصل، realm = نطاق، rule = قاعدة، attribute = خاصية،
  alarm = إنذار، dashboard = لوحة معلومات. Keep technical identifiers, protocol names and units in Latin script.
* Run `node --test ui/component/core/test/locale.test.mjs` (also `yarn test` in `ui/component/core`). It fails on missing keys,
  changed placeholders, blank values and a locale directory for any unsupported language.
* Any untranslated key falls back to English, never to another language.

## Right-to-left

RTL is centralised: `dir="rtl"` is set on `<html>` for Arabic and restored to `ltr` otherwise. Shadow DOM components inherit
`direction`, so flex/grid layouts mirror automatically. Component CSS uses logical properties (`margin-inline-start`,
`padding-inline-end`, `border-inline-start`, `text-align: start`, `inset-inline-*`). Direction-bearing icons
(`chevron-*`, `arrow-left/right`, `login`, `logout`, ...) are mirrored centrally in `or-icon` via `:host(:dir(rtl))`.
Use logical properties in new CSS; do not add per-language overrides.

## Known limitations

* Dates from Moment's `ar` locale use Arabic-Indic digits, translated UI strings use Latin digits.
* Map controls (Mapbox/MapLibre), chart axes and the flow-rule editor canvas keep their own LTR geometry on purpose.
  Some multi-value shorthand rules (e.g. `margin: 0 8px 0 4px`) are not yet logical.
* The Keycloak login/account pages only get the three languages if the installed Keycloak theme ships `ar`/`fr` message bundles.
* RRULE sentences (schedules) are assembled word by word and read less naturally in Arabic.
* Realm-specific deployments with `language` set to an unsupported code fall back to Arabic.
* Not yet verified in a browser: the full rspack/Gradle build and Playwright component tests could not be run in the
  authoring environment (see the PR description).
