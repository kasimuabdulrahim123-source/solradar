const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({}); }
      });
    }).on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const endpoints = [
      'https://api.dexscreener.com/latest/dex/search?q=pump+solana',
      'https://api.dexscreener.com/latest/dex/search?q=raydium+meme',
      'https://api.dexscreener.com/latest/dex/search?q=pumpswap',
    ];

    let all = [];
    for (const url of endpoints) {
      try {
        const d = await get(url);
        (d?.pairs || [])
          .filter(p => p.chainId === 'solana')
          .forEach(p => {
            if (!all.find(x => x.pairAddress === p.pairAddress)) all.push(p);
          });
      } catch(e) {}
    }

    const MC_MIN=5000,MC_MAX=50000,VOL_MIN=30000,VOL_MAX=200000,AGE_MIN=24,AGE_MAX=720,DUMP_MIN=80,PEAK_MIN=800000;
    const stables=['usdc','usdt','wsol','busd','dai','usds'];

    const filtered = all.filter(p => {
      const mc=+(p.marketCap)||+(p.fdv)||0;
      const v24=+(p.volume?.h24)||0;
      const liq=+(p.liquidity?.usd)||0;
      const ch24=+(p.priceChange?.h24)||0;
      const tk=(p.baseToken?.symbol||'').toLowerCase();
      const ageH=p.pairCreatedAt?(Date.now()-p.pairCreatedAt)/3600000:null;
      if(stables.includes(tk))return false;
      if(!p.baseToken?.address)return false;
      if(mc<MC_MIN||mc>MC_MAX)return false;
      if(v24<VOL_MIN||v24>VOL_MAX)return false;
      if(liq<500)return false;
      if(ageH===null||ageH<AGE_MIN||ageH>AGE_MAX)return false;
      if(ch24>-DUMP_MIN)return false;
      const ratio=1+(ch24/100);
      const peak=ratio>0?mc/ratio:mc*25;
      if(peak<PEAK_MIN)return false;
      return true;
    });

    res.status(200).json({pairs:filtered,total:all.length,filtered:filtered.length});
  } catch(e) {
    res.status(500).json({error:e.message});
  }
}
