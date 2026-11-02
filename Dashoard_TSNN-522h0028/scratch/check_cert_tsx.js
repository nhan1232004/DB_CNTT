const fs = require('fs');

const path = 'frontend/src/pages/CertificatesPage.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('Scope All · Toàn khoa')) {
    console.log(`=== Found at line ${idx + 1} ===`);
    for (let i = Math.max(0, idx - 4); i < Math.min(lines.length, idx + 15); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
