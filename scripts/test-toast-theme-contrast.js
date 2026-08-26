'use strict';

const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '..', 'src', 'core', 'utils.js');
const cssPath = path.join(__dirname, '..', 'src', 'styles', 'app.css');
const utils = fs.readFileSync(utilsPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const showToastMatch = utils.match(/function showToast\(msg\) \{[\s\S]*?\n\}/);
expect(showToastMatch, 'showToast() must exist');
const showToast = showToastMatch[0];

expect(/\.toast\{[^}]*background:var\(--c-text\)/.test(css), 'baseline toast CSS contract unexpectedly changed');
expect(!/background\s*=\s*['\"]var\(--c-text\)/.test(showToast), 'showToast must not use the theme text token as its background');
expect(/background\s*=\s*['\"]rgba\(28,28,30,\.96\)/.test(showToast), 'showToast must force a dark contrast-safe background');
expect(/color\s*=\s*['\"]#fff/.test(showToast), 'showToast must keep readable white foreground text');
expect(/env\(safe-area-inset-bottom\)/.test(showToast), 'showToast must respect the iOS bottom safe area');
expect(/whiteSpace\s*=\s*['\"]normal/.test(showToast), 'showToast must allow long confirmations to wrap on mobile');
expect(/aria-live/.test(showToast), 'showToast must expose polite live-region semantics');

console.log('Toast theme contrast contract PASS');
