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
expect(service.includes('heroMedia:heroMedia'),'Person dashboard preserves heroMedia view-model contract for portrait/profile compatibility');
expect(service.includes('heroBackground:clone(record.heroBackground)||null'),'Person dashboard exposes the separate hero-backdrop contract');
expect(view.includes('HeroBackdropResolver')&&view.includes('member&&member.heroBackground'),'PersonTabV2 consumes the dedicated hero-backdrop contract instead of avatar crop offsets');
expect(view.includes('--pt2-focal-x')&&view.includes('--pt2-focal-y'),'Renderer maps backdrop focal metadata to presentation variables');
expect(css.includes('object-position:var(--pt2-focal-x,50%) var(--pt2-focal-y,50%)'),'Hero stylesheet consumes focal variables');
expect(!css.includes('object-position:center 28%'),'No screen-specific hardcoded hero focal patch remains');
expect(router.includes("setTaskView('person')")&&router.includes("setTaskView('overview')"),'Canonical router owns task subview state');
expect(router.includes('removeAttribute(\'data-task-view\')'),'Task-shell state is explicitly cleared outside Tasks');
expect(shell.includes('body[data-task-view="person"]'),'Person shell theme is token-driven');
expect(loader.includes('src/core/profileMedia.js?v=3'),'Runtime loads current ProfileMedia before person dashboard');
expect(loader.indexOf('src/core/profileMedia.js')<loader.indexOf('src/modules/tasks/personDashboardService.js'),'ProfileMedia must load before person dashboard');
expect(loader.includes('src/styles/taskShellThemes.css?v=2'),'Runtime loads current canonical task shell themes');

if(process.exitCode)process.exit(process.exitCode);
