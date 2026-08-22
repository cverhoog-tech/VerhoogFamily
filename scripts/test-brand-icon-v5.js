const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}

const endpoint=read('api/brand-icon.js');
const appIcon=read('src/core/appIcon.js');
const manifest=read('manifest.json');
const shell=read('api/app.js');

assert(endpoint.includes('familyapp/brand/v5/icon-master.png'),'brand endpoint must use approved v5 source');
assert(endpoint.includes('familyapp-brand-v5.png'),'brand endpoint filename must identify v5');
assert(appIcon.includes("version: '5'"),'canonical app identity must be v5');
assert(manifest.includes('/?brand=v5'),'PWA start URL must cache-bust brand v5');
assert(shell.includes('manifest.json?v=5'),'runtime manifest link must be v5');
assert(shell.includes('src/core/appIcon.js?v=5'),'runtime appIcon loader must be v5');

[endpoint,appIcon,manifest].forEach((content,index)=>{
  assert(!/brand\/v4|[?&]v=4|brand=v4/.test(content),'legacy v4 brand reference remains in branding file '+index);
});

['32','180','192','512','maskable'].forEach(variant=>{
  assert(endpoint.includes("'"+variant+"':"),'brand endpoint missing '+variant+' variant');
});

console.log('FamilyApp brand v5 contract OK');
