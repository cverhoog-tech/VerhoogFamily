# FamilyApp — Cross-chat Update Log

Branch: `agent/household-rebuild-v2`

Purpose: persistent handoff log for FamilyApp development. Read this together with `docs/FAMILYAPP-CURRENT-TODO.md`, `docs/household-rebuild-v2-progress.md`, `docs/household-rebuild-v2-roadmap.md` and `docs/FAMILYAPP-FIX-LIST.md` before changing the rebuild branch.

Historical entries through STEP 11.1 are preserved verbatim in `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.

## Logging rule
1. Record every meaningful product/code checkpoint.
2. Synchronize the central TODO and phase tracker in the same work session.
3. Never mark a device/release gate accepted without real verification.
4. Keep `main` and production Firebase Rules untouched unless explicitly approved.
5. Never put service-account private keys or push-device tokens in chat, client code or repository files.

Newest entries belong at the top.

---

## 2026-08-27 — “Later beslissen” device PASS; Google post-login freeze captured

- Product owner returned to the deferred Party Quest UX Test 3 and confirmed **Later beslissen works on a real device**.
- Party Quest UX Test 3 is therefore **PASS**. Together with prior Test 1 and Test 2, the targeted Party Quest UX patch is now real-device accepted for:
  - starting another Party Quest while one already exists;
  - meaningful Arcana/RPG task icons;
  - **Nieuwe quest maken** using the canonical task creator and returning with the new task preselected;
  - explicit **Later beslissen** on incoming Party Quest invitations.
- The implementation/contract checkpoint remains `0ef7274feea7ddadc86919843bf0a24891214e33`; full CI `33052149328` remains SUCCESS and Preview `dpl_8Fnv9FbHyDdhLauFQ4ntTvA8BSwF` remains READY.
- During the same real-device session, product owner observed a separate Google sign-in/startup UX regression:
  - tapped Google sign-in;
  - selected the desired Google account;
  - returned to an apparently frozen login screen for roughly five seconds;
  - after closing and reopening the app, the user was already logged in.
- This strongly indicates that Firebase authentication/session persistence succeeds, but the visible post-auth transition does not reliably complete in the same app session.
- Current code path reviewed: `googleAuthMobileFix.js` performs `signInWithPopup()`, while `AuthenticatedSessionController` waits for `onAuthStateChanged → bootstrap → loadUserFamily() → revealApp()` before hiding the login screen and revealing Home.
- The issue is therefore tracked as a **Google post-auth handoff/startup UI regression**, not as failed Google authentication. Investigation should focus on the auth-to-household/app-reveal transition, pending-state UI and any delayed/stalled household bootstrap.
- No auth code was changed in this checkpoint. The bug was added to the running product/fix backlog for explicit follow-up.
- STEP 11.5 was not started. Frozen notification code remains untouched. `main`, production Firebase Rules and production deployment remain untouched.

---

## 2026-08-27 — “Later beslissen” device smoke explicitly deferred

- Product owner could not perform the real-device **Later beslissen** invite smoke at that moment and explicitly deferred that test.
- This was recorded as **pending/deferred**, not failed and not accepted.
- The implementation remained contract-green at checkpoint `0ef7274feea7ddadc86919843bf0a24891214e33`; full CI `33052149328` SUCCESS and Preview `dpl_8Fnv9FbHyDdhLauFQ4ntTvA8BSwF` READY.
- This defer was later superseded by the real-device PASS recorded above.

---

## 2026-08-27 — Party Quest UX Tests 1/2 PASS; explicit “Later beslissen” follow-up implemented

- Product owner confirmed Party Quest UX Test 1 **PASS** on a real device: from an existing Party Quest, **＋ Nieuwe Party Quest** opens correctly without ending the current one and the chooser shows meaningful Arcana/RPG icons rather than one repeated generic sparkle.
- Product owner confirmed Party Quest UX Test 2 **PASS** on a real device: **Nieuwe quest maken** opens the existing canonical premium task creator, and after save the Party Quest chooser returns automatically with the newly created task preselected.
- During the invite flow, product owner identified a clarity gap: a recipient could tap outside the invite modal to defer a decision, but there was no explicit visible action for users who do not want to accept or decline yet.
- Product owner approved a presentation-only follow-up. `partyQuestInvites.js` is now v7.1.0 and the served runtime cache key is `partyQuestInvites.js?v=8`.
- Single incoming Party Quest invitations now expose three explicit choices: **Weigeren**, **Accepteren**, and neutral **Later beslissen**.
- Multiple incoming invitations use the same neutral **Later beslissen** affordance for the current invite batch.
- **Later beslissen** performs no PartyQuestService mutation and does not write a new Firebase status. The invite remains canonical `pending`.
- Deferral is runtime-session presentation state only (`deferredInviteIds`), deliberately not localStorage/Firebase persistence and not a new invite authority.
- Deferral is keyed by Party Quest invite occurrence/version (`inviteOccurrenceId`/`inviteVersion` fallback), so the same pending occurrence does not auto-open repeatedly in the current runtime session while a new/reinvite occurrence may prompt again.
- Manual access remains explicit: tapping the Party Quest tile still reopens all current pending invitations, including a deferred one.
- Added/extended `scripts/test-party-quest-ux-patch.js` to enforce the explicit button, session-only occurrence-scoped defer state, manual reopen path, no fake `respond(q,'pending')`, architecture boundaries and unchanged frozen notification/reward runtime keys.
- Updated the Party Quest service loader contract to expect the new invite facade runtime key.
- Full `Household Rebuild Contract Tests` run `33052149328`: **SUCCESS**. Logs explicitly report `party quest UX patch: PASS`, `party quest STEP 11.4 targeted + household help: PASS`, `party quest STEP 11.3 leave + ActiveView lifecycle: PASS`, and all frozen notification contracts remain green.
- Follow-up code/contract checkpoint: `0ef7274feea7ddadc86919843bf0a24891214e33`.
- Vercel Preview `dpl_8Fnv9FbHyDdhLauFQ4ntTvA8BSwF`: **READY**, branch `agent/household-rebuild-v2`, `target: null`.
- Frozen `src/core/notificationActions.js` remains unchanged at blob `60a48daa628bc56531395d188a0811711d82a328`.
- STEP 11.5 completion/reward settlement and STEP 11.6 notification-event extensions were not started.
- `main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

