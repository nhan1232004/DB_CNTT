const fs = require('fs');

const eml = fs.readFileSync('frontend/src/pages/EmailJdPage.jsx', 'utf8');
const lines = eml.split('\n');

for (let i = 130; i < 180; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
