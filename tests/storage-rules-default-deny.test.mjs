import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { ref, uploadString, getBytes } from 'firebase/storage';

const projectId = 'demo-familyapp-phase18-storage';
const rules = readFileSync('storage.rules', 'utf8');
const env = await initializeTestEnvironment({ projectId, storage: { rules } });

try {
  const userStorage = env.authenticatedContext('member-a').storage();
  const anonStorage = env.unauthenticatedContext().storage();

  await assertFails(uploadString(ref(userStorage, 'families/household-a/avatars/member-a/avatar.jpg'), 'blocked'));
  await assertFails(uploadString(ref(userStorage, 'families/household-a/receipts/receipt.jpg'), 'blocked'));
  await assertFails(uploadString(ref(anonStorage, 'public/test.txt'), 'blocked'));
  await assertFails(getBytes(ref(userStorage, 'families/household-a/avatars/member-a/avatar.jpg')));

  console.log('storage-rules-default-deny: PASS');
} finally {
  await env.cleanup();
}
