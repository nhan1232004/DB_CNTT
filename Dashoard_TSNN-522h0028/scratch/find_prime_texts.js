const fs = require('fs');

const path = 'frontend/src/pages/AccountsPage.jsx';
const content = fs.readFileSync(path, 'utf8');

const targets = [
  'Mỗi hành động nghiệp vụ được gán duy nhất 1 số nguyên tố',
  'Độ phức tạp: O(1) Modulo',
  'Quy ước số nguyên tố',
  'Mã quyền tích (M)'
];

targets.forEach(t => {
  const idx = content.indexOf(t);
  console.log(`Target "${t}": found at index ${idx}`);
});
