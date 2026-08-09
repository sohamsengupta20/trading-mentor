export default async function handler(req, res) {
    try {
        const symbols = {
            nifty: '%5ENSEI',          // Nifty 50
            sensex: '%5EBSESN',         // Sensex
            banknifty: '%5ENSEBANK',    // Bank Nifty
            vix: '%5ENSEIVIX',          // India VIX
            gift: 'NIFTY_NS.NS',        // Gift Nifty Proxy / Index
            dji: '%5EDJI',              // Dow Jones Industrial Average
            spx: '%5EGSPC',             // S&P 500
            usdinr: 'USDINR=X',         // US Dollar / Indian Rupee
            oil: 'BZ=F',                // Brent Crude Oil (UK Oil)
            btc: 'BTC-USD',             // Bitcoin
            eth: 'ETH-USD'              // Ethereum
        };

        const fetchPrices = await Promise.all(
            Object.entries(symbols).map(async ([key, symbol]) => {
                try {
                    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    const data = await response.json();
                    const meta = data.chart.result[0].meta;
                    const price = meta.regularMarketPrice || meta.previousClose;
                    const prevClose = meta.chartPreviousClose || meta.previousClose;
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
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch spot data' });
    }
}
