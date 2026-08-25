# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications remains in progress. Canonical in-app notifications, iPhone standalone registration and the task-help notification flow work; actual OS push is currently blocked by an invalid Firebase service-account JWT signature in the Vercel Preview sender credentials.**

STEP 8 Finance and STEP 9 Progression remain accepted/frozen. `main` and production Firebase Rules remain untouched.

### Latest verified product state

- [x] Second/alternate Google account can authenticate and participate in the same household; the product owner successfully sent a help request from another account to Shane.
- [x] Cross-account canonical notification state reaches the iPhone/PWA far enough to update the red unread app badge.
- [x] Profile → **Gezin verlaten** normal-member flow real-tested and accepted.
- [x] Profile → **Uitloggen** works and returns to login.
- [x] Meer → **Uitloggen** works.
- [x] **Verse start** removed from the active Meer menu.
- [x] New/alternate account no longer inherits browser-wide `Shane` / `Esra` Profile values.
- [x] Task help now has a **Heel het gezin** option. A creator can broadcast one help request to all eligible household members and multiple willing family members may join; accepted helpers remain participants until they leave, while the creator can retract the still-open broadcast.
- [ ] Real-device smoke test for **Heel het gezin** UI/interaction still required.
- [ ] Owner-transfer variant of **Gezin verlaten** still requires a real smoke test.

## STEP 10 — Notifications

### Canonical notification state — complete
- [x] `NotificationHouseholdRepository v1.0.0` at `families/{householdId}/shared/notifications`.
- [x] HouseholdContext UID + household + revision identity.
- [x] Exact listener teardown, immediate projection clear and stale-callback rejection.
- [x] Per-UID `readBy` / `dismissedBy` state.
- [x] Deterministic `eventKey` / `publishOnce()` idempotency.
- [x] `NotificationStore v2.1.0`; unkeyed publishing rejected.
- [x] Push handoff only for newly created canonical events; push failure cannot undo inbox success.
- [x] Deterministic Task / Swap / Party Quest / Finance events and HouseholdContext-safe projectors/actions/presentation.
- [x] Profile → Meldingen opens the canonical notification screen.

### Web Push client/device — complete
- [x] Private multi-device registry at `users/{uid}/private/pushDevices/{deviceId}`.
- [x] Explicit opt-in only; startup never prompts for Notification permission.
- [x] iPhone requires Home Screen / standalone context before opt-in.
- [x] Same-browser UID switch invalidates previous browser push transport.
- [x] `firebase-messaging-sw.js` handles background data payloads and notification click routing.
- [x] Foreground FCM never creates a duplicate canonical inbox event.
- [x] Real iPhone Home Screen opt-in accepted; device reached enabled registration state.

### Trusted sender — code complete, Preview credential pair blocked
- [x] `PushDeliveryBridge` sends only canonical `{householdId, notificationId}` plus the current Firebase ID token.
- [x] Vercel `api/push-send.js` verifies the caller through the server-only `firebasePushSender` boundary.
- [x] Sender verifies active household membership and canonical event actor.
- [x] Recipient UIDs and enabled device tokens are resolved server-side; browser cannot choose raw recipient tokens/title/body.
- [x] Private per-device delivery receipts provide idempotency and delivery health.
- [x] FCM unregistered devices are disabled.
- [x] Sender credentials remain server-only.
- [x] `firebasePushSender v1.0.1` normalizes quoted/newline env values and logs safe Google OAuth diagnostics without logging secrets.
- [!] **Real Preview OS push is blocked before FCM.** Latest real sends return `POST /api/push-send 502` with Google OAuth `invalid_grant` / `Invalid JWT Signature.`
- [!] This means the configured service-account private key is not valid for the configured service-account identity (most likely mismatched or revoked). The iPhone permission/PWA registration is not the failing layer.
- [ ] Generate a **new Firebase Admin SDK service-account JSON** and replace BOTH Preview values from that same file:
  - `client_email` → `FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL`
  - `private_key` → `FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY`
- [ ] Do not paste the private key into chat/GitHub. Revoke/delete the obsolete key after replacement.
- [ ] Redeploy Preview after the environment update and repeat the background/closed-PWA help-request push test.

> Note: `/api/push-config configured=true` proves required variables are present, not that Google accepts the private-key signature. The runtime delivery call is the validity gate.

### Whole-family task help — code complete, device acceptance open
- [x] `TaskSharedData v2.1.0` adds `requestHouseholdHelp(id)` and `helpAudience='household'`.
- [x] Existing targeted one-person help semantics remain supported.
- [x] Broadcast helper candidates exclude creator, existing assignees and existing helpers.
- [x] A household broadcast remains open after the first helper joins so additional eligible family members may help.
- [x] Duplicate helper joins do not duplicate a helper entry.
- [x] Creator can retract the broadcast without removing helpers who already joined.
- [x] `TaskHouseholdHelpUi v1.0.0` adds **Heel het gezin** to the current task-card/detail help picker and makes household-wide requests actionable for eligible viewers.
- [x] Existing `NotificationEvents.taskHelpRequested(task, null)` fans the request out to all other active household members.
- [x] Served runtime cache cutover: `taskSharedData.js?v=4` + `taskHouseholdHelpUi.js?v=1`.
- [x] `scripts/test-task-household-help.js` covers broadcast + multi-helper + targeted compatibility behavior.
- [ ] Product owner device check: open a task → Hulp vragen → **Heel het gezin**; another member can choose **Hulp geven** and a second eligible member can also join.

### Auth / account lifecycle — accepted for current test path
- [x] `HOUSEHOLD_REQUIRED` / `HOUSEHOLD_ACCESS_REQUIRED` route to household onboarding instead of generic startup failure.
- [x] Canonical served auth order restored before `AuthenticatedSessionController` / HouseholdContext.
- [x] Real alternate-account login/join path is now usable (confirmed by cross-account help-request test).
- [x] `FamilySessionActions v1.1.0` owns explicit Firebase sign-out without adding another auth observer.
- [x] Profile and Meer expose **Uitloggen**.
- [x] Profile name and optional partner values are UID-scoped; no Shane/Esra leakage to a new account.

### Latest contracts / deployment
- [x] Latest code head: `f6bb9c7eee3801221cded3d236dd995460adc66d`.
- [x] Full `Household Rebuild Contracts` SUCCESS, run `32792327306`.
- [x] Latest Vercel Preview `dpl_3to6czrBXjgtceK7jeEPtN4ov4ds` READY.
- [x] Stable branch alias remains `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- [x] No production Firebase Rules change and no `main` change.

### Remaining STEP 10 acceptance
- [ ] Replace invalid Preview Firebase service-account email/private-key pair and redeploy.
- [ ] Background/closed-PWA OS push reaches iPhone.
- [ ] Tapping push opens/focuses FamilyApp notifications with exactly one canonical inbox item.
- [ ] UID-specific read/dismiss survives reload/reconnect.
- [ ] Live in-app banner visible only for intended identity.
- [ ] Actionable targeted and household-wide task-help notification behavior accepted.
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
