const fs = require('fs');

function enrichDocumentsPage(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Add fields in mapping
  const targetMap = `            company: companyName ? companyName : (statusCode === 'need_support' ? 'Khoa CNTT hỗ trợ' : 'Chưa có nơi thực tập'),
            position: position ? position : (statusCode === 'need_support' ? 'Chưa xác định' : 'Chưa cập nhật'),
            taxCode: taxCode || '—',
            status: displayStatus,`;

  const replacementMap = `            company: companyName ? companyName : (statusCode === 'need_support' ? 'Khoa CNTT hỗ trợ' : 'Chưa có nơi thực tập'),
            position: position ? position : (statusCode === 'need_support' ? 'Chưa xác định' : 'Chưa cập nhật'),
            taxCode: taxCode || '—',
            academicAdvisor: localDecl?.academicAdvisor || s.academicAdvisor || 'Khoa CNTT',
            advisorEmail: localDecl?.advisorEmail || s.advisorEmail || '',
            contactPerson: localDecl?.contactPerson || s.contactPerson || '—',
            contactRole: localDecl?.contactRole || s.contactRole || '',
            contactPhone: localDecl?.contactPhone || s.contactPhone || '',
            contactEmail: localDecl?.contactEmail || s.contactEmail || '',
            status: displayStatus,`;

  if (code.includes(targetMap)) {
    code = code.replace(targetMap, replacementMap);
  }

  // 2. Add to ktcnRows and tsnnRows in handleExportExcel
  const oldKtcnMap = `          'Mã số thuế': s.taxCode,
          'Chứng chỉ ngoại ngữ': s.certificate || 'Chưa nộp',`;

  const newKtcnMap = `          'Mã số thuế': s.taxCode,
          'Người đại diện / Mentor DN': s.contactPerson || '—',
          'Giảng viên hướng dẫn': s.academicAdvisor || 'Khoa CNTT',
          'Chứng chỉ ngoại ngữ': s.certificate || 'Chưa nộp',`;

  if (code.includes(oldKtcnMap)) {
    code = code.replaceAll(oldKtcnMap, newKtcnMap);
  }

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Enriched ${filePath}`);
}

enrichDocumentsPage('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.jsx');
enrichDocumentsPage('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.tsx');
