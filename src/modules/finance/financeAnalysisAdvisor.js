'use strict';
// ============================================================
// FINANCE ANALYSIS ADVISOR v1.0.1
// Deterministic, explainable recommendations built from the same STEP 8
// analysis model and canonical FinanceStore state. No external AI call.
// ============================================================
(function(){
  if(window.FinanceAnalysisAdvisor)return;
  var VERSION='1.0.1';
  var STYLE_ID='finance-analysis-advisor-style';
  var scheduled=false,installed=false;

  function num(v){v=Number(v);return Number.isFinite(v)?v:0;}
  function money(v){return '€ '+Math.round(Math.abs(num(v))).toLocaleString('nl-NL');}
  function pct(v){return Number.isFinite(Number(v))?(Math.round(Number(v)*10)/10).toLocaleString('nl-NL')+'%':'—';}
  function state(){return window.FinanceStore&&typeof FinanceStore.get==='function'?FinanceStore.get():{};}
  function model(){return window.FinanceAnalysisUI&&typeof FinanceAnalysisUI.getModel==='function'?FinanceAnalysisUI.getModel():null;}
  function rangeDays(m){return Math.max(1,num(m&&m.primary&&m.primary.range&&m.primary.range.days)||30);}
  function perWeek(amount,m){return Math.max(0,num(amount))*7/rangeDays(m);}

  function biggestIncrease(m){
    return (m&&Array.isArray(m.categories)?m.categories:[])
      .filter(function(row){return num(row&&row.delta)>0;})
      .sort(function(a,b){return num(b.delta)-num(a.delta);})[0]||null;
  }
  function biggestDecrease(m){
    return (m&&Array.isArray(m.categories)?m.categories:[])
      .filter(function(row){return num(row&&row.delta)<0;})
      .sort(function(a,b){return num(a.delta)-num(b.delta);})[0]||null;
  }
  function closestOpenGoal(s){
    var goals=Array.isArray(s&&s.savingsGoals)?s.savingsGoals:[];
    return goals.map(function(g){
      var target=Math.max(0,num(g&&g.target)),saved=Math.max(0,num(g&&g.saved));
      return{goal:g,remaining:Math.max(0,target-saved),target:target,saved:saved};
    }).filter(function(x){return x.target>0&&x.remaining>0;})
      .sort(function(a,b){return a.remaining-b.remaining;})[0]||null;
  }

  function buildAdvice(m,s){
    if(!m||!m.primary||!m.primary.metrics){
      return{kind:'neutral',headline:'Nog geen analyse beschikbaar',insight:'Ik heb nog geen geldige periode om te beoordelen.',action:'Open een periode met financiële gegevens om een concrete aanbeveling te krijgen.',meta:'Geen berekening uitgevoerd.'};
    }
    var metrics=m.primary.metrics||{};
    var expenses=num(metrics.expenses),income=num(metrics.income),result=num(metrics.result),netSavings=num(metrics.netSavings);
    var inc=biggestIncrease(m),dec=biggestDecrease(m),days=rangeDays(m);
    var hasData=expenses>0||income>0||(m.primary.flows&&m.primary.flows.length);
    if(!hasData){
      return{kind:'neutral',headline:'Nog te weinig data voor advies',insight:'In deze periode staan nog geen inkomsten of uitgaven om betrouwbaar te vergelijken.',action:'Voeg transacties toe of kies een periode met bestaande Finance-data.',meta:'Gebaseerd op de geselecteerde analyseperiode.'};
    }

    if(result<0){
      var gap=Math.abs(result),weeklyGap=perWeek(gap,m);
      if(inc&&num(inc.delta)>0){
        var recover=Math.min(gap,num(inc.delta));
        var remain=Math.max(0,gap-recover);
        return{
          kind:'warning',
          headline:(inc.category||'Een categorie')+' is je grootste kans om bij te sturen',
          insight:'Je komt in deze periode '+money(gap)+' tekort. '+(inc.category||'Deze categorie')+' ligt '+money(inc.delta)+' hoger dan in de vergelijkingsperiode.',
          action:'Als je '+(inc.category||'deze categorie')+' terugbrengt richting het vorige niveau, vang je ongeveer '+money(recover)+' van het tekort op'+(remain>1?' en blijft circa '+money(remain)+' over om elders op te vangen.':'.'),
          meta:'Break-even vraagt in een vergelijkbare periode ongeveer '+money(weeklyGap)+' minder uitgaven per week.'
        };
      }
      return{
        kind:'warning',
        headline:'Je periode eindigt onder nul',
        insight:'Na uitgaven en sparen is het resultaat '+money(gap)+' negatief.',
        action:'Om in een vergelijkbare periode break-even te draaien, mik op ongeveer '+money(weeklyGap)+' minder uitgaven per week.',
        meta:'Berekend over '+days+' dagen.'
      };
    }

    var spikeThreshold=Math.max(50,expenses*.05);
    if(inc&&num(inc.delta)>=spikeThreshold){
      var weeklyCut=perWeek(inc.delta,m);
      return{
        kind:'opportunity',
        headline:(inc.category||'Een categorie')+' valt het meest op',
        insight:(inc.category||'Deze categorie')+' ligt '+money(inc.delta)+' hoger dan in de vergelijkingsperiode'+(inc.deltaPercent!=null?' ('+pct(inc.deltaPercent)+')':'')+'.',
        action:'Wil je terug naar het vorige niveau, dan is dat in een vergelijkbare periode ongeveer '+money(weeklyCut)+' minder per week aan '+(inc.category||'deze categorie')+'.',
        meta:'Je totale resultaat blijft '+money(result)+' positief.'
      };
    }

    var goal=closestOpenGoal(s);
    if(result>0&&goal){
      var reserve=Math.min(result,goal.remaining);
      var left=Math.max(0,result-reserve);
      return{
        kind:'positive',
        headline:'Je hebt ruimte om een spaardoel dichterbij te brengen',
        insight:'Je houdt '+money(result)+' over. Voor '+String(goal.goal&&goal.goal.name||'je dichtstbijzijnde spaardoel')+' ontbreekt nog '+money(goal.remaining)+'.',
        action:'Als dat past bij jullie planning, kun je tot '+money(reserve)+' uit deze vrije ruimte naar dit doel zetten zonder deze periode negatief te maken'+(left>1?'; er blijft dan '+money(left)+' vrije ruimte over.':'.'),
        meta:'Advies gebruikt alleen het huidige resultaat en jullie ingestelde spaardoelen.'
      };
    }

    if(result>0&&netSavings<=0){
      return{
        kind:'positive',
        headline:'Er is vrije ruimte, maar nog geen netto spaarbeweging',
        insight:'Je houdt '+money(result)+' over en hebt in deze periode niet netto gespaard.',
        action:'Je kunt een deel van deze '+money(result)+' reserveren of eerst een spaardoel aanmaken; elke reservering tot dit bedrag houdt het perioderesultaat boven nul.',
        meta:'Gebaseerd op resultaat na inkomsten en uitgaven.'
      };
    }

    if(dec&&Math.abs(num(dec.delta))>=Math.max(35,expenses*.03)){
      return{
        kind:'positive',
        headline:'Deze daling werkt in jullie voordeel',
        insight:(dec.category||'Een categorie')+' is '+money(Math.abs(dec.delta))+' lager dan in de vergelijkingsperiode.',
        action:'Als dit niveau realistisch is, probeer het vast te houden; dat verschil draagt direct bij aan meer vrije ruimte in een vergelijkbare periode.',
        meta:'Huidig perioderesultaat: '+money(result)+'.'
      };
    }

    return{
      kind:'neutral',
      headline:'Je financiën zijn relatief stabiel',
      insight:'Er is geen grote categorie-afwijking die boven de ingestelde signaleringsgrens uitkomt.',
      action:result>0?'Je houdt '+money(result)+' over. Gebruik die ruimte bewust voor buffer, sparen of geplande uitgaven.':'Blijf de grootste uitgavencategorieën volgen zodra er meer vergelijkingsdata beschikbaar is.',
      meta:'De Assistent vergelijkt de geselecteerde periode met de ingestelde vergelijkingsperiode.'
    };
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    var css=document.createElement('style');css.id=STYLE_ID;css.textContent=[
      '#fin-analyse .fa2-assistant-copy{min-width:0}',
      '#fin-analyse .fa2-advisor-title{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
      '#fin-analyse .fa2-advisor-badge{display:inline-flex;align-items:center;border-radius:999px;padding:3px 6px;background:rgba(139,92,246,.12);color:var(--fa2-purple);font-size:7.5px;font-weight:950;letter-spacing:.06em;text-transform:uppercase}',
      '#fin-analyse .fa2-advisor-headline{font-size:10.5px;font-weight:950;color:var(--fa2-text);line-height:1.35;margin-top:4px}',
      '#fin-analyse .fa2-advisor-insight{font-size:9.2px;line-height:1.45;color:var(--fa2-muted);margin-top:3px}',
      '#fin-analyse .fa2-advisor-action{margin-top:7px;padding:8px 9px;border-radius:11px;border:1px solid rgba(139,92,246,.13);background:rgba(255,255,255,.58)}',
      '#fin-analyse .fa2-advisor-action-label{font-size:7.5px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:var(--fa2-purple);margin-bottom:3px}',
      '#fin-analyse .fa2-advisor-action-copy{font-size:9.3px;line-height:1.43;font-weight:800;color:var(--fa2-text)}',
      '#fin-analyse .fa2-advisor-meta{font-size:7.8px;line-height:1.35;color:var(--fa2-faint);margin-top:5px}',
      '#fin-analyse .fa2-assistant[data-advice-kind="warning"] .fa2-advisor-badge{background:rgba(220,102,119,.13);color:var(--fa2-red)}',
      '#fin-analyse .fa2-assistant[data-advice-kind="warning"] .fa2-advisor-action{border-color:rgba(220,102,119,.14);background:rgba(220,102,119,.055)}',
      '#fin-analyse .fa2-assistant[data-advice-kind="positive"] .fa2-advisor-badge{background:rgba(69,166,107,.13);color:var(--fa2-green)}',
      '#fin-analyse .fa2-assistant[data-advice-kind="positive"] .fa2-advisor-action{border-color:rgba(69,166,107,.14);background:rgba(69,166,107,.055)}',
      'html[data-theme="dark"] #fin-analyse .fa2-advisor-action,html[data-theme$="-dark"] #fin-analyse .fa2-advisor-action{background:rgba(255,255,255,.04)}'
    ].join('\n');document.head.appendChild(css);
  }

  function appendText(parent,className,text){var el=document.createElement('div');el.className=className;el.textContent=text;parent.appendChild(el);return el;}
  function decorate(){
    scheduled=false;ensureStyles();
    var root=document.getElementById('fin-analyse');
    var card=root&&root.querySelector('.fa2-assistant');
    var copy=card&&card.querySelector('.fa2-assistant-copy');
    var m=model();
    if(!card||!copy||!m)return false;
    var advice=buildAdvice(m,state());
    card.setAttribute('data-advice-kind',advice.kind||'neutral');
    copy.innerHTML='';
    var title=document.createElement('div');title.className='fa2-advisor-title';
    var name=document.createElement('b');name.textContent='FamilyApp Assistent';title.appendChild(name);
    var badge=document.createElement('span');badge.className='fa2-advisor-badge';badge.textContent=advice.kind==='warning'?'Let op':advice.kind==='positive'?'Kans':advice.kind==='opportunity'?'Inzicht':'Advies';title.appendChild(badge);
    copy.appendChild(title);
    appendText(copy,'fa2-advisor-headline',advice.headline);
    appendText(copy,'fa2-advisor-insight',advice.insight);
    var action=document.createElement('div');action.className='fa2-advisor-action';
    appendText(action,'fa2-advisor-action-label','Aanbevolen actie');
    appendText(action,'fa2-advisor-action-copy',advice.action);
    copy.appendChild(action);
    appendText(copy,'fa2-advisor-meta',advice.meta);
    return true;
  }

  function schedule(){if(scheduled)return;scheduled=true;setTimeout(decorate,0);setTimeout(decorate,90);}
  function wrapUi(){
    var ui=window.FinanceAnalysisUI;
    if(!ui||ui.__advisorWrapped)return;
    ui.__advisorWrapped=true;
    if(typeof ui.render==='function'){
      var originalRender=ui.render;
      ui.render=function(){var result=originalRender.apply(this,arguments);schedule();return result;};
    }
    if(typeof ui.requestRender==='function'){
      var originalRequest=ui.requestRender;
      ui.requestRender=function(){var result=originalRequest.apply(this,arguments);schedule();return result;};
    }
  }
  function install(){
    if(installed){wrapUi();schedule();return;}
    installed=true;
    ensureStyles();wrapUi();schedule();
    window.addEventListener('familyapp:finance:changed',schedule);
    window.addEventListener('familyapp:household-members-updated',schedule);
    document.addEventListener('click',function(event){if(event.target&&event.target.closest&&event.target.closest('#fin-analyse,#finance-native-tabs'))schedule();},true);
    document.addEventListener('change',function(event){if(event.target&&event.target.closest&&event.target.closest('#fin-analyse'))schedule();},true);
    [120,400,900,1600].forEach(function(ms){setTimeout(function(){wrapUi();decorate();},ms);});
  }

  window.FinanceAnalysisAdvisor={version:VERSION,buildAdvice:buildAdvice,decorate:decorate,install:install};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();