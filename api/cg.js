module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const addr = req.query.addr;
  if (!addr) return res.status(400).json({ error: 'no addr' });
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/solana/contract/${addr}`);
    if (r.status === 404) return res.status(200).json({ listed: false });
    if (!r.ok) return res.status(200).json({ listed: false });
    const d = await r.json();
    const cur = d.market_data?.current_price?.usd || 0;
    const ath = d.market_data?.ath?.usd || 0;
    res.status(200).json({
      listed: true,
      cgId: d.id,
      rank: d.market_cap_rank,
      watchlist: d.watchlist_portfolio_users || 0,
      athPct: ath>0&&cur>0 ? Math.round(((cur-ath)/ath)*100) : null,
    });
  } catch(e) {
    res.status(200).json({ listed: false });
  }
}
