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

## Current position — synced 2026-08-26

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
- [-] STEP 10 — Notifications — canonical inbox, trusted sender, external iOS Web Push, task-help response handling and push-tap routing/de-duplication are now real-device proven. Remaining final acceptance is read/dismiss reconnect persistence, identity-isolated in-app banners/account switch, and background/foreground stability before freeze.

**Current phase: STEP 10 Notifications.** The Home Screen PWA has received a real external iOS lock-screen notification, and tapping that notification now also passed the real-device routing gate: FamilyApp opens/focuses Meldingen and the canonical item appears exactly once. Targeted **Afwijzen** and household **Niet voor mij** are also accepted. STEP 10 is not frozen yet because read/dismiss persistence, identity isolation and final stability still need explicit verification.

## Frozen phases

### STEP 8 — Finance
- [x] Accepted/frozen after household isolation, analysis/export and real iPhone premium PDF/share acceptance.

### STEP 9 — Progression / XP / Achievements
- [x] Accepted/frozen after canonical UID progression, deterministic/idempotent rewards, served-runtime audit and real iPhone acceptance.

## STEP 10 — Notifications

### Canonical notification / Web Push foundation
- [x] Household-scoped canonical notification state with HouseholdContext lifecycle protection.
- [x] Per-UID read/dismiss semantics and deterministic event IDs.
- [x] Profile → Meldingen canonical notification center.
- [x] Private multi-device FCM registry and explicit opt-in.
- [x] Account-switch push transport invalidation.
- [x] Trusted sender verifies caller/member/event actor and resolves recipients/tokens server-side.
- [x] Private delivery receipts and invalid-token cleanup.
- [x] External iOS Web Push real-device accepted on Home Screen PWA.
- [x] Real push-tap routing/de-duplication accepted: tapping an external push opens/focuses Meldingen with exactly one canonical inbox item.

### Delivery blockers resolved
- [x] JWT signature root cause fixed: raw RSA `Buffer` bytes now base64url encode correctly instead of JSON-stringifying the Buffer.
- [x] Cryptographic JWT regression test added.
- [x] RTDB 401 root cause fixed: `userinfo.email` added alongside `firebase.database` and `firebase.messaging`.
- [x] Safe RTDB failure diagnostics added.
- [x] Real iPhone lock-screen/banner notification proves both fixes work end-to-end.

### Task-help response lifecycle
- [x] `TaskSharedData v2.2.0` adds occurrence-scoped `declineHelp(id)` state.
- [x] Targeted request exposes **Hulp geven / Afwijzen**.
- [x] Targeted decline closes only that invite and persists recipient + occurrence.
- [x] Household broadcast exposes **Hulp geven / Niet voor mij**.
- [x] Household opt-out is UID-local and keeps the broadcast open for others.
- [x] Opted-out UID cannot accept the same occurrence.
- [x] Later help cycle resets old decline state.
- [x] Stale notification occurrence is never actionable against a newer request.
- [x] `NotificationActions v3.1.0` and `TaskHouseholdHelpUi v1.1.0` wired into served runtime.
- [x] Help-action regressions green.
- [x] Real-device targeted **Afwijzen** acceptance: request stays resolved after reload/reopen and invitation is closed.
- [x] Real-device household **Niet voor mij** acceptance: opted-out UID stays resolved while another eligible member can still choose **Hulp geven**.

### Auth / account lifecycle
- [x] Alternate Google account can authenticate/join/use household.
- [x] Profile/Meer **Uitloggen** accepted.
- [x] `Verse start` removed.
- [x] UID-scoped profile values prevent account leakage.
- [x] Normal-member **Gezin verlaten** accepted.
- [ ] Owner-transfer **Gezin verlaten** real smoke test.

### Latest code / CI / Preview
- [x] Contract-verified code checkpoint `884a8eb7878067143efbd4394a7f76c0de461581`.
- [x] `Household Rebuild Contracts` SUCCESS — run `32910497000`.
- [x] Vercel Preview `dpl_RHJZQZdZPfxMvVMUMDXF2orP7UrY` READY for that checkpoint.
- [x] Stable branch alias: `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- [x] Main untouched; no production Firebase Rules change.

### Device acceptance still open
- [x] Standalone iPhone permission/registration.
- [x] Cross-account canonical notification reaches intended UID.
- [x] Background/closed-PWA OS push reaches iPhone.
- [x] Push tap opens/focuses notification screen without duplicate inbox event.
- [ ] UID-specific read/dismiss survives reconnect.
- [x] Targeted **Hulp geven / Afwijzen** real-device acceptance.
- [x] Household **Hulp geven / Niet voor mij** real-device acceptance.
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
- 2026-08-24 — STEP 9 Progression / XP / Achievements accepted/frozen.
- 2026-08-24 — STEP 10 canonical notification + Web Push + trusted sender foundations implemented.
- 2026-08-24 — iPhone standalone push permission/device registration accepted.
- 2026-08-25 — alternate-account auth/onboarding, logout/profile isolation and normal-member household leave accepted.
- 2026-08-25 — real cross-account test isolated invalid JWT signature before FCM.
- 2026-08-26 — JWT Buffer encoding root cause fixed and cryptographically regression-tested.
- 2026-08-26 — RTDB 401 traced to missing `userinfo.email` scope and fixed.
- 2026-08-26 — **real external iOS lock-screen FamilyApp push received; Web Push end-to-end accepted.**
- 2026-08-26 — targeted **Afwijzen** + household **Niet voor mij** help-response lifecycle implemented with occurrence safety; full rebuild contracts SUCCESS at `884a8eb7...`.
- 2026-08-26 — **real-device targeted Afwijzen and household Niet voor mij tests both accepted.**
- 2026-08-26 — **real-device push-tap routing/de-duplication accepted:** tapping an external iOS notification opens/focuses Meldingen and shows the canonical event exactly once.

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
