export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');
  res.status(200).json({
    generatedAt: new Date().toISOString(),
    note: 'Live-ready Steam discovery placeholder. Connect Steam/ITAD/CheapShark API keys for production data.',
    categories: ['Specials & Offers','Popular New Releases','Co-op Picks','Hidden Gems','Recommended for Your Squad']
  });
}
