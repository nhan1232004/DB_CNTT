// ============================================================================
// INTEGRATION TEST SUITE: Kiểm thử toàn diện Backend API & Reporting Engine
// ============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppServer } from '../src/main.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const server = createAppServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 3000;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('1. Dữ liệu thực tế: Trả về đúng 91 sinh viên duy nhất, 134 lượt môn và 43 SV đi 2 môn', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/students/summary`);
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.metrics.totalStudents, 91);
    assert.equal(body.metrics.totalEnrollments, 134);
    assert.equal(body.metrics.bothCoursesCount, 43);
  });
});

test('2. Tra cứu MST & Khai báo đồng thời 2 môn (KTCN + TSNN) tại cùng 1 doanh nghiệp', async () => {
  await withServer(async (baseUrl) => {
    // Bước 1: Sinh viên nhập MST 0303882213 -> API thu thập thông tin pháp lý
    const lookupRes = await fetch(`${baseUrl}/api/internship/company-lookup/0303882213`);
    assert.equal(lookupRes.status, 200);
    const lookupBody: any = await lookupRes.json();
    assert.equal(lookupBody.success, true);
    assert.equal(lookupBody.data.taxCode, '0303882213');
    assert.ok(lookupBody.data.companyName.includes('FPT'));

    // Bước 2: Sinh viên đọc đối soát và bấm xác nhận nộp cho cả 2 môn cùng lúc
    const submitRes = await fetch(`${baseUrl}/api/internship/confirm-declaration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mssv: '519H0230', // Sinh viên đang chưa có DN
        selectedCourses: ['Kiến tập công nghiệp', 'Tập sự nghề nghiệp'],
        hasCompany: true,
        taxCode: lookupBody.data.taxCode,
        companyName: lookupBody.data.companyName,
        companyAddress: lookupBody.data.address,
        internPosition: 'Thực tập sinh Full-Stack React & Node.js',
        mentorContact: 'Anh Tuấn - Tech Lead',
        isConfirmedByStudent: true,
      }),
    });
    assert.equal(submitRes.status, 200);
    const submitBody: any = await submitRes.json();
    assert.equal(submitBody.success, true);
    assert.equal(submitBody.updatedStudent.status, 'Có doanh nghiệp');
    assert.equal(submitBody.updatedStudent.course_str, 'KTCN + TSNN');
  });
});

test('3. Chuẩn ngoại ngữ xét tốt nghiệp TDTU: Chỉ nhận danh mục chuẩn TDTU', async () => {
  await withServer(async (baseUrl) => {
    const stdRes = await fetch(`${baseUrl}/api/certificates/standards`);
    const stdBody: any = await stdRes.json();
    assert.equal(stdBody.success, true);
    assert.ok(stdBody.standards.some((s: any) => s.code === 'TOEIC'));
    assert.ok(stdBody.standards.some((s: any) => s.code === 'IELTS'));
    assert.ok(stdBody.standards.some((s: any) => s.code === 'VSTEP'));

    const submitCert = await fetch(`${baseUrl}/api/certificates/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mssv: '51900839',
        certCode: 'IELTS',
        certName: 'IELTS Academic',
        scoreOrLevel: '6.5',
        certNumber: 'IELTS-2026-9988',
        examDate: '2026-09-15',
      }),
    });
    assert.equal(submitCert.status, 200);
    const certBody: any = await submitCert.json();
    assert.equal(certBody.updatedStudent.cert, 'IELTS 6.5');
  });
});

