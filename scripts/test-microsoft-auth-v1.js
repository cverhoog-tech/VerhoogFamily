'use strict';
const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}
const provider=read('src/core/authProviderConfig.js');
const microsoft=read('src/core/microsoftAuthV1.js');
const login=read('src/core/loginBrandV7.js');
const shell=read('api/app-v7.js');

assert(provider.includes('microsoft:false'),'Microsoft must stay disabled for the current beta');
assert(provider.includes('apple:false'),'Apple must stay disabled until Apple Developer setup is complete');
assert(microsoft.includes("VERSION='1.2.0'"),'Microsoft auth v1.2 marker missing');
assert(microsoft.includes("new firebase.auth.OAuthProvider('microsoft.com')"),'future Microsoft implementation must remain ready behind the provider flag');
assert(microsoft.includes("prompt:'select_account'"),'future Microsoft login must retain account selection');
assert(microsoft.includes('signInWithRedirect')&&microsoft.includes('getRedirectResult'),'future mobile Microsoft login must retain Firebase redirect support');
assert(microsoft.includes('signInWithPopup'),'future desktop Microsoft login must retain popup support');
assert(microsoft.includes("if(!enabled())return Promise.resolve(null)"),'disabled Microsoft action must be inert and must not start OAuth');
assert(microsoft.includes("b.disabled=true")&&microsoft.includes("aria-disabled"),'Coming soon Microsoft control must be disabled accessibly');
assert(microsoft.includes('Coming soon'),'disabled Microsoft control must clearly say Coming soon');
assert(microsoft.includes("LEGACY_APPLE_ID='flv7-apple'")&&microsoft.includes("MICROSOFT_ID='flv7-microsoft'"),'Microsoft placeholder must replace the visible Apple control only');
assert(microsoft.includes('microsoftSvg()'),'Microsoft placeholder must retain its vector mark');
assert(microsoft.includes("apple.parentNode.replaceChild(b,apple)"),'visible Apple button must be replaced, not duplicated');
assert(login.includes('id="flv7-apple"'),'accepted Login Brand V7 base surface must remain available for future Apple restoration');
assert(shell.includes('/src/core/microsoftAuthV1.js?v=1'),'production shell must load Microsoft placeholder companion');
assert(!/clientSecret|client_secret|tenantSecret/i.test(microsoft),'Microsoft client secrets must never be embedded in the browser bundle');
console.log('FamilyApp Microsoft coming-soon placeholder contract: PASS');
