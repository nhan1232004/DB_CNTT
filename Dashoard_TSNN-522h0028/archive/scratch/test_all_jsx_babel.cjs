const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

function testDir(dir) {
  let count = 0;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') {
        count += testDir(full);
      }
    } else if (f.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      try {
        babel.transformSync(content, {
          presets: ['@babel/preset-react'],
          filename: full
        });
        console.log(`✓ OK: ${f}`);
        count++;
      } catch (err) {
        console.error(`✗ ERROR in ${full}:`, err.message);
        process.exit(1);
      }
    }
  }
  return count;
}

console.log('Testing all JSX files in frontend/src...');
const total = testDir('TDTU_DB_CNTT_System/frontend/src');
console.log(`\n🎉 ALL ${total} JSX FILES COMPILED CLEANLY WITH BABEL!`);
