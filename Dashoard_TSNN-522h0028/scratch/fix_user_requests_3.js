const fs = require('fs');

// 1. Update DeclarationPage.jsx
let declJsx = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf-8');

// Change courseDisplay to 'KTCN-TSNN'
declJsx = declJsx.replace(
  /const courseDisplay = isDualCourse \|\| selectedCourses\.length === 2\s*\?\s*'KTCN & TSNN'\s*:\s*selectedCourses\.includes\('TSNN'\)\s*\?\s*'TSNN'\s*:\s*'KTCN';/,
  `const courseDisplay = isDualCourse || selectedCourses.length === 2
    ? 'KTCN-TSNN'
    : selectedCourses.includes('TSNN')
      ? 'TSNN'
      : 'KTCN';`
);

declJsx = declJsx.replace(
  "Phân bổ chính thức: KTCN & TSNN",
  "Phân bổ chính thức: KTCN-TSNN"
);

declJsx = declJsx.replace(
  "courseCode: isDualCourse ? 'KTCN & TSNN' : selectedCourses.includes('TSNN') ? 'TSNN' : 'KTCN',",
  "courseCode: isDualCourse ? 'KTCN-TSNN' : selectedCourses.includes('TSNN') ? 'TSNN' : 'KTCN',"
);

// Add inline styles to ensure Stepper labels and Card 1, 2, 3 titles and texts are NEVER white
declJsx = declJsx.replace(
  /<div className=\{`text-xs font-extrabold \$\{\s*isCurrent \? 'text-\[#1f2937\]' : 'text-slate-400'\s*\}`\}>\s*\{s\.label\}\s*<\/div>/,
  `<div style={{ color: isCurrent ? '#1f2937' : '#94a3b8' }} className="text-xs font-extrabold">
                              {s.label}
                            </div>`
);

declJsx = declJsx.replace(
  /<div className="font-extrabold text-sm text-\[#1f2937\]">\s*Đã có nơi thực tập\s*<\/div>/,
  `<div style={{ color: '#1f2937' }} className="font-extrabold text-sm text-[#1f2937]">
                          Đã có nơi thực tập
                        </div>`
);

declJsx = declJsx.replace(
  /<div className="font-extrabold text-sm text-\[#1f2937\]">\s*Đang tìm \/ Chờ phỏng vấn\s*<\/div>/,
  `<div style={{ color: '#1f2937' }} className="font-extrabold text-sm text-[#1f2937]">
                          Đang tìm / Chờ phỏng vấn
                        </div>`
);

declJsx = declJsx.replace(
  /<div className="font-extrabold text-sm text-\[#1f2937\]">\s*Cần Khoa hỗ trợ\s*<\/div>/,
  `<div style={{ color: '#1f2937' }} className="font-extrabold text-sm text-[#1f2937]">
                          Cần Khoa hỗ trợ
                        </div>`
);

// Remove any remaining dark:text-white in DeclarationPage.jsx
declJsx = declJsx.replaceAll('dark:text-white', '');

fs.writeFileSync('frontend/src/pages/DeclarationPage.jsx', declJsx, 'utf-8');
console.log('Updated DeclarationPage.jsx');


// 2. Update DeclarationPage.tsx identically
let declTsx = fs.readFileSync('frontend/src/pages/DeclarationPage.tsx', 'utf-8');

declTsx = declTsx.replace(
  /const courseDisplay = isDualCourse \|\| selectedCourses\.length === 2\s*\?\s*'KTCN & TSNN'\s*:\s*selectedCourses\.includes\('TSNN'\)\s*\?\s*'TSNN'\s*:\s*'KTCN';/,
  `const courseDisplay = isDualCourse || selectedCourses.length === 2
    ? 'KTCN-TSNN'
    : selectedCourses.includes('TSNN')
      ? 'TSNN'
      : 'KTCN';`
);

declTsx = declTsx.replace(
  "Phân bổ chính thức: KTCN & TSNN",
  "Phân bổ chính thức: KTCN-TSNN"
);

declTsx = declTsx.replace(
  "courseCode: isDualCourse ? 'KTCN & TSNN' : selectedCourses.includes('TSNN') ? 'TSNN' : 'KTCN',",
  "courseCode: isDualCourse ? 'KTCN-TSNN' : selectedCourses.includes('TSNN') ? 'TSNN' : 'KTCN',"
);

declTsx = declTsx.replace(
  /<div className=\{`text-xs font-extrabold \$\{\s*isCurrent \? 'text-\[#1f2937\]' : 'text-slate-400'\s*\}`\}>\s*\{s\.label\}\s*<\/div>/,
  `<div style={{ color: isCurrent ? '#1f2937' : '#94a3b8' }} className="text-xs font-extrabold">
                              {s.label}
                            </div>`
);

declTsx = declTsx.replace(
  /<div className="font-extrabold text-sm text-\[#1f2937\]">\s*Đã có nơi thực tập\s*<\/div>/,
  `<div style={{ color: '#1f2937' }} className="font-extrabold text-sm text-[#1f2937]">
                          Đã có nơi thực tập
                        </div>`
);

declTsx = declTsx.replace(
  /<div className="font-extrabold text-sm text-\[#1f2937\]">\s*Đang tìm \/ Chờ phỏng vấn\s*<\/div>/,
  `<div style={{ color: '#1f2937' }} className="font-extrabold text-sm text-[#1f2937]">
                          Đang tìm / Chờ phỏng vấn
                        </div>`
);

declTsx = declTsx.replace(
  /<div className="font-extrabold text-sm text-\[#1f2937\]">\s*Cần Khoa hỗ trợ\s*<\/div>/,
  `<div style={{ color: '#1f2937' }} className="font-extrabold text-sm text-[#1f2937]">
                          Cần Khoa hỗ trợ
                        </div>`
);

declTsx = declTsx.replaceAll('dark:text-white', '');

fs.writeFileSync('frontend/src/pages/DeclarationPage.tsx', declTsx, 'utf-8');
console.log('Updated DeclarationPage.tsx');


// 3. Remove "Chuẩn B1 tương đương" in CertificatesPage.jsx and CertificatesPage.tsx
let certJsx = fs.readFileSync('frontend/src/pages/CertificatesPage.jsx', 'utf-8');
certJsx = certJsx.replace(
  /\s*<div className="text-\[11px\] text-\[#1f2937\]\s*">\s*Chuẩn B1 tương đương\s*<\/div>/,
  ''
);
fs.writeFileSync('frontend/src/pages/CertificatesPage.jsx', certJsx, 'utf-8');
console.log('Updated CertificatesPage.jsx');

let certTsx = fs.readFileSync('frontend/src/pages/CertificatesPage.tsx', 'utf-8');
certTsx = certTsx.replace(
  /\s*<div className="text-\[11px\] text-slate-500 dark:text-slate-400">\s*Chuẩn B1 tương đương\s*<\/div>/,
  ''
);
fs.writeFileSync('frontend/src/pages/CertificatesPage.tsx', certTsx, 'utf-8');
console.log('Updated CertificatesPage.tsx');
