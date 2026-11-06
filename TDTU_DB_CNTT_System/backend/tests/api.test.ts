import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiRouter } from '../src/routes/api.router.ts';
import { signJwtToken } from '../src/middlewares/middleware.ts';

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const router = createApiRouter();
  const server = http.createServer((req, res) => router.handle(req, res));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 3000;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

// Helper sinh JWT chuẩn bảo mật có chữ ký HMAC-SHA256
function createValidToken(claims: {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer';
  isAdmin?: boolean;
  studentId?: string;
  roleId?: string;
  isEnrolledThisSemester?: boolean;
}) {
  return signJwtToken({
    uid: claims.uid,
    name: claims.name,
    email: claims.email,
    role: claims.role,
    isAdmin: Boolean(claims.isAdmin),
    studentId: claims.studentId,
    roleId: claims.roleId,
    isEnrolledThisSemester: claims.isEnrolledThisSemester !== false
  });
}

test('1. API Summary: Trả về thống kê tổng quan đợt thực tập', async () => {
  await withServer(async (baseUrl) => {
    const token = createValidToken({
      uid: 'gv_test_1',
      name: 'GV. Nguyễn Văn A',
      email: 'nguyenvana@tdtu.edu.vn',
      role: 'lecturer'
    });
    const res = await fetch(`${baseUrl}/api/students/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.totalStudents, 91);
    assert.equal(body.data.dualCourseStudents, 43);
  });
});

test('2. API Tra cứu MST: Tra cứu MST VNG 0303882213', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/internship/company-lookup/0303882213`);
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.taxCode, '0303882213');
    assert.ok(body.data.name.includes('VNG'));
  });
});

test('3. API Bảng tin: Lấy danh sách bài đăng tuyển dụng và thông báo', async () => {
  await withServer(async (baseUrl) => {
    const token = createValidToken({
      uid: 'sv_test_1',
      name: 'Nguyễn Hữu Nhân',
      email: '522h0045@student.tdtu.edu.vn',
      role: 'student',
      studentId: '522H0045'
    });
    const res = await fetch(`${baseUrl}/api/bulletin`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.items));
  });
});

test('4. API Widget Registry & Chart Router: Lấy danh sách widget và biểu đồ', async () => {
  await withServer(async (baseUrl) => {
    const token = createValidToken({
      uid: 'gv_test_2',
      name: 'GV. Trần Minh Lan',
      email: 'tranminhlan@tdtu.edu.vn',
      role: 'lecturer'
    });
    const res = await fetch(`${baseUrl}/api/dashboard/widgets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.widgets.length >= 4);

    const chartRes = await fetch(`${baseUrl}/api/dashboard/chart/status-pie-chart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(chartRes.status, 200);
    const chartBody: any = await chartRes.json();
    assert.equal(chartBody.success, true);
    assert.equal(chartBody.data.widgetId, 'status-pie-chart');
  });
});

test('5. API Notifications: Anti-Spam & Phân quyền riêng tư cá nhân', async () => {
  await withServer(async (baseUrl) => {
    // JWT có chữ ký HMAC-SHA256 chuẩn
    const studentAToken = createValidToken({
      uid: 'std_522h0045',
      studentId: '522H0045',
      name: 'Nguyễn Hữu Nhân',
      email: '522h0045@student.tdtu.edu.vn',
      role: 'student',
      isAdmin: false
    });

    const studentBToken = createValidToken({
      uid: 'std_522h0001',
      studentId: '522H0001',
      name: 'Nguyễn Minh Anh',
      email: '522h0001@student.tdtu.edu.vn',
      role: 'student',
      isAdmin: false
    });

    // 1. Sinh viên A gửi thông báo khai báo thực tập của mình
    const payload = {
      title: 'Tiếp nhận Khai báo Thực tập - FPT Software',
      content: 'Khoa CNTT xác nhận đã tiếp nhận phiếu khai báo của bạn.',
      type: 'declaration',
      targetAudience: 'specific_student',
      targetStudentId: '522H0045'
    };

    const res1 = await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentAToken}` },
      body: JSON.stringify(payload)
    });
    assert.equal(res1.status, 200);
    const body1: any = await res1.json();
    assert.equal(body1.success, true);
    const firstNotifId = body1.data.id;

    // 2. Anti-Spam: Sinh viên A bấm "Lưu & Gửi" liên tiếp lần 2
    const res2 = await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentAToken}` },
      body: JSON.stringify(payload)
    });
    assert.equal(res2.status, 200);
    const body2: any = await res2.json();
    assert.equal(body2.data.id, firstNotifId, 'Anti-spam phải trả về ID cũ, không tạo trùng lặp');

    // 3. Phân quyền: Sinh viên A nạp danh sách thông báo -> Phải thấy thông báo của mình
    const listA = await fetch(`${baseUrl}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${studentAToken}` }
    });
    const listABody: any = await listA.json();
    const hasMyNotif = listABody.data.some((n: any) => n.id === firstNotifId);
    assert.ok(hasMyNotif, 'Sinh viên A phải thấy thông báo cá nhân của mình');

    // 4. Phân quyền bảo mật: Sinh viên B nạp danh sách thông báo -> TUYỆT ĐỐI KHÔNG thấy thông báo của A
    const listB = await fetch(`${baseUrl}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${studentBToken}` }
    });
    const listBBody: any = await listB.json();
    const leaked = listBBody.data.some((n: any) => n.id === firstNotifId);
    assert.equal(leaked, false, 'Sinh viên B tuyệt đối không được nhìn thấy thông báo cá nhân của Sinh viên A');
  });
});

