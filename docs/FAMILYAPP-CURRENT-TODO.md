# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications remains in progress. External iOS Web Push is real-device proven, and the new task-help response lifecycle is now also real-device accepted: targeted requests support `Hulp geven / Afwijzen`, and household-wide requests support `Hulp geven / Niet voor mij` while leaving the broadcast open for other eligible family members. Remaining STEP 10 gates are push-tap routing/de-duplication, read/dismiss reconnect persistence, intended-identity in-app banner behavior, account-switch/logout isolation, and final background/foreground stability before freeze.**

STEP 8 Finance and STEP 9 Progression remain accepted/frozen. `main` and production Firebase Rules remain untouched.

## Latest verified product state

- [x] Alternate Google account can authenticate and participate in the same household.
- [x] Canonical cross-account notification state reaches the intended iPhone/PWA account.
- [x] **External iOS Web Push works outside FamilyApp**: real lock-screen/banner notification observed on 2026-08-26 while the Home Screen PWA was backgrounded/closed.
- [x] JWT signature bug fixed and real-device confirmed.
- [x] RTDB OAuth scope bug (`userinfo.email`) fixed and real-device confirmed by successful downstream push delivery.
- [x] Profile/Meer **Uitloggen** works; `Verse start` removed.
- [x] UID-scoped Profile values prevent Shane/Esra browser leakage to another account.
- [x] Normal-member **Gezin verlaten** accepted.
- [x] Whole-family task help (`Heel het gezin`) exists and supports multiple willing helpers.
- [x] Targeted task-help **Afwijzen** accepted on real device and remains resolved after reload/reopen.
- [x] Household task-help **Niet voor mij** accepted on real device while another eligible family member can still choose **Hulp geven**.
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
- [x] `Invalid JWT Signature` root cause: RSA signature `Buffer` was JSON-stringified before base64url encoding. Fixed by encoding raw bytes.
- [x] Cryptographic JWT regression test added; old implementation fails, fixed implementation passes.
- [x] `PUSH_DATABASE_READ_FAILED 401` root cause: RTDB REST OAuth token missed `userinfo.email`; scope set now includes `userinfo.email`, `firebase.database`, `firebase.messaging`.
- [x] Safe RTDB 401/403 diagnostics added without logging request URL/access token.
- [x] Real iPhone Home Screen PWA received an external FamilyApp push on the lock screen after both fixes.

### Task-help response lifecycle — real-device accepted
- [x] `TaskSharedData v2.2.0` adds occurrence-scoped `declineHelp(id)` state.
- [x] Targeted help: recipient gets **Hulp geven** + **Afwijzen**.
- [x] Targeted **Afwijzen** closes only that invitation and stores the recipient/occurrence so it remains resolved after reload/reconnect.
- [x] Household-wide help: recipient gets **Hulp geven** + **Niet voor mij**.
- [x] **Niet voor mij** is UID-local; it does **not** close the household broadcast for other eligible family members.
- [x] A UID that opted out cannot accept the same help occurrence afterward.
- [x] A later help request on the same task starts a new occurrence and clears old decline/opt-out state.
- [x] Stale notifications from an earlier help occurrence can never become actionable against a newer request.
- [x] `NotificationActions v3.1.0` exposes resolved `Afgewezen` / `Niet voor mij` status and removes actions after response.
- [x] `TaskHouseholdHelpUi v1.1.0` adds **Niet voor mij** in the household help UI.
- [x] New regressions: `test-notification-help-actions.js` plus extended `test-task-household-help.js`.
- [x] Full `Household Rebuild Contracts` SUCCESS on code checkpoint `884a8eb7878067143efbd4394a7f76c0de461581`, run `32910497000`.
- [x] **Real-device targeted test accepted:** brand-new one-person help request showed **Hulp geven / Afwijzen**; after **Afwijzen**, reload/reopen kept it resolved and the invitation closed.
- [x] **Real-device household test accepted:** `Heel het gezin` request showed **Hulp geven / Niet voor mij**; after **Niet voor mij**, that UID stayed resolved while another eligible family member could still choose **Hulp geven**.

### Latest code / CI / Preview
- [x] Contract-verified code checkpoint: `884a8eb7878067143efbd4394a7f76c0de461581`.
- [x] `Household Rebuild Contracts` SUCCESS — run `32910497000`.
- [x] Vercel Preview `dpl_RHJZQZdZPfxMvVMUMDXF2orP7UrY` READY for that code checkpoint.
- [x] Stable branch alias: `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- [x] No production Firebase Rules change and no `main` change.

### Remaining STEP 10 acceptance
- [x] Background/closed-PWA external OS push reaches iPhone.
- [ ] Push tap opens/focuses FamilyApp notifications with exactly one canonical inbox item.
- [ ] UID-specific read/dismiss survives reload/reconnect.
- [ ] Live in-app banner visible only for intended identity.
- [x] Targeted help **Hulp geven / Afwijzen** real-device accepted.
- [x] Household help **Hulp geven / Niet voor mij** real-device accepted, including another member still being able to join.
- [ ] Account switch/logout never leaks inbox/banner/push registration from prior UID.
- [ ] Reload/background→foreground stable: no freeze/white screen/WebKit crash.
- [ ] Freeze STEP 10 only after explicit product acceptance.

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
