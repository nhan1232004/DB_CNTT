const fs = require('fs');

const path = 'frontend/src/components/common/Sidebar.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('semesters') || l.includes('học kỳ') || l.includes('Học kỳ')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
