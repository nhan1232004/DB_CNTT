const fs = require('fs');

const djsx = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf8');

const checks = [
  'Thực tập Song song (2 môn)',
  '503112 + 503113',
  '480 giờ',
  '160h',
  'Hồ sơ đang soạn thảo. Hãy hoàn tất các bước để hệ thống ghi nhận thời gian thực nộp về Khoa.',
  '10 hoặc 13 chữ số',
  'ĐỊA CHỈ TRỤ SỞ / ĐỊA ĐIỂM THỰC TẬP',
  '/ MENTOR',
  'cam kết hoàn thành đúng khối lượng 480 giờ',
  'Quyền Xem công khai',
  'VD: Lập trình Web Frontend',
  'VD: Quận 7',
  'Kính mong Quý Thầy/Cô Khoa hỗ trợ',
  'ĐỊNH HƯỚNG / VỊ TRÍ THỰC TẬP MỤC TIÊU',
  'DOANH NGHIỆP BẠN ĐANG ỨNG TUYỂN / PHỎNG VẤN (NẾU CÓ):',
  'DỰ KIẾN KẾT QUẢ / TIẾN ĐỘ HIỆN TẠI',
  'GHI CHÚ / KẾ HOẠCH DỰ PHÒNG'
];

console.log('--- DeclarationPage.jsx checks ---');
checks.forEach(c => {
  const count = (djsx.match(new RegExp(c.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g')) || []).length;
  console.log(`${c}: found ${count} times`);
});
