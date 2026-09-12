'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const shell=read('api/app-v7.js');
const css=read('src/styles/tasksV3InteractionPolish.css');

assert(shell.includes('/src/styles/tasksV3InteractionPolish.css?v=1'),'interaction polish must be served by canonical v7 shell');
assert(css.includes('.tv3d-overlay .tv3d-close'),'detail close button guard missing');
assert(css.includes('.tv3d-overlay .tv3e-head [data-tv3-close]'),'editor close button guard missing');
assert(css.includes('width:33px!important'),'close button width must be fixed');
assert(css.includes('height:33px!important'),'close button height must be fixed');
assert(css.includes('aspect-ratio:1/1!important'),'close button must retain square geometry');
assert(css.includes('border-radius:50%!important'),'close button must render as a circle');

console.log('Tasks V3 popup close control circular geometry contract: PASS');
