# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications remains in progress. Canonical in-app notifications, iPhone standalone registration and the task-help notification flow work. The Google OAuth `Invalid JWT Signature` blocker has a diagnosed root cause and a code fix on `agent/household-rebuild-v2` (not yet real-device accepted): `b64url()` in `src/server/firebasePushSender.js` fell through to `JSON.stringify(Buffer)` for the RSA signature bytes instead of encoding them as raw bytes, corrupting every service-account JWT signature independent of which private key was configured. This is why the earlier full service-account key rotation did not resolve it.**

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
- [x] `firebasePushSender v1.0.2` normalizes quoted/newline env values and logs safe Google OAuth diagnostics (HTTP status/error/description + JWT segment **lengths only**, never key/signature/token content) without logging secrets.
- [x] **Root cause diagnosed from live Preview runtime logs, not assumption.** The `PUSH_SERVER_OAUTH_FAILED invalid_grant / Invalid JWT Signature` error persisted on `dpl_8gMDiJ1BnJqXzXK6k7z6uz2JpgML` (commit `01358b2c5b8...`) even after a full service-account key rotation — proving the private key itself was never the problem.
- [x] **Actual bug:** `b64url()` only special-cased `typeof value==='string'`; for the `Buffer` returned by `crypto.Sign#sign()` it fell through to `JSON.stringify(value)`, base64url-encoding a JSON blob like `{"type":"Buffer","data":[...]}` instead of the raw 256-byte RSA signature. Every JWT built by `serviceAssertion()` therefore had a syntactically valid but cryptographically meaningless signature, regardless of which key signed it.
- [x] Fix: `b64url()` now encodes `Buffer` input as raw bytes. Minimal, scoped fix — existing manual-JWT architecture and security model kept intact, no new dependency added.
- [x] Regression coverage: `scripts/test-push-jwt-signature-contract.js` generates a throwaway RSA keypair, builds a real JWT via `serviceAssertion()`, decodes header/payload/signature, and cryptographically verifies the signature against the matching public key (plus a negative check against an unrelated key). Confirmed this test fails against the pre-fix code and passes against the fix.
- [x] Full relevant STEP 10 push/notification contract suite green locally (jwt-signature, push-server-sender, push-config-readiness, push-device-registry, push-registration-service, notification-store-events/household-repository/served-runtime/projector-lifecycle/presentation-identity, task-household-help).
- [ ] **Real-device retest still required.** OAuth succeeding is necessary but not sufficient — background/closed-PWA push must actually arrive on iPhone before STEP 10 push delivery is considered accepted.
- [ ] If OAuth now succeeds but the push still doesn't arrive, inspect fresh `/api/push-send` runtime logs immediately and report the exact next failing stage (RTDB device lookup, FCM response, token registration, service worker/background handling, or iOS notification display) rather than assuming — then fix only that layer.

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
- [x] Diagnose and fix the JWT signature encoding root cause; redeploy Preview.
- [ ] Background/closed-PWA OS push reaches iPhone (real-device retest still pending).
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
