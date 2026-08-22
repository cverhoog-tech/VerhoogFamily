# Household rebuild v2 — status

_Last updated: 2026-08-22_

Primary branch: `agent/household-rebuild-v2`

## Prototype end goal

The rebuild has two release goals alongside product/UI quality and later store-readiness:

1. **Multi-family ready prototype** — multiple independent families can use FamilyApp concurrently without cross-household data/state/write leakage.
2. **Privacy-safe personal platform admin** — the product owner's personal authenticated UID can access sanitized operational/diagnostic data needed to run the beta and fix bugs, without generic access to private household content.

Detailed acceptance contract: `docs/multi-family-prototype-acceptance.md`.

This is a release gate for a broader family beta, not an optional future enhancement.

## Current phase

### STEP 2B.3 — Own hero backdrop upload support

Status: **implementation complete on branch; production Storage Rules approval + real-device gate pending**

Implemented:
- Added `HeroBackdropUploadService` as the dedicated upload boundary.
- Only the currently authenticated member can upload/change their own hero background.
- Image-only validation with a 15 MB source limit.
- Client-side resize/compression before upload: max 1800px edge, WebP where supported with JPEG fallback, and a bounded final payload.
- Uploads use household/UID-scoped Firebase Storage paths with a cryptographically random 128-bit object id.
- HouseholdContext `capture()` / `isCurrent()` protects against a household/account switch during an upload.
- The member repository persists only whitelisted upload metadata and `storagePath`; Firebase download-token URLs are deliberately not stored in RTDB.
- Download URLs are resolved only in memory for the active household session when the Person hero needs to render.
- Picker now has select -> local optimized preview -> explicit confirm -> upload/progress flow.
- Switching back to a preset/reset cleans up the member's previous uploaded object after the profile mutation succeeds.
- Failed profile persistence attempts clean up the newly uploaded object.
- Firebase Storage compat SDK is wired into the served runtime before the upload service is used.
- `storage.rules` is versioned and registered by `firebase.json` but has **not** been deployed to production.
- Storage rules deny listing, restrict create/update/delete to the member's own UID path, and validate image size/type + FamilyApp metadata.
- `scripts/test-person-hero-backdrop-upload.js` records the upload/privacy contract.
- Branch contract-test workflow added for ongoing non-production CI coverage.
- Latest Vercel branch deployment for this implementation reached READY.

Security note:
- Firebase Cloud Storage Rules cannot directly look up Realtime Database household membership. The STEP 2B.3 prototype rule therefore uses authenticated exact-path reads plus unguessable random object paths, while the exact path is exposed only through the already household-protected RTDB member record.
- This is acceptable only as the current prototype bridge. Before the broader multi-family beta, STEP 15 must replace that read boundary with a server-verifiable household authorization signal or secure media service.

Still required before STEP 2B.3 is accepted/frozen:
- Explicit product-owner approval before deploying `storage.rules` to the production Firebase project.
- Real iPhone Safari/PWA smoke test after those rules are active: select a photo, preview, confirm, persist after reload, verify another household member can see it, then switch back to a preset/reset.

### STEP 2B.4 — Global FamilyApp Icon System

Status: **accepted / scope closed at current baseline by product decision**

Decision:
- The central semantic registry/renderer foundation remains in use where already migrated.
- Existing current icons across the remaining app surfaces are accepted as-is for the prototype.
- No further broad icon replacement/audit is required in STEP 2B.
- Bottom navigation and More-menu icons remain unchanged.
- Reopen icon work only for a concrete regression or a newly approved visual redesign.

### STEP 2B.5 — Brand / app identity

Status: **accepted / complete / frozen baseline**

