const fs = require('fs');

const acc = fs.readFileSync('frontend/src/pages/AccountsPage.jsx', 'utf8');
const lines = acc.split('\n');

for (let i = 275; i < 330; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
