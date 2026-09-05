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
- [-] STEP 13 — Activity / Feed — 13.1 through 13.5 implemented; 13.5 REAL-DEVICE ACCEPTED 2026-08-30.
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
- structured member, recipe and task tags;
- interactive meal proposals with realtime approval state;
- accepted proposal hands off to canonical Meal planning;
- optional ingredient handoff to canonical Shopping;
- no direct Feed bypass of canonical Meal/Shopping mutation authority;
- only successful canonical outcomes create immutable result events.

Execution status:
- [x] 13.1 Activity repository/schema/lifecycle — merged via PR #31.
- [x] 13.2 Domain producers + idempotency — merged via PR #34.
- [x] 13.3 Unified Feed projection + pastel activity taxonomy — merged via PR #35 and real-device accepted.
- [x] 13.4 Rich member/recipe/task tagging + premium composer — merged via PR #36 and real-device accepted.
- [x] 13.5 Meal proposals + approval + Shopping ingredient handoff — merged via PR #37 at `558fb2d3cbd61eb7dbe6e66330ac653264169423`; real-device accepted 2026-08-30.
- [ ] 13.6 Interaction/compatibility/idempotency contracts.
- [ ] 13.7 Integrated CI/Preview/real-device acceptance.

## Action Inbox — ACTIVE (started 2026-09-06)

New cross-module milestone, independent of the STEP numbering above: a single app-wide Inbox for every request that needs a yes/no decision (Task-hulp, Task-ruilen, Party Quest-uitnodigingen, Cleaning-hulp, Cleaning-routine-overdracht, Cleaning-tegenvoorstel). Architecture: `src/platform/inbox/` is a pure read/projection/action-routing layer over the existing canonical domain sources — no new writer, no `/inboxRequests` state. Full detail in the update log entry `2026-09-06 — Action Inbox milestone`.

Execution status:
- [x] Fase 1 — Audit of all actionable request flows, accepted (no architecture conflict).
- [x] Fase 2 — Generic aggregator/store (`actionInboxRegistry.js`, `actionInboxStore.js`).
- [x] Fase 3 — Action routing to existing domain runtimes only.
- [x] Fase 4 — Header envelope button + independently-owned badge (`actionInboxHeaderBridge.js`).
- [x] Fase 5 — Functional premium Inbox screen basis (`actionInboxScreen.js`); definitive visual polish deferred.
- [-] Fase 6 — Existing module accept/decline UI kept as fallback/detail; not yet removed anywhere.
- [x] Fase 7 — No new notification spreading; Cleaning tegenvoorstel routes back into existing Cleaning UI via "Ander voorstel".
- [x] Contract tests — `scripts/test-action-inbox.js` added; full existing `scripts/test-*.js` suite re-run green.
- [x] Push to `agent/household-rebuild-v2` — 12 files, byte-verified via fresh clone (only a trailing-newline non-content diff in `api/app.js`); full 110-test suite re-run green on the fresh clone too.
- [ ] CI run confirmed — could not be verified from this session (no tool access to commit check-runs without an open PR); Vercel's own auto-deploy for each commit did succeed (see below), which strongly implies the build step is healthy, but the separate "Household Rebuild Contract Tests" GitHub Action status itself needs a manual check on github.com.
- [x] Vercel preview — latest commit (`29e01f7e...`, "docs: note Action Inbox as separate initiative in fix backlog") deployed READY at `https://verhoog-family-ks84yij7s-cverhoog-techs-projects.vercel.app`.
- [ ] Real-device acceptance checklist (13 points from the milestone brief).

## Validation cadence

Bundle low/medium-risk device smokes into meaningful acceptance sweeps. Keep separate explicit checks for high-risk/destructive/auth-identity/security/cross-household/finance/idempotency/reward/release-blocking behavior. STEP 13 final acceptance still requires 13.6 contract hardening and the 13.7 integrated/two-device sweep.

## Separate lifecycle / product regressions
- [ ] Owner-transfer **Gezin verlaten** real smoke test.
- [-] Google login post-auth handoff/startup follow-up remains open.
- [-] Non-blocking Party Quest acceptance-toast visual recheck remains deferred.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` or a branch based from it unless explicitly approved otherwise.
- Main untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- Accepted domain authorities stay canonical.
- UID/household identity is HouseholdContext/Firebase Auth based.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Every meaningful update synchronizes current TODO, this tracker and update log.
