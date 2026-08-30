# FamilyApp — Cross-chat Update Log

Branch: `agent/household-rebuild-v2`

Purpose: persistent handoff log. Read with `docs/FAMILYAPP-CURRENT-TODO.md`, `docs/household-rebuild-v2-progress.md`, `docs/household-rebuild-v2-roadmap.md`, `docs/STEP13-ACTIVITY-FEED-SPEC.md` and `docs/FAMILYAPP-FIX-LIST.md` before changing the rebuild branch.

Historical entries through STEP 11.1 remain in `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.

## Logging rule
1. Record every meaningful product/code checkpoint.
2. Synchronize central TODO and phase tracker in the same work session.
3. Never mark a device/release gate accepted without real verification.
4. Keep `main` and production Firebase Rules untouched unless explicitly approved.
5. Never store secrets/tokens in repository documentation.

Newest entries belong at the top.

---

## 2026-08-30 — STEP 13 Activity / Feed scope approved + documentation synchronized

- Product owner approved extending STEP 13 beyond the original immutable activity-event foundation.
- Existing manual Feed posts must remain visually/functionally as they are, including their social post role and likes/comments.
- System/domain activity cards will receive a fixed subtle pastel family by event type for quick scanning: Tasks mint, Meals/Recipes peach, Shopping soft yellow, Agenda soft blue, Party Quest/XP/Achievements lilac and generic household updates neutral. Dark mode receives deliberate muted equivalents.
- Feed inventory found existing manual `feedPosts` are already household-shared record-based Firebase data with per-record likes/comments, while canonical immutable activity producers do not yet exist.
- Existing Feed presentation contains demo/hardcoded totals; STEP 13 must remove these rather than present them as real activity data.
- Structured Feed tags are now in scope: household members referenced by UID and recipes by canonical recipe ID, not fragile display-name-only text.
- Interactive meal proposals are now in scope. Example: a member proposes a recipe/meal for a date and household participant(s) can approve/decline/respond in realtime.
- Pending meal proposals are explicitly **not immutable activity events**. They remain interactive state until resolved.
- Proposal approval must be idempotent/exactly-once and hand off to the canonical Meal planning service.
- After approval, FamilyApp should offer **Voeg ingrediënten toe aan boodschappenlijst**, with shopping-list choice where relevant.
- Ingredient handoff should preview add/skip/merge/exclude outcomes and avoid blind duplicate shopping items.
- Feed may orchestrate the UX but may not bypass canonical Meal or Shopping mutation authorities.
- Only successful canonical outcomes create immutable result activity such as `meal.planned` and `shopping.ingredientsAdded`.
- Created detailed execution contract `docs/STEP13-ACTIVITY-FEED-SPEC.md` covering STEP 13.1 through 13.7.
- Central TODO, roadmap and progress tracker were updated to STEP 13 active state.
- No production deployment, production Firebase Rules or `main` change was made for this planning/documentation checkpoint.

---

## 2026-08-30 — STEP 12 Profile / presence / avatars COMPLETE + REAL-DEVICE ACCEPTED

- STEP 12 was implemented from the current rebuild-v2 line rather than the older `main`-based attempt.
- Product owner tested the rebuild Preview and reported it works correctly.
- Profile name persistence now adds authoritative Firebase household-member sync while preserving rebuild-v2 UID-scoped local projection behavior.
- Profile now surfaces realtime presence/current area and remains aligned with canonical member/avatar identity.
- STEP 12 branch was merged through PR #29 into `agent/household-rebuild-v2` after acceptance.
- `main` remained untouched.
- STEP 13 — Activity / Feed became the next roadmap phase.

---

## 2026-08-30 — STEP 11 Party Quests COMPLETE + REAL-DEVICE ACCEPTED

- Final bundled STEP 11.9 acceptance passed all three checks.
- Check 1 PASS: participant leave + Home/Taken/Meldingen stability.
- Check 2 PASS: targeted help acceptance + household help behavior.
- Check 3 PASS: no second Party Quest XP and no duplicate reward/XP toast after full close/reopen for an already-rewarded participant.
- STEP 11.3, 11.4 and 11.5 therefore have real-device acceptance evidence; STEP 11.6 notifications had already been accepted.
- STEP 11.7 legacy quarantine and STEP 11.8 integrated runtime candidate remained green.
- Integrated candidate checkpoint `3f01b3f2265c88dcc6480e7458d16cb21da2a146`; CI `33273749600` SUCCESS; Preview `dpl_dfUnzTzLZtxxT2AjRLyGx74KtEBq` READY.
- STEP 11 closed COMPLETE + REAL-DEVICE ACCEPTED 2026-08-30.

---

## 2026-08-29 — STEP 11.8 integrated CI + Preview candidate COMPLETE

- Added final served-runtime integration contract `scripts/test-party-quest-step11-8-integration.js`.
- Verified canonical Party Quest layers and frozen dependencies are served once/in safe order and legacy prototypes remain absent.
- Candidate `3f01b3f2265c88dcc6480e7458d16cb21da2a146`; full rebuild CI `33273749600` SUCCESS.
- Vercel Preview `dpl_dfUnzTzLZtxxT2AjRLyGx74KtEBq` READY and root HTTP 200.

---

## 2026-08-29 — STEP 11.7 compatibility / legacy guard COMPLETE

- Added CI quarantine for dormant name/localStorage/legacy-XP Party Quest prototype authority.
- No unsafe name-to-UID migration introduced.
- Checkpoint `6cdcaa9dff2d35e6176d1b0959b45d86fb65515b`; CI `33273125677` SUCCESS.

---

## 2026-08-29 — STEP 11.6 notification extensions REAL-DEVICE ACCEPTED

- Ordinary involved-Task and combined Party Quest completion+XP notification behavior accepted.
- Duplicate/replay notification suppression passed device verification.
- Canonical notification state remains frozen authority.

---

## Frozen checkpoint reference

- STEP 8 Finance: accepted/frozen 2026-08-24.
- STEP 9 Progression: accepted/frozen 2026-08-24.
- STEP 10 Notifications: accepted/frozen 2026-08-26; code checkpoint `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- Frozen `notificationActions.js` blob through STEP 11: `60a48daa628bc56531395d188a0811711d82a328`.
- STEP 11 final integrated candidate: `3f01b3f2265c88dcc6480e7458d16cb21da2a146`.
- STEP 12 accepted/merged through PR #29 on 2026-08-30.
