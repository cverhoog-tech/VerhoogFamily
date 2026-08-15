'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('src/modules/feed/feedSharedData.js','utf8');
let ctx={uid:'alpha-user',householdId:'alpha-household'},subs=[],unsubscribed=0,writes=[];
const listeners={};
const sandbox={console,Promise,setTimeout,clearTimeout,window:{feedData:[],addEventListener:(n,f)=>{listeners[n]=f;},dispatchEvent:()=>{},HouseholdContext:{requireUser:()=>ctx.uid,requireHousehold:()=>ctx.householdId,assertContext:()=>true,isCurrent:t=>!!t&&t.uid===ctx.uid&&t.householdId===ctx.householdId},FamilyDataStore:{makeId:p=>p+'_1',readShared:(c,f)=>Promise.resolve({}),writeSharedRecord:(c,id,v)=>{writes.push({c,id,v,ctx:{...ctx}});return Promise.resolve({ok:true});},writeSharedPath:(c,p,v)=>{writes.push({c,p,v,ctx:{...ctx}});return Promise.resolve({ok:true});},subscribeShared:(c,cb)=>{subs.push({c,cb,ctx:{...ctx}});return()=>{unsubscribed++;};}}},document:{readyState:'loading',addEventListener:()=>{},getElementById:()=>null},CustomEvent:function(){}};
sandbox.window.window=sandbox.window;sandbox.window.document=sandbox.document;sandbox.window.CustomEvent=sandbox.CustomEvent;
vm.createContext(sandbox);vm.runInContext(code,sandbox);
(async()=>{
 const store=sandbox.window.FeedSharedData;await store.start();assert.equal(subs.length,1);assert.equal(subs[0].c,'feed');
 subs[0].cb({p1:{id:'p1',authorUid:'alpha-user',text:'Alpha',createdAt:1,likes:{},comments:{}}});assert.equal(sandbox.window.feedData[0].text,'Alpha');
 const stale=subs[0].cb;ctx={uid:'beta-user',householdId:'beta-household'};await listeners['familyapp:household-context-changed']();assert.ok(unsubscribed>=1);assert.equal(subs.length,2);assert.equal(sandbox.window.feedData.length,0);
 stale({p2:{id:'p2',authorUid:'alpha-user',text:'STALE',createdAt:2}});assert.equal(sandbox.window.feedData.length,0,'stale Alpha feed leaked into Beta');
 subs[1].cb({p3:{id:'p3',authorUid:'beta-user',text:'Beta',createdAt:3,likes:{},comments:{}}});assert.equal(sandbox.window.feedData[0].text,'Beta');
 const created=await store.createPost({text:'Hallo Beta'});assert.equal(created.householdId,'beta-household');assert.equal(created.authorUid,'beta-user');
 await store.toggleReaction('p3');assert.ok(writes.some(w=>w.c==='feed'&&Array.isArray(w.p)&&w.p.join('/')==='p3/likes/beta-user'));
 await store.addComment('p3',{text:'Reactie'});assert.ok(writes.some(w=>w.c==='feed'&&Array.isArray(w.p)&&w.p[0]==='p3'&&w.p[1]==='comments'&&w.v.authorUid==='beta-user'));
 console.log('feed context rebind OK');
})().catch(e=>{console.error(e);process.exit(1);});
