# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`
Working branch: `agent/household-rebuild-v2`
Baseline main SHA: `997eb0710f512857a3280e776ab38988a7ee5a86`

This is the living execution tracker for the current rebuild. The roadmap remains the architectural source of truth.

## Status legend

- `[ ]` not started
- `[-]` in progress
- `[x]` completed / accepted or deliberately closed by product decision
- `[!]` blocked / needs attention

## Prototype end-goal gate

Detailed contract: `docs/multi-family-prototype-acceptance.md`.

- [x] Multi-family readiness is an explicit prototype end goal.
- [x] Personal platform-admin capability is an explicit prototype end goal.
- [x] Privacy boundary defined: sanitized operational diagnostics by default, no generic raw household-content access.
- [x] Admin authority must be tied to the product owner's authenticated personal UID via server-verifiable authorization.
- [ ] At least three independent households pass end-to-end isolation/lifecycle acceptance.
- [ ] Core modules prove no cross-household read/write/state leakage.
- [ ] Account switch/logout/reconnect/removed-member behavior passes isolation tests.
- [ ] Sanitized platform operations/admin dashboard accepted.
- [ ] Firebase/Storage Rules prove household isolation and admin privacy boundary.
- [ ] Broader family beta acceptance gate passed.

## Current position

- [x] STEP 0 stable baseline.
- [x] STEP 1 authenticated session / startup ownership.
- [x] STEP 2 HouseholdContext / UID identity / lifecycle.
- [ ] STEP 2A platform-admin identity foundation — paused until STEP 2B closes.
- [-] STEP 2B Person/UI identity modernization.
- [x] STEP 2B.1 backdrop foundation.
- [x] STEP 2B.2 preset picker.
- [ ] STEP 2B.3 hero backdrop upload support.
- [x] STEP 2B.4 Global FamilyApp Icon System — current scope accepted; no further broad icon migration required.
- [x] STEP 2B.5 Brand/PWA identity accepted and frozen.
- [x] STEP 2B.6 Tasks icon/detail/create presentation accepted and frozen.
- [x] STEP 2B.7 Shopping / Recipes / Meals icon presentation accepted and frozen.
- [x] STEP 2B.8 Feed / Notifications / Agenda / Finance / Achievements icon migration closed by product decision; current icons retained.

**Next planned functional work: STEP 2B.3 — hero backdrop upload support. After that, close STEP 2B and resume STEP 2A platform-admin identity foundation.**

## Phase checklist

### STEP 0 — Stable baseline
- [x] Baseline main SHA recorded.
- [x] Rebuild branch created from exact stable baseline.
- [x] Baseline checks and Vercel preview accepted.
- [x] Real iPhone Safari smoke test accepted on 2026-08-20.

### STEP 1 — Authenticated session / startup ownership
- [x] Canonical authenticated-session controller.
- [x] One auth/startup owner and one app-reveal pipeline.
- [x] Stale bootstrap protection and deterministic cleanup.
- [x] Legacy localStorage startup reveal retired from served runtime.
- [x] Tests, preview and iPhone gate accepted.

### STEP 2 — HouseholdContext / UID identity / lifecycle
- [x] Canonical UID + household context contract.
- [x] `capture()` / `isCurrent()` stale-context protection.
- [x] Explicit subscription/unsubscribe and household-switch rebind semantics.
- [x] Tests, preview and iPhone gate accepted.

### STEP 2A — Platform admin identity foundation
- [ ] Platform role separated from household role.
- [ ] Platform admin tied to protected authenticated personal UID authority.
- [ ] No client self-elevation.
- [ ] Dedicated platform permission contract.
- [ ] Audit-event contract.
- [ ] Privacy classification enforced.
- [ ] Normal admin API exposes sanitized operational data only.
- [ ] Tests prove household admin is not platform admin.
- [ ] Tests prove platform admin does not imply raw household-content access.
- [ ] Preview/device gate accepted where applicable.

### STEP 2B — Person/UI identity modernization

#### STEP 2B.1 — Backdrop foundation
- [x] Canonical backdrop catalog and resolver.
- [x] Backdrop separate from avatar/portrait media.
- [x] Premium default backdrop asset.
- [x] Person-tab integration and regression contract.
- [x] iPhone gate accepted.

#### STEP 2B.2 — Preset picker
- [x] Own-card edit action.
- [x] Premium picker UI.
- [x] Preset selection/reset.
- [x] UID/household-safe persistence and realtime rerender.
- [x] iPhone gate accepted.

#### STEP 2B.3 — Upload support
- [ ] Image-only upload service.
- [ ] Size/type validation and compression/resize boundary.
- [ ] Household/UID-scoped Firebase Storage path.
- [ ] Upload preview and confirm flow.
- [ ] Persist uploaded backdrop metadata to member profile.
- [ ] Tests/preview/device gate accepted.

#### STEP 2B.4 — Global FamilyApp Icon System
- [x] Central semantic icon registry exists.
- [x] Central renderer/component boundary exists.
- [x] Accepted migrated scopes use the shared system.
- [x] Bottom navigation remains unchanged.
- [x] More-menu icons remain unchanged.
- [x] Remaining current app icons accepted as-is by product decision on 2026-08-22.
- [x] No further broad Person/global icon audit required for the prototype.

