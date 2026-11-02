const fs = require('fs');

const path = 'frontend/src/pages/SemestersPage.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('Quản lý Học kỳ & Hạn chót') || l.includes('2310') || l.includes('Thiết lập kế hoạch học vụ')) {
    console.log(`=== Found at line ${idx + 1} ===`);
    for (let i = Math.max(0, idx - 6); i < Math.min(lines.length, idx + 15); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
