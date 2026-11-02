const fs = require('fs');

const prof = fs.readFileSync('frontend/src/pages/ProfilePage.jsx', 'utf8');
const lines = prof.split('\n');

for (let i = 268; i < 330; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
