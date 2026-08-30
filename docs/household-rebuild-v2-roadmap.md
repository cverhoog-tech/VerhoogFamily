# Household Rebuild v2 Roadmap

Branch: `agent/household-rebuild-v2`
Baseline main SHA: `997eb0710f512857a3280e776ab38988a7ee5a86`

## Guardrails
- Main remains untouched until explicit approval.
- No production deploy or production Firebase Rules deploy without explicit approval.
- Firebase is the source of truth for shared household data.
- Household data is scoped by `householdId` and UID where relevant.
- Realtime subscriptions require exact cleanup/rebind and stale-context protection.
- Do not introduce a second authority for an accepted domain.
- Keep domain/service boundaries usable by a later native iOS/Android shell.
- Functional phases require static/contract checks, Preview and real-device acceptance where appropriate.

## Rebuild phases
- [x] STEP 0 — Stable baseline.
- [x] STEP 1 — Authenticated session / startup ownership.
- [x] STEP 2 — HouseholdContext / UID identity / lifecycle.
- [x] STEP 2A — Platform-admin identity foundation.
- [x] STEP 2B — Person/UI identity modernization and Brand/PWA/icon scope.
- [x] STEP 3 — Tasks core.
- [x] STEP 4 — Recipes.
- [x] STEP 5 — Meals.
- [x] STEP 6 — Agenda.
- [x] STEP 7 — Shopping.
- [x] STEP 8 — Finance.
- [x] STEP 9 — Progression / XP / achievements.
- [x] STEP 10 — Notifications.
- [x] STEP 11 — Party Quests.
- [x] STEP 12 — Profile / presence / avatars.
- [-] STEP 13 — Activity / Feed.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Platform operations dashboard.
- [ ] STEP 15 — Firebase Rules hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] STEP 17 — Store distribution readiness.

## STEP 13 — Activity / Feed

Detailed approved contract: `docs/STEP13-ACTIVITY-FEED-SPEC.md`.

Scope:
- immutable household activity events;
- canonical domain producers after successful mutations;
- deterministic dedupe/idempotency;
- HouseholdContext lifecycle, cleanup and safe rebind;
- combine activity events with existing manual social posts in one chronological Feed without replacing the existing manual-post model;
- fixed subtle pastel activity-card families: Tasks mint, Meals/Recipes peach, Shopping soft yellow, Agenda soft blue, Party Quest/XP lilac, generic household neutral; deliberate dark-mode equivalents;
- remove fake/demo Feed totals and hardcoded counters;
- structured member tags by UID and recipe tags by canonical recipe ID;
- interactive Feed meal proposals with recipe/date/message/audience and realtime approval/decline state;
- meal proposals remain mutable interactive state until resolved and are not immutable activity events while pending;
- exactly-once approved-proposal transition into canonical meal planning;
- after approval offer optional ingredient handoff to a selected shopping list;
- ingredient preview supports add/skip/merge/exclude and avoids blind duplication;
- Meal and Shopping canonical services remain mutation authorities; Feed does not write around them;
- confirmed results may emit deterministic `meal.planned`, `shopping.ingredientsAdded` or equivalent immutable events;
- existing manual-post likes/comments remain intact;
- integrated isolation/lifecycle/idempotency tests, Vercel Preview and bundled two-device/real-iPhone acceptance.

Execution:
1. STEP 13.1 — Activity repository/schema/lifecycle.
2. STEP 13.2 — Domain producers + idempotency.
3. STEP 13.3 — Unified Feed projection + pastel event taxonomy.
4. STEP 13.4 — Rich member/recipe tagging.
5. STEP 13.5 — Meal proposals + approval + optional Shopping ingredient handoff.
6. STEP 13.6 — Interaction/compatibility/idempotency contracts.
7. STEP 13.7 — Integrated CI, Preview and real-device acceptance.

## Later-phase requirements

### STEP 14 — Search / autocomplete
Household-scoped index; clear/rebuild on context switch; no stale previous-household results.

### STEP 14A — Platform operations dashboard
Privacy-safe operational projection only. Platform admin remains separate from household roles and receives no generic raw household-content access.

### STEP 15 — Firebase Rules hardening
Shared allowlist, append-only activity rules, notification/token/owner/member isolation and privacy-safe platform operations. Emulator/tests first.

### STEP 16 — Legacy cleanup
Retire old authorities/bridges/listeners only after canonical replacements are proven.

### STEP 17 — Store distribution readiness
Final native/store shell, push/deep links, account deletion, privacy disclosures, signing/testing and then-current Apple/Google policy review.

## Store-ready architecture principle

Keep the boundary:

`UI / platform shell -> application services -> repositories/domain -> Firebase/backend`

Core business rules must not live only in the web Feed/UI. STEP 13 activity and meal-proposal behavior must therefore expose domain/service contracts that can later be called by a native shell.

## Multi-family / privacy release principle

The rebuild is not complete merely because one household works. Shared records must remain household-scoped, private records UID-scoped, household switching must not leak state, and platform-admin capabilities must use sanitized operational data rather than unrestricted household content. Detailed acceptance remains in `docs/multi-family-prototype-acceptance.md`.
