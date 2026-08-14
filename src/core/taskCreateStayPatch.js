(function(){
  if(window.__familyAppTaskCreateStayPatchV1) return;
  window.__familyAppTaskCreateStayPatchV1 = true;

  function isTaskCreate(){
    return typeof currentAddType !== 'undefined' && currentAddType === 'task';
  }

  function stayOnTasks(){
    try {
      if (typeof showScreen === 'function') showScreen('tasks');
      var taskScreen = document.getElementById('screen-tasks');
      if (taskScreen) {
        document.querySelectorAll('.screen').forEach(function(screen){ screen.classList.remove('active'); });
        taskScreen.classList.add('active');
      }
      var title = document.getElementById('hdr-title');
      if (title) title.textContent = 'Taken';
      if (typeof renderTasks === 'function') renderTasks();
      if (typeof updateStats === 'function') updateStats();
    } catch(e) {}
  }

  function persistWithoutReset(){
    try {
      if (window.AppState && typeof AppState.get === 'function') {
        var state = AppState.get();
        if (state) {
          state.tasks = taskData;
          state.taskNextId = taskNextId;
          state.recur = recurData;
          state.recurNextId = recurNextId;
          state.meta = state.meta || {};
          state.meta.lastSaved = new Date().toISOString();
          localStorage.setItem('familieapp_state_v024', JSON.stringify(state));
        }
      }
    } catch(e) {}
  }

  function saveTaskOnly(){
    var f1 = document.getElementById('f1');
    var val = f1 ? f1.value.trim() : '';
    if(!val){ if(typeof closeAdd === 'function') closeAdd(); stayOnTasks(); return; }

    if(taskTypeMode === 'eenmalig') {
      var who = [];
      if(wieShane) who.push('Shane');
      if(wieEsra) who.push('Esra');
      if(!who.length) who.push(myName);
      var date = (document.getElementById('f3') || {}).value || null;
      var prio = (document.getElementById('f4') || {}).value || 'med';
      taskData.unshift({id:taskNextId++, title:val, who:who, date:date, done:false, prio:prio});
      persistWithoutReset();
      if(typeof addActivity === 'function') addActivity('📋','#f0ede8',myName+' maakte taak "'+val+'" aan');
    } else {
      var who2 = [];
      if(wieRShane) who2.push('Shane');
      if(wieREsra) who2.push('Esra');
      if(!who2.length) who2.push(myName);
      var r = {id:'r'+recurNextId++, title:val, who:who2, freq:freqMode, days:[], streak:0, doneWeek:{}, doneDates:{}};
      if(freqMode === 'weekly') {
        document.querySelectorAll('#freq-days .day-pill.active').forEach(function(b){ r.days.push(b.dataset.day); });
        if(!r.days.length){ if(typeof showToast === 'function') showToast('Kies minimaal één dag'); return; }
        r.freqLabel = r.days.map(function(d){ return d.slice(0,2); }).join(', ');
      } else {
        var wkBtn = document.querySelector('[data-wk].active');
        var dayBtn = document.querySelector('#freq-month-days .day-pill.active');
        r.week = wkBtn ? parseInt(wkBtn.dataset.wk, 10) : 1;
        r.day = dayBtn ? dayBtn.dataset.day : 'maandag';
        r.weeks = freqMode === 'monthly2' ? [r.week, r.week + 2] : [r.week];
        r.freqLabel = 'Week '+r.week+' · '+r.day.slice(0,2);
      }
      recurData.push(r);
      persistWithoutReset();
      if(typeof addActivity === 'function') addActivity('🔁','#e8f5e3',myName+' voegde vaste taak "'+val+'" toe');
    }

    if(typeof renderTasks === 'function') renderTasks();
    if(typeof updateStats === 'function') updateStats();
    if(typeof closeAdd === 'function') closeAdd();
    taskTypeMode='eenmalig'; wieShane=true; wieEsra=false; wieRShane=true; wieREsra=false; freqMode='weekly';
    setTimeout(stayOnTasks, 0);
    setTimeout(stayOnTasks, 120);
  }

  function install(){
    if(typeof saveItem !== 'function' || saveItem.__taskStayPatched) return;
    var original = saveItem;
    saveItem = function(){
      if(isTaskCreate()) { saveTaskOnly(); return; }
      return original.apply(this, arguments);
    };
    saveItem.__taskStayPatched = true;
  }

  window.addEventListener('load', function(){ setTimeout(install, 250); setTimeout(install, 1000); });
  document.addEventListener('click', function(){ setTimeout(install, 50); }, true);
})();