#### STEP 2B.5 — App Brand / Logo / PWA Identity
- [x] Approved crest v5 wired across PWA/browser/login contexts.
- [x] Transparent login crest accepted without white tile.
- [x] Add-to-Home-Screen iPhone gate accepted.
- [x] Frozen baseline.

#### STEP 2B.6 — Tasks icon migration
- [x] Task category/content icons migrated where approved.
- [x] Help/party/status migration rejected and fully reverted.
- [x] Detail/create controls migrated where approved.
- [x] Regression contracts and iPhone gate accepted.
- [x] Frozen baseline.

#### STEP 2B.7 — Shopping / Recipes / Meals icon migration
- [x] Canonical food/product icon resolver presentation wired.
- [x] Visible generic fallbacks reduced while legacy stored emoji remains compatibility metadata.
- [x] Behavior unchanged in accepted device smoke test.
- [x] Regression contract and READY preview accepted.
- [x] Frozen baseline.

#### STEP 2B.8 — Feed / Notifications / Agenda / Finance / Achievements icon migration
- [x] Closed by product decision on 2026-08-22.
- [x] Current Feed icons retained.
- [x] Current Notification icons retained.
- [x] Current Agenda icons retained.
- [x] Current Finance icons retained.
- [x] Current Achievement/progression icons retained.
- [x] No additional icon migration/device gate required because no code change is being made.

### STEP 3 — Tasks core
- [ ] Household-scoped task repository.
- [ ] UID identity and mutation boundary.
- [ ] Realtime bind/unbind without duplicate listeners.
- [ ] Existing premium UI retained.
- [ ] Cross-household/lifecycle tests.
- [ ] Tests/preview/device gate accepted.

### STEP 4 — Recipes
- [ ] Firebase shared source of truth.
- [ ] Realtime create/edit/delete.
- [ ] Household rebind/cleanup.
- [ ] Cross-household/lifecycle tests.
- [ ] Tests/preview/device gate accepted.

### STEP 5 — Meals
- [ ] Household-bound meal-plan store.
- [ ] Stable recipe references.
- [ ] Realtime sync/rebind.
- [ ] Cross-household/lifecycle tests.
- [ ] Tests/preview/device gate accepted.

### STEP 6 — Agenda
- [ ] Household-scoped calendar source of truth.
- [ ] Explicit rebind and cleanup.
- [ ] Meal integration after meal store is stable.
- [ ] Cross-household/lifecycle tests.
- [ ] Tests/preview/device gate accepted.

### STEP 7 — Shopping
- [ ] Stable grocery-add/freeze behavior preserved.
- [ ] Household realtime shopping repository.
- [ ] Recipe/meal projection integrated safely.
- [ ] Grocery-add freeze regression test.
- [ ] Cross-household/lifecycle tests.
- [ ] Tests/preview/device gate accepted.

### STEP 8 — Finance
- [ ] Shared-vs-private data classification.
- [ ] Household-scoped finance state where appropriate.
- [ ] Transaction sync and reset semantics.
- [ ] Extra-strict privacy/isolation tests.
- [ ] Tests/preview/device gate accepted.

### STEP 9 — Progression / XP / achievements
- [ ] Canonical UID progression store.
- [ ] Idempotent rewards.
- [ ] Achievement projection.
- [ ] Legacy XP authority retired/read-only.
- [ ] Cross-household/lifecycle tests.
- [ ] Tests/preview/device gate accepted.

### STEP 10 — Notifications
- [ ] Canonical household notification store.
- [ ] Per-UID read/dismiss state.
- [ ] Domain-event projectors.
- [ ] Single scoped listener with cleanup.
- [ ] Native push-compatible separation.
- [ ] Cross-household recipient/deep-link tests.
- [ ] Tests/preview/device gate accepted.

### STEP 11 — Party quests
- [ ] Invites and join/leave.
- [ ] Help requests.
- [ ] Completion/rewards.
- [ ] Notifications and idempotency.
- [ ] Cross-household participant/invite tests.
- [ ] Tests/preview/device gate accepted.

### STEP 12 — Profile / presence / avatars
- [ ] UID profile identity and household-member presentation.
- [ ] Avatar sync/cache.
- [ ] Exactly one presence binding per active context.
- [ ] Exact listener cleanup.
- [ ] Account-switch/household-isolation tests.
- [ ] Tests/preview/device gate accepted.

### STEP 13 — Activity / feed
- [ ] Immutable household activity events.
- [ ] Domain producers and dedupe/idempotency.
- [ ] Feed presentation/interactions.
- [ ] Household isolation/reconnect tests.
- [ ] Tests/preview/device gate accepted.

### STEP 14 — Search / autocomplete
- [ ] Household-scoped index.
- [ ] Clear/rebuild on household switch.
- [ ] No stale prior-household results.
- [ ] Cross-household search-leak tests.
- [ ] Tests/preview/device gate accepted.

