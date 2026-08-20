const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
const catalog=read('src/core/heroBackdropCatalog.js');
const resolver=read('src/core/heroBackdropResolver.js');
const person=read('src/modules/tasks/personTabV2.js');
const loader=read('api/app.js');
const css=read('src/styles/personTabV2.css');
const asset=read('src/assets/hero-backdrops/fantasy-castle-night.svg');
function assert(ok,msg){if(!ok)throw new Error(msg);}
assert(catalog.includes("DEFAULT_ID='fantasy-castle-night'"),'default castle preset missing');
assert(catalog.includes('src/assets/hero-backdrops/fantasy-castle-night.svg'),'catalog asset path missing');
assert(resolver.includes("type:'preset'"),'preset resolver contract missing');
assert(resolver.includes("type:'upload'"),'upload-ready resolver contract missing');
assert(person.includes('HeroBackdropResolver.resolve'),'PersonTabV2 does not consume backdrop resolver');
assert(person.includes('pt2-hero-character'),'character portrait layer missing');
assert(css.includes('.pt2-hero-backdrop-layer'),'backdrop presentation layer missing');
assert(css.includes('.pt2-hero-character'),'portrait presentation layer missing');
assert(loader.indexOf('heroBackdropCatalog.js')<loader.indexOf('heroBackdropResolver.js'),'catalog must load before resolver');
assert(loader.indexOf('heroBackdropResolver.js')<loader.indexOf('personTabV2.js'),'resolver must load before person renderer');
assert(asset.includes('<svg')&&asset.includes('Fantasy castle at night'),'castle asset invalid');
console.log('person hero backdrop foundation contract OK');
