const fs = require('fs');

const dash = fs.readFileSync('frontend/src/pages/DashboardPage.jsx', 'utf8');
const lines = dash.split('\n');

for (let i = 405; i < 450; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
