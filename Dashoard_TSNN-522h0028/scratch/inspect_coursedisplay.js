const fs = require('fs');

const d = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf8');
const lines = d.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('courseDisplay')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
