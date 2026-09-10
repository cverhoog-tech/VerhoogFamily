# STEP 10 — Notifications / Push audit

Date: 2026-08-24  
Branch: `agent/household-rebuild-v2`

This is the required read-only audit before changing STEP 10 notification behavior.

## Executive finding

FamilyApp already contains a surprisingly complete notification architecture from earlier work — typed notification events, a household notification store, action handling, a premium notification center, live in-app banners and task/party projectors — but **that stack is not currently wired into the served rebuild runtime**.

The currently served code therefore sits in an awkward transitional state:

- legacy `addNotif(...)` calls are deliberately ignored;
- the notification screen in `finance.js` expects `window.NotificationStore`;
- the canonical-looking `NotificationStore`, `NotificationEvents`, `NotificationActions`, `NotificationCenter`, `NotificationDelivery` and notification projectors exist in the repository;
- the current `index.html` / `/api/app` served script graph does not load those notification modules;
- several active modules conditionally call `NotificationEvents`, so those calls silently do nothing when the notification stack is absent.

Push notification code also exists, but only as an old incomplete FCM registration stub in `duoQuests.js`. There is no complete push-delivery pipeline in the currently served app.

STEP 10 should therefore **salvage the good notification model, replace its old identity/listener authority with HouseholdContext, add event idempotency, then wire it into the served runtime**. Push delivery should be implemented as a separate adapter on top of the same canonical notification event state.

## 1. Current served notification UI / legacy state

### Legacy globals still present

`src/core/data.js` still declares:

- `notifData` demo array;
- `notifNextId`.

These are legacy leftovers and must not become STEP 10 authority.

### Legacy `addNotif` is already neutralized

`src/core/utils.js` intentionally implements `addNotif(...)` as a deprecated no-op compatibility facade. It logs a warning and returns `Promise.resolve(false)`.

This is good: old UI code cannot silently recreate a second local notification authority. STEP 10 should keep `addNotif` non-authoritative and migrate/retire remaining callers deliberately.

### Current notification screen expects NotificationStore

The served `src/modules/finance/finance.js` contains `renderNotifs()` / `clearNotifs()` that explicitly read `window.NotificationStore` and do not treat `notifData` as authority.

If NotificationStore is absent, the screen renders “Meldingen worden geladen…”.

## 2. Existing notification architecture in repository

### `src/core/notificationStore.js` v1.4.0

Current intended persistence:

`families/{householdId}/shared/notifications/{eventId}`

Current event model already contains useful fields:

- `type`
- `title`
- `body`
- `icon`
- `tone`
- `actor { uid, name }`
- `audience`
  - `{ kind: 'household' }`
  - `{ kind: 'uids', uids: [...] }`
- `entity`
- `data`
- `channels`
- `createdAt` / `updatedAt`
- `readBy { uid: timestamp }`
- `dismissedBy { uid: timestamp }`

This broadly matches the STEP 10 roadmap: shared household event state plus per-UID read/dismiss state.

Useful current behavior:

- unread count per active UID;
- per-UID visibility filtering;
- mark one/all read;
- dismiss one/all visible;
- detects newly received events and dispatches `familyapp:notification-received`;
- ignores the current actor when deciding whether an incoming event is a live notification for that same user.

### `src/core/notificationEvents.js` v1.4.1

Already provides a presentation-independent typed domain API for:

- task help requested;
- task help joined;
- task swap requested;
- task swap accepted/declined;
- Party Quest created/invite received;
- sent Party Quest invitation state;
- Party Quest joined;
- Party Quest completed;
- finance savings updates.

Domain modules do not need to construct notification Firebase paths directly.

### `src/core/notificationActions.js` v2.2.0

Already separates actionable notification behavior from presentation.

Current supported notification actions include:

- accept a task-help request;
- revoke a sent Party Quest invitation;
- accept/decline a received Party Quest invitation;
- mark informational events read.

It also derives the **current** action/status from actual task/party state rather than treating stale notification text as authoritative.

### `src/core/notificationCenter.js` v1.2.0

Already contains a premium notification list/detail UI with:

- unread/read presentation;
- status pills;
- detail sheet;
- live action buttons;
- `Alles gelezen` integration;
- current-domain-state refresh.

This can likely be retained with only a new store/runtime contract underneath it.

### `src/core/notificationDelivery.js` v1.2.0

This is **in-app live delivery**, not OS push.

It listens to `familyapp:notification-received` and shows a temporary premium banner with action/open controls.

This is a good example of the correct architecture: delivery/presentation is downstream from notification state.

