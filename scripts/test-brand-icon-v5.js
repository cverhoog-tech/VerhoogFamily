const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}

const endpoint=read('api/brand-icon.js');
const appIcon=read('src/core/appIcon.js');
const manifest=read('manifest.json');
const baseShell=read('api/app.js');
const shell=read('api/app-v7.js');
const routes=read('vercel.json');
const login=read('src/core/loginBrandV7.js');
const loginCss=read('src/styles/loginBrandV7.css');

// The product-owner supplied PWA icon remains the exact v6 master. Brand v7
// advances only the served app/login shell, not the approved icon artwork.
assert(endpoint.includes('familyapp/brand/v6/icon-master.png'),'brand endpoint must keep the approved literal icon master');
assert(endpoint.includes('familyapp-brand-v6.png'),'icon endpoint filename must keep the approved source generation');
assert(appIcon.includes("version: '7'"),'canonical app identity must be v7');
assert(manifest.includes('/?brand=v7'),'PWA start URL must cache-bust brand v7');
assert(manifest.includes('familyapp-icon-192.png?v=7'),'manifest must expose the literal supplied 192 icon asset with v7 cache generation');
assert(appIcon.includes("manifest.href = '/manifest.json?v=7'"),'runtime identity must move manifest link to v7');
assert(appIcon.includes("theme.setAttribute('content', '#0b3428')"),'runtime identity must use pine brand theme color');
assert(baseShell.includes('src/core/appIcon.js?v=6'),'base runtime shell must retain its canonical identity hook for wrapper replacement');
assert(shell.includes("replaceAll('src/core/appIcon.js?v=6', 'src/core/appIcon.js?v=9')"),'brand v7 shell must serve the current canonical identity generation');
assert(routes.includes('"dest": "/api/app-v7"'),'root must be served by the native v7 shell');

[endpoint,appIcon,manifest].forEach((content,index)=>{
  assert(!/brand\/v4|brand=v4/.test(content),'legacy v4 brand reference remains in branding file '+index);
});

['32','180','192','512','maskable','login'].forEach(variant=>{
  assert(endpoint.includes("'"+variant+"':"),'brand endpoint missing '+variant+' compatibility variant');
});

assert(appIcon.includes('/src/assets/brand/v6/familyapp-icon-192.png?v=7'),'runtime icon identity must use the approved literal icon asset');
assert(appIcon.includes('/src/styles/loginBrandV7.css?v=2'),'runtime identity must load polished v7.1 login styles');
assert(appIcon.includes('/src/core/loginBrandV7.js?v=2'),'runtime identity must load polished v7.1 login controller');
assert(!appIcon.includes('loginBrandV6'),'canonical runtime must not load screenshot-based v6 login');
assert(login.includes("VERSION='7.1.0'"),'native login controller version must match current v7.1 polish');
assert(login.includes('Doorgaan met Google'),'native login must retain Google action');
assert(login.includes('Doorgaan met Apple'),'native login must retain Apple action');
assert(login.includes('window.submitAuth'),'email login/register must retain existing auth entrypoint');
assert(!login.includes('login-reference.jpg'),'native login must not render the old screenshot reference');
assert(!/firebase\.auth|onAuthStateChanged|signInWithEmailAndPassword/.test(login),'v7 presentation must not become a second auth owner');
assert(!/backdrop-filter|setInterval|requestAnimationFrame/.test(loginCss),'native login styles must stay repaint-light');

console.log('FamilyApp icon + native brand v7.1 contract OK');
