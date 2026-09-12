const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}

const endpoint=read('api/brand-icon.js');
const appIcon=read('src/core/appIcon.js');
const pwaIcon=read('src/core/pwaIconV8.js');
const manifest=read('manifest.json');
const baseShell=read('api/app.js');
const shell=read('api/app-v7.js');
const routes=read('vercel.json');
const login=read('src/core/loginBrandV7.js');
const loginCss=read('src/styles/loginBrandV7.css');

assert(endpoint.includes('familyapp/brand/v8/pwa-master.svg'),'brand endpoint must use the opaque forest PWA v8 master');
assert(endpoint.includes('familyapp-brand-v8.png'),'icon endpoint filename must identify v8 output');
assert(endpoint.includes('f_png'),'all served Home Screen icon variants must render as PNG');
assert(appIcon.includes("version: '7'"),'app/login brand identity remains v7 while PWA icon advances independently');
assert(manifest.includes('/?brand=v8'),'PWA start URL must cache-bust the Home Screen icon generation');
assert(manifest.includes('/api/brand-icon?variant=192&v=8'),'manifest must expose the opaque 192 icon');
assert(manifest.includes('/api/brand-icon?variant=512&v=8'),'manifest must expose the opaque 512 icon');
assert(manifest.includes('/api/brand-icon?variant=maskable&v=8'),'manifest must expose the opaque maskable icon');
assert(pwaIcon.includes("apple:'/api/brand-icon?variant=180&v='+V"),'runtime must force the dedicated iOS apple-touch icon');
assert(pwaIcon.includes("manifest.href='/manifest.json?v='+V"),'runtime must keep manifest at PWA v8');
assert(baseShell.includes('src/core/appIcon.js?v=6'),'base runtime shell must retain its canonical identity hook for wrapper replacement');
assert(shell.includes("replaceAll('src/core/appIcon.js?v=6', 'src/core/appIcon.js?v=10')"),'brand shell must bust the canonical identity hook after PWA repair');
assert(shell.includes('/api/brand-icon?variant=180&v=8'),'served HTML must expose the opaque iOS icon before runtime JS');
assert(shell.includes('pwaIconV8.js?v=1'),'served shell must enforce the v8 PWA icon after app startup');
assert(routes.includes('"dest": "/api/app-v7"'),'root must still be served by the native v7 shell');

['32','180','192','512','maskable','login'].forEach(variant=>{
  assert(endpoint.includes("'"+variant+"':"),'brand endpoint missing '+variant+' compatibility variant');
});

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

console.log('FamilyApp PWA v8 + native login v7.1 contract OK');
