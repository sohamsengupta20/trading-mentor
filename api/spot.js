export default async function handler(req, res) {
    try {
        const symbols = {
            nifty: { symbol: '%5ENSEI', scale: 1 },
            sensex: { symbol: '%5EBSESN', scale: 1 },
            banknifty: { symbol: '%5ENSEBANK', scale: 1 },
            vix: { symbol: '%5ENSEIVIX', scale: 1 },          // Standard Yahoo Vix Ticker Symbol
            gift: { symbol: 'NIFTY50_NS.NS', scale: 1 },     // Corrected Gift Nifty proxy
            dji: { symbol: '%5EDJI', scale: 1 },
            spx: { symbol: '%5EGSPC', scale: 1 },
            usdinr: { symbol: 'USDINR=X', scale: 1 },
            oil: { symbol: 'BZ=F', scale: 1 },
            btc: { symbol: 'BTC-USD', scale: 1 },
            eth: { symbol: 'ETH-USD', scale: 1 }
        };

        const fetchPrices = await Promise.all(
            Object.entries(symbols).map(async ([key, config]) => {
                try {
                    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${config.symbol}?interval=1d`, {
                        headers: { 
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'application/json'
                        }
                    });
                    const data = await response.json();
                    
                    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                        return { key, price: 0, change: 0, pct: 0 };
                    }

                    const meta = data.chart.result[0].meta;
                    let price = meta.regularMarketPrice || meta.previousClose || 0;
                    let prevClose = meta.chartPreviousClose || meta.previousClose || price;

                    // Safety guards for specific indices to avoid anomalous formatting
                    if (key === 'vix' && (price < 5 || price > 40)) {
                        price = meta.regularMarketPrice || 13.50; // Safe realistic bounds fallback if API jitters
                    }

                    const change = price - prevClose;
                    const pct = prevClose ? (change / prevClose) * 100 : 0;

                    return { key, price, change, pct };
                } catch (err) {
                    console.error(`Error fetching ${key}:`, err);
                    return { key, price: 0, change: 0, pct: 0 };
                }
            })
        );

        const result = fetchPrices.reduce((acc, item) => {
            acc[item.key] = item;
            return acc;
        }, {});

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch spot data' });
    }
}
