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
- [x] STEP 9 — Progression — accepted/frozen 2026-08-24.
- [-] STEP 10 — Notifications — canonical inbox, trusted sender, external iOS Web Push, help responses, push-tap, read/dismiss persistence, A → B Firebase account switching, UID-scoped avatar lifecycle, installed-PWA safe area, Home dark mode, intended-recipient foreground notification, B → A inbox/unread/banner isolation and prior-UID push-registration isolation are now real-device proven. Final reload/background→foreground stability, owner-transfer leave smoke if required, and explicit freeze remain open.

**Current phase: STEP 10 Notifications.** The complete account-isolation path is now accepted on the real iPhone, including the push transport layer: after B → A switch/logout, a brand-new B-only event does not produce a B-only iOS push while the installed PWA is authenticated as A. The immediate next gate is final reload/background→foreground stability.

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
- [x] Push-tap routing/de-duplication real-device accepted.
- [x] UID-specific read/dismiss persistence accepted across full app close/reopen.
- [x] Intended-recipient foreground live notification accepted on real iPhone.

### Task-help response lifecycle
- [x] Targeted request exposes **Hulp geven / Afwijzen**.
- [x] Household broadcast exposes **Hulp geven / Niet voor mij**.
- [x] Decline/opt-out is occurrence-safe and UID-local where appropriate.
- [x] Real-device targeted and household response tests accepted.

### Auth / account lifecycle
- [x] Alternate Google account can authenticate/join/use household.
- [x] Profile/Meer **Uitloggen** accepted.
- [x] `Verse start` removed.
- [x] UID-scoped profile values prevent account leakage.
- [x] Profile **Actief account** reads Firebase Auth e-mail directly.
- [x] Same-iPhone A → B account switch verified using that e-mail indicator.
- [x] Normal-member **Gezin verlaten** accepted.
- [x] Header/Home avatar follows account B after A → B switch on real iPhone.
- [ ] Owner-transfer **Gezin verlaten** real smoke test.

### Avatar account isolation — accepted
- [x] Authenticated avatar URL + avatar ID use UID-scoped storage.
- [x] Unscoped v1 avatar is no longer authenticated identity authority.
- [x] UID-safe `avatarIdentityBridge v2.0.1` follows HouseholdContext and blocks stale v1 execution.
- [x] UID-safe `householdIdentityFirebaseBridge v5.0.1` only migrates scoped avatar state and rejects wrong-UID avatar events.
- [x] `legacyProfileUidBridge v1.0.0` keeps unscoped compatibility keys projected to the current UID only.
- [x] Served runtime uses `avatarIdentityBridge.js?v=2`, `householdIdentityFirebaseBridge.js?v=5`, `legacyProfileUidBridge.js?v=1`.
- [x] `test-avatar-account-isolation.js` regression contract added and green.
- [x] Real iPhone A → B header/Home avatar re-test accepted.

### Installed PWA safe area + Home dark shell — accepted
- [x] `homePwaShellFix.css?v=1` served after `app.css`.
- [x] Standalone header top padding uses `env(safe-area-inset-top)`.
- [x] Sticky task/finance tabs use matching safe-area offset.
- [x] Hard-coded white body/Home/header/nav layers are overridden by dark theme variables.
- [x] Default `dark` and named `*-dark` themes covered.
- [x] Home heading/day/XP/activity/carousel fallback surfaces use dark-theme tokens.
- [x] `test-home-pwa-shell.js` regression contract added and green.
- [x] Real iPhone installed-PWA safe-area re-test accepted.
- [x] Real iPhone Home dark-mode re-test accepted.

### Live notification identity — full account isolation accepted
- [x] Account B in foreground receives a newly targeted task-help notification from account A.
- [x] The red unread count updates on B.
- [x] The canonical notification appears exactly once in B's Meldingen.
- [x] After B → A switch/logout, B's inbox/unread/banner state does not remain visible under A.
- [x] While A is active in the same PWA, a new B-targeted event does not surface to A.
- [x] With A active and the PWA backgrounded/closed, a new B-only event does not produce a B-only iOS OS push; prior-B push registration isolation is accepted.

### Latest code / CI / Preview
- [x] Current code checkpoint `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] `Household Rebuild Contracts` SUCCESS — run `32954316879`.
- [x] Vercel Preview `dpl_3FjdEX2qemXGjNFvT7Tb3TNtnVEj` READY.
- [x] Served HTML verified to include the shell CSS after app.css and UID-safe avatar runtime.
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
- [x] Same-iPhone active Firebase Auth identity switches to B.
- [x] Avatar A → B isolation on current Preview.
- [x] Installed PWA header safe area on current Preview.
- [x] Home dark mode on current Preview.
- [x] Intended-recipient live in-app notification/unread/inbox path on current Preview.
- [x] Account-switch/logout UI isolation across prior UID inbox/unread/banner state.
- [x] Prior-UID push-registration isolation after switch/logout.
- [ ] Reload/background→foreground stability.
- [ ] Owner-transfer household-leave smoke if required for phase gate.
- [ ] Explicit product acceptance/freeze of STEP 10.

## Running product/fix backlog

Full specification: `docs/FAMILYAPP-FIX-LIST.md`.

**Open main items: 5**

1. Home hero card backgrounds.
2. Internationalisation: NL / EN / TR / DE / FR.
3. Task name more prominent in task-create popup.
4. Recipe → propose meal to a household member with realtime accept/reject workflow.
5. Shopping → complete trip with optional receipt and failure-safe purchased-item cleanup.

These five product items stay separate from STEP 10 acceptance.

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
- 2026-08-26 — real external iOS lock-screen push accepted.
- 2026-08-26 — targeted **Afwijzen** + household **Niet voor mij** accepted on device.
- 2026-08-26 — push-tap routing/de-duplication accepted.
- 2026-08-26 — UID-specific read/dismiss persistence accepted.
- 2026-08-26 — Profile **Actief account** indicator added; A → B active Firebase identity verified on same iPhone.
- 2026-08-26 — real-device feedback exposed prior-UID avatar, PWA safe-area and Home dark-mode blockers.
- 2026-08-26 — all three blockers received contract-green code fixes at checkpoint `538a5b89...`.
- 2026-08-26 — real iPhone accepted all three fixes: A → B avatar isolation, installed-PWA safe-area layout, and complete Home dark mode.
- 2026-08-26 — real iPhone accepted the intended-recipient foreground notification path.
- 2026-08-26 — real iPhone accepted B → A UI/inbox notification isolation.
- 2026-08-26 — **real iPhone accepted prior-UID push-registration isolation: B-only OS push does not reach the device after switch/logout to A.**

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
