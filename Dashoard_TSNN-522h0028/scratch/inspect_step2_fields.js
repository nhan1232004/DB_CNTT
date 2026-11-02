const fs = require('fs');

const d = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf8');
const lines = d.split('\n');

for (let i = 1590; i < 1660; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
