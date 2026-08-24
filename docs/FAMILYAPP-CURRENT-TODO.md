# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications: read-only notification + push audit complete; canonical repository foundation is the next action.**

STEP 8 Finance and STEP 9 Progression / XP / Achievements are accepted/frozen. The STEP 10 audit is stored in `docs/step10-notifications-audit.md`. It found that a useful typed notification stack already exists in the repository but is currently dormant/not served, while the old FCM code is only an incomplete legacy registration stub. Do not simply reactivate the old stack unchanged: first rebuild its persistence/listener ownership on HouseholdContext, add deterministic event idempotency and contract-test lifecycle/isolation. Notification state and push delivery remain separate architectural concerns.

## STEP 8 — Finance

**Status: ACCEPTED / FROZEN on 2026-08-24.**

### Accepted implementation
- [x] Household-scoped canonical Finance repository/store boundary.
- [x] Shared Finance state and transaction synchronization foundation.
- [x] Reset semantics through FinanceStore/FinanceRuntimeShell.
- [x] Old large top `Verse start` card removed; reset action belongs at page bottom only.
- [x] Premium Analyse UI v2 with selected-period comparison.
- [x] Calm `Periode overzicht` hero direction.
- [x] Richer card/button depth without turning Analyse into an image-heavy page.
- [x] Analysis engine for income, expenses, fixed/variable spend, savings, categories, receipts and period comparisons.
- [x] Data-driven `FamilyApp Assistent` recommendations.
- [x] Advisor duplicate-install protection for runtime stability.
- [x] PDF export/share flow from Analyse.
- [x] Final premium Finance PDF report template implemented as a two-page A4 report.
- [x] Premium PDF page 1: branded period/result hero, income/expense/savings KPIs, category bars and the live FamilyApp Assistent recommendation.
- [x] Premium PDF page 2: fixed/variable/savings/receipt summary, category comparison table, savings progress and core insights.
- [x] PDF layout rendered and visually QA'd locally with no clipping/overlap; PDF preflight opens as a valid two-page non-encrypted PDF.
- [x] Automated `test-finance-analysis-export.js` contract covers two-page structure, report sections, advisor projection and retirement of placeholder template copy.
- [x] Extra-strict Finance privacy/isolation regression contracts cover household A→B switching, stale callbacks, household-scoped writes, active-household-only reset, logout projection clear, rejected logged-out writes, stale callback after logout and reconnect into another household.
- [x] Household Rebuild Contracts passed for Finance privacy/export changes.
- [x] Fresh Vercel READY preview verified with deployed `FinanceAnalysisExport v2.0.0`.
- [x] Final real-iPhone verification of the premium two-page PDF accepted by the product owner on 2026-08-24, including the tested render/share flow.
- [x] Legacy phase tracker synchronized so STEP 4 is no longer incorrectly reported as current.
- [x] STEP 8 accepted/frozen.

## STEP 9 — Progression / XP / Achievements

**Status: ACCEPTED / FROZEN on 2026-08-24.**

### Accepted authority / implementation
- [x] Audit currently served progression, XP and achievement files/write paths.
- [x] Detailed authority audit stored in `docs/step9-progression-audit.md`.
- [x] Canonical path defined at `families/{householdId}/members/{uid}/progression`.
- [x] `ProgressionStore v1.0.0` owns XP, deterministic reward ledger, achievements and migration metadata.
- [x] Binding uses `HouseholdContext`; exact listener cleanup and stale-context rejection are enforced.
- [x] Logout/account/household switch immediately clears previous XP/achievement compatibility projections.
- [x] Safe migration reads only the active member's Firebase legacy `xp`/`achievements`; unscoped `fam_myxp_v1`/browser globals never seed another identity.
- [x] `awardOnce(key, amount, metadata)` makes reward claim + XP increment one canonical transaction.
- [x] `unlockAchievementOnce(...)` makes badge unlock + badge XP one canonical transaction.
- [x] `ProgressionRuntime v1.1.0` owns served `awardXP` / `checkAchievements` mutation behavior while retaining compatible UI entry points.
- [x] `ProgressionUidBridge v3.0.0` and `AchievementUidBridge v2.0.0` are compatibility-only; neither remains a Firebase progression authority.
- [x] Existing achievement UI consumes canonical projections without a redesign.

