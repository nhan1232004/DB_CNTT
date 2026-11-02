const { execSync } = require('child_process');
const fs = require('fs');

const commits = execSync('git rev-list --all', { encoding: 'utf8' }).trim().split('\n');
console.log('Total commits:', commits.length);
for (const c of commits) {
  try {
    const list = execSync(`git ls-tree -r --name-only ${c}`, { encoding: 'utf8' }).split('\n');
    for (const f of list) {
      if (!f.endsWith('.jsx') && !f.endsWith('.tsx') && !f.endsWith('.html') && !f.endsWith('.vue')) continue;
      try {
        const content = execSync(`git show ${c}:${f}`, { encoding: 'utf8' });
        if (content.includes('Cần hỗ trợ') && content.includes('Cảnh báo')) {
          console.log(`Matched in ${c}:${f}`);
          // print snippet
          const lines = content.split('\n');
          lines.forEach((l, idx) => {
            if (l.includes('Cần hỗ trợ') || l.includes('Cảnh báo')) {
              console.log(`  ${idx+1}: ${l.trim()}`);
            }
          });
          process.exit(0);
        }
      } catch(e) {}
    }
  } catch(e) {}
}
