const fs = require('fs');

function cleanStyles(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(/\r\n/g, '\n');

  // Remove the <style>{`...`}</style> block
  const styleStart = c.indexOf('{/* Print Stylesheet');
  const styleEnd = c.indexOf('`}</style>');

  if (styleStart !== -1 && styleEnd !== -1) {
    c = c.slice(0, styleStart) + c.slice(styleEnd + 10);
    console.log(`Cleaned style block in ${filePath}`);
  }

  // Remove unused handlePrintReport
  const oldFn = `  // In Báo cáo Họp Khoa & Ra quyết định (PDF)
  const handlePrintReport = () => {
    setActiveReportMode('pdf_meeting');
    setTimeout(() => {
      window.print();
    }, 250);
  };`;

  if (c.includes(oldFn)) {
    c = c.replace(oldFn, '');
    console.log(`Removed handlePrintReport in ${filePath}`);
  }

  fs.writeFileSync(filePath, c, 'utf8');
}

cleanStyles('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.jsx');
cleanStyles('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.tsx');
