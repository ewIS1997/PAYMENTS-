---
name: code-review-skill
description: Reviews code for bugs, logic errors, edge cases, readability, missing tests, and risky changes. Use when asked to review code, audit a file, or before committing changes.
license: MIT
metadata:
  author: project-local
  version: "1.0.0"
  date: May 2026
  abstract: A senior full-stack code review skill tailored for this React + Supabase installment management app. Covers bug detection, data flow validation, state management, DB interactions, UI/UX issues, and performance.
---

# Code Review Skill

Systematic code review for this project (React 19 + Vite + Supabase + Tailwind v4).

## When to Trigger

- "Review my code" / "Review this file" / "Check for bugs"
- Before committing or deploying changes
- "Audit" / "Security check" / "Performance review"
- When switching tabs or pages that feel slow or broken

## Review Checklist

Run through every category below. Report only real issues — no noise.

### 1. Bugs & Broken Logic

- [ ] Variables used before declaration or after conditional returns
- [ ] Off-by-one errors in loops, date math, pagination
- [ ] Null/undefined access without guards (`?.`  or early return)
- [ ] Incorrect comparison operators (`==` vs `===`, `!=` vs `!==`)
- [ ] Race conditions in async flows (multiple setState on stale data)
- [ ] Missing error handling on async calls (no try/catch or .catch)
- [ ] Broken conditional branches (else-if chains that never match)
- [ ] Stale closures in useEffect / useCallback dependencies
- [ ] Event handlers that reference state without functional updates

### 2. API & Data Flow

- [ ] Supabase queries that fetch `SELECT *` when fewer columns suffice
- [ ] N+1 query patterns (loop of individual DB calls instead of `.in()`)
- [ ] Missing `.select()` after `.insert()` / `.update()` when return data is needed
- [ ] Date values passed through `.toISOString().split('T')[0]` (timezone shift bug) — use `formatLocalDateString` instead
- [ ] Date values read via `new Date(string)` from DB (UTC parse shift) — use `parseLocalDate` instead
- [ ] Missing RLS policy or GRANT on new tables
- [ ] RPC functions that lack `STABLE` / `SECURITY DEFINER` annotations
- [ ] `.maybeSingle()` used where `.single()` is correct (or vice versa)
- [ ] Missing `.eq('isdeleted', false)` filter on customer queries
- [ ] `.in('id', [])` with empty array (returns nothing, should use `['none']` guard)

### 3. State Management

- [ ] useState initialized with expensive computation (move to lazy init)
- [ ] useEffect missing dependencies or with stale dependency array
- [ ] Object/array state mutated directly instead of creating new reference
- [ ] Context value creating new object on every render (wrap in useMemo)
- [ ] useEffect that re-triggers infinitely (state A → effect → setState A)
- [ ] useRef used where useState is needed (or vice versa)
- [ ] Key prop missing or using array index in .map() for list rendering

### 4. Database & Data Loss

- [ ] DELETE operations without soft-delete (`isdeleted` flag) — all deletes should be soft
- [ ] UPDATE without `updated_at` timestamp
- [ ] INSERT without required fields (null constraints violated)
- [ ] Bulk operations not wrapped in transaction-like flow
- [ ] `generateReceipts` not updating `settings.last_receipt_number` atomically
- [ ] Missing index on columns used in WHERE / ORDER BY (check schema.sql)
- [ ] Column name case mismatch (`isDeleted` vs `isdeleted` — Postgres folds to lowercase)

### 5. UI/UX

- [ ] Missing `dark:` variant on bg/text/border classes
- [ ] Missing `min-h-[44px]` on touch targets
- [ ] Missing loading/disabled states on buttons during async operations
- [ ] Forms without validation or with broken validation logic
- [ ] Arabic text not wrapped with `dir="rtl"` where needed
- [ ] Empty states missing (no feedback when list is empty)
- [ ] Modal not dismissible by clicking backdrop
- [ ] `@media print` not hiding nav/sidebar

### 6. Performance

- [ ] useMemo / useCallback missing on expensive computations passed as props
- [ ] Large list rendering without virtualization (100+ items)
- [ ] Image/file inputs without size validation
- [ ] Unbounded DB queries missing `.limit()` or `.range()`
- [ ] Client-side filtering that should be server-side (search with ilike)
- [ ] Re-renders caused by inline object/function creation in JSX

### 7. Security

- [ ] `service_role` or secret keys exposed in frontend code
- [ ] User-editable data used in DB queries without sanitization
- [ ] `.rpc()` calls with user-controlled parameters that could inject SQL
- [ ] Missing input sanitization on free-text fields
- [ ] localStorage used for sensitive data

### 8. Testing Gaps

- [ ] New function/service without any corresponding test
- [ ] Edge cases not covered: empty arrays, null fields, boundary dates
- [ ] Error paths not tested (network failure, DB error)

## Review Output Format

For each issue found, report:

```
### [SEVERITY] Short title
**File:** `path/to/file.jsx:lineNumber`
**Category:** Bug | Data Flow | State | DB | UI | Perf | Security | Test
**Issue:** What's wrong
**Fix:** What to change
```

Severity levels:
- **CRITICAL** — Data loss, security hole, or app crash
- **HIGH** — Broken feature, incorrect results
- **MEDIUM** — Performance problem, bad UX
- **LOW** — Code style, minor improvement

## Project-Specific Knowledge

| Concern | Detail |
|---------|--------|
| DB Column `isDeleted` | PostgreSQL stores as `isdeleted` (lowercase). Always use `isdeleted` in JS |
| Date handling | Write: `formatLocalDateString(date)`, Read: `parseLocalDate(str)` — both in `src/utils/dateUtils.js` |
| Supabase client | `src/supabase/client.js` — may be `null` if env vars missing |
| Demo mode | Every service has `if (!isSupabaseConfigured)` fallback using `demoData` |
| Receipt numbering | Atomic via `settings` table row `app_settings` |
| RTL layout | Arabic app, all forms and text need `dir="rtl"` consideration |
| Tailwind v4 | Dark mode via `class` strategy on `<html>` element |

## How to Use

1. Read the file(s) to review
2. Walk through every checklist item above
3. For each issue found, report in the output format
4. Summarize with total counts by severity
5. If asked to fix, implement the fixes and rebuild
