const fs = require('fs');

const path = 'frontend/src/pages/AccountsPage.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('Hệ thống trực tuyến')) {
    console.log(`=== Found at line ${idx + 1} ===`);
    for (let i = Math.max(0, idx - 10); i < Math.min(lines.length, idx + 10); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