Done:
- Canonical app-icon runtime exists.
- Manifest / Apple touch / favicon paths are centralized through the same-origin brand endpoint.
- Login and PWA/browser shell use the canonical brand pipeline.
- Final approved white/gold crest with the single purple diamond is stored as the v5 brand source.
- `api/brand-icon.js` serves the v5 crest for 32 / 180 / 192 / 512 / maskable variants.
- A separate transparent `login` crest variant is served for the authentication screen so the logo blends into the page without a white square/tile.
- Maskable icon uses a light ivory safety background to match the approved crest.
- Final iPhone Safari Add-to-Home-Screen test and transparent login-screen presentation accepted by product owner on 2026-08-22.

Decision:
- Treat the current v5 brand/PWA/login presentation as a frozen baseline.
- Do not reintroduce a white or rounded-square tile around the login crest.
- Keep the installed PWA icon pipeline separate from the transparent login presentation.

### STEP 2B.6 — Tasks icon/detail/create presentation

Status: **accepted / frozen baseline**

Decision:
- Task category/content icons are accepted.
- Rejected help/status migration remains reverted; previous presentation is intentional.
- Approved detail/create controls are accepted after live iPhone testing.
- Do not reopen this presentation without an explicit new design request or regression.

### STEP 2B.7 — Shopping / Recipes / Meals icon migration

Status: **accepted / complete / frozen baseline**

Decision:
- Current Shopping / Recipes / Meals icon presentation is accepted after the real iPhone Safari device gate.
- Stored legacy emoji fields remain compatibility metadata for now; removal belongs to later legacy/data-contract cleanup.

### STEP 2B.8 — Feed / Notifications / Agenda / Finance / Achievements icon migration

Status: **closed by product decision — current icons retained**

Decision:
- Do not perform the planned broad icon migration for Feed, Notifications, Agenda, Finance or Achievements.
- Their current icon presentation is acceptable for the prototype and remains the baseline.
- This is a deliberate scope decision, not an unfinished migration.

## Rebuild baseline

**Current icon/brand scope is accepted and frozen. STEP 2B.3 is the only remaining STEP 2B device-gate item.**

Existing accepted icons, branding and task/food presentation must remain unchanged unless explicitly requested.

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

## Multi-family / admin acceptance principles

- Platform admin is tied to the product owner's personal authenticated UID via server-verifiable authorization, never a frontend name/email check.
- Platform-admin capability is separate from household ownership/admin roles.
- Default admin visibility is sanitized technical/operational telemetry only.
- Raw task/shopping/recipe/meal/calendar/feed/private-note/upload/financial content is not part of the normal admin projection.
- If content-level debugging is ever needed, it must use a separate consent-based, minimum-scope, audited support mechanism.
- Multi-household isolation/lifecycle tests are added per module as the rebuild proceeds, not postponed until the end.

## Next work

Planned order:
1. Obtain explicit approval and deploy the STEP 2B.3 Firebase Storage Rules.
2. Run the STEP 2B.3 real iPhone/PWA upload + persistence + family-view device gate.
3. If accepted, freeze STEP 2B.3 and close STEP 2B overall.
4. Resume **STEP 2A platform-admin identity foundation**.
5. Migrate core modules STEP 3–14 with UID/household-scoped repositories, lifecycle cleanup and cross-household tests.
6. Build **STEP 14A sanitized platform operations dashboard**.
7. STEP 15 Rules hardening must prove household isolation, removed-member revocation, Storage/media authorization and the platform-admin privacy boundary.
8. STEP 16 removes remaining single-family/global legacy authorities.
9. Broader family beta is gated on the multi-family + privacy-safe-admin acceptance contract.

## Guardrails

- No production Firebase Rules/Storage Rules deployment without explicit product-owner approval.
- No changes to Firebase task data model during UI work.
- No changes to task completion or XP semantics during UI work.
- Current app icons are accepted for the prototype; no broad icon migrations without explicit approval.
- Bottom-nav and More-menu iconography remain unchanged.
- Preserve the transparent login crest presentation separately from the installed PWA icon variants.
- Never use the retired May 2026 TODO as a source of truth.
- Never grant platform admin unrestricted raw household-root access as a shortcut for diagnostics.
