const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const htmlPath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');
    // Keep the canonical Task Card bundle fresh on mobile Safari and install
    // the task-create readiness bridge immediately before it. The bridge does
    // not introduce a second writer; it only waits for the existing
    // TaskSharedData/Firebase authority to report ready before create().
    html = html.replace(
      '<script src="src/modules/tasks/taskDetailPopup.js?v=2"></script>',
      '<script src="src/modules/tasks/taskCreateReadinessFix.js?v=1"></script>\n  <script src="src/modules/tasks/taskDetailPopup.js?v=3"></script>\n  <script src="src/modules/tasks/taskCategoryIcons.js?v=3"></script>\n  <script src="src/modules/tasks/taskHeroTemplates.js?v=6"></script>\n  <script src="src/modules/tasks/partyQuestActiveView.js?v=5"></script>\n  <script src="src/modules/tasks/partyQuestCompletionReward.js?v=1"></script>\n  <script src="src/modules/tasks/partyQuestInvites.js?v=4"></script>\n  <script src="src/modules/tasks/taskCompactLifecyclePolish.js?v=1"></script>\n  <script src="src/modules/tasks/taskCompletedCleanup.js?v=1"></script>\n  <script src="src/modules/tasks/taskXpViewFix.js?v=1"></script>\n  <script src="src/modules/tasks/duoQuestPushLoopGuard.js?v=1"></script>'
    );
    html = html.replace('</body>', '<script src="src/core/mobileUxFixes.js"></script></body>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FamilyApp loader error: ' + (error && error.message ? error.message : String(error)));
  }
};