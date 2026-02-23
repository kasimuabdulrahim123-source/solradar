module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const [priceRes, fgRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin&vs_currencies=usd&include_24hr_change=true'),
      fetch('https://api.alternative.me/fng/?limit=1'),
    ]);
    const price = await priceRes.json();
    const fg = await fgRes.json();
    res.status(200).json({
      solPrice: price?.solana?.usd || 0,
      solChg:   price?.solana?.usd_24h_change || 0,
      btcChg:   price?.bitcoin?.usd_24h_change || 0,
      fearGreed: parseInt(fg?.data?.[0]?.value) || 50,
      fgLabel:   fg?.data?.[0]?.value_classification || 'Neutral',
    });
  } catch(e) {
    res.status(200).json({ solPrice: 0, solChg: 0, btcChg: 0, fearGreed: 50, fgLabel: 'Unknown' });
  }
} 
