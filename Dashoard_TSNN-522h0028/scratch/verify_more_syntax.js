const fs = require('fs');

const moreFiles = [
  'frontend/src/pages/DocumentsPage.jsx',
  'frontend/src/pages/DocumentsPage.tsx',
  'frontend/src/pages/ExportDataPage.jsx',
  'frontend/src/pages/ExportDataPage.tsx',
  'frontend/src/pages/CertificatesPage.jsx',
  'frontend/src/pages/CertificatesPage.tsx'
];

moreFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    console.error(`[ERROR]: ${f} brace mismatch: { = ${openBraces}, } = ${closeBraces}`);
  } else {
    console.log(`[OK]: ${f} braces balanced (${openBraces}). Length: ${content.length}`);
  }
});
