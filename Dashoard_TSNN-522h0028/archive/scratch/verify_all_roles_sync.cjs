const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'mock_jwt_student_522H0045'
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d || '{}') }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 3000,
      path,
      headers: {
        'Authorization': 'mock_jwt_student_522H0045'
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d || '{}') }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('========================================================================');
  console.log('🧪 TOÀN BỘ KIỂM THỬ ĐỒNG BỘ HAI CHIỀU GIỮA CÁC ROLE & MÀN HÌNH');
  console.log('========================================================================\n');

  // STEP 1: Sinh viên khai báo cần Khoa hỗ trợ + nộp chứng chỉ Ngoại ngữ
  console.log('📌 BƯỚC 1: Sinh viên 522H0045 gửi khai báo: [Cần Khoa hỗ trợ] + Ngoại ngữ [IELTS 6.5]');
  const step1 = await post('/api/internship/declare', {
    studentId: '522H0045',
    studentName: 'Nguyễn Hữu Nhân',
    companyName: '',
    internshipStatus: 'need_support',
    noCompanyOption: 'faculty',
    foreignLanguage: 'IELTS',
    foreignScore: '6.5',
    isConfirmed: true,
    isDualCourse: true,
    selectedCourses: ['KTCN', 'TSNN']
  });
  console.log('  -> Status code:', step1.status, 'Success:', step1.data.success);

  // STEP 2: Kiểm tra Quản lý Sinh viên (StudentsPage API)
  console.log('\n📌 BƯỚC 2: Kiểm tra màn hình [Quản lý sinh viên] của Giảng viên & Admin:');
  const studentsRes = await get('/api/students');
  const items = studentsRes.data?.data?.items || studentsRes.data?.items || [];
  const s45 = items.find(s => s.studentId === '522H0045');
  console.log('  -> Trạng thái sinh viên:', s45?.status);
  console.log('  -> Đơn vị tiếp nhận:', s45?.companyName);
  console.log('  -> Lựa chọn hỗ trợ (noCompanyOption):', s45?.noCompanyOption);
  console.log('  -> Chứng chỉ hiển thị (certificateDisplay):', s45?.certificateDisplay);
  console.log('  -> Môn học (courseCode):', s45?.courseCode);

  if (s45?.status === 'seeking' && s45?.companyName === 'Khoa CNTT hỗ trợ' && s45?.noCompanyOption === 'faculty' && s45?.certificateDisplay?.includes('IELTS 6.5')) {
    console.log('  ✅ [Quản lý sinh viên]: ĐỒNG BỘ 100% (Hiển thị Khoa CNTT hỗ trợ & 📜 IELTS 6.5)');
  } else {
    throw new Error('Bước 2 thất bại!');
  }

  // STEP 3: Kiểm tra Quản lý Chứng chỉ (CertificatesPage Scope All API)
  console.log('\n📌 BƯỚC 3: Kiểm tra màn hình [Quản lý chứng chỉ] của Giảng viên & Admin:');
  const certsRes = await get('/api/certificates');
  const certList = certsRes.data?.data || certsRes.data || [];
  const certItem = certList.find(c => c.studentId === '522H0045' && c.name === 'IELTS');
  console.log('  -> Chứng chỉ tìm thấy trong Quản lý chứng chỉ:', certItem ? `${certItem.name} ${certItem.score} (Trạng thái: ${certItem.status})` : 'KHÔNG TÌM THẤY');
  if (certItem && certItem.score === '6.5') {
    console.log('  ✅ [Quản lý chứng chỉ]: ĐỒNG BỘ 100% (Scope All đã cập nhật IELTS 6.5)');
  } else {
    throw new Error('Bước 3 thất bại!');
  }

  // STEP 4: Kiểm tra Tổng quan Bảng điều khiển & Thống kê Báo cáo (KPIs)
  console.log('\n📌 BƯỚC 4: Kiểm tra [Bảng điều khiển & Thống kê Báo cáo]:');
  const summaryRes = await get('/api/students/summary');
  const sum = summaryRes.data?.data || summaryRes.data;
  console.log('  -> Tổng sinh viên:', sum.totalStudents);
  console.log('  -> Cần Khoa hỗ trợ (needFacultySupport):', sum.needFacultySupport);
  console.log('  -> Sinh viên có chứng chỉ (studentsWithCert):', sum.studentsWithCert);
  if (sum.needFacultySupport >= 1 && sum.studentsWithCert >= 1) {
    console.log('  ✅ [Thống kê & Báo cáo]: ĐỒNG BỘ 100% (KPI Cần Khoa hỗ trợ & Chứng chỉ cập nhật chuẩn xác)');
  } else {
    throw new Error('Bước 4 thất bại!');
  }

  // STEP 5: Sinh viên đổi sang Đã có nơi thực tập (FPT Software)
  console.log('\n📌 BƯỚC 5: Sinh viên cập nhật khai báo: [Đã có nơi thực tập] -> FPT Software');
  const step5 = await post('/api/internship/declare', {
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
  console.log('  -> Status code:', step5.status, 'Success:', step5.data.success);

  const studentsResAfter = await get('/api/students');
  const s45After = (studentsResAfter.data?.data?.items || studentsResAfter.data?.items || []).find(s => s.studentId === '522H0045');
  console.log('  -> Trạng thái mới:', s45After?.status);
  console.log('  -> Doanh nghiệp mới:', s45After?.companyName);
  console.log('  -> Vị trí mới:', s45After?.position);
  console.log('  -> Chứng chỉ vẫn được bảo toàn:', s45After?.certificateDisplay);
  if (s45After?.status === 'has_company' && s45After?.companyName === 'FPT Software' && s45After?.certificateDisplay?.includes('IELTS')) {
    console.log('  ✅ [Chuyển trạng thái sang Có doanh nghiệp]: ĐỒNG BỘ 100% NGAY LẬP TỨC');
  } else {
    throw new Error('Bước 5 thất bại!');
  }

  // STEP 6: Sinh viên nộp trực tiếp chứng chỉ mới trên Quản lý chứng chỉ (TOEIC 750)
  console.log('\n📌 BƯỚC 6: Sinh viên nộp chứng chỉ mới trên màn hình [Quản lý chứng chỉ]: TOEIC 750');
  const certUpload = await post('/api/certificates', {
    studentId: '522H0045',
    studentName: 'Nguyễn Hữu Nhân',
    type: 'Ngoại ngữ',
    name: 'TOEIC',
    score: '750',
    maxScore: '990',
    level: 'B1',
    driveLink: 'https://drive.google.com/file/d/test_toeic_750/view',
    commitmentConfirmed: 1,
    status: 'Đã nộp'
  });
  console.log('  -> Upload cert status code:', certUpload.status);

  const studentsResFinal = await get('/api/students');
  const s45Final = (studentsResFinal.data?.data?.items || studentsResFinal.data?.items || []).find(s => s.studentId === '522H0045');
  console.log('  -> Chứng chỉ hiển thị mới nhất của SV 522H0045 trên Quản lý sinh viên:', s45Final?.certificateDisplay);
  if (s45Final?.certificateDisplay?.includes('TOEIC 750')) {
    console.log('  ✅ [Nộp chứng chỉ độc lập]: ĐỒNG BỘ NGƯỢC HAI CHIỀU VÀO DANH SÁCH SINH VIÊN 100%');
  } else {
    throw new Error('Bước 6 thất bại!');
  }

  console.log('\n========================================================================');
  console.log('🎉 TẤT CẢ 6 BƯỚC KIỂM THỬ ĐỒNG BỘ HOÀN HẢO GIỮA FRONTEND & BACKEND!');
  console.log('========================================================================\n');
}

run().catch(err => {
  console.error('\n❌ TEST THẤT BẠI:', err);
  process.exit(1);
});
