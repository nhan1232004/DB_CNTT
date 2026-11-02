const fs = require('fs');

const path = 'frontend/src/pages/BulletinPage.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('<h1')) {
    console.log(`=== Found at line ${idx + 1} ===`);
    for (let i = Math.max(0, idx - 4); i < Math.min(lines.length, idx + 10); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
