'use strict';
(function(){
  if(window.__calendarSimpleGoogleV1)return;
  window.__calendarSimpleGoogleV1=true;
  function removeLegacy(){
    var panel=document.getElementById('cal-sync-panel');if(panel)panel.remove();
    document.querySelectorAll('#screen-cal [onclick*="toggleCalSync"]').forEach(function(el){el.remove();});
  }
  function dateRange(e){
    var d=String(e.date||'').replace(/-/g,'');
    if(!e.time)return d+'/'+d;
    var p=String(e.time).split(':');
    var mins=(parseInt(p[0]||'0',10)*60)+parseInt(p[1]||'0',10);
    var end=mins+60;
    function hm(v){return String(Math.floor(v/60)).padStart(2,'0')+String(v%60).padStart(2,'0')+'00';}
    return d+'T'+hm(mins)+'/'+d+'T'+hm(end);
  }
  function googleUrl(e){
    return ['https://calendar.google.com','/calendar/render?action=TEMPLATE','&text=',encodeURIComponent(e.title||'Afspraak'),'&dates=',encodeURIComponent(dateRange(e)),'&details=',encodeURIComponent(e.description||'')].join('');
  }
  function install(){
    removeLegacy();
    if(!window.CalendarPremiumUi||window.CalendarPremiumUi.__simpleGoogle)return false;
    var oldOpen=window.CalendarPremiumUi.open;
    if(typeof oldOpen!=='function')return false;
    window.CalendarPremiumUi.open=function(id){
      var r=oldOpen.apply(this,arguments);
      setTimeout(function(){
        var real=decodeURIComponent(String(id));
        var e=(window.calData||[]).find(function(v){return String(v.id)===real;});
        var actions=document.querySelector('#cal-detail-overlay .cal-detail-actions');
        if(!e||!actions||document.getElementById('cal-google-btn'))return;
        var a=document.createElement('a');
        a.id='cal-google-btn';a.href=googleUrl(e);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Toevoegen aan Google Agenda';
        a.style.cssText='display:flex;align-items:center;justify-content:center;margin:0 0 10px;padding:14px 16px;border-radius:15px;text-decoration:none;background:#fff;color:#202124;border:1px solid #e5e7eb;font-size:13px;font-weight:850;box-shadow:0 5px 16px rgba(17,24,39,.07)';
        actions.parentNode.insertBefore(a,actions);
      },0);
      return r;
    };
    window.CalendarPremiumUi.__simpleGoogle=true;
    return true;
  }
  var tries=0,t=setInterval(function(){tries++;if(install()||tries>60)clearInterval(t);},100);
  install();setTimeout(removeLegacy,500);
})();