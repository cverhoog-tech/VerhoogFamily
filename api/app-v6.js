'use strict';

const baseApp = require('./app');

module.exports = async function handler(req, res) {
  let statusCode = 200;
  let body = '';
  const headers = {};

  const capture = {
    setHeader(name, value) { headers[String(name)] = value; return capture; },
    status(code) { statusCode = Number(code) || 200; return capture; },
    send(value) { body = value == null ? '' : String(value); return capture; },
    end(value) { if (value != null) body = String(value); return capture; }
  };

  try {
    await baseApp(req, capture);
  } catch (error) {
    console.error('[FamilyApp] base shell failed', error);
    res.status(500).send('FamilyApp shell unavailable');
    return;
  }

  if (statusCode >= 400) {
    Object.keys(headers).forEach((name) => res.setHeader(name, headers[name]));
    res.status(statusCode).send(body);
    return;
  }

  body = body
    .replaceAll('/api/brand-icon?variant=192&v=5', '/api/brand-icon?variant=192&v=6')
    .replaceAll('/api/brand-icon?variant=180&v=5', '/api/brand-icon?variant=180&v=6')
    .replaceAll('/api/brand-icon?variant=32&v=5', '/api/brand-icon?variant=32&v=6')
    .replaceAll('/api/brand-icon?variant=login&v=5-login1', '/api/brand-icon?variant=login&v=6-login1')
    .replaceAll('manifest.json?v=5', 'manifest.json?v=6')
    .replaceAll('src/core/appIcon.js?v=6', 'src/core/appIcon.js?v=7')
    .replaceAll('content="#140724"', 'content="#0b3428"');

  if (!body.includes('loginBrandV6.css?v=3')) {
    body = body.replace('</head>', '  <link rel="stylesheet" href="/src/styles/loginBrandV6.css?v=3">\n</head>');
  }
  if (!body.includes('loginBrandV6.js?v=3')) {
    body = body.replace('</body>', '  <script src="/src/core/loginBrandV6.js?v=3"></script>\n</body>');
  }

  Object.keys(headers).forEach((name) => res.setHeader(name, headers[name]));
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(statusCode).send(body);
};
