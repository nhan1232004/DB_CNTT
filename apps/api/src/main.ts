// ============================================================================
// MAIN API GATEWAY, RBAC GUARD & REPORTING MICROSERVICE SERVER (apps/api/src/main.ts)
// Hệ thống Quản lý Thực tập & Dashboard TSNN (DB_CNTT) - Khoa CNTT TDTU
// ============================================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SqliteDatabase, DEFAULT_DB_FILE_PATH } from './database/sqlite.db.ts';
import { AuthService, AuthError } from './modules/auth/auth.service.ts';
import { StudentsService } from './modules/students/students.service.ts';
import { CompanyTaxAdapter } from './modules/internship/tax-lookup.adapter.ts';
import { InternshipService } from './modules/internship/internship.service.ts';
import { CertificatesService } from './modules/certificates/certificates.service.ts';
import { BulletinService } from './modules/bulletin/bulletin.service.ts';
import { WidgetRegistry, ChartRouter } from './modules/reporting/chart-router.ts';
import {
  CompanyDataAdapter,
  CompanyPartnerPiePlugin,
  IndustryDistributionBarPlugin,
  StudentStatusDonutPlugin,
  LanguageStandardDonutPlugin,
  MajorCourseBreakdownPlugin,
} from './modules/reporting/chart-plugins.ts';
import { ChartNotFoundError } from './modules/reporting/contracts.ts';
import type { UserProfile } from '../../../packages/shared-types/src/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đảm bảo file SQLite vật lý luôn được khởi tạo sẵn trên ổ đĩa
try {
  const bootstrapDiskDb = new SqliteDatabase(DEFAULT_DB_FILE_PATH);
  bootstrapDiskDb.close();
} catch {
  // Bỏ qua nếu môi trường chỉ đọc
}

export interface CreateAppServerOptions {
  dbPath?: string;
}

