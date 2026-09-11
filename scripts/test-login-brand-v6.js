'use strict';
const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}
const ui=read('src/core/loginBrandV6.js');
const css=read('src/styles/loginBrandV6.css');
const appIcon=read('src/core/appIcon.js');
const provider=read('src/core/authProviderConfig.js');
const session=read('src/core/authenticatedSessionController.js');
const manifest=read('manifest.json');

assert(ui.includes("VERSION='6.0.1'"),'login brand controller must be v6.0.1');
assert(ui.includes("visual.src='/src/assets/brand/v6/login-reference.jpg?v=6'"),'literal product-owner login reference must be the rendered surface');
assert(ui.includes("button('flv6-login','Inloggen'"),'Inloggen hotspot missing');
assert(ui.includes("button('flv6-register','Account maken'"),'Account maken hotspot missing');
assert(ui.includes("button('flv6-google','Doorgaan met Google'"),'Google hotspot missing');
assert(ui.includes("button('flv6-apple','Doorgaan met Apple'"),'Apple hotspot missing');
assert(ui.includes("window.signInWithGoogle"),'Google action must delegate to existing auth flow');
assert(ui.includes('window.FamilyAppAppleAuth.signIn'),'Apple action must delegate to existing Apple auth module');
assert(ui.includes('providers().apple===true'),'Apple action must remain gated by central provider readiness');
assert(provider.includes('apple:false'),'Apple provider must remain disabled until external Firebase/Apple setup is complete');
assert(ui.includes("showLoginTab(isRegister?'register':'login')"),'email login/register must retain existing submit flow');
assert(ui.includes("#google-btn")&&ui.includes('useOfflineMode'),'legacy duplicate auth controls must be hidden inside the email sheet');
assert(!/firebase\.auth|onAuthStateChanged|createUserWithEmailAndPassword|signInWithEmailAndPassword/.test(ui),'presentation controller must not own Firebase auth');
assert(session.includes('onAuthStateChanged'),'authenticated session controller must remain auth lifecycle owner');
assert(css.includes('.flv6-login')&&css.includes('.flv6-register')&&css.includes('.flv6-google')&&css.includes('.flv6-apple'),'literal reference hotspots must be positioned by CSS');
assert(!/backdrop-filter/.test(css),'login surface must avoid repaint-heavy backdrop filters');
assert(!/animation\s*:/.test(css),'login surface must not run continuous animations');
assert(appIcon.includes('/src/styles/loginBrandV6.css?v=2')&&appIcon.includes('/src/core/loginBrandV6.js?v=2'),'canonical startup must load the v6 login presentation');
assert(manifest.includes('"theme_color": "#0b3428"'),'PWA theme must match literal deep-pine brand');
assert(manifest.includes('/?brand=v6'),'PWA start URL must identify brand v6');
console.log('FamilyApp literal login brand v6 contract OK');
