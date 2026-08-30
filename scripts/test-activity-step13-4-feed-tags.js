'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function ok(v,m){if(!v)throw new Error(m);}
const tags=read('src/modules/feed/feedTagging.js');
const shared=read('src/modules/feed/feedSharedData.js');
const app=read('api/app.js');
ok(tags.includes("version:'1.0.0'"),'tag runtime version missing');
ok(tags.includes("type:'member',uid:String"),'member refs must use UID');
ok(tags.includes("type:'recipe',recipeId:String"),'recipe refs must use recipeId');
ok(tags.includes("openRecipeDetail"),'recipe tags must navigate to recipe detail');
ok(tags.includes("data-pt2-member"),'member tags must target canonical PersonTab member rail');
ok(tags.includes("last==='@'||last==='#'"),'@/# composer shortcuts missing');
ok(shared.includes("references:referencesArray(data&&data.references)"),'FeedSharedData must persist sanitized references');
ok(shared.includes("version:'1.1.0'"),'FeedSharedData version not bumped');
ok(app.includes('feedTagging.js'),'loader must serve feedTagging runtime');
console.log('STEP 13.4 feed tagging contract OK');
