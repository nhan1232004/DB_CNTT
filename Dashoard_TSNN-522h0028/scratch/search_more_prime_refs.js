const fs = require('fs');

const path = 'frontend/src/pages/AccountsPage.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('M =') || l.includes('Mã quyền') || l.includes('Thừa số Nguyên tố') || l.includes('breakdown')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
