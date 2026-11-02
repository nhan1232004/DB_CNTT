const fs = require('fs');

const dash = fs.readFileSync('frontend/src/pages/DashboardPage.jsx', 'utf8');
const lines = dash.split('\n');

for (let i = 625; i < 710; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
