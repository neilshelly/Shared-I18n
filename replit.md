# shared-i18n

A TypeScript package repository providing shared translation catalogues and generated type contracts for the Web Suite.

## What This Is

This is **NOT** a fullstack application. It's a standalone, publishable npm package that provides:

1. **Canonical translation keys** (`en.json` is the source of truth)
2. **Multi-language support** (currently `en` and `de-DE`)
3. **Generated TypeScript types** (`TranslationKey` union and `translationKeys` array)
4. **CI-ready validation** (ensures all locales match canonical key set)
5. **Zero runtime logic** (static catalogues only)

## Architecture Compliance

This package implements the **Shared Translation Architecture** exactly as specified:

- Static locale catalogues under `src/locales/`
- `en.json` is canonical; all other locales must match it exactly
- CI-style validation for:
  - Identical key sets across locales
  - Placeholder consistency (e.g., `{{min}}` must appear in all translations)
  - JSON validity
  - Flat key:string structure
- Generated type contract from `en.json` (manual maintenance prohibited)
- No environment variables, no API calls, no auth, no service behavior

## Project Structure

```
shared-i18n/
├── src/
│   ├── locales/
│   │   ├── en.json              # Canonical key set
│   │   └── de-DE.json           # German translations
│   ├── generated/
│   │   └── translation-keys.ts  # Auto-generated types
│   └── index.ts                 # Package entry point
├── scripts/
│   ├── generate-translation-keys.ts  # Generates TranslationKey type
│   ├── validate-locales.ts           # Validates all locales
│   └── smoke.ts                      # Manual verification script
├── tests/
│   └── validate-locales.test.ts      # Unit tests
├── dist/                              # Compiled output (git-ignored)
├── package.json                       # Package config
├── tsconfig.json                      # TypeScript config
└── README.md                          # User documentation
```

## Key Features

### Translation Keys (Starter Set)

The package includes these initial shared keys:

- `auth.signed_out`
- `common.loading`
- `common.cancel`
- `errors.generic.not_found`
- `errors.generic.request_error`
- `errors.generic.service_unavailable`
- `errors.validation.min_length` (with `{{min}}` placeholder)

### Generated Type Contract

The `TranslationKey` type and `translationKeys` array are automatically derived from `en.json`:

```typescript
export type TranslationKey =
  | 'auth.signed_out'
  | 'common.cancel'
  | 'common.loading'
  | 'errors.generic.not_found'
  | 'errors.generic.request_error'
  | 'errors.generic.service_unavailable'
  | 'errors.validation.min_length';

export const translationKeys = [
  'auth.signed_out',
  'common.cancel',
  'common.loading',
  'errors.generic.not_found',
  'errors.generic.request_error',
  'errors.generic.service_unavailable',
  'errors.validation.min_length'
] as const satisfies readonly TranslationKey[];
```

Manual maintenance is prohibited - this file is generated from source.

### Validation

All validation rules are enforced via `scripts/validate-locales.ts`:

- ✓ All locales have identical keys
- ✓ Placeholder names match exactly across translations
- ✓ No malformed placeholders (e.g., `{{name` without `}}`)
- ✓ No nested objects (flat key:string maps only)
- ✓ JSON validity

## Scripts

- `npm run gen` - Generate translation types from `en.json`
- `npm run validate` - Validate all locale files
- `npm run build` - Generate types + compile TypeScript
- `npm test` - Run full validation + unit tests
- `npm run prepublishOnly` - Full check before publishing

## Usage (For Consumers)

```typescript
import { TranslationKey, translationKeys, en, deDE } from 'shared-i18n';

// Use catalogues
const messages = { en, 'de-DE': deDE };

// Merge with app-specific translations
const appTranslations = {
  'app.feature.title': 'My Feature'
};

const merged = { ...en, ...appTranslations };
```

## Versioning Rules

- **Major**: Removing keys, renaming keys, or changing placeholder structure
- **Minor**: Adding new keys
- **Patch**: Documentation or packaging changes only

## Ownership

Platform team owns this package. Application teams may propose additions via PR.

Removing or renaming keys requires architectural review.

## Dependencies

Minimal production dependencies (zero). Development dependencies:

- `typescript` - Compilation
- `vitest` - Testing
- `tsx` - Running TypeScript scripts
- `@types/node` - Node.js types

## Verification

All verification checks pass:

```bash
✓ npm run gen      # Generates 7 keys
✓ npm run validate # Validates 2 locale files
✓ npx vitest run   # All 7 tests pass
✓ npm run build    # Compiles successfully
✓ Smoke test       # Exports work correctly
```

## Notes

- This is a **package repository**, not an application
- No workflows required (it's a library, not a service)
- No database, no server, no runtime behavior
- Consumers import and use at compile time and runtime
