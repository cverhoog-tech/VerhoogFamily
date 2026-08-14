'use strict';
const crypto=require('crypto');

function env(name){return String(process.env[name]||'').trim();}
function secret(){return env('GOOGLE_CALENDAR_TOKEN_SECRET');}
function sign(value){return crypto.createHmac('sha256',secret()).update(value).digest('base64url');}
function statePayload(returnTo,nonce){
  const body=Buffer.from(JSON.stringify({returnTo:returnTo||'/',exp:Date.now()+10*60*1000,nonce:nonce})).toString('base64url');
  return body+'.'+sign(body);
}
function origin(req){
  const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  return proto+'://'+host;
}
function safeReturnTo(v){
  const s=String(v||'/');
  return s.startsWith('/')&&!s.startsWith('//')?s:'/';
}

module.exports=async function handler(req,res){
  const clientId=env('GOOGLE_CALENDAR_CLIENT_ID');
  const clientSecret=env('GOOGLE_CALENDAR_CLIENT_SECRET');
  if(!clientId||!clientSecret||!secret()){
    return res.status(503).json({error:'GOOGLE_CALENDAR_NOT_CONFIGURED'});
  }
  const nonce=crypto.randomBytes(18).toString('base64url');
  const redirectUri=env('GOOGLE_CALENDAR_REDIRECT_URI')||(origin(req)+'/api/google-calendar-callback');
  const params=new URLSearchParams({
    client_id:clientId,
    redirect_uri:redirectUri,
    response_type:'code',
    access_type:'offline',
    prompt:'consent',
    include_granted_scopes:'true',
    scope:'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly',
    state:statePayload(safeReturnTo(req.query&&req.query.returnTo),nonce)
  });
  res.setHeader('Set-Cookie','familyapp_google_oauth_state='+encodeURIComponent(nonce)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600');
  res.setHeader('Cache-Control','no-store');
  res.redirect(302,'https://accounts.google.com/o/oauth2/v2/auth?'+params.toString());
};