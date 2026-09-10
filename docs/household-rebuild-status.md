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

**STEP 2B is accepted and closed. Next active phase: STEP 2A — Platform admin identity foundation.**

### STEP 2B.3 — Own hero backdrop upload support

Status: **accepted / complete / frozen prototype baseline**

Product decisions and accepted implementation:
- Firebase remains on the no-cost Spark plan; do not enable Blaze solely for image storage.
- Own hero-backdrop uploads use the existing Cloudinary Free account as the prototype media provider.
- The dedicated unsigned preset is `fa_hero_91c8f43ad0b6_v1`.
- Upload is own-profile only and requires the active UID + household context.
- HouseholdContext `capture()` / `isCurrent()` protects against account/household changes during upload.
- Source validation is image-only with a 15 MB source cap.
- iPhone photo optimization uses adaptive multi-pass JPEG/WebP compression and resizing until the payload is within the approximately 1.4 MB prototype limit.
- Picker flow is select -> optimized local preview -> explicit confirm -> upload/progress -> profile persistence.
- Realtime Database remains the household-scoped source of truth for the selected backdrop metadata.
- Cloudinary receives no household ID, member UID or display name from the upload request.
- Replaced/retired Cloudinary assets are recorded in the user's private cleanup queue for later signed deletion.
- Firebase Storage runtime/config/rules/deploy helpers are not part of this prototype path.
- The Cloudinary upload contract and rebuild contract suite pass on the accepted branch baseline.
- Vercel preview for the accepted compression fix reached READY.
- Real iPhone/PWA upload gate was accepted by the product owner on 2026-08-22 after the adaptive compression fix; normal iPhone photos now upload successfully.

Prototype privacy/security boundary:
- The unsigned Cloudinary preset is deliberately a **prototype bridge**, not the broader-beta final media architecture.
- Standard Cloudinary `upload` delivery URLs are public-by-URL. Sensitive/private photos should not be used for prototype testing.
- Before broader multi-family beta, STEP 15 must replace unsigned client uploads with a server-authorized/signed media boundary (or equivalent secure media service) and process the private cleanup queue.

Decision:
- Treat STEP 2B.3 as frozen unless a concrete regression is reported.
- Do not reopen Firebase Storage/Blaze for this feature without an explicit new product decision.

### STEP 2B.4 — Global FamilyApp Icon System

Status: **accepted / scope closed at current baseline by product decision**

- Central semantic registry/renderer remains in use where already migrated.
- Existing current icons across remaining surfaces are accepted as-is for the prototype.
- Bottom navigation and More-menu icons remain unchanged.
- No further broad icon migration is planned without an explicit redesign request.

### STEP 2B.5 — Brand / app identity

Status: **accepted / complete / frozen baseline**

- Approved crest v5 is the PWA/browser/login identity.
- Transparent login crest and real iPhone Add-to-Home-Screen presentation were accepted on 2026-08-22.
- Do not reintroduce a white/rounded-square tile around the login crest.

### STEP 2B.6 — Tasks icon/detail/create presentation

Status: **accepted / frozen baseline**

- Approved task category/content and detail/create presentation stays frozen.
- Rejected help/status migration remains reverted and the previous presentation is intentional.

### STEP 2B.7 — Shopping / Recipes / Meals icon migration

Status: **accepted / complete / frozen baseline**

- Current Shopping / Recipes / Meals presentation was accepted after the real iPhone device gate.

### STEP 2B.8 — Feed / Notifications / Agenda / Finance / Achievements icon migration

Status: **closed by product decision — current icons retained**

- No broad migration is required; current icons remain the prototype baseline.

## STEP 2B closure

**STEP 2B — Person/UI identity modernization is closed and frozen at the accepted prototype baseline.**

Accepted/frozen:
- backdrop foundation;
- preset picker;
- own-photo hero backdrop upload through Cloudinary Free;
- current global icon scope;
- brand/PWA identity;
- task icon/detail/create presentation;
- Shopping / Recipes / Meals presentation;
- deliberate retention of remaining current app icons.

Existing accepted icons, branding, task/food presentation and hero-upload behavior must remain unchanged unless explicitly requested or a regression is confirmed.

## Next work — STEP 2A

Resume **STEP 2A — Platform admin identity foundation** before core module migrations.

Required foundation:
- platform role separate from household role;
- platform-admin authority bound to the product owner's authenticated personal UID through server-verifiable authorization;
- no client self-elevation;
- dedicated permission/API contract;
- audit-event contract;
- privacy classification separating operational metadata from household content;
- tests proving a household admin is not a platform admin;
- tests proving platform-admin status never implies unrestricted household-content access.

After STEP 2A, continue STEP 3–14 module migrations, STEP 14A sanitized operations dashboard, STEP 15 Firebase Rules + media authorization hardening, STEP 16 legacy cleanup, then the multi-family broader-beta gate and STEP 17 store-readiness.

## Planning source of truth

The obsolete May 2026 generic TODO is retired completely and must not be used for planning, regression work, prioritization, or feature status.

Current planning is based only on:
- the actual code/state of `agent/household-rebuild-v2`;
- this status document;
- `docs/household-rebuild-v2-roadmap.md`;
- `docs/household-rebuild-v2-progress.md`;
- `docs/multi-family-prototype-acceptance.md`;
- `docs/MULTI-HOUSEHOLD-PRODUCTION-READINESS.md`;
- newly reported bugs/features from the current product state.

## Multi-family / admin acceptance principles

- Platform admin is tied to the product owner's personal authenticated UID via server-verifiable authorization, never a frontend name/email check.
- Platform-admin capability is separate from household ownership/admin roles.
- Default admin visibility is sanitized technical/operational telemetry only.
- Raw household content is not part of the normal admin projection.
- Multi-household isolation/lifecycle tests are added per module as the rebuild proceeds.

## Guardrails

- Firebase stays on Spark unless a future paid-plan change is explicitly approved.
- No Cloudinary API secret may be stored in client code or the public repository.
- The unsigned Cloudinary upload bridge is prototype-only and must not silently become the broader-beta media boundary.
- No production Firebase Rules deployment without explicit product-owner approval.
- No changes to the Firebase task data model during UI work.
- No changes to task completion or XP semantics during UI work.
- Current app icons are accepted for the prototype; no broad icon migrations without explicit approval.
- Preserve the transparent login crest presentation separately from installed PWA icon variants.
- Never use the retired May 2026 TODO as a source of truth.
- Never grant platform admin unrestricted raw household-root access as a shortcut for diagnostics.
