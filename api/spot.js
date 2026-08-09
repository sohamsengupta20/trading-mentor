export default async function handler(req, res) {
    try {
        const symbols = {
            nifty: '%5ENSEI',          // Nifty 50 Index
            sensex: '%5EBSESN',         // BSE Sensex
            banknifty: '%5ENSEBANK',    // Nifty Bank
            vix: '%5EINDIAVIX',         // Corrected Yahoo Finance India VIX Ticker (^INDIAVIX)
            gift: 'NIFTY50.NS',         // Corrected GIFT / Nifty Proxy Index feed
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
                    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`, {
                        headers: { 
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        return { key, price: 0, change: 0, pct: 0 };
                    }

                    const data = await response.json();
                    
                    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                        return { key, price: 0, change: 0, pct: 0 };
                    }

                    const meta = data.chart.result[0].meta;
                    const price = meta.regularMarketPrice || meta.previousClose || 0;
                    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
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
