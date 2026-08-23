'use strict';
// ============================================================
// FINANCE ANALYSIS EXPORT v1.0.0
// Lightweight PDF/share foundation for STEP 8 Analysis.
// The visual report template is intentionally replaceable later.
// ============================================================
(function(){
  if(window.FinanceAnalysisExport)return;
  var VERSION='1.0.0';

  function num(v){var n=Number(v);return Number.isFinite(n)?n:0;}
  function ascii(v){
    var s=String(v==null?'':v);
    if(s.normalize)s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return s.replace(/[\u2013\u2014]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^\x20-\x7E]/g,'');
  }
  function pdfText(v){return ascii(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
  function money(v){
    var n=Math.abs(num(v));
    return 'EUR '+n.toLocaleString('nl-NL',{minimumFractionDigits:0,maximumFractionDigits:0});
  }
  function signedMoney(v){var n=num(v);return(n>0?'+ ':n<0?'- ':'')+money(n);}
  function pct(v){var n=Number(v);return Number.isFinite(n)?(Math.round(n*10)/10).toLocaleString('nl-NL')+'%':'-';}
  function dateLabel(v){
    var p=String(v||'').split('-').map(Number);
    if(p.length!==3||!p[0]||!p[1]||!p[2])return ascii(v);
    try{return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',year:'numeric'}).format(new Date(p[0],p[1]-1,p[2]));}catch(e){return ascii(v);}
  }
  function show(message){if(window.showToast)window.showToast(message);}

  function buildPdf(model){
    if(!model||!model.primary||!model.primary.metrics)throw new Error('Geen analysegegevens beschikbaar');
    var metrics=model.primary.metrics||{};
    var range=model.primary.range||{};
    var categories=Array.isArray(model.primary.categories)?model.primary.categories.slice(0,6):[];
    var insights=Array.isArray(model.insights)?model.insights.slice(0,3):[];
    var commands=[];

    function rgb(c){return c.map(function(v){return Math.max(0,Math.min(1,Number(v)||0)).toFixed(3);}).join(' ');}
    function fillRect(x,y,w,h,c){commands.push(rgb(c)+' rg '+x+' '+y+' '+w+' '+h+' re f');}
    function line(x1,y1,x2,y2,c,width){commands.push(rgb(c)+' RG '+(width||1)+' w '+x1+' '+y1+' m '+x2+' '+y2+' l S');}
    function text(x,y,size,value,bold,c){commands.push('BT /'+(bold?'F2':'F1')+' '+size+' Tf '+rgb(c||[.16,.14,.20])+' rg '+x+' '+y+' Td ('+pdfText(value)+') Tj ET');}

    // Page and brand hero.
    fillRect(0,0,595,842,[.985,.980,.970]);
    fillRect(38,708,519,100,[.955,.935,.995]);
    fillRect(38,708,7,100,[.545,.360,.930]);
    text(56,786,9,'FAMILYAPP / FINANCE',true,[.48,.38,.68]);
    text(56,760,23,'Analyse rapport',true,[.15,.13,.20]);
    text(56,741,10,dateLabel(range.start)+' - '+dateLabel(range.end),false,[.42,.39,.48]);
    text(425,762,10,metrics.result>=0?'RESULTAAT':'TEKORT',true,[.42,.39,.48]);
    text(425,741,18,(metrics.result<0?'- ':'')+money(metrics.result),true,metrics.result>=0?[.20,.55,.35]:[.78,.27,.34]);

    // KPI cards.
    var cards=[
      {x:38,label:'INKOMSTEN',value:money(metrics.income),bg:[.925,.975,.945],fg:[.20,.55,.35]},
      {x:211,label:'UITGAVEN',value:money(metrics.expenses),bg:[.995,.935,.945],fg:[.78,.27,.34]},
      {x:384,label:'NETTO SPAREN',value:signedMoney(metrics.netSavings),bg:[.950,.930,.995],fg:[.45,.29,.78]}
    ];
    cards.forEach(function(card){fillRect(card.x,642,157,52,card.bg);text(card.x+12,676,8,card.label,true,[.44,.41,.49]);text(card.x+12,655,15,card.value,true,card.fg);});

    text(38,608,14,'Uitgaven per categorie',true,[.15,.13,.20]);
    text(38,593,8,'Topcategorieen binnen de geselecteerde periode',false,[.45,.42,.49]);
    var y=568;
    var max=categories.length?Math.max.apply(null,categories.map(function(r){return num(r.amount);})):1;
    categories.forEach(function(row,i){
      var amount=num(row.amount),share=Math.max(0,Math.min(1,max?amount/max:0));
      text(38,y+4,9,row.category||'Overig',true,[.20,.18,.24]);
      text(434,y+4,9,money(amount)+'  '+pct(row.share),true,[.38,.35,.43]);
      fillRect(38,y-8,503,7,[.925,.915,.940]);
      var palette=[[.93,.40,.52],[.58,.45,.92],[.30,.65,.86],[.28,.70,.52],[.90,.63,.22],[.94,.49,.32]];
      fillRect(38,y-8,Math.max(4,503*share),7,palette[i%palette.length]);
      y-=34;
    });
    if(!categories.length){text(38,y,9,'Nog geen uitgaven in deze periode.',false,[.45,.42,.49]);y-=28;}

    y-=8;
    line(38,y,557,y,[.90,.88,.92],1);
    y-=28;
    text(38,y,14,'Kerninzichten',true,[.15,.13,.20]);
    y-=22;
    if(insights.length){
      insights.forEach(function(ins){
        var title=ins.title||ins.type||'Inzicht';
        var copy='';
        if(ins.type==='increase')copy=(ins.category||'Categorie')+' was '+money(ins.amount)+' hoger dan vorige periode.';
        else if(ins.type==='decrease')copy=(ins.category||'Categorie')+' was '+money(ins.amount)+' lager dan vorige periode.';
        else if(ins.type==='savings')copy='Netto gespaard '+money(ins.amount)+'; spaarquote '+pct(ins.rate)+'.';
        else if(ins.type==='receipts')copy=(ins.count||0)+' boodschappenbonnen; '+money(ins.amount)+' totaal.';
        else copy=ins.copy||'Automatisch berekend uit de geselecteerde Finance-data.';
        fillRect(38,y-20,519,34,[.973,.965,.985]);
        text(50,y,9,title,true,[.25,.20,.32]);
        text(50,y-13,8,copy,false,[.43,.40,.48]);
        y-=44;
      });
    } else {
      text(38,y,9,metrics.result>=0?'Positief resultaat in deze periode.':'Uitgaven liggen boven de inkomsten in deze periode.',false,[.43,.40,.48]);
      y-=24;
    }

    if(y>95){
      y-=8;
      line(38,y,557,y,[.90,.88,.92],1);
      y-=27;
      text(38,y,11,'Financiele details',true,[.15,.13,.20]);
      y-=18;
      text(38,y,8,'Vaste lasten: '+money(metrics.fixedExpenses)+'   Variabel: '+money(metrics.variableExpenses)+'   Spaarquote: '+pct(metrics.savingsRate),false,[.42,.39,.48]);
    }

    text(38,42,7,'Gegenereerd door FamilyApp. Dit is een functionele exportbasis; de definitieve premium rapporttemplate volgt later.',false,[.55,.52,.58]);

    var stream=commands.join('\n')+'\n';
    var objects=[];
    objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
    objects[2]='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
    objects[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>';
    objects[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
    objects[6]='<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream';

    var pdf='%PDF-1.4\n%FamilyApp\n';
    var offsets=[0];
    for(var i=1;i<=6;i++){offsets[i]=pdf.length;pdf+=i+' 0 obj\n'+objects[i]+'\nendobj\n';}
    var xref=pdf.length;
    pdf+='xref\n0 7\n0000000000 65535 f \n';
    for(var j=1;j<=6;j++)pdf+=String(offsets[j]).padStart(10,'0')+' 00000 n \n';
    pdf+='trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    return new Blob([pdf],{type:'application/pdf'});
  }

  function fallbackDownload(blob,filename){
    var url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1500);
    show('PDF opgeslagen — je kunt hem nu delen');
  }

  function exportAndShare(model){
    try{
      var blob=buildPdf(model);
      var range=model&&model.primary&&model.primary.range||{};
      var stamp=range.end||new Date().toISOString().slice(0,10);
      var filename='FamilyApp-analyse-'+String(stamp).replace(/[^0-9-]/g,'')+'.pdf';
      if(typeof File==='function'&&navigator.share){
        var file=new File([blob],filename,{type:'application/pdf'}),payload={files:[file],title:'FamilyApp analyse',text:'Financiele analyse uit FamilyApp'};
        var can=true;
        if(navigator.canShare){try{can=navigator.canShare({files:[file]});}catch(e){can=false;}}
        if(can){
          return navigator.share(payload).catch(function(error){
            if(error&&error.name==='AbortError')return;
            fallbackDownload(blob,filename);
          });
        }
      }
      fallbackDownload(blob,filename);
      return Promise.resolve();
    }catch(error){
      console.error('[FinanceAnalysisExport] export failed',error);
      show('PDF maken is niet gelukt');
      return Promise.reject(error);
    }
  }

  window.FinanceAnalysisExport={version:VERSION,buildPdf:buildPdf,exportAndShare:exportAndShare};
})();