### Existing domain projectors

Repository contains:

- `src/modules/tasks/taskNotificationProjector.js`
- `src/modules/tasks/taskSwapNotificationProjector.js`
- `src/modules/tasks/partyQuestNotificationProjector.js`

They observe task/swap/party state transitions and project those transitions into `NotificationEvents` instead of directly mutating notification UI state.

## 3. Critical runtime gap: notification stack is not currently served

Inspection of current branch `index.html`, `api/app.js` and dynamic calendar bootstrap shows no loading of:

- `notificationStore.js`
- `notificationEvents.js`
- `notificationActions.js`
- `notificationCenter.js`
- `notificationDelivery.js`
- the notification projectors above.

Meanwhile current served modules such as `finance.js` and `taskCompactLifecycle.js` already expect/use these globals conditionally.

Result: the architectural files exist but are effectively dormant in the current rebuild runtime.

STEP 10 must not merely “turn them back on” unchanged; their identity/listener model predates the accepted HouseholdContext rebuild and must be hardened first.

## 4. Identity / lifecycle problems in current dormant NotificationStore

`NotificationStore v1.4.0` currently reads identity from:

- `window.fbUser` / Firebase auth current user;
- `window.fbFamilyId`.

It delegates persistence/listening to `FamilyDataStore`.

Problems relative to the accepted rebuild architecture:

1. It is not bound through `HouseholdContext.capture()/isCurrent()`.
2. Subscription ownership is primarily household-ID based, not an explicit household + UID context token.
3. Logout does not directly call `detachSubscription()`; an existing listener can remain until another bind path replaces it or Firebase permission state interrupts it.
4. Same-household account switching is not treated as a full identity rebind because `ensureSubscription()` only compares `subscribedFamilyId`.
5. Incoming callbacks have no generation/context guard, so there is no explicit stale-callback rejection contract.
6. `FamilyDataStore.subscribeShared()` itself is a general legacy/shared abstraction based on `window.fbFamilyId`; STEP 10 should not make it the new notification authority when newer modules already use dedicated HouseholdContext repositories.

## 5. Idempotency gap

Current `NotificationStore.publish()` creates a random event ID using `FamilyDataStore.makeId('evt')`.

The projectors detect transitions in each client. If the same transition is observed by multiple devices/tabs, or a projector is restarted at an unlucky boundary, duplicate notification events can be written.

STEP 10 needs deterministic notification event keys, analogous to STEP 9 reward keys.

Examples:

- task help request: task ID + `helpRequestedAt` + recipient UID;
- task help joined: task ID + `helpAcceptedAt` + helper/requester UID;
- task swap request/result: swap-request ID + status;
- Party Quest invite: quest ID + recipient UID + invite occurrence/update timestamp where re-invites are possible;
- Party Quest join/completion: quest ID + stable transition identity;
- finance savings update: goal ID + canonical Finance transaction ID.

The canonical store should support `publishOnce(eventKey, event)` / deterministic event IDs so two clients observing one domain transition cannot create duplicate inbox/push events.

## 6. Current read / dismiss semantics

Current event-level maps already give the correct product semantics:

- `readBy[uid]`
- `dismissedBy[uid]`

`NotificationCenter` uses read state for visual treatment.

Current `clearNotifs()` means “mark all visible notifications as read”, not delete them. `NotificationStore.clearVisible()` separately represents per-user dismiss.

STEP 10 should preserve this distinction:

- read = still visible in history, but no unread badge;
- dismiss = hidden for this UID only;
- deleting the canonical household event is a separate retention/cleanup concern, not the normal user action.

## 7. Firebase Rules / privacy finding

Current `database.rules.json` uses a broad active-household-member rule for generic family shared collections.

That means the current shared notification path is not yet protected with notification-specific validation around:

- who may create an event;
- who may update `readBy/{uid}`;
- who may update `dismissedBy/{uid}`;
- immutable event/audience fields after creation.

This is a known security-hardening concern. Per roadmap guardrails, **do not deploy production Rules during STEP 10 without explicit approval**. Build the client/repository contract first and add testable rule requirements for STEP 15.

## 8. Push / FCM audit

### What exists today

`src/modules/tasks/duoQuests.js` currently:

- loads Firebase Messaging through `firebase.messaging()` when available;
- defines `setupPushNotifications()`;
- calls `Notification.requestPermission()`;
- calls `fbMsg.getToken()`;
- stores one token at:

`families/{householdId}/fcmTokens/{uid}`

### Why this is not a complete push system

The current repository/runtime search found no complete Web Push / FCM delivery pipeline:

