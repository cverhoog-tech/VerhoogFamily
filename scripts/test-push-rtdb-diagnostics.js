'use strict';
// ============================================================
// STEP 10 — RTDB failure diagnostics contract.
//
// Covers the real fault chain observed on commit 9cdf1987 (dpl_358szdK3x8):
// OAuth now succeeds (JWT signature fix) but /api/push-send failed with
// PUSH_DATABASE_READ_FAILED 401 because the service-account JWT scope was
// missing https://www.googleapis.com/auth/userinfo.email, which Firebase's
// Realtime Database REST auth requires alongside firebase.database.
//
// This test asserts two things the previous diagnostics could not tell us:
//  1. A 401 from RTDB is classified distinctly from a 403, so a future
//     failure can be triaged as "invalid auth" vs "insufficient permission"
//     vs some other database authorization issue, instead of a bare status
//     code.
//  2. Firebase's own (non-secret) error body text is surfaced in the thrown
//     error's `detail`, while the request URL — which embeds the OAuth
//     access token in its query string — is never included anywhere in the
//     error path.
// ============================================================
const assert=require('assert');
const crypto=require('crypto');
const Sender=require('../src/server/firebasePushSender.js');

function response(status,body){
  return{ok:status>=200&&status<300,status,headers:{get(){return null;}},async json(){return body;},async text(){return typeof body==='string'?body:JSON.stringify(body);}};
}

(async function(){
  const testKeys=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const config={projectId:'verhoog-family',clientEmail:'diag-test@test.invalid',privateKey:testKeys.privateKey,databaseUrl:'https://db.test',webApiKey:'PUBLIC'};

  // 1. A 401 (invalid/expired/insufficiently-scoped auth) must be classified
  //    as 'invalid-auth' and must surface Firebase's own error message.
  async function fetch401(url){
    return response(401,{error:'Invalid access token, unable to determine actor.'});
  }
  let caught401=null;
  try{
    await Sender.sendCanonicalNotification(
      {idToken:'ID_IRRELEVANT',householdId:'houseA',notificationId:'evt1'},
      {config,fetch:async(url,opts)=>{
        if(String(url).startsWith('https://identitytoolkit.googleapis.com/'))return response(200,{users:[{localId:'userA'}]});
        if(String(url)==='https://oauth2.googleapis.com/token')return response(200,{access_token:'SECRET_TOKEN_VALUE'});
        if(String(url).startsWith('https://db.test/'))return fetch401(url);
        throw new Error('unexpected fetch '+url);
      }}
    );
  }catch(error){caught401=error;}
  assert.ok(caught401,'a 401 RTDB response must reject sendCanonicalNotification');
  assert.strictEqual(caught401.code,'PUSH_DATABASE_READ_FAILED');
  assert.ok(/kind=invalid-auth/.test(caught401.detail),'401 must be classified as invalid-auth, detail was: '+caught401.detail);
  assert.ok(/http=401/.test(caught401.detail));
  assert.ok(/message=Invalid access token/.test(caught401.detail),'Firebase\'s own error message must be surfaced for triage');
  assert.ok(!/SECRET_TOKEN_VALUE/.test(caught401.detail),'error detail must never contain the OAuth access token');
  assert.ok(!/SECRET_TOKEN_VALUE/.test(caught401.message||''),'error message must never contain the OAuth access token');

  // 2. A 403 (Firebase Rules deny) must be classified distinctly from 401,
  //    so the two causes are not confused during triage.
  let caught403=null;
  try{
    await Sender.sendCanonicalNotification(
      {idToken:'ID_IRRELEVANT',householdId:'houseA',notificationId:'evt1'},
      {config,fetch:async(url)=>{
        if(String(url).startsWith('https://identitytoolkit.googleapis.com/'))return response(200,{users:[{localId:'userA'}]});
        if(String(url)==='https://oauth2.googleapis.com/token')return response(200,{access_token:'SECRET_TOKEN_VALUE'});
        if(String(url).startsWith('https://db.test/'))return response(403,{error:'Permission denied'});
        throw new Error('unexpected fetch '+url);
      }}
    );
  }catch(error){caught403=error;}
  assert.ok(caught403);
  assert.ok(/kind=insufficient-permission/.test(caught403.detail),'403 must be classified as insufficient-permission, detail was: '+caught403.detail);
  assert.ok(/message=Permission denied/.test(caught403.detail));
  assert.ok(!/SECRET_TOKEN_VALUE/.test(caught403.detail));

  // 3. serviceAssertion() must request the exact three scopes RTDB + FCM
  //    require, including the previously-missing userinfo.email.
  const jwt=Sender.serviceAssertion(config);
  const payload=JSON.parse(Buffer.from(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(jwt.split('.')[1].length/4)*4,'='),'base64').toString('utf8'));
  ['https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/firebase.database','https://www.googleapis.com/auth/firebase.messaging'].forEach(scope=>{
    assert.ok(payload.scope.split(' ').includes(scope),'missing required scope: '+scope);
  });

  console.log('STEP 10 RTDB failure diagnostics + required-scope contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
