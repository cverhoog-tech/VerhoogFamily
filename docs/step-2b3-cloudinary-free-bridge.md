# STEP 2B.3 — Cloudinary Free prototype bridge

Status: implementation on `agent/household-rebuild-v2`; one-time Cloudinary preset setup and real-device gate pending.

## Product decision

Firebase stays on the **Spark** plan. FamilyApp will not enable Blaze solely to obtain Firebase Cloud Storage for hero-background uploads.

STEP 2B.3 therefore uses the existing Cloudinary **Free** account as a prototype image provider. This is deliberately not the final broader-beta media security model.

Cloudinary cloud: `rg86slp4`

Dedicated asset folder: `familyapp/hero-uploads`

Required unsigned upload preset: `fa_hero_91c8f43ad0b6_v1`

## One-time Cloudinary Console setup

Create one upload preset in Cloudinary Console under Settings -> Upload -> Upload presets.

Required settings:
- preset name: `fa_hero_91c8f43ad0b6_v1`
- signing mode: **Unsigned**
- resource type: image/default image upload
- asset folder: `familyapp/hero-uploads`
- allowed formats: `webp,jpg,jpeg`
- maximum file size: **2 MB**
- disallow caller-supplied public ID: **enabled**
- unique/random public IDs: **enabled/default**
- overwrite: **disabled**
- fixed tag where available: `familyapp-hero-backdrop`

Do not put a Cloudinary API key or API secret in FamilyApp client code. The unsigned preset name is not a secret and is visible to the browser.

## Runtime contract

The app:
1. accepts an image only;
2. rejects source files over 15 MB;
3. resizes/compresses locally to max 1800 px edge;
4. targets roughly <=1.4 MB final payload;
5. requires the current authenticated UID to match the edited profile;
6. captures HouseholdContext before upload and rejects stale context after an account/household switch;
7. uploads no household ID, UID, display name or household content to Cloudinary metadata;
8. stores the resulting Cloudinary delivery URL plus opaque asset metadata inside the existing household-protected member record;
9. records retired asset IDs in the user's private RTDB media-cleanup queue for later signed deletion.

## Prototype privacy boundary

Standard Cloudinary `upload` assets are public-by-URL. Anyone who obtains the exact delivery URL can retrieve the file. The URL is only persisted in the household-protected member record, but Cloudinary itself does not enforce FamilyApp household membership for delivery.

Therefore this bridge is acceptable only for the current prototype/device gate. Do not use sensitive private photos for prototype testing.

Before broader multi-family beta, STEP 15 must replace this with a server-authorized/signed media boundary or an equivalent secure media service. The signed backend must also process the retired-media cleanup queue.

## Device gate

After the preset exists:
1. open Taken -> Persoon on the fixed Vercel branch preview;
2. edit the current user's hero background;
3. choose a non-sensitive test image;
4. confirm the optimized preview;
5. verify upload completes and the hero rerenders;
6. reload and verify persistence;
7. verify another member of the same household can see the selected backdrop;
8. switch back to a preset/reset and verify the app remains stable.

Only after this gate is accepted can STEP 2B.3 and STEP 2B overall be frozen.
