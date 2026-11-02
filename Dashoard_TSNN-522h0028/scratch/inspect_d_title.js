const fs = require('fs');

const d = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf8');
const lines = d.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('Hồ sơ khai báo thực tập của tôi')) {
    console.log(`=== Line ${idx + 1} ===`);
    const s = Math.max(0, idx - 5);
    const e = Math.min(lines.length, idx + 40);
    for (let i = s; i < e; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
