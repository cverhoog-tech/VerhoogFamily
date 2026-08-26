# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications remains in progress. External iOS Web Push, task-help response handling, push-tap routing/de-duplication, UID-specific read/dismiss persistence, real same-iPhone account switching to account B, UID-scoped avatar isolation, installed-iOS-PWA safe-area handling, and full Home dark-mode behavior are now real-device proven. The three UI/account blockers found during the account-isolation smoke are accepted on the real iPhone. Remaining STEP 10 gates are intended-identity in-app banner/account-switch isolation, final background/foreground stability, owner-transfer household-leave smoke if still required for the phase gate, and explicit freeze.**

STEP 8 Finance and STEP 9 Progression remain accepted/frozen. `main` and production Firebase Rules remain untouched.

## Latest verified product state

- [x] Alternate Google account can authenticate and participate in the same household.
- [x] Same-iPhone Google/Firebase account switch to account B has been verified using the **Actief account** e-mail indicator.
- [x] Canonical cross-account notification state reaches the intended iPhone/PWA account.
- [x] External iOS Web Push works outside FamilyApp on the Home Screen PWA.
- [x] Push tap opens/focuses Meldingen and produces exactly one canonical inbox item.
- [x] UID-specific read/dismiss persistence survives full close/reopen.
- [x] Profile/Meer **Uitloggen** works; `Verse start` removed.
- [x] UID-scoped Profile values prevent browser profile-name leakage.
- [x] Profile shows **Actief account** from Firebase Auth directly.
- [x] Normal-member **Gezin verlaten** accepted.
- [x] Targeted task-help **Afwijzen** and household **Niet voor mij** accepted on real device.
- [x] **STEP 10 account avatar isolation accepted:** after A → B switching, the top-left/Home avatar follows account B and no longer remains account A.
- [x] **STEP 10 iOS PWA safe area accepted:** installed-PWA search/notification controls sit correctly below the iPhone system status area.
- [x] **STEP 10 Home dark mode accepted:** Home now follows dark mode consistently without the previous large white shell/background surfaces.
- [ ] Owner-transfer **Gezin verlaten** still needs a real smoke test.

## STEP 10 — Notifications

### Canonical notification + Web Push foundation — complete
- [x] Household-scoped canonical notification repository with HouseholdContext UID/household/revision identity.
- [x] Exact listener teardown, stale-callback rejection and immediate projection clear.
- [x] Per-UID read/dismiss state.
- [x] Deterministic event keys / publish-once idempotency.
- [x] `NotificationStore v2.1.0` canonical facade.
- [x] Push failure cannot invalidate canonical inbox state.
- [x] Task / Swap / Party Quest / Finance producers use the canonical notification path.
- [x] Profile → Meldingen opens the canonical notification center.
- [x] User-private multi-device FCM registry.
- [x] Explicit push opt-in only; iPhone requires Home Screen/standalone context.
- [x] Same-browser UID switch invalidates the prior browser push transport.
- [x] Background service worker + notification click routing present.
- [x] Foreground FCM does not duplicate canonical inbox events.
- [x] Trusted Vercel sender verifies caller, household membership and event actor; recipients/tokens are resolved server-side.
- [x] Private per-device delivery receipts and invalid-token cleanup.

### Push blockers — resolved and real-device proven
- [x] JWT RSA signature bytes are base64url-encoded correctly.
- [x] RTDB service-account OAuth includes `userinfo.email`, `firebase.database`, `firebase.messaging`.
- [x] Safe RTDB 401/403 diagnostics do not log secrets.
- [x] Real iPhone Home Screen PWA received an external FamilyApp push.
- [x] Real push-tap smoke opens/focuses Meldingen with one canonical item.

### Task-help response lifecycle — real-device accepted
- [x] `TaskSharedData v2.2.0` adds occurrence-scoped `declineHelp(id)` state.
- [x] Targeted help exposes **Hulp geven / Afwijzen**.
- [x] Household help exposes **Hulp geven / Niet voor mij** and opt-out is UID-local.
- [x] Old decline/opt-out state resets on a later help occurrence.
- [x] Stale occurrence notifications cannot act on a newer request.
- [x] Real-device targeted and household response tests accepted.

### Active-account identity diagnostic — accepted
- [x] Profile reads the current e-mail from Firebase Auth, never from local profile fields.
- [x] Profile exposes a read-only **Actief account** row.
- [x] Real iPhone test confirmed A → B changes the displayed active e-mail to account B.

