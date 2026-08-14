'use strict';
const crypto=require('crypto');

function tokenSecret(){return process.env.GOOGLE_CALENDAR_TOKEN_SECRET||'';}
function key(){return crypto.createHash('sha256').update(tokenSecret()).digest();}
function sign(value){return crypto.createHmac('sha256',tokenSecret()).update(value).digest('base64url');}
function encrypt(text){
  const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const encrypted=Buffer.concat([cipher.update(String(text),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return Buffer.concat([iv,tag,encrypted]).toString('base64url');
}
function parseCookies(req){
  const out={};String(req.headers.cookie||'').split(';').forEach(function(part){const i=part.indexOf('=');if(i<0)return;out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());});return out;
}
function origin(req){
  const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  return proto+'://'+host;
}
function verifyState(raw){
  const parts=String(raw||'').split('.');if(parts.length!==2)return null;
  const expected=sign(parts[0]);
  const a=Buffer.from(parts[1]),b=Buffer.from(expected);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
  try{const obj=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));if(!obj.exp||Date.now()>obj.exp)return null;return obj;}catch(e){return null;}
}
function safeReturnTo(v){const s=String(v||'/');return s.startsWith('/')&&!s.startsWith('//')?s:'/';}

module.exports=async function handler(req,res){
  const clientId=process.env.GOOGLE_CALENDAR_CLIENT_ID,clientSecret=process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  if(!clientId||!clientSecret||!tokenSecret())return res.status(503).send('Google Calendar is not configured.');
  const state=verifyState(req.query&&req.query.state),cookies=parseCookies(req);
  if(!state||!state.nonce||cookies.familyapp_google_oauth_state!==state.nonce)return res.status(400).send('Ongeldige Google Calendar koppel-flow.');
  if(req.query&&req.query.error){res.setHeader('Set-Cookie','familyapp_google_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');return res.redirect(302,safeReturnTo(state.returnTo)+'?googleCalendar=cancelled');}
  const code=String(req.query&&req.query.code||'');if(!code)return res.status(400).send('Google authorization code ontbreekt.');
  const redirectUri=process.env.GOOGLE_CALENDAR_REDIRECT_URI||(origin(req)+'/api/google-calendar-callback');
  const body=new URLSearchParams({code:code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,grant_type:'authorization_code'});
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()});
  const data=await response.json();
  if(!response.ok||!data.refresh_token)return res.status(400).send('Google Calendar koppelen is mislukt. Probeer opnieuw en geef toestemming.');
  const cookie='familyapp_google_calendar_rt='+encodeURIComponent(encrypt(data.refresh_token))+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=15552000';
  res.setHeader('Set-Cookie',[cookie,'familyapp_google_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0']);
  res.setHeader('Cache-Control','no-store');
  res.redirect(302,safeReturnTo(state.returnTo)+'?googleCalendar=connected');
};