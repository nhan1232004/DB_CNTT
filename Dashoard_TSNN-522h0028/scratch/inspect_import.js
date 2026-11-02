const fs = require('fs');

const imp = fs.readFileSync('frontend/src/pages/ImportDataPage.jsx', 'utf8');
const lines = imp.split('\n');

for (let i = 170; i < 210; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
