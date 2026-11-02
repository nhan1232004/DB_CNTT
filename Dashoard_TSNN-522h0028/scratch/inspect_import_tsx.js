const fs = require('fs');

const impTsx = fs.readFileSync('frontend/src/pages/ImportDataPage.tsx', 'utf8');
const lines = impTsx.split('\n');

for (let i = 170; i < 205; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