test('4. Bảng tin 2 tầng: Thông báo Giảng viên (Tầng 1) & Duyệt JD Email Forward (Tầng 2)', async () => {
  await withServer(async (baseUrl) => {
    // Giảng viên đăng thông báo mới ở tầng trên
    const annRes = await fetch(`${baseUrl}/api/bulletin/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Lịch nộp báo cáo giữa kỳ TSNN',
        content: 'Sinh viên nộp nhật ký thực tập tuần 4 trên hệ thống.',
        category: 'Khẩn',
        isPinned: true,
      }),
    });
    assert.equal(annRes.status, 201);

    // Giảng viên forward email JD ở tầng dưới -> Duyệt 1-Click
    const fwdRes = await fetch(`${baseUrl}/api/bulletin/jd/webhook-forward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(fwdRes.status, 201);
    const fwdBody: any = await fwdRes.json();
    const pendingId = fwdBody.jd.id;
    assert.equal(fwdBody.jd.status, 'PENDING');

    const approveRes = await fetch(`${baseUrl}/api/bulletin/jd/${pendingId}/approve`, {
      method: 'PATCH',
    });
    assert.equal(approveRes.status, 200);
    const approveBody: any = await approveRes.json();
    assert.equal(approveBody.jd.status, 'APPROVED');
  });
});

test('5. Reporting Microservice: WidgetRegistry & ChartRouter hoạt động chuẩn với Schema V1/V2', async () => {
  await withServer(async (baseUrl) => {
    const wRes = await fetch(`${baseUrl}/api/dashboard/widgets`);
    const wBody: any = await wRes.json();
    assert.equal(wBody.success, true);
    assert.equal(wBody.widgets.length, 5);

    const chartRes = await fetch(`${baseUrl}/api/dashboard/charts/industry-distribution?schema=v2`);
    assert.equal(chartRes.status, 200);
    const chartBody: any = await chartRes.json();
    assert.equal(chartBody.chart.chartId, 'industry-distribution');
    assert.ok(chartBody.chart.data.labels.length >= 4);

    // Kiểm tra trang chủ GET / trả về đúng giao diện HTML
    const homeRes = await fetch(`${baseUrl}/`);
    assert.equal(homeRes.status, 200);
    const htmlText = await homeRes.text();
    assert.ok(htmlText.includes('<!DOCTYPE html>'));
  });
});

test('6. Phân loại đăng nhập Email TDTU SSO & Xác thực JWT (@tdtu.edu.vn vs @student.tdtu.edu.vn vs domain ngoài)', async () => {
  await withServer(async (baseUrl) => {
    // 1. Tài khoản Admin chính (@tdtu.edu.vn)
    const adminLogin = await fetch(`${baseUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nguyenvana@tdtu.edu.vn' }),
    });
    assert.equal(adminLogin.status, 200);
    const adminData: any = await adminLogin.json();
    assert.equal(adminData.success, true);
    assert.equal(adminData.data.user.role, 'GV');
    assert.equal(adminData.data.user.subRole, 'ADMIN');
    assert.equal(adminData.data.user.isAdmin, true);
    assert.ok(adminData.data.token.length > 20);

    // Kiểm tra /api/auth/me với Bearer token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminData.data.token}` },
    });
    assert.equal(meRes.status, 200);
    const meBody: any = await meRes.json();
    assert.equal(meBody.data.email, 'nguyenvana@tdtu.edu.vn');
    assert.equal(meBody.data.isAdmin, true);

    // 2. Tài khoản Giảng viên thường (@tdtu.edu.vn)
    const gvLogin = await fetch(`${baseUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tranvanb@tdtu.edu.vn' }),
    });
    assert.equal(gvLogin.status, 200);
    const gvData: any = await gvLogin.json();
    assert.equal(gvData.data.user.role, 'GV');
    assert.equal(gvData.data.user.subRole, 'LECTURER');
    assert.equal(gvData.data.user.isAdmin, false);

    // 3. Tài khoản Sinh viên (@student.tdtu.edu.vn)
    const svLogin = await fetch(`${baseUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '51900839@student.tdtu.edu.vn' }),
    });
    assert.equal(svLogin.status, 200);
    const svData: any = await svLogin.json();
    assert.equal(svData.data.user.role, 'SV');
    assert.equal(svData.data.user.subRole, 'STUDENT');
    assert.equal(svData.data.user.mssv, '51900839');
    assert.equal(svData.data.user.name, 'Võ Duy Trí');

    // 4. Email ngoài hệ thống TDTU (@gmail.com) -> Bị từ chối 403
    const outsiderLogin = await fetch(`${baseUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hacker@gmail.com' }),
    });
    assert.equal(outsiderLogin.status, 403);
    const outsiderData: any = await outsiderLogin.json();
    assert.equal(outsiderData.success, false);
  });
});

test('7. RBAC & Bảo mật phân quyền: Sinh viên không thể sửa hồ sơ người khác hoặc gọi API của Giảng viên/Admin', async () => {
  await withServer(async (baseUrl) => {
    const svLogin = await fetch(`${baseUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '51900839@student.tdtu.edu.vn' }),
    });
    const svToken = ((await svLogin.json()) as any).data.token;
    const svHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${svToken}`,
    };

    // SV cố tình khai báo thực tập cho MSSV của người khác (519H0290) -> 403 Forbidden
    const otherMssvRes = await fetch(`${baseUrl}/api/internship/submit-declaration`, {
      method: 'POST',
      headers: svHeaders,
      body: JSON.stringify({
        mssv: '519H0290',
        courses: ['Tập sự nghề nghiệp'],
        hasCompany: false,
        supportOption: 'self',
      }),
    });
    assert.equal(otherMssvRes.status, 403);

    // SV cố tình nộp chứng chỉ ngoại ngữ cho MSSV khác -> 403 Forbidden
    const otherCertRes = await fetch(`${baseUrl}/api/certificates/submit`, {
      method: 'POST',
      headers: svHeaders,
      body: JSON.stringify({
        mssv: '519H0290',
        certType: 'IELTS',
        score: '7.0',
      }),
    });
    assert.equal(otherCertRes.status, 403);

    // SV cố tình đăng thông báo Giảng viên -> 403 Forbidden
    const postAnnRes = await fetch(`${baseUrl}/api/bulletin/announcements`, {
      method: 'POST',
      headers: svHeaders,
      body: JSON.stringify({
        title: 'Thông báo giả mạo',
        content: 'Nội dung',
        category: 'Khẩn',
      }),
    });
    assert.equal(postAnnRes.status, 403);

    // SV cố tình can thiệp trạng thái sinh viên -> 403 Forbidden
    const patchStatusRes = await fetch(`${baseUrl}/api/students/51900839/status`, {
      method: 'PATCH',
      headers: svHeaders,
      body: JSON.stringify({ status: 'Có doanh nghiệp' }),
    });
    assert.equal(patchStatusRes.status, 403);

    // SV cố tình cấp quyền Admin -> 403 Forbidden
    const grantRes = await fetch(`${baseUrl}/api/auth/admin/grant`, {
      method: 'POST',
      headers: svHeaders,
      body: JSON.stringify({ targetEmail: 'tranvanb@tdtu.edu.vn', isAdmin: true }),
    });
    assert.equal(grantRes.status, 403);
  });
});

test('8. Quản lý phân quyền Admin: Admin cấp quyền / thu hồi / chuyển nhượng Admin cho Giảng viên @tdtu.edu.vn khác', async () => {
  await withServer(async (baseUrl) => {
    // Đăng nhập Admin chính (nguyenvana@tdtu.edu.vn)
    const adminRes = await fetch(`${baseUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nguyenvana@tdtu.edu.vn' }),
    });
    const adminToken = ((await adminRes.json()) as any).data.token;

    // Đăng nhập Giảng viên thường (tranvanb@tdtu.edu.vn)
    const gvRes = await fetch(`${baseUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tranvanb@tdtu.edu.vn' }),
    });
    const gvToken = ((await gvRes.json()) as any).data.token;

    // Giảng viên thường chưa có quyền Admin không thể tự cấp quyền Admin -> 403
    const unauthorizedGrant = await fetch(`${baseUrl}/api/auth/admin/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gvToken}` },
      body: JSON.stringify({ targetEmail: 'lethic@tdtu.edu.vn', isAdmin: true }),
    });
    assert.equal(unauthorizedGrant.status, 403);

    // Admin không thể cấp quyền Admin cho email sinh viên (@student.tdtu.edu.vn) -> 400
    const invalidGrant = await fetch(`${baseUrl}/api/auth/admin/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ targetEmail: '51900839@student.tdtu.edu.vn', isAdmin: true }),
    });
    assert.equal(invalidGrant.status, 400);

    // Admin cấp quyền Admin cho tranvanb@tdtu.edu.vn -> 200
    const validGrant = await fetch(`${baseUrl}/api/auth/admin/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ targetEmail: 'tranvanb@tdtu.edu.vn', isAdmin: true }),
    });
    assert.equal(validGrant.status, 200);
    const grantBody: any = await validGrant.json();
    assert.equal(grantBody.data.isAdmin, true);
    assert.equal(grantBody.data.grantedBy, 'nguyenvana@tdtu.edu.vn');

    // Chuyển nhượng quyền Admin chính từ nguyenvana@tdtu.edu.vn sang lethic@tdtu.edu.vn
    const transferRes = await fetch(`${baseUrl}/api/auth/admin/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ targetEmail: 'lethic@tdtu.edu.vn' }),
    });
    assert.equal(transferRes.status, 200);
    const transferBody: any = await transferRes.json();
    assert.equal(transferBody.data.from.isAdmin, false);
    assert.equal(transferBody.data.to.isAdmin, true);
  });
});

