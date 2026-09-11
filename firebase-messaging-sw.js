'use strict';
/* STEP 10 + PWA CACHE HARDENING v1.4.0
 *
 * One service worker owns both FCM background messaging and FamilyApp's
 * static-asset cache. This avoids competing scope='/' workers.
 *
 * SECURITY BOUNDARY:
 * - never cache navigation/document responses;
 * - never cache /api/, Firebase/auth/household traffic or cross-origin data;
 * - never cache responses marked private/no-store;
 * - cache only same-origin static file extensions;
 * - old cache generations are deleted on activate.
 */
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

var FAMILYAPP_STATIC_CACHE_VERSION='familyapp-static-v4';
var FAMILYAPP_STATIC_CACHE_PREFIX='familyapp-static-';
var FAMILYAPP_STATIC_EXT_RE=/\.(?:css|js|mjs|png|jpg|jpeg|webp|svg|gif|ico|woff|woff2|ttf|otf|json)$/i;
var FAMILYAPP_SENSITIVE_QUERY_RE=/(?:^|_)(?:token|auth|session|code|secret|key|credential)(?:$|_)/i;
var FAMILYAPP_CACHE_MAX_ENTRIES=140;

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

function familyAppIsSafeStaticRequest(request){
  if(!request||request.method!=='GET')return false;
  if(request.mode==='navigate'||request.destination==='document')return false;
  if(request.headers&&request.headers.has('range'))return false;
  var url;
  try{url=new URL(request.url);}catch(error){return false;}
  if(url.origin!==self.location.origin)return false;
  if(url.pathname==='/firebase-messaging-sw.js')return false;
  if(url.pathname.indexOf('/api/')===0||url.pathname.indexOf('/__/')===0)return false;
  if(url.pathname.indexOf('/auth/')===0||url.pathname.indexOf('/firebase/')===0)return false;
  var sensitive=false;
  url.searchParams.forEach(function(value,key){
    if(FAMILYAPP_SENSITIVE_QUERY_RE.test(String(key||'')))sensitive=true;
  });
  if(sensitive)return false;
  return FAMILYAPP_STATIC_EXT_RE.test(url.pathname);
}

function familyAppResponseMayBeCached(response){
  if(!response||!response.ok)return false;
  if(response.type!=='basic'&&response.type!=='default')return false;
  var control=String(response.headers&&response.headers.get('Cache-Control')||'').toLowerCase();
  if(control.indexOf('no-store')>=0||control.indexOf('private')>=0)return false;
  return true;
}

function familyAppTrimCache(cache){
  return cache.keys().then(function(keys){
    if(keys.length<=FAMILYAPP_CACHE_MAX_ENTRIES)return;
    return Promise.all(keys.slice(0,keys.length-FAMILYAPP_CACHE_MAX_ENTRIES).map(function(key){return cache.delete(key);}));
  });
}

function familyAppPut(cache,request,response){
  if(!familyAppResponseMayBeCached(response))return Promise.resolve(response);
  return cache.put(request,response.clone()).then(function(){return familyAppTrimCache(cache);}).then(function(){return response;});
}

self.addEventListener('install',function(event){
  self.skipWaiting();
});

self.addEventListener('activate',function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(key){
        return key.indexOf(FAMILYAPP_STATIC_CACHE_PREFIX)===0&&key!==FAMILYAPP_STATIC_CACHE_VERSION;
      }).map(function(key){return caches.delete(key);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(event){
  var request=event.request;
  if(!familyAppIsSafeStaticRequest(request))return;
  event.respondWith(
    caches.open(FAMILYAPP_STATIC_CACHE_VERSION).then(function(cache){
      return cache.match(request).then(function(cached){
        if(cached)return cached;
        return fetch(request).then(function(response){return familyAppPut(cache,request,response);});
      });
    })
  );
});

messaging.onBackgroundMessage(function(payload){
  var notification=payload&&payload.notification||{};
  var data=payload&&payload.data||{};
  var title=notification.title||data.title||'FamilyApp';
  var options={
    body:notification.body||data.body||'',
    icon:data.icon||'/api/brand-icon?variant=192&v=7',
    badge:data.badge||'/api/brand-icon?variant=32&v=7',
    data:data
  };
  return self.registration.showNotification(title,options);
});

self.addEventListener('notificationclick',function(event){
  event.notification.close();
  var data=event.notification&&event.notification.data||{};
  var target=data.url||data.click_action||'/';
  event.waitUntil(
    self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(clients){
      for(var i=0;i<clients.length;i++){
        if('focus' in clients[i]){
          clients[i].navigate(target);
          return clients[i].focus();
        }
      }
      if(self.clients.openWindow)return self.clients.openWindow(target);
    })
  );
});
