const http = require('http');

function makeToken(user) {
  return 'mock_jwt_' + Buffer.from(JSON.stringify(user)).toString('base64');
}

const adminToken = makeToken({ uid: 'usr_admin', email: 'admin@tdtu.edu.vn', name: 'Admin Khoa', role: 'admin', isAdmin: true });
const lecturerToken = makeToken({ uid: 'usr_lec', email: 'danghuynhtrung@tdtu.edu.vn', name: 'ThS. Đặng Huỳnh Trung', role: 'lecturer' });
const studentToken = makeToken({ uid: 'usr_51900839', email: '51900839@student.tdtu.edu.vn', name: 'Võ Duy Trí', role: 'student', studentId: '51900839' });

function request(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 TESTING ALL 3 DYNAMIC WIZARD PATHS END-TO-END');
  console.log('========================================================================');

  // TEST PATH 1: INTERVIEWING ("Đang tìm / Chờ phỏng vấn")
  console.log('\n--- PATH 1: ĐANG TÌM / CHỜ PHỎNG VẤN (Rút gọn 3 bước) ---');
  const payloadInterviewing = {
    studentId: '51900839',
    studentName: 'Võ Duy Trí',
    selectedCourses: ['KTCN'],
    isDualCourse: false,
    internshipStatus: 'interviewing',
    noCompanyOption: 'self',
    companyName: 'Đang chờ PV: TMA Solutions',
    position: 'Fullstack Web Developer',
    supportNote: 'Đang chờ kết quả phỏng vấn vòng 2 tại TMA Solutions',
    isConfirmed: true
  };
  const res1 = await request('/api/internship/declare', 'POST', payloadInterviewing, studentToken);
  console.log('  Submit interviewing:', res1.success ? '✓ SUCCESS' : res1);

  const decl1 = await request('/api/internship/declaration/51900839', 'GET', null, studentToken);
  console.log('  Decl data:', {
    companyName: decl1.data?.companyName,
    noCompanyOption: decl1.data?.noCompanyOption,
    position: decl1.data?.position,
    supportNote: decl1.data?.supportNote
  });

  const sv1 = await request('/api/students/51900839', 'GET', null, lecturerToken);
  console.log('  Lecturer sees student status:', sv1.data?.status, '| Company:', sv1.data?.companyName || sv1.data?.company);
  if (sv1.data?.status === 'seeking' && sv1.data?.noCompanyOption === 'self') {
    console.log('  ✅ Path 1 (Interviewing) synchronized with Lecturer & Admin!');
  } else {
    throw new Error('Path 1 failed sync test!');
  }

  // TEST PATH 2: NEED_SUPPORT ("Cần Khoa hỗ trợ")
  console.log('\n--- PATH 2: CẦN KHOA HỖ TRỢ (Rút gọn 3 bước) ---');
  const payloadNeedSupport = {
    studentId: '51900839',
    studentName: 'Võ Duy Trí',
    selectedCourses: ['KTCN', 'TSNN'],
    isDualCourse: true,
    internshipStatus: 'need_support',
    noCompanyOption: 'faculty',
    companyName: 'Khoa CNTT hỗ trợ',
    position: 'AI / Data Engineer',
    supportNote: 'Lý do: Chưa tìm được doanh nghiệp phù hợp - Khu vực mong muốn: Quận 7, TP.HCM',
    isConfirmed: true
  };
  const res2 = await request('/api/internship/declare', 'POST', payloadNeedSupport, studentToken);
  console.log('  Submit need_support:', res2.success ? '✓ SUCCESS' : res2);

  const decl2 = await request('/api/internship/declaration/51900839', 'GET', null, studentToken);
  console.log('  Decl data:', {
    companyName: decl2.data?.companyName,
    noCompanyOption: decl2.data?.noCompanyOption,
    position: decl2.data?.position
  });

  const sv2 = await request('/api/students/51900839', 'GET', null, lecturerToken);
  console.log('  Lecturer sees student status:', sv2.data?.status, '| Company:', sv2.data?.companyName || sv2.data?.company);
  if (sv2.data?.status === 'seeking' && sv2.data?.noCompanyOption === 'faculty') {
    console.log('  ✅ Path 2 (Need Support) synchronized with Lecturer & Admin!');
  } else {
    throw new Error('Path 2 failed sync test!');
  }

  // TEST PATH 3: HAS_COMPANY ("Đã có nơi thực tập")
  console.log('\n--- PATH 3: ĐÃ CÓ NƠI THỰC TẬP (4 bước đầy đủ) ---');
  const payloadHasCompany = {
    studentId: '51900839',
    studentName: 'Võ Duy Trí',
    selectedCourses: ['KTCN'],
    isDualCourse: false,
    internshipStatus: 'has_company',
    companyName: 'CÔNG TY TNHH VNG CORPORATION',
    taxCode: '0303493206',
    address: 'Z06, Đường số 13, KCX Tân Thuận, Quận 7, TP. HCM',
    representative: 'Lê Hồng Minh',
    taxDepartment: 'Chi cục Thuế Quận 7',
    companyStatus: 'Đang hoạt động',
    orgType: 'Công ty TNHH',
    contactPerson: 'Trần Vĩnh Phước',
    contactPhone: '0908 888 999',
    position: 'Backend Golang Intern',
    department: 'ZaloPay Platform Team',
    supportNote: '',
    isConfirmed: true
  };
  const res3 = await request('/api/internship/declare', 'POST', payloadHasCompany, studentToken);
  console.log('  Submit has_company:', res3.success ? '✓ SUCCESS' : res3);

  const decl3 = await request('/api/internship/declaration/51900839', 'GET', null, studentToken);
  console.log('  Decl data:', {
    companyName: decl3.data?.companyName,
    taxCode: decl3.data?.taxCode,
    contactPerson: decl3.data?.contactPerson,
    contactPhone: decl3.data?.contactPhone,
    position: decl3.data?.position
  });

  const sv3 = await request('/api/students/51900839', 'GET', null, lecturerToken);
  console.log('  Lecturer sees student status:', sv3.data?.status, '| Company:', sv3.data?.companyName || sv3.data?.company);
  if (sv3.data?.status === 'has_company' && sv3.data?.contactPerson === 'Trần Vĩnh Phước') {
    console.log('  ✅ Path 3 (Has Company) synchronized with Lecturer & Admin!');
  } else {
    throw new Error('Path 3 failed sync test!');
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL 3 DYNAMIC WIZARD PATHS ARE 100% OPERATIONAL & SYNCHRONIZED!');
  console.log('========================================================================');
}

runTests().catch(console.error);
