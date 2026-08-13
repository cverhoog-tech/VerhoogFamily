'use strict';
(function(){
  if(window.__calendarExternalHandoffV2)return;
  window.__calendarExternalHandoffV2=true;

  function removeLegacy(){
    var panel=document.getElementById('cal-sync-panel');if(panel)panel.remove();
    document.querySelectorAll('#screen-cal [onclick*="toggleCalSync"]').forEach(function(el){el.remove();});
  }

  function pad(n){return String(n).padStart(2,'0');}
  function nextHour(date,time){
    var d=new Date(date+'T'+(time||'10:00')+':00');d.setHours(d.getHours()+1);
    return {date:d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),time:pad(d.getHours())+':'+pad(d.getMinutes())};
  }
  function googleRange(e){
    var d=String(e.date||'').replace(/-/g,''),p=String(e.time||'10:00').split(':'),end=nextHour(e.date,e.time),ed=end.date.replace(/-/g,'');
    return d+'T'+pad(p[0]) + pad(p[1])+'00/'+ed+'T'+end.time.replace(':','')+'00';
  }
  function googleUrl(e){
    return 'https://calendar.google.com/calendar/r/eventedit?action=TEMPLATE&text='+encodeURIComponent(e.title||'Afspraak')+'&dates='+encodeURIComponent(googleRange(e))+'&details='+encodeURIComponent(e.description||'')+'&stz=Europe%2FAmsterdam&etz=Europe%2FAmsterdam';
  }
  function outlookUrl(e){
    var end=nextHour(e.date,e.time),start=e.date+'T'+(e.time||'10:00')+':00',finish=end.date+'T'+end.time+':00';
    return 'https://outlook.office.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject='+encodeURIComponent(e.title||'Afspraak')+'&startdt='+encodeURIComponent(start)+'&enddt='+encodeURIComponent(finish)+'&body='+encodeURIComponent(e.description||'')+'&allday=false';
  }
  function draft(){
    return {title:((document.getElementById('f1')||{}).value||'').trim(),date:((document.getElementById('f2')||{}).value||'').trim(),time:((document.getElementById('f3')||{}).value||'10:00').trim(),description:((document.getElementById('cal-description')||{}).value||'').trim()};
  }
  function openPlatform(kind){
    var e=draft();
    if(!e.title){if(window.showToast)showToast('Vul eerst een titel in');return;}
    if(!e.date){if(window.showToast)showToast('Kies eerst een datum');return;}
    window.open(kind==='outlook'?outlookUrl(e):googleUrl(e),'_blank','noopener');
  }
  function addFormButtons(){
    if(window.currentAddType!=='cal')return;
    var sheet=document.querySelector('#add-overlay .add-sheet'),main=document.querySelector('#add-overlay .sheet-btn');
    if(!sheet||!main||document.getElementById('cal-external-actions'))return;
    var wrap=document.createElement('div');wrap.id='cal-external-actions';wrap.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px';
    wrap.innerHTML='<button type="button" onclick="CalendarExternalHandoff.google()" style="border:1px solid #e5e7eb;background:#fff;color:#202124;border-radius:15px;padding:13px 10px;font-size:13px;font-weight:850;box-shadow:0 4px 14px rgba(17,24,39,.05)">Via Google Agenda</button><button type="button" onclick="CalendarExternalHandoff.outlook()" style="border:1px solid #dbe3f0;background:#f7f9fc;color:#0f4c81;border-radius:15px;padding:13px 10px;font-size:13px;font-weight:850;box-shadow:0 4px 14px rgba(17,24,39,.05)">Via Outlook</button>';
    main.insertAdjacentElement('afterend',wrap);
  }

  var oldOpenAdd=window.openAdd;
  if(typeof oldOpenAdd==='function')window.openAdd=function(type){var r=oldOpenAdd.apply(this,arguments);if(type==='cal')setTimeout(addFormButtons,20);return r;};

  function installDetailButtons(){
    if(!window.CalendarPremiumUi||window.CalendarPremiumUi.__externalV2)return false;
    var oldOpen=window.CalendarPremiumUi.open;if(typeof oldOpen!=='function')return false;
    window.CalendarPremiumUi.open=function(id){var r=oldOpen.apply(this,arguments);setTimeout(function(){var real=decodeURIComponent(String(id)),e=(window.calData||[]).find(function(v){return String(v.id)===real;}),actions=document.querySelector('#cal-detail-overlay .cal-detail-actions');if(!e||!actions||document.getElementById('cal-detail-external'))return;var row=document.createElement('div');row.id='cal-detail-external';row.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px';row.innerHTML='<a target="_blank" rel="noopener" href="'+googleUrl(e)+'" style="text-align:center;text-decoration:none;border:1px solid #e5e7eb;background:#fff;color:#202124;border-radius:15px;padding:13px 8px;font-size:12px;font-weight:850">Google Agenda</a><a target="_blank" rel="noopener" href="'+outlookUrl(e)+'" style="text-align:center;text-decoration:none;border:1px solid #dbe3f0;background:#f7f9fc;color:#0f4c81;border-radius:15px;padding:13px 8px;font-size:12px;font-weight:850">Outlook</a>';actions.parentNode.insertBefore(row,actions);},0);return r;};
    window.CalendarPremiumUi.__externalV2=true;return true;
  }

  window.CalendarExternalHandoff={google:function(){openPlatform('google');},outlook:function(){openPlatform('outlook');}};
  var tries=0,t=setInterval(function(){tries++;removeLegacy();installDetailButtons();if(tries>60)clearInterval(t);},100);
  removeLegacy();installDetailButtons();
})();