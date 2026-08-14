'use strict';
// ============================================================
// FINANCE MAANDPLAN PRIORITY v1.0.0
// Keeps frequently checked one-off income/expenses above fixed costs.
// Runs synchronously after the existing maandplan renderer; no timers or observers.
// ============================================================
(function(){
  if(window.FinanceMaandplanPriority)return;
  var VERSION='1.0.0';

  function text(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim();}

  function reorderOverview(panel){
    var rows=Array.prototype.slice.call(panel.querySelectorAll('div'));
    var oneOff=rows.filter(function(el){
      return text(el).indexOf('Eenmalige uitgaven')>-1 && el.parentElement && getComputedStyle(el.parentElement).flexDirection==='column';
    }).sort(function(a,b){return text(a).length-text(b).length;})[0];
    var fixed=rows.filter(function(el){
      return text(el).indexOf('Vaste lasten')>-1 && el.parentElement && oneOff && el.parentElement===oneOff.parentElement;
    }).sort(function(a,b){return text(a).length-text(b).length;})[0];
    if(oneOff&&fixed&&oneOff!==fixed&&fixed.parentNode===oneOff.parentNode){
      fixed.parentNode.insertBefore(oneOff,fixed);
    }
  }

  function reorderDetailSections(panel){
    var children=Array.prototype.slice.call(panel.children);
    var fixedHeader=children.find(function(el){return /^Vaste lasten\b/.test(text(el));});
    var oneOffHeader=children.find(function(el){return /^Eenmalig deze maand\b/.test(text(el));});
    if(!fixedHeader||!oneOffHeader||fixedHeader===oneOffHeader)return;
    if(children.indexOf(oneOffHeader)<children.indexOf(fixedHeader))return;

    // The legacy renderer currently ends with the one-off section. Move that
    // complete section as one ordered block before the fixed-cost checklist.
    var node=oneOffHeader;
    while(node){
      var next=node.nextSibling;
      panel.insertBefore(node,fixedHeader);
      node=next;
    }
  }

  function apply(){
    var panel=document.getElementById('fin-maandplan');
    if(!panel)return;
    reorderOverview(panel);
    reorderDetailSections(panel);
  }

  function install(){
    if(typeof window.renderMaandplan!=='function'||window.renderMaandplan._financePriorityWrapped)return false;
    var original=window.renderMaandplan;
    function wrapped(){var result=original.apply(this,arguments);apply();return result;}
    wrapped._financePriorityWrapped=true;
    wrapped._original=original;
    window.renderMaandplan=wrapped;
    apply();
    return true;
  }

  window.FinanceMaandplanPriority={version:VERSION,install:install,apply:apply};
})();