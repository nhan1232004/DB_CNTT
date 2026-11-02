const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/CertificatesPage.tsx', 'utf-8');
c = c.replace(/<span className="w-9 h-9 rounded-xl bg-blue-100[\s\S]*?<\/span>/, '');
c = c.replace(/<p className="text-xs text-slate-500[\s\S]*?Tra cứu, theo dõi hồ sơ chứng chỉ[\s\S]*?<\/p>/, '');
fs.writeFileSync('frontend/src/pages/CertificatesPage.tsx', c, 'utf-8');
console.log('Cleaned CertificatesPage.tsx successfully');
