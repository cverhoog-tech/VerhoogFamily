'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/modules/finance/financeAnalysisExport.js','utf8');
const window={
  FinanceStore:{get(){return{savingsGoals:[{name:'Buffer',target:5000,saved:1800}]};}},
  FinanceAnalysisAdvisor:{buildAdvice(){return{kind:'opportunity',headline:'Boodschappen valt het meest op',insight:'Boodschappen ligt EUR 184 hoger dan in de vergelijkingsperiode.',action:'Mik op ongeveer EUR 42 minder per week aan boodschappen.',meta:'Resultaat blijft positief.'};}}
};
const sandbox={window,Blob,console,Intl,Date,Number,String,Math,Array,Object,JSON,Promise,setTimeout,clearTimeout};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'financeAnalysisExport.js'});

const model={
  primary:{
    range:{start:'2026-08-01',end:'2026-08-31'},
    metrics:{income:3000,expenses:1868,netSavings:200,result:932,fixedExpenses:1225,variableExpenses:643,savingsRate:6.67},
    categories:[
      {category:'Wonen',amount:950,share:50.9},{category:'Boodschappen',amount:420,share:22.5},{category:'Vervoer',amount:210,share:11.2},
      {category:'Vrije tijd',amount:150,share:8},{category:'Abonnementen',amount:88,share:4.7},{category:'Overig',amount:50,share:2.7}
    ],
    savings:{currentSaved:1800,target:5000,goalProgress:36,net:200},
    receipts:{count:4,total:392}
  },
  comparison:{range:{start:'2026-07-01',end:'2026-07-31'},metrics:{income:3000,expenses:1730,netSavings:150,result:1120}},
  deltas:{income:{absolute:0,percent:0},expenses:{absolute:138,percent:7.98},netSavings:{absolute:50,percent:33.3},result:{absolute:-188,percent:-16.8}},
  categories:[
    {category:'Boodschappen',current:420,previous:236,delta:184},{category:'Wonen',current:950,previous:950,delta:0},{category:'Vrije tijd',current:150,previous:80,delta:70},
    {category:'Vervoer',current:210,previous:250,delta:-40},{category:'Abonnementen',current:88,previous:88,delta:0},{category:'Overig',current:50,previous:126,delta:-76}
  ],
  insights:[
    {type:'increase',title:'Grootste stijging',category:'Boodschappen',amount:184},
    {type:'decrease',title:'Grootste daling',category:'Overig',amount:76},
    {type:'savings',title:'Netto gespaard',amount:200,rate:6.67}
  ]
};

(async function(){
  assert.strictEqual(window.FinanceAnalysisExport.version,'2.0.0');
  const blob=window.FinanceAnalysisExport.buildPdf(model);
  assert.strictEqual(blob.type,'application/pdf');
  const buf=Buffer.from(await blob.arrayBuffer());
  const pdf=buf.toString('latin1');
  assert.ok(buf.length>7000,'premium report should contain substantial two-page vector content');
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.ok(pdf.includes('/Count 2'),'premium export must contain two A4 pages');
  assert.ok(pdf.includes('Financiele analyse'));
  assert.ok(pdf.includes('Vergelijking & details'));
  assert.ok(pdf.includes('FAMILYAPP ASSISTENT'));
  assert.ok(pdf.includes('Boodschappen valt het meest op'),'advisor headline must be projected into export');
  assert.ok(pdf.includes('AANBEVOLEN ACTIE'));
  assert.ok(!pdf.includes('definitieve premium rapporttemplate volgt later'),'placeholder copy must be retired');
  console.log('STEP 8 premium finance PDF export contract: PASS');
})().catch(function(error){console.error(error);process.exit(1);});