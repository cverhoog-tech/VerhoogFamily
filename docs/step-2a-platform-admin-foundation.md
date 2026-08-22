# STEP 2A — Platform Admin Identity Foundation

Date: 2026-08-22
Branch: `agent/household-rebuild-v2`

## Scope

STEP 2A creates the platform-admin identity and privacy boundary only. It deliberately does **not** build the full admin dashboard; that remains STEP 14A after the household domain contracts are stable.

A platform-admin session remains an ordinary authenticated FamilyApp session with optional platform capabilities. App startup, household resolution and normal household usage do not depend on the admin subsystem.

## Identity model

Platform role and household role are independent:

`Firebase authenticated UID -> PlatformAdminFoundation -> optional platform permissions`

and separately:

`Firebase authenticated UID -> HouseholdContext -> active household membership/role`

Being a household `owner` or `admin` never grants a platform role. Likewise, being a platform admin does not make the account a member of other households.

## Protected authority

The canonical authority is the protected Realtime Database registry:

`platformAdmins/{uid}`

Expected server-provisioned record shape:

```json
{
  "uid": "<firebase-auth-uid>",
  "role": "superadmin",
  "status": "active"
}
```

Supported foundation roles:

- `superadmin`
- `support`

The browser may read only its **own** registry entry. Client writes to `platformAdmins` are denied by Firebase Rules, including writes to the current user's own entry. Provisioning, revocation and role changes therefore require privileged server/admin tooling.

No email address, display name or household role is accepted as platform authority.

## Permission contract

`PlatformAdminFoundation` exposes explicit permissions instead of a generic admin boolean.

Current permission vocabulary:

- `platform.operations.read`
- `platform.audit.read`
- `platform.beta.manage`
- `platform.support.manage`
- `platform.admin.manage`

Consumers should use `has(permission)` or `requirePermission(permission)` and should not duplicate role checks in UI modules.

## Privacy boundary

The foundation classifies data into:

- `operational`
- `household-content`
- `user-private`
- `support-content`

Only the dedicated `platformOperations` projection is normal platform-admin data. `families/{householdId}` remains protected exclusively by household membership rules; the family rules do not contain a platform-admin bypass.

The normal admin projection is allowlisted and sanitized. Household content such as task text, shopping item names, recipes/ingredients, meal contents, calendar text, feed/comments, private notes, uploads and detailed financial content is not part of the standard operations contract.

This is a backend/data-contract boundary, not a CSS/UI hiding rule.

## Realtime Database roots introduced

### `platformAdmins`

Protected platform identity registry.

- own entry readable by authenticated UID;
- no client writes;
- privileged provisioning only.

### `platformOperations`

Dedicated sanitized diagnostics/operations projection.

- readable only by active protected platform roles;
- no normal client writes;
- no raw household-domain records.

### `platformAudit`

Privileged audit projection.

- readable only by active protected platform roles;
- no client writes;
- audit persistence is server/admin-tooling owned.

## Audit-event contract

The client foundation can construct a sanitized audit-event envelope containing:

- `actorUid`
- `action`
- optional `targetHouseholdId`
- optional `targetUid`
- timestamp
- optional reason
- sanitized technical metadata

The event constructor deliberately removes known household-content/financial payload fields. Persistence is marked `server-only`; a normal client cannot write `platformAudit`.

## Runtime lifecycle

The platform foundation listens to the canonical `AuthenticatedSessionController` and resolves capabilities by the authenticated UID. It is not an auth owner and does not register a new Firebase auth observer.

On sign-out/account change, stale capability checks are invalidated with a request generation token and platform capability state is cleared/re-resolved.

## Regression contract

`scripts/test-platform-admin-foundation.js` verifies at minimum:

1. registry is not client-writable;
2. a user can inspect only their own platform entry;
3. normal household owner/admin state does not produce platform-admin capability;
4. an active protected UID registry record does produce explicit platform permissions;
5. platform-admin status does not add a `families/...` read bypass;
6. normal admin operations use the dedicated `platformOperations` root;
7. private household/financial/feed fields are absent from sanitized operations data;
8. audit metadata strips private/content fields;
9. audit persistence remains server-only;
10. the runtime loader includes the platform capability foundation.

`database.rules.json` is now part of the rebuild CI trigger so future security-boundary changes re-run the contract suite.

## Production safety / current gate

The code and candidate rules are committed only to `agent/household-rebuild-v2`.

**Not performed in STEP 2A implementation yet:**

- no production Firebase Rules deployment;
- no production `platformAdmins/{uid}` record provisioning;
- no production platform operations data population;
- no full admin dashboard.

This follows the rebuild guardrail: no Firebase production Rules deployment without explicit approval.

## Acceptance remaining

Before STEP 2A can be marked fully accepted:

1. rebuild contract CI must pass;
2. branch preview must load normally with no startup regression;
3. where applicable, real iPhone/PWA smoke gate must be accepted;
4. production Rules + the product owner's authenticated UID registry entry may only be provisioned after explicit approval.

The dashboard itself remains STEP 14A.
