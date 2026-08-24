# FamilyApp — Cross-chat Update Log

Branch: `agent/household-rebuild-v2`

Purpose: persistent handoff log for FamilyApp development. New chats/agents should read this file together with `docs/FAMILYAPP-CURRENT-TODO.md`, `docs/household-rebuild-v2-progress.md` and `docs/household-rebuild-v2-roadmap.md` before changing the current rebuild branch.

## Logging rule

For every meaningful FamilyApp code/product update on this branch:
1. append a dated entry here;
2. update `docs/FAMILYAPP-CURRENT-TODO.md` in the same work session;
3. record branch/deployment/device-gate status when relevant;
4. never mark a phase accepted until its required verification/device gate is actually accepted;
5. keep the roadmap as architecture scope; use the current TODO as the day-to-day execution state.

Newest entries belong at the top.

---

## 2026-08-24 — STEP 10 canonical in-app notification runtime implemented

- Added `NotificationHouseholdRepository v1.0.0` as the canonical STEP 10 persistence/listener boundary at `families/{householdId}/shared/notifications`.
- Repository identity is bound through `HouseholdContext` UID + household + revision; same-household account switch, cross-household switch and logout all detach the exact listener and clear stale projection.
- Captured stale callbacks are rejected with `HouseholdContext.capture()/isCurrent()` and notification writes are rejected when context is unavailable/stale.
- Added deterministic `eventKey` / `publishOnce()` transactions so one domain transition observed by multiple devices/tabs cannot create duplicate canonical inbox events.
- Per-UID `readBy` / `dismissedBy` semantics were preserved and repository marker APIs always write for the active UID only.
- Reworked `NotificationStore` to `v2.0.0`; it is now a facade over `NotificationHouseholdRepository` and random/unkeyed notification creation is deliberately rejected.
- Reworked `NotificationEvents` to `v2.0.0` with deterministic keys for task-help request/join, task-swap request/result, Party Quest create/sent-invite/join/complete and Finance savings events.
- `TaskNotificationProjector`, `TaskSwapNotificationProjector` and `PartyQuestNotificationProjector` are now `v2.0.0`, HouseholdContext-bound and protected against stale callbacks/account switches.
- `NotificationActions v3.0.0` now reads active identity from HouseholdContext instead of `fbUser`/Firebase auth and continues to delegate mutations to the accepted TaskSharedData / PartyQuestInvites services.
- `NotificationCenter v2.0.0` uses HouseholdContext identity and clears an open detail sheet when the active identity changes.
- `NotificationDelivery v2.0.0` remains an **in-app live-banner channel only** and clears queued/active banners on account/household/logout identity changes. It is not Web Push/OS push.
- Activated the canonical notification stack in the actual `/api/app` served load graph, immediately after HouseholdContext and before progression runtime, with explicit cache versions.
- Added contracts: `test-notification-household-repository.js`, `test-notification-store-events.js`, `test-notification-projector-lifecycle.js`, `test-notification-presentation-identity.js` and `test-notification-served-runtime.js`.
- Tests cover A→B same-household switching, cross-household isolation, logout clearing, stale callbacks, per-UID read/dismiss markers, duplicate event idempotency, typed deterministic event keys, projector lifecycle, presentation identity boundaries and the real `/api/app` script order/version wiring.
- Two intermediate test failures were harness-only: one test expected an unkeyed publish rejection as an async rejection even though the store correctly throws synchronously; another Node VM needed `TaskSharedData` mirrored as a browser global. No app behavior change was needed for either correction.
- During loader activation a missing closing parenthesis in the `/api/app` error handler was spotted immediately and corrected before the served-runtime checkpoint was considered valid.
- Complete `Household Rebuild Contracts` passed on code commit `15ca6bca994ea5852815cad7f3e811261a783152`, including the served notification runtime audit.
- Vercel did **not** produce a fresh preview for that latest code checkpoint because the Hobby `build-rate-limit` was hit again; this is a deployment-rate limitation, not a contract/runtime failure.
- In-app notification code is therefore contract-ready but still awaits a fresh READY preview and real cross-device/iPhone verification.
- Push notifications remain part of STEP 10 and are the next implementation area: user-private multi-device token registry, deliberate opt-in, Web/PWA service worker/FCM adapter and trusted server-side sender, all separate from canonical inbox state.
- No production Firebase Rules were changed or deployed.

---

## 2026-08-24 — STEP 10 notification + push audit completed

