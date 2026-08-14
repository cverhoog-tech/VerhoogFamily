const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const htmlPath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // The v023 quest overlay contained the retired legacy Tasks overview.
    // Do not ship it in the live app anymore. Task details are handled by
    // taskDetailPopup.js and the canonical overview by TaskCompactHome.
    html = html.replace(/\s*<script src="src\/modules\/tasks\/quest-overlay\.js"><\/script>\s*/g, '\n');

    // Keep the canonical Task Card bundle fresh on mobile Safari. Runtime
    // ownership is explicit: TaskDetailPopup owns task detail/create UI,
    // TaskSwapRequests owns the UID-based swap flow, and TaskSharedData owns
    // task persistence. No parallel swap runtime/UI or avatar patch layer.
    html = html.replace(
      '<script src="src/modules/tasks/taskDetailPopup.js?v=2"></script>',
      '<script src="src/modules/tasks/taskCreateReadinessFix.js?v=1"></script>\n  <script src="src/modules/tasks/taskDetailPopup.js?v=3"></script>\n  <script src="src/modules/tasks/taskCompactPrimary.js?v=1"></script>\n  <script src="src/modules/tasks/taskSwapRequests.js?v=2"></script>\n  <script src="src/modules/tasks/taskCategoryIcons.js?v=3"></script>\n  <script src="src/modules/tasks/taskHeroTemplates.js?v=6"></script>\n  <script src="src/core/progressionUidBridge.js?v=1"></script>\n  <script src="src/core/legacyXpOverwriteGuard.js?v=1"></script>\n  <script src="src/modules/achievements/achievementUidBridge.js?v=1"></script>\n  <script src="src/modules/tasks/taskRewardBridge.js?v=1"></script>\n  <script src="src/modules/tasks/partyQuestActiveView.js?v=5"></script>\n  <script src="src/modules/tasks/partyQuestCompletionReward.js?v=2"></script>\n  <script src="src/modules/tasks/partyQuestInvites.js?v=4"></script>\n  <script src="src/modules/tasks/taskCompactLifecyclePolish.js?v=1"></script>\n  <script src="src/modules/tasks/taskCompletedCleanup.js?v=1"></script>\n  <script src="src/modules/tasks/taskXpViewFix.js?v=2"></script>'
    );

    // Load this last so no older task integration loaded by index.html can
    // restore the retired overview after navigation or Firebase re-renders.
    html = html.replace(
      '</body>',
      '<script src="src/modules/tasks/taskOverviewCanonical.js?v=3"></script>\n<script src="src/core/mobileUxFixes.js"></script></body>'
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FamilyApp loader error: ' + (error && error.message ? error.message : String(error)));
  }
};