# FamilyApp — Cross-chat Update Log

Branch: `agent/household-rebuild-v2`

Purpose: persistent handoff log for FamilyApp development. Read this together with `docs/FAMILYAPP-CURRENT-TODO.md`, `docs/household-rebuild-v2-progress.md`, `docs/household-rebuild-v2-roadmap.md` and `docs/FAMILYAPP-FIX-LIST.md` before changing the rebuild branch.

## Logging rule
1. Record every meaningful product/code checkpoint.
2. Synchronize the central TODO and phase tracker in the same work session.
3. Never mark a device/release gate accepted without real verification.
4. Keep `main` and production Firebase Rules untouched unless explicitly approved.
5. Never put service-account private keys or push-device tokens in chat, client code or repository files.

Newest entries belong at the top.

---

## 2026-08-26 — STEP 10 avatar isolation + installed-PWA safe area + Home dark shell fixes ready for device acceptance

- Product owner finished the feedback round and explicitly asked to start fixing the three blockers found during the real A → B account-isolation smoke.
- **Avatar account-isolation root cause:** several legacy/profile layers still treated unscoped `familyapp-current-user-avatar-v1` state as current-user authority. The old avatar identity bridge could copy that value into whichever UID became active, and the old Firebase identity migration could even write an unscoped avatar into a newly active member profile when that member had no server avatar.
- Authenticated avatar storage is now UID-scoped using `familyapp-current-user-avatar-v2:<uid>` and `familyapp-current-user-avatar-id-v2:<uid>`.
- `avatarStore.js` no longer reads the unscoped avatar as authenticated identity authority; avatar writes now carry the active UID in their event payload.
- `avatarIdentityBridge v2.0.1` resolves the active user through HouseholdContext/Firebase UID, only syncs scoped state, refreshes on account/household changes, rejects explicitly wrong-UID avatar updates, and claims the old v1 guard so a stale cached v1 script cannot run afterward.
- `householdIdentityFirebaseBridge v5.0.1` now projects/migrates only UID-scoped current-member profile state, rejects avatar events for a different UID, and claims the old v4 guard so stale cached v4 code cannot reintroduce cross-UID migration.
- New `legacyProfileUidBridge v1.0.0` preserves old unscoped profile/avatar keys only as a compatibility projection for the currently authenticated UID; those keys are no longer shared identity authority.
- Served runtime cache cutover is `avatarIdentityBridge.js?v=2`, `householdIdentityFirebaseBridge.js?v=5`, `legacyProfileUidBridge.js?v=1`.
- Added `scripts/test-avatar-account-isolation.js`; the complete rebuild contract suite passed after this change.
- **Installed iOS PWA safe area:** the app already uses `viewport-fit=cover`, but `.app-header` had no top safe-area compensation. New `homePwaShellFix.css?v=1` applies `env(safe-area-inset-top)` only in standalone display mode and moves sticky Task/Finance tabs by the matching amount. No iPhone-model-specific pixel offset was introduced.
- **Home dark-mode root cause:** `app.css` still contains a legacy `WHITE REFRESH` layer with `body{background:#fff!important}` plus a later live-Home rule `#screen-home{background:#fff!important}` and hard-coded light Home text/surfaces. These overruled the otherwise-correct dark theme variables.
- `homePwaShellFix.css?v=1` is served after `app.css` and restores `var(--c-bg)`, `var(--c-text)`, header/nav theme tokens and dark-aware Home heading/day/XP/activity/carousel fallback surfaces for both `dark` and all `*-dark` themes.
- Added `scripts/test-home-pwa-shell.js` to lock the safe-area and dark-shell contracts and verify the CSS is actually served after `app.css`.
- Current code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- Full `Household Rebuild Contracts`: **SUCCESS**, run `32954316879`.
- Vercel Preview `dpl_3FjdEX2qemXGjNFvT7Tb3TNtnVEj`: **READY**.
- Stable branch alias: `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- Served Preview was additionally fetched and verified to contain `homePwaShellFix.css?v=1` after `app.css?v=3`, plus the UID-safe avatar runtime scripts.
- These three blockers are **implemented but not yet accepted**. Required device gate: real iPhone must confirm A → B avatar isolation, header controls below the system status area, and fully dark Home background/surfaces.
- If account B still displays account A's avatar, do not auto-delete server data: this may mean B's Firebase member avatar was already polluted by the old migration before the fix and must be inspected/repaired with evidence.
- `main` and production Firebase Rules remain untouched. STEP 10 remains **in progress**.

---

## 2026-08-26 — Running FamilyApp fix list centralized; account B verified and three STEP 10 blockers captured

- Product owner provided the current five-item FamilyApp running fix list. It is now persisted verbatim in intent and acceptance detail in `docs/FAMILYAPP-FIX-LIST.md`.
- The five open main product/fix items are:
  1. Home hero card backgrounds for Taken, Boodschappen and Posts/Feed using the already-generated assets, with per-card crop/position and readable light/dark contrast.
  2. Scalable internationalisation for Dutch, English, Turkish, German and French, including remembered user language choice and non-hardcoded UI strings.
  3. Make the task name/title clearly larger and visually dominant in the task-create popup/card.
  4. Recipe → propose meal to a household member, choose member/date, realtime open/accepted/rejected status, notification accept/reject actions, and auto-plan on acceptance.
  5. Shopping → **Boodschappen afronden** with optional receipt, a durable completed-shopping-round record, feed eligibility, and failure-safe cleanup where only items already in **Gekocht** are removed after successful persistence while **Te kopen** remains untouched.
- These five running product items remain separate from STEP 10 notification acceptance and currently count as **5 open main backlog items**.
- Same-iPhone identity switching has now been verified: after sign-out/re-login, Profile **Actief account** shows account B, proving Firebase Auth is genuinely B.
- Real-device screenshot/feedback then exposed three separate blockers that must be resolved before STEP 10 freeze:
  - installed iOS PWA header does not respect the top safe area, so search/notification controls can sit behind iPhone system status icons;
  - the small top-left header avatar can remain from account A after Firebase Auth has switched to B, making this an account-state/isolation bug rather than cosmetic-only polish;
  - Home dark mode is incomplete: header/navigation become dark while large Home surfaces/background remain white.
- These three blockers are explicit in `docs/FAMILYAPP-CURRENT-TODO.md` and `docs/household-rebuild-v2-progress.md`.
- Follow-up implementation is recorded in the newer entry above.
- STEP 10 remains **in progress**, not frozen. `main` and production Firebase Rules remain untouched.

---

## 2026-08-26 — Profile shows active Firebase Auth e-mail for same-device account isolation

- During the STEP 10 account-isolation smoke, product owner found that after signing out on the iPhone Home Screen PWA and pressing Google login again, Google appeared to reconnect the previous account automatically.
- The app UI only indicated that Google was connected, without showing which Google/Firebase identity was actually active; the visible household data still looked like account A.
- To make the isolation test evidence-based, Profile now contains a read-only **Actief account** row showing the current Firebase Auth user's e-mail address directly from `fbAuth.currentUser` (with Firebase Auth fallback), never from local profile fields.
- `ProfileScreen.target.js` gained `getActiveAuthEmail()` and the visible account row. The profile module cache key was bumped to `ProfileScreen.target.js?v=account3`.
- Regression coverage was extended in `scripts/test-profile-session-actions.js`; `scripts/test-household-leave-profile.js` was updated to the current profile cache contract.
- The first CI pass failed only because the household-leave test still expected the old `account2` cache key. That stale test expectation was corrected; no product logic rollback was needed.
- Final code checkpoint `58d46b463648f06bbb7b2aebb0efa1ecfc2a3864`: full `Household Rebuild Contracts` **SUCCESS**, run `32916523638`.
- Vercel Preview `dpl_J9aCVRQc1PaF6m4864fv8h6ayGeM` is READY; stable branch alias remains `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- Follow-up real-device test confirmed the displayed active e-mail changes to account B after re-login.
- `main` and production Firebase Rules remain untouched.

