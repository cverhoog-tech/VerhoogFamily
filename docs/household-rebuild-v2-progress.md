# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`  
Working branch: `agent/household-rebuild-v2`  
Day-to-day execution: `docs/FAMILYAPP-CURRENT-TODO.md`  
STEP 13 detail: `docs/STEP13-ACTIVITY-FEED-SPEC.md`  
Cross-chat history: `docs/FAMILYAPP-UPDATE-LOG.md`

## Current position — synced 2026-08-30

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
- [x] STEP 8 — Finance — accepted/frozen.
- [x] STEP 9 — Progression — accepted/frozen.
- [x] STEP 10 — Notifications — accepted/frozen.
- [x] STEP 11 — Party Quests — COMPLETE + REAL-DEVICE ACCEPTED 2026-08-30.
- [x] STEP 12 — Profile / presence / avatars — COMPLETE + REAL-DEVICE ACCEPTED 2026-08-30.
- [-] STEP 13 — Activity / Feed — product scope approved; implementation next.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Privacy-safe platform operations/admin dashboard.
- [ ] STEP 15 — Firebase Rules hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] Multi-family broader-beta acceptance gate.
- [ ] STEP 17 — Store distribution readiness.

## STEP 12 accepted checkpoint

STEP 12 was implemented on a rebuild-v2-based branch, real-device tested successfully, and merged through PR #29 into `agent/household-rebuild-v2`. Profile name identity now syncs to the Firebase member identity while the rebuild's UID-scoped local projection remains intact; Profile surfaces realtime presence/current area and avatar/member presentation remains aligned with household identity.

## STEP 13 — Activity / Feed — ACTIVE

Approved direction:
- keep existing manual posts as-is visually and preserve likes/comments;
- introduce separate immutable household activity events;
- deterministic producer/event identity and dedupe/idempotency;
- fixed pastel card family per activity type with dark-mode equivalents;
- structured member and recipe tags;
- interactive meal proposals with realtime approval state;
- accepted proposal hands off exactly once to canonical Meal planning;
- optional ingredient handoff to Shopping with list selection and add/skip/merge/exclude preview;
- no direct Feed bypass of canonical Meal/Shopping mutation authority;
- only successful canonical outcomes create immutable result events;
- remove fake/demo Feed totals.

Execution status:
- [-] 13.1 Activity repository/schema/lifecycle — next implementation checkpoint.
- [ ] 13.2 Domain producers + idempotency.
- [ ] 13.3 Unified Feed projection + pastel activity taxonomy.
- [ ] 13.4 Rich member/recipe tagging.
- [ ] 13.5 Meal proposals + approval + Shopping ingredient handoff.
- [ ] 13.6 Interaction/compatibility/idempotency contracts.
- [ ] 13.7 Integrated CI/Preview/real-device acceptance.

## Validation cadence

Bundle low/medium-risk device smokes into meaningful acceptance sweeps. Keep separate explicit checks for high-risk/destructive/auth-identity/security/cross-household/finance/idempotency/reward/release-blocking behavior. STEP 13 meal approval + shopping handoff requires an explicit idempotency check.

## Separate lifecycle / product regressions
- [ ] Owner-transfer **Gezin verlaten** real smoke test.
- [-] Google login post-auth handoff/startup follow-up remains open.
- [-] Non-blocking Party Quest acceptance-toast visual recheck remains deferred.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- Main untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- Accepted domain authorities stay canonical.
- UID/household identity is HouseholdContext/Firebase Auth based.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Every meaningful update synchronizes current TODO, this tracker and update log.
