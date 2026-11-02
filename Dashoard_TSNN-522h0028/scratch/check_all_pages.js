const fs = require('fs');

console.log('--- Checking DashboardPage.jsx ---');
const dash = fs.readFileSync('frontend/src/pages/DashboardPage.jsx', 'utf8');
['Tiến độ thực tập toàn khóa', 'Đồng bộ dữ liệu thời gian thực', 'Đủ điều kiện xét tốt nghiệp', 'Cần ôn luyện nâng bậc', 'Đạt chuẩn Tốt nghiệp', 'Chưa đạt chuẩn'].forEach(term => {
  const count = (dash.match(new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g')) || []).length;
  console.log(`${term}: found ${count} times`);
});

console.log('\n--- Checking SemestersPage.jsx ---');
const sem = fs.readFileSync('frontend/src/pages/SemestersPage.jsx', 'utf8');
['Sinh viên hoàn thành khai báo doanh nghiệp', 'Đợt thực tập học kỳ hè', 'Đã hoàn tất báo cáo và nghiệm thu'].forEach(term => {
  const count = (sem.match(new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g')) || []).length;
  console.log(`${term}: found ${count} times`);
});

console.log('\n--- Checking ImportDataPage.jsx ---');
const imp = fs.readFileSync('frontend/src/pages/ImportDataPage.jsx', 'utf8');
['Mã quyền: 26', 'Nạp danh sách sinh viên hàng loạt', 'w-10 h-10 rounded-xl bg-[#ebf3ff]'].forEach(term => {
  const count = (imp.match(new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g')) || []).length;
  console.log(`${term}: found ${count} times`);
});

console.log('\n--- Checking AccountsPage.jsx ---');
const acc = fs.readFileSync('frontend/src/pages/AccountsPage.jsx', 'utf8');
['Tùy chỉnh Hạn chót', 'Ma trận Quyền Nguyên tố', 'Tài khoản & Phân quyền'].forEach(term => {
  const count = (acc.match(new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g')) || []).length;
  console.log(`${term}: found ${count} times`);
});

console.log('\n--- Checking EmailJdPage.jsx ---');
const eml = fs.readFileSync('frontend/src/pages/EmailJdPage.jsx', 'utf8');
['Mã quyền: 210', 'Gateway nhận tin tự động', 'Tự động nhận diện'].forEach(term => {
  const count = (eml.match(new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g')) || []).length;
  console.log(`${term}: found ${count} times`);
});

console.log('\n--- Checking ProfilePage.jsx ---');
const prof = fs.readFileSync('frontend/src/pages/ProfilePage.jsx', 'utf8');
['Hồ sơ của bạn đã hoàn tất xác nhận', 'Thực tập Song song (2 môn)', '503112 + 503113'].forEach(term => {
  const count = (prof.match(new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g')) || []).length;
  console.log(`${term}: found ${count} times`);
});
