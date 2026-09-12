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
    .replaceAll('/api/brand-icon?variant=192&v=5', '/api/brand-icon?variant=192&v=8')
    .replaceAll('/api/brand-icon?variant=180&v=5', '/api/brand-icon?variant=180&v=8')
    .replaceAll('/api/brand-icon?variant=32&v=5', '/api/brand-icon?variant=32&v=8')
    .replaceAll('/api/brand-icon?variant=login&v=5-login1', '/api/brand-icon?variant=login&v=8-login1')
    .replaceAll('manifest.json?v=5', 'manifest.json?v=8')
    .replaceAll('src/core/appIcon.js?v=6', 'src/core/appIcon.js?v=10')
    .replaceAll('content="#140724"', 'content="#0b3428"');

  if (!body.includes('loginBrandV7.css?v=2')) {
    body = body.replace('</head>', '  <link rel="preconnect" href="https://res.cloudinary.com" crossorigin>\n  <link rel="stylesheet" href="/src/styles/loginBrandV7.css?v=2">\n</head>');
  }
  if (!body.includes('loginBrandV7.js?v=2')) {
    body = body.replace('</body>', '  <script src="/src/core/loginBrandV7.js?v=2"></script>\n</body>');
  }
  if (!body.includes('pwaIconV8.js?v=1')) {
    body = body.replace('</body>', '  <script src="/src/core/pwaIconV8.js?v=1"></script>\n</body>');
  }
  if (!body.includes('cleaningMoreMenuIcon.js?v=1')) {
    body = body.replace('</body>', '  <script src="/src/core/cleaningMoreMenuIcon.js?v=1"></script>\n</body>');
  }

  Object.keys(headers).forEach((name) => res.setHeader(name, headers[name]));
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(statusCode).send(body);
};
