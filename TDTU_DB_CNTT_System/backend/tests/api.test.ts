import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiRouter } from '../src/routes/api.router.ts';
import { getDatabase } from '../src/database/sqlite.db.ts';
import { widgetRegistry } from '../src/modules/reporting/widget-registry.ts';
import { chartRouter } from '../src/modules/reporting/chart-router.ts';
import { companyDataAdapter } from '../src/modules/reporting/company-data.adapter.ts';
import { parseInboundEmailForward } from '../src/modules/bulletin/email-parser.ts';
import type { IChartPlugin, WidgetMetadata, StandardChartPayload } from '../src/modules/reporting/contracts.ts';

let testServer: http.Server;
let baseUrl: string;

test.before(async () => {
  getDatabase();
  const router = createApiRouter();
  testServer = http.createServer((req, res) => router.handle(req, res));

  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => {
      const addr = testServer.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise<void>((resolve) => testServer.close(() => resolve()));
});

async function apiRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const url = `${baseUrl}${path}`;
  const fetchOpts: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  if (options.body) {
    fetchOpts.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, fetchOpts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// ================= TEST SUITE =================

test('1. Dữ liệu thực tế: Trả về đúng 91 sinh viên duy nhất, 134 lượt môn và 43 SV đi 2 môn', async () => {
  const { status, data } = await apiRequest('/api/students/summary');
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.totalStudents, 91);
  assert.equal(data.data.dualCourseStudents, 43);
  assert.equal(data.data.totalCourseEnrollments, 134);
});

test('2. Phân loại đăng nhập Email TDTU SSO (@tdtu.edu.vn vs @student.tdtu.edu.vn vs domain ngoài)', async () => {
  // Test Lecturer login
  const resLec = await apiRequest('/api/auth/google-sso', {
    method: 'POST',
    body: { email: 'phamvanc@tdtu.edu.vn', name: 'TS. Phạm Văn C' }
  });
  assert.equal(resLec.status, 200);
  assert.equal(resLec.data.data.user.role, 'lecturer');
  assert.equal(resLec.data.data.user.isAdmin, true);
  assert.ok(resLec.data.data.token);

  // Test Student login
  const resStu = await apiRequest('/api/auth/google-sso', {
    method: 'POST',
    body: { email: '51900839@student.tdtu.edu.vn', name: 'Sinh viên Demo' }
  });
  assert.equal(resStu.status, 200);
  assert.equal(resStu.data.data.user.role, 'student');
  assert.equal(resStu.data.data.user.studentId, '51900839');

  // Test Unauthorized personal email domain
  const resInvalid = await apiRequest('/api/auth/google-sso', {
    method: 'POST',
    body: { email: 'hacker@gmail.com' }
  });
  assert.equal(resInvalid.status, 400);
  assert.equal(resInvalid.data.success, false);
});

test('3. Tra cứu MST & Khai báo đồng thời 2 môn (KTCN + TSNN) tại cùng 1 doanh nghiệp', async () => {
  // Lookup VNG Tax Code
  const lookupRes = await apiRequest('/api/internship/company-lookup/0303882213');
  assert.equal(lookupRes.status, 200);
  assert.ok(lookupRes.data.data.name.includes('VNG'));

  // Login as student
  const stuLogin = await apiRequest('/api/auth/google-sso', {
    method: 'POST',
    body: { email: '51900839@student.tdtu.edu.vn' }
  });
  const token = stuLogin.data.data.token;

  // Declare internship with 2 courses
  const declareRes = await apiRequest('/api/internship/declare', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      studentId: '51900839',
      companyName: 'Công ty Cổ phần VNG',
      taxCode: '0303882213',
      address: 'Z06 Đường 13, Quận 7, TP.HCM',
      contactPerson: 'Lê Hồng Minh',
      contactPhone: '02839623888',
      contactEmail: 'hr@vng.com.vn',
      position: 'Backend Golang & NodeJS Intern',
      isDualCourse: true,
      selectedCourses: ['KTCN', 'TSNN'],
      foreignLanguage: 'TOEIC',
      foreignScore: '650',
      isConfirmed: true
    }
  });

  assert.equal(declareRes.status, 200);
  assert.equal(declareRes.data.success, true);
  assert.equal(declareRes.data.data.declaration.isDualCourse, 1);
  assert.equal(declareRes.data.data.declaration.foreignStatus, 'valid');
});

