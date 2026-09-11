'use strict';
const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
function ok(condition,message){if(!condition){console.error('FAIL:',message);process.exitCode=1;}else console.log('PASS:',message);}
const sw=read('firebase-messaging-sw.js');
const push=read('src/core/pushRegistrationService.js');

ok(sw.includes("FAMILYAPP_STATIC_CACHE_VERSION='familyapp-static-v1'"),'versioned FamilyApp static cache exists');
ok(sw.includes("url.origin!==self.location.origin"),'cross-origin requests are excluded');
ok(sw.includes("url.pathname.indexOf('/api/')===0"),'API responses are excluded');
ok(sw.includes("request.mode==='navigate'")&&sw.includes("request.destination==='document'"),'documents/navigation are excluded');
ok(sw.includes("no-store")&&sw.includes("private"),'private and no-store responses are rejected');
ok(sw.includes("request.headers.has('range')"),'range/media requests are excluded');
ok(sw.includes('FAMILYAPP_SENSITIVE_QUERY_RE'),'sensitive query-key guard exists');
ok(sw.includes("url.searchParams.has('v')")&&sw.includes('familyAppCacheFirstVersioned'),'versioned assets use cache-first');
ok(sw.includes('familyAppNetworkFirstStatic'),'unversioned assets use network-first');
ok(sw.includes('FAMILYAPP_CACHE_MAX_ENTRIES=140'),'cache is size-bounded');
ok(sw.includes("self.addEventListener('activate'")&&sw.includes('caches.delete(key)'),'old cache generations are removed');
ok(sw.includes("self.addEventListener('message'")&&sw.includes('familyapp:clear-static-cache'),'explicit cache-clear hook exists');
ok(sw.includes('messaging.onBackgroundMessage'),'push background handling remains in shared worker');
ok(push.includes("VERSION='1.2.0'"),'push service version bumped for shared worker registration');
ok(push.includes('function ensureSharedWorker()'),'shared worker registration helper exists');
ok(push.includes("register('/firebase-messaging-sw.js',{scope:'/',updateViaCache:'none'})"),'shared worker registers at root without HTTP cache pinning');
ok(push.includes('ensureSharedWorker();')&&push.includes('function start()'),'worker registration runs during normal app startup');
ok(push.includes('Notification.requestPermission()'),'explicit push permission flow remains present');

if(process.exitCode)process.exit(process.exitCode);
console.log('PWA static cache contract passed.');
