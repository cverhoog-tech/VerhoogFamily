'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const css=read('src/styles/feedDarkPremiumV1.css');
const shell=read('api/app-v7.js');
const feed=read('src/modules/feed/feed.js');

assert(css.includes('FAMILYAPP FEED — PREMIUM DARK MODE V1'),'feed dark premium stylesheet identity missing');
assert(css.includes('[data-theme*="dark"] #screen-feed'),'dark feed styles must be scoped to Feed screen');
assert(css.includes('linear-gradient(180deg,#050a0d 0%,#081014 44%,#061014 100%)'),'premium dark feed canvas missing');
assert(css.includes('.fs-filter.active'),'active compact filter treatment missing');
assert(css.includes('min-height:36px'),'compact filter height contract missing');
assert(css.includes('.fs-compose'),'dark composer treatment missing');
assert(css.includes('.fs-stat.task'),'dark summary-card treatment missing');
assert(css.includes('.fs-card'),'dark feed-card treatment missing');
assert(css.includes('.fs-input'),'dark reply-input treatment missing');
assert(shell.includes('/src/styles/feedDarkPremiumV1.css?v=1'),'live V7 shell must serve the premium Feed stylesheet');
assert(feed.includes('FeedSharedData'),'Feed renderer must keep canonical FeedSharedData authority');
assert(!css.includes('position:fixed')||!css.includes('feedData='),'presentation stylesheet must not introduce a Feed data authority');

console.log('Feed premium dark mode + compact filters contract: PASS');
