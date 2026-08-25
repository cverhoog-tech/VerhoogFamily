'use strict';
// ============================================================
// STEP 10 — JWT signature encoding contract.
//
// Root cause covered: b64url() previously fell through to
// JSON.stringify(Buffer) for non-string input (e.g. the Buffer returned by
// crypto.Sign#sign()), producing a base64url encoding of a JSON object like
// {"type":"Buffer","data":[...]} instead of the raw RSA signature bytes.
// This produced a syntactically valid but cryptographically meaningless JWT
// signature segment REGARDLESS of which private key was used — which is why
// rotating the Firebase service-account key did not fix the OAuth failure.
//
// This test fails against the pre-fix implementation and passes against the
// fix: it does not just check that serviceAssertion() returns three
// dot-separated segments, it actually verifies the signature bytes
// cryptographically against the matching public key.
// ============================================================
const assert=require('assert');
const crypto=require('crypto');
const Sender=require('../src/server/firebasePushSender.js');

function b64urlDecode(segment){
  var padded=String(segment||'').replace(/-/g,'+').replace(/_/g,'/');
  while(padded.length%4)padded+='=';
  return Buffer.from(padded,'base64');
}

(function(){
  // 1. b64url(Buffer) must encode the raw bytes, not JSON.stringify(Buffer).
  var rawBytes=Buffer.from([0,1,2,253,254,255,65,66,67]);
  var encoded=Sender.b64url(rawBytes);
  var decoded=b64urlDecode(encoded);
  assert.ok(Buffer.isBuffer(decoded));
  assert.strictEqual(decoded.length,rawBytes.length,'b64url(Buffer) must round-trip to the same byte length as the input');
  assert.ok(decoded.equals(rawBytes),'b64url(Buffer) must round-trip to the exact same bytes as the input');
  // Defend explicitly against the historical regression: JSON.stringify(Buffer)
  // produces a text blob like {"type":"Buffer","data":[0,1,2,...]}, which is
  // far longer than the 9 raw bytes above and would never round-trip.
  assert.ok(!decoded.toString('utf8').includes('"type":"Buffer"'),'b64url(Buffer) must not fall through to JSON.stringify(Buffer)');

  // 2. Generate a temporary RSA keypair (never touches real credentials).
  var keys=crypto.generateKeyPairSync('rsa',{
    modulusLength:2048,
    publicKeyEncoding:{type:'spki',format:'pem'},
    privateKeyEncoding:{type:'pkcs8',format:'pem'}
  });
  var config={
    projectId:'verhoog-family',
    clientEmail:'jwt-contract-test@test.invalid',
    privateKey:keys.privateKey,
    databaseUrl:'https://db.test',
    webApiKey:'PUBLIC'
  };

  // 3. Build a JWT the same way the real OAuth exchange does.
  var nowSeconds=Math.floor(Date.now()/1000);
  var jwt=Sender.serviceAssertion(config,nowSeconds);
  var jwtParts=jwt.split('.');
  assert.strictEqual(jwtParts.length,3,'JWT must have header.payload.signature');

  // 4. Decode header/payload/signature.
  var header=JSON.parse(b64urlDecode(jwtParts[0]).toString('utf8'));
  var claims=JSON.parse(b64urlDecode(jwtParts[1]).toString('utf8'));
  var signatureBytes=b64urlDecode(jwtParts[2]);

  assert.deepStrictEqual(header,{alg:'RS256',typ:'JWT'});
  assert.strictEqual(claims.iss,config.clientEmail);
  assert.strictEqual(claims.sub,config.clientEmail);
  assert.strictEqual(claims.aud,'https://oauth2.googleapis.com/token');
  assert.strictEqual(claims.scope,'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/firebase.messaging');
  assert.strictEqual(claims.iat,nowSeconds);
  assert.strictEqual(claims.exp,nowSeconds+3600);

  // A JSON.stringify(Buffer)-style corrupted signature is on the order of
  // several hundred bytes of JSON text; a real RSA-2048 signature is exactly
  // 256 bytes. This alone would have flagged the historical bug.
  assert.strictEqual(signatureBytes.length,256,'RSA-2048 RS256 signature must be exactly 256 raw bytes');

  // 5. Cryptographically verify the signature against the matching public key.
  var signedInput=jwtParts[0]+'.'+jwtParts[1];
  var verifier=crypto.createVerify('RSA-SHA256');
  verifier.update(signedInput);
  verifier.end();
  var isValid=verifier.verify(keys.publicKey,signatureBytes);
  assert.strictEqual(isValid,true,'JWT signature must cryptographically verify against the matching public key');

  // Sanity check the negative case: a signature must NOT verify against an
  // unrelated public key, to confirm this assertion is actually discriminating.
  var otherKeys=crypto.generateKeyPairSync('rsa',{
    modulusLength:2048,
    publicKeyEncoding:{type:'spki',format:'pem'},
    privateKeyEncoding:{type:'pkcs8',format:'pem'}
  });
  var otherVerifier=crypto.createVerify('RSA-SHA256');
  otherVerifier.update(signedInput);
  otherVerifier.end();
  assert.strictEqual(otherVerifier.verify(otherKeys.publicKey,signatureBytes),false,'signature must not verify against an unrelated public key');

  console.log('STEP 10 push JWT signature encoding contract: PASS');
})();
