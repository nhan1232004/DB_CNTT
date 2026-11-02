const fs = require('fs');
const path = require('path');
const https = require('https');

const files = [
  'TDTU_DB_CNTT_System/frontend/src/services/prime-rbac.js',
  'TDTU_DB_CNTT_System/frontend/src/services/api.client.js',
  'TDTU_DB_CNTT_System/frontend/src/components/common/AdminNotificationModal.jsx',
  'TDTU_DB_CNTT_System/frontend/src/components/common/Navbar.jsx',
  'TDTU_DB_CNTT_System/frontend/src/components/common/Sidebar.jsx',
  'TDTU_DB_CNTT_System/frontend/src/components/student/StudentEligibilityBanner.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/LoginPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/DashboardPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/ProfilePage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/DeclarationPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/CertificatesPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/HandbookPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/StudentsPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/BulletinPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/EmailJdPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/SemestersPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/ImportDataPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/ExportDataPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/pages/AccountsPage.jsx',
  'TDTU_DB_CNTT_System/frontend/src/App.jsx'
];

// Download babel standalone to scratch if not present
const babelCache = path.resolve('D:/KTCN_TSNN/Dashoard_TSNN-main/scratch/babel.min.js');

function getBabel(cb) {
  if (fs.existsSync(babelCache) && fs.statSync(babelCache).size > 100000) {
    const code = fs.readFileSync(babelCache, 'utf8');
    const vm = require('vm');
    const ctx = { window: {}, navigator: {}, console };
    ctx.self = ctx;
    vm.createContext(ctx);
    vm.runInContext(code, ctx);
    return cb(ctx.Babel);
  }
  console.log('Downloading Babel standalone...');
  https.get('https://unpkg.com/@babel/standalone/babel.min.js', (res) => {
    if (res.statusCode >= 300 && res.headers.location) {
      const nextUrl = res.headers.location.startsWith('http')
        ? res.headers.location
        : `https://unpkg.com${res.headers.location}`;
      https.get(nextUrl, (res2) => {
        let data = '';
        res2.on('data', chunk => data += chunk);
        res2.on('end', () => {
          fs.writeFileSync(babelCache, data);
          getBabel(cb);
        });
      });
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      fs.writeFileSync(babelCache, data);
      getBabel(cb);
    });
  });
}

getBabel((Babel) => {
  let failed = 0;
  for (const rel of files) {
    const full = path.resolve('D:/KTCN_TSNN/Dashoard_TSNN-main', rel);
    try {
      const code = fs.readFileSync(full, 'utf8');
      Babel.transform(code, { presets: ['react'] });
      console.log(`✓ OK: ${rel}`);
    } catch (err) {
      console.error(`✗ FAIL: ${rel}`);
      console.error(`  Error: ${err.message}`);
      failed++;
    }
  }

  if (failed > 0) {
    console.error(`\nFound ${failed} Babel syntax errors!`);
    process.exit(1);
  } else {
    console.log(`\nAll ${files.length} files compiled cleanly with Babel Standalone!`);
  }
});