- Completed the required read-only STEP 10 audit and stored the full authority/delivery map in `docs/step10-notifications-audit.md`.
- Confirmed that push notifications are part of STEP 10, but push is a delivery channel and must remain separate from canonical notification inbox/read state.
- Found an existing typed notification architecture in the repository: `NotificationStore`, `NotificationEvents`, `NotificationActions`, `NotificationCenter`, `NotificationDelivery` and task/swap/Party Quest projectors.
- The existing stack is currently dormant/not loaded by the actual rebuild `/api/app` runtime, so active code that conditionally calls `NotificationEvents`/`NotificationStore` can silently do nothing.
- Legacy `addNotif(...)` is already deliberately neutralized as a no-op and `notifData` is only leftover demo state; neither will be revived as authority.
- Dormant `NotificationStore v1.4.0` already models household events with per-UID `readBy` and `dismissedBy`, but its identity/listener ownership still relies on `fbFamilyId`/generic `FamilyDataStore` rather than accepted `HouseholdContext` capture/isCurrent lifecycle semantics.
- The dormant store also generates random event IDs, so the same state transition observed on multiple devices/tabs can create duplicate notification events. STEP 10 will add deterministic event keys / `publishOnce()` semantics.
- Existing `NotificationDelivery v1.2.0` is correctly separated as an in-app live-banner presentation channel; it is not OS push.
- Push/FCM audit found only an incomplete legacy stub in `duoQuests.js`: browser permission request, `getToken()` and a single household-shared `fcmTokens/{uid}` write.
- No complete messaging service worker, foreground `onMessage`, token rotation/revocation lifecycle, multi-device registry or trusted server-side FCM sender was found; reliable push is therefore not currently operational.
- Target push-device registry is user-private and multi-device, logically `users/{uid}/private/pushDevices/{deviceId}`, so another household member never reads delivery credentials.
- Browser/client code will not own FCM server/service-account credentials. While Firebase remains on Spark, a Vercel server-side delivery boundary is the first candidate to evaluate for trusted sending.
- Push failure must never delete or corrupt the canonical notification event; inbox state and delivery health remain separate.
- Current next action is the code foundation: build and contract-test a HouseholdContext-native `NotificationHouseholdRepository` before wiring the dormant notification UI/runtime back into `/api/app`.
- No production Firebase Rules were changed or deployed during this audit.

---

## 2026-08-24 — STEP 9 iPhone gate accepted/frozen; STEP 10 Notifications opened

- Product owner confirmed the final STEP 9 iPhone test works.
- The real-device acceptance covers the agreed smoke path: normal app/session startup with Home XP visible, one normal task reward, no second XP reward for the same task completion event, Achievements rendering, multi-module navigation, reload and background/foreground stability without freeze/white screen/crash.
- STEP 9 Progression / XP / Achievements is therefore formally **ACCEPTED / FROZEN** on `agent/household-rebuild-v2`.
- Accepted STEP 9 includes the canonical UID + household progression store, atomic/idempotent reward ledger, canonical achievement projection, identity-safe lifecycle handling, deterministic served reward keys and the final served-runtime audit.
- Final complete `Household Rebuild Contracts` passed on code commit `843cbb5f5662cfee6e9aa32164b90b1cd7aa7e18`.
- Vercel deployment `dpl_6FfiZeywGvDMz9nZtHrmQCXib97n` is READY for that code commit and its served HTML was verified with the current STEP 9 runtime/adapters.
- `docs/FAMILYAPP-CURRENT-TODO.md` now marks STEP 10 as the current phase.
- STEP 10 — Notifications is opened, but no notification implementation change is made as part of this closure update.
- The first STEP 10 action is a read-only audit of current notification state, `addNotif`/notification producers, read/dismiss behavior, household/UID scoping, listener ownership and any existing push/FCM delivery code.
- STEP 10 must preserve the roadmap separation between canonical notification state and push delivery: notification state must remain platform-neutral so native APNs/FCM delivery and notification actions can be attached later without another domain rewrite.

---

## 2026-08-24 — STEP 9 deterministic producer migration complete; final iPhone gate next

