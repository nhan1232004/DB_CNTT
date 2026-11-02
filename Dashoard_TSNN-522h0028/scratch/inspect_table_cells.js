const fs = require('fs');

const path = 'frontend/src/pages/AccountsPage.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

for (let i = 840; i < 885; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
