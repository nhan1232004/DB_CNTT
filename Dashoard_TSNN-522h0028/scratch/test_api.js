const http = require('http');

http.get('http://localhost:3000/api/summary?semester=hk1_2026_2027', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('/api/summary HTTP Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Success:', parsed.success, 'Total students:', parsed.data?.totalStudents);
    } catch {
      console.log('Response not JSON:', data.slice(0, 100));
    }
  });
}).on('error', err => {
  console.error('HTTP Error:', err.message);
});
