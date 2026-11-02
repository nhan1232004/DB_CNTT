const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'mock_jwt_student_522H0045'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 3000,
      path: path,
      headers: {
        'Authorization': 'mock_jwt_student_522H0045'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  console.log('--- TEST 1: Declare Internship with need_support and Language Cert ---');
  const declRes = await postJson('/api/internship/declare', {
    studentId: '522H0045',
    studentName: 'Nguyễn Hữu Nhân',
    companyName: '',
    internshipStatus: 'need_support',
    noCompanyOption: 'faculty',
    foreignLanguage: 'Aptis ESOL',
    foreignScore: '160',
    isConfirmed: true,
    isDualCourse: true,
    selectedCourses: ['KTCN', 'TSNN']
  });
  console.log('Declare response status:', declRes.status, 'success:', declRes.data?.success);

  console.log('--- TEST 2: Verify GET /api/students returns updated company & cert ---');
  const studentsRes = await getJson('/api/students');
  const items = studentsRes.data?.data?.items || studentsRes.data?.items || [];
  const s45 = items.find(s => s.studentId === '522H0045');
  console.log('Student 522H0045 status:', s45?.status);
  console.log('Student 522H0045 companyName:', s45?.companyName);
  console.log('Student 522H0045 noCompanyOption:', s45?.noCompanyOption);
  console.log('Student 522H0045 certificateDisplay:', s45?.certificateDisplay);
  console.log('Student 522H0045 courseCode:', s45?.courseCode);

  if (s45?.noCompanyOption === 'faculty' && s45?.companyName === 'Khoa CNTT hỗ trợ') {
    console.log('✓ PASS: Need support & Faculty company correctly synced in students master query!');
  } else {
    console.error('✗ FAIL: Company mismatch:', s45);
  }

  if (s45?.certificateDisplay?.includes('Aptis ESOL')) {
    console.log('✓ PASS: Foreign language certificate auto-synced into student certificateDisplay!');
  } else {
    console.error('✗ FAIL: Certificate display mismatch:', s45?.certificateDisplay);
  }

  console.log('--- TEST 3: Verify GET /api/certificates Scope All has Aptis ESOL 160 ---');
  const certsRes = await getJson('/api/certificates');
  const allCerts = certsRes.data?.data || certsRes.data || [];
  const cert45 = allCerts.find(c => c.studentId === '522H0045' && c.name === 'Aptis ESOL');
  console.log('Found cert for 522H0045:', cert45 ? `${cert45.name} ${cert45.score}` : 'NOT FOUND');
  if (cert45) {
    console.log('✓ PASS: Certificates Scope All has the declaration certificate!');
  } else {
    console.error('✗ FAIL: Cert not found in /api/certificates');
  }

  console.log('--- TEST 4: Student declares Has Company (FPT Software) ---');
  const decl2 = await postJson('/api/internship/declare', {
    studentId: '522H0045',
    studentName: 'Nguyễn Hữu Nhân',
    companyName: 'FPT Software',
    taxCode: '0101778163',
    position: 'Frontend React Developer',
    internshipStatus: 'has_company',
    isConfirmed: true,
    isDualCourse: false,
    selectedCourses: ['KTCN']
  });
  console.log('Declare 2 status:', decl2.status);

  const studentsRes2 = await getJson('/api/students');
  const s45_2 = (studentsRes2.data?.data?.items || studentsRes2.data?.items || []).find(s => s.studentId === '522H0045');
  console.log('Updated s45 status:', s45_2?.status, 'company:', s45_2?.companyName, 'noCompanyOption:', s45_2?.noCompanyOption);
  if (s45_2?.status === 'has_company' && s45_2?.companyName === 'FPT Software' && !s45_2?.noCompanyOption) {
    console.log('✓ PASS: Has company declaration successfully synced to students query!');
  } else {
    console.error('✗ FAIL:', s45_2);
  }

  console.log('--- TEST 5: GET /api/students/summary ---');
  const summaryRes = await getJson('/api/students/summary');
  console.log('Summary data:', summaryRes.data?.data || summaryRes.data);
}

runTest().catch(console.error);
