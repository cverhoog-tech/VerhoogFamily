# Phase 18 — Firebase + Storage Rules audit

Status: 🟡 security architecture and emulator coverage added; deployed-rule and live-device acceptance remain release gates.

## Objective

Prove that FamilyApp data is isolated by Firebase Authentication UID and household membership, and remove broad rules that could become cross-household or privilege-escalation paths as the app scales beyond the original household.

## Realtime Database findings

### Previous risk: broad family-root read

The previous rule at `families/{householdId}` granted an active household member `.read` over the whole family root. In Realtime Database, a parent grant cannot be made narrower by child rules. That meant future child-specific privacy rules for domains such as Notifications could not actually reduce access.

The Phase 18 rules remove that parent grant. Read/write authority now exists only at declared paths.

### Canonical shared collection allowlist

The canonical `families/{householdId}/shared/*` boundary now allows only known FamilyDataContract domains and explicit compatibility collections. Unknown shared collection names are denied by default.

Explicit hardened domains:

- `shared/activity`
  - active household members may read;
  - creation requires `householdId === path householdId`;
  - `actorUid` must equal `auth.uid`;
  - canonical activity records are immutable after creation.
- `shared/notifications`
  - active household members may read the collection because NotificationStore currently subscribes at collection level and performs audience filtering in the client;
  - creation requires the authenticated user to be the actor and the path household to match;
  - existing notification content cannot be rewritten;
  - only `readBy/{auth.uid}` and `dismissedBy/{auth.uid}` may be changed by that UID.

Other canonical shared domains remain active-member read/write at the collection boundary while domain stores continue to enforce context tokens and record shape in application code. Record-level privilege rules can be tightened per domain in later passes where business roles require them.

### Private UID data

`users/{uid}/private/*` remains strictly self-only for read/write. Same-household membership does not grant access to another member's private data.

### Presence

Presence remains household-readable, but write access is limited to the authenticated member's own UID. Validation now requires typed `online`, `lastSeen`, and `name` fields when a presence record exists.

### Household metadata

Household metadata is owner/admin writable. `ownerUid` is immutable after creation so an owner/admin update cannot silently transfer ownership by rewriting metadata.

`meta` remains readable by authenticated users for the current invite/join architecture. This is intentionally documented rather than hidden: invite resolution currently needs pre-membership household metadata compatibility. A later invite-service redesign can make metadata membership-only or expose a minimal invite-safe projection.

### Push tokens

`families/{householdId}/fcmTokens/{uid}` is now self-write only. Owner/admin may inspect household token records; normal members cannot read another member's token.

### Legacy compatibility

A finite allowlist remains for legacy family-root collections that have not yet been fully retired (`tasks`, `shop`, `cal`, `recurData`, legacy finance/feed collections). This is deliberate migration debt, not an open wildcard. Phase 17/technical cleanup must remove these entries as each compatibility path is retired.

## Storage findings

No active Firebase Storage runtime was found during this audit. The project also previously had no Storage Rules entry in `firebase.json`.

Phase 18 therefore introduces a production-safe baseline:

- `storage.rules` exists;
- all Storage reads/writes are denied by default;
- `firebase.json` registers the rules;
- the production rules workflow deploys Database and Storage rules together.

This intentionally prevents future avatar, receipt, task-photo, recipe-image or feed-media features from accidentally inheriting an open bucket. When asset upload is implemented, it must receive an explicit household/UID path contract, MIME/size checks and negative emulator tests before Storage access is opened.

## Automated evidence

Dedicated workflow: `.github/workflows/firebase-rules-contract.yml`

Tests:

- `tests/firebase-rules-phase18.test.mjs`
  - canonical own-household access succeeds;
  - whole-family-root reads fail;
  - unknown shared/root collections fail;
  - cross-household read/write fails;
  - cross-UID private data fails;
  - presence is self-write only;
  - non-admin metadata mutation fails;
  - owner ownership-transfer forgery fails;
  - forged Activity actor/household fails;
  - Activity overwrite fails;
  - forged Notification actor/household fails;
  - Notification content rewrite fails;
  - read/dismiss markers are self-only;
  - FCM token writes are self-only;
  - anonymous access fails.
- existing removed-member rules regression.
- existing invite-lifecycle rules regression.
- `tests/storage-rules-default-deny.test.mjs` proves authenticated and anonymous Storage access are denied.

## Production deployment workflow

`.github/workflows/deploy-firebase-rules.yml` now deploys:

- Realtime Database rules;
- Storage rules.

It remains production-only on `main` and requires the existing `FIREBASE_SERVICE_ACCOUNT` environment secret.

## Remaining gates before Phase 18 can be ✅

1. Dedicated emulator workflow green on the branch.
2. Existing removed-member and invite lifecycle regressions green under the new rules.
3. Merge/deploy the rules to the actual Firebase project and verify the deployed rules version.
4. Re-run real browser/PWA authentication and household flows against deployed rules.
5. Prove at least three independent live households cannot cross-read/write.
6. Replace collection-level Notification audience filtering with a server-queryable/target-index architecture if notification payload privacy between household members becomes a product requirement.
7. Define explicit Storage asset contracts before enabling any Firebase Storage uploads.

Until those deployed/live gates are complete, Phase 18 remains 🟡 rather than ✅.