test('9. Real Inbound Email Forward Parser & Sinh viên ứng tuyển JD thực tập', async () => {
  await withServer(async (baseUrl) => {
    const rawEmailBody = `---------- Forwarded message ---------
From: Nab Innovation Centre Vietnam <talent@nab.com.vn>
Subject: Fwd: [NAB Vietnam] Tuyển dụng Cloud & DevOps Engineer Intern 2026
To: nguyenvana@tdtu.edu.vn

Kính gửi Quý Thầy Cô Khoa CNTT - ĐH Tôn Đức Thắng,
Công ty: NAB Innovation Centre Vietnam
Mã số thuế: 0315678901
Vị trí: Cloud & DevOps Engineer Intern (AWS / Kubernetes)
Số lượng: 12 chỉ tiêu
Trợ cấp: 9.500.000đ/tháng
Kỹ năng: AWS, Docker, Kubernetes, TypeScript, Linux
Địa chỉ: E.Town Central, 11 Đoàn Văn Bơ, Quận 4, TP.HCM
Hạn nộp: 18/12/2026`;

    // Bước 1: Xem trước kết quả bóc tách Email
    const previewRes = await fetch(`${baseUrl}/api/bulletin/jd/parse-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'talent@nab.com.vn',
        subject: 'Fwd: [NAB Vietnam] Tuyển dụng Cloud & DevOps Engineer Intern 2026',
        rawBody: rawEmailBody,
      }),
    });
    assert.equal(previewRes.status, 200);
    const previewBody: any = await previewRes.json();
    assert.equal(previewBody.data.mst, '0315678901');
    assert.equal(previewBody.data.companyName, 'NAB Innovation Centre Vietnam');
    assert.ok(previewBody.data.roleTitle.includes('Cloud & DevOps Engineer Intern'));
    assert.equal(previewBody.data.quota, 12);
    assert.equal(previewBody.data.stipend, '9.500.000đ/tháng');
    assert.equal(previewBody.data.deadline, '18/12/2026');
    assert.ok(previewBody.data.skills.includes('AWS'));
    assert.ok(previewBody.data.skills.includes('Docker'));

    // Bước 2: Đẩy Email vào Webhook Forward -> Tạo JD trạng thái PENDING
    const fwdRes = await fetch(`${baseUrl}/api/bulletin/jd/webhook-forward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'talent@nab.com.vn',
        subject: 'Fwd: [NAB Vietnam] Tuyển dụng Cloud & DevOps Engineer Intern 2026',
        rawBody: rawEmailBody,
      }),
    });
    assert.equal(fwdRes.status, 201);
    const fwdBody: any = await fwdRes.json();
    const jdId = fwdBody.jd.id;
    assert.equal(fwdBody.jd.companyName, 'NAB Innovation Centre Vietnam');
    assert.equal(fwdBody.jd.status, 'PENDING');

    // Bước 3: Giảng viên duyệt 1-Click -> APPROVED
    const approveRes = await fetch(`${baseUrl}/api/bulletin/jd/${jdId}/approve`, { method: 'POST' });
    assert.equal(approveRes.status, 200);

    // Bước 4: Sinh viên 519H0290 (đang Cần Khoa hỗ trợ) ứng tuyển vào JD vừa duyệt
    const applyRes = await fetch(`${baseUrl}/api/bulletin/jd/${jdId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mssv: '519H0290',
        note: 'Em xin ứng tuyển vị trí Cloud & DevOps Intern',
      }),
    });
    assert.equal(applyRes.status, 201);
    const applyBody: any = await applyRes.json();
    assert.equal(applyBody.data.mssv, '519H0290');
    assert.equal(applyBody.data.companyName, 'NAB Innovation Centre Vietnam');

    // Trạng thái sinh viên 519H0290 tự động chuyển sang "Đang chờ PV/KQPV"
    const stRes = await fetch(`${baseUrl}/api/students/519H0290`);
    const stBody: any = await stRes.json();
    assert.equal(stBody.data.status, 'Đang chờ PV/KQPV');
  });
});

test('10. Lưu trữ bền vững SQLite (Persistent Database) qua các lần khởi động lại Server', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');

  const tmpDbPath = path.join(os.tmpdir(), `test_db_cntt_${Date.now()}.sqlite`);

  try {
    // Lần chạy Server 1: Tạo dữ liệu mới (Import thêm 1 SV + Can thiệp trạng thái + Đăng thông báo)
    const server1 = createAppServer({ dbPath: tmpDbPath });
    await new Promise<void>((r) => server1.listen(0, '127.0.0.1', r));
    const port1 = (server1.address() as any).port;
    const url1 = `http://127.0.0.1:${port1}`;

    const importRes = await fetch(`${url1}/api/students/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        students: [
          {
            mssv: '524H9999',
            name: 'Lê Hoàng Bảo Trâm',
            class: '24H50201',
            major: 'Kỹ thuật phần mềm',
            courses: ['Tập sự nghề nghiệp', 'Kiến tập công nghiệp'],
          },
        ],
      }),
    });
    assert.equal(importRes.status, 200);

    const patchRes = await fetch(`${url1}/api/students/524H9999/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Có doanh nghiệp', company: 'ZaloPay' }),
    });
    assert.equal(patchRes.status, 200);

    await new Promise<void>((r) => server1.close(() => r()));

    // Lần chạy Server 2: Mở lại đúng file SQLite trên ổ cứng và kiểm tra dữ liệu vẫn còn nguyên
    const server2 = createAppServer({ dbPath: tmpDbPath });
    await new Promise<void>((r) => server2.listen(0, '127.0.0.1', r));
    const port2 = (server2.address() as any).port;
    const url2 = `http://127.0.0.1:${port2}`;

    const checkRes = await fetch(`${url2}/api/students/524H9999`);
    assert.equal(checkRes.status, 200);
    const checkBody: any = await checkRes.json();
    assert.equal(checkBody.data.name, 'Lê Hoàng Bảo Trâm');
    assert.equal(checkBody.data.status, 'Có doanh nghiệp');
    assert.equal(checkBody.data.company, 'ZaloPay');
    assert.equal(checkBody.data.courses.length, 2);

    const summaryRes = await fetch(`${url2}/api/students/summary`);
    const summaryBody: any = await summaryRes.json();
    assert.equal(summaryBody.metrics.totalStudents, 92);
    assert.equal(summaryBody.metrics.totalEnrollments, 136);

    await new Promise<void>((r) => server2.close(() => r()));
  } finally {
    try {
      if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
      if (fs.existsSync(`${tmpDbPath}-wal`)) fs.unlinkSync(`${tmpDbPath}-wal`);
      if (fs.existsSync(`${tmpDbPath}-shm`)) fs.unlinkSync(`${tmpDbPath}-shm`);
    } catch {}
  }
});