- Completed the remaining served XP/reward producer migration on `agent/household-rebuild-v2`.
- Added `RecurringTaskRewardBridge v1.0.1`: recurring weekly/monthly completion and individual recurring-day completion now use stable occurrence keys. The legacy direct `myXP += 2` day mutation is immediately restored to the canonical projection and rerouted through progression.
- Added `ProgressionRuntime v1.1.0` identity-safe pending reward contexts so large asynchronous legacy UI flows can attach a real entity ID after Firebase/storage creation without inventing timestamp pseudo-keys or crossing UID/household boundaries.
- Added `ProgressionProducerBridge v1.1.1` for note creation, Feed posts, Feed likes, manual recipe creation and task-template activation.
- Feed like XP now uses one per-user/post canonical reward key; unlike/re-like cannot farm XP.
- Manual recipe creation uses the saved recipe ID. Imported recipes are deliberately excluded from the manual `Recept aangemaakt` context so import cannot leave a stray pending reward.
- Recipe link import (`recipeServerlessLinkImport v0.504`) now awards directly with `recipe:{savedRecipeId}` and source `recipe-import`.
- Shared task completion through `taskUidCreateBridge v1.3` now uses the same `task:{taskId}` key as other task completion paths, closing a second UI path that previously bypassed TaskRewardBridge.
- Added/activated `SkillsProgressionBridge v4.0.0`: legacy local/name-based skill data remains compatibility state, but account-XP side effects from skill logs, weekly quest bonus/claim, copycat, auto-done and Triple-XP are canonical and deterministic.
- The legacy Triple-XP ability direct `myXP += 4` mutation is neutralized and the same hidden +4 is recorded once through the canonical store.
- The bridge also supplies the missing legacy `ability` binding during weekly-quest claim so the intended existing claim flow continues while the legacy module awaits STEP 16 cleanup.
- Added `FinanceProgressionBridge v1.0.1`. It changes no accepted STEP 8 Finance calculations/UI/data behavior; it only keys existing XP side rewards by FinanceStore transaction/goal/update IDs.
- Finance keys cover savings transactions, one-time goal-reached reward, savings-goal creation, both one-off income entry labels and income updates. Internal savings-linked extra-income records deliberately create no orphan XP context.
- Added `scripts/test-recurring-progression-rewards.js`, `scripts/test-progression-entity-producers.js`, `scripts/test-skills-progression-bridge.js`, `scripts/test-finance-progression-bridge.js` and `scripts/test-progression-served-runtime-audit.js`.
- The served-runtime audit executes the real `/api/app` transformation, follows statically served and literal dynamic-load scripts, enumerates served `awardXP` and direct `myXP +=` paths, and fails on unexpected producers or resurrected legacy trade/duo paths.
- Its first run correctly discovered two previously missed live producers: `recipeServerlessLinkImport.js` and `taskUidCreateBridge.js`. Both were fixed with stable entity-ID reward keys rather than merely being added to an allowlist.
- A later audit failure was test-only: comment text containing `myXP +=` was counted as executable code. The audit was made comment-insensitive; no app behavior changed for that correction.
- Legacy alternative paths are now explicitly classified: old `shop.js`, `groupQuests.js`, `groupQuestRewardPolish.js` and `recipeBottomSheetBridge.js` are not in the current served graph; task-trade entry UI remains removed; no served module calls legacy `trackDuoProgress`. These are STEP 16 cleanup candidates rather than hidden live progression authorities.
- Final complete `Household Rebuild Contracts` passed on code commit `843cbb5f5662cfee6e9aa32164b90b1cd7aa7e18`.
- Vercel deployment `dpl_6FfiZeywGvDMz9nZtHrmQCXib97n` is READY for that same code commit.
- Served STEP 9 runtime wiring/cache versions are guarded by the served-runtime contract and the current served HTML was verified from the READY deployment.
- At this historical checkpoint STEP 9 was not yet frozen; the subsequent real iPhone gate was accepted later on 2026-08-24.

---

## 2026-08-24 — STEP 9 canonical progression foundation + first idempotent producers

