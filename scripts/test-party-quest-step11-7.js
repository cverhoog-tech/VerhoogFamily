'use strict';
const fs=require('fs');
const assert=require('assert');
const crypto=require('crypto');

function read(path){return fs.readFileSync(path,'utf8');}
function gitBlobSha(source){
  return crypto.createHash('sha1').update(Buffer.concat([
    Buffer.from('blob '+Buffer.byteLength(source)+'\0'),
    Buffer.from(source)
  ])).digest('hex');
}

const runtimeEntrypoints={
  'index.html':read('index.html'),
  'api/app.js':read('api/app.js')
};

const canonicalPaths=[
  'src/modules/tasks/partyQuestRepository.js',
  'src/modules/tasks/partyQuestService.js',
  'src/modules/tasks/partyQuestInvites.js',
  'src/modules/tasks/partyQuestActiveView.js',
  'src/modules/tasks/partyQuestHelpUi.js',
  'src/modules/tasks/partyQuestNotificationProjector.js',
  'src/modules/tasks/partyQuestCompletionReward.js'
];
const canonical=Object.fromEntries(canonicalPaths.map(path=>[path,read(path)]));
const invites=canonical['src/modules/tasks/partyQuestInvites.js'];
const actions=read('src/core/notificationActions.js');

// STEP 11.7 is a quarantine/compatibility boundary, not a migration.
// The old prototype may remain on disk for historical reference, but no served
// runtime entrypoint may reactivate any of its name/localStorage/XP authorities.
const legacyRuntimeFiles=[
  'groupQuests.js',
  'groupQuestEditor.js',
  'groupQuestPremium.js'
];
for(const [entry,source] of Object.entries(runtimeEntrypoints)){
  for(const legacyFile of legacyRuntimeFiles){
    assert.ok(!source.includes(legacyFile),entry+' must not serve dormant legacy Party Quest file '+legacyFile);
  }
}

// Canonical Party Quest modules must never read, write, import or interpret the
// old prototype's local/name identity state. This also forbids silent migration
// from ambiguous display names into canonical Firebase/Auth UIDs.
const forbiddenLegacyTokens=[
  'fam_group_quests_v001',
  'fam_group_members_v001',
  'fam_active_member_id',
  'GroupQuests',
  'GroupQuestEditor',
  'GroupQuestPremium',
  'ProgressionGrid.awardXP'
];
for(const [path,source] of Object.entries(canonical)){
  for(const token of forbiddenLegacyTokens){
    assert.ok(!source.includes(token),path+' must not depend on legacy Party Quest authority: '+token);
  }
  assert.ok(!/\bawardXP\s*\(/.test(source),path+' must not call legacy awardXP directly');
  assert.ok(!source.includes('localStorage'),path+' must not use localStorage as Party Quest authority');
}

// Identity/persistence authority remains the v2 HouseholdContext + repository /
// service boundary. Presentation modules may render names, but cannot use known
// prototype member names as identity keys.
assert.ok(canonical['src/modules/tasks/partyQuestRepository.js'].includes('HouseholdContext'),'repository must stay HouseholdContext scoped');
assert.ok(canonical['src/modules/tasks/partyQuestService.js'].includes('HouseholdContext'),'service must stay HouseholdContext scoped');
assert.ok(invites.includes('HouseholdContext'),'invite facade must stay HouseholdContext scoped');
for(const [path,source] of Object.entries(canonical)){
  ['shane','esra'].forEach(name=>{
    assert.ok(!source.toLowerCase().includes(name),path+' must not hardcode legacy member identity '+name);
  });
}

// Frozen NotificationActions still consumes this small facade. Preserve it
// while all mutations continue to delegate to PartyQuestService.
assert.ok(invites.includes('getById:getById'),'PartyQuestInvites compatibility facade must preserve getById');
assert.ok(invites.includes('revokeInvite:revokeInvite'),'PartyQuestInvites compatibility facade must preserve revokeInvite');
assert.ok(invites.includes('respond:respond'),'PartyQuestInvites compatibility facade must preserve respond');
assert.ok(/function\s+respond\([^)]*\)[\s\S]*?\.respond\(/.test(invites),'respond facade must delegate to PartyQuestService.respond');
assert.ok(/function\s+revokeInvite\([^)]*\)[\s\S]*?\.revokeInvite\(/.test(invites),'revoke facade must delegate to PartyQuestService.revokeInvite');

// STEP 11 must not reopen the accepted STEP 10 action layer while establishing
// compatibility guards.
assert.strictEqual(
  gitBlobSha(actions),
  '60a48daa628bc56531395d188a0811711d82a328',
  'frozen NotificationActions blob must remain exact'
);

// The active current task UX module is deliberately NOT quarantined: duoQuests
// is served and remains separate from the dormant groupQuests prototype.
assert.ok(runtimeEntrypoints['index.html'].includes('duoQuests.js')||runtimeEntrypoints['api/app.js'].includes('duoQuests.js'),'current duoQuests task UX must remain served');

console.log('party quest STEP 11.7 legacy compatibility guard: PASS');
