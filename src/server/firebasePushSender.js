'use strict';
// ============================================================
// FIREBASE PUSH SENDER v1.0.0 — STEP 10 server-only delivery service
//
// Canonical notification state stays in RTDB. This service accepts only a
// canonical householdId + notificationId, verifies the Firebase caller, reads
// recipients/server-side device registrations, then sends data-only FCM.
// No service credential or device token is returned to the browser.
// ============================================================
const crypto=require('crypto');

const VERSION='1.0.0';
const DEFAULT_DB='https://verhoog-family-default-rtdb.europe-west1.firebasedatabase.app';
const DEFAULT_PROJECT='verhoog-family';
const DEFAULT_WEB_API_KEY='AIzaSyA4vXaF85pfv2Cxy5VG-KJXxsOG14UeN1s'; // public Firebase web config
const TOKEN_AUD='https://oauth2.googleapis.com/token';
const SCOPES='https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/firebase.messaging';

function envConfig(env){
  env=env||process.env;
  return{
    projectId:String(env.FAMILYAPP_FIREBASE_SERVICE_PROJECT_ID||DEFAULT_PROJECT).trim(),
    clientEmail:String(env.FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL||'').trim(),
    privateKey:String(env.FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY||'').replace(/\\n/g,'\n').trim(),
    databaseUrl:String(env.FAMILYAPP_FIREBASE_DATABASE_URL||DEFAULT_DB).replace(/\/$/,'').trim(),
    webApiKey:String(env.FAMILYAPP_FIREBASE_WEB_API_KEY||DEFAULT_WEB_API_KEY).trim()
  };
}
function requireConfig(config){
  if(!config.projectId)throw coded('PUSH_SERVER_PROJECT_ID_MISSING',500);
  if(!config.clientEmail)throw coded('PUSH_SERVER_CLIENT_EMAIL_MISSING',503);
  if(!config.privateKey)throw coded('PUSH_SERVER_PRIVATE_KEY_MISSING',503);
  if(!config.databaseUrl)throw coded('PUSH_SERVER_DATABASE_URL_MISSING',500);
  if(!config.webApiKey)throw coded('PUSH_SERVER_WEB_API_KEY_MISSING',500);
  return config;
}
function coded(code,status,detail){var e=new Error(code);e.code=code;e.status=status||500;if(detail)e.detail=detail;return e;}
function b64url(value){return Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}
function serviceAssertion(config,nowSeconds){
  const iat=Number(nowSeconds)||Math.floor(Date.now()/1000);
  const header={alg:'RS256',typ:'JWT'};
  const claims={iss:config.clientEmail,sub:config.clientEmail,aud:TOKEN_AUD,scope:SCOPES,iat,exp:iat+3600};
  const unsigned=b64url(header)+'.'+b64url(claims);
  const signer=crypto.createSign('RSA-SHA256');signer.update(unsigned);signer.end();
  return unsigned+'.'+b64url(signer.sign(config.privateKey));
}
async function jsonFetch(fetchImpl,url,options){
  const response=await fetchImpl(url,options||{});
  let body=null;try{body=await response.json();}catch(e){try{body=await response.text();}catch(_){} }
  return{ok:response.ok,status:response.status,headers:response.headers,body};
}
async function serviceAccessToken(config,fetchImpl){
  const assertion=serviceAssertion(config);
  const result=await jsonFetch(fetchImpl,TOKEN_AUD,{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}).toString()
  });
  if(!result.ok||!result.body||!result.body.access_token)throw coded('PUSH_SERVER_OAUTH_FAILED',502,String(result.status));
  return String(result.body.access_token);
}
async function verifyFirebaseUser(idToken,config,fetchImpl){
  if(!idToken)throw coded('PUSH_AUTH_REQUIRED',401);
  const result=await jsonFetch(fetchImpl,'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(config.webApiKey),{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:String(idToken)})
  });
  const user=result.body&&Array.isArray(result.body.users)&&result.body.users[0];
  if(!result.ok||!user||!user.localId)throw coded('PUSH_AUTH_INVALID',401);
  return{uid:String(user.localId),email:user.email?String(user.email):null};
}
function segment(v){return encodeURIComponent(String(v));}
function rtdbUrl(config,path,accessToken){return config.databaseUrl+'/'+String(path).split('/').filter(Boolean).map(segment).join('/')+'.json?access_token='+encodeURIComponent(accessToken);}
async function rtdbGet(config,path,token,fetchImpl,etag){
  const headers={};if(etag)headers['X-Firebase-ETag']='true';
  const result=await jsonFetch(fetchImpl,rtdbUrl(config,path,token),{method:'GET',headers});
  if(!result.ok)throw coded('PUSH_DATABASE_READ_FAILED',502,String(result.status));
  return{value:result.body,etag:result.headers&&typeof result.headers.get==='function'?result.headers.get('etag'):null};
}
async function rtdbPutIfMatch(config,path,value,token,fetchImpl,etag){
  const result=await jsonFetch(fetchImpl,rtdbUrl(config,path,token),{
    method:'PUT',headers:{'Content-Type':'application/json','if-match':etag||'null_etag'},body:JSON.stringify(value)
  });
  if(result.status===412)return{committed:false,value:result.body};
  if(!result.ok)throw coded('PUSH_DATABASE_LOCK_FAILED',502,String(result.status));
  return{committed:true,value:result.body};
}
async function rtdbPatch(config,path,value,token,fetchImpl){
  const result=await jsonFetch(fetchImpl,rtdbUrl(config,path,token),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
  if(!result.ok)throw coded('PUSH_DATABASE_WRITE_FAILED',502,String(result.status));
  return result.body;
}
function activeMember(row){return !!(row&&row.status!=='inactive'&&row.status!=='removed');}
function activeMemberUids(members){return Object.keys(members||{}).filter(uid=>activeMember(members[uid]));}
function resolveRecipients(event,members){
  const active=new Set(activeMemberUids(members));
  const actor=event&&event.actor&&event.actor.uid?String(event.actor.uid):null;
  const audience=event&&event.audience||{kind:'household'};
  let ids=[];
  if(audience.kind==='uids'&&Array.isArray(audience.uids))ids=audience.uids.map(String);
  else if(audience.kind==='household')ids=Array.from(active);
  return Array.from(new Set(ids.filter(uid=>active.has(uid)&&uid!==actor)));
}
function enabledDevices(value){return Object.keys(value||{}).map(id=>Object.assign({deviceId:id},value[id]||{})).filter(row=>row.enabled!==false&&row.provider==='fcm'&&row.token);}
function safeText(v,max){return String(v==null?'':v).slice(0,max||220);}
function fcmData(event){return{
  notificationId:safeText(event.id,220),
  eventKey:safeText(event.eventKey,220),
  type:safeText(event.type,100),
  title:safeText(event.title||'FamilyApp',160),
  body:safeText(event.body||'Je hebt een nieuwe melding.',240),
  url:'/?screen=notif'
};}
async function fcmSend(config,accessToken,device,event,fetchImpl){
  const url='https://fcm.googleapis.com/v1/projects/'+encodeURIComponent(config.projectId)+'/messages:send';
  return jsonFetch(fetchImpl,url,{
    method:'POST',
    headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},
    body:JSON.stringify({message:{token:String(device.token),data:fcmData(event),webpush:{headers:{Urgency:'high'}}}})
  });
}
function fcmErrorCode(result){
  const body=result&&result.body;const text=JSON.stringify(body||{});
  if(/UNREGISTERED/i.test(text)||result&&result.status===404)return'UNREGISTERED';
  if(/SENDER_ID_MISMATCH/i.test(text))return'SENDER_ID_MISMATCH';
  if(/QUOTA_EXCEEDED/i.test(text)||result&&result.status===429)return'QUOTA_EXCEEDED';
  if(result&&result.status>=500)return'FCM_TEMPORARY';
  return'FCM_SEND_FAILED';
}
function receiptPath(uid,notificationId,deviceId){return'users/'+uid+'/private/pushDelivery/'+notificationId+'/'+deviceId;}
async function claimDelivery(config,accessToken,uid,event,device,fetchImpl,attemptId){
  const path=receiptPath(uid,event.id,device.deviceId);
  const existing=await rtdbGet(config,path,accessToken,fetchImpl,true);
  if(existing.value&&existing.value.status==='sent')return{claimed:false,reason:'already-sent'};
  const lock={schemaVersion:1,status:'sending',eventKey:event.eventKey||'',attemptId,attemptedAt:Date.now(),updatedAt:Date.now()};
  const put=await rtdbPutIfMatch(config,path,lock,accessToken,fetchImpl,existing.etag);
  return put.committed?{claimed:true,path}:{claimed:false,reason:'race'};
}
async function deliverDevice(config,accessToken,uid,event,device,fetchImpl){
  const attemptId=crypto.randomUUID?crypto.randomUUID():crypto.randomBytes(16).toString('hex');
  const claim=await claimDelivery(config,accessToken,uid,event,device,fetchImpl,attemptId);
  if(!claim.claimed)return{status:'skipped',reason:claim.reason,uid,deviceId:device.deviceId};
  const result=await fcmSend(config,accessToken,device,event,fetchImpl);
  if(result.ok){
    await rtdbPatch(config,claim.path,{status:'sent',sentAt:Date.now(),updatedAt:Date.now(),provider:'fcm',errorCode:null},accessToken,fetchImpl);
    return{status:'sent',uid,deviceId:device.deviceId};
  }
  const code=fcmErrorCode(result);
  await rtdbPatch(config,claim.path,{status:'failed',failedAt:Date.now(),updatedAt:Date.now(),provider:'fcm',errorCode:code,httpStatus:result.status},accessToken,fetchImpl);
  if(code==='UNREGISTERED'){
    await rtdbPatch(config,'users/'+uid+'/private/pushDevices/'+device.deviceId,{enabled:false,disabledAt:Date.now(),disabledReason:'fcm-unregistered',updatedAt:Date.now()},accessToken,fetchImpl).catch(()=>{});
  }
  return{status:'failed',reason:code,uid,deviceId:device.deviceId};
}
async function sendCanonicalNotification(input,deps){
  deps=deps||{};const fetchImpl=deps.fetch||global.fetch;const config=requireConfig(deps.config||envConfig(deps.env));
  if(typeof fetchImpl!=='function')throw coded('PUSH_SERVER_FETCH_UNAVAILABLE',500);
  const householdId=safeId(input&&input.householdId,'householdId');
  const notificationId=safeId(input&&input.notificationId,'notificationId');
  const caller=await verifyFirebaseUser(input&&input.idToken,config,fetchImpl);
  const accessToken=await serviceAccessToken(config,fetchImpl);
  const members=(await rtdbGet(config,'families/'+householdId+'/members',accessToken,fetchImpl)).value||{};
  if(!activeMember(members[caller.uid]))throw coded('PUSH_CALLER_NOT_HOUSEHOLD_MEMBER',403);
  const event=(await rtdbGet(config,'families/'+householdId+'/shared/notifications/'+notificationId,accessToken,fetchImpl)).value;
  if(!event)throw coded('PUSH_NOTIFICATION_NOT_FOUND',404);
  event.id=String(event.id||notificationId);
  if(event.id!==notificationId)throw coded('PUSH_NOTIFICATION_ID_MISMATCH',409);
  const actorUid=event.actor&&event.actor.uid?String(event.actor.uid):null;
  if(!actorUid||actorUid!==caller.uid)throw coded('PUSH_CALLER_NOT_EVENT_ACTOR',403);
  const recipients=resolveRecipients(event,members);
  const results=[];
  for(const uid of recipients){
    const devices=(await rtdbGet(config,'users/'+uid+'/private/pushDevices',accessToken,fetchImpl)).value||{};
    for(const device of enabledDevices(devices))results.push(await deliverDevice(config,accessToken,uid,event,device,fetchImpl));
  }
  return{
    version:VERSION,notificationId,eventKey:String(event.eventKey||''),recipientCount:recipients.length,
    sent:results.filter(x=>x.status==='sent').length,
    failed:results.filter(x=>x.status==='failed').length,
    skipped:results.filter(x=>x.status==='skipped').length,
    results:results.map(x=>({status:x.status,reason:x.reason||null,uid:x.uid,deviceId:x.deviceId}))
  };
}
function safeId(value,label){const s=String(value||'').trim();if(!s||s.length>500||!/^[A-Za-z0-9_.:%-]+$/.test(s))throw coded('PUSH_'+String(label||'id').toUpperCase()+'_INVALID',400);return s;}

module.exports={VERSION,envConfig,requireConfig,verifyFirebaseUser,serviceAssertion,serviceAccessToken,resolveRecipients,enabledDevices,fcmData,fcmErrorCode,sendCanonicalNotification};
