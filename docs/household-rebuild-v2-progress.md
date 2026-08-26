# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`  
Working branch: `agent/household-rebuild-v2`  
Day-to-day execution source: `docs/FAMILYAPP-CURRENT-TODO.md`  
Cross-chat history: `docs/FAMILYAPP-UPDATE-LOG.md`  
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

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
- [-] STEP 10 — Notifications — canonical inbox, trusted sender, external iOS Web Push, task-help response handling, push-tap routing/de-duplication, read/dismiss persistence and real same-iPhone account switching to account B are proven. Real-device feedback exposed three blockers before freeze: installed-PWA safe-area overlap, stale prior-UID header avatar after account switch, and incomplete Home dark mode. Intended-identity banner/account-switch isolation and background/foreground stability remain open.

**Current phase: STEP 10 Notifications.** Account B has now been verified as the actually active Firebase Auth identity on the same iPhone using the Profile **Actief account** row. This exposed a genuine UI/state isolation bug: the small top-left avatar can still remain from account A even though Firebase Auth is account B. Together with the iOS Home Screen safe-area overlap and incomplete Home dark mode, these must be fixed before STEP 10 can freeze.

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
- [x] UID-specific read/dismiss persistence accepted across full app close/reopen.

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
- [x] Profile shows read-only **Actief account** from the current Firebase Auth e-mail.
- [x] Same-iPhone account switch verified: Profile shows account B after sign-out/re-login.
- [x] Normal-member **Gezin verlaten** accepted.
- [ ] Header avatar lifecycle/isolation: after switching A → B, top-left avatar must not retain account A.
- [ ] Owner-transfer **Gezin verlaten** real smoke test.

### Current real-device blockers before STEP 10 freeze
- [!] Installed iOS PWA safe area: top-right search/notification controls overlap the system status icons.
- [!] Header avatar identity: current Firebase Auth is B, but top-left avatar can remain from A.
- [!] Home dark mode: header/navigation are dark while large Home surfaces/background remain white.

### Latest code / CI / Preview
- [x] Contract-verified code checkpoint `58d46b463648f06bbb7b2aebb0efa1ecfc2a3864`.
- [x] `Household Rebuild Contracts` SUCCESS — run `32916523638`.
- [x] Stable branch alias: `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- [x] Main untouched; no production Firebase Rules change.

### Device acceptance still open
- [x] Standalone iPhone permission/registration.
- [x] Cross-account canonical notification reaches intended UID.
- [x] Background/closed-PWA OS push reaches iPhone.
- [x] Push tap opens/focuses notification screen without duplicate inbox event.
- [x] UID-specific read/dismiss survives reconnect.
- [x] Targeted **Hulp geven / Afwijzen** real-device acceptance.
- [x] Household **Hulp geven / Niet voor mij** real-device acceptance.
- [x] Same-iPhone active Firebase Auth identity switches to account B.
- [ ] Live in-app banner visible only for intended identity.
- [ ] Account-switch/logout isolation across inbox/banner/push registration/avatar state.
- [ ] Installed PWA header respects iOS safe area.
- [ ] Home dark mode fully consistent.
- [ ] Reload/background→foreground stability.
- [ ] Explicit product acceptance/freeze of STEP 10.

## Running product/fix backlog

Full specification: `docs/FAMILYAPP-FIX-LIST.md`.

**Open main items: 5**

1. Home hero card backgrounds.
2. Internationalisation: NL / EN / TR / DE / FR.
3. Task name more prominent in task-create popup.
4. Recipe → propose meal to a household member with realtime accept/reject workflow.
5. Shopping → complete trip with optional receipt and failure-safe purchased-item cleanup.

These five product items stay separate from the three current STEP 10 acceptance blockers above.

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
- 2026-08-26 — targeted **Afwijzen** + household **Niet voor mij** help-response lifecycle implemented with occurrence safety.
- 2026-08-26 — **real-device targeted Afwijzen and household Niet voor mij tests both accepted.**
- 2026-08-26 — **real-device push-tap routing/de-duplication accepted.**
- 2026-08-26 — **real-device UID-specific read/dismiss persistence accepted across full close/reopen.**
- 2026-08-26 — Profile **Actief account** indicator added and contract-green at `58d46b46...`.
- 2026-08-26 — **same-iPhone switch to account B verified**; screenshot/feedback exposed stale account-A header avatar plus PWA safe-area and Home dark-mode blockers.
- 2026-08-26 — running five-item FamilyApp product/fix backlog centralized in `docs/FAMILYAPP-FIX-LIST.md`.

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
