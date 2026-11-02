const fs = require('fs');

function inspectFile(filePath, term, contextLines = 15) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes(term)) {
      console.log(`=== ${filePath}:${idx + 1} (${term}) ===`);
      const start = Math.max(0, idx - 5);
      const end = Math.min(lines.length, idx + contextLines);
      for (let i = start; i < end; i++) {
        console.log(`${i + 1}: ${lines[i]}`);
      }
    }
  });
}

inspectFile('frontend/src/pages/ProfilePage.jsx', 'Tiến trình hồ sơ');
inspectFile('frontend/src/pages/DeclarationPage.jsx', 'Đã có nơi thực tập');