test('11. Kiểm thử biên & đường dẫn lỗi (Edge Cases): Từ chối khai báo chưa tích chọn xác nhận, từ chối chứng chỉ ngoài danh mục TDTU, chặn tự gỡ Admin cuối cùng', async () => {
  await withServer(async (baseUrl) => {
    // 1. Khai báo có doanh nghiệp nhưng isConfirmedByStudent = false -> 400
    const unconfirmedRes = await fetch(`${baseUrl}/api/internship/confirm-declaration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mssv: '51900839',
        selectedCourses: ['Tập sự nghề nghiệp'],
        hasCompany: true,
        taxCode: '0303882213',
        companyName: 'FPT Software',
        isConfirmedByStudent: false,
      }),
    });
    assert.equal(unconfirmedRes.status, 400);

    // 2. Nộp chứng chỉ ngoại ngữ không nằm trong chuẩn TDTU (VD: DUOLINGO) -> 400
    const badCertRes = await fetch(`${baseUrl}/api/certificates/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mssv: '51900839',
        certCode: 'DUOLINGO_TEST',
        scoreOrLevel: '120',
      }),
    });
    assert.equal(badCertRes.status, 400);

    // 3. Chặn thu hồi quyền của Admin duy nhất còn lại trong hệ thống -> 400
    const adminLogin = await fetch(`${baseUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nguyenvana@tdtu.edu.vn' }),
    });
    const adminToken = ((await adminLogin.json()) as any).data.token;

    const selfRevokeRes = await fetch(`${baseUrl}/api/auth/admin/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ targetEmail: 'nguyenvana@tdtu.edu.vn', isAdmin: false }),
    });
    assert.equal(selfRevokeRes.status, 400);

    // 4. Import danh sách sinh viên rỗng -> 400
    const emptyImportRes = await fetch(`${baseUrl}/api/students/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ students: [] }),
    });
    assert.equal(emptyImportRes.status, 400);

    // 5. Truy vấn biểu đồ không tồn tại -> 404
    const missingChartRes = await fetch(`${baseUrl}/api/dashboard/charts/non-existent-chart`);
    assert.equal(missingChartRes.status, 404);
  });
});

test('12. Kiểm thử hồi quy (Regression): GET /api/students trả về data.items chuẩn & Khai báo chưa có DN (noCompanyOption=faculty / self) + data.declaration + data.record', async () => {
  await withServer(async (baseUrl) => {
    // 1. GET /api/students phải trả về cả body.items và body.data.items (91 sinh viên)
    const listRes = await fetch(`${baseUrl}/api/students`);
    assert.equal(listRes.status, 200);
    const listBody: any = await listRes.json();
    assert.equal(listBody.success, true);
    assert.ok(Array.isArray(listBody.items));
    assert.ok(Array.isArray(listBody.data.items));
    assert.equal(listBody.data.items.length, 91);
    assert.equal(listBody.data.total, 91);

    // 2. Sinh viên gửi noCompanyOption: 'faculty' và desiredField -> trạng thái phải là 'Cần Khoa hỗ trợ'
    const facRes = await fetch(`${baseUrl}/api/internship/confirm-declaration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mssv: '51900839',
        selectedCourses: ['Tập sự nghề nghiệp'],
        hasCompany: false,
        noCompanyOption: 'faculty',
        desiredField: 'Backend Node.js & DevSecOps',
      }),
    });
    assert.equal(facRes.status, 200);
    const facBody: any = await facRes.json();
    assert.equal(facBody.success, true);
    assert.equal(facBody.updatedStudent.status, 'Cần Khoa hỗ trợ');
    assert.equal(facBody.data.updatedStudent.status, 'Cần Khoa hỗ trợ');
    assert.ok(facBody.data.declaration);
    assert.equal(facBody.data.declaration.supportOption, 'faculty');
    assert.equal(facBody.data.declaration.preferredField, 'Backend Node.js & DevSecOps');

    // 3. Sinh viên gửi noCompanyOption: 'self' -> trạng thái phải là 'Chưa có doanh nghiệp'
    const selfRes = await fetch(`${baseUrl}/api/internship/confirm-declaration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mssv: '51900839',
        selectedCourses: ['Tập sự nghề nghiệp'],
        hasCompany: false,
        noCompanyOption: 'self',
      }),
    });
    assert.equal(selfRes.status, 200);
    const selfBody: any = await selfRes.json();
    assert.equal(selfBody.updatedStudent.status, 'Chưa có doanh nghiệp');
    assert.equal(selfBody.data.declaration.supportOption, 'self');

    // 4. POST /api/certificates/submit với certNo và data.record đầy đủ
    const certRes = await fetch(`${baseUrl}/api/certificates/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mssv: '51900839',
        certType: 'TOEIC',
        score: '750',
        certNo: 'TOEIC-2026-777',
        examDate: '2026-10-01',
      }),
    });
    assert.equal(certRes.status, 200);
    const certBody: any = await certRes.json();
    assert.equal(certBody.success, true);
    assert.ok(certBody.data.record);
    assert.equal(certBody.data.record.certNumber, 'TOEIC-2026-777');
    assert.equal(certBody.data.updatedStudent.cert, 'TOEIC 750');
  });
});

