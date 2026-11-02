const fs = require('fs');

const cert = fs.readFileSync('frontend/src/pages/CertificatesPage.jsx', 'utf8');
const lines = cert.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('B1+') || l.includes('Chưa đạt chuẩn') || l.includes('chưa có chứng chỉ') || l.includes('Chuẩn B1')) {
    console.log(`=== Line ${idx + 1} ===`);
    const s = Math.max(0, idx - 8);
    const e = Math.min(lines.length, idx + 18);
    for (let i = s; i < e; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
