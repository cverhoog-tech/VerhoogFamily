import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { get, ref, set, update } from 'firebase/database';

const projectId = 'demo-familyapp-phase18-rtdb';
const rules = readFileSync('database.rules.json', 'utf8');
const env = await initializeTestEnvironment({ projectId, database: { rules } });

const ALPHA = 'household-alpha';
const BETA = 'household-beta';
const OWNER = 'alpha-owner';
const MEMBER = 'alpha-member';
const BETA_USER = 'beta-user';
const now = Date.now();

function member(uid, name, role = 'adult', status = 'active') {
  return { uid, name, role, status, joinedAt: now };
}

function notification(id, actorUid, overrides = {}) {
  return {
    id,
    schemaVersion: 2,
    type: 'system.message',
    title: 'Test notification',
    body: 'Body',
    householdId: ALPHA,
    actor: { uid: actorUid, name: actorUid },
    audience: { kind: 'household' },
    createdAt: now,
    updatedAt: now,
    readBy: {},
    dismissedBy: {},
    ...overrides
  };
}

function activity(id, actorUid, overrides = {}) {
  return {
    id,
    schemaVersion: 2,
    type: 'task.created',
    householdId: ALPHA,
    actorUid,
    entityType: 'task',
    entityId: 'task-1',
    occurredAt: now,
    createdAt: now,
    visibility: 'household',
    idempotencyKey: id,
    ...overrides
  };
}

