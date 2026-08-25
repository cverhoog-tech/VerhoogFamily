# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`  
Working branch: `agent/household-rebuild-v2`  
Day-to-day execution source: `docs/FAMILYAPP-CURRENT-TODO.md`  
Cross-chat history: `docs/FAMILYAPP-UPDATE-LOG.md`

This is the compact phase-level tracker. The roadmap remains the architecture/scope source; the current TODO is authoritative for the exact next action.

## Status legend
- `[ ]` not started
- `[-]` in progress
- `[x]` accepted/completed
- `[!]` blocked / needs attention

## Current position — synced 2026-08-25

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
- [x] STEP 8 — Finance — accepted/frozen 2026-08-24.
- [x] STEP 9 — Progression / XP / Achievements — accepted/frozen 2026-08-24.
- [-] STEP 10 — Notifications — canonical inbox + Web Push client + trusted sender implemented; iPhone registration and cross-account canonical notification/badge path verified. The Google OAuth `Invalid JWT Signature` blocker has a diagnosed root cause (JWT signature encoding bug, not a credential problem) and a code fix on `agent/household-rebuild-v2`; a real-device retest is still required before final delivery/isolation acceptance.

**Current phase: STEP 10 Notifications.** A real cross-account help request now reaches the iPhone/PWA canonical unread path (red badge), proving the household notification event path is alive. Vercel runtime showed OS delivery failing at the trusted sender before FCM with Google OAuth `invalid_grant` / `Invalid JWT Signature.` — and this persisted even after a full service-account key rotation, which pointed away from the credentials themselves. Live-log + code inspection found the actual cause: `b64url()` JSON-stringified the RSA signature `Buffer` instead of encoding its raw bytes, corrupting every JWT signature regardless of key. Fixed and covered by a cryptographic regression test; Preview redeployed. Do not freeze STEP 10 yet — a real iPhone background/closed-PWA retest is still required.

## Frozen phases

### STEP 8 — Finance
- [x] Accepted/frozen after household isolation, analysis/export and real iPhone premium PDF/share acceptance.

### STEP 9 — Progression / XP / Achievements
- [x] Accepted/frozen after canonical UID progression, deterministic/idempotent rewards, served-runtime audit and real iPhone acceptance.

## STEP 10 — Notifications

### Canonical notification state
- [x] Household-scoped `NotificationHouseholdRepository` with HouseholdContext UID/household/revision identity.
- [x] Exact listener cleanup, immediate projection clear and stale-callback rejection.
- [x] Per-UID read/dismiss semantics.
- [x] Deterministic event keys and publish-once idempotency.
- [x] `NotificationStore v2.1.0` as canonical facade.
- [x] Push handoff occurs only after a newly created canonical event; push failure cannot invalidate inbox state.
- [x] Task/swap/Party Quest/Finance typed notification producers/projectors active in the served runtime.
- [x] Profile → Meldingen routes to the canonical notification center.

### Web Push client / device
- [x] User-private multi-device token registry.
- [x] Explicit opt-in; startup never prompts for notification permission.
- [x] iPhone/iPad Home Screen standalone requirement enforced.
- [x] Account switch invalidates prior browser push transport.
- [x] FCM service worker background payload/click routing implemented.
- [x] Foreground FCM does not create duplicate inbox state.
- [x] Real iPhone standalone-PWA opt-in accepted and device registration enabled.

### Auth / account lifecycle
- [x] Missing/stale household states route to create/join onboarding rather than generic startup failure.
- [x] Canonical Google/household/session load order restored.
- [x] Alternate Google account can authenticate/join/use the household sufficiently to send a cross-account help request.
- [x] Profile/Meer **Uitloggen** accepted in Preview.
- [x] `Verse start` removed from active Meer runtime.
- [x] Profile name/partner browser leakage fixed with UID-scoped values; alternate/new account no longer inherits Shane/Esra.
- [x] Normal-member **Gezin verlaten** real-tested and accepted.
- [ ] Owner-transfer **Gezin verlaten** real smoke test.

### Trusted sender / delivery health
- [x] Vercel trusted sender verifies Firebase caller, active household membership and canonical event actor.
- [x] Recipient audience and device tokens resolved server-side.
- [x] Data-only FCM payload linked to canonical notification identity.
- [x] Private delivery receipts provide per-device idempotency/health.
- [x] Unregistered FCM device cleanup implemented.
- [x] `firebasePushSender v1.0.2` handles quoted/newline env formatting and emits safe OAuth failure diagnostics (HTTP status/error/description + JWT segment lengths only) without secret material.
- [x] Root cause found and fixed: `b64url()` fell through to `JSON.stringify(Buffer)` for the RSA signature bytes instead of raw-byte encoding, corrupting every JWT signature independent of the configured key — confirmed by the fact that a full key rotation did not change the `Invalid JWT Signature` error.
- [x] `scripts/test-push-jwt-signature-contract.js` cryptographically verifies a real generated JWT's signature against its matching public key; confirmed failing pre-fix, passing post-fix.
- [ ] Real-device retest: background/closed-PWA OS push must actually reach iPhone before this row is accepted.

