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

searchAll('frontend/src', 'B1+');
searchAll('frontend/src', 'ôn luyện');
searchAll('frontend/src', 'Đủ điều kiện xét tốt nghiệp');
searchAll('frontend/src', 'chưa có chứng chỉ');
searchAll('frontend/src', 'CertificatesPage');
