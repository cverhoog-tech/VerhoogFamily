'use strict';
const crypto=require('crypto');

function secret(){return process.env.GOOGLE_CALENDAR_TOKEN_SECRET||'';}
function key(){return crypto.createHash('sha256').update(secret()).digest();}
function parseCookies(req){
  const out={};String(req.headers.cookie||'').split(';').forEach(function(part){const i=part.indexOf('=');if(i<0)return;out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());});return out;
}
function decrypt(value){
  try{
    const raw=Buffer.from(String(value||''),'base64url');if(raw.length<29)return null;
    const iv=raw.subarray(0,12),tag=raw.subarray(12,28),data=raw.subarray(28),decipher=crypto.createDecipheriv('aes-256-gcm',key(),iv);
    decipher.setAuthTag(tag);return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');
  }catch(e){return null;}
}
async function accessToken(req){
  if(!process.env.GOOGLE_CALENDAR_CLIENT_ID||!process.env.GOOGLE_CALENDAR_CLIENT_SECRET||!secret())throw Object.assign(new Error('NOT_CONFIGURED'),{status:503});
  const cookies=parseCookies(req),refresh=decrypt(cookies.familyapp_google_calendar_rt);if(!refresh)throw Object.assign(new Error('NOT_CONNECTED'),{status:401});
  const body=new URLSearchParams({client_id:process.env.GOOGLE_CALENDAR_CLIENT_ID,client_secret:process.env.GOOGLE_CALENDAR_CLIENT_SECRET,refresh_token:refresh,grant_type:'refresh_token'});
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()});
  const data=await r.json();if(!r.ok||!data.access_token)throw Object.assign(new Error('TOKEN_REFRESH_FAILED'),{status:401,details:data});return data.access_token;
}
async function google(token,path,options){
  const opts=Object.assign({},options||{});opts.headers=Object.assign({'Authorization':'Bearer '+token,'Content-Type':'application/json'},opts.headers||{});
  const r=await fetch('https://www.googleapis.com/calendar/v3'+path,opts);
  let data=null;try{data=await r.json();}catch(e){}
  if(!r.ok)throw Object.assign(new Error('GOOGLE_API_ERROR'),{status:r.status,details:data});return data;
}
function pad(n){return String(n).padStart(2,'0');}
function addHour(date,time){
  const d=new Date(String(date)+'T'+String(time||'10:00')+':00');d.setHours(d.getHours()+1);
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())+':00';
}
function eventBody(event){
  event=event||{};const date=String(event.date||''),time=String(event.time||'').trim();if(!date)throw Object.assign(new Error('DATE_REQUIRED'),{status:400});
  const out={summary:String(event.title||'FamilyApp afspraak'),description:String(event.description||''),extendedProperties:{private:{familyAppEventId:String(event.id||'')}}};
  if(time){out.start={dateTime:date+'T'+time+':00',timeZone:'Europe/Amsterdam'};out.end={dateTime:addHour(date,time),timeZone:'Europe/Amsterdam'};}
  else{const d=new Date(date+'T00:00:00');d.setDate(d.getDate()+1);out.start={date:date};out.end={date:d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};}
  return out;
}
function calendarId(v){return encodeURIComponent(String(v||'primary'));}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    if(req.method==='DELETE'){
      res.setHeader('Set-Cookie','familyapp_google_calendar_rt=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
      return res.status(200).json({connected:false});
    }
    const token=await accessToken(req);
    if(req.method==='GET')return res.status(200).json({connected:true});
    if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
    const body=req.body&&typeof req.body==='object'?req.body:{};const action=body.action;
    if(action==='listCalendars'){
      const data=await google(token,'/users/me/calendarList?minAccessRole=writer&showHidden=false&maxResults=100');
      const items=(data.items||[]).filter(function(c){return c&&c.id;}).map(function(c){return{id:c.id,summary:c.summary||c.id,primary:!!c.primary,accessRole:c.accessRole};});
      return res.status(200).json({connected:true,calendars:items});
    }
    if(action==='create'){
      const data=await google(token,'/calendars/'+calendarId(body.calendarId)+'/events',{method:'POST',body:JSON.stringify(eventBody(body.event))});
      return res.status(200).json({eventId:data.id,htmlLink:data.htmlLink||'',updated:data.updated||''});
    }
    if(action==='update'){
      if(!body.eventId)return res.status(400).json({error:'EVENT_ID_REQUIRED'});
      const data=await google(token,'/calendars/'+calendarId(body.calendarId)+'/events/'+encodeURIComponent(String(body.eventId)),{method:'PUT',body:JSON.stringify(eventBody(body.event))});
      return res.status(200).json({eventId:data.id,htmlLink:data.htmlLink||'',updated:data.updated||''});
    }
    if(action==='delete'){
      if(!body.eventId)return res.status(400).json({error:'EVENT_ID_REQUIRED'});
      const r=await fetch('https://www.googleapis.com/calendar/v3/calendars/'+calendarId(body.calendarId)+'/events/'+encodeURIComponent(String(body.eventId)),{method:'DELETE',headers:{Authorization:'Bearer '+token}});
      if(!r.ok&&r.status!==404){let details=null;try{details=await r.json();}catch(e){}throw Object.assign(new Error('GOOGLE_API_ERROR'),{status:r.status,details:details});}
      return res.status(200).json({deleted:true});
    }
    return res.status(400).json({error:'UNKNOWN_ACTION'});
  }catch(err){
    const status=err&&err.status||500;
    if(status===401)res.setHeader('Set-Cookie','familyapp_google_calendar_rt=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    res.status(status).json({error:err&&err.message||'GOOGLE_CALENDAR_FAILED',details:err&&err.details||null});
  }
};