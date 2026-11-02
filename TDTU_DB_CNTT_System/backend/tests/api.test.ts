import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiRouter } from '../src/routes/api.router.ts';

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

test('1. API Summary: Trả về thống kê tổng quan đợt thực tập', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/students/summary`);
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
    const res = await fetch(`${baseUrl}/api/bulletin`);
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.items));
  });
});

test('4. API Widget Registry & Chart Router: Lấy danh sách widget và biểu đồ', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/dashboard/widgets`);
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.widgets.length >= 4);

    const chartRes = await fetch(`${baseUrl}/api/dashboard/chart/status-pie-chart`);
    assert.equal(chartRes.status, 200);
    const chartBody: any = await chartRes.json();
    assert.equal(chartBody.success, true);
    assert.equal(chartBody.data.widgetId, 'status-pie-chart');
  });
});

test('5. API Notifications: Anti-Spam & Phân quyền riêng tư cá nhân', async () => {
  await withServer(async (baseUrl) => {
    // Mock JWT của sinh viên A: 522H0045
    const studentAToken = 'mock_jwt_' + Buffer.from(JSON.stringify({
      uid: 'std_522h0045',
      studentId: '522H0045',
      name: 'Nguyễn Hữu Nhân',
      email: '522h0045@student.tdtu.edu.vn',
      role: 'student',
      isAdmin: false
    })).toString('base64');

    // Mock JWT của sinh viên B: 522H0001
    const studentBToken = 'mock_jwt_' + Buffer.from(JSON.stringify({
      uid: 'std_522h0001',
      studentId: '522H0001',
      name: 'Nguyễn Minh Anh',
      email: '522h0001@student.tdtu.edu.vn',
      role: 'student',
      isAdmin: false
    })).toString('base64');

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
    const adminToken = 'mock_jwt_' + Buffer.from(JSON.stringify({
      uid: 'admin_phamvanc',
      name: 'TS. Phạm Văn C',
      email: 'phamvanc@tdtu.edu.vn',
      role: 'lecturer',
      isAdmin: true
    })).toString('base64');

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
