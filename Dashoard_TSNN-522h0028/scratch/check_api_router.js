const fs = require('fs');

const routerCode = fs.readFileSync('backend/src/routes/api.router.ts', 'utf8');
const lines = routerCode.split('\n');

for (let i = 0; i < Math.min(lines.length, 80); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
