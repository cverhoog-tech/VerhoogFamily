module.exports = async function handler(req, res) {
  try {
    const upstream = await fetch("https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/index.html", {
      headers: { "User-Agent": "FamilyApp-stable-loader" }
    });

    if (!upstream.ok) {
      res.status(502).send("FamilyApp kon de app-shell niet laden.");
      return;
    }

    let html = await upstream.text();

    const injection = `
<link rel="stylesheet" href="/trade-engine.css">
<script src="/trade-engine.js" defer></script>
<link rel="stylesheet" href="/src/app/homePremiumPolish.css?v=5">
<link rel="stylesheet" href="/src/modules/tasks/tasks.modern.css?v=1">
<script src="/src/app/disableLegacyQuestRouteHotfix.js" defer></script>
<script src="/src/app/homePremiumPolish.js?v=5" defer></script>
<script src="/src/app/taskCreateSubmitGuard.js?v=1" defer></script>
<script type="module" src="/src/modules/tasks/tasks.modern.js?v=1"></script>

<script type="module" id="modern-bridge-loader">
  import { mountLegacyFeedBridge } from '/src/app/legacy-feed-bridge.js';
  import { mountLegacyProfileBridge } from '/src/app/legacy-profile-bridge.js';

  function tryModernMounts() {
    try {
      mountLegacyFeedBridge();
      mountLegacyProfileBridge();
    } catch (error) {
      console.warn('Modern bridges konden niet laden', error);
    }
  }

  function syncOwnAvatarLinks() {
    var avatarUrl = localStorage.getItem('familyapp-current-user-avatar-v1');
    var headerAvatars = document.querySelectorAll('.header-avatar');
    headerAvatars.forEach(function (avatar) {
      avatar.style.cursor = 'pointer';
      avatar.onclick = function () {
        var profileButton = Array.from(document.querySelectorAll('button, .more-btn, [role="button"]')).find(function (button) {
          return /profiel|profile/i.test(button.textContent || '');
        });
        if (profileButton) profileButton.click();
      };
      if (avatarUrl && !avatar.querySelector('img')) {
        avatar.innerHTML = '<img src="' + avatarUrl + '" alt="Profiel" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block">';
      }
    });
  }

  window.addEventListener('load', function () {
    [120, 450, 900, 1500].forEach(function (delay) { setTimeout(function(){ tryModernMounts(); syncOwnAvatarLinks(); }, delay); });
  });

  document.addEventListener('click', function () {
    setTimeout(function(){ tryModernMounts(); syncOwnAvatarLinks(); }, 120);
    setTimeout(function(){ tryModernMounts(); syncOwnAvatarLinks(); }, 420);
  }, true);

  setInterval(function(){ tryModernMounts(); syncOwnAvatarLinks(); }, 1200);
</script>
`;

    if (!html.includes("modern-bridge-loader")) {
      html = html.replace("</head>", injection + "</head>");
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send("FamilyApp loader error: " + (error && error.message ? error.message : String(error)));
  }
};