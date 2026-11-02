const fs = require('fs');

const path = 'frontend/src/pages/AccountsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetThead = `<tr className="bg-[#f8fafc]/80  border-b border-[#e5e7eb]  font-bold text-[#1f2937] ">
                    <th className="py-3 px-4">Chức năng hệ thống</th>
                    <th className="py-3 px-3 text-center">Xem (2)</th>
                    <th className="py-3 px-3 text-center">Thêm (3)</th>
                    <th className="py-3 px-3 text-center">Sửa (5)</th>
                    <th className="py-3 px-3 text-center">Xóa (7)</th>
                    <th className="py-3 px-3 text-center">Scope All (11)</th>
                    <th className="py-3 px-3 text-center">Import (13)</th>
                    <th className="py-3 px-3 text-center">Export (17)</th>
                    <th className="py-3 px-4 text-right">Mã quyền tích (M)</th>
                  </tr>`;

const replacementThead = `<tr className="bg-[#f8fafc] border-b border-[#e5e7eb] font-bold text-[#1f2937] text-[13.5px]">
                    <th className="py-3 px-4 text-left">Chức năng hệ thống</th>
                    <th className="py-3 px-3 text-center">Xem</th>
                    <th className="py-3 px-3 text-center">Thêm</th>
                    <th className="py-3 px-3 text-center">Sửa</th>
                    <th className="py-3 px-3 text-center">Xóa</th>
                    <th className="py-3 px-3 text-center">Scope All</th>
                    <th className="py-3 px-3 text-center">Import</th>
                    <th className="py-3 px-3 text-center">Export</th>
                  </tr>`;

if (content.includes(targetThead)) {
  content = content.replace(targetThead, replacementThead);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated thead in AccountsPage.jsx');
} else {
  console.error('Target thead not found');
}
