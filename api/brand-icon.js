'use strict';

const https = require('https');

// Opaque full-bleed PWA master v9. The v8 Home Screen mark could show a
// crossed/kinked cream path under the golden doorway on iOS. v9 redraws that
// path as one clean, symmetric closed shape with no self-intersection while
// preserving the accepted forest-green / cream / gold FamilyApp identity.
const SOURCE = 'https://res.cloudinary.com/rg86slp4/image/upload/v1789254498/familyapp/brand/v9/pwa-master.svg';
const VARIANTS = Object.freeze({
  '32': 'https://res.cloudinary.com/rg86slp4/image/upload/c_fill,w_32,h_32,q_auto:best,f_png/v1789254498/familyapp/brand/v9/pwa-master.svg',
  '180': 'https://res.cloudinary.com/rg86slp4/image/upload/c_fill,w_180,h_180,q_auto:best,f_png/v1789254498/familyapp/brand/v9/pwa-master.svg',
  '192': 'https://res.cloudinary.com/rg86slp4/image/upload/c_fill,w_192,h_192,q_auto:best,f_png/v1789254498/familyapp/brand/v9/pwa-master.svg',
  '512': 'https://res.cloudinary.com/rg86slp4/image/upload/c_fill,w_512,h_512,q_auto:best,f_png/v1789254498/familyapp/brand/v9/pwa-master.svg',
  'maskable': 'https://res.cloudinary.com/rg86slp4/image/upload/c_pad,w_512,h_512,b_rgb:0b3428,q_auto:best,f_png/v1789254498/familyapp/brand/v9/pwa-master.svg',
  'login': 'https://res.cloudinary.com/rg86slp4/image/upload/c_fill,w_512,h_512,q_auto:best,f_png/v1789254498/familyapp/brand/v9/pwa-master.svg'
});

function pipeImage(url, res, redirectsLeft) {
  https.get(url, function(upstream) {
    const status = Number(upstream.statusCode || 0);
    if (status >= 300 && status < 400 && upstream.headers.location && redirectsLeft > 0) {
      upstream.resume();
      pipeImage(new URL(upstream.headers.location, url).toString(), res, redirectsLeft - 1);
      return;
    }
    if (status !== 200) {
      upstream.resume();
      res.status(502).send('FamilyApp brand asset unavailable');
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('CDN-Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition', 'inline; filename="familyapp-brand-v9.png"');
    upstream.pipe(res);
  }).on('error', function() {
    if (!res.headersSent) res.status(502).send('FamilyApp brand asset unavailable');
    else res.end();
  });
}

module.exports = function handler(req, res) {
  const requested = String((req.query && (req.query.variant || req.query.size)) || '192').toLowerCase();
  const variant = Object.prototype.hasOwnProperty.call(VARIANTS, requested) ? requested : '192';
  pipeImage(VARIANTS[variant], res, 2);
};