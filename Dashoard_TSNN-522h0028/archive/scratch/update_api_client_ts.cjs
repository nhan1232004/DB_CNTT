const fs = require('fs');
let c = fs.readFileSync('TDTU_DB_CNTT_System/frontend/src/services/api.client.ts', 'utf8');

const target = `    // 4. Mặc định trả về mảng rỗng [] khi chưa có danh sách chính thức từ Khoa
    return [];`;

const replacement = `    // 4. Truy vấn trực tiếp từ Live API Backend SQLite (Master Data)
    try {
      const res: any = await this.request('/api/students');
      const items = res?.items || res?.data?.items || res?.students;
      if (Array.isArray(items) && items.length > 0) {
        const cleanList = items.map((s: any, idx: number) => ({
          ...s,
          id: s.studentId,
          mssv: s.studentId,
          name: s.fullName || s.name,
          class: s.className || s.class,
          status: s.status === 'has_company' ? 'Có doanh nghiệp' : (s.noCompanyOption === 'faculty' ? 'Cần hỗ trợ' : (s.status === 'seeking' ? 'Đang tìm' : s.status)),
          company: s.companyName || (s.noCompanyOption === 'faculty' ? 'Khoa CNTT hỗ trợ' : (s.status === 'seeking' ? 'Đang tìm / Chờ PV' : '—')),
          position: s.position || '',
          cert: s.certificateDisplay || s.certName || s.cert || null,
          isDualCourse: Boolean(s.isDualCourse === 1 || s.isDualCourse === true)
        }));
        this.saveLiveStudents(cleanList);
        return cleanList;
      }
    } catch {}

    // 5. Mặc định trả về mảng rỗng [] khi chưa có danh sách chính thức từ Khoa
    return [];`;

c = c.replace(/\r\n/g, '\n');
if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync('TDTU_DB_CNTT_System/frontend/src/services/api.client.ts', c, 'utf8');
  console.log('Successfully updated api.client.ts');
} else {
  console.error('Target not found in api.client.ts');
}