test('13. Kiểm thử hồi quy MST Chi nhánh (10+3 số), từ chối MST toàn dấu gạch ngang & Bóc tách Email nhiều tầng From:', async () => {
  await withServer(async (baseUrl) => {
    // 1. MST chi nhánh 0303882213-001 phải nhận diện đúng FPT Software
    const branchRes = await fetch(`${baseUrl}/api/internship/company-lookup/0303882213-001`);
    assert.equal(branchRes.status, 200);
    const branchBody: any = await branchRes.json();
    assert.equal(branchBody.success, true);
    assert.equal(branchBody.data.taxCode, '0303882213-001');
    assert.ok(branchBody.data.companyName.includes('FPT'));

    // 2. MST toàn dấu gạch ngang "--------" hoặc sai định dạng -> 400 Bad Request
    const badTaxRes = await fetch(`${baseUrl}/api/internship/company-lookup/--------`);
    assert.equal(badTaxRes.status, 400);
    const badSuffixRes = await fetch(`${baseUrl}/api/internship/company-lookup/0303882213-12`);
    assert.equal(badSuffixRes.status, 400);

    // 3. Email Forward có cả From ngoài của Giảng viên (@tdtu.edu.vn) và From gốc của Doanh nghiệp
    const multiHeaderEmail = `From: TS. Trần Văn B <tranvanb@tdtu.edu.vn>
Date: Mon, 20 Oct 2026 09:00:00 +0700
Subject: Fwd: [NAB Vietnam] Tuyển dụng Intern
To: db_cntt@tdtu.edu.vn

---------- Forwarded message ---------
From: HR NAB Vietnam <talent@nab.com.vn>
Subject: [NAB Vietnam] Tuyển dụng Intern
To: tranvanb@tdtu.edu.vn

Công ty: NAB Innovation Centre Vietnam
Mã số thuế: 0315678901
Vị trí: Backend Engineer Intern
Số lượng: 8 chỉ tiêu`;

    const parseRes = await fetch(`${baseUrl}/api/bulletin/jd/parse-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawBody: multiHeaderEmail }),
    });
    assert.equal(parseRes.status, 200);
    const parseBody: any = await parseRes.json();
    assert.equal(parseBody.data.contactEmail, 'talent@nab.com.vn');
    assert.equal(parseBody.data.forwardedBy, 'tranvanb@tdtu.edu.vn');
    assert.equal(parseBody.data.companyName, 'NAB Innovation Centre Vietnam');
    assert.equal(parseBody.data.roleTitle, 'Backend Engineer Intern');
  });
});

test('14. Kiểm thử bảo mật JWT bị giả mạo chữ ký & Đồng bộ DOM/Selector trong index.html', async () => {
  await withServer(async (baseUrl) => {
    // 1. Token bị sửa đổi chữ ký -> 401 Unauthorized
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im5ndXllbnZhbmFAdGR0dS5lZHUudm4iLCJyb2xlIjoiR1YiLCJpc0FkbWluIjp0cnVlfQ.invalidsignature123';
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    assert.equal(meRes.status, 401);

    const grantRes = await fetch(`${baseUrl}/api/auth/admin/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fakeToken}` },
      body: JSON.stringify({ targetEmail: 'tranvanb@tdtu.edu.vn', isAdmin: true }),
    });
    assert.equal(grantRes.status, 401);

    // 2. Kiểm tra index.html phục vụ từ GET / không còn lỗi lệch ID/Function
    const htmlRes = await fetch(`${baseUrl}/`);
    assert.equal(htmlRes.status, 200);
    const html = await htmlRes.text();
    assert.ok(html.includes('function toggleLoginModal('));
    assert.ok(html.includes('function toggleImportStudentsModal('));
    assert.ok(html.includes("getElementById('btn-manage-admin')"));
    assert.ok(!html.includes("getElementById('btn-admin-manage')"));
    assert.ok(!html.includes("getElementById('input-cert-type')"));
    assert.ok(!html.includes("getElementById('chk-confirm-company-legal')"));
    assert.ok(!html.includes('name="no-company-opt"'));
    // Kiểm tra hoàn toàn không có "xin giấy giới thiệu thực tập" hay "Cẩm nang TSNN"
    assert.ok(!html.toLowerCase().includes('xin giấy giới thiệu'));
    assert.ok(!html.toLowerCase().includes('cẩm nang tsnn'));

    // 3. Kiểm tra tự động toàn bộ getElementById(...) và onclick="..." trong index.html đều tồn tại
    const idsInDom = new Set([...html.matchAll(/id=["']([^"']+)["']/g)].map((m) => m[1]));
    const queriedIds = [...new Set([...html.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]))];
    const missingIds = queriedIds.filter((id) => !idsInDom.has(id));
    assert.deepEqual(missingIds, [], `Phát hiện ID được gọi trong JS nhưng thiếu trong DOM: ${missingIds.join(', ')}`);

    const onclickFns = [...new Set([...html.matchAll(/onclick=["']([a-zA-Z0-9_]+)\(/g)].map((m) => m[1]))];
    const definedFns = new Set([...html.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)].map((m) => m[1]));
    const missingFns = onclickFns.filter((fn) => !definedFns.has(fn) && !['alert', 'confirm', 'window'].includes(fn));
    assert.deepEqual(missingFns, [], `Phát hiện hàm onclick chưa được định nghĩa: ${missingFns.join(', ')}`);
  });
});

test('15. Đăng nhập Gmail TDTU qua Firebase Authentication (Email, Firebase UID, ID Token & Kiểm tra cổng GV/SV)', async () => {
  await withServer(async (baseUrl) => {
    // 1. Kiểm tra cấu hình Firebase Auth
    const cfgRes = await fetch(`${baseUrl}/api/auth/firebase/config`);
    assert.equal(cfgRes.status, 200);
    const cfgBody: any = await cfgRes.json();
    assert.equal(cfgBody.success, true);
    assert.equal(cfgBody.data.providerId, 'google.com');
    assert.deepEqual(cfgBody.data.allowedDomains, ['tdtu.edu.vn', 'student.tdtu.edu.vn']);

    // 2. Đăng nhập Giảng viên bằng POST /api/auth/firebase với firebaseUid tùy chỉnh
    const gvLoginRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nguyenvana@tdtu.edu.vn',
        displayName: 'TS. Nguyễn Văn A',
        firebaseUid: 'fb_custom_gv_001',
        expectedRole: 'GV',
      }),
    });
    assert.equal(gvLoginRes.status, 200);
    const gvLoginBody: any = await gvLoginRes.json();
    assert.equal(gvLoginBody.success, true);
    assert.equal(gvLoginBody.data.user.role, 'GV');
    assert.equal(gvLoginBody.data.user.isAdmin, true);
    assert.equal(gvLoginBody.data.user.firebaseUid, 'fb_custom_gv_001');
    assert.equal(gvLoginBody.data.user.authProvider, 'google.com');
    assert.equal(gvLoginBody.data.user.isActive, true);
    assert.ok(gvLoginBody.data.user.loginCount >= 1);
    assert.ok(gvLoginBody.data.firebaseIdToken);

    // 3. Đăng nhập lại bằng chính Firebase ID Token vừa cấp (không cần truyền email)
    const tokenLoginRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: gvLoginBody.data.firebaseIdToken,
        expectedRole: 'GV',
      }),
    });
    assert.equal(tokenLoginRes.status, 200);
    const tokenLoginBody: any = await tokenLoginRes.json();
    assert.equal(tokenLoginBody.data.user.email, 'nguyenvana@tdtu.edu.vn');
    assert.ok(tokenLoginBody.data.user.loginCount >= 2);

    // 4. Đăng nhập Sinh viên bằng Gmail @student.tdtu.edu.vn -> ánh xạ MSSV 51900839 (Võ Duy Trí)
    const svLoginRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '51900839@student.tdtu.edu.vn',
        expectedRole: 'SV',
      }),
    });
    assert.equal(svLoginRes.status, 200);
    const svLoginBody: any = await svLoginRes.json();
    assert.equal(svLoginBody.data.user.role, 'SV');
    assert.equal(svLoginBody.data.user.studentId, '51900839');
    assert.equal(svLoginBody.data.user.fullName, 'Võ Duy Trí');
    assert.ok(svLoginBody.data.user.firebaseUid.includes('51900839'));

    // 5. Sai cổng đăng nhập: dùng email SV ở cổng GV -> 403
    const wrongPortalRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '51900839@student.tdtu.edu.vn',
        expectedRole: 'GV',
      }),
    });
    assert.equal(wrongPortalRes.status, 403);

    // 6. Email ngoài tên miền TDTU (@gmail.com) -> 403
    const externalEmailRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'personal.account@gmail.com',
      }),
    });
    assert.equal(externalEmailRes.status, 403);

    // 7. Giả mạo email không khớp với Firebase ID Token (SV gửi idToken của SV nhưng kèm email Admin) -> 403
    const spoofRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nguyenvana@tdtu.edu.vn',
        idToken: svLoginBody.data.firebaseIdToken,
      }),
    });
    assert.equal(spoofRes.status, 403);

    // 8. Payload kiểu dữ liệu phi chuỗi (number/object) không gây crash TypeError -> 403
    const malformedRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 123456,
        firebaseUid: 9999,
      }),
    });
    assert.equal(malformedRes.status, 403);
  });
});

test('16. Quản lý tài khoản Firebase (Danh sách 95 tài khoản, Khởi tạo/Đồng bộ mới, Khóa/Mở khóa & Giao diện Trang Đăng Nhập)', async () => {
  await withServer(async (baseUrl) => {
    // 1. Đăng nhập Admin để lấy token
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nguyenvana@tdtu.edu.vn' }),
    });
    const adminLoginBody: any = await adminLoginRes.json();
    const adminToken = adminLoginBody.data.token;

    // 2. Lấy danh sách toàn bộ tài khoản Firebase (4 GV + 91 SV = 95 tài khoản)
    const usersRes = await fetch(`${baseUrl}/api/auth/firebase/users`);
    assert.equal(usersRes.status, 200);
    const usersBody: any = await usersRes.json();
    assert.equal(usersBody.success, true);
    assert.equal(usersBody.data.summary.totalUsers, 95);
    assert.equal(usersBody.data.summary.totalLecturers, 4);
    assert.equal(usersBody.data.summary.totalStudents, 91);
    assert.equal(usersBody.data.summary.lockedUsers, 0);

    // 3. Khởi tạo/đồng bộ tài khoản Giảng viên mới qua POST /api/auth/firebase/users
    const createRes = await fetch(`${baseUrl}/api/auth/firebase/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: 'hoangvane@tdtu.edu.vn',
        fullName: 'TS. Hoàng Văn E',
        isAdmin: false,
      }),
    });
    assert.equal(createRes.status, 200);
    const createBody: any = await createRes.json();
    assert.equal(createBody.success, true);
    assert.equal(createBody.data.user.email, 'hoangvane@tdtu.edu.vn');
    assert.equal(createBody.data.user.role, 'GV');
    assert.equal(createBody.data.summary.totalUsers, 96);

    // 4. Đăng nhập trước cho SV 519h0290 để lấy JWT token trước khi bị khóa
    const svBeforeLockRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '519h0290@student.tdtu.edu.vn' }),
    });
    const svBeforeLockBody: any = await svBeforeLockRes.json();
    const svToken = svBeforeLockBody.data.token;

    // 5. Admin khóa tài khoản SV 519h0290@student.tdtu.edu.vn
    const lockRes = await fetch(`${baseUrl}/api/auth/firebase/users/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetEmail: '519h0290@student.tdtu.edu.vn',
        isActive: false,
      }),
    });
    assert.equal(lockRes.status, 200);
    const lockBody: any = await lockRes.json();
    assert.equal(lockBody.success, true);
    assert.equal(lockBody.data.summary.lockedUsers, 1);

    // 6. Tài khoản bị khóa không thể đăng nhập (403) và JWT cũ cũng bị vô hiệu hóa (403)
    const lockedLoginRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '519h0290@student.tdtu.edu.vn' }),
    });
    assert.equal(lockedLoginRes.status, 403);

    const lockedMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${svToken}` },
    });
    assert.equal(lockedMeRes.status, 403);

    // 7. Admin không được phép tự khóa chính mình -> 400
    const selfLockRes = await fetch(`${baseUrl}/api/auth/firebase/users/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetEmail: 'nguyenvana@tdtu.edu.vn',
        isActive: false,
      }),
    });
    assert.equal(selfLockRes.status, 400);

    // 8. Mở khóa lại cho SV 519h0290@student.tdtu.edu.vn -> đăng nhập thành công
    const unlockRes = await fetch(`${baseUrl}/api/auth/firebase/users/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetEmail: '519h0290@student.tdtu.edu.vn',
        isActive: true,
      }),
    });
    assert.equal(unlockRes.status, 200);

    const reloginRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '519h0290@student.tdtu.edu.vn' }),
    });
    assert.equal(reloginRes.status, 200);

    // 9. Import sinh viên mới tự động khởi tạo tài khoản Firebase (@student.tdtu.edu.vn)
    const importRes = await fetch(`${baseUrl}/api/students/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        students: [
          {
            mssv: '52300999',
            name: 'Phạm Gia Bảo',
            class: '23050101',
            major: 'Khoa học máy tính',
            courses: ['Tập sự nghề nghiệp'],
          },
        ],
      }),
    });
    assert.equal(importRes.status, 200);

    const newSvLoginRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '52300999@student.tdtu.edu.vn',
        expectedRole: 'SV',
      }),
    });
    assert.equal(newSvLoginRes.status, 200);
    const newSvLoginBody: any = await newSvLoginRes.json();
    assert.equal(newSvLoginBody.data.user.fullName, 'Phạm Gia Bảo');
    assert.equal(newSvLoginBody.data.user.studentId, '52300999');

    // 10. Kiểm tra giao diện Trang Đăng Nhập & Quản lý Firebase trong index.html
    const htmlRes = await fetch(`${baseUrl}/`);
    const html = await htmlRes.text();
    assert.ok(html.includes('id="login-page-screen"'));
    assert.ok(html.includes('id="modal-firebase-users"'));
    assert.ok(html.includes('submitLoginPageForm('));
    assert.ok(html.includes('openFirebaseUsersModal('));
    assert.ok(html.includes('toggleFirebaseAccountLock('));
    assert.ok(html.includes('submitCreateFirebaseUser('));
  });
});

test('17. Bảo vệ Admin hoạt động cuối cùng trong upsertFirebaseUser/grantOrRevokeAdmin & Đồng bộ demo_dashboard/index.html + App.tsx', async () => {
  await withServer(async (baseUrl) => {
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nguyenvana@tdtu.edu.vn' }),
    });
    const adminToken = ((await adminLoginRes.json()) as any).data.token;

    // 1. Chặn tự gỡ quyền của Admin duy nhất thông qua POST /api/auth/firebase/users -> 400
    const demoteLastAdminRes = await fetch(`${baseUrl}/api/auth/firebase/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: 'nguyenvana@tdtu.edu.vn',
        isAdmin: false,
      }),
    });
    assert.equal(demoteLastAdminRes.status, 400);

    // 2. Cấp Admin cho tranvanb@tdtu.edu.vn, sau đó khóa tranvanb@tdtu.edu.vn -> nguyenvana vẫn là Admin đang hoạt động duy nhất
    const grantBRes = await fetch(`${baseUrl}/api/auth/admin/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetEmail: 'tranvanb@tdtu.edu.vn',
        isAdmin: true,
      }),
    });
    assert.equal(grantBRes.status, 200);

    const lockBRes = await fetch(`${baseUrl}/api/auth/firebase/users/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetEmail: 'tranvanb@tdtu.edu.vn',
        isActive: false,
      }),
    });
    assert.equal(lockBRes.status, 200);

    // Vì tranvanb đang bị khóa (isActive=false), nguyenvana không được phép tự gỡ quyền Admin của mình -> 400
    const revokeOnlyActiveAdminRes = await fetch(`${baseUrl}/api/auth/admin/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetEmail: 'nguyenvana@tdtu.edu.vn',
        isAdmin: false,
      }),
    });
    assert.equal(revokeOnlyActiveAdminRes.status, 400);

    // 3. Từ chối email rỗng phần tên người dùng "@tdtu.edu.vn" khi cấp hoặc chuyển quyền Admin -> 400
    const badEmailGrantRes = await fetch(`${baseUrl}/api/auth/admin/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetEmail: '@tdtu.edu.vn',
        isAdmin: true,
      }),
    });
    assert.equal(badEmailGrantRes.status, 400);

    // 4. Kiểm tra đồng bộ demo_dashboard/index.html và apps/web/src/App.tsx
    const demoHtml = fs.readFileSync(path.resolve(__dirname, '../../../demo_dashboard/index.html'), 'utf-8');
    assert.ok(demoHtml.includes('id="login-page-screen"'));
    assert.ok(demoHtml.includes('id="modal-firebase-users"'));
    assert.ok(!demoHtml.includes('users.slice(0, 60)'));

    const appTsx = fs.readFileSync(path.resolve(__dirname, '../../web/src/App.tsx'), 'utf-8');
    assert.ok(appTsx.includes('getFirebaseUsers'));
    assert.ok(appTsx.includes('upsertFirebaseUser'));
    assert.ok(appTsx.includes('setFirebaseAccountStatus'));
  });
});

