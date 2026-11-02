const fs = require('fs');
const path = require('path');

function searchInDir(dir, patterns) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') searchInDir(full, patterns);
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      for (const p of patterns) {
        if (content.includes(p)) {
          console.log(`Found "${p}" in ${full}`);
        }
      }
    }
  }
}

searchInDir('frontend/src', [
  'Tiến trình hồ sơ',
  'Thực tập Song song (2 môn)',
  'Đã có nơi thực tập',
  'Quyền Xem công khai',
  'Tùy chỉnh Hạn chót',
  'Trung tâm Import Dữ liệu',
  'regulationNote',
  'Tiến độ thực tập toàn khóa',
  '503112 + 503113'
]);
