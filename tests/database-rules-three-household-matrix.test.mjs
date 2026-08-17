import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { get, ref, set } from 'firebase/database';

const projectId='demo-familyapp-three-household-matrix';
const rules=readFileSync('database.rules.json','utf8');
const env=await initializeTestEnvironment({projectId,database:{rules}});

const now=Date.now();
const households=[
  {id:'household-alpha',uid:'alpha-user',name:'Alpha'},
  {id:'household-beta',uid:'beta-user',name:'Beta'},
  {id:'household-gamma',uid:'gamma-user',name:'Gamma'}
];
const canonical=['tasks','partyQuests','shoppingLists','recipes','mealPlans','calendar','finance','feed','achievements','notes'];

function member(uid,name,role='owner'){return{uid,name,role,status:'active',joinedAt:now};}
function meta(h){return{id:h.id,name:h.name,ownerUid:h.uid,version:1,createdAt:now,updatedAt:now};}

try{
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.database();
    const root={users:{},families:{}};
    for(const h of households){
      root.users[h.uid]={name:h.name,familyId:h.id,activeHouseholdId:h.id,private:{preferences:{theme:h.name}}};
      root.families[h.id]={meta:meta(h),members:{[h.uid]:member(h.uid,h.name)},presence:{[h.uid]:{online:true,lastSeen:now,name:h.name}},shared:{}};
      for(const collection of canonical){
        root.families[h.id].shared[collection]={seed:{owner:h.id,collection}};
      }
      root.families[h.id].shared.activity={evt_seed:{id:'evt_seed',schemaVersion:2,type:'task.created',householdId:h.id,actorUid:h.uid,entityType:'task',entityId:'seed',occurredAt:now,createdAt:now,visibility:'household'}};
      root.families[h.id].shared.notifications={note_seed:{id:'note_seed',type:'system.message',title:h.name,householdId:h.id,actor:{uid:h.uid},createdAt:now,readBy:{},dismissedBy:{}}};
    }
    await set(ref(db),root);
  });

  for(const current of households){
    const db=env.authenticatedContext(current.uid).database();

    await assertSucceeds(get(ref(db,`families/${current.id}/members`)));
    await assertSucceeds(get(ref(db,`families/${current.id}/presence`)));
    await assertSucceeds(get(ref(db,`users/${current.uid}/private/preferences`)));
    await assertSucceeds(get(ref(db,`families/${current.id}/shared/activity`)));
    await assertSucceeds(get(ref(db,`families/${current.id}/shared/notifications`)));

    for(const collection of canonical){
      await assertSucceeds(get(ref(db,`families/${current.id}/shared/${collection}`)));
      await assertSucceeds(set(ref(db,`families/${current.id}/shared/${collection}/write-${current.uid}`),{owner:current.uid}));
    }

    for(const other of households.filter(h=>h.id!==current.id)){
      await assertFails(get(ref(db,`families/${other.id}/members`)));
      await assertFails(get(ref(db,`families/${other.id}/presence`)));
      await assertFails(get(ref(db,`families/${other.id}/shared/activity`)));
      await assertFails(get(ref(db,`families/${other.id}/shared/notifications`)));
      await assertFails(get(ref(db,`users/${other.uid}/private/preferences`)));
      for(const collection of canonical){
        await assertFails(get(ref(db,`families/${other.id}/shared/${collection}`)));
        await assertFails(set(ref(db,`families/${other.id}/shared/${collection}/intrusion-${current.uid}`),{owner:current.uid}));
      }
    }

    await assertFails(get(ref(db,`families/${current.id}`)));
    await assertFails(get(ref(db,`families/${current.id}/shared/unknownCollection`)));
  }

  console.log('database-rules-three-household-matrix: PASS');
} finally {
  await env.cleanup();
}
