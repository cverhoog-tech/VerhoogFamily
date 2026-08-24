'use strict';
const PushSender=require('../src/server/firebasePushSender.js');

function bearer(req){
  var raw=String(req&&req.headers&&(req.headers.authorization||req.headers.Authorization)||'');
  var match=raw.match(/^Bearer\s+(.+)$/i);return match?match[1].trim():'';
}
function body(req){
  if(req&&req.body&&typeof req.body==='object')return req.body;
  if(req&&typeof req.body==='string'){try{return JSON.parse(req.body);}catch(e){}}
  return{};
}
function reply(res,status,payload){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  return res.status(status).send(JSON.stringify(payload));
}

module.exports=async function handler(req,res){
  if(String(req&&req.method||'POST').toUpperCase()!=='POST'){
    try{res.setHeader('Allow','POST');}catch(e){}
    return reply(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  }
  try{
    var input=body(req);
    var result=await PushSender.sendCanonicalNotification({
      idToken:bearer(req),
      householdId:input.householdId,
      notificationId:input.notificationId
    });
    return reply(res,200,{ok:true,delivery:result});
  }catch(error){
    var status=Number(error&&error.status)||500;
    var code=String(error&&error.code||error&&error.message||'PUSH_SEND_FAILED');
    if(status>=500)console.error('[push-send]',code,error&&error.detail||'');
    return reply(res,status,{ok:false,error:code});
  }
};
