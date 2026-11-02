const fs = require('fs');

function cleanAdvisor(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/\s*academicAdvisor,\s*/g, '\n');

  const oldBlock = `                      <div>
                        <span className="text-slate-400 text-[11px] block">Đại diện / Người liên hệ DN:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{contactPerson} ({contactPhone || contactEmail})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Giảng viên hướng dẫn:</span>
                        <strong className="text-blue-700 dark:text-sky-300">{academicAdvisor} ({advisorEmail})</strong>
                      </div>`;

  const newBlock = `                      <div>
                        <span className="text-slate-400 text-[11px] block">Cán bộ hướng dẫn (Mentor):</span>
                        <strong className="text-emerald-700 dark:text-emerald-300">{contactPerson} {contactPhone ? \`· SĐT: \${contactPhone}\` : ''}</strong>
                      </div>`;

  if (code.includes(oldBlock)) {
    code = code.replace(oldBlock, newBlock);
    console.log('Replaced oldBlock in', filePath);
  } else {
    console.log('oldBlock not found in', filePath);
  }
  fs.writeFileSync(filePath, code, 'utf8');
}

cleanAdvisor('TDTU_DB_CNTT_System/frontend/src/pages/DeclarationPage.jsx');
cleanAdvisor('TDTU_DB_CNTT_System/frontend/src/pages/DeclarationPage.tsx');
