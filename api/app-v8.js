'use strict';

const appV7 = require('./app-v7');

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
    await appV7(req, capture);
  } catch (error) {
    console.error('[FamilyApp] v7 shell failed', error);
    res.status(500).send('FamilyApp shell unavailable');
    return;
  }

  if (statusCode < 400 && !body.includes('tasksPremiumWarmV2Finish.js?v=1')) {
    body = body.replace('</body>', '  <script src="/src/modules/tasks/tasksPremiumWarmV2Finish.js?v=1"></script>\n</body>');
  }

  Object.keys(headers).forEach((name) => res.setHeader(name, headers[name]));
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(statusCode).send(body);
};