const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    const m = data.match(/v=20261031_v\d+[^"']*/g);
    console.log('Versions found in index.html response:', m ? m.slice(0, 3) : 'none');
  });
}).on('error', err => {
  console.error('HTTP Error:', err.message);
});