test('6. API Notifications: Admin Broadcast & Audience Count Preview', async () => {
  await withServer(async (baseUrl) => {
    const adminToken = createValidToken({
      uid: 'admin_phamvanc',
      name: 'TS. Phạm Văn C',
      email: 'phamvanc@tdtu.edu.vn',
      role: 'lecturer',
      isAdmin: true
    });

    // 1. Kiểm tra Audience Count cho nhóm sinh viên chưa có nơi thực tập
    const countRes = await fetch(`${baseUrl}/api/notifications/audience-count?targetAudience=students_seeking`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(countRes.status, 200);
    const countBody: any = await countRes.json();
    assert.equal(countBody.success, true);
    assert.ok(countBody.data.count > 0);
    assert.equal(countBody.data.label, 'Sinh viên chưa có nơi thực tập');

    // 2. Admin phát thông báo có phân quyền cho nhóm sinh viên chưa có nơi thực tập
    const broadRes = await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: '[Cảnh báo] Hạn chót nộp hồ sơ thực tập HK1',
        content: 'Khoa CNTT nhắc nhở các bạn chưa có nơi thực tập hoàn tất thủ tục.',
        type: 'reminder',
        priority: 'urgent',
        targetAudience: 'students_seeking'
      })
    });
    assert.equal(broadRes.status, 200);
    const broadBody: any = await broadRes.json();
    assert.equal(broadBody.success, true);
    assert.equal(broadBody.data.targetAudience, 'students_seeking');
  });
});

test('7. P0 Security: Từ chối truy cập 401 khi không có Token (Unauthorized)', async () => {
  await withServer(async (baseUrl) => {
    // Không token gọi GET /api/students -> Bắt buộc 401
    const resStudents = await fetch(`${baseUrl}/api/students`);
    assert.equal(resStudents.status, 401);
    const bodyStudents: any = await resStudents.json();
    assert.equal(bodyStudents.success, false);
    assert.equal(bodyStudents.code, 'AUTH_REQUIRED');

    // Không token gọi DELETE /api/students -> Bắt buộc 401 (ngăn chặn xóa sổ DB)
    const resDelete = await fetch(`${baseUrl}/api/students`, { method: 'DELETE' });
    assert.equal(resDelete.status, 401);

    // Không token gọi GET /api/certificates -> Bắt buộc 401
    const resCert = await fetch(`${baseUrl}/api/certificates`);
    assert.equal(resCert.status, 401);
  });
});