### Accepted deterministic/idempotent served rewards
- [x] One-off task completion: `task:{taskId}` across both legacy toggle and shared UID popup/update path.
- [x] Recurring task completion: task + week/month occurrence key.
- [x] Recurring task day completion: task + week + day occurrence key; old direct `myXP += 2` is neutralized/rerouted canonically.
- [x] Achievement XP: `achievement:{badgeId}`.
- [x] Daily bonus: `daily:{YYYY-MM-DD}`.
- [x] Party Quest completion: `partyQuest:{questId}`; failed XP persistence leaves the quest recoverable instead of silently closing it.
- [x] Feed post: `feedPost:{postId}`.
- [x] Feed reaction/like: `feedLike:{postId}`; unlike/re-like cannot farm XP.
- [x] Manual recipe creation: `recipe:{recipeId}`.
- [x] Recipe link import: direct `recipe:{savedRecipeId}` reward; importer does not leave a second manual-create reward context.
- [x] Note creation: `note:{noteId}`.
- [x] Task-template activation: template + activation batch/first-task ID.
- [x] Skills account-XP side rewards: deterministic skill log sequence keys; local/name-based skill state is not treated as account progression authority.
- [x] Weekly quest bonus/claim rewards: week + quest ID keys.
- [x] Ability XP paths: deterministic copycat/auto-done/triple-use keys; old Triple-XP direct `myXP += 4` is neutralized/rerouted canonically.
- [x] Finance XP side rewards use FinanceStore record/goal/update IDs without changing accepted STEP 8 Finance calculations/UI/data behavior.
- [x] Legacy trade/duo/group/shop alternative XP paths are explicitly classified by the served-runtime audit as currently unreachable/unserved and reserved for STEP 16 cleanup.

### Accepted verification / device gate
- [x] `scripts/test-progression-store.js`.
- [x] `scripts/test-progression-runtime.js`.
- [x] `scripts/test-progression-producer-keys.js`.
- [x] `scripts/test-recurring-progression-rewards.js`.
- [x] `scripts/test-progression-entity-producers.js`.
- [x] `scripts/test-skills-progression-bridge.js`.
- [x] `scripts/test-finance-progression-bridge.js`.
- [x] `scripts/test-progression-served-runtime-audit.js`.
- [x] Final complete Household Rebuild Contracts PASS on code commit `843cbb5f5662cfee6e9aa32164b90b1cd7aa7e18`.
- [x] Vercel deployment `dpl_6FfiZeywGvDMz9nZtHrmQCXib97n` READY for the same code commit.
- [x] Served HTML/runtime wiring verified with the current cache-busted STEP 9 assets/adapters.
- [x] Real iPhone Safari/PWA smoke accepted by the product owner on 2026-08-24: app/session/Home XP normal, normal-task reward path works, duplicate completion cannot farm the same task reward, Achievements renders, multi-module navigation/reload/background→foreground remains stable with no freeze/white screen/crash.
- [x] STEP 9 accepted/frozen.

## STEP 10 — Notifications

**Status: CURRENT PHASE — audit complete; canonical HouseholdContext notification foundation next.**

### Read-only audit
- [x] Inventory the actually served notification modules and bootstrap/runtime wiring.
- [x] Find current `addNotif`/notification creation producers and classify their source domain/event.
- [x] Identify current notification data authority: globals/localStorage/Firebase/member/household paths.
- [x] Map read, unread, dismiss/delete and `Alles gelezen` behavior.
- [x] Map current household/UID scoping and identify display-name/global-state/stale-context risks.
- [x] Identify listener/subscription owners and cleanup behavior across logout/account/household switch.
- [x] Inventory existing browser push / FCM registration, token storage, service-worker hooks and delivery code separately from in-app notification state.
- [x] Persist the audit in `docs/step10-notifications-audit.md`.