test('4. Chuẩn ngoại ngữ xét tốt nghiệp TDTU (CERT-01): Chỉ công nhận danh mục chuẩn TDTU', async () => {
  const getStandards = await apiRequest('/api/certificates/standards');
  assert.equal(getStandards.status, 200);
  assert.ok(getStandards.data.data.length >= 5);

  // Validate recognized TOEIC
  const validCert = await apiRequest('/api/certificates/validate', {
    method: 'POST',
    body: { type: 'TOEIC', score: '600' }
  });
  assert.equal(validCert.status, 200);
  assert.equal(validCert.data.data.isValid, true);

  // Validate non-recognized cert
  const invalidCert = await apiRequest('/api/certificates/validate', {
    method: 'POST',
    body: { type: 'Chứng chỉ Tin học A', score: '8.0' }
  });
  assert.equal(invalidCert.status, 200);
  assert.equal(invalidCert.data.data.isValid, false);
});

test('5. Bảng tin 2 tầng: Thông báo Giảng viên (Tầng 1) & Duyệt JD Email Forward (Tầng 2)', async () => {
  // Login as admin lecturer
  const adminLogin = await apiRequest('/api/auth/google-sso', {
    method: 'POST',
    body: { email: 'phamvanc@tdtu.edu.vn' }
  });
  const token = adminLogin.data.data.token;

  // Process forward email
  const sampleEmail = `
---------- Forwarded message ---------
From: HR Recruiter <recruitment@vng.com.vn>
Date: Fri, Oct 24, 2026 at 9:00 AM
Subject: Tuyển thực tập sinh NodeJS và React Khoa CNTT
To: phamvanc@tdtu.edu.vn

Kính gửi Ban Giám hiệu Khoa CNTT TDTU,
Công ty Cổ phần VNG trân trọng thông báo tuyển dụng 10 sinh viên thực tập NodeJS/React.
Địa điểm: VNG Campus Quận 7.
Mức lương: 8,000,000 VNĐ/tháng.
`;

  const parseRes = await apiRequest('/api/bulletin/parse-email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { rawEmail: sampleEmail }
  });

  assert.equal(parseRes.status, 201);
  assert.equal(parseRes.data.data.status, 'draft');
  const postId = parseRes.data.data.id;

  // 1-Click approve JD to published
  const approveRes = await apiRequest(`/api/bulletin/${postId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: { status: 'published' }
  });
  assert.equal(approveRes.status, 200);
  assert.equal(approveRes.data.data.status, 'published');
});

test('6. Reporting Microservice Engine: WidgetRegistry & ChartRouter hoạt động chuẩn (Hình 1)', async () => {
  // 1. List registered widgets
  const widgetsRes = await apiRequest('/api/dashboard/widgets');
  assert.equal(widgetsRes.status, 200);
  assert.ok(widgetsRes.data.data.widgets.length >= 4);

  // 2. Dispatch top-companies chart
  const dispatchRes = await apiRequest('/api/dashboard/chart/dispatch', {
    method: 'POST',
    body: { widgetId: 'top-companies-chart' }
  });
  assert.equal(dispatchRes.status, 200);
  assert.equal(dispatchRes.data.data.widgetId, 'top-companies-chart');
  assert.ok(dispatchRes.data.data.categories.length > 0);

  // 3. Dispatch status-pie chart
  const pieRes = await apiRequest('/api/dashboard/chart/status-pie-chart');
  assert.equal(pieRes.status, 200);
  assert.equal(pieRes.data.data.chartType, 'doughnut');
});

test('7. CompanyDataAdapter: Chuẩn hóa linh hoạt cả Schema V1 và Schema V2', () => {
  const v1Data = [
    { ten_cong_ty: 'FPT Software', so_luong_sv: 20 },
    { ten_cong_ty: 'VNG Corporation', so_luong_sv: 15 }
  ];
  const payloadV1 = companyDataAdapter.transform(v1Data, 'v1');
  assert.equal(payloadV1.categories[0], 'FPT Software');
  assert.equal(payloadV1.series[0].data[0], 20);

  const v2Data = [
    { companyName: 'TMA Solutions', studentCount: 18 },
    { companyName: 'KMS Technology', studentCount: 12 }
  ];
  const payloadV2 = companyDataAdapter.transform(v2Data, 'v2');
  assert.equal(payloadV2.categories[0], 'TMA Solutions');
  assert.equal(payloadV2.series[0].data[0], 18);
});

test('8. Plug-and-Play Architecture: Thêm biểu đồ mới không cần sửa code cũ', async () => {
  class CustomMockPlugin implements IChartPlugin {
    getMetadata(): WidgetMetadata {
      return {
        id: 'mock-cybersecurity-chart',
        name: 'Thực tập An toàn Thông tin SOC',
        category: 'academic',
        description: 'Biểu đồ kiểm thử tính cắm-và-chạy',
        defaultSize: 'small',
        supportedChartTypes: ['bar']
      };
    }
    execute(): StandardChartPayload {
      return {
        widgetId: 'mock-cybersecurity-chart',
        title: 'Thống kê Thực tập ATTT',
        chartType: 'bar',
        categories: ['PenTest', 'SOC Analyst', 'Cloud Security'],
        series: [{ name: 'SV', type: 'bar', data: [12, 8, 5] }],
        generatedAt: new Date().toISOString(),
        schemaVersion: 'standard'
      };
    }
  }

  // Register dynamically at runtime
  const customPlugin = new CustomMockPlugin();
  widgetRegistry.register(customPlugin);

  // Dispatch through ChartRouter
  const result = await chartRouter.dispatch('mock-cybersecurity-chart');
  assert.equal(result.widgetId, 'mock-cybersecurity-chart');
  assert.equal(result.series[0].data[0], 12);

  // Cleanup
  widgetRegistry.unregister('mock-cybersecurity-chart');
});

test('9. RBAC & Bảo mật: Sinh viên không thể gọi API Quản trị hoặc sửa hồ sơ người khác', async () => {
  // Student login
  const stuLogin = await apiRequest('/api/auth/google-sso', {
    method: 'POST',
    body: { email: '51900839@student.tdtu.edu.vn' }
  });
  const stuToken = stuLogin.data.data.token;

  // Try creating bulletin notice (only lecturer allowed)
  const failCreateNotice = await apiRequest('/api/bulletin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${stuToken}` },
    body: { title: 'Spam Notice', content: 'Test' }
  });
  assert.equal(failCreateNotice.status, 403);

  // Try modifying other student declaration
  const failOtherDeclare = await apiRequest('/api/internship/declare', {
    method: 'POST',
    headers: { Authorization: `Bearer ${stuToken}` },
    body: {
      studentId: '52100999', // Different MSSV
      companyName: 'Fake Corp',
      taxCode: '0303882213',
      address: 'TP.HCM',
      contactPerson: 'A',
      contactPhone: '0909090909',
      contactEmail: 'a@a.com',
      position: 'Intern',
      isConfirmed: true
    }
  });
  assert.equal(failOtherDeclare.status, 403);
});

