const fs = require('fs');

const content = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf-8');

const checks = [
  { name: '480 giờ / 160h + 320h in confirmation', test: content.includes('480 giờ (KTCN 160h + TSNN 320h)') },
  { name: 'Khối lượng: KTCN (160h)', test: content.includes('Khối lượng: KTCN (160h)') },
  { name: 'Mã 503112 + 503113 - 480 giờ', test: content.includes('Mã 503112 + 503113') },
  { name: 'Thực tập Song song (2 môn)', test: content.includes('Thực tập Song song (2 môn)') },
  { name: '10 hoặc 13 chữ số in MST label', test: content.includes('(10 hoặc 13 chữ số)') },
  { name: 'ĐỊA CHỈ TRỤ SỞ / ĐỊA ĐIỂM THỰC TẬP', test: content.includes('ĐỊA CHỈ TRỤ SỞ / ĐỊA ĐIỂM THỰC TẬP') },
  { name: '/ MENTOR: *', test: content.includes('/ MENTOR: *') },
  { name: 'Hồ sơ đang soạn thảo box', test: content.includes('Hồ sơ đang soạn thảo. Hãy hoàn tất các bước') },
  { name: 'MST placeholder has example', test: content.includes('placeholder="VD: 0302722146') },
  { name: 'Company name placeholder has example', test: content.includes('placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ THÔNG TIN FPT') },
  { name: 'New confirmation text present', test: content.includes('Tôi xác nhận các thông tin trên là chính xác và cam kết hoàn thành đúng khối lượng thời gian của môn học thực tập theo quy chế của Khoa CNTT - ĐH Tôn Đức Thắng.') }
];

console.log('--- Verification Results ---');
checks.forEach(c => {
  console.log(`${c.name}: ${c.test}`);
});
