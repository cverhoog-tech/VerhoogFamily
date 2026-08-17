import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { get, ref, set, update } from 'firebase/database';

const projectId = 'demo-familyapp-household-isolation';
const rules = readFileSync('database.rules.json', 'utf8');

const env = await initializeTestEnvironment({
  projectId,
  database: { rules }
});

const ALPHA = 'household-alpha';
const BETA = 'household-beta';
const OWNER = 'alpha-owner';
const MEMBER = 'alpha-member';
const BETA_USER = 'beta-user';
const now = Date.now();

function member(uid, name, role = 'adult', status = 'active') {
  return { uid, name, role, status, joinedAt: now };
}

try {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await set(ref(db), {
      users: {
        [OWNER]: { name: 'Alpha Owner', familyId: ALPHA, activeHouseholdId: ALPHA },
        [MEMBER]: { name: 'Alpha Member', familyId: ALPHA, activeHouseholdId: ALPHA },
        [BETA_USER]: { name: 'Beta User', familyId: BETA, activeHouseholdId: BETA }
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
          shared: { tasks: { task1: { title: 'Alpha task' } } }
        },
        [BETA]: {
          meta: { id: BETA, name: 'Beta', ownerUid: BETA_USER, version: 1, createdAt: now, updatedAt: now },
          members: { [BETA_USER]: member(BETA_USER, 'Beta User', 'owner') },
          shared: { tasks: { task1: { title: 'Beta task' } } }
        }
      }
    });
  });

  const memberDb = env.authenticatedContext(MEMBER).database();
  const ownerDb = env.authenticatedContext(OWNER).database();

  // Active member: own household reads/writes are allowed.
  await assertSucceeds(get(ref(memberDb, `families/${ALPHA}/shared/tasks`)));
  await assertSucceeds(set(ref(memberDb, `families/${ALPHA}/shared/tasks/member-created`), { title: 'Allowed while active' }));
  await assertSucceeds(update(ref(memberDb, `families/${ALPHA}/presence/${MEMBER}`), { online: true, lastSeen: now + 1, name: 'Alpha Member' }));

  // Cross-household isolation is denied even while the member is active elsewhere.
  await assertFails(get(ref(memberDb, `families/${BETA}/shared/tasks`)));
  await assertFails(set(ref(memberDb, `families/${BETA}/shared/tasks/intrusion`), { title: 'Nope' }));

  // Household owner removes the member using the real rules.
  await assertSucceeds(update(ref(ownerDb, `families/${ALPHA}/members/${MEMBER}`), { status: 'removed' }));

  // The exact same authenticated UID must lose family access immediately.
  await assertFails(get(ref(memberDb, `families/${ALPHA}/shared/tasks`)));
  await assertFails(get(ref(memberDb, `families/${ALPHA}/members`)));
  await assertFails(set(ref(memberDb, `families/${ALPHA}/shared/tasks/after-removal`), { title: 'Must be denied' }));
  await assertFails(update(ref(memberDb, `families/${ALPHA}/presence/${MEMBER}`), { online: true, lastSeen: now + 2, name: 'Alpha Member' }));

  // A removed user is still allowed to clean its own stale pointer...
  await assertSucceeds(update(ref(memberDb, `users/${MEMBER}`), { activeHouseholdId: null, familyId: null }));
  // ...but cannot point itself back at the household without an active membership.
  await assertFails(update(ref(memberDb, `users/${MEMBER}`), { activeHouseholdId: ALPHA, familyId: ALPHA }));

  console.log('database-rules-removed-member: PASS');
} finally {
  await env.cleanup();
}
