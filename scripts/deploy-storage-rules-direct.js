'use strict';
// Direct Firebase Rules API deploy for the explicitly approved STEP 2B.3
// production Storage Rules release. This intentionally bypasses the Firebase
// CLI Service Usage preflight only; it does not bypass Firebase Rules IAM.
// The service account must still be authorized by Google to test/create/release
// Firebase Security Rules.

const fs = require('fs');
const crypto = require('crypto');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'verhoog-family';
const CONFIGURED_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'verhoog-family.firebasestorage.app';
const CREDENTIAL_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const RULES_PATH = process.env.FIREBASE_STORAGE_RULES || 'storage.rules';
const API_ROOT = 'https://firebaserules.googleapis.com/v1';

function fail(message) {
  throw new Error(message);
}

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlJson({ alg: 'RS256', typ: 'JWT' });
  const claims = base64urlJson({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: credentials.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  });
  const unsigned = `${header}.${claims}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(credentials.private_key).toString('base64url');
  const assertion = `${unsigned}.${signature}`;
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });
  const response = await fetch(credentials.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) {}
  if (!response.ok || !data.access_token) {
    fail(`OAuth token exchange failed (${response.status}): ${data.error_description || data.error || 'unknown error'}`);
  }
  return data.access_token;
}

async function rulesApi(token, method, path, body) {
  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
  if (!response.ok) {
    const message = data && data.error && data.error.message ? data.error.message : text || 'unknown error';
    const error = new Error(`Firebase Rules API ${method} ${path} failed (${response.status}): ${message}`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

async function listAllReleases(token) {
  const releases = [];
  let pageToken = '';
  do {
    const suffix = pageToken ? `?pageSize=100&pageToken=${encodeURIComponent(pageToken)}` : '?pageSize=100';
    const data = await rulesApi(token, 'GET', `/projects/${PROJECT_ID}/releases${suffix}`);
    releases.push(...(data.releases || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return releases;
}

function chooseStorageRelease(releases) {
  const prefix = `projects/${PROJECT_ID}/releases/firebase.storage/`;
  const storage = releases.filter((release) => String(release.name || '').startsWith(prefix));
  const configured = `${prefix}${CONFIGURED_BUCKET}`;
  const exact = storage.find((release) => release.name === configured);
  if (exact) return { name: exact.name, exists: true, previousRulesetName: exact.rulesetName || null };
  if (storage.length === 1) {
    return { name: storage[0].name, exists: true, previousRulesetName: storage[0].rulesetName || null };
  }
  if (storage.length > 1) {
    fail(`Multiple Firebase Storage releases exist and none matches configured bucket ${CONFIGURED_BUCKET}; refusing ambiguous production deploy.`);
  }
  return { name: configured, exists: false, previousRulesetName: null };
}

async function patchRelease(token, releaseName, rulesetName) {
  const prefix = `projects/${PROJECT_ID}/releases/`;
  if (!releaseName.startsWith(prefix)) fail('Unexpected release name returned by Firebase Rules API.');
  const releaseId = releaseName.slice(prefix.length);
  return rulesApi(token, 'PATCH', `/projects/${PROJECT_ID}/releases/${releaseId}`, {
    release: { name: releaseName, rulesetName }
  });
}

async function createRelease(token, releaseName, rulesetName) {
  return rulesApi(token, 'POST', `/projects/${PROJECT_ID}/releases`, {
    name: releaseName,
    rulesetName
  });
}

async function main() {
  if (!CREDENTIAL_PATH) fail('GOOGLE_APPLICATION_CREDENTIALS is required.');
  if (!fs.existsSync(CREDENTIAL_PATH)) fail('Service account credential file not found.');
  if (!fs.existsSync(RULES_PATH)) fail(`${RULES_PATH} not found.`);

  const credentials = JSON.parse(fs.readFileSync(CREDENTIAL_PATH, 'utf8'));
  if (!credentials.client_email || !credentials.private_key) fail('Invalid Firebase service account credentials.');
  const rules = fs.readFileSync(RULES_PATH, 'utf8');
  const source = { files: [{ name: 'storage.rules', content: rules }] };

  console.log(`Authenticating Firebase Rules deploy for ${PROJECT_ID}...`);
  const token = await getAccessToken(credentials);

  console.log('Validating Storage rules with Firebase Rules API...');
  const test = await rulesApi(token, 'POST', `/projects/${PROJECT_ID}:test`, { source });
  const errors = (test.issues || []).filter((issue) => issue && issue.severity === 'ERROR');
  if (errors.length) {
    errors.forEach((issue) => console.error(`Rules ERROR ${issue.sourcePosition ? `${issue.sourcePosition.line}:${issue.sourcePosition.column}` : ''} ${issue.description || ''}`));
    fail('Firebase Rules validation returned errors.');
  }
  (test.issues || []).filter((issue) => issue && issue.severity !== 'ERROR').forEach((issue) => {
    console.warn(`Rules ${issue.severity || 'ISSUE'}: ${issue.description || ''}`);
  });

  console.log('Reading current Firebase Rules releases...');
  const releases = await listAllReleases(token);
  const target = chooseStorageRelease(releases);
  console.log(`Target release: ${target.name}${target.exists ? ' (existing)' : ' (new)'}`);
  if (target.previousRulesetName) console.log(`Previous ruleset: ${target.previousRulesetName}`);

  console.log('Creating immutable Storage ruleset...');
  const created = await rulesApi(token, 'POST', `/projects/${PROJECT_ID}/rulesets`, { source });
  if (!created.name) fail('Firebase Rules API did not return a ruleset name.');
  console.log(`Created ruleset: ${created.name}`);

  let releaseUpdated = false;
  try {
    console.log(target.exists ? 'Updating Storage release...' : 'Creating Storage release...');
    if (target.exists) await patchRelease(token, target.name, created.name);
    else await createRelease(token, target.name, created.name);
    releaseUpdated = true;

    const prefix = `projects/${PROJECT_ID}/releases/`;
    const releaseId = target.name.slice(prefix.length);
    const verifiedRelease = await rulesApi(token, 'GET', `/projects/${PROJECT_ID}/releases/${releaseId}`);
    if (verifiedRelease.rulesetName !== created.name) {
      fail(`Release verification mismatch: expected ${created.name}, got ${verifiedRelease.rulesetName || 'none'}.`);
    }

    const verifiedRuleset = await rulesApi(token, 'GET', `/${created.name}`);
    const deployedFile = verifiedRuleset && verifiedRuleset.source && Array.isArray(verifiedRuleset.source.files)
      ? verifiedRuleset.source.files.find((file) => file && file.name === 'storage.rules')
      : null;
    if (!deployedFile || deployedFile.content !== rules) {
      fail('Deployed ruleset content does not exactly match repository storage.rules.');
    }

    console.log(`Firebase Storage rules release verified: ${target.name} -> ${created.name}`);
  } catch (error) {
    if (releaseUpdated && target.exists && target.previousRulesetName) {
      console.error('Verification failed after release update; attempting rollback to previous ruleset...');
      try {
        await patchRelease(token, target.name, target.previousRulesetName);
        console.error(`Rollback completed: ${target.name} -> ${target.previousRulesetName}`);
      } catch (rollbackError) {
        console.error(`ROLLBACK FAILED: ${rollbackError.message}`);
      }
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