---

## 2026-08-27 — Party Quest UX patch implemented; STEP 11.4 Test 1 device PASS

- Product owner reported STEP 11.4 targeted-help Test 1 **PASS** on a real device: the maker of an active Party Quest could send a help request to one eligible household member and the action changed to **Hulpvraag beheren**.
- This is recorded as a partial STEP 11.4 device PASS only. Recipient accept/decline and household-broadcast follow-up actions remain pending and STEP 11.4 is not marked fully device-accepted yet.
- Product owner then identified three Party Quest UX gaps and explicitly approved **GO Party Quest UX patch** before STEP 11.5:
  - a pending/active Party Quest should not block starting an additional Party Quest;
  - the Party Quest chooser should allow creating a new ordinary quest/task directly;
  - the generic sparkle task icons should be replaced with meaningful Arcana/RPG icons in the visual language of the Person/Tasks UI.
- Upgraded `src/modules/tasks/partyQuestInvites.js` to v7.0.0 presentation/facade behavior while preserving the frozen-compatible `getById`, `respond` and `revokeInvite` methods used by `NotificationActions`.
- Party Quest status UI now exposes **＋ Nieuwe Party Quest**.
- Upgraded `src/modules/tasks/partyQuestActiveView.js` to v7.0.0 with the same **＋ Nieuwe Party Quest** action.
- Added **Nieuwe quest maken** to **Start een Party Quest**, delegating to canonical `TaskDetailPopup.openCreate()`.
- Replaced generic chooser sparkle icons with canonical `TaskCategoryIcons.detect()` + `TaskCategoryIcons.icon()` Arcana/RPG visuals.
- Full CI run `33049748789`: **SUCCESS**; code/contract checkpoint `1c5b543926055ab647773b8182fa63322f83878e`; Preview `dpl_EjBMPpzoLdKThex7nGkNbLJhjv81` READY.

---

## Frozen checkpoint reference

- STEP 8 Finance: accepted/frozen 2026-08-24.
- STEP 9 Progression: accepted/frozen 2026-08-24.
- STEP 10 Notifications: explicitly accepted/frozen 2026-08-26.
- STEP 10 frozen code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- STEP 11.1 code checkpoint: `e5ce389e30ed2848e0fca5715339639f17ebd8cf`.
- STEP 11.2 implementation checkpoint: `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- STEP 11.3 implementation/contract checkpoint: `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`.
- STEP 11.4 implementation/contract checkpoint: `51256b2506625f7421273d87d0c0f654fdbc432b`.
- Party Quest UX base checkpoint: `1c5b543926055ab647773b8182fa63322f83878e`.
- Party Quest UX latest defer follow-up checkpoint: `0ef7274feea7ddadc86919843bf0a24891214e33`.
- Full historical log through STEP 11.1: `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.