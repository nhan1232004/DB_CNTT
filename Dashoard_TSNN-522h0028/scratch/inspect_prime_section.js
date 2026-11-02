const fs = require('fs');

const path = 'frontend/src/pages/AccountsPage.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

function printAround(term, before = 5, after = 25) {
  lines.forEach((l, idx) => {
    if (l.includes(term)) {
      console.log(`=== Found "${term}" at line ${idx + 1} ===`);
      const start = Math.max(0, idx - before);
      const end = Math.min(lines.length, idx + after);
      for (let i = start; i < end; i++) {
        console.log(`${i + 1}: ${lines[i]}`);
      }
    }
  });
}

printAround('Độ phức tạp: O(1) Modulo', 5, 40);
printAround('Mã quyền tích (M)', 5, 40);
