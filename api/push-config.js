'use strict';

// Public readiness configuration only. VAPID is a public Web Push key and is
// intentionally returned to the browser. Sender credentials are NEVER returned;
// only booleans indicate whether the protected server environment is complete.
module.exports = async function handler(req,res){
  try{
    var vapidKey=String(process.env.FAMILYAPP_WEB_PUSH_VAPID_KEY||'').trim();
    var senderEmail=String(process.env.FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL||'').trim();
    var senderPrivateKey=String(process.env.FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY||'').trim();
    var vapidConfigured=!!vapidKey;
    var senderConfigured=!!(senderEmail&&senderPrivateKey);
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.status(200).send(JSON.stringify({
      version:'1.1.0',
      provider:'fcm-web',
      configured:vapidConfigured&&senderConfigured,
      vapidConfigured:vapidConfigured,
      senderConfigured:senderConfigured,
      vapidKey:vapidKey,
      serviceWorkerPath:'/firebase-messaging-sw.js'
    }));
  }catch(error){
    res.status(500).send(JSON.stringify({configured:false,vapidConfigured:false,senderConfigured:false,error:'PUSH_CONFIG_UNAVAILABLE'}));
  }
};