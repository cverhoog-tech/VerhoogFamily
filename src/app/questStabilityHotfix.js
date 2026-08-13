(() => {
  if (window.__questStabilityHotfixV3) return;
  window.__questStabilityHotfixV3 = true;
  const RETURN_KEY='familyapp-return-to-tasks-after-create-v3';
  const STYLE_ID='quest-stability-hotfix-style-v3';
  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      .fqPage{padding-bottom:150px!important}
      .fqDoneWrap{position:fixed!important;left:50%!important;right:auto!important;bottom:calc(env(safe-area-inset-bottom,0px) + 12px)!important;transform:translateX(-50%)!important;width:calc(100% - 28px)!important;max-width:452px!important;z-index:99999!important;padding:10px!important;border-radius:24px!important;background:rgba(255,255,255,.14)!important;backdrop-filter:blur(22px) saturate(1.2)!important;-webkit-backdrop-filter:blur(22px) saturate(1.2)!important;box-shadow:0 18px 46px rgba(8,17,31,.26)!important;display:flex!important;justify-content:center!important;pointer-events:auto!important}
      .fqDoneWrap .fqDone,#fqDoneBtn{width:100%!important;max-width:none!important;min-height:58px!important;border-radius:18px!important;font-size:17px!important;font-weight:950!important;letter-spacing:-.02em!important}
      .fqDoneWrap .fqDone:not(.reopen),#fqDoneBtn:not(.reopen){background:linear-gradient(135deg,#3b82f6 0%,#2563eb 52%,#1d4ed8 100%)!important;color:#fff!important;border:0!important;box-shadow:0 14px 34px rgba(37,99,235,.34),inset 0 1px 0 rgba(255,255,255,.22)!important}
      .fqDoneWrap .fqDone.reopen,#fqDoneBtn.reopen{background:rgba(8,17,31,.78)!important;color:#fff!important;border:1px solid rgba(255,255,255,.20)!important;box-shadow:none!important}`;
    document.head.appendChild(style);
  }
  function taskVisible(){const h=document.querySelector('.header-title');return /taken|tasks/i.test((h&&h.textContent)||'')||!!document.querySelector('#task-content .tch-page,#task-content .fq,.task-tabs,.ttab');}
  function mark(){sessionStorage.setItem(RETURN_KEY,String(Date.now()));}
  function clear(){sessionStorage.removeItem(RETURN_KEY);}
  function restore(){const stamp=Number(sessionStorage.getItem(RETURN_KEY)||0);if(!stamp)return;if(Date.now()-stamp>8000){clear();return;}if(taskVisible()){clear();return;}const c=Array.from(document.querySelectorAll('button,.nav-btn,[role="button"],a'));const b=c.find(el=>/taken|tasks/i.test(el.textContent||'')||/task/i.test(el.getAttribute('data-screen')||''));if(b)b.click();setTimeout(()=>{if(taskVisible())clear();},180);}
  function closeCreate(){document.querySelectorAll('.add-overlay.open,.nav-config-overlay.open').forEach(el=>el.classList.remove('open'));document.body.style.overflow='';}
  document.addEventListener('click',e=>{const t=e.target&&e.target.closest?e.target.closest('button,.sheet-btn,.fqSave,input[type="submit"]'):null;if(!t)return;const text=(t.textContent||t.value||'').toLowerCase();const inCreate=!!t.closest('.add-sheet,.fqModal,.task-content,#task-content');if(!inCreate||!/opslaan|toevoegen|quest toevoegen|save|add quest|nieuwe quest/.test(text))return;mark();[100,320,800].forEach(d=>setTimeout(()=>{closeCreate();restore();},d));},true);
  window.addEventListener('load',injectStyle);injectStyle();
})();
