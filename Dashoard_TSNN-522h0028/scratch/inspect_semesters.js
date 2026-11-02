const fs = require('fs');

const sem = fs.readFileSync('frontend/src/pages/SemestersPage.jsx', 'utf8');
const lines = sem.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('regulationNote') || l.includes('Sinh viên hoàn thành khai báo')) {
    console.log(`=== Line ${idx + 1} ===`);
    const s = Math.max(0, idx - 4);
    const e = Math.min(lines.length, idx + 10);
    for (let i = s; i < e; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
