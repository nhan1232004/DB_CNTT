const fs = require('fs');

const serverCode = fs.readFileSync('backend/src/server.ts', 'utf8');
const lines = serverCode.split('\n');

for (let i = 0; i < Math.min(lines.length, 60); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
