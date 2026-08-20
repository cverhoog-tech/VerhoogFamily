const fs=require('fs');

function read(path){return fs.readFileSync(path,'utf8');}
function expect(condition,message){if(!condition){console.error('FAIL:',message);process.exitCode=1;}else{console.log('PASS:',message);}}

const media=read('src/core/profileMedia.js');
const service=read('src/modules/tasks/personDashboardService.js');
const view=read('src/modules/tasks/personTabV2.js');
const css=read('src/styles/personTabV2.css');
const shell=read('src/styles/taskShellThemes.css');
const router=read('src/modules/tasks/taskOverviewCanonical.js');
const loader=read('api/app.js');

expect(media.includes('resolveHeroMedia'),'ProfileMedia exposes canonical hero-media resolver');
expect(media.includes('focalX')&&media.includes('focalY'),'ProfileMedia owns focal metadata');
expect(service.includes('heroMedia:heroMedia'),'Person dashboard exposes heroMedia view-model contract');
expect(view.includes('member.heroMedia'),'PersonTabV2 consumes heroMedia instead of hardcoded crop offsets');
expect(view.includes('--pt2-focal-x')&&view.includes('--pt2-focal-y'),'Renderer maps media metadata to presentation variables');
expect(css.includes('object-position:var(--pt2-focal-x,50%) var(--pt2-focal-y,50%)'),'Hero stylesheet consumes focal variables');
expect(!css.includes('object-position:center 28%'),'No screen-specific hardcoded hero focal patch remains');
expect(router.includes("setTaskView('person')")&&router.includes("setTaskView('overview')"),'Canonical router owns task subview state');
expect(router.includes('removeAttribute(\'data-task-view\')'),'Task-shell state is explicitly cleared outside Tasks');
expect(shell.includes('body[data-task-view="person"]'),'Person shell theme is token-driven');
expect(loader.includes('src/core/profileMedia.js?v=1'),'Runtime loads ProfileMedia before person dashboard');
expect(loader.includes('src/styles/taskShellThemes.css?v=1'),'Runtime loads canonical task shell themes');

if(process.exitCode)process.exit(process.exitCode);
