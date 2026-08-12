const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const htmlPath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');
    // Temporary cache-bust at the no-store HTML boundary. The branch was
    // rolled back to the canonical Task Card implementation while Safari had
    // already cached a different taskDetailPopup.js under ?v=2. Serving a new
    // asset URL forces the current source (progress segments, XP shield,
    // circular close control, bookmark/More details) to be fetched without
    // changing any popup markup or styling.
    html = html.replace('src/modules/tasks/taskDetailPopup.js?v=2', 'src/modules/tasks/taskDetailPopup.js?v=3');
    html = html.replace('</body>', '<script src="src/core/mobileUxFixes.js"></script></body>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FamilyApp loader error: ' + (error && error.message ? error.message : String(error)));
  }
};