- no Firebase Messaging service worker / `showNotification` handler found;
- no `navigator.serviceWorker` registration found;
- no foreground `onMessage` handler found;
- no VAPID/service-worker token registration contract found;
- no server-side FCM sender tied to canonical notification events found;
- no token rotation/refresh/revocation handling found;
- no logout/account-switch token detach logic found;
- one token per UID cannot model multiple devices/browsers safely;
- token storage is under household shared data rather than a user-private device registry;
- notification permission is requested inside a legacy helper rather than a deliberate user opt-in/settings flow;
- no delivery status is linked back to canonical notification events.

`setupPushNotifications()` also appears to be a definition only in the current served code; no active call path was found during the audit.

Conclusion: **push notifications are not currently operational as a reliable feature**, even though an old registration stub exists.

## 9. STEP 10 target architecture

Keep four explicit layers:

`domain event -> canonical NotificationStore -> presentation/inbox`

and separately:

`canonical notification event -> delivery adapters -> in-app / web push / later native push`

### Canonical notification authority

Recommended persistence path (preserve existing data shape where possible):

`families/{householdId}/shared/notifications/{deterministicEventId}`

Repository must bind through `HouseholdContext` and own exactly one listener.

### Canonical event requirements

Each event should include at least:

- deterministic `eventKey`;
- stable `id`;
- `schemaVersion`;
- typed `type`;
- actor UID/name snapshot;
- audience;
- entity/source reference;
- title/body/icon/tone presentation payload;
- `channels` intent;
- `createdAt` / `updatedAt`;
- per-UID `readBy` / `dismissedBy`;
- optional platform-neutral route/deep-link target.

### Push device registry

Device delivery credentials should be user-private, not household-shared.

Recommended logical contract:

`users/{uid}/private/pushDevices/{deviceId}`

Each device record should be able to represent:

- platform (`web`, later `ios`, `android`);
- provider (`fcm`, later APNs if directly used);
- token;
- app/runtime version;
- createdAt / updatedAt / lastSeenAt;
- permission state;
- disabled/revoked state.

This supports multiple phones/browsers per account and prevents another household member from reading device tokens.

### Push sender

The browser must **not** own FCM server credentials.

A later STEP 10 delivery adapter should call a trusted backend/serverless endpoint which:

1. authenticates the FamilyApp user/server event;
2. resolves the canonical notification and intended recipient UID(s);
3. reads only those recipients' registered delivery devices;
4. sends via FCM/APNs adapter;
5. records sanitized delivery health/status separately from notification read state.

Because FamilyApp is currently Vercel-hosted and Firebase is intentionally kept on Spark unless a new product decision changes that, a Vercel server-side delivery boundary is the most natural candidate to evaluate before considering Firebase Functions. Do not store/send service-account credentials in client code.

### Web/PWA push adapter

For the current PWA, the web adapter will need a real service worker and deliberate permission flow. The domain notification store must not depend on those browser APIs: if push is unsupported/denied, the same canonical event still appears in the FamilyApp inbox.

### Future native apps

A future iOS/Android shell should be able to register native device tokens against the same push-device service and receive the same canonical notification event/deep-link payload. No rewrite of task/party/notification domain logic should be required.

## 10. Recommended implementation order

1. Add `NotificationHouseholdRepository` bound to HouseholdContext at the existing notification path, with exact cleanup and stale-callback rejection.
2. Convert `NotificationStore` into the canonical facade over that repository; keep `readBy`/`dismissedBy` semantics.
3. Add deterministic `eventKey` / `publishOnce()` and migrate typed NotificationEvents/projectors to stable keys.
4. Add lifecycle/isolation/idempotency contracts before runtime activation.
5. Wire the notification stack into the actual `/api/app` served graph and add a served-runtime notification audit.
6. Verify in-app inbox, unread badge, live banner and actionable task/Party Quest notifications cross-device.
7. Add user-private push-device registry and a platform-neutral `PushDelivery` interface.
8. Add Web/PWA FCM adapter + service worker + user-driven permission/registration flow.
9. Add trusted server-side sender; notification state remains successful even if push delivery fails.
10. Run full contract suite + Vercel preview + real iPhone gate before freezing STEP 10.

## Audit conclusion

STEP 10 does **include push notifications**, but push is a delivery channel, not the notification database itself.

The most important immediate task is not to add more UI or request notification permission. It is to make the existing good notification concepts canonical under HouseholdContext, idempotent and actually served. Once that state layer is trustworthy, push can be attached cleanly without creating a second notification system.
