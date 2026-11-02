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

async function verify() {
  console.log('========================================================================');
  console.log('🧪 TESTING SIMPLIFIED STEP 3 MENTOR & COMPANY DATA SYNC ACROSS ROLES');
  console.log('========================================================================');

  // 1. Submit from student
  console.log('\n[1] Submitting declaration from Student 51900839...');
  const declPayload = {
    studentId: '51900839',
    studentName: 'Võ Duy Trí',
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
    internshipStatus: 'has_company',
    selectedCourses: ['KTCN'],
    isConfirmed: true
  };

  const postRes = await request('/api/internship/declare', 'POST', declPayload, studentToken);
  console.log('  Declare result:', postRes.success ? '✓ SUCCESS' : postRes);

  // 2. Fetch declaration
  console.log('\n[2] Student fetches declaration:');
  const declRes = await request('/api/internship/declaration/51900839', 'GET', null, studentToken);
  console.log('  Company:', declRes.data?.companyName);
  console.log('  Tax Code:', declRes.data?.taxCode);
  console.log('  Mentor Name (contactPerson):', declRes.data?.contactPerson);
  console.log('  Mentor Phone (contactPhone):', declRes.data?.contactPhone);

  if (declRes.data?.contactPerson === 'Trần Vĩnh Phước' && declRes.data?.contactPhone === '0908 888 999') {
    console.log('  ✅ Declaration endpoint stores and returns Mentor Name & Phone correctly!');
  } else {
    throw new Error('Declaration endpoint failed to return Mentor Name & Phone!');
  }

  // 3. Lecturer views student
  console.log('\n[3] Lecturer views student master record:');
  const lecStudentRes = await request('/api/students/51900839', 'GET', null, lecturerToken);
  console.log('  Company:', lecStudentRes.data?.company);
  console.log('  Mentor:', lecStudentRes.data?.contactPerson);
  console.log('  Mentor Phone:', lecStudentRes.data?.contactPhone);

  if (lecStudentRes.data?.contactPerson === 'Trần Vĩnh Phước' && lecStudentRes.data?.contactPhone === '0908 888 999') {
    console.log('  ✅ Lecturer sees Mentor Name & Phone on Student Record!');
  } else {
    throw new Error('Lecturer failed to see Mentor Name & Phone!');
  }

  // 4. Admin views student list
  console.log('\n[4] Admin queries students list:');
  const allStudentsRes = await request('/api/students', 'GET', null, adminToken);
  const items = allStudentsRes.data?.data?.items || allStudentsRes.data?.items || [];
  const s = items.find(x => x.studentId === '51900839');
  console.log('  Found student:', s?.fullName);
  console.log('  Company:', s?.company || s?.companyName);
  console.log('  Mentor:', s?.contactPerson);
  console.log('  Mentor Phone:', s?.contactPhone);

  if (s?.contactPerson === 'Trần Vĩnh Phước' && s?.contactPhone === '0908 888 999') {
    console.log('  ✅ Admin Student List includes Mentor Name & Phone!');
  } else {
    throw new Error('Admin Student List failed to include Mentor Name & Phone!');
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL TESTS PASSED! DATA IS 100% SYNCHRONIZED ACROSS ALL ROLES!');
  console.log('========================================================================');
}

verify().catch(console.error);
