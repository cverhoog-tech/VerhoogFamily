'use strict';

// Public client configuration only. The VAPID public key is intentionally safe
// to expose; private service-account / FCM sender credentials must never be
// returned from this endpoint or embedded in client code.
module.exports = async function handler(req,res){
  try{
    var vapidKey=String(process.env.FAMILYAPP_WEB_PUSH_VAPID_KEY||'').trim();
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.status(200).send(JSON.stringify({
      version:'1.0.0',
      provider:'fcm-web',
      configured:!!vapidKey,
      vapidKey:vapidKey,
      serviceWorkerPath:'/firebase-messaging-sw.js'
    }));
  }catch(error){
    res.status(500).send(JSON.stringify({configured:false,error:'PUSH_CONFIG_UNAVAILABLE'}));
  }
};