try {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await set(ref(db), {
      users: {
        [OWNER]: { name: 'Alpha Owner', familyId: ALPHA, activeHouseholdId: ALPHA, private: { preferences: { theme: 'light' } } },
        [MEMBER]: { name: 'Alpha Member', familyId: ALPHA, activeHouseholdId: ALPHA, private: { preferences: { theme: 'dark' } } },
        [BETA_USER]: { name: 'Beta User', familyId: BETA, activeHouseholdId: BETA, private: { preferences: { theme: 'light' } } }
      },
      families: {
        [ALPHA]: {
          meta: { id: ALPHA, name: 'Alpha', ownerUid: OWNER, version: 1, createdAt: now, updatedAt: now },
          members: {
            [OWNER]: member(OWNER, 'Alpha Owner', 'owner'),
            [MEMBER]: member(MEMBER, 'Alpha Member')
          },
          presence: {
            [OWNER]: { online: true, lastSeen: now, name: 'Alpha Owner' },
            [MEMBER]: { online: true, lastSeen: now, name: 'Alpha Member' }
          },
          shared: {
            tasks: { task1: { title: 'Alpha task' } },
            finance: { current: { disposableIncome: 100 } }
          }
        },
        [BETA]: {
          meta: { id: BETA, name: 'Beta', ownerUid: BETA_USER, version: 1, createdAt: now, updatedAt: now },
          members: { [BETA_USER]: member(BETA_USER, 'Beta User', 'owner') },
          shared: { tasks: { task1: { title: 'Beta task' } } }
        }
      }
    });
  });

  const ownerDb = env.authenticatedContext(OWNER).database();
  const memberDb = env.authenticatedContext(MEMBER).database();
  const betaDb = env.authenticatedContext(BETA_USER).database();
  const anonDb = env.unauthenticatedContext().database();

  // Canonical own-household access remains functional.
  await assertSucceeds(get(ref(memberDb, `families/${ALPHA}/shared/tasks`)));
  await assertSucceeds(set(ref(memberDb, `families/${ALPHA}/shared/tasks/member-task`), { title: 'Allowed' }));
  await assertSucceeds(get(ref(memberDb, `families/${ALPHA}/shared/finance`)));

  // No broad family-root authority and no undeclared collections.
  await assertFails(get(ref(memberDb, `families/${ALPHA}`)));
  await assertFails(get(ref(memberDb, `families/${ALPHA}/shared/unknownCollection`)));
  await assertFails(set(ref(memberDb, `families/${ALPHA}/shared/unknownCollection/x`), { secret: true }));
  await assertFails(set(ref(memberDb, `families/${ALPHA}/unexpectedRoot/x`), { secret: true }));

  // Cross-household and cross-UID private isolation.
  await assertFails(get(ref(memberDb, `families/${BETA}/shared/tasks`)));
  await assertFails(set(ref(memberDb, `families/${BETA}/shared/tasks/intrusion`), { title: 'Nope' }));
  await assertSucceeds(get(ref(memberDb, `users/${MEMBER}/private/preferences`)));
  await assertFails(get(ref(memberDb, `users/${OWNER}/private/preferences`)));
  await assertFails(set(ref(memberDb, `users/${OWNER}/private/preferences/theme`), 'owned'));
  await assertFails(get(ref(betaDb, `users/${MEMBER}/private/preferences`)));

  // Presence is self-write only.
  await assertSucceeds(update(ref(memberDb, `families/${ALPHA}/presence/${MEMBER}`), { online: true, lastSeen: now + 1, name: 'Alpha Member' }));
  await assertFails(update(ref(memberDb, `families/${ALPHA}/presence/${OWNER}`), { online: false, lastSeen: now + 1, name: 'Alpha Owner' }));

  // Household metadata is owner/admin writable but ownership is immutable.
  await assertFails(update(ref(memberDb, `families/${ALPHA}/meta`), { name: 'Hijacked', updatedAt: now + 1 }));
  await assertSucceeds(update(ref(ownerDb, `families/${ALPHA}/meta`), { name: 'Alpha Updated', updatedAt: now + 1 }));
  await assertFails(update(ref(ownerDb, `families/${ALPHA}/meta`), { ownerUid: MEMBER, updatedAt: now + 2 }));

  // Activity actor and household identity are server-rules enforced; events are immutable.
  await assertSucceeds(set(ref(memberDb, `families/${ALPHA}/shared/activity/evt-valid`), activity('evt-valid', MEMBER)));
  await assertFails(set(ref(memberDb, `families/${ALPHA}/shared/activity/evt-forged-actor`), activity('evt-forged-actor', OWNER)));
  await assertFails(set(ref(memberDb, `families/${ALPHA}/shared/activity/evt-forged-household`), activity('evt-forged-household', MEMBER, { householdId: BETA })));
  await assertFails(update(ref(memberDb, `families/${ALPHA}/shared/activity/evt-valid`), { payload: { tampered: true } }));

  // Notifications can be created only as the current actor.
  await assertSucceeds(set(ref(memberDb, `families/${ALPHA}/shared/notifications/notif-valid`), notification('notif-valid', MEMBER)));
  await assertFails(set(ref(memberDb, `families/${ALPHA}/shared/notifications/notif-forged`), notification('notif-forged', OWNER)));
  await assertFails(set(ref(memberDb, `families/${ALPHA}/shared/notifications/notif-wrong-household`), notification('notif-wrong-household', MEMBER, { householdId: BETA })));

  // Existing notification content is immutable; each member controls only its own read/dismiss marker.
  await assertFails(update(ref(memberDb, `families/${ALPHA}/shared/notifications/notif-valid`), { title: 'Tampered' }));
  await assertSucceeds(set(ref(memberDb, `families/${ALPHA}/shared/notifications/notif-valid/readBy/${MEMBER}`), now + 2));
  await assertFails(set(ref(memberDb, `families/${ALPHA}/shared/notifications/notif-valid/readBy/${OWNER}`), now + 2));
  await assertSucceeds(set(ref(ownerDb, `families/${ALPHA}/shared/notifications/notif-valid/dismissedBy/${OWNER}`), now + 3));
  await assertFails(set(ref(ownerDb, `families/${ALPHA}/shared/notifications/notif-valid/dismissedBy/${MEMBER}`), now + 3));

  // Push tokens are self-write; owner/admin may inspect household tokens, normal members may not inspect another UID token.
  await assertSucceeds(set(ref(memberDb, `families/${ALPHA}/fcmTokens/${MEMBER}`), { token: 'member-token', name: 'Alpha Member' }));
  await assertFails(set(ref(memberDb, `families/${ALPHA}/fcmTokens/${OWNER}`), { token: 'forged-owner-token' }));
  await assertSucceeds(get(ref(ownerDb, `families/${ALPHA}/fcmTokens/${MEMBER}`)));
  await assertFails(get(ref(memberDb, `families/${ALPHA}/fcmTokens/${OWNER}`)));

  // Anonymous users get no family/private access, including metadata.
  await assertFails(get(ref(anonDb, `families/${ALPHA}/meta`)));
  await assertFails(get(ref(anonDb, `families/${ALPHA}/shared/tasks`)));
  await assertFails(get(ref(anonDb, `users/${MEMBER}/private/preferences`)));

  console.log('firebase-rules-phase18: PASS');
} finally {
  await env.cleanup();
}