- Completed the required read-only STEP 9 progression audit and stored it in `docs/step9-progression-audit.md`.
- Audit confirmed the previous effective authority was split between `fam_myxp_v1`/`window.myXP`, legacy member `xp`, `ProgressionUidBridge`, `AchievementUidBridge`, legacy `checkAchievements()` and multiple `awardXP()` wrapper layers.
- Highest-risk legacy behavior identified: a missing member XP value could be seeded from an unscoped browser XP cache, and achievement projections could merge across account changes instead of replacing the previous identity projection.
- Added `src/core/progressionStore.js` (`ProgressionStore v1.0.0`) as the STEP 9 canonical authority at `families/{householdId}/members/{uid}/progression`.
- Canonical schema contains XP, deterministic reward ledger, achievements, migration metadata and update metadata.
- Safe migration reads only the active household member's existing Firebase `xp` and `achievements`; it never imports unscoped localStorage/browser XP into another UID/household.
- Store lifecycle is bound through `HouseholdContext`; logout/account/household switch detaches the exact listener, clears XP/achievement compatibility projections and rejects stale callbacks/writes.
- Added atomic `awardOnce(key, amount, metadata)` and `unlockAchievementOnce(...)` transaction semantics so reward claim + XP mutation live in one canonical transaction.
- Added `src/core/progressionRuntime.js` (`ProgressionRuntime v1.0.0`), replacing mutation behavior behind the existing `awardXP` and `checkAchievements` UI entry points.
- Achievement evaluation now projects unlocks through the canonical store; badge XP is no longer a separate legacy member-XP write.
- `ProgressionUidBridge v3.0.0` and `AchievementUidBridge v2.0.0` are now compatibility-only adapters and own no Firebase progression authority.
- `TaskRewardBridge v3.0.0` gives one-off task completion the deterministic key `task:{taskId}`.
- Daily login bonus now uses `daily:{YYYY-MM-DD}` and only stores the local claim marker after the canonical reward settles.
- Party Quest completion now uses `partyQuest:{questId}`; an XP persistence failure leaves the quest active so the reward can be retried/repaired after reconnect instead of being silently lost.
- Added three STEP 9 contracts: `test-progression-store.js`, `test-progression-runtime.js` and `test-progression-producer-keys.js`.
- The new tests cover migration isolation, A→B account/household switching, stale callbacks, duplicate rewards, duplicate achievement unlocks, legacy bridge retirement, task replay protection, daily bonus key reuse and Party Quest failed-write recovery.
- One first run of the producer test failed because the Node VM harness did not mirror browser `window` globals as bare global bindings; the harness was corrected without changing app behavior.
- Full `Household Rebuild Contracts` subsequently passed on commit `b81b936c8b7185b461268a663098f85339e4d2bd`.
- Vercel branch deployment for that same code checkpoint reached READY.
- At this historical checkpoint STEP 9 was still in progress and more served reward producers remained to migrate.

---

## 2026-08-24 — STEP 8 Finance accepted/frozen; STEP 9 opened

- Product owner confirmed the final premium two-page Finance PDF works in the latest iPhone test.
- Final STEP 8 release gate is accepted.
- STEP 8 Finance is now formally accepted/frozen on `agent/household-rebuild-v2`.
- Accepted STEP 8 includes: household-scoped Finance state, transaction/reset semantics, premium Analyse UI, period comparisons, deterministic FamilyApp Assistent, strict household isolation contracts, native iOS/WhatsApp PDF sharing and the final premium two-page Finance report.
- `docs/FAMILYAPP-CURRENT-TODO.md` now marks STEP 9 as the current phase.
- `docs/household-rebuild-v2-progress.md` now marks STEP 8 complete and STEP 9 in progress.
- STEP 9 must begin with a read-only audit of all currently served progression/XP/achievement authorities and mutation paths before implementation changes.
- STEP 9 target remains: canonical UID progression store, event-keyed/idempotent rewards, canonical achievement projection, safe legacy migration, lifecycle/isolation tests, preview and iPhone gate.

---

## 2026-08-24 — Vercel rate limit cleared; premium PDF preview READY

- A new branch push was accepted by Vercel instead of failing with `build-rate-limit`.
- Fresh deployment `dpl_2JCsQxBNKDXd9dkfvtDVCurRyaNy` reached READY.
- Verified the deployed Finance export asset directly from that preview; it serves `FinanceAnalysisExport v2.0.0`.
- Therefore the final premium two-page Finance PDF implementation is confirmed present in a fresh Vercel preview.
- The final real-iPhone verification was subsequently accepted and STEP 8 has since been closed.

---

## 2026-08-24 — Phase tracker synchronized to actual STEP 8 state

- Replaced the stale phase-level status that still reported STEP 4 Recipes as current.
- `docs/household-rebuild-v2-progress.md` was synchronized to the actual execution position.
- STEP 8 implementation summary was brought up to date before final acceptance.
- `docs/FAMILYAPP-CURRENT-TODO.md` was synchronized in the same work session.

---

## 2026-08-23 — Premium Finance PDF report implemented

