'use strict';
/* STEP 10 — FamilyApp Web Push service worker v1.0.0
 *
 * Uses Firebase compat messaging to match the currently served web runtime.
 * The Firebase web config below is public client configuration, not a secret.
 * Trusted FCM sender credentials live server-side only.
 */
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:'AIzaSyA4vXaF85pfv2Cxy5VG-KJXxsOG14UeN1s',
  authDomain:'verhoog-family.firebaseapp.com',
  databaseURL:'https://verhoog-family-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:'verhoog-family',
  storageBucket:'verhoog-family.firebasestorage.app',
  messagingSenderId:'216169661092',
  appId:'1:216169661092:web:ee86eb0b7b18bd4ae05c31'
});

var messaging=firebase.messaging();

messaging.onBackgroundMessage(function(payload){
  // Notification payloads are automatically displayed by FCM. FamilyApp's
  // trusted sender is intended to use data-only payloads so the canonical
  // notification id can be carried without a second inbox authority.
  if(payload&&payload.notification)return;
  var data=payload&&payload.data||{};
  var title=String(data.title||'FamilyApp');
  var options={
    body:String(data.body||'Je hebt een nieuwe melding.'),
    icon:'/api/brand-icon?variant=192&v=5',
    badge:'/api/brand-icon?variant=192&v=5',
    tag:String(data.notificationId||data.eventKey||'familyapp-notification'),
    renotify:false,
    data:{
      notificationId:String(data.notificationId||''),
      eventKey:String(data.eventKey||''),
      url:String(data.url||'/?screen=notif')
    }
  };
  return self.registration.showNotification(title,options);
});

self.addEventListener('notificationclick',function(event){
  event.notification.close();
  var data=event.notification&&event.notification.data||{};
  var target=String(data.url||'/?screen=notif');
  var notificationId=String(data.notificationId||'');
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    var existing=list&&list.length?list[0]:null;
    if(existing){
      try{existing.postMessage({type:'familyapp:push-open',notificationId:notificationId,url:target});}catch(e){}
      if(existing.focus)return existing.focus();
      return existing;
    }
    return clients.openWindow(target);
  }));
});
