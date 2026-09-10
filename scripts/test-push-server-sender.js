'use strict';
const assert=require('assert');
const crypto=require('crypto');
const Sender=require('../src/server/firebasePushSender.js');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function parts(path){return String(path||'').split('/').filter(Boolean);}
function getAt(root,path){let cur=root;for(const p of parts(path)){if(!cur||typeof cur!=='object'||!(p in cur))return null;cur=cur[p];}return clone(cur);}
function setAt(root,path,value){const ps=parts(path);let cur=root;for(let i=0;i<ps.length-1;i++){if(!cur[ps[i]]||typeof cur[ps[i]]!=='object')cur[ps[i]]={};cur=cur[ps[i]];}if(!ps.length)return;const leaf=ps[ps.length-1];if(value===null)delete cur[leaf];else cur[leaf]=clone(value);}
function mergeAt(root,path,patch){setAt(root,path,Object.assign({},getAt(root,path)||{},clone(patch)));}
function response(status,body,headers){return{ok:status>=200&&status<300,status,headers:{get(name){const map=headers||{};return map[name]||map[String(name).toLowerCase()]||null;}},async json(){return clone(body);},async text(){return JSON.stringify(body);}};}

(async function(){
  const {privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const config={projectId:'verhoog-family',clientEmail:'sender@test.invalid',privateKey,databaseUrl:'https://db.test',webApiKey:'PUBLIC'};
  const notificationId='evt_task%2Ehelp%2Erequested%3Atask42';
  const tree={
    families:{houseA:{
      members:{userA:{status:'active'},userB:{status:'active'},userC:{status:'active'}},
      shared:{notifications:{[notificationId]:{
        id:notificationId,eventKey:'task.help.requested:task42',type:'task.help.requested',title:'Hulp gevraagd',body:'Help even',
        actor:{uid:'userA',name:'Alice'},audience:{kind:'uids',uids:['userB']},channels:['inApp','push'],createdAt:1,readBy:{},dismissedBy:{}
      }}}
    }},
    users:{userB:{private:{pushDevices:{deviceB:{provider:'fcm',enabled:true,token:'TOKEN_B',platform:'web-ios'}}}}}
  };
  const versions={};let fcmCalls=0;let lastFcmBody=null;
  function etag(path){return '"v'+String(versions[path]||0)+'"';}
  function bump(path){versions[path]=(versions[path]||0)+1;}

  async function fetchMock(url,options){
    options=options||{};
    if(url==='https://oauth2.googleapis.com/token'){
      const body=String(options.body||'');assert.ok(body.includes('grant_type='));assert.ok(body.includes('assertion='));
      return response(200,{access_token:'SERVICE_ACCESS'});
    }
    if(String(url).startsWith('https://identitytoolkit.googleapis.com/')){
      const body=JSON.parse(options.body||'{}');
      const uid=body.idToken==='ID_A'?'userA':body.idToken==='ID_C'?'userC':null;
      return uid?response(200,{users:[{localId:uid}]}):response(400,{error:{message:'INVALID_ID_TOKEN'}});
    }
    if(String(url).startsWith('https://db.test/')){
      const parsed=new URL(url);let path=parsed.pathname.replace(/^\//,'').replace(/\.json$/,'').split('/').map(decodeURIComponent).join('/');
      const method=String(options.method||'GET').toUpperCase();
      if(method==='GET')return response(200,getAt(tree,path),{'etag':etag(path)});
      if(method==='PUT'){
        const expected=options.headers&&options.headers['if-match'];
        if(expected&&expected!==etag(path))return response(412,getAt(tree,path),{'etag':etag(path)});
        setAt(tree,path,JSON.parse(options.body||'null'));bump(path);return response(200,getAt(tree,path),{'etag':etag(path)});
      }
      if(method==='PATCH'){
        mergeAt(tree,path,JSON.parse(options.body||'{}'));bump(path);return response(200,getAt(tree,path),{'etag':etag(path)});
      }
      throw new Error('Unexpected RTDB method '+method);
    }
    if(String(url).startsWith('https://fcm.googleapis.com/v1/projects/verhoog-family/messages:send')){
      fcmCalls++;lastFcmBody=JSON.parse(options.body||'{}');
      assert.strictEqual(options.headers.Authorization,'Bearer SERVICE_ACCESS');
      return response(200,{name:'projects/verhoog-family/messages/msg1'});
    }
    throw new Error('Unexpected fetch '+url);
  }

  const first=await Sender.sendCanonicalNotification({idToken:'ID_A',householdId:'houseA',notificationId},{config,fetch:fetchMock});
  assert.strictEqual(first.sent,1);
  assert.strictEqual(first.failed,0);
  assert.strictEqual(first.recipientCount,1);
  assert.strictEqual(fcmCalls,1);
  assert.strictEqual(lastFcmBody.message.token,'TOKEN_B');
  assert.strictEqual(lastFcmBody.message.data.notificationId,notificationId);
  assert.strictEqual(lastFcmBody.message.data.eventKey,'task.help.requested:task42');
  assert.ok(!lastFcmBody.message.notification,'sender should use data-only FCM to keep inbox canonical');
  const receipt=getAt(tree,'users/userB/private/pushDelivery/'+notificationId+'/deviceB');
  assert.strictEqual(receipt.status,'sent');
  assert.strictEqual(receipt.provider,'fcm');
  assert.ok(!Object.prototype.hasOwnProperty.call(receipt,'token'),'delivery health must not copy the device token');
  assert.ok(!Object.prototype.hasOwnProperty.call(first,'token'),'sender response must not expose device tokens');

  // Retry the same canonical event: per-device sent receipt suppresses duplicate FCM.
  const second=await Sender.sendCanonicalNotification({idToken:'ID_A',householdId:'houseA',notificationId},{config,fetch:fetchMock});
  assert.strictEqual(second.sent,0);
  assert.strictEqual(second.skipped,1);
  assert.strictEqual(fcmCalls,1,'same canonical notification/device must not be pushed twice');

  // An active household member who is not the canonical event actor cannot use
  // the endpoint to replay another person's notification.
  await assert.rejects(()=>Sender.sendCanonicalNotification({idToken:'ID_C',householdId:'houseA',notificationId},{config,fetch:fetchMock}),error=>error&&error.code==='PUSH_CALLER_NOT_EVENT_ACTOR'&&error.status===403);

  // Audience is server-resolved from canonical data; userC has no delivery even
  // though caller input contains no recipient selector at all.
  assert.strictEqual(getAt(tree,'users/userC/private/pushDelivery/'+notificationId),null);

  const data=Sender.fcmData(getAt(tree,'families/houseA/shared/notifications/'+notificationId));
  assert.deepStrictEqual(Object.keys(data).sort(),['body','eventKey','notificationId','title','type','url'].sort());

  console.log('STEP 10 trusted push sender authorization/idempotency contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
