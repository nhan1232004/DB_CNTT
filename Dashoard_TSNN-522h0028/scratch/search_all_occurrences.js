const fs = require('fs');
const path = require('path');

function searchAll(dir, term) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') searchAll(full, term);
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(term)) {
        console.log(`Found "${term}" in ${full}`);
      }
    }
  }
}

['Mã quyền tích (M)', 'Độ phức tạp: O(1)', 'Quy ước số nguyên tố', 'Mỗi hành động nghiệp vụ được gán duy nhất 1 số nguyên tố'].forEach(term => {
  searchAll('frontend/src', term);
});
