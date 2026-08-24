# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`  
Working branch: `agent/household-rebuild-v2`  
Day-to-day execution source: `docs/FAMILYAPP-CURRENT-TODO.md`  
Cross-chat history: `docs/FAMILYAPP-UPDATE-LOG.md`

This tracker is the compact phase-level view of the rebuild. The roadmap remains the architecture/scope source of truth; the current TODO is authoritative for the exact next action.

## Status legend

- `[ ]` not started
- `[-]` in progress
- `[x]` completed / accepted or deliberately closed by product decision
- `[!]` blocked / needs attention

## Current position — synced 2026-08-24

- [x] STEP 0 — Stable baseline.
- [x] STEP 1 — Authenticated session / startup ownership.
- [x] STEP 2 — HouseholdContext / UID identity / lifecycle.
- [x] STEP 2A — Platform-admin identity foundation. Production activation remains a separate explicitly approved action.
- [x] STEP 2B — Person/UI identity modernization and accepted Brand/PWA/icon scope.
- [x] STEP 3 — Tasks core.
- [x] STEP 4 — Recipes.
- [x] STEP 5 — Meals.
- [x] STEP 6 — Agenda.
- [x] STEP 7 — Shopping.
- [x] STEP 8 — Finance — accepted/frozen on 2026-08-24.
- [x] STEP 9 — Progression / XP / Achievements — accepted/frozen on 2026-08-24.
- [-] STEP 10 — Notifications — read-only notification/push audit complete; canonical HouseholdContext repository foundation next.

**Current phase: STEP 10 Notifications. The existing typed notification stack is useful but dormant/not served and predates the accepted HouseholdContext lifecycle contract. Build/test the canonical repository and deterministic event layer before runtime activation; push remains a separate delivery adapter.**

## Prototype end-goal gate

Detailed contract: `docs/multi-family-prototype-acceptance.md`.

- [x] Multi-family readiness is an explicit prototype end goal.
- [x] Personal platform-admin capability is an explicit prototype end goal.
- [x] Privacy boundary defined: sanitized operational diagnostics by default, no generic raw household-content access.
- [x] Admin authority must be tied to the product owner's authenticated personal UID via server-verifiable authorization.
- [ ] At least three independent households pass end-to-end isolation/lifecycle acceptance.
- [ ] Core modules prove no cross-household read/write/state leakage across the complete app.
- [ ] Removed-member behavior passes final broader-beta isolation tests.
- [ ] Sanitized platform operations/admin dashboard accepted.
- [ ] Firebase Rules + media authorization prove household isolation and admin privacy boundary.
- [ ] Broader family beta acceptance gate passed.

## STEP 8 — Finance

**Status: accepted/frozen on 2026-08-24.**

- [x] Household-scoped canonical Finance repository/store boundary.
- [x] UID + household context lifecycle protection.
- [x] Household-scoped transactions, recurring state, savings goals and reset semantics.
- [x] `Verse start` retained only as intended bottom reset action; top reset card removed.
- [x] Premium Analyse UI v2 and comparison engine.
- [x] Data-driven FamilyApp Assistent with deterministic recommendations.
- [x] Native PDF export/share flow.
- [x] Final premium two-page A4 Finance report template.
- [x] Finance privacy/isolation and logout/reconnect contracts.
- [x] Household Rebuild Contracts passed.
- [x] Fresh Vercel READY preview contains `FinanceAnalysisExport v2.0.0`.
- [x] Final premium PDF iPhone verification accepted by the product owner on 2026-08-24.

## STEP 9 — Progression / XP / Achievements

**Status: accepted/frozen on 2026-08-24.**

### Canonical foundation
- [x] Served progression/XP/achievement authority audit completed and documented.
- [x] Canonical UID + household progression path: `families/{householdId}/members/{uid}/progression`.
- [x] `ProgressionStore v1.0.0` with exact bind/unbind, stale-context rejection and compatibility projection clearing.
- [x] Same-member Firebase legacy XP/achievement migration only; unscoped localStorage is not migration authority.
- [x] Atomic deterministic reward ledger via `awardOnce`.
- [x] Atomic achievement unlock + badge XP transaction.
- [x] `ProgressionRuntime v1.1.0` owns served `awardXP`/`checkAchievements` mutation behavior.
- [x] Legacy `ProgressionUidBridge` and `AchievementUidBridge` retired as mutation/data authorities; compatibility-only adapters remain.
- [x] Achievement UI consumes canonical projection without redesign.
- [x] Logout/login/account/household switch protection and stale callback rejection covered by contracts.
- [x] Cross-household/isolation and duplicate-reward/idempotency coverage.

### Deterministic served producers
- [x] One-off tasks.
- [x] Recurring task occurrences/day rewards.
- [x] Achievement rewards.
- [x] Daily bonus.
- [x] Party Quest completion.
- [x] Feed posts/reactions.
- [x] Manual and imported recipes.
- [x] Note creation.
- [x] Task-template activations.
- [x] Skills / weekly quests / abilities.
- [x] Finance XP side rewards without changing frozen Finance behavior.
- [x] Legacy trade/duo/group/shop alternatives classified as unreachable/unserved in the current served runtime and deferred to STEP 16 cleanup.