---

## 2026-08-26 — STEP 10 read/dismiss persistence real-device accepted

- Product owner completed the requested real iPhone notification-state persistence smoke on the stable rebuild Preview.
- Result: **PASS**.
- One notification was marked read and left in the inbox; after fully closing and reopening the Home Screen PWA, it remained read.
- A second notification was dismissed; after fully closing and reopening, it remained absent.
- This accepts the UID-specific read/dismiss reconnect/persistence gate for the current STEP 10 Preview path.
- Remaining STEP 10 acceptance gates: intended-identity in-app banner behavior, account-switch/logout isolation across inbox/banner/push transport, and final reload/background→foreground stability.
- STEP 10 remains **in progress**, not frozen yet. `main` and production Firebase Rules remain untouched.

---

## 2026-08-26 — STEP 10 push-tap routing/de-duplication real-device accepted

- Product owner completed the real iPhone push-tap smoke on the stable rebuild Preview.
- Result: **PASS**.
- Tapping a real external FamilyApp iOS notification opens/focuses the FamilyApp **Meldingen** screen correctly.
- The corresponding canonical inbox event appears **exactly once**; no duplicate canonical notification was created by the push tap/open flow.
- This accepts the push click-routing/de-duplication gate for the current STEP 10 Preview path.
- Remaining STEP 10 acceptance gates: UID-specific read/dismiss reconnect persistence, intended-identity in-app banner behavior, account-switch/logout isolation across inbox/banner/push transport, and final background/foreground stability.
- STEP 10 remains **in progress** and is not frozen yet. `main` and production Firebase Rules remain untouched.

