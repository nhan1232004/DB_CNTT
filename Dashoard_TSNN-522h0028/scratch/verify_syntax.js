const fs = require('fs');

const files = [
  'frontend/src/pages/SemestersPage.jsx',
  'frontend/src/pages/SemestersPage.tsx',
  'frontend/src/pages/ImportDataPage.jsx',
  'frontend/src/pages/ImportDataPage.tsx',
  'frontend/src/pages/AccountsPage.jsx',
  'frontend/src/pages/EmailJdPage.jsx',
  'frontend/src/pages/EmailJdPage.tsx',
  'frontend/src/pages/ProfilePage.jsx',
  'frontend/src/pages/ProfilePage.tsx',
  'frontend/src/pages/DeclarationPage.jsx',
  'frontend/src/pages/DeclarationPage.tsx',
  'frontend/src/pages/DashboardPage.jsx',
  'frontend/src/pages/DashboardPage.tsx'
];

let allOk = true;
files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.log(`[SKIP]: ${f} does not exist.`);
    return;
  }
  const content = fs.readFileSync(f, 'utf8');
  // Check for unclosed brackets or obvious syntax errors
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    console.error(`[ERROR]: ${f} brace mismatch: { = ${openBraces}, } = ${closeBraces}`);
    allOk = false;
  } else {
    console.log(`[OK]: ${f} braces balanced (${openBraces}). Length: ${content.length}`);
  }
});

if (allOk) {
  console.log('\nAll files passed brace balance verification!');
}