### STEP 14A — Platform operations dashboard
- [ ] Dedicated sanitized platform operations projection/API.
- [ ] Household technical health/status dashboard.
- [ ] Member count/schema/migration health.
- [ ] Startup/auth/sync/error summaries.
- [ ] Deliberately collected device/browser/PWA technical context.
- [ ] Notification-delivery health.
- [ ] Beta cohort / feature-flag visibility.
- [ ] Audit/support-case view.
- [ ] No generic raw-family read capability.
- [ ] Raw household content absent from normal admin API/projection.
- [ ] Consent/audited mechanism for any future content-level support access.
- [ ] Tests/preview/device gate accepted.

### STEP 15 — Firebase Rules hardening
- [ ] Canonical path/rules matrix.
- [ ] Shared collection allowlist.
- [ ] Notification/activity/FCM rules.
- [ ] Owner/member/revocation rules.
- [ ] Cross-household reads/writes denied in emulator tests.
- [ ] Removed-member access denied.
- [ ] Platform admin restricted to sanitized operations data.
- [ ] Normal household admin cannot gain platform privileges.
- [ ] Storage paths audited.
- [ ] Emulator/rule tests passed.
- [ ] No production Rules deployment without explicit approval.

### STEP 16 — Legacy cleanup
- [ ] my/partner authorities retired.
- [ ] Guest-mode remnants removed.
- [ ] Unused bridges/stores/listeners removed.
- [ ] Deprecated duplicate code/assets removed only after proof of non-use.
- [ ] Runtime wiring consolidated safely.
- [ ] No global/single-family authority can bypass household isolation.
- [ ] Tests/preview/device gate accepted.

### Multi-family broader-beta acceptance gate
- [ ] Household Alpha fixture accepted.
- [ ] Household Beta fixture accepted.
- [ ] Household Gamma fixture accepted.
- [ ] Same-household collaboration allowed and realtime.
- [ ] Cross-household reads invisible/denied.
- [ ] Cross-household writes denied.
- [ ] Same-device account switch has no stale prior-user/household data.
- [ ] Logout/login/reload preserves correct context.
- [ ] Offline/reconnect cannot flush to wrong household.
- [ ] Removed member loses access.
- [ ] Admin diagnostics support normal bug triage without raw household content.
- [ ] Admin privileged actions authorized and audited.
- [ ] Real iPhone/PWA multi-account smoke gate accepted.

### STEP 17 — Store distribution readiness
- [ ] Re-check current Apple App Store and Google Play requirements.
- [ ] Choose/validate iOS/Android shell strategy.
- [ ] Signing/bundle/build pipeline.
- [ ] App icons/launch/store assets.
- [ ] TestFlight / Google internal testing.
- [ ] Native push + deep links.
- [ ] Secure platform credential storage.
- [ ] Native lifecycle/background integration.
- [ ] Apple-compliant login mix where required.
- [ ] In-app account deletion + backend deletion lifecycle.
- [ ] Privacy policy/legal/support surfaces.
- [ ] App Store privacy + Play Data Safety inventory.
- [ ] Permission/accessibility/device audit.
- [ ] Crash/stability instrumentation.
- [ ] Store reviewer/demo path.
- [ ] Final submission checklist passed.

## Store-readiness check applied to every relevant phase

For each functional phase verify:
- [ ] No unnecessary browser-only business logic introduced.
- [ ] Service/repository contracts remain callable from a future native shell.
- [ ] Data collection and permissions remain minimized.
- [ ] Push/deep-link/lifecycle entry points can be added without duplicating domain logic.
- [ ] Authenticated offline/reconnect behavior remains deterministic.

## Milestone / decision log

- 2026-08-19 — Stable main baseline selected and rebuild branch created.
- 2026-08-19 — Rebuild architecture, platform-admin privacy model and store-readiness direction recorded.
- 2026-08-20 — STEP 0, STEP 1 and STEP 2 accepted on real iPhone Safari.
- 2026-08-20 — STEP 2B opened; backdrop foundation and preset picker accepted.
- 2026-08-20 — Global icon foundation and brand/PWA identity work introduced.
- 2026-08-22 — STEP 2B.5 crest v5/PWA/login accepted and frozen.
- 2026-08-22 — STEP 2B.6 task icon/detail/create presentation accepted and frozen.
- 2026-08-22 — STEP 2B.7 Shopping / Recipes / Meals icon presentation accepted and frozen.
- 2026-08-22 — Product decision: all other current app icons are acceptable for the prototype. STEP 2B.4 icon scope is closed at the current baseline and STEP 2B.8 is deliberately skipped/closed without code changes.
- 2026-08-22 — Multi-family readiness and privacy-safe personal platform administration are explicit broader-beta release gates.

## Maintenance rule

When implementation progresses:
1. update the relevant checklist items;
2. record important implementation/test commits in the milestone log;
3. never mark a functional implementation complete before its required checks/preview/device gate;
4. a deliberate product scope closure may be marked complete without a device gate when it makes no runtime/code change;
5. keep the architecture roadmap synchronized when scope/order/constraints materially change;
6. add household-isolation/lifecycle tests during each module migration rather than postponing them;
7. never use unrestricted household-content access as a shortcut for platform diagnostics.
