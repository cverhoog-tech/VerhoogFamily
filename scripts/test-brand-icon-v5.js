const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}

const endpoint=read('api/brand-icon.js');
const appIcon=read('src/core/appIcon.js');
const manifest=read('manifest.json');
const shell=read('api/app.js');
const login=read('src/core/loginBrandV6.js');
const loginCss=read('src/styles/loginBrandV6.css');

assert(endpoint.includes('familyapp/brand/v6/icon-master.png'),'brand endpoint must use v6 icon source');
assert(endpoint.includes('familyapp-brand-v6.png'),'brand endpoint filename must identify v6');
assert(appIcon.includes("version: '6'"),'canonical app identity must be v6');
assert(manifest.includes('/?brand=v6'),'PWA start URL must cache-bust brand v6');
assert(manifest.includes('familyapp-icon-192.png?v=6'),'manifest must expose the literal supplied 192 icon asset');
assert(appIcon.includes("manifest.href = '/manifest.json?v=6'"),'runtime identity must move manifest link to v6');
assert(appIcon.includes("theme.setAttribute('content', '#0b3428')"),'runtime identity must use pine brand theme color');
assert(shell.includes('src/core/appIcon.js?v=6'),'runtime shell must still load canonical app identity');

[endpoint,appIcon,manifest].forEach((content,index)=>{
  assert(!/brand\/v4|brand=v4/.test(content),'legacy v4 brand reference remains in branding file '+index);
});

['32','180','192','512','maskable','login'].forEach(variant=>{
  assert(endpoint.includes("'"+variant+"':"),'brand endpoint missing '+variant+' compatibility variant');
});

assert(appIcon.includes('/src/assets/brand/v6/familyapp-icon-192.png?v=6'),'runtime icon identity must use supplied v6 asset');
assert(appIcon.includes('/src/styles/loginBrandV6.css?v=2'),'runtime identity must load literal login styles');
assert(appIcon.includes('/src/core/loginBrandV6.js?v=2'),'runtime identity must load literal login controller');
assert(login.includes('/src/assets/brand/v6/login-reference.jpg?v=6'),'login must render the product-owner reference asset');
assert(login.includes("button('flv6-google','Doorgaan met Google',google)"),'literal login must retain Google action');
assert(login.includes("button('flv6-apple','Doorgaan met Apple',apple)"),'literal login must retain Apple action');
assert(login.includes("showLoginTab(isRegister?'register':'login')"),'email login/register must retain existing auth entrypoint');
assert(!/firebase\.auth|onAuthStateChanged|signInWithEmailAndPassword/.test(login),'v6 presentation must not become a second auth owner');
assert(!/backdrop-filter|setInterval|requestAnimationFrame/.test(loginCss),'literal login styles must stay repaint-light');

console.log('FamilyApp brand v6 contract OK');
