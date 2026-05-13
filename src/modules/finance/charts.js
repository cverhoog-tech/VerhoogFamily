'use strict';
// ============================================================
// SPAARGRAFIEK
// ============================================================
function renderSavingsChart(goal){
  if(!goal.log||goal.log.length<2)return '';
  var sorted=goal.log.slice().sort(function(a,b){return(a.date||'').localeCompare(b.date||'');});
  var points=[],running=0;
  sorted.forEach(function(l){running+=l.type==='deposit'?l.amount:-l.amount;points.push({date:l.date.substring(5),val:Math.max(0,running)});});
  if(!points.length)return '';
  var maxVal=Math.max(goal.target,running),W=280,H=80,padL=36,padB=16,innerW=W-padL-4,innerH=H-padB-4;
  var pathD=points.map(function(p,i){var x=padL+(i/(points.length-1||1))*innerW;var y=H-padB-(p.val/maxVal)*innerH;return(i===0?'M':'L')+x.toFixed(1)+','+y.toFixed(1);}).join(' ');
  var fillD=pathD+' L'+(padL+innerW).toFixed(1)+','+(H-padB)+' L'+padL+','+(H-padB)+' Z';
  var tc=cssVar('--c-text'),tc2=cssVar('--c-text2'),bc=cssVar('--c-border');
  return '<div style="padding:12px 16px 4px"><div style="font-size:11px;font-weight:700;color:'+tc2+';text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Spaargrafiek</div>'
    +'<svg width="100%" viewBox="0 0 '+W+' '+H+'" style="overflow:visible">'
    +'<line x1="'+padL+'" y1="4" x2="'+(W-4)+'" y2="4" stroke="'+bc+'" stroke-width=".5" stroke-dasharray="3,3"/>'
    +'<text x="'+(padL-2)+'" y="4" text-anchor="end" font-size="8" fill="'+tc2+'">€'+goal.target+'</text>'
    +'<path d="'+fillD+'" fill="'+goal.color+'" opacity=".15"/>'
    +'<path d="'+pathD+'" fill="none" stroke="'+goal.color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    +points.map(function(p,i){var x=padL+(i/(points.length-1||1))*innerW;var y=H-padB-(p.val/maxVal)*innerH;return'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="3" fill="'+goal.color+'"/>';}).join('')
    +'<text x="'+padL+'" y="'+H+'" text-anchor="start" font-size="8" fill="'+tc2+'">'+points[0].date+'</text>'
    +(points.length>1?'<text x="'+(padL+innerW)+'" y="'+H+'" text-anchor="end" font-size="8" fill="'+tc2+'">'+points[points.length-1].date+'</text>':'')
    +'</svg></div>';
}

