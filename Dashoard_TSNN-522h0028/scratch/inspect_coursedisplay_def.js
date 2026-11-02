const fs = require('fs');

const d = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf8');
const lines = d.split('\n');

for (let i = 698; i < 710; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
