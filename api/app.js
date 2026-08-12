const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const htmlPath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');
    // Keep the canonical Task Card bundle fresh on mobile Safari. Task create
    // goes directly through TaskSharedData again; no runtime wrapper intercepts
    // the proven create/save path.
    html = html.replace(
      '<script src="src/modules/tasks/taskDetailPopup.js?v=2"></script>',
      '<script src="src/modules/tasks/taskDetailPopup.js?v=3"></script>'
    );
    html = html.replace('</body>', '<script src="src/core/mobileUxFixes.js"></script></body>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FamilyApp loader error: ' + (error && error.message ? error.message : String(error)));
  }
};
