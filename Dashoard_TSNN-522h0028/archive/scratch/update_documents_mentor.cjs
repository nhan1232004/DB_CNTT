const fs = require('fs');

function updateDocumentsPage(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Table cell: add Mentor display under company
  const oldTableCell = `                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {s.company}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s.position}
                          </div>
                        </td>`;

  const newTableCell = `                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {s.company}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s.position}
                          </div>
                          {s.contactPerson && s.contactPerson !== '—' && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              Mentor: {s.contactPerson} {s.contactPhone ? \`(\${s.contactPhone})\` : ''}
                            </div>
                          )}
                        </td>`;

  if (code.includes(oldTableCell)) {
    code = code.replace(oldTableCell, newTableCell);
  }

  // 2. Export excel sheets: replace Giảng viên hướng dẫn with SĐT Cán bộ hướng dẫn
  const oldExcelCols = `          'Người đại diện / Mentor DN': s.contactPerson || '—',
          'Giảng viên hướng dẫn': s.academicAdvisor || 'Khoa CNTT',`;

  const newExcelCols = `          'Cán bộ hướng dẫn (Mentor)': s.contactPerson || '—',
          'SĐT Cán bộ hướng dẫn': s.contactPhone || '—',`;

  if (code.includes(oldExcelCols)) {
    code = code.replaceAll(oldExcelCols, newExcelCols);
  }

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Updated ${filePath}`);
}

updateDocumentsPage('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.jsx');
updateDocumentsPage('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.tsx');
