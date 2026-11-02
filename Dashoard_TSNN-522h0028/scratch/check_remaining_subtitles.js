const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  });
  return results;
}

const files = walk('frontend/src/pages');
for (const file of files) {
  if (file.endsWith('.jsx')) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (l.includes('Tra cứu, theo dõi hồ sơ chứng chỉ') ||
          l.includes('Khai báo và quản lý hồ sơ') ||
          l.includes('Theo dõi trực quan tình trạng') ||
          l.includes('Hồ sơ của bạn đã hoàn tất') ||
          l.includes('Hệ thống tiếp nhận thông tin nơi thực tập')) {
        console.log(`${path.basename(file)}:${i + 1}: ${l.trim()}`);
      }
    });
  }
}
