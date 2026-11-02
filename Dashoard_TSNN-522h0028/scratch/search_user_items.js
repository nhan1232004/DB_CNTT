const fs = require('fs');
const path = require('path');

function searchAll(dir, patterns) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') searchAll(full, patterns);
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

searchAll('frontend/src', [
  'Hệ thống trực tuyến',
  'Tích chọn để xuất',
  'Phê duyệt hồ sơ & Thống kê Khoa CNTT',
  'Quản lý Học kỳ & Hạn chót',
  'Mã quyền: 2310',
  '2310',
  'Thiết lập kế hoạch học vụ',
  'Scope All · Toàn khoa',
  'Quản trị viên Khoa',
  'Xem & Tra cứu'
]);