test('18. INT-02, INT-03 & DATA-02: Quy trình Giấy giới thiệu thực tập (Nộp đơn, Khoa duyệt, In PDF) & Biểu mẫu quy định TDTU', async () => {
  await withServer(async (baseUrl) => {
    // 1. Sinh viên đăng nhập
    const svLogin = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '51900839@student.tdtu.edu.vn' }),
    });
    assert.equal(svLogin.status, 200);
    const svToken = ((await svLogin.json()) as any).data.token;

    // 2. Giảng viên / Admin đăng nhập
    const gvLogin = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nguyenvana@tdtu.edu.vn' }),
    });
    assert.equal(gvLogin.status, 200);
    const gvToken = ((await gvLogin.json()) as any).data.token;

    // 3. Sinh viên nộp yêu cầu cấp Giấy giới thiệu (GGT)
    const reqLetterRes = await fetch(`${baseUrl}/api/internship/letters/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${svToken}`,
      },
      body: JSON.stringify({
        mssv: '51900839',
        recipientCompany: 'CÔNG TY TNHH KMS TECHNOLOGY VIỆT NAM',
        recipientRepresentative: 'Nguyễn Hoàng Minh - Trưởng phòng Tuyển dụng',
        recipientAddress: 'Tòa nhà Flemington, 182 Lê Đại Hành, Quận 11, TP. HCM',
        positionApplied: 'Thực tập sinh Phát triển phần mềm (Fullstack Intern)',
        courses: ['Tập sự nghề nghiệp'],
      }),
    });
    assert.equal(reqLetterRes.status, 201);
    const letterBody: any = await reqLetterRes.json();
    assert.ok(letterBody.success);
    assert.ok(letterBody.letter.id);
    assert.ok(letterBody.letter.letterNo.includes('GGT-'));
    assert.equal(letterBody.letter.studentId, '51900839');
    assert.equal(letterBody.letter.studentName, 'Võ Duy Trí');
    assert.equal(letterBody.letter.status, 'CHO_DUYET');
    assert.equal(letterBody.letter.recipientCompany, 'CÔNG TY TNHH KMS TECHNOLOGY VIỆT NAM');

    const letterId = letterBody.letter.id;

    // 4. Lấy danh sách Giấy giới thiệu theo sinh viên
    const listRes = await fetch(`${baseUrl}/api/internship/letters?studentId=51900839`, {
      headers: { Authorization: `Bearer ${svToken}` },
    });
    assert.equal(listRes.status, 200);
    const listBody: any = await listRes.json();
    assert.ok(listBody.letters.length >= 1);
    assert.equal(listBody.letters[0].id, letterId);

    // 5. Thử in khi CHƯA duyệt -> HTML có thông báo "Đang chờ Khoa CNTT ký duyệt"
    const printPendingRes = await fetch(`${baseUrl}/api/internship/letters/${letterId}/print`);
    assert.equal(printPendingRes.status, 200);
    const printPendingHtml = await printPendingRes.text();
    assert.ok(printPendingHtml.includes('TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG'));
    assert.ok(printPendingHtml.includes('GIẤY GIỚI THIỆU'));
    assert.ok(printPendingHtml.includes('Võ Duy Trí'));
    assert.ok(printPendingHtml.includes('Đang chờ Khoa CNTT ký duyệt'));

    // 6. Giảng viên phê duyệt Giấy giới thiệu
    const approveRes = await fetch(`${baseUrl}/api/internship/letters/${letterId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gvToken}`,
      },
      body: JSON.stringify({ approverName: 'TS. Đặng Ngọc Hoàng Thành' }),
    });
    assert.equal(approveRes.status, 200);
    const approveBody: any = await approveRes.json();
    assert.equal(approveBody.letter.status, 'DA_DUYET');
    assert.equal(approveBody.letter.approvedBy, 'TS. Đặng Ngọc Hoàng Thành');

    // 7. In sau khi ĐÃ duyệt -> HTML có dấu xác nhận điện tử hợp lệ
    const printApprovedRes = await fetch(`${baseUrl}/api/internship/letters/${letterId}/print`);
    assert.equal(printApprovedRes.status, 200);
    const printApprovedHtml = await printApprovedRes.text();
    assert.ok(printApprovedHtml.includes('Xác nhận điện tử hợp lệ'));
    assert.ok(printApprovedHtml.includes('TS. Đặng Ngọc Hoàng Thành'));

    // 8. DATA-02: Lấy danh mục Biểu mẫu & Quy định thực tập
    const docRes = await fetch(`${baseUrl}/api/documents`);
    assert.equal(docRes.status, 200);
    const docBody: any = await docRes.json();
    assert.ok(docBody.documents.length >= 4);
    const codes = docBody.documents.map((d: any) => d.code);
    assert.ok(codes.includes('BM-01'));
    assert.ok(codes.includes('BM-02'));
    assert.ok(codes.includes('BM-03'));
    assert.ok(codes.includes('BM-04'));
  });
});