- Replaced the temporary STEP 8 PDF export layout with `FinanceAnalysisExport v2.0.0`.
- Export is now a two-page A4 financial report rather than a simple functional export.
- Page 1 contains a calm FamilyApp-branded period/result hero, income/expense/net-savings KPIs, top-category bar visualization and the current data-driven FamilyApp Assistent recommendation/action.
- Page 2 contains fixed vs variable costs, savings rate, receipt count, category current-vs-previous comparison, savings goal progress and core insights.
- Report remains generated directly from the canonical Finance Analysis model; it is not a screenshot of the screen.
- Native share/download behavior is preserved, including WhatsApp-capable iOS share flow.
- Added explicit line wrapping/limits for advisor copy so long recommendations remain within the report card.
- Local sample report was generated, rendered to both page images and visually inspected; no overlap/clipping was found.
- PDF preflight confirmed a valid two-page, non-encrypted, text-based PDF.
- Added `scripts/test-finance-analysis-export.js` to guard two-page structure, report sections, advisor projection and removal of the old placeholder-template copy.

---

## 2026-08-23 — STEP 8 iPhone / assistant / PDF-share checks accepted

- Product owner confirmed the current Finance STEP 8 preview works on iPhone.
- Finance navigation and interaction smoke test is accepted for the tested build.
- The top `Verse start` card remains removed and the bottom reset action remains the intended reset surface.
- FamilyApp Assistent behavior is accepted in the tested Analyse flow.
- PDF generation on iPhone works.
- Native share flow works and WhatsApp sharing is accepted.

---

## 2026-08-23 — STEP 8 Finance logout/reconnect isolation hardened

- Added `scripts/test-finance-logout-reconnect-isolation.js`.
- The new contract verifies that logout detaches the active Finance listener and immediately clears the prior household projection.
- Writes are rejected while household/auth context is unavailable.
- A stale callback captured before logout cannot repopulate old Finance data.
- Reconnecting as another user/household loads only that household's Finance data.
- Stale callbacks from the previous household remain ignored after reconnect.
- New Finance mutations after reconnect write only to the active household.
- Existing Finance contract coverage already verifies A→B switching, stale callback rejection, household-scoped writes, idempotent receipt upsert, safe same-household legacy migration, no generic legacy-data seeding, and active-household-only reset.
- `Household Rebuild Contracts` passed for commit `e8d8ef7b03443f9c8ec754e299f6deddb6a29b27`.
- The code-side STEP 8 Finance privacy/isolation regression gate is complete.

---

## 2026-08-23 — STEP 8 advisor preview verified

- Latest `agent/household-rebuild-v2` Vercel preview reached READY after the advisor commits.
- Verified the deployed asset directly from the current preview; it serves `FinanceAnalysisAdvisor v1.0.1`.
- Advisor runtime therefore is confirmed present in the current Vercel preview.

---

## 2026-08-23 — STEP 8 Finance feedback + analysis assistant

### Product/UI feedback processed
- Finance `Verse start` must not appear as a large card at the top of Finance tabs.
- The remaining reset action belongs only at the bottom of the Finance page.
- Analyse colors should have more depth and premium hierarchy without becoming busy.
- `Periode overzicht` should function as the primary calm Hero Card.
- Buttons may have richer depth/states, but Finance must remain readable and not become an image-heavy page.
- A PDF export/share action is required from Analyse.

### Implemented
- Added STEP 8 Finance analysis visual polish on `agent/household-rebuild-v2`.
- Added a calmer premium period Hero and richer button/card depth.
- Added Finance analysis PDF export/share foundation intended to use the native mobile share sheet when supported.
- Moved the bottom reset action into `FinanceRuntimeShell` and removed the old top `Verse start` reset card from `financeControls.js`.
- Added `FinanceAnalysisAdvisor` with deterministic, explainable recommendations based on the same canonical Finance analysis data.
- Advisor can reason about negative period result/break-even gap, largest category increase/decrease, per-week correction required to return toward comparison level, available positive result, net saving behavior, and open savings goals.
- Advisor intentionally does not use a generative AI API yet; recommendations are traceable to actual Finance numbers and selected comparison periods.
- Added duplicate-install protection to the advisor runtime to reduce risk of duplicate event listeners/render behavior on iPhone Safari.

---

## 2026-08-23 — Cross-chat handoff convention introduced

- Added this persistent update log.
- Added `docs/FAMILYAPP-CURRENT-TODO.md` as the current execution checklist.
- Future FamilyApp work should update both files after meaningful changes so separate chats can recover the exact current state from the repository instead of relying on conversation memory alone.