### Audit findings
- [x] Existing `NotificationStore`, `NotificationEvents`, `NotificationActions`, `NotificationCenter`, `NotificationDelivery` and task/Party Quest notification projectors are useful prior architecture but are currently dormant/not loaded by the served rebuild runtime.
- [x] Legacy `addNotif(...)` is already a no-op compatibility facade; `notifData` remains legacy demo state only.
- [x] Existing dormant notification persistence is `families/{householdId}/shared/notifications` with per-UID `readBy` / `dismissedBy`, but it still relies on `fbFamilyId`/generic FamilyDataStore rather than HouseholdContext stale-context protection.
- [x] Existing notification publishing uses random IDs and therefore lacks cross-device/domain-event idempotency.
- [x] Existing `NotificationDelivery` is an in-app live banner channel, not OS push.
- [x] Existing FCM code in `duoQuests.js` is an incomplete legacy token-registration stub; reliable push is not currently operational.
- [x] No complete messaging service worker, foreground `onMessage`, token lifecycle, trusted sender or multi-device private token registry was found.

### Canonical in-app notification foundation
- [ ] Add `NotificationHouseholdRepository` bound to `HouseholdContext` at the existing household notification path.
- [ ] Exactly one household + UID listener with explicit detach and stale-callback rejection.
- [ ] Clear stale projection immediately on logout/account/household switch.
- [ ] Convert `NotificationStore` into the canonical facade over that repository while preserving per-UID read/dismiss semantics.
- [ ] Add deterministic `eventKey` / `publishOnce()` so one domain transition cannot create duplicate notification events across devices/tabs.
- [ ] Migrate typed NotificationEvents/projectors to stable keys.
- [ ] Add notification repository lifecycle/isolation/idempotency contracts before serving the new runtime.
- [ ] Wire the notification stack into the actual `/api/app` served graph only after contracts are green.
- [ ] Add served-runtime notification audit.
- [ ] Verify inbox, unread badge, live banner and actionable task/Party Quest notifications cross-device.

### Push delivery — part of STEP 10, separate layer
- [ ] Add a user-private multi-device push registry, logically `users/{uid}/private/pushDevices/{deviceId}`.
- [ ] Keep tokens out of household-shared notification state.
- [ ] Add platform-neutral push registration/delivery service contract for web now and native iOS/Android later.
- [ ] Add deliberate user opt-in/permission flow; do not request notification permission opportunistically during startup.
- [ ] Add Web/PWA service worker + FCM registration/foreground handling.
- [ ] Add token refresh/revocation/logout/account-switch lifecycle handling.
- [ ] Add trusted server-side sender; client must never contain FCM server/service-account credentials.
- [ ] Evaluate Vercel server-side delivery boundary first while Firebase remains on Spark.
- [ ] Push delivery failure must not remove/corrupt canonical notification inbox state.
- [ ] Add sanitized delivery-health status separately from per-user read/dismiss state.

### Final STEP 10 gates
- [ ] Full Household Rebuild Contracts after in-app + push implementation.
- [ ] Fresh Vercel branch preview with served notification/push assets verified.
- [ ] Real iPhone Safari/PWA gate: inbox, unread/read state, cross-device incoming notification, actionable notification, permission/push path where supported, reload/background→foreground stability.
- [ ] Freeze STEP 10 only after product acceptance.

## Later roadmap phases

- [ ] STEP 11 — Party quests.
- [ ] STEP 12 — Profile / presence / avatars.
- [ ] STEP 13 — Activity / feed.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Privacy-safe platform operations/admin dashboard.
- [ ] STEP 15 — Firebase Rules + media authorization hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] Multi-family broader-beta acceptance gate with at least three independent households.
- [ ] STEP 17 — Store distribution readiness.

## Standing product decisions / guardrails

- Main stays untouched until explicit approval.
- Current working branch is `agent/household-rebuild-v2`.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless a new product decision changes that.
- Current accepted icon scope and Brand/PWA identity remain frozen unless a concrete regression/redesign is requested.
- STEP 8 Finance and STEP 9 Progression are frozen; STEP 10 must not casually refactor them.
- Platform admin remains separate from household admin and must not imply unrestricted raw household-content access.
- Notifications must be household-scoped where shared and UID-scoped where user-specific.
- Notification state and push delivery are separate layers; a delivery failure must not redefine canonical notification state.
- Realtime notification subscriptions require explicit teardown and HouseholdContext stale-context protection.
- Push/device credentials are user-private technical data, never household-shared content.
- New notification architecture must remain callable from a future native shell and must not depend on web-only notification APIs for domain correctness.
- Every meaningful development update must append to `docs/FAMILYAPP-UPDATE-LOG.md` and update this TODO in the same work session.