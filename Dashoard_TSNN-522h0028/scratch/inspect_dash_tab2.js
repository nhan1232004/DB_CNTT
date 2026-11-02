const fs = require('fs');

const dash = fs.readFileSync('frontend/src/pages/DashboardPage.jsx', 'utf8');
const lines = dash.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('Học vụ, Điểm GPA & Chuẩn Ngoại ngữ') || l.includes('activeTab') || l.includes('B1+')) {
    console.log(`=== Line ${idx + 1} ===`);
    const s = Math.max(0, idx - 5);
    const e = Math.min(lines.length, idx + 40);
    for (let i = s; i < e; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
