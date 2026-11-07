import fs from 'node:fs';
import path from 'node:path';
import { transform } from 'esbuild';

const FRONTEND_DIR = path.resolve(process.cwd(), 'TDTU_DB_CNTT_System/frontend');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');
const OUT_FILE = path.join(DIST_DIR, 'app.bundle.js');

const SOURCE_FILES = [
  'src/config/firebase.config.ts',
  'src/services/prime-rbac.ts',
  'src/services/api.client.ts',
  'src/components/common/AdminNotificationModal.tsx',
  'src/components/common/Navbar.tsx',
  'src/components/common/Sidebar.tsx',
  'src/components/student/StudentEligibilityBanner.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/DashboardPage.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/DeclarationPage.tsx',
  'src/pages/CertificatesPage.tsx',
  'src/pages/StudentsPage.tsx',
  'src/pages/BulletinPage.tsx',
  'src/pages/EmailJdPage.tsx',
  'src/pages/SemestersPage.tsx',
  'src/pages/ImportDataPage.tsx',
  'src/pages/ExportDataPage.tsx',
  'src/pages/DocumentsPage.tsx',
  'src/pages/AccountsPage.tsx',
  'src/App.tsx'
];

async function buildFrontend() {
  const startTime = Date.now();
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const chunks = [
    '/* TDTU DB_CNTT Pre-compiled Production Bundle (esbuild) */',
    '"use strict";'
  ];

  let totalRawBytes = 0;

  for (const relPath of SOURCE_FILES) {
    const absPath = path.join(FRONTEND_DIR, relPath);
    const source = fs.readFileSync(absPath, 'utf8');
    totalRawBytes += Buffer.byteLength(source, 'utf8');

    const loader = relPath.endsWith('.tsx') ? 'tsx' : 'ts';
    const result = await transform(source, {
      loader,
      target: 'es2020',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false,
      charset: 'utf8',
      sourcefile: relPath
    });

    chunks.push(`\n/* --- ${relPath} --- */\n(function(){\n${result.code}\n})();`);
  }

  const finalCode = chunks.join('\n');
  fs.writeFileSync(OUT_FILE, finalCode, 'utf8');

  const outBytes = Buffer.byteLength(finalCode, 'utf8');
  const elapsed = Date.now() - startTime;
  console.log(
    `[esbuild] Built ${SOURCE_FILES.length} modules -> TDTU_DB_CNTT_System/frontend/dist/app.bundle.js ` +
    `(${(totalRawBytes / 1024).toFixed(1)} KB raw -> ${(outBytes / 1024).toFixed(1)} KB bundled) in ${elapsed}ms`
  );
}

buildFrontend().catch(err => {
  console.error('[esbuild] Frontend build failed:', err);
  process.exit(1);
});
