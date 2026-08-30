# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap: `docs/household-rebuild-v2-roadmap.md`
STEP 13 spec: `docs/STEP13-ACTIVITY-FEED-SPEC.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 12 — Profile / presence / avatars is COMPLETE + REAL-DEVICE ACCEPTED and merged into `agent/household-rebuild-v2`.**

**STEP 13 — Activity / Feed is now the active roadmap phase. Product scope for the Feed additions was approved on 2026-08-30.**

`main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

## STEP 13 approved product contract

- Preserve current manual social posts and their existing visual/like/comment behavior.
- Introduce separate immutable household activity events with deterministic IDs and idempotent canonical domain producers.
- Activity cards use fixed subtle pastel families for fast scanning:
  - Tasks: mint/green.
  - Meals/Recipes: peach/soft orange.
  - Shopping: soft yellow.
  - Agenda: soft blue.
  - Party Quest/XP/Achievements: lilac.
  - Generic household updates: neutral cream/grey.
- Provide deliberate dark-mode equivalents.
- Remove fake/demo Feed counters and hardcoded activity totals.
- Add structured member tagging using UID.
- Add structured recipe tagging using canonical recipe ID.
- Add interactive meal proposals from the Feed with recipe/date/message/audience and realtime approval/decline state.
- Pending proposals are interactive state, not immutable activity events.
- Approval transition must be exactly-once and hand off to canonical Meal planning.
- After approval, offer **Voeg ingrediënten toe aan boodschappenlijst**.
- Allow shopping-list selection when multiple lists are available.
- Show ingredient preview with add/skip/merge/exclude behavior where practical; avoid blind duplicates.
- Feed must call canonical Meal/Shopping services and never bypass their mutation authority.
- Only confirmed successful results emit immutable meal/shopping activity events.

## STEP 13 execution TODO

### 13.1 — Activity repository / schema / lifecycle
- [ ] Canonical household `activityEvents` repository/schema.
- [ ] Deterministic event IDs/occurrence keys + immutable-write contract.
- [ ] HouseholdContext stale-context guards.
- [ ] Exact subscribe/unsubscribe/rebind behavior.
- [ ] Isolation/lifecycle/idempotency contract tests.

### 13.2 — Domain producers
- [ ] Tasks.
- [ ] Meals.
- [ ] Shopping.
- [ ] Agenda where useful.
- [ ] Party Quest/progression where useful.
- [ ] Producer retry/reconnect duplicate suppression.

### 13.3 — Unified Feed presentation
- [ ] Project manual posts + activity events chronologically.
- [ ] Preserve manual-post visuals.
- [ ] Pastel event-family cards + dark mode.
- [ ] Remove demo/hardcoded counters.
- [ ] Mobile readability/premium polish.

### 13.4 — Rich tags
- [ ] Member tag selection/storage/render/open by UID.
- [ ] Recipe tag selection/storage/render/open by recipe ID.
- [ ] Stable behavior after profile/recipe changes.

### 13.5 — Meal proposals / approval / Shopping handoff
- [ ] Canonical proposal state/service.
- [ ] Feed proposal composer.
- [ ] Explicit approval policy + approve/decline/alternative response.
- [ ] Exactly-once accepted-proposal transition.
- [ ] Plan-meal confirmation.
- [ ] Optional ingredient-to-shopping-list action.
- [ ] Shopping-list chooser.
- [ ] Ingredient add/skip/merge/exclude preview.
- [ ] Canonical Meal/Shopping service mutations.
- [ ] Deterministic successful-result activity events.

### 13.6 — Interaction / compatibility
- [ ] Preserve manual post likes/comments.
- [ ] Define allowed interactions per activity/proposal type.
- [ ] Canonical UID/avatar/member presentation.
- [ ] Quarantine duplicate/legacy Feed authority.
- [ ] Reload/reconnect duplicate-proposal/action/event tests.

### 13.7 — Integrated acceptance
- [ ] Syntax/static checks.
- [ ] STEP 13 contract/regression tests.
- [ ] Full relevant rebuild CI.
- [ ] Vercel Preview.
- [ ] Bundled real-iPhone acceptance.
- [ ] Two-device realtime Feed/tag/meal-proposal test.
- [ ] Explicit idempotency test for meal approval + shopping ingredient handoff.
- [ ] Sync TODO/progress/update log and close STEP 13 only after acceptance.

## Separate lifecycle / product regressions
- [ ] Owner-transfer **Gezin verlaten** real smoke test.
- [-] Google login post-auth handoff/startup follow-up remains open.
- [-] Non-blocking Party Quest acceptance-toast visual recheck remains deferred and does not reopen STEP 11.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Accepted domain authorities remain canonical; STEP 13 must not create second Task/Meal/Shopping/Progression/Notification authorities.
- UID/household identity comes from HouseholdContext/Firebase Auth.
- Realtime subscriptions require exact cleanup and stale-context protection.
- Accelerated validation may bundle low/medium-risk checks; keep security/auth/cross-household/idempotency/release-blocking checks explicit.
- Every meaningful development checkpoint synchronizes this TODO, the progress tracker and update log.