---

## 2026-08-26 — STEP 10 task-help response actions real-device accepted

- Product owner completed both requested real-device acceptance tests on the stable rebuild Preview.
- **Targeted help test: PASS.** A brand-new one-person help request showed **Hulp geven / Afwijzen**. After choosing **Afwijzen**, reload/reopen kept the request resolved and the invitation closed.
- **Household help test: PASS.** A brand-new `Heel het gezin` request showed **Hulp geven / Niet voor mij**. After one UID chose **Niet voor mij**, that UID stayed resolved while another eligible household member could still choose **Hulp geven**.
- This real-device result accepts the occurrence-scoped decline/opt-out semantics implemented by `TaskSharedData v2.2.0`, `NotificationActions v3.1.0` and `TaskHouseholdHelpUi v1.1.0`.
- Contract-verified implementation checkpoint remains `884a8eb7878067143efbd4394a7f76c0de461581`; full `Household Rebuild Contracts` run `32910497000` passed.
- STEP 10 remains **in progress**, not frozen yet. Remaining acceptance gates are intended-identity in-app banner/account-switch isolation and final background/foreground stability.
- `main` and production Firebase Rules remain untouched.

---

## 2026-08-26 — STEP 10 external iOS push accepted; task-help decline/opt-out lifecycle implemented

### Real iOS Web Push acceptance
- Product owner performed the real Home Screen PWA test after the JWT and RTDB OAuth fixes.
- FamilyApp was backgrounded/closed and a different household account created a brand-new task help request.
- A real FamilyApp iOS lock-screen/banner notification appeared outside the app. Screenshot evidence was provided in chat.
- This proves the current server → Google OAuth → RTDB recipient/device lookup → FCM → service worker/iOS display path works end-to-end.
- The earlier `Invalid JWT Signature` and `PUSH_DATABASE_READ_FAILED 401` blockers are therefore considered resolved for the current Preview path.

### Task-help decline semantics
- Targeted one-person help request → **Hulp geven** / **Afwijzen**.
- Household-wide `Heel het gezin` request → **Hulp geven** / **Niet voor mij**.
- One household member choosing **Niet voor mij** does not close the broadcast for everyone else.
- `TaskSharedData v2.2.0`, `NotificationActions v3.1.0` and `TaskHouseholdHelpUi v1.1.0` implement occurrence-safe decline/opt-out.
- Contract-verified code checkpoint `884a8eb7878067143efbd4394a7f76c0de461581`; full suite run `32910497000` SUCCESS.
- Vercel Preview `dpl_RHJZQZdZPfxMvVMUMDXF2orP7UrY` READY.

---

## 2026-08-26 — STEP 10 RTDB 401 root cause fixed

- Real-device retest after the JWT fix proved OAuth now succeeded, but `/api/push-send` advanced to `PUSH_DATABASE_READ_FAILED 401`.
- RTDB REST service-account OAuth now includes `userinfo.email`, `firebase.database` and `firebase.messaging`.
- Safe RTDB 401/403 diagnostics added without logging request URL/access token.
- Later real iPhone lock-screen push acceptance proves this fix works end-to-end.

---

## 2026-08-26 — STEP 10 JWT signature root cause fixed

- `b64url()` in `firebasePushSender.js` had JSON-stringified the RSA signature `Buffer` instead of base64url-encoding raw bytes.
- Fixed raw-Buffer encoding while keeping the trusted sender architecture.
- Added a generated-RSA-key cryptographic regression test; later real-device tests confirmed `Invalid JWT Signature` disappeared.

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

1. On the current stable Preview, real-iPhone test the three just-implemented blockers: A → B avatar isolation, installed-PWA header safe area, and complete Home dark mode.
2. If those pass, verify live in-app banner/inbox/unread badge/push registration isolation across A → B switching.
3. Run reload/background→foreground stability smoke: no freeze, white screen or WebKit crash.
4. Complete owner-transfer household-leave smoke if still required for the phase gate.
5. Freeze STEP 10 only after explicit product acceptance; do not start STEP 11 before that gate.
