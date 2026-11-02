const fs = require('fs');

// 1. Update ExportDataPage.jsx and ExportDataPage.tsx
function updateExportPage(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  const oldRow = `            'Doanh nghiệp': s.company || 'Chưa có',
            'Vị trí thực tập': s.position || 'Thực tập sinh',`;

  const newRow = `            'Doanh nghiệp': s.company || 'Chưa có',
            'Vị trí thực tập': s.position || 'Thực tập sinh',
            'Cán bộ hướng dẫn (Mentor)': s.contactPerson || '—',
            'SĐT Cán bộ hướng dẫn': s.contactPhone || '—',`;

  if (code.includes(oldRow)) {
    code = code.replace(oldRow, newRow);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Updated exportData in ${filePath}`);
  }
}

updateExportPage('TDTU_DB_CNTT_System/frontend/src/pages/ExportDataPage.jsx');
updateExportPage('TDTU_DB_CNTT_System/frontend/src/pages/ExportDataPage.tsx');

// 2. Update api.client.js and api.client.ts
function updateApiClient(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  const oldFmt = `      'Doanh nghiệp tiếp nhận': s.companyName || s.company || 'Chưa có',
      'Ghi chú GV': s.lecturerNote || '',`;

  const newFmt = `      'Doanh nghiệp tiếp nhận': s.companyName || s.company || 'Chưa có',
      'Cán bộ hướng dẫn (Mentor)': s.contactPerson || '—',
      'SĐT Cán bộ hướng dẫn': s.contactPhone || '—',
      'Ghi chú GV': s.lecturerNote || '',`;

  if (code.includes(oldFmt)) {
    code = code.replace(oldFmt, newFmt);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Updated exportStudentsExcel in ${filePath}`);
  }
}

updateApiClient('TDTU_DB_CNTT_System/frontend/src/services/api.client.js');
updateApiClient('TDTU_DB_CNTT_System/frontend/src/services/api.client.ts');