### Avatar account-isolation fix — real-device accepted
- [x] `avatarStore.js` now stores authenticated avatar URL and avatar ID under UID-scoped keys.
- [x] Authenticated avatar resolution never treats unscoped `familyapp-current-user-avatar-v1` as current-user authority.
- [x] `avatarIdentityBridge v2.0.1` resolves the active avatar from canonical HouseholdContext/Firebase UID and blocks a stale cached v1 bridge from running afterward.
- [x] `householdIdentityFirebaseBridge v5.0.1` migrates/projects avatars only from UID-scoped state and rejects avatar events for a different UID.
- [x] New `legacyProfileUidBridge v1.0.0` keeps remaining unscoped compatibility keys as a projection of the current UID rather than shared identity authority.
- [x] Served runtime cache cutover: `avatarIdentityBridge.js?v=2`, `householdIdentityFirebaseBridge.js?v=5`, `legacyProfileUidBridge.js?v=1`.
- [x] `scripts/test-avatar-account-isolation.js` added and full suite green.
- [x] Real iPhone acceptance: A → B switch no longer retains account A's top-left/Home avatar.

### Installed PWA safe-area + Home dark-mode fix — real-device accepted
- [x] New `src/styles/homePwaShellFix.css?v=1` is served after `app.css`.
- [x] Installed standalone header uses `env(safe-area-inset-top)` instead of device-specific pixel offsets.
- [x] Sticky task/finance tabs include the same safe-area offset.
- [x] Dark theme restores `var(--c-bg)`, `var(--c-text)`, header/nav theme tokens over the legacy `#fff !important` refresh layer.
- [x] Home heading/day/XP/activity/fallback carousel surfaces are dark-theme aware.
- [x] Named dark themes (`*-dark`) receive the same shell fix.
- [x] `scripts/test-home-pwa-shell.js` added; full contract suite green.
- [x] Real iPhone acceptance: installed PWA controls sit fully below the system status icons.
- [x] Real iPhone acceptance: Home dark mode contains no unintended large white shell/background areas.

### Latest code / CI / Preview
- [x] Current code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] `Household Rebuild Contracts` SUCCESS — run `32954316879`.
- [x] Vercel Preview `dpl_3FjdEX2qemXGjNFvT7Tb3TNtnVEj` READY.
- [x] Served Preview verified to include `homePwaShellFix.css?v=1` after `app.css?v=3` and the UID-safe avatar runtime scripts.
- [x] Stable branch alias: `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- [x] No production Firebase Rules change and no `main` change.

### Remaining STEP 10 acceptance
- [x] Background/closed-PWA external OS push reaches iPhone.
- [x] Push tap opens/focuses FamilyApp notifications with exactly one canonical inbox item.
- [x] UID-specific read/dismiss survives reload/reconnect.
- [x] Same-iPhone account switch changes active Firebase Auth identity to B.
- [x] Targeted **Hulp geven / Afwijzen** real-device accepted.
- [x] Household **Hulp geven / Niet voor mij** real-device accepted.
- [x] Avatar A → B account-isolation accepted on current Preview.
- [x] Installed PWA header safe-area accepted on current Preview.
- [x] Home dark-mode accepted on current Preview.
- [ ] Live in-app banner visible only for intended identity.
- [ ] Account switch/logout never leaks inbox/banner/push registration from prior UID.
- [ ] Reload/background→foreground stable: no freeze/white screen/WebKit crash.
- [ ] Owner-transfer household-leave smoke if still required for the STEP 10 phase gate.
- [ ] Freeze STEP 10 only after explicit product acceptance.

## Running product/fix backlog

Full details: `docs/FAMILYAPP-FIX-LIST.md`.

**Open main items: 5**
1. Home hero card backgrounds.
2. Internationalisation: NL / EN / TR / DE / FR.
3. Task title more prominent in task-create popup.
4. Recipe → propose meal to household member with realtime accept/reject workflow.
5. Shopping → complete trip with optional receipt and failure-safe purchased-item cleanup.

These five items remain separate from STEP 10 acceptance.

## Later roadmap phases

- [ ] STEP 11 — Party quests.
- [ ] STEP 12 — Profile / presence / avatars.
- [ ] STEP 13 — Activity / feed.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Privacy-safe platform operations/admin dashboard.
- [ ] STEP 15 — Firebase Rules + media authorization hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] Multi-family broader-beta gate with at least three independent households.
- [ ] STEP 17 — Store distribution readiness.

## Standing guardrails

- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8 and STEP 9 remain frozen.
- UID/household identity comes from HouseholdContext / Firebase Auth.
- Notification state and push delivery remain separate layers.
- Realtime subscriptions require exact cleanup + stale-context protection.
- Push/device credentials remain private technical data.
- Server secrets never enter client/public repository code or chat.
- Every meaningful development update updates this TODO, the progress tracker and `docs/FAMILYAPP-UPDATE-LOG.md` in the same work session.
