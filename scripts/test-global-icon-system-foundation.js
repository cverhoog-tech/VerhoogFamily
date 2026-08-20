const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const registry=read('src/ui/icons/familyAppIconRegistry.js');
const renderer=read('src/ui/icons/familyAppIconRenderer.js');
const sprite=read('src/ui/icons/assets/familyapp-icons.svg');
const person=read('src/modules/tasks/personTabV2.js');
const loader=read('api/app.js');
function assert(ok,msg){if(!ok)throw new Error(msg);}
['level','streak','quest','xpWeekly','edit','raid','dungeon','achievement','title'].forEach(k=>assert(registry.includes(k+':Object.freeze'),'missing semantic icon '+k));
assert(renderer.includes('FamilyAppIconRegistry'),'renderer must resolve through canonical registry');
assert(sprite.includes('id="fa-level"')&&sprite.includes('id="fa-streak"')&&sprite.includes('id="fa-quest"'),'sprite missing core fantasy icons');
assert(person.includes("statCard('level'")&&person.includes("statCard('streak'")&&person.includes("statCard('quest'")&&person.includes("statCard('xpWeekly'"),'Person stats not migrated');
assert(person.includes("icon('achievement'")&&person.includes("icon('edit'")&&person.includes("icon('title'"),'Person content icons not migrated');
assert(!/[🔥⚔️✦🏆⬡]/u.test(person),'generic emoji/symbol content icons remain in PersonTabV2');
assert(loader.includes('familyAppIconRegistry.js?v=1')&&loader.includes('familyAppIconRenderer.js?v=1')&&loader.includes('familyAppIcons.css?v=1'),'icon runtime wiring missing');
assert(loader.indexOf('familyAppIconRegistry.js')<loader.indexOf('personTabV2.js'),'registry must load before PersonTabV2');
assert(!registry.includes('bottom-nav')&&!registry.includes('more-menu'),'global registry must not take ownership of excluded navigation');
console.log('global icon system foundation contract OK');