### Household-wide task help extension
- [x] `TaskSharedData v2.1.0` adds first-class `helpAudience='household'` and `requestHouseholdHelp(id)`.
- [x] Targeted one-person help remains backwards compatible.
- [x] Broadcast excludes creator/current assignees/current helpers as new helper candidates.
- [x] Broadcast remains open after one person joins so multiple willing eligible family members can help.
- [x] Creator may retract open broadcast; already accepted helpers remain participants.
- [x] `TaskHouseholdHelpUi v1.0.0` adds **Heel het gezin** to the existing task help picker.
- [x] Eligible broadcast recipients can open the task and choose **Hulp geven**; compact help indicator is actionable.
- [x] Existing notification event semantics fan a null-target help request to all other active household members.
- [x] Contract coverage added for broadcast, multiple helpers, duplicate prevention, owner restrictions and targeted compatibility.
- [ ] Real Preview/device UI test for whole-family help.

### Latest code / CI / Preview
- [x] Code head `f6bb9c7eee3801221cded3d236dd995460adc66d`.
- [x] `Household Rebuild Contracts` SUCCESS — run `32792327306`.
- [x] Vercel Preview `dpl_3to6czrBXjgtceK7jeEPtN4ov4ds` READY.
- [x] Stable branch alias: `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- [x] Main untouched; no production Firebase Rules change.

### Device acceptance still open
- [x] Standalone iPhone permission/registration.
- [x] Cross-account canonical help notification reaches iPhone/PWA unread badge path.
- [ ] Background/closed-PWA OS push after valid sender credentials.
- [ ] Push tap opens/focuses notification screen without duplicate inbox event.
- [ ] UID-specific read/dismiss survives reconnect.
- [ ] Actionable targeted + whole-family task-help acceptance.
- [ ] Account-switch/logout isolation across inbox/banner/push registration.
- [ ] Reload/background→foreground stability.
- [ ] Explicit product acceptance/freeze of STEP 10.

## Prototype end-goal gate

Detailed contract: `docs/multi-family-prototype-acceptance.md`.

- [x] Multi-family readiness is an explicit prototype end goal.
- [x] Personal platform-admin capability is an explicit prototype end goal.
- [x] Privacy boundary defined: sanitized operational diagnostics by default, no generic raw household-content access.
- [ ] At least three independent households pass end-to-end isolation/lifecycle acceptance.
- [ ] Core modules prove no cross-household read/write/state leakage across the complete app.
- [ ] Removed-member behavior passes final broader-beta isolation tests.
- [ ] Sanitized platform operations/admin dashboard accepted.
- [ ] Firebase Rules + media authorization prove household isolation and admin privacy boundary.
- [ ] Broader family beta acceptance gate passed.

## Later roadmap phases
- [ ] STEP 11 — Party quests.
- [ ] STEP 12 — Profile / presence / avatars.
- [ ] STEP 13 — Activity / feed.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Privacy-safe platform operations/admin dashboard.
- [ ] STEP 15 — Firebase Rules + media authorization hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] Multi-family broader-beta acceptance gate.
- [ ] STEP 17 — Store distribution readiness.

## Milestones
- 2026-08-19 — rebuild branch created.
- 2026-08-20 — STEP 0–2 accepted on iPhone.
- 2026-08-22 — STEP 2A/2B and STEP 3 accepted.
- 2026-08-24 — STEP 8 Finance accepted/frozen.
- 2026-08-24 — STEP 9 Progression accepted/frozen.
- 2026-08-24 — STEP 10 canonical notification + Web Push + trusted sender foundations implemented.
- 2026-08-24 — iPhone standalone push permission/device registration accepted.
- 2026-08-24/25 — second-account auth/onboarding regression fixed; alternate account usable in household.
- 2026-08-25 — Profile/Meer logout and UID-scoped Profile values accepted; normal-member household leave accepted.
- 2026-08-25 — real cross-account notification test reached iPhone unread badge but exposed Google OAuth `Invalid JWT Signature` blocker before FCM.
- 2026-08-25 — household-wide task-help broadcast implemented, contract-green and Preview READY.
- 2026-08-26 — Root cause of the `Invalid JWT Signature` OAuth blocker found from live Preview logs: `b64url()` in `firebasePushSender.js` JSON-stringified the RSA signature `Buffer` instead of encoding its raw bytes, corrupting every service-account JWT regardless of key (explains why key rotation didn't help). Fixed, cryptographic regression test added, full relevant STEP 10 suite green, Preview redeployed. **Not yet marked accepted — pending real iPhone background/closed-PWA push retest.**

## Standing guardrails
- Main untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8 and STEP 9 remain frozen.
- Notification state and push delivery remain separate layers.
- UID/household identity is HouseholdContext/Firebase Auth based.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Push/device credentials are private technical data; server secrets never enter client code, repository or chat.
- Every meaningful update synchronizes the current TODO, this tracker and the update log.
