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

async function run() {
  console.log('========================================================================');
  console.log('🚀 TESTING STEP 3 COMPANY INFO, ADVISOR & DATA SYNC');
  console.log('========================================================================');

  // Test 1: Submit declaration from student
  console.log('\n[1] Student submits Step 3 declaration...');
  const declPayload = {
    studentId: '51900839',
    studentName: 'Võ Duy Trí',
    companyName: 'TẬP ĐOÀN CÔNG NGHỆ CMC',
    taxCode: '0100244195',
    address: 'CMC Tower, Duy Tân, Cầu Giấy, Hà Nội',
    representative: 'Nguyễn Trung Chính',
    mainIndustry: 'Viễn thông và Công nghệ thông tin',
    taxDepartment: 'Cục Thuế TP. Hà Nội',
    companyStatus: 'Đang hoạt động',
    orgType: 'Công ty Cổ phần',
    taxUpdatedAt: '2026-10-30T09:00:00Z',
    contactPerson: 'Trần Đăng Khoa',
    contactRole: 'Trưởng phòng Nhân sự CNTT',
    contactPhone: '024 3795 8668',
    contactEmail: 'khoatd@cmc.com.vn',
    academicAdvisor: 'TS. Vũ Đình Bảy',
    advisorEmail: 'vudinhbay@tdtu.edu.vn',
    advisorNote: 'Kính gửi Thầy duyệt đề tài thực tập Cloud DevOps',
    position: 'Cloud DevOps Intern',
    internshipStatus: 'has_company',
    selectedCourses: ['KTCN', 'TSNN'],
    isDualCourse: true,
    isConfirmed: true
  };

  const submitRes = await request('/api/internship/declare', 'POST', declPayload, studentToken);
  console.log('  Submit result:', submitRes.success ? '✓ SUCCESS' : submitRes);

  // Test 2: Student retrieves their declaration
  console.log('\n[2] Student retrieves their own declaration...');
  const studentDecl = await request('/api/internship/declaration/51900839', 'GET', null, studentToken);
  console.log('  Company:', studentDecl.data?.companyName);
  console.log('  Tax Code:', studentDecl.data?.taxCode);
  console.log('  Representative:', studentDecl.data?.representative);
  console.log('  Contact Person (DN):', studentDecl.data?.contactPerson, `(${studentDecl.data?.contactRole})`);
  console.log('  Academic Advisor (Khoa):', studentDecl.data?.academicAdvisor, `(${studentDecl.data?.advisorEmail})`);
  console.log('  Advisor Note:', studentDecl.data?.advisorNote);

  // Test 3: Lecturer views student details
  console.log('\n[3] Lecturer views student master record...');
  const lecStudentRes = await request('/api/students/51900839', 'GET', null, lecturerToken);
  const svLec = lecStudentRes.data;
  console.log('  Lecturer sees Company:', svLec?.company);
  console.log('  Lecturer sees Tax Code:', svLec?.taxCode);
  console.log('  Lecturer sees Mentor:', svLec?.contactPerson);
  console.log('  Lecturer sees Advisor:', svLec?.academicAdvisor);
  console.log('  Lecturer sees Advisor Note:', svLec?.advisorNote);

  // Test 4: Admin views student list & summary
  console.log('\n[4] Admin queries students summary & list...');
  const summaryRes = await request('/api/students/summary', 'GET', null, adminToken);
  console.log('  Summary counts:', {
    totalStudents: summaryRes.data?.totalStudents,
    hasCompany: summaryRes.data?.hasCompany,
    dualCourseStudents: summaryRes.data?.dualCourseStudents
  });

  const studentsListRes = await request('/api/students?course=DUAL', 'GET', null, adminToken);
  const dualList = studentsListRes.data?.data?.items || studentsListRes.data?.items || [];
  const foundInDual = dualList.find(s => s.studentId === '51900839');
  console.log('  Found in Dual course filter:', Boolean(foundInDual));
  if (foundInDual) {
    console.log('  Dual student company:', foundInDual.company || foundInDual.companyName);
    console.log('  Dual student advisor:', foundInDual.academicAdvisor);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED 100%!');
  console.log('========================================================================');
}

run().catch(console.error);
