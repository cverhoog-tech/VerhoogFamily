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

Status: **Cloudinary Free implementation complete on branch; one-time unsigned-preset setup + real-device gate pending**

Product decision on 2026-08-22:
- Do **not** upgrade Firebase from Spark to Blaze just to obtain Cloud Storage.
- Keep Firebase on the no-cost Spark plan.
- Use the existing Cloudinary **Free** account as the prototype image-storage provider for own hero backdrops.
- The abandoned Firebase Storage implementation is retired; no Firebase Storage production release/rules are required for STEP 2B.3.

Implemented on the branch:
- `HeroBackdropUploadService` now uses Cloudinary cloud `rg86slp4` rather than Firebase Storage.
- The upload UI remains own-profile only and still requires a ready UID + household context.
- HouseholdContext `capture()` / `isCurrent()` protects against account/household changes during upload.
- Source validation remains image-only with a 15 MB source cap.
- Images are resized/compressed client-side before upload: max 1800 px edge, WebP where supported with JPEG fallback, bounded to about 1.4 MB.
- Upload uses a dedicated prototype unsigned preset: `fa_hero_91c8f43ad0b6_v1`.
- Cloudinary receives no household ID, member UID, display name or other household content as upload metadata.
- Realtime Database remains the household-scoped source of truth for the selected backdrop.
- The member record persists only the Cloudinary delivery URL plus opaque provider/asset metadata needed to render and later clean up the file.
- Replaced/retired Cloudinary assets are recorded under the user's private `mediaCleanup/cloudinary` queue so a future signed cleanup worker can delete them without exposing a Cloudinary API secret in the browser.
- The picker still uses select -> optimized local preview -> explicit confirm -> upload/progress -> profile persistence.
- Firebase Storage compat runtime injection was removed.
- `firebase.json` no longer registers Storage.
- The unused `storage.rules`, Firebase Storage deploy workflow and direct rules-deploy helper were removed.
- Temporary Cloudinary capability/environment probe endpoints were removed after verification.
- `scripts/test-person-hero-backdrop-upload.js` now protects the Cloudinary/Spark contract.
- The general rebuild contract-test workflow remains active.

Cloudinary account state checked on 2026-08-22:
- Plan: **Free**.
- Usage at check time: 0.19 / 25 credits used.
- Dedicated Media Library folder created: `familyapp/hero-uploads`.
- No Cloudinary API secret is stored in the repository or browser runtime.

Prototype privacy/security boundary:
- The unsigned preset is deliberately a **prototype bridge**, not the broader-beta final media architecture.
- The preset must restrict formats, maximum file size and destination folder, and must generate random public IDs.
- Standard Cloudinary `upload` delivery URLs are public-by-URL: someone who obtains the exact URL can retrieve that image. Testers should therefore not use sensitive/private photos in this prototype upload feature.
- Before broader multi-family beta, STEP 15 must replace unsigned client uploads with a server-authorized/signed media boundary (or equivalent secure media service) and process the private cleanup queue.
- This trade-off keeps the current prototype on Firebase Spark and avoids enabling a billable Firebase project solely for image storage.

Still required before STEP 2B.3 is accepted/frozen:
1. Create the Cloudinary unsigned upload preset `fa_hero_91c8f43ad0b6_v1` in the Cloudinary Console with the documented restrictions.
2. Verify a direct test upload succeeds through that preset.
3. Run the real iPhone Safari/PWA gate: choose a photo, preview, confirm, reload, verify the backdrop persists and another member in the same household sees it, then switch back to a preset/reset.

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

## Rebuild baseline

**Current icon/brand scope is accepted and frozen. STEP 2B.3 is the only remaining STEP 2B gate.**

Existing accepted icons, branding and task/food presentation must remain unchanged unless explicitly requested.

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

## Next work

Planned order:
1. Complete the one-time restricted Cloudinary unsigned-preset setup for STEP 2B.3.
2. Run the STEP 2B.3 real iPhone/PWA upload + persistence + same-household visibility + reset gate.
3. If accepted, freeze STEP 2B.3 and close STEP 2B overall.
4. Resume **STEP 2A platform-admin identity foundation**.
5. Migrate core modules STEP 3–14 with UID/household-scoped repositories, lifecycle cleanup and cross-household tests.
6. Build **STEP 14A sanitized platform operations dashboard**.
7. STEP 15 hardens Firebase Rules **and media authorization**, replaces the unsigned Cloudinary bridge, and processes retired-media cleanup safely.
8. STEP 16 removes remaining single-family/global legacy authorities.
9. Broader family beta is gated on the multi-family + privacy-safe-admin acceptance contract.

## Guardrails

- Firebase stays on Spark unless a future paid-plan change is explicitly approved.
- No Cloudinary API secret may be stored in client code or the public repository.
- The unsigned Cloudinary upload bridge is prototype-only and must not silently become the broader-beta media boundary.
- No changes to the Firebase task data model during UI work.
- No changes to task completion or XP semantics during UI work.
- Current app icons are accepted for the prototype; no broad icon migrations without explicit approval.
- Preserve the transparent login crest presentation separately from installed PWA icon variants.
- Never use the retired May 2026 TODO as a source of truth.
- Never grant platform admin unrestricted raw household-root access as a shortcut for diagnostics.
