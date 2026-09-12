'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}
const patch=read('src/core/cleaningMoreMenuIcon.js');
const shell=read('api/app-v7.js');
assert(patch.includes('[data-goto-more="cleaning"]'),'Cleaning icon patch must target only the More-menu Cleaning action');
assert(patch.includes('M23.5 4.5v15.2'),'Cleaning icon must contain the mop handle vector');
assert(patch.includes('M4.5 15.5h13'),'Cleaning icon must contain the bucket vector');
assert(patch.includes("var original=window.renderNav"),'Cleaning icon must survive navigation re-renders');
assert(shell.includes('/src/core/cleaningMoreMenuIcon.js?v=1'),'served shell must load the Cleaning More-menu icon patch');
console.log('Cleaning More-menu bucket + mop icon contract OK');
