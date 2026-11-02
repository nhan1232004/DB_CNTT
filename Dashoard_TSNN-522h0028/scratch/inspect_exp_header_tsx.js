const fs = require('fs');

const path = 'frontend/src/pages/ExportDataPage.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

for (let i = 230; i < 265; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
