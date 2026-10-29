// ============================================================================
// AUTH SERVICE, FIREBASE AUTHENTICATION & RBAC ENGINE:
// - Đăng nhập bằng Gmail qua domain Trường ĐH Tôn Đức Thắng (TDTU):
//   1. Giảng viên / Admin: ...@tdtu.edu.vn
//   2. Sinh viên: ...@student.tdtu.edu.vn
// - Quản lý tài khoản bằng Firebase (Firebase Authentication):
//   + Xác thực Firebase ID Token / Google OAuth Provider (google.com)
//   + Đồng bộ Firebase UID, trạng thái hoạt động (isActive), lịch sử đăng nhập (lastLoginAt, loginCount)
//   + Quản lý danh sách tài khoản Firebase, khóa/mở khóa tài khoản, thêm/thu hồi/chuyển nhượng quyền Admin
// ============================================================================

import crypto from 'node:crypto';
import type {
  UserProfile,
  UserRole,
  FirebaseAuthPayload,
  FirebaseUsersSummary,
} from '../../../../../packages/shared-types/src/index.ts';
import { SqliteDatabase } from '../../database/sqlite.db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'tdtu-db-cntt-secret-key-2026-hmac-sha256';

export const FIREBASE_DEFAULT_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'tdtu-cntt-internship-2026',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'tdtu-cntt-internship-2026.firebaseapp.com',
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyTDTU-CNTT-FirebaseAuth-2026-DemoKey',
  appId: process.env.FIREBASE_APP_ID || '1:519008392026:web:tdtucntt2026',
  providerId: 'google.com',
  allowedDomains: ['tdtu.edu.vn', 'student.tdtu.edu.vn'],
};

export const ROLE_PERMISSIONS = {
  ADMIN: [
    'MANAGE_SYSTEM',
    'MANAGE_ADMINS',
    'MANAGE_FIREBASE_USERS',
    'POST_ANNOUNCEMENT',
    'PIN_ANNOUNCEMENT',
    'APPROVE_JD',
    'IMPORT_STUDENTS',
    'UPDATE_STUDENT_STATUS',
    'VERIFY_CERTIFICATE',
    'VIEW_DASHBOARD',
  ],
  LECTURER: [
    'POST_ANNOUNCEMENT',
    'PIN_ANNOUNCEMENT',
    'APPROVE_JD',
    'IMPORT_STUDENTS',
    'UPDATE_STUDENT_STATUS',
    'VERIFY_CERTIFICATE',
    'VIEW_DASHBOARD',
  ],
  STUDENT: [
    'DECLARE_OWN_INTERNSHIP',
    'LOOKUP_MST',
    'SUBMIT_OWN_CERT',
    'VIEW_BULLETIN',
    'APPLY_JD',
    'VIEW_DASHBOARD',
  ],
};

export class AuthError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode = 403) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class AuthService {
  private readonly sqlite: SqliteDatabase;

  constructor(sqlite?: SqliteDatabase) {
    this.sqlite = sqlite || new SqliteDatabase(':memory:');
  }

