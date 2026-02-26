# shared-i18n

Shared translation catalogue for this ecosystem.

## Overview

This package provides:
- Canonical shared translation keys (`en.json` is authoritative)
- Locale catalogues for all supported languages
- Generated TypeScript types (`TranslationKey` and `translationKeys`)
- CI validation ensuring all locales match the canonical key set

## Installation

```bash
npm install shared-i18n
```

## Usage

```typescript
import { TranslationKey, translationKeys, en, deDE } from 'shared-i18n';

// Use the catalogues
const messages = { en, 'de-DE': deDE };

// Merge with app-specific translations
const appTranslations = {
  'app.feature.title': 'My Feature'
};

const merged = { ...en, ...appTranslations };
```

## Canonical Locale

`en.json` is the canonical key set. All other locale files must contain exactly the same keys.

**Important:** `TranslationKey` and `translationKeys` are generated automatically from `en.json`. **Manual union maintenance is prohibited.** Always regenerate types using `npm run gen`.

## Placeholder Rules

Dynamic values must use `{{placeholder}}` syntax. All locales must use identical placeholder names for each key.

Example:
```json
{
  "errors.validation.min_length": "Must be at least {{min}} characters"
}
```

## Supported Languages

- `en` (English - canonical)
- `de-DE` (German)

## Development

### Scripts

- `npm run gen` - Generate TypeScript types from `en.json`
- `npm run validate` - Validate all locale files against canonical
- `npm run build` - Generate types and compile TypeScript
- `npm test` - Run all validation and tests
- `npm run prepublishOnly` - Full validation before publishing

### Validation Rules

CI enforces:
- Identical key sets across all locales
- Placeholder consistency (same placeholder names per key)
- JSON validity
- Identical nesting shape (hierarchical object structure must match canonical exactly)

## Versioning

This package follows semantic versioning:

- **Major** - Removing keys, renaming keys, or changing placeholder structure
- **Minor** - Adding new keys
- **Patch** - Documentation or packaging changes only

## Client Integration

Each client application must:
1. Import `shared-i18n` as a dependency
2. Load shared translations at bootstrap
3. Merge with app-specific translations at runtime
4. Not override shared keys (namespaces: `errors.*`, `auth.*`, `common.*`, `navigation.*`)

## Ownership

Maintained by the maintainers of this repository. Contributions are accepted via pull request.

Removing or renaming keys requires maintainer review.

## Architecture

**This repository contains no runtime i18n logic beyond static catalogues and generated types.**

It does not provide:
- Translation functions (no `translate()` or `t()`)
- Locale resolution or detection
- Formatting helpers (dates, numbers, currency)
- Interpolation runtime

Consumers must implement their own runtime i18n layer using these catalogues as data.

## TODO: Language Variants Strategy

Define and formalise standard behaviour for base languages and regional variants (e.g. `en`, `en-US`, `en-AU`).

Clarify:
- Whether `en` is the canonical base language for English.
- Whether regional variants like `en-US` and `en-AU` are optional override files.
- Structural guarantees required for variants (identical key sets, identical placeholder names).
- Expected client-side fallback order (exact locale → base language → default locale).
- That `shared-i18n` does not implement runtime fallback logic, only structural validation.

## TODO: Package Hardening

Document future hardening work required before broader production use.

Include:
- Define explicit `package.json` exports map to prevent consumers from importing internal file paths.
- Ensure locale subpath exports are stable (e.g. `shared-i18n/locales`).
- Decide whether to export TS locale objects instead of raw JSON to avoid requiring `resolveJsonModule` in consumers.
- Add CI pipeline (GitHub Actions) to run:
  - `npm run validate`
  - `npm test`
  - `npm run build`
- Enforce semantic versioning with tagged releases.
- Define distribution strategy:
  - Prefer publishing to npm (public or private) or GitHub Packages.
  - Avoid installing from a moving branch.
  - If using git installs, require pinned version tags.
- Consider pinning Node and TypeScript engine versions.
- Add publish workflow validation to prevent releasing with failing validation.
 
