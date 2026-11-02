const fs = require('fs');

const dash = fs.readFileSync('frontend/src/pages/DashboardPage.jsx', 'utf8');
const lines = dash.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('Tiến độ thực tập toàn khóa') || l.includes('chứng chỉ tiếng Anh') || l.includes('tiếng Anh') || l.includes('chuẩn Ngoại ngữ')) {
    console.log(`=== Line ${idx + 1} ===`);
    const s = Math.max(0, idx - 5);
    const e = Math.min(lines.length, idx + 25);
    for (let i = s; i < e; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
