
async function testChartData() {
  const url = 'http://localhost:3000/api/chart-data';
  const payload = {
    symbol: 'EUR/USD',
    interval: '5min',
    assetType: 'forex'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testChartData();
