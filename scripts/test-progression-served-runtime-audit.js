'use strict';
const fs=require('fs');
const assert=require('assert');
const path=require('path');
const appHandler=require('../api/app.js');

function cleanSrc(src){return String(src||'').split('?')[0].replace(/^\.\//,'');}
function localFile(src){const p=cleanSrc(src);return p.startsWith('src/')&&p.endsWith('.js')?p:null;}

async function servedHtml(){
  let body='';
  const res={
    setHeader(){},
    status(){return this;},
    send(value){body=String(value);return this;}
  };
  await appHandler({},res);
  assert.ok(body.includes('<!DOCTYPE html>'),'api/app must produce the served HTML');
  return body;
}

function htmlScripts(html){
  const out=[];
  const re=/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/g;
  let m;while((m=re.exec(html)))if(localFile(m[1]))out.push(localFile(m[1]));
  return out;
}

function literalLoads(source){
  const out=[];
  // Current module bootstraps use load('src/...js?v=n', ...). Keep this narrow:
  // a quoted path in a comment should not become a served dependency by accident.
  const re=/\bload\(\s*["'](src\/[^"']+\.js(?:\?[^"']*)?)["']/g;
  let m;while((m=re.exec(source)))out.push(localFile(m[1]));
  return out.filter(Boolean);
}

function expandServed(seed){
  const seen=new Set();
  const queue=seed.slice();
  while(queue.length){
    const file=queue.shift();
    if(!file||seen.has(file))continue;
    seen.add(file);
    if(!fs.existsSync(file))continue;
    const source=fs.readFileSync(file,'utf8');
    literalLoads(source).forEach(child=>{if(!seen.has(child))queue.push(child);});
  }
  return seen;
}

(async function(){
  const html=await servedHtml();
  const served=expandServed(htmlScripts(html));

  // Core STEP 9 runtime must actually be in the served branch loader.
  [
    'src/core/progressionStore.js',
    'src/core/progressionRuntime.js',
    'src/core/progressionProducerBridge.js',
    'src/modules/tasks/recurringTaskRewardBridge.js',
    'src/modules/skills/skillsProgressionBridge.js',
    'src/modules/finance/financeProgressionBridge.js',
    'src/modules/calendar/calendarLegacy.js'
  ].forEach(file=>assert.ok(served.has(file),file+' must be present in the served runtime'));

  // These legacy alternative implementations are deliberately not served by
  // the current api/app transformation and therefore cannot generate fallback XP.
  [
    'src/modules/shop/shop.js',
    'src/modules/tasks/groupQuests.js',
    'src/modules/tasks/groupQuestRewardPolish.js',
    'src/modules/recipes/recipeBottomSheetBridge.js'
  ].forEach(file=>assert.ok(!served.has(file),file+' must remain outside the current served runtime'));

  const filesWithAwardCalls=[];
  const filesWithDirectXpAdds=[];
  served.forEach(file=>{
    if(!fs.existsSync(file))return;
    const source=fs.readFileSync(file,'utf8');
    if(/\bawardXP\s*\(/.test(source))filesWithAwardCalls.push(file);
    if(/\bmyXP\s*\+=/.test(source))filesWithDirectXpAdds.push(file);
  });
  filesWithAwardCalls.sort();
  filesWithDirectXpAdds.sort();

  const knownAwardFiles=new Set([
    'src/core/addSheet.js',
    'src/core/dailyBonus.js',
    'src/core/progressionRuntime.js',
    'src/modules/achievements/achievements.js',
    'src/modules/calendar/calendarLegacy.js',
    'src/modules/feed/feed.js',
    'src/modules/finance/finance.js',
    'src/modules/notes/notes.js',
    'src/modules/recipes/recipeEditorPopup.js',
    'src/modules/skills/skills.js',
    'src/modules/tasks/duoQuests.js',
    'src/modules/tasks/partyQuestCompletionReward.js',
    'src/modules/tasks/recurringTaskRewardBridge.js',
    'src/modules/tasks/tasks.js',
    'src/modules/tasks/templates.js'
  ]);
  const unexpected=filesWithAwardCalls.filter(file=>!knownAwardFiles.has(file));
  assert.deepStrictEqual(unexpected,[],`unexpected served awardXP producer(s): ${unexpected.join(', ')}`);

  // The only remaining direct legacy additions are explicitly intercepted:
  // - achievements.js legacy awardXP body is replaced by ProgressionRuntime;
  // - tasks.js recurring-day bump is restored/rerouted by RecurringTaskRewardBridge;
  // - skills.js Triple-XP bump is restored/rerouted by SkillsProgressionBridge.
  assert.deepStrictEqual(filesWithDirectXpAdds,[
    'src/modules/achievements/achievements.js',
    'src/modules/skills/skills.js',
    'src/modules/tasks/tasks.js'
  ]);

  // Legacy task-trade XP exists in achievements.js, but the current loader removes
  // its only UI entry button; no separate served module calls openTradeSheet().
  assert.ok(!html.includes('onclick="openTradeSheet()"'),'legacy task-trade entry point must remain removed from served HTML');
  const externalTradeCallers=[];
  served.forEach(file=>{
    if(file==='src/modules/achievements/achievements.js'||!fs.existsSync(file))return;
    if(/\bopenTradeSheet\s*\(/.test(fs.readFileSync(file,'utf8')))externalTradeCallers.push(file);
  });
  assert.deepStrictEqual(externalTradeCallers,[],'no served module may resurrect the legacy task-trade XP path');

  // Duo quest legacy reward function is loaded as part of the old auth shell, but
  // no other served module calls trackDuoProgress; the active party-quest reward
  // path is the separately keyed PartyQuestCompletionReward module.
  const duoCallers=[];
  served.forEach(file=>{
    if(file==='src/modules/tasks/duoQuests.js'||!fs.existsSync(file))return;
    if(/\btrackDuoProgress\s*\(/.test(fs.readFileSync(file,'utf8')))duoCallers.push(file);
  });
  assert.deepStrictEqual(duoCallers,[],'legacy duoQuest XP path must remain unreachable');

  const loader=fs.readFileSync('api/app.js','utf8');
  assert.ok(loader.includes('src/core/progressionRuntime.js?v=2'));
  assert.ok(loader.includes('src/core/progressionProducerBridge.js?v=2'));
  assert.ok(loader.includes('src/modules/skills/skillsProgressionBridge.js?v=4'));
  assert.ok(loader.includes('src/modules/finance/financeProgressionBridge.js?v=1'));

  console.log('STEP 9 served progression runtime audit: PASS');
  console.log('Served awardXP files:',filesWithAwardCalls.join(', '));
})().catch(error=>{console.error(error);process.exit(1);});
