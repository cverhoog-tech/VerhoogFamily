# FamilyApp — Cross-chat Update Log

Branch: `agent/household-rebuild-v2`

Purpose: persistent handoff log for FamilyApp development. Read this together with `docs/FAMILYAPP-CURRENT-TODO.md`, `docs/household-rebuild-v2-progress.md` and `docs/household-rebuild-v2-roadmap.md` before changing the rebuild branch.

## Logging rule
1. Record every meaningful product/code checkpoint.
2. Synchronize the central TODO and phase tracker in the same work session.
3. Never mark a device/release gate accepted without real verification.
4. Keep `main` and production Firebase Rules untouched unless explicitly approved.
5. Never put service-account private keys or push-device tokens in chat, client code or repository files.

Newest entries belong at the top.

---

## 2026-08-26 — STEP 10 task-help response actions real-device accepted

- Product owner completed both requested real-device acceptance tests on the stable rebuild Preview.
- **Targeted help test: PASS.** A brand-new one-person help request showed **Hulp geven / Afwijzen**. After choosing **Afwijzen**, reload/reopen kept the request resolved and the invitation closed.
- **Household help test: PASS.** A brand-new `Heel het gezin` request showed **Hulp geven / Niet voor mij**. After one UID chose **Niet voor mij**, that UID stayed resolved while another eligible household member could still choose **Hulp geven**.
- This real-device result accepts the occurrence-scoped decline/opt-out semantics implemented by `TaskSharedData v2.2.0`, `NotificationActions v3.1.0` and `TaskHouseholdHelpUi v1.1.0`.
- Contract-verified implementation checkpoint remains `884a8eb7878067143efbd4394a7f76c0de461581`; full `Household Rebuild Contracts` run `32910497000` passed.
- STEP 10 remains **in progress**, not frozen yet. Remaining acceptance gates are push-tap routing/de-duplication, read/dismiss reconnect persistence, intended-identity in-app banner/account-switch isolation, and final background/foreground stability.
- `main` and production Firebase Rules remain untouched.

---

## 2026-08-26 — STEP 10 external iOS push accepted; task-help decline/opt-out lifecycle implemented

### Real iOS Web Push acceptance
- Product owner performed the real Home Screen PWA test after the JWT and RTDB OAuth fixes.
- FamilyApp was backgrounded/closed and a different household account created a brand-new task help request.
- A real FamilyApp iOS lock-screen/banner notification appeared outside the app. Screenshot evidence was provided in chat.
- This proves the current server → Google OAuth → RTDB recipient/device lookup → FCM → service worker/iOS display path works end-to-end.
- The earlier `Invalid JWT Signature` and `PUSH_DATABASE_READ_FAILED 401` blockers are therefore considered resolved for the current Preview path.
- Push tap routing, read/dismiss reconnect persistence, account-switch isolation and final background/foreground stability remain separate STEP 10 acceptance items.

### New functional gap found by product owner
- The product owner noticed that a task-help notification could be accepted but did not provide a way to decline it.
- Agreed product semantics:
  - targeted one-person help request → **Hulp geven** / **Afwijzen**;
  - household-wide `Heel het gezin` request → **Hulp geven** / **Niet voor mij**;
  - one household member choosing **Niet voor mij** must not close the broadcast for everyone else.

### Implementation
- `TaskSharedData v2.2.0` adds `declineHelp(id)` and occurrence-scoped decline/opt-out state keyed to `helpRequestedAt`.
- Targeted decline closes only the current invitation and stores `helpDeclinedByUid`, `helpDeclinedAt` and `helpDeclinedOccurrence`.
- Household opt-out stores `helpDeclinedByUids[uid] = helpRequestedAt`, keeps the broadcast open and prevents that UID from accepting the same occurrence afterward.
- Starting a later help cycle resets prior decline/opt-out state.
- `NotificationActions v3.1.0` adds targeted **Afwijzen** and household **Niet voor mij** actions, resolved statuses and stale-occurrence rejection.
- `TaskHouseholdHelpUi v1.1.0` adds **Niet voor mij** to household help presentation and removes actionability for the opted-out UID while leaving other members eligible.
- Served runtime cache cutover: `taskSharedData.js?v=5`, `taskHouseholdHelpUi.js?v=2`, `notificationActions.js?v=4`.

### Notification customization compatibility
- Another notification-customization line on the same rebuild branch introduced the new bootstrap architecture: `notificationEvents.js` now loads `notificationExperience.js`, `notificationFinanceCompat.js` and the household-domain projector.
- The new help-response work preserves that architecture; no rollback/parallel notification authority was introduced.
- Older contract tests were updated to follow the new bootstrap/experience split instead of incorrectly expecting producer implementation inside `notificationEvents.js` itself.

