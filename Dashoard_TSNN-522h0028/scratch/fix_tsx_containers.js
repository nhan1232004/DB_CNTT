const fs = require('fs');
const path = require('path');

const tsxFiles = [
  'frontend/src/pages/CertificatesPage.tsx',
  'frontend/src/pages/DashboardPage.tsx',
  'frontend/src/pages/DocumentsPage.tsx',
  'frontend/src/pages/EmailJdPage.tsx',
  'frontend/src/pages/ExportDataPage.tsx',
  'frontend/src/pages/HandbookPage.tsx',
  'frontend/src/pages/ImportDataPage.tsx',
  'frontend/src/pages/ProfilePage.tsx',
  'frontend/src/pages/SemestersPage.tsx'
];

tsxFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    const before = content;
    content = content.replaceAll('space-y-6 max-w-7xl mx-auto pb-12', 'space-y-6 w-full pb-12');
    if (content !== before) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log('Updated:', file);
    } else {
      console.log('No change for:', file);
    }
  }
});