### Verification
- [x] Progression store/runtime/producer/recurring/entity/skills/Finance contracts.
- [x] Served-runtime audit against actual `/api/app` load graph.
- [x] Final complete Household Rebuild Contracts green on code commit `843cbb5f5662cfee6e9aa32164b90b1cd7aa7e18`.
- [x] Vercel deployment `dpl_6FfiZeywGvDMz9nZtHrmQCXib97n` READY for the same code commit.
- [x] Served HTML/runtime wiring verified with current STEP 9 assets.
- [x] Real iPhone Safari/PWA gate accepted on 2026-08-24: session/Home XP/task reward/Achievements/module navigation/reload/background→foreground stable with no freeze/white screen/crash.
- [x] STEP 9 frozen.

## STEP 10 — Notifications

**Current phase — audit complete; canonical notification repository foundation next.**

### Audit
- [x] Inventory current served notification/runtime wiring.
- [x] Inventory `addNotif` and typed notification producers.
- [x] Map notification authority, read/unread/dismiss behavior and legacy demo state.
- [x] Map household/UID identity assumptions, listeners and stale-context risks.
- [x] Audit browser push/FCM/token/service-worker/sender state separately from in-app notification state.
- [x] Persist detailed findings in `docs/step10-notifications-audit.md`.
- [x] Existing typed store/events/actions/center/delivery/projectors classified as useful but currently dormant/not served.
- [x] Legacy `addNotif` classified as intentionally non-authoritative.
- [x] Push classified as not operational: only incomplete legacy FCM registration stub exists; no complete service-worker/server-sender/device lifecycle.

### Canonical in-app foundation
- [ ] HouseholdContext-bound `NotificationHouseholdRepository` on the existing household notification path.
- [ ] Exact listener cleanup + stale callback rejection for logout/account/household switch.
- [ ] Per-UID read/dismiss projection retained.
- [ ] Deterministic notification event key / `publishOnce` idempotency.
- [ ] Typed NotificationEvents/projectors migrated to deterministic events.
- [ ] Isolation/lifecycle/idempotency contract coverage.
- [ ] Notification stack activated in actual `/api/app` served runtime only after contracts are green.
- [ ] Served-runtime notification audit.
- [ ] Cross-device in-app inbox/unread/live-banner/action verification.

### Push delivery
- [ ] User-private multi-device push-device registry.
- [ ] Platform-neutral registration/delivery boundary for web and future native shells.
- [ ] Deliberate opt-in/permission flow.
- [ ] Web/PWA service worker + FCM foreground/background support.
- [ ] Token refresh/revocation/logout/account-switch lifecycle.
- [ ] Trusted server-side sender; no service-account/server credentials in client code.
- [ ] Push failure independent from canonical inbox state.
- [ ] Sanitized delivery-health status separate from read/dismiss state.

### Verification
- [ ] Full Household Rebuild Contracts after STEP 10 implementation.
- [ ] Fresh Vercel preview with served notification/push wiring verified.
- [ ] Real iPhone Safari/PWA STEP 10 gate.
- [ ] STEP 10 frozen only after product acceptance.

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

## Standing decisions / guardrails

- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless a new product decision changes that.
- STEP 2B.3 unsigned Cloudinary upload remains prototype-only and must be replaced by an authorized/signed media boundary before broader beta.
- Platform admin remains separate from household admin and must not imply generic raw household-content access.
- Current accepted Brand/PWA/icon scope remains frozen unless a concrete regression or redesign is requested.
- STEP 8 Finance and STEP 9 Progression are frozen.
- STEP 10 notification identity is HouseholdContext/UID based.
- Notification state and push delivery are separate layers.
- Realtime notification subscriptions require explicit cleanup and stale-context protection.
- Browser/native delivery adapters must not become the domain authority for notification state.
- Push delivery credentials are user-private technical data.
- Every meaningful development update must update both `docs/FAMILYAPP-CURRENT-TODO.md` and `docs/FAMILYAPP-UPDATE-LOG.md`.

## Milestone summary

- 2026-08-19 — Stable main baseline selected and rebuild branch created.
- 2026-08-20 — STEP 0, STEP 1 and STEP 2 accepted on real iPhone Safari.
- 2026-08-22 — STEP 2A/2B foundation, Brand/PWA identity and accepted UI/icon scope closed for the prototype baseline.
- 2026-08-22 — STEP 3 Tasks core accepted after isolation contracts, preview and real iPhone gate.
- 2026-08-23 — Rebuild execution advanced through STEP 8 Finance on the active branch; central cross-chat TODO/update log introduced to prevent tracker drift.
- 2026-08-24 — Final premium PDF iPhone test accepted; STEP 8 closed/frozen and STEP 9 opened.
- 2026-08-24 — STEP 9 canonical UID progression foundation and deterministic producer migration completed with green served-runtime contracts.
- 2026-08-24 — STEP 9 real iPhone gate accepted; STEP 9 frozen and STEP 10 Notifications opened.
- 2026-08-24 — STEP 10 notification + push audit completed; dormant prior notification stack mapped and canonical HouseholdContext foundation selected as next implementation step.

## Maintenance rule

When implementation progresses:
1. update the relevant checklist items;
2. append meaningful changes to `docs/FAMILYAPP-UPDATE-LOG.md`;
3. update `docs/FAMILYAPP-CURRENT-TODO.md` in the same work session;
4. never mark a functional phase accepted before its required tests/preview/device gate;
5. keep the architecture roadmap synchronized when scope/order/constraints materially change;
6. add household-isolation/lifecycle tests during each module migration rather than postponing them;
7. never use unrestricted household-content access as a shortcut for platform diagnostics.