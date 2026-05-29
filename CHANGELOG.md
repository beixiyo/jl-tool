# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.1] - 2026-05-29

### Fixed

- **`getLocalStorage` no longer throws on non-JSON values.** `setLocalStorage` stores
  `string` values verbatim (without JSON quotes), but `getLocalStorage` ran every value
  through `JSON.parse` and threw on plain strings. It now falls back to the raw string
  when `JSON.parse` fails, so strings round-trip correctly and malformed / legacy values
  no longer crash the caller:
  - `'-created_time'` — was `SyntaxError: No number after minus sign`, now returns `'-created_time'`
  - `''` (empty string) — was `SyntaxError: Unexpected end of JSON input`, now returns `''`
- **`getLocalStorage` returns `null` explicitly for missing keys**, instead of relying
  on the incidental behaviour of `JSON.parse(null)`.

### Notes

- Because strings are stored verbatim, JSON-looking strings (`'123'`, `'true'`,
  `'{"a":1}'`) are still parsed to their JSON type on read. Pass `autoParseJSON = false`
  to `getLocalStorage` to keep the original string.
- Added a regression test suite for `setLocalStorage` / `getLocalStorage`
  (`test/test/tools/localStorage.test.ts`).

## [4.0.0] - 2026-05-29

### `formatDate` rewrite — universal LDML-style tokens

`formatDate` now uses a single-pass token parser, making the format string
fully general (any token, anywhere, any number of times) instead of a fixed
set of hard-coded patterns.

#### Added

- **Variable-width tokens** — every field now has a padded and a non-padded form:
  `M`/`MM`, `d`/`dd`, `H`/`HH`, `m`/`mm`, `s`/`ss`, `S`/`SSS`.
- **Two-digit year** `yy` (e.g. `2026` → `26`).
- **Global replacement** — a token is replaced at every occurrence, not just the first
  (`'yyyy yyyy'` → `'2026 2026'`).
- **Single-quote literal escaping** (Unicode LDML style) — text wrapped in single quotes
  is output verbatim, and `''` produces a single quote:
  - `"yyyy年MM月dd日 'at' HH:mm"` → `2026年03月05日 at 09:08`
  - `"'it''s' yyyy"` → `it's 2026`

#### Changed

- **`getLocaleDateInfo` time handling** — switched from `hour12: false` to
  `hourCycle: 'h23'`, so midnight is reliably `00`/`0` across locales (no more `24`).
- **Internal date info** now carries raw numbers; padding happens at token resolution time.

#### Fixed

- **Local-timezone millisecond padding** — `ms`/`SSS` now pad to 3 digits consistently
  (previously the local path padded to 2: `5ms` → `05`, now → `005`), matching the
  custom-timezone path.

#### ⚠️ Breaking Changes

1. **`DateInfo` callback object shape changed** from padded strings to raw numbers:
   - Before: `{ yyyy, MM, dd, HH, mm, ss, ms }` (strings, zero-padded)
   - After: `{ year, month, day, hour, minute, second, millisecond }` (numbers)
   - Any custom formatter using the old field names must be updated:
     ```ts
     // Before
     formatDate(info => `${info.yyyy}`)
     // After
     formatDate(info => `${info.year}`)
     ```

2. **Single-letter tokens are now active**, so literal letters in a format string are
   interpreted as tokens and must be escaped with single quotes:
   - `formatDate('day')` → `5ay` (`d` = day-of-month)
   - Use `formatDate("'day'")` → `day`

3. **Global replacement** — repeated tokens are all replaced
   (`'yyyy yyyy'`: was `'2026 yyyy'`, now `'2026 2026'`).

4. **Local-timezone millisecond width changed** from 2 to 3 digits (see _Fixed_).

5. **Custom-timezone midnight hour** is now `00`/`0` instead of a possible `24` in some
   locales (see _Changed_).

#### Notes

- `yyyy`/`MM`/`dd`/`HH`/`mm`/`ss` (the common padded forms) are unchanged — most format
  strings without literal letters need no migration.
- The non-standard tokens `YYYY` (= `yyyy`) and `ms` (= `SSS`) are still accepted at
  runtime for backward compatibility, but are **no longer suggested** by the `DateFormat`
  type and are discouraged in new code.