export function createAppServer(options: CreateAppServerOptions = {}) {
  const isDirectRun =
    Boolean(process.argv[1]) && path.resolve(process.argv[1]) === path.resolve(__filename);
  const resolvedDbPath =
    options.dbPath || process.env.DB_PATH || (isDirectRun ? DEFAULT_DB_FILE_PATH : ':memory:');

  // 1. Khởi tạo Persistent SQLite Database & Domain Services
  const sqlite = new SqliteDatabase(resolvedDbPath);
  const authService = new AuthService(sqlite);
  const studentsService = new StudentsService(sqlite);
  const taxAdapter = new CompanyTaxAdapter();
  const internshipService = new InternshipService(studentsService, taxAdapter);
  const certificatesService = new CertificatesService(studentsService, sqlite);
  const bulletinService = new BulletinService(sqlite, studentsService);

  // 2. Khởi tạo Reporting Microservice (Adapter + WidgetRegistry + ChartRouter)
  const companyDataAdapter = new CompanyDataAdapter();
  const widgetRegistry = new WidgetRegistry();

  widgetRegistry.register(new StudentStatusDonutPlugin(studentsService));
  widgetRegistry.register(new MajorCourseBreakdownPlugin(studentsService));
  widgetRegistry.register(new LanguageStandardDonutPlugin(studentsService));
  widgetRegistry.register(new CompanyPartnerPiePlugin(companyDataAdapter));
  widgetRegistry.register(new IndustryDistributionBarPlugin(companyDataAdapter));

  const chartRouter = new ChartRouter(widgetRegistry);

  // Helper đọc JSON body
  const parseJsonBody = (req: http.IncomingMessage): Promise<any> =>
    new Promise((resolve, reject) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
      });
      req.on('end', () => {
        if (!raw) return resolve({});
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error('JSON Payload không hợp lệ'));
        }
      });
      req.on('error', reject);
    });

  const sendJson = (res: http.ServerResponse, status: number, payload: unknown) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(JSON.stringify(payload));
  };

  /**
   * Middleware trích xuất và kiểm tra JWT Token từ Header Authorization
   */
  const extractAuthUser = (req: http.IncomingMessage): UserProfile | null => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;
    const verified = authService.verifyToken(authHeader);
    if (!verified) {
      throw new AuthError('Phiên đăng nhập (JWT Token) không hợp lệ hoặc đã hết hạn.', 401);
    }
    return verified;
  };

  /**
   * RBAC Guard: Chỉ cho phép Giảng viên / Admin (@tdtu.edu.vn)
   */
  const assertLecturerOrAdmin = (authUser: UserProfile | null, strictTokenRequired = false) => {
    if (strictTokenRequired && !authUser) {
      throw new AuthError('Yêu cầu đăng nhập tài khoản Giảng viên/Admin (@tdtu.edu.vn).', 401);
    }
    if (authUser && authUser.role !== 'GV') {
      throw new AuthError(
        'Từ chối phân quyền (403): Tài khoản Sinh viên (@student.tdtu.edu.vn) không có quyền thực hiện chức năng của Giảng viên/Admin.',
        403
      );
    }
  };

  /**
   * RBAC Guard: Chỉ cho phép Admin toàn quyền (isAdmin = true)
   */
  const assertAdminOnly = (authUser: UserProfile | null): UserProfile => {
    if (!authUser) {
      throw new AuthError('Yêu cầu đăng nhập tài khoản Admin toàn quyền (@tdtu.edu.vn).', 401);
    }
    if (authUser.role !== 'GV' || !authUser.isAdmin) {
      throw new AuthError(
        'Từ chối phân quyền (403): Chỉ tài khoản Admin toàn quyền mới được phép quản lý và chuyển quyền Admin cho giảng viên khác.',
        403
      );
    }
    return authUser;
  };

  /**
   * RBAC Guard: Sinh viên chỉ được thao tác trên đúng hồ sơ MSSV của chính mình
   */
  const assertStudentOwnRecordOrLecturer = (authUser: UserProfile | null, targetMssv: string) => {
    if (authUser && authUser.role === 'SV') {
      const ownMssv = (authUser.studentId || '').trim().toUpperCase();
      const requestedMssv = (targetMssv || '').trim().toUpperCase();
      if (ownMssv && requestedMssv && ownMssv !== requestedMssv) {
        throw new AuthError(
          `Từ chối phân quyền (403): Sinh viên (${ownMssv}) chỉ được phép thao tác trên hồ sơ của chính mình, không được sửa hồ sơ MSSV ${requestedMssv}.`,
          403
        );
      }
    }
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method || 'GET';

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      res.end();
      return;
    }

    try {
      const authUser = extractAuthUser(req);

      // ==================== 1. AUTHENTICATION, FIREBASE AUTH & ADMIN RBAC (SSO TDTU) ====================
      if (
        (pathname === '/api/auth/google' ||
          pathname === '/api/auth/google-login' ||
          pathname === '/api/auth/firebase' ||
          pathname === '/api/auth/firebase-login') &&
        method === 'POST'
      ) {
        const body = await parseJsonBody(req);
        const result = authService.authenticateFirebase({
          email: body.email || '',
          idToken: body.idToken || body.firebaseIdToken,
          firebaseUid: body.firebaseUid || body.uid,
          displayName: body.displayName || body.fullName || body.studentName,
          photoUrl: body.photoUrl || body.picture,
          providerId: body.providerId || body.authProvider,
          expectedRole: body.expectedRole,
        });
        if (!result.success || !result.user) {
          return sendJson(res, 403, result);
        }
        const enrichedUser = {
          ...result.user,
          name: result.user.fullName,
          mssv: result.user.studentId,
        };
        const firebaseIdToken = authService.createFirebaseIdToken({
          email: result.user.email,
          firebaseUid: result.user.firebaseUid,
          displayName: result.user.fullName,
          photoUrl: result.user.photoUrl,
        });
        return sendJson(res, 200, {
          ...result,
          firebaseIdToken,
          user: enrichedUser,
          data: {
            user: enrichedUser,
            token: result.token,
            firebaseIdToken,
            firebase: result.firebase,
          },
        });
      }

      if (pathname === '/api/auth/firebase/config' && method === 'GET') {
        const configStatus = authService.getFirebaseConfigStatus();
        return sendJson(res, 200, {
          success: true,
          config: configStatus,
          data: configStatus,
        });
      }

      if ((pathname === '/api/auth/firebase/users' || pathname === '/api/auth/users') && method === 'GET') {
        assertLecturerOrAdmin(authUser, false);
        const result = authService.listFirebaseUsers({
          search: url.searchParams.get('search') || undefined,
          role: url.searchParams.get('role') || undefined,
          status: url.searchParams.get('status') || undefined,
        });
        return sendJson(res, 200, {
          success: true,
          users: result.items,
          items: result.items,
          summary: result.summary,
          data: {
            items: result.items,
            users: result.items,
            summary: result.summary,
          },
        });
      }

      if ((pathname === '/api/auth/firebase/users' || pathname === '/api/auth/users') && method === 'POST') {
        const adminActor = assertAdminOnly(authUser);
        const body = await parseJsonBody(req);
        const result = authService.upsertFirebaseUser(adminActor, {
          email: body.email || '',
          fullName: body.fullName || body.displayName || body.name,
          isAdmin: body.isAdmin,
          isActive: body.isActive,
          firebaseUid: body.firebaseUid,
        });
        return sendJson(res, 200, {
          ...result,
          data: {
            ...result.user,
            user: result.user,
            summary: result.summary,
          },
        });
      }

      if (
        (pathname === '/api/auth/firebase/users/status' ||
          (pathname.startsWith('/api/auth/firebase/users/') && pathname.endsWith('/status'))) &&
        method === 'PATCH'
      ) {
        const adminActor = assertAdminOnly(authUser);
        const body = await parseJsonBody(req);
        let targetEmail = body.targetEmail || body.email || '';
        if (!targetEmail && pathname !== '/api/auth/firebase/users/status') {
          const parts = pathname.split('/');
          targetEmail = decodeURIComponent(parts[parts.length - 2] || '');
        }
        const result = authService.setAccountActiveStatus(adminActor, {
          targetEmail,
          isActive: Boolean(body.isActive),
        });
        return sendJson(res, 200, {
          ...result,
          data: {
            ...result.user,
            user: result.user,
            summary: result.summary,
          },
        });
      }

      if (pathname === '/api/auth/me' && method === 'GET') {
        if (!authUser) {
          return sendJson(res, 401, {
            success: false,
            error: 'Chưa đăng nhập hoặc thiếu JWT Token trong Header Authorization.',
          });
        }
        const enrichedUser = {
          ...authUser,
          name: authUser.fullName,
          mssv: authUser.studentId,
        };
        return sendJson(res, 200, {
          success: true,
          user: enrichedUser,
          data: enrichedUser,
        });
      }

      if (pathname === '/api/auth/profile' && method === 'GET') {
        const role = (url.searchParams.get('role') === 'SV' ? 'SV' : 'GV') as 'GV' | 'SV';
        const mssv = url.searchParams.get('mssv') || undefined;
        const emailParam = url.searchParams.get('email');
        if (emailParam) {
          const authRes = authService.authenticateGoogleEmail(emailParam);
          if (!authRes.success) return sendJson(res, 403, authRes);
          return sendJson(res, 200, authRes);
        }
        const user = authService.getDefaultProfile(role, mssv);
        const token = authService.signToken(user);
        return sendJson(res, 200, {
          success: true,
          user,
          token,
        });
      }

      if (pathname === '/api/auth/lecturers' && method === 'GET') {
        assertLecturerOrAdmin(authUser, false);
        const lecturers = authService.listLecturers();
        return sendJson(res, 200, {
          success: true,
          lecturers,
          data: lecturers,
        });
      }

      if (pathname === '/api/auth/admin/grant' && method === 'POST') {
        const adminActor = assertAdminOnly(authUser);
        const body = await parseJsonBody(req);
        const result = authService.grantOrRevokeAdmin(adminActor, {
          targetEmail: body.targetEmail || '',
          fullName: body.fullName,
          isAdmin: body.isAdmin !== undefined ? Boolean(body.isAdmin) : true,
        });
        return sendJson(res, 200, {
          ...result,
          data: result.targetUser,
        });
      }

      if (pathname === '/api/auth/admin/transfer' && method === 'POST') {
        const adminActor = assertAdminOnly(authUser);
        const body = await parseJsonBody(req);
        const result = authService.transferAdminOwnership(adminActor, {
          targetEmail: body.targetEmail || '',
          fullName: body.fullName,
        });
        return sendJson(res, 200, {
          ...result,
          data: {
            from: result.previousAdmin,
            to: result.newAdmin,
          },
        });
      }

      // ==================== 2. STUDENTS & METRICS (91 SV THỰC TẾ) ====================
      if (pathname === '/api/students/summary' && method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          metrics: studentsService.getSummaryMetrics(),
        });
      }

      if (pathname === '/api/students' && method === 'GET') {
        const result = studentsService.getAll({
          search: url.searchParams.get('search') || undefined,
          course: url.searchParams.get('course') || undefined,
          major: url.searchParams.get('major') || undefined,
          status: url.searchParams.get('status') || undefined,
        });
        return sendJson(res, 200, {
          success: true,
          ...result,
          students: result.items,
          data: {
            items: result.items,
            total: result.filteredCount,
            totalStudents: result.totalStudents,
            totalEnrollments: result.totalEnrollments,
            bothCoursesCount: result.bothCoursesCount,
          },
        });
      }

      if (pathname === '/api/students/import' && method === 'POST') {
        assertLecturerOrAdmin(authUser, false);
        const body = await parseJsonBody(req);
        const rows = Array.isArray(body.students) ? body.students : [];
        if (rows.length === 0) {
          return sendJson(res, 400, {
            success: false,
            error: 'Danh sách sinh viên import không được rỗng.',
          });
        }
        const stats = studentsService.importStudentsBatch(rows);
        return sendJson(res, 200, {
          success: true,
          message: `Đã xử lý thành công: Thêm mới ${stats.importedCount} SV, cập nhật ${stats.updatedCount} SV (Tổng: ${stats.totalStudents} SV).`,
          ...stats,
          data: stats,
        });
      }

      if (pathname.startsWith('/api/students/') && pathname.endsWith('/status') && method === 'PATCH') {
        assertLecturerOrAdmin(authUser, false);
        const parts = pathname.split('/');
        const mssv = decodeURIComponent(parts[parts.length - 2] || '');
        const body = await parseJsonBody(req);
        const updated = studentsService.interveneStudentStatus(mssv, body);
        if (!updated) {
          return sendJson(res, 404, { success: false, error: `Không tìm thấy sinh viên MSSV ${mssv}` });
        }
        return sendJson(res, 200, {
          success: true,
          message: `Giảng viên đã cập nhật trạng thái của SV ${updated.name} (${updated.mssv}) thành "${updated.status}"!`,
          student: updated,
          data: updated,
        });
      }

      if (pathname.startsWith('/api/students/') && method === 'GET') {
        const mssv = decodeURIComponent(pathname.split('/').pop() || '');
        const student = studentsService.getByMssv(mssv);
        if (!student) {
          return sendJson(res, 404, { success: false, error: 'Không tìm thấy sinh viên' });
        }
        return sendJson(res, 200, { success: true, student, data: student });
      }

      // ==================== 3. INTERNSHIP & MST ADAPTER ====================
      if (pathname.startsWith('/api/internship/company-lookup/') && method === 'GET') {
        const mst = decodeURIComponent(pathname.split('/').pop() || '');
        const companyInfo = await internshipService.lookupCompanyByMst(mst);
        return sendJson(res, 200, {
          success: true,
          data: companyInfo,
        });
      }

      if (
        (pathname === '/api/internship/confirm-declaration' ||
          pathname === '/api/internship/submit-declaration') &&
        method === 'POST'
      ) {
        const body = await parseJsonBody(req);
        const targetMssv = body.mssv || authUser?.studentId || '';
        assertStudentOwnRecordOrLecturer(authUser, targetMssv);
        const normalizedPayload = {
          ...body,
          mssv: targetMssv,
          selectedCourses: body.selectedCourses || body.courses || ['Tập sự nghề nghiệp'],
          taxCode: body.taxCode || body.mst,
          companyAddress: body.companyAddress || body.address,
          internPosition: body.internPosition || body.position,
          mentorContact: body.mentorContact || body.mentor,
          supportOption: body.supportOption || body.noCompanyOption,
          preferredField: body.preferredField || body.desiredField,
        };
        const result = internshipService.submitDeclaration(normalizedPayload);
        return sendJson(res, 200, {
          ...result,
          data: {
            declaration: result.updatedStudent,
            student: result.updatedStudent,
            updatedStudent: result.updatedStudent,
          },
        });
      }

      // ==================== 3.1 INT-02 & INT-03: GIẤY GIỚI THIỆU THỰC TẬP (GGT) ====================
      if (pathname === '/api/internship/letters' && method === 'GET') {
        const studentIdQuery =
          url.searchParams.get('studentId') ||
          (authUser?.role === 'SV' ? authUser.studentId : undefined);
        const letters = internshipService.getIntroductionLetters(studentIdQuery || undefined);
        return sendJson(res, 200, {
          success: true,
          letters,
          data: letters,
        });
      }

      if (pathname === '/api/internship/letters/request' && method === 'POST') {
        const body = await parseJsonBody(req);
        const targetMssv = body.mssv || authUser?.studentId || '';
        assertStudentOwnRecordOrLecturer(authUser, targetMssv);
        const letter = internshipService.requestIntroductionLetter({
          ...body,
          mssv: targetMssv,
        });
        return sendJson(res, 201, {
          success: true,
          message: 'Nộp yêu cầu cấp Giấy giới thiệu thực tập thành công!',
          letter,
          data: letter,
        });
      }

      if (
        pathname.startsWith('/api/internship/letters/') &&
        pathname.endsWith('/approve') &&
        (method === 'PATCH' || method === 'POST')
      ) {
        assertLecturerOrAdmin(authUser, false);
        const parts = pathname.split('/');
        const id = decodeURIComponent(parts[parts.length - 2] || '');
        const body = await parseJsonBody(req).catch(() => ({}));
        const approverName = body.approverName || authUser?.fullName || 'TS. Trưởng Khoa CNTT';
        const updated = internshipService.approveIntroductionLetter(id, approverName);
        return sendJson(res, 200, {
          success: true,
          message: `Khoa CNTT đã phê duyệt Giấy giới thiệu mã ${updated.letterNo}!`,
          letter: updated,
          data: updated,
        });
      }

      if (pathname.startsWith('/api/internship/letters/') && pathname.endsWith('/print') && method === 'GET') {
        const parts = pathname.split('/');
        const id = decodeURIComponent(parts[parts.length - 2] || '');
        try {
          const html = internshipService.generatePrintableLetterHtml(id);
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          });
          return res.end(html);
        } catch (err: any) {
          return sendJson(res, 404, {
            success: false,
            error: err.message || 'Không tìm thấy Giấy giới thiệu để in.',
          });
        }
      }

      if (pathname.startsWith('/api/internship/letters/') && method === 'GET') {
        const id = decodeURIComponent(pathname.split('/').pop() || '');
        const letter = internshipService.getIntroductionLetterById(id);
        if (!letter) {
          return sendJson(res, 404, { success: false, error: 'Không tìm thấy Giấy giới thiệu' });
        }
        return sendJson(res, 200, { success: true, letter, data: letter });
      }

      // ==================== 3.2 DATA-02: BIỂU MẪU & QUY ĐỊNH THỰC TẬP ====================
      if ((pathname === '/api/documents' || pathname === '/api/internship/documents') && method === 'GET') {
        const documents = internshipService.getInternshipDocuments();
        return sendJson(res, 200, {
          success: true,
          documents,
          data: documents,
        });
      }

      // ==================== 4. TDTU LANGUAGE STANDARDS ====================
      if (pathname === '/api/certificates/standards' && method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          standards: certificatesService.getRecognizedStandards(),
        });
      }

      if (pathname === '/api/certificates/submit' && method === 'POST') {
        const body = await parseJsonBody(req);
        const targetMssv = body.mssv || authUser?.studentId || '';
        assertStudentOwnRecordOrLecturer(authUser, targetMssv);
        const normalizedCert = {
          ...body,
          mssv: targetMssv,
          certCode: body.certCode || body.certType,
          scoreOrLevel: body.scoreOrLevel || body.score,
          certNumber: body.certNumber || body.certNo || body.issueDate,
          examDate: body.examDate || body.issueDate,
        };
        const result = certificatesService.submitCertificate(normalizedCert);
        return sendJson(res, 200, {
          ...result,
          data: {
            record: result.updatedStudent,
            student: result.updatedStudent,
            updatedStudent: result.updatedStudent,
          },
        });
      }

      // ==================== 5. 2-TIER BULLETIN (TIN GV TRÊN + JD DƯỚI) ====================
      if ((pathname === '/api/bulletin' || pathname === '/api/bulletin/feed') && method === 'GET') {
        const announcements = bulletinService.getAnnouncements();
        const jds = bulletinService.getJdPostings(true);
        const applications = bulletinService.getJdApplications();
        const mapJdForFeed = (j: any) => ({
          ...j,
          mst: j.taxCode,
          roleTitle: j.jobTitle,
          address: j.location,
          forwardedByEmail: j.sourceEmail || j.forwardedBy,
        });
        return sendJson(res, 200, {
          success: true,
          tier1_lecturerAnnouncements: announcements,
          tier2_jdPostings: jds,
          applications,
          sampleEmails: bulletinService.getSampleEmails(),
          data: {
            announcements: announcements.map((a) => ({ ...a, author: a.authorName })),
            pendingJds: jds.pending.map(mapJdForFeed),
            approvedJds: jds.approved.map(mapJdForFeed),
          },
        });
      }

      if (pathname === '/api/bulletin/announcements' && method === 'POST') {
        assertLecturerOrAdmin(authUser, false);
        const body = await parseJsonBody(req);
        const created = bulletinService.createAnnouncement({
          ...body,
          authorName:
            body.authorName ||
            body.author ||
            authUser?.fullName ||
            'TS. Nguyễn Văn A (Phụ trách TSNN)',
          authorEmail: body.authorEmail || authUser?.email || 'nguyenvana@tdtu.edu.vn',
        });
        return sendJson(res, 201, { success: true, announcement: created, data: created });
      }

      if (
        pathname.startsWith('/api/bulletin/announcements/') &&
        pathname.endsWith('/pin') &&
        method === 'PATCH'
      ) {
        assertLecturerOrAdmin(authUser, false);
        const parts = pathname.split('/');
        const id = parts[parts.length - 2];
        const updated = bulletinService.togglePinAnnouncement(id);
        if (!updated) {
          return sendJson(res, 404, { success: false, error: 'Không tìm thấy thông báo' });
        }
        return sendJson(res, 200, { success: true, announcement: updated });
      }

      if (pathname.startsWith('/api/bulletin/announcements/') && method === 'DELETE') {
        assertLecturerOrAdmin(authUser, false);
        const id = pathname.split('/').pop() || '';
        const deleted = bulletinService.deleteAnnouncement(id);
        return sendJson(res, 200, { success: deleted });
      }

      if (pathname === '/api/bulletin/jd/sample-emails' && method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          samples: bulletinService.getSampleEmails(),
        });
      }

      if (pathname === '/api/bulletin/jd/parse-preview' && method === 'POST') {
        assertLecturerOrAdmin(authUser, false);
        const body = await parseJsonBody(req);
        const parsed = bulletinService.previewEmailForward({
          ...body,
          forwardedBy: body.forwardedBy || authUser?.email,
        });
        const enrichedParsed = {
          ...parsed,
          mst: parsed.taxCode,
          roleTitle: parsed.jobTitle,
          address: parsed.location,
        };
        return sendJson(res, 200, {
          success: true,
          parsed: enrichedParsed,
          data: enrichedParsed,
        });
      }

      if (pathname === '/api/bulletin/jd/webhook-forward' && method === 'POST') {
        assertLecturerOrAdmin(authUser, false);
        const body = await parseJsonBody(req);
        const createdJd = bulletinService.simulateInboundEmailForward({
          ...body,
          forwardedBy: body.forwardedBy || authUser?.email,
        });
        const enrichedJd = {
          ...createdJd,
          mst: createdJd.taxCode,
          roleTitle: createdJd.jobTitle,
          address: createdJd.location,
        };
        return sendJson(res, 201, {
          success: true,
          message: 'Đã tiếp nhận và bóc tách tự động Email Forward JD từ Giảng viên!',
          jd: enrichedJd,
          data: enrichedJd,
        });
      }

      if (
        pathname.startsWith('/api/bulletin/jd/') &&
        pathname.endsWith('/approve') &&
        (method === 'PATCH' || method === 'POST')
      ) {
        assertLecturerOrAdmin(authUser, false);
        const parts = pathname.split('/');
        const id = parts[parts.length - 2];
        const approved = bulletinService.approveJdPosting(
          id,
          authUser?.email || 'nguyenvana@tdtu.edu.vn'
        );
        if (!approved) {
          return sendJson(res, 404, { success: false, error: 'Không tìm thấy JD chờ duyệt' });
        }
        return sendJson(res, 200, {
          success: true,
          message: 'Đã phê duyệt 1-Click và công khai tin tuyển dụng lên Bảng tin!',
          jd: approved,
          data: approved,
        });
      }

      if (
        pathname.startsWith('/api/bulletin/jd/') &&
        pathname.endsWith('/apply') &&
        method === 'POST'
      ) {
        const parts = pathname.split('/');
        const jdId = parts[parts.length - 2];
        const body = await parseJsonBody(req);
        const targetMssv = body.mssv || authUser?.studentId || '';
        assertStudentOwnRecordOrLecturer(authUser, targetMssv);
        const result = bulletinService.applyForJd({
          jdId,
          mssv: targetMssv,
          selectedCourses: body.selectedCourses,
          cvNote: body.cvNote || body.note,
        });
        return sendJson(res, 201, {
          ...result,
          data: result.application,
        });
      }

      if (pathname === '/api/bulletin/jd/applications' && method === 'GET') {
        const jdId = url.searchParams.get('jdId') || undefined;
        const mssv = url.searchParams.get('mssv') || undefined;
        return sendJson(res, 200, {
          success: true,
          applications: bulletinService.getJdApplications(jdId, mssv),
        });
      }

      if (pathname.startsWith('/api/bulletin/jd/') && method === 'DELETE') {
        assertLecturerOrAdmin(authUser, false);
        const id = pathname.split('/').pop() || '';
        const deleted = bulletinService.rejectJdPosting(id);
        return sendJson(res, 200, {
          success: deleted,
          message: 'Đã xóa/từ chối tin tuyển dụng JD.',
        });
      }

      // ==================== 6. REPORTING ENGINE (WIDGET REGISTRY + CHART ROUTER) ====================
      if (pathname === '/api/dashboard/widgets' && method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          widgets: widgetRegistry.listWidgets(),
        });
      }

      if (pathname.startsWith('/api/dashboard/charts/') && method === 'GET') {
        const chartId = pathname.split('/').pop() || '';
        const schema = url.searchParams.get('schema') || undefined;
        const chartData = await chartRouter.dispatch(chartId, { schema });
        return sendJson(res, 200, {
          success: true,
          chart: chartData,
        });
      }

      // ==================== 7. SERVE WEB SPA (FRONTEND) ====================
      if (pathname === '/' || pathname === '/index.html') {
        const webDistIndex = path.resolve(__dirname, '../../web/dist/index.html');
        const rootIndex = path.resolve(__dirname, '../../../index.html');
        const targetFile = fs.existsSync(webDistIndex) ? webDistIndex : rootIndex;

        const html = fs.readFileSync(targetFile, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      return sendJson(res, 404, {
        success: false,
        error: `Endpoint không tồn tại: ${method} ${pathname}`,
      });
    } catch (err: any) {
      if (err instanceof AuthError) {
        return sendJson(res, err.statusCode, { success: false, error: err.message });
      }
      if (err instanceof ChartNotFoundError) {
        return sendJson(res, 404, { success: false, error: err.message });
      }
      return sendJson(res, 400, {
        success: false,
        error: err?.message || 'Lỗi xử lý yêu cầu tại máy chủ',
      });
    }
  });

  server.on('close', () => {
    sqlite.close();
  });

  return server;
}

export const createApiServer = createAppServer;

// Chạy trực tiếp khi được gọi bằng lệnh `node apps/api/src/main.ts`
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectRun) {
  const PORT = Number(process.env.PORT || 3000);
  const server = createAppServer({ dbPath: DEFAULT_DB_FILE_PATH });
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n==================================================================`);
    console.log(`🚀 DB_CNTT API & REPORTING MICROSERVICE ĐANG CHẠY TẠI PORT ${PORT}`);
    console.log(`   - SQLite Database   : ${DEFAULT_DB_FILE_PATH}`);
    console.log(`   - Web Dashboard SPA : http://localhost:${PORT}`);
    console.log(`   - API Tổng quan 91SV: http://localhost:${PORT}/api/students/summary`);
    console.log(`   - API Widget Router : http://localhost:${PORT}/api/dashboard/widgets`);
    console.log(`   - API Tra cứu MST   : http://localhost:${PORT}/api/internship/company-lookup/0303882213`);
    console.log(`   - API Bảng tin 2Tầng: http://localhost:${PORT}/api/bulletin`);
    console.log(`==================================================================\n`);
  });
}
