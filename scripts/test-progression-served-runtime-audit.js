'use strict';
const fs=require('fs');
const assert=require('assert');
const appHandler=require('../api/app.js');

function clean(src){return String(src||'').split('?')[0].replace(/^\.\//,'');}
function local(src){const p=clean(src);return p.startsWith('src/')&&p.endsWith('.js')?p:null;}
function executableLines(source){
  return String(source||'').split('\n').filter(line=>!line.trim().startsWith('//')).join('\n');
}

async function getServedHtml(){
  let body='';
  const res={setHeader(){},status(){return this;},send(v){body=String(v);return this;}};
  await appHandler({},res);
  assert.ok(body.includes('<!DOCTYPE html>'));
  return body;
}

function scriptFiles(html){
  const out=[],re=/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/g;
  let m;while((m=re.exec(html))){const f=local(m[1]);if(f)out.push(f);}return out;
}

function loadedChildren(source){
  const out=[],re=/\bload\(\s*["'](src\/[^"']+\.js(?:\?[^"']*)?)["']/g;
  let m;while((m=re.exec(source))){const f=local(m[1]);if(f)out.push(f);}return out;
}

function servedFiles(html){
  const seen=new Set(),queue=scriptFiles(html);
  while(queue.length){
    const f=queue.shift();if(!f||seen.has(f))continue;seen.add(f);
    if(!fs.existsSync(f))continue;
    loadedChildren(fs.readFileSync(f,'utf8')).forEach(child=>{if(!seen.has(child))queue.push(child);});
  }
  return seen;
}

(async function(){
  const html=await getServedHtml(),served=servedFiles(html);

  [
    'src/core/progressionStore.js','src/core/progressionRuntime.js','src/core/progressionProducerBridge.js',
    'src/modules/tasks/recurringTaskRewardBridge.js','src/modules/skills/skillsProgressionBridge.js',
    'src/modules/finance/financeProgressionBridge.js','src/modules/calendar/calendarLegacy.js'
  ].forEach(f=>assert.ok(served.has(f),f+' must be served'));

  [
    'src/modules/shop/shop.js','src/modules/tasks/groupQuests.js',
    'src/modules/tasks/groupQuestRewardPolish.js','src/modules/recipes/recipeBottomSheetBridge.js'
  ].forEach(f=>assert.ok(!served.has(f),f+' must remain unserved'));

  const awardFiles=[],directAdds=[];
  served.forEach(f=>{
    if(!fs.existsSync(f))return;const s=fs.readFileSync(f,'utf8'),code=executableLines(s);
    if(/\bawardXP\s*\(/.test(code))awardFiles.push(f);
    if(/\bmyXP\s*\+=/.test(code))directAdds.push(f);
  });
  awardFiles.sort();directAdds.sort();

  const allowed=new Set([
    'src/core/addSheet.js','src/core/dailyBonus.js','src/core/progressionRuntime.js',
    'src/modules/achievements/achievements.js','src/modules/calendar/calendarLegacy.js',
    'src/modules/feed/feed.js','src/modules/finance/finance.js','src/modules/notes/notes.js',
    'src/modules/recipes/recipeEditorPopup.js','src/modules/recipes/recipeServerlessLinkImport.js',
    'src/modules/skills/skills.js','src/modules/tasks/duoQuests.js',
    'src/modules/tasks/partyQuestCompletionReward.js','src/modules/tasks/recurringTaskRewardBridge.js',
    'src/modules/tasks/taskUidCreateBridge.js','src/modules/tasks/tasks.js','src/modules/tasks/templates.js'
  ]);
  const unexpected=awardFiles.filter(f=>!allowed.has(f));
  assert.deepStrictEqual(unexpected,[],`unexpected served awardXP producer(s): ${unexpected.join(', ')}`);

  const importer=fs.readFileSync('src/modules/recipes/recipeServerlessLinkImport.js','utf8');
  assert.ok(importer.includes("key:'recipe:'+String(saved.id)"));
  assert.ok(importer.includes("source:'recipe-import'"));
  const taskUid=fs.readFileSync('src/modules/tasks/taskUidCreateBridge.js','utf8');
  assert.ok(taskUid.includes("key:'task:'+String(taskId)"));
  assert.ok(taskUid.includes("source:'task'"));

  assert.deepStrictEqual(directAdds,[
    'src/modules/achievements/achievements.js','src/modules/skills/skills.js','src/modules/tasks/tasks.js'
  ]);

  assert.ok(!html.includes('onclick="openTradeSheet()"'));
  const tradeCallers=[],duoCallers=[];
  served.forEach(f=>{
    if(!fs.existsSync(f))return;const s=executableLines(fs.readFileSync(f,'utf8'));
    if(f!=='src/modules/achievements/achievements.js'&&/\bopenTradeSheet\s*\(/.test(s))tradeCallers.push(f);
    if(f!=='src/modules/tasks/duoQuests.js'&&/\btrackDuoProgress\s*\(/.test(s))duoCallers.push(f);
  });
  assert.deepStrictEqual(tradeCallers,[]);
  assert.deepStrictEqual(duoCallers,[]);

  const loader=fs.readFileSync('api/app.js','utf8');
  assert.ok(loader.includes('src/core/progressionRuntime.js?v=2'));
  assert.ok(loader.includes('src/core/progressionProducerBridge.js?v=3'));
  assert.ok(loader.includes('src/modules/skills/skillsProgressionBridge.js?v=4'));
  assert.ok(loader.includes('src/modules/finance/financeProgressionBridge.js?v=1'));
  assert.ok(loader.includes('src/modules/tasks/taskUidCreateBridge.js?v=2'));
  assert.ok(loader.includes('src/modules/recipes/recipeServerlessLinkImport.js?v=2'));

  console.log('STEP 9 served progression runtime audit: PASS');
  console.log('Served awardXP files:',awardFiles.join(', '));
})().catch(err=>{console.error(err);process.exit(1);});
