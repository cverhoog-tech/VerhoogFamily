module.exports = async function handler(req, res) {
  try {
    const upstream = await fetch('https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/index.html', {
      headers: { 'User-Agent': 'FamilieApp-safe-render' }
    });

    if (!upstream.ok) {
      res.status(502).send('FamilieApp could not load the app shell.');
      return;
    }

    const html = await upstream.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FamilieApp safe render failed.');
  }
};
