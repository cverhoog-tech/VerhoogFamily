# Household rebuild v2 — status

_Last updated: 2026-08-22_

Primary branch: `agent/household-rebuild-v2`

## Prototype end goal

The rebuild now has an explicit second end goal alongside product/UI quality and later store-readiness:

1. **Multi-family ready prototype** — multiple independent families can use FamilyApp concurrently without cross-household data/state/write leakage.
2. **Privacy-safe personal platform admin** — the product owner's personal authenticated UID can access sanitized operational/diagnostic data needed to run the beta and fix bugs, without generic access to private household content.

Detailed acceptance contract: `docs/multi-family-prototype-acceptance.md`.

This is a release gate for a broader family beta, not an optional future enhancement.

## Current phase

### STEP 2B.5 — Brand / app identity

Status: **accepted / complete / frozen baseline**

Done:
- Canonical app-icon runtime exists.
- Manifest / Apple touch / favicon paths are centralized through the same-origin brand endpoint.
- Login and PWA/browser shell use the canonical brand pipeline.
- Final approved white/gold crest with the single purple diamond is stored as the v5 brand source.
- `api/brand-icon.js` serves the v5 crest for 32 / 180 / 192 / 512 / maskable variants.
- A separate transparent `login` crest variant is served for the authentication screen so the logo blends into the page without a white square/tile.
- `src/core/appIcon.js`, `manifest.json` and the runtime shell are switched from brand v4 to brand v5.
- Maskable icon uses a light ivory safety background to match the approved crest.
- Login presentation uses the transparent crest with `object-fit: contain` and no rounded-square tile styling.
- Final iPhone Safari Add-to-Home-Screen test with crest v5 accepted by product owner on 2026-08-22.
- Final login-screen transparent crest presentation accepted by product owner on 2026-08-22.

Decision:
- Treat the current v5 brand/PWA/login presentation as a frozen baseline.
- Do not reintroduce a white or rounded-square tile around the login crest.
- Keep the installed PWA icon pipeline separate from the transparent login presentation.

### STEP 2B.6A — Task category/content icons

Status: **accepted / complete**

Done:
- Canonical `TaskCategoryIcons` route is active.
- 12 task categories use the central registry/renderer.
- Detail popup no longer competes with a second category-artwork route during normal use.
- Per-category visual scaling normalizes perceived icon size.
- Compact and detail views share the same semantic category system.
- iPhone UI-scale centering fixes accepted at 100% / 120%.
- Completed-subtask checkmark centering accepted.

### STEP 2B.6B — Help / party / status icon migration

Status: **closed by product decision — keep previous presentation**

Decision:
- The attempted centralized help/status visual migration was rejected visually.
- The migration was fully reverted.
- Existing Help needed / collaboration / party/status presentation remains the approved version.
- Do not migrate these controls again unless a new visual design is explicitly approved first.

### STEP 2B.6C — Detail / create action controls

Status: **accepted / complete**

Done:
- Subtask delete uses canonical `utilityTrash` artwork.
- Task delete uses canonical `utilityTrash` artwork.
- Bookmark/save uses canonical `utilityBookmark` artwork.
- Create-task confirmation uses canonical `utilityCheck` artwork.
- Alignment contracts added for iOS/Safari and global UI scale.
- Remaining inline popup icons were audited.
- Existing close, metadata calendar, recurrence shield, completion/reopen/lock, help crest and collaboration link are deliberate exceptions because changing them would alter previously approved presentation.
- Regression contract test added in `scripts/test-task-detail-icon-contract.js` to protect these accepted boundaries.
- Live iPhone Safari smoke test accepted by product owner on 2026-08-22.

### STEP 2B.6 — Overall

Status: **accepted / frozen baseline**

Decision:
- 2B.6A accepted.
- 2B.6B closed with the previous presentation intentionally preserved.
- 2B.6C accepted after live iPhone testing.
- Treat the current task icon/detail/create presentation as a frozen baseline for the next rebuild phase.

### STEP 2B.7 — Shopping / Recipes / Meals icon migration

Status: **accepted / complete / frozen baseline**

Done:
- Added `FamilyAppFoodIconResolver` as a central semantic boundary for recipe categories and meal slots.
- Shopping product/category rendering continues through the canonical `FamilyAppUtilityIconResolver`; visible generic emoji fallback is replaced by canonical `utilityGeneric` artwork.
- Shopping list selector/picker uses canonical shopping/people artwork and no longer depends on emoji labels for private/household presentation.
- Recipe editor hero category presentation uses the canonical food resolver while retaining legacy recipe emoji only as compatibility metadata in stored records.
- Meals screen lunch/dinner content icons resolve through the central food resolver.
- Runtime loads `familyAppFoodIconResolver.js` before migrated module presentation code and cache-busts Shop / Recipe editor / Meals.
- Added `scripts/test-food-icon-contract.js` to lock semantic mappings, runtime wiring and the frozen STEP 2B.6 boundary.
- Latest Vercel branch preview reached READY.
- Real iPhone Safari visual/device smoke test for Shopping, Recipes and Meals accepted by product owner on 2026-08-22.
- Shopping/recipe/meal behavior confirmed visually/functionally acceptable during the device gate.

Decision:
- Treat the current Shopping / Recipes / Meals icon presentation as a frozen STEP 2B.7 baseline.
- Stored legacy emoji fields remain compatibility metadata for now; removing them belongs to later legacy/data-contract cleanup, not this visual phase.
- STEP 2B.5 and STEP 2B.6 remain untouched/frozen.

## Rebuild baseline

**STEP 2B.5 + STEP 2B.6 + STEP 2B.7 are accepted and frozen. STEP 2B.8 is the next module icon migration.**

The next household-rebuild work must preserve the accepted brand/PWA/login, task icon/detail/create, and Shopping / Recipes / Meals icon presentation unless explicitly requested.

## Planning source of truth

The obsolete May 2026 generic TODO is retired completely and must not be used for planning, regression work, prioritization, or feature status.

Current planning is based only on:
- the actual code/state of `agent/household-rebuild-v2`;
- this status document;
- `docs/household-rebuild-v2-roadmap.md`;
- `docs/household-rebuild-v2-progress.md`;
- `docs/multi-family-prototype-acceptance.md`;
- `docs/MULTI-HOUSEHOLD-PRODUCTION-READINESS.md` for the deeper multi-household architecture checklist;
- newly reported bugs/features from the current product state.

Do not resurrect or infer open work from the retired May TODO.

## Multi-family / admin acceptance principles

- Platform admin is tied to the product owner's personal authenticated UID via server-verifiable authorization, never a frontend name/email check.
- Platform-admin capability is separate from household ownership/admin roles.
- Default admin visibility is sanitized technical/operational telemetry only.
- Raw task/shopping/recipe/meal/calendar/feed/private-note/upload/financial content is not part of the normal admin projection.
- If content-level debugging is ever needed, it must use a separate consent-based, minimum-scope, audited support mechanism.
- Multi-household isolation/lifecycle tests are added per module as the rebuild proceeds, not postponed until the end.

## Next work

### Complete remaining STEP 2B work, then resume platform/multi-family architecture

Planned order:
1. Implement and device-test STEP 2B.8 — Feed / Notifications / Agenda / Finance / Achievements icon migration.
2. Close the outstanding STEP 2B.3 upload-support and STEP 2B.4 global icon-system audit items.
3. Resume **STEP 2A platform-admin identity foundation** before building the later admin dashboard.
4. Migrate core modules STEP 3–14 with UID/household-scoped repositories, lifecycle cleanup and cross-household tests.
5. Build **STEP 14A sanitized platform operations dashboard**.
6. STEP 15 Rules hardening must prove household isolation, removed-member revocation and the platform-admin privacy boundary.
7. STEP 16 removes remaining single-family/global legacy authorities.
8. Broader family beta is gated on the multi-family + privacy-safe-admin acceptance contract.

## Guardrails

- No changes to Firebase task data model during icon/UI work.
- No changes to task completion or XP semantics during icon/UI work.
- No bottom-nav or More-menu icon migration as part of the frozen 2B.6 baseline.
- Prefer central semantic registry/resolver paths over duplicate inline artwork when a visual migration has been approved.
- Preserve explicitly accepted legacy presentation where a migration was visually rejected.
- Preserve the transparent login crest presentation separately from the installed PWA icon variants.
- Never use the retired May 2026 TODO as a source of truth.
- Never grant platform admin unrestricted raw household-root access as a shortcut for diagnostics.
