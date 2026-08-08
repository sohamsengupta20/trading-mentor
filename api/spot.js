export default async function handler(req, res) {
    try {
        const symbols = {
            nifty: '%5ENSEI',
            sensex: '%5EBSESN',
            banknifty: '%5ENSEBANK'
        };

        const fetchPrices = await Promise.all(
            Object.entries(symbols).map(async ([key, symbol]) => {
                const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const data = await response.json();
                const meta = data.chart.result[0].meta;
                const price = meta.regularMarketPrice;
                const prevClose = meta.chartPreviousClose;
                const change = price - prevClose;
                const pct = (change / prevClose) * 100;

                return { key, price, change, pct };
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
