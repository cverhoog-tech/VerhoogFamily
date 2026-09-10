'use strict';
const fs=require('fs');
const assert=require('assert');
const appHandler=require('../api/app.js');

function read(path){return fs.readFileSync(path,'utf8');}
const css=read('src/styles/homePwaShellFix.css');
const appCss=read('src/styles/app.css');
const loader=read('api/app.js');

assert.ok(appCss.includes('body{background:#fff!important;}'),'regression setup: legacy white refresh still contains the hard-coded light body');
assert.ok(appCss.includes('#screen-home{\n  background:#fff!important;'),'regression setup: live Home layer still contains the hard-coded white surface');
assert.ok(css.includes('@media (display-mode: standalone)'),'safe-area fix must be scoped to installed standalone mode');
assert.ok(css.includes('env(safe-area-inset-top)'),'safe-area fix must use the device inset rather than a hard-coded model offset');
assert.ok(css.includes('padding-top: calc(12px + env(safe-area-inset-top)) !important'),'installed header must move interactive controls below the iOS status area');
assert.ok(css.includes('top: calc(54px + env(safe-area-inset-top)) !important'),'sticky task/finance tabs must account for the taller standalone header');
assert.ok(css.includes('[data-theme="dark"] #screen-home')&&css.includes('[data-theme$="-dark"] #screen-home'),'Home dark fix must cover default and named dark themes');
assert.ok(css.includes('background: var(--c-bg) !important'),'dark Home/body must restore canonical theme background tokens');
assert.ok(css.includes('color: var(--c-text) !important'),'dark Home heading/text must restore canonical theme text tokens');
assert.ok(loader.includes('homePwaShellFix.css?v=1'),'served runtime must load the PWA/dark Home override with a stable cache key');

(async function(){
  let body='';
  const res={setHeader(){},status(){return this;},send(value){body=String(value);return this;}};
  await appHandler({},res);
  const appIndex=body.indexOf('src/styles/app.css?v=3');
  const fixIndex=body.indexOf('src/styles/homePwaShellFix.css?v=1');
  assert.ok(appIndex>=0&&fixIndex>appIndex,'Home/PWA override CSS must be served after app.css so it can beat legacy !important light rules');
  console.log('Home PWA safe-area + dark-shell contract: PASS');
})().catch((error)=>{console.error(error);process.exit(1);});
