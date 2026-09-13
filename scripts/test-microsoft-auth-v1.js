'use strict';
const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}
const provider=read('src/core/authProviderConfig.js');
const microsoft=read('src/core/microsoftAuthV1.js');
const login=read('src/core/loginBrandV7.js');
const shell=read('api/app-v7.js');

assert(provider.includes('microsoft:true'),'Microsoft must be enabled for the beta');
assert(provider.includes('apple:false'),'Apple must stay disabled until Apple Developer setup is complete');
assert(microsoft.includes("VERSION='1.1.0'"),'Microsoft auth v1.1 marker missing');
assert(microsoft.includes("new firebase.auth.OAuthProvider('microsoft.com')"),'Microsoft must use Firebase microsoft.com OAuth provider');
assert(microsoft.includes("prompt:'select_account'"),'Microsoft login must let testers choose an account');
assert(microsoft.includes('signInWithRedirect')&&microsoft.includes('getRedirectResult'),'mobile Microsoft login must use the Firebase redirect flow');
assert(microsoft.includes('signInWithPopup'),'desktop Microsoft login must retain the popup flow');
assert(microsoft.includes("AuthenticatedSessionController")&&microsoft.includes('acceptAuthenticatedUser'),'Microsoft login must hand off to the canonical authenticated session controller');
assert(microsoft.includes("LEGACY_APPLE_ID='flv7-apple'")&&microsoft.includes("MICROSOFT_ID='flv7-microsoft'"),'Microsoft companion must replace the visible Apple control only');
assert(microsoft.includes('Doorgaan met Microsoft'),'Microsoft button label missing');
assert(microsoft.includes('microsoftSvg()'),'Microsoft button must use its vector mark');
assert(microsoft.includes("apple.parentNode.replaceChild(b,apple)"),'visible Apple button must be replaced, not duplicated');
assert(login.includes('id="flv7-apple"'),'accepted Login Brand V7 base surface must remain available for future Apple restoration');
assert(shell.includes('/src/core/microsoftAuthV1.js?v=1'),'production shell must load Microsoft authentication companion');
assert(!/clientSecret|client_secret|tenantSecret/i.test(microsoft),'Microsoft client secrets must never be embedded in the browser bundle');
console.log('FamilyApp Microsoft beta sign-in contract: PASS');
