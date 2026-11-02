const fs = require('fs');

const path = 'frontend/src/pages/AccountsPage.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('Chức năng hệ thống') || l.includes('Mã quyền tích')) {
    console.log(`Line ${idx + 1}: ${l}`);
    for (let i = Math.max(0, idx - 2); i < Math.min(lines.length, idx + 12); i++) {
      console.log(`  ${i + 1}: ${lines[i]}`);
    }
  }
});
