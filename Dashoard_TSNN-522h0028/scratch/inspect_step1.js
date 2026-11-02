const fs = require('fs');

const content = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf8');
const lines = content.split('\n');
for (let i = 1200; i < 1290; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