test('8. P0 Security: Chặn triệt để token giả mạo mock_jwt_ và raw Base64 (401)', async () => {
  await withServer(async (baseUrl) => {
    // Thử tấn công bằng tiền tố mock_jwt_
    const fakeMockToken = 'mock_jwt_' + Buffer.from(JSON.stringify({
      uid: 'fake_hacker',
      email: 'duonghuuphuc@tdtu.edu.vn',
      isAdmin: true,
      role: 'admin'
    })).toString('base64');

    const resMock = await fetch(`${baseUrl}/api/students`, {
      headers: { 'Authorization': `Bearer ${fakeMockToken}` }
    });
    assert.equal(resMock.status, 401, 'Bắt buộc từ chối token mock_jwt_ không có chữ ký HMAC');

    // Thử tấn công bằng chuỗi base64 raw không có chữ ký
    const rawBase64Token = Buffer.from(JSON.stringify({
      email: 'duonghuuphuc@tdtu.edu.vn',
      isAdmin: true,
      role: 'lecturer'
    })).toString('base64');

    const resRaw = await fetch(`${baseUrl}/api/students`, {
      headers: { 'Authorization': `Bearer ${rawBase64Token}` }
    });
    assert.equal(resRaw.status, 401, 'Bắt buộc từ chối token raw base64 unverified');
  });
});

test('9. P0 Security: Chặn sinh viên truy cập chức năng Admin (403 Forbidden)', async () => {
  await withServer(async (baseUrl) => {
    const studentToken = createValidToken({
      uid: 'std_522h0045',
      name: 'Nguyễn Hữu Nhân',
      email: '522h0045@student.tdtu.edu.vn',
      role: 'student',
      isAdmin: false,
      studentId: '522H0045'
    });

    // 1. Sinh viên cố gắng gọi cấp quyền Admin
    const resAdminRole = await fetch(`${baseUrl}/api/auth/admin-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ uid: 'std_522h0045', isAdmin: true })
    });
    assert.equal(resAdminRole.status, 403, 'Sinh viên không được gọi API Admin');

    // 2. Sinh viên cố gắng gọi xóa toàn bộ danh sách sinh viên
    const resClear = await fetch(`${baseUrl}/api/students`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert.equal(resClear.status, 403, 'Sinh viên không được gọi API xóa danh sách sinh viên');
  });
});

test('10. P0 Security: Phân quyền Prime RBAC qua HTTP Router (403 vs 200)', async () => {
  await withServer(async (baseUrl) => {
    // Sinh viên trong kỳ: mask students = 1 (không chia hết cho 2 READ)
    const studentToken = createValidToken({
      uid: 'std_522h0045',
      name: 'Nguyễn Hữu Nhân',
      email: '522h0045@student.tdtu.edu.vn',
      role: 'student',
      roleId: 'sv_trong_ky',
      studentId: '522H0045'
    });

    const resStudentRead = await fetch(`${baseUrl}/api/students`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert.equal(resStudentRead.status, 403, 'Sinh viên bị Prime RBAC chặn không cho đọc danh sách toàn trường');
    const bodyForbidden: any = await resStudentRead.json();
    assert.equal(bodyForbidden.code, 'PRIME_FORBIDDEN');

    // Giảng viên: mask students = 22 (22 % 2 === 0, READ hợp lệ)
    const lecturerToken = createValidToken({
      uid: 'gv_nguyenvana',
      name: 'GV. Nguyễn Văn A',
      email: 'nguyenvana@tdtu.edu.vn',
      role: 'lecturer',
      roleId: 'giang_vien'
    });

    const resLecturerRead = await fetch(`${baseUrl}/api/students`, {
      headers: { 'Authorization': `Bearer ${lecturerToken}` }
    });
    assert.equal(resLecturerRead.status, 200, 'Giảng viên có quyền READ danh sách sinh viên');
  });
});
