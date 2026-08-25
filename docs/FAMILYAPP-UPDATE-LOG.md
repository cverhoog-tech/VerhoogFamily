# FamilyApp — Cross-chat Update Log

Branch: `agent/household-rebuild-v2`

Purpose: persistent handoff log for FamilyApp development. Read this together with `docs/FAMILYAPP-CURRENT-TODO.md`, `docs/household-rebuild-v2-progress.md` and `docs/household-rebuild-v2-roadmap.md` before changing the rebuild branch.

## Logging rule
1. Append/record every meaningful product/code checkpoint.
2. Synchronize the central TODO and phase tracker in the same work session.
3. Never mark a device/release gate accepted without real verification.
4. Keep `main` and production Firebase Rules untouched unless explicitly approved.
5. Never put service-account private keys or push-device tokens in chat, client code or repository files.

Newest entries belong at the top.

---

## 2026-08-25 — STEP 10 real push test isolated to invalid service-account JWT; whole-family task help added

- The product owner successfully reached the real cross-account notification test: a help request was sent from another household account to Shane.
- On the iPhone PWA, no OS push banner arrived, but the red unread badge appeared on the installed FamilyApp icon. This confirms the canonical household notification/unread path is alive while the transport layer fails later.
- Vercel runtime inspection found the exact server failure on repeated real requests to `/api/push-send`: HTTP `502` from FamilyApp because Google OAuth returns HTTP `400`, `invalid_grant`, `Invalid JWT Signature.`
- This failure occurs **before FCM send**, so the current blocker is not iOS notification permission, Home Screen PWA support or canonical NotificationStore state.
- `firebasePushSender v1.0.1` (commit `fe9fd97dda0eea6bee464ca1d97b822ad55b841e`) already normalized quoted/newline environment values and added safe OAuth diagnostics. The hardened runtime still returns `Invalid JWT Signature`, proving the remaining issue is the configured service-account credential pair itself: the private key is mismatched to the configured service account, revoked, or otherwise no longer valid.
- Required environment repair: generate a new Firebase Admin SDK service-account JSON and replace **both** Preview values from the same file: `client_email` → `FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL`, `private_key` → `FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY`. Do not paste the key into chat/GitHub. Revoke/delete the obsolete key, then redeploy Preview.
- Important readiness nuance: `/api/push-config configured=true` only checks that required environment values are present; it does not cryptographically validate the key with Google. Real `/api/push-send` remains the actual credential-validity gate.

