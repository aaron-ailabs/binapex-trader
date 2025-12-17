const https = require('https');

const apiKey = "692d271974e851.52496181"; // Key from .env.local
const symbol = "AAPL.US"; // Test with US stock (usually supported by demo/free tiers)
const forexSymbol = "EURUSD.FOREX" // Test with Forex

function testSymbol(sym) {
    const url = `https://eodhd.com/api/intraday/${sym}?api_token=${apiKey}&fmt=json&interval=5m`;
    console.log(`Testing ${sym}...`);
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`Status for ${sym}: ${res.statusCode}`);
            try {
                const json = JSON.parse(data);
                if (Array.isArray(json)) {
                    console.log(`Success! Received ${json.length} candles.`);
                    console.log('Sample:', JSON.stringify(json[0]));
                } else {
                    console.log('Failed (Response is not an array):', data.substring(0, 200));
                }
            } catch (e) {
                console.log('Failed to parse JSON:', e.message);
                console.log('Raw body:', data.substring(0, 200));
            }
        });
    }).on('error', (err) => {
        console.error(`Error fetching ${sym}:`, err.message);
    });
}

testSymbol(symbol);
setTimeout(() => testSymbol(forexSymbol), 2000); // Wait a bit