test('10. Thẩm định điều kiện Sinh viên (AUTH-03) & Thư viện Biểu mẫu BM-01 đến BM-04', async () => {
  // Check valid student
  const eligibleRes = await apiRequest('/api/students/eligibility/51900839');
  assert.equal(eligibleRes.status, 200);
  assert.equal(eligibleRes.data.data.isEligible, true);

  // Check student not in the semester list
  const notEligibleRes = await apiRequest('/api/students/eligibility/99999999');
  assert.equal(notEligibleRes.status, 200);
  assert.equal(notEligibleRes.data.data.isEligible, false);

  // Get documents library
  const docsRes = await apiRequest('/api/documents');
  assert.equal(docsRes.status, 200);
  assert.ok(docsRes.data.data.items.some((d: any) => d.code === 'BM-01'));
  assert.ok(docsRes.data.data.items.some((d: any) => d.code === 'BM-04'));
  assert.ok(docsRes.data.data.items.some((d: any) => d.code === 'REG-320H'));
});

test('11. Quản lý phân quyền Admin: Chặn tự thu hồi quyền của Quản trị viên hoạt động cuối cùng', async () => {
  // Login as admin
  const adminLogin = await apiRequest('/api/auth/google-sso', {
    method: 'POST',
    body: { email: 'phamvanc@tdtu.edu.vn' }
  });
  const adminToken = adminLogin.data.data.token;

  // Try revoking admin to 0
  const users = await apiRequest('/api/auth/firebase-users');
  const admins = users.data.data.items.filter((u: any) => u.isAdmin && u.isActive);

  // If only 1 admin, trying to revoke should fail
  if (admins.length === 1) {
    const revokeRes = await apiRequest('/api/auth/admin-role', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { email: admins[0].email, isAdmin: false }
    });
    assert.equal(revokeRes.status, 400);
  }
});
