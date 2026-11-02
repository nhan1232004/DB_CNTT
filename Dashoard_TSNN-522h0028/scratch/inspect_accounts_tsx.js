const fs = require('fs');

console.log('--- Inspecting AccountsPage.tsx tabs ---');
const accTsx = fs.readFileSync('frontend/src/pages/AccountsPage.tsx', 'utf8');
const lines = accTsx.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('activeSubTab') && l.includes('button')) {
    console.log(`=== Line ${idx + 1} ===`);
    const s = Math.max(0, idx - 2);
    const e = Math.min(lines.length, idx + 20);
    for (let i = s; i < e; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
