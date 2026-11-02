const fs = require('fs');

function updateProfilePage(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  const oldMentorBlock = `              <div className="flex items-start justify-between">
                <span className="text-slate-500">Người liên hệ / Mentor:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {declaration?.contactPerson || 'Anh Lê Hoàng Minh (Tech Lead)'}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500">Email đơn vị:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {declaration?.contactEmail || 'hr@anvietdigital.vn'}
                </span>
              </div>`;

  const newMentorBlock = `              <div className="flex items-start justify-between">
                <span className="text-slate-500">Cán bộ hướng dẫn (Mentor):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {declaration?.contactPerson || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500">Số điện thoại CBHD:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {declaration?.contactPhone || '—'}
                </span>
              </div>`;

  if (code.includes(oldMentorBlock)) {
    code = code.replace(oldMentorBlock, newMentorBlock);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Updated mentor fields in ${filePath}`);
  } else {
    console.error(`oldMentorBlock not found in ${filePath}`);
  }
}

updateProfilePage('TDTU_DB_CNTT_System/frontend/src/pages/ProfilePage.jsx');
updateProfilePage('TDTU_DB_CNTT_System/frontend/src/pages/ProfilePage.tsx');