### Regression / CI
- Added `scripts/test-notification-help-actions.js` for targeted accept/decline, household opt-out, second-member acceptance and stale-occurrence behavior.
- Extended `scripts/test-task-household-help.js` for UID-local opt-out, targeted decline persistence and new-occurrence reset.
- Updated served-runtime/version contracts to the current cache keys and notification-experience producer location.
- Contract-verified code checkpoint: `884a8eb7878067143efbd4394a7f76c0de461581`.
- Full `Household Rebuild Contracts`: **SUCCESS**, run `32910497000`.
- Vercel Preview for that code checkpoint: `dpl_RHJZQZdZPfxMvVMUMDXF2orP7UrY` — READY.
- Stable Preview alias remains `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- `main` and production Firebase Rules untouched; no Production deploy.

---

## 2026-08-26 — STEP 10 RTDB 401 root cause fixed

- Real-device retest after the JWT fix proved OAuth now succeeded, but `/api/push-send` advanced to `PUSH_DATABASE_READ_FAILED 401`.
- Verified against Firebase RTDB REST auth documentation: service-account OAuth requires `userinfo.email` + `firebase.database`; sender was missing `userinfo.email`.
- `firebasePushSender v1.0.3` now requests `userinfo.email`, `firebase.database` and `firebase.messaging`.
- Added safe RTDB 401/403 diagnostics without logging the request URL/access token.
- Extended scope regression coverage and added `test-push-rtdb-diagnostics.js`.
- Later real iPhone lock-screen push acceptance proves this fix works end-to-end.

---

## 2026-08-26 — STEP 10 JWT signature root cause fixed

- Full Firebase Admin SDK key rotation did not change `invalid_grant / Invalid JWT Signature`, proving the key itself was not the root cause.
- `b64url()` in `firebasePushSender.js` JSON-stringified the RSA signature `Buffer` instead of base64url-encoding raw bytes.
- Fixed raw-Buffer encoding while keeping the existing trusted sender architecture.
- Added `test-push-jwt-signature-contract.js` with a generated RSA keypair and real cryptographic signature verification; old code fails, fixed code passes.
- Later real-device tests confirmed `Invalid JWT Signature` disappeared.

---

## 2026-08-25 — Whole-family task help introduced

- Added `requestHouseholdHelp(id)` and `helpAudience='household'` while keeping targeted one-person help compatible.
- Broadcast excludes creator/current assignees/current helpers as new helper candidates.
- Broadcast remains open after one helper joins so multiple eligible family members can participate.
- Creator may retract the open broadcast without ejecting already accepted helpers.
- Added **Heel het gezin** to the task help picker and reused the canonical notification architecture for fan-out to all other active household members.

---

## 2026-08-25 — Account/profile lifecycle accepted on current path

- Alternate Google account onboarding/auth regression fixed and cross-account household usage proven.
- Profile and Meer expose **Uitloggen**.
- `Verse start` removed from active Meer runtime.
- Profile values are UID-scoped; a new account no longer inherits Shane/Esra browser values.
- Normal-member **Gezin verlaten** real-tested and accepted; owner-transfer variant still open.

---

## 2026-08-24 — STEP 10 notification/push foundation

- Canonical HouseholdContext-native notification repository with deterministic event IDs and per-UID read/dismiss state.
- Push delivery kept separate from inbox state so delivery failure cannot corrupt canonical notifications.
- User-private multi-device FCM registry, explicit opt-in, iPhone Home Screen requirement and account-switch invalidation.
- Trusted Vercel `/api/push-send` verifies Firebase caller/member/event actor and resolves recipients/tokens server-side.
- Private delivery receipts/idempotency and invalid-token cleanup implemented.

---

## 2026-08-24 — STEP 9 Progression accepted/frozen

- Canonical UID + household progression store, deterministic reward ledger, canonical achievements and lifecycle/isolation protection accepted after real iPhone smoke testing.

---

## 2026-08-24 — STEP 8 Finance accepted/frozen

- Household-scoped Finance, Analyse, deterministic FamilyApp Assistent and premium PDF/native share flow accepted on real iPhone.

---

## Earlier rebuild history

Earlier detailed STEP 0–7, person/identity modernization, Shopping, Recipes, Meals, Agenda, task migration, icon/brand and intermediate STEP 8/9 checkpoints remain preserved in Git history and the roadmap/progress tracker. This log intentionally emphasizes the current rebuild handoff and major accepted milestones.

## Current next action

1. Test push-tap routing from a real external iOS notification: tapping the push must open/focus FamilyApp notifications and show exactly one canonical inbox item.
2. Verify UID-specific read/dismiss survives reload/reconnect.
3. Verify the live in-app banner is visible only for the intended identity, including account switch/logout isolation for inbox/banner/push registration.
4. Run a reload/background→foreground stability smoke: no freeze, white screen or WebKit crash.
5. Freeze STEP 10 only after explicit product acceptance; do not start STEP 11 before that gate.