  private base64UrlEncode(input: string): string {
    return Buffer.from(input, 'utf-8')
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecode(input: string): string {
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  private generateDeterministicFirebaseUid(email: string): string {
    const digest = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 20);
    return `fb-tdtu-${digest}`;
  }

  /**
   * Ký JWT chuẩn HMAC-SHA256 (header.payload.signature) kèm thông tin Firebase UID
   */
  signToken(profile: UserProfile): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
      sub: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      isAdmin: Boolean(profile.isAdmin),
      subRole: profile.subRole || (profile.role === 'GV' ? (profile.isAdmin ? 'ADMIN' : 'LECTURER') : 'STUDENT'),
      studentId: profile.studentId,
      department: profile.department,
      firebaseUid: profile.firebaseUid || this.generateDeterministicFirebaseUid(profile.email),
      authProvider: profile.authProvider || 'google.com',
      iat: nowSec,
      exp: nowSec + 60 * 60 * 24 * 7, // 7 days
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signingInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${signingInput}.${signature}`;
  }

  /**
   * Giải mã Firebase ID Token (Google OAuth / Firebase Auth JWT)
   */
  parseFirebaseIdToken(idToken: string): {
    valid: boolean;
    email?: string;
    firebaseUid?: string;
    displayName?: string;
    photoUrl?: string;
    providerId?: string;
    error?: string;
  } {
    if (!idToken || typeof idToken !== 'string') {
      return { valid: false, error: 'Thiếu Firebase ID Token.' };
    }
    const clean = idToken.replace(/^Bearer\s+/i, '').trim();
    const parts = clean.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Định dạng Firebase ID Token không hợp lệ (yêu cầu chuẩn JWT 3 phần).' };
    }

    try {
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp && Number(payload.exp) < nowSec) {
        return { valid: false, error: 'Firebase ID Token đã hết hạn.' };
      }
      if (payload.email_verified === false) {
        return { valid: false, error: 'Email trên Firebase chưa được xác thực (email_verified = false).' };
      }
      const email = (typeof payload.email === 'string' ? payload.email : '').trim().toLowerCase();
      if (!email) {
        return { valid: false, error: 'Firebase ID Token không chứa thông tin email.' };
      }
      const firebaseUid =
        (typeof payload.user_id === 'string' && payload.user_id.trim()) ||
        (typeof payload.sub === 'string' && payload.sub.trim()) ||
        (typeof payload.firebaseUid === 'string' && payload.firebaseUid.trim()) ||
        this.generateDeterministicFirebaseUid(email);
      const displayName =
        (typeof payload.name === 'string' && payload.name.trim()) ||
        (typeof payload.displayName === 'string' && payload.displayName.trim()) ||
        (typeof payload.fullName === 'string' && payload.fullName.trim()) ||
        undefined;
      const photoUrl =
        (typeof payload.picture === 'string' && payload.picture.trim()) ||
        (typeof payload.photoUrl === 'string' && payload.photoUrl.trim()) ||
        undefined;
      const providerId =
        payload.firebase?.sign_in_provider || payload.providerId || payload.authProvider || 'google.com';

      return {
        valid: true,
        email,
        firebaseUid,
        displayName,
        photoUrl,
        providerId: typeof providerId === 'string' ? providerId.trim() : 'google.com',
      };
    } catch {
      return { valid: false, error: 'Không thể giải mã payload của Firebase ID Token.' };
    }
  }

  /**
   * Tạo Firebase ID Token mô phỏng chuẩn Google OAuth cho môi trường test/emulator
   */
  createFirebaseIdToken(params: {
    email: string;
    firebaseUid?: string;
    displayName?: string;
    photoUrl?: string;
  }): string {
    const email = params.email.trim().toLowerCase();
    const nowSec = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT', kid: 'firebase-google-tdtu-2026' };
    const payload = {
      iss: `https://securetoken.google.com/${FIREBASE_DEFAULT_CONFIG.projectId}`,
      aud: FIREBASE_DEFAULT_CONFIG.projectId,
      auth_time: nowSec,
      user_id: params.firebaseUid || this.generateDeterministicFirebaseUid(email),
      sub: params.firebaseUid || this.generateDeterministicFirebaseUid(email),
      iat: nowSec,
      exp: nowSec + 3600,
      email,
      email_verified: true,
      name: params.displayName || email.split('@')[0],
      picture: params.photoUrl || undefined,
      hd: email.split('@')[1] || 'tdtu.edu.vn',
      firebase: {
        identities: {
          'google.com': [email],
          email: [email],
        },
        sign_in_provider: 'google.com',
      },
    };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const sig = this.base64UrlEncode(`firebase-sig-${email}-${nowSec}`);
    return `${encodedHeader}.${encodedPayload}.${sig}`;
  }

  /**
   * Xác thực JWT Token và đồng bộ trạng thái quyền + khóa tài khoản mới nhất từ SQLite DB
   */
  verifyToken(token: string): UserProfile | null {
    if (!token || typeof token !== 'string') return null;
    const clean = token.replace(/^Bearer\s+/i, '').trim();

    const parts = clean.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signingInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSig) {
      return null;
    }

    let payload: any;
    try {
      payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    } catch {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return null;
    }

    // Luôn đọc trạng thái mới nhất từ bảng users trong SQLite (đề phòng quyền Admin vừa được cấp/thu hồi hoặc tài khoản bị khóa)
    const dbUser = this.getUserByEmail(payload.email);
    if (dbUser) {
      if (dbUser.isActive === false) {
        throw new AuthError(
          'Tài khoản của bạn đã bị khóa (Disabled) trên hệ thống Quản lý Tài khoản Firebase. Vui lòng liên hệ Quản trị viên Khoa CNTT - TDTU.',
          403
        );
      }
      return dbUser;
    }

    const isAdmin = Boolean(payload.isAdmin);
    const role: UserRole = payload.role === 'SV' ? 'SV' : 'GV';
    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role,
      isAdmin,
      subRole: role === 'GV' ? (isAdmin ? 'ADMIN' : 'LECTURER') : 'STUDENT',
      studentId: payload.studentId,
      department: payload.department || 'Khoa Công Nghệ Thông Tin - TDTU',
      firebaseUid: payload.firebaseUid || this.generateDeterministicFirebaseUid(payload.email),
      authProvider: payload.authProvider || 'google.com',
      isActive: true,
      permissions:
        role === 'GV'
          ? isAdmin
            ? ROLE_PERMISSIONS.ADMIN
            : ROLE_PERMISSIONS.LECTURER
          : ROLE_PERMISSIONS.STUDENT,
    };
  }

  private mapRowToUserProfile(row: any): UserProfile {
    const role: UserRole = row.role === 'SV' ? 'SV' : 'GV';
    const isAdmin = Boolean(row.is_admin);
    const isActive = row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active);
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role,
      isAdmin,
      subRole: role === 'GV' ? (isAdmin ? 'ADMIN' : 'LECTURER') : 'STUDENT',
      studentId: row.student_id || undefined,
      department: row.department || 'Khoa Công Nghệ Thông Tin - TDTU',
      grantedBy: row.granted_by || undefined,
      firebaseUid: row.firebase_uid || `fb-tdtu-${row.id}`,
      authProvider: row.auth_provider || 'google.com',
      isActive,
      lastLoginAt: row.last_login_at || undefined,
      loginCount: Number(row.login_count || 0),
      photoUrl: row.photo_url || undefined,
      createdAt: row.created_at,
      permissions:
        role === 'GV'
          ? isAdmin
            ? ROLE_PERMISSIONS.ADMIN
            : ROLE_PERMISSIONS.LECTURER
          : ROLE_PERMISSIONS.STUDENT,
    };
  }

  getUserByEmail(email: string): UserProfile | null {
    const normalized = (typeof email === 'string' ? email : '').trim().toLowerCase();
    if (!normalized) return null;
    const row = this.sqlite.db
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
      .get(normalized) as any;
    if (!row) return null;
    return this.mapRowToUserProfile(row);
  }

  /**
   * Kiểm tra tính hợp lệ của email Gmail thuộc domain Trường ĐH Tôn Đức Thắng
   */
  validateTdtuDomain(
    email: string,
    expectedRole?: UserRole
  ): {
    valid: boolean;
    normalizedEmail: string;
    detectedRole?: UserRole;
    domain?: string;
    error?: string;
  } {
    const normalized = (typeof email === 'string' ? email : '').trim().toLowerCase();
    const emailRegex = /^[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})$/i;
    const match = normalized.match(emailRegex);
    if (!normalized || !match) {
      return {
        valid: false,
        normalizedEmail: normalized,
        error: 'Địa chỉ email không hợp lệ. Vui lòng đăng nhập bằng tài khoản Gmail do ĐH Tôn Đức Thắng cấp.',
      };
    }

    const domain = match[1].toLowerCase();
    if (domain !== 'tdtu.edu.vn' && domain !== 'student.tdtu.edu.vn') {
      return {
        valid: false,
        normalizedEmail: normalized,
        domain,
        error: `Từ chối truy cập: Hệ thống Firebase Auth chỉ chấp nhận Gmail thuộc domain ĐH Tôn Đức Thắng (@tdtu.edu.vn cho Giảng viên/Admin hoặc @student.tdtu.edu.vn cho Sinh viên). Không chấp nhận domain "@${domain}".`,
      };
    }

    const detectedRole: UserRole = domain === 'student.tdtu.edu.vn' ? 'SV' : 'GV';
    if (expectedRole && expectedRole !== detectedRole) {
      if (expectedRole === 'GV') {
        return {
          valid: false,
          normalizedEmail: normalized,
          detectedRole,
          domain,
          error:
            'Cổng đăng nhập không khớp: Bạn đang chọn cổng Giảng viên (@tdtu.edu.vn) nhưng lại sử dụng email Sinh viên (@student.tdtu.edu.vn). Vui lòng chuyển sang cổng Sinh viên!',
        };
      }
      return {
        valid: false,
        normalizedEmail: normalized,
        detectedRole,
        domain,
        error:
          'Cổng đăng nhập không khớp: Bạn đang chọn cổng Sinh viên (@student.tdtu.edu.vn) nhưng lại sử dụng email Giảng viên (@tdtu.edu.vn). Vui lòng chuyển sang cổng Giảng viên!',
      };
    }

    return {
      valid: true,
      normalizedEmail: normalized,
      detectedRole,
      domain,
    };
  }

  /**
   * Xác thực Firebase Authentication / Google SSO chỉ cho phép domain @tdtu.edu.vn (GV/Admin)
   * và @student.tdtu.edu.vn (Sinh viên), đồng thời đồng bộ Firebase UID & lịch sử đăng nhập
   */
  authenticateFirebase(payload: FirebaseAuthPayload): {
    success: boolean;
    error?: string;
    user?: UserProfile;
    token?: string;
    firebase?: {
      uid: string;
      provider: string;
      domain: string;
      projectId: string;
    };
  } {
    const safeStr = (val: unknown) => (typeof val === 'string' ? val.trim() : '');
    let resolvedEmail = safeStr(payload?.email).toLowerCase();
    let resolvedUid = safeStr(payload?.firebaseUid) || undefined;
    let resolvedName = safeStr(payload?.displayName || payload?.fullName || payload?.studentName);
    let resolvedPhoto = safeStr(payload?.photoUrl) || undefined;
    let resolvedProvider = safeStr(payload?.providerId) || 'google.com';

    // Nếu client gửi Firebase ID Token, ưu tiên giải mã & xác thực từ ID Token
    if (payload?.idToken !== undefined && payload?.idToken !== null && payload?.idToken !== '') {
      const parsedToken = this.parseFirebaseIdToken(String(payload.idToken));
      if (!parsedToken.valid) {
        return {
          success: false,
          error: parsedToken.error || 'Firebase ID Token không hợp lệ.',
        };
      }
      if (resolvedEmail && parsedToken.email && resolvedEmail !== parsedToken.email.toLowerCase()) {
        return {
          success: false,
          error: 'Email trong yêu cầu không khớp với email được ký trong Firebase ID Token.',
        };
      }
      resolvedEmail = parsedToken.email || resolvedEmail;
      resolvedUid = parsedToken.firebaseUid || resolvedUid;
      resolvedName = parsedToken.displayName || resolvedName;
      resolvedPhoto = parsedToken.photoUrl || resolvedPhoto;
      resolvedProvider = parsedToken.providerId || resolvedProvider;
    }

    const domainCheck = this.validateTdtuDomain(resolvedEmail, payload?.expectedRole);
    if (!domainCheck.valid) {
      return {
        success: false,
        error: domainCheck.error,
      };
    }

    const normalized = domainCheck.normalizedEmail;
    const existingUser = this.getUserByEmail(normalized);
    if (existingUser && existingUser.isActive === false) {
      return {
        success: false,
        error:
          'Từ chối đăng nhập: Tài khoản TDTU này đã bị khóa (Disabled) bởi Quản trị viên trên hệ thống Firebase. Vui lòng liên hệ Khoa CNTT - TDTU để mở khóa.',
      };
    }

    const nowIso = new Date().toISOString();

    // 1. Luồng Giảng viên / Admin (@tdtu.edu.vn)
    if (domainCheck.detectedRole === 'GV') {
      let user = existingUser;
      if (!user) {
        const prefix = normalized.split('@')[0];
        const defaultName = resolvedName || `Giảng viên (${prefix})`;
        const id = `usr-gv-${Date.now()}`;
        const uid = resolvedUid || `fb-tdtu-${id}`;
        this.sqlite.db
          .prepare(
            `INSERT INTO users (
              id, email, full_name, role, is_admin, student_id, department, granted_by,
              firebase_uid, auth_provider, is_active, last_login_at, login_count, photo_url, created_at
            ) VALUES (?, ?, ?, 'GV', 0, NULL, 'Khoa Công Nghệ Thông Tin - TDTU', NULL, ?, ?, 1, ?, 1, ?, ?)`
          )
          .run(id, normalized, defaultName, uid, resolvedProvider, nowIso, resolvedPhoto || null, nowIso);
        user = this.getUserByEmail(normalized)!;
      } else {
        const uid = resolvedUid || user.firebaseUid || `fb-tdtu-${user.id}`;
        this.sqlite.db
          .prepare(
            `UPDATE users SET
              full_name = COALESCE(?, full_name),
              firebase_uid = ?,
              auth_provider = ?,
              last_login_at = ?,
              login_count = COALESCE(login_count, 0) + 1,
              photo_url = COALESCE(?, photo_url)
            WHERE LOWER(email) = LOWER(?)`
          )
          .run(resolvedName || null, uid, resolvedProvider, nowIso, resolvedPhoto || null, normalized);
        user = this.getUserByEmail(normalized)!;
      }

      const token = this.signToken(user);
      return {
        success: true,
        user,
        token,
        firebase: {
          uid: user.firebaseUid!,
          provider: user.authProvider || 'google.com',
          domain: 'tdtu.edu.vn',
          projectId: FIREBASE_DEFAULT_CONFIG.projectId,
        },
      };
    }

    // 2. Luồng Sinh viên (@student.tdtu.edu.vn)
    const mssv = normalized.split('@')[0].toUpperCase();
    const stuRow = this.sqlite.db
      .prepare('SELECT name FROM students WHERE LOWER(mssv) = LOWER(?)')
      .get(mssv) as { name: string } | undefined;

    const studentFullName = stuRow?.name || resolvedName || `Sinh viên (${mssv})`;
    let user = existingUser;

    if (!user) {
      const id = `usr-sv-${mssv}`;
      const uid = resolvedUid || `fb-tdtu-${id}`;
      this.sqlite.db
        .prepare(
          `INSERT INTO users (
            id, email, full_name, role, is_admin, student_id, department, granted_by,
            firebase_uid, auth_provider, is_active, last_login_at, login_count, photo_url, created_at
          ) VALUES (?, ?, ?, 'SV', 0, ?, 'Khoa Công Nghệ Thông Tin - TDTU', NULL, ?, ?, 1, ?, 1, ?, ?)`
        )
        .run(id, normalized, studentFullName, mssv, uid, resolvedProvider, nowIso, resolvedPhoto || null, nowIso);
      user = this.getUserByEmail(normalized)!;
    } else {
      const uid = resolvedUid || user.firebaseUid || `fb-tdtu-${user.id}`;
      const updatedName = stuRow?.name || resolvedName || user.fullName;
      this.sqlite.db
        .prepare(
          `UPDATE users SET
            full_name = ?,
            student_id = ?,
            firebase_uid = ?,
            auth_provider = ?,
            last_login_at = ?,
            login_count = COALESCE(login_count, 0) + 1,
            photo_url = COALESCE(?, photo_url)
          WHERE LOWER(email) = LOWER(?)`
        )
        .run(updatedName, mssv, uid, resolvedProvider, nowIso, resolvedPhoto || null, normalized);
      user = this.getUserByEmail(normalized)!;
    }

    const token = this.signToken(user);
    return {
      success: true,
      user,
      token,
      firebase: {
        uid: user.firebaseUid!,
        provider: user.authProvider || 'google.com',
        domain: 'student.tdtu.edu.vn',
        projectId: FIREBASE_DEFAULT_CONFIG.projectId,
      },
    };
  }

  /**
   * Phương thức tương thích ngược cho xác thực Google SSO qua email
   */
  authenticateGoogleEmail(
    email: string,
    customName?: string,
    options?: Partial<FirebaseAuthPayload>
  ): {
    success: boolean;
    error?: string;
    user?: UserProfile;
    token?: string;
    firebase?: {
      uid: string;
      provider: string;
      domain: string;
      projectId: string;
    };
  } {
    return this.authenticateFirebase({
      ...options,
      email,
      displayName: customName || options?.displayName || options?.fullName || options?.studentName,
    });
  }

  getDefaultProfile(role: UserRole, mssv?: string): UserProfile {
    if (role === 'GV') {
      const admin = this.getUserByEmail('nguyenvana@tdtu.edu.vn');
      if (admin && admin.isActive !== false && admin.isAdmin) return admin;
      const anyAdmin = this.sqlite.db
        .prepare("SELECT * FROM users WHERE role = 'GV' AND is_admin = 1 AND is_active = 1 LIMIT 1")
        .get() as any;
      if (anyAdmin) return this.mapRowToUserProfile(anyAdmin);
    }

    const targetMssv = (mssv || '51900839').trim().toUpperCase();
    const svEmail = `${targetMssv.toLowerCase()}@student.tdtu.edu.vn`;
    const authRes = this.authenticateGoogleEmail(svEmail);
    if (authRes.success && authRes.user) {
      return authRes.user;
    }

    return {
      id: `usr-sv-${targetMssv}`,
      email: svEmail,
      fullName: 'Võ Duy Trí',
      role: 'SV',
      isAdmin: false,
      subRole: 'STUDENT',
      studentId: targetMssv,
      department: 'Khoa Công Nghệ Thông Tin - TDTU',
      firebaseUid: `fb-tdtu-usr-sv-${targetMssv}`,
      authProvider: 'google.com',
      isActive: true,
      permissions: ROLE_PERMISSIONS.STUDENT,
    };
  }

  /**
   * Thống kê tổng quan tài khoản Firebase
   */
  getUsersSummary(): FirebaseUsersSummary {
    const rows = this.sqlite.db.prepare('SELECT role, is_admin, is_active, firebase_uid FROM users').all() as any[];
    let totalLecturers = 0;
    let totalAdmins = 0;
    let totalStudents = 0;
    let activeUsers = 0;
    let lockedUsers = 0;
    let firebaseLinkedUsers = 0;

    for (const r of rows) {
      if (r.role === 'GV') {
        totalLecturers++;
        if (r.is_admin) totalAdmins++;
      } else {
        totalStudents++;
      }
      if (r.is_active === 0) {
        lockedUsers++;
      } else {
        activeUsers++;
      }
      if (r.firebase_uid) {
        firebaseLinkedUsers++;
      }
    }

    return {
      totalUsers: rows.length,
      totalLecturers,
      totalAdmins,
      totalStudents,
      activeUsers,
      lockedUsers,
      firebaseLinkedUsers,
    };
  }

  /**
   * Trạng thái cấu hình Firebase Authentication của hệ thống
   */
  getFirebaseConfigStatus() {
    return {
      ...FIREBASE_DEFAULT_CONFIG,
      enabled: true,
      summary: this.getUsersSummary(),
    };
  }

  /**
   * Danh sách toàn bộ tài khoản Firebase (Giảng viên & Sinh viên) có bộ lọc tìm kiếm
   */
  listFirebaseUsers(filter: { search?: string; role?: string; status?: string } = {}): {
    items: UserProfile[];
    summary: FirebaseUsersSummary;
  } {
    const rows = this.sqlite.db
      .prepare('SELECT * FROM users ORDER BY is_admin DESC, role ASC, email ASC')
      .all() as any[];
    let items = rows.map((r) => this.mapRowToUserProfile(r));

    if (filter.role) {
      const roleFilter = filter.role.trim().toUpperCase();
      if (roleFilter === 'ADMIN') {
        items = items.filter((u) => u.role === 'GV' && u.isAdmin);
      } else if (roleFilter === 'GV' || roleFilter === 'LECTURER') {
        items = items.filter((u) => u.role === 'GV');
      } else if (roleFilter === 'SV' || roleFilter === 'STUDENT') {
        items = items.filter((u) => u.role === 'SV');
      }
    }

    if (filter.status) {
      const st = filter.status.trim().toLowerCase();
      if (st === 'active') {
        items = items.filter((u) => u.isActive !== false);
      } else if (st === 'locked' || st === 'disabled') {
        items = items.filter((u) => u.isActive === false);
      }
    }

    if (filter.search) {
      const q = filter.search.trim().toLowerCase();
      items = items.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          (u.studentId && u.studentId.toLowerCase().includes(q)) ||
          (u.firebaseUid && u.firebaseUid.toLowerCase().includes(q))
      );
    }

    return {
      items,
      summary: this.getUsersSummary(),
    };
  }

  /**
   * Admin tạo mới hoặc đồng bộ hồ sơ tài khoản Firebase (@tdtu.edu.vn / @student.tdtu.edu.vn)
   */
  upsertFirebaseUser(
    actor: UserProfile,
    payload: {
      email: string;
      fullName?: string;
      isAdmin?: boolean;
      isActive?: boolean;
      firebaseUid?: string;
    }
  ): {
    success: boolean;
    message: string;
    user: UserProfile;
    summary: FirebaseUsersSummary;
  } {
    if (actor.role !== 'GV' || !actor.isAdmin) {
      throw new AuthError(
        'Từ chối phân quyền (403): Chỉ Admin toàn quyền mới được phép khởi tạo hoặc đồng bộ tài khoản Firebase.',
        403
      );
    }

    const domainCheck = this.validateTdtuDomain(payload.email);
    if (!domainCheck.valid) {
      throw new AuthError(domainCheck.error || 'Email không thuộc domain TDTU.', 400);
    }

    const normalized = domainCheck.normalizedEmail;
    const role: UserRole = domainCheck.detectedRole!;
    if (role === 'SV' && payload.isAdmin) {
      throw new AuthError(
        'Không thể cấp quyền Admin cho tài khoản Sinh viên (@student.tdtu.edu.vn).',
        400
      );
    }

    const existing = this.getUserByEmail(normalized);
    const nowIso = new Date().toISOString();
    const isActiveInt = payload.isActive === false ? 0 : 1;
    const isAdminInt = role === 'GV' && payload.isAdmin ? 1 : 0;

    if (!existing) {
      const prefix = normalized.split('@')[0];
      const mssv = role === 'SV' ? prefix.toUpperCase() : null;
      const id = role === 'SV' ? `usr-sv-${mssv}` : `usr-gv-${Date.now()}`;
      const uid = payload.firebaseUid?.trim() || `fb-tdtu-${id}`;
      const defaultName =
        payload.fullName?.trim() || (role === 'GV' ? `GV. ${prefix}` : `Sinh viên (${mssv})`);

      this.sqlite.db
        .prepare(
          `INSERT INTO users (
            id, email, full_name, role, is_admin, student_id, department, granted_by,
            firebase_uid, auth_provider, is_active, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'Khoa Công Nghệ Thông Tin - TDTU', ?, ?, 'google.com', ?, ?)`
        )
        .run(
          id,
          normalized,
          defaultName,
          role,
          isAdminInt,
          mssv,
          isAdminInt ? actor.email : null,
          uid,
          isActiveInt,
          nowIso
        );
    } else {
      const nextIsAdmin = payload.isAdmin !== undefined ? isAdminInt === 1 : Boolean(existing.isAdmin);
      const nextIsActive = payload.isActive !== undefined ? isActiveInt === 1 : existing.isActive !== false;

      if (!nextIsActive && existing.email.toLowerCase() === actor.email.toLowerCase()) {
        throw new AuthError('Bạn không thể tự khóa tài khoản Admin đang đăng nhập của chính mình.', 400);
      }

      if (existing.isAdmin && existing.isActive !== false && (!nextIsAdmin || !nextIsActive)) {
        const activeAdmins = this.sqlite.db
          .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'GV' AND is_admin = 1 AND is_active = 1")
          .get() as { cnt: number };
        if (activeAdmins.cnt <= 1) {
          throw new AuthError(
            'Không thể thu hồi quyền hoặc khóa tài khoản Admin đang hoạt động duy nhất trong hệ thống!',
            400
          );
        }
      }

      this.sqlite.db
        .prepare(
          `UPDATE users SET
            full_name = COALESCE(?, full_name),
            is_admin = ?,
            is_active = ?,
            firebase_uid = COALESCE(?, firebase_uid),
            granted_by = CASE WHEN ? = 1 THEN COALESCE(granted_by, ?) ELSE NULL END
          WHERE LOWER(email) = LOWER(?)`
        )
        .run(
          typeof payload.fullName === 'string' && payload.fullName.trim() ? payload.fullName.trim() : null,
          nextIsAdmin ? 1 : 0,
          nextIsActive ? 1 : 0,
          typeof payload.firebaseUid === 'string' && payload.firebaseUid.trim() ? payload.firebaseUid.trim() : null,
          nextIsAdmin ? 1 : 0,
          actor.email,
          normalized
        );
    }

    const user = this.getUserByEmail(normalized)!;
    return {
      success: true,
      message: existing
        ? `Đã cập nhật và đồng bộ tài khoản Firebase cho ${user.fullName} (${user.email})!`
        : `Đã khởi tạo và liên kết tài khoản Firebase mới cho ${user.fullName} (${user.email})!`,
      user,
      summary: this.getUsersSummary(),
    };
  }

  /**
   * Admin khóa (Disable) hoặc mở khóa (Enable) tài khoản trên hệ thống Firebase
   */
  setAccountActiveStatus(
    actor: UserProfile,
    payload: { targetEmail: string; isActive: boolean }
  ): {
    success: boolean;
    message: string;
    user: UserProfile;
    summary: FirebaseUsersSummary;
  } {
    if (actor.role !== 'GV' || !actor.isAdmin) {
      throw new AuthError(
        'Từ chối phân quyền (403): Chỉ tài khoản Admin toàn quyền mới được phép khóa hoặc mở khóa tài khoản Firebase.',
        403
      );
    }

    const targetEmail = (typeof payload.targetEmail === 'string' ? payload.targetEmail : '').trim().toLowerCase();
    const target = this.getUserByEmail(targetEmail);
    if (!target) {
      throw new AuthError(`Không tìm thấy tài khoản Firebase với email: ${targetEmail}`, 404);
    }

    if (!payload.isActive && target.email.toLowerCase() === actor.email.toLowerCase()) {
      throw new AuthError('Không thể tự khóa tài khoản Admin đang đăng nhập của chính bạn!', 400);
    }

    if (!payload.isActive && target.isAdmin && target.isActive !== false) {
      const activeAdmins = this.sqlite.db
        .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'GV' AND is_admin = 1 AND is_active = 1")
        .get() as { cnt: number };
      if (activeAdmins.cnt <= 1) {
        throw new AuthError(
          'Không thể khóa tài khoản Admin đang hoạt động duy nhất trong hệ thống!',
          400
        );
      }
    }

    this.sqlite.db
      .prepare('UPDATE users SET is_active = ? WHERE LOWER(email) = LOWER(?)')
      .run(payload.isActive ? 1 : 0, targetEmail);

    const updated = this.getUserByEmail(targetEmail)!;
    return {
      success: true,
      message: payload.isActive
        ? `Đã mở khóa (Enable) tài khoản Firebase ${updated.fullName} (${updated.email})!`
        : `Đã khóa (Disable) tài khoản Firebase ${updated.fullName} (${updated.email}). Người dùng này sẽ không thể đăng nhập.`,
      user: updated,
      summary: this.getUsersSummary(),
    };
  }

  /**
   * Danh sách tất cả Giảng viên (@tdtu.edu.vn) cùng trạng thái quyền Admin
   */
  listLecturers(): UserProfile[] {
    const rows = this.sqlite.db
      .prepare("SELECT * FROM users WHERE role = 'GV' ORDER BY is_admin DESC, created_at ASC")
      .all() as any[];
    return rows.map((r) => this.mapRowToUserProfile(r));
  }

  /**
   * Tài khoản Admin toàn quyền thêm hoặc thu hồi quyền Admin đối với Giảng viên khác (@tdtu.edu.vn)
   */
  grantOrRevokeAdmin(
    actor: UserProfile,
    payload: { targetEmail: string; fullName?: string; isAdmin: boolean }
  ): {
    success: boolean;
    message: string;
    targetUser: UserProfile;
    lecturers: UserProfile[];
  } {
    if (actor.role !== 'GV' || !actor.isAdmin) {
      throw new AuthError(
        'Từ chối phân quyền (403): Chỉ tài khoản Giảng viên có quyền Admin toàn quyền mới được phép thêm hoặc thu hồi quyền Admin của giảng viên khác.',
        403
      );
    }

    const domainCheck = this.validateTdtuDomain(payload.targetEmail, 'GV');
    if (!domainCheck.valid) {
      throw new AuthError(
        'Email nhận quyền Admin bắt buộc phải là email Giảng viên hợp lệ (@tdtu.edu.vn). Không thể cấp quyền Admin cho email Sinh viên (@student.tdtu.edu.vn) hoặc email sai định dạng.',
        400
      );
    }
    const targetEmail = domainCheck.normalizedEmail;

    let target = this.getUserByEmail(targetEmail);
    const nowIso = new Date().toISOString();

    if (!target) {
      const prefix = targetEmail.split('@')[0];
      const name = (typeof payload.fullName === 'string' && payload.fullName.trim()) || `GV. ${prefix}`;
      const id = `usr-gv-${Date.now()}`;
      this.sqlite.db
        .prepare(
          `INSERT INTO users (
            id, email, full_name, role, is_admin, student_id, department, granted_by,
            firebase_uid, auth_provider, is_active, created_at
          )
           VALUES (?, ?, ?, 'GV', ?, NULL, 'Khoa Công Nghệ Thông Tin - TDTU', ?, ?, 'google.com', 1, ?)`
        )
        .run(id, targetEmail, name, payload.isAdmin ? 1 : 0, actor.email, `fb-tdtu-${id}`, nowIso);
    } else {
      // Không cho phép tự gỡ quyền nếu là Admin đang hoạt động duy nhất còn lại
      if (!payload.isAdmin && target.isAdmin && target.isActive !== false) {
        const adminCountRow = this.sqlite.db
          .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'GV' AND is_admin = 1 AND is_active = 1")
          .get() as { cnt: number };
        if (adminCountRow.cnt <= 1) {
          throw new AuthError(
            'Không thể thu hồi quyền của Admin đang hoạt động duy nhất trong hệ thống. Vui lòng thêm hoặc chuyển quyền Admin cho một Giảng viên khác trước!',
            400
          );
        }
      }

      this.sqlite.db
        .prepare(
          `UPDATE users SET
             is_admin = ?,
             full_name = COALESCE(?, full_name),
             granted_by = ?
           WHERE LOWER(email) = LOWER(?)`
        )
        .run(
          payload.isAdmin ? 1 : 0,
          typeof payload.fullName === 'string' && payload.fullName.trim() ? payload.fullName.trim() : null,
          payload.isAdmin ? actor.email : null,
          targetEmail
        );
    }

    target = this.getUserByEmail(targetEmail)!;
    return {
      success: true,
      message: payload.isAdmin
        ? `Đã cấp quyền Admin toàn quyền cho Giảng viên ${target.fullName} (${target.email})!`
        : `Đã thu hồi quyền Admin của Giảng viên ${target.fullName} (${target.email}), chuyển về quyền Giảng viên tiêu chuẩn.`,
      targetUser: target,
      lecturers: this.listLecturers(),
    };
  }

  /**
   * Chuyển nhượng quyền Admin toàn quyền từ Admin hiện tại sang một Giảng viên khác (@tdtu.edu.vn)
   */
  transferAdminOwnership(
    actor: UserProfile,
    payload: { targetEmail: string; fullName?: string }
  ): {
    success: boolean;
    message: string;
    previousAdmin: UserProfile;
    newAdmin: UserProfile;
    newActorToken: string;
    lecturers: UserProfile[];
  } {
    if (actor.role !== 'GV' || !actor.isAdmin) {
      throw new AuthError(
        'Từ chối phân quyền (403): Chỉ tài khoản Admin toàn quyền mới có thể chuyển nhượng quyền Admin.',
        403
      );
    }

    const domainCheck = this.validateTdtuDomain(payload.targetEmail, 'GV');
    if (!domainCheck.valid) {
      throw new AuthError(
        'Chỉ có thể chuyển quyền Admin cho tài khoản Giảng viên hợp lệ có đuôi @tdtu.edu.vn!',
        400
      );
    }
    const targetEmail = domainCheck.normalizedEmail;

    if (targetEmail === actor.email.toLowerCase()) {
      throw new AuthError('Bạn đang giữ quyền Admin trên chính tài khoản này.', 400);
    }

    this.sqlite.db.exec('BEGIN TRANSACTION');
    try {
      const existingTarget = this.getUserByEmail(targetEmail);
      const nowIso = new Date().toISOString();
      if (!existingTarget) {
        const prefix = targetEmail.split('@')[0];
        const name = payload.fullName?.trim() || `GV. ${prefix}`;
        const id = `usr-gv-${Date.now()}`;
        this.sqlite.db
          .prepare(
            `INSERT INTO users (
              id, email, full_name, role, is_admin, student_id, department, granted_by,
              firebase_uid, auth_provider, is_active, created_at
            )
             VALUES (?, ?, ?, 'GV', 1, NULL, 'Khoa Công Nghệ Thông Tin - TDTU', ?, ?, 'google.com', 1, ?)`
          )
          .run(id, targetEmail, name, actor.email, `fb-tdtu-${id}`, nowIso);
      } else {
        this.sqlite.db
          .prepare('UPDATE users SET is_admin = 1, is_active = 1, granted_by = ? WHERE LOWER(email) = LOWER(?)')
          .run(actor.email, targetEmail);
      }

      // Chuyển tài khoản hiện tại về Giảng viên thường
      this.sqlite.db
        .prepare('UPDATE users SET is_admin = 0 WHERE LOWER(email) = LOWER(?)')
        .run(actor.email);

      this.sqlite.db.exec('COMMIT');
    } catch (err) {
      this.sqlite.db.exec('ROLLBACK');
      throw err;
    }

    const previousAdmin = this.getUserByEmail(actor.email)!;
    const newAdmin = this.getUserByEmail(targetEmail)!;

    return {
      success: true,
      message: `Đã chuyển nhượng quyền Admin toàn quyền từ ${previousAdmin.email} sang Giảng viên ${newAdmin.fullName} (${newAdmin.email})!`,
      previousAdmin,
      newAdmin,
      newActorToken: this.signToken(previousAdmin),
      lecturers: this.listLecturers(),
    };
  }
}