### Whole-family help request
- Product owner also requested that a task help request can target **the whole family**, so anyone willing may help.
- Implemented `TaskSharedData v2.1.0` with `requestHouseholdHelp(id)` and `helpAudience='household'` while keeping the existing one-person invite semantics intact.
- Household broadcast excludes creator/current assignees/current helpers from new helper eligibility.
- Unlike a targeted invite, a household broadcast stays open after the first helper joins. Multiple different eligible household members can therefore join the same task. Duplicate joins do not duplicate helper records.
- Retracting the open broadcast stops new joins but does not eject helpers who already accepted.
- Added `TaskHouseholdHelpUi v1.0.0`: the existing task **Hulp vragen** picker now includes a prominent **Heel het gezin** choice with explanatory copy. Eligible recipients can open the task and choose **Hulp geven**; the compact help indicator becomes actionable for a household broadcast.
- Existing `NotificationEvents.taskHelpRequested(task, null)` already fans a null-target help event to all other active household members, so the new domain state reuses the accepted notification architecture instead of adding a parallel notification authority.
- Served runtime cutover: `taskSharedData.js?v=4`, plus `taskHouseholdHelpUi.js?v=1` after collaboration lifecycle.
- Added `scripts/test-task-household-help.js` covering broadcast creation, multiple helpers, duplicate prevention, owner restrictions, retract behavior and targeted backwards compatibility.
- Two CI failures during implementation were contract-harness/version-expectation issues, not product behavior regressions: synchronous owner rejection was initially asserted as a Promise rejection, and the existing repository test still expected the old `taskSharedData.js?v=3` cache key. Both tests were corrected.
- Final code head: `f6bb9c7eee3801221cded3d236dd995460adc66d`.
- Full `Household Rebuild Contracts`: SUCCESS, run `32792327306`.
- Vercel Preview `dpl_3to6czrBXjgtceK7jeEPtN4ov4ds`: READY.
- Stable Preview alias remains `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- Real-device **Heel het gezin** acceptance remains open. STEP 10 remains **in progress / not frozen**.

---

## 2026-08-25 — Profile/Meer logout + UID-scoped profile values; Verse start removed

- Product owner confirmed the requested account/profile changes work on Preview.
- `FamilySessionActions v1.1.0` is the explicit Firebase sign-out boundary; no second auth observer is created.
- Profile and Meer both expose **Uitloggen**, returning the user to the login flow without leaving the household or deleting shared data.
- Old **Verse start** was removed from the active served Meer runtime.
- Authenticated profile name/partner values are UID-scoped, so a new account on the same browser no longer inherits `Shane` / `Esra`; partner defaults to blank/optional.
- Normal-member **Gezin verlaten** had already been real-tested and accepted.
- Code checkpoint `2ff8ecf2500702ca835531ff1c3f5c95ce9a1486`, contracts run `32787576487`, Preview `dpl_FDvW1mNDW5yC5RHidRVTzQTL1YDM` READY.

---

## 2026-08-25 — Profile: safe `Gezin verlaten` flow

- Added a clear destructive **Gezin verlaten** action in Profile.
- A normal member removes only their own household membership/pointers; the account and shared household data remain.
- An owner cannot orphan a household: an eligible adult/admin successor must receive ownership before the owner leaves.
- Presence is cleared best-effort and the signed-in account returns to create/join household onboarding after leaving.
- Existing Firebase Rules already support the required writes; no production Rules change was made.
- Product owner later real-tested the normal-member variant successfully; owner-transfer real-device smoke remains open.
- Code checkpoint `a3b17bbff075dbe00b4f9048b76ddadb2bc84e16`, contracts run `32784256710`, Preview `dpl_BzCAsgZyQpn1J4fF1qb24ZVa7brW` READY.

---

## 2026-08-24/25 — Second-account auth/household onboarding blocker fixed

- A second/new Google account authenticated but incorrectly fell into generic `Opstarten mislukt` instead of household create/join onboarding.
- Root cause: canonical `HOUSEHOLD_REQUIRED`/stale-household setup states were not recognized by the session controller and canonical Google/household runtime ordering was incomplete.
- Added `HouseholdOnboardingBridge`, restored deterministic Google → FamilyHousehold → onboarding → AuthenticatedSessionController → HouseholdContext ordering and normalized inaccessible stale household pointers to safe re-onboarding.
- No membership is silently restored; joining still requires the normal household flow.
- Code checkpoint `fae24eddef6163e9ac9180792167d847381e3b6d`, contracts run `32781652282`, Vercel `dpl_4zbDas7UbGEnoV1oiWG1UsipbBta` READY.
- The later real cross-account help-request test proves an alternate account is now usable in the household.

---

## 2026-08-24 — iPhone standalone Web Push opt-in accepted

- Preview was opened from the iPhone Home Screen and iOS notification permission was accepted.
- Notification settings reported `Pushmeldingen staan aan voor dit account op dit apparaat`.
- `PushRegistrationService` only reaches that enabled state after FCM token acquisition and private `PushDeviceRegistry.upsert`, so the client-side registration gate is accepted.
- This did not yet prove server-to-device delivery; that later test exposed the separate sender credential issue described above.

---

## 2026-08-24 — STEP 10 trusted notification/push architecture implemented

- Canonical notification state moved to one HouseholdContext-native repository with deterministic/idempotent event IDs and per-UID read/dismiss state.
- Notification state and push delivery are separate: push failure cannot delete/corrupt canonical inbox state.
- Private multi-device push registry lives under the user's private subtree rather than household-shared data.
- Web Push is explicit opt-in only; startup cannot request notification permission.
- Added iPhone standalone-PWA requirement, FCM service worker, foreground de-duplication, private device lifecycle and account-switch invalidation.
- Added trusted Vercel `/api/push-send` boundary. Client submits canonical household/notification identity only; server verifies Firebase caller + household membership + event actor and resolves recipients/tokens server-side.
- Added private delivery receipts/idempotency and FCM invalid-token cleanup.
- Preview VAPID and protected Firebase sender environment variables were configured. `/api/push-config` originally verified presence/readiness booleans; real delivery later revealed the credential-signature mismatch.

---

## 2026-08-24 — STEP 9 Progression accepted/frozen

- Canonical UID + household progression store, deterministic reward ledger, canonical achievements and lifecycle/isolation protection accepted.
- Real iPhone smoke test passed with normal task XP, duplicate-reward protection, achievements, navigation and background/foreground stability.
- Accepted code checkpoint `843cbb5f5662cfee6e9aa32164b90b1cd7aa7e18`; Vercel `dpl_6FfiZeywGvDMz9nZtHrmQCXib97n` READY.

---

## 2026-08-24 — STEP 8 Finance accepted/frozen

- Household-scoped Finance state, transaction/reset semantics, Analyse UI, comparisons, deterministic FamilyApp Assistent, isolation contracts and premium two-page PDF/share flow accepted.
- Real iPhone PDF/native share test passed.

---

## Earlier rebuild history

Earlier detailed checkpoints for STEP 0–7, person/identity modernization, Shopping, Recipes, Meals, Agenda, task migration, icon/brand work and the full intermediate STEP 8/9 implementation sequence remain preserved in the Git history of this file and the roadmap/progress tracker. This file is intentionally kept focused on the current rebuild handoff and major accepted milestones.

## Current next action

1. Replace the two protected Preview Firebase service-account values from **one newly generated Admin SDK JSON**; never paste the private key into chat or repository.
2. Redeploy Preview.
3. Retest a brand-new help request while the iPhone PWA is backgrounded/closed.
4. In the same Preview, smoke-test Task → Hulp vragen → **Heel het gezin** and verify more than one eligible family member can join.
5. Continue push tap/read/dismiss/action/account-isolation/stability acceptance; freeze STEP 10 only after explicit product acceptance.
