'use strict';
// Canonical Taken overview: the former v023 overview is no longer reachable.
// "Overzicht" now always renders the premium compact task view.
function renderTasks() {
  var el=document.getElementById('task-content');
  if(!el)return;
  if(taskTab==='overzicht') taskTab='compact';
  if(taskTab==='persoon') renderTasksPersoon(el);
  else if(taskTab==='compact' && window.TaskCompactHome) window.TaskCompactHome.render(el);
}

function setTaskTab(tab, btn) {
  if(tab==='overzicht') tab='compact';
  taskTab=tab;
  document.querySelectorAll('.ttab').forEach(function(b){b.classList.remove('active');});
  if(btn) btn.classList.add('active');
  renderTasks();
}

function renderTasksOverzicht(el) {
  taskTab='compact';
  if(window.TaskCompactHome) window.TaskCompactHome.render(el||document.getElementById('task-content'));
}
