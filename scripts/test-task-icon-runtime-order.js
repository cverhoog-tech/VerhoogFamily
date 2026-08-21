const fs = require('fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}
function assert(ok, message) {
  if (!ok) throw new Error(message);
}

const loader = read('api/app.js');
const registry = read('src/ui/icons/familyAppIconRegistry.js');
const renderer = read('src/ui/icons/familyAppIconRenderer.js');
const categories = read('src/modules/tasks/taskCategoryIcons.js');
const compact = read('src/modules/tasks/taskCompactHome.js');

const registryTag = 'src/ui/icons/familyAppIconRegistry.js?v=8';
const rendererTag = 'src/ui/icons/familyAppIconRenderer.js?v=2';
const compactTag = 'src/modules/tasks/taskCompactHome.js?v=3';
const categoryTag = 'src/modules/tasks/taskCategoryIcons.js?v=5';

assert(loader.includes(registryTag), 'canonical icon registry is not wired');
assert(loader.includes(rendererTag), 'canonical icon renderer is not wired');
assert(loader.includes(compactTag), 'canonical task overview is not cache-busted/wired');
assert(loader.includes(categoryTag), 'task category icon bridge is not wired');
assert(loader.indexOf(registryTag) < loader.indexOf(compactTag), 'icon registry must load before TaskCompactHome');
assert(loader.indexOf(rendererTag) < loader.indexOf(compactTag), 'icon renderer must load before TaskCompactHome');
assert(loader.indexOf(rendererTag) < loader.indexOf(categoryTag), 'icon renderer must load before TaskCategoryIcons');

['taskQuest','taskLaundry','taskCleaning','taskKitchen','taskGroceries','taskPantry','taskAdmin','taskFamily','taskGarden','taskTravel','taskDropoff','taskPickup']
  .forEach(key => assert(registry.includes(key + ':task('), 'missing task semantic icon: ' + key));

assert(categories.includes('FamilyAppIconRenderer.render'), 'TaskCategoryIcons must render through canonical renderer');
assert(categories.includes("variant||'default'"), 'TaskCategoryIcons must keep rich/default variant support');
assert(categories.includes("'compact'"), 'TaskCategoryIcons must keep compact variant support');
assert(categories.includes("return html||'<span class=\"fa-task-fallback\""), 'TaskCategoryIcons needs safe empty fallback');

assert(compact.includes('data-task-id'), 'task overview contract unexpectedly changed');
assert(!/bottom-nav|more-menu/.test(categories), 'task content migration must not take ownership of excluded navigation');

console.log('task icon runtime order contract OK');
