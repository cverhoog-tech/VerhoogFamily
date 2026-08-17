import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { get, ref, set, update } from 'firebase/database';

const projectId='demo-familyapp-invite-lifecycle';
const rules=readFileSync('database.rules.json','utf8');
const env=await initializeTestEnvironment({projectId,database:{rules}});
const now=Date.now();
const ALPHA='household-alpha', BETA='household-beta';
const OWNER='alpha-owner', JOINER='joiner-user', OTHER='other-user', BETA_OWNER='beta-owner';
const ACTIVE='ABCD-EFGH', EXPIRED='EXPR-0001', REVOKE='RVOK-0001', USED='USED-0001';

function member(uid,name,role='adult',status='active'){return{uid,name,role,status,joinedAt:now};}
function invite(code,overrides={}){return{code,householdId:ALPHA,createdBy:OWNER,role:'adult',status:'active',createdAt:now-1000,expiresAt:now+60000,maxUses:1,uses:0,...overrides};}

try{
  await env.withSecurityRulesDisabled(async(ctx)=>{
    await set(ref(ctx.database()),{
      users:{
        [OWNER]:{name:'Alpha Owner',familyId:ALPHA,activeHouseholdId:ALPHA},
        [JOINER]:{name:'Joiner'},
        [OTHER]:{name:'Other'},
        [BETA_OWNER]:{name:'Beta Owner',familyId:BETA,activeHouseholdId:BETA}
      },
      families:{
        [ALPHA]:{
          meta:{id:ALPHA,name:'Alpha',ownerUid:OWNER,version:1,createdAt:now,updatedAt:now},
          members:{[OWNER]:member(OWNER,'Alpha Owner','owner')}
        },
        [BETA]:{
          meta:{id:BETA,name:'Beta',ownerUid:BETA_OWNER,version:1,createdAt:now,updatedAt:now},
          members:{[BETA_OWNER]:member(BETA_OWNER,'Beta Owner','owner')}
        }
      },
      invites:{
        [ACTIVE]:invite(ACTIVE),
        [EXPIRED]:invite(EXPIRED,{expiresAt:now-1}),
        [REVOKE]:invite(REVOKE),
        [USED]:invite(USED,{status:'used',uses:1,usedBy:OTHER,usedAt:now-100})
      }
    });
  });

  const ownerDb=env.authenticatedContext(OWNER).database();
  const joinerDb=env.authenticatedContext(JOINER).database();
  const otherDb=env.authenticatedContext(OTHER).database();

  // Invite records are individually readable to signed-in users, but the top-level list is not.
  await assertSucceeds(get(ref(joinerDb,`invites/${ACTIVE}`)));
  await assertFails(get(ref(joinerDb,'invites')));

  // A valid active invite can only be consumed by the authenticated user named in usedBy.
  const active=invite(ACTIVE);
  const consumed={...active,status:'used',uses:1,usedBy:JOINER,usedAt:now};
  await assertSucceeds(set(ref(joinerDb,`invites/${ACTIVE}`),consumed));

  // Another account cannot reuse or steal a consumed code.
  await assertFails(set(ref(otherDb,`invites/${ACTIVE}`),{...consumed,usedBy:OTHER,usedAt:now+1}));

  // Expired codes cannot be consumed, regardless of otherwise-valid shape.
  const expired=invite(EXPIRED,{expiresAt:now-1});
  await assertFails(set(ref(joinerDb,`invites/${EXPIRED}`),{...expired,status:'used',uses:1,usedBy:JOINER,usedAt:now}));

  // Household owner/admin must be able to revoke an unused active invite.
  const revokeBase=invite(REVOKE);
  await assertSucceeds(set(ref(ownerDb,`invites/${REVOKE}`),{...revokeBase,status:'revoked'}));
  await assertFails(set(ref(joinerDb,`invites/${REVOKE}`),{...revokeBase,status:'used',uses:1,usedBy:JOINER,usedAt:now}));

  // A used invite belonging to another account cannot be resumed by this joiner.
  const used=invite(USED,{status:'used',uses:1,usedBy:OTHER,usedAt:now-100});
  await assertFails(set(ref(joinerDb,`invites/${USED}`),{...used,usedBy:JOINER,usedAt:now}));

  // Claim must match invite household + usedBy + used status.
  const claim={code:ACTIVE,householdId:ALPHA,uid:JOINER,role:'adult',status:'approved',createdAt:now,expiresAt:now+300000};
  await assertSucceeds(set(ref(joinerDb,`joinClaims/${ALPHA}/${JOINER}`),claim));
  await assertFails(set(ref(joinerDb,`joinClaims/${BETA}/${JOINER}`),{...claim,householdId:BETA}));

  // With the valid Alpha claim, membership can only be created inside Alpha.
  await assertSucceeds(set(ref(joinerDb,`families/${ALPHA}/members/${JOINER}`),member(JOINER,'Joiner')));
  await assertFails(set(ref(joinerDb,`families/${BETA}/members/${JOINER}`),member(JOINER,'Joiner')));

  // Once active in Alpha, the user pointer may target Alpha but never Beta.
  await assertSucceeds(update(ref(joinerDb,`users/${JOINER}`),{familyId:ALPHA,activeHouseholdId:ALPHA}));
  await assertFails(update(ref(joinerDb,`users/${JOINER}`),{familyId:BETA,activeHouseholdId:BETA}));

  console.log('database-rules-invite-lifecycle: PASS');
} finally { await env.cleanup(); }
