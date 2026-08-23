'use strict';
// ============================================================
// FINANCE ANALYSIS EXPORT v2.0.0
// Premium two-page A4 report for STEP 8 Analysis.
// Uses only the canonical FinanceAnalysisUI model + advisor/store state.
// ============================================================
(function(){
  if(window.FinanceAnalysisExport&&window.FinanceAnalysisExport.version==='2.0.0')return;
  var VERSION='2.0.0';

  function num(v){var n=Number(v);return Number.isFinite(n)?n:0;}
  function ascii(v){
    var s=String(v==null?'':v);
    if(s.normalize)s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return s.replace(/[\u2013\u2014\u2212]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^\x20-\x7E]/g,'');
  }
  function pdfText(v){return ascii(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
  function money(v){var n=Math.abs(num(v));return 'EUR '+n.toLocaleString('nl-NL',{minimumFractionDigits:0,maximumFractionDigits:0});}
  function signedMoney(v){var n=num(v);return(n>0?'+ ':n<0?'- ':'')+money(n);}
  function pct(v){var n=Number(v);return Number.isFinite(n)?(Math.round(n*10)/10).toLocaleString('nl-NL')+'%':'-';}
  function dateLabel(v){
    var p=String(v||'').split('-').map(Number);
    if(p.length!==3||!p[0]||!p[1]||!p[2])return ascii(v);
    try{return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',year:'numeric'}).format(new Date(p[0],p[1]-1,p[2]));}catch(e){return ascii(v);}
  }
  function show(message){if(window.showToast)window.showToast(message);}
  function advisor(model){
    try{
      var a=window.FinanceAnalysisAdvisor;
      var state=window.FinanceStore&&window.FinanceStore.get?window.FinanceStore.get():{};
      return a&&typeof a.buildAdvice==='function'?a.buildAdvice(model,state):null;
    }catch(e){return null;}
  }

  function buildPdf(model){
    if(!model||!model.primary||!model.primary.metrics)throw new Error('Geen analysegegevens beschikbaar');
    var metrics=model.primary.metrics||{};
    var range=model.primary.range||{};
    var comparison=model.comparison||{};
    var comparisonRange=comparison.range||{};
    var categories=Array.isArray(model.primary.categories)?model.primary.categories.slice(0,6):[];
    var categoryComparisons=Array.isArray(model.categories)?model.categories.slice(0,8):[];
    var insights=Array.isArray(model.insights)?model.insights.slice(0,4):[];
    var savings=model.primary.savings||{};
    var receipts=model.primary.receipts||{};
    var deltas=model.deltas||{};
    var advice=advisor(model);
    var pages=[[],[]];

    var C={
      page:[.985,.980,.970],ink:[.13,.11,.17],muted:[.43,.39,.48],faint:[.61,.58,.65],line:[.90,.88,.92],white:[1,1,1],
      purple:[.48,.30,.82],purple2:[.62,.46,.93],purpleSoft:[.952,.932,.993],green:[.20,.56,.36],greenSoft:[.925,.975,.945],
      red:[.78,.27,.34],redSoft:[.995,.935,.945],gold:[.78,.57,.24],blue:[.29,.58,.83]
    };
    var palette=[[.93,.40,.52],[.58,.45,.92],[.30,.65,.86],[.28,.70,.52],[.90,.63,.22],[.94,.49,.32]];

    function rgb(c){return c.map(function(v){return Math.max(0,Math.min(1,Number(v)||0)).toFixed(3);}).join(' ');}
    function cmd(page,s){pages[page].push(s);}
    function fillRect(page,x,y,w,h,c){cmd(page,rgb(c)+' rg '+x+' '+y+' '+w+' '+h+' re f');}
    function strokeRect(page,x,y,w,h,c,width){cmd(page,rgb(c)+' RG '+(width||1)+' w '+x+' '+y+' '+w+' '+h+' re S');}
    function line(page,x1,y1,x2,y2,c,width){cmd(page,rgb(c)+' RG '+(width||1)+' w '+x1+' '+y1+' m '+x2+' '+y2+' l S');}
    function text(page,x,y,size,value,bold,c){cmd(page,'BT /'+(bold?'F2':'F1')+' '+size+' Tf '+rgb(c||C.ink)+' rg '+x+' '+y+' Td ('+pdfText(value)+') Tj ET');}
    function textRight(page,right,y,size,value,bold,c){
      var s=ascii(value),approx=s.length*size*.49;text(page,Math.max(38,right-approx),y,size,s,bold,c);
    }
    function wrapLines(value,maxWidth,size,maxLines){
      var words=ascii(value).split(/\s+/).filter(Boolean),lines=[],lineText='',limit=Math.max(10,Math.floor(maxWidth/(size*.50)));
      words.forEach(function(word){
        if(lines.length>=maxLines)return;
        var candidate=lineText?lineText+' '+word:word;
        if(candidate.length<=limit){lineText=candidate;return;}
        if(lineText){lines.push(lineText);lineText='';}
        if(lines.length>=maxLines)return;
        if(word.length>limit){lines.push(word.slice(0,Math.max(1,limit-1))+'-');lineText=word.slice(Math.max(1,limit-1));}
        else lineText=word;
      });
      if(lineText&&lines.length<maxLines)lines.push(lineText);
      if(words.length&&lines.length===maxLines){
        var consumed=lines.join(' ').length;
        if(consumed<ascii(value).length-4)lines[maxLines-1]=lines[maxLines-1].replace(/[. ]*$/,'')+'...';
      }
      return lines;
    }
    function paragraph(page,x,y,w,size,value,bold,c,lineHeight,maxLines){
      var lines=wrapLines(value,w,size,maxLines||4),lh=lineHeight||size*1.35;
      lines.forEach(function(row,i){text(page,x,y-i*lh,size,row,bold,c);});
      return y-lines.length*lh;
    }
    function pill(page,x,y,label,bg,fg){
      var w=Math.max(56,ascii(label).length*4.8+18);fillRect(page,x,y,w,20,bg);text(page,x+9,y+6,8,label,true,fg);return w;
    }
    function card(page,x,y,w,h,bg){fillRect(page,x,y,w,h,bg||C.white);strokeRect(page,x,y,w,h,C.line,.8);}
    function footer(page,index){
      line(page,38,48,557,48,C.line,.8);
      text(page,38,31,7,'FamilyApp Finance - prive analyse-export',true,C.faint);
      textRight(page,557,31,7,'Pagina '+index+' van 2',true,C.faint);
    }
    function brandMark(page,x,y){
      fillRect(page,x,y,14,14,C.purple);
      fillRect(page,x+4,y+4,6,6,C.white);
    }
    function deltaCopy(key){
      var d=deltas[key]||{},n=num(d.absolute),p=d.percent;
      if(!n)return 'Gelijk aan vorige periode';
      var direction=n>0?'hoger':'lager';
      return signedMoney(n)+' '+direction+(p==null?'':' ('+pct(p)+')')+' vs. vorige periode';
    }

    // ---------------- PAGE 1: executive summary ----------------
    fillRect(0,0,0,595,842,C.page);
    fillRect(0,0,706,595,136,[.947,.928,.985]);
    fillRect(0,0,706,8,136,C.purple);
    fillRect(0,430,706,165,136,[.936,.965,.949]);
    brandMark(0,38,783);
    text(0,60,786,8,'FAMILYAPP / FINANCE',true,[.43,.32,.61]);
    text(0,38,753,25,'Financiele analyse',true,C.ink);
    text(0,38,731,10,dateLabel(range.start)+' - '+dateLabel(range.end),false,C.muted);
    text(0,38,714,8,'Vergelijking: '+dateLabel(comparisonRange.start)+' - '+dateLabel(comparisonRange.end),false,C.faint);

    var resultPositive=num(metrics.result)>=0;
    text(0,400,760,8,resultPositive?'PERIODERESULTAAT':'TEKORT',true,C.muted);
    textRight(0,555,734,24,(resultPositive?'':'- ')+money(metrics.result),true,resultPositive?C.green:C.red);
    pill(0,435,705,resultPositive?'POSITIEVE RUIMTE':'AANDACHT NODIG',resultPositive?C.greenSoft:C.redSoft,resultPositive?C.green:C.red);

    var kpis=[
      {x:38,label:'INKOMSTEN',value:money(metrics.income),delta:deltaCopy('income'),bg:C.greenSoft,fg:C.green},
      {x:211,label:'UITGAVEN',value:money(metrics.expenses),delta:deltaCopy('expenses'),bg:C.redSoft,fg:C.red},
      {x:384,label:'NETTO SPAREN',value:signedMoney(metrics.netSavings),delta:deltaCopy('netSavings'),bg:C.purpleSoft,fg:C.purple}
    ];
    kpis.forEach(function(k){
      card(0,k.x,626,157,64,k.bg);
      text(0,k.x+12,672,7.5,k.label,true,C.muted);
      text(0,k.x+12,649,15,k.value,true,k.fg);
      paragraph(0,k.x+12,635,133,6.7,k.delta,false,C.faint,8,2);
    });

    text(0,38,592,14,'Waar gaat het geld naartoe?',true,C.ink);
    text(0,38,577,8,'Topcategorieen binnen de geselecteerde periode',false,C.muted);
    var y=548,max=categories.length?Math.max.apply(null,categories.map(function(r){return num(r.amount);})):1;
    categories.forEach(function(row,i){
      var amount=num(row.amount),ratio=Math.max(0,Math.min(1,max?amount/max:0)),color=palette[i%palette.length];
      text(0,38,y+5,8.5,row.category||'Overig',true,C.ink);
      textRight(0,557,y+5,8.5,money(amount)+'  '+pct(row.share),true,C.muted);
      fillRect(0,38,y-8,519,8,[.925,.915,.940]);
      fillRect(0,38,y-8,Math.max(5,519*ratio),8,color);
      y-=34;
    });
    if(!categories.length){text(0,38,y,9,'Nog geen uitgaven in deze periode.',false,C.muted);y-=32;}

    var adviceY=Math.min(y-4,320);
    card(0,38,adviceY-190,519,190,[.970,.958,.990]);
    pill(0,52,adviceY-30,'FAMILYAPP ASSISTENT',C.purple,C.white);
    if(advice){
      text(0,52,adviceY-57,12,advice.headline||'Persoonlijk inzicht',true,C.ink);
      var afterInsight=paragraph(0,52,adviceY-76,485,8.5,advice.insight||'',false,C.muted,12,2);
      text(0,52,afterInsight-7,7.5,'AANBEVOLEN ACTIE',true,C.purple);
      var afterAction=paragraph(0,52,afterInsight-23,485,8.5,advice.action||'',true,C.ink,12,3);
      paragraph(0,52,afterAction-6,485,6.8,advice.meta||'',false,C.faint,10,1);
    }else{
      text(0,52,adviceY-57,12,'Analyse op basis van jullie echte Finance-data',true,C.ink);
      paragraph(0,52,adviceY-78,485,8.5,'Open de Analyse-weergave in FamilyApp voor een concrete aanbeveling op basis van de actuele geselecteerde periode.',false,C.muted,12,4);
    }
    footer(0,1);

    // ---------------- PAGE 2: detail and comparison ----------------
    fillRect(1,0,0,595,842,C.page);
    brandMark(1,38,788);
    text(1,60,791,8,'FAMILYAPP / VERDIEPING',true,[.43,.32,.61]);
    text(1,38,756,22,'Vergelijking & details',true,C.ink);
    text(1,38,736,9,'Huidige periode tegenover de ingestelde vergelijkingsperiode',false,C.muted);

    var detailCards=[
      {x:38,label:'VASTE LASTEN',value:money(metrics.fixedExpenses),fg:C.red,bg:[.995,.955,.960]},
      {x:168,label:'VARIABEL',value:money(metrics.variableExpenses),fg:C.gold,bg:[.995,.973,.940]},
      {x:298,label:'SPAARQUOTE',value:pct(metrics.savingsRate),fg:C.purple,bg:C.purpleSoft},
      {x:428,label:'BOODSCHAPPENBONNEN',value:String(num(receipts.count)),fg:C.blue,bg:[.940,.970,.995]}
    ];
    detailCards.forEach(function(k){card(1,k.x,670,119,50,k.bg);text(1,k.x+10,703,6.8,k.label,true,C.muted);text(1,k.x+10,682,13,k.value,true,k.fg);});

    text(1,38,636,14,'Categorievergelijking',true,C.ink);
    text(1,38,621,8,'Huidig, vorige periode en verschil',false,C.muted);
    fillRect(1,38,590,519,22,[.943,.935,.958]);
    text(1,48,598,7,'CATEGORIE',true,C.muted);
    textRight(1,335,598,7,'HUIDIG',true,C.muted);
    textRight(1,440,598,7,'VORIG',true,C.muted);
    textRight(1,547,598,7,'VERSCHIL',true,C.muted);
    var ty=568;
    categoryComparisons.slice(0,7).forEach(function(row,i){
      if(i%2===0)fillRect(1,38,ty-8,519,25,[.993,.990,.997]);
      text(1,48,ty,8,row.category||'Overig',true,C.ink);
      textRight(1,335,ty,8,money(row.current),false,C.ink);
      textRight(1,440,ty,8,money(row.previous),false,C.muted);
      var d=num(row.delta),dc=d>0?C.red:d<0?C.green:C.faint;
      textRight(1,547,ty,8,signedMoney(d),true,dc);
      ty-=27;
    });
    if(!categoryComparisons.length){text(1,48,ty,8,'Geen categoriegegevens beschikbaar.',false,C.muted);ty-=28;}

    var sy=ty-18;
    text(1,38,sy,14,'Sparen & buffer',true,C.ink);
    sy-=20;
    card(1,38,sy-76,519,76,[.965,.952,.990]);
    text(1,52,sy-17,7.5,'HUIDIG GESPAARD',true,C.muted);
    text(1,52,sy-40,15,money(savings.currentSaved),true,C.purple);
    text(1,210,sy-17,7.5,'DOELEN TOTAAL',true,C.muted);
    text(1,210,sy-40,15,money(savings.target),true,C.ink);
    text(1,384,sy-17,7.5,'NETTO DEZE PERIODE',true,C.muted);
    text(1,384,sy-40,15,signedMoney(savings.net),true,num(savings.net)>=0?C.green:C.red);
    var progress=Math.max(0,Math.min(1,num(savings.goalProgress)/100));
    fillRect(1,52,sy-61,491,7,[.886,.864,.915]);
    fillRect(1,52,sy-61,Math.max(progress?5:0,491*progress),7,C.purple2);
    textRight(1,543,sy-73,7,pct(savings.goalProgress)+' van spaardoelen',true,C.muted);

    var iy=sy-108;
    text(1,38,iy,14,'Kerninzichten',true,C.ink);
    iy-=21;
    var rendered=0;
    insights.slice(0,3).forEach(function(ins,i){
      var title=ins.title||ins.type||'Inzicht',copy='';
      if(ins.type==='increase')copy=(ins.category||'Categorie')+' was '+money(ins.amount)+' hoger dan vorige periode.';
      else if(ins.type==='decrease')copy=(ins.category||'Categorie')+' was '+money(ins.amount)+' lager dan vorige periode.';
      else if(ins.type==='savings')copy='Netto gespaard '+money(ins.amount)+'; spaarquote '+pct(ins.rate)+'.';
      else if(ins.type==='receipts')copy=String(ins.count||0)+' boodschappenbonnen; '+money(ins.amount)+' totaal.';
      else copy=ins.copy||'Automatisch berekend uit de geselecteerde Finance-data.';
      var h=46;
      card(1,38,iy-h+6,519,h,[.992,.988,.997]);
      fillRect(1,38,iy-h+6,5,h,palette[i%palette.length]);
      text(1,52,iy-10,9,title,true,C.ink);
      paragraph(1,52,iy-26,482,7.8,copy,false,C.muted,10,2);
      iy-=55;rendered++;
    });
    if(!rendered){
      card(1,38,iy-42,519,42,[.992,.988,.997]);
      text(1,52,iy-14,9,'Geen opvallende uitschieters',true,C.ink);
      text(1,52,iy-29,7.8,'De geselecteerde periode bevat geen extra kerninzichten.',false,C.muted);
      iy-=54;
    }

    if(iy>82){
      line(1,38,iy,557,iy,C.line,.8);iy-=22;
      text(1,38,iy,7.5,'RAPPORTNOTITIE',true,C.muted);
      paragraph(1,38,iy-16,519,7.5,'Dit rapport is automatisch samengesteld uit de geselecteerde Finance-periode. Bedragen en adviezen zijn een momentopname van de gegevens die op het moment van export in FamilyApp beschikbaar waren.',false,C.faint,10,3);
    }
    footer(1,2);

    var streams=pages.map(function(rows){return rows.join('\n')+'\n';});
    var objects=[];
    objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
    objects[2]='<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>';
    objects[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>';
    objects[4]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>';
    objects[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[6]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
    objects[7]='<< /Length '+streams[0].length+' >>\nstream\n'+streams[0]+'endstream';
    objects[8]='<< /Length '+streams[1].length+' >>\nstream\n'+streams[1]+'endstream';

    var pdf='%PDF-1.4\n%FamilyApp Premium Finance Report\n',offsets=[0];
    for(var i=1;i<=8;i++){offsets[i]=pdf.length;pdf+=i+' 0 obj\n'+objects[i]+'\nendobj\n';}
    var xref=pdf.length;
    pdf+='xref\n0 9\n0000000000 65535 f \n';
    for(var j=1;j<=8;j++)pdf+=String(offsets[j]).padStart(10,'0')+' 00000 n \n';
    pdf+='trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    return new Blob([pdf],{type:'application/pdf'});
  }

  function fallbackDownload(blob,filename){
    var url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1500);
    show('PDF opgeslagen - je kunt hem nu delen');
  }

  function exportAndShare(model){
    try{
      var blob=buildPdf(model);
      var range=model&&model.primary&&model.primary.range||{};
      var stamp=range.end||new Date().toISOString().slice(0,10);
      var filename='FamilyApp-financiele-analyse-'+String(stamp).replace(/[^0-9-]/g,'')+'.pdf';
      if(typeof File==='function'&&navigator.share){
        var file=new File([blob],filename,{type:'application/pdf'}),payload={files:[file],title:'FamilyApp financiele analyse',text:'Financiele analyse uit FamilyApp'};
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