'use strict';
const assert=require('assert');
const handler=require('../api/push-config.js');

function invoke(){
  let statusCode=200,body='',headers={};
  const res={
    setHeader(k,v){headers[String(k).toLowerCase()]=String(v);},
    status(code){statusCode=code;return this;},
    send(value){body=String(value);return this;}
  };
  return Promise.resolve(handler({},res)).then(()=>({statusCode,headers,body,json:JSON.parse(body)}));
}

(async function(){
  const names=['FAMILYAPP_WEB_PUSH_VAPID_KEY','FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL','FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY'];
  const previous={};names.forEach(name=>{previous[name]=process.env[name];delete process.env[name];});
  try{
    let r=await invoke();
    assert.strictEqual(r.statusCode,200);
    assert.strictEqual(r.json.version,'1.1.0');
    assert.strictEqual(r.json.configured,false);
    assert.strictEqual(r.json.vapidConfigured,false);
    assert.strictEqual(r.json.senderConfigured,false);
    assert.strictEqual(r.json.vapidKey,'');

    process.env.FAMILYAPP_WEB_PUSH_VAPID_KEY='PUBLIC_VAPID_TEST';
    r=await invoke();
    assert.strictEqual(r.json.configured,false,'VAPID alone is not end-to-end ready');
    assert.strictEqual(r.json.vapidConfigured,true);
    assert.strictEqual(r.json.senderConfigured,false);
    assert.strictEqual(r.json.vapidKey,'PUBLIC_VAPID_TEST');

    process.env.FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL='sender@example.test';
    process.env.FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nSECRET_TEST_VALUE\n-----END PRIVATE KEY-----';
    r=await invoke();
    assert.strictEqual(r.json.configured,true);
    assert.strictEqual(r.json.vapidConfigured,true);
    assert.strictEqual(r.json.senderConfigured,true);
    assert.strictEqual(r.json.vapidKey,'PUBLIC_VAPID_TEST');
    assert.ok(!r.body.includes('sender@example.test'),'public readiness endpoint may not expose sender email');
    assert.ok(!r.body.includes('SECRET_TEST_VALUE'),'public readiness endpoint may not expose private key');
    assert.strictEqual(r.json.serviceWorkerPath,'/firebase-messaging-sw.js');

    console.log('STEP 10 public push readiness config contract: PASS');
  }finally{
    names.forEach(name=>{if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];});
  }
})().catch(error=>{console.error(error);process.exit(1);});