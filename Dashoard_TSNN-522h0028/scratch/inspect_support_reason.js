const fs = require('fs');

const d = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf8');
const lines = d.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('LÝ DO CẦN KHOA HỖ TRỢ')) {
    console.log(`=== Line ${idx + 1} ===`);
    const s = Math.max(0, idx - 2);
    const e = Math.min(lines.length, idx + 25);
    for (let i = s; i < e; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
