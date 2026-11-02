const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  });
  return results;
}

const allFiles = walk('frontend/src');
console.log('--- Checking container widths in JSX and TSX ---');
for (const file of allFiles) {
  if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('max-w-7xl') || line.includes('max-w-6xl') || line.includes('max-w-5xl') || line.includes('max-w-4xl')) {
        console.log(`${file}:${idx + 1}: ${line.trim().slice(0, 100)}`);
      }
    });
  }
}
