'use strict';
// ============================================================
// YOUTUBE MUSIC
// ============================================================
var ytState={playing:false,title:'',artist:'',query:''};
function openYouTubeMusic(){
  currentAddType='yt_search';
  document.getElementById('sheet-title').textContent='🎵 YouTube Music';
  document.getElementById('sheet-fields').innerHTML=
    '<div class="field"><label>Zoek nummer of artiest</label><input id="yt-search-inp" placeholder="bijv. Coldplay Yellow"></div>'
    +'<div style="display:flex;gap:8px;margin-top:4px">'
    +'<button onclick="openYTSearch()" style="flex:1;background:#ff0000;color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer">▶ Openen in YouTube Music</button>'
    +'</div>'
    +'<div style="margin-top:12px"><div style="font-size:11px;font-weight:700;color:var(--c-text2);margin-bottom:8px">Snel kiezen</div>'
    +'<div style="display:flex;flex-direction:column;gap:6px">'
    +['Lo-fi hip hop','Pop hits 2024','Cleaning playlist','Cooking playlist','Workout mix','Relax playlist'].map(function(q){
      return '<button onclick="openYTQuery(\''+q+'\')" style="background:var(--c-surface2);border:none;border-radius:8px;padding:9px 12px;text-align:left;font-size:13px;color:var(--c-text);cursor:pointer">🎵 '+q+'</button>';
    }).join('')+'</div></div>';
  document.getElementById('add-overlay').classList.add('open');
}
function openYTSearch(){var q=(document.getElementById('yt-search-inp')||{}).value||'';if(q)openYTQuery(q);}
function openYTQuery(query){
  window.open('https://music.youtube.com/search?q='+encodeURIComponent(query),'_blank');
  closeAdd();
  var bar     = document.getElementById('yt-bar');
  var titleEl = document.getElementById('yt-title');
  var artistEl= document.getElementById('yt-artist');
  var thumbEl = document.getElementById('yt-thumb');
  if(bar){ bar.classList.remove('hidden'); }
  if(titleEl)  titleEl.textContent  = query;
  if(artistEl) artistEl.textContent = 'YouTube Music';
  if(thumbEl)  thumbEl.textContent  = '🎵';
  ytState={playing:true,title:query,artist:'YouTube Music',query:query};
  updateYtPlayBtn(true);
  addActivity('🎵','#fce7f3',myName+' luistert naar: '+query);
}

function ytTogglePlay(){
  ytState.playing=!ytState.playing;
  updateYtPlayBtn(ytState.playing);
  if(!ytState.playing) showToast('⏸ Gepauzeerd — tab nog open');
  else showToast('▶ Aan het afspelen');
}

function updateYtPlayBtn(playing){
  var icon = document.getElementById('yt-play-icon');
  var viz  = document.getElementById('yt-visualizer');
  if(icon){
    icon.innerHTML = playing
      ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';
  }
  if(viz) viz.classList.toggle('yt-paused', !playing);
}

function ytNext(){
  showToast('⏭ Volgende nummer — in YouTube Music tab');
  var thumb = document.getElementById('yt-thumb');
  if(thumb){ thumb.style.transform='scale(.85)'; setTimeout(function(){thumb.style.transform='';},200); }
}
function ytPrev(){
  showToast('⏮ Vorig nummer — in YouTube Music tab');
  var thumb = document.getElementById('yt-thumb');
  if(thumb){ thumb.style.transform='scale(.85)'; setTimeout(function(){thumb.style.transform='';},200); }
}
function closeYtBar(){
  var bar=document.getElementById('yt-bar');
  if(bar) bar.classList.add('hidden');
  ytState.playing=false;
}

(function loadFamilyRpgLayers(){
  function loadScriptOnce(id, src){
    if(document.getElementById(id)) return;
    var script=document.createElement('script');
    script.id=id;
    script.src=src;
    script.defer=true;
    document.body.appendChild(script);
  }

  loadScriptOnce('quest-engine-js','src/core/questEngine.js');
  loadScriptOnce('quest-adapter-js','src/core/questAdapter.js');
  loadScriptOnce('group-quest-premium-js','src/modules/tasks/groupQuestPremium.js');
  loadScriptOnce('group-quest-layout-fix-js','src/modules/tasks/groupQuestLayoutFix.js');
  loadScriptOnce('raid-card-polish-js','src/modules/tasks/raidCardPolish.js');
  loadScriptOnce('quest-overview-integration-js','src/modules/tasks/questOverviewIntegration.js');
  loadScriptOnce('quest-overview-watcher-js','src/modules/tasks/questOverviewWatcher.js');
  loadScriptOnce('task-navigation-stability-js','src/modules/tasks/taskNavigationStability.js');
})();

