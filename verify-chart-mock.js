const https = require('http');

const payload = JSON.stringify({
  symbol: 'BTC/USD',
  interval: '5min',
  assetType: 'crypto'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/chart-data',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Is Mock Data:', json.isMock);
      console.log('Data Points:', json.chartData ? json.chartData.length : 0);
      if (json.chartData && json.chartData.length > 0) {
        console.log('Sample Candle:', json.chartData[0]);
      }
      
      if (json.isMock === true && json.chartData.length > 0) {
          console.log('VERIFICATION SUCCESS: API correctly returned mock data.');
      } else {
          console.log('VERIFICATION FAILURE: API did not return mock data or data is missing.');
      }

    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.log('Raw Data:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(payload);
req.end();
