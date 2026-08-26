# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications remains in progress. External iOS Web Push, task-help response handling, push-tap routing/de-duplication, UID-specific read/dismiss persistence, and real same-iPhone account switching to account B are now proven. The account-isolation smoke also exposed three blockers that must be resolved before STEP 10 can freeze: the installed iOS PWA header overlaps the system status area, the top-left header avatar can remain from account A after switching to account B, and Home dark mode leaves large white surfaces. Remaining STEP 10 gates are intended-identity in-app banner behavior, account-switch/logout isolation, these identity/UI blockers, and final background/foreground stability.**

STEP 8 Finance and STEP 9 Progression remain accepted/frozen. `main` and production Firebase Rules remain untouched.

## Latest verified product state

- [x] Alternate Google account can authenticate and participate in the same household.
- [x] Same-iPhone Google/Firebase account switch to account B has been verified using the new **Actief account** e-mail indicator.
- [x] Canonical cross-account notification state reaches the intended iPhone/PWA account.
- [x] **External iOS Web Push works outside FamilyApp**: real lock-screen/banner notification observed on 2026-08-26 while the Home Screen PWA was backgrounded/closed.
- [x] **Push tap routing works on iPhone**: tapping a real external iOS push opens/focuses FamilyApp Meldingen and the canonical inbox item appears exactly once.
- [x] **UID-specific read/dismiss persistence works**: a read notification stays read after full close/reopen, while a dismissed notification stays absent.
- [x] JWT signature bug fixed and real-device confirmed.
- [x] RTDB OAuth scope bug (`userinfo.email`) fixed and real-device confirmed by successful downstream push delivery.
- [x] Profile/Meer **Uitloggen** works; `Verse start` removed.
- [x] UID-scoped Profile values prevent Shane/Esra browser leakage to another account.
- [x] Profile now shows **Actief account** using the current Firebase Auth user's e-mail directly; it is read-only and not sourced from local profile data.
- [x] Normal-member **Gezin verlaten** accepted.
- [x] Whole-family task help (`Heel het gezin`) exists and supports multiple willing helpers.
- [x] Targeted task-help **Afwijzen** accepted on real device and remains resolved after reload/reopen.
- [x] Household task-help **Niet voor mij** accepted on real device while another eligible family member can still choose **Hulp geven**.
- [ ] **STEP 10 blocker — iOS PWA safe area:** Home header search/notification controls can sit behind iPhone status icons when installed to the Home Screen.
- [ ] **STEP 10 blocker — account avatar isolation:** after switching from account A to B, the small top-left header avatar can still show account A.
- [ ] **STEP 10 blocker — Home dark mode:** header/navigation become dark, but the Home page/background still contains large white areas.
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
- [x] Real push-tap smoke accepted: tapping the external notification opens/focuses Meldingen with exactly one canonical inbox item.

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
- [x] **Real-device targeted test accepted:** brand-new one-person help request showed **Hulp geven / Afwijzen**; after **Afwijzen**, reload/reopen kept it resolved and the invitation closed.
- [x] **Real-device household test accepted:** `Heel het gezin` request showed **Hulp geven / Niet voor mij**; after **Niet voor mij**, that UID stayed resolved while another eligible family member could still choose **Hulp geven**.

### Active-account identity diagnostic — accepted
- [x] Profile reads the current e-mail from `fbAuth.currentUser` / Firebase Auth, never from browser profile fields.
- [x] Profile exposes a clear read-only **Actief account** row.
- [x] Profile module cache cutover bumped to `ProfileScreen.target.js?v=account3`.
- [x] Regression coverage added to `test-profile-session-actions.js`; related household-leave profile contract updated to the new cache key.
- [x] Full `Household Rebuild Contracts` SUCCESS on checkpoint `58d46b463648f06bbb7b2aebb0efa1ecfc2a3864`, run `32916523638`.
- [x] Real iPhone check confirmed the e-mail changes to account B after re-login; same-device identity switching is therefore proven.

### Current STEP 10 blockers from real-device feedback
- [ ] Fix installed iOS PWA top safe-area handling so search/notification controls never overlap the system status icons.
- [ ] Fix header-avatar lifecycle so switching UID cannot retain the prior account's avatar from local/cache state.
- [ ] Fix Home dark-mode surface/background styling so the full Home screen follows dark mode consistently.

### Latest code / CI / Preview
- [x] Contract-verified code checkpoint: `58d46b463648f06bbb7b2aebb0efa1ecfc2a3864`.
- [x] `Household Rebuild Contracts` SUCCESS — run `32916523638`.
- [x] Stable branch alias: `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- [x] No production Firebase Rules change and no `main` change.

### Remaining STEP 10 acceptance
- [x] Background/closed-PWA external OS push reaches iPhone.
- [x] Push tap opens/focuses FamilyApp notifications with exactly one canonical inbox item.
- [x] UID-specific read/dismiss survives reload/reconnect.
- [x] Same-iPhone account switch changes the active Firebase Auth identity to account B.
- [ ] Live in-app banner visible only for intended identity.
- [x] Targeted help **Hulp geven / Afwijzen** real-device accepted.
- [x] Household help **Hulp geven / Niet voor mij** real-device accepted, including another member still being able to join.
- [ ] Account switch/logout never leaks inbox/banner/push registration or avatar state from prior UID.
- [ ] Installed PWA header respects iOS safe area.
- [ ] Home dark mode fully consistent.
- [ ] Reload/background→foreground stable: no freeze/white screen/WebKit crash.
- [ ] Freeze STEP 10 only after explicit product acceptance.

## Running product/fix backlog

The product owner supplied five open product/fix items. Their full acceptance details live in `docs/FAMILYAPP-FIX-LIST.md` and remain separate from STEP 10 acceptance blockers.

- [ ] Home hero card backgrounds.
- [ ] Internationalisation: NL / EN / TR / DE / FR.
- [ ] Task title more prominent in task-create popup.
- [ ] Recipe → propose meal to household member with accept/reject workflow.
- [ ] Shopping → complete shopping trip with optional receipt and safe purchased-item cleanup.

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
