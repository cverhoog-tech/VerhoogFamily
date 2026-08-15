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

    // Ensure the event-driven shared task bootstrap is not served from an old
    // mobile Safari cache entry from before v1.2.
    html = html.replace(
      '<script src="src/modules/tasks/taskSharedData.js"></script>',
      '<script src="src/modules/tasks/taskSharedData.js?v=2"></script>'
    );

    // The legacy renderer in tasks.js is intentionally still present for old
    // offline snapshots, but the live app must always load the UID-first Person
    // renderer afterwards with an explicit cache-busting version.
    html = html.replace(
      '<script src="src/modules/tasks/personTabPremium.js"></script>',
      '<script src="src/modules/tasks/personDashboardService.js?v=2"></script>\n  <script src="src/modules/tasks/personTabPremium.js?v=43"></script>'
    );

    // Keep the canonical Task Card bundle fresh on mobile Safari. Runtime
    // ownership is explicit: TaskDetailPopup owns task detail/create UI,
    // TaskSwapRequests owns the UID-based swap flow, and TaskSharedData owns
    // task persistence. No parallel swap runtime/UI or avatar patch layer.
    html = html.replace(
      '<script src="src/modules/tasks/taskDetailPopup.js?v=2"></script>',
      '<script src="src/modules/tasks/taskCreateReadinessFix.js?v=2"></script>\n  <script src="src/modules/tasks/taskDetailPopup.js?v=3"></script>\n  <script src="src/modules/tasks/taskCompactPrimary.js?v=1"></script>\n  <script src="src/modules/tasks/taskSwapRequests.js?v=2"></script>\n  <script src="src/modules/tasks/taskCategoryIcons.js?v=3"></script>\n  <script src="src/modules/tasks/taskHeroTemplates.js?v=6"></script>\n  <script src="src/core/progressionUidBridge.js?v=2"></script>\n  <script src="src/core/legacyXpOverwriteGuard.js?v=1"></script>\n  <script src="src/modules/achievements/achievementUidBridge.js?v=1"></script>\n  <script src="src/modules/tasks/taskRewardBridge.js?v=2"></script>\n  <script src="src/modules/tasks/partyQuestActiveView.js?v=5"></script>\n  <script src="src/modules/tasks/partyQuestCompletionReward.js?v=2"></script>\n  <script src="src/modules/tasks/partyQuestInvites.js?v=4"></script>\n  <script src="src/modules/tasks/taskCompactLifecycle.js?v=1"></script>\n  <script src="src/modules/tasks/taskXpViewSync.js?v=1"></script>'
    );

    // Premium achievements renderer is loaded after the legacy achievement
    // definitions so it reuses the same badge data while owning the visual UI.
    html = html.replace(
      '<script src="src/modules/achievements/achievements.js"></script>',
      '<script src="src/modules/achievements/achievements.js?v=2"></script>\n  <script src="src/modules/achievements/achievementsPremium.js?v=1"></script>'
    );

    // Load these last so no older integration can restore retired renderers or
    // light-only UI after navigation/Firebase re-renders.
    html = html.replace(
      '</body>',
      '<script src="src/modules/tasks/taskOverviewCanonical.js?v=5"></script>\n<script src="src/app/uiConsistencyPolish.js?v=1"></script>\n<script src="src/core/mobileUxFixes.js?v=2"></script></body>'
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FamilyApp loader error: ' + (error && error.message ? error.message : String(error)));
  }
};