'use strict';
/* STEP 10 + PWA CACHE HARDENING v1.3.0
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

var FAMILYAPP_STATIC_CACHE_VERSION='familyapp-static-v3';
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

function familyAppCacheFirstVersioned(request){
  return caches.open(FAMILYAPP_STATIC_CACHE_VERSION).then(function(cache){
    return cache.match(request).then(function(cached){
      if(cached)return cached;
      return fetch(request).then(function(response){return familyAppPut(cache,request,response);});
    });
  });
}

function familyAppNetworkFirstStatic(request){
  return caches.open(FAMILYAPP_STATIC_CACHE_VERSION).then(function(cache){
    return fetch(request).then(function(response){return familyAppPut(cache,request,response);}).catch(function(){
      return cache.match(request).then(function(cached){if(cached)return cached;throw new Error('FAMILYAPP_STATIC_OFFLINE_MISS');});
    });
  });
}

self.addEventListener('install',function(event){
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',function(event){
  event.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(key){
      return key.indexOf(FAMILYAPP_STATIC_CACHE_PREFIX)===0&&key!==FAMILYAPP_STATIC_CACHE_VERSION;
    }).map(function(key){return caches.delete(key);}));
  }).then(function(){return self.clients.claim();}));
});

self.addEventListener('fetch',function(event){
  var request=event.request;
  if(!familyAppIsSafeStaticRequest(request))return;
  var url=new URL(request.url);
  // Versioned assets are immutable by URL and can be served cache-first.
  // Unversioned static files go network-first so a deploy cannot pin stale UI.
  if(url.searchParams.has('v'))event.respondWith(familyAppCacheFirstVersioned(request));
  else event.respondWith(familyAppNetworkFirstStatic(request));
});

self.addEventListener('message',function(event){
  var data=event&&event.data||{};
  if(data.type==='familyapp:clear-static-cache'){
    event.waitUntil(caches.delete(FAMILYAPP_STATIC_CACHE_VERSION));
  }
});

messaging.onBackgroundMessage(function(payload){
  // Notification payloads are automatically displayed by FCM. FamilyApp's
  // trusted sender is intended to use data-only payloads so the canonical
  // notification id can be carried without a second inbox authority.
  if(payload&&payload.notification)return;
  var data=payload&&payload.data||{};
  var title=String(data.title||'FamilyApp');
  var options={
    body:String(data.body||'Je hebt een nieuwe melding.'),
    icon:'/src/assets/brand/v6/familyapp-icon-192.png?v=6',
    badge:'/src/assets/brand/v6/familyapp-icon-192.png?v=6',
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