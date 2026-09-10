const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const catalog=read('src/core/heroBackdropCatalog.js');
const repo=read('src/modules/profile/memberHeroBackgroundRepository.js');
const picker=read('src/modules/profile/personHeroBackgroundPicker.js');
const service=read('src/modules/tasks/personDashboardService.js');
const person=read('src/modules/tasks/personTabV2.js');
const loader=read('api/app.js');
function assert(ok,msg){if(!ok)throw new Error(msg);}
assert(catalog.includes("fantasy-castle-night"),'default preset missing');
assert(catalog.includes("quest-adventure")&&catalog.includes("enchanted-garden")&&catalog.includes("cozy-guild-home"),'expanded preset catalog missing');
assert(repo.includes("String(uid)===String(c.uid)"),'repository must restrict writes to current uid');
assert(repo.includes("/members/'+uid+'/heroBackground"),'canonical member heroBackground path missing');
assert(repo.includes('setPreset')&&repo.includes('reset'),'repository mutation contract missing');
assert(picker.includes('HeroBackdropCatalog')&&picker.includes('MemberHeroBackgroundRepository'),'picker must use canonical catalog/repository');
assert(service.includes('heroBackground:clone(record.heroBackground)||null'),'dashboard must expose persisted backdrop preference');
assert(person.includes('data-pt2-edit-backdrop'),'own-card edit action missing');
assert(person.includes('PersonHeroBackgroundPicker.open'),'person tab must open canonical picker');
assert(loader.indexOf('memberHeroBackgroundRepository.js')<loader.indexOf('personHeroBackgroundPicker.js'),'repository must load before picker');
assert(loader.indexOf('personHeroBackgroundPicker.js')<loader.indexOf('personTabV2.js'),'picker must load before person renderer');
console.log('person hero backdrop picker contract OK');